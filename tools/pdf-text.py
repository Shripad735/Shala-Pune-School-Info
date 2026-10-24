"""Tiny PDF text extractor: inflates content streams and pulls text operators."""
from __future__ import annotations

import re
import sys
import zlib
from pathlib import Path


def extract(path: Path) -> str:
    data = path.read_bytes()
    out: list[str] = []
    for m in re.finditer(rb"stream\r?\n", data):
        start = m.end()
        end = data.find(b"endstream", start)
        if end < 0:
            continue
        raw = data[start:end]
        try:
            raw = zlib.decompress(raw)
        except Exception:
            continue
        try:
            txt = raw.decode("latin-1")
        except Exception:
            continue
        for tm in re.finditer(r"\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]+>", txt):
            tok = tm.group(0)
            if tok.startswith("("):
                s = tok[1:-1]
                s = re.sub(r"\\([nrtbf()\\])", lambda g: {
                    "n": "\n", "r": "\r", "t": "\t", "b": "", "f": "",
                }.get(g.group(1), g.group(1)), s)
                out.append(s)
            else:
                hexs = re.sub(r"\s+", "", tok[1:-1])
                if len(hexs) % 4 == 0 and len(hexs) >= 4:
                    try:
                        out.append(bytes.fromhex(hexs).decode("utf-16-be", "replace"))
                    except Exception:
                        pass
    return "".join(out)


def main() -> None:
    src = Path(sys.argv[1])
    text = extract(src)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    if len(sys.argv) > 2:
        Path(sys.argv[2]).write_text(text, encoding="utf-8")
        print(f"{src.name}: {len(text)} chars -> {sys.argv[2]}")
    else:
        print(text[:6000])


if __name__ == "__main__":
    main()
