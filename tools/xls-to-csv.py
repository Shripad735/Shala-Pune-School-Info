"""Minimal BIFF8 .xls reader -> one CSV per sheet.

Needs only the OLE2 (CFB) container plus a subset of BIFF8 records, which is
enough for the single-file spreadsheets we have here (no formatting/merges).
"""
from __future__ import annotations

import csv
import json
import struct
import sys
from pathlib import Path


# ---------------------------------------------------------------- OLE2 / CFB

class Cfb:
    def __init__(self, data: bytes):
        self.data = data
        if data[:8] != b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
            raise ValueError("not an OLE2 compound file")
        self.sector_size = 1 << struct.unpack_from("<H", data, 30)[0]
        self.mini_size = 1 << struct.unpack_from("<H", data, 32)[0]
        self.num_fat_sectors = struct.unpack_from("<I", data, 44)[0]
        self.first_dir_sector = struct.unpack_from("<I", data, 48)[0]
        self.mini_cutoff = struct.unpack_from("<I", data, 56)[0]
        self.first_minifat_sector = struct.unpack_from("<I", data, 60)[0]
        self.first_difat_sector = struct.unpack_from("<I", data, 68)[0]
        self._load_fat()
        self._load_dir()

    def _sector(self, n: int) -> bytes:
        off = (n + 1) * self.sector_size
        return self.data[off: off + self.sector_size]

    def _load_fat(self):
        per = self.sector_size // 4
        difat = list(struct.unpack_from("<109I", self.data, 76))
        nxt, guard = self.first_difat_sector, 0
        while nxt < 0xFFFFFFFA and guard < 100000:
            vals = list(struct.unpack_from(f"<{per}I", self._sector(nxt), 0))
            difat.extend(vals[:-1])
            nxt = vals[-1]
            guard += 1
        fat: list[int] = []
        for s in difat[: self.num_fat_sectors]:
            if s >= 0xFFFFFFFA:
                continue
            fat.extend(struct.unpack_from(f"<{per}I", self._sector(s), 0))
        self.fat = fat

    def _chain(self, start: int) -> list[int]:
        out: list[int] = []
        cur, seen = start, set()
        while cur < 0xFFFFFFFA and cur not in seen and cur < len(self.fat):
            seen.add(cur)
            out.append(cur)
            cur = self.fat[cur]
        return out

    def _read_chain(self, start: int) -> bytes:
        return b"".join(self._sector(s) for s in self._chain(start))

    def _load_dir(self):
        raw = self._read_chain(self.first_dir_sector)
        self.entries = []
        for i in range(0, len(raw) - 127, 128):
            e = raw[i: i + 128]
            nlen = struct.unpack_from("<H", e, 64)[0]
            name = e[: max(0, nlen - 2)].decode("utf-16-le", "replace")
            self.entries.append({
                "name": name,
                "type": e[66],
                "start": struct.unpack_from("<I", e, 116)[0],
                "size": struct.unpack_from("<Q", e, 120)[0],
            })
        root = next((e for e in self.entries if e["type"] == 5), None)
        self.ministream = b""
        if root and root["start"] < 0xFFFFFFFA:
            self.ministream = self._read_chain(root["start"])[: root["size"]]
        self.minifat: list[int] = []
        if self.first_minifat_sector < 0xFFFFFFFA:
            mf = self._read_chain(self.first_minifat_sector)
            self.minifat = list(struct.unpack_from(f"<{len(mf) // 4}I", mf, 0))

    def _read_mini(self, start: int, size: int) -> bytes:
        out: list[bytes] = []
        cur, seen = start, set()
        while cur < 0xFFFFFFFA and cur not in seen and cur < len(self.minifat):
            seen.add(cur)
            out.append(self.ministream[cur * self.mini_size: (cur + 1) * self.mini_size])
            cur = self.minifat[cur]
        return b"".join(out)[:size]

    def stream(self, name: str) -> bytes:
        e = next((x for x in self.entries if x["name"] == name and x["type"] == 2), None)
        if e is None:
            raise KeyError(name)
        if e["size"] < self.mini_cutoff:
            return self._read_mini(e["start"], e["size"])
        return self._read_chain(e["start"])[: e["size"]]


