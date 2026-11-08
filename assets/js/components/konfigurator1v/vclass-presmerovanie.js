// Mercedes triedy V W447 (od roku 2014) v konfigurátore autokobercov 1V -> samostatná stránka triedy V (SK 646).
// Michal 8. 11. 2026: „aby ho to rovno prehodilo do produktu V-class“. Ktoré autá: functions/vclassPresmerovanie.js.
// Len SK (CZ produkt triedy V nemá), len nový vzhľad (modul typov jedno, dvoj, kufor-classic, kufor-premium v produkty.js;
// ?novy=0 ho nespustí), stránka triedy V ho nemá a nikdy nepresmerúva. Voľby vo formulári ani košík sa nemenia.
//
// Podoby (nápis v otvorenej karte auta pod výberom auta, pri zavretej karte nad krokmi; okno navrchu stránky):
//  - „ide“: zákazník na tejto stránke VYBERIE auto triedy V myšou alebo prstom (zmena značky, modelu alebo roku, po ktorej
//    je vo výbere trieda V od 2014) -> po 1,5 s presmerovanie (odkaz „Prejsť hneď“). Iné auto počas čakania ho zruší.
//  - „klavesnica“: tá istá zmena z klávesnice (na Windows mení šípka v zatvorenom selecte hodnotu a posiela change; kláves
//    na tom istom poli najviac 600 ms pred change). Bez odpočtu, aby zákazník s čítačkou pri prechádzaní rokov neodišiel:
//    prejde klávesom Enter v poli auta, tlačidlom „Pokračujte ďalej“ karty auta alebo odkazom.
//  - okno „Máte Mercedes triedy V?“ (Michal 8. 11. 2026 namiesto samostatného nápisu: „otvorí sa nejaké pop-up okno, ktoré
//    povie: určite máte Mercedes V Class? Máme samostatný konfigurátor, prejsť?“): zákazník už bol na stránke triedy V
//    (presmerovaný alebo tam má rozrobený výber), preto ho stránka znova sama nepošle (po Späť by vznikla slučka), ale
//    opýta sa: „Prejsť na konfigurátor triedy V“ (zelené) / „Zostať tu“ (Esc, × aj klik mimo okna = Zostať tu; voľby sa
//    nemenia). Kedy:
//      · výber triedy V myšou alebo prstom — vždy, okrem ďalšej zmeny v rámci triedy V po „Zostať tu“ (napr. oprava roka:
//        zákazník už odpovedal, okno by ho len zdržiavalo; iné auto a znova trieda V sa opýta znova),
//      · načítanie stránky s uloženým autom triedy V (návrat Späť, F5, príchod z inej stránky) — najviac raz za session na
//        produkte (functions/vclassPresmerovanie.js oknoBoloNa); keď tu okno už bolo, nezobrazí sa NIČ: zákazník sa už
//        rozhodol ostať (alebo tam bol a vrátil sa), samostatný nápis pod výberom auta Michal nechce a cesta na triedu V
//        ostáva (nový výber triedy V myšou sa opýta znova).
//  - „odkaz“ (nápis s odkazom): len zmena z klávesnice u zákazníka, ktorý už bol na stránke triedy V — okno by mu pri
//    prechádzaní rokov šípkami bralo fokus z poľa (prístupnosť), nápis s odkazom ostáva ako doteraz.
//  Auto triedy V uložené z predošlej stránky (sessionStorage) pri načítaní: „ide“, ak tam ešte nebol, inak okno (raz).
// Čítačky obrazovky: jedna stála oblasť aria-live (vložená pri štarte, prázdna), text nápisu sa do nej len zapíše. Okno
// ohlási čítačka sama (role="dialog", aria-modal, aria-labelledby + aria-describedby, fokus na „Prejsť“), do oblasti sa
// preto nepíše nič (inak by zaznelo dvakrát). Tab ostáva v okne, po zatvorení sa fokus vráti na pole auta.
// Change od Shoptetu po načítaní (handleBrowserValueRestoration) s tým istým autom nič nespustí: porovnáva sa auto,
// nie udalosť.
import { lcdPlatnaHodnota } from "../../functions/autoVyber.js";
import { vclassAuto, adresaVclass, jeSkWeb, jeStrankaVclass, oznacPresmerovane, uzBolNaVclass, oknoBoloNa, oznacOkno } from "../../functions/vclassPresmerovanie.js";

