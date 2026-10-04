"""Stránka darčekovej poukážky z návrhu (artefakt UyGkkqPmvVbVGpaQDpNPTp #poukazka, súbor poukazka.html).

Vyreže obsah <main>, štýly a skripty návrhu, CSS zúži pod #lcd-pk (parser z vault scripts/extract-lcd-home.py),
<section> prepíše na <div data-s> (luxuryCar.css má na mobile globálne section{padding:0;margin:0 !important}),
fotky presmeruje na CDN a tlačidlo košíka napojí na Shoptet (shoptet.cartShared.addToCart podľa kódu variantu).

Výstup (načíta ho len stránka poukážky, viď assets/js/lcdPoukazka.js):
    assets/poukazka/pk.css
    assets/poukazka/pk.js

Spustenie:  python tools/extract-lcd-pk.py --navrh <cesta k poukazka.html>
"""
import argparse
import importlib.util
import io
import json
import os
import re
import sys

KOREN = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTRAKTOR = r"C:/Users/M/Desktop/Luxury Car Design Brain/scripts/extract-lcd-home.py"
CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/"
ROOT = "#lcd-pk"

ODKAZY_SK = {
    "jednovrstvove.html": "/luxusne-autokoberce-dragonskin-diamond-line/",
    "dvojvrstvove.html": "/luxusne-autokoberce-dragonskin-elite-diamond-line/",
    "kufor-classic.html": "/luxusny-koberced-do-kufra-dragonskin-klasik/",
    "kufor-premium.html": "/luxusny-koberced-do-kufra-dragonskin-premium/",
    "boxy.html": "/luxusny-boxi-do-kufra/",
}


def nacitaj_extraktor():
    spec = importlib.util.spec_from_file_location("ex", EXTRAKTOR)
    ex = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ex)
    ex.ROOT = ROOT
    ex.KFPREFIX = "lcdpk-"
    return ex


def cesty(text):
    text = re.sub(r"(?<![\w/.-])assets/([A-Za-z0-9._-]+)", CDN + r"poukazka/\1", text)
    text = re.sub(r"(?<![\w/.-])lx/lcd-home-([A-Za-z0-9._-]+)", CDN + r"lcd-home/\1", text)
    for stare, nove in ODKAZY_SK.items():
        text = text.replace('"' + stare, '"' + nove)
    return text


def sekcie_html(text):
    text = re.sub(r"<section(?=[\s>])", '<div data-s="1"', text)
    return text.replace("</section>", "</div>")


def sekcie_css(css):
    """Typový selektor section -> [data-s] (len v selektoroch, nie v hodnotách vlastností)."""
    out, i = [], 0
    for m in re.finditer(r"([^{}]*)\{", css):
        hlava = m.group(1)
        if "section" in hlava and not hlava.strip().startswith("@"):
            hlava = re.sub(r"(?<![\w.#-])section(?![\w-])", "[data-s]", hlava)
        out.append(css[i:m.start()] + hlava + "{")
        i = m.end()
    out.append(css[i:])
    return "".join(out)


KOSIK_STARY = """  /* ---- košík: maketa ---- */
  function maketa(e){
    e.preventDefault();
    var t = this;
    if(t.dataset.pov) return;
    t.dataset.pov = t.textContent;
    t.textContent = 'Maketa — nič sa neodosiela';
    setTimeout(function(){ t.textContent = t.dataset.pov; delete t.dataset.pov; }, 1800);
  }
  kos.addEventListener('click', maketa);
  if(lKos) lKos.addEventListener('click', maketa);"""

