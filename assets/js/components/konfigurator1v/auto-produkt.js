// Stránka auta (Michal 9. 11. 2026, kniha Brain napady/2026-11-06-kniha-stranky-podla-auta.md): produkt pre jedno auto,
// napr. SK 649 „Autokoberce Škoda Kodiaq II“ = kópia jednovrstvového produktu toho istého vzoru (613 Stripe) s pevným autom.
// Register produkty.js: auto = { znacka, model, nazov } — znacka a model presne ako v katalógu áut (data.json `cars`).
// Na stránky áut sa zákazník dostane len z Googlu alebo z pätičky (značky); hlavný konfigurátor na ne nikdy nepresmeruje
// (produkty.js najdiProdukt ich preskakuje).
//
//  - pri načítaní: značka a model predvyplnené (change ako pri výbere zákazníkom -> main.js saveModel uloží auto; rok iného
//    uloženého auta sa vynuluje), rok
//    a typ karosérie vyberie zákazník; pod výberom auta nápis „Predvyplnené pre Škoda Kodiaq II…“.
//  - zákazník zmení značku alebo model: výber (farba, rozloženie, kufor, boxy, volant, miesta, dvere) sa prenesie
//    (prenos.js zapisPrenos) a prejde na hlavný jednovrstvový produkt toho istého vzoru (napr. 613) aj s novým autom
//    (auto nesie sessionStorage z main.js). Typ karosérie ani rok nič nepresúvajú (Michal: „sedan na kupé ešte nie“).
//    Myšou alebo prstom hneď; z klávesnice (šípka v zatvorenom selecte na Windows mení hodnotu) až keď zákazník z polí
//    auta odíde, aby pri prechádzaní značiek šípkami neodišiel na prvej inej.
//  - druhá vrstva a iný vzor: ako na hlavnom produkte (druha-vrstva.js -> dvojvrstvový toho istého vzoru s prenosom,
//    karta vzoru -> hlavný produkt iného vzoru).
import { lcdPlatnaHodnota, lcdNorm } from "../../functions/autoVyber.js";
import { najdiProdukt } from "./produkty.js";
import { zapisPrenos } from "./prenos.js";

export const MENO = "auto-produkt";
/** Change do tohto času po klávese na tom istom poli = zmena z klávesnice (ms), ako vclass-presmerovanie.js. */
export const KLAVESNICA_MS = 600;

export const TEXTY_SK = {
  nadpis: "Predvyplnené pre {0}",
  text: "Máte iné auto? Zmeňte značku alebo model a prenesieme Vás do konfigurátora pre všetky autá aj s tým, čo ste už vybrali.",
};
export const TEXTY_CZ = {
  nadpis: "Předvyplněno pro {0}",
  text: "Máte jiné auto? Změňte značku nebo model a přeneseme Vás do konfigurátoru pro všechna auta i s tím, co jste už vybrali.",
};

let zrus = null;

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const A = ctx.produkt && ctx.produkt.auto;
  if (!A || !A.znacka || !A.model) return;
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
  function chodNaHlavny() {
    if (odisiel) return;
    const hl = najdiProdukt(ctx.projectId, "jedno", ctx.produkt.vzor);
    if (!hl || hl.id === Number(ctx.productId)) return;
    odisiel = true;
    zapisPrenos(ctx, hl.id);
    window.location.assign(hl.url);
  }

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
  };
}

/** Návrat na starý vzhľad (index.js zlozit). */
export function zlozit() {
  if (zrus) zrus();
  zrus = null;
}
