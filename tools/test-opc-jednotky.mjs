#!/usr/bin/env node
// Jednotkové testy one page checkoutu (kniha OPC § 7.2) v jsdom, bez prehliadača a bez siete:
// brána (assets/js/opc/index.js), krok1Model nad zachytenými krokmi 1 (SK, CZ, dobierka, zmenené HTML), telo Step1Validate
// a CSRF (opc/sync.js), rozpoznanie odkazu na krok 1 (opc/kosik.js), súhrn Shoptetu a stavový stroj zmeny platby
// (opc/sync.js: suhrnInfo, volbaZoSuhrnu, vytvorSync — debounce, 1 súbežná, pokus, overenie), vzhľad sekcie
// (opc/vzhlad.js: poradie platieb, termín doručenia, ceny, sekcia Doprava a platba nad zachyteným krokom 1), položky súhrnu
// (opc/polozky.js: fotka, rozpis z košíka pod názvom, „Zobraziť viac“ A1, S42).
//   node tools/test-opc-jednotky.mjs
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { FIXTURES, vyzadujFixtures } from "./test-opc/zachytene.mjs";

vyzadujFixtures(["sk", "cz"]); // fixtures nie sú v gite (FIXTURES.md): bez nich hláška a exit 1

const dom = new JSDOM("<!doctype html><html><body class=\"id--9 in-kosik\"></body></html>", { url: "https://www.luxurycardesign.sk/kosik/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.sessionStorage = dom.window.sessionStorage;
globalThis.localStorage = dom.window.localStorage;
globalThis.location = dom.window.location;

const B = await import("../assets/js/opc/index.js");
const { krok1Model } = await import("../assets/js/opc/krok1Model.js");
const S = await import("../assets/js/opc/sync.js");
const { teloStep1, cestaKroku2, suhrnInfo, volbaZoSuhrnu, vytvorSync } = S;
const V = await import("../assets/js/opc/vzhlad.js");
const { TEXTY } = await import("../assets/js/opc/texty.js");
const K = await import("../assets/js/opc/kontrola.js");
const KO = await import("../assets/js/opc/kosik.js");
const { jeOdkazNaKrok1 } = KO;
const fx = (cesta) => readFileSync(join(FIXTURES, cesta), "utf8");

let ok = 0, zle = 0;
const asyncTesty = [];
const t = (n, f) => {
  try {
    const r = f();
    if (r && typeof r.then === "function") { asyncTesty.push(r.then(() => { ok++; console.log("OK   " + n); }, (e) => { zle++; console.log("FAIL " + n + " — " + e.message); })); return; }
    ok++; console.log("OK   " + n);
  } catch (e) { zle++; console.log("FAIL " + n + " — " + e.message); }
};
const cakaj = (ms) => new Promise((r) => setTimeout(r, ms));
// testy s podvrhnutým globálnym fetch bežia jeden po druhom (asynchrónne testy inak bežia súbežne)
let fetchRad = Promise.resolve();
const sFetchom = (f) => { const p = fetchRad.then(f); fetchRad = p.catch(() => {}); return p; };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m ? m + ": " : "") + JSON.stringify(a) + " ≠ " + JSON.stringify(b)); };

// ------------------------------------------------------------------ fixtures mimo gitu (VOP Shoptet 07/2026 čl. 11.3)
// Priečinok tools/test-opc/fixtures/ nie je v gite: keď chýba, každý spúšťač OPC skončí hláškou s návodom a exit 1 (nie
// pádom). Spustí sa s LCD_OPC_FIXTURES = neexistujúci priečinok; potomok s touto premennou túto kontrolu už nerobí.
if (!process.env.LCD_OPC_FIXTURES) {
  t("fixtures chýbajú: test-opc, snímky aj jednotky skončia hláškou (FIXTURES.md) a exit 1", () => {
    const koren = fileURLToPath(new URL("..", import.meta.url));
    const nie = join(tmpdir(), "lcd-opc-fixtures-nie-su-" + process.pid);
    const env = { ...process.env, LCD_OPC_FIXTURES: nie };
    for (const [nastroj, arg] of [["tools/test-opc.mjs", ["--krok", "S17", "--sirka", "1366"]], ["tools/test-opc-snimky.mjs", [join(nie, "snimky"), "--web", "sk", "--sirka", "390", "--stavy", "kosik"]], ["tools/test-opc-jednotky.mjs", []]]) {
      const r = spawnSync(process.execPath, [nastroj, ...arg], { cwd: koren, env, encoding: "utf8", timeout: 180000 });
      const vystup = String(r.stdout || "") + String(r.stderr || "");
      eq(r.status, 1, nastroj + " exit (výstup: " + vystup.slice(-200).replace(/\s+/g, " ") + ")");
      if (!/FIXTURES\.md/.test(vystup) || !/test-opc-zachyt\.mjs/.test(vystup)) throw new Error(nastroj + ": hláška bez návodu (FIXTURES.md, test-opc-zachyt.mjs): " + vystup.slice(0, 300));
      if (/TypeError|ENOENT|at file:/.test(vystup)) throw new Error(nastroj + ": pád namiesto hlášky: " + vystup.slice(0, 300));
    }
  });
}

// ------------------------------------------------------------------ brána
t("brána: SPUSTENE je false (bez flagu dnešný tok)", () => eq(B.SPUSTENE, false));
t("brána: tajný kód = 10 malých písmen/číslic, nie 1 ani 0", () => {
  eq([typeof B.KOD, /^[a-z0-9]{10}$/.test(B.KOD)], ["string", true], "KOD " + JSON.stringify(B.KOD));
});
const OPC = "?opc=" + B.KOD; // tajný odkaz (Michal 30. 10. 2026: živý test len preňho)
t("brána: ?opc=KÓD zapne v prehliadači (localStorage: všetky karty, aj po zatvorení), ?opc=0 vypne; ?opc=1 ani iná hodnota nič", () => {
  localStorage.clear(); sessionStorage.clear();
  B.prepinac("");
  eq(B.jeZapnute(), false, "bez flagu");
  for (const zla of ["?opc=1", "?opc=true", "?opc=" + B.KOD.toUpperCase(), "?opc=" + B.KOD + "x", "?opc=" + B.KOD.slice(1), "?xopc=" + B.KOD, "?opc="]) {
    B.prepinac(zla);
    eq([localStorage.getItem("lcdOpc"), sessionStorage.getItem("lcdOpc"), B.jeZapnute()], [null, null, false], zla + " nesmie nič zapnúť");
  }
  B.prepinac("?x=2&opc=" + B.KOD + "#a");
  eq([localStorage.getItem("lcdOpc"), sessionStorage.getItem("lcdOpc")], ["1", null], "kód -> localStorage (nie len karta)");
  eq(B.jeZapnute(), true, "kód");
  sessionStorage.clear(); // nová karta / nové okno prehliadača: sessionStorage prázdny, localStorage ostáva
  eq(B.jeZapnute(), true, "iná karta");
  B.prepinac("?opc=1"); // ?opc=1 zapnuté nevypne ani nezmení
  eq([localStorage.getItem("lcdOpc"), B.jeZapnute()], ["1", true], "?opc=1 po kóde");
  sessionStorage.setItem("lcdOpc", "1"); // starý flag karty (?opc=1 prototypu) / náhrada bez localStorage
  B.prepinac("?x=2&opc=0#a");
  eq([localStorage.getItem("lcdOpc"), sessionStorage.getItem("lcdOpc"), B.jeZapnute()], [null, null, false], "?opc=0 zmaže oboje");
});
t("brána: bez localStorage (súkromný režim, zakázané úložisko) kód zapne aspoň kartu (sessionStorage), ?opc=0 ju vypne", () => {
  const ls = globalThis.localStorage;
  sessionStorage.clear();
  const zly = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("QuotaExceededError"); }, removeItem() { throw new Error("SecurityError"); }, clear() {} };
  globalThis.localStorage = zly;
  try {
    eq(B.jeZapnute(), false, "bez flagu");
    B.prepinac(OPC);
    eq([sessionStorage.getItem("lcdOpc"), B.jeZapnute()], ["1", true], "kód -> sessionStorage");
    B.prepinac("?opc=0");
    eq([sessionStorage.getItem("lcdOpc"), B.jeZapnute()], [null, false], "?opc=0");
  } finally { globalThis.localStorage = ls; sessionStorage.clear(); }
});
t("brána: data.json \"opc\": false aj settings.opc === false", () => {
  eq(B.vypnuteVDatach({ opc: false }), true);
  eq(B.vypnuteVDatach({ settings: { opc: false } }), true);
  eq(B.vypnuteVDatach({ opc: true }), false);
  eq(B.vypnuteVDatach({}), false);
  eq(B.vypnuteVDatach(null), false);
});
t("brána: initOpc s data.json opc:false nezapíše flag ani globál (ani s kódom)", () => {
  sessionStorage.clear(); localStorage.clear();
  delete window.__lcdOpc;
  const s = window.location.search;
  dom.reconfigure({ url: "https://www.luxurycardesign.sk/kosik/" + OPC });
  try { eq(B.initOpc({ opc: false }), null); } finally { dom.reconfigure({ url: "https://www.luxurycardesign.sk/kosik/" + s }); }
  eq([sessionStorage.getItem("lcdOpc"), localStorage.getItem("lcdOpc")], [null, null]);
  eq(typeof window.__lcdOpc, "undefined");
});
t("brána: initOpc bez flagu nič (null, žiadny globál)", () => {
  sessionStorage.clear();
  delete window.__lcdOpc;
  eq(B.initOpc({}), null);
  eq(typeof window.__lcdOpc, "undefined");
});
t("stránka: košík, krok 2, iné nie", () => {
  const b = (c) => ({ classList: { contains: (x) => c.split(" ").includes(x) } });
  eq(B.stranka(b("desktop id--9 in-kosik")), "kosik");
  eq(B.stranka(b("mobile id--17 in-krok-2")), "krok2");
  eq(B.stranka(b("id--16 in-krok-1")), null);
  eq(B.stranka(b("type-product id-598")), null);
});

// ------------------------------------------------------------------ krok1Model
t("krok1Model SK: doprava 96, platby 6, predvolený prevod 5, relácie", () => {
  const m = krok1Model(fx("sk/krok1.html"));
  eq(m.ok, true);
  eq(m.akcia, "/action/orderingProcess/Step1Validate/");
  eq(m.jazyk, "sk");
  eq(m.zvolenaDoprava, "96");
  eq(m.zvolenaPlatba, "5");
  eq(m.doprava.map((d) => [d.id, d.cena, d.relacie.join(","), d.vydajneMiesto]), [["96", 5, "5,3,103,106,109,112", false]]);
  eq(m.platby.map((p) => p.id).sort(), ["103", "106", "109", "112", "3", "5"]);
  const dob = m.platby.find((p) => p.typ === "cashOnDelivery");
  eq([dob.id, dob.cena, dob.nazov], ["3", 3, "Dobierkou"]);
  eq(m.platby.find((p) => p.podmetoda === "pis").id, "112");
  eq(m.pole, [["language", "sk"], ["shippingId", "96"], ["billingId", "5"], ["gopayPayInstrument", ""]]);
});
t("krok1Model CZ: Expres Kurýr 111, dobírka 87 (50 Kč), language cs, bez rýchlej platby", () => {
  const m = krok1Model(fx("cz/krok1.html"));
  eq([m.ok, m.jazyk, m.zvolenaDoprava, m.zvolenaPlatba], [true, "cs", "111", "5"]);
  eq(m.doprava[0].cena, 150);
  const dob = m.platby.find((p) => p.typ === "cashOnDelivery");
  eq([dob.id, dob.cena], ["87", 50]);
  eq(m.platby.some((p) => p.podmetoda === "pis"), false);
});
t("krok1Model: po voľbe dobierky v session je zaškrtnutá dobierka (SK 3, CZ 87)", () => {
  eq(krok1Model(fx("sk/krok1-dobierka.html")).zvolenaPlatba, "3");
  eq(krok1Model(fx("cz/krok1-dobierka.html")).zvolenaPlatba, "87");
});
t("krok1Model fail-closed: zmenené HTML, bez platby, prázdne, nezmysel", () => {
  eq(krok1Model(fx("sk/krok1.html").replace(/Step1Validate/g, "Step1ValidateNovy")).dovod, "formular");
  eq(krok1Model(fx("sk/krok1.html").replace(/name="billingId"/g, 'name="platba"')).dovod, "volby");
  const bezZaskrtnutej = fx("sk/krok1.html").replace(/<input\b[^>]*name="billingId"[^>]*>/g, (x) => x.replace(/\s+checked(="checked")?/g, ""));
  eq(krok1Model(bezZaskrtnutej).dovod, "zvolene");
  eq(krok1Model("").ok, false);
  eq(krok1Model(null).ok, false);
});

// ------------------------------------------------------------------ Step1Validate
t("teloStep1: voľby nahradia zaškrtnuté, poradie polí ako formulár, bez CSRF keď je vypnuté", () => {
  const m = krok1Model(fx("sk/krok1.html"));
  window.shoptet = { csrf: { enabled: false, token: "x" } };
  eq(teloStep1(m, { shippingId: "96", billingId: "3" }).toString(), "language=sk&shippingId=96&billingId=3&gopayPayInstrument=");
});
t("teloStep1: zapnuté CSRF -> __csrf__ (S15)", () => {
  const m = krok1Model(fx("sk/krok1.html"));
  window.shoptet = { csrf: { enabled: true, token: "TOKEN123" } };
  const p = teloStep1(m, { shippingId: "96", billingId: "5" });
  eq(p.get("__csrf__"), "TOKEN123");
  delete window.shoptet;
});
t("teloStep1: model bez shippingId/billingId v poliach ich doplní", () => {
  eq(teloStep1({ pole: [["language", "cs"]] }, { shippingId: 111, billingId: 87 }).toString(), "language=cs&shippingId=111&billingId=87");
});
// ------------------------------------------------------------------ prísne kritérium Step1Validate (živý dôkaz 29. 10. 2026)
// úspech = code 303 + payload.returnUrl krok 2 na tom istom webe + messages bez errors; neplatná voľba vracia tiež 303
// (s errors a returnUrl krok 1) a v session zruší krok 1, bez session je code null (T7b)
const ORIGIN = "https://www.luxurycardesign.sk";
const ZIVY_OK = { code: 303, message: null, messages: [], payload: { returnUrl: ORIGIN + "/objednavka/krok-2/" } };
const ZIVY_NEPLATNE = { code: 303, message: null, messages: { errors: ["Prosím, vyberte si spôsob platby.", "Fakturačné alebo doručovacie údaje sú neplatné"] }, payload: { returnUrl: ORIGIN + "/objednavka/krok-1/" } };
t("Step1Validate prísne: živý úspech OK, živá neplatná voľba (303 + errors + krok 1) nie", () => {
  eq(S.vysledokStep1(ZIVY_OK, ORIGIN), { ok: true, ciel: "/objednavka/krok-2/" });
  const r = S.vysledokStep1(ZIVY_NEPLATNE, ORIGIN);
  eq([r.ok, r.typ, r.kod], [false, "chyby", 303]);
});
t("Step1Validate prísne: returnUrl krok 2, ale errors neprázdne (umelý prípad) -> neúspech", () => {
  const r = S.vysledokStep1({ ...ZIVY_OK, messages: { errors: ["Chyba"] } }, ORIGIN);
  eq([r.ok, r.typ], [false, "chyby"]);
  eq(S.vysledokStep1({ ...ZIVY_OK, messages: { errors: "Chyba" } }, ORIGIN).ok, false, "errors ako text");
  eq(S.vysledokStep1({ ...ZIVY_OK, messages: ["Chyba"] }, ORIGIN).ok, false, "neprázdne pole správ = neznámy tvar");
});
t("Step1Validate prísne: prázdne pole aj objekt bez errors = OK; code null / iný kód / cudzí web nie", () => {
  eq(S.vysledokStep1({ ...ZIVY_OK, messages: {} }, ORIGIN).ok, true, "{}");
  eq(S.vysledokStep1({ ...ZIVY_OK, messages: { errors: [] } }, ORIGIN).ok, true, "errors []");
  eq(S.vysledokStep1({ ...ZIVY_OK, messages: { notices: ["Uložené."] } }, ORIGIN).ok, true, "len notices");
  eq(S.vysledokStep1({ code: null, message: null, messages: null, payload: { returnUrl: "" } }, ORIGIN).typ, "kod", "bez session (T7b)");
  eq(S.vysledokStep1({ ...ZIVY_OK, code: 200 }, ORIGIN).typ, "kod");
  eq(S.vysledokStep1({ ...ZIVY_OK, payload: { returnUrl: "https://www.luxurycardesign.cz/objednavka/krok-2/" } }, ORIGIN).typ, "ciel");
  eq(S.vysledokStep1(null, ORIGIN).ok, false);
});
t("posliStep1: 303 s errors zo servera -> { ok: false, typ: chyby } (fetch podvrhnutý)", () => sFetchom(async () => {
  const m = krok1Model(fx("sk/krok1.html"));
  const povodny = globalThis.fetch;
  const odpovede = [ZIVY_NEPLATNE, { ...ZIVY_OK, messages: { errors: ["x"] } }, ZIVY_OK];
  globalThis.fetch = () => Promise.resolve(new Response(JSON.stringify(odpovede.shift()), { status: 200, headers: { "Content-Type": "application/json" } }));
  try {
    const a = await S.posliStep1(m, { shippingId: "96", billingId: "87" });
    const b = await S.posliStep1(m, { shippingId: "96", billingId: "3" });
    const c = await S.posliStep1(m, { shippingId: "96", billingId: "3" });
    eq([a.ok, a.typ, b.ok, b.typ, c.ok, c.ciel], [false, "chyby", false, "chyby", true, "/objednavka/krok-2/"]);
  } finally { globalThis.fetch = povodny; }
}));
t("cestaKroku2: len krok 2 na tom istom webe", () => {
  const o = "https://www.luxurycardesign.sk";
  eq(cestaKroku2("https://www.luxurycardesign.sk/objednavka/krok-2/", o), "/objednavka/krok-2/");
  eq(cestaKroku2("/objednavka/krok-2/", o), "/objednavka/krok-2/");
  eq(cestaKroku2("https://www.luxurycardesign.cz/objednavka/krok-2/", o), null);
  eq(cestaKroku2("https://zly.example/objednavka/krok-2/", o), null);
  eq(cestaKroku2("/objednavka/krok-1/", o), null);
  eq(cestaKroku2(null, o), null);
});
t("jeOdkazNaKrok1: Pokračovať, lišta, krok v hlavičke; iné nie", () => {
  const o = "https://www.luxurycardesign.sk";
  const a = (h) => ({ getAttribute: () => h });
  eq(jeOdkazNaKrok1(a("/objednavka/krok-1/"), o), true);
  eq(jeOdkazNaKrok1(a("https://www.luxurycardesign.sk/objednavka/krok-1/"), o), true);
  eq(jeOdkazNaKrok1(a("/objednavka/krok-1"), o), true);
  eq(jeOdkazNaKrok1(a("/objednavka/krok-2/"), o), false);
  eq(jeOdkazNaKrok1(a("https://www.luxurycardesign.cz/objednavka/krok-1/"), o), false);
  eq(jeOdkazNaKrok1(a("#"), o), false);
  eq(jeOdkazNaKrok1(null, o), false);
});

// ------------------------------------------------------------------ krok1Model: označenie na klon
t("krok1Model: logo, text ceny a označenie .radio-wrapper pri doprave aj platbe", () => {
  const m = krok1Model(fx("sk/krok1.html"));
  const d = m.doprava[0];
  eq([/dpd-classic/.test(d.logo), d.cenaText, /^<div[^>]*radio-wrapper/.test(d.html), /name="shippingId"/.test(d.html)], [true, "€5", true, true]);
  const dob = m.platby.find((p) => p.id === "3");
  eq([/dpd-dobirka/.test(dob.logo), dob.cenaText, /data-payment-type="cashOnDelivery"/.test(dob.html)], [true, "€3", true]);
  eq(m.platby.find((p) => p.id === "5").cenaText, "ZADARMO");
});

