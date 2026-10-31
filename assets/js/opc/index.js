// One page checkout LCD (kniha OPC 28. 10. 2026, variant A): pokladňa = /objednavka/krok-2/ Shoptetu, košík ostáva
// samostatný. Objednávka sa odosiela VÝHRADNE natívnym formulárom Shoptetu (POST Step2Validate), náš kód ho nikdy neposiela.
// Košík (opc/kosik.js): „Pokračovať“ (aj lišta) -> Step1Validate na pozadí -> rovno krok 2. Krok 2 (opc/krok2.js):
// sekcia „Doprava a platba“, zmena platby bez návratu (opc/sync.js), zbalený súhrn a lišta na telefóne (§ 6.2–6.5).
//
// BRÁNA (§ 7.7; Michal 30. 10. 2026: v main vypnuté pre všetkých, živý test „viditeľné len pre mňa“):
//   data.json "opc": false (aj settings.opc) -> nič, ani flag; núdzový vypínač bez nasadenia, má prednosť pred všetkým,
//   ?opc=<KOD> (tajný odkaz) -> localStorage lcdOpc = "1" (všetky karty, aj po zatvorení prehliadača; bez localStorage
//   aspoň sessionStorage karty), ?opc=0 -> flag preč z oboch (po spustení "0" = vypnuté v prehliadači); ?opc=1 ani iná
//   hodnota nič nezapne, bez flagu rozhoduje SPUSTENE (false = presne dnešný tok: modul nič nepridá, nezmení ani nestiahne).
// Beží len na košíku (body.id--9 / in-kosik), na kroku 2 (body.id--17 / in-krok-2) a na ďakovnej stránke po objednávke
// (/objednavka/dekujeme/, SK aj /objednavka/dakujeme/ — opc/dakujeme.js, návrh 4 z 30. 10. 2026), SK 562035 aj CZ 581408.
// Celý modul je v try/catch: chyba = dnešný tok (odkaz na /objednavka/krok-1/).
import { getShoptetContext } from "../functions/shoptetContext.js";
import { initKosik, vzhladKosika, zrusVzhladKosika, prechadzam, zrusPrechadzam } from "./kosik.js";
import { TEXTY } from "./texty.js";
import { initKrok2 } from "./krok2.js";
import { zahodPreskocenie } from "./analytika.js";
import { jeDakujeme, dakujemeSkoro, zrusDakujemeSkoro, initDakujeme } from "./dakujeme.js";

/** Pre všetkých bez ?opc= (spustenie po živom teste s Michalom, kniha § 7.8 F5). */
export const SPUSTENE = false;
export const KLUC_FLAGU = "lcdOpc";
export const PROJEKTY = { 562035: "sk", 581408: "cz" };
/**
 * Tajný kód odkazu na živý test (…/kosik/?opc=<KOD>, vypnutie ?opc=0). NIE JE to bezpečnostná ochrana — kód je vo verejnom
 * repe aj v bundli; je to len zámka proti náhodnému zapnutiu zákazníkom (?opc=1 z prototypu už nič nezapne). Objednávka
 * ide aj tak natívnym formulárom Shoptetu. Zmena kódu = nový odkaz pre Michala.
 */
export const KOD = "31smw9h3gf";

/**
 * Jedna stránka (Michal 31. 10. 2026 „Sprav to takto“): pri zapnutom OPC sa samostatný košík preskočí a košík s ponukou
 * k setu („Vybrať“, doplnok sa pripíše k produktu) je navrchu pokladne (opc/kosikKarta.js). false = košík -> pokladňa
 * ako 30. 10. Vypínač bez nasadenia: data.json "opc_jedna": false (aj settings.opc_jedna).
 */
export const JEDNA_STRANKA = true;

/** Jedna stránka v tomto prehliadači: OPC zapnuté (rovnaká brána ako initOpc) a nevypnutá v data.json. */
export function jednaStranka(setupData) {
  try {
    const s = setupData || {};
    if (!JEDNA_STRANKA || vypnuteVDatach(s)) return false;
    if (s.opc_jedna === false || (s.settings && s.settings.opc_jedna === false)) return false;
    return zapnuteSAdresou(window.location.search);
  } catch (e) {
    return false;
  }
}

/** Košík sa preskočí (main.js: ponuka k setu sa v košíku nekreslí, kreslí sa až v pokladni). */
export function preskocKosik(setupData) {
  try {
    return stranka() === "kosik" && !!PROJEKTY[String(getShoptetContext().projectId || "")] && jednaStranka(setupData);
  } catch (e) {
    return false;
  }
}

