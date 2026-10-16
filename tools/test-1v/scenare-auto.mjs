// Scenáre karty „Vaše auto“ v novom vzhľade (Michal 16. 10. 2026, telefón): počet dverí a miest sa dá vybrať v ľubovoľnom
// poradí so značkou, modelom a rokom — nič sa nevymaže a počas vyberania nesvieti žiadne overenie. Až „Pokračujte ďalej“
// bez auta zvýrazní presne chýbajúce polia (červený rám karty + polia) a posunie na prvé z nich; po doplnení zmizne.
// JADRO opravy: assets/js/functions/validation.js (pod body.lcd-1v karta auta výzvu neukazuje) + konfigurator1v/kroky.js.
// Tvar a parametre scenára: tools/test-1v/scenare-jedno.mjs. Bez flagu sa scenár preskočí (starý vzhľad = nulová zmena:
// tam výzva „vyberte model“ po kliku na dlaždicu dverí/miest ostáva a po 1 s dlaždicu odznačí — validation.js).
//
//   auto-poradie   karta auta: 3 dvere a 4 miesta PRED autom -> žiadna výzva, žiadny červený rám, voľba ostane
//                  (dlaždica aj sessionStorage); „Pokračujte ďalej“ bez auta -> bez výzvy, červený rám karty, všetky 4 polia
//                  auta červené, prvé chýbajúce pole na obrazovke; postupné doplnenie -> zvýraznenie polí mizne po jednom,
//                  rám karty po poslednom; dvere a miesta stále tie isté; farba (+ 2. vrstva) + rozloženie -> POST = baseline
//                  starého vzhľadu (scenare-druha.mjs) a v sessionStorage doorPosition doors-3 / seatPosition pass-4
//                  (cart.js ich v pokladni zapíše do varchar2/varchar3 ako zo starého vzhľadu)
import { join } from "node:path";
import { F } from "./stary-ui.mjs";
import { otvorKartu } from "./ovladac-kroky.mjs";
import { BASELINE } from "./scenare-druha.mjs";

const DVERE = "doors-3", MIESTA = "pass-4"; // obe iné ako predvolené (doors-4, pass-5)
const POLIA = ["brands", "models", "years", "type-selector"];
const preskocBez = (a) => (a.novy ? null : { preskoc: "len nový vzhľad (?novy=1); starý vzhľad bez zmeny (nulova-zmena)" });

/** Stav karty auta, ako ho vidí zákazník. */
function stav(t) {
  return t.ev(`(function (POLIA) {
    var f = document.getElementById("product-detail-form");
    var k = f.querySelector(".lcd1v-krok.lcd1v-k-auto");
    function vid(e) { if (!e) return false; var r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 0 && r.height > 0 && c.display !== "none" && c.visibility !== "hidden"; }
    function akt(c) { var b = k.querySelector("." + c + " .option-button.active"); return b ? b.getAttribute("data-value") : null; }
    var ss = {}; ["seatPosition", "doorPosition", "model"].forEach(function (x) { try { ss[x] = sessionStorage.getItem(x); } catch (e) { ss[x] = "?"; } });
    var o = document.querySelector(".overflow");
    var cervene = Array.prototype.filter.call(document.querySelectorAll("#product-detail-form .lcd1v-chyba, #product-detail-form .lcd1v-err, #product-detail-form .lcd-needs-fill, #model-selector.errorToCart"), vid)
      .map(function (e) { return (e.className || "").toString().split(/\\s+/).filter(function (c) { return /lcd1v-k-|lcd1v-chyba|lcd1v-err|lcd-needs-fill|errorToCart|brands|models|years|type-selector/.test(c); }).join("."); });
    var hlaska = k.querySelector(":scope > .lcd1v-chyba-tx");
    var hH = 0;
    [".plugin-fixed-header", ".top-navigation-bar", "header.header", "header"].some(function (s) { var e = document.querySelector(s); if (e && e.offsetHeight > 20 && /fixed|sticky/.test(getComputedStyle(e).position)) { hH = e.offsetHeight; return true; } return false; });
    var prve = k.querySelector(".lcd1v-pole.lcd1v-err");
    var pr = prve && prve.getBoundingClientRect();
    return {
      dvere: akt("door-Position"), miesta: akt("sit-Position"), ss: ss,
      vyzva: !!(o && o.offsetHeight > 0),
      cervene: cervene,
      ramKarty: k.classList.contains("lcd1v-chyba"),
      hlaska: vid(hlaska),
      polia: POLIA.filter(function (p) { var w = k.querySelector(".modl-selector-wrap .surcharge-list." + p); return w && w.classList.contains("lcd1v-err"); }),
      prve: prve ? { pole: POLIA.filter(function (p) { return prve.classList.contains(p); })[0], top: Math.round(pr.top), bottom: Math.round(pr.bottom), hH: hH, vh: innerHeight } : null,
    };
  })(${JSON.stringify(POLIA)})`);
}

