// Testy ponuky v košíku (assets/js/lcdKosikDoplnok.js): rozbor textu príplatkov, rozhodnutie, payload, ceny,
// farba boxu a postup výmeny riadku proti podvrhnutému košíku Shoptetu (úspech, chyby, vrátenie späť).
//   node tools/test-kosik-doplnok.mjs        (npm run kosik:test)
// Fixtúra tools/test-kosik-doplnok.fixture.json = príplatky zo živých formulárov 7. 10. 2026 (SK Diamond, Hexa,
// Elite Stripe, CZ Diamond, SK box). Živé E2E: scratchpad …/ab-harness/kosik-doplnok-e2e.mjs.
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://www.luxurycardesign.sk/kosik/" });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.location = dom.window.location;
globalThis.localStorage = dom.window.localStorage;
globalThis.sessionStorage = dom.window.sessionStorage;
globalThis.dataLayer = window.dataLayer = [{ shoptet: { projectId: 562035, language: "sk" } }];

const M = await import("../assets/js/lcdKosikDoplnok.js");
const FIX = JSON.parse(readFileSync(new URL("./test-kosik-doplnok.fixture.json", import.meta.url), "utf8"));

let ok = 0, zle = 0;
function test(nazov, fn) {
  return Promise.resolve().then(fn).then(() => { ok++; console.log("OK   " + nazov); }, (e) => { zle++; console.log("FAIL " + nazov + " — " + (e && e.message)); });
}
function rovne(a, b, msg) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  if (ja !== jb) throw new Error((msg ? msg + ": " : "") + ja + " ≠ " + jb);
}
function pravda(v, msg) { if (!v) throw new Error(msg || "nepravda"); }

const SK = { trh: "sk", mena: "EUR", rohoz: "88", classic: "595", premium: "601", nie: "598", farbaBox: "91", box1: "94", box2: "97", boxSolo: "104" };
const CZ = { trh: "cz", mena: "CZK", rohoz: "60", classic: "492", premium: "498", nie: "495", farbaBox: "63", box1: "66", box2: "69", boxSolo: "78" };

function formHtml(p) {
  const opt = (o) => `<option value="${o[0]}" data-surcharge-final-price="${o[2]}" data-surcharge-additional-price="${Math.round((o[2] / (p.lang === "sk" ? 1.23 : 1.21)) * 100) / 100}">${o[1]}</option>`;
  return `<form id="product-detail-form" data-testid="formProduct"><input type="hidden" name="productId" value="${p.pid}"><input type="hidden" name="priceId" value="${p.priceId}"><input type="hidden" name="language" value="${p.lang}">` +
    p.sels.map((s) => `<select name="surchargeParameterValueId[${s.id}]" data-parameter-id="${s.id}" data-parameter-name="${s.n}"><option value="">Vyberte príplatok</option>${s.o.map(opt).join("")}</select>`).join("") + "</form>";
}
const mapa = (k) => M.mapaZFormulara(new DOMParser().parseFromString(formHtml(FIX[k]), "text/html"));
const SKD = mapa("sk/luxusne-autokoberce-dragonskin-diamond-line/");
const SKH = mapa("sk/luxusne-autokoberce-dragonskin-hexa-line/");
const SKES = mapa("sk/luxusne-autokoberce-dragonskin-elite-stripe-line/");
const CZD = mapa("cz/luxusne-autokoberce-dragonskin-diamond-line/");
const BOX = mapa("sk/luxusny-boxi-do-kufra/");

// ---------------------------------------------------------------- texty a mapa
await test("bezCeny: € aj Kč, ' + ' v názve", () => {
  rovne(M.bezCeny("Koberec na dno + boky kufra +€239"), "Koberec na dno + boky kufra");
  rovne(M.bezCeny("Koberec na dno + boky +5 999 Kč"), "Koberec na dno + boky");
  rovne(M.bezCeny("prvý, druhý a tretí rad +€170"), "prvý, druhý a tretí rad");
  rovne(M.bezCeny("nie +€0"), "nie");
  rovne(M.bezCeny("jen první řada +0 Kč"), "jen první řada");
  rovne(M.bezCeny("S : 33x32x30 cm +€89"), "S : 33x32x30 cm");
});
await test("mapa z formulára: názvy, texty bez ceny, ceny", () => {
  rovne(SKD.pid, "598");
  rovne(SKD.params["88"].n, "autokoberce do kufru");
  rovne(SKD.params["88"].o["601"], { t: "Koberec na dno + boky kufra", fp: 239, ap: 194.31 });
  rovne(CZD.params["78"].n, "Velokost box Solo:");
  pravda(M.jeSet(SKD, SK) && M.jeSet(CZD, CZ), "set SK/CZ");
  pravda(!M.jeSet(BOX, SK), "box nie je set");
});
await test("velkost / rozmer / jeZiadny", () => {
  rovne([M.velkost("S : 33x32x30 cm"), M.velkost("L: 54x32x30 cm"), M.velkost("XL: 66x32x30 cm"), M.velkost("ŽIADNY"), M.velkost("Žádný")], ["S", "L", "XL", null, null]);
  rovne(M.rozmer("L: 54x32x30 cm"), "54 × 32 × 30 cm");
  pravda(M.jeZiadny("ŽIADNY") && M.jeZiadny("Žádný") && !M.jeZiadny("S : 33x32x30 cm"));
});

