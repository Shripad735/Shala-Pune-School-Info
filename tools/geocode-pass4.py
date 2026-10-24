"""Fourth geocoding pass: ask Overpass for every Pune place whose name is close
to the localities we still could not pin down, then pick the best token match.

Nominatim's free-text search fails on the concatenated spellings UDISE uses;
Overpass lets us fetch candidate names in one query and score them ourselves.
"""
from __future__ import annotations

import json
import re
import socket
import sys
import unicodedata
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

socket.setdefaulttimeout(90)

UA = "pune-schools-explorer/1.0 (local build script)"
CITY = (18.5204, 73.8567)
MAX_KM = 13.0
# Pune city envelope for Overpass (south, west, north, east)
BBOX = (18.40, 73.72, 18.65, 74.02)

STOP = {"W", "S", "GEN", "ST", "CO", "KD", "BK", "INST", "NAGAR", "PARK", "ROAD", "BAZAR", "AND", "THE"}
# only search for tokens that are distinctive enough to be a place name
MIN_TOKEN = 5


def words(value: str) -> list[str]:
    value = unicodedata.normalize("NFKD", value).upper()
    return [w for w in re.split(r"[^A-Z0-9]+", value) if w]


def norm(value: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", unicodedata.normalize("NFKD", value).upper())


def km(lat: float, lon: float) -> float:
    from math import asin, cos, radians, sin, sqrt

    dlat = radians(lat - CITY[0])
    dlon = radians(lon - CITY[1])
    h = sin(dlat / 2) ** 2 + cos(radians(CITY[0])) * cos(radians(lat)) * sin(dlon / 2) ** 2
    return 2 * 6371 * asin(sqrt(h))


def overpass(regex: str) -> list[dict]:
    query = f"""
[out:json][timeout:80];
(
  node["name"~"{regex}",i]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
  way["name"~"{regex}",i]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
  relation["name"~"{regex}",i]({BBOX[0]},{BBOX[1]},{BBOX[2]},{BBOX[3]});
);
out center tags;
"""
    body = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(
        "https://overpass-api.de/api/interpreter",
        data=body,
        headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=90) as fh:
        return json.loads(fh.read().decode("utf-8"))["elements"]


def main() -> None:
    path = Path(sys.argv[1])
    data: dict[str, dict] = json.loads(path.read_text(encoding="utf-8"))

    # revert matches that are plainly in the wrong neighbourhood
    REVERT = [
        "CITY POST GADIKHANA",
        "DOKE TALIM RAMOSHI GATE",
        "SATAV WADI",
        "PRABHAT ROAD",
        "SAMTA BHUMI",
        "GEN. A. VAIDYA STEDIUM",
        "SHIVDARSHAN",
    ]
    for name in REVERT:
        if data.get(name, {}).get("lat"):
            print(f"REVERT {name} ({data[name].get('query')})", flush=True)
            data[name] = {"lat": None, "lon": None}

    missing = [n for n, v in data.items() if not v.get("lat")]
    print(f"still missing: {missing}\n", flush=True)
    if not missing:
        return

    tokens: set[str] = set()
    for name in missing:
        for w in words(name):
            if w in STOP or len(w) < MIN_TOKEN:
                continue
            tokens.add(w[:7])

    pattern = "|".join(sorted(tokens))
    print(f"overpass name pattern ({len(tokens)} tokens): {pattern}\n", flush=True)
    try:
        elements = overpass(pattern)
    except Exception as exc:  # noqa: BLE001
        print(f"OVERPASS FAILED: {exc}")
        return
    print(f"overpass returned {len(elements)} elements", flush=True)

    places = []
    for el in elements:
        name = el.get("tags", {}).get("name")
        if not name:
            continue
        if "center" in el:
            lat, lon = el["center"]["lat"], el["center"]["lon"]
        elif "lat" in el:
            lat, lon = el["lat"], el["lon"]
        else:
            continue
        places.append({"name": name, "lat": lat, "lon": lon, "key": norm(name)})
    print(f"usable named places: {len(places)}\n", flush=True)

    for name in missing:
        want = [w for w in words(name) if w not in STOP and len(w) >= 3]
        best = None
        for place in places:
            score = 0.0
            whole = alnum = norm(name)
            if alnum and (alnum in place["key"] or place["key"] in alnum):
                score = 0.95
            else:
                for w in want:
                    score = max(score, SequenceMatcher(None, w, place["name"].upper()).ratio() * 0.7)
                    for pw in words(place["name"]):
                        if w == pw:
                            score = max(score, 0.9)
                        elif len(w) >= 5 and (w in pw or pw in w):
                            score = max(score, 0.78)
            if score <= 0:
                continue
            d = km(place["lat"], place["lon"])
            if d > MAX_KM:
                continue
            key = (round(score, 3), -d)
            if best is None or key > best[0]:
                best = (key, place, score)
        if not best or best[2] < 0.72:
            print(f"MISS {name}", flush=True)
            continue
        _, place, score = best
        data[name] = {
            "lat": round(place["lat"], 6),
            "lon": round(place["lon"], 6),
            "display": place["name"],
            "type": "overpass",
            "placeRank": 0,
            "score": round(score, 2),
            "hits": 1,
            "query": f"overpass:{pattern[:20]}",
            "approximate": True,
        }
        print(f"OK   {name:26s} -> {place['name']} {place['lat']:.4f},{place['lon']:.4f} "
              f"{km(place['lat'], place['lon']):4.1f}km score {score:.2f}", flush=True)
        path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")

    path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    ok = sum(1 for v in data.values() if v.get("lat"))
    print(f"\ngeocoded={ok}/{len(data)}")


if __name__ == "__main__":
    main()