// ------------------------------------------------------------------ súhrn Shoptetu
t("suhrnInfo: doprava, platba, ceny a celkom zo súhrnu (SK dobierka, CZ dobírka)", () => {
  const sk = suhrnInfo(fx("sk/suhrn-3.html"));
  eq([sk.doprava, sk.dopravaCena, sk.platba, sk.platbaCena, sk.celkom, sk.tovar, sk.polozky.length], ["Expres kurier DPD", "€5", "Dobierkou", "€3", "€13", "€5", 1]);
  const cz = suhrnInfo(fx("cz/suhrn-87.html"));
  eq([cz.doprava, cz.platba, cz.platbaCena, cz.celkom], ["Expres Kurýr", "Dobírka", "50 Kč", "300 Kč"]);
  eq(suhrnInfo("<h2>nič</h2>"), null);
  eq(suhrnInfo(null), null);
});
t("suhrnInfo: položka setu má názov bez variantu a príplatkov", () => {
  const s = suhrnInfo(fx("sk-set/suhrn-5.html"));
  eq(s.polozky[0].nazov, "luxusné autokoberce Dragonskin Basic DIAMOND LINE");
});
t("volbaZoSuhrnu: názvy zo súhrnu -> id z kroku 1; neznámy názov -> null", () => {
  const m = krok1Model(fx("sk/krok1.html"));
  eq(volbaZoSuhrnu(m, suhrnInfo(fx("sk/suhrn-3.html"))), { doprava: "96", platba: "3" });
  eq(volbaZoSuhrnu(m, suhrnInfo(fx("sk/suhrn-103.html"))), { doprava: "96", platba: "103" });
  eq(volbaZoSuhrnu(m, { doprava: "Expres kurier DPD", platba: "Bitcoin" }), null);
  const c = krok1Model(fx("cz/krok1.html"));
  eq(volbaZoSuhrnu(c, suhrnInfo(fx("cz/suhrn-87.html"))), { doprava: "111", platba: "87" });
});
// ------------------------------------------------------------------ potvrdenie voľby cez GET kroku 1 (živý dôkaz 29. 10.)
// step2CustomerAjax naživo vracia payload [] (žiadne HTML) -> potvrdenie z kroku 1: zaškrtnuté rádiá = session, #summary-box
// kroku 1 = položky + celkom za tovar + celkom k úhrade (po Step1Validate s dopravou a platbou, krok1-dobierka.html)
const boxZ = (html) => new JSDOM(html).window.document.getElementById("summary-box");
const sablonaK2 = (web) => new JSDOM("<div id=summary-box>" + fx(web + "/suhrn-5.html") + "</div>").window.document.getElementById("summary-box");
const MENA = { sk: { symbol: "€", vlavo: true, tisice: " " }, cz: { symbol: "Kč", vlavo: false, tisice: " " } };
t("suhrnKroku1: krok 1 po Step1Validate má položky, celkom za tovar a celkom k úhrade (SK €13, CZ 300 Kč)", () => {
  const sk = V.suhrnKroku1(boxZ(fx("sk/krok1-dobierka.html")));
  eq([sk.celkom, sk.tovar, sk.polozky], ["€13", "€5", 1]);
  const cz = V.suhrnKroku1(boxZ(fx("cz/krok1-dobierka.html")));
  eq([cz.celkom, cz.tovar], ["300 Kč", "100 Kč"]);
  eq(V.suhrnKroku1(null), null);
  eq(V.suhrnKroku1(new JSDOM("<div id=summary-box><h2>x</h2></div>").window.document.getElementById("summary-box")), null);
});
t("zlozSuhrn: krok 1 + riadky dopravy a platby zo šablóny = súhrn kroku 2 zo servera (SK dobierka, CZ dobírka)", () => {
  for (const [web, platba, vzor] of [["sk", "3", "sk/suhrn-3.html"], ["cz", "87", "cz/suhrn-87.html"]]) {
    const html1 = fx(web + "/krok1-dobierka.html");
    const m = krok1Model(html1);
    const h = V.zlozSuhrn(boxZ(html1), sablonaK2(web), m, { doprava: m.zvolenaDoprava, platba }, MENA[web]);
    const a = suhrnInfo(h), b = suhrnInfo(fx(vzor));
    eq([a.doprava, a.dopravaCena, a.platba, a.platbaCena, a.celkom, a.tovar, a.polozky.length], [b.doprava, b.dopravaCena, b.platba, b.platbaCena, b.celkom, b.tovar, b.polozky.length], web);
    eq(/data-price-total-wv/.test(h), false, web + ": atribúty kroku 1 pri sume");
    eq(h.indexOf("recapPaymentMethod") < h.indexOf("recapFullPrice"), true, web + ": riadky pred „Celkom k úhrade“");
  }
});
t("zlozSuhrn: šablóna bez riadkov dopravy a platby / krok 1 bez súhrnu -> null (záloha GET krok 2)", () => {
  const html1 = fx("sk/krok1-dobierka.html");
  const m = krok1Model(html1);
  const prazdna = new JSDOM("<div id=summary-box><h2>x</h2></div>").window.document.getElementById("summary-box");
  eq(V.zlozSuhrn(boxZ(html1), prazdna, m, { doprava: "96", platba: "3" }, MENA.sk), null);
  eq(V.zlozSuhrn(null, sablonaK2("sk"), m, { doprava: "96", platba: "3" }, MENA.sk), null);
  eq(V.zlozSuhrn(boxZ(html1), sablonaK2("sk"), m, { doprava: "96", platba: "999" }, MENA.sk), null);
});
t("potvrdenieZKroku1: voľba zo zaškrtnutých rádií + súhrn; set aj kamión; session bez dopravy (suma = tovar) -> záloha", () => {
  const p = V.potvrdenieZKroku1(fx("sk/krok1-dobierka.html"), sablonaK2("sk"), MENA.sk);
  eq([p.ok, p.volby, p.info.platba, p.info.celkom, p.zdroj], [true, { doprava: "96", platba: "3" }, "Dobierkou", "€13", "krok1"]);
  const cz = V.potvrdenieZKroku1(fx("cz/krok1-dobierka.html"), sablonaK2("cz"), MENA.cz);
  eq([cz.ok, cz.volby.platba, cz.info.celkom], [true, "87", "300 Kč"]);
  // krok1.html je zachytený PRED Step1Validate: celkom k úhrade = len tovar (€5), doprava €5 nie je započítaná
  const bez = V.potvrdenieZKroku1(fx("sk/krok1.html"), sablonaK2("sk"), MENA.sk);
  eq([bez.ok, bez.typ], [false, "krok1-bez-volby"]);
  eq(V.potvrdenieZKroku1(fx("sk/krok1.html").replace(/Step1Validate/g, "X"), sablonaK2("sk"), MENA.sk).ok, false, "zmenené HTML");
  for (const k of ["sk-set", "sk-kamion"]) {
    const h = fx(k + "/krok1.html").replace(/(data-testid="recapFullPrice">)[^<]*/, (x, a) => a + suhrnInfo(fx(k + "/suhrn-5.html")).celkom);
    const r = V.potvrdenieZKroku1(h, new JSDOM("<div id=summary-box>" + fx(k + "/suhrn-5.html") + "</div>").window.document.getElementById("summary-box"), MENA.sk);
    eq([r.ok, r.info && r.info.polozky.length, r.info && r.info.celkom], [true, suhrnInfo(fx(k + "/suhrn-5.html")).polozky.length, suhrnInfo(fx(k + "/suhrn-5.html")).celkom], k);
  }
});
t("nacitajKrok1: GET /objednavka/krok-1/ (presmerovanie na košík = stránka, limit -> limit), bez step2CustomerAjax", () => sFetchom(async () => {
  const povodny = globalThis.fetch;
  const volania = [];
  try {
    globalThis.fetch = (u, i) => { volania.push(String(u) + " " + ((i && i.method) || "GET")); return Promise.resolve({ ok: true, status: 200, url: "https://www.luxurycardesign.sk/objednavka/krok-1/", text: () => Promise.resolve("<html>k1</html>") }); };
    const a = await S.nacitajKrok1();
    globalThis.fetch = () => Promise.resolve({ ok: true, status: 200, url: "https://www.luxurycardesign.sk/kosik/", text: () => Promise.resolve("") });
    const b = await S.nacitajKrok1();
    globalThis.fetch = () => new Promise(() => {});
    const c = await S.nacitajKrok1(50);
    eq([a.ok, a.html, b.ok, b.typ, c.ok, c.typ], [true, "<html>k1</html>", false, "stranka", false, "limit"]);
    eq(volania, ["/objednavka/krok-1/ GET"]);
    eq([S.LIMIT_KROK1_MS, typeof S.CESTA_SUHRNU, typeof S.teloSuhrnu], [4000, "undefined", "undefined"], "step2CustomerAjax preč");
  } finally { globalThis.fetch = povodny; }
}));

// ------------------------------------------------------------------ stavový stroj (§ 6.5)
function sync(o = {}) {
  const log = { posli: [], potvrd: 0, stavy: [] };
  let server = { doprava: "96", platba: "5" };
  const s = vytvorSync({
    zvolene: { doprava: "96", platba: "5" }, debounce: 40, pokusMs: 20,
    posli: (v) => { log.posli.push(v.platba); const r = o.posli ? o.posli(v, log) : { ok: true }; return Promise.resolve(r).then((x) => { if (x.ok && !o.serverIgnoruje) server = { ...v }; return new Promise((res) => setTimeout(() => res(x), o.ms || 10)); }); },
    potvrd: () => { log.potvrd++; return Promise.resolve(o.potvrd ? o.potvrd(server) : { ok: true, volby: server, html: "<x>" }); },
    naZmenu: (stav, d) => log.stavy.push(stav + ":" + (d.volby && d.volby.platba)),
  });
  return { s, log, server: () => server };
}
t("sync: zmena -> meni-sa hneď, po debounce 1 požiadavka, súhrn sedí -> potvrdene", async () => {
  const { s, log } = sync();
  s.zvol({ doprava: "96", platba: "3" });
  eq([s.stav(), s.mozeOdoslat(), log.posli.length], ["meni-sa", false, 0]);
  eq(await s.pripravene(2000), "potvrdene");
  eq([log.posli, log.potvrd, s.potvrdene(), s.mozeOdoslat()], [["3"], 1, { doprava: "96", platba: "3" }, true]);
});
t("sync: rýchle kliky 103 -> 109 v debounce = 1 požiadavka s 109", async () => {
  const { s, log } = sync();
  s.zvol({ doprava: "96", platba: "103" });
  await cakaj(10);
  s.zvol({ doprava: "96", platba: "109" });
  eq(await s.pripravene(2000), "potvrdene");
  eq(log.posli, ["109"]);
});
t("sync: späť na potvrdenú voľbu v debounce = 0 požiadaviek", async () => {
  const { s, log } = sync();
  s.zvol({ doprava: "96", platba: "103" });
  s.zvol({ doprava: "96", platba: "5" });
  eq(s.stav(), "potvrdene");
  await cakaj(120);
  eq([log.posli.length, s.stav()], [0, "potvrdene"]);
});
t("sync: naraz najviac 1 požiadavka, novšia voľba ide po dokončení letiacej", async () => {
  const { s, log } = sync({ ms: 150 });
  s.zvol({ doprava: "96", platba: "103" });
  await cakaj(80); // 103 letí
  s.zvol({ doprava: "96", platba: "3" });
  eq(await s.pripravene(3000), "potvrdene");
  eq([log.posli, s.statistika().maxSucasne, s.potvrdene().platba], [["103", "3"], 1, "3"]);
});
t("sync: Step1Validate 500 -> 1 pokus, server má pôvodnú -> chyba overená, voľba späť, odoslať sa smie (S5)", async () => {
  const { s, log } = sync({ posli: () => ({ ok: false, typ: "kod", kod: 500 }) });
  s.zvol({ doprava: "96", platba: "3" });
  eq(await s.pripravene(3000), "chyba");
  eq([log.posli, s.vybrane().platba, s.potvrdene().platba, s.overene(), s.mozeOdoslat(), s.typ()], [["3", "3"], "5", "5", true, true, "kod"]);
});
t("sync: Step1Validate odmietnutý (303 + errors) -> bez automatického pokusu, chyba overená zo servera", async () => {
  const { s, log } = sync({ posli: () => ({ ok: false, typ: "chyby", kod: 303 }) });
  s.zvol({ doprava: "96", platba: "3" });
  eq(await s.pripravene(3000), "chyba");
  eq([log.posli, s.vybrane().platba, s.overene(), s.typ()], [["3"], "5", true, "chyby"]);
});
t("sync: časový limit -> bez pokusu; server medzitým zmenu prijal -> potvrdene", async () => {
  const { s, log } = sync({ posli: () => ({ ok: false, typ: "limit" }), potvrd: () => ({ ok: true, volby: { doprava: "96", platba: "3" } }) });
  s.zvol({ doprava: "96", platba: "3" });
  eq(await s.pripravene(3000), "potvrdene");
  eq([log.posli.length, s.potvrdene().platba], [1, "3"]);
});
t("sync: chyba a súhrn sa nedá overiť -> chyba neoverená, odoslanie stojí", async () => {
  const { s } = sync({ posli: () => ({ ok: false, typ: "siet" }), potvrd: () => ({ ok: false, typ: "siet" }) });
  s.zvol({ doprava: "96", platba: "103" });
  eq(await s.pripravene(3000), "chyba");
  eq([s.overene(), s.mozeOdoslat(), s.vybrane().platba], [false, false, "5"]);
});
t("sync: 303, ale súhrn ukazuje inú platbu (nezhoda) -> chyba, platí to, čo má server", async () => {
  const { s } = sync({ serverIgnoruje: true });
  s.zvol({ doprava: "96", platba: "103" });
  eq(await s.pripravene(3000), "chyba");
  eq([s.typ(), s.potvrdene().platba, s.vybrane().platba, s.mozeOdoslat()], ["nezhoda", "5", "5", true]);
});
t("sync: po chybe nová voľba funguje; záchrana zastaví všetko", async () => {
  let zle = true;
  const { s, log } = sync({ posli: () => (zle ? { ok: false, typ: "kod", kod: 500 } : { ok: true }) });
  s.zvol({ doprava: "96", platba: "3" });
  eq(await s.pripravene(3000), "chyba");
  zle = false;
  s.zvol({ doprava: "96", platba: "3" });
  eq(await s.pripravene(3000), "potvrdene");
  eq(log.posli.length, 3);
  s.zachrana("test");
  s.zvol({ doprava: "96", platba: "103" });
  eq([s.stav(), s.mozeOdoslat(), log.posli.length], ["zachrana", true, 3]);
});

t("sync: zámok pri odoslaní (T3-L7) — zvol ani overZnova nič nepošlú, po odomknutí zmena funguje", async () => {
  const { s, log } = sync();
  s.zamkni(true);
  s.zvol({ doprava: "96", platba: "3" });
  eq([s.stav(), s.vybrane().platba, s.overZnova(), s.zamknute()], ["potvrdene", "5", false, true]);
  await cakaj(120);
  eq([log.posli.length, log.potvrd], [0, 0]);
  s.zamkni(false);
  s.zvol({ doprava: "96", platba: "3" });
  eq(await s.pripravene(2000), "potvrdene");
  eq([log.posli, s.potvrdene().platba], [["3"], "3"]);
});
t("sync: prevezmi — voľba a súhrn zo servera po resyncu (iné okno) bez Step1Validate", () => {
  const stavy = [];
  const s = vytvorSync({ zvolene: { doprava: "96", platba: "5" }, posli: () => Promise.resolve({ ok: true }), potvrd: () => Promise.resolve({ ok: false }),
    naZmenu: (st, d) => stavy.push([st, d.potvrdene.platba, d.html || null, d.prevzate === true]) });
  s.prevezmi({ doprava: "96", platba: "3" }, "<suhrn-3>", null);
  // prevzate: voľbu nezmenil zákazník v tejto karte -> krok2.js nepošle add_payment_info (opc/analytika.js zname)
  eq([s.stav(), s.potvrdene(), s.vybrane().platba, s.overene(), s.mozeOdoslat(), stavy], ["potvrdene", { doprava: "96", platba: "3" }, "3", true, true, [["potvrdene", "3", "<suhrn-3>", true]]]);
});

// ------------------------------------------------------------------ vzhľad
t("ceny: číslo z textu Shoptetu a späť podľa meny webu", () => {
  eq([V.cisloZCeny("€13"), V.cisloZCeny("1 269 Kč"), V.cisloZCeny("€5,50"), V.cisloZCeny("ZADARMO"), V.cisloZCeny(""), V.cisloZCeny("€1\u00a0269")], [13, 1269, 5.5, null, null, 1269]);
  const sk = { symbol: "€", vlavo: true, tisice: " " }, cz = { symbol: "Kč", vlavo: false, tisice: " " };
  eq([V.cenaText(13, sk), V.cenaText(1269, sk), V.cenaText(5.5, sk), V.cenaText(300, cz), V.cenaText(5664, cz)], ["€13", "€1 269", "€5,50", "300 Kč", "5 664 Kč"]);
});
t("poradie platieb: prevod navrchu, karta, Apple Pay, Google Pay, rýchla platba, dobierka (SK aj CZ)", () => {
  eq(V.zoradPlatby(krok1Model(fx("sk/krok1.html")).platby).map((p) => p.id), ["5", "103", "106", "109", "112", "3"]);
  eq(V.zoradPlatby(krok1Model(fx("cz/krok1.html")).platby).map((p) => p.id), ["5", "114", "117", "120", "87"]);
  eq(V.zoradPlatby([{ id: "9", typ: "gopay" }, { id: "5", typ: "transfer" }]).map((p) => p.id), ["5", "9"]);
});
t("druh košíka: vzorky, kamión, koberce (zmes = koberce)", () => {
  eq(V.druhKosika(["Vzorkovník Dragonskin – objednávka vzoriek"]), "vzorky");
  eq(V.druhKosika(["luxusné autokoberce do kamiónov DAF"]), "kamion");
  eq(V.druhKosika(["Luxusní autokoberce do kamionu MAN"]), "kamion");
  eq(V.druhKosika(["luxusné autokoberce Dragonskin Basic DIAMOND LINE"]), "koberce");
  eq(V.druhKosika(["luxusné autokoberce do kamiónov DAF", "luxusné autokoberce Dragonskin Basic DIAMOND LINE"]), "koberce");
  eq(V.druhKosika(["Vzorkovník Dragonskin – objednávka vzoriek", "luxusné autokoberce do kamiónov DAF"]), "kamion");
  eq(V.druhKosika([]), null);
});
t("termín doručenia bez dátumov (Michal 29. 10.): „do 21–29 dní“, kamión 14–25, vzorky a poukážka bez termínu", () => {
  const k = V.terminDorucenia("koberce");
  eq(k, { od: 21, po: 29 });
  eq(TEXTY.sk.termin(k.od, k.po), "Doručenie do 21–29\u00a0dní");
  eq(TEXTY.cz.termin(k.od, k.po), "Doručení do 21–29\u00a0dnů");
  const c = V.terminDorucenia("kamion");
  eq([TEXTY.sk.termin(c.od, c.po), TEXTY.cz.termin(c.od, c.po)], ["Doručenie do 14–25\u00a0dní", "Doručení do 14–25\u00a0dnů"]);
  eq([V.terminDorucenia("vzorky"), V.terminDorucenia(null)], [null, null]);
  const t2 = TEXTY.sk.termin(21, 29) + " " + TEXTY.cz.termin(21, 29);
  eq([/\d+\.\s?\d+\./.test(t2), /medzi|mezi/.test(t2)], [false, false], "bez dátumu");
});
t("texty: položky 1/2/5 SK aj CZ", () => {
  eq([TEXTY.sk.polozky(1), TEXTY.sk.polozky(3), TEXTY.sk.polozky(5)], ["1 položka", "3 položky", "5 položiek"]);
  eq(TEXTY.cz.polozky(7), "7 položek");
});
function sekcia(web, o = {}) {
  const d = new JSDOM("<!doctype html><html><body><form id='order-form'></form></body></html>").window.document;
  const m = krok1Model(fx(web + "/krok1.html"));
  const el = V.vykresliSekciu(d, m, TEXTY[web], { volby: { doprava: m.zvolenaDoprava, platba: m.zvolenaPlatba }, applePay: false, termin: null, ...o });
  d.getElementById("order-form").appendChild(el);
  return { d, el, m };
}
t("sekcia SK: rádiá klon Shoptetu s form=lcd-opc-nic, prevod zvolený, poradie, Apple Pay len keď je dostupná", () => {
  const { el } = sekcia("sk");
  const r = [...el.querySelectorAll('input[type="radio"]')];
  eq(r.every((i) => i.getAttribute("form") === "lcd-opc-nic"), true, "form=lcd-opc-nic");
  eq(r.filter((i) => i.name === "shippingId").map((i) => i.value), ["96"]);
  eq(r.filter((i) => i.name === "billingId").map((i) => i.value), ["5", "103", "109", "3"], "bez Apple Pay a bez rýchlej platby ako rádia");
  eq(r.filter((i) => i.checked).map((i) => i.value), ["96", "5"]);
  eq(!!el.querySelector('label[for="billingId-3"] .shipping-billing-name'), true, "input -> label -> názov (lcdDobierkaZaloha)");
  eq(el.querySelector('input[value="3"]').nextElementSibling.tagName, "LABEL");
  eq(sekcia("sk", { applePay: true }).el.querySelectorAll('input[name="billingId"]').length, 5);
});
t("sekcia SK: rýchla platba cez banku = odkaz na krok 1 (bez rádia), dobierka s poučením o zálohe", () => {
  const { el } = sekcia("sk");
  const a = el.querySelector('[data-submethod="pis"] a[href="/objednavka/krok-1/"]');
  eq(!!a, true, "odkaz Vybrať banku");
  eq(el.querySelector('[data-submethod="pis"] input'), null);
  const zal = el.querySelector('input[value="3"] + label .lcd-opc-zaloha-info');
  eq(/50\s%/.test(zal.textContent) && /zálohovú faktúru/.test(zal.textContent), true, "záloha 50 % podľa VOP 4.13");
  const a2 = zal.querySelector("a");
  eq([a2.getAttribute("href"), a2.getAttribute("target"), a2.textContent], ["/obchodne-podmienky/", "_blank", "podľa obchodných podmienok, bod 4.13"]);
});
t("sekcia: zvolená rýchla platba (z kroku 1) = riadok ako zvolený, zmena banky odkazom", () => {
  const { el } = sekcia("sk", { volby: { doprava: "96", platba: "112" } });
  const w = el.querySelector('[data-submethod="pis"]');
  eq([w.classList.contains("active"), /Banku máte vybranú/.test(w.textContent), el.querySelectorAll('input[name="billingId"]:checked').length], [true, true, 0]);
});
t("sekcia: platba mimo relácií dopravy je sivá a nedá sa zvoliť (text Shoptetu)", () => {
  const m = krok1Model(fx("sk/krok1.html"));
  m.doprava[0].relacie = ["5", "103"];
  const d = new JSDOM("<!doctype html><body></body>").window.document;
  const el = V.vykresliSekciu(d, m, TEXTY.sk, { volby: { doprava: "96", platba: "5" }, applePay: false });
  const dob = el.querySelector('input[value="3"]');
  eq([dob.disabled, dob.nextElementSibling.classList.contains("inactive"), /nie je možná/.test(dob.nextElementSibling.textContent)], [true, true, true]);
});
t("sekcia: termín pri doprave, CZ texty a poradie", () => {
  const { el } = sekcia("cz", { termin: V.terminDorucenia("koberce") });
  eq(el.querySelector(".lcd-opc-termin").textContent, "Doručení do 21–29\u00a0dnů");
  eq([...el.querySelectorAll("h2")].map((h) => h.textContent), ["Doprava", "Platba"]);
  eq([...el.querySelectorAll('input[name="billingId"]')].map((i) => i.value), ["5", "114", "120", "87"]);
  const zal = el.querySelector('input[value="87"] + label .lcd-opc-zaloha-info');
  eq(/50\s%/.test(zal.textContent) && /zálohovou fakturu/.test(zal.textContent), true, "záloha 50 % podle VOP 4.13");
  eq([zal.querySelector("a").getAttribute("href"), zal.querySelector("a").textContent], ["/obchodni-podminky/", "podle obchodních podmínek, bod 4.13"]);
});
t("nastavVolby: zaškrtne rádiá a označí aktívne riadky", () => {
  const { el } = sekcia("sk");
  V.nastavVolby(el, { doprava: "96", platba: "3" });
  eq([el.querySelector('input[value="3"]').checked, el.querySelector('input[value="5"]').checked], [true, false]);
  eq(el.querySelector('input[value="3"]').closest(".radio-wrapper").classList.contains("active"), true);
  eq(el.querySelector('input[value="5"]').closest(".radio-wrapper").classList.contains("active"), false);
});

