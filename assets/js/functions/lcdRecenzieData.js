// Načítanie dát recenzií z Google (window.LCD_REVIEWS) — jedno miesto pre widget lcd-reviews (main.js googleReviews),
// sekciu 1V „Hodnotenia priamo z Google“ (obsah-a.js), riadok „5,0 ★ N recenzií“ (cena.js, kamión) a titulku
// (lcdHpRecenzie.js). Súbor sa stiahne najviac raz na stránku, aj keď ho pýta viac častí.
//
// Michal 29. 10. 2026: nové recenzie na web bez prepínania verzie v admine. Najprv SPOLOČNÝ súbor
// assets/data/reviews-data.js — automatika recenzií ho aktualizuje (production.yml, krok „Recenzie na spoločnú adresu“,
// len vetva main a len novšie dáta). CDN aj prehliadač kešujú 1 rok, preto sa adresa mení každých 6 h (?h=): nové
// recenzie sú na webe najneskôr do 6 h. Keď spoločný súbor nepríde alebo je pokazený, záloha = reviews-data.js tejto
// verzie (stav z času nasadenia; LCD_ZAKLAD = priečinok verzie).
import { LCD_ZAKLAD } from "./lcdZaklad.js";

export const RECENZIE_SPOLOCNE = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/data/reviews-data.js";
/** Verzia reviews-data.js + lcd-reviews.js v adrese (?v=, cache 1 rok) — pri zmene ktoréhokoľvek zvýš. */
export const RECENZIE_WV = "10";

/** Dáta sú použiteľné: hodnotenie a počet profilu + aspoň jedna recenzia. */
export function platneRecenzie(d) {
  return !!(d && d.place && Number(d.place.totalReviews) > 0 && Array.isArray(d.reviews) && d.reviews.length);
}

let sluby = null;

/** Promise s window.LCD_REVIEWS (null, keď neprišiel ani spoločný súbor, ani záloha). Idempotentné. */
export function nacitajRecenzie() {
  if (sluby) return sluby;
  sluby = new Promise(function (hotovo) {
    if (platneRecenzie(window.LCD_REVIEWS)) { hotovo(window.LCD_REVIEWS); return; }
    const skript = function (src, zaloha) {
      const d = document.createElement("script");
      d.src = src;
      d.onload = function () {
        if (platneRecenzie(window.LCD_REVIEWS)) hotovo(window.LCD_REVIEWS);
        else if (zaloha) skript(zaloha, null);
        else hotovo(null);
      };
      d.onerror = function () {
        if (d.parentNode) d.parentNode.removeChild(d);
        if (zaloha) skript(zaloha, null);
        else hotovo(null);
      };
      (document.body || document.head).appendChild(d);
    };
    skript(RECENZIE_SPOLOCNE + "?h=" + Math.floor(Date.now() / 216e5), LCD_ZAKLAD + "js/reviews-data.js?v=" + RECENZIE_WV);
  });
  return sluby;
}
