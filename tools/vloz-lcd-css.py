"""Vlozi LCD bloky CSS z partialov do assets/css/luxuryCar.css (medzi znacky <MENO> START / END).

    python tools/vloz-lcd-css.py           # vlozi vsetky bloky (spustit po kazdej zmene partialu)
    python tools/vloz-lcd-css.py --check   # len over, ze luxuryCar.css sedi s partialmi (exit 1 = nesedi)

Bloky (poradie v luxuryCar.css ostava, kde uz su; novy blok sa prida za predosly):
  LCD-HOME   <- _lcdHome.scss       titulka (vystup extract-lcd-home.py, scope #lcd-home)
  LCD-RZ     <- _lcdRz.scss         rozcestnik (vystup extract-lcd-rz.py, scope #lcd-rz)
  LCD-HDR    <- _lcdNativeHdr.scss  hlavicka: kreslena #lcd-hdr (prechod) + natívna Shoptet hlavicka + staticke #mega
  LCD-KORENE <- _lcdKorene.scss     staticke korene [data-lcd-cast] v obaloch Shoptetu (bannery, popis stranky)
  LCD-KOSIK  <- _lcdKosik.scss      kosik: ponuka rohoze do kufra a boxu k setu (assets/js/lcdKosikDoplnok.js)
LCD-BLOG ma vlastny nastroj (tools/vloz-lcd-blog-css.py), tento ho nemeni.

Pri vkladani sa meni LEN prelud pravidiel (selektory), deklaracie a komentare ostavaju bajt po bajte:
  - LCD-HOME: #lcd-home -> :is(#lcd-home,[data-lcd-cast^=hp])
      Telo titulky je v niekolkych banneroch (#lcd-home, #lcd-home-2, ... kazdy s data-lcd-cast="hp-...").
      :is() drzi specificitu id (1,0,0), takze kaskada sa nemeni; premenne (--ink, --gold...) platia na kazdom koreni.
  - LCD-HOME aj LCD-RZ: kazdy selektor s typom h1 dostane dvojca s .lcd-h1 (napr. "#lcd-home .hero h1" ->
      "#lcd-home .hero h1, #lcd-home .hero .lcd-h1"). V banneroch a v popise stranky nie je <h1> (H1 dava Shoptet),
      nadpis hero je <h2 class="lcd-h1">; vlastna specificita h1 selektora sa nemeni (zoznam, nie :is).
Partialy ostavaju vystupom generatorov (scope #lcd-home / #lcd-rz) - preto transformacia az tu.
"""
import io
import os
import re
import sys

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS_DIR = os.path.join(KOREN, "assets", "css")
CIEL = os.path.join(CSS_DIR, "luxuryCar.css")

HOME_IS = ":is(#lcd-home,[data-lcd-cast^=hp])"

BLOKY = [
    dict(meno="LCD-HOME", zdroj="_lcdHome.scss", home=True, h1=True,
         popis="titulka; #lcd-home -> " + HOME_IS + ", h1 -> + .lcd-h1"),
    dict(meno="LCD-RZ", zdroj="_lcdRz.scss", home=False, h1=True,
         popis="rozcestnik; h1 -> + .lcd-h1"),
    dict(meno="LCD-HDR", zdroj="_lcdNativeHdr.scss", home=False, h1=False,
         popis="kreslena hlavicka #lcd-hdr + nativna hlavicka Shoptetu + staticke #mega"),
    dict(meno="LCD-KORENE", zdroj="_lcdKorene.scss", home=False, h1=False,
         popis="staticke korene [data-lcd-cast] v obaloch Shoptetu"),
    dict(meno="LCD-KOSIK", zdroj="_lcdKosik.scss", home=False, h1=False,
         popis="kosik: ponuka rohoze a boxu k setu, #lcd-doplnok"),
]


class Chyba(Exception):
    pass


# ------------------------------------------------------------------ skener CSS
def _koniec_komentara(s, i):
    j = s.find("*/", i + 2)
    if j < 0:
        raise Chyba("neuzavrety komentar na pozicii %d" % i)
    return j + 2


