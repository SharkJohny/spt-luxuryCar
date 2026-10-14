// Texty a obrázky typu „kufor-premium“ (rohož do kufra Premium 628 Diamond, 631 Hexa, 634 Stripe).
// VLASTNÍK: worker kufor (T2.2). STUB z jadra T0.1: spoločné texty krokov doslovne zo špecifikácie
// navrh-kufor-premium.md §3–4 a štítok ceny. Tvar a pravidlá: typy/jedno.js (základ — čo tu nie je, platí z jedno).
export const TYP = {
  texty: {
    kroky: {
      postup: (z) => "Vaša rohož v " + z + " krokoch",
      kroky: {
        farba: {
          nm: "Farba rohože",
          ti: "Prosím, vyberte farbu rohože",
          chyba: "Vyberte, prosím, farbu rohože.",
        },
      },
    },
    cena: { typ: "Celý kufor", zaSet: "cena za rohož na mieru" },
  },
  obrazky: {},
};
