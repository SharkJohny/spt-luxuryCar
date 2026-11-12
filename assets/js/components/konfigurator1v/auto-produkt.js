// Stránka auta (Michal 9. 11. 2026, kniha Brain napady/2026-11-06-kniha-stranky-podla-auta.md): produkt pre jedno auto,
// napr. SK 649 „Autokoberce Škoda Kodiaq II“ = kópia jednovrstvového produktu toho istého vzoru (613 Stripe) s pevným autom.
// Register produkty.js: auto = { znacka, model, nazov } — znacka a model presne ako v katalógu áut (data.json `cars`).
// Na stránky áut sa zákazník dostane len z Googlu alebo z pätičky (značky); hlavný konfigurátor na ne nikdy nepresmeruje
// (produkty.js najdiProdukt ich preskakuje).
//
//  - pri načítaní: značka a model predvyplnené (change ako pri výbere zákazníkom -> main.js saveModel uloží auto; rok iného
//    uloženého auta sa vynuluje), rok
//    a typ karosérie vyberie zákazník; pod výberom auta nápis „Predvyplnené pre Škoda Kodiaq II…“.
//  - krok „Vzor prešívania“ je pri načítaní otvorený (dlaždice Diamond / Stripe / Hexa, vzor stránky označený).
//  - zákazník zmení značku alebo model: výber (farba, rozloženie, kufor, boxy, volant, miesta, dvere) sa prenesie
//    (prenos.js zapisPrenos) a prejde na hlavný jednovrstvový produkt VŽDY Diamond Line (598 / CZ 2403, Michal 9. 11.
//    2026: „keď niekoho prenášaš z jedného konfigurátora do druhého, prenes ho do Diamond Line vždycky“) aj s novým autom
//    (auto nesie sessionStorage z main.js). Typ karosérie ani rok nič nepresúvajú (Michal: „sedan na kupé ešte nie“).
//    Myšou alebo prstom hneď; z klávesnice (šípka v zatvorenom selecte na Windows mení hodnotu) až keď zákazník z polí
//    auta odíde, aby pri prechádzaní značiek šípkami neodišiel na prvej inej.
//  - druhá vrstva: druha-vrstva.js -> dvojvrstvový Diamond Line (601 / CZ 2406) s prenosom; dlaždica iného vzoru ->
//    hlavný jednovrstvový produkt toho vzoru s prenosom. Farba sa v cieli páruje podľa názvu (prenos.js kluceFarby).
//  - stránka auta na dvojvrstvovom produkte (Michal 12. 11. 2026: BMW s našimi fotkami s druhou vrstvou = kópia 601):
//    všetko rovnako, len cieľ je dvojvrstvový — zmena auta -> Elite Diamond Line (601 / CZ 2406), dlaždica vzoru ->
//    dvojvrstvový produkt toho vzoru (601 / 604 / 607). Typ cieľa = typ stránky (typHlavneho).
import { lcdPlatnaHodnota, lcdNorm } from "../../functions/autoVyber.js";
import { najdiProdukt } from "./produkty.js";
import { zapisPrenos } from "./prenos.js";

export const MENO = "auto-produkt";
/** Change do tohto času po klávese na tom istom poli = zmena z klávesnice (ms), ako vclass-presmerovanie.js. */
export const KLAVESNICA_MS = 600;
/** Hlavný konfigurátor pre prenos zo stránky auta (zmena auta, druhá vrstva v druha-vrstva.js): vždy Diamond Line. */
export const CIEL_VZOR = "diamond";
/** Otvorenie kroku vzoru po tom, čo engine pri načítaní otvorí auto (ms). */
export const OTVOR_VZOR_MS = 250;

export const TEXTY_SK = {
  nadpis: "Predvyplnené pre {0}",
  text: "Máte iné auto? Zmeňte značku alebo model a prenesieme Vás do konfigurátora pre všetky autá aj s tým, čo ste už vybrali.",
};
export const TEXTY_CZ = {
  nadpis: "Předvyplněno pro {0}",
  text: "Máte jiné auto? Změňte značku nebo model a přeneseme Vás do konfigurátoru pro všechna auta i s tím, co jste už vybrali.",
};

let zrus = null;

