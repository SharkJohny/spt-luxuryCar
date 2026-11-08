// Test CZ kópie konfigurátora Mercedes triedy V (CZ 2458, presná kópia SK 646, Michal 8. 11. 2026) bez prehliadača:
//   1) každý text t("…") v konfigurátore (vclass/app.js, boxy.js, druha.js, obsah.js, sken.js) má český preklad (vclass/texty-cz.js),
//      čeština bez slovenčiny a bez zakázaných slov („s DPH“, „na milimetr“, „vyrábíme“, „ekokůže“); SK t() vráti text bez zmeny;
//   2) vclass/data-cz.js: mená príplatkov a všetky hodnoty presne ako v CZ admine (tools/vclass-cz-admin.json), ceny „Samostatně“;
//   3) register konfigurátora 1V (produkty.js): CZ 2458 = typ vclass s českými textami karty druhej vrstvy, SK 646 bez zmeny,
//      ID sedí s functions/vclassProdukt.js;
//   4) poznámka objednávky (functions/poznamkaObjednavky.js): CZ riadok triedy V dostane „model: …“ ako SK.
//
//   node tools/test-vclass-cz.mjs
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VC = join(KOREN, "assets/js/components/konfigurator1v/vclass");
const imp = (p) => import(pathToFileURL(join(KOREN, p)).href);
let ok = 0, zle = 0;
const over = (c, t) => { if (c) ok++; else { zle++; console.log("  ZLE  " + t); } };
const eq = (a, b, t) => over(JSON.stringify(a) === JSON.stringify(b), t + ": " + JSON.stringify(a) + (JSON.stringify(a) === JSON.stringify(b) ? "" : " ≠ " + JSON.stringify(b)));

// ------------------------------------------------------------------ 1) texty
console.log("== 1) texty konfigurátora");
const { TEXTY_CZ } = await imp("assets/js/components/konfigurator1v/vclass/texty-cz.js");
const trh = await imp("assets/js/components/konfigurator1v/vclass/trh.js");
const literaly = new Map();
for (const f of readdirSync(VC).filter((x) => x.endsWith(".js"))) {
  const s = readFileSync(join(VC, f), "utf8");
  for (const m of s.matchAll(/(?<![\w.$])t\("((?:[^"\\]|\\.)*)"/g)) literaly.set(JSON.parse('"' + m[1] + '"'), f);
}
over(literaly.size > 120, "texty t(…) v kóde nájdené: " + literaly.size);
const chyba = [...literaly.keys()].filter((k) => !TEXTY_CZ.has(k));
eq(chyba, [], "každý text t(…) má český preklad");
const navyse = [...TEXTY_CZ.keys()].filter((k) => !literaly.has(k));
eq(navyse, [], "v texty-cz.js nie sú preklady, ktoré kód nepoužíva");
const ZAKAZANE = /s DPH|bez DPH|na milimetr|vyrábím|vyrábí|ekokůž|eko-kůž|[äôľĺŕ]|\b(?:sme|alebo|ktor\w*|pre|tiež|môžete|ďakujem|prosím, vyberte)\b/i;
const zleCz = [...TEXTY_CZ.entries()].filter(([, v]) => ZAKAZANE.test(v)).map(([, v]) => v);
eq(zleCz, [], "čeština bez slovenčiny a zakázaných slov");
const ph = (s) => (s.match(/\{\d\}/g) || []).sort().join();
eq([...TEXTY_CZ.entries()].filter(([k, v]) => ph(k) !== ph(v)).map(([k]) => k), [], "zástupné {0} … sedia");
eq([...TEXTY_CZ.entries()].filter(([, v]) => /\bVás\b|\bVám\b|\bVaš/.test(v) === false && /\bvás\b|\bvám\b|\bvaš/.test(v)).map(([, v]) => v), [], "vykanie s veľkým V");
trh.nastavTrh("sk");
eq([...literaly.keys()].filter((k) => trh.t(k) !== k), [], "SK: t() vráti presne ten istý text");
eq([trh.t("Krok {0} z {1}", 2, 6), trh.t("Ešte chýba: {0}.", "Vzor prešívania"), trh.cenaText(1300), trh.jeCz()], ["Krok 2 z 6", "Ešte chýba: Vzor prešívania.", "1 300 €", false], "SK: dosadenie a cena v €");
trh.nastavTrh("cz");
eq([trh.t("Krok {0} z {1}", 2, 6), trh.t("Ešte chýba: {0}.", "Vzor prošívání"), trh.t("Pokračujte ďalej"), trh.cenaText(32500), trh.jeCz()], ["Krok 2 z 6", "Ještě chybí: Vzor prošívání.", "Pokračujte dále", "32 500 Kč", true], "CZ: preklad, dosadenie a cena v Kč");
trh.nastavTrh("sk");

