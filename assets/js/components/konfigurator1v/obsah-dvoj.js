// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „dvoj“ (dvojvrstvové 601/604/607). T1.3, 14. 10. 2026.
// VLASTNÍK: T1.3 (+ admin-html/src/p1v-dvoj/*, assets/css/_lcd1v-obsah-dvoj.scss, tools/test-1v/obsah-dvoj.mjs,
// assets/img/1v/obsah/dvoj-*). Spec: $P/navrh-dvojvrstvove.md §5. Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „dvoj“ (produkty.js -> obsah).
// Oživuje len sekcie, ktoré A–D nepoznajú (nové komponenty typu). Spoločné sekcie (referencie, galéria, recenzie,
// deväť vecí, materiál, časová os, farby, FAQ, okno…) oživujú A–D podľa mena data-lcd-sekcia — tu ich neduplikovať.
// Čísla a odkazy závislé od vzoru dosadí obsah-cisla.js (data-p1v-cislo / data-p1v-odkaz), nie tento modul.
//
// Nové komponenty dvojvrstvových sú ČISTO STATICKÉ (HTML + CSS), preto tu nie je čo oživovať:
//   a-ponuka     tabuľka .vs2 „Jednovrstvové alebo dvojvrstvové?“ — ceny dosadí obsah-cisla.js (cena-od-jedno, cena-od), reveal .rv obsah.js
//   b-material   6 dosiek rezu — medzeru dosiek podľa ich počtu rieši obsah-b.js (gap = pw·0,58·min(1, 4/(n−1)))
//   c-domov      položka „Druhá vrstva“ (inline SVG), c-farby 4 vzorky — lxModulyOziv z obsah-c.js
//   d-faq        13 otázok — obsah-d.js
// Modul ostáva zámerne prázdny (obsah.js ho volá, init nesmie spadnúť). Pridať sem logiku len pre komponent, ktorý A–D neoživia.
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny fetch/POST, ceny ani ID natvrdo.
// oc = { ctx, kluc, korene, koren, miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el),
//        ked, na, vysli }; sekcia, ktorá je stub, nie je v DOM: oc.sekcia(meno) === null.
export const MENO = "obsah-dvoj";

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  void oc;
}
