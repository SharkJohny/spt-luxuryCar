// REKONŠTRUKCIA ďakovnej stránky Shoptetu (/objednavka/dekujeme/) pre testy opc/dakujeme.js — NIE zachytené HTML.
// Skutočné HTML nemáme: stránka sa ukáže raz po objednávke a live-read zachytenie (test-opc-zachyt.mjs) objednávku
// nesmie odoslať. Podklady (30. 10. 2026):
//   - Michalova snímka CZ (images/72.webp): „OBJEDNÁVKA ODESLÁNA“, „Číslo 2820260033“, blok „Platba a doručení“ (Zvolená
//     doprava Expres Kurýr, Zvolená platba Převodem, Částka k úhradě 20 006 Kč | Bankovní účet 2002871802/2010,
//     Variabilní symbol 2820260033), „Obsah objednávky“ (fotka | názov + variant + Příplatky | 1 ks / 19 856 Kč | 19 856 Kč),
//     „Rekapitulaci Vám zašleme i e-mailem.“, „Děkujeme!“, „ZPĚT DO OBCHODU“,
//   - triedy šablóny Classic z CSS Shoptetu vo fixtures/cdn (order-summary-heading, reca-number, recapitulation-wrapper,
//     table.recapitulation-table, order-summary-item, summary-thx, order-complete-links, reca-payment-wrap, qrcode),
//   - názvy dopráv a platieb zo zachytených krokov 1 (fixtures/sk|cz/krok1.html).
// ❓ Neisté (doladí záznam lcdOpcDakujemeZaznam z Michalovej skúšobnej objednávky): presné značky a triedy, SK adresa
// (/objednavka/dakujeme/ vs /objednavka/dekujeme/), trieda tela (in-dekujeme?), pageType „thankYou“, ako Shoptet ukazuje
// stav platby kartou (texty „Platba … proběhla“ / „neproběhla“ a tlačidlo opakovanej platby sú odhad), tvar čísla účtu
// na SK (tu zjavne testovacie), QR obrázok na SK (tu zástupný obrázok „QR TEST“, nie skutočný kód).
// Celá stránka = obal zo zachyteného kroku 2 (fixtures/<web>/krok2.html: hlavička, päta, skripty Shoptetu) s vymeneným
// <main id="content">, triedou tela a pageType — obal ostáva mimo gitu (FIXTURES.md), tu je len náš obsah.

const NAS = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/";
const FOTO = { auto: NAS + "img/1v/dvoj-vzor-diamond.jpg", kamion: NAS + "img/1v/kamion-dvere-tapacir-2.jpg", vzorky: NAS + "img/kosik/rohoz-classic.jpg" };
/** Zástupný „QR TEST“ (nie skutočný platobný kód) — overuje len, že obrázok Shoptetu prevezmeme. */
const QR_TEST = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="#fff"/><rect x="8" y="8" width="144" height="144" fill="none" stroke="#000" stroke-width="4" stroke-dasharray="8 6"/><text x="80" y="88" font-family="Arial" font-size="22" text-anchor="middle">QR TEST</text></svg>');

export const CESTY = { cz: "/objednavka/dekujeme/", sk: "/objednavka/dakujeme/" }; // SK 🟡 (aj /objednavka/dekujeme/ sa rozpozná)
/** Návrat z platobnej brány Shoptet Pay (✅ GA4 11/2025–10/2026: referrer payment.shoptetpay.com -> SK
 *  /objednavka/dakujeme/?autoredir=off, CZ /objednavka/dekujeme/?autoredir=off; scratchpad nocny-beh/platby-matica.md). */
export const NAVRAT = "?autoredir=off";

/**
 * MATICA PLATIEB (31. 10. 2026, nocny-beh/platby-matica.md; id a názvy = zachytené kroky 1 fixtures/sk|cz/krok1.html):
 * SK 6 platieb, CZ 5 (rýchla platba cez banku = PIS len SK; CZ pis:0). brana = Shoptet Pay (payment.shoptetpay.com,
 * návrat na CESTY + NAVRAT); bez brány (prevod, dobierka) ide krok 2 rovno na CESTY. typ = časť kľúča variantu.
 */
