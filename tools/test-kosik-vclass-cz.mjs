// Test košíka a pokladne Mercedes triedy V na CZ webe (CZ 2458 = presná kópia SK 646, Michal 8. 11. 2026): rozpis „Vaše auto“ /
// „Objednáváte“, ponuka „Doplňte svůj set“ v Kč s „ušetříte“, krížiky a výmena riadku (assets/js/opc/vclassKarta.js, cart.js,
// lcdKosikDoplnok.js jeVclass). SK test ostáva tools/test-kosik-vclass.mjs (SK sa nesmie zmeniť). Dve časti:
//   A) bez prehliadača: mapa príplatkov CZ produktu z podvrhnutej stránky produktu, rozbor, ponuky, ceny a „ušetříte“, krížiky,
//      rozpis, karta ponuky v DOM (české texty, nič slovenské, žiadne „s DPH“), stráž produktu (CZ len na CZ, SK len na SK),
//      ponuka setov riadok CZ triedy V vynechá. Ceny CZ (Michal = SK × 25) z fixture CZ adminu, „Samostatně“ boxu živo z CZ webu.
//   B) dočasný prehliadač Playwright na ŽIVOM CZ webe: skutočný košík hosťa (POST addCartItem funguje aj pre skrytý produkt,
//      overené 8. 11. 2026), /objednavka/krok-2/ s lokálnym luxuryCar.js / .css / lcd-vclass.js, ponuky, „Přidat“ (výmena na
//      presnú cenu a text riadku zo Shoptetu), × späť, zlyhaná výmena = košík bez zmeny s hláškou, bežný set a kamión rovnako
//      ako živá verzia. Stránku CZ produktu hosť nevidí (kategória Test, 404), preto ju test podvrhne: živá SK stránka 646
//      s formulárom prepísaným na CZ príplatky z fixture (ID, texty a ceny z CZ adminu). Až po zverejnení CZ produktu treba
//      overiť naživo bez podvrhu (--bez-podvrhu).
//      NIČ SA NEOBJEDNÁVA: Step2Validate sa zruší a test zlyhá, keby odišiel; z POST na /action/ prejde len košík,
//      Step1Validate a odmietnutie cookies. Košík zanikne so zatvorením kontextu.
//
//   node tools/test-kosik-vclass-cz.mjs --pw <file:///…/playwright/index.mjs> [--dist <priečinok>] [--prehliadace chromium,webkit,firefox]
//        [--sirky 1366,390] [--scen predok-xl,…] [--snimky <priečinok>] [--len-a] [--bez-podvrhu]
import { mkdirSync, mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const FIX = JSON.parse(readFileSync(new URL("./test-kosik-vclass-cz.fixture.json", import.meta.url), "utf8"));
const HOST = FIX.host;
const HOST_SK = "https://www.luxurycardesign.sk";
const PRODUKT = FIX.url;
const MODELY = { M: "V Class M (compact 4895 mm)", L: "V Class L (long 5140 mm)", XL: "V Class XL (Extra Long 5370 mm)" };

let ok = 0, zle = 0;
const over = (c, t) => { if (c) ok++; else { zle++; console.log("  ZLE  " + t); } };
const cisto = (t) => String(t == null ? "" : t).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const eq = (a, b, t) => over(JSON.stringify(a) === JSON.stringify(b), t + ": " + JSON.stringify(a) + (JSON.stringify(a) === JSON.stringify(b) ? "" : " ≠ " + JSON.stringify(b)));
// vykání s veľkým V, žiadne „s DPH“ (nie sme platcami DPH), „umělá kůže“ nie „ekokůže“, nikdy „na milimetr“ / „vyrábíme“
const ZAKAZANE = /DPH|na milimetr|vyrábíme|vyrábame|\bvám\b|\bváš\b|\bvaše\b|\bvás\b|\bvaši\b|\bvašemu\b|ekokůž|eko-kůž|ekokož/;
// slovenské slová v CZ karte = chyba prekladu
const SLOVENSKE = /Pridať|Najvýhodnejšie|ušetríte|Doplňte svoj\b|Objednávate\b|kufra\b|\brad\b|radu\b|Predné|predným|Bočné|Stolček|Sedadlá|Áno\b|veľkosť|Zobraziť|Odobrať|odstránen|\bFarba\b|Rozloženie|Vášmu|pridan/;

// ================================================================== A) bez prehliadača
const dom = new JSDOM("<!doctype html><html lang=\"cs\"><body></body></html>", { url: HOST + "/objednavka/krok-2/" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, DOMParser: dom.window.DOMParser, location: dom.window.location, localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage });
window.dataLayer = globalThis.dataLayer = [{ shoptet: { projectId: 581408, language: "cs" } }];
const D = await import("../assets/js/lcdKosikDoplnok.js");
const V = await import("../assets/js/opc/vclassKarta.js");
const VD = await import("../assets/js/components/konfigurator1v/vclass/data-cz.js");
const { SELECTY, ROZ_PREDOK, ROZ_BEZ, rozSet, rozLen, rozRadRohoz, ROHOZ, ROHOZ_SAM, BEZ_DRUHEJ, BOXY, BOX_FARBY, STOLCEK, ZASUVKY, VOLANT, STRED, DVERE, SEDADLA_TEXTY, VZORY, FARBY } = VD;
const boxT = (v) => BOXY.find((b) => b.v === v).t;
const kc = (n) => Number(n).toLocaleString("cs-CZ").replace(/[  ]/g, " ");

const SPOL = {
  [SELECTY.rok]: "2021", [SELECTY.volant]: "Vlevo", [SELECTY.stred]: "Podlaha", [SELECTY.dvere]: "Dvoje, na obou stranách",
  [SELECTY.sedadla]: "2 sedadla ve 2. řadě a 3 sedadla ve 3. řadě", [SELECTY.stolcek]: "Bez stolku", [SELECTY.zasuvky]: "Bez zásuvek",
  [SELECTY.farba]: "Diamond Line – Černá, červené šití", [SELECTY.farba2]: BEZ_DRUHEJ,
};
const ROZL = SELECTY.rozlozenie, ROH = SELECTY.rohoz, F2 = SELECTY.farba2;
const konf = (z) => { const o = Object.assign({}, SPOL, z); Object.keys(o).forEach((k) => { if (o[k] == null) delete o[k]; }); return o; };
// text príplatkov riadku ako v CZ košíku („Příplatky: Barva 2. vrstvy - Bez druhé vrstvy, Boční dveře - …“, abecedne)
const surZ = (o) => "Příplatky: " + Object.keys(o).sort((a, b) => a.localeCompare(b, "cs")).map((k) => k + " - " + o[k]).join(", ");
const auto = (v, rok = "2021") => ({ Brand: "Mercedes-Benz", Model: MODELY[v], Year: rok, model: "Mercedes-Benz " + MODELY[v] + " " + rok });

/**
 * Stránka CZ produktu, ako ju uvidí zákazník po zverejnení: živá SK stránka 646 (rovnaká šablóna Shoptetu) s formulárom
 * prepísaným na CZ produkt — productId, priceId, jazyk a každý select príplatku podľa fixture CZ adminu (ID, názov, hodnoty,
 * ceny v Kč ako „+15 000 Kč“). ceny = { idHodnoty: inaCena } (podvrh nesediacej ceny).
 */
function czStranka(skHtml, ceny) {
  const d = new JSDOM(skHtml).window.document;
  d.documentElement.setAttribute("lang", "cs");
  const f = d.querySelector("#product-detail-form");
  const nastav = (meno, h) => { const i = f.querySelector('input[name="' + meno + '"]'); if (!i) throw new Error("SK stránka bez " + meno); i.setAttribute("value", h); };
  nastav("productId", FIX.productId);
  nastav("priceId", FIX.priceId);
  const lang = f.querySelector('input[name="language"]');
  if (lang) lang.setAttribute("value", "cs");
  const nahradene = new Set();
  for (const p of FIX.priplatky) {
    const s = f.querySelector('select[data-parameter-id="' + p.skId + '"]');
    if (!s) throw new Error("SK stránka bez príplatku " + p.skId);
    s.setAttribute("name", "surchargeParameterValueId[" + p.id + "]");
    s.setAttribute("id", "surcharge-parameter-id-" + p.id);
    s.setAttribute("class", String(s.getAttribute("class")).replace(/parameter-id-\d+/, "parameter-id-" + p.id));
    s.setAttribute("data-parameter-id", p.id);
    s.setAttribute("data-parameter-name", p.n);
    if (p.req) s.setAttribute("required", "required"); else s.removeAttribute("required");
    const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    s.innerHTML = '<option value="" data-choose="true" data-index="0">Vyberte příplatek</option>' + p.h.map(([id, t, c]) => {
      const cena = ceny && ceny[id] != null ? ceny[id] : c;
      return '<option value="' + id + '" data-surcharge-final-price="' + cena + '" data-surcharge-additional-price="' + cena + '">' + esc(t) + " +" + kc(cena) + " Kč</option>";
    }).join("");
    nahradene.add(s);
  }
  if ([...f.querySelectorAll('select[name^="surchargeParameterValueId["]')].some((s) => !nahradene.has(s))) throw new Error("SK stránka má príplatok, ktorý CZ nemá");
  return "<!doctype html>" + d.documentElement.outerHTML;
}

console.log("== A) čisté funkcie nad mapou CZ produktu 2458 (podvrh zo živej SK stránky + CZ admin)");
const htmlSk = await (await fetch(HOST_SK + PRODUKT, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const CZ_HTML = czStranka(htmlSk);
const MAPA = D.mapaZFormulara(new JSDOM(CZ_HTML).window.document);
over(MAPA && MAPA.pid === FIX.productId && MAPA.lang === "cs" && V.platnaMapa(MAPA), "mapa CZ produktu 2458 má všetky príplatky");
eq(V.trhVclass(), "cz", "trh triedy V na CZ webe");
{
  // každý text, ktorý pošle konfigurátor / výmena (data-cz.js), je v CZ admine presne raz
  const chyba = [];
  const ma = (meno, t) => { const id = V.idParametra(MAPA, meno); if (!id || !V.idHodnoty(MAPA, id, t)) chyba.push(meno + " = " + t); };
  Object.values(SELECTY).forEach((m) => { if (!V.idParametra(MAPA, m)) chyba.push("príplatok " + m); });
  [ROZ_PREDOK, ROZ_BEZ].concat(...["M", "L", "XL"].map((v) => [rozSet(v), rozLen(v), rozRadRohoz(v)])).forEach((t) => ma(ROZL, t));
  ROHOZ.concat([ROHOZ_SAM]).forEach((t) => ma(ROH, t));
  ma(F2, BEZ_DRUHEJ);
  BOXY.forEach((b) => { ma(SELECTY.box1, b.t); ma(SELECTY.box2, b.t); ma(SELECTY.box3, b.t); });
  BOX_FARBY.forEach((f) => ma(SELECTY.boxFarba, f.nm));
  STOLCEK.forEach((t) => ma(SELECTY.stolcek, t));
  ZASUVKY.forEach((t) => ma(SELECTY.zasuvky, t));
  VOLANT.forEach((t) => ma(SELECTY.volant, t));
  STRED.forEach((t) => ma(SELECTY.stred, t));
  DVERE.forEach((t) => ma(SELECTY.dvere, t));
  SEDADLA_TEXTY.forEach((t) => ma(SELECTY.sedadla, t));
  VZORY.forEach((v) => FARBY[v.id].forEach((f) => ma(SELECTY.farba, v.nm + " – " + f.nm)));
  eq(chyba, [], "data-cz.js: všetky príplatky a hodnoty existujú v CZ admine");
}
// ceny CZ (Michal 8. 11. 2026 = SK × 25, boxy ako CZ autokoberce) a samostatné ceny pre „ušetříte“
const fp = (meno, text) => { const id = V.idParametra(MAPA, meno); const o = id && V.idHodnoty(MAPA, id, text); return o ? MAPA.params[id].o[o].fp : NaN; };
over(fp(ROZL, rozSet("M")) === 15000 && fp(ROZL, rozSet("L")) === 17500 && fp(ROZL, rozSet("XL")) === 20000, "CZ: 2. a 3. řada k předním +15 000 / 17 500 / 20 000 Kč");
over(fp(ROH, ROHOZ[0]) === 6250 && fp(ROH, ROHOZ_SAM) === 1000 && fp(F2, "Lux Color 10") === 3750, "CZ: rohož +6 250 Kč, pouze rohož +1 000 Kč, druhá vrstva +3 750 Kč");
eq(BOXY.map((b) => [fp(SELECTY.box1, b.t), fp(SELECTY.box2, b.t), fp(SELECTY.box3, b.t)]), [[2640, 2299, 2299], [3079, 2859, 2859], [3585, 3399, 3399], [3899, 3499, 3499]], "CZ: box jeden 2 640 / 3 079 / 3 585 / 3 899, pri dvoch 2 299 / 2 859 / 3 399 / 3 499 Kč");
eq([VD.SAMOSTATNE.predok, VD.SAMOSTATNE.rad, VD.SAMOSTATNE.rohoz], [9750, { M: 18750, L: 21250, XL: 23750 }, 8500], "Samostatně: předek 9 750, řada 18 750 / 21 250 / 23 750, rohož 8 500 Kč");
{
  // „Samostatně“ boxu = samostatný box na živom CZ webe (/luxusny-boxi-do-kufra/): základ + príplatok veľkosti
  const t = await (await fetch(HOST + "/luxusny-boxi-do-kufra/", { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const zaklad = Number((/"priceUnformatted":\s*([\d.]+)/.exec(t) || [])[1]);
  const m = D.mapaZFormulara(new JSDOM(t).window.document);
  const vel = {};
  Object.values((m && m.params) || {}).forEach((p) => {
    const z = p.p.map((id) => p.o[id]);
    if (z.length === 4 && z[0].fp === 0 && /^S\s*:/.test(z[0].t) && !Object.keys(vel).length) ["S", "M", "L", "XL"].forEach((v, i) => { vel[v] = zaklad + z[i].fp; });
  });
  eq(vel, VD.SAMOSTATNE.box, "Samostatně box = živý CZ samostatný box (S / M / L / XL)");
}

const st = (z) => V.rozborVclass(surZ(konf(z)), MAPA);
const pon = (s, o) => V.ponukyVclass(s, MAPA, o || {}).map((x) => x.kluc === "vrstva2" ? "vrstva2 +" + x.moznosti[0].rozdiel.s + " " + x.odporucana
  : x.kluc === "box" ? "box od +" + x.naj.s + " -" + (x.naj.samo - x.naj.s) : x.kluc + " +" + x.rozdiel.s + " -" + (x.samo - x.rozdiel.s));
const odo = (s) => V.odobratelne(s, MAPA).map((x) => x.cast + " " + x.rozdiel.s);
const BOX = "box od +2640 -2460";

// len předek: velikost z auta, bez auta 2. a 3. řada nie
for (const [v, c] of [["M", 15000], ["L", 17500], ["XL", 20000]]) {
  eq(pon(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }), { velAuta: v }), ["rad +" + c + " -3750", "rohoz +6250 -2250", "vrstva2 +3750 10", BOX], "len předek, auto " + v);
}
eq(pon(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }), {}), ["rohoz +6250 -2250", "vrstva2 +3750 10", BOX], "len předek bez auta: 2. a 3. řada sa neponúkne");
eq(pon(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }), { velAuta: "XL", maRohoz: true, maBox: true }), ["rad +20000 -3750", "vrstva2 +3750 10"], "samostatná rohož a box v košíku: rohož ani box nie");
eq(odo(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })), [], "len předek: žiadny krížik");
for (const [v, c] of [["M", 15000], ["L", 17500], ["XL", 20000]]) {
  const s = st({ [ROZL]: rozSet(v), [ROH]: ROHOZ[1] });
  eq(pon(s, { velAuta: "M" }), ["rohoz +6250 -2250", "vrstva2 +3750 10", BOX], "předek + řada " + v);
  eq(odo(s), ["rad -" + c], "předek + řada " + v + ": × pri 2. a 3. řade");
}
eq(pon(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[0] }), { velAuta: "L" }), ["rad +17500 -3750", "vrstva2 +3750 10", BOX], "předek + rohož, auto L");
eq(odo(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[0] })), ["rohoz -6250"], "předek + rohož: × pri rohoži");
for (const [v, rk] of [["M", 7500], ["L", 10000], ["XL", 12500]]) {
  eq(pon(st({ [ROZL]: rozLen(v), [ROH]: ROHOZ[1] }), { velAuta: "M" }), ["predok +3750 -6000", "rohoz +2500 -6000", BOX], "pouze 2. a 3. řada " + v);
  eq(odo(st({ [ROZL]: rozLen(v), [ROH]: ROHOZ[1] })), [], "pouze 2. a 3. řada " + v + ": krížik nie");
  eq(pon(st({ [ROZL]: rozRadRohoz(v), [ROH]: ROHOZ[0] })), ["predok +7500 -2250", BOX], "2. a 3. řada + rohož " + v);
  eq(odo(st({ [ROZL]: rozRadRohoz(v), [ROH]: ROHOZ[0] })), ["rad -" + (rk + 5250), "rohoz -2500"], "2. a 3. řada + rohož " + v + ": × řada aj rohož");
  eq(pon(st({ [ROZL]: ROZ_BEZ, [ROH]: ROHOZ_SAM }), { velAuta: v }), ["rad +" + (rk + 5250) + " -6000", "predok +5250 -4500", BOX], "pouze rohož, auto " + v);
}
eq(pon(st({ [ROZL]: ROZ_BEZ, [ROH]: ROHOZ_SAM }), {}), ["predok +5250 -4500", BOX], "pouze rohož bez auta");
eq(odo(st({ [ROZL]: ROZ_BEZ, [ROH]: ROHOZ_SAM })), [], "pouze rohož: krížik nie");
{
  const s = st({ [ROZL]: rozSet("XL"), [ROH]: ROHOZ[0], [F2]: "Lux Color 12", [SELECTY.box2]: boxT("M"), [SELECTY.box3]: boxT("L"), [SELECTY.boxFarba]: "Černá, červené šití" });
  eq(pon(s, { velAuta: "XL" }), [], "celý set: žiadna ponuka");
  eq(odo(s), ["rad -20000", "rohoz -6250", "vrstva2 -3750", "box1 -2673", "box2 -3179"], "celý set: × pri řade, rohoži, vrstve a každom boxe (zvyšný box za cenu 1 boxu)");
  const s1 = st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.box1]: boxT("M"), [SELECTY.boxFarba]: "Béžová" });
  eq(pon(s1, { velAuta: "XL" }), ["rad +20000 -3750", "rohoz +6250 -2250", "vrstva2 +3750 10"], "jeden box: druhý box sa neponúkne");
  eq(odo(s1), ["box -3079"], "jeden box: × pri boxe");
}
eq(V.ponukyVclass(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.farba]: "Diamond Line – Hnědá" }), MAPA, {}).find((x) => x.kluc === "vrstva2").odporucana, "11", "Hnědá -> Lux 11");
eq(V.ponukyVclass(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.farba]: "Stripe Line – Vínově červená" }), MAPA, {}).find((x) => x.kluc === "vrstva2").odporucana, "13", "Vínově červená -> Lux 13");
{
  const b = V.ponukyVclass(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.farba]: "Stripe Line – Hnědá káva" }), MAPA, {}).find((x) => x.kluc === "box");
  eq(b.farby.find((f) => f.id === b.predvolena).nm, "Hnědá káva", "box vopred vo farbe kobercov");
  eq(BOXY.map((x) => [x.v, b.cenaPre(1, x.v, null, b.predvolena).rozdiel.s, b.cenaPre(2, x.v, x.v, b.predvolena).rozdiel.s]), [["S", 2640, 4598], ["M", 3079, 5718], ["L", 3585, 6798], ["XL", 3899, 6998]], "ceny boxov 1 box / 2 boxy v Kč");
  eq(b.cenaPre(2, "M", "M", b.predvolena).samo - 5718, 5280, "2 boxy M ušetří 5 280 Kč");
}
over(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ_SAM }) === null, "nekonzistentné rozloženie a rohož -> nič");
over(st({ [ROZL]: rozLen("XL"), [ROH]: ROHOZ[1], [F2]: "Lux Color 10" }) === null, "druhá vrstva bez předních -> nič");
over(V.rozborVclass(surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })).replace("Pouze přední sedadla", "Pouze predni"), MAPA) === null, "neznámy text -> nič");
over(V.rozborVclass(surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })), Object.assign({}, MAPA, { pid: "646" })) === null, "mapa SK produktu 646 na CZ -> nič");
// slovenský text riadku (SK produkt) na CZ nič nerozpozná
over(V.riadkyVclass("Príplatky: Rozloženie - Len predné sedadlá, Rohož do kufra - Bez rohože do kufra", null) === null, "SK text príplatkov na CZ -> bežný rozpis");

