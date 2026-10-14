// Nový vzhľad 1V — OBSAH POD KONFIGURÁTOROM (návrh v26: ponuka dvojvrstvových … Kúpiť a nečakať). ZÁKLAD, spoločný súbor:
// po základe (13. 10. 2026) ho menia len koordinátor. Pravidlá a vlastníctvo: docs/1v-obsah.md.
//
// Obsah je STATICKÉ HTML zo Shoptet adminu (admin-html/src/p1v-598/ -> dist/p1v-598-1|2.sk.html), JS ho len umiestni
// a oživí. Korene [data-lcd-cast^="p1v-<produkt>-"] majú v HTML style="display:none" + data-lcd-brana="1v": bez flagu
// ?novy=1 sú neviditeľné a nič nesťahujú (obrázky lazy, videá data-src). Pod body.lcd-1v:
//   1. korene (v teste v pätičke ako bannery, po spustení v Popise produktu) sa presunú do .p1v-miesto hneď pred
//      záložky Popis/Diskusia (.p-detail > .shp-tabs-wrapper) = priamo pod konfigurátor, v poradí kus 1, kus 2;
//   2. prázdny stĺpec pätičky dostane data-p1v-prazdny (CSS ho skryje);
//   3. body dostane .lcd-1v-obsah -> CSS (LCD-1V-OBSAH) ukáže korene a skryje starý popis (záložky);
//   4. moduly skupín A–D (obsah-a.js … obsah-d.js) dostanú spoločný kontext `oc`;
//   5. reveal .rv pre všetky sekcie naraz (ako titulka: čo je vo výreze alebo nad ním hneď, zvyšok pri zobrazení);
//      až potom obal sekcie dostane .p1v-rv (CSS LCD-1V-OBSAH bod 6c: bez nej je .rv viditeľné).
// Žiadny živý DOM sa nemaže (záložky ostávajú v DOM, len skryté; JS na ne kotví — main.js, popisModuly.js).
// Keď korene na stránke nie sú (admin ešte nezapísaný), nerobí nič: starý popis ostáva viditeľný.
import { lcdMultiKoren, lcdRevealOznacVidene } from "../../functions/lcdOziv.js";
import { OBRAZKY_1V } from "./ctx.js";
import * as skupinaA from "./obsah-a.js";
import * as skupinaB from "./obsah-b.js";
import * as skupinaC from "./obsah-c.js";
import * as skupinaD from "./obsah-d.js";

export const MENO = "obsah";
/** Obrázky obsahu: repo assets/img/1v/obsah/<meno> = CDN …/eshopy/luxuryCar/assets/img/1v/obsah/<meno> */
export const OBRAZKY_OBSAH = OBRAZKY_1V + "obsah/";
export const TRIEDA_OBSAH = "lcd-1v-obsah";

/** Statické korene obsahu daného produktu v poradí kusov (p1v-598-1, p1v-598-2, …). */
export function koreneObsahu(productId) {
  const pred = "p1v-" + productId + "-";
  return Array.prototype.filter
    .call(document.querySelectorAll("[data-lcd-cast]"), (el) => (el.getAttribute("data-lcd-cast") || "").indexOf(pred) === 0)
    .sort((a, b) => Number(a.getAttribute("data-lcd-cast").slice(pred.length)) - Number(b.getAttribute("data-lcd-cast").slice(pred.length)));
}

/** Miesto pod konfigurátorom: pred záložkami produktu; vytvorí sa raz. */
function miestoObsahu() {
  let m = document.querySelector(".p1v-miesto");
  if (m) return m;
  m = document.createElement("div");
  m.className = "p1v-miesto";
  const zalozky = document.querySelector(".p-detail > .shp-tabs-wrapper") || document.querySelector(".shp-tabs-wrapper");
  const detail = document.querySelector(".p-detail");
  if (zalozky && zalozky.parentNode) zalozky.parentNode.insertBefore(m, zalozky);
  else if (detail) detail.appendChild(m);
  else (document.querySelector("#content") || document.body).appendChild(m);
  return m;
}

/** Spustí fn(el) raz, keď sa el priblíži k výrezu (okraj ako rootMargin). Bez IntersectionObserver hneď. */
function priZobrazeni(el, fn, { okraj = "300px 0px" } = {}) {
  if (!el) return;
  if (typeof IntersectionObserver !== "function") { fn(el); return; }
  const io = new IntersectionObserver((zaznamy) => {
    zaznamy.forEach((z) => {
      if (!z.isIntersecting) return;
      io.unobserve(z.target);
      fn(z.target);
    });
  }, { rootMargin: okraj });
  io.observe(el);
}

