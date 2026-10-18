#!/usr/bin/env node
// Test (b) košíka kamiónov — jsdom E2E (docs/kamiony-1v-plan.md §5 (b)). Fixture živej stránky 640, ozajstná cesta
// productPage.js -> initKonfigurator1v s ?novy=vyvoj, klikanie po UI (data-a akcie). Natívne tlačidlo košíka má
// počítadlo a FormData v okamihu kliku (odoslanie sa zruší). Pre každú cestu:
//   - 5 povinných selectov má hodnotu, texty zvolených možností podľa tabuľky plánu §2.1,
//   - hodnoty všetkých 15 selectov = React (vyrezaný gen.jsx syncToShoptet na čistej kópii fixture po tých istých
//     krokoch — zrkadlo), kľúče FormData = productId, priceId, language, amount + 15 príplatkov,
//   - sessionStorage.truckOrderSummary = buildTruckOrderSummary(naStavReactu(S)), značky [KONFIGURÁCIA KAMIÓNA],
//     truckVehicle = „<značka> <model>“, súčet Shoptetu = cena konfigurátora, 1 klik, žiadny console.error.
//   node tools/test-kamion-kosik.mjs
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { FIXTURE, spustiStranku, klik, vyber, zaskrtni, pauza, zvolene, nacitajModul, nacitajGen } from "./test-1v/kamion-spolocne.mjs";

const ST = await nacitajModul("assets/js/components/konfigurator1v/kamion/stav.js");
const OS = await nacitajModul("assets/js/truck-konfigurator/order-summary.mjs");
const SH = await nacitajModul("assets/js/components/konfigurator1v/kamion/shoptet.js");
const HTML = readFileSync(FIXTURE, "utf8");
const URL1 = "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/?novy=vyvoj";
const ID = [346, 376, 379, 349, 403, 406, 409, 412, 352, 388, 391, 394, 355, 397, 400];
const POVINNE = [346, 376, 379, 349, 352];

let ok = 0, zle = 0;
const over = (nazov, podm, detail) => {
  if (podm) { ok++; console.log("  OK   " + nazov); }
  else { zle++; console.log("  ZLE  " + nazov + (detail ? " — " + detail : "")); }
};
const J = (x) => JSON.stringify(x);

/** Otvorí stránku a pripraví zrkadlo Reactu (gen.jsx sync na čistej kópii fixture po každom kroku). */
async function otvor(opt = {}) {
  const s = await spustiStranku(Object.assign({ url: URL1 }, opt));
  const wz = new JSDOM(HTML, { url: URL1 }).window;
  const gen = nacitajGen("konfigurator.gen.jsx", wz);
  const k = s.window.__lcd1vKamion;
  if (!k) throw new Error("nový konfigurátor sa nepostavil: " + s.chyby.join(" | "));
  const zrkadli = () => gen.syncToShoptet(ST.naStavReactu(k.ui.S));
  zrkadli();
  const d = s.document;
  const krok = (fn) => { fn(); zrkadli(); };
  return {
    s, d, k, wz, zrkadli,
    klik: (sel) => krok(() => klik(d, "#lcd1v-kamion " + sel)),
    vyber: (pole, v) => krok(() => vyber(d, pole, v)),
    zaskrtni: (a, v) => krok(() => zaskrtni(d, a, v)),
    dalej: (id) => krok(() => klik(d, '#lcd1v-kamion [data-a="dalej"][data-v="' + id + '"]')),
  };
}
const a = (akcia, v, m) => '[data-a="' + akcia + '"]' + (m ? '[data-m="' + m + '"]' : "") + (v != null ? '[data-v="' + v + '"]' : "");

/** Vozidlo + materiál + farba + lemovanie (kroky 1–4). */
function zaklad(t, { typ = "kamion", znacka, model, polia = {}, material, farba, lem }) {
  if (typ !== "kamion") t.klik(a("typ", typ));
  t.vyber("znacka", znacka);
  t.vyber("model", model);
  Object.entries(polia).forEach(([p, v]) => t.vyber(p, v));
  t.dalej("vozidlo");
  t.klik(a("mat", material)); t.dalej("material");
  t.klik(a("farba", farba)); t.dalej("farba");
  t.klik(a("lem", lem)); t.dalej("lemovanie");
}