// ------------------------------------------------------------------ revízia 29. 10. (R2, overenie, texty, tovar na mieru)
t("sync: návrat na potvrdenú voľbu počas letu + potvrdenie súhrnu zlyhá -> neodoslať s inou platbou (R2)", async () => {
  const { s, log, server } = sync({ ms: 80, potvrd: () => ({ ok: false, typ: "siet" }) });
  s.zvol({ doprava: "96", platba: "3" });
  await cakaj(60); // debounce 40 ms -> Step1Validate(3) letí, session už má 3
  s.zvol({ doprava: "96", platba: "5" }); // späť na pôvodnú počas letu
  await s.pripravene(3000);
  await cakaj(30);
  eq(s.mozeOdoslat() && server().platba !== s.vybrane().platba, false, "objednávka by odišla s " + server().platba + ", zákazník vidí " + s.vybrane().platba);
  eq([s.stav(), s.overene(), log.posli], ["chyba", false, ["3", "5"]]);
});
t("sync: medzivetva so známym súhrnom -> konečný stav nesie HTML voľby, ktorú session naozaj má", async () => {
  let n = 0;
  const server = { doprava: "96", platba: "5" };
  const stavy = [];
  const s = vytvorSync({
    zvolene: { doprava: "96", platba: "5" }, debounce: 20, pokusMs: 10,
    posli: (v) => new Promise((r) => setTimeout(() => { if (v.platba === "103") return r({ ok: false, typ: "kod", kod: 500 }); server.platba = v.platba; r({ ok: true }); }, 40)),
    potvrd: () => Promise.resolve(n++ === 0 ? { ok: true, volby: { ...server }, html: "<suhrn-" + server.platba + ">" } : { ok: false, typ: "siet" }),
    naZmenu: (stav, d) => stavy.push([stav, d.volby && d.volby.platba, d.html || null]),
  });
  s.zvol({ doprava: "96", platba: "3" });
  await cakaj(35); // 3 letí
  s.zvol({ doprava: "96", platba: "103" });
  eq(await s.pripravene(3000), "chyba");
  const posledny = stavy[stavy.length - 1];
  eq([s.potvrdene().platba, s.vybrane().platba, s.overene(), posledny], ["3", "3", false, ["chyba", "3", "<suhrn-3>"]]);
});
t("sync: overZnova — server má potvrdenú voľbu -> potvrdene; server má inú -> chyba overená, UI na voľbu servera", async () => {
  let server = { doprava: "96", platba: "5" };
  const s = vytvorSync({
    zvolene: { doprava: "96", platba: "5" }, debounce: 20, pokusMs: 10,
    posli: () => Promise.resolve({ ok: true }),
    potvrd: () => Promise.resolve({ ok: true, volby: { ...server }, html: "<x>" }),
  });
  eq(s.overZnova(), true);
  eq([s.stav(), s.mozeOdoslat()], ["meni-sa", false]);
  eq(await s.pripravene(2000), "potvrdene");
  server = { doprava: "96", platba: "3" }; // napr. neskorá odpoveď Shoptetu prepísala súhrn
  s.overZnova();
  eq(await s.pripravene(2000), "chyba");
  eq([s.overene(), s.vybrane().platba, s.potvrdene().platba, s.mozeOdoslat()], [true, "3", "3", true]);
});
t("texty: hláška pri chybe platby povie, ktorá platba ostala (SK aj CZ)", () => {
  eq(/Prevodom/.test(TEXTY.sk.chybaPlatby("Prevodom")), true);
  eq(/Převodem/.test(TEXTY.cz.chybaPlatby("Převodem")), true);
  eq([/stránke Doprava a platba/.test(TEXTY.sk.chybaPlatbyOdkaz + TEXTY.sk.bankaPopis), /stránce Doprava a platba/.test(TEXTY.cz.chybaPlatbyOdkaz + TEXTY.cz.bankaPopis)], [false, false]);
});
t("tovar na mieru (riadok o odstúpení): sety, rohože a kamióny áno, samotný box, vzorky a poukážka nie", () => {
  eq(V.naMieru(["luxusné autokoberce Dragonskin Basic DIAMOND LINE"]), true);
  eq(V.naMieru(["Rohož do kufra Premium"]), true);
  eq(V.naMieru(["luxusné autokoberce do kamiónov DAF"]), true);
  eq(V.naMieru(["Luxusní autokoberce do kamionu MAN"]), true);
  eq(V.naMieru(["Box do kufra"]), false);
  eq(V.naMieru(["Box do kufra", "Vzorkovník Dragonskin – objednávka vzoriek"]), false);
  eq(V.naMieru(["Darčeková poukážka"]), false);
  eq(V.naMieru(["Box do kufra", "Rohož do kufra Classic"]), true);
  eq(V.naMieru([]), false);
});

// ------------------------------------------------------------------ analytika (živý dôkaz T9a, T12: begin_checkout, add_payment_info)
const A = await import("../assets/js/opc/analytika.js");
t("analytika: begin_checkout z inline skriptu kroku 1 (SK aj CZ, set, kamión)", () => {
  const sk = A.payloadUdalosti(fx("sk/krok1.html"), "begin_checkout");
  eq([sk.send_to, sk.currency, sk.content_group, sk.items[0].item_id, sk.value > 4 && sk.value < 4.1], ["GA4", "EUR", "billingAndShipping", "VZORKY-DRAGONSKIN", true]);
  const cz = A.payloadUdalosti(fx("cz/krok1.html"), "begin_checkout");
  eq([cz.currency, cz.value, cz.page_language], ["CZK", 100, "cs"]);
  eq(A.payloadUdalosti(fx("sk-kamion/krok1.html"), "begin_checkout").items[0].item_id, "TEST-TRUCK");
  eq(A.payloadUdalosti(fx("sk-set/krok1.html"), "begin_checkout").items.length > 0, true);
  eq(A.payloadUdalosti(fx("sk/krok2.html"), "begin_checkout"), null, "krok 2 begin_checkout nemá");
});
t("analytika: fail-closed — bez volania, 2 volania, neplatný JSON, bez items -> null", () => {
  eq(A.payloadUdalosti("", "begin_checkout"), null);
  eq(A.payloadUdalosti("gtag('event', 'begin_checkout', {\"items\":[]}); gtag('event', 'begin_checkout', {\"items\":[]});", "begin_checkout"), null, "2×");
  eq(A.payloadUdalosti("gtag('event', 'begin_checkout', {items: []});", "begin_checkout"), null, "nie JSON");
  eq(A.payloadUdalosti("gtag('event', 'begin_checkout', {\"value\":1});", "begin_checkout"), null, "bez items");
  eq(A.payloadUdalosti("gtag('event', 'begin_checkout', {\"items\":[{\"n\":\"a}b\\\"c\"}]});", "begin_checkout").items[0].n, "a}b\"c", "zátvorka a úvodzovka v texte");
});
t("analytika: payment_type = data-payment-type~názov — sedí s add_payment_info Shoptetu na kroku 2 (SK, CZ)", () => {
  for (const web of ["sk", "cz"]) {
    const m = krok1Model(fx(web + "/krok1.html"));
    const shoptet = A.payloadUdalosti(fx(web + "/krok2.html"), "add_payment_info").payment_type;
    eq(A.typPlatby(m.platby.find((p) => p.id === m.zvolenaPlatba)), shoptet, web);
  }
  const m = krok1Model(fx("sk/krok1.html"));
  eq([A.typPlatby(m.platby.find((p) => p.id === "106")), A.typPlatby(m.platby.find((p) => p.id === "3"))], ["shoptetpay~Apple Pay", "cashOnDelivery~Dobierkou"]);
  eq(A.typPlatby({ nazov: "X" }), null);
});
t("analytika: príznak preskočeného kroku 1 platí raz a len čerstvý; begin_checkout len s príznakom", () => {
  const volania = [];
  window.gtag = function () { volania.push([...arguments]); };
  try {
    sessionStorage.clear();
    eq(A.vezmiPreskocenie(), false, "bez príznaku");
    A.oznacPreskocenie(1000);
    eq([A.vezmiPreskocenie(5000), A.vezmiPreskocenie(5000)], [true, false], "raz");
    A.oznacPreskocenie(1000);
    eq(A.vezmiPreskocenie(1000 + A.PRESKOCIL_MAX_MS + 1), false, "starý");
    eq(A.posliBeginCheckout(fx("sk/krok1.html"), false), false);
    eq(A.posliBeginCheckout(fx("sk/krok1.html"), true), true);
    eq(A.posliBeginCheckout("<html></html>", true), false, "bez vzoru nič");
    eq(volania.map((v) => v.slice(0, 2).join(" ")), ["event begin_checkout"]);
    delete window.gtag;
    eq(A.posliBeginCheckout(fx("sk/krok1.html"), true), false, "bez gtag");
  } finally { delete window.gtag; sessionStorage.clear(); }
});
t("analytika: príznak preskočenia zmaže každá stránka s OPC okrem kroku 2 (napr. natívny krok 1); bez OPC sa nič nemení", () => {
  const telo = document.body.className;
  try {
    for (const [trieda, opc, ostane] of [["id--16 in-krok-1", "1", false], ["id--9 in-kosik", "1", false], ["type-product id-598", "1", false], ["id--17 in-krok-2", "1", true], ["id--16 in-krok-1", null, true]]) {
      sessionStorage.clear();
      if (opc) sessionStorage.setItem("lcdOpc", opc);
      sessionStorage.setItem(A.KLUC_PRESKOCIL, String(Date.now()));
      document.body.className = trieda;
      delete window.__lcdOpc;
      B.initOpc({});
      eq(sessionStorage.getItem(A.KLUC_PRESKOCIL) !== null, ostane, trieda + " (lcdOpc=" + opc + ")");
    }
  } finally { document.body.className = telo; sessionStorage.clear(); delete window.__lcdOpc; }
});
t("analytika: add_payment_info len pri zmene oproti poslednej (nie prvá, nie 2×), vzor zo skriptu kroku 2", () => {
  const volania = [], dl = [];
  window.gtag = function () { volania.push([...arguments]); };
  try {
    const d = new JSDOM(fx("sk/krok2.html")).window.document;
    const skript = A.skriptSUdalostou(d, "add_payment_info");
    eq(/add_payment_info/.test(skript), true);
    const m = krok1Model(fx("sk/krok1.html"));
    const p = A.sledujPlatbu({ skript, platba: "5", model: m, meraj: (e, x) => dl.push([e, x]) });
    eq([p("5"), p("3"), p("3"), p("5")], [false, true, false, true]);
    eq(volania.map((v) => v[1] + ":" + v[2].payment_type), ["add_payment_info:cashOnDelivery~Dobierkou", "add_payment_info:transfer~Prevodom"]);
    eq([volania[0][2].send_to, volania[0][2].items[0].item_id, dl.length], ["GA4", "VZORKY-DRAGONSKIN", 0]);
    const bez = A.sledujPlatbu({ skript: "", platba: "5", model: m, meraj: (e, x) => dl.push([e, x]) });
    eq([bez("3"), dl.map((x) => x[0] + ":" + x[1].lcd_opc_platba)], [false, ["lcd_opc_platba:3"]], "bez vzoru len dataLayer");
  } finally { delete window.gtag; }
});
t("analytika: zname(id) — platbu, ktorú session dostala inde (iné okno, overenie zo servera), neposiela; ďalšiu zmenu áno", () => {
  const volania = [];
  window.gtag = function () { volania.push([...arguments]); };
  try {
    const skript = A.skriptSUdalostou(new JSDOM(fx("sk/krok2.html")).window.document, "add_payment_info");
    const p = A.sledujPlatbu({ skript, platba: "5", model: krok1Model(fx("sk/krok1.html")) });
    p.zname("3");
    eq([p("3"), p("3"), p("5")], [false, false, true]);
    eq(volania.map((v) => v[1] + ":" + v[2].payment_type), ["add_payment_info:transfer~Prevodom"]);
  } finally { delete window.gtag; }
});
t("analytika: chýbajúci alebo chybný window.gtag a nedostupný sessionStorage -> žiadna výnimka, nič do GA, platba len do dataLayer", () => {
  const m = krok1Model(fx("sk/krok1.html"));
  const skript = A.skriptSUdalostou(new JSDOM(fx("sk/krok2.html")).window.document, "add_payment_info");
  const ss = globalThis.sessionStorage;
  try {
    for (const [nazov, g] of [["chýba", undefined], ["nie je funkcia", "gtag"], ["hodí výnimku", function () { throw new Error("gtag"); }]]) {
      if (g === undefined) delete window.gtag; else window.gtag = g;
      const dl = [];
      eq(A.posliBeginCheckout(fx("sk/krok1.html"), true), false, nazov + ": begin_checkout");
      const p = A.sledujPlatbu({ skript, platba: "5", model: m, meraj: (e, x) => dl.push([e, x]) });
      eq(p("3"), false, nazov + ": add_payment_info");
      eq(dl.map((x) => x[0] + ":" + x[1].lcd_opc_platba + ":" + x[1].lcd_opc_typ), ["lcd_opc_platba:3:cashOnDelivery~Dobierkou"], nazov + ": dataLayer");
    }
    // súkromný režim / zakázané úložisko: príznak sa nezapíše ani neprečíta -> krok 2 berie „nepreskočený“ (nič navyše)
    const hadze = () => { throw new Error("SecurityError"); };
    globalThis.sessionStorage = { getItem: hadze, setItem: hadze, removeItem: hadze };
    A.oznacPreskocenie();
    A.zahodPreskocenie();
    eq(A.vezmiPreskocenie(), false, "sessionStorage hádže");
  } finally { globalThis.sessionStorage = ss; delete window.gtag; }
});

// ------------------------------------------------------------------ právne vety z VOP (Michal 29. 10.: „použi, čo už máme vo VOP“)
t("VOP texty: tovar na mieru (bod 6.13), záloha pri dobierke (bod 4.13, 50 %), spôsoby platby v záchrane (bod 4.5) — SK aj CZ s odkazom", () => {
  eq([TEXTY.sk.vop, TEXTY.cz.vop], ["/obchodne-podmienky/", "/obchodni-podminky/"]);
  eq([/na mieru/.test(TEXTY.sk.naMieru), /po začatí výroby/i.test(TEXTY.sk.naMieru), TEXTY.sk.naMieruOdkaz], [true, true, "podľa obchodných podmienok, bod 6.13"]);
  eq([/na míru/.test(TEXTY.cz.naMieru), /po zahájení výroby/i.test(TEXTY.cz.naMieru), TEXTY.cz.naMieruOdkaz], [true, true, "podle obchodních podmínek, bod 6.13"]);
  eq([/50\s%/.test(TEXTY.sk.zalohaInfo), /50\s%/.test(TEXTY.cz.zalohaInfo)], [true, true]);
  for (const web of ["sk", "cz"]) {
    const p = TEXTY[web].platbyZachrana;
    eq(["Apple Pay", "Google Pay"].every((x) => p.indexOf(x) >= 0) && /kart/.test(p) && /prevod|převod/.test(p) && /dobierk|dobírk/.test(p), true, web + " zoznam platieb z VOP 4.5");
    eq(/bod 4\.5/.test(TEXTY[web].platbyZachranaOdkaz), true, web);
  }
  // nikde TODO a nikde DPH (LCD nie je platca DPH)
  const vsetko = JSON.stringify([TEXTY.sk, TEXTY.cz]);
  eq([/DPH/.test(vsetko), /TODO/.test(vsetko)], [false, false]);
});
t("VOP text pri vete o tovare na mieru: vetaSOdkazom = text + odkaz na VOP (nová karta) + bodka", () => {
  const d = new JSDOM("<!doctype html><body></body>").window.document;
  const p = V.vetaSOdkazom(d, "p", "lcd-opc-pravne", TEXTY.sk.naMieru, TEXTY.sk.naMieruOdkaz, TEXTY.sk.vop);
  const a = p.querySelector("a");
  eq([p.className, a.getAttribute("href"), a.getAttribute("target"), a.getAttribute("rel"), p.textContent.endsWith(TEXTY.sk.naMieruOdkaz + ".")], ["lcd-opc-pravne", "/obchodne-podmienky/", "_blank", "noopener", true]);
});

