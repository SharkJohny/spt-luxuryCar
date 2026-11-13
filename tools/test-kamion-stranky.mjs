#!/usr/bin/env node
// Test kópií konfigurátora kamiónov podľa adresy (kniha Brain napady/2026-11-11-kamiony-vsetky-ulohy.md §2.1):
// skrytá kópia s logami (noindex, všetky logá v mriežke motívov) a stránky kamiónov s pevným modelom (predvoľba, nápis,
// H1 z adminu, riadok „Sedí do“, neplatný model, prenos výberu na hlavný produkt a späť). 640 / 2452 sa správajú ako predtým.
// Fixture živej 640 (tools/test-1v/kamion-640.fixture.html) upravená na kópiu: iné ID produktu, adresa, H1, motívy.
//   node tools/test-kamion-stranky.mjs
import { nacitajModul, spustiStranku, stranka, pauza, zvolene, klik } from "./test-1v/kamion-spolocne.mjs";

let ok = 0, zle = 0;
const over = (nazov, podm, detail) => {
  if (podm) { ok++; console.log("  OK   " + nazov); }
  else { zle++; console.log("  ZLE  " + nazov + (detail ? " — " + detail : "")); }
};
const SK = "https://www.luxurycardesign.sk", CZ = "https://www.luxurycardesign.cz";
const LOGA = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "H11", "H12", "H15", "H16", "H17", "H18", "H23", "H24", "H25", "H26", "N1", "N2", "N33"];
const lcdChyby = (ch) => ch.filter((x) => /\[lcd-1v\]|kamion/i.test(x));
const robots = (d) => { const m = d.head.querySelector('meta[name="robots"]'); return m ? m.getAttribute("content") : null; };
const H1 = (d) => ((d.querySelector(".p-detail-inner-header h1") || {}).textContent || "").replace(/\s+/g, " ").trim();

/** Fixture 640 -> kópia: ID produktu, H1, (CZ projekt), motívy log v troch selectoch druhu nášivky, Krátky popis. */
function kopia({ id = 9640, h1 = "luxusné autokoberce do kamionov s logami", cz = false, loga = false, sedi = null, robotsMeta = false } = {}) {
  return (h) => {
    let x = h.replace('"product":{"id":640}', '"product":{"id":' + id + "}").replace('name="productId" value="640"', 'name="productId" value="' + id + '"');
    x = x.replace(/<h1>[\s\S]*?<\/h1>/, "<h1>" + h1 + "</h1>");
    if (cz) x = x.replace('"projectId":562035', '"projectId":581408').replace('"language":"sk"', '"language":"cs"');
    if (loga) {
      let n = 9000;
      [403, 409, 397].forEach((pid) => {
        const re = new RegExp('(<select name="surchargeParameterValueId\\[' + pid + '\\]"[\\s\\S]*?)(</select>)');
        x = x.replace(re, (m, a, b) => a + LOGA.map((k) => '<option value="' + ++n + '" data-surcharge-final-price="0" data-surcharge-additional-price="0">Nášivka ' + k + " +€0</option>").join("") + b);
      });
    }
    if (sedi) x = x.replace(/(<div class="p-short-description"[^>]*>)[\s\S]*?(<\/div>)/, "$1" + sedi + "$2");
    if (robotsMeta) x = x.replace("<title>", '<meta name="robots" content="index,follow"><title>');
    return x;
  };
}
const SEDI = '<p class="lcd-sedi" itemprop="isAccessoryOrSparePartFor" itemscope itemtype="https://schema.org/Vehicle"><span>Sedí do <b itemprop="name">Scania R</b> (<span itemprop="vehicleModelDate">2017</span>–2026) – automatická prevodovka</span><meta itemprop="brand" content="Scania"><meta itemprop="model" content="R"></p>';