// ---------------------------------------------------------------- rozbor textu
await test("rozbor SK: hodnota s čiarkou (prvý, druhý a tretí rad), rohož nie", () => {
  const r = M.rozoberPriplatky("Príplatky: rozloženie kobercov - prvý, druhý a tretí rad, autokoberce do kufru - nie, TYP - Sedan", SKD);
  rovne(r, { ok: true, volby: { 85: "592", 88: "598", 74: "485" } });
});
await test("rozbor SK: 2 boxy a farba boxov (živý text zo spiku)", () => {
  const r = M.rozoberPriplatky("Príplatky: rozloženie kobercov - len prvý rad, autokoberce do kufru - Koberec na dno + boky kufra, Farba boxov - Farba kože : Čierna / Farba šitia: Červená, Velikost 1. boxu - S : 33x32x30 cm, Velikost 2. boxu - S : 33x32x30 cm, TYP - Sedan", SKD);
  rovne(r.volby, { 74: "485", 85: "586", 88: "601", 91: "604", 94: "619", 97: "634" });
});
await test("rozbor SK: box solo (iné poradie, TYP pred boxom)", () => {
  const r = M.rozoberPriplatky("Príplatky: rozloženie kobercov - len prvý rad, autokoberce do kufru - Koberec na dno kufra, Farba boxov - Farba kože : Čierna / Farba šitia: Červená, TYP - SUV, Velikost Box solo - S : 33x32x30 cm", SKD);
  rovne(r.volby, { 74: "488", 85: "586", 88: "595", 91: "604", 104: "731" });
});
await test("rozbor CZ: TYP „Jiné,Prosím…“, Velokost box Solo:, iné poradie", () => {
  const r = M.rozoberPriplatky("Příplatky: rozložení koberců - první a druhá řada, autokoberce do kufru - Koberec na dno + boky, Barva boxů - Barva kůže: Černá / Barva šití: Červená, TYP - Jiné,Prosím napište do poznámky, Velokost box Solo: - S : 33x32x30 cm", CZD);
  rovne(r.volby, { 47: "380", 57: "486", 60: "498", 63: "501", 78: "660" });
});
await test("rozbor: NBSP, viac medzier, veľké písmená", () => {
  const r = M.rozoberPriplatky("PRÍPLATKY:  Rozloženie kobercov - LEN prvý rad,  autokoberce do kufru - NIE", SKD);
  rovne(r.volby, { 85: "586", 88: "598" });
});
await test("rozbor: chýbajúci parameter rohože -> rohož chýba", () => {
  const r = M.rozoberPriplatky("Príplatky: rozloženie kobercov - len prvý rad, TYP - Combi", SKD);
  rovne(r.volby, { 74: "470", 85: "586" });
  rovne(M.coChyba(r.volby, SKD, SK), { rohoz: "chyba", box: "chyba" });
});
await test("rozbor fail-closed: neznáma hodnota, neznámy parameter, dvakrát ten istý", () => {
  rovne(M.rozoberPriplatky("Príplatky: rozloženie kobercov - štvrtý rad", SKD).ok, false);
  rovne(M.rozoberPriplatky("Príplatky: Niečo nové - áno, rozloženie kobercov - len prvý rad", SKD).ok, false);
  rovne(M.rozoberPriplatky("Príplatky: rozloženie kobercov - len prvý rad, rozloženie kobercov - len prvý rad", SKD).ok, false);
  rovne(M.rozoberPriplatky("Príplatky: rozloženie kobercov - len prvý rad, autokoberce do kufru - nie, Neznámy - x", SKD).ok, false);
});

// ---------------------------------------------------------------- rozhodnutie
await test("rozhodnutie: rohož {nie, chýba, Classic, Premium} × box {chýba, ŽIADNY, 1 box, 2 boxy}", () => {
  const rohoz = { nie: { 88: "598" }, chyba: {}, classic: { 88: "595" }, premium: { 88: "601" } };
  const box = { chyba: {}, ziadny: { 94: "631", 97: "646", 104: "743" }, jeden: { 91: "604", 104: "734" }, dva: { 91: "604", 94: "619", 97: "634" } };
  for (const [rk, rv] of Object.entries(rohoz)) for (const [bk, bv] of Object.entries(box)) {
    const ch = M.coChyba({ 85: "586", ...rv, ...bv }, SKD, SK);
    rovne(ch, { rohoz: rk === "nie" || rk === "chyba" ? "chyba" : "ma", box: bk === "chyba" || bk === "ziadny" ? "chyba" : "ma" }, rk + "×" + bk);
  }
  rovne(M.coChyba({ 85: "586" }, BOX, SK), null, "samostatný box nie je set");
});

