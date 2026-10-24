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
const DT = await nacitajModul("assets/js/components/konfigurator1v/kamion/data.js");
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
/** Farba nite ako zákazník: klik na farbu v palete (všetkých 11 farieb, 3B 22. 10. 2026 — bez „Ďalšie farby“). */
function nit(t, kod, m) {
  t.klik(a("nit", kod, m));
}

/** „Pokračovať“ v karte podotázky kroku 5 / 6 (otázky po jednej, Michal 18. 10. 2026 večer): boky | stred | tapMat | dvere. */
const potvrd = (t, v) => t.klik(a("potvrd", v));
/** Krok 5 ako zákazník: kam -> motív a niť pod sedadlá -> Pokračovať -> stred rovnaká / iná. */
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
const P423 = "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: DAF (TIR) XF106 2017-2021\n- Typ prevodovky: Automatická prevodovka\n\nKOBERČEKY POD SEDAČKY\n- Typ a farba materiálu: Prémiová syntetická koža – prešívaná – 11\n- Farba lemovania: Čierna + Červená\n- Rozloženie nášiviek: Šofér + spolujazdec + stred\n- Typ nášivky na stred: H19\n- Farba nášivky na stred: 2999 – Čierna\n- Typ nášiviek na boky: H19\n- Farba nášiviek na boky: 2999 – Čierna\n\nTAPACÍR DVERÍ\n- Typ a farba materiálu: Rovnaký ako koberčeky – Prémiová syntetická koža – prešívaná – 11\n- Farba lemovania: Rovnaká ako farba lemovania koberčekov – Čierna + Červená\n- Nášivky na tapacír: Nechcem";
const DAF = { znacka: "DAF (TIR)", model: "XF106 2017-2021", material: PRES, farba: "11", lem: "04" }; // 11 = čierna (vzorkovník 24. 10. 2026)

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
  t.klik(a("farba", "11")); t.dalej("farba");
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
  t.klik(a("tapFarba", "2N"));
  t.klik(a("tapLem", "11"));
  potvrd(t, "tapMat");
  t.klik(a("tapNas", "ano"));
  t.klik(a("tapNasRovnaka", "0")); // dlaždica „Iná nášivka“ (návrh C; predtým zaškrtávacie políčko)
  t.klik(a("motiv", "H21", "dvere")); nit(t, "2840", "dvere");
  potvrd(t, "dvere");
  sam(t, "tapacir", null, "8");
  await kontrolaKosika(t, "8", {
    poznamkaObsahuje: ["TAPACÍR DVERÍ\n- Typ a farba materiálu: Mikrosemiš – dvojfarebný – 2N", "- Farba lemovania: Béžová + Hnedá", "- Typ nášivky na tapacír: H21", "- Farba nášiviek na tapacíre: 2840 – Zelená"],
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
  // ceny v riadkoch ako rohož a box do kufra (Michal 18. 10. 2026 v noci): [štítok, suma] po riadkoch Samostatne / Výhoda v sete / V sete
  const cen = (el) => el ? Array.from(el.querySelectorAll(".k-ucet__r")).map((r) => [".k-ucet__rn", ".k-ucet__rh"].map((c) => (r.querySelector(c) ? r.querySelector(c).textContent.replace(/\s+/g, " ").trim() : ""))) : [];
  const R = (samo, zl, sum) => [["Samostatne", samo], ["Výhoda v sete", zl], ["V sete", sum]];
  const dalej5 = () => !!q('[data-a="dalej"][data-v="nasivky"]'), dalej6 = () => !!q('[data-a="dalej"][data-v="tapacir"]');

  // 5.1 — kam: veľká otázka, 4 výlučné voľby v poradí 1, 2, 3, 4, ceny v riadkoch ako rohož a box do kufra
  over("17: krok 5 otvorený len s otázkou „Prosím, vyberte si, kam chcete nášivky“", J(otvorene(K5)) === J(["kam"]) && tx(K5 + '[data-pole="nas"] .kn-ot') === "Prosím, vyberte si, kam chcete nášivky", J(otvorene(K5)) + " | " + tx(K5 + ".kn-ot"));
  over("17: voľby v poradí pod sedadlá — do stredu — pod sedadlá + do stredu — Nie, ďakujem", J(qa(K5 + '[data-a="nas"]').map((x) => x.getAttribute("data-v"))) === J(["boky", "stred", "boky+stred", "nechcem"]));
  const dl = qa(".kn-dv > .kn-dv__b");
  over("17: názvy dlaždíc podľa Michala", J(dl.map((x) => x.querySelector(".kn-dv__nm").textContent)) === J(["Nášivky pod sedadlá šoféra a spolujazdca", "Nášivka do stredu", "Nášivky pod sedadlá šoféra a spolujazdca + do stredu"]), J(dl.map((x) => x.querySelector(".kn-dv__nm").textContent)));
  // 22. 10. 2026: texty hovoria len o umiestnení (koberec môže byť jeden kus, delený aj zošitý) — nikdy „tri koberce“
  over("17: popisy dlaždíc = počet nášiviek", J(dl.map((x) => x.querySelector(".kn-dv__po").textContent)) === J(["2 nášivky", "medzi sedadlami – 1 väčšia nášivka", "3 nášivky v jednom balíku"]), J(dl.map((x) => x.querySelector(".kn-dv__po").textContent)));
  over("17: štítky na fotke Šofér / Spolujazdec / Stred", J(dl.map((x) => Array.from(x.querySelectorAll(".kn-bod b")).map((b) => b.textContent))) === J([["Šofér", "Spolujazdec"], ["Stred"], ["Šofér", "Spolujazdec", "Stred"]]));
  over("17: v kroku 5 nikde „stredový koberec“ ani „tri koberce“", !/stredov|tri koberce/i.test(t.d.querySelector('#lcd1v-kamion [data-krok="nasivky"]').innerHTML));
  over("17: každá dlaždica má fotku kabíny z assets/img/1v a „Ilustračná fotka“", dl.length === 3 && dl.every((x) => /\/assets\/img\/1v\/kamion-nasivky-kabina\.jpg$/.test(x.querySelector(".kn-scena > img").getAttribute("src")) && /Ilustračná fotka/.test(x.textContent)));
  over("17: zlaté krúžky na miestach nášiviek (2 / 1 / 3)", J(dl.map((x) => x.querySelectorAll(".kn-bod").length)) === J([2, 1, 3]));
  over("17: zlatý pás „★ Najobľúbenejšie ★“ len na všetkých troch", dl[2].querySelector(".kn-dv__top") && dl[2].querySelector(".kn-dv__top").textContent === "★ Najobľúbenejšie ★" && !dl[0].querySelector(".kn-dv__top") && !dl[1].querySelector(".kn-dv__top"));
  over("17: pod sedadlá = Samostatne 70 € / Výhoda v sete − 11 € / V sete + 59 €", J(cen(dl[0].querySelector(".k-ucet"))) === J(R("70 €", "− 11 €", "+ 59 €")), J(cen(dl[0].querySelector(".k-ucet"))));
  over("17: do stredu = Samostatne 70 € / Výhoda v sete − 11 € / V sete + 59 €", J(cen(dl[1].querySelector(".k-ucet"))) === J(R("70 €", "− 11 €", "+ 59 €")), J(cen(dl[1].querySelector(".k-ucet"))));
  over("17: pod sedadlá + do stredu = Samostatne 140 € / Výhoda v sete − 45 € / V sete + 95 €", J(cen(dl[2].querySelector(".k-ucet"))) === J(R("140 €", "− 45 €", "+ 95 €")), J(cen(dl[2].querySelector(".k-ucet"))));
  over("17: bez veľkej ceny, prečiarknutej ceny a pilulky „Ušetríte“ (cenovka z návrhu E preč)", !q(".k-cenovka") && !qa(".kn-dv s").length && !/Ušetríte/.test(tx(".kn-dv")));
  const nie = q(a("nas", "nechcem"));
  over("17: „Nie, ďakujem“ = zlaté tlačidlo pod dlaždicami", !!nie && nie.classList.contains("k-btn-zlate") && /bez nášiviek, bez príplatku/.test(nie.textContent));
  over("17: v dlaždiciach žiadne zelené tlačidlo, žiadne zaškrtávacie políčko, bez „Vaša voľba“", !q(".kn-dv .k-btn-zelene") && !q(".kn-dv__cta") && !q(".kn-chk") && !q(".kn-vv") && qa(".kn-dv .kn-rad").length === 3);
  over("17: kým je otázka otvorená, „Pokračujte ďalej“ nie je", !dalej5());
  over("17: prístupnosť — fotka v dlaždici je pre čítačku skrytá (meno = názov + cena)", dl.every((x) => x.querySelector(".kn-foto").getAttribute("aria-hidden") === "true"));

  // výber všetkých troch -> 5.1 sa zatvorí do riadka, otvorí sa LEN karta „pod sedadlá“
  t.klik(a("nas", "boky+stred"));
  over("17: ★ všetky tri -> boky+stred, 5.1 zatvorená do „✓ … · + 95 €“", S.nas === "boky+stred" && J(hot(K5)) === J(["kam"]) && /Nášivky pod sedadlá šoféra a spolujazdca \+ do stredu · \+ 95 €/.test(tx(K5 + '.kn-hot[data-hot="kam"]')) && /Zmeniť/.test(tx(K5 + '.kn-hot[data-hot="kam"]')), tx(K5 + ".kn-hot"));
  over("17: otvorená LEN karta „Nášivky pod sedadlá šoféra a spolujazdca“ (motív, niť) — stred ešte nie", J(otvorene(K5)) === J(["boky"]) && tx(K5 + ".kn-karta__ey") === "Nášivky pod sedadlá šoféra a spolujazdca" && J(qa(K5 + ".kn-ot").map((x) => x.textContent)) === J(["Prosím, vyberte si motív", "Prosím, vyberte si farbu nite"]) && !dalej5(), J(otvorene(K5)));
  t.klik(a("zmenit", "kam"));
  over("17: Zmeniť -> otázka kam znova, zvolená je LEN jedna voľba (všetky tri)", J(otvorene(K5)) === J(["kam"]) && J(zvolene5()) === J(["boky+stred"]) && qa(K5 + ".kn-dv__b.is-on").length === 1 && q(K5 + ".kn-dv__b.is-on").getAttribute("data-v") === "boky+stred", J(zvolene5()));
  t.klik(a("nas", "boky+stred"));
  over("17: ťuk na zvolenú voľbu S nemení, otázka sa zatvorí", S.nas === "boky+stred" && J(otvorene(K5)) === J(["boky"]) && t.s.chyby.length === 0, J(otvorene(K5)));
  // 3B (22. 10. 2026): paleta všetkých 11 farieb v poradí Michala, krúžok + meno + kód, bez „Ďalšie farby“
  const NITE_PORADIE = ["2999", "2901", "3738", "3546", "3617", "3501", "3504", "2824", "2866", "3842", "2840"];
  const nt = qa('[data-a="nit"][data-m="boky"]');
  over("17: farby nite — všetkých 11 v poradí Čierna … Svetlohnedá, Horčicová, Tmavohnedá … Zelená, bez „Ďalšie farby“", J(nt.map((x) => x.getAttribute("data-v"))) === J(NITE_PORADIE) && !q('[data-a="viac"]') && !/Ďalšie farby/.test(tx('[data-krok="nasivky"]')), J(nt.map((x) => x.getAttribute("data-v"))));
  over("17: farba nite = <button> s krúžkom vo farbe nite, menom a kódom (Svetlosivá 3738)", nt.every((x) => x.tagName === "BUTTON" && x.getAttribute("type") === "button" && x.querySelector("i[style*='background']") && x.querySelector(".nt__nm") && x.querySelector(".nt__kod")) &&
    tx('[data-a="nit"][data-m="boky"][data-v="3738"] .nt__nm') === "Svetlosivá" && tx('[data-a="nit"][data-m="boky"][data-v="3738"] .nt__kod') === "3738");
  t.klik(a("motiv", "H21", "boky"));
  potvrd(t, "boky");
  over("17: Pokračovať bez nite -> karta ostane, červený rám pri farbe nite", U.n5.boky === false && J(otvorene(K5)) === J(["boky"]) && !!q(K5 + '[data-pole="bokyNit"].is-chyba'), J(U.n5));
  nit(t, "2824", "boky");
  over("17: po výbere nite červený rám zmizne", !q(K5 + ".is-chyba"));
  const cv = q(".kn-nh__cv");
  over("17: veľký náhľad — plátno 3:2 s rozlíšením ≥ 960 px, niť červená na farbe kobercov", !!cv && +cv.getAttribute("width") >= 960 && +cv.getAttribute("width") * 2 === +cv.getAttribute("height") * 3 && cv.getAttribute("data-hex") === "#c82030" && /te69da20|t8131265/.test(cv.getAttribute("data-bg")) && /Náhľad: Trucker \(H21\) · niť červená \(2824\)/.test(tx(".kn-nh__hd")), cv && cv.outerHTML.slice(0, 200));
  over("17: pod náhľadom „Kam príde“ so schémou kabíny", /Kam príde: pod sedadlá šoféra a spolujazdca\./.test(tx(".kn-nh__pop")) && !!q(".kn-nh__pop svg.kn-schema"));
  potvrd(t, "boky");
  over("17: Pokračovať -> „✓ Pod sedadlá šoféra a spolujazdca: Trucker (H21) · niť červená (2824) — Zmeniť“", U.n5.boky === true && J(hot(K5)) === J(["kam", "boky"]) && tx(K5 + '.kn-hot[data-hot="boky"] .kn-hot__tx') === "Pod sedadlá šoféra a spolujazdca: Trucker (H21) · niť červená (2824)", tx(K5 + '.kn-hot[data-hot="boky"]'));
  const rv = qa('.kn-rv__b[data-a="stredRovnaky"]');
  over("17: potom LEN karta „Stred“ s otázkou a dvomi voľbami, nič nepredvolené", J(otvorene(K5)) === J(["stred"]) && tx(K5 + ".kn-karta__ey") === "Stred" && tx(K5 + ".kn-ot") === "Prosím, vyberte si nášivku do stredu" && rv.length === 2 && /Rovnaká ako pod sedadlami šoféra a spolujazdca/.test(rv[0].textContent) && /Trucker \(H21\)/.test(rv[0].textContent) && /Iná nášivka/.test(rv[1].textContent) && rv.every((x) => x.getAttribute("aria-pressed") === "false"));
  over("17: bez odpovede na stred krok 5 nie je hotový", !t.k.ui.hotovo() && !dalej5() && !q('[data-krok="nasivky"].is-done'));
  t.klik(a("stredRovnaky", "0"));
  over("17: „Iná nášivka“ -> riadok voľby + motív a niť pre stred + Pokračovať", S.stredRovnaky === false && !!q(K5 + '.kn-hot--vnutri[data-hot="stred"]') && !!q('[data-pole="stredMotiv"]') && !!q('[data-pole="stredNit"]') && !!q(a("potvrd", "stred")) && !q('.kn-rv__b[data-a="stredRovnaky"]'));
  t.klik(a("motiv", "H19", "stred")); nit(t, "2999", "stred");
  potvrd(t, "stred");
  over("17: Pokračovať v poslednej karte -> krok 5 sa sám zavrie, otvorí sa krok 6 (bez „Pokračujte ďalej“)", U.otvoreny === "tapacir" && !q('[data-krok="nasivky"].is-open') && !!q('[data-krok="nasivky"].is-done') && !dalej5(), U.otvoreny);
  t.klik(a("krok", "nasivky"));
  over("17: znova otvorený hotový krok 5 -> 3 riadky ✓, žiadna otvorená karta, „Pokračujte ďalej“ ako záloha", J(hot(K5)) === J(["kam", "boky", "stred"]) && J(otvorene(K5)) === "[]" && dalej5() && tx(K5 + '.kn-hot[data-hot="stred"] .kn-hot__tx') === "Stred: Kamión (H19) · niť čierna (2999)", tx(K5 + '.kn-hot[data-hot="stred"]'));
  over("17: iný stred v selectoch 409 / 412 (H19 / 2999), pod sedadlami 403 / 406 (H21 / 2824)", zvolene(t.d, 409) === "Nášivka H19" && zvolene(t.d, 412) === "2999 – Čierna" && zvolene(t.d, 403) === "Nášivka H21" && zvolene(t.d, 406) === "2824 – Červená");
  t.klik(a("zmenit", "stred"));
  over("17: Zmeniť stred -> otázka znova, zvolená „Iná nášivka“", J(otvorene(K5)) === J(["stred"]) && q(a("stredRovnaky", "0")).getAttribute("aria-pressed") === "true" && q(a("stredRovnaky", "1")).getAttribute("aria-pressed") === "false");
  t.klik(a("stredRovnaky", "1"));
  over("17: Zmeniť stred -> „Rovnaká“ = hotovo, krok 5 sa sám zavrie a otvorí sa krok 6", U.otvoreny === "tapacir" && !dalej5(), U.otvoreny);
  t.klik(a("krok", "nasivky"));
  over("17: „Rovnaká“ = hotovo, karta sa zatvorí, stred v selectoch = pod sedadlami", J(otvorene(K5)) === "[]" && /Stred: rovnaká nášivka ako pod sedadlami – Trucker \(H21\) · niť červená \(2824\)/.test(tx(K5 + '.kn-hot[data-hot="stred"]')) && zvolene(t.d, 409) === "Nášivka H21" && zvolene(t.d, 412) === "2824 – Červená", tx(K5 + '.kn-hot[data-hot="stred"]'));
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
  over("17: pod sedadlá -> do stredu: karta stredu s motívom a niťou spod sedadiel (H21 / 2824, nie starý vlastný stred H19 / 2999) na potvrdenie", S.nas === "stred" && S.nasStred.motiv === "H21" && S.nasStred.nit === "2824" && J(otvorene(K5)) === J(["stred"]) && tx(K5 + ".kn-karta__ey") === "Nášivka do stredu" && !!q(a("potvrd", "stred")), J(otvorene(K5)) + " " + J(S.nasStred));
  potvrd(t, "stred");
  over("17: stred potvrdený -> krok 5 sa sám zavrie", U.otvoreny === "tapacir", U.otvoreny);
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
  const dvere = q(K6 + ".kn-dvere:not(.kn-dvere--vyrez) > img") || q(K6 + ".kn-dvere--gal > .kn-gal__s > img");
  over("17: krok 6 — celá fotka dverí (JPEG v assets/img/1v, 1536 × 1024 = 3:2)", !!dvere && /\/assets\/img\/1v\/kamion-dvere-tapacir\.jpg$/.test(dvere.getAttribute("src")) && dvere.getAttribute("width") === "1536" && dvere.getAttribute("height") === "1024");
  over("17: krok 6 — vysvetlivka bez lemovania (červená čiara na fotke je len obrys)", tx(K6 + '[data-blok="ponuka"] > .k-pod') === "Výplň v strede panelu dverí – na fotke je vyznačená červenou.", tx(K6 + ".k-pod"));
  over("17: krok 6 — galéria 5 fotiek (data.js FOTKY_DVERI, Michal 23. 10. 2026), štítok „Tapacír dverí“ len na prvej, „Ilustračná fotka“", qa(K6 + ".kn-gal__s").length === 5 && qa(K6 + ".kn-gal__b").length === 5 && qa(K6 + ".kn-stitok").length === 1 && tx(K6 + ".kn-dvere .kn-stitok") === "Tapacír dverí" && /Ilustračná fotka/.test(tx(K6 + ".kn-dvere")), qa(K6 + ".kn-gal__s").length);
  over("17: ponuka tapacíru — výhody ako ✓ zoznam (2 riadky)", J(qa(K6 + ".kn-ponuka .kn-ponuka__ben li").map((x) => x.textContent)) === J(["Cena za oba tapacíre – šofér aj spolujazdec", "Rovnaký materiál ako koberce, alebo iný"]), J(qa(K6 + ".kn-ponuka__ben li").map((x) => x.textContent)));
  over("17: ponuka tapacíru — Samostatne 179 € / Výhoda v sete − 60 € / V sete 119 €", J(cen(q(K6 + ".kn-ponuka .k-ucet"))) === J(R("179 €", "− 60 €", "119 €")) && !q(K6 + ".kn-ponuka s"), J(cen(q(K6 + ".kn-ponuka .k-ucet"))));
  over("17: najprv LEN ponuka (Áno zelené, Nie zlaté), bez materiálu a nášivky na dvere", J(otvorene(K6)) === J(["ponuka"]) && q(a("tap", "ano")).classList.contains("k-btn-zelene") && q(a("tap", "nie")).classList.contains("k-btn-zlate") && !q(a("tapNas", "ano")) && !dalej6());
  t.klik(a("tap", "ano"));
  over("17: Áno -> „✓ Tapacír dverí: áno · 119 €“, karta materiálu s otázkou a dvomi voľbami (nič nepredvolené)", J(hot(K6)) === J(["ponuka"]) && /Tapacír dverí: áno · 119 €/.test(tx(K6 + '.kn-hot[data-hot="ponuka"]')) && J(otvorene(K6)) === J(["mat"]) && tx(K6 + ".kn-ot") === "Prosím, vyberte si materiál, farbu a lemovanie tapacíru" && qa(K6 + ".kn-tv__b").length === 2 && qa(K6 + ".kn-tv__b").every((x) => x.getAttribute("aria-pressed") === "false") && !q(a("tapNas", "ano")));
  // 22. 10. 2026 (Michal): čiernobiela fotka výplne dverí bez čísel a štítkov, pod ňou dve karty; materiál a lemovanie
  // kobercov ako DVE samostatné dlaždice (nikdy pás lemovania cez fotku materiálu)
  const tvF = q(K6 + ".kn-tvfoto > img");
  over("17: nad voľbami čiernobiela fotka výplne dverí (kamion-dvere-tapacir.jpg) len s „Ilustračná fotka“", !!tvF && /\/assets\/img\/1v\/kamion-dvere-tapacir\.jpg$/.test(tvF.getAttribute("src")) &&
    tx(K6 + ".kn-tvfoto") === "Ilustračná fotka" && !q(K6 + ".kn-tvfoto .kn-bod, " + K6 + ".kn-tvfoto .kn-stitok") && q(K6 + ".kn-tvfoto").nextElementSibling === q(K6 + ".kn-tv"), tx(K6 + ".kn-tvfoto"));
  const tvA = q(a("tapRovnake")), tvB = q(a("tapZmenit")), tvD = tvA ? Array.from(tvA.querySelectorAll(".kn-tv__d")) : [];
  const f11 = DT.MATERIALY.filter((m) => m.nazov === PRES)[0].farby.filter((f) => f.kod === "11")[0], l04 = DT.LEMOVANIE.filter((l) => l.kod === "04")[0];
  const dTx = (d, c) => (d.querySelector(c) ? d.querySelector(c).textContent : "");
  over("17: karta A „Rovnaké ako koberce / Ladí s Vašimi kobercami“ — tlačidlo s krúžkom", !!tvA && tvA.tagName === "BUTTON" && tvA.getAttribute("type") === "button" && dTx(tvA, ".kn-tv__nm") === "Rovnaké ako koberce" && dTx(tvA, ".kn-tv__po") === "Ladí s Vašimi kobercami" && !!tvA.querySelector(".kn-tv__r"));
  over("17: karta A — dlaždica Materiál (fotka farby kobercov) a dlaždica Lemovanie (pás lemovania kobercov), každá s jedným obrázkom",
    tvD.length === 2 && J(tvD.map((d) => dTx(d, ".kn-tv__st"))) === J(["Materiál", "Lemovanie"]) && tvD.every((d) => d.querySelectorAll("img").length === 1) &&
    tvD[0].querySelector("img.kn-tv__foto").getAttribute("src") === f11.full && tvD[1].querySelector(".kn-tv__pas > img").getAttribute("src") === l04.full,
    J(tvD.map((d) => Array.from(d.querySelectorAll("img")).map((i) => i.getAttribute("src")))));
  over("17: karta A — „Prešívaná syntetická koža / čierna (11)“ a „čierna + červená (04) / páska po celom okraji“",
    J(tvD.map((d) => [dTx(d, ".kn-tv__dn"), dTx(d, ".kn-tv__dp")])) === J([["Prešívaná syntetická koža", "čierna (11)"], ["čierna + červená (04)", "páska po celom okraji"]]), J(tvD.map((d) => [dTx(d, ".kn-tv__dn"), dTx(d, ".kn-tv__dp")])));
  const lemB = tvB ? Array.from(tvB.querySelectorAll(".kn-tv__lt")).map((i) => i.getAttribute("src")) : [];
  over("17: karta B „Vlastná kombinácia“ — 4 vzorky materiálu, čiara, 2 pásy lemovania iné ako na kobercoch",
    !!tvB && dTx(tvB, ".kn-tv__nm") === "Vlastná kombinácia" && dTx(tvB, ".kn-tv__po") === "Iný materiál, farba alebo lemovanie" && tvB.querySelectorAll(".kn-tv__mm > img.kn-tv__mt").length === 4 &&
    !!tvB.querySelector(".kn-tv__mm + .kn-tv__del + .kn-tv__ml") && J(lemB) === J(["05", "09"].map((k) => DT.LEMOVANIE.filter((l) => l.kod === k)[0].swatch)), J(lemB));
  over("17: v kroku 6 nič nekladie lemovanie cez materiál (bez .kn-rv__lem, mozaiky materiálov a „+“)", !q(K6 + ".kn-rv__lem, " + K6 + ".kn-rv__plus, " + K6 + ".kn-rv__mozaika:not(.kn-rv__mozaika--motiv)"));
  t.klik(a("tapZmenit"));
  over("17: „Vlastná kombinácia“ -> materiál, farba a lemovanie vopred ako koberce + Pokračovať", S.tapRovnaky === false && S.tapMat === PRES && S.tapFarba === "11" && S.tapLem === "04" && !!q('[data-pole="tapMat"]') && !!q(".kn-vz") && !!q(a("potvrd", "tapMat")) && !q(a("tapNas", "ano")));
  over("17: vnorený riadok voľby = podstatné meno „✓ Iný materiál, farba alebo lemovanie“ (nie „Vlastná kombinácia“)", tx(K6 + '.kn-hot--vnutri[data-hot="mat"] .kn-hot__tx') === "Iný materiál, farba alebo lemovanie", tx(K6 + '.kn-hot--vnutri[data-hot="mat"]'));
  over("17: lemovanie uprostred vety malým písmom (lemovanie čierna + červená (04))", /lemovanie čierna \+ červená \(04\)/.test(tx(".kn-vz p")), tx(".kn-vz p"));
  const vzO = qa(".kn-vz .kn-vz__obr > .kn-vz__o");
  over("17: „Vybraté pre tapacír“ — materiál a lemovanie ako dve samostatné fotky vedľa seba so štítkami (nie pás cez materiál)",
    vzO.length === 2 && J(vzO.map((o) => o.querySelector(".kn-vz__st").textContent)) === J(["Materiál", "Lemovanie"]) && vzO.every((o) => o.querySelectorAll("img").length === 1) &&
    vzO[0].querySelector(".kn-vz__mat > img").getAttribute("src") === f11.full && vzO[1].querySelector(".kn-vz__lem > img").getAttribute("src") === l04.full && !q(".kn-vz .kn-rv__viz"),
    J(vzO.map((o) => Array.from(o.querySelectorAll("img")).map((i) => i.getAttribute("src")))));
  t.klik(a("tapMat", "Mikrosemiš – dvojfarebný"));
  over("17: dvojfarebný mikrosemiš -> farba kobercov 11 sa zruší", S.tapMat === "Mikrosemiš – dvojfarebný" && S.tapFarba === null, J([S.tapMat, S.tapFarba]));
  potvrd(t, "tapMat");
  over("17: Pokračovať bez farby -> karta ostane, červený rám pri farbe", U.n6.mat === false && !!q(K6 + '[data-pole="tapFarba"].is-chyba') && t.s.chyby.length === 0);
  t.klik(a("zmenit", "mat"));
  over("17: Zmeniť -> otázka „rovnaké / inak“, zvolená „Vlastná kombinácia“ (zelená)", J(otvorene(K6)) === J(["mat"]) && q(a("tapZmenit")).getAttribute("aria-pressed") === "true" && q(a("tapZmenit")).classList.contains("is-on") && q(a("tapRovnake")).getAttribute("aria-pressed") === "false" && !q(a("tapRovnake")).classList.contains("is-on"));
  t.klik(a("tapZmenit"));
  over("17: opätovná „Vlastná kombinácia“ S nemení (revízia: bez pádu zhrnutia) — farba stále chýba", S.tapRovnaky === false && S.tapFarba === null && !!q('[data-pole="tapFarba"]') && t.s.chyby.length === 0, J([S.tapFarba]) + " | " + t.s.chyby.join(" | "));
  t.klik(a("zmenit", "mat")); t.klik(a("tapRovnake"));
  over("17: „Rovnaké ako koberce“ = hotovo, riadok ✓, potom LEN karta nášivky na dvere", S.tapRovnaky === true && J(hot(K6)) === J(["ponuka", "mat"]) && /Materiál, farba a lemovanie: rovnaké ako koberce/.test(tx(K6 + '.kn-hot[data-hot="mat"]')) && J(otvorene(K6)) === J(["nas"]));
  over("17: nášivka na dvere — výrez dverí so zlatým krúžkom „Sem príde nášivka“", /Sem príde nášivka/.test(tx(".kn-dvere--vyrez .kn-bod")) && /do stredu výplne oboch dverí/.test(tx(K6 + ".k-krok__telo")));
  over("17: nášivka na dvere — Samostatne 89 € / Výhoda v sete − 40 € / V sete + 49 €", J(cen(q(".kn-ponuka--nas .k-ucet"))) === J(R("89 €", "− 40 €", "+ 49 €")) && !q(".kn-ponuka--nas s"), J(cen(q(".kn-ponuka--nas .k-ucet"))));
  over("17: nášivka na dvere — ✓ „Cena za obe nášivky – na oba tapacíre“", J(qa(".kn-ponuka--nas .kn-ponuka__ben li").map((x) => x.textContent)) === J(["Cena za obe nášivky – na oba tapacíre"]));
  t.klik(a("tapNas", "ano"));
  const tn = qa('.kn-rv__b[data-a="tapNasRovnaka"]');
  over("17: Áno -> „✓ Nášivka na tapacír dverí: áno · + 49 €“, otázka „Rovnaká ako na kobercoch / Iná nášivka“", /Nášivka na tapacír dverí: áno · \+ 49 €/.test(tx(K6 + '.kn-hot[data-hot="nas"]')) && J(otvorene(K6)) === J(["dvere"]) && tx(K6 + ".kn-ot") === "Prosím, vyberte si nášivku na tapacír dverí" && tn.length === 2 && /Trucker \(H21\) · niť červená \(2824\)/.test(tn[0].textContent) && /Iná nášivka/.test(tn[1].textContent) && tn.every((x) => x.getAttribute("aria-pressed") === "false") && !dalej6());
  over("17: karta motívu má vlastný nadpis „Motív nášivky na tapacír dverí“ (nie ten istý ako riadok ✓ nad ňou)", tx(K6 + '[data-blok="dvere"] .kn-karta__ey') === "Motív nášivky na tapacír dverí", tx(K6 + ".kn-karta__ey"));
  t.klik(a("tapNasRovnaka", "0"));
  over("17: „Iná nášivka“ -> motív, niť, veľký náhľad na farbe tapacíru, Pokračovať", !!q('[data-pole="dvereMotiv"]') && !!q('[data-pole="dvereNit"]') && !!q(a("potvrd", "dvere")) && !q(K6 + ".kn-nh__cv"));
  t.klik(a("motiv", "H19", "dvere")); nit(t, "2840", "dvere");
  over("17: veľký náhľad nášivky na dverách", !!q(K6 + ".kn-nh__cv") && /Kam príde: do stredu výplne oboch dverí/.test(tx(K6 + ".kn-nh__pop")));
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

console.log("19) Zmena voľby 5.1 pod sedadlá + do stredu (iný stred) -> pod sedadlá -> do stredu: stred prevezme motív a niť spod sedadiel");
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
  over("19: pod sedadlá -> do stredu: karta stredu má H19 / 2999 (práve videné), nie starý H21 / 3546", S.nas === "stred" && S.nasStred.motiv === "H19" && S.nasStred.nit === "2999" && on("motiv", "stred") === "H19" && on("nit", "stred") === "2999" && !t.k.ui.hotovo(), JSON.stringify(S.nasStred));
  potvrd(t, "stred");
  sam(t, "nasivky", "tapacir", "19");
  t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "19", { selecty: { 349: "Len stred", 409: "Nášivka H19", 412: "2999 – Čierna" } });
}

