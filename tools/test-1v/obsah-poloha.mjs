// Poloha okna pri obsahu 1V — revízia F1 (rýchlosť 25. 10. 2026) pre tools/test-1v-obsah.mjs.
// Commit 0b0410a oživoval sekcie až pri priblížení k oknu a niektoré pri tom zmenili výšku (PC: b-ocakavat +2 664 px,
// a-galeria +1 253 px; telefón: a-recenzie +500 px). Dôsledok: reload/Späť zo stredu obsahu skončil inde (prehliadač
// obnoví polohu podľa výšok pri načítaní) a pri posune hore obsah nad oknom „rástol“ — bez scroll anchoring (Safari)
// poskočil obsah v okne o tisíce px. Oprava: výšku meniace časti pri vložení kusu, oživenie všetkých sekcií postupne
// v nečinnosti a ručné ukotvenie (obsah.js). Tieto kontroly na c5edd1f zlyhajú, po oprave prejdú.
//
//   const r = await kontrolaPolohy(ch, build, p, sirka, { flag, pripravene });   // [{ ok, popis }]
//
// Na novej karte (živá stránka produktu, lokálny build, obsah z CDN ako test obsahu):
//   1) End + postupný posun hore BEZ scroll anchoring (overflow-anchor:none ako Safari): po každom kroku (0,6 výšky okna)
//      sa prvok obsahu v strede okna nesmie pohnúť o viac ako LIMIT px bez posunu zákazníka (čaká sa CAKANIE_KROKU ms;
//      reveal .rv sa posúva o 26 px = pod limitom; prvok mimo .p1v-miesto — chat, iframe tretej strany — sa nemeria);
//   2) reload pri FAQ: FAQ hore v okne, Page.reload, po načítaní obsahu a ustálení musí byť FAQ na tom istom mieste
//      v okne (± LIMIT px).
// Len GET; POST /action/ blokuje novaStranka (obsah-spolocne.mjs).
import { novaStranka, otvorProdukt, pauza } from "./obsah-spolocne.mjs";

/** Najväčší dovolený skok / odchýlka (px). */
export const LIMIT = 30;
/** Čakanie po kroku posunu hore (ms) — oživenie sekcie blízko okna beží v nečinnosti do ~200 ms. */
const CAKANIE_KROKU = 450;

const KDE_FAQ = `(function () {
  var f = document.querySelector('.p1v-miesto [data-lcd-sekcia="d-faq"]');
  var el = document.elementFromPoint(innerWidth / 2, innerHeight / 2), s = el && el.closest && el.closest("[data-lcd-sekcia]");
  return { scrollY: Math.round(scrollY), faqTop: f ? Math.round(f.getBoundingClientRect().top) : null, sekcia: s ? s.getAttribute("data-lcd-sekcia") : null };
})()`;

/** Čaká na obsah po načítaní (stav hotovo + čísla), potom ms na ustálenie. */
async function cakajNaObsah(k, ms) {
  await k.ev(`(async function () {
    var t0 = Date.now();
    while (Date.now() - t0 < 30000 && !(window.__lcd1v && window.__lcd1v.obsah && window.__lcd1v.obsah.stav === "hotovo")) await new Promise(function (r) { setTimeout(r, 200); });
    var o = window.__lcd1v && window.__lcd1v.obsah;
    if (o && o.cisla) await Promise.race([o.cisla, new Promise(function (r) { setTimeout(r, 15000); })]);
    return o ? o.stav : null;
  })()`).catch(() => null);
  await pauza(ms);
}

/**
 * @param ch Chrome (cdp.mjs spustiChrome)
 * @param build priprav() z obsah-spolocne.mjs
 * @param p produkt testu ({ url, kusy, typ … } ako v test-1v-obsah.mjs)
 * @param {number} sirka šírka okna
 * @param {{ flag?: string, pripravene?: string }} o flag ?novy= a výraz „konfigurátor je postavený“
 */