/** Počas vyberania: žiadna výzva, nič červené, voľba dverí a miest drží (dlaždica aj sessionStorage). */
function overTicho(j, st, kedy, { dvere, miesta } = {}) {
  j.over(!st.vyzva, kedy + ": vyskočila výzva „vyberte model“ (overenie má byť až pri „Pokračujte ďalej“)");
  j.over(!st.cervene.length && !st.hlaska, kedy + ": počas vyberania svieti červené " + JSON.stringify(st.cervene) + (st.hlaska ? " + hláška" : ""));
  if (dvere) j.over(st.dvere === dvere && st.ss.doorPosition === dvere, kedy + ": dvere " + st.dvere + " (sessionStorage " + st.ss.doorPosition + "), má " + dvere);
  if (miesta) j.over(st.miesta === miesta && st.ss.seatPosition === miesta, kedy + ": miesta " + st.miesta + " (sessionStorage " + st.ss.seatPosition + "), má " + miesta);
}

export const SCENARE = {
  "auto-poradie": {
    typy: ["jedno", "dvoj"], // rohože do kufra (kufor-*) majú dlaždice miest a dverí v karte auta skryté
    async fn(s, a, pom, ovl, j) {
      const p = preskocBez(a);
      if (p) return p;
      const t = s.t, P = a.produkt;
      const info = [];
      const snimka = async (meno) => {
        if (!a.snimky) return;
        const chat = `document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"], iframe[title="Luxia chat"], [id*="smartsupp"]')`;
        await t.ev(`[].forEach.call(${chat}, function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);
        await j.pauza(500);
        await s.k.snimka(join(a.snimky, `${P.id}-auto-poradie-${meno}-${t.sirka}.png`)).catch(() => {});
        await t.ev(`[].forEach.call(${chat}, function (f) { f.style.removeProperty("visibility"); })`);
      };
      await j.otvor(s, a.url, { novy: true });
      const sel = await otvorKartu(t, "auto");
      const w = `${sel} .modl-selector-wrap`;

      // 1) dvere a miesta pred autom (Michal: „v ľubovoľnom poradí“)
      await t.klikni(`${sel} .door-Position .option-button[data-value="${DVERE}"]`, { popis: "3 dvere pred autom" });
      await j.pauza(1400); // živý validation.js odznačoval dlaždicu po 1 s
      overTicho(j, await stav(t), "po kliku na 3 dvere bez auta", { dvere: DVERE });
      await t.klikni(`${sel} .sit-Position .option-button[data-value="${MIESTA}"]`, { popis: "4 miesta pred autom" });
      await j.pauza(1400);
      overTicho(j, await stav(t), "po kliku na 4 miesta bez auta", { dvere: DVERE, miesta: MIESTA });
      await t.ev(`document.querySelector(${JSON.stringify(w + " .brands")}).scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -70)`);
      await snimka("a-dvere-miesta-pred-autom");
      info.push("dvere+miesta pred autom: ticho, voľba drží");

      // 2) „Pokračujte ďalej“ bez auta -> zvýraznené presne chýbajúce polia, posun na prvé
      await t.klikni(`${sel} > .next-step-button`, { popis: "Pokračujte ďalej bez auta" });
      await t.cakaj(`!!document.querySelector(${JSON.stringify(sel)} + ".lcd1v-chyba")`, { ms: 4000, popis: "červený rám karty auta po „Pokračujte ďalej“" });
      await j.pauza(1600); // posun stránky (živý engine + kroky.js) dobehne
      let st = await stav(t);
      j.over(!st.vyzva, "„Pokračujte ďalej“ bez auta: výzva „vyberte model“ — má len zvýrazniť chýbajúce polia");
      j.over(st.ramKarty && st.hlaska, "„Pokračujte ďalej“ bez auta: rám karty " + st.ramKarty + ", hláška " + st.hlaska);
      j.over(JSON.stringify(st.polia) === JSON.stringify(POLIA), "„Pokračujte ďalej“ bez auta: červené polia " + JSON.stringify(st.polia) + ", majú byť všetky " + JSON.stringify(POLIA));
      j.over(st.prve && st.prve.pole === "brands" && st.prve.top >= st.prve.hH && st.prve.bottom <= st.prve.vh,
        "prvé chýbajúce pole (Značka) nie je na obrazovke po „Pokračujte ďalej“: " + JSON.stringify(st.prve));
      j.over(st.dvere === DVERE && st.miesta === MIESTA, "„Pokračujte ďalej“ zmazal dvere/miesta: " + st.dvere + " / " + st.miesta);
      await snimka("b-pokracovat-bez-auta");
      info.push("Pokračujte ďalej bez auta: rám + 4 polia, Značka na obrazovke");

      // 3) doplnenie po jednom: zvýraznenie poľa zmizne hneď, rám karty po poslednom
      const hodnoty = { brands: j.AUTO.znacka, models: j.AUTO.model, years: j.AUTO.rok, "type-selector": j.AUTO.typ };
      for (let i = 0; i < POLIA.length; i++) {
        const pole = POLIA[i];
        if (pole === "type-selector") {
          // nízka obrazovka (telefón s lištami prehliadača, 560 px): chýba len Typ karosérie -> „Pokračujte ďalej“ ho musí
          // ukázať (vrch karty by nestačil, pole je ~600 px pod ním)
          await t.cakaj(`!document.querySelector(${JSON.stringify(sel)} + ".lcd-needs-fill")`, { ms: 6000, popis: "živé .lcd-needs-fill zmizlo (3 s)" });
          await s.k.posli("Emulation.setDeviceMetricsOverride", { width: s.k.sirka, height: 560, deviceScaleFactor: 1, mobile: !!s.k.mobil });
          try {
            await j.pauza(400);
            await t.klikni(`${sel} > .next-step-button`, { popis: "Pokračujte ďalej bez typu karosérie (560 px)" });
            await j.pauza(2000); // verifikačný posun engine (settle + korekcia do ~1,5 s)
            st = await stav(t);
            j.over(!st.vyzva && st.ramKarty && JSON.stringify(st.polia) === '["type-selector"]', "bez typu karosérie: výzva " + st.vyzva + ", rám " + st.ramKarty + ", červené " + JSON.stringify(st.polia));
            j.over(st.prve && st.prve.pole === "type-selector" && st.prve.top >= st.prve.hH && st.prve.bottom <= st.prve.vh,
              "nízka obrazovka: chýbajúce pole Typ karosérie nie je po „Pokračujte ďalej“ na obrazovke: " + JSON.stringify(st.prve));
            info.push("560 px: posun na Typ karosérie");
          } finally {
            await s.k.posli("Emulation.setDeviceMetricsOverride", { width: s.k.sirka, height: s.k.vyska, deviceScaleFactor: 1, mobile: !!s.k.mobil });
            await j.pauza(300);
          }
        }
        if (pole === "models") await t.cakaj(`document.querySelector("${w} .models select").options.length > 1`, { popis: "zoznam modelov" });
        await t.nastavSelect(`${w} .${pole} select`, hodnoty[pole]);
        await j.pauza(400);
        st = await stav(t);
        const zostava = POLIA.slice(i + 1);
        j.over(JSON.stringify(st.polia) === JSON.stringify(zostava), "po vyplnení " + pole + ": červené polia " + JSON.stringify(st.polia) + ", majú " + JSON.stringify(zostava));
        j.over(!st.vyzva, "po vyplnení " + pole + ": výzva „vyberte model“");
        if (zostava.length) j.over(st.ramKarty, "po vyplnení " + pole + " (chýba " + zostava.join(", ") + "): rám karty zmizol priskoro");
      }
      await t.cakaj(`(function () { var k = document.querySelector(".lcd1v-kompat"); return !!(k && !k.hidden && k.offsetHeight > 0); })()`, { ms: 25000, popis: "pás kompatibility s autom" });
      await j.pauza(600);
      st = await stav(t);
      overTicho(j, st, "auto doplnené", { dvere: DVERE, miesta: MIESTA });
      j.over(st.ss.model === [j.AUTO.znacka, j.AUTO.model, j.AUTO.rok, j.AUTO.typ].join(" "), "sessionStorage.model = " + st.ss.model);
      await t.ev(`document.querySelector(${JSON.stringify(w + " .brands")}).scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -70)`);
      await snimka("c-vsetko-doplnene");
      info.push("doplnené: zvýraznenie mizne po poliach, dvere/miesta ostali");

      // 4) zvyšok setu ako baseline (farba index 2, 2. vrstva index 0, 1.+2. rad) -> POST = starý vzhľad
      const ocak = {};
      ocak.farba = await ovl.kroky.vyberFarbu(t, { index: 2 });
      if (P.typ === "dvoj") ocak.farba2 = await ovl.farba2.vyberFarbu2(t, { index: 0 });
      ocak.rozlozenie = await ovl.rozlozenie.vyberRozlozenie(t, { index: 1 });
      st = await stav(t);
      j.over(st.dvere === DVERE && st.miesta === MIESTA && st.ss.doorPosition === DVERE && st.ss.seatPosition === MIESTA,
        "po farbe a rozložení: dvere " + st.dvere + "/" + st.ss.doorPosition + ", miesta " + st.miesta + "/" + st.ss.seatPosition);
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, ocak);
      await j.overCenu(s, ovl, cena);
      if (BASELINE[P.id]) {
        const base = Object.fromEntries(new URLSearchParams(BASELINE[P.id]));
        const rozdiel = [];
        Object.keys(base).forEach((k) => { if (/^parameter-\d+$/.test(k) && !(k in post.pole)) return; if (post.pole[k] !== base[k]) rozdiel.push(k + ": " + post.pole[k] + " ≠ " + base[k]); });
        Object.keys(post.pole).forEach((k) => { if (!(k in base)) rozdiel.push(k + " navyše"); });
        j.over(!rozdiel.length, "POST " + P.id + " ≠ baseline starého vzhľadu: " + rozdiel.join("; "));
      }
      const ss = await t.ev(`({ d: sessionStorage.getItem("doorPosition"), m: sessionStorage.getItem("seatPosition") })`);
      j.over(ss.d === DVERE && ss.m === MIESTA, "pri košíku sessionStorage dvere " + ss.d + ", miesta " + ss.m + " (cart.js ich pošle do objednávky)");
      info.push("POST = baseline, " + DVERE + "/" + MIESTA + " v sessionStorage");
      return { info: info.join("; "), post: post.body, spolu: cena.spolu };
    },
  },
};
