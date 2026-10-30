// Scenáre jednostránkovej pokladne s ďalšími košíkmi (kniha OPC § 7.6): S8 a S9 set autokobercov 1V, S10 kamión 640,
// S12 CZ (texty, ceny, language=cs, blok kamióna v poznámke). Set a kamión sú zachytené len pre SK (fixtures/sk-set,
// sk-kamion). Košík ide s &lcddoplnok=0 — ponuka k setu by sťahovala stránky produktov (v podvrhu nie sú).
// Údaje auta a kamióna v sessionStorage sú vymyslené, ako ich ukladá konfigurátor (productPage.js, truck-konfigurator).
import { buildTruckOrderSummary } from "../../assets/js/truck-konfigurator/order-summary.mjs";
import {
  KROK2, ID, cakajOpc, naKrok2, zvolPlatbu, vyplnUdaje, suhlas, objednaj, overTeloObjednavky, poleTela, stavOpc, step1Xhr, over, pauza,
} from "./krok2-pomoc.mjs";

// značka ako kľúč v data.json (cars["Skoda"]): neznámy model by main.js initModelSelect zo storage zmazal
const AUTO = { Brand: "Skoda", Model: "Octavia", Year: "2020", carType: "Combi", model: "Skoda Octavia 2020 Combi", wheelPosition: "left", seatPosition: "pass-5", doorPosition: "doors-4" };
// kamión zhodný s príplatkami zachytenej položky (fixtures/sk-kamion, cartWidgetSurchargeName): čierna koža 11, lemovanie
// čierny základ + červené pásiky 04, nášivky H19 / 2999 na bokoch aj v strede (balík), tapacír rovnaký ako koberec bez nášivky
// (revízia doladenia 1: detail a poznámka čítajú sessionStorage truckOrderSummary, nie príplatky položky — musia sedieť)
export const KAMION = {
  znacka: "DAF (TIR)", model: "XF 2022-2025",
  extras: { prevodovka: "Automatická prevodovka" },
  selectedMaterial: "Prémiová syntetická koža – prešívaná", selectedColor: { code: "11" }, selectedLemovanie: { code: "04" },
  nasivkyPlacement: "boky+stred", selectedNasivka: { code: "H19" }, selectedNitColor: { code: "2999" },
  selectedStredNasivka: { code: "H19" }, selectedStredNitColor: { code: "2999" },
  doorPanelChoice: "ano", doorSameAsCarpet: { material: true, lemovanie: true }, doorWantsNasivka: false,
};

const uloz = (s, data) => s.ev(`(function (d) { Object.keys(d).forEach(function (k) { sessionStorage.setItem(k, d[k]); }); return 1; })(${JSON.stringify(data)})`);
const pocet = (text, co) => String(text).split(co).length - 1;

/** Rozpis setu v súhrne (cart.js changeDescription): riadky ul.lcd-rozpis. */
const rozpis = (s) => s.ev(`Array.prototype.map.call(document.querySelectorAll("#summary-box ul.lcd-rozpis li"), function (l) { return l.textContent.replace(/\\s+/g, " ").trim(); })`);

