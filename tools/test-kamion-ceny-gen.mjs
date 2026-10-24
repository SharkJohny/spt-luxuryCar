#!/usr/bin/env node
// Test (a2) ceny kamiónov proti ŽIVÉMU Reactu: port artefaktu kamiony-app/work/kontrola-cien.mjs (docs/kamiony-1v-plan.md
// §5 (a)). Pre všetky kombinácie 13 značiek × 6 materiálov × 4 nášivky × tapacír × nášivka na dverách (1 040) + neúplné
// stavy porovnáva:
//   A) kamion/cena.js (nové UI: súhrn, lišta, karty)
//   B) calculatePrice z konfigurator.gen.jsx (React PC)  a  B') z konfigurator.phone.gen.jsx (React telefón)
//   C) košík Shoptetu po React syncToShoptet (fixture 640)  a  D) košík po syncToShoptet(naStavReactu(S)) nového UI
// Očakávané: A = B okrem zámerných opráv Z1 (nášivka na dverách po tapacír → Nie) a Z2 (úspora pri jednej strane);
// C = D = A.spolu vždy (zákazník zaplatí to, čo vidí); hodnoty všetkých 15 selectov C a D zhodné.
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { FIXTURE, nacitajModul, nacitajGen } from "./test-1v/kamion-spolocne.mjs";

if (!readFileSync(new URL("../assets/js/truck-konfigurator/konfigurator.gen.jsx", import.meta.url)).length) throw new Error("chýba .gen.jsx — spusti node truck/build-truck-images.mjs");
const C = await nacitajModul("assets/js/components/konfigurator1v/kamion/cena.js");
const SH = await nacitajModul("assets/js/components/konfigurator1v/kamion/shoptet.js");
const ST = await nacitajModul("assets/js/components/konfigurator1v/kamion/stav.js");
const DA = await nacitajModul("assets/js/components/konfigurator1v/kamion/data.js");

const HTML = readFileSync(FIXTURE, "utf8");
const okno = () => new JSDOM(HTML, { url: "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/" }).window;

const NALEZY = [];
const ZAMERNE = { Z1: 0, Z2: 0 };
let okPocet = 0;
const nalez = (kde, text) => { NALEZY.push(kde + ": " + text); };
const over = (kde, podm, text) => { if (podm) okPocet++; else nalez(kde, text); };
const J = (x) => JSON.stringify(x);

// ------------------------------------------------------------------ živé ceny
const wZ = okno();
const desk = nacitajGen("konfigurator.gen.jsx", wZ);
const tel = nacitajGen("konfigurator.phone.gen.jsx", wZ);
const PR = desk.readShoptetPrices(desk.FALLBACK_PRICES), PRt = tel.readShoptetPrices(tel.FALLBACK_PRICES);
const ceny = SH.citajCeny(wZ.document);
const D = { ceny, vozidla: { znacky: DA.ZNACKY } };
over("ceny", PR.BASE === ceny.zaklad_eur && J(PR.MATERIAL) === J(ceny.priplatky.material) && J(PR.NASIVKY) === J(ceny.priplatky.nasivky_rozlozenie) &&
  PR.TAPACIR_BUNDLE === ceny.priplatky.tapacir_balik && PR.NASIVKA_DVERE === ceny.priplatky.nasivka_na_dverach,
  "citajCeny ≠ readShoptetPrices: " + J(ceny.priplatky) + " vs " + J(PR));
over("ceny PC = telefón", J(PR) === J(PRt), J(PR) + " ≠ " + J(PRt));
over("prečiarknuté = React", ceny.preciarknute_ceny.tapacir === PR.TAPACIR_SAMO && ceny.preciarknute_ceny.nasivka_na_dverach === PR.NASIVKA_DVERE_SAMO &&
  ceny.preciarknute_ceny.nasivky_sofer_spolujazdec === PR.NASIVKY_SAMO.boky && ceny.preciarknute_ceny.nasivky_len_stred === PR.NASIVKY_SAMO.stred,
  J(ceny.preciarknute_ceny) + " vs " + J([PR.TAPACIR_SAMO, PR.NASIVKA_DVERE_SAMO, PR.NASIVKY_SAMO]));

