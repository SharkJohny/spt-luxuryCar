// Ovládač vzorkovníka 637 (45 príplatkových selectov, 1 vzorka = 1 parameter „Nechcem +€0“ / „Áno +€5“).
// VLASTNÍK `novy`: worker vzorkovníka (T5.1, 14. 10. 2026). `stary` = živý web (referencia, nemeniť, T0.2 14. 10. 2026).
// S --novy/--vyvoj test použije `novy` (dlaždice nového vzhľadu, „Spolu“, košík a lišta vzorkovníka).
//
// Živý web (assets/js/vzorky-konfigurator/index.js): natívne riadky .surcharge-list sú skryté, nad nimi akordeóny
// .lcd-vz-acc (Diamond / Stripe / Hexa / 2. vrstva), dlaždica .lcd-vz-swatch[data-id="D-3"] prepne select
// s data-parameter-name="D-3" na „Áno“ / „Nechcem“; LUX okrem LUX-10 sú len náhľad (.lcd-vz-swatch--preview).
// Rekapitulácia .lcd-vz-recap-total = „Vratná záloha spolu“.
import { pauza } from "./cdp.mjs";
import { F, cislo } from "./stary-ui.mjs";

const ANO = "^(áno|ano|chcem)\\b";

/** Select vzorky podľa ID vzorky (data-parameter-name, napr. „D-3“) -> { id, ano } (id parametra, value „Áno“). */
export async function selectVzorky(t, idVzorky) {
  const r = await t.ev(`(function () {
    var s = Array.prototype.find.call(document.querySelectorAll("${F} select.surcharge-parameter"), function (s) { return (s.getAttribute("data-parameter-name") || "").trim() === ${JSON.stringify(idVzorky)}; });
    if (!s) return null;
    var re = new RegExp(${JSON.stringify(ANO)}, "i");
    var o = Array.prototype.find.call(s.options, function (o) { return o.value && re.test(o.text.trim()); });
    return { id: s.getAttribute("data-parameter-id"), ano: o ? o.value : null };
  })()`);
  if (!r) throw new Error("vzorka " + idVzorky + " vo formulári nie je (select data-parameter-name)");
  if (!r.ano) throw new Error("vzorka " + idVzorky + ": voľba „Áno / Chcem“ chýba");
  return r;
}

export const stary = {
  meno: "stary",

  /** Vyberie vzorky (ID z návrhu: „D-3“, „S-2“, „LUX-10“) -> { hodnoty: { <id parametra>: value „Áno“ }, pocet }. */
  async vyberVzorky(t, idcka) {
    const hodnoty = {};
    for (const idV of idcka) {
      const s = await selectVzorky(t, idV);
      const dl = `.lcd-vz-swatch[data-id="${idV}"]:not(.lcd-vz-swatch--preview)`;
      const ak = await t.ev(`(function () { var b = document.querySelector(${JSON.stringify(dl)}); if (!b) return null; var a = b.closest(".lcd-vz-acc");
        return { i: Array.prototype.indexOf.call(document.querySelectorAll(".lcd-vz-acc"), a), otvoreny: a.classList.contains("is-open") }; })()`);
      if (!ak) throw new Error("dlaždica vzorky " + idV + " nie je (alebo je len náhľad)");
      if (!ak.otvoreny) { await t.klikni(".lcd-vz-acc .lcd-vz-acc-head", { index: ak.i, popis: "akordeón vzoriek " + ak.i }); await pauza(450); }
      await t.klikni(dl, { popis: "vzorka " + idV });
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${s.id}"]') || {}).value === "${s.ano}"`, { ms: 10000, popis: "vzorka " + idV + " vo formulári" });
      hodnoty[s.id] = s.ano;
    }
    await pauza(400);
    return { hodnoty, pocet: await stary.pocet(t) };
  },

  /** Počet vzoriek s voľbou „Áno / Chcem“ vo formulári. */
  async pocet(t) {
    return t.ev(`(function () { var re = new RegExp(${JSON.stringify(ANO)}, "i"); return Array.prototype.filter.call(document.querySelectorAll("${F} select.surcharge-parameter"), function (s) { var o = s.options[s.selectedIndex]; return !!(s.value && o && re.test(o.text.trim())); }).length; })()`);
  },

  /** „Vratná záloha spolu“ v rekapitulácii (číslo, € ) alebo NaN. */
  async zaloha(t) {
    return cislo(await t.ev(`(document.querySelector(".lcd-vz-recap-total") || {}).textContent || ""`));
  },
};

