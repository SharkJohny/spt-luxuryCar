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
t("starší záznam ako košík (AUTO_TTL) sa nepoužije; platí dlhšie než cookie košíka pcart (31 dní)", () => {
  eq(M.AUTO_TTL > 31 * 24 * 3600 * 1000, true);
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
// ---- auto pri položke košíka (odrážka „Auto: …“ a ponuka „Rohož do kufra pre …“, Michal 29. 10. 2026): záznam pri pridaní (priceId + auto karty)
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
t("v karte je aj súhrn kamióna: poznámka nesie auto aj kamión (poznamkaObjednavky.js) -> pri osobnom aute auto ostáva", () => {
  const ss = karta(OCT); ss.setItem("truckOrderSummary", "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: DAF (TIR) XF 2022-2025");
  eq(M.autoRiadku(ss, pamat(), { priceId: "1", sur: SUR("Combi") }, 1), auto(OCT));
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
// ------------------------------------------------------------------ volant, miesta, dvere v novej karte (kniha OPC § 10.44)
const POLOHY = ["wheelPosition", "seatPosition", "doorPosition"];
const polohy = (ss, v) => { POLOHY.forEach((k, i) => ss.setItem(k, v[i])); return ss; };
const hodnoty = (ss) => POLOHY.map((k) => ss.getItem(k));
const PRAVY = ["right", "pass-7", "doors-5"], PREDVOLENE = ["left", "pass-5", "doors-4"];

t("pridanie do košíka uloží aj volant, miesta a dvere; nová karta ich dostane namiesto predvolených", () => {
  const ls = pamat();
  eq(M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set"), true);
  const ss = polohy(karta(null), PREDVOLENE); // productPage.js doplní predvolené skôr, než beží initAutoPamat
  eq(M.obnovAuto(ss, ls, KOSIK, true, 2000), "doplnene");
  eq(hodnoty(ss), PRAVY);
});
t("starý záznam bez polôh: nová karta ostane na predvolených, auto sa doplní", () => {
  const ls = pamat(); ls.setItem("lcdAuto:v1", JSON.stringify({ t: 1000, Brand: FORD[0], Model: FORD[1], Year: FORD[2], carType: FORD[3], model: FORD[4] }));
  const ss = polohy(karta(null), PREDVOLENE);
  eq(M.obnovAuto(ss, ls, KOSIK, true, 2000), "doplnene");
  eq(hodnoty(ss), PREDVOLENE);
  eq(ss.getItem("model"), FORD[4]);
});
t("rovnaké auto v karte, ďalší produkt vrátil polohy na predvolené: objednávka dostane výber z pridania", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set");
  const ss = polohy(karta(FORD), PREDVOLENE);
  eq(M.obnovAuto(ss, ls, KOSIK, true, 2000), "polohy");
  eq(hodnoty(ss), PRAVY);
});
t("rohož po sete, dlaždice nechané na predvolených: výber zo setu ostáva", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set");
  eq(M.ulozAutoZKarty(polohy(karta(FORD), PREDVOLENE), ls, 2000, "rohoz"), true);
  const ss = polohy(karta(null), PREDVOLENE);
  M.obnovAuto(ss, ls, KOSIK, true, 3000);
  eq(hodnoty(ss), PRAVY);
});
t("rohož po sete, zákazník na nej zmení miesta a dvere: platí jeho posledný klik, volant (na rohoži skrytý) zo setu", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), ["right", "pass-5", "doors-4"]), ls, 1000, "set");
  M.ulozAutoZKarty(polohy(karta(FORD), ["left", "pass-7", "doors-5"]), ls, 2000, "rohoz");
  const ss = polohy(karta(FORD), ["left", "pass-7", "doors-5"]);
  M.obnovAuto(ss, ls, KOSIK, true, 3000);
  eq(hodnoty(ss), ["right", "pass-7", "doors-5"]);
});
t("len rohož: miesta a dvere z jej stránky prejdú do novej karty", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), ["left", "pass-7", "doors-5"]), ls, 1000, "rohoz");
  const ss = polohy(karta(null), PREDVOLENE);
  eq(M.obnovAuto(ss, ls, KOSIK, true, 2000), "doplnene");
  eq(hodnoty(ss), ["left", "pass-7", "doors-5"]);
});
t("rohož pre iné auto si cudzí výber nezoberie", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set");
  const ine = ["Skoda", "Octavia", "2021", "Combi", "Skoda Octavia 2021 Combi"];
  M.ulozAutoZKarty(polohy(karta(ine), PREDVOLENE), ls, 2000, "rohoz");
  const ss = polohy(karta(null), PREDVOLENE);
  M.obnovAuto(ss, ls, KOSIK, true, 3000);
  eq([ss.getItem("model"), hodnoty(ss)], [ine[4], PREDVOLENE]);
});
t("zákazník set rovnakého auta pridá znova s iným výberom: platí nový", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set");
  M.ulozAutoZKarty(polohy(karta(FORD), ["left", "pass-7", "doors-3"]), ls, 2000, "set");
  const ss = polohy(karta(null), PREDVOLENE);
  M.obnovAuto(ss, ls, KOSIK, true, 3000);
  eq(hodnoty(ss), ["left", "pass-7", "doors-3"]);
});
t("iná zmena košíka na stránke produktu (odobratie položky) výber z pridania neprepíše predvolenými", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set");
  eq(M.ulozAutoZKarty(polohy(karta(FORD), PREDVOLENE), ls, 2000), true);
  const ss = polohy(karta(FORD), PREDVOLENE);
  eq(M.obnovAuto(ss, ls, KOSIK, true, 3000), "polohy");
  eq(hodnoty(ss), PRAVY);
});
t("iná zmena košíka s iným autom v karte: záznam nového auta bez cudzích polôh", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set");
  const ine = ["Skoda", "Octavia", "2021", "Combi", "Skoda Octavia 2021 Combi"];
  M.ulozAutoZKarty(polohy(karta(ine), PREDVOLENE), ls, 2000);
  const ss = polohy(karta(null), PREDVOLENE);
  M.obnovAuto(ss, ls, KOSIK, true, 3000);
  eq([ss.getItem("model"), hodnoty(ss)], [ine[4], PREDVOLENE]);
});
t("iné auto v karte: polohy sa neprepíšu", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set");
  const ss = polohy(karta(["Skoda", "Octavia", "2021", "Combi", "Skoda Octavia 2021 Combi"]), PREDVOLENE);
  eq(M.obnovAuto(ss, ls, KOSIK, true, 2000), null);
  eq(hodnoty(ss), PREDVOLENE);
});
t("mimo košíka a objednávky sa polohy neprepisujú (konfigurátor má svoje dlaždice)", () => {
  const ls = pamat(); M.ulozAutoZKarty(polohy(karta(FORD), PRAVY), ls, 1000, "set");
  const ss = polohy(karta(FORD), PREDVOLENE);
  eq(M.obnovAuto(ss, ls, KOSIK, false, 2000), null);
  eq(hodnoty(ss), PREDVOLENE);
});

