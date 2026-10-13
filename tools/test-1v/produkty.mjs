// Profily produktov pre tools/test-konfigurator-1v.mjs (--produkt). JADRO (T0.2, 14. 10. 2026) — mení len vydanie.
//
// Zdroj: plan.md §1 + §4 (priceId a ceny), produkty-sk.json (GET 13. 10. 2026), živý POST zachytený testom
// (--zdroj cdn, 14. 10. 2026). ID parametrov test nikdy nepoužíva natvrdo: kľúče (farba, kufor, box1 …) hľadá
// podľa data-parameter-name (pomocnik.mjs PARAMETRE). Tu sú len OČAKÁVANÉ výsledky (priceId, sumy), ktoré sa
// porovnajú so živou stránkou — ak admin zmení cenu, test to ukáže a profil sa upraví.
//
//   --produkt 598,610 | all | typ:dvoj | typ:kufor | jedno-hexa | dvoj-stripe | classic-diamond | premium-hexa | boxy | vzorky
//
// Polia profilu:
//   url, typ, vzor, nazov
//   scenare       – predvolená sada scenárov (bez --krok); plná sada len na hlavnom produkte typu (plan §4.7)
//   ceny          – očakávaná suma „Spolu“ po scenári (číslo) — kontroluje sa po každom scenári, ktorý vráti spolu
//   platne        – { priceId, spolu, odporucana } scenára `platne` (plan.md §4)
//   odporucana    – false = v admine chýba bežná cena (613, 625, 616, 637): odporúčaná cena sa nemá ukázať;
//                   ak sa ukáže správne (×1,6), je to upozornenie „admin doplnil bežnú cenu, uprav profil“
//   postKluce     – popis živého POST (len dokumentácia; overuje overPost podľa formulára + TYPY_TEST.nepovinne)
//   znameChyby    – chyby konzoly živého webu, ktoré scenár vyvolá (nie sú naše): upozornenie, nie zlyhanie
//   (upozornenia: známe chyby v admine/živom webe test hlási ako „!“ riadky, nie ako zlyhanie — D2)

export const SK = "https://www.luxurycardesign.sk";

/**
 * Typy produktov z pohľadu testu.
 *   kroky       – kroky živého (starého) konfigurátora v poradí DOM
 *   povinne     – kroky, ktoré musí zákazník vyplniť (poradie validácie „červený rám“)
 *   posledny    – krok s tlačidlom „Dokončiť konfiguráciu“ / „Pokračujte k súhrnu“
 *   nepovinne   – parametre, ktorých select môže v POST chýbať (živý web: .val(0) na select bez voľby „0“
 *                 -> selectedIndex -1 -> prehliadač kľúč do POST nedá; box 616, zachytené 14. 10. 2026)
 *   pripravene  – výraz v stránke: konfigurátor (alebo vzorkovník) je postavený
 */
const PRIPRAVENY_SET = `!!(function () {
  var f = document.getElementById("product-detail-form"); if (!f) return false;
  var z = f.querySelector(".modl-selector-wrap .brands select");
  return f.querySelector(".content-wrap .wheel-Position") && f.querySelector(".upsale-buttons.trunk") && z && z.options.length > 5 && f.querySelector(".content-wrap .next-step-button");
})()`;
const PRIPRAVENA_ROHOZ = `!!(function () {
  var f = document.getElementById("product-detail-form"); if (!f) return false;
  var z = f.querySelector(".modl-selector-wrap .brands select");
  return f.querySelector(".content-wrap .wheel-Position") && z && z.options.length > 5 && f.querySelector(".content-wrap > .parameter-wrap .option-button") && f.querySelector(".content-wrap .next-step-button");
})()`;
const PRIPRAVENY_BOX = `!!(function () {
  var f = document.getElementById("product-detail-form"); if (!f) return false;
  return f.querySelector(".content-wrap .amount-wrap .amount-button") && f.querySelector(".content-wrap .parameter-sizes .option-button") && f.querySelector(".content-wrap .next-step-button");
})()`;
const PRIPRAVENY_VZORKOVNIK = `!!(function () {
  var f = document.getElementById("product-detail-form"); if (!f) return false;
  return f.querySelectorAll("select.surcharge-parameter").length >= 40 && document.querySelector(".lcd-vz-swatch") && document.querySelector(".lcd-vz-acc-head");
})()`;

