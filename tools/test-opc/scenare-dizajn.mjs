// Scenár vzhľadu „dizajn A – ako konfigurátor“ (Michal 29. 10. 2026, kniha OPC § 6.2–6.9, náčrt dizajn/A-konfigurator):
//   S40 výška stránky (telefón 390 so setom ≤ 2 460 px, PC 1366 ≤ 1 200 px), „Objednať“ na PC na prvej obrazovke, lišta
//       dole na telefóne (na PC skrytá, keď tlačidlo vidno), žiadne vodorovné pretečenie (360 / 390 / 768 / 1366 / 1920),
//       písmo podľa mierky Michala (text ≥ 16 px, poznámka ≥ 14 px, štítok veľkými písmenami ≥ 12 px; computed style),
//       rekapitulácia A1 (Michal 30. 10. 2026: pod názvom najviac 3 najdôležitejšie riadky rozpisu z košíka, zvyšok po
//       „Zobraziť viac“, aj kamión), karty 1–4 s číslom v krúžku
//       (Kontakt, Adresa, Doprava, Platba; doručovacia adresa je karta bez čísla) a fajkou pri vyplnenej karte, polia s popisom nad poľom, adresa v 2 riadkoch
//       (Ulica + Číslo, PSČ + Mesto), platby zadarmo ako dlaždice.
// Set a kamión sú zachytené len pre SK (fixtures), na CZ sa merá vzorkovník s tými istými limitmi.
import { naKrok2, ZAKAZNIK, zvolPlatbu, vyplnUdaje, over, pauza } from "./krok2-pomoc.mjs";
import { buildTruckOrderSummary } from "../../assets/js/truck-konfigurator/order-summary.mjs";
import { klikObjednat } from "./scenare-spravanie.mjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { FIXTURES } from "./zachytene.mjs";
import { KAMION } from "./scenare-kosiky.mjs";

// telefón: +~65 px za fotku a zobáčik pri položke (Michal 29. 10. 2026 schválil náhľad 2a; set 2 288 -> 2 355 px, S42),
// +~98 px za súhlasy B1 (Michal 30. 10. 2026 schválil náhľad 3: dve dlaždice, štítok „Povinné“; set 2 334 -> 2 432 px, S45;
// náhľad 3 bol telefón 390 celý — na PC len výrez panela, preto 1366×657 v S41 / S42 čaká na rozhodnutie, § 10.12),
// +~25–50 px za rozpis pod názvom A1 (Michal 30. 10. 2026 schválil náhľad 6 A1; set bez auta 2 432 -> 2 456 px, s autom
// 2 480 px, set 2v 2 504 px, S42)
const LIMIT = { mobil: 2520, pc: 1200 };
const KARTY = { sk: ["Kontakt", "Adresa", "Doprava", "Platba"], cz: ["Kontakt", "Adresa", "Doprava", "Platba"] };
/** Ďalšie šírky na pretečenie a písmo: k behu 390 aj 360, k behu 1366 aj 768 a 1920. */
const DALSIE = (sirka) => (sirka < 768 ? [360] : sirka >= 992 ? [768, 1920] : []);

// poznámky (≥ 14 px): popisy pod názvom, právne vety, „1 ks“, text chyby, druhý riadok tlačidla, hlášky „čakám…“
const POZNAMKY = [".sublabel", ".lcd-dob-pozn", ".lcd-opc-zaloha-info", ".not-possible-info", ".lcd-opc-pravne", ".lcd-opc-platby-vop", ".lcd-opc-banka__podmienky",
  ".lcd-opc-hlaska--info", ".lcd-opc-cakam", ".cart-item-amount", ".js-validator-msg", ".lcd-opc-chyba-text", ".order-button-suffix",
  ".lcd-opc-lista__suffix", ".additional-information", ".lcd-rozpis", ".lcd-opc-kopia-priplatky", "small",
  // rozpis položky = rekapitulácia z košíka (S42, náhľad 5; od A1 hneď pod názvom): rozpis osobných áut je .lcd-rozpis (14 px),
  // kamióna karty skupín .lcd-truck-cart-summary, kamióna bez súhrnu .info-wrap (15 px ako v košíku) — tá istá poznámka
  // (≥ 14 px), len iným natívnym prvkom cart.js
  ".lcd-truck-cart-summary", ".info-wrap"].join(", ");
// popis v tlačidle-pilulke („Vybrať banku“) ako text tlačidiel e-shopu (CTA Exo 2 14 px, dizajn/audit.md § 3.1): ≥ 14 px
const TLACIDLA = ".lcd-opc-odkaz__akcia";

/** Všetko, čo zákazník na stránke vidí: rozmery, pretečenie, písmo, rekapitulácia, karty, polia (jedno meranie). */
function zmeraj(s) {
  return s.ev(`(function () {
    var vid = function (e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 1 && r.height > 1 && c.visibility !== "hidden" && c.display !== "none"; };
    var rect = function (e) { var r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top + scrollY), r: Math.round(r.right), b: Math.round(r.bottom + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
    var meno = function (e) { return (e.id ? "#" + e.id : e.tagName.toLowerCase()) + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\\s+/).slice(0, 2).join(".") : ""); };
    var oblast = Array.prototype.slice.call(document.querySelectorAll("#checkoutContent, #checkoutSidebar, .lcd-opc-lista"));
    var prvky = [];
    oblast.forEach(function (o) { prvky.push(o); Array.prototype.push.apply(prvky, o.querySelectorAll("*")); });
    var pretecenie = [], male = [];
    prvky.forEach(function (e) {
      if (!vid(e) || e.closest(".sr-only, select, option, [inert]")) return;
      // zatvorený <details> (zbalený súhrn): obsah okrem <summary> zákazník nevidí, kým ho neotvorí
      var det = e.closest("details:not([open])");
      if (det && !e.closest("summary")) return;
      var r = e.getBoundingClientRect();
      if (r.right > innerWidth + 1 || r.left < -1) pretecenie.push(meno(e) + " " + Math.round(r.left) + "–" + Math.round(r.right));
      var text = Array.prototype.some.call(e.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (!text) return;
      var c = getComputedStyle(e), fs = parseFloat(c.fontSize);
      var stitok = c.textTransform === "uppercase", pozn = !!e.closest(${JSON.stringify(POZNAMKY)}) || !!e.closest(${JSON.stringify(TLACIDLA)});
      var limit = stitok ? 12 : pozn ? 14 : 16;
      if (fs < limit - 0.01) male.push(meno(e) + " " + fs + "px < " + limit + " „" + e.textContent.replace(/\\s+/g, " ").trim().slice(0, 28) + "“");
    });
    // rekapitulácia A1: názov a cena vedľa seba; v stĺpci názvu (natívne miesto) nič rozpísané, rozpis z košíka pod názvom
    // len najdôležitejšie riadky (zvyšok po „Zobraziť viac“)
    var RIADKY = "ul.lcd-rozpis > li, .lcd-truck-cart-summary dt, .info-wrap li";
    var polozky = Array.prototype.map.call(document.querySelectorAll("#summary-box .cart-items .cart-item"), function (p) {
      var n = p.querySelector(".cart-item-name"), c = p.querySelector(".cart-item-price"), z = p.querySelector(":scope > .lcd-opc-zob");
      var rozpis = n ? Array.prototype.filter.call(n.querySelectorAll(".main-link-variant, .main-link-surcharges, .lcd-rozpis, .lcd-truck-cart-summary, ul, dl"), vid).length : 0;
      var rn = n ? n.getBoundingClientRect() : null, rc = c ? c.getBoundingClientRect() : null;
      return { h: Math.round(p.getBoundingClientRect().height), rozpis: rozpis, vedla: !!(rn && rc && rc.top < rn.bottom && Math.abs(rc.top - rn.top) < 24 && rc.left >= rn.right - 2),
        riadkyVid: Array.prototype.filter.call(p.querySelectorAll(RIADKY), vid).length, riadkyVsetky: p.querySelectorAll(RIADKY).length,
        zob: z && vid(z) ? z.textContent.replace(/\\s+/g, " ").trim() : null,
        text: n ? n.textContent.replace(/\\s+/g, " ").trim().slice(0, 40) : "" };
    });
    var celkom = document.querySelector('#summary-box [data-testid="recapFullPrice"]');
    var karty = Array.prototype.map.call(document.querySelectorAll(".lcd-opc-karta:not(.lcd-opc-karta--bez-cisla)"), function (k) {
      var h = k.querySelector("h2"), pred = h ? getComputedStyle(h, "::before") : null;
      return { nadpis: h ? h.textContent.replace(/\\s+/g, " ").trim() : "", cislo: h ? h.getAttribute("data-lcd-opc-cislo") : null, hotovo: k.classList.contains("lcd-opc-karta--hotovo"),
        kruh: pred ? Math.round(parseFloat(pred.width)) + "x" + Math.round(parseFloat(pred.height)) + " " + pred.borderTopLeftRadius : null, t: rect(k).t, vid: vid(k) };
    });
    var pole = function (id) {
      var i = document.getElementById(id), l = i && document.querySelector('label[for="' + id + '"]');
      if (!i || !vid(i)) return null;
      // telefón: pole je predvoľba + číslo (.phone-combined-input), popis je nad celým poľom
      var obal = id === "phone" ? i.closest(".phone-combined-input") || i : i;
      var ci = getComputedStyle(i), ri = rect(i), ro = rect(obal), rl = l && vid(l) ? rect(l) : null;
      return { r: ri, nad: !!rl && rl.b <= ro.t + 2 && Math.abs(rl.l - ro.l) < 20, h: ri.h, ram: ci.borderTopWidth + " " + ci.borderTopColor, radius: ci.borderTopLeftRadius };
    };
    var polia = {}; ["billFullName", "email", "phone", "billStreet", "billHouseNumber", "billCity", "billZip"].forEach(function (id) { polia[id] = pole(id); });
    var tel = document.querySelector(".phone-combined-input");
    if (tel && polia.phone) { polia.phone.obal = rect(tel); }
    var dl = Array.prototype.filter.call(document.querySelectorAll("#lcd-opc .lcd-opc-dlazdica"), vid).map(rect);
    var b = document.getElementById("submit-order"), rb = b.getBoundingClientRect(), cb = getComputedStyle(b);
    var l = document.querySelector(".lcd-opc-lista"), zb = document.getElementById("lcd-opc-zbalene");
    var sb = document.querySelector("#checkoutSidebar > .cart-content"), csb = sb ? getComputedStyle(sb) : null;
    var platba = document.querySelector("#lcd-opc .co-payment-method");
    // farba pozadia na okrajoch obrazovky (tablet 768: tmavé pruhy .overall-wrapper vedľa piesku, revízia)
    var okraj = function (x) {
      var e = document.elementFromPoint(x, Math.round(innerHeight / 2));
      while (e) { var c = getComputedStyle(e).backgroundColor; if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c; e = e.parentElement; }
      return "";
    };
    var cw = document.documentElement.clientWidth;
    return {
      okraje: [okraj(1), okraj(cw - 2)],
      nadpisSuhrnu: (function () { var h = document.querySelector("#summary-box > h2"); return h ? Math.round(h.getBoundingClientRect().height) : 0; })(),
      vyska: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight,
      pretecenie: pretecenie.slice(0, 8), male: male.slice(0, 10), polozky: polozky,
      celkomPismo: celkom ? parseFloat(getComputedStyle(celkom).fontSize) : 0, karty: karty, polia: polia, dlazdice: dl,
      objednat: { top: Math.round(rb.top), bottom: Math.round(rb.bottom), h: Math.round(rb.height), radius: cb.borderTopLeftRadius, gradient: /gradient/.test(cb.backgroundImage) },
      lista: { on: document.documentElement.classList.contains("lcd-lista-on"), vid: vid(l), text: l ? l.textContent.replace(/\\s+/g, " ").trim() : "", t: l ? Math.round(l.getBoundingClientRect().top) : null },
      zbalene: { vid: vid(zb), text: zb ? zb.querySelector("summary").textContent.replace(/\\s+/g, " ").trim() : "" },
      pozadie: getComputedStyle(document.body).backgroundColor,
      suhrn: sb ? { r: rect(sb), hore: csb.borderTopWidth + " " + csb.borderTopColor } : null,
      platba: platba ? rect(platba) : null,
    };
  })()`);
}

/** Kontroly spoločné pre každú šírku: pretečenie a písmo; vráti meranie. */
async function zakladne(s, popis) {
  await s.ev(`window.scrollTo({ top: 0, behavior: "instant" }), 1`);
  await pauza(500);
  const m = await zmeraj(s);
  over(m.sw <= m.iw + 1, popis + ": vodorovný posun stránky, scrollWidth " + m.sw + " > " + m.iw);
  over(!m.pretecenie.length, popis + ": prvky mimo šírky obrazovky: " + m.pretecenie.join("; "));
  over(!m.male.length, popis + ": písmo pod mierkou (text 16, poznámka 14, štítok 12): " + m.male.join("; "));
  const tmave = m.okraje.filter((c) => { const v = (c.match(/\d+/g) || []).slice(0, 3).map(Number); return v.length === 3 && v[0] + v[1] + v[2] < 300; });
  over(!tmave.length, popis + ": tmavý pruh na okraji obrazovky (čakal som piesok): " + JSON.stringify(m.okraje));
  over(m.nadpisSuhrnu > 0 && m.nadpisSuhrnu <= 30, popis + ": nadpis súhrnu je na 2 riadkoch vedľa „Upraviť košík“ (" + m.nadpisSuhrnu + " px)");
  return m;
}

/** Výška položky v rekapitulácii: názov (najviac 2 riadky) | cena, vľavo fotka 60 px (Michal 29. 10. 2026, náhľad 2a; S42),
 *  pod názvom najviac 3 riadky rozpisu a pilulka „Zobraziť viac“ (A1, Michal 30. 10. 2026, náhľad 6). Predtým 1 riadok
 *  ≤ 72 px, so zobáčikom ≤ 120 px; kamión má riadky v kartách skupín (vozidlo, koberčeky) — vyšší limit. */
const POLOZKA_MAX = { inak: 210, kamion: 280 }; // zmerané A1: set 136–191, kamión bez súhrnu 208–236 px
/** Rekapitulácia A1: názov | cena vedľa seba, v stĺpci názvu nič rozpísané; pod názvom najviac 3 riadky rozpisu z košíka
 *  (koberce Auto + 2 vrstvy, kamión Vozidlo + materiál, inak 2) a keď sa niečo skrýva, pilulka „Zobraziť viac“; „Celkom k
 *  úhrade“ výrazne. */
function overRekapitulaciu(m, popis, max = POLOZKA_MAX.inak) {
  over(m.polozky.length >= 1, popis + ": v súhrne nie sú položky");
  m.polozky.forEach((p, i) => {
    const kde = popis + ": položka " + (i + 1) + " „" + p.text + "“";
    over(!p.rozpis, kde + " má v stĺpci názvu rozpísanú konfiguráciu (" + p.rozpis + " prvkov)");
    over(p.riadkyVid <= 3, kde + ": pod názvom je hneď " + p.riadkyVid + " riadkov rozpisu (A1: najviac 3, zvyšok po „Zobraziť viac“)");
    over(p.riadkyVsetky > p.riadkyVid ? /^Zobrazi(ť viac|t více)$/.test(p.zob || "") : p.zob === null,
      kde + ": pilulka „Zobraziť viac“ nesedí so skrytými riadkami (" + p.riadkyVid + " z " + p.riadkyVsetky + ", pilulka " + JSON.stringify(p.zob) + ")");
    over(p.vedla && p.h <= max, kde + " nemá názov | cenu vedľa seba alebo je vyššia ako " + max + " px (A1 zbalené), výška " + p.h + " px: " + JSON.stringify(p));
  });
  over(m.celkomPismo >= 24, popis + ": „Celkom k úhrade“ nie je výrazné (" + m.celkomPismo + " px)");
}

