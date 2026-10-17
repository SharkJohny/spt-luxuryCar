// Ovládač kroku 4 (rozloženie kobercov). VLASTNÍK: worker „rozlozenie“
// (assets/js/components/konfigurator1v/rozlozenie.js + assets/css/_lcd1v-rozlozenie.scss). Kontrakt: docs/1v-kontrakt.md.
// `stary` = živý konfigurátor (referencia, nemeniť). `novy` = nový vzhľad; kým je null, --novy použije `stary`.
import { F, otvorKrok } from "./stary-ui.mjs";

export const stary = {
  meno: "stary",

  /** Vyberie rozloženie (index: 0 = len 1. rad, 1 = 1.+2. rad, 2 = všetky tri rady) -> value v selecte rozloženia. */
  async vyberRozlozenie(t, { index = 0 } = {}) {
    const sel = await otvorKrok(t, "rozlozenie");
    await t.klikni(`${sel} .option-button`, { index, popis: "rozloženie " + index });
    const id = await t.idParametra("rozlozenie");
    const v = await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "rozloženie vo formulári" });
    // mobil: živý kód po 350 ms sám zbalí rozloženie a otvorí kufor (configuratorEngine.js, K3 auto-postup, zámok do 700 ms)
    // — počkať, kým dobehne, inak by sa klik na hlavičku kufra s ním pobil
    await t.pauza(t.mobil ? 1200 : 300);
    return v;
  },
};

/** Nový vzhľad (?novy=1): karty s fotkami v kroku 4 (assets/js/components/konfigurator1v/rozlozenie.js). */
const RZ = `${F} .lcd1v-rz`;

/**
 * Záznam klikov v stránke (len čítanie): kam klik trafil (capture) a čo bolo v selecte rozloženia pred ním a hneď po
 * všetkých handleroch (bubble na window). window.__rzTestKliky = [{ ms, na, x, y, pred, select }]. Vnorený klik
 * ctx.zapis na živé tlačidlo je samostatný záznam („DIV.button.option-button“, x/y 0).
 */
const ZAZNAM_KLIKOV = (id) => `(function () {
  if (window.__rzTestKliky) return true;
  var z = window.__rzTestKliky = [];
  function sel() { var s = document.querySelector('${F} select[data-parameter-id="${id}"]'); return s ? s.value : null; }
  document.addEventListener("click", function (e) {
    var c = e.target && e.target.closest ? e.target : null, k = c && c.closest(".rz-karta"), d = c && c.closest(".rz-dlazdice button");
    z.push({ ms: Math.round(performance.now()), na: k ? "karta " + k.getAttribute("data-rady") : d ? "miesta " + d.getAttribute("data-v") : c ? (c.tagName + "." + String(c.className || "").split(/\\s+/).slice(0, 2).join(".")) : "?", x: e.clientX, y: e.clientY, pred: sel(), select: null });
  }, true);
  window.addEventListener("click", function () { if (z.length) z[z.length - 1].select = sel(); });
  return true;
})()`;

/** Stav rozloženia na výpis: select, aktívne živé tlačidlá (všetky vo formulári), označené karty, posledné kliky. */
const STAV_ROZLOZENIA = (id) => `(function () {
  var f = document.querySelector('${F}'), s = f && f.querySelector('select[data-parameter-id="${id}"]');
  return { select: s ? s.value : null,
    zive: Array.prototype.map.call(f.querySelectorAll('.option-button.active[data-variant="${id}"]'), function (b) { return b.getAttribute("data-value"); }),
    karty: Array.prototype.map.call(document.querySelectorAll('${RZ} .rz-karta.on'), function (k) { return k.getAttribute("data-hodnota"); }),
    miesta: (f.querySelector(".sit-Position .option-button.active") || { getAttribute: function () { return ""; } }).getAttribute("data-value"),
    kliky: (window.__rzTestKliky || []).slice(-4) };
})()`;

/** Otvorí krok 4 tak, ako to urobí zákazník: klik na viditeľnú hlavičku kroku (číslo / názov). */
export async function otvorKrok4(t) {
  const id = await t.idParametra("rozlozenie");
  const sel = `${F} .content-wrap > .parameter-wrap.parameter-${id}`;
  const q = JSON.stringify(sel);
  const otvoreny = `(function () { var e = document.querySelector(${q}); var r = document.querySelector(${JSON.stringify(RZ + " .rz-karty")});
    return !!(e && e.classList.contains("active") && r && r.getBoundingClientRect().height > 60 && e.getBoundingClientRect().bottom > r.getBoundingClientRect().top + 60); })()`;
  if (await t.ev(otvoreny)) return sel;
  // hlavičku kreslí worker „kroky“ (button.lcd1v-hd; živý .order je cez ňu priehľadne roztiahnutý): prvá viditeľná
  // z kandidátov; zásah čohokoľvek v rámci kroku je v poriadku (vRamci)
  const hlavicka = await t.ev(`(function (sel) {
    var k = [sel + " > .lcd1v-hd", sel + " > .order", sel + " > .name-wrap h5", sel + " > .name-wrap", sel + " h5"];
    for (var i = 0; i < k.length; i++) { var e = document.querySelector(k[i]); if (e) { var r = e.getBoundingClientRect(); var s = getComputedStyle(e);
      if (r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity || "1") > 0.05) return k[i]; } }
    return null; })(${q})`);
  if (!hlavicka) throw new Error("krok 4: viditeľná hlavička kroku nie je");
  await t.klikni(hlavicka, { popis: "hlavička kroku 4", vRamci: sel });
  await t.cakaj(otvoreny, { popis: "otvorený krok 4 s kartami" });
  await t.pauza(450); // rozbaľovanie
  return sel;
}

