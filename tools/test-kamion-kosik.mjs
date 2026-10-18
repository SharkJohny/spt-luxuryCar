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
/** Detaily tapacíru: bez tapacíru ich nové UI uprace na prázdne (oprava N1); React nechá staré hodnoty. */
const TAP_DETAILY = [388, 391, 394, 397, 400];

/** React (gen.jsx syncToShoptet) na ČISTEJ kópii fixture len s finálnym stavom = zákazník, ktorý išiel rovno. */
function reactCisty(stav) {
  const w = new JSDOM(HTML, { url: URL1 }).window;
  nacitajGen("konfigurator.gen.jsx", w).syncToShoptet(stav);
  const out = {};
  ID.forEach((id) => { out[id] = zvolene(w.document, id); });
  return out;
}

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
/** Farba nite ako zákazník: farby za „Ďalšie farby (+5)“ (návrh C, 18. 10. 2026) najprv rozbalí, potom klikne. */
function nit(t, kod, m) {
  if (!t.d.querySelector("#lcd1v-kamion " + a("nit", kod, m))) t.klik(a("viac", null, m));
  t.klik(a("nit", kod, m));
}

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
  // zámerný rozdiel N1: bez tapacíru detaily tapacíru = React z čistej stránky (nie staré hodnoty z histórie)
  const cisty = reactCisty(stav);
  if (stav.doorPanelChoice !== "ano") TAP_DETAILY.forEach((id) => { react[id] = cisty[id]; });
  over(meno + ": 15 selectov = React (zrkadlo gen.jsx; N1 bez tapacíru = čistá stránka)", J(nase) === J(react), "\n        nové  " + J(nase) + "\n        React " + J(react));
  over(meno + ": 15 selectov nezávisí od histórie (= React z čistej stránky)", J(nase) === J(cisty), "\n        nové  " + J(nase) + "\n        čistý " + J(cisty));
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
  t.klik(a("motiv", "H19", "boky")); nit(t, "2999", "boky");
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
  t.klik(a("motiv", "H21", "stred")); nit(t, "3546", "stred");
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
  t.klik(a("motiv", "H21", "stred")); nit(t, "2840", "stred");
  t.dalej("nasivky");
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "4", { spolu: 199 + 10 + 59, selecty: { 403: "Bez nášivky", 406: "Bez nite", 409: "Nášivka H21", 412: "2840 – Zelená", 397: "Bez nášivky", 400: "Bez nite", 355: "Nie nechcem nášivku na dverách" } });
}

console.log("5) Šofér + spolujazdec (nie BALÍK)");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky"));
  t.klik(a("motiv", "H19", "boky")); nit(t, "2901", "boky");
  t.dalej("nasivky");
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "5", { spolu: 199 + 10 + 59, selecty: { 349: "Šofér + spolujazdec", 403: "Nášivka H19", 406: "2901 – Strieborná", 409: "Bez nášivky", 412: "Bez nite" } });
}

console.log("6a) Tapacír áno, nášivka na dverách áno (rovnaká ako na kobercoch)");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); nit(t, "2999", "boky");
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
  t.klik(a("motiv", "H19", "boky")); nit(t, "2999", "boky");
  t.dalej("nasivky");
  t.klik(a("tap", "ano")); t.klik(a("tapNas", "nie"));
  await kontrolaKosika(t, "6b", { spolu: 423, selecty: { 355: "Nie nechcem nášivku na dverách", 397: "Bez nášivky", 400: "Bez nite" } });
}

console.log("7) Tapacír áno -> nášivka áno -> tapacír Nie (oprava Z1)");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); nit(t, "2999", "boky");
  t.dalej("nasivky");
  t.klik(a("tap", "ano")); t.klik(a("tapNas", "ano"));
  const pred = t.k.ui.cena().spolu;
  t.klik(a("tap", "nie"));
  const po = t.k.ui.cena().spolu;
  over("7: spolu kleslo o 119 + 49", pred - po === 119 + 49, pred + " -> " + po);
  // N1: 388/391/394 po Nie prázdne ako pri tapacíri Nie hneď (React tu nechá „Rovnaký/á/é ako koberec“ za 0 €)
  await kontrolaKosika(t, "7", { spolu: 304, selecty: { 352: "Nie nechcem tapacír dverí", 355: "Nie nechcem nášivku na dverách", 388: "", 391: "", 394: "", 397: "Bez nášivky", 400: "Bez nite" } });
}

