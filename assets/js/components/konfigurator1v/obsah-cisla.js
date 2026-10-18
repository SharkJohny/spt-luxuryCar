// Nový vzhľad 1V — ČÍSLA A ODKAZY v obsahu pod konfigurátorom (T0.3, 14. 10. 2026). JADRO — mení len vydanie.
// Pravidlá: plan.md §2.4, docs/1v-obsah.md („Čísla a odkazy“).
//
// Obsah je statický HTML, jeden pre celú skupinu (598/610/613, dvojvrstvové, Classic, Premium, box). Čo závisí od vzoru
// alebo ceny, je v značke a dosadí sa TU zo živých dát — v statickom HTML nikdy nie je cena (build to kontroluje):
//   <span data-p1v-cislo="cena-od" data-p1v-tvar="od {}"><!-- --></span>   -> „od 362 €“ (NBSP pred €)
//   <span data-p1v-cislo="pocet-farieb"><!-- --></span>                     -> „3 farby“
//   <a href="/luxusne-autokoberce-dragonskin-diamond-line/#x" data-p1v-odkaz="jedno">…</a> -> href toho istého vzoru (#x ostane)
// Kým hodnota nie je zistená, prvok je neviditeľný (visibility:hidden, nastaví sa synchrónne ešte pred prvým
// vykreslením obsahu) — hodnota Diamond sa na Hexa/Stripe nikdy neukáže. Nezistená hodnota: data-p1v-bez="…"
// (náhradný text), inak sa prvok skryje (display:none). Stav na prvku: data-p1v-stav = caka | ok | bez | skryte.
// Mení len textContent / href / štýl viditeľnosti vlastných prvkov obsahu. Nič neodosiela, ID ani ceny natvrdo nemá.
//
// Kľúče (rovnaký zoznam je v admin-html/ciele.json -> pravidla.obsah-1v.cisla, build ho kontroluje):
//   cena-od                  základná cena tohto produktu (ctx.cena().zaklad, inak cena stránky)
//   cena-od-<typ>            typ = jedno | dvoj | classic | premium | boxy: základná cena produktu typu v tom istom vzore
//                            (box = 616; stránka boxu bez vzoru = Diamond), ceny-ine.js (GET sesterskej stránky, 24 h cache)
//   cena-od-<typ>-<vzor>     to isté v ZADANOM vzore (diamond | stripe | hexa), napr. Classic FAQ 11 „Diamond Line je v základnej
//                            cene 230 €, Stripe Line stojí 240 € …“ (integrácia 14. 10. 2026; predtým obchádzka v obsah-classic.js)
//   set-classic | set-premium   príplatok „autokoberce do kufru“ (dno / dno + boky) na jednovrstvovom produkte toho vzoru
//   set-usetrite             na rohoži Classic/Premium: cena-od − set-classic | set-premium
//   set-usetrite-classic | set-usetrite-premium   kdekoľvek: cena-od-classic − set-classic (resp. premium)
//   box-sam-S…XL             box 616: základ + príplatok 1. boxu danej veľkosti
//   box2-sam-S…XL            box 616: príplatok 2. boxu danej veľkosti
//   box-set-S…XL             jednovrstvové toho vzoru: príplatok „Box solo“ (box v sete)
//   box-set2-S…XL            jednovrstvové toho vzoru: príplatok 1. boxu (dva boxy v sete)
//   pocet-farieb | pocet-farieb-2   počet farieb 1. / 2. vrstvy tohto produktu so skloňovaním (1 farba, 2–4 farby, 5+ farieb)
//   vzor                     vzor tohto produktu: „Diamond Line“ | „Stripe Line“ | „Hexa Line“ (box: nič)
// Odkazy data-p1v-odkaz = jedno | dvoj | classic | premium | boxy -> adresa z registra (produkty.js) v tom istom vzore.
import { velkost } from "../../lcdKosikDoplnok.js";
import { cenaProduktu, cenaTypu, priplatkyTypu, moznostiZMapy } from "./ceny-ine.js";
import { najdiProdukt } from "./produkty.js";
import { sumaText } from "./ctx.js";

export const MENO = "obsah-cisla";

