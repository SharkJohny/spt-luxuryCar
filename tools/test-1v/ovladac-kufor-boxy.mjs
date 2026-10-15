// Ovládač krokov 5–6 (rohož do kufra, boxy). VLASTNÍK: worker „kufor-boxy“
// (assets/js/components/konfigurator1v/kufor-boxy.js + assets/css/_lcd1v-kufor-boxy.scss + assets/js/lcdKosikDoplnok.js).
// Kontrakt: docs/1v-kontrakt.md. `stary` = živá stránka (referencia, nemeniť). `novy` = nový vzhľad; kým je null,
// --novy použije `stary`.
//
// Druhy kufra: "classic" (dno), "premium" (dno + boky), "nie". Veľkosti boxu: "S" | "M" | "L" | "XL".
import { pauza } from "./cdp.mjs";
import { F, otvorKrok, hodnota } from "./stary-ui.mjs";

export const VZOR_KUFRA = { classic: /^(?!.*bok).*dno/i, premium: /bok/i, nie: /^(nie|ne)\b/i };
const vzorVelkosti = (v) => new RegExp("^" + v + "\\s*:", "i");

async function viditelny(t, sel) {
  return t.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); return !!(e && e.offsetHeight > 0 && getComputedStyle(e).visibility !== "hidden"); })()`);
}

export const stary = {
  meno: "stary",

  /** Starý vzhľad: kufor aj boxy sú skryté, kým zákazník nevyberie rozloženie (nevybrané = do košíka „nič“). */
  skryteNaZaciatku: true,

  /** { kufor: viditeľný?, boxy: viditeľné? } */
  async stav(t) {
    return { kufor: await viditelny(t, `${F} .upsale-buttons.trunk`), boxy: await viditelny(t, `${F} .upsale-buttons.boxs`) };
  },

  /** Vyberie rohož do kufra -> value v selecte kufra. */
  async vyberKufor(t, druh) {
    const id = await t.idParametra("kufor");
    const v = await t.moznost("kufor", VZOR_KUFRA[druh]);
    await otvorKrok(t, "kufor");
    await t.klikni(`${F} .upsale-buttons.trunk .upsale-button[value="${id}-${v}"]`, { popis: "kufor " + druh });
    await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${v}"`, { popis: "kufor vo formulári" });
    await pauza(400);
    return v;
  },

  /**
   * Vyberie boxy: { pocet: 0|1|2, farba: index farby boxov, velkost: "S".."XL", velkost2 (2. box, inak = velkost) }
   * -> { farbaBoxov, box1, box2, boxSolo } hodnoty selectov po výbere.
   */
  async vyberBoxy(t, { pocet, farba = 0, velkost = "S", velkost2 } = {}) {
    if (!(await viditelny(t, `${F} .upsale-buttons.boxs`))) {
      // boxy sa ukážu po výbere kufra alebo tlačidlom „Prejsť k ďalšiemu kroku“ v kroku kufra
      await otvorKrok(t, "kufor");
      await t.klikni(`${F} .upsale-buttons.trunk > .next-step-button`, { popis: "ďalší krok z kufra" });
      await t.cakaj(`(document.querySelector("${F} .upsale-buttons.boxs") || {}).offsetHeight > 0`, { popis: "krok boxov" });
    }
    await otvorKrok(t, "boxy");
    const karta = pocet === 2 ? "conf2" : pocet === 1 ? "conf1" : "0";
    await t.klikni(`${F} .upsale-buttons.boxs > .parameter-cars > .upsale-button[value="${karta}"]`, { popis: "boxy " + pocet });
    if (pocet) {
      await t.cakaj(`document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "výber farby a veľkosti boxov" });
      await pauza(300);
      const idF = await t.idParametra("farbaBoxov");
      await t.klikni(`${F} .box-config .parameter-wrap.parameter-${idF} .option-button`, { index: farba, popis: "farba boxov" });
      await t.cakaj(`!!(document.querySelector('${F} select[data-parameter-id="${idF}"]') || {}).value`, { ms: 10000, popis: "farba boxov vo formulári" });
      const velkosti = pocet === 2 ? [["box1", velkost], ["box2", velkost2 || velkost]] : [["boxSolo", velkost]];
      for (const [kluc, v] of velkosti) {
        const id = await t.idParametra(kluc);
        const val = await t.moznost(kluc, vzorVelkosti(v));
        await t.klikni(`${F} .box-config .option-button[data-variant="${id}"][data-value="${val}"]`, { popis: kluc + " " + v });
      }
      await t.klikni(`${F} .box-config .close-btn.return`, { popis: "potvrdiť boxy" });
      await pauza(400);
    }
    return {
      farbaBoxov: await hodnota(t, "farbaBoxov"),
      box1: await hodnota(t, "box1"),
      box2: await hodnota(t, "box2"),
      boxSolo: await hodnota(t, "boxSolo"),
    };
  },
};

// ------------------------------------------------------------------ nový vzhľad (?novy=1)
// Kroky 5–6 podľa návrhu v26 (assets/js/components/konfigurator1v/kufor-boxy.js): karty Classic / Premium / Nechcem
// a 1× / 2× box / Nechcem (.lcd1v-kb__karta), okno boxov = živý .box-config preštýlovaný (farby, veľkosti S–XL,
// „Potvrďte výber boxov“ .lcd1v-bx__ok, krížik .lcd1v-bx__x). Klik len na to, čo vidí zákazník.
const KB = (krok) => `${F} .upsale-buttons.${krok === "kufor" ? "trunk" : "boxs"}`;
const KARTA_KUFRA = (druh) => `${KB("kufor")} .lcd1v-kb__karta[data-kufor="${druh}"]`;
const KARTA_BOXOV = (pocet) => `${KB("boxy")} .lcd1v-kb__karta[data-boxy="${pocet}"]`;
const OKNO = `${F} .upsale-Banner.lcd1v-kb .box-config`;

/** Karta je naozaj viditeľná a nezrezaná zbaleným krokom (akordeón). */
async function kartaVidno(t, sel) {
  return t.ev(`(function () {
    var e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false;
    var r = e.getBoundingClientRect(); if (r.height < 40 || getComputedStyle(e).visibility === "hidden") return false;
    var p = e.parentElement;
    while (p && p !== document.body) {
      var c = getComputedStyle(p);
      if (c.display === "none") return false;
      if (c.overflow !== "visible" || c.overflowY !== "visible") { var q = p.getBoundingClientRect(); if (r.bottom > q.bottom + 1 || r.top < q.top - 1) return false; }
      p = p.parentElement;
    }
    return true;
  })()`);
}

/** Otvorí krok 5/6, ak je zbalený: klik na hlavičku kroku (nový vzhľad: hlavička krokov patrí workerovi „kroky“). */
async function otvorKrokNovy(t, krok, karta) {
  if (await kartaVidno(t, karta)) return;
  const sel = KB(krok);
  const hlavicka = await t.ev(`(function () {
    var s = document.querySelector(${JSON.stringify(sel)}); if (!s) return null;
    // nový obal krokov (worker „kroky“): živý .order roztiahnutý cez hlavičku .lcd1v-hd = živý akordeón
    var k = [":scope > .order", ":scope > .lcd1v-hd", ":scope > h5.variant.name"];
    for (var i = 0; i < k.length; i++) { var e = s.querySelector(k[i]); if (e && e.getBoundingClientRect().height > 0) return k[i].replace(":scope", ""); }
    return null;
  })()`);
  if (hlavicka) await t.klikni(sel + hlavicka, { popis: "hlavička kroku " + krok, vRamci: sel });
  else await otvorKrok(t, krok);
  await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(karta)}); return !!(e && e.getBoundingClientRect().height > 40); })()`, { popis: "otvorený krok " + krok });
  await pauza(450);
}

async function oknoOtvorene(t) {
  return t.ev(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && e.closest(".upsale-Banner").classList.contains("showConf") && getComputedStyle(e).visibility === "visible"); })()`);
}

/**
 * Vzhľad karty podľa návrhu E (Michal 15. 10. 2026): odporúčaná karta kroku má široký pás s vetou „… najčastejšie“;
 * cenovka označenej karty sedí sama so sebou — veľká cena v sete, „Samostatne“ s prečiarknutou cenou a „Ušetríte“
 * idú spolu a Ušetríte = Samostatne − V sete (presne = vybraný kufor / boxy s veľkosťou: „+ N €“). Ceny sú zo živej
 * stránky, nič natvrdo; „Samostatne“ sa načíta neskôr (pred načítaním sa kontroluje len cena v sete).
 */
async function overKartu(t, karta, { presne }) {
  const r = await t.ev(`(function () {
    var k = document.querySelector(${JSON.stringify(karta)}); if (!k) return "karta chýba";
    var veta = k.closest(".lcd1v-kb").querySelector(".lcd1v-kb__karta--naj > .lcd1v-kb__top > .lcd1v-kb__veta");
    if (!veta || !/najčastejšie/i.test(veta.textContent)) return "odporúčaná karta nemá zlatý pás s vetou „… najčastejšie“";
    // Michal 15. 10. 2026: obľúbená varianta vždy v strede — kufor Premium, Classic (★), Nechcem; boxy 1×, 2× (★), Nechcem
    var kb = k.closest(".lcd1v-kb"), volby = kb.querySelectorAll(".lcd1v-kb__volby > .lcd1v-kb__karta");
    var poradie = [].map.call(volby, function (x) { return x.getAttribute("data-kufor") || x.getAttribute("data-boxy"); }).join(",");
    var cakam = kb.getAttribute("data-lcd1v-kb") === "kufor" ? "premium,classic,nie" : "1,2,0";
    if (poradie !== cakam) return "poradie kariet " + poradie + " ≠ " + cakam;
    if (!volby[1].classList.contains("lcd1v-kb__karta--naj") || kb.querySelectorAll(".lcd1v-kb__karta--naj").length !== 1) return "odporúčaná karta nie je v strede";
    var r = [].map.call(volby, function (x) { return x.getBoundingClientRect(); });
    if (r.every(function (q) { return q.height > 0; }) && !(r[0].top < r[1].top && r[1].top < r[2].top)) return "karty nie sú na obrazovke pod sebou v poradí DOM: " + r.map(function (q) { return Math.round(q.top); }).join(" / ");
    var cb = k.querySelector(".lcd1v-kb__cb"); if (!cb) return ""; // Nechcem: bez cenovky
    var num = function (s) { var m = /(\\d[\\d\\s\\u00a0]*(?:,\\d+)?)/.exec(s || ""); return m ? Number(m[1].replace(/[\\s\\u00a0]/g, "").replace(",", ".")) : NaN; };
    var c = cb.querySelector(".lcd1v-kb__cb-c").textContent, s = cb.querySelector(".lcd1v-kb__cb-s"), u = cb.querySelector(".lcd1v-kb__cb-u");
    if (!(num(c) > 0)) return "cena v sete chýba: " + c;
    if (${presne ? "true" : "false"} && !/^\\+\\s/.test(c)) return "cena v sete nie je presná „+ N €“: " + c;
    if (s.hidden !== u.hidden) return "„Samostatne“ a „Ušetríte“ nie sú zobrazené spolu";
    if (s.hidden) return "";
    var pr = s.querySelector("s");
    if (!pr || getComputedStyle(pr).textDecorationLine.indexOf("line-through") < 0) return "cena samostatne nie je prečiarknutá";
    if (${presne ? "true" : "false"} && Math.abs(num(pr.textContent) - num(c) - num(u.textContent)) > 0.01) return "Ušetríte ≠ Samostatne − V sete: " + [c, s.textContent, u.textContent].join(" / ");
    return "";
  })()`);
  if (r) throw new Error("karta " + karta.replace(/^.*\[/, "[") + ": " + r);
}

async function hodnotyBoxov(t) {
  return {
    farbaBoxov: await hodnota(t, "farbaBoxov"),
    box1: await hodnota(t, "box1"),
    box2: await hodnota(t, "box2"),
    boxSolo: await hodnota(t, "boxSolo"),
  };
}

/** Vyberie farbu a veľkosti v otvorenom okne (klik na vzorku / kartu veľkosti). */
async function vyplnOkno(t, { pocet, farba = 0, velkost = "S", velkost2 }) {
  const idF = await t.idParametra("farbaBoxov");
  await t.klikni(`${OKNO} .parameter-wrap.parameter-${idF} .option-button`, { index: farba, popis: "farba boxov" });
  await t.cakaj(`!!(document.querySelector('${F} select[data-parameter-id="${idF}"]') || {}).value`, { ms: 10000, popis: "farba boxov vo formulári" });
  const velkosti = pocet === 2 ? [["box1", velkost], ["box2", velkost2 || velkost]] : [["boxSolo", velkost]];
  for (const [kluc, v] of velkosti) {
    const id = await t.idParametra(kluc);
    const val = await t.moznost(kluc, vzorVelkosti(v));
    await t.klikni(`${OKNO} .option-button[data-variant="${id}"][data-value="${val}"]`, { popis: kluc + " " + v });
    await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${val}"`, { ms: 10000, popis: kluc + " vo formulári" });
  }
}

