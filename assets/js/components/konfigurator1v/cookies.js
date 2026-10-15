// Cookie lišta Shoptetu v štýle C „Prémiová karta“ + okno nastavení v štýle C (Michal 15. 10. 2026: „cookie lištu vyber
// ty, ktorá bude podľa teba najlepšia“). Vzhľad je len CSS nad DOM Shoptetu (_lcd1v-cookies.scss, blok LCD-1V-COOKIES);
// tlačidlá, ich správanie a ukladanie súhlasu ostávajú Shoptetu. Texty sa menia v admine, nie tu.
//
// PRE VŠETKÝCH (Michal 15. 10. 2026, zapnuté po tichom teste): vzhľad dáva CSS v <head> od prvého vykreslenia (selektory
// pod html:root, nečaká na tento bundle na konci <body> — inak sa na ~0,5 s mihla stará modrá lišta). Tento modul na
// každej stránke a pre každého návštevníka (s flagom 1V aj bez neho) len:
//   1. zdvihne zbalenú bublinu Luxie nad kartu, kým je lišta na obrazovke (bez Luxie nerobí nič),
//   2. pridá do päty trvalý odkaz „Nastavenia cookies“ (GDPR čl. 7 ods. 3: odvolať súhlas rovnako ľahko ako ho dať) —
//      otvorí to isté okno Shoptetu ako „Nastavenie“ na lište, aj keď lišta už zmizla (súhlas uložený).
// Trieda html.lcd1v-cookies je už len značka „modul bežal“ (CSS ju nepotrebuje). docs/1v-kontrakt.md §14.
import { prepinac } from "./index.js";

export const TRIEDA_COOKIES = "lcd1v-cookies";
/** CSS premenná na <html>: vzdialenosť horného okraja lišty od spodku okna (px) — bublina Luxie sa posunie nad ňu. */
export const PREMENNA_VYSKY = "--lcd1v-cookies-vyska";
/** Trieda na <html>, kým je chat Luxia zbalený (bublina alebo uvítanie) — len vtedy ho CSS zdvihne nad lištu. */
export const TRIEDA_BUBLINA = "lcd1v-cookies-bublina";
/** Odkaz „Nastavenia cookies“ v päte (riadok s copyrightom). js-cookies-settings = Shoptet ho obslúži sám. */
export const TRIEDA_ODKAZ = "lcd-cookies-odkaz";

/**
 * Volá main.js hneď pri štarte bundlu (každá stránka, každý návštevník). Vráti true, ak modul nabehol.
 * Nikdy nehádže: pri chybe ostane lišta v štýle C z CSS, len bez posunu bubliny / odkazu v päte.
 */
export function initCookies1v() {
  try {
    prepinac(window.location.search); // ?novy=1 / vyvoj / 0 platí aj mimo produktu (rovnaký flag karty ako konfigurátor)
    const html = document.documentElement;
    html.classList.add(TRIEDA_COOKIES);
    const start = function () { sleduj(html); odkazVPate(); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
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
 * len sa číta jej inline štýl; otvorený chat sa nikdy neposúva. Bez Luxie (widget nenačítaný) sa nič nedeje.
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

/**
 * Trvalý odkaz „Nastavenia cookies“ (SK) / „Nastavení cookies“ (CZ) na konci riadku s copyrightom v päte.
 * Trieda js-cookies-settings: Shoptet má delegovaný handler $("html").on("click", ".js-cookies-settings",
 * shoptet.consent.openCookiesSettingModal) — rovnaké okno ako „Nastavenie“ na lište, s uloženými voľbami, aj po súhlase.
 * Len ak má e-shop zapnutý súhlas s cookies a Shoptet funkciu má; bez päty (pokladňa) nič. Nič existujúce sa neskrýva.
 */
function odkazVPate() {
  try {
    const sh = window.shoptet;
    if (!sh || !sh.config || sh.config.cookiesConsentIsActive !== 1) return;
    if (!sh.consent || typeof sh.consent.openCookiesSettingModal !== "function") return;
    if (document.querySelector("." + TRIEDA_ODKAZ)) return;
    const copyright = document.querySelector("#footer .footer-bottom .copyright");
    if (!copyright) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = TRIEDA_ODKAZ + " js-cookies-settings";
    b.setAttribute("aria-haspopup", "dialog");
    b.textContent = /^cs/i.test(document.documentElement.lang || "") ? "Nastavení cookies" : "Nastavenia cookies";
    copyright.appendChild(b);
  } catch (e) { /* päta ostane ako dnes */ }
}