def _koniec_retazca(s, i):
    q, j = s[i], i + 1
    while j < len(s):
        if s[j] == "\\":
            j += 2
            continue
        if s[j] == q:
            return j + 1
        if s[j] == "\n":
            raise Chyba("neuzavrety retazec na pozicii %d" % i)
        j += 1
    raise Chyba("neuzavrety retazec na pozicii %d" % i)


def _par(s, i):
    """i ukazuje na '{' -> index zodpovedajucej '}'."""
    hlbka, j = 0, i
    while j < len(s):
        c = s[j]
        if c == "/" and s.startswith("/*", j):
            j = _koniec_komentara(s, j)
            continue
        if c in "\"'":
            j = _koniec_retazca(s, j)
            continue
        if c == "{":
            hlbka += 1
        elif c == "}":
            hlbka -= 1
            if hlbka == 0:
                return j
        j += 1
    raise Chyba("neuzavreta zatvorka { na pozicii %d" % i)


VNORENE_AT = ("@media", "@supports", "@container", "@layer", "@document", "@scope")
UVOD = re.compile(r"^(\s*(?:/\*.*?\*/\s*)*)", re.S)


def prepis(css, fn_sel):
    """Prejde CSS, na kazdy prelud stylu zavola fn_sel(selektor) a vrati nove CSS.
    Vsetko ostatne (deklaracie, komentare, @keyframes...) ostava bajt po bajte."""
    out, i, zac, n = [], 0, 0, len(css)
    while i < n:
        c = css[i]
        if c == "/" and css.startswith("/*", i):
            i = _koniec_komentara(css, i)
            continue
        if c in "\"'":
            i = _koniec_retazca(css, i)
            continue
        if c == ";":
            i += 1
            out.append(css[zac:i])
            zac = i
            continue
        if c == "}":
            raise Chyba("nadbytocna } na pozicii %d: ...%s" % (i, css[max(0, i - 60):i].replace("\n", " ")))
        if c == "{":
            j = _par(css, i)
            prelud = css[zac:i]
            m = UVOD.match(prelud)
            uvod, sel = m.group(1), prelud[m.end():]
            hlava = sel.strip().lower()
            if hlava.startswith("@"):
                if hlava.startswith(VNORENE_AT):
                    out.append(prelud + "{" + prepis(css[i + 1:j], fn_sel) + "}")
                else:
                    out.append(css[zac:j + 1])
            else:
                koniec_ws = re.search(r"\s*$", sel).group(0)
                jadro = sel[:len(sel) - len(koniec_ws)] if koniec_ws else sel
                out.append(uvod + fn_sel(jadro) + koniec_ws + css[i:j + 1])
            i = j + 1
            zac = i
            continue
        i += 1
    out.append(css[zac:])
    return "".join(out)


def rozdel_selektory(sel):
    out, buf, hlbka, i = [], "", 0, 0
    while i < len(sel):
        c = sel[i]
        if c in "\"'":
            j = _koniec_retazca(sel, i)
            buf += sel[i:j]
            i = j
            continue
        if c in "([":
            hlbka += 1
        elif c in ")]":
            hlbka -= 1
        if c == "," and hlbka == 0:
            out.append(buf)
            buf = ""
            i += 1
            continue
        buf += c
        i += 1
    out.append(buf)
    return out


RE_HOME = re.compile(r"#lcd-home(?![\w-])")
RE_H1 = re.compile(r"(?<![\w.#\-\[=\"':])h1(?![\w-])")


def sel_home(sel):
    return RE_HOME.sub(HOME_IS, sel)


def sel_h1(sel):
    if not RE_H1.search(sel):
        return sel
    casti = [p.strip() for p in rozdel_selektory(sel)]
    nove = []
    for p in casti:
        nove.append(p)
        if RE_H1.search(p):
            dvojca = RE_H1.sub(".lcd-h1", p)
            if dvojca not in casti and dvojca not in nove:
                nove.append(dvojca)
    return ", ".join(nove)


