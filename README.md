# Shala — Pune school finder

A parent-friendly way to look up schools across Pune: search by area, compare facilities,
check class sizes and staffing, and get the phone number before you visit.

Built with Next.js 15 (App Router), React 19, Tailwind CSS v4 and TypeScript.

## What it does

- **Search 1,246 schools** across 76 Pune areas, with live suggestions as you type
- **Filter** by stage, medium of instruction, who runs the school, and facilities
- **Compare** up to three schools side by side
- **Near me** — rank schools by distance from your location
- **Light and dark themes**, remembered between visits
- Works on phones, tablets and desktops

## Running locally

Requires **Node 20.9+** and **pnpm**.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm build && pnpm start   # production build
pnpm typecheck             # TypeScript check
```

No environment variables, API keys or database are needed.

## Deploying

### Vercel

Import the repository and deploy — the Next.js preset is detected automatically.
Build command `pnpm build`, no environment variables required.

### Cloudflare

The app reads its data from `data/` at request time, so it needs a **Node-compatible
runtime**, not the Edge runtime. Use OpenNext's Cloudflare adapter
(`@opennextjs/cloudflare`) with the `nodejs_compat` compatibility flag.
`next.config.ts` already declares `outputFileTracingIncludes`, which makes sure the
`data/` folder is bundled with the server output.

## Data

School names, class-wise enrolment, facilities and contact details come from the UDISE
school directory and Pune Municipal Corporation records for Pune blocks 272514–272518
(1,246 schools). Area coordinates come from OpenStreetMap via Nominatim.

The exact CSV files the app reads are in [`data/sources`](data/sources); area coordinates
are cached in [`data/geo/localities.json`](data/geo/localities.json). Nothing is fetched at
runtime.

## Licence

MIT — see [LICENSE](LICENSE).
