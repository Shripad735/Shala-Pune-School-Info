import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  BookIcon,
  BoltIcon,
  BuildingIcon,
  CapIcon,
  CheckIcon,
  DropIcon,
  GlobeIcon,
  MailIcon,
  MinusIcon,
  PhoneIcon,
  PinIcon,
  PlayIcon,
  RampIcon,
  ShieldIcon,
  ToiletIcon,
  UsersIcon,
} from "@/components/icons";
import { ManagementTag, SectionHeading, Stat, Tag } from "@/components/ui";
import { getSchool, relatedSchools } from "@/lib/data";
import { formatNumber, ptrLabel, ptrTone } from "@/lib/format";
import { SchoolCard } from "@/components/school-card";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const school = getSchool(id);
  if (!school) return { title: "School not found" };
  return {
    title: school.name,
    description: `${school.name} in ${school.areaLabel}, Pune — ${school.stage}, ${school.medium} medium. ${school.enrolment.total} students, ${school.staff.total} teachers. UDISE code ${school.id}.`,
  };
}

const ESSENTIAL_ICONS: Record<string, React.ReactNode> = {
  toilets: <ToiletIcon className="size-4" />,
  electricity: <BoltIcon className="size-4" />,
  water: <DropIcon className="size-4" />,
  library: <BookIcon className="size-4" />,
  playground: <PlayIcon className="size-4" />,
  ramp: <RampIcon className="size-4" />,
  boundary: <BuildingIcon className="size-4" />,
  hmroom: <BuildingIcon className="size-4" />,
};

