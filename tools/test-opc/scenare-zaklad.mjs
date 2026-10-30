// Scenáre brány a prechodu z košíka (kniha OPC § 7.6): S2, S17, S20. Každý scenár dostane J (tools/test-opc.mjs)
// a vráti { info } alebo hodí Zlyhanie. Kontroly spoločné pre všetky (nečakané požiadavky, chyby nášho kódu
// v konzole, žiadny Step2Validate bez scenára) robí spúšťač.
import { over, pauza, OPC, FLAG_OPC } from "./pomocnik.mjs";

const KOSIK = "/kosik/", KROK1 = "/objednavka/krok-1/", KROK2 = "/objednavka/krok-2/";

/** Stopa nášho modulu na stránke: globál, triedy, atribúty, flag v karte. */
async function stopaOpc(s) {
  return s.ev(`(function () {
    var flag = ${FLAG_OPC};
    return {
      globalne: typeof window.__lcdOpc !== "undefined",
      stav: window.__lcdOpc ? window.__lcdOpc.stav : null,
      prvky: document.querySelectorAll('[class*="lcd-opc"], [id^="lcd-opc"], [data-lcd-opc], [data-lcd-opc-caka]').length,
      triedyHtml: document.documentElement.className.split(/\\s+/).filter(function (c) { return /opc/i.test(c); }),
      flag: flag,
      udalosti: (window.dataLayer || []).filter(function (x) { return x && /^lcd_opc_/.test(x.event || ""); }).map(function (x) { return x.event; }),
    };
  })()`);
}

/** Dnešný tok bez modulu: košík -> krok 1 (zobrazí sa) -> natívne Pokračovať -> krok 2. */
async function dnesnyTok(s, popis) {
  const p = s.p;
  const st = await stopaOpc(s);
  over(!st.globalne && st.prvky === 0 && !st.triedyHtml.length && !st.udalosti.length,
    popis + ": modul OPC na košíku niečo spravil: " + JSON.stringify(st));
  over(p.zaznam.www.filter((z) => z.cesta === KROK1).length === 0, popis + ": košík sťahoval krok 1 na pozadí: " + s.dokumenty().join(", "));
  const href = await s.ev(`(document.getElementById("continue-order-button") || {}).getAttribute ? document.getElementById("continue-order-button").getAttribute("href") : null`);
  over(href === KROK1, popis + ": „Pokračovať“ v košíku má href " + href);
  // bundle na košíku naozaj beží (inak by „nič nemení“ nič nedokazovalo)
  over(p.zaznam.podvrhnute.some((x) => /luxuryCar\.js$/.test(x)), popis + ": lokálny bundle sa nenačítal");
  await s.odmietniCookies();
  p.reset();
  await s.klikni("#continue-order-button", { popis: "Pokračovať (košík)" });
  await s.cakajNaStranku(KROK1, "in-krok-1");
  over(p.zaznam.step1.length === 0, popis + ": z košíka odišiel Step1Validate (" + p.zaznam.step1.length + "×)");
  const doc = s.dokumenty();
  over(doc[0] === "GET " + KROK1 + " -> krok1", popis + ": po kliku sa neotvoril krok 1: " + doc.join(", "));
  const st1 = await stopaOpc(s);
  over(!st1.globalne && st1.prvky === 0, popis + ": modul OPC na kroku 1: " + JSON.stringify(st1));
  over(await s.ev(`!!document.querySelector('input[name="billingId"]:checked') && !!document.querySelector('input[name="shippingId"]:checked')`), popis + ": krok 1 bez zvolenej dopravy/platby");
  // natívny formulár kroku 1 (Shoptet): POST Step1Validate (nie XHR) -> 302 -> krok 2
  p.reset();
  await s.klikni("#orderFormButton", { popis: "Pokračovať (krok 1)" });
  await s.cakajNaStranku(KROK2, "in-krok-2");
  over(p.zaznam.step1.length === 1 && !p.zaznam.step1[0].xhr, popis + ": krok 1 neposlal 1 natívny Step1Validate: " + JSON.stringify(p.zaznam.step1.map((x) => ({ xhr: x.xhr, telo: x.telo }))));
  const st2 = await stopaOpc(s);
  over(!st2.globalne && st2.prvky === 0, popis + ": modul OPC na kroku 2: " + JSON.stringify(st2));
  return "košík -> krok 1 -> (" + p.zaznam.step1[0].telo + ") -> krok 2";
}

/** Košík s tajným odkazom (?opc=KÓD) pripravený: modul stiahol krok 1 a pozná voľby. */
async function kosikSOpc(s) {
  await s.chod(KOSIK + OPC, { popis: "košík s kódom OPC" });
  await s.cakaj(`window.__lcdOpc && (window.__lcdOpc.stav === "kosik-pripraveny" || window.__lcdOpc.stav === "kosik-bez-krok1")`, { ms: 10000, popis: "modul OPC na košíku" });
  const st = await stopaOpc(s);
  over(st.stav === "kosik-pripraveny", "modul OPC na košíku: " + JSON.stringify(st));
  over(st.flag === "1", "kód nezapísal flag (lcdOpc = " + st.flag + ")");
  over(await s.ev(`localStorage.getItem("lcdOpc") === "1"`), "flag nie je v localStorage (platí len pre kartu)");
  await s.odmietniCookies();
}

