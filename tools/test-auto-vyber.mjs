/* test-auto-vyber.mjs — výber auta (značka/model/rok/typ) v konfigurátore osobných áut.
 *
 * Hlásenie 8. 10. 2026 (CZ produkt „Ford | Model | 2023 | Pick-UP“): model sa občas nepreniesol z titulky
 * do produktu. Overuje SKUTOČNÝ kód z main.js (initModelSelect + saveModel + addNote) v jsdom:
 *   - uložený model je nastavený hneď po init (bez časovačov),
 *   - change s tou istou značkou (Shoptet handleBrowserValueRestoration po 'load') model nezhodí,
 *   - skutočná zmena značky prestaví zoznam a odstráni Model aj „model“ (nikdy "null"),
 *   - staré auto v karte + rýchly výber: časovač nevráti starý model (BMW X5 -> "null", Ford Kuga),
 *   - saveModel neukladá placeholder, selectedIndex -1, "null", "undefined",
 *   - validácia titulky zablokuje neúplný výber,
 *   - normalizované porovnanie (medzery, NBSP, veľkosť písmen, číslo, Lynk & Co, duplicita Lexus, Iné/Jiné),
 *   - change natívneho selectu Shoptetu (.surcharge-list mimo konfigurátora) uložené auto nemení,
 *   - poznámka objednávky (addNote) dostane len kompletné aktuálne auto.
 *
 * Spustenie: node tools/test-auto-vyber.mjs            (kód z tohto repa)
 *            node tools/test-auto-vyber.mjs <repo>     (iný checkout — napr. stav pred opravou, má zlyhať)
 */
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(process.argv[2] || ROOT);
const req = createRequire(join(ROOT, "package.json"));
const { JSDOM, VirtualConsole } = req("jsdom");
const esbuild = req("esbuild");
const JQUERY = readFileSync(req.resolve("jquery"), "utf8");

let zlyhania = 0;
const ok = (m) => console.log("✓ " + m);
const fail = (m) => { zlyhania++; console.error("✗ " + m); };
const over = (podm, m, detail) => (podm ? ok(m) : fail(m + (detail !== undefined ? " — " + JSON.stringify(detail) : "")));
const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- kód z main.js (bez celého Shoptet bootstrapu) ----
const src = readFileSync(join(REPO, "assets/js/main.js"), "utf8").replace(/\r\n/g, "\n"); // checkout s CRLF
const vyrez = (od, po) => {
  const a = src.indexOf(od);
  const b = src.indexOf(po, a + od.length);
  if (a < 0 || b < 0) throw new Error(`v main.js chýba úsek ${od} … ${po}`);
  return src.slice(a, b);
};
const initSrc = vyrez("function initModelSelect", "\n/**\n * Hlavný prepínač");
const saveSrc = vyrez("function saveModel", "\nfunction initSignpost");
const noteSrc = vyrez("function isUsableSavedModel", "\n// ───");
const autoVyber = join(REPO, "assets/js/functions/autoVyber.js");
const p = (f) => JSON.stringify(f.replace(/\\/g, "/"));
const entry = `
${existsSync(autoVyber) ? `import { LCD_TYP_PLACEHOLDERY, lcdNorm, lcdPlatnaHodnota, lcdVyberMoznost, lcdNajdiKluc } from ${p(autoVyber)};
window.__lcd = { LCD_TYP_PLACEHOLDERY, lcdNorm, lcdPlatnaHodnota, lcdVyberMoznost, lcdNajdiKluc };` : ""}
import { mergeTruckOrderSummaryIntoNote } from ${p(join(REPO, "assets/js/truck-konfigurator/order-summary.mjs"))};
let setupData = window.__setupData;
function initVehicleKindSwitch() {}
${initSrc}
${saveSrc}
${noteSrc}
window.__initModelSelect = initModelSelect;
window.__saveModel = saveModel;
window.__addNote = addNote;
`;
const bundle = (await esbuild.build({ stdin: { contents: entry, resolveDir: REPO, loader: "js" }, bundle: true, format: "iife", write: false, logLevel: "silent" })).outputFiles[0].text;