// ---------------------------------------------------------------- zmena, payload, ceny
await test("payload: prenesie TYP aj rozloženie, rohož mení len 88", () => {
  const volby = { 85: "592", 88: "598", 74: "485" };
  const zm = M.zmena({ typ: "rohoz", varianta: "classic" }, SKD, SK);
  rovne(zm, { 88: "595" });
  const p = new URLSearchParams(M.zostavPayload({ priceId: "63487" }, volby, zm, SKD, "tok"));
  rovne([...p.entries()], [["priceId", "63487"], ["productId", "598"], ["language", "sk"], ["surchargeParameterValueId[74]", "485"],
    ["surchargeParameterValueId[85]", "592"], ["surchargeParameterValueId[88]", "595"], ["amount", "1"], ["__csrf__", "tok"]]);
});
await test("zmena boxu: 1 box = farba + 104/78, 2 boxy = farba + 94+97 / 66+69", () => {
  rovne(M.zmena({ typ: "box", pocet: 1, velkost: "S", farba: "604" }, SKD, SK), { 91: "604", 104: "731" });
  rovne(M.zmena({ typ: "box", pocet: 2, velkost: "M", farba: "604" }, SKD, SK), { 91: "604", 94: "622", 97: "637" });
  rovne(M.zmena({ typ: "box", pocet: 1, velkost: "S", farba: "501" }, CZD, CZ), { 63: "501", 78: "660" });
  rovne(M.zmena({ typ: "box", pocet: 2, velkost: "XL", farba: "501" }, CZD, CZ), { 63: "501", 66: "525", 69: "540" });
});
await test("rozdiel ceny z mapy (aj „nie +€5“ pri Hexa, iné ceny Elite Stripe, CZ)", () => {
  rovne(M.rozdielCeny({ 88: "598" }, { 88: "595" }, SKD).s, 129);
  rovne(M.rozdielCeny({}, { 88: "601" }, SKD).s, 239);
  rovne(M.rozdielCeny({ 88: "598" }, { 88: "595" }, SKH).s, 124);
  rovne(M.rozdielCeny({}, { 91: "604", 94: "622", 97: "637" }, SKES).s, 99 + 79);
  rovne(M.rozdielCeny({ 104: "743" }, { 91: "604", 104: "731" }, SKD).s, 99);
  rovne(M.rozdielCeny({ 60: "495" }, { 60: "492" }, CZD).s, 3299);
  rovne(M.rozdielCeny({}, { 63: "501", 66: "516", 69: "531" }, CZD).s, 4598);
});
await test("formát ceny SK/CZ", () => {
  rovne(M.cenaText(129, SK, true), "+129 €");
  rovne(M.cenaText(3299, CZ, true), "+3 299 Kč");
  rovne(M.cenaText(12937, CZ), "12 937 Kč");
});

// ---------------------------------------------------------------- farba boxu podľa setu
await test("farba boxu podľa setu (synonymá, Hnedá ≠ Hnedá káva, Elite 2. vrstva)", () => {
  rovne(M.predvolenaFarbaBoxu("farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Červená", SKD, SK), "604");
  rovne(M.predvolenaFarbaBoxu("farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia : Sivá", SKD, SK), "749");
  rovne(M.predvolenaFarbaBoxu("farba 1.vrstvy: Diamond Farba kože : čierna / Farba šitia : bielou", SKD, SK), "746");
  rovne(M.predvolenaFarbaBoxu("farba 1.vrstvy: Diamond Farba kože : Hnedá káva", SKD, SK), "616");
  rovne(M.predvolenaFarbaBoxu("farba 1.vrstvy: Diamond Farba kože : Hnedá", SKD, SK), null);
  rovne(M.predvolenaFarbaBoxu("farba 1.vrstvy: Diamond Farba kože : Oranžová", SKD, SK), null);
  rovne(M.predvolenaFarbaBoxu("farba 1.vrstvy: Stripe Farba kože : Čierna / Farba šitia: Červená, farba 2.vrstvy: Lux Color 10", SKD, SK), "604");
  rovne(M.predvolenaFarbaBoxu("Barva 1.vrstvy: Diamond Barva kůže: Kávově hnědá", CZD, CZ), "513");
  rovne(M.predvolenaFarbaBoxu("Barva 1.vrstvy: Hexa: Barva kůže: Černá / Barva šití: Modrá", CZD, CZ), "507");
  rovne(M.predvolenaFarbaBoxu("Barva 1.vrstvy: Diamond Barva kůže: Vínově červená", CZD, CZ), "654");
  rovne(M.predvolenaFarbaBoxu("Barva 1.vrstvy: Diamond Barva kůže: Béžová", CZD, CZ), "657");
  rovne(M.popisFarby("Farba kože : Čierna / Farba šitia: Červená"), "Čierna / Červená");
  rovne(M.popisFarby("Barva kůže: výnově červena"), "Výnově červena");
});

// ---------------------------------------------------------------- riadky košíka z HTML
const RIADOK = (itemId, priceId, q, sur, href = "/luxusne-autokoberce-dragonskin-diamond-line/", variant = "farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Červená") =>
  `<tr class="removeable" data-micro="cartItem" data-micro-sku="598/DIA"><td class="p-name"><a href="${href}" class="main-link" data-testid="cartProductName"> luxusné autokoberce Dragonskin Basic DIAMOND LINE <span class="main-link-variant" data-testid="cartWidgetVariantName">${variant}</span> <span class="main-link-surcharges" data-testid="cartWidgetSurchargeName">${sur}</span></a></td>` +
  `<td><form class="quantity-form"><input type="hidden" value="${itemId}" name="itemId"><input type="hidden" value="${priceId}" name="priceId"><input type="number" name="amount" value="${q}" class="amount"></form></td>` +
  `<td><form><input type="hidden" name="itemId" value="${itemId}"><input type="hidden" name="priceId" value="${priceId}"><input type="hidden" name="amount" value="1"></form></td></tr>`;
