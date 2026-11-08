// Test ponuky „Doplňte svoj set“ pri Mercedes triede V (SK 646) v karte „Váš košík“ pokladne (assets/js/opc/vclassKarta.js,
// Michal 8. 11. 2026, plán kosik-vclass/plan.md). Dve časti:
//   A) bez prehliadača: rozbor riadku, ponuky, ceny a „ušetríte“, krížiky, rozpis a stráž produktu 646 nad ŽIVOU mapou
//      príplatkov 646 (GET stránky produktu, nič sa nemení) — všetky rozloženia M / L / XL, s autom aj bez, boxy, druhá vrstva;
//      ponuka setov (lcdKosikDoplnok.js pripravKontexty) riadok 646 vynechá bez sťahovania stránky produktu.
//   B) dočasný prehliadač Playwright na živom webe: skutočné konfigurácie triedy V v dočasnom košíku (POST addCartItem s
//      hodnotami ako konfigurátor), /objednavka/krok-2/ s lokálnym luxuryCar.js / luxuryCar.css / lcd-vclass.js (podvrh
//      assets/v/<sha>/), ponuky, ceny, „ušetríte“, „Pridať“ (výmena na presnú cenu a text riadku), × späť, zlyhaná výmena
//      (sieť, nesediaca cena) = košík bez zmeny s hláškou; košík s bežným setom 598, s kamiónom 640 a zmiešaný (646 + 598) =
//      rovnaké ponuky setu ako živá verzia a žiadna ponuka triedy V mimo riadku 646. Cookies „Odmietnuť“.
//      NIČ SA NEOBJEDNÁVA: Step2Validate (odoslanie objednávky) sa zruší a test zlyhá, keby odišiel; reklamné a analytické
//      služby sú zablokované; z POST na /action/ prejde len košík, Step1Validate (výber dopravy a platby, robí ho pokladňa
//      sama) a odmietnutie cookies, ostatné sa zrušia. Košík zanikne so zatvorením kontextu.
//
//   node tools/test-kosik-vclass.mjs --pw <file:///…/playwright/index.mjs> [--dist <priečinok s luxuryCar.js, luxuryCar.css,
//        lcd-vclass.js>] [--prehliadace chromium,webkit,firefox] [--sirky 1366,390] [--scen predok-xl,…] [--snimky <priečinok>]
//        [--len-a]
//   Bez --dist sa postaví lokálne ako CI (esbuild main.js a casti/vclass.js, CSS minify) do dočasného priečinka.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const HOST = "https://www.luxurycardesign.sk";
const PRODUKT = "/autokoberce-mercedes-v-class/";
const MODELY = { M: "V Class M (compact 4895 mm)", L: "V Class L (long 5140 mm)", XL: "V Class XL (Extra Long 5370 mm)" };

let ok = 0, zle = 0;
const over = (c, t) => { if (c) ok++; else { zle++; console.log("  ZLE  " + t); } };
const cisto = (t) => String(t == null ? "" : t).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

// ================================================================== A) bez prehliadača
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: HOST + "/objednavka/krok-2/" });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, DOMParser: dom.window.DOMParser, location: dom.window.location, localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage });
window.dataLayer = globalThis.dataLayer = [{ shoptet: { projectId: 562035, language: "sk" } }];
const D = await import("../assets/js/lcdKosikDoplnok.js");
const V = await import("../assets/js/opc/vclassKarta.js");
const VD = await import("../assets/js/components/konfigurator1v/vclass/data.js");
const { SELECTY, ROZ_PREDOK, ROZ_BEZ, rozSet, rozLen, rozRadRohoz, ROHOZ, ROHOZ_SAM, BEZ_DRUHEJ, BOXY } = VD;
const boxT = (v) => BOXY.find((b) => b.v === v).t;

const SPOL = {
  [SELECTY.rok]: "2021", [SELECTY.volant]: "Vľavo", [SELECTY.stred]: "Podlaha", [SELECTY.dvere]: "Dvoje, na oboch stranách",
  [SELECTY.sedadla]: "2 sedadlá v 2. rade a 3 sedadlá v 3. rade", [SELECTY.stolcek]: "Bez stolčeka", [SELECTY.zasuvky]: "Bez zásuviek",
  [SELECTY.farba]: "Diamond Line – Čierna, červené šitie", [SELECTY.farba2]: BEZ_DRUHEJ,
};
const ROZL = SELECTY.rozlozenie, ROH = SELECTY.rohoz, F2 = SELECTY.farba2;
const konf = (z) => { const o = Object.assign({}, SPOL, z); Object.keys(o).forEach((k) => { if (o[k] == null) delete o[k]; }); return o; };
const surZ = (o) => "Príplatky: " + Object.keys(o).sort((a, b) => a.localeCompare(b, "sk")).map((k) => k + " - " + o[k]).join(", ");
const auto = (v, rok = "2021") => ({ Brand: "Mercedes-Benz", Model: MODELY[v], Year: rok, model: "Mercedes-Benz " + MODELY[v] + " " + rok });