export const SCENARE = {
  S40: {
    popis: "Dizajn A: výška (telefón set ≤ 2 460, PC ≤ 1 200), Objednať na PC na 1. obrazovke, lišta, bez pretečenia 360–1920, písmo ≥ 16/14/12, rekapitulácia 1 riadok, karty 1–4 s fajkou, polia a dlaždice",
    async fn(J) {
      const pc = J.sirka >= 992;
      const kosik = J.web === "sk" ? "set" : undefined;
      const s = await J.novaStranka({ kosik });
      await naKrok2(s, { query: kosik ? "&lcddoplnok=0" : "" });
      const m = await zakladne(s, J.sirka + " " + (kosik || "vzorkovník"));
      const casti = [];
      // výška a „Objednať“
      const limit = pc ? LIMIT.pc : LIMIT.mobil;
      over(m.vyska <= limit, "výška stránky " + m.vyska + " px > " + limit + " px (" + (kosik || "vzorkovník") + ", " + J.sirka + ")");
      casti.push("výška " + m.vyska + " ≤ " + limit);
      over(m.objednat.radius === "12px" && m.objednat.gradient && m.objednat.h >= 54, "tlačidlo Objednať nie je v štýle e-shopu (rádius 12, zelený prechod, ≥ 54 px): " + JSON.stringify(m.objednat));
      if (pc) {
        // A1 (Michal 30. 10. 2026, náhľad 6: „sety posunie o 80–120 px“): „Objednať“ celé na prvej obrazovke nad prahom karty
        // (horný okraj < okno − 72 px, IntersectionObserver v opc/krok2.js) a lišta zhasnutá, alebo lišta „Celkom | Objednať“
        // dole a natívne tlačidlo celé pod ňou (nikdy dve tlačidlá; na PC svieti len vtedy, S41). Revízia A1 (N1): set na
        // 1366×768 má „Objednať“ 706–766 — celé v okne, ale v pásme karty, ktorá ho celé zakryje
        const nad = m.objednat.top < m.ih - 72;
        over(nad ? !m.lista.on && m.objednat.bottom <= m.ih : m.lista.on && m.lista.vid && /Objedna/.test(m.lista.text) && m.objednat.top >= m.lista.t,
          "PC: „Objednať“ " + (nad ? "je na prvej obrazovke nad prahom karty, a predsa svieti lišta" : "nie je nad prahom karty a lišta s „Objednať“ chýba alebo ho celé nezakryje") +
          " (y " + m.objednat.top + "–" + m.objednat.bottom + ", okno " + m.ih + "): " + JSON.stringify(m.lista));
        casti.push("Objednať y " + m.objednat.top + "–" + m.objednat.bottom + (nad ? "" : " (lišta)"));
      } else {
        over(m.lista.on && m.lista.vid && /Objedna/.test(m.lista.text), "telefón: lišta „Celkom | Objednať“ navrchu nie je vidno: " + JSON.stringify(m.lista));
        over(m.zbalene.vid && /\d/.test(m.zbalene.text), "telefón: zbalená lišta „Vaša objednávka · položky · suma“ navrchu chýba: " + JSON.stringify(m.zbalene));
        casti.push("lišta „" + m.lista.text.slice(0, 40) + "“");
      }
      // vzhľad: piesočné pozadie, súhrn so zlatým pruhom, karty s číslom, polia s popisom nad poľom
      over(m.pozadie === "rgb(247, 245, 239)", "pozadie stránky " + m.pozadie + " (čakal som piesočné #f7f5ef)");
      over(m.suhrn && /^3px rgb\(196, 155, 49\)$/.test(m.suhrn.hore), "súhrn bez zlatého horného pruhu 3 px: " + JSON.stringify(m.suhrn));
      const nadpisy = m.karty.map((k) => k.nadpis);
      over(JSON.stringify(nadpisy) === JSON.stringify(KARTY[J.web]) && m.karty.every((k, i) => k.cislo === String(i + 1) && k.vid),
        "karty nie sú 1 Kontakt, 2 Adresa, 3 Doprava, 4 Platba: " + JSON.stringify(m.karty));
      over(m.karty.every((k, i) => !i || k.t > m.karty[i - 1].t), "karty nie sú pod sebou v poradí: " + JSON.stringify(m.karty.map((k) => k.t)));
      over(m.karty.every((k) => k.kruh === "26x26 50%"), "číslo karty nie je krúžok 26 px: " + JSON.stringify(m.karty.map((k) => k.kruh)));
      over(JSON.stringify(m.karty.map((k) => k.hotovo)) === "[false,false,true,true]", "fajka kariet na prázdnej stránke (čakal som len Doprava a Platba): " + JSON.stringify(m.karty.map((k) => k.hotovo)));
      if (!pc) over(m.suhrn && m.platba && m.suhrn.r.t > m.platba.b, "telefón: rekapitulácia nie je pod platbou");
      for (const [id, p] of Object.entries(m.polia)) {
        over(p && p.nad, "pole " + id + ": popis nie je nad poľom: " + JSON.stringify(p));
        if (id !== "phone") over(p.h === 46 && p.ram === "2px rgb(211, 196, 154)" && p.radius === "12px", "pole " + id + " nie je 46 px s rámom 2 px #d3c49a a rádiusom 12: " + JSON.stringify(p));
      }
      const P = m.polia;
      over(P.billStreet.r.t === P.billHouseNumber.r.t && P.billStreet.r.l < P.billHouseNumber.r.l, "Ulica a Číslo domu nie sú vedľa seba: " + JSON.stringify([P.billStreet.r, P.billHouseNumber.r]));
      over(P.billZip.r.t === P.billCity.r.t && P.billZip.r.l < P.billCity.r.l, "PSČ a Mesto nie sú vedľa seba (PSČ vľavo): " + JSON.stringify([P.billZip.r, P.billCity.r]));
      if (pc) {
        over(P.billFullName.r.t === P.email.r.t && P.email.r.t === P.phone.obal.t, "PC: Meno, E-mail a Telefón nie sú v jednom riadku");
        over(P.billStreet.r.t === P.billZip.r.t, "PC: adresa nie je v jednom riadku (Ulica, Číslo, PSČ, Mesto)");
      }
      over(m.dlazdice.length >= 2 && m.dlazdice[0].t === m.dlazdice[1].t, "platby zadarmo nie sú dlaždice vedľa seba: " + JSON.stringify(m.dlazdice));
      overRekapitulaciu(m, J.sirka + " " + (kosik || "vzorkovník"));
      casti.push(m.karty.length + " karty, " + m.dlazdice.length + " dlaždice, rekapitulácia " + m.polozky.map((p) => p.h + " px").join("/"));
      // fajka pri vyplnenej karte (len vzhľad, nie kontrola)
      const z = ZAKAZNIK[J.web];
      await s.pis("#billFullName", z.meno);
      await s.pis("#email", z.email);
      await s.pis("#phone", z.telefon);
      await pauza(400);
      const k1 = await s.ev(`Array.prototype.map.call(document.querySelectorAll(".lcd-opc-karta:not(.lcd-opc-karta--bez-cisla)"), function (k) { return k.classList.contains("lcd-opc-karta--hotovo"); })`);
      over(JSON.stringify(k1) === "[true,false,true,true]", "po vyplnení kontaktu nemá karta Kontakt fajku: " + JSON.stringify(k1));
      await s.pis("#billStreet", z.ulica);
      await s.pis("#billHouseNumber", z.cislo);
      await s.pis("#billCity", z.mesto);
      await s.pis("#billZip", z.psc);
      await pauza(400);
      const k2 = await s.ev(`Array.prototype.map.call(document.querySelectorAll(".lcd-opc-karta:not(.lcd-opc-karta--bez-cisla)"), function (k) { return k.classList.contains("lcd-opc-karta--hotovo"); })`);
      over(JSON.stringify(k2) === "[true,true,true,true]", "po vyplnení adresy nemá karta Adresa fajku: " + JSON.stringify(k2));
      await s.pis("#email", "");
      await pauza(300);
      const k3 = await s.ev(`document.querySelector(".lcd-opc-karta:not(.lcd-opc-karta--bez-cisla)").classList.contains("lcd-opc-karta--hotovo")`);
      over(!k3, "po vymazaní e-mailu ostala fajka pri karte Kontakt");
      casti.push("fajka 1 → 2 → zmizne");
      await s.zavri();
      // ďalšie šírky: pretečenie a písmo
      for (const w of DALSIE(J.sirka)) {
        const t = await J.novaStranka({ kosik, sirka: w });
        await naKrok2(t, { query: kosik ? "&lcddoplnok=0" : "" });
        const mm = await zakladne(t, w + " " + (kosik || "vzorkovník"));
        overRekapitulaciu(mm, String(w));
        casti.push(w + ": " + mm.vyska + " px");
        await t.zavri();
      }
      // kamión (17 príplatkov): rekapitulácia A1 — hneď len vozidlo a materiál
      if (J.web === "sk") {
        const t = await J.novaStranka({ kosik: "kamion" });
        await naKrok2(t, { query: "&lcddoplnok=0" });
        const mk = await zakladne(t, J.sirka + " kamión");
        overRekapitulaciu(mk, J.sirka + " kamión", POLOZKA_MAX.kamion);
        casti.push("kamión " + mk.vyska + " px, položka " + mk.polozky[0].h + " px");
        await t.zavri();
      }
      return { info: casti.join("; ") };
    },
  },
};

// ------------------------------------------------------------------ S41 nálezy revízie dizajnu A (29. 10. 2026)
/** Notebook s reálnou výškou okna (1366×768 obrazovka − Chrome − lišta Windows ≈ 1366×625/657; 1280×720 ≈ 1280×577);
 *  1366×768 = okno bežného notebooku s väčšou obrazovkou (revízia A1, N1). */
const NOTEBOOKY = [[1366, 768], [1366, 657], [1366, 625], [1280, 577], [1280, 520]];
/** Revízia A1 (N1): košíky s vyšším súhrnom ako set — dve položky, kamión (a set 2v, keď sú fixtures) — na bežných notebookoch. */
const NOTEBOOKY_KOSIKY = { kosiky: ["dve", "kamion"], okna: [[1366, 768], [1366, 657]] };
/** Bublina Luxie v rozmere widgetu (widget.js: do 560 px 170 × 80, inak 200 × 80) — podvrh má len komentár bez widgetu. */
const BUBLINA = (mobil) => `(function () {
  var f = document.createElement("iframe"); f.title = "Luxia chat"; f.src = "about:blank";
  f.style.cssText = "position:fixed;right:${mobil ? 2 : 16}px;bottom:${mobil ? 50 : 18}px;width:${mobil ? 170 : 200}px;height:80px;border:0;z-index:2147483000;background:#c49b31";
  document.body.appendChild(f); return 1;
})()`;
/** PC: natívne „Objednať“ celé v okne, alebo lišta, ktorá ho celé zakryje (nikdy dve tlačidlá), zarovnaná s kartou súhrnu. */
const MER_PC = `(function () {
  var r = function (e) { var x = e.getBoundingClientRect(); return { l: Math.round(x.left), t: Math.round(x.top), r: Math.round(x.right), b: Math.round(x.bottom) }; };
  var b = document.getElementById("submit-order"), l = document.querySelector(".lcd-opc-lista"), k = document.querySelector("#checkoutSidebar > .cart-content");
  var on = document.documentElement.classList.contains("lcd-lista-on") && !!l && getComputedStyle(l).display !== "none";
  var rb = b.getBoundingClientRect(), o = { ih: innerHeight, objednat: r(b), on: on, karta: r(k), cele: rb.top >= 0 && rb.bottom <= innerHeight, trci: 0 };
  var sl = document.querySelector("#checkoutSidebar .consents input[type=checkbox][required] + label"); // povinný súhlas (dlaždica B1, S45)
  if (sl) o.suhlas = r(sl);
  var pv = document.querySelector("#checkoutSidebar .lcd-opc-pravne"); // veta o tovare na mieru (VOP 6.13) nad „Objednať“
  if (pv) o.pravne = r(pv);
  if (on) {
    var rl = l.getBoundingClientRect(), lb = l.querySelector(".lcd-opc-lista__btn");
    o.lista = r(l);
    o.trci = Math.round(Math.max(0, Math.min(rb.bottom, rl.top) - Math.max(rb.top, 0)) + Math.max(0, Math.min(rb.bottom, innerHeight) - Math.max(rb.top, rl.bottom)));
    var f = document.querySelector('iframe[title="Luxia chat"]');
    if (f && lb) {
      var x = f.getBoundingClientRect(), y = lb.getBoundingClientRect();
      o.bublinaNaListe = getComputedStyle(f).visibility !== "hidden" && x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top;
    }
  }
  return o;
})()`;
/** Telefón: bublina Luxie (keď je vidno) neleží na poli, odkaze, zaškrtávacom poli ani na voľbe dopravy / platby. */
const BUBLINA_NA_POLI = `(function () {
  var f = document.querySelector('iframe[title="Luxia chat"]'); if (!f) return "bez bubliny";
  var x = f.getBoundingClientRect();
  if (getComputedStyle(f).visibility === "hidden") return "";
  var zle = [];
  document.querySelectorAll("#order-form .form-control, #order-form .phone-combined-input, #order-form .form-group a, #order-form input[type=checkbox] + label, #lcd-opc .radio-wrapper").forEach(function (e) {
    var y = e.getBoundingClientRect();
    if (y.width > 1 && y.height > 1 && x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top) zle.push((e.id || e.getAttribute("for") || e.className || e.tagName).toString().slice(0, 30));
  });
  return zle.join(", ");
})()`;
/**
 * Riadok „Rýchla platba cez banku“ (telefón; od 30. 10. 2026 rádio s výberom banky v OPC): výška karty, nadpis na 1 riadok,
 * popis najviac na 2; pri zvolenej platbe riadok banky s „Zmeniť banku“ (16 px) celý v karte.
 */
const RYCHLA = `(function () {
  var w = document.querySelector('#lcd-opc [data-submethod="pis"]'); if (!w) return null;
  var n = w.querySelector(".shipping-billing-name"), b = w.querySelector(".lcd-opc-banka"), z = w.querySelector(".lcd-opc-banka__zmenit");
  var p = Array.prototype.filter.call(w.querySelectorAll(".payment-info .sublabel"), function (e) { return e.getBoundingClientRect().height > 0; })[0];
  var rw = w.getBoundingClientRect(), rn = n.getBoundingClientRect(), rb = b ? b.getBoundingClientRect() : null, rz = z ? z.getBoundingClientRect() : null;
  return { h: Math.round(rw.height), nadpis: Math.round(rn.height), popis: p ? Math.round(p.getBoundingClientRect().height) : 0, aktivny: w.classList.contains("active"),
    radio: !!w.querySelector('input[name="billingId"]'), banka: rb && rb.height > 0 ? Math.round(rb.height) : 0,
    pismo: z ? parseFloat(getComputedStyle(z).fontSize) : null, vnutri: !rz || rz.width === 0 || (rz.left >= rw.left - 1 && rz.right <= rw.right + 1 && rz.bottom <= rw.bottom + 1) };
})()`;

