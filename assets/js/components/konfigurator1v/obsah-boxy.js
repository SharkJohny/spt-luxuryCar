// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „boxy“ (box do kufra 616). T3.3 (14. 10. 2026).
// VLASTNÍK: T3.3 (+ admin-html/src/p1v-boxy/*, assets/css/_lcd1v-obsah-boxy.scss, tools/test-1v/obsah-boxy.mjs,
// assets/img/1v/obsah/boxy-*). Spec: $P/navrh-boxy.md §6. Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „boxy“ (produkty.js -> obsah).
//
// Nové komponenty typu nepotrebujú vlastné správanie:
//   a-ponuka (tabuľka cien .cenv)   čísla box-sam-* / box-set-* / box-set2-* dosadí obsah-cisla.js zo živých stránok (616, jednovrstvové),
//   boxy-velkosti (#velkosti)        karty s kresbou boxu a farbami na klik (nižšie), čísla box-sam-* / box-set-*,
//   boxy-cross (.cross)              karty-odkazy: odkaz v nadpise natiahnutý na celú kartu cez CSS (::after), href a ceny dosadí obsah-cisla.js,
//   reveal .rv                       robí obsah.js pre všetky sekcie spolu.
// Spoločné sekcie (galéria, recenzie, osem vecí, pred a po, kam siahajú, časová os, farby, vzorky, FAQ, záver, okno fotiek) oživujú skupiny A–D
// podľa mena data-lcd-sekcia — tu sa neduplikujú. Vzhľad nových komponentov je v _lcd1v-obsah-boxy.scss.
//
// Čísla vo FAQ (odpovede 2 a 8) majú štandardnú značku data-p1v-cislo (+ data-p1v-bez) a dosadí ich obsah-cisla.js — integrácia WB
// 14. 10. 2026 opravila test jadra (vlastná viditeľnosť čísla), dočasná značka data-p1v-faq-cislo a jej dosadzovanie tu sú preč.
//
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny fetch/POST, ceny ani ID natvrdo.
// oc = { ctx, kluc, korene, koren, miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el),
//        ked, na, vysli }; sekcia, ktorá je stub, nie je v DOM: oc.sekcia(meno) === null.
//
// Jediné vlastné správanie: sekcia veľkostí (boxy-velkosti) — Michal 23. 10. 2026: „farebné varianty, ktoré by sa dali klikať a
// ukazovali by sa tam jednotlivé veľkosti tých boxov, tak ako je v konfigurátore, nie kufríky s rúčkou“. Karty .vc-sil[data-p1v-sirka]
// dostanú kresbu boxu z box-kresba.js (tá istá ako krok Veľkosť na 616), tlačidlá .vfar [data-p1v-farba] prefarbia všetky štyri naraz.
import { definicieKresby, kresba, nastavFarbuKresby, FARBY_KRESBY, PREDVOLENA } from "./box-kresba.js";

export const MENO = "obsah-boxy";
/** ID vzorov kresby v obsahu (konfigurátor 616 má predvolenú predponu lcd1v-bxp- — na stránke sú obe sady naraz) */
const PREDPONA = "p1v-bxk-";

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  const sek = oc.sekcia("boxy-velkosti");
  if (!sek) return;
  const karty = sek.querySelectorAll(".vc-sil[data-p1v-sirka]");
  if (!karty.length) return;
  // vzory dedia premenné farby z obalu -> <defs> patria dovnútra sekcie (box-kresba.js: nie display:none)
  sek.insertBefore(definicieKresby(PREDPONA), sek.firstChild);
  karty.forEach((k) => {
    if (!k.querySelector("svg")) k.appendChild(kresba(Number(k.getAttribute("data-p1v-sirka")), PREDPONA));
  });
  const tlacidla = [].slice.call(sek.querySelectorAll(".vfar [data-p1v-farba]"));
  const nazov = sek.querySelector("[data-p1v-farba-nazov]");
  // vzorka farby na tlačidle: koža a šitie z tej istej mapy ako kresba (žiadne hex dvakrát)
  tlacidla.forEach((b) => {
    const c = FARBY_KRESBY[b.getAttribute("data-p1v-farba")];
    if (c) { b.style.setProperty("--p1v-fk", c.koza); b.style.setProperty("--p1v-fs", c.sitie); }
  });
  function zvol(b) {
    const k = nastavFarbuKresby(sek, b ? b.getAttribute("data-p1v-farba") : PREDVOLENA);
    tlacidla.forEach((x) => x.setAttribute("aria-pressed", String(x.getAttribute("data-p1v-farba") === k)));
    const zvolene = tlacidla.find((x) => x.getAttribute("data-p1v-farba") === k);
    if (nazov && zvolene) nazov.textContent = zvolene.getAttribute("title") || zvolene.textContent.trim();
  }
  zvol(tlacidla.find((x) => x.getAttribute("aria-pressed") === "true"));
  tlacidla.forEach((b) => b.addEventListener("click", () => zvol(b)));
}