export const novy = {
  meno: "novy",

  /** Vyberie rozloženie kartou nového vzhľadu (index: 0 = len 1. rad, 1 = 1.+2. rad, 2 = všetky tri rady) -> value v selecte. */
  async vyberRozlozenie(t, { index = 0 } = {}) {
    await otvorKrok4(t);
    const rady = index + 1;
    const karta = `${RZ} .rz-karta[data-rady="${rady}"]`;
    const kartaVidno = `(function () { var e = document.querySelector(${JSON.stringify(karta)}); return !!(e && e.offsetHeight > 0); })()`;
    if (rady === 3 && !(await t.ev(kartaVidno))) {
      // „Všetky tri rady“ sa ukáže len pri aute s 3. radom: 7 miest dlaždicou v kroku 4 (zrkadlo dlaždíc kroku 2)
      await t.klikni(`${RZ} .rz-dlazdice button[data-v="7"]`, { popis: "7 miest (krok 4)" });
      await t.cakaj(`!!document.querySelector('${F} .sit-Position .option-button.active[data-value="pass-7"]')`, { popis: "7 miest aj v kroku 2" });
      await t.cakaj(kartaVidno, { popis: "karta „Všetky tri rady“ po 7 miestach" });
    }
    const id = await t.idParametra("rozlozenie");
    await t.ev(ZAZNAM_KLIKOV(id));
    const hodnotaKarty = await t.ev(`document.querySelector(${JSON.stringify(karta)}).getAttribute("data-hodnota")`);
    const select = `(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`;
    // Čaká sa na ZHODU selectu s kartou (predtým stačila akákoľvek hodnota — pri zmene výberu je tam stará, kontrola
    // prebehla bez čakania). Raz v plnom behu (17. 10. 2026, 601 pri 390, --paralelne 2) „select 592 ≠ karta 589“:
    // karta a select vznikajú z toho istého kliku na živé tlačidlo (ctx.zapis -> productPage.js priceActualization),
    // pretek nenájdený ani pri CPU 5× / 5 Chromoch / náhodných klikoch (scenár rozlozenie-pretek), takže klik testu
    // (CDP myš do bodu zisteného o chvíľu skôr) kartu netrafil. Netrafený klik (záznam klikov) sa skúsi ešte raz a zapíše
    // do logu; klik, ktorý kartu TRAFIL, a select sa nezhoduje = chyba košíka, žiadne opakovanie.
    let v = null;
    for (let pokus = 1; !v; pokus++) {
      const pred = await t.ev("window.__rzTestKliky.length");
      await t.klikni(karta, { popis: "rozloženie " + index });
      v = await t.cakaj(`${select} === ${JSON.stringify(hodnotaKarty)} && ${select}`, { ms: 3000, popis: "rozloženie vo formulári = karta" }).catch(() => null);
      if (v) break;
      const kliky = await t.ev(`window.__rzTestKliky.slice(${pred})`);
      const trafil = kliky.some((k) => k.na === "karta " + rady);
      if (trafil || pokus >= 2) {
        throw new Error("rozloženie: select " + (await t.ev(select)) + " ≠ karta " + hodnotaKarty +
          (trafil ? " (klik kartu trafil — karta a košík sa rozchádzajú)" : " (klik kartu netrafil ani na 2. pokus)") + " — " + JSON.stringify(await t.ev(STAV_ROZLOZENIA(id))));
      }
      t.log("rozloženie: klik na kartu " + rady + " netrafil " + JSON.stringify(kliky) + " — 2. pokus");
    }
    // karta označená, pôdorys rozsvietil zvolené rady
    await t.cakaj(`(function () { var k = document.querySelector(${JSON.stringify(karta)}); var r = document.querySelector(${JSON.stringify(RZ)});
      return k.classList.contains("on") && k.getAttribute("aria-pressed") === "true" && r.getAttribute("data-rady") === "${rady}"; })()`, { popis: "označená karta a pôdorys " + rady });
    // mobil: živý kód po 350 ms sám zbalí rozloženie a otvorí kufor (configuratorEngine.js) — počkať, kým dobehne
    await t.pauza(t.mobil ? 1200 : 300);
    return v;
  },
};