console.log("8) Iný materiál dverí: Mikrosemiš – dvojfarebný 3N, lemovanie 11, vlastný motív H21 / 2840");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); nit(t, "2999", "boky");
  t.dalej("nasivky");
  t.klik(a("tap", "ano"));
  t.klik(a("tapZmenit"));
  t.klik(a("tapMat", "Mikrosemiš – dvojfarebný"));
  t.klik(a("tapFarba", "3N"));
  t.klik(a("tapLem", "11"));
  t.klik(a("tapNas", "ano"));
  t.klik(a("tapNasRovnaka", "0")); // dlaždica „Iný motív a niť“ (návrh C; predtým zaškrtávacie políčko)
  t.klik(a("motiv", "H21", "dvere")); nit(t, "2840", "dvere");
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

console.log("11) N1: TIR s tapacírom a vlastnou nášivkou na dverách -> prepnúť na dodávku");
{
  const t = await otvor();
  zaklad(t, DAF);
  t.klik(a("nas", "nechcem"));
  t.klik(a("tap", "ano")); t.klik(a("tapZmenit")); t.klik(a("tapNas", "ano"));
  t.klik(a("motiv", "H21", "dvere")); nit(t, "2824", "dvere");
  over("11: pred prepnutím 397 „Nášivka H21“, 400 „2824 – Červená“", zvolene(t.d, 397) === "Nášivka H21" && zvolene(t.d, 400) === "2824 – Červená");
  t.klik(a("krok", "vozidlo")); t.klik(a("typ", "dodavka"));
  t.vyber("znacka", "Fiat (dodávka)"); t.vyber("model", "Ducato 2007-2025"); t.dalej("vozidlo");
  await kontrolaKosika(t, "11", { spolu: 209, selecty: { 352: "Nie nechcem tapacír dverí", 355: "Nie nechcem nášivku na dverách", 388: "", 391: "", 394: "", 397: "", 400: "" } });
}

/** DAF 12/04, nášivky Nechcem, tapacír Nie = hotový výber za 209 €. */
function hotovyDaf(t) { zaklad(t, DAF); t.klik(a("nas", "nechcem")); t.klik(a("tap", "nie")); }
const tlacidlo = (t) => t.d.querySelector('#lcd1v-kamion [data-a="kosik"]');

console.log("12) N3: zmena výberu do 100 ms po „Pridať do košíka“ -> nič neodíde");
{
  const t = await otvor();
  hotovyDaf(t);
  t.klik(a("kosik"));
  t.klik(a("krok", "material")); t.klik(a("mat", "Mikrosemiš – dvojfarebný"));
  await pauza(250);
  over("12: 0 klikov na natívne tlačidlo", t.s.kliky.length === 0, "klikov " + t.s.kliky.length);
  over("12: poznámka sa nezapísala", t.s.window.sessionStorage.getItem("truckOrderSummary") === null);
  over("12: tlačidlo znova aktívne", !tlacidlo(t).disabled);
}

