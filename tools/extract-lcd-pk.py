"""Stránka darčekovej poukážky z návrhu (artefakt UyGkkqPmvVbVGpaQDpNPTp #poukazka, súbor poukazka.html).

Vyreže obsah <main>, štýly a skripty návrhu, CSS zúži pod #lcd-pk (parser z vault scripts/extract-lcd-home.py),
<section> prepíše na <div data-s> (luxuryCar.css má na mobile globálne section{padding:0;margin:0 !important}),
fotky presmeruje na CDN a tlačidlo košíka napojí na Shoptet (shoptet.cartShared.addToCart podľa kódu variantu).

Výstup (načíta ho len stránka poukážky, viď assets/js/lcdPoukazka.js):
    assets/poukazka/pk.css
    assets/poukazka/pk.js (SK), assets/poukazka/pk-cz.js (CZ, preklad tools/pk-preklad-cz.json)

Spustenie:  python tools/extract-lcd-pk.py --navrh <cesta k poukazka.html>
            python tools/extract-lcd-pk.py --len-recenzie-cz   (len české recenzie do hotového pk-cz.js)
"""
import argparse
import html
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

KOSIK_NOVY = """  /* ---- košík: variant podľa zvolenej sumy (POUKAZKA-300 / POUKAZ-7500) cez Shoptet ----
     Úspech/chybu čítame z odpovede /action/Cart/addCartItem/ (code 200 = vložené). Po úspechu ide zákazník
     rovno do košíka (Michal 4. 10. 2026). Shoptet po úspechu stránku obnoví a mohol by presmerovanie prebiť —
     preto aj značka lcdPkDoKosika, podľa ktorej lcdPoukazka.js po obnovení presmeruje do košíka. */
  function ukazPridane(v){
    var bar = document.getElementById('pkPridane');
    if(!bar){
      bar = document.createElement('div');
      bar.id = 'pkPridane'; bar.className = 'pk-pridane'; bar.setAttribute('role', 'status');
      kos.parentNode.insertBefore(bar, kos.nextSibling);
    }
    bar.innerHTML = '<span class="pk-pridane-t"></span><a class="pk-pridane-a" href="' + PK.kosikUrl + '"></a>';
    bar.querySelector('.pk-pridane-t').textContent = PK.textVKosiku.replace('%s', eur(v));
    bar.querySelector('.pk-pridane-a').textContent = PK.textDoKosika + ' →';
  }
  function doKosika(e){
    e.preventDefault();
    var t = this;
    if(t.dataset.pov) return;
    t.dataset.pov = t.textContent;
    t.textContent = PK.textPridavam;
    var povodny = XMLHttpRequest.prototype.open, hotovo = false;
    function koniec(ok, sprava){
      if(hotovo) return; hotovo = true;
      XMLHttpRequest.prototype.open = povodny;
      if(ok){
        try { sessionStorage.setItem('lcdPkDoKosika', String(Date.now())); } catch(_){}
        t.textContent = PK.textPridane;
        ukazPridane(suma);
        location.href = PK.kosikUrl;
      } else {
        t.textContent = (sprava && String(sprava).replace(/<[^>]+>/g, '')) || PK.textChyba;
        setTimeout(function(){ t.textContent = t.dataset.pov; delete t.dataset.pov; }, 4000);
      }
    }
    XMLHttpRequest.prototype.open = function(m, u){
      if(/addCartItem/.test(String(u))){
        XMLHttpRequest.prototype.open = povodny;
        var x = this;
        x.addEventListener('load', function(){
          var j = {}; try { j = JSON.parse(x.responseText); } catch(_){}
          koniec(x.status === 200 && (j.code === undefined || j.code === 200), j.message);
        });
        x.addEventListener('error', function(){ koniec(false); });
      }
      return povodny.apply(this, arguments);
    };
    setTimeout(function(){ koniec(false); }, 15000);
    try { shoptet.cartShared.addToCart({ productCode: PK.kod + suma, amount: 1 }); }
    catch(err){ koniec(false); if(window.console) console.warn('lcdPk kosik', err); }
  }
  kos.addEventListener('click', doKosika);
  if(lKos) lKos.addEventListener('click', doKosika);
  try { sessionStorage.removeItem('lcdPkPridane'); } catch(_){}"""



