#!/usr/bin/env node
// Test (a) ceny konfigurátora kamiónov: port testu schváleného artefaktu kamiony-app/test-cena.mjs (58 kontrol) nad
// konfigurator1v/kamion/cena.js + živými cenami z fixture (shoptet.js citajCeny, jsdom). docs/kamiony-1v-plan.md §5 (a).
//   node tools/test-kamion-cena.mjs
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { nacitajModul } from "./test-1v/kamion-spolocne.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = join(KOREN, "tools", "test-1v", "kamion-640.fixture.html");
const GEN = join(KOREN, "assets", "js", "truck-konfigurator", "konfigurator.gen.jsx");

const { vypocitajCenu, tapacirDostupny, ponuka } = await nacitajModul("assets/js/components/konfigurator1v/kamion/cena.js");
const { citajCeny, select } = await nacitajModul("assets/js/components/konfigurator1v/kamion/shoptet.js");
const { ZNACKY, MATERIALY } = await nacitajModul("assets/js/components/konfigurator1v/kamion/data.js");

const doc = new JSDOM(readFileSync(FIXTURE, "utf8")).window.document;
const ceny = citajCeny(doc);
const data = { ceny, vozidla: { znacky: ZNACKY } };

// FALLBACK_PRICES_EUR priamo z kódu Reactu (konfigurator.gen.jsx)
const gen = readFileSync(GEN, "utf8");
const fbTxt = /const FALLBACK_PRICES_EUR = (\{[\s\S]*?\n\});/.exec(gen);
if (!fbTxt) throw new Error("v konfigurator.gen.jsx chýba FALLBACK_PRICES_EUR");
const FB = Function("return " + fbTxt[1])();

let ok = 0, zle = 0;
function over(nazov, skutocne, ocakavane) {
  const s = JSON.stringify(skutocne), o = JSON.stringify(ocakavane);
  if (s === o) { ok++; console.log("  OK   " + nazov + " = " + s); }
  else { zle++; console.log("  ZLE  " + nazov + ": je " + s + ", má byť " + o); }
}
const sum = (r) => ({ spolu: r.spolu, usetrene: r.usetrene, pct: r.usetrenePercent });
/** príplatok možnosti zo živého selectu fixture (text „… +€N“) */
const priplatokZive = (kluc, zaciatok) => {
  const s = select(kluc, doc);
  const o = Array.prototype.find.call(s.options, (x) => x.value && x.textContent.trim().startsWith(zaciatok));
  if (!o) throw new Error("vo fixture chýba " + kluc + " / " + zaciatok);
  return Number(/\+€(\d+)/.exec(o.textContent)[1]);
};
const PRES = "Prémiová syntetická koža – prešívaná";

console.log("0) Živé ceny z fixture");
over("nezhody text vs data-surcharge-final-price", ceny.nezhody, []);
over("materiály vo fixture = materiály konfigurátora", Object.keys(ceny.priplatky.material), MATERIALY.map((m) => m.nazov));

console.log("1) Základ");
over("prázdny výber", sum(vypocitajCenu({}, data)), { spolu: 199, usetrene: 0, pct: 0 });
over("základ = živý Shoptet (meta price)", data.ceny.zaklad_eur, Number(doc.querySelector('meta[itemprop="price"]').getAttribute("content")));

console.log("2) Príklad zo živého webu (DAF XF106 2017-2021, prešívaná 12, lem 04, balík H19 čierna, tapacír ako koberce)");
const priklad = vypocitajCenu({ typ: "kamion", znacka: "DAF (TIR)", material: PRES, nasivky: "boky+stred", tapacir: "ano", nasivkaDvere: false }, data);
over("súhrn", sum(priklad), { spolu: 423, usetrene: 105, pct: 20 });
over("pôvodne spolu", priklad.povodneSpolu, 528);
over("riadky", priklad.riadky.map((r) => [r.id, r.suma, r.povodna]), [["zaklad", 199, null], ["material", 10, null], ["nasivky", 95, 140], ["tapacir", 119, 179]]);

console.log("3) Každý materiál (príplatok aj proti živému Shoptetu)");
for (const m of MATERIALY) {
  const r = vypocitajCenu({ material: m.nazov }, data);
  over(m.nazov, r.spolu, 199 + priplatokZive("material", m.nazov));
  over("  karta materiálu = cena", ponuka(data).material[m.nazov], r.spolu - 199);
}