SCENARE.S41 = {
  popis: "Dizajn A po revízii: notebook 1366×768 / 1366×657 / 1366×625 / 1280×577 / 1280×520 (Objednať celé v okne, inak lišta zakryje tlačidlo celé, zarovnaná s kartou, bublina Luxie mimo lišty; na 1366×768 a 1366×657 povinný súhlas celý nad kartou; dve položky a kamión na 1366×768 / 1366×657 s číslami v info); telefón — bublina mimo polí, chyba poľa nad klávesnicou, rýchla platba kompaktná",
  async fn(J) {
    const kosik = J.web === "sk" ? "set" : undefined;
    const q = { query: kosik ? "&lcddoplnok=0" : "" };
    const casti = [];
    if (J.sirka >= 992) {
      let zapnuta = 0;
      for (const [w, h] of NOTEBOOKY) {
        // set s autom z konfigurátora (riadok „Auto“ v rozpise — tak ho má zákazník; revízia A1, N1: bez auta bol súhlas
        // o riadok vyššie a zakrytie test nechytil)
        const s = await J.novaStranka({ kosik, sirka: w, vyska: h, skript: kosik ? s42Seed(kosik) : undefined });
        await naKrok2(s, q);
        await s.ev(BUBLINA(false));
        await s.ev(`window.scrollTo({ top: 0, behavior: "instant" }), 1`);
        await pauza(1800); // bublina sa rozhoduje raz za sekundu (cart.js lcdBublinaMimoTlacidla)
        const m = await s.ev(MER_PC);
        const popis = w + "×" + h + ": ";
        // 1366×657 = bežný notebook. Do súhlasov B1 (náhľad 3, +~98 px v paneli) tu bolo „Objednať“ celé na prvej
        // obrazovke (kniha § 10.9–10.11); teraz ho tu, ako na 1366×625 a 1280×577, rieši karta nad súhrnom (kontroly nižšie)
        // a povinný súhlas musí byť celý na prvej obrazovke nad kartou. Michal schválil vzhľad dlaždíc (výrez panela bez
        // karty), NIE kartu namiesto „Objednať“ na 1366×657 — ČAKÁ NA JEHO ROZHODNUTIE (kniha § 10.12, revízia 30. 10. 2026:
        // K1-1, R1-1, UX-1, N1); info behu to vypíše. Od A1 (rozpis pod názvom, set ~+70 px) svieti karta so setom aj na
        // 1366×768 („Objednať“ pod prvou obrazovkou, kniha § 10.14). Na 1366×657 aj 1366×768 je povinný súhlas CELÝ nad
        // kartou (revízia A1, N1: menšie medzery bočného panela na PC; prísne ako pred A1)
        if (w === 1366 && h >= 657) over(m.cele && !m.on || m.on && m.suhlas && m.suhlas.t >= 0 && m.suhlas.b <= m.lista.t,
          popis + "„Objednať“ nie je celé na prvej obrazovke a povinný súhlas nie je celý nad kartou (bežný notebook): " + JSON.stringify(m));
        over(m.cele || m.on, popis + "„Objednať“ nie je celé v okne a lišta sa nezapla: " + JSON.stringify(m));
        if (m.on) {
          zapnuta++;
          over(m.trci === 0, popis + "spod lišty / nad ňou vidno natívne „Objednať“ (" + m.trci + " px, dve tlačidlá): " + JSON.stringify(m));
          over(Math.abs(m.lista.l - m.karta.l) <= 1 && Math.abs(m.lista.r - m.karta.r) <= 1, popis + "lišta nie je zarovnaná s kartou súhrnu: " + JSON.stringify([m.lista, m.karta]));
          over(!m.bublinaNaListe, popis + "bublina Luxie leží na tlačidle v lište: " + JSON.stringify(m));
        }
        casti.push(w + "×" + h + " " + (m.on ? "lišta" : "Objednať " + m.objednat.t + "–" + m.objednat.b));
        if (w === 1366 && h >= 657 && m.on) casti.push("POZOR " + w + "×" + h + ": karta namiesto „Objednať“ (" + m.objednat.t + "–" + m.objednat.b + "), povinný súhlas " +
          m.suhlas.t + "–" + m.suhlas.b + (m.suhlas.b <= m.lista.t ? " nad kartou" : " (spodok " + (m.suhlas.b - m.lista.t) + " px pod kartou)") + ", veta o tovare na mieru " +
          (m.pravne ? (m.pravne.b <= m.lista.t ? "nad kartou" : "pod kartou " + m.pravne.t + "–" + m.pravne.b) : "–") + " — čaká na rozhodnutie Michala (§ 10.12)");
        await s.zavri();
      }
      over(zapnuta > 0, "na najnižšom okne sa lišta nezapla (kontrola zakrytia by neprebehla)");
      // revízia A1 (N1): dve položky a kamión majú vyšší súhrn ako set. „Objednať“ celé, inak karta, ktorá ho celé zakryje;
      // povinný súhlas nad kartou tu menšie medzery panela nedosiahnu (dve položky ani pred A1) — info behu vypíše POZOR
      // so skutočnými číslami, rozhoduje Michal spolu s § 10.12 (kniha § 10.14)
      if (J.web === "sk") {
        // dvojvrstvový set len s fixtures sk-set2v (LCD_OPC_FIXTURES, ako v S42)
        const kosiky2 = NOTEBOOKY_KOSIKY.kosiky.concat(existsSync(join(FIXTURES, "sk-set2v")) ? ["set2v"] : []);
        for (const kosik2 of kosiky2) for (const [w, h] of NOTEBOOKY_KOSIKY.okna) {
          const s = await J.novaStranka({ kosik: kosik2, sirka: w, vyska: h, skript: s42Seed(kosik2) });
          await naKrok2(s, { query: "&lcddoplnok=0" });
          await s.ev(`window.scrollTo({ top: 0, behavior: "instant" }), 1`);
          await pauza(500);
          const m = await s.ev(MER_PC);
          const popis = kosik2 + " " + w + "×" + h + ": ";
          over(m.cele && !m.on || m.on && m.trci === 0, popis + "„Objednať“ nie je celé v okne a karta ho celé nezakryje: " + JSON.stringify(m));
          const pod = m.on && m.suhlas ? Math.max(0, m.suhlas.b - m.lista.t) : 0, pravne = m.on && m.pravne ? Math.max(0, Math.min(m.pravne.b, h) - Math.max(m.pravne.t, m.lista.t)) : 0;
          casti.push(popis + (m.on ? "karta" + (pod ? " (POZOR: povinný súhlas " + pod + " px pod kartou — § 10.12)" : ", súhlas nad ňou") +
            (pravne ? " (POZOR: veta o tovare na mieru " + pravne + " px pod kartou)" : "") : "Objednať " + m.objednat.t + "–" + m.objednat.b));
          await s.zavri();
        }
      }
      return { info: casti.join("; ") };
    }
    // telefón: rýchla platba (len SK má banku) na šírke behu a na 360 — nezvolená (rádio) a zvolená so zvolenou bankou
    for (const w of J.web === "sk" ? [J.sirka, 360] : []) {
      for (const zvolena of [false, true]) {
        const t = await J.novaStranka({ kosik, sirka: w, scenar: zvolena ? { platba: "112" } : undefined });
        await naKrok2(t, q);
        const r = await t.ev(RYCHLA);
        // 360: názov vedľa „ZADARMO“ sa zalomí na 2 riadky (pod 380 px sa nezmestí), od 390 na 1 riadok
        const nadpisMax = w < 380 ? 44 : 26;
        // zvolená: + riadok banky a podmienky Shoptet Pay (na 360 tri riadky textu, „Zmeniť banku“ pod bankou)
        const vyskaMax = w < 380 ? 300 : 260;
        if (!zvolena) over(r && r.radio && !r.aktivny && r.h <= 116 && r.nadpis <= nadpisMax && r.popis <= 40 && r.banka === 0, w + ": nezvolená „Rýchla platba cez banku“ (rádio, výška ≤ 116, nadpis " + (w < 380 ? "≤ 2 riadky" : "1 riadok") + ", popis ≤ 2 riadky, bez riadku banky): " + JSON.stringify(r));
        else over(r && r.radio && r.aktivny && r.banka > 0 && r.h <= vyskaMax && r.nadpis <= nadpisMax && r.pismo >= 16 && r.vnutri, w + ": zvolená „Rýchla platba cez banku“ (riadok banky, „Zmeniť banku“ 16 px v karte, výška ≤ " + vyskaMax + "): " + JSON.stringify(r));
        casti.push(w + " rýchla platba " + (zvolena ? "zvolená " : "") + r.h + " px");
        await t.zavri();
      }
    }
    // telefón: bublina Luxie mimo polí na prvej obrazovke, na konci stránky ju vidno
    const s = await J.novaStranka({ kosik });
    await naKrok2(s, q);
    await s.ev(BUBLINA(true));
    await s.ev(`window.scrollTo({ top: 0, behavior: "instant" }), 1`);
    await pauza(1800);
    const naPoli = await s.ev(BUBLINA_NA_POLI);
    over(!naPoli, "bublina Luxie leží na poliach formulára (ťuk otvorí chat): " + naPoli);
    await s.ev(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }), 1`);
    await pauza(1800);
    const naKonci = await s.ev(`getComputedStyle(document.querySelector('iframe[title="Luxia chat"]')).visibility`);
    over(naKonci !== "hidden", "bublina Luxie sa neukáže ani na konci stránky (je skrytá natrvalo)");
    casti.push("bublina mimo polí");
    // telefón: chyba poľa (Mesto) po kliku na Objednať nad klávesnicou (horných 55 % okna), nie v dolnej polovici
    const z = ZAKAZNIK[J.web];
    await s.pis("#billFullName", z.meno);
    await s.pis("#email", z.email);
    await s.pis("#phone", z.telefon);
    await s.pis("#billStreet", z.ulica);
    await s.pis("#billHouseNumber", z.cislo);
    await s.pis("#billZip", z.psc);
    await s.ev(`window.scrollTo({ top: 0, behavior: "instant" }), 1`);
    await pauza(500);
    await klikObjednat(s);
    await pauza(1500);
    const ch = await s.ev(`(function () {
      var e = document.getElementById("billCity"), g = e.closest(".form-group"), r = g.getBoundingClientRect();
      return { fokus: document.activeElement === e, chyba: g.classList.contains("lcd-opc-chyba-pole"), t: Math.round(r.top), b: Math.round(r.bottom), ih: innerHeight };
    })()`);
    over(ch.fokus && ch.chyba, "po kliku nie je fokus a chyba na poli Mesto: " + JSON.stringify(ch));
    over(ch.t >= 0 && ch.b <= Math.round(ch.ih * 0.55) + 2, "pole Mesto s textom chyby nie je nad klávesnicou (horných 55 % okna): " + JSON.stringify(ch));
    casti.push("chyba Mesto y " + ch.t + "–" + ch.b + " z " + ch.ih);
    await s.zavri();
    return { info: casti.join("; ") };
  },
};

// ------------------------------------------------------------------ S42 rozpis A1, fotka, košík v štýle pokladne (Michal 29. 10. 2026)
// A1 bez čísel (Michal 30. 10. 2026, náhľad 6): rozpis z košíka je pod názvom HNEĎ — najdôležitejšie riadky (koberce Auto,
// Farba 1. a 2. vrstvy; kamión Vozidlo a prvé „Typ a farba materiálu“; inak prvé 2), zvyšok po zlatej pilulke „Zobraziť
// viac“ (po rozbalení „Zobraziť menej“), bez počtu. Keď sa nič neskrýva, pilulka nie je. To isté v zbalenom súhrne navrchu.
// Schválené podľa náhľadov 2a/2b/4 (súhrn) a 1/5 (košík): pri každej položke s rozpisom zlatá pilulka „Zobraziť detail“,
// predvolene zbalené; malá fotka (60 px) vľavo od názvu podľa riadku košíka; košík s kódom OPC v štýle kroku 2, bez kódu
// bez zmeny. Náhľad 5 (Michal 30. 10. 2026): rozbalený detail = PRESNE rekapitulácia z košíka — natívny rozpis cart.js
// (ul.lcd-rozpis so zlatými odrážkami, pri kamióne karty skupín .lcd-truck-cart-summary) v rovnakom vzhľade ako v košíku,
// pod stĺpcom názvu; bez obrázkov, guličiek, riadkov Počet / Cena a „Niečo nesedí“. Položka bez rozpisu je bez zobáčika.
const S42_AUTO = { Brand: "Skoda", Model: "Octavia", Year: "2021", carType: "Combi", model: "Skoda Octavia 2021 Combi" };
// kamión zhodný s príplatkami zachytenej položky (scenare-kosiky.mjs KAMION; revízia doladenia 1)
const S42_KAMION = KAMION;
const S42_TEXTY = {
  sk: { zobrazit: "Zobraziť viac", skryt: "Zobraziť menej", kroky: ["Nákupný košík", "Objednávka"], dobierka: "3" },
  cz: { zobrazit: "Zobrazit více", skryt: "Zobrazit méně", kroky: ["Nákupní košík", "Objednávka"], dobierka: "87" },
};
/** Auto (pri kamióne súhrn kamióna) v karte ešte pred načítaním košíka — ako ho ukladá konfigurátor (raz na kartu). */
function s42Seed(kosik) {
  const d = kosik === "kamion"
    ? { truckOrderSummary: buildTruckOrderSummary(S42_KAMION, "sk"), truckVehicle: "DAF (TIR) XF 2022-2025" }
    : Object.assign({}, S42_AUTO);
  return "(function () { try { if (sessionStorage.getItem(\"__s42\")) return; sessionStorage.setItem(\"__s42\", \"1\"); var d = " + JSON.stringify(d) +
    "; Object.keys(d).forEach(function (k) { sessionStorage.setItem(k, d[k]); }); } catch (e) {} })();";
}
/** Spoločné funkcie v stránke: riadky rozpisu cart.js (osobné autá, kamión, kamión bez súhrnu) a vypočítaný vzhľad rozpisu. */
const S42_ROZPIS_JS = `
  var RIADKY = "ul.lcd-rozpis > li, .lcd-truck-cart-summary h4, .lcd-truck-cart-summary dt, .lcd-truck-cart-summary dd, .info-wrap li";
  var riadkyRozpisu = function (k) { return k ? Array.prototype.map.call(k.querySelectorAll(RIADKY), function (e) { return e.textContent.replace(/\\s+/g, " ").trim(); }) : []; };
  var styl = function (e) { if (!e) return null; var c = getComputedStyle(e), b = getComputedStyle(e, "::before");
    return { pismo: c.fontSize, vaha: c.fontWeight, farba: c.color, odrazka: b.content && b.content !== "none" && b.content !== "normal" ? b.backgroundColor + " " + b.width : "none",
      rodina: c.fontFamily.split(",")[0].trim(), rozostup: c.letterSpacing }; };
  var karta = function (e) { if (!e) return null; var c = getComputedStyle(e); return c.backgroundColor + " " + c.borderTopWidth + " " + c.borderTopStyle + " " + c.borderTopColor + " " + c.borderTopLeftRadius; };
  var RIADKY_A1 = "ul.lcd-rozpis > li, .lcd-truck-cart-summary dt, .info-wrap li";
  var vidA1 = function (e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 1 && r.height > 1 && c.visibility !== "hidden" && c.display !== "none"; };
  var textA1 = function (e) { return (e.tagName === "DT" ? e.textContent + ": " + (e.nextElementSibling ? e.nextElementSibling.textContent : "") : e.textContent).replace(/\\s+/g, " ").trim(); };
  // riadky rozpisu A1 (li; pri kamióne „dt: dd“) — všetky v DOM, alebo len tie, ktoré zákazník vidí (pri dt aj jeho dd)
  var riadkyA1 = function (k, lenVid) { return k ? Array.prototype.filter.call(k.querySelectorAll(RIADKY_A1), function (e) {
    return !lenVid || vidA1(e) && (e.tagName !== "DT" || vidA1(e.nextElementSibling)); }).map(textA1) : []; };
  // viditeľná karta skupiny kamióna bez viditeľného riadku (prázdna karta s nadpisom)
  var prazdneSkupiny = function (k) { return k ? Array.prototype.filter.call(k.querySelectorAll(".lcd-truck-cart-summary__group"), function (g) {
    return vidA1(g) && !Array.prototype.some.call(g.querySelectorAll("dt"), vidA1); }).length : 0; };
  var druhA1 = function (k) { return !k ? null : k.querySelector(".lcd-truck-cart-summary") ? "kamion" : k.querySelector(".info-wrap") ? "info" : "rozpis"; };
  var vzhlad = function (k) { return !k ? null : { li: styl(k.querySelector("ul.lcd-rozpis > li")), h: styl(k.querySelector("ul.lcd-rozpis .lcd-rozpis__h")),
    h4: styl(k.querySelector(".lcd-truck-cart-summary h4")), dt: styl(k.querySelector(".lcd-truck-cart-summary dt")), dd: styl(k.querySelector(".lcd-truck-cart-summary dd")),
    skupina: karta(k.querySelector(".lcd-truck-cart-summary__group")) }; };`;
/** Košík: položky (kľúč, fotka, rozpis a jeho vzhľad), vzhľad (trieda, piesok, krokovník, karty, súhrn so zlatým pruhom), mapa fotiek. */
const S42_KOSIK = `(function () {${S42_ROZPIS_JS}
  var cs = function (e) { return e ? getComputedStyle(e) : null; };
  var t = function (e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : ""; };
  var riadky = Array.prototype.map.call(document.querySelectorAll("tr.removeable[data-micro-identifier]"), function (tr) {
    var img = tr.querySelector(".cart-p-image img");
    return { kluc: tr.getAttribute("data-micro-identifier"), sku: tr.getAttribute("data-micro-sku"), foto: img ? (img.getAttribute("data-src") || img.getAttribute("src")) : null,
      rozpis: Array.prototype.map.call(tr.querySelectorAll("ul.lcd-rozpis li"), t), kamion: Array.prototype.map.call(tr.querySelectorAll(".lcd-truck-cart-summary dd"), t),
      riadkyRozpisu: riadkyRozpisu(tr), riadkyA1: riadkyA1(tr, false), druh: druhA1(tr), vzhlad: vzhlad(tr), sucet: t(tr.querySelector('[data-testid="cartPrice"]')) };
  });
  var kroky = Array.prototype.filter.call(document.querySelectorAll("ol.cart-header li.step"), function (l) { return l.getBoundingClientRect().height > 0; }).map(function (l) {
    var c = cs(l), p = getComputedStyle(l, "::before");
    return { text: t(l), aktivny: l.classList.contains("active"), hore: c.borderTopWidth + " " + c.borderTopColor, cislo: p.content };
  });
  var box = document.querySelector(".summary-wrapper > .box") || document.querySelector(".summary-wrapper"), cb = cs(box);
  var tl = document.getElementById("continue-order-button"), ct = cs(tl), pol = document.querySelector("tr.removeable"), cp = cs(pol);
  var fotky = null; try { fotky = JSON.parse(sessionStorage.getItem("lcdOpcFotky") || "null"); } catch (e) {}
  return { trieda: document.documentElement.classList.contains("lcd-opc-kosik"), triedy: document.documentElement.className, pozadie: cs(document.body).backgroundColor,
    kroky: kroky, riadky: riadky, suhrnHore: cb ? cb.borderTopWidth + " " + cb.borderTopColor : null, suhrnPozadie: cb ? cb.backgroundColor : null,
    pokracovat: ct ? /gradient/.test(ct.backgroundImage) : false, polozka: cp ? cp.backgroundColor + " " + cp.borderTopLeftRadius : null,
    fotky: fotky, sw: document.documentElement.scrollWidth, iw: innerWidth, vyska: document.documentElement.scrollHeight,
    krokyOpc: !!document.querySelector("ol.cart-header.lcd-opc-kroky"), celkom: t(document.querySelector('.summary-wrapper [data-testid="recapFullPrice"]') || document.querySelector('[data-testid="recapFullPrice"]')) };
})()`;
/** Krok 2: položky súhrnu s rozpisom pod názvom (karta detailu), pilulkou „Zobraziť viac“ a fotkou; čo do poznámky objednávky zapíše main.js toNote
 *  (sessionStorage.model, pri kamióne truckOrderSummary — #remark sa plní až pri odoslaní). */
const S42_POLOZKY = `(function () {${S42_ROZPIS_JS}
  var t = function (e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : ""; };
  var vid = function (e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 1 && r.height > 1 && c.visibility !== "hidden" && c.display !== "none"; };
  var rect = function (e) { var r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top + scrollY), r: Math.round(r.right), b: Math.round(r.bottom + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  var ss = function (k) { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } };
  return { model: ss("model"), truck: ss("truckOrderSummary"), vyska: document.documentElement.scrollHeight,
    polozky: Array.prototype.map.call(document.querySelectorAll("#summary-box .cart-items .cart-item"), function (p) {
      var z = p.querySelectorAll(":scope > .lcd-opc-zob"), zb = z[0] || null, d = p.querySelector(":scope > .lcd-opc-detail");
      var f = p.querySelector(":scope > img.lcd-opc-foto"), n = p.querySelector(".cart-item-name");
      var ml = n && n.querySelector("a.main-link");
      var nazov = ml ? Array.prototype.filter.call(ml.childNodes, function (x) { return x.nodeType === 3; }).map(function (x) { return x.textContent; }).join(" ").replace(/\\s+/g, " ").trim() : "";
      var popisZob = zb ? (zb.getAttribute("aria-describedby") || "").split(/\\s+/).filter(Boolean).map(function (id) { return t(document.getElementById(id)); }).join(" ") : "";
      return { kluc: p.getAttribute("data-micro-identifier"), sku: p.getAttribute("data-micro-sku"), pocetZob: z.length, zobKluc: zb ? zb.getAttribute("data-lcd-opc-kluc") : null,
        pocetDetailov: p.querySelectorAll(".lcd-opc-detail").length,
        nazov: nazov, popisZob: popisZob, menoOrez: ml ? ml.scrollHeight > ml.clientHeight + 1 : null,
        // viditeľné riadky názvu = výška odkazu / výška riadku (orezané -webkit-line-clamp sa nerátajú)
        riadky: ml ? Math.round(ml.getBoundingClientRect().height / (parseFloat(getComputedStyle(ml).lineHeight) || 20.8)) : 0,
        zob: zb ? { text: t(zb), exp: zb.getAttribute("aria-expanded"), typ: zb.getAttribute("type"), tag: zb.tagName, r: rect(zb), vid: vid(zb),
          vnutri: !!d && zb.getAttribute("aria-controls") === d.id && p.contains(d) } : null,
        detailVid: vid(d), detailText: d ? t(d) : "", detailRiadky: riadkyRozpisu(d), detailVzhlad: vzhlad(d), detailKarta: karta(d),
        hned: riadkyA1(d, true), prazdneSkupiny: prazdneSkupiny(d),
        // v karte smie byť len natívny rozpis (ul.lcd-rozpis / span príplatkov kamióna), nič pridané
        detailCudzie: d ? d.querySelectorAll(":scope > :not(ul.lcd-rozpis):not(span.main-link-surcharges)").length : 0,
        detailImg: d ? d.querySelectorAll("img").length : 0, bodky: d ? d.querySelectorAll(".lcd-opc-bodka").length : 0, detailR: vid(d) ? rect(d) : null,
        foto: f ? { src: f.getAttribute("src"), aw: f.getAttribute("width"), ah: f.getAttribute("height"), r: rect(f), nw: f.naturalWidth } : null,
        r: rect(p), meno: n ? rect(n) : null, h: Math.round(p.getBoundingClientRect().height), ks: t(p.querySelector(".cart-item-amount")), cena: t(p.querySelector(".cart-item-price")) };
    }) };
})()`;
/** Zbalený súhrn navrchu (telefón, vzhlad.js obnovZbalenySuhrn): kópie položiek s rozpisom pod názvom, bez fotky, s vlastnou pilulkou (A1). */
const S42_ZBALENE = `(function () {${S42_ROZPIS_JS}
  var zb = document.getElementById("lcd-opc-zbalene");
  if (!zb) return null;
  var vid = function (e) { var r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 1 && r.height > 1 && c.visibility !== "hidden" && c.display !== "none"; };
  var bolo = zb.open; zb.open = true;
  try {
    return { vid: vid(zb), polozky: Array.prototype.map.call(zb.querySelectorAll(".lcd-opc-zbalene__polozky .cart-item"), function (k) {
      var dd = Array.prototype.filter.call(k.querySelectorAll(".lcd-truck-cart-summary dd"), vid);
      var zz = k.querySelectorAll(".lcd-opc-zob"), z = zz[0] || null, r = z ? z.getBoundingClientRect() : null;
      return { riadky: riadkyRozpisu(k), hned: riadkyA1(k, true), prazdneSkupiny: prazdneSkupiny(k),
        // kamión so súhrnom (karty skupín .lcd-truck-cart-summary): písmo viditeľných hodnôt (N2)
        vidKamion: dd.length, pismoKamion: dd.length ? parseFloat(getComputedStyle(dd[0]).fontSize) : 0,
        pocetZob: zz.length, zob: z ? { text: z.textContent.replace(/\\s+/g, " ").trim(), exp: z.getAttribute("aria-expanded"), kluc: z.getAttribute("data-lcd-opc-kluc"),
          ctrl: !!z.getAttribute("aria-controls") && !!k.querySelector("#" + z.getAttribute("aria-controls")), vid: vid(z), w: Math.round(r.width), h: Math.round(r.height),
          popis: (z.getAttribute("aria-describedby") || "").split(/\\s+/).filter(Boolean).map(function (id) { var e = document.getElementById(id); return e ? e.textContent : ""; }).join(" ").replace(/\\s+/g, " ").trim() } : null,
        cudzie: k.querySelectorAll(".lcd-opc-foto, .lcd-opc-detail, .lcd-opc-bodka, img").length };
    }) };
  } finally { zb.open = bolo; }
})()`;
const S42_CLS = `(async function () {
  var h = function () { return Array.prototype.map.call(document.querySelectorAll("#summary-box .cart-items .cart-item"), function (p) { return Math.round(p.getBoundingClientRect().height * 10) / 10; }).join(","); };
  var pred = h();
  await Promise.all(Array.prototype.map.call(document.querySelectorAll("#summary-box img.lcd-opc-foto"), function (i) { return (i.decode ? i.decode() : Promise.resolve()).catch(function () {}); }));
  await new Promise(function (r) { requestAnimationFrame(function () { requestAnimationFrame(r); }); });
  return { pred: pred, po: h(), nacitane: Array.prototype.map.call(document.querySelectorAll("#summary-box img.lcd-opc-foto"), function (i) { return i.naturalWidth; }).join(",") };
})()`;
const slova = (x) => String(x || "").match(/[\p{L}\d]+/gu) || [];
async function s42Klaves(s, sel, kl) {
  await s.ev(`document.querySelector(${JSON.stringify(sel)}).focus(), 1`);
  const K = kl === "Enter" ? { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 } : { key: " ", code: "Space", windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32 };
  await s.k.posli("Input.dispatchKeyEvent", Object.assign({ type: "keyDown", text: kl === "Enter" ? "\r" : " " }, K));
  await s.k.posli("Input.dispatchKeyEvent", Object.assign({ type: "keyUp" }, K));
  await pauza(250);
}
/** Položka košíka má natívny rozpis (cart.js): len taká má v súhrne kartu detailu (rozpis pod názvom). */
const maRozpis = (r) => !!(r && r.riadkyRozpisu && r.riadkyRozpisu.length);
/**
 * A1 (Michal 30. 10. 2026): riadky rozpisu z košíka, ktoré má súhrn ukázať HNEĎ — koberce „Auto“, „Farba 1. / 2. vrstvy“
 * (CZ „Barva“), kamión „Vozidlo“ a prvé „Typ a farba materiálu“ (kamión bez súhrnu: „Typ materiálu“ a „Farba materiálu“),
 * inak prvé 2 riadky. Nezávislé od opc/polozky.js — číta len texty košíka.
 */
function s42Hned(riadky, druh) {
  const nazov = (x) => (/^(.+?)(?::\s|\s[-–]\s)/.exec(x) || [0, ""])[1];
  let v = [];
  if (druh === "kamion" || druh === "info") {
    riadky.forEach((x, i) => { if (/^Vozidlo$/.test(nazov(x))) v.push(i); });
    const m = riadky.findIndex((x) => /^Typ a (farba|barva) materiálu$/.test(nazov(x)));
    if (m >= 0) v.push(m);
    else [/^Typ materiálu$/, /^(Farba|Barva) materiálu$/].forEach((re) => { const j = riadky.findIndex((x) => re.test(nazov(x))); if (j >= 0) v.push(j); });
  } else riadky.forEach((x, i) => { if (/^(Auto|(Farba|Barva) [12]\. vrstvy)$/.test(nazov(x))) v.push(i); });
  if (!v.length) v = riadky.slice(0, 2).map((x, i) => i);
  return riadky.filter((x, i) => v.includes(i));
}
/** Názov zbalenej položky: s pilulkou najviac 2 riadky (doladenie 2), bez pilulky celý — nič sa neskrýva, inak by sa celý
 *  nedal zobraziť (revízia A1, N2: „Luxusný koberec do kufra…“, CZ vzorkovník). */
function s42Nazov(p, kde) {
  if (p.pocetZob) over(p.riadky >= 1 && p.riadky <= 2, kde + ": zbalený názov má " + p.riadky + " riadky (najviac 2 na PC aj na telefóne): „" + p.nazov + "“");
  else over(p.menoOrez === false && p.riadky >= 1, kde + ": položka bez pilulky má orezaný názov (nič sa neskrýva = celý názov, N2): „" + p.nazov + "“");
}
/** Spoločné kontroly položiek: rozpis z košíka pod názvom vždy viditeľný, hneď len riadky A1 (zbalené) / všetky (rozbalené);
 *  pilulka „Zobraziť viac“ (button, aria, 44 px, text, pod rozpisom) len keď sa niečo skrýva; fotka pri správnej položke
 *  (60 × 60, vľavo od názvu). */
function s42Polozky(m, kosik, T, popis, rozbalene) {
  over(m.polozky.length === kosik.riadky.length && m.polozky.length > 0, popis + ": v súhrne " + m.polozky.length + " položiek, v košíku " + kosik.riadky.length);
  m.polozky.forEach((p, i) => {
    const kde = popis + ", položka " + (i + 1);
    const r = kosik.riadky.find((x) => x.kluc === p.kluc);
    over(r, kde + ": kľúč " + p.kluc + " nie je v košíku");
    let skryva = false;
    if (maRozpis(r)) {
      const hned = s42Hned(r.riadkyA1, r.druh);
      skryva = hned.length < r.riadkyA1.length;
      over(p.pocetDetailov === 1 && p.detailVid, kde + ": rozpis z košíka nie je pod názvom viditeľný (karta " + p.pocetDetailov + "×, " + (p.detailVid ? "viditeľná" : "skrytá") + ")");
      const cakane = rozbalene || !skryva ? r.riadkyA1 : hned;
      over(rovnake(p.hned, cakane), kde + ": " + (rozbalene ? "rozbalené" : "zbalené") + " — viditeľné riadky rozpisu ≠ A1:\n      súhrn  " + JSON.stringify(p.hned) + "\n      čakal  " + JSON.stringify(cakane));
      over(!p.prazdneSkupiny, kde + ": viditeľná karta skupiny kamióna bez riadku (" + p.prazdneSkupiny + ")");
      if (skryva) {
        over(p.pocetZob === 1 && p.zob && p.zob.tag === "BUTTON" && p.zob.typ === "button" && p.zob.vnutri && p.zob.vid,
          kde + ": chýba pilulka „Zobraziť viac“ (button type=button, aria-controls na kartu v tej istej položke): " + JSON.stringify(p.zob) + " ×" + p.pocetZob);
        over(p.zob.r.w >= 44 && p.zob.r.h >= 44, kde + ": dotyková plocha pilulky " + p.zob.r.w + " × " + p.zob.r.h + " < 44 px");
        over(p.zob.exp === String(rozbalene), kde + ": čakal som " + (rozbalene ? "rozbalené" : "zbalené") + ", aria-expanded " + p.zob.exp);
        over(p.zob.text === (rozbalene ? T.skryt : T.zobrazit), kde + ": text pilulky „" + p.zob.text + "“ (čakal som „" + (rozbalene ? T.skryt : T.zobrazit) + "“, bez počtu)");
        over(p.detailR && p.zob.r.t >= p.detailR.b - 1, kde + ": pilulka nie je pod rozpisom: " + JSON.stringify([p.zob.r, p.detailR]));
        // čítačka: pri viacerých položkách rozlíši tlačidlá podľa názvu položky (revízia doladenia 1, nález 9)
        over(p.nazov && p.popisZob.toLowerCase().includes(p.nazov.toLowerCase()), kde + ": pilulka nemá v popise (aria-describedby) názov položky: " + JSON.stringify([p.popisZob, p.nazov]));
      } else over(p.pocetZob === 0, kde + ": nič sa neskrýva, a predsa je tu pilulka (" + p.pocetZob + "×)");
    } else {
      // položka bez rozpisu: bez karty aj bez pilulky (nie je čo zobraziť)
      over(p.pocetZob === 0 && p.pocetDetailov === 0, kde + ": položka bez rozpisu v košíku má pilulku (" + p.pocetZob + ") alebo kartu detailu (" + p.pocetDetailov + ")");
    }
    // rozbalené = celý názov ako v náhľade 2b / 4 / 6; zbalené s pilulkou najviac 2 riadky na PC aj na telefóne; bez pilulky
    // (nič sa neskrýva) celý názov — inak by sa nedal zobraziť (revízia A1, N2)
    if (rozbalene && skryva) over(p.menoOrez === false, kde + ": rozbalená položka má orezaný názov (náhľad 6 ukazuje celý): „" + p.nazov + "“");
    else s42Nazov(p, kde);
    // veľké začiatočné písmeno priamo v texte názvu (doladenie 2): WebKit (Safari, iPhone) ::first-letter na -webkit-box
    // s line-clamp nezväčší a ukazoval „luxusné…“ — Chromium by chybu cez ::first-letter skryl, preto kontrola v DOM
    over(p.nazov && p.nazov.charAt(0) === p.nazov.charAt(0).toLocaleUpperCase("sk"), kde + ": názov v súhrne nezačína veľkým písmenom (Safari ho cez ::first-letter nezväčší): „" + p.nazov + "“");
    if (r.foto && /^https?:\/\//.test(r.foto)) {
      over(p.foto && p.foto.src === r.foto, kde + ": fotka nie je fotka tej istej položky z košíka: " + JSON.stringify([p.foto && p.foto.src, r.foto]));
      over(p.foto.aw === "60" && p.foto.ah === "60" && p.foto.r.w === 60 && p.foto.r.h === 60, kde + ": fotka nemá pevných 60 × 60: " + JSON.stringify(p.foto));
      over(p.meno && p.foto.r.r <= p.meno.l && p.foto.r.t <= p.meno.t + 4, kde + ": fotka nie je vľavo od názvu: " + JSON.stringify([p.foto.r, p.meno]));
    } else over(!p.foto, kde + ": fotka bez záznamu z košíka");
  });
}
/**
 * Príplatky položky kamióna, ako idú do objednávky (fixtures/sk-kamion/krok2.html, data-testid cartWidgetSurchargeName):
 * „Názov - hodnota“ oddelené „, Názov - “ (hodnota sama môže mať čiarku: „čierna, čierne šitie – 11“).
 */
function priplatkyKamiona() {
  const html = readFileSync(join(FIXTURES, "sk-kamion", "krok2.html"), "utf8");
  const s = /data-testid="cartWidgetSurchargeName"[^>]*>([^<]*)</.exec(html);
  if (!s) throw new Error("fixtures sk-kamion/krok2.html: chýbajú príplatky položky (cartWidgetSurchargeName)");
  const text = s[1].replace(/&nbsp;/g, " ").replace(/^\s*Príplatky:\s*/, "").trim();
  return Object.fromEntries(text.split(/,\s(?=[A-ZÁČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][^,]*? - )/).map((x) => { const i = x.indexOf(" - "); return [x.slice(0, i).trim(), x.slice(i + 3).trim()]; }));
}
/** Detail kamióna vs. príplatky položky (materiál, lemovanie, nášivky, tapacír) — nie kruh sessionStorage -> košík -> detail. */
function s42KamionVsPriplatky(text, P, kde) {
  const maj = (hodnota, co) => slova(hodnota).forEach((w) => over(text.toLowerCase().includes(w.toLowerCase()),
    kde + ": detail kamióna nesedí s príplatkami položky — „" + co + ": " + hodnota + "“, chýba „" + w + "“ — detail: " + text.slice(0, 240)));
  ["Typ materiálu", "Farba materiálu", "Farba lemovania", "Farba nášiviek na boky", "Farba nášivky na stred"].forEach((k) => { if (P[k]) maj(P[k], k); });
  ["Typ nášiviek na boky", "Typ nášivky na stred"].forEach((k) => { if (P[k]) maj(P[k].replace(/^Nášivka\s+/i, ""), k); });
  if (P["Tapacír"]) over(/^Áno/i.test(P["Tapacír"]) === /tapacír dverí/i.test(text), kde + ": tapacír v príplatkoch „" + P["Tapacír"] + "“, v detaile " + (/tapacír dverí/i.test(text) ? "je" : "nie je"));
}
const rovnake = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/**
 * Obsah rozbalenej karty = PRESNE rekapitulácia z košíka (náhľad 5): tie isté riadky v tom istom poradí, nič navyše (obrázky,
 * guličky, Počet / Cena, „Niečo nesedí“), rovnaký vypočítaný vzhľad ako v košíku, karta pod stĺpcom názvu; auto a kamión
 * pre poznámku objednávky sú v nej.
 */
function s42Obsah(m, kosik, T, popis, priplatky) {
  m.polozky.forEach((p, i) => {
    const kde = popis + ", položka " + (i + 1);
    const r = kosik.riadky.find((x) => x.kluc === p.kluc);
    if (!maRozpis(r)) return; // bez rozpisu nie je karta (s42Polozky)
    const text = p.detailText;
    over(rovnake(p.detailRiadky, r.riadkyRozpisu), kde + ": riadky detailu ≠ rekapitulácia z košíka:\n      detail " + JSON.stringify(p.detailRiadky) + "\n      košík  " + JSON.stringify(r.riadkyRozpisu));
    over(p.detailCudzie === 0, kde + ": v detaile je okrem rozpisu z košíka iný prvok (" + p.detailCudzie + "×): " + text.slice(0, 160));
    over(p.detailImg === 0 && p.bodky === 0, kde + ": v detaile sú obrázky (" + p.detailImg + ") alebo farebné guličky (" + p.bodky + ")");
    over(!/Počet|Cena|Niečo nesedí|Něco nesedí|Upravi[tť] v košíku/.test(text), kde + ": v detaile je Počet / Cena / „Niečo nesedí“: " + text.slice(0, 160));
    // auto, ktoré main.js toNote zapíše do poznámky („model: …“ zo sessionStorage.model)
    if (r.rozpis.some((li) => /^Auto/.test(li))) over(m.model && text.includes(m.model), kde + ": auto pre poznámku objednávky „" + m.model + "“ nie je v detaile: " + text.slice(0, 160));
    // kamión: poznámka = truckOrderSummary (mergeTruckOrderSummaryIntoNote), každá hodnota je v detaile
    if (r.kamion.length) {
      const hodnoty = String(m.truck).split("\n").map((l) => /^- [^:]+:\s*(.+)$/.exec(l)).filter(Boolean).map((x) => x[1]);
      over(hodnoty.length > 0, kde + ": pri kamióne chýba truckOrderSummary pre poznámku");
      hodnoty.forEach((h) => slova(h).forEach((w) => over(text.includes(w), kde + ": v detaile chýba „" + w + "“ z poznámky kamióna „" + h + "“")));
      if (priplatky) s42KamionVsPriplatky(text, priplatky, kde);
    }
    over(!/DPH|Pripraven[ée] pre|ekok|eko-k/i.test(text), kde + ": zakázané slovo v detaile: " + text.slice(0, 160));
    // vzhľad = košík (vypočítaný štýl), žiadna vlastná karta detailu
    const v = p.detailVzhlad, k = r.vzhlad;
    over(/^rgba\(0, 0, 0, 0\) 0px /.test(p.detailKarta || ""), kde + ": detail má vlastnú kartu (pozadie / rámik): " + p.detailKarta);
    if (k.li) {
      over(rovnake(v.li, k.li) && v.li.pismo === "14px" && /196, 155, 49/.test(v.li.odrazka), kde + ": riadok rozpisu v detaile nevyzerá ako v košíku (14 px, zlatá odrážka): " + JSON.stringify([v.li, k.li]));
      over(rovnake(v.h, k.h), kde + ": hodnota v rozpise detailu nevyzerá ako v košíku: " + JSON.stringify([v.h, k.h]));
    }
    if (k.skupina) {
      over(v.skupina === k.skupina && rovnake(v.h4, k.h4), kde + ": karta skupiny kamióna nevyzerá ako v košíku: " + JSON.stringify([v.skupina, k.skupina, v.h4, k.h4]));
      // farba, hrúbka, písmo (rodina) a rozostup ako v košíku; veľkosť podľa mierky LCD najmenej 14 px (natívne 13 px,
      // _cart.scss) — kontroluje aj zakladne(). Rodina a rozostup: v košíku aj v pokladni ich dt/dd dedia z a.main-link
      // (Exo 2, .005em), presunutý span by ich stratil (revízia 30. 10. 2026, UX-4); rozostup je .005em z písma odkazu
      // (košík 16–17 px, pokladňa 15 px), preto len zhruba
      const rozostup = (a, b) => Math.abs((parseFloat(a) || 0) - (parseFloat(b) || 0)) <= 0.02 && (a === "normal") === (b === "normal");
      ["dt", "dd"].forEach((x) => over(v[x] && v[x].farba === k[x].farba && v[x].vaha === k[x].vaha && v[x].rodina === k[x].rodina &&
        rozostup(v[x].rozostup, k[x].rozostup) && parseFloat(v[x].pismo) >= 14,
        kde + ": " + x + " kamióna v detaile nevyzerá ako v košíku (farba, hrúbka, písmo, rozostup, ≥ 14 px): " + JSON.stringify([v[x], k[x]])));
    }
    // pod stĺpcom názvu (grid „. detail detail“ pri fotke), nie pod fotkou a nie mimo položky
    over(p.detailR && p.meno && Math.abs(p.detailR.l - p.meno.l) <= 1 && p.detailR.r <= p.r.r + 1 && p.detailR.t >= p.meno.b - 1,
      kde + ": detail nie je pod stĺpcom názvu: " + JSON.stringify({ detail: p.detailR, nazov: p.meno, polozka: p.r }));
  });
}
/** Zbalený súhrn navrchu (telefón): pri každej položke rozpis z košíka pod názvom (DOM), bez fotky a guličiek; hneď len
 *  riadky A1, vlastná pilulka kópie „Zobraziť viac“ (keď sa niečo skrýva) rozbalí všetky. */
function s42Zbalene(z, kosik, T, popis, rozbalene) {
  over(z && z.vid, popis + ": zbalený súhrn navrchu chýba: " + JSON.stringify(z));
  over(z.polozky.length === kosik.riadky.length, popis + ": zbalený súhrn má " + z.polozky.length + " položiek, košík " + kosik.riadky.length);
  z.polozky.forEach((k, i) => {
    const r = kosik.riadky[i], kde = popis + ", zbalený súhrn" + (rozbalene ? " (kópia rozbalená)" : "") + ", položka " + (i + 1);
    over(k.cudzie === 0, kde + ": fotka / karta / gulička v kópii (" + k.cudzie + ")");
    over(rovnake(k.riadky, r.riadkyRozpisu), kde + ": rozpis ≠ košík: " + JSON.stringify([k.riadky, r.riadkyRozpisu]));
    const hned = s42Hned(r.riadkyA1, r.druh), skryva = maRozpis(r) && hned.length < r.riadkyA1.length;
    const cakane = !maRozpis(r) ? [] : rozbalene || !skryva ? r.riadkyA1 : hned;
    over(rovnake(k.hned, cakane), kde + ": viditeľné riadky ≠ A1:\n      kópia  " + JSON.stringify(k.hned) + "\n      čakal  " + JSON.stringify(cakane));
    over(!k.prazdneSkupiny, kde + ": viditeľná karta skupiny kamióna bez riadku (" + k.prazdneSkupiny + ")");
    over(k.pocetZob === (skryva ? 1 : 0), kde + ": pilulka v kópii " + k.pocetZob + "× (čakal som " + (skryva ? 1 : 0) + ")");
    if (skryva) {
      over(k.zob.vid && k.zob.ctrl && k.zob.w >= 44 && k.zob.h >= 44 && k.zob.exp === String(rozbalene) && k.zob.text === (rozbalene ? T.skryt : T.zobrazit),
        kde + ": pilulka kópie (viditeľná, aria-controls na rozpis kópie, 44 px, stav, text): " + JSON.stringify(k.zob));
      over(k.zob.popis && !/Zobrazi/.test(k.zob.popis), kde + ": pilulka kópie bez popisu názvom položky: " + JSON.stringify(k.zob.popis));
    }
    // kamión so súhrnom: viditeľné hodnoty ≥ 14 px (revízia 30. 10. 2026, N2 — kniha § 6.8 „Po rozbalení ukáže položky s rozpisom“)
    if (r.kamion.length) over(k.vidKamion > 0 && k.pismoKamion >= 14, kde + ": rozpis kamióna nevidno alebo písmo " + k.pismoKamion + " px < 14");
  });
}
/** Telefón: otvorí „Vaša objednávka“ a ťukne na pilulku každej kópie (ako zákazník); zbalený súhrn ostane otvorený. */
async function s42KlikniKopie(s, z) {
  await s.ev(`(function () { var d = document.getElementById("lcd-opc-zbalene"); if (d) d.open = true; return 1; })()`);
  await pauza(150);
  for (const k of z.polozky.filter((x) => x.zob)) await s.klikni(`#lcd-opc-zbalene .lcd-opc-zob[data-lcd-opc-kluc="${k.zob.kluc}"]`, { popis: "pilulka kópie " + k.zob.kluc });
  await pauza(250);
}