/** Kľúč v data-p1v-odkaz / cena-od-<x> -> typ registra. */
export const TYPY_OBSAHU = { jedno: "jedno", dvoj: "dvoj", classic: "kufor-classic", premium: "kufor-premium", boxy: "boxy" };
/** Platné kľúče data-p1v-cislo (zhodne s ciele.json -> pravidla.obsah-1v.cisla). */
export const RE_KLUC = /^(cena-od(-(jedno|dvoj|classic|premium|boxy)(-(diamond|stripe|hexa))?)?|set-(classic|premium)|set-usetrite(-(classic|premium))?|box2?-sam-(s|m|l|xl)|box-set2?-(s|m|l|xl)|pocet-farieb(-2)?|vzor|kamion-(material-presivana|tapacir|tapacir-samostatne))$/;

const NBSP = " ";
const pole = (x) => Array.prototype.slice.call(x || []);
/** pôvodná inline visibility prvku pred skrytím (kópia prvku tu nie je -> "") */
const POVODNA = new WeakMap();

/** 351 -> „351 €“, 1234.5 -> „1 234,50 €“ (SK); CZ „5 664 Kč“. Nekladné / neplatné -> null. */
export function formatCena(n, trh) {
  const x = Number(n);
  if (!isFinite(x) || x <= 0) return null;
  return sumaText(x, trh); // jeden tvar pre celý nový vzhľad (ctx.formatCena = to isté)
}

/** 1 farba, 2–4 farby, 5+ farieb (0 / neplatné -> null). */
export function formatFarby(n) {
  const x = Number(n);
  if (!(x > 0) || Math.round(x) !== x) return null;
  return x + NBSP + (x === 1 ? "farba" : x <= 4 ? "farby" : "farieb");
}

/** „hexa“ -> „Hexa Line“ */
export function formatVzor(v) {
  return v ? String(v).charAt(0).toUpperCase() + String(v).slice(1).toLowerCase() + " Line" : null;
}

const kladne = (x) => (Number(x) > 0 ? Number(x) : null);
const rozdiel = (a, b) => (a > 0 && b > 0 && a - b > 0 ? a - b : null);

/** Príplatok kufra na mape jednovrstvového produktu: Classic = dno bez bokov, Premium = dno + boky. */
function priplatokKufra(mapa, druh) {
  const o = moznostiZMapy(mapa, "kufor").find((x) => (druh === "premium" ? /bok/i.test(x.text) : /dno/i.test(x.text) && !/bok/i.test(x.text)));
  return o ? kladne(o.cena) : null;
}

/** Príplatok parametra (box1, box2, boxSolo) pre veľkosť S/M/L/XL; null = taká veľkosť nie je. */
function priplatokVelkosti(mapa, param, v) {
  const o = moznostiZMapy(mapa, param).find((x) => velkost(x.text) === v);
  return o ? Number(o.cena) || 0 : null;
}

/** Hodnota kľúča -> Promise(text | null). */
export function hodnota(kluc, ctx) {
  const k = String(kluc || "").trim().toLowerCase();
  const pid = ctx.projectId;
  const vzor = ctx.produkt ? ctx.produkt.vzor : null;
  const typ = ctx.produkt ? ctx.produkt.typ : null;
  const trh = ctx.trh;
  const cena = (n) => formatCena(n, trh);
  const cenaOd = () => {
    let z = null;
    try { z = ctx.cena().zaklad; } catch (e) { z = null; }
    return z > 0 ? Promise.resolve(z) : cenaProduktu(location.pathname);
  };
  const cenaOdTypu = (t, v) => cenaTypu(pid, TYPY_OBSAHU[t], v || vzor);
  const setTypu = (druh) => priplatkyTypu(pid, "jedno", vzor).then((m) => priplatokKufra(m, druh));
  if (!RE_KLUC.test(k)) return Promise.resolve(null);
  if (k === "cena-od") return cenaOd().then(cena);
  if (k.indexOf("cena-od-") === 0) {
    const [t, v] = k.slice(8).split("-"); // „classic“ | „classic-hexa“
    return cenaOdTypu(t, v).then(cena);
  }
  if (k === "set-classic" || k === "set-premium") return setTypu(k.slice(4)).then(cena);
  if (k === "set-usetrite") {
    const druh = typ === "kufor-classic" ? "classic" : typ === "kufor-premium" ? "premium" : null;
    if (!druh) return Promise.resolve(null);
    return Promise.all([cenaOd(), setTypu(druh)]).then(([a, b]) => cena(rozdiel(a, b)));
  }
  if (k.indexOf("set-usetrite-") === 0) {
    const druh = k.slice(13);
    return Promise.all([cenaOdTypu(druh), setTypu(druh)]).then(([a, b]) => cena(rozdiel(a, b)));
  }
  const box = /^(box2?-sam|box-set2?)-(s|m|l|xl)$/.exec(k);
  if (box) {
    const v = box[2].toUpperCase();
    if (box[1] === "box-sam") {
      return Promise.all([cenaTypu(pid, "boxy", null), priplatkyTypu(pid, "boxy", null)])
        .then(([z, m]) => { const p = priplatokVelkosti(m, "box1", v); return cena(z > 0 && p != null ? z + p : null); });
    }
    if (box[1] === "box2-sam") return priplatkyTypu(pid, "boxy", null).then((m) => cena(priplatokVelkosti(m, "box2", v)));
    const param = box[1] === "box-set" ? "boxSolo" : "box1";
    return priplatkyTypu(pid, "jedno", vzor).then((m) => cena(priplatokVelkosti(m, param, v)));
  }
  if (k === "pocet-farieb" || k === "pocet-farieb-2") {
    let n = 0;
    try { n = ctx.moznosti(k === "pocet-farieb" ? "farba" : "farba2").length; } catch (e) { n = 0; }
    return Promise.resolve(formatFarby(n));
  }
  if (k === "vzor") return Promise.resolve(formatVzor(vzor));
  return Promise.resolve(null);
}

