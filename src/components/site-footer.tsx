import Link from "next/link";
import { getDirectory } from "@/lib/data";
import { BRAND } from "@/lib/brand";

export function SiteFooter() {
  const { totals } = getDirectory();
  return (
    <footer className="mt-24 border-t border-line bg-paper-deep/70">
      <div className="shell grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold text-ink">{BRAND.name}</p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
            {BRAND.tagline} — a friendlier window into {totals.schools.toLocaleString("en-IN")}{" "}
            schools across Pune. Search by area, compare what schools actually offer, and
            keep the phone numbers you need in one place.
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
            <li>UDISE school directory &amp; facilities, Pune blocks</li>
            <li>Pune Municipal Corporation school contact sheet</li>
            <li>Area coordinates: OpenStreetMap via Nominatim</li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            Map data &copy; OpenStreetMap contributors, ODbL.
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            School names, enrolment and facilities are as reported in the source records. Confirm
            details with the school before applying.
          </p>
          <p>
            {BRAND.name} · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
