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
//   S70 (Michal 1. 11. 2026, iPhone: „keď idem do košíka, rôzne to preblikáva“) z webu „Do košíka“ -> obrazovka
//       „Načítavam…“, rovno krok 2 (stránka košíka sa nenačíta), Step1Validate 1×, karta hotová
//   S71 z webu s prázdnym košíkom (Shoptet odznak nekreslí) -> obyčajný odkaz na /kosik/
//   S76 z webu klik na ikonu košíka v hlavičke (toggle-window) -> rovno krok 2; hlavička sa počas skoku nedá kliknúť
//   S77 (Michal 1. 11. 2026) „Zmeniť štát“ -> výber krajín z kroku 1 priamo v pokladni; iná krajina -> Step1ChooseDelivery,
//       Step1Validate, krok 2 nanovo (nie starý krok 1), meno ostane; „Chcem sa registrovať“ nevidno
//   S78 zmena krajiny zlyhá (500) -> klasický krok 1 ako doteraz
//   S79 2 boxy M + L pridané (košík so stavom): pri boxoch len krížik v krúžku (bez „Odobrať“), krížiky v dvoch riadkoch
//       sa neprekrývajú (Michal 1. 11., PC)
//   S72 z webu, krok 1 na pozadí zlyhá (500) -> /kosik/ ako doteraz (tam záchrana na krok 1)
//   S73 konfigurátor po „Do košíka“ (window.__lcdDoKosika) -> rovno krok 2 bez košíka
//   S74 bez kódu (?opc=0) -> odkaz na /kosik/ natívne, window.__lcdDoKosika nie je
//   S82 skok z webu meranie nestratí: view_cart, begin_checkout a Meta z preskočených stránok po 1×, po F5 nič
//   S84 krok 1 presmeruje späť na košík (nedostupná položka): žiadna slučka; S85 data.json neprichádza: košík skrytý max 3 s; S86 zastavené telo kroku 1
//   S83 nácvik spustenia pre všetkých, len s LCD_OPC_SPUSTENE=1 (bez kódu rovno do pokladne, ?opc=0, vypínač v data.json)
//   S75 košík počas preskoku: obsah košíka nevidno celý (opacity 0) — ani − + a fotka (Michal 1. 11. 2026, iPhone)
//   S90 (Michal 2. 11. 2026) kamión v karte: rekapitulácia ako pri autách — hneď Vozidlo a „Typ a farba materiálu“,
//       ostatné po „Zobraziť viac“ (aj tapacír); s tapacírom žiadna ponuka
//   S91 kamión TIR bez tapacíru: ponuka „Tapacír dverí“ +119 € -> pridanie + zmazanie pôvodného riadku bez načítania
//       stránky (hodnoty ako konfigurátor „Rovnaké ako koberce“), ✓ hláška, ponuka preč, súhrn kamióna s blokom dverí
//       = súhrn z konfigurátora, poznámka objednávky s ním
//   S95 (Michal 2. 11. 2026: „Prázdny košík je stále rovnaký“) prázdny košík (fixtures <web>-prazdny = skutočné HTML
//       Shoptetu 2. 11.): od 22:39 pre všetkých — bez kódu aj s ?opc=0 nový blok (initOpc ho nechá, OPC nebeží), s kódom
//       nový blok (texty a odkazy z menu webu, telefón a e-mail zo Shoptetu, bez vyhľadávania — 23:40), krok 1 sa
//       nesťahuje, bez chyby v dataLayer, nič nepreteká 320–1920 px, písmo ≥ 14 px, žiadne zakázané slová; „opc“: false
//       blok nechá; vypínač data.json „prazdny_kosik“: false -> stránka Shoptetu späť (s kódom aj bez); bez bundla starý
//       obsah Shoptetu skrytý (nepreblikne) a po 3 s sa ukáže sám
import { FLAG_OPC } from "./pomocnik.mjs";
import { KOSIK, KROK2, ZAKAZNIK, cakajOpc, vyplnUdaje, suhlas, objednaj, overTeloObjednavky, step1Xhr, over, pauza, OPC } from "./krok2-pomoc.mjs";
import { klikObjednat } from "./scenare-spravanie.mjs";
import { KAMION } from "./scenare-kosiky.mjs";
import { buildTruckOrderSummary } from "../../assets/js/truck-konfigurator/order-summary.mjs";
import { PRAZDNY_TEXTY } from "../../assets/js/opc/prazdnyKosik.js";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
    kartaVpravo: !!k && !!document.getElementById("checkoutSidebar") && k.nextElementSibling === document.querySelector("#checkoutSidebar > .cart-content"),
    suhrnProdukty: [].filter.call(document.querySelectorAll("#summary-box .cart-item[data-micro-identifier]"), vidno).length,
    nadpisSuhrnu: vidno(document.querySelector("#summary-box > h2")), upravit: vidno(document.querySelector(".lcd-opc-upravit")),
    zob: [].map.call(k.querySelectorAll(".lcd-opc-zob"), function (z) { return z.textContent.trim(); }),
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


/** Kód v prehliadači (prvý prechod pokladňou), potom stránka webu mimo košíka s rozbehnutým skokom (opc/skok.js). */
async function naWeb(s, { sKodom = true } = {}) {
  if (sKodom) await naJednuStranku(s);
  else { await s.k.chod(s.W.base + KOSIK + "?opc=0"); await pauza(1200); }
  await s.k.chod(s.W.base + "/lcd-test-web/");
  await s.cakaj(`document.body.classList.contains("in-index") && !!document.getElementById("lcd-test-do-kosika")`, { popis: "stránka webu" });
  if (sKodom) await cakajOpc(s, /^web$/, "web");
  else await pauza(1500);
  return { nav: s.dokumenty().length, step1: step1Xhr(s).length };
}

/** Po kliku: nové navigácie (najviac kým nepríde krok 2 alebo uplynie limit). */
async function poKliku(s, pred, { cakajKrok2 = true } = {}) {
  if (cakajKrok2) {
    await s.cakajNaStranku(KROK2, "in-krok-2");
    await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2");
  } else {
    const koniec = Date.now() + 15000;
    while (Date.now() < koniec && s.dokumenty().length < pred.nav + 1) await pauza(100);
    await pauza(1500);
  }
  return s.dokumenty().slice(pred.nav);
}

