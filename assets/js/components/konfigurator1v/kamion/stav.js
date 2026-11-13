// Stav výberu konfigurátora kamiónov (presne artefakt kamiony-app app.js „S“) + adaptér do tvaru React
// finalConfiguration (konfigurator.gen.jsx), ktorý berie syncToShoptet (shoptet.js) aj buildTruckOrderSummary
// (order-summary.mjs). Adaptér je JEDINÝ nový kus medzi novým UI a košíkom (docs/kamiony-1v-plan.md §2.3).
// Pri importe sa nič nespúšťa.
import { LEMOVANIE, NITE, ZNACKY, MATERIALY, PORADIE_POLI, jeTir } from "./data.js";

/** Nový prázdny stav (artefakt app.js ř. 11–17). */
export function novyStav() {
  return {
    typ: "kamion", znacka: null, model: null, polia: {},
    material: null, farba: null, lem: null,
    nas: null, nasBoky: { motiv: null, nit: null }, nasStred: { motiv: null, nit: null }, stredRovnaky: true,
    tap: null, tapRovnaky: true, tapMat: null, tapFarba: null, tapLem: null,
    tapNas: null, tapNasRovnaka: true, tapNasMotiv: null, tapNasNit: null,
  };
}

export const maBoky = (S) => S.nas === "boky" || S.nas === "boky+stred";
export const maStred = (S) => S.nas === "stred" || S.nas === "boky+stred";

/** Motív a niť stredového koberca (pri „boky+stred“ a „rovnaký motív“ = boky). */
export function stredEff(S) {
  return S.nas === "boky+stred" && S.stredRovnaky ? S.nasBoky : S.nasStred;
}

/** Pod sedadlami a v strede iný motív alebo niť (Michal 25. 10. 2026): tapacír preberá nášivku spod sedadiel a text
 *  aj poznámka hovoria „ako pod sedadlami“, nie „ako na kobercoch“ (ktorých?). */
export function roznePodSedadlamiAStred(S) {
  if (S.nas !== "boky+stred") return false;
  const se = stredEff(S);
  return S.nasBoky.motiv !== se.motiv || S.nasBoky.nit !== se.nit;
}

/** Nášivka na kobercoch, ktorú môže prebrať tapacír („rovnaká ako na kobercoch“), alebo null. */
export function koberecNas(S) {
  if (maBoky(S) && S.nasBoky.motiv && S.nasBoky.nit) return S.nasBoky;
  if (S.nas === "stred" && S.nasStred.motiv && S.nasStred.nit) return S.nasStred;
  return null;
}

export function najdiZnacku(kluc, znacky) {
  return (znacky || ZNACKY).find((z) => z.kluc === kluc) || null;
}
export function najdiModel(S, znacky) {
  const z = najdiZnacku(S.znacka, znacky);
  return (z && S.model && z.modely.find((m) => m.nazov === S.model)) || null;
}

const lem = (kod) => {
  const l = kod && LEMOVANIE.find((x) => x.kod === kod);
  return l ? { code: l.kod, name: l.meno } : null;
};
const nit = (kod) => {
  const n = kod && NITE.find((x) => x.kod === kod);
  return n ? { code: n.kod, name: n.meno } : kod ? { code: kod } : null;
};
const kod = (k) => (k ? { code: k } : null);

/**
 * Stav S -> objekt v tvare React finalConfiguration (gen.jsx „ALL DONE“). Farba materiálu len { code } (s name by
 * buildTruckOrderSummary napísal meno namiesto kódu), lemovanie { code, name } s menom z LEMOVANIE gen.jsx.
 * Polia tapacíru len pri značke „(TIR)“ (React doorUpholsteryAvailable), inak null / false ako React.
 */