// ------------------------------------------------------------------ normalizácia (ako artefakt)
const NAS = ["nechcem", "stred", "boky", "boky+stred"];
const MAT = DA.MATERIALY.map((m) => m.nazov);
const ZNACKY = DA.ZNACKY.map((z) => z.kluc);
const TIR = (k) => /\(TIR\)/i.test(k || "");
function riadkyZivo(r) {
  return r.breakdown.filter((b) => b.type === "base" || b.amount !== 0 || b.originalAmount != null).map((b) => {
    const id = b.type === "base" ? "zaklad" : /^Materiál/.test(b.label) ? "material" : b.label === "Tapacír dverí" ? "tapacir"
      : b.label === "Nášivka na dverách" ? "nasivka_dvere" : /^Nášiv/.test(b.label) ? "nasivky" : "?" + b.label;
    return [id, b.amount, b.originalAmount != null ? b.originalAmount : null];
  });
}
const zivoSuhrn = (r) => ({ spolu: r.total, usetrene: r.savings, povodne: r.originalTotal, pct: r.originalTotal > 0 ? Math.round((r.savings / r.originalTotal) * 100) : 0, riadky: riadkyZivo(r) });
const riadkyCena = (r) => r.riadky.filter((x) => x.id === "zaklad" || x.suma !== 0 || x.povodna != null).map((x) => [x.id, x.suma, x.povodna]);
const cenaSuhrn = (r) => ({ spolu: r.spolu, usetrene: r.usetrene, povodne: r.povodneSpolu, pct: r.usetrenePercent, riadky: riadkyCena(r) });
/** Zámerné rozdiely: z výsledku cena.js odvodí, čo by ukázal React; zhoda potom = rozdiel je LEN Z1/Z2. */
function akoZivo(c, st) {
  const x = { spolu: c.spolu, povodne: c.povodne, riadky: c.riadky.map((r) => r.slice()) }, z = [];
  if (st.nas === "stred" || st.nas === "boky") {
    const r = x.riadky.find((q) => q[0] === "nasivky");
    if (r && r[2] != null) { x.povodne -= r[2] - r[1]; r[2] = null; z.push("Z2"); }
  }
  if (TIR(st.znacka) && st.tap === "nie" && st.dvere === true) {
    x.spolu += ceny.priplatky.nasivka_na_dverach;
    x.povodne += ceny.preciarknute_ceny.nasivka_na_dverach;
    x.riadky.push(["nasivka_dvere", ceny.priplatky.nasivka_na_dverach, ceny.preciarknute_ceny.nasivka_na_dverach]);
    z.push("Z1");
  }
  x.usetrene = Math.max(0, x.povodne - x.spolu);
  x.pct = x.povodne > 0 ? Math.round((x.usetrene / x.povodne) * 100) : 0;
  return { vysl: x, z };
}
const rovnake = (a, b) => a.spolu === b.spolu && a.usetrene === b.usetrene && a.povodne === b.povodne && (a.usetrene === 0 || a.pct === b.pct) && J(a.riadky) === J(b.riadky);
const kratko = (s) => ({ spolu: s.spolu, usetrene: s.usetrene, povodne: s.povodne, pct: s.pct, riadky: s.riadky });
function zivyStav(st) {
  const tir = TIR(st.znacka);
  return {
    znacka: st.znacka, model: st.znacka ? "Model" : null, extras: {},
    selectedMaterial: st.material, selectedColor: null, selectedLemovanie: null,
    nasivkyPlacement: st.nas, selectedNasivka: null, selectedNitColor: null, selectedStredNasivka: null, selectedStredNitColor: null,
    doorPanelChoice: tir ? st.tap : null, doorMaterial: null, doorColor: null, doorLemovanie: null,
    doorWantsNasivka: tir ? st.dvere : null, doorNasivka: null, doorNitColor: null,
  };
}
const cenaStav = (st) => ({ typ: st.typ, znacka: st.znacka, material: st.material, nasivky: st.nas, tapacir: st.tap, nasivkaDvere: st.dvere === true });

/** Stav S nového UI pre kombináciu (prvý model značky, prvá farba, lem 01, H19 / 2999, tapacír ako koberce). */
function stavUi(st) {
  const S = ST.novyStav();
  S.typ = st.typ;
  if (st.znacka) {
    const z = DA.ZNACKY.find((x) => x.kluc === st.znacka);
    S.znacka = z.kluc; S.model = z.modely[0].nazov; S.polia = Object.assign({}, z.modely[0].auto_vybrane);
    Object.keys(z.modely[0].polia).forEach((p) => { if (!S.polia[p]) S.polia[p] = z.modely[0].polia[p][0]; });
  }
  if (st.material) { S.material = st.material; S.farba = DA.MATERIALY.find((m) => m.nazov === st.material).farby[0].kod; }
  S.lem = "01";
  S.nas = st.nas || null;
  S.nasBoky = { motiv: "H19", nit: "2999" }; S.nasStred = { motiv: "H19", nit: "2999" };
  S.tap = st.tap || null;
  S.tapNas = st.dvere == null ? null : st.dvere;
  S.tapNasMotiv = "H19"; S.tapNasNit = "2999";
  return S;
}
function kosik(w, fn) {
  const doc = w.document;
  doc.querySelectorAll("select").forEach((s) => { s.value = ""; });
  fn();
  let suma = SH.zakladnaCena(doc);
  const vybrane = {};
  doc.querySelectorAll("select[data-parameter-id]").forEach((s) => {
    const o = s.selectedOptions[0];
    vybrane[s.getAttribute("data-parameter-id")] = o && o.value ? o.textContent.trim() : "";
    if (o && o.value) suma += desk._parseOptionPrice(o.textContent).price;
  });
  return { suma, vybrane };
}

