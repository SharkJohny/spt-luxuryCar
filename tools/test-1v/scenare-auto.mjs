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
//                  + pokus prejsť na inú kartu bez auta (nezávislá kontrola 16. 10. 2026: klik na hlavičku Farba vyhodil
//                  výzvu, zavrel kartu auta, po „Rozumiem“ boli otvorené dve karty a vzorka farby sa po 1 s odznačila) =
//                  to isté ako „Pokračujte ďalej“ v karte auta: hlavička Farba (2×) aj vzorka farby v otvorenej karte
//                  farby -> bez výzvy, nič sa neodznačí, otvorená len karta auta, chýbajúce polia červené, Značka na
//                  obrazovke; „Pokračujte ďalej“ vzoru (karta pred autom) -> karta auta bez výzvy
//   box-bez-auta   karta boxov bez auta (kontrola aee13cf 17. 10. 2026: klik na „1× box“ stmavil stránku a okno boxov sa
//                  neukázalo — živé okno sa otvorilo v kroku boxov, kroky.js hneď nato krok zbalil a prešiel na auto, takže
//                  ostalo tmavé pozadie bez okna a stránka sa nedala posúvať): klik na „1× box“ aj „2× box“ v otvorenom
//                  kroku Boxy bez auta = „Pokračujte ďalej“ v karte auta (ako hlavička / voľba inej karty za autom, §15):
//                  bez výzvy, bez tmavej stránky (žiadne pozadie, okno nezačne, body sa dá posúvať), box sa neoznačí,
//                  otvorená len karta auta, 4 polia červené, Značka na obrazovke; po aute (+ farba, rozloženie) sa okno
//                  boxov otvorí normálne a 1 box (farba 1, M) -> POST ako box-1
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
    var otvorene = Array.prototype.map.call(f.querySelectorAll(".lcd1v-krok.active"), function (e) { return ((e.className.match(/lcd1v-k-([a-z0-9]+)/) || [])[1]) || e.className; });
    return {
      dvere: akt("door-Position"), miesta: akt("sit-Position"), ss: ss,
      vyzva: !!(o && o.offsetHeight > 0),
      otvorene: otvorene,
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

/** Pokus prejsť ďalej bez auta = „Pokračujte ďalej“ v karte auta: bez výzvy, len karta auta otvorená, chýbajúce polia červené, prvé na obrazovke. */
function overAkoPokracovat(j, st, kedy, { dvere, miesta } = {}) {
  j.over(!st.vyzva, kedy + ": vyskočila výzva „vyberte model“ — má len zvýrazniť, čo v karte auta chýba (ako „Pokračujte ďalej“)");
  j.over(JSON.stringify(st.otvorene) === '["auto"]', kedy + ": otvorené karty " + JSON.stringify(st.otvorene) + ", má byť len karta auta");
  j.over(st.ramKarty && st.hlaska, kedy + ": rám karty auta " + st.ramKarty + ", hláška " + st.hlaska);
  j.over(JSON.stringify(st.polia) === JSON.stringify(POLIA), kedy + ": červené polia " + JSON.stringify(st.polia) + ", majú byť všetky " + JSON.stringify(POLIA));
  j.over(st.prve && st.prve.pole === "brands" && st.prve.top >= st.prve.hH && st.prve.bottom <= st.prve.vh,
    kedy + ": prvé chýbajúce pole (Značka) nie je na obrazovke: " + JSON.stringify(st.prve));
  if (dvere) j.over(st.dvere === dvere && st.ss.doorPosition === dvere, kedy + ": dvere " + st.dvere + " (sessionStorage " + st.ss.doorPosition + "), má " + dvere);
  if (miesta) j.over(st.miesta === miesta && st.ss.seatPosition === miesta, kedy + ": miesta " + st.miesta + " (sessionStorage " + st.ss.seatPosition + "), má " + miesta);
}

/**
 * Okno boxov a tmavé pozadie, ako ich vidí zákazník: { tma: pozadie viditeľné, okno: okno viditeľné na obrazovke, showConf,
 * zamknute: body nepustí posúvanie, karta: označená karta počtu (0 = Nechcem / nič), pocet: živá karta (conf1/conf2/"") }.
 */
function stavOkna(t) {
  return t.ev(`(function () {
    var f = document.getElementById("product-detail-form");
    var b = f.querySelector(".upsale-Banner"), o = f.querySelector(".upsale-Banner .box-config"), p = document.querySelector(".lcd1v-bx-pozadie");
    function vid(e) {
      if (!e) return false;
      var c = getComputedStyle(e), r = e.getBoundingClientRect();
      if (c.visibility !== "visible" || parseFloat(c.opacity || "1") < 0.5 || r.width < 50 || r.height < 50) return false;
      if (r.bottom < 1 || r.top > innerHeight - 1 || r.right < 1 || r.left > innerWidth - 1) return false;
      // okno je v kroku boxov: zbalený krok (akordeón) ho môže orezať / skryť, hoci sám je fixed
      for (var q = e.parentElement; q && q !== document.body; q = q.parentElement) { var s = getComputedStyle(q); if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity || "1") < 0.05) return false; }
      var x = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + Math.min(r.height / 2, 60)));
      return !!(x && (x === e || e.contains(x)));
    }
    var k = f.querySelector('.upsale-buttons.boxs .lcd1v-kb__karta[aria-pressed="true"]');
    var zive = f.querySelector(".upsale-buttons.boxs > .parameter-cars > .upsale-button.active");
    return {
      tma: vid(p), okno: vid(o), showConf: !!(b && b.classList.contains("showConf")),
      zamknute: getComputedStyle(document.body).overflow === "hidden" || getComputedStyle(document.body).overflowY === "hidden",
      karta: k ? Number(k.getAttribute("data-boxy")) : 0,
      pocet: zive ? (zive.getAttribute("value") || "") : "",
    };
  })()`);
}

export const SCENARE = {
  "box-bez-auta": {
    typy: ["jedno", "dvoj"],
    async fn(s, a, pom, ovl, j) {
      const p = preskocBez(a);
      if (p) return p;
      const t = s.t, P = a.produkt;
      const info = [];
      const KB = `${F} .upsale-buttons.boxs`;
      const snimka = async (meno) => {
        if (!a.snimky) return;
        await j.pauza(300);
        await s.k.snimka(join(a.snimky, `${P.id}-box-bez-auta-${meno}-${t.sirka}.png`)).catch(() => {});
      };
      await j.otvor(s, a.url, { novy: true });
      const auto = `${F} .lcd1v-krok.lcd1v-k-auto`;
      for (const pocet of [1, 2]) {
        // krok Boxy otvorený bez auta (stav z kontroly aee13cf; hlavičku boxov bez auta kroky.js presmeruje na auto, preto
        // ho test otvorí živým akordeónom __lcdSetStepOpen — ostatné kroky zavrie), klik na kartu počtu je skutočný
        await t.ev(`(function () {
          var f = document.getElementById("product-detail-form"), b = f.querySelector(".upsale-buttons.boxs");
          f.querySelectorAll(".lcd1v-krok.active").forEach(function (k) { if (k !== b) window.__lcdSetStepOpen(k, false); });
          window.__lcdSetStepOpen(b, true);
        })()`);
        const karta = `${KB} .lcd1v-kb__karta[data-boxy="${pocet}"]`;
        await t.cakaj(`(function () { var e = document.querySelector(${JSON.stringify(karta)}); return !!(e && e.getBoundingClientRect().height > 40); })()`, { popis: "otvorený krok Boxy bez auta" });
        await j.pauza(500);
        await t.klikni(karta, { popis: pocet + "× box bez auta" });
        await t.cakaj(`!!document.querySelector(".overflow") || !!document.querySelector(${JSON.stringify(auto + ".lcd1v-chyba")}) || document.body.classList.contains("lcd1v-bx-otvorene")`, { ms: 4000 }).catch(() => {});
        await j.pauza(1600); // verifikačný posun (settle + korekcia do ~1,5 s)
        const ok = await stavOkna(t);
        await snimka("klik-" + pocet);
        const kedy = "klik na „" + pocet + "× box“ bez auta";
        // nikdy tmavá stránka bez okna (zákazník by nevidel nič a nemohol by posúvať)
        j.over(!ok.tma || ok.okno, kedy + ": stmavená stránka bez okna boxov " + JSON.stringify(ok));
        j.over(!ok.tma && !ok.showConf && !ok.zamknute, kedy + ": má byť ako „Pokračujte ďalej“ v karte auta — bez okna boxov a bez tmavého pozadia " + JSON.stringify(ok));
        await j.pauza(900); // poistka G10b (kufor-boxy.js, 0,7 s) by neúplný box vrátila na Nechcem
        const ok2 = await stavOkna(t);
        j.over(ok2.karta === 0 && !ok2.pocet && !ok2.tma && !ok2.showConf, kedy + ": box sa nemá označiť ani otvoriť okno " + JSON.stringify(ok2));
        overAkoPokracovat(j, await stav(t), kedy);
        info.push(pocet + "× box bez auta: ako Pokračujte (bez okna a tmy, len karta auta, 4 polia červené)");
      }

      // po aute, farbe a rozložení sa okno boxov otvorí normálne -> 1 box (farba 1, M) -> POST ako box-1
      const z = await j.zaklad(s, ovl, { rozlozenie: 0 });
      const b = await ovl.kuforBoxy.vyberBoxy(t, { pocet: 1, farba: 1, velkost: "M" });
      j.over(b.farbaBoxov && b.boxSolo, "po aute: 1 box sa nezapísal " + JSON.stringify(b));
      const ok = await stavOkna(t);
      j.over(!ok.tma && !ok.showConf && !ok.zamknute, "po potvrdení boxov ostalo okno / tmavé pozadie " + JSON.stringify(ok));
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { ...z.ocak, farbaBoxov: b.farbaBoxov, boxSolo: b.boxSolo });
      const c = await j.overCenu(s, ovl, cena);
      info.push("po aute okno boxov normálne, POST 1 box M, cena " + c.videne);
      return { info: info.join("; "), post: post.body, spolu: cena.spolu };
    },
  },

  "auto-poradie": {
    typy: ["jedno", "dvoj"], // rohože do kufra (kufor-*) majú dlaždice miest a dverí v karte auta skryté
    async fn(s, a, pom, ovl, j) {
      const p = preskocBez(a);
      if (p) return p;
      const t = s.t, P = a.produkt;
      const info = [];
      const chat = `document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"], iframe[title="Luxia chat"], [id*="smartsupp"]')`;
      const snimka = async (meno) => {
        if (!a.snimky) return;
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

      // 1b) klik na hlavičku inej karty (Farba) bez auta = „Pokračujte ďalej“ v karte auta (Michal: „verifikácia až keď
      //     klikne na Pokračovať a niečo nemá vybraté — zvýrazni, čo nevybral“); 2× — druhý klik nesmie kartu otvoriť
      let st;
      const selF = `${F} .lcd1v-krok.lcd1v-k-farba`;
      const zaVyzvou = `!!document.querySelector(".overflow") || !!document.querySelector(${JSON.stringify(sel + ".lcd1v-chyba")})`;
      for (const kolo of [1, 2]) {
        await t.klikni(`${selF} > .lcd1v-hd`, { popis: "hlavička karty Farba bez auta" + (kolo > 1 ? " (znova)" : ""), vRamci: selF });
        await t.cakaj(zaVyzvou, { ms: 4000 }).catch(() => {});
        await j.pauza(1600); // verifikačný posun (settle + korekcia do ~1,5 s), živé odznačenie po 1 s
        overAkoPokracovat(j, await stav(t), "klik na hlavičku Farba bez auta" + (kolo > 1 ? " (znova)" : ""), { dvere: DVERE, miesta: MIESTA });
        if (kolo === 1) await snimka("d-hlavicka-farby-bez-auta");
      }
      info.push("hlavička Farba bez auta 2×: ako Pokračujte (len karta auta, 4 polia červené, Značka na obrazovke)");

      // 1c) vzorka farby v otvorenej karte farby bez auta (stav, do ktorého sa zákazník dostal starou chybou — karta farby
      //     otvorená vedľa karty auta; test ju otvorí živým akordeónom __lcdSetStepOpen, klik na vzorku je skutočný):
      //     výber vzorky ostane (nič sa neodznačí), potom ako „Pokračujte ďalej“ v karte auta
      const vzorky = `Array.prototype.filter.call(document.querySelectorAll(${JSON.stringify(selF + " > .options-wrap > .option-button")}), function (b) { return b.getBoundingClientRect().height > 20; })`;
      await t.ev(`window.__lcdSetStepOpen(document.querySelector(${JSON.stringify(selF)}), true)`);
      const pocetVzoriek = await t.cakaj(`${vzorky}.length`, { popis: "viditeľné vzorky farby" });
      const iVzorky = pocetVzoriek >= 6 ? 5 : 1; // iná ako neskôr v kroku 4 (index 2); Hexa má 3 farby
      const vsetkyVzorky = `Array.prototype.slice.call(document.querySelectorAll(${JSON.stringify(selF + " > .options-wrap > .option-button")}))`;
      const iVsetky = await t.ev(`${vsetkyVzorky}.indexOf(${vzorky}[${iVzorky}])`);
      await j.pauza(500);
      await t.klikni(`${selF} > .options-wrap > .option-button`, { index: iVzorky, popis: "vzorka farby " + iVzorky + " bez auta" });
      await j.pauza(1600); // živý validation.js odznačoval vzorku po 1 s
      st = await stav(t);
      const vzorka = await t.ev(`${vsetkyVzorky}.map(function (b, i) { return b.classList.contains("active") ? i : -1; }).filter(function (i) { return i > -1; })`);
      j.over(JSON.stringify(vzorka) === JSON.stringify([iVsetky]), "vzorka farby " + iVzorky + " bez auta: aktívne " + JSON.stringify(vzorka) + ", má [" + iVsetky + "] — výber zákazníka sa nesmie stratiť (živý validation.js ju po 1 s odznačil)");
      overAkoPokracovat(j, st, "vzorka farby bez auta", { dvere: DVERE, miesta: MIESTA });
      info.push("vzorka farby bez auta: ostane vybraná, ako Pokračujte");

      // 1d) „Pokračujte ďalej“ vzoru (karta PRED autom) bez auta -> len otvorí kartu auta, bez výzvy
      await otvorKartu(t, "vzor");
      await t.klikni(`${F} .lcd1v-krok.lcd1v-k-vzor > .next-step-button`, { popis: "Pokračujte ďalej vo vzore bez auta" });
      await t.cakaj(`document.querySelector(${JSON.stringify(sel)}).classList.contains("active")`, { ms: 4000, popis: "otvorená karta auta po „Pokračujte ďalej“ vzoru" });
      await j.pauza(1200);
      st = await stav(t);
      j.over(!st.vyzva, "„Pokračujte ďalej“ vzoru bez auta: vyskočila výzva „vyberte model“ (karta auta sa má len otvoriť)");
      j.over(JSON.stringify(st.otvorene) === '["auto"]', "„Pokračujte ďalej“ vzoru: otvorené karty " + JSON.stringify(st.otvorene) + ", má byť len karta auta");
      info.push("Pokračujte vo vzore bez auta: karta auta bez výzvy");

      // 2) „Pokračujte ďalej“ bez auta -> zvýraznené presne chýbajúce polia, posun na prvé
      await t.klikni(`${sel} > .next-step-button`, { popis: "Pokračujte ďalej bez auta" });
      await t.cakaj(`!!document.querySelector(${JSON.stringify(sel)} + ".lcd1v-chyba")`, { ms: 4000, popis: "červený rám karty auta po „Pokračujte ďalej“" });
      await j.pauza(1600); // posun stránky (živý engine + kroky.js) dobehne
      st = await stav(t);
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
          // Luxia na telefóne po ~25 s rozbalí pozdrav cez spodok okna (360×348, nie je to vec konfigurátora) — na 560 px by
          // zakryl tlačidlo v strede okna; len na tento klik skrytý (ako na snímkach)
          await t.ev(`[].forEach.call(${chat}, function (f) { f.style.setProperty("visibility", "hidden", "important"); })`);
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
            await t.ev(`[].forEach.call(${chat}, function (f) { f.style.removeProperty("visibility"); })`).catch(() => {});
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
