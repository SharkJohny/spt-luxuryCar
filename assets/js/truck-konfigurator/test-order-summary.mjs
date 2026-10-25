import assert from "node:assert/strict";
import {
  buildTruckOrderSummary,
  detectTruckSummaryLanguage,
  mergeTruckOrderSummaryIntoNote,
  parseTruckOrderSummary,
} from "./order-summary.mjs";

const summary = buildTruckOrderSummary({
  znacka: "DAF (TIR)",
  model: "XF 2022-2025",
  extras: {
    prevodovka: "Automatická prevodovka",
    sedadlo: "Sedadlo spolujazdca CINEMA",
  },
  selectedMaterial: "Prémiová syntetická koža – prešívaná",
  selectedColor: { code: "K2" },
  selectedLemovanie: { code: "L3", name: "Červené lemovanie" },
  nasivkyPlacement: "boky+stred",
  selectedNasivka: { code: "H1" },
  selectedNitColor: { code: "N2", name: "Červená" },
  selectedStredNasivka: { code: "H4" },
  selectedStredNitColor: { code: "N1", name: "Čierna" },
  doorPanelChoice: "ano",
  doorMaterial: "Mikrosemiš – jednofarebný",
  doorColor: { code: "A4" },
  doorLemovanie: { code: "L3", name: "Červené lemovanie" },
  doorWantsNasivka: true,
  doorNasivka: { code: "H1" },
  doorNitColor: { code: "N2", name: "Červená" },
  doorSameAsCarpet: { material: true, lemovanie: true },
  doorSameNasivkaAsCarpet: true,
  doorSameNitAsCarpet: true,
});

[
  "ŠPECIFIKÁCIA VOZIDLA",
  "- Vozidlo: DAF (TIR) XF 2022-2025",
  "- Typ prevodovky: Automatická prevodovka",
  "KOBERČEKY POD SEDAČKY",
  "- Typ a farba materiálu: Prémiová syntetická koža – prešívaná – K2",
  "- Typ nášiviek na boky: H1",
  "- Farba nášiviek na boky: N2 – Červená",
  "- Typ nášivky na stred: H4",
  "- Farba nášivky na stred: N1 – Čierna",
  "TAPACÍR DVERÍ",
  "- Typ a farba materiálu: Rovnaký ako koberčeky – Prémiová syntetická koža – prešívaná – K2",
  "- Nášivky na tapacír: Chcem",
  // 25. 10. 2026 (Michal): boky H1 / N2 a stred H4 / N1 sú rôzne -> tapacír preberá nášivku spod sedadiel a poznámka to povie
  "- Typ nášivky na tapacír: Rovnaká ako pod sedadlami – H1",
  "- Farba nášiviek na tapacíre: Rovnaká ako pod sedadlami – N2 – Červená",
].forEach((line) => assert.ok(summary.includes(line), `Chýba riadok: ${line}`));

assert.ok(!summary.includes("undefined"));
assert.ok(!summary.includes("[object Object]"));

assert.ok(!summary.includes("Rovnaká ako na koberčekoch"), "pri rôznych nášivkách nesmie byť „ako na koberčekoch“ (ktorých?)");

// rovnaké nášivky pod sedadlami aj v strede -> „Rovnaká ako na koberčekoch“ (jednoznačné)
const rovnakeSummary = buildTruckOrderSummary({
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" },
  nasivkyPlacement: "boky+stred",
  selectedNasivka: { code: "H19" }, selectedNitColor: { code: "2824", name: "Červená" },
  selectedStredNasivka: { code: "H19" }, selectedStredNitColor: { code: "2824", name: "Červená" },
  doorPanelChoice: "ano", doorWantsNasivka: true, doorNasivka: { code: "H19" }, doorNitColor: { code: "2824", name: "Červená" },
  doorSameAsCarpet: { material: true, lemovanie: true }, doorSameNasivkaAsCarpet: true, doorSameNitAsCarpet: true,
});
assert.ok(rovnakeSummary.includes("- Typ nášivky na tapacír: Rovnaká ako na koberčekoch – H19"), rovnakeSummary);
assert.ok(rovnakeSummary.includes("- Farba nášiviek na tapacíre: Rovnaká ako na koberčekoch – 2824 – Červená"), rovnakeSummary);
// len pod sedadlami -> „ako na koberčekoch“ (iná nie je)
const lenBokySummary = buildTruckOrderSummary({
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" },
  nasivkyPlacement: "boky", selectedNasivka: { code: "H19" }, selectedNitColor: { code: "2824", name: "Červená" },
  doorPanelChoice: "ano", doorWantsNasivka: true, doorNasivka: { code: "H19" }, doorNitColor: { code: "2824", name: "Červená" },
  doorSameAsCarpet: { material: true, lemovanie: true }, doorSameNasivkaAsCarpet: true, doorSameNitAsCarpet: true,
});
assert.ok(lenBokySummary.includes("- Typ nášivky na tapacír: Rovnaká ako na koberčekoch – H19"), lenBokySummary);
// CZ, rôzne nášivky -> „Stejná jako pod sedačkami“
const czRozne = buildTruckOrderSummary({
  selectedMaterial: "Prémiová syntetická kůže – prošívaná", selectedColor: { code: "11" },
  nasivkyPlacement: "boky+stred",
  selectedNasivka: { code: "H19" }, selectedNitColor: { code: "2824", name: "Červená" },
  selectedStredNasivka: { code: "H21" }, selectedStredNitColor: { code: "2866", name: "Fialová" },
  doorPanelChoice: "ano", doorWantsNasivka: true, doorNasivka: { code: "H19" }, doorNitColor: { code: "2824", name: "Červená" },
  doorSameAsCarpet: { material: true, lemovanie: true }, doorSameNasivkaAsCarpet: true, doorSameNitAsCarpet: true,
}, "cs");
assert.ok(czRozne.includes("- Typ nášivky na tapacír: Stejná jako pod sedačkami – H19"), czRozne);