// stráž: CZ produkt len na CZ webe, SK produkt len na SK webe (nikdy krížom)
eq([D.jeVclass({ sku: "VCLASS", priceId: "46327" }), D.jeVclass({ sku: "VCLASS", priceId: "68434" }), D.jeVclass({ sku: "DIAMOND", priceId: "46327" }), D.jeVclass({ sku: "", priceId: "", href: PRODUKT })],
  [true, false, false, false], "stráž CZ: kód VCLASS + priceId 46327, nie SK 68434, nie názov ani adresa");
window.dataLayer[0].shoptet.projectId = 562035;
eq([D.jeVclass({ sku: "VCLASS", priceId: "46327" }), D.jeVclass({ sku: "VCLASS", priceId: "68434" }), V.trhVclass()], [false, true, "sk"], "SK web: CZ produkt nie, SK 646 áno, trh sk");
window.dataLayer[0].shoptet.projectId = 999999;
eq([D.jeVclass({ sku: "VCLASS", priceId: "46327" }), D.jeVclass({ sku: "VCLASS", priceId: "68434" })], [false, false], "iný projekt: nič");
window.dataLayer[0].shoptet.projectId = 581408;

// rozpis položky po česky (variant B „dva nadpisy“ ako SK)
const sAutom = (a, fn) => {
  ["Brand", "Model", "Year", "carType", "model"].forEach((k) => sessionStorage.removeItem(k));
  if (a) Object.keys(a).forEach((k) => sessionStorage.setItem(k, a[k]));
  try { return fn(); } finally { ["Brand", "Model", "Year", "carType", "model"].forEach((k) => sessionStorage.removeItem(k)); }
};
const sAutomAsync = async (a, fn) => {
  ["Brand", "Model", "Year", "carType", "model"].forEach((k) => sessionStorage.removeItem(k));
  if (a) Object.keys(a).forEach((k) => sessionStorage.setItem(k, a[k]));
  try { return await fn(); } finally { ["Brand", "Model", "Year", "carType", "model"].forEach((k) => sessionStorage.removeItem(k)); }
};
const rozpis = (z, a) => sAutom(a, () => V.rozpisVclass(document, { sku: "VCLASS", priceId: FIX.priceId, sur: surZ(konf(z)) }));
const riadkyUl = (ul) => [...ul.children].map((li) => (li.hasAttribute("data-lcd-vc-hned") ? "+" : "-")
  + (li.classList.contains("lcd-rozpis__nadpis") ? "#" : (li.getAttribute("data-lcd-vc-cast") || "") + ":") + cisto(li.textContent));
