// Scenáre navyše pre dvojvrstvové 601/604/607 (typ „dvoj“). VLASTNÍK: worker dvoj (W2 / T1.2).
// Tvar a parametre: tools/test-1v/scenare-jedno.mjs. Spoločné scenáre (platne s farbou 2. vrstvy, neuplne
// auto -> farba -> farba2 -> rozloženie, kufor-*, box-* …) sú v jadre.
export const SCENARE = {
  /**
   * Zmena farby 2. vrstvy po celom výbere: priceId = variant „71-<lux>-78-<farba>“ (oba variantné selecty),
   * POST nesie novú Lux, cena = Shoptet. (plan §6: 2V priceId závisí od dvoch variantov)
   */
  "farba2-prepni": {
    typy: ["dvoj"],
    async fn(s, a, pom, ovl, j) {
      await j.otvor(s, a.url, { novy: a.novy });
      const z = await j.zaklad(s, ovl, { farba2: 0 });
      const pred = await s.t.ev(`(document.querySelector('#product-detail-form input[name="priceId"]') || {}).value || ""`);
      const f2 = await ovl.farba2.vyberFarbu2(s.t, { index: 3 });
      j.over(f2 && f2 !== z.farba2, "farba 2. vrstvy sa nezmenila: " + z.farba2 + " -> " + f2);
      await ovl.cena.pridajDoKosika(s.t);
      const post = await j.cakajNaPost(s);
      const cena = await j.overPost(s, post, { ...z.ocak, farba2: f2 });
      j.over(post.pole.priceId !== pred, "priceId sa po zmene farby 2. vrstvy nezmenilo (" + pred + ")");
      const c = await j.overCenu(s, ovl, cena);
      return { info: `Lux ${z.farba2} -> ${f2}: priceId ${pred} -> ${post.pole.priceId}, cena ${c.videne}`, post: post.body, spolu: cena.spolu };
    },
  },
};