EUR = list(range(100, 801, 50))
KC = list(range(2500, 20001, 1250))
FOTKY_CZ = {"pk-vysku-prazdna.jpg": "pk-cz-vysku-prazdna.jpg", "pk-sirka-300.jpg": "pk-cz-sirka-7500.jpg",
            "pk-vysku-300-v2.jpg": "pk-cz-vysku-7500.jpg", "pk-hodnoty.jpg": "pk-cz-hodnoty.jpg",
            "pk-email.jpg": "pk-cz-email.jpg"}
EUR_SK = "function eur(v){ return v + ' €'; }"
EUR_CZ = r"function eur(v){ return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Kč'; }"

PRIDANE_CSS = """
/* potvrdenie po vložení do košíka (pk.js ukazPridane) */
#lcd-pk .pk-pridane{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 14px;margin-top:12px;
  padding:13px 16px;border-radius:14px;background:rgba(47,156,104,.1);border:1px solid rgba(47,156,104,.45);color:#14110c;font-size:15px;line-height:1.4}
#lcd-pk .pk-pridane-t{display:inline-flex;align-items:center;gap:10px;font-weight:600}
#lcd-pk .pk-pridane-t:before{content:"\\2713";flex:none;width:24px;height:24px;border-radius:50%;background:#2f9c68;color:#fff;
  display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
#lcd-pk .pk-pridane-a{font-family:"Exo 2","Segoe UI",Arial,sans-serif;font-weight:800;font-size:12.5px;letter-spacing:.1em;
  text-transform:uppercase;color:#1f7d4f;text-decoration:none;white-space:nowrap}
#lcd-pk .pk-pridane-a:hover{text-decoration:underline}
"""


def preloz_markup(mk, preklad):
    for s, c in FOTKY_CZ.items():
        mk = mk.replace("poukazka/" + s, "poukazka/" + c)
    for e, k in zip(EUR, KC):
        mk = mk.replace('data-v="%d"' % e, 'data-v="%d"' % k)

    def text(m):
        raw = m.group(1)
        jadro = raw.strip()
        if not jadro:
            return m.group(0)
        nove = preklad.get(jadro)
        if nove is None:
            nove = preklad.get(html.unescape(jadro))
        if nove is None:
            return m.group(0)
        zac = raw[:len(raw) - len(raw.lstrip())]
        kon = raw[len(raw.rstrip()):]
        return ">" + zac + nove + kon + "<"
    mk = re.sub(r">([^<>]+)<", text, mk)

    def atr(m):
        meno, hod = m.group(1), m.group(2)
        nove = preklad.get(html.unescape(hod))
        return m.group(0) if nove is None else '%s="%s"' % (meno, html.escape(nove, quote=True))
    mk = re.sub(r'\b(alt|aria-label|data-alt|title|placeholder)="([^"]*)"', atr, mk)
    return mk.replace("luxurycardesign.sk", "luxurycardesign.cz")


def preloz_js(s, preklad):
    for e, k in zip(EUR, KC):
        s = s.replace('data-v="%d"' % e, 'data-v="%d"' % k)
    for sk, cz in FOTKY_CZ.items():
        s = s.replace("poukazka/" + sk, "poukazka/" + cz)
    s = s.replace("var MIN = 100, MAX = 800, KROK = 50, PREDVOLENA = 300;",
                  "var MIN = 2500, MAX = 20000, KROK = 1250, PREDVOLENA = 7500;")
    s = s.replace(EUR_SK, EUR_CZ)

    def lit(m):
        q, obsah = m.group(1), m.group(2)
        nove = preklad.get(obsah)
        if nove is None:
            return m.group(0)
        return q + nove.replace("\\", "\\\\").replace(q, "\\" + q) + q
    return re.sub(r"(['\"])((?:(?!\1)[^\\\n])*)\1", lit, s)


