import { NextResponse } from "next/server";
import { getDirectory, searchSchools } from "@/lib/data";
import { slugify } from "@/lib/format";

let areaIndex: { slug: string; name: string; count: number; zone: string }[] | null = null;

function areas() {
  if (!areaIndex) {
    areaIndex = getDirectory().areas.map((a) => ({
      slug: a.slug,
      name: a.name,
      count: a.count,
      zone: a.zone,
    }));
  }
  return areaIndex;
}

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ schools: [], areas: [] });
  }
  const needle = q.toLowerCase();
  const schoolHits = searchSchools(q, 6).map((s) => ({
    id: s.id,
    name: s.name,
    area: s.areaLabel,
    level: s.level,
  }));
  const areaHits = areas()
    .filter((a) => a.name.toLowerCase().includes(needle) || slugify(a.name).includes(slugify(q)))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return NextResponse.json({ schools: schoolHits, areas: areaHits });
}