export const novy = {
  meno: "novy",

  /** Nový vzhľad: kroky 5 a 6 sú viditeľné od začiatku (nevybrané = Nechcem, do košíka „nič“). */
  skryteNaZaciatku: false,

  async stav(t) {
    return { kufor: await viditelny(t, KB("kufor")), boxy: await viditelny(t, KB("boxy")) };
  },

  /** Klik na kartu Classic / Premium / Nechcem -> value v selecte kufra ("" alebo „nie“ pri Nechcem bez predošlého výberu). */
  async vyberKufor(t, druh) {
    const id = await t.idParametra("kufor");
    const karta = KARTA_KUFRA(druh);
    await otvorKrokNovy(t, "kufor", karta);
    await t.klikni(karta, { popis: "kufor " + druh });
    if (druh === "nie") {
      const nie = await t.moznost("kufor", VZOR_KUFRA.nie);
      await t.cakaj(`(function () { var v = (document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value; return v === "" || v === "${nie}"; })()`, { popis: "kufor Nechcem vo formulári" });
    } else {
      const v = await t.moznost("kufor", VZOR_KUFRA[druh]);
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${v}"`, { popis: "kufor vo formulári" });
    }
    await t.cakaj(`(document.querySelector(${JSON.stringify(karta)}) || {}).getAttribute && document.querySelector(${JSON.stringify(karta)}).getAttribute("aria-pressed") === "true"`, { ms: 15000, popis: "karta kufra označená" });
    await pauza(400);
    await overKartu(t, karta, { presne: true });
    return hodnota(t, "kufor");
  },

  /** { pocet: 0|1|2, farba, velkost, velkost2 } -> klik na kartu počtu, v okne farba + veľkosti + „Potvrďte výber boxov“. */
  async vyberBoxy(t, { pocet, farba = 0, velkost = "S", velkost2 } = {}) {
    const karta = KARTA_BOXOV(pocet || 0);
    await otvorKrokNovy(t, "boxy", karta);
    await t.klikni(karta, { popis: "boxy " + (pocet || 0) });
    if (pocet) {
      await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && e.closest(".upsale-Banner").classList.contains("showConf") && getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1"); })()`, { popis: "okno boxov" });
      await pauza(300);
      await vyplnOkno(t, { pocet, farba, velkost, velkost2 });
      await t.klikni(`${OKNO} .lcd1v-bx__ok`, { popis: "Potvrďte výber boxov" });
      await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "okno boxov zavreté po potvrdení" });
    } else {
      await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "bez okna pri Nechcem" });
    }
    await t.cakaj(`document.querySelector(${JSON.stringify(karta)}).getAttribute("aria-pressed") === "true"`, { ms: 15000, popis: "karta boxov označená" });
    await pauza(400);
    await overKartu(t, karta, { presne: !!pocet });
    return hodnotyBoxov(t);
  },

  /**
   * G10b (len nový vzhľad): karta počtu -> farba + veľkosť -> krížik BEZ potvrdenia.
   * -> { hodnoty: {farbaBoxov, box1, box2, boxSolo}, oznacena: číslo označenej karty počtu (0 = Nechcem) alebo null }
   */
  async zavriVyberKrizikom(t, { pocet = 1, farba = 0, velkost = "S", velkost2 } = {}) {
    const karta = KARTA_BOXOV(pocet);
    await otvorKrokNovy(t, "boxy", karta);
    await t.klikni(karta, { popis: "boxy " + pocet });
    await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(OKNO)}); return !!(e && getComputedStyle(e).visibility === "visible" && getComputedStyle(e).opacity === "1"); })()`, { popis: "okno boxov" });
    await pauza(300);
    await vyplnOkno(t, { pocet, farba, velkost, velkost2 });
    await t.klikni(`${OKNO} .lcd1v-bx__x`, { popis: "krížik okna boxov" });
    await t.cakaj(`!document.querySelector("${F} .upsale-Banner").classList.contains("showConf")`, { popis: "okno boxov zavreté krížikom" });
    await pauza(900);
    const oznacena = await t.ev(`(function () { var e = document.querySelector('${KB("boxy")} .lcd1v-kb__karta[aria-pressed="true"]'); var n = e ? Number(e.getAttribute("data-boxy")) : null; return n ? n : null; })()`);
    return { hodnoty: await hodnotyBoxov(t), oznacena, okno: await oknoOtvorene(t) };
  },
};