/** Typ hlavného konfigurátora pre prenos: dvojvrstvová stránka auta -> "dvoj" (601/604/607), inak "jedno". */
export function typHlavneho(produkt) {
  return produkt && produkt.typ === "dvoj" ? "dvoj" : "jedno";
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const A = ctx.produkt && ctx.produkt.auto;
  if (!A || !A.znacka || !A.model) return;
  const TYP = typHlavneho(ctx.produkt);
  const krok = ctx.krok("auto");
  const wrap = krok && krok.querySelector(".modl-selector-wrap");
  const sel = (k) => (wrap ? wrap.querySelector(".surcharge-list." + k + " select") : null);
  const s = [sel("brands"), sel("models"), sel("years")].filter(Boolean);
  if (s.length < 2) return;
  const cz = String(ctx.projectId) === "581408";
  const T = cz ? TEXTY_CZ : TEXTY_SK;
  const $ = window.jQuery || window.$;
  const posliChange = (x) => ($ ? $(x).trigger("change") : x.dispatchEvent(new Event("change", { bubbles: true })));
  const jeAuto = () => lcdNorm(lcdPlatnaHodnota(s[0])) === lcdNorm(A.znacka) && lcdNorm(lcdPlatnaHodnota(s[1])) === lcdNorm(A.model);

  /** Vyberie v selecte možnosť s textom/hodnotou (bez placeholdera) a pošle change, ak sa zmenila. */
  function vyber(x, hodnota) {
    const n = lcdNorm(hodnota);
    const o = Array.prototype.find.call(x.options, (op) => !op.classList.contains("notselect") && (lcdNorm(op.value) === n || lcdNorm(op.text) === n));
    if (!o) return false;
    if (x.options[x.selectedIndex] !== o) { o.selected = true; posliChange(x); }
    return true;
  }

  let vlastne = false; // zmena od nás (predvyplnenie), nie od zákazníka
  /** Značka a model auta stránky; keď bolo uložené iné auto, rok ide na „Rok výroby“ (rok iného auta k nemu nepatrí). */
  function predvypln() {
    if (jeAuto()) return true;
    vlastne = true;
    try {
      if (lcdNorm(lcdPlatnaHodnota(s[0])) !== lcdNorm(A.znacka) && !vyber(s[0], A.znacka)) return false;
      if (!vyber(s[1], A.model)) return false;
      const rok = s[2];
      const ph = rok && rok.querySelector("option.notselect");
      if (ph && rok.options[rok.selectedIndex] !== ph) { ph.selected = true; posliChange(rok); }
      return jeAuto();
    } finally {
      vlastne = false;
    }
  }

  // nápis pod výberom auta
  const box = document.createElement("div");
  box.className = "lcd1v-auto-pevne";
  const n = document.createElement("p");
  n.className = "lcd1v-auto-pevne__t";
  n.textContent = T.nadpis.replace("{0}", A.nazov || A.znacka + " " + A.model);
  const t = document.createElement("p");
  t.className = "lcd1v-auto-pevne__r";
  t.textContent = T.text;
  box.appendChild(n);
  box.appendChild(t);
  const ms = krok.querySelector(":scope > #model-selector");
  if (ms) krok.insertBefore(box, ms.nextSibling);
  else krok.appendChild(box);

  let odisiel = false;
  /** Iné auto -> hlavný konfigurátor typu stránky (jedno / dvoj), vždy Diamond Line (Michal 9. 11. 2026), s prenosom výberu. */
  function chodNaHlavny() {
    if (odisiel) return;
    const hl = najdiProdukt(ctx.projectId, TYP, CIEL_VZOR);
    if (!hl || hl.id === Number(ctx.productId)) return;
    odisiel = true;
    zapisPrenos(ctx, hl.id);
    window.location.assign(hl.url);
  }

  // Dlaždice vzorov (Michal 9. 11. 2026): iný vzor = hlavný konfigurátor toho vzoru a typu stránky (živý odkaz dlaždice)
  // aj s autom a výberom (prenos; farba sa v cieli páruje podľa názvu, iný vzor má iné ID farby).
  const kVzor = ctx.krok("vzor");
  const naVzor = function (e) {
    const a = e.target && e.target.closest && e.target.closest(".patterns-wrap > .option-button");
    if (!a || a.classList.contains("active") || odisiel) return;
    const m = /lcd1v-vzor-(diamond|stripe|hexa)/.exec(a.className);
    const ciel = m ? najdiProdukt(ctx.projectId, TYP, m[1]) : null;
    if (ciel && ciel.id !== Number(ctx.productId)) zapisPrenos(ctx, ciel.id);
  };
  if (kVzor) kVzor.addEventListener("click", naVzor, true);

  // Krok „Vzor prešívania“ otvorený pri načítaní (Michal 9. 11. 2026: „zákazník nevidí možnosť výberu prešitia“). Živý
  // engine po načítaní otvorí prvý nevyplnený krok (auto) — keď sa to stane a zákazník ešte nič nerobil, otvorí sa vzor.
  // „Potvrďte vzor“ potom vedie na auto (predvyplnené).
  let siahol = false;
  const naDotyk = function (e) { if (e.isTrusted) siahol = true; };
  const DOTYK = ["mousedown", "touchstart", "keydown"];
  DOTYK.forEach((x) => window.addEventListener(x, naDotyk, { capture: true, passive: true }));
  const elVzor = kVzor && kVzor.closest(".lcd1v-krok");
  ctx.ked(function () {
    return elVzor && typeof window.__lcdSetStepOpen === "function" && krok.classList.contains("active") ? true : null;
  }, function () {
    setTimeout(function () {
      if (siahol || odisiel || !elVzor.isConnected || elVzor.classList.contains("active")) return;
      window.__lcdSetStepOpen(krok, false);
      window.__lcdSetStepOpen(elVzor, true);
    }, OTVOR_VZOR_MS);
  }, { limit: 15000 });

  const klavesy = new Map();
  let caka = false; // zmena z klávesnice čaká na odchod z polí auta
  function naKlaves(e) { klavesy.set(e.currentTarget, Date.now()); }
  function naZmenu(e) {
    if (vlastne || odisiel) return;
    if (jeAuto()) { caka = false; return; }
    const tg = e && e.target;
    if (tg && Date.now() - (klavesy.get(tg) || 0) <= KLAVESNICA_MS) { caka = true; return; }
    chodNaHlavny();
  }
  function naOdchod(e) {
    if (!caka) return;
    const kam = e.relatedTarget;
    if (kam && s.indexOf(kam) > -1) return;
    setTimeout(function () {
      if (!caka || jeAuto()) { caka = false; return; }
      const f = document.activeElement;
      if (f && s.indexOf(f) > -1) return;
      chodNaHlavny();
    }, 300); // klik myšou na „Pokračujte“ po zmene z klávesnice dobehne (ako vclass-presmerovanie.js)
  }
  s.forEach((x) => { x.addEventListener("keydown", naKlaves); x.addEventListener("focusout", naOdchod); });
  if ($) $(s.slice(0, 2)).on("change.lcdAutoProdukt", naZmenu);
  else s.slice(0, 2).forEach((x) => x.addEventListener("change", naZmenu));

  // Späť z bfcache: auto mohlo byť medzitým iné (main.js pageshow zosúladí selecty) -> znova predvyplniť
  const naPageshow = function (e) { if (e.persisted) setTimeout(function () { odisiel = false; caka = false; predvypln(); }, 0); };
  window.addEventListener("pageshow", naPageshow);

  predvypln();

  zrus = function () {
    if (box.parentNode) box.parentNode.removeChild(box);
    s.forEach((x) => { x.removeEventListener("keydown", naKlaves); x.removeEventListener("focusout", naOdchod); });
    if ($) $(s.slice(0, 2)).off("change.lcdAutoProdukt");
    else s.slice(0, 2).forEach((x) => x.removeEventListener("change", naZmenu));
    window.removeEventListener("pageshow", naPageshow);
    if (kVzor) kVzor.removeEventListener("click", naVzor, true);
    DOTYK.forEach((x) => window.removeEventListener(x, naDotyk, { capture: true }));
  };
}

/** Návrat na starý vzhľad (index.js zlozit). */
export function zlozit() {
  if (zrus) zrus();
  zrus = null;
}
