// Scenáre rýchlej platby cez banku (Shoptet Pay „pis“, SK 112) — Michal 30. 10. 2026 na iPhone: „Rýchla platba bankou“
// ho z OPC poslala na starý krok 1 a okno „Vyberte vašu banku“ bolo čierne a nečitateľné. S46: výber banky priamo v OPC
// (opc/banka.js) s telom Step1Validate rovnakým ako formulár kroku 1 Shoptetu (zachytené v tom istom behu z checkout-3g.js
// nad fixtures) a čitateľné okno Shoptet Pay na bežnom kroku 1 (_lcdPlatbaBanka.scss, pre všetkých). Údaje zákazníka sú
// vymyslené, odoslanie ide len do podvrhu (tools/test-opc/podvrh.mjs), do Shoptetu ani do banky neodíde nič.
import {
  KROK1, KROK2, ID, stavOpc, cakajOpc, naKrok2, zvolPlatbu, vyplnUdaje, suhlas, objednaj, overTeloObjednavky, step1Xhr, over, pauza,
} from "./krok2-pomoc.mjs";

const VUB = "vub_banka_oauth_client_sk", TATRA = "tatra_banka_oauth_client_sk";

/**
 * Kontrast textu (WCAG) voči skutočnému pozadiu: prvý predok s nepriehľadným pozadím; pri zvislom prechode (zelené
 * tlačidlá LCD #3f9a44 → #2e7d32 → #256b29) farba v strede tlačidla, kde leží text. z = [[meno, selektor], …] -> { meno:
 * pomer | null (prvok chýba) }.
 */
export const KONTRAST = (z) => `(function () {
  var rgb = function (s) { var m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; var p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  var lum = function (c) { var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  var pomer = function (a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // prechod -> farba v 50 % (zastávky „rgb(…) 55%“; bez percent rovnomerne)
  var stred = function (bi) {
    var z = [], re = /(rgba?\\([^)]+\\))\\s*([\\d.]+%)?/g, m;
    while ((m = re.exec(bi))) z.push({ c: rgb(m[1]), p: m[2] ? parseFloat(m[2]) : null });
    if (!z.length) return null;
    z.forEach(function (x, i) { if (x.p === null) x.p = z.length === 1 ? 50 : (100 * i) / (z.length - 1); });
    for (var i = 0; i < z.length - 1; i++) if (z[i].p <= 50 && z[i + 1].p >= 50) {
      var t = z[i + 1].p === z[i].p ? 0 : (50 - z[i].p) / (z[i + 1].p - z[i].p), a = z[i].c, b = z[i + 1].c;
      return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: 1 };
    }
    return z[z.length - 1].c;
  };
  var pozadia = function (e) {
    for (var x = e; x; x = x.parentElement) {
      var c = getComputedStyle(x);
      var g = /gradient/.test(c.backgroundImage) ? stred(c.backgroundImage) : null;
      if (g && g.a > 0.5) return [g];
      var b = rgb(c.backgroundColor); if (b && b.a > 0.5) return [b];
    }
    return [{ r: 255, g: 255, b: 255, a: 1 }];
  };
  var out = {};
  ${JSON.stringify(z)}.forEach(function (x) {
    var e = document.querySelector(x[1]); if (!e) { out[x[0]] = null; return; }
    var t = rgb(getComputedStyle(e).color);
    out[x[0]] = Math.round(Math.min.apply(null, pozadia(e).map(function (b) { return pomer(t, b); })) * 100) / 100;
  });
  return out;
})()`;

/** Okno Shoptet Pay na kroku 1 (colorbox, šablóna #template__pisModal). */
const SHOPTET = [["nadpis", "#cboxLoadedContent .content-modal h2"], ["krajina", "#cboxLoadedContent .pisModal__countrySelection"],
  ["banka", "#cboxLoadedContent .pisModal__bankItem:not(.pisModal__bankItem--active) .pisModal__bankName"],
  ["zvolena", "#cboxLoadedContent .pisModal__bankItem--active .pisModal__bankName"],
  ["spat", "#cboxLoadedContent .pisModal__actions__close"], ["potvrdit", "#cboxLoadedContent .pisModal__actions__confirm"]];
/** Okno výberu banky v OPC (opc/banka.js). */
const OPC_OKNO = [["nadpis", "[data-lcd-opc-banky] h2"], ["krajina", "[data-lcd-opc-banky] select"],
  ["banka", "[data-lcd-opc-banky] .lcd-opc-banky__banka:not(.lcd-opc-banky__banka--zvolena) .lcd-opc-banky__meno"],
  ["zvolena", "[data-lcd-opc-banky] .lcd-opc-banky__banka--zvolena .lcd-opc-banky__meno"],
  ["spat", "[data-lcd-opc-banky] .lcd-opc-banky__spat"], ["potvrdit", "[data-lcd-opc-banky] .lcd-opc-banky__potvrdit"]];

