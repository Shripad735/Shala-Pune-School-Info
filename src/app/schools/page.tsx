import type { Metadata } from "next";
import Link from "next/link";
import { FilterPanel, type FilterState } from "@/components/filter-panel";
import { PinIcon, SearchIcon } from "@/components/icons";
import { SchoolCard } from "@/components/school-card";
import { EmptyState } from "@/components/ui";
import { filterSchools, getDirectory, type SchoolFilters } from "@/lib/data";
import { formatNumber } from "@/lib/format";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Explore schools",
  description: "Filter Pune schools by area, zone, stage, medium, management and facilities.",
};

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const state: FilterState = {
    q: one(sp.q),
    zone: one(sp.zone),
    level: one(sp.level),
    medium: one(sp.medium),
    management: one(sp.management),
    gender: one(sp.gender),
    library: one(sp.library),
    playground: one(sp.playground),
    ramp: one(sp.ramp),
    solar: one(sp.solar),
    sort: one(sp.sort) || "name",
  };

  const filters: SchoolFilters = { ...state, page: one(sp.page) || "1" };
  const { schools, total, pages, page } = filterSchools(filters);
  const { zones, facets, totals } = getDirectory();

  const hrefFor = (nextPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) {
      if (value && !(key === "sort" && value === "name")) params.set(key, value);
    }
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/schools?${qs}` : "/schools";
  };

  const activeChips = [
    state.q && { label: `“${state.q}”`, key: "q" },
    state.zone && { label: state.zone, key: "zone" },
    state.level && { label: state.level, key: "level" },
    state.medium && { label: `${state.medium} medium`, key: "medium" },
    state.management && { label: state.management, key: "management" },
    state.gender && { label: state.gender, key: "gender" },
    state.library === "1" && { label: "Library", key: "library" },
    state.playground === "1" && { label: "Playground", key: "playground" },
    state.ramp === "1" && { label: "Ramp", key: "ramp" },
    state.solar === "1" && { label: "Solar", key: "solar" },
  ].filter(Boolean) as { label: string; key: string }[];

  return (
    <div className="shell py-10">
      <div className="flex flex-col gap-2">
        <nav aria-label="Breadcrumb" className="text-[0.76rem] text-muted">
          <Link href="/" className="hover:text-ink">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-ink-soft">Schools</span>
        </nav>
        <h1 className="text-3xl font-semibold text-ink sm:text-[2.1rem]">
          {total === totals.schools ? "Every school in Pune" : "Matching schools"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          {formatNumber(total)} {total === 1 ? "school" : "schools"}
          {state.zone ? ` in the ${state.zone} zone` : ""} across {totals.areas} areas. Open a
          school for enrolment, staffing, facilities and contact details.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <FilterPanel
          state={state}
          facets={facets}
          zones={zones}
          resultCountLabel={formatNumber(total)}
        />

        <div>
          {activeChips.length > 0 ? (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-[0.72rem] font-medium uppercase tracking-wider text-muted">
                Active
              </span>
              {activeChips.map((chip) => {
                const params = new URLSearchParams();
                for (const [key, value] of Object.entries(state)) {
                  if (value && key !== chip.key && !(key === "sort" && value === "name")) {
                    params.set(key, value);
                  }
                }
                const qs = params.toString();
                return (
                  <Link
                    key={chip.key}
                    href={qs ? `/schools?${qs}` : "/schools"}
                    className="chip bg-ink text-paper hover:bg-ink"
                    data-active="true"
                  >
                    {chip.label}
                    <span aria-hidden className="text-paper/60">×</span>
                  </Link>
                );
              })}
            </div>
          ) : null}

          {schools.length === 0 ? (
            <EmptyState
              title="No schools match that combination"
              body="Try removing one filter, or search by area instead of school name."
              action={
                <Link
                  href="/schools"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
                >
                  <SearchIcon className="size-4" />
                  Reset filters
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {schools.map((school) => (
                <SchoolCard key={school.id} school={school} />
              ))}
            </div>
          )}

          {pages > 1 ? (
            <nav
              aria-label="Pagination"
              className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5"
            >
              {page > 1 ? (
                <Link
                  href={hrefFor(page - 1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft hover:border-line-strong hover:text-ink"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: pages }, (_, index) => index + 1)
                  .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2)
                  .map((n, index, list) => {
                    const prev = list[index - 1];
                    const gap = prev !== undefined && n - prev > 1;
                    return (
                      <span key={n} className="flex items-center gap-1.5">
                        {gap ? <span className="px-1 text-muted">…</span> : null}
                        <Link
                          href={hrefFor(n)}
                          aria-current={n === page ? "page" : undefined}
                          className={`tnum inline-flex size-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                            n === page
                              ? "border-ink bg-ink text-paper"
                              : "border-line bg-card text-ink-soft hover:border-line-strong hover:text-ink"
                          }`}
                        >
                          {n}
                        </Link>
                      </span>
                    );
                  })}
              </div>
              <span className="text-xs text-muted">
                Page {page} of {pages}
              </span>
            </nav>
          ) : null}

          <div className="mt-10 flex items-start gap-3 rounded-xl border border-line bg-paper-deep/60 p-4">
            <PinIcon className="mt-0.5 size-4 shrink-0 text-teal" />
            <p className="text-[0.78rem] leading-relaxed text-ink-soft">
              School details come from the UDISE directory and PMC contact records for Pune blocks.
              Enrolment is the sum of class-wise figures for Std 1&ndash;12;
              facilities are as reported by each school.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