SCENARE.S42 = {
  popis: "Súhrn A1: pod názvom rozpis z košíka hneď (Auto + vrstvy / vozidlo + materiál / prvé 2), zvyšok po „Zobraziť viac“ (bez počtu, aria, klávesnica, 44 px, CZ texty; bez pilulky, keď sa nič neskrýva), rozbalený = rekapitulácia z košíka (tie isté riadky a vzhľad, pod názvom, bez guličiek, počtu, ceny, „Niečo nesedí“), zbalený súhrn navrchu s vlastnou pilulkou, fotka 60 px pri správnej položke bez posunu; košík s kódom OPC v štýle kroku 2, bez kódu bez zmeny; set 1v (a 2v, keď sú fixtures sk-set2v), dve položky, kamión, vzorkovník; 360–1920 a notebook 1366×657",
  async fn(J) {
    const T = S42_TEXTY[J.web];
    const casti = [];
    // dvojvrstvový set: fixtures sk-set2v (nie sú v každej sade, LCD_OPC_FIXTURES) — bez nich sa preskočí a info to povie
    const set2v = J.web === "sk" && existsSync(join(FIXTURES, "sk-set2v"));
    // CZ: vzorkovník (1 vzorka, bez pilulky) a „vzorky3“ (podvrh s 3 vzorkami — pilulka „Zobrazit více“, ťuk, klávesnica,
    // kópia navrchu aj na CZ; revízia A1, N3)
    const kosiky = J.web === "sk" ? ["set", "dve", "kamion", "vzorkovnik"].concat(set2v ? ["set2v"] : []) : ["vzorkovnik", "vzorky3"];
    const vzorky = (k) => k === "vzorkovnik" || k === "vzorky3";
    if (J.web === "sk" && !set2v) casti.push("set2v preskočený (fixtures sk-set2v chýbajú)");
    for (const kosik of kosiky) {
      const s = await J.novaStranka({ kosik, skript: s42Seed(kosik) });
      let K = null;
      await naKrok2(s, { query: vzorky(kosik) ? "" : "&lcddoplnok=0", pred: async (k) => { K = await k.ev(S42_KOSIK); } });
      const popis = J.sirka + " " + kosik;
      // košík s kódom OPC: štýl kroku 2 (piesok, krokovník ① ②, biele karty, súhrn so zlatým pruhom, zelené Pokračovať)
      over(K.trieda, popis + ": košík s kódom OPC bez html.lcd-opc-kosik: " + K.triedy);
      over(K.pozadie === "rgb(247, 245, 239)", popis + ": pozadie košíka " + K.pozadie + " (čakal som piesok #f7f5ef)");
      over(K.kroky.length === 2 && K.kroky[0].text === T.kroky[0] && K.kroky[1].text === T.kroky[1] && K.kroky[0].aktivny && /196, 155, 49/.test(K.kroky[0].hore) && !/196, 155, 49/.test(K.kroky[1].hore),
        popis + ": krokovník košíka nie je „① " + T.kroky[0] + " (zlatý) → ② " + T.kroky[1] + " (sivý)“: " + JSON.stringify(K.kroky));
      over(K.kroky.map((k) => k.cislo).join() === '"1","2"', popis + ": čísla krokov v krúžku nie sú 1 a 2: " + JSON.stringify(K.kroky.map((k) => k.cislo)));
      over(/^3px rgb\(196, 155, 49\)$/.test(K.suhrnHore) && K.suhrnPozadie === "rgb(255, 255, 255)", popis + ": súhrn košíka nie je biela karta so zlatým pruhom: " + K.suhrnHore + " / " + K.suhrnPozadie);
      over(K.polozka === "rgb(255, 255, 255) 14px", popis + ": položka košíka nie je biela karta s rádiusom 14: " + K.polozka);
      over(K.pokracovat, popis + ": „Pokračovať“ nie je zelené");
      over(K.sw <= K.iw + 1, popis + ": košík vodorovne pretečie " + K.sw + " > " + K.iw);
      // kľúč fotky = identifikátor produktu + kód varianty (dva sety toho istého produktu v inej farbe)
      const sFotkou = K.riadky.filter((r) => r.foto && /^https?:/.test(r.foto));
      over(K.fotky && sFotkou.every((r) => K.fotky[r.kluc + "|" + (r.sku || "")] === r.foto) && Object.keys(K.fotky).length === sFotkou.length,
        popis + ": mapa fotiek v sessionStorage nesedí s košíkom: " + JSON.stringify(K.fotky));
      // testovacie dáta: súčty riadkov košíka = „Celkom za tovar“ (syntetický košík „dve“)
      const cislo = (x) => Number(String(x).replace(/[^\d]/g, ""));
      over(K.riadky.reduce((a, r) => a + cislo(r.sucet), 0) === cislo(K.celkom), popis + ": súčty riadkov košíka nesedia s „Celkom za tovar“: " + JSON.stringify([K.riadky.map((r) => r.sucet), K.celkom]));
      if (kosik === "set" || kosik === "dve" || kosik === "set2v") over(K.riadky[0].rozpis.some((li) => /^Auto/.test(li)), popis + ": v rozpise setu chýba Auto (kontrola auta v detaile by nič neoverila)");
      if (kosik === "set2v") over(K.riadky[0].rozpis.some((li) => /^Farba 2. vrstvy: /.test(li)), popis + ": fixtures sk-set2v nemajú v rozpise druhú vrstvu: " + JSON.stringify(K.riadky[0].rozpis));
      if (kosik === "vzorky3") over(K.riadky.length === 1 && K.riadky[0].riadkyA1.length === 3, popis + ": podvrh „vzorky3“ nemá v rozpise košíka 3 vzorky: " + JSON.stringify(K.riadky.map((r) => r.riadkyA1)));
      // krok 2 zbalené: rozpis A1 a pilulka, fotka bez posunu, každá fotka sa načítala (nie prázdny rámik)
      const cls = await s.ev(S42_CLS);
      over(cls.pred === cls.po, popis + ": výška položiek sa po načítaní fotky zmenila (posun obsahu): " + JSON.stringify(cls));
      over(!cls.nacitane.split(",").some((x) => x === "0"), popis + ": fotka v súhrne sa nenačítala (naturalWidth 0 = prázdny rámik): " + JSON.stringify(cls));
      let m = await s.ev(S42_POLOZKY);
      s42Polozky(m, K, T, popis + " zbalené", false);
      // telefón: zbalený súhrn navrchu (kópie položiek) má rozpis z košíka pod názvom, bez fotky, s vlastnou pilulkou; ťuk
      // na pilulku kópie rozbalí len kópiu (súhrn pri Objednať ostane zbalený)
      if (J.sirka < 768) {
        const z0 = await s.ev(S42_ZBALENE);
        s42Zbalene(z0, K, T, popis, false);
        if (z0.polozky.some((k) => k.zob)) {
          await s42KlikniKopie(s, z0);
          s42Zbalene(await s.ev(S42_ZBALENE), K, T, popis, true);
          s42Polozky(await s.ev(S42_POLOZKY), K, T, popis + " zbalené (po rozbalení kópie navrchu)", false);
          casti.push(kosik + ": kópia navrchu rozbalená");
        }
        await s.ev(`(function () { var d = document.getElementById("lcd-opc-zbalene"); if (d) d.open = false; return 1; })()`);
      }
      const vyskaZbalene = m.vyska;
      const vysky = m.polozky.map((p) => p.h);
      // rozbaliť každú položku s pilulkou skutočným klikom (telefón ťuk), karta = celý rozpis z košíka
      for (const p of m.polozky.filter((x) => x.zobKluc)) await s.klikni(`#summary-box .lcd-opc-zob[data-lcd-opc-kluc="${p.zobKluc}"]`, { popis: "pilulka " + p.zobKluc });
      await pauza(250);
      m = await s.ev(S42_POLOZKY);
      s42Polozky(m, K, T, popis + " rozbalené", true);
      s42Obsah(m, K, T, popis, kosik === "kamion" ? priplatkyKamiona() : null);
      const zakl = await zakladne(s, popis + " rozbalené");
      // klávesnica: Enter zbalí, medzerník rozbalí (prvá pilulka; vzorkovník s 1 vzorkou pilulku nemá)
      const sel = "#summary-box .cart-item .lcd-opc-zob";
      if (await s.ev(`!!document.querySelector(${JSON.stringify(sel)})`)) {
        await s42Klaves(s, sel, "Enter");
        let e = await s.ev(`document.querySelector(${JSON.stringify(sel)}).getAttribute("aria-expanded")`);
        over(e === "false", popis + ": Enter na pilulke nezbalil položku (aria-expanded " + e + ")");
        await s42Klaves(s, sel, " ");
        e = await s.ev(`document.querySelector(${JSON.stringify(sel)}).getAttribute("aria-expanded")`);
        over(e === "true", popis + ": medzerník na pilulke nerozbalil položku (aria-expanded " + e + ")");
      } else casti.push(kosik + ": nič sa neskrýva, bez pilulky");
      casti.push(kosik + " " + vyskaZbalene + "→" + zakl.vyska + " px (položky " + vysky.join("/") + ")");
      // prekreslenie súhrnu (zmena platby na dobierku): rozbalené, fotka a jedna pilulka ostávajú
      if (kosik === "set" || (vzorky(kosik) && J.web === "cz")) {
        await zvolPlatbu(s, T.dobierka);
        await s.cakaj(`/Dobierk|Dobírk/i.test((document.querySelector('#summary-box [data-testid="recapPaymentMethod"]') || {}).textContent || "") && !document.querySelector("#summary-box.lcd-opc-prepocet")`,
          { ms: 15000, popis: "súhrn s dobierkou" });
        await pauza(400);
        m = await s.ev(S42_POLOZKY);
        s42Polozky(m, K, T, popis + " po zmene platby", true);
        s42Obsah(m, K, T, popis + " po zmene platby");
        // kópia navrchu: stav kópie (rozbalená vyššie) prežije prekreslenie súhrnu
        if (J.sirka < 768) {
          const z1 = await s.ev(S42_ZBALENE);
          s42Zbalene(z1, K, T, popis + " po zmene platby", z1.polozky.some((k) => k.zob));
        }
        casti.push("po zmene platby ostalo rozbalené");
      }
      await s.zavri();
    }
    if (J.web === "cz") over(casti.some((c) => /^vzorky3: kópia navrchu rozbalená/.test(c)) || J.sirka >= 768, "CZ vzorky3: pilulka kópie navrchu sa neoverila: " + casti.join("; "));
    // ďalšie šírky (set SK / vzorkovník CZ): rozbalené bez pretečenia, písmo podľa mierky
    const kosik = J.web === "sk" ? "set" : "vzorkovnik";
    const q = { query: kosik === "set" ? "&lcddoplnok=0" : "" };
    for (const w of DALSIE(J.sirka)) {
      const t = await J.novaStranka({ kosik, sirka: w, skript: s42Seed(kosik) });
      await naKrok2(t, q);
      // zbalené: názov s pilulkou najviac na 2 riadkoch aj na 360 / 768 / 1920 (doladenie 2), bez pilulky celý (N2)
      (await t.ev(S42_POLOZKY)).polozky.forEach((p, i) => s42Nazov(p, w + " " + kosik + ", položka " + (i + 1)));
      await t.ev(`document.querySelectorAll("#summary-box .lcd-opc-zob").forEach(function (b) { b.click(); }), 1`);
      const mm = await zakladne(t, w + " " + kosik + " rozbalené");
      casti.push(w + ": " + mm.vyska + " px rozbalené");
      await t.zavri();
    }
    // revízia A1 (N2): položka bez pilulky (nič sa neskrýva) má celý názov tam, kde by sa inak orezal — SK dve položky
    // („Luxusný koberec do kufra Dragonskin Klasik“, telefón 360, PC 992), CZ vzorkovník na PC 992 (telefón 360 vyššie)
    for (const [w, k2] of J.sirka < 768 ? (J.web === "sk" ? [[360, "dve"]] : []) : [[992, J.web === "sk" ? "dve" : "vzorkovnik"]]) {
      const t = await J.novaStranka({ kosik: k2, sirka: w, skript: s42Seed(k2) });
      await naKrok2(t, { query: vzorky(k2) ? "" : "&lcddoplnok=0" });
      const pp = (await t.ev(S42_POLOZKY)).polozky;
      pp.forEach((p, i) => s42Nazov(p, w + " " + k2 + ", položka " + (i + 1)));
      over(pp.some((p) => !p.pocetZob), w + " " + k2 + ": žiadna položka bez pilulky (kontrola celého názvu by nič neoverila)");
      casti.push(w + " " + k2 + ": bez pilulky celý názov (" + pp.map((p) => p.riadky + " r.").join("/") + ")");
      await t.zavri();
    }
    // notebook 1366×657: zbalené = „Objednať“ celé na prvej obrazovke, alebo (od súhlasov B1, S41) karta nad súhrnom, ktorá
    // tlačidlo zakryje celé, a povinný súhlas je CELÝ nad ňou (revízia A1, N1: menšie medzery panela na PC vrátili súhlas setu
    // nad kartu) — karta tu čaká na rozhodnutie Michala (kniha § 10.12)
    if (J.sirka >= 992) {
      const t = await J.novaStranka({ kosik, sirka: 1366, vyska: 657, skript: s42Seed(kosik) });
      await naKrok2(t, q);
      await t.ev(`window.scrollTo({ top: 0, behavior: "instant" }), 1`);
      await pauza(500);
      const n = await t.ev(MER_PC);
      over(n.cele && !n.on || n.on && n.trci === 0 && n.suhlas && n.suhlas.t >= 0 && n.suhlas.b <= n.lista.t,
        "1366×657 zbalené: „Objednať“ nie je celé na prvej obrazovke, ani ho celé nezakryje karta s povinným súhlasom celým nad ňou: " + JSON.stringify(n));
      (await t.ev(S42_POLOZKY)).polozky.forEach((p, i) => s42Nazov(p, "1366×657 zbalené, položka " + (i + 1)));
      casti.push("1366×657 " + (n.on ? "karta, povinný súhlas " + n.suhlas.t + "–" + n.suhlas.b +
        " (POZOR: „Objednať“ " + n.objednat.t + "–" + n.objednat.b + " pod kartou — čaká na rozhodnutie Michala, § 10.12)" : "Objednať " + n.objednat.t + "–" + n.objednat.b));
      await t.zavri();
    }
    // košík bez kódu (zákazník): žiadna trieda OPC, žiadna mapa fotiek, krokovník Shoptetu
    const b = await J.novaStranka({ kosik: J.web === "sk" ? "set" : undefined, bezOpc: true });
    await b.chod("/kosik/" + (J.web === "sk" ? "?lcddoplnok=0" : ""), { popis: "košík bez kódu OPC" });
    const B = await b.ev(S42_KOSIK);
    over(!/lcd-opc/.test(B.triedy) && B.fotky === null && !B.krokyOpc, "košík bez kódu OPC sa zmenil: triedy „" + B.triedy + "“, fotky " + JSON.stringify(B.fotky) + ", kroky OPC " + B.krokyOpc);
    casti.push("bez kódu košík bez zmeny");
    await b.zavri();
    return { info: casti.join("; ") };
  },
};

