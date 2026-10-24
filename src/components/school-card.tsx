import Link from "next/link";
import { BookIcon, CapIcon, PhoneIcon, PlayIcon, RampIcon, UsersIcon } from "@/components/icons";
import { formatNumber, ptrLabel } from "@/lib/format";
import type { School } from "@/lib/types";
import { ManagementTag, Tag } from "@/components/ui";

function FacilityDot({ on, label, icon }: { on: boolean; label: string; icon: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.7rem] font-medium ${
        on ? "text-teal-deep" : "text-muted line-through decoration-line-strong"
      }`}
      title={`${label}: ${on ? "available" : "not reported"}`}
    >
      <span className={on ? "text-teal" : "text-line-strong"}>{icon}</span>
      {label}
    </span>
  );
}

export function SchoolCard({
  school,
  distance,
}: {
  school: School;
  distance?: number;
}) {
  return (
    <Link
      href={`/schools/${school.id}`}
      className="card card-interactive group flex h-full flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <ManagementTag group={school.managementGroup} />
          <Tag>{school.stage}</Tag>
        </div>
        {typeof distance === "number" ? (
          <span className="tnum shrink-0 rounded-md bg-teal-wash px-2 py-0.5 text-[0.7rem] font-semibold text-teal-deep">
            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-[1.02rem] font-semibold leading-snug text-ink transition-colors group-hover:text-teal-deep">
        {school.name}
      </h3>

      <p className="mt-1 text-[0.8rem] text-muted">{school.areaLabel}</p>

      <div className="rule my-3.5" />

      <dl className="tnum grid grid-cols-3 gap-2 text-[0.78rem]">
        <div>
          <dt className="text-[0.66rem] font-medium uppercase tracking-wider text-muted">Students</dt>
          <dd className="mt-0.5 flex items-center gap-1 font-semibold text-ink">
            <UsersIcon className="size-3.5 text-line-strong" />
            {school.enrolment.total ? formatNumber(school.enrolment.total) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[0.66rem] font-medium uppercase tracking-wider text-muted">Teachers</dt>
          <dd className="mt-0.5 flex items-center gap-1 font-semibold text-ink">
            <CapIcon className="size-3.5 text-line-strong" />
            {school.staff.total || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[0.66rem] font-medium uppercase tracking-wider text-muted">Ratio</dt>
          <dd className="mt-0.5 font-semibold text-ink">{ptrLabel(school.ptr)}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4">
        <FacilityDot on={school.facilities.library} label="Library" icon={<BookIcon className="size-3.5" />} />
        <FacilityDot on={school.facilities.playground} label="Ground" icon={<PlayIcon className="size-3.5" />} />
        <FacilityDot on={school.facilities.ramp} label="Ramp" icon={<RampIcon className="size-3.5" />} />
        <span className="ml-auto inline-flex items-center gap-1 text-[0.7rem] text-muted">
          <PhoneIcon className="size-3" />
          {school.contact.phone.length ? "Contact listed" : "No number"}
        </span>
      </div>
    </Link>
  );
}
