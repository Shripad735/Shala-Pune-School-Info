import { loadRecords, type Row } from "./csv";
import {
  BUILDING_LABELS,
  CATEGORY_LABELS,
  levelOf,
  MANAGEMENT_LABELS,
  managementGroupOf,
  normalizeMedium,
  SPECIAL_EDUCATOR_LABELS,
  stageOf,
} from "./dictionaries";
import { distanceKm, displayName, slugify, titleCaseArea } from "./format";
import { localityCoords } from "./geo";
import type { Area, Directory, Gender, Essential, GradeRow, Level, School, Zone } from "./types";

const num = (value: string | undefined): number => {
  const n = Number.parseInt((value ?? "").replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
};

const isYes = (value: string | undefined): boolean =>
  (value ?? "").trim().toLowerCase().startsWith("1");

const pick = (row: Row, keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== "") return value;
  }
  return "";
};

function gradeLabel(grade: number): string {
  return grade === 0 ? "Pre-primary" : `Std ${grade}`;
}

function buildGrades(enrolRow: Row): GradeRow[] {
  const out: GradeRow[] = [];
  for (let grade = 0; grade <= 12; grade += 1) {
    const boys = num(enrolRow[`C${grade}B`]);
    const girls = num(enrolRow[`C${grade}G`]);
    if (boys === 0 && girls === 0 && grade === 0) continue;
    out.push({ grade, label: gradeLabel(grade), boys, girls, total: boys + girls });
  }
  return out;
}

function essentialsOf(f: School["facilities"]): Essential[] {
  const boysOk = f.toiletsBoys.functional > 0;
  const girlsOk = f.toiletsGirls.functional > 0;
  return [
    {
      key: "toilets",
      label: "Working toilets for girls and boys",
      ok: boysOk && girlsOk,
      note: !boysOk && !girlsOk ? "Neither functional" : !girlsOk ? "Girls' toilet not working" : !boysOk ? "Boys' toilet not working" : undefined,
    },
    { key: "electricity", label: "Electricity connection", ok: f.electricity },
    { key: "water", label: "Drinking water on campus", ok: true },
    { key: "library", label: "Library", ok: f.library },
    { key: "playground", label: "Playground", ok: f.playground },
    { key: "ramp", label: "Ramp for wheelchair access", ok: f.ramp },
    { key: "boundary", label: "Pucca boundary wall", ok: f.boundaryWall.toLowerCase().includes("pucca") },
    { key: "hmroom", label: "Separate head teacher's room", ok: f.separateHmRoom },
  ];
}