const AUTO_N = "+#Vaše auto", OBJ_N = "+#Objednáváte";
const MICHAL = { [SELECTY.rok]: "2024", [SELECTY.sedadla]: "2 sedadla ve 2. řadě a 2 sedadla ve 3. řadě", [SELECTY.stolcek]: "Se stolkem",
  [ROZL]: rozSet("L"), [ROH]: ROHOZ[0], [F2]: "Lux Color 11", [SELECTY.box2]: boxT("S"), [SELECTY.box3]: boxT("M"), [SELECTY.boxFarba]: "Hnědá káva" };
const AUTA = ["-:Volant: Vlevo", "-:Boční posuvné dveře: Dvoje, na obou stranách", "-:Sedadla: 2 ve 2. řadě, 2 ve 3. řadě", "-:Stolek ve 2. a 3. řadě: Ano",
  "-:Mezi předními sedadly: Podlaha", "-:Elektrické zásuvky pod sedadly: Ne"];
const CASTI = (rad) => [OBJ_N, "+predok:Autokoberce k předním sedadlům", "+rad:" + rad, "+rohoz:Rohož do kufru", "+:Vzor a barva 1. vrstvy: Diamond Line – Černá, červené šití",
  "+vrstva2:Druhá vrstva k předním sedadlům: Lux Color 11", "+box1:První box ze dvou: S 33 × 32 × 30 cm", "+box2:Druhý box ze dvou: M 40 × 32 × 30 cm", "+:Barva boxů: Hnědá káva"];
const RAD = "Autokoberce do 2. a 3. řady";
{
  let ul = rozpis(MICHAL, auto("L", "2024"));
  eq(riadkyUl(ul), [AUTO_N, "+:Auto: Mercedes-Benz V Class L (long 5140 mm) 2024"].concat(AUTA, CASTI(RAD)), "CZ rozpis s autom (Michalov košík po česky)");
  over(!ZAKAZANE.test(cisto(ul.textContent)) && !SLOVENSKE.test(cisto(ul.textContent)), "CZ rozpis bez slovenčiny a zakázaných slov: " + cisto(ul.textContent));
  over(V.oznacRiadky(ul) === 6, "zbalené: 6 údajov o aute po „Zobrazit více“");
  {
    const st2 = V.rozborVclass(surZ(konf(MICHAL)), MAPA);
    const li = document.createElement("li");
    li.appendChild(ul);
    const n = st2 ? V.vlozKriziky(li, { riadok: { itemId: "a1", sku: "VCLASS" }, mapa: MAPA, st: st2, odobrat: V.odobratelne(st2, MAPA) }, { R: D.rolePonuky(), forma: null }) : 0;
    eq([n, [...ul.querySelectorAll(".lcd-dop-x")].map((b) => b.getAttribute("data-lcd-dop-odober"))], [5, ["vclass-rad", "vclass-rohoz", "vclass-vrstva2", "vclass-box1", "vclass-box2"]], "krížiky pri 2. a 3. řade, rohoži, 2. vrstve a oboch boxoch");
    eq([...ul.querySelectorAll(".lcd-dop-x")].map((b) => b.getAttribute("aria-label")), ["Odebrat ze setu: 2. a 3. řada", "Odebrat ze setu: Rohož do kufru", "Odebrat ze setu: Druhá vrstva Lux Color 11",
      "Odebrat ze setu: Box do kufru S", "Odebrat ze setu: Box do kufru M"], "krížiky: popis po česky");
    eq(V.odobratelne(st2, MAPA).map((x) => x.hotovo), ["2. a 3. řada byla odebrána ze setu.", "Rohož do kufru byla odebrána ze setu.", "Druhá vrstva byla odebrána ze setu.",
      "Box S byl odebrán ze setu.", "Box M byl odebrán ze setu."], "hlášky po odobratí po česky");
  }
  ul = rozpis(MICHAL, null);
  eq(riadkyUl(ul), [AUTO_N, "+:Rok výroby: 2024"].concat(AUTA, CASTI(RAD + " (velikost L)")), "CZ rozpis bez auta: rok výroby, velikost pri 2. a 3. řade");
  eq(riadkyUl(rozpis(MICHAL, auto("XL", "2024"))).slice(0, 11), [AUTO_N, "+:Auto: Mercedes-Benz V Class XL (Extra Long 5370 mm) 2024"].concat(AUTA, [OBJ_N, "+predok:Autokoberce k předním sedadlům", "+rad:" + RAD + " (velikost L)"]), "auto XL, řada L: velikost vypísaná");
  eq(riadkyUl(rozpis(MICHAL, auto("L", "2019"))).slice(0, 2), [AUTO_N, "+:Rok výroby: 2024"], "auto iného roku: bez Auto, rok z riadku");
  ul = rozpis({ [SELECTY.volant]: "Vpravo", [SELECTY.stred]: "Loketní opěrka nebo lednička", [SELECTY.dvere]: "Jedny, vpravo", [SELECTY.zasuvky]: "Se zásuvkami",
    [SELECTY.sedadla]: "3 sedadla ve 2. řadě a 3 sedadla ve 3. řadě", [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.box1]: boxT("M"), [SELECTY.boxFarba]: "Béžová", "Jiný příplatek": "x" }, auto("XL"));
  eq(riadkyUl(ul), [AUTO_N, "+:Auto: Mercedes-Benz V Class XL (Extra Long 5370 mm) 2021", "-:Volant: Vpravo", "-:Boční posuvné dveře: Jedny, vpravo", "-:Sedadla: 3 ve 2. řadě, 3 ve 3. řadě",
    "-:Stolek ve 2. a 3. řadě: Ne", "-:Mezi předními sedadly: Loketní opěrka nebo lednička", "-:Elektrické zásuvky pod sedadly: Ano",
    OBJ_N, "+predok:Autokoberce k předním sedadlům", "+:Vzor a barva 1. vrstvy: Diamond Line – Černá, červené šití", "+:Bez druhé vrstvy", "+box:Box do kufru: M 40 × 32 × 30 cm",
    "+:Barva boxů: Béžová", "-:Jiný příplatek: x"], "CZ rozpis: ostatné hodnoty, neznámy príplatok na konci");
  eq(riadkyUl(rozpis({ [ROZL]: rozRadRohoz("M"), [ROH]: ROHOZ[0] }, auto("M"))).slice(8), [OBJ_N, "+rad:" + RAD, "+rohoz:Rohož do kufru", "+:Vzor a barva 1. vrstvy: Diamond Line – Černá, červené šití", "-:Bez druhé vrstvy"], "2. a 3. řada s rohoží, auto M");
  eq(riadkyUl(rozpis({ [SELECTY.rok]: null, [SELECTY.volant]: null, [SELECTY.stred]: null, [SELECTY.dvere]: null, [SELECTY.sedadla]: null, [SELECTY.stolcek]: null, [SELECTY.zasuvky]: null,
    [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, null)).slice(0, 2), [OBJ_N, "+predok:Autokoberce k předním sedadlům"], "bez údajov o aute: len „Objednáváte“");
  over(V.rozpisVclass(document, { sku: "VCLASS", priceId: "68434", sur: surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })) }) === null, "SK priceId na CZ -> null (bežný rozpis)");
}