/** Text do prvku (data-p1v-tvar „od {}“ = predpona/prípona), nezistené -> data-p1v-bez alebo skryť. */
function vypis(el, text) {
  const povodna = POVODNA.get(el) || "";
  const tvar = el.getAttribute("data-p1v-tvar");
  if (text != null) {
    el.textContent = tvar && tvar.indexOf("{}") > -1 ? tvar.replace("{}", text) : text;
    el.setAttribute("data-p1v-stav", "ok");
  } else if (el.hasAttribute("data-p1v-bez")) {
    el.textContent = el.getAttribute("data-p1v-bez");
    el.setAttribute("data-p1v-stav", "bez");
  } else {
    el.style.setProperty("display", "none", "important");
    el.setAttribute("data-p1v-stav", "skryte");
  }
  if (povodna) el.style.visibility = povodna;
  else el.style.removeProperty("visibility");
}

/** Odkaz na produkt iného typu v tom istom vzore (fragment #… ostane); typ, ktorý register nemá -> href bez zmeny. */
function nastavOdkaz(a, ctx) {
  const t = TYPY_OBSAHU[String(a.getAttribute("data-p1v-odkaz") || "").trim().toLowerCase()];
  const p = t ? najdiProdukt(ctx.projectId, t, ctx.produkt ? ctx.produkt.vzor : null) : null;
  if (!p) { a.setAttribute("data-p1v-stav", "bez"); return; }
  const h = a.getAttribute("href") || "";
  const i = h.indexOf("#");
  a.setAttribute("href", p.url + (i > -1 ? h.slice(i) : ""));
  a.setAttribute("data-p1v-stav", "ok");
}

/**
 * Volá obsah.js hneď po umiestnení koreňov (ešte pred skupinami). Odkazy a skrytie nedosadených čísel synchrónne,
 * hodnoty asynchrónne. Vráti Promise, ktorý sa splní, keď sú všetky prvky vypísané (test).
 * @param {{ ctx: any, miesto: Element }} oc
 */
export function init(oc) {
  const ctx = oc.ctx;
  pole(oc.miesto.querySelectorAll("a[data-p1v-odkaz]")).forEach((a) => nastavOdkaz(a, ctx));
  const cakajuce = () => pole(oc.miesto.querySelectorAll("[data-p1v-cislo]")).filter((el) => {
    const s = el.getAttribute("data-p1v-stav");
    return !s || s === "caka";
  });
  const prvky = cakajuce();
  prvky.forEach((el) => {
    POVODNA.set(el, el.style.visibility || "");
    el.style.visibility = "hidden";
    el.setAttribute("data-p1v-stav", "caka");
  });
  // jedna hodnota na kľúč (rovnaký kľúč vo viacerých prvkoch = jedno zistenie)
  const hodnoty = new Map();
  const zisti = (el) => {
    const k = String(el.getAttribute("data-p1v-cislo") || "").trim().toLowerCase();
    if (!hodnoty.has(k)) hodnoty.set(k, hodnota(k, ctx).catch(() => null));
    return hodnoty.get(k).then((text) => vypis(el, text));
  };
  // druhé kolo: kópie prvkov, ktoré skupiny A–D vyrobili po prvom kole (napr. klony pásu galérie), majú stav „caka“
  // skopírovaný, ale nie sú v prvom zozname -> dostanú tú istú hodnotu
  return Promise.all(prvky.map(zisti)).then(() => Promise.all(cakajuce().map(zisti)));
}
