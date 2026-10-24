#!/usr/bin/env node
/**
 * Packs the source CSVs into `src/generated/sources.json`.
 *
 * The app used to read the CSVs from disk at request time, which needs a Node
 * filesystem — unavailable on Cloudflare's runtime. Embedding the raw text as a
 * JSON module lets the same `parseCsv()` parse it on any runtime, and keeps the
 * CSVs themselves as the single source of truth.
 *
 * Run automatically by `predev` and `prebuild`; no dependencies required.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) =>
  readFileSync(path.join(root, relative), "utf8").replace(/^\uFEFF/, "");

const payload = {
  master: read("data/sources/schools-master.csv"),
  enrolment: read("data/sources/schools-enrolment.csv"),
  contacts: read("data/sources/schools-contacts.csv"),
};

const outDir = path.join(root, "src", "generated");
mkdirSync(outDir, { recursive: true });

const json = JSON.stringify(payload);
const outFile = path.join(outDir, "sources.json");
writeFileSync(outFile, json, "utf8");

const kb = (json.length / 1024).toFixed(0);
console.log(`generated src/generated/sources.json — ${kb} KB`);