/** Klik na Pokračovať (alebo lištu na telefóne) -> Step1Validate XHR -> rovno krok 2. Vráti popis. */
async function prechodNaKrok2(s, { lista = false } = {}) {
  const p = s.p;
  const pred = p.predvolene();
  p.reset();
  const sel = lista ? ".lcd-lista__btn" : "#continue-order-button";
  await s.klikni(sel, { popis: lista ? "Pokračovať v lište" : "Pokračovať (košík)" });
  await s.cakajNaStranku(KROK2, "in-krok-2");
  const s1 = p.zaznam.step1;
  over(s1.length === 1, "Step1Validate " + s1.length + "× (čakal som 1): " + JSON.stringify(s1.map((x) => x.telo)));
  over(s1[0].xhr, "Step1Validate nebol XHR (X-Requested-With chýba)");
  over(s1[0].pole.shippingId === pred.doprava && s1[0].pole.billingId === pred.platba,
    `Step1Validate doprava/platba ${s1[0].pole.shippingId}/${s1[0].pole.billingId} ≠ krok 1 Shoptetu ${pred.doprava}/${pred.platba}`);
  over(s1[0].pole.language === s.W.jazyk, "Step1Validate language " + s1[0].pole.language + " ≠ " + s.W.jazyk);
  const doc = s.dokumenty();
  over(!doc.some((d) => d.startsWith("GET " + KROK1)), "krok 1 sa otvoril ako stránka: " + doc.join(", "));
  over(doc.filter((d) => d.startsWith("GET " + KROK2)).length === 1, "krok 2 sa nenačítal práve raz: " + doc.join(", "));
  over(doc.length === 1, "načítaní stránky po kliku " + doc.length + " (čakal som 1): " + doc.join(", "));
  const st = await stopaOpc(s);
  over(/^krok2-/.test(st.stav || ""), "modul OPC na kroku 2: " + JSON.stringify(st));
  over(st.udalosti.includes("lcd_opc_zobrazenie"), "dataLayer bez lcd_opc_zobrazenie na kroku 2");
  return s1[0].telo;
}

