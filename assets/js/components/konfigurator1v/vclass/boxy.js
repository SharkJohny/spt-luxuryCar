// Okno boxov pri triede V (Michal 7. 11. 2026: „úplne rovnako ako pri produktoch“): rovnaké triedy a texty ako okno na autokobercoch
// (kufor-boxy.js, _lcd1v-kufor-boxy.scss), len tam je v okne živý .box-config Shoptetu a tu vlastné prvky, lebo výber ide do príplatkov 451–460.
// Zákazník klikne 1× box alebo 2× box, v okne vyberie farbu a veľkosti a potvrdí. Zavretie okna krížikom nič nemení.
import { definicieKresby, kresba, nastavFarbuKresby, slugFarby } from "../box-kresba.js";
import { BOXY, BOX_FARBY } from "./data.js";

const PREDPONA = "lv-bxk-";
/** Rovnako ako v kufor-boxy.js: 1 box L, 2 boxy M a L. */
const NAJCASTEJSIE = { 1: ["L"], 2: ["M", "L"] };
const NADPIS_VELKOSTI = { 1: ["Veľkosť boxu"], 2: ["Veľkosť 1. boxu", "Veľkosť 2. boxu"] };
const POD = { 1: "Vyberte farbu a veľkosť boxu.", 2: "Vyberte farbu a veľkosť oboch boxov." };

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}

/**
 * @param {{ img: string, eur: (n: number) => string, cena: (i: number, v: string) => number,
 *           hotovo: (v: { n: number, box1: string, box2: string, farba: string }) => void }} o
 */