console.log("13) N4: dve ťuknutia na „Pridať do košíka“ 300 ms po sebe -> 1 pridanie");
{
  const t = await otvor();
  hotovyDaf(t);
  t.klik(a("kosik")); await pauza(300);
  const b = tlacidlo(t), bl = t.d.querySelector('#lcd1v-lista [data-a="lista"]');
  over("13: tlačidlo aj lišta vypnuté, aria-busy", b.disabled && b.getAttribute("aria-busy") === "true" && bl.disabled, b.outerHTML.slice(0, 160));
  t.klik(a("kosik"));
  bl.dispatchEvent(new t.s.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  await pauza(300);
  over("13: 1 klik na natívne tlačidlo", t.s.kliky.length === 1, "klikov " + t.s.kliky.length);
  t.d.dispatchEvent(new t.s.window.Event("ShoptetCartUpdated"));
  over("13: po ShoptetCartUpdated tlačidlo aktívne", !tlacidlo(t).disabled);
  t.klik(a("kosik")); await pauza(250);
  over("13: vedomé ďalšie pridanie po odpovedi košíka prejde", t.s.kliky.length === 2, "klikov " + t.s.kliky.length);
  const t2 = await otvor();
  hotovyDaf(t2);
  t2.klik(a("kosik")); await pauza(3200);
  over("13: bez odpovede košíka sa tlačidlo zapne samé po 3 s", !tlacidlo(t2).disabled);
  over("13: žiadny console.error", t.s.chyby.length === 0 && t2.s.chyby.length === 0, t.s.chyby.concat(t2.s.chyby).join(" | "));
}

console.log("14) N2 (časť): nepodarené pridanie neprepíše poznámku položky, ktorá už je v košíku");
{
  const t = await otvor({ session: { truckOrderSummary: "PREDOSLA" } });
  hotovyDaf(t);
  const x = t.d.createElement("select");
  x.setAttribute("data-parameter-id", "999");
  x.required = true;
  x.innerHTML = "<option value=\"\">-</option><option value=\"1\">a</option><option value=\"2\">b</option>";
  t.d.getElementById("product-detail-form").appendChild(x);
  t.klik(a("kosik")); await pauza(250);
  over("14: 0 klikov, poznámka ostala", t.s.kliky.length === 0 && t.s.window.sessionStorage.getItem("truckOrderSummary") === "PREDOSLA");
}

console.log("15) R3: výzvy obsahu otvárajú krok z data-p1v-kamion-krok");
{
  const t = await otvor();
  const vyzva = (krok) => {
    const x = t.d.createElement("a");
    x.href = "#product-detail-form";
    if (krok) x.setAttribute("data-p1v-kamion-krok", krok);
    t.d.body.appendChild(x);
    x.dispatchEvent(new t.s.window.MouseEvent("click", { bubbles: true, cancelable: true }));
    x.remove();
  };
  vyzva("material");
  over("15: bez vozidla -> krok 1 s červeným rámom", t.k.ui.U.otvoreny === "vozidlo" && !!t.d.querySelector('#lcd1v-kamion [data-krok="vozidlo"].is-error'));
  t.vyber("znacka", "DAF (TIR)"); t.vyber("model", "XF106 2017-2021"); t.dalej("vozidlo");
  vyzva("material");
  over("15: s vozidlom „Vybrať materiál“ -> krok Materiál", t.k.ui.U.otvoreny === "material", t.k.ui.U.otvoreny);
  vyzva(null);
  over("15: výzva bez nápovedy -> Vozidlo", t.k.ui.U.otvoreny === "vozidlo", t.k.ui.U.otvoreny);
  vyzva("neexistuje");
  over("15: neznámy krok -> Vozidlo", t.k.ui.U.otvoreny === "vozidlo", t.k.ui.U.otvoreny);
  const html = readFileSync(new URL("../admin-html/src/p1v-kamiony/14-kamiony-materialy.sk.html", import.meta.url), "utf8");
  over("15: obsah „Vybrať materiál“ nesie data-p1v-kamion-krok=material", /href="#product-detail-form" data-p1v-kamion-krok="material"/.test(html));
}

console.log("16) R5: „… recenzií na Google“ pod H1 vedie na sekciu Recenzie");
{
  const t = await otvor();
  const h = t.d.querySelector(".k-hodn");
  over("16: href #p1v-recenzie", !!h && h.getAttribute("href") === "#p1v-recenzie");
  const sek = t.d.createElement("div");
  sek.className = "p1v-miesto";
  sek.innerHTML = "<section data-lcd-sekcia=\"a-recenzie\" id=\"p1v-recenzie\"></section>";
  t.d.body.appendChild(sek);
  const ciel = sek.firstChild;
  ciel.getClientRects = () => [{}];
  ciel.getBoundingClientRect = () => ({ top: 6830, left: 0, width: 10, height: 10, bottom: 6840, right: 10 });
  let posun = null;
  t.s.window.scrollTo = (o) => { posun = o; };
  const e = new t.s.window.MouseEvent("click", { bubbles: true, cancelable: true });
  h.dispatchEvent(e);
  over("16: klik posunie na recenzie (− 90 px hlavička)", !!posun && posun.top === 6830 - 90 && e.defaultPrevented, J(posun));
}

console.log("17) Kroky 5 a 6 podľa návrhu C (Michal 18. 10. 2026): fotkové dlaždice, veľký náhľad, celá fotka dverí, zjavné voľby");
{
  const t = await otvor();
  zaklad(t, DAF);
  const q = (sel) => t.d.querySelector("#lcd1v-kamion " + sel);
  const qa = (sel) => Array.from(t.d.querySelectorAll("#lcd1v-kamion " + sel));
  const tx = (sel) => (q(sel) ? q(sel).textContent.replace(/\s+/g, " ").trim() : "");
  const S = t.k.ui.S;
  // krok 5: 3 fotkové dlaždice (pred sedadlá — ★ všetky tri v strede — stredový koberec) + „Nie, ďakujem“
  const dl = qa(".kn-dv > .kn-dv__b");
  over("17: 3 fotkové dlaždice v poradí boky, ★ všetky tri, stred", J(dl.map((x) => x.getAttribute("data-v"))) === J(["boky", "boky+stred", "stred"]), J(dl.map((x) => x.getAttribute("data-v"))));
  over("17: každá dlaždica má fotku kabíny z assets/img/1v a „Ilustračná fotka“", dl.length === 3 && dl.every((x) => /\/assets\/img\/1v\/kamion-nasivky-kabina\.jpg$/.test(x.querySelector(".kn-scena > img").getAttribute("src")) && /Ilustračná fotka/.test(x.textContent)));
  over("17: zlaté krúžky na miestach nášiviek (2 / 3 / 1)", J(dl.map((x) => x.querySelectorAll(".kn-bod").length)) === J([2, 3, 1]));
  over("17: ★ Najobľúbenejšie len na balíku v strede", dl[1].querySelector(".k-badge") && /Najobľúbenejšie/.test(dl[1].querySelector(".k-badge").textContent) && !dl[0].querySelector(".k-badge") && !dl[2].querySelector(".k-badge"));
  over("17: cena v rámiku balíka + 95 € / 140 € / Ušetríte 45 €", /\+\s95\s€/.test(dl[1].querySelector(".kn-cena b").textContent) && /^140\s€$/.test(dl[1].querySelector(".kn-cena s").textContent) && /^Ušetríte 45\s€$/.test(dl[1].querySelector(".kn-cena i").textContent));
  over("17: ceny strán + 59 € / 70 € / Ušetríte 11 €", [dl[0], dl[2]].every((x) => /\+\s59\s€/.test(x.querySelector(".kn-cena b").textContent) && /^70\s€$/.test(x.querySelector(".kn-cena s").textContent) && /^Ušetríte 11\s€$/.test(x.querySelector(".kn-cena i").textContent)));
  const nie = q(a("nas", "nechcem"));
  over("17: „Nie, ďakujem“ = zlaté tlačidlo pod dlaždicami", !!nie && nie.classList.contains("k-btn-zlate") && nie.getAttribute("type") === "button" && /koberce bez nášiviek/.test(nie.textContent));
  over("17: všetky ovládače kroku 5 sú type=button bez name", qa('[data-krok="nasivky"] button').every((x) => x.getAttribute("type") === "button") && !qa('[data-krok="nasivky"] [name]').length);
  // zaškrtávanie miest -> stále jeden zo 4 stavov Shoptetu
  t.klik(a("nas", "boky"));
  over("17: pred sedadlá -> boky, Vaša voľba s tipom na balík", S.nas === "boky" && /Vaša voľba/.test(tx(".kn-vv")) && /všetky tri nášivky spolu len za 95\s€/.test(tx(".kn-vv__tip")), S.nas + " | " + tx(".kn-vv"));
  over("17: prístupnosť — fotka v dlaždici je pre čítačku skrytá (meno = názov + cena), Vaša voľba aria-live", qa(".kn-dv > .kn-dv__b").every((x) => x.querySelector(".kn-foto").getAttribute("aria-hidden") === "true") && q(".kn-vv").getAttribute("aria-live") === "polite");
  t.klik(a("nas", "boky"));
  over("17: ťuk na jediné zvolené miesto nič nemení (výber sa nevráti na prázdny, Shoptet ostane zhodný)", S.nas === "boky" && q(a("nas", "boky")).getAttribute("aria-pressed") === "true" && t.s.chyby.length === 0, S.nas + " | " + t.s.chyby.join(" | "));
  t.klik(a("nas", "stred"));
  over("17: + stredový koberec -> boky+stred (balík), všetky 3 dlaždice zvolené", S.nas === "boky+stred" && qa(".kn-dv__b").every((x) => x.classList.contains("is-on") && x.getAttribute("aria-pressed") === "true"), S.nas);
  over("17: strany v balíku ukazujú „v balíku všetkých troch“", /v balíku všetkých troch/.test(tx('.kn-dv__b[data-v="boky"]')) && /Vybraté – všetky tri koberce/.test(tx(".kn-dv__cta")));
  t.klik(a("nas", "boky+stred"));
  over("17: ťuk na zvolený balík nič nemení, pás „✓ Vybraté“ je stav (nie zelené tlačidlo)", S.nas === "boky+stred" && q(".kn-dv__cta").classList.contains("kn-dv__cta--stav") && t.s.chyby.length === 0, S.nas + " | " + t.s.chyby.join(" | "));
  over("17: farby nite — prvých 6 + „Ďalšie farby (+5)“", qa('[data-a="nit"][data-m="boky"]').length === 6 && /Ďalšie farby \(\+5\)/.test(tx('[data-a="viac"][data-m="boky"]')));
  t.klik(a("motiv", "H21", "boky")); nit(t, "2824", "boky");
  over("17: po „Ďalšie farby“ všetkých 11, vybraná červená", qa('[data-a="nit"][data-m="boky"]').length === 11 && !q('[data-a="viac"][data-m="boky"]') && q(a("nit", "2824", "boky")).getAttribute("aria-pressed") === "true");
  const cv = q(".kn-nh__cv");
  over("17: veľký náhľad — plátno 3:2 s rozlíšením ≥ 960 px, niť červená na farbe kobercov", !!cv && +cv.getAttribute("width") >= 960 && +cv.getAttribute("width") * 2 === +cv.getAttribute("height") * 3 && cv.getAttribute("data-hex") === "#c82030" && /te69da20|t8131265/.test(cv.getAttribute("data-bg")) && /Náhľad: Trucker \(H21\) · niť červená \(2824\)/.test(tx(".kn-nh__hd")), cv && cv.outerHTML.slice(0, 200));
  over("17: pod náhľadom „Kam príde“ so schémou kabíny", /Kam príde: na všetky tri koberce/.test(tx(".kn-nh__pop")) && !!q(".kn-nh__pop svg.kn-schema"));
  const rv = qa('.kn-rv__b[data-a="stredRovnaky"]');
  over("17: stredový koberec — 2 zjavné voľby, predvolene „Rovnaká ako pred sedadlami“", rv.length === 2 && rv[0].getAttribute("data-v") === "1" && rv[0].getAttribute("aria-pressed") === "true" && rv[1].getAttribute("aria-pressed") === "false");
  t.klik(a("stredRovnaky", "0"));
  over("17: „Iný motív alebo niť“ -> výber motívu a nite pre stred", S.stredRovnaky === false && !!q('[data-pole="stredMotiv"]') && !!q('[data-pole="stredNit"]'));
  t.klik(a("stredRovnaky", "1"));
  t.klik(a("nas", "boky"));
  over("17: odobratie nášiviek pred sedadlami -> len stred, motív a niť ostanú (H21 / 2824)", S.nas === "stred" && S.nasStred.motiv === "H21" && S.nasStred.nit === "2824", J(S.nasStred));
  t.klik(a("nas", "stred"));
  over("17: ťuk na jediný zvolený stredový koberec nič nemení", S.nas === "stred" && S.nasStred.motiv === "H21", S.nas);
  t.klik(a("nas", "boky+stred"));
  over("17: ★ Všetky tri -> balík, motív prevzatý zo stredu", S.nas === "boky+stred" && S.nasBoky.motiv === "H21" && S.nasBoky.nit === "2824" && S.stredRovnaky === true, J(S));
  t.dalej("nasivky");
  // krok 6: celá fotka dverí, ponuka v rámiku, rovnaké / inak, nášivka na dvere s miestom a úsporou
  const dvere = q('[data-krok="tapacir"] .kn-dvere:not(.kn-dvere--vyrez) > img');
  over("17: krok 6 — celá fotka dverí (JPEG v assets/img/1v, 1536 × 1024 = 3:2)", !!dvere && /\/assets\/img\/1v\/kamion-dvere-tapacir\.jpg$/.test(dvere.getAttribute("src")) && dvere.getAttribute("width") === "1536" && dvere.getAttribute("height") === "1024" && !q(".k-ponuka__ram"));
  over("17: ponuka tapacíru v rámiku 119 € / Samostatne 179 € / Ušetríte 60 €", /S kobercami len\s?119\s€\s?Samostatne 179\s€\s?Ušetríte 60\s€/.test(tx('[data-krok="tapacir"] .kn-ponuka .kn-cenovka')), tx('[data-krok="tapacir"] .kn-ponuka .kn-cenovka'));
  t.klik(a("tap", "ano"));
  const tr = qa('.kn-rv__b[data-a="tapRovnake"], .kn-rv__b[data-a="tapZmenit"]');
  over("17: materiál tapacíru — 2 zjavné voľby, predvolene „Rovnaké ako koberce“ s popisom kobercov", tr.length === 2 && tr[0].getAttribute("aria-pressed") === "true" && /Rovnaké ako koberce/.test(tr[0].textContent) && /prešívaná/.test(tr[0].textContent) && /Vybrať inak/.test(tr[1].textContent));
  t.klik(a("tapZmenit"));
  over("17: „Vybrať inak“ -> materiál, farba a lemovanie tapacíru vopred ako koberce", S.tapRovnaky === false && S.tapMat === PRES && S.tapFarba === "12" && S.tapLem === "04" && !!q('[data-pole="tapMat"]') && !!q(".kn-vz"));
  over("17: lemovanie uprostred vety malým písmom (lemovanie čierna + červená (04))", /lemovanie čierna \+ červená \(04\)/.test(tx(".kn-vz")), tx(".kn-vz"));
  // revízia 18. 10. 2026: opätovný ťuk na zvolené „Vybrať inak“ po dvojfarebnom mikrosemiši zhodil zhrnutie (farba 12 k nemu nepatrí)
  t.klik(a("tapMat", "Mikrosemiš – dvojfarebný"));
  over("17: dvojfarebný mikrosemiš -> farba kobercov 12 sa zruší", S.tapMat === "Mikrosemiš – dvojfarebný" && S.tapFarba === null, J([S.tapMat, S.tapFarba]));
  t.klik(a("tapZmenit"));
  over("17: opätovný ťuk na „Vybrať inak“ nič nemení — UI stojí, krok 6 neúplný (chýba farba)", S.tapRovnaky === false && S.tapFarba === null && !!q('[data-pole="tapFarba"]') && !q('[data-krok="tapacir"].is-done') && t.s.chyby.length === 0, J([S.tapFarba]) + " | " + t.s.chyby.join(" | "));
  t.klik(a("tapRovnake")); t.klik(a("tapZmenit"));
  over("17: Rovnaké -> Vybrať inak pri dvojfarebnom: farba kobercov sa nedoplní (nepatrí k materiálu)", S.tapRovnaky === false && S.tapMat === "Mikrosemiš – dvojfarebný" && S.tapFarba === null && t.s.chyby.length === 0, J([S.tapMat, S.tapFarba]) + " | " + t.s.chyby.join(" | "));
  t.klik(a("tapRovnake"));
  over("17: „Rovnaké ako koberce“ späť", S.tapRovnaky === true && !q('[data-pole="tapMat"]'));
  over("17: nášivka na dvere — výrez dverí so zlatým krúžkom „Sem príde nášivka“", /Sem príde nášivka/.test(tx(".kn-dvere--vyrez .kn-bod")) && /do stredu výplne dverí/.test(tx('[data-krok="tapacir"] .k-krok__telo')));
  over("17: nášivka na dvere — úspora v rámiku + 49 € / 89 € / Ušetríte 40 €", /S tapacírom len\s?\+\s49\s€\s?Samostatne 89\s€\s?Ušetríte 40\s€/.test(tx(".kn-ponuka--nas .kn-cenovka")), tx(".kn-ponuka--nas .kn-cenovka"));
  t.klik(a("tapNas", "ano"));
  const tn = qa('.kn-rv__b[data-a="tapNasRovnaka"]');
  over("17: nášivka na dvere — 2 zjavné voľby „Rovnaká ako na kobercoch“ / „Iný motív a niť“", tn.length === 2 && tn[0].getAttribute("aria-pressed") === "true" && /Trucker \(H21\)/.test(tn[0].textContent) && /Iný motív a niť/.test(tn[1].textContent));
  over("17: veľký náhľad nášivky na dverách (na farbe tapacíru)", !!q('[data-krok="tapacir"] .kn-nh__cv') && /Kam príde: do stredu výplne dverí/.test(tx('[data-krok="tapacir"] .kn-nh__pop')));
  over("17: všetky ovládače kroku 6 sú type=button bez name", qa('[data-krok="tapacir"] button').every((x) => x.getAttribute("type") === "button") && !qa('[data-krok="tapacir"] [name]').length);
  over("17: žiadny console.error", t.s.chyby.length === 0, t.s.chyby.join(" | "));
}

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