export async function kontrolaPolohy(ch, build, p, sirka, { flag = "1", pripravene } = {}) {
  const out = [];
  const ok = (podm, popis) => out.push({ ok: !!podm, popis });
  const s = await novaStranka(ch, sirka, build, { miesto: "cdn", produkt: p, kusy: p.kusy, cdnKusy: p.cdnKusy || null });
  try {
    await otvorProdukt(s, { url: p.url, flag, pripravene });
    const ma = await s.k.ev(`!!document.querySelector('.p1v-miesto [data-lcd-sekcia="d-faq"]')`);
    if (!ma) { ok(true, "poloha: obsah bez FAQ — preskočené"); return out; }

    // 1) End + posun hore bez scroll anchoring
    const b = await s.k.ev(`(async function () {
      var cakaj = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
      var st = document.createElement("style"); st.id = "p1v-test-bez-kotvy";
      st.textContent = "html,body,*{overflow-anchor:none !important}"; document.head.appendChild(st);
      scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
      await cakaj(1500);
      var vh = innerHeight, skoky = [], kroky = 0, f = document.getElementById("product-detail-form");
      var koniec = f ? f.getBoundingClientRect().bottom + scrollY : 0;
      for (var n = 0; n < 250 && scrollY > koniec; n++) {
        scrollBy({ top: -Math.round(vh * 0.6), behavior: "instant" });
        await cakaj(30);
        // meria sa len prvok obsahu (.p1v-miesto): v strede okna môže byť aj okno chatu / iframe tretej strany
        var el = document.elementFromPoint(innerWidth / 2, vh / 2);
        if (el && !(el.closest && el.closest(".p1v-miesto"))) el = null;
        var y0 = scrollY, t0 = el ? el.getBoundingClientRect().top : 0;
        await cakaj(${CAKANIE_KROKU});
        kroky++;
        if (!el || !el.isConnected) continue;
        var t1 = el.getBoundingClientRect().top;
        if (Math.abs(t1 - t0) > ${LIMIT}) {
          var sek = el.closest && el.closest("[data-lcd-sekcia]");
          skoky.push({ posun: Math.round(t1 - t0), scrollY: Math.round(y0), scrollYPo: Math.round(scrollY), sekcia: sek ? sek.getAttribute("data-lcd-sekcia") : el.tagName.toLowerCase() });
        }
      }
      st.parentNode.removeChild(st);
      var o = window.__lcd1v && window.__lcd1v.obsah;
      return { skoky: skoky, kroky: kroky, vyrovnane: o && o.vyrovnane ? o.vyrovnane : null };
    })()`);
    ok(b.kroky > 3 && !b.skoky.length, `poloha: End + posun hore bez scroll anchoring (ako Safari), ${b.kroky} krokov — obsah v okne bez skoku > ${LIMIT} px` +
      (b.skoky.length ? ": " + b.skoky.slice(0, 4).map((x) => `${x.posun} px pri ${x.sekcia} (scrollY ${x.scrollY} -> ${x.scrollYPo})`).join(", ") + (b.skoky.length > 4 ? ` … (${b.skoky.length})` : "") : "") +
      (b.vyrovnane ? ` · ručne vyrovnané ${b.vyrovnane.pocet}× (${b.vyrovnane.px} px)` : ""));

    // 2) reload pri FAQ (so scroll anchoring, ako bežný Chrome)
    const pred = await s.k.ev(`(async function () {
      document.querySelector('.p1v-miesto [data-lcd-sekcia="d-faq"]').scrollIntoView({ block: "start", behavior: "instant" });
      await new Promise(function (r) { setTimeout(r, 800); });
      return ${KDE_FAQ};
    })()`);
    await s.k.posli("Page.reload", {});
    await pauza(1500);
    await cakajNaObsah(s.k, 4000);
    const po = await s.k.ev(KDE_FAQ);
    const d = po.faqTop == null || pred.faqTop == null ? null : po.faqTop - pred.faqTop;
    ok(d !== null && Math.abs(d) <= LIMIT, `poloha: reload pri FAQ vráti FAQ na to isté miesto (± ${LIMIT} px): pred ${pred.faqTop} px (scrollY ${pred.scrollY}), ` +
      `po ${po.faqTop} px (scrollY ${po.scrollY}, v strede ${po.sekcia})` + (d !== null ? `, odchýlka ${d >= 0 ? "+" : ""}${d} px` : ""));
  } finally {
    await s.k.zavri().catch(() => {});
  }
  return out;
}
