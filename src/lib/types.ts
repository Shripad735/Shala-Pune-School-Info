/** Domain types for the Pune school directory. */

export type Level = "Primary" | "Upper Primary" | "Secondary" | "Higher Secondary";
export type Gender = "Co-educational" | "Boys" | "Girls";
export type ManagementGroup = "PMC" | "Government" | "Aided" | "Unaided" | "Central" | "Other";

export interface GradeRow {
  grade: number;
  label: string;
  boys: number;
  girls: number;
  total: number;
}

export interface Essential {
  key: string;
  label: string;
  ok: boolean;
  note?: string;
}

export interface School {
  id: string;
  name: string;
  zone: string;
  cluster: string;
  area: string;
  areaLabel: string;
  areaSlug: string;
  areaCode: string;
  location: "Urban" | "Rural";
  management: string;
  managementGroup: ManagementGroup;
  category: string;
  stage: string;
  level: Level;
  lowClass: number;
  highClass: number;
  medium: string;
  media: string[];
  gender: Gender;
  contact: {
    phone: string[];
    email: string;
    website: string;
  };
  staff: {
    total: number;
    male: number;
    female: number;
    inPosition: number;
    sanction: number;
    para: number;
  };
  enrolment: {
    total: number;
    boys: number;
    girls: number;
    prePrimary: number;
    byGrade: GradeRow[];
  };
  classrooms: number;
  ptr: number | null;
  facilities: {
    buildingOwnership: string;
    buildingBlocks: number;
    boundaryWall: string;
    classroomsInUse: number;
    otherRooms: number;
    classroomConditionPct: number | null;
    separateHmRoom: boolean;
    toiletsBoys: { total: number; functional: number };
    toiletsGirls: { total: number; functional: number };
    cwsnToilets: number;
    urinals: number;
    handwash: boolean;
    waterPurifier: boolean;
    waterQualityTested: boolean;
    rainWaterHarvesting: boolean;
    electricity: boolean;
    solar: boolean;
    library: boolean;
    libraryBooks: number;
    bookBank: boolean;
    readingCorner: boolean;
    playground: boolean;
    ramp: boolean;
    handrails: boolean;
    specialEducator: string;
    kitchenGarden: boolean;
    medicalCheckup: boolean;
    furniture: number;
  };
  essentials: Essential[];
  essentialCount: number;
  coordinates: { lat: number; lon: number } | null;
}

export interface Area {
  slug: string;
  name: string;
  zone: string;
  count: number;
  students: number;
  teachers: number;
  coordinates: { lat: number; lon: number } | null;
  schoolIds: string[];
}

export interface Zone {
  slug: string;
  name: string;
  count: number;
  students: number;
  areas: number;
}

export interface Directory {
  schools: School[];
  byId: Map<string, School>;
  areas: Area[];
  areasBySlug: Map<string, Area>;
  zones: Zone[];
  totals: {
    schools: number;
    students: number;
    boys: number;
    girls: number;
    teachers: number;
    areas: number;
    withCoordinates: number;
    averagePtr: number;
  };
  facets: {
    levels: { label: Level; count: number }[];
    media: { label: string; count: number }[];
    managementGroups: { label: ManagementGroup; count: number }[];
    genders: { label: Gender; count: number }[];
  };
}