console.log("== A) čisté funkcie nad živou mapou 646");
const html646 = await (await fetch(HOST + PRODUKT, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
const MAPA = D.mapaZFormulara(new JSDOM(html646).window.document);
over(MAPA && MAPA.pid === "646" && V.platnaMapa(MAPA), "živá mapa produktu 646 má všetky príplatky");
// samostatné ceny (rozhodnutie 6) a ceny príplatkov zo Shoptetu (plán § 1)
const fp = (meno, text) => { const id = V.idParametra(MAPA, meno); const o = id && V.idHodnoty(MAPA, id, text); return o ? MAPA.params[id].o[o].fp : NaN; };
over(fp(ROZL, rozSet("M")) === 600 && fp(ROZL, rozSet("L")) === 700 && fp(ROZL, rozSet("XL")) === 800, "Shoptet: 2. a 3. rad k predným 600 / 700 / 800 €");
over(fp(ROH, ROHOZ[0]) === 250 && fp(ROH, ROHOZ_SAM) === 40 && fp(F2, "Lux Color 10") === 150, "Shoptet: rohož 250 €, samotná rohož +40 €, druhá vrstva 150 €");
over(JSON.stringify(VD.SAMOSTATNE.rad) === '{"M":750,"L":850,"XL":950}' && VD.SAMOSTATNE.rohoz === 340 && VD.SAMOSTATNE.predok === 390, "samostatné ceny 750 / 850 / 950, 340 a 390 €");

const st = (z) => V.rozborVclass(surZ(konf(z)), MAPA);
const pon = (s, o) => V.ponukyVclass(s, MAPA, o || {}).map((x) => x.kluc === "vrstva2" ? "vrstva2 +" + x.moznosti[0].rozdiel.s + " " + x.odporucana
  : x.kluc === "box" ? "box od +" + x.naj.s + " -" + (x.naj.samo - x.naj.s) : x.kluc + " +" + x.rozdiel.s + " -" + (x.samo - x.rozdiel.s));
const odo = (s) => V.odobratelne(s, MAPA).map((x) => x.cast + " " + x.rozdiel.s);
const eq = (a, b, t) => over(JSON.stringify(a) === JSON.stringify(b), t + ": " + JSON.stringify(a) + (JSON.stringify(a) === JSON.stringify(b) ? "" : " ≠ " + JSON.stringify(b)));

// len predné sedadlá: veľkosť z auta (rozhodnutie 2), bez auta 2. a 3. rad nie
for (const [v, c] of [["M", 600], ["L", 700], ["XL", 800]]) {
  eq(pon(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }), { velAuta: v }), ["rad +" + c + " -150", "rohoz +250 -90", "vrstva2 +150 10", "box od +99 -98"], "len predné, auto " + v);
}
eq(pon(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }), {}), ["rohoz +250 -90", "vrstva2 +150 10", "box od +99 -98"], "len predné bez auta: 2. a 3. rad sa neponúkne");
eq(pon(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }), { velAuta: "XL", maRohoz: true, maBox: true }), ["rad +800 -150", "vrstva2 +150 10"], "samostatná rohož a box v košíku: rohož ani box nie");
eq(odo(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })), [], "len predné: žiadny krížik (predné len cez Odobrať)");
// predné + 2. a 3. rad
for (const [v, c] of [["M", 600], ["L", 700], ["XL", 800]]) {
  const s = st({ [ROZL]: rozSet(v), [ROH]: ROHOZ[1] });
  eq(pon(s, { velAuta: "M" }), ["rohoz +250 -90", "vrstva2 +150 10", "box od +99 -98"], "predné + rad " + v + " (auto sa nepoužije)");
  eq(odo(s), ["rad -" + c], "predné + rad " + v + ": × pri 2. a 3. rade");
}
// predné + rohož
eq(pon(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[0] }), { velAuta: "L" }), ["rad +700 -150", "vrstva2 +150 10", "box od +99 -98"], "predné + rohož, auto L");
eq(odo(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[0] })), ["rohoz -250"], "predné + rohož: × pri rohoži");
// bez predných sedadiel (plán § 1 zriedkavý prípad)
for (const [v, rr, rk] of [["M", 450, 300], ["L", 550, 400], ["XL", 650, 500]]) {
  eq(pon(st({ [ROZL]: rozLen(v), [ROH]: ROHOZ[1] }), { velAuta: "M" }), ["predok +150 -240", "rohoz +100 -240", "box od +99 -98"], "len 2. a 3. rad " + v);
  eq(odo(st({ [ROZL]: rozLen(v), [ROH]: ROHOZ[1] })), [], "len 2. a 3. rad " + v + ": krížik nie (nič by neostalo)");
  eq(pon(st({ [ROZL]: rozRadRohoz(v), [ROH]: ROHOZ[0] })), ["predok +300 -90", "box od +99 -98"], "2. a 3. rad + rohož " + v);
  eq(odo(st({ [ROZL]: rozRadRohoz(v), [ROH]: ROHOZ[0] })), ["rad -" + (rk + 210), "rohoz -100"], "2. a 3. rad + rohož " + v + ": × rad aj rohož");
  eq(pon(st({ [ROZL]: ROZ_BEZ, [ROH]: ROHOZ_SAM }), { velAuta: v }), ["rad +" + (rk + 210) + " -240", "predok +210 -180", "box od +99 -98"], "len rohož, auto " + v);
}
eq(pon(st({ [ROZL]: ROZ_BEZ, [ROH]: ROHOZ_SAM }), {}), ["predok +210 -180", "box od +99 -98"], "len rohož bez auta");
eq(odo(st({ [ROZL]: ROZ_BEZ, [ROH]: ROHOZ_SAM })), [], "len rohož: krížik nie");
// celý set s druhou vrstvou a dvoma boxmi: nič na ponuku, krížiky pri všetkom okrem predných
{
  const s = st({ [ROZL]: rozSet("XL"), [ROH]: ROHOZ[0], [F2]: "Lux Color 12", [SELECTY.box2]: boxT("M"), [SELECTY.box3]: boxT("L"), [SELECTY.boxFarba]: "Čierna, červené šitie" });
  eq(pon(s, { velAuta: "XL" }), [], "celý set: žiadna ponuka (druhý box nie)");
  eq(odo(s), ["rad -800", "rohoz -250", "vrstva2 -150", "box1 -89", "box2 -109"], "celý set: × pri rade, rohoži, vrstve a každom boxe (zvyšný box za cenu 1 boxu)");
  const s1 = st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.box1]: boxT("M"), [SELECTY.boxFarba]: "Béžová" });
  eq(pon(s1, { velAuta: "XL" }), ["rad +800 -150", "rohoz +250 -90", "vrstva2 +150 10"], "jeden box: druhý box sa neponúkne (rozhodnutie 4)");
  eq(odo(s1), ["box -109"], "jeden box: × pri boxe");
}
// odporúčaná druhá vrstva podľa farby 1. vrstvy (ako konfigurátor), box vopred vo farbe kobercov
eq(V.ponukyVclass(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.farba]: "Diamond Line – Hnedá" }), MAPA, {}).find((x) => x.kluc === "vrstva2").odporucana, "11", "Hnedá -> Lux 11");
eq(V.ponukyVclass(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.farba]: "Stripe Line – Vínovo červená" }), MAPA, {}).find((x) => x.kluc === "vrstva2").odporucana, "13", "Vínovo červená -> Lux 13");
{
  const b = V.ponukyVclass(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.farba]: "Stripe Line – Hnedá káva" }), MAPA, {}).find((x) => x.kluc === "box");
  eq(b.farby.find((f) => f.id === b.predvolena).nm, "Hnedá káva", "box vopred vo farbe kobercov");
  eq(BOXY.map((x) => [x.v, b.cenaPre(1, x.v, null, b.predvolena).rozdiel.s, b.cenaPre(2, x.v, x.v, b.predvolena).rozdiel.s]), [["S", 99, 178], ["M", 109, 198], ["L", 129, 238], ["XL", 149, 278]], "ceny boxov 1 box / 2 boxy (plán: 2 boxy M +198 €)");
  eq(b.cenaPre(2, "M", "M", b.predvolena).samo - 198, 216, "2 boxy M ušetria 216 €");
}
// nekonzistentné / neznáme texty -> nič (fail-closed)
over(st({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ_SAM }) === null, "nekonzistentné rozloženie a rohož -> nič");
over(st({ [ROZL]: rozLen("XL"), [ROH]: ROHOZ[1], [F2]: "Lux Color 10" }) === null, "druhá vrstva bez predných -> nič");
over(V.rozborVclass(surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })).replace("Len predné sedadlá", "Len predne"), MAPA) === null, "neznámy text -> nič");
over(V.rozborVclass(surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })), Object.assign({}, MAPA, { pid: "598" })) === null, "mapa iného produktu ako 646 -> nič");
// veľkosť z auta
eq([V.velkostZAuta(auto("XL"), "2021"), V.velkostZAuta(auto("M"), "2021"), V.velkostZAuta(auto("L", "2019"), "2021"), V.velkostZAuta({ Brand: "BMW", Model: "X5", Year: "2021" }, "2021"), V.velkostZAuta(null, "2021")],
  ["XL", "M", null, null, null], "veľkosť len z Mercedes V Class s rovnakým rokom");
// stráž: len kód VCLASS + priceId 68434 na SK
eq([D.jeVclass({ sku: "VCLASS", priceId: "68434" }), D.jeVclass({ sku: "VCLASS", priceId: "68383" }), D.jeVclass({ sku: "DIAMOND", priceId: "68434" }), D.jeVclass({ sku: "", priceId: "", href: PRODUKT, nazov: "Autokoberce Mercedes V Class" })],
  [true, false, false, false], "stráž 646: kód a priceId, nie názov ani adresa");
