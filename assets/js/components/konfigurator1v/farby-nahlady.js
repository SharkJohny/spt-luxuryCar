// Nový vzhľad 1V — zmenšené náhľady fotiek farieb v dlaždiciach (rýchlosť, Michal 25. 10. 2026: „stránky sa majú rýchlo
// načítať aj na pomalých telefónoch“). Dlaždica farby má 42–126 px, ale sťahovala plnú fotku zo Shoptetu
// (/user/documents/upload/assets/config/<slug>.jpg, 400 × 400, 17–70 kB; 601 ~1,4 MB za fotky farieb). Náhľady vyrába
// tools/farby-1v-nahlady.mjs do assets/img/1v/farby/ (CDN), zoznam je vo farby-nahlady-data.js.
//
// Ako (žiadna zmena vzhľadu):
//  - obrazokFarby: dlaždicu farby stavia components/creatButtons.js (živý konfigurátor) LEN pod bránou 1V (rovnaká ako
//    odlozenyObrazok); mimo 1V (?novy=0, iné produkty) aj farba bez náhľadu = pôvodný <img> bez zmeny.
//    <picture class="lcd1v-fn"> (display: contents — rozloženie dlaždice sa nemení) s <source type="image/webp"> a <img>
//    so srcset JPG (Safari 13 bez WebP). src ostáva PLNÁ fotka: kto číta atribút src (veľké náhľady kroky.js, farba2.js,
//    boxy-produkt.js, obsah-c.js, starý productPage.js), dostane ju ako doteraz; pri srcset s w-deskriptorom ju prehliadač
//    pre dlaždicu nesťahuje. Chyba náhľadu (napr. CDN ešte nemá súbor) -> <source> a srcset preč, ukáže sa plná fotka.
//  - nastavVelkyNahlad: veľký náhľad 320 × 320 (kroky.js, farba2.js) ukazuje PLNÚ fotku. Tú už prehliadač nemá v cache
//    (dlaždica stiahla len náhľad) -> kým sa sťahuje, náhľad hneď ukáže obrázok dlaždice (currentSrc), aby nebol prázdny
//    ani s predošlou farbou pod novým názvom; po stiahnutí a dekódovaní ho plná fotka nahradí (rovnaký rám, bez posunu).
//    Rovnaký postup ako okno fotiek obsahu (obsah-d.js, revízia F2). Náhľad má loading="lazy": skrytý v CSS (kroky.js
//    náhľad na boxe 616, ktorý má vlastný) fotku nesťahuje — predtým ju mal zadarmo z cache dlaždice.
//  - malyNahlad: ikonka 28 px „Odporúčame“ (farba2.js) = obrázok dlaždice, nie plná fotka.
//  - CZ (Michal 29. 10. 2026): CZ fotka má slug z českého textu voľby (diamond-barva-kuze-…) a je vlastnou nahrávkou CZ
//    obchodu. ALIASY_FARIEB (generuje tools/farby-1v-nahlady.mjs po overení, že ide o tú istú fotku) ju priradí k SK slugu
//    -> CZ dlaždica dostane rovnaké malé náhľady ako SK; src ostáva CZ plná fotka (veľké náhľady ako doteraz).
import { NAHLADY_FARIEB, SIRKY_NAHLADOV, ALIASY_FARIEB } from "./farby-nahlady-data.js";

const ZAKLAD = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/farby/";
/** Šírka dlaždice (CSS px, horná hranica nameraná 25. 10. 2026 na 320–2560 px). Krok Farba, Farba 2 a box 616: 5 stĺpcov
 *  do 480 px (390 -> 56–58), 7 nad (481 -> 52, 767 -> 90), PC 47–84. Okno boxov: 5 stĺpcov, do ~720 px rastie až na 126 px,
 *  PC 88. Horšia hranica = mäkšia dlaždica, väčšia = zbytočné bajty (iPhone 3× dostane 192 px). */
