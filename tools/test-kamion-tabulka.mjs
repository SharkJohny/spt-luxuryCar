// Kamióny z Google tabuľky (listy kamiony a kamionycs v data.json): rovnaký zoznam ako v kóde, nový kamión sa objaví,
// pokazený list web ignoruje a ostane pri zozname z kódu. Poznámka objednávky má formát aj jazyk ako doteraz.
import { TRUCK_VEHICLES, TRUCK_FIELD_ORDER } from "../assets/js/truck-konfigurator/truck-brands.js";
import { buildTruckOrderSummary, vozidloCs, vybavaCs, nastavPrekladyKamionov } from "../assets/js/truck-konfigurator/order-summary.mjs";
import * as D from "../assets/js/components/konfigurator1v/kamion/data.js";
import { nacitajKamiony, kamionyZDat } from "../assets/js/components/konfigurator1v/kamion/tabulka.js";
import { vozidloNaZobrazenie, skupinyNaZobrazenie } from "../assets/js/opc/kamionZobrazenie.js";

let ok = 0, zle = 0;
function over(meno, podmienka, detail) {
  if (podmienka) ok++;
  else { zle++; console.log("ZLE " + meno + (detail ? " — " + detail : "")); }
}
const J = (x) => JSON.stringify(x);
const HLAVICKA_SK = ["Značka", "Typ", "Model a roky", "Prevodovka", "Sedadlo spolujazdca", "Zásuvky", "Parkovacia brzda", "Podlaha", "", "Návod: …"];
const HLAVICKA_CS = ["Značka", "Typ", "Model a roky", "Převodovka", "Sedadlo spolujezdce", "Zásuvky", "Parkovací brzda", "Podlaha", "", "Návod: …"];

/** Riadky listu tak, ako ich zapíše Jánov skript: všetky stĺpce, prázdne bunky ako "". */
function riadky(jazyk) {
  const cs = jazyk === "cs";
  const out = [cs ? HLAVICKA_CS : HLAVICKA_SK];
  for (const kluc of Object.keys(TRUCK_VEHICLES)) {
    const [, znacka, typ] = kluc.match(/^(.*?)\s*\((TIR|dodávka)\)\s*$/);
    for (const model of Object.keys(TRUCK_VEHICLES[kluc])) {
      const c = TRUCK_VEHICLES[kluc][model];
      out.push([znacka, typ, cs ? vozidloCs(model) : model, ...TRUCK_FIELD_ORDER.map((p) => (c[p] || []).map((x) => (cs ? vybavaCs(x) : x)).join("; ")), "", ""]);
    }
  }
  return out;
}
const kopia = (x) => JSON.parse(J(x));

// 1) dnešné listy = zoznam v kóde, vrátane poradia
const dnes = nacitajKamiony(riadky("sk"), riadky("cs"));
over("listy = kód", dnes.vozidla && J(dnes.vozidla) === J(TRUCK_VEHICLES), dnes.chyba);

// 2) prázdne riadky na konci, číslo v bunke a medzery navyše nevadia
{
  const sk = kopia(riadky("sk")), cs = kopia(riadky("cs"));
  sk.push(["", "", "", "", "", "", "", "", "", ""]); cs.push(["", "", "", "", "", "", "", "", "", ""]);
  sk[3][3] = " " + sk[3][3] + " ";
  over("prázdne riadky a medzery", J(nacitajKamiony(sk, cs).vozidla) === J(TRUCK_VEHICLES));
  const nsk = kopia(riadky("sk")), ncs = kopia(riadky("cs"));
  nsk[1][2] = 2025; ncs[1][2] = 2025;
  over("číslo v bunke", nacitajKamiony(nsk, ncs).vozidla["Citroën (dodávka)"]["2025"] !== undefined);
}

// 3) pokazené listy: web ostane pri kóde
const pokaz = (meno, fn) => {
  const sk = kopia(riadky("sk")), cs = kopia(riadky("cs"));
  fn(sk, cs);
  const v = nacitajKamiony(sk, cs);
  over("odmietnuté: " + meno, !v.vozidla && v.chyba, J(v).slice(0, 120));
};
pokaz("zlá hlavička", (sk) => { sk[0][0] = "Brand"; });
pokaz("zlá hlavička CZ", (sk, cs) => { cs[0][2] = "Model"; });
pokaz("chýba riadok v CZ", (sk, cs) => { cs.pop(); });
pokaz("iná značka v CZ", (sk, cs) => { cs[5][0] = "Volvo"; });
pokaz("iný typ v CZ", (sk, cs) => { cs[5][1] = "dodávka"; });
pokaz("prázdny model", (sk) => { sk[4][2] = ""; });
pokaz("prázdna značka", (sk) => { sk[4][0] = ""; });
pokaz("zlý typ", (sk) => { sk[4][1] = "Tir"; });
pokaz("dvakrát ten istý model", (sk) => { sk[4][2] = sk[5][2]; });
pokaz("iný počet možností v CZ", (sk, cs) => { cs[3][4] = cs[3][4].split(";")[0]; });
pokaz("prázdna možnosť", (sk) => { sk[3][3] = "Automatická prevodovka;;Manuálna prevodovka"; });
pokaz("málo riadkov", (sk, cs) => { sk.length = 6; cs.length = 6; });
for (const [meno, a, b] of [["nič", undefined, undefined], ["null", null, null], ["text", "x", "y"], ["prázdne", [], []], ["len SK", riadky("sk"), undefined]]) {
  const v = nacitajKamiony(a, b);
  over("odmietnuté: " + meno, !v.vozidla && v.chyba);
}