export const MATICA_PLATIEB = {
  sk: [
    { id: "5", typ: "prevod", nazov: "Prevodom", druh: "prevod", brana: false },
    { id: "3", typ: "dobierka", nazov: "Dobierkou", druh: "dobierka", brana: false },
    { id: "103", typ: "karta", nazov: "Online platba kartou", druh: "karta", brana: true },
    { id: "106", typ: "apple", nazov: "Apple Pay", druh: "online", brana: true },
    { id: "109", typ: "google", nazov: "Google Pay", druh: "online", brana: true },
    { id: "112", typ: "pis", nazov: "Rýchla platba cez banku", druh: "online", brana: true },
  ],
  cz: [
    { id: "5", typ: "prevod", nazov: "Převodem", druh: "prevod", brana: false },
    { id: "87", typ: "dobierka", nazov: "Dobírka", druh: "dobierka", brana: false },
    { id: "114", typ: "karta", nazov: "Online platba kartou", druh: "karta", brana: true },
    { id: "117", typ: "apple", nazov: "Apple Pay", druh: "online", brana: true },
    { id: "120", typ: "google", nazov: "Google Pay", druh: "online", brana: true },
  ],
};

const NBSP = " ";
const cena = (web, n) => {
  const t = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return web === "cz" ? t + NBSP + "Kč" : "€" + t;
};

// ------------------------------------------------------------------ dáta (texty Shoptetu podľa webu)
const L = {
  cz: {
    heading: "Objednávka odeslána", cislo: "Číslo", blokPlatba: "Platba a doručení", doprava: "Zvolená doprava", platba: "Zvolená platba",
    suma: "Částka k úhradě", ucet: "Bankovní účet", vs: "Variabilní symbol", obsah: "Obsah objednávky", rekap: "Rekapitulaci Vám zašleme i e-mailem.",
    dakujeme: "Děkujeme!", spat: "Zpět do obchodu", title: "Děkujeme za objednávku - Luxury Car Design",
    dopravca: "Expres Kurýr", prevod: "Převodem", dobierka: "Dobírka", karta: "Online platba kartou", apple: "Apple Pay", google: "Google Pay",
    okText: "Platba byla úspěšně přijata.", nieText: "Platba neproběhla.", zaplatit: "Zaplatit",
    cakaText: "Platba byla zadána správně. Objednávka bude označena jako zaplacená, jakmile platbu obdržíme.",
  },
  sk: {
    heading: "Objednávka odoslaná", cislo: "Číslo", blokPlatba: "Platba a doručenie", doprava: "Zvolená doprava", platba: "Zvolená platba",
    suma: "Suma na úhradu", ucet: "Bankový účet", vs: "Variabilný symbol", obsah: "Obsah objednávky", rekap: "Rekapituláciu Vám zašleme aj e-mailom.",
    dakujeme: "Ďakujeme!", spat: "Späť do obchodu", title: "Ďakujeme za objednávku - Luxury Car Design",
    dopravca: "Expres kurier DPD", prevod: "Prevodom", dobierka: "Dobierkou", karta: "Online platba kartou", apple: "Apple Pay", google: "Google Pay",
    pis: "Rýchla platba cez banku",
    okText: "Platba bola úspešne prijatá.", nieText: "Platba neprebehla.", zaplatit: "Zaplatiť",
    cakaText: "Platba bola zadaná správne. Objednávka bude označená ako zaplatená, keď platbu prijmeme.",
    // 🟡 rýchla platba cez banku: bankový príkaz zadaný, banka ešte nepotvrdila (matica: stav „čaká“ ❓)
    cakaBankaText: "Platba čaká na potvrdenie banky.",
  },
};