// karta ponuky „Doplňte svůj set“ v DOM (rovnaké triedy ako SK, české texty a Kč)
const R_CZ = D.rolePonuky();
eq([R_CZ && R_CZ.trh, R_CZ && R_CZ.mena], ["cz", "CZK"], "role ponuky CZ");
/** Text prvku po deťoch oddelených medzerou („Autokoberce pro 2. a 3. řadu“ + štítok „Nejvýhodnější“). */
const deti = (e) => [...e.children].map((x) => cisto(x.textContent)).join(" ");
const karta = (z, o) => {
  const s = st(z);
  return V.kartaVclass(document, { riadok: { itemId: "a1", sku: "VCLASS" }, mapa: MAPA, st: s, ponuky: V.ponukyVclass(s, MAPA, o || {}), kSetu: null }, { R: R_CZ, forma: null });
};
{
  const k = karta({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, { velAuta: "XL" });
  const riadky = [...k.querySelectorAll(".lcd-vyb__riadok")].map((r) => [r.getAttribute("data-doplnok"), deti(r.querySelector(".lcd-vyb__meno")), cisto(r.querySelector(".lcd-vyb__cena").textContent), cisto(r.querySelector(".lcd-vyb__btn").textContent)]);
  eq([cisto(k.querySelector(".lcd-vyb__nadpis").textContent), cisto(k.querySelector(".lcd-vyb__pod").textContent)], ["Doplňte svůj set", "za cenu v setu"], "karta: nadpis");
  eq(riadky, [
    ["rad", "Autokoberce pro 2. a 3. řadu Nejvýhodnější", "+20 000 Kč · ušetříte 3 750 Kč", "Přidat"],
    ["rohoz", "Rohož do kufru", "+6 250 Kč · ušetříte 2 250 Kč", "Přidat"],
    ["vrstva2", "Druhá vrstva", "+3 750 Kč · vpředu, zachytí vodu i bláto", "Přidat"],
    ["box", "Box do kufru", "od +2 640 Kč · ušetříte 2 460 Kč", "Přidat"]], "karta: riadky, ceny v Kč, „ušetříte“");
  const vr = k.querySelector('[data-doplnok="vrstva2"] .lcd-vyb__panel');
  eq([cisto(vr.querySelector("legend").textContent), cisto(vr.querySelector(".lcd-vyb__zvolena").textContent), cisto(vr.querySelector(".lcd-vyb__pridat").textContent), vr.querySelector('input[data-lcd-vyb-lux="10"]').checked],
    ["Vyberte barvu druhé vrstvy:", "Zvolená barva: Lux Color 10", "Přidat k setu · +3 750 Kč", true], "druhá vrstva: výber po česky, odporúčaná Lux 10");
  const bx = k.querySelector('[data-doplnok="box"] .lcd-vyb__panel');
  eq([...bx.querySelectorAll("legend")].map((l) => cisto(l.textContent)), ["Barva boxu", "Počet", "Velikost", "Velikost 2. boxu"], "box: nadpisy výberu");
  eq(cisto(bx.querySelector(".lcd-vyb__zvolena").textContent), "Zvolená: Černá, červené šití – jako Vaše koberce", "box: farba vopred ako koberce");
  eq([...bx.querySelectorAll(".lcd-vyb__dlazdice--2 .lcd-vyb__dl")].map((l) => cisto(l.textContent)), ["1 box", "2 boxy"], "box: počet");
  eq([...bx.querySelectorAll(".lcd-vyb__dlazdice--4 .lcd-vyb__dl")].map((l) => deti(l.querySelector("span"))).slice(0, 4), ["S 33 × 32 × 30 cm +2 640 Kč", "M 40 × 32 × 30 cm +3 079 Kč", "L 54 × 32 × 30 cm +3 585 Kč", "XL 66 × 32 × 30 cm +3 899 Kč"], "box: veľkosti s cenou v Kč");
  eq([cisto(bx.querySelector(".lcd-vyb__pridat").textContent), bx.querySelector(".lcd-vyb__pridat").disabled], ["Vyberte velikost boxu", true], "box: bez veľkosti tlačidlo čaká");
  bx.querySelector('input[data-lcd-vyb-pocet="2"]').checked = true;
  bx.querySelector('input[data-lcd-vyb-pocet="2"]').dispatchEvent(new window.Event("change"));
  bx.querySelector('input[data-lcd-vyb-velkost="M"]').checked = true;
  bx.querySelector('input[data-lcd-vyb-velkost="M"]').dispatchEvent(new window.Event("change"));
  bx.querySelector('input[data-lcd-vyb-velkost2="L"]').checked = true;
  bx.querySelector('input[data-lcd-vyb-velkost2="L"]').dispatchEvent(new window.Event("change"));
  eq([cisto(bx.querySelector(".lcd-vyb__pridat").textContent), bx.querySelector(".lcd-vyb__pridat").disabled], ["Přidat k setu · +6 258 Kč", false], "box: 2 boxy M + L");
  const text = cisto(k.textContent);
  over(!ZAKAZANE.test(text), "karta bez zakázaných slov (" + (text.match(ZAKAZANE) || [""])[0] + ")");
  over(!SLOVENSKE.test(text), "karta bez slovenčiny (" + (text.match(SLOVENSKE) || [""])[0] + ")");
  // tlačidlo „Přidat“ otvorí panel s „Zavřít“
  k.querySelector('[data-lcd-vyb="vclass-vrstva2"]').click();
  eq([cisto(k.querySelector('[data-lcd-vyb="vclass-vrstva2"]').textContent), vr.hidden], ["Zavřít", false], "druhá vrstva: otvorené = „Zavřít“");
}
{
  const k = karta({ [ROZL]: rozLen("L"), [ROH]: ROHOZ[1] }, {});
  eq([...k.querySelectorAll(".lcd-vyb__riadok")].map((r) => deti(r.querySelector(".lcd-vyb__meno")) + " | " + cisto(r.querySelector(".lcd-vyb__cena").textContent)),
    ["Autokoberce pro přední sedadla | +3 750 Kč · ušetříte 6 000 Kč", "Rohož do kufru | +2 500 Kč · ušetříte 6 000 Kč", "Box do kufru | od +2 640 Kč · ušetříte 2 460 Kč"], "karta bez předních: přední sedadla, rohož, box");
}

// ponuka v karte košíka celou cestou (stiahnutie stránky produktu = podvrh), CZ pokladňa; SK pokladňa na CZ webe nič
{
  const stary = globalThis.fetch;
  const volania = [];
  globalThis.fetch = window.fetch = async (u) => { volania.push(String(u)); if (new URL(String(u), HOST).pathname === PRODUKT) return new Response(CZ_HTML, { status: 200, headers: { "Content-Type": "text/html" } }); throw new Error("sieť v teste"); };
  const p = { itemId: "a1", priceId: FIX.priceId, sku: "VCLASS", href: PRODUKT, sur: surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })), q: 1, nazov: "Autokoberce Mercedes V Class", cena: "7 500 Kč" };
  const vys = await sAutomAsync(auto("L"), () => V.ponukaVKarte([p], { R: R_CZ, forma: null, doc: document }));
  eq(vys.map((x) => [x.riadok.itemId, x.karta && [...x.karta.querySelectorAll(".lcd-vyb__riadok")].map((r) => r.getAttribute("data-doplnok")), x.kSetu]),
    [["a1", ["rad", "rohoz", "vrstva2", "box"], "K setu: Autokoberce Mercedes V Class"]], "ponukaVKarte: CZ riadok s autom L -> 2. a 3. řada, rohož, vrstva, box");
  eq(await V.ponukaVKarte([p], { R: D.ROLE[562035], forma: null, doc: document }), [], "ponukaVKarte so SK rolami na CZ webe: nič (nikdy krížom)");
  eq(await V.ponukaVKarte([Object.assign({}, p, { priceId: "68434" })], { R: R_CZ, forma: null, doc: document }), [], "ponukaVKarte: SK produkt v CZ košíku nič");
  const dva = await V.ponukaVKarte([p, Object.assign({}, p, { itemId: "a2", cena: "27 500 Kč", sur: surZ(konf({ [ROZL]: rozSet("XL"), [ROH]: ROHOZ[1] })) })], { R: R_CZ, forma: null, doc: document });
  eq(dva.map((x) => x.karta && cisto((x.karta.querySelector(".lcd-vyb__kset") || {}).textContent)), ["K setu: Autokoberce Mercedes V Class · 7 500 Kč", "K setu: Autokoberce Mercedes V Class · 27 500 Kč"], "dva riadky triedy V: „K setu“ s cenou");
  eq(volania.filter((u) => new URL(u, HOST).pathname === PRODUKT).length, 1, "stránka produktu sa stiahla raz (potom mapa z localStorage)");
  // ponuka setov riadok CZ triedy V vynechá a stránku produktu nesťahuje
  volania.length = 0;
  const v = await D.pripravKontexty([{ itemId: "a1", priceId: FIX.priceId, sku: "VCLASS", href: PRODUKT, maPriplatky: true, sur: p.sur, q: 1, text: "Autokoberce Mercedes V Class" }], R_CZ, {});
  eq([v.kandidati, volania.length], [0, 0], "ponuka setov: riadok CZ triedy V vynechaný, stránka produktu sa nesťahuje");
  globalThis.fetch = window.fetch = stary;
}
// meranie: lcd_trh = cz
over(window.dataLayer.some((e) => e && e.event === "lcd_set_doplnok_zobrazenie" && e.lcd_trh === "cz") && !window.dataLayer.some((e) => e && e.lcd_trh === "sk"), "meranie zobrazenia s lcd_trh „cz“");
console.log(`A) ${ok} OK, ${zle} ZLE`);
if (process.argv.includes("--len-a")) process.exit(zle ? 1 : 0);

// ================================================================== B) dočasný prehliadač na živom CZ webe
const pwUrl = arg("pw");
if (!pwUrl) { console.error("chýba --pw"); process.exit(2); }
const pw = await import(pathToFileURL(pwUrl.replace(/^file:\/+/, "")).href);
let dist = arg("dist"), tmp = null;
if (!dist) {
  tmp = dist = mkdtempSync(join(tmpdir(), "lcd-vclass-kosik-cz-"));
  const eb = (vstup, vystup, extra) => spawnSync(process.execPath, ["node_modules/esbuild/bin/esbuild", vstup, "--outfile=" + join(dist, vystup)].concat(extra), { stdio: "inherit" }).status;
  const js = ["--bundle", "--format=iife", "--minify", "--drop:console", "--legal-comments=none", "--log-level=error"];
  if (eb("assets/js/main.js", "luxuryCar.js", js.concat("--loader:.jsx=jsx")) || eb("assets/js/casti/vclass.js", "lcd-vclass.js", js)
    || eb("assets/css/luxuryCar.css", "luxuryCar.css", ["--minify", "--target=chrome80,firefox78,safari13", "--log-level=error"])) process.exit(2);
}
const SUBORY = { js: readFileSync(join(dist, "luxuryCar.js")), css: readFileSync(join(dist, "luxuryCar.css")), vclass: existsSync(join(dist, "lcd-vclass.js")) ? readFileSync(join(dist, "lcd-vclass.js")) : null };
const snimky = arg("snimky");
if (snimky) mkdirSync(snimky, { recursive: true });
const bezPodvrhu = process.argv.includes("--bez-podvrhu");
const BLOK = /googletagmanager|google-analytics|doubleclick|facebook|connect\.facebook|tiktok|hotjar|clarity\.ms|ecomail|smartsupp|bing\.com|sklik|seznam|luxia|heureka|pinterest|googleadservices|metricool/i;
const CHYBA_VYMENY = "Doplněk se nepodařilo přidat. Váš košík zůstal beze změny. Zkuste to prosím znovu.";
const idRozl = FIX.priplatky.find((p) => p.n === ROZL);
const XL_SET = idRozl.h.find((h) => h[1] === rozSet("XL"))[0];