// dáta ako data.json (výrez živých: Ford/BMW/Lexus duplicita/Peugeot čísla/Lynk & Co)
const DATA = {
  cars: {
    BMW: ["X3", "X5", "X5 M"],
    Ford: ["F-150", "Kuga", "Kuga (Hybrid)", "Ranger", "Jiné, prosím napište do poznámky"],
    Lexus: ["UX", "UX 200", "UX 200", "UX 250h"],
    "Lynk & Co": ["Lynk & Co 01", "Lynk & Co 03+"],
    Peugeot: [208, 3008, "5008"],
  },
  settings: { carVariant: "Coupe,Combi,Hatchback,Kabriolet,Long,Pick-UP,Sedan,SUV,Jiné,Prosím napište do poznámky" },
};

// stránka: titulka (in-index + #konfSlot) alebo produkt (type-product + kotva .parameter-cars.wheel-Position)
function stranka({ typ = "produkt", seed = null, lang = "cs" } = {}) {
  const navigacie = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => { if (/navigation/i.test(e.message)) navigacie.push(e.message); });
  const telo = typ === "titulka"
    ? `<body class="in-index type-index"><div id="konfSlot"><a class="btn" href="/rozcestnik/">Vybrať auto</a></div></body>`
    : `<body class="type-product"><div class="content-wrap"><div class="position-wrap"><div class="parameter-cars wheel-Position"></div></div></div>
       <table class="detail-parameters"><tr class="surcharge-list"><td><select id="nativny" data-parameter-id="37"><option value="">Vyberte</option><option value="1">A</option></select></td></tr></table>
       <div class="model-info"><div class="model-text">povodny</div></div></body>`;
  const dom = new JSDOM(`<!DOCTYPE html><html lang="${lang}"><head></head>${telo}</html>`,
    { url: "https://www.luxurycardesign.cz/", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: vc });
  const w = dom.window;
  w.eval(JQUERY);
  Object.assign(w, {
    cstm_znacka: ["Značka", "Prosím, vyberte značku vozidla"],
    cstm_model: ["Model", "Prosím,vyberte model vozidla"],
    cstm_rocnik: ["Rok výroby", "Prosím,vyberte rok výroby vozidla"],
    years_from: 2000,
    __setupData: JSON.parse(JSON.stringify(DATA)),
    shoptet: { custom: {} },
  });
  if (seed) for (const k of Object.keys(seed)) w.sessionStorage.setItem(k, seed[k]);
  w.eval(bundle);
  w.__initModelSelect({});
  const q = (c) => w.document.querySelector(".model-selector .surcharge-list." + c + " select");
  const sel = { znacka: q("brands"), model: q("models"), rok: q("years"), typ: q("type-selector") };
  const text = (s) => (s && s.selectedIndex >= 0 ? s.options[s.selectedIndex].text : null);
  // po každom change počkať 150 ms: pôvodný saveModel zapisoval až po 100 ms (férové porovnanie so stavom pred opravou)
  const vyber = async (pole, t) => {
    const s = sel[pole];
    const i = [...s.options].findIndex((o) => o.text === t);
    if (i < 0) throw new Error(`možnosť ${t} v ${pole} nie je`);
    s.selectedIndex = i;
    s.dispatchEvent(new w.Event("change", { bubbles: true }));
    await pauza(150);
  };
  const zmena = async (pole) => { sel[pole].dispatchEvent(new w.Event("change", { bubbles: true })); await pauza(150); }; // ako signalNativeEvent
  const ss = () => Object.fromEntries(["Brand", "Model", "Year", "carType", "model"].map((k) => [k, w.sessionStorage.getItem(k)]));
  const auto = () => [text(sel.znacka), text(sel.model), text(sel.rok), text(sel.typ)].join(" | ");
  return { w, sel, text, vyber, zmena, ss, auto, navigacie };
}
const FORD = { Brand: "Ford", Model: "Ranger", Year: "2023", carType: "Pick-UP", model: "Ford Ranger 2023 Pick-UP" };
const ZLE_HODNOTY = /^(null|undefined|Značka|Model|Rok výroby|Typ auta)$|\b(null|undefined)\b/;
const bezZlych = (o) => Object.values(o).every((v) => v === null || !ZLE_HODNOTY.test(v));