await test("riadky košíka z HTML (itemId, priceId, množstvo, surový text, variant, názov)", () => {
  const d = new DOMParser().parseFromString("<table>" + RIADOK("abc", "63487", 2, "Príplatky: rozloženie kobercov - len prvý rad") + "</table>", "text/html");
  const [r] = M.rozoberRiadky(d);
  rovne([r.itemId, r.priceId, r.q, r.sur, r.href, r.sku, r.nazov], ["abc", "63487", 2, "Príplatky: rozloženie kobercov - len prvý rad", "/luxusne-autokoberce-dragonskin-diamond-line/", "598/DIA", "luxusné autokoberce Dragonskin Basic DIAMOND LINE"]);
});

// ---------------------------------------------------------------- výmena riadku proti podvrhnutému košíku
function kosik(mapaP, { zaklad = 219 } = {}) {
  const st = { rows: [], n: 0, volania: [], chyby: {} };
  const poradie = Object.keys(mapaP.params);
  const text = (volby) => "Príplatky: " + poradie.filter((p) => volby[p] !== undefined).map((p) => mapaP.params[p].n + " - " + mapaP.params[p].o[volby[p]].t).join(", ");
  const cena = (volby) => zaklad + Object.keys(volby).reduce((s, p) => s + mapaP.params[p].o[volby[p]].fp, 0);
  st.pridaj = (volby, q = 1, priceId = "63487") => {
    const r = { itemId: "it" + ++st.n, priceId, q, volby, sur: text(volby), p: cena(volby) };
    st.rows.push(r);
    return r;
  };
  const odpoved = (code, extra) => ({ ok: true, status: 200, text: async () => JSON.stringify({ code, message: "m", payload: Object.assign({ cartItems: st.rows.map((r) => ({ itemId: r.itemId, priceId: +r.priceId, quantity: r.q, priceWithVat: Math.round(r.p * (st.pomer || 1) * 100) / 100, discounts: { finalRatio: st.pomer || 1 } })) }, extra || {}) }) });
  // st.stratOdpoved[akcia] = n: server akciu vykoná, ale odpoveď sa stratí (fetch hodí výnimku) n-krát
  // st.htmlOdpoved[akcia] = n: server akciu vykoná a vráti HTTP 200 s HTML (nie JSON) n-krát
  // st.predAdd = fn: iná karta / zariadenie zmení košík tesne pred spracovaním nášho addCartItem
  // st.gccChyba = n: GetCartContent po pridaní zlyhá n-krát
  st.stratOdpoved = {}; st.htmlOdpoved = {};
  let pridane = false;
  const vybav = (akcia, odp) => {
    if (st.stratOdpoved[akcia] && st.stratOdpoved[akcia]-- > 0) throw new TypeError("Failed to fetch");
    if (st.htmlOdpoved[akcia] && st.htmlOdpoved[akcia]-- > 0) return { ok: true, status: 200, redirected: false, text: async () => "<!doctype html><html><body>košík</body></html>" };
    return odp;
  };
  globalThis.fetch = async (url, opt = {}) => {
    const akcia = String(url).split("/action/Cart/")[1].replace(/\/.*$/, "");
    st.volania.push(akcia);
    if (akcia === "GetCartContent") {
      if (pridane && st.gccChyba && st.gccChyba-- > 0) throw new TypeError("Failed to fetch");
      const html = "<table>" + st.rows.map((r) => RIADOK(r.itemId, r.priceId, r.q, r.sur)).join("") + "</table>";
      return { ok: true, status: 200, text: async () => JSON.stringify({ code: 200, payload: { content: html } }) };
    }
    const b = new URLSearchParams(opt.body);
    if (st.chyby[akcia] && st.chyby[akcia]-- > 0) return odpoved(500);
    if (akcia === "addCartItem") {
      pridane = true;
      if (st.predAdd) { const f = st.predAdd; st.predAdd = null; f(st); }
      const volby = {};
      for (const [k, v] of b.entries()) { const m = /^surchargeParameterValueId\[(\d+)\]$/.exec(k); if (m) volby[m[1]] = v; }
      if (st.zahod) delete volby[st.zahod];
      const ex = st.rows.find((r) => r.priceId === b.get("priceId") && JSON.stringify(r.volby) === JSON.stringify(volby));
      if (ex) ex.q += 1; else { const r = st.pridaj(volby, 1, b.get("priceId")); if (st.cenaNavyse) r.p += st.cenaNavyse; }
      return vybav(akcia, odpoved(200));
    }
    const r = st.rows.find((x) => x.itemId === b.get("itemId"));
    if (!r) return odpoved(500);
    if (akcia === "deleteCartItem") st.rows.splice(st.rows.indexOf(r), 1);
    if (akcia === "setCartItemAmount") r.q = +b.get("amount");
    return vybav(akcia, odpoved(200));
  };
  return st;
}
const stav = (st) => st.rows.map((r) => [r.volby[88], r.q]);
const priprav = (st, volby, q = 1) => {
  const r = st.pridaj(volby, q);
  const riadok = M.rozoberRiadky(new DOMParser().parseFromString("<table>" + RIADOK(r.itemId, r.priceId, r.q, r.sur) + "</table>", "text/html"))[0];
  return { r, riadok };
};
const vymen = (riadok, volby, zm, m = SKD) => M.vymen({ riadok, volby, mapa: m, R: SK, zmena: zm, rozdiel: M.rozdielCeny(volby, zm, m), doplnok: { kod: "test" } });

