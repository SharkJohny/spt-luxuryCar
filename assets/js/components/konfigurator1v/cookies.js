// Cookie lišta Shoptetu v štýle C „Prémiová karta“ + okno nastavení v štýle C (Michal 15. 10. 2026: „cookie lištu vyber
// ty, ktorá bude podľa teba najlepšia“). Vzhľad je len CSS nad DOM Shoptetu (_lcd1v-cookies.scss, blok LCD-1V-COOKIES);
// tlačidlá, ich správanie a ukladanie súhlasu ostávajú Shoptetu. Texty sa menia v admine, nie tu.
//
// Brána: TICHÝ TEST spolu s 1V — LEN so zapnutým flagom karty (?novy=1 / ?novy=vyvoj -> sessionStorage lcd1v),
// ale na KAŽDEJ stránke (titulka, kategória, produkt, košík), nie len na produktoch z registra. Bez flagu nič:
// žiadna trieda, žiadny handler, CSS bloku LCD-1V-COOKIES nič nevyberie (každý selektor je pod html.lcd1v-cookies).
// Zapnutie pre všetkých = PRE_VSETKYCH na true (jediné miesto; docs/1v-kontrakt.md §14).
import { prepinac, jeZapnute } from "./index.js";

export const TRIEDA_COOKIES = "lcd1v-cookies";
/** true = nový vzhľad cookie lišty pre všetkých návštevníkov (bez flagu 1V). Dnes len tichý test. */
export const PRE_VSETKYCH = false;
/** CSS premenná na <html>: vzdialenosť horného okraja lišty od spodku okna (px) — bublina Luxie sa posunie nad ňu. */
export const PREMENNA_VYSKY = "--lcd1v-cookies-vyska";
/** Trieda na <html>, kým je chat Luxia zbalený (bublina alebo uvítanie) — len vtedy ho CSS zdvihne nad lištu. */
export const TRIEDA_BUBLINA = "lcd1v-cookies-bublina";

/**
 * Volá main.js hneď pri štarte bundlu (každá stránka). Vráti true, ak sa nový vzhľad zapol.
 * Nikdy nehádže: pri chybe ostane lišta Shoptetu bez zmeny.
 */
export function initCookies1v() {
  try {
    prepinac(window.location.search); // ?novy=1 / vyvoj / 0 platí aj mimo produktu (rovnaký flag karty ako konfigurátor)
    if (!PRE_VSETKYCH && !jeZapnute()) return false;
    const html = document.documentElement;
    html.classList.add(TRIEDA_COOKIES);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { sleduj(html); });
    else sleduj(html);
    return true;
  } catch (e) {
    return false;
  }
}

function sleduj(html) {
  try {
    const lista = document.querySelector(".js-siteCookies .siteCookies__form");
    if (!lista) return; // súhlas už je uložený — Shoptet lištu nevykreslil, nie je čo sledovať
    // výška lišty -> CSS premenná (zmena textu v admine, šírka okna, zalomenie riadkov)
    const zapis = function () {
      const r = lista.getBoundingClientRect();
      if (r.height > 0) html.style.setProperty(PREMENNA_VYSKY, Math.round(window.innerHeight - r.top) + "px");
    };
    zapis();
    if (typeof ResizeObserver === "function") new ResizeObserver(zapis).observe(lista);
    window.addEventListener("resize", zapis);
    sledujLuxiu(html);
  } catch (e) { /* lišta ostane v štýle C, len bez posunu bubliny */ }
}

/**
 * Chat Luxia (iframe tretej strany, widget.js): zbalený = bublina alebo uvítanie (top auto, bez zaoblenia),
 * otvorený = PC karta s border-radius 20px alebo mobil na celé okno (top 0, height 100 %). Kód Luxie sa nemení,
 * len sa číta jej inline štýl; otvorený chat sa nikdy neposúva.
 */
function sledujLuxiu(html) {
  let f = null;
  const stav = function () {
    const s = f && f.style;
    const zbaleny = !!s && s.display !== "none" && s.borderRadius !== "20px" && s.top !== "0px" && s.height !== "100%";
    if (html.classList.contains(TRIEDA_BUBLINA) !== zbaleny) html.classList.toggle(TRIEDA_BUBLINA, zbaleny);
  };
  const najdi = function () {
    const n = document.querySelector('iframe[title="Luxia chat"]');
    if (!n) return false;
    f = n;
    new MutationObserver(stav).observe(f, { attributes: true, attributeFilter: ["style"] });
    stav();
    return true;
  };
  if (najdi() || typeof MutationObserver !== "function") return;
  const mo = new MutationObserver(function () { if (najdi()) mo.disconnect(); });
  mo.observe(document.body || html, { childList: true });
}
