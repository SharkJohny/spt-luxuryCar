// One page checkout (kniha OPC § 5 variant A, § 6.1): z košíka rovno na /objednavka/krok-2/.
// Košík sa nemení (položky, ponuka k setu, zelené „Pokračovať“, lišta dole). Na pozadí si stiahne krok 1 Shoptetu,
// po kliku na „Pokračovať“ (aj v lište, aj krok „Doprava a platba“ v hlavičke) pošle Step1Validate s dopravou a platbou,
// ktoré má krok 1 zaškrtnuté (posledná voľba v session, inak predvolené z adminu) a prejde na krok 2.
// Hocičo zlyhá (aj krok 1 neodpovie do 4 s) -> pôvodná adresa odkazu (/objednavka/krok-1/) = dnešný tok.
// Rýchla platba cez banku (Shoptet Pay „pis“) v session -> tiež klasický krok 1: banka (shoptetPayPisCode) sa vyberá len
// vo widgete kroku 1, Step1Validate bez nej by bol neúplný (revízia 29. 10.).
import { krok1Model } from "./krok1Model.js";
import { posliStep1, fetchSLimitom, LIMIT_KROK1_MS } from "./sync.js";
import { TEXTY } from "./texty.js";
import { upravKroky } from "./vzhlad.js";
import { oznacPreskocenie } from "./analytika.js";
import { ulozFotky } from "./polozky.js";

export const CESTA_KROK1 = "/objednavka/krok-1/";
const STARE_MS = 60000; // stiahnutý krok 1 starší ako minúta sa na klik stiahne znova (voľba mohla prísť z inej karty)

/** Je odkaz „ďalej do objednávky“ (krok 1 na tomto webe)? */
export function jeOdkazNaKrok1(a, origin) {
  if (!a || !a.getAttribute) return false;
  const h = a.getAttribute("href");
  if (!h) return false;
  try {
    const u = new URL(h, origin + "/");
    return u.origin === origin && /^\/objednavka\/krok-1\/?$/.test(u.pathname);
  } catch (e) {
    return false;
  }
}

/**
 * Košík v štýle pokladne (Michal 29. 10. 2026, náhľad 1 a 5): piesok, biele karty, krokovník ① Nákupný košík → ② Objednávka,
 * súhrn so zlatým pruhom — len vzhľad pod html.lcd-opc-kosik (_lcdOpc.scss), obsah košíka sa nemení. Opakovateľné: volá
 * ho opc/index.js hneď pri načítaní bundla (skôr než data.json = menej posunu obsahu) aj initKosik.
 */
export function vzhladKosika(doc, T) {
  // lišta krokov ako na finálnej stránke: „Nákupný košík · Objednávka“ (krok Doprava & platba pri OPC nepríde, revízia);
  // pôvodný text 3. kroku sa odloží, aby ho zrusVzhladKosika vedel vrátiť (núdzový vypínač v data.json)
  try {
    const ol = doc.querySelector("ol.cart-header");
    const k3 = ol && ol.querySelector("li.step-3 strong span, li.step-3 a span");
    if (k3 && !k3.hasAttribute("data-lcd-opc-povodny")) k3.setAttribute("data-lcd-opc-povodny", k3.textContent);
    upravKroky(ol, T);
  } catch (e) {}
  doc.documentElement.classList.add("lcd-opc-kosik");
  try {
    // číslo kroku v krúžku (① ②) podľa viditeľných krokov po upravKroky
    let n = 0;
    doc.querySelectorAll("ol.cart-header li.step").forEach(function (li) { if (!li.hidden) li.setAttribute("data-lcd-opc-cislo", String(++n)); });
  } catch (e) {}
}

/** Späť na dnešný košík (OPC vypnuté v data.json až po skorom vzhľade): trieda, kroky, čísla a text 3. kroku. */
export function zrusVzhladKosika(doc) {
  doc.documentElement.classList.remove("lcd-opc-kosik");
  const ol = doc.querySelector("ol.cart-header.lcd-opc-kroky");
  if (!ol) return;
  ol.classList.remove("lcd-opc-kroky");
  ol.querySelectorAll("li.step").forEach(function (li) { li.removeAttribute("hidden"); li.removeAttribute("data-lcd-opc-cislo"); });
  ol.querySelectorAll("[data-lcd-opc-povodny]").forEach(function (e) { e.textContent = e.getAttribute("data-lcd-opc-povodny"); e.removeAttribute("data-lcd-opc-povodny"); });
}

