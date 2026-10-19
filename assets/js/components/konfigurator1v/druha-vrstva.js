// Ponuka druhej vrstvy na jednovrstvových (598 Diamond, 610 Hexa, 613 Stripe) — Michal 14. 10. 2026. JADRO (vydanie):
// TYPY.jedno.moduly (produkty.js), beží len pod body.lcd-1v (brána v index.js). Návrh: druha-vrstva.html (texty, dlaždice),
// texty v typy/jedno.js „druha“, CSS assets/css/_lcd1v-druha.scss (blok LCD-1V-DRUHA).
//
// Rozhodnutia Michala (14. 10. 2026):
//   - karta sa ukáže hneď po kroku Farba (keď je farba zvolená) ako SKRYTÝ krok BEZ čísla: „Krok N z 6“, postup a počty
//     krokov sa nemenia (karta nie je v ctx.produkt.kroky ani v lcdGetSteps -> validácia košíka sa nemení),
//   - nepovinná: bez odpovede = Nie; „Pokračujte ďalej“ vo Farbe ju otvorí (kým nie je zodpovedaná), inak nič neblokuje,
//   - zlatá dlaždica s krátkym videom (od 16. 10. 2026 namiesto fotky; dve videá sa striedajú, sťahujú sa až pri zobrazení
//     karty — blok „video v dlaždici“ nižšie) a príplatkom „+ N €“ rátaným živo (cena dvojvrstvového
//     produktu pri tých istých voľbách − cena tejto stránky; chyba siete = cena sa neukáže),
//   - Michal 16. 10. 2026: príplatok je za CELÚ SADU druhej vrstvy (všetky koberce zvoleného rozloženia), nie za 1 kus,
//     a pri ňom odporúčaná cena druhej vrstvy + „Ušetríte“ — obnovCenu nižšie,
//   - Michal 19. 10. 2026 (návrh A, „Video A“: „rôzne rozhádzané tie ceny … jeden štýl ako pri rohožiach do kufra“):
//     nadpis dlaždice „Druhá vrstva“ + zlatý štítok „Na celú sadu autokobercov“ a ceny v riadkoch rohože do kufra
//     (Odporúčaná cena / Ušetríte / Príplatok od); preč veta „Vzor, auto aj farba Vám ostanú.“ aj veta pod „Nie“,
//   - Michal 15. 10. 2026 („ani neviem, že na to môžem kliknúť“): v dlaždici je skutočné zlaté TLAČIDLO „Áno, chcem druhú
//     vrstvu“ (<button>, klávesnica). Dlaždica je obyčajný <div> a klik na ňu (fotka, text) robí to isté — tlačidlá sa do
//     seba nevnárajú, takže klávesnicou sa ide len na tlačidlo,
//   - zlaté tlačidlo „Nie, ďakujem“ (zelené je „Áno“ — Michal 16. 10.): karta sa zbalí („Bez druhej vrstvy“) a otvorí sa Rozloženie,
//   - „Áno“: krátka správa v karte, tlačidlá sa zablokujú, výber sa zapíše do kľúča prenosu (prenos.js) a otvorí sa
//     dvojvrstvový produkt toho istého vzoru (598 -> 601, 610 -> 604, 613 -> 607; register produkty.js).
// Nič s atribútom name, žiadny zápis do formulára: karta je nový prvok v .content-wrap BEZ tried .position-wrap /
// .parameter-wrap. Bez flagu nič (brána).
import { najdiProdukt, jeZapnutyTyp } from "./produkty.js";
import { stranka } from "./ceny-ine.js";
import { PARAMETRE } from "./ctx.js";
import { zapisPrenos } from "./prenos.js";
import { lcdGetSteps, lcdFirstUnfilled } from "../../functions/configuratorEngine.js";

export const MENO = "druha-vrstva";

const NBSP = " ";

/** Odporúčaná cena zo sumy — ten istý vzorec ako productPage.js calculateStandartPrice a ctx.cena(): × 1,6 nahor na desiatky. */
const odporucanaZ = (suma) => Math.ceil((suma * 1.6) / 10) * 10;

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}
function nastavText(e, text) {
  if (e && e.textContent !== text) e.textContent = text;
}
function prepni(e, trieda, stav) {
  if (e && e.classList.contains(trieda) !== !!stav) e.classList.toggle(trieda, !!stav);
}
const cisty = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