// 1) obnova bez časovačov
{
  const t = stranka({ typ: "produkt", seed: FORD });
  over(t.auto() === "Ford | Ranger | 2023 | Pick-UP", "1) uložené auto je v selectoch HNEĎ po init (bez časovačov)", t.auto());
  // 2) Shoptet po 'load' pošle change na každý .surcharge-list select (rovnaké hodnoty)
  for (const pole of ["znacka", "model", "rok", "typ"]) await t.zmena(pole);
  over(t.auto() === "Ford | Ranger | 2023 | Pick-UP", "2) change s tou istou značkou (Shoptet signalNativeEvent) model nezhodí", t.auto());
  over(JSON.stringify(t.ss()) === JSON.stringify(FORD), "2) sessionStorage po change s rovnakými hodnotami nezmenený", t.ss());
  over(t.w.document.querySelector(".model-text").textContent === "Ford Ranger 2023 Pick-UP", "2) banner .model-text = kompletné auto");
  // 9) natívny select Shoptetu (príplatok) — uložené auto sa nemení
  t.w.sessionStorage.setItem("Brand", "BMW");
  const nat = t.w.document.getElementById("nativny");
  nat.selectedIndex = 1; nat.dispatchEvent(new t.w.Event("change", { bubbles: true })); await pauza(150);
  over(t.w.sessionStorage.getItem("Brand") === "BMW", "9) change natívneho selectu Shoptetu saveModel nespustí");
  t.w.sessionStorage.setItem("Brand", "Ford");
  // 3) skutočná zmena značky Ford -> BMW
  await t.vyber("znacka", "BMW");
  const modely = [...t.sel.model.options].map((o) => o.text);
  over(modely.join(",") === "Model,X3,X5,X5 M", "3) zmena značky prestaví zoznam modelov na BMW", modely);
  over(t.sel.model.selectedIndex === 0, "3) po zmene značky je model na placeholdri");
  const s3 = t.ss();
  over(s3.Brand === "BMW" && s3.Model === null && s3.model === null && s3.Year === "2023" && s3.carType === "Pick-UP",
    "3) Model aj „model“ odstránené (nie \"null\"), značka/rok/typ uložené", s3);
  over(t.w.document.querySelector(".model-text").textContent === "Ford Ranger 2023 Pick-UP", "3) banner sa neprepíše neúplným autom („BMW Model …“)");
  // 12) poznámka objednávky po (3): bez riadku model
  t.w.document.body.classList.add("id--17");
  t.w.document.body.insertAdjacentHTML("beforeend", `<form id="order-form"><textarea id="remark">Ručná poznámka</textarea></form>`);
  t.w.__addNote();
  t.w.shoptet.custom.postSuccessfulValidation(t.w.document.getElementById("order-form"));
  over(t.w.document.getElementById("remark").value === "Ručná poznámka", "12) poznámka objednávky po zmene značky bez modelu nenesie staré auto",
    t.w.document.getElementById("remark").value);
  await t.vyber("model", "X5");
  over(t.ss().model === "BMW X5 2023 Pick-UP", "3) po výbere modelu „model“ = BMW X5 2023 Pick-UP", t.ss());
  t.w.shoptet.custom.postSuccessfulValidation(t.w.document.getElementById("order-form"));
  over(t.w.document.getElementById("remark").value === "Ručná poznámka\n\nmodel: BMW X5 2023 Pick-UP", "12) poznámka objednávky dostane aktuálne auto",
    t.w.document.getElementById("remark").value);
}

