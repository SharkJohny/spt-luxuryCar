#!/usr/bin/env node
// Jednotkové testy ďakovnej stránky (assets/js/opc/dakujeme.js, návrh „4 – Prémiový s platbou hore“) v jsdom, bez siete.
// Fixtures = REKONŠTRUKCIA (tools/test-opc/dakujeme-fixtures.mjs), skutočné HTML ďakovnej stránky nemáme.
//   node tools/test-opc-dakujeme.mjs
// Pokrýva: bránu (bez kódu nič: DOM bez zmeny, žiadne požiadavky, globály ani záznam; ?opc=0; data.json "opc": false),
// čítanie údajov podľa popisov (aj iné značky a poradie), stavy prevod / neprebehla / dobierka SK aj CZ, karta bez
// jednoznačného výsledku (zaplatené podľa textu, PENDING, veta o objednávke, zápor, neúspech bez tlačidla) = pôvodná stránka,
// tlačidlo platby (texty, formulár na bránu), suma = práve jedna cena s menou, dva rôzne účty/VS/sumy/čísla = pôvodná
// stránka (revízia 31. 10. 2026), kamión a vzorkovník, fallback pri chýbajúcich údajoch (nič sa neskryje), záznam do localStorage (posledných 5,
// bez skriptov, adresa bez query), kopírovanie (Clipboard API, záloha execCommand, označenie pri neúspechu), zakázané
// slová, CSS len pod html.lcd-opc-dakujeme*, rozpis položky = ul.lcd-rozpis (kosikRozpis.js).
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { VARIANTY, ocakavane, strankaJsdom, CESTY } from "./test-opc/dakujeme-fixtures.mjs";

// globálne prostredie ako v prehliadači (index.js číta window/document/localStorage pri volaní)
const prvy = new JSDOM("<!doctype html><html><body class=\"id--9 in-kosik\"></body></html>", { url: "https://www.luxurycardesign.sk/kosik/" });
const nastavGlobaly = (w) => {
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.DOMParser = w.DOMParser;
  globalThis.sessionStorage = w.sessionStorage;
  globalThis.localStorage = w.localStorage;
  globalThis.location = w.location;
};
nastavGlobaly(prvy.window);

const B = await import("../assets/js/opc/index.js");
const D = await import("../assets/js/opc/dakujeme.js");
const { TEXTY_DAKUJEME } = await import("../assets/js/opc/dakujemeTexty.js");
const { lcdRozpis } = await import("../assets/js/functions/kosikRozpis.js");

let ok = 0, zle = 0;
const asyncTesty = [];
const t = (n, f) => {
  try {
    const r = f();
    if (r && typeof r.then === "function") { asyncTesty.push(r.then(() => { ok++; console.log("OK   " + n); }, (e) => { zle++; console.log("FAIL " + n + " — " + e.message); })); return; }
    ok++; console.log("OK   " + n);
  } catch (e) { zle++; console.log("FAIL " + n + " — " + e.message); }
};
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m ? m + ": " : "") + JSON.stringify(a) + " ≠ " + JSON.stringify(b)); };
const over = (p, m) => { if (!p) throw new Error(m); };
const cakaj = (ms) => new Promise((r) => setTimeout(r, ms));
const txt = (e) => (e ? e.textContent.replace(/[\s ]+/g, " ").trim() : null);
const PROJEKT = { sk: 562035, cz: 581408 };
const BASE = { sk: "https://www.luxurycardesign.sk", cz: "https://www.luxurycardesign.cz" };

/** Ďakovná stránka variantu v jsdom ako globálne okno. o: { hladanie: "?opc=…", flag: "1"|null, telo, cesta } */
function prostredie(kluc, o = {}) {
  const v = VARIANTY[kluc];
  const dom = new JSDOM(strankaJsdom(kluc, { telo: o.telo }), { url: BASE[v.web] + (o.cesta || CESTY[v.web]) + (o.hladanie || ""), pretendToBeVisual: true });
  const w = dom.window;
  w.dataLayer = [{ shoptet: { projectId: PROJEKT[v.web], language: v.web === "cz" ? "cs" : "sk", pageType: o.pageType || "thankYou" } }];
  // skript Shoptetu vnútri hlavného obsahu (záznam ho nesmie uložiť)
  const s = w.document.createElement("script");
  s.textContent = "window.__shoptetVnutri = 1;";
  w.document.getElementById("content").appendChild(s);
  if (o.flag) w.localStorage.setItem("lcdOpc", o.flag);
  nastavGlobaly(w);
  return { dom, w, doc: w.document, v };
}
const ZAKAZANE = /z[aá]loh|21\s*[–-]\s*29|\bdn[ií]\b|dodan|dodán|vyr[aá]b|\bDPH\b|z[aá]ruk|IBAN|na milimeter|na milimetr/i;

