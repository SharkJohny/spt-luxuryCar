// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „kamiony“ (kamióny a dodávky SK 640). KOSTRA (K1, 18. 10. 2026).
// VLASTNÍK tela init: časť OBSAH (admin-html/src/p1v-kamiony/*, assets/css/_lcd1v-obsah-kamiony.scss,
// tools/test-1v/obsah-kamiony.mjs). Plán: docs/kamiony-1v-plan.md §4. Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „kamiony“ (produkty.js -> obsah).
// Výzvy a[href="#product-detail-form"] zachytí konfigurátor (kamion/ui.js: otvorí krok Vozidlo), kotva dopravcov je
// id="p1v-kamiony-dopravcovia" (zmluva §4.3). Čísla kamion-* dosadí obsah-cisla.js.
//
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny fetch/POST, ceny ani ID natvrdo.
export const MENO = "obsah-kamiony";

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  void oc; // telo dopíše časť OBSAH, ak treba správanie navyše (O5)
}