const POLOZKY = {
  "cz-auto": [{ nazov: "luxusní autokoberce Dragonskin Elite DIAMOND LINE", variant: "Barva 1.vrstvy: Diamond Barva kůže: Fialová, Barva 2.vrstvy: Lux Color 10",
    priplatky: "Příplatky: rozložení koberců - první a druhá řada, autokoberce do kufru - Koberec na dno kufru, Barva boxů - Barva kůže: výnově červena, TYP - Coupe, Velikost 1. boxu - XL: 66x32x30 cm, Velikost 2. boxu - M : 40x32x30 cm",
    ks: 1, cena: 19856, foto: FOTO.auto }],
  "sk-auto": [{ nazov: "luxusné autokoberce Dragonskin Elite DIAMOND LINE", variant: "Farba 1.vrstvy: Diamond Farba kože: Čierna / Farba šitia: Červená, Farba 2.vrstvy: Lux Color 10",
    priplatky: "Príplatky: rozloženie kobercov - prvý a druhý rad, autokoberce do kufra - Koberec na dno kufra, TYP - Combi",
    ks: 1, cena: 759, foto: FOTO.auto }],
  "sk-kamion": [{ nazov: "luxusné autokoberce do kamionov", variant: "",
    priplatky: "Príplatky: Typ materiálu - Prémiová syntetická koža – prešívaná, Farba materiálu - Čierna, čierne šitie – 11, Farba lemovania - Čierny základ, červené pásiky – 04, Rozloženie nášiviek - Šofér + spolujazdec + stred (BALÍK), Typ nášiviek na boky - Nášivka H19, Tapacír - Áno chcem (v konfigurátore – balík)",
    ks: 1, cena: 589, foto: FOTO.kamion }],
  "sk-vzorky": [{ nazov: "Vzorkovník Dragonskin – objednávka vzoriek", variant: "", priplatky: "Príplatky: Vzorka 2. vrstva – Lux Color 10 – Čierna (LUX-10) - Áno", ks: 1, cena: 5, foto: FOTO.vzorky }],
};

/**
 * Varianty: web, platba (prevod | dobierka | <brána>-ok | -nie | -pred | -ticho | -text, brána = karta | apple | google | pis),
 * košík, značky; navrat: true = adresa návratu z brány (CESTY + NAVRAT, ?autoredir=off).
 * „pred“ = tlačidlo platby bez textu o výsledku (🟡 pred presmerovaním na bránu), „ticho“ = ani text, ani tlačidlo,
 * „text“ = vlastná veta Shoptetu (text) a voliteľne tlačidlo vo formulári (tlacidlo: { form, text }); nadpis = iný nadpis.
 * chyba: chýbajúce kľúčové údaje -> modul musí nechať pôvodnú stránku (fallback).
 */
