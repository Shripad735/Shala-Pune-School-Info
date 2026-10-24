import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND } from "@/lib/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="shell flex h-16 items-center gap-3">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label={`${BRAND.name} home`}
        >
          <span className="grid size-9 place-items-center rounded-xl bg-teal text-paper shadow-sm transition-transform group-hover:-rotate-3 dark:bg-teal-wash dark:text-teal">
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 9.5 12 4l9 5.5" />
              <path d="M5.5 11.5v7M9.8 11.5v7M14.2 11.5v7M18.5 11.5v7" />
              <path d="M3.5 20.5h17" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-[1.1rem] font-semibold tracking-tight text-ink">
              {BRAND.name}
            </span>
            <span className="hidden text-[0.68rem] font-medium tracking-wide text-muted sm:block">
              {BRAND.tagline}
            </span>
          </span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <NavLinks />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          <Link
            href="/schools"
            className="hidden items-center gap-2 rounded-full border border-line bg-card px-3.5 py-2 text-[0.84rem] font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink sm:flex"
          >
            <SearchIcon className="size-4" />
            Search
          </Link>
          <Link
            href="/near"
            className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[0.84rem] font-semibold text-paper transition-transform hover:-translate-y-px md:inline-flex"
          >
            Schools near me
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>

      <div className="shell pb-2.5 md:hidden">
        <NavLinks compact />
      </div>
    </header>
  );
}
