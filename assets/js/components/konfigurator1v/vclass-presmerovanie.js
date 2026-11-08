// Mercedes triedy V W447 (od roku 2014) v konfigurátore autokobercov 1V -> samostatná stránka triedy V (SK 646, CZ 2458).
// Michal 8. 11. 2026: „aby ho to rovno prehodilo do produktu V-class“. Ktoré autá: functions/vclassPresmerovanie.js.
// SK vždy; CZ (české texty TEXTY_CZ, rovnaká adresa) len s CZ_SPUSTENE = true vo functions/vclassPresmerovanie.js.
// Len nový vzhľad (modul typov jedno, dvoj, kufor-classic, kufor-premium v produkty.js; ?novy=0 ho nespustí), stránka
// triedy V ho nemá a nikdy nepresmerúva. Voľby vo formulári ani košík sa nemenia.
//
// Michal 8. 11. 2026 (večer): triedu V v obyčajnom konfigurátore nakonfigurovať nejde („neexistuje“). Preto už žiadne okno
// „Máte Mercedes triedy V?“ so „Zostať tu“ (bolo naživo d7c9ae3 až 8d7288b):
//  - „ide“: zákazník na tejto stránke VYBERIE auto triedy V myšou alebo prstom (zmena značky, modelu alebo roku, po ktorej
//    je vo výbere trieda V: „V Class“ od 2014, dĺžky M/L/XL pri akomkoľvek roku aj ešte bez roku -> adresa bez roku)
//    -> nápis a po 1,5 s presmerovanie (odkaz „Prejsť hneď“). Vždy, aj keď už na stránke triedy V bol. Iné auto počas
//    čakania presmerovanie zruší.
//  - „klavesnica“: tá istá zmena z klávesnice (na Windows mení šípka v zatvorenom selecte hodnotu a posiela change; kláves
//    na tom istom poli najviac 600 ms pred change). Bez odpočtu, aby zákazník s čítačkou pri prechádzaní modelov a rokov
//    neodišiel: prejde klávesom Enter v poli auta, tlačidlom „Pokračujte ďalej“ karty auta alebo odkazom. Keď z polí auta
//    odíde (fokus mimo značky, modelu, roku a nápisu) a trieda V je stále vybraná -> „ide“. Dokončiť triedu V v tomto
//    konfigurátore teda nejde ani z klávesnice.
//  - návrat s uloženou triedou V (načítanie stránky, F5, Späť aj z bfcache) u zákazníka, ktorý už na stránke triedy V bol
//    (presmerovaný alebo tam má rozrobený výber): výber auta sa VYNULUJE — značka, model, rok aj typ karosérie na
//    „Vyberte…“, uložené auto v sessionStorage zmaže saveModel v main.js (change ako pri výbere zákazníkom). Žiadne okno,
//    žiadne odrazenie späť na triedu V (po Späť by vznikla slučka). Kto tam ešte nebol (trieda V vybraná na titulke alebo
//    na inom produkte), ide na triedu V („ide“).
// Čítačky obrazovky: jedna stála oblasť aria-live (vložená pri štarte, prázdna), text nápisu sa do nej len zapíše.
// Change od Shoptetu po načítaní (handleBrowserValueRestoration) s tým istým autom nič nespustí: porovnáva sa auto,
// nie udalosť.
import { lcdPlatnaHodnota } from "../../functions/autoVyber.js";
import { vclassAuto, adresaVclass, webPresmerovania, jeStrankaVclass, oznacPresmerovane, uzBolNaVclass } from "../../functions/vclassPresmerovanie.js";

export const MENO = "vclass-presmerovanie";
/** Čas na prečítanie oznámenia pred presmerovaním (ms). */
export const CAKANIE = 1500;
/** Change do tohto času po klávese na tom istom poli = zmena z klávesnice (ms). */
export const KLAVESNICA_MS = 600;
/** Odchod fokusu z polí auta pri oznámení z klávesnice: o toľko neskôr prepnúť na „ide“ (klik na „Pokračujte“ dobehne), ms. */
const ODCHOD_MS = 300;

/** Projekt Shoptetu webu (ctx.projectId) — modul beží len na svojom webe. */
const PROJEKT = { sk: "562035", cz: "581408" };

