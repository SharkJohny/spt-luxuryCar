// Scenáre navyše pre box do kufra 616 (typ „boxy“). VLASTNÍK: worker boxy (W4 / T3.2). Tvar: scenare-jedno.mjs.
// Spoločné scenáre v jadre: brana, nulova-zmena, neuplne (farba -> veľkosť, POST 0), platne (1 × M), dokoncit
// (starý web: tlačidlo posledného kroku = živý POST, zachytený a zrušený), k-suhrnu (nový vzhľad).
//
// Živý POST boxu (14. 10. 2026): productId, priceId, language, amount, parameterValueId[78], surchargeParameterValueId[94]
// (+ [97] pri 2–3 ks, + [100] pri 3 ks). Box, ktorý nie je v počte, v POST CHÝBA (živý .val(0) -> selectedIndex -1).
// Ceny: 1. box v cene produktu (S +0, M +10, L +35, XL +49), 2. a 3. box plná cena (S 197 … XL 246; XL zjednotené s 1. boxom 24. 10. 2026).
//
// Nový vzhľad (T3.2, boxy-produkt.js; ovládač ovladac-boxy-produkt.mjs `novy`): JEDNA karta „Vaše boxy do kufra“
// (Michal 23. 10. 2026) — farba, počet a veľkosti na jednom mieste, štart s 1 boxom; košík len s veľkosťou KAŽDÉHO boxu
// v počte (živý web pustí aj 2 ks s jednou veľkosťou). Scenáre len pre nový vzhľad (box-start, box-2-neuplne,
// box-jedna-karta, box-farby) sa v starom preskočia; všetky sú v profile 616 (produkty.mjs).
// --snimky: box-start, box-2-neuplne a box-jedna-karta uložia aj snímku celej karty (616-karta-<stav>-<šírka>.png).

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { F } from "./stary-ui.mjs";

const VELKOST = (v) => new RegExp("^" + v + "\\s*:", "i");

/**
 * Snímka celej karty boxov pre ľudskú kontrolu (len s --snimky): výrez strany od 40 px nad kartou po 40 px pod ňou
 * (aj mimo okna), bublina chatu skrytá. Vypíše do s.upozornenia vodorovné pretekanie stránky.
 */
