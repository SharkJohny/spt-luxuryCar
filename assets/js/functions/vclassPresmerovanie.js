/**
 * Mercedes triedy V W447 (od roku 2014) má na SK webe samostatnú stránku s cenou celého setu (produkt 646,
 * /autokoberce-mercedes-v-class/, konfigurátor components/konfigurator1v/vclass/). Michal 8. 11. 2026: „aby ho to rovno
 * prehodilo do produktu V-class“. Používa konfigurátor autokobercov 1V (konfigurator1v/vclass-presmerovanie.js) a výber
 * auta na titulke (main.js saveModel).
 *
 * Zhoda podľa katalógu áut (data.json `cars`, značka "Mercedes-Benz"; porovnanie cez lcdNorm, teda bez ohľadu na veľké
 * písmená a medzery):
 *   "V Class"                         -> zahŕňa aj starú W638 (1996–2003), preto rozhoduje rok: len 2014 a novší
 *   "V Class M (compact 4895 mm)"     -> W447 kompaktná (dĺžka M)  } dĺžky W447; rok aj tak 2014 a novší
 *   "V Class L (long 5140 mm)"        -> W447 dlhá (dĺžka L)       } (starší rok = nezmysel, nič sa nedeje)
 *   "V Class XL (Extra Long 5370 mm)" -> W447 extra dlhá (XL)      }
 * Vito, Viano, EQV, VLE, Metris (a Marco Polo, ktorý v katalógu nie je) ostávajú bez zmeny (rozhodnutie Michala).
 * Rok „Iné, prosím napíšte do poznámky“ nie je číslo -> nič. Len SK (CZ web produkt triedy V nemá).
 */
import { lcdNorm } from "./autoVyber.js";

/** Stránka triedy V (SK 646). */
export const VCLASS_URL = "/autokoberce-mercedes-v-class/";
export const VCLASS_OD_ROKU = 2014;
/** sessionStorage: zákazník už bol presmerovaný (konfigurátor po návrate Späť už len ukáže odkaz, nezacyklí sa). */
export const KLUC_PRESMEROVANE = "lcdVclassPresmer";
/** sessionStorage: rozrobený výber na stránke triedy V (vclass/app.js KLUC_ULOZENIA) = zákazník tam už bol. */
export const KLUC_VCLASS = "lcdVclass";

const SK_PROJEKT = "562035";
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
 * Auto triedy V W447 -> { rok: "2020", velkost: "L" | "" }, inak null.
 * @param {string|null} znacka  @param {string|null} model  @param {string|null} rok
 */
export function vclassAuto(znacka, model, rok) {
  if (lcdNorm(znacka) !== ZNACKA) return null;
  const m = lcdNorm(model);
  if (!Object.prototype.hasOwnProperty.call(MODELY, m)) return null;
  const r = String(rok == null ? "" : rok).trim();
  if (!/^\d{4}$/.test(r)) return null;
  const n = Number(r);
  // horná hranica = aktuálny rok, rovnako ako zoznam rokov v konfigurátore (main.js) aj na stránke triedy V (vclass/data.js ROKY)
  if (n < VCLASS_OD_ROKU || n > new Date().getFullYear()) return null;
  return { rok: r, velkost: MODELY[m] };
}

/** Adresa stránky triedy V s rokom (a dĺžkou, ak ju model hovorí): vclass/app.js ich predvyplní. */
export function adresaVclass(a) {
  let q = "?rok=" + encodeURIComponent(a.rok);
  if (a.velkost) q += "&velkost=" + encodeURIComponent(a.velkost);
  return VCLASS_URL + q;
}

/**
 * Zapamätá v karte prehliadača, že zákazník už bol poslaný na stránku triedy V (pred každým presmerovaním: konfigurátor aj
 * titulka). Konfigurátor potom pri tom istom aute ukáže len odkaz a nepresmeruje znova (žiadne odrazenie späť).
 */
export function oznacPresmerovane() {
  try { sessionStorage.setItem(KLUC_PRESMEROVANE, "1"); } catch (e) { /* súkromný režim */ }
}

/** Už bol zákazník na stránke triedy V (presmerovaný, alebo tam má rozrobený výber)? */
export function uzBolNaVclass() {
  try { return !!(sessionStorage.getItem(KLUC_PRESMEROVANE) || sessionStorage.getItem(KLUC_VCLASS)); } catch (e) { return false; }
}

/** SK web (projekt 562035 a html lang sk). CZ nikdy. */
export function jeSkWeb() {
  try {
    const sh = (window.dataLayer && window.dataLayer[0] && window.dataLayer[0].shoptet) || {};
    const lang = String((document.documentElement && document.documentElement.lang) || "").toLowerCase();
    return String(sh.projectId) === SK_PROJEKT && lang.indexOf("sk") === 0;
  } catch (e) {
    return false;
  }
}

/** Sme na stránke triedy V? Tá nikdy nepresmerúva. */
export function jeStrankaVclass() {
  return String(window.location.pathname || "").indexOf(VCLASS_URL) === 0;
}
