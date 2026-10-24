"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { ChevronDownIcon, CloseIcon, SearchIcon } from "@/components/icons";
import type { Directory } from "@/lib/types";

export interface FilterState {
  q: string;
  zone: string;
  level: string;
  medium: string;
  management: string;
  gender: string;
  library: string;
  playground: string;
  ramp: string;
  solar: string;
  sort: string;
}

const LEVELS = ["Primary", "Upper Primary", "Secondary", "Higher Secondary"];
const MGMT = ["PMC", "Government", "Aided", "Unaided", "Central", "Other"];
const MGMT_LABEL: Record<string, string> = {
  PMC: "Municipal (PMC)",
  Government: "Government",
  Aided: "Aided",
  Unaided: "Private unaided",
  Central: "Central govt.",
  Other: "Other",
};
const TOGGLES: [keyof FilterState, string][] = [
  ["library", "Library"],
  ["playground", "Playground"],
  ["ramp", "Ramp"],
  ["solar", "Solar"],
];

function toQuery(state: FilterState): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    if (value && !(key === "sort" && value === "name")) params.set(key, value);
  }
  return params.toString();
}

const activeCountOf = (state: FilterState) =>
  [
    state.q,
    state.zone,
    state.level,
    state.medium,
    state.management,
    state.gender,
    state.library,
    state.playground,
    state.ramp,
    state.solar,
  ].filter(Boolean).length;

const field =
  "w-full appearance-none rounded-lg border border-line bg-card px-3 py-2 text-[0.84rem] text-ink outline-none transition-colors hover:border-line-strong focus:border-teal/60";

function FilterControls({
  state,
  facets,
  zones,
  resultCountLabel,
}: {
  state: FilterState;
  facets: Directory["facets"];
  zones: { name: string }[];
  resultCountLabel: string;
}) {
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(state.q);

  useEffect(() => setSearch(state.q), [state.q]);

  const apply = (patch: Partial<FilterState>) => {
    const next: FilterState = { ...state, ...patch };
    const qs = toQuery(next);
    startTransition(() => router.push(qs ? `/schools?${qs}` : "/schools", { scroll: false }));
  };

  useEffect(() => {
    if (search === state.q) return;
    const timer = setTimeout(() => apply({ q: search }), 320);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const activeCount = activeCountOf(state);

  return (
    <div className={`space-y-4 ${pending ? "opacity-70" : ""} transition-opacity`}>
      {activeCount > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              router.push("/schools", { scroll: false });
            }}
            className="inline-flex items-center gap-1 text-[0.72rem] font-medium text-teal-deep hover:underline"
          >
            <CloseIcon className="size-3" />
            Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
          </button>
        </div>
      ) : null}

      <div>
        <label htmlFor={`${uid}-search`} className="mb-1.5 block text-[0.74rem] font-medium text-ink-soft">
          Name, area or UDISE code
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            id={`${uid}-search`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="e.g. Katraj, PMC, 27251400101"
            className={`${field} pl-8`}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${uid}-zone`} className="mb-1.5 block text-[0.74rem] font-medium text-ink-soft">
          Zone
        </label>
        <select
          id={`${uid}-zone`}
          value={state.zone}
          onChange={(event) => apply({ zone: event.target.value })}
          className={field}
        >
          <option value="">All zones</option>
          {zones.map((zone) => (
            <option key={zone.name} value={zone.name}>
              {zone.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-[0.74rem] font-medium text-ink-soft">Stage</p>
        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((level) => {
            const count = facets.levels.find((entry) => entry.label === level)?.count ?? 0;
            return (
              <button
                key={level}
                type="button"
                data-active={state.level === level}
                onClick={() => apply({ level: state.level === level ? "" : level })}
                className="chip"
              >
                {level}
                <span className="tnum text-[0.68rem] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label htmlFor={`${uid}-medium`} className="mb-1.5 block text-[0.74rem] font-medium text-ink-soft">
            Medium
          </label>
          <select
            id={`${uid}-medium`}
            value={state.medium}
            onChange={(event) => apply({ medium: event.target.value })}
            className={field}
          >
            <option value="">Any medium</option>
            {facets.media.map((medium) => (
              <option key={medium.label} value={medium.label}>
                {medium.label} ({medium.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${uid}-mgmt`} className="mb-1.5 block text-[0.74rem] font-medium text-ink-soft">
            Who runs it
          </label>
          <select
            id={`${uid}-mgmt`}
            value={state.management}
            onChange={(event) => apply({ management: event.target.value })}
            className={field}
          >
            <option value="">Any management</option>
            {MGMT.map((group) => {
              const count =
                facets.managementGroups.find((entry) => entry.label === group)?.count ?? 0;
              return (
                <option key={group} value={group}>
                  {MGMT_LABEL[group]} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label htmlFor={`${uid}-gender`} className="mb-1.5 block text-[0.74rem] font-medium text-ink-soft">
            Boys / girls / co-ed
          </label>
          <select
            id={`${uid}-gender`}
            value={state.gender}
            onChange={(event) => apply({ gender: event.target.value })}
            className={field}
          >
            <option value="">Any</option>
            {facets.genders
              .filter((gender) => gender.count > 0)
              .map((gender) => (
                <option key={gender.label} value={gender.label}>
                  {gender.label} ({gender.count})
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${uid}-sort`} className="mb-1.5 block text-[0.74rem] font-medium text-ink-soft">
            Sort by
          </label>
          <select
            id={`${uid}-sort`}
            value={state.sort || "name"}
            onChange={(event) => apply({ sort: event.target.value })}
            className={field}
          >
            <option value="name">Name (A–Z)</option>
            <option value="area">Area (A–Z)</option>
            <option value="students">Most students</option>
            <option value="students-asc">Fewest students</option>
            <option value="ptr">Smallest class sizes</option>
            <option value="facilities">Most facilities</option>
          </select>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[0.74rem] font-medium text-ink-soft">Must have</p>
        <div className="flex flex-wrap gap-1.5">
          {TOGGLES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              data-active={state[key] === "1"}
              onClick={() => apply({ [key]: state[key] === "1" ? "" : "1" } as Partial<FilterState>)}
              className="chip"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[0.72rem] leading-relaxed text-muted">
        {resultCountLabel} schools match this combination.
      </p>
    </div>
  );
}

export function FilterPanel(props: {
  state: FilterState;
  facets: Directory["facets"];
  zones: { name: string }[];
  resultCountLabel: string;
}) {
  const activeCount = activeCountOf(props.state);

  return (
    <aside>
      {/* Mobile: collapsed by default so results stay the first thing you see. */}
      <details className="card group overflow-hidden lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.86rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <SearchIcon className="size-4 text-muted" />
          Filters
          {activeCount > 0 ? (
            <span className="tnum rounded-full bg-ink px-1.5 py-0.5 text-[0.66rem] font-semibold text-paper">
              {activeCount}
            </span>
          ) : null}
          <ChevronDownIcon className="ml-auto size-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-line px-4 py-4">
          <FilterControls {...props} />
        </div>
      </details>

      <div className="card hidden p-4 lg:block">
        <p className="eyebrow mb-3">Filter</p>
        <FilterControls {...props} />
      </div>
    </aside>
  );
}
