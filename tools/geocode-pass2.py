"""Second geocoding pass for localities Nominatim could not resolve from the
UDISE label alone.

Each entry supplies the query to use; `parent` entries mean "this is a
sub-locality of a bigger place, take that place's centre and mark the result
approximate". Every hit must fall within Pune city limits, otherwise it is
discarded rather than silently pinned in the wrong taluka.
"""
from __future__ import annotations

import json
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

# name -> (query, exact?)  exact=False means the query targets a parent locality.
PLAN: dict[str, tuple[str, bool]] = {
    "MITHA NAGAR": ("Mitha Nagar, Pune, Maharashtra", True),
    "KALEPADAL MOHAMMADWADI": ("Kalepadal, Pune, Maharashtra", True),
    "PRABHAT ROAD": ("Prabhat Road, Pune, Maharashtra", True),
    "K.E.M. HOSPITAL": ("KEM Hospital, Pune, Maharashtra", True),
    "HADPASAR GAVTHAN": ("Hadapsar, Pune, Maharashtra", False),
    "TILAKROAD LOKMANYA NAG": ("Lokmanya Nagar, Pune, Maharashtra", True),
    "RAUTBAUG DHANKAWADI": ("Dhankawadi, Pune, Maharashtra", False),
    "SINHAGAD INST. WADGAON": ("Vadgaon Budruk, Pune, Maharashtra", False),
    "NAGPUR CHAWL": ("Yerwada, Pune, Maharashtra", False),
    "SALISBURY PARK": ("Salisbury Park, Pune, Maharashtra", True),
    "W. S. SAINATHNAGAR": ("Sainath Nagar, Wanowrie, Pune", True),
    "W. S. AADARSHNAGAR": ("Adarsh Nagar, Wanowrie, Pune", True),
    "CITY POST GADIKHANA": ("Gadikhana, Pune, Maharashtra", True),
    "ANANDNAGAR HINGNE KD": ("Hingne Khurd, Pune, Maharashtra", False),
    "WARJE GAVTHAN": ("Warje, Pune, Maharashtra", False),
    "SATAV WADI": ("Satavwadi, Pune, Maharashtra", True),
    "ST WORKSHOP": ("Swargate, Pune, Maharashtra", False),
    "SAMTA BHUMI": ("Samta Bhumi, Pune, Maharashtra", True),
    "DOKE TALIM RAMOSHI GATE": ("Ramoshi Gate, Pune, Maharashtra", True),
    "GEN. A. VAIDYA STEDIUM": ("Vaidya Stadium, Pune, Maharashtra", True),
    "JUNA BAZAR": ("Juna Bazar, Pune, Maharashtra", True),
    "BALAJINAGAR": ("Balajinagar, Pune, Maharashtra", True),
    "LOHIYANAGAR": ("Lohia Nagar, Pune, Maharashtra", True),
    "SHINDYANCHI CHHATRI": ("Shindyanchi Chhatri, Pune, Maharashtra", True),
    "WANWADI RAMTEKADI": ("Ramtekadi, Pune, Maharashtra", True),
    "UPPER INDIRA NAGAR": ("Indira Nagar, Pune, Maharashtra", True),
    "HARKA NAGAR RAJEWADI": ("Rajewadi, Pune, Maharashtra", True),
    "SOPANBAUG KAWADE WADI": ("Sopan Baug, Pune, Maharashtra", True),
    "SHIVDARSHAN": ("Shivdarshan, Pune, Maharashtra", True),
}


def norm_tokens(value: str) -> list[str]:
    value = unicodedata.normalize("NFKD", value).upper()
    out = []
    for ch in value:
        out.append(ch if ch.isalnum() else " ")
    return [t for t in "".join(out).split() if len(t) > 1]


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


def main() -> None:
    path = Path(sys.argv[1])
    data: dict[str, dict] = json.loads(path.read_text(encoding="utf-8"))
    done = 0
    for name, (query, exact) in PLAN.items():
        try:
            results = search(query)
        except Exception as exc:  # noqa: BLE001
            print(f"ERR  {name:26s} {exc}", flush=True)
            time.sleep(2)
            continue
        time.sleep(1.05)
        pick = None
        for r in results:
            lat, lon = float(r["lat"]), float(r["lon"])
            if km(lat, lon) > MAX_KM:
                continue
            want = set(norm_tokens(name)) if exact else set()
            have = set(norm_tokens(r.get("display_name", "")))
            if exact and want and not (want & have):
                continue
            pick = r
            break
        if not pick:
            print(f"MISS {name:26s} ({len(results)} raw results)", flush=True)
            continue
        lat, lon = float(pick["lat"]), float(pick["lon"])
        data[name] = {
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "display": pick.get("display_name", ""),
            "type": pick.get("type", ""),
            "placeRank": pick.get("place_rank", 0),
            "score": 1.0 if exact else 0.5,
            "hits": 1,
            "query": query,
            "approximate": not exact,
        }
        done += 1
        print(f"OK   {name:26s} {lat:.4f},{lon:.4f} {km(lat, lon):5.1f}km  {pick.get('display_name','')[:64]}", flush=True)
        path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")

    path.write_text(json.dumps(data, indent=1, ensure_ascii=False), encoding="utf-8")
    ok = sum(1 for v in data.values() if v.get("lat"))
    print(f"\nupdated={done}  geocoded={ok}/{len(data)}")


if __name__ == "__main__":
    main()
