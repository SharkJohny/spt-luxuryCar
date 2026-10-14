// Obsah 1V typu „classic“ (rohož Classic 619/622/625) — mapa sekcií (web ↔ návrh) a kontroly pre tools/test-1v-obsah.mjs. STUB (T0.3).
// VLASTNÍK: T2.3. Pravidlá: docs/1v-obsah.md („Testy“).
//
// test-1v-obsah.mjs pre kľúč obsahu „classic“ spustí tento plugin (namiesto A–D, ktoré overujú obsah 598 s jeho počtami)
// a k nemu skupiny zo zoznamu zdielane (napr. ["d"], keď sekcie D sú presne ako 598). Základ (korene, miesto, sekcie
// viditeľné a odhalené, čísla data-p1v-cislo dosadené, odkazy data-p1v-odkaz v tom istom vzore, sonda, konzola,
// vodorovný posun) overuje test sám pre každý kľúč.
//   sekcie[].meno  = data-lcd-sekcia obalu sekcie v admin-html/src/p1v-classic/NN-*.sk.html
//   sekcie[].navrh = ako nájsť to isté v návrhu kufor-classic.html: [{ sel, text?, za?, pred? }] (snímka = spoločný obdĺžnik)
//   kontroly(t)    -> [{ ok, popis, pozor? }]; pozor: true = upozornenie (nie zlyhanie).
//                     t = tools/test-1v/pomocnik.mjs + t.sekcia(meno), await t.je(meno), t.produkt { id, typ, vzor, kluc,
//                     url, cesta }, t.sestra(typ) = cesta produktu typu v tom istom vzore.
export const SKUPINA = "classic";
export const NAVRH = "kufor-classic.html";
/** skupiny A–D, ktorých kontroly platia aj pre tento obsah (bez zmeny); predvolene žiadne */
export const zdielane = [];
export const sekcie = [];

export async function kontroly(t) {
  void t;
  return [];
}
