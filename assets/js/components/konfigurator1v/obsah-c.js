// Nový vzhľad 1V — obsah pod konfigurátorom, SKUPINA C: kam siahajú + výzva, čo príde domov, časová os + výzva, farby, vzorky.
// VLASTNÍK: worker skupiny C (+ admin-html/src/p1v-598/3x-c-*.sk.html, assets/css/_lcd1v-obsah-c.scss,
// tools/test-1v/obsah-c.mjs, nové obrázky assets/img/1v/obsah/c-*). Pravidlá: docs/1v-obsah.md.
//
// HTML sekcií je statické (admin); tento modul ho len OŽIVÍ (animácie, posun, video pri zobrazení). Nič nekreslí
// a nič zo živého DOM nemaže. Volá ho obsah.js pod body.lcd-1v, keď sú korene obsahu na stránke.
// oc = { ctx, korene, koren (multi-koreň pre lxModulyOziv), miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn),
//        nacitajMedia(el), ked, na, vysli }. Sekcia, ktorá je ešte stub, nie je v DOM: oc.sekcia(meno) === null.
//
//   všetky        reveal .rv ako titulka: čo je vo výreze alebo nad ním hneď, zvyšok pri zobrazení. CSS skrýva .rv až pod
//                 .p1v-rv na obale sekcie (bez JS / pri chybe je všetko viditeľné).
//   c-casova-os   os sa plní podľa scrollu (--p na .tml) a číslo kroku sa rozsvieti (li.on), keď k nemu dôjde čítanie
//                 (62 % výšky okna, ako návrh). Pri prefers-reduced-motion je os hneď plná. Mimo obrazovky nič nepočíta.
//   c-farby       modul titulky lx-farby: lxModulyOziv len na tejto sekcii (klik na vzorku prepne fotku; fotka sa stiahne
//                 až pri nabehnutí/dotyku/kliku — preto sa tu NEVOLÁ oc.nacitajMedia).
//   výzvy .spat   href="#product-detail-form" — plynulý posun na konfigurátor robí skupina D pre celý obsah.
import { lxModulyOziv } from "../../lcdHomeModuly.js";
import { lcdMultiKoren } from "../../functions/lcdOziv.js";

export const MENO = "obsah-c";
export const SEKCIE_C = ["c-kam", "c-domov", "c-casova-os", "c-farby", "c-vzorky"];

const pohyb = () => !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

/** @param {object} oc spoločný kontext obsahu (obsah.js) */
export function init(oc) {
  const sekcie = SEKCIE_C.map((m) => oc.sekcia(m)).filter(Boolean);
  if (!sekcie.length) return;
  const os = oc.sekcia("c-casova-os");
  if (os) casovaOs(os, oc);
  const farby = oc.sekcia("c-farby");
  if (farby) lxModulyOziv(lcdMultiKoren([farby]), oc.ctx && oc.ctx.jazyk === "cs");
}

/** Časová os: --p (0–1) = koľko osi je „prečítanej“, li.on = krok, ku ktorému došla čiara čítania (62 % okna). */
function casovaOs(sek, oc) {
  const tml = sek.querySelector(".tml");
  if (!tml) return;
  const kroky = Array.prototype.filter.call(tml.children, (k) => k.tagName === "LI");
  const nastav = (p, stav) => {
    tml.style.setProperty("--p", String(p));
    kroky.forEach((k, i) => k.classList.toggle("on", stav(k, i)));
  };
  if (!pohyb()) { nastav(1, () => true); return; }
  let caka = false;
  let blizko = typeof IntersectionObserver !== "function";
  const kresli = () => {
    caka = false;
    const r = tml.getBoundingClientRect();
    if (!r.height) return;
    const ciara = window.innerHeight * 0.62;
    nastav(Math.max(0, Math.min(1, (ciara - r.top) / r.height)).toFixed(4), (k) => {
      const c = k.querySelector("i");
      if (!c) return false;
      const kr = c.getBoundingClientRect();
      return kr.top + kr.height / 2 <= ciara;
    });
  };
  const naplanuj = () => { if (blizko && !caka) { caka = true; requestAnimationFrame(kresli); } };
  if (!blizko) {
    // scroll sa počíta len keď je os pri obrazovke; pri odchode sa stav dopočíta (nad oknom = plná, pod oknom = prázdna)
    const io = new IntersectionObserver((z) => {
      blizko = z.some((x) => x.isIntersecting);
      caka = false;
      kresli();
    }, { rootMargin: "50% 0px 50% 0px" });
    io.observe(tml);
  }
  window.addEventListener("scroll", naplanuj, { passive: true });
  window.addEventListener("resize", naplanuj, { passive: true });
  kresli();
  void oc;
}
