import type { Gender, Level, ManagementGroup } from "./types";

export const MANAGEMENT_GROUPS: ManagementGroup[] = [
  "PMC",
  "Government",
  "Aided",
  "Unaided",
  "Central",
  "Other",
];

/**
 * UDISE management code -> label, read off the PMC contact sheet where every
 * school carries a plain-language management name. Codes outside that sheet
 * fall back to the UDISE+ national list.
 */
export const MANAGEMENT_LABELS: Record<string, string> = {
  "1": "Department of Education",
  "4": "Government Aided",
  "8": "Unrecognised",
  "10": "Social Welfare",
  "11": "Social Welfare Aided",
  "12": "Social Welfare",
  "17": "Municipal Corporation (PMC)",
  "19": "Unaided (Private)",
  "22": "Central Government",
  "25": "Partially Aided",
  "27": "Self-Financed (Private)",
  "97": "Madarsa (recognised)",
};

export function managementGroupOf(label: string): ManagementGroup {
  const l = label.toLowerCase();
  if (l.includes("municipal") || l.includes("mnc")) return "PMC";
  if (l.includes("central")) return "Central";
  if (l.includes("department of education")) return "Government";
  if (l.includes("aided")) return "Aided";
  if (l.includes("self") || l.includes("unaided") || l.includes("private")) return "Unaided";
  return "Other";
}

/**
 * UDISE school-category codes. The contact sheet spells them out, so the labels
 * below match what that sheet calls them.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  "1": "Primary only",
  "2": "Primary with Upper Primary",
  "3": "Primary with Upper Primary & Secondary/Higher Secondary",
  "4": "Upper Primary only",
  "5": "Upper Primary with Secondary/Higher Secondary",
  "6": "Primary with Upper Primary & Secondary",
  "7": "Upper Primary with Secondary",
  "8": "Secondary only",
  "10": "Secondary with Higher Secondary",
  "11": "Higher Secondary only",
};

export function levelOf(highClass: number): Level {
  if (highClass <= 5) return "Primary";
  if (highClass <= 8) return "Upper Primary";
  if (highClass <= 10) return "Secondary";
  return "Higher Secondary";
}

export function stageOf(low: number, high: number): string {
  if (low === high) return `Std ${low}`;
  return `Std ${low}\u2013${high}`;
}

export function genderOf(raw: string): Gender {
  const v = raw.toLowerCase();
  if (v.startsWith("1") || v.includes("boys")) return "Boys";
  if (v.startsWith("2") || v.includes("girls")) return "Girls";
  return "Co-educational";
}

export const LEVELS: Level[] = ["Primary", "Upper Primary", "Secondary", "Higher Secondary"];

export const LEVEL_BLURB: Record<Level, string> = {
  Primary: "Std 1\u20135",
  "Upper Primary": "Up to Std 8",
  Secondary: "Up to Std 10",
  "Higher Secondary": "Up to Std 12",
};

export const GENDERS: Gender[] = ["Co-educational", "Boys", "Girls"];

/** Order matters: these are shown in this order wherever mediums are listed. */
export const MEDIUM_ORDER = [
  "English",
  "Marathi",
  "Hindi",
  "Urdu",
  "Gujarati",
  "Kannada",
  "Tamil",
  "Telugu",
  "Sindhi",
  "Malayalam",
];

const MEDIUM_ALIASES: [RegExp, string][] = [
  [/^eng/, "English"],
  [/^mar/, "Marathi"],
  [/^urd/, "Urdu"],
  [/^hin/, "Hindi"],
  [/^guj/, "Gujarati"],
  [/^kan/, "Kannada"],
  [/^tam/, "Tamil"],
  [/^tel/, "Telugu"],
  [/^sin/, "Sindhi"],
  [/^mal/, "Malayalam"],
  [/^ben/, "Bengali"],
  [/^san/, "Sanskrit"],
];

export function normalizeMedium(raw: string): string {
  const v = (raw || "").trim().toLowerCase();
  if (!v) return "Not recorded";
  const alias = MEDIUM_ALIASES.find(([pattern]) => pattern.test(v));
  if (alias) return alias[1];
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export const BOUNDARY_WALL_LABELS: Record<string, string> = {
  "1-Pucca": "Pucca wall",
  "2-Pucca but Broken": "Pucca wall (broken)",
  "3-Barbed wire fencing": "Barbed-wire fencing",
  "4-Hedges": "Hedges",
  "5-No boundary wall": "No boundary wall",
  "6-Others": "Other",
  "7-Partial": "Partial wall",
  "8-Under Construction": "Under construction",
};

export const BUILDING_LABELS: Record<string, string> = {
  "1-Private": "Private building",
  "2-Rented": "Rented building",
  "3-Government": "Government building",
  "4-Govt. school in rent free building": "Rent-free government building",
  "7-Building Under Construction": "Under construction",
  "10-School running in other Department Building": "Shared department building",
};

export const SPECIAL_EDUCATOR_LABELS: Record<string, string> = {
  "1- Dedicated": "Dedicated special educator",
  "2-At Cluster level": "Cluster-level support",
  "3-No": "None",
};