window.dataLayer[0].shoptet.projectId = 581408;
eq(D.jeVclass({ sku: "VCLASS", priceId: "68434" }), false, "stráž 646: na CZ nie");
window.dataLayer[0].shoptet.projectId = 562035;
// rozpis položky (Michal 8. 11. 2026 večer, variant B „dva nadpisy“): nadpis „Vaše auto“ (Auto, volant, dvere, sedadlá, stolček, stred,
// zásuvky; rok len raz), potom nadpis „Objednávate“ a objednané časti zrozumiteľne („Autokoberce k predným sedadlám“, „Autokoberce do
// 2. a 3. radu“, „Druhá vrstva k predným sedadlám“, „Farba boxov“). Zbalené = oba nadpisy, Auto a objednané časti; údaje o aute po
// „Zobraziť viac“. Nadpis = li.lcd-rozpis__nadpis (v riadkyUl „#“), bez odrážky, bez krížika.
{
  const sAutom = (a, fn) => {
    ["Brand", "Model", "Year", "carType", "model"].forEach((k) => sessionStorage.removeItem(k));
    if (a) Object.keys(a).forEach((k) => sessionStorage.setItem(k, a[k]));
    try { return fn(); } finally { ["Brand", "Model", "Year", "carType", "model"].forEach((k) => sessionStorage.removeItem(k)); }
  };
  const rozpis = (z, a) => sAutom(a, () => V.rozpisVclass(document, { sku: "VCLASS", priceId: "68434", sur: surZ(konf(z)) }));
  const riadkyUl = (ul) => [...ul.children].map((li) => (li.hasAttribute("data-lcd-vc-hned") ? "+" : "-")
    + (li.classList.contains("lcd-rozpis__nadpis") ? "#" : (li.getAttribute("data-lcd-vc-cast") || "") + ":") + cisto(li.textContent));
  const AUTO_N = "+#Vaše auto", OBJ_N = "+#Objednávate";
  // presne košík zo snímky od Michala (8. 11. 2026): V Class L 2024, celý set s druhou vrstvou a dvoma boxmi
  const MICHAL = { [SELECTY.rok]: "2024", [SELECTY.sedadla]: "2 sedadlá v 2. rade a 2 sedadlá v 3. rade", [SELECTY.stolcek]: "So stolčekom",
    [ROZL]: rozSet("L"), [ROH]: ROHOZ[0], [F2]: "Lux Color 11", [SELECTY.box2]: boxT("S"), [SELECTY.box3]: boxT("M"), [SELECTY.boxFarba]: "Hnedá káva" };
  const AUTA = ["-:Volant: Vľavo", "-:Bočné posuvné dvere: Dvoje, na oboch stranách", "-:Sedadlá: 2 v 2. rade, 2 v 3. rade", "-:Stolček v 2. a 3. rade: Áno",
    "-:Medzi prednými sedadlami: Podlaha", "-:Elektrické zásuvky pod sedadlami: Nie"];
  const CASTI = (rad) => [OBJ_N, "+predok:Autokoberce k predným sedadlám", "+rad:" + rad, "+rohoz:Rohož do kufra", "+:Vzor a farba 1. vrstvy: Diamond Line – Čierna, červené šitie",
    "+vrstva2:Druhá vrstva k predným sedadlám: Lux Color 11", "+box1:Prvý box z dvoch: S 33 × 32 × 30 cm", "+box2:Druhý box z dvoch: M 40 × 32 × 30 cm", "+:Farba boxov: Hnedá káva"];
  const RAD = "Autokoberce do 2. a 3. radu";
  let ul = rozpis(MICHAL, auto("L", "2024"));
  eq(riadkyUl(ul), [AUTO_N, "+:Auto: Mercedes-Benz V Class L (long 5140 mm) 2024"].concat(AUTA, CASTI(RAD)), "rozpis triedy V s autom (snímka od Michala)");
  over(!riadkyUl(ul).some((r) => /Rok výroby/.test(r)), "rok výroby len raz (v riadku Auto)");
  {
    const n = [...ul.querySelectorAll(":scope > li.lcd-rozpis__nadpis")];
    over(n.length === 2 && n.every((x) => !x.querySelector(".lcd-rozpis__n, .lcd-rozpis__h, a, button") && !x.hasAttribute("data-lcd-vc-cast") && x.hasAttribute("data-lcd-vc-hned")),
      "nadpisy: 2 li.lcd-rozpis__nadpis, len text (nie odrážka s názvom a hodnotou, nie klikateľné), vidno aj zbalené");
  }
  over(V.oznacRiadky(ul) === 6 && [...ul.children].filter((li) => li.classList.contains("lcd-opc-dalsi")).every((li) => !li.hasAttribute("data-lcd-vc-hned"))
    && ![...ul.querySelectorAll(".lcd-rozpis__nadpis")].some((li) => li.classList.contains("lcd-opc-dalsi")), "zbalené: 6 údajov o aute po „Zobraziť viac“, nadpisy ostávajú");
  // krížiky pri častiach fungujú ako doteraz (riadok s data-lcd-vc-cast, text vľavo, × vpravo), pri nadpisoch nie
  {
    const st2 = V.rozborVclass(surZ(konf(MICHAL)), MAPA);
    const li = document.createElement("li");
    li.appendChild(ul);
    const n = st2 ? V.vlozKriziky(li, { riadok: { itemId: "a1", sku: "VCLASS" }, mapa: MAPA, st: st2, odobrat: V.odobratelne(st2, MAPA) }, { R: D.rolePonuky(), forma: null }) : 0;
    eq([n, [...ul.querySelectorAll(".lcd-dop-x")].map((b) => b.getAttribute("data-lcd-dop-odober"))], [5, ["vclass-rad", "vclass-rohoz", "vclass-vrstva2", "vclass-box1", "vclass-box2"]], "krížiky pri 2. a 3. rade, rohoži, 2. vrstve a oboch boxoch");
    over(cisto(ul.querySelector('[data-lcd-vc-cast="rad"] .lcd-dop-text').textContent) === RAD, "riadok „Autokoberce do 2. a 3. radu“ s krížikom bez „: L“");
    over(cisto(ul.querySelector('[data-lcd-vc-cast="vrstva2"] .lcd-dop-text').textContent) === "Druhá vrstva k predným sedadlám: Lux Color 11", "druhá vrstva s krížikom");
    over(!ul.querySelector(".lcd-rozpis__nadpis .lcd-dop-x, .lcd-rozpis__nadpis.lcd-dop-riadok"), "nadpisy bez krížika");
  }
  // bez auta v košíku: rok výroby ako prvý údaj o aute (vidno aj zbalené), veľkosť pri 2. a 3. rade
  ul = rozpis(MICHAL, null);
  eq(riadkyUl(ul), [AUTO_N, "+:Rok výroby: 2024"].concat(AUTA, CASTI(RAD + " (veľkosť L)")), "rozpis triedy V bez auta");
  // auto inej veľkosti než 2. a 3. rad (rovnaký rok): Auto áno, veľkosť radu vypísaná
  eq(riadkyUl(rozpis(MICHAL, auto("XL", "2024"))).slice(0, 11), [AUTO_N, "+:Auto: Mercedes-Benz V Class XL (Extra Long 5370 mm) 2024"].concat(AUTA, [OBJ_N, "+predok:Autokoberce k predným sedadlám", "+rad:" + RAD + " (veľkosť L)"]), "auto XL, rad L: veľkosť radu vypísaná");
  // auto iného roku: nepatrí k riadku -> bez Auto, rok z riadku
  eq(riadkyUl(rozpis(MICHAL, auto("L", "2019"))).slice(0, 2), [AUTO_N, "+:Rok výroby: 2024"], "auto iného roku: bez Auto, rok z riadku");
  // ostatné hodnoty: bez stolčeka, so zásuvkami, opierka alebo chladnička, jedny dvere, volant vpravo, len predné sedadlá, jeden box
  ul = rozpis({ [SELECTY.volant]: "Vpravo", [SELECTY.stred]: "Lakťová opierka alebo chladnička", [SELECTY.dvere]: "Jedny, vpravo", [SELECTY.zasuvky]: "So zásuvkami",
    [SELECTY.sedadla]: "3 sedadlá v 2. rade a 3 sedadlá v 3. rade", [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.box1]: boxT("M"), [SELECTY.boxFarba]: "Béžová", "Iný príplatok": "x" }, auto("XL"));
  eq(riadkyUl(ul), [AUTO_N, "+:Auto: Mercedes-Benz V Class XL (Extra Long 5370 mm) 2021", "-:Volant: Vpravo", "-:Bočné posuvné dvere: Jedny, vpravo", "-:Sedadlá: 3 v 2. rade, 3 v 3. rade",
    "-:Stolček v 2. a 3. rade: Nie", "-:Medzi prednými sedadlami: Lakťová opierka alebo chladnička", "-:Elektrické zásuvky pod sedadlami: Áno",
    OBJ_N, "+predok:Autokoberce k predným sedadlám", "+:Vzor a farba 1. vrstvy: Diamond Line – Čierna, červené šitie", "+:Bez druhej vrstvy", "+box:Box do kufra: M 40 × 32 × 30 cm",
    "+:Farba boxov: Béžová", "-:Iný príplatok: x"], "rozpis triedy V: ostatné hodnoty, neznámy príplatok na konci");
  // bez predných sedadiel: „Bez druhej vrstvy“ až po „Zobraziť viac“ ako doteraz
  eq(riadkyUl(rozpis({ [ROZL]: rozRadRohoz("M"), [ROH]: ROHOZ[0] }, auto("M"))).slice(8), [OBJ_N, "+rad:" + RAD, "+rohoz:Rohož do kufra", "+:Vzor a farba 1. vrstvy: Diamond Line – Čierna, červené šitie", "-:Bez druhej vrstvy"], "2. a 3. rad s rohožou, auto M");
  // bez roku a bez auta: prvý údaj o aute vidno aj zbalené (nadpis „Vaše auto“ nie je prázdny); bez údajov o aute nadpis nie je
  eq(riadkyUl(rozpis({ [SELECTY.rok]: null, [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, null)).slice(0, 3), [AUTO_N, "+:Volant: Vľavo", "-:Bočné posuvné dvere: Dvoje, na oboch stranách"], "bez roku: volant vidno hneď");
  eq(riadkyUl(rozpis({ [SELECTY.rok]: null, [SELECTY.volant]: null, [SELECTY.stred]: null, [SELECTY.dvere]: null, [SELECTY.sedadla]: null, [SELECTY.stolcek]: null, [SELECTY.zasuvky]: null,
    [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, null)).slice(0, 2), [OBJ_N, "+predok:Autokoberce k predným sedadlám"], "bez údajov o aute: len „Objednávate“");
  // neznáma hodnota príplatku o aute: ukáže sa tak, ako je
  eq(V.riadkyVclass(surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.stolcek]: "Neviem", [SELECTY.sedadla]: "iné" })), null).filter((r) => /Stolček|Sedadlá/.test(r.n)).map((r) => r.n + ": " + r.h),
    ["Sedadlá: iné", "Stolček v 2. a 3. rade: Neviem"], "neznámu hodnotu nemeniť");
  over(V.rozpisVclass(document, { sku: "DIAMOND", priceId: "68434", sur: surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })) }) === null, "rozpis iného produktu -> null (bežný rozpis)");
  over(V.riadkyVclass(surZ(konf({ [ROZL]: "Neznáme rozloženie", [ROH]: ROHOZ[1] })), null) === null, "neznáme rozloženie -> null (bežný rozpis)");
}
// ponuka setov vynechá 646 a nesťahuje stránku produktu
{
  const R = D.rolePonuky();
  const stary = globalThis.fetch;
  const volania = [];
  globalThis.fetch = window.fetch = async (u) => { volania.push(String(u)); throw new Error("sieť v teste"); };
  const v = await D.pripravKontexty([{ itemId: "a1", priceId: "68434", sku: "VCLASS", href: PRODUKT, maPriplatky: true, sur: surZ(konf({ [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] })), q: 1, text: "Autokoberce Mercedes V Class" }], R, {});
  globalThis.fetch = window.fetch = stary;
  eq([v.kandidati, volania.length], [0, 0], "ponuka setov: riadok 646 vynechaný, stránka produktu sa nesťahuje");
}
console.log(`A) ${ok} OK, ${zle} ZLE`);
if (arg("len-a") !== undefined || process.argv.includes("--len-a")) process.exit(zle ? 1 : 0);