export function naStavReactu(S, znacky) {
  const tir = jeTir(S.znacka);
  const model = najdiModel(S, znacky);
  const extras = {};
  if (model) PORADIE_POLI.forEach((p) => { if (model.polia[p] && S.polia[p]) extras[p] = S.polia[p]; });
  const boky = maBoky(S), stred = maStred(S), se = stredEff(S);
  const tapAno = tir && S.tap === "ano";
  const kn = koberecNas(S);
  const dvereNas = tapAno && S.tapNas === true;
  const dvereRovnaka = dvereNas && !!(S.tapNasRovnaka && kn);
  const dMotiv = dvereNas ? (dvereRovnaka ? kn.motiv : S.tapNasMotiv) : null;
  const dNit = dvereNas ? (dvereRovnaka ? kn.nit : S.tapNasNit) : null;
  return {
    znacka: S.znacka || "",
    model: S.model || "",
    extras,
    selectedMaterial: S.material || null,
    selectedColor: kod(S.farba),
    selectedLemovanie: lem(S.lem),
    selectedNasivka: boky ? kod(S.nasBoky.motiv) : null,
    selectedNitColor: boky ? nit(S.nasBoky.nit) : null,
    nasivkyPlacement: S.nas || null,
    selectedStredNasivka: stred ? kod(se.motiv) : null,
    selectedStredNitColor: stred ? nit(se.nit) : null,
    doorPanelChoice: tir ? (S.tap === "ano" || S.tap === "nie" ? S.tap : null) : null,
    doorMaterial: tapAno ? (S.tapRovnaky ? S.material : S.tapMat) || null : null,
    doorColor: tapAno ? kod(S.tapRovnaky ? S.farba : S.tapFarba) : null,
    doorLemovanie: tapAno ? lem(S.tapRovnaky ? S.lem : S.tapLem) : null,
    doorWantsNasivka: tir ? (S.tapNas === true || S.tapNas === false ? S.tapNas : null) : null,
    doorNasivka: kod(dMotiv),
    doorNitColor: nit(dNit),
    doorSameAsCarpet: tir ? { material: !!S.tapRovnaky, lemovanie: !!S.tapRovnaky } : { material: false, lemovanie: false },
    doorSameNitAsCarpet: dvereRovnaka,
    doorSameNasivkaAsCarpet: dvereRovnaka,
  };
}

/** Stav pre cena.js vypocitajCenu (artefakt app.js cena()). */
export function naStavCeny(S) {
  return { typ: S.typ, znacka: S.znacka, material: S.material, nasivky: S.nas, tapacir: S.tap, nasivkaDvere: S.tapNas === true };
}

/**
 * Predvýber vozidla z prepínača na titulke (sessionStorage truckBrand / truckModel / truckExtras — píše ho main.js),
 * overený proti vozidlám ako gen.jsx (neplatný model / voľba sa zahodí). Vráti { znacka, model, polia } alebo null.
 */
export function predvyber(ulozisko, znacky) {
  try {
    const st = ulozisko || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
    if (!st) return null;
    const b = st.getItem("truckBrand");
    const z = b && najdiZnacku(b, znacky);
    if (!z) return null;
    const m = st.getItem("truckModel");
    const model = (m && z.modely.find((x) => x.nazov === m)) || null;
    let ulozene = {};
    try { ulozene = JSON.parse(st.getItem("truckExtras") || "{}") || {}; } catch (e) { ulozene = {}; }
    const polia = {};
    if (model) {
      Object.assign(polia, model.auto_vybrane);
      Object.keys(model.polia).forEach((p) => { if (model.polia[p].indexOf(ulozene[p]) > -1) polia[p] = ulozene[p]; });
    }
    return { znacka: z.kluc, typ: z.typ, model: model ? model.nazov : null, polia };
  } catch (e) {
    return null;
  }
}

// ------------------------------------------------------------------ stránky kamiónov s pevným modelom (kniha 11. 11. 2026 §2.1)