/** Spoločné kontroly po „Pridať do košíka“. */
async function kontrolaKosika(t, meno, ocak = {}) {
  const { s, d, k, wz } = t;
  const kliky0 = s.kliky.length;
  t.klik(a("kosik"));
  await pauza(200);
  const S = k.ui.S;
  const stav = ST.naStavReactu(S);
  over(meno + ": 1 klik na natívne tlačidlo", s.kliky.length - kliky0 === 1, "klikov " + (s.kliky.length - kliky0));
  over(meno + ": povinné selecty majú hodnotu", POVINNE.every((id) => zvolene(d, id)), POVINNE.map((id) => id + "=" + zvolene(d, id)).join(", "));
  const nase = {}, react = {};
  ID.forEach((id) => { nase[id] = zvolene(d, id); react[id] = zvolene(wz.document, id); });
  over(meno + ": 15 selectov = React (zrkadlo gen.jsx)", J(nase) === J(react), "\n        nové  " + J(nase) + "\n        React " + J(react));
  Object.entries(ocak.selecty || {}).forEach(([id, txt]) => over(meno + ": " + id + " = „" + txt + "“", nase[id] === txt, "je „" + nase[id] + "“"));
  const posledny = s.kliky[s.kliky.length - 1];
  const kluce = posledny ? posledny.data.map((x) => x[0]).sort() : [];
  const cakane = ["amount", "language", "priceId", "productId"].concat(ID.map((id) => "surchargeParameterValueId[" + id + "]")).sort();
  over(meno + ": kľúče FormData = Shoptet (bez polí nového UI)", J(kluce) === J(cakane), J(kluce));
  const pid = posledny && posledny.data.find((x) => x[0] === "productId");
  over(meno + ": productId 640", pid && pid[1] === "640");
  const suhrn = s.window.sessionStorage.getItem("truckOrderSummary");
  over(meno + ": poznámka = buildTruckOrderSummary(naStavReactu(S))", suhrn === OS.buildTruckOrderSummary(stav, "sk"), "\n" + suhrn);
  const zlucene = OS.mergeTruckOrderSummaryIntoNote("", suhrn);
  over(meno + ": poznámka objednávky so značkami [KONFIGURÁCIA KAMIÓNA]", /^\[KONFIGURÁCIA KAMIÓNA\]\n[\s\S]+\n\[\/KONFIGURÁCIA KAMIÓNA\]$/.test(zlucene));
  if (ocak.poznamka) over(meno + ": poznámka znak po znaku", suhrn === ocak.poznamka, "\n--- je\n" + suhrn + "\n--- má byť\n" + ocak.poznamka);
  (ocak.poznamkaObsahuje || []).forEach((x) => over(meno + ": poznámka obsahuje „" + x + "“", (suhrn || "").includes(x)));
  over(meno + ": truckVehicle", s.window.sessionStorage.getItem("truckVehicle") === S.znacka + " " + S.model, s.window.sessionStorage.getItem("truckVehicle"));
  const spolu = k.ui.cena().spolu;
  over(meno + ": súčet Shoptetu = cena konfigurátora (" + spolu + " €)", SH.sucetShoptetu(d) === spolu, "Shoptet " + SH.sucetShoptetu(d));
  if (ocak.spolu != null) over(meno + ": spolu " + ocak.spolu + " €", spolu === ocak.spolu, "je " + spolu);
  if (ocak.usetrene != null) over(meno + ": ušetríte " + ocak.usetrene + " € (" + ocak.pct + " %)", k.ui.cena().usetrene === ocak.usetrene && k.ui.cena().usetrenePercent === ocak.pct, J(k.ui.cena()));
  const suma = d.querySelector("#lcd1v-kamion .k-suhrn__suma");
  over(meno + ": súhrn ukazuje " + spolu + " €", suma && suma.textContent === spolu + " €", suma && suma.textContent);
  over(meno + ": žiadny console.error", s.chyby.length === 0, s.chyby.join(" | "));
}

