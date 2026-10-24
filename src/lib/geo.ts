import LOCALITIES from "../../data/geo/localities.json";

export interface GeocodeEntry {
  lat: number | null;
  lon: number | null;
  display?: string;
  score?: number;
}

/**
 * Area coordinates, resolved once at build time with OpenStreetMap Nominatim and
 * imported directly so no filesystem access is needed at runtime.
 */
export function localityCoords(): Record<string, GeocodeEntry> {
  return LOCALITIES as Record<string, GeocodeEntry>;
}