async function snimkaKarty(s, a, meno) {
  if (!a.snimky) return;
  const t = s.t;
  const chat = `document.querySelectorAll('iframe[src*="luxia"], iframe[src*="rostiapp"], [id*="smartsupp"]')`;
  const r = await t.ev(`(function () {
    [].forEach.call(${chat}, function (f) { f.style.setProperty("visibility", "hidden", "important"); });
    var k = document.querySelector("${F} .lcd1v-k-farba"), b = k && k.getBoundingClientRect();
    if (!b) return null;
    return { y: Math.max(0, Math.round(b.top + window.scrollY - 40)), h: Math.round(b.height + 80), pretek: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0 };
  })()`);
  if (!r) return;
  if (r.pretek) s.upozornenia.push(`snímka ${meno} (${t.sirka}): stránka preteká do šírky ${r.pretek} px`);
  await t.pauza(500);
  try {
    const o = await s.k.posli("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: r.y, width: t.sirka, height: Math.min(r.h, 6000), scale: 1 } });
    writeFileSync(join(a.snimky, `${a.produkt.id}-karta-${meno}-${t.sirka}.png`), Buffer.from(o.data, "base64"));
  } catch (e) { s.upozornenia.push("snímka " + meno + ": " + e.message); }
  await t.ev(`[].forEach.call(${chat}, function (f) { f.style.removeProperty("visibility"); })`);
}

/** Kľúče POST boxu -> „[94] [97]“ (len príplatky veľkostí, ktoré v tele sú). */
function klucePost(s, pole, ids) {
  return ids.filter((id) => ("surchargeParameterValueId[" + id + "]") in pole).map((id) => "[" + id + "]").join(" ");
}

async function pocetBoxov(s, a, ovl, j, pocet, velkosti) {
  await j.otvor(s, a.url, { novy: a.novy });
  const z = await j.zaklad(s, ovl, { pocet, velkosti });
  j.over(z.pocet === pocet, "počet boxov " + z.pocet + " ≠ " + pocet);
  await ovl.cena.pridajDoKosika(s.t);
  const post = await j.cakajNaPost(s);
  const cena = await j.overPost(s, post, z.ocak);
  const c = await j.overCenu(s, ovl, cena);
  // nepoužité boxy v POST chýbajú (ako starý vzhľad, baseline 14. 10. 2026)
  const ids = [];
  for (const k of ["box1", "box2", "box3"]) ids.push(await s.t.maParameter(k));
  ids.forEach((id, i) => { if (id && i >= pocet) j.over(!(("surchargeParameterValueId[" + id + "]") in post.pole), (i + 1) + ". box nie je v počte " + pocet + ", ale v POST je kľúč [" + id + "]=" + post.pole["surchargeParameterValueId[" + id + "]"]); });
  return { info: `${pocet} × ${velkosti.join("+")}: cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}, kľúče ${klucePost(s, post.pole, ids.filter(Boolean))}`, post: post.body, spolu: cena.spolu };
}

export const SCENARE = {
  /** 2 boxy S + L -> POST [94]=S [97]=L, cena 197 + 0 + 232 = 429 (plan §4). */
  "box-pocet-2": { typy: ["boxy"], fn: (s, a, pom, ovl, j) => pocetBoxov(s, a, ovl, j, 2, ["S", "L"]) },

  /** 3 boxy S + S + XL -> POST [94]=S [97]=S [100]=XL, cena 197 + 0 + 197 + 246 = 640 (plan §4; XL 249 -> 246 od 24. 10. 2026). */
  "box-pocet-3": { typy: ["boxy"], fn: (s, a, pom, ovl, j) => pocetBoxov(s, a, ovl, j, 3, ["S", "S", "XL"]) },

  /**
   * 3 boxy -> 1 box: 2. a 3. box sa vyprázdnia (v POST chýbajú alebo sú prázdne), cena = 1 box S = 197 (plan §4).
   * Starý web pri „1 ks“ vynuluje aj veľkosť 1. boxu (resetBoxSizeOptions(1, true)) — vtedy ju scenár vyberie znova
   * a zapíše to do info. Nový vzhľad musí 1. box nechať (ctx.zapis("pocetKs") ho vráti) a skryť skupiny 2. a 3. boxu.
   */
  "box-3-na-1": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy });
      const z = await j.zaklad(s, ovl, { pocet: 3, velkosti: ["S", "S", "XL"] });
      j.over(z.box1 && z.box2 && z.box3, "3 boxy: veľkosti sa nezapísali " + JSON.stringify(z));
      const n = await ovl.boxy.vyberPocet(s.t, 1);
      j.over(n === 1, "počet boxov po prepnutí " + n + " ≠ 1");
      let h = await ovl.boxy.hodnoty(s.t);
      const vynulovany1 = !h.box1;
      const novy = ovl.zdroj.boxy === "novy";
      if (novy) {
        j.over(!vynulovany1 && h.box1 === z.box1, "nový vzhľad: po prepnutí 3 -> 1 má 1. box ostať " + z.box1 + ", je „" + h.box1 + "“");
        const st = await ovl.boxy.stav(s.t);
        j.over(JSON.stringify(st.skupiny) === "[1]", "po prepnutí na 1 box majú byť viditeľné len veľkosti 1. boxu: " + JSON.stringify(st.skupiny));
        j.over(JSON.stringify(st.zvolene) === JSON.stringify(["1:" + z.box1]), "zvolené karty po prepnutí: " + JSON.stringify(st.zvolene));
      } else if (vynulovany1) h = await ovl.boxy.vyberVelkosti(s.t, ["S"]);
      j.over(h.box1 && !h.box2 && !h.box3, "po prepnutí na 1 box ostali veľkosti 2./3. boxu: " + JSON.stringify(h));
      await ovl.cena.pridajDoKosika(s.t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba: z.farba, box1: h.box1 });
      const c = await j.overCenu(s, ovl, cena);
      for (const k of ["box2", "box3"]) {
        const id = await s.t.maParameter(k);
        const v = id && post.pole["surchargeParameterValueId[" + id + "]"];
        j.over(!v, k + " po prepnutí na 1 box ostal v POST: [" + id + "]=" + v);
      }
      return {
        info: `3 × S+S+XL -> 1 ks${vynulovany1 ? " (1. box sa vynuloval, vybraný znova)" : " (1. box ostal)"}: cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`,
        post: post.body, spolu: cena.spolu,
      };
    },
  },

  /**
   * Nový vzhľad, štart: JEDNA karta „Vaše boxy do kufra“ (Michal 23. 10. 2026) — viditeľná je len ona a je otvorená, živé
   * kroky Počet a Veľkosť sú skryté (nosiče POST), postup „Hotovo N z M“ ani „Krok 1 z 1“ nevidno; sekcie zhora nadol:
   * nadpis farby, vzorky, segment počtu, veľkosti 1. boxu. 1 box (živé „1 ks“, nie predvolené „2 ks“), len skupina
   * veľkostí 1. boxu, „od“ ceny segmentu a ceny kariet veľkostí zo živých príplatkov; banner setu NIE pod cenou (Michal
   * 17. 10. 2026: „toto má byť v medzikroku, nie ďalší iný banner“ — len v karte ponuky, scenare-komplet.mjs); žiadny POST.
   */
  "box-start": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.boxy !== "novy") return { preskoc: "len nový vzhľad (živý web začína „2 ks“)" };
      const t = s.t;
      await j.otvor(s, a.url, { novy: true });
      const n = await ovl.boxy.pocet(t);
      j.over(n === 1, "nový vzhľad má začať 1 boxom (živé „1 ks“), je " + n);
      const st = await ovl.boxy.stav(t);
      j.over(st.kariet === 1 && st.otvorena, `na začiatku má byť viditeľná len jedna karta „Vaše boxy do kufra“ a otvorená: ${JSON.stringify({ kariet: st.kariet, otvorena: st.otvorena })}`);
      j.over(!st.postupVidno, "postup „Hotovo N z M“ má byť pri jednej karte skrytý");
      j.over(JSON.stringify(st.skupiny) === "[1]", "na začiatku len veľkosti 1. boxu: " + JSON.stringify(st.skupiny));
      j.over(st.zvolene.length === 0, "na začiatku nesmie byť zvolená žiadna veľkosť: " + JSON.stringify(st.zvolene));
      const otvoreny = await t.ev(`(function () { var a = document.querySelector("${F} .content-wrap > .lcd1v-krok.active"); return a ? a.className : ""; })()`);
      j.over(/lcd1v-k-farba/.test(otvoreny), "otvorená má byť karta boxov (živý krok Farba), je: " + otvoreny);
      // živé kroky Počet a Veľkosť: v DOM ostávajú (POST), na obrazovke nie sú; „Krok 1 z 1“ nevidno
      const zive = await t.ev(`(function () {
        var cw = document.querySelector("${F} .content-wrap");
        var w = Array.prototype.filter.call(cw.children, function (e) { return e.querySelector(".amount-wrap") || e.querySelector(".parameter-sizes"); });
        var ey = document.querySelector("${F} .lcd1v-k-farba > .lcd1v-hd .lcd1v-ey");
        return { pocet: w.length, vidno: w.filter(function (e) { return e.getClientRects().length > 0; }).length, krok: !!(ey && ey.getClientRects().length && ey.getBoundingClientRect().width > 0) };
      })()`);
      j.over(zive.pocet === 2 && zive.vidno === 0, `živé kroky Počet a Veľkosť majú byť v DOM a skryté: ${JSON.stringify(zive)}`);
      j.over(!zive.krok, "„Krok 1 z 1“ v hlavičke karty má byť skrytý");
      // poradie sekcií v karte zhora nadol: nadpis farby < vzorky < segment počtu < veľkosti 1. boxu
      const y = await t.ev(`(function () {
        var k = document.querySelector("${F} .lcd1v-k-farba");
        function top(q) { var e = k.querySelector(q); return e && e.getClientRects().length ? Math.round(e.getBoundingClientRect().top) : null; }
        return [top(":scope > .lcd1v-bxp-nadp--farba"), top(":scope > .options-wrap"), top(".lcd1v-bxp-ksz"), top('.lcd1v-bxp-vgrp[data-box="1"]')];
      })()`);
      j.over(y.every((x) => x != null) && y[0] < y[1] && y[1] < y[2] && y[2] < y[3], "poradie sekcií v karte (nadpis farby, vzorky, počet, veľkosti 1. boxu): " + JSON.stringify(y));
      // „od“ v segmente počtu = 1. box variant + najlacnejší príplatok, ďalší box + najlacnejší príplatok (živé selecty)
      const od = await t.ev(`(function () {
        var c = window.__lcd1v, z = c.cena().zaklad;
        function min(k) { var m = c.moznosti(k); return m.length ? Math.min.apply(null, m.map(function (o) { return o.cena; })) : 0; }
        var a = z + min("box1"), b = a + min("box2"), d = b + min("box3");
        return [a, b, d];
      })()`);
      const odVidno = st.od.map((x) => Number(String(x).replace(/[^\d]/g, "")));
      j.over(JSON.stringify(odVidno) === JSON.stringify(od), "„od“ ceny segmentu počtu " + JSON.stringify(st.od) + " ≠ živé príplatky " + JSON.stringify(od));
      // ceny kariet veľkostí: 1. box = variant + príplatok, 2. a 3. box = príplatok (zo selectov)
      const ceny1 = st.ceny[0].split(" ").map((x) => Number(x.replace(/[^\d]/g, "")));
      const ocak1 = await t.ev(`(function () { var c = window.__lcd1v, z = c.cena().zaklad; return c.moznosti("box1").map(function (o) { return z + o.cena; }); })()`);
      j.over(JSON.stringify(ceny1) === JSON.stringify(ocak1), "ceny kariet 1. boxu " + st.ceny[0] + " ≠ " + JSON.stringify(ocak1));
      // banner setu len v karte ponuky (komplet-ponuka.js), pod cenou ani inde nie; starý pás setu tiež nie
      await j.pauza(1500); // ceny cieľa (GET 598) by banner postavili do 1,5 s
      const mimo = await t.ev(`Array.prototype.filter.call(document.querySelectorAll(".lcd1v-bs"), function (b) { return !b.closest(".lcd1v-komplet"); }).length`);
      j.over(mimo === 0 && st.setStary === 0, "banner setu mimo karty ponuky (" + mimo + "×) / starý pás (" + st.setStary + "×)");
      await snimkaKarty(s, a, "start");
      await j.pauza(800);
      j.over(s.posty.length === 0, "na štarte odišiel POST: " + (s.posty[0] && s.posty[0].body));
      return { info: `jedna karta otvorená, živé Počet/Veľkosť skryté, postup skrytý; 1 ks, „od“ ${st.od.join(" / ")}, 1. box ${st.ceny[0]}, bez banneru pod cenou` };
    },
  },

  /**
   * Nový vzhľad: 2 boxy, zvolená len veľkosť 1. boxu -> „Pridať do košíka“ = červený rám na karte boxov, časť „velkost“,
   * veta len v skupine 2. boxu, karta otvorená, POST 0 (živá validácia by pustila 1 box); po doplnení 2. boxu rám
   * zmizne, zhrnutie „… · 2 boxy · S + L“ a platný POST [94] + [97], cena = súčet.
   */
  "box-2-neuplne": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.boxy !== "novy") return { preskoc: "len nový vzhľad (živý web pustí 2 ks s jednou veľkosťou)" };
      const t = s.t;
      await j.otvor(s, a.url, { novy: true });
      const farba = await ovl.boxy.vyberFarbu(t, { index: 2 });
      j.over((await ovl.boxy.vyberPocet(t, 2)) === 2, "počet 2 sa nezapísal");
      const h = await ovl.boxy.vyberVelkosti(t, ["S"]);
      j.over(h.box1 && !h.box2, "po výbere len 1. boxu: " + JSON.stringify(h));
      await j.pauza(400);
      await ovl.cena.pridajDoKosika(t); // ovládač overí text „Dokončite výber“ (ctx.prvyNevyplneny)
      const c1 = await ovl.kroky.cervenyKrok(t);
      await j.pauza(1200);
      j.over(s.posty.length === 0, "2 boxy bez veľkosti 2. boxu odišli do košíka: " + (s.posty[0] && s.posty[0].body));
      j.over(c1 === "velkost", "červený rám karty má hlásiť chýbajúcu veľkosť (data-lcd1v-chyba-cast), hlási: " + c1);
      const r = await t.ev(`(function () {
        var k = document.querySelector("${F} .lcd1v-k-farba");
        function vid(e) { return !!(e && e.getClientRects().length && e.getBoundingClientRect().height > 0); }
        return { cervena: k.classList.contains("lcd1v-chyba"), otvorena: k.classList.contains("active"),
          skupiny: Array.prototype.filter.call(k.querySelectorAll(".lcd1v-bxp-vgrp[data-lcd1v-chyba]"), function (g) { return true; }).map(function (g) { return g.getAttribute("data-box"); }),
          vety: Array.prototype.filter.call(k.querySelectorAll(".lcd1v-bxp-chyba"), vid).map(function (e) { return e.textContent.trim(); }) };
      })()`);
      j.over(r.cervena && r.otvorena, "karta boxov má byť otvorená s červeným rámom: " + JSON.stringify(r));
      j.over(JSON.stringify(r.skupiny) === '["2"]' && r.vety.length === 1 && /2\. boxu/.test(r.vety[0]), "veta o chýbajúcej veľkosti len pri 2. boxe: " + JSON.stringify(r));
      const st = await ovl.boxy.stav(t);
      j.over(/\s·\s2 boxy$/.test(st.vyber || ""), "zhrnutie karty pri neúplnom výbere: " + st.vyber);
      await snimkaKarty(s, a, "2boxy-neuplne");
      // doplnenie 2. boxu: L
      const sel = `${F} .lcd1v-krok.lcd1v-k-farba .lcd1v-bxp-vgrp[data-box="2"]`;
      const valL = await t.moznost("box2", VELKOST("L"));
      await t.klikni(`${sel} .lcd1v-bxp-vk[data-hodnota="${valL}"]`, { popis: "2. box L" });
      const id2 = await t.idParametra("box2");
      await t.cakaj(`(document.querySelector('${F} select[data-parameter-id="${id2}"]') || {}).value === "${valL}"`, { ms: 3000, popis: "2. box vo formulári" });
      await j.pauza(400);
      const po = await t.ev(`(function () { var k = document.querySelector("${F} .lcd1v-k-farba"); return { cervena: k.classList.contains("lcd1v-chyba"), cast: k.getAttribute("data-lcd1v-chyba-cast"), skupiny: k.querySelectorAll(".lcd1v-bxp-vgrp[data-lcd1v-chyba]").length }; })()`);
      j.over(!po.cervena && !po.cast && !po.skupiny, "červený rám a veta majú po doplnení zmiznúť: " + JSON.stringify(po));
      const st2 = await ovl.boxy.stav(t);
      j.over(/\s·\s2 boxy\s·\sS\s\+\sL$/.test(st2.vyber || ""), "zhrnutie karty po doplnení: " + st2.vyber);
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba, box1: h.box1, box2: valL });
      const c = await j.overCenu(s, ovl, cena);
      const ocak = a.produkt.ceny && a.produkt.ceny["box-pocet-2"];
      if (ocak != null) j.over(cena.spolu === ocak, "S + L = " + cena.spolu + " ≠ plan §4 " + ocak);
      return { info: `2 boxy, len 1. veľkosť -> červený rám karty, veta pri 2. boxe, POST 0; + 2. box L -> „${st2.vyber}“, cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
    },
  },

  /**
   * Nový vzhľad, jedna karta (Michal 23. 10. 2026: „všetko na jednom mieste“, nič sa neotvára): farba -> 3 boxy +
   * veľkosti S, S, XL -> 2 boxy -> 1 box. Pri každom ťuknutí ostane ťuknutý prvok na mieste (< 2 px), karta otvorená,
   * žiadne okno (.upsale-Banner.showConf, [role=dialog], body.lcd1v-bx-otvorene); po 3 -> 1 ostane 1. box zvolený a vidno
   * len jeho skupinu; na telefóne „Spolu“ v karte = suma súhrnu po každom kliku; nové prvky bez [name]. „Pokračujte
   * k súhrnu“ pri neúplnom výbere (2 boxy, 2. bez veľkosti): POST 0, karta otvorená, časť „velkost“, nič sa neposunie
   * na súhrn. Poistka: živé otvorenie skrytého kroku Veľkosť sa do 500 ms vráti na kartu. POST 0.
   */
  "box-jedna-karta": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.boxy !== "novy") return { preskoc: "len nový vzhľad" };
      const t = s.t;
      const K = `${F} .lcd1v-krok.lcd1v-k-farba`;
      await j.otvor(s, a.url, { novy: true });
      const telefon = t.sirka < 992;
      const kontrola = async (popis) => {
        const r = await t.ev(`(function () {
          var f = document.getElementById("product-detail-form"), k = f.querySelector(".lcd1v-k-farba");
          function vid(e) { return !!(e && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden"); }
          var sp = k.querySelector(":scope > .lcd1v-bxp-spolu"), su = document.querySelector(".lcd1v-suhrn .lcd1v-suhrn__suma");
          var nove = Array.prototype.filter.call(k.querySelectorAll("[class*='lcd1v-bxp']"), function (e) { return e.hasAttribute("name") || e.querySelector("[name]"); }).length;
          return { aktivna: k.classList.contains("active"), okno: !!f.querySelector(".upsale-Banner.showConf"), dialog: Array.prototype.filter.call(document.querySelectorAll("[role=dialog]"), vid).length,
            bx: document.body.classList.contains("lcd1v-bx-otvorene"), spolu: vid(sp) ? (sp.querySelector(".lcd1v-bxp-spolu-suma") || {}).textContent : null, suhrn: su ? su.textContent : null, nove: nove };
        })()`);
        j.over(r.aktivna, popis + ": karta boxov sa zatvorila");
        j.over(!r.okno && !r.dialog && !r.bx, popis + ": otvorilo sa okno " + JSON.stringify(r));
        j.over(r.nove === 0, popis + ": nové prvky karty majú atribút name (" + r.nove + "×)");
        if (telefon) j.over(r.spolu != null && r.spolu === r.suhrn, popis + `: „Spolu“ v karte „${r.spolu}“ ≠ súhrn „${r.suhrn}“`);
        else j.over(r.spolu == null, popis + ": „Spolu“ v karte má byť len na telefóne");
        return r;
      };
      // ťuk: prvok po kliku na tom istom mieste (žiadne skákanie karty), karta otvorená
      const tuk = async (sel, popis, opt = {}) => {
        const r = await t.klikni(sel, { popis, ...opt });
        await j.pauza(500);
        const y = await t.ev(`(function () { var e = Array.prototype.filter.call(document.querySelectorAll(${JSON.stringify(sel)}), function (x) { return x.getClientRects().length; })[${opt.index || 0}]; if (!e) return null; var b = e.getBoundingClientRect(); return b.top + b.height / 2; })()`);
        j.over(y != null && Math.abs(y - r.y) < 2, `${popis}: ťuknutý prvok sa posunul o ${y == null ? "?" : Math.round(y - r.y)} px`);
        return kontrola(popis);
      };
      await tuk(`${K} > .options-wrap > .option-button`, "farba", { index: 2 });
      await tuk(`${K} .lcd1v-bxp-ks[data-ks="3"]`, "3 boxy");
      j.over((await ovl.boxy.pocet(t)) === 3, "počet 3 sa nezapísal");
      const vals = [];
      for (const [i, v] of [[1, "S"], [2, "S"], [3, "XL"]]) {
        const val = await t.moznost("box" + i, VELKOST(v));
        vals.push(val);
        await tuk(`${K} .lcd1v-bxp-vgrp[data-box="${i}"] .lcd1v-bxp-vk[data-hodnota="${val}"]`, `${i}. box ${v}`);
      }
      const st3 = await ovl.boxy.stav(t);
      j.over(JSON.stringify(st3.skupiny) === "[1,2,3]" && st3.zvolene.length === 3 && /\s·\s3 boxy\s·\sS\s\+\sS\s\+\sXL$/.test(st3.vyber || ""), "3 boxy S + S + XL: " + JSON.stringify({ skupiny: st3.skupiny, zvolene: st3.zvolene, vyber: st3.vyber }));
      await snimkaKarty(s, a, "3boxy-uplne");
      await tuk(`${K} .lcd1v-bxp-ks[data-ks="2"]`, "2 boxy");
      await tuk(`${K} .lcd1v-bxp-ks[data-ks="1"]`, "1 box");
      const st1 = await ovl.boxy.stav(t);
      j.over(JSON.stringify(st1.skupiny) === "[1]" && JSON.stringify(st1.zvolene) === JSON.stringify(["1:" + vals[0]]), "po 3 -> 1 má ostať 1. box zvolený a len jeho skupina: " + JSON.stringify({ skupiny: st1.skupiny, zvolene: st1.zvolene }));
      // „Pokračujte k súhrnu“ pri neúplnom výbere: 2 boxy, 2. bez veľkosti
      await tuk(`${K} .lcd1v-bxp-ks[data-ks="2"]`, "2 boxy (2. bez veľkosti)");
      const pred = await t.ev(`window.scrollY`);
      const text = await t.ev(`(document.querySelector(${JSON.stringify(K + " > .next-step-button")}) || { getAttribute: function () { return null; } }).getAttribute("data-lcd1v-text")`);
      j.over(text === "Pokračujte k súhrnu", "tlačidlo karty: " + text);
      await t.klikni(`${K} > .next-step-button`, { popis: "Pokračujte k súhrnu (neúplný výber)" });
      await j.pauza(1200);
      const nu = await t.ev(`(function () {
        var k = document.querySelector(${JSON.stringify(K)}), sh = document.querySelector(".lcd1v-suhrn"), r = sh && sh.getBoundingClientRect();
        var g = k.querySelector('.lcd1v-bxp-vgrp[data-box="2"]'), gr = g && g.getBoundingClientRect();
        return { aktivna: k.classList.contains("active"), cast: k.getAttribute("data-lcd1v-chyba-cast"), skupina: g ? g.getAttribute("data-lcd1v-chyba") : null,
          komplet: !!document.querySelector("#product-detail-form .lcd1v-komplet.active"), suhrnVidno: !!(r && r.top >= 0 && r.bottom <= innerHeight && !(gr && gr.bottom > 0 && gr.top < innerHeight)) };
      })()`);
      j.over(nu.aktivna && nu.cast === "velkost" && nu.skupina === "1" && !nu.komplet, "„Pokračujte k súhrnu“ pri neúplnom výbere: " + JSON.stringify(nu));
      j.over(!nu.suhrnVidno, "pri neúplnom výbere sa stránka posunula na súhrn: " + JSON.stringify({ pred, nu }));
      // poistka: živé otvorenie skrytého kroku Veľkosť -> späť na kartu
      await t.ev(`(function () { var k = window.__lcd1v && window.__lcd1v.krok("velkost"); if (k && typeof window.__lcdSetStepOpen === "function") window.__lcdSetStepOpen(k, true); })()`);
      await j.pauza(500);
      const po = await t.ev(`(function () { var c = window.__lcd1v; return { velkost: c.krok("velkost").classList.contains("active"), pocet: c.krok("pocet").classList.contains("active"), karta: c.krok("farba").classList.contains("active") }; })()`);
      j.over(!po.velkost && !po.pocet && po.karta, "poistka: otvorený skrytý krok Veľkosť sa má zavrieť a karta otvoriť: " + JSON.stringify(po));
      await j.pauza(500);
      j.over(s.posty.length === 0, "pri výbere v karte odišiel POST: " + (s.posty[0] && s.posty[0].body));
      return { info: `farba -> 3 boxy S+S+XL -> 2 -> 1: karta stále otvorená, nič neskáče, žiadne okno${telefon ? ", „Spolu“ v karte = súhrn" : ""}; neúplné „Pokračujte k súhrnu“ -> veľkosť 2. boxu, POST 0; poistka OK` };
    },
  },

  /**
   * Nový vzhľad: každá farba boxu má vlastnú fotku materiálu (assets/img/1v/boxprodukt-farba-*.jpg, nie len živú vzorku),
   * kresbu boxu v kroku Veľkosť vo svojej farbe (box-kresba.js FARBY_KRESBY: kľúč = názov farby bez diakritiky, nie
   * predvolená) a „Vybraná farba“ slovami. Svetlý box je Béžová (Michal 22. 10. 2026: „Tam, kde je box so šedou farbou,
   * daj preč, to je chyba. Má to byť v béžovej farbe.“): fotka boxprodukt-farba-bezova.jpg, koža kresby #d4cbbb.
   * Kým admin 616 hovorí „Diamond Farba kože : Šedá“ (558), test to len vypíše (po prestavení na Béžovú 561 spustiť znova).
   *
   * Michal 25. 10. 2026: „Pri produkte boxy chcem, aby sa náhľad tej vzorky taktiež zobrazoval normálne, tak ako sa
   * zobrazuje aj pri koberčekoch pod sedadlá, do kufra a podobne. A následne potom ešte, aby sa zafarbovali všetky tie
   * varianty tých boxov tak ako doteraz.“ -> pri každej farbe navyše:
   *   - náhľad materiálu ako na autokobercoch (_lcd1v-kroky.scss .lcd1v-krok > .lcd1v-nahlad): fotka štvorec ≤ 320 px
   *     v strede karty, štítok „Diamond Line“ v pruhu NAD fotkou (nie cez ňu), tieň a zaoblenie, fotka načítaná;
   *   - kresba boxu v KAŽDEJ karte veľkosti všetkých viditeľných riadkov (1, 2 aj 3 boxy): vypočítaná farba kože (fill),
   *     lemu (stroke), rúčky a šitia = FARBY_KRESBY[kľúč farby], aj šitie prešívania vo vzore <pattern>.
   * Kolá: 1 box (štart) -> 2 boxy (S + L) -> 3 boxy, v každom všetkých 9 farieb. --snimky: karta pri 2 boxoch pre
   * Hnedá káva, Čierna / červené šitie a Béžová (616-karta-farba-2boxy-<kľúč>-<šírka>.png). Do košíka nič.
   */
  "box-farby": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.boxy !== "novy") return { preskoc: "len nový vzhľad" };
      const t = s.t;
      const { FARBY_KRESBY } = await import("../../assets/js/components/konfigurator1v/box-kresba.js");
      const rgb = (h) => { const x = String(h || "").replace("#", ""); return "rgb(" + [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)).join(", ") + ")"; };
      await j.otvor(s, a.url, { novy: true });
      const n = await t.ev(`document.querySelectorAll("#product-detail-form .lcd1v-k-farba > .options-wrap > .option-button").length`);
      j.over(n >= 9, "farieb boxu je " + n + " (čakám 9)");
      const kluc = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const SNIMKY = /^(hneda-kava|cierna-cervene-sitie|bezova|seda)$/;
      const farby = [];
      const kola = [];
      for (const pocet of [1, 2, 3]) {
        if (pocet > 1) {
          j.over((await ovl.boxy.vyberPocet(t, pocet)) === pocet, "počet " + pocet + " sa nezapísal");
          if (pocet === 2) await ovl.boxy.vyberVelkosti(t, ["S", "L"]);
        }
        let kariet = 0;
        for (let i = 0; i < n; i++) {
          await ovl.boxy.vyberFarbu(t, { index: i });
          await t.cakaj(`(function () { var i = document.querySelector("#product-detail-form .lcd1v-krok.lcd1v-k-farba > .lcd1v-bxp-nahlad img"); return !!(i && i.complete && i.naturalWidth > 0); })()`, { ms: 10000, popis: "fotka náhľadu načítaná" }).catch(() => {});
          await j.pauza(150);
          const r = await t.ev(`(function () {
            var f = document.getElementById("product-detail-form"), k = f.querySelector(".lcd1v-krok.lcd1v-k-farba");
            var b = k.querySelector(":scope > .options-wrap > .option-button.active"), n = k.querySelector(":scope > .lcd1v-bxp-nahlad"), im = n && n.querySelector("img");
            var v = f.querySelector(".lcd1v-bxp-velk"), p = k.querySelector(":scope > .lcd1v-bxp-farba-popis");
            // náhľad: rozmer a poloha fotky a štítka voči obsahu karty (bez paddingu)
            var nh = null;
            if (n && !n.hidden && im) {
              var kr = k.getBoundingClientRect(), cs = getComputedStyle(k), nr = n.getBoundingClientRect(), ir = im.getBoundingClientRect();
              var nm = n.querySelector(".lcd1v-nahlad-nm"), mr = nm && nm.getBoundingClientRect(), ns = getComputedStyle(n);
              var l = kr.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft), rr = kr.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
              nh = { w: Math.round(nr.width), iw: Math.round(ir.width), ih: Math.round(ir.height), stred: Math.round((nr.left + nr.width / 2) - (l + rr) / 2),
                stitokNad: !!(mr && mr.height > 0 && mr.bottom <= ir.top + 1), stitok: nm ? nm.textContent.trim() : "", nacitana: !!(im.complete && im.naturalWidth > 0),
                radius: ns.borderTopLeftRadius, tien: ns.boxShadow };
            }
            // kresby: každá karta veľkosti vo viditeľných riadkoch (vypočítané farby, nie premenné)
            var karty = [];
            Array.prototype.forEach.call(v ? v.querySelectorAll(".lcd1v-bxp-vgrp") : [], function (g) {
              if (g.hidden || !g.getClientRects().length) return;
              Array.prototype.forEach.call(g.querySelectorAll(".lcd1v-bxp-vk"), function (c) {
                var sv = c.querySelector("svg.lcd1v-bxp-sil");
                function vf(q, pr) { var e = sv && sv.querySelector(q); return e ? getComputedStyle(e)[pr] : null; }
                karty.push({ box: g.getAttribute("data-box"), v: (c.querySelector(".lcd1v-bxp-vk-l") || {}).textContent || "", vid: !!(sv && sv.getBoundingClientRect().width > 20),
                  koza: vf(".lcd1v-bxp-k-l", "fill"), lem: vf(".lcd1v-bxp-k-e", "stroke"), rucka: vf(".lcd1v-bxp-k-s", "fill"), sitie: vf(".lcd1v-bxp-k-t", "stroke") });
              });
            });
            var qs = v && v.querySelector(".lcd1v-bxp-defs .lcd1v-bxp-k-qs");
            return { nazov: b ? b.getAttribute("data-lcd1v-nazov") || "" : "", src: im ? im.getAttribute("src") || "" : "",
              kresba: v ? v.getAttribute("data-lcd1v-farba") || "" : "", koza: v ? v.style.getPropertyValue("--bxp-lth").trim() : "",
              popis: p && !p.hidden ? p.textContent.replace(/\\s+/g, " ").trim() : "", nh: nh, karty: karty, vzorSitie: qs ? getComputedStyle(qs).stroke : null,
              skupiny: v ? Array.prototype.filter.call(v.querySelectorAll(".lcd1v-bxp-vgrp"), function (g) { return !g.hidden; }).length : 0 };
          })()`);
          if (pocet === 1) farby.push(r);
          const kl = kluc(r.nazov), m = `${pocet} ${pocet > 1 ? "boxy" : "box"}, farba „${r.nazov}“`;
          const subor = r.src.split("/").pop();
          j.over(/\/img\/1v\/boxprodukt-farba-[a-z-]+\.jpg$/.test(r.src), `${m}: náhľad nie je fotka materiálu boxprodukt-farba-*.jpg, ale ${r.src}`);
          j.over(r.kresba === kl, `${m}: kresba boxu má farbu „${r.kresba}“ (čakám „${kl}“ — farba chýba v FARBY_KRESBY)`);
          j.over(!!r.popis, `${m}: chýba „Vybraná farba“ slovami`);
          if (/^(bezova|seda)$/.test(kl))
            j.over(subor === "boxprodukt-farba-bezova.jpg" && r.koza.toLowerCase() === "#d4cbbb", `svetlý box „${r.nazov}“: fotka ${subor}, koža kresby ${r.koza} (čakám boxprodukt-farba-bezova.jpg, #d4cbbb)`);
          // náhľad ako na autokobercoch: štvorec ≤ 320 px v strede, štítok nad fotkou, tieň a zaoblenie, fotka načítaná
          const nh = r.nh;
          j.over(nh, `${m}: náhľad materiálu nevidno`);
          j.over(nh.iw <= 320 && nh.iw >= 200 && Math.abs(nh.iw - nh.ih) <= 1, `${m}: fotka náhľadu ${nh.iw} × ${nh.ih} px (čakám štvorec 200–320 px ako na autokobercoch)`);
          j.over(nh.w <= 320 && Math.abs(nh.stred) <= 1, `${m}: náhľad široký ${nh.w} px, od stredu karty ${nh.stred} px (čakám ≤ 320 px v strede)`);
          j.over(nh.stitokNad && nh.stitok, `${m}: štítok „${nh.stitok}“ nie je v pruhu nad fotkou`);
          j.over(nh.nacitana, `${m}: fotka náhľadu ${subor} sa nenačítala`);
          j.over(nh.tien !== "none" && parseFloat(nh.radius) >= 10, `${m}: náhľad bez tieňa / zaoblenia (${nh.tien}, ${nh.radius})`);
          // kresby: všetky karty všetkých viditeľných riadkov vo farbe zvolenej farby (nie predvolenej)
          const c = FARBY_KRESBY[kl];
          j.over(c, `${m}: farba „${kl}“ nie je v FARBY_KRESBY`);
          j.over(r.skupiny === pocet && r.karty.length >= 4 * pocet && r.karty.every((x) => x.vid), `${m}: viditeľných riadkov ${r.skupiny}, kariet s kresbou ${r.karty.length} (čakám ${pocet} riadky po 4)`);
          const zle = r.karty.filter((x) => x.koza !== rgb(c.koza) || x.lem !== rgb(c.lem) || x.rucka !== rgb(c.rucka) || x.sitie !== rgb(c.sitie));
          j.over(!zle.length, `${m}: kresby v inej farbe než ${JSON.stringify(c)}: ` + JSON.stringify(zle.slice(0, 3)));
          j.over(r.vzorSitie === rgb(c.sitie), `${m}: šitie prešívania (vzor) ${r.vzorSitie} ≠ ${rgb(c.sitie)}`);
          kariet += r.karty.length;
          if (pocet === 2 && SNIMKY.test(kl)) await snimkaKarty(s, a, "farba-2boxy-" + kl);
        }
        kola.push(`${pocet} × ${kariet} kresieb`);
      }
      await j.pauza(400);
      j.over(s.posty.length === 0, "pri výbere farieb odišiel POST: " + (s.posty[0] && s.posty[0].body));
      const svetla = farby.find((r) => /^(bezova|seda)$/.test(kluc(r.nazov)));
      j.over(svetla, "616 nemá svetlý box (Béžová): " + farby.map((r) => r.nazov).join(", "));
      const admin = svetla && svetla.nazov === "Šedá" ? " — POZOR: admin 616 ešte „Šedá“ (558), po prestavení na „Béžová“ (561) spustiť znova" : "";
      const nh = farby[0] && farby[0].nh;
      return { info: `${n} farieb: každá s fotkou materiálu (náhľad ${nh ? nh.iw + " × " + nh.ih : "?"} px v strede, štítok nad fotkou) a kresbami vo svojej farbe (${kola.join(", ")}); svetlý box „${svetla && svetla.nazov}“ = béžová fotka a kresba${admin}` };
    },
  },
};