// ------------------------------------------------------------------ S43 doladenie 2 (30. 10. 2026)
// Fotka v súhrne sa nenačíta (404 / chyba siete): nesmie ostať prázdny rámik 60 px — celý rámik preč, názov, rozpis a pilulka
// zarovnané vľavo bez medzery; po prekreslení súhrnu (zmena platby) sa rámik nevráti.
const FOTKA_404 = "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/shop/related/lcd-opc-test-404.jpg?x=100&y=100";
/** Košík pred „Pokračovať“: mapa fotiek (opc/kosik.js ulozFotky) s adresou, ktorú podvrh vráti ako 404 (nie je vo fixtures/cdn). */
const S43_ZLA_FOTKA = `(function () {
  var m = {};
  document.querySelectorAll("tr.removeable[data-micro-identifier]").forEach(function (tr) {
    m[tr.getAttribute("data-micro-identifier") + "|" + (tr.getAttribute("data-micro-sku") || "").trim()] = ${JSON.stringify(FOTKA_404)};
  });
  sessionStorage.setItem("lcdOpcFotky", JSON.stringify(m));
  return Object.keys(m).length;
})()`;
const S43_POLOZKY = `(function () {
  return Array.prototype.map.call(document.querySelectorAll("#summary-box .cart-items .cart-item"), function (p) {
    var f = p.querySelector("img.lcd-opc-foto"), n = p.querySelector(".cart-item-name"), z = p.querySelector(":scope > .lcd-opc-zob"), d = p.querySelector(":scope > .lcd-opc-detail");
    var rp = p.getBoundingClientRect(), rn = n.getBoundingClientRect(), rz = z ? z.getBoundingClientRect() : null, rd = d ? d.getBoundingClientRect() : null;
    var a = n.querySelector("a.main-link"), tx = a ? Array.prototype.find.call(a.childNodes, function (x) { return x.nodeType === 3 && /\\S/.test(x.nodeValue); }) : null;
    return { nazov: tx ? tx.nodeValue.trim().slice(0, 40) : "", foto: f ? { src: f.getAttribute("src"), nw: f.naturalWidth, hotovo: f.complete, w: Math.round(f.getBoundingClientRect().width) } : null,
      trieda: p.classList.contains("lcd-opc-s-fotkou"), nazovOdLava: Math.round(rn.left - rp.left), zobOdLava: rz ? Math.round(rz.left - rp.left) : null,
      detailOdLava: rd ? Math.round(rd.left - rp.left) : null };
  });
})()`;
const S43_FOTKY_HOTOVE = `Array.prototype.every.call(document.querySelectorAll("#summary-box img.lcd-opc-foto"), function (i) { return i.complete; })`;
function s43BezRamika(polozky, kde) {
  over(polozky.length > 0, kde + ": v súhrne nie sú položky");
  // rozpis pod názvom je pri každej položke (set aj vzorkovník), pilulka len keď sa niečo skrýva (A1)
  polozky.forEach((p, i) => over(!p.foto && !p.trieda && p.nazovOdLava <= 1 && p.detailOdLava !== null && p.detailOdLava <= 1 && (p.zobOdLava === null || p.zobOdLava <= 1),
    kde + ", položka " + (i + 1) + ": fotka sa nenačítala, ale ostal rámik alebo medzera vľavo: " + JSON.stringify(p)));
  // bez fotky je názov zbalený (-webkit-box): veľké začiatočné písmeno musí byť v texte (Safari, doladenie 2)
  polozky.forEach((p, i) => over(p.nazov && p.nazov.charAt(0) === p.nazov.charAt(0).toLocaleUpperCase("sk"),
    kde + ", položka " + (i + 1) + ": názov nezačína veľkým písmenom: „" + p.nazov + "“"));
}

