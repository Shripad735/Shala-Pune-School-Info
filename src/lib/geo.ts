import { readFileSync } from "node:fs";
import path from "node:path";

export interface GeocodeEntry {
  lat: number | null;
  lon: number | null;
  display?: string;
  score?: number;
}

let cached: Record<string, GeocodeEntry> | null = null;

/**
 * Area coordinates, resolved once at build time with OpenStreetMap Nominatim
 * and stored in `data/geo/localities.json`. No network calls at runtime.
 */
export function localityCoords(): Record<string, GeocodeEntry> {
  if (cached) return cached;
  try {
    const file = path.join(process.cwd(), "data", "geo", "localities.json");
    cached = JSON.parse(readFileSync(file, "utf8")) as Record<string, GeocodeEntry>;
  } catch {
    cached = {};
  }
  return cached;
}
