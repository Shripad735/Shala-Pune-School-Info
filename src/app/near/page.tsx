import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, LocateIcon, PinIcon } from "@/components/icons";
import { LocateButton } from "@/components/locate-button";
import { SchoolCard } from "@/components/school-card";
import { SectionHeading, Stat } from "@/components/ui";
import { getDirectory, nearbyAreas, nearbySchools } from "@/lib/data";
import { distanceKm, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Schools near me",
  description:
    "Share your location to see the Pune schools closest to you, with distances and area-level comparisons.",
};

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

export default async function NearPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const lat = Number.parseFloat(one(sp.lat));
  const lon = Number.parseFloat(one(sp.lon));
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lon);
  const { totals, areas } = getDirectory();
  const mappedAreas = areas.filter((a) => a.coordinates);

  const origin = hasPoint ? { lat, lon } : null;
  const nearAreas = origin ? nearbyAreas(origin, 10) : [];
  const nearSchools = origin ? nearbySchools(origin, 12) : [];
  const residents = nearSchools.reduce((acc, entry) => acc + entry.school.enrolment.total, 0);
  const withinThree = origin
    ? areas
        .filter((area) => area.coordinates && distanceKm(origin, area.coordinates) <= 3)
        .reduce((acc, area) => acc + area.count, 0)
    : 0;

  return (
    <div className="shell py-10">
      <nav aria-label="Breadcrumb" className="text-[0.76rem] text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-soft">Near me</span>
      </nav>

      <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink sm:text-[2.1rem]">
            {origin ? "Schools closest to you" : "Schools near you"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
            {origin
              ? `Ranked by straight-line distance from your location, using the centre of each recorded area. ${mappedAreas.length} of ${totals.areas} areas have a verified map position.`
              : "Share your location once and we will rank Pune's schools by distance. Nothing is stored — the coordinates only live in this page's address while you browse."}
          </p>
        </div>
        <div className="shrink-0">
          <LocateButton variant={origin ? "outline" : "solid"} />
        </div>
      </div>

      {!origin ? (
        <>
          <div className="mt-8 card overflow-hidden">
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="eyebrow">How it works</p>
                <ol className="mt-3 space-y-3 text-[0.86rem] leading-relaxed text-ink-soft">
                  {[
                    "Your browser asks permission to share an approximate location.",
                    "We compare it with the mapped centre of each Pune area — no tracking, no account.",
                    "You get the nearest areas and the schools inside them, with distances.",
                  ].map((line, index) => (
                    <li key={line} className="flex gap-3">
                      <span className="tnum grid size-6 shrink-0 place-items-center rounded-full bg-teal-wash text-[0.72rem] font-semibold text-teal-deep">
                        {index + 1}
                      </span>
                      {line}
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-[0.76rem] leading-relaxed text-muted">
                  Distances are measured to the centre of an area, so treat them as a guide to
                  which area is closest — not as walking directions to a gate.
                </p>
              </div>
              <div className="rounded-xl border border-line bg-paper-deep/50 p-5">
                <p className="eyebrow">Prefer not to share?</p>
                <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-soft">
                  No problem. Pick the area you live in and see the same schools.
                </p>
                <Link
                  href="/areas"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.84rem] font-semibold text-paper"
                >
                  Browse {totals.areas} areas
                  <ArrowRightIcon className="size-4" />
                </Link>
              </div>
            </div>
          </div>

          <section className="mt-10">
            <SectionHeading
              eyebrow="Popular starting points"
              title="Or jump into a busy area"
              description="These areas have the most schools recorded, which usually means more choice within walking distance."
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {areas.slice(0, 8).map((area) => (
                <Link
                  key={area.slug}
                  href={`/areas/${area.slug}`}
                  className="card card-interactive flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9rem] font-semibold text-ink">
                      {area.name}
                    </span>
                    <span className="block text-[0.72rem] text-muted">{area.zone} zone</span>
                  </span>
                  <span className="tnum shrink-0 rounded-lg bg-paper-deep px-2 py-1 text-[0.72rem] font-semibold text-ink-soft">
                    {area.count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          <dl className="mt-6 grid grid-cols-2 gap-6 rounded-2xl border border-line bg-card px-6 py-5 sm:grid-cols-4">
            <Stat
              label="Nearest school"
              value={nearSchools[0] ? `${nearSchools[0].distance.toFixed(1)} km` : "—"}
              hint={nearSchools[0]?.school.areaLabel}
            />
            <Stat
              label="Schools within 3 km"
              value={withinThree}
              hint="in mapped areas"
            />
            <Stat label="Students nearby" value={formatNumber(residents)} hint="in the 12 closest" />
            <Stat
              label="Areas mapped"
              value={`${mappedAreas.length}/${totals.areas}`}
              hint="verified positions"
            />
          </dl>

          <section className="mt-10">
            <SectionHeading
              eyebrow="Around you"
              title="Closest areas"
              action={
                <Link
                  href="/areas"
                  className="text-[0.82rem] font-medium text-teal-deep hover:underline"
                >
                  All areas
                </Link>
              }
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {nearAreas.map(({ area, distance }) => (
                <Link
                  key={area.slug}
                  href={`/areas/${area.slug}`}
                  className="card card-interactive p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <PinIcon className="size-4 text-teal" />
                    <span className="tnum rounded-md bg-teal-wash px-1.5 py-0.5 text-[0.68rem] font-semibold text-teal-deep">
                      {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                    </span>
                  </div>
                  <p className="mt-2 text-[0.88rem] font-semibold leading-snug text-ink">
                    {area.name}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] text-muted">
                    {area.count} schools Â· {area.zone}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <SectionHeading eyebrow="Shortlist" title="Schools nearest to you" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {nearSchools.map(({ school, distance }) => (
                <SchoolCard key={school.id} school={school} distance={distance} />
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-paper-deep/60 p-4">
              <LocateIcon className="mt-0.5 size-4 shrink-0 text-teal" />
              <p className="text-[0.78rem] leading-relaxed text-ink-soft">
                Positions come from OpenStreetMap matching for each area name. A few areas
                have no reliable match, so their schools are not ranked here —{" "}
                <Link href="/areas" className="link-underline">
                  browse them by name
                </Link>{" "}
                instead.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
