/**
 * kosikPripravene.js — košík: „Pripravené pre: <auto> ✓“ a hodnotenie z Google pri „Pokračovať“ (Michal 29. 10. 2026,
 * inšpirácia konkurencia: Luxus Car Mats, Diamond Car Mats „Guaranteed to fit“, Evamats/AutoWin hodnotenie pri tlačidle).
 *
 *  - riadok pri položke a krátko v súhrne nad „Celkom za tovar“ (cart.js; auto riadku = functions/autoPamat.js autoRiadku,
 *    to isté auto ide do poznámky objednávky; kamión z truckVehicle). Bez auta sa riadok nevloží.
 *  - hodnotenie: LEN skutočné čísla z window.LCD_REVIEWS.place (assets/js/reviews-data.js, ten istý súbor ako widget
 *    recenzií na produktoch; prepisuje ho tools/scrape-google-reviews.mjs). Na košíku sa súbor sťahuje až PO načítaní
 *    stránky (load + nečinnosť) z tej istej adresy ako na produkte -> zákazník z produktu ho má vo vyrovnávacej pamäti.
 *    Kým dáta nie sú, miesto je rezervované (visibility:hidden), keď neprídu do 15 s, riadok sa skryje. Nie je odkaz —
 *    nič nevedie preč z košíka.
 */
import { LCD_ZAKLAD } from "./lcdZaklad.js";

/** Verzia reviews-data.js + lcd-reviews.js (cache 1 rok) — main.js googleReviews; pri zmene ktoréhokoľvek zvýš. */
export const RECENZIE_WV = "10";
export const ZDROJ_RECENZII = LCD_ZAKLAD + "js/reviews-data.js?v=" + RECENZIE_WV;

const TEXTY = {
  sk: { pre: "Pripravené pre:", hodnotenie: "Hodnotenie", z5: "z 5", recenzie: ["recenzia", "recenzie", "recenzií"], naGoogle: "na Google" },
  cz: { pre: "Připraveno pro:", hodnotenie: "Hodnocení", z5: "z 5", recenzie: ["recenze", "recenze", "recenzí"], naGoogle: "na Google" },
};

/** cz podľa jazyka stránky (html lang „cs“) alebo domény .cz, inak sk */
export function trh(doc) {
  const d = doc || document;
  try { if (/^cs/i.test(d.documentElement.lang || "") || /\.cz$/i.test(d.location ? d.location.hostname : location.hostname)) return "cz"; } catch (e) {}
  return "sk";
}

function tvar(n, slova) { return n === 1 ? slova[0] : n >= 2 && n <= 4 ? slova[1] : slova[2]; }

/** place z LCD_REVIEWS -> { cislo: "5,0", hviezdy: 5, text: "89 recenzií na Google", aria } | null (bez dát / nuly) */
export function hodnotenie(place, t) {
  const r = Number(place && place.rating), n = Math.round(Number(place && place.totalReviews));
  if (!(r > 0 && r <= 5) || !(n > 0)) return null;
  const T = TEXTY[t] || TEXTY.sk;
  const cislo = (Math.round(r * 10) / 10).toFixed(1).replace(".", ",");
  const text = n + " " + tvar(n, T.recenzie) + " " + T.naGoogle;
  return { cislo: cislo, hviezdy: Math.max(0, Math.min(5, Math.round(r))), text: text, aria: T.hodnotenie + " " + cislo + " " + T.z5 + " – " + text };
}

/** <p class="lcd-pre"><span class="lcd-pre__n">Pripravené pre:</span> <b class="lcd-pre__a">…</b> <span class="lcd-pre__ok">✓</span></p> */
export function riadokPre(doc, auto, t, trieda, tag) {
  const p = doc.createElement(tag || "p");
  p.className = "lcd-pre" + (trieda ? " " + trieda : "");
  const n = doc.createElement("span");
  n.className = "lcd-pre__n";
  n.textContent = (TEXTY[t] || TEXTY.sk).pre;
  const a = doc.createElement("b");
  a.className = "lcd-pre__a";
  a.textContent = auto;
  const ok = doc.createElement("span");
  ok.className = "lcd-pre__ok";
  ok.setAttribute("aria-hidden", "true");
  ok.textContent = "✓";
  p.append(n, " ", a, " ", ok); // fajka sa nezalomí sama na nový riadok
  return p;
}

function vyplnHodnotenie(el, data, t) {
  const h = hodnotenie(data && data.place, t);
  if (!h) return false;
  el.textContent = "";
  const b = el.ownerDocument.createElement("b");
  b.textContent = h.cislo;
  const st = el.ownerDocument.createElement("span");
  st.className = "lcd-hodn-kosik__st";
  st.textContent = "★★★★★".slice(0, h.hviezdy) + "☆☆☆☆☆".slice(0, 5 - h.hviezdy);
  const i = el.ownerDocument.createElement("span");
  i.className = "lcd-hodn-kosik__t";
  i.textContent = "· " + h.text;
  el.append(b, " ", st, " ", i);
  el.setAttribute("aria-label", h.aria);
  el.removeAttribute("data-lcd-caka");
  el.hidden = false;
  return true;
}

