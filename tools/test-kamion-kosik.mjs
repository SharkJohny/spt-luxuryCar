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

/** „Pokračovať“ v karte podotázky kroku 5 / 6 (otázky po jednej, Michal 18. 10. 2026 večer): boky | stred | tapMat | dvere. */
const potvrd = (t, v) => t.klik(a("potvrd", v));
/** Krok 5 ako zákazník: kam -> motív a niť pod sedadlá -> Pokračovať -> stredový koberec rovnaká / iná. */
function nasivky(t, nas, motiv, nitKod, stredRovnaky = true) {
  t.klik(a("nas", nas));
  if (nas === "nechcem") return;
  const m = nas === "stred" ? "stred" : "boky";
  t.klik(a("motiv", motiv, m)); nit(t, nitKod, m);
  potvrd(t, m);
  if (nas === "boky+stred") t.klik(a("stredRovnaky", stredRovnaky ? "1" : "0"));
}

/** Automatický posun (Michal 18. 10. 2026: „…vyberám si na stred koberca, rovnaké alebo iné. Hotovo.“): po poslednej
 *  otázke kroku 5 / 6 sa krok sám zavrie a otvorí ďalší (dalsi = id kroku, null = súhrn) — bez „Pokračujte ďalej“. */
function sam(t, id, dalsi, meno = "") {
  const U = t.k.ui.U, k = t.d.querySelector('#lcd1v-kamion [data-krok="' + id + '"]');
  over((meno ? meno + ": " : "") + "krok " + id + " sa po poslednej otázke sám zavrel -> " + (dalsi || "súhrn"),
    U.otvoreny === dalsi && !!k && !k.classList.contains("is-open") && k.classList.contains("is-done") &&
    !t.d.querySelector('#lcd1v-kamion [data-a="dalej"][data-v="' + id + '"]'), "otvorený " + U.otvoreny);
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
  nasivky(t, "boky+stred", "H19", "2999");
  sam(t, "nasivky", "tapacir", "1");
  t.klik(a("tap", "ano")); t.klik(a("tapRovnake")); t.klik(a("tapNas", "nie"));
  sam(t, "tapacir", null, "1");
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
  nasivky(t, "stred", "H21", "3546");
  sam(t, "nasivky", null, "2"); // dodávka: krok 5 je posledný -> súhrn
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
  nasivky(t, "stred", "H21", "2840");
  sam(t, "nasivky", "tapacir", "4");
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "4", { spolu: 199 + 10 + 59, selecty: { 403: "Bez nášivky", 406: "Bez nite", 409: "Nášivka H21", 412: "2840 – Zelená", 397: "Bez nášivky", 400: "Bez nite", 355: "Nie nechcem nášivku na dverách" } });
}

console.log("5) Šofér + spolujazdec (nie BALÍK)");
{
  const t = await otvor();
  zaklad(t, DAF);
  nasivky(t, "boky", "H19", "2901");
  sam(t, "nasivky", "tapacir", "5");
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "5", { spolu: 199 + 10 + 59, selecty: { 349: "Šofér + spolujazdec", 403: "Nášivka H19", 406: "2901 – Strieborná", 409: "Bez nášivky", 412: "Bez nite" } });
}

console.log("6a) Tapacír áno, nášivka na dverách áno (rovnaká ako na kobercoch)");
{
  const t = await otvor();
  zaklad(t, DAF);
  nasivky(t, "boky+stred", "H19", "2999");
  sam(t, "nasivky", "tapacir", "6a");
  t.klik(a("tap", "ano")); t.klik(a("tapRovnake")); t.klik(a("tapNas", "ano")); t.klik(a("tapNasRovnaka", "1"));
  sam(t, "tapacir", null, "6a");
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
  nasivky(t, "boky+stred", "H19", "2999");
  sam(t, "nasivky", "tapacir", "6b");
  t.klik(a("tap", "ano")); t.klik(a("tapRovnake")); t.klik(a("tapNas", "nie"));
  await kontrolaKosika(t, "6b", { spolu: 423, selecty: { 355: "Nie nechcem nášivku na dverách", 397: "Bez nášivky", 400: "Bez nite" } });
}

