// Ovládač produktu „Box do kufra“ (616): počet boxov 1–3, farba (variant 78), veľkosť každého boxu.
// VLASTNÍK `novy`: worker boxy (T3.2, assets/js/components/konfigurator1v/boxy-produkt.js). `stary` = živý web
// (referencia, nemeniť, T0.2 14. 10. 2026). --novy/--vyvoj použije `novy`.
//
// Živý web (creatButtons.js amountChoser + productPage.js):
//   K1 „Počet boxov“  .content-wrap > .parameter-wrap:has(.amount-wrap)  — .amount-button „1 ks / 2 ks / 3 ks“ bez name,
//                     predvolene aktívne „2 ks“; klik volá resetBoxSizeOptions (1 ks vynuluje VŠETKY veľkosti, 2/3 ks
//                     len skryté) a neexistujúcu priceActualization (výnimka v konzole — chyba živého webu)
//   K2 „Farba boxov“  .content-wrap > .parameter-wrap.parameter-<id farba>  (variant, priceId)
//   K3 „Veľkosť“      .content-wrap > .parameter-wrap:has(.parameter-sizes) — v ňom .parameter-sizes[data-parameterid=<id>]
//                     pre 1./2./3. box (príplatky 94/97/100), tlačidlá .option-button[data-value]
//   Skrytý box dostane .val(0) -> select bez voľby „0“ -> selectedIndex -1 -> kľúč v POST chýba.
import { pauza } from "./cdp.mjs";
import { F, otvorKrok, hodnota } from "./stary-ui.mjs";

const KLUCE = ["box1", "box2", "box3"];
const vzorVelkosti = (v) => new RegExp("^" + v + "\\s*:", "i");

async function hodnoty(t) {
  const o = {};
  for (const k of KLUCE) o[k] = (await t.maParameter(k)) ? await hodnota(t, k) : "";
  return o;
}

export const stary = {
  meno: "stary",

  /** Klik na „n ks“ -> n (aktívne tlačidlo počtu). */
  async vyberPocet(t, n) {
    const sel = await otvorKrok(t, "pocet");
    await t.klikni(`${sel} .amount-wrap .amount-button`, { index: n - 1, popis: n + " ks" });
    await t.cakaj(`(function () { var a = document.querySelector(${JSON.stringify(sel + " .amount-button.active")}); return !!(a && a.textContent.trim().indexOf("${n}") === 0); })()`, { ms: 3000, popis: "aktívne " + n + " ks" });
    await pauza(300);
    return stary.pocet(t);
  },

  /** Aktívny počet boxov (číslo z „n ks“) alebo null. */
  async pocet(t) {
    const txt = await t.ev(`(function () { var a = document.querySelector("${F} .content-wrap .amount-wrap .amount-button.active"); return a ? a.textContent.trim() : ""; })()`);
    const n = parseInt(txt, 10);
    return Number.isFinite(n) ? n : null;
  },

  /** Farba boxov (index viditeľnej vzorky) -> value vo variant selecte farby. */
  async vyberFarbu(t, { index = 0 } = {}) {
    const sel = await otvorKrok(t, "farba");
    await t.klikni(`${sel} .option-button`, { index, popis: "farba boxov " + index });
    const id = await t.idParametra("farba");
    return t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "farba boxov vo formulári" });
  },

  /** Veľkosti 1., 2., 3. boxu (["S","L"] …) -> { box1, box2, box3 } hodnoty selectov po výbere. */
  async vyberVelkosti(t, velkosti) {
    const sel = await otvorKrok(t, "velkost");
    for (let i = 0; i < velkosti.length; i++) {
      const kluc = KLUCE[i];
      const id = await t.idParametra(kluc);
      const val = await t.moznost(kluc, vzorVelkosti(velkosti[i]));
      await t.klikni(`${sel} .parameter-sizes[data-parameterid="${id}"] .option-button[data-value="${val}"]`, { popis: (i + 1) + ". box " + velkosti[i] });
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${val}"`, { ms: 3000, popis: (i + 1) + ". box vo formulári" });
    }
    await pauza(300);
    return hodnoty(t);
  },

  /** Hodnoty selectov veľkostí { box1, box2, box3 } ('' = nevybrané alebo bez voľby). */
  hodnoty,
};

// ------------------------------------------------------------------ nový vzhľad (?novy=1 / ?novy=vyvoj)
// assets/js/components/konfigurator1v/boxy-produkt.js (T3.2): karty krokov z kroky.js (.lcd1v-krok.lcd1v-k-<meno>,
// hlavička .lcd1v-hd = živý akordeón). Poradie návrhu farba → počet → veľkosť (len CSS order, DOM ostáva).
//   farba    živé vzorky .lcd1v-k-farba > .options-wrap > .option-button + náhľad .lcd1v-bxp-nahlad
//   počet    karty .lcd1v-bxp-ks[data-ks=n] -> ctx.zapis("pocetKs", n) = živé „n ks“ (stav = aktívne živé tlačidlo)
//   veľkosť  skupiny .lcd1v-bxp-vgrp[data-box=i] (len v počte), karty .lcd1v-bxp-vk[data-hodnota=<value selectu>]
// Ovládač kliká len na to, čo zákazník vidí (t.klikni kontroluje viditeľnosť aj prekrytie bublinou Luxie).
const selNovy = (meno) => `${F} .lcd1v-krok.lcd1v-k-${meno}`;