const P_ = (k, c, u) => [k, c, u || null];
const U = (n) => "ušetříte " + kc(n) + " Kč";
const SCEN = [
  { id: "predok-xl", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, auto: auto("XL"), cena: 7500, snimky: true,
    ponuky: [P_("rad", "+20 000 Kč", U(3750)), P_("rohoz", "+6 250 Kč", U(2250)), P_("vrstva2", "+3 750 Kč"), P_("box", "od +2 640 Kč", U(2460))], kriziky: [],
    akcie: [
      { klik: "rad", cena: 27500, zmena: { [ROZL]: rozSet("XL") }, hlaska: "✓ 2. a 3. řada byla přidána k Vašemu setu.", ponuky: ["rohoz", "vrstva2", "box"], kriziky: ["rad"], boxNahlad: true },
      { x: "rad", cena: 7500, zmena: { [ROZL]: ROZ_PREDOK }, hlaska: "✓ 2. a 3. řada byla odebrána ze setu.", ponuky: ["rad", "rohoz", "vrstva2", "box"], kriziky: [] },
    ] },
  { id: "predok-m", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.rok]: "2019" }, auto: auto("M", "2019"), cena: 7500,
    ponuky: [P_("rad", "+15 000 Kč", U(3750)), P_("rohoz", "+6 250 Kč", U(2250)), P_("vrstva2", "+3 750 Kč"), P_("box", "od +2 640 Kč", U(2460))], kriziky: [] },
  { id: "predok-l-bez-auta", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, auto: null, cena: 7500,
    ponuky: [P_("rohoz", "+6 250 Kč", U(2250)), P_("vrstva2", "+3 750 Kč"), P_("box", "od +2 640 Kč", U(2460))], kriziky: [] },
  { id: "rady-m", volby: { [ROZL]: rozLen("M"), [ROH]: ROHOZ[1] }, auto: null, cena: 18750,
    ponuky: [P_("predok", "+3 750 Kč", U(6000)), P_("rohoz", "+2 500 Kč", U(6000)), P_("box", "od +2 640 Kč", U(2460))], kriziky: [],
    akcie: [{ klik: "rohoz", cena: 21250, zmena: { [ROZL]: rozRadRohoz("M"), [ROH]: ROHOZ[0] }, hlaska: "✓ Rohož do kufru byla přidána k Vašemu setu.", ponuky: ["predok", "box"], kriziky: ["rad", "rohoz"] }] },
  { id: "rohoz-l", volby: { [ROZL]: ROZ_BEZ, [ROH]: ROHOZ_SAM }, auto: auto("L"), cena: 8500,
    ponuky: [P_("rad", "+15 250 Kč", U(6000)), P_("predok", "+5 250 Kč", U(4500)), P_("box", "od +2 640 Kč", U(2460))], kriziky: [],
    akcie: [{ klik: "predok", cena: 13750, zmena: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[0] }, hlaska: "✓ Přední sedadla byla přidána k Vašemu setu.", ponuky: ["rad", "vrstva2", "box"], kriziky: ["rohoz"] }] },
  { id: "rady-rohoz-xl", volby: { [ROZL]: rozRadRohoz("XL"), [ROH]: ROHOZ[0] }, auto: auto("XL"), cena: 26250,
    ponuky: [P_("predok", "+7 500 Kč", U(2250)), P_("box", "od +2 640 Kč", U(2460))], kriziky: ["rad", "rohoz"],
    akcie: [{ x: "rohoz", cena: 23750, zmena: { [ROZL]: rozLen("XL"), [ROH]: ROHOZ[1] }, hlaska: "✓ Rohož do kufru byla odebrána ze setu.", ponuky: ["predok", "rohoz", "box"], kriziky: [] }] },
  { id: "predok-rohoz", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[0] }, auto: auto("XL"), cena: 13750,
    ponuky: [P_("rad", "+20 000 Kč", U(3750)), P_("vrstva2", "+3 750 Kč"), P_("box", "od +2 640 Kč", U(2460))], kriziky: ["rohoz"],
    akcie: [{ klik: "vrstva2", lux: "10", cena: 17500, zmena: { [F2]: "Lux Color 10" }, hlaska: "✓ Druhá vrstva Lux Color 10 byla přidána k Vašemu setu.", ponuky: ["rad", "box"], kriziky: ["rohoz", "vrstva2"] }] },
  { id: "predok-rady-l", volby: { [ROZL]: rozSet("L"), [ROH]: ROHOZ[1] }, auto: auto("L"), cena: 25000,
    ponuky: [P_("rohoz", "+6 250 Kč", U(2250)), P_("vrstva2", "+3 750 Kč"), P_("box", "od +2 640 Kč", U(2460))], kriziky: ["rad"],
    akcie: [{ klik: "box", boxy: ["M", "L"], cena: 31258, zmena: { [SELECTY.box2]: boxT("M"), [SELECTY.box3]: boxT("L"), [SELECTY.boxFarba]: "Černá, červené šití" }, hlaska: "✓ Boxy byly přidány k Vašemu setu.", ponuky: ["rohoz", "vrstva2"], kriziky: ["rad", "box1", "box2"] }] },
  { id: "cely-set", volby: { [ROZL]: rozSet("XL"), [ROH]: ROHOZ[0], [F2]: "Lux Color 12", [SELECTY.box2]: boxT("M"), [SELECTY.box3]: boxT("L"), [SELECTY.boxFarba]: "Černá, červené šití" }, auto: auto("XL"), cena: 43758,
    ponuky: [], kriziky: ["rad", "rohoz", "vrstva2", "box1", "box2"],
    akcie: [{ x: "box1", cena: 41085, zmena: { [SELECTY.box2]: null, [SELECTY.box3]: null, [SELECTY.box1]: boxT("L") }, hlaska: "✓ Box M byl odebrán ze setu.", ponuky: [], kriziky: ["rad", "rohoz", "vrstva2", "box"] }] },
  // Michalov košík zo SK snímky po česky: rozpis auto -> objednané časti, náhľad zbalený aj rozbalený
  { id: "michal-l-2024", volby: MICHAL, auto: auto("L", "2024"), cena: 40158, snimky: true, ponuky: [], kriziky: ["rad", "rohoz", "vrstva2", "box1", "box2"] },
  { id: "chyba-siet", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, auto: auto("XL"), cena: 7500,
    ponuky: [P_("rad", "+20 000 Kč", U(3750)), P_("rohoz", "+6 250 Kč"), P_("vrstva2", "+3 750 Kč"), P_("box", "od +2 640 Kč")], kriziky: [],
    akcie: [{ klik: "rad", zrusAdd: true, chyba: CHYBA_VYMENY, cena: 7500, zmena: {} }] },
  { id: "chyba-cena", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, auto: auto("XL"), cena: 7500, podvrhCeny: { [XL_SET]: 19750 },
    ponuky: [P_("rad", "+19 750 Kč", U(4000)), P_("rohoz", "+6 250 Kč"), P_("vrstva2", "+3 750 Kč"), P_("box", "od +2 640 Kč")], kriziky: [],
    akcie: [{ klik: "rad", chyba: CHYBA_VYMENY, cena: 7500, zmena: {} }] },
  // stráž: bežné produkty majú rovnakú ponuku ako živá verzia a žiadnu ponuku triedy V
  { id: "set-2403", porovnaj: true, kosik: ["2403"], autoOsobne: true },
  { id: "kamion", porovnaj: true, kosik: ["kamion"] },
  { id: "zmes-vclass-2403", porovnaj: true, kosik: ["vclass", "2403"], volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, autoOsobne: true },
  { id: "chyba-ponuky", chybaPonuky: true, kosik: ["vclass", "2403"], volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, autoOsobne: true },
];

// ---- v stránke: pridanie do košíka a obsah košíka (len POST addCartItem, ako tlačidlo „do košíka“)
const V_STRANKE = {
  async pridajVclass(a) {
    const cisty = (s) => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
    const bez = (t) => cisty(t).replace(/\s\+\s?€?\s?-?\d[\d\s.,]*\s?(€|Kč)?$/, "").trim();
    const d = new DOMParser().parseFromString(await (await fetch(a.cesta, { credentials: "same-origin" })).text(), "text/html");
    const f = d.querySelector("#product-detail-form");
    if (!f) return { chyba: "stránka produktu bez formulára" };
    const b = new URLSearchParams();
    b.set("priceId", f.querySelector('input[name="priceId"]').value);
    b.set("productId", f.querySelector('input[name="productId"]').value);
    const lang = f.querySelector('input[name="language"]');
    if (lang) b.set("language", lang.value);
    for (const [meno, text] of Object.entries(a.volby)) {
      const s = f.querySelector('select[data-parameter-name="' + meno + '"]');
      const o = s && [...s.options].find((x) => x.value && bez(x.textContent) === text);
      if (!o) return { chyba: "chýba " + meno + " = " + text };
      b.set(s.name, o.value);
    }
    b.set("amount", "1");
    const csrf = window.shoptet && shoptet.csrf && shoptet.csrf.token;
    if (csrf) b.set("__csrf__", csrf);
    const r = await fetch("/action/Cart/addCartItem/", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" }, body: b.toString() });
    const j = await r.json().catch(() => null);
    return { code: j && j.code, productId: b.get("productId") };
  },
  async pridajIny(a) {
    const d = new DOMParser().parseFromString(await (await fetch(a.cesta, { credentials: "same-origin" })).text(), "text/html");
    const f = d.querySelector("#product-detail-form");
    const b = new URLSearchParams();
    b.set("priceId", f.querySelector('input[name="priceId"]').value);
    b.set("productId", f.querySelector('input[name="productId"]').value);
    const lang = f.querySelector('input[name="language"]');
    if (lang) b.set("language", lang.value);
    f.querySelectorAll('select[name^="surchargeParameterValueId["]').forEach((s) => {
      const id = s.getAttribute("data-parameter-id");
      const moz = [...s.options].filter((x) => /^\d+$/.test(x.value));
      if (a.nastav && a.nastav[id] && moz.some((x) => x.value === a.nastav[id])) b.set(s.name, a.nastav[id]);
      else if (a.vynechaj && a.vynechaj.includes(id)) return;
      else if (s.required && moz.length) b.set(s.name, moz[0].value);
    });
    b.set("amount", "1");
    const csrf = window.shoptet && shoptet.csrf && shoptet.csrf.token;
    if (csrf) b.set("__csrf__", csrf);
    const r = await fetch("/action/Cart/addCartItem/", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" }, body: b.toString() });
    const j = await r.json().catch(() => null);
    return { code: j && j.code, productId: b.get("productId") };
  },
  async obsah() {
    const cisty = (s) => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
    const r = await fetch("/action/Cart/GetCartContent/", { headers: { "X-Requested-With": "XMLHttpRequest" }, credentials: "same-origin", cache: "no-store" });
    const t = await r.text();
    let h = t;
    try { const j = JSON.parse(t); h = (j.payload && (j.payload.content || j.payload.html)) || ""; } catch (e) {}
    const d = new DOMParser().parseFromString(h, "text/html");
    return [...d.querySelectorAll('tr.removeable, tr[data-micro="cartItem"]')].map((tr) => ({
      itemId: (tr.querySelector('input[name="itemId"]') || {}).value, priceId: (tr.querySelector('input[name="priceId"]') || {}).value,
      sku: tr.getAttribute("data-micro-sku"), q: Number((tr.querySelector("input.amount") || {}).value),
      sur: cisty((tr.querySelector('[data-testid="cartWidgetSurchargeName"], .main-link-surcharges') || {}).textContent),
      cena: cisty((tr.querySelector('.p-total .price-final, [data-testid="cartPrice"]') || {}).textContent),
    }));
  },
};

/** Text príplatkov riadku -> { názov: hodnota } podľa známych mien (hodnota môže mať čiarky). */
function rozober(sur) {
  const t = cisto(sur).replace(/^P[rř][ií]platky:\s*/, "");
  const mena = Object.values(SELECTY);
  const najdene = [];
  for (const m of mena) { const i = t.indexOf(m + " - "); if (i === 0 || (i > 1 && t.slice(i - 2, i) === ", ")) najdene.push([i, m]); }
  najdene.sort((a, b) => a[0] - b[0]);
  const o = {};
  najdene.forEach(([i, m], j) => { o[m] = t.slice(i + m.length + 3, j + 1 < najdene.length ? najdene[j + 1][0] - 2 : t.length); });
  return o;
}
const zorad = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => a[0].localeCompare(b[0])));
const cudziaChyba = (e) => /hidePISMethod/.test(String(e && e.stack)) && /cdn\.myshoptet\.com\/prj\//.test(String(e && e.stack));
let infoCudzie = 0;
const chybaStranky = (chyby) => (e) => { if (cudziaChyba(e)) { infoCudzie++; return; } chyby.push(String(e.message).slice(0, 160)); };
const cenaCislo = (t) => Number(cisto(t).replace(/[^\d,]/g, "").replace(",", "."));