SCENARE.S43 = {
  popis: "Doladenie 2: fotka v súhrne sa nenačíta (404) -> bez prázdneho rámika, názov, rozpis a pilulka vľavo bez medzery, aj po prekreslení súhrnu (zmena platby)",
  async fn(J) {
    const T = S42_TEXTY[J.web];
    const kosik = J.web === "sk" ? "set" : "vzorkovnik";
    const s = await J.novaStranka({ kosik, skript: s42Seed(kosik) });
    let n = 0;
    await naKrok2(s, { query: kosik === "set" ? "&lcddoplnok=0" : "", pred: async (k) => { n = await k.ev(S43_ZLA_FOTKA); } });
    over(n > 0, "košík: mapa fotiek bez položiek");
    await s.cakaj(S43_FOTKY_HOTOVE, { ms: 8000, popis: "pokus o načítanie fotky skončil" });
    await pauza(300);
    over(s.p.zaznam.chybaCdn.some((x) => /lcd-opc-test-404\.jpg$/.test(x)), "fotka sa ani nežiadala (test by nič neoveril): " + s.p.zaznam.chybaCdn.join(", "));
    s43BezRamika(await s.ev(S43_POLOZKY), J.sirka + " " + kosik + " po chybe fotky");
    // prekreslenie súhrnu Shoptetom (zmena platby): nová položka bez našich prvkov, zlá fotka sa znova nevloží
    await zvolPlatbu(s, T.dobierka);
    await s.cakaj(`/Dobierk|Dobírk/i.test((document.querySelector('#summary-box [data-testid="recapPaymentMethod"]') || {}).textContent || "") && !document.querySelector("#summary-box.lcd-opc-prepocet")`,
      { ms: 15000, popis: "súhrn s dobierkou" });
    await s.cakaj(S43_FOTKY_HOTOVE, { ms: 8000, popis: "fotky po prekreslení" });
    await pauza(300);
    s43BezRamika(await s.ev(S43_POLOZKY), J.sirka + " " + kosik + " po zmene platby");
    await s.zavri();
    return { info: kosik + ": 404 fotky -> bez rámika, názov od ľava, aj po zmene platby" };
  },
};

