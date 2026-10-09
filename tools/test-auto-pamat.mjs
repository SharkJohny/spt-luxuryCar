// Testy functions/autoPamat.js: auto zákazníka aj v novej karte košíka a objednávky (localStorage -> sessionStorage).
//   node tools/test-auto-pamat.mjs
const pamat = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
const M = await import("../assets/js/functions/autoPamat.js");
let ok = 0, zle = 0;
const t = (n, f) => { try { f(); ok++; console.log("OK   " + n); } catch (e) { zle++; console.log("FAIL " + n + " — " + e.message); } };
const eq = (a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(JSON.stringify(a) + " ≠ " + JSON.stringify(b)); };
const POLIA = ["Brand", "Model", "Year", "carType", "model"];
const karta = (auto) => { const ss = pamat(); if (auto) POLIA.forEach((k, i) => ss.setItem(k, auto[i])); return ss; };
const FORD = ["Ford", "Focus", "2020", "Combi", "Ford Focus 2020 Combi"];
const KOSIK = [{ itemId: "a", priceId: 1, quantity: 1 }];

t("pridanie do košíka uloží auto karty; nová karta na košíku ho dostane", () => {
  const ls = pamat();
  eq(M.ulozAutoZKarty(karta(FORD), ls, 1000), true);
  const ss = karta(null);
  eq(M.obnovAuto(ss, ls, KOSIK, true, 2000), "doplnene");
  eq(POLIA.map((k) => ss.getItem(k)), FORD);
});
t("neúplné auto v karte sa pri pridaní neuloží", () => {
  const ls = pamat();
  eq(M.ulozAutoZKarty(karta(["BMW", null, "2021", "SUV", null]), ls, 1000), false);
  eq(ls.getItem("lcdAuto:v1"), null);
});
t("mimo košíka a objednávky (produkt, rozcestník) sa nedopĺňa — konfigurátor ostane prázdny", () => {
  const ls = pamat(); M.ulozAutoZKarty(karta(FORD), ls, 1000);
  const ss = karta(null);
  eq(M.obnovAuto(ss, ls, KOSIK, false, 2000), null);
  eq(ss.getItem("model"), null);
});
t("karta s vlastným (aj rozpracovaným) výberom sa neprepíše", () => {
  const ls = pamat(); M.ulozAutoZKarty(karta(FORD), ls, 1000);
  const ss = pamat(); ss.setItem("Brand", "BMW"); ss.setItem("Year", "2021");
  eq(M.obnovAuto(ss, ls, KOSIK, true, 2000), null);
  eq([ss.getItem("Brand"), ss.getItem("Model"), ss.getItem("model")], ["BMW", null, null]);
});
t("prázdny košík záznam zmaže (aj po dokončenej objednávke), na akejkoľvek stránke", () => {
  const ls = pamat(); M.ulozAutoZKarty(karta(FORD), ls, 1000);
  eq(M.obnovAuto(karta(null), ls, [], false, 2000), "zmazane");
  eq(ls.getItem("lcdAuto:v1"), null);
});
t("neznámy košík (bez dataLayer) -> nič nemazať ani nedopĺňať", () => {
  const ls = pamat(); M.ulozAutoZKarty(karta(FORD), ls, 1000);
  eq(M.obnovAuto(karta(null), ls, null, true, 2000), null);
  eq(!!ls.getItem("lcdAuto:v1"), true);
});
t("staršie ako 14 dní sa nepoužije", () => {
  const ls = pamat(); M.ulozAutoZKarty(karta(FORD), ls, 0);
  eq(M.obnovAuto(karta(null), ls, KOSIK, true, M.AUTO_TTL + 1), null);
});
t("pokazený záznam, „null“ hodnoty, chýbajúce úložisko -> nič, bez výnimky", () => {
  const ls = pamat();
  ls.setItem("lcdAuto:v1", "{nie json"); eq(M.obnovAuto(karta(null), ls, KOSIK, true, 1), null);
  ls.setItem("lcdAuto:v1", JSON.stringify({ Brand: "null", Model: "x", Year: "1", carType: "y", model: "m", t: 1 })); eq(M.obnovAuto(karta(null), ls, KOSIK, true, 2), null);
  eq(M.obnovAuto(karta(null), null, KOSIK, true, 2), null);
  eq(M.ulozAutoZKarty(null, ls, 2), false);
});
console.log(`\n${zle ? "ZLYHALO " + zle : "VŠETKO OK"} (${ok} OK)`);
process.exit(zle ? 1 : 0);
