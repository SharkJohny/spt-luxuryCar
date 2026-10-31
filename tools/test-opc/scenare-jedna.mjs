// Scenáre jednej stránky pokladne (Michal 31. 10. 2026 „Sprav to takto“, náhľad nahlad-7): S60–S69, len SK so setom
// (fixtúra sk-set; stránky produktov pre ponuku = tools/test-kosik-*.fixture.json cez podvrh, scenár jedna: true).
//   S60 košík s kódom -> košík sa preskočí (location.replace, Step1Validate 1×) -> krok 2: karta „Váš košík“ (1) pred
//       Kontaktom (2), Adresa 3, Doprava 4, Platba 5; kroky ani zbalený súhrn nevidno; ponuka druhá vrstva, rohož, box
//       so zlatým „Vybrať“; žiadny vstup karty nie je vo formulári objednávky
//   S61 „+“ pri produkte -> setCartItemAmount (počet 2) -> bez načítania stránky (Michal 31. 10. „A“): karta 2 ks, súhrn
//       zo servera (Step1Validate + krok 1), meno a e-mail ostanú (košík so stavom: podvrh kosikStav)
//   S62 „Vybrať“ pri rohoži -> addCartItem s rohožou; košík zo servera bez nového riadku (podvrh) -> nič sa nemaže,
//       hláška v karte, stránka ostáva (fail-closed ako v košíku)
//   S63 box: „Pridať k setu“ sivé s „Vyberte veľkosť boxu“, kým chýba veľkosť; 2 boxy M + L -> cena v tlačidle; lišta dole
//       skrytá, kým je výber otvorený; objednávka (podvrh) neobsahuje nič z karty
//   S64 (revízia 31. 10.) počas odosielania objednávky (pomalá kontrola krokom 1) je karta zamknutá: „+“ ani „Vybrať“
//       nič nepošle, objednávka odíde s pôvodným košíkom
//   S65 (revízia 31. 10.) obsah košíka zo servera zlyhá -> karta preč, karty 1–4 ako 30. 10., „Upraviť košík“ = /kosik/ a
//       košík sa v tejto karte prehliadača potom nepreskakuje (ponuka je v košíku)
//   S66 „Vybrať“ pri rohoži, košík so stavom -> výmena prejde, bez načítania stránky: set s rohožou (cena +129), krížik pri
//       rohoži, ponuka bez rohože, „✓“ hláška, záznam výmeny preč
//   S67 po zmene košíka iná cena dopravy v kroku 1 -> záloha ako predtým: cez košík znova sem, údaje sa vrátia
//   S68 „Odobrať“ jedinú položku -> prázdny košík Shoptetu (/kosik/), súhrn sa neprepočítava
//   S69 „Objednať“ počas pridávania rohože -> hláška „čakám“, objednávka odíde až po výmene a prepočte súhrnu
import { KOSIK, KROK2, ZAKAZNIK, cakajOpc, vyplnUdaje, suhlas, objednaj, overTeloObjednavky, step1Xhr, over, pauza, OPC } from "./krok2-pomoc.mjs";
import { klikObjednat } from "./scenare-spravanie.mjs";

const SCENAR = { jedna: true };
const KARTA = "#lcd-opc-kosik";

/** Košík s kódom -> (preskočený) -> krok 2 s kartou košíka a ponukou. */
async function naJednuStranku(s, { ponuka = 3 } = {}) {
  await s.k.chod(s.W.base + KOSIK + OPC);
  await s.cakajNaStranku(KROK2, "in-krok-2");
  await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2");
  await s.cakaj(`document.querySelectorAll("${KARTA} .lcd-vyb__riadok").length === ${ponuka}`, { ms: 15000, popis: "ponuka k setu v karte košíka" });
  await s.odmietniCookies();
}

