"""Zmensene WebP verzie obrazkov obsahu 1V (assets/img/1v/obsah/*.jpg) pre <picture> v obsahu pod konfiguratorom.

Michal 25. 10. 2026 (rychlost): obsah 1V sa ma rychlo otvarat aj na pomalych telefonoch. Obrazky obsahu su JPG
v plnej velkosti (104 suborov, 12 MB, az 1800 px), aj ked telefon ukaze fotku na 360 px. Tento skript vyrobi
k JPG zmensene WebP; tools/build-admin-html.mjs potom v kusoch p1v-* obali <img> do <picture> so <source
type="image/webp" srcset> (stare prehliadace bez WebP, napr. iPhone s iOS <= 13, dostanu povodny JPG z <img>).

    python tools/obrazky-1v-webp.py           # vyrobi chybajuce WebP (existujuce nikdy neprepise)
    python tools/obrazky-1v-webp.py --check   # len over, ci kazdy JPG ma vsetky WebP (exit 1 = nieco chyba)
    python tools/obrazky-1v-webp.py --vypis   # tabulka: JPG -> WebP sirky a velkosti

Pravidla (build-admin-html.mjs, funkcia obrazky1v, ich cita zo suborov):
  - meno: <meno>.jpg -> <meno>-w<sirka>.webp (napr. classic-d2-w480.webp); sirka je v mene, build ju cita z mena.
  - sirky: 480 / 800 / 1200 px, len mensie ako original, a vzdy aj sirka originalu (WebP v plnej velkosti, aby telefon
    s hustym displejom nedostal horsiu fotku ako doteraz). Sirka blizko originalu (>= 85 %) sa vynecha — original ju
    pokryje a srcset je kratsi (limit 45 000 znakov na kus obsahu).
  - kvalita 78, method 6, bez metadat; zmensenie LANCZOS, pomer stran zachovany.
  - bez uspory: ked WebP v sirke originalu nie je mensi ako JPG (male, uz dobre stlacene obrazky), nevyrobi sa nic
    a build necha povodny <img>.
  - production.yml: obrazky v assets/img/ su spolocne pre vsetky verzie webu — existujuci subor sa NIKDY neprepisuje,
    zmeneny obrazok = nove meno. Preto skript len doplna chybajuce subory (idempotentny: druhy beh nic nezmeni).
  - PNG (ikony s priehladnostou, par kB) a obrazky mimo assets/img/1v/obsah skript necha tak.
"""
import io
import os
import re
import sys

from PIL import Image

KOREN = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
ZLOZKA = os.path.join(KOREN, "assets", "img", "1v", "obsah")
SIRKY = (480, 800, 1200)
BLIZKO = 0.85  # sirka >= 85 % originalu sa nevyrobi (pokryje ju WebP v sirke originalu)
KVALITA = 78
RE_ODVODENY = re.compile(r"-w\d+\.webp$")


def sirky_pre(povodna):
    """Sirky WebP pre JPG danej sirky (zoradene): standardne mensie ako original + sirka originalu."""
    return sorted({s for s in SIRKY if s < povodna * BLIZKO} | {povodna})


def jpg_subory():
    return sorted(f for f in os.listdir(ZLOZKA) if f.lower().endswith(".jpg") and not f.startswith("_"))


def webp(im, sirka):
    """WebP v danej sirke ako bajty (deterministicky pre tu istu verziu libwebp)."""
    w, h = im.size
    rgb = im.convert("RGB")
    if sirka != w:
        rgb = rgb.resize((sirka, max(1, round(h * sirka / w))), Image.LANCZOS)
    b = io.BytesIO()
    rgb.save(b, "WEBP", quality=KVALITA, method=6)
    return b.getvalue()


def zapis(cesta, data):
    # zapis cez docasny subor: prerusenie behu nenecha polovicny .webp (dalsi beh by ho uz nepreskusal)
    docasny = cesta + ".tmp"
    with open(docasny, "wb") as f:
        f.write(data)
    os.replace(docasny, cesta)


def main():
    check = "--check" in sys.argv
    vypis = "--vypis" in sys.argv
    nove, chyba, bez_uspory, spolu_jpg, spolu_webp = 0, [], [], 0, 0
    for f in jpg_subory():
        cesta = os.path.join(ZLOZKA, f)
        meno = f[:-4]
        jpg = os.path.getsize(cesta)
        spolu_jpg += jpg
        with Image.open(cesta) as im:
            im.load()
            w, h = im.size
            ciel = lambda s: os.path.join(ZLOZKA, "%s-w%d.webp" % (meno, s))
            # najprv plna sirka: ked nie je mensia ako JPG, obrazok sa nechava tak (build ho neobali)
            plna = os.path.getsize(ciel(w)) if os.path.exists(ciel(w)) else len(webp(im, w))
            if plna >= jpg:
                bez_uspory.append(f)
                if vypis:
                    print("%-36s %4dx%-4d %4d kB -> bez uspory (WebP %d kB)" % (f, w, h, round(jpg / 1024), round(plna / 1024)))
                continue
            riadok = []
            for s in sirky_pre(w):
                if not os.path.exists(ciel(s)):
                    if check:
                        chyba.append(os.path.basename(ciel(s)))
                        continue
                    zapis(ciel(s), webp(im, s))
                    nove += 1
                riadok.append("%d:%dkB" % (s, round(os.path.getsize(ciel(s)) / 1024)))
            spolu_webp += os.path.getsize(ciel(w)) if os.path.exists(ciel(w)) else 0
            if vypis:
                print("%-36s %4dx%-4d %4d kB -> %s" % (f, w, h, round(jpg / 1024), " ".join(riadok)))
    # odvodene WebP bez JPG (premenovany/zmazany original) — len upozornenie, nic sa nemaze
    jpgs = {f[:-4] for f in jpg_subory()}
    for f in sorted(os.listdir(ZLOZKA)):
        if RE_ODVODENY.search(f) and RE_ODVODENY.sub("", f) not in jpgs:
            print("POZOR: %s nema povodny JPG" % f)
    if bez_uspory:
        print("bez uspory (ostava len JPG): %s" % ", ".join(bez_uspory))
    if check:
        if chyba:
            print("obrazky-1v-webp --check: chyba %d WebP (spusti python tools/obrazky-1v-webp.py): %s" % (len(chyba), ", ".join(chyba[:12])))
            sys.exit(1)
        print("obrazky-1v-webp --check: OK, kazdy JPG ma svoje WebP.")
        return
    print("obrazky-1v-webp: novych WebP %d; JPG spolu %d kB, WebP v plnej sirke spolu %d kB." % (nove, round(spolu_jpg / 1024), round(spolu_webp / 1024)))


if __name__ == "__main__":
    main()