export const VARIANTY = {
  "cz-prevod": { web: "cz", platba: "prevod", kosik: "auto", cislo: "2820260033", doprava: 150, ucet: "2002871802/2010" },
  "cz-karta-ok": { web: "cz", platba: "karta-ok", kosik: "auto", cislo: "2820260034", doprava: 150 },
  "cz-karta-nie": { web: "cz", platba: "karta-nie", kosik: "auto", cislo: "2820260035", doprava: 150 },
  "cz-dobierka": { web: "cz", platba: "dobierka", kosik: "auto", cislo: "2820260036", doprava: 200 },
  "sk-prevod": { web: "sk", platba: "prevod", kosik: "auto", cislo: "1820260047", doprava: 5, ucet: "SK00 1111 2222 3333 4444 5555", qr: true },
  "sk-karta-ok": { web: "sk", platba: "karta-ok", kosik: "auto", cislo: "1820260048", doprava: 5 },
  "sk-karta-nie": { web: "sk", platba: "karta-nie", kosik: "auto", cislo: "1820260049", doprava: 5 },
  "sk-dobierka": { web: "sk", platba: "dobierka", kosik: "auto", cislo: "1820260050", doprava: 8 },
  "sk-kamion": { web: "sk", platba: "prevod", kosik: "kamion", cislo: "1820260051", doprava: 5, ucet: "SK00 1111 2222 3333 4444 5555" },
  "sk-vzorky": { web: "sk", platba: "prevod", kosik: "vzorky", cislo: "1820260052", doprava: 5, ucet: "SK00 1111 2222 3333 4444 5555" },
  // stavy karty bez jednoznačného výsledku a iné platby
  "cz-karta-pred": { web: "cz", platba: "karta-pred", kosik: "auto", cislo: "2820260037", doprava: 150 },
  "cz-karta-ticho": { web: "cz", platba: "karta-ticho", kosik: "auto", cislo: "2820260038", doprava: 150 },
  "cz-karta-nie-ucet": { web: "cz", platba: "karta-nie", kosik: "auto", cislo: "2820260039", doprava: 150, ucet: "2002871802/2010" },
  "sk-apple-ok": { web: "sk", platba: "apple-ok", kosik: "auto", cislo: "1820260053", doprava: 5 },
  // revízia 31. 10. 2026 (N1/K1/K2/N2): karta s vlastným textom Shoptetu (text) a tlačidlom vo formulári (tlacidlo)
  // PENDING podľa dokumentácie platobných brán Shoptetu („zadaná správne“, „bude označená ako zaplatená“) — 🟡 znenie je rekonštrukcia
  "cz-karta-caka": { web: "cz", platba: "karta-text", kosik: "auto", cislo: "2820260046", doprava: 150, text: "Platba byla zadána správně. Objednávka bude označena jako zaplacená, jakmile platbu obdržíme." },
  "sk-karta-caka": { web: "sk", platba: "karta-text", kosik: "auto", cislo: "1820260055", doprava: 5, text: "Platba bola zadaná správne. Objednávka bude označená ako zaplatená, keď platbu prijmeme." },
  // veta o OBJEDNÁVKE (nie o platbe) pri nezaplatenej karte
  "cz-karta-prijata": { web: "cz", platba: "karta-text", kosik: "auto", cislo: "2820260047", doprava: 150, text: "Vaše objednávka byla přijata." },
  "cz-karta-ceka-zaplaceni": { web: "cz", platba: "karta-text", kosik: "auto", cislo: "2820260048", doprava: 150, text: "Objednávka přijata, čeká na zaplacení." },
  "cz-karta-po-zaplaceni": { web: "cz", platba: "karta-text", kosik: "auto", cislo: "2820260049", doprava: 150, text: "Objednávka bude potvrzena po zaplacení." },
  "sk-karta-prijata-nadpis": { web: "sk", platba: "karta-ticho", kosik: "auto", cislo: "1820260056", doprava: 5, nadpis: "Objednávka bola prijatá" },
  // text o neúspechu bez rozpoznaného tlačidla: náš blok by nemal ako zaplatiť znova -> stránka Shoptetu
  "cz-karta-nie-text": { web: "cz", platba: "karta-text", kosik: "auto", cislo: "2820260050", doprava: 150, text: "Platba neproběhla." },
  // tlačidlo platby = <button> vo <form action> na bránu (bez href), vedľa veta o prijatí objednávky
  "cz-karta-form": { web: "cz", platba: "karta-text", kosik: "auto", cislo: "2820260051", doprava: 150, text: "Vaše objednávka byla přijata.",
    tlacidlo: { form: "https://gate.gopay.cz/gw/v3/TEST", text: "Přejít na platební bránu" } },
  // iné značky a poradie (dl/dt/dd, span + strong, prehodené riadky): hodnoty sa berú podľa popisov, nie podľa poradia
  "cz-ine-znacky": { web: "cz", platba: "prevod", kosik: "auto", cislo: "2820260040", doprava: 150, ucet: "2002871802/2010", znacky: "ine" },
  // fallback: chýba kľúčový údaj
  "cz-chyba-suma": { web: "cz", platba: "prevod", kosik: "auto", cislo: "2820260041", doprava: 150, ucet: "2002871802/2010", bez: "suma" },
  "cz-chyba-cislo": { web: "cz", platba: "prevod", kosik: "auto", cislo: "2820260042", doprava: 150, ucet: "2002871802/2010", bez: "cislo" },
  "cz-chyba-platba": { web: "cz", platba: "prevod", kosik: "auto", cislo: "2820260043", doprava: 150, ucet: "2002871802/2010", bez: "platba" },
  "cz-chyba-ucet": { web: "cz", platba: "prevod", kosik: "auto", cislo: "2820260044", doprava: 150, bez: "ucet" },
  "sk-chyba-suma": { web: "sk", platba: "prevod", kosik: "auto", cislo: "1820260054", doprava: 5, ucet: "SK00 1111 2222 3333 4444 5555", bez: "suma" },
  "cz-neznama-platba": { web: "cz", platba: "prevod", kosik: "auto", cislo: "2820260045", doprava: 150, ucet: "2002871802/2010", nazovPlatby: "Hotově na prodejně" },
  // rýchla platba cez banku (len SK): bankový príkaz čaká na potvrdenie banky (🟡 znenie rekonštrukcia) -> stránka Shoptetu
  "sk-pis-caka-banka": { web: "sk", platba: "pis-text", kosik: "auto", cislo: "1820260090", doprava: 5, navrat: true, textKluc: "cakaBankaText" },
};