// 4) data.json bez listov (dnešný stav) a s pokazenými listami: zoznam z kódu, web beží
const zaloha = { warn: console.warn };
let varovania = 0;
console.warn = () => { varovania++; };
over("bez listov", kamionyZDat({ cars: {} }) === false && D.VOZIDLA === TRUCK_VEHICLES && varovania === 0, "varovaní " + varovania);
over("pokazený list", kamionyZDat({ kamiony: riadky("sk"), kamionycs: [] }) === false && D.VOZIDLA === TRUCK_VEHICLES && varovania === 1, "varovaní " + varovania);
over("nič na vstupe", kamionyZDat(null) === false && kamionyZDat(undefined) === false);
console.warn = zaloha.warn;

// 5) nový kamión z tabuľky: je v konfigurátore, na titulke aj v preklade, kódový zoznam sa nemení
{
  const sk = kopia(riadky("sk")), cs = kopia(riadky("cs"));
  sk.push(["Scania", "TIR", "G 2010-2016 – nízka kabína", "Automatická prevodovka; Robotizovaná prevodovka", "", "", "", "", "", ""]);
  cs.push(["Scania", "TIR", "G 2010-2016 – nízká kabina", "Automatická převodovka; Robotizovaná převodovka", "", "", "", "", "", ""]);
  over("načítané", kamionyZDat({ kamiony: sk, kamionycs: cs }) === true);
  const scania = D.ZNACKY.find((z) => z.kluc === "Scania (TIR)");
  const novy = scania.modely.find((m) => m.nazov === "G 2010-2016 – nízka kabína");
  over("nový model v ZNACKY", novy && J(novy.polia.prevodovka) === J(["Automatická prevodovka", "Robotizovaná prevodovka"]), J(novy));
  over("nový model v povinných poliach", novy && J(novy.povinne_polia) === J(["prevodovka"]));
  over("VOZIDLA pre titulku", D.VOZIDLA["Scania (TIR)"]["G 2010-2016 – nízka kabína"] !== undefined);
  over("kódový zoznam bez zmeny", TRUCK_VEHICLES["Scania (TIR)"]["G 2010-2016 – nízka kabína"] === undefined);
  over("CZ názov z listu", vozidloCs("Scania (TIR) G 2010-2016 – nízka kabína") === "Scania (TIR) G 2010-2016 – nízká kabina", vozidloCs("Scania (TIR) G 2010-2016 – nízka kabína"));
  over("CZ výbava z listu", vybavaCs("Robotizovaná prevodovka") === "Robotizovaná převodovka");
  over("zobrazenie v košíku", vozidloNaZobrazenie("Scania (TIR) G 2010-2016 – nízka kabína", "cs") === "Scania G 2010–2016 – nízká kabina", vozidloNaZobrazenie("Scania (TIR) G 2010-2016 – nízka kabína", "cs"));
  const g = skupinyNaZobrazenie([{ heading: "SPECIFIKACE VOZIDLA", items: [{ label: "Typ převodovky", value: "Robotizovaná prevodovka" }] }], "cs", "");
  over("nová výbava v CZ košíku", g[0].items[0].value === "Robotizovaná převodovka", J(g));
  // poznámka: formát aj slovenské kľúče ako doteraz, kým Ján nepotvrdí export
  const pozn = buildTruckOrderSummary({ znacka: "Scania (TIR)", model: "G 2010-2016 – nízka kabína", extras: { prevodovka: "Robotizovaná prevodovka" }, selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" }, selectedLemovanie: { code: "04" } }, "cs");
  over("CZ poznámka bez zmeny", /Vozidlo: Scania \(TIR\) G 2010-2016 – nízka kabína/.test(pozn) && /Typ převodovky: Robotizovaná prevodovka/.test(pozn), pozn);
  // znovu dnešné listy: stav sa nevrství
  over("návrat na dnešné listy", kamionyZDat({ kamiony: riadky("sk"), kamionycs: riadky("cs") }) === true && J(D.VOZIDLA) === J(TRUCK_VEHICLES));
  over("preklad nového modelu preč", vozidloCs("Scania (TIR) G 2010-2016 – nízka kabína") === "Scania (TIR) G 2010-2016 – nízka kabína");
}

// 6) preklady bez tabuľky: slová ako doteraz
nastavPrekladyKamionov({}, {});
over("slová bez tabuľky", vozidloCs("Actros MP5/MP6 F (s tunelom) 2021-2025") === "Actros MP5/MP6 F (s tunelem) 2021-2025");
over("výbava bez tabuľky", vybavaCs("Automatická prevodovka") === "Automatická převodovka" && vybavaCs("1 zásuvka (šuplík)") === "1 zásuvka (šuplík)" && vybavaCs(undefined) === undefined);

console.log(`${ok} OK, ${zle} ZLE`);
if (zle) process.exit(1);