console.log("20) 1B hlavička a 6A ceny v hlavičkách krokov, súhrn bez karty (Michal 22. 10. 2026)");
{
  const t = await otvor();
  const q = (sel) => t.d.querySelector("#lcd1v-kamion " + sel);
  const qa = (sel) => Array.from(t.d.querySelectorAll("#lcd1v-kamion " + sel));
  const tx = (sel) => (q(sel) ? q(sel).textContent.replace(/\s+/g, " ").trim() : "");
  const vy = (id) => tx('[data-krok="' + id + '"] .k-krok__vy');
  const vyR = (id) => qa('[data-krok="' + id + '"] .k-krok__vy .k-krok__vr').map((x) => x.textContent.replace(/\s+/g, " ").trim());
  const nbsp = (id) => q('[data-krok="' + id + '"] .k-krok__vy').textContent;
  // 1B: bez úvodnej vety a čipov „V základnej cene“, v cenovom boxe dve vety s ✓; krok 1 bez úvodnej vety
  over("20: hlavička bez úvodnej vety (.k-perex) a čipov „V základnej cene“ (.vc)", !q(".k-perex") && !q(".vc") && !/V základnej cene|šijú podľa šablóny/.test(t.d.getElementById("lcd1v-kamion").textContent));
  over("20: cenový box „Naša cena od 199 €“ + dve vety s ✓", /Naša cena\s*od\s*199\s€/.test(tx(".k-cena")) && J(qa(".k-cena .k-cena__vc > .k-cena__vr").map((x) => x.textContent)) === J(["V cene: šofér, spolujazdec aj stred", "Farba a lemovanie bez príplatku"]), tx(".k-cena"));
  over("20: krok 1 bez úvodnej vety, poznámka pod krokom (28 modelov, telefón, e-mail) ostala", !q('[data-krok="vozidlo"] .k-pod') && /Šablóny máme pre 28 modelov kamiónov/.test(tx('[data-krok="vozidlo"] .k-pozn')) && !!q('[data-krok="vozidlo"] .k-pozn a[href="tel:+421903660720"]'));
  // súhrn bez karty: len Spolu (zatiaľ), čo chýba, tlačidlo, fakty, dopravcovia
  over("20: súhrn bez „Súhrn objednávky“, nadpisu, vozidla a riadkov", !q(".sh__ey") && !q(".sh__h") && !q(".sh__voz") && !q(".sh__r") && !/Súhrn objednávky|Koberce pre Váš|Koberce do kabíny/.test(tx('[data-k="suhrn"]')), tx('[data-k="suhrn"]'));
  over("20: nič nevybraté -> „Spolu zatiaľ 199 €“, „Zatiaľ nevybraté: …“, „Dokončite výber“, 3 fakty, dopravcovia",
    tx(".k-suhrn__lb") === "Spolu zatiaľ" && tx(".k-suhrn__suma") === "199 €" && /^Zatiaľ nevybraté: vozidlo, materiál, farba, lemovanie, nášivky, tapacír dverí\.$/.test(tx(".sh__chyba-r")) &&
    tx(".k-kosik") === "Dokončite výber" && J(qa(".sh__fakty li").map((x) => x.textContent)) === J(["Dodanie približne 14–25 dní", "Platba kartou alebo prevodom", "Odpovedáme spravidla do hodiny"]) && tx(".k-alt") === "Máte vo firme viac kamiónov? Napíšte nám", tx('[data-k="suhrn"]'));
  zaklad(t, DAF);
  over("20: krok 1 = „DAF XF106 2017–2021 · automatická · 199 €“ (cena za nezalomiteľnou medzerou)", vy("vozidlo") === "DAF XF106 2017–2021 · automatická · 199 €" && / · 199 €$/.test(nbsp("vozidlo")), vy("vozidlo"));
  over("20: krok 2 = „Prémiová syntetická koža, prešívaná · + 10 €“", vy("material") === "Prémiová syntetická koža, prešívaná · + 10 €", vy("material"));
  over("20: kroky 3 a 4 = „Čierna (11) · v cene“, „Čierna + Červená (04) · v cene“", vy("farba") === "Čierna (11) · v cene" && vy("lemovanie") === "Čierna + Červená (04) · v cene", vy("farba") + " | " + vy("lemovanie"));
  nasivky(t, "boky+stred", "H19", "2999");
  over("20: krok 5 = „{rozsah} · {motív} · niť {farba} · + 95 €“", vy("nasivky") === "Pod sedadlá šoféra a spolujazdca + do stredu · Kamión · niť čierna · + 95 €", vy("nasivky"));
  t.klik(a("tap", "ano")); t.klik(a("tapRovnake")); t.klik(a("tapNas", "nie"));
  over("20: krok 6 ako koberce = „Rovnaký ako koberce · + 119 €“ (jeden riadok)", vy("tapacir") === "Rovnaký ako koberce · + 119 €" && !vyR("tapacir").length, vy("tapacir"));
  over("20: všetko vybraté -> „Spolu 423 €“, „Ušetríte 105 €…“, „Pridať do košíka“, bez „Zatiaľ nevybraté“", tx(".k-suhrn__lb") === "Spolu" && tx(".k-suhrn__suma") === "423 €" && /^Ušetríte 105 € oproti samostatnému nákupu$/.test(tx(".sh__us")) && tx(".k-kosik") === "Pridať do košíka" && !q(".sh__chyba-r"), tx('[data-k="suhrn"]'));
  // tapacír inak + nášivka na dvere ako na kobercoch -> dva riadky
  t.klik(a("krok", "tapacir")); t.klik(a("zmenit", "mat")); t.klik(a("tapZmenit"));
  t.klik(a("tapMat", "Mikrosemiš – dvojfarebný")); t.klik(a("tapFarba", "2N")); t.klik(a("tapLem", "11")); potvrd(t, "tapMat");
  t.klik(a("krok", "tapacir")); t.klik(a("zmenit", "nas")); t.klik(a("tapNas", "ano")); t.klik(a("tapNasRovnaka", "1"));
  over("20: krok 6 inak + nášivka = 2 riadky s cenami", J(vyR("tapacir")) === J(["Mikrosemiš, dvojfarebný · sivá (2N) · lemovanie béžová + hnedá (11) · + 119 €", "Nášivka Kamión (H19) · niť čierna (2999) · + 49 €"]) && t.k.ui.hotovo(), J(vyR("tapacir")));
  const t2 = await otvor();
  hotovyDaf(t2);
  const vy2 = (id) => { const e = t2.d.querySelector('#lcd1v-kamion [data-krok="' + id + '"] .k-krok__vy'); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
  over("20: bez nášiviek = „Bez nášiviek · bez príplatku“, bez tapacíru = „Bez tapacíru“", vy2("nasivky") === "Bez nášiviek · bez príplatku" && vy2("tapacir") === "Bez tapacíru", vy2("nasivky") + " | " + vy2("tapacir"));
  over("20: žiadny console.error", t.s.chyby.length === 0 && t2.s.chyby.length === 0, t.s.chyby.concat(t2.s.chyby).join(" | "));
}

console.log("21) Fotky tapacíru: pri 2+ fotkách prelínanie, bodky, autoplay 3 s len v okne, po zatvorení žiadny bežiaci interval");
{
  // 5 fotiek (data.js FOTKY_DVERI od 23. 10. 2026; jsdom ich nenačíta), počítadlo bežiacich intervalov a IntersectionObserver,
  // ktorý fotku hneď nahlási v okne (jsdom nemá rozloženie) a po disconnect() už nevolá
  const VSTUP3 = 'import { FOTKY_DVERI } from "./assets/js/components/konfigurator1v/kamion/data.js";\nvoid FOTKY_DVERI;\n';
  const sleduj = (stav, menejPohybu) => (w) => {
    const si = w.setInterval.bind(w), ci = w.clearInterval.bind(w);
    w.setInterval = (fn, ms, ...r) => { const id = si(fn, ms, ...r); stav.aktivne.add(id); return id; };
    w.clearInterval = (id) => { stav.aktivne.delete(id); return ci(id); };
    w.IntersectionObserver = class { constructor(cb) { this.cb = cb; this.vyp = false; } observe(el) { setTimeout(() => { if (!this.vyp) this.cb([{ isIntersecting: true, target: el }]); }, 0); } unobserve() {} disconnect() { this.vyp = true; } };
    if (menejPohybu) w.matchMedia = (m) => ({ matches: /reduce/.test(m), media: m, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  };
  const st = { aktivne: new Set() };
  const t = await otvor({ vstup: VSTUP3, pred: sleduj(st) });
  await pauza(20);
  const zaklad0 = st.aktivne.size; // lišta (index.js obnovListu)
  const q = (sel) => t.d.querySelector("#lcd1v-kamion " + sel);
  const qa = (sel) => Array.from(t.d.querySelectorAll("#lcd1v-kamion " + sel));
  const K6 = '[data-krok="tapacir"] ';
  const zobrazena = () => qa(K6 + ".kn-gal__s").map((x, i) => (x.classList.contains("is-on") ? i : -1)).filter((i) => i >= 0);
  const bodka = () => qa(K6 + ".kn-gal__b").map((x, i) => (x.getAttribute("aria-pressed") === "true" ? i : -1)).filter((i) => i >= 0);
  zaklad(t, DAF);
  t.klik(a("nas", "nechcem"));
  await pauza(20);
  const s0 = qa(K6 + ".kn-gal__s"), b0 = qa(K6 + ".kn-gal__b");
  over("21: 5 fotiek v ráme 3:2, bodky pod fotkou (tlačidlá „Fotka 1–5“)", !!q(K6 + ".kn-gal > .kn-dvere.kn-dvere--gal + .kn-gal__bodky") && s0.length === 5 && b0.length === 5 &&
    J(b0.map((x) => x.getAttribute("aria-label"))) === J(["Fotka 1", "Fotka 2", "Fotka 3", "Fotka 4", "Fotka 5"]) && b0.every((x) => x.tagName === "BUTTON" && x.getAttribute("type") === "button"));
  over("21: prvá fotka zobrazená, ostatné skryté pre čítačku; štítok „Tapacír dverí“ len na prvej; „Ilustračná fotka“ na ráme",
    J(zobrazena()) === "[0]" && J(bodka()) === "[0]" && !s0[0].hasAttribute("aria-hidden") && s0[1].getAttribute("aria-hidden") === "true" &&
    qa(K6 + ".kn-stitok").length === 1 && !!s0[0].querySelector(".kn-stitok") && /\/assets\/img\/1v\/kamion-dvere-tapacir\.jpg$/.test(s0[0].querySelector("img").getAttribute("src")) &&
    /\/assets\/img\/1v\/kamion-dvere-tapacir-3\.jpg$/.test(s0[2].querySelector("img").getAttribute("src")) && !!q(K6 + ".kn-dvere--gal > .kn-ilu"));
  over("21: autoplay = 1 interval navyše", st.aktivne.size === zaklad0 + 1, st.aktivne.size + " vs " + zaklad0);
  await pauza(3150);
  over("21: po 3 s druhá fotka (prelínanie triedou is-on), bodka 2", J(zobrazena()) === "[1]" && J(bodka()) === "[1]", J([zobrazena(), bodka()]));
  t.klik(a("foto", "2"));
  over("21: ťuk na bodku 3 -> tretia fotka, interval sa nezdvojí", J(zobrazena()) === "[2]" && J(bodka()) === "[2]" && st.aktivne.size === zaklad0 + 1, J([zobrazena(), st.aktivne.size]));
  t.klik(a("tap", "ano"));
  over("21: Áno -> ponuka zatvorená do riadka ✓, fotky aj interval preč", !q(K6 + "[data-gal]") && st.aktivne.size === zaklad0, st.aktivne.size + " vs " + zaklad0);
  t.klik(a("zmenit", "ponuka"));
  await pauza(20);
  over("21: Zmeniť -> fotky znova od prvej, 1 interval", J(zobrazena()) === "[0]" && st.aktivne.size === zaklad0 + 1, J([zobrazena(), st.aktivne.size]));
  t.klik(a("tap", "nie")); // posledná odpoveď -> krok 6 sa sám zavrie
  over("21: krok 6 zavretý -> žiadny interval fotiek", t.k.ui.U.otvoreny === null && st.aktivne.size === zaklad0, st.aktivne.size + " vs " + zaklad0);
  t.klik(a("krok", "tapacir")); t.klik(a("zmenit", "ponuka"));
  await pauza(20);
  t.k.ui.render(); t.k.ui.render();
  await pauza(20);
  over("21: opakované prekreslenie -> stále len 1 interval", st.aktivne.size === zaklad0 + 1, st.aktivne.size + " vs " + zaklad0);
  t.k.ui.zrus();
  over("21: zrus() -> žiadny interval fotiek", st.aktivne.size === zaklad0, st.aktivne.size + " vs " + zaklad0);
  // prefers-reduced-motion: bez autoplay, bodky fungujú
  const st2 = { aktivne: new Set() };
  const t2 = await otvor({ vstup: VSTUP3, pred: sleduj(st2, true) });
  await pauza(20);
  const zaklad2 = st2.aktivne.size;
  zaklad(t2, DAF); t2.klik(a("nas", "nechcem"));
  await pauza(20);
  over("21: menej pohybu -> fotky s bodkami, bez autoplay (žiadny interval navyše)", t2.d.querySelectorAll('#lcd1v-kamion [data-krok="tapacir"] .kn-gal__b').length === 5 && st2.aktivne.size === zaklad2, st2.aktivne.size + " vs " + zaklad2);
  t2.klik(a("foto", "1"));
  over("21: menej pohybu -> ťuk na bodku 2 ukáže druhú fotku", t2.d.querySelector('#lcd1v-kamion [data-krok="tapacir"] .kn-gal__s.is-on img').getAttribute("src").endsWith("kamion-dvere-tapacir-2.jpg") && st2.aktivne.size === zaklad2);
  over("21: žiadny console.error", t.s.chyby.length === 0 && t2.s.chyby.length === 0, t.s.chyby.concat(t2.s.chyby).join(" | "));
}

{
  // 23. 10. 2026 (Michal z iPhonu): po výbere značky / modelu / ročníka sa zoznam o chvíľu otvoril znova — prekreslenie
  // vracalo fokus do nového selectu a iPhone pri fokuse zoznam otvorí. Po dotyku / myši fokus do zoznamu nevraciame,
  // po klávesnici áno (Tab a šípky nesmú stratiť miesto).
  const t = await otvor();
  const w = t.d.defaultView;
  const sel = (p) => t.d.querySelector('#lcd1v-kamion select[data-p="' + p + '"]');
  const PD = w.PointerEvent || w.MouseEvent;
  const prstom = (p, v) => { sel(p).dispatchEvent(new PD("pointerdown", { bubbles: true })); sel(p).focus(); t.vyber(p, v); };
  const klavesnicou = (p, v) => { sel(p).focus(); sel(p).dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })); t.vyber(p, v); };
  const fokus = () => (t.d.activeElement && t.d.activeElement.getAttribute("data-f")) || t.d.activeElement.tagName;
  prstom("znacka", "DAF (TIR)");
  over("22: dotyk — po výbere značky fokus nie je v zozname (iPhone by ho znova otvoril)", t.d.activeElement.tagName !== "SELECT", fokus());
  prstom("model", "XF106 2017-2021");
  over("22: dotyk — po výbere modelu fokus nie je v zozname", t.d.activeElement.tagName !== "SELECT", fokus());
  klavesnicou("znacka", "MAN (TIR)");
  over("22: klávesnica — fokus ostane na zozname značky", fokus() === "sel:znacka", fokus());
  prstom("znacka", "DAF (TIR)");
  over("22: dotyk po klávesnici — fokus znova nie je v zozname", t.d.activeElement.tagName !== "SELECT", fokus());
  over("22: výber sa uložil", t.k.ui.S.znacka === "DAF (TIR)", t.k.ui.S.znacka);
  over("22: žiadny console.error", t.s.chyby.length === 0, t.s.chyby.join(" | "));
}