export const SCENARE = {
  S2: {
    popis: "Košík -> Pokračovať: Step1Validate XHR -> priamo krok 2, 1 načítanie (telefón: tlačidlo v lište)",
    async fn(J) {
      const s = await J.novaStranka();
      await kosikSOpc(s);
      // telefón: lišta dole je viditeľná, keď „Pokračovať“ nie je na obrazovke (lcdKosikDoplnok listaKosika)
      // krátky košík: „Pokračovať“ je na obrazovke a lišta sa neukáže -> na telefóne ju zapneme ako pri dlhom košíku,
      // aby sa overil aj prechod cez odkaz v lište (lcdKosikDoplnok listaKosika)
      let lista = false;
      if (s.mobil) {
        lista = await s.ev(`(function () { window.scrollTo(0, 0); var l = document.querySelector(".lcd-lista__btn"); if (!l) return false;
          document.documentElement.classList.add("lcd-lista-on"); return true; })()`);
        over(lista && (await s.viditelne(".lcd-lista__btn")), "na telefóne chýba lišta košíka s „Pokračovať“");
      }
      const telo = await prechodNaKrok2(s, { lista: !!lista });
      return { info: (lista ? "lišta" : "tlačidlo") + " -> Step1Validate " + telo + " -> krok 2 (1 načítanie)" };
    },
  },
  S17: {
    popis: "?opc=0 / bez flagu / ?opc=1 (bez kódu) / data.json \"opc\": false -> presne dnešný tok (krok 1 sa zobrazí), modul nič nemení; kód platí aj v ďalšej karte",
    async fn(J) {
      const casti = [];
      // a) bez flagu (SPUSTENE = false)
      let s = await J.novaStranka();
      await s.chod(KOSIK, { popis: "košík bez flagu" });
      casti.push("bez flagu: " + (await dnesnyTok(s, "bez flagu")));
      await s.zavri();
      // a2) ?opc=1 (prototyp) už nič nezapne
      s = await J.novaStranka({ bezOpc: true });
      await s.chod(KOSIK + "?opc=1", { popis: "košík ?opc=1 (bez kódu)" });
      casti.push("?opc=1: " + (await dnesnyTok(s, "?opc=1 bez kódu")));
      await s.zavri();
      // b) kód (kontrola, že modul v bundli je a zapne sa), ďalšia karta bez parametra = zapnuté (localStorage),
      //    potom ?opc=0 v tej istej karte
      s = await J.novaStranka({ bezOpc: true });
      await kosikSOpc(s);
      await s.zavri();
      s = await J.novaStranka();
      await s.chod(KOSIK, { popis: "košík v ďalšej karte bez parametra" });
      await s.cakaj(`window.__lcdOpc && /^kosik-(pripraveny|bez-krok1)$/.test(window.__lcdOpc.stav)`, { ms: 10000, popis: "OPC v ďalšej karte (flag z localStorage)" });
      s.p.reset();
      await s.chod(KOSIK + "?opc=0", { popis: "košík ?opc=0" });
      const fl = await s.ev(`[localStorage.getItem("lcdOpc"), sessionStorage.getItem("lcdOpc")]`);
      over(fl[0] === null && fl[1] === null, "?opc=0 nezmazal flag (localStorage, sessionStorage = " + JSON.stringify(fl) + ")");
      casti.push("kód -> ďalšia karta zapnutá -> ?opc=0: " + (await dnesnyTok(s, "?opc=0")));
      await s.zavri();
      // c) núdzový vypínač data.json "opc": false má prednosť aj pred kódom
      s = await J.novaStranka({ scenar: { dataJson: { opc: false } }, bezOpc: true });
      await s.chod(KOSIK + OPC, { popis: "košík s kódom, data.json opc:false" });
      casti.push("data.json opc:false + kód: " + (await dnesnyTok(s, "data.json opc:false")));
      await s.zavri();
      return { info: casti.join(" | ") };
    },
  },
  S7K: {
    popis: "Košík, keď krok 1 nejde prečítať (zmenené HTML) alebo Step1Validate vráti 500 / neodpovie -> dnešný tok (krok 1)",
    async fn(J) {
      const casti = [];
      for (const [nazov, scenar, step1] of [["zmenené HTML kroku 1", { krok1: "zmenene" }, 0], ["Step1Validate 500", { step1: "500" }, 1], ["Step1Validate neodpovie (limit 8 s)", { step1: "limit" }, 1]]) {
        const s = await J.novaStranka({ scenar });
        await s.chod(KOSIK + OPC, { popis: "košík s kódom OPC (" + nazov + ")" });
        await s.cakaj(`window.__lcdOpc && /^kosik-(pripraveny|bez-krok1)$/.test(window.__lcdOpc.stav)`, { ms: 10000, popis: "modul OPC na košíku" });
        await s.odmietniCookies();
        // zmenené HTML: krok 1 sa pri záchrane zobrazí natívne (podvrh ho vráti zmenený, stránka je stále krok 1)
        s.p.reset();
        await s.klikni("#continue-order-button", { popis: "Pokračovať (košík)" });
        await s.cakajNaStranku(KROK1, "in-krok-1", { ms: 20000 });
        const xhr = s.p.zaznam.step1.filter((x) => x.xhr).length;
        over(xhr === step1, nazov + ": Step1Validate XHR " + xhr + "× (čakal som " + step1 + ")");
        const doc = s.dokumenty();
        over(doc.some((d) => d.startsWith("GET " + KROK1)), nazov + ": záchrana neotvorila krok 1: " + doc.join(", "));
        over(!doc.some((d) => d.startsWith("GET " + KROK2)), nazov + ": otvoril sa krok 2: " + doc.join(", "));
        casti.push(nazov + " -> krok 1");
        await s.zavri();
      }
      return { info: casti.join(" | ") };
    },
  },
  S20: {
    popis: "Späť v prehliadači z kroku 2 -> košík, nie rozbitý krok 1",
    async fn(J) {
      const s = await J.novaStranka();
      await kosikSOpc(s);
      await prechodNaKrok2(s);
      const p = s.p;
      p.reset();
      await s.ev(`history.back()`);
      await s.cakaj(`location.pathname === "${KOSIK}" && document.body && document.body.classList.contains("in-kosik") && document.readyState === "complete"`, { popis: "košík po Späť" });
      await pauza(1500);
      const doc = s.dokumenty();
      over(!doc.some((d) => d.startsWith("GET " + KROK1)), "Späť otvoril krok 1: " + doc.join(", "));
      const st = await s.ev(`(function () {
        var b = document.getElementById("continue-order-button");
        return { tlacidlo: !!b, href: b && b.getAttribute("href"), caka: document.querySelectorAll("[data-lcd-opc-caka], [aria-busy=true]#continue-order-button").length,
          stav: window.__lcdOpc ? window.__lcdOpc.stav : null, polozky: document.querySelectorAll("#cart-wrapper .cart-table tr.removeable, #cart-wrapper [data-testid^=productItem]").length };
      })()`);
      over(st.tlacidlo && st.href === KROK1, "košík po Späť bez „Pokračovať“: " + JSON.stringify(st));
      over(st.caka === 0, "košík po Späť ostal zamknutý (čaká na prechod): " + JSON.stringify(st));
      over(st.polozky > 0, "košík po Späť bez položiek: " + JSON.stringify(st));
      const zdroj = doc.length ? "nové načítanie /kosik/" : "bfcache";
      // košík po Späť funguje: znova Pokračovať -> krok 2
      await prechodNaKrok2(s);
      return { info: "krok 2 -> Späť -> košík (" + zdroj + ", stav " + st.stav + ") -> znova Pokračovať -> krok 2" };
    },
  },
};