// ------------------------------------------------------------------ 1) rozpoznanie adresy (čisté funkcie)
console.log("1) Rozpoznanie adresy — produkty.js, stranky.js, seo-hreflang.js");
{
  const P = await nacitajModul("assets/js/components/konfigurator1v/produkty.js");
  const ST = await nacitajModul("assets/js/components/konfigurator1v/kamion/stranky.js");
  const HL = await nacitajModul("assets/js/seo-hreflang.js");
  const TB = await nacitajModul("assets/js/truck-konfigurator/truck-brands.js");
  for (const proj of [562035, 581408]) {
    for (const cesta of Object.keys(ST.KAMION_STRANKY[proj])) {
      const p = P.produkt1v({ projectId: proj, productId: 9001, language: proj === 581408 ? "cs" : "sk", pathname: cesta });
      const zaz = ST.KAMION_STRANKY[proj][cesta];
      over(proj + " " + cesta + " -> typ kamion (" + (zaz.skryty ? "skrytá" : "pevný model") + ")",
        !!p && p.typ === "kamion" && p.obsah === "kamiony" && p.id === 9001 && p.moduly.join() === "kamion" && p.url === cesta &&
        (zaz.skryty ? p.skryty === true && !p.kamion : !p.skryty && p.kamion && p.kamion.model === zaz.kamion.model), JSON.stringify(p && { typ: p.typ, id: p.id, url: p.url }));
      const q = P.produkt1v({ projectId: proj, productId: 9001, pathname: cesta.toUpperCase().replace(/\/$/, "") + "?utm_source=x#k" });
      over(proj + " " + cesta + " bez lomky, veľkými, s dopytom -> to isté", !!q && q.typ === "kamion");
      if (zaz.kamion) {
        const m = TB.TRUCK_VEHICLES[zaz.kamion.znacka];
        over(proj + " " + cesta + ": model " + zaz.kamion.model + " je v zálohe vozidiel", !!(m && m[zaz.kamion.model]));
        const h = HL.cestyStranky(cesta, proj === 562035);
        // DAF XG ešte nie je v admine (čaká na fotky celej sady) → v seo-hreflang.js zatiaľ bez páru (13. 11. 2026, --zivy 404)
        if (cesta === "/autokoberce-do-kamionu-daf-xg/") over(proj + " " + cesta + ": čakajúca stránka zatiaľ bez hreflang páru", h === null);
        else over(proj + " " + cesta + ": hreflang pár SK = CZ", !!h && h.sk === cesta && h.cz === cesta);
        over(proj + " " + cesta + ": adresa obsahuje „kamion“ (detektory košíka)", /kamion/.test(cesta));
      } else {
        over(proj + " " + cesta + ": skrytá kópia bez hreflang páru", HL.cestyStranky(cesta, proj === 562035) === null);
      }
    }
  }
  over("SK skrytá adresa na CZ projekte -> nič", P.produkt1v({ projectId: 581408, productId: 9001, pathname: "/luxusne-autokoberce-kamiony-1/" }) === null);
  over("neznáma adresa -> nič", P.produkt1v({ projectId: 562035, productId: 9001, pathname: "/autokoberce-do-kamionu-daf-xf/" }) === null);
  const p640 = P.produkt1v({ projectId: 562035, productId: 640, pathname: "/luxusne-autokoberce-kamiony/" });
  const p2452 = P.produkt1v({ projectId: 581408, productId: 2452, pathname: "/luxusni-autokoberce-kamiony/" });
  over("640 bez zmeny (id, url, bez skryty/kamion)", p640 && p640.id === 640 && p640.url === "/luxusne-autokoberce-kamiony/" && !("skryty" in p640) && !("kamion" in p640));
  over("2452 bez zmeny (id, url, bez skryty/kamion)", p2452 && p2452.id === 2452 && p2452.url === "/luxusni-autokoberce-kamiony/" && !("skryty" in p2452) && !("kamion" in p2452));
  over("640 aj na adrese kópie ostáva 640 (register má prednosť)", P.produkt1v({ projectId: 562035, productId: 640, pathname: "/autokoberce-do-kamionu-scania-r/" }).id === 640);
  over("najdiProdukt kamion -> 640 / 2452 (kópie nikdy)", P.najdiProdukt(562035, "kamion").id === 640 && P.najdiProdukt(581408, "kamion").id === 2452);
  over("jeKamionCesta: kópie áno, 640 a iné nie", ST.jeKamionCesta("/autokoberce-do-kamionu-man-tgx/") && ST.jeKamionCesta("/luxusni-autokoberce-kamiony-1") && !ST.jeKamionCesta("/luxusne-autokoberce-kamiony/") && !ST.jeKamionCesta("/"));
  const s = stranka();
  const d = s.document;
  const m = ST.nastavNoindex(d);
  over("nastavNoindex bez robots meta -> pridá noindex, nofollow", m && robots(d) === "noindex, nofollow" && d.head.querySelectorAll('meta[name="robots"]').length === 1);
  const s2 = stranka({ uprav: (h) => h.replace("<title>", '<meta name="robots" content="index,follow"><title>') });
  ST.nastavNoindex(s2.document);
  over("nastavNoindex s „index,follow“ -> prepíše (jeden meta)", robots(s2.document) === "noindex, nofollow" && s2.document.head.querySelectorAll('meta[name="robots"]').length === 1);
  // podkategória skrytej kópie (variant B v a2/POSTUP-ADMIN.md): noindex; inde štýl skrytia odkazov na kópiu aj podkategóriu
  // index.js pri importe siaha na window (moduly 1V) -> import v okne jsdom, potom globály späť
  const okno = stranka().window, G = ["window", "document", "location", "navigator", "sessionStorage", "localStorage", "HTMLElement", "Event"];
  const pred = {};
  G.forEach((k) => { pred[k] = Object.getOwnPropertyDescriptor(globalThis, k); try { Object.defineProperty(globalThis, k, { value: k === "window" ? okno : okno[k], configurable: true, writable: true }); } catch (e) { /* */ } });
  let IX;
  try { IX = await nacitajModul("assets/js/components/konfigurator1v/index.js"); }
  finally { G.forEach((k) => { try { if (pred[k]) Object.defineProperty(globalThis, k, pred[k]); else delete globalThis[k]; } catch (e) { /* */ } }); }
  const sk = stranka();
  over("oznacKopieKamionov: SK podkategória /kamiony-1/ -> noindex", IX.oznacKopieKamionov(sk.document, { hostname: "www.luxurycardesign.sk", pathname: "/kamiony-1/" }) === "noindex" && robots(sk.document) === "noindex, nofollow");
  const cz = stranka();
  over("oznacKopieKamionov: CZ podkategória /kamiony-1/ -> noindex", IX.oznacKopieKamionov(cz.document, { hostname: "www.luxurycardesign.cz", pathname: "/kamiony-1/" }) === "noindex" && robots(cz.document) === "noindex, nofollow");
  const ina = stranka();
  const v = IX.oznacKopieKamionov(ina.document, { hostname: "www.luxurycardesign.sk", pathname: "/autokoberce-do-kamionu/" });
  const st = ina.document.getElementById("lcd-kamion-skryte");
  over("oznacKopieKamionov: kategória kamiónov -> bez noindex, štýl skrytia kópie aj podkategórie", v === "skryte-odkazy" && robots(ina.document) === null && !!st &&
    /luxusne-autokoberce-kamiony-1/.test(st.textContent) && /luxusni-autokoberce-kamiony-1/.test(st.textContent) && /kamiony-1/.test(st.textContent) && /kamiony-1/.test(st.textContent) && !/scania-r/.test(st.textContent));
  const pevna = stranka();
  over("oznacKopieKamionov: stránka kamióna -> nič (ani noindex, ani štýl)", IX.oznacKopieKamionov(pevna.document, { hostname: "www.luxurycardesign.sk", pathname: "/autokoberce-do-kamionu-scania-r/" }) === "kopia" &&
    robots(pevna.document) === null && !pevna.document.getElementById("lcd-kamion-skryte"));
}

