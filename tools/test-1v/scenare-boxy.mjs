// Scenáre navyše pre box do kufra 616 (typ „boxy“). VLASTNÍK: worker boxy (W4 / T3.2). Tvar: scenare-jedno.mjs.
// Spoločné scenáre v jadre: brana, nulova-zmena, neuplne (farba -> veľkosť, POST 0), platne (1 × M), dokoncit
// (starý web: tlačidlo posledného kroku = živý POST, zachytený a zrušený), k-suhrnu (nový vzhľad).
//
// Živý POST boxu (14. 10. 2026): productId, priceId, language, amount, parameterValueId[78], surchargeParameterValueId[94]
// (+ [97] pri 2–3 ks, + [100] pri 3 ks). Box, ktorý nie je v počte, v POST CHÝBA (živý .val(0) -> selectedIndex -1).
// Ceny: 1. box v cene produktu (S +0, M +10, L +35, XL +49), 2. a 3. box plná cena (S 197 … XL 249).

async function pocetBoxov(s, a, ovl, j, pocet, velkosti) {
  await j.otvor(s, a.url, { novy: a.novy });
  const z = await j.zaklad(s, ovl, { pocet, velkosti });
  j.over(z.pocet === pocet, "počet boxov " + z.pocet + " ≠ " + pocet);
  await ovl.cena.pridajDoKosika(s.t);
  const post = await j.cakajNaPost(s);
  const cena = await j.overPost(s, post, z.ocak);
  const c = await j.overCenu(s, ovl, cena);
  return { info: `${pocet} × ${velkosti.join("+")}: cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`, post: post.body, spolu: cena.spolu };
}

export const SCENARE = {
  /** 2 boxy S + L -> POST [94]=S [97]=L, cena 197 + 0 + 232 = 429 (plan §4). */
  "box-pocet-2": { typy: ["boxy"], fn: (s, a, pom, ovl, j) => pocetBoxov(s, a, ovl, j, 2, ["S", "L"]) },

  /** 3 boxy S + S + XL -> POST [94]=S [97]=S [100]=XL, cena 197 + 0 + 197 + 249 = 643 (plan §4). */
  "box-pocet-3": { typy: ["boxy"], fn: (s, a, pom, ovl, j) => pocetBoxov(s, a, ovl, j, 3, ["S", "S", "XL"]) },

  /**
   * 3 boxy -> 1 box: 2. a 3. box sa vyprázdnia (v POST chýbajú alebo sú prázdne), cena = 1 box S = 197 (plan §4).
   * Starý web pri „1 ks“ vynuluje aj veľkosť 1. boxu (resetBoxSizeOptions(1, true)) — vtedy ju scenár vyberie znova
   * a zapíše to do info (nový vzhľad by mal 1. box nechať).
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
      if (vynulovany1) h = await ovl.boxy.vyberVelkosti(s.t, ["S"]);
      j.over(h.box1 && !h.box2 && !h.box3, "po prepnutí na 1 box ostali veľkosti 2./3. boxu: " + JSON.stringify(h));
      await ovl.cena.pridajDoKosika(s.t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { farba: z.farba, box1: h.box1 });
      const c = await j.overCenu(s, ovl, cena);
      return {
        info: `3 × S+S+XL -> 1 ks${vynulovany1 ? " (1. box sa vynuloval, vybraný znova)" : " (1. box ostal)"}: cena ${c.videne} = ${cena.zaklad} + ${cena.rozpis}`,
        post: post.body, spolu: cena.spolu,
      };
    },
  },
};