// ================================================================== B) dočasný prehliadač na živom webe
const pwUrl = arg("pw");
if (!pwUrl) { console.error("chýba --pw"); process.exit(2); }
const pw = await import(pathToFileURL(pwUrl.replace(/^file:\/+/, "")).href);
let dist = arg("dist"), tmp = null;
if (!dist) {
  tmp = dist = mkdtempSync(join(tmpdir(), "lcd-vclass-kosik-"));
  const eb = (vstup, vystup, extra) => spawnSync(process.execPath, ["node_modules/esbuild/bin/esbuild", vstup, "--outfile=" + join(dist, vystup)].concat(extra), { stdio: "inherit" }).status;
  const js = ["--bundle", "--format=iife", "--minify", "--drop:console", "--legal-comments=none", "--log-level=error"];
  if (eb("assets/js/main.js", "luxuryCar.js", js.concat("--loader:.jsx=jsx")) || eb("assets/js/casti/vclass.js", "lcd-vclass.js", js)
    || eb("assets/css/luxuryCar.css", "luxuryCar.css", ["--minify", "--target=chrome80,firefox78,safari13", "--log-level=error"])) process.exit(2);
}
const SUBORY = { js: readFileSync(join(dist, "luxuryCar.js")), css: readFileSync(join(dist, "luxuryCar.css")), vclass: existsSync(join(dist, "lcd-vclass.js")) ? readFileSync(join(dist, "lcd-vclass.js")) : null };
const snimky = arg("snimky");
if (snimky) mkdirSync(snimky, { recursive: true });
const BLOK = /googletagmanager|google-analytics|doubleclick|facebook|connect\.facebook|tiktok|hotjar|clarity\.ms|ecomail|smartsupp|bing\.com|sklik|seznam|luxia|heureka|pinterest|googleadservices|metricool/i;
const CHYBA_VYMENY = "Doplnok sa nepodarilo pridať. Váš košík ostal bez zmeny. Skúste to, prosím, znova.";
const ZAKAZANE = /s DPH|bez DPH|vrátane DPH|na milimeter|vyrábame|\bvám\b|\bváš\b|\bvaše\b|ekokož/;