// ------------------------------------------------------------------ čisté funkcie
t("adresa: /objednavka/dekujeme/ aj SK /objednavka/dakujeme/ (aj bez lomky); kroky a košík nie", () => {
  eq(["/objednavka/dekujeme/", "/objednavka/dakujeme/", "/objednavka/dekujeme", "/objednavka/krok-2/", "/kosik/", "/dekujeme/"].map(D.jeCestaDakujeme),
    [true, true, true, false, false, false]);
});
t("popisy Shoptetu SK aj CZ (s dvojbodkou, bez diakritiky); nadpisy blokov nie sú popis", () => {
  eq(["Zvolená platba", "Zvolená doprava", "Částka k úhradě", "Suma na úhradu", "Bankovní účet", "Bankový účet:", "Variabilný symbol:", "Číslo", "Číslo objednávky",
    "Platba a doručení", "Obsah objednávky", "Převodem", "20 006 Kč"].map(D.klucPopisu),
  ["platba", "doprava", "suma", "suma", "ucet", "ucet", "vs", "cislo", "cislo", null, null, null, null]);
});
t("spôsob platby podľa názvu Shoptetu (krok 1 SK aj CZ)", () => {
  eq(["Převodem", "Prevodom", "Dobírka", "Dobierkou", "Online platba kartou", "Apple Pay", "Google Pay", "Rýchla platba cez banku", "Hotově na prodejně", ""].map(D.druhPlatby),
    ["prevod", "prevod", "dobierka", "dobierka", "karta", "online", "online", "online", null, null]);
});
t("výsledok platby z textu: „neproběhla“ nie je úspech, „úspěšně přijata“ áno", () => {
  eq(D.vysledokTextu("Platba neproběhla."), { uspech: false, neuspech: true, caka: false });
  eq(D.vysledokTextu("Platba neprebehla, skúste znova"), { uspech: false, neuspech: true, caka: false });
  eq(D.vysledokTextu("Platba byla úspěšně přijata."), { uspech: true, neuspech: false, caka: false });
  eq(D.vysledokTextu("Zvolená platba Online platba kartou Částka k úhradě 20 006 Kč Rekapitulaci Vám zašleme i e-mailem. Děkujeme!"), { uspech: false, neuspech: false, caka: false });
});
// revízia 31. 10. 2026 (N1, K1, K2): úspech LEN pri vete o PLATBE v minulom čase, bez záporu, budúceho času a čakania
t("výsledok platby: úspech len „platba … prebehla / prijatá / zaplatená“ v minulom čase (SK aj CZ)", () => {
  for (const s of ["Platba byla úspěšně přijata.", "Platba bola úspešne prijatá.", "Platba proběhla v pořádku.", "Platba prebehla úspešne.",
    "Platba byla zaplacena.", "Vaša platba bola prijatá."]) eq(D.vysledokTextu(s), { uspech: true, neuspech: false, caka: false }, s);
});
t("výsledok platby: PENDING podľa dokumentácie Shoptetu (zadaná správne, bude označená ako zaplatená) = čaká, nikdy úspech", () => {
  for (const s of ["Platba byla zadána správně. Objednávka bude označena jako zaplacená, jakmile platbu obdržíme.",
    "Platba bola zadaná správne. Objednávka bude označená ako zaplatená, keď platbu prijmeme.",
    "Objednávka přijata, čeká na zaplacení.", "Objednávka bude potvrzena po zaplacení.", "Platba bude přijata po připsání na účet.",
    "Platba byla přijata ke zpracování.", "Objednávka bude označená ako zaplatená po prijatí platby."]) {
    const r = D.vysledokTextu(s);
    eq([r.uspech, r.caka], [false, true], s);
  }
});
t("výsledok platby: veta o OBJEDNÁVKE (prijatá, potvrdená, zaplatená) nie je potvrdenie platby", () => {
  for (const s of ["Vaše objednávka byla přijata.", "Objednávka bola prijatá.", "Objednávka byla potvrzena.", "Objednávka bola potvrdená.",
    "Objednávka je zaplatená.", "Objednávka odeslána", "Děkujeme za objednávku!"]) eq(D.vysledokTextu(s).uspech, false, s);
});
t("výsledok platby: zápor (nebyla / nebola / není / nie je) = neúspech, so „zatím / ešte“ = čaká; nikdy úspech", () => {
  for (const s of ["Platba nebyla zaplacena.", "Platba nebola zaplatená.", "Objednávka není uhrazena.", "Platba nebyla dokončena.",
    "Platba nebyla úspěšná.", "Objednávka nie je uhradená."]) eq(D.vysledokTextu(s), { uspech: false, neuspech: true, caka: false }, s);
  for (const s of ["Objednávka zatím nebyla zaplacena.", "Platba ešte nebola prijatá.", "Platba ještě nebyla přijata."]) {
    const r = D.vysledokTextu(s);
    eq([r.uspech, r.caka], [false, true], s);
  }
});
t("výsledok platby: veta o platbe sa nespojí s vedľajším blokom (bunky bez bodky)", () => {
  const doc = new JSDOM("<!doctype html><div id=k><table><tr><th>Zvolená platba</th><td>Online platba kartou</td></tr></table><h1>Objednávka přijata</h1><p>Platba</p><p>přijata</p></div>").window.document;
  eq(D.vysledokTextu(D.textPovodneho(doc, doc.getElementById("k"), null)).uspech, false);
});

// N2: tlačidlo platby Shoptetu — aj iné texty a <button> vo <form action> na bránu; informačný odkaz na „platbu“ nie je tlačidlo
t("tlačidlo platby: texty Zaplatit / Pokračovat k platbě / Přejít na platební bránu / Na platbu / Zkusit znovu, formulár na bránu", () => {
  const najdi = (html) => {
    const d = new JSDOM("<!doctype html><div id=k>" + html + "</div>").window.document;
    const e = D.odkazPlatby(d.getElementById("k"), null);
    return e ? e.tagName + ":" + D.bezDiakritiky(e.tagName === "INPUT" ? e.value : e.textContent) : null;
  };
  for (const [html, ocak] of [
    ['<form action="/action/x/"><button type="submit">Zaplatit</button></form>', "BUTTON:zaplatit"],
    ['<form action="/action/x/"><button type="submit">Pokračovat k platbě</button></form>', "BUTTON:pokracovat k platbe"],
    ['<form action="/action/x/"><button type="submit">Pokračovať na platbu</button></form>', "BUTTON:pokracovat na platbu"],
    ['<form action="/action/x/"><button type="submit">Přejít na platební bránu</button></form>', "BUTTON:prejit na platebni branu"],
    ['<form action="/action/x/"><button type="submit">Na platbu</button></form>', "BUTTON:na platbu"],
    ['<form action="/action/x/"><button type="submit">Zkusit znovu</button></form>', "BUTTON:zkusit znovu"],
    ['<form action="/action/x/"><button type="submit">Skúsiť znova</button></form>', "BUTTON:skusit znova"],
    ['<form action="https://gate.gopay.cz/gw/v3/1"><button type="submit">Pokračovat</button></form>', "BUTTON:pokracovat"],
    ['<form action="https://payments.comgate.cz/x"><input type="submit" value="OK"></form>', "INPUT:ok"],
    ['<a href="/action/ShoptetPay/pay/?orderCode=1&hash=x">Pokračovat</a>', "A:pokracovat"],
    ['<a href="/doprava-a-platba/">Informace o platbě</a>', null],
    ['<a href="/obchodni-podminky/#platba">Obchodní podmínky</a>', null],
    ['<a href="/">Zpět do obchodu</a>', null],
  ]) eq(najdi(html), ocak, html);
});