t("CSS OPC: žiadny komentár // (partial sa kopíruje do luxuryCar.css bez zmeny, prehliadač by zahodil pravidlo za ním)", () => {
  const koren = fileURLToPath(new URL("..", import.meta.url));
  const partial = readFileSync(join(koren, "assets/css/_lcdOpc.scss"), "utf8");
  const css = readFileSync(join(koren, "assets/css/luxuryCar.css"), "utf8");
  const blok = css.slice(css.indexOf("LCD-OPC START"), css.indexOf("LCD-OPC END"));
  const zle = (txt) => txt.split(/\r?\n/).map((r, i) => [i + 1, r]).filter((x) => /^\s*\/\//.test(x[1])).map((x) => x[0] + ": " + x[1].slice(0, 60));
  eq(zle(partial), [], "_lcdOpc.scss");
  eq(blok.length > 1000, true, "blok LCD-OPC v luxuryCar.css");
  eq(zle(blok), [], "luxuryCar.css blok LCD-OPC");
});

await Promise.all(asyncTesty);
// jsdom nad celým krokom 2 je pomalý (sekundy) — až po asynchrónnych testoch, inak by im vypršali časovače
// ------------------------------------------------------------------ kontrola polí pred odoslaním (Michal 29. 10.)
const ZAKAZNIK_J = { billFullName: "Test Testovací", email: "test@example.com", phone: "900 000 000", billStreet: "Testovacia", billHouseNumber: "1", billCity: "Bratislava", billZip: "811 01" };
const VID = { viditelne: () => true }; // jsdom nemá rozloženie (getClientRects = [])
function krok2Dom(web, o = {}) {
  const dom = new JSDOM(fx(web + "/krok2.html"), { url: "https://www.luxurycardesign." + web + "/objednavka/krok-2/" });
  const d = dom.window.document;
  const form = d.getElementById("order-form");
  let sek = null;
  if (o.sekcia) {
    const m = krok1Model(fx(web + "/krok1.html"));
    sek = V.vykresliSekciu(d, m, TEXTY[web], { volby: o.volby || { doprava: m.zvolenaDoprava, platba: m.zvolenaPlatba }, applePay: false });
    const pred = form.querySelector(".co-box-additional");
    pred.parentNode.insertBefore(sek, pred);
  }
  return { d, w: dom.window, form, sek };
}
t("kontrola: prázdna stránka -> meno; postupne e-mail, telefón, ulica, číslo domu, mesto, PSČ, súhlas; potom nič (SK aj CZ)", () => {
  for (const web of ["sk", "cz"]) {
    const { form, sek } = krok2Dom(web, { sekcia: true });
    const poradie = [];
    for (let i = 0; i < 12; i++) {
      const z = K.prvaChyba(form, sek, VID);
      if (!z) break;
      poradie.push(z.el.id + ":" + z.dovod);
      if (z.el.type === "checkbox") z.el.checked = true; else z.el.value = ZAKAZNIK_J[z.el.id] || "x";
    }
    eq(poradie.slice(0, 7), ["billFullName", "email", "phone", "billStreet", "billHouseNumber", "billCity", "billZip"].map((x) => x + ":prazdne"), web);
    eq([poradie.length, /^consents\d+:prazdne$/.test(poradie[7])], [8, true], web + " posledný je súhlas: " + poradie[7]);
  }
});
t("kontrola: medzera = prázdne; chyba Shoptetu (js-error-field / error-field) = zlé pole aj vyplnené; telefón sa overuje -> rozhodne Shoptet", () => {
  const { d, form } = krok2Dom("sk");
  Object.keys(ZAKAZNIK_J).forEach((id) => { d.getElementById(id).value = ZAKAZNIK_J[id]; });
  d.querySelector('#order-form input[name="consents[]"]').checked = true;
  eq(K.prvaChyba(form, null, VID), null, "všetko vyplnené");
  d.getElementById("billCity").value = "   ";
  eq(K.prvaChyba(form, null, VID).el.id, "billCity");
  d.getElementById("billCity").value = "Bratislava";
  const tel = d.getElementById("phone");
  tel.classList.add("js-error-field");
  eq([K.prvaChyba(form, null, VID).el.id, K.prvaChyba(form, null, VID).dovod], ["phone", "chyba"]);
  tel.classList.remove("js-error-field");
  d.getElementById("billZip").classList.add("error-field");
  eq(K.prvaChyba(form, null, VID).el.id, "billZip", "stará trieda validátora Shoptetu");
  d.getElementById("billZip").classList.remove("error-field");
  tel.value = "";
  tel.classList.add("js-validated-field");
  tel.disabled = true; // Shoptet počas overenia (GET ShoptetValidatePhone) pole vypne
  eq(K.prvaChyba(form, null, VID), null, "telefón sa overuje -> neblokujeme, rozhodne Shoptet");
});
t("kontrola: neviditeľné a pozastavené polia (firma, iná adresa, varchar) sa nekontrolujú; viditeľná povinná áno", () => {
  const { d, form } = krok2Dom("sk");
  Object.keys(ZAKAZNIK_J).forEach((id) => { d.getElementById(id).value = ZAKAZNIK_J[id]; });
  d.querySelector('#order-form input[name="consents[]"]').checked = true;
  const zip = d.getElementById("deliveryZip");
  zip.classList.add("js-validation-suspended"); // Shoptet pri skrytej inej adrese (živá stránka, prieskum 29. 10.)
  zip.classList.add("js-validate-required");
  eq(K.prvaChyba(form, null, VID), null, "pozastavené");
  zip.classList.remove("js-validation-suspended");
  eq(K.prvaChyba(form, null, { viditelne: (e) => e !== zip && e !== K.skupinaPola(zip) }), null, "skryté");
  eq(K.prvaChyba(form, null, VID).el.id, "deliveryZip", "viditeľné povinné");
  eq(K.prvaChyba(form, null), null, "bez rozloženia (jsdom) je všetko neviditeľné -> nič neblokuje");
});
t("kontrola: naša sekcia bez zvolenej dopravy / platby = zlé pole na mieste sekcie (za adresou, pred súhlasom)", () => {
  const { d, form, sek } = krok2Dom("sk", { sekcia: true, volby: { doprava: "96", platba: "nic" } });
  Object.keys(ZAKAZNIK_J).forEach((id) => { d.getElementById(id).value = ZAKAZNIK_J[id]; });
  const z = K.prvaChyba(form, sek, VID);
  eq([z.dovod, z.el.name, z.skupina.classList.contains("co-payment-method")], ["platba", "billingId", true]);
  V.nastavVolby(sek, { doprava: "nic", platba: "5" });
  eq(K.prvaChyba(form, sek, VID).dovod, "doprava");
  V.nastavVolby(sek, { doprava: "96", platba: "112" }); // rýchla platba (riadok-odkaz) zvolená = OK
  eq(K.prvaChyba(form, sek, VID).el.name, "consents[]");
  d.getElementById("billCity").value = "";
  V.nastavVolby(sek, { doprava: "nic", platba: "5" });
  eq(K.prvaChyba(form, sek, VID).el.id, "billCity", "adresa je pred sekciou");
});
t("kontrola: text chyby = text Shoptetu pre pole (meno, telefón, súhlas consents[]), inak náš; doprava a platba naše", () => {
  const { d, w } = krok2Dom("sk");
  const spravy = { validator: { billFullNameRequired: "Zadajte meno a priezvisko.", phoneRequired: "Zadajte telefónne číslo.", consentsRequired: "Potvrďte svoj súhlas." } };
  const z = (id) => ({ el: d.getElementById(id), dovod: "prazdne" });
  eq(K.textChyby(z("billFullName"), TEXTY.sk, spravy), "Zadajte meno a priezvisko.");
  eq(K.textChyby(z("phone"), TEXTY.sk, spravy), "Zadajte telefónne číslo.");
  eq(K.textChyby({ el: d.querySelector('input[name="consents[]"]'), dovod: "prazdne" }, TEXTY.sk, spravy), "Potvrďte svoj súhlas.");
  eq([K.textChyby(z("billCity"), TEXTY.sk, spravy), K.textChyby(z("billCity"), TEXTY.cz, null)], ["Toto pole treba vyplniť.", "Toto pole je potřeba vyplnit."]);
  eq([K.textChyby({ el: d.body, dovod: "doprava" }, TEXTY.sk), K.textChyby({ el: d.body, dovod: "platba" }, TEXTY.cz)], ["Vyberte dopravu.", "Vyberte platbu."]);
  eq(K.spravyShoptetu(w), null, "bez shoptet.messages");
});
t("kontrola: označenie a oprava — vlastné (bez Shoptetu) aj cez shoptet.validator.addErrorMessage; text pod poľom, červený rám, aria-invalid; po vyplnení hneď preč", () => {
  const { d, w, form } = krok2Dom("sk");
  const meno = d.getElementById("billFullName");
  const sprava = (el) => el.closest(".js-validated-element-wrapper").querySelector('.js-validator-msg[data-type="validatorRequired"]');
  const stav = (el) => [el.closest(".form-group").classList.contains("lcd-opc-chyba-pole"), el.classList.contains("js-error-field"), el.getAttribute("aria-invalid"), sprava(el) ? sprava(el).textContent : null];
  K.oznacChybu({ el: meno, dovod: "prazdne" }, "Zadajte meno a priezvisko.");
  eq(stav(meno), [true, true, "true", "Zadajte meno a priezvisko."], "bez Shoptetu");
  eq(K.oznacenaPrazdna(meno), true);
  meno.value = "Test";
  eq(K.poOprave(meno), true);
  eq(stav(meno), [false, false, null, null], "po vyplnení");
  eq(K.poOprave(meno), false, "druhýkrát nič");
  // so Shoptetom: jeho addErrorMessage / removeErrorMessage (rovnaký vzhľad ako jeho chyby), text súhlasu náš z jeho správ
  const volania = [];
  w.shoptet = { validator: {
    addErrorMessage(el, typ) { volania.push("add " + el.name + " " + typ); const o = el.closest(".js-validated-element-wrapper"); const m = d.createElement("div"); m.className = "js-validator-msg msg-error"; m.setAttribute("data-type", typ); m.textContent = "Povinné pole"; o.appendChild(m); el.classList.add("js-error-field"); },
    removeErrorMessage(el, typ) { volania.push("remove " + el.name + " " + typ); el.closest(".js-validated-element-wrapper").querySelectorAll('.js-validator-msg[data-type="' + typ + '"]').forEach((m) => m.remove()); el.classList.remove("js-error-field"); },
  } };
  const suhlas = d.querySelector('#order-form input[name="consents[]"]');
  K.oznacChybu({ el: suhlas, dovod: "prazdne" }, "Potvrďte svoj súhlas.");
  eq(stav(suhlas), [true, true, "true", "Potvrďte svoj súhlas."], "so Shoptetom");
  eq(sprava(suhlas).parentNode.querySelectorAll(".js-validator-msg").length, 1, "jedna správa");
  suhlas.checked = true;
  K.poOprave(suhlas);
  eq([stav(suhlas), volania], [[false, false, null, null], ["add consents[] validatorRequired", "remove consents[] validatorRequired"]]);
  // chyba Shoptetu (formát): jeho text ostane, pridá sa len rám skupiny; prázdna správa -> náš text „Skontrolujte“
  const tel = d.getElementById("phone");
  tel.classList.add("js-error-field");
  const m = d.createElement("div"); m.className = "js-validator-msg msg-error"; m.setAttribute("data-type", "validatorInvalidPhoneNumber"); m.textContent = "Vyplňte prosím platné telefónne číslo bez predvoľby.";
  tel.closest(".js-validated-element-wrapper").appendChild(m);
  K.oznacChybu({ el: tel, dovod: "chyba" }, "x");
  eq([tel.closest(".form-group").classList.contains("lcd-opc-chyba-pole"), tel.closest(".js-validated-element-wrapper").querySelectorAll(".js-validator-msg").length, m.textContent.indexOf("platné") > 0], [true, 1, true]);
  tel.classList.remove("js-error-field"); m.remove(); // Shoptet chybu zrušil (overenie prešlo)
  eq([K.poOprave(tel), tel.closest(".form-group").classList.contains("lcd-opc-chyba-pole")], [true, false]);
  delete w.shoptet;
  void form;
});
t("kontrola: sekcia Doprava a platba — chyba pod skupinou (náš text), po zvolení preč", () => {
  const { d, form, sek } = krok2Dom("cz", { sekcia: true, volby: { doprava: "111", platba: "nic" } });
  Object.keys(ZAKAZNIK_J).forEach((id) => { d.getElementById(id).value = ZAKAZNIK_J[id]; });
  const z = K.prvaChyba(form, sek, VID);
  K.oznacChybu(z, K.textChyby(z, TEXTY.cz));
  const box = sek.querySelector(".co-payment-method");
  eq([box.classList.contains("lcd-opc-chyba-pole"), (box.querySelector(".lcd-opc-chyba-text") || {}).textContent], [true, "Vyberte platbu."]);
  V.nastavVolby(sek, { doprava: "111", platba: "5" });
  eq(K.poOprave(sek.querySelector('input[name="billingId"][value="5"]')), true);
  eq([box.classList.contains("lcd-opc-chyba-pole"), box.querySelector(".lcd-opc-chyba-text")], [false, null]);
});
t("lišta: text = text tlačidla Shoptetu („Objednať s povinnosťou platby“ / „Objednat s povinností platby“), suma, type=button", () => {
  for (const [web, text] of [["sk", "Objednať s povinnosťou platby"], ["cz", "Objednat s povinností platby"]]) {
    const { d } = krok2Dom(web);
    const tl = d.getElementById("submit-order");
    eq(V.textTlacidla(tl, TEXTY[web]), text, web);
    const l = V.vytvorListu(d, TEXTY[web], V.textTlacidla(tl, TEXTY[web]));
    eq([l.querySelector("button").type, l.querySelector(".lcd-opc-lista__text").textContent, !!l.querySelector(".lcd-opc-lista__celkom")], ["button", text, true], web);
    eq(/súhrnu|souhrnu/.test(l.textContent), false, web + ": už nie „K súhrnu“");
  }
  eq(V.textTlacidla(null, TEXTY.sk), "Objednať s povinnosťou platby", "bez tlačidla záložný text");
});


t("dizajn A: karty 1 Kontakt, 2 Adresa (čísla, nadpisy), PSČ pred Mestom, riadok Štát | firma | údaje firmy | iná adresa (SK aj CZ)", () => {
  for (const web of ["sk", "cz"]) {
    const { d, form } = krok2Dom(web, { sekcia: true });
    V.pripravKarty(form, TEXTY[web]);
    V.pripravKarty(form, TEXTY[web]); // opakované volanie nič nezmení
    const karty = [...form.querySelectorAll(".lcd-opc-karta:not(.lcd-opc-karta--bez-cisla)")];
    eq(karty.map((k) => [k.querySelector("h2").getAttribute("data-lcd-opc-cislo"), k.querySelector("h2").textContent]),
      [["1", "Kontakt"], ["2", "Adresa"], ["3", "Doprava"], ["4", "Platba"]], web);
    const fs = form.querySelector(".co-billing-address > fieldset");
    const poradie = [...fs.querySelectorAll("[data-lcd-opc-pole]")].map((g) => g.getAttribute("data-lcd-opc-pole")).filter((x) => /^bill(Street|HouseNumber|Zip|City)$/.test(x));
    eq(poradie, ["billStreet", "billHouseNumber", "billZip", "billCity"], web + ": PSČ pred Mestom");
    const riadok = fs.querySelectorAll(".lcd-opc-adresa-volby");
    eq(riadok.length, 1, web + ": jeden riadok pod adresou");
    // údaje firmy hneď pod „Objednávam na firmu“, pred „Doručiť na inú adresu“ (revízia: na telefóne boli až pod ňou)
    eq([...riadok[0].children].map((g) => (g.classList.contains("lcd-opc-stat") ? "stat" : g.id === "company-info" ? "company-info" : g.getAttribute("data-lcd-opc-pole"))),
      ["stat", "company-shopping", "company-info", "another-shipping"], web);
    const login = form.querySelector(".lcd-opc-ucet a.login-button");
    eq(login && login.textContent, TEXTY[web].prihlasit, web + ": krátky odkaz na prihlásenie");
    // natívne polia ostali v tom istom formulári, nič sa nekopírovalo
    eq(["billZip", "billCity", "company-shopping", "another-shipping", "companyId"].map((id) => d.querySelectorAll("#" + id).length + ":" + form.contains(d.getElementById(id))), Array(5).fill("1:true"), web);
  }
});
t("dizajn A: fajka kariet podľa vyplnenosti (Kontakt, Adresa), chyba Shoptetu fajku zruší, Doprava a Platba podľa zvolenej voľby", () => {
  const { d, form, sek } = krok2Dom("sk", { sekcia: true });
  V.pripravKarty(form, TEXTY.sk);
  const stav = () => [...form.querySelectorAll(".lcd-opc-karta:not(.lcd-opc-karta--bez-cisla)")].map((k) => k.classList.contains("lcd-opc-karta--hotovo"));
  V.obnovKarty(form, sek);
  eq(stav(), [false, false, true, true], "prázdna stránka");
  ["billFullName", "email", "phone"].forEach((id) => { d.getElementById(id).value = ZAKAZNIK_J[id]; });
  V.obnovKarty(form, sek);
  eq(stav(), [true, false, true, true], "kontakt vyplnený");
  ["billStreet", "billHouseNumber", "billCity", "billZip"].forEach((id) => { d.getElementById(id).value = ZAKAZNIK_J[id]; });
  d.getElementById("phone").classList.add("js-error-field");
  V.obnovKarty(form, sek);
  eq(stav(), [false, true, true, true], "telefón označený Shoptetom ako chybný");
  const chyba = () => [...form.querySelectorAll(".lcd-opc-karta:not(.lcd-opc-karta--bez-cisla)")].map((k) => k.classList.contains("lcd-opc-karta--chyba"));
  eq(chyba(), [true, false, false, false], "karta s chybným poľom = červený krúžok");
  d.getElementById("phone").classList.remove("js-error-field");
  d.getElementById("billCity").closest(".form-group").classList.add("lcd-opc-chyba-pole"); // naša kontrola pred odoslaním
  V.obnovKarty(form, sek);
  eq(chyba(), [false, true, false, false], "chyba z kontroly pred odoslaním (lcd-opc-chyba-pole)");
  d.getElementById("billCity").closest(".form-group").classList.remove("lcd-opc-chyba-pole");
  d.getElementById("phone").classList.add("js-error-field");
  d.getElementById("billCity").value = "  ";
  sek.querySelectorAll('input[name="billingId"]').forEach((i) => { i.checked = false; });
  V.obnovKarty(form, sek);
  eq(stav(), [false, false, true, false], "mesto len medzera, žiadna platba");
});
t("dizajn A: platby zadarmo = dlaždice (nie dobierka, nie rýchla platba), počet stĺpcov, nepárna posledná", () => {
  for (const [web, apple, ocak] of [["sk", false, ["5", "103", "109"]], ["sk", true, ["5", "103", "106", "109"]], ["cz", false, ["5", "114", "120"]]]) {
    const { el } = sekcia(web, { applePay: apple });
    const pl = el.querySelector("#lcd-opc-platby");
    const dl = [...pl.querySelectorAll(".lcd-opc-dlazdica")];
    eq(dl.map((w) => w.querySelector("input").value), ocak, web + (apple ? " s Apple Pay" : ""));
    eq([pl.getAttribute("data-lcd-opc-dlazdice"), pl.style.getPropertyValue("--lcd-opc-dl")], [String(ocak.length), String(ocak.length)], web);
    eq(dl.map((w) => w.classList.contains("lcd-opc-dlazdica--posledna")), ocak.map((_, i) => ocak.length % 2 === 1 && i === ocak.length - 1), web + ": nepárna posledná");
    const dob = el.querySelector('input[data-payment-type="cashOnDelivery"]').closest(".radio-wrapper");
    const pis = el.querySelector('[data-submethod="pis"]');
    eq([dob.classList.contains("lcd-opc-dlazdica"), !!pis && pis.classList.contains("lcd-opc-dlazdica")], [false, false], web + ": dobierka a rýchla platba nie sú dlaždice");
    eq([...el.querySelectorAll(".lcd-opc-karta h2")].map((h) => h.getAttribute("data-lcd-opc-cislo")), ["3", "4"], web);
  }
});
t("dizajn A: termín „Doručenie do 14–25 dní“ — lehota sa nezalomí, text celý", () => {
  const { el } = sekcia("sk", { termin: V.terminDorucenia("kamion") });
  const t0 = el.querySelector(".lcd-opc-termin");
  eq([t0.textContent, t0.querySelector(".lcd-opc-termin__lehota").textContent], ["Doručenie do 14–25 dní", "14–25 dní"]);
});
t("dizajn A: lišta — text tlačidla na 2 riadky (OBJEDNAŤ + s povinnosťou platby), text celý; „Odosielam…“ bez druhého riadku", () => {
  const { d } = krok2Dom("sk");
  const l = V.vytvorListu(d, TEXTY.sk, "Objednať s povinnosťou platby");
  const t0 = l.querySelector(".lcd-opc-lista__text");
  eq([t0.querySelector(".lcd-opc-lista__hlavny").textContent, t0.querySelector(".lcd-opc-lista__suffix").textContent, t0.textContent],
    ["Objednať", "s povinnosťou platby", "Objednať s povinnosťou platby"]);
  V.nastavTextListy(t0, TEXTY.sk.odosielam);
  eq([t0.textContent, t0.querySelector(".lcd-opc-lista__suffix")], ["Odosielam…", null]);
  V.nastavTextListy(t0, "Objednat s povinností platby");
  eq(t0.querySelector(".lcd-opc-lista__suffix").textContent, "s povinností platby");
});

t("kontrola: posun na chybu — telefón: textové pole s textom chyby nad klávesnicou (horných 55 % okna); navrchu, súhlas a PC bez posunu", () => {
  const mk = (sirka, dotyk) => {
    const w = new JSDOM('<!doctype html><body><div class="form-group" id="g"><input id="i" class="form-control"></div><div class="form-group consents" id="gc"><input type="checkbox" id="c"></div></body>').window;
    Object.defineProperty(w, "innerWidth", { value: sirka, configurable: true });
    Object.defineProperty(w, "innerHeight", { value: 844, configurable: true });
    Object.defineProperty(w, "pageYOffset", { value: 100, configurable: true });
    w.matchMedia = (q) => ({ matches: /coarse/.test(q) ? dotyk : false });
    const volania = [];
    w.scrollTo = (o) => volania.push(o.top);
    const d = w.document;
    const poloha = (id, t0, b0) => { d.getElementById(id).getBoundingClientRect = () => ({ top: t0, bottom: b0, left: 0, right: 300, width: 300, height: b0 - t0 }); };
    return { d, volania, poloha };
  };
  let x = mk(390, true);
  x.poloha("g", 524, 597); // Mesto + text chyby nad lištou, ale pod klávesnicou
  K.posunNaChybu({ el: x.d.getElementById("i"), skupina: x.d.getElementById("g") }, { dole: 81 });
  eq(x.volania, [524 + 100 - Math.round(844 * 0.2)], "telefón: textové pole v dolnej polovici -> na 20 % okna");
  x = mk(390, true);
  x.poloha("g", 230, 300);
  K.posunNaChybu({ el: x.d.getElementById("i"), skupina: x.d.getElementById("g") }, { dole: 81 });
  eq(x.volania, [], "telefón: pole navrchu ostane");
  x = mk(390, true);
  x.poloha("gc", 524, 597);
  K.posunNaChybu({ el: x.d.getElementById("c"), skupina: x.d.getElementById("gc") }, { dole: 81 });
  eq(x.volania, [], "telefón: súhlas (bez klávesnice) ostane");
  x = mk(1366, false);
  x.poloha("g", 524, 597);
  K.posunNaChybu({ el: x.d.getElementById("i"), skupina: x.d.getElementById("g") }, {});
  eq(x.volania, [], "PC: viditeľné pole ostane");
  x = mk(1180, true);
  x.poloha("g", 524, 597);
  K.posunNaChybu({ el: x.d.getElementById("i"), skupina: x.d.getElementById("g") }, {});
  eq(x.volania.length, 1, "tablet s dotykom: posun nad klávesnicu");
});

const over_ = (podm, m) => { if (!podm) throw new Error(m); };
// ------------------------------------------------------------------ položky súhrnu: fotka a zobáčik (opc/polozky.js, S42)
const P = await import("../assets/js/opc/polozky.js");
const TS = TEXTY.sk, TC = TEXTY.cz;

// Náhľad 5 (Michal 30. 10. 2026, „B1 + odsúhlasujem vizuálne“): rozbalený detail = rekapitulácia z košíka bez zmeny —
// žiadne prepisovanie riadkov (vrstvy, guličky farieb), žiadne riadky Počet / Cena ani „Niečo nesedí? Upraviť v košíku“.
t("polozky + texty: prepisovanie rozpisu je preč (náhľad 5) — bez riadkyDetailu / farbaBodky / upravRozpis, bez textov Počet, Cena, Niečo nesedí, vrstiev", () => {
  eq(["riadkyDetailu", "farbaBodky", "upravRozpis", "citajRozpis"].filter((k) => k in P), [], "exporty opc/polozky.js");
  for (const web of ["sk", "cz"]) eq(["nesedi", "upravitVKosiku", "pocet", "cena", "prvaVrstva", "druhaVrstva"].filter((k) => k in TEXTY[web]), [], web + ": nepoužité texty v opc/texty.js");
});

t("CSS: karta detailu súhrnu neprestyluje rozpis košíka (náhľad 5) — bez guličiek, „Niečo nesedí“, riadkov Počet / Cena a pieskovej karty", () => {
  const scss = readFileSync(new URL("../assets/css/_lcdOpc.scss", import.meta.url), "utf8").split("\n");
  // výnimka: pravidlo, ktoré mení LEN veľkosť písma (mierka LCD: rozpis kamióna má v _cart.scss 13 px, poznámka ≥ 14 px)
  const lenPismo = (r) => /\{\s*font-size:\s*\d+px(?:\s*!important)?\s*;?\s*\}\s*$/.test(r);
  const zle = scss.filter((r) => /lcd-opc-bodka|lcd-opc-nesedi|lcd-opc-detail__navyse|lcd-opc-detail__cena/.test(r) ||
    (/\.lcd-opc-detail\b/.test(r) && /ul\.lcd-rozpis|lcd-rozpis__|lcd-truck-cart-summary|info-wrap|\b(dt|dd|h4|li)\b|--o-piesok|border:1px/.test(r) && !lenPismo(r)));
  eq(zle.map((r) => r.trim().slice(0, 120)), [], "pravidlá, ktoré menia vzhľad rozpisu v detaile");
});

// Súhlasy B1 (Michal 30. 10. 2026, náhľad 3, S45): povinný súhlas sa v CSS určí rovnako ako v opc/kontrola.js (jePovinne:
// required / required / js-validate-required), nie poradím (.consents-first) ani :has() — štítok „Povinné“ len pri ňom.
const POVINNY_SUHLAS = "input[type=checkbox]:is([required],.required,.js-validate-required)";
t("CSS súhlasy B1: povinný = to isté, čo kontrola.js (required / js-validate-required), nie poradie — štítok „Povinné“ na SK aj CZ len pri consents[]", () => {
  const scss = readFileSync(new URL("../assets/css/_lcdOpc.scss", import.meta.url), "utf8").split("\n");
  const stitok = scss.filter((r) => /content:\s*"Povinné"/.test(r));
  eq(stitok.length, 1, "pravidlo so štítkom „Povinné“");
  eq(stitok[0].includes("#checkoutSidebar .consents " + POVINNY_SUHLAS + "+label::after"), true, "selektor štítku: " + stitok[0].trim().slice(0, 160));
  eq(scss.filter((r) => /\.consents/.test(r) && /consents-first|:first-child|:nth-child|:first-of-type|:last-child|:has\(/.test(r)).map((r) => r.trim().slice(0, 100)), [],
    "súhlasy podľa poradia alebo cez :has()");
  for (const web of ["sk", "cz"]) {
    const d = new JSDOM(fx(web + "/krok2.html")).window.document;
    const css = Array.prototype.map.call(d.querySelectorAll(".consents " + POVINNY_SUHLAS), (e) => e.name);
    const kontrola = Array.prototype.filter.call(d.querySelectorAll(".consents input[type=checkbox]"), (e) => K.jePovinne(e)).map((e) => e.name);
    eq([css, kontrola], [["consents[]"], ["consents[]"]], web + ": povinné súhlasy (CSS, kontrola.js)");
  }
});
// N5 (revízia 30. 10. 2026): súhlas so štítkom „Povinné“ (CSS: required / .required / .js-validate-required) musí kontrola
// pred „Objednať“ aj nájsť — aj keď má len triedu js-validate-required (validatorRequired Shoptetu ju hľadá podľa triedy)
t("kontrola: súhlas len s triedou js-validate-required (štítok „Povinné“) nájde kontrola pred Objednať; CSS, jePovinne a SELEKTOR_POLI sa zhodujú (SK aj CZ)", () => {
  for (const web of ["sk", "cz"]) {
    const { d, form } = krok2Dom(web);
    Object.keys(ZAKAZNIK_J).forEach((id) => { const e = d.getElementById(id); if (e) e.value = ZAKAZNIK_J[id]; });
    form.querySelectorAll(".consents input[type=checkbox]").forEach((e) => {
      eq(e.matches(POVINNY_SUHLAS), K.jePovinne(e), web + " " + e.id + ": CSS štítok vs jePovinne");
      if (K.jePovinne(e)) eq(e.matches(K.SELEKTOR_POLI), true, web + " " + e.id + ": povinný súhlas mimo SELEKTOR_POLI");
    });
    const c = d.querySelector('#order-form input[name="consents[]"]');
    c.removeAttribute("required");
    c.className = "js-validate-required";
    c.checked = false;
    eq(c.matches(POVINNY_SUHLAS) && K.jePovinne(c), true, web + ": len js-validate-required je stále povinný (štítok)");
    const z = K.prvaChyba(form, null, VID);
    eq(z && [z.el.id, z.dovod], [c.id, "prazdne"], web + ": prvá chyba pri súhlase len s js-validate-required");
    c.checked = true;
    eq(K.prvaChyba(form, null, VID), null, web + ": po zaškrtnutí nič");
  }
});

t("polozky: fotka — len malý náhľad cez http(s), košík -> sessionStorage -> krok 2", () => {
  eq([P.platnaFotka("https://cdn.myshoptet.com/usr/x/user/shop/related/598-15_a.jpg?x=100&y=100"), P.platnaFotka("data:image/svg+xml,%3Csvg"),
    P.platnaFotka("https://cdn.myshoptet.com/usr/x/user/shop/orig/598-15_a.jpg"), P.platnaFotka('https://x/"onerror=1'), P.platnaFotka(null)], [true, false, false, false, false]);
  const d = new JSDOM(fx("sk-set/kosik.html")).window.document;
  const ss = new JSDOM("", { url: "https://www.luxurycardesign.sk/" }).window.sessionStorage;
  const m = P.ulozFotky(d, ss);
  eq(Object.keys(m), ["6c240b96-513f-11f0-b348-4e595e8a4f93|598/DIA3"], "kľúč = data-micro-identifier|data-micro-sku");
  over_(/related\/598-15_.*x=100&y=100/.test(m["6c240b96-513f-11f0-b348-4e595e8a4f93|598/DIA3"]), "URL malého náhľadu z data-src: " + JSON.stringify(m));
  eq(P.citajFotky(ss), m, "čítanie späť");
  ss.setItem(P.KLUC_FOTIEK, "{zle");
  eq(P.citajFotky(ss), {}, "poškodená mapa = bez fotiek");
  eq(P.citajFotky(null), {}, "bez sessionStorage = bez fotiek");
});

/** Rozpis setu ako po cart.js changeDescription (lcdVlozRozpis: ul.lcd-rozpis hneď za odkazom s názvom). 1v a 2v. */
const ROZPIS_1V = [["Auto", "Skoda Octavia 2021 Combi"], ["Farba 1. vrstvy", "Diamond Farba kože: Čierna / Farba šitia: Červená"], ["Rozloženie kobercov", "prvý a druhý rad"]];
const ROZPIS_2V = [ROZPIS_1V[0], ROZPIS_1V[1], ["Farba 2. vrstvy", "Lux Color 10"], ROZPIS_1V[2]];
const textyLi = (koren) => Array.prototype.map.call(koren.querySelectorAll("li"), (li) => li.textContent.replace(/\s+/g, " ").trim());

/** Súhrn kroku 2 so setom (sk-set/krok2.html) a rozpisom ako po cart.js changeDescription. */
function suhrnSRozpisom(riadky = ROZPIS_1V) {
  const w = new JSDOM(fx("sk-set/krok2.html"), { url: "https://www.luxurycardesign.sk/objednavka/krok-2/" }).window;
  const d = w.document;
  const box = d.getElementById("summary-box");
  const a = box.querySelector(".cart-item a.main-link");
  const ul = d.createElement("ul");
  ul.className = "lcd-rozpis";
  ul.innerHTML = riadky.map(([n, h]) => '<li><span class="lcd-rozpis__n">' + n + ': </span><span class="lcd-rozpis__h">' + h + "</span></li>").join("");
  a.after(ul);
  return { d, box, ul };
}

/** Značka A1 (Michal 30. 10. 2026) na riadku rozpisu, ktorý sa ukáže až po „Zobraziť viac“. Inak sa rozpis nemení. */
const DALSI = "lcd-opc-dalsi";
const bezZnaciek = (html) => html.replace(/ class="lcd-opc-dalsi"/g, "").replace(/ ?\blcd-opc-dalsi\b/g, "").replace(/ class=""/g, "");
/** Riadky rozpisu (li; pri kamióne „dt: dd“), ktoré sú vidno hneď (dalsi = false) alebo až po „Zobraziť viac“ (dalsi = true). */
const riadkyA1 = (koren, dalsi) => Array.prototype.filter.call(koren.querySelectorAll("li, dt"), (e) => !!e.closest("." + DALSI) === dalsi)
  .map((e) => (e.tagName === "DT" ? e.textContent + ": " + (e.nextElementSibling ? e.nextElementSibling.textContent : "") : e.textContent).replace(/\s+/g, " ").trim());
const hnedVidno = (k) => riadkyA1(k, false), poViac = (k) => riadkyA1(k, true);

/** Karta detailu = len natívny rozpis košíka (náhľad 5), od A1 vždy viditeľná pod názvom (bez [hidden]); v rozpise pribudne
 *  len značka lcd-opc-dalsi na riadkoch „až po Zobraziť viac“ — inak bez zmeny, rovnaké riadky, nič pridané. */
function overDetailJeRozpis(det, rozpis, rozpisPred, riadkyKosika, kde) {
  over_(det.contains(rozpis), kde + ": natívny rozpis nie je v karte detailu");
  eq([det.children.length, det.firstElementChild === rozpis, det.hidden, det.hasAttribute("hidden")], [1, true, false, false], kde + ": karta detailu = len natívny rozpis, viditeľná: " + det.outerHTML.slice(0, 160));
  eq(bezZnaciek(rozpis.outerHTML) === rozpisPred, true, kde + ": rozpis košíka sa v karte zmenil (okrem značky lcd-opc-dalsi): " + rozpis.outerHTML.slice(0, 200));
  eq(textyLi(det), riadkyKosika, kde + ": riadky karty ≠ riadky rozpisu košíka");
  eq(det.querySelectorAll("img, .lcd-opc-bodka, .lcd-opc-nesedi, .lcd-opc-detail__navyse, a, button").length, 0, kde + ": obrázok, gulička, počet / cena, odkaz alebo tlačidlo v karte");
  over_(!/Počet|Cena|nesedí|Upravi[tť] v košíku/.test(det.textContent), kde + ": v karte je Počet / Cena / „Niečo nesedí“: " + det.textContent.replace(/\s+/g, " ").slice(0, 160));
}

t("texty A1: „Zobraziť viac“ / „Zobraziť menej“ (CZ „Zobrazit více“ / „Zobrazit méně“) bez počtu skrytých; „Zobraziť detail“ / „Skryť detail“ preč", () => {
  eq([TS.zobrazitViac, TS.zobrazitMenej, TC.zobrazitViac, TC.zobrazitMenej], ["Zobraziť viac", "Zobraziť menej", "Zobrazit více", "Zobrazit méně"]);
  for (const web of ["sk", "cz"]) eq(["zobrazitDetail", "skrytDetail"].filter((k) => k in TEXTY[web]), [], web + ": staré texty zobáčika");
});

t("polozky A1: set 1v — pod názvom hneď Auto a Farba 1. vrstvy, Rozloženie až po „Zobraziť viac“ (button bez počtu, aria-expanded, aria-controls na kartu), „Zobraziť menej“ zbalí; fotka a súhrn Shoptetu bez zmeny", () => {
  const { d, box, ul } = suhrnSRozpisom();
  const rozpisPred = ul.outerHTML, riadkyKosika = textyLi(ul);
  eq(riadkyKosika, ["Auto: Skoda Octavia 2021 Combi", "Farba 1. vrstvy: Diamond Farba kože: Čierna / Farba šitia: Červená", "Rozloženie kobercov: prvý a druhý rad"], "rozpis košíka (fixture)");
  const pred = { nazov: box.querySelector(".cart-item a.main-link").textContent, ks: box.querySelector(".cart-item-amount").textContent,
    cena: box.querySelector(".cart-item-price").textContent, celkom: box.querySelector('[data-testid="recapFullPrice"]').textContent };
  const otvorene = {};
  const foto = "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/shop/related/598-15_a.jpg?x=100&y=100";
  eq(P.rozsirPolozky(box, TS, { fotky: { "6c240b96-513f-11f0-b348-4e595e8a4f93|598/DIA3": foto }, otvorene }), 1);
  const p = box.querySelector(".cart-item");
  const img = p.querySelector(":scope > img.lcd-opc-foto");
  eq([img.getAttribute("src"), img.getAttribute("width"), img.getAttribute("height"), img.getAttribute("alt"), p.firstElementChild === img], [foto, "60", "60", "", true], "fotka");
  const det = p.querySelector(":scope > div.lcd-opc-detail"), z = p.querySelector(":scope > button.lcd-opc-zob");
  over_(det && z, "chýba karta detailu alebo tlačidlo „Zobraziť viac“");
  eq([z.getAttribute("type"), z.getAttribute("aria-expanded"), z.getAttribute("aria-controls"), z.textContent, p.classList.contains("lcd-opc-otvorena")],
    ["button", "false", det.id, "Zobraziť viac", false], "zbalené");
  over_(det.compareDocumentPosition(z) & 4, "tlačidlo nie je pod rozpisom (poradie v DOM = poradie čítania)");
  eq(hnedVidno(det), ["Auto: Skoda Octavia 2021 Combi", "Farba 1. vrstvy: Diamond Farba kože: Čierna / Farba šitia: Červená"], "hneď vidno");
  eq(poViac(det), ["Rozloženie kobercov: prvý a druhý rad"], "až po „Zobraziť viac“");
  over_(!p.querySelector(".cart-item-name ul.lcd-rozpis"), "natívny ul.lcd-rozpis ostal aj pod názvom (kópia, nie presun)");
  eq(d.querySelectorAll("ul.lcd-rozpis").length, 1, "rozpis jeden");
  overDetailJeRozpis(det, ul, rozpisPred, riadkyKosika, "set 1v");
  // obsah a čísla súhrnu Shoptetu sa nemenia; názov len veľkým začiatočným písmenom (doladenie 2)
  eq({ nazov: box.querySelector(".cart-item a.main-link").textContent, ks: box.querySelector(".cart-item-amount").textContent,
    cena: box.querySelector(".cart-item-price").textContent, celkom: box.querySelector('[data-testid="recapFullPrice"]').textContent },
    Object.assign({}, pred, { nazov: pred.nazov.replace(/\S/, (c) => c.toLocaleUpperCase("sk")) }), "súhrn Shoptetu bez zmeny okrem veľkého začiatočného písmena");
  // „Zobraziť viac“ -> „Zobraziť menej“: položka rozbalená (CSS ukáže riadky lcd-opc-dalsi a celý názov)
  eq(P.prepniDetail(z.querySelector(".lcd-opc-zob__text"), box, TS, otvorene), true);
  eq([z.getAttribute("aria-expanded"), z.textContent, det.hidden, p.classList.contains("lcd-opc-otvorena")], ["true", "Zobraziť menej", false, true], "rozbalené");
  eq(P.prepniDetail(box.querySelector(".cart-item-price"), box, TS, otvorene), null, "klik mimo tlačidla nič");
  // opakované volanie (prekreslenie): nič sa nezdvojí, stav ostane, rozpis sa nezmení
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene });
  eq([p.querySelectorAll(".lcd-opc-zob").length, p.querySelectorAll(".lcd-opc-foto").length, p.querySelectorAll(".lcd-opc-detail").length, z.getAttribute("aria-expanded"), z.textContent],
    [1, 1, 1, "true", "Zobraziť menej"]);
  eq([hnedVidno(det).length, poViac(det).length], [2, 1], "značky po opakovanom volaní");
  overDetailJeRozpis(det, ul, rozpisPred, riadkyKosika, "set 1v po opakovanom volaní");
  // nový HTML zo servera s uloženým stavom (innerHTML = potvrdený súhrn): stav sa vráti, poslucháč netreba (delegovaný)
  const html = box.innerHTML;
  box.innerHTML = html;
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  eq([box.querySelector(".lcd-opc-zob").getAttribute("aria-expanded"), box.querySelector(".lcd-opc-zob").textContent, box.querySelector(".cart-item").classList.contains("lcd-opc-otvorena")],
    ["false", "Zobraziť viac", false], "bez zapamätaného stavu zbalené");
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene });
  eq([box.querySelector(".lcd-opc-zob").getAttribute("aria-expanded"), d.getElementById("lcd-opc-detail-1").hidden], ["true", false], "zapamätaný stav po prekreslení");
  eq(textyLi(d.getElementById("lcd-opc-detail-1")), riadkyKosika, "riadky karty po prekreslení");
  eq(P.prepniDetail(box.querySelector(".lcd-opc-zob"), box, TS, otvorene), false, "„Zobraziť menej“ zbalí");
  eq([box.querySelector(".lcd-opc-zob").textContent, box.querySelector(".cart-item").classList.contains("lcd-opc-otvorena"), otvorene["6c240b96-513f-11f0-b348-4e595e8a4f93#0"]],
    ["Zobraziť viac", false, false], "zbalené a zapamätané");
});