export const MENO = "vclass-presmerovanie";
/** Čas na prečítanie oznámenia pred presmerovaním (ms). */
export const CAKANIE = 1500;
/** Change do tohto času po klávese na tom istom poli = zmena z klávesnice (ms). */
export const KLAVESNICA_MS = 600;
/** Zatvorené okno: pozadie ešte toľko chytá ťuknutia (dvojťuknutie na „Zostať tu“ neprepadne na stránku pod ním), ms. */
const DOBEH_OKNA = 400;

const TEXTY = {
  nadpis: "Pre Mercedes triedy V máme samostatnú stránku s cenou celého setu.",
  ide: "Presmerúvame Vás…",
  hned: "Prejsť hneď",
  klavesnica: "Prejdete na ňu klávesom Enter alebo tlačidlom Pokračujte ďalej.",
  odkaz: "Prejsť na stránku triedy V",
  okno: {
    nadpis: "Máte Mercedes triedy V?",
    text: "Pre Mercedes triedy V (W447, od roku 2014) máme samostatný konfigurátor s cenou celého setu a šablónami pre dĺžky M, L aj XL.",
    ide: "Prejsť na konfigurátor triedy V",
    zostat: "Zostať tu",
    zavriet: "Zavrieť, zostať tu",
  },
};
/** Text pre čítačku obrazovky podľa podoby nápisu. */
const HLAS = {
  ide: TEXTY.nadpis + " Presmerúvame Vás na ňu.",
  klavesnica: TEXTY.nadpis + " " + TEXTY.klavesnica,
  odkaz: TEXTY.nadpis + " Odkaz na ňu je pod výberom auta.",
};
const SKRYTE = "position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0";
const OTVORENE = "lcd1v-vclass-okno-otvorene"; // trieda na body, kým je okno otvorené (rolovanie stránky a chat ustúpia)

let zrus = null;