// ------------------------------------------------------------------ čítanie údajov (podľa popisov, nie poradia)
const NORMALNE = Object.keys(VARIANTY).filter((k) => !/chyba|neznama/.test(k) && ocakavane(k).stav);
// karta bez jednoznačného výsledku (zaplatené len podľa textu, čaká, veta o objednávke, neúspech bez tlačidla) -> stránka Shoptetu
const POVODNE = Object.keys(VARIANTY).filter((k) => ocakavane(k).povodna);
for (const kluc of NORMALNE) {
  t("údaje " + kluc + ": číslo, suma, platba, doprava, stav, účet/VS, položky (názov, ks, cena, fotka, rozpis)", () => {
    const { doc } = prostredie(kluc);
    const o = ocakavane(kluc);
    const r = D.citajUdaje(doc, o.web, null);
    over(r.ok, "nečíta: " + r.dovod);
    const u = r.udaje;
    eq([u.cislo, u.suma, u.platba, u.doprava, u.stav], [o.cislo, o.suma, o.platba, o.dopravca, o.stav], "hlavné údaje");
    eq(u.sumaText.replace(/ /g, " "), o.sumaText.replace(/ /g, " "), "suma ako text Shoptetu");
    eq([u.ucet, u.vs], [o.ucet, o.vs], "účet a VS");
    eq(!!u.qr, o.qr, "QR obrázok Shoptetu");
    eq(u.polozky.map((p) => [p.nazov, p.ks, p.cena, p.foto]), o.polozky.map((p) => [p.nazov, String(p.ks), p.cena, p.foto]), "položky");
    over(u.polozky.every((p) => p.rozpis.length > 0), "položka bez rozpisu");
    eq(u.ine, 0, "iné riadky s cenou");
    eq(u.odkaz ? u.odkaz.getAttribute("href") : null, o.odkazPlatby, "odkaz Shoptetu na platbu");
  });
}
for (const kluc of POVODNE) {
  t("karta " + kluc + ": výsledok platby nie je jednoznačný -> stránka Shoptetu (nič sa neskryje), záznam s dôvodom", () => {
    const o = ocakavane(kluc);
    const r = D.citajUdaje(prostredie(kluc).doc, o.web, null);
    eq(r.ok, false, "ok");
    over(/^stav platby/.test(r.dovod), "dôvod " + r.dovod);
    // aj keby sa „Zaplatené“ podľa textu raz zaplo, ukáže sa len pri jednoznačnom texte o prijatej platbe
    const z = D.citajUdaje(prostredie(kluc).doc, o.web, null, { zaplatenePodlaTextu: true });
    eq(z.ok ? z.udaje.stav : null, o.stavPodlaTextu, "so zapnutým „Zaplatené“ podľa textu");
    const { doc, w } = prostredie(kluc, { flag: "1" });
    B.vzhladDakujemeSkoro(doc, w.location.search);
    const ctx = B.initOpc({});
    eq([ctx.stav, !!doc.getElementById("lcd-dakujeme"), doc.querySelectorAll("." + D.TRIEDA_POVODNE).length, doc.documentElement.className.includes("lcd-opc-dakujeme")],
      ["dakujeme-povodna", false, 0, false]);
    const zaz = JSON.parse(w.localStorage.getItem(D.KLUC_ZAZNAMU));
    eq([zaz.length, zaz[0].stav, /^stav platby/.test(zaz[0].dovod)], [1, null, true], "záznam");
  });
}
t("„Zaplatené“ podľa textu je vypnuté, kým záznam nepotvrdí text Shoptetu (ZAPLATENE_PODLA_TEXTU = false)", () => {
  eq(D.ZAPLATENE_PODLA_TEXTU, false);
  eq(["cz-karta-ok", "sk-karta-ok", "sk-apple-ok", "cz-karta-ticho"].map((k) => ocakavane(k).povodna), [true, true, true, true]);
});
t("karta: tlačidlo Shoptetu vo <form action> na bránu (bez href) -> neprebehla, naše zelené tlačidlo klikne na pôvodné", () => {
  const { doc } = prostredie("cz-karta-form", { flag: "1" });
  B.initOpc({});
  const b = doc.getElementById("lcd-dakujeme");
  over(b, "blok sa nepostavil");
  eq(b.getAttribute("data-lcd-dak-stav"), "neprebehla");
  const povodne = doc.querySelector('#content form[action="https://gate.gopay.cz/gw/v3/TEST"] button');
  let klik = 0;
  povodne.click = () => { klik++; };
  const nase = b.querySelector(".lcd-dak-platba__btn");
  eq([nase.tagName, txt(nase), !!b.querySelector(".lcd-dak-platba__navod")], ["BUTTON", "Zaplatit kartou", false]);
  nase.click();
  eq(klik, 1, "klik na pôvodné tlačidlo Shoptetu");
});
t("karta: tlačidlo platby + text o úspechu alebo čakaní naraz (rozpor) -> stránka Shoptetu", () => {
  for (const veta of ["Platba byla úspěšně přijata.", "Platba byla zadána správně. Objednávka bude označena jako zaplacená, jakmile platbu obdržíme."]) {
    const { doc } = prostredie("cz-karta-pred");
    doc.querySelector(".reca-payment-wrap").insertAdjacentHTML("afterbegin", "<p>" + veta + "</p>");
    const r = D.citajUdaje(doc, "cz", null);
    eq([r.ok, /^stav platby/.test(r.dovod || "")], [false, true], veta);
  }
});