// ------------------------------------------------------------------ 2) údaje CZ = CZ admin
console.log("== 2) data-cz.js = CZ admin");
const SK = await imp("assets/js/components/konfigurator1v/vclass/data.js");
const CZ = await imp("assets/js/components/konfigurator1v/vclass/data-cz.js");
const ADMIN = JSON.parse(readFileSync(join(KOREN, "tools/vclass-cz-admin.json"), "utf8"));
const P = {};
ADMIN.priplatky.forEach((p) => { P[p.meno] = p.hodnoty.map((h) => h[1]); });
eq(Object.keys(CZ.SELECTY), Object.keys(SK.SELECTY), "rovnaké kľúče príplatkov ako SK");
eq(Object.keys(CZ.SELECTY).filter((k) => !P[CZ.SELECTY[k]]), [], "každý príplatok CZ je v admine");
eq(Object.keys(P).length, 15, "CZ admin má 15 príplatkov");
const hodnoty = {
  volant: CZ.VOLANT, stred: CZ.STRED, dvere: CZ.DVERE, sedadla: CZ.SEDADLA_TEXTY, stolcek: CZ.STOLCEK, zasuvky: CZ.ZASUVKY,
  farba: [].concat(...CZ.VZORY.map((v) => CZ.FARBY[v.id].map((f) => v.nm + " – " + f.nm))),
  farba2: CZ.LUX.map((l) => "Lux Color " + l[0]).concat(CZ.BEZ_DRUHEJ),
  rozlozenie: [CZ.ROZ_PREDOK, CZ.ROZ_BEZ].concat(...CZ.VELKOSTI.map((x) => [CZ.rozSet(x.v), CZ.rozLen(x.v), CZ.rozRadRohoz(x.v)])),
  rohoz: CZ.ROHOZ.concat(CZ.ROHOZ_SAM), box1: CZ.BOXY.map((b) => b.t), box2: CZ.BOXY.map((b) => b.t), box3: CZ.BOXY.map((b) => b.t), boxFarba: CZ.BOX_FARBY.map((f) => f.nm),
};
Object.keys(hodnoty).forEach((k) => {
  const v = P[CZ.SELECTY[k]] || [];
  eq(hodnoty[k].filter((x) => v.indexOf(x) < 0), [], "hodnoty " + k + " sú v admine");
  eq(v.filter((x) => hodnoty[k].indexOf(x) < 0), [], "admin " + k + " nemá hodnotu navyše");
});
eq(P[CZ.SELECTY.rok].filter((r) => CZ.ROKY.indexOf(r) < 0), [], "roky výroby z adminu konfigurátor pozná");
eq(CZ.FARBY.diamond.map((f) => f.slug), SK.FARBY.diamond.map((f) => f.slug), "fotky farieb rovnaké ako SK");
eq([CZ.sedadlaText("2", "3"), CZ.rozSet("L"), CZ.FARBY.diamond.find((f) => f.sk === "Hnedá").nm, CZ.luxKFarbe("Diamond Line – Hnědá"), CZ.luxKFarbe("Stripe Line – Vínově červená")],
  ["2 sedadla ve 2. řadě a 3 sedadla ve 3. řadě", "Přední sedadla, 2. a 3. řada (L)", "Hnědá", "11", "13"], "CZ hodnoty a odporúčaná Lux");
