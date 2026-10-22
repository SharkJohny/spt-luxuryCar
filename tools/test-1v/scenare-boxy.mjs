// Scenáre navyše pre box do kufra 616 (typ „boxy“). VLASTNÍK: worker boxy (W4 / T3.2). Tvar: scenare-jedno.mjs.
// Spoločné scenáre v jadre: brana, nulova-zmena, neuplne (farba -> veľkosť, POST 0), platne (1 × M), dokoncit
// (starý web: tlačidlo posledného kroku = živý POST, zachytený a zrušený), k-suhrnu (nový vzhľad).
//
// Živý POST boxu (14. 10. 2026): productId, priceId, language, amount, parameterValueId[78], surchargeParameterValueId[94]
// (+ [97] pri 2–3 ks, + [100] pri 3 ks). Box, ktorý nie je v počte, v POST CHÝBA (živý .val(0) -> selectedIndex -1).
// Ceny: 1. box v cene produktu (S +0, M +10, L +35, XL +49), 2. a 3. box plná cena (S 197 … XL 249).
//
// Nový vzhľad (T3.2, boxy-produkt.js; ovládač ovladac-boxy-produkt.mjs `novy`): štart s 1 boxom, krok 1 farba otvorený,
// „Hotovo 0 z 3“; košík len s veľkosťou KAŽDÉHO boxu v počte (živý web pustí aj 2 ks s jednou veľkosťou).
// Scenáre len pre nový vzhľad (box-start, box-2-neuplne) sa v starom preskočia. V profile 616 (produkty.mjs, jadro)
// zatiaľ nie sú — púšťať cez --krok box-start,box-2-neuplne (alebo ich vydanie pridá do profilu).

import { join } from "node:path";