t("polozky A1: set 2v — hneď Auto, Farba 1. a Farba 2. vrstvy („Farba 2. vrstvy: Lux Color 10“ ako v košíku), Rozloženie až po „Zobraziť viac“", () => {
  const { box, ul } = suhrnSRozpisom(ROZPIS_2V);
  const rozpisPred = ul.outerHTML, riadkyKosika = textyLi(ul);
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  const p = box.querySelector(".cart-item"), det = p.querySelector(":scope > .lcd-opc-detail");
  eq([p.classList.contains("lcd-opc-s-fotkou"), !!p.querySelector(":scope > .lcd-opc-zob")], [false, true], "bez fotky, s tlačidlom");
  overDetailJeRozpis(det, ul, rozpisPred, riadkyKosika, "set 2v");
  eq(hnedVidno(det), ["Auto: Skoda Octavia 2021 Combi", "Farba 1. vrstvy: Diamond Farba kože: Čierna / Farba šitia: Červená", "Farba 2. vrstvy: Lux Color 10"], "hneď vidno");
  eq(poViac(det), ["Rozloženie kobercov: prvý a druhý rad"], "až po „Zobraziť viac“");
});

t("polozky A1: hneď vidno podľa názvu riadku, nie podľa poradia (Rozloženie navrchu, riadok bez názvu); CZ „Barva 1./2. vrstvy“", () => {
  const { box } = suhrnSRozpisom([["Rozloženie kobercov", "prvý a druhý rad"], ["Auto", "Skoda Octavia 2021 Combi"], ["Farba 1. vrstvy", "Diamond Čierna"]]);
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  const det = box.querySelector(".lcd-opc-detail");
  eq([hnedVidno(det), poViac(det)], [["Auto: Skoda Octavia 2021 Combi", "Farba 1. vrstvy: Diamond Čierna"], ["Rozloženie kobercov: prvý a druhý rad"]], "SK");
  const w = new JSDOM(fx("cz/krok2.html"), { url: "https://www.luxurycardesign.cz/objednavka/krok-2/" }).window;
  const bc = w.document.getElementById("summary-box"), pc = bc.querySelector(".cart-item");
  const ul = w.document.createElement("ul");
  ul.className = "lcd-rozpis";
  ul.innerHTML = [["Auto", "Škoda Octavia 2021 Combi"], ["Barva 1. vrstvy", "Diamond Černá"], ["Barva 2. vrstvy", "Lux Color 10"], ["Rozložení koberců", "první a druhá řada"]]
    .map(([n, h]) => '<li><span class="lcd-rozpis__n">' + n + ': </span><span class="lcd-rozpis__h">' + h + "</span></li>").join("");
  pc.querySelector("a.main-link").after(ul);
  const li0 = w.document.createElement("li");
  li0.innerHTML = '<span class="lcd-rozpis__h">Combi</span>'; // zvyšok variantu bez názvu (kosikRozpis.js lcdRozpis)
  ul.insertBefore(li0, ul.firstChild);
  P.rozsirPolozky(bc, TC, { fotky: {}, otvorene: {} });
  const dc = bc.querySelector(".lcd-opc-detail");
  eq(hnedVidno(dc), ["Auto: Škoda Octavia 2021 Combi", "Barva 1. vrstvy: Diamond Černá", "Barva 2. vrstvy: Lux Color 10"], "CZ hneď vidno");
  eq(poViac(dc), ["Combi", "Rozložení koberců: první a druhá řada"], "CZ až po „Zobrazit více“");
  eq(bc.querySelector(".lcd-opc-zob").textContent, "Zobrazit více", "CZ tlačidlo");
});

