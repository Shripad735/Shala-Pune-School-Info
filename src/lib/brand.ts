/**
 * Product naming and attribution live here so they can be changed in one place.
 */
export const BRAND = {
  name: "Shala",
  tagline: "Pune school finder",
  description:
    "Find schools across Pune by area. Compare facilities, class sizes and contact details for 1,246 schools before you visit.",
};

export const AUTHOR = {
  name: "Shripad SK",
  url: "https://shripadkhandare.in",
} as const;

export const REPO_URL = "https://github.com/Shripad735/Shala-Pune-School-Info";

export const BRAND_TITLE_TEMPLATE = `%s · ${BRAND.name}`;

export const BRAND_DEFAULT_TITLE = `${BRAND.name} \u2014 ${BRAND.tagline}`;
