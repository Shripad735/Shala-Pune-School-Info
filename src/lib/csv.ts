import SOURCES from "@/generated/sources.json";

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

/**
 * The CSVs are embedded as text at build time by `scripts/generate-data.mjs`,
 * so nothing is read from disk at runtime. Parsing is memoised per process.
 */
const TABLE_BY_FILE: Record<string, string> = {
  "schools-master.csv": SOURCES.master,
  "schools-enrolment.csv": SOURCES.enrolment,
  "schools-contacts.csv": SOURCES.contacts,
};

export function readSourceCsv(fileName: string): string[][] {
  const cached = rawCache.get(fileName);
  if (cached) return cached;

  const text = TABLE_BY_FILE[fileName];
  if (typeof text !== "string") {
    throw new Error(
      `Unknown source table "${fileName}". Run \`node scripts/generate-data.mjs\` to regenerate src/generated/sources.json.`,
    );
  }

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