/** Okno OPC: stav pre kontroly (null = zavreté). */
const OKNO = `(function () {
  var k = document.querySelector("[data-lcd-opc-banky]"); if (!k) return null;
  var d = k.querySelector("[role=dialog]"), sel = k.querySelector("select"), zv = k.querySelector("input[type=radio]:checked");
  var z = k.querySelector(".lcd-opc-banky__zoznam"), r = d.getBoundingClientRect(), rz = z.getBoundingClientRect();
  var schovane = Array.prototype.filter.call(z.querySelectorAll(".lcd-opc-banky__banka"), function (l) { var x = l.getBoundingClientRect(); return x.top < rz.top - 1 || x.bottom > rz.bottom + 1; }).length;
  var pismo = Array.prototype.map.call(k.querySelectorAll("h2, .lcd-opc-banky__meno, button, select"), function (e) { return parseFloat(getComputedStyle(e).fontSize); });
  return { nadpis: d.querySelector("h2").textContent, aria: d.getAttribute("aria-modal"), krajina: sel ? sel.value : null, banky: z.querySelectorAll("input[type=radio]").length,
    zvolena: zv ? zv.value : null, cesta: location.pathname, vOkne: r.top >= -1 && r.left >= -1 && r.bottom <= innerHeight + 1 && r.right <= innerWidth + 1,
    schovane: schovane, pozadie: getComputedStyle(d).backgroundColor, minPismo: Math.min.apply(null, pismo),
    fokus: !!document.activeElement && k.contains(document.activeElement) };
})()`;

/** Riadok rýchlej platby v sekcii OPC: rádio, odkaz na krok 1, zvolená banka, „Zmeniť banku“ viditeľné. */
const RIADOK = `(function () {
  var w = document.querySelector('#lcd-opc [data-submethod="pis"]'); if (!w) return null;
  var i = w.querySelector('input[name="billingId"]'), b = w.querySelector(".lcd-opc-banka"), z = w.querySelector(".lcd-opc-banka__zmenit");
  var vid = function (e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
  return { radio: !!i, zaskrtnute: !!(i && i.checked), aktivny: w.classList.contains("active"), odkaz: !!w.querySelector('a[href="/objednavka/krok-1/"]'),
    banka: b ? b.querySelector(".lcd-opc-banka__meno").textContent : null, vidnoBanku: vid(b), zmenit: vid(z),
    podmienky: b ? Array.prototype.map.call(b.querySelectorAll(".lcd-opc-banka__podmienky a"), function (a) { return a.getAttribute("href"); }) : [] };
})()`;

const ulozenaBanka = (s) => s.ev(`(function () { try { return [localStorage.getItem("pisBankSelected"), localStorage.getItem("pisCountrySelected"), localStorage.getItem("pisCurrencySelected")]; } catch (e) { return null; } })()`);
const kontrastOk = (k) => Object.keys(k).filter((x) => !(k[x] >= 4.5));