// ------------------------------------------------------------------ kamión v novej karte (kniha OPC § 10.44)
const SUHRN = "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: DAF (TIR) XF 2022-2025";
const VOZ = "DAF (TIR) XF 2022-2025";
const kamKarta = () => { const ss = pamat(); ss.setItem("truckOrderSummary", SUHRN); ss.setItem("truckVehicle", VOZ); return ss; };
const KOS_KAMION = [{ code: "TEST-TRUCK", name: "luxusné autokoberce do kamionov", priceId: 68383 }];
const KOS_KAMION_CZ = [{ code: "TRUCK", name: "luxusní autokoberce do kamionů", priceId: 1 }];
const KOS_AUTO = [{ code: "598/DIA3", name: "luxusné autokoberce Dragonskin Basic DIAMOND LINE", priceId: 63493 }];
const KOS_MIX = KOS_AUTO.concat(KOS_KAMION);

t("kamión: pridanie uloží súhrn aj vozidlo, nová karta v objednávke ich dostane (SK aj CZ)", () => {
  [KOS_KAMION, KOS_KAMION_CZ, KOS_MIX].forEach((kos) => {
    const ls = pamat();
    eq(M.ulozKamionZKarty(kamKarta(), ls, 1000), true);
    const ss = pamat();
    eq(M.obnovKamion(ss, ls, kos, true, 2000), "doplnene");
    eq([ss.getItem("truckOrderSummary"), ss.getItem("truckVehicle")], [SUHRN, VOZ]);
  });
});
t("kamión: karta bez súhrnu nič neuloží", () => {
  const ls = pamat();
  eq(M.ulozKamionZKarty(pamat(), ls, 1000), false);
  eq(ls.getItem(M.KLUC_KAMION), null);
});
t("kamión bez záznamu: karta so súhrnom ho vytvorí (keby udalosť z pridania neprišla)", () => {
  const ls = pamat(); const ss = kamKarta();
  eq(M.obnovKamion(ss, ls, KOS_KAMION, true, 2000), null);
  eq(ss.getItem("truckOrderSummary"), SUHRN);
  eq(JSON.parse(ls.getItem(M.KLUC_KAMION)).truckOrderSummary, SUHRN);
});
t("dve karty: stará karta so súhrnom iného kamióna dostane naposledy pridaný kamión a záznam neprepíše", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 2000); // karta B pridala DAF
  const stara = pamat(); stara.setItem("truckOrderSummary", "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: VOLVO FH 2021-2025"); stara.setItem("truckVehicle", "VOLVO FH 2021-2025");
  eq(M.obnovKamion(stara, ls, KOS_KAMION, true, 3000), "doplnene");
  eq([stara.getItem("truckOrderSummary"), stara.getItem("truckVehicle")], [SUHRN, VOZ]);
  eq(JSON.parse(ls.getItem(M.KLUC_KAMION)).truckOrderSummary, SUHRN);
});
t("karta so zhodným súhrnom a záznamom: nič sa nemení", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 1000);
  eq(M.obnovKamion(kamKarta(), ls, KOS_KAMION, true, 2000), null);
});
t("po pridaní prezretý iný kamión (vozidlo v karte) sa do objednávky nedostane", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 1000);
  const ss = kamKarta(); ss.setItem("truckVehicle", "VOLVO FH 2021-2025");
  eq(M.obnovKamion(ss, ls, KOS_KAMION, true, 2000), "doplnene");
  eq(ss.getItem("truckVehicle"), VOZ);
});
t("kamión už v košíku nie je: objednávka zahodí súhrn v karte aj záznam", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 1000);
  const ss = kamKarta(); ss.setItem("model", FORD[4]);
  eq(M.obnovKamion(ss, ls, KOS_AUTO, true, 2000), "zmazane");
  eq([ss.getItem("truckOrderSummary"), ss.getItem("truckVehicle"), ls.getItem(M.KLUC_KAMION), ss.getItem("model")], [null, null, null, FORD[4]]);
});
t("prázdny košík v objednávke zmaže všetko; po dokončenej objednávke je ďalší nákup čistý", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 1000);
  const ss = kamKarta();
  eq(M.obnovKamion(ss, ls, [], true, 2000), "zmazane");
  eq([ss.getItem("truckOrderSummary"), ls.getItem(M.KLUC_KAMION)], [null, null]);
});
t("prázdny košík mimo objednávky zmaže len záznam, súhrn v karte nechá (môže byť tesne pred pridaním)", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 1000);
  const ss = kamKarta();
  eq(M.obnovKamion(ss, ls, [], false, 2000), "zmazane");
  eq([ss.getItem("truckOrderSummary"), ls.getItem(M.KLUC_KAMION)], [SUHRN, null]);
});
t("mimo objednávky sa s neprázdnym košíkom nič nemení ani nedopĺňa", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 1000);
  const ss = pamat();
  eq(M.obnovKamion(ss, ls, KOS_AUTO, false, 2000), null);
  eq([ss.getItem("truckOrderSummary"), !!ls.getItem(M.KLUC_KAMION)], [null, true]);
});
t("neznámy košík (bez dataLayer): nič nemazať ani nedopĺňať", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 1000);
  const ss = kamKarta();
  eq(M.obnovKamion(ss, ls, null, true, 2000), null);
  eq([ss.getItem("truckOrderSummary"), !!ls.getItem(M.KLUC_KAMION)], [SUHRN, true]);
});
t("záznam kamióna starší ako AUTO_TTL sa nepoužije, poškodený tiež nie", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 0);
  eq(M.obnovKamion(pamat(), ls, KOS_KAMION, true, M.AUTO_TTL + 1), null);
  const ls2 = pamat(); ls2.setItem(M.KLUC_KAMION, "{nie json");
  eq(M.obnovKamion(pamat(), ls2, KOS_KAMION, true, 1), null);
});
t("plné úložisko pri pridaní: starý záznam zmizne, novší súhrn karty platí", () => {
  const ls = pamat(); M.ulozKamionZKarty(kamKarta(), ls, 1000);
  const plne = { getItem: ls.getItem, removeItem: ls.removeItem, setItem() { throw new Error("QuotaExceededError"); } };
  const ss = pamat(); ss.setItem("truckOrderSummary", "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: VOLVO FH 2021-2025");
  eq(M.ulozKamionZKarty(ss, plne, 2000), false);
  eq(ls.getItem(M.KLUC_KAMION), null);
  eq(M.obnovKamion(ss, ls, KOS_KAMION, true, 3000), null);
  eq(ss.getItem("truckOrderSummary"), "ŠPECIFIKÁCIA VOZIDLA\n- Vozidlo: VOLVO FH 2021-2025");
});
t("zablokované úložisko: nič nespadne", () => {
  const zly = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() { throw new Error("x"); } };
  eq(M.ulozKamionZKarty(zly, zly, 1), false);
  eq(M.obnovKamion(zly, zly, KOS_KAMION, true, 1), null);
  eq(M.obnovKamion(null, null, KOS_KAMION, true, 1), null);
});
t("jeKamionDL: kód alebo názov z dataLayer", () => {
  eq([KOS_KAMION[0], KOS_KAMION_CZ[0], KOS_AUTO[0], { code: "616/DIA" }, { name: "Kamiónový koberec" }, null].map(M.jeKamionDL), [true, true, false, false, true, false]);
  // stránky dodávok (13. 11. 2026, functions/kamionPolozka.js): kód so slovom TRUCK alebo názov „Autokoberce do dodávky …“
  eq([{ code: "TRUCK-FIAT-DUCATO", name: "Autokoberce do dodávky Fiat Ducato" }, { code: "", name: "Autokoberce do dodávky Peugeot Boxer 2006–2014" }, { code: "TRUCK-SCANIA-R", name: "" },
    { code: "649/STR", name: "Autokoberce Škoda Kodiaq II" }, { code: "VCLASS", name: "Autokoberce Mercedes triedy V" }].map(M.jeKamionDL), [true, true, true, false, false]);
});

console.log(`\n${zle ? "ZLYHALO " + zle : "VŠETKO OK"} (${ok} OK)`);
process.exit(zle ? 1 : 0);