async function snap(p) {
  return p.evaluate(() => {
    const c = (t) => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
    return {
      polozky: [...document.querySelectorAll(".lcd-opc-kk__polozka")].map((li) => ({
        item: li.getAttribute("data-item"), cena: c((li.querySelector(".lcd-opc-kk__cena") || {}).textContent),
        rozpis: [...li.querySelectorAll("ul.lcd-rozpis > li")].map((r) => (r.classList.contains("lcd-opc-dalsi") ? "~" : "") + c(r.textContent).replace(/×$/, "").trim()),
        x: [...li.querySelectorAll(".lcd-dop-x")].map((b) => b.getAttribute("data-lcd-dop-odober")),
        xAria: [...li.querySelectorAll(".lcd-dop-x")].map((b) => b.getAttribute("aria-label")),
        vc: li.querySelector("ul.lcd-rozpis[data-lcd-vclass]") ? 1 : 0,
        zob: c((li.querySelector(".lcd-opc-zob") || {}).textContent),
        text: c(li.textContent),
        nadpisy: [...li.querySelectorAll("ul.lcd-rozpis > li.lcd-rozpis__nadpis")].map((h) => {
          const cs = getComputedStyle(h), pred = getComputedStyle(h, "::before");
          return { t: c(h.textContent), vidno: h.getClientRects().length > 0 && cs.visibility !== "hidden", px: parseFloat(cs.fontSize), velke: cs.textTransform === "uppercase",
            odrazka: !(pred.content === "none" || pred.content === "normal" || pred.display === "none"), klik: !!h.querySelector("a, button, input") || cs.cursor === "pointer" };
        }),
      })),
      suhrn: [...document.querySelectorAll("#summary-box ul.lcd-rozpis[data-lcd-vclass]")].map((ul) => [...ul.querySelectorAll(":scope > li.lcd-rozpis__nadpis")].map((h) => c(h.textContent))),
      bloky: [...document.querySelectorAll("#lcd-doplnok .lcd-vyb")].map((k) => ({
        trieda: k.className, item: k.getAttribute("data-item"), nadpis: c((k.querySelector(".lcd-vyb__nadpis") || {}).textContent),
        kset: c((k.querySelector(".lcd-vyb__kset") || {}).textContent),
        riadky: [...k.querySelectorAll(".lcd-vyb__riadok")].map((r) => ({ d: r.getAttribute("data-doplnok"), meno: c((r.querySelector(".lcd-vyb__meno") || {}).textContent), cena: c((r.querySelector(".lcd-vyb__cena") || {}).textContent),
          naj: r.classList.contains("lcd-vyb__riadok--naj"), foto: (r.querySelector("[data-lcd-vc-foto] img, img.lcd-vyb__mini") || {}).currentSrc || (r.querySelector("img.lcd-vyb__mini") || {}).src || "", tl: c((r.querySelector(".lcd-vyb__btn") || {}).textContent) })),
        text: c(k.textContent),
      })),
      hlaska: c((document.querySelector(".lcd-opc-kk__hlaska") || {}).textContent),
      stav: [...document.querySelectorAll("#lcd-doplnok .lcd-dop__stav")].map((s) => c(s.textContent)).filter(Boolean),
      bezi: document.documentElement.classList.contains("lcd-dop-bezi"),
    };
  });
}

async function pockajStabilne(p, max = 30000) {
  const od = Date.now();
  let posl = "", stab = Date.now();
  while (Date.now() - od < max) {
    const s = await snap(p).catch(() => null);
    const j = JSON.stringify(s && { p: s.polozky, b: s.bloky.map((b) => b.riadky), bezi: s.bezi });
    if (j !== posl) { posl = j; stab = Date.now(); }
    else if (s && !s.bezi && s.polozky.length && Date.now() - stab > 3000) return s;
    await p.waitForTimeout(400);
  }
  return snap(p);
}