export const SCENARE = {
  S8: {
    len: "sk",
    popis: "Set autokobercov (SK 598): rozpis v súhrne aj po zmene platby, termín doručenia, varchar1–3 a model v tele objednávky",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set" });
      const id = ID.sk;
      await naKrok2(s, { query: "&lcddoplnok=0", pred: (k) => uloz(k, AUTO) });
      let r = await rozpis(s);
      over(r.some((x) => /Auto/.test(x) && /Skoda Octavia 2020/.test(x)) && r.some((x) => /Diamond/.test(x)) && r.some((x) => /rozloženie/i.test(x)),
        "rozpis setu v súhrne neúplný: " + JSON.stringify(r));
      const termin = await s.ev(`(document.querySelector("#lcd-opc .lcd-opc-termin") || {}).textContent || ""`);
      // riadok o tovare na mieru: pri sete áno, ako samostatný odsek pod všetkými súhlasmi a nad tlačidlom
      const pravne = await s.ev(`(function () {
        var p = document.querySelector(".lcd-opc-pravne"); if (!p) return null;
        var suhlasy = document.querySelectorAll("#checkoutSidebar .consents"), posl = suhlasy[suhlasy.length - 1];
        var dalej = document.querySelector("#checkoutSidebar .next-step");
        var a = p.querySelector("a");
        return { pod: !!posl && !!(posl.compareDocumentPosition(p) & 4), nad: !!dalej && !!(p.compareDocumentPosition(dalej) & 4),
          text: p.textContent.replace(/\\s+/g, " ").trim(), href: a && a.getAttribute("href"), ciel: a && a.getAttribute("target") };
      })()`);
      over(pravne && pravne.pod && pravne.nad, "riadok o tovare na mieru pri sete chýba alebo nie je medzi súhlasmi a tlačidlom: " + JSON.stringify(pravne));
      // znenie z VOP 6.13 s odkazom na obchodné podmienky v novej karte (Michal 29. 10.)
      over(/po začatí výroby/.test(pravne.text) && /bod 6\.13\.$/.test(pravne.text) && pravne.href === "/obchodne-podmienky/" && pravne.ciel === "_blank",
        "riadok o tovare na mieru bez znenia / odkazu VOP 6.13: " + JSON.stringify(pravne));
      // termín bez dátumov (Michal 29. 10.)
      over(termin === "Doručenie do 21–29\u00a0dní", "termín doručenia pri sete: " + JSON.stringify(termin));
      await zvolPlatbu(s, id.dobierka);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene" && /Dobierkou/.test(st.platbaSuhrn), "dobierka pri sete: " + JSON.stringify(st));
      await pauza(300);
      r = await rozpis(s);
      over(r.some((x) => /Skoda Octavia 2020/.test(x)) && r.some((x) => /Diamond/.test(x)), "po obnove súhrnu zmizol rozpis: " + JSON.stringify(r));
      await vyplnUdaje(s);
      await suhlas(s);
      const z2 = await objednaj(s);
      const m = overTeloObjednavky(s, z2[0]);
      over((m.get("varchar1") || [])[0] === "left" && (m.get("varchar2") || [])[0] === "pass-5" && (m.get("varchar3") || [])[0] === "doors-4",
        "varchar1–3 v tele: " + JSON.stringify([m.get("varchar1"), m.get("varchar2"), m.get("varchar3")]));
      const remark = (m.get("remark") || [""])[0];
      over(pocet(remark, "model: " + AUTO.model) === 1, "poznámka bez modelu: " + JSON.stringify(remark));
      return { step2: true, info: "rozpis " + r.length + " riadkov aj po obnove, " + termin + ", varchar1–3 + poznámka „" + remark + "“" };
    },
  },
  S9: {
    len: "sk",
    popis: "Set + odoslanie 2× (chyba zo servera, potom OK): „model: …“ v poznámke práve raz, ručný text ostáva",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "set", scenar: { step2: "chyba-raz" } });
      await naKrok2(s, { query: "&lcddoplnok=0", pred: (k) => uloz(k, AUTO) });
      await vyplnUdaje(s);
      await s.ev(`(function () { var c = document.getElementById("add-note"); if (c && !c.checked) c.click(); return 1; })()`);
      await s.cakaj(`(function () { var r = document.getElementById("remark"); var b = r && r.getBoundingClientRect(); return !!(b && b.height > 0); })()`, { popis: "pole poznámky" });
      const rucna = "Prosím, zavolajte pred doručením.";
      await s.pis("#remark", rucna);
      await suhlas(s);
      let z2 = await objednaj(s);
      // podvrh: prvý Step2Validate -> 302 späť na krok 2 s vyplnenými údajmi (❓ ako Shoptet vracia chybu zo servera)
      await s.cakaj(`location.pathname === "${KROK2}" && document.readyState === "complete" && !!document.getElementById("order-form")`, { popis: "krok 2 po chybe" });
      await s.pripravene("krok 2 po chybe");
      const st = await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/, "krok 2 po chybe");
      await s.odmietniCookies();
      over(st.stav === "krok2-potvrdene", "po chybe sa sekcia nepostavila znova: " + st.stav);
      const prve = (poleTela(z2[0]).get("remark") || [""])[0];
      await suhlas(s);
      z2 = await objednaj(s, { n: 2 });
      const m = overTeloObjednavky(s, z2[1]);
      const remark = (m.get("remark") || [""])[0];
      over(pocet(remark, "model: " + AUTO.model) === 1, "„model: …“ v poznámke " + pocet(remark, "model: ") + "×: " + JSON.stringify(remark));
      over(remark.includes(rucna), "ručný text z poznámky zmizol: " + JSON.stringify(remark));
      return { step2: true, info: "1. poznámka " + JSON.stringify(prve) + " -> 2. " + JSON.stringify(remark) };
    },
  },
  S10: {
    len: "sk",
    popis: "Kamión 640: blok [KONFIGURÁCIA KAMIÓNA] v poznámke, žiadne varchar1–3, termín 14–25 dní",
    async fn(J) {
      const s = await J.novaStranka({ kosik: "kamion" });
      const zhrnutie = buildTruckOrderSummary(KAMION, "sk");
      await naKrok2(s, { query: "&lcddoplnok=0", pred: (k) => uloz(k, { truckOrderSummary: zhrnutie, truckVehicle: "DAF (TIR) XF 2022-2025", wheelPosition: "left", seatPosition: "pass-5", doorPosition: "doors-4" }) });
      const d = await s.ev(`({ kamion: !!document.querySelector("#summary-box .lcd-truck-cart-summary"), termin: (document.querySelector("#lcd-opc .lcd-opc-termin") || {}).textContent || "",
        varchar: document.querySelectorAll("#order-form [name^=varchar]").length })`);
      over(d.kamion, "súhrn bez rozpisu kamióna");
      over(d.varchar === 0, "pri kamióne sú v stránke varchar polia: " + d.varchar);
      const ocak = "Doručenie do 14–25\u00a0dní"; // bez dátumov (Michal 29. 10.)
      over(d.termin === ocak, "termín kamióna " + JSON.stringify(d.termin) + " ≠ " + ocak);
      await vyplnUdaje(s);
      await suhlas(s);
      const z2 = await objednaj(s);
      const m = overTeloObjednavky(s, z2[0]);
      over(!["varchar1", "varchar2", "varchar3"].some((k) => m.has(k)), "kamión: v tele sú varchar polia");
      const remark = (m.get("remark") || [""])[0];
      over(remark.includes("[KONFIGURÁCIA KAMIÓNA]") && remark.includes("[/KONFIGURÁCIA KAMIÓNA]"), "poznámka bez bloku kamióna: " + JSON.stringify(remark.slice(0, 120)));
      return { step2: true, info: d.termin + ", bez varchar1–3, poznámka s blokom kamióna (" + remark.length + " znakov)" };
    },
  },
  S12: {
    len: "cz",
    popis: "CZ: 150 Kč, Dobírka 50 Kč, text tlačidla CZ, language=cs, blok [KONFIGURACE KAMIONU] v poznámke",
    async fn(J) {
      const s = await J.novaStranka();
      const id = ID.cz;
      await naKrok2(s, { pred: (k) => uloz(k, { truckOrderSummary: buildTruckOrderSummary(KAMION, "cs") }) });
      const d = await s.ev(`(function () {
        var t = function (sel) { var e = document.querySelector(sel); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; };
        return { doprava: t('#lcd-opc label[for="shippingId-${id.doprava}"] .payment-shipping-price'), dobirka: t('#lcd-opc label[for="billingId-${id.dobierka}"] .payment-shipping-price'),
          dobirkaNazov: t('#lcd-opc label[for="billingId-${id.dobierka}"] .shipping-billing-name'), tlacidlo: t("#submit-order"),
          nadpisy: Array.prototype.map.call(document.querySelectorAll("#lcd-opc h2"), function (h) { return h.textContent.trim(); }),
          kroky: Array.prototype.map.call(document.querySelectorAll("ol.cart-header li.step:not([hidden])"), function (l) { return l.textContent.replace(/\\s+/g, " ").trim(); }) };
      })()`);
      over(d.doprava === "150 Kč" && d.dobirka === "50 Kč" && d.dobirkaNazov === "Dobírka", "CZ ceny: " + JSON.stringify(d));
      over(d.tlacidlo === "Objednat s povinností platby", "CZ tlačidlo „" + d.tlacidlo + "“");
      over(JSON.stringify(d.nadpisy) === JSON.stringify(["Doprava", "Platba"]) && d.kroky.length === 2 && /Objednávka/.test(d.kroky[1]), "CZ nadpisy a kroky: " + JSON.stringify(d));
      s.p.reset();
      await zvolPlatbu(s, id.dobierka);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      const x = step1Xhr(s);
      over(st.stav === "krok2-potvrdene" && x.length === 1 && x[0].pole.language === "cs" && x[0].pole.billingId === id.dobierka, "CZ dobírka: " + JSON.stringify([st.stav, x.map((y) => y.telo)]));
      over(st.celkom === "300 Kč", "CZ celkem " + st.celkom);
      await vyplnUdaje(s);
      await suhlas(s);
      const z2 = await objednaj(s);
      const m = overTeloObjednavky(s, z2[0]);
      const remark = (m.get("remark") || [""])[0];
      over(remark.includes("[KONFIGURACE KAMIONU]"), "CZ poznámka bez [KONFIGURACE KAMIONU]: " + JSON.stringify(remark.slice(0, 80)));
      return { step2: true, info: d.doprava + ", " + d.dobirkaNazov + " " + d.dobirka + ", „" + d.tlacidlo + "“, language=cs, celkem " + st.celkom };
    },
  },
};
