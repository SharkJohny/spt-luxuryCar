// Scenáre vzorkovníka 637 (typ „vzorky“). VLASTNÍK: worker vzorkovníka (T5.1). Tvar: scenare-jedno.mjs.
// Baseline starého vzhľadu zachytil T0.2 (14. 10. 2026):
//   3 vzorky (D-3, S-2, LUX-10) -> POST nesie PRÁVE tieto 3 príplatky s hodnotou „Áno +€5“, ostatných 42 prázdne,
//   „Vratná záloha spolu“ 15 € = súčet príplatkov z POST. Živá Shoptet cena („Aktuálna cena“) ukazuje o 5 € viac
//   (1 vzorka 10 €, 3 vzorky 20 €) — chyba živého webu, test ju hlási ako upozornenie (D2: ukázať, nie opravovať).
//   0 vzoriek: starý vzhľad pustí „Pridať do košíka“ (POST so všetkými prázdnymi) — nový vzhľad nesmie (plan §4).
// Nový vzhľad (T5.1, --novy / --vyvoj, ovladac-vzorky.mjs `novy`): ten istý POST (kľúče aj hodnoty = baseline), „Spolu“
//   = súčet z POST (cena živého webu sa NEukazuje), pri 0 vzorkách POST 0 aj po prejdení všetkých krokov bez vzorky.
//   Navyše (len nový vzhľad, spúšťať cez --krok): vzorky-odober (× v zozname), vzorky-nahlad (objednateľné vzorky =
//   presne živý widget, náhľad sa nedá vybrať, názvy zo živej stránky).
/** Text voľby „chcem vzorku“ (SK „Áno +€5“; ovladac-vzorky.mjs ANO) */
const ANO_TEXT = /^(áno|ano|chcem|chci)\b/i;
const jeNovy = (ovl) => ovl.zdroj.vzorky === "novy";
/** Cena a košík: nový vzhľad vzorkovníka má vlastné (ovladac-vzorky `novy`), starý = živá stránka (ovladac-cena). */
const cenaKosik = (ovl) => (jeNovy(ovl) ? ovl.vzorky : ovl.cena);

