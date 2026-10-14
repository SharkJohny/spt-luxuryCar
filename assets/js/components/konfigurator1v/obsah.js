// Nový vzhľad 1V — OBSAH POD KONFIGURÁTOROM pre všetky SK produkty z registra (návrhy jednovrstvove, dvojvrstvove,
// kufor-classic, kufor-premium, boxy). JADRO (T0.3, 14. 10. 2026) — mení len vydanie. Pravidlá: docs/1v-obsah.md.
//
// Obsah je STATICKÉ HTML (admin-html/src/p1v-<kľúč>/ -> dist/p1v-<kľúč>-1|2.sk.html), JS ho len umiestni a oživí.
// Kľúč obsahu = ctx.produkt.obsah z registra (produkty.js): "598" pre 598/610/613 (jeden obsah pre jednovrstvové),
// "dvoj" 601/604/607, "classic" 619/622/625, "premium" 628/631/634, "boxy" 616, "vzorky" 637. Čísla a odkazy, ktoré
// závisia od vzoru alebo ceny, dosadí obsah-cisla.js (data-p1v-cislo / data-p1v-odkaz) zo živých dát.
//
// Odkiaľ sa obsah vezme (beží len pod bránou index.js: flag ?novy=1 + zapnutý typ, alebo ?novy=vyvoj):
//   a) korene [data-lcd-cast^="p1v-<kľúč>-"] už sú v DOM (po spustení pre všetkých: Popis produktu; starší test: banner
//      v pätičke) -> použijú sa tie (synchrónne, ako doteraz);
//   b) inak, keď OBSAH_CDN (rozhodnutia D1 = b, skúšobná fáza): kusy sa stiahnu z CDN z TEJ ISTEJ verzie ako bundle —
//      …/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html (sha z adresy luxuryCar.js; .github/workflows/production.yml ich tam
//      kopíruje z admin-html/dist). Bez flagu sa nič nesťahuje (obsah.js vôbec nebeží) a HTML stránky sa nemení.
// Kus bez sekcií (len stuby) = nič: starý popis ostáva, nič sa neskrýva.
// Pod body.lcd-1v potom:
//   1. korene sa presunú do .p1v-miesto hneď pred záložky Popis/Diskusia (.p-detail > .shp-tabs-wrapper) = priamo pod
//      konfigurátor, v poradí kus 1, kus 2; prázdny stĺpec pätičky (starý test) dostane data-p1v-prazdny;
//   2. body dostane .lcd-1v-obsah -> CSS (LCD-1V-OBSAH) ukáže korene a skryje starý popis (záložky);
//   3. obsah-cisla.js dosadí čísla a odkazy (synchrónne skryje nedosadené, kým sa nezistia — Diamond na Hexa nikdy);
//   4. moduly skupín A–D (obsah-a.js … obsah-d.js) a modul typu (obsah-dvoj/-classic/-premium/-boxy.js) dostanú `oc`;
//   5. reveal .rv pre všetky sekcie naraz; až potom obal sekcie dostane .p1v-rv.
// Chyba: cesta a) -> ctx.chyby (index.js zloží celý nový vzhľad, ako doteraz); cesta b) beží až po stiahnutí, keď je
// konfigurátor už postavený -> chyba ide do ctx.chyby a vráti sa LEN obsah (miesto preč, starý popis späť).
// Žiadny živý DOM sa nemaže (záložky ostávajú v DOM, len skryté; JS na ne kotví — main.js, popisModuly.js).
// Stav pre test a ladenie: window.__lcd1v.obsah = { kluc, zdroj: "dom"|"cdn"|null, stav, kusy, cisla (Promise) }.
import { lcdMultiKoren, lcdRevealOznacVidene } from "../../functions/lcdOziv.js";
import { OBRAZKY_1V } from "./ctx.js";
import * as cisla from "./obsah-cisla.js";
import * as skupinaA from "./obsah-a.js";
import * as skupinaB from "./obsah-b.js";
import * as skupinaC from "./obsah-c.js";
import * as skupinaD from "./obsah-d.js";
import * as typDvoj from "./obsah-dvoj.js";
import * as typClassic from "./obsah-classic.js";
import * as typPremium from "./obsah-premium.js";
import * as typBoxy from "./obsah-boxy.js";

