import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { ArrowRightIcon, PlusIcon, ScaleIcon } from "@/components/icons";
import { ComparePicker } from "@/components/compare-picker";
import { getDirectory } from "@/lib/data";
import { formatNumber, ptrLabel } from "@/lib/format";
import type { School } from "@/lib/types";

export const metadata: Metadata = {
  title: "Compare schools",
  description: "Put two or three Pune schools side by side — enrolment, staffing, facilities and fees-free facts.",
};

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

const yesNo = (value: boolean) => (value ? "Yes" : "No");

function rows(school: School): { group: string; label: string; value: string; numeric?: boolean }[] {
  const f = school.facilities;
  return [
    { group: "Overview", label: "Area", value: school.areaLabel },
    { group: "Overview", label: "Zone", value: school.zone },
    { group: "Overview", label: "Management", value: school.management },
    { group: "Overview", label: "Classes", value: school.stage },
    { group: "Overview", label: "Medium", value: school.medium },
    { group: "Overview", label: "Type", value: school.gender },
    { group: "Overview", label: "UDISE", value: school.id },
    { group: "Students", label: "Students", value: formatNumber(school.enrolment.total), numeric: true },
    { group: "Students", label: "Boys", value: formatNumber(school.enrolment.boys), numeric: true },
    { group: "Students", label: "Girls", value: formatNumber(school.enrolment.girls), numeric: true },
    {
      group: "Students",
      label: "Girls share",
      value: school.enrolment.total
        ? `${Math.round((school.enrolment.girls / school.enrolment.total) * 100)}%`
        : "—",
      numeric: true,
    },
    { group: "Staff", label: "Teachers", value: String(school.staff.total || "\u2014"), numeric: true },
    { group: "Staff", label: "Students / teacher", value: ptrLabel(school.ptr), numeric: true },
    { group: "Staff", label: "Para teachers", value: String(school.staff.para || "0"), numeric: true },
    { group: "Buildings", label: "Classrooms", value: String(school.classrooms || "—"), numeric: true },
    { group: "Buildings", label: "Building", value: f.buildingOwnership },
    {
      group: "Buildings",
      label: "Rooms in good repair",
      value: f.classroomConditionPct === null ? "—" : `${f.classroomConditionPct}%`,
      numeric: true,
    },
    { group: "Buildings", label: "Boundary wall", value: f.boundaryWall.replace(/^\d+-/, "") },
    {
      group: "Facilities",
      label: "Working boys' toilets",
      value: String(f.toiletsBoys.functional),
      numeric: true,
    },
    {
      group: "Facilities",
      label: "Working girls' toilets",
      value: String(f.toiletsGirls.functional),
      numeric: true,
    },
    { group: "Facilities", label: "Library", value: yesNo(f.library) },
    {
      group: "Facilities",
      label: "Library books",
      value: f.libraryBooks ? formatNumber(f.libraryBooks) : "—",
      numeric: true,
    },
    { group: "Facilities", label: "Playground", value: yesNo(f.playground) },
    { group: "Facilities", label: "Wheelchair ramp", value: yesNo(f.ramp) },
    { group: "Facilities", label: "Head teacher room", value: yesNo(f.separateHmRoom) },
    { group: "Facilities", label: "Solar panels", value: yesNo(f.solar) },
    { group: "Facilities", label: "Special educator", value: f.specialEducator },
  ];
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const ids = one(sp.ids)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 3);

  const { byId, areas, totals } = getDirectory();
  const schools = ids.map((id) => byId.get(id)).filter((s): s is School => Boolean(s));

  const groups = ["Overview", "Students", "Staff", "Buildings", "Facilities"];
  const matrix =
    schools.length > 0
      ? groups.map((group) => ({
          group,
          rows: rows(schools[0])
            .filter((row) => row.group === group)
            .map((row) => row.label),
        }))
      : [];

  return (
    <div className="shell py-10">
      <nav aria-label="Breadcrumb" className="text-[0.76rem] text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">Compare</span>
      </nav>

      <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-[2.1rem]">Compare schools</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Add up to three schools and read them line by line. Everything here is reported data — we do
        not score or rank schools, because a good school depends on the child.
      </p>

      <div className="mt-6">
        <ComparePicker selected={schools.map((s) => ({ id: s.id, name: s.name }))} />
      </div>

      {schools.length === 0 ? (
        <div className="mt-10 card grid place-items-center px-6 py-16 text-center">
          <ScaleIcon className="size-8 text-line-strong" />
          <p className="mt-4 font-display text-xl font-semibold text-ink">
            Pick your first school
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
            Start typing a name above — try “Katraj”, “St.” or an area — or open a busy area
            and compare from there.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {areas.slice(0, 4).map((area) => (
              <Link key={area.slug} href={`/areas/${area.slug}`} className="chip">
                <PlusIcon className="size-3.5" />
                {area.name}
              </Link>
            ))}
          </div>
          <Link
            href="/schools"
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
          >
            Browse all {totals.schools} schools
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[48rem] table-fixed border-separate border-spacing-0 text-left">
            <colgroup>
              <col style={{ width: "12rem" }} />
              {schools.map((school) => (
                <col key={school.id} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border-b border-line bg-paper pb-3 pr-4 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">
                  Attribute
                </th>
                {schools.map((school) => (
                  <th key={school.id} className="border-b border-line pb-3 pl-4 align-bottom">
                    <Link
                      href={`/schools/${school.id}`}
                      className="block text-[0.95rem] font-semibold leading-snug text-ink hover:text-teal-deep"
                    >
                      {school.name}
                    </Link>
                    <span className="mt-1 block text-[0.72rem] font-normal text-muted">
                      {school.areaLabel} · {school.stage}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((group) => (
                <Fragment key={group.group}>
                  <tr>
                    <td
                      colSpan={schools.length + 1}
                      className="pb-2 pt-7 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-teal-deep"
                    >
                      {group.group}
                    </td>
                  </tr>
                  {group.rows.map((label) => (
                    <tr key={`${group.group}-${label}`} className="group">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 border-t border-line bg-paper py-2.5 pr-4 text-[0.8rem] font-normal text-muted group-hover:bg-paper-deep"
                      >
                        {label}
                      </th>
                      {schools.map((school) => {
                        const row = rows(school).find(
                          (r) => r.group === group.group && r.label === label,
                        );
                        return (
                          <td
                            key={school.id}
                            className={`border-t border-line py-2.5 pl-4 text-[0.84rem] text-ink group-hover:bg-paper-deep/60 ${
                              row?.numeric ? "tnum font-medium" : ""
                            }`}
                          >
                            {row?.value ?? "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {schools.length > 0 ? (
        <p className="mt-6 text-[0.76rem] leading-relaxed text-muted">
          Figures are as reported by each school in the directory. We do not score or rank schools —
          the numbers are here to help you ask better questions when you visit.
        </p>
      ) : null}
    </div>
  );
}