/** Hodnota parametra opc z adresy ("" pri ?opc=), bez parametra null. */
function parameter(search) {
  const m = /[?&]opc=([^&#]*)/.exec(search || "");
  return m ? m[1] : null;
}

/** Flag z localStorage (prehliadač), inak zo sessionStorage (karta, keď localStorage nejde). */
function flag() {
  let f = null;
  try { f = localStorage.getItem(KLUC_FLAGU); } catch (e) { f = null; }
  if (f === null) { try { f = sessionStorage.getItem(KLUC_FLAGU); } catch (e) { f = null; } }
  return f;
}

/** Núdzový vypínač v data.json: "opc": false alebo settings.opc === false. */
export function vypnuteVDatach(setupData) {
  const s = setupData || {};
  return s.opc === false || !!(s.settings && s.settings.opc === false);
}

/** Zapíše flag do localStorage, keď nejde, do sessionStorage karty (súkromný režim: ani to -> platí SPUSTENE). */
function zapisFlag(h) {
  try { localStorage.setItem(KLUC_FLAGU, h); return; } catch (e) {}
  try { sessionStorage.setItem(KLUC_FLAGU, h); } catch (e) {}
}

/** ?opc=<KOD> zapne (localStorage), ?opc=0 vypne (zmaže z oboch úložísk). ?opc=1, iná hodnota aj bez parametra nič. */
export function prepinac(search) {
  const v = parameter(search);
  if (v === KOD) zapisFlag("1");
  else if (v === "0") {
    try { localStorage.removeItem(KLUC_FLAGU); } catch (e) {}
    try { sessionStorage.removeItem(KLUC_FLAGU); } catch (e) {}
    if (SPUSTENE) zapisFlag("0");
  }
}

/** Zapnuté v tomto prehliadači? Flag "1" zapne, "0" vypne; bez flagu (aj keď úložisko nejde čítať) podľa SPUSTENE. */
export function jeZapnute() {
  const f = flag();
  if (f === "1") return true;
  return SPUSTENE && f !== "0";
}

/** Brána podľa adresy ešte pred initOpc (flag ukladá až initOpc): kód zapne, ?opc=0 vypne, inak uložený flag. */
function zapnuteSAdresou(search) {
  const v = parameter(search);
  if (v === KOD) return true;
  if (v === "0") return false;
  return jeZapnute();
}

/** "kosik" | "krok2" | "dakujeme" | null podľa tried tela stránky Shoptetu (ďakovná aj podľa adresy / pageType). */
export function stranka(telo) {
  const b = telo || document.body;
  if (!b || !b.classList) return null;
  if (b.classList.contains("id--9") || b.classList.contains("in-kosik")) return "kosik";
  if (b.classList.contains("id--17") || b.classList.contains("in-krok-2")) return "krok2";
  if (jeDakujeme(b.ownerDocument)) return "dakujeme";
  return null;
}

/** dataLayer udalosti lcd_opc_* (kniha § 6.12). */
function meraj(udalost, data) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: udalost }, data || {}));
  } catch (e) {}
}

/**
 * Vzhľad košíka v štýle pokladne hneď pri načítaní bundla (koniec <body>), nie až v callbacku data.json — štýl sa
 * prepne skôr a obsah košíka menej poskočí (CLS). Rovnaká brána ako initOpc okrem núdzového vypínača v data.json (ten
 * príde až s data.json: initOpc vtedy triedu zoberie späť). ?opc= sa tu len číta, flag ukladá initOpc. -> true = zapnuté.
 */
export function vzhladKosikaSkoro(doc, search) {
  try {
    if (!zapnuteSAdresou(search)) return false;
    if (stranka(doc.body) !== "kosik") return false;
    const trh = PROJEKTY[String(getShoptetContext().projectId || "")];
    if (!trh) return false;
    vzhladKosika(doc, TEXTY[trh]);
    // jedna stránka: košík sa hneď preskočí (opc/kosik.js) — kým beží prechod, obsah košíka nevidno
    if (JEDNA_STRANKA && doc.getElementById("continue-order-button")) prechadzam(doc, TEXTY[trh]);
    return true;
  } catch (e) {
    return false;
  }
}
try { if (typeof document !== "undefined" && document.body) vzhladKosikaSkoro(document, window.location.search); } catch (e) {}

/** Poistka skorého skrytia kroku 2: data.json do tohto času neprišiel (initOpc nebežal) -> dnešný krok 2 sa odkryje. */
export const KROK2_LIMIT_MS = 3000;
/**
 * Krok 2 (doladenie 2, CLS): hneď pri načítaní bundla sa formulár so súhrnom skryje (html.lcd-opc-caka, visibility:hidden
 * — rozloženie sa nemení), kým opc/krok2.js nepostaví dizajn A (html.lcd-opc až tam, po initCart: skorá trieda menila
 * rozloženie, ktoré na telefóne videl štart Shoptetu, a rozpis kamióna sa formátoval 2×, S24), položky a sekciu Doprava
 * a platba (alebo záchranu) — potom ho odkryje naraz, obsah neposkočí. Predtým sa natívny krok 2 vykreslil a po data.json
 * a kroku 1 celý preusporiadal (CLS ~0,5). Brána ako vzhladKosikaSkoro; vypínač v data.json a flag „0“ triedu vráti
 * (initOpc -> zrusSkoryVzhlad). Kým sa čaká, nad formulárom je „Načítavam…“ (data-lcd-opc-nacitava, CSS). -> true = zapnuté.
 */
