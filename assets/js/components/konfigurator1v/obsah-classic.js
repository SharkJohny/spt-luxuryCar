// Nový vzhľad 1V — obsah pod konfigurátorom, MODUL TYPU „classic“ (rohož do kufra Classic 619/622/625). T2.3 (14. 10. 2026).
// VLASTNÍK: T2.3 (+ admin-html/src/p1v-classic/*, assets/css/_lcd1v-obsah-classic.scss, tools/test-1v/obsah-classic.mjs,
// assets/img/1v/obsah/classic-*). Spec: $P/navrh-kufor-classic.md §6. Pravidlá: docs/1v-obsah.md.
//
// obsah.js ho volá pod body.lcd-1v PO skupinách A–D, len na produktoch s kľúčom obsahu „classic“ (produkty.js -> obsah).
// Spoločné sekcie (referencie, galéria, recenzie, osem vecí, materiál, porovnanie, pred a po, kam, domov, časová os, FAQ, záver, okno…)
// oživujú A–D podľa mena data-lcd-sekcia a nové komponenty typu (classic-premium .kc-cmp, classic-box .ups) sú čisté HTML + CSS,
// takže tu ostáva jediná vec: vzorky farieb (c-farby), ktoré aktuálny produkt nemá.
//   c-farby  Sekcia ukazuje vzorky Diamond Line (spoločné HTML pre 619/622/625). Hexa (622) má len 3 čierne farby, Stripe (625)
//            8 — vzorky, ktoré produkt v konfigurátore nemá (podľa ctx.moznosti("farba")), sa skryjú (atribút hidden, DOM ostáva),
//            počítadlo „01 / 09“ sa prepočíta a „Mnoho ďalších farieb“ sa ukáže len keď produkt má aspoň 3 ďalšie farby.
//            Zhoda podľa názvu farby (nazovFarby z kroku Farba: „Čierna / červené šitie“, „Béžová“…). Keď sa nič nezhodne alebo
//            prvá vzorka chýba, sekcia ostane taká, aká je (radšej všetky vzorky než prázdna sekcia).
//   d-faq    Odpovede FAQ 9, 10 a 11 majú ceny ako v návrhu. Veta s cenami (data-cl-ceny) sa ukáže, až keď sú zistené VŠETKY jej čísla; dovtedy a pri
//            nezistenej cene platí veta bez cien (data-cl-bez) hneď pred ňou. FAQ 9 a 10 majú čísla cez data-p1v-cislo (dosadí ich obsah-cisla.js),
//            FAQ 11 potrebuje cenu Classic vo všetkých troch vzoroch (kľúč jadra pozná len vzor tohto produktu) -> data-cl-cena="diamond|stripe|hexa",
//            cenu zistí tento modul z ceny-ine.js (cenaTypu: GET sesterskej stránky, 24 h cache) a naformátuje formatCena z obsah-cisla.js.
// Čísla a odkazy závislé od vzoru inak dosadí obsah-cisla.js (data-p1v-cislo / data-p1v-odkaz), nie tento modul.
// Len export function init(oc); pri importe nič nebeží; nič zo živého DOM nemazať, žiadny POST (ceny sesterských stránok len cez ceny-ine.js = GET), ceny ani ID natvrdo.
// oc = { ctx, kluc, korene, koren, miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el),
//        ked, na, vysli }; sekcia, ktorá je stub, nie je v DOM: oc.sekcia(meno) === null.
import { nazovFarby } from "./kroky.js";
import { cenaTypu } from "./ceny-ine.js";
import { formatCena } from "./obsah-cisla.js";

export const MENO = "obsah-classic";

/** Najmenej toľko ďalších farieb (nad vzorkami) musí produkt mať, aby sa ukázalo „Mnoho ďalších farieb“. */
export const MIN_DALSICH_FARIEB = 3;

const pole = (x) => Array.prototype.slice.call(x || []);
const dve = (n) => String(n).padStart(2, "0");
/** „Čierna · červené šitie“ / „Čierna / červené šitie“ -> „cierna cervene sitie“ (bez diakritiky, bez oddeľovačov) */
const kluc = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\/·]/g, " ").replace(/\s+/g, " ").trim();

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  const farby = oc.sekcia("c-farby");
  if (farby) vzorkyProduktu(farby, oc);
  const faq = oc.sekcia("d-faq");
  if (faq) faqCeny(faq, oc);
}

