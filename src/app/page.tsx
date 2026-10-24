import Link from "next/link";
import {
  ArrowRightIcon,
  BookIcon,
  BuildingIcon,
  CapIcon,
  LocateIcon,
  MailIcon,
  PinIcon,
  ScaleIcon,
  SparkIcon,
  UsersIcon,
} from "@/components/icons";
import { SearchBox } from "@/components/search-box";
import { SectionHeading } from "@/components/ui";
import { getDirectory } from "@/lib/data";
import { formatCompact, formatNumber } from "@/lib/format";

export default function HomePage() {
  const { totals, areas, facets } = getDirectory();
  const topAreas = areas.slice(0, 15);

  const quickLinks = [
    { label: "English medium", href: "/schools?medium=English" },
    { label: "Has a playground", href: "/schools?playground=1" },
    { label: "PMC schools", href: "/schools?management=PMC" },
    { label: "Higher secondary", href: "/schools?level=Higher+Secondary" },
    { label: "Schools near me", href: "/near" },
  ];

  const features = [
    {
      href: "/near",
      icon: LocateIcon,
      title: "Schools near me",
      body: "Share your location — or just pick an area — and see the closest schools with distances.",
      tone: "teal" as const,
    },
    {
      href: "/compare",
      icon: ScaleIcon,
      title: "Compare up to three",
      body: "Enrolment, students per teacher, classrooms, toilets, library, playground and ramps, side by side.",
      tone: "saffron" as const,
    },
    {
      href: "/schools?sort=facilities",
      icon: BookIcon,
      title: "Filter by what matters",
      body: "Medium of instruction, who runs the school, the classes it covers, and the facilities it really has.",
      tone: "teal" as const,
    },
    {
      href: "/schools",
      icon: MailIcon,
      title: "Contacts in one place",
      body: "Phone numbers, email addresses and websites for over a thousand schools — no scrolling PDFs.",
      tone: "plum" as const,
    },
  ];

  return (
    <>
      {/* ---------------------------------------------------------------- hero */}
      <section className="hero-wash relative overflow-hidden border-b border-line">
        <div className="grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="shell relative py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[2.4rem] font-semibold leading-[1.05] text-ink sm:text-[3.2rem] md:text-[3.9rem]">
              Know the school
              <br className="hidden sm:block" /> before you visit.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[1rem] leading-relaxed text-ink-soft sm:text-[1.08rem]">
              Search {formatNumber(totals.schools)} schools across {totals.areas} areas in Pune —
              class sizes, facilities, teachers and phone numbers, all in one place.
            </p>

            <div className="mx-auto mt-9 max-w-2xl">
              <SearchBox />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href} className="chip">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="shell relative pb-10">
          <dl className="grid grid-cols-2 divide-line rounded-2xl border border-line bg-card/80 backdrop-blur-sm sm:grid-cols-4 sm:divide-x">
            {[
              { label: "Schools", value: formatNumber(totals.schools), icon: BuildingIcon },
              { label: "Students", value: formatCompact(totals.students), icon: UsersIcon },
              { label: "Teachers", value: formatNumber(totals.teachers), icon: CapIcon },
              { label: "Areas", value: String(totals.areas), icon: PinIcon },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-4 py-4 sm:px-6 sm:py-5">
                <stat.icon className="size-5 shrink-0 text-teal" />
                <div>
                  <dd className="tnum text-[1.35rem] font-semibold leading-none text-ink">
                    {stat.value}
                  </dd>
                  <dt className="mt-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted">
                    {stat.label}
                  </dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------------- areas */}
      <section className="shell py-16">
        <SectionHeading
          eyebrow="Start here"
          title="Find schools in your area"
          description="Pune's school records group schools by the area they sit in. Pick yours to see every school nearby."
          action={
            <Link
              href="/areas"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
            >
              All {totals.areas} areas
              <ArrowRightIcon className="size-4" />
            </Link>
          }
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {topAreas.map((area) => (
            <Link
              key={area.slug}
              href={`/areas/${area.slug}`}
              className="card card-interactive group flex items-center justify-between gap-3 px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[0.92rem] font-semibold text-ink group-hover:text-teal-deep">
                  {area.name}
                </p>
                <p className="mt-0.5 truncate text-[0.74rem] text-muted">
                  {area.zone} zone · {area.teachers} teachers
                </p>
              </div>
              <span className="tnum shrink-0 rounded-lg bg-paper-deep px-2 py-1 text-[0.72rem] font-semibold text-ink-soft">
                {area.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ features */}
      <section className="border-y border-line bg-paper-deep/50 py-16">
        <div className="shell">
          <SectionHeading
            eyebrow="What you can check"
            title="The questions parents actually ask"
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="card card-interactive group flex flex-col gap-3 p-5"
              >
                <span
                  className={`grid size-10 place-items-center rounded-xl ${
                    feature.tone === "teal"
                      ? "bg-teal-wash text-teal-deep"
                      : feature.tone === "saffron"
                        ? "bg-saffron-wash text-saffron"
                        : "bg-plum-wash text-plum"
                  }`}
                >
                  <feature.icon className="size-5" />
                </span>
                <p className="flex items-center gap-1.5 text-[0.95rem] font-semibold text-ink group-hover:text-teal-deep">
                  {feature.title}
                  <ArrowRightIcon className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </p>
                <p className="text-[0.85rem] leading-relaxed text-ink-soft">{feature.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- medium mix */}
      <section className="shell py-16">
        <div className="card overflow-hidden">
          <div className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="eyebrow">Medium of instruction</p>
              <h2 className="mt-1.5 text-2xl font-semibold text-ink">
                Marathi and English lead, but there are more
              </h2>
              <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
                Each school lists one primary medium. Use the filter to find schools teaching in
                Hindi, Urdu, Gujarati, Kannada or Tamil.
              </p>
              <Link
                href="/schools"
                className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
              >
                Explore all schools
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {facets.media
                .filter((medium) => medium.label !== "Not recorded")
                .slice(0, 6)
                .map((medium) => {
                  const pct = Math.round((medium.count / totals.schools) * 100);
                  const pctLabel = pct === 0 ? "<1" : String(pct);
                  return (
                    <div key={medium.label}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-medium text-ink">{medium.label}</span>
                        <span className="tnum text-muted">
                          {medium.count} <span className="text-[0.72rem]">({pctLabel}%)</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-deep">
                        <div
                          className="h-full rounded-full bg-teal/80"
                          style={{ width: `${Math.max(3, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </section>

      <div className="shell pb-4">
        <p className="flex items-center justify-center gap-2 text-center text-[0.78rem] text-muted">
          <SparkIcon className="size-3.5 text-teal" />
          Built on the UDISE school directory and PMC contact records.
        </p>
      </div>
    </>
  );
}
