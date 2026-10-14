// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „boxy“ (box do kufra 616). T3.3 (14. 10. 2026).
// VLASTNÍK: T3.3 (+ admin-html/src/p1v-boxy/*, assets/css/_lcd1v-obsah-boxy.scss, tools/test-1v/obsah-boxy.mjs,
// assets/img/1v/obsah/boxy-*). Spec: $P/navrh-boxy.md §6. Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „boxy“ (produkty.js -> obsah).
//
// Nové komponenty typu nepotrebujú vlastné správanie (okrem čísel v zbalenom FAQ, nižšie):
//   a-ponuka (tabuľka cien .cenv)   čísla box-sam-* / box-set-* / box-set2-* dosadí obsah-cisla.js zo živých stránok (616, jednovrstvové),
//   boxy-velkosti (#velkosti)        statické karty so siluetou (inline SVG, <defs> s id p1v-bxg / p1v-bxq), čísla box-sam-* / box-set-*,
//   boxy-cross (.cross)              karty-odkazy: odkaz v nadpise natiahnutý na celú kartu cez CSS (::after), href a ceny dosadí obsah-cisla.js,
//   reveal .rv                       robí obsah.js pre všetky sekcie spolu.
// Spoločné sekcie (galéria, recenzie, osem vecí, pred a po, kam siahajú, časová os, farby, vzorky, FAQ, záver, okno fotiek) oživujú skupiny A–D
// podľa mena data-lcd-sekcia — tu sa neduplikujú. Vzhľad nových komponentov je v _lcd1v-obsah-boxy.scss.
// Čo by tu patrilo, keby pribudlo správanie, ktoré návrh nemá (napr. zvýraznenie veľkosti podľa výberu v konfigurátore), nie je v schválenom návrhu
// (rozhodnutia D3: tvrdenie ani správanie mimo návrhu sa nepridáva).
//
// ČÍSLA V ZBALENOM FAQ (d-faq, odpovede 2 a 8): značka data-p1v-faq-cislo="<kľúč>" (kľúče ako data-p1v-cislo) + data-p1v-faq-bez (náhradný text). Hodnotu zistí tá istá
// funkcia ako pre data-p1v-cislo (hodnota() z obsah-cisla.js: živé stránky, cache), takže je to jeden zdroj pravdy. Samostatná značka je preto, že
// zbalená odpoveď má visibility:hidden, ktorú dedí aj číslo — základný test čísel (test-1v-obsah.mjs: „nič neostalo visibility:hidden“) by ho hlásil
// ako nedosadené. Po oprave testu (kontrolovať len vlastnú viditeľnosť čísla) stačí v 41-d-faq premenovať značku na data-p1v-cislo a tento blok zmazať.
//
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny fetch/POST, ceny ani ID natvrdo.
// oc = { ctx, kluc, korene, koren, miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el),
//        ked, na, vysli }; sekcia, ktorá je stub, nie je v DOM: oc.sekcia(meno) === null.
import { hodnota } from "./obsah-cisla.js";

export const MENO = "obsah-boxy";

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  const faq = oc && oc.sekcia ? oc.sekcia("d-faq") : null;
  if (!faq) return;
  Array.prototype.slice.call(faq.querySelectorAll("[data-p1v-faq-cislo]")).forEach((el) => {
    const kluc = String(el.getAttribute("data-p1v-faq-cislo") || "").trim().toLowerCase();
    Promise.resolve(hodnota(kluc, oc.ctx)).catch(() => null).then((text) => {
      if (text != null) {
        el.textContent = text;
        el.setAttribute("data-p1v-faq-stav", "ok");
      } else if (el.hasAttribute("data-p1v-faq-bez")) {
        el.textContent = el.getAttribute("data-p1v-faq-bez");
        el.setAttribute("data-p1v-faq-stav", "bez");
      } else {
        el.style.setProperty("display", "none", "important");
        el.setAttribute("data-p1v-faq-stav", "skryte");
      }
    });
  });
}