# ---------------------------------------------------------------- BIFF8

def _records(buf: bytes):
    i, n = 0, len(buf)
    while i + 4 <= n:
        rid, rlen = struct.unpack_from("<HH", buf, i)
        yield rid, buf[i + 4: i + 4 + rlen]
        i += 4 + rlen


def _rk(rk: int) -> float:
    if rk & 0x02:
        val = float(struct.unpack("<i", struct.pack("<I", rk & 0xFFFFFFFC))[0] >> 2)
    else:
        val = struct.unpack("<d", struct.pack("<Q", (rk & 0xFFFFFFFC) << 32))[0]
    return val / 100.0 if rk & 0x01 else val


class ChunkReader:
    """Cursor over SST + its CONTINUE records.

    A CONTINUE that splits a string's characters starts with a 1-byte flag
    giving the width of the characters that follow.
    """

    def __init__(self, chunks: list[bytes]):
        self.chunks = chunks
        self.ci = 0
        self.pos = 0

    def _cur(self) -> bytes:
        return self.chunks[self.ci]

    def read(self, n: int) -> bytes:
        out = bytearray()
        while n > 0 and self.ci < len(self.chunks):
            cur = self.chunks[self.ci]
            if self.pos >= len(cur):
                self.ci += 1
                self.pos = 0
                continue
            take = min(n, len(cur) - self.pos)
            out += cur[self.pos: self.pos + take]
            self.pos += take
            n -= take
        return bytes(out)

    def read_chars(self, cch: int, wide: bool) -> str:
        parts: list[str] = []
        remaining = cch
        while remaining > 0 and self.ci < len(self.chunks):
            cur = self.chunks[self.ci]
            if self.pos >= len(cur):
                self.ci += 1
                self.pos = 0
                if self.ci >= len(self.chunks):
                    break
                wide = bool(self.chunks[self.ci][0] & 0x01)
                self.pos = 1
                continue
            avail = len(cur) - self.pos
            if wide:
                take = min(remaining, avail // 2)
                if take == 0:
                    self.pos = len(cur)
                    continue
                parts.append(cur[self.pos: self.pos + take * 2].decode("utf-16-le", "replace"))
                self.pos += take * 2
            else:
                take = min(remaining, avail)
                parts.append(cur[self.pos: self.pos + take].decode("latin-1", "replace"))
                self.pos += take
            remaining -= take
        return "".join(parts)


def _parse_sst(chunks: list[bytes]) -> list[str]:
    r = ChunkReader(chunks)
    r.read(8)  # total + unique counts
    out: list[str] = []
    while r.ci < len(r.chunks):
        hdr = r.read(3)
        if len(hdr) < 3:
            break
        cch = struct.unpack_from("<H", hdr, 0)[0]
        flags = hdr[2]
        rich, far = bool(flags & 0x08), bool(flags & 0x04)
        runs = struct.unpack("<H", r.read(2))[0] if rich else 0
        ext = struct.unpack("<i", r.read(4))[0] if far else 0
        out.append(r.read_chars(cch, bool(flags & 0x01)))
        if rich:
            r.read(4 * runs)
        if far:
            r.read(ext)
    return out


def _read_str8(data: bytes, off: int) -> str:
    cch = struct.unpack_from("<H", data, off)[0]
    flags = data[off + 2]
    body = off + 3
    if flags & 0x01:
        return data[body: body + cch * 2].decode("utf-16-le", "replace")
    return data[body: body + cch].decode("latin-1", "replace")


def read_workbook(path: Path):
    cfb = Cfb(path.read_bytes())
    try:
        wb = cfb.stream("Workbook")
    except KeyError:
        wb = cfb.stream("Book")

    recs = list(_records(wb))
    sheets: list[tuple[str, int]] = []
    sst: list[str] = []
    i = 0
    while i < len(recs):
        rid, data = recs[i]
        if rid == 0x0085:  # BOUNDSHEET
            off = struct.unpack_from("<I", data, 0)[0]
            cch, flags = data[6], data[7]
            name = (data[8: 8 + cch * 2].decode("utf-16-le", "replace") if flags & 0x01
                    else data[8: 8 + cch].decode("latin-1", "replace"))
            sheets.append((name, off))
        elif rid == 0x00FC:  # SST
            chunks = [data]
            j = i + 1
            while j < len(recs) and recs[j][0] == 0x003C:
                chunks.append(recs[j][1])
                j += 1
            sst = _parse_sst(chunks)
            i = j
            continue
        i += 1

    ordered = sorted(sheets, key=lambda s: s[1])
    bounds = [s[1] for s in ordered] + [len(wb)]
    out: dict[str, dict[int, dict[int, object]]] = {}

    for idx, (name, off) in enumerate(ordered):
        cells: dict[int, dict[int, object]] = {}
        pending: tuple[int, int] | None = None
        for rid, data in _records(wb[off: bounds[idx + 1]]):
            try:
                if rid == 0x00FD:  # LABELSST
                    rw, col, _xf, si = struct.unpack_from("<HHHI", data, 0)
                    cells.setdefault(rw, {})[col] = sst[si] if si < len(sst) else ""
                elif rid in (0x0204, 0x00D6):  # LABEL / RSTRING
                    rw, col, _xf, cch = struct.unpack_from("<HHHH", data, 0)
                    cells.setdefault(rw, {})[col] = _read_str8(
                        struct.pack("<H", cch) + data[8:], 0
                    )
                elif rid == 0x0203:  # NUMBER
                    rw, col, _xf, v = struct.unpack_from("<HHHd", data, 0)
                    cells.setdefault(rw, {})[col] = v
                elif rid == 0x027E:  # RK
                    rw, col, _xf, rk = struct.unpack_from("<HHHI", data, 0)
                    cells.setdefault(rw, {})[col] = _rk(rk)
                elif rid == 0x00BD:  # MULRK
                    rw, c1 = struct.unpack_from("<HH", data, 0)
                    n = (len(data) - 6) // 6
                    for k in range(n):
                        rk = struct.unpack_from("<I", data, 6 + k * 6)[0]
                        cells.setdefault(rw, {})[c1 + k] = _rk(rk)
                elif rid == 0x0006:  # FORMULA
                    rw, col = struct.unpack_from("<HH", data, 0)
                    res = data[6:14]
                    if res[6:8] == b"\xff\xff":
                        if res[0] == 0:
                            pending = (rw, col)
                        elif res[0] == 1:
                            cells.setdefault(rw, {})[col] = bool(res[2])
                        else:
                            cells.setdefault(rw, {})[col] = ""
                    else:
                        cells.setdefault(rw, {})[col] = struct.unpack("<d", res)[0]
                elif rid == 0x0207 and pending:  # STRING
                    cells.setdefault(pending[0], {})[pending[1]] = _read_str8(data, 0)
                    pending = None
                elif rid == 0x0205:  # BOOLERR
                    rw, col, _xf, v = struct.unpack_from("<HHHB", data, 0)
                    cells.setdefault(rw, {})[col] = (v == 1) if v in (0, 1) else "#ERR"
            except struct.error:
                continue
        out[name] = cells
    return [n for n, _ in ordered], out


def main() -> None:
    src, outdir = Path(sys.argv[1]), Path(sys.argv[2])
    outdir.mkdir(parents=True, exist_ok=True)
    names, rows = read_workbook(src)
    print(json.dumps({"sheets": names}, ensure_ascii=False))
    for name in names:
        cells = rows[name]
        if not cells:
            print(f"{name}: empty")
            continue
        maxr = max(cells)
        maxc = max(max(v) for v in cells.values() if v)
        grid = [[cells.get(r, {}).get(c, "") for c in range(maxc + 1)] for r in range(maxr + 1)]
        safe = "".join(ch if ch.isalnum() or ch in "-_ " else "_" for ch in name).strip() or "sheet"
        dst = outdir / f"{safe}.csv"
        with dst.open("w", newline="", encoding="utf-8") as fh:
            csv.writer(fh).writerows(grid)
        print(f"{name}: rows={maxr + 1} cols={maxc + 1} -> {dst.name}")


if __name__ == "__main__":
    main()