// ------------------------------------------------------------------ 2) stav.js: predvoľba, prenos, obnova (čisté funkcie)
console.log("2) stav.js — predvyberPevny, zapisPrenos / nacitajPrenos, obnovStav");
{
  const ST = await nacitajModul("assets/js/components/konfigurator1v/kamion/stav.js");
  const pamat = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
  const st = pamat();
  st.setItem("truckBrand", "DAF (TIR)"); st.setItem("truckModel", "XF106 2017-2021");
  const pv = ST.predvyberPevny({ znacka: "Scania (TIR)", model: "R 2017-2026" }, st);
  over("pevný model má prednosť pred truckBrand / truckModel", pv && pv.znacka === "Scania (TIR)" && pv.model === "R 2017-2026" && pv.typ === "kamion");
  over("výbava iného kamióna sa neprevezme", pv && !pv.polia.sedadlo);
  const st2 = pamat();
  st2.setItem("truckBrand", "Scania (TIR)"); st2.setItem("truckModel", "R 2017-2026"); st2.setItem("truckExtras", JSON.stringify({ sedadlo: "Sedadlo spolujazdca pevné (taburet)", nic: "x" }));
  const pv2 = ST.predvyberPevny({ znacka: "Scania (TIR)", model: "R 2017-2026" }, st2);
  over("výbava toho istého modelu sa prevezme (platná)", pv2 && pv2.polia.sedadlo === "Sedadlo spolujazdca pevné (taburet)" && !("nic" in pv2.polia));
  const zly = ST.predvyberPevny({ znacka: "Scania (TIR)", model: "R 1999-2000" }, pamat());
  over("neplatný model -> len značka", zly && zly.znacka === "Scania (TIR)" && zly.model === null);
  over("neznáma značka -> null", ST.predvyberPevny({ znacka: "Tatra (TIR)", model: "x" }, pamat()) === null);

  const S = ST.novyStav();
  Object.assign(S, { znacka: "Volvo (TIR)", model: "FH4 2013-2021", polia: { prevodovka: "Automatická prevodovka" }, material: "Prémiová syntetická koža – prešívaná", farba: "10", lem: "08",
    nas: "boky", nasBoky: { motiv: "H21", nit: "2824" }, tap: "nie" });
  const st3 = pamat();
  over("zapisPrenos zapíše", ST.zapisPrenos(S, st3, 1000000) === true);
  const ul = JSON.parse(st3.getItem(ST.PRENOS_KLUC));
  over("lcd1vKamionPrenos = { v: 1, cas, S }", ul.v === 1 && ul.cas === 1000000 && ul.S.material === S.material && ul.S.nasBoky.motiv === "H21");
  over("truckBrand / truckModel / truckExtras zapísané", st3.getItem("truckBrand") === "Volvo (TIR)" && st3.getItem("truckModel") === "FH4 2013-2021" && JSON.parse(st3.getItem("truckExtras")).prevodovka === "Automatická prevodovka");
  const S2 = ST.nacitajPrenos(st3, 1000000 + 60000);
  over("nacitajPrenos do 10 minút vráti S a kľúč zmaže", S2 && S2.lem === "08" && st3.getItem(ST.PRENOS_KLUC) === null);
  ST.zapisPrenos(S, st3, 1000000);
  over("prenos starší než 10 minút sa zahodí (a zmaže)", ST.nacitajPrenos(st3, 1000000 + 11 * 60000) === null && st3.getItem(ST.PRENOS_KLUC) === null);
  st3.setItem(ST.PRENOS_KLUC, JSON.stringify({ v: 2, cas: 1000000, S: {} }));
  over("iná verzia sa zahodí", ST.nacitajPrenos(st3, 1000001) === null);
  st3.setItem(ST.PRENOS_KLUC, "{rozbité");
  over("rozbitý JSON nepadne", ST.nacitajPrenos(st3, 1000001) === null);

  const motivy = { boky: ["H19", "H21"], stred: ["H19", "H21"], dvere: ["H19", "H21"] };
  const O = ST.obnovStav(Object.assign({}, S, { nasStred: { motiv: "H5", nit: "9999" }, tapLem: "77" }), { motivy });
  over("obnovStav: vozidlo, materiál, farba, lemovanie, nášivky", O.znacka === "Volvo (TIR)" && O.model === "FH4 2013-2021" && O.material === S.material && O.farba === "10" && O.lem === "08" && O.nas === "boky" && O.nasBoky.motiv === "H21" && O.nasBoky.nit === "2824" && O.tap === "nie");
  over("obnovStav: motív, ktorý stránka neponúka, a neznáma niť -> nič", O.nasStred.motiv === null && O.nasStred.nit === null);
  const O2 = ST.obnovStav({ znacka: "Volvo (TIR)", model: "FH9", material: "Prémiová syntetická koža – prešívaná", farba: "10G", lem: "99", nas: "vsade", nasBoky: { motiv: "H5" } }, { motivy });
  over("obnovStav: neplatný model, farba iného materiálu, lemovanie, voľba nášiviek -> zahodené", O2.znacka === "Volvo (TIR)" && O2.model === null && O2.farba === null && O2.lem === null && O2.nas === null && O2.nasBoky.motiv === null);
  const O3 = ST.obnovStav({ typ: "dodavka", znacka: "Fiat (dodávka)", model: "Ducato 2007-2026", tap: "ano", tapNas: true }, { motivy });
  over("obnovStav: dodávka bez tapacíru", O3.typ === "dodavka" && O3.znacka === "Fiat (dodávka)" && O3.tap === null && O3.tapNas === null);
  over("inyKamion: zmena značky / modelu / typu", ST.inyKamion({ typ: "kamion", znacka: "MAN (TIR)", model: null }, pv) && ST.inyKamion({ typ: "kamion", znacka: "Scania (TIR)", model: "S 2017-2026" }, pv) &&
    !ST.inyKamion({ typ: "kamion", znacka: "Scania (TIR)", model: "R 2017-2026" }, pv));
}