console.log("4) Každá voľba nášiviek (karta ukazuje úsporu aj pri jednej strane)");
const nas = { nechcem: [199, 0, 0], stred: [258, 11, 4], boky: [258, 11, 4], "boky+stred": [294, 45, 13] };
const shopNas = { nechcem: "Bez nášiviek", stred: "Len stred", boky: "Šofér + spolujazdec +", "boky+stred": "Šofér + spolujazdec + stred (BALÍK)" };
for (const [k, [s, u, p]] of Object.entries(nas)) {
  over("nášivky " + k, sum(vypocitajCenu({ nasivky: k }, data)), { spolu: s, usetrene: u, pct: p });
  over("  príplatok = živý Shoptet", s - 199, priplatokZive("nasivky", shopNas[k]));
}
console.log("   … a režim ako živý kód (úspora len pri balíku a tapacíri)");
over("stred bez úspory", sum(vypocitajCenu({ nasivky: "stred" }, data, { usporaAjPriJednejStrane: false })), { spolu: 258, usetrene: 0, pct: 0 });
over("boky + prešívaná bez úspory (268 €)", sum(vypocitajCenu({ material: PRES, nasivky: "boky" }, data, { usporaAjPriJednejStrane: false })), { spolu: 268, usetrene: 0, pct: 0 });
over("balík aj v tomto režime", sum(vypocitajCenu({ nasivky: "boky+stred" }, data, { usporaAjPriJednejStrane: false })), { spolu: 294, usetrene: 45, pct: 13 });

console.log("5) Tapacír dverí");
const tapBez = vypocitajCenu({ znacka: "Scania (TIR)", tapacir: "ano", nasivkaDvere: false }, data);
over("tapacír bez nášivky na dverách", sum(tapBez), { spolu: 318, usetrene: 60, pct: 16 });
const tapS = vypocitajCenu({ znacka: "Scania (TIR)", tapacir: "ano", nasivkaDvere: true }, data);
over("tapacír s nášivkou na dverách (+49)", tapS.spolu - tapBez.spolu, 49);
over("  príplatok tapacíru = živý Shoptet", data.ceny.priplatky.tapacir_balik, priplatokZive("tapacir", "Áno chcem"));
over("  nášivka na dverách = živý Shoptet", data.ceny.priplatky.nasivka_na_dverach, priplatokZive("tapNasivka", "Áno chcem nášivku"));
over("príklad s nášivkou na dverách", sum(vypocitajCenu({ znacka: "DAF (TIR)", material: PRES, nasivky: "boky+stred", tapacir: "ano", nasivkaDvere: true }, data)), { spolu: 472, usetrene: 145, pct: 24 });
over("tapacír Nie + zabudnutá nášivka na dverách = bez 49 € (oprava Z1)", sum(vypocitajCenu({ znacka: "DAF (TIR)", material: PRES, nasivky: "boky+stred", tapacir: "nie", nasivkaDvere: true }, data)), { spolu: 304, usetrene: 45, pct: 13 });

console.log("6) Vozidlo bez tapacíru");
over("Fiat Ducato: tapacír sa nezaráta", sum(vypocitajCenu({ typ: "dodavka", znacka: "Fiat (dodávka)", material: PRES, nasivky: "boky+stred", tapacir: "ano", nasivkaDvere: true }, data)), { spolu: 304, usetrene: 45, pct: 13 });
over("dodávka bez značky: tapacír sa nezaráta", vypocitajCenu({ typ: "dodavka", tapacir: "ano" }, data).spolu, 199);
over("tapacirDostupny pre všetky značky", ZNACKY.map((z) => [z.kluc, tapacirDostupny({ znacka: z.kluc }, data)]).every(([k, v]) => v === /\(TIR\)/.test(k)), true);