await test("výmena: úspech — 1 riadok s rohožou, cena +129, starý zmazaný", async () => {
  const st = kosik(SKD); const volby = { 85: "592", 88: "598", 74: "485" }; const { riadok } = priprav(st, volby);
  const v = await vymen(riadok, volby, { 88: "595" });
  pravda(v.ok, JSON.stringify(v));
  rovne(st.rows.map((r) => [r.volby[88], r.p, r.q]), [["595", 219 + 155 + 129, 1]]);
});
await test("výmena: code 500 pri pridaní -> nič sa nemaže", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { riadok } = priprav(st, volby);
  st.chyby.addCartItem = 1;
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok], [false, "pridanie"]);
  rovne(st.rows.length, 1); pravda(!st.volania.includes("deleteCartItem"));
});
await test("výmena: nesedí cena -> nový riadok sa zmaže, košík ako predtým", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary, riadok } = priprav(st, volby);
  st.cenaNavyse = 1;
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "kontrola_ceny", false]);
  rovne(st.rows.map((r) => r.itemId), [stary.itemId]);
});
await test("výmena: server zahodí príplatok (text nesedí) -> vrátenie", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598", 74: "470" }; const { r: stary, riadok } = priprav(st, volby);
  st.zahod = "74"; // server by „stratil“ TYP Combi (+15) — cena by tiež nesedela, preto aj cena navýš späť
  st.cenaNavyse = 15;
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok], [false, "kontrola_textu"]);
  rovne(st.rows.map((r) => r.itemId), [stary.itemId]);
});
await test("výmena: zlúčenie s existujúcim rovnakým riadkom -> pri chybe späť na pôvodné množstvo", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" };
  const ex = st.pridaj({ 85: "586", 88: "595" }, 1);
  const { r: stary, riadok } = priprav(st, volby);
  ex.p += 0;
  // úspech pri zlúčení: existujúci riadok q 2, starý zmazaný
  const v = await vymen(riadok, volby, { 88: "595" });
  pravda(v.ok, JSON.stringify(v));
  rovne(st.rows.map((r) => [r.itemId, r.q]), [[ex.itemId, 2]]);
  rovne(st.rows.some((r) => r.itemId === stary.itemId), false);
});
await test("výmena: starý riadok s množstvom 2 -> setCartItemAmount 1", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary, riadok } = priprav(st, volby, 2);
  const v = await vymen(riadok, volby, { 91: "604", 104: "731" });
  pravda(v.ok, JSON.stringify(v));
  rovne(st.rows.map((r) => [r.itemId === stary.itemId ? "stary" : "novy", r.q, r.p]), [["stary", 1, 219], ["novy", 1, 219 + 99]]);
});
await test("výmena: zmazanie starého zlyhá 2× -> čiastočná chyba (oba riadky ostali)", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { riadok } = priprav(st, volby);
  st.chyby.deleteCartItem = 2;
  const v = await vymen(riadok, volby, { 88: "601" });
  rovne([v.ok, v.krok, v.ciastocne, v.reload], [false, "zmazanie", true, true]);
  rovne(st.rows.length, 2);
});
await test("výmena: zmazanie zlyhá 1× -> opakovanie uspeje", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { riadok } = priprav(st, volby);
  st.chyby.deleteCartItem = 1;
  const v = await vymen(riadok, volby, { 88: "601" });
  pravda(v.ok, JSON.stringify(v)); rovne(st.rows.length, 1);
});
await test("výmena: zľava zákazníka (finalRatio 0,9 na oboch riadkoch) -> cena sa porovná s pomerom", async () => {
  const st = kosik(SKD); st.pomer = 0.9; const volby = { 85: "586", 88: "598" }; const { riadok } = priprav(st, volby);
  const v = await vymen(riadok, volby, { 88: "595" });
  pravda(v.ok, JSON.stringify(v)); rovne(st.rows.map((r) => r.volby[88]), ["595"]);
});
await test("výmena: riadok sa medzitým zmenil (iná karta) -> nič sa nepridá", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r, riadok } = priprav(st, volby);
  r.sur = "Príplatky: rozloženie kobercov - prvý a druhý rad, autokoberce do kufru - nie";
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok], [false, "zmena_kosika"]);
  pravda(!st.volania.includes("addCartItem"));
});


