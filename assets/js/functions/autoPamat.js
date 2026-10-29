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
    if (Array.isArray(kosik) && kosik.length === 0) { ls.removeItem(KLUC); ls.removeItem(KLUC_POLOZKY); return "zmazane"; }
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
    // auto k pridanej položke (priceId formulára produktu) — odrážka „Auto:“ a ponuka k setu ho pri nej overia (autoRiadku)
    const p = document.querySelector('#product-detail-form input[name="priceId"]');
    if (p) zapisAutoPolozky(u.ss, u.ls, p.value);
  });
}

// ------------------------------------------------------------------ auto pri položke košíka
/*
 * Odrážka „Auto: Skoda Octavia 2021 Combi“ v rozpise položky (cart.js) a názov ponuky k setu „Rohož do kufra pre Skoda
 * Octavia 2021“ (lcdKosikDoplnok.js, Michal 29. 10. 2026). Ukazuje sa vždy auto karty (sessionStorage, po obnove
 * z lcdAuto:v1) — TO ISTÉ auto ide do poznámky objednávky (main.js toNote, „model: …“). Záznam z pridania do košíka
 * (lcdAutoPolozky:v1: priceId -> auto karty v okamihu pridania) len rozhodne, či k riadku patrí: set pridaný pre iné auto
 * (dva sety pre dve autá, prezretie iného auta po pridaní) nedostane nič — ponuka by inak pri Octavii ponúkla „Rohož do
 * kufra pre Passat“ (podrobne pri autoRiadku). Platnosť 14 dní ako lcdAuto:v1, prázdny košík záznamy zmaže (obnovAuto).
 */
export const KLUC_POLOZKY = "lcdAutoPolozky:v1";
const MAX_POLOZIEK = 30;
const AUTO_KLUCE = ["Brand", "Model", "Year", "carType"];

/* Zástupné texty selectov konfigurátora (cars.js cstm_*, „Typ auta“; configuratorEngine.js lcdPlaceholders) — nie sú
   údaj o aute („Značka: Značka, Rok: Rok výroby“; tablet 8. 10. 2026). lcdAutoHodnota používa aj cart.js. */
const LCD_AUTO_ZASTUPNE = ["Značka", "Model", "Rok výroby", "Typ auta", "Ročník", "Typ",
  "Prosím, vyberte značku vozidla", "Prosím,vyberte model vozidla", "Prosím,vyberte rok výroby vozidla"];