export const TYPY_TEST = {
  jedno: { kroky: ["vzor", "auto", "farba", "rozlozenie", "kufor", "boxy"], povinne: ["auto", "farba", "rozlozenie"], posledny: "boxy", nepovinne: [], pripravene: PRIPRAVENY_SET, auto: true, set: true },
  dvoj: { kroky: ["vzor", "auto", "farba", "farba2", "rozlozenie", "kufor", "boxy"], povinne: ["auto", "farba", "farba2", "rozlozenie"], posledny: "boxy", nepovinne: [], pripravene: PRIPRAVENY_SET, auto: true, set: true },
  "kufor-classic": { kroky: ["vzor", "auto", "farba"], povinne: ["auto", "farba"], posledny: "farba", nepovinne: [], pripravene: PRIPRAVENA_ROHOZ, auto: true, set: false },
  "kufor-premium": { kroky: ["vzor", "auto", "farba"], povinne: ["auto", "farba"], posledny: "farba", nepovinne: [], pripravene: PRIPRAVENA_ROHOZ, auto: true, set: false },
  boxy: { kroky: ["pocet", "farba", "velkost"], povinne: ["farba", "velkost"], posledny: "velkost", nepovinne: ["box1", "box2", "box3"], pripravene: PRIPRAVENY_BOX, auto: false, set: false },
  vzorky: { kroky: [], povinne: [], posledny: null, nepovinne: [], pripravene: PRIPRAVENY_VZORKOVNIK, auto: false, set: false },
};
export const VSETKY_TYPY = Object.keys(TYPY_TEST);

// sady scenárov (mená = SCENARE v test-konfigurator-1v.mjs a v scenare-<typ>.mjs)
const JEDNO_PLNE = ["brana", "nulova-zmena", "bez-auta", "neuplne", "platne", "ctx-zapis", "kufor-classic", "kufor-premium", "box-1", "box-2", "kufor-nie", "box-nie", "box-krizik", "box-prepni", "rady-3", "k-suhrnu", "miesta-5"];
const ROHOZ_PLNE = ["brana", "nulova-zmena", "bez-auta", "neuplne", "platne", "dokoncit", "k-suhrnu"];
const ROHOZ_ZAKLAD = ["brana", "nulova-zmena", "platne", "dokoncit"];

