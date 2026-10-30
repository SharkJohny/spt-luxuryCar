// Scenáre zo živého dôkazu a skeptického overenia (28./29. 10. 2026, bez objednávok): S28–S36. Každý stráži jedno
// zistenie z dôkazu (kniha OPC § 10.6): prísne kritérium Step1Validate, zámok pri odoslaní (T3-L7), resync pred
// odoslaním (T5b, T6b), potvrdenie cez GET kroku 1 a analytika (T9a, T12). Údaje zákazníka sú vymyslené, odoslanie
// ide len do podvrhu (tools/test-opc/podvrh.mjs), do Shoptetu neodíde nič.
import {
  KOSIK, KROK1, KROK2, ID, ZAKAZNIK, stavOpc, cakajOpc, naKrok2, zvolPlatbu, vyplnUdaje, suhlas, objednaj, overTeloObjednavky, step1Xhr,
  videnaPlatba, nazovPlatby, over, pauza, OPC,
} from "./krok2-pomoc.mjs";
import { JSDOM } from "jsdom";
import { payloadUdalosti, typPlatby } from "../../assets/js/opc/analytika.js";
import { krok1Model } from "../../assets/js/opc/krok1Model.js";

const T_TLACIDLO = { sk: "objednať s povinnosťou platby", cz: "objednat s povinností platby" }; // viditeľný text malými (CSS dáva veľké)
const T_ODOSIELAM = { sk: "odosielam…", cz: "odesílám…" };

/** Zámok pri odoslaní: sekcia, rádiá, viditeľný text tlačidla, fáza odosielania v module. */
const stavZamku = (s) => s.ev(`(function () {
  var sek = document.getElementById("lcd-opc"), b = document.getElementById("submit-order");
  var r = sek ? Array.prototype.slice.call(sek.querySelectorAll("input[data-lcd-opc]")) : [];
  var k = window.__lcdOpc && window.__lcdOpc.krok2;
  return { zamknute: !!(sek && sek.classList.contains("lcd-opc-zamknute")), radiaVypnute: r.length > 0 && r.every(function (i) { return i.disabled; }),
    tlacidlo: b ? b.innerText.toLowerCase().replace(/\\s+/g, " ").trim() : null, odosielanie: k && k.odosielanie ? k.odosielanie() : null };
})()`);
const T_ODOSIELA = { sk: "Objednávka sa odosiela…", cz: "Objednávka se odesílá…" };
/** Výsledný štýl zámku (getComputedStyle): opacity a kurzor sekcie, opacity tlačidla, sivá hláška v sekcii. */
const stylZamku = (s) => s.ev(`(function () {
  var sek = document.getElementById("lcd-opc"), b = document.getElementById("submit-order"), h = sek && sek.querySelector(".lcd-opc-hlaska");
  var c = sek ? getComputedStyle(sek) : null;
  return { sekcia: c ? Number(c.opacity) : null, kurzor: c ? c.cursor : null, tlacidlo: b ? Number(getComputedStyle(b).opacity) : null,
    hlaska: h && !h.hidden ? h.textContent.replace(/\\s+/g, " ").trim() : "", hlaskaInfo: !!(h && h.classList.contains("lcd-opc-hlaska--info")) };
})()`);
/** Klik myšou (CDP) do stredu prvku bez kontroly prekrytia — ako zákazník, aj keď je prvok zamknutý (inert). */
async function klikMysou(s, sel) {
  const b = await s.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
    e.scrollIntoView({ block: "center", behavior: "instant" }); var r = e.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  over(b, "nenájdené: " + sel);
  await pauza(150);
  if (s.mobil) await s.k.tuk(b.x, b.y); else await s.k.klik(b.x, b.y);
}
/** Volania gtag('event', udalost, payload) v dataLayer stránky (gtag Shoptetu pushuje arguments) -> [payload]. */
const gtagy = (s, udalost) => s.ev(`(window.dataLayer || []).filter(function (x) { return x && typeof x === "object" && x[0] === "event" && x[1] === ${JSON.stringify(udalost)}; })
  .map(function (x) { return JSON.parse(JSON.stringify(x[2] || {})); })`);
/** begin_checkout z inline skriptu kroku 1 podvrhu (to, čo by poslal natívny krok 1). */
const payloadKroku1 = (s) => payloadUdalosti(s.p.subor("krok1.html"), "begin_checkout");
/** payment_type platby v tvare Shoptetu (data-payment-type~názov) z kroku 1 podvrhu. */
const typPlatbyWebu = (s, id) => {
  const m = krok1Model(null, { doc: new JSDOM(s.p.subor("krok1.html")).window.document });
  return typPlatby((m.platby || []).find((p) => p.id === String(id)));
};
/** Vlastná udalosť lcd_opc_platba v dataLayer (add_payment_info sa nedalo poslať) -> ["<id>:<typ>"]. */
const vlastnaPlatba = (s) => s.ev(`(window.dataLayer || []).filter(function (x) { return x && x.event === "lcd_opc_platba"; }).map(function (x) { return x.lcd_opc_platba + ":" + x.lcd_opc_typ; })`);
/** Hláška pri tlačidle a jej odkaz (cesta ďalej): { text, odkaz } ; skrytá = prázdny text. */
const cakamSOdkazom = (s) => s.ev(`(function () { var e = document.querySelector(".lcd-opc-cakam"); if (!e || e.hidden) return { text: "", odkaz: null };
  var a = e.querySelector("a[href]"); return { text: e.textContent.replace(/\\s+/g, " ").trim(), odkaz: a ? a.getAttribute("href") : null }; })()`);
/** Text pri tlačidle „Objednať“ (prázdne = skrytý). */
const cakamText = (s) => s.ev(`(function () { var e = document.querySelector(".lcd-opc-cakam"); return e && !e.hidden ? e.textContent.replace(/\\s+/g, " ").trim() : ""; })()`);