// Matica platieb (MATICA_PLATIEB): každá platba cez bránu má variant pred bránou (-pred: tlačidlo Shoptetu, bez výsledku)
// a po návrate z brány (?autoredir=off): -nie (neúspech + tlačidlo), -ok (úspech), -caka (PENDING), -ticho (nič).
// Kľúč <web>-<typ>-<situácia>, napr. sk-pis-nie, cz-google-ok. Existujúce varianty karty ostávajú, návratové
// (-ok, -nie, -caka) dostanú navrat.
{
  const cislo = { sk: 1820260060, cz: 2820260060 };
  for (const web of ["sk", "cz"]) for (const p of MATICA_PLATIEB[web]) {
    if (!p.brana) continue;
    for (const sit of ["pred", "nie", "ok", "caka", "ticho"]) {
      const k = web + "-" + p.typ + "-" + sit;
      const navrat = sit !== "pred";
      if (VARIANTY[k]) { if (navrat) VARIANTY[k].navrat = true; continue; }
      VARIANTY[k] = { web, platba: p.typ + "-" + (sit === "caka" ? "text" : sit), kosik: "auto", cislo: String(cislo[web]++), doprava: web === "cz" ? 150 : 5, navrat };
      if (sit === "caka") VARIANTY[k].textKluc = "cakaText";
    }
  }
}

/** Čo má modul z variantu vyčítať (pre testy). */
export function ocakavane(kluc) {
  const v = VARIANTY[kluc];
  const t = L[v.web];
  const pol = POLOZKY[v.web + "-" + v.kosik];
  const tovar = pol.reduce((s, p) => s + p.cena * p.ks, 0);
  const suma = tovar + v.doprava;
  const typ = v.platba.split("-")[0]; // prevod | dobierka | karta | apple | google | pis
  if (!t[typ]) throw new Error("platba " + typ + " nie je na webe " + v.web + " (MATICA_PLATIEB)");
  const platbaNazov = v.nazovPlatby || t[typ];
  // stavPodlaTextu = čo by modul ukázal, keby smel „Zaplatené“ podľa textu (ZAPLATENE_PODLA_TEXTU / o.zaplatenePodlaTextu);
  // stav = skutočné správanie: „Zaplatené“ podľa textu nie (kým to nepotvrdí záznam), karta bez rozpoznaného tlačidla a bez
  // jednoznačného výsledku = null (ostane stránka Shoptetu, dovod „stav platby…“)
  const maTlacidlo = /-nie$|-pred$/.test(v.platba) || !!v.tlacidlo;
  const stavPodlaTextu = v.bez ? null : v.nazovPlatby ? null
    : v.platba === "prevod" ? "prevod" : v.platba === "dobierka" ? "dobierka" : /-ok$/.test(v.platba) ? "zaplatene" : maTlacidlo ? "neprebehla" : null;
  const stav = stavPodlaTextu === "zaplatene" ? null : stavPodlaTextu;
  return {
    web: v.web, stav, stavPodlaTextu, povodna: stav === null && !v.bez && !v.nazovPlatby, cislo: v.cislo, suma, sumaText: cena(v.web, suma), tovar, doprava: v.doprava, dopravaText: cena(v.web, v.doprava),
    dopravca: t.dopravca, platba: platbaNazov, ucet: v.ucet || null, vs: v.ucet ? v.cislo : null, qr: !!v.qr,
    polozky: pol.map((p) => ({ nazov: p.nazov.charAt(0).toLocaleUpperCase() + p.nazov.slice(1), ks: p.ks, cena: p.cena * p.ks, foto: p.foto })),
    odkazPlatby: /-nie$|-pred$/.test(v.platba) ? "/action/ShoptetPay/pay/?orderCode=" + v.cislo + "&hash=TEST" : null,
    odkazForm: v.tlacidlo ? v.tlacidlo.form : null,
    druh: v.kosik, typ, navrat: !!v.navrat, adresa: CESTY[v.web] + (v.navrat ? NAVRAT : ""),
  };
}

