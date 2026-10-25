// Nový vzhľad 1V — obsah pod konfigurátorom, SKUPINA C: kam siahajú + výzva, čo príde domov, časová os + výzva, farby, vzorky.
// VLASTNÍK: worker skupiny C (+ admin-html/src/p1v-598/3x-c-*.sk.html, assets/css/_lcd1v-obsah-c.scss,
// tools/test-1v/obsah-c.mjs, nové obrázky assets/img/1v/obsah/c-*). Pravidlá: docs/1v-obsah.md.
// Pre všetky skupiny obsahu (T0.3): sekcie C nájde podľa mena v ktoromkoľvek kľúči (598, dvoj, classic, premium,
// boxy); sekcia, ktorá v skupine nie je (stub alebo ju návrh nemá), sa preskočí.
//
// HTML sekcií je statické (admin); tento modul ho len OŽIVÍ (animácie, posun, video pri zobrazení). Nič nekreslí
// a nič zo živého DOM nemaže. Volá ho obsah.js pod body.lcd-1v, keď sú korene obsahu na stránke. Od 25. 10. 2026
// (rýchlosť) po sekciách, keď sa sekcia priblíži k oknu: oc.sekcia vráti len tú jednu, init teda môže prísť viackrát.
// oc = { ctx, korene, koren (multi-koreň pre lxModulyOziv), miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn),
//        nacitajMedia(el), ked, na, vysli }. Sekcia, ktorá je ešte stub, nie je v DOM: oc.sekcia(meno) === null.
//
//   všetky        reveal .rv ako titulka: čo je vo výreze alebo nad ním hneď, zvyšok pri zobrazení. CSS skrýva .rv až pod
//                 .p1v-rv na obale sekcie (bez JS / pri chybe je všetko viditeľné).
//   c-casova-os   os sa plní podľa scrollu (--p na .tml) a číslo kroku sa rozsvieti (li.on), keď k nemu dôjde čítanie
//                 (62 % výšky okna, ako návrh). Pri prefers-reduced-motion je os hneď plná. Mimo obrazovky nič nepočíta.
//   c-farby       modul titulky lx-farby: lxModulyOziv len na tejto sekcii (klik na vzorku prepne fotku; fotka sa stiahne
//                 až pri nabehnutí/dotyku/kliku — preto sa tu NEVOLÁ oc.nacitajMedia).
//                 Produkt iného vzoru než Diamond (610/613, 622/625, 631/634; integrácia 14. 10. 2026): statické HTML má vzorky
//                 Diamond Line (jeden obsah pre celý typ). Keď sú VŠETKY vzorky sekcie Diamond Line, pred oživením sa prestavia
//                 z farieb tohto produktu (živý krok Farba: názov z kroky.js data-lcd1v-nazov, fotka = vzorka živého konfigurátora),
//                 „Vzorka · Hexa Line“, počítadlo, úvodná veta o fotkách áut -> veta o vzorke zblízka (schválený návrh boxy.html);
//                 „Mnoho ďalších farieb“ na vlastný konfigurátor sa skryje (všetky farby produktu sú vo vzorkách), odkaz na iný
//                 typ (data-p1v-odkaz) ostáva. Zmiešané vzorky (dvojvrstvové: skutočné fotky rôznych vzorov) sa nemenia.
//   výzvy .spat   href="#product-detail-form" — plynulý posun na konfigurátor robí skupina D pre celý obsah.
import { lxModulyOziv } from "../../lcdHomeModuly.js";
import { lcdMultiKoren } from "../../functions/lcdOziv.js";
import { nazovFarby } from "./kroky.js";

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
  if (farby) {
    farbyVzoru(farby, oc); // pred oživením: lxModulyOziv číta vzorky a fotky pri init
    lxModulyOziv(lcdMultiKoren([farby]), oc.ctx && oc.ctx.jazyk === "cs");
  }
}

/** Mená vzorov podľa registra (produkty.js vzor). */
export const VZOR_MENO = { diamond: "Diamond Line", stripe: "Stripe Line", hexa: "Hexa Line" };
/** Úvodná veta sekcie, keď sú fotky vzorky materiálu (nie autá) — doslovne zo schváleného návrhu boxy.html. */
export const VETA_VZORKY = "Vyberte vzorku a pozrite si materiál aj prešívanie zblízka.";
const dve = (n) => String(n).padStart(2, "0");

/** Farby tohto produktu zo živého kroku Farba: [{ nazov „Čierna · červené šitie“, src vzorky }] v poradí konfigurátora. */
export function farbyProduktu(ctx) {
  const krok = ctx && ctx.krok ? ctx.krok("farba") : null;
  if (!krok) return [];
  return Array.prototype.map.call(krok.querySelectorAll(".options-wrap > .option-button"), (b) => {
    const img = b.querySelector("img");
    const src = img ? img.getAttribute("src") || "" : "";
    const n = b.getAttribute("data-lcd1v-nazov") || nazovFarby((b.querySelector(".text") || b).textContent).nazov;
    return src && n ? { nazov: n.replace(/\s*\/\s*/g, " · "), src } : null;
  }).filter(Boolean);
}