// ------------------------------------------------------------------ S44 CLS kroku 2 (doladenie 2, 30. 10. 2026)
// Predtým ~0,5 na PC: po data.json sa prepol dizajn A (karty, polia, súhrn) a po kroku 1 pribudla sekcia, kroky a zbalený
// súhrn — obsah poskočil. Meria sa PerformanceObserver layout-shift od začiatku dokumentu kroku 2.
/** Pozorovateľ posunov pred každou stránkou (skript pred stránkou). */
const S44_POZOR = `(function () { window.__lcdCls = []; try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) {
  window.__lcdCls.push({ t: e.startTime, v: e.value, z: (e.sources || []).slice(0, 3).map(function (s) { var n = s.node;
    return n && n.nodeType === 1 ? (n.id ? "#" + n.id : n.tagName.toLowerCase() + (typeof n.className === "string" && n.className ? "." + n.className.trim().split(/\\s+/)[0] : "")) : "?"; }) }); }); })
  .observe({ type: "layout-shift", buffered: true }); } catch (e) {} })();`;
/** CLS = najväčšie okno relácie (posuny najviac 1 s od seba, okno najviac 5 s; ako web-vitals). Rátajú sa VŠETKY posuny:
 *  ťuk na „Pokračovať“ v košíku má v teste hadRecentInput aj pre krok 2 (prechod trvá < 500 ms, naživo dlhšie) — s filtrom
 *  by telefón ukazoval 0, hoci obsah skáče. */
const S44_CLS = `(function () { var L = window.__lcdCls || [], okno = 0, max = 0, zac = -1e9, pos = -1e9;
  L.forEach(function (e) { if (e.t - pos > 1000 || e.t - zac > 5000) { okno = 0; zac = e.t; } okno += e.v; pos = e.t; if (okno > max) max = okno; });
  return { cls: Math.round(max * 1000) / 1000, pocet: L.length, caka: document.documentElement.classList.contains("lcd-opc-caka"),
    posuny: L.filter(function (e) { return e.v >= 0.005; }).slice(0, 4).map(function (e) { return Math.round(e.t) + " ms " + Math.round(e.v * 1000) / 1000 + " " + e.z.join(" | "); }) }; })()`;
const S44_LIMIT = 0.1;
/** Pomalá sieť: data.json 0,6 s (prvé vykreslenie je určite skôr ako dizajn A) a krok 1 na pozadí 1,5 s. */
const S44_POMALY = { dataJsonMs: 600, krok1Ms: 1500 };

SCENARE.S44 = {
  popis: "Doladenie 2: CLS kroku 2 < 0,1 na PC 1366 a 1920 aj na telefóne 390 — bežne aj pri pomalom data.json (0,6 s) a kroku 1 (1,5 s)",
  async fn(J) {
    const kosik = J.web === "sk" ? "set" : "vzorkovnik";
    const okna = J.sirka >= 992 ? [[1366, 768], [1920, 1080]] : [[J.sirka, 844]];
    const casti = [];
    for (const [w, h] of okna) for (const pomaly of [false, true]) {
      const s = await J.novaStranka({ kosik, sirka: w, vyska: h, skript: s42Seed(kosik) + S44_POZOR, scenar: pomaly ? S44_POMALY : undefined });
      await naKrok2(s, { query: kosik === "set" ? "&lcddoplnok=0" : "" });
      await pauza(1200); // neskoré posuny (fotky, písmo, lišta, pozorovateľ súhrnu)
      const c = await s.ev(S44_CLS);
      const kde = w + "×" + h + " " + kosik + (pomaly ? " (pomalá sieť)" : "");
      over(!c.caka, kde + ": formulár ostal skrytý (html.lcd-opc-caka)");
      over(c.cls < S44_LIMIT, kde + ": CLS kroku 2 je " + c.cls + " (≥ " + S44_LIMIT + "), posuny: " + c.posuny.join("; "));
      casti.push(w + (pomaly ? " pomaly" : "") + " " + c.cls);
      await s.zavri();
    }
    return { info: "CLS " + casti.join(", ") };
  },
};

// ------------------------------------------------------------------ S45 súhlasy B1 (Michal 30. 10. 2026, náhľad 3)
// Dva súhlasy Shoptetu v bočnom paneli = dve biele dlaždice 10 px od seba. Dlaždica je natívny štítok súhlasu (klik
// kamkoľvek prepne políčko), text dáva Shoptet a nemení sa. Povinný = input required / js-validate-required (to isté, čo
// opc/kontrola.js), nie poradie: zlatý rám 2 px a štítok „Povinné“ na hornej hrane vpravo; zaškrtnutý = zelený rám,
// svetlozelené pozadie (štítok zelený). Chyba (Objednať bez súhlasu) = červený rám dlaždice + text Shoptetu pod ňou, mimo
// štítku; po zaškrtnutí preč. Fokus z klávesnice viditeľný.
const S45_FARBY = { biela: "rgb(255, 255, 255)", zlata: "rgb(196, 155, 49)", pole: "rgb(211, 196, 154)", zelena: "rgb(46, 125, 50)",
  zelenaBg: "rgb(243, 249, 243)", cervena: "rgb(192, 57, 43)" };
/** Súhlasy zo zachyteného kroku 2 (text Shoptetu, odkazy, potomkovia štítka, povinnosť). */
function s45ZFixture(web) {
  const d = new JSDOM(readFileSync(join(FIXTURES, web, "krok2.html"), "utf8")).window.document;
  return Array.prototype.map.call(d.querySelectorAll(".consents"), (w) => {
    const i = w.querySelector("input[type=checkbox]"), l = w.querySelector('label[for="' + i.id + '"]');
    return { id: i.id, text: l.textContent.replace(/\s+/g, " ").trim(), odkazy: l.querySelectorAll("a").length, deti: l.children.length,
      povinny: !!(i.hasAttribute("required") || i.classList.contains("js-validate-required")) };
  });
}
/** Meranie dlaždíc (po posune súhlasov do stredu okna, aby elementFromPoint videl štítok). */
const S45_MER = `(function () {
  var px = function (v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; };
  return Array.prototype.map.call(document.querySelectorAll("#checkoutSidebar .consents"), function (w) {
    var i = w.querySelector("input[type=checkbox]"), l = i ? w.querySelector('label[for="' + i.id + '"]') : null;
    if (!l) return { id: i ? i.id : null, bezStitka: true };
    var r = l.getBoundingClientRect(), c = getComputedStyle(l), b = getComputedStyle(l, "::before"), a = getComputedStyle(l, "::after"), cw = getComputedStyle(w);
    var o = { id: i.id, povinny: !!(i.required || i.classList.contains("js-validate-required")), zaskrtnute: i.checked, trieda: w.classList.contains("lcd-opc-chyba-pole"),
      r: { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }, sirkaObalu: w.getBoundingClientRect().width,
      disp: c.display, ramy: [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].join(" "),
      farbaRamu: c.borderTopColor, radius: c.borderTopLeftRadius, pozadie: c.backgroundColor, kurzor: c.cursor,
      obrysObalu: cw.outlineStyle === "none" || px(cw.outlineWidth) === 0 ? "" : cw.outlineStyle + " " + cw.outlineWidth + " " + cw.outlineColor,
      stvorec: { w: px(b.width), h: px(b.height), l: px(b.left), t: px(b.top), farba: b.backgroundColor, fajka: /^url\\(/.test(b.backgroundImage) },
      text: l.textContent.replace(/\\s+/g, " ").trim(), odkazy: l.querySelectorAll("a").length, deti: l.children.length,
      fokus: { vid: document.activeElement === i && i.matches(":focus-visible"),
        obrys: (c.outlineStyle !== "none" && px(c.outlineWidth) >= 2) || (b.outlineStyle !== "none" && px(b.outlineWidth) >= 2) },
      stitok: null, chyba: null };
    var rg = document.createRange(); rg.selectNodeContents(l);
    var rr = Array.prototype.filter.call(rg.getClientRects(), function (x) { return x.width > 0 && x.height > 0; });
    o.textHore = rr.length ? Math.min.apply(null, rr.map(function (x) { return x.top; })) : null;
    o.textVlavo = rr.length ? Math.min.apply(null, rr.map(function (x) { return x.left; })) : null;
    if (a.content && a.content !== "none" && a.content !== "normal" && a.display !== "none") {
      var vys = px(a.height) + px(a.paddingTop) + px(a.paddingBottom) + px(a.borderTopWidth) + px(a.borderBottomWidth);
      var sir = px(a.width) + px(a.paddingLeft) + px(a.paddingRight) + px(a.borderLeftWidth) + px(a.borderRightWidth);
      var t = r.top + px(c.borderTopWidth) + px(a.top), p = r.right - px(c.borderRightWidth) - px(a.right);
      var s = { obsah: a.content, t: t, b: t + vys, l: p - sir, r: p, pismo: px(a.fontSize), velke: a.textTransform, farba: a.color, pozadie: a.backgroundColor };
      // nezakrytý a neorezaný: stred, oba konce a horný / dolný okraj pilulky patria štítku (pseudo-prvok = jeho štítok)
      var sy = (s.t + s.b) / 2, sx = (s.l + s.r) / 2, pol = vys / 2;
      s.vidno = [[sx, sy], [s.l + pol, sy], [s.r - pol, sy], [sx, s.t + 2], [sx, s.b - 2]].every(function (q) { return document.elementFromPoint(q[0], q[1]) === l; });
      o.stitok = s;
    }
    var m = w.querySelector(".js-validator-msg");
    if (m && m.getBoundingClientRect().height > 0) {
      var mr = m.getBoundingClientRect(), mc = getComputedStyle(m);
      o.chyba = { text: m.textContent.trim(), t: mr.top, b: mr.bottom, l: mr.left, r: mr.right, farba: mc.color, pismo: px(mc.fontSize) };
    }
    return o;
  });
})()`;
/** Súhlasy do stredu okna, počká na ustálenú polohu (PC: karta nad súhrnom po posune poskočí), potom meranie. */
async function s45Meraj(s) {
  const hore = (posun) => s.ev(`(function () { var w = document.querySelector("#checkoutSidebar .consents"); if (!w) return null;
    if (${posun ? "true" : "false"}) w.scrollIntoView({ block: "center", behavior: "instant" }); return Math.round(w.getBoundingClientRect().top); })()`);
  let t = await hore(true);
  for (let n = 0; n < 12; n++) {
    await pauza(150);
    const u = await hore(false);
    if (u === t) break;
    t = u;
  }
  return s.ev(S45_MER);
}
/**
 * Skutočný klik (telefón ťuk) na dlaždicu súhlasu: "volne" = miesto bez textu vpravo, "text" = slovo mimo odkazu,
 * "stvorec" = stred políčka. Klik nesmie trafiť odkaz na VOP (otvoril by novú kartu).
 */