// ------------------------------------------------------------------ 1) všetky úplné kombinácie
const kombinacie = [];
for (const znacka of ZNACKY) for (const material of MAT) for (const nas of NAS) for (const tap of ["nie", "ano"]) for (const dvere of [false, true])
  kombinacie.push({ typ: TIR(znacka) ? "kamion" : "dodavka", znacka, material, nas, tap, dvere });

const wR = okno(), wN = okno();
const kosikR = nacitajGen("konfigurator.gen.jsx", wR);
const stat = { zhoda: 0, Z1: 0, Z2: 0, "Z1+Z2": 0, nalez: 0, kosikZhoda: 0, selectyZhoda: 0 };
function porovnajKosik(kde, st, c) {
  const S = stavUi(st);
  const tir = TIR(st.znacka);
  // React: rovnaký výber ako nové UI (adaptér), aby sa porovnali presne tie isté selecty
  const finalReact = ST.naStavReactu(S);
  const kR = kosik(wR, () => kosikR.syncToShoptet(finalReact));
  globalThis.document = wN.document; globalThis.Event = wN.Event; globalThis.sessionStorage = wN.sessionStorage;
  const kN = kosik(wN, () => SH.syncToShoptet(ST.naStavReactu(S)));
  if (kN.suma === c.spolu && kR.suma === c.spolu) stat.kosikZhoda++;
  else nalez("košík", kde + ": nové " + kN.suma + " €, React " + kR.suma + " €, cena.js " + c.spolu + " € " + J(kN.vybrane));
  if (J(kN.vybrane) === J(kR.vybrane)) stat.selectyZhoda++;
  else nalez("selecty", kde + ": nové " + J(kN.vybrane) + " ≠ React " + J(kR.vybrane));
  void tir;
}
for (const st of kombinacie) {
  const kde = `${st.znacka} | ${st.material} | ${st.nas} | tapacír ${st.tap} | dvere ${st.dvere}`;
  const c = cenaSuhrn(C.vypocitajCenu(cenaStav(st), D));
  const zd = zivoSuhrn(desk.calculatePrice(zivyStav(st), PR));
  const zt = zivoSuhrn(tel.calculatePrice(zivyStav(st), PRt));
  over("PC vs telefón", rovnake(zd, zt), kde + ": React PC " + J(kratko(zd)) + " ≠ telefón " + J(kratko(zt)));
  if (rovnake(c, zd)) stat.zhoda++;
  else {
    const { vysl, z } = akoZivo(c, st);
    if (z.length && rovnake(vysl, zd)) { stat[z.slice().sort().join("+")]++; z.forEach((q) => ZAMERNE[q]++); }
    else { stat.nalez++; nalez("kombinácia", kde + ": cena.js " + J(kratko(c)) + " vs React " + J(kratko(zd))); }
  }
  porovnajKosik(kde, st, c);
}
console.log(kombinacie.length + " úplných kombinácií: zhoda " + stat.zhoda + " · len Z1 " + stat.Z1 + " · len Z2 " + stat.Z2 + " · Z1+Z2 " + stat["Z1+Z2"] + " · NÁLEZ " + stat.nalez);
console.log("   košík (nové UI = React sync = cena.js): " + stat.kosikZhoda + "/" + kombinacie.length + " · 15 selectov nové = React: " + stat.selectyZhoda + "/" + kombinacie.length);
// 6 materiálov od 24. 10. 2026 (pribudol Vzorovaný velúr) -> 160 a 520 × 6/5
over("zámerné Z1", ZAMERNE.Z1 === 192, "Z1 je " + ZAMERNE.Z1 + ", čakám 192");
over("zámerné Z2", ZAMERNE.Z2 === 624, "Z2 je " + ZAMERNE.Z2 + ", čakám 624");

// ------------------------------------------------------------------ 2) neúplné stavy (nevybraté kroky, bez značky)
let neuplne = 0;
const voz = [{ typ: "kamion", znacka: "DAF (TIR)" }, { typ: "dodavka", znacka: "Fiat (dodávka)" }, { typ: "kamion", znacka: null }, { typ: "dodavka", znacka: null }];
for (const v of voz) for (const material of [null, MAT[1]]) for (const nas of [null, ...NAS]) for (const tap of [null, "nie", "ano"]) for (const dvere of [null, false, true]) {
  if (tap == null && dvere != null) continue; // nedá sa naklikať (nášivka na dverách je až po Áno)
  const st = { ...v, material, nas, tap, dvere };
  neuplne++;
  const c = cenaSuhrn(C.vypocitajCenu(cenaStav(st), D));
  porovnajKosik(`neúplné ${v.znacka || "(bez značky)"} | ${material} | ${nas} | ${tap} | ${dvere}`, st, c);
}
console.log(neuplne + " neúplných stavov: košík a selecty porovnané (spolu " + stat.kosikZhoda + " / " + (kombinacie.length + neuplne) + ")");
console.log("SPOLU kombinácií: " + (kombinacie.length + neuplne));

console.log("\n" + okPocet + " kontrol OK, " + NALEZY.length + " nálezov");
NALEZY.slice(0, 30).forEach((n) => console.log("  NÁLEZ  " + n));
process.exit(NALEZY.length ? 1 : 0);