// V1: suma = práve jedna cena s menou v hodnote; V2: dva rôzne údaje toho istého popisu = stránka Shoptetu
const vymenRiadok = (doc, popis, html) => {
  const th = Array.prototype.find.call(doc.querySelectorAll("#content th"), (e) => e.textContent.trim() === popis);
  th.parentNode.outerHTML = html;
};
t("suma: preškrtnutá a nová cena v bunke (2 ceny) -> stránka Shoptetu, nie prvá cena", () => {
  const { doc } = prostredie("cz-prevod");
  vymenRiadok(doc, "Částka k úhradě", "<tr><th>Částka k úhradě</th><td><del>25 000 Kč</del> <strong>20 006 Kč</strong></td></tr>");
  const r = D.citajUdaje(doc, "cz", null);
  eq([r.ok, r.dovod], [false, "suma"]);
});
t("suma: popis s poznámkou „(2 položky)“ -> hodnota zo susednej bunky", () => {
  const { doc } = prostredie("cz-prevod");
  vymenRiadok(doc, "Částka k úhradě", "<tr><th>Částka k úhradě <span>(2 položky)</span></th><td>20 006 Kč</td></tr>");
  const u = D.citajUdaje(doc, "cz", null).udaje;
  eq([u.suma, u.sumaText.replace(/\u00a0/g, " "), u.stav], [20006, "20 006 Kč", "prevod"]);
});
t("suma: číslo bez meny -> stránka Shoptetu", () => {
  const { doc } = prostredie("cz-prevod");
  vymenRiadok(doc, "Částka k úhradě", "<tr><th>Částka k úhradě</th><td><strong>20006</strong></td></tr>");
  eq(D.citajUdaje(doc, "cz", null).dovod, "suma");
});
t("dva rôzne účty, VS, sumy alebo čísla objednávky na stránke -> stránka Shoptetu; ten istý údaj dvakrát nevadí", () => {
  for (const [popis, h, kluc] of [["Bankovní účet", "1111111111/0100", "ucet"], ["Variabilní symbol", "999", "vs"], ["Částka k úhradě", "1 000 Kč", "suma"], ["Číslo objednávky", "2820269999", "cislo"]]) {
    const { doc } = prostredie("cz-prevod");
    doc.querySelector("#content .content-inner").insertAdjacentHTML("afterbegin", '<div class="iny-blok"><table><tr><th>' + popis + "</th><td>" + h + "</td></tr></table></div>");
    const r = D.citajUdaje(doc, "cz", null);
    eq([r.ok, r.dovod], [false, "dva rôzne údaje: " + kluc], popis);
  }
  const { doc } = prostredie("cz-prevod");
  doc.querySelector("#content .content-inner").insertAdjacentHTML("afterbegin", '<p>Bankovní účet <strong>2002871802/2010</strong></p><p>Variabilní symbol <strong>2820260033</strong></p>' +
    "<table><tr><th>Číslo</th><th>Produkt</th></tr></table>"); // hlavička tabuľky „Číslo | Produkt“ nie je číslo objednávky
  const u = D.citajUdaje(doc, "cz", null).udaje;
  eq([u.cislo, u.ucet, u.vs, u.stav], ["2820260033", "2002871802/2010", "2820260033", "prevod"]);
});
t("rozpis CZ položky = ul.lcd-rozpis z košíka (kosikRozpis.lcdRozpis, TYP vynechaný) presne ako v schválenom náhľade", () => {
  const { doc } = prostredie("cz-prevod");
  const u = D.citajUdaje(doc, "cz", null).udaje;
  eq(u.polozky[0].rozpis.map((x) => x.n + ": " + x.h), [
    "Barva 1. vrstvy: Diamond Barva kůže: Fialová", "Barva 2. vrstvy: Lux Color 10", "Rozložení koberců: první a druhá řada",
    "Autokoberce do kufru: Koberec na dno kufru", "Barva boxů: Barva kůže: výnově červena", "Velikost 1. boxu: XL: 66x32x30 cm", "Velikost 2. boxu: M: 40x32x30 cm"]);
  // tá istá funkcia ako v košíku (nie kópia): rovnaký výsledok pre rovnaké vstupy
  eq(u.polozky[0].rozpis, lcdRozpis({ variant: "Barva 1.vrstvy: Diamond Barva kůže: Fialová, Barva 2.vrstvy: Lux Color 10", priplatky: "Příplatky: rozložení koberců - první a druhá řada, autokoberce do kufru - Koberec na dno kufru, Barva boxů - Barva kůže: výnově červena, TYP - Coupe, Velikost 1. boxu - XL: 66x32x30 cm, Velikost 2. boxu - M : 40x32x30 cm", cz: true }));
});
t("iné značky a prehodené poradie (dl/dt/dd, span + b): rovnaké hodnoty ako tabuľka", () => {
  const a = D.citajUdaje(prostredie("cz-prevod").doc, "cz", null).udaje;
  const b = D.citajUdaje(prostredie("cz-ine-znacky").doc, "cz", null).udaje;
  eq([b.cislo, b.suma, b.platba, b.doprava, b.ucet, b.vs, b.stav], [ocakavane("cz-ine-znacky").cislo, a.suma, a.platba, a.doprava, a.ucet, "2820260040", "prevod"]);
});
t("položka, ktorú už rozpísal cart.js (ul.lcd-rozpis + skryté zdroje): rozpis sa prevezme, názov bez príplatkov", () => {
  const { doc } = prostredie("cz-prevod");
  const bunka = doc.querySelector(".cart-table .p-name");
  bunka.innerHTML = '<a class="main-link" href="/x/">luxusní autokoberce Dragonskin Elite DIAMOND LINE <span class="main-link-variant lcd-rozpis-zdroj">Barva 1.vrstvy: X</span> <span class="main-link-surcharges lcd-rozpis-zdroj">Příplatky: a - b</span></a>' +
    '<ul class="lcd-rozpis"><li><span class="lcd-rozpis__n">Auto: </span><span class="lcd-rozpis__h">Škoda Octavia 2021</span></li><li><span class="lcd-rozpis__n">Barva 1. vrstvy: </span><span class="lcd-rozpis__h">X</span></li></ul>';
  const p = D.citajUdaje(doc, "cz", null).udaje.polozky[0];
  eq([p.nazov, p.rozpis], ["Luxusní autokoberce Dragonskin Elite DIAMOND LINE", [{ n: "Auto", h: "Škoda Octavia 2021" }, { n: "Barva 1. vrstvy", h: "X" }]]);
});
t("kamión: hodnota s „ – “ ostane v jednom riadku (Čierna, čierne šitie – 11), ostatné rozpisy presne ako košík", () => {
  const u = D.citajUdaje(prostredie("sk-kamion").doc, "sk", null).udaje;
  eq(u.polozky[0].rozpis.map((x) => x.n + ": " + x.h), [
    "Typ materiálu: Prémiová syntetická koža – prešívaná", "Farba materiálu: Čierna, čierne šitie – 11", "Farba lemovania: Čierny základ, červené pásiky – 04",
    "Rozloženie nášiviek: Šofér + spolujazdec + stred (BALÍK)", "Typ nášiviek na boky: Nášivka H19", "Tapacír: Áno chcem (v konfigurátore – balík)"]);
  const v = D.citajUdaje(prostredie("sk-vzorky").doc, "sk", null).udaje;
  eq(v.polozky[0].rozpis, lcdRozpis({ variant: "", priplatky: "Príplatky: Vzorka 2. vrstva – Lux Color 10 – Čierna (LUX-10) - Áno", cz: false }), "vzorkovník = košík");
});
t("druh objednávky: kamión, vzorky, auto", () => {
  eq(["sk-kamion", "sk-vzorky", "cz-prevod"].map((k) => D.druhObjednavky(D.citajUdaje(prostredie(k).doc, VARIANTY[k].web, null).udaje.polozky)), ["kamion", "vzorky", "auto"]);
});
for (const [kluc, dovod] of [["cz-chyba-suma", /suma/], ["cz-chyba-cislo", /číslo/], ["cz-chyba-platba", /spôsob platby/], ["cz-chyba-ucet", /prevod bez/], ["cz-neznama-platba", /spôsob platby \(Hotově/]]) {
  t("fallback " + kluc + ": chýba kľúčový údaj -> nič sa nečíta ako platné (" + dovod + ")", () => {
    const r = D.citajUdaje(prostredie(kluc).doc, "cz", null);
    eq(r.ok, false, "ok");
    over(dovod.test(r.dovod), "dôvod " + r.dovod);
  });
}

// ------------------------------------------------------------------ brána a zapojenie (opc/index.js)
const KOD = B.KOD;
t("brána: bez kódu ďakovná stránka BEZ ZMENY — DOM, triedy, globály, záznam, žiadna požiadavka (fetch/XHR)", () => {
  for (const kluc of ["cz-prevod", "sk-karta-nie", "cz-dobierka"]) {
    const { w, doc } = prostredie(kluc);
    let poziadavky = 0;
    w.fetch = globalThis.fetch = () => { poziadavky++; return Promise.reject(new Error("test")); };
    const XO = w.XMLHttpRequest.prototype.open;
    w.XMLHttpRequest.prototype.open = function () { poziadavky++; return XO.apply(this, arguments); };
    const pred = doc.documentElement.outerHTML;
    const kluceOkna = Object.keys(w).length;
    eq(B.vzhladDakujemeSkoro(doc, w.location.search), false, kluc + ": skorý vzhľad");
    eq(B.initOpc({}), null, kluc + ": initOpc");
    eq(doc.documentElement.outerHTML, pred, kluc + ": DOM sa zmenil");
    eq([typeof w.__lcdOpc, Object.keys(w).length, w.localStorage.getItem(D.KLUC_ZAZNAMU), w.localStorage.getItem("lcdOpc"), poziadavky],
      ["undefined", kluceOkna, null, null, 0], kluc + ": stopa");
  }
});
t("brána: ?opc=1 (bez kódu) aj ?opc=0 nič; data.json \"opc\": false nič ani s kódom (skorý vzhľad sa vráti)", () => {
  for (const hladanie of ["?opc=1", "?opc=0"]) {
    const { doc, w } = prostredie("cz-prevod", { hladanie });
    const pred = doc.documentElement.outerHTML;
    B.vzhladDakujemeSkoro(doc, w.location.search);
    eq([B.initOpc({}), doc.documentElement.outerHTML === pred, w.localStorage.getItem(D.KLUC_ZAZNAMU)], [null, true, null], hladanie);
  }
  const { doc, w } = prostredie("cz-prevod", { hladanie: "?opc=" + KOD });
  eq(B.vzhladDakujemeSkoro(doc, w.location.search), true, "skorý vzhľad s kódom");
  eq(doc.documentElement.classList.contains(D.TRIEDA_CAKA), true, "obsah čaká skrytý");
  eq(B.initOpc({ opc: false }), null, "núdzový vypínač");
  eq([doc.documentElement.className.includes("lcd-opc"), !!doc.getElementById("lcd-dakujeme"), w.localStorage.getItem(D.KLUC_ZAZNAMU)], [false, false, null], "po vypínači");
});
t("brána: s kódom (?opc=KÓD, potom flag bez parametra) sa blok postaví, pôvodný obsah ostane v DOM len skrytý triedou", () => {
  for (const [hladanie, flag] of [["?opc=" + KOD, null], ["", "1"]]) {
    const { doc, w } = prostredie("cz-prevod", { hladanie, flag });
    const h1 = doc.querySelector(".order-summary-heading");
    B.vzhladDakujemeSkoro(doc, w.location.search);
    const ctx = B.initOpc({});
    over(ctx && ctx.stranka === "dakujeme", "stránka " + (ctx && ctx.stranka));
    eq(ctx.stav, "dakujeme-prevod", "stav");
    const blok = doc.getElementById("lcd-dakujeme"), cw = doc.getElementById("content-wrapper");
    over(blok && blok.nextElementSibling === cw, "blok nie je pred #content-wrapper");
    eq([cw.classList.contains(D.TRIEDA_POVODNE), doc.documentElement.classList.contains(D.TRIEDA), doc.documentElement.classList.contains(D.TRIEDA_CAKA), h1.isConnected],
      [true, true, false, true], hladanie || "flag");
  }
});
t("brána: druhé spustenie nepostaví druhý blok", () => {
  const { doc, w } = prostredie("cz-prevod", { flag: "1" });
  B.initOpc({});
  B.initOpc({});
  eq(doc.querySelectorAll("#lcd-dakujeme").length, 1);
});
t("brána: stránka sa rozpozná aj podľa triedy tela alebo pageType (iná adresa), krok 2 a košík ostávajú svoje", () => {
  const a = prostredie("cz-prevod", { flag: "1", cesta: "/objednavka/hotovo/" });
  eq(B.stranka(a.doc.body), "dakujeme", "trieda in-dekujeme");
  const b = prostredie("cz-prevod", { flag: "1", cesta: "/objednavka/hotovo/", telo: "desktop id--99 ordering-process" });
  eq(B.stranka(b.doc.body), "dakujeme", "pageType thankYou");
  const c = prostredie("cz-prevod", { flag: "1", cesta: "/objednavka/hotovo/", telo: "desktop id--99", pageType: "other" });
  eq(B.stranka(c.doc.body), null, "nič z toho");
  const k2 = prostredie("cz-prevod", { telo: "desktop id--17 in-krok-2" });
  eq(B.stranka(k2.doc.body), "krok2", "krok 2 podľa tela má prednosť");
});
for (const kluc of ["cz-chyba-suma", "cz-chyba-cislo", "cz-chyba-platba", "cz-chyba-ucet", "cz-neznama-platba"]) {
  t("fallback v prehliadači " + kluc + ": nič sa neskryje ani nevloží, skorý vzhľad sa vráti, záznam sa uloží", () => {
    const { doc, w } = prostredie(kluc, { flag: "1" });
    B.vzhladDakujemeSkoro(doc, w.location.search);
    const ctx = B.initOpc({});
    eq(ctx.stav, "dakujeme-povodna");
    eq([!!doc.getElementById("lcd-dakujeme"), doc.querySelectorAll("." + D.TRIEDA_POVODNE).length, doc.documentElement.className.includes("lcd-opc-dakujeme")], [false, 0, false]);
    const z = JSON.parse(w.localStorage.getItem(D.KLUC_ZAZNAMU));
    eq([z.length, z[0].stav, !!z[0].dovod], [1, null, true], "záznam");
  });
}
t("chyba pri kreslení (vloženie zlyhá): nič neostane skryté ani vložené", () => {
  const { doc, w } = prostredie("cz-prevod", { flag: "1" });
  const cw = doc.getElementById("content-wrapper");
  cw.parentNode.insertBefore = () => { throw new Error("test"); };
  const ctx = B.initOpc({});
  eq([ctx.stav, !!doc.getElementById("lcd-dakujeme"), cw.classList.contains(D.TRIEDA_POVODNE), doc.documentElement.className.includes("lcd-opc-dakujeme")], ["dakujeme-chyba", false, false, false]);
});

// ------------------------------------------------------------------ záznam na overenie
t("záznam: pôvodné HTML hlavného obsahu bez skriptov, adresa bez query, dátum, posledných 5, rovnaká stránka 2× = 1 záznam", () => {
  const { doc, w } = prostredie("cz-prevod", { hladanie: "?opc=" + KOD + "&x=1" });
  B.vzhladDakujemeSkoro(doc, w.location.search);
  B.initOpc({});
  const z = JSON.parse(w.localStorage.getItem(D.KLUC_ZAZNAMU));
  eq(z.length, 1);
  eq(z[0].url, "https://www.luxurycardesign.cz/objednavka/dekujeme/", "adresa bez query");
  over(/^\d{4}-\d\d-\d\dT/.test(z[0].datum), "dátum " + z[0].datum);
  over(/<main id="content"/.test(z[0].html) && /Objednávka odeslána/.test(z[0].html) && /2002871802\/2010/.test(z[0].html), "nie je pôvodný obsah");
  over(!/<script/i.test(z[0].html) && !/__shoptetVnutri/.test(z[0].html), "záznam má skript");
  over(!/lcd-dakujeme/.test(z[0].html), "záznam obsahuje náš blok");
  eq(z[0].stav, "prevod");
  const uloz = w.localStorage;
  for (let i = 0; i < 7; i++) D.ulozZaznam(uloz, { html: "<main>" + i + "</main>", url: "u" + i });
  D.ulozZaznam(uloz, { html: "<main>6</main>", url: "u6" });
  const z2 = JSON.parse(uloz.getItem(D.KLUC_ZAZNAMU));
  eq(z2.map((x) => x.html), ["<main>2</main>", "<main>3</main>", "<main>4</main>", "<main>5</main>", "<main>6</main>"]);
});
t("záznam: plné úložisko -> zahodí staršie, nepadne; nedostupné úložisko -> false", () => {
  const plne = { d: {}, getItem(k) { return this.d[k] || null; }, setItem(k, v) { if (v.length > 400) throw new Error("QuotaExceeded"); this.d[k] = v; } };
  for (let i = 0; i < 4; i++) D.ulozZaznam(plne, { html: "x".repeat(120) + i, url: "u" });
  eq(JSON.parse(plne.d[D.KLUC_ZAZNAMU]).length >= 1, true);
  eq(D.ulozZaznam(null, { html: "a" }), false);
  eq(D.ulozZaznam({ getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); } }, { html: "a" }), false);
});