/** Odložené médiá: data-src -> src, data-srcset -> srcset, data-poster -> poster (el aj potomkovia). Video po zmene zdroja load(). */
function nacitajMedia(el) {
  if (!el) return;
  const prvky = [el].concat(Array.prototype.slice.call(el.querySelectorAll("[data-src], [data-srcset], [data-poster]")));
  const videa = new Set();
  prvky.forEach((x) => {
    if (!x.getAttribute) return;
    const p = x.getAttribute("data-poster");
    if (p && !x.getAttribute("poster")) x.setAttribute("poster", p);
    const ss = x.getAttribute("data-srcset");
    if (ss && !x.getAttribute("srcset")) x.setAttribute("srcset", ss);
    const s = x.getAttribute("data-src");
    if (s && !x.getAttribute("src")) {
      x.setAttribute("src", s);
      const v = x.tagName === "VIDEO" ? x : x.tagName === "SOURCE" && x.parentNode && x.parentNode.tagName === "VIDEO" ? x.parentNode : null;
      if (v) videa.add(v);
    }
  });
  videa.forEach((v) => { try { v.load(); } catch (e) { /* video bez podpory */ } });
}

/** Reveal .rv všetkých sekcií (aj obal sekcie, ktorý je sám .rv); pri prefers-reduced-motion všetko hneď. */
function odhal(miesto) {
  const sekcie = Array.prototype.slice.call(miesto.querySelectorAll("[data-lcd-sekcia]"));
  const rv = [];
  sekcie.forEach((s) => {
    if (s.classList.contains("rv")) rv.push(s);
    Array.prototype.forEach.call(s.querySelectorAll(".rv"), (x) => rv.push(x));
  });
  const pokoj = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (pokoj || typeof IntersectionObserver !== "function") rv.forEach((x) => x.classList.add("on"));
  else lcdRevealOznacVidene(rv).forEach((x) => priZobrazeni(x, (el) => el.classList.add("on"), { okraj: "0px 0px -8% 0px" }));
  sekcie.forEach((s) => s.classList.add("p1v-rv"));
}

/** Volá index.js (posledný modul, po konfigurátore). Výnimka skupiny -> ctx.chyby -> index.js zloží lcd-1v (starý vzhľad). */
export function init(ctx) {
  const korene = koreneObsahu(ctx.productId);
  if (!korene.length) return;
  const miesto = miestoObsahu();
  korene.forEach((k) => {
    const stlpec = k.closest(".custom-footer > div");
    if (k.parentNode !== miesto) miesto.appendChild(k);
    if (stlpec && !stlpec.querySelector("[data-lcd-cast]")) stlpec.setAttribute("data-p1v-prazdny", "");
  });
  // miesto na celú šírku stránky: šírka a posun podľa .overall-wrapper (Shoptet ho nemusí mať presne cez okno —
  // posuvník, bočné odsadenie), aj po zmene veľkosti okna. CSS: --p1v-sirka, --p1v-vlavo (LCD-1V-OBSAH bod 4).
  const roztiahni = () => {
    const obal = document.querySelector(".overall-wrapper") || document.body;
    const rodic = miesto.parentElement;
    if (!obal || !rodic) return;
    const o = obal.getBoundingClientRect(), r = rodic.getBoundingClientRect(), cs = getComputedStyle(rodic);
    const lavo = r.left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0);
    // presne (nie zaokrúhlené): rodič má pri niektorých šírkach polovičné px (Math.round(-44.5) = -44 -> miesto o 1 px vpravo)
    miesto.style.setProperty("--p1v-sirka", +o.width.toFixed(2) + "px");
    miesto.style.setProperty("--p1v-vlavo", +(o.left - lavo).toFixed(2) + "px");
  };
  roztiahni();
  window.addEventListener("resize", roztiahni, { passive: true });
  document.body.classList.add(TRIEDA_OBSAH);

  const oc = {
    ctx,
    korene,
    koren: lcdMultiKoren(korene), // querySelector(All) cez všetky kusy (lxModulyOziv ho prijme ako root)
    miesto,
    /** obal sekcie podľa data-lcd-sekcia (napr. "a-referencie") alebo null (stub ešte nie je v admine) */
    sekcia: (meno) => miesto.querySelector('[data-lcd-sekcia="' + meno + '"]'),
    obrazok: (meno) => OBRAZKY_OBSAH + meno,
    priZobrazeni,
    nacitajMedia,
    ked: ctx.ked,
    na: ctx.na,
    vysli: ctx.vysli,
  };
  [skupinaA, skupinaB, skupinaC, skupinaD].forEach((m) => {
    try {
      m.init(oc);
    } catch (e) {
      ctx.chyby.push(m.MENO + ": " + ((e && e.message) || e));
      console.error("[lcd-1v] " + m.MENO, e);
    }
  });
  try {
    odhal(miesto);
  } catch (e) {
    ctx.chyby.push(MENO + " reveal: " + ((e && e.message) || e));
    console.error("[lcd-1v] " + MENO, e);
  }
}