const STAV = `(function () {
  var k = document.querySelector("${KARTA}"), f = document.getElementById("order-form");
  var vidno = function (e) { return !!e && e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== "none"; };
  return {
    cisla: [].map.call(document.querySelectorAll("#order-form h2[data-lcd-opc-cislo]"), function (h) { return h.getAttribute("data-lcd-opc-cislo") + " " + h.textContent.trim(); })
      .filter(function (t, i, a) { return a.indexOf(t) === i; }),
    kroky: vidno(document.querySelector("ol.cart-header")), zbalene: vidno(document.querySelector(".lcd-opc-zbalene")),
    kartaPredKontaktom: !!k && k.nextElementSibling === document.querySelector("fieldset.co-contact-information"),
    ponuka: [].map.call(k.querySelectorAll(".lcd-vyb__riadok"), function (r) { return r.getAttribute("data-doplnok") + ":" + r.querySelector(".lcd-vyb__btn").textContent.trim(); }),
    vstupyVoFormulari: [].filter.call(f.elements, function (e) { return k.contains(e); }).length,
    polozky: [].map.call(k.querySelectorAll(".lcd-opc-kk__polozka"), function (p) { return p.querySelector(".lcd-opc-kk__nazov").textContent + " | " + p.querySelector(".lcd-opc-kk__cena").textContent; }),
  };
})()`;

/** Stopa pred zmenou košíka: značka v okne (načítanie stránky ju zmaže), počty Step1Validate a krokov 1, dokumenty. */
async function stopa(s) {
  await s.ev(`(window.__lcdTestZnacka = 1)`);
  return { step1: step1Xhr(s).length, krok1: krok1Fetch(s), dokumenty: s.dokumenty().length, celkom: await s.ev(CELKOM) };
}
const CELKOM = `(function () { var c = document.querySelector('#summary-box [data-testid="recapFullPrice"]'); return c ? c.textContent.replace(/\\s+/g, " ").trim() : null; })()`;
const krok1Fetch = (s) => s.p.zaznam.www.filter((z) => z.typ !== "Document" && /^\/objednavka\/krok-1\/?$/.test(z.cesta)).length;
/**
 * Zmena košíka prebehla BEZ načítania stránky: karta odomknutá, lcd-dop-bezi preč, Step1Validate +1 a súhrn z kroku 1
 * (fetch), žiadny nový dokument, značka v okne ostala, údaje formulára sa neukladali. -> stav karty a polí
 */
async function poZmene(s, pred) {
  await s.cakaj(`!document.documentElement.classList.contains("lcd-dop-bezi") && !document.querySelector("${KARTA} .lcd-opc-kk__obsah[aria-busy]")
    && /^krok2-potvrdene$/.test((window.__lcdOpc || {}).stav || "") && window.__lcdTestZnacka === 1`, { ms: 20000, popis: "zmena košíka dobehla" });
  await pauza(400);
  const st = await s.ev(`(function () { var k = document.querySelector("${KARTA}");
    return { znacka: window.__lcdTestZnacka === 1, ulozene: sessionStorage.getItem("lcdOpcFormular"), stav: k.querySelector(".lcd-opc-kk__stav").textContent,
      zamknute: [].filter.call(k.querySelectorAll("button"), function (b) { return b.disabled && !b.hasAttribute("data-lcd-opc-min") && !/Vyberte/.test(b.textContent); }).length,
      polozky: [].map.call(k.querySelectorAll(".lcd-opc-kk__polozka"), function (p) { return p.querySelector(".lcd-opc-kk__nazov").textContent + " | " + p.querySelector(".lcd-opc-kk__cena").textContent; }),
      pocty: [].map.call(k.querySelectorAll(".lcd-opc-kk__pocet output"), function (o) { return o.textContent; }),
      meno: document.getElementById("billFullName").value, email: document.getElementById("email").value,
      prepocet: document.getElementById("summary-box").classList.contains("lcd-opc-prepocet"),
      lista: (document.querySelector(".lcd-opc-lista__celkom") || {}).textContent || null };
  })()`);
  st.celkom = await s.ev(CELKOM);
  // súhrn je zo servera po zmene (podvrh: suma kroku 1 podľa košíka so stavom), nie starý ani lokálny prepočet
  over(st.celkom && st.celkom === s.p.celkomServera() && st.celkom !== pred.celkom, "súhrn po zmene: " + JSON.stringify([pred.celkom, st.celkom, s.p.celkomServera()]));
  over(!st.lista || st.lista.replace(/\s+/g, " ").trim() === st.celkom, "lišta po zmene: " + st.lista + " ≠ " + st.celkom);
  over(st.znacka && s.dokumenty().length === pred.dokumenty, "stránka sa načítala znova: " + s.dokumenty().slice(pred.dokumenty).join(", "));
  over(step1Xhr(s).length === pred.step1 + 1, "po zmene košíka Step1Validate " + (step1Xhr(s).length - pred.step1) + "× (čakal som 1)");
  st.krok1 = krok1Fetch(s) - pred.krok1;
  over(st.krok1 >= 1, "súhrn z kroku 1 sa po zmene nenačítal");
  over(st.ulozene === null, "údaje formulára sa ukladali (záloha cez košík): " + st.ulozene);
  over(!st.zamknute && !st.prepocet && st.stav === "", "karta / súhrn ostali zamknuté: " + JSON.stringify([st.zamknute, st.prepocet, st.stav]));
  return st;
}