KOSIK_NOVY = """  /* ---- košík: variant podľa zvolenej sumy (POUKAZKA-300 / POUKAZ-7500) cez Shoptet ---- */
  function doKosika(e){
    e.preventDefault();
    var t = this;
    if(t.dataset.pov) return;
    t.dataset.pov = t.textContent;
    t.textContent = PK.textPridavam;
    var hotovo = function(ok){
      t.textContent = ok ? PK.textPridane : PK.textChyba;
      setTimeout(function(){ t.textContent = t.dataset.pov; delete t.dataset.pov; }, 2600);
    };
    var cakam = setTimeout(function(){ hotovo(true); }, 4000);
    document.addEventListener('ShoptetCartUpdated', function h(){
      document.removeEventListener('ShoptetCartUpdated', h); clearTimeout(cakam); hotovo(true);
    });
    try { shoptet.cartShared.addToCart({ productCode: PK.kod + suma, amount: 1 }); }
    catch(err){ clearTimeout(cakam); hotovo(false); if(window.console) console.warn('lcdPk kosik', err); }
  }
  kos.addEventListener('click', doKosika);
  if(lKos) lKos.addEventListener('click', doKosika);"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--navrh", required=True)
    a = ap.parse_args()
    ex = nacitaj_extraktor()
    src = io.open(a.navrh, encoding="utf-8").read()

    css_src = "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", src, re.S))
    skripty = re.findall(r"<script[^>]*>(.*?)</script>", src, re.S)
    main_html = re.search(r'<main id="hlavne">(.*?)</main>', src, re.S).group(1)

    # --- CSS ---
    ctx = {"kf": {}, "hoist": [], "imports": [], "warns": []}
    css = ex.render(ex.parse(css_src), ctx)
    css = ex.rename_animations(css, ctx["kf"])
    css = "\n".join(ctx["imports"] + ctx["hoist"] + [css])
    css = sekcie_css(cesty(css))
    css = "/* GENEROVANE tools/extract-lcd-pk.py z navrhu poukazka.html — needituj rucne */\n" + css + "\n"

    # --- skripty (bez hamburgeru a mega menu — tie na webe rieši lcdHdr) ---
    pouzite = [s for s in skripty if "Hamburger a mega menu" not in s]
    assert len(pouzite) == len(skripty) - 1, "hamburger skript sa nenašiel"
    js = []
    for s in pouzite:
        s = sekcie_html(cesty(s)).replace('"section[', '"[data-s][').replace("'section[", "'[data-s][")
        if "Konfigurátor darčekovej poukážky" in s:
            assert s.count(KOSIK_STARY) == 1, "maketa košíka sa nenašla"
            s = s.replace(KOSIK_STARY, KOSIK_NOVY)
        js.append("try {\n" + s.strip() + "\n} catch (e) { if (window.console) console.warn('lcdPk skript', e); }")

    markup = sekcie_html(cesty(main_html)).strip()

    pk_js = (
        "/* GENEROVANE tools/extract-lcd-pk.py z navrhu poukazka.html — needituj rucne.\n"
        "   Spúšťa ho assets/js/lcdPoukazka.js len na stránke darčekovej poukážky. */\n"
        "(function(){\n"
        "  if (window.__LCD_PK_HOTOVO__) return;\n"
        "  var PK = window.__LCD_PK__ || {};\n"
        "  var MARKUP = " + json.dumps(markup, ensure_ascii=False) + ";\n"
        "  function spusti(){\n"
        "    var wrap = document.getElementById('content-wrapper');\n"
        "    if (!wrap || document.getElementById('lcd-pk')) return;\n"
        "    var koren = document.createElement('div');\n"
        "    koren.id = 'lcd-pk';\n"
        "    koren.innerHTML = PK.preloz ? PK.preloz(MARKUP) : MARKUP;\n"
        "    wrap.parentNode.insertBefore(koren, wrap);\n"
        "    window.__LCD_PK_HOTOVO__ = true;\n"
        "    document.documentElement.classList.add('lcd-pk-on');\n"
        + "\n".join("    " + line for b in js for line in b.split("\n")) + "\n"
        "  }\n"
        "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', spusti); else spusti();\n"
        "})();\n"
    )

    ciel = os.path.join(KOREN, "assets", "poukazka")
    os.makedirs(ciel, exist_ok=True)
    io.open(os.path.join(ciel, "pk.css"), "w", encoding="utf-8", newline="\n").write(css)
    io.open(os.path.join(ciel, "pk.js"), "w", encoding="utf-8", newline="\n").write(pk_js)

    neoscopovane = [r for r in re.findall(r"^([^@\s/][^{]*)\{", css, re.M) if ROOT not in r]
    zvysne = re.findall(r'["(](?:assets|lx)/[^")]+', markup + css + "".join(js))
    print("pk.css %d B, pk.js %d B, mimo %s: %d, neprepisane cesty: %d, varovania: %s"
          % (len(css), len(pk_js), ROOT, len(neoscopovane), len(zvysne), sorted(set(ctx["warns"]))[:8]))
    if neoscopovane:
        print("  napr.:", neoscopovane[:5])
    if zvysne:
        print("  napr.:", zvysne[:5])


if __name__ == "__main__":
    main()
