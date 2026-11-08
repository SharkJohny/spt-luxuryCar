// Krok Druhá vrstva pri triede V (Michal 7. 11. 2026: „druhu vrstvu spravit rovnako ako pri zakladnom produkte aj s videom“).
// Rovnaké triedy, texty aj video ako v druha-vrstva.js (_lcd1v-druha.scss, typy/jedno.js). Modul tam je viazaný na prenos na
// dvojvrstvový produkt, tu sa druhá vrstva vyberá priamo v tomto produkte, preto vlastné, kratšie oživenie.
import { TYP } from "../typy/jedno.js";
import { jeCz, t } from "./trh.js";

const IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/";
export const T = TYP.texty.druha;
/** CZ texty karty: ctx.produkt.texty.druha z hlavného balíka (produkty.js ich na CZ preloží ako na autokobercoch, texty-cz.js),
 *  app.js ich odovzdá cez nastavTextyCz. SK = T bez zmeny. */
let tCz = null;
export function nastavTextyCz(texty) { tCz = texty || null; }
const TT = () => (jeCz() && tCz ? tCz : T);
/** Vlastný strih: druhá vrstva priamo vo V Class, medzi tým vyberanie a oplachovanie (Michal 7. 11. 2026). */
const VIDEA = [IMG + "mercedes-v-class-druha-vrstva-film"];
const POZNAMKA = () => t("Dáva sa len k predným sedadlám. Do 2. a 3. radu ani do kufra sa nedáva.");

const IKONY = {
  diamant: ["#c49b31", "M6.5 5h7l2.5 3.2L10 15.5 4 8.2z"],
  stit: ["#3d3728", "M10 4l5 2v3.6c0 3-2.1 5.3-5 6.4-2.9-1.1-5-3.4-5-6.4V6z"],
  kvapka: ["#2f6db0", "M10 3.8c-2.2 3-3.8 5-3.8 7.1a3.8 3.8 0 0 0 7.6 0c0-2.1-1.6-4.1-3.8-7.1z"],
  iskra: ["#1f7a52", "M10 4l1.4 3.9L15.3 9.3l-3.9 1.4L10 14.6l-1.4-3.9L4.7 9.3l3.9-1.4z"],
};
const ikona = (m) => '<svg class="lcd1v-druha__ikona lcd1v-druha__ikona--' + m + '" viewBox="0 0 20 20" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="10" fill="' + IKONY[m][0] + '"></circle><path d="' + IKONY[m][1] + '" fill="#fff"></path></svg>';

/** Celá karta otázky. priplatok = text ceny („+ 150 €“), zvolené Nie sa na tlačidle ukáže rámom. */
export function htmlDruha(priplatok, nieZvolene) {
  const T = TT();
  const vrstvy = T.vrstvy.map((v) => '<div class="lcd1v-druha__vrstva"><div class="lcd1v-druha__vrstva-hd"><p class="lcd1v-druha__stitok">' + v.stitok + "</p>"
    + (v.viac ? '<button type="button" class="lcd1v-druha__viac" data-okno="1" aria-haspopup="dialog" aria-expanded="false" aria-label="' + T.viac.aria + '"><span class="lcd1v-druha__viac-i" aria-hidden="true">' + T.viac.i + '</span><span class="lcd1v-druha__viac-t">' + T.viac.tl + "</span></button>" : "")
    + '</div><ul class="lcd1v-druha__body">' + v.body.map((b) => '<li class="lcd1v-druha__bod">' + ikona(b.ikona) + '<span class="lcd1v-druha__bod-t">' + b.t + "</span></li>").join("") + "</ul></div>").join("");
  return '<div class="lcd1v-druha active lv-d2"><div class="lcd1v-druha__dlazdica lv-d2-k"><div class="lv-d2-v"><video class="lcd1v-druha__video" muted playsinline webkit-playsinline preload="none" disablepictureinpicture disableremoteplayback aria-label="' + T.ano.alt + '" width="576" height="720"></video><span class="lv-d2-st"><b>' + T.pocet.cislo + "</b>" + T.pocet.text + " " + T.pocet.b + "</span></div>"
    + '<div class="lv-d2-t"><p class="lv-d2-top">' + T.naj + '</p><p class="lv-d2-nm">' + T.ano.nm + '</p><p class="lv-d2-po">' + t("K predným sedadlám") + '</p><div class="lcd1v-druha__vrstvy">' + vrstvy + "</div>"
    + '<div class="lv-d2-c"><span>' + T.cena.priplatok + "</span><b>" + priplatok + "</b></div>"
    + '<button type="button" class="lcd1v-druha__ano" data-k="vrstva" data-v="ano">' + T.ano.tl + "</button></div></div>"
    + '<p class="lv-pozn">' + POZNAMKA() + "</p>"
    + '<button type="button" class="lcd1v-druha__nie" data-k="vrstva" data-v="nie" aria-pressed="' + !!nieZvolene + '">' + T.nie.nm + "</button></div>";
}