async function novyKontext(b, sirka, rezim, sc, stav) {
  const c = await b.newContext({ viewport: { width: sirka, height: sirka < 500 ? 844 : 900 }, locale: "cs-CZ", ...(sirka < 500 && b.browserType().name() !== "firefox" ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
  const podvrh = sc.podvrhCeny ? czStranka(htmlSk, sc.podvrhCeny) : CZ_HTML;
  await c.route("**/*", async (r) => {
    const q = r.request(), u = q.url(), m = q.method();
    if (BLOK.test(u)) return r.abort();
    if (/\/action\/orderingProcess\/Step2Validate/i.test(u)) { stav.objednavka++; return r.abort(); }
    if (/step2CustomerAjax/i.test(u)) return r.abort();
    if (m === "POST" && /\/action\//.test(u) && !/\/action\/Cart\/(addCartItem|deleteCartItem|setCartItemAmount)\/|\/action\/orderingProcess\/Step1Validate\/|\/action\/CustomerCookieConsent\//i.test(u)) return r.abort();
    if (m === "POST" && /\/action\/Cart\/addCartItem\//.test(u) && stav.zrusAdd) { stav.zrusene++; return r.abort(); }
    if (rezim === "po") {
      if (/\/assets\/v\/[^/]+\/js\/luxuryCar\.js/.test(u)) return r.fulfill({ status: 200, contentType: "application/javascript", body: SUBORY.js });
      if (/\/assets\/v\/[^/]+\/css\/luxuryCar\.css/.test(u)) return r.fulfill({ status: 200, contentType: "text/css", body: SUBORY.css });
      if (SUBORY.vclass && /\/assets\/v\/[^/]+\/js\/lcd-vclass\.js/.test(u)) return r.fulfill({ status: 200, contentType: "application/javascript", body: SUBORY.vclass });
    }
    // stránka CZ produktu (hosť 404): podvrh s CZ príplatkami; --bez-podvrhu po zverejnení = živá stránka
    if (m === "GET" && u === HOST + PRODUKT && q.resourceType() === "fetch" && (!bezPodvrhu || sc.podvrhCeny)) {
      stav.podvrhy++;
      return r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: podvrh });
    }
    return r.continue();
  });
  return c;
}

const PRODUKTY = { "2403": "/luxusne-autokoberce-dragonskin-diamond-line/", kamion: "/luxusni-autokoberce-kamiony/" };
const AUTO_OSOBNE = { Brand: "BMW", Model: "X5", Year: "2021", carType: "SUV", model: "BMW X5 2021 SUV" };
const R_ROHOZ = D.ROLE[581408];

async function pripravKosik(p, sc) {
  await p.goto(HOST + "/kosik/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await p.waitForTimeout(1200);
  const odm = await p.$('button:has-text("Odmítnout")');
  if (odm) await odm.click().catch(() => {});
  const kosik = sc.kosik || ["vclass"];
  for (const k of kosik) {
    const v = k === "vclass" ? await p.evaluate(V_STRANKE.pridajVclass, { cesta: PRODUKT, volby: konf(sc.volby) })
      : await p.evaluate(V_STRANKE.pridajIny, { cesta: PRODUKTY[k], nastav: k === "2403" ? { [R_ROHOZ.rohoz]: R_ROHOZ.nie } : null,
        vynechaj: k === "2403" ? [R_ROHOZ.farbaBox, R_ROHOZ.box1, R_ROHOZ.box2, R_ROHOZ.boxSolo] : [] });
    if (!v || v.code !== 200) throw new Error("pridanie " + k + ": " + JSON.stringify(v));
  }
  const a = sc.autoOsobne ? AUTO_OSOBNE : sc.auto;
  await p.evaluate((x) => { ["Brand", "Model", "Year", "carType", "model"].forEach((k) => sessionStorage.removeItem(k)); if (x) Object.keys(x).forEach((k) => sessionStorage.setItem(k, x[k])); }, a || null);
  await p.goto(HOST + "/objednavka/krok-2/", { waitUntil: "domcontentloaded", timeout: 45000 });
  if (!/objednavka\/krok-2/.test(p.url())) {
    await p.goto(HOST + "/kosik/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await p.waitForURL(/objednavka\/krok-2/, { timeout: 40000 });
  }
  await p.waitForSelector(".lcd-opc-kk__polozka", { timeout: 45000 });
  const odm2 = await p.$('button:has-text("Odmítnout")');
  if (odm2) await odm2.click().catch(() => {});
  return pockajStabilne(p);
}

function overKartu(s, sc, kontext, polozka, ocakPonuky, ocakKriziky, cena) {
  const li = s.polozky.find((x) => x.item === polozka);
  over(!!li && li.vc === 1, kontext + ": položka triedy V má rozpis triedy V");
  if (!li) return;
  over(cenaCislo(li.cena) === cena, kontext + ": cena položky " + li.cena + " = " + cena + " Kč");
  over(/Kč/.test(li.cena) && !/€/.test(li.cena), kontext + ": cena v Kč");
  eq(li.x, ocakKriziky.map((k) => "vclass-" + k), kontext + ": krížiky");
  over(li.xAria.every((a) => /^Odebrat ze setu: /.test(a)), kontext + ": krížiky „Odebrat ze setu“ " + JSON.stringify(li.xAria));
  over(!SLOVENSKE.test(li.text) && !ZAKAZANE.test(li.text), kontext + ": položka po česky bez zakázaných slov (" + ((li.text.match(SLOVENSKE) || li.text.match(ZAKAZANE) || [""])[0]) + ")");
  const bloky = s.bloky.filter((b) => /lcd-vyb--vclass/.test(b.trieda));
  if (!ocakPonuky.length) { over(!bloky.length, kontext + ": bez ponuky (všetko v sete)"); return; }
  over(bloky.length === 1 && bloky[0].item === polozka, kontext + ": jeden blok triedy V pri položke");
  const b = bloky[0];
  if (!b) return;
  over(b.nadpis === "Doplňte svůj set", kontext + ": nadpis „" + b.nadpis + "“");
  over(!b.kset, kontext + ": jediná karta ponuky bez „K setu“ (" + b.kset + ")");
  eq(b.riadky.map((r) => r.d), ocakPonuky.map((x) => Array.isArray(x) ? x[0] : x), kontext + ": poradie ponúk");
  ocakPonuky.forEach((x) => {
    if (!Array.isArray(x)) return;
    const r = b.riadky.find((y) => y.d === x[0]);
    if (!r) return;
    over(r.cena.indexOf(x[1]) === 0, kontext + ": " + x[0] + " cena " + r.cena + " začína " + x[1]);
    if (x[2]) over(r.cena.includes(x[2]), kontext + ": " + x[0] + " „" + x[2] + "“ v " + r.cena);
    if (x[0] === "vrstva2") over(/vpředu, zachytí vodu i bláto/.test(r.cena), kontext + ": druhá vrstva vpředu");
    over(r.tl === "Přidat", kontext + ": " + x[0] + " tlačidlo Přidat");
    over(/\/assets\/img\/1v\/obsah\/[^/]*(v-class)[^/]*\.(webp|jpg)/.test(r.foto), kontext + ": " + x[0] + " fotka triedy V " + r.foto.split("/").pop());
  });
  const rad = b.riadky.find((r) => r.d === "rad");
  if (rad) over(rad.naj && /Nejvýhodnější/.test(rad.meno) && /Autokoberce pro 2\. a 3\. řadu/.test(rad.meno), kontext + ": 2. a 3. řada so štítkom Nejvýhodnější");
  over(!ZAKAZANE.test(b.text), kontext + ": bez zakázaných slov (" + (b.text.match(ZAKAZANE) || [""])[0] + ")");
  over(!SLOVENSKE.test(b.text), kontext + ": ponuka bez slovenčiny (" + (b.text.match(SLOVENSKE) || [""])[0] + ")");
}

const AUTO_RIADKY = /^(Auto|Rok výroby|Volant|Boční posuvné dveře|Sedadla|Stolek ve 2\. a 3\. řadě|Mezi předními sedadly|Elektrické zásuvky pod sedadly):/;
function overPoradie(s, sc, kontext, polozka) {
  const li = s.polozky.find((x) => x.item === polozka);
  if (!li) return;
  const r = li.rozpis.map((x) => x.replace(/^~/, ""));
  const rok = (sc.volby && sc.volby[SELECTY.rok]) || SPOL[SELECTY.rok];
  over(r[0] === "Vaše auto" && r[8] === "Objednáváte", kontext + ": nadpisy „" + r[0] + "“ a „" + r[8] + "“");
  over(r[1] === (sc.auto ? "Auto: Mercedes-Benz " + sc.auto.Model + " " + rok : "Rok výroby: " + rok), kontext + ": prvý riadok o aute „" + r[1] + "“");
  over(r.filter((x) => x.indexOf(rok) >= 0).length === 1, kontext + ": rok len raz");
  const posledneAuto = r.map((x) => AUTO_RIADKY.test(x)).lastIndexOf(true);
  over(posledneAuto === 7 && r.slice(1, 8).every((x) => AUTO_RIADKY.test(x)), kontext + ": 7 riadkov o aute pod „Vaše auto“, potom časti " + JSON.stringify(r.slice(0, 10)));
  over(li.rozpis.slice(2, 8).every((x) => x[0] === "~") && [0, 1, 8].every((i) => li.rozpis[i][0] !== "~")
    && li.rozpis.slice(9).every((x) => x[0] !== "~" || /^~Bez druhé vrstvy$/.test(x)), kontext + ": zbalené = oba nadpisy, prvý riadok o aute a objednané časti");
  over(!r.some((x) => /^2\. a 3\. řada/.test(x)), kontext + ": řada ako „Autokoberce do 2. a 3. řady“");
  over(/^Zobrazit/.test(li.zob), kontext + ": pilulka „" + li.zob + "“");
  eq(li.nadpisy.map((h) => h.t), ["Vaše auto", "Objednáváte"], kontext + ": nadpisy v karte");
  over(li.nadpisy.every((h) => h.vidno && h.px >= 12 && h.velke && !h.odrazka && !h.klik), kontext + ": nadpisy zbalené viditeľné, ≥ 12 px, veľké písmená, bez odrážky " + JSON.stringify(li.nadpisy));
  over(s.suhrn.length >= 1 && s.suhrn.every((n) => JSON.stringify(n) === '["Vaše auto","Objednáváte"]'), kontext + ": rekapitulácia (cart.js) s tými istými nadpismi " + JSON.stringify(s.suhrn));
}

async function behScenara(b, nazov, sirka, sc) {
  const kontext = `${nazov} ${sirka} ${sc.id}`;
  const stav = { objednavka: 0, zrusAdd: false, zrusene: 0, podvrhy: 0 };
  const c = await novyKontext(b, sirka, "po", sc, stav);
  const p = await c.newPage();
  const chyby = [];
  p.on("pageerror", chybaStranky(chyby));
  try {
    let s = await pripravKosik(p, sc);
    let k = await p.evaluate(V_STRANKE.obsah);
    over(k.length === 1 && k[0].sku === "VCLASS" && k[0].priceId === FIX.priceId, kontext + ": v košíku je jedna položka CZ triedy V");
    const id = k[0] && k[0].itemId;
    overKartu(s, sc, kontext, id, sc.ponuky, sc.kriziky, sc.cena);
    overPoradie(s, sc, kontext, id);
    over(!(await p.$('.lcd-opc-kk__polozka [data-lcd-vc-cast="predok"] .lcd-dop-x')), kontext + ": přední sedadla nemajú krížik");
    const sn = snimky && sc.snimky;
    if (sn) {
      await p.locator("#lcd-opc-kosik").screenshot({ path: join(snimky, `${nazov}-${sirka}-${sc.id}-zbalene.png`) });
      const zob = p.locator(`.lcd-opc-kk__polozka[data-item="${id}"] .lcd-opc-zob`);
      if (await zob.count()) {
        await zob.click();
        await p.waitForTimeout(300);
        await p.locator("#lcd-opc-kosik").screenshot({ path: join(snimky, `${nazov}-${sirka}-${sc.id}-rozbalene.png`) });
        await zob.click();
      }
    }
    let povodny = k[0];
    for (const [i, a] of (sc.akcie || []).entries()) {
      const ka = kontext + " krok " + (i + 1);
      stav.zrusAdd = !!a.zrusAdd;
      if (a.klik) {
        const btn = p.locator(`.lcd-vyb--vclass [data-lcd-vyb="vclass-${a.klik}"]`);
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        if (a.klik === "vrstva2") {
          over(await p.locator(`.lcd-vyb--vclass input[data-lcd-vyb-lux="${a.lux}"]`).isChecked(), ka + ": odporúčaná Lux " + a.lux + " zvolená vopred");
          const pr = p.locator('.lcd-vyb--vclass [data-lcd-vyb-pridat="vclass-vrstva2"]');
          over(cisto(await pr.textContent()) === "Přidat k setu · +3 750 Kč", ka + ": " + cisto(await pr.textContent()));
          await pr.click();
        }
        if (a.klik === "box") {
          over(/jako Vaše koberce/.test(cisto(await p.locator(".lcd-vyb--vclass .lcd-vyb__panel:not([hidden]) .lcd-vyb__zvolena").first().textContent())), ka + ": farba boxu vopred ako koberce");
          await p.locator('.lcd-vyb--vclass input[data-lcd-vyb-pocet="2"]').check({ force: true });
          await p.locator(`.lcd-vyb--vclass input[data-lcd-vyb-velkost="${a.boxy[0]}"]`).check({ force: true });
          await p.locator(`.lcd-vyb--vclass input[data-lcd-vyb-velkost2="${a.boxy[1]}"]`).check({ force: true });
          const pr = p.locator('.lcd-vyb--vclass [data-lcd-vyb-pridat="vclass-box"]');
          over(cisto(await pr.textContent()) === "Přidat k setu · +6 258 Kč", ka + ": " + cisto(await pr.textContent()));
          await pr.click();
        }
      } else {
        const x = p.locator(`.lcd-opc-kk__polozka [data-lcd-dop-odober="vclass-${a.x}"]`);
        await x.scrollIntoViewIfNeeded();
        await x.click();
      }
      if (a.chyba) {
        await p.waitForFunction((t) => [...document.querySelectorAll("#lcd-doplnok .lcd-dop__stav--chyba")].some((e) => e.textContent.includes(t)), a.chyba, { timeout: 40000 }).catch(() => {});
        s = await snap(p);
        over(s.stav.includes(a.chyba), ka + ": hláška chyby „" + s.stav.join(" | ") + "“");
        if (a.zrusAdd) over(stav.zrusene >= 1, ka + ": pridanie naozaj zlyhalo");
      } else {
        await p.waitForFunction(() => !!document.querySelector(".lcd-opc-kk__hlaska") && !document.documentElement.classList.contains("lcd-dop-bezi"), null, { timeout: 45000 }).catch(() => {});
        const h = await p.evaluate(() => (document.querySelector(".lcd-opc-kk__hlaska") || {}).textContent || "");
        over(cisto(h) === a.hlaska, ka + ": hláška „" + cisto(h) + "“");
        if (sn && i === 0) await p.locator("#lcd-opc-kosik").screenshot({ path: join(snimky, `${nazov}-${sirka}-po.png`) });
        s = await pockajStabilne(p);
      }
      stav.zrusAdd = false;
      k = await p.evaluate(V_STRANKE.obsah);
      over(k.length === 1 && k[0].sku === "VCLASS", ka + ": v košíku ostala jedna položka triedy V (" + k.length + ")");
      const r = k[0];
      if (!r) continue;
      over(cenaCislo(r.cena) === a.cena, ka + ": cena v košíku " + r.cena + " = " + a.cena + " Kč");
      const ocak = Object.assign({}, rozober(povodny.sur), a.zmena);
      Object.keys(ocak).forEach((m) => { if (ocak[m] == null) delete ocak[m]; });
      eq(zorad(rozober(r.sur)), zorad(ocak), ka + ": príplatky riadku");
      if (a.chyba) over(r.itemId === povodny.itemId && r.sur === povodny.sur && r.q === povodny.q, ka + ": košík bez zmeny (ten istý riadok)");
      else {
        over(r.itemId !== povodny.itemId, ka + ": riadok vymenený (nové itemId), pôvodný zmazaný");
        overKartu(s, sc, ka, r.itemId, a.ponuky, a.kriziky, a.cena);
        if (a.klik === "rad") over(s.polozky[0].rozpis.includes(RAD), ka + ": odrážka „" + RAD + "“ (velikost je v riadku Auto)");
        overPoradie(s, sc, ka, r.itemId);
      }
      if (sn && a.boxNahlad) {
        await p.locator('.lcd-vyb--vclass [data-lcd-vyb="vclass-box"]').click();
        await p.locator('.lcd-vyb--vclass input[data-lcd-vyb-pocet="2"]').check({ force: true });
        await p.locator('.lcd-vyb--vclass input[data-lcd-vyb-velkost="M"]').check({ force: true });
        await p.locator('.lcd-vyb--vclass input[data-lcd-vyb-velkost2="M"]').check({ force: true });
        const pr = cisto(await p.locator('.lcd-vyb--vclass [data-lcd-vyb-pridat="vclass-box"]').textContent());
        over(pr === "Přidat k setu · +5 718 Kč", ka + ": 2 boxy M " + pr);
        await p.waitForTimeout(600);
        await p.locator("#lcd-opc-kosik").screenshot({ path: join(snimky, `${nazov}-${sirka}-po-box.png`) });
        await p.locator('.lcd-vyb--vclass [data-lcd-vyb="vclass-box"]').click();
      }
      povodny = r;
    }
    over(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), kontext + ": stránka sa neposúva do boku");
  } catch (e) {
    over(false, kontext + ": " + String(e && e.message).split("\n")[0].slice(0, 200));
  }
  if (!bezPodvrhu) over(stav.podvrhy >= 1, kontext + ": stránka CZ produktu podvrhnutá (" + stav.podvrhy + "×)");
  over(stav.objednavka === 0, kontext + ": žiadne odoslanie objednávky");
  over(!chyby.length, kontext + ": bez chýb stránky " + chyby.join(" ; "));
  await c.close();
}

/** Bežný košík (set 2403 / kamión / zmes): živá verzia vs lokálna — rovnaké ponuky setu, triedu V len pri jej riadku. */
async function porovnanie(b, nazov, sirka, sc) {
  const kontext = `${nazov} ${sirka} ${sc.id}`;
  const vysledky = {};
  for (const rezim of ["pred", "po"]) {
    const stav = { objednavka: 0, podvrhy: 0 };
    const c = await novyKontext(b, sirka, rezim, sc, stav);
    const p = await c.newPage();
    const chyby = [];
    p.on("pageerror", chybaStranky(chyby));
    try {
      const s = await pripravKosik(p, sc);
      await p.waitForTimeout(2500);
      const s2 = await pockajStabilne(p, 20000);
      if (snimky && rezim === "po" && sc.kosik.includes("vclass")) await p.locator("#lcd-opc-kosik").screenshot({ path: join(snimky, `${nazov}-${sirka}-zmes.png`) });
      const k = await p.evaluate(V_STRANKE.obsah);
      vysledky[rezim] = { s: s2 || s, k: k };
    } catch (e) {
      over(false, kontext + " " + rezim + ": " + String(e && e.message).split("\n")[0].slice(0, 200));
    }
    over(stav.objednavka === 0, kontext + " " + rezim + ": žiadne odoslanie objednávky");
    over(!chyby.length, kontext + " " + rezim + ": bez chýb stránky " + chyby.join(" ; "));
    await c.close();
  }
  const a = vysledky.pred, z = vysledky.po;
  if (!a || !z) return;
  const vcIds = (v) => v.k.filter((r) => r.sku === "VCLASS" && r.priceId === FIX.priceId).map((r) => r.itemId);
  const ine = (v) => {
    const ids = vcIds(v);
    const pol = v.s.polozky.filter((x) => !ids.includes(x.item)).map((x) => ({ cena: x.cena, rozpis: x.rozpis, x: x.x }));
    const bl = v.s.bloky.filter((x) => !/lcd-vyb--vclass/.test(x.trieda) && !ids.includes(x.item)).map((x) => ({ trieda: x.trieda, nadpis: x.nadpis,
      kset: sc.kosik.includes("vclass") ? null : x.kset, riadky: x.riadky.map((r) => ({ d: r.d, meno: r.meno, cena: r.cena, tl: r.tl })) }));
    return { pol, bl };
  };
  eq(ine(z), ine(a), kontext + ": iné položky a ponuka setu rovnaké ako živá verzia");
  over(ine(z).bl.length > 0 || sc.id === "kamion", kontext + ": ponuka setu sa ukázala (" + ine(z).bl.length + " blok)");
  const ids = vcIds(z);
  const vcBloky = z.s.bloky.filter((x) => /lcd-vyb--vclass/.test(x.trieda));
  over(vcBloky.every((x) => ids.includes(x.item)), kontext + ": blok triedy V len pri riadku triedy V");
  over(z.s.polozky.every((x) => ids.includes(x.item) || (!x.vc && !x.x.some((y) => /^vclass-/.test(y)))), kontext + ": iné položky bez rozpisu a krížikov triedy V");
  if (sc.kosik.includes("vclass")) {
    over(vcBloky.length === 1, kontext + ": riadok triedy V má ponuku triedy V");
    eq(vcBloky[0] ? vcBloky[0].riadky.map((r) => r.d) : null, ["rohoz", "vrstva2", "box"], kontext + ": auto BMW v karte -> 2. a 3. řada sa neponúkne");
    const vsetky = z.s.bloky.filter((x) => x.nadpis === "Doplňte svůj set");
    over(vsetky.length === 2, kontext + ": dve karty „Doplňte svůj set“ (" + vsetky.length + ")");
    over(vcBloky[0] && vcBloky[0].kset === "K setu: Autokoberce Mercedes V Class", kontext + ": karta triedy V „" + (vcBloky[0] && vcBloky[0].kset) + "“");
    const setK = vsetky.find((x) => !/lcd-vyb--vclass/.test(x.trieda));
    over(setK && /^K setu: \S/.test(setK.kset) && !/Mercedes V Class/.test(setK.kset), kontext + ": karta setu 2403 „" + (setK && setK.kset) + "“");
    const poradie = z.k.map((r) => r.itemId);
    over(vsetky.map((x) => poradie.indexOf(x.item)).every((v, i, arr) => i === 0 || arr[i - 1] < v), kontext + ": karty v poradí riadkov košíka");
  } else {
    over(!vcBloky.length, kontext + ": žiadna ponuka triedy V");
    over(z.s.bloky.every((x) => !x.kset), kontext + ": jedna ponuka setu bez „K setu“ ako doteraz");
  }
}

/** Poistka: chyba pri vkladaní karty ponuky skryje len ponuku — karta „Váš košík“ s položkami ostane. */
async function chybaPonuky(b, nazov, sirka, sc) {
  const kontext = `${nazov} ${sirka} ${sc.id}`;
  const stav = { objednavka: 0, podvrhy: 0 };
  const c = await novyKontext(b, sirka, "po", sc, stav);
  await c.addInitScript(() => {
    const povodne = Node.prototype.appendChild;
    Node.prototype.appendChild = function (n) {
      if (this && this.id === "lcd-doplnok" && n && n.classList && n.classList.contains("lcd-vyb")) { window.__lcdTestChyb = (window.__lcdTestChyb || 0) + 1; throw new Error("test: chyba v ponuke"); }
      return povodne.call(this, n);
    };
  });
  const p = await c.newPage();
  const chyby = [];
  p.on("pageerror", chybaStranky(chyby));
  try {
    await pripravKosik(p, sc);
    await p.waitForTimeout(3000);
    const r = await p.evaluate(() => ({ karta: !!document.getElementById("lcd-opc-kosik"), polozky: document.querySelectorAll("#lcd-opc-kosik .lcd-opc-kk__polozka").length,
      ponuky: document.querySelectorAll("#lcd-doplnok .lcd-vyb").length, vyhodene: window.__lcdTestChyb || 0 }));
    over(r.vyhodene >= 1, kontext + ": podvrhnutá chyba naozaj nastala (" + r.vyhodene + "×)");
    over(r.karta && r.polozky === 2 && r.ponuky === 0, kontext + ": karta košíka ostala s 2 položkami, bez ponuky " + JSON.stringify(r));
    over(!chyby.length, kontext + ": chyba sa nedostala von zo stránky " + chyby.join(" ; "));
  } catch (e) {
    over(false, kontext + ": " + String(e && e.message).split("\n")[0].slice(0, 200));
  }
  over(stav.objednavka === 0, kontext + ": žiadne odoslanie objednávky");
  await c.close();
}

const prehliadace = arg("prehliadace", "chromium,webkit,firefox").split(",");
const sirky = arg("sirky", "1366,390").split(",").map(Number);
const vyber = arg("scen") ? arg("scen").split(",") : null;
for (const nazov of prehliadace) {
  const b = await pw[nazov].launch();
  for (const sirka of sirky) {
    console.log(`== B) ${nazov} ${sirka}`);
    const pred = ok + zle, predZle = zle;
    for (const sc of SCEN) {
      if (vyber && !vyber.includes(sc.id)) continue;
      if (sc.porovnaj) await porovnanie(b, nazov, sirka, sc);
      else if (sc.chybaPonuky) await chybaPonuky(b, nazov, sirka, sc);
      else await behScenara(b, nazov, sirka, sc);
    }
    console.log(`   ${ok + zle - pred} kontrol, ${zle - predZle} ZLE`);
  }
  await b.close();
}
if (tmp) rmSync(tmp, { recursive: true, force: true });
if (infoCudzie) console.log(`info: ${infoCudzie}× chyba Shoptetu checkout-3g.js hidePISMethod (nie náš kód, je aj v živej verzii)`);
console.log(zle ? `VYSLEDOK ZLE ${zle} (OK ${ok})` : `VYSLEDOK OK (${ok} kontrol)`);
process.exit(zle ? 1 : 0);