async function s45Klik(s, id, kam) {
  // po posune sa poloha ustáli (PC: karta „Celkom | Objednať“ nad súhrnom sa zapne / vypne a panel poskočí) — ako s.klikni
  const bod = (posun) => s.ev(`(function () {
    var i = document.getElementById(${JSON.stringify(id)}), l = document.querySelector('label[for="' + i.id + '"]'), kam = ${JSON.stringify(kam)};
    if (${posun ? "true" : "false"}) l.scrollIntoView({ block: "center", behavior: "instant" });
    var r = l.getBoundingClientRect(), c = getComputedStyle(l), k = [];
    if (kam === "volne") k = [[r.right - 6, r.top + r.height / 2], [r.right - 6, r.bottom - 6], [r.left + r.width / 2, r.bottom - 4]];
    else if (kam === "stvorec") {
      var bb = getComputedStyle(l, "::before");
      k = [[r.left + parseFloat(c.borderLeftWidth) + parseFloat(bb.left) + parseFloat(bb.width) / 2, r.top + parseFloat(c.borderTopWidth) + parseFloat(bb.top) + parseFloat(bb.height) / 2]];
    } else {
      var tw = document.createTreeWalker(l, NodeFilter.SHOW_TEXT), n;
      while ((n = tw.nextNode())) {
        if (!n.textContent.trim() || (n.parentNode.closest && n.parentNode.closest("a"))) continue;
        var rg = document.createRange(), z = n.textContent.search(/\\S/); rg.setStart(n, z); rg.setEnd(n, z + 1);
        var q = rg.getClientRects()[0]; if (q) { k.push([q.left + q.width / 2, q.top + q.height / 2]); break; }
      }
    }
    for (var j = 0; j < k.length; j++) {
      var h = document.elementFromPoint(k[j][0], k[j][1]);
      if (h && (h === l || l.contains(h)) && !(h.closest && h.closest("a"))) return { x: Math.round(k[j][0]), y: Math.round(k[j][1]) };
    }
    return { chyba: "na dlaždici " + i.id + " nie je miesto „" + kam + "“ mimo odkazu: " + JSON.stringify(k) };
  })()`);
  let b = await bod(true);
  for (let n = 0; n < 12; n++) {
    await pauza(150);
    const c = await bod(false);
    const stabilne = !b.chyba && !c.chyba && c.x === b.x && c.y === b.y;
    b = c;
    if (stabilne) break;
  }
  over(!b.chyba, b.chyba);
  if (s.mobil) await s.k.tuk(b.x, b.y); else await s.k.klik(b.x, b.y);
  await pauza(300);
}
/** Tab (Shift+Tab: modifiers 8) cez CDP. */
async function s45Tab(s, modifiers = 0) {
  const z = { key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers };
  await s.k.posli("Input.dispatchKeyEvent", { type: "rawKeyDown", ...z });
  await s.k.posli("Input.dispatchKeyEvent", { type: "keyUp", ...z });
  await pauza(150);
}

SCENARE.S45 = {
  popis: "Súhlasy B1 (náhľad 3): dve biele dlaždice 10 px od seba, povinný (required, nie poradie) zlatý rám 2 px + štítok „Povinné“ na hornej hrane vpravo, nepovinný bez štítku; klik kamkoľvek na dlaždicu prepne políčko (fajka), zaškrtnuté = zelené; chyba = červený rám dlaždice + text pod ňou mimo štítku, po zaškrtnutí preč; fokus z klávesnice; text Shoptetu bez zmeny",
  async fn(J) {
    const F = S45_FARBY;
    const s = await J.novaStranka();
    await naKrok2(s);
    const kde = J.web + " " + J.sirka;
    const ocak = s45ZFixture(J.web);
    const casti = [];
    let d = await s45Meraj(s);
    over(d.length === 2 && ocak.length === 2 && d.every((x) => !x.bezStitka), kde + ": čakal som 2 súhlasy so štítkom v bočnom paneli: " + JSON.stringify(d.map((x) => x.id)));
    // text Shoptetu bez zmeny (aj odkazy, žiadny vložený prvok)
    d.forEach((x, n) => over(x.id === ocak[n].id && x.text === ocak[n].text && x.odkazy === ocak[n].odkazy && x.deti === ocak[n].deti,
      kde + ": súhlas " + x.id + " sa zmenil oproti Shoptetu: " + JSON.stringify({ je: [x.text, x.odkazy, x.deti], bol: [ocak[n].text, ocak[n].odkazy, ocak[n].deti] })));
    const iP = d.findIndex((x) => x.povinny), iN = d.findIndex((x) => !x.povinny);
    over(iP >= 0 && iN >= 0 && d.filter((x) => x.povinny).length === 1 && d[iP].id === ocak.find((o) => o.povinny).id, kde + ": povinný súhlas nie je práve jeden (required): " + JSON.stringify(d.map((x) => [x.id, x.povinny])));
    const P = d[iP], N = d[iN], idP = P.id, idN = N.id;
    // dlaždice: biele, rádius 12, ≥ 56 px, na celú šírku panela, políčko 26 px vľavo hore, text vedľa neho
    for (const x of d) {
      const m = kde + ": dlaždica " + x.id;
      over(x.disp === "block" && x.radius === "12px" && x.pozadie === F.biela && x.r.h >= 56 && Math.abs(x.r.w - x.sirkaObalu) <= 1,
        m + " nie je biela dlaždica (rádius 12 px, výška ≥ 56 px, na celú šírku): " + JSON.stringify({ disp: x.disp, radius: x.radius, pozadie: x.pozadie, r: x.r, obal: x.sirkaObalu }));
      over(x.stvorec.w === 26 && x.stvorec.h === 26 && x.stvorec.l >= 10 && x.stvorec.l <= 16 && x.stvorec.t >= 10 && x.stvorec.t <= 16,
        m + ": zaškrtávacie políčko nie je 26 px vľavo hore (~14 px od okraja): " + JSON.stringify(x.stvorec));
      over(x.textVlavo >= x.r.l + x.stvorec.l + x.stvorec.w + 8, m + ": text leží na políčku / tesne pri ňom: " + JSON.stringify({ text: x.textVlavo, r: x.r }));
      over(x.kurzor === "pointer" && !x.zaskrtnute, m + ": kurzor " + x.kurzor + " / predzaškrtnuté " + x.zaskrtnute);
    }
    const medzera = Math.round(d[1].r.t - d[0].r.b);
    over(medzera >= 8 && medzera <= 12, kde + ": medzera medzi dlaždicami " + medzera + " px (čakal som 10)");
    over(P.ramy === "2px 2px 2px 2px" && P.farbaRamu === F.zlata, kde + ": povinný súhlas nemá zlatý rám 2 px: " + P.ramy + " " + P.farbaRamu);
    over(N.ramy === "1px 1px 1px 1px" && N.farbaRamu === F.pole, kde + ": nepovinný súhlas nemá rám 1 px #d3c49a: " + N.ramy + " " + N.farbaRamu);
    // štítok „Povinné“: zlatá pilulka, biele veľké písmo ≥ 12 px, na hornej hrane vpravo, neprekrýva text, nie je orezaný
    const st = P.stitok;
    // štítok len vizuálny: generovaný obsah s alternatívnym textom "" (content: "Povinné" / ""), aby ho čítačka nepripojila
    // k textu súhlasu Shoptetu („… údajov POVINNÉ“) — povinnosť ohlási z atribútu required (revízia 30. 10. 2026, UX-3)
    over(st && st.obsah === '"Povinné" / ""' && st.velke === "uppercase" && st.pismo >= 12 && st.farba === F.biela && st.pozadie === F.zlata,
      kde + ": povinný súhlas nemá štítok „Povinné“ (zlatý, biele písmo ≥ 12 px, veľké písmená, pre čítačku bez textu): " + JSON.stringify(st));
    // Chrome: prístupné meno políčka = text Shoptetu bez „Povinné“ (CDP; iný prehliadač / adaptér bez CDP preskočí)
    const menoAx = await (async () => {
      try {
        const doc = await s.k.posli("DOM.getDocument", { depth: 0 });
        const q = await s.k.posli("DOM.querySelector", { nodeId: doc.root.nodeId, selector: "#" + P.id });
        const t = await s.k.posli("Accessibility.getPartialAXTree", { nodeId: q.nodeId, fetchRelatives: false });
        const n = (t.nodes || []).find((x) => x.role && x.role.value === "checkbox");
        return n && n.name ? String(n.name.value) : null;
      } catch (e) { return undefined; }
    })();
    if (menoAx !== undefined) over(menoAx && menoAx.length > 20 && !/povinn/i.test(menoAx),
      kde + ": prístupné meno povinného súhlasu obsahuje štítok „Povinné“ (čítačka ho pripojí k textu Shoptetu): „" + menoAx + "“");
    over(st.t < P.r.t && st.b > P.r.t, kde + ": štítok nie je na hornej hrane dlaždice: " + JSON.stringify({ st, r: P.r }));
    over(st.l > P.r.l + P.r.w / 2 && st.r <= P.r.r - 4, kde + ": štítok nie je vpravo vnútri dlaždice: " + JSON.stringify({ st, r: P.r }));
    over(st.b <= P.textHore, kde + ": štítok prekrýva text súhlasu: " + JSON.stringify({ stitokDole: st.b, textHore: P.textHore }));
    over(st.vidno, kde + ": štítok je zakrytý alebo orezaný: " + JSON.stringify(st));
    over(!N.stitok, kde + ": nepovinný súhlas má štítok: " + JSON.stringify(N.stitok));
    casti.push("dlaždice " + Math.round(P.r.h) + "/" + Math.round(N.r.h) + " px, medzera " + medzera + ", štítok " + Math.round(st.b - st.t) + " px" + (menoAx ? ", meno bez „Povinné“" : ""));
    // miesto pre štítok podľa povinnosti, nie poradia (revízia 30. 10. 2026, N6): keby Shoptet dal nepovinný súhlas pred
    // povinný, štítok nad povinnou dlaždicou nesmie ležať tesne na predošlej (rovnaká rezerva ako pri prvom, ≥ 8 px voľna)
    const prehod = `(function () { var w = document.querySelectorAll("#checkoutSidebar .consents");
      if (w.length !== 2 || w[0].parentNode !== w[1].parentNode) return false; w[0].parentNode.insertBefore(w[1], w[0]); return true; })()`;
    over(await s.ev(prehod), kde + ": súhlasy sa nedajú prehodiť (nie sú vedľa seba)");
    const o = await s45Meraj(s);
    over(await s.ev(prehod), kde + ": súhlasy sa nedajú vrátiť do pôvodného poradia");
    const oP = o.find((q) => q.id === idP), oN = o.find((q) => q.id === idN);
    over(o[0].id === idN && oP.stitok && oP.stitok.vidno && oP.stitok.t - oN.r.b >= 8 && oP.r.t - oN.r.b >= 20,
      kde + ": opačné poradie súhlasov — štítok „Povinné“ leží tesne na nepovinnej dlaždici: " + JSON.stringify({ stitokHore: oP.stitok && oP.stitok.t, dlazdicaHore: oP.r.t, predoslaDole: oN.r.b }));
    casti.push("opačné poradie: štítok " + Math.round(oP.stitok.t - oN.r.b) + " px od predošlej");
    // klik kamkoľvek na dlaždicu prepne políčko: zelený rám, svetlozelené pozadie, fajka (aj štítok zelený)
    for (const [id, nazov] of [[idP, "povinný"], [idN, "nepovinný"]]) {
      for (const [kam, ma] of [["volne", true], ["text", false], ["stvorec", true], ["stvorec", false]]) {
        await s45Klik(s, id, kam);
        const y = (await s45Meraj(s)).find((q) => q.id === id);
        const m = kde + ": " + nazov + " súhlas po kliku „" + kam + "“";
        over(y.zaskrtnute === ma, m + " je " + (y.zaskrtnute ? "zaškrtnutý" : "nezaškrtnutý") + " (čakal som opak)");
        if (ma) {
          over(y.farbaRamu === F.zelena && y.pozadie === F.zelenaBg, m + ": dlaždica nie je zelená: " + y.farbaRamu + " / " + y.pozadie);
          over(y.stvorec.fajka && y.stvorec.farba === F.zelena, m + ": políčko bez zelenej fajky: " + JSON.stringify(y.stvorec));
          if (y.povinny) over(y.stitok && y.stitok.pozadie === F.zelena && y.stitok.vidno && y.ramy === "2px 2px 2px 2px", m + ": štítok nie je zelený / rám nie je 2 px: " + JSON.stringify([y.ramy, y.stitok]));
        } else {
          over(y.pozadie === F.biela && y.farbaRamu === (y.povinny ? F.zlata : F.pole) && !y.stvorec.fajka, m + ": dlaždica sa nevrátila do pôvodného vzhľadu: " + JSON.stringify([y.farbaRamu, y.pozadie, y.stvorec]));
        }
      }
    }
    casti.push("klik voľné miesto / text / políčko prepína");
    // chyba: všetko vyplnené, súhlas nie -> Objednať -> červený rám dlaždice, text Shoptetu pod ňou (mimo štítku)
    await vyplnUdaje(s);
    await klikObjednat(s);
    await pauza(1000);
    d = await s45Meraj(s);
    const E = d.find((q) => q.id === idP), E2 = d.find((q) => q.id === idN);
    over(E.trieda && !E2.trieda, kde + ": po „Objednať“ bez súhlasu nie je označený práve povinný súhlas: " + JSON.stringify(d.map((x) => [x.id, x.trieda])));
    over(E.farbaRamu === F.cervena && E.ramy === "2px 2px 2px 2px", kde + ": chyba: dlaždica nemá červený rám 2 px: " + E.ramy + " " + E.farbaRamu);
    over(!E.obrysObalu, kde + ": chyba: okolo súhlasu je ešte druhý rám (obrys obalu): " + E.obrysObalu);
    over(E.chyba && E.chyba.text && E.chyba.pismo >= 14 && /^rgb\((1[4-9]\d|2\d\d), ([0-8]?\d), ([0-8]?\d)\)$/.test(E.chyba.farba), kde + ": chyba: chýba červený text pod dlaždicou: " + JSON.stringify(E.chyba));
    over(E.chyba.t >= E.r.b, kde + ": text chyby nie je pod dlaždicou: " + JSON.stringify({ chyba: E.chyba, r: E.r }));
    over(E.stitok && E.stitok.vidno && E.stitok.b <= E.textHore && !(E.chyba.t < E.stitok.b && E.chyba.b > E.stitok.t && E.chyba.l < E.stitok.r && E.chyba.r > E.stitok.l),
      kde + ": chyba: štítok „Povinné“ je zakrytý alebo sa prekrýva s textom: " + JSON.stringify({ stitok: E.stitok, chyba: E.chyba }));
    over(E.stitok.pozadie === F.cervena, kde + ": chyba: štítok „Povinné“ nie je červený: " + E.stitok.pozadie);
    over(E2.r.t - E.chyba.b >= 8, kde + ": text chyby je nalepený na druhú dlaždicu: " + Math.round(E2.r.t - E.chyba.b) + " px");
    casti.push("chyba: červený rám + „" + E.chyba.text + "“");
    // zaškrtnutie (klik na dlaždicu) -> chyba preč, dlaždica zelená
    await s45Klik(s, idP, "volne");
    const Z = (await s45Meraj(s)).find((q) => q.id === idP);
    over(Z.zaskrtnute && !Z.trieda && !Z.chyba && Z.farbaRamu === F.zelena && Z.pozadie === F.zelenaBg && !Z.obrysObalu,
      kde + ": po zaškrtnutí ostala chyba alebo dlaždica nie je zelená: " + JSON.stringify({ trieda: Z.trieda, chyba: Z.chyba, ram: Z.farbaRamu, pozadie: Z.pozadie, obrys: Z.obrysObalu }));
    // fokus z klávesnice: z políčka Tab na odkaz v texte a Shift+Tab späť = :focus-visible a viditeľný obrys
    await s.ev(`document.getElementById(${JSON.stringify(idP)}).focus(), 1`);
    await s45Tab(s);
    await s45Tab(s, 8);
    const K = (await s45Meraj(s)).find((q) => q.id === idP);
    over(K.fokus.vid && K.fokus.obrys, kde + ": fokus z klávesnice na povinnom súhlase nie je vidno: " + JSON.stringify(K.fokus) + " aktívny " + (await s.ev("document.activeElement && (document.activeElement.id || document.activeElement.tagName)")));
    casti.push("fokus z klávesnice");
    await s.zavri();
    return { info: casti.join("; ") };
  },
};
