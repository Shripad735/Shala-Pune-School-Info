const ACRONYMS = new Set([
  "PMC", "PCMC", "ZP", "Z.P", "KEM", "K.E.M", "MIT", "JNV", "KV", "CBSE", "ICSE",
  "SSC", "HSC", "MNC", "DP", "MC", "MH", "NGO", "ITI", "IIT", "SS", "SEC", "JR",
  "PRT", "TGT", "PGT", "MS", "BS", "OS", "BSNL", "RTE", "UDISE", "SMCS", "PTA",
]);

const SMALL_WORDS = new Set(["a", "an", "and", "the", "of", "for", "in", "on", "at", "to", "by"]);

/**
 * UDISE names are shouted in capitals. Title-case them for display while
 * leaving acronyms, initials and school numbers alone.
 */
export function displayName(raw: string): string {
  const name = (raw || "").replace(/\s+/g, " ").trim();
  if (!name) return "Unnamed school";
  const letters = name.replace(/[^A-Za-z]/g, "");
  const caps = name.replace(/[^A-Z]/g, "");
  if (letters.length < 4 || caps.length / letters.length < 0.7) return name;

  return name
    .split(" ")
    .map((token, index) => {
      if (!token) return token;
      if (/^[0-9]+$/.test(token)) return token;
      const bare = token.replace(/[^A-Za-z]/g, "");
      if (!bare) return token;
      if (ACRONYMS.has(bare.toUpperCase())) return token.toUpperCase();
      if ((token.match(/\./g) ?? []).length >= 2) return token.toUpperCase();
      if (bare.length === 1) return token.toUpperCase();
      const lower = token.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower.replace(/[^a-z]/g, ""))) return lower;
      return lower.replace(/(^|[-/.])([a-z])/g, (_, p1: string, p2: string) => p1 + p2.toUpperCase());
    })
    .join(" ");
}

export function slugify(value: string): string {
  return (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * A handful of UDISE area labels are misspelled or abbreviated rather than
 * romanised differently. Only unambiguous cases are corrected; the underlying
 * value (and therefore the URL slug) always stays as recorded.
 */
const AREA_LABEL_FIXES: Record<string, string> = {
  "AAGAKHAN PALACE": "Aga Khan Palace",
  "KONDHAWA BK": "Kondhwa Budruk",
};

export function titleCaseArea(raw: string): string {
  const value = (raw || "").replace(/\s+/g, " ").trim();
  if (!value) return "Unspecified area";
  const fixed = AREA_LABEL_FIXES[value.toUpperCase()];
  if (fixed) return fixed;
  return value
    .split(" ")
    .map((word) => {
      if (!word) return word;
      if (/^[0-9]+$/.test(word)) return word;
      if ((word.match(/\./g) ?? []).length >= 2) return word.toUpperCase(); // K.E.M., W.S.
      const bare = word.replace(/[^A-Za-z]/g, "").toUpperCase();
      if (bare.length <= 3 && ACRONYMS.has(bare)) return word.toUpperCase();
      const lower = word.toLowerCase();
      return lower.replace(/(^|[-/.])([a-z])/g, (_, p1: string, p2: string) => p1 + p2.toUpperCase());
    })
    .join(" ");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
}

export function formatCompact(value: number): string {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")} L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

export function ptrLabel(ptr: number | null): string {
  if (ptr === null || !Number.isFinite(ptr)) return "\u2014";
  return `${Math.round(ptr)}:1`;
}

export function ptrTone(ptr: number | null): "good" | "ok" | "warn" | "none" {
  if (ptr === null) return "none";
  if (ptr <= 25) return "good";
  if (ptr <= 30) return "ok";
  return "warn";
}

export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