function buildSchool(master: Row, enrol: Row | undefined, contact: Row | undefined): School {
  const id = master["UdiseCode"];
  const name = displayName(master["SchName"] || contact?.["School Name"] || id);
  const areaRaw = master["VillageName"] || "Unspecified";

  const mgmtCode = master["SchMgmt"] || "";
  const managementRaw =
    contact?.["Mnagement"]?.trim() || MANAGEMENT_LABELS[mgmtCode] || "Not recorded";
  const management =
    managementRaw === "MNC" ? "Municipal Corporation (PMC)" : managementRaw;

  const catCode = master["SchCat"] || "";
  const category =
    (contact?.["Category of school"] ?? "").trim() ||
    CATEGORY_LABELS[catCode] ||
    "Not recorded";

  const lowClass = num(contact?.["Low class"]) || 1;
  const highClass = num(contact?.["High class"]) || 12;
  const level: Level = levelOf(highClass);

  const mediumRaw = contact?.["Medium"] ?? "";
  const medium = normalizeMedium(mediumRaw);

  const grades = enrol ? buildGrades(enrol) : [];
  const boys = grades.reduce((sum, g) => sum + g.boys, 0);
  const girls = grades.reduce((sum, g) => sum + g.girls, 0);
  const prePrimary = grades.find((g) => g.grade === 0)?.total ?? 0;
  const total = boys + girls;

  const teachers = num(enrol?.["teachers"]) || num(contact?.["Teacher in Position"]);
  const classrooms = num(enrol?.["classrooms"]);

  const girlsToiletTotal = num(master["Toilet_ExclCWSN_G_Tot"]);
  const girlsToiletFunc = num(master["Toilet_ExclCWSN_G_Func"]);
  const boysToiletTotal = num(master["Toilet_ExclCWSN_B_Tot"]);
  const boysToiletFunc = num(master["Toilet_ExclCWSN_B_Func"]);

  const goodCond = num(master["Pucca_GudCond"]);
  const minorRep = num(master["Pucca_MinRep"]);
  const majorRep = num(master["Pucca_MajRep"]);
  const condTotal = goodCond + minorRep + majorRep;

  const facilities: School["facilities"] = {
    buildingOwnership: BUILDING_LABELS[master["BldStatus"]] || "Not recorded",
    buildingBlocks: num(master["No_Bldg_Blks_Sch_Tot"]),
    boundaryWall: master["BoundWall_Type"] || "Not recorded",
    classroomsInUse: num(master["Clsrm_UsedforInstPurp"]),
    otherRooms: num(master["OtherRooms"]),
    classroomConditionPct: condTotal > 0 ? Math.round((goodCond / condTotal) * 100) : null,
    separateHmRoom: isYes(master["HT/Princ_SepRoom_Avail"]),
    toiletsBoys: { total: boysToiletTotal, functional: boysToiletFunc },
    toiletsGirls: { total: girlsToiletTotal, functional: girlsToiletFunc },
    cwsnToilets:
      num(master["Toilet_CWSN_B_Func"]) + num(master["Toilet_CWSN_G_Func"]),
    urinals: num(master["Urnl_B_Tot"]) + num(master["Urnl_G_Tot"]),
    handwash: isYes(master["HandwashFac_Toilet/Urnl"]),
    waterPurifier: isYes(master["WaterPurf/RO"]),
    waterQualityTested: isYes(master["WaterQltyTesting"]),
    rainWaterHarvesting: isYes(master["RainWaterHarv"]),
    electricity: isYes(master["Elect_Con"]),
    solar: isYes(master["SolarPnl"]),
    library: isYes(master["Library"]),
    libraryBooks: num(master["Lib_Books"]),
    bookBank: isYes(master["BookBank"]),
    readingCorner: isYes(master["ReadingCorner"]),
    playground: isYes(master["Playgrnd_Fac"]),
    ramp: isYes(master["RampAvail"]),
    handrails: isYes(master["Avail_Hand-Rails_Ramp"]),
    specialEducator: SPECIAL_EDUCATOR_LABELS[master["Spcl_Educator_Avail"]] || "Not recorded",
    kitchenGarden: isYes(master["Kitc_Gard_Avail"]),
    medicalCheckup: isYes(master["MdlCheckup _LstYr"]),
    furniture: num(master["StudNo_Fur"]),
  };

  const essentials = essentialsOf(facilities);

  const phones = [
    contact?.["Mobile1"],
    contact?.["Phone1"],
    contact?.["Mobile2"],
    contact?.["Phone2"],
  ]
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length >= 6);
  const uniquePhones = Array.from(new Set(phones));

  return {
    id,
    name,
    zone: master["BlockName"] || "Unspecified",
    cluster: master["ClusterName"] || "",
    area: areaRaw,
    areaLabel: titleCaseArea(areaRaw),
    areaSlug: "",
    areaCode: master["Village Code"] || master["VillageCode"] || "",
    location: (master["SchLocation"] || "").includes("Rural") ? "Rural" : "Urban",
    management,
    managementGroup: managementGroupOf(management),
    category,
    stage: stageOf(lowClass, highClass),
    level,
    lowClass,
    highClass,
    medium,
    media: [medium],
    gender: (contact?.["Category of school"] ?? "").includes("Girls")
      ? ("Girls" as Gender)
      : (enrol?.["School Type"] ?? "").toLowerCase().includes("girls")
        ? ("Girls" as Gender)
        : (enrol?.["School Type"] ?? "").toLowerCase().includes("boys")
          ? ("Boys" as Gender)
          : ("Co-educational" as Gender),
    contact: {
      phone: uniquePhones,
      email: (contact?.["Email"] ?? "").trim(),
      website: (contact?.["Website"] ?? "").trim(),
    },
    staff: {
      total: teachers,
      male: 0,
      female: 0,
      inPosition: num(contact?.["Teacher in Position"]),
      sanction: num(contact?.["Teacher Sanction"]),
      para: num(contact?.["Para teacher"]),
    },
    enrolment: { total, boys, girls, prePrimary, byGrade: grades },
    classrooms,
    ptr: teachers > 0 && total > 0 ? total / teachers : null,
    facilities,
    essentials,
    essentialCount: essentials.filter((e) => e.ok).length,
    coordinates: null,
  };
}

function areaSlugFor(name: string, used: Set<string>): string {
  const base = slugify(name) || "area";
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let i = 2;
  while (used.has(`${base}-${i}`)) i += 1;
  const next = `${base}-${i}`;
  used.add(next);
  return next;
}

let directory: Directory | null = null;