// ---- scenáre (ceny = súčet príplatkov 646 zo Shoptetu; „ponuky“ = poradie riadkov, cena, „ušetríte“)
const P_ = (k, c, u) => [k, c, u || null];
const SCEN = [
  { id: "predok-xl", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, auto: auto("XL"), cena: 300, snimky: true,
    ponuky: [P_("rad", "+800 €", "ušetríte 150 €"), P_("rohoz", "+250 €", "ušetríte 90 €"), P_("vrstva2", "+150 €"), P_("box", "od +99 €", "ušetríte 98 €")], kriziky: [],
    akcie: [
      { klik: "rad", cena: 1100, zmena: { [ROZL]: rozSet("XL") }, hlaska: "✓ 2. a 3. rad je pridaný k Vášmu setu.", ponuky: ["rohoz", "vrstva2", "box"], kriziky: ["rad"], boxNahlad: true },
      { x: "rad", cena: 300, zmena: { [ROZL]: ROZ_PREDOK }, hlaska: "✓ 2. a 3. rad je odstránený zo setu.", ponuky: ["rad", "rohoz", "vrstva2", "box"], kriziky: [] },
    ] },
  { id: "predok-m", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1], [SELECTY.rok]: "2019" }, auto: auto("M", "2019"), cena: 300,
    ponuky: [P_("rad", "+600 €", "ušetríte 150 €"), P_("rohoz", "+250 €", "ušetríte 90 €"), P_("vrstva2", "+150 €"), P_("box", "od +99 €", "ušetríte 98 €")], kriziky: [] },
  { id: "predok-l-bez-auta", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, auto: null, cena: 300,
    ponuky: [P_("rohoz", "+250 €", "ušetríte 90 €"), P_("vrstva2", "+150 €"), P_("box", "od +99 €", "ušetríte 98 €")], kriziky: [] },
  { id: "rady-m", volby: { [ROZL]: rozLen("M"), [ROH]: ROHOZ[1] }, auto: null, cena: 750,
    ponuky: [P_("predok", "+150 €", "ušetríte 240 €"), P_("rohoz", "+100 €", "ušetríte 240 €"), P_("box", "od +99 €", "ušetríte 98 €")], kriziky: [],
    akcie: [{ klik: "rohoz", cena: 850, zmena: { [ROZL]: rozRadRohoz("M"), [ROH]: ROHOZ[0] }, hlaska: "✓ Rohož do kufra je pridaná k Vášmu setu.", ponuky: ["predok", "box"], kriziky: ["rad", "rohoz"] }] },
  { id: "rohoz-l", volby: { [ROZL]: ROZ_BEZ, [ROH]: ROHOZ_SAM }, auto: auto("L"), cena: 340,
    ponuky: [P_("rad", "+610 €", "ušetríte 240 €"), P_("predok", "+210 €", "ušetríte 180 €"), P_("box", "od +99 €", "ušetríte 98 €")], kriziky: [],
    akcie: [{ klik: "predok", cena: 550, zmena: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[0] }, hlaska: "✓ Predné sedadlá sú pridané k Vášmu setu.", ponuky: ["rad", "vrstva2", "box"], kriziky: ["rohoz"] }] },
  { id: "rady-rohoz-xl", volby: { [ROZL]: rozRadRohoz("XL"), [ROH]: ROHOZ[0] }, auto: auto("XL"), cena: 1050,
    ponuky: [P_("predok", "+300 €", "ušetríte 90 €"), P_("box", "od +99 €", "ušetríte 98 €")], kriziky: ["rad", "rohoz"],
    akcie: [{ x: "rohoz", cena: 950, zmena: { [ROZL]: rozLen("XL"), [ROH]: ROHOZ[1] }, hlaska: "✓ Rohož do kufra je odstránená zo setu.", ponuky: ["predok", "rohoz", "box"], kriziky: [] }] },
  { id: "predok-rohoz", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[0] }, auto: auto("XL"), cena: 550,
    ponuky: [P_("rad", "+800 €", "ušetríte 150 €"), P_("vrstva2", "+150 €"), P_("box", "od +99 €", "ušetríte 98 €")], kriziky: ["rohoz"],
    akcie: [{ klik: "vrstva2", lux: "10", cena: 700, zmena: { [F2]: "Lux Color 10" }, hlaska: "✓ Druhá vrstva Lux Color 10 je pridaná k Vášmu setu.", ponuky: ["rad", "box"], kriziky: ["rohoz", "vrstva2"] }] },
  { id: "predok-rady-l", volby: { [ROZL]: rozSet("L"), [ROH]: ROHOZ[1] }, auto: auto("L"), cena: 1000,
    ponuky: [P_("rohoz", "+250 €", "ušetríte 90 €"), P_("vrstva2", "+150 €"), P_("box", "od +99 €", "ušetríte 98 €")], kriziky: ["rad"],
    akcie: [{ klik: "box", boxy: ["M", "L"], cena: 1218, zmena: { [SELECTY.box2]: boxT("M"), [SELECTY.box3]: boxT("L"), [SELECTY.boxFarba]: "Čierna, červené šitie" }, hlaska: "✓ Boxy sú pridané k Vášmu setu.", ponuky: ["rohoz", "vrstva2"], kriziky: ["rad", "box1", "box2"] }] },
  { id: "cely-set", volby: { [ROZL]: rozSet("XL"), [ROH]: ROHOZ[0], [F2]: "Lux Color 12", [SELECTY.box2]: boxT("M"), [SELECTY.box3]: boxT("L"), [SELECTY.boxFarba]: "Čierna, červené šitie" }, auto: auto("XL"), cena: 1718,
    ponuky: [], kriziky: ["rad", "rohoz", "vrstva2", "box1", "box2"],
    akcie: [{ x: "box1", cena: 1629, zmena: { [SELECTY.box2]: null, [SELECTY.box3]: null, [SELECTY.box1]: boxT("L") }, hlaska: "✓ Box M je odstránený zo setu.", ponuky: [], kriziky: ["rad", "rohoz", "vrstva2", "box"] }] },
  // košík zo snímky od Michala (8. 11. 2026): rozpis auto -> objednané časti, náhľad zbalený aj rozbalený
  { id: "michal-l-2024", volby: { [SELECTY.rok]: "2024", [SELECTY.sedadla]: "2 sedadlá v 2. rade a 2 sedadlá v 3. rade", [SELECTY.stolcek]: "So stolčekom",
    [ROZL]: rozSet("L"), [ROH]: ROHOZ[0], [F2]: "Lux Color 11", [SELECTY.box2]: boxT("S"), [SELECTY.box3]: boxT("M"), [SELECTY.boxFarba]: "Hnedá káva" },
    auto: auto("L", "2024"), cena: 1588, snimky: true, ponuky: [], kriziky: ["rad", "rohoz", "vrstva2", "box1", "box2"] },
  { id: "chyba-siet", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, auto: auto("XL"), cena: 300,
    ponuky: [P_("rad", "+800 €", "ušetríte 150 €"), P_("rohoz", "+250 €"), P_("vrstva2", "+150 €"), P_("box", "od +99 €")], kriziky: [],
    akcie: [{ klik: "rad", zrusAdd: true, chyba: CHYBA_VYMENY, cena: 300, zmena: {} }] },
  { id: "chyba-cena", volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, auto: auto("XL"), cena: 300, podvrhCeny: 790,
    ponuky: [P_("rad", "+790 €", "ušetríte 160 €"), P_("rohoz", "+250 €"), P_("vrstva2", "+150 €"), P_("box", "od +99 €")], kriziky: [],
    akcie: [{ klik: "rad", chyba: CHYBA_VYMENY, cena: 300, zmena: {} }] },
  // stráž: bežné produkty majú rovnakú ponuku ako živá verzia a žiadnu ponuku triedy V
  { id: "set-598", porovnaj: true, kosik: ["598"], autoOsobne: true },
  { id: "kamion-640", porovnaj: true, kosik: ["640"] },
  { id: "zmes-646-598", porovnaj: true, kosik: ["646", "598"], volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, autoOsobne: true },
  // poistka: chyba pri kreslení ponuky nesmie odstrániť kartu košíka
  { id: "chyba-ponuky", chybaPonuky: true, kosik: ["646", "598"], volby: { [ROZL]: ROZ_PREDOK, [ROH]: ROHOZ[1] }, autoOsobne: true },
];

// ---- v stránke: pridanie do košíka a obsah košíka (len POST addCartItem, ako tlačidlo „do košíka“)
const V_STRANKE = {
  async pridaj646(a) {
    const cisty = (s) => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
    const bez = (t) => cisty(t).replace(/\s\+\s?€?\s?-?\d[\d\s.,]*\s?(€|Kč)?$/, "").trim();
    const d = new DOMParser().parseFromString(await (await fetch(a.cesta, { credentials: "same-origin" })).text(), "text/html");
    const f = d.querySelector("#product-detail-form");
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
    const cisty = (s) => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
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
  const t = cisto(sur).replace(/^Príplatky:\s*/, "");
  const mena = Object.values(SELECTY);
  const najdene = [];
  for (const m of mena) { const i = t.indexOf(m + " - "); if (i === 0 || (i > 1 && t.slice(i - 2, i) === ", ")) najdene.push([i, m]); }
  najdene.sort((a, b) => a[0] - b[0]);
  const o = {};
  najdene.forEach(([i, m], j) => { o[m] = t.slice(i + m.length + 3, j + 1 < najdene.length ? najdene[j + 1][0] - 2 : t.length); });
  return o;
}
/** Objekt s kľúčmi v abecednom poradí (porovnanie príplatkov nezávisle od poradia v texte Shoptetu). */
const zorad = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => a[0].localeCompare(b[0])));
/**
 * Chyba stránky zo Shoptetu, nie z nášho kódu: checkout-3g.js hidePISMethod (skrytie „Rýchla platba cez banku“, keď zlyhá
 * zoznam bánk) padá náhodne aj so ŽIVOU verziou bez zmeny (overené 8. 11. 2026 vo Firefoxe aj WebKite) -> len info.
 */
const cudziaChyba = (e) => /hidePISMethod/.test(String(e && e.stack)) && /cdn\.myshoptet\.com\/prj\//.test(String(e && e.stack));
let infoCudzie = 0;
const chybaStranky = (chyby) => (e) => { if (cudziaChyba(e)) { infoCudzie++; return; } chyby.push(String(e.message).slice(0, 160)); };
const cenaCislo = (t) => Number(cisto(t).replace(/[^\d,]/g, "").replace(",", "."));