console.log("7) Tapacír áno -> nášivka áno -> tapacír Nie (oprava Z1)");
{
  const t = await otvor();
  zaklad(t, DAF);
  nasivky(t, "boky+stred", "H19", "2999");
  sam(t, "nasivky", "tapacir", "7");
  t.klik(a("tap", "ano")); t.klik(a("tapRovnake")); t.klik(a("tapNas", "ano"));
  const pred = t.k.ui.cena().spolu;
  t.klik(a("zmenit", "ponuka")); // ponuka je zodpovedaná (riadok ✓) -> Zmeniť ju otvorí
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
  nasivky(t, "boky+stred", "H19", "2999");
  sam(t, "nasivky", "tapacir", "8");
  t.klik(a("tap", "ano"));
  t.klik(a("tapZmenit"));
  t.klik(a("tapMat", "Mikrosemiš – dvojfarebný"));
  t.klik(a("tapFarba", "3N"));
  t.klik(a("tapLem", "11"));
  potvrd(t, "tapMat");
  t.klik(a("tapNas", "ano"));
  t.klik(a("tapNasRovnaka", "0")); // dlaždica „Iná nášivka“ (návrh C; predtým zaškrtávacie políčko)
  t.klik(a("motiv", "H21", "dvere")); nit(t, "2840", "dvere");
  potvrd(t, "dvere");
  sam(t, "tapacir", null, "8");
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
  t.klik(a("tap", "ano")); t.klik(a("tapZmenit")); potvrd(t, "tapMat"); t.klik(a("tapNas", "ano"));
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

console.log("17) Kroky 5 a 6 — otázky po jednej (Michal 18. 10. 2026 večer): 4 výlučné voľby s cenovkou, podotázky v kartách, „✓ … — Zmeniť“");
{
  const t = await otvor();
  zaklad(t, DAF);
  const q = (sel) => t.d.querySelector("#lcd1v-kamion " + sel);
  const qa = (sel) => Array.from(t.d.querySelectorAll("#lcd1v-kamion " + sel));
  const tx = (sel) => (q(sel) ? q(sel).textContent.replace(/\s+/g, " ").trim() : "");
  const S = t.k.ui.S, U = t.k.ui.U;
  const K5 = '[data-krok="nasivky"] ', K6 = '[data-krok="tapacir"] ';
  const otvorene = (k) => qa(k + "[data-blok]").map((x) => x.getAttribute("data-blok"));
  const hot = (k) => qa(k + ".kn-hot:not(.kn-hot--vnutri)").map((x) => x.getAttribute("data-hot"));
  const zvolene5 = () => qa(K5 + '[data-a="nas"][aria-pressed="true"]').map((x) => x.getAttribute("data-v"));
  const cen = (el) => el ? [".k-cenovka__l", ".k-cenovka__c", ".k-cenovka__s", ".k-cenovka__u"].map((c) => (el.querySelector(c) ? el.querySelector(c).textContent.replace(/\s+/g, " ").trim() : "")) : [];
  const dalej5 = () => !!q('[data-a="dalej"][data-v="nasivky"]'), dalej6 = () => !!q('[data-a="dalej"][data-v="tapacir"]');

  // 5.1 — kam: veľká otázka, 4 výlučné voľby v poradí 1, 2, 3, 4, cenovka ako rohož a box do kufra
  over("17: krok 5 otvorený len s otázkou „Prosím, vyberte si, kam chcete nášivky“", J(otvorene(K5)) === J(["kam"]) && tx(K5 + '[data-pole="nas"] .kn-ot') === "Prosím, vyberte si, kam chcete nášivky", J(otvorene(K5)) + " | " + tx(K5 + ".kn-ot"));
  over("17: voľby v poradí pod sedadlá — stredový koberec — všetky tri — Nie, ďakujem", J(qa(K5 + '[data-a="nas"]').map((x) => x.getAttribute("data-v"))) === J(["boky", "stred", "boky+stred", "nechcem"]));
  const dl = qa(".kn-dv > .kn-dv__b");
  over("17: názvy dlaždíc podľa Michala", J(dl.map((x) => x.querySelector(".kn-dv__nm").textContent)) === J(["Nášivky pod sedadlá šoféra a spolujazdca", "Nášivka na stredový koberec", "Nášivky pod sedadlá šoféra a spolujazdca + na stredový koberec"]), J(dl.map((x) => x.querySelector(".kn-dv__nm").textContent)));
  over("17: každá dlaždica má fotku kabíny z assets/img/1v a „Ilustračná fotka“", dl.length === 3 && dl.every((x) => /\/assets\/img\/1v\/kamion-nasivky-kabina\.jpg$/.test(x.querySelector(".kn-scena > img").getAttribute("src")) && /Ilustračná fotka/.test(x.textContent)));
  over("17: zlaté krúžky na miestach nášiviek (2 / 1 / 3)", J(dl.map((x) => x.querySelectorAll(".kn-bod").length)) === J([2, 1, 3]));
  over("17: zlatý pás „★ Najobľúbenejšie ★“ len na všetkých troch", dl[2].querySelector(".kn-dv__top") && dl[2].querySelector(".kn-dv__top").textContent === "★ Najobľúbenejšie ★" && !dl[0].querySelector(".kn-dv__top") && !dl[1].querySelector(".kn-dv__top"));
  over("17: cenovka pod sedadlá = S kobercami / + 59 € / Samostatne 70 € / Ušetríte 11 €", J(cen(dl[0].querySelector(".k-cenovka"))) === J(["S kobercami", "+ 59 €", "Samostatne 70 €", "Ušetríte 11 €"]), J(cen(dl[0].querySelector(".k-cenovka"))));
  over("17: cenovka stredový koberec = S kobercami / + 59 € / Samostatne 70 € / Ušetríte 11 €", J(cen(dl[1].querySelector(".k-cenovka"))) === J(["S kobercami", "+ 59 €", "Samostatne 70 €", "Ušetríte 11 €"]), J(cen(dl[1].querySelector(".k-cenovka"))));
  over("17: cenovka všetky tri = S kobercami / + 95 € / Samostatne 140 € / Ušetríte 45 €", J(cen(dl[2].querySelector(".k-cenovka"))) === J(["S kobercami", "+ 95 €", "Samostatne 140 €", "Ušetríte 45 €"]), J(cen(dl[2].querySelector(".k-cenovka"))));
  over("17: prečiarknutá cena v <s> (červená čiara ako rohož a box)", dl.every((x) => x.querySelector(".k-cenovka__s > s")));
  const nie = q(a("nas", "nechcem"));
  over("17: „Nie, ďakujem“ = zlaté tlačidlo pod dlaždicami", !!nie && nie.classList.contains("k-btn-zlate") && /koberce bez nášiviek/.test(nie.textContent));
  over("17: v dlaždiciach žiadne zelené tlačidlo, žiadne zaškrtávacie políčko, bez „Vaša voľba“", !q(".kn-dv .k-btn-zelene") && !q(".kn-dv__cta") && !q(".kn-chk") && !q(".kn-vv") && qa(".kn-dv .kn-rad").length === 3);
  over("17: kým je otázka otvorená, „Pokračujte ďalej“ nie je", !dalej5());
  over("17: prístupnosť — fotka v dlaždici je pre čítačku skrytá (meno = názov + cena)", dl.every((x) => x.querySelector(".kn-foto").getAttribute("aria-hidden") === "true"));

  // výber všetkých troch -> 5.1 sa zatvorí do riadka, otvorí sa LEN karta „pod sedadlá“
  t.klik(a("nas", "boky+stred"));
  over("17: ★ všetky tri -> boky+stred, 5.1 zatvorená do „✓ … · + 95 €“", S.nas === "boky+stred" && J(hot(K5)) === J(["kam"]) && /Nášivky pod sedadlá šoféra a spolujazdca \+ na stredový koberec · \+ 95 €/.test(tx(K5 + '.kn-hot[data-hot="kam"]')) && /Zmeniť/.test(tx(K5 + '.kn-hot[data-hot="kam"]')), tx(K5 + ".kn-hot"));
  over("17: otvorená LEN karta „Nášivky pod sedadlá šoféra a spolujazdca“ (motív, niť) — stredový koberec ešte nie", J(otvorene(K5)) === J(["boky"]) && tx(K5 + ".kn-karta__ey") === "Nášivky pod sedadlá šoféra a spolujazdca" && J(qa(K5 + ".kn-ot").map((x) => x.textContent)) === J(["Prosím, vyberte si motív", "Prosím, vyberte si farbu nite"]) && !dalej5(), J(otvorene(K5)));
  t.klik(a("zmenit", "kam"));
  over("17: Zmeniť -> otázka kam znova, zvolená je LEN jedna voľba (všetky tri)", J(otvorene(K5)) === J(["kam"]) && J(zvolene5()) === J(["boky+stred"]) && qa(K5 + ".kn-dv__b.is-on").length === 1 && q(K5 + ".kn-dv__b.is-on").getAttribute("data-v") === "boky+stred", J(zvolene5()));
  t.klik(a("nas", "boky+stred"));
  over("17: ťuk na zvolenú voľbu S nemení, otázka sa zatvorí", S.nas === "boky+stred" && J(otvorene(K5)) === J(["boky"]) && t.s.chyby.length === 0, J(otvorene(K5)));
  over("17: farby nite — prvých 6 + „Ďalšie farby (+5)“", qa('[data-a="nit"][data-m="boky"]').length === 6 && /Ďalšie farby \(\+5\)/.test(tx('[data-a="viac"][data-m="boky"]')));
  t.klik(a("motiv", "H21", "boky"));
  potvrd(t, "boky");
  over("17: Pokračovať bez nite -> karta ostane, červený rám pri farbe nite", U.n5.boky === false && J(otvorene(K5)) === J(["boky"]) && !!q(K5 + '[data-pole="bokyNit"].is-chyba'), J(U.n5));
  nit(t, "2824", "boky");
  over("17: po výbere nite červený rám zmizne", !q(K5 + ".is-chyba"));
  const cv = q(".kn-nh__cv");
  over("17: veľký náhľad — plátno 3:2 s rozlíšením ≥ 960 px, niť červená na farbe kobercov", !!cv && +cv.getAttribute("width") >= 960 && +cv.getAttribute("width") * 2 === +cv.getAttribute("height") * 3 && cv.getAttribute("data-hex") === "#c82030" && /te69da20|t8131265/.test(cv.getAttribute("data-bg")) && /Náhľad: Trucker \(H21\) · niť červená \(2824\)/.test(tx(".kn-nh__hd")), cv && cv.outerHTML.slice(0, 200));
  over("17: pod náhľadom „Kam príde“ so schémou kabíny", /Kam príde: na koberec šoféra aj spolujazdca/.test(tx(".kn-nh__pop")) && !!q(".kn-nh__pop svg.kn-schema"));
  potvrd(t, "boky");
  over("17: Pokračovať -> „✓ Pod sedadlá šoféra a spolujazdca: Trucker (H21) · niť červená (2824) — Zmeniť“", U.n5.boky === true && J(hot(K5)) === J(["kam", "boky"]) && tx(K5 + '.kn-hot[data-hot="boky"] .kn-hot__tx') === "Pod sedadlá šoféra a spolujazdca: Trucker (H21) · niť červená (2824)", tx(K5 + '.kn-hot[data-hot="boky"]'));
  const rv = qa('.kn-rv__b[data-a="stredRovnaky"]');
  over("17: potom LEN karta „Stredový koberec“ s otázkou a dvomi voľbami, nič nepredvolené", J(otvorene(K5)) === J(["stred"]) && tx(K5 + ".kn-ot") === "Prosím, vyberte si nášivku na stredový koberec" && rv.length === 2 && /Rovnaká ako pod sedadlami šoféra a spolujazdca/.test(rv[0].textContent) && /Trucker \(H21\)/.test(rv[0].textContent) && /Iná nášivka/.test(rv[1].textContent) && rv.every((x) => x.getAttribute("aria-pressed") === "false"));
  over("17: bez odpovede na stredový koberec krok 5 nie je hotový", !t.k.ui.hotovo() && !dalej5() && !q('[data-krok="nasivky"].is-done'));
  t.klik(a("stredRovnaky", "0"));
  over("17: „Iná nášivka“ -> riadok voľby + motív a niť pre stred + Pokračovať", S.stredRovnaky === false && !!q(K5 + '.kn-hot--vnutri[data-hot="stred"]') && !!q('[data-pole="stredMotiv"]') && !!q('[data-pole="stredNit"]') && !!q(a("potvrd", "stred")) && !q('.kn-rv__b[data-a="stredRovnaky"]'));
  t.klik(a("motiv", "H19", "stred")); nit(t, "2999", "stred");
  potvrd(t, "stred");
  over("17: Pokračovať v poslednej karte -> krok 5 sa sám zavrie, otvorí sa krok 6 (bez „Pokračujte ďalej“)", U.otvoreny === "tapacir" && !q('[data-krok="nasivky"].is-open') && !!q('[data-krok="nasivky"].is-done') && !dalej5(), U.otvoreny);
  t.klik(a("krok", "nasivky"));
  over("17: znova otvorený hotový krok 5 -> 3 riadky ✓, žiadna otvorená karta, „Pokračujte ďalej“ ako záloha", J(hot(K5)) === J(["kam", "boky", "stred"]) && J(otvorene(K5)) === "[]" && dalej5() && tx(K5 + '.kn-hot[data-hot="stred"] .kn-hot__tx') === "Stredový koberec: Kamión (H19) · niť čierna (2999)", tx(K5 + '.kn-hot[data-hot="stred"]'));
  over("17: iný stred v selectoch 409 / 412 (H19 / 2999), pod sedadlami 403 / 406 (H21 / 2824)", zvolene(t.d, 409) === "Nášivka H19" && zvolene(t.d, 412) === "2999 – Čierna" && zvolene(t.d, 403) === "Nášivka H21" && zvolene(t.d, 406) === "2824 – Červená");
  t.klik(a("zmenit", "stred"));
  over("17: Zmeniť stred -> otázka znova, zvolená „Iná nášivka“", J(otvorene(K5)) === J(["stred"]) && q(a("stredRovnaky", "0")).getAttribute("aria-pressed") === "true" && q(a("stredRovnaky", "1")).getAttribute("aria-pressed") === "false");
  t.klik(a("stredRovnaky", "1"));
  over("17: Zmeniť stred -> „Rovnaká“ = hotovo, krok 5 sa sám zavrie a otvorí sa krok 6", U.otvoreny === "tapacir" && !dalej5(), U.otvoreny);
  t.klik(a("krok", "nasivky"));
  over("17: „Rovnaká“ = hotovo, karta sa zatvorí, stred v selectoch = pod sedadlami", J(otvorene(K5)) === "[]" && /Stredový koberec: rovnaká nášivka ako pod sedadlami – Trucker \(H21\) · niť červená \(2824\)/.test(tx(K5 + '.kn-hot[data-hot="stred"]')) && zvolene(t.d, 409) === "Nášivka H21" && zvolene(t.d, 412) === "2824 – Červená", tx(K5 + '.kn-hot[data-hot="stred"]'));
  // revízia 18. 10. 2026 večer: znova otvorená otázka na hotovom kroku má pod sebou „Pokračujte ďalej“; zatvorenie a
  // otvorenie hlavičky ju zavrie (riadky ✓ + „Pokračujte ďalej“)
  t.klik(a("zmenit", "kam"));
  over("17: Zmeniť kam na hotovom kroku -> otázka kam a pod ňou „Pokračujte ďalej“", J(otvorene(K5)) === J(["kam"]) && dalej5(), J(otvorene(K5)));
  t.klik(a("krok", "nasivky")); t.klik(a("krok", "nasivky"));
  over("17: hlavička zavrieť / otvoriť -> riadky ✓ (kam, pod sedadlá, stred) a „Pokračujte ďalej“, otázka zavretá", J(hot(K5)) === J(["kam", "boky", "stred"]) && J(otvorene(K5)) === "[]" && dalej5() && U.znova.nasivky === null && U.otvoreny === "nasivky", J([hot(K5), otvorene(K5), U.znova]));
  // zmena voľby 5.1: motív a niť sa prenesú, zvolená je stále len jedna
  t.klik(a("zmenit", "kam")); t.klik(a("nas", "boky"));
  over("17: všetky tri -> pod sedadlá: potvrdené ostane, hotovo bez ďalšej otázky -> krok 5 sa sám zavrie", S.nas === "boky" && U.otvoreny === "tapacir" && !dalej5(), U.otvoreny);
  t.klik(a("krok", "nasivky"));
  over("17: znova otvorený krok 5 -> riadky ✓ kam a pod sedadlá", J(hot(K5)) === J(["kam", "boky"]) && J(otvorene(K5)) === "[]" && dalej5());
  t.klik(a("zmenit", "kam"));
  over("17: zvolená len „pod sedadlá“", J(zvolene5()) === J(["boky"]) && qa(K5 + ".kn-dv__b.is-on").length === 1);
  t.klik(a("nas", "stred"));
  over("17: pod sedadlá -> stredový koberec: karta stredu s motívom a niťou spod sedadiel (H21 / 2824, nie starý vlastný stred H19 / 2999) na potvrdenie", S.nas === "stred" && S.nasStred.motiv === "H21" && S.nasStred.nit === "2824" && J(otvorene(K5)) === J(["stred"]) && tx(K5 + ".kn-karta__ey") === "Nášivka na stredový koberec" && !!q(a("potvrd", "stred")), J(otvorene(K5)) + " " + J(S.nasStred));
  potvrd(t, "stred");
  over("17: stredový koberec potvrdený -> krok 5 sa sám zavrie", U.otvoreny === "tapacir", U.otvoreny);
  t.klik(a("krok", "nasivky"));
  t.klik(a("zmenit", "kam")); t.klik(a("nas", "boky+stred"));
  over("17: stred -> všetky tri: motív a niť prevzaté zo stredu, karta pod sedadlami na potvrdenie", S.nas === "boky+stred" && S.nasBoky.motiv === S.nasStred.motiv && S.nasBoky.nit === S.nasStred.nit && J(otvorene(K5)) === J(["boky"]), J(S.nasBoky) + " " + J(S.nasStred));
  potvrd(t, "boky");
  t.klik(a("stredRovnaky", "1"));
  over("17: „Rovnaká ako pod sedadlami“ -> krok 5 sa sám zavrie (S a košík ako pri „Pokračujte ďalej“)", U.otvoreny === "tapacir" && S.stredRovnaky === true && SH.sucetShoptetu(t.d) === t.k.ui.cena().spolu, U.otvoreny);
  t.klik(a("krok", "nasivky"));
  over("17: všetky ovládače kroku 5 sú type=button bez name", qa('[data-krok="nasivky"] button').every((x) => x.getAttribute("type") === "button") && !qa('[data-krok="nasivky"] [name]').length);
  t.dalej("nasivky");

  // krok 6 — ponuka, materiál, nášivka na dvere, motív a niť: vždy len jedna otvorená
  const dvere = q(K6 + ".kn-dvere:not(.kn-dvere--vyrez) > img");
  over("17: krok 6 — celá fotka dverí (JPEG v assets/img/1v, 1536 × 1024 = 3:2)", !!dvere && /\/assets\/img\/1v\/kamion-dvere-tapacir\.jpg$/.test(dvere.getAttribute("src")) && dvere.getAttribute("width") === "1536" && dvere.getAttribute("height") === "1024");
  over("17: ponuka tapacíru — cenovka S kobercami / 119 € / Samostatne 179 € / Ušetríte 60 €", J(cen(q(K6 + ".kn-ponuka .k-cenovka"))) === J(["S kobercami", "119 €", "Samostatne 179 €", "Ušetríte 60 €"]), J(cen(q(K6 + ".kn-ponuka .k-cenovka"))));
  over("17: najprv LEN ponuka (Áno zelené, Nie zlaté), bez materiálu a nášivky na dvere", J(otvorene(K6)) === J(["ponuka"]) && q(a("tap", "ano")).classList.contains("k-btn-zelene") && q(a("tap", "nie")).classList.contains("k-btn-zlate") && !q(a("tapNas", "ano")) && !dalej6());
  t.klik(a("tap", "ano"));
  over("17: Áno -> „✓ Tapacír dverí: áno · 119 €“, karta materiálu s otázkou a dvomi voľbami (nič nepredvolené)", J(hot(K6)) === J(["ponuka"]) && /Tapacír dverí: áno · 119 €/.test(tx(K6 + '.kn-hot[data-hot="ponuka"]')) && J(otvorene(K6)) === J(["mat"]) && tx(K6 + ".kn-ot") === "Prosím, vyberte si materiál, farbu a lemovanie tapacíru" && qa(K6 + ".kn-rv__b").every((x) => x.getAttribute("aria-pressed") === "false") && /prešívaná/.test(tx(K6 + '[data-a="tapRovnake"]')) && !q(a("tapNas", "ano")));
  t.klik(a("tapZmenit"));
  over("17: „Vybrať inak“ -> materiál, farba a lemovanie vopred ako koberce + Pokračovať", S.tapRovnaky === false && S.tapMat === PRES && S.tapFarba === "12" && S.tapLem === "04" && !!q('[data-pole="tapMat"]') && !!q(".kn-vz") && !!q(a("potvrd", "tapMat")) && !q(a("tapNas", "ano")));
  over("17: vnorený riadok voľby = podstatné meno „✓ Iný materiál, farba alebo lemovanie“ (nie „Vybrať inak“)", tx(K6 + '.kn-hot--vnutri[data-hot="mat"] .kn-hot__tx') === "Iný materiál, farba alebo lemovanie", tx(K6 + '.kn-hot--vnutri[data-hot="mat"]'));
  over("17: lemovanie uprostred vety malým písmom (lemovanie čierna + červená (04))", /lemovanie čierna \+ červená \(04\)/.test(tx(".kn-vz")), tx(".kn-vz"));
  t.klik(a("tapMat", "Mikrosemiš – dvojfarebný"));
  over("17: dvojfarebný mikrosemiš -> farba kobercov 12 sa zruší", S.tapMat === "Mikrosemiš – dvojfarebný" && S.tapFarba === null, J([S.tapMat, S.tapFarba]));
  potvrd(t, "tapMat");
  over("17: Pokračovať bez farby -> karta ostane, červený rám pri farbe", U.n6.mat === false && !!q(K6 + '[data-pole="tapFarba"].is-chyba') && t.s.chyby.length === 0);
  t.klik(a("zmenit", "mat"));
  over("17: Zmeniť -> otázka „rovnaké / inak“, zvolené „Vybrať inak“", J(otvorene(K6)) === J(["mat"]) && q(a("tapZmenit")).getAttribute("aria-pressed") === "true" && q(a("tapRovnake")).getAttribute("aria-pressed") === "false");
  t.klik(a("tapZmenit"));
  over("17: opätovné „Vybrať inak“ S nemení (revízia: bez pádu zhrnutia) — farba stále chýba", S.tapRovnaky === false && S.tapFarba === null && !!q('[data-pole="tapFarba"]') && t.s.chyby.length === 0, J([S.tapFarba]) + " | " + t.s.chyby.join(" | "));
  t.klik(a("zmenit", "mat")); t.klik(a("tapRovnake"));
  over("17: „Rovnaké ako koberce“ = hotovo, riadok ✓, potom LEN karta nášivky na dvere", S.tapRovnaky === true && J(hot(K6)) === J(["ponuka", "mat"]) && /Materiál, farba a lemovanie: rovnaké ako koberce/.test(tx(K6 + '.kn-hot[data-hot="mat"]')) && J(otvorene(K6)) === J(["nas"]));
  over("17: nášivka na dvere — výrez dverí so zlatým krúžkom „Sem príde nášivka“", /Sem príde nášivka/.test(tx(".kn-dvere--vyrez .kn-bod")) && /do stredu výplne dverí/.test(tx(K6 + ".k-krok__telo")));
  over("17: nášivka na dvere — cenovka S tapacírom / + 49 € / Samostatne 89 € / Ušetríte 40 €", J(cen(q(".kn-ponuka--nas .k-cenovka"))) === J(["S tapacírom", "+ 49 €", "Samostatne 89 €", "Ušetríte 40 €"]), J(cen(q(".kn-ponuka--nas .k-cenovka"))));
  t.klik(a("tapNas", "ano"));
  const tn = qa('.kn-rv__b[data-a="tapNasRovnaka"]');
  over("17: Áno -> „✓ Nášivka na tapacír dverí: áno · + 49 €“, otázka „Rovnaká ako na kobercoch / Iná nášivka“", /Nášivka na tapacír dverí: áno · \+ 49 €/.test(tx(K6 + '.kn-hot[data-hot="nas"]')) && J(otvorene(K6)) === J(["dvere"]) && tx(K6 + ".kn-ot") === "Prosím, vyberte si nášivku na tapacír dverí" && tn.length === 2 && /Trucker \(H21\) · niť červená \(2824\)/.test(tn[0].textContent) && /Iná nášivka/.test(tn[1].textContent) && tn.every((x) => x.getAttribute("aria-pressed") === "false") && !dalej6());
  over("17: karta motívu má vlastný nadpis „Motív nášivky na tapacír dverí“ (nie ten istý ako riadok ✓ nad ňou)", tx(K6 + '[data-blok="dvere"] .kn-karta__ey') === "Motív nášivky na tapacír dverí", tx(K6 + ".kn-karta__ey"));
  t.klik(a("tapNasRovnaka", "0"));
  over("17: „Iná nášivka“ -> motív, niť, veľký náhľad na farbe tapacíru, Pokračovať", !!q('[data-pole="dvereMotiv"]') && !!q('[data-pole="dvereNit"]') && !!q(a("potvrd", "dvere")) && !q(K6 + ".kn-nh__cv"));
  t.klik(a("motiv", "H19", "dvere")); nit(t, "2840", "dvere");
  over("17: veľký náhľad nášivky na dverách", !!q(K6 + ".kn-nh__cv") && /Kam príde: do stredu výplne dverí/.test(tx(K6 + ".kn-nh__pop")));
  potvrd(t, "dvere");
  over("17: posledné potvrdenie kroku 6 -> krok sa sám zavrie, ďalej súhrn (U.otvoreny null, bez „Pokračujte k súhrnu“)", U.otvoreny === null && !!q('[data-krok="tapacir"].is-done') && !dalej6() && t.k.ui.hotovo(), U.otvoreny);
  t.klik(a("krok", "tapacir"));
  over("17: znova otvorený hotový krok 6 -> 4 riadky ✓ a „Pokračujte k súhrnu“ ako záloha", J(hot(K6)) === J(["ponuka", "mat", "nas", "dvere"]) && J(otvorene(K6)) === "[]" && dalej6() && /Pokračujte k súhrnu/.test(tx(a("dalej", "tapacir"))) && /Motív nášivky na tapacír dverí: Kamión \(H19\) · niť zelená \(2840\)/.test(tx(K6 + '.kn-hot[data-hot="dvere"]')) && t.k.ui.hotovo(), tx(K6 + '.kn-hot[data-hot="dvere"]'));
  t.klik(a("zmenit", "dvere"));
  over("17: Zmeniť pri hotovom kroku 6 -> otázka „Rovnaká / Iná“ a pod ňou „Pokračujte k súhrnu“", J(otvorene(K6)) === J(["dvere"]) && dalej6());
  t.klik(a("tapNasRovnaka", "1"));
  over("17: Zmeniť -> „Rovnaká ako na kobercoch“ -> krok 6 sa sám zavrie", U.otvoreny === null && !dalej6(), U.otvoreny);
  t.klik(a("krok", "tapacir"));
  over("17: Zmeniť -> „Rovnaká ako na kobercoch“ = hotovo, v selectoch 397 / 400 „Rovnaká ako koberec“", J(otvorene(K6)) === "[]" && /Motív nášivky na tapacír dverí: rovnaký ako na kobercoch – Trucker \(H21\) · niť červená \(2824\)/.test(tx(K6 + '.kn-hot[data-hot="dvere"]')) && zvolene(t.d, 397) === "Rovnaká ako koberec" && zvolene(t.d, 400) === "Rovnaká ako koberec", tx(K6 + '.kn-hot[data-hot="dvere"]'));
  over("17: všetky ovládače kroku 6 sú type=button bez name", qa('[data-krok="tapacir"] button').every((x) => x.getAttribute("type") === "button") && !qa('[data-krok="tapacir"] [name]').length);
  // koberce bez nášiviek -> nášivka na dvere „ako na kobercoch“ stratila vzor -> otázka na dvere znova s vysvetlením
  t.klik(a("krok", "nasivky")); t.klik(a("zmenit", "kam")); t.klik(a("nas", "nechcem"));
  over("17: Nie, ďakujem -> krok 5 „Bez nášiviek“, krok 6 znova pýta nášivku na dvere s vysvetlením (Áno ani Nie nepredvolené)", S.nas === "nechcem" && t.k.ui.U.otvoreny === "tapacir" && J(otvorene(K6)) === J(["nas"]) && /Na kobercoch už nášivka nie je/.test(tx(K6 + ".tp-info")) && !q(K6 + ".an__b.is-on") && !t.k.ui.hotovo(), J([S.tapNas, t.k.ui.U.otvoreny, otvorene(K6)]));
  over("17: cena Shoptetu = konfigurátor aj počas otázky (S.tapNas ostane, kým zákazník neodpovie)", SH.sucetShoptetu(t.d) === t.k.ui.cena().spolu, SH.sucetShoptetu(t.d) + " vs " + t.k.ui.cena().spolu);
  // revízia 18. 10. 2026 večer: Zmeniť ponuku a znova „Áno“ otázku na dvere s vysvetlením neobíde
  t.klik(a("zmenit", "ponuka")); t.klik(a("tap", "ano"));
  over("17: Zmeniť ponuku + znova Áno -> stále otázka na nášivku na dvere s vysvetlením, bez predvoľby", S.tap === "ano" && J(otvorene(K6)) === J(["nas"]) && /Na kobercoch už nášivka nie je/.test(tx(K6 + ".tp-info")) && !q(K6 + ".an__b.is-on") && !t.k.ui.hotovo() && !dalej6() && SH.sucetShoptetu(t.d) === t.k.ui.cena().spolu, J([otvorene(K6), S.tapNas]));
  t.klik(a("tapNas", "ano"));
  over("17: Áno -> motív a niť na dvere (na kobercoch nášivka nie je)", J(otvorene(K6)) === J(["dvere"]) && !!q('[data-pole="dvereMotiv"]') && /nášivku nemáte/.test(tx(K6 + ".kn-info")) && !q(K6 + ".tp-info"));
  t.klik(a("zmenit", "nas")); t.klik(a("tapNas", "nie"));
  over("17: Nie -> krok 6 hotový bez nášivky na dverách (355 „Nie nechcem“)", t.k.ui.hotovo() && zvolene(t.d, 355) === "Nie nechcem nášivku na dverách" && SH.sucetShoptetu(t.d) === t.k.ui.cena().spolu);
  over("17: žiadny console.error", t.s.chyby.length === 0, t.s.chyby.join(" | "));
}

console.log("18) Otázky po jednej: lišta „Pokračovať“ potvrdí kartu, košík bez potvrdenia otvorí kartu s červeným rámom");
{
  const t = await otvor();
  zaklad(t, DAF);
  const q = (sel) => t.d.querySelector("#lcd1v-kamion " + sel);
  const lista = () => t.d.querySelector('#lcd1v-lista [data-a="lista"]').dispatchEvent(new t.s.window.MouseEvent("click", { bubbles: true, cancelable: true }));
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); nit(t, "2999", "boky");
  // revízia 18. 10. 2026 večer: otázka kam znova otvorená cez Zmeniť zakrýva nepotvrdenú kartu -> lišta ju zavrie a ukáže kartu
  t.klik(a("zmenit", "kam"));
  const blok18 = () => Array.from(t.d.querySelectorAll('#lcd1v-kamion [data-krok="nasivky"] [data-blok]')).map((x) => x.getAttribute("data-blok"));
  over("18: Zmeniť kam -> otvorená len otázka kam (karta pod sedadlami zakrytá)", JSON.stringify(blok18()) === JSON.stringify(["kam"]));
  lista();
  over("18: lišta pri znova otvorenej otázke -> otázka sa zavrie, otvorí sa nepotvrdená karta pod sedadlami (nič sa nepotvrdí)", t.k.ui.U.znova.nasivky === null && JSON.stringify(blok18()) === JSON.stringify(["boky"]) && t.k.ui.U.n5.boky === false, JSON.stringify([blok18(), t.k.ui.U.znova]));
  t.klik(a("kosik")); await pauza(200);
  over("18: bez Pokračovať a odpovede na stred -> 0 klikov, krok 5 červený pri Pokračovať", t.s.kliky.length === 0 && t.k.ui.U.otvoreny === "nasivky" && !!q('[data-krok="nasivky"].is-error [data-pole="bokyDalej"].is-chyba'), t.k.ui.U.otvoreny);
  lista();
  over("18: lišta „Pokračovať“ = Pokračovať v karte (pod sedadlami potvrdené, otvorená otázka na stred)", t.k.ui.U.n5.boky === true && !!q('[data-blok="stred"]') && t.k.ui.U.otvoreny === "nasivky");
  lista();
  over("18: lišta pri otázke bez Pokračovať (rovnaká / iná) nič nevyberie", t.k.ui.U.n5.stredOdp === false && t.k.ui.U.otvoreny === "nasivky");
  t.klik(a("stredRovnaky", "1"));
  over("18: „Rovnaká ako pod sedadlami“ -> krok 5 sa sám zavrie a otvorí krok 6", t.k.ui.U.otvoreny === "tapacir", t.k.ui.U.otvoreny);
  lista();
  over("18: lišta pri ponuke tapacíru (bez odpovede) krok 6 nechá otvorený", t.k.ui.U.otvoreny === "tapacir");
  t.klik(a("tap", "ano")); t.klik(a("tapRovnake")); t.klik(a("tapNas", "ano")); t.klik(a("tapNasRovnaka", "0"));
  t.klik(a("motiv", "H21", "dvere")); nit(t, "2824", "dvere");
  lista();
  over("18: lišta „Pokračovať“ v poslednej karte kroku 6 -> krok sa sám zavrie (súhrn)", t.k.ui.U.otvoreny === null && t.k.ui.U.n6.nas === true && t.k.ui.hotovo(), t.k.ui.U.otvoreny);
  over("18: žiadny console.error", t.s.chyby.length === 0, t.s.chyby.join(" | "));
}