/**
 * Nový vzhľad (T5.1, assets/js/components/konfigurator1v/vzorky-produkt.js): rovnaké metódy a návratové hodnoty ako
 * `stary` + cena a košík vzorkovníka (vzorkovník nemá kartu .lcd1v-cena, preto nie ovladac-cena.mjs `novy`):
 *   kroky = série (.lcd1v-vz-krok, akordeón), dlaždica .lcd1v-vz-dl[data-kod] (náhľad = aria-disabled),
 *   zoznam vybraných .lcd1v-vz-zoz, „Spolu“ .lcd1v-vz-suhrn, živé tlačidlo košíka, lišta .lcd1v-lista (telefón).
 */
const KROK = `${F} .lcd1v-vz-kroky > .lcd1v-vz-krok`;
export const novy = {
  meno: "novy",

  /** Otvorí krok série, v ktorej je dlaždica vzorky (klik na hlavičku ako zákazník), ak je zatvorený. */
  async otvorKrokVzorky(t, idV) {
    const k = await t.ev(`(function () { var b = document.querySelector('${KROK} .lcd1v-vz-dl[data-kod="${idV}"]'); if (!b) return null; var k = b.closest(".lcd1v-vz-krok");
      return { i: Array.prototype.indexOf.call(document.querySelectorAll("${KROK}"), k), otvoreny: k.classList.contains("active"), nahlad: b.getAttribute("aria-disabled") === "true" }; })()`);
    if (!k) throw new Error("dlaždica vzorky " + idV + " v novom vzhľade nie je");
    if (!k.otvoreny) {
      await t.klikni(`${KROK} > .lcd1v-hd`, { index: k.i, popis: "hlavička kroku vzoriek " + (k.i + 1) });
      await t.cakaj(`document.querySelectorAll("${KROK}")[${k.i}].classList.contains("active")`, { ms: 10000, popis: "otvorený krok " + (k.i + 1) });
      await pauza(250);
    }
    return k;
  },

  /** Vyberie vzorky klikom na dlaždice nového vzhľadu -> { hodnoty: { <id parametra>: value „Áno“ }, pocet }. */
  async vyberVzorky(t, idcka) {
    const hodnoty = {};
    for (const idV of idcka) {
      const s = await selectVzorky(t, idV);
      const k = await novy.otvorKrokVzorky(t, idV);
      if (k.nahlad) throw new Error("vzorka " + idV + " je v novom vzhľade len náhľad (živý widget ju neposiela)");
      await t.klikni(`${KROK} .lcd1v-vz-dl[data-kod="${idV}"]`, { popis: "vzorka " + idV });
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${s.id}"]') || {}).value === "${s.ano}"`, { ms: 10000, popis: "vzorka " + idV + " vo formulári" });
      await t.cakaj(`(document.querySelector('${KROK} .lcd1v-vz-dl[data-kod="${idV}"]') || { getAttribute: function () {} }).getAttribute("aria-pressed") === "true"`, { ms: 10000, popis: "dlaždica " + idV + " označená" });
      hodnoty[s.id] = s.ano;
    }
    await pauza(300);
    return { hodnoty, pocet: await stary.pocet(t) };
  },

  /** Odoberie vzorku tlačidlom × v zozname vybraných. */
  async odoberVzorku(t, idV) {
    const s = await selectVzorky(t, idV);
    await t.klikni(`${F} .lcd1v-vz-zoz li[data-kod="${idV}"] .lcd1v-vz-zoz__x`, { popis: "odobrať " + idV });
    await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${s.id}"]') || {}).value === ""`, { ms: 10000, popis: "vzorka " + idV + " zrušená vo formulári" });
    await pauza(200);
  },

  pocet: (t) => stary.pocet(t),

  /** „Spolu“ (číslo) — musí sedieť aj s cenou v lište; inak vráti text s rozdielom (test zlyhá). */
  async zaloha(t) {
    const r = await t.ev(`(function () {
      function tx(s) { var e = document.querySelector(s); return e ? e.textContent : null; }
      var e = document.querySelector("${F} .lcd1v-vz-suhrn .lcd1v-suhrn__suma");
      return { spolu: tx("${F} .lcd1v-vz-suhrn .lcd1v-suhrn__suma"), lista: tx(".lcd1v-lista .lcd1v-lista__suma"), vidno: !!(e && e.getBoundingClientRect().height > 0) };
    })()`);
    if (!r.vidno) return "„Spolu“ nie je viditeľné";
    const n = cislo(r.spolu);
    if (cislo(r.lista) !== n) return `Spolu ${r.spolu} / lišta ${r.lista}`;
    return n;
  },

  /** Cena, ktorú zákazník vidí ako súčet (vzorkovník: „Spolu“). */
  zobrazenaCena: (t) => novy.zaloha(t),

  /** Odporúčaná cena v stĺpci vzorkovníka (nemá byť nikde) -> null alebo { cena, zlava, stitok }. */
  async odporucana(t) {
    const r = await t.ev(`(function () {
      var re = /(odpor[úu]čan[áa]|doporu[čc]en[áa])\\s+cena/i;
      var w = document.querySelector("${F} .p-info-wrapper");
      var m = w && re.exec((w.innerText || "").replace(/\\s+/g, " "));
      return m ? m[0] : null;
    })()`);
    return r ? { cena: NaN, zlava: NaN, stitok: r } : null;
  },

  /** Stav krokov a súhrnu (postup, triedy kariet, zoznam, tlačidlo) pre scenáre. */
  async stav(t) {
    return t.ev(`(function () {
      var kroky = Array.prototype.map.call(document.querySelectorAll("${KROK}"), function (k) {
        return { seria: k.getAttribute("data-lcd1v-vz-seria"), otvoreny: k.classList.contains("active"), hotovy: k.classList.contains("lcd1v-hotovy"),
          preskoceny: k.classList.contains("lcd1v-vz-preskoceny"), chyba: k.classList.contains("lcd1v-chyba"), vy: (k.querySelector(".lcd1v-vy") || {}).textContent || "" };
      });
      var kos = document.querySelector("${F} .add-to-cart button.add-to-cart-button");
      return { kroky: kroky, postup: (document.querySelector("${F} .lcd1v-vz-kroky .lcd1v-postup-st") || {}).textContent || "",
        zelene: document.querySelectorAll("${F} .lcd1v-vz-kroky .lcd1v-postup-dl i.h").length,
        zoznam: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-vz-zoz li"), function (li) { return li.getAttribute("data-kod"); }),
        pocetOdznak: (document.querySelector("${F} .lcd1v-vz-pocet") || {}).textContent || "", kos: kos ? kos.textContent.trim() : null,
        lista: (document.querySelector(".lcd1v-lista .lcd1v-lista__kos") || {}).textContent || "" };
    })()`);
  },

  /**
   * „Vložte do košíka“ (pri 0 vzorkách „Vyberte vzorky“ — nový vzhľad vtedy nič neodošle). PC: klik na živé tlačidlo
   * pod „Spolu“; telefón: kým je konfigurátor na obrazovke, lišta je zasunutá; pod ním sa vysunie a klikne sa na ňu
   * (bublina chatu Luxia ju neprekrýva).
   */
  async pridajDoKosika(t) {
    const kos = `${F} .add-to-cart button.add-to-cart-button`;
    const TEXT = `(function () { var b = document.querySelector("${kos}"), n = Number((b && b.getAttribute("data-lcd1v-vz-pocet")) || 0);
      return { text: b ? b.textContent.trim() : null, ocak: n > 0 ? "Vložte do košíka" : "Vyberte vzorky" }; })()`;
    let text = await t.ev(TEXT);
    for (let i = 0; i < 30 && text.text !== text.ocak; i++) { await pauza(100); text = await t.ev(TEXT); }
    if (text.text !== text.ocak) throw new Error(`tlačidlo košíka píše „${text.text}“, má „${text.ocak}“`);
    if (!t.mobil) { await t.klikni(kos, { popis: text.ocak }); return; }
    await t.ev(`document.querySelector("${kos}").scrollIntoView({ block: "center", behavior: "instant" })`);
    await pauza(500);
    if (await t.ev(`document.querySelector(".lcd1v-lista").classList.contains("on")`)) throw new Error("lišta je vysunutá, hoci je konfigurátor na obrazovke");
    await t.ev(`(function () { var b = document.querySelector("${F} .add-to-cart").getBoundingClientRect(); window.scrollTo(0, b.bottom + window.pageYOffset + 400); })()`);
    await t.cakaj(`document.querySelector(".lcd1v-lista").classList.contains("on")`, { ms: 10000, popis: "vysunutá lepivá lišta" });
    await pauza(450);
    const st = await t.ev(`(function () {
      var b = document.querySelector(".lcd1v-lista .lcd1v-lista__kos").getBoundingClientRect();
      var f = document.querySelector('iframe[title="Luxia chat"]'), r = f && f.getBoundingClientRect();
      var prienik = !!(r && r.height > 0 && r.height <= 130 && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top);
      return { text: document.querySelector(".lcd1v-lista .lcd1v-lista__kos").textContent.trim(), prienik: prienik, spodok: Math.round(b.bottom), vyska: innerHeight };
    })()`);
    if (st.prienik) throw new Error("bublina chatu Luxia prekrýva tlačidlo lišty");
    if (st.spodok > st.vyska) throw new Error("tlačidlo lišty presahuje spodok okna (" + st.spodok + " > " + st.vyska + ")");
    if (st.text !== text.ocak) throw new Error(`lišta píše „${st.text}“, má „${text.ocak}“`);
    await t.klikni(".lcd1v-lista .lcd1v-lista__kos", { popis: "lepivá lišta: " + text.ocak });
  },
};