/** Stav karty: položky (rozpis, krížiky, cena), bloky ponuky, hláška, stav. */
async function snap(p) {
  return p.evaluate(() => {
    const c = (t) => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
    return {
      polozky: [...document.querySelectorAll(".lcd-opc-kk__polozka")].map((li) => ({
        item: li.getAttribute("data-item"), cena: c((li.querySelector(".lcd-opc-kk__cena") || {}).textContent),
        rozpis: [...li.querySelectorAll("ul.lcd-rozpis > li")].map((r) => (r.classList.contains("lcd-opc-dalsi") ? "~" : "") + c(r.textContent).replace(/×$/, "").trim()),
        x: [...li.querySelectorAll(".lcd-dop-x")].map((b) => b.getAttribute("data-lcd-dop-odober")),
        xAria: [...li.querySelectorAll(".lcd-dop-x")].map((b) => b.getAttribute("aria-label")),
        vc: li.querySelector("ul.lcd-rozpis[data-lcd-vclass]") ? 1 : 0,
        zob: !!li.querySelector(".lcd-opc-zob"),
        nadpisy: [...li.querySelectorAll("ul.lcd-rozpis > li.lcd-rozpis__nadpis")].map((h) => {
          const cs = getComputedStyle(h), pred = getComputedStyle(h, "::before");
          return { t: c(h.textContent), vidno: h.getClientRects().length > 0 && cs.visibility !== "hidden", px: parseFloat(cs.fontSize), velke: cs.textTransform === "uppercase",
            odrazka: !(pred.content === "none" || pred.content === "normal" || pred.display === "none"), klik: !!h.querySelector("a, button, input") || cs.cursor === "pointer" };
        }),
      })),
      // rekapitulácia vpravo / navrchu (cart.js, ten istý rozpis): nadpisy triedy V
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

/** Počká, kým sa karta (položky aj ponuky) 3 s nemení. */
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
  const c = await b.newContext({ viewport: { width: sirka, height: sirka < 500 ? 844 : 900 }, locale: "sk-SK", ...(sirka < 500 && b.browserType().name() !== "firefox" ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
  await c.route("**/*", async (r) => {
    const q = r.request(), u = q.url(), m = q.method();
    if (BLOK.test(u)) return r.abort();
    if (/\/action\/orderingProcess\/Step2Validate/i.test(u)) { stav.objednavka++; return r.abort(); }
    if (/step2CustomerAjax/i.test(u)) return r.abort(); // údaje zákazníka sa nevypĺňajú, nič z formulára neodíde
    if (m === "POST" && /\/action\//.test(u) && !/\/action\/Cart\/(addCartItem|deleteCartItem|setCartItemAmount)\/|\/action\/orderingProcess\/Step1Validate\/|\/action\/CustomerCookieConsent\//i.test(u)) return r.abort();
    if (m === "POST" && /\/action\/Cart\/addCartItem\//.test(u) && stav.zrusAdd) { stav.zrusene++; return r.abort(); }
    if (rezim === "po") {
      if (/\/assets\/v\/[^/]+\/js\/luxuryCar\.js/.test(u)) return r.fulfill({ status: 200, contentType: "application/javascript", body: SUBORY.js });
      if (/\/assets\/v\/[^/]+\/css\/luxuryCar\.css/.test(u)) return r.fulfill({ status: 200, contentType: "text/css", body: SUBORY.css });
      if (SUBORY.vclass && /\/assets\/v\/[^/]+\/js\/lcd-vclass\.js/.test(u)) return r.fulfill({ status: 200, contentType: "application/javascript", body: SUBORY.vclass });
    }
    // zlyhaná kontrola ceny: stránka produktu, ktorú čítame (fetch), má o 10 € nižší príplatok XL ako Shoptet
    if (sc.podvrhCeny && u === HOST + PRODUKT && q.resourceType() === "fetch" && stav.podvrh) {
      const resp = await r.fetch();
      const t = (await resp.text()).replace(/(<option value="\d+" data-surcharge-final-price=")800(" data-surcharge-additional-price="[^"]*">Predné sedadlá, 2\. a 3\. rad \(XL\))/,
        (m, a, b2) => a + sc.podvrhCeny + b2);
      return r.fulfill({ response: resp, body: t });
    }
    return r.continue();
  });
  return c;
}

const PRODUKTY = { "598": "/luxusne-autokoberce-dragonskin-diamond-line/", "640": "/luxusne-autokoberce-kamiony/" };
const AUTO_OSOBNE = { Brand: "BMW", Model: "X5", Year: "2021", carType: "SUV", model: "BMW X5 2021 SUV" };

async function pripravKosik(p, sc, rezim) {
  await p.goto(HOST + "/kosik/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await p.waitForTimeout(1200);
  const odm = await p.$('button:has-text("Odmietnuť")');
  if (odm) await odm.click().catch(() => {});
  const kosik = sc.kosik || ["646"];
  for (const k of kosik) {
    const v = k === "646" ? await p.evaluate(V_STRANKE.pridaj646, { cesta: PRODUKT, volby: konf(sc.volby) })
      : await p.evaluate(V_STRANKE.pridajIny, { cesta: PRODUKTY[k], nastav: k === "598" ? { 88: "598" } : null, vynechaj: k === "598" ? ["91", "94", "97", "104"] : [] });
    if (!v || v.code !== 200) throw new Error("pridanie " + k + ": " + JSON.stringify(v));
  }
  const auto = sc.autoOsobne ? AUTO_OSOBNE : sc.auto;
  await p.evaluate((a) => { ["Brand", "Model", "Year", "carType", "model"].forEach((k) => sessionStorage.removeItem(k)); if (a) Object.keys(a).forEach((k) => sessionStorage.setItem(k, a[k])); }, auto || null);
  await p.goto(HOST + "/objednavka/krok-2/", { waitUntil: "domcontentloaded", timeout: 45000 });
  if (!/objednavka\/krok-2/.test(p.url())) {
    await p.goto(HOST + "/kosik/", { waitUntil: "domcontentloaded", timeout: 45000 });
    await p.waitForURL(/objednavka\/krok-2/, { timeout: 40000 });
  }
  await p.waitForSelector(".lcd-opc-kk__polozka", { timeout: 45000 });
  const odm2 = await p.$('button:has-text("Odmietnuť")');
  if (odm2) await odm2.click().catch(() => {});
  return pockajStabilne(p);
}

/** Kontrola ponuky, krížikov a ceny položky 646. */
function overKartu(s, sc, kontext, polozka646, ocakPonuky, ocakKriziky, cena) {
  const li = s.polozky.find((x) => x.item === polozka646);
  over(!!li && li.vc === 1, kontext + ": položka 646 má rozpis triedy V");
  if (!li) return;
  over(cenaCislo(li.cena) === cena, kontext + ": cena položky " + li.cena + " = " + cena + " €");
  eq(li.x, ocakKriziky.map((k) => "vclass-" + k), kontext + ": krížiky");
  over(!li.rozpis.some((r) => /^~?Autokoberce k predným sedadlám$/.test(r)) || !li.x.includes("vclass-predok"), kontext + ": predné sedadlá bez krížika");
  const bloky = s.bloky.filter((b) => /lcd-vyb--vclass/.test(b.trieda));
  if (!ocakPonuky.length) { over(!bloky.length, kontext + ": bez ponuky (všetko v sete)"); return; }
  over(bloky.length === 1 && bloky[0].item === polozka646, kontext + ": jeden blok triedy V pri položke 646");
  const b = bloky[0];
  if (!b) return;
  over(b.nadpis === "Doplňte svoj set", kontext + ": nadpis");
  over(!b.kset, kontext + ": jediná karta ponuky bez „K setu“ (" + b.kset + ")");
  eq(b.riadky.map((r) => r.d), ocakPonuky.map((x) => Array.isArray(x) ? x[0] : x), kontext + ": poradie ponúk");
  ocakPonuky.forEach((x) => {
    if (!Array.isArray(x)) return;
    const r = b.riadky.find((y) => y.d === x[0]);
    if (!r) return;
    over(r.cena.indexOf(x[1]) === 0, kontext + ": " + x[0] + " cena " + r.cena + " začína " + x[1]);
    if (x[2]) over(r.cena.includes(x[2]), kontext + ": " + x[0] + " „" + x[2] + "“ v " + r.cena);
    if (x[0] === "vrstva2") over(/vpredu, zachytí vodu aj blato/.test(r.cena), kontext + ": druhá vrstva vpredu");
    over(r.tl === "Pridať", kontext + ": " + x[0] + " tlačidlo Pridať");
    over(/\/assets\/img\/1v\/obsah\/[^/]*(v-class)[^/]*\.(webp|jpg)/.test(r.foto), kontext + ": " + x[0] + " fotka triedy V " + r.foto.split("/").pop());
  });
  const rad = b.riadky.find((r) => r.d === "rad");
  if (rad) over(rad.naj && /Najvýhodnejšie/.test(rad.meno) && /Autokoberce pre 2\. a 3\. rad/.test(rad.meno), kontext + ": 2. a 3. rad so štítkom Najvýhodnejšie");
  over(!ZAKAZANE.test(b.text), kontext + ": bez zakázaných slov (" + (b.text.match(ZAKAZANE) || [""])[0] + ")");
}

/**
 * Poradie rozpisu 646 (Michal 8. 11. 2026 večer, variant B „dva nadpisy“): nadpis „Vaše auto“, Auto alebo Rok výroby, údaje
 * o aute po „Zobraziť viac“, nadpis „Objednávate“ a objednané časti; rok len raz; „Autokoberce do 2. a 3. radu“ bez „: L“.
 * Nadpisy: malé (≥ 12 px) veľké písmená, bez odrážky, nie klikateľné, vidno aj zbalené.
 */
const AUTO_RIADKY = /^(Auto|Rok výroby|Volant|Bočné posuvné dvere|Sedadlá|Stolček v 2\. a 3\. rade|Medzi prednými sedadlami|Elektrické zásuvky pod sedadlami):/;
function overPoradie(s, sc, kontext, polozka646) {
  const li = s.polozky.find((x) => x.item === polozka646);
  if (!li) return;
  const r = li.rozpis.map((x) => x.replace(/^~/, ""));
  const rok = (sc.volby && sc.volby[SELECTY.rok]) || SPOL[SELECTY.rok];
  over(r[0] === "Vaše auto" && r[8] === "Objednávate", kontext + ": nadpisy „" + r[0] + "“ a „" + r[8] + "“");
  over(r[1] === (sc.auto ? "Auto: Mercedes-Benz " + sc.auto.Model + " " + rok : "Rok výroby: " + rok), kontext + ": prvý riadok o aute „" + r[1] + "“");
  over(r.filter((x) => x.indexOf(rok) >= 0).length === 1, kontext + ": rok len raz");
  const posledneAuto = r.map((x) => AUTO_RIADKY.test(x)).lastIndexOf(true);
  over(posledneAuto === 7 && r.slice(1, 8).every((x) => AUTO_RIADKY.test(x)), kontext + ": 7 riadkov o aute pod „Vaše auto“, potom časti " + JSON.stringify(r.slice(0, 10)));
  over(li.rozpis.slice(2, 8).every((x) => x[0] === "~") && [0, 1, 8].every((i) => li.rozpis[i][0] !== "~")
    && li.rozpis.slice(9).every((x) => x[0] !== "~" || /^~Bez druhej vrstvy$/.test(x)), kontext + ": zbalené = oba nadpisy, prvý riadok o aute a objednané časti");
  over(!r.some((x) => /^2\. a 3\. rad/.test(x)), kontext + ": žiadne „2. a 3. rad: L“, rad ako „Autokoberce do 2. a 3. radu“");
  over(!ZAKAZANE.test(r.join(" | ")), kontext + ": rozpis bez zakázaných slov (" + (r.join(" | ").match(ZAKAZANE) || [""])[0] + ")");
  eq(li.nadpisy.map((h) => h.t), ["Vaše auto", "Objednávate"], kontext + ": nadpisy v karte");
  over(li.nadpisy.every((h) => h.vidno && h.px >= 12 && h.velke && !h.odrazka && !h.klik), kontext + ": nadpisy zbalené viditeľné, ≥ 12 px, veľké písmená, bez odrážky, nie klikateľné " + JSON.stringify(li.nadpisy));
  over(s.suhrn.length >= 1 && s.suhrn.every((n) => JSON.stringify(n) === '["Vaše auto","Objednávate"]'), kontext + ": rekapitulácia (cart.js) s tými istými nadpismi " + JSON.stringify(s.suhrn));
}

async function behScenara(b, nazov, sirka, sc) {
  const kontext = `${nazov} ${sirka} ${sc.id}`;
  const stav = { objednavka: 0, zrusAdd: false, zrusene: 0, podvrh: true };
  const c = await novyKontext(b, sirka, "po", sc, stav);
  const p = await c.newPage();
  const chyby = [], zlyhane = [];
  p.on("pageerror", chybaStranky(chyby));
  p.on("requestfailed", (q) => zlyhane.push(q.method() + " " + q.url().slice(0, 120)));
  try {
    let s = await pripravKosik(p, sc, "po");
    let k = await p.evaluate(V_STRANKE.obsah);
    over(k.length === 1 && k[0].sku === "VCLASS" && k[0].priceId === "68434", kontext + ": v košíku je jedna položka 646");
    const id = k[0] && k[0].itemId;
    overKartu(s, sc, kontext, id, sc.ponuky, sc.kriziky, sc.cena);
    overPoradie(s, sc, kontext, id);
    over(!(await p.$('.lcd-opc-kk__polozka [data-lcd-vc-cast="predok"] .lcd-dop-x')), kontext + ": predné sedadlá nemajú krížik");
    over(!!(await p.$(`.lcd-opc-kk__polozka[data-item="${id}"] .lcd-opc-kk__odobrat`)), kontext + ": položka má Odobrať");
    const sn = snimky && sc.snimky;
    if (sn) {
      await p.locator("#lcd-opc-kosik").screenshot({ path: join(snimky, `${nazov}-${sirka}-${sc.id}-zbalene.png`) });
      // rozbalené („Zobraziť viac“): údaje o aute pod riadkom Auto, nad objednanými časťami
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
          over(cisto(await pr.textContent()) === "Pridať k setu · +150 €", ka + ": " + cisto(await pr.textContent()));
          await pr.click();
        }
        if (a.klik === "box") {
          over(/ako Vaše koberce/.test(cisto(await p.locator(".lcd-vyb--vclass .lcd-vyb__panel:not([hidden]) .lcd-vyb__zvolena").first().textContent())), ka + ": farba boxu vopred ako koberce");
          await p.locator('.lcd-vyb--vclass input[data-lcd-vyb-pocet="2"]').check({ force: true });
          await p.locator(`.lcd-vyb--vclass input[data-lcd-vyb-velkost="${a.boxy[0]}"]`).check({ force: true });
          await p.locator(`.lcd-vyb--vclass input[data-lcd-vyb-velkost2="${a.boxy[1]}"]`).check({ force: true });
          const pr = p.locator('.lcd-vyb--vclass [data-lcd-vyb-pridat="vclass-box"]');
          over(cisto(await pr.textContent()) === "Pridať k setu · +218 €", ka + ": " + cisto(await pr.textContent()));
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
      over(k.length === 1 && k[0].sku === "VCLASS", ka + ": v košíku ostala jedna položka 646 (" + k.length + ")");
      const r = k[0];
      if (!r) continue;
      over(cenaCislo(r.cena) === a.cena, ka + ": cena v košíku " + r.cena + " = " + a.cena + " €");
      const ocak = Object.assign({}, rozober(povodny.sur), a.zmena);
      Object.keys(ocak).forEach((m) => { if (ocak[m] == null) delete ocak[m]; });
      eq(zorad(rozober(r.sur)), zorad(ocak), ka + ": príplatky riadku");
      if (a.chyba) over(r.itemId === povodny.itemId && r.sur === povodny.sur && r.q === povodny.q, ka + ": košík bez zmeny (ten istý riadok)");
      else {
        over(r.itemId !== povodny.itemId, ka + ": riadok vymenený (nové itemId), pôvodný zmazaný");
        overKartu(s, sc, ka, r.itemId, a.ponuky, a.kriziky, a.cena);
        if (a.klik === "rad") over(s.polozky[0].rozpis.includes("Autokoberce do 2. a 3. radu"), ka + ": odrážka „Autokoberce do 2. a 3. radu“ (veľkosť je v riadku Auto)");
        overPoradie(s, sc, ka, r.itemId);
      }
      if (sn && a.boxNahlad) {
        // náhľad ako plán (telefón po kliknutí): otvorený výber boxov, 2 boxy M
        await p.locator('.lcd-vyb--vclass [data-lcd-vyb="vclass-box"]').click();
        await p.locator('.lcd-vyb--vclass input[data-lcd-vyb-pocet="2"]').check({ force: true });
        await p.locator('.lcd-vyb--vclass input[data-lcd-vyb-velkost="M"]').check({ force: true });
        await p.locator('.lcd-vyb--vclass input[data-lcd-vyb-velkost2="M"]').check({ force: true });
        const pr = cisto(await p.locator('.lcd-vyb--vclass [data-lcd-vyb-pridat="vclass-box"]').textContent());
        over(pr === "Pridať k setu · +198 €", ka + ": 2 boxy M " + pr);
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
  over(stav.objednavka === 0, kontext + ": žiadne odoslanie objednávky");
  over(!chyby.length, kontext + ": bez chýb stránky " + chyby.join(" ; ") + (chyby.length && process.env.LADENIE ? " | zlyhané: " + zlyhane.join(" ; ") : ""));
  await c.close();
}

/** Bežný košík (598 / kamión / zmes): živá verzia vs lokálna — rovnaké ponuky setu, triedu V len pri riadku 646. */
async function porovnanie(b, nazov, sirka, sc) {
  const kontext = `${nazov} ${sirka} ${sc.id}`;
  const vysledky = {};
  for (const rezim of ["pred", "po"]) {
    const stav = { objednavka: 0 };
    const c = await novyKontext(b, sirka, rezim, sc, stav);
    const p = await c.newPage();
    const chyby = [];
    p.on("pageerror", chybaStranky(chyby));
    try {
      const s = await pripravKosik(p, sc, rezim);
      await p.waitForTimeout(2500);
      const s2 = await pockajStabilne(p, 20000);
      if (snimky && rezim === "po" && sc.kosik.includes("646")) await p.locator("#lcd-opc-kosik").screenshot({ path: join(snimky, `${nazov}-${sirka}-zmes.png`) });
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
  const vcIds = (v) => v.k.filter((r) => r.sku === "VCLASS" && r.priceId === "68434").map((r) => r.itemId);
  const ine = (v) => {
    const ids = vcIds(v);
    // položky iné ako 646 v poradí karty: rozpis, krížiky, cena (itemId sa medzi košíkmi líši)
    const pol = v.s.polozky.filter((x) => !ids.includes(x.item)).map((x) => ({ cena: x.cena, rozpis: x.rozpis, x: x.x }));
    // „K setu: …“ sa porovnáva len v košíku bez 646 (v zmiešanom košíku ho pribudlo zámerne, overené nižšie)
    const bl = v.s.bloky.filter((x) => !/lcd-vyb--vclass/.test(x.trieda) && !ids.includes(x.item)).map((x) => ({ trieda: x.trieda, nadpis: x.nadpis,
      kset: sc.kosik.includes("646") ? null : x.kset, riadky: x.riadky.map((r) => ({ d: r.d, meno: r.meno, cena: r.cena, tl: r.tl })) }));
    return { pol, bl };
  };
  eq(ine(z), ine(a), kontext + ": iné položky a ponuka setu rovnaké ako živá verzia");
  over(ine(z).bl.length > 0 || sc.id === "kamion-640", kontext + ": ponuka setu sa ukázala (" + ine(z).bl.length + " blok)");
  const ids = vcIds(z);
  const vcBloky = z.s.bloky.filter((x) => /lcd-vyb--vclass/.test(x.trieda));
  over(vcBloky.every((x) => ids.includes(x.item)), kontext + ": blok triedy V len pri riadku 646");
  over(z.s.polozky.every((x) => ids.includes(x.item) || (!x.vc && !x.x.some((y) => /^vclass-/.test(y)))), kontext + ": iné položky bez rozpisu a krížikov triedy V");
  if (sc.kosik.includes("646")) {
    over(vcBloky.length === 1, kontext + ": riadok 646 má ponuku triedy V");
    eq(vcBloky[0] ? vcBloky[0].riadky.map((r) => r.d) : null, ["rohoz", "vrstva2", "box"], kontext + ": auto BMW v karte -> 2. a 3. rad sa neponúkne");
    // od 8. 11. 2026 je živá verzia už s ponukou triedy V (daa471a+), preto len informácia, nie kontrola
    console.log("   info " + kontext + ": živá verzia pri 646 ponúka " + a.s.bloky.filter((x) => a.k.some((r) => r.itemId === x.item && r.sku === "VCLASS")).length + " blok");
    // revízia 8. 11. 2026: v zmiešanom košíku má každá karta svoj set, v poradí riadkov košíka
    const vsetky = z.s.bloky.filter((x) => x.nadpis === "Doplňte svoj set");
    over(vsetky.length === 2, kontext + ": dve karty „Doplňte svoj set“ (" + vsetky.length + ")");
    over(vcBloky[0] && vcBloky[0].kset === "K setu: Autokoberce Mercedes V Class", kontext + ": karta triedy V „" + (vcBloky[0] && vcBloky[0].kset) + "“");
    const setK = vsetky.find((x) => !/lcd-vyb--vclass/.test(x.trieda));
    over(setK && /^K setu: Diamond-Line\b/.test(setK.kset), kontext + ": karta setu 598 „" + (setK && setK.kset) + "“");
    const poradie = z.k.map((r) => r.itemId);
    over(vsetky.map((x) => poradie.indexOf(x.item)).every((v, i, arr) => i === 0 || arr[i - 1] < v), kontext + ": karty v poradí riadkov košíka");
  } else {
    over(!vcBloky.length, kontext + ": žiadna ponuka triedy V");
    over(z.s.bloky.every((x) => !x.kset), kontext + ": jedna ponuka setu bez „K setu“ ako doteraz");
  }
}

/**
 * Poistka (revízia 8. 11. 2026): chyba pri vkladaní karty ponuky (podvrhnutá výnimka v appendChild do #lcd-doplnok) skryje len
 * ponuku — karta „Váš košík“ s položkami ostane (predtým zlyhaný sľub ponuky kartu odstránil). Živá verzia len pre info.
 */
async function chybaPonuky(b, nazov, sirka, sc) {
  const kontext = `${nazov} ${sirka} ${sc.id}`;
  for (const rezim of ["pred", "po"]) {
    const stav = { objednavka: 0 };
    const c = await novyKontext(b, sirka, rezim, sc, stav);
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
      await pripravKosik(p, sc, rezim);
      await p.waitForTimeout(3000);
      const r = await p.evaluate(() => ({ karta: !!document.getElementById("lcd-opc-kosik"), polozky: document.querySelectorAll("#lcd-opc-kosik .lcd-opc-kk__polozka").length,
        ponuky: document.querySelectorAll("#lcd-doplnok .lcd-vyb").length, vyhodene: window.__lcdTestChyb || 0 }));
      if (rezim === "po") {
        over(r.vyhodene >= 1, kontext + ": podvrhnutá chyba naozaj nastala (" + r.vyhodene + "×)");
        over(r.karta && r.polozky === 2 && r.ponuky === 0, kontext + ": karta košíka ostala s 2 položkami, bez ponuky " + JSON.stringify(r));
        over(!chyby.length, kontext + ": chyba sa nedostala von zo stránky " + chyby.join(" ; "));
      } else console.log(`   info ${kontext} živá verzia: ${JSON.stringify(r)}`);
    } catch (e) {
      if (rezim === "po") over(false, kontext + ": " + String(e && e.message).split("\n")[0].slice(0, 200));
      else console.log(`   info ${kontext} živá verzia: ${String(e && e.message).split("\n")[0].slice(0, 120)}`);
    }
    over(stav.objednavka === 0, kontext + " " + rezim + ": žiadne odoslanie objednávky");
    await c.close();
  }
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
