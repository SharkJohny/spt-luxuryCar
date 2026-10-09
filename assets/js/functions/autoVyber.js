/**
 * autoVyber.js — pomocné funkcie pre výber auta (značka / model / rok / typ) v konfigurátore
 * osobných áut (main.js: initModelSelect + saveModel).
 *
 * Prečo (hlásenie Michala 8. 10. 2026, CZ produkt „Ford | Model | 2023 | Pick-UP“):
 *  - uložený model sa obnovoval len časovačmi naslepo (600/1200/2000 ms) a handler značky pri KAŽDOM
 *    change zmazal a znova naplnil zoznam modelov. Shoptet (main-3g.js handleBrowserValueRestoration)
 *    po 'load' produktu pošle change na každý `.surcharge-list select` — aj na náš select značky —
 *    a keď 'load' prišiel po poslednom časovači, model ostal na „Model“;
 *  - saveModel zapisoval aj null (-> "null"), placeholdery a „model“ so starým autom.
 * Odteraz: model sa nastaví hneď po naplnení zoznamu, zoznam sa prestaví len pri skutočnej zmene značky
 * a do sessionStorage ide len platný výber (inak sa kľúč odstráni).
 */

/** Typ auta — placeholder selectu (markup v main.js) a staršie názvy z configuratorEngine. */
export const LCD_TYP_PLACEHOLDERY = ["Typ auta", "Typ karosérie", "Typ karoserie"];

/** „Iné/Jiné…“ — SK a CZ znenie tej istej možnosti (rok aj model). */
const LCD_INE_VARIANTY = ["Jiné, prosím napište do poznámky", "Iné, prosím napíšte do poznámky"];

/** Porovnávací tvar textu: NFC, NBSP -> medzera, zlúčené medzery, bez okrajov, malé písmená. */
export function lcdNorm(s) {
  return String(s == null ? "" : s)
    .normalize("NFC")
    .replace(/ /g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Hodnota vybranej možnosti, ak je to skutočný výber; inak null.
 * Neplatné: žiadny select, selectedIndex -1, možnosť .notselect (placeholder), text/hodnota
 * placeholdera, prázdna hodnota, "null"/"undefined". Obnovená značka/rok/typ (prepend na index 0,
 * bez .notselect) JE platný výber.
 */
export function lcdPlatnaHodnota(select, placeholdery) {
  if (!select || !select.options) return null;
  const i = select.selectedIndex;
  if (typeof i !== "number" || i < 0) return null;
  const op = select.options[i];
  if (!op || (op.classList && op.classList.contains("notselect"))) return null;
  const hodnota = select.value;
  if (hodnota == null) return null;
  const n = lcdNorm(hodnota);
  if (!n || n === "null" || n === "undefined") return null;
  const ph = (placeholdery || []).filter((p) => p != null).map(lcdNorm);
  if (ph.indexOf(n) > -1 || ph.indexOf(lcdNorm(op.text)) > -1) return null;
  return String(hodnota);
}

/** Index prvej skutočnej možnosti (nie .notselect), ktorej hodnota alebo text sa zhoduje s `hodnota`; inak -1. */
function lcdIndexMoznosti(select, hodnota) {
  const n = lcdNorm(hodnota);
  if (!n) return -1;
  for (let i = 0; i < select.options.length; i++) {
    const op = select.options[i];
    if (op.classList && op.classList.contains("notselect")) continue;
    if (lcdNorm(op.value) === n || lcdNorm(op.text) === n) return i;
  }
  return -1;
}

/**
 * Vyberie v selecte možnosť zodpovedajúcu uloženej hodnote (normalizované porovnanie, prvá zhoda,
 * „Iné…“ = „Jiné…“). Nastaví len selectedIndex — change NEvyvolá. Vráti true, ak sa našla.
 */
export function lcdVyberMoznost(select, hodnota) {
  if (!select || !select.options || hodnota == null) return false;
  let i = lcdIndexMoznosti(select, hodnota);
  if (i < 0 && LCD_INE_VARIANTY.some((v) => lcdNorm(v) === lcdNorm(hodnota))) {
    for (let k = 0; k < LCD_INE_VARIANTY.length && i < 0; k++) i = lcdIndexMoznosti(select, LCD_INE_VARIANTY[k]);
  }
  if (i < 0) return false;
  select.selectedIndex = i;
  return true;
}

/** Kľúč v objekte (napr. setupData.cars) pre uloženú značku: presná zhoda, inak normalizovaná; inak null. */
export function lcdNajdiKluc(obj, hodnota) {
  if (!obj || hodnota == null) return null;
  const s = String(hodnota);
  if (Object.prototype.hasOwnProperty.call(obj, s)) return s;
  const n = lcdNorm(s);
  if (!n) return null;
  const kluce = Object.keys(obj);
  for (let i = 0; i < kluce.length; i++) if (lcdNorm(kluce[i]) === n) return kluce[i];
  return null;
}