export const SCENARE = {
  S60: {
    len: "sk",
    popis: "Jedna stránka: košík sa preskočí, karta „Váš košík“ (1) s ponukou Vybrať pred Kontaktom (2), Adresa 3, Doprava 4, Platba 5; vstupy karty mimo formulára",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      await naJednuStranku(s);
      const st = await s.ev(STAV);
      over(st.cisla.join("|") === "1 Váš košík|2 Kontakt|3 Adresa|4 Doprava|5 Platba", "čísla kariet: " + st.cisla.join(" | "));
      over(st.kartaPredKontaktom, "karta košíka nie je hneď pred Kontaktom");
      over(!st.kroky && !st.zbalene, "kroky / zbalený súhrn je vidno (" + st.kroky + ", " + st.zbalene + ")");
      over(st.ponuka.join(",") === "vrstva2:Vybrať,rohoz:Vybrať,box:Vybrať", "ponuka: " + st.ponuka.join(", "));
      over(st.vstupyVoFormulari === 0, "vstupy karty vo formulári objednávky: " + st.vstupyVoFormulari);
      over(st.polozky.length === 1 && /^Luxusné autokoberce/.test(st.polozky[0]) && /€269$/.test(st.polozky[0]), "položka: " + st.polozky.join(" / "));
      over(step1Xhr(s).length === 1, "Step1Validate XHR " + step1Xhr(s).length + "× (čakal som 1 z košíka)");
      over(!s.p.zaznam.kosikAkcie.length, "úprava košíka bez kliku: " + JSON.stringify(s.p.zaznam.kosikAkcie));
      const nav = s.dokumenty();
      over(nav.length === 2 && /GET \/kosik\//.test(nav[0]) && /GET \/objednavka\/krok-2\//.test(nav[1]), "navigácie: " + nav.join(", "));
      return { info: st.ponuka.length + " doplnky, " + nav.length + " navigácie" };
    },
  },
  S61: {
    len: "sk",
    popis: "Jedna stránka: „+“ pri produkte -> setCartItemAmount 2 -> bez načítania stránky: karta 2 ks, súhrn zo servera, údaje ostanú",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ kosikStav: true }, SCENAR) });
      await naJednuStranku(s);
      const z = ZAKAZNIK.sk;
      await s.pis("#billFullName", z.meno);
      await s.pis("#email", z.email);
      await pauza(300);
      const pred = await stopa(s);
      await s.klikni(`${KARTA} .lcd-opc-kk__krok:not([disabled])`, { popis: "+ pri produkte" });
      const st = await poZmene(s, pred);
      const a = s.p.zaznam.kosikAkcie;
      over(a.length === 1 && a[0].akcia === "setCartItemAmount" && a[0].pole.amount === "2" && a[0].pole.itemId === "6ae27536ae482", "úprava košíka: " + JSON.stringify(a));
      over(st.polozky.length === 1 && /\| €538$/.test(st.polozky[0]) && st.pocty.join() === "2", "karta po zmene: " + JSON.stringify([st.polozky, st.pocty]));
      over(st.meno === z.meno && st.email === z.email, "údaje po zmene košíka: " + JSON.stringify([st.meno, st.email]));
      return { info: "2 ks na mieste, Step1Validate +1, krok 1 +" + st.krok1 };
    },
  },
  S62: {
    len: "sk",
    popis: "Jedna stránka: „Vybrať“ pri rohoži -> addCartItem s rohožou; košík bez nového riadku -> nič sa nemaže, hláška v karte, stránka ostáva",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      await naJednuStranku(s);
      const nav = s.dokumenty().length;
      await s.klikni(`${KARTA} [data-lcd-vyb="rohoz"]`, { popis: "Vybrať (rohož)" });
      await s.cakaj(`(function () { var e = document.querySelector("${KARTA} .lcd-vyb__stav"); return e && /nepodarilo/.test(e.textContent) ? e.textContent : ""; })()`, { ms: 15000, popis: "hláška pri rohoži" });
      await pauza(500);
      const a = s.p.zaznam.kosikAkcie;
      over(a.length === 1 && a[0].akcia === "addCartItem" && a[0].pole["surchargeParameterValueId[88]"] === "595", "úprava košíka: " + JSON.stringify(a.map((x) => x.akcia + " " + x.pole["surchargeParameterValueId[88]"])));
      over(s.dokumenty().length === nav, "stránka sa obnovila: " + s.dokumenty().slice(nav).join(", "));
      const st = await s.ev(`[document.querySelector('${KARTA} [data-lcd-vyb="rohoz"]').disabled, document.documentElement.classList.contains("lcd-dop-bezi")]`);
      over(!st[0] && !st[1], "po chybe ostala karta zamknutá: " + JSON.stringify(st));
      return { info: "addCartItem 1×, bez mazania" };
    },
  },
  S63: {
    len: "sk",
    popis: "Jedna stránka: box — „Pridať k setu“ sivé, kým chýba veľkosť; 2 boxy M + L -> cena; lišta skrytá pri výbere; objednávka bez polí karty",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      await naJednuStranku(s);
      await s.klikni(`${KARTA} [data-lcd-vyb="box"]`, { popis: "Vybrať (box)" });
      await pauza(300);
      const tl = () => s.ev(`(function () { var b = document.querySelector('[data-lcd-vyb-pridat="box"]'); var l = document.querySelector(".lcd-opc-lista");
        return { text: b.textContent, sive: b.disabled, lista: !!l && getComputedStyle(l).display !== "none", trieda: document.documentElement.classList.contains("lcd-vyb-otvorene") }; })()`);
      let t = await tl();
      over(t.sive && t.text === "Vyberte veľkosť boxu", "tlačidlo bez veľkosti: " + JSON.stringify(t));
      over(t.trieda && (!s.mobil || !t.lista), "lišta pri otvorenom výbere: " + JSON.stringify(t));
      await s.klikni('[data-lcd-vyb-pocet="2"]', { popis: "2 boxy" });
      await s.klikni('[data-lcd-vyb-velkost="M"]', { popis: "1. box M" });
      t = await tl();
      over(t.sive && t.text === "Vyberte veľkosť 2. boxu", "tlačidlo bez 2. boxu: " + JSON.stringify(t));
      await s.klikni('[data-lcd-vyb-velkost2="L"]', { popis: "2. box L" });
      t = await tl();
      over(!t.sive && /^Pridať k setu · \+\d+\s€$/.test(t.text.replace(/ /g, " ")), "tlačidlo M + L: " + JSON.stringify(t));
      await s.klikni(`${KARTA} [data-lcd-vyb="box"]`, { popis: "Zavrieť (box)" });
      over(!(await s.ev(`document.documentElement.classList.contains("lcd-vyb-otvorene")`)), "po zatvorení ostala trieda lcd-vyb-otvorene");
      await vyplnUdaje(s);
      await suhlas(s);
      const z = (await objednaj(s))[0];
      const m = overTeloObjednavky(s, z);
      const cudzie = [...m.keys()].filter((k) => /lcd-(vyb|dop)/.test(k));
      over(!cudzie.length, "objednávka obsahuje polia karty: " + cudzie.join(", "));
      over(!s.p.zaznam.kosikAkcie.length, "úprava košíka bez pridania: " + JSON.stringify(s.p.zaznam.kosikAkcie));
      return { step2: true, info: t.text.replace(/ /g, " ") };
    },
  },
  S64: {
    len: "sk",
    popis: "Jedna stránka: počas odosielania objednávky je karta košíka zamknutá — „+“ ani „Vybrať“ nič nepošlú, objednávka s pôvodným košíkom",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      await naJednuStranku(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.scenar.krok1Ms = 2500; // kontrola pred odoslaním (GET krok 1 na pozadí) trvá dlhšie
      await klikObjednat(s);
      await s.cakaj(`!!(window.__lcdOpc && window.__lcdOpc.krok2 && window.__lcdOpc.krok2.odosielanie())`, { ms: 5000, popis: "odosielanie beží" });
      const st = await s.ev(`(function () { var k = document.getElementById("lcd-opc-kosik");
        var plus = k.querySelector(".lcd-opc-kk__krok:not([data-lcd-opc-min])"), vyb = k.querySelector('[data-lcd-vyb="rohoz"]');
        var r = [plus.disabled, vyb.disabled]; plus.disabled = false; vyb.disabled = false; plus.click(); vyb.click(); return r; })()`);
      over(st[0] && st[1], "počas odosielania nie je karta zamknutá (disabled +, Vybrať): " + JSON.stringify(st));
      const z = (await objednaj(s, { klik: false, ms: 12000 }))[0];
      overTeloObjednavky(s, z);
      over(!s.p.zaznam.kosikAkcie.length, "počas odosielania odišla úprava košíka: " + JSON.stringify(s.p.zaznam.kosikAkcie.map((a) => a.akcia)));
      return { step2: true, info: "karta zamknutá, objednávka bez zmeny košíka" };
    },
  },
  S65: {
    len: "sk",
    popis: "Jedna stránka: obsah košíka zlyhá -> karta preč, karty 1–4, Upraviť košík = /kosik/, košík sa potom nepreskakuje",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ obsahKosika: "500" }, SCENAR) });
      await s.k.chod(s.W.base + KOSIK + OPC);
      await s.cakajNaStranku(KROK2, "in-krok-2");
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2");
      await s.cakaj(`!document.getElementById("lcd-opc-kosik")`, { ms: 8000, popis: "karta preč" });
      await pauza(300);
      const st = await s.ev(`({ cisla: [].map.call(document.querySelectorAll("#order-form h2[data-lcd-opc-cislo]"), function (h) { return h.getAttribute("data-lcd-opc-cislo"); }).join(""),
        upravit: (document.querySelector(".lcd-opc-upravit") || {}).getAttribute ? document.querySelector(".lcd-opc-upravit").getAttribute("href") : null,
        kroky: !!document.querySelector("ol.cart-header") && getComputedStyle(document.querySelector("ol.cart-header")).display !== "none",
        flag: sessionStorage.getItem("lcdOpcBezKarty") })`);
      over(st.cisla === "1234", "čísla kariet po zlyhaní karty: " + st.cisla);
      over(st.upravit === "/kosik/", "Upraviť košík: " + st.upravit);
      over(st.kroky, "kroky navrchu nie sú vidno (karta zlyhala)");
      over(!!st.flag, "košík sa bude ďalej preskakovať (bez lcdOpcBezKarty)");
      await s.chod(KOSIK, { popis: "košík po zlyhaní karty" });
      await pauza(800);
      const k = await s.ev(`({ cesta: location.pathname, skryte: document.documentElement.classList.contains("lcd-opc-prechadzam"), ponuka: document.documentElement.getAttribute("data-lcd-doplnok") })`);
      over(k.cesta === "/kosik/" && !k.skryte, "košík sa preskočil / je skrytý: " + JSON.stringify(k));
      return { info: "karty " + st.cisla + ", košík ostal (ponuka " + k.ponuka + ")" };
    },
  },
  S66: {
    len: "sk",
    popis: "Jedna stránka: „Vybrať“ pri rohoži -> pridanie + zmazanie pôvodného setu, bez načítania stránky: rohož s krížikom, ponuka bez rohože, ✓ hláška",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ kosikStav: true }, SCENAR) });
      await naJednuStranku(s);
      await s.pis("#email", ZAKAZNIK.sk.email);
      const pred = await stopa(s);
      await s.klikni(`${KARTA} [data-lcd-vyb="rohoz"]`, { popis: "Vybrať (rohož)" });
      const st = await poZmene(s, pred);
      await s.cakaj(`document.querySelectorAll("${KARTA} .lcd-vyb__riadok").length === 2`, { ms: 15000, popis: "ponuka po pridaní rohože" });
      const k = await s.ev(`(function () { var k = document.querySelector("${KARTA}");
        return { ponuka: [].map.call(k.querySelectorAll(".lcd-vyb__riadok"), function (r) { return r.getAttribute("data-doplnok"); }),
          kriziky: [].map.call(k.querySelectorAll(".lcd-dop-x"), function (b) { return b.getAttribute("data-lcd-dop-odober"); }),
          hlaska: (k.querySelector(".lcd-opc-kk__hlaska") || {}).textContent || "", zaznam: localStorage.getItem("lcdDoplnokVymena"),
          otvorene: document.documentElement.classList.contains("lcd-vyb-otvorene") };
      })()`);
      const a = s.p.zaznam.kosikAkcie.map((x) => x.akcia);
      over(a.join() === "addCartItem,deleteCartItem", "úpravy košíka: " + a.join(", "));
      over(st.polozky.length === 1 && /\| €398$/.test(st.polozky[0]), "karta po pridaní rohože: " + st.polozky.join(" / "));
      over(k.ponuka.join() === "vrstva2,box", "ponuka po pridaní rohože: " + k.ponuka.join(", "));
      over(k.kriziky.join() === "rohoz", "krížik pri rohoži: " + k.kriziky.join(", "));
      over(/^✓ /.test(k.hlaska), "hláška po pridaní: " + k.hlaska);
      over(k.zaznam === null && !k.otvorene, "záznam výmeny / otvorený výber ostal: " + JSON.stringify([k.zaznam, k.otvorene]));
      over(st.email === ZAKAZNIK.sk.email, "e-mail po pridaní: " + st.email);
      return { info: k.hlaska.slice(0, 60) };
    },
  },
  S69: {
    len: "sk",
    popis: "Jedna stránka: „Objednať“ počas pridávania rohože -> odloží sa („čakám“), po výmene a prepočte súhrnu odíde s novým košíkom",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ kosikStav: true, kosikMs: 600 }, SCENAR) });
      await naJednuStranku(s);
      await vyplnUdaje(s);
      await suhlas(s);
      const pred = await stopa(s);
      await s.klikni(`${KARTA} [data-lcd-vyb="rohoz"]`, { popis: "Vybrať (rohož)" });
      await s.cakaj(`document.documentElement.classList.contains("lcd-dop-bezi")`, { ms: 5000, popis: "výmena beží" });
      await klikObjednat(s);
      await pauza(150);
      const cakam = await s.ev(`(function () { var c = document.querySelector(".lcd-opc-cakam"); return c && !c.hidden ? c.textContent : ""; })()`);
      const z = (await objednaj(s, { klik: false, ms: 20000 }))[0];
      overTeloObjednavky(s, z);
      const a = s.p.zaznam.kosikAkcie;
      over(a.map((x) => x.akcia).join() === "addCartItem,deleteCartItem", "úpravy košíka: " + a.map((x) => x.akcia).join(", "));
      over(a.every((x) => x.cas < z.cas), "objednávka odišla pred dokončením výmeny");
      const k1 = s.p.zaznam.www.filter((x) => x.typ !== "Document" && /^\/objednavka\/krok-1\/?$/.test(x.cesta) && x.cas > a[a.length - 1].cas);
      over(k1.length >= 1 && k1[0].cas < z.cas, "objednávka odišla pred prepočtom súhrnu");
      over(/košík/i.test(cakam), "po kliku na Objednať počas výmeny: " + JSON.stringify(cakam) + " (čakal som hlášku o košíku)");
      over(s.dokumenty().slice(pred.dokumenty).every((d) => !/GET \/kosik\//.test(d)), "stránka išla cez košík: " + s.dokumenty().slice(pred.dokumenty).join(", "));
      return { step2: true, info: "odložené: " + cakam.slice(0, 40) };
    },
  },
  S67: {
    len: "sk",
    popis: "Jedna stránka: po zmene košíka iná cena dopravy -> záloha: cez košík znova sem (celé načítanie), meno a e-mail sa vrátia",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ kosikStav: true }, SCENAR) });
      await naJednuStranku(s);
      const z = ZAKAZNIK.sk;
      await s.pis("#billFullName", z.meno);
      await s.pis("#email", z.email);
      await pauza(300);
      const nav = s.dokumenty().length;
      s.p.scenar.krok1Uprav = (h) => h.replace(/data-shipping-price-wv="5"/g, 'data-shipping-price-wv="7"');
      await s.klikni(`${KARTA} .lcd-opc-kk__krok:not([disabled])`, { popis: "+ pri produkte" });
      const koniec = Date.now() + 20000;
      while (Date.now() < koniec && s.dokumenty().length < nav + 2) await pauza(100);
      await s.cakajNaStranku(KROK2, "in-krok-2");
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 po zálohe");
      await s.cakaj(`!!document.querySelector("${KARTA} .lcd-opc-kk__polozka")`, { popis: "karta po zálohe" });
      const d = s.dokumenty().slice(nav);
      over(d.length === 2 && /GET \/kosik\//.test(d[0]) && /GET \/objednavka\/krok-2\//.test(d[1]), "záloha cez košík: " + d.join(", "));
      const polia = await s.ev(`[document.getElementById("billFullName").value, document.getElementById("email").value, sessionStorage.getItem("lcdOpcFormular"),
        [].map.call(document.querySelectorAll("${KARTA} .lcd-opc-kk__pocet output"), function (o) { return o.textContent; }).join()]`);
      over(polia[0] === z.meno && polia[1] === z.email, "údaje po zálohe: " + JSON.stringify(polia.slice(0, 2)));
      over(polia[2] === null, "záznam údajov ostal v sessionStorage");
      over(polia[3] === "2", "počet po zálohe: " + polia[3]);
      return { info: "záloha cez košík, údaje vrátené" };
    },
  },
  S68: {
    len: "sk",
    popis: "Jedna stránka: „Odobrať“ jedinú položku -> úprava košíka a prázdny košík Shoptetu (bez prepočtu súhrnu)",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ kosikStav: true }, SCENAR) });
      await naJednuStranku(s);
      const nav = s.dokumenty().length, step1 = step1Xhr(s).length;
      await s.klikni(`${KARTA} .lcd-opc-kk__odobrat`, { popis: "Odobrať" });
      const koniec = Date.now() + 15000;
      while (Date.now() < koniec && s.dokumenty().length < nav + 1) await pauza(100);
      await pauza(800);
      const d = s.dokumenty().slice(nav);
      const a = s.p.zaznam.kosikAkcie.map((x) => x.akcia);
      over(a.length === 1 && /^(deleteCartItem|setCartItemAmount)$/.test(a[0]), "úpravy košíka: " + a.join(", "));
      over(d.length >= 1 && /GET \/kosik\//.test(d[0]), "po odobratí: " + d.join(", "));
      // (podvrh vráti /kosik/ vždy s pôvodným košíkom, takže z neho ide preskok ďalej — rátajú sa len požiadavky pred ním)
      const kosikCas = (s.p.zaznam.www.find((z, i) => z.typ === "Document" && /^\/kosik\//.test(z.cesta) && s.p.zaznam.www.filter((x) => x.typ === "Document").indexOf(z) >= nav) || {}).cas;
      const predKosikom = step1Xhr(s).filter((x) => x.cas < kosikCas).length;
      over(predKosikom === step1, "po odobratí poslednej položky Step1Validate " + (predKosikom - step1) + "× pred košíkom");
      return { info: d.join(", ") };
    },
  },
};