// 4) staré auto v karte (BMW X5) + rýchly výber na titulke — časovače nesmú vrátiť X5 do zoznamu Fordu
{
  const t = stranka({ typ: "titulka", seed: { Brand: "BMW", Model: "X5", Year: "2020", carType: "SUV", model: "BMW X5 2020 SUV" } });
  over(t.auto() === "BMW | X5 | 2020 | SUV", "4) titulka: staré auto obnovené hneď", t.auto());
  await pauza(300); await t.vyber("znacka", "Ford");
  await pauza(450); await t.vyber("model", "Ranger");
  await pauza(1700); // za posledný starý časovač (2000 ms)
  over(t.text(t.sel.model) === "Ranger" && t.sel.model.selectedIndex > 0, "4) po 2,6 s je model stále Ranger (nie -1 / X5)", t.auto());
  await t.vyber("rok", "2023"); await t.vyber("typ", "Pick-UP");
  const s = t.ss();
  over(s.Model === "Ranger" && s.model === "Ford Ranger 2023 Pick-UP", "4) sessionStorage Model=Ranger, model=Ford Ranger 2023 Pick-UP (nie \"null\")", s);
}

// 5) staré auto rovnakej značky (Ford Kuga) + výber Ranger o 500 ms
{
  const t = stranka({ typ: "titulka", seed: { Brand: "Ford", Model: "Kuga", Year: "2020", carType: "SUV", model: "Ford Kuga 2020 SUV" } });
  await pauza(500); await t.vyber("model", "Ranger");
  await pauza(2000);
  over(t.text(t.sel.model) === "Ranger", "5) rovnaká značka: Ranger ostane (časovač nevráti Kuga)", t.auto());
  over(t.ss().Model === "Ranger" && t.ss().model === "Ford Ranger 2020 SUV", "5) sessionStorage Model=Ranger", t.ss());
}

// 6) saveModel nikdy nezapíše null / "null" / "undefined" / placeholder
{
  const t = stranka({ typ: "titulka", seed: FORD });
  const stavy = [
    ["model -1", () => { t.sel.model.selectedIndex = -1; }],
    ["model placeholder", () => { t.sel.model.selectedIndex = 0; }],
    ["značka placeholder", () => { t.sel.znacka.selectedIndex = [...t.sel.znacka.options].findIndex((o) => o.classList.contains("notselect")); }],
    ["rok placeholder", () => { t.sel.rok.selectedIndex = [...t.sel.rok.options].findIndex((o) => o.classList.contains("notselect")); }],
    ["typ placeholder", () => { t.sel.typ.selectedIndex = [...t.sel.typ.options].findIndex((o) => o.classList.contains("notselect")); }],
    ["model text null", () => { t.sel.model.insertAdjacentHTML("beforeend", "<option>null</option>"); t.sel.model.selectedIndex = t.sel.model.options.length - 1; }],
    ["model text undefined", () => { t.sel.model.insertAdjacentHTML("beforeend", "<option>undefined</option>"); t.sel.model.selectedIndex = t.sel.model.options.length - 1; }],
  ];
  for (const [meno, nastav] of stavy) {
    for (const [k, v] of Object.entries(FORD)) t.w.sessionStorage.setItem(k, v);
    nastav();
    t.w.__saveModel(false);
    await pauza(150);
    const s = t.ss();
    over(bezZlych(s) && s.model === null, `6) saveModel pri „${meno}“: žiadny null/"null"/placeholder, „model“ odstránený`, s);
  }
}

// 7) validácia titulky: neúplný výber nepresmeruje a označí pole
{
  const t = stranka({ typ: "titulka", seed: FORD });
  t.sel.model.selectedIndex = -1;
  t.w.document.querySelector(".btn.choice-Model").click();
  over(t.navigacie.length === 0, "7) model selectedIndex -1: „Zvolit model“ nepresmeruje", t.navigacie);
  over(t.w.document.querySelector(".surcharge-list.models").classList.contains("errorToCart"), "7) model -1: červený rámik na modeli");
  t.sel.model.selectedIndex = 0;
  t.w.document.querySelector(".btn.choice-Model").click();
  over(t.navigacie.length === 0, "7) model placeholder: nepresmeruje");
  await t.vyber("model", "Ranger");
  t.w.document.querySelector(".btn.choice-Model").click();
  over(t.navigacie.length === 1, "7) kompletný výber: presmeruje na /rozcestnik/", t.navigacie.length);
}