// ------------------------------------------------------------------ nový blok: texty a hodnoty podľa stavu
function blok(kluc) {
  const { doc, w } = prostredie(kluc, { flag: "1" });
  const ctx = B.initOpc({});
  const b = doc.getElementById("lcd-dakujeme");
  over(b, kluc + ": blok sa nepostavil (" + (ctx && ctx.stav) + " " + (ctx && ctx.dovod) + ")");
  return { b, doc, w, ctx, o: ocakavane(kluc), T: TEXTY_DAKUJEME[VARIANTY[kluc].web] };
}
const q = (b, s) => txt(b.querySelector(s));
for (const kluc of NORMALNE) {
  t("blok " + kluc + ": hlavička, platba, kroky, objednávka, kontakt, späť; žiadne zakázané slová", () => {
    const { b, o, T } = blok(kluc);
    eq(q(b, ".lcd-dak-hero__cislo"), "Objednávka č. " + o.cislo);
    eq(q(b, "h1"), T.nadpis);
    eq(q(b, ".lcd-dak-platba__suma"), o.sumaText.replace(/ /g, " "), "suma");
    eq(b.getAttribute("data-lcd-dak-stav"), o.stav);
    eq(b.querySelectorAll(".lcd-dak-osa > li").length, 4, "4 kroky");
    eq(q(b, ".lcd-dak-osa > li:first-child b"), T.krokPrijata);
    eq(b.querySelectorAll(".lcd-dak-osa__text").length, 4);
    eq(q(b, ".lcd-dak-suhrn__spolu span:last-child"), o.sumaText.replace(/ /g, " "), "celkom");
    eq(q(b, ".lcd-dak-suhrn li:first-child span:last-child"), o.dopravaText.replace(/ /g, " "), "doprava a platba = celkom − tovar");
    over(q(b, ".lcd-dak-suhrn li:first-child small").includes(o.platba), "názov platby v súhrne");
    eq(b.querySelectorAll(".lcd-dak-polozka").length, o.polozky.length);
    eq(b.querySelectorAll(".lcd-dak-polozka ul.lcd-rozpis").length, o.polozky.length, "rozpis = ul.lcd-rozpis");
    eq(b.querySelector(".lcd-dak-kontakt a[href^='mailto:']").getAttribute("href"), "mailto:" + T.email);
    eq(b.querySelector(".lcd-dak-kontakt a[href^='tel:']").getAttribute("href"), "tel:+421903660720");
    over(q(b, ".lcd-dak-kontakt p").includes(o.cislo), "číslo v kontakte");
    eq(b.querySelector(".lcd-dak-spat a").getAttribute("href"), "/", "späť do obchodu = odkaz Shoptetu");
    const vsetok = txt(b) + " " + Array.prototype.map.call(b.querySelectorAll("[aria-label]"), (e) => e.getAttribute("aria-label")).join(" ");
    const zak = vsetok.match(ZAKAZANE);
    over(!zak, "zakázané slovo „" + (zak && zak[0]) + "“");
    over(o.qr || !/\bQR\b/.test(vsetok), "QR bez obrázka Shoptetu");
    // hlavné tlačidlo zelené: práve jedno zelené (platba alebo späť)
    eq(b.querySelectorAll(".lcd-dak-btn-zeleny").length, 1, "zelené tlačidlá");
  });
}
t("prevod CZ: presne texty náhľadu, 3× Kopírovat (účet, VS, suma bez meny), kroky 1 hotovo / 2 Nyní", () => {
  const { b } = blok("cz-prevod");
  eq([q(b, ".lcd-dak-hero__text"), q(b, ".lcd-dak-platba__stitok"), q(b, ".lcd-dak-platba__navod")],
    ["Zbývá zaplatit převodem – údaje najdete níže.", "Platba převodem", "Údaje zkopírujte do aplikace své banky."]);
  eq(Array.prototype.map.call(b.querySelectorAll(".lcd-dak-udaj"), (li) => [txt(li.querySelector(".lcd-dak-udaj__n")), txt(li.querySelector(".lcd-dak-udaj__h")), li.querySelector(".lcd-dak-kopia").getAttribute("data-kopia"), txt(li.querySelector(".lcd-dak-kopia"))]),
    [["Číslo účtu", "2002871802/2010", "2002871802/2010", "Kopírovat"], ["Variabilní symbol", "2820260033", "2820260033", "Kopírovat"], ["Částka", "20 006 Kč", "20006", "Kopírovat"]]);
  eq(Array.prototype.map.call(b.querySelectorAll(".lcd-dak-osa > li"), (li) => [li.className, txt(li.querySelector("b")), txt(li.querySelector(".lcd-dak-osa__text"))]), [
    ["lcd-dak-osa--hotovo", "Objednávka přijata", "Rekapitulaci vám pošleme i e‑mailem."],
    ["lcd-dak-osa--teraz", "Platba převodem Nyní", "Podle údajů výše."],
    ["", "Konzultace", "Ozveme se vám kvůli detailům objednávky."],
    ["", "Příprava a doručení", "Objednávku připravíme na míru vašemu autu a zásilku vám doveze Expres Kurýr."]]);
  eq([q(b, ".lcd-dak-objednavka .lcd-dak-karta__h"), q(b, ".lcd-dak-polozka__nazov"), q(b, ".lcd-dak-polozka__cena span"), q(b, ".lcd-dak-polozka__cena b")], ["Vaše objednávka", "Luxusní autokoberce Dragonskin Elite DIAMOND LINE", "1 ks", "19 856 Kč"]);
  eq([q(b, ".lcd-dak-kontakt h2"), q(b, ".lcd-dak-kontakt p"), q(b, ".lcd-dak-spat a")], ["Máte dotaz k objednávce?", "Zavolejte nebo napište, stačí uvést číslo objednávky 2820260033.", "Zpět do obchodu"]);
  over(!b.querySelector(".lcd-dak-qr"), "CZ: QR bez obrázka Shoptetu");
  over(b.querySelector(".lcd-dak-kroky").parentNode.classList.contains("lcd-dak-obsah"), "prevod: kroky pod mriežkou");
});
t("prevod SK: preklad, QR obrázok Shoptetu prevzatý (rovnaký src), žiadny vlastný kód", () => {
  const { b, doc } = blok("sk-prevod");
  eq([q(b, "h1"), q(b, ".lcd-dak-hero__text"), q(b, ".lcd-dak-platba__stitok"), q(b, ".lcd-dak-platba__navod")],
    ["Ďakujeme za objednávku", "Zostáva zaplatiť prevodom – údaje nájdete nižšie.", "Platba prevodom", "Údaje skopírujte do aplikácie svojej banky."]);
  eq(Array.prototype.map.call(b.querySelectorAll(".lcd-dak-udaj__n"), txt), ["Číslo účtu", "Variabilný symbol", "Suma"]);
  const qr = b.querySelector(".lcd-dak-qr img");
  eq(qr && qr.getAttribute("src"), doc.querySelector("#content img.qrcode").getAttribute("src"), "QR = obrázok Shoptetu");
  eq(b.querySelectorAll("svg").length > 0 && !b.querySelector(".lcd-dak-qr svg, .lcd-dak-qr canvas"), true, "žiadny kreslený QR");
  eq(q(b, ".lcd-dak-osa > li:nth-child(4) .lcd-dak-osa__text"), "Objednávku pripravíme na mieru vášmu autu a zásielku vám dovezie Expres kurier DPD.");
  eq(q(b, ".lcd-dak-osa > li:first-child b"), "Objednávka prijatá");
  eq(q(b, ".lcd-dak-osa > li:nth-child(3) .lcd-dak-osa__text"), "Ozveme sa vám kvôli detailom objednávky.");
});
/** Blok so zapnutým „Zaplatené“ podľa textu (schválený vzhľad 4-stavy; naživo vypnuté, kým záznam nepotvrdí text Shoptetu). */
function blokPodlaTextu(kluc) {
  const { doc } = prostredie(kluc);
  const web = VARIANTY[kluc].web;
  const r = D.citajUdaje(doc, web, null, { zaplatenePodlaTextu: true });
  over(r.ok, kluc + ": " + r.dovod);
  return { b: D.postavBlok(doc, r.udaje, TEXTY_DAKUJEME[web]), o: ocakavane(kluc) };
}
t("kartou zaplatené CZ (len so zapnutým „Zaplatené“ podľa textu): Zaplaceno, potvrdenie, bez údajov na prevod a bez tlačidla platby", () => {
  const { b } = blokPodlaTextu("cz-karta-ok");
  eq([q(b, ".lcd-dak-hero__text"), q(b, ".lcd-dak-platba__stitok"), q(b, ".lcd-dak-platba__titul"), q(b, ".lcd-dak-potvrd")],
    ["Platba kartou proběhla v pořádku.", "Platba kartou", "Zaplaceno", "Objednávka je zaplacená, nic dalšího platit nemusíte."]);
  eq([b.querySelectorAll(".lcd-dak-kopia").length, !!b.querySelector(".lcd-dak-platba__btn"), !!b.querySelector(".lcd-dak-prevod")], [0, false, false]);
  eq(Array.prototype.map.call(b.querySelectorAll(".lcd-dak-osa > li"), (li) => li.className), ["lcd-dak-osa--hotovo", "lcd-dak-osa--hotovo", "lcd-dak-osa--teraz", ""]);
  eq(q(b, ".lcd-dak-osa > li:nth-child(2) .lcd-dak-osa__text"), "Částka 20 006 Kč je uhrazena.");
  over(b.querySelector(".lcd-dak-mriezka--kroky > .lcd-dak-kroky"), "kroky v ľavom stĺpci mriežky");
});
t("kartou neprebehla CZ: text o neúspechu, zelené „Zaplatit kartou znovu“ = odkaz Shoptetu, späť vedľajšie", () => {
  const { b, o } = blok("cz-karta-nie");
  eq([q(b, ".lcd-dak-hero__text"), q(b, ".lcd-dak-platba__titul"), q(b, ".lcd-dak-platba__navod")],
    ["Objednávku jsme přijali, zbývá ji zaplatit.", "Platba zatím neproběhla", "Platbu se nepodařilo dokončit. Zkuste to prosím znovu."]);
  const btn = b.querySelector(".lcd-dak-platba__btn");
  eq([btn.tagName, btn.getAttribute("href"), txt(btn), btn.className.includes("lcd-dak-btn-zeleny")], ["A", o.odkazPlatby, "Zaplatit kartou znovu", true]);
  eq([!!b.querySelector(".lcd-dak-spat .lcd-dak-btn-vedlajsi"), !!b.querySelector(".lcd-dak-prevod")], [true, false], "späť vedľajšie, bez údajov na prevod (Shoptet ich nevypísal)");
  eq([q(b, ".lcd-dak-osa > li:nth-child(2) b"), q(b, ".lcd-dak-osa > li:nth-child(2) .lcd-dak-osa__text")], ["Platba Nyní", "Kartou znovu tlačítkem výše."]);
});
t("kartou neprebehla + Shoptet vypísal účet: „nebo zaplaťte převodem“ s Kopírovat", () => {
  const { b } = blok("cz-karta-nie-ucet");
  const det = b.querySelector("details.lcd-dak-prevod");
  over(det && !det.open, "zbalené „nebo zaplaťte převodem“");
  eq(txt(det.querySelector("summary")), "nebo zaplaťte převodem");
  eq(det.querySelectorAll(".lcd-dak-kopia").length, 3);
  eq(q(b, ".lcd-dak-osa > li:nth-child(2) .lcd-dak-osa__text"), "Kartou znovu, nebo převodem podle údajů výše.");
});
t("karta pred bránou (len tlačidlo Shoptetu, bez textu o neúspechu): „Zaplatit kartou“, bez vety o neúspechu", () => {
  const { b } = blok("cz-karta-pred");
  eq([q(b, ".lcd-dak-platba__titul"), b.querySelector(".lcd-dak-platba__navod"), q(b, ".lcd-dak-platba__btn")], ["Platba zatím neproběhla", null, "Zaplatit kartou"]);
});
t("Apple Pay zaplatené SK (len so zapnutým „Zaplatené“ podľa textu): štítok = názov Shoptetu, „Platba prebehla v poriadku.“", () => {
  const { b } = blokPodlaTextu("sk-apple-ok");
  eq([q(b, ".lcd-dak-platba__stitok"), q(b, ".lcd-dak-hero__text"), q(b, ".lcd-dak-platba__titul")], ["Apple Pay", "Platba prebehla v poriadku.", "Zaplatené"]);
});
t("dobierka CZ aj SK: platba pri prevzatí, kuriérovi, žiadna záloha nikde", () => {
  const c = blok("cz-dobierka").b;
  eq([q(c, ".lcd-dak-hero__text"), q(c, ".lcd-dak-platba__stitok"), q(c, ".lcd-dak-platba__titul"), q(c, ".lcd-dak-platba__navod")],
    ["Zaplatíte až při převzetí zásilky.", "Dobírka", "Platba při převzetí", "Zaplatíte kurýrovi při převzetí zásilky."]);
  eq([q(c, ".lcd-dak-osa > li:nth-child(4) b"), q(c, ".lcd-dak-osa > li:nth-child(4) .lcd-dak-osa__text")], ["Platba při převzetí", "Částku 20 056 Kč zaplatíte kurýrovi."]);
  const s = blok("sk-dobierka").b;
  eq([q(s, ".lcd-dak-hero__text"), q(s, ".lcd-dak-platba__stitok"), q(s, ".lcd-dak-platba__titul"), q(s, ".lcd-dak-platba__navod")],
    ["Zaplatíte až pri prevzatí zásielky.", "Dobierka", "Platba pri prevzatí", "Zaplatíte kuriérovi pri prevzatí zásielky."]);
  eq(q(s, ".lcd-dak-osa > li:nth-child(4) .lcd-dak-osa__text"), "Sumu €767 zaplatíte kuriérovi.");
  for (const b of [c, s]) over(!/z[aá]loh/i.test(txt(b)), "záloha v dobierke");
});
t("kamión SK: rozpis z príplatkov, „vášmu vozidlu“; vzorky SK: „Vzorky pripravíme“", () => {
  const k = blok("sk-kamion").b;
  over(/vášmu vozidlu/.test(q(k, ".lcd-dak-osa > li:nth-child(4) .lcd-dak-osa__text")), "kamión: " + q(k, ".lcd-dak-osa > li:nth-child(4)"));
  over(k.querySelectorAll("ul.lcd-rozpis li").length >= 6, "kamión: rozpis");
  const v = blok("sk-vzorky").b;
  eq(q(v, ".lcd-dak-osa > li:nth-child(4) .lcd-dak-osa__text"), "Vzorky pripravíme a zásielku vám dovezie Expres kurier DPD.");
});
t("hodnoty Shoptetu idú len ako text (žiadne HTML z obsahu stránky)", () => {
  const { doc, w } = prostredie("cz-prevod", { flag: "1" });
  doc.querySelector(".cart-table .p-name").innerHTML = "luxusní &lt;img src=x onerror=alert(1)&gt; koberec<br>Příplatky: a - &lt;b&gt;tučné&lt;/b&gt;";
  B.initOpc({});
  const b = doc.getElementById("lcd-dakujeme");
  over(!b.querySelector("img[src=x], b b"), "HTML z textu Shoptetu sa vykreslilo");
  over(/<img src=x/.test(b.querySelector(".lcd-dak-polozka__nazov").textContent), "text sa stratil");
});