export function vytvorOknoBoxov(o) {
  const T = { n: 0, box1: "", box2: "", farba: "" };
  let spatNa = null;

  const pozadie = el("div", "lcd1v-bx-pozadie");
  pozadie.setAttribute("aria-hidden", "true");
  const obal = el("div", "upsale-Banner lcd1v-kb lv-bx-obal");
  const box = el("div", "box-config");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-labelledby", "lv-bx-nadpis");
  box.tabIndex = -1;
  if (/\biP(hone|ad|od)\b/.test(navigator.userAgent) || (/\bMacintosh\b/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)) box.classList.add("lcd1v-bx--ios");

  const hd = el("div", "lcd1v-bx__hd");
  const nadpis = el("h3", "lcd1v-bx__nadpis", "Vaše boxy do kufra");
  nadpis.id = "lv-bx-nadpis";
  const x = el("button", "lcd1v-bx__x", "×");
  x.type = "button";
  x.setAttribute("aria-label", "Zavrieť");
  hd.appendChild(nadpis);
  hd.appendChild(x);
  const pod = el("p", "lcd1v-bx__pod");

  const cfg = el("div", "config-wrap");
  const farby = el("div", "parameter-wrap lcd1v-bx-farby");
  farby.appendChild(el("p", "lcd1v-bx__nadp", "Farba boxov"));
  const farbyW = el("div", "options-wrap");
  BOX_FARBY.forEach((f) => {
    const b = el("button", "button option-button");
    b.type = "button";
    b.setAttribute("data-bx-farba", f.nm);
    b.setAttribute("aria-label", f.nm);
    const i = el("img");
    i.src = o.img + f.img;
    i.alt = "";
    i.loading = "lazy";
    b.appendChild(i);
    farbyW.appendChild(b);
  });
  farby.appendChild(farbyW);
  farby.appendChild(el("p", "lcd1v-bx__chyba", "Vyberte prosím farbu boxov."));
  const popis = el("p", "lcd1v-bx__farba-popis");
  popis.hidden = true;
  popis.appendChild(el("span", "lcd1v-bx__farba-l", "Vybraná farba: "));
  const popisNm = el("b", "lcd1v-bx__farba-nm");
  popis.appendChild(popisNm);
  farby.appendChild(popis);
  const velk = el("div", "lv-bx-velk");
  cfg.appendChild(farby);
  cfg.appendChild(velk);

  const pata = el("div", "lcd1v-bx__pata");
  const ok = el("button", "lcd1v-bx__ok", "Potvrďte výber boxov");
  ok.type = "button";
  const spr = el("p", "lv-bx-spr");
  spr.hidden = true;
  pata.appendChild(spr);
  pata.appendChild(ok);
  [hd, pod, cfg, pata, definicieKresby(PREDPONA)].forEach((e) => box.appendChild(e));
  obal.appendChild(box);
  document.body.appendChild(pozadie);
  document.body.appendChild(obal);

  function postavVelkosti() {
    velk.textContent = "";
    for (let i = 1; i <= T.n; i++) {
      const w = el("div", "parameter-wrap lcd1v-bx-velk");
      w.setAttribute("data-bx-box", i);
      w.appendChild(el("p", "lcd1v-bx__nadp", NADPIS_VELKOSTI[T.n][i - 1]));
      const m = el("div", "options-wrap");
      BOXY.forEach((b) => {
        const cena = o.cena(T.n, i, b.v);
        const t = el("button", "button option-button");
        t.type = "button";
        t.setAttribute("data-bx-vel", b.v);
        t.setAttribute("aria-label", b.v + ", " + b.r + ", + " + o.eur(cena));
        const v = el("span", "lcd1v-bx__vel");
        v.setAttribute("aria-hidden", "true");
        v.appendChild(kresba(parseInt(b.r, 10), PREDPONA));
        v.appendChild(el("span", "lcd1v-bx__vl", b.v));
        v.appendChild(el("span", "lcd1v-bx__rozmer", b.r));
        v.appendChild(el("span", "lcd1v-bx__pripl", "+ " + o.eur(cena)));
        if (NAJCASTEJSIE[T.n][i - 1] === b.v) v.appendChild(el("span", "lcd1v-bx__topv", "Najčastejšie"));
        t.appendChild(v);
        m.appendChild(t);
      });
      w.appendChild(m);
      w.appendChild(el("p", "lcd1v-bx__chyba", "Vyberte prosím veľkosť boxu."));
      velk.appendChild(w);
    }
  }
  function oznac() {
    farbyW.querySelectorAll("[data-bx-farba]").forEach((b) => {
      const on = b.getAttribute("data-bx-farba") === T.farba;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    popis.hidden = !T.farba;
    popisNm.textContent = T.farba;
    nastavFarbuKresby(box, T.farba ? slugFarby(T.farba) : null);
    velk.querySelectorAll("[data-bx-box]").forEach((w) => {
      const v = T["box" + w.getAttribute("data-bx-box")];
      w.querySelectorAll("[data-bx-vel]").forEach((b) => {
        const on = b.getAttribute("data-bx-vel") === v;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", String(on));
      });
      if (v) w.classList.remove("lcd-needs-fill");
    });
    if (T.farba) farby.classList.remove("lcd-needs-fill");
    if (!spr.hidden) {
      const ch = chyba();
      spr.hidden = !ch.length;
      spr.textContent = "Ešte chýba: " + ch.join(", ") + ".";
    }
  }
  /** Čo ešte chýba, slovami: kontrola nad tlačidlom, aby bolo jasné, prečo výber neprešiel. */
  function chyba() {
    const c = [];
    if (!T.farba) c.push("farba boxov");
    for (let i = 1; i <= T.n; i++) if (!T["box" + i]) c.push(T.n === 1 ? "veľkosť boxu" : "veľkosť " + i + ". boxu");
    return c;
  }
  function zatvor() {
    obal.classList.remove("showConf");
    document.body.classList.remove("lcd1v-bx-otvorene");
    if (spatNa && spatNa.isConnected) spatNa.focus();
    spatNa = null;
  }
  function otvor(n, stav, tl) {
    T.n = n;
    T.farba = stav.farba || "";
    T.box1 = stav.box1 || "";
    T.box2 = n > 1 ? stav.box2 || "" : "";
    spatNa = tl || null;
    pod.textContent = POD[n];
    farby.classList.remove("lcd-needs-fill");
    spr.hidden = true;
    postavVelkosti();
    oznac();
    box.scrollTop = 0;
    obal.classList.add("showConf");
    document.body.classList.add("lcd1v-bx-otvorene");
    box.focus({ preventScroll: true });
  }
  function potvrd() {
    const chyby = [];
    if (!T.farba) { farby.classList.add("lcd-needs-fill"); chyby.push(farby); }
    velk.querySelectorAll("[data-bx-box]").forEach((w) => {
      if (!T["box" + w.getAttribute("data-bx-box")]) { w.classList.add("lcd-needs-fill"); chyby.push(w); }
    });
    if (chyby.length) {
      spr.hidden = false;
      spr.textContent = "Ešte chýba: " + chyba().join(", ") + ".";
      chyby[0].scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    const v = { n: T.n, box1: T.box1, box2: T.box2, farba: T.farba };
    zatvor();
    o.hotovo(v);
  }
  function naKlik(e) {
    const b = e.target.closest && e.target.closest("button");
    if (!b) return;
    if (b === x) { zatvor(); return; }
    if (b === ok) { potvrd(); return; }
    if (b.hasAttribute("data-bx-farba")) { T.farba = b.getAttribute("data-bx-farba"); oznac(); return; }
    if (b.hasAttribute("data-bx-vel")) { T["box" + b.closest("[data-bx-box]").getAttribute("data-bx-box")] = b.getAttribute("data-bx-vel"); oznac(); }
  }
  const naKlavesu = (e) => { if (e.key === "Escape" && obal.classList.contains("showConf")) zatvor(); };
  // pozadie chytá ťuknutia ešte 0,8 s po zatvorení (CSS), vtedy nič nerobí
  const naPozadie = () => { if (obal.classList.contains("showConf")) zatvor(); };
  /** Stránka má vlastné plynulé posúvanie, preto si okno koliesko aj ťahanie prstom po pozadí vybavuje samo. */
  const otvorene = () => obal.classList.contains("showConf");
  const naKoliesko = (e) => {
    if (!otvorene()) return;
    e.preventDefault();
    e.stopPropagation();
    if (box.contains(e.target)) box.scrollTop += e.deltaMode === 1 ? e.deltaY * 18 : e.deltaY;
  };
  const naTah = (e) => { if (otvorene() && !box.contains(e.target)) e.preventDefault(); };
  box.addEventListener("click", naKlik);
  pozadie.addEventListener("click", naPozadie);
  document.addEventListener("keydown", naKlavesu);
  window.addEventListener("wheel", naKoliesko, { passive: false, capture: true });
  window.addEventListener("touchmove", naTah, { passive: false, capture: true });

  return {
    otvor,
    zrus() {
      document.removeEventListener("keydown", naKlavesu);
      window.removeEventListener("wheel", naKoliesko, true);
      window.removeEventListener("touchmove", naTah, true);
      document.body.classList.remove("lcd1v-bx-otvorene");
      [obal, pozadie].forEach((e) => { if (e.parentNode) e.parentNode.removeChild(e); });
    },
  };
}
