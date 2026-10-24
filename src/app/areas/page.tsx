import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, PinIcon } from "@/components/icons";
import { SectionHeading } from "@/components/ui";
import { getDirectory } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Browse Pune schools by area",
  description:
    "Every area in the Pune school directory — from Aundh Gaon to Kondhwa — with school counts and enrolment.",
};

export default function AreasPage() {
  const { areas, zones, totals } = getDirectory();

  const byZone = zones.map((zone) => ({
    ...zone,
    areas: areas
      .filter((a) => a.zone === zone.name)
      .sort((a, b) => b.count - a.count),
  }));

  const mapped = areas.filter((a) => a.coordinates).length;

  return (
    <div className="shell py-10">
      <nav aria-label="Breadcrumb" className="text-[0.76rem] text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">Areas</span>
      </nav>

      <h1 className="mt-2 text-3xl font-semibold text-ink sm:text-[2.1rem]">
        Browse by area
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Each school is filed under the area it sits in. Pune has {totals.areas} of them across five
        zones — pick one to see every school there, with enrolment and staffing. {mapped} of them
        are also mapped, so their schools appear in{" "}
        <Link href="/near" className="link-underline">schools near me</Link>.
      </p>

      <div className="mt-8 space-y-12">
        {byZone.map((zone) => (
          <section key={zone.slug}>
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">{zone.name} zone</h2>
                <p className="mt-1 text-[0.8rem] text-muted">
                  {zone.count} schools · {zone.areas.length} areas ·{" "}
                  {formatCompact(zone.students)} students
                </p>
              </div>
              <Link
                href={`/schools?zone=${encodeURIComponent(zone.name)}`}
                className="inline-flex items-center gap-1.5 text-[0.82rem] font-medium text-teal-deep hover:underline"
              >
                All schools in {zone.name}
                <ArrowRightIcon className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {zone.areas.map((area) => (
                <Link
                  key={area.slug}
                  href={`/areas/${area.slug}`}
                  className="card card-interactive group flex flex-col gap-3 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[0.95rem] font-semibold leading-snug text-ink group-hover:text-teal-deep">
                      {area.name}
                    </p>
                    <span className="tnum shrink-0 rounded-lg bg-paper-deep px-2 py-0.5 text-[0.72rem] font-semibold text-ink-soft">
                      {area.count}
                    </span>
                  </div>
                  <div className="mt-auto flex items-center gap-3 text-[0.74rem] text-muted">
                    <span className="tnum">{formatNumber(area.students)} students</span>
                    <span className="text-line-strong">·</span>
                    <span className="tnum">{area.teachers} teachers</span>
                    {area.coordinates ? (
                      <PinIcon className="ml-auto size-3.5 text-teal/70" />
                    ) : (
                      <span className="ml-auto text-[0.68rem] uppercase tracking-wide text-muted/70">
                        unmapped
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