/** @param {ReturnType<import("./ctx.js").vytvorCtx>} ctx */
export function init(ctx) {
  if (ctx.projectId !== "562035" || !jeSkWeb() || jeStrankaVclass()) return;
  const krok = ctx.krok("auto");
  const wrap = krok && krok.querySelector(".modl-selector-wrap");
  const sel = (k) => (wrap ? wrap.querySelector(".surcharge-list." + k + " select") : null);
  const s = [sel("brands"), sel("models"), sel("years")];
  if (!s[0] || !s[1] || !s[2]) return;
  const produkt = ctx.productId || window.location.pathname;

  const hodnoty = () => s.map((x) => lcdPlatnaHodnota(x) || "");
  const kluc = () => hodnoty().join("|");
  const auto = () => { const h = hodnoty(); return vclassAuto(h[0], h[1], h[2]); };

  let posledne = kluc();
  let casovac = 0;
  let box = null;
  let zobrazene = null;
  let rezim = null;
  /** otvorené okno: { el, pozadie, prvky: [×, Prejsť, Zostať tu], pole } */
  let okno = null;
  /** zákazník v okne zvolil „Zostať tu“ a auto je odvtedy stále trieda V: ďalšia zmena v triede V okno nevnucuje */
  let zostal = false;
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

  const viditelne = (e) => !!e && e.isConnected && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden";
  /** Pole auta pre fokus po zatvorení okna: pole, ktoré okno otvorilo, inak rok, inak hlavička karty „Vaše auto“. */
  function poleAuta(pole) {
    const kand = [pole, s[2], s[1], s[0], krok.querySelector(":scope > .lcd1v-hd")];
    for (let i = 0; i < kand.length; i++) if (viditelne(kand[i])) return kand[i];
    return null;
  }

  // ---------------------------------------------------------------- okno „Máte Mercedes triedy V?“
  function naKlavesOkna(e) {
    if (!okno) return;
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      e.stopPropagation();
      zostan();
      return;
    }
    if (e.key !== "Tab") return;
    // fokus ostáva v okne (aria-modal): × -> Prejsť -> Zostať tu -> ×
    const p = okno.prvky;
    const i = p.indexOf(document.activeElement);
    if (i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === p.length - 1)) {
      e.preventDefault();
      p[e.shiftKey ? p.length - 1 : 0].focus();
    }
  }
  // fokus, ktorý z okna predsa ujde (čítačka, klik do stmaveného pozadia), sa vráti dnu
  function naFokus(e) {
    if (okno && e.target && !okno.el.contains(e.target)) {
      try { okno.prvky[1].focus({ preventScroll: true }); } catch (x) { /* nič */ }
    }
  }

  function el(tag, trieda, text) {
    const e = document.createElement(tag);
    e.className = trieda;
    if (text) e.textContent = text;
    return e;
  }

  /** Okno „Máte Mercedes triedy V?“ pre auto v; pole = select, ktorým ho zákazník otvoril (fokus sa naň vráti). */
  function otvorOkno(v, pole) {
    skry(false);
    zobrazene = v;
    rezim = "okno";
    oznacOkno(produkt);
    const id = "lcd1v-vclass-okno-" + Date.now().toString(36);
    const pozadie = el("div", "lcd1v-vclass-pozadie");
    pozadie.setAttribute("aria-hidden", "true");
    const d = el("div", "lcd1v-vclass-okno");
    d.setAttribute("role", "dialog");
    d.setAttribute("aria-modal", "true");
    d.setAttribute("aria-labelledby", id + "-n");
    d.setAttribute("aria-describedby", id + "-t");
    const hd = el("div", "lcd1v-vclass-okno__hd");
    const n = el("h2", "lcd1v-vclass-okno__nadpis", TEXTY.okno.nadpis);
    n.id = id + "-n";
    const x = el("button", "lcd1v-vclass-okno__x", "×");
    x.type = "button";
    x.setAttribute("aria-label", TEXTY.okno.zavriet);
    hd.appendChild(n);
    hd.appendChild(x);
    const t = el("p", "lcd1v-vclass-okno__text", TEXTY.okno.text);
    t.id = id + "-t";
    const ide = el("a", "lcd1v-vclass-okno__ide", TEXTY.okno.ide);
    ide.href = adresaVclass(v);
    const zostat = el("button", "lcd1v-vclass-okno__zostat", TEXTY.okno.zostat);
    zostat.type = "button";
    d.appendChild(hd);
    d.appendChild(t);
    d.appendChild(ide);
    d.appendChild(zostat);

    ide.addEventListener("click", oznacPresmerovane); // odkaz: prehliadač prejde sám (aj nová karta kolieskom)
    x.addEventListener("click", zostan);
    zostat.addEventListener("click", zostan);
    pozadie.addEventListener("click", function () { if (okno && okno.pozadie === pozadie) zostan(); });

    document.body.appendChild(pozadie);
    document.body.appendChild(d);
    okno = { el: d, pozadie: pozadie, prvky: [x, ide, zostat], pole: pole || null };
    document.addEventListener("keydown", naKlavesOkna, true);
    document.addEventListener("focusin", naFokus, true);
    document.body.classList.add(OTVORENE);
    void d.offsetWidth; // prechod (CSS) od zatvoreného stavu
    pozadie.classList.add("lcd1v-vclass-pozadie--otvorene");
    d.classList.add("lcd1v-vclass-okno--otvorene");
    ohlas(""); // okno ohlási čítačka cez dialóg
    try { ide.focus({ preventScroll: true }); } catch (e) { /* nič */ }
  }

  /** Zatvorí okno (bez zmeny volieb); vratFokus = fokus späť na pole auta. */
  function zavriOkno(vratFokus) {
    if (!okno) return;
    const o = okno;
    okno = null;
    document.removeEventListener("keydown", naKlavesOkna, true);
    document.removeEventListener("focusin", naFokus, true);
    document.body.classList.remove(OTVORENE);
    o.el.classList.remove("lcd1v-vclass-okno--otvorene");
    o.pozadie.classList.remove("lcd1v-vclass-pozadie--otvorene");
    setTimeout(function () {
      if (o.el.parentNode) o.el.parentNode.removeChild(o.el);
      if (o.pozadie.parentNode) o.pozadie.parentNode.removeChild(o.pozadie);
    }, DOBEH_OKNA);
    if (vratFokus) {
      const ciel = poleAuta(o.pole);
      try { if (ciel) ciel.focus({ preventScroll: true }); } catch (e) { /* nič */ }
    }
  }

  /** „Zostať tu“ (aj Esc, ×, klik mimo okna): okno preč, voľby ostanú, zákazník pokračuje v tomto konfigurátore. */
  function zostan() {
    if (!okno) return;
    zostal = true;
    skry(true);
  }

  // ---------------------------------------------------------------- nápis
  function skry(vratFokus) {
    clearTimeout(casovac);
    casovac = 0;
    if (box && box.parentNode) box.parentNode.removeChild(box);
    box = null;
    zobrazene = null;
    rezim = null;
    zavriOkno(vratFokus);
    ohlas("");
  }

  function chod(url) {
    clearTimeout(casovac);
    casovac = 0;
    oznacPresmerovane();
    window.location.assign(url);
  }

  /** Nápis v podobe "ide" | "klavesnica" | "odkaz": v otvorenej karte auta pod výberom auta, pri zavretej karte nad krokmi. */
  function ukaz(v, podoba) {
    skry(false);
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
    if (!v) { zostal = false; skry(!!okno); return; }
    const t = e && e.target;
    const klavesnicou = !!t && Date.now() - (klavesy.get(t) || 0) <= KLAVESNICA_MS;
    if (!uzBolNaVclass()) { ukaz(v, klavesnicou ? "klavesnica" : "ide"); return; }
    if (klavesnicou) { ukaz(v, "odkaz"); return; } // klávesnica: okno by bralo fokus z poľa pri prechádzaní rokov
    if (zostal) { skry(false); return; } // už odpovedal „Zostať tu“, auto je stále trieda V
    otvorOkno(v, t && s.indexOf(t) > -1 ? t : null);
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

  // Safari (aj Chrome) vráti stránku zo zálohy (Späť) aj s nápisom „Presmerúvame Vás…“ alebo s otvoreným oknom: ako pri
  // načítaní — okno, ak tu ešte nebolo, inak nič (žiadna slučka, žiadny samostatný nápis)
  const naPageshow = function (e) {
    if (!e.persisted || (!zobrazene && !okno)) return;
    const v = auto();
    skry(false);
    if (v && !oknoBoloNa(produkt)) otvorOkno(v, null);
  };
  window.addEventListener("pageshow", naPageshow);

  // auto uložené z predošlej stránky
  const pri = auto();
  if (pri) {
    if (!uzBolNaVclass()) ukaz(pri, "ide");
    else if (!oknoBoloNa(produkt)) otvorOkno(pri, null);
  }

  zrus = function () {
    skry(false);
    clearTimeout(hlasCas);
    if (hlas.parentNode) hlas.parentNode.removeChild(hlas);
    Array.prototype.forEach.call(document.querySelectorAll(".lcd1v-vclass-okno, .lcd1v-vclass-pozadie"), function (x) { x.parentNode.removeChild(x); });
    document.body.classList.remove(OTVORENE);
    if ($) $(s).off("change.lcdVclass");
    else s.forEach((x) => x.removeEventListener("change", naZmenu));
    s.forEach((x) => x.removeEventListener("keydown", naKlaves));
    window.removeEventListener("click", naPokracuj, true);
    window.removeEventListener("pageshow", naPageshow);
  };
}

/** Návrat na starý vzhľad (index.js zlozit): nápis, okno aj oblasť pre čítačky preč, nič sa nepresmeruje. */
export function zlozit() {
  if (zrus) zrus();
  zrus = null;
}