# ------------------------------------------------------------------ bloky
def start_znacka(b):
    return "/* ===== %s START - generovane tools/vloz-lcd-css.py z %s (%s), needituj rucne ===== */" % (
        b["meno"], b["zdroj"], b["popis"])


def end_znacka(b):
    return "/* ===== %s END ===== */" % b["meno"]


def obsah_bloku(b):
    cesta = os.path.join(CSS_DIR, b["zdroj"])
    css = io.open(cesta, encoding="utf-8").read().replace("\r\n", "\n")
    riadky = css.strip("\n").split("\n")
    # znacky v partiali (vystup generatorov ich obsahuje) sa zahodia, nastroj da vlastne
    if riadky and re.match(r"/\* ===== %s START\b" % re.escape(b["meno"]), riadky[0]):
        riadky = riadky[1:]
    if riadky and riadky[-1].strip() == end_znacka(b):
        riadky = riadky[:-1]
    css = "\n".join(riadky).strip("\n")
    try:
        if b.get("home"):
            css = prepis(css, sel_home)
        if b.get("h1"):
            css = prepis(css, sel_h1)
        else:
            prepis(css, lambda s: s)  # aspon kontrola zatvoriek
    except Chyba as e:
        raise Chyba("%s: %s" % (b["zdroj"], e))
    if b.get("home"):
        # #lcd-home mimo :is() moze ostat len v komentaroch
        bez_kom = re.sub(r"/\*.*?\*/", "", css.replace(HOME_IS, ""), flags=re.S)
        if RE_HOME.search(bez_kom):
            raise Chyba("%s: po prepise ostal #lcd-home mimo :is() (napr. v deklaracii?)" % b["zdroj"])
    return start_znacka(b) + "\n" + css + "\n" + end_znacka(b)


def vloz(text, b, blok, za):
    vzor = re.compile(re.escape("/* ===== %s START" % b["meno"]) + r".*?" + re.escape(end_znacka(b)), re.S)
    najdene = vzor.findall(text)
    if len(najdene) > 1:
        raise Chyba("blok %s je v luxuryCar.css %dx" % (b["meno"], len(najdene)))
    if najdene:
        return vzor.sub(lambda _: blok, text, count=1), "nahradeny"
    if za:
        k = text.find(end_znacka(za))
        if k >= 0:
            k += len(end_znacka(za))
            return text[:k] + "\n\n" + blok + text[k:], "pridany za " + za["meno"]
    return text.rstrip("\n") + "\n\n" + blok + "\n", "pridany na koniec"


def main():
    check = "--check" in sys.argv[1:]
    povodny = io.open(CIEL, encoding="utf-8", newline="").read()
    # Windows checkout (core.autocrlf=true) da CRLF, repo a CI (Ubuntu) maju LF: porovnava sa vzdy v LF
    # a zapisuje sa v tom konci riadku, aky subor mal (ziadne zmiesane konce riadkov)
    crlf = "\r\n" in povodny
    povodny = povodny.replace("\r\n", "\n")
    text = povodny
    predosly = None
    try:
        for b in BLOKY:
            blok = obsah_bloku(b)
            text, ako = vloz(text, b, blok, predosly)
            print("%-11s %-20s %7d znakov  %s" % (b["meno"], b["zdroj"], len(blok), ako))
            predosly = b
        prepis(text, lambda s: s)  # cele luxuryCar.css musi mat sparovane zatvorky
    except Chyba as e:
        print("CHYBA: %s" % e)
        return 2
    if check:
        if text != povodny:
            print("NESEDI: luxuryCar.css nie je aktualny voci partialom - spusti python tools/vloz-lcd-css.py")
            return 1
        print("OK: luxuryCar.css sedi s partialmi")
        return 0
    if text != povodny:
        io.open(CIEL, "w", encoding="utf-8", newline="").write(text.replace("\n", "\r\n") if crlf else text)
        print("luxuryCar.css zapisany (%d -> %d znakov)" % (len(povodny), len(text)))
    else:
        print("luxuryCar.css bez zmeny")
    return 0


if __name__ == "__main__":
    sys.exit(main())