// ------------------------------------------------------------------ kopírovanie
t("Kopírovať: Clipboard API -> „Zkopírováno ✓“, po 1,8 s späť ikona + „Kopírovat“ (aj po 2 rýchlych klikoch)", async () => {
  const { b, w } = blok("cz-prevod");
  const zapisane = [];
  Object.defineProperty(w.navigator, "clipboard", { configurable: true, value: { writeText: (x) => { zapisane.push(x); return Promise.resolve(); } } });
  const k = b.querySelectorAll(".lcd-dak-kopia");
  k[0].click(); k[0].click(); k[2].click();
  await cakaj(30);
  eq(zapisane, ["2002871802/2010", "2002871802/2010", "20006"]);
  eq([txt(k[0]), k[0].classList.contains("lcd-dak-kopia--hotovo"), txt(k[2])], ["Zkopírováno ✓", true, "Zkopírováno ✓"]);
  await cakaj(1900);
  eq([txt(k[0]), !!k[0].querySelector("svg"), k[0].classList.contains("lcd-dak-kopia--hotovo")], ["Kopírovat", true, false]);
});
t("Kopírovať: Clipboard zlyhá -> záloha execCommand(\"copy\"); bez oboch -> hodnota sa označí, žiadne „Zkopírováno“", async () => {
  const { b, w, doc } = blok("sk-prevod");
  Object.defineProperty(w.navigator, "clipboard", { configurable: true, value: { writeText: () => Promise.reject(new Error("NotAllowed")) } });
  const volane = [];
  doc.execCommand = (c) => { volane.push(c); return true; };
  const k = b.querySelectorAll(".lcd-dak-kopia");
  k[1].click();
  await cakaj(30);
  eq([volane, txt(k[1])], [["copy"], "Skopírované ✓"], "záloha");
  Object.defineProperty(w.navigator, "clipboard", { configurable: true, value: undefined });
  doc.execCommand = () => false;
  k[0].click();
  await cakaj(30);
  eq([txt(k[0]), String(w.getSelection()).replace(/\s+/g, " ")], ["Kopírovať", "SK00 1111 2222 3333 4444 5555"], "bez schránky: označená hodnota");
});

