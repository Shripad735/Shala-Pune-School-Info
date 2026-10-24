"""Geocode Pune localities (UDISE village names) via Nominatim, at build time only.

The result is cached to JSON so the web app never needs the network.

Nomination is forgiving to a fault: querying "AAGAKHAN PALACE" happily returns
"PALACE, Pune". So every candidate is scored with a token-overlap/fuzzy match
against the requested name and rejected unless it genuinely lines up, and every
hit is additionally required to fall inside the Pune district bounding box.
"""
from __future__ import annotations

import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

UA = "pune-schools-explorer/1.0 (local build script)"

# Pune district (generous): lat 18.15..19.00, lon 73.40..74.30
BOX = (18.15, 73.40, 19.00, 74.30)
VIEWBOX = "73.60,18.90,74.15,18.30"

STOP = {
    "the", "and", "of", "school", "schools", "vidyalaya", "vidyamandir", "shala",
    "pune", "maharashtra", "india", "colony", "nagar", "road", "gavthan",
    "gaothan", "vasahat", "chawl", "wadi", "vast", "society", "sanstha",
}

# Landmarks whose UDISE label is too abbreviated for a text search.
OVERRIDES = {
    "D. MANGESHKAR HOSPITAL": "Deenanath Mangeshkar Hospital",
    "K.E.M. HOSPITAL": "KEM Hospital Rasta Peth Pune",
    "GEN. A. VAIDYA STEDIUM": "Vaidya Stadium Pune",
    "Y. C. NATYAGRUH": "Yashwantrao Chavan Natyagruha Pune",
    "K K MARKET": "KK Market Pune",
    "PUNE VIDYAPEETH": "Savitribai Phule Pune University",
    "BHARATI VIDYAPEETH": "Bharati Vidyapeeth Pune",
    "SINHAGAD INST. WADGAON": "Sinhagad Institute Wadgaon Budruk Pune",
    "DOKE TALIM RAMOSHI GATE": "Doke Talim Pune",
    "AAGAKHAN PALACE": "Aga Khan Palace Pune",
    "ST WORKSHOP": "Maharashtra State Transport Workshop Pune",
    "NAGPUR CHAWL": "Nagpur Chawl Yerwada Pune",
    "MAMLEDAR KACHERI": "Mamledar Kacheri Pune",
    "GOKHLE HALL MANDAI": "Gokhale Hall Pune",
    "SADHANA VIDYALAY": "Sadhana Vidyalaya Pune",
    "SHIVDARSHAN": "Shivdarshan Pune",
    "SAMTA BHUMI": "Samta Bhumi Pune",
    "W. S. AADARSHNAGAR": "Adarsh Nagar Wanawadi Pune",
    "W. S. SAINATHNAGAR": "Sainath Nagar Wanawadi Pune",
    "KALEPADAL MOHAMMADWADI": "Kalepadal Mohammadwadi Pune",
    "MUNDHAWA MAGARPATTA": "Mundhwa Magarpatta Pune",
    "RAUTBAUG DHANKAWADI": "Rautbaug Dhankawadi Pune",
    "HINGNE S. S. SANSTHA": "Hingne Khurd Pune",
    "PARMHANSNAGAR VANAZ CO": "Vanaz Kothrud Pune",
    "SUTARWADI PASHAN": "Sutarwadi Pashan Pune",
    "KELEWADI MIT": "Kelewadi Pune",
    "JANTA VASAHAT": "Janta Vasahat Pune",
    "LOWIYANAGAR": "Lohiyanagar Pune",
    "SHINDYANCHI CHHATRI": "Shindyanchi Chhatri Wanowrie Pune",
    "CITY POST GADIKHANA": "Gadikhana City Post Pune",
    "NARAYAN PETH NANA WADA": "Nana Wada Narayan Peth Pune",
    "DOLE TALIM RAMOSHI GATE": "Doke Talim Pune",
    "SINHAGAD INST. WADGAON": "Sinhagad Institute Vadgaon Budruk Pune",
    # second pass: sub-localities that need a parent locality in the query
    "MITHA NAGAR": "Mithanagar Kondhwa Pune",
    "KALEPADAL MOHAMMADWADI": "Kalepadal Hadapsar Pune",
    "PRABHAT ROAD": "Prabhat Road Erandwane Pune",
    "POPULARNAGAR WARJE": "Popular Nagar Warje Pune",
    "KONDHAWA BK": "Kondhwa Budruk Pune",
    "K.E.M. HOSPITAL": "KEM Hospital Rasta Peth Pune",
    "HADPASAR GAVTHAN": "Hadapsar Gaon Pune",
    "AAMBEGAON PATHAR": "Ambegaon Pathar Pune",
    "TILAKROAD LOKMANYA NAG": "Lokmanya Nagar Tilak Road Pune",
    "W. S. SAINATHNAGAR": "Sainath Nagar Wanowrie Pune",
    "RAUTBAUG DHANKAWADI": "Rautbaug Dhankawadi Pune",
    "NAGPUR CHAWL": "Nagpur Chawl Yerwada Pune",
    "W. S. AADARSHNAGAR": "Adarsh Nagar Wanowrie Pune",
    "SALISBURY PARK": "Salisbury Park Pune",
    "CITY POST GADIKHANA": "Gadikhana Pune",
    "VEDBHAVAN": "Ved Bhavan Pune",
    "ANANDNAGAR HINGNE KD": "Anand Nagar Hingne Khurd Pune",
    "HARKA NAGAR RAJEWADI": "Rajewadi Pune",
    "ST WORKSHOP": "MSRTC Workshop Pune",
    "SAMTA BHUMI": "Samta Bhumi Pune",
    "SOPANBAUG KAWADE WADI": "Sopan Baug Pune",
    "NAVI KHADKI": "Khadki Pune",
    "WARJE GAVTHAN": "Warje Pune",
    "GEN. A. VAIDYA STEDIUM": "Vaidya Stadium Pune",
    "WANWADI RAMTEKADI": "Ramtekadi Wanowrie Pune",
    "SATAV WADI": "Satavwadi Hadapsar Pune",
    "DOKE TALIM RAMOSHI GATE": "Ramoshi Gate Pune",
    "SHINDYANCHI CHHATRI": "Shindyanchi Chhatri Wanowrie Pune",
    "LOHIYANAGAR": "Lohia Nagar Yerwada Pune",
    "JUNA BAZAR": "Juna Bazar Pune",
    "BALAJINAGAR": "Balajinagar Pune",
    "SHIVTIRTHANAGAR": "Shivtirth Nagar Pune",
    "UPPER INDIRA NAGAR": "Upper Indira Nagar Pune",
}