export const SIZES_DLAZDICA = "(max-width: 480px) calc(20vw - 20px), (max-width: 767px) calc(13.4vw - 10px), 86px";
export const SIZES_OKNO_BOXOV = "(max-width: 480px) calc(20vw - 14px), (max-width: 767px) 18vw, 90px";
// plná fotka: kópia úložiska webu v CDN repa …/img/ulozisko/<web>/config/<slug>[~odtlačok].jpg (functions/ulozisko.js, od
// 29. 10. 2026) alebo záloha z úložiska …/upload/assets/config/<slug>.jpg (farba, ktorá v repe ešte nie je)
const RE_ZDROJ = /\/config\/([a-z0-9-]+)(?:~[0-9a-f]{8})?\.jpg(?:[?#&]|$)/;
const ma = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** Slug náhľadov fotky farby (z adresy plnej fotky; CZ slug cez ALIASY_FARIEB na SK slug tej istej fotky), inak null. */
export function slugFarby(src) {
  const m = RE_ZDROJ.exec(String(src || ""));
  if (!m) return null;
  if (ma(NAHLADY_FARIEB, m[1])) return m[1];
  const sk = ma(ALIASY_FARIEB, m[1]) ? ALIASY_FARIEB[m[1]] : null;
  return sk && ma(NAHLADY_FARIEB, sk) ? sk : null;
}

const adresa = (slug, w, pripona) => ZAKLAD + slug + "-" + NAHLADY_FARIEB[slug] + "-w" + w + "." + pripona;
const srcset = (slug, pripona) => SIRKY_NAHLADOV.map((w) => adresa(slug, w, pripona) + " " + w + "w").join(", ");

/**
 * Obrázok dlaždice farby pod 1V: <picture class="lcd1v-fn"> s náhľadmi, alebo null (farba nemá náhľad -> volajúci
 * postaví pôvodný <img>). src = plná fotka (adresa ako doteraz), nastaví sa posledná. vOkneBoxov = väčšie dlaždice.
 */
export function obrazokFarby(src, alt, vOkneBoxov) {
  const slug = slugFarby(src);
  if (!slug || typeof document === "undefined") return null;
  const sizes = vOkneBoxov ? SIZES_OKNO_BOXOV : SIZES_DLAZDICA;
  const pic = document.createElement("picture");
  pic.className = "lcd1v-fn";
  const so = document.createElement("source");
  so.setAttribute("type", "image/webp");
  so.setAttribute("sizes", sizes);
  so.setAttribute("srcset", srcset(slug, "webp"));
  pic.appendChild(so);
  const img = document.createElement("img");
  img.setAttribute("alt", alt || "");
  img.setAttribute("decoding", "async");
  img.setAttribute("sizes", sizes);
  img.setAttribute("srcset", srcset(slug, "jpg"));
  img.setAttribute("data-lcd1v-nahlad", slug);
  pic.appendChild(img);
  // náhľad sa nenačítal (súbor ešte nie je na CDN, sieť): späť na plnú fotku. Globálny handler v productPage.js (capture
  // na window) medzitým skúsi src + časovú značku — vrátime pôvodnú adresu (cache), pri chybe plnej fotky už nič.
  img.addEventListener("error", function () {
    if (!img.hasAttribute("srcset")) return;
    if (so.parentNode) so.parentNode.removeChild(so);
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.setAttribute("src", src);
  });
  img.setAttribute("src", src); // posledné: výber kandidáta už vidí <source> aj srcset
  return pic;
}

const MA_URL = typeof URL === "function";
function absolutna(u) {
  if (!u) return "";
  try { return MA_URL ? new URL(u, document.baseURI).href : u; } catch (e) { return ""; }
}

/** Obrázok, ktorý dlaždica už ukazuje (náhľad z cache), ak je iný ako plná fotka; inak "". */
function obrazokDlazdice(dlazdica, plna) {
  if (!dlazdica || !dlazdica.complete || !(dlazdica.naturalWidth > 0)) return "";
  const c = dlazdica.currentSrc || "";
  return c && c !== absolutna(plna) ? c : "";
}

const stahuje = new Map(); // adresa -> Image, kým sa plná fotka sťahuje (potom je v cache prehliadača)
function plnaFotka(url) {
  let im = stahuje.get(url);
  if (im) return im;
  im = new Image();
  im.decoding = "async";
  im.src = url;
  if (im.complete && im.naturalWidth > 0) return im;
  stahuje.set(url, im);
  const hotovo = () => { stahuje.delete(url); };
  im.addEventListener("load", hotovo, { once: true });
  im.addEventListener("error", hotovo, { once: true });
  return im;
}

/**
 * Veľký náhľad farby (img 320 × 320 v kroku): src = plná fotka dlaždice (atribút src, ako doteraz). Kým sa sťahuje, ukáže
 * obrázok dlaždice (srcset s jedným kandidátom; src prehliadač vtedy z tohto <img> nesťahuje), potom srcset zruší.
 * Rovnaká plná fotka ako minule -> nič (volá sa pri každom obnovení stavu).
 */
export function nastavVelkyNahlad(velky, dlazdica) {
  const plna = dlazdica ? dlazdica.getAttribute("src") : "";
  if (!velky || !plna || velky.getAttribute("src") === plna) return;
  if (velky.getAttribute("loading") !== "lazy") velky.setAttribute("loading", "lazy"); // pred src
  // nevykreslený náhľad (display: none v CSS, zatvorený rodič): len src — lazy obrázok sa stiahne až keď ho vidno
  const vidno = velky.getClientRects().length > 0;
  const docasny = vidno ? obrazokDlazdice(dlazdica, plna) : "";
  const p = docasny ? plnaFotka(absolutna(plna)) : null;
  if (p && !(p.complete && p.naturalWidth > 0)) {
    velky.setAttribute("sizes", "320px");
    velky.setAttribute("srcset", docasny + " 320w");
    velky.setAttribute("src", plna);
    const vymen = () => {
      if (velky.getAttribute("src") !== plna || velky.getAttribute("srcset") !== docasny + " 320w") return; // medzitým iná farba
      velky.removeAttribute("srcset");
      velky.removeAttribute("sizes");
    };
    // chyba plnej fotky: ostane obrázok dlaždice (lepší ako prázdny rám)
    p.addEventListener("load", () => {
      if (p.decode) p.decode().then(vymen, vymen);
      else vymen();
    }, { once: true });
    return;
  }
  if (velky.hasAttribute("srcset")) {
    velky.removeAttribute("srcset");
    velky.removeAttribute("sizes");
  }
  velky.setAttribute("src", plna);
}

/** Malá ikonka farby (28 px): obrázok dlaždice z cache, inak najmenší JPG náhľad, inak plná fotka. */
export function malyNahlad(dlazdica) {
  const plna = dlazdica ? dlazdica.getAttribute("src") : "";
  if (!plna) return "";
  const c = obrazokDlazdice(dlazdica, plna);
  if (c) return c;
  const slug = slugFarby(plna);
  return slug ? adresa(slug, SIRKY_NAHLADOV[0], "jpg") : plna;
}