// 8) normalizácia a okrajové dáta
{
  const L = (stranka({ typ: "produkt" })).w.__lcd;
  if (!L) fail("8) functions/autoVyber.js chýba (stav pred opravou)");
  else {
    over(L.lcdNorm("  Ranger  ") === "ranger" && L.lcdNorm("RANGER") === "ranger" && L.lcdNorm(null) === "", "8) lcdNorm: medzery, NBSP, veľkosť písmen, null");
    for (const [seedModel, cakaj] of [[" ranger ", "Ranger"], ["RANGER", "Ranger"], ["Ranger ", "Ranger"]]) {
      const t = stranka({ typ: "produkt", seed: { ...FORD, Model: seedModel } });
      over(t.text(t.sel.model) === cakaj, `8) uložený model ${JSON.stringify(seedModel)} -> ${cakaj}`, t.auto());
    }
    const pe = stranka({ typ: "produkt", seed: { Brand: "Peugeot", Model: "3008", Year: "2020", carType: "SUV" } });
    over(pe.text(pe.sel.model) === "3008", "8) číselný model v data.json (Peugeot 3008)", pe.auto());
    const ly = stranka({ typ: "produkt", seed: { Brand: "Lynk & Co", Model: "Lynk & Co 03+", Year: "2022", carType: "SUV" } });
    over(ly.text(ly.sel.model) === "Lynk & Co 03+" && ly.text(ly.sel.znacka) === "Lynk & Co", "8) Lynk & Co (znak &)", ly.auto());
    const lx = stranka({ typ: "produkt", seed: { Brand: "Lexus", Model: "UX 200", Year: "2022", carType: "SUV" } });
    over(lx.sel.model.selectedIndex === 2, "8) duplicita Lexus UX 200 -> prvá zhoda", lx.sel.model.selectedIndex);
    const ine = stranka({ typ: "produkt", seed: { Brand: "Ford", Model: "Iné, prosím napíšte do poznámky", Year: "2020", carType: "SUV" } });
    over(ine.text(ine.sel.model) === "Jiné, prosím napište do poznámky", "8) model „Iné…“ (SK) sa nájde ako „Jiné…“ (CZ)", ine.auto());
    const nie = stranka({ typ: "produkt", seed: { Brand: "Ford", Model: "X5", Year: "2020", carType: "SUV", model: "Ford X5 2020 SUV" } });
    over(nie.sel.model.selectedIndex === 0 && nie.ss().Model === null && nie.ss().model === null, "8) model, ktorý značka nemá -> placeholder, Model a „model“ odstránené", nie.ss());
    const bez = stranka({ typ: "titulka", seed: { Brand: "Ford", Year: "2020", carType: "SUV" } });
    over([...bez.sel.model.options].some((o) => o.text === "Ranger"), "8) uložená značka bez modelu: zoznam modelov je naplnený (netreba znova vyberať značku)");
    // placeholdery uložené pôvodným saveModel (Brand="Značka", Year="Rok výroby", carType="Typ auta") nie sú auto
    const ph = stranka({ typ: "titulka", seed: { Brand: "Značka", Year: "Rok výroby", carType: "Typ auta" } });
    const pocet = (s, t) => [...s.options].filter((o) => o.text === t).length;
    over(pocet(ph.sel.znacka, "Značka") === 1 && pocet(ph.sel.rok, "Rok výroby") === 1 && pocet(ph.sel.typ, "Typ auta") === 1 &&
      ph.sel.znacka.options[ph.sel.znacka.selectedIndex].classList.contains("notselect"),
      "8) uložený placeholder (starý kód) sa neobnoví ako vybraná hodnota (žiadny duplicitný „Značka“)", ph.auto());
    const sel = { selectedIndex: 0, options: [{ text: "Model", classList: { contains: () => true } }], value: "Model" };
    over(L.lcdPlatnaHodnota(sel, ["Model"]) === null && L.lcdPlatnaHodnota(null) === null, "8) lcdPlatnaHodnota: placeholder / chýbajúci select -> null");
  }
}