eq([CZ.SAMOSTATNE.predok, CZ.SAMOSTATNE.rad, CZ.SAMOSTATNE.rohoz], [SK.SAMOSTATNE.predok * 25, { M: SK.SAMOSTATNE.rad.M * 25, L: SK.SAMOSTATNE.rad.L * 25, XL: SK.SAMOSTATNE.rad.XL * 25 }, SK.SAMOSTATNE.rohoz * 25], "Samostatně = SK × 25 (predok, rad, rohož)");
eq(CZ.SAMOSTATNE.box, { S: 5100, M: 5499, L: 5959, XL: 6099 }, "Samostatně box = box 2427 na CZ webe");
eq(CZ.KROKY.map((k) => k.id), SK.KROKY.map((k) => k.id), "kroky v rovnakom poradí");
eq([...CZ.KROKY.map((k) => [k.nm, k.kr, k.ti, k.pod || "", k.vy].join(" ")), CZ.INFO.zasuvky.text, CZ.VIDEO.alt].concat(CZ.VELKOSTI.map((x) => x.p)).filter((x) => ZAKAZANE.test(x)), [], "texty krokov po česky");
// ceny produktu v admine: komplet M / L / XL a jednotlivé časti (Michal: SK × 25, boxy ako CZ autokoberce)
const cena = (k, t) => { const p = ADMIN.priplatky.find((x) => x.meno === CZ.SELECTY[k]); const h = p && p.hodnoty.find((x) => x[1] === t); return h ? h[2] : NaN; };
eq(CZ.VELKOSTI.map((x) => ADMIN.produkt.cena + cena("rozlozenie", CZ.rozSet(x.v)) + cena("rohoz", CZ.ROHOZ[0]) + cena("farba2", "Lux Color 10")), [32500, 35000, 37500], "komplet M / L / XL v Kč");
eq([CZ.BOXY.map((b) => cena("box1", b.t)), CZ.BOXY.map((b) => cena("box2", b.t))], [[2640, 3079, 3585, 3899], [2299, 2859, 3399, 3499]], "boxy ako české autokoberce");

// ------------------------------------------------------------------ 3) register 1V a produkt
console.log("== 3) register a produkt");
const { produkt1v, zaznam } = await imp("assets/js/components/konfigurator1v/produkty.js");
const { VCLASS_SK, VCLASS_CZ, vclassPreProjekt } = await imp("assets/js/functions/vclassProdukt.js");
const pCz = produkt1v({ projectId: 581408, productId: 2458 });
const pSk = produkt1v({ projectId: 562035, productId: 646 });
eq([pCz && pCz.typ, pCz && pCz.url, pCz && pCz.obsah, pSk && pSk.typ, pSk && pSk.url], ["vclass", "/autokoberce-mercedes-v-class/", "vclass", "vclass", "/autokoberce-mercedes-v-class/"], "CZ 2458 aj SK 646 = typ vclass");
eq([zaznam(562035, 2458), zaznam(581408, 646)], [null, null], "SK produkt len na SK, CZ len na CZ");
eq([pCz && pCz.texty.druha.ano.tl, pCz && pCz.texty.druha.nie.nm, pSk && pSk.texty.druha.ano.tl], ["Ano, chci druhou vrstvu", "Ne, děkuji", "Áno, chcem druhú vrstvu"], "karta druhej vrstvy: CZ texty z registra, SK bez zmeny");
eq([VCLASS_CZ.pid, VCLASS_CZ.priceId, VCLASS_CZ.projekt, VCLASS_CZ.url, String(ADMIN.produkt.id), String(ADMIN.produkt.priceId)], ["2458", "46327", "581408", "/autokoberce-mercedes-v-class/", "2458", "46327"], "vclassProdukt.js CZ = CZ admin");
eq([VCLASS_SK.pid, VCLASS_SK.priceId, vclassPreProjekt(562035).trh, vclassPreProjekt("581408").trh, vclassPreProjekt(123)], ["646", "68434", "sk", "cz", null], "vclassProdukt.js SK bez zmeny, trh podľa projektu");

// ------------------------------------------------------------------ 4) poznámka objednávky
console.log("== 4) poznámka objednávky");
const { zlozPoznamku, patriAutu } = await imp("assets/js/functions/poznamkaObjednavky.js");
const model = "Mercedes-Benz V Class L (long 5140 mm) 2024";
const riadokCz = { sku: "VCLASS", href: "https://www.luxurycardesign.cz" + VCLASS_CZ.url, text: "Autokoberce Mercedes V Class" };
eq([patriAutu(riadokCz.href), zlozPoznamku("", { savedModel: model, riadky: [riadokCz] }), zlozPoznamku("Zavolajte", { savedModel: model, riadky: [riadokCz] })],
  [true, "model: " + model, "Zavolajte\n\nmodel: " + model], "CZ trieda V: „model: …“ do poznámky ako SK");
// app.js píše do sessionStorage to isté na SK aj CZ (Brand, Model z katalógu áut, Year, model) — kontrola zdroja
{
  const app = readFileSync(join(VC, "app.js"), "utf8");
  const zapis = app.slice(app.indexOf('sessionStorage.setItem("Brand"'), app.indexOf('sessionStorage.setItem("model"') + 120);
  over(/MODELY\[S\.velkost\]/.test(zapis) && !/\bcz\b|jeCz|t\(/.test(zapis), "auto do poznámky: rovnaký zápis pre SK aj CZ (bez prekladu)");
}

console.log(`OK ${ok}, ZLE ${zle}`);
process.exit(zle ? 1 : 0);
