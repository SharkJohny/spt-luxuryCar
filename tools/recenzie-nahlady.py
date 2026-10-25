"""Nahlady fotiek recenzii (assets/img/reviews/rg-*.jpg -> assets/img/reviews/m/rg-*.jpg) pre karty recenzii 1V.

Rychlost 25. 10. 2026 (nalez session kamiony): karta recenzie ukazuje fotku zakaznika 56 x 56 px (.rev .shots img),
ale stahovala sa fotka 525 x 700 px (88-165 kB). Na 640 to bolo 21 fotiek = 2,5 MB, najvacsia polozka stranky.
Nahlad 168 x 168 px (3x displej) vyrezany na stred ako object-fit: cover, JPEG q80 = cca 6-10 kB.

    python tools/recenzie-nahlady.py           # vyrobi chybajuce nahlady (existujuce nikdy neprepise)
    python tools/recenzie-nahlady.py --check   # over, ci kazda fotka ma nahlad (exit 1 = nieco chyba)

Pravidla:
  - obrazky v assets/img/ su spolocne pre vsetky verzie webu (production.yml) -> existujuci subor sa NIKDY neprepisuje,
    zmenena fotka = nove meno (rg-<n>-<i>.jpg z reviews-data.js sa nemenia).
  - pouziva ich len 1V (konfigurator1v/obsah-a.js kartaRecenzie); titulka a rozcestnik zatial beru plne fotky.
"""
import os
import sys

from PIL import Image, ImageOps

KOREN = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
ZLOZKA = os.path.join(KOREN, "assets", "img", "reviews")
CIEL = os.path.join(ZLOZKA, "m")
STRANA = 168
KVALITA = 80


def fotky():
    return sorted(f for f in os.listdir(ZLOZKA) if f.startswith("rg-") and f.lower().endswith(".jpg"))


def main():
    check = "--check" in sys.argv
    chyba = [f for f in fotky() if not os.path.exists(os.path.join(CIEL, f))]
    if check:
        if chyba:
            print("recenzie-nahlady --check: CHYBA, bez nahladu: " + ", ".join(chyba))
            sys.exit(1)
        print("recenzie-nahlady --check: OK, kazda fotka ma nahlad.")
        return
    os.makedirs(CIEL, exist_ok=True)
    spolu_pred = spolu_po = 0
    for f in chyba:
        src = os.path.join(ZLOZKA, f)
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            nahlad = ImageOps.fit(im, (STRANA, STRANA), method=Image.LANCZOS, centering=(0.5, 0.5))
            nahlad.save(os.path.join(CIEL, f), "JPEG", quality=KVALITA, optimize=True, progressive=True)
        spolu_pred += os.path.getsize(src)
        spolu_po += os.path.getsize(os.path.join(CIEL, f))
    print(f"recenzie-nahlady: vyrobenych {len(chyba)} nahladov, {spolu_pred // 1024} kB -> {spolu_po // 1024} kB")


if __name__ == "__main__":
    main()