/** Vety s cenami vo FAQ: blok data-cl-ceny nahradí vetu data-cl-bez, keď sú zistené všetky čísla v bloku (inak ostane veta bez cien). */
function faqCeny(sek, oc) {
  const trh = oc.ctx.trh;
  const vzory = {};
  const cenaVzoru = (vzor) => (vzory[vzor] = vzory[vzor] || cenaTypu(oc.ctx.projectId, "kufor-classic", vzor).then((c) => formatCena(c, trh)).catch(() => null));
  pole(sek.querySelectorAll("[data-cl-ceny]")).forEach((blok) => {
    const pred = blok.previousElementSibling;
    const bez = pred && pred.hasAttribute("data-cl-bez") ? pred : null;
    const vlastne = pole(blok.querySelectorAll("[data-cl-cena]"));
    const jadro = pole(blok.querySelectorAll("[data-p1v-cislo]"));
    const ukaz = () => { blok.setAttribute("data-cl-stav", "ok"); if (bez) bez.hidden = true; };
    Promise.all(vlastne.map((el) => cenaVzoru(el.getAttribute("data-cl-cena")).then((t) => { if (t) el.textContent = t; return !!t; })))
      .then((zistene) => {
        if (!zistene.every(Boolean)) return; // niektorá cena sa nezistila: ostane veta bez cien
        if (!jadro.length) { ukaz(); return; }
        // čísla jadra (obsah-cisla.js): počkať, kým nie sú všetky vybavené (ok | bez | skryte); ukázať len keď sú všetky „ok“
        oc.ked(() => {
          const st = jadro.map((el) => el.getAttribute("data-p1v-stav"));
          return st.every((x) => x === "ok" || x === "bez" || x === "skryte") ? (st.every((x) => x === "ok") ? "ok" : "nie") : null;
        }, (v) => { if (v === "ok") ukaz(); }, { limit: 15000 });
      });
  });
}

/** Skryje vzorky farieb, ktoré aktuálny produkt nemá; prepočíta počítadlo a vejár „Mnoho ďalších farieb“. */
function vzorkyProduktu(sek, oc) {
  let moznosti = [];
  try { moznosti = oc.ctx.moznosti("farba"); } catch (e) { moznosti = []; }
  if (!moznosti.length) return;
  const mame = new Set(moznosti.map((o) => kluc(nazovFarby(o.text).nazov)));
  const vzorky = pole(sek.querySelectorAll(".lx-farby-vzorka"));
  const meno = (v) => kluc((v.getAttribute("aria-label") || "").split(", ")[0]);
  const ostanu = vzorky.filter((v) => mame.has(meno(v)));
  if (!ostanu.length || ostanu[0] !== vzorky[0]) return; // nič sa nezhodlo / chýba predvolená vzorka: nechať všetko
  vzorky.forEach((v) => { v.hidden = !ostanu.includes(v); });
  const stitok = sek.querySelector(".lx-farby-stitok > span:last-child");
  if (stitok) stitok.textContent = " / " + dve(ostanu.length);
  // modul titulky píše číslo podľa data-i (poradie v pôvodnej sade) — po kliku ho prepočítame na poradie medzi zostávajúcimi
  const cislo = sek.querySelector(".lx-farby-cislo");
  ostanu.forEach((v, i) => v.addEventListener("click", () => { if (cislo) cislo.textContent = dve(i + 1); }));
  const viac = sek.querySelector(".lx-farby-viac");
  if (viac) {
    const dalsie = moznosti.length - ostanu.length;
    viac.hidden = dalsie < MIN_DALSICH_FARIEB;
    // vejár zaberie zvyšok posledného radu siedmich vzoriek (ako lxModulyOziv pre 9 vzoriek: 5)
    viac.style.gridColumn = "span " + ((7 - (ostanu.length % 7 || 7)) || 7);
  }
}