/** Video v dlaždici: nič sa nestiahne, kým nie je karta na obrazovke, potom sa dve videá striedajú (rovnaké pravidlá ako druha-vrstva.js). */
export function ozivVideo(koren) {
  const video = koren.querySelector(".lcd1v-druha__video");
  if (!video || typeof IntersectionObserver !== "function") return () => {};
  video.muted = true;
  const mm = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  const smie = () => { const c = navigator.connection || {}; return !mm("(prefers-reduced-motion: reduce)") && !c.saveData && !/2g|3g/.test(c.effectiveType || ""); };
  const vs = { i: 0, typ: "mp4", vidno: false, src: false, chyba: false };
  const nastav = (i) => { vs.i = i; video.poster = VIDEA[i] + ".jpg"; video.src = VIDEA[i] + "." + vs.typ; vs.src = true; };
  function obnov() {
    if (vs.chyba) return;
    const hrat = vs.vidno && !document.hidden;
    if (hrat && !video.poster) video.poster = VIDEA[0] + ".jpg";
    if (!smie()) { if (!video.paused) video.pause(); return; }
    if (hrat) {
      if (!vs.src) nastav(0);
      if (video.paused) { const p = video.play(); if (p && p.catch) p.catch(() => { /* úsporný režim: ostane plagát */ }); }
    } else if (!video.paused) video.pause();
  }
  const koniec = () => { nastav((vs.i + 1) % VIDEA.length); obnov(); };
  const chyba = () => {
    if (!vs.src || vs.chyba) return;
    if (vs.typ === "webm") { vs.typ = "mp4"; nastav(vs.i); obnov(); return; }
    vs.chyba = true;
  };
  video.addEventListener("ended", koniec);
  video.addEventListener("error", chyba);
  const io = new IntersectionObserver((z) => { const x = z[z.length - 1]; vs.vidno = x.isIntersecting && x.intersectionRatio > 0.15; obnov(); }, { threshold: [0, 0.2, 0.5] });
  io.observe(video);
  document.addEventListener("visibilitychange", obnov);
  return () => { io.disconnect(); document.removeEventListener("visibilitychange", obnov); video.removeEventListener("ended", koniec); video.removeEventListener("error", chyba); video.pause(); };
}

/** Okienko „Zistiť viac“ (rovnaké triedy a texty ako na základnom produkte). naAno = to isté ako zelené tlačidlo v dlaždici. */
let okno = null;
function postav(naAno) {
  const O = TT().okno;
  const k = document.createElement("div");
  k.className = "lcd1v-druha-okno";
  k.hidden = true;
  k.innerHTML = '<div class="lcd1v-druha-okno__pozadie"></div><div class="lcd1v-druha-okno__panel" role="dialog" aria-modal="true" aria-labelledby="lcd1v-druha-okno-nadpis" tabindex="-1" data-lenis-prevent><span class="lcd1v-druha-okno__uchyt" aria-hidden="true"></span><div class="lcd1v-druha-okno__hd"><h3 class="lcd1v-druha-okno__nadpis" id="lcd1v-druha-okno-nadpis">' + O.nadpis + '</h3><button type="button" class="lcd1v-druha-okno__x" aria-label="' + O.zavriet + '">×</button></div>'
    + O.casti.map((c) => '<div class="lcd1v-druha-okno__cast"><p class="lcd1v-druha-okno__stitok">' + c.nm + '</p><p class="lcd1v-druha-okno__text">' + c.text + "</p></div>").join("")
    + '<div class="lcd1v-druha-okno__pocet"><b class="lcd1v-druha-okno__pocet-c">' + O.pocet.cislo + '</b><span class="lcd1v-druha-okno__pocet-t">' + O.pocet.text + '</span></div><button type="button" class="lcd1v-druha-okno__ano">' + O.tl + "</button></div>";
  document.body.appendChild(k);
  const panel = k.querySelector(".lcd1v-druha-okno__panel");
  const x = k.querySelector(".lcd1v-druha-okno__x");
  const ano = k.querySelector(".lcd1v-druha-okno__ano");
  const stav = { otvor: null };
  function zavri(fokus) {
    if (k.hidden) return;
    k.hidden = true;
    document.body.classList.remove("lcd1v-druha-okno-otvorene");
    if (stav.otvor) stav.otvor.setAttribute("aria-expanded", "false");
    if (fokus && stav.otvor && stav.otvor.isConnected) stav.otvor.focus({ preventScroll: true });
  }
  function kluc(e) {
    if (k.hidden) return;
    if (e.key === "Escape" || e.key === "Esc") { e.preventDefault(); zavri(true); return; }
    if (e.key !== "Tab") return;
    const i = [x, ano].indexOf(document.activeElement);
    if (i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === 1)) { e.preventDefault(); (e.shiftKey ? ano : x).focus(); }
  }
  k.querySelector(".lcd1v-druha-okno__pozadie").addEventListener("click", () => zavri(true));
  x.addEventListener("click", () => zavri(true));
  ano.addEventListener("click", () => { zavri(false); naAno(); });
  document.addEventListener("keydown", kluc);
  return {
    otvor(tl) { stav.otvor = tl; k.hidden = false; panel.scrollTop = 0; tl.setAttribute("aria-expanded", "true"); document.body.classList.add("lcd1v-druha-okno-otvorene"); panel.focus({ preventScroll: true }); },
    zrus() { document.removeEventListener("keydown", kluc); document.body.classList.remove("lcd1v-druha-okno-otvorene"); if (k.parentNode) k.parentNode.removeChild(k); okno = null; },
  };
}
export function otvorOkno(tl, naAno) { if (!okno) okno = postav(naAno); okno.otvor(tl); }
export function zrusOkno() { if (okno) okno.zrus(); }