export function lcdAutoHodnota(v) {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/\s+/g, " ").trim();
  if (!t || t === "undefined" || t === "null" || LCD_AUTO_ZASTUPNE.indexOf(t) !== -1) return null;
  return t;
}
/** „Iné, prosím napíšte do poznámky“ / „Jiné, prosím napište…“ (rok aj typ) — voľba zákazníka, ale nie údaj o aute */
const INE = /^\s*(?:in[ée]|jin[ée])(?=[\s,.;:]|$)/i; // nie \b: „é“ nie je \w, hranica za ním by nebola
const normTyp = (t) => String(t || "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
function rovnakyTyp(a, b) { return normTyp(a) === normTyp(b) || (INE.test(a) && INE.test(b)); }

/** Auto z objektu s kľúčmi Brand/Model/Year/carType (karta = sessionStorage) -> { Brand, Model, Year, carType } | null (bez značky alebo modelu) */
function autoZ(citaj) {
  const a = {};
  AUTO_KLUCE.forEach(function (k) { a[k] = lcdAutoHodnota(citaj(k)); });
  return a.Brand && a.Model && !INE.test(a.Brand) && !INE.test(a.Model) ? a : null;
}
function zaznamy(ls) {
  try { const z = JSON.parse(ls.getItem(KLUC_POLOZKY) || "[]"); return Array.isArray(z) ? z : []; } catch (e) { return []; }
}

/** Pri pridaní do košíka: auto karty k priceId pridaného produktu (najviac 30 záznamov, rovnaký priceId + auto len raz). */
export function zapisAutoPolozky(ss, ls, priceId, teraz = Date.now()) {
  try {
    return !!ss && zapisAutoKPolozke(ls, priceId, autoZ(function (k) { return ss.getItem(k); }), teraz);
  } catch (e) { return false; }
}

/** Auto k priceId (aj pri výmene riadku košíka za iný produkt — dvojvrstvový set: auto starého riadku prejde na nový). */
export function zapisAutoKPolozke(ls, priceId, auto, teraz = Date.now()) {
  try {
    const a = auto ? autoZ(function (k) { return auto[k]; }) : null;
    if (!ls || !priceId || !a) return false;
    const p = String(priceId), kluc = JSON.stringify(a);
    const z = zaznamy(ls).filter(function (x) { return x && (x.p !== p || JSON.stringify(x.a) !== kluc); })
      .filter(function (x) { return x && teraz - (x.t || 0) < AUTO_TTL; });
    z.push({ p: p, a: a, t: teraz });
    ls.setItem(KLUC_POLOZKY, JSON.stringify(z.slice(-MAX_POLOZIEK)));
    return true;
  } catch (e) { return false; }
}

/** TYP karosérie z textu príplatkov riadku („…, TYP - Combi, …“; CZ hodnota „Jiné,Prosím napište…“ má čiarku) alebo null */
export function typZPriplatkov(sur) {
  const m = /(?:^|[,:]\s*)TYP\s*[-–:]\s*(.+?)(?=,\s*[^,]*\s[-–]\s|$)/.exec(String(sur || "").replace(/\s+/g, " ").trim());
  return m ? m[1].trim() || null : null;
}

const rovnakeAuto = function (a, b) { return AUTO_KLUCE.every(function (k) { return normTyp(a[k]) === normTyp(b[k]); }); };

/**
 * Auto riadku košíka { priceId, sur } -> { Brand, Model, Year, carType } | null.
 * LEN auto, ktoré ide do poznámky objednávky (nezávislá kontrola 29. 10. 2026: záznam z pridania mal prednosť, a keď
 * zákazník po pridaní prezrel v tej istej karte iné auto, košík ukázal prvé, ale výroba dostala druhé):
 *  - auto karty = sessionStorage Brand/Model/Year/carType, a len keď je úplné („model“ — main.js toNote ho píše do poznámky);
 *  - nič, keď je v karte súhrn kamióna (toNote vtedy píše len kamión, „model: …“ nie);
 *  - TYP riadku („TYP - Combi“ v príplatkoch) musí sedieť s typom karty;
 *  - záznamy z pridania (lcdAutoPolozky:v1) s týmto priceId a TYP: žiadny = auto karty; jedno auto = len keď je to auto
 *    karty; dve rôzne autá = nevieme, ktorý riadok je ktorý -> nič. Zlé auto je horšie než žiadne (výroba na mieru).
 */
export function autoRiadku(ss, ls, riadok, teraz = Date.now()) {
  try {
    if (!ss || !platne(ss.getItem("model")) || platne(ss.getItem("truckOrderSummary"))) return null;
    const karta = autoZ(function (k) { return ss.getItem(k); });
    const typ = typZPriplatkov(riadok && riadok.sur);
    const sedi = function (a) { return !typ || !a.carType || rovnakyTyp(a.carType, typ); };
    if (!karta || !sedi(karta)) return null;
    if (ls && riadok && riadok.priceId) {
      const p = String(riadok.priceId);
      const auta = [];
      zaznamy(ls).forEach(function (x) {
        if (!x || x.p !== p || !x.a || !(teraz - (x.t || 0) < AUTO_TTL)) return;
        const a = autoZ(function (k) { return x.a[k]; });
        if (a && sedi(a) && !auta.some(function (b) { return rovnakeAuto(a, b); })) auta.push(a);
      });
      if (auta.length > 1 || (auta.length === 1 && !rovnakeAuto(auta[0], karta))) return null;
    }
    return karta;
  } catch (e) { return null; }
}

/** „Skoda Octavia 2021 Combi“ (sTypom = false: bez typu karosérie); zástupné texty a „Iné, prosím…“ vynechá */
export function popisAuta(a, sTypom = true) {
  if (!a) return null;
  const casti = [a.Brand, a.Model, a.Year, sTypom ? a.carType : null].map(lcdAutoHodnota).filter(function (v) { return v && !INE.test(v); });
  return lcdAutoHodnota(a.Brand) && lcdAutoHodnota(a.Model) && casti.length >= 2 ? casti.join(" ") : null;
}

/** sessionStorage a localStorage bez výnimky (pre cart.js a ponuku k setu) */
export function ulozistaAuta() { return uloziska(); }
