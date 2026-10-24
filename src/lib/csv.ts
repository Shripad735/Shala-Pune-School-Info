import { readFileSync } from "node:fs";
import path from "node:path";

const rawCache = new Map<string, string[][]>();

/**
 * RFC 4180 parser. Handles quoted fields, doubled quotes, CRLF and embedded
 * newlines — the PMC exports use all of them.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.length > 1 || (r[0] ?? "").trim() !== "");
}

/** Read a CSV that lives under `<project>/data/sources`. Cached per process. */
export function readSourceCsv(fileName: string): string[][] {
  const cached = rawCache.get(fileName);
  if (cached) return cached;

  const file = path.join(process.cwd(), "data", "sources", fileName);
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  rawCache.set(fileName, rows);
  return rows;
}

export type Row = Record<string, string>;

/** Turn a header row + body into records, trimming headers of stray spaces. */
export function toRecords(rows: string[][]): Row[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.replace(/\u00a0/g, " ").trim());
  const out: Row[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const line = rows[r];
    if (line.every((cell) => cell.trim() === "")) continue;
    const rec: Row = {};
    for (let c = 0; c < header.length; c += 1) {
      rec[header[c]] = (line[c] ?? "").trim();
    }
    out.push(rec);
  }
  return out;
}

export function loadRecords(fileName: string): Row[] {
  return toRecords(readSourceCsv(fileName));
}
