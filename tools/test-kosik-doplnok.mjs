// Testy ponuky v košíku (assets/js/lcdKosikDoplnok.js): rozbor textu príplatkov, rozhodnutie, payload, ceny,
// farba boxu a postup výmeny riadku proti podvrhnutému košíku Shoptetu (úspech, chyby, vrátenie späť).
//   node tools/test-kosik-doplnok.mjs        (npm run kosik:test)
// Fixtúra tools/test-kosik-doplnok.fixture.json = príplatky zo živých formulárov 7. 10. 2026 (SK Diamond, Hexa,
// Elite Stripe, CZ Diamond, SK box). Druhá vrstva: tools/test-kosik-vrstva.fixture.json (10. 10. 2026, jedno- aj
// dvojvrstvové stránky SK Diamond, SK Stripe, CZ Diamond vrátane necessaryVariantData). Živé E2E: scratchpad
// …/ab-harness/kosik-doplnok-e2e.mjs.
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
await test("2 boxy rôznych veľkostí (Michal 10. 10.): 1. box M, 2. box L — každý svoj parameter; bez velkost2 = rovnaká", () => {
  const L2 = M.velkostiBoxu(SKD, "97").L.id, M1 = M.velkostiBoxu(SKD, "94").M.id;
  rovne(M.zmena({ typ: "box", pocet: 2, velkost: "M", velkost2: "L", farba: "604" }, SKD, SK), { 91: "604", 94: M1, 97: L2 });
  rovne(M.zmena({ typ: "box", pocet: 2, velkost: "M", velkost2: null, farba: "604" }, SKD, SK), { 91: "604", 94: "622", 97: "637" });
  const r = M.rozdielCeny({}, M.zmena({ typ: "box", pocet: 2, velkost: "M", velkost2: "L", farba: "604" }, SKD, SK), SKD);
  pravda(r && r.s > M.rozdielCeny({}, { 91: "604", 94: "622", 97: "637" }, SKD).s, "M+L drahšie ako M+M");
});
await test("samostatná cena boxov: 1 box, 2 rovnaké, 2 rôzne (základ + príplatok 1. a 2. boxu), chýbajúce údaje -> null", () => {
  const sam = { box1: { S: 197, M: 217 }, box2: { S: 394, M: 434 }, zaklad: 197, p1: { S: 0, M: 20 }, p2: { S: 197, M: 217, L: 247 } };
  rovne(M.samostatneBoxy(sam, 1, "M"), 217);
  rovne(M.samostatneBoxy(sam, 2, "S", "S"), 394);
  rovne(M.samostatneBoxy(sam, 2, "M", "L"), 197 + 20 + 247);
  rovne(M.samostatneBoxy({ box1: {}, box2: { S: 394 } }, 2, "S", null), 394); // starý záznam bez p1/p2
  rovne(M.samostatneBoxy({ box1: {}, box2: { S: 394 } }, 2, "S", "M"), null);
  rovne(M.samostatneBoxy(null, 1, "S"), null);
});
await test("odobratie doplnku (krížik v košíku): rohož -> „nie“, box -> parametre boxu vynechané, cena klesne", () => {
  const T = { rohozKratko: "Rohož", classic: "Classic", premium: "Premium", box2: "2 boxy", boxJeden: "Box" };
  const sRohozou = { 85: "586", 88: "601", 74: "485" };
  rovne(M.zmenaOdober("rohoz", sRohozou, SK), { 88: "598" });
  rovne(M.zmenaOdober("rohoz", { 88: "598" }, SK), null); // rohož nemá -> nič
  rovne(M.rozdielCeny(sRohozou, { 88: "598" }, SKD).s, -239);
  const s2Boxmi = { 85: "586", 88: "598", 74: "485", 91: "604", 94: "622", 97: "640" };
  const zm = M.zmenaOdober("box", s2Boxmi, SK);
  rovne(zm, { 91: null, 94: null, 97: null });
  rovne(M.zluc(s2Boxmi, zm), { 74: "485", 85: "586", 88: "598" });
  rovne(M.rozdielCeny(s2Boxmi, zm, SKD).s, -(99 + 119));
  const p = new URLSearchParams(M.zostavPayload({ priceId: "1" }, s2Boxmi, zm, SKD, null));
  pravda(![...p.keys()].some((k) => /\[(91|94|97)\]/.test(k)), "box parametre v payloade nie sú");
  rovne(M.zmenaOdober("box", { 88: "598" }, SK), null);
  rovne(M.doplnkySetu(s2Boxmi, SKD, SK, T).map((d) => d.nazov), ["2 boxy M + L"]);
  rovne(M.doplnkySetu({ 88: "601", 91: "604", 104: "731" }, SKD, SK, T).map((d) => d.nazov), ["Rohož Premium", "Box S"]);
  rovne(M.doplnkySetu({ 88: "598", 94: "631", 97: "646" }, SKD, SK, T), []); // ŽIADNY = bez boxu
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

await test("štítok zľavy zaokrúhľuje nadol (nikdy nesľubuje viac): SK box 54,8 % -> 54, Premium 29,7 % -> 29", () => {
  rovne(M.zlava(197, 89), 54);
  rovne(M.zlava(340, 239), 29);
  rovne(M.zlava(230, 129), 43);
  rovne(M.zlava(129, 129), 0);
  rovne(M.zlava(null, 99), 0);
  rovne(M.zlava(200, 180), 10); // presné celé % nespadne na 9
  rovne(M.zlava(5799, 3299), 43); // CZ Classic
  rovne(M.zlava(8744, 5999), 31); // CZ Premium
});
await test("fotky doplnkov: béžové fotky kufra z návrhu konfigurátora (assets/img/kosik/)", () => {
  const B = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/kosik/";
  rovne(M.fotoDoplnku(M.FOTKY.classic), B + "rohoz-classic.jpg");
  rovne(M.FOTKY.premium, undefined, "Premium sa neponúka");
  rovne(M.fotoDoplnku(M.FOTKY.box1), B + "box-1.jpg");
  rovne(M.fotoDoplnku(M.FOTKY.box2), B + "box-2.jpg");
});

// ---------------------------------------------------------------- druhá vrstva (jednovrstvový -> dvojvrstvový set)
// Fixtúra tools/test-kosik-vrstva.fixture.json = živé stránky 10. 10. 2026 (SK Diamond, SK Stripe, CZ Diamond — jedno-
// aj dvojvrstvový produkt): príplatky, varianty a necessaryVariantData (pri dvojvrstvovom len niekoľko farieb 1. vrstvy).
const FV = JSON.parse(readFileSync(new URL("./test-kosik-vrstva.fixture.json", import.meta.url), "utf8"));
const RSK = M.ROLE[562035], RCZ = M.ROLE[581408];
function strankaProduktu(p, { bezSkriptu = false } = {}) {
  const sur = (o) => `<option value="${o[0]}" data-surcharge-final-price="${o[2]}" data-surcharge-additional-price="${o[3]}">${o[1]}</option>`;
  const data = Object.assign({}, p.kom);
  // ako na živom webe: é, \/ a „}“ v reťazci nesmú rozbiť čítanie objektu
  const k0 = Object.keys(data)[0];
  data[k0] = Object.assign({ name: "luxusné autokoberce {Dragonskin} / \"test\" }" }, data[k0]);
  const json = JSON.stringify(data).replace(/é/g, "\\u00e9").replace(/\//g, "\\/");
  return `<!doctype html><html><body><form id="product-detail-form"><input type="hidden" name="productId" value="${p.pid}"><input type="hidden" name="priceId" value="${p.priceId}"><input type="hidden" name="language" value="${p.lang}">` +
    p.vsels.map((s) => `<select name="parameterValueId[${s.id}]" class="hidden-split-parameter" data-parameter-id="${s.id}" data-parameter-name="${s.n}"><option value="">Zvoľte variant</option>${s.o.map((o) => `<option value="${o[0]}">${o[1]}</option>`).join("")}</select>`).join("") +
    p.sels.map((s) => `<select name="surchargeParameterValueId[${s.id}]" data-parameter-id="${s.id}" data-parameter-name="${s.n}"><option value="">Vyberte príplatok</option>${s.o.map(sur).join("")}</select>`).join("") +
    `</form>` + (bezSkriptu ? "" : `<script>\n    shoptet.variantsSplit = shoptet.variantsSplit || {};\n    shoptet.variantsSplit.necessaryVariantData = ${json};\n    var dalsi = { "a": "}" };\n</script>`) + `</body></html>`;
}
const mapaV = (k, o) => M.mapaZFormulara(new DOMParser().parseFromString(strankaProduktu(FV[k], o), "text/html"));
const SKB = mapaV("sk/basic-diamond"), SKE = mapaV("sk/elite-diamond");
const SSB = mapaV("sk/basic-stripe"), SSE = mapaV("sk/elite-stripe");
const CZB = mapaV("cz/basic-diamond"), CZE = mapaV("cz/elite-diamond");
const textPriplatkov = (volby, m) => "Príplatky: " + Object.keys(m.params).filter((p) => volby[p] !== undefined).map((p) => m.params[p].n + " - " + m.params[p].o[volby[p]].t).join(", ");
const V1_CC = "farba 1.vrstvy: Diamond Farba kože : Čierna / Farba šitia: Červená";
const riadokV = (priceId, volby, m, variant = V1_CC, href = "/luxusne-autokoberce-dragonskin-diamond-line/") => ({ itemId: "r1", priceId, q: 1, sur: textPriplatkov(volby, m), variant, href, nazov: "luxusné autokoberce Dragonskin Basic DIAMOND LINE", sku: "598/DIA", text: "" });

await test("necessaryVariantData: kľúče SK „78-543“ / „71-540-78-543“, CZ „72-546“ / „44-453-72-546“, priceId a cena", () => {
  rovne(SKB.kom["78-543"], { id: "63487", c: 219 });
  rovne(SKE.kom["71-540-78-543"], { id: "66983", c: 351 });
  rovne(CZB.kom["72-546"], { id: "43605", c: 5664 });
  rovne(CZE.kom["44-453-72-546"], { id: "43662", c: 8799 });
  rovne(Object.keys(SKB.kom).length, 18);
  rovne([SKE.vpar["71"].n, SKE.vpar["71"].o["540"], SKE.vpar["78"].o["543"]], ["farba 2.vrstvy", "Lux Color 10", "Diamond Farba kože : Čierna / Farba šitia: Červená"]);
  rovne([CZE.vpar["44"].n, CZE.vpar["44"].o["453"], CZE.vpar["72"].o["576"]], ["Barva 2.vrstvy", "Lux Color 10", "Diamond Barva kůže: Kávově hnědá"]);
  rovne(mapaV("sk/basic-diamond", { bezSkriptu: true }).kom, null, "bez skriptu -> null");
});
await test("hodnota 1. vrstvy z priceId riadku a kľúč kombinácie (SK aj CZ)", () => {
  rovne([M.v1ZPriceId("63487", SKB, RSK), M.v1ZPriceId(43605, CZB, RCZ), M.v1ZPriceId("99999", SKB, RSK), M.v1ZPriceId("66983", SKE, RSK)], ["543", "546", null, null]);
  rovne(M.klucKombinacie({ 78: "543", 71: "540" }), "71-540-78-543");
  rovne(M.klucKombinacie({ 72: "546", 44: "453" }), "44-453-72-546");
});
await test("párovanie farby 2. vrstvy (Michal 10. 10.): všetky pravidlá SK aj CZ, V-Class, inak Lux 10", () => {
  const sk = (t, a) => M.odporucanaLux("Diamond Farba kože : " + t, a);
  rovne([sk("Čierna / Farba šitia: Červená"), sk("Čierna / Farba šitia: Modrá"), sk("Vínovo Červená"), sk("Oranžová"), sk("Modrá"), sk("Béžová"), sk("Hnedá"), sk("Hnedá káva")], [10, 8, 13, 3, 6, 12, 11, 11]);
  rovne([sk("Čierna / Farba šitia : Sivá"), sk("Čierna / Farba šitia : Sivá", "Mercedes-Benz V-Class"), sk("Čierna / Farba šitia : Sivá", "Mercedes Trieda V 2019"), sk("Čierna / Farba šitia : Sivá", "Mercedes Vito")], [10, 15, 15, 10]);
  rovne([sk("Fialová"), sk("Červená"), sk("Šedá"), sk(" čierna farba šitia zelená"), sk("čierna / Farba šitia : Béžová"), sk("Čierna / Farba šitia: Čierna"), sk("čierna / Farba šitia : bielou")], [10, 10, 10, 10, 10, 10, 10]);
  rovne(M.odporucanaLux("Diamond Farba kože : Modrá", "Mercedes V-Class"), 6, "V-Class mení len čiernu so šedým šitím");
  const cz = (t, a) => M.odporucanaLux("Diamond Barva kůže: " + t, a);
  rovne([cz("Černá / Barva šití: Červená"), cz("Černá / Barva šití: Modrá"), cz("Vínově červená"), cz("Kávově hnědá"), cz("Hnědá"), cz("Béžová"), cz("Oranžová"), cz("Modrá"), cz("Černá / Barva šití: Šedá", "Mercedes-Benz V-Klasse"), cz("Černá / Barva šití: Šedá"), cz("Fialová")], [10, 8, 13, 11, 11, 12, 3, 6, 15, 10, 10]);
  rovne([M.odporucanaLux("diamond farba koze : CIERNA / farba sitia: cervena"), M.odporucanaLux("STRIPE FARBA KOŽE : HNEDÁ KÁVA"), M.odporucanaLux(""), M.odporucanaLux("niečo iné")], [10, 11, 10, 10]);
});
await test("druhá vrstva z textu variantu (SK aj CZ), adresa dvojvrstvového setu", () => {
  rovne([M.maDruhuVrstvu(V1_CC), M.maDruhuVrstvu(V1_CC + ", farba 2.vrstvy: Lux Color 10"), M.maDruhuVrstvu("Barva 1.vrstvy: Diamond Barva kůže: Černá, Barva 2.vrstvy: Lux Color 09")], [false, true, true]);
  rovne([M.luxZVariantu(V1_CC + ", farba 2.vrstvy: Lux Color 10"), M.luxZVariantu("Barva 1.vrstvy: X, Barva 2.vrstvy: Lux Color 09"), M.luxZVariantu("FARBA 1.VRSTVY: x, FARBA 2.VRSTVY: LUX COLOR 15"), M.luxZVariantu(V1_CC), M.luxZVariantu(V1_CC + ", farba 2.vrstvy: Comfort 3")], [10, 9, 15, null, null]);
  rovne([M.luxCislo("Lux Color 01"), M.luxCislo("Lux Color 16"), M.luxCislo("Lux Color 17"), M.luxCislo("Comfort 03")], [1, 16, null, null]);
  rovne(M.adresaDvojvrstvoveho("/luxusne-autokoberce-dragonskin-diamond-line/"), "/luxusne-autokoberce-dragonskin-elite-diamond-line/");
  rovne(M.adresaDvojvrstvoveho("https://www.luxurycardesign.cz/luxusne-autokoberce-dragonskin-hexa-line/"), "/luxusne-autokoberce-dragonskin-elite-hexa-line/");
  rovne([M.adresaDvojvrstvoveho("/luxusne-autokoberce-dragonskin-elite-stripe-line/"), M.adresaDvojvrstvoveho("/luxusny-boxi-do-kufra/"), M.adresaDvojvrstvoveho(null)], [null, null, null]);
  rovne([M.luxNazov(8), M.luxNazov(12), M.luxFoto(8)], ["Lux 08", "Lux 12", "/user/documents/upload/assets/config/lux-color-08.jpg?15"]);
});
await test("ponuka druhej vrstvy SK Diamond čierna/červená, 1.+2. rad: Lux 10 predvolená, +147 € (132 + rozloženie 50 − 35)", () => {
  const volby = { 85: "589", 88: "598", 74: "485" };
  const p = M.ponukaVrstvy(riadokV("63487", volby, SKB), volby, SKB, SKE, RSK, "");
  pravda(p, "ponuka");
  rovne([p.odporucana, p.v1, p.moznosti.length, p.moznosti.map((m) => m.lux).join(",")], [10, "543", 16, "10,12,11,13,14,15,16,7,4,1,8,6,3,5,9,2"]);
  const m10 = p.moznosti.find((m) => m.lux === 10), m12 = p.moznosti.find((m) => m.lux === 12);
  rovne([m10.priceId, m10.vid, m10.rozdiel.s, m12.priceId, m12.rozdiel.s], ["66983", "540", 147, "67037", 147]);
  rovne(m10.rozdiel.b, Math.round(147 / 1.23 * 100) / 100, "bez DPH");
  // béžová -> Lux 12, sivé šitie + V-Class -> Lux 15
  const vb = { 85: "586", 74: "485" };
  rovne(M.ponukaVrstvy(riadokV("63514", vb, SKB, "farba 1.vrstvy: Diamond Farba kože : Béžová"), vb, SKB, SKE, RSK, "").odporucana, 12);
  rovne(M.ponukaVrstvy(riadokV("63499", vb, SKB), vb, SKB, SKE, RSK, "Mercedes-Benz V-Class").odporucana, 15);
  rovne(M.ponukaVrstvy(riadokV("63499", vb, SKB), vb, SKB, SKE, RSK, "Škoda Kodiaq").odporucana, 10);
});
await test("rozdiel ceny SK Stripe (iné ceny príplatkov v dvojvrstvovom): rozloženie +15, rohož Premium −29, SUV −5, 2. box S −20", () => {
  const volby = { 85: "589", 88: "601", 74: "488" };
  const p = M.ponukaVrstvy(riadokV("66866", volby, SSB, "farba 1.vrstvy: Stripe Farba kože : Čierna / Farba šitia: Červená", "/luxusne-autokoberce-dragonskin-stripe-line/"), volby, SSB, SSE, RSK, "");
  pravda(p, "ponuka Stripe");
  rovne(p.moznosti.find((m) => m.lux === 10).rozdiel.s, 132 + 15 - 29 - 5);
  const v2 = { 85: "586", 88: "598", 74: "485", 91: "604", 94: "619", 97: "634" };
  rovne(M.rozdielPrechodu(v2, SSB, SSE, 230, 362, 1.23).s, 132 + 0 + 0 - 20);
  rovne(M.rozdielPrechodu({ 85: "589", 99: "1" }, SSB, SSE, 230, 362, 1.23), null, "neznámy príplatok -> null");
  rovne(M.rozdielPrechodu({ 85: "589" }, SSB, SSE, 230, null, 1.23), null, "chýba cena variantu -> null");
});
await test("ponuka CZ Diamond: priceId čítané zo stránky (nepravidelné), +3 636 Kč, kávově hnědá -> Lux 11", () => {
  const volby = { 57: "486", 60: "495", 47: "380" };
  const r = riadokV("43605", volby, CZB, "Barva 1.vrstvy: Diamond Barva kůže: Černá / Barva šití: Červená");
  const p = M.ponukaVrstvy(r, volby, CZB, CZE, RCZ, "");
  pravda(p, "ponuka CZ");
  const m10 = p.moznosti.find((m) => m.lux === 10), m11 = p.moznosti.find((m) => m.lux === 11);
  rovne([p.odporucana, m10.priceId, m10.rozdiel.s, m11.priceId], [10, "43662", 3135 + 501, FV["cz/elite-diamond"].kom["44-588-72-546"].id + ""]);
  const pk = M.ponukaVrstvy(riadokV("43635", volby, CZB, "Barva 1.vrstvy: Diamond Barva kůže: Kávově hnědá"), volby, CZB, CZE, RCZ, "");
  rovne([pk.odporucana, pk.moznosti.find((m) => m.lux === 11).priceId], [11, String(FV["cz/elite-diamond"].kom["44-588-72-576"].id)]);
});
await test("ponuka druhej vrstvy fail-closed: už dvojvrstvový, iný pár produktov, neznámy priceId, iný názov príplatku", () => {
  const volby = { 85: "589", 88: "598", 74: "485" };
  const r = riadokV("63487", volby, SKB);
  rovne(M.ponukaVrstvy(Object.assign({}, r, { variant: V1_CC + ", farba 2.vrstvy: Lux Color 10" }), volby, SKB, SKE, RSK, ""), null, "2. vrstva už je");
  rovne(M.ponukaVrstvy(r, volby, SKB, SSE, RSK, ""), null, "Diamond -> Stripe");
  rovne(M.ponukaVrstvy(r, volby, SKE, SKE, RSK, ""), null, "dvojvrstvový nie je v tabuľke jednovrstvových");
  rovne(M.ponukaVrstvy(Object.assign({}, r, { priceId: "1" }), volby, SKB, SKE, RSK, ""), null, "priceId");
  const ina = JSON.parse(JSON.stringify(SKE)); ina.params["85"].n = "rozloženie";
  rovne(M.ponukaVrstvy(r, volby, SKB, ina, RSK, ""), null, "názov príplatku");
  const bezKom = Object.assign({}, SKE, { kom: null });
  rovne(M.ponukaVrstvy(r, volby, SKB, bezKom, RSK, ""), null, "bez kombinácií");
  const vypredane = JSON.parse(JSON.stringify(SKE));
  Object.keys(vypredane.kom).forEach((k) => { if (/^71-540-/.test(k)) vypredane.kom[k].x = 1; });
  const pv = M.ponukaVrstvy(r, volby, SKB, vypredane, RSK, "");
  rovne(pv, null, "odporúčaná aj Lux 10 vypredaná -> bez ponuky");
});
await test("payload druhej vrstvy: cieľový priceId + productId dvojvrstvového, VŠETKY príplatky, amount 1", () => {
  const volby = { 85: "589", 88: "598", 74: "485" };
  rovne(M.zostavPayload({ priceId: "66983" }, volby, {}, SKE, "tok"),
    "priceId=66983&productId=601&language=sk&surchargeParameterValueId%5B74%5D=485&surchargeParameterValueId%5B85%5D=589&surchargeParameterValueId%5B88%5D=598&amount=1&__csrf__=tok");
  rovne(M.zostavPayload({ priceId: "43662" }, { 57: "486", 47: "380" }, {}, CZE, null),
    "priceId=43662&productId=2406&language=cs&surchargeParameterValueId%5B47%5D=380&surchargeParameterValueId%5B57%5D=486&amount=1");
});
await test("názov setu bez Basic / Elite / Dragonskin", () => {
  rovne(M.setNazov({ nazov: "luxusné autokoberce Dragonskin Basic DIAMOND LINE", variant: V1_CC }), "Diamond-Line, čierna / červená");
  rovne(M.setNazov({ nazov: "luxusné autokoberce Dragonskin Elite HEXA LINE", variant: "farba 1.vrstvy: Hexa Farba kože : Čierna / Farba šitia: Červená, farba 2.vrstvy: Lux Color 10" }), "Hexa-Line, čierna / červená + Lux 10");
  pravda(!/basic|elite|dragon/i.test(M.setNazov({ nazov: "luxusné autokoberce Dragonskin Basic", variant: "" })));
});
// karta ponuky v jsdom: poradie kariet a výber farby
const ctxKarty = (ponuka, R = RSK, mB = SKB, mE = SKE, volby = { 85: "589", 88: "598", 74: "485" }, priceId = "63487") => {
  const riadok = Object.assign(riadokV(priceId, volby, mB), { itemId: "it-k" });
  const p = M.ponukaVrstvy(riadok, volby, mB, mE, R, "");
  if (p) { p.href = "/luxusne-autokoberce-dragonskin-elite-diamond-line/"; p.mapa = mE; }
  return { riadok, mapa: mB, volby, ponuka: Object.assign({ vrstva2: p }, ponuka), odobrat: [], samostatne: null, kupon: null, zobrazene: [] };
};
await test("pásy: druhá vrstva PRVÁ, potom Classic a box (Premium nie), texty bez zakázaných slov", () => {
  const k = M.kartaPonuky(ctxKarty({ rohoz: true, box: true }), RSK, false);
  const poradieKariet = [...k.querySelectorAll(".lcd-dop__volby > .lcd-dop__volba")].map((li) => li.getAttribute("data-varianta") || li.getAttribute("data-doplnok"));
  rovne(poradieKariet, ["vrstva2", "classic", "box"]);
  rovne(M.PORADIE_KARIET, ["vrstva2", "classic", "box"]);
  const v = k.querySelector('.lcd-dop__volba[data-doplnok="vrstva2"]');
  const t = (s) => v.querySelector(s).textContent.replace(/\s+/g, " ").trim();
  rovne([t(".lcd-dop__nadtitul"), t(".lcd-dop__meno"), t(".lcd-dop__veta"), t(".lcd-dop__znacka")], ["Odporúčame k Vašej farbe", "Druhá vrstva · Lux 10", "Odnímateľná vrstva navrch zachytí vodu, sneh aj blato.", "Lux 10"]);
  pravda(/^\+147\s€ v sete$/.test(t(".lcd-dop__pas .lcd-dop__cena")), t(".lcd-dop__pas .lcd-dop__cena"));
  pravda(!/samostatne|ušetríte/.test(t(".lcd-dop__pas .lcd-dop__cena")), "bez porovnania");
  rovne([v.querySelector(".lcd-dop__mini").getAttribute("src"), v.querySelector(".lcd-dop__vfoto").getAttribute("src")], ["/user/documents/upload/assets/config/lux-color-10.jpg?15", "/user/documents/upload/assets/config/lux-color-10.jpg?15"], "bez produktovej fotky vzorka");
  rovne(v.querySelector('.lcd-dop__pas [data-lcd-dop-pridat="vrstva2"]').textContent, "Pridať");
  rovne(v.querySelector('[data-lcd-dop-pridat="vrstva2-vyber"]').textContent, "Pridať druhú vrstvu");
  const c = k.querySelector('.lcd-dop__volba[data-varianta="classic"]');
  rovne(c.querySelector(".lcd-dop__pas [data-lcd-dop-pridat]").textContent, "Pridať");
  pravda(/samostatne/.test(c.querySelector(".lcd-dop__detail").textContent) || !c.querySelector(".lcd-dop__samoriadok"), "samostatne len v detaile");
  rovne(k.querySelector(".lcd-dop__volba--box .lcd-dop__vybrat").textContent, "Vybrať");
  rovne(k.querySelector(".lcd-dop__nadpis").textContent, "Doplňte svoj set");
  rovne(M.cisty(M.kartaPonuky(Object.assign(ctxKarty({ rohoz: true, box: true }), { ponuka: { rohoz: true, box: true, vrstva2: null } }), RSK, false).querySelector(".lcd-dop__nadpis").textContent), "Doplňte kufor v rovnakom štýle", "bez druhej vrstvy pôvodný nadpis");
  pravda(!/dragon|elite|basic|milimet|vyrába|záruk|comfort|vrstiev|premium/i.test(k.textContent), k.textContent.slice(0, 200));
});
await test("pásy: klik na pás rozbalí detail (len jeden naraz), „Vybrať“ boxu rozbalí", () => {
  const k = M.kartaPonuky(ctxKarty({ rohoz: true, box: true }), RSK, false);
  document.body.appendChild(k);
  try {
    const pas = (d) => k.querySelector(`.lcd-dop__volba[data-${d.startsWith("v") ? "doplnok" : "varianta"}="${d}"]`);
    const det = (li) => li.querySelector(".lcd-dop__detail");
    const v = pas("vrstva2"), c = pas("classic"), b = k.querySelector(".lcd-dop__volba--box");
    pravda([v, c, b].every((li) => det(li).hidden), "všetko zbalené");
    v.querySelector(".lcd-dop__nadtitul").click();
    rovne([det(v).hidden, v.querySelector(".lcd-dop__prepni").getAttribute("aria-expanded"), v.classList.contains("je-otvorena")], [false, "true", true]);
    c.querySelector(".lcd-dop__cena").click();
    rovne([det(v).hidden, det(c).hidden], [true, false], "druhý pás zavrie prvý");
    const tlb = b.querySelector(".lcd-dop__vybrat");
    tlb.click();
    rovne([det(c).hidden, det(b).hidden, tlb.getAttribute("aria-expanded"), tlb.textContent], [true, false, "true", "Skryť"]);
    rovne(tlb.getAttribute("aria-controls"), det(b).id);
    pravda(det(b).querySelector(".lcd-dop__boxvyber [data-lcd-dop-farba]"), "výber boxu v detaile");
    tlb.click();
    rovne([det(b).hidden, tlb.textContent], [true, "Vybrať"]);
  } finally { k.remove(); }
});
await test("pás druhej vrstvy: 16 vzoriek v rozbalení, Lux 12 zmení názov, nadtitul, cenu a vzorku; CZ texty", () => {
  const k = M.kartaPonuky(ctxKarty({ rohoz: false, box: false }), RSK, false);
  rovne(k.querySelector(".lcd-dop__nadpis").textContent, "Doplňte set o druhú vrstvu");
  rovne(k.querySelectorAll(".lcd-dop__volba").length, 1);
  const v = k.querySelector('.lcd-dop__volba[data-doplnok="vrstva2"]');
  rovne(v.querySelectorAll(".lcd-dop__detail [data-lcd-dop-lux]").length, 16);
  rovne(k.querySelector("[data-lcd-dop-lux]:checked").value, "10");
  const l12 = k.querySelector('[data-lcd-dop-lux="12"]');
  l12.checked = true; l12.dispatchEvent(new window.Event("change", { bubbles: true }));
  rovne([v.querySelector(".lcd-dop__nadtitul").textContent, v.querySelector(".lcd-dop__meno").textContent, v.querySelector(".lcd-dop__mini").getAttribute("src"), v.querySelector(".lcd-dop__pas [data-lcd-dop-pridat]").getAttribute("data-lux")],
    ["Vami zvolená farba", "Druhá vrstva · Lux 12", "/user/documents/upload/assets/config/lux-color-12.jpg?15", "12"]);
  pravda(/Lux 12/.test(v.querySelector(".lcd-dop__suhrn-cena").textContent));
  const kc = M.kartaPonuky(ctxKarty({ rohoz: false, box: false }, RCZ, CZB, CZE, { 57: "486", 60: "495", 47: "380" }, "43605"), RCZ, false);
  const vc = kc.querySelector('.lcd-dop__volba[data-doplnok="vrstva2"]');
  rovne([vc.querySelector(".lcd-dop__nadtitul").textContent, vc.querySelector(".lcd-dop__pas [data-lcd-dop-pridat]").textContent, vc.querySelector('[data-lcd-dop-pridat="vrstva2-vyber"]').textContent, kc.querySelector(".lcd-dop__nadpis").textContent],
    ["Doporučujeme k Vaší barvě", "Přidat", "Přidat druhou vrstvu", "Doplňte set o druhou vrstvu"]);
  pravda(/^\+3\s636\sKč v setu$/.test(vc.querySelector(".lcd-dop__pas .lcd-dop__cena").textContent.replace(/\s+/g, " ").trim()), vc.querySelector(".lcd-dop__pas .lcd-dop__cena").textContent);
});
await test("pás druhej vrstvy: produktová fotka v páse aj detaile, vzorka pri názve; chyba fotky -> vzorka zvolenej farby", () => {
  const ctx = ctxKarty({ rohoz: false, box: false });
  ctx.ponuka.vrstva2.foto = "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/shop/big/601-1_x.jpg";
  const k = M.kartaPonuky(ctx, RSK, false);
  document.body.appendChild(k);
  try {
    const h = k.querySelector(".lcd-dop__nadpis"), ul = k.querySelector(".lcd-dop__volby");
    rovne([ul.getAttribute("aria-labelledby"), ul.hasAttribute("aria-label"), h.textContent], [h.id, false, "Doplňte set o druhú vrstvu"]);
    const v = k.querySelector('.lcd-dop__volba[data-doplnok="vrstva2"]');
    const mini = v.querySelector(".lcd-dop__mini"), obr = v.querySelector(".lcd-dop__vfoto"), vz = v.querySelector(".lcd-dop__meno-vz");
    rovne([mini.getAttribute("src"), obr.getAttribute("src"), vz.getAttribute("src"), vz.hidden], [ctx.ponuka.vrstva2.foto, ctx.ponuka.vrstva2.foto, "/user/documents/upload/assets/config/lux-color-10.jpg?15", false]);
    obr.dispatchEvent(new window.Event("error"));
    rovne([obr.getAttribute("src"), mini.getAttribute("src"), vz.hidden], ["/user/documents/upload/assets/config/lux-color-10.jpg?15", "/user/documents/upload/assets/config/lux-color-10.jpg?15", true], "záloha vzorka");
    obr.dispatchEvent(new window.Event("load"));
    rovne(obr.style.visibility, "");
  } finally { k.remove(); }
});
await test("Lux 15 pri V-Class: auto zo sessionStorage len pri jedinom sete v košíku (inak Lux 10)", () => {
  const ss = { Brand: "Mercedes-Benz", Model: "Viano/Vito/V Class" };
  const citaj = (x) => ss[x] || null;
  const vb = { 85: "586", 74: "485" };
  const r = riadokV("63499", vb, SKB);
  pravda(/V Class/.test(M.autoKRiadku(r, 1, citaj)), M.autoKRiadku(r, 1, citaj));
  rovne(M.autoKRiadku(r, 2, citaj), "", "2 sety -> sessionStorage sa nepoužije");
  rovne(M.ponukaVrstvy(r, vb, SKB, SKE, RSK, M.autoKRiadku(r, 1, citaj)).odporucana, 15, "jediný set V-Class");
  rovne(M.ponukaVrstvy(r, vb, SKB, SKE, RSK, M.autoKRiadku(r, 2, citaj)).odporucana, 10, "2 sety (napr. V-Class + Kodiaq)");
  rovne(M.ponukaVrstvy(r, vb, SKB, SKE, RSK, M.autoKRiadku(r, 1, () => null)).odporucana, 10, "auto neznáme");
  rovne(M.autoKRiadku(Object.assign({}, r, { text: "Mercedes-Benz V-Class" }), 2, citaj), "Mercedes-Benz V-Class", "auto v texte riadku platí aj pri viacerých setoch");
});
await test("sLimitom: visiaca požiadavka -> null po limite, chyba -> null, výsledok prejde", async () => {
  const t0 = Date.now();
  rovne(await M.sLimitom(new Promise(() => {}), 30), null);
  pravda(Date.now() - t0 < 1000, "limit");
  rovne(await M.sLimitom(Promise.reject(new Error("x")), 30), null);
  rovne(await M.sLimitom(Promise.resolve(7), 30), 7);
});
await test("ponuka druhej vrstvy: trvalý neúspech -> stránka dvojvrstvového produktu sa nesťahuje pri každom otvorení košíka", async () => {
  const volby = { 85: "589", 88: "598", 74: "485" };
  const riadok = riadokV("63487", volby, SKB);
  const kluc = "lcdPriplatky:v3:562035:/luxusne-autokoberce-dragonskin-elite-diamond-line/";
  const premenovany = JSON.parse(JSON.stringify(FV["sk/elite-diamond"]));
  premenovany.sels.find((x) => String(x.id) === "85").n = "rozloženie";
  const html = strankaProduktu(premenovany);
  const fetchPred = globalThis.fetch, nowPred = Date.now;
  let stiahnute = 0;
  globalThis.fetch = async () => { stiahnute++; return { ok: true, status: 200, text: async () => html }; };
  const novyModul = (n) => import("../assets/js/lcdKosikDoplnok.js?nacitanie=" + n); // = nové načítanie stránky
  try {
    // dobrá mapa v localStorage -> ponuka bez sťahovania
    localStorage.setItem(kluc, JSON.stringify(Object.assign({}, SKE, { t: Date.now() - 7200000 })));
    const ok1 = await (await novyModul(1)).ponukaDruhejVrstvy(riadok, volby, SKB, RSK, "");
    rovne([!!ok1, ok1 && ok1.odporucana, ok1 && ok1.href, stiahnute], [true, 10, "/luxusne-autokoberce-dragonskin-elite-diamond-line/", 0]);
    // priceId riadku nie je v (čerstvej) mape jednovrstvového produktu -> null bez sťahovania dvojvrstvového
    rovne([await (await novyModul(5)).ponukaDruhejVrstvy(Object.assign({}, riadok, { priceId: "1" }), volby, SKB, RSK, ""), stiahnute], [null, 0]);
    // stará nesediaca mapa -> raz čerstvá (stále nesedí) -> null
    const stara = mapaV("sk/elite-diamond"); stara.params["85"].n = "rozloženie"; stara.t = Date.now() - 7200000;
    localStorage.setItem(kluc, JSON.stringify(stara));
    rovne(await (await novyModul(2)).ponukaDruhejVrstvy(riadok, volby, SKB, RSK, ""), null);
    rovne(stiahnute, 1, "raz čerstvá");
    // ďalšie otvorenie košíka o 2 min (mapa > 60 s) -> už nesťahovať
    Date.now = () => nowPred() + 120000;
    rovne(await (await novyModul(3)).ponukaDruhejVrstvy(riadok, volby, SKB, RSK, ""), null);
    rovne(stiahnute, 1, "bez opakovaného sťahovania ~1 MB");
    // iná (staršia / novšia) mapa v localStorage -> smie sa raz obnoviť znova
    localStorage.setItem(kluc, JSON.stringify(stara));
    await (await novyModul(4)).ponukaDruhejVrstvy(riadok, volby, SKB, RSK, "");
    rovne(stiahnute, 2, "nová mapa -> nový pokus");
  } finally {
    globalThis.fetch = fetchPred; Date.now = nowPred;
    Object.keys(localStorage).filter((x) => /^lcd(Priplatky|VrstvaSkusena)/.test(x)).forEach((x) => localStorage.removeItem(x));
  }
});

// výmena na iný produkt proti podvrhnutému košíku: pôvodný riadok jednovrstvový, cieľ dvojvrstvový (iné priceId aj ceny)
function kosikVrstva({ luxServer = null, cenaNavyse = 0 } = {}) {
  const st = { rows: [], n: 0, volania: [], telo: null };
  const VAR = { "63487": { m: SKB, c: 219, variant: V1_CC, href: "/luxusne-autokoberce-dragonskin-diamond-line/" } };
  Object.keys(SKE.kom).forEach((k) => {
    const m = /^71-(\d+)-78-543$/.exec(k);
    if (m) VAR[SKE.kom[k].id] = { m: SKE, c: SKE.kom[k].c, variant: V1_CC + ", farba 2.vrstvy: " + SKE.vpar["71"].o[m[1]], href: "/luxusne-autokoberce-dragonskin-elite-diamond-line/" };
  });
  st.pridaj = (priceId, volby, q = 1) => {
    const d = VAR[priceId];
    const r = { itemId: "iv" + ++st.n, priceId: String(priceId), q, volby, sur: textPriplatkov(volby, d.m), variant: d.variant, href: d.href, p: d.c + Object.keys(volby).reduce((s, p) => s + d.m.params[p].o[volby[p]].fp, 0) };
    st.rows.push(r);
    return r;
  };
  const odpoved = () => ({ ok: true, status: 200, text: async () => JSON.stringify({ code: 200, payload: { cartItems: st.rows.map((r) => ({ itemId: r.itemId, priceId: +r.priceId, quantity: r.q, priceWithVat: r.p, discounts: { finalRatio: 1 } })) } }) });
  globalThis.fetch = async (url, opt = {}) => {
    const akcia = String(url).split("/action/Cart/")[1].replace(/\/.*$/, "");
    st.volania.push(akcia);
    if (akcia === "GetCartContent") {
      const html = "<table>" + st.rows.map((r) => RIADOK(r.itemId, r.priceId, r.q, r.sur, r.href, r.variant)).join("") + "</table>";
      return { ok: true, status: 200, text: async () => JSON.stringify({ code: 200, payload: { content: html } }) };
    }
    const b = new URLSearchParams(opt.body);
    if (akcia === "addCartItem") {
      st.telo = opt.body;
      const volby = {};
      for (const [k, v] of b.entries()) { const m = /^surchargeParameterValueId\[(\d+)\]$/.exec(k); if (m) volby[m[1]] = v; }
      const ex = st.rows.find((r) => r.priceId === b.get("priceId") && JSON.stringify(r.volby) === JSON.stringify(volby));
      if (ex) ex.q += 1;
      else {
        const r = st.pridaj(b.get("priceId"), volby);
        r.p += cenaNavyse;
        if (luxServer) r.variant = V1_CC + ", farba 2.vrstvy: Lux Color " + luxServer;
      }
      return odpoved();
    }
    const r = st.rows.find((x) => x.itemId === b.get("itemId"));
    if (!r) return odpoved();
    if (akcia === "deleteCartItem") st.rows.splice(st.rows.indexOf(r), 1);
    if (akcia === "setCartItemAmount") r.q = +b.get("amount");
    return odpoved();
  };
  return st;
}
const VOLBY_V = { 85: "589", 88: "598", 74: "485" };
const pripravV = (st, q = 1) => {
  const r = st.pridaj("63487", VOLBY_V, q);
  return M.rozoberRiadky(new DOMParser().parseFromString("<table>" + RIADOK(r.itemId, r.priceId, r.q, r.sur, r.href, r.variant) + "</table>", "text/html"))[0];
};
const vymenV = (riadok, lux = 10) => {
  const p = M.ponukaVrstvy(riadok, VOLBY_V, SKB, SKE, RSK, "");
  const m = p.moznosti.find((x) => x.lux === lux);
  return M.vymen({ riadok, volby: VOLBY_V, mapa: SKE, R: RSK, zmena: {}, rozdiel: m.rozdiel, doplnok: { kod: "vrstva2" }, ciel: { priceId: m.priceId, lux } });
};
await test("výmena na druhú vrstvu: 1 riadok dvojvrstvového setu (601 / Lux 10), cena 254 + 147, príplatky rovnaké, pôvodný zmazaný", async () => {
  const st = kosikVrstva(); const riadok = pripravV(st);
  const v = await vymenV(riadok);
  pravda(v.ok, JSON.stringify(v));
  rovne(st.rows.map((r) => [r.priceId, r.p, r.q, r.volby]), [["66983", 401, 1, VOLBY_V]]);
  pravda(/productId=601&/.test(st.telo) && /priceId=66983&/.test(st.telo), st.telo);
  rovne(st.volania, ["GetCartContent", "addCartItem", "GetCartContent", "deleteCartItem"]);
});
await test("výmena na druhú vrstvu: vybraná Lux 12 -> priceId 67037", async () => {
  const st = kosikVrstva(); const riadok = pripravV(st);
  const v = await vymenV(riadok, 12);
  pravda(v.ok, JSON.stringify(v));
  rovne(st.rows.map((r) => [r.priceId, M.luxZVariantu(r.variant)]), [["67037", 12]]);
});
await test("výmena na druhú vrstvu: server dá inú Lux farbu -> kontrola textu, nový kus späť, košík ako predtým", async () => {
  const st = kosikVrstva({ luxServer: "12" }); const riadok = pripravV(st);
  const v = await vymenV(riadok);
  rovne([v.ok, v.krok], [false, "kontrola_textu"]);
  rovne(st.rows.map((r) => [r.itemId, r.priceId]), [[riadok.itemId, "63487"]]);
});
await test("výmena na druhú vrstvu: nesedí cena -> kontrola ceny, nový kus späť", async () => {
  const st = kosikVrstva({ cenaNavyse: 5 }); const riadok = pripravV(st);
  const v = await vymenV(riadok);
  rovne([v.ok, v.krok, !!v.reload], [false, "kontrola_ceny", false]);
  rovne(st.rows.map((r) => r.priceId), ["63487"]);
});
await test("výmena na druhú vrstvu pri množstve 2: pôvodný q1 (bez 2. vrstvy) + nový dvojvrstvový", async () => {
  const st = kosikVrstva(); const riadok = pripravV(st, 2);
  const v = await vymenV(riadok);
  pravda(v.ok, JSON.stringify(v));
  rovne(st.rows.map((r) => [r.priceId, r.q, r.p]), [["63487", 1, 254], ["66983", 1, 401]]);
});
await test("obnova druhej vrstvy: pridavam -> vrátiť nový kus (cieľové priceId); mazem -> dokončiť; iná Lux -> nejasné", () => {
  const st = kosikVrstva(); const riadok = pripravV(st);
  const stary = st.rows[0];
  const novy = st.pridaj("66983", VOLBY_V);
  const z = { id: "z", t: 1000, faza: "pridavam", pred: { [stary.itemId]: 1 }, stary: { itemId: stary.itemId, priceId: "63487", q: 1 }, ocakavane: VOLBY_V, ciel: { priceId: "66983", lux: 10 } };
  const rr = () => M.rozoberRiadky(new DOMParser().parseFromString("<table>" + st.rows.map((r) => RIADOK(r.itemId, r.priceId, r.q, r.sur, r.href, r.variant)).join("") + "</table>", "text/html"));
  const o = M.rozhodniObnovu(z, rr(), SKE, 99999);
  rovne([o.akcia, o.kus], ["vrat", { itemId: novy.itemId, priceId: "66983", q: 1 }]);
  const o2 = M.rozhodniObnovu(Object.assign({}, z, { faza: "mazem", novy: { itemId: novy.itemId, q: 1 } }), rr(), SKE, 99999);
  rovne([o2.akcia, o2.kus], ["dokonci", { itemId: stary.itemId, priceId: "63487", q: 1 }]);
  rovne(M.rozhodniObnovu(Object.assign({}, z, { ciel: { priceId: "66983", lux: 12 } }), rr(), SKE, 99999).akcia, "nejasne");
  rovne(M.rozhodniObnovu(Object.assign({}, z, { ciel: null }), rr(), SKE, 99999).akcia, "nic", "bez cieľa sa hľadá pôvodné priceId (dvojvrstvový riadok sa nepočíta)");
  void riadok;
});

// ---------------------------------------------------------------- výber pod kartou, vzorky, krížik pri odrážke (10. 10.)
await test("poradie farieb 2. vrstvy ako na produkte: zo selectu, bez poradia v mape záloha PORADIE_LUX", () => {
  rovne(SKE.vpar["71"].p.slice(0, 3).map((v) => M.luxCislo(SKE.vpar["71"].o[v])), [10, 12, 11]);
  const bezP = JSON.parse(JSON.stringify(SKE));
  delete bezP.vpar["71"].p;
  const r = riadokV("63487", { 85: "589", 88: "598", 74: "485" }, SKB);
  const a = M.ponukaVrstvy(r, { 85: "589", 88: "598", 74: "485" }, SKB, SKE, RSK, "");
  const b = M.ponukaVrstvy(r, { 85: "589", 88: "598", 74: "485" }, SKB, bezP, RSK, "");
  rovne(a.moznosti.map((m) => m.lux), M.PORADIE_LUX);
  rovne(b.moznosti.map((m) => m.lux), M.PORADIE_LUX);
  const obr = JSON.parse(JSON.stringify(SKE));
  obr.vpar["71"].p.reverse();
  const c = M.ponukaVrstvy(r, { 85: "589", 88: "598", 74: "485" }, SKB, obr, RSK, "");
  rovne(c.moznosti.map((m) => m.lux), M.PORADIE_LUX.slice().reverse(), "poradie zo selectu má prednosť");
  rovne(FIX["sk/luxusne-autokoberce-dragonskin-diamond-line/"].sels.find((x) => x.id === "91").o.map((o) => String(o[0])), SKD.params["91"].p, "farba boxov v poradí formulára");
});
await test("hlavná fotka produktu: og:image z CDN Shoptetu, iné adresy nie; ponuka vrstvy ju nesie", () => {
  const doc = (u) => new DOMParser().parseFromString(strankaProduktu(FV["sk/elite-diamond"]).replace("<body>", `<head><meta property="og:image" content="${u}"></head><body>`), "text/html");
  const u = "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/shop/big/601-1_luxusne-autokoberce-v-class-2-luxury-car-design.jpg?ff=1&x=1024";
  const m = M.mapaZFormulara(doc(u));
  rovne(m.foto, u);
  rovne(M.mapaZFormulara(doc("https://zly.example/a.jpg")).foto, null);
  rovne(M.mapaZFormulara(doc("https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/front_images/ogImage/hp.jpg")).foto, null, "nie obrázok titulky");
  rovne(SKE.foto, null);
  const r = riadokV("63487", { 85: "589", 88: "598", 74: "485" }, SKB);
  rovne(M.ponukaVrstvy(r, { 85: "589", 88: "598", 74: "485" }, SKB, m, RSK, "").foto, u);
});
await test("vzorka farby boxov ako na produkte (slug textu, SK aj CZ)", () => {
  const z = "/user/documents/upload/assets/config/";
  rovne(M.vzorkaFarby("Farba kože : Čierna / Farba šitia: Červená"), z + "farba-koze-cierna-farba-sitia-cervena.jpg?15");
  rovne(M.vzorkaFarby("Farba kože : Čierna / Farba šitia : Béžová"), z + "farba-koze-cierna-farba-sitia-bezova.jpg?15");
  rovne(M.vzorkaFarby("Farba kože : Hnedá káva"), z + "farba-koze-hneda-kava.jpg?15");
  rovne(M.vzorkaFarby("Barva kůže: výnové červena"), z + "barva-kuze-vynove-cervena.jpg?15");
  rovne(M.vzorkaFarby("Barva kůže: Černá / Barva šití: Bílá"), z + "barva-kuze-cerna-barva-siti-bila.jpg?15");
  rovne(M.vzorkaFarby("Čierna + červená"), z + "cierna.jpg?15", "ako createSlug(text.split(\"+\")[0])");
  rovne(M.vzorkaFarby(""), null);
});
await test("krížik pri odrážke: rohož -> „Autokoberce do kufru“, boxy -> „Farba boxov“ (inak prvá veľkosť); bez odrážky null", () => {
  const ul = new DOMParser().parseFromString(`<ul class="lcd-rozpis">${[["Auto", "Dacia Logan"], ["Autokoberce do kufru", "Koberec na dno kufra"],
    ["Farba boxov", "Farba kože: Béžová"], ["Velikost 1. boxu", "M: 40x32x30 cm"], ["Velikost 2. boxu", "L: 54x32x30 cm"]]
    .map(([n, h]) => `<li><span class="lcd-rozpis__n">${n}: </span><span class="lcd-rozpis__h">${h}</span></li>`).join("")}</ul>`, "text/html").querySelector("ul");
  const volby = { 85: "586", 88: "595", 91: "604", 94: "622", 97: "640", 74: "485" };
  rovne(M.odrazkaDoplnku(ul, { co: "rohoz" }, volby, SKD, SK).textContent, "Autokoberce do kufru: Koberec na dno kufra");
  rovne(M.odrazkaDoplnku(ul, { co: "box" }, volby, SKD, SK).textContent, "Farba boxov: Farba kože: Béžová");
  rovne(M.odrazkaDoplnku(ul, { co: "box" }, { 85: "586", 94: "622", 97: "640" }, SKD, SK).textContent, "Velikost 1. boxu: M: 40x32x30 cm");
  rovne(M.odrazkaDoplnku(null, { co: "rohoz" }, volby, SKD, SK), null);
  ul.children[1].remove();
  rovne(M.odrazkaDoplnku(ul, { co: "rohoz" }, volby, SKD, SK), null);
});

console.log(`\n${zle ? "ZLYHALO " + zle : "VŠETKO OK"} (${ok} OK)`);
process.exit(zle ? 1 : 0);
