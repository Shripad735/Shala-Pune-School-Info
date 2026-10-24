"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, PlusIcon, SearchIcon } from "@/components/icons";

interface Hit {
  id: string;
  name: string;
  area: string;
}

interface Selected {
  id: string;
  name: string;
}

export function ComparePicker({
  selected,
  max = 3,
}: {
  selected: Selected[];
  max?: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { schools: Hit[] };
        setHits(data.schools.filter((s) => !selected.some((x) => x.id === s.id)));
        setOpen(true);
      } catch {
        /* ignore */
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [query, selected]);

  const push = (ids: string[]) => {
    const params = new URLSearchParams();
    if (ids.length) params.set("ids", ids.join(","));
    router.push(params.toString() ? `/compare?${params}` : "/compare", { scroll: false });
  };

  return (
    <div ref={boxRef}>
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((school, index) => (
          <span
            key={school.id}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-card py-1.5 pl-3 pr-1.5 text-[0.82rem]"
          >
            <span className="tnum grid size-5 shrink-0 place-items-center rounded-full bg-ink text-[0.66rem] font-semibold text-paper">
              {index + 1}
            </span>
            <span className="max-w-[16rem] truncate font-medium text-ink">{school.name}</span>
            <button
              type="button"
              aria-label={`Remove ${school.name}`}
              onClick={() => push(selected.filter((s) => s.id !== school.id).map((s) => s.id))}
              className="grid size-5 place-items-center rounded-full text-muted transition-colors hover:bg-paper-deep hover:text-ink"
            >
              <CloseIcon className="size-3" />
            </button>
          </span>
        ))}

        {selected.length < max ? (
          <div className="relative w-full sm:w-80">
            <div className="flex items-center gap-2 rounded-full border border-dashed border-line-strong bg-paper-deep/40 px-3 py-1.5 focus-within:border-teal/60 focus-within:bg-card">
              {selected.length === 0 ? (
                <SearchIcon className="size-4 shrink-0 text-muted" />
              ) : (
                <PlusIcon className="size-4 shrink-0 text-muted" />
              )}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setOpen(true)}
                placeholder={selected.length === 0 ? "Add a school to compare…" : "Add another…"}
                className="w-full bg-transparent text-[0.82rem] text-ink outline-none placeholder:text-muted"
                aria-label="Search for a school to compare"
              />
            </div>

            {open && hits.length > 0 ? (
              <ul className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-[0_18px_40px_-20px_rgb(16_35_29/0.35)]">
                {hits.map((hit) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onClick={() => {
                        push([...selected.map((s) => s.id), hit.id]);
                        setQuery("");
                        setOpen(false);
                      }}
                      className="flex w-full flex-col items-start px-3.5 py-2 text-left hover:bg-paper-deep"
                    >
                      <span className="w-full truncate text-[0.83rem] font-medium text-ink">
                        {hit.name}
                      </span>
                      <span className="text-[0.72rem] text-muted">{hit.area}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