// ---------------------------------------------------------------- neistá odpoveď addCartItem (revízia 7. 10. 2026)
await test("neisté pridanie: odpoveď sa stratí, server riadok pridal -> vrátený 1 kus, košík ako predtým, bez reload", async () => {
  const st = kosik(SKD); const volby = { 85: "589", 88: "598", 74: "473" }; const { r: stary, riadok } = priprav(st, volby);
  st.stratOdpoved.addCartItem = 1;
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload, v.vratene], [false, "pridanie", false, true], JSON.stringify(v));
  rovne(st.rows.map((r) => [r.itemId, r.q]), [[stary.itemId, 1]]);
  // opakovaný klik (sieť OK) -> 1 set s rohožou, nie 2
  const v2 = await vymen(riadok, volby, { 88: "595" });
  pravda(v2.ok, JSON.stringify(v2));
  rovne(stav(st), [["595", 1]]);
});
await test("neisté pridanie: HTTP 200 s HTML (nie JSON), riadok pribudol -> vrátenie, žiadny tichý duplikát", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary, riadok } = priprav(st, volby);
  st.htmlOdpoved.addCartItem = 1;
  const v = await vymen(riadok, volby, { 88: "601" });
  rovne([v.ok, v.krok, !!v.reload], [false, "pridanie", false], JSON.stringify(v));
  rovne(st.rows.map((r) => [r.itemId, r.q]), [[stary.itemId, 1]]);
});
await test("neisté pridanie: výnimka a nič nepribudlo -> overené „bez zmeny“ (bez reload, nič sa nemaže)", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary, riadok } = priprav(st, volby);
  const f = globalThis.fetch;
  globalThis.fetch = async (url, opt) => { if (/addCartItem/.test(url)) throw new TypeError("Failed to fetch"); return f(url, opt); };
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "pridanie", false], JSON.stringify(v));
  rovne(st.rows.map((r) => [r.itemId, r.q]), [[stary.itemId, 1]]);
  pravda(!st.volania.includes("deleteCartItem") && !st.volania.includes("setCartItemAmount"));
});
await test("neisté pridanie: výnimka a košík sa nedá načítať -> reload (nikdy „bez zmeny“ naslepo)", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { riadok } = priprav(st, volby);
  st.stratOdpoved.addCartItem = 1; st.gccChyba = 5;
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "pridanie", true], JSON.stringify(v));
  pravda(!st.volania.includes("deleteCartItem"), "nič sa nemaže naslepo");
});
await test("neisté pridanie: zlúčenie do existujúceho riadku q 2 -> späť presne na q 2 (setCartItemAmount, nie zmazanie)", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" };
  const ex = st.pridaj({ 85: "586", 88: "595" }, 2);
  const { r: stary, riadok } = priprav(st, volby);
  st.stratOdpoved.addCartItem = 1;
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "pridanie", false], JSON.stringify(v));
  rovne(st.rows.map((r) => [r.itemId, r.q]), [[ex.itemId, 2], [stary.itemId, 1]]);
});
await test("vrátenie: odpoveď deleteCartItem sa stratí -> stav sa overí v košíku (vrátené, bez reload)", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary, riadok } = priprav(st, volby);
  st.cenaNavyse = 1; st.stratOdpoved.deleteCartItem = 1;
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "kontrola_ceny", false], JSON.stringify(v));
  rovne(st.rows.map((r) => r.itemId), [stary.itemId]);
});
await test("vrátenie pri zlúčení do riadku q 2 (cena nesedí) -> q 3 späť na q 2, riadok sa nezmaže", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" };
  const ex = st.pridaj({ 85: "586", 88: "595" }, 2);
  ex.p += 1; // existujúci riadok má inú cenu -> kontrola ceny zlyhá
  const { r: stary, riadok } = priprav(st, volby);
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "kontrola_ceny", false], JSON.stringify(v));
  rovne(st.rows.map((r) => [r.itemId, r.q]), [[ex.itemId, 2], [stary.itemId, 1]]);
});

// ---------------------------------------------------------------- súbeh dvoch kariet / zariadení
const inaKarta = (doplnok) => (st) => {
  // druhá karta stihne výmenu: pridá X + doplnok (nový riadok), zmaže X
  const x = st.rows[0];
  st.pridaj(Object.assign({}, x.volby, { 88: doplnok }), 1, x.priceId);
  st.rows.splice(0, 1);
};
await test("súbeh, rovnaký doplnok: naše pridanie sa zlúči do riadku druhej karty (q 2) -> späť na q 1, 1 set, reload", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598", 74: "485" }; const { riadok } = priprav(st, volby);
  st.predAdd = inaKarta("595");
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "zmena_kosika", true], JSON.stringify(v));
  rovne(stav(st), [["595", 1]]);
  pravda(!st.volania.includes("deleteCartItem"), "riadok s q 2 sa nesmie zmazať celý");
});
await test("súbeh, iný doplnok (druhá karta Premium, my Classic) -> vrátený len náš riadok, 1 set Premium", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598", 74: "485" }; const { riadok } = priprav(st, volby);
  st.predAdd = inaKarta("601");
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "zmena_kosika", true], JSON.stringify(v));
  rovne(stav(st), [["601", 1]]);
});
await test("súbeh + stratená odpoveď: pribudli 2 kusy setu, nevieme, ktorý je náš -> nič sa nemaže, reload", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598", 74: "485" }; const { riadok } = priprav(st, volby);
  st.predAdd = inaKarta("595"); st.stratOdpoved.addCartItem = 1;
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, !!v.reload], [false, true], JSON.stringify(v));
  pravda(!st.volania.includes("deleteCartItem") && !st.volania.includes("setCartItemAmount"), "nehádať");
});
await test("súbeh, obe výmeny spracované (iná karta Premium, my Classic, X ešte v košíku) -> vrátený náš kus, X ostáva", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598", 74: "485" }; const { r: x, riadok } = priprav(st, volby);
  st.predAdd = (s) => { s.pridaj(Object.assign({}, x.volby, { 88: "601" }), 1, x.priceId); };
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, v.krok, !!v.reload], [false, "zmena_kosika", true], JSON.stringify(v));
  rovne(stav(st), [["598", 1], ["601", 1]]);
});
await test("iný produkt pribudol zároveň (napr. darček) -> výmena prebehne normálne", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { riadok } = priprav(st, volby);
  st.predAdd = (s) => { s.pridaj({}, 1, "99999"); };
  const v = await vymen(riadok, volby, { 88: "595" });
  pravda(v.ok, JSON.stringify(v));
  rovne(st.rows.map((r) => [r.priceId, r.volby[88] || null, r.q]), [["99999", null, 1], ["63487", "595", 1]]);
});
await test("súbeh: pribudol cudzí riadok, ktorý nevieme priradiť (neistá odpoveď) -> nič sa nemaže, reload", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { riadok } = priprav(st, volby);
  st.predAdd = (s) => { s.pridaj({ 85: "592", 88: "598" }, 1); };
  st.zahod = "85"; st.stratOdpoved.addCartItem = 1; // náš riadok vznikne bez rozloženia -> text nesedí
  const v = await vymen(riadok, volby, { 88: "595" });
  rovne([v.ok, !!v.reload], [false, true], JSON.stringify(v));
  pravda(!st.volania.includes("deleteCartItem") && !st.volania.includes("setCartItemAmount"), "nehádať");
});