def tokens(s: str) -> list[str]:
    s = unicodedata.normalize("NFKD", s).upper()
    s = re.sub(r"[^A-Z0-9 ]+", " ", s)
    return [t for t in s.split() if len(t) > 1]


def ratio(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def score(want: str, display: str) -> tuple[float, int]:
    """Best-per-token fuzzy coverage of `want` inside `display`."""
    wt = tokens(want)
    dt = tokens(display)
    if not wt or not dt:
        return 0.0, 0
    total = matched = 0.0
    hits = 0
    for w in wt:
        weight = 1.0 if w not in STOP else 0.35
        total += weight
        best = max(ratio(w, d) for d in dt)
        if best >= 0.80 or any(w == d for d in dt):
            matched += weight
            hits += 1
        elif best >= 0.72:
            matched += weight * 0.5
    return (matched / total if total else 0.0), hits


def fetch(q: str, limit: int = 8) -> list[dict]:
    url = ("https://nominatim.openstreetmap.org/search?"
           + urllib.parse.urlencode({
               "q": q, "format": "jsonv2", "limit": limit,
               "viewbox": VIEWBOX, "addressdetails": 0,
               "countrycodes": "in",
           }))
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as fh:
        return json.loads(fh.read().decode("utf-8"))


def in_box(lat: float, lon: float) -> bool:
    return BOX[0] <= lat <= BOX[2] and BOX[1] <= lon <= BOX[3]


def lookup(name: str) -> dict | None:
    term = OVERRIDES.get(name, name)
    queries = [f"{term}, Pune, Maharashtra, India"]
    if term != name:
        queries.append(f"{name}, Pune, Maharashtra, India")
    best = None
    for q in queries:
        try:
            results = fetch(q)
        except Exception as exc:  # noqa: BLE001
            print(f"   ! {q}: {exc}", flush=True)
            time.sleep(2)
            continue
        time.sleep(1.05)
        for r in results:
            lat, lon = float(r["lat"]), float(r["lon"])
            if not in_box(lat, lon):
                continue
            display = r.get("display_name", "")
            sc, hits = score(term, display)
            # a second pass on the original label so overrides stay honest
            sc2, hits2 = score(name, display)
            sc, hits = max((sc, hits), (sc2, hits2))
            rank = r.get("place_rank", 0)
            key = (round(sc, 3), hits, rank)
            if best is None or key > best[0]:
                best = (key, {
                    "lat": lat, "lon": lon, "display": display,
                    "type": r.get("type", ""), "placeRank": rank,
                    "score": round(sc, 3), "hits": hits, "query": q,
                })
        if best and best[0][0] >= 0.80:
            break
    if best and best[0][0] >= 0.62:
        return best[1]
    return None


def main() -> None:
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    names = [ln.strip() for ln in src.read_text(encoding="utf-8").splitlines() if ln.strip()]
    out: dict[str, dict] = {}
    if dst.exists():
        try:
            out = json.loads(dst.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            out = {}
    for name in names:
        prev = out.get(name) or {}
        if prev.get("lat") and prev.get("score", 0) >= 0.62:
            print(f"SKIP {name}", flush=True)
            continue
        hit = lookup(name)
        if hit:
            out[name] = hit
            print(f"OK   {name:28s} {hit['score']:.2f} {hit['lat']:.4f},{hit['lon']:.4f}  {hit['display'][:70]}", flush=True)
        else:
            out[name] = {"lat": None, "lon": None}
            print(f"MISS {name}", flush=True)
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    ok = sum(1 for v in out.values() if v.get("lat"))
    print(f"\nTOTAL {len(out)}  GEOCODED {ok}  MISS {len(out) - ok}")


if __name__ == "__main__":
    main()
