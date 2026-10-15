"""Vlozi LCD bloky CSS z partialov do assets/css/luxuryCar.css (medzi znacky <MENO> START / END).

    python tools/vloz-lcd-css.py           # vlozi vsetky bloky (spustit po kazdej zmene partialu)
    python tools/vloz-lcd-css.py --check   # len over, ze luxuryCar.css sedi s partialmi (exit 1 = nesedi)
    python tools/vloz-lcd-css.py --vystup C:/tmp/luxuryCar.css   # vysledok zapise INAM, repo ostane nezmenene
                                           # (test tools/test-konfigurator-1v.mjs si tak zlozi CSS z aktualnych partialov)

Bloky (poradie v luxuryCar.css ostava, kde uz su; novy blok sa prida za predosly):
  LCD-HOME   <- _lcdHome.scss       titulka (vystup extract-lcd-home.py, scope #lcd-home)
  LCD-RZ     <- _lcdRz.scss         rozcestnik (vystup extract-lcd-rz.py, scope #lcd-rz)
  LCD-HDR    <- _lcdNativeHdr.scss  hlavicka: kreslena #lcd-hdr (prechod) + natívna Shoptet hlavicka + staticke #mega
  LCD-KORENE <- _lcdKorene.scss     staticke korene [data-lcd-cast] v obaloch Shoptetu (bannery, popis stranky)
  LCD-KOSIK  <- _lcdKosik.scss      kosik: ponuka rohoze do kufra a boxu k setu (assets/js/lcdKosikDoplnok.js)
  LCD-1V-KROKY      <- _lcd1v-kroky.scss       novy konfigurator 1V: kroky 1-3 (vzor, auto, farba)  } vsetko LEN pod body.lcd-1v
  LCD-1V-ROZLOZENIE <- _lcd1v-rozlozenie.scss  novy konfigurator 1V: krok 4 rozlozenie              } (tichy test ?novy=1,
  LCD-1V-KUFOR-BOXY <- _lcd1v-kufor-boxy.scss  novy konfigurator 1V: kroky 5-6 kufor a boxy         }  SK 598; kontrakt
  LCD-1V-CENA       <- _lcd1v-cena.scss        novy konfigurator 1V: cenova karta + lepiva lista     }  docs/1v-kontrakt.md)
  LCD-1V-DRUHA      <- _lcd1v-druha.scss       novy konfigurator 1V: ponuka druhej vrstvy (jedno)    }
  LCD-1V-OBSAH      <- _lcd1v-obsah.scss       obsah pod konfiguratorom 1V: brana, miesto, skrytie stareho popisu (docs/1v-obsah.md)
  LCD-1V-OBSAH-A..D <- _lcd1v-obsah-a..d.scss  obsah 1V po skupinach A-D (kazdy selektor pod body.lcd-1v)
  LCD-1V-DVOJ       <- _lcd1v-dvoj.scss        1V dvojvrstvove (krok farba 2. vrstvy)  } typove bloky (T0.1 14. 10. 2026):
  LCD-1V-KUFOR      <- _lcd1v-kufor.scss       1V rohoze do kufra Classic + Premium    } body.lcd-1v[data-lcd1v-typ=...]
  LCD-1V-BOXY       <- _lcd1v-boxy.scss        1V box do kufra 616                     }
  LCD-1V-OBSAH-DVOJ / -CLASSIC / -PREMIUM / -BOXY / -VZORKY <- _lcd1v-obsah-<typ>.scss  obsah pod konfiguratorom podla typu
                                               (pri zluceni s obsahom 598 musia ostat ZA spolocnymi blokmi obsahu)
  LCD-1V-COOKIES    <- _lcd1v-cookies.scss     cookie lista + okno nastaveni v style C + odkaz v pate (pod html:root = PRE VSETKYCH, posledny blok)
LCD-BLOG ma vlastny nastroj (tools/vloz-lcd-blog-css.py), tento ho nemeni.

Pri vkladani sa meni LEN prelud pravidiel (selektory), deklaracie a komentare ostavaju bajt po bajte:
  - LCD-HOME: #lcd-home -> :is(#lcd-home,[data-lcd-cast^=hp],body.lcd-1v [data-lcd-cast^=p1v])
      Telo titulky je v niekolkych banneroch (#lcd-home, #lcd-home-2, ... kazdy s data-lcd-cast="hp-...").
      :is() drzi specificitu id (1,0,0), takze kaskada sa nemeni; premenne (--ink, --gold...) platia na kazdom koreni.
      Treti clen: korene obsahu pod konfiguratorom 1V (p1v-598-1, -2 ...; docs/1v-obsah.md) dostanu styly titulky
      (lx-* moduly, .chapter, .wrap, h2 ...) bez kopirovania CSS — LEN pod body.lcd-1v (flag vypnuty = nic nevyberie).
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

HOME_IS = ":is(#lcd-home,[data-lcd-cast^=hp],body.lcd-1v [data-lcd-cast^=p1v])"

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
    # Novy konfigurator jednovrstvovych (navrh v26), tichy test ?novy=1 na SK 598 — kazde pravidlo LEN pod body.lcd-1v
    dict(meno="LCD-1V-KROKY", zdroj="_lcd1v-kroky.scss", home=False, h1=False,
         popis="konfigurator 1V: kroky 1-3 vzor, auto, farba; len body.lcd-1v"),
    dict(meno="LCD-1V-ROZLOZENIE", zdroj="_lcd1v-rozlozenie.scss", home=False, h1=False,
         popis="konfigurator 1V: krok 4 rozlozenie; len body.lcd-1v"),
    dict(meno="LCD-1V-KUFOR-BOXY", zdroj="_lcd1v-kufor-boxy.scss", home=False, h1=False,
         popis="konfigurator 1V: kroky 5-6 kufor a boxy; len body.lcd-1v"),
    dict(meno="LCD-1V-CENA", zdroj="_lcd1v-cena.scss", home=False, h1=False,
         popis="konfigurator 1V: cenova karta a lepiva lista; len body.lcd-1v"),
    # Ponuka druhej vrstvy na jednovrstvovych (Michal 14. 10. 2026): karta bez cisla za krokom Farba
    dict(meno="LCD-1V-DRUHA", zdroj="_lcd1v-druha.scss", home=False, h1=False,
         popis="konfigurator 1V: ponuka druhej vrstvy na jednovrstvovych; len body.lcd-1v"),
    # Obsah pod konfiguratorom 1V (staticke HTML z adminu, admin-html/src/p1v-598/) — docs/1v-obsah.md
    dict(meno="LCD-1V-OBSAH", zdroj="_lcd1v-obsah.scss", home=False, h1=False,
         popis="obsah 1V: brana, miesto pod konfiguratorom, skrytie stareho popisu; okrem stlpca paticky len body.lcd-1v"),
    dict(meno="LCD-1V-OBSAH-A", zdroj="_lcd1v-obsah-a.scss", home=False, h1=False,
         popis="obsah 1V skupina A: ponuka dvojvrstvovych, referencie, galeria, recenzie; len body.lcd-1v"),
    dict(meno="LCD-1V-OBSAH-B", zdroj="_lcd1v-obsah-b.scss", home=False, h1=False,
         popis="obsah 1V skupina B: devat veci, material, porovnanie, pred a po; len body.lcd-1v"),
    dict(meno="LCD-1V-OBSAH-C", zdroj="_lcd1v-obsah-c.scss", home=False, h1=False,
         popis="obsah 1V skupina C: kam siahaju, co pride domov, casova os, farby, vzorky; len body.lcd-1v"),
    dict(meno="LCD-1V-OBSAH-D", zdroj="_lcd1v-obsah-d.scss", home=False, h1=False,
         popis="obsah 1V skupina D: realita, FAQ, kupit a necakat, linka citania, lightbox; len body.lcd-1v"),
    # Typy produktov (T0.1 14. 10. 2026): za spolocnymi blokmi 1V, kazde pravidlo pod body.lcd-1v[data-lcd1v-typ=...]
    dict(meno="LCD-1V-DVOJ", zdroj="_lcd1v-dvoj.scss", home=False, h1=False,
         popis="konfigurator 1V dvojvrstvove 601/604/607: krok farba 2. vrstvy; len body.lcd-1v"),
    dict(meno="LCD-1V-KUFOR", zdroj="_lcd1v-kufor.scss", home=False, h1=False,
         popis="konfigurator 1V rohoze do kufra Classic a Premium 619-634; len body.lcd-1v"),
    dict(meno="LCD-1V-BOXY", zdroj="_lcd1v-boxy.scss", home=False, h1=False,
         popis="konfigurator 1V box do kufra 616; len body.lcd-1v"),
    # Obsah pod konfiguratorom podla typu — pri zluceni s obsahom 598 (LCD-1V-OBSAH, -A..D) ponechat AZ ZA nimi
    dict(meno="LCD-1V-OBSAH-DVOJ", zdroj="_lcd1v-obsah-dvoj.scss", home=False, h1=False,
         popis="obsah 1V dvojvrstvove 601/604/607; len body.lcd-1v"),
    dict(meno="LCD-1V-OBSAH-CLASSIC", zdroj="_lcd1v-obsah-classic.scss", home=False, h1=False,
         popis="obsah 1V rohoz Classic 619/622/625; len body.lcd-1v"),
    dict(meno="LCD-1V-OBSAH-PREMIUM", zdroj="_lcd1v-obsah-premium.scss", home=False, h1=False,
         popis="obsah 1V rohoz Premium 628/631/634; len body.lcd-1v"),
    dict(meno="LCD-1V-OBSAH-BOXY", zdroj="_lcd1v-obsah-boxy.scss", home=False, h1=False,
         popis="obsah 1V box do kufra 616; len body.lcd-1v"),
    # Vzorkovnik 637 (T5.1, integracia WA 14. 10. 2026) — kazde pravidlo pod body.lcd-1v[data-lcd1v-typ="vzorky"]
    dict(meno="LCD-1V-VZORKY", zdroj="_lcd1v-vzorky.scss", home=False, h1=False,
         popis="konfigurator 1V vzorkovnik 637; len body.lcd-1v"),
    # Obsah vzorkovnika 637 (T5.1b, integracia WB 14. 10. 2026) — tiez az za spolocnymi blokmi obsahu
    dict(meno="LCD-1V-OBSAH-VZORKY", zdroj="_lcd1v-obsah-vzorky.scss", home=False, h1=False,
         popis="obsah 1V vzorkovnik 637; len body.lcd-1v"),
    # Cookie lista Shoptetu v style C + okno nastaveni (Michal 15. 10. 2026) — kazde pravidlo pod html:root = pre vsetkych
    # od prveho vykreslenia, bez cakania na bundle (docs/1v-kontrakt.md §14). Posledny blok:
    # bublina Luxie nad kartou musi prebit aj LCD-1V-CENA (rovnaka specificita, rozhoduje poradie).
    dict(meno="LCD-1V-COOKIES", zdroj="_lcd1v-cookies.scss", home=False, h1=False,
         popis="cookie lista, okno nastaveni a odkaz v pate v style C; html:root = pre vsetkych"),
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
    argv = sys.argv[1:]
    check = "--check" in argv
    vystup = None
    if "--vystup" in argv:
        i = argv.index("--vystup")
        if i + 1 >= len(argv):
            print("CHYBA: --vystup potrebuje cestu k suboru")
            return 2
        vystup = argv[i + 1]
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
    if vystup:
        # luxuryCar.css v repe sa nemeni; vysledok (rovnaky ako po beznom spusteni) ide do zadaneho suboru
        io.open(vystup, "w", encoding="utf-8", newline="").write(text.replace("\n", "\r\n") if crlf else text)
        print("vysledok zapisany do %s (%d znakov)" % (vystup, len(text)))
        return 0
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
