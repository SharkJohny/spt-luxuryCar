/**
 * autoPamat.js — auto zákazníka (značka / model / rok / typ) aj v novej karte košíka a objednávky.
 *
 * Prečo (Michal 9. 10. 2026, iPhone CZ: „prestalo sa tu vypisovať auto“): konfigurátor ukladá auto len do
 * sessionStorage (main.js saveModel), a ten platí pre JEDNU kartu. Košík otvorený v novej karte, z odkazu alebo
 * po tom, čo iPhone kartu vyhodil z pamäte, auto nemal — chýbalo v rozpise košíka aj v poznámke objednávky
 * (main.js toNote číta sessionStorage „model“). Overené testom: tá istá karta = „Auto: …“, nová karta = nič.
 *
 * Pravidlá (nezávislá kontrola 9. 10.: zlé auto v objednávke je horšie než žiadne — výroba na mieru):
 *  - ULOŽIŤ len pri pridaní do košíka na stránke s konfigurátorom auta (ShoptetCartUpdated): auto, s ktorým
 *    zákazník set naozaj pridal, nie každé len prezerané;
 *  - DOPLNIŤ len na košíku a krokoch objednávky (body.ordering-process), len do čerstvej karty (žiadny z kľúčov
 *    auta) a len keď košík nie je prázdny — konfigurátor pri novej návšteve ostáva prázdny ako doteraz;
 *  - ZMAZAŤ, keď je košík prázdny (aj po dokončenej objednávke); platnosť 14 dní.
 */
const KLUC = "lcdAuto:v1";
const POLIA = ["Brand", "Model", "Year", "carType", "model"];
export const AUTO_TTL = 14 * 24 * 3600 * 1000;

function platne(v) {
  const t = v == null ? "" : String(v).trim();
  return !!t && t !== "null" && t !== "undefined";
}

/** Úložiská bez výnimky (zablokované cookies/dáta stránok -> SecurityError už pri prístupe). */
function uloziska() {
  let ss = null, ls = null;
  try { ss = window.sessionStorage; } catch (e) {}
  try { ls = window.localStorage; } catch (e) {}
  return { ss: ss, ls: ls };
}

/** Položky košíka z dataLayer Shoptetu; null = nevieme (vtedy nič nemazať ani nedopĺňať). */
function kosikDL() {
  try {
    const e = (window.dataLayer || []).find(function (x) { return x && x.shoptet; });
    const c = e && e.shoptet && e.shoptet.cart;
    return Array.isArray(c) ? c : null;
  } catch (e) { return null; }
}

/** Pri pridaní do košíka: auto karty (všetkých 5 kľúčov platných) uložiť trvalo. */
export function ulozAutoZKarty(ss, ls, teraz = Date.now()) {
  try {
    if (!ss || !ls) return false;
    const z = { t: teraz };
    for (const k of POLIA) { const v = ss.getItem(k); if (!platne(v)) return false; z[k] = String(v); }
    ls.setItem(KLUC, JSON.stringify(z));
    return true;
  } catch (e) { return false; }
}

/**
 * Pri štarte stránky. kosik = položky z dataLayer (null = nevieme), naObjednavke = košík / krok objednávky.
 * -> "zmazane" | "doplnene" | null
 */
export function obnovAuto(ss, ls, kosik, naObjednavke, teraz = Date.now()) {
  try {
    if (!ss || !ls) return null;
    if (Array.isArray(kosik) && kosik.length === 0) { ls.removeItem(KLUC); return "zmazane"; }
    if (!naObjednavke || !Array.isArray(kosik)) return null;
    if (POLIA.some(function (k) { return platne(ss.getItem(k)); })) return null; // karta má vlastný (aj rozpracovaný) výber
    const z = JSON.parse(ls.getItem(KLUC) || "null");
    if (!z || !(teraz - (z.t || 0) < AUTO_TTL) || !POLIA.every(function (k) { return platne(z[k]); })) return null;
    POLIA.forEach(function (k) { ss.setItem(k, z[k]); });
    return "doplnene";
  } catch (e) { return null; }
}

/** main.js: hneď pri načítaní bundla (import je prvý) — pred košíkom (cart.js) aj poznámkou objednávky (toNote). */
export function initAutoPamat() {
  const u = uloziska();
  const b = document.body;
  obnovAuto(u.ss, u.ls, kosikDL(), !!(b && b.classList.contains("ordering-process")));
  // uložiť pri pridaní do košíka, len na stránke s konfigurátorom osobných áut (nie výmena doplnku v košíku, nie kamión)
  document.addEventListener("ShoptetCartUpdated", function () {
    if (!document.querySelector(".surcharge-list.brands.dm-selector select")) return;
    ulozAutoZKarty(u.ss, u.ls);
  });
}