export const PRODUKTY = {
  // ---------------------------------------------------------------- jednovrstvové
  598: {
    url: SK + "/luxusne-autokoberce-dragonskin-diamond-line/", typ: "jedno", vzor: "diamond", nazov: "Jednovrstvové Diamond",
    scenare: JEDNO_PLNE,
    platne: { priceId: "63493", spolu: 269, odporucana: 440 },
    // docs/1v-kontrakt.md §6 + beh 14. 10. 2026 (a0d3ce8)
    ceny: { platne: 269, "kufor-classic": 363, "kufor-premium": 473, "box-1": 343, "box-2": 551, "kufor-nie": 234, "box-nie": 234, "rady-3": 389 },
    postKluce: "productId priceId language amount [78] [85] [88] [91] [94] [97] [74] [104] (+ parameter-85 po kliku na rádio)",
  },
  613: {
    url: SK + "/luxusne-autokoberce-dragonskin-stripe-line/", typ: "jedno", vzor: "stripe", nazov: "Jednovrstvové Stripe",
    scenare: ["brana", "nulova-zmena", "platne", "kufor-classic", "box-1"],
    platne: { priceId: "66872", spolu: 280, odporucana: null },
    odporucana: false,
    ceny: { platne: 280, "kufor-classic": 374 },
    postKluce: "ako 598",
  },
  610: {
    url: SK + "/luxusne-autokoberce-dragonskin-hexa-line/", typ: "jedno", vzor: "hexa", nazov: "Jednovrstvové Hexa",
    scenare: ["brana", "nulova-zmena", "platne", "kufor-classic", "kufor-nie"],
    platne: { priceId: "59803", spolu: 280, odporucana: 450 },
    ceny: { platne: 280, "kufor-classic": 374 },
    // admin: „autokoberce do kufru: nie“ (88/598) stojí +5 € (598 má +0 €) — D2: ukázať, nie zlyhať. overPost to hlási
    // ako upozornenie pri každej voľbe „nie“ s cenou > 0 (kufor-nie: 230 + 5 + 15 = 250 na starom webe).
    postKluce: "ako 598",
  },
  // ---------------------------------------------------------------- dvojvrstvové
  601: {
    url: SK + "/luxusne-autokoberce-dragonskin-elite-diamond-line/", typ: "dvoj", vzor: "diamond", nazov: "Dvojvrstvové Diamond",
    scenare: [...JEDNO_PLNE, "farba2-prepni"],
    platne: { priceId: "66989", spolu: 416, odporucana: 670 },
    ceny: { platne: 416, "kufor-classic": 495, "box-2": 683 },
    postKluce: "ako 598 + parameterValueId[71] (farba 2. vrstvy, variant: priceId = 71-<lux>-78-<farba>)",
  },
  604: {
    url: SK + "/luxusne-autokoberce-dragonskin-elite-hexa-line/", typ: "dvoj", vzor: "hexa", nazov: "Dvojvrstvové Hexa",
    scenare: ["brana", "nulova-zmena", "neuplne", "platne", "kufor-classic", "box-2"],
    platne: { priceId: "67856", spolu: 432, odporucana: 700 },
    // kufor-classic a box-2: odvodené z produkty-sk.json (plan §4: „ako 601“) — 362 + 129 + 15, 362 + 129 + 99 + 89 + 15
    ceny: { platne: 432, "kufor-classic": 506, "box-2": 694 },
    postKluce: "ako 601",
  },
  607: {
    url: SK + "/luxusne-autokoberce-dragonskin-elite-stripe-line/", typ: "dvoj", vzor: "stripe", nazov: "Dvojvrstvové Stripe",
    scenare: ["brana", "nulova-zmena", "platne", "kufor-classic", "box-2"],
    platne: { priceId: "68003", spolu: 422, odporucana: 680 },
    ceny: { platne: 422, "kufor-classic": 492, "box-2": 660 },
    postKluce: "ako 601 (vlastný cenník príplatkov: kufor 120/210, 2. box 69–114, TYP Combi +10)",
  },
  // ---------------------------------------------------------------- rohože do kufra (len farba 78, žiadny TYP/rozloženie/upsale)
  619: {
    url: SK + "/luxusny-koberced-do-kufra-dragonskin-klasik/", typ: "kufor-classic", vzor: "diamond", nazov: "Rohož Classic Diamond",
    scenare: ROHOZ_PLNE,
    platne: { priceId: "59869", spolu: 230, odporucana: 370 },
    ceny: { platne: 230, dokoncit: 230 },
    postKluce: "productId priceId language amount parameterValueId[78] (živý POST 14. 10. 2026, aj z „Dokončiť konfiguráciu“)",
  },
  625: {
    url: SK + "/luxusny-koberced-do-kufra-dragonskin-klasik-stripe/", typ: "kufor-classic", vzor: "stripe", nazov: "Rohož Classic Stripe",
    scenare: ROHOZ_ZAKLAD,
    platne: { priceId: "66899", spolu: 240, odporucana: null },
    odporucana: false,
    ceny: { platne: 240, dokoncit: 240 },
    postKluce: "ako 619",
  },
  622: {
    url: SK + "/luxusny-koberced-do-kufra-dragonskin-klasik-hexa/", typ: "kufor-classic", vzor: "hexa", nazov: "Rohož Classic Hexa",
    scenare: ROHOZ_ZAKLAD,
    platne: { priceId: "59941", spolu: 240, odporucana: 390 },
    ceny: { platne: 240, dokoncit: 240 },
    postKluce: "ako 619",
  },
  628: {
    url: SK + "/luxusny-koberced-do-kufra-dragonskin-premium/", typ: "kufor-premium", vzor: "diamond", nazov: "Rohož Premium Diamond",
    scenare: ROHOZ_PLNE,
    platne: { priceId: "64282", spolu: 340, odporucana: 550 },
    ceny: { platne: 340, dokoncit: 340 },
    postKluce: "ako 619",
  },
  634: {
    url: SK + "/luxusny-koberced-do-kufra-dragonskin-premium-stripe/", typ: "kufor-premium", vzor: "stripe", nazov: "Rohož Premium Stripe",
    scenare: ROHOZ_ZAKLAD,
    platne: { priceId: "60091", spolu: 350, odporucana: 560 },
    ceny: { platne: 350, dokoncit: 350 },
    postKluce: "ako 619",
  },
  631: {
    url: SK + "/luxusny-koberced-do-kufra-dragonskin-premium-hexa/", typ: "kufor-premium", vzor: "hexa", nazov: "Rohož Premium Hexa",
    scenare: ROHOZ_ZAKLAD,
    platne: { priceId: "60073", spolu: 350, odporucana: 560 },
    ceny: { platne: 350, dokoncit: 350 },
    postKluce: "ako 619",
  },
  // ---------------------------------------------------------------- box do kufra (počet 1–3 + farba 78 + veľkosti 94/97/100)
  616: {
    url: SK + "/luxusny-boxi-do-kufra/", typ: "boxy", vzor: null, nazov: "Box do kufra",
    scenare: ["brana", "nulova-zmena", "neuplne", "platne", "box-pocet-2", "box-pocet-3", "box-3-na-1", "dokoncit", "k-suhrnu"],
    platne: { priceId: "66932", spolu: 207, odporucana: null }, // 1 × M
    odporucana: false,
    ceny: { platne: 207, "box-pocet-2": 429, "box-pocet-3": 643, "box-3-na-1": 197, dokoncit: 207 },
    // živý POST 14. 10. 2026: select boxu, ktorý nie je v počte, ide preč z POST (živý .val(0) -> selectedIndex -1);
    // predvolené „2 ks“ bez kliku nechá 3. box v POST prázdny ([100]=)
    postKluce: "productId priceId language amount parameterValueId[78] surchargeParameterValueId[94] (+ [97] pri 2–3 ks, + [100] pri 3 ks; nepoužitý box v POST chýba)",
    // živý web: klik na „1 ks / 2 ks / 3 ks“ hodí výnimku (creatButtons.js amountChoser volá neexistujúcu priceActualization)
    znameChyby: [/priceActualization is not defined/],
  },
  // ---------------------------------------------------------------- vzorkovník (45 príplatkových selectov, 1 vzorka = 1 parameter)
  637: {
    url: SK + "/vzorkovnik-dragonskin---objednavka-vzoriek/", typ: "vzorky", vzor: null, nazov: "Vzorkovník",
    scenare: ["brana", "nulova-zmena", "platne", "vzorky-0"],
    platne: { priceId: "68380", spolu: 15, odporucana: null, vzorky: ["D-3", "S-2", "LUX-10"] },
    odporucana: false,
    ceny: { platne: 15 },
    // živý POST 14. 10. 2026: všetkých 45 surchargeParameterValueId[NNN]; vybraná vzorka = hodnota „Áno +€5“
    // (staré LUX-01…16 okrem LUX-10 majú „Chcem – vratná záloha 5 €“, starý vzhľad ich ukazuje len ako náhľad),
    // nevybraná = prázdne. Základ 0 €, každá vzorka +5 €.
    postKluce: "productId priceId language amount + 45 × surchargeParameterValueId[NNN] (vybraná = „Áno +€5“, inak prázdne)",
  },
};