export function initKosik(ctx) {
  const st = { model: null, cas: 0, bezi: false };
  ctx.kosik = st;
  vzhladKosika(document, TEXTY[ctx.trh] || TEXTY.sk);
  // malé náhľady položiek pre súhrn kroku 2 (opc/polozky.js): data-micro-identifier -> URL náhľadu z riadku košíka
  try { ulozFotky(document, window.sessionStorage); } catch (e) {}

  function stiahni() {
    const t0 = Date.now();
    const p = fetchSLimitom(CESTA_KROK1, { headers: { Accept: "text/html" } }, LIMIT_KROK1_MS)
      .then(function (r) {
        if (r.chyba) return { ok: false, dovod: r.chyba }; // visiaca sieť: klik nesmie čakať donekonečna (R5)
        // prázdny košík / vypršaná session: Shoptet presmeruje na /kosik/ -> nie je čo vybrať
        if (!r.ok || !/\/objednavka\/krok-1\/?$/.test(new URL(r.url, location.href).pathname)) return { ok: false, dovod: "stranka" };
        return r.text().then(function (h) { return krok1Model(h); });
      })
      .catch(function () { return { ok: false, dovod: "siet" }; });
    st.model = p;
    st.cas = t0;
    p.then(function (m) {
      if (st.model !== p) return; // medzitým novšie stiahnutie
      ctx.stav = m && m.ok ? "kosik-pripraveny" : "kosik-bez-krok1";
      if (m && m.ok) return;
      st.cas = 0; // neúspech sa nedrží: klik skúsi stiahnuť znova
      ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: "krok1-" + ((m && m.dovod) || "?"), lcd_opc_miesto: "kosik" });
    });
    return p;
  }

  function model() {
    if (st.model && Date.now() - st.cas < STARE_MS) return st.model;
    return stiahni();
  }

  /** Text tlačidla „Pokračovať“ (aj v lište): span s textom, ktorý počas prechodu ukáže „Načítavam…“. */
  function textTlacidla(e) {
    return e.querySelector(".order-button-text") || e.querySelector("span");
  }

  function obnovTlacidla() {
    document.querySelectorAll('[data-lcd-opc-caka]').forEach(function (e) {
      e.removeAttribute("data-lcd-opc-caka");
      e.removeAttribute("aria-busy");
      const t = textTlacidla(e);
      if (t && t.hasAttribute("data-lcd-opc-text")) { t.textContent = t.getAttribute("data-lcd-opc-text"); t.removeAttribute("data-lcd-opc-text"); }
    });
  }

  /** Prechod beží: tlačidlá „Pokračovať“ (aj v lište) stlmené, nedajú sa kliknúť a hovoria „Načítavam…“ (revízia vzhľadu). */
  function cakajuTlacidla(a) {
    const T = TEXTY[ctx.trh] || TEXTY.sk;
    const zoznam = [a];
    document.querySelectorAll("#continue-order-button, .lcd-lista__btn").forEach(function (e) { if (zoznam.indexOf(e) === -1 && jeOdkazNaKrok1(e, location.origin)) zoznam.push(e); });
    zoznam.forEach(function (e) {
      e.setAttribute("data-lcd-opc-caka", "");
      e.setAttribute("aria-busy", "true");
      const t = textTlacidla(e);
      if (t && !t.hasAttribute("data-lcd-opc-text")) { t.setAttribute("data-lcd-opc-text", t.textContent); t.textContent = T.nacitavamKosik; }
    });
  }

  function prechod(a) {
    const povodna = new URL(a.getAttribute("href"), location.href).href;
    st.bezi = true;
    cakajuTlacidla(a);
    ctx.stav = "kosik-prechod";
    const t0 = Date.now();
    return model()
      .then(function (m) {
        if (!m || !m.ok) return { ok: false, typ: "krok1-" + ((m && m.dovod) || "?") };
        const pl = m.platby.find(function (p) { return p.id === m.zvolenaPlatba; });
        if (pl && pl.podmetoda === "pis") return { ok: false, typ: "pis" }; // banka sa vyberá len na kroku 1
        return posliStep1(m, { shippingId: m.zvolenaDoprava, billingId: m.zvolenaPlatba }).then(function (r) {
          r.doprava = m.zvolenaDoprava;
          r.platba = m.zvolenaPlatba;
          return r;
        });
      })
      .then(function (r) {
        if (r.ok) {
          ctx.stav = "kosik-na-krok2";
          ctx.meraj("lcd_opc_prechod", { lcd_opc_platba: r.platba, lcd_opc_ms: Date.now() - t0 });
          oznacPreskocenie(); // krok 1 sa nenačíta -> begin_checkout pošle krok 2 (opc/analytika.js, T9a)
          location.assign(r.ciel);
          return;
        }
        throw r;
      })
      .catch(function (r) {
        ctx.stav = "kosik-zachrana";
        ctx.meraj("lcd_opc_chyba", { lcd_opc_typ: (r && r.typ) || "vynimka", lcd_opc_kod: r && r.kod != null ? r.kod : null, lcd_opc_miesto: "kosik" });
        location.assign(povodna);
      });
  }

  // delegovaný klik v bublaní: ponuka k setu počas výmeny (lcdKosikDoplnok zablokujStranku) zachytí odkazy skôr
  // v capture na window a sama ich odloží -> sem sa nedostanú a po výmene idú dnešným tokom
  document.addEventListener("click", function (e) {
    try {
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!jeOdkazNaKrok1(a, location.origin)) return;
      if (a.target && a.target !== "_self") return;
      if (document.documentElement.classList.contains("lcd-dop-bezi")) return; // výmena doplnku beží -> nechať ju
      e.preventDefault();
      if (st.bezi) return; // druhý klik počas prechodu
      prechod(a);
    } catch (x) {
      // náš kód zlyhal -> odkaz pokračuje natívne (ak ešte nebol zastavený)
    }
  });

  // Späť z kroku 2 (bfcache): košík sa obnoví s rozbehnutým prechodom -> odomknúť, voľby stiahnuť nanovo
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    st.bezi = false;
    st.model = null;
    obnovTlacidla();
    ctx.stav = "kosik";
  });

  ctx.stav = "kosik";
  const spusti = function () { try { stiahni(); } catch (e) {} };
  if (document.readyState === "complete") setTimeout(spusti, 0);
  else window.addEventListener("load", spusti, { once: true });
}