async function otvorKartu(t, meno) {
  const { otvorKartu: otvor } = await import("./ovladac-kroky.mjs");
  return otvor(t, meno);
}

export const novy = {
  meno: "novy",

  /** Karta „Počet boxov“: klik na kartu „n× box“ -> n (aktívne živé tlačidlo „n ks“, karta aria-pressed). */
  async vyberPocet(t, n) {
    const sel = await otvorKartu(t, "pocet");
    await t.klikni(`${sel} .lcd1v-bxp-ks[data-ks="${n}"]`, { popis: "karta " + n + "× box" });
    await t.cakaj(`(function () {
      var a = document.querySelector("${F} .content-wrap .amount-wrap .amount-button.active");
      var k = document.querySelector(${JSON.stringify(sel + ' .lcd1v-bxp-ks[data-ks="' + n + '"]')});
      return !!(a && a.textContent.trim().indexOf("${n}") === 0 && k && k.getAttribute("aria-pressed") === "true");
    })()`, { ms: 3000, popis: "aktívne " + n + " ks + karta" });
    await pauza(300);
    return novy.pocet(t);
  },

  /** Aktívny počet boxov (živé tlačidlo „n ks“ — zdroj pravdy pre POST) alebo null. */
  pocet: stary.pocet,

  /** Karta „Farba boxov“: klik na vzorku (index viditeľnej) -> value vo variant selecte farby; náhľad materiálu sa ukáže. */
  async vyberFarbu(t, { index = 0 } = {}) {
    const sel = await otvorKartu(t, "farba");
    await t.klikni(`${sel} > .options-wrap > .option-button`, { index, popis: "vzorka farby boxov " + index });
    const id = await t.idParametra("farba");
    const v = await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value`, { popis: "farba boxov vo formulári" });
    await t.cakaj(`(function () { var n = document.querySelector("${sel} > .lcd1v-bxp-nahlad"); var i = n && n.querySelector("img"); return !!(n && !n.hidden && n.offsetHeight > 100 && i && i.getAttribute("src")); })()`, { popis: "náhľad materiálu boxu" });
    return v;
  },

  /** Karta „Veľkosť boxov“: pre i-ty box klik na kartu veľkosti v jeho skupine -> { box1, box2, box3 } hodnoty selectov. */
  async vyberVelkosti(t, velkosti) {
    const sel = await otvorKartu(t, "velkost");
    for (let i = 0; i < velkosti.length; i++) {
      const kluc = KLUCE[i];
      const id = await t.idParametra(kluc);
      const val = await t.moznost(kluc, vzorVelkosti(velkosti[i]));
      const grp = `${sel} .lcd1v-bxp-vgrp[data-box="${i + 1}"]`;
      await t.cakaj(`(function () { var g = document.querySelector(${JSON.stringify(grp)}); return !!(g && !g.hidden && g.offsetHeight > 0); })()`, { ms: 3000, popis: (i + 1) + ". box: skupina veľkostí viditeľná" });
      await t.klikni(`${grp} .lcd1v-bxp-vk[data-hodnota="${val}"]`, { popis: (i + 1) + ". box " + velkosti[i] });
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id}"]') || {}).value === "${val}"`, { ms: 3000, popis: (i + 1) + ". box vo formulári" });
      await t.cakaj(`(document.querySelector(${JSON.stringify(grp + ' .lcd1v-bxp-vk[data-hodnota="' + val + '"]')}) || {}).getAttribute("aria-pressed") === "true"`, { ms: 3000, popis: (i + 1) + ". box: karta zvolená" });
    }
    await pauza(300);
    return hodnoty(t);
  },

  /** Hodnoty selectov veľkostí { box1, box2, box3 } ('' = nevybrané alebo bez voľby). */
  hodnoty,

  /** Stav nového vzhľadu pre scenáre: viditeľné skupiny veľkostí, zvolené karty, zhrnutia kariet, „od“ ceny počtu. */
  async stav(t) {
    return t.ev(`(function () {
      function vid(e) { return !!(e && !e.hidden && e.getClientRects().length); }
      var p = document.querySelector(${JSON.stringify(selNovy("pocet"))}), v = document.querySelector(${JSON.stringify(selNovy("velkost"))});
      return {
        skupiny: Array.prototype.filter.call(document.querySelectorAll("${F} .lcd1v-bxp-vgrp"), function (g) { return !g.hidden; }).map(function (g) { return Number(g.getAttribute("data-box")); }),
        zvolene: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-bxp-vk[aria-pressed='true']"), function (b) { return b.closest(".lcd1v-bxp-vgrp").getAttribute("data-box") + ":" + b.getAttribute("data-hodnota"); }),
        pocetVyber: p ? p.getAttribute("data-lcd1v-vyber") : null, velkostVyber: v ? v.getAttribute("data-lcd1v-vyber") : null,
        od: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-bxp-ks .lcd1v-bxp-od"), function (e) { return e.textContent; }),
        ceny: Array.prototype.map.call(document.querySelectorAll("${F} .lcd1v-bxp-vgrp"), function (g) { return Array.prototype.map.call(g.querySelectorAll(".lcd1v-bxp-vk-c"), function (e) { return e.textContent; }).join(" "); }),
        postup: (document.querySelector(".lcd1v-postup-st") || {}).textContent || "",
        set: vid(document.querySelector(".lcd1v-bxp-set")) ? document.querySelector(".lcd1v-bxp-set").innerText.replace(/\\s+/g, " ").trim() : null
      };
    })()`);
  },
};
