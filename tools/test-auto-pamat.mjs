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
// ---- auto pri položke košíka („Pripravené pre: …“, Michal 29. 10. 2026): záznam pri pridaní (priceId + auto karty)
const OCT = ["Skoda", "Octavia", "2021", "Combi", "Skoda Octavia 2021 Combi"];
const PAS = ["Volkswagen", "Passat", "2019", "Combi", "Volkswagen Passat 2019 Combi"];
const auto = (a) => ({ Brand: a[0], Model: a[1], Year: a[2], carType: a[3] });
const SUR = (typ) => "Príplatky: rozloženie kobercov - prvý, druhý a tretí rad, autokoberce do kufru - nie, TYP - " + typ;
// Pravidlo (nezávislá kontrola 29. 10. 2026): riadok ukáže LEN auto, ktoré ide do poznámky objednávky = auto karty
// (sessionStorage „model“, main.js toNote). Záznam z pridania len rozhodne, či k riadku patrí — iné auto v zázname = nič.
const BMW3 = ["BMW", "3", "2020", "Combi", "BMW 3 2020 Combi"];
t("pridanie zapíše auto karty k priceId; riadok s tým priceId a TYP ukáže auto karty (= poznámka)", () => {
  const ls = pamat();
  eq(M.zapisAutoPolozky(karta(OCT), ls, "63493", 1000), true);
  eq(M.autoRiadku(karta(OCT), ls, { priceId: "63493", sur: SUR("Combi") }, 2000), auto(OCT));
  eq(M.autoRiadku(karta(null), ls, { priceId: "63493", sur: SUR("Combi") }, 2000), null, "karta bez auta = poznámka bez auta -> nič");
});
t("po pridaní prezrel iné auto (karta BMW, záznam Octavia): nič — košík nesmie potvrdiť iné auto, než ide do výroby", () => {
  const ls = pamat();
  M.zapisAutoPolozky(karta(OCT), ls, "63493", 1000);
  eq(M.autoRiadku(karta(BMW3), ls, { priceId: "63493", sur: SUR("Combi") }, 2000), null);
  eq(M.autoRiadku(karta(BMW3), ls, { priceId: "1", sur: SUR("Combi") }, 2000), auto(BMW3), "riadok bez záznamu: auto karty");
});
t("dve autá v košíku: auto karty len pri riadku, ktorý bol pridaný s ním; druhý riadok nič (poznámka nesie jedno auto)", () => {
  const ls = pamat();
  M.zapisAutoPolozky(karta(OCT), ls, "63493", 1000);
  M.zapisAutoPolozky(karta(PAS), ls, "63487", 2000);
  const ss = karta(PAS);
  eq(M.autoRiadku(ss, ls, { priceId: "63493", sur: SUR("Combi") }, 3000), null);
  eq(M.autoRiadku(ss, ls, { priceId: "63487", sur: SUR("Combi") }, 3000), auto(PAS));
});
t("rovnaký priceId pre dve rôzne autá so zhodným TYP: nevieme, ktorý riadok je ktorý -> nič", () => {
  const ls = pamat();
  M.zapisAutoPolozky(karta(OCT), ls, "63493", 1000);
  M.zapisAutoPolozky(karta(PAS), ls, "63493", 2000);
  eq(M.autoRiadku(karta(PAS), ls, { priceId: "63493", sur: SUR("Combi") }, 3000), null);
  eq(M.autoRiadku(karta(OCT), ls, { priceId: "63493", sur: SUR("Combi") }, 3000), null);
});
t("rovnaký priceId, iné TYP: záznam druhého TYP neprekáža; TYP riadku musí sedieť s kartou", () => {
  const ls = pamat();
  const X5 = ["BMW", "X5", "2020", "SUV", "BMW X5 2020 SUV"];
  M.zapisAutoPolozky(karta(OCT), ls, "63493", 1000);
  M.zapisAutoPolozky(karta(X5), ls, "63493", 2000);
  eq(M.autoRiadku(karta(X5), ls, { priceId: "63493", sur: SUR("SUV") }, 3000), auto(X5));
  eq(M.autoRiadku(karta(X5), ls, { priceId: "63493", sur: SUR("Combi") }, 3000), null, "riadok Combi, karta SUV");
  eq(M.autoRiadku(karta(OCT), ls, { priceId: "63493", sur: SUR("Combi") }, 3000), auto(OCT));
});
t("bez záznamu: auto karty (to isté ide do poznámky objednávky), ale len so zhodným TYP a s úplným autom („model“)", () => {
  eq(M.autoRiadku(karta(OCT), pamat(), { priceId: "1", sur: SUR("Combi") }, 1), auto(OCT));
  eq(M.autoRiadku(karta(OCT), pamat(), { priceId: "1", sur: "" }, 1), auto(OCT), "riadok bez TYP (rohož, box)");
  eq(M.autoRiadku(karta(OCT), pamat(), { priceId: "1", sur: SUR("Sedan") }, 1), null, "iný TYP = iné auto -> radšej nič");
  eq(M.autoRiadku(karta(null), pamat(), { priceId: "1", sur: SUR("Combi") }, 1), null, "žiadne auto");
  const ss = pamat(); ss.setItem("Brand", "Skoda"); ss.setItem("Year", "2021");
  eq(M.autoRiadku(ss, pamat(), { priceId: "1", sur: "" }, 1), null, "bez modelu nie");
  const ss2 = karta(OCT); ss2.removeItem("model");
  eq(M.autoRiadku(ss2, pamat(), { priceId: "1", sur: "" }, 1), null, "rozpracovaný výber bez „model“ = poznámka bez auta");
});
t("v karte je súhrn kamióna: poznámka nesie len kamión (main.js toNote) -> pri osobnom aute nič", () => {
  const ss = karta(OCT); ss.setItem("truckOrderSummary", "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: DAF (TIR) XF 2022-2025");
  eq(M.autoRiadku(ss, pamat(), { priceId: "1", sur: SUR("Combi") }, 1), null);
});
t("Jiné/Iné v TYP aj v karte sa zhodujú; záznam starší ako 14 dní sa nepoužije (ani na zamietnutie)", () => {
  const ss = karta(["Ford", "Focus", "2020", "Jiné, prosím napište do poznámky", "Ford Focus 2020 Jiné, prosím napište do poznámky"]);
  eq(M.autoRiadku(ss, pamat(), { priceId: "1", sur: "Příplatky: rozložení koberců - první řada, TYP - Jiné,Prosím napište do poznámky" }, 1).Model, "Focus");
  const ls = pamat(); M.zapisAutoPolozky(karta(OCT), ls, "63493", 0);
  eq(M.autoRiadku(karta(PAS), ls, { priceId: "63493", sur: SUR("Combi") }, M.AUTO_TTL + 1), auto(PAS));
  eq(M.autoRiadku(karta(PAS), ls, { priceId: "63493", sur: SUR("Combi") }, 5), null, "čerstvý záznam iného auta");
});
t("zápis: neúplné auto nie, bez priceId nie, duplicita sa nezdvojí, najviac 30 záznamov", () => {
  const ls = pamat();
  eq(M.zapisAutoPolozky(karta(["BMW", null, "2021", "SUV", null]), ls, "1", 1), false);
  eq(M.zapisAutoPolozky(karta(OCT), ls, "", 1), false);
  eq(M.zapisAutoPolozky(karta(OCT), null, "1", 1), false);
  M.zapisAutoPolozky(karta(OCT), ls, "5", 1); M.zapisAutoPolozky(karta(OCT), ls, "5", 2);
  eq(JSON.parse(ls.getItem(M.KLUC_POLOZKY)).length, 1);
  for (let i = 0; i < 40; i++) M.zapisAutoPolozky(karta(OCT), ls, "p" + i, 10 + i);
  const z = JSON.parse(ls.getItem(M.KLUC_POLOZKY));
  eq([z.length, z[z.length - 1].p], [30, "p39"]);
});
t("výmena riadku za dvojvrstvový set (iné priceId): auto starého riadku prejde na nový", () => {
  const ls = pamat();
  M.zapisAutoPolozky(karta(OCT), ls, "63493", 1000);
  const a = M.autoRiadku(karta(OCT), ls, { priceId: "63493", sur: SUR("Combi") }, 2000);
  eq(M.zapisAutoKPolozke(ls, "66983", a, 2000), true);
  eq(M.autoRiadku(karta(OCT), ls, { priceId: "66983", sur: SUR("Combi") }, 3000), auto(OCT));
  eq(M.autoRiadku(karta(PAS), ls, { priceId: "66983", sur: SUR("Combi") }, 3000), null, "karta medzitým iné auto");
  eq([M.zapisAutoKPolozke(ls, "1", null, 1), M.zapisAutoKPolozke(ls, "", a, 1), M.zapisAutoKPolozke(null, "1", a, 1)], [false, false, false]);
});
t("prázdny košík zmaže aj záznamy položiek", () => {
  const ls = pamat(); M.zapisAutoPolozky(karta(OCT), ls, "63493", 1);
  M.obnovAuto(karta(null), ls, [], false, 2);
  eq(ls.getItem(M.KLUC_POLOZKY), null);
});
t("TYP z textu príplatkov (SK, CZ, s čiarkou v hodnote, bez TYP)", () => {
  eq(M.typZPriplatkov(SUR("Combi")), "Combi");
  eq(M.typZPriplatkov("Příplatky: rozložení koberců - první řada, TYP - Jiné,Prosím napište do poznámky, Velikost 1. boxu - S : 33x32x30 cm"), "Jiné,Prosím napište do poznámky");
  eq(M.typZPriplatkov("Príplatky: TYP - Sedan"), "Sedan");
  eq([M.typZPriplatkov(""), M.typZPriplatkov(null), M.typZPriplatkov("Príplatky: rozloženie kobercov - prvý rad")], [null, null, null]);
});
t("popis auta: značka model rok (typ); zástupné texty a „Iné, prosím napíšte…“ von", () => {
  eq(M.popisAuta(auto(OCT)), "Skoda Octavia 2021 Combi");
  eq(M.popisAuta(auto(OCT), false), "Skoda Octavia 2021");
  eq(M.popisAuta({ Brand: "Ford", Model: "Focus", Year: "Iné, prosím napíšte do poznámky", carType: "Jiné, prosím napište do poznámky" }), "Ford Focus");
  eq(M.popisAuta({ Brand: "Značka", Model: "Model", Year: "Rok výroby", carType: "Typ auta" }), null);
  eq([M.popisAuta(null), M.popisAuta({ Brand: "", Model: "X5" })], [null, null]);
});
t("popis kamióna: bez druhu v zátvorke, roky s pomlčkou", () => {
  eq(M.popisKamiona("DAF (TIR) XF 2022-2025"), "DAF XF 2022–2025");
  eq(M.popisKamiona("Citroën (dodávka) Jumper 2014-2025"), "Citroën Jumper 2014–2025");
  eq([M.popisKamiona("Vyberie sa v konfigurátore"), M.popisKamiona(""), M.popisKamiona(null)], [null, null, null]);
});
console.log(`\n${zle ? "ZLYHALO " + zle : "VŠETKO OK"} (${ok} OK)`);
process.exit(zle ? 1 : 0);
