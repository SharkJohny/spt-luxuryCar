// CZ poznámka objednávky kamióna (blok [KONFIGURACE KAMIONU]) je celá po česky: všetky vozidlá s každou kombináciou výbavy
// a všetky materiály s každou farbou. SK poznámka sa nemení. Hodnoty v stave konfigurátora ostávajú slovenské kľúče.
// Referenčný export pre výrobu nie je v repe. S LCD_EXPORT_KAMION=<cesta k export-kamion-en.mjs> test overí, že CZ poznámka
// dá rovnaký anglický výstup ako SK a že v ňom nie je „??“. Bez premennej sa táto časť preskočí.
import { pathToFileURL } from "node:url";
import { buildTruckOrderSummary, mergeTruckOrderSummaryIntoNote } from "../assets/js/truck-konfigurator/order-summary.mjs";
import { ZNACKY, MATERIALY } from "../assets/js/components/konfigurator1v/kamion/data.js";
import { novyStav, naStavReactu } from "../assets/js/components/konfigurator1v/kamion/stav.js";

const SLOVENSKE = /koža|prešívan|jednofarebn|dvojfarebn|velúr|prevodovk|spolujazdc|základň|ručná|umiestnen|palubnej|podlahe|vodiča|Manuálna|miestne|kabína|tunelom|zadný/;

const exportCesta = process.env.LCD_EXPORT_KAMION;
const exportKamionEN = exportCesta ? (await import(pathToFileURL(exportCesta).href)).exportKamionEN : null;

let ok = 0, zle = 0;
function over(meno, podmienka, detail) {
  if (podmienka) ok++;
  else { zle++; console.log("ZLE " + meno + (detail ? "\n" + detail : "")); }
}

function kombinacie(polia) {
  return Object.keys(polia || {}).reduce((out, p) => out.flatMap((o) => polia[p].map((v) => ({ ...o, [p]: v }))), [{}]);
}

function stav(znacka, model, polia, material, farba) {
  const S = novyStav();
  Object.assign(S, {
    znacka: znacka.kluc, model: model.nazov, polia: { ...model.auto_vybrane, ...polia }, material, farba, lem: "04",
    nas: "boky+stred", stredRovnaky: true, nasBoky: { motiv: "H19", nit: "2999" },
    tap: "ano", tapRovnaky: true, tapNas: true, tapNasRovnaka: true,
  });
  return naStavReactu(S, ZNACKY);
}

function skontroluj(meno, s) {
  const cs = buildTruckOrderSummary(s, "cs");
  const sk = buildTruckOrderSummary(s, "sk");
  over(meno + ": CZ bez slovenčiny", !SLOVENSKE.test(cs), cs);
  if (s.selectedMaterial) over(meno + ": SK má pôvodný materiál", sk.includes(s.selectedMaterial), sk);
  Object.values(s.extras).forEach((v) => over(meno + ": SK má pôvodnú výbavu", sk.includes(v), sk));
  over(meno + ": SK má pôvodné vozidlo", sk.includes(`- Vozidlo: ${s.znacka} ${s.model}`), sk);
  if (exportKamionEN) {
    const en = (z) => exportKamionEN("X", mergeTruckOrderSummaryIntoNote("", z));
    over(meno + ": export CZ = SK", en(cs) === en(sk), en(cs) + "\n---\n" + en(sk));
    over(meno + ": export bez ??", !en(cs).includes("??"), en(cs));
  }
}

let vozidiel = 0;
for (const znacka of ZNACKY) {
  for (const model of znacka.modely) {
    for (const polia of kombinacie(model.polia)) {
      vozidiel++;
      skontroluj(`${znacka.kluc} ${model.nazov} ${JSON.stringify(polia)}`, stav(znacka, model, polia, MATERIALY[1].nazov, "11"));
    }
  }
}

let farieb = 0;
const znacka = ZNACKY.find((z) => /DAF/.test(z.kluc));
for (const material of MATERIALY) {
  for (const { kod } of material.farby) {
    farieb++;
    skontroluj(`${material.nazov} ${kod}`, stav(znacka, znacka.modely[0], {}, material.nazov, kod));
  }
}

over("počet vozidiel", vozidiel === 61, String(vozidiel));
over("počet farieb", farieb === 50, String(farieb));
console.log(`${ok} OK, ${zle} ZLE (${vozidiel} kombinácií vozidla a výbavy, ${farieb} farieb${exportKamionEN ? ", s exportom" : ", bez exportu"})`);
if (zle) process.exit(1);