# CZ stránka: recenzie „Hodnocení přímo z Googlu“ (#revs) z návrhu boli väčšinou slovenské (tablet 8. 10. 2026) ->
# české recenzie z assets/js/reviews-data.js (rovnaká sada ako lcd-reviews na CZ produktoch), poradie podľa ID.
RECENZIE_CZ = ["g-38", "g-33", "g-58", "g-39", "g-48", "g-71", "g-44", "g-65", "g-19"]
CDN_RECENZIE = CDN + "reviews/"


def _text_recenzie(t, maxlen=300):
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^\d{1,2}\. \d{1,2}\. \d{4} ", "", t)          # dátum na začiatku (scraper)
    t = re.split(r" \+\d+(?: |$)", t)[0]                        # „+2“ = počet fotiek, za ním odpoveď majiteľa
    t = re.sub(r" (?:Upraviť|Odstrániť)\b.*$", "", t).strip()
    if len(t) > maxlen:
        t = t[:maxlen].rsplit(" ", 1)[0].rstrip(" ,.;") + "…"
    return t


def recenzie_cz(mk):
    data = io.open(os.path.join(KOREN, "assets", "js", "reviews-data.js"), encoding="utf-8").read()
    data = json.loads(data[data.index("{"):data.rindex("}") + 1])
    podla_id = {r["id"]: r for r in data["reviews"]}
    m = re.search(r'(<div class="revs" id="revs">)((?:\s*<article class="rev">.*?</article>)+)', mk, re.S)
    assert m, "#revs sa nenašiel"
    gsvg = re.search(r'<div class="foot">.*?(<svg.*?</svg>)</div>', m.group(2), re.S).group(1)
    clanky = []
    for rid in RECENZIE_CZ:
        r = podla_id[rid]
        assert r.get("language") == "cz", rid
        meno = r["author"].strip()
        inic = "".join(c[0] for c in meno.split()[:2]).upper()
        fotky = "".join('<img src="%s" alt="" loading="lazy" width="260" height="260">'
                        % html.escape(CDN_RECENZIE + p.split("/")[-1], quote=True) for p in (r.get("photos") or [])[:3])
        clanky.append(
            '\n        <article class="rev">\n          <span class="qm">&ldquo;</span>\n          <div class="st">★★★★★</div>\n'
            '          <p>%s</p>\n' % html.escape(_text_recenzie(r["text"]), quote=False)
            + ('          <div class="shots">%s</div>\n' % fotky if fotky else "")
            + '          <div class="foot"><span class="av">%s</span><span class="meta"><b>%s</b><i>Ověřený zákazník</i></span>%s</div>\n'
              '        </article>' % (html.escape(inic), html.escape(meno), gsvg))
    return mk[:m.start(2)] + "".join(clanky) + mk[m.end(2):]


def len_recenzie_cz():
    """Bez návrhu: v hotovom assets/poukazka/pk-cz.js vymení len obsah #revs (rovnaká funkcia ako pri plnom behu)."""
    cesta = os.path.join(KOREN, "assets", "poukazka", "pk-cz.js")
    s = io.open(cesta, encoding="utf-8").read()
    m = re.search(r'(  var MARKUP = )(".*?")(;\n)', s, re.S)
    mk = recenzie_cz(json.loads(m.group(2)))
    s = s[:m.start(2)] + json.dumps(mk, ensure_ascii=False) + s[m.end(2):]
    io.open(cesta, "w", encoding="utf-8", newline="\n").write(s)
    print("pk-cz.js: #revs = %d českých recenzií" % len(RECENZIE_CZ))