const PRES = "Prémiová syntetická koža – prešívaná";
const P423 = "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: DAF (TIR) XF106 2017-2021\n- Typ prevodovky: Automatická prevodovka\n\nKOBERČEKY POD SEDAČKY\n- Typ a farba materiálu: Prémiová syntetická koža – prešívaná – 12\n- Farba lemovania: Čierna + Červená\n- Rozloženie nášiviek: Šofér + spolujazdec + stred\n- Typ nášivky na stred: H19\n- Farba nášivky na stred: 2999 – Čierna\n- Typ nášiviek na boky: H19\n- Farba nášiviek na boky: 2999 – Čierna\n\nTAPACÍR DVERÍ\n- Typ a farba materiálu: Rovnaký ako koberčeky – Prémiová syntetická koža – prešívaná – 12\n- Farba lemovania: Rovnaká ako farba lemovania koberčekov – Čierna + Červená\n- Nášivky na tapacír: Nechcem";
const DAF = { znacka: "DAF (TIR)", model: "XF106 2017-2021", material: PRES, farba: "12", lem: "04" };

console.log("1) DAF XF106 2017–2021, prešívaná 12, lem 04, balík H19/2999, stred rovnaký, tapacír ako koberce, bez nášivky na dverách");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); t.klik(a("nit", "2999", "boky"));
  t.dalej("nasivky");
  t.klik(a("tap", "ano")); t.klik(a("tapNas", "nie"));
  await kontrolaKosika(t, "1", {
    spolu: 423, usetrene: 105, pct: 20, poznamka: P423,
    selecty: { 346: PRES, 349: "Šofér + spolujazdec + stred (BALÍK)", 403: "Nášivka H19", 406: "2999 – Čierna", 409: "Nášivka H19", 412: "2999 – Čierna", 352: "Áno chcem (v konfigurátore – balík)", 388: "Rovnaký ako koberec", 391: "Rovnaká ako koberec", 394: "Rovnaké ako koberec", 355: "Nie nechcem nášivku na dverách", 397: "Bez nášivky", 400: "Bez nite", 376: "Vyberie sa v konfigurátore", 379: "Vyberie sa v konfigurátore" },
  });
}

console.log("2) Fiat (dodávka) Ducato 2007–2025, jednofarebná 10G, lem 09, len stred H21 / 3546");
{
  const t = await otvor();
  zaklad(t, { typ: "dodavka", znacka: "Fiat (dodávka)", model: "Ducato 2007-2025", material: "Prémiová syntetická koža – jednofarebná", farba: "10G", lem: "09" });
  over("2: krok tapacíru nie je (5 krokov)", t.d.querySelectorAll("#lcd1v-kamion .k-krok").length === 5 && !t.d.querySelector('[data-krok="tapacir"]'));
  t.klik(a("nas", "stred"));
  t.klik(a("motiv", "H21", "stred")); t.klik(a("nit", "3546", "stred"));
  t.dalej("nasivky");
  await kontrolaKosika(t, "2", {
    spolu: 258,
    selecty: { 352: "Nie nechcem tapacír dverí", 355: "Nie nechcem nášivku na dverách", 388: "", 391: "", 394: "", 397: "", 400: "", 349: "Len stred", 409: "Nášivka H21", 412: "3546 – Béžová", 403: "Bez nášivky", 406: "Bez nite" },
  });
}

console.log("3) MAN TGX 2007–2017: prevodovka a zásuvky sú povinné");
{
  const t = await otvor();
  t.vyber("znacka", "MAN (TIR)");
  t.vyber("model", "TGX 2007-2017");
  t.dalej("vozidlo");
  over("3: krok 1 červený bez prevodovky a zásuviek", !!t.d.querySelector('#lcd1v-kamion [data-krok="vozidlo"].is-error.is-open'));
  t.klik(a("kosik"));
  await pauza(200);
  over("3: bez polí 0 klikov na natívne tlačidlo", t.s.kliky.length === 0);
  t.vyber("prevodovka", "Manuálna prevodovka");
  t.vyber("zasuvky", "2 zásuvky (šuplíky)");
  t.dalej("vozidlo");
  t.klik(a("mat", PRES)); t.dalej("material");
  t.klik(a("farba", "12")); t.dalej("farba");
  t.klik(a("lem", "04")); t.dalej("lemovanie");
  t.klik(a("nas", "nechcem"));
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "3", { poznamkaObsahuje: ["- Typ prevodovky: Manuálna prevodovka", "- Počet zásuviek: 2 zásuvky (šuplíky)"], selecty: { 349: "Bez nášiviek", 403: "Bez nášivky", 406: "Bez nite", 409: "Bez nášivky", 412: "Bez nite", 352: "Nie nechcem tapacír dverí" } });
}