let sluby = null;
/** window.LCD_REVIEWS (už je / skript na stránke / stiahnuť reviews-data.js) -> Promise<data|null>, najviac limit ms */
export function nacitajRecenzie(limit) {
  if (window.LCD_REVIEWS) return Promise.resolve(window.LCD_REVIEWS);
  if (sluby) return sluby;
  sluby = new Promise(function (hotovo) {
    let koniec = false;
    const vrat = function () { if (koniec) return; koniec = true; hotovo(window.LCD_REVIEWS || null); };
    setTimeout(vrat, limit || 15000);
    // widget recenzií (main.js googleReviews) ho už mohol vložiť -> počkať na jeho skript
    const s0 = Array.prototype.find.call(document.querySelectorAll("script[src]"), function (s) { return /\/reviews-data\.js(?:[?#]|$)/.test(s.src); });
    const s = s0 || document.createElement("script");
    s.addEventListener("load", vrat);
    s.addEventListener("error", vrat);
    if (!s0) { s.src = ZDROJ_RECENZII; s.async = true; document.body.appendChild(s); }
  });
  return sluby;
}

/** Až po načítaní stránky a v nečinnosti — sťahovanie nesmie súperiť s obsahom košíka (LCP). */
function poNacitani(fn) {
  const neskor = function () { if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 }); else setTimeout(fn, 200); };
  if (document.readyState === "complete") neskor();
  else window.addEventListener("load", neskor, { once: true });
}

/** Jeden stĺpec (telefón, tablet do 991 px): súhrn je pod položkami a ponuka k setu sa vkladá nad neho. */
function jedenStlpec() {
  try { return !!(window.matchMedia && window.matchMedia("(max-width: 991px)").matches); } catch (e) { return false; }
}

/**
 * Súhrn košíka: „Pripravené pre: …“ nad cenou (auta = texty áut riadkov v poradí) a hodnotenie pri „Pokračovať“.
 * Hodnotenie ide do .next-step medzi „Späť do obchodu“ a „Pokračovať“ (PC aj telefón column-reverse -> pod „Pokračovať“).
 * Telefón: kým beží ponuka k setu (html[data-lcd-doplnok-caka], lcdKosikDoplnok.js), súhrn sa nemení — ponuka ho odsunie
 * nadol a vyšší súhrn by zväčšil posun (CLS prvej návštevy 0,138 -> 0,212, meranie 29. 10. 2026). Doplní sa v tej istej
 * úlohe, v ktorej ponuka skončí (MutationObserver na data-lcd-doplnok = pred vykreslením), najneskôr po 8 s.
 */
export function vlozDoSuhrnu(auta) {
  const H = document.documentElement;
  if (!H.hasAttribute("data-lcd-doplnok-caka") || H.hasAttribute("data-lcd-doplnok") || !jedenStlpec() || !window.MutationObserver) {
    vlozDoSuhrnuTeraz(auta);
    return;
  }
  let hotovo = false, casovac = 0;
  const mo = new MutationObserver(function () { if (H.hasAttribute("data-lcd-doplnok")) dokonci(); });
  function dokonci() {
    if (hotovo) return;
    hotovo = true;
    mo.disconnect();
    clearTimeout(casovac);
    vlozDoSuhrnuTeraz(auta);
  }
  mo.observe(H, { attributes: true, attributeFilter: ["data-lcd-doplnok"] });
  casovac = setTimeout(dokonci, 8000);
}

function vlozDoSuhrnuTeraz(auta) {
  const box = document.querySelector("#cart-wrapper .cart-content.summary-wrapper .box") || document.querySelector(".cart-content.summary-wrapper .box");
  if (!box) return;
  const t = trh(document);
  const unik = [];
  (auta || []).forEach(function (a) { if (a && unik.indexOf(a) < 0) unik.push(a); });
  if (unik.length && !box.querySelector(".lcd-pre")) box.insertBefore(riadokPre(document, unik.join(", "), t, "lcd-pre--suhrn"), box.firstChild);
  const pokr = document.getElementById("continue-order-button");
  if (!pokr || !pokr.parentNode || document.querySelector(".lcd-hodn-kosik")) return;
  const el = document.createElement("p");
  el.className = "lcd-hodn-kosik";
  el.setAttribute("data-lcd-caka", "");
  el.setAttribute("role", "img"); // jeden celok pre čítačku (aria-label), nie hviezdy po jednej
  el.textContent = "★★★★★ · " + TEXTY[t].recenzie[2] + " " + TEXTY[t].naGoogle; // zástupný text rovnakej výšky (skrytý, bez čísel)
  pokr.parentNode.insertBefore(el, pokr);
  if (vyplnHodnotenie(el, window.LCD_REVIEWS, t)) return;
  poNacitani(function () {
    nacitajRecenzie(15000).then(function (d) { if (!vyplnHodnotenie(el, d, t)) el.hidden = true; });
  });
}
