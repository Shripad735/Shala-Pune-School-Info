import type { MetadataRoute } from "next";
import { getDirectory } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { schools, areas } = getDirectory();
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/schools`, lastModified: now, priority: 0.9 },
    { url: `${base}/areas`, lastModified: now, priority: 0.9 },
    { url: `${base}/near`, lastModified: now, priority: 0.7 },
    { url: `${base}/compare`, lastModified: now, priority: 0.5 },
    ...areas.map((area) => ({
      url: `${base}/areas/${area.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
    ...schools.map((school) => ({
      url: `${base}/schools/${school.id}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
