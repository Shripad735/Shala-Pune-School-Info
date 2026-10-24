import Link from "next/link";
import { getDirectory } from "@/lib/data";
import { AUTHOR, BRAND, REPO_URL } from "@/lib/brand";
import { GithubIcon } from "@/components/icons";

export function SiteFooter() {
  const { totals } = getDirectory();
  return (
    <footer className="mt-24 border-t border-line bg-paper-deep/70">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold text-ink">{BRAND.name}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            {BRAND.tagline} — a friendlier window into {totals.schools.toLocaleString("en-IN")}{" "}
            schools across Pune. Search by area, compare what schools actually offer, and keep the
            phone numbers you need in one place.
          </p>
        </div>

        <div>
          <p className="eyebrow">Explore</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li><Link className="link-underline" href="/schools">All schools</Link></li>
            <li><Link className="link-underline" href="/areas">Browse by area</Link></li>
            <li><Link className="link-underline" href="/near">Schools near me</Link></li>
            <li><Link className="link-underline" href="/compare">Compare schools</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Data sources</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>UDISE school directory &amp; facilities, Pune blocks 272514–272518</li>
            <li>Pune Municipal Corporation school contact sheet</li>
            <li>Area coordinates: OpenStreetMap via Nominatim</li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            Map data &copy; OpenStreetMap contributors, ODbL.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-4 py-5 text-xs text-muted lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl">
            School names, enrolment and facilities are as reported in the source records. Confirm
            details with the school before applying.
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span>
              Built by{" "}
              <a
                href={AUTHOR.url}
                target="_blank"
                rel="noreferrer noopener"
                className="link-underline font-medium text-ink-soft transition-colors hover:text-teal-deep"
              >
                {AUTHOR.name}
              </a>
            </span>
            <span aria-hidden className="text-line-strong">·</span>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
              aria-label="Source code on GitHub"
            >
              <GithubIcon className="size-3.5" />
              Source on GitHub
            </a>
            <span aria-hidden className="text-line-strong">·</span>
            <span className="tnum">
              {BRAND.name} {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