console.log("7) Živé ceny sedia s fallbackom kódu Reactu (FALLBACK_PRICES_EUR)");
over("materiály = fallback", JSON.stringify(data.ceny.priplatky.material), JSON.stringify(FB.MATERIAL));
over("nášivky = fallback", JSON.stringify(data.ceny.priplatky.nasivky_rozlozenie), JSON.stringify(FB.NASIVKY));
over("tapacír / dvere = fallback", [data.ceny.priplatky.tapacir_balik, data.ceny.priplatky.nasivka_na_dverach], [FB.TAPACIR_BUNDLE, FB.NASIVKA_DVERE]);
over("prečiarknuté = fallback", [ceny.preciarknute_ceny.nasivky_sofer_spolujazdec, ceny.preciarknute_ceny.nasivky_len_stred, ceny.preciarknute_ceny.nasivky_balik, ceny.preciarknute_ceny.tapacir, ceny.preciarknute_ceny.nasivka_na_dverach], [FB.NASIVKY_SAMO.boky, FB.NASIVKY_SAMO.stred, FB.NASIVKY_SAMO.boky + FB.NASIVKY_SAMO.stred, FB.TAPACIR_SAMO, FB.NASIVKA_DVERE_SAMO]);

console.log("6b) Kamión bez vybranej značky – ako živý kód");
over("kamión bez značky + tapacír + nášivka na dverách = bez tapacíru", sum(vypocitajCenu({ typ: "kamion", znacka: null, material: PRES, nasivky: "boky+stred", tapacir: "ano", nasivkaDvere: true }, data)), { spolu: 304, usetrene: 45, pct: 13 });
over("krok tapacíru sa pri kamióne bez značky stále ukáže", tapacirDostupny({ typ: "kamion" }, data), true);

console.log("7b) Karty ponuky (ponuka) = riadky vypocitajCenu = živý Shoptet");
const po = ponuka(data);
for (const m of MATERIALY) over("karta materiálu " + m.nazov, po.material[m.nazov], priplatokZive("material", m.nazov));
over("karta nášiviek – balík", po.nasivky["boky+stred"], { suma: 95, povodna: 140, usetrite: 45 });
over("karta nášiviek – šofér a spolujazdec", po.nasivky.boky, { suma: 59, povodna: 70, usetrite: 11 });
over("karta nášiviek – stred", po.nasivky.stred, { suma: 59, povodna: 70, usetrite: 11 });
over("karta nášiviek – nie", po.nasivky.nechcem, { suma: 0, povodna: null, usetrite: 0 });
over("karta tapacíru", po.tapacir, { suma: 119, povodna: 179, usetrite: 60 });
over("nášivka na tapacír dverí", po.nasivka_dvere, { suma: 49, povodna: 89, usetrite: 40 });
for (const k of ["boky+stred", "boky", "stred"]) {
  const r = vypocitajCenu({ nasivky: k }, data).riadky.find((x) => x.id === "nasivky");
  over("  karta " + k + " = súhrn", [po.nasivky[k].suma, po.nasivky[k].povodna], [r.suma, r.povodna]);
}
const bezUsp = ponuka(data, { usporaAjPriJednejStrane: false });
over("režim ako živý kód: karta „šofér a spolujazdec“ bez prečiarknutej ceny", bezUsp.nasivky.boky, { suma: 59, povodna: null, usetrite: 0 });
// zmena ceny v Shoptete sa prejaví na karte aj v súhrne naraz
const s352 = select("tapacir", doc);
const oAno = Array.prototype.find.call(s352.options, (o) => /Áno chcem/.test(o.textContent));
oAno.textContent = "Áno chcem (v konfigurátore – balík) +€129";
oAno.setAttribute("data-surcharge-final-price", "129");
const data2 = { ceny: citajCeny(doc), vozidla: data.vozidla };
over("zmena tapacíru v Shoptete na 129 €: karta", ponuka(data2).tapacir, { suma: 129, povodna: 179, usetrite: 50 });
over("zmena tapacíru v Shoptete na 129 €: súhrn", vypocitajCenu({ znacka: "DAF (TIR)", tapacir: "ano" }, data2).spolu, 199 + 129);

console.log("8) Chybné vstupy");
let hodil = false; try { vypocitajCenu({ material: "Neexistuje" }, data); } catch { hodil = true; }
over("neznámy materiál vyhodí chybu", hodil, true);
const doc3 = new JSDOM(readFileSync(FIXTURE, "utf8")).window.document;
select("tapNasivka", doc3).remove();
hodil = false; try { citajCeny(doc3); } catch { hodil = true; }
over("chýba select Nášivky na tapacír -> citajCeny vyhodí chybu (poistka)", hodil, true);

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