// 10) inline úprava na rozcestníku (lcdRz.js): realny.value = …; dispatchEvent(change) — prestaví zoznam
{
  const t = stranka({ typ: "titulka", seed: FORD });
  t.sel.znacka.value = "BMW";
  t.sel.znacka.dispatchEvent(new t.w.Event("change", { bubbles: true }));
  await pauza(150);
  over([...t.sel.model.options].map((o) => o.text).includes("X5") && t.ss().Brand === "BMW" && t.ss().Model === null,
    "10) programová zmena značky (inline na rozcestníku) prestaví zoznam a uloží značku", t.ss());
}

// 13) história prehliadača (Späť/Dopredu): prehliadač nesmie do našich selectov vrátiť stav formulára z minulej
//     návštevy (značka Ford + zoznam modelov BMW -> Shoptet change zmazal model). autocomplete="off" to vypne.
{
  const t = stranka({ typ: "titulka", seed: FORD });
  const ac = Object.values(t.sel).map((s) => s.getAttribute("autocomplete"));
  over(ac.every((a) => a === "off"), '13) značka/model/rok/typ majú autocomplete="off" (Späť/Dopredu neobnoví starý stav formulára)', ac);
}

// 14) návrat z bfcache (pageshow persisted): DOM ostal ako pri odchode, storage medzitým zmenené inou stránkou
{
  const pageshow = (w, persisted) => {
    let e;
    try { e = new w.PageTransitionEvent("pageshow", { persisted }); } catch { e = new w.Event("pageshow"); Object.defineProperty(e, "persisted", { value: persisted }); }
    w.dispatchEvent(e);
  };
  const t = stranka({ typ: "produkt", seed: FORD });
  const BMW = { Brand: "BMW", Model: "X5", Year: "2020", carType: "SUV", model: "BMW X5 2020 SUV" };
  for (const [k, v] of Object.entries(BMW)) t.w.sessionStorage.setItem(k, v);
  pageshow(t.w, false);
  over(t.auto() === "Ford | Ranger | 2023 | Pick-UP", "14) pageshow bez bfcache (persisted=false) selecty nemení", t.auto());
  pageshow(t.w, true);
  over(t.auto() === "BMW | X5 | 2020 | SUV", "14) návrat z bfcache: selecty = najnovšie auto zo sessionStorage", t.auto());
  over([...t.sel.model.options].map((o) => o.text).join(",") === "Model,X3,X5,X5 M", "14) zoznam modelov patrí BMW",
    [...t.sel.model.options].map((o) => o.text));
  over(JSON.stringify(t.ss()) === JSON.stringify(BMW), "14) sessionStorage ostalo BMW X5 2020 SUV", t.ss());
  over(t.w.document.querySelector(".model-text").textContent === "BMW X5 2020 SUV", "14) banner .model-text = najnovšie auto",
    t.w.document.querySelector(".model-text").textContent);
  // storage s modelom, ktorý značka nemá -> placeholder, Model aj „model“ preč (ako pri štarte)
  for (const [k, v] of Object.entries({ ...FORD, Model: "X5", model: "Ford X5 2023 Pick-UP" })) t.w.sessionStorage.setItem(k, v);
  pageshow(t.w, true);
  over(t.text(t.sel.znacka) === "Ford" && t.sel.model.selectedIndex === 0 && t.ss().Model === null && t.ss().model === null && bezZlych(t.ss()),
    "14) bfcache + model, ktorý značka nemá: placeholder, Model a „model“ odstránené", { auto: t.auto(), ss: t.ss() });
}

if (zlyhania) { console.error(`\n${zlyhania} kontrol ZLYHALO (${REPO})`); process.exit(1); }
console.log(`\nVšetky kontroly OK (${REPO})`);