/** Build the whole directory once per server process from the CSV sources. */
export function getDirectory(): Directory {
  if (directory) return directory;

  const master = loadRecords("schools-master.csv");
  const enrolment = loadRecords("schools-enrolment.csv");
  const contacts = loadRecords("schools-contacts.csv");

  const enrolById = new Map(enrolment.map((r) => [r["UdiseCode"], r]));
  const contactById = new Map(contacts.map((r) => [r["U-dise Code"], r]));

  const schools = master
    .map((row) => buildSchool(row, enrolById.get(row["UdiseCode"]), contactById.get(row["UdiseCode"])))
    .filter((s) => s.id);

  // Attach coordinates from the geocoded localities. Areas we could not
  // resolve stay null on purpose — better a gap than a wrong pin.
  const coords = localityCoords();
  for (const school of schools) {
    const hit = coords[school.area];
    if (hit && typeof hit.lat === "number" && typeof hit.lon === "number") {
      school.coordinates = { lat: hit.lat, lon: hit.lon };
    }
  }

  const byId = new Map(schools.map((s) => [s.id, s]));

  // Zones
  const zoneNames = Array.from(new Set(schools.map((s) => s.zone))).sort();

  // Areas
  const usedSlugs = new Set<string>();
  const areaMap = new Map<string, Area>();
  for (const school of schools) {
    const key = school.area;
    let area = areaMap.get(key);
    if (!area) {
      area = {
        slug: areaSlugFor(key, usedSlugs),
        name: titleCaseArea(key),
        zone: school.zone,
        count: 0,
        students: 0,
        teachers: 0,
        coordinates: school.coordinates,
        schoolIds: [],
      };
      areaMap.set(key, area);
    }
    area.count += 1;
    area.students += school.enrolment.total;
    area.teachers += school.staff.total;
    area.schoolIds.push(school.id);
    school.areaSlug = area.slug;
  }

  const areas = Array.from(areaMap.values()).sort((a, b) => b.count - a.count);
  const areasBySlug = new Map(areas.map((a) => [a.slug, a]));

  const zones: Zone[] = zoneNames.map((name) => {
    const inZone = schools.filter((s) => s.zone === name);
    return {
      slug: slugify(name),
      name,
      count: inZone.length,
      students: inZone.reduce((a, s) => a + s.enrolment.total, 0),
      areas: new Set(inZone.map((s) => s.area)).size,
    };
  });

  const withPtr = schools.filter((s) => s.ptr !== null);
  const totals = {
    schools: schools.length,
    students: schools.reduce((a, s) => a + s.enrolment.total, 0),
    boys: schools.reduce((a, s) => a + s.enrolment.boys, 0),
    girls: schools.reduce((a, s) => a + s.enrolment.girls, 0),
    teachers: schools.reduce((a, s) => a + s.staff.total, 0),
    areas: areas.length,
    withCoordinates: schools.filter((s) => s.coordinates).length,
    averagePtr: withPtr.length
      ? Math.round(withPtr.reduce((a, s) => a + (s.ptr ?? 0), 0) / withPtr.length)
      : 0,
  };

  const count = <T extends string>(values: T[]): Map<T, number> => {
    const map = new Map<T, number>();
    for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
    return map;
  };

  const levelCounts = count(schools.map((s) => s.level));
  const mediumCounts = count(schools.map((s) => s.medium));
  const mgmtCounts = count(schools.map((s) => s.managementGroup));
  const genderCounts = count(schools.map((s) => s.gender));

  const levels: Level[] = ["Primary", "Upper Primary", "Secondary", "Higher Secondary"];
  const facets = {
    levels: levels.map((label) => ({ label, count: levelCounts.get(label) ?? 0 })),
    media: Array.from(mediumCounts.entries())
      .map(([label, c]) => ({ label, count: c }))
      .sort((a, b) => b.count - a.count),
    managementGroups: Array.from(mgmtCounts.entries())
      .map(([label, c]) => ({ label, count: c }))
      .sort((a, b) => b.count - a.count),
    genders: (["Co-educational", "Girls", "Boys"] as Gender[]).map((label) => ({
      label,
      count: genderCounts.get(label) ?? 0,
    })),
  };

  directory = { schools, byId, areas, areasBySlug, zones, totals, facets };
  return directory;
}