/** Iný produkt pre test brány: CZ Diamond (iný projectId 581408) — ?novy=1 nesmie nič zapnúť. */
export const INY = {
  id: 2403, url: "https://www.luxurycardesign.cz/luxusne-autokoberce-dragonskin-diamond-line/", typ: "jedno", vzor: "diamond", nazov: "CZ Diamond (iný projekt)", scenare: [],
};

/** Hlavný produkt typu (plná sada scenárov). */
export const HLAVNY = { jedno: 598, dvoj: 601, "kufor-classic": 619, "kufor-premium": 628, boxy: 616, vzorky: 637 };

export const ALIASY = {
  "jedno-diamond": 598, "jedno-stripe": 613, "jedno-hexa": 610,
  "dvoj-diamond": 601, "dvoj-stripe": 607, "dvoj-hexa": 604,
  "classic-diamond": 619, "classic-stripe": 625, "classic-hexa": 622,
  "kufor-classic-diamond": 619, "kufor-classic-stripe": 625, "kufor-classic-hexa": 622,
  "premium-diamond": 628, "premium-stripe": 634, "premium-hexa": 631,
  "kufor-premium-diamond": 628, "kufor-premium-stripe": 634, "kufor-premium-hexa": 631,
  boxy: 616, box: 616, vzorky: 637, vzorkovnik: 637,
};

/** Poradie produktov (all): hlavné produkty typov skôr, vzorkovník na koniec. */
export const PORADIE = [598, 613, 610, 601, 607, 604, 619, 625, 622, 628, 634, 631, 616, 637];

/** "598,610" | "all" | "typ:dvoj" | "typ:kufor" | alias -> [profil s id]. */
export function vyberProdukty(spec) {
  const out = [];
  const pridaj = (id) => {
    const p = PRODUKTY[id];
    if (!p) throw new Error("neznámy produkt " + id + " (sú: " + PORADIE.join(", ") + ")");
    if (!out.some((x) => x.id === Number(id))) out.push({ id: Number(id), ...p });
  };
  for (const cast of String(spec || "598").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    if (cast === "all" || cast === "vsetky") PORADIE.forEach(pridaj);
    else if (cast.startsWith("typ:")) {
      const typ = cast.slice(4);
      const ids = PORADIE.filter((id) => PRODUKTY[id].typ === typ || PRODUKTY[id].typ.startsWith(typ + "-"));
      if (!ids.length) throw new Error("typ " + typ + " nemá produkty (typy: " + VSETKY_TYPY.join(", ") + ")");
      ids.forEach(pridaj);
    } else if (ALIASY[cast]) pridaj(ALIASY[cast]);
    else if (/^\d+$/.test(cast)) pridaj(cast);
    else throw new Error("--produkt: nepoznám „" + cast + "“ (id, all, typ:<typ>, alias: " + Object.keys(ALIASY).join(", ") + ")");
  }
  return out;
}

/** Profil podľa URL (--url bez --produkt): známy produkt, inak 598-ka s inou adresou. */
export function produktPodlaUrl(url) {
  const cista = String(url).split(/[?#]/)[0];
  const id = PORADIE.find((i) => PRODUKTY[i].url === cista);
  return id ? { id, ...PRODUKTY[id], url } : { id: 598, ...PRODUKTY[598], url };
}
