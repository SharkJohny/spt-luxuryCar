// Mercedes triedy V W447 (od roku 2014) v konfigurátore autokobercov 1V -> samostatná stránka triedy V (SK 646).
// Michal 8. 11. 2026: „aby ho to rovno prehodilo do produktu V-class“. Ktoré autá: functions/vclassPresmerovanie.js.
// Len SK (CZ produkt triedy V nemá), len nový vzhľad (modul typov jedno, dvoj, kufor-classic, kufor-premium v produkty.js;
// ?novy=0 ho nespustí), stránka triedy V ho nemá a nikdy nepresmerúva. Voľby vo formulári ani košík sa nemenia.
//
// Tri podoby oznámenia (v otvorenej karte auta pod výberom auta, pri zavretej karte nad krokmi):
//  - „ide“: zákazník na tejto stránke VYBERIE auto triedy V myšou alebo prstom (zmena značky, modelu alebo roku, po ktorej
//    je vo výbere trieda V od 2014) -> po 1,5 s presmerovanie (odkaz „Prejsť hneď“). Iné auto počas čakania ho zruší.
//  - „klavesnica“: tá istá zmena z klávesnice (na Windows mení šípka v zatvorenom selecte hodnotu a posiela change; kláves
//    na tom istom poli najviac 600 ms pred change). Bez odpočtu, aby zákazník s čítačkou pri prechádzaní rokov neodišiel:
//    prejde klávesom Enter v poli auta, tlačidlom „Pokračujte ďalej“ karty auta alebo odkazom.
//  - „odkaz“: zákazník už bol na stránke triedy V (presmerovaný alebo tam má rozrobený výber) -> len odkaz, aj pri načítaní
//    s uloženým autom, aj pri zmene auta. Po návrate (Späť) teda žiadna slučka, zákazník môže pokračovať alebo zmeniť auto.
//  Auto triedy V uložené z predošlej stránky (sessionStorage) pri načítaní: „ide“, ak tam ešte nebol, inak „odkaz“.
// Čítačky obrazovky: jedna stála oblasť aria-live (vložená pri štarte, prázdna), text oznámenia sa do nej len zapíše.
// Change od Shoptetu po načítaní (handleBrowserValueRestoration) s tým istým autom nič nespustí: porovnáva sa auto,
// nie udalosť.
import { lcdPlatnaHodnota } from "../../functions/autoVyber.js";
import { vclassAuto, adresaVclass, jeSkWeb, jeStrankaVclass, oznacPresmerovane, uzBolNaVclass } from "../../functions/vclassPresmerovanie.js";

export const MENO = "vclass-presmerovanie";
/** Čas na prečítanie oznámenia pred presmerovaním (ms). */
export const CAKANIE = 1500;
/** Change do tohto času po klávese na tom istom poli = zmena z klávesnice (ms). */
export const KLAVESNICA_MS = 600;

const TEXTY = {
  nadpis: "Pre Mercedes triedy V máme samostatnú stránku s cenou celého setu.",
  ide: "Presmerúvame Vás…",
  hned: "Prejsť hneď",
  klavesnica: "Prejdete na ňu klávesom Enter alebo tlačidlom Pokračujte ďalej.",
  odkaz: "Prejsť na stránku triedy V",
};
/** Text pre čítačku obrazovky podľa podoby oznámenia. */
const HLAS = {
  ide: TEXTY.nadpis + " Presmerúvame Vás na ňu.",
  klavesnica: TEXTY.nadpis + " " + TEXTY.klavesnica,
  odkaz: TEXTY.nadpis + " Odkaz na ňu je pod výberom auta.",
};
const SKRYTE = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0";