export const MENO = "obsah";
/** Obrázky obsahu: repo assets/img/1v/obsah/<meno> = CDN …/eshopy/luxuryCar/assets/img/1v/obsah/<meno> */
export const OBRAZKY_OBSAH = OBRAZKY_1V + "obsah/";
export const TRIEDA_OBSAH = "lcd-1v-obsah";
/**
 * D1 = b: kusy z CDN verzie bundle (len pod bránou). false = len korene, ktoré už sú v DOM (Popis po spustení).
 * Zapnuté pri integrácii vlny WA (14. 10. 2026, prvé vydanie podľa plan.md §2.6 bod 2): runnery, ktoré na živej
 * stránke vymieňajú luxuryCar.js (tools/test-konfigurator-1v.mjs, tools/test-boxy-prepni.mjs), kusy
 * …/v/<sha>/html/p1v-*.sk.html pri lokálnom builde obslúžia samy (prázdny koreň = obsah „nic“, konfigurátor sa testuje
 * bez obsahu); test obsahu (tools/test-1v/obsah-spolocne.mjs) ich obsluhuje z lokálneho admin-html/dist.
 * Prepnutie späť bez úpravy kódu: esbuild --define:LCD_OBSAH_CDN=false.
 */
/* global LCD_OBSAH_CDN */
export const OBSAH_CDN = typeof LCD_OBSAH_CDN === "boolean" ? LCD_OBSAH_CDN : true;
/** Počet kusov každého kľúča: -1 = sekcie 10–29, -2 = 30–49 (admin-html/ciele.json; build to kontroluje). */
export const KUSY = 2;
/** Modul typu podľa kľúča obsahu (beží po A–D); "598" a "vzorky" vlastný modul nemajú. */
const MODUL_TYPU = { dvoj: typDvoj, classic: typClassic, premium: typPremium, boxy: typBoxy };
/** bundle verzie: …/assets/v/<sha>/js/luxuryCar.js -> …/assets/v/<sha>/ (len https; nevyverzovaný bundle = null) */
const RE_BUNDLE = /^(https:\/\/[^?#]+\/assets\/v\/[A-Za-z0-9._-]+\/)js\/luxuryCar\.js(?:[?#]|$)/;

/** Kľúč obsahu produktu (register produkty.js -> obsah), inak productId. */
export function klucObsahu(ctx) {
  return String((ctx && ctx.produkt && ctx.produkt.obsah) || (ctx && ctx.productId) || "");
}

/** Statické korene obsahu kľúča v poradí kusov (p1v-<kľúč>-1, p1v-<kľúč>-2, …) v rodičovi (predvolene dokument). */
export function koreneObsahu(kluc, rodic) {
  const pred = "p1v-" + kluc + "-";
  return Array.prototype.filter
    .call((rodic || document).querySelectorAll("[data-lcd-cast]"), (el) => /^\d+$/.test((el.getAttribute("data-lcd-cast") || "").slice(pred.length)) && (el.getAttribute("data-lcd-cast") || "").indexOf(pred) === 0)
    .sort((a, b) => Number(a.getAttribute("data-lcd-cast").slice(pred.length)) - Number(b.getAttribute("data-lcd-cast").slice(pred.length)));
}

/** Adresa priečinka html/ verzie, z ktorej beží bundle (…/assets/v/<sha>/html/), alebo null. */
export function zakladHtml() {
  const s = Array.prototype.map.call(document.scripts || [], (x) => x.src || "").find((src) => RE_BUNDLE.test(src));
  return s ? RE_BUNDLE.exec(s)[1] + "html/" : null;
}

/** Adresy kusov kľúča na CDN (SK; CZ obsah 1V nemá) alebo [] keď bundle nie je z verzie v/<sha>/. */
export function adresyKusov(kluc) {
  const z = zakladHtml();
  if (!z || !kluc) return [];
  const out = [];
  for (let n = 1; n <= KUSY; n++) out.push(z + "p1v-" + kluc + "-" + n + ".sk.html");
  return out;
}

/** HTML kusu -> koreň (inertný <template>: nič sa nesťahuje ani nespúšťa, kým sa koreň nevloží) alebo null. */
function korenZHtml(html, cast) {
  const t = document.createElement("template");
  t.innerHTML = html;
  return t.content.querySelector('[data-lcd-cast="' + cast + '"]');
}

/** Stiahne kusy kľúča z CDN -> Promise([korene v poradí]); chyba siete / 404 = ten kus chýba. */
function stiahniKusy(kluc) {
  const adresy = adresyKusov(kluc);
  return Promise.all(adresy.map((u, i) =>
    fetch(u, { credentials: "omit" })
      .then((r) => (r.ok ? r.text() : null))
      .then((html) => (html ? korenZHtml(html, "p1v-" + kluc + "-" + (i + 1)) : null))
      .catch(() => null)
  )).then((k) => k.filter(Boolean));
}

const maSekcie = (korene) => korene.some((k) => !!k.querySelector("[data-lcd-sekcia]"));

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

/** Miesto na celú šírku stránky: šírka a posun podľa .overall-wrapper (aj po zmene veľkosti okna). */
function roztahovanie(miesto) {
  // Shoptet ho nemusí mať presne cez okno (posuvník, bočné odsadenie). CSS: --p1v-sirka, --p1v-vlavo (LCD-1V-OBSAH bod 4).
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
}

/**
 * Umiestni korene pod konfigurátor a oživí ich (body 1–5 hlavičky). Vráti zoznam chýb (prázdny = OK).
 * Moduly sa volajú v poradí: čísla -> A–D -> modul typu -> reveal; chyba jedného nezastaví ostatné.
 */
function umiestni(ctx, kluc, korene, stav) {
  const chyby = [];
  const miesto = miestoObsahu();
  korene.forEach((k) => {
    const stlpec = k.closest && k.closest(".custom-footer > div");
    if (k.parentNode !== miesto) miesto.appendChild(k);
    if (stlpec && !stlpec.querySelector("[data-lcd-cast]")) stlpec.setAttribute("data-p1v-prazdny", "");
  });
  roztahovanie(miesto);
  document.body.classList.add(TRIEDA_OBSAH);

  const oc = {
    ctx,
    kluc,
    korene,
    koren: lcdMultiKoren(korene), // querySelector(All) cez všetky kusy (lxModulyOziv ho prijme ako root)
    miesto,
    /** obal sekcie podľa data-lcd-sekcia (napr. "a-referencie") alebo null (stub nie je v HTML) */
    sekcia: (meno) => miesto.querySelector('[data-lcd-sekcia="' + meno + '"]'),
    obrazok: (meno) => OBRAZKY_OBSAH + meno,
    priZobrazeni,
    nacitajMedia,
    ked: ctx.ked,
    na: ctx.na,
    vysli: ctx.vysli,
  };
  const spusti = (m) => {
    try {
      const v = m.init(oc);
      if (m === cisla) stav.cisla = v;
    } catch (e) {
      chyby.push(m.MENO + ": " + ((e && e.message) || e));
      console.error("[lcd-1v] " + m.MENO, e);
    }
  };
  [cisla, skupinaA, skupinaB, skupinaC, skupinaD, MODUL_TYPU[kluc]].filter(Boolean).forEach(spusti);
  try {
    odhal(miesto);
  } catch (e) {
    chyby.push(MENO + " reveal: " + ((e && e.message) || e));
    console.error("[lcd-1v] " + MENO, e);
  }
  return chyby;
}

/** Obsah sa nepodaril (cesta b): naše miesto preč, starý popis späť; konfigurátor ostáva. */
function vratObsah() {
  document.body.classList.remove(TRIEDA_OBSAH);
  // naše prvky: miesto s koreňmi + okno a linka čítania, ktoré skupina D presunula priamo do <body>
  Array.prototype.forEach.call(document.querySelectorAll(".p1v-miesto, body > .p1v-lb, body > .p1v-citanie"), (m) => {
    if (m.parentNode) m.parentNode.removeChild(m);
  });
}

/** Volá index.js (posledný modul, po konfigurátore). */
export function init(ctx) {
  const kluc = klucObsahu(ctx);
  const stav = { kluc, zdroj: null, stav: "nic", kusy: 0, cisla: null };
  ctx.obsah = stav; // test a ladenie (window.__lcd1v.obsah)
  if (!kluc) return;
  const vDom = koreneObsahu(kluc);
  if (vDom.length) {
    // a) korene už sú v DOM (Popis produktu / pätička): synchrónne; chyba -> index.js zloží nový vzhľad
    stav.zdroj = "dom";
    stav.kusy = vDom.length;
    if (!maSekcie(vDom)) return;
    const chyby = umiestni(ctx, kluc, vDom, stav);
    chyby.forEach((x) => ctx.chyby.push(x));
    stav.stav = chyby.length ? "chyba" : "hotovo";
    return;
  }
  // b) CDN verzie bundle (len SK; bez verzie v/<sha>/ nie je odkiaľ)
  if (!OBSAH_CDN || ctx.trh !== "sk" || !adresyKusov(kluc).length) return;
  stav.zdroj = "cdn";
  stav.stav = "caka";
  stav.hotovo = stiahniKusy(kluc).then((korene) => {
    stav.kusy = korene.length;
    if (!korene.length || !maSekcie(korene) || !document.body.classList.contains("lcd-1v")) { stav.stav = "nic"; return; }
    const chyby = umiestni(ctx, kluc, korene, stav);
    if (chyby.length) {
      chyby.forEach((x) => ctx.chyby.push(x));
      vratObsah();
      stav.stav = "chyba";
      return;
    }
    stav.stav = "hotovo";
  }).catch((e) => {
    ctx.chyby.push(MENO + ": " + ((e && e.message) || e));
    try { vratObsah(); } catch (x) { /* nič */ }
    stav.stav = "chyba";
  });
}
