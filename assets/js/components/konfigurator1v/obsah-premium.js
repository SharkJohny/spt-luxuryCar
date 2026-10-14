// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „premium“ (rohož do kufra Premium 628/631/634).
// VLASTNÍK: T2.4 (+ admin-html/src/p1v-premium/*, assets/css/_lcd1v-obsah-premium.scss, tools/test-1v/obsah-premium.mjs,
// assets/img/1v/obsah/premium-*). Spec: $P/navrh-kufor-premium.md §6 (#kryje mapa krytia, porovnanie Premium/Classic). Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „premium“ (produkty.js -> obsah).
// Oživuje len sekcie, ktoré A–D nepoznajú (nové komponenty typu). Spoločné sekcie (referencie, galéria, recenzie,
// vecí, materiál, časová os, farby, FAQ, okno…) oživujú A–D podľa mena data-lcd-sekcia — tu ich neduplikovať.
// Čísla a odkazy závislé od vzoru dosadí obsah-cisla.js (data-p1v-cislo / data-p1v-odkaz), nie tento modul.
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny fetch/POST, ceny ani ID natvrdo.
// oc = { ctx, kluc, korene, koren, miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el),
//        ked, na, vysli }; sekcia, ktorá je stub, nie je v DOM: oc.sekcia(meno) === null.
//
// premium-kryje — „Čo všetko rohož Premium kryje“ (návrh kufor-premium.html r. 4971–4992):
//   .kryv-f[data-z] = zvolená plocha (vsetko | dno | boky | operadla); SVG zóny na fotke sa podľa nej rozsvietia v CSS.
//   Klik na .kz[data-z] ju nastaví a označí tlačidlo (.on, aria-pressed). Na PC (hover:hover + pointer:fine) ju
//   rozsvieti aj prechod myšou; po odchode myši sa vráti zvolená. Nič neodosiela, nič z DOM nemaže.
// d-faq: čísla v odpovediach (data-p1v-cislo) dosadí obsah-cisla.js; v zbalenej odpovedi ich skrýva visibility:hidden odpovede
//   (dedia ho, takže ich ani čítačky nečítajú) — od integrácie WB 14. 10. 2026 bez vlastnej obchádzky.
export const MENO = "obsah-premium";

/** povolené hodnoty data-z (ostatné ignorovať) */
const PLOCHY = ["vsetko", "dno", "boky", "operadla"];

const pole = (x) => Array.prototype.slice.call(x || []);

/** Mapa krytia: klik (a na PC aj prechod myšou) na tlačidlo plochy nastaví data-z na fotke. */
function kryje(sek) {
  const foto = sek.querySelector(".kryv-f");
  const zoznam = sek.querySelector(".kryv-l");
  if (!foto || !zoznam) return;
  const tlacidla = pole(zoznam.querySelectorAll(".kz[data-z]"));
  if (!tlacidla.length) return;
  const plocha = (b) => {
    const z = b && b.getAttribute("data-z");
    return PLOCHY.indexOf(z) >= 0 ? z : null;
  };
  const zvolene = () => tlacidla.find((b) => b.classList.contains("on")) || null;
  const nastav = (z) => foto.setAttribute("data-z", z || "vsetko");

  zoznam.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest(".kz[data-z]") : null;
    const z = plocha(b);
    if (!b || !z || !zoznam.contains(b)) return;
    tlacidla.forEach((x) => {
      const on = x === b;
      x.classList.toggle("on", on);
      x.setAttribute("aria-pressed", on ? "true" : "false");
    });
    nastav(z);
  });

  // PC s myšou: plocha sa rozsvieti aj po prejdení; po odchode späť na zvolenú
  if (typeof matchMedia === "function" && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    zoznam.addEventListener("mouseover", (e) => {
      const b = e.target && e.target.closest ? e.target.closest(".kz[data-z]") : null;
      const z = plocha(b);
      if (b && z && zoznam.contains(b)) nastav(z);
    });
    zoznam.addEventListener("mouseleave", () => nastav(plocha(zvolene())));
  }
}

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  const sek = oc.sekcia("premium-kryje");
  if (sek) kryje(sek);
  // premium-porovnanie: len reveal .rv (spoločne robí obsah.js); ceny a odkaz na Classic dosadzuje obsah-cisla.js
}