function vyskaHlavicky() {
  const sels = [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"];
  for (let i = 0; i < sels.length; i++) {
    const e = document.querySelector(sels[i]);
    if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) return e.offsetHeight;
  }
  return 0;
}
/** Rovnako ako kroky.js po „Pokračujte ďalej“: otvorená karta pod hlavičku webu, ak nie je v hornej polovici okna. */
function posunNa(e) {
  if (!e || !e.isConnected) return;
  const hH = vyskaHlavicky();
  const top = e.getBoundingClientRect().top;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  if (top < hH + 8 || top > hH + (vh - hH) * 0.5) window.scrollTo({ top: Math.max(0, Math.round(window.pageYOffset + top - hH - 12)), behavior: "instant" });
}

/**
 * Cena dvojvrstvového produktu pri tých istých voľbách (mapa = mapaZFormulara jeho stránky, ceny-ine.js):
 * variant s tou istou farbou 1. vrstvy (najlacnejšia farba 2. vrstvy, ktorá nie je vypredaná) + rovnaké príplatky.
 * Čokoľvek nesedí (farba alebo hodnota príplatku na cieli nie je) -> null (cena sa neukáže).
 */
export function cenaNaCieli(mapa, farba, priplatky) {
  if (!mapa || !mapa.kom || !mapa.vpar || !mapa.params || !farba) return null;
  const idF = Object.keys(mapa.vpar).find((id) => PARAMETRE.farba.test(String(mapa.vpar[id].n || "").trim()));
  if (!idF) return null;
  let variant = null;
  Object.keys(mapa.kom).forEach((kluc) => {
    const e = mapa.kom[kluc];
    if (!e || e.x || typeof e.c !== "number" || !isFinite(e.c)) return;
    const casti = kluc.split("-");
    for (let i = 0; i + 1 < casti.length; i += 2) {
      if (casti[i] === idF && casti[i + 1] === String(farba)) { if (variant == null || e.c < variant) variant = e.c; break; }
    }
  });
  if (variant == null) return null;
  let spolu = variant;
  for (let i = 0; i < priplatky.length; i++) {
    const x = priplatky[i];
    let p = mapa.params[x.id];
    if (!p || cisty(p.n) !== cisty(x.meno)) p = Object.keys(mapa.params).map((id) => mapa.params[id]).find((q) => cisty(q.n) === cisty(x.meno)) || p;
    const o = p && p.o && p.o[x.hodnota];
    if (!o) return null;
    const c = Number(o.fp) > 0 ? Number(o.fp) : Number(o.ap) || 0;
    spolu += c;
  }
  return Math.round(spolu * 100) / 100;
}

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  if (!ctx.produkt || ctx.produkt.typ !== "jedno") return;
  // cieľ = dvojvrstvový produkt toho istého vzoru; len keď sa pri aktuálnom flagu otvorí v novom vzhľade (inak by
  // zákazník pristál v starom vzhľade bez prenosu)
  const ciel = najdiProdukt(ctx.projectId, "dvoj", ctx.produkt.vzor);
  let flag = null;
  try { flag = sessionStorage.getItem("lcd1v"); } catch (e) { flag = null; }
  if (!ciel || !(flag === "vyvoj" || jeZapnutyTyp("dvoj"))) return;
  const T = ctx.texty("druha");
  const farba = ctx.krok("farba");
  const form = ctx.form();
  if (!T.ti || !farba || !form || !farba.parentNode) return;
  if (form.querySelector(".lcd1v-druha")) return; // už postavené

  // ---------------------------------------------------------------- karta (bez čísla, bez name)
  const karta = el("div", "lcd1v-krok lcd1v-druha");
  karta.hidden = true;
  karta.setAttribute("role", "group");
  karta.setAttribute("aria-label", T.nm);
  const hd = el("button", "lcd1v-hd");
  hd.type = "button";
  hd.setAttribute("aria-expanded", "false");
  const no = el("span", "lcd1v-no");
  no.setAttribute("aria-hidden", "true");
  const tx = el("span", "lcd1v-tx");
  tx.appendChild(el("span", "lcd1v-ey", T.nm));
  tx.appendChild(el("span", "lcd1v-nm", T.nm));
  tx.appendChild(el("span", "lcd1v-ti", T.ti));
  const vy = el("span", "lcd1v-vy", T.vy);
  tx.appendChild(vy);
  hd.appendChild(no);
  hd.appendChild(tx);
  hd.appendChild(el("span", "lcd1v-zm", "Zmeniť"));
  karta.appendChild(hd);
  if (T.pod) karta.appendChild(el("p", "lcd1v-pod", T.pod));

  // zlatá dlaždica (vzhľad kariet kroku Rohož do kufra: .lcd1v-kb__karta) — <div>, nie <button>: vnútri je skutočné
  // tlačidlo „Áno“ (tlačidlo v tlačidle HTML nedovolí); klik kamkoľvek do dlaždice = to isté ako tlačidlo
  const volby = el("div", "lcd1v-kb lcd1v-druha__volby");
  const dlazdica = el("div", "lcd1v-kb__karta lcd1v-kb__karta--naj lcd1v-druha__dlazdica");
  dlazdica.appendChild(el("span", "lcd1v-kb__top", T.naj));
  const fot = el("span", "lcd1v-kb__fot lcd1v-druha__fot");
  const ram = el("span", "lcd1v-druha__ram");
  const video = document.createElement("video");
  video.className = "lcd1v-druha__video";
  // bez zvuku, v stránke (iPhone), bez ovládania; preload none = nič sa nestiahne, kým sa nenastaví src (zobrazenie karty)
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute("muted", "");
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.preload = "none";
  video.setAttribute("preload", "none");
  video.setAttribute("disablepictureinpicture", "");
  video.setAttribute("disableremoteplayback", "");
  video.setAttribute("aria-label", (T.ano && T.ano.alt) || "");
  video.width = 576;
  video.height = 720;
  ram.appendChild(video);
  fot.appendChild(ram);
  dlazdica.appendChild(fot);
  // text vedľa videa (Michal 19. 10. 2026, návrh A „Video A“): nadpis „Druhá vrstva“, pod ním zlatý štítok „Na celú sadu
  // autokobercov“ a riadky cien v tom istom štýle ako karty rohože do kufra (.lcd1v-kb__ucet/__r, kufor-boxy.js riadky())
  const atx = el("span", "lcd1v-kb__tx");
  atx.appendChild(el("span", "lcd1v-kb__nm", T.ano.nm));
  if (T.ano.po) atx.appendChild(el("span", "lcd1v-kb__po", T.ano.po));
  // riadky cien: „Odporúčaná cena 210 €“ / „Ušetríte − 78 €“ (zelené) / „PRÍPLATOK OD + 132 €“ (veľké). Kým nie je cena
  // dvojvrstvového známa, celý blok je skrytý; Odporúčaná a Ušetríte len keď sa dajú spočítať (613 -> len Príplatok; obnovCenu).
  const TC = T.cena || {};
  function riadok(nazov, trieda) {
    const r = el("span", "lcd1v-kb__r" + (trieda ? " " + trieda : ""));
    const n = el("span", "lcd1v-kb__rn", nazov);
    const h = el("span", "lcd1v-kb__rh");
    r.appendChild(n);
    r.appendChild(h);
    return { r, n, h };
  }
  const ucet = el("span", "lcd1v-kb__ucet lcd1v-druha__ucet");
  ucet.hidden = true;
  const rOdp = riadok(TC.odporucana, "lcd1v-druha__r-odp");
  const rUs = riadok(TC.usetrite, "lcd1v-kb__r--zl lcd1v-druha__r-us");
  const rSum = riadok(TC.priplatok, "lcd1v-kb__r--sum lcd1v-druha__r-sum");
  rOdp.r.hidden = true;
  rUs.r.hidden = true;
  const suma = rSum.h;
  suma.classList.add("lcd1v-druha__suma");
  ucet.appendChild(rOdp.r);
  ucet.appendChild(rUs.r);
  ucet.appendChild(rSum.r);
  atx.appendChild(ucet);
  dlazdica.appendChild(atx);
  // zelené tlačidlo „Áno, chcem druhú vrstvu“ v dlaždici (zelené = kam chceme zákazníka; zlaté „Nie“ je pod dlaždicou)
  const ano = el("button", "lcd1v-druha__ano", T.ano.tl);
  ano.type = "button";
  dlazdica.appendChild(ano);
  volby.appendChild(dlazdica);
  karta.appendChild(volby);

  // správa pri prenose
  const prenos = el("div", "lcd1v-druha__prenos");
  prenos.hidden = true;
  prenos.setAttribute("role", "status");
  const toc = el("span", "lcd1v-druha__toc");
  toc.setAttribute("aria-hidden", "true");
  const ptx = el("span", "lcd1v-druha__prenos-t");
  ptx.appendChild(el("b", null, T.prenos));
  const pVyber = el("span", "lcd1v-druha__prenos-vyber");
  ptx.appendChild(pVyber);
  prenos.appendChild(toc);
  prenos.appendChild(ptx);
  karta.appendChild(prenos);

  // zlaté „Nie, ďakujem“ pod dlaždicou (zelené je „Áno“ v dlaždici); bez vety pod ním (návrh A, 19. 10. 2026)
  const nie = el("button", "lcd1v-druha__nie", T.nie.nm);
  nie.type = "button";
  karta.appendChild(nie);

  farba.parentNode.insertBefore(karta, farba.nextSibling);

  // ---------------------------------------------------------------- video v dlaždici (Michal 16. 10. 2026: č. 5 + č. 1)
  // Rýchlosť: pri načítaní stránky sa nestiahne nič (preload none, bez src aj bez posteru). Keď je dlaždica na obrazovke
  // (otvorená karta, IntersectionObserver): poster + src PRVÉHO videa a play(). Druhé video (src aj poster) až po
  // „ended“ prvého, potom znova prvé … dookola. Mimo obrazovky, zatvorená karta alebo skrytá záložka = pauza.
  // prefers-reduced-motion, šetrenie dát (saveData) alebo 2G/3G: len poster prvého videa, video sa nesťahuje.
  // Prehrávanie zlyhá (iPhone v úspornom režime, zakázané automatické prehrávanie) = ostane poster, nič sa nerozbije.
  // Súbory: typy/jedno.js obrazky „druha-video-1/2“ (.mp4) + rovnaké meno .webm a -poster.jpg v assets/img/1v/.
  const videa = ["druha-video-1", "druha-video-2"].map((k) => ctx.obrazokVzoru(k)).filter(Boolean);
  const vs = { i: 0, typ: "mp4", vidno: false, poster: false, src: false, chyba: false, dalsiPoster: false };
  const maIO = typeof IntersectionObserver === "function";
  const mm = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
  function smiePrehravat() {
    const con = navigator.connection || {};
    return !mm("(prefers-reduced-motion: reduce)") && !con.saveData && !/2g|3g/.test(con.effectiveType || "");
  }
  const posterVidea = (i) => videa[i].replace(/\.mp4$/, "-poster.jpg");
  const zdrojVidea = (i) => (vs.typ === "webm" ? videa[i].replace(/\.mp4$/, ".webm") : videa[i]);
  /** WebM (VP9, o ~25 % menšie) len kde ho prehliadač isto prehrá; Safari a všetko na iPhone (WebKit) = MP4 (H.264). */
  function typVidea() {
    try {
      if (!/apple/i.test(navigator.vendor || "") && video.canPlayType('video/webm; codecs="vp9"') === "probably") return "webm";
    } catch (e) { /* MP4 */ }
    return "mp4";
  }
  function nastavVideo(i) {
    vs.i = i;
    vs.dalsiPoster = false;
    video.poster = posterVidea(i);
    video.src = zdrojVidea(i); // preload none: sťahuje sa až po play()
    vs.src = true;
  }
  function obnovVideo() {
    if (!videa.length || vs.chyba) return;
    const hrat = vs.vidno && !document.hidden;
    if (hrat && !vs.poster) { vs.poster = true; if (!vs.src) video.poster = posterVidea(0); }
    if (!smiePrehravat()) { if (!video.paused) video.pause(); return; }
    if (hrat) {
      if (!vs.src) { vs.typ = typVidea(); nastavVideo(0); }
      if (video.paused) { const p = video.play(); if (p && p.catch) p.catch(() => { /* úsporný režim: ostane poster */ }); }
    } else if (!video.paused) video.pause();
  }
  // koniec videa -> ďalšie (1 -> 2 -> 1 …); jedno video = od začiatku
  video.addEventListener("ended", function () {
    if (videa.length > 1) nastavVideo((vs.i + 1) % videa.length);
    else video.currentTime = 0;
    obnovVideo();
  });
  // posledná ~1,5 s: poster ďalšieho videa (~20 kB) do pamäte, aby pri prepnutí nebol prázdny rámik (video samo až po „ended“)
  video.addEventListener("timeupdate", function () {
    if (vs.dalsiPoster || videa.length < 2 || !(video.duration > 0) || video.duration - video.currentTime > 1.5) return;
    vs.dalsiPoster = true;
    new Image().src = posterVidea((vs.i + 1) % videa.length);
  });
  // WebM nejde (prehliadač, typ súboru na CDN) -> to isté video v MP4; nejde ani MP4 -> ostane poster, bez ďalších pokusov
  video.addEventListener("error", function () {
    if (!vs.src || vs.chyba) return;
    if (vs.typ === "webm") { vs.typ = "mp4"; nastavVideo(vs.i); obnovVideo(); return; }
    vs.chyba = true;
    video.removeAttribute("src");
    try { video.load(); } catch (e) { /* nič */ }
  });
  if (maIO) {
    new IntersectionObserver(function (zaznamy) {
      const z = zaznamy[zaznamy.length - 1];
      vs.vidno = z.isIntersecting && z.intersectionRatio > 0.15;
      obnovVideo();
    }, { threshold: [0, 0.2, 0.5] }).observe(fot);
  }
  document.addEventListener("visibilitychange", obnovVideo);

  // ---------------------------------------------------------------- stav
  const stav = { odpoved: null, prenos: false, mapa: undefined, bezna: false, nacitava: false };
  const nastavOtvoreny = (e, on) => {
    if (typeof window.__lcdSetStepOpen === "function") window.__lcdSetStepOpen(e, on);
    else e.classList.toggle("active", on);
  };
  const farbaVyplnena = () => !!ctx.vyplneny(farba);

  function otvor(posun) {
    lcdGetSteps().forEach((s) => { if (s.classList.contains("active")) nastavOtvoreny(s, false); });
    karta.classList.add("active");
    hd.setAttribute("aria-expanded", "true");
    nacitajCenu();
    obnov();
    if (posun) {
      setTimeout(() => posunNa(karta), 0);
      setTimeout(() => posunNa(karta), 380); // zatvorenie kroku nad ňou mení výšku (prechod ~300 ms)
    }
  }
  function zatvor() {
    karta.classList.remove("active");
    hd.setAttribute("aria-expanded", "false");
  }

  /** Príplatky zvolené na tejto stránke (rovnaká množina ako ctx.cena()): [{ id, meno, hodnota }]. */
  function zvolenePriplatky() {
    const out = [];
    form.querySelectorAll("select.surcharge-parameter").forEach((s) => {
      if (!s.value || s.value === "0") return;
      out.push({ id: s.getAttribute("data-parameter-id"), meno: s.getAttribute("data-parameter-name") || "", hodnota: s.value });
    });
    return out;
  }
  function atribut(e, meno, hodnota) {
    if (hodnota == null) { if (e.hasAttribute(meno)) e.removeAttribute(meno); }
    else if (e.getAttribute(meno) !== String(hodnota)) e.setAttribute(meno, String(hodnota));
  }
  /**
   * Riadky cien dlaždice, všetko živo pri aktuálnych voľbách (nič natvrdo):
   *   príplatok  = cena dvojvrstvového (cenaNaCieli) − ctx.cena().spolu = cena CELEJ sady druhej vrstvy (dvojvrstvový produkt
   *                je jedna sada s jednou cenou: druhá vrstva na všetky koberce zvoleného rozloženia),
   *   odporúčaná = odporúčaná dvojvrstvového (× 1,6 nahor na desiatky, ako rámik na jeho stránke) − odporúčaná tejto stránky
   *                (ctx.cena().odporucana) = rozdiel dvoch čísel, ktoré web ukazuje v rámikoch; len keď obe stránky majú
   *                v admine bežnú cenu (inak web odporúčanú neukazuje — 613, D2) a je vyššia než príplatok,
   *   ušetríte   = odporúčaná − príplatok (odporúčaná − ušetríte = príplatok),
   *   „Príplatok od“ / „Príplatok“ = pravidlo hlavného rámika („Naša cena od …“): kým výber nie je úplný (rozloženie),
   *                číslo ešte môže stúpnuť -> „od“; úplný výber -> bez „od“.
   */
  function obnovCenu() {
    const p = ctx.parameter("farba");
    const v = p ? p.select.value : "";
    const tu = ctx.cena();
    const tam = stav.mapa ? cenaNaCieli(stav.mapa, v, zvolenePriplatky()) : null;
    const rozdiel = tam != null && tu && tu.spolu > 0 ? Math.round((tam - tu.spolu) * 100) / 100 : null;
    const ok = rozdiel != null && rozdiel > 0;
    let odp = null;
    if (ok && stav.bezna && tu.maBeznuCenu && tu.odporucana > 0) {
      const x = Math.round((odporucanaZ(tam) - tu.odporucana) * 100) / 100;
      if (x > rozdiel + 0.5) odp = x;
    }
    let uplny = false;
    try { uplny = ctx.prvyNevyplneny() === null; } catch (e) { uplny = false; }
    if (ok) {
      nastavText(suma, "+" + NBSP + ctx.formatCena(rozdiel));
      nastavText(rSum.n, uplny ? TC.priplatok : TC.priplatok + " " + TC.od);
      if (odp != null) {
        nastavText(rOdp.h, ctx.formatCena(odp));
        nastavText(rUs.h, "−" + NBSP + ctx.formatCena(Math.round((odp - rozdiel) * 100) / 100));
      }
    }
    if (ucet.hidden === ok) ucet.hidden = !ok;
    if (rOdp.r.hidden === (odp != null)) rOdp.r.hidden = odp == null;
    if (rUs.r.hidden === (odp != null)) rUs.r.hidden = odp == null;
    atribut(ano, "data-lcd1v-priplatok", ok ? rozdiel : null);
    atribut(ano, "data-lcd1v-odporucana", odp);
  }
  function nacitajCenu() {
    if (stav.mapa !== undefined || stav.nacitava) return;
    stav.nacitava = true;
    stranka(ciel.url).then(function (v) {
      stav.mapa = (v && v.mapa) || null;
      stav.bezna = !!(v && v.bezna);
    }, function () {
      stav.mapa = null;
    }).then(function () {
      stav.nacitava = false;
      naplanuj();
    });
  }

  function obnov() {
    naplanovane = false;
    const vid = farbaVyplnena() || stav.prenos;
    if (karta.hidden === vid) karta.hidden = !vid;
    if (vid) nacitajCenu();
    const hotova = stav.odpoved === "nie" || stav.prenos;
    prepni(karta, "lcd1v-hotovy", hotova);
    prepni(karta, "lcd1v-druha--prenos", stav.prenos);
    nastavText(vy, stav.odpoved === "nie" ? T.vyNie : T.vy);
    obnovCenu();
    if (!maIO) { vs.vidno = !karta.hidden && karta.classList.contains("active"); obnovVideo(); }
  }
  let naplanovane = false;
  function naplanuj() {
    if (naplanovane) return;
    naplanovane = true;
    setTimeout(obnov, 30);
  }

  // ---------------------------------------------------------------- akcie
  hd.addEventListener("click", function () {
    if (stav.prenos) return;
    if (karta.classList.contains("active")) zatvor();
    else otvor(false);
    obnov();
  });

  nie.addEventListener("click", function () {
    if (stav.prenos) return;
    stav.odpoved = "nie";
    zatvor();
    // hlavná cesta: ďalší živý krok po Farbe (ako „Pokračujte ďalej“ živého enginu), cena sa nemení
    const kroky = lcdGetSteps();
    const i = kroky.indexOf(farba);
    const dalsi = i > -1 ? kroky[i + 1] : ctx.krok("rozlozenie");
    if (dalsi) {
      kroky.forEach((s) => { if (s !== dalsi && s.classList.contains("active")) nastavOtvoreny(s, false); });
      if (!dalsi.classList.contains("active")) nastavOtvoreny(dalsi, true);
      setTimeout(() => posunNa(dalsi), 0);
      setTimeout(() => posunNa(dalsi), 380);
    }
    obnov();
  });

  // tlačidlo „Áno“ (myš, Enter, medzerník) aj klik kamkoľvek do dlaždice: klik na tlačidlo prebuble do dlaždice -> jeden poslucháč
  dlazdica.addEventListener("click", function () {
    if (stav.prenos) return;
    stav.prenos = true;
    stav.odpoved = "ano";
    ano.disabled = true;
    nie.disabled = true;
    hd.disabled = true;
    const riadky = ["vzor", "auto", "farba"].map((m) => {
      const k = form.querySelector(".lcd1v-k-" + m + " > .lcd1v-hd .lcd1v-vy");
      return k ? k.textContent.replace(/\s+/g, " ").trim() : "";
    }).filter(Boolean);
    nastavText(pVyber, riadky.join(" · "));
    prenos.hidden = false;
    obnov();
    zapisPrenos(ctx, ciel.id); // zakázané úložisko: prechod aj tak (prenesie sa nanajvýš auto)
    setTimeout(function () { window.location.assign(ciel.url); }, 450);
  });

  // „Pokračujte ďalej“ vo Farbe: kým nie je otázka zodpovedaná, otvorí kartu namiesto Rozloženia. Nevyplnená farba
  // (alebo krok pred ňou) = živá validácia ako doteraz (červený rám). Capture na document -> živý engine nebeží.
  document.addEventListener("click", function (e) {
    const t = e.target;
    const b = t && t.closest && t.closest(".lcd1v-k-farba > .next-step-button");
    if (!b || b.parentNode !== farba || !document.body.classList.contains("lcd-1v")) return;
    if (stav.odpoved || stav.prenos) return;
    const kroky = lcdGetSteps();
    const i = kroky.indexOf(farba);
    if (i < 0 || lcdFirstUnfilled(i)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    karta.hidden = false;
    otvor(true);
  }, true);

  // otvorený živý krok (hlavička, „Pokračujte ďalej“, validácia košíka) -> karta sa zatvorí (jedna otvorená karta)
  const mo = new MutationObserver(function () {
    if (!karta.classList.contains("active")) return;
    if (lcdGetSteps().some((s) => s.classList.contains("active"))) { zatvor(); naplanuj(); }
  });
  lcdGetSteps().forEach((s) => mo.observe(s, { attributes: true, attributeFilter: ["class"] }));
  // výber farby (živá trieda .active na vzorke) -> karta sa ukáže
  const fow = farba.querySelector(":scope > .options-wrap");
  if (fow) new MutationObserver(naplanuj).observe(fow, { subtree: true, attributes: true, attributeFilter: ["class"] });

  // zmeny výberu a ceny -> riadky cien (príplatok, odporúčaná, ušetríte, „Príplatok od“ / „Príplatok“)
  const $ = window.jQuery || window.$;
  if ($) $(form).on("change", "select", naplanuj);
  else form.addEventListener("change", naplanuj);
  document.addEventListener("LuxuryCarPriceRecalculated", naplanuj);
  document.addEventListener("ShoptetVariantChange", naplanuj);
  ctx.na("zmena", naplanuj);

  // Safari bfcache (Späť bez nového načítania): karta znova nezodpovedaná, tlačidlá odblokované
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    stav.prenos = false;
    stav.odpoved = null;
    ano.disabled = false;
    nie.disabled = false;
    hd.disabled = false;
    prenos.hidden = true;
    zatvor();
    obnov();
  });

  obnov();
}
