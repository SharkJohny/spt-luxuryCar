// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „dvoj“ (dvojvrstvové 601/604/607). STUB (T0.3, 14. 10. 2026).
// VLASTNÍK: T1.3 (+ admin-html/src/p1v-dvoj/*, assets/css/_lcd1v-obsah-dvoj.scss, tools/test-1v/obsah-dvoj.mjs,
// assets/img/1v/obsah/dvoj-*). Spec: $P/navrh-dvojvrstvove.md §5. Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „dvoj“ (produkty.js -> obsah).
// Oživuje len sekcie, ktoré A–D nepoznajú (nové komponenty typu). Spoločné sekcie (referencie, galéria, recenzie,
// deväť vecí, materiál, časová os, farby, FAQ, okno…) oživujú A–D podľa mena data-lcd-sekcia — tu ich neduplikovať.
// Čísla a odkazy závislé od vzoru dosadí obsah-cisla.js (data-p1v-cislo / data-p1v-odkaz), nie tento modul.
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny fetch/POST, ceny ani ID natvrdo.
// oc = { ctx, kluc, korene, koren, miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el),
//        ked, na, vysli }; sekcia, ktorá je stub, nie je v DOM: oc.sekcia(meno) === null.
export const MENO = "obsah-dvoj";

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  void oc;
}