// ---------------------------------------------------------------- rozbehnutá výmena: zámok bez Web Locks, odchod zo stránky
await test("bez zámku medzi kartami (zamknute: false): neisté pridanie a pribudol presne náš kus -> nič sa nemaže, reload", async () => {
  // dve karty bez Web Locks a bez localStorage: kus mohla pridať druhá karta (tá zároveň maže pôvodný riadok) -> nehádať
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary, riadok } = priprav(st, volby);
  st.stratOdpoved.addCartItem = 1;
  const v = await M.vymen({ riadok, volby, mapa: SKD, R: SK, zmena: { 88: "595" }, rozdiel: M.rozdielCeny(volby, { 88: "595" }, SKD), doplnok: { kod: "test" }, zamknute: false });
  rovne([v.ok, !!v.reload], [false, true], JSON.stringify(v));
  pravda(!st.volania.includes("deleteCartItem") && !st.volania.includes("setCartItemAmount"), "nič sa nemaže");
  rovne(st.rows.map((r) => [r.itemId === stary.itemId, r.volby[88], r.q]), [[true, "598", 1], [false, "595", 1]]);
});
await test("výmena hlási fázy pre záznam: pridavam (pred addCartItem, s množstvami) -> mazem (nový riadok, pred zmazaním)", async () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary, riadok } = priprav(st, volby);
  const fazy = [];
  const v = await M.vymen({ riadok, volby, mapa: SKD, R: SK, zmena: { 88: "595" }, rozdiel: M.rozdielCeny(volby, { 88: "595" }, SKD), doplnok: { kod: "test" },
    faza: (f, d) => fazy.push([f, JSON.parse(JSON.stringify(d)), st.volania.slice()]) });
  pravda(v.ok, JSON.stringify(v));
  rovne(fazy.map((x) => x[0]), ["pridavam", "mazem"]);
  rovne(fazy[0][1], { pred: { [stary.itemId]: 1 } });
  rovne(fazy[0][2], ["GetCartContent"], "pridavam pred addCartItem");
  rovne(fazy[1][1], { novy: { itemId: st.rows[0].itemId, q: 1 } });
  pravda(fazy[1][2].includes("addCartItem") && !fazy[1][2].includes("deleteCartItem"), "mazem pred zmazaním");
});