export const SCENARE = {
  /** Vybrané vzorky -> POST s presne týmito príplatkami, záloha = 5 € × počet = súčet z POST. */
  platne: {
    typy: ["vzorky"],
    async fn(s, a, pom, ovl, j) {
      const P = a.produkt, idcka = (P.platne && P.platne.vzorky) || ["D-3", "S-2", "LUX-10"];
      await j.otvor(s, a.url, { novy: a.novy });
      const v = await ovl.vzorky.vyberVzorky(s.t, idcka);
      j.over(v.pocet === idcka.length, "vybraných vzoriek " + v.pocet + " ≠ " + idcka.length);
      const zaloha = await ovl.vzorky.zaloha(s.t);
      let stav = null;
      if (jeNovy(ovl)) {
        stav = await ovl.vzorky.stav(s.t);
        j.over(stav.zoznam.length === idcka.length && idcka.every((k) => stav.zoznam.includes(k)), "zoznam vybraných " + stav.zoznam.join(",") + " ≠ " + idcka.join(","));
        j.over(stav.pocetOdznak === String(idcka.length), "odznak počtu „" + stav.pocetOdznak + "“ ≠ " + idcka.length);
        j.over(!/všetko vybran/i.test(stav.postup) && new RegExp("\\b" + idcka.length + "\\b").test(stav.postup), "postup „" + stav.postup + "“ (má písať počet vzoriek, nikdy „Všetko vybrané“)");
        j.over(stav.kos === "Vložte do košíka" && stav.lista === "Vložte do košíka", "tlačidlo „" + stav.kos + "“ / lišta „" + stav.lista + "“ ≠ Vložte do košíka");
      }
      await cenaKosik(ovl).pridajDoKosika(s.t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { ine: v.hodnoty });
      const vPost = Object.keys(post.pole).filter((k) => /^surchargeParameterValueId\[/.test(k) && post.pole[k]);
      j.over(vPost.length === idcka.length, "POST nesie " + vPost.length + " vzoriek, má " + idcka.length + ": " + vPost.map((k) => k + "=" + post.pole[k]).join(" "));
      // ANO_TEXT: hodnota v POST = voľba „Áno“ (nie „Nechcem“) — overPost porovnáva s value, text je poistka proti zámene
      for (const k of vPost) {
        const t = await s.t.ev(`(function () { var s = document.querySelector('#product-detail-form select[name="${k}"]'); var o = s && Array.prototype.find.call(s.options, function (o) { return o.value === ${JSON.stringify(post.pole[k])}; }); return o ? o.text.trim() : null; })()`);
        j.over(ANO_TEXT.test(t || ""), k + " v POST = „" + t + "“, má byť voľba „Áno“");
      }
      j.over(cena.spolu === 5 * idcka.length, "súčet príplatkov z POST " + cena.spolu + " ≠ 5 € × " + idcka.length);
      j.over(zaloha === cena.spolu, (jeNovy(ovl) ? "„Spolu“ " : "„Vratná záloha spolu“ ") + zaloha + " ≠ súčet z POST " + cena.spolu);
      const videne = await cenaKosik(ovl).zobrazenaCena(s.t);
      if (jeNovy(ovl)) j.over(videne === cena.spolu, "nový vzhľad ukazuje " + videne + ", POST " + cena.spolu + " €");
      if (jeNovy(ovl)) {
        // cena vzorky v rámiku ako hlavná cena ostatných produktov (návrh 3, Michal 15. 10. 2026), bez vety „… na mieru“;
        // suma = príplatok „Áno“ jednej vzorky (súčet z POST / počet), zápis „5 €“ s NBSP; pruh dole = vratná záloha
        const r = await j.ramCeny(s);
        j.over(r.je && r.vidno && /lcd1v-vz-cena/.test(r.trieda), "cena vzorky (.lcd1v-vz-cena) chýba alebo nie je viditeľná");
        j.over(r.ramik, "cena vzorky nie je v rámiku (návrh 3): " + r.okraj);
        j.over(!r.naMieru, "v rámiku ceny vzorky je „…" + r.naMieru + "…“");
        j.over(r.suma.vidno && r.suma.text === j.eur(cena.spolu / idcka.length), "cena vzorky v rámiku „" + r.suma.text + "“ ≠ „" + j.eur(cena.spolu / idcka.length) + "“");
        j.over(r.stitky.join("|") === "Každá vzorka" && r.pruh.vidno && /Vratná záloha/.test(r.pruh.text || ""), "rámik vzorky: štítky „" + r.stitky.join("|") + "“, pruh „" + r.pruh.text + "“");
      }
      else if (videne !== cena.spolu) s.upozornenia.push(`živá Shoptet cena pri ${idcka.length} vzorkách ukazuje ${videne} €, rekapitulácia aj POST ${cena.spolu} € (chyba živého webu)`);
      const odp = await cenaKosik(ovl).odporucana(s.t);
      j.over(!odp || (!odp.cena && !odp.stitok), "vzorkovník ukazuje odporúčanú cenu " + JSON.stringify(odp));
      // T0.2b: nový vzhľad nesmie „Odporúčanú cenu“ ukázať nikde (aj mimo karty ceny jednovrstvových), starý je už strážený vyššie
      const nova = await j.novaOdporucana(s);
      j.over(!nova.najdene.length, "nový vzhľad vzorkovníka ukazuje „Odporúčanú cenu“ (v admine nie je bežná cena): " + nova.najdene.join("; "));
      return { info: `${idcka.join(", ")}: POST ${vPost.length} príplatky „Áno“, ${jeNovy(ovl) ? "Spolu" : "záloha"} ${zaloha} € = ${cena.rozpis}; ${jeNovy(ovl) ? "nový vzhľad " : "Shoptet cena "}${videne}`, post: post.body, spolu: cena.spolu };
    },
  },

  /**
   * Bez vzorky: nový vzhľad do košíka nič (POST 0) — aj keď zákazník prejde všetky kroky „Pokračujte“ bez vzorky:
   * kroky sú preskočené (nie zelené), postup nepíše „Všetko vybrané“, tlačidlo „Vyberte vzorky“, po kliku červený
   * rám na 1. kroku. Starý vzhľad = baseline (zapíše, čo spraví).
   */
  "vzorky-0": {
    typy: ["vzorky"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy });
      if (jeNovy(ovl)) {
        const t = s.t;
        const n = await t.ev(`document.querySelectorAll("#product-detail-form .lcd1v-vz-kroky > .lcd1v-vz-krok").length`);
        j.over(n >= 1, "nový vzhľad vzorkovníka nemá kroky");
        for (let i = 0; i < n; i++) {
          await t.klikni("#product-detail-form .lcd1v-vz-krok.active > .lcd1v-vz-dalej", { popis: "Pokračujte (krok " + (i + 1) + ", bez vzorky)" });
          await j.pauza(250);
        }
        await j.pauza(800);
        j.over(s.posty.length === 0, "„Pokračujte k súhrnu“ bez vzorky poslal POST: " + (s.posty[0] && s.posty[0].body));
        const st = await ovl.vzorky.stav(t);
        j.over(st.kroky.every((k) => !k.hotovy && k.preskoceny && !k.otvoreny), "kroky bez vzorky majú byť preskočené (nie zelené): " + JSON.stringify(st.kroky));
        j.over(st.zelene === 0, "postup má " + st.zelene + " zelených dielikov bez vzorky");
        j.over(!/všetko vybran/i.test(st.postup) && /žiadn/i.test(st.postup), "postup bez vzorky píše „" + st.postup + "“");
        j.over(st.kos === "Vyberte vzorky", "tlačidlo bez vzorky píše „" + st.kos + "“, má „Vyberte vzorky“");
        await ovl.vzorky.pridajDoKosika(t);
        await j.pauza(2500);
        j.over(s.posty.length === 0, "0 vzoriek odišlo do košíka: " + (s.posty[0] && s.posty[0].body));
        const po = await ovl.vzorky.stav(t);
        j.over(po.kroky[0].otvoreny && po.kroky[0].chyba, "po kliku bez vzorky má byť 1. krok otvorený s červeným rámom: " + JSON.stringify(po.kroky[0]));
        return { info: `${n} kroky „Pokračujte“ bez vzorky = preskočené, postup „${st.postup}“, „${st.kos}“ -> POST 0, 1. krok červený` };
      }
      await ovl.cena.pridajDoKosika(s.t);
      await j.pauza(2500);
      if (s.posty.length) {
        const plne = Object.keys(s.posty[0].pole).filter((k) => /^surcharge/.test(k) && s.posty[0].pole[k]);
        j.over(plne.length === 0, "0 vzoriek, ale POST nesie " + plne.join(","));
        s.upozornenia.push("starý vzhľad pustí do košíka vzorkovník bez vzorky (POST so všetkými prázdnymi) — nový vzhľad musí POST 0");
        return { info: "starý vzhľad: 0 vzoriek -> POST so všetkými prázdnymi (zachytený a zrušený)", post: s.posty[0].body };
      }
      return { info: "starý vzhľad: 0 vzoriek -> POST 0" };
    },
  },

  /** Nový vzhľad: 3 vzorky, jednu odober tlačidlom × v zozname -> POST 2 vzorky, „Spolu“ = súčet z POST. */
  "vzorky-odober": {
    typy: ["vzorky"],
    async fn(s, a, pom, ovl, j) {
      if (!jeNovy(ovl)) return { preskoc: "len nový vzhľad (zoznam vybraných s × je len v ňom)" };
      const idcka = ["D-1", "S-6", "H-3"];
      await j.otvor(s, a.url, { novy: a.novy });
      const v = await ovl.vzorky.vyberVzorky(s.t, idcka);
      j.over(v.pocet === 3, "vybraných " + v.pocet + " ≠ 3");
      await ovl.vzorky.odoberVzorku(s.t, "S-6");
      const st = await ovl.vzorky.stav(s.t);
      j.over(st.zoznam.join(",") === "D-1,H-3", "zoznam po odobratí " + st.zoznam.join(","));
      j.over(st.kroky.find((k) => k.seria === "stripe").hotovy === false, "séria Stripe po odobratí jedinej vzorky ostala zelená");
      const ost = {};
      Object.keys(v.hodnoty).forEach((id) => { ost[id] = v.hodnoty[id]; });
      const s6 = await s.t.ev(`(function () { var s = Array.prototype.find.call(document.querySelectorAll("#product-detail-form select.surcharge-parameter"), function (s) { var n = (s.getAttribute("data-parameter-name") || "").trim(); return n === "S-6" || n.slice(-5) === "(S-6)"; }); return s ? s.getAttribute("data-parameter-id") : null; })()`);
      delete ost[s6];
      const zaloha = await ovl.vzorky.zaloha(s.t);
      await ovl.vzorky.pridajDoKosika(s.t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { ine: ost });
      j.over(cena.spolu === 10 && zaloha === cena.spolu, "po odobratí: Spolu " + zaloha + ", POST " + cena.spolu + " (má 10 = 2 × 5)");
      return { info: `D-1, S-6, H-3 -> × S-6 -> POST 2 vzorky, Spolu ${zaloha} € = ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
    },
  },

  /**
   * Nový vzhľad: objednateľné vzorky = presne živý widget (dlaždice bez „náhľadu“ v oboch), náhľad (LUX okrem LUX-10)
   * sa nedá vybrať (select ostane prázdny, POST nič), názvy pod dlaždicami doslovne zo živej stránky (S-1 = „Štandard 29“),
   * v sérii žiadne dva rovnaké názvy.
   */
  "vzorky-nahlad": {
    typy: ["vzorky"],
    async fn(s, a, pom, ovl, j) {
      if (!jeNovy(ovl)) return { preskoc: "len nový vzhľad" };
      const t = s.t;
      await j.otvor(s, a.url, { novy: a.novy });
      const r = await t.ev(`(function () {
        function zoznam(sel, atr) { return Array.prototype.map.call(document.querySelectorAll(sel), function (e) { return e.getAttribute(atr); }).sort(); }
        var tip = function (kod) {
          var s = Array.prototype.find.call(document.querySelectorAll("#product-detail-form select.surcharge-parameter"), function (s) { return (s.getAttribute("data-parameter-name") || "").trim() === kod; });
          var l = s && document.querySelector('label[for="surcharge-parameter-id-' + s.getAttribute("data-parameter-id") + '"] .show-tooltip');
          var x = l ? (l.getAttribute("title") || l.getAttribute("data-original-title") || "") : "";
          var m = /[–—-]\\s*(.+?)\\s*\\[\\s*([A-Z]+-\\d+)\\s*\\]/.exec(x.replace(/\\s+/g, " "));
          return m && m[2] === kod ? m[1].trim() : null;
        };
        var nove = Array.prototype.map.call(document.querySelectorAll("#product-detail-form .lcd1v-vz-dl"), function (b) {
          return { kod: b.getAttribute("data-kod"), nahlad: b.getAttribute("aria-disabled") === "true", nm: (b.querySelector(".lcd1v-vz-nm") || {}).textContent || "",
            seria: b.closest(".lcd1v-vz-krok").getAttribute("data-lcd1v-vz-seria") };
        });
        return {
          ziveObj: zoznam(".lcd-vz-swatch:not(.lcd-vz-swatch--preview)", "data-id"),
          ziveNahl: zoznam(".lcd-vz-swatch.lcd-vz-swatch--preview", "data-id"),
          nove: nove,
          zleNazvy: nove.filter(function (x) { var z = tip(x.kod); return z !== null && z !== x.nm; }).map(function (x) { return x.kod + " „" + x.nm + "“ ≠ „" + tip(x.kod) + "“"; }),
          s1: (nove.find(function (x) { return x.kod === "S-1"; }) || {}).nm
        };
      })()`);
      const noveObj = r.nove.filter((x) => !x.nahlad).map((x) => x.kod).sort();
      const noveNahl = r.nove.filter((x) => x.nahlad).map((x) => x.kod).sort();
      j.over(JSON.stringify(noveObj) === JSON.stringify(r.ziveObj), "objednateľné: nový vzhľad " + noveObj.join(",") + " ≠ živý widget " + r.ziveObj.join(","));
      j.over(JSON.stringify(noveNahl) === JSON.stringify(r.ziveNahl), "náhľady: nový vzhľad " + noveNahl.join(",") + " ≠ živý widget " + r.ziveNahl.join(","));
      j.over(!r.zleNazvy.length, "názvy nesedia so živou stránkou: " + r.zleNazvy.join("; "));
      j.over(r.s1 === "Štandard 29", "S-1 sa volá „" + r.s1 + "“ (živý web: Štandard 29)");
      const dup = {};
      r.nove.forEach((x) => { const k = x.seria + "|" + x.nm; dup[k] = (dup[k] || 0) + 1; });
      const dvakrat = Object.keys(dup).filter((k) => dup[k] > 1);
      j.over(!dvakrat.length, "rovnaký názov dvakrát v jednej sérii: " + dvakrat.join(", "));
      // klik na náhľad: nič sa nevyberie, ukáže sa len fotka
      const nahl = noveNahl[0];
      if (nahl) {
        await ovl.vzorky.otvorKrokVzorky(t, nahl);
        await t.klikni(`#product-detail-form .lcd1v-vz-dl[data-kod="${nahl}"]`, { popis: "náhľad " + nahl });
        await j.pauza(400);
        j.over((await ovl.vzorky.pocet(t)) === 0, "klik na náhľad " + nahl + " vybral vzorku");
        const nh = await t.ev(`(function () { var k = document.querySelector('#product-detail-form .lcd1v-vz-dl[data-kod="${nahl}"]').closest(".lcd1v-vz-krok"); var n = k.querySelector(".lcd1v-nahlad"); return n && !n.hidden ? n.textContent : null; })()`);
        j.over(nh && nh.includes(nahl), "náhľad " + nahl + " sa neukázal (" + nh + ")");
      }
      return { info: `objednateľné ${noveObj.length} = živý widget, náhľady ${noveNahl.length} = živý widget, názvy zo živej stránky (S-1 „${r.s1}“), klik na náhľad nič nevyberie` };
    },
  },
};
