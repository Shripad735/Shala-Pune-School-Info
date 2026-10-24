"""Third geocoding pass: tolerate the spellings UDISE uses.

UDISE labels are often concatenated or prefixed ("MITHA NAGAR", "W. S.
SAINATHNAGAR", "KALEPADAL MOHAMMADWADI"), which the plain first pass cannot
match. This pass tries several spellings per name and accepts a hit only when
a distinctive token really appears in the result and the point is inside Pune.
"""
from __future__ import annotations

import json
import re
import socket
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

socket.setdefaulttimeout(12)

UA = "pune-schools-explorer/1.0 (local build script)"
CITY = (18.5204, 73.8567)
MAX_KM = 14.0
VIEWBOX = "73.60,18.90,74.15,18.30"
DROP = {"W", "S", "GEN", "ST", "CO", "KD", "BK", "INST", "NAG", "NAGAR", "PARK", "ROAD", "BAZAR", "BAGH"}


def alnum(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).upper()
    return re.sub(r"[^A-Z0-9]+", "", value)


def words(value: str) -> list[str]:
    value = unicodedata.normalize("NFKD", value).upper()
    return [w for w in re.split(r"[^A-Z0-9]+", value) if w]


def km(lat: float, lon: float) -> float:
    from math import asin, cos, radians, sin, sqrt

    dlat = radians(lat - CITY[0])
    dlon = radians(lon - CITY[1])
    h = sin(dlat / 2) ** 2 + cos(radians(CITY[0])) * cos(radians(lat)) * sin(dlon / 2) ** 2
    return 2 * 6371 * asin(sqrt(h))


def search(query: str) -> list[dict]:
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "q": query, "format": "jsonv2", "limit": 5,
        "viewbox": VIEWBOX, "addressdetails": 0, "countrycodes": "in",
    })
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=12) as fh:
        return json.loads(fh.read().decode("utf-8"))


def spellings(name: str) -> list[str]:
    w = [x for x in words(name) if x not in DROP and len(x) > 1]
    out: list[str] = []
    if not w:
        return out
    out.append(" ".join(w))
    out.append("".join(w))
    out.append(w[0])
    if len(w) > 1:
        out.append(w[-1])
        out.append(f"{w[0]} {w[-1]}")
    seen: set[str] = set()
    uniq = []
    for s in out:
        if s and s not in seen:
            seen.add(s)
            uniq.append(s)
    return uniq


def main() -> None:
    path = Path(sys.argv[1])
    data: dict[str, dict] = json.loads(path.read_text(encoding="utf-8"))

    # drop entries that landed outside the city (bad earlier fuzzy matches)
    for name, entry in list(data.items()):
        if entry.get("lat") and km(entry["lat"], entry["lon"]) > MAX_KM:
            print(f"DROP {name} outside Pune ({km(entry['lat'], entry['lon']):.1f}km)", flush=True)
            data[name] = {"lat": None, "lon": None}

    missing = [n for n, v in data.items() if not v.get("lat")]
    print(f"missing {len(missing)}: {'; '.join(missing)}\n", flush=True)

    for name in missing:
        hit = None
        for cand in spellings(name):
            key = alnum(cand)
            try:
                results = search(f"{cand}, Pune, Maharashtra, India")
            except Exception as exc:  # noqa: BLE001
                print(f"ERR  {name} :: {exc}", flush=True)
                time.sleep(2)
                continue
            time.sleep(1.05)
            for r in results:
                lat, lon = float(r["lat"]), float(r["lon"])
                if km(lat, lon) > MAX_KM:
                    continue
                blob = alnum(r.get("display_name", ""))
                if len(key) >= 5 and key not in blob:
                    continue
                hit = (cand, r, lat, lon)
                break
            if hit:
                break
        if not hit:
            print(f"MISS {name}", flush=True)
            continue
        cand, r, lat, lon = hit
        data[name] = {
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "display": r.get("display_name", ""),
            "type": r.get("type", ""),
            "placeRank": r.get("place_rank", 0),
            "score": 0.6,
            "hits": 1,
            "query": f"{cand}, Pune",
            "approximate": cand != name.replace(",", " ").upper(),
        }
        print(f"OK   {name:26s} via '{cand}' {lat:.4f},{lon:.4f} {km(lat, lon):4.1f}km  {r.get('display_name','')[:60]}", flush=True)
        path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")

    path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    ok = sum(1 for v in data.values() if v.get("lat"))
    print(f"\ngeocoded={ok}/{len(data)}")


if __name__ == "__main__":
    main()