t("polozky A1: CZ vzorkovník — 1 vzorka bez tlačidla (nič sa neskrýva), 3 vzorky = prvé 2 hneď + „Zobrazit více“; späť na 2 = tlačidlo preč; položka bez rozpisu nič", () => {
  const w = new JSDOM(fx("cz/krok2.html"), { url: "https://www.luxurycardesign.cz/objednavka/krok-2/" }).window;
  const d = w.document, box = d.getElementById("summary-box");
  eq(P.rozsirPolozky(box, TC, { fotky: {}, otvorene: {} }), 1);
  const p = box.querySelector(".cart-item");
  eq([!!p.querySelector(".lcd-opc-foto"), p.classList.contains("lcd-opc-s-fotkou"), p.querySelectorAll(".lcd-opc-zob, .lcd-opc-detail").length, p.classList.contains("lcd-opc-otvorena")],
    [false, false, 0, false], "bez rozpisu: bez fotky, tlačidla a karty");
  P.rozsirPolozky(box, TC, { fotky: {}, otvorene: {} });
  eq(p.querySelectorAll(".lcd-opc-zob, .lcd-opc-detail").length, 0, "opakované volanie bez rozpisu nič nepridá");
  // vzorkovník CZ: rozpis ako po cart.js (lcdRozpis z príplatku „Vzorek 2. vrstva – Lux Color 01 (LUX-01) - Ano“)
  const ul = d.createElement("ul");
  ul.className = "lcd-rozpis";
  ul.innerHTML = '<li><span class="lcd-rozpis__n">Vzorek 2. vrstva: </span><span class="lcd-rozpis__h">Lux Color 01 (LUX-01) - Ano</span></li>';
  p.querySelector("a.main-link").after(ul);
  const rozpisPred = ul.outerHTML, riadkyKosika = textyLi(ul);
  P.rozsirPolozky(box, TC, { fotky: {}, otvorene: {} });
  const det = p.querySelector(":scope > .lcd-opc-detail");
  eq([!!det, p.querySelectorAll(".lcd-opc-zob").length, p.querySelectorAll("." + DALSI).length], [true, 0, 0], "1 vzorka: rozpis pod názvom, bez tlačidla");
  overDetailJeRozpis(det, ul, rozpisPred, riadkyKosika, "CZ vzorkovník 1 vzorka");
  // 3 vzorky (rozpis doplnený / prekreslený): prvé 2 hneď, tretia po „Zobrazit více“
  ["Lux Color 10 (LUX-10) - Ano", "Lux Color 13 (LUX-13) - Ano"].forEach((h) => { const li = ul.firstElementChild.cloneNode(true); li.lastElementChild.textContent = h; ul.appendChild(li); });
  const otv = {};
  P.rozsirPolozky(box, TC, { fotky: {}, otvorene: otv });
  const z = p.querySelector(":scope > .lcd-opc-zob");
  eq([z && z.textContent, z && z.getAttribute("aria-controls"), p.querySelectorAll(".lcd-opc-detail").length], ["Zobrazit více", det.id, 1], "CZ tlačidlo po doplnení vzoriek");
  eq(hnedVidno(det), ["Vzorek 2. vrstva: Lux Color 01 (LUX-01) - Ano", "Vzorek 2. vrstva: Lux Color 10 (LUX-10) - Ano"], "prvé 2 hneď");
  eq(poViac(det), ["Vzorek 2. vrstva: Lux Color 13 (LUX-13) - Ano"], "tretia až po „Zobrazit více“");
  P.prepniDetail(z, box, TC, otv);
  eq([z.textContent, p.classList.contains("lcd-opc-otvorena")], ["Zobrazit méně", true], "CZ rozbalené");
  // späť na 2 vzorky: nič sa neskrýva -> tlačidlo preč, položka nie je „rozbalená“, žiadna značka
  ul.lastElementChild.remove();
  P.rozsirPolozky(box, TC, { fotky: {}, otvorene: otv });
  eq([p.querySelectorAll(".lcd-opc-zob").length, p.querySelectorAll("." + DALSI).length, p.classList.contains("lcd-opc-otvorena"), hnedVidno(det).length], [0, 0, false, 2],
    "2 vzorky: bez tlačidla, všetko hneď");
  over_(!/class=""/.test(det.innerHTML), "po odznačení ostal prázdny atribút class: " + det.innerHTML.slice(0, 200));
});

t("polozky N2 (revízia A1): bez pilulky celý názov — položka, pri ktorej sa nič neskrýva (aj bez rozpisu), má triedu lcd-opc-cely-nazov (CSS zruší orezanie na 2 riadky); s pilulkou nie; prekreslenie triedu prepočíta; kópia navrchu ju nemá", () => {
  const CELY = "lcd-opc-cely-nazov";
  const w = new JSDOM(fx("cz/krok2.html"), { url: "https://www.luxurycardesign.cz/objednavka/krok-2/" }).window;
  const d = w.document, box = d.getElementById("summary-box");
  P.rozsirPolozky(box, TC, { fotky: {}, otvorene: {} });
  const p = box.querySelector(".cart-item");
  eq([p.querySelectorAll(".lcd-opc-zob").length, p.classList.contains(CELY)], [0, true], "bez rozpisu: bez pilulky, celý názov");
  const ul = d.createElement("ul");
  ul.className = "lcd-rozpis";
  ul.innerHTML = '<li><span class="lcd-rozpis__n">Vzorek 2. vrstva: </span><span class="lcd-rozpis__h">Lux Color 01 (LUX-01) - Ano</span></li>';
  p.querySelector("a.main-link").after(ul);
  P.rozsirPolozky(box, TC, { fotky: {}, otvorene: {} });
  eq([p.querySelectorAll(".lcd-opc-zob").length, p.classList.contains(CELY)], [0, true], "1 vzorka: nič sa neskrýva, celý názov");
  ["Lux Color 10 (LUX-10) - Ano", "Lux Color 13 (LUX-13) - Ano"].forEach((h) => { const li = ul.firstElementChild.cloneNode(true); li.lastElementChild.textContent = h; ul.appendChild(li); });
  const otv = {};
  P.rozsirPolozky(box, TC, { fotky: {}, otvorene: otv });
  eq([p.querySelectorAll(".lcd-opc-zob").length, p.classList.contains(CELY)], [1, false], "3 vzorky: pilulka, zbalený názov na 2 riadky (celý po „Zobrazit více“)");
  const k = P.vycistiKopiu(p.cloneNode(true), TC, otv);
  eq(k.classList.contains(CELY), false, "kópia navrchu bez triedy (názov tam orezaný nie je)");
  ul.lastElementChild.remove();
  P.rozsirPolozky(box, TC, { fotky: {}, otvorene: otv });
  eq([p.querySelectorAll(".lcd-opc-zob").length, p.classList.contains(CELY)], [0, true], "späť na 2 vzorky: bez pilulky, celý názov");
  const k2 = P.vycistiKopiu(p.cloneNode(true), TC, otv);
  eq(k2.classList.contains(CELY), false, "kópia bez pilulky bez triedy");
  // set 1v (Rozloženie po „Zobraziť viac“): pilulka, bez triedy
  const { box: bs } = suhrnSRozpisom();
  P.rozsirPolozky(bs, TS, { fotky: {}, otvorene: {} });
  eq([bs.querySelectorAll(".cart-item .lcd-opc-zob").length, bs.querySelector(".cart-item").classList.contains(CELY)], [1, false], "set 1v: pilulka, bez triedy");
});

t("CSS N2 (revízia A1): celý názov v súhrne pri rozbalenej položke AJ pri položke bez pilulky (lcd-opc-cely-nazov) — display:block, bez line-clamp", () => {
  const scss = readFileSync(new URL("../assets/css/_lcdOpc.scss", import.meta.url), "utf8");
  over_(/^html\.lcd-opc body\.in-krok-2 #summary-box \.cart-item:is\(\.lcd-opc-otvorena,\.lcd-opc-cely-nazov\) \.cart-item-name a\.main-link\{display:block;-webkit-line-clamp:none\}$/m.test(scss),
    "chýba pravidlo celého názvu pre .lcd-opc-otvorena aj .lcd-opc-cely-nazov");
});

t("polozky A1: kópia pre zbalený súhrn navrchu — bez fotky, rozpis pod názvom, VLASTNÉ tlačidlo pod rozpisom (iné id, aria-controls na rozpis kópie, popis = názov), stav kópie nezávislý od súhrnu; bez textov (T) bez tlačidla a celý rozpis", () => {
  const { d, box, ul } = suhrnSRozpisom(ROZPIS_2V);
  const riadkyKosika = textyLi(ul);
  const otv = {};
  P.rozsirPolozky(box, TS, { fotky: { "6c240b96-513f-11f0-b348-4e595e8a4f93|598/DIA3": "https://x.sk/a.jpg" }, otvorene: otv });
  const p = box.querySelector(".cart-item");
  P.prepniDetail(p.querySelector(".lcd-opc-zob"), box, TS, otv); // súhrn pri Objednať rozbalený
  const hore = d.createElement("div");
  d.body.appendChild(hore);
  const k = P.vycistiKopiu(p.cloneNode(true), TS, {});
  hore.appendChild(k);
  eq(k.querySelectorAll(".lcd-opc-foto, .lcd-opc-detail, .lcd-opc-bodka, img").length, 0, "bez fotky a karty");
  const meno = k.querySelector(".cart-item-name"), r = meno.querySelector(":scope > ul.lcd-rozpis"), zz = k.querySelectorAll(".lcd-opc-zob"), z = zz[0];
  eq([zz.length, !!r, !!z && z.parentElement === meno, !!r && r.nextElementSibling === z], [1, true, true, true], "tlačidlo pod rozpisom v názve");
  eq(textyLi(r), riadkyKosika, "riadky kópie = rozpis košíka");
  eq([z.getAttribute("aria-expanded"), z.textContent, k.classList.contains("lcd-opc-otvorena")], ["false", "Zobraziť viac", false], "kópia zbalená, hoci súhrn je rozbalený");
  eq([hnedVidno(r).length, poViac(r)], [3, ["Rozloženie kobercov: prvý a druhý rad"]], "značky v kópii");
  over_(r.id && z.getAttribute("aria-controls") === r.id && !box.contains(d.getElementById(r.id)), "aria-controls kópie neukazuje na rozpis kópie: " + z.getAttribute("aria-controls"));
  const ids = Array.prototype.map.call(d.querySelectorAll('[id^="lcd-opc"]'), (e) => e.id); // stránka Shoptetu má vlastné duplicity
  eq(ids.filter((id, i) => ids.indexOf(id) !== i), [], "duplicitné id OPC v dokumente");
  const popis = (z.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean).map((id) => (d.getElementById(id) || {}).textContent || "").join(" ");
  over_(/luxusné autokoberce dragonskin/i.test(popis) && !/Rozloženie|Zobrazi/.test(popis), "popis tlačidla kópie nie je názov položky: " + popis);
  eq(P.prepniDetail(z, hore, TS, null), true, "klik v kópii");
  eq([z.textContent, k.classList.contains("lcd-opc-otvorena")], ["Zobraziť menej", true], "kópia rozbalená");
  eq(P.prepniDetail(z, box, TS, otv), null, "tlačidlo kópie nepatrí súhrnu");
  eq([p.querySelector(".lcd-opc-zob").textContent, p.classList.contains("lcd-opc-otvorena")], ["Zobraziť menej", true], "súhrn pri Objednať bez zmeny");
  // zapamätaný stav kópie (vzhlad.js obnovZbalenySuhrn ho prenesie cez prekreslenie)
  const k2 = P.vycistiKopiu(p.cloneNode(true), TS, { [z.getAttribute("data-lcd-opc-kluc")]: true });
  eq([k2.querySelector(".lcd-opc-zob").textContent, k2.classList.contains("lcd-opc-otvorena")], ["Zobraziť menej", true], "zapamätaný stav kópie");
  // bez textov: kópia bez tlačidla a s celým rozpisom (ako pred A1)
  const k3 = P.vycistiKopiu(p.cloneNode(true));
  eq([k3.querySelectorAll(".lcd-opc-zob, ." + DALSI).length, k3.classList.contains("lcd-opc-otvorena"), !!k3.querySelector(".cart-item-name > ul.lcd-rozpis")], [0, false, true], "bez T");
  eq(box.querySelectorAll(".lcd-opc-zob").length, 1, "originál bez zmeny");
  // položka bez rozpisu: kópia = položka bez fotky
  const w = new JSDOM(fx("cz/krok2.html"), { url: "https://www.luxurycardesign.cz/objednavka/krok-2/" }).window;
  const bc = w.document.getElementById("summary-box");
  P.rozsirPolozky(bc, TC, { fotky: {}, otvorene: {} });
  const kc = P.vycistiKopiu(bc.querySelector(".cart-item").cloneNode(true), TC, {});
  eq([kc.querySelectorAll(".lcd-opc-foto, .lcd-opc-zob, .lcd-opc-detail").length, !!kc.querySelector(".cart-item-name a.main-link")], [0, true], "kópia položky bez rozpisu");
});

t("zbalený súhrn navrchu A1: obnovZbalenySuhrn dá kópii tlačidlo „Zobraziť viac“, ťuk v kópii (delegovaný na <details>) rozbalí len kópiu a stav prežije prekreslenie", () => {
  const { d, box } = suhrnSRozpisom(ROZPIS_2V);
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  const zb = V.vytvorZbalenySuhrn(d, TS);
  d.body.appendChild(zb);
  V.obnovZbalenySuhrn(zb, box, TS);
  let z = zb.querySelector(".lcd-opc-zbalene__polozky .lcd-opc-zob");
  eq([z && z.textContent, z && z.getAttribute("aria-expanded")], ["Zobraziť viac", "false"], "kópia s tlačidlom");
  eq(P.prepniDetail(z.querySelector(".lcd-opc-zob__text"), zb, TS, null), true);
  V.obnovZbalenySuhrn(zb, box, TS);
  z = zb.querySelector(".lcd-opc-zbalene__polozky .lcd-opc-zob");
  eq([z.textContent, z.getAttribute("aria-expanded"), zb.querySelector(".lcd-opc-zbalene__polozky .cart-item").classList.contains("lcd-opc-otvorena")], ["Zobraziť menej", "true", true], "po prekreslení rozbalené");
  eq([box.querySelector(".lcd-opc-zob").textContent, zb.querySelectorAll(".lcd-opc-zbalene__polozky .lcd-opc-zob").length], ["Zobraziť viac", 1], "súhrn pri Objednať zbalený, v kópii 1 tlačidlo");
  over_(zb.querySelector(".lcd-opc-zbalene__upravit"), "„Upraviť košík“ v zbalenom súhrne ostáva");
});

t("polozky A1: kamión (karty skupín) — hneď Vozidlo a prvé „Typ a farba materiálu“, ostatné riadky aj celé skupiny až po „Zobraziť viac“ (dt aj dd spolu); span presunutý bez zmeny", () => {
  const w = new JSDOM(fx("sk-kamion/krok2.html"), { url: "https://www.luxurycardesign.sk/objednavka/krok-2/" }).window;
  const d = w.document, box = d.getElementById("summary-box");
  const span = box.querySelector(".cart-item span.main-link-surcharges");
  const sk = (h, r) => '<div class="lcd-truck-cart-summary__group"><h4>' + h + "</h4><dl>" + r.map(([a, b]) => "<dt>" + a + "</dt><dd>" + b + "</dd>").join("") + "</dl></div>";
  span.innerHTML = '<div class="lcd-truck-cart-summary">' + sk("ŠPECIFIKÁCIA VOZIDLA", [["Vozidlo", "DAF (TIR) XF 2022-2025"], ["Typ prevodovky", "Automatická prevodovka"]]) +
    sk("KOBERČEKY POD SEDAČKY", [["Typ a farba materiálu", "Prémiová syntetická koža – prešívaná – čierna – 11"], ["Farba lemovania", "čierny základ – 04"]]) +
    sk("TAPACÍR DVERÍ", [["Typ a farba materiálu", "Rovnaký ako koberčeky"], ["Farba lemovania", "Rovnaká"]]) + "</div>";
  const pred = span.outerHTML;
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  const det = box.querySelector(".lcd-opc-detail");
  over_(det.contains(span) && !box.querySelector(".cart-item-name span.main-link-surcharges"), "rozpis kamióna je v karte");
  eq([det.children.length, det.firstElementChild === span, bezZnaciek(span.outerHTML) === pred, det.hidden], [1, true, true, false], "karta = len natívny rozpis kamióna (okrem značiek), viditeľná");
  eq(hnedVidno(det), ["Vozidlo: DAF (TIR) XF 2022-2025", "Typ a farba materiálu: Prémiová syntetická koža – prešívaná – čierna – 11"], "hneď vidno");
  eq(poViac(det), ["Typ prevodovky: Automatická prevodovka", "Farba lemovania: čierny základ – 04", "Typ a farba materiálu: Rovnaký ako koberčeky", "Farba lemovania: Rovnaká"], "až po „Zobraziť viac“");
  Array.prototype.forEach.call(det.querySelectorAll("dt"), (dt) => eq(!!dt.closest("." + DALSI), !!dt.nextElementSibling.closest("." + DALSI), "dt a dd spolu: " + dt.textContent));
  const skupiny = Array.prototype.map.call(det.querySelectorAll(".lcd-truck-cart-summary__group"), (g) => g.querySelector("h4").textContent + " " + g.classList.contains(DALSI));
  eq(skupiny, ["ŠPECIFIKÁCIA VOZIDLA false", "KOBERČEKY POD SEDAČKY false", "TAPACÍR DVERÍ true"], "skupina bez riadku hneď je celá až po „Zobraziť viac“");
  eq(box.querySelector(".lcd-opc-zob").textContent, "Zobraziť viac", "tlačidlo");
  eq(det.querySelectorAll(".lcd-opc-bodka, img").length, 0, "bez guličiek a obrázkov");
});

t("polozky A1: kamión bez súhrnu (.info-wrap, iná karta) — hneď Vozidlo, Typ materiálu a Farba materiálu (to isté ako „Typ a farba materiálu“), zvyšok po „Zobraziť viac“; prázdny zoznam sa skryje celý", () => {
  const w = new JSDOM(fx("sk-kamion/krok2.html"), { url: "https://www.luxurycardesign.sk/objednavka/krok-2/" }).window;
  const d = w.document, box = d.getElementById("summary-box");
  const span = box.querySelector(".cart-item span.main-link-surcharges");
  span.innerHTML = '<div class="info-wrap"><ul class="model"><li>Vozidlo: Volvo FH 4 (2013+)</li></ul><div class="setup"><span><ul>' +
    ["Typ materiálu - Prémiová syntetická koža – prešívaná", "Farba materiálu - čierna, čierne šitie – 11", "Farba lemovania - čierny základ – 04", "Tapacír - Áno"].map((x) => "<li>" + x + "</li>").join("") +
    "</ul></span></div></div>";
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  const det = box.querySelector(".lcd-opc-detail");
  eq(hnedVidno(det), ["Vozidlo: Volvo FH 4 (2013+)", "Typ materiálu - Prémiová syntetická koža – prešívaná", "Farba materiálu - čierna, čierne šitie – 11"], "hneď vidno");
  eq(poViac(det), ["Farba lemovania - čierny základ – 04", "Tapacír - Áno"], "až po „Zobraziť viac“");
  // bez vozidla: zoznam ul.model nemá čo ukázať hneď -> skrytý celý (žiadny prázdny okraj)
  const w2 = new JSDOM(fx("sk-kamion/krok2.html"), { url: "https://www.luxurycardesign.sk/objednavka/krok-2/" }).window;
  const b2 = w2.document.getElementById("summary-box");
  b2.querySelector(".cart-item span.main-link-surcharges").innerHTML = '<div class="info-wrap"><ul class="model"><li>Rok: 2020</li></ul><div class="setup"><span><ul>' +
    ["Typ materiálu - Koža", "Farba materiálu - čierna", "Tapacír - Nie"].map((x) => "<li>" + x + "</li>").join("") + "</ul></span></div></div>";
  P.rozsirPolozky(b2, TS, { fotky: {}, otvorene: {} });
  const d2 = b2.querySelector(".lcd-opc-detail");
  eq([hnedVidno(d2), d2.querySelector("ul.model").classList.contains(DALSI)], [["Typ materiálu - Koža", "Farba materiálu - čierna"], true], "ul.model celý po „Zobraziť viac“");
});

