"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRightIcon, PinIcon, SearchIcon } from "@/components/icons";

interface Suggestion {
  kind: "school" | "area";
  key: string;
  label: string;
  hint: string;
  href: string;
}

export function SearchBox({
  placeholder = "Search a school, area or code…",
  autoFocus = false,
  size = "lg",
}: {
  placeholder?: string;
  autoFocus?: boolean;
  size?: "lg" | "sm";
}) {
  const router = useRouter();
  const listId = useId();
  const [value, setValue] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) {
      setItems([]);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          schools: { id: string; name: string; area: string; level: string }[];
          areas: { slug: string; name: string; count: number }[];
        };
        const next: Suggestion[] = [
          ...data.areas.map((a) => ({
            kind: "area" as const,
            key: `area-${a.slug}`,
            label: a.name,
            hint: `${a.count} schools`,
            href: `/areas/${a.slug}`,
          })),
          ...data.schools.map((s) => ({
            kind: "school" as const,
            key: `school-${s.id}`,
            label: s.name,
            hint: `${s.area} · ${s.level}`,
            href: `/schools/${s.id}`,
          })),
        ];
        setItems(next);
        setActive(-1);
      } catch {
        /* aborted or offline — keep the previous list */
      }
    }, 160);
    return () => clearTimeout(timer);
  }, [value]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const submit = () => {
    if (active >= 0 && items[active]) {
      go(items[active].href);
      return;
    }
    const term = value.trim();
    if (!term) return;
    go(`/schools?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      submit();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const tall = size === "lg";

  return (
    <div ref={boxRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-xl border border-line bg-card shadow-[0_1px_2px_rgb(16_35_29/0.05)] transition-shadow focus-within:border-teal/50 focus-within:shadow-[0_0_0_4px_rgb(13_122_99/0.09)] ${
          tall ? "px-4 py-3" : "px-3 py-2"
        }`}
      >
        <SearchIcon className={tall ? "size-5 shrink-0 text-muted" : "size-4 shrink-0 text-muted"} />
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search schools and areas"
          className={`w-full bg-transparent text-ink outline-none placeholder:text-muted/80 [&::-webkit-search-cancel-button]:appearance-none ${
            tall ? "text-[0.98rem]" : "text-sm"
          }`}
        />
        <button
          type="button"
          onClick={submit}
          aria-label="Search"
          className={`shrink-0 rounded-lg bg-ink font-semibold text-paper transition-transform hover:-translate-y-px ${
            tall ? "px-3 py-1.5 text-sm sm:px-3.5" : "px-2.5 py-1 text-xs sm:px-3"
          }`}
        >
          <span className="hidden sm:inline">Search</span>
          <ArrowRightIcon className="size-4 sm:hidden" />
        </button>
      </div>

      {open && items.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-[0_18px_40px_-20px_rgb(16_35_29/0.35)]"
        >
          {items.map((item, index) => (
            <li key={item.key} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => go(item.href)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors ${
                  index === active ? "bg-paper-deep" : ""
                }`}
              >
                <span className="text-muted">
                  {item.kind === "area" ? (
                    <PinIcon className="size-4" />
                  ) : (
                    <SearchIcon className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.86rem] font-medium text-ink">
                    {item.label}
                  </span>
                  <span className="block truncate text-[0.72rem] text-muted">{item.hint}</span>
                </span>
                <ArrowRightIcon className="size-3.5 shrink-0 text-line-strong" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