function EnrolmentChart({ school }: { school: ReturnType<typeof getSchool> }) {
  if (!school) return null;
  const rows = school.enrolment.byGrade.filter((g) => g.total > 0);
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No class-wise enrolment reported for this school.</p>;
  }
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 text-[0.72rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-teal" /> Boys
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-saffron" /> Girls
        </span>
        <span className="ml-auto tnum">
          {formatNumber(school.enrolment.boys)} boys · {formatNumber(school.enrolment.girls)} girls
        </span>
      </div>
      <div className="mt-4 space-y-1.5">
        {rows.map((row) => {
          const width = (row.total / max) * 100;
          const boysShare = row.total ? (row.boys / row.total) * 100 : 0;
          return (
            <div key={row.grade} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[0.72rem] text-muted">{row.label}</span>
              <div className="relative h-5 flex-1">
                <div
                  className="flex h-full overflow-hidden rounded-md"
                  style={{ width: `${Math.max(width, 2)}%` }}
                >
                  <div className="h-full bg-teal" style={{ width: `${boysShare}%` }} />
                  <div className="h-full flex-1 bg-saffron" />
                </div>
              </div>
              <span className="tnum w-10 shrink-0 text-right text-[0.76rem] font-semibold text-ink">
                {row.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FacilityRow({
  icon,
  label,
  value,
  ok,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  ok: boolean;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-line py-2.5">
      <span className={ok ? "text-teal" : "text-line-strong"}>{icon}</span>
      <span className="flex-1 text-[0.85rem] text-ink-soft">{label}</span>
      {value ? <span className="text-[0.74rem] font-medium text-ink">{value}</span> : null}
      <span
        className={`grid size-5 place-items-center rounded-full ${
          ok ? "bg-teal-wash text-teal-deep" : "bg-brick-wash text-brick"
        }`}
        aria-label={ok ? "available" : "not reported"}
      >
        {ok ? <CheckIcon className="size-3" /> : <MinusIcon className="size-3" />}
      </span>
    </li>
  );
}

export default async function SchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const school = getSchool(id);
  if (!school) notFound();

  const related = relatedSchools(school, 4);
  const f = school.facilities;
  const ptr = school.ptr;

  const mapQuery = school.coordinates
    ? `${school.coordinates.lat},${school.coordinates.lon}`
    : `${school.name}, ${school.areaLabel}, Pune, Maharashtra`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  const extra = [
    {
      icon: <BookIcon className="size-4" />,
      label: "Library books",
      value: f.libraryBooks ? formatNumber(f.libraryBooks) : undefined,
      ok: f.libraryBooks > 0,
    },
    { icon: <BookIcon className="size-4" />, label: "Book bank", ok: f.bookBank },
    { icon: <BookIcon className="size-4" />, label: "Reading corner", ok: f.readingCorner },
    { icon: <DropIcon className="size-4" />, label: "Water purifier / RO", ok: f.waterPurifier },
    {
      icon: <DropIcon className="size-4" />,
      label: "Rainwater harvesting",
      ok: f.rainWaterHarvesting,
    },
    { icon: <BoltIcon className="size-4" />, label: "Solar panels", ok: f.solar },
    { icon: <ShieldIcon className="size-4" />, label: "Kitchen garden", ok: f.kitchenGarden },
    {
      icon: <ShieldIcon className="size-4" />,
      label: "Annual medical check-up",
      ok: f.medicalCheckup,
    },
  ];

  return (
    <div className="shell py-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[0.76rem] text-muted">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href="/schools" className="hover:text-ink">Schools</Link>
        <span>/</span>
        <Link href={`/areas/${school.areaSlug}`} className="hover:text-ink">
          {school.areaLabel}
        </Link>
        <span>/</span>
        <span className="max-w-[18rem] truncate text-ink-soft">{school.name}</span>
      </nav>

      {/* ------------------------------------------------------------- header */}
      <header className="mt-4 card overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <ManagementTag group={school.managementGroup} />
            <Tag>{school.stage}</Tag>
            <Tag tone="teal">{school.medium} medium</Tag>
            {school.gender !== "Co-educational" ? <Tag tone="plum">{school.gender} school</Tag> : null}
            <Tag>{school.zone} zone</Tag>
          </div>

          <h1 className="mt-4 text-[1.6rem] font-semibold leading-tight text-ink sm:text-[2.05rem] md:text-[2.35rem]">
            {school.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.88rem] text-ink-soft">
            <PinIcon className="size-4 text-teal" />
            {school.areaLabel}
            <span className="text-line-strong">·</span>
            {school.zone} zone
            <span className="text-line-strong">·</span>
            {school.management}
            <span className="text-line-strong">·</span>
            UDISE {school.id}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {school.contact.phone[0] ? (
              <a
                href={`tel:${school.contact.phone[0]}`}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[0.84rem] font-semibold text-paper transition-transform hover:-translate-y-px"
              >
                <PhoneIcon className="size-4" />
                {school.contact.phone[0]}
              </a>
            ) : null}
            {school.contact.email ? (
              <a
                href={`mailto:${school.contact.email}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[0.84rem] font-medium text-ink-soft hover:border-line-strong hover:text-ink"
              >
                <MailIcon className="size-4" />
                Email
              </a>
            ) : null}
            {school.contact.website ? (
              <a
                href={school.contact.website.startsWith("http") ? school.contact.website : `https://${school.contact.website}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[0.84rem] font-medium text-ink-soft hover:border-line-strong hover:text-ink"
              >
                <GlobeIcon className="size-4" />
                Website
              </a>
            ) : null}
            <a
              href={mapHref}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-[0.84rem] font-medium text-ink-soft hover:border-line-strong hover:text-ink"
            >
              <PinIcon className="size-4" />
              Open in Maps
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-6 border-t border-line bg-paper-deep/40 px-6 py-6 sm:grid-cols-4 sm:px-8">
          <Stat
            label="Students"
            value={school.enrolment.total ? formatNumber(school.enrolment.total) : "—"}
            hint={
              school.enrolment.prePrimary > 0
                ? `+${school.enrolment.prePrimary} pre-primary`
                : undefined
            }
          />
          <Stat label="Teachers" value={school.staff.total || "—"} hint={`${school.classrooms} classrooms`} />
          <Stat
            label="Students per teacher"
            value={ptrLabel(ptr)}
            tone={ptrTone(ptr)}
            hint={
              ptr === null
                ? undefined
                : ptr > 30
                  ? "Above the 30:1 norm"
                  : "Within the 30:1 norm"
            }
          />
          <Stat
            label="Facilities present"
            value={`${school.essentialCount}/${school.essentials.length}`}
            hint="of the essentials we track"
          />
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* ------------------------------------------------------------ main */}
        <div className="space-y-6">
          <section className="card p-6">
            <SectionHeading eyebrow="Who studies here" title="Enrolment by standard" />
            <div className="mt-5">
              <EnrolmentChart school={school} />
            </div>
            <div className="mt-6 grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-paper-deep/40 py-4 text-center">
              <div>
                <p className="tnum text-lg font-semibold text-ink">{formatNumber(school.enrolment.boys)}</p>
                <p className="mt-0.5 text-[0.7rem] uppercase tracking-wider text-muted">Boys</p>
              </div>
              <div>
                <p className="tnum text-lg font-semibold text-ink">{formatNumber(school.enrolment.girls)}</p>
                <p className="mt-0.5 text-[0.7rem] uppercase tracking-wider text-muted">Girls</p>
              </div>
              <div>
                <p className="tnum text-lg font-semibold text-ink">
                  {school.enrolment.total
                    ? `${Math.round((school.enrolment.girls / school.enrolment.total) * 100)}%`
                    : "—"}
                </p>
                <p className="mt-0.5 text-[0.7rem] uppercase tracking-wider text-muted">Girls share</p>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <SectionHeading
              eyebrow="What the school reports"
              title="Facilities that matter day to day"
              description="The eight basics parents usually ask about first, then the extras the school reports."
            />
            <div className="mt-4">
              <p className="eyebrow">The eight basics</p>
              <ul className="mt-2 grid gap-x-10 sm:grid-cols-2">
                {school.essentials.map((item) => (
                  <FacilityRow
                    key={item.key}
                    icon={ESSENTIAL_ICONS[item.key] ?? <BuildingIcon className="size-4" />}
                    label={item.label}
                    value={item.note}
                    ok={item.ok}
                  />
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <p className="eyebrow">Also recorded</p>
              <ul className="mt-2 grid gap-x-10 sm:grid-cols-2">
                {extra.map((item) => (
                  <FacilityRow key={item.label} {...item} />
                ))}
              </ul>
            </div>

            <dl className="mt-6 grid gap-3 rounded-xl border border-line bg-paper-deep/40 p-4 text-[0.8rem] sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Building</dt>
                <dd className="text-right font-medium text-ink">{f.buildingOwnership}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Boundary</dt>
                <dd className="text-right font-medium text-ink">{f.boundaryWall.replace(/^\d+-/, "")}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Classrooms in use</dt>
                <dd className="tnum text-right font-medium text-ink">
                  {f.classroomsInUse}
                  {f.classroomConditionPct !== null ? ` · ${f.classroomConditionPct}% good` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Functional toilets</dt>
                <dd className="tnum text-right font-medium text-ink">
                  {f.toiletsBoys.functional} boys · {f.toiletsGirls.functional} girls
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Special educator</dt>
                <dd className="text-right font-medium text-ink">{f.specialEducator}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Other rooms</dt>
                <dd className="tnum text-right font-medium text-ink">{f.otherRooms}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-6">
            <SectionHeading eyebrow="Staff" title="Teachers" />
            <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4">
              <Stat label="On roll" value={school.staff.total || "—"} hint="total teaching staff" />
              <Stat
                label="In position"
                value={school.staff.inPosition || "—"}
                hint="as in the PMC sheet"
              />
              <Stat label="Sanctioned" value={school.staff.sanction || "—"} hint="approved posts" />
              <Stat label="Para teachers" value={school.staff.para || "—"} hint="contract support" />
            </div>
            <p className="mt-5 text-[0.78rem] leading-relaxed text-muted">
              Counts are as reported in the school directory. “Sanctioned” is the approved teaching
              strength; a zero usually means the post structure was not recorded rather than that no
              post exists. Students per teacher is total enrolment divided by teachers on roll — a
              very high ratio can also mean only part of the staff was counted.
            </p>
          </section>
        </div>

        {/* ------------------------------------------------------------- aside */}
        <div className="space-y-6">
          <section className="card p-6">
            <SectionHeading eyebrow="Where" title="Location" />
            <dl className="mt-4 space-y-3 text-[0.84rem]">
              {[
                ["Area", school.areaLabel],
                ["Zone", `${school.zone} zone`],
                ["Cluster", school.cluster || "—"],
                ["Settlement", school.location],
                ["Coordinates", school.coordinates ? `${school.coordinates.lat.toFixed(4)}, ${school.coordinates.lon.toFixed(4)}` : "Not mapped"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <dt className="text-muted">{label}</dt>
                  <dd className="max-w-[60%] text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <a
              href={mapHref}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-5 flex items-center justify-between rounded-xl border border-line bg-paper-deep/50 px-4 py-3 text-[0.82rem] font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
            >
              <span className="inline-flex items-center gap-2">
                <PinIcon className="size-4 text-teal" />
                View on Google Maps
              </span>
              <span aria-hidden>↗</span>
            </a>
          </section>

          <section className="card p-6">
            <SectionHeading eyebrow="Get in touch" title="Contact" />
            {school.contact.phone.length === 0 && !school.contact.email ? (
              <p className="mt-4 text-[0.84rem] leading-relaxed text-ink-soft">
                No phone number or email is recorded for this school in the PMC directory. Try the
                education office for the {school.zone} zone.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5 text-[0.84rem]">
                {school.contact.phone.map((phone, index) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center gap-2.5 text-ink-soft hover:text-teal-deep"
                    >
                      <PhoneIcon className="size-4 text-line-strong" />
                      <span className="tnum">{phone}</span>
                      {index === 0 ? <span className="ml-auto text-[0.68rem] text-muted">Primary</span> : null}
                    </a>
                  </li>
                ))}
                {school.contact.email ? (
                  <li>
                    <a
                      href={`mailto:${school.contact.email}`}
                      className="flex items-center gap-2.5 break-all text-ink-soft hover:text-teal-deep"
                    >
                      <MailIcon className="size-4 shrink-0 text-line-strong" />
                      {school.contact.email}
                    </a>
                  </li>
                ) : null}
                {school.contact.website ? (
                  <li>
                    <a
                      href={school.contact.website.startsWith("http") ? school.contact.website : `https://${school.contact.website}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center gap-2.5 break-all text-ink-soft hover:text-teal-deep"
                    >
                      <GlobeIcon className="size-4 shrink-0 text-line-strong" />
                      {school.contact.website.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                ) : null}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <SectionHeading eyebrow="The basics" title="At a glance" />
            <dl className="mt-4 space-y-3 text-[0.84rem]">
              {[
                ["Category", school.category],
                ["Management", school.management],
                ["Grades", school.stage],
                ["Medium", school.medium],
                ["School type", school.gender],
                ["UDISE code", school.id],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <dt className="text-muted">{label}</dt>
                  <dd className="max-w-[62%] text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading eyebrow="Nearby" title={`More schools in ${school.areaLabel}`} />
            <Link
              href={`/schools?q=${encodeURIComponent(school.area)}`}
              className="shrink-0 text-[0.82rem] font-medium text-teal-deep hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <SchoolCard key={item.id} school={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-12 flex items-center gap-3">
        <Link
          href="/schools"
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft hover:border-line-strong hover:text-ink"
        >
          <ArrowLeftIcon className="size-4" />
          All schools
        </Link>
        <span className="text-[0.75rem] text-muted">
          Source: UDISE school directory &amp; facilities (Pune blocks 272514&ndash;272518).
        </span>
      </div>
    </div>
  );
}
