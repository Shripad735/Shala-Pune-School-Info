import type { ReactNode } from "react";
import type { ManagementGroup } from "@/lib/types";

const MGMT_STYLE: Record<ManagementGroup, string> = {
  PMC: "bg-teal-wash text-teal-deep border-teal/25",
  Government: "bg-teal-wash text-teal-deep border-teal/25",
  Aided: "bg-saffron-wash text-saffron border-saffron/30",
  Unaided: "bg-plum-wash text-plum border-plum/25",
  Central: "bg-ink/5 text-ink border-line-strong",
  Other: "bg-paper-deep text-muted border-line-strong",
};

export const MGMT_SHORT: Record<ManagementGroup, string> = {
  PMC: "PMC",
  Government: "Government",
  Aided: "Aided",
  Unaided: "Private",
  Central: "Central",
  Other: "Other",
};

export function ManagementTag({ group }: { group: ManagementGroup }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide ${MGMT_STYLE[group]}`}
    >
      {MGMT_SHORT[group]}
    </span>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "teal" | "saffron" | "plum" }) {
  const tones = {
    neutral: "border-line bg-card text-ink-soft",
    teal: "border-teal/25 bg-teal-wash text-teal-deep",
    saffron: "border-saffron/30 bg-saffron-wash text-saffron",
    plum: "border-plum/25 bg-plum-wash text-plum",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "good" | "ok" | "warn" | "none";
}) {
  const toneClass =
    tone === "good" ? "text-teal-deep" : tone === "warn" ? "text-brick" : "text-ink";
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`tnum mt-1 text-[1.35rem] font-semibold leading-none ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-1.5 text-2xl font-semibold text-ink sm:text-[1.65rem]">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Meter({ value, tone = "teal" }: { value: number; tone?: "teal" | "saffron" | "plum" }) {
  const colors = {
    teal: "bg-teal",
    saffron: "bg-saffron",
    plum: "bg-plum",
  } as const;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-paper-deep">
      <div
        className={`h-full rounded-full ${colors[tone]}`}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card grid place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <p className="font-display text-xl font-semibold text-ink">{title}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
