#!/usr/bin/env python3
"""Krátke slučkové videá do ponuky v pokladni zo skutočných fotiek LCD (kniha § 10.43).

Výstup: assets/img/kosik/<meno>.mp4, .webm, .jpg (288 × 360, bez zvuku). Fotky sa neupravujú, len sa posúvajú a prelínajú.
Nahraté súbory sa neprepisujú (production.yml): zmenené video ide pod novým menom. Prvé tri webm sú ešte VP9 profil 1, preto mp4 ide prvé.
Spustenie z koreňa repa: python tools/kosik-videa.py [meno ...] (bez mena všetky videá)
"""
import subprocess
import sys

from PIL import Image

W, H, FPS = 288, 360, 24
IMG = "assets/img/"
VYSTUP = IMG + "kosik/"

# shot: (súbor, sekundy, stred x od-do, stred y, priblíženie od-do)
VIDEA = {
    # Michal 6. 11. 2026: najprv veci rozhádzané po podlahe, hneď uložené v boxoch, potom zavreté boxy.
    "box-poriadok": {
        "prelina": 0.45,
        "poster": 2,
        "slucka": True,
        "zabery": [
            ("1v/obsah/boxy-pred-cely.jpg", 2.3, (0.36, 0.62), 0.55, (1.0, 1.0)),
            ("1v/obsah/boxy-po-cely.jpg", 2.1, (0.49, 0.49), 0.5, (1.0, 1.0)),
            ("1v/kufor-boxy-2-boxy.jpg", 2.1, (0.5, 0.5), 0.5, (1.0, 1.05)),
        ],
    },
    "rohoz-dno": {
        "prelina": 0.7,
        "poster": 1,
        "zabery": [
            ("1v/kufor-boxy-bez-rohoze.jpg", 2.2, (0.5, 0.5), 0.56, (1.0, 1.03)),
            ("1v/kufor-boxy-classic.jpg", 3.0, (0.5, 0.5), 0.56, (1.03, 1.0)),
            ("1v/kufor-boxy-bez-rohoze.jpg", 1.1, (0.5, 0.5), 0.56, (1.0, 1.0)),
        ],
    },
    # Michal 6. 11. 2026: len dvere v kamióne, bez fotky s logom Scania a bez hlavy vikinga. Pomalý posun tam a späť po tej istej fotke.
    "tapacir-dvere": {
        "prelina": 0.45,
        "poster": 0,
        "hladko": True,
        "zabery": [
            ("1v/kamion-dvere-tapacir-2.jpg", 3.6, (0.28, 0.72), 0.7, (1.45, 1.45)),
            ("1v/kamion-dvere-tapacir-2.jpg", 3.6, (0.72, 0.28), 0.7, (1.45, 1.45)),
        ],
    },
}


def ramec(im, t, x, y, z):
    """Výrez W × H so stredom (x, y) v podiele fotky, priblíženie z, plynulý posun t 0–1."""
    sx = x[0] + (x[1] - x[0]) * t
    zoom = z[0] + (z[1] - z[0]) * t
    iw, ih = im.size
    v = ih / zoom  # výška výrezu vo fotke
    s = v * W / H
    cx = max(s / 2, min(iw - s / 2, sx * iw))
    cy = max(v / 2, min(ih - v / 2, y * ih))
    return im.transform((W, H), Image.AFFINE, (s / W, 0, cx - s / 2, 0, v / H, cy - v / 2), Image.BICUBIC)


def ramce(v):
    zabery = [(Image.open(IMG + f).convert("RGB"), s, x, y, z) for f, s, x, y, z in v["zabery"]]
    prelina = int(v["prelina"] * FPS)
    vsetko = []
    for i, (im, s, x, y, z) in enumerate(zabery):
        n = int(s * FPS)
        krivka = (lambda t: t * t * (3 - 2 * t)) if v.get("hladko") else (lambda t: t)
        akt = [ramec(im, krivka(k / max(1, n - 1)), x, y, z) for k in range(n)]
        if vsetko:
            for k in range(prelina):
                a = vsetko[-prelina + k]
                vsetko[-prelina + k] = Image.blend(a, akt[k], (k + 1) / (prelina + 1))
            akt = akt[prelina:]
        if i == v["poster"]:
            poster = akt[min(len(akt) - 1, len(akt) // 3)]
        vsetko.extend(akt)
    if v.get("slucka"):  # koniec sa prelína do prvého záberu, video sa opakuje bez skoku
        for k in range(prelina):
            vsetko[-prelina + k] = Image.blend(vsetko[-prelina + k], vsetko[0], (k + 1) / (prelina + 1))
    return vsetko, poster


def zakoduj(ram, meno):
    surove = b"".join(r.tobytes() for r in ram)
    vstup = ["-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    spolocne = ["ffmpeg", "-y", "-v", "error"]
    subprocess.run(spolocne + vstup + ["-an", "-c:v", "libx264", "-preset", "veryslow", "-crf", "30", "-pix_fmt", "yuv420p",
                                       "-movflags", "+faststart", VYSTUP + meno + ".mp4"], input=surove, check=True)
    subprocess.run(spolocne + vstup + ["-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p", "-b:v", "0", "-crf", "52", "-row-mt", "1",
                                       VYSTUP + meno + ".webm"], input=surove, check=True)


for meno in sys.argv[1:] or VIDEA:
    v = VIDEA[meno]
    r, poster = ramce(v)
    zakoduj(r, meno)
    poster.save(VYSTUP + meno + ".jpg", quality=78)
    print(meno, round(len(r) / FPS, 1), "s")