const VELKOST = (v) => new RegExp("^" + v + "\\s*:", "i");

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

  /** 3 boxy S + S + XL -> POST [94]=S [97]=S [100]=XL, cena 197 + 0 + 197 + 249 = 643 (plan §4). */
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
   * Nový vzhľad, štart: 1 box (živé „1 ks“, nie predvolené „2 ks“), otvorený krok 1 Farba, „Hotovo 0 z 3“, len
   * skupina veľkostí 1. boxu, „od“ ceny kariet počtu zo živých príplatkov; banner setu NIE pod cenou (Michal 17. 10. 2026:
   * „toto má byť v medzikroku, nie ďalší iný banner“ — banner je len v skrytej karte za Veľkosťou, scenare-komplet.mjs);
   * žiadny POST.
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
      j.over(/^Hotovo 0 z 3$/.test(st.postup), "postup na začiatku: „" + st.postup + "“ ≠ Hotovo 0 z 3");
      j.over(JSON.stringify(st.skupiny) === "[1]", "na začiatku len veľkosti 1. boxu: " + JSON.stringify(st.skupiny));
      j.over(st.zvolene.length === 0, "na začiatku nesmie byť zvolená žiadna veľkosť: " + JSON.stringify(st.zvolene));
      const otvoreny = await t.ev(`(function () { var a = document.querySelector("#product-detail-form .content-wrap > .lcd1v-krok.active"); return a ? a.className : ""; })()`);
      j.over(/lcd1v-k-farba/.test(otvoreny), "na začiatku má byť otvorený krok 1 Farba, je: " + otvoreny);
      // poradie kariet na obrazovke: farba, počet, veľkosť (DOM ostáva počet, farba, veľkosť)
      const poradie = await t.ev(`Array.prototype.map.call(document.querySelectorAll("#product-detail-form .content-wrap > .lcd1v-krok:not(.lcd1v-komplet)"), function (e) { return { m: (/lcd1v-k-(\\w+)/.exec(e.className) || [])[1], y: Math.round(e.getBoundingClientRect().top) }; }).sort(function (x, y) { return x.y - y.y; }).map(function (x) { return x.m; }).join(",")`);
      j.over(poradie === "farba,pocet,velkost", "poradie kariet na obrazovke " + poradie + " ≠ farba,pocet,velkost");
      // „od“ ceny kariet počtu = 1. box variant + najlacnejší príplatok, ďalší box + najlacnejší príplatok (živé selecty)
      const od = await t.ev(`(function () {
        var c = window.__lcd1v, z = c.cena().zaklad;
        function min(k) { var m = c.moznosti(k); return m.length ? Math.min.apply(null, m.map(function (o) { return o.cena; })) : 0; }
        var a = z + min("box1"), b = a + min("box2"), d = b + min("box3");
        return [a, b, d];
      })()`);
      const odVidno = st.od.map((x) => Number(String(x).replace(/[^\d]/g, "")));
      j.over(JSON.stringify(odVidno) === JSON.stringify(od), "„od“ ceny kariet počtu " + JSON.stringify(st.od) + " ≠ živé príplatky " + JSON.stringify(od));
      // ceny kariet veľkostí: 1. box = variant + príplatok, 2. a 3. box = príplatok (zo selectov)
      const ceny1 = st.ceny[0].split(" ").map((x) => Number(x.replace(/[^\d]/g, "")));
      const ocak1 = await t.ev(`(function () { var c = window.__lcd1v, z = c.cena().zaklad; return c.moznosti("box1").map(function (o) { return z + o.cena; }); })()`);
      j.over(JSON.stringify(ceny1) === JSON.stringify(ocak1), "ceny kariet 1. boxu " + st.ceny[0] + " ≠ " + JSON.stringify(ocak1));
      // banner setu len v skrytom medzikroku (komplet-ponuka.js), pod cenou ani inde nie; starý pás setu tiež nie
      await j.pauza(1500); // ceny cieľa (GET 598) by banner postavili do 1,5 s
      const mimo = await t.ev(`Array.prototype.filter.call(document.querySelectorAll(".lcd1v-bs"), function (b) { return !b.closest(".lcd1v-komplet"); }).length`);
      j.over(mimo === 0 && st.setStary === 0, "banner setu mimo medzikroku (" + mimo + "×) / starý pás (" + st.setStary + "×)");
      await j.pauza(800);
      j.over(s.posty.length === 0, "na štarte odišiel POST: " + (s.posty[0] && s.posty[0].body));
      return { info: `1 ks, krok Farba otvorený, ${st.postup}, „od“ ${st.od.join(" / ")}, 1. box ${st.ceny[0]}, bez banneru pod cenou` };
    },
  },

  /**
   * Nový vzhľad: 2 boxy, zvolená len veľkosť 1. boxu -> „Pridať do košíka“ = červený rám na kroku Veľkosť, POST 0
   * (živá validácia by pustila 1 box); po doplnení 2. boxu platný POST [94] + [97] a cena = súčet.
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
      j.over(c1 === "velkost", "červený rám má byť na kroku Veľkosť, je na: " + c1);
      const st = await ovl.boxy.stav(t);
      j.over(st.velkostVyber === "Vyberte veľkosť", "zhrnutie kroku Veľkosť pri neúplnom výbere: " + st.velkostVyber);
      // doplnenie 2. boxu: L
      const sel = '#product-detail-form .lcd1v-krok.lcd1v-k-velkost .lcd1v-bxp-vgrp[data-box="2"]';
      const valL = await t.moznost("box2", VELKOST("L"));
      await t.klikni(`${sel} .lcd1v-bxp-vk[data-hodnota="${valL}"]`, { popis: "2. box L" });
      const id2 = await t.idParametra("box2");
      await t.cakaj(`(document.querySelector('#product-detail-form select[data-parameter-id="${id2}"]') || {}).value === "${valL}"`, { ms: 3000, popis: "2. box vo formulári" });
      await j.pauza(400);
      const cervenyPo = await t.ev(`!!document.querySelector("#product-detail-form .lcd1v-krok.lcd1v-k-velkost.lcd1v-chyba")`);
      j.over(!cervenyPo, "červený rám na kroku Veľkosť má po doplnení zmiznúť");
      const st2 = await ovl.boxy.stav(t);
      j.over(/^S \(\d+ cm\) \+ L \(\d+ cm\)$/.test(st2.velkostVyber), "zhrnutie kroku Veľkosť: " + st2.velkostVyber);
      await ovl.cena.pridajDoKosika(t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba, box1: h.box1, box2: valL });
      const c = await j.overCenu(s, ovl, cena);
      const ocak = a.produkt.ceny && a.produkt.ceny["box-pocet-2"];
      if (ocak != null) j.over(cena.spolu === ocak, "S + L = " + cena.spolu + " ≠ plan §4 " + ocak);
      return { info: `2 boxy, len 1. veľkosť -> červený rám Veľkosť, POST 0; + 2. box L -> ${st2.velkostVyber}, cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
    },
  },

  /**
   * Nový vzhľad: každá farba boxu má vlastnú fotku materiálu (assets/img/1v/boxprodukt-farba-*.jpg, nie len živú vzorku),
   * kresbu boxu v kroku Veľkosť vo svojej farbe (box-kresba.js FARBY_KRESBY: kľúč = názov farby bez diakritiky, nie
   * predvolená) a „Vybraná farba“ slovami. Svetlý box je Béžová (Michal 22. 10. 2026: „Tam, kde je box so šedou farbou,
   * daj preč, to je chyba. Má to byť v béžovej farbe.“): fotka boxprodukt-farba-bezova.jpg, koža kresby #d4cbbb.
   * Kým admin 616 hovorí „Diamond Farba kože : Šedá“ (558), test to len vypíše (po prestavení na Béžovú 561 spustiť znova).
   * Do košíka nič.
   */
  "box-farby": {
    typy: ["boxy"],
    async fn(s, a, pom, ovl, j) {
      if (ovl.zdroj.boxy !== "novy") return { preskoc: "len nový vzhľad" };
      const t = s.t;
      await j.otvor(s, a.url, { novy: true });
      const n = await t.ev(`document.querySelectorAll("#product-detail-form .lcd1v-k-farba > .options-wrap > .option-button").length`);
      j.over(n >= 9, "farieb boxu je " + n + " (čakám 9)");
      const kluc = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const farby = [];
      for (let i = 0; i < n; i++) {
        await ovl.boxy.vyberFarbu(t, { index: i });
        await j.pauza(200);
        const r = await t.ev(`(function () {
          var f = document.getElementById("product-detail-form"), k = f.querySelector(".lcd1v-krok.lcd1v-k-farba");
          var b = k.querySelector(":scope > .options-wrap > .option-button.active"), im = k.querySelector(":scope > .lcd1v-bxp-nahlad img");
          var v = f.querySelector(".lcd1v-bxp-velk"), p = k.querySelector(":scope > .lcd1v-bxp-farba-popis");
          return { nazov: b ? b.getAttribute("data-lcd1v-nazov") || "" : "", src: im ? im.getAttribute("src") || "" : "",
            kresba: v ? v.getAttribute("data-lcd1v-farba") || "" : "", koza: v ? v.style.getPropertyValue("--bxp-lth").trim() : "",
            popis: p && !p.hidden ? p.textContent.replace(/\\s+/g, " ").trim() : "" };
        })()`);
        farby.push(r);
        const subor = r.src.split("/").pop();
        j.over(/\/img\/1v\/boxprodukt-farba-[a-z-]+\.jpg$/.test(r.src), `farba „${r.nazov}“: náhľad nie je fotka materiálu boxprodukt-farba-*.jpg, ale ${r.src}`);
        j.over(r.kresba === kluc(r.nazov), `farba „${r.nazov}“: kresba boxu má farbu „${r.kresba}“ (čakám „${kluc(r.nazov)}“ — farba chýba v FARBY_KRESBY)`);
        j.over(!!r.popis, `farba „${r.nazov}“: chýba „Vybraná farba“ slovami`);
        if (/^(bezova|seda)$/.test(kluc(r.nazov)))
          j.over(subor === "boxprodukt-farba-bezova.jpg" && r.koza.toLowerCase() === "#d4cbbb", `svetlý box „${r.nazov}“: fotka ${subor}, koža kresby ${r.koza} (čakám boxprodukt-farba-bezova.jpg, #d4cbbb)`);
        if (a.snimky && /^(bezova|seda)$/.test(kluc(r.nazov))) {
          // snímka pre ľudskú kontrolu: krok 1 so svetlým boxom (vzorka + náhľad materiálu)
          await t.ev(`(function () { var k = document.querySelector("#product-detail-form .lcd1v-krok.lcd1v-k-farba"); if (k) { k.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -80); } })()`);
          await j.pauza(700);
          await s.k.snimka(join(a.snimky, `${a.produkt.id}-box-farby-${kluc(r.nazov)}-${t.sirka}.png`)).catch(() => {});
        }
      }
      await j.pauza(400);
      j.over(s.posty.length === 0, "pri výbere farieb odišiel POST: " + (s.posty[0] && s.posty[0].body));
      const svetla = farby.find((r) => /^(bezova|seda)$/.test(kluc(r.nazov)));
      j.over(svetla, "616 nemá svetlý box (Béžová): " + farby.map((r) => r.nazov).join(", "));
      const admin = svetla && svetla.nazov === "Šedá" ? " — POZOR: admin 616 ešte „Šedá“ (558), po prestavení na „Béžová“ (561) spustiť znova" : "";
      return { info: `${n} farieb: každá s fotkou materiálu a kresbou vo svojej farbe; svetlý box „${svetla && svetla.nazov}“ = béžová fotka a kresba${admin}` };
    },
  },
};
