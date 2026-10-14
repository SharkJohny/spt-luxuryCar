// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „boxy“ (box do kufra 616). T3.3 (14. 10. 2026).
// VLASTNÍK: T3.3 (+ admin-html/src/p1v-boxy/*, assets/css/_lcd1v-obsah-boxy.scss, tools/test-1v/obsah-boxy.mjs,
// assets/img/1v/obsah/boxy-*). Spec: $P/navrh-boxy.md §6. Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „boxy“ (produkty.js -> obsah).
//
// Nové komponenty typu nepotrebujú vlastné správanie:
//   a-ponuka (tabuľka cien .cenv)   čísla box-sam-* / box-set-* / box-set2-* dosadí obsah-cisla.js zo živých stránok (616, jednovrstvové),
//   boxy-velkosti (#velkosti)        statické karty so siluetou (inline SVG, <defs> s id p1v-bxg / p1v-bxq), čísla box-sam-* / box-set-*,
//   boxy-cross (.cross)              karty-odkazy: odkaz v nadpise natiahnutý na celú kartu cez CSS (::after), href a ceny dosadí obsah-cisla.js,
//   reveal .rv                       robí obsah.js pre všetky sekcie spolu.
// Spoločné sekcie (galéria, recenzie, osem vecí, pred a po, kam siahajú, časová os, farby, vzorky, FAQ, záver, okno fotiek) oživujú skupiny A–D
// podľa mena data-lcd-sekcia — tu sa neduplikujú. Vzhľad nových komponentov je v _lcd1v-obsah-boxy.scss.
// Čo by tu patrilo, keby pribudlo správanie, ktoré návrh nemá (napr. zvýraznenie veľkosti podľa výberu v konfigurátore), nie je v schválenom návrhu
// (rozhodnutia D3: tvrdenie ani správanie mimo návrhu sa nepridáva).
//
// Čísla vo FAQ (odpovede 2 a 8) majú štandardnú značku data-p1v-cislo (+ data-p1v-bez) a dosadí ich obsah-cisla.js — integrácia WB
// 14. 10. 2026 opravila test jadra (vlastná viditeľnosť čísla), dočasná značka data-p1v-faq-cislo a jej dosadzovanie tu sú preč.
//
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny fetch/POST, ceny ani ID natvrdo.
// oc = { ctx, kluc, korene, koren, miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el),
//        ked, na, vysli }; sekcia, ktorá je stub, nie je v DOM: oc.sekcia(meno) === null.
export const MENO = "obsah-boxy";

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  void oc; // typ boxy nemá vlastné správanie (všetko robia skupiny A–D a obsah-cisla.js)
}