def obal(markup, js):
    bloky = ["try {\n" + s.strip() + "\n} catch (e) { if (window.console) console.warn('lcdPk skript', e); }" for s in js]
    return (
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
        "    koren.innerHTML = MARKUP;\n"
        "    wrap.parentNode.insertBefore(koren, wrap);\n"
        "    window.__LCD_PK_HOTOVO__ = true;\n"
        "    document.documentElement.classList.add('lcd-pk-on');\n"
        + "\n".join("    " + line for b in bloky for line in b.split("\n")) + "\n"
        "  }\n"
        "  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', spusti); else spusti();\n"
        "})();\n"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--navrh")
    ap.add_argument("--len-recenzie-cz", action="store_true", help="len vymeniť recenzie v hotovom pk-cz.js (bez návrhu)")
    a = ap.parse_args()
    if a.len_recenzie_cz:
        return len_recenzie_cz()
    if not a.navrh:
        ap.error("--navrh je povinný (alebo --len-recenzie-cz)")
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
    css = "/* GENEROVANE tools/extract-lcd-pk.py z navrhu poukazka.html — needituj rucne */\n" + css + "\n" + PRIDANE_CSS

    # --- skripty (bez hamburgeru a mega menu — tie na webe rieši lcdHdr) ---
    pouzite = [s for s in skripty if "Hamburger a mega menu" not in s]
    assert len(pouzite) == len(skripty) - 1, "hamburger skript sa nenašiel"
    js_sk = []
    for s in pouzite:
        s = sekcie_html(cesty(s)).replace('"section[', '"[data-s][').replace("'section[", "'[data-s][")
        if "Konfigurátor darčekovej poukážky" in s:
            assert s.count(KOSIK_STARY) == 1, "maketa košíka sa nenašla"
            s = s.replace(KOSIK_STARY, KOSIK_NOVY)
            assert s.count(EUR_SK) == 1 and s.count("var MIN = 100, MAX = 800, KROK = 50, PREDVOLENA = 300;") == 1
        js_sk.append(s)
    markup_sk = sekcie_html(cesty(main_html)).strip()

    # --- CZ: preklad (tools/pk-preklad-cz.json), hodnoty v Kč, české fotky ---
    preklad = json.load(io.open(os.path.join(KOREN, "tools", "pk-preklad-cz.json"), encoding="utf-8"))
    markup_cz = recenzie_cz(preloz_markup(markup_sk, preklad))
    js_cz = [preloz_js(s, preklad) for s in js_sk]

    ciel = os.path.join(KOREN, "assets", "poukazka")
    os.makedirs(ciel, exist_ok=True)
    io.open(os.path.join(ciel, "pk.css"), "w", encoding="utf-8", newline="\n").write(css)
    for meno, mk, js in (("pk.js", markup_sk, js_sk), ("pk-cz.js", markup_cz, js_cz)):
        io.open(os.path.join(ciel, meno), "w", encoding="utf-8", newline="\n").write(obal(mk, js))

    zvysne = re.findall(r'["(](?:assets|lx)/[^")]+', markup_sk + css + "".join(js_sk))
    print("pk.css %d B, pk.js + pk-cz.js, neprepisane cesty: %d" % (len(css), len(zvysne)))
    # kontrola CZ: slovenské slová, ktoré ostali v texte stránky (recenzie sú české z reviews-data.js, recenzie_cz)
    texty = [html.unescape(re.sub(r"\s+", " ", x)).strip()
             for x in re.findall(r">([^<>]+)<", re.sub(r"<svg.*?</svg>", "", markup_cz, flags=re.S))]
    sk = [x for x in texty if re.search(r"[äôĺľŕ]|\b(alebo|sa|na mieru|kufra|poukážk\w*|hodnote|košík)\b", x)]
    print("CZ — texty so slovenčinou (%d):" % len(sk))
    for x in sk[:40]:
        print("   ", x[:110])
    sk_js = sorted(set(m for s in js_cz for m in re.findall(r"'([^'\n]*[äôĺľŕ][^'\n]*)'", s)))
    print("CZ JS — reťazce so slovenčinou (%d):" % len(sk_js), sk_js[:20])


if __name__ == "__main__":
    main()