export interface SchoolFilters {
  q?: string;
  zone?: string;
  area?: string;
  level?: string;
  medium?: string;
  management?: string;
  gender?: string;
  library?: string;
  playground?: string;
  ramp?: string;
  solar?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 24;

export function filterSchools(filters: SchoolFilters) {
  const { schools } = getDirectory();
  const q = (filters.q ?? "").trim().toLowerCase();
  let list = schools.filter((school) => {
    if (q) {
      const haystack = `${school.name} ${school.area} ${school.zone} ${school.cluster} ${school.id}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.zone && school.zone !== filters.zone) return false;
    if (filters.area && school.area !== filters.area) return false;
    if (filters.level && school.level !== filters.level) return false;
    if (filters.medium && school.medium !== filters.medium) return false;
    if (filters.management && school.managementGroup !== filters.management) return false;
    if (filters.gender && school.gender !== filters.gender) return false;
    if (filters.library === "1" && !school.facilities.library) return false;
    if (filters.playground === "1" && !school.facilities.playground) return false;
    if (filters.ramp === "1" && !school.facilities.ramp) return false;
    if (filters.solar === "1" && !school.facilities.solar) return false;
    return true;
  });

  const sort = filters.sort ?? "name";
  list = list.sort((a, b) => {
    switch (sort) {
      case "students":
        return b.enrolment.total - a.enrolment.total;
      case "students-asc":
        return a.enrolment.total - b.enrolment.total;
      case "ptr":
        return (a.ptr ?? 999) - (b.ptr ?? 999);
      case "facilities":
        return b.essentialCount - a.essentialCount || a.name.localeCompare(b.name);
      case "area":
        return a.area.localeCompare(b.area) || a.name.localeCompare(b.name);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const page = Math.max(1, Number.parseInt(filters.page ?? "1", 10) || 1);
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return { schools: slice, total, pages, page: current, pageSize: PAGE_SIZE };
}

export function nearbySchools(
  origin: { lat: number; lon: number },
  limit = 12,
): { school: School; distance: number }[] {
  const { schools, areas } = getDirectory();

  // Localities are geocoded, not individual schools, so every school in an area
  // shares one distance. Listing them by distance alone would fill the page with
  // a dozen identical distances from one locality, so interleave one school per
  // locality — nearest locality first.
  const ranked = areas
    .filter((area) => area.coordinates)
    .map((area) => ({ area, distance: distanceKm(origin, area.coordinates!) }))
    .sort((a, b) => a.distance - b.distance);

  const buckets = ranked.map(({ area, distance }) => ({
    distance,
    queue: area.schoolIds
      .map((id) => schools.find((s) => s.id === id))
      .filter((s): s is School => Boolean(s))
      .sort((a, b) => b.enrolment.total - a.enrolment.total),
  }));

  const out: { school: School; distance: number }[] = [];
  let round = 0;
  while (out.length < limit) {
    let added = 0;
    for (const bucket of buckets) {
      if (out.length >= limit) break;
      const school = bucket.queue[round];
      if (!school) continue;
      out.push({ school, distance: bucket.distance });
      added += 1;
    }
    if (added === 0) break;
    round += 1;
  }
  return out;
}

export function nearbyAreas(
  origin: { lat: number; lon: number },
  limit = 12,
): { area: Area; distance: number }[] {
  const { areas } = getDirectory();
  return areas
    .filter((a) => a.coordinates)
    .map((area) => ({ area, distance: distanceKm(origin, area.coordinates!) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

export function schoolsInArea(slug: string): { area: Area | null; schools: School[] } {
  const { areasBySlug, byId } = getDirectory();
  const area = areasBySlug.get(slug) ?? null;
  if (!area) return { area: null, schools: [] };
  const schools = area.schoolIds
    .map((id) => byId.get(id))
    .filter((s): s is School => Boolean(s))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { area, schools };
}

export function getSchool(id: string): School | null {
  return getDirectory().byId.get(id) ?? null;
}

export function getArea(slug: string): Area | null {
  return getDirectory().areasBySlug.get(slug) ?? null;
}

export function relatedSchools(school: School, limit = 4): School[] {
  const { schools } = getDirectory();
  const sameArea = schools.filter((s) => s.area === school.area && s.id !== school.id);
  if (sameArea.length >= limit) return sameArea.slice(0, limit);
  const sameZone = schools.filter(
    (s) => s.zone === school.zone && s.area !== school.area && s.id !== school.id,
  );
  return [...sameArea, ...sameZone].slice(0, limit);
}

export function searchSchools(term: string, limit = 8): School[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  const { schools } = getDirectory();
  const scored = schools
    .map((school) => {
      const name = school.name.toLowerCase();
      let score = 0;
      if (name.startsWith(q)) score = 100;
      else if (name.includes(q)) score = 70;
      else if (school.area.toLowerCase().includes(q)) score = 50;
      else if (`${school.zone} ${school.cluster}`.toLowerCase().includes(q)) score = 30;
      return { school, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name));
  return scored.slice(0, limit).map((s) => s.school);
}