{
  // 24. 10. 2026: kódy farieb podľa nového vzorkovníka dodávateľa (Desktop\WZORNIKI KOLORÓW). Prešívaná 1–14 a Mikrosemiš
  // dvojfarebný 1N–6N (predtým 2–15 / 2N–7N, tie isté farby o 1 vyššie), tónovaná 2/5/7/9/11PES (predtým PES2–PES6).
  // Kód ide do poznámky objednávky -> musí sedieť s vzorkovníkom; nový aj starý (React) konfigurátor rovnako.
  const TX = (await nacitajModul("assets/js/components/konfigurator1v/kamion/texty.js")).TEXTY;
  const OCAK = {
    "Prémiová syntetická koža – prešívaná": { 1: "Béžová", 2: "Modrá", 3: "Hnedá", 4: "Sivá", 5: "Čierna s červeným stehom", 6: "Červená", 7: "Karamelová", 8: "Tmavomodrá", 9: "Tmavohnedá", 10: "Grafitová", 11: "Čierna", 12: "Bordová", 13: "Zelená", 14: "Koňaková" },
    "Mikrosemiš – dvojfarebný": { "1N": "Tmavosivá", "2N": "Sivá", "3N": "Bordová", "4N": "Béžová", "5N": "Tmavohnedá", "6N": "Tmavomodrá" },
    "Prémiová syntetická koža – tónovaná": { "2PES": "Sivobéžová", "5PES": "Koňaková", "7PES": "Grafitová", "9PES": "Čokoládová", "11PES": "Hnedá" },
  };
  const mena = TX.kroky.farba.mena_farieb_navrh;
  const zorad = (a) => a.slice().sort().join(",");
  Object.entries(OCAK).forEach(([mat, o]) => {
    const kody = DT.MATERIALY.find((m) => m.nazov === mat).farby.map((f) => f.kod);
    over("23: " + mat + " — kódy v data.js podľa vzorkovníka", zorad(kody) === zorad(Object.keys(o)), kody.join(","));
    const zle = Object.entries(o).filter(([k, m]) => !(mena[mat] || []).some((x) => x.kod === k && x.meno === m));
    over("23: " + mat + " — mená farieb v texty.js", !zle.length && (mena[mat] || []).length === Object.keys(o).length, J(zle));
  });
  // fotka farby ostáva tá istá (posunul sa len kód): čierna prešívaná = súbor, ktorý mala predtým „12“
  const cierna = DT.MATERIALY.find((m) => m.slug === "presivana").farby.find((f) => f.kod === "11");
  over("23: čierna prešívaná (11) má fotku čiernej", !!cierna && /t1f1c099993a3d774\.jpg$/.test(cierna.swatch || cierna.thumb || J(cierna)), J(cierna));
  // starý konfigurátor (React gen.jsx, desktop aj telefón): tie isté kódy materiálov ako nový
  const vsetky = zorad(DT.MATERIALY.flatMap((m) => m.farby.map((f) => f.kod)));
  ["konfigurator.gen.jsx", "konfigurator.phone.gen.jsx"].forEach((f) => {
    const txt = readFileSync(new URL("../assets/js/truck-konfigurator/" + f, import.meta.url), "utf8");
    const kody = Array.from(txt.matchAll(/\{ code: "([^"]+)", swatch:/g), (m) => m[1]);
    over("23: React " + f + " má tie isté kódy farieb ako nový konfigurátor", zorad(kody) === vsetky, zorad(kody));
  });
  // poznámka objednávky: čierna prešívaná = „… – prešívaná – 11“ (React zrkadlo rovnako)
  const t = await otvor();
  zaklad(t, Object.assign({}, DAF, { farba: "11" }));
  over("23: poznámka objednávky „prešívaná – 11“", /Typ a farba materiálu: Prémiová syntetická koža – prešívaná – 11\n/.test(OS.buildTruckOrderSummary(ST.naStavReactu(t.k.ui.S))), "");
  over("23: žiadny console.error", t.s.chyby.length === 0, t.s.chyby.join(" | "));
}

{
  // 24. 10. 2026: Vzorovaný velúr (Duński welur 1D–5D, +60 €; SK admin hodnota 1957). Košík = React, poznámka s kódom 1D.
  console.log("24) Vzorovaný velúr");
  const VEL = "Vzorovaný velúr";
  const vel = DT.MATERIALY.find((m) => m.nazov === VEL);
  over("24: velúr v data.js s kódmi 1D–5D a fotkami z CDN repa", !!vel && J(vel.farby.map((f) => f.kod)) === J(["1D", "2D", "3D", "4D", "5D"]) &&
    vel.farby.every((f) => /\/assets\/img\/1v\/kamion-velur-[1-5]d\.jpg$/.test(f.swatch)), J(vel && vel.farby));
  const t = await otvor();
  zaklad(t, { znacka: "DAF (TIR)", model: "XF106 2017-2021", material: VEL, farba: "3D", lem: "04" });
  t.klik(a("nas", "nechcem")); t.klik(a("tap", "nie"));
  await kontrolaKosika(t, "24", { selecty: { 346: VEL }, poznamkaObsahuje: ["- Typ a farba materiálu: " + VEL + " – 3D"], spolu: 259 });
  // Michal 24. 10. 2026: dlaždica velúru v materiáli tapacíru = „vzorovaný · velúr“ (nie „syntetická koža“);
  // v karte „Vlastná kombinácia“ jemná čiara medzi otázkami materiál | farba | lemovanie
  const t2 = await otvor();
  zaklad(t2, DAF); t2.klik(a("nas", "nechcem")); t2.klik(a("tap", "ano")); t2.klik(a("tapZmenit")); t2.klik(a("tapMat", VEL));
  const q2 = (sel) => t2.d.querySelector("#lcd1v-kamion " + sel);
  const dl = q2('[data-a="tapMat"][data-v="' + VEL + '"] small');
  over("24: dlaždica velúru pri tapacíri = „velúr“", !!dl && dl.textContent === "velúr", dl && dl.textContent);
  const sk = Array.from(t2.d.querySelectorAll('#lcd1v-kamion .kn-karta .k-sk[data-pole^="tap"]:not(.kn-potvrd)'));
  // jsdom nenačíta CSS: poradie otázok v DOM + pravidlo čiary v luxuryCar.css (súrodenec .k-sk + .k-sk, nie tlačidlo Pokračovať)
  const css = readFileSync(new URL("../assets/css/luxuryCar.css", import.meta.url), "utf8");
  over("24: v karte idú otázky materiál, farba, lemovanie hneď za sebou (čiara medzi nimi)", J(sk.map((x) => x.getAttribute("data-pole"))) === J(["tapMat", "tapFarba", "tapLem"]) &&
    sk.slice(1).every((x) => x.previousElementSibling && x.previousElementSibling.classList.contains("k-sk")) &&
    css.includes('#lcd1v-kamion .kn-karta .k-sk + .k-sk:not(.kn-potvrd) { padding-top: 22px; border-top: 1px solid var(--k-line); }'), J(sk.map((x) => x.getAttribute("data-pole"))));
}

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
