// Texty a obrázky typu „kufor-classic“ (rohož do kufra Classic 619 Diamond, 622 Hexa, 625 Stripe).
// VLASTNÍK: worker kufor (T2.2). STUB z jadra T0.1: spoločné texty krokov doslovne zo špecifikácie
// navrh-kufor-classic.md §3–4 a štítok ceny. Tvar a pravidlá: typy/jedno.js (základ — čo tu nie je, platí z jedno).
// Posledný krok (farba) dostane „Pokračujte k súhrnu“ v kroky.js (živé tlačidlo by vkladalo do košíka).
export const TYP = {
  texty: {
    kroky: {
      postup: (z) => "Vaša rohož v " + z + " krokoch",
      kroky: {
        // vzor: podnadpis a ceny dlaždíc („v cene / + 10 €“) až T2.2 — ceny len zo sesterských stránok (ceny-ine.js)
        auto: { pod: "Tvar rohože sa šije podľa šablóny dna kufra Vášho modelu." },
        farba: {
          nm: "Farba a šitie",
          ti: "Prosím, vyberte farbu rohože",
          pod: "Po výbere uvidíte materiál zblízka.",
          chyba: "Vyberte, prosím, farbu rohože.",
        },
      },
    },
    cena: { typ: "Dno kufra", zaSet: "cena za rohož na mieru" },
  },
  obrazky: {},
};