// ------------------------------------------------------------------ HTML obsahu (vnútro <main id="content">)
function riadokPopisu(n, h) {
  return `<tr><th>${n}</th><td><strong>${h}</strong></td></tr>`;
}
function polozkaHtml(web, p) {
  const casti = [p.nazov, p.variant, p.priplatky].filter(Boolean).join("<br>\n              ");
  return `<tr>
            <td class="cart-p-image"><img src="${p.foto}" alt="${p.nazov}" width="70" height="70"></td>
            <td class="p-name">${casti}</td>
            <td class="p-quantity">${p.ks} ks / <strong>${cena(web, p.cena)}</strong></td>
            <td class="p-total">${cena(web, p.cena * p.ks)}</td>
          </tr>`;
}
function stavPlatbyHtml(v, t, o) {
  const sit = v.platba.split("-")[1] || ""; // ok | nie | pred | text | ticho (prevod, dobierka: nič)
  if (sit === "ok") return `<div class="reca-payment-wrap"><p class="payment-status">${t.okText}</p></div>`;
  if (sit === "nie") return `<div class="reca-payment-wrap"><p class="payment-status">${t.nieText}</p><a href="${o.odkazPlatby}" class="btn btn-primary">${t.zaplatit}</a></div>`;
  if (sit === "pred") return `<div class="reca-payment-wrap"><a href="${o.odkazPlatby}" class="btn btn-primary">${t.zaplatit}</a></div>`;
  if (sit === "text") {
    const tl = v.tlacidlo ? `<form method="post" action="${v.tlacidlo.form}"><button type="submit" class="btn btn-primary">${v.tlacidlo.text}</button></form>` : "";
    return `<div class="reca-payment-wrap"><p class="payment-status">${v.text || t[v.textKluc]}</p>${tl}</div>`;
  }
  return "";
}