const groups = parseTruckOrderSummary(summary);
assert.deepEqual(groups.map((group) => group.heading), [
  "ŠPECIFIKÁCIA VOZIDLA",
  "KOBERČEKY POD SEDAČKY",
  "TAPACÍR DVERÍ",
]);

const legacyCzechGroups = parseTruckOrderSummary([
  "SPECIFIKACE VOZIDLA",
  "- Vozidlo: DAF (TIR) XF105 2006-2012",
  "",
  "KOBEREČKY POD SEDAČKY",
  "- Barva nášivky na střed: Tmavohnedá",
  "- Barva nášivek na boky: Strieborná",
  "",
  "TAPACÍR DVEŘÍ",
  "- Barva nášivek na tapacíru: Stejná jako na koberečcích – Strieborná",
].join("\n"));
assert.equal(legacyCzechGroups[1].items[0].value, "3504 – Tmavě hnědá");
assert.equal(legacyCzechGroups[1].items[1].value, "2901 – Stříbrná");
assert.equal(legacyCzechGroups[2].items[0].value, "Stejná jako na koberečcích – 2901 – Stříbrná");

const noDoorSummary = buildTruckOrderSummary({
  selectedMaterial: "Mikrosemiš – jednofarebný",
  selectedColor: { code: "1NUB" },
  selectedLemovanie: { name: "Čierne lemovanie" },
  nasivkyPlacement: "nechcem",
  doorPanelChoice: "nie",
});
assert.ok(!noDoorSummary.includes("TAPACÍR DVERÍ"), "nevybraný tapacír sa nesmie zobraziť");

const czechSummary = buildTruckOrderSummary({
  znacka: "DAF (TIR)",
  model: "XF 2022-2025",
  extras: { prevodovka: "Automatická převodovka" },
  selectedMaterial: "Prémiová syntetická kůže – prošívaná",
  selectedColor: { code: "K2" },
  selectedLemovanie: { name: "Červené lemování" },
  nasivkyPlacement: "boky+stred",
  selectedNasivka: { code: "H1" },
  selectedNitColor: { code: "2901", name: "Strieborná" },
  selectedStredNasivka: { code: "H4" },
  selectedStredNitColor: { code: "3504", name: "Tmavohnedá" },
  doorPanelChoice: "ano",
  doorWantsNasivka: false,
  doorSameAsCarpet: { material: true, lemovanie: true },
}, "cs");

[
  "SPECIFIKACE VOZIDLA",
  "- Typ převodovky: Automatická převodovka",
  "KOBEREČKY POD SEDAČKY",
  "- Typ a barva materiálu: Prémiová syntetická kůže – prošívaná – K2",
  "- Rozložení nášivek: Řidič + spolujezdec + střed",
  "- Barva nášivek na boky: 2901 – Stříbrná",
  "- Barva nášivky na střed: 3504 – Tmavě hnědá",
  "TAPACÍR DVEŘÍ",
  "- Typ a barva materiálu: Stejný jako koberečky – Prémiová syntetická kůže – prošívaná – K2",
  "- Nášivky na tapacír: Nechci",
].forEach((line) => assert.ok(czechSummary.includes(line), `V českém souhrnu chybí řádek: ${line}`));

const czechNote = mergeTruckOrderSummaryIntoNote("Zavolejte před doručením.", czechSummary);
assert.match(czechNote, /\[KONFIGURACE KAMIONU\]/);
assert.doesNotMatch(czechNote, /KONFIGURÁCIA KAMIÓNA/);

globalThis.window = { location: { hostname: "www.luxurycardesign.cz" } };
assert.equal(detectTruckSummaryLanguage(), "cs", "CZ doména musí automaticky použít češtinu");
globalThis.window = { location: { hostname: "www.luxurycardesign.sk" } };
assert.equal(detectTruckSummaryLanguage(), "sk", "SK doména musí automaticky použít slovenštinu");
delete globalThis.window;

const once = mergeTruckOrderSummaryIntoNote("Prosím zavolať pred doručením.", summary);
const twice = mergeTruckOrderSummaryIntoNote(once, summary);
assert.equal(twice, once, "automatický blok sa pri opakovanom odoslaní nesmie duplikovať");
assert.ok(twice.startsWith("Prosím zavolať pred doručením."), "ručná poznámka zákazníka sa musí zachovať");
assert.equal((twice.match(/\[KONFIGURÁCIA KAMIÓNA\]/g) || []).length, 1);

// Poznámka objednávky = presne súhrn medzi značkami (nadpis časti + riadky „- Popis: hodnota“) – tento formát číta
// Jánov export pre výrobu (all_orders_last_month.txt); 25. 10. 2026 očíslované riadky vrátené späť.
const blokPoznamky = once.split("[KONFIGURÁCIA KAMIÓNA]\n")[1].split("\n[/KONFIGURÁCIA KAMIÓNA]")[0];
assert.equal(blokPoznamky, summary, "poznámka: blok = súhrn bez zmeny formátu");
assert.ok(blokPoznamky.startsWith("ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: "), "poznámka: nadpis a riadky „- …“ " + blokPoznamky.slice(0, 80));
const kob = blokPoznamky.split("\n\n").find((r) => r.startsWith("KOBERČEKY POD SEDAČKY")) || "";
assert.ok(kob.indexOf("Typ nášiviek na boky") > 0 && kob.indexOf("Typ nášiviek na boky") < kob.indexOf("Typ nášivky na stred"), "poznámka: boky pred stredom " + kob);

console.log("✓ súhrn truck konfigurácie obsahuje všetky výrobné voľby");
