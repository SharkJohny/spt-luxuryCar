// Zoznam kamiónov z Google tabuľky: taby kamiony (SK) a kamionycs (CZ). Vzorec v tabe settings (riadky kamiony, kamionycs) spojí
// tab do jednej bunky a tá ide do data.json ako setupData.settings.kamiony / kamionycs: riadky oddelené \n, bunky \t.
// Riadok N je v oboch taboch ten istý kamión. Stĺpce: Značka, Typ (TIR / dodávka), Model a roky, Prevodovka, Sedadlo, Zásuvky,
// Brzda, Podlaha; viac možností v bunke oddeľuje bodkočiarka.
// Slovenské texty ostávajú kľúče (poznámka objednávky, príplatky), český list dáva len preklady na CZ.
// Čokoľvek v liste nesedí -> celý list sa ignoruje a web ide zo zoznamu v kóde (truck-brands.js). Starý React (?novy=0) ide vždy z kódu.
import { TRUCK_FIELD_ORDER } from "../../../truck-konfigurator/truck-brands.js";
import { nastavPrekladyKamionov } from "../../../truck-konfigurator/order-summary.mjs";
import { nastavVozidla } from "./data.js";

/** Menej riadkov = list je rozbitý (zmazaný kus), nie zámerná zmena ponuky. */
const NAJMENEJ_MODELOV = 20;
const TYPY = ["TIR", "dodávka"];
const PRVY_STLPEC_POLI = 3;

const bunka = (x) => String(x == null ? "" : x).replace(/\s+/g, " ").trim();
const mozmosti = (x) => bunka(x).split(";").map((m) => m.trim());

function telo(riadky) {
  const r = riadky.slice(1).map((x) => (Array.isArray(x) ? x.map(bunka) : []));
  while (r.length && !r[r.length - 1].some(Boolean)) r.pop();
  return r;
}

/** Riadky oboch listov -> { vozidla, modelyCs, vybavaCs } v tvare truck-brands.js, alebo { chyba } s dôvodom. */
export function nacitajKamiony(riadkySk, riadkyCs) {
  if (!Array.isArray(riadkySk) || !Array.isArray(riadkyCs) || !riadkySk.length || !riadkyCs.length) return { chyba: "list chýba" };
  const hlavicka = (r) => Array.isArray(r[0]) && bunka(r[0][0]) === "Značka" && bunka(r[0][1]) === "Typ" && bunka(r[0][2]) === "Model a roky";
  if (!hlavicka(riadkySk) || !hlavicka(riadkyCs)) return { chyba: "hlavička" };
  const sk = telo(riadkySk), cs = telo(riadkyCs);
  if (sk.length !== cs.length) return { chyba: "počet riadkov " + sk.length + " / " + cs.length };
  if (sk.length < NAJMENEJ_MODELOV) return { chyba: "málo riadkov " + sk.length };
  const vozidla = {}, modelyCs = {}, vybavaCs = {};
  for (let i = 0; i < sk.length; i++) {
    const a = sk[i], b = cs[i], cislo = i + 2;
    if (!a[0] || !a[2] || !b[2]) return { chyba: "prázdna bunka, riadok " + cislo };
    if (!TYPY.includes(a[1])) return { chyba: "typ, riadok " + cislo };
    if (a[0] !== b[0] || a[1] !== b[1]) return { chyba: "listy sa líšia, riadok " + cislo };
    const kluc = a[0] + " (" + a[1] + ")";
    if (!vozidla[kluc]) vozidla[kluc] = {};
    if (vozidla[kluc][a[2]]) return { chyba: "dvakrát model, riadok " + cislo };
    const model = {};
    for (let p = 0; p < TRUCK_FIELD_ORDER.length; p++) {
      const s = a[PRVY_STLPEC_POLI + p] || "", c = b[PRVY_STLPEC_POLI + p] || "";
      if (!s && !c) continue;
      const ms = mozmosti(s), mc = mozmosti(c);
      if (ms.length !== mc.length || ms.concat(mc).some((m) => !m)) return { chyba: "možnosti, riadok " + cislo };
      model[TRUCK_FIELD_ORDER[p]] = ms;
      ms.forEach((m, j) => { if (m !== mc[j]) vybavaCs[m] = mc[j]; });
    }
    vozidla[kluc][a[2]] = model;
    if (a[2] !== b[2]) modelyCs[a[2]] = b[2];
  }
  return { vozidla, modelyCs, vybavaCs };
}

/** Bunka z data.json -> riadky tabu; skript spája stĺpce settings čiarkou, preto môže byť čiarka na konci. */
const riadkyTabu = (t) => (typeof t === "string" ? t.replace(/[,\s]+$/, "").split("\n").map((r) => r.split("\t")) : null);

/** main.js hneď po načítaní data.json. true = web ide z tabuľky, false = zo zoznamu v kóde (taby nie sú alebo nesedia). */
export function kamionyZDat(setupData) {
  const s = (setupData && setupData.settings) || {};
  if (s.kamiony === undefined && s.kamionycs === undefined) return false;
  const v = nacitajKamiony(riadkyTabu(s.kamiony), riadkyTabu(s.kamionycs));
  if (!v.vozidla) {
    console.warn("[kamiony] tabuľka sa nepoužila: " + v.chyba);
    return false;
  }
  nastavVozidla(v.vozidla);
  nastavPrekladyKamionov(v.modelyCs, v.vybavaCs);
  return true;
}