export const SCENARE = {
  S60: {
    len: "sk",
    popis: "Jedna stránka: košík sa preskočí, karta „Váš košík“ (1) s ponukou Pridať pred Kontaktom (2), Adresa 3, Doprava 4, Platba 5; vstupy karty mimo formulára",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      await naJednuStranku(s);
      const st = await s.ev(STAV);
      // Michal 31. 10. 2026 večer (náhľad E): PC — vľavo len údaje (Kontakt 1 … Platba 4), košík vpravo nad súhrnom;
      // telefón — košík navrchu (1), Kontakt 2 … Platba 5; produkt len v karte, súhrn len s cenami
      if (J.sirka >= 992) {
        over(st.cisla.join("|") === "1 Kontakt|2 Adresa|3 Doprava|4 Platba|1 Váš košík", "PC čísla kariet: " + st.cisla.join(" | "));
        over(st.kartaVpravo && !st.nadpisSuhrnu, "PC: karta košíka nie je vpravo nad súhrnom / je vidno nadpis súhrnu: " + JSON.stringify([st.kartaVpravo, st.nadpisSuhrnu]));
      } else {
        over(st.cisla.join("|") === "1 Váš košík|2 Kontakt|3 Adresa|4 Doprava|5 Platba", "čísla kariet: " + st.cisla.join(" | "));
        over(st.kartaPredKontaktom && st.nadpisSuhrnu, "karta košíka nie je hneď pred Kontaktom / chýba nadpis súhrnu");
      }
      over(st.suhrnProdukty === 0 && !st.upravit, "produkt je aj v súhrne / je vidno Upraviť košík: " + JSON.stringify([st.suhrnProdukty, st.upravit]));
      over(st.zob.join() === "Zobraziť viac", "pilulka podrobností v karte: " + JSON.stringify(st.zob));
      over(!st.kroky && !st.zbalene, "kroky / zbalený súhrn je vidno (" + st.kroky + ", " + st.zbalene + ")");
      // Michal 1. 11. 2026: rohož prvá, „Pridať“ (nie „Vybrať“); štítok a video overuje S81
      over(st.ponuka.join(",") === "rohoz:Pridať,vrstva2:Pridať,box:Pridať", "ponuka: " + st.ponuka.join(", "));
      over(st.vstupyVoFormulari === 0, "vstupy karty vo formulári objednávky: " + st.vstupyVoFormulari);
      over(st.polozky.length === 1 && /^Luxusné autokoberce/.test(st.polozky[0]) && /269\s€$/.test(st.polozky[0]), "položka: " + st.polozky.join(" / "));
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
      over(st.polozky.length === 1 && /\| 538\s€$/.test(st.polozky[0]) && st.pocty.join() === "2", "karta po zmene: " + JSON.stringify([st.polozky, st.pocty]));
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
        flag: sessionStorage.getItem("lcdOpcBezKarty"),
        suhrnProdukty: [].filter.call(document.querySelectorAll("#summary-box .cart-item[data-micro-identifier]"), function (e) { return e.getBoundingClientRect().height > 0; }).length })`);
      over(st.cisla === "1234", "čísla kariet po zlyhaní karty: " + st.cisla);
      over(st.upravit === "/kosik/", "Upraviť košík: " + st.upravit);
      over(st.kroky, "kroky navrchu nie sú vidno (karta zlyhala)");
      over(!!st.flag, "košík sa bude ďalej preskakovať (bez lcdOpcBezKarty)");
      over(st.suhrnProdukty >= 1, "po zlyhaní karty nie je produkt ani v súhrne");
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
          krizikVidno: [].every.call(k.querySelectorAll(".lcd-dop-x"), function (b) { return b.getBoundingClientRect().height > 0; }),
          hlaska: (k.querySelector(".lcd-opc-kk__hlaska") || {}).textContent || "", zaznam: localStorage.getItem("lcdDoplnokVymena"),
          otvorene: document.documentElement.classList.contains("lcd-vyb-otvorene") };
      })()`);
      const a = s.p.zaznam.kosikAkcie.map((x) => x.akcia);
      over(a.join() === "addCartItem,deleteCartItem", "úpravy košíka: " + a.join(", "));
      over(st.polozky.length === 1 && /\| 398\s€$/.test(st.polozky[0]), "karta po pridaní rohože: " + st.polozky.join(" / "));
      over(k.ponuka.join() === "vrstva2,box", "ponuka po pridaní rohože: " + k.ponuka.join(", "));
      over(k.kriziky.join() === "rohoz" && k.krizikVidno, "krížik pri rohoži (vidno bez „Zobraziť viac“): " + JSON.stringify([k.kriziky, k.krizikVidno]));
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
  S70: {
    len: "sk",
    popis: "Jedna stránka z webu: „Do košíka“ -> „Načítavam…“ a rovno krok 2 (bez stránky košíka), Step1Validate 1×, karta hotová",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ krok1Ms: 900 }, SCENAR) });
      const pred = await naWeb(s);
      await s.klikni("#lcd-test-do-kosika", { popis: "Do košíka" });
      await pauza(250);
      const obrazovka = await s.ev(`(function () { var d = document.getElementById("lcd-opc-skok"); if (!d) return null;
        var r = d.getBoundingClientRect(); return { text: d.textContent, trieda: document.documentElement.classList.contains("lcd-opc-skok"),
        cela: r.left <= 0 && r.top <= 0 && r.width >= innerWidth - 20 && r.bottom >= innerHeight - 1, farba: getComputedStyle(d).backgroundImage }; })()`).catch(() => null);
      const d = await poKliku(s, pred);
      over(obrazovka && obrazovka.text === "Načítavam…" && obrazovka.trieda && obrazovka.cela && /rgb\(247, 245, 239\)/.test(obrazovka.farba), "obrazovka počas skoku: " + JSON.stringify(obrazovka));
      over(d.length === 1 && /GET \/objednavka\/krok-2\//.test(d[0]), "navigácie po kliku (čakal som len krok 2): " + d.join(", "));
      over(step1Xhr(s).length === pred.step1 + 1, "Step1Validate po kliku " + (step1Xhr(s).length - pred.step1) + "×");
      await s.cakaj(`document.querySelectorAll("${KARTA} .lcd-vyb__riadok").length === 3`, { ms: 15000, popis: "ponuka k setu v karte" });
      const st = await s.ev(STAV);
      over(st.polozky.length === 1 && st.suhrnProdukty === 0, "karta / súhrn po skoku: " + JSON.stringify([st.polozky, st.suhrnProdukty]));
      return { info: d.join(", ") };
    },
  },
  S71: {
    len: "sk",
    popis: "Jedna stránka z webu: prázdny košík (Shoptet bez odznaku) -> obyčajný odkaz na /kosik/",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ webPocet: "" }, SCENAR) });
      const pred = await naWeb(s);
      await s.klikni("#lcd-test-do-kosika", { popis: "Do košíka" });
      const d = await poKliku(s, pred, { cakajKrok2: false });
      over(d.length >= 1 && /GET \/kosik\//.test(d[0]), "po kliku s prázdnym košíkom: " + d.join(", "));
      return { info: d.join(", ") };
    },
  },
  S72: {
    len: "sk",
    popis: "Jedna stránka z webu: krok 1 na pozadí zlyhá (500, stránka kroku 1 ide) -> /kosik/ ako doteraz",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      const pred = await naWeb(s);
      s.p.scenar.suhrn = "500"; // krok 1 na pozadí 500, navigácia na krok 1 normálne
      await s.klikni("#lcd-test-do-kosika", { popis: "Do košíka" });
      const d = await poKliku(s, pred, { cakajKrok2: false });
      over(d.length >= 1 && /GET \/kosik\//.test(d[0]), "po zlyhaní kroku 1: " + d.join(", "));
      over(step1Xhr(s).length === pred.step1, "Step1Validate napriek zlyhaniu kroku 1: " + (step1Xhr(s).length - pred.step1) + "×");
      return { info: d.join(", ") };
    },
  },
  S73: {
    len: "sk",
    popis: "Jedna stránka z webu: konfigurátor po „Do košíka“ (window.__lcdDoKosika) -> rovno krok 2",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      const pred = await naWeb(s);
      const prevzate = await s.ev(`typeof window.__lcdDoKosika === "function" && window.__lcdDoKosika()`);
      const d = await poKliku(s, pred);
      over(prevzate === true, "__lcdDoKosika: " + prevzate);
      over(d.length === 1 && /GET \/objednavka\/krok-2\//.test(d[0]), "navigácie (čakal som len krok 2): " + d.join(", "));
      return { info: d.join(", ") };
    },
  },
  S74: {
    len: "sk",
    popis: "Bez kódu (?opc=0): odkaz z webu na /kosik/ natívne, __lcdDoKosika nie je",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      const pred = await naWeb(s, { sKodom: false });
      const st = await s.ev(`({ fn: typeof window.__lcdDoKosika, opc: !!window.__lcdOpc, skok: !!document.getElementById("lcd-opc-skok") })`);
      await s.klikni("#lcd-test-do-kosika", { popis: "Do košíka" });
      const d = await poKliku(s, pred, { cakajKrok2: false });
      over(st.fn === "undefined" && !st.opc && !st.skok, "bez kódu je skok zapnutý: " + JSON.stringify(st));
      over(d.length >= 1 && /GET \/kosik\//.test(d[0]), "bez kódu po kliku: " + d.join(", "));
      over(step1Xhr(s).length === pred.step1, "bez kódu Step1Validate " + (step1Xhr(s).length - pred.step1) + "×");
      return { info: d.join(", ") };
    },
  },
  S75: {
    len: "sk",
    popis: "Jedna stránka: košík počas preskoku do pokladne — obsah nevidno celý (opacity 0), ani − + a fotka, len „Načítavam…“",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ krok1Ms: 2500 }, SCENAR) });
      await s.k.chod(s.W.base + KOSIK + OPC);
      await s.cakaj(`document.documentElement.classList.contains("lcd-opc-prechadzam")`, { popis: "košík v prechode" });
      const st = await s.ev(`(function () { var cw = document.getElementById("content-wrapper"), cs = getComputedStyle(cw);
        var znaky = [].filter.call(cw.querySelectorAll(".increase__sign,.decrease__sign"), function (e) { return getComputedStyle(e).visibility === "visible"; }).length;
        return { opacity: cs.opacity, visibility: cs.visibility, znakyVisible: znaky, text: getComputedStyle(document.body, "::after").content }; })()`);
      over(st.opacity === "0" && st.visibility === "hidden", "obsah košíka počas prechodu: " + JSON.stringify(st));
      over(/Načítavam/.test(st.text), "text počas prechodu: " + st.text);
      await s.cakajNaStranku(KROK2, "in-krok-2");
      return { info: "opacity " + st.opacity + ", znaky s visibility:visible " + st.znakyVisible + " (pod opacity 0 nevidno)" };
    },
  },
  S76: {
    len: "sk",
    popis: "Jedna stránka z webu: ikona košíka v hlavičke (toggle-window) -> rovno krok 2; počas skoku je hlavička zakrytá",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ krok1Ms: 900 }, SCENAR) });
      const pred = await naWeb(s);
      // ikonu mimo hlavičky Shoptetu skryje CSS šablóny -> klik ako z kódu (rovnaká cesta cez zachytávanie na window)
      await s.ev(`document.getElementById("lcd-test-ikona").click(), 1`);
      await pauza(250);
      // hlavička (hore) je počas skoku zakrytá obrazovkou -> klik inam nejde
      const navrchu = await s.ev(`(function () { var h = document.elementFromPoint(20, 10); return h ? (h.id || h.tagName) : null; })()`).catch(() => null);
      const d = await poKliku(s, pred);
      over(navrchu === "lcd-opc-skok", "navrchu stránky počas skoku je: " + navrchu);
      over(d.length === 1 && /GET \/objednavka\/krok-2\//.test(d[0]), "navigácie po kliku na ikonu (čakal som len krok 2): " + d.join(", "));
      return { info: d.join(", ") };
    },
  },
  S77: {
    len: "sk",
    popis: "Jedna stránka: výber krajín je pri adrese hneď (bez „Zmeniť štát“, bez fokusu); Česko -> Step1ChooseDelivery + Step1Validate, krok 2 nanovo, meno ostane; registrácia skrytá",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      await naJednuStranku(s);
      const reg = await s.ev(`(function () { var r = document.getElementById("set-registration"); var f = r && r.closest("fieldset");
        return { je: !!r, vidno: !!f && f.getBoundingClientRect().height > 0 && getComputedStyle(f).display !== "none" }; })()`);
      over(reg.je && !reg.vidno, "„Chcem sa registrovať“: " + JSON.stringify(reg));
      await s.pis("#billFullName", ZAKAZNIK.sk.meno);
      const nav = s.dokumenty().length, step1 = step1Xhr(s).length;
      const v = await s.ev(`(function () { var v = document.querySelector("#order-form .lcd-opc-stat__vyber"); if (!v) return null;
        return { moznosti: [].map.call(v.options, function (o) { return o.textContent + (o.selected ? "*" : ""); }), meno: v.name || "", vFormulari: [].indexOf.call(document.getElementById("order-form").elements, v) > -1,
          aktivny: document.activeElement === v, odkaz: !!document.querySelector("#order-form .lcd-opc-stat em.helpNote a"),
          nazovVidno: [].some.call(document.querySelectorAll("#order-form .lcd-opc-stat--vyber > strong"), function (e) { return e.getBoundingClientRect().height > 0; }) }; })()`);
      over(v && v.moznosti.join("|") === "Česká republika|Fínsko|Nemecko|Poľsko|Slovensko*", "výber krajín: " + JSON.stringify(v));
      over(v && !v.meno && !v.nazovVidno, "výber má meno (odíde s objednávkou) / názov štátu ostal: " + JSON.stringify(v));
      over(v && !v.aktivny && !v.odkaz, "výber má fokus (telefón by ho otvoril sám) / ostal odkaz „Zmeniť štát“: " + JSON.stringify(v));
      await s.ev(`(function () { var v = document.querySelector("#order-form .lcd-opc-stat__vyber"); v.value = "43"; v.dispatchEvent(new Event("change", { bubbles: true })); return 1; })()`);
      const koniec = Date.now() + 15000;
      while (Date.now() < koniec && s.dokumenty().length < nav + 1) await pauza(100);
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 po zmene krajiny");
      const d = s.dokumenty().slice(nav);
      const k = s.p.zaznam.krajina || [];
      over(k.length === 1 && /deliveryCountryId=43/.test(k[0].telo) && k[0].xhr, "Step1ChooseDelivery: " + JSON.stringify(k));
      over(step1Xhr(s).length === step1 + 1, "Step1Validate po zmene krajiny " + (step1Xhr(s).length - step1) + "×");
      over(d.length === 1 && /GET \/objednavka\/krok-2\//.test(d[0]), "navigácie po zmene krajiny (čakal som len krok 2): " + d.join(", "));
      const meno = await s.ev(`document.getElementById("billFullName").value`);
      over(meno === ZAKAZNIK.sk.meno, "meno po zmene krajiny: " + meno);
      return { info: d.join(", ") };
    },
  },
  S78: {
    len: "sk",
    popis: "Jedna stránka: zmena krajiny zlyhá (500) -> klasický krok 1 ako doteraz",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ krajina: "500" }, SCENAR) });
      await naJednuStranku(s);
      const nav = s.dokumenty().length;
      await s.ev(`(function () { var v = document.querySelector("#order-form .lcd-opc-stat__vyber"); v.value = "44"; v.dispatchEvent(new Event("change", { bubbles: true })); return 1; })()`);
      const koniec = Date.now() + 15000;
      while (Date.now() < koniec && s.dokumenty().length < nav + 1) await pauza(100);
      await pauza(800);
      const d = s.dokumenty().slice(nav);
      over(d.length >= 1 && /GET \/objednavka\/krok-1\//.test(d[0]), "po zlyhaní zmeny krajiny: " + d.join(", "));
      return { info: d.join(", ") };
    },
  },
  S82: {
    len: "sk",
    popis: "Jedna stránka z webu: skok meranie nestratí — view_cart, begin_checkout (GA4) a AddPaymentInfo (Meta, s eventID Shoptetu) na kroku 2 po 1×, F5 už nič",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR, skript: `window.fbq = function () { (window.__lcdTestFb = window.__lcdTestFb || []).push([].slice.call(arguments)); };` });
      const pred = await naWeb(s);
      await s.klikni("#lcd-test-do-kosika", { popis: "Do košíka" });
      await poKliku(s, pred);
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 po skoku");
      const meranie = `(function () { return { ga: [].filter.call(window.dataLayer || [], function (x) { return x && x[0] === "event"; }).map(function (x) { return x[1]; }),
        fb: (window.__lcdTestFb || []).map(function (x) { return [x[1], !!(x[3] && x[3].eventID)]; }) }; })()`;
      const m = await s.ev(meranie);
      const pocet = (u) => m.ga.filter((x) => x === u).length;
      over(pocet("view_cart") === 1 && pocet("begin_checkout") === 1 && pocet("lcd_opc_zobrazenie") === 1, "GA4 po skoku: " + JSON.stringify(m.ga));
      over(JSON.stringify(m.fb) === '[["AddPaymentInfo",true]]', "Meta po skoku: " + JSON.stringify(m.fb));
      await s.chod("/objednavka/krok-2/", { popis: "F5 v pokladni" });
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 po F5");
      const f5 = await s.ev(meranie);
      over(!f5.ga.includes("view_cart") && !f5.ga.includes("begin_checkout") && !f5.fb.length, "po F5 sa meranie zopakovalo: " + JSON.stringify(f5));
      return { info: "GA4 " + m.ga.join(",") + " | Meta " + m.fb.map((x) => x[0]).join(",") };
    },
  },
  S83: {
    len: "sk",
    nacvik: true,
    popis: "Nácvik spustenia (LCD_OPC_SPUSTENE=1): zákazník bez kódu a bez flagu ide z košíka aj z webu rovno do pokladne pod obrazovkou „Načítavam…“; ?opc=0 a vypínač v data.json vrátia dnešný tok bez visiacej obrazovky",
    async fn(J) {
      const casti = [];
      const hned = (s) => s.ev(`({ priBody: window.__lcdTestPriBody ? window.__lcdTestPriBody.c : null, teraz: document.documentElement.className })`);
      // a) bez flagu: /kosik/ -> rovno krok 2
      let s = await J.novaStranka({ kosik: "set", bezOpc: true, noviZakaznik: true, scenar: Object.assign({ hlavicka: true }, SCENAR) });
      await s.k.chod(s.W.base + KOSIK);
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 bez kódu");
      let st = await s.ev(`({ cesta: location.pathname, stav: window.__lcdOpc.stav, karta: !!document.querySelector("${KARTA} .lcd-opc-kk__polozka"), flag: ${FLAG_OPC} })`);
      over(st.cesta === KROK2 && st.stav === "krok2-potvrdene" && st.karta && st.flag === null, "bez flagu: " + JSON.stringify(st));
      let h = await hned(s);
      over(/lcd-opc-hned/.test(h.priBody || "") && !/lcd-opc-hned/.test(h.teraz), "bez flagu obrazovka hneď: " + JSON.stringify(h));
      casti.push("košík -> krok 2");
      // b) z webu klik na košík -> krok 2, stránka košíka sa nenačíta
      await s.k.chod(s.W.base + "/lcd-test-web/");
      await s.cakaj(`!!document.getElementById("lcd-test-do-kosika")`, { popis: "stránka webu" });
      await cakajOpc(s, /^web$/, "web");
      const pred = { nav: s.dokumenty().length, step1: step1Xhr(s).length };
      await s.klikni("#lcd-test-do-kosika", { popis: "Do košíka" });
      const d = await poKliku(s, pred);
      over(d.length === 1 && /GET \/objednavka\/krok-2\//.test(d[0]), "z webu: " + d.join(", "));
      casti.push("web -> krok 2");
      await s.zavri();
      // c) ?opc=0: v tomto prehliadači dnešný tok, flag "0", obrazovka sa neukáže ani na ďalšej stránke
      s = await J.novaStranka({ kosik: "set", bezOpc: true, noviZakaznik: true, scenar: Object.assign({ hlavicka: true }, SCENAR) });
      await s.k.chod(s.W.base + KOSIK + "?opc=0");
      await pauza(1500);
      await s.k.chod(s.W.base + KOSIK);
      await pauza(1500);
      st = await s.ev(`({ cesta: location.pathname, flag: ${FLAG_OPC}, opc: !!window.__lcdOpc, c: document.documentElement.className })`);
      h = await hned(s);
      over(st.cesta === KOSIK && st.flag === "0" && !/lcd-opc/.test(h.priBody || "") && !/lcd-opc-hned/.test(st.c), "?opc=0: " + JSON.stringify([st, h]));
      casti.push("?opc=0 dnešný košík");
      await s.zavri();
      // d) núdzový vypínač v data.json: dnešný košík, obrazovka z hlavičky nevisí
      s = await J.novaStranka({ kosik: "set", bezOpc: true, noviZakaznik: true, scenar: Object.assign({ hlavicka: true, dataJson: { opc: false } }, SCENAR) });
      await s.k.chod(s.W.base + KOSIK);
      await s.cakaj(`document.readyState === "complete"`, { popis: "košík s vypínačom" });
      await pauza(2000);
      st = await s.ev(`({ cesta: location.pathname, c: document.documentElement.className, tlacidlo: !!document.getElementById("continue-order-button") })`);
      over(st.cesta === KOSIK && st.tlacidlo && !/lcd-opc-(hned|prechadzam|kosik)/.test(st.c), "vypínač: " + JSON.stringify(st));
      casti.push("vypínač dnešný košík");
      await s.zavri();
      return { info: casti.join(" | ") };
    },
  },
  S84: {
    len: "sk",
    popis: "Košík s položkou, ktorú Shoptet nepustí do kroku 1 (302 na /kosik/): žiadna slučka, zákazník vidí košík, „Pokračovať“ a hlášku Shoptetu",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ krok1: "kosik" }, SCENAR) });
      await s.k.chod(s.W.base + KOSIK + OPC);
      await pauza(4000);
      const n = s.dokumenty().length;
      await pauza(3000);
      const st = await s.ev(`({ c: document.documentElement.className, cesta: location.pathname, pokr: !!document.getElementById("continue-order-button"), stav: (window.__lcdOpc || {}).stav })`);
      over(s.dokumenty().length === n, "stránka sa stále načítava dokola: " + s.dokumenty().join(", ").slice(0, 300));
      over(st.cesta === KOSIK && st.pokr && !/lcd-opc-(prechadzam|skok|hned)/.test(st.c), "košík nevidno: " + JSON.stringify(st));
      return { info: n + " načítaní, potom košík" };
    },
  },
  S85: {
    len: "sk",
    popis: "data.json neprichádza: plný košík je skrytý najviac 3 s (nie 10 s), potom ho zákazník vidí a môže pokračovať",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ dataJsonMs: 9000 }, SCENAR) });
      await s.k.chod(s.W.base + KOSIK + OPC);
      await pauza(1500);
      const a = await s.ev(`document.documentElement.classList.contains("lcd-opc-prechadzam")`);
      await pauza(2700);
      const b = await s.ev(`document.documentElement.classList.contains("lcd-opc-prechadzam")`);
      over(a === true && b === false, "skrytie po 1,5 s / 4,2 s: " + a + " / " + b);
      return { info: "po 4,2 s košík vidno" };
    },
  },
  S86: {
    len: "sk",
    popis: "Prenos kroku 1 sa zastaví uprostred tela odpovede: prechod sa neskončí zamrznutý, zákazník ide ďalej záchrannou cestou",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({}, SCENAR), skript: `(function () { var f = Response.prototype.text; Response.prototype.text = function () { return /objednavka.krok-1/.test(this.url) && !sessionStorage.getItem("lcdTestTelo") && (sessionStorage.setItem("lcdTestTelo", "1"), 1) ? new Promise(function () {}) : f.call(this); }; })();` });
      await s.k.chod(s.W.base + KOSIK + OPC);
      await pauza(11000);
      const st = await s.ev(`({ cesta: location.pathname, c: document.documentElement.className, caka: document.querySelectorAll("[data-lcd-opc-caka]").length })`);
      over(st.caka === 0 && !/lcd-opc-prechadzam/.test(st.c), "zamrznuté: " + JSON.stringify(st));
      return { info: st.cesta };
    },
  },
  S80: {
    len: "sk",
    popis: "Jedna stránka s riadkom v Záhlaví (kniha § 10.26): krok 2 aj po zmene krajiny začne kresliť už pod obrazovkou „Načítavam…“ (html.lcd-opc-hned, pri zmene krajiny text „Mením krajinu doručenia…“), po dokončení obrazovka preč",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ hlavicka: true }, SCENAR) });
      await naJednuStranku(s);
      const sonda = () => s.ev(`(function () { var H = document.documentElement; return { priBody: window.__lcdTestPriBody || null, teraz: H.className, hlaska: H.getAttribute("data-lcd-opc-hlaska"),
        ulozena: sessionStorage.getItem("lcdOpcHlaska") }; })()`);
      const a = await sonda();
      over(a.priBody && /(^| )lcd-opc-hned( |$)/.test(a.priBody.c), "krok 2 z košíka: pri začiatku <body> chýba lcd-opc-hned: " + JSON.stringify(a.priBody));
      over(!/lcd-opc-hned/.test(a.teraz), "obrazovka ostala po dokončení: " + a.teraz);
      const nav = s.dokumenty().length;
      // text obrazovky na starej stránke zachytí sonda do sessionStorage (stránka sa hneď vymení)
      await s.ev(`(function () { new MutationObserver(function () { var d = document.getElementById("lcd-opc-skok"); if (d) sessionStorage.setItem("lcdTestSkok", d.textContent); })
        .observe(document.body, { childList: true }); var v = document.querySelector("#order-form .lcd-opc-stat__vyber"); v.value = "43"; v.dispatchEvent(new Event("change", { bubbles: true })); return 1; })()`);
      const koniec = Date.now() + 15000;
      while (Date.now() < koniec && s.dokumenty().length < nav + 1) await pauza(100);
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 po zmene krajiny");
      await pauza(100);
      const b = await sonda();
      over(b.priBody && /(^| )lcd-opc-hned( |$)/.test(b.priBody.c) && b.priBody.h === "Mením krajinu doručenia…", "po zmene krajiny pri začiatku <body>: " + JSON.stringify(b.priBody));
      over(!/lcd-opc-hned/.test(b.teraz) && b.hlaska === null && b.ulozena === null, "po dokončení: " + JSON.stringify(b));
      const pocas = await s.ev(`sessionStorage.getItem("lcdTestSkok")`);
      over(pocas === "Mením krajinu doručenia…", "obrazovka pri zmene krajiny: " + pocas);
      return { info: "pri <body>: " + a.priBody.c.match(/lcd-opc-\w+/g).join(" ") + " | po zmene: „" + b.priBody.h + "“" };
    },
  },
  S79: {
    len: "sk",
    popis: "Jedna stránka: 2 boxy M + L pridané -> pri boxoch len krížik v krúžku, krížiky v dvoch riadkoch sa neprekrývajú",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: Object.assign({ kosikStav: true }, SCENAR) });
      await naJednuStranku(s);
      const pred = await stopa(s);
      await s.klikni(`${KARTA} [data-lcd-vyb="box"]`, { popis: "Vybrať (box)" });
      await pauza(300);
      await s.klikni('[data-lcd-vyb-pocet="2"]', { popis: "2 boxy" });
      await s.klikni('[data-lcd-vyb-velkost="M"]', { popis: "1. box M" });
      await s.klikni('[data-lcd-vyb-velkost2="L"]', { popis: "2. box L" });
      await s.klikni('[data-lcd-vyb-pridat="box"]', { popis: "Pridať k setu" });
      await poZmene(s, pred);
      await s.cakaj(`document.querySelectorAll("${KARTA} .lcd-dop-x").length >= 2`, { ms: 15000, popis: "krížiky pri 2 boxoch" });
      const r = await s.ev(`[].map.call(document.querySelectorAll("${KARTA} .lcd-dop-x"), function (b) { var r = b.getBoundingClientRect(), l = b.closest("li").getBoundingClientRect();
        return [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right), b.textContent.trim(), Math.round(l.top), Math.round(l.bottom)]; })`);
      // tlačidlo nesmie trčať zo svojho riadku (záporný okraj -> do susedného riadku = cez susedné tlačidlo)
      let zle = r.filter((x) => x[0] < x[5] - 1 || x[1] > x[6] + 1).map((x) => "trčí z riadku " + JSON.stringify(x));
      for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
        const a = r[i], b = r[j];
        if (a[0] < b[1] && b[0] < a[1] && a[2] < b[3] && b[2] < a[3]) zle.push(JSON.stringify([a, b]));
      }
      over(r.length >= 2 && !zle.length, "krížiky sa prekrývajú: " + zle.join(" ; ") + " (" + JSON.stringify(r) + ")");
      over(r.every((x) => x[4] === "×" && x[3] - x[2] <= 30), "pri boxe má byť len krížik v krúžku: " + JSON.stringify(r));
      // krížik vpravo na riadku vedľa textu (nie osamote pod ním)
      const vedla = await s.ev(`[].map.call(document.querySelectorAll("${KARTA} .lcd-dop-x"), function (b) { var li = b.closest("li"), t = li.querySelector(".lcd-dop-text");
        if (!t) return "bez textu"; var rb = b.getBoundingClientRect(), rt = t.getBoundingClientRect(), rl = li.getBoundingClientRect(), y = (rb.top + rb.bottom) / 2;
        return y >= rt.top - 1 && y <= rt.bottom + 1 && rb.right >= rl.right - 2 && rb.left >= rt.right - 1 ? "ok" : JSON.stringify([rb.top, rb.bottom, rb.left, rb.right, rt.top, rt.bottom, rt.right, rl.right]); })`);
      over(vedla.every((x) => x === "ok"), "krížik nie je vpravo vedľa textu: " + vedla.join(" ; "));
      return { info: r.map((x) => x[4] + "@" + x[0] + "-" + x[1]).join(", ") };
    },
  },
  S81: {
    len: "sk", // CZ nemá fixtúry košíka so setom (opc-fixtures/sk-set); CZ texty: tools/test-kosik-doplnok.mjs
    popis: "Ponuka k setu (Michal 1. 11. 2026, variant 1): rohož prvá so štítkom „Top do kufra“ a podsvietením, fotky rohože a boxu rovnako veľké ako video, druhá vrstva bez „Odporúčame“ so živým videom (úsek od 3,2 s); ťuknutie = príbeh na celú obrazovku (fokus na ×, 2 videá, Esc zavrie a fokus späť), „Pridať druhú vrstvu“ otvorí výber farby, nič sa nepridá; „menej pohybu“ -> len záber + ▶, video sa nesťahuje",
    async fn(J) {
      const cz = false;
      const s = await J.novaStranka({ kosik: "set", scenar: SCENAR });
      await naJednuStranku(s);
      const RIADKY = `(function () { var k = document.querySelector("${KARTA}"); return [].map.call(k.querySelectorAll(".lcd-vyb__riadok"), function (r) {
        var o = r.querySelector(".lcd-vyb__odp"), v = r.querySelector("[data-lcd-vyb-video]");
        return { d: r.getAttribute("data-doplnok"), naj: r.classList.contains("lcd-vyb__riadok--naj"), stitok: o ? o.textContent : null,
          stitokVyska: o ? Math.round(o.getBoundingClientRect().height) : 0, foto: !!r.querySelector("img.lcd-vyb__mini"),
          fotoWH: (function (i) { return i ? [Math.round(i.getBoundingClientRect().width), Math.round(i.getBoundingClientRect().height)] : null; })(r.querySelector("[data-lcd-vyb-produkt-video]")),
          cenaRiadky: (function (c) { var lh = parseFloat(getComputedStyle(c).lineHeight) || 19; return Math.round(c.getBoundingClientRect().height / lh); })(r.querySelector(".lcd-vyb__cena")),
          btnFarba: getComputedStyle(r.querySelector(".lcd-vyb__btn")).backgroundImage,
          video: v ? { aria: v.getAttribute("aria-label"), w: Math.round(v.getBoundingClientRect().width), h: Math.round(v.getBoundingClientRect().height) } : null,
          pozadie: getComputedStyle(r).backgroundImage !== "none" }; }); })()`;
      const r = await s.ev(RIADKY);
      over(r.map((x) => x.d).join() === "rohoz,vrstva2,box", "poradie: " + r.map((x) => x.d).join());
      over(r[0].naj && r[0].pozadie && r[0].stitok === (cz ? "Top do kufru" : "Top do kufra"), "rohož: " + JSON.stringify(r[0]));
      over(r[0].stitokVyska > 0 && r[0].stitokVyska < 24, "štítok rohože nie je na jeden riadok: " + r[0].stitokVyska + " px");
      over(r[1].stitok === null && !r[1].foto && r[1].video && /video/i.test(r[1].video.aria) && r[1].video.w >= 60 && r[1].video.h > r[1].video.w, "druhá vrstva: " + JSON.stringify(r[1]));
      over(!r[1].naj && !r[2].naj && r[2].stitok === null, "štítok / podsvietenie aj inde: " + JSON.stringify(r.slice(1)));
      // Michal 1. 11. 2026 23:02 (variant A): rohož a box rovnako veľké ako video druhej vrstvy; od 2. 11. 2026 tiež video
      over([r[0], r[2]].every((x) => !x.foto && x.fotoWH && x.fotoWH[0] === r[1].video.w && x.fotoWH[1] === r[1].video.h), "video rohože / boxu nie je ako video vrstvy: " + JSON.stringify([r[0].fotoWH, r[1].video, r[2].fotoWH]));
      // Michal 2. 11. 2026: „+129 € · ušetríte 101 €“ v jednom riadku (SK, šírka testu), tlačidlá Pridať zelené
      over(r[0].cenaRiadky === 1 && r[2].cenaRiadky === 1, "cena s „ušetríte“ nie je v jednom riadku: " + JSON.stringify([r[0].cenaRiadky, r[2].cenaRiadky]));
      over(r.every((x) => /rgb\(46, 125, 50\)/.test(x.btnFarba)), "Pridať nie je zelené (--o-zelena ako Objednať): " + r.map((x) => x.btnFarba).join(" ; "));
      // video rohože a boxu: na obrazovke sa samo hrá v slučke celé (kosik/rohoz-video, kosik/box-video), bez priblíženia
      for (const k of ["rohoz", "box"]) {
        await s.ev(`document.querySelector("[data-lcd-vyb-produkt-video='${k}']").scrollIntoView({ block: "center" })`);
        await s.cakaj(`(function () { var v = document.querySelector("[data-lcd-vyb-produkt-video='${k}'] video"); return v && !v.paused && v.currentTime > 0.3; })()`, { ms: 15000, popis: "video " + k + " sa hrá" });
        const pv = await s.ev(`(function () { var t = document.querySelector("[data-lcd-vyb-produkt-video='${k}']"), v = t.querySelector("video");
          return { src: v.currentSrc, loop: v.loop, muted: v.muted, tr: getComputedStyle(v).transform, tag: t.tagName, aria: t.getAttribute("aria-hidden") }; })()`);
        over(new RegExp("kosik/" + k + "-video\\.(webm|mp4)$").test(pv.src) && pv.loop && pv.muted && pv.tr === "none" && pv.tag === "SPAN" && pv.aria === "true", "video " + k + ": " + JSON.stringify(pv));
      }
      // dlaždica na obrazovke -> video sa samo hrá od úseku s vodou
      await s.ev(`document.querySelector("[data-lcd-vyb-video]").scrollIntoView({ block: "center" })`);
      const V = `(function () { var v = document.querySelector("[data-lcd-vyb-video] .lcd-vyb__vid-video"); return { t: v.currentTime, p: v.paused, src: v.currentSrc, muted: v.muted, ls: document.querySelector("[data-lcd-vyb-video] .lcd-vyb__vid-lis b").style.width }; })()`;
      await s.cakaj(`(function () { var v = document.querySelector("[data-lcd-vyb-video] .lcd-vyb__vid-video"); return v && !v.paused && v.currentTime >= 3.2; })()`, { ms: 15000, popis: "video v dlaždici sa hrá od 3,2 s" });
      const v1 = await s.ev(V);
      over(/druha-video-vapka\.(webm|mp4)$/.test(v1.src) && v1.muted && v1.t < 9.9 && parseFloat(v1.ls) >= 0, "dlaždica: " + JSON.stringify(v1));
      // príbeh
      await s.ev(`(window.dataLayer = window.dataLayer || []).length = 0`);
      await s.klikni("[data-lcd-vyb-video]", { popis: "video druhej vrstvy" });
      const P = `(function () { var p = document.querySelector(".lcd-vyb-pribeh"), v = p && p.querySelector(".lcd-vyb-pribeh__video"), a = document.activeElement;
        return { vidno: !!p && !p.hidden && p.getBoundingClientRect().height > 0, trieda: document.documentElement.classList.contains("lcd-vyb-pribeh"),
          fokus: a ? (a.getAttribute("data-lcd-vyb-pribeh-x") !== null ? "x" : a.hasAttribute("data-lcd-vyb-video") ? "dlazdica" : a.className || a.tagName) : null,
          poradie: p ? p.querySelector(".lcd-vyb-pribeh__meno small").textContent : null, src: v ? v.currentSrc : null,
          pridat: p ? p.querySelector("[data-lcd-vyb-pribeh-pridat]").textContent : null, stav: history.state,
          dl: (window.dataLayer || []).filter(function (e) { return e.event === "lcd_set_doplnok_klik"; }).map(function (e) { return e.lcd_doplnok + ":" + e.lcd_varianta; }),
          dlazdicaHra: !document.querySelector("[data-lcd-vyb-video] .lcd-vyb__vid-video").paused }; })()`;
      await s.cakaj(`(function () { var v = document.querySelector(".lcd-vyb-pribeh__video"); return v && !v.paused && v.currentTime > 0.2; })()`, { ms: 15000, popis: "video v príbehu hrá" });
      const p1 = await s.ev(P);
      const cena = await s.ev(`document.querySelector('${KARTA} .lcd-vyb__riadok[data-doplnok="vrstva2"] .lcd-vyb__cena b').textContent`);
      over(p1.vidno && p1.trieda && p1.fokus === "x" && p1.poradie === "1 / 2" && /druha-video-vapka/.test(p1.src) && !p1.dlazdicaHra, "príbeh po otvorení: " + JSON.stringify(p1));
      over(p1.pridat === (cz ? "Přidat druhou vrstvu" : "Pridať druhú vrstvu") + " · " + cena, "tlačidlo v príbehu: " + p1.pridat + " (cena riadku " + cena + ")");
      over(p1.dl.join() === "vrstva2:video" && p1.stav && p1.stav.lcdVybPribeh === 1, "meranie / história: " + JSON.stringify([p1.dl, p1.stav]));
      // starý globálny „video { border: 5px solid … !important }“ e-shopu nesmie dať videám zlatý rám
      const ramy = await s.ev(`["[data-lcd-vyb-video] .lcd-vyb__vid-video", ".lcd-vyb-pribeh__video"].map(function (q) { return getComputedStyle(document.querySelector(q)).borderTopWidth; })`);
      over(ramy.join() === "0px,0px", "rám okolo videa: " + ramy.join());
      await s.klikni(".lcd-vyb-pribeh__dalej", { popis: "ďalšie video" });
      await s.cakaj(`(function () { var v = document.querySelector(".lcd-vyb-pribeh__video"); return /druha-video-pribeh/.test(v.currentSrc) && !v.paused; })()`, { ms: 15000, popis: "2. video" });
      over((await s.ev(P)).poradie === "2 / 2", "poradie po ďalšom");
      // Esc zavrie, fokus späť na dlaždicu, záznam v histórii preč, dlaždica znova hrá
      await s.k.posli("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await s.k.posli("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await s.cakaj(`!document.documentElement.classList.contains("lcd-vyb-pribeh") && !(history.state && history.state.lcdVybPribeh)`, { ms: 5000, popis: "príbeh zatvorený" });
      const p2 = await s.ev(P);
      over(!p2.vidno && p2.fokus === "dlazdica", "po Esc: " + JSON.stringify(p2));
      await s.cakaj(`!document.querySelector("[data-lcd-vyb-video] .lcd-vyb__vid-video").paused`, { ms: 5000, popis: "dlaždica znova hrá" });
      // znova otvoriť -> „Pridať druhú vrstvu“ -> príbeh preč a otvorený výber farby v riadku (nič sa nepridalo)
      await s.klikni("[data-lcd-vyb-video]", { popis: "video druhej vrstvy (2.)" });
      await s.cakaj(`document.documentElement.classList.contains("lcd-vyb-pribeh")`, { ms: 5000, popis: "príbeh 2." });
      await s.klikni("[data-lcd-vyb-pribeh-pridat]", { popis: "Pridať druhú vrstvu" });
      await s.cakaj(`(function () { var r = document.querySelector('${KARTA} .lcd-vyb__riadok[data-doplnok="vrstva2"]'); return !document.documentElement.classList.contains("lcd-vyb-pribeh") && r.classList.contains("je-otvorena"); })()`, { ms: 5000, popis: "výber farby otvorený" });
      const p3 = await s.ev(`(function () { var r = document.querySelector('${KARTA} .lcd-vyb__riadok[data-doplnok="vrstva2"]'), pn = r.querySelector(".lcd-vyb__panel"), b = r.querySelector(".lcd-vyb__btn");
        return { panel: !pn.hidden && pn.getBoundingClientRect().height > 0, exp: b.getAttribute("aria-expanded"), stav: history.state }; })()`);
      over(p3.panel && p3.exp === "true" && !(p3.stav && p3.stav.lcdVybPribeh), "po Pridať druhú vrstvu: " + JSON.stringify(p3));
      over(!s.p.zaznam.kosikAkcie.length, "úprava košíka bez výberu farby: " + JSON.stringify(s.p.zaznam.kosikAkcie));
      // „menej pohybu“ -> záber + ▶, video sa nesťahuje
      await s.k.posli("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
      await naJednuStranku(s);
      await s.ev(`document.querySelector("[data-lcd-vyb-video]").scrollIntoView({ block: "center" })`);
      await pauza(1200);
      const st = await s.ev(`(function () { var b = document.querySelector("[data-lcd-vyb-video]"), v = b.querySelector("video"), pl = b.querySelector(".lcd-vyb__vid-play");
        return { staticke: b.classList.contains("lcd-vyb__vid--staticke"), zdroje: v.querySelectorAll("source").length, src: v.currentSrc, play: getComputedStyle(pl).display, poster: v.poster }; })()`);
      // rohož a box: len záber (prvý záber videa), nič sa nesťahuje, žiadne ▶ (nie sú to tlačidlá)
      const stP = await s.ev(`[].map.call(document.querySelectorAll("[data-lcd-vyb-produkt-video]"), function (t) { var v = t.querySelector("video");
        return { k: t.getAttribute("data-lcd-vyb-produkt-video"), staticke: t.classList.contains("lcd-vyb__vid--staticke"), zdroje: v.querySelectorAll("source").length, src: v.currentSrc, poster: v.poster }; })`);
      await s.k.posli("Emulation.setEmulatedMedia", { features: [] });
      over(st.staticke && st.zdroje === 0 && !st.src && st.play !== "none" && /kosik\/vrstva-video\.jpg$/.test(st.poster), "menej pohybu: " + JSON.stringify(st));
      over(stP.length === 2 && stP.every((x) => x.staticke && x.zdroje === 0 && !x.src && new RegExp("kosik/" + x.k + "-video\\.jpg$").test(x.poster)), "menej pohybu, rohož / box: " + JSON.stringify(stP));
      return { info: "rohož prvá + štítok, video od " + v1.t.toFixed(1) + " s, rohož a box video, cena v 1 riadku, zelené Pridať, príbeh 2 videá, Esc, Pridať -> výber farby, menej pohybu bez videa" };
    },
  },
  S90: {
    len: "sk", // kamión je zachytený len pre SK (fixtures/sk-kamion); CZ texty a mená príplatkov: tools/test-kamion-tapacir.mjs
    popis: "Kamión v karte košíka (Michal 2. 11. 2026): rekapitulácia ako pri autách — hneď Vozidlo a materiál, ostatné po „Zobraziť viac“; s tapacírom bez ponuky",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "kamion", scenar: SCENAR });
      await s.chod(KOSIK, { popis: "košík bez kódu (konfigurátor uložil súhrn)" });
      await s.ev(`(function (d) { Object.keys(d).forEach(function (k) { sessionStorage.setItem(k, d[k]); }); return 1; })(${JSON.stringify({ truckOrderSummary: buildTruckOrderSummary(KAMION, "sk"), truckVehicle: "DAF (TIR) XF 2022-2025" })})`);
      await naJednuStranku(s, { ponuka: 0 });
      await pauza(1500); // ponuka by sa načítala zo stránky produktu (tu nesmie prísť)
      const R = `(function () { var k = document.querySelector("${KARTA}"), vid = function (e) { return e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== "none"; };
        var ul = k.querySelector(".lcd-opc-kk__polozka ul.lcd-rozpis"), z = k.querySelector(".lcd-opc-zob");
        return { vidno: ul ? [].filter.call(ul.children, vid).map(function (l) { return l.textContent.replace(/\\s+/g, " ").trim(); }) : null,
          vsetky: ul ? ul.children.length : 0, zob: z ? z.textContent.trim() + "|" + z.getAttribute("aria-expanded") : null,
          ponuka: k.querySelectorAll(".lcd-vyb").length }; })()`;
      const a = await s.ev(R);
      over(a.vidno && a.vidno.join(" ; ") === "Vozidlo: DAF XF 2022–2025 ; Typ a farba materiálu: Prémiová syntetická koža – prešívaná – čierna, čierne šitie – 11", "zbalené: " + JSON.stringify(a.vidno));
      over(a.zob === "Zobraziť viac|false" && a.vsetky > 6, "pilulka / počet riadkov: " + JSON.stringify([a.zob, a.vsetky]));
      over(a.ponuka === 0, "ponuka tapacíru pri kamióne s tapacírom: " + a.ponuka);
      await s.klikni(`${KARTA} .lcd-opc-zob`, { popis: "Zobraziť viac" });
      const b = await s.ev(R);
      over(b.vidno.length === b.vsetky && b.zob === "Zobraziť menej|true", "rozbalené: " + JSON.stringify(b));
      over(b.vidno.indexOf("Farba lemovania: čierny základ, červené pásiky – 04") > 0 && b.vidno[b.vidno.length - 1] === "Tapacír dverí: rovnaký ako koberčeky", "rozbalené riadky: " + JSON.stringify(b.vidno));
      return { info: a.vidno.length + " hneď, " + b.vsetky + " po Zobraziť viac, posledný „" + b.vidno[b.vidno.length - 1] + "“" };
    },
  },
  S91: {
    len: "sk",
    popis: "Kamión TIR bez tapacíru: ponuka „Tapacír dverí“ +119 € -> výmena riadku bez načítania stránky, ✓ hláška, súhrn a poznámka s blokom dverí ako z konfigurátora",
    async fn(J) {
      const bez = Object.assign({}, KAMION, { doorPanelChoice: "nie" });
      const s = await J.novaStranka({ kosik: "kamionBez", scenar: Object.assign({ kosikStav: true }, SCENAR) });
      await s.chod(KOSIK, { popis: "košík bez kódu (konfigurátor uložil súhrn)" });
      await s.ev(`(function (d) { Object.keys(d).forEach(function (k) { sessionStorage.setItem(k, d[k]); }); return 1; })(${JSON.stringify({ truckOrderSummary: buildTruckOrderSummary(bez, "sk"), truckVehicle: "DAF (TIR) XF 2022-2025" })})`);
      await naJednuStranku(s, { ponuka: 1 });
      const p = await s.ev(`(function () { var r = document.querySelector('${KARTA} .lcd-vyb__riadok[data-doplnok="tapacir"]');
        return r ? r.textContent.replace(/\\s+/g, " ").trim() + " | " + document.querySelector("${KARTA} .lcd-vyb__nadpis").textContent : null; })()`);
      over(p && /Tapacír dverí/.test(p) && /\+119\s€/.test(p) && /ušetríte 60\s€/.test(p) && /Pridať/.test(p) && /Doplňte svoj kamión/.test(p), "ponuka: " + p);
      await s.pis("#email", ZAKAZNIK.sk.email);
      const pred = await stopa(s);
      await s.klikni(`${KARTA} [data-lcd-vyb="tapacir"]`, { popis: "Pridať (tapacír dverí)" });
      const st = await poZmene(s, pred);
      const a = s.p.zaznam.kosikAkcie;
      over(a.map((x) => x.akcia).join() === "addCartItem,deleteCartItem", "úpravy košíka: " + a.map((x) => x.akcia).join(", "));
      const pole = a[0].pole, ocak = { 352: "1468", 388: "1435", 391: "1441", 394: "1447", 355: "1390", 397: "1711", 400: "1789", 346: "1360", 349: "1465", 376: "91501", 379: "91502" };
      Object.keys(ocak).forEach((id) => over(pole["surchargeParameterValueId[" + id + "]"] === ocak[id], "príplatok " + id + " = " + pole["surchargeParameterValueId[" + id + "]"] + " (čakal som " + ocak[id] + ")"));
      over(st.polozky.length === 1 && /\| 423\s€$/.test(st.polozky[0]), "karta po pridaní: " + st.polozky.join(" / "));
      const k = await s.ev(`(function () { var k = document.querySelector("${KARTA}");
        return { hlaska: (k.querySelector(".lcd-opc-kk__hlaska") || {}).textContent || "", ponuka: k.querySelectorAll(".lcd-vyb").length, suhrn: sessionStorage.getItem("truckOrderSummary"),
          riadky: [].map.call(k.querySelectorAll(".lcd-opc-kk__polozka ul.lcd-rozpis > li"), function (l) { return l.textContent.replace(/\\s+/g, " ").trim(); }) }; })()`);
      over(k.hlaska === "✓ Tapacír dverí je pridaný k Vášmu kamiónu.", "hláška: " + k.hlaska);
      over(k.ponuka === 0, "ponuka po pridaní ostala");
      over(k.riadky[k.riadky.length - 1] === "Tapacír dverí: rovnaký ako koberčeky", "rozpis po pridaní: " + JSON.stringify(k.riadky));
      over(k.suhrn === buildTruckOrderSummary(KAMION, "sk"), "súhrn kamióna po pridaní ≠ súhrn z konfigurátora s tapacírom:\n" + k.suhrn);
      over(st.email === ZAKAZNIK.sk.email, "e-mail po pridaní: " + st.email);
      await vyplnUdaje(s);
      await suhlas(s);
      const z2 = await objednaj(s);
      const m = overTeloObjednavky(s, z2[0]);
      const remark = (m.get("remark") || [""])[0];
      over(remark.includes("[KONFIGURÁCIA KAMIÓNA]") && remark.includes("TAPACÍR DVERÍ") && remark.includes("Rovnaký ako koberčeky – Prémiová syntetická koža"), "poznámka bez bloku dverí: " + JSON.stringify(remark.slice(0, 200)));
      return { step2: true, info: "addCartItem + deleteCartItem, 423 €, " + k.hlaska.slice(2) + " poznámka " + remark.length + " znakov" };
    },
  },
  S95: {
    popis: "Prázdny košík (Michal 2. 11. 2026) pre všetkých: bez kódu aj s kódom nový blok — texty a odkazy z menu webu, kontakt zo Shoptetu, bez vyhľadávania, krok 1 sa nesťahuje, 320–1920 bez pretečenia, písmo ≥ 14, opc:false ho nechá, prazdny_kosik:false vráti Shoptet, bez bundla nepreblikne",
    async fn(J) {
      const T = PRAZDNY_TEXTY[J.web];
      const PR = `(function () {
        var b = document.getElementById("lcd-opc-prazdny"), vid = function (e) { return !!e && e.getBoundingClientRect().height > 0 && getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden"; };
        var f = document.getElementById("formSearchFormContent"), t = function (s) { var e = b && b.querySelector(s); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; };
        return { stav: window.__lcdOpc ? window.__lcdOpc.stav : null, blok: !!b, trieda: document.documentElement.classList.contains("lcd-opc-prazdny"),
          shoptetNadpis: vid(document.querySelector(".cart-empty .cart-heading")), shoptetObsah: vid(document.querySelector(".cart-empty .cart-row")),
          formVBloku: !!(b && f && b.contains(f)), formVidno: vid(f), hladajVBloku: !!(b && b.querySelector('form, input[type="search"], .lcd-prz-hladaj')), formAkcia: f ? f.getAttribute("action") : null, formPole: f ? (f.querySelector('input[type="search"]') || {}).name : null,
          nadpis: t(".lcd-prz-hlava__nadpis"), uvod: t(".lcd-prz-uvod"), pomoc: t(".lcd-prz-pomoc .lcd-prz-karta__nadpis"),
          odkazy: b ? [].map.call(b.querySelectorAll("a[href]"), function (a) { return a.getAttribute("href"); }) : [],
          kontakt: b ? [].map.call(b.querySelectorAll(".lcd-prz-kontakt"), function (a) { return a.getAttribute("href") + " " + a.querySelector("b").textContent.trim(); }) : [],
          obrazky: b ? [].map.call(b.querySelectorAll("img"), function (i) { return i.getAttribute("src"); }).concat([].map.call(b.querySelectorAll(".lcd-prz-vz__vejar i"), function (i) { return (/url\\(["']?([^"')]+)/.exec(i.style.backgroundImage) || [])[1]; })) : [],
          text: b ? b.innerText : "", chyby: (window.dataLayer || []).filter(function (d) { return d && d.event === "lcd_opc_chyba"; }).length };
      })()`;
      const casti = [];
      // 1) bez kódu (aj ?opc=0): nový prázdny košík pre všetkých (Michal 2. 11. 22:39), OPC nebeží, krok 1 sa nesťahuje
      for (const q of ["", "?opc=0"]) {
        const s = await J.novaStranka({ kosik: "prazdny", scenar: SCENAR, zabudniOpc: true });
        await s.chod(KOSIK + q, { popis: "prázdny košík bez kódu " + (q || "") });
        await pauza(1200); // data.json -> initOpc (bez kódu blok nechá)
        const a = await s.ev(PR);
        over(a.blok && a.trieda && !a.shoptetNadpis && !a.shoptetObsah && !a.formVBloku && !a.hladajVBloku && !a.formVidno && a.stav === null,
          "bez kódu " + q + ": " + JSON.stringify({ blok: a.blok, trieda: a.trieda, n: a.shoptetNadpis, o: a.shoptetObsah, f: a.formVBloku, stav: a.stav }));
        over(a.nadpis === T.nadpis && a.chyby === 0, "bez kódu " + q + ": nadpis / chyby " + JSON.stringify([a.nadpis, a.chyby]));
        const ls = await s.ev(`(function () { try { return localStorage.getItem("lcdOpc"); } catch (e) { return "x"; } })()`);
        over(ls === null || ls === "0", "bez kódu " + q + ": flag OPC " + ls);
        const k1 = s.p.zaznam.www.filter((z) => /^\/objednavka\/krok-1\/?$/.test(z.cesta));
        over(!k1.length, "bez kódu: krok 1 sa sťahoval " + k1.length + "×");
        await s.zavri();
      }
      casti.push("bez kódu aj ?opc=0 nový blok");
      // 2) s kódom: nový blok
      const s = await J.novaStranka({ kosik: "prazdny", scenar: SCENAR });
      await s.chod(KOSIK + OPC, { popis: "prázdny košík s kódom" });
      await s.cakaj(`window.__lcdOpc && window.__lcdOpc.stav === "kosik-prazdny"`, { ms: 10000, popis: "stav kosik-prazdny" });
      await pauza(800);
      const a = await s.ev(PR);
      over(a.blok && a.trieda && !a.shoptetNadpis && !a.shoptetObsah, "blok / Shoptet skrytý: " + JSON.stringify({ blok: a.blok, trieda: a.trieda, n: a.shoptetNadpis, o: a.shoptetObsah }));
      over(a.nadpis === T.nadpis && a.uvod === T.uvod, "texty: " + JSON.stringify([a.nadpis, a.uvod]));
      const ocakOdkazy = [T.set.href].concat(T.produkty.map((p) => p.href), [T.vz.href]);
      ocakOdkazy.forEach((h) => over(a.odkazy.indexOf(h) >= 0, "chýba odkaz " + h + " v " + JSON.stringify(a.odkazy)));
      const mail = J.web === "cz" ? "info@luxurycardesign.cz" : "info@luxurycardesign.sk";
      over(JSON.stringify(a.kontakt) === JSON.stringify(["tel:+421903660720 +421 903 660 720", "mailto:info&#64;luxurycardesign." + J.web + " " + mail].map((x) => x.replace("&#64;", "@"))) ||
        JSON.stringify(a.kontakt) === JSON.stringify(["tel:+421903660720 +421 903 660 720", "mailto:info@luxurycardesign." + J.web + " " + mail]), "kontakt zo Shoptetu: " + JSON.stringify(a.kontakt));
      over(a.pomoc === (J.web === "cz" ? "Potřebujete pomoc?" : "Potrebujete poradiť?"), "nadpis kontaktu zo Shoptetu: " + a.pomoc);
      // vyhľadávanie preč (Michal 2. 11. 23:40: „Áno, daj to odtiaľ preč.“): v bloku nie je, formulár Shoptetu ostáva skrytý na mieste
      over(!a.formVBloku && !a.hladajVBloku && !a.formVidno && a.formAkcia === "/action/ProductSearch/prepareString/", "vyhľadávanie má byť preč: " + JSON.stringify([a.formVBloku, a.hladajVBloku, a.formVidno, a.formAkcia]));
      over(a.obrazky.length === 3 + T.produkty.length + 5, "počet obrázkov " + a.obrazky.length);
      const koren = fileURLToPath(new URL("../../", import.meta.url));
      a.obrazky.forEach((u) => { const m = /\/assets\/(img\/lcd-home\/[a-z0-9-]+\.jpg)$/.exec(u || ""); over(m && existsSync(koren + "assets/" + m[1]), "obrázok mimo assets/img/lcd-home: " + u); });
      const zakazane = /ekokož|ekokůž|\bDPH\b|z[aá]loh|IBAN|Luxury Car Dess?ign/i.exec(a.text);
      over(!zakazane, "zakázané slovo „" + (zakazane && zakazane[0]) + "“");
      over(a.chyby === 0, "lcd_opc_chyba v dataLayer: " + a.chyby);
      const krok1 = s.p.zaznam.www.filter((z) => /^\/objednavka\/krok-1\/?$/.test(z.cesta));
      over(!krok1.length, "krok 1 sa sťahoval: " + krok1.length + "×");
      // poradie dlaždíc (Michal 2. 11. 22:58): 1. „prázdny“ (nadpis + veta), 2. set so zľavou, 3. produkty, potom kontakt
      const poradie = await s.ev(`[].map.call(document.getElementById("lcd-opc-prazdny").children, function (e) { return (e.className.match(/lcd-prz-(prazdna|set|hlavna|bok)\\b/) || [])[1] || e.className; }).join(",")`);
      over(poradie === "prazdna,set,hlavna,bok", "poradie dlaždíc: " + poradie);
      const vPrazdnej = await s.ev(`(function () { var p = document.querySelector("#lcd-opc-prazdny .lcd-prz-prazdna"); return !!(p && p.querySelector("#lcd-prz-h") && p.querySelector(".lcd-prz-uvod")); })()`);
      over(vPrazdnej, "nadpis a veta nie sú v 1. dlaždici");
      casti.push("blok, " + ocakOdkazy.length + " odkazov, kontakt, bez vyhľadávania, bez kroku 1, poradie dlaždíc");
      // šírky: nič nepreteká, písmo ≥ 14 px (štítky pod fotkami setu tiež 14), nadpis v 1 riadku od 390
      const chyby = [];
      for (const w of [320, 360, 375, 390, 414, 768, 1024, 1100, 1366, 1920]) {
        await s.k.posli("Emulation.setDeviceMetricsOverride", { width: w, height: w < 768 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 768 });
        await pauza(150);
        const r = await s.ev(`(function () {
          var b = document.getElementById("lcd-opc-prazdny"), W = document.documentElement.clientWidth, zle = [];
          if (document.documentElement.scrollWidth > W + 1) zle.push("stránka " + document.documentElement.scrollWidth + " > " + W);
          b.querySelectorAll("*").forEach(function (e) {
            var r = e.getBoundingClientRect(); if (!r.width) return;
            if (r.right > W + 0.5 || r.left < -0.5) zle.push((typeof e.className === "string" ? e.className : e.tagName) + " " + Math.round(r.left) + "–" + Math.round(r.right));
            var vlastny = Array.prototype.some.call(e.childNodes, function (x) { return x.nodeType === 3 && /\\S/.test(x.nodeValue); });
            if (vlastny && parseFloat(getComputedStyle(e).fontSize) < 14) zle.push("písmo " + getComputedStyle(e).fontSize + ": " + e.textContent.trim().slice(0, 30));
          });
          var h = b.querySelector(".lcd-prz-hlava__nadpis");
          if (W >= 390 && h.getBoundingClientRect().height > parseFloat(getComputedStyle(h).lineHeight) * 1.5) zle.push("nadpis v 2 riadkoch");
          return zle.slice(0, 5);
        })()`);
        if (r.length) chyby.push(w + ": " + r.join(" | "));
      }
      over(!chyby.length, "rozloženie:\n      " + chyby.join("\n      "));
      casti.push("320–1920 OK");
      await s.zavri();
      // 3) núdzový vypínač OPC v data.json ("opc": false) prázdny košík pre všetkých nechá
      {
        const v = await J.novaStranka({ kosik: "prazdny", scenar: Object.assign({ dataJson: { opc: false } }, SCENAR) });
        await v.chod(KOSIK + OPC, { popis: "prázdny košík, opc vypnuté v data.json" });
        await pauza(800);
        const c = await v.ev(PR);
        over(c.blok && c.trieda && !c.shoptetNadpis && !c.shoptetObsah && !c.formVBloku && !c.formVidno, "opc:false: " + JSON.stringify({ blok: c.blok, trieda: c.trieda, n: c.shoptetNadpis, o: c.shoptetObsah }));
        casti.push("opc:false blok nechá");
        await v.zavri();
      }
      // 4) vlastný vypínač "prazdny_kosik": false (aj v settings): blok preč, obsah Shoptetu viditeľný, vyhľadávanie na pôvodnom mieste
      // (settings.prazdny_kosik: jednotkový test — podvrh data.json nahrádza settings celé a main.js by spadol skôr)
      for (const [q, dj] of [["", { prazdny_kosik: false }], [OPC, { prazdny_kosik: false }]]) {
        const v = await J.novaStranka({ kosik: "prazdny", scenar: Object.assign({ dataJson: dj }, SCENAR), zabudniOpc: true });
        await v.chod(KOSIK + q, { popis: "prázdny košík, prazdny_kosik vypnutý " + (q ? "s kódom" : "bez kódu") });
        await pauza(1200);
        const c = await v.ev(PR);
        const kde = (q ? "s kódom " : "bez kódu ") + JSON.stringify(dj);
        over(!c.blok && !c.trieda && c.shoptetNadpis && c.shoptetObsah, "prazdny_kosik:false " + kde + ": " + JSON.stringify({ blok: c.blok, trieda: c.trieda, n: c.shoptetNadpis, o: c.shoptetObsah }));
        const naMieste = await v.ev(`(function () { var f = document.getElementById("formSearchFormContent"); return !!(f && f.closest(".empty-cart-boxes")); })()`);
        over(naMieste, "vyhľadávanie po vypnutí nie je na pôvodnom mieste (" + kde + ")");
        if (q) over(c.stav === "kosik-prazdny" && c.chyby === 0, "s kódom a vypínačom: stav " + c.stav + ", chyby " + c.chyby);
        await v.zavri();
      }
      casti.push("prazdny_kosik:false -> Shoptet (bez kódu aj s kódom)");
      // 5) bundle neprišiel: starý obsah Shoptetu sa neukáže hneď (nepreblikne), poistka ho ukáže po 3 s
      {
        const v = await J.novaStranka({ kosik: "prazdny", scenar: SCENAR, zabudniOpc: true });
        await v.k.posli("Network.enable", {});
        await v.k.posli("Network.setBlockedURLs", { urls: ["*js/luxuryCar.js*"] });
        await v.k.chod(v.W.base + KOSIK);
        await v.cakaj(`document.readyState === "complete" && !!document.querySelector(".cart-inner.cart-empty")`, { ms: 30000, popis: "prázdny košík bez bundla: načítanie" });
        const hneď = await v.ev(PR), cas = await v.ev("Math.round(performance.now())");
        over(cas < 2800, "bez bundla: stránka sa načítala až po " + cas + " ms (poistka 3 s) — meranie neplatí");
        await pauza(3500);
        const potom = await v.ev(PR);
        over(!hneď.blok && !hneď.shoptetNadpis && !hneď.shoptetObsah, "bez bundla hneď: " + JSON.stringify({ blok: hneď.blok, n: hneď.shoptetNadpis, o: hneď.shoptetObsah }));
        over(!potom.blok && potom.shoptetNadpis && potom.shoptetObsah, "bez bundla po 3 s: " + JSON.stringify({ blok: potom.blok, n: potom.shoptetNadpis, o: potom.shoptetObsah }));
        casti.push("bez bundla nepreblikne, po 3 s Shoptet");
        await v.zavri();
      }
      return { info: casti.join("; ") };
    },
  },
};