let zrus = null;

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  if (ctx.projectId !== "562035" || !jeSkWeb() || jeStrankaVclass()) return;
  const krok = ctx.krok("auto");
  const wrap = krok && krok.querySelector(".modl-selector-wrap");
  const sel = (k) => (wrap ? wrap.querySelector(".surcharge-list." + k + " select") : null);
  const s = [sel("brands"), sel("models"), sel("years")];
  if (!s[0] || !s[1] || !s[2]) return;

  const hodnoty = () => s.map((x) => lcdPlatnaHodnota(x) || "");
  const kluc = () => hodnoty().join("|");
  const auto = () => { const h = hodnoty(); return vclassAuto(h[0], h[1], h[2]); };

  let posledne = kluc();
  let casovac = 0;
  let box = null;
  let zobrazene = null;
  let rezim = null;
  /** select -> čas posledného klávesu na ňom */
  const klavesy = new Map();

  // stála oblasť pre čítačky: musí byť na stránke skôr, než sa do nej zapíše text, inak sa neprečíta
  const hlas = document.createElement("div");
  hlas.className = "lcd1v-vclass-hlas";
  hlas.setAttribute("role", "status");
  hlas.setAttribute("aria-live", "polite");
  hlas.setAttribute("aria-atomic", "true");
  hlas.style.cssText = SKRYTE;
  document.body.appendChild(hlas);
  let hlasCas = 0;
  function ohlas(text) {
    clearTimeout(hlasCas);
    hlas.textContent = "";
    if (text) hlasCas = setTimeout(function () { hlas.textContent = text; }, 100);
  }

  function skry() {
    clearTimeout(casovac);
    casovac = 0;
    if (box && box.parentNode) box.parentNode.removeChild(box);
    box = null;
    zobrazene = null;
    rezim = null;
    ohlas("");
  }

  function chod(url) {
    clearTimeout(casovac);
    casovac = 0;
    oznacPresmerovane();
    window.location.assign(url);
  }

  /** Oznámenie v podobe "ide" | "klavesnica" | "odkaz": v otvorenej karte auta pod výberom auta, pri zavretej karte nad krokmi. */
  function ukaz(v, podoba) {
    skry();
    zobrazene = v;
    rezim = podoba;
    const url = adresaVclass(v);
    box = document.createElement("div");
    box.className = "lcd1v-vclass lcd1v-vclass--" + podoba;
    const t = document.createElement("p");
    t.className = "lcd1v-vclass__t";
    t.textContent = TEXTY.nadpis;
    box.appendChild(t);
    const riadok = document.createElement("p");
    riadok.className = "lcd1v-vclass__r";
    if (podoba !== "odkaz") {
      const ide = document.createElement("span");
      ide.className = "lcd1v-vclass__ide";
      ide.textContent = podoba === "ide" ? TEXTY.ide : TEXTY.klavesnica;
      riadok.appendChild(ide);
    }
    const a = document.createElement("a");
    a.className = "lcd1v-vclass__a";
    a.href = url;
    a.textContent = podoba === "ide" ? TEXTY.hned : TEXTY.odkaz;
    a.addEventListener("click", oznacPresmerovane);
    riadok.appendChild(a);
    box.appendChild(riadok);
    if (podoba === "ide") {
      const cas = document.createElement("span");
      cas.className = "lcd1v-vclass__cas";
      cas.setAttribute("aria-hidden", "true");
      cas.style.animationDuration = CAKANIE + "ms";
      box.appendChild(cas);
    }
    const ms = krok.querySelector(":scope > #model-selector");
    const cw = ctx.form() && ctx.form().querySelector(".content-wrap");
    if (krok.classList.contains("active") && ms) krok.insertBefore(box, ms.nextSibling);
    else if (cw && cw.parentNode) cw.parentNode.insertBefore(box, cw);
    else krok.appendChild(box);
    ohlas(HLAS[podoba]);
    if (podoba === "ide") casovac = setTimeout(function () { casovac = 0; chod(url); }, CAKANIE);
  }

  function naZmenu(e) {
    const k = kluc();
    if (k === posledne) return; // to isté auto (aj change od Shoptetu po načítaní)
    posledne = k;
    const v = auto();
    if (!v) { skry(); return; }
    const t = e && e.target;
    const klavesnicou = !!t && Date.now() - (klavesy.get(t) || 0) <= KLAVESNICA_MS;
    ukaz(v, uzBolNaVclass() ? "odkaz" : klavesnicou ? "klavesnica" : "ide");
  }

  // kláves na poli auta: čas (rozozná zmenu z klávesnice) a Enter = prejsť (len pri oznámení z klávesnice)
  function naKlaves(e) {
    if (e.key === "Enter" && rezim === "klavesnica" && zobrazene) {
      e.preventDefault();
      chod(adresaVclass(zobrazene));
      return;
    }
    klavesy.set(e.currentTarget, Date.now());
  }
  s.forEach((x) => x.addEventListener("keydown", naKlaves));

  // „Pokračujte ďalej“ karty auta pri oznámení z klávesnice = prejsť na stránku triedy V (capture na window: skôr než
  // živá validácia kroku, ktorá by inak označila chýbajúci typ karosérie)
  function naPokracuj(e) {
    if (rezim !== "klavesnica" || !zobrazene) return;
    const b = e.target && e.target.closest ? e.target.closest(".next-step-button") : null;
    if (!b || b.parentNode !== krok) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    chod(adresaVclass(zobrazene));
  }
  window.addEventListener("click", naPokracuj, true);

  // jQuery .trigger("change") natívny addEventListener nevolá, jQuery .on chytí oboje (main.js viaže tiež cez jQuery)
  const $ = window.jQuery || window.$;
  if ($) $(s).on("change.lcdVclass", naZmenu);
  else s.forEach((x) => x.addEventListener("change", naZmenu));

  // Safari vráti stránku zo zálohy (Späť) aj s oznámením „Presmerúvame Vás…“: odpočet už dobehol, ostane len odkaz
  const naPageshow = function (e) {
    if (e.persisted && zobrazene) ukaz(zobrazene, "odkaz");
  };
  window.addEventListener("pageshow", naPageshow);

  // auto uložené z predošlej stránky
  const pri = auto();
  if (pri) ukaz(pri, uzBolNaVclass() ? "odkaz" : "ide");

  zrus = function () {
    skry();
    clearTimeout(hlasCas);
    if (hlas.parentNode) hlas.parentNode.removeChild(hlas);
    if ($) $(s).off("change.lcdVclass");
    else s.forEach((x) => x.removeEventListener("change", naZmenu));
    s.forEach((x) => x.removeEventListener("keydown", naKlaves));
    window.removeEventListener("click", naPokracuj, true);
    window.removeEventListener("pageshow", naPageshow);
  };
}

/** Návrat na starý vzhľad (index.js zlozit): oznámenie aj oblasť pre čítačky preč, nič sa nepresmeruje. */
export function zlozit() {
  if (zrus) zrus();
  zrus = null;
}
