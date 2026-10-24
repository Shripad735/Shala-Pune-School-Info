# Shala — Pune school finder

A parent-friendly way to look up schools across Pune. Search by area, compare facilities,
check class sizes and staffing, and get the phone number before you visit.

Built with **Next.js 15 (App Router)**, **React 19**, **Tailwind CSS v4** and TypeScript.
No database yet — the app reads the source CSV files directly from `data/sources`.

---

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm build && pnpm start   # production
pnpm typecheck             # tsc --noEmit
node tools/shoot.mjs <url> <out.png> --w 390 --mobile --theme dark   # visual check
```

---

## What data is used

Everything lives in [`data/`](data). The original files are copied verbatim into
`data/sources` so the app is self-contained.

| Source file | Rows | What it gives the app |
| --- | --- | --- |
| `schools-master.csv` | 1,246 | School identity + ~95 facility columns: building, classrooms, toilets, water, electricity, library, playground, ramps, solar, boundary wall, special educator. Also area, cluster and zone. |
| `schools-enrolment.csv` | 1,246 | Class-wise enrolment (pre-primary to Std 12) split by boys/girls, plus teacher and classroom counts. |
| `schools-contacts.csv` | 1,254 | Human-readable management and category labels, grade range (Std 1–8 etc.), medium of instruction, phone numbers, email, website, teachers in position. |
| `data/geo/localities.json` | 76 | Coordinates for 63 of Pune's 76 recorded areas, resolved once with OpenStreetMap Nominatim and cached so the app never needs the network. |

### Files deliberately **not** used

| File | Why not |
| --- | --- |
| `Pune-D22B-Education_Data.xls` | Byte-for-byte the same table as `schools-master.csv`, just in Excel form. Re-exporting it added nothing. |
| `25-26/` (7 UDISE+ CSVs) | 7,399 schools for the whole district, but the public extract replaces every school code with a random token — matched on real UDISE codes the overlap with the named directory is exactly **zero**. It could only ever produce district-level aggregates, which is not what this app is for, so it was dropped rather than shipped as a bolted-on statistics page. |
| `2725_enr1.csv`, `2725_enr2.csv` | Anonymised enrolment tables whose `item_group`/`item_id` coding is not published in the release. The per-school enrolment in `schools-enrolment.csv` is richer and unambiguous, so these were dropped rather than guessed at. |
| `634d3dd6…csv`, `ce0ec751…csv` | Six-row and one-row city/ward aggregates — too coarse to drive any screen. |
| `aa134345…csv` | 71 geocoded PMC school *buildings* by name. Their names do not join to UDISE school codes, so they could not be attached to schools honestly. Superseded by proper geocoding of the areas. |
| `25-26/*.pdf` | Fact-sheet PDFs with subset-embedded fonts; their text layer is not extractable. |

---

## How the data is cleaned

All of this happens in [`src/lib/data.ts`](src/lib/data.ts) and
[`src/lib/dictionaries.ts`](src/lib/dictionaries.ts):

- **Names** are UDISE ALL-CAPS. `displayName()` title-cases them while preserving acronyms
  (`PMC`, `K.E.M.`) and initials. Area names go through `titleCaseArea()`.
- **Management** comes from the PMC sheet's plain-language labels; `MNC` is shown as
  “Municipal Corporation (PMC)” and everything is bucketed into
  PMC / Government / Aided / Unaided / Central / Other.
- **Stage** is derived from the recorded grade range, not from the category code, because
  the codes are occasionally inconsistent between files.
- **Students per teacher** is total enrolment ÷ teachers on roll. Some schools clearly
  report only part of their staff, so the school page says so instead of implying a verdict.
- **Facility essentials** are eight transparent checks (working toilets for both genders,
  electricity, drinking water, library, playground, ramp, pucca boundary wall, separate
  head teacher's room). There is no invented “quality score”.
- **Coordinates** are attached to areas, never to individual schools. 13 areas could not be
  resolved reliably and are left blank — a missing pin beats a wrong one. Because a whole
  area shares one point, “near me” interleaves one school per area instead of listing twelve
  schools from the same street with identical distances.

---

## Theming

Light and dark are the same design tokens with two values. `@theme` in
[`globals.css`](src/app/globals.css) defines the light palette, and a plain `.dark` block
re-points the same `--color-*` variables — so every existing utility (`bg-card`,
`text-ink-soft`, `border-line`, …) flips without a single `dark:` class on a component.

A tiny inline script in `layout.tsx` applies the saved (or system) preference before first
paint, so there is no light-then-dark flash. `ThemeToggle` writes `localStorage.theme` and
toggles the class. Where a utility is genuinely theme-specific (hero gradient, grain,
scrollbar, select chevron), there is an explicit `.dark` rule.

---

## Project layout

```
src/
  app/
    page.tsx                Home — hero search, areas, feature cards, medium mix
    schools/page.tsx        Filterable directory (URL-driven, server-rendered)
    schools/[id]/page.tsx   School detail: enrolment chart, facilities, staff, contact
    areas/page.tsx          All 76 areas grouped by zone
    areas/[slug]/page.tsx   One area + nearby areas
    near/page.tsx           Distance ranking from a shared location (lat/lon in the URL)
    compare/page.tsx        Up to three schools, side by side
    api/suggest/route.ts    Live search suggestions
  lib/
    csv.ts                  RFC 4180 parser (quoted fields, embedded newlines), file cache
    data.ts                 Builds the directory once per process
    dictionaries.ts         UDISE code → label maps
    brand.ts                Product name and description in one place
    format.ts               Name casing, numbers, PTR, distance
    geo.ts                  Area coordinate lookup
  components/               Header, theme toggle, footer, cards, filters, search, charts
data/
  sources/                  The source CSVs, verbatim
  geo/localities.json       Geocoded area centres
tools/
  shoot.mjs                 CDP screenshots — real mobile widths and dark mode
  geocode-localities.py     Nominatim geocoding, strict token validation (pass 1)
  geocode-pass2/3/4.py      Escalation passes for areas Nominatim could not place
  xls-to-csv.py             Minimal BIFF8 .xls reader, used to confirm the .xls duplicate
  pdf-text.py               Minimal PDF text extractor, used to check the fact sheets
```

The `tools/` Python scripts are build-time only — the app never calls the network.
Re-running them regenerates `data/geo/localities.json`.

### Moving to a database later

The whole data surface is four functions in `src/lib/data.ts`: `getDirectory()`,
`filterSchools()`, `getSchool()` and `nearbySchools()`. Replace their bodies with SQL
queries and every page keeps working — no component reads a CSV directly.

---

## Caveats worth telling users

- Enrolment is Std 1–12; pre-primary (balwadi) numbers are reported separately and shown
  as a hint on the school page.
- The directory covers Pune city blocks 272514–272518 — not Pimpri-Chinchwad or the rural
  talukas.
- Internet, computer labs and smart classrooms are not recorded for individual city
  schools, so the school pages do not pretend to know them.
- Names, phone numbers and facility counts are as reported by the schools. Always confirm
  with the school before applying.

## Attribution

- UDISE school directory and facilities for Pune blocks 272514–272518.
- Pune Municipal Corporation school contact records.
- Area coordinates: © OpenStreetMap contributors, ODbL, via Nominatim.

## Licence

MIT — see [LICENSE](LICENSE).
