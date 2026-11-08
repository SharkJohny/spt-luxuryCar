/**
 * Mercedes triedy V W447 (od roku 2014) má samostatnú stránku s cenou celého setu (SK produkt 646, CZ produkt 2458, na oboch
 * weboch /autokoberce-mercedes-v-class/, konfigurátor components/konfigurator1v/vclass/). Michal 8. 11. 2026: „aby ho to
 * rovno prehodilo do produktu V-class“. Používa konfigurátor autokobercov 1V (konfigurator1v/vclass-presmerovanie.js) a výber
 * auta na titulke (main.js saveModel). Na ktorom webe: webPresmerovania() — SK vždy, CZ až s CZ_SPUSTENE = true.
 *
 * Zhoda podľa katalógu áut (data.json `cars`, značka "Mercedes-Benz"; porovnanie cez lcdNorm, teda bez ohľadu na veľké
 * písmená a medzery):
 *   "V Class"                         -> zahŕňa aj staršie generácie (W638, W639), preto rozhoduje rok: len 2014 až
 *                                        aktuálny; „Iné, prosím napíšte do poznámky“, nevybraný či starší rok -> nič
 *   "V Class M (compact 4895 mm)"     -> W447 kompaktná (dĺžka M)  } dĺžky existujú len pri W447 (Michal 8. 11. 2026): pri
 *   "V Class L (long 5140 mm)"        -> W447 dlhá (dĺžka L)       } AKOMKOĽVEK roku aj bez roku je to trieda V; rok pred
 *   "V Class XL (Extra Long 5370 mm)" -> W447 extra dlhá (XL)      } 2014, budúci či „Iné“ = omyl -> do adresy bez roku
 *                                                                    (rok si zákazník vyberie na stránke triedy V)
 * Vito, Viano, EQV, VLE, Metris (a Marco Polo, ktorý v katalógu nie je) ostávajú bez zmeny (rozhodnutie Michala).
 * CZ katalóg (data.json `carscs`) má tie isté mená modelov
 * a CZ výber auta číta `cars` ako SK, pravidlá sú teda na oboch weboch rovnaké.
 */
import { lcdNorm } from "./autoVyber.js";

/**
 * PREPÍNAČ CZ (luxurycardesign.cz). false = na CZ webe sa NIČ nepresmeruje ani neukáže (konfigurátor autokobercov aj titulka
 * ako doteraz): CZ produkt triedy V 2458 je zatiaľ skrytý (kategória Test, hosť dostane 404). true = CZ presne ako SK
 * (české texty, okno „Máte Mercedes třídy V?“). Prepne hlavná session v tom istom vydaní, v ktorom sa CZ produkt zverejní.
 * Test oboch stavov: node tools/test-vclass-presmerovanie.mjs [--cz-spustene].
 */
export const CZ_SPUSTENE = false;

/** Stránka triedy V (SK 646, CZ 2458 — rovnaká adresa na oboch weboch). */
export const VCLASS_URL = "/autokoberce-mercedes-v-class/";
export const VCLASS_OD_ROKU = 2014;
/** sessionStorage: zákazník už bol presmerovaný (konfigurátor po návrate Späť už nepresmeruje sám, len sa opýta oknom). */
export const KLUC_PRESMEROVANE = "lcdVclassPresmer";
/** sessionStorage: rozrobený výber na stránke triedy V (vclass/app.js KLUC_ULOZENIA) = zákazník tam už bol. */
export const KLUC_VCLASS = "lcdVclass";

const SK_PROJEKT = "562035";
const CZ_PROJEKT = "581408";
const ZNACKA = "mercedes-benz";
/** model (lcdNorm) -> dĺžka na stránke triedy V ("" = nevieme, zákazník ju vyberie tam) */
const MODELY = {
  "v class": "",
  "v class m (compact 4895 mm)": "M",
  "v class l (long 5140 mm)": "L",
  "v class xl (extra long 5370 mm)": "XL",
};

/** Mená modelov z katalógu áut, ktoré sa presmerujú (pre test a dokumentáciu). */
export const VCLASS_MODELY = ["V Class", "V Class M (compact 4895 mm)", "V Class L (long 5140 mm)", "V Class XL (Extra Long 5370 mm)"];

/**
 * Auto triedy V W447 -> { rok: "2020" | "", velkost: "L" | "" }, inak null. rok "" = len pri dĺžke M/L/XL s rokom mimo
 * 2014 – aktuálny alebo bez roku; velkost "" = obyčajné „V Class“ (vtedy je rok vždy platný).
 * @param {string|null} znacka  @param {string|null} model  @param {string|null} rok
 */