console.log("19) Zmena voľby 5.1 všetky tri (iný stred) -> pod sedadlá -> stredový koberec: stred prevezme motív a niť spod sedadiel");
{
  const t = await otvor();
  zaklad(t, DAF);
  const S = t.k.ui.S;
  t.klik(a("nas", "boky+stred"));
  t.klik(a("motiv", "H19", "boky")); nit(t, "2999", "boky"); potvrd(t, "boky");
  t.klik(a("stredRovnaky", "0"));
  t.klik(a("motiv", "H21", "stred")); nit(t, "3546", "stred"); potvrd(t, "stred");
  sam(t, "nasivky", "tapacir", "19");
  t.klik(a("krok", "nasivky"));
  t.klik(a("zmenit", "kam")); t.klik(a("nas", "boky"));
  over("19: všetky tri -> pod sedadlá: pod sedadlami H19 / 2999", S.nas === "boky" && S.nasBoky.motiv === "H19" && S.nasBoky.nit === "2999");
  t.klik(a("krok", "nasivky"));
  t.klik(a("zmenit", "kam")); t.klik(a("nas", "stred"));
  const on = (akcia, m) => { const e = t.d.querySelector('#lcd1v-kamion [data-a="' + akcia + '"][data-m="' + m + '"][aria-pressed="true"]'); return e && e.getAttribute("data-v"); };
  over("19: pod sedadlá -> stredový koberec: karta stredu má H19 / 2999 (práve videné), nie starý H21 / 3546", S.nas === "stred" && S.nasStred.motiv === "H19" && S.nasStred.nit === "2999" && on("motiv", "stred") === "H19" && on("nit", "stred") === "2999" && !t.k.ui.hotovo(), JSON.stringify(S.nasStred));
  potvrd(t, "stred");
  sam(t, "nasivky", "tapacir", "19");
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "19", { selecty: { 349: "Len stred", 409: "Nášivka H19", 412: "2999 – Čierna" } });
}

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
