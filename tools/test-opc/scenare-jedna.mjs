// Scenáre jednej stránky pokladne (Michal 31. 10. 2026 „Sprav to takto“, náhľad nahlad-7): S60–S63, len SK so setom
// (fixtúra sk-set; stránky produktov pre ponuku = tools/test-kosik-*.fixture.json cez podvrh, scenár jedna: true).
//   S60 košík s kódom -> košík sa preskočí (location.replace, Step1Validate 1×) -> krok 2: karta „Váš košík“ (1) pred
//       Kontaktom (2), Adresa 3, Doprava 4, Platba 5; kroky ani zbalený súhrn nevidno; ponuka druhá vrstva, rohož, box
//       so zlatým „Vybrať“; žiadny vstup karty nie je vo formulári objednávky
//   S61 „+“ pri produkte -> setCartItemAmount (počet 2) -> cez košík znova rovno sem; meno a e-mail sa vrátia do polí
//   S62 „Vybrať“ pri rohoži -> addCartItem s rohožou; košík zo servera bez nového riadku (podvrh) -> nič sa nemaže,
//       hláška v karte, stránka ostáva (fail-closed ako v košíku)
//   S63 box: „Pridať k setu“ sivé s „Vyberte veľkosť boxu“, kým chýba veľkosť; 2 boxy M + L -> cena v tlačidle; lišta dole
//       skrytá, kým je výber otvorený; objednávka (podvrh) neobsahuje nič z karty
//   S64 (revízia 31. 10.) počas odosielania objednávky (pomalá kontrola krokom 1) je karta zamknutá: „+“ ani „Vybrať“
//       nič nepošle, objednávka odíde s pôvodným košíkom
//   S65 (revízia 31. 10.) obsah košíka zo servera zlyhá -> karta preč, karty 1–4 ako 30. 10., „Upraviť košík“ = /kosik/ a
//       košík sa v tejto karte prehliadača potom nepreskakuje (ponuka je v košíku)
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
    popis: "Jedna stránka: „+“ pri produkte -> setCartItemAmount 2 -> cez košík späť sem, meno a e-mail ostanú vyplnené",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      await naJednuStranku(s);
      const z = ZAKAZNIK.sk;
      await s.pis("#billFullName", z.meno);
      await s.pis("#email", z.email);
      await pauza(300);
      const step1 = step1Xhr(s).length;
      await s.klikni(`${KARTA} .lcd-opc-kk__krok:not([disabled])`, { popis: "+ pri produkte" });
      const koniec = Date.now() + 15000;
      while (Date.now() < koniec && step1Xhr(s).length <= step1) await pauza(100);
      await s.cakajNaStranku(KROK2, "in-krok-2");
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 po zmene");
      await s.cakaj(`!!document.querySelector("${KARTA} .lcd-opc-kk__polozka")`, { popis: "karta po zmene" });
      const a = s.p.zaznam.kosikAkcie;
      over(a.length === 1 && a[0].akcia === "setCartItemAmount" && a[0].pole.amount === "2" && a[0].pole.itemId === "6ae27536ae482", "úprava košíka: " + JSON.stringify(a));
      over(step1Xhr(s).length === step1 + 1, "po zmene košíka Step1Validate " + (step1Xhr(s).length - step1) + "× (čakal som 1)");
      const polia = await s.ev(`[document.getElementById("billFullName").value, document.getElementById("email").value, sessionStorage.getItem("lcdOpcFormular")]`);
      over(polia[0] === z.meno && polia[1] === z.email, "údaje po zmene košíka: " + JSON.stringify(polia.slice(0, 2)));
      over(polia[2] === null, "záznam údajov ostal v sessionStorage");
      return { info: "údaje vrátené: " + polia.slice(0, 2).join(", ") };
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
};
