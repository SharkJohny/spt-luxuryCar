// Obrázky, ktoré kód bral z úložiska obchodu (Shoptet admin, /user/documents/upload/assets/…), z CDN repa (29. 10. 2026).
// Predtým: relatívne /user/documents/upload/assets/config/<slug>.jpg (úložisko webu, na ktorom stránka beží) a natvrdo
// SK alebo CZ úložisko pre oba weby -> zmazanie alebo premenovanie súboru v admine by rozbilo SK aj CZ. Teraz kópia
// bajt po bajte v repe assets/img/ulozisko/ (tools/config-obrazky.mjs), na CDN s celým assets/ (spoločné pre verzie).
//   obrazokUloziska("config/<slug>.jpg")  súbor úložiska webu, na ktorom stránka beží (<web> = location.hostname);
//                                         nový trh = nový priečinok assets/img/ulozisko/<web>/ (skript), kód sa nemení.
//                                         Súbor, ktorý v repe ešte nie je (nová farba v admine), ide ako doteraz
//                                         z úložiska webu — kým ho node tools/config-obrazky.mjs nestiahne do repa.
//   obrazokSpolocny("config/D-1.jpg")     súbor, ktorý kód bral natvrdo z jedného úložiska pre všetky weby (vzorky, obrázky
//                                         ponúk) — assets/img/ulozisko/spolocne/ (skript overí, že ich má všetky).
//                                         Cesta mimo zoznamu (30. 10. 2026: nové meno obrázka ponuky v data.json) ide
//                                         ako záloha z úložiska webu, na ktorom stránka beží — nie 404 z CDN.
import { LCD_SPOLOCNY } from "./lcdZaklad.js";
import { ULOZISKO_SPOLOCNE, ULOZISKO_WEBY } from "./ulozisko-data.js";

/** Základ kópií v CDN repa (assets/img/ulozisko/); jediné miesto, kde sa adresa skladá. */
export const ULOZISKO_CDN = LCD_SPOLOCNY + "img/ulozisko/";
const ULOZISKO_WEBU = "/user/documents/upload/assets/";
// Cesta podľa názvu voľby -> skutočný súbor (ulozisko-data.js sa generuje, súbory sa neprepisujú; 6. 11. 2026).
// SK: fotky čiernej s bielym a sivým šitím sú pod opačnými menami. CZ: „Vínově červená“ má súbor so starým preklepom.
const SK_BIELE = "config/farba-koze-cierna-farba-sitia-biela.jpg", SK_SIVE = "config/farba-koze-cierna-farba-sitia-seda.jpg";
const OPRAVY_CIEST = {
  "www.luxurycardesign.sk": { [SK_BIELE]: SK_SIVE, [SK_SIVE]: SK_BIELE },
  "www.luxurycardesign.cz": { "config/barva-kuze-vinove-cervena.jpg": "config/barva-kuze-vynove-cervena.jpg" },
};

// "cesta" = súbor s tým istým menom; "cesta>súbor" = fotka zmenená v admine, nová verzia pod novým menom
function mapaZoznamu(zoznam) {
  const m = {};
  for (const z of zoznam || []) { const i = z.indexOf(">"); if (i < 0) m[z] = z; else m[z.slice(0, i)] = z.slice(i + 1); }
  return m;
}
const ma = (m, k) => !!m && Object.prototype.hasOwnProperty.call(m, k);
let mapa = null, mapaSpolocnych = null;
function subory() {
  if (mapa) return mapa;
  mapa = {};
  for (const web in ULOZISKO_WEBY) mapa[web] = mapaZoznamu(ULOZISKO_WEBY[web]);
  return mapa;
}
function tentoWeb() {
  try { return String(location.hostname || "").toLowerCase(); } catch (e) { return ""; }
}

/** Súbor úložiska webu, na ktorom stránka beží (cesta za /user/documents/upload/assets/, napr. "config/cierna.jpg").
 *  verzia = pôvodný ?parameter adresy úložiska (len pre zálohu, CDN mená sa nemenia). */
export function obrazokUloziska(cesta, verzia) {
  const web = tentoWeb();
  const m = subory()[web];
  const c = ma(OPRAVY_CIEST[web], cesta) ? OPRAVY_CIEST[web][cesta] : cesta;
  if (ma(m, c)) return ULOZISKO_CDN + web + "/" + m[c];
  return ULOZISKO_WEBU + c + (verzia ? "?" + verzia : "");
}

/** Súbor spoločný pre všetky weby (assets/img/ulozisko/spolocne/<cesta>); mimo zoznamu záloha z úložiska webu. */
export function obrazokSpolocny(cesta) {
  if (!mapaSpolocnych) mapaSpolocnych = mapaZoznamu(ULOZISKO_SPOLOCNE);
  if (ma(mapaSpolocnych, cesta)) return ULOZISKO_CDN + "spolocne/" + mapaSpolocnych[cesta];
  return ULOZISKO_WEBU + cesta;
}