// ------------------------------------------------------------------ 3) skrytá kópia s logami (stránka v jsdom)
console.log("3) Skrytá kópia SK /luxusne-autokoberce-kamiony-1/ (bez flagu = vydané)");
{
  const s = await spustiStranku({ url: SK + "/luxusne-autokoberce-kamiony-1/", uprav: kopia({ loga: true, robotsMeta: true }) });
  const d = s.document;
  over("meta robots = noindex, nofollow", robots(d) === "noindex, nofollow", robots(d));
  over("#lcd1v-kamion postavený, React sa nemontuje", !!d.getElementById("lcd1v-kamion") && !d.getElementById("truck-konfigurator-root"));
  over("H1 ako 640 (text artefaktu)", /do kamiónov a dodávok/.test(H1(d)), H1(d));
  over("6 krokov, bez nápisu pevného modelu", d.querySelectorAll("#lcd1v-kamion .k-krok").length === 6 && !d.querySelector("#lcd1v-kamion .k-pevne"));
  over("bez chýb [lcd-1v]", lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
  const ui = s.kamion.ui;
  Object.assign(ui.S, { znacka: "DAF (TIR)", model: "XF106 2017-2021", polia: { prevodovka: "Automatická prevodovka" }, material: "Prémiová syntetická koža – prešívaná", farba: "10", lem: "08" });
  ui.render();
  ui.otvorKrok("nasivky");
  klik(d, '#lcd1v-kamion [data-a="nas"][data-v="boky"]');
  await pauza(50);
  const dl = Array.from(d.querySelectorAll('#lcd1v-kamion [data-a="motiv"][data-m="boky"]'));
  const kody = dl.map((x) => x.getAttribute("data-v"));
  over("mriežka motívov: všetky logá + H19 + H21 (25)", dl.length === 25 && LOGA.every((k) => kody.includes(k)) && kody.includes("H19") && kody.includes("H21"), kody.join(","));
  const mena = dl.map((x) => { const nm = x.querySelector(".k-dlazdica__nm"), sm = nm.querySelector("small"); return nm.textContent.slice(0, nm.textContent.length - (sm ? sm.textContent.length : 0)); });
  over("každý motív má názov (nie len kód)", mena.every((m, i) => m && m !== kody[i]), mena.join(" | "));
  over("názvy log: Scania – logo, Volvo – viking, Ford – logo, Iveco – S-Way (nedeliteľné)", mena.includes("Scania – logo") && mena.includes("Volvo – viking") && mena.includes("Ford – logo") &&
    mena.includes("Iveco – S-Way") && !!d.querySelector('#lcd1v-kamion [data-a="motiv"][data-v="H26"] .k-nz'));
  over("žiadny Kram-Truck ani lebka v mriežke", !mena.some((m) => /kram|lebka/i.test(m)));
  over("mriežka 5+ motívov má triedu k-dlazdice--vela", !!d.querySelector('#lcd1v-kamion .k-dlazdice--motiv.k-dlazdice--vela'));
  klik(d, '#lcd1v-kamion [data-a="motiv"][data-m="boky"][data-v="H16"]');
  await pauza(50);
  over("logo H16 ide do selectu Shoptetu (boky)", /H16/.test(zvolene(d, 403)), zvolene(d, 403));
}
{
  const s = await spustiStranku({ url: SK + "/luxusne-autokoberce-kamiony-1/?novy=0", uprav: kopia({ h1: "Test kópie", loga: true }) });
  const d = s.document;
  over("?novy=0: React aj na kópii (H1 bez slova kamión) a noindex platí aj tak", !!d.querySelector('#truck-konfigurator-root[data-tk-mounted="1"]') && robots(d) === "noindex, nofollow");
}

// ------------------------------------------------------------------ 4) 640 a 2452 bez zmeny
console.log("4) 640 bez zmeny");
{
  const s = await spustiStranku({ url: SK + "/luxusne-autokoberce-kamiony/", uprav: kopia({ id: 640, h1: "luxusné autokoberce do kamionov", robotsMeta: true }) });
  const d = s.document;
  over("meta robots ostáva index,follow", robots(d) === "index,follow", robots(d));
  over("H1 = text artefaktu, bez nápisu pevného modelu", /do kamiónov a dodávok/.test(H1(d)) && !d.querySelector("#lcd1v-kamion .k-pevne"));
  over("krok Vozidlo otvorený, vozidlo prázdne", s.kamion.ui.U.otvoreny === "vozidlo" && s.kamion.ui.S.znacka === null);
  over("motívy len H19 a H21 (zo selectov)", (() => {
    const ui = s.kamion.ui;
    Object.assign(ui.S, { znacka: "DAF (TIR)", model: "XF106 2017-2021", polia: { prevodovka: "Automatická prevodovka" }, material: "Prémiová syntetická koža – prešívaná", farba: "10", lem: "08" });
    ui.render(); ui.otvorKrok("nasivky"); klik(d, '#lcd1v-kamion [data-a="nas"][data-v="boky"]');
    return Array.from(d.querySelectorAll('#lcd1v-kamion [data-a="motiv"][data-m="boky"]')).map((x) => x.getAttribute("data-v")).join() === "H19,H21";
  })());
  over("štýl skrytia dlaždíc kópie v zoznamoch je v hlave", !!d.getElementById("lcd-kamion-skryte") && /kamiony-1/.test(d.getElementById("lcd-kamion-skryte").textContent));
  over("bez chýb [lcd-1v]", lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
}

// ------------------------------------------------------------------ 5) stránka kamióna s pevným modelom
console.log("5) Stránka kamióna SK /autokoberce-do-kamionu-scania-r/");
const URL_SCANIA = SK + "/autokoberce-do-kamionu-scania-r/";
const UPRAV_SCANIA = kopia({ id: 9650, h1: "Autokoberce do kamiónu Scania R", sedi: SEDI, robotsMeta: true });
{
  const s = await spustiStranku({ url: URL_SCANIA, uprav: UPRAV_SCANIA, session: { truckBrand: "DAF (TIR)", truckModel: "XF106 2017-2021" } });
  const d = s.document, ui = s.kamion && s.kamion.ui;
  over("#lcd1v-kamion postavený, bez chýb", !!ui && lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
  over("značka + model predvyplnené (prednosť pred truckBrand)", ui.S.znacka === "Scania (TIR)" && ui.S.model === "R 2017-2026");
  over("selecty značky a modelu ukazujú Scania R", d.querySelector('#lcd1v-kamion select[data-p="znacka"]').value === "Scania (TIR)" && d.querySelector('#lcd1v-kamion select[data-p="model"]').value === "R 2017-2026");
  over("krok Vozidlo otvorený", ui.U.otvoreny === "vozidlo");
  const pv = d.querySelector('#lcd1v-kamion [data-krok="vozidlo"] .k-pevne');
  over("nápis „Predvyplnené pre Scania R“ + text o prenose", !!pv && /Predvyplnené pre Scania R/.test(pv.textContent) && /prenesieme Vás do konfigurátora pre všetky kamióny/.test(pv.textContent), pv && pv.textContent);
  over("H1 = názov produktu (neprepísaný)", H1(d) === "Autokoberce do kamiónu Scania R", H1(d));
  const sedi = d.querySelector("#lcd1v-kamion .p-short-description.k-sedi .lcd-sedi");
  const hodn = d.querySelector("#lcd1v-kamion .k-hodn");
  over("riadok „Sedí do“ v hlavičke hneď pod hodnotením", !!sedi && !!hodn && hodn.nextElementSibling === sedi.parentNode);
  over("meta robots ostáva index,follow (stránka je pre Google)", robots(d) === "index,follow");
  over("sessionStorage bez prenosu (nič sa nezmenilo)", s.window.sessionStorage.getItem("lcd1vKamionPrenos") === null);
  // zmena výbavy (nie vozidla) nič neprenáša
  const sel = d.querySelector('#lcd1v-kamion select[data-p="sedadlo"]');
  if (sel) { sel.value = sel.options[1].value; sel.dispatchEvent(new s.window.Event("change", { bubbles: true })); }
  over("zmena výbavy -> bez prenosu", !!sel && s.window.sessionStorage.getItem("lcd1vKamionPrenos") === null);
  // návrat (poistka): Sedí do späť do stĺpca
  s.ctx.zlozit();
  await pauza(100);
  over("zlozit(): „Sedí do“ späť v .p-info-wrapper, React namontovaný", !!d.querySelector(".p-info-wrapper > .p-short-description .lcd-sedi") && !!d.querySelector('#truck-konfigurator-root[data-tk-mounted="1"]'));
}
{
  console.log("5b) Myšou iná značka -> prenos na hlavný produkt");
  const s = await spustiStranku({ url: URL_SCANIA, uprav: UPRAV_SCANIA });
  const d = s.document, ui = s.kamion.ui, w = s.window;
  ui.S.material = "Prémiová syntetická koža – prešívaná"; // výber z kroku 2 (karta materiálu je v zatvorenom kroku)
  const z = d.querySelector('#lcd1v-kamion select[data-p="znacka"]');
  z.value = "Volvo (TIR)";
  z.dispatchEvent(new w.Event("change", { bubbles: true }));
  await pauza(30);
  const p = JSON.parse(w.sessionStorage.getItem("lcd1vKamionPrenos") || "null");
  over("prenos zapísaný hneď (v: 1, S so značkou a materiálom)", !!p && p.v === 1 && p.S.znacka === "Volvo (TIR)" && p.S.model === null && p.S.material === "Prémiová syntetická koža – prešívaná", JSON.stringify(p));
  over("truckBrand = Volvo, truckModel zmazaný", w.sessionStorage.getItem("truckBrand") === "Volvo (TIR)" && w.sessionStorage.getItem("truckModel") === null);
  over("bez chýb [lcd-1v]", lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
}
{
  console.log("5c) Prepínač Dodávka -> prenos");
  const s = await spustiStranku({ url: URL_SCANIA, uprav: UPRAV_SCANIA });
  klik(s.document, '#lcd1v-kamion [data-a="typ"][data-v="dodavka"]');
  await pauza(30);
  const p = JSON.parse(s.window.sessionStorage.getItem("lcd1vKamionPrenos") || "null");
  over("prenos s typom dodávka a bez vozidla", !!p && p.S.typ === "dodavka" && p.S.znacka === null);
}
{
  console.log("5d) Z klávesnice: prenos až po opustení polí vozidla");
  const s = await spustiStranku({ url: URL_SCANIA, uprav: UPRAV_SCANIA });
  const d = s.document, w = s.window;
  let m = d.querySelector('#lcd1v-kamion select[data-p="model"]');
  m.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  m.value = "S 2017-2026";
  m.dispatchEvent(new w.Event("change", { bubbles: true }));
  await pauza(30);
  over("šípka v zozname modelu -> ešte bez prenosu", w.sessionStorage.getItem("lcd1vKamionPrenos") === null && s.kamion.ui.S.model === "S 2017-2026");
  m = d.querySelector('#lcd1v-kamion select[data-p="model"]');
  const z = d.querySelector('#lcd1v-kamion select[data-p="znacka"]');
  m.dispatchEvent(new w.FocusEvent("focusout", { bubbles: true, relatedTarget: z }));
  await pauza(400);
  over("presun na pole značky -> stále bez prenosu", w.sessionStorage.getItem("lcd1vKamionPrenos") === null);
  z.dispatchEvent(new w.FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
  await pauza(400);
  const p = JSON.parse(w.sessionStorage.getItem("lcd1vKamionPrenos") || "null");
  over("odchod z polí vozidla -> prenos (model S)", !!p && p.S.model === "S 2017-2026");
}
{
  console.log("5e) Z klávesnice tam a späť na ten istý model -> bez prenosu");
  const s = await spustiStranku({ url: URL_SCANIA, uprav: UPRAV_SCANIA });
  const d = s.document, w = s.window;
  for (const v of ["S 2017-2026", "R 2017-2026"]) {
    const m = d.querySelector('#lcd1v-kamion select[data-p="model"]');
    m.dispatchEvent(new w.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    m.value = v;
    m.dispatchEvent(new w.Event("change", { bubbles: true }));
    await pauza(20);
  }
  d.querySelector('#lcd1v-kamion select[data-p="model"]').dispatchEvent(new w.FocusEvent("focusout", { bubbles: true, relatedTarget: null }));
  await pauza(400);
  over("späť na R 2017-2026 -> bez prenosu", w.sessionStorage.getItem("lcd1vKamionPrenos") === null && s.kamion.ui.S.model === "R 2017-2026");
}
{
  console.log("5f) Model, ktorý v ponuke nie je (tabuľka sa zmenila) -> len značka");
  const s = await spustiStranku({
    url: URL_SCANIA, uprav: UPRAV_SCANIA,
    vstup: 'import { KAMION_STRANKY } from "./assets/js/components/konfigurator1v/kamion/stranky.js"; KAMION_STRANKY[562035]["/autokoberce-do-kamionu-scania-r/"].kamion.model = "R 1999-2000";\n',
  });
  const ui = s.kamion && s.kamion.ui;
  over("značka Scania, model prázdny, bez chýb", !!ui && ui.S.znacka === "Scania (TIR)" && ui.S.model === null && lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
}

// ------------------------------------------------------------------ 6) prenos späť na hlavný produkt
console.log("6) Hlavný produkt 640 obnoví prenesený výber");
{
  const S = { typ: "kamion", znacka: "Volvo (TIR)", model: "FH4 2013-2021", polia: { prevodovka: "Automatická prevodovka" }, material: "Prémiová syntetická koža – prešívaná", farba: "10", lem: "08",
    nas: "boky", nasBoky: { motiv: "H21", nit: "2824" }, nasStred: { motiv: "H5", nit: null }, stredRovnaky: true, tap: "nie", tapRovnaky: true, tapMat: null, tapFarba: null, tapLem: null,
    tapNas: null, tapNasRovnaka: true, tapNasMotiv: null, tapNasNit: null };
  const prenos = JSON.stringify({ v: 1, cas: Date.now(), S });
  const s = await spustiStranku({ url: SK + "/luxusne-autokoberce-kamiony/", session: { lcd1vKamionPrenos: prenos, truckBrand: "Volvo (TIR)", truckModel: "FH4 2013-2021" } });
  const d = s.document, ui = s.kamion && s.kamion.ui;
  over("výber obnovený (vozidlo, materiál, farba, lemovanie, nášivky, tapacír)", !!ui && ui.S.znacka === "Volvo (TIR)" && ui.S.model === "FH4 2013-2021" && ui.S.material === S.material && ui.S.farba === "10" &&
    ui.S.lem === "08" && ui.S.nas === "boky" && ui.S.nasBoky.motiv === "H21" && ui.S.nasBoky.nit === "2824" && ui.S.tap === "nie");
  over("motív, ktorý 640 neponúka, zahodený", ui.S.nasStred.motiv === null);
  over("kľúč prenosu zmazaný", s.window.sessionStorage.getItem("lcd1vKamionPrenos") === null);
  over("všetky kroky hotové (nič otvorené)", ui.hotovo() && ui.U.otvoreny === null, "otvorený " + ui.U.otvoreny);
  over("selecty Shoptetu: materiál a nášivka na boky", /prešívaná/.test(zvolene(d, 346)) && /H21/.test(zvolene(d, 403)), zvolene(d, 346) + " / " + zvolene(d, 403));
  over("H1 = text artefaktu, bez nápisu pevného modelu", /do kamiónov a dodávok/.test(H1(d)) && !d.querySelector("#lcd1v-kamion .k-pevne"));
  over("bez chýb [lcd-1v]", lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
}
{
  const S = { znacka: "MAN (TIR)", model: null, material: "Prémiová syntetická koža – prešívaná" };
  const s = await spustiStranku({ url: SK + "/luxusne-autokoberce-kamiony/", session: { lcd1vKamionPrenos: JSON.stringify({ v: 1, cas: Date.now(), S }) } });
  const ui = s.kamion.ui;
  over("prenos so značkou bez modelu: krok Vozidlo otvorený, materiál ostal", ui.S.znacka === "MAN (TIR)" && ui.S.model === null && ui.U.otvoreny === "vozidlo" && ui.S.material === S.material);
}
{
  const s = await spustiStranku({ url: SK + "/luxusne-autokoberce-kamiony/", session: { lcd1vKamionPrenos: JSON.stringify({ v: 1, cas: Date.now() - 11 * 60000, S: { znacka: "MAN (TIR)", material: "Prémiová syntetická koža – prešívaná" } }) } });
  over("starý prenos (11 min) sa neobnoví a zmaže", s.kamion.ui.S.znacka === null && s.kamion.ui.S.material === null && s.window.sessionStorage.getItem("lcd1vKamionPrenos") === null);
}
{
  const s = await spustiStranku({ url: URL_SCANIA, uprav: UPRAV_SCANIA, session: { lcd1vKamionPrenos: JSON.stringify({ v: 1, cas: Date.now(), S: { znacka: "MAN (TIR)" } }) } });
  over("stránka kamióna prenos neberie (pevný model)", s.kamion.ui.S.znacka === "Scania (TIR)");
}

// ------------------------------------------------------------------ 7) CZ
console.log("7) CZ kópie");
{
  const s = await spustiStranku({ url: CZ + "/autokoberce-do-kamionu-scania-r/", uprav: kopia({ id: 2470, h1: "Autokoberce do kamionu Scania R", cz: true, sedi: SEDI }) });
  const d = s.document, ui = s.kamion && s.kamion.ui;
  over("CZ stránka kamióna: typ kamion, Scania R predvyplnená", !!ui && ui.S.znacka === "Scania (TIR)" && ui.S.model === "R 2017-2026", lcdChyby(s.chyby).join(" | "));
  const pv = d.querySelector("#lcd1v-kamion .k-pevne");
  over("CZ nápis „Předvyplněno pro Scania R“", !!pv && /Předvyplněno pro Scania R/.test(pv.textContent) && /přeneseme Vás do konfigurátoru pro všechny kamiony/.test(pv.textContent), pv && pv.textContent);
  over("CZ H1 = názov produktu", H1(d) === "Autokoberce do kamionu Scania R", H1(d));
  const z = d.querySelector('#lcd1v-kamion select[data-p="znacka"]');
  z.value = "MAN (TIR)";
  z.dispatchEvent(new s.window.Event("change", { bubbles: true }));
  await pauza(30);
  const p = JSON.parse(s.window.sessionStorage.getItem("lcd1vKamionPrenos") || "null");
  over("CZ prenos zapísaný", !!p && p.S.znacka === "MAN (TIR)");
}
{
  const s = await spustiStranku({ url: CZ + "/luxusni-autokoberce-kamiony-1/", uprav: kopia({ id: 2471, h1: "luxusní autokoberce do kamionů s logy", cz: true, loga: true }) });
  over("CZ skrytá kópia: noindex + konfigurátor", robots(s.document) === "noindex, nofollow" && !!s.document.getElementById("lcd1v-kamion"), lcdChyby(s.chyby).join(" | "));
}

// ------------------------------------------------------------------ 8) všetky stránky kamiónov (vlny 1–3) SK aj CZ
// Kniha Brain napady/2026-11-12-kamiony-vlna-2-3-disk-a-odpov.md §2.1–2.2: pre každú adresu predvyplnenie značky a modelu,
// selecty a nápis „Predvyplnené pre …“ / „Předvyplněno pro …“. Produkty vlny 2–3 ešte neexistujú — test beží na fixture.
console.log("8) Všetky stránky kamiónov SK aj CZ — predvyplnenie a nápis");
{
  const ST = await nacitajModul("assets/js/components/konfigurator1v/kamion/stranky.js");
  const pevne = (proj) => Object.keys(ST.KAMION_STRANKY[proj]).filter((c) => ST.KAMION_STRANKY[proj][c].kamion);
  over("20 stránok kamiónov na SK aj CZ, tie isté adresy", pevne(562035).length === 20 && pevne(581408).length === 20 &&
    pevne(562035).slice().sort().join() === pevne(581408).slice().sort().join(), pevne(562035).length + " / " + pevne(581408).length);
  // CSV plánu (mimo repa): ak je na disku, adresy, modely a názvy vĺn 2–3 sa musia zhodovať (vlna 1 má názvy z 11. 11.)
  const CSV = "C:/Users/M/Desktop/kamiony/plan-2026-11-11/a3/plan-35-modelov.csv";
  const { existsSync, readFileSync } = await import("node:fs");
  if (existsSync(CSV)) {
    const riadky = readFileSync(CSV, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
    const hl = riadky[0].split(";");
    const rozdel = (l) => { const o = []; let c = "", q = false; for (const ch of l) { if (ch === '"') { q = !q; continue; } if (ch === ";" && !q) { o.push(c); c = ""; continue; } c += ch; } o.push(c); return o; };
    const zaz = riadky.slice(1).map((l) => { const v = rozdel(l); const o = {}; hl.forEach((k, i) => { o[k] = v[i]; }); return o; }).filter((r) => ["1", "2", "3"].includes(r.vlna));
    const chyby = [];
    for (const r of zaz) {
      for (const [proj, pred] of [[562035, /^Autokoberce do kamiónu /], [581408, /^Autokoberce do kamionu /]]) {
        const z = ST.KAMION_STRANKY[proj][r.slug];
        if (!z || !z.kamion) { chyby.push(proj + " chýba " + r.slug); continue; }
        if (z.kamion.znacka !== r.znacka + " (TIR)" || z.kamion.model !== r.model_tabulka) chyby.push(proj + " " + r.slug + " vozidlo " + z.kamion.znacka + " / " + z.kamion.model);
        const naz = (proj === 562035 ? r.nazov_sk : r.nazov_cz).replace(pred, "");
        if (r.vlna !== "1" && z.kamion.nazov !== naz) chyby.push(proj + " " + r.slug + " názov „" + z.kamion.nazov + "“ ≠ „" + naz + "“");
      }
    }
    over("zhoda s a3/plan-35-modelov.csv (" + zaz.length + " riadkov vĺn 1–3: adresa, značka, model; názov pri vlne 2–3)", zaz.length === 20 && chyby.length === 0, chyby.join(" | "));
  } else console.log("  (CSV plánu nie je na disku — zhoda s plánom preskočená)");
  for (const [proj, web, cz] of [[562035, SK, false], [581408, CZ, true]]) {
    let n = 0;
    for (const cesta of pevne(proj)) {
      const k = ST.KAMION_STRANKY[proj][cesta].kamion;
      const s = await spustiStranku({ url: web + cesta, uprav: kopia({ id: 9700 + ++n, h1: "Autokoberce do kamiónu " + k.nazov, cz }), cakaj: 120 });
      const d = s.document, ui = s.kamion && s.kamion.ui;
      const zs = d.querySelector('#lcd1v-kamion select[data-p="znacka"]'), ms = d.querySelector('#lcd1v-kamion select[data-p="model"]');
      const pv = d.querySelector('#lcd1v-kamion [data-krok="vozidlo"] .k-pevne');
      const napis = cz ? "Předvyplněno pro " + k.nazov : "Predvyplnené pre " + k.nazov;
      over((cz ? "CZ " : "SK ") + cesta + ": " + k.znacka + " / " + k.model + " predvyplnené, nápis „" + napis + "“",
        !!ui && ui.S.znacka === k.znacka && ui.S.model === k.model && !!zs && zs.value === k.znacka && !!ms && ms.value === k.model &&
        ui.U.otvoreny === "vozidlo" && !!pv && pv.textContent.indexOf(napis) > -1 && lcdChyby(s.chyby).length === 0 && !/^Autokoberce/i.test(k.nazov),
        JSON.stringify({ S: ui && [ui.S.znacka, ui.S.model], sel: [zs && zs.value, ms && ms.value], napis: pv && pv.textContent.slice(0, 80), chyby: lcdChyby(s.chyby).slice(0, 2) }));
    }
  }
}

// ------------------------------------------------------------------ 9) motívy nášiviek: stránky kamiónov len H19 a H21 (kniha 2.5)
console.log("9) Motívy nášiviek — stránka kamióna len H19 a H21, skrytá kópia všetky");
{
  const SH = await nacitajModul("assets/js/components/konfigurator1v/kamion/shoptet.js");
  const DT = await nacitajModul("assets/js/components/konfigurator1v/kamion/data.js");
  over("NASIVKY_VEREJNE = H19, H21", DT.NASIVKY_VEREJNE.join() === "H19,H21");
  const vsetky = { boky: ["H1", "H21", "N2", "H19"], stred: ["H16", "H19"], dvere: ["H5"] };
  const o = SH.obmedzMotivy(vsetky, DT.NASIVKY_VEREJNE);
  over("obmedzMotivy: poradie povolených, nič navyše, prázdny prienik = []", o.boky.join() === "H19,H21" && o.stred.join() === "H19" && o.dvere.length === 0 && !SH.obmedzMotivy({}, ["H19"]).boky.length);

  const motivyNa = async (d, ui, kluc, nas) => {
    Object.assign(ui.S, { znacka: "Scania (TIR)", model: "R 2017-2026", polia: { prevodovka: "Automatická prevodovka", sedadlo: "Sedadlo spolujazdca pevné (taburet)" }, material: "Prémiová syntetická koža – prešívaná", farba: "10", lem: "08", nas: null });
    ui.U.znova = {}; ui.render(); ui.otvorKrok("nasivky"); klik(d, '#lcd1v-kamion [data-a="nas"][data-v="' + nas + '"]');
    await pauza(50);
    return Array.from(d.querySelectorAll('#lcd1v-kamion [data-a="motiv"][data-m="' + kluc + '"]')).map((x) => x.getAttribute("data-v"));
  };
  for (const [web, cz] of [[SK, false], [CZ, true]]) {
    const s = await spustiStranku({ url: web + "/autokoberce-do-kamionu-scania-r/", uprav: kopia({ id: 9660, h1: "Autokoberce do kamiónu Scania R", cz, loga: true }), cakaj: 120 });
    const d = s.document, ui = s.kamion && s.kamion.ui;
    const ozn = cz ? "CZ " : "SK ";
    if (!ui) { over(ozn + "stránka kamióna so selectmi s logami sa postavila", false, lcdChyby(s.chyby).join(" | ")); continue; }
    const stred = await motivyNa(d, ui, "stred", "stred");
    const boky = await motivyNa(d, ui, "boky", "boky");
    over(ozn + "stránka kamióna (selecty majú 25 motívov): boky len H19, H21", boky.join() === "H19,H21", boky.join());
    over(ozn + "stránka kamióna: stred len H19, H21", stred.join() === "H19,H21", stred.join());
    klik(d, '#lcd1v-kamion [data-a="motiv"][data-m="boky"][data-v="H21"]');
    await pauza(50);
    over(ozn + "do košíka ide len H21 (select boky)", /H21/.test(zvolene(d, 403)) && !LOGA.some((k) => new RegExp("\b" + k + "\b").test(zvolene(d, 403))), zvolene(d, 403));
    over(ozn + "tlačidlo loga H1 na stránke kamióna neexistuje, select ostáva H21", !d.querySelector('#lcd1v-kamion [data-a="motiv"][data-v="H1"]') && /H21/.test(zvolene(d, 403)), zvolene(d, 403));
    const vsade = Array.from(d.querySelectorAll('#lcd1v-kamion [data-a="motiv"]')).map((x) => x.getAttribute("data-v"));
    over(ozn + "v celej mriežke ani jedno logo značky", vsade.length > 0 && vsade.every((k) => k === "H19" || k === "H21"), vsade.join());
  }
  // dvere (krok Tapacír): rovnaké obmedzenie
  {
    const s = await spustiStranku({ url: SK + "/autokoberce-do-kamionu-scania-r/", uprav: kopia({ id: 9661, h1: "Autokoberce do kamiónu Scania R", loga: true }), cakaj: 120 });
    const d = s.document, ui = s.kamion && s.kamion.ui;
    Object.assign(ui.S, { znacka: "Scania (TIR)", model: "R 2017-2026", polia: { prevodovka: "Automatická prevodovka", sedadlo: "Sedadlo spolujazdca pevné (taburet)" }, material: "Prémiová syntetická koža – prešívaná", farba: "10", lem: "08", nas: "nechcem", tap: "ano", tapNas: true, tapNasRovnaka: false, tapRovnaky: true, tapMat: "Prémiová syntetická koža – prešívaná", tapFarba: "10", tapLem: "08" });
    ui.U.znova = { tapacir: "dvere" }; ui.U.n6 = { matOdp: true, mat: true, nasOdp: true, nas: false }; ui.render(); ui.otvorKrok("tapacir"); await pauza(50);
    const dvere = Array.from(d.querySelectorAll('#lcd1v-kamion [data-a="motiv"][data-m="dvere"]')).map((x) => x.getAttribute("data-v"));
    over("SK stránka kamióna: dvere len H19, H21", dvere.join() === "H19,H21", dvere.join() || "mriežka dverí sa nezobrazila");
  }
  // prázdny prienik: selecty majú len logá -> žiadne logo v mriežke
  {
    const bezH = (h) => kopia({ id: 9662, h1: "Autokoberce do kamiónu Scania R", loga: true })(h).replace(/(<option[^>]*>)Nášivka (H19|H21) /g, "$1Nášivka X$2 ");
    const s = await spustiStranku({ url: SK + "/autokoberce-do-kamionu-scania-r/", uprav: bezH, cakaj: 120 });
    const d = s.document, ui = s.kamion && s.kamion.ui;
    const kody = ui ? await motivyNa(d, ui, "boky", "boky") : ["?"];
    over("prázdny prienik: žiadne logo v mriežke", !!ui && !kody.some((k) => LOGA.includes(k)), kody.join());
  }
  // skrytá kópia: všetkých 25
  {
    const s = await spustiStranku({ url: SK + "/luxusne-autokoberce-kamiony-1/", uprav: kopia({ loga: true }) });
    const kody = await motivyNa(s.document, s.kamion.ui, "boky", "boky");
    over("skrytá kópia: všetkých 25 motívov", kody.length === 25 && LOGA.every((k) => kody.includes(k)), kody.join());
  }
  // 640 so selectmi s logami: bez zmeny
  {
    const s = await spustiStranku({ url: SK + "/luxusne-autokoberce-kamiony/", uprav: kopia({ id: 640, h1: "luxusné autokoberce do kamionov", loga: true }) });
    const kody = await motivyNa(s.document, s.kamion.ui, "boky", "boky");
    over("640 so selectmi s logami: motívy podľa selectov (25, bez zmeny)", kody.length === 25, kody.join());
  }
}

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