export function vzhladKrok2Skoro(doc, search, o) {
  try {
    if (!zapnuteSAdresou(search)) return false;
    if (stranka(doc.body) !== "krok2") return false;
    const trh = PROJEKTY[String(getShoptetContext().projectId || "")];
    if (!trh) return false;
    // rovnaké podmienky ako initKrok2 (bez formulára, súhrnu alebo tlačidla ostáva dnešný krok 2)
    const form = doc.getElementById("order-form");
    if (!form || !doc.getElementById("summary-box") || !doc.getElementById("submit-order")) return false;
    const H = doc.documentElement;
    H.classList.add("lcd-opc-caka");
    if (form.parentElement) form.parentElement.setAttribute("data-lcd-opc-nacitava", TEXTY[trh].nacitavamKosik);
    const okno = doc.defaultView || window;
    okno.setTimeout(function () {
      if (!H.classList.contains("lcd-opc-caka") || okno.__lcdOpc) return; // initKrok2 beží a odkryje sám
      H.classList.remove("lcd-opc", "lcd-opc-caka");
    }, (o && o.limitMs) || KROK2_LIMIT_MS);
    return true;
  } catch (e) {
    return false;
  }
}
try { if (typeof document !== "undefined" && document.body) vzhladKrok2Skoro(document, window.location.search); } catch (e) {}

/**
 * Ďakovná stránka (opc/dakujeme.js): hneď pri načítaní bundla zachytí pôvodné HTML na záznam a skryje pôvodný obsah,
 * kým initOpc nepostaví nový blok (inak by stránka Shoptetu preblikla). Rovnaká brána ako vzhladKrok2Skoro — bez
 * kódu sa nič nečíta ani nemení; núdzový vypínač v data.json príde až s initOpc (vtedy zrusSkoryVzhlad). -> true = zapnuté.
 */
export function vzhladDakujemeSkoro(doc, search, o) {
  try {
    if (!zapnuteSAdresou(search)) return false;
    if (stranka(doc.body) !== "dakujeme") return false;
    if (!PROJEKTY[String(getShoptetContext().projectId || "")]) return false;
    return dakujemeSkoro(doc, o);
  } catch (e) {
    return false;
  }
}
try { if (typeof document !== "undefined" && document.body) vzhladDakujemeSkoro(document, window.location.search); } catch (e) {}

/** Vypnuté v data.json alebo v prehliadači: skorý vzhľad košíka, kroku 2 aj ďakovnej stránky späť. */
function zrusSkoryVzhlad() {
  try { if (document.documentElement.classList.contains("lcd-opc-kosik")) zrusVzhladKosika(document); } catch (e) {}
  try { zrusPrechadzam(document); } catch (e) {}
  try { if (document.documentElement.classList.contains("lcd-opc-caka")) document.documentElement.classList.remove("lcd-opc", "lcd-opc-caka"); } catch (e) {}
  try { zrusDakujemeSkoro(document); } catch (e) {}
}

/** Volá main.js v callbacku data.json (setupData). Bez flagu sa vráti hneď a nič nespraví. */
export function initOpc(setupData) {
  try {
    if (vypnuteVDatach(setupData)) { zrusSkoryVzhlad(); return null; }
    prepinac(window.location.search);
    if (!jeZapnute()) { zrusSkoryVzhlad(); return null; }
    const kde = stranka();
    // príznak „krok 1 preskočený“ (begin_checkout, opc/analytika.js) platí len pre krok 2 hneď po košíku
    if (kde !== "krok2") zahodPreskocenie();
    if (!kde) return null;
    const trh = PROJEKTY[String(getShoptetContext().projectId || "")];
    if (!trh) return null;
    const ctx = { trh: trh, stranka: kde, stav: "start", chyby: [], meraj: meraj, jednaStranka: jednaStranka(setupData) };
    if (kde === "kosik" && !ctx.jednaStranka) { try { zrusPrechadzam(document); } catch (e) {} }
    window.__lcdOpc = ctx; // ladenie + test (tools/test-opc.mjs)
    try {
      if (kde === "kosik") initKosik(ctx);
      else if (kde === "krok2") initKrok2(ctx);
      else if (kde === "dakujeme") initDakujeme(ctx);
    } catch (e) {
      ctx.stav = "chyba";
      ctx.chyby.push(String((e && e.message) || e));
      // výnimka v kroku 2: formulár skrytý skorým vzhľadom nesmie ostať skrytý (rovnako obsah ďakovnej stránky)
      try { document.documentElement.classList.remove("lcd-opc-caka", "lcd-opc-dakujeme-caka"); } catch (x) {}
    }
    return ctx;
  } catch (e) {
    return null;
  }
}