t("CSS A1: riadky lcd-opc-dalsi skryté len v zbalenej položke (súhrn aj kópia navrchu), karta detailu bez [hidden], tlačidlo 16 px aj v kópii navrchu", () => {
  const scss = readFileSync(new URL("../assets/css/_lcdOpc.scss", import.meta.url), "utf8").split("\n");
  const skry = scss.filter((r) => /\.lcd-opc-dalsi/.test(r) && /^\s*html/.test(r)); // pravidlá, nie komentáre
  eq(skry.length, 1, "pravidlo pre lcd-opc-dalsi: " + JSON.stringify(skry));
  over_(/^html\.lcd-opc \.cart-item:not\(\.lcd-opc-otvorena\) \.lcd-opc-dalsi\{display:none !important\}$/.test(skry[0].trim()), "pravidlo: " + skry[0]);
  eq(scss.filter((r) => /lcd-opc-detail\[hidden\]/.test(r)).length, 0, "pravidlo pre skrytú kartu detailu ostalo");
  const i = scss.findIndex((r) => /\.lcd-opc-zob\{/.test(r));
  over_(i >= 0 && /:is\(#summary-box,#lcd-opc-zbalene\) \.lcd-opc-zob\{/.test(scss[i]) && /font:700 16px/.test(scss[i] + scss[i + 1]), "tlačidlo bez 16 px alebo len v #summary-box: " + scss[i]);
});

t("kosik: vzhľad v štýle pokladne hneď pri načítaní bundla (?opc=KÓD), späť pri vypnutí v data.json; bez kódu (aj ?opc=1) nič", () => {
  const { vzhladKosikaSkoro } = B;
  const { zrusVzhladKosika } = KO;
  const mk = (url) => {
    const w = new JSDOM(fx("sk-set/kosik.html"), { url }).window;
    w.shoptetData = { projectId: 562035 };
    return w;
  };
  const stare = { w: globalThis.window, d: globalThis.document, s: globalThis.sessionStorage, l: globalThis.localStorage };
  const pouzi = (w) => { globalThis.window = w; globalThis.document = w.document; globalThis.sessionStorage = w.sessionStorage; globalThis.localStorage = w.localStorage; };
  try {
    let w = mk("https://www.luxurycardesign.sk/kosik/");
    pouzi(w);
    const povodne = w.document.documentElement.outerHTML;
    eq(vzhladKosikaSkoro(w.document, ""), false, "bez kódu");
    eq(vzhladKosikaSkoro(w.document, "?opc=1"), false, "?opc=1 (bez kódu)");
    eq([w.document.documentElement.classList.contains("lcd-opc-kosik"), w.document.documentElement.outerHTML === povodne], [false, true], "košík bez zmeny");
    w = mk("https://www.luxurycardesign.sk/kosik/" + OPC);
    pouzi(w);
    const pred = w.document.querySelector("ol.cart-header").outerHTML;
    eq(vzhladKosikaSkoro(w.document, OPC), true, "kód");
    const kroky = Array.prototype.filter.call(w.document.querySelectorAll("ol.cart-header li.step"), (l) => !l.hidden)
      .map((l) => l.getAttribute("data-lcd-opc-cislo") + " " + l.textContent.replace(/\s+/g, " ").trim());
    eq([w.document.documentElement.classList.contains("lcd-opc-kosik"), kroky], [true, ["1 Nákupný košík", "2 Objednávka"]], "trieda a kroky ① ②");
    zrusVzhladKosika(w.document);
    eq([w.document.documentElement.classList.contains("lcd-opc-kosik"), w.document.querySelector("ol.cart-header").outerHTML.replace(/ class="cart-header step-0"/, "")],
      [false, pred.replace(/ class="cart-header step-0"/, "")], "vypnuté v data.json: kroky ako dnes");
  } finally {
    globalThis.window = stare.w; globalThis.document = stare.d; globalThis.sessionStorage = stare.s; globalThis.localStorage = stare.l;
  }
});

// ------------------------------------------------------------------ revízia doladenia 1 (nálezy 6, 8, 9)
t("polozky: fotka podľa identifikátora AJ kódu varianty — dva sety toho istého produktu v inej farbe majú každý svoju fotku", () => {
  const d = new JSDOM(fx("sk-set/kosik.html")).window.document;
  const tr = d.querySelector("tr.removeable[data-micro-identifier]");
  const tr2 = tr.cloneNode(true);
  tr2.setAttribute("data-micro-sku", "598/DIA7");
  tr2.querySelectorAll(".cart-p-image img").forEach((i) => i.setAttribute("data-src", "https://cdn.myshoptet.com/usr/x/user/shop/related/598-15_bezovo.jpg?x=100&y=100"));
  tr.after(tr2);
  const ss = new JSDOM("", { url: "https://www.luxurycardesign.sk/" }).window.sessionStorage;
  const m = P.ulozFotky(d, ss);
  eq(Object.keys(m).length, 2, "dva riadky s rovnakým identifikátorom a iným kódom = dva záznamy: " + JSON.stringify(m));
  const w = new JSDOM(fx("sk-set/krok2.html"), { url: "https://www.luxurycardesign.sk/objednavka/krok-2/" }).window;
  const box = w.document.getElementById("summary-box");
  const p1 = box.querySelector(".cart-item"), p2 = p1.cloneNode(true);
  p2.setAttribute("data-micro-sku", "598/DIA7");
  p1.after(p2);
  P.rozsirPolozky(box, TS, { fotky: P.citajFotky(ss), otvorene: {} });
  const src = Array.prototype.map.call(box.querySelectorAll(".cart-item > img.lcd-opc-foto"), (i) => i.getAttribute("src").replace(/^.*related\//, ""));
  eq([src.length, src[1]], [2, "598-15_bezovo.jpg?x=100&y=100"], "2. položka má svoju fotku: " + JSON.stringify(src));
  over_(src[0] !== src[1], "obe položky majú tú istú fotku: " + JSON.stringify(src));
});

t("polozky: zobáčik má v popise (aria-describedby) názov svojej položky, kópia v zbalenom súhrne bez duplicitného id", () => {
  const { d, box } = suhrnSRozpisom();
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  const z = box.querySelector(".lcd-opc-zob");
  const ids = (z.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
  over_(ids.length > 0, "zobáčik bez aria-describedby");
  const popis = ids.map((id) => (d.getElementById(id) || {}).textContent || "").join(" ").replace(/\s+/g, " ");
  over_(/luxusné autokoberce dragonskin basic/i.test(popis), "popis zobáčika nie je názov položky: " + popis);
  const k = P.vycistiKopiu(box.querySelector(".cart-item").cloneNode(true));
  eq(ids.filter((id) => k.querySelector("#" + id)).length, 0, "kópia nesmie niesť id popisu (duplicitné id)");
});

// ------------------------------------------------------------------ doladenie 2 (30. 10. 2026)
t("polozky: fotka sa nenačíta (404, chyba siete) — celý rámik preč, položka bez stĺpca fotky, po prekreslení súhrnu sa nevráti", () => {
  const { d, box } = suhrnSRozpisom();
  const kluc = "6c240b96-513f-11f0-b348-4e595e8a4f93|598/DIA3";
  const zla = "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/shop/related/neexistuje.jpg?x=100&y=100";
  const stav = { fotky: { [kluc]: zla }, otvorene: {} };
  P.rozsirPolozky(box, TS, stav);
  let p = box.querySelector(".cart-item");
  const img = p.querySelector(":scope > img.lcd-opc-foto");
  over_(img && p.classList.contains("lcd-opc-s-fotkou"), "pred chybou má položka fotku");
  img.dispatchEvent(new d.defaultView.Event("error"));
  eq([p.querySelectorAll("img.lcd-opc-foto").length, p.classList.contains("lcd-opc-s-fotkou")], [0, false], "po chybe: bez <img> a bez stĺpca fotky");
  over_(p.querySelector(":scope > .lcd-opc-zob") && p.querySelector(":scope > .lcd-opc-detail"), "zobáčik a karta detailu ostávajú");
  // to isté volanie znova (pozorovateľ súhrnu) aj nová položka po prekreslení Shoptetom: zlá fotka sa nevloží
  P.rozsirPolozky(box, TS, stav);
  eq(box.querySelectorAll("img.lcd-opc-foto").length, 0, "opakované volanie");
  const nova = P.vycistiKopiu(p.cloneNode(true));
  p.replaceWith(nova);
  P.rozsirPolozky(box, TS, stav);
  p = box.querySelector(".cart-item");
  eq([box.querySelectorAll("img.lcd-opc-foto").length, p.classList.contains("lcd-opc-s-fotkou")], [0, false], "po prekreslení súhrnu");
  // iná (dobrá) fotka inej položky sa vloží ďalej
  const ok = "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/shop/related/598-15_a.jpg?x=100&y=100";
  P.rozsirPolozky(box, TS, { fotky: { [kluc]: ok }, otvorene: {}, zle: stav.zle });
  const im = box.querySelector("img.lcd-opc-foto");
  eq(im ? im.getAttribute("src") : null, ok, "dobrá fotka tej istej položky (iná adresa) sa vloží");
});

t("krok 2: hneď pri načítaní bundla (kód / flag) len html.lcd-opc-caka (formulár skrytý, CLS; dizajn A až initKrok2), späť pri vypnutí v data.json aj bez flagu; košík a bez kódu (aj ?opc=1) nič", async () => {
  const { vzhladKrok2Skoro } = B;
  const mk = (web, cesta) => {
    const w = new JSDOM(fx(web + "/" + (cesta === "kosik" ? "kosik" : "krok2") + ".html"), { url: "https://www.luxurycardesign." + web + (cesta === "kosik" ? "/kosik/" : "/objednavka/krok-2/") }).window;
    w.shoptetData = { projectId: web === "sk" ? 562035 : 581408 };
    return w;
  };
  const stare = { w: globalThis.window, d: globalThis.document, s: globalThis.sessionStorage, l: globalThis.localStorage };
  const pouzi = (w) => { globalThis.window = w; globalThis.document = w.document; globalThis.sessionStorage = w.sessionStorage; globalThis.localStorage = w.localStorage; };
  const triedy = (w) => ["lcd-opc", "lcd-opc-caka"].filter((c) => w.document.documentElement.classList.contains(c)).join(" ");
  try {
    let w = mk("sk", "krok2");
    pouzi(w);
    eq([vzhladKrok2Skoro(w.document, ""), triedy(w)], [false, ""], "bez kódu a bez flagu");
    eq([vzhladKrok2Skoro(w.document, "?opc=1"), triedy(w)], [false, ""], "?opc=1 (bez kódu)");
    w = mk("sk", "kosik");
    pouzi(w);
    eq([vzhladKrok2Skoro(w.document, OPC), triedy(w)], [false, ""], "košík (má vlastný vzhladKosikaSkoro)");
    for (const web of ["sk", "cz"]) {
      w = mk(web, "krok2");
      pouzi(w);
      w.localStorage.setItem("lcdOpc", "1"); // flag z tajného odkazu (?opc=KÓD na košíku alebo hocikde)
      eq([vzhladKrok2Skoro(w.document, "", { limitMs: 60000 }), triedy(w)], [true, "lcd-opc-caka"], web + ": flag v prehliadači (lcd-opc pridá až initKrok2 po initCart, S24)");
      eq(w.document.querySelector(".cart-inner").getAttribute("data-lcd-opc-nacitava"), TEXTY[web].nacitavamKosik, web + ": text počas čakania");
    }
    // vypnuté v data.json (initOpc) -> späť dnešný krok 2, nič skryté
    w = mk("sk", "krok2");
    pouzi(w);
    w.localStorage.setItem("lcdOpc", "1");
    vzhladKrok2Skoro(w.document, "", { limitMs: 60000 });
    eq([B.initOpc({ opc: false }), triedy(w)], [null, ""], "data.json opc:false");
    // kód v adrese, ale flag medzitým zmazaný (?opc=0 v inej karte pred data.json) -> initOpc nič a triedy späť
    w = mk("sk", "krok2");
    pouzi(w);
    vzhladKrok2Skoro(w.document, OPC, { limitMs: 60000 });
    w.localStorage.removeItem("lcdOpc");
    eq([B.initOpc({}), triedy(w)], [null, ""], "bez flagu pri initOpc");
    // poistka: data.json neprišiel (initOpc nebežal) -> po limite dnešný krok 2 (nie skrytý formulár navždy)
    w = mk("sk", "krok2");
    pouzi(w);
    delete w.__lcdOpc;
    vzhladKrok2Skoro(w.document, OPC, { limitMs: 30 });
    eq(triedy(w), "lcd-opc-caka", "pred limitom");
    await cakaj(80);
    eq(triedy(w), "", "po limite bez initOpc");
  } finally {
    globalThis.window = stare.w; globalThis.document = stare.d; globalThis.sessionStorage = stare.s; globalThis.localStorage = stare.l;
  }
});

t("uspatie: bez kódu (nič, ?opc=1, ?opc=0, iná hodnota) skoré funkcie ani initOpc na košíku a kroku 2 SK/CZ nič nestiahnu, nepridajú, nezapíšu (DOM, úložiská, dataLayer, globál)", () => {
  const stare = { w: globalThis.window, d: globalThis.document, s: globalThis.sessionStorage, l: globalThis.localStorage, f: globalThis.fetch };
  const siet = [];
  try {
    for (const web of ["sk", "cz"]) for (const cesta of ["kosik", "krok2"]) for (const q of ["", "?opc=1", "?opc=0", "?opc=" + B.KOD.toUpperCase(), "?opc=" + B.KOD.slice(0, 9)]) {
      const w = new JSDOM(fx(web + "/" + cesta + ".html"), { url: "https://www.luxurycardesign." + web + (cesta === "kosik" ? "/kosik/" : "/objednavka/krok-2/") + q }).window;
      w.shoptetData = { projectId: web === "sk" ? 562035 : 581408 };
      globalThis.window = w; globalThis.document = w.document; globalThis.sessionStorage = w.sessionStorage; globalThis.localStorage = w.localStorage;
      globalThis.fetch = w.fetch = function (u) { siet.push("fetch " + u); return Promise.reject(new Error("siet")); };
      const open = w.XMLHttpRequest.prototype.open;
      w.XMLHttpRequest.prototype.open = function (m, u) { siet.push("xhr " + u); return open.apply(this, arguments); };
      const kde = web + " " + cesta + " " + (q || "(bez parametra)");
      const pred = w.document.documentElement.outerHTML;
      eq([B.vzhladKosikaSkoro(w.document, q), B.vzhladKrok2Skoro(w.document, q, { limitMs: 1 }), B.initOpc({})], [false, false, null], kde + ": návratové hodnoty");
      eq(w.document.documentElement.outerHTML === pred, true, kde + ": DOM sa zmenil");
      eq([w.localStorage.length, w.sessionStorage.length, typeof w.__lcdOpc, (w.dataLayer || []).length], [0, 0, "undefined", 0], kde + ": úložiská / globál / dataLayer");
    }
    eq(siet, [], "sieť");
  } finally {
    globalThis.window = stare.w; globalThis.document = stare.d; globalThis.sessionStorage = stare.s; globalThis.localStorage = stare.l; globalThis.fetch = stare.f;
  }
});

t("polozky: veľké začiatočné písmeno názvu priamo v texte (WebKit: ::first-letter na -webkit-box s line-clamp neplatí) — zvyšok bez zmeny, opakovane nič, aj kópia navrchu, SK aj CZ s diakritikou", () => {
  const { d, box } = suhrnSRozpisom();
  const a = box.querySelector(".cart-item a.main-link");
  const pred = a.textContent;
  over_(/^\s*luxusné autokoberce Dragonskin Basic DIAMOND LINE\s/.test(pred), "fixture: názov malým písmenom (ako zo Shoptetu): " + JSON.stringify(pred));
  const caka = pred.replace("luxusné", "Luxusné");
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  eq(a.textContent, caka, "SK set: len prvé písmeno, medzery a „DIAMOND LINE“ ostávajú");
  P.rozsirPolozky(box, TS, { fotky: {}, otvorene: {} });
  eq(a.textContent, caka, "opakované volanie (prekreslenie súhrnu) nič nezmení");
  const k = P.vycistiKopiu(box.querySelector(".cart-item").cloneNode(true));
  over_(/^\s*Luxusné/.test(k.querySelector("a.main-link").textContent), "kópia pre zbalený súhrn navrchu má veľké písmeno");
  const mk = (html) => { const x = d.createElement("a"); x.innerHTML = html; return x; };
  const x1 = mk("  ľavý koberec <span>príplatky</span>");
  eq([P.velkePismenoNazvu(x1, "sk"), x1.innerHTML], [true, "  Ľavý koberec <span>príplatky</span>"], "SK diakritika, potomok bez zmeny");
  const x2 = mk("čistič – vzorek");
  eq([P.velkePismenoNazvu(x2, "cs"), x2.textContent], [true, "Čistič – vzorek"], "CZ diakritika");
  const x3 = mk("<span>skryté</span>  luxusní autokoberce");
  eq([P.velkePismenoNazvu(x3, "cs"), x3.innerHTML], [true, "<span>skryté</span>  Luxusní autokoberce"], "prvý neprázdny textový uzol odkazu");
  const x4 = mk("2× rohož"), x5 = mk("Vzorkovník Dragonskin");
  eq([P.velkePismenoNazvu(x4, "sk"), x4.textContent, P.velkePismenoNazvu(x5, "cs"), x5.textContent, P.velkePismenoNazvu(null, "sk")],
    [false, "2× rohož", false, "Vzorkovník Dragonskin", false], "číslo, už veľké, bez odkazu: nič");
  const x6 = mk("luxusné");
  eq([P.velkePismenoNazvu(x6, "xx-neplatny-jazyk!"), x6.textContent], [true, "Luxusné"], "neplatný jazyk stránky: bez výnimky");
  // CZ krok 2 (fixture vzorkovník) — rozšírenie položiek prejde aj s českým jazykom stránky
  const w = new JSDOM(fx("cz/krok2.html"), { url: "https://www.luxurycardesign.cz/objednavka/krok-2/" }).window;
  const bc = w.document.getElementById("summary-box"), ac = bc.querySelector(".cart-item a.main-link");
  ac.firstChild.nodeValue = "  vzorkovník Dragonskin – objednávka vzorků ";
  P.rozsirPolozky(bc, TC, { fotky: {}, otvorene: {} });
  eq(ac.firstChild.nodeValue.trim(), "Vzorkovník Dragonskin – objednávka vzorků", "CZ krok 2 (textový uzol názvu; príplatky v potomkoch sa nerátajú)");
});

// ------------------------------------------------------------------ uspatie v main: bez kódu nič oproti main (30. 10. 2026)
const C = await import("../assets/js/components/cart.js");
const K2 = await import("../assets/js/opc/krok2.js");
t("cart.js: bublina Luxie bez OPC ustupuje len z tlačidiel košíka (ako main, nie z #submit-order); z „Objednať“ len keď to dá OPC (krok2.js BUBLINA_USTUPI)", () => {
  const w = new JSDOM('<!doctype html><html><body class="in-krok-2"><iframe title="Luxia chat"></iframe><button id="submit-order">Objednať</button></body></html>').window;
  const r = (e, b) => { e.getBoundingClientRect = () => Object.assign({ x: b.left, y: b.top, width: b.right - b.left, height: b.bottom - b.top }, b); };
  r(w.document.querySelector("iframe"), { left: 300, right: 376, top: 700, bottom: 776 }); // bublina 76 × 76
  r(w.document.getElementById("submit-order"), { left: 200, right: 390, top: 720, bottom: 770 }); // pod bublinou
  const stare = { d: globalThis.document, a: globalThis.addEventListener, i: globalThis.setInterval };
  globalThis.document = w.document; globalThis.addEventListener = () => {}; globalThis.setInterval = () => 0;
  try {
    const H = w.document.documentElement;
    C.lcdBublinaMimoTlacidla();
    eq([H.classList.contains("lcd-kosik-bublina"), H.classList.contains("lcd-kosik-bez-bubliny")], [true, false], "bez OPC: #submit-order nie je medzi tlačidlami (ako v main)");
    over_(K2.BUBLINA_USTUPI.split(/\s*,\s*/).includes("#submit-order"), "OPC nedáva #submit-order: " + K2.BUBLINA_USTUPI);
    C.lcdBublinaMimoTlacidla(K2.BUBLINA_USTUPI);
    eq(H.classList.contains("lcd-kosik-bez-bubliny"), true, "OPC: bublina ustúpi z „Objednať“");
  } finally { globalThis.document = stare.d; globalThis.addEventListener = stare.a; globalThis.setInterval = stare.i; }
});
t("CSS: každé pravidlo bloku LCD-OPC v luxuryCar.css je pod html.lcd-opc / html.lcd-opc-kosik / html.lcd-opc-caka (bez triedy nič), @keyframes len lcd-opc-*", () => {
  const css = readFileSync(new URL("../assets/css/luxuryCar.css", import.meta.url), "utf8");
  const a = css.indexOf("/* ===== LCD-OPC START"), b = css.indexOf("/* ===== LCD-OPC END");
  over_(a > 0 && b > a, "blok LCD-OPC v luxuryCar.css nenájdený");
  const sheet = new JSDOM("<style>" + css.slice(a, b) + "</style>").window.document.styleSheets[0];
  const zle = [];
  let pocet = 0;
  const prejdi = (pravidla, kde) => {
    for (const r of pravidla) {
      if (r.type === 1) {
        for (const sel of r.selectorText.split(/,(?![^(]*\))/)) { pocet++; if (!/^html\.lcd-opc(-kosik|-caka)?(?![\w-])/.test(sel.trim())) zle.push(kde + sel.trim()); }
      } else if (r.type === 4) prejdi(r.cssRules, kde + "@media " + r.media.mediaText + " ");
      else if (r.type === 7) { if (!/^lcd-opc-/.test(r.name)) zle.push(kde + "@keyframes " + r.name); }
      else zle.push(kde + "iné pravidlo: " + r.cssText.slice(0, 60));
    }
  };
  prejdi(sheet.cssRules, "");
  over_(pocet > 400, "prečítaných len " + pocet + " selektorov (parser?)");
  eq(zle, [], "selektory mimo html.lcd-opc* (" + zle.length + " z " + pocet + ")");
});

// ------------------------------------------------------------------ rýchla platba cez banku priamo v OPC (Michal 30. 10. 2026)
// „Rýchla platba bankou“ ho z OPC poslala na starý krok 1 s čiernym oknom Shoptet Pay. Výber banky je teraz na kroku 2
// (opc/banka.js): zoznam bánk z verejného GET Shoptet Pay, predvolená banka ako widget kroku 1 (localStorage pisBankSelected
// / pisCountrySelected / pisCurrencySelected), Step1Validate s shoptetPayPisCode = telo formulára kroku 1 Shoptetu.
const Bk = await import("../assets/js/opc/banka.js").catch((e) => ({ __chyba: e.message }));
const bk = (n) => { if (Bk.__chyba) throw new Error("opc/banka.js: " + Bk.__chyba); if (typeof Bk[n] !== "function") throw new Error("opc/banka.js bez " + n); return Bk[n]; };
const BANKY_SK = JSON.parse(fx("sk/shoptetpay-banky.json"));
const ulozisko = (o = {}) => { const m = new Map(Object.entries(o)); return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; };
// telo formulára kroku 1 Shoptetu (fixtures SK, offline 30. 10. 2026: „Rýchla platba cez banku“ -> okno Shoptet Pay -> VÚB ->
// Potvrdiť výber -> Pokračovať); S46 ho zachytí znova z checkout-3g.js a porovná s telom z OPC
const TELO_KROK1_VUB = "language=sk&shippingId=96&billingId=112&shoptetPayPisCode=vub_banka_oauth_client_sk&gopayPayInstrument=";
const EUR_SK = { mena: "EUR", jazyk: "sk" };

t("teloStep1: rýchla platba 112 s bankou = telo formulára kroku 1 (shoptetPayPisCode hneď za billingId); pri inej platbe kód nejde", () => {
  window.shoptet = { csrf: { enabled: false } };
  const m = krok1Model(fx("sk/krok1.html"));
  eq(teloStep1(m, { shippingId: "96", billingId: "112", shoptetPayPisCode: "vub_banka_oauth_client_sk" }).toString(), TELO_KROK1_VUB);
  eq(teloStep1(m, { shippingId: "96", billingId: "5", shoptetPayPisCode: "vub_banka_oauth_client_sk" }).toString(), "language=sk&shippingId=96&billingId=5&gopayPayInstrument=", "prevod");
  eq(teloStep1(m, { shippingId: "96", billingId: "112" }).toString(), "language=sk&shippingId=96&billingId=112&gopayPayInstrument=", "112 bez kódu (záloha)");
  delete window.shoptet;
});
t("krok1Model SK: podmienky rýchlej platby (Salt Edge) z HTML kroku 1 — text a 2 odkazy, nič vymyslené; bez šablóny null", () => {
  const p = krok1Model(fx("sk/krok1.html")).pisPodmienky;
  over_(Array.isArray(p), "pisPodmienky chýbajú: " + JSON.stringify(p));
  eq(p.map((x) => x.text).join(""), "Prijímate a súhlasíte so zmluvnými podmienkami a zásadami ochrany osobných údajov partnerských poskytovateľov.");
  eq(p.filter((x) => x.href).map((x) => [x.text, x.href]), [["zmluvnými podmienkami", "https://www.saltedge.com/dashboard/fino_pis_terms"], ["zásadami ochrany osobných údajov", "https://www.saltedge.com/dashboard/fino_privacy_policy"]]);
  eq(krok1Model(fx("sk/krok1.html").replace(/template__pisPayment/g, "template__iny")).pisPodmienky, null);
  // odkaz s javascript: sa neprevezme ako odkaz
  const zly = krok1Model(fx("sk/krok1.html").replace("https://www.saltedge.com/dashboard/fino_pis_terms", "javascript:alert(1)")).pisPodmienky;
  eq(zly.filter((x) => x.href).length, 1, "javascript: odkaz");
});
t("banka: zoznam bánk Shoptet Pay (SK: Slovensko 6, Česko 5), CZ web [] / prázdne / nezmysel -> null", () => {
  const z = bk("zoznamBank")(BANKY_SK);
  eq(z.map((k) => [k.code, k.name, k.banky.length]), [["SK", "Slovensko", 6], ["CZ", "Česko", 5]]);
  eq(z[0].banky[1], { code: "vub_banka_oauth_client_sk", name: "VUB", logo: "https://d1uuj3mi6rzwpm.cloudfront.net/logos/providers/sk/vub_sk.svg", isDefault: false });
  for (const x of [[], {}, null, "x", { SK: { code: "SK", name: "S", providers: {} } }, { SK: { code: "SK", providers: { a: { name: "bez kódu" } } } }]) eq(bk("zoznamBank")(x), null, JSON.stringify(x));
});
t("banka: predvolená ako widget kroku 1 — EUR + sk = Slovensko, bez uloženej isDefault, inak prvá; uložená banka/krajina; iná mena ich zahodí", () => {
  const st = bk("stavBanky");
  const s0 = st(BANKY_SK, ulozisko(), EUR_SK);
  eq([s0.krajina, s0.banka.code, s0.krajiny.length], ["SK", "slovenska_sporitelna_oauth_client_sk", 2]);
  eq(st(BANKY_SK, ulozisko({ pisBankSelected: "vub_banka_oauth_client_sk", pisCountrySelected: "SK", pisCurrencySelected: "EUR" }), EUR_SK).banka.code, "vub_banka_oauth_client_sk");
  const cz = st(BANKY_SK, ulozisko({ pisBankSelected: "csas_oauth_client_cz", pisCountrySelected: "CZ", pisCurrencySelected: "EUR" }), EUR_SK);
  eq([cz.krajina, cz.banka.code], ["CZ", "csas_oauth_client_cz"]);
  eq(st(BANKY_SK, ulozisko({ pisBankSelected: "vub_banka_oauth_client_sk", pisCountrySelected: "SK", pisCurrencySelected: "CZK" }), EUR_SK).banka.code, "slovenska_sporitelna_oauth_client_sk", "iná mena");
  const d = JSON.parse(JSON.stringify(BANKY_SK));
  d.SK.providers.tatra_banka_oauth_client_sk.isDefault = true;
  eq(st(d, ulozisko(), EUR_SK).banka.code, "tatra_banka_oauth_client_sk", "isDefault");
  eq(st(d, ulozisko({ pisBankSelected: "neznama_banka" }), EUR_SK).banka.code, "slovenska_sporitelna_oauth_client_sk", "uložená mimo krajiny -> prvá");
  eq(st(BANKY_SK, ulozisko(), { mena: "CZK", jazyk: "cs" }).krajina, "CZ");
  eq(st(BANKY_SK, ulozisko({ pisCountrySelected: "HU" }), EUR_SK).krajina, "SK", "uložená krajina bez bánk");
  eq(st(BANKY_SK, { getItem() { throw new Error("zakázané"); } }, EUR_SK).banka.code, "slovenska_sporitelna_oauth_client_sk", "úložisko nejde");
  eq(st([], ulozisko(), EUR_SK), null);
});
t("banka: Potvrdiť výber zapíše tie isté kľúče ako widget kroku 1 (klasický krok 1 ukáže tú istú banku); úložisko nejde -> bez chyby", () => {
  const l = ulozisko();
  bk("ulozBanku")(l, { krajina: "SK", banka: "tatra_banka_oauth_client_sk", mena: "EUR" });
  eq([...l.m.entries()].sort(), [["pisBankSelected", "tatra_banka_oauth_client_sk"], ["pisCountrySelected", "SK"], ["pisCurrencySelected", "EUR"]]);
  bk("ulozBanku")({ setItem() { throw new Error("zakázané"); } }, { krajina: "SK", banka: "x", mena: "EUR" });
  bk("ulozBanku")(null, { krajina: "SK", banka: "x", mena: "EUR" });
  eq([bk("ulozisko")({ get localStorage() { throw new Error("SecurityError"); } }), bk("ulozisko")({ localStorage: l }) === l], [null, true], "prístup k localStorage hádže");
});
t("banka: mena a jazyk z dataLayer Shoptetu (krok 2 aj košík), inak z jazyka stránky", () => {
  eq(bk("menaAJazyk")({ dataLayer: [{ shoptet: { currency: "EUR", language: "sk" } }], document: { documentElement: { lang: "sk" } } }), { mena: "EUR", jazyk: "sk" });
  eq(bk("menaAJazyk")({ dataLayer: [{ x: 1 }, { shoptet: { currency: "CZK", language: "cs" } }], document: { documentElement: { lang: "cs" } } }), { mena: "CZK", jazyk: "cs" });
  eq(bk("menaAJazyk")({ document: { documentElement: { lang: "sk-SK" } } }), { mena: "", jazyk: "sk" });
});
t("banka: GET getBankProviderData na pozadí (XHR ako Shoptet, limit); 404, zlý JSON, sieť -> ok: false", () => sFetchom(async () => {
  const povodny = globalThis.fetch;
  const volania = [];
  const odpovede = [() => new Response(JSON.stringify(BANKY_SK), { status: 200 }), () => new Response("nie", { status: 404 }), () => new Response("{zly", { status: 200 }), () => Promise.reject(new Error("siet"))];
  globalThis.fetch = (u, i) => { volania.push([u, (i && i.method) || "GET", (i && i.headers && i.headers["X-Requested-With"]) || ""]); return Promise.resolve().then(odpovede.shift()); };
  try {
    const a = await bk("nacitajBanky")();
    eq([a.ok, Object.keys(a.data)], [true, ["SK", "CZ"]]);
    const r = [await bk("nacitajBanky")(), await bk("nacitajBanky")(), await bk("nacitajBanky")()];
    eq(r.map((x) => x.ok), [false, false, false]);
    eq(volania[0], ["/action/ShoptetPayPaymentData/getBankProviderData/", "GET", "XMLHttpRequest"]);
  } finally { globalThis.fetch = povodny; }
}));

/** Okno výberu banky v jsdom (bez rozloženia): dokument, zoznam, výsledky naKoniec. */
function oknoBanky(o = {}) {
  const d = new JSDOM("<!doctype html><html><body><button id='spat'>Zmeniť</button></body></html>", { pretendToBeVisual: true }).window.document;
  const krajiny = bk("zoznamBank")(o.data || BANKY_SK);
  const vysledky = [];
  d.getElementById("spat").focus();
  bk("otvorOkno")(d, { T: TEXTY[o.web || "sk"], krajiny, krajina: o.krajina || "SK", banka: o.banka || "vub_banka_oauth_client_sk", naKoniec: (r) => vysledky.push(r), fokus: d.getElementById("spat") });
  const dlg = d.querySelector("[data-lcd-opc-banky] [role=dialog]");
  return { d, dlg, vysledky, radia: () => [...d.querySelectorAll("[data-lcd-opc-banky] input[type=radio]")] };
}
t("banka: okno v OPC — dialóg (aria-modal, nadpis), 6 bánk ako rádiá, zvolená uložená, fokus na nej; Potvrdiť vráti krajinu a banku, okno preč, fokus späť", () => {
  const { d, dlg, vysledky, radia } = oknoBanky();
  over_(dlg, "okno sa neotvorilo");
  eq([dlg.getAttribute("aria-modal"), d.getElementById(dlg.getAttribute("aria-labelledby")).textContent], ["true", TEXTY.sk.bankaNadpis]);
  eq(radia().map((r) => r.value), ["slovenska_sporitelna_oauth_client_sk", "vub_banka_oauth_client_sk", "tatra_banka_oauth_client_sk", "fio_oauth_client_sk", "raiffeisen_oauth_client_sk", "mbank_oauth_client_sk"]);
  eq(radia().filter((r) => r.checked).map((r) => r.value), ["vub_banka_oauth_client_sk"]);
  eq(d.activeElement && d.activeElement.value, "vub_banka_oauth_client_sk", "fokus");
  eq(radia().every((r) => !r.form && !r.closest("form")), true, "rádiá bánk mimo formulára objednávky");
  const lbl = radia()[1].closest("label");
  eq([lbl.textContent.replace(/\s+/g, " ").trim(), lbl.querySelector("img").getAttribute("alt")], ["VUB", ""]);
  radia()[2].click();
  eq(vysledky.length, 0, "ťuk na banku okno nezavrie");
  d.querySelector("[data-lcd-opc-banky] .lcd-opc-banky__potvrdit").click();
  eq(vysledky.length, 1);
  eq([vysledky[0].krajina, vysledky[0].banka && vysledky[0].banka.code, vysledky[0].banka && vysledky[0].banka.name], ["SK", "tatra_banka_oauth_client_sk", "Tatra Banka"]);
  eq([d.querySelector("[data-lcd-opc-banky]"), d.activeElement.id, d.documentElement.classList.contains("lcd-opc-okno")], [null, "spat", false]);
});
t("banka: okno — Späť, Esc aj klik vedľa okna = nič nevyberie (null); Tab ostáva v okne", () => {
  for (const ako of ["spat", "esc", "pozadie"]) {
    const { d, vysledky, radia } = oknoBanky();
    radia()[3].click();
    const koren = d.querySelector("[data-lcd-opc-banky]");
    if (ako === "spat") d.querySelector("[data-lcd-opc-banky] .lcd-opc-banky__spat").click();
    else if (ako === "esc") koren.dispatchEvent(new d.defaultView.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    else koren.dispatchEvent(new d.defaultView.MouseEvent("click", { bubbles: true }));
    eq([vysledky, d.querySelector("[data-lcd-opc-banky]"), d.activeElement.id], [[null], null, "spat"], ako);
  }
  const { d } = oknoBanky();
  const potvrdit = d.querySelector("[data-lcd-opc-banky] .lcd-opc-banky__potvrdit");
  potvrdit.focus();
  const e = new d.defaultView.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
  potvrdit.dispatchEvent(e);
  over_(e.defaultPrevented && d.querySelector("[data-lcd-opc-banky]").contains(d.activeElement), "Tab z posledného tlačidla odišiel z okna: " + (d.activeElement && d.activeElement.outerHTML.slice(0, 80)));
});
t("banka: okno — krajina len pri viac krajinách; Česko = 5 českých bánk (zvolená prvá), Potvrdiť vráti CZ; texty CZ", () => {
  const { d, vysledky, radia } = oknoBanky();
  const sel = d.querySelector("[data-lcd-opc-banky] select");
  eq([sel.options.length, sel.value, sel.hasAttribute("name"), sel.options[0].textContent], [2, "SK", false, "Slovensko · 6 bánk"]);
  over_(sel.labels && sel.labels.length === 1, "výber krajiny bez štítku");
  sel.value = "CZ";
  sel.dispatchEvent(new d.defaultView.Event("change", { bubbles: true }));
  eq([radia().length, radia().filter((r) => r.checked).map((r) => r.value)], [5, ["csas_oauth_client_cz"]]);
  d.querySelector("[data-lcd-opc-banky] .lcd-opc-banky__potvrdit").click();
  eq([vysledky[0].krajina, vysledky[0].banka.code], ["CZ", "csas_oauth_client_cz"]);
  const jedna = { SK: BANKY_SK.SK };
  const o1 = oknoBanky({ data: jedna });
  eq(o1.d.querySelector("[data-lcd-opc-banky] select"), null, "jedna krajina -> bez výberu krajiny");
  const c = oknoBanky({ web: "cz", krajina: "CZ", banka: "x" });
  eq([c.d.getElementById(c.dlg.getAttribute("aria-labelledby")).textContent, c.d.querySelector(".lcd-opc-banky__potvrdit").textContent, c.d.querySelector(".lcd-opc-banky__spat").textContent], [TEXTY.cz.bankaNadpis, TEXTY.cz.potvrditBanku, TEXTY.cz.spat]);
  eq(c.d.querySelector("[data-lcd-opc-banky] select").options[1].textContent, "Česko · 5 bank");
  eq(c.radia().filter((r) => r.checked).map((r) => r.value), ["csas_oauth_client_cz"], "neznáma banka -> prvá");
});
t("texty: okno banky SK + CZ (vykanie s veľkým V), počty bánk 1/3/6", () => {
  eq([TEXTY.sk.bankaNadpis, TEXTY.cz.bankaNadpis, TEXTY.sk.potvrditBanku, TEXTY.cz.potvrditBanku, TEXTY.sk.spat, TEXTY.cz.spat], ["Vyberte Vašu banku", "Vyberte Vaši banku", "Potvrdiť výber", "Potvrdit výběr", "Späť", "Zpět"]);
  eq([TEXTY.sk.pocetBank(1), TEXTY.sk.pocetBank(3), TEXTY.sk.pocetBank(6), TEXTY.cz.pocetBank(1), TEXTY.cz.pocetBank(3), TEXTY.cz.pocetBank(5)], ["1 banka", "3 banky", "6 bánk", "1 banka", "3 banky", "5 bank"]);
});
t("sekcia SK so zoznamom bánk: rýchla platba = rádio (nie odkaz na krok 1), pod ním banka + „Zmeniť banku“ + podmienky Salt Edge z kroku 1; nie dlaždica", () => {
  const m0 = krok1Model(fx("sk/krok1.html"));
  const banka = { code: "vub_banka_oauth_client_sk", name: "VUB", logo: "https://d1uuj3mi6rzwpm.cloudfront.net/logos/providers/sk/vub_sk.svg" };
  const { el } = sekcia("sk", { banka: { banka, podmienky: m0.pisPodmienky } });
  const w = el.querySelector('[data-submethod="pis"]');
  const i = w.querySelector('input[name="billingId"][value="112"]');
  over_(i && i.getAttribute("form") === "lcd-opc-nic", "112 nie je rádio našej sekcie");
  eq([w.querySelector('a[href="/objednavka/krok-1/"]'), w.classList.contains("lcd-opc-odkaz"), w.classList.contains("lcd-opc-dlazdica")], [null, false, false]);
  eq([...el.querySelectorAll('input[name="billingId"]')].map((x) => x.value), ["5", "103", "109", "112", "3"]);
  const b = w.querySelector(".lcd-opc-banka");
  over_(b && !b.closest("label"), "riadok banky chýba alebo je v štítku rádia (ťuk na Zmeniť by prepol platbu)");
  eq([b.querySelector(".lcd-opc-banka__meno").textContent, b.querySelector(".lcd-opc-banka__logo").getAttribute("src")], ["VUB", banka.logo]);
  const z = b.querySelector("button.lcd-opc-banka__zmenit");
  eq([z && z.getAttribute("type"), z && z.textContent], ["button", TEXTY.sk.zmenitBanku]);
  const pod = b.querySelector(".lcd-opc-banka__podmienky");
  eq(pod.textContent, "Prijímate a súhlasíte so zmluvnými podmienkami a zásadami ochrany osobných údajov partnerských poskytovateľov.");
  eq([...pod.querySelectorAll("a")].map((a) => [a.getAttribute("href"), a.getAttribute("target"), a.getAttribute("rel")]),
    [["https://www.saltedge.com/dashboard/fino_pis_terms", "_blank", "noopener"], ["https://www.saltedge.com/dashboard/fino_privacy_policy", "_blank", "noopener"]]);
  V.nastavBanku(el, { code: "tatra_banka_oauth_client_sk", name: "Tatra Banka", logo: "https://x/t.svg" });
  eq([b.querySelector(".lcd-opc-banka__meno").textContent, b.querySelector(".lcd-opc-banka__logo").getAttribute("src")], ["Tatra Banka", "https://x/t.svg"]);
  // zvolená 112 -> rádio zaškrtnuté, karta aktívna (CSS ukáže riadok banky)
  V.nastavVolby(el, { doprava: "96", platba: "112" });
  eq([i.checked, w.classList.contains("active")], [true, true]);
  // bez podmienok Salt Edge (zmenené HTML Shoptetu) -> záloha: odkaz na krok 1
  const { el: el2 } = sekcia("sk", { banka: { banka, podmienky: null } });
  eq(!!el2.querySelector('[data-submethod="pis"] a[href="/objednavka/krok-1/"]'), true, "bez podmienok odkaz na krok 1");
});
t("sync: znova() (iná banka pri tej istej platbe 112) pošle voľbu ešte raz; počas letiacej požiadavky ide po nej; v zámku nič", async () => {
  const { s, log } = sync({ ms: 100 });
  over_(typeof s.znova === "function", "sync.znova chýba");
  s.zvol({ doprava: "96", platba: "112" });
  eq(await s.pripravene(3000), "potvrdene");
  s.znova();
  eq([s.stav(), s.mozeOdoslat()], ["meni-sa", false]);
  eq(await s.pripravene(3000), "potvrdene");
  eq(log.posli, ["112", "112"]);
  s.znova();
  await cakaj(80); // požiadavka letí (debounce 40 ms, odpoveď po 100 ms)
  s.znova();
  await cakaj(20);
  eq(await s.pripravene(3000), "potvrdene");
  await cakaj(150);
  eq([log.posli, s.stav()], [["112", "112", "112", "112"], "potvrdene"]);
  // znova + návrat na tú istú voľbu v debounce: aj tak sa pošle (banka je iná)
  s.znova();
  s.zvol({ doprava: "96", platba: "112" });
  eq(await s.pripravene(3000), "potvrdene");
  eq(log.posli.length, 5);
  s.zamkni(true);
  s.znova();
  await cakaj(120);
  eq([log.posli.length, s.stav()], [5, "potvrdene"], "v zámku");
});

const PV = await import("./test-opc/podvrh.mjs");
t("podvrh: košík „dve“ — súčet riadku 2. položky €129, celkom €398 (nie €398 pri oboch riadkoch)", () => {
  const d = new JSDOM(PV.sDvomaPolozkami(fx("sk-set/kosik.html"))).window.document;
  const riadky = Array.prototype.map.call(d.querySelectorAll('tr.removeable [data-testid="cartPrice"]'), (e) => e.textContent.trim());
  eq(riadky, ["€269", "€129"], "súčty riadkov");
  eq(d.querySelector('[data-testid="recapFullPrice"]').textContent.trim(), "€398", "celkom za tovar");
  const k2 = new JSDOM(PV.sDvomaPolozkami(fx("sk-set/krok2.html"))).window.document;
  eq(Array.prototype.map.call(k2.querySelectorAll("#summary-box .cart-item .cart-item-price"), (e) => e.textContent.replace(/\s+/g, "")), ["€269", "€129"], "krok 2: ceny položiek");
});

await Promise.all(asyncTesty); // asynchrónne testy za prvým čakaním (napr. poistka vzhľadu kroku 2)
console.log(zle ? `\n${zle} ZLYHALO, ${ok} OK` : `\nVŠETKO OK (${ok} OK)`);
process.exit(zle ? 1 : 0);
