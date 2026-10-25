// Nový vzhľad 1V — fotky kusu obsahu z Popisu produktu do <picture> so zmenšeným WebP (Michal 25. 10. 2026, rýchlosť:
// stránky sa majú rýchlo načítať aj na pomalých telefónoch; docs/1v-rychlost.md).
//
// Krok 2 spustenia: v poli Popis je kus 1 postavený `build-admin-html.mjs --bez-webp` (limit poľa, TinyMCE) — fotky v ňom
// sú plné JPG. Kus 2 prichádza z CDN (dist) už s obalmi <picture>. Build zapíše do bundla mapu obalov kusu 1
// (obsah-webp-mapa.js, generovaná, --check ju stráži): data-lcd-v kusu bez obalov + pre každú obalenú fotku meno JPG,
// poradie medzi <img> s tým istým src, šírky WebP, sizes a media. obsah.js (cesta a) volá obalWebp(koreň) SYNCHRÓNNE pri
// umiestnení kusu z DOM, ešte kým je koreň skrytý (display:none za bránou) — fotky s loading="lazy" sa dovtedy
// nesťahujú, takže prehliadač pri zobrazení rovno vyberie WebP (žiadne čakanie na sieť, žiadna druhá požiadavka).
// Výsledný DOM je ten istý ako dist z CDN: <picture><source type="image/webp" srcset sizes [media]><img …></picture>,
// <img> sa len presunie do obalu (atribúty bez zmeny). <picture> má v CSS display:contents (_lcd1v-obsah.scss 2c), takže
// rozloženie sa nemení (žiadny posun). Nič sa neobalí, keď: kus nemá mapu, data-lcd-v kusu nesedí s mapou (Popis z inej
// verzie), prehliadač nemá natívne lazy načítanie (JPG už sťahuje od parsovania — obal by pridal WebP navyše), fotka na
// tom mieste nemá to meno, je už v <picture>, má srcset / data-src, alebo je už stiahnutá.
import { ZAKLAD, MEDIA, SIZES, KUSY } from "./obsah-webp-mapa.js";

/** Natívne lazy načítanie <img> (Chrome 77+, Firefox 75+, Safari 15.4+). */
function maLazy() {
  return typeof HTMLImageElement !== "undefined" && "loading" in HTMLImageElement.prototype;
}

/**
 * Obalí fotky kusu z Popisu do <picture> s WebP podľa mapy z buildu.
 * @param {Element} koren koreň kusu [data-lcd-cast="p1v-<kľúč>-<n>"] z DOM
 * @returns {number|string} počet obalených fotiek, alebo dôvod, prečo nič: "bez mapy" | "iná verzia" | "bez lazy"
 */
export function obalWebp(koren) {
  const cast = (koren && koren.getAttribute && koren.getAttribute("data-lcd-cast")) || "";
  const m = Object.prototype.hasOwnProperty.call(KUSY, cast) ? KUSY[cast] : null;
  if (!m) return "bez mapy";
  if (koren.getAttribute("data-lcd-v") !== m.v) return "iná verzia";
  if (!maLazy()) return "bez lazy";
  // <img> kusu podľa src v poradí dokumentu (TinyMCE môže zmazať <img> bez src — poradie ostatných sa tým neposunie)
  const podlaSrc = {};
  Array.prototype.forEach.call(koren.querySelectorAll("img"), (img) => {
    const s = img.getAttribute("src");
    if (s) (podlaSrc[s] || (podlaSrc[s] = [])).push(img);
  });
  let n = 0;
  m.f.forEach(([meno, poradie, sirky, si, s2]) => {
    const img = (podlaSrc[ZAKLAD + meno + ".jpg"] || [])[poradie];
    const rodic = img && img.parentNode;
    if (!rodic || rodic.nodeName === "PICTURE" || img.hasAttribute("srcset") || img.hasAttribute("data-src")) return;
    if (img.complete && img.naturalWidth) return; // JPG už je stiahnutý — nechať ho
    const pic = document.createElement("picture");
    const zdroj = document.createElement("source");
    zdroj.setAttribute("type", "image/webp");
    zdroj.setAttribute("srcset", sirky.map((w) => ZAKLAD + meno + "-w" + w + ".webp " + w + "w").join(", "));
    zdroj.setAttribute("sizes", SIZES[si]);
    if (s2) zdroj.setAttribute("media", MEDIA);
    pic.appendChild(zdroj);
    // obal najprv s <source>, až potom doň <img>: výber zdroja pri presune už vidí WebP
    rodic.insertBefore(pic, img);
    pic.appendChild(img);
    n++;
  });
  return n;
}