/**
 * Predvýber stránky kamióna s pevným modelom (kamion/stranky.js { znacka, model }): má prednosť pred sessionStorage
 * truckBrand / truckModel. Model, ktorý v ponuke nie je (tabuľka sa zmenila), sa zahodí — predvyplní sa len značka.
 * Uložená výbava (truckExtras) sa prevezme len pri tom istom modeli. Neznáma značka -> null (stránka ako hlavný produkt).
 */
export function predvyberPevny(pevny, ulozisko, znacky) {
  try {
    const z = pevny && najdiZnacku(pevny.znacka, znacky);
    if (!z) return null;
    // pevny.aliasy = staré názvy toho istého modelu (premenovanie rokov v tabuľke, 13. 11. 2026): stránka nájde model,
    // nech je v data.json nový aj starý názov; predvolba nesie názov z ponuky, takže inyKamion porovnáva správne
    const mena = [pevny.model].concat(pevny.aliasy || []).filter(Boolean);
    const model = mena.map((m) => z.modely.find((x) => x.nazov === m)).find(Boolean) || null;
    const polia = {};
    if (model) {
      Object.assign(polia, model.auto_vybrane);
      const st = ulozisko || (typeof sessionStorage !== "undefined" ? sessionStorage : null);
      let ulozene = {};
      try {
        if (st && st.getItem("truckBrand") === z.kluc && st.getItem("truckModel") === model.nazov) ulozene = JSON.parse(st.getItem("truckExtras") || "{}") || {};
      } catch (e) { ulozene = {}; }
      Object.keys(model.polia).forEach((p) => { if (model.polia[p].indexOf(ulozene[p]) > -1) polia[p] = ulozene[p]; });
    }
    return { znacka: z.kluc, typ: z.typ, model: model ? model.nazov : null, polia };
  } catch (e) {
    return null;
  }
}

/** Kľúč prenosu výberu zo stránky kamióna na hlavný produkt (sessionStorage) a jeho platnosť. */
export const PRENOS_KLUC = "lcd1vKamionPrenos";
export const PRENOS_VERZIA = 1;
export const PRENOS_MS = 10 * 60 * 1000;

/** Serializovateľná kópia stavu S (bez odkazov na objekty UI). */
export function serializujStav(S) {
  const z = novyStav();
  const out = {};
  Object.keys(z).forEach((k) => { if (S && S[k] !== undefined) out[k] = S[k]; });
  return JSON.parse(JSON.stringify(out));
}

/**
 * Pred odchodom zo stránky kamióna na hlavný produkt: vozidlo do existujúcich kľúčov (truckBrand, truckModel, truckExtras —
 * číta ich predvyber() aj starý React) a celý výber do lcd1vKamionPrenos = { v: 1, cas, S }. true = zapísané.
 */
export function zapisPrenos(S, ulozisko, teraz) {
  try {
    const st = ulozisko || sessionStorage;
    if (S.znacka) st.setItem("truckBrand", S.znacka); else st.removeItem("truckBrand");
    if (S.model) st.setItem("truckModel", S.model); else st.removeItem("truckModel");
    st.setItem("truckExtras", JSON.stringify(S.polia || {}));
    st.setItem(PRENOS_KLUC, JSON.stringify({ v: PRENOS_VERZIA, cas: teraz == null ? Date.now() : teraz, S: serializujStav(S) }));
    return true;
  } catch (e) {
    return false;
  }
}

/** Hlavný produkt pri init: prenesený výber (mladší než 10 minút, verzia 1) alebo null. Kľúč sa vždy zmaže. */
export function nacitajPrenos(ulozisko, teraz) {
  let st = null;
  try { st = ulozisko || (typeof sessionStorage !== "undefined" ? sessionStorage : null); } catch (e) { st = null; }
  if (!st) return null;
  let x = null;
  try { x = JSON.parse(st.getItem(PRENOS_KLUC) || "null"); } catch (e) { x = null; }
  try { st.removeItem(PRENOS_KLUC); } catch (e) { /* nič */ }
  const t = teraz == null ? Date.now() : teraz;
  if (!x || typeof x !== "object" || x.v !== PRENOS_VERZIA || !x.S || typeof x.S !== "object") return null;
  if (!(typeof x.cas === "number" && t - x.cas >= 0 && t - x.cas < PRENOS_MS)) return null;
  return x.S;
}