export const SCENARE = {
  S46: {
    len: "sk",
    popis: "Rýchla platba cez banku priamo v OPC (Michal 30. 10. 2026): ťuk na 112 otvorí okno výberu banky na tej istej stránke (bez kroku 1), Späť nič nepošle, Potvrdiť pošle Step1Validate s kódom banky = telo formulára kroku 1 Shoptetu; Zmeniť banku; objednávka 1× so 112 a zvolenou bankou. Okno Shoptet Pay na bežnom kroku 1 je biele a čitateľné",
    async fn(J) {
      const casti = [];
      const id = ID.sk;
      // a) bežný tok bez OPC: klasický krok 1, okno Shoptet Pay (checkout-3g.js), VÚB, Potvrdiť, Pokračovať = telo formulára
      let s = await J.novaStranka({ bezOpc: true });
      await s.chod(KROK1, { popis: "klasický krok 1 (bez OPC)" });
      await s.odmietniCookies();
      await s.klikni('label[for="billingId-112"]', { popis: "Rýchla platba cez banku (krok 1)" });
      await s.cakaj(`!!document.querySelector("#cboxLoadedContent .pisModal__bankItem")`, { ms: 10000, popis: "okno Shoptet Pay" });
      await pauza(900); // colorbox sa dorovná (animácia)
      const sh = await s.ev(`(function () { var l = document.querySelector("#cboxLoadedContent"), z = document.querySelector("#cboxLoadedContent .pisModal__bankSelection");
        var c = document.getElementById("colorbox").getBoundingClientRect();
        return { pozadie: getComputedStyle(l).backgroundColor, polozky: z.querySelectorAll(".pisModal__bankItem").length, posuv: z.scrollHeight - z.clientHeight,
          vOkne: c.top >= -1 && c.bottom <= innerHeight + 1 }; })()`);
      const ksh = await s.ev(KONTRAST(SHOPTET));
      over(sh.pozadie === "rgb(255, 255, 255)" && !kontrastOk(ksh).length, "okno Shoptet Pay na kroku 1 nie je čitateľné (pozadie " + sh.pozadie + ", kontrast < 4,5: " + JSON.stringify(ksh) + ")");
      over(sh.polozky === 6 && sh.posuv <= 1 && sh.vOkne, "okno Shoptet Pay: nie všetkých 6 bánk vidno bez posúvania alebo okno presahuje obrazovku: " + JSON.stringify(sh));
      casti.push("krok 1: okno Shoptet Pay biele, kontrast ≥ " + Math.min(...Object.values(ksh)));
      await s.klikni(`#cboxLoadedContent .pisModal__bankItem[data-bank-guid="${VUB}"]`, { popis: "VÚB (okno Shoptet Pay)" });
      await s.klikni("#cboxLoadedContent .pisModal__actions__confirm", { popis: "Potvrdiť výber (okno Shoptet Pay)" });
      await s.cakaj(`!document.querySelector("#cboxLoadedContent .pisModal__bankItem") || getComputedStyle(document.getElementById("colorbox")).display === "none"`, { ms: 5000, popis: "okno Shoptet Pay zavreté" });
      over((await s.ev(`(document.querySelector('input[name="shoptetPayPisCode"]') || {}).value`)) === VUB, "krok 1: VÚB nie je v poli shoptetPayPisCode");
      s.p.reset();
      await s.klikni("#orderFormButton", { popis: "Pokračovať (krok 1)" });
      await s.cakajNaStranku(KROK2, "in-krok-2");
      const formular = s.p.zaznam.step1.filter((x) => !x.xhr);
      over(formular.length === 1, "krok 1 neposlal formulár Step1Validate (" + formular.length + "×)");
      const teloKrok1 = formular[0].telo;
      over(new URLSearchParams(teloKrok1).get("shoptetPayPisCode") === VUB && new URLSearchParams(teloKrok1).get("billingId") === id.banka, "telo formulára kroku 1: " + teloKrok1);
      const ulozene = await ulozenaBanka(s);
      over(ulozene && ulozene[0] === VUB && ulozene[1] === "SK", "widget kroku 1 si banku nezapamätal: " + JSON.stringify(ulozene));
      casti.push("formulár kroku 1: " + teloKrok1);
      await s.zavri();

      // b) OPC (tá istá banka ako na kroku 1, localStorage): ťuk na 112 -> okno na tej istej stránke; Späť nič; Potvrdiť VÚB
      s = await J.novaStranka();
      await naKrok2(s);
      let r = await s.ev(RIADOK);
      over(r && r.radio && !r.odkaz && !r.zaskrtnute && !r.vidnoBanku, "rýchla platba nie je rádio v OPC (alebo vedie na krok 1): " + JSON.stringify(r));
      s.p.reset();
      await zvolPlatbu(s, id.banka);
      await s.cakaj(`!!document.querySelector("[data-lcd-opc-banky] [role=dialog]")`, { ms: 5000, popis: "okno výberu banky v OPC" });
      await pauza(300);
      let o = await s.ev(OKNO);
      over(o.cesta === KROK2 && o.aria === "true" && o.krajina === "SK" && o.banky === 6 && o.zvolena === VUB && o.fokus,
        "okno OPC: " + JSON.stringify(o));
      over(o.vOkne && o.schovane === 0 && o.pozadie === "rgb(255, 255, 255)" && o.minPismo >= 16, "okno OPC: celé na obrazovke, všetkých 6 bánk, biele, písmo ≥ 16 px: " + JSON.stringify(o));
      const kopc = await s.ev(KONTRAST(OPC_OKNO));
      over(!kontrastOk(kopc).length, "okno OPC: kontrast < 4,5: " + JSON.stringify(kopc));
      await pauza(400);
      over(step1Xhr(s).length === 0, "ťuk na rýchlu platbu poslal Step1Validate ešte pred výberom banky: " + JSON.stringify(step1Xhr(s).map((x) => x.telo)));
      await s.klikni("[data-lcd-opc-banky] .lcd-opc-banky__spat", { popis: "Späť (okno OPC)" });
      await pauza(700);
      let st = await stavOpc(s);
      over(!(await s.ev(OKNO)) && st.platbaUI === id.prevod && st.potvrdene.platba === id.prevod && st.stav === "krok2-potvrdene" && step1Xhr(s).length === 0,
        "Späť: okno, rádio alebo session sa zmenili: " + JSON.stringify({ ui: st.platbaUI, potvrdene: st.potvrdene, stav: st.stav, step1: step1Xhr(s).length }));
      casti.push("okno na " + o.cesta + ", Späť = prevod, 0× Step1Validate");
      await zvolPlatbu(s, id.banka);
      await s.cakaj(`!!document.querySelector("[data-lcd-opc-banky] [role=dialog]")`, { ms: 5000, popis: "okno výberu banky (2.)" });
      await s.klikni("[data-lcd-opc-banky] .lcd-opc-banky__potvrdit", { popis: "Potvrdiť výber (okno OPC)" });
      await s.cakaj(`window.__lcdOpc && window.__lcdOpc.stav === "krok2-potvrdene" && window.__lcdOpc.krok2.sync.potvrdene().platba === "112"`, { ms: 8000, popis: "112 potvrdená" });
      st = await stavOpc(s);
      r = await s.ev(RIADOK);
      let x = step1Xhr(s);
      over(x.length === 1 && x[0].telo === teloKrok1, "Step1Validate z OPC ≠ formulár kroku 1 Shoptetu:\n        OPC:    " + x.map((y) => y.telo).join(" | ") + "\n        krok 1: " + teloKrok1);
      over(/Rýchla platba cez banku/.test(st.platbaSuhrn || "") && st.platbaUI === id.banka && r.aktivny && r.banka === "VUB" && r.vidnoBanku && r.zmenit,
        "po potvrdení: " + JSON.stringify({ suhrn: st.platbaSuhrn, ui: st.platbaUI, riadok: r }));
      over(r.podmienky.length === 2 && r.podmienky.every((h) => /^https:\/\/www\.saltedge\.com\//.test(h)), "podmienky Shoptet Pay pri banke: " + JSON.stringify(r.podmienky));
      over(!s.dokumenty().length, "stránka odišla (navigácia): " + s.dokumenty().join(", "));
      casti.push("Potvrdiť VÚB: Step1Validate = telo kroku 1, súhrn „" + st.platbaSuhrn + "“");

      // c) Zmeniť banku -> Tatra: Step1Validate s novým kódom (tá istá platba), localStorage ako widget kroku 1
      s.p.reset();
      await s.klikni("#lcd-opc .lcd-opc-banka__zmenit", { popis: "Zmeniť banku" });
      await s.cakaj(`!!document.querySelector("[data-lcd-opc-banky] [role=dialog]")`, { ms: 5000, popis: "okno (Zmeniť banku)" });
      o = await s.ev(OKNO);
      over(o.zvolena === VUB, "Zmeniť banku: okno neukazuje zvolenú VÚB: " + JSON.stringify(o));
      await s.klikni(`[data-lcd-opc-banky] label[data-kod="${TATRA}"]`, { popis: "Tatra Banka (okno OPC)" });
      await s.klikni("[data-lcd-opc-banky] .lcd-opc-banky__potvrdit", { popis: "Potvrdiť výber (Tatra)" });
      await s.cakaj(`document.querySelector("#lcd-opc .lcd-opc-banka__meno").textContent === "Tatra Banka"`, { ms: 3000, popis: "Tatra v riadku" });
      for (let i = 0; i < 80 && !step1Xhr(s).length; i++) await pauza(100);
      await s.cakaj(`window.__lcdOpc.stav === "krok2-potvrdene"`, { ms: 8000, popis: "potvrdené po zmene banky" });
      await pauza(300);
      x = step1Xhr(s);
      over(x.length === 1 && x[0].telo === teloKrok1.replace(VUB, TATRA), "Zmeniť banku: Step1Validate " + JSON.stringify(x.map((y) => y.telo)));
      const ul = await ulozenaBanka(s);
      over(ul && ul[0] === TATRA && ul[1] === "SK" && ul[2] === "EUR", "Zmeniť banku: localStorage " + JSON.stringify(ul));
      casti.push("Zmeniť banku: 1× Step1Validate s Tatra, localStorage ako krok 1");

      // d) objednávka: kontrola pred odoslaním pošle 112 s Tatra (zobrazená voľba), Step2Validate 1× so 112 a Tatra v session
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      const z = await objednaj(s);
      x = step1Xhr(s).filter((y) => y.cas <= z[0].cas);
      over(x.length === 1 && x[0].telo === teloKrok1.replace(VUB, TATRA), "kontrola pred odoslaním: Step1Validate " + JSON.stringify(x.map((y) => y.telo)));
      over(z.length === 1 && z[0].platba === id.banka && z[0].banka === TATRA, "objednávka: " + JSON.stringify(z.map((y) => [y.platba, y.banka])));
      overTeloObjednavky(s, z[0]);
      casti.push("objednávka 1× so 112 a " + z[0].banka);
      return { step2: true, info: casti.join(" | ") };
    },
  },
};
