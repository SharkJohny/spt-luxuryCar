// Stav výberu konfigurátora kamiónov (presne artefakt kamiony-app app.js „S“) + adaptér do tvaru React
// finalConfiguration (konfigurator.gen.jsx), ktorý berie syncToShoptet (shoptet.js) aj buildTruckOrderSummary
// (order-summary.mjs). Adaptér je JEDINÝ nový kus medzi novým UI a košíkom (docs/kamiony-1v-plan.md §2.3).
// Pri importe sa nič nespúšťa.
import { LEMOVANIE, NITE, ZNACKY, PORADIE_POLI, jeTir } from "./data.js";

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