/** Vnútro <main id="content"> pre variant (rekonštrukcia, viď hlavičku súboru). */
export function obsah(kluc) {
  const v = VARIANTY[kluc];
  if (!v) throw new Error("neznámy variant ďakovnej stránky: " + kluc);
  const t = L[v.web], o = ocakavane(kluc);
  const pol = POLOZKY[v.web + "-" + v.kosik];
  const r1 = [], r2 = [];
  r1.push(riadokPopisu(t.doprava, t.dopravca));
  if (v.bez !== "platba") r1.push(riadokPopisu(t.platba, o.platba));
  if (v.bez !== "suma") r1.push(riadokPopisu(t.suma, o.sumaText));
  if (o.ucet && v.bez !== "ucet") { r2.push(riadokPopisu(t.ucet, o.ucet)); r2.push(riadokPopisu(t.vs, o.vs)); }
  const qr = v.qr ? `<div class="reca-payment-wrap"><img class="qrcode" src="${QR_TEST}" width="160" height="160" alt="QR platba"></div>` : "";
  const cislo = v.bez === "cislo" ? "" : `<p class="reca-number">${t.cislo} <strong>${v.cislo}</strong></p>`;
  let platbaBlok;
  if (v.znacky === "ine") {
    // iné značky a poradie: definičný zoznam, prehodené riadky, popisy s dvojbodkou, hodnota v span
    const dd = (n, h) => `<dt>${n}:</dt><dd><span class="value">${h}</span></dd>`;
    platbaBlok = `<dl class="recapitulation-list">
          ${dd(t.vs, o.vs)}
          ${dd(t.suma, o.sumaText)}
          ${dd(t.ucet, o.ucet)}
          ${dd(t.platba, o.platba)}
          ${dd(t.doprava, t.dopravca)}
        </dl>`;
  } else {
    platbaBlok = `<div class="row">
          <div class="col-sm-6"><table class="table recapitulation-table"><tbody>
            ${r1.join("\n            ")}
          </tbody></table></div>
          ${r2.length ? `<div class="col-sm-6"><table class="table recapitulation-table"><tbody>
            ${r2.join("\n            ")}
          </tbody></table></div>` : ""}
        </div>`;
  }
  return `
    <!-- REKONŠTRUKCIA ďakovnej stránky Shoptetu (tools/test-opc/dakujeme-fixtures.mjs, variant ${kluc}) — nie zachytené HTML -->
    <div class="content-inner">
      <h1 class="order-summary-heading">${v.nadpis || t.heading}</h1>
      ${v.znacky === "ine" ? `<div class="reca-number"><span>${t.cislo}:</span> <b>${v.cislo}</b></div>` : cislo}
      <div class="recapitulation-wrapper">
        <div class="co-box co-payment-method">
          <h4 class="order-summary-inner-heading">${t.blokPlatba}</h4>
          ${platbaBlok}
          ${qr}
          ${stavPlatbyHtml(v, t, o)}
        </div>
        <div class="co-box co-order-content">
          <h4 class="order-summary-inner-heading">${t.obsah}</h4>
          <table class="table cart-table"><tbody>
          ${pol.map((p) => polozkaHtml(v.web, p)).join("\n          ")}
          </tbody></table>
        </div>
        <p class="order-summary-item">${t.rekap}</p>
        <p class="summary-thx">${t.dakujeme}</p>
      </div>
      <div class="order-complete-links"><a href="/" class="btn btn-secondary">${t.spat}</a></div>
    </div>
  `;
}

/**
 * Celá stránka: obal zachyteného kroku 2 (fixtures/<web>/krok2.html) s obsahom variantu namiesto <main id="content">,
 * telo „id--18 in-dekujeme|in-dakujeme“ (🟡), pageType „thankYou“ (🟡), titulok ako na snímke.
 */
export function stranka(kluc, obalKroku2) {
  const v = VARIANTY[kluc];
  const h = String(obalKroku2 || "");
  const a = h.indexOf('<main id="content"'), b = h.indexOf("</main>", a);
  if (a < 0 || b < 0) throw new Error("obal kroku 2 bez <main id=\"content\"> (fixtures/" + v.web + "/krok2.html)");
  const zac = h.indexOf(">", a) + 1;
  let x = h.slice(0, zac) + obsah(kluc) + h.slice(b);
  x = x.replace(/\bid--17 in-krok-2\b/, "id--18 " + (v.web === "sk" ? "in-dakujeme" : "in-dekujeme"));
  x = x.replace(/"pageType":\s*"customerDetails"/g, '"pageType": "thankYou"');
  x = x.replace(/<title>[^<]*<\/title>/, "<title>" + L[v.web].title + "</title>");
  return x;
}

/** Minimálna stránka pre jsdom (bez obalu Shoptetu): telo, hlavný obsah, adresa. */
export function strankaJsdom(kluc, { telo } = {}) {
  const v = VARIANTY[kluc];
  return `<!doctype html><html lang="${v.web === "cz" ? "cs" : "sk"}"><head><title>${L[v.web].title}</title></head>
<body class="${telo != null ? telo : "desktop id--18 " + (v.web === "sk" ? "in-dakujeme" : "in-dekujeme") + " template-11 ordering-process"}">
<div class="overall-wrapper"><header id="header"><div class="container">hlavička</div></header>
<div id="content-wrapper" class="container content-wrapper"><div class="content-wrapper-in"><main id="content" class="content wide">${obsah(kluc)}</main></div></div>
<footer id="footer">päta</footer></div>
<script>/* skript Shoptetu na stránke (záznam ho nesmie uložiť) */ window.__shoptetTest = 1;</script>
</body></html>`;
}