// ------------------------------------------------------------------ texty a CSS
t("texty SK a CZ: rovnaké kľúče, žiadne zakázané slová (záloha, dni dodania, vyrábame, DPH, záruka, IBAN)", () => {
  const kluce = (o, p = "") => Object.keys(o).flatMap((k) => (o[k] && typeof o[k] === "object" ? kluce(o[k], p + k + ".") : [p + k])).sort();
  eq(kluce(TEXTY_DAKUJEME.sk), kluce(TEXTY_DAKUJEME.cz));
  for (const w of ["sk", "cz"]) {
    const T = TEXTY_DAKUJEME[w];
    const vsetko = JSON.stringify(T) + T.krokPripravaText("auto", "X") + T.krokPripravaText("kamion", null) + T.krokPripravaText("vzorky", "X") + T.kontaktText("1") + T.krokPlatbaPrijataText("1") + T.krokPrevzatieText("1");
    const z = vsetko.match(ZAKAZANE);
    over(!z, w + ": „" + (z && z[0]) + "“");
  }
});
t("CSS: blok LCD-OPC-DAKUJEME v luxuryCar.css, každý selektor pod html.lcd-opc-dakujeme / html.lcd-opc-dakujeme-caka, písmo ≥ 12 px", () => {
  const css = readFileSync(new URL("../assets/css/luxuryCar.css", import.meta.url), "utf8");
  const a = css.indexOf("/* ===== LCD-OPC-DAKUJEME START"), b = css.indexOf("/* ===== LCD-OPC-DAKUJEME END");
  over(a > 0 && b > a, "blok LCD-OPC-DAKUJEME nenájdený");
  const kus = css.slice(a, b);
  const sheet = new JSDOM("<style>" + kus + "</style>").window.document.styleSheets[0];
  const zleSel = [];
  let pocet = 0;
  const prejdi = (pravidla) => {
    for (const r of pravidla) {
      if (r.type === 1) for (const sel of r.selectorText.split(/,(?![^(]*\))/)) { pocet++; if (!/^html\.lcd-opc-dakujeme(-caka)?(?![\w-])/.test(sel.trim())) zleSel.push(sel.trim()); }
      else if (r.type === 4) prejdi(r.cssRules);
      else zleSel.push("iné pravidlo: " + r.cssText.slice(0, 60));
    }
  };
  prejdi(sheet.cssRules);
  over(pocet > 60, "len " + pocet + " selektorov");
  eq(zleSel, [], "selektory mimo html.lcd-opc-dakujeme*");
  const male = [...kus.matchAll(/font(?:-size)?:[^;}]*?(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 12);
  eq(male, [], "písmo pod 12 px");
});

await Promise.all(asyncTesty);
console.log(zle ? `\n${zle} ZLYHALO, ${ok} OK` : `\nVŠETKO OK (${ok} OK)`);
process.exit(zle ? 1 : 0);