export const TEXTY_SK = {
  nadpis: "Pre Mercedes triedy V máme samostatnú stránku s cenou celého setu.",
  ide: "Presmerúvame Vás…",
  hned: "Prejsť hneď",
  klavesnica: "Prejdete na ňu klávesom Enter alebo tlačidlom Pokračujte ďalej.",
  odkaz: "Prejsť na stránku triedy V",
  hlasIde: "Presmerúvame Vás na ňu.",
};
/** CZ: tie isté podoby po česky (spisovne, vykanie s veľkým V; „Pokračujte dále“ = tlačidlo karty auta na CZ, texty-cz.js). */
export const TEXTY_CZ = {
  nadpis: "Pro Mercedes třídy V máme samostatnou stránku s cenou celé sady.",
  ide: "Přesměrováváme Vás…",
  hned: "Přejít hned",
  klavesnica: "Přejdete na ni klávesou Enter nebo tlačítkem Pokračujte dále.",
  odkaz: "Přejít na stránku třídy V",
  hlasIde: "Přesměrováváme Vás na ni.",
};
const SKRYTE = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0";

let zrus = null;

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  const web = webPresmerovania(); // "sk" | "cz" (len s CZ_SPUSTENE) | null
  if (!web || String(ctx.projectId) !== PROJEKT[web] || jeStrankaVclass()) return;
  const TEXTY = web === "cz" ? TEXTY_CZ : TEXTY_SK;
  /** Text pre čítačku obrazovky podľa podoby nápisu. */
  const HLAS = {
    ide: TEXTY.nadpis + " " + TEXTY.hlasIde,
    klavesnica: TEXTY.nadpis + " " + TEXTY.klavesnica,
  };
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
  let odchod = 0; // odklad prepnutia na „ide“ po odchode z polí auta (naOdchod)
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

  // ---------------------------------------------------------------- nápis
  function skry() {
    clearTimeout(casovac);
    casovac = 0;
    clearTimeout(odchod);
    odchod = 0;
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

  /** Nápis v podobe "ide" | "klavesnica": v otvorenej karte auta pod výberom auta, pri zavretej karte nad krokmi. */
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
    const ide = document.createElement("span");
    ide.className = "lcd1v-vclass__ide";
    ide.textContent = podoba === "ide" ? TEXTY.ide : TEXTY.klavesnica;
    riadok.appendChild(ide);
    const a = document.createElement("a");
    a.className = "lcd1v-vclass__a";
    a.href = url;
    a.textContent = podoba === "ide" ? TEXTY.hned : TEXTY.odkaz;
    a.addEventListener("click", oznacPresmerovane);
    if (podoba === "klavesnica") a.addEventListener("focusout", naOdchod);
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

  // ---------------------------------------------------------------- vynulovanie výberu auta (návrat z triedy V)
  const $ = window.jQuery || window.$;
  function posliChange(x) {
    if ($) $(x).trigger("change");
    else x.dispatchEvent(new Event("change", { bubbles: true }));
  }
  /** Značka, model, rok (a typ karosérie) na placeholder „Vyberte…“ (možnosť .notselect) a change ako pri výbere
   *  zákazníkom: main.js vyprázdni zoznam modelov a saveModel zmaže uložené auto, krok auta sa prepočíta. */
  function vynuluj() {
    skry();
    const typ = wrap.querySelector(".surcharge-list.type-selector select");
    [s[0], s[1], s[2], typ].forEach(function (x) {
      if (!x) return;
      const ph = x.querySelector("option.notselect");
      if (!ph || x.options[x.selectedIndex] === ph) return;
      ph.selected = true;
      posliChange(x);
    });
    posledne = kluc();
  }

  /** Auto pri načítaní alebo návrate Späť: trieda V u toho, kto na nej už bol -> vynulovať, inak na triedu V. */
  function priNavrate() {
    const v = auto();
    if (!v) return;
    if (uzBolNaVclass()) vynuluj();
    else ukaz(v, "ide");
  }

  function naZmenu(e) {
    const k = kluc();
    if (k === posledne) return; // to isté auto (aj change od Shoptetu po načítaní)
    posledne = k;
    const v = auto();
    if (!v) { skry(); return; }
    const t = e && e.target;
    const klavesnicou = !!t && Date.now() - (klavesy.get(t) || 0) <= KLAVESNICA_MS;
    ukaz(v, klavesnicou ? "klavesnica" : "ide");
  }

  // kláves na poli auta: čas (rozozná zmenu z klávesnice) a Enter = prejsť hneď (pri oznámení triedy V)
  function naKlaves(e) {
    if (e.key === "Enter" && zobrazene) {
      e.preventDefault();
      chod(adresaVclass(zobrazene));
      return;
    }
    klavesy.set(e.currentTarget, Date.now());
  }
  s.forEach((x) => x.addEventListener("keydown", naKlaves));

  // odchod z polí auta pri oznámení z klávesnice: trieda V ostala vybraná -> presmerovať (presun medzi značkou, modelom
  // a rokom alebo na odkaz v nápise nie). Prepnutie na „ide“ až o ODCHOD_MS: klik myšou na „Pokračujte ďalej“ vezme
  // fokus z poľa ešte pred klikom a nižší nápis „ide“ by tlačidlo posunul spod kurzora (klik by sa stratil, revízia
  // 9. 11. 2026); takto klik dobehne a naPokracuj presmeruje hneď. Fokus na samotné tlačidlo (Chrome, Firefox) = nič.
  function naOdchod(e) {
    if (rezim !== "klavesnica" || !zobrazene) return;
    const kam = e.relatedTarget;
    if (kam && (s.indexOf(kam) > -1 || (box && box.contains(kam)))) return;
    if (kam && kam.closest && kam.closest(".next-step-button") && kam.closest(".next-step-button").parentNode === krok) return;
    clearTimeout(odchod);
    odchod = setTimeout(function () {
      odchod = 0;
      if (rezim !== "klavesnica") return;
      const f = document.activeElement;
      if (f && (s.indexOf(f) > -1 || (box && box.contains(f)))) return; // fokus sa vrátil do polí auta alebo na odkaz
      const v = auto();
      if (v) ukaz(v, "ide");
    }, ODCHOD_MS);
  }
  s.forEach((x) => x.addEventListener("focusout", naOdchod));

  // „Pokračujte ďalej“ karty auta pri oznámení triedy V = prejsť hneď (aj počas odpočtu: klik myšou po zmene z klávesnice
  // najprv vezme fokus z poľa, naOdchod prepne na „ide“). Capture na window: skôr než živá validácia kroku, ktorá by inak
  // označila chýbajúci typ karosérie.
  function naPokracuj(e) {
    if (!zobrazene) return;
    const b = e.target && e.target.closest ? e.target.closest(".next-step-button") : null;
    if (!b || b.parentNode !== krok) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    chod(adresaVclass(zobrazene));
  }
  window.addEventListener("click", naPokracuj, true);

  // jQuery .trigger("change") natívny addEventListener nevolá, jQuery .on chytí oboje (main.js viaže tiež cez jQuery)
  if ($) $(s).on("change.lcdVclass", naZmenu);
  else s.forEach((x) => x.addEventListener("change", naZmenu));

  // Safari (aj Chrome) vráti stránku zo zálohy (Späť) aj s nápisom „Presmerúvame Vás…“: ako pri načítaní. Až po
  // pageshow v main.js (ten zosúladí selecty s uloženým autom), preto v ďalšom kroku.
  const naPageshow = function (e) {
    if (!e.persisted) return;
    setTimeout(function () {
      skry();
      posledne = kluc();
      priNavrate();
    }, 0);
  };
  window.addEventListener("pageshow", naPageshow);

  // auto uložené z predošlej stránky
  priNavrate();

  zrus = function () {
    skry();
    clearTimeout(hlasCas);
    if (hlas.parentNode) hlas.parentNode.removeChild(hlas);
    if ($) $(s).off("change.lcdVclass");
    else s.forEach((x) => x.removeEventListener("change", naZmenu));
    s.forEach((x) => { x.removeEventListener("keydown", naKlaves); x.removeEventListener("focusout", naOdchod); });
    window.removeEventListener("click", naPokracuj, true);
    window.removeEventListener("pageshow", naPageshow);
  };
}

/** Návrat na starý vzhľad (index.js zlozit): nápis aj oblasť pre čítačky preč, nič sa nepresmeruje. */
export function zlozit() {
  if (zrus) zrus();
  zrus = null;
}
