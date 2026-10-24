import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, PinIcon } from "@/components/icons";
import { SchoolCard } from "@/components/school-card";
import { Stat } from "@/components/ui";
import { getDirectory, nearbyAreas, schoolsInArea } from "@/lib/data";
import { distanceKm, formatNumber } from "@/lib/format";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { area } = schoolsInArea(slug);
  if (!area) return { title: "Area not found" };
  return {
    title: `Schools in ${area.name}, Pune`,
    description: `${area.count} schools in ${area.name}, ${area.zone} zone, Pune. Compare enrolment, facilities and contact details.`,
  };
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { area, schools } = schoolsInArea(slug);
  if (!area) notFound();

  const { totals } = getDirectory();
  const students = schools.reduce((a, s) => a + s.enrolment.total, 0);
  const teachers = schools.reduce((a, s) => a + s.staff.total, 0);
  const withLibrary = schools.filter((s) => s.facilities.library).length;
  const withPlayground = schools.filter((s) => s.facilities.playground).length;

  const nearby = area.coordinates
    ? nearbyAreas(area.coordinates, 7)
        .filter((entry) => entry.area.slug !== area.slug)
        .slice(0, 6)
        .map((entry) => ({ area: entry.area, distance: entry.distance }))
    : getDirectory()
        .areas.filter((a) => a.zone === area.zone && a.slug !== area.slug)
        .slice(0, 6)
        .map((a) => ({ area: a, distance: null as number | null }));

  const mapHref = area.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${area.coordinates.lat},${area.coordinates.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${area.name}, Pune, Maharashtra`)}`;

  return (
    <div className="shell py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[0.76rem] text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/areas" className="hover:text-ink">Areas</Link>
        <span>/</span>
        <span className="text-ink-soft">{area.name}</span>
      </nav>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-teal/25 bg-teal-wash px-2 py-0.5 text-[0.7rem] font-semibold text-teal-deep">
            <PinIcon className="size-3" />
            {area.zone} zone
          </span>
          <span className="text-[0.75rem] text-muted">
            {Math.round((area.count / totals.schools) * 100)}% of Pune&apos;s listed schools
          </span>
        </div>
        <h1 className="mt-3 text-[2rem] font-semibold leading-tight text-ink sm:text-[2.4rem]">
          Schools in {area.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {area.count} {area.count === 1 ? "school" : "schools"} are recorded in {area.name}. Together
          they enrol {formatNumber(students)} students with {formatNumber(teachers)} teachers. Open any
          school for its full facility list and contact details.
        </p>
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-6 rounded-2xl border border-line bg-card px-6 py-5 sm:grid-cols-4">
        <Stat label="Schools" value={area.count} />
        <Stat label="Students" value={formatNumber(students)} />
        <Stat label="Teachers" value={formatNumber(teachers)} />
        <Stat
          label="Students per teacher"
          value={teachers ? `${Math.round(students / teachers)}:1` : "—"}
        />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/schools?zone=${encodeURIComponent(area.zone)}`}
          className="chip"
        >
          All {area.zone} schools
        </Link>
        <Link href={`/schools?q=${encodeURIComponent(area.name)}`} className="chip">
          Search within {area.name}
        </Link>
        <a href={mapHref} target="_blank" rel="noreferrer noopener" className="chip">
          <PinIcon className="size-3.5" />
          View area on map
        </a>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
            <h2 className="text-lg font-semibold text-ink">All schools here</h2>
            <p className="text-[0.74rem] text-muted">
              {withLibrary} with a library · {withPlayground} with a playground
            </p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-5">
            <p className="eyebrow">Nearby areas</p>
            <ul className="mt-3 space-y-1">
              {nearby.map(({ area: other, distance }) => (
                <li key={other.slug}>
                  <Link
                    href={`/areas/${other.slug}`}
                    className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-paper-deep"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.84rem] font-medium text-ink group-hover:text-teal-deep">
                        {other.name}
                      </span>
                      <span className="block text-[0.7rem] text-muted">
                        {other.count} schools
                        {distance !== null && area.coordinates
                          ? ` · ${distanceKm(area.coordinates, other.coordinates!).toFixed(1)} km`
                          : ""}
                      </span>
                    </span>
                    <ArrowRightIcon className="size-3.5 shrink-0 text-line-strong" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <p className="eyebrow">Not sure yet?</p>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-soft">
              Compare up to three schools side by side before you visit.
            </p>
            <Link
              href="/compare"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.82rem] font-semibold text-paper"
            >
              Open compare
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>

      <div className="mt-12">
        <Link
          href="/areas"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft hover:border-line-strong hover:text-ink"
        >
          <ArrowLeftIcon className="size-4" />
          All areas
        </Link>
      </div>
    </div>
  );
}