/** c-farby na Hexa/Stripe: vzorky Diamond Line -> farby tohto produktu (pozri hlavičku súboru). Vráti true, keď prestavala. */
export function farbyVzoru(sek, oc) {
  const ctx = oc && oc.ctx;
  const vzor = ctx && ctx.produkt ? ctx.produkt.vzor : null;
  const meno = VZOR_MENO[vzor];
  if (!meno || vzor === "diamond") return false;
  const vzorky = Array.prototype.slice.call(sek.querySelectorAll(".lx-farby-vzorka"));
  if (!vzorky.length || !vzorky.every((v) => v.getAttribute("data-vzor") === VZOR_MENO.diamond)) return false;
  const farby = farbyProduktu(ctx);
  const velka = sek.querySelector(".lx-farby-velka");
  const skupina = sek.querySelector(".lx-farby-vzorky");
  if (!farby.length || !velka || !skupina) return false; // bez farieb produktu nič (radšej pôvodná sekcia než prázdna)
  // veľké fotky: prvá hneď, ostatné až pri výbere (data-src ako v statickom HTML)
  const stitok = velka.querySelector(".lx-farby-stitok");
  Array.prototype.slice.call(velka.querySelectorAll(":scope > img")).forEach((i) => i.parentNode.removeChild(i));
  farby.forEach((f, i) => {
    const im = document.createElement("img");
    if (i === 0) { im.className = "on"; im.setAttribute("src", f.src); } else im.setAttribute("data-src", f.src);
    im.alt = f.nazov + " · " + meno;
    im.decoding = "async";
    im.loading = "lazy";
    velka.insertBefore(im, stitok);
  });
  const cislo = sek.querySelector(".lx-farby-cislo");
  if (cislo) cislo.textContent = "01";
  const spolu = sek.querySelector(".lx-farby-stitok > span:last-child");
  if (spolu) spolu.textContent = " / " + dve(farby.length);
  const vzorN = sek.querySelector(".lx-farby-vzor-n");
  if (vzorN) vzorN.textContent = (vzorN.textContent.split("·")[0].trim() || "Vzorka") + " · " + meno;
  const menoEl = sek.querySelector(".lx-farby-meno");
  if (menoEl) menoEl.textContent = farby[0].nazov;
  // vzorky: nové tlačidlá na mieste starých (pred „Mnoho ďalších farieb“)
  const viac = skupina.querySelector(".lx-farby-viac");
  vzorky.forEach((v) => v.parentNode.removeChild(v));
  farby.forEach((f, i) => {
    const b = document.createElement("button");
    b.className = "lx-farby-vzorka";
    b.type = "button";
    b.setAttribute("data-i", String(i));
    b.setAttribute("data-vzor", meno);
    b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    b.setAttribute("aria-label", f.nazov + ", " + meno);
    const im = document.createElement("img");
    im.setAttribute("src", f.src);
    im.alt = "";
    im.width = 68;
    im.height = 68;
    im.decoding = "async";
    im.loading = "lazy";
    b.appendChild(im);
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = f.nazov;
    b.appendChild(sr);
    skupina.insertBefore(b, viac || null);
  });
  if (viac) {
    if (viac.hasAttribute("data-p1v-odkaz")) viac.style.gridColumn = "span " + ((7 - (farby.length % 7 || 7)) || 7);
    else { viac.hidden = true; viac.style.setProperty("display", "none", "important"); } // všetky farby produktu sú vo vzorkách
  }
  // úvodná veta: fotky sú teraz vzorky materiálu, nie autá -> veta zo schváleného návrhu boxy.html (druhá veta ostáva)
  const lede = sek.querySelector(".lx-hlava .lx-p");
  if (lede && /^Vyberte vzorku a pozrite si [^.]*\./.test(lede.textContent.trim())) lede.textContent = lede.textContent.trim().replace(/^Vyberte vzorku a pozrite si [^.]*\./, VETA_VZORKY);
  sek.setAttribute("data-p1v-farby", vzor);
  return true;
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
    // Michal 25. 10. 2026 (rýchlosť): najprv polohy všetkých čísel, potom triedy (li.on mení len farby čísla, nie
    // rozloženie — výsledok je ten istý, bez prepočítania štýlov pri každom kroku)
    const zapnute = kroky.map((k) => {
      const c = k.querySelector("i");
      if (!c) return false;
      const kr = c.getBoundingClientRect();
      return kr.top + kr.height / 2 <= ciara;
    });
    nastav(Math.max(0, Math.min(1, (ciara - r.top) / r.height)).toFixed(4), (k, i) => zapnute[i]);
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