console.log("4) Len stred (TIR, tapacír nie)");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "stred"));
  t.klik(a("motiv", "H21", "stred")); t.klik(a("nit", "2840", "stred"));
  t.dalej("nasivky");
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "4", { spolu: 199 + 10 + 59, selecty: { 403: "Bez nášivky", 406: "Bez nite", 409: "Nášivka H21", 412: "2840 – Zelená", 397: "Bez nášivky", 400: "Bez nite", 355: "Nie nechcem nášivku na dverách" } });
}

console.log("5) Šofér + spolujazdec (nie BALÍK)");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky"));
  t.klik(a("motiv", "H19", "boky")); t.klik(a("nit", "2901", "boky"));
  t.dalej("nasivky");
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "5", { spolu: 199 + 10 + 59, selecty: { 349: "Šofér + spolujazdec", 403: "Nášivka H19", 406: "2901 – Strieborná", 409: "Bez nášivky", 412: "Bez nite" } });
}

console.log("6a) Tapacír áno, nášivka na dverách áno (rovnaká ako na kobercoch)");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); t.klik(a("nit", "2999", "boky"));
  t.dalej("nasivky");
  t.klik(a("tap", "ano")); t.klik(a("tapNas", "ano"));
  await kontrolaKosika(t, "6a", {
    spolu: 472, usetrene: 145, pct: 24,
    poznamkaObsahuje: ["- Nášivky na tapacír: Chcem", "- Typ nášivky na tapacír: Rovnaká ako na koberčekoch – H19", "- Farba nášiviek na tapacíre: Rovnaká ako na koberčekoch – 2999 – Čierna"],
    selecty: { 355: "Áno chcem nášivku na dverách", 397: "Rovnaká ako koberec", 400: "Rovnaká ako koberec" },
  });
}

console.log("6b) Tapacír áno, nášivka na dverách nie");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); t.klik(a("nit", "2999", "boky"));
  t.dalej("nasivky");
  t.klik(a("tap", "ano")); t.klik(a("tapNas", "nie"));
  await kontrolaKosika(t, "6b", { spolu: 423, selecty: { 355: "Nie nechcem nášivku na dverách", 397: "Bez nášivky", 400: "Bez nite" } });
}

console.log("7) Tapacír áno -> nášivka áno -> tapacír Nie (oprava Z1)");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); t.klik(a("nit", "2999", "boky"));
  t.dalej("nasivky");
  t.klik(a("tap", "ano")); t.klik(a("tapNas", "ano"));
  const pred = t.k.ui.cena().spolu;
  t.klik(a("tap", "nie"));
  const po = t.k.ui.cena().spolu;
  over("7: spolu kleslo o 119 + 49", pred - po === 119 + 49, pred + " -> " + po);
  await kontrolaKosika(t, "7", { spolu: 304, selecty: { 352: "Nie nechcem tapacír dverí", 355: "Nie nechcem nášivku na dverách", 397: "Bez nášivky", 400: "Bez nite" } });
  console.log("     (388/391/394 po Nie: „" + [388, 391, 394].map((id) => zvolene(t.d, id)).join("“, „") + "“ — ako React)");
}

