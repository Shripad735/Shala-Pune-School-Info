import Link from "next/link";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="shell grid min-h-[60vh] place-items-center py-20">
      <div className="max-w-lg text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">We could not find that page</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          The school or area may have been renamed in the source records, or the link may be
          from an older dataset.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link
            href="/schools"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper"
          >
            <SearchIcon className="size-4" />
            Browse all schools
          </Link>
          <Link
            href="/areas"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink-soft hover:border-line-strong hover:text-ink"
          >
            Browse by area
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