export function vclassAuto(znacka, model, rok) {
  if (lcdNorm(znacka) !== ZNACKA) return null;
  const m = lcdNorm(model);
  if (!Object.prototype.hasOwnProperty.call(MODELY, m)) return null;
  const velkost = MODELY[m];
  const r = String(rok == null ? "" : rok).trim();
  const n = /^\d{4}$/.test(r) ? Number(r) : 0;
  // horná hranica = aktuálny rok, rovnako ako zoznam rokov v konfigurátore (main.js) aj na stránke triedy V (vclass/data.js ROKY)
  const platny = n >= VCLASS_OD_ROKU && n <= new Date().getFullYear();
  if (velkost) return { rok: platny ? r : "", velkost: velkost }; // dĺžka = vždy W447, zlý alebo chýbajúci rok = bez roku
  return platny ? { rok: r, velkost: "" } : null;
}

/** Adresa stránky triedy V s rokom a dĺžkou (len tie, ktoré sú známe): vclass/app.js ich predvyplní. */
export function adresaVclass(a) {
  const q = [];
  if (a.rok) q.push("rok=" + encodeURIComponent(a.rok));
  if (a.velkost) q.push("velkost=" + encodeURIComponent(a.velkost));
  return VCLASS_URL + (q.length ? "?" + q.join("&") : "");
}

/**
 * Zapamätá v karte prehliadača, že zákazník už bol poslaný na stránku triedy V (pred každým presmerovaním: konfigurátor aj
 * titulka). Konfigurátor potom nepresmeruje znova sám (žiadne odrazenie späť), len sa opýta oknom „Máte Mercedes triedy V?“.
 */
export function oznacPresmerovane() {
  try { sessionStorage.setItem(KLUC_PRESMEROVANE, "1"); } catch (e) { /* súkromný režim */ }
}

/** Už bol zákazník na stránke triedy V (presmerovaný, alebo tam má rozrobený výber)? */
export function uzBolNaVclass() {
  try { return !!(sessionStorage.getItem(KLUC_PRESMEROVANE) || sessionStorage.getItem(KLUC_VCLASS)); } catch (e) { return false; }
}

/**
 * sessionStorage: id produktov, na ktorých sa už ukázalo okno „Máte Mercedes triedy V?“ (konfigurator1v/vclass-presmerovanie.js).
 * Pri načítaní stránky s uloženou triedou V sa okno ukáže najviac raz za session na produkte (Michal 8. 11. 2026).
 */
export const KLUC_OKNO = "lcdVclassOkno";

function zoznamOkien() {
  try {
    const z = JSON.parse(sessionStorage.getItem(KLUC_OKNO) || "[]");
    return Array.isArray(z) ? z.map(String) : [];
  } catch (e) {
    return []; // pokazená hodnota alebo súkromný režim = ešte nebolo
  }
}

/** Ukázalo sa už na tomto produkte okno „Máte Mercedes triedy V?“ (v tejto karte prehliadača)? */
export function oknoBoloNa(produkt) {
  return zoznamOkien().indexOf(String(produkt)) > -1;
}

/** Zapamätá, že na produkte sa okno „Máte Mercedes triedy V?“ už ukázalo. */
export function oznacOkno(produkt) {
  const z = zoznamOkien();
  if (z.indexOf(String(produkt)) > -1) return;
  z.push(String(produkt));
  try { sessionStorage.setItem(KLUC_OKNO, JSON.stringify(z)); } catch (e) { /* súkromný režim */ }
}

/** Web stránky: "sk" (projekt 562035 a html lang sk), "cz" (projekt 581408 a html lang cs) alebo null. */
function webStranky() {
  try {
    const sh = (window.dataLayer && window.dataLayer[0] && window.dataLayer[0].shoptet) || {};
    const lang = String((document.documentElement && document.documentElement.lang) || "").toLowerCase();
    const p = String(sh.projectId);
    if (p === SK_PROJEKT && lang.indexOf("sk") === 0) return "sk";
    if (p === CZ_PROJEKT && lang.indexOf("cs") === 0) return "cz";
  } catch (e) { /* bez dataLayer */ }
  return null;
}

/** SK web (projekt 562035 a html lang sk). */
export function jeSkWeb() {
  return webStranky() === "sk";
}

/** CZ web (projekt 581408 a html lang cs) — bez ohľadu na CZ_SPUSTENE. */
export function jeCzWeb() {
  return webStranky() === "cz";
}

/**
 * Web, na ktorom sa trieda V presmerúva (konfigurátor autokobercov aj titulka): "sk", "cz" alebo null (nič).
 * SK vždy, CZ len keď spustene (predvolene prepínač CZ_SPUSTENE); parameter je pre test.
 * @param {boolean} [spustene]
 */
export function webPresmerovania(spustene = CZ_SPUSTENE) {
  const w = webStranky();
  return w === "cz" && !spustene ? null : w;
}

/** Sme na stránke triedy V? Tá nikdy nepresmerúva. */
export function jeStrankaVclass() {
  return String(window.location.pathname || "").indexOf(VCLASS_URL) === 0;
}