/**
 * Prenesený výber -> platný stav S (novyStav + to, čo na tejto stránke existuje). Neplatné časti sa zahodia ako
 * predvyber(): neznáma značka / model / výbava, materiál, farba, lemovanie, motív, ktorý stránka neponúka (motivy =
 * shoptet.js povoleneMotivy), niť; tapacír len pri kamióne „(TIR)“.
 */
export function obnovStav(x, o) {
  const opt = o || {};
  const S = novyStav();
  if (!x || typeof x !== "object") return S;
  const motivy = opt.motivy || {};
  const vMotivoch = (miesto, kod) => (kod && (motivy[miesto] || []).indexOf(kod) > -1 ? kod : null);
  const nitOk = (kod) => (kod && NITE.some((n) => n.kod === kod) ? kod : null);
  const mat = (nazov) => MATERIALY.filter((m) => m.nazov === nazov)[0] || null;
  const farbaOk = (nazov, kod) => { const m = mat(nazov); return m && kod && m.farby.some((f) => f.kod === kod) ? kod : null; };
  const lemOk = (kod) => (kod && LEMOVANIE.some((l) => l.kod === kod) ? kod : null);
  const bool = (v, pred) => (v === true || v === false ? v : pred);

  if (x.typ === "kamion" || x.typ === "dodavka") S.typ = x.typ;
  const z = x.znacka ? najdiZnacku(x.znacka, opt.znacky) : null;
  if (z) {
    S.znacka = z.kluc; S.typ = z.typ;
    const m = x.model ? z.modely.find((y) => y.nazov === x.model) : null;
    if (m) {
      S.model = m.nazov;
      S.polia = Object.assign({}, m.auto_vybrane);
      const p0 = x.polia && typeof x.polia === "object" ? x.polia : {};
      Object.keys(m.polia).forEach((p) => { if (m.polia[p].indexOf(p0[p]) > -1) S.polia[p] = p0[p]; });
    }
  }
  if (mat(x.material)) { S.material = x.material; S.farba = farbaOk(x.material, x.farba); }
  S.lem = lemOk(x.lem);
  if (["nechcem", "boky", "stred", "boky+stred"].indexOf(x.nas) > -1) S.nas = x.nas;
  const b = x.nasBoky || {}, s = x.nasStred || {};
  S.nasBoky = { motiv: vMotivoch("boky", b.motiv), nit: nitOk(b.nit) };
  S.nasStred = { motiv: vMotivoch("stred", s.motiv), nit: nitOk(s.nit) };
  S.stredRovnaky = bool(x.stredRovnaky, true);
  if (jeTir(S.znacka) && (x.tap === "ano" || x.tap === "nie")) {
    S.tap = x.tap;
    S.tapRovnaky = bool(x.tapRovnaky, true);
    if (mat(x.tapMat)) { S.tapMat = x.tapMat; S.tapFarba = farbaOk(x.tapMat, x.tapFarba); }
    S.tapLem = lemOk(x.tapLem);
    S.tapNas = bool(x.tapNas, null);
    S.tapNasRovnaka = bool(x.tapNasRovnaka, true);
    S.tapNasMotiv = vMotivoch("dvere", x.tapNasMotiv);
    S.tapNasNit = nitOk(x.tapNasNit);
  }
  return S;
}

/** Vozidlo stavu (typ, značka, model) sa líši od predvoľby stránky kamióna? (zmena = prenos na hlavný produkt) */
export function inyKamion(S, pv) {
  if (!S || !pv) return false;
  return S.typ !== pv.typ || (S.znacka || null) !== (pv.znacka || null) || (S.model || null) !== (pv.model || null);
}