export const SCENARE = {
  S28: {
    popis: "Step1Validate 303 s messages.errors je neúspech: košík ide na klasický krok 1, zmena platby na kroku 2 sa nepotvrdí (aj pri returnUrl krok 2)",
    async fn(J) {
      // a) košík: živý tvar odmietnutia (303 + errors + returnUrl krok 1) aj umelý (returnUrl krok 2) -> dnešný tok
      let s;
      for (const step1 of ["chyby", "chyby-krok2"]) {
        s = await J.novaStranka({ scenar: { step1 } });
        await s.chod(KOSIK + OPC, { popis: "košík s kódom OPC" });
        await s.cakaj(`window.__lcdOpc && window.__lcdOpc.stav === "kosik-pripraveny"`, { ms: 10000, popis: "modul OPC na košíku" });
        await s.odmietniCookies();
        s.p.reset();
        await s.klikni("#continue-order-button", { popis: "Pokračovať (košík)" });
        await s.cakajNaStranku(KROK1, "in-krok-1");
        const doc = s.dokumenty();
        over(step1Xhr(s).length === 1 && !doc.some((d) => /krok-2/.test(d)), step1 + ": košík pri 303 s chybami: " + doc.join(", ") + " / Step1Validate " + step1Xhr(s).length + "×");
        await s.zavri();
      }
      // b) krok 2: dobierka -> 303 + errors + returnUrl krok 2 (umelý prípad): nepotvrdí sa, ostane prevod, objednávka s prevodom
      s = await J.novaStranka({ scenar: { step1: (n, o) => (o.billingId === ID[J.web].dobierka ? "chyby-krok2" : "ok") } });
      const id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      await zvolPlatbu(s, id.dobierka);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-chyba" && st.platbaUI === id.prevod && st.potvrdene.platba === id.prevod, "303 s chybami sa vzal ako úspech: " + JSON.stringify(st));
      over(step1Xhr(s).length === 1, "odmietnutý Step1Validate sa opakoval: " + step1Xhr(s).length + "×");
      const typ = await s.ev(`(window.dataLayer || []).filter(function (x) { return x && x.event === "lcd_opc_chyba"; }).map(function (x) { return x.lcd_opc_typ; }).join(",")`);
      over(/platba-chyby/.test(typ), "chyba nie je odmietnutie servera (lcd_opc_typ " + typ + ")");
      const z = await objednaj(s);
      overTeloObjednavky(s, z[0]);
      over(z[0].platba === id.prevod, "objednávka s platbou " + z[0].platba);
      return { step2: true, info: "košík -> klasický krok 1; krok 2: dobierka odmietnutá (errors), ostal prevod, objednávka s prevodom" };
    },
  },
  S29: {
    popis: "Zámok pri odoslaní (T3-L7): počas čakania na overenie telefónu sa platba nedá zmeniť; po chybe telefónu, pri návrate (pageshow) a po 20 s sa odomkne",
    async fn(J) {
      const casti = [];
      // a) pomalé overenie telefónu (1,5 s): klik Objednať, počas čakania klik na dobierku -> nič sa nezmení
      let s = await J.novaStranka();
      let id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.scenar.telefon = "pomaly";
      s.p.reset();
      await s.pis("#phone", ZAKAZNIK[s.web].telefon.replace(/0$/, "1")); // zmena čísla -> Shoptet overuje telefón 1,5 s
      for (let i = 0; i < 30 && !s.p.zaznam.www.some((x) => /ShoptetValidatePhone/.test(x.cesta)); i++) await pauza(50);
      const tel = s.p.zaznam.www.filter((x) => /ShoptetValidatePhone/.test(x.cesta));
      over(tel.length >= 1 && !tel[tel.length - 1].odpovedCas, "podvrh: overenie telefónu nebeží (" + JSON.stringify(tel) + ")");
      const videna = await videnaPlatba(s);
      const tKlik = Date.now();
      await s.klikni("#submit-order", { popis: "Objednať (telefón sa overuje)" });
      await s.cakaj(`!!document.querySelector("#lcd-opc.lcd-opc-zamknute")`, { ms: 3000, popis: "zamknutá sekcia po kliku" });
      const zamok = await stavZamku(s);
      await pauza(250); // prechod opacity .15 s
      const vidno = await stylZamku(s);
      over(s.p.zaznam.step2.length === 0, "objednávka odišla skôr, než Shoptet overil telefón (podvrh nespomalil overenie)");
      await klikMysou(s, `#lcd-opc label[for="billingId-${id.dobierka}"]`);
      await pauza(250);
      const pocas = await stavOpc(s);
      over(pocas.platbaUI === id.prevod && pocas.vybrane.platba === id.prevod, "počas odosielania sa platba zmenila: " + JSON.stringify(pocas));
      const z = await objednaj(s, { klik: false, ms: 6000 });
      over(z.length === 1 && z[0].platba === id.prevod && nazovPlatby(s, z[0].platba).toLowerCase() === String(videna.suhrn).toLowerCase(), "Step2Validate: " + JSON.stringify(z.map((x) => x.platba)) + ", súhrn „" + videna.suhrn + "“");
      const x = step1Xhr(s).map((y) => y.pole.billingId);
      over(!x.includes(id.dobierka) && x.every((b) => b === id.prevod), "Step1Validate počas odosielania " + JSON.stringify(x) + " (dobierka nesmie odísť)");
      over(zamok.zamknute && zamok.radiaVypnute && zamok.tlacidlo === T_ODOSIELAM[s.web], "zámok počas odosielania: " + JSON.stringify(zamok));
      // výsledný štýl, nie len trieda (revízia: komentár // v CSS zahodil pravidlá zámku): sekcia stlmená, „Odosielam…“
      // plne zelené, v sekcii sivé vysvetlenie (telefón: Shoptet posunie stránku k telefónu, tlačidlo je mimo obrazovky)
      over(Math.abs(vidno.sekcia - 0.55) < 0.02 && vidno.kurzor === "progress", "zamknutá sekcia nie je stlmená: " + JSON.stringify(vidno));
      over(vidno.tlacidlo === 1, "tlačidlo „Odosielam…“ je bledé (opacity " + vidno.tlacidlo + ")");
      over(vidno.hlaska === T_ODOSIELA[s.web] && vidno.hlaskaInfo, "v zamknutej sekcii chýba vysvetlenie: " + JSON.stringify(vidno));
      casti.push("telefón 1,5 s: Step2Validate " + (z[0].cas - tKlik) + " ms po kliku, klik na dobierku nič nezmenil, 1× s prevodom");
      await s.zavri();
      // b) neplatný telefón (overenie 1,5 s): ShoptetFailedValidation -> odomknuté, platba sa dá zmeniť, nič neodišlo
      s = await J.novaStranka();
      id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.scenar.telefon = "pomaly-neplatny";
      await s.pis("#phone", ZAKAZNIK[s.web].telefon.replace(/0$/, "2"));
      s.p.reset();
      await s.klikni("#submit-order", { popis: "Objednať (neplatný telefón)" });
      await s.cakaj(`!document.querySelector("#lcd-opc.lcd-opc-zamknute")`, { ms: 6000, popis: "odomknutie po chybe telefónu" });
      const po = await stavZamku(s);
      over(!po.zamknute && !po.radiaVypnute && po.tlacidlo === T_TLACIDLO[s.web], "po chybe telefónu ostal zámok: " + JSON.stringify(po));
      await zvolPlatbu(s, id.dobierka);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene" && st.potvrdene.platba === id.dobierka, "po chybe telefónu sa platba nedala zmeniť: " + JSON.stringify(st));
      over(s.p.zaznam.step2.length === 0, "s neplatným telefónom odišla objednávka");
      casti.push("neplatný telefón: odomknuté, dobierka potvrdená");
      await s.zavri();
      // c) overenie telefónu visí: návrat (pageshow) odomkne; bezpečnostný limit 20 s odomkne
      s = await J.novaStranka();
      id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.scenar.telefon = "visi";
      await s.pis("#phone", ZAKAZNIK[s.web].telefon.replace(/0$/, "3"));
      s.p.reset();
      await s.klikni("#submit-order", { popis: "Objednať (telefón visí)" });
      await s.cakaj(`!!document.querySelector("#lcd-opc.lcd-opc-zamknute")`, { ms: 3000, popis: "zámok" });
      await s.ev(`window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })), 1`);
      const poNavrate = await stavZamku(s);
      over(!poNavrate.zamknute && poNavrate.tlacidlo === T_TLACIDLO[s.web], "pageshow neodomkol: " + JSON.stringify(poNavrate));
      await pauza(1200); // Shoptet pri chybe posúva stránku k poľu telefónu (animácia) — klik až po nej
      await s.klikni("#submit-order", { popis: "Objednať znova (telefón visí)" });
      await s.cakaj(`!!document.querySelector("#lcd-opc.lcd-opc-zamknute")`, { ms: 3000, popis: "zámok 2" });
      const t0 = Date.now();
      await pauza(15000);
      over((await stavZamku(s)).zamknute, "zámok povolil skôr ako po 15 s");
      await s.cakaj(`!document.querySelector("#lcd-opc.lcd-opc-zamknute")`, { ms: 9000, popis: "bezpečnostný limit 20 s" });
      const ms = Date.now() - t0;
      over(s.p.zaznam.step2.length === 0, "objednávka odišla bez overeného telefónu");
      casti.push("telefón visí: pageshow odomkol, limit odomkol po " + (ms / 1000).toFixed(1) + " s");
      return { step2: true, info: casti.join(" | ") };
    },
  },
  S30: {
    popis: "Resync pred odoslaním (T5b): bežné odoslanie = najviac 2 požiadavky navyše a < 1 s; druhá karta prepla platbu -> objednávka s platbou, ktorú zákazník vidí",
    async fn(J) {
      // a) bežné odoslanie: Step1Validate (zobrazená voľba) + GET krok 1, potom 1× Step2Validate, spolu < 1 s
      let s = await J.novaStranka();
      let id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      await pauza(400);
      s.p.reset();
      // čas od skutočného kliku (udalosť click v stránke) po zachytený Step2Validate
      // (sessionStorage prežije prechod na stránku po objednávke v tej istej karte)
      await s.ev(`document.addEventListener("click", function (e) { if (e.target && e.target.closest && e.target.closest("#submit-order")) sessionStorage.setItem("lcdTestKlik", String(Date.now())); }, true), 1`);
      let z = await objednaj(s);
      await s.cakaj(`document.readyState === "complete" && !!sessionStorage.getItem("lcdTestKlik")`, { ms: 5000, popis: "čas kliku" });
      const klikT = Number(await s.ev(`sessionStorage.getItem("lcdTestKlik")`));
      const ms = z[0].cas - klikT;
      over(klikT > 0 && ms >= 0, "čas kliku sa nezaznamenal: " + klikT);
      const navyse = s.p.zaznam.www.filter((x) => x.cas < z[0].cas && x.typ !== "Document" && !/^\/(user|cms)\//.test(x.cesta) && !/ShoptetValidatePhone|step2CustomerAjax|CustomerCookieConsent/i.test(x.cesta));
      over(navyse.length <= 2, "bežné odoslanie pridalo " + navyse.length + " požiadaviek: " + navyse.map((x) => x.metoda + " " + x.cesta).join(", "));
      over(step1Xhr(s).length === 1 && step1Xhr(s)[0].pole.billingId === id.prevod, "resync Step1Validate: " + JSON.stringify(step1Xhr(s).map((x) => x.telo)));
      over(ms < 1000, "odoslanie trvalo " + ms + " ms (limit 1 s pri rýchlom podvrhu)");
      overTeloObjednavky(s, z[0]);
      const casti = ["bežné: " + navyse.map((x) => x.metoda + " " + x.cesta.replace(/^\/action\/orderingProcess\//i, "")).join(" + ") + " -> Step2Validate za " + ms + " ms"];
      await s.zavri();
      // b) iná karta prepla session na dobierku, táto ukazuje prevod -> resync vráti prevod, objednávka s prevodom
      s = await J.novaStranka();
      id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.stav.platba = id.dobierka; // druhá karta: Step1Validate s dobierkou (session), táto stránka o tom nevie
      s.p.reset();
      z = await objednaj(s); // objednaj overí: platba v session pri Step2Validate = súhrn = rádio pred klikom
      over(z.length === 1 && z[0].platba === id.prevod, "objednávka s platbou " + z[0].platba + " (zákazník videl prevod)");
      casti.push("druhá karta s dobierkou: resync -> objednávka s prevodom (1× Step2Validate)");
      return { step2: true, info: casti.join(" | ") };
    },
  },
  S31: {
    popis: "Košík zmenený v inom okne (T6b): pred odoslaním iná suma -> neodošle sa, súhrn zo servera, hláška; ďalší klik odošle",
    async fn(J) {
      const s = await J.novaStranka();
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      const pred = await stavOpc(s);
      s.p.stav.priplatok = s.web === "cz" ? 50 : 5; // iné okno: košík má o kus viac (podvrh zvýši tovar aj sumu)
      s.p.reset();
      await objednaj(s, { n: 0, ms: 2500 });
      const st = await stavOpc(s);
      const h = await cakamText(s);
      over(s.p.zaznam.step2.length === 0, "objednávka odišla, hoci suma na serveri je iná");
      over(/inom okne|jiném okně/.test(h), "chýba hláška o zmene v inom okne: " + JSON.stringify(h));
      // výsledný štýl (revízia: komentár // v CSS zahodil pravidlo): výrazný červený box 16 px, nie sivý stredový text
      const sp = await s.ev(`(function () { var e = document.querySelector(".lcd-opc-cakam"), c = getComputedStyle(e);
        return { pozor: e.classList.contains("lcd-opc-cakam--pozor"), ram: c.borderLeftWidth, pozadie: c.backgroundColor, pismo: c.fontSize, zarovnanie: c.textAlign }; })()`);
      over(sp.pozor && sp.ram === "3px" && sp.pozadie !== "rgba(0, 0, 0, 0)" && sp.pismo === "16px" && sp.zarovnanie === "left", "hláška pri tlačidle nie je výrazná (CSS): " + JSON.stringify(sp));
      over(st.celkom !== pred.celkom && st.celkom === s.p.celkomServera(), "súhrn sa neobnovil zo servera: " + pred.celkom + " -> " + st.celkom + " (server " + s.p.celkomServera() + ")");
      const z = await stavZamku(s);
      over(!z.zamknute && z.tlacidlo === T_TLACIDLO[s.web], "po nezhode ostal zámok: " + JSON.stringify(z));
      const z2 = await objednaj(s);
      overTeloObjednavky(s, z2[0]);
      return { step2: true, info: "suma " + pred.celkom + " -> server " + st.celkom + ": neodišlo, hláška „" + h.slice(0, 45) + "…“, ďalší klik 1× Step2Validate" };
    },
  },
  S32: {
    popis: "Analytika (T9a, T12): OPC prechod pošle begin_checkout práve 1× (payload z kroku 1), zmena platby add_payment_info 1× s novým payment_type; natívny tok bez OPC nič navyše",
    async fn(J) {
      // a) z košíka cez OPC
      let s = await J.novaStranka();
      const id = ID[s.web];
      await naKrok2(s);
      await pauza(300);
      let bc = await gtagy(s, "begin_checkout");
      const k1 = payloadKroku1(s);
      over(bc.length === 1, "begin_checkout na kroku 2 po OPC " + bc.length + "× (čakal som 1)");
      over(bc[0].currency === k1.currency && bc[0].value === k1.value && JSON.stringify(bc[0].items) === JSON.stringify(k1.items), "begin_checkout nemá payload kroku 1: " + JSON.stringify(bc[0]).slice(0, 200));
      const api0 = await gtagy(s, "add_payment_info");
      await zvolPlatbu(s, id.dobierka);
      const st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene", "dobierka sa nepotvrdila: " + st.stav);
      await pauza(200);
      const api = (await gtagy(s, "add_payment_info")).slice(api0.length);
      const ocak = "cashOnDelivery~" + nazovPlatby(s, id.dobierka);
      over(api.length === 1 && api[0].payment_type === ocak, "add_payment_info po zmene: " + JSON.stringify(api.map((x) => x.payment_type)) + " (čakal som 1× " + ocak + ")");
      // nové načítanie kroku 2 (F5): príznak je spotrebovaný -> žiadny ďalší begin_checkout
      await s.chod(KROK2 + OPC, { popis: "krok 2 znova" });
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      await pauza(300);
      bc = await gtagy(s, "begin_checkout");
      over(bc.length === 0, "po novom načítaní kroku 2 begin_checkout " + bc.length + "×");
      // Späť (OPC ho smeruje do košíka) a návrat prehliadačom na krok 2 (bfcache alebo nové načítanie bez príznaku): nič
      await s.ev(`document.querySelector("#checkoutSidebar .next-step-back").click(), 1`);
      await s.cakajNaStranku(KOSIK, "in-kosik");
      await s.ev(`history.back(), 1`);
      await s.cakajNaStranku(KROK2, "in-krok-2");
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      await pauza(300);
      bc = await gtagy(s, "begin_checkout");
      over(bc.length === 0, "po Späť a návrate na krok 2 begin_checkout " + bc.length + "×");
      // nový prechod z košíka = nový begin_checkout práve 1× (ako natívny krok 1 pri každom prechode)
      await naKrok2(s);
      await pauza(300);
      bc = await gtagy(s, "begin_checkout");
      over(bc.length === 1, "nový prechod z košíka: begin_checkout " + bc.length + "× (čakal som 1)");
      await s.zavri();
      // b) natívny tok bez kódu (zákazník): krok 1 pošle Shoptet, OPC nič
      s = await J.novaStranka({ bezOpc: true });
      await s.chod(KOSIK, { popis: "košík bez OPC" });
      await s.odmietniCookies();
      await s.klikni("#continue-order-button", { popis: "Pokračovať (košík)" });
      await s.cakajNaStranku(KROK1, "in-krok-1");
      const n1 = (await gtagy(s, "begin_checkout")).length;
      await s.klikni("#orderFormButton", { popis: "Pokračovať (krok 1)" });
      await s.cakajNaStranku(KROK2, "in-krok-2");
      await pauza(500);
      const n2 = (await gtagy(s, "begin_checkout")).length;
      const opc = await s.ev(`(window.dataLayer || []).filter(function (x) { return x && /^lcd_opc_/.test(x.event || ""); }).length + (typeof window.__lcdOpc !== "undefined" ? 100 : 0)`);
      over(n1 === 1 && n2 === 0 && opc === 0, "natívny tok: begin_checkout krok 1 " + n1 + "×, krok 2 " + n2 + "×, OPC stopa " + opc);
      await s.zavri();
      // c) príznak preskočenia ostal (prechod z košíka sa prerušil, napr. krok 2 presmeroval na krok 1) a zákazník ide
      //    natívnym krokom 1 s OPC v karte: krok 1 poslal begin_checkout sám -> krok 2 s OPC nesmie poslať druhý
      s = await J.novaStranka();
      await s.chod(KOSIK + OPC, { popis: "košík s kódom OPC" });
      await s.odmietniCookies();
      await s.ev(`sessionStorage.setItem("lcdOpcPreskocilKrok1", String(Date.now())), 1`);
      await s.chod(KROK1, { popis: "krok 1 natívne (OPC zapnuté v karte)" });
      const c1 = (await gtagy(s, "begin_checkout")).length;
      await s.klikni("#orderFormButton", { popis: "Pokračovať (krok 1)" });
      await s.cakajNaStranku(KROK2, "in-krok-2");
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      await pauza(300);
      const c2 = (await gtagy(s, "begin_checkout")).length;
      over(c1 === 1 && c2 === 0, "prerušený prechod + natívny krok 1: begin_checkout krok 1 " + c1 + "×, krok 2 s OPC " + c2 + "× (dvojité počítanie)");
      return { info: "OPC: begin_checkout 1× (krok 1 payload), add_payment_info 1× " + ocak + ", po F5 aj Späť + návrate 0×, nový prechod 1×; natívne: krok 1 1×, krok 2 0×, OPC nič; prerušený prechod + krok 1: spolu 1×" };
    },
  },
  S33: {
    popis: "Analytika – hraničné prípady (T12): zlyhaná zmena platby a návrat na pôvodnú voľbu v debounce bez add_payment_info; platbu prepnutú inde (overenie zo servera) neposiela znova; bez window.gtag žiadna chyba, len dataLayer lcd_opc_platba",
    async fn(J) {
      const casti = [];
      // a) dobierka zlyhá (500) -> nič; karta a hneď späť prevod (v debounce) -> 0 požiadaviek, nič; skutočná zmena na kartu -> 1×
      let s = await J.novaStranka({ scenar: { step1: (n, o) => (o.billingId === ID[J.web].dobierka ? "500" : "ok") } });
      let id = ID[s.web];
      await naKrok2(s);
      const a0 = (await gtagy(s, "add_payment_info")).length; // natívny pri načítaní kroku 2 (platba zo session)
      await zvolPlatbu(s, id.dobierka);
      let st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-chyba" && st.potvrdene.platba === id.prevod, "dobierka mala zlyhať (500): " + JSON.stringify(st));
      await pauza(300);
      let api = (await gtagy(s, "add_payment_info")).slice(a0);
      over(api.length === 0 && (await vlastnaPlatba(s)).length === 0, "zlyhaná zmena: add_payment_info " + JSON.stringify(api.map((x) => x.payment_type)) + ", lcd_opc_platba " + (await vlastnaPlatba(s)).length + "×");
      const n1 = step1Xhr(s).length;
      await s.ev(`(function () { document.querySelector('#lcd-opc label[for="billingId-${id.karta}"]').click(); document.querySelector('#lcd-opc label[for="billingId-${id.prevod}"]').click(); })()`);
      await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      await pauza(600); // debounce 300 ms + rezerva: nesmie odísť nič
      st = await stavOpc(s);
      api = (await gtagy(s, "add_payment_info")).slice(a0);
      over(st.stav === "krok2-potvrdene" && st.potvrdene.platba === id.prevod && step1Xhr(s).length === n1 && api.length === 0,
        "návrat na prevod v debounce: " + JSON.stringify({ stav: st.stav, platba: st.potvrdene.platba, step1: step1Xhr(s).length - n1, add_payment_info: api.length }));
      await zvolPlatbu(s, id.karta);
      st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      await pauza(200);
      api = (await gtagy(s, "add_payment_info")).slice(a0);
      const karta = typPlatbyWebu(s, id.karta);
      over(st.potvrdene.platba === id.karta && api.length === 1 && api[0].payment_type === karta, "zmena na kartu po chybe: " + JSON.stringify(api.map((x) => x.payment_type)) + " (čakal som 1× " + karta + ")");
      casti.push("500: 0×, návrat v debounce: 0 požiadaviek 0×, karta: 1× " + karta);
      await s.zavri();
      // b) iná karta prepla session na dobierku; overenie zo servera (ako po prekreslení súhrnu Shoptetom) ju prevezme -> nič;
      //    karta a hneď dobierka (v debounce) -> nič (dobierku do GA poslala tá druhá karta)
      s = await J.novaStranka();
      id = ID[s.web];
      await naKrok2(s);
      const b0 = (await gtagy(s, "add_payment_info")).length;
      s.p.stav.platba = id.dobierka;
      s.p.reset();
      over(await s.ev(`window.__lcdOpc.krok2.sync.overZnova()`), "overenie zo servera sa nespustilo");
      st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.potvrdene.platba === id.dobierka && st.platbaUI === id.dobierka, "overenie neprevzalo dobierku zo servera: " + JSON.stringify(st));
      await pauza(300);
      api = (await gtagy(s, "add_payment_info")).slice(b0);
      over(api.length === 0, "prevzatá platba poslala add_payment_info " + JSON.stringify(api.map((x) => x.payment_type)));
      await s.ev(`(function () { document.querySelector('#lcd-opc label[for="billingId-${id.karta}"]').click(); document.querySelector('#lcd-opc label[for="billingId-${id.dobierka}"]').click(); })()`);
      await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      await pauza(600);
      st = await stavOpc(s);
      api = (await gtagy(s, "add_payment_info")).slice(b0);
      over(st.stav === "krok2-potvrdene" && st.potvrdene.platba === id.dobierka && step1Xhr(s).length === 0 && api.length === 0,
        "návrat na prevzatú dobierku: " + JSON.stringify({ stav: st.stav, platba: st.potvrdene.platba, step1: step1Xhr(s).length, add_payment_info: api.map((x) => x.payment_type) }));
      casti.push("iná karta (dobierka): prevzatá 0×, návrat v debounce 0×");
      await s.zavri();
      // c) stránka bez window.gtag (Shoptet bez GA): OPC funguje, žiadna chyba v konzole (kontroluje test-opc.mjs), GA nič,
      //    zmena platby len do dataLayer ako lcd_opc_platba s typom
      s = await J.novaStranka({ skript: `document.addEventListener("DOMContentLoaded", function () { if (/^\\/objednavka\\/krok-2\\//.test(location.pathname)) window.gtag = undefined; });` });
      id = ID[s.web];
      await naKrok2(s);
      over((await s.ev(`typeof window.gtag`)) === "undefined", "podvrh: window.gtag na kroku 2 ostal");
      const c0 = (await gtagy(s, "add_payment_info")).length;
      const bc = (await gtagy(s, "begin_checkout")).length;
      await zvolPlatbu(s, id.dobierka);
      st = await cakajOpc(s, /^krok2-(potvrdene|chyba)$/);
      over(st.stav === "krok2-potvrdene" && st.potvrdene.platba === id.dobierka, "bez gtag sa dobierka nepotvrdila: " + JSON.stringify(st));
      await pauza(200);
      const c = (await gtagy(s, "add_payment_info")).length - c0;
      const vl = await vlastnaPlatba(s);
      const dob = typPlatbyWebu(s, id.dobierka);
      over(bc === 0 && c === 0 && vl.length === 1 && vl[0] === id.dobierka + ":" + dob, "bez gtag: begin_checkout " + bc + "×, add_payment_info " + c + "×, lcd_opc_platba " + JSON.stringify(vl));
      casti.push("bez gtag: OPC beží, GA 0×, lcd_opc_platba " + vl[0]);
      return { info: casti.join(" | ") };
    },
  },
  S34: {
    len: "sk",
    popis: "Rýchla platba cez banku (112) vybraná s bankou na klasickom kroku 1 (VÚB v session aj v prehliadači): krok 2 ukáže 112 s VÚB, kontrola pred odoslaním pošle Step1Validate S KÓDOM banky; iná karta prepla platbu -> resync vráti 112 s VÚB; bez zoznamu bánk záloha bez Step1Validate (len GET kroku 1)",
    async fn(J) {
      // session má 112 aj banku z widgetu kroku 1 (scenár banka), prehliadač si banku pamätá (localStorage widgetu kroku 1)
      // súhrn kroku 2 so 112: 🟡 poskladaný podvrhom zo súhrnu prevodu, zodpovedá živému T11 („Rýchla platba cez banku“, €10)
      const VUB = "vub_banka_oauth_client_sk";
      const TELO = "language=sk&shippingId=96&billingId=112&shoptetPayPisCode=" + VUB + "&gopayPayInstrument=";
      const ULOZ = `try { localStorage.setItem("pisBankSelected", "${VUB}"); localStorage.setItem("pisCountrySelected", "SK"); localStorage.setItem("pisCurrencySelected", "EUR"); } catch (e) {}`;
      const riadok = (s) => s.ev(`(function () { var w = document.querySelector('#lcd-opc [data-submethod="pis"]'); var m = w && w.querySelector(".lcd-opc-banka__meno");
        return w ? { aktivny: w.classList.contains("active"), banka: m ? m.textContent : null, odkaz: !!w.querySelector('a[href="/objednavka/krok-1/"]'), radio: !!w.querySelector("input[name=billingId]") } : null; })()`);
      const casti = [];
      let s = await J.novaStranka({ scenar: { platba: "112", banka: VUB, zaciatok: "krok2" }, skript: ULOZ });
      await s.chod(KROK2 + OPC, { popis: "krok 2 s kódom OPC (session: 112 s VÚB)" });
      let st = await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      await s.odmietniCookies();
      let r = await riadok(s);
      over(st.stav === "krok2-potvrdene" && st.potvrdene.platba === "112" && r && r.radio && r.aktivny && r.banka === "VUB" && !r.odkaz, "krok 2 so 112: " + JSON.stringify({ stav: st.stav, potvrdene: st.potvrdene, r }));
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      let z = await objednaj(s);
      let pred = step1Xhr(s).filter((x) => x.cas <= z[0].cas);
      over(pred.length === 1 && pred[0].telo === TELO, "kontrola pred odoslaním: Step1Validate " + JSON.stringify(pred.map((x) => x.telo)) + " (čakal som " + TELO + ")");
      overTeloObjednavky(s, z[0]);
      over(z.length === 1 && z[0].platba === "112" && z[0].banka === VUB, "objednávka " + JSON.stringify(z.map((x) => [x.platba, x.banka])));
      casti.push("112 s VÚB: Step1Validate s kódom, 1× Step2Validate so 112 a VÚB");
      await s.zavri();
      // iná karta prepla session na prevod: stránka ukazuje 112 s VÚB -> resync pošle zobrazenú voľbu (ako pri ostatných platbách, S30)
      s = await J.novaStranka({ scenar: { platba: "112", banka: VUB, zaciatok: "krok2" }, skript: ULOZ });
      const id = ID[s.web];
      await s.chod(KROK2 + OPC, { popis: "krok 2 s kódom OPC (session: 112 s VÚB)" });
      await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      await s.odmietniCookies();
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.stav.platba = id.prevod;
      s.p.stav.banka = null;
      s.p.reset();
      z = await objednaj(s);
      pred = step1Xhr(s).filter((x) => x.cas <= z[0].cas);
      over(pred.length === 1 && pred[0].telo === TELO && z.length === 1 && z[0].platba === "112" && z[0].banka === VUB,
        "iná karta (prevod): " + JSON.stringify({ step1: pred.map((x) => x.telo), z: z.map((x) => [x.platba, x.banka]) }));
      casti.push("iná karta (prevod): resync 112 s VÚB, objednávka so 112");
      await s.zavri();
      // záloha: zoznam bánk nejde -> riadok s odkazom na klasický krok 1, kontrola bez Step1Validate (banka zo session ostane)
      s = await J.novaStranka({ scenar: { platba: "112", banka: VUB, zaciatok: "krok2", banky: "500" }, skript: ULOZ });
      await s.chod(KROK2 + OPC, { popis: "krok 2 s kódom OPC (banky 500)" });
      st = await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
      await s.odmietniCookies();
      r = await riadok(s);
      over(st.stav === "krok2-potvrdene" && r && r.odkaz && !r.radio && r.aktivny, "záloha bez zoznamu bánk: " + JSON.stringify({ stav: st.stav, r }));
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.reset();
      z = await objednaj(s);
      pred = step1Xhr(s).filter((x) => x.cas <= z[0].cas);
      over(pred.length === 0, "záloha: kontrola pred odoslaním poslala Step1Validate bez kódu banky: " + JSON.stringify(pred.map((x) => x.telo)));
      const k1 = s.p.zaznam.www.filter((x) => x.cas <= z[0].cas && x.metoda === "GET" && /\/objednavka\/krok-1\/$/.test(x.cesta) && x.typ !== "Document");
      over(k1.length === 1 && z.length === 1 && z[0].platba === "112" && z[0].banka === VUB, "záloha: GET krok 1 " + k1.length + "×, objednávka " + JSON.stringify(z.map((x) => [x.platba, x.banka])));
      casti.push("banky 500: odkaz, bez Step1Validate, GET krok 1, objednávka so 112 a VÚB zo session");
      return { step2: true, info: casti.join(" | ") };
    },
  },
  S35: {
    popis: "Kontrola pred odoslaním trvalo zlyháva: zákazník nezostane v slučke „skúste o chvíľu“ — hláška s odkazom na klasický krok 1; odmietnutie servera (session bez kroku 1) aj 2. zlyhanie za sebou = záchrana, ďalší klik natívne",
    async fn(J) {
      const casti = [];
      // a) Step1Validate 500 (dočasná chyba): 1. klik hláška + odkaz, 2. klik záchrana + odkaz, 3. klik natívne odoslanie
      let s = await J.novaStranka();
      const id = ID[s.web];
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.scenar.step1 = "500";
      s.p.reset();
      await objednaj(s, { n: 0, ms: 2500 });
      let st = await stavOpc(s);
      let h = await cakamSOdkazom(s);
      over(s.p.zaznam.step2.length === 0 && st.stav === "krok2-potvrdene" && h.odkaz === KROK1, "1. zlyhanie (500): " + JSON.stringify({ stav: st.stav, h }));
      await objednaj(s, { n: 0, ms: 2500 });
      st = await stavOpc(s);
      h = await cakamSOdkazom(s);
      over(s.p.zaznam.step2.length === 0 && st.stav === "krok2-zachrana" && h.odkaz === KROK1 && !/o chvíľu|za chvíli/.test(h.text), "2. zlyhanie za sebou: " + JSON.stringify({ stav: st.stav, h }));
      over(await s.viditelne("a.lcd-opc-zmenit"), "záchrana bez odkazu „Zmeniť dopravu alebo platbu“");
      const n1 = step1Xhr(s).length;
      const z = await objednaj(s);
      overTeloObjednavky(s, z[0]);
      over(z.length === 1 && z[0].platba === id.prevod && step1Xhr(s).length === n1, "po záchrane: Step2Validate " + JSON.stringify(z.map((x) => x.platba)) + ", Step1Validate navyše " + (step1Xhr(s).length - n1));
      casti.push("500: 1. hláška s odkazom, 2. záchrana, 3. natívne 1× s prevodom");
      await s.zavri();
      // b) odmietnutie servera (živý tvar 303 + errors, session príde o krok 1): hneď záchrana, odkaz vedie na klasický krok 1
      s = await J.novaStranka();
      await naKrok2(s);
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.scenar.step1 = "chyby";
      s.p.reset();
      await objednaj(s, { n: 0, ms: 2500 });
      st = await stavOpc(s);
      h = await cakamSOdkazom(s);
      over(s.p.zaznam.step2.length === 0 && step1Xhr(s).length === 1 && st.stav === "krok2-zachrana" && h.odkaz === KROK1 && !/o chvíľu|za chvíli/.test(h.text),
        "odmietnutie servera: " + JSON.stringify({ stav: st.stav, h, step1: step1Xhr(s).length }));
      await s.ev(`document.querySelector(".lcd-opc-cakam a").click(), 1`);
      await s.cakajNaStranku(KROK1, "in-krok-1");
      casti.push("303 + errors: záchrana hneď, odkaz -> klasický krok 1");
      return { step2: true, info: casti.join(" | ") };
    },
  },
  S36: {
    popis: "Lišta krokov a texty variantu A: košík s OPC ukáže „Nákupný košík · Objednávka“ (bez kroku Doprava & platba), bez kódu košík bez zmeny; finálna stránka: „Späť do košíka“, krajina „Zmeniť štát“",
    async fn(J) {
      const T = { sk: { kroky: ["Nákupný košík", "Objednávka"], spat: "Späť do košíka", stat: "Zmeniť štát" }, cz: { kroky: ["Nákupní košík", "Objednávka"], spat: "Zpět do košíku", stat: "Změnit zemi" } }[J.web];
      const kroky = (s) => s.ev(`(function () { var ol = document.querySelector("ol.cart-header"); if (!ol) return null;
        return Array.prototype.map.call(ol.querySelectorAll("li.step"), function (l) { return { text: l.textContent.replace(/\\s+/g, " ").trim(), hidden: l.hasAttribute("hidden"), skryty: getComputedStyle(l).display === "none" }; }); })()`);
      // a) košík bez OPC: Shoptet bez zmeny (3 kroky)
      let s = await J.novaStranka({ bezOpc: true });
      await s.chod(KOSIK, { popis: "košík bez OPC" });
      const bez = await kroky(s);
      // (telefón: Shoptet sám ukazuje len aktívny krok -> porovnáva sa DOM, nie viditeľnosť)
      over(bez && bez.length === 3 && /Doprava/.test(bez[1].text) && bez.every((x) => !x.hidden) && !/Objednávka/.test(bez[2].text), "košík bez OPC zmenil lištu krokov: " + JSON.stringify(bez));
      await s.zavri();
      // b) košík s OPC: krok Doprava & platba skrytý, posledný = Objednávka (ako na finálnej stránke)
      s = await J.novaStranka();
      await s.chod(KOSIK + OPC, { popis: "košík s kódom OPC" });
      await s.cakaj(`window.__lcdOpc && window.__lcdOpc.stav === "kosik-pripraveny"`, { ms: 10000, popis: "modul OPC na košíku" });
      const s1 = await kroky(s);
      const vidno = s1 ? s1.filter((x) => !x.skryty).map((x) => x.text) : null;
      const dom = await s.ev(`Array.prototype.map.call(document.querySelectorAll("ol.cart-header li.step:not([hidden])"), function (l) { return l.textContent.replace(/\\s+/g, " ").trim(); })`);
      over(JSON.stringify(dom) === JSON.stringify(T.kroky) && !vidno.some((x) => /Doprava/.test(x)), "košík s OPC: kroky " + JSON.stringify(dom) + ", viditeľné " + JSON.stringify(vidno));
      // c) finálna stránka: Späť vedie do košíka a hovorí to; text pri krajine je akcia, odkaz ostáva
      await s.odmietniCookies();
      await s.klikni("#continue-order-button", { popis: "Pokračovať (košík)" });
      await s.cakajNaStranku(KROK2, "in-krok-2");
      await cakajOpc(s, /^krok2-potvrdene$/);
      const d = await s.ev(`(function () { var a = document.querySelector("#checkoutSidebar .next-step-back");
        return { spat: a ? a.textContent.replace(/\\s+/g, " ").trim() : null, spatHref: a ? a.getAttribute("href") : null,
          stat: Array.prototype.map.call(document.querySelectorAll("#order-form em.helpNote"), function (e) { var x = e.querySelector("a"); return e.textContent.replace(/\\s+/g, " ").trim() + "|" + (x ? x.getAttribute("href") : ""); }) }; })()`);
      over(d.spat === T.spat && d.spatHref === KOSIK, "Späť: " + JSON.stringify(d));
      over(d.stat.length >= 1 && d.stat.every((x) => x === T.stat + "|" + KROK1), "text pri krajine: " + JSON.stringify(d.stat));
      if (J.web === "sk") {
        // rýchla platba cez banku (nezvolená) = bežné rádio (Michal 30. 10. 2026: banka sa vyberá tu, nie na samostatnej
        // stránke): prázdny krúžok, popis Shoptetu, žiadna šípka ani odkaz na krok 1
        const sip = await s.ev(`(function () { var w = document.querySelector('#lcd-opc [data-submethod="pis"]'), i = w && w.querySelector('input[name="billingId"]');
          if (!i) return null; var c = getComputedStyle(i.nextElementSibling, "::before"), p = w.querySelector(".payment-info .sublabel");
          return { radius: c.borderTopLeftRadius, transform: c.transform, popis: p ? p.textContent.trim() : null, odkaz: !!w.querySelector('a[href="/objednavka/krok-1/"]') }; })()`);
        over(sip && sip.radius === "50%" && sip.transform === "none" && !sip.odkaz && !/samostatnej stránke/.test(sip.popis), "rýchla platba nie je rádio (šípka / odkaz na krok 1): " + JSON.stringify(sip));
      }
      return { info: "košík bez OPC 3 kroky, s OPC " + dom.join(" · ") + "; finálna stránka „" + d.spat + "“, „" + T.stat + "“ (" + d.stat.length + "×)" };
    },
  },
};