const RIADKY = (st) => M.rozoberRiadky(new DOMParser().parseFromString("<table>" + st.rows.map((r) => RIADOK(r.itemId, r.priceId, r.q, r.sur)).join("") + "</table>", "text/html"));
const zaznam = (stary, volby, zm, extra) => Object.assign({ id: "z1", t: 1000, hb: 1000, stary: { itemId: stary.itemId, priceId: String(stary.priceId), q: stary.q }, ocakavane: Object.assign({}, volby, zm) }, extra);
await test("obnova: pridavam, add ešte nedorazil (do 15 s) -> čakaj; neskôr -> nič", () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary } = priprav(st, volby);
  const z = zaznam(stary, volby, { 88: "595" }, { faza: "pridavam", pred: { [stary.itemId]: 1 } });
  rovne(M.rozhodniObnovu(z, RIADKY(st), SKD, 1000 + 3000).akcia, "cakaj");
  rovne(M.rozhodniObnovu(z, RIADKY(st), SKD, 1000 + 16000).akcia, "nic");
});
await test("obnova: pridavam, nový riadok s našimi voľbami pribudol (+1) -> vrátiť ten kus", () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary } = priprav(st, volby);
  const novy = st.pridaj({ 85: "586", 88: "595" }, 1);
  const z = zaznam(stary, volby, { 88: "595" }, { faza: "pridavam", pred: { [stary.itemId]: 1 } });
  const o = M.rozhodniObnovu(z, RIADKY(st), SKD, 99999);
  rovne([o.akcia, o.kus], ["vrat", { itemId: novy.itemId, priceId: "63487", q: 1 }]);
});
await test("obnova: pridavam, zlúčenie do existujúceho riadku q1 -> q2 -> vrátiť 1 kus (q2)", () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" };
  const ex = st.pridaj({ 85: "586", 88: "595" }, 1);
  const { r: stary } = priprav(st, volby);
  const z = zaznam(stary, volby, { 88: "595" }, { faza: "pridavam", pred: { [ex.itemId]: 1, [stary.itemId]: 1 } });
  ex.q = 2;
  const o = M.rozhodniObnovu(z, RIADKY(st), SKD, 99999);
  rovne([o.akcia, o.kus && o.kus.q], ["vrat", 2]);
});
await test("obnova: pridavam, pribudol riadok s inými voľbami / pôvodný sa zmenil -> nejasné (nič nemazať)", () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary } = priprav(st, volby);
  st.pridaj({ 85: "586", 88: "601" }, 1);
  const z = zaznam(stary, volby, { 88: "595" }, { faza: "pridavam", pred: { [stary.itemId]: 1 } });
  rovne(M.rozhodniObnovu(z, RIADKY(st), SKD, 99999).akcia, "nejasne");
  st.rows.pop(); stary.q = 2;
  rovne(M.rozhodniObnovu(z, RIADKY(st), SKD, 99999).akcia, "nejasne");
});
await test("obnova: mazem — pôvodný ostal -> dokončiť (o 1 kus menej); už zmazaný -> hotové; iné -> nejasné", () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary } = priprav(st, volby);
  const novy = st.pridaj({ 85: "586", 88: "595" }, 1);
  const z = zaznam(stary, volby, { 88: "595" }, { faza: "mazem", pred: { [stary.itemId]: 1 }, novy: { itemId: novy.itemId, q: 1 } });
  const o = M.rozhodniObnovu(z, RIADKY(st), SKD, 99999);
  rovne([o.akcia, o.kus], ["dokonci", { itemId: stary.itemId, priceId: "63487", q: 1 }]);
  st.rows.splice(st.rows.indexOf(stary), 1);
  rovne(M.rozhodniObnovu(z, RIADKY(st), SKD, 99999).akcia, "hotove");
  novy.q = 2;
  st.rows.push(stary);
  rovne(M.rozhodniObnovu(z, RIADKY(st), SKD, 99999).akcia, "nejasne");
});
await test("obnova: mazem pri množstve 2 -> dokončiť = pôvodný na q1; q už 1 -> hotové", () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary } = priprav(st, volby, 2);
  const novy = st.pridaj({ 85: "586", 88: "595" }, 1);
  const z = zaznam(stary, volby, { 88: "595" }, { faza: "mazem", pred: { [stary.itemId]: 2 }, novy: { itemId: novy.itemId, q: 1 } });
  rovne(M.rozhodniObnovu(z, RIADKY(st), SKD, 99999).akcia, "dokonci");
  stary.q = 1;
  rovne(M.rozhodniObnovu(z, RIADKY(st), SKD, 99999).akcia, "hotove");
});
await test("obnova: start / zamok (nič neodoslané) -> nič; bez mapy -> nejasné", () => {
  const st = kosik(SKD); const volby = { 85: "586", 88: "598" }; const { r: stary } = priprav(st, volby);
  const novy = st.pridaj({ 85: "586", 88: "595" }, 1);
  rovne(M.rozhodniObnovu(zaznam(stary, volby, { 88: "595" }, { faza: "start" }), RIADKY(st), SKD, 99999).akcia, "nic");
  rovne(M.rozhodniObnovu(zaznam(stary, volby, { 88: "595" }, { faza: "mazem", novy: { itemId: novy.itemId, q: 1 } }), RIADKY(st), null, 99999).akcia, "nejasne");
});
await test("záznam živý: tep do 5 s a nie opustený; hotovo / opustený / starý tep -> nie", () => {
  pravda(M.zaznamZivy({ faza: "pridavam", hb: 10000 }, 14000));
  pravda(!M.zaznamZivy({ faza: "pridavam", hb: 10000 }, 15001));
  pravda(!M.zaznamZivy({ faza: "pridavam", hb: 10000, opustene: true }, 10001));
  pravda(!M.zaznamZivy({ faza: "hotovo", hb: 10000 }, 10001));
  pravda(!M.zaznamZivy(null, 1));
});
await test("stránka vykreslená pred zmazaním pôvodného riadku (dataLayer): pôvodné množstvo -> áno", () => {
  pravda(M.vykreslenePredZmazanim({ itemId: "a", q: 1 }, [{ itemId: "a", quantity: 1 }, { itemId: "b", quantity: 1 }]));
  pravda(!M.vykreslenePredZmazanim({ itemId: "a", q: 1 }, [{ itemId: "b", quantity: 1 }]));
  pravda(M.vykreslenePredZmazanim({ itemId: "a", q: 2 }, [{ itemId: "a", quantity: 2 }]));
  pravda(!M.vykreslenePredZmazanim({ itemId: "a", q: 2 }, [{ itemId: "a", quantity: 1 }]));
});

console.log(`\n${zle ? "ZLYHALO " + zle : "VŠETKO OK"} (${ok} OK)`);
process.exit(zle ? 1 : 0);