console.log("8) Iný materiál dverí: Mikrosemiš – dvojfarebný 3N, lemovanie 11, vlastný motív H21 / 2840");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); t.klik(a("nit", "2999", "boky"));
  t.dalej("nasivky");
  t.klik(a("tap", "ano"));
  t.klik(a("tapZmenit"));
  t.klik(a("tapMat", "Mikrosemiš – dvojfarebný"));
  t.klik(a("tapFarba", "3N"));
  t.klik(a("tapLem", "11"));
  t.klik(a("tapNas", "ano"));
  t.zaskrtni("tapNasRovnaka", false);
  t.klik(a("motiv", "H21", "dvere")); t.klik(a("nit", "2840", "dvere"));
  await kontrolaKosika(t, "8", {
    poznamkaObsahuje: ["TAPACÍR DVERÍ\n- Typ a farba materiálu: Mikrosemiš – dvojfarebný – 3N", "- Farba lemovania: Béžová + Hnedá", "- Typ nášivky na tapacír: H21", "- Farba nášiviek na tapacíre: 2840 – Zelená"],
    selecty: { 388: "Vyberie sa v konfigurátore", 391: "Vyberie sa v konfigurátore", 394: "Vyberie sa v konfigurátore", 397: "Nášivka H21", 400: "2840 – Zelená", 355: "Áno chcem nášivku na dverách" },
  });
}

console.log("9) Nič nevybraté -> Pridať do košíka (súhrn aj lišta)");
{
  const t = await otvor();
  t.klik(a("kosik"));
  await pauza(200);
  const lista = t.d.querySelector('#lcd1v-lista [data-a="lista"]');
  lista.dispatchEvent(new t.s.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  await pauza(200);
  over("9: 0 klikov na natívne tlačidlo", t.s.kliky.length === 0);
  over("9: otvorený krok 1 s červeným rámom", !!t.d.querySelector('#lcd1v-kamion [data-krok="vozidlo"].is-open.is-error'));
  over("9: hláška „dokončite kroky“ v súhrne", /dokončite kroky označené červenou/.test(t.d.querySelector("#lcd1v-kamion .sh__err") ? t.d.querySelector("#lcd1v-kamion .sh__err").textContent : ""));
  over("9: lišta „Spolu od 199 € · Pokračovať“", /Spolu\s+od\s199\s€/.test(t.d.querySelector("#lcd1v-lista .lcd1v-lista__suma").textContent) && t.d.querySelector("#lcd1v-lista .lcd1v-lista__kos").textContent === "Pokračovať");
  over("9: žiadny console.error", t.s.chyby.length === 0, t.s.chyby.join(" | "));
}

console.log("10) Predvýber vozidla zo session (prepínač na titulke)");
{
  const t = await otvor({ session: { truckBrand: "DAF (TIR)", truckModel: "XF106 2013-2016", truckExtras: JSON.stringify({ prevodovka: "Manuálna prevodovka", sedadlo: "Neexistuje" }) } });
  const S = t.k.ui.S;
  over("10: značka, model a prevodovka predvyplnené", S.znacka === "DAF (TIR)" && S.model === "XF106 2013-2016" && S.polia.prevodovka === "Manuálna prevodovka" && !("sedadlo" in S.polia), J(S.polia));
  over("10: krok 1 hotový", !t.k.ui.U.chyby.vozidlo && /XF106 2013–2016/.test(t.d.querySelector('#lcd1v-kamion [data-krok="vozidlo"] .k-krok__vy').textContent));
  const t2 = await otvor({ session: { truckBrand: "DAF (TIR)", truckModel: "Neexistuje", truckExtras: "{zle" } });
  over("10: neplatný model -> len značka", t2.k.ui.S.znacka === "DAF (TIR)" && t2.k.ui.S.model === null && J(t2.k.ui.S.polia) === "{}");
  const t3 = await otvor({ session: { truckBrand: "Tatra (TIR)", truckModel: "X" } });
  over("10: neznáma značka -> nič", t3.k.ui.S.znacka === null);
  const t4 = await otvor({ session: { truckBrand: "Fiat (dodávka)", truckModel: "Ducato 2007-2025" } });
  over("10: dodávka -> prepínač Dodávka, bez kroku tapacíru", t4.k.ui.S.typ === "dodavka" && !t4.d.querySelector('[data-krok="tapacir"]'));
  over("10: modul kľúče prepínača nepíše", t4.s.window.sessionStorage.getItem("truckBrand") === "Fiat (dodávka)");
}

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
