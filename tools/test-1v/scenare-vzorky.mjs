// Scenáre vzorkovníka 637 (typ „vzorky“). VLASTNÍK: worker vzorkovníka (T5.1, posledná vlna). Tvar: scenare-jedno.mjs.
// Baseline starého vzhľadu zachytil T0.2 (14. 10. 2026):
//   3 vzorky (D-3, S-2, LUX-10) -> POST nesie PRÁVE tieto 3 príplatky s hodnotou „Áno +€5“, ostatných 42 prázdne,
//   „Vratná záloha spolu“ 15 € = súčet príplatkov z POST. Živá Shoptet cena („Aktuálna cena“) ukazuje o 5 € viac
//   (1 vzorka 10 €, 3 vzorky 20 €) — chyba živého webu, test ju hlási ako upozornenie (D2: ukázať, nie opravovať).
//   0 vzoriek: starý vzhľad pustí „Pridať do košíka“ (POST so všetkými prázdnymi) — nový vzhľad nesmie (plan §4).

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
      await ovl.cena.pridajDoKosika(s.t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { ine: v.hodnoty });
      const vPost = Object.keys(post.pole).filter((k) => /^surchargeParameterValueId\[/.test(k) && post.pole[k]);
      j.over(vPost.length === idcka.length, "POST nesie " + vPost.length + " vzoriek, má " + idcka.length + ": " + vPost.map((k) => k + "=" + post.pole[k]).join(" "));
      j.over(cena.spolu === 5 * idcka.length, "súčet príplatkov z POST " + cena.spolu + " ≠ 5 € × " + idcka.length);
      j.over(zaloha === cena.spolu, "„Vratná záloha spolu“ " + zaloha + " ≠ súčet z POST " + cena.spolu);
      const videne = await ovl.cena.zobrazenaCena(s.t);
      if (videne !== cena.spolu) s.upozornenia.push(`živá Shoptet cena pri ${idcka.length} vzorkách ukazuje ${videne} €, rekapitulácia aj POST ${cena.spolu} € (chyba živého webu)`);
      const odp = await ovl.cena.odporucana(s.t);
      j.over(!odp || !odp.cena, "vzorkovník ukazuje odporúčanú cenu " + JSON.stringify(odp));
      return { info: `${idcka.join(", ")}: POST ${vPost.length} príplatky „Áno“, záloha ${zaloha} € = ${cena.rozpis}; Shoptet cena ${videne}`, post: post.body, spolu: cena.spolu };
    },
  },

  /** Bez vzorky: nový vzhľad do košíka nič (POST 0); starý vzhľad = baseline (zapíše, čo spraví). */
  "vzorky-0": {
    typy: ["vzorky"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy });
      await ovl.cena.pridajDoKosika(s.t);
      await j.pauza(2500);
      if (ovl.zdroj.vzorky === "novy") {
        j.over(s.posty.length === 0, "0 vzoriek odišlo do košíka: " + (s.posty[0] && s.posty[0].body));
        return { info: "0 vzoriek: POST 0" };
      }
      if (s.posty.length) {
        const plne = Object.keys(s.posty[0].pole).filter((k) => /^surcharge/.test(k) && s.posty[0].pole[k]);
        j.over(plne.length === 0, "0 vzoriek, ale POST nesie " + plne.join(","));
        s.upozornenia.push("starý vzhľad pustí do košíka vzorkovník bez vzorky (POST so všetkými prázdnymi) — nový vzhľad musí POST 0");
        return { info: "starý vzhľad: 0 vzoriek -> POST so všetkými prázdnymi (zachytený a zrušený)", post: s.posty[0].body };
      }
      return { info: "starý vzhľad: 0 vzoriek -> POST 0" };
    },
  },
};
