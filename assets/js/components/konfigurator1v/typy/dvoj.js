// Texty a obrázky typu „dvoj“ (dvojvrstvové 601 Diamond, 604 Hexa, 607 Stripe). VLASTNÍK: worker dvoj (T1.2).
// STUB z jadra T0.1: len spoločné texty krokov doslovne zo špecifikácie navrh-dvojvrstvove.md §3.3–3.6 a štítok ceny.
// Tvar a pravidlá: typy/jedno.js (základ — čo tu nie je, platí z jedno). Krok farba2 (karta 4) vyplní farba2.js.
export const TYP = {
  texty: {
    kroky: {
      kroky: {
        farba: {
          nm: "Farba 1. vrstvy",
          ti: "Prosím, vyberte farbu prvej vrstvy",
          pod: "Prvá vrstva je prešívaný koberec. Po výbere uvidíte materiál zblízka.",
          chyba: "Vyberte, prosím, farbu prvej vrstvy.",
        },
        farba2: {
          nm: "Farba 2. vrstvy",
          ti: "Prosím, vyberte farbu druhej vrstvy",
          vy: "",
          chyba: "Vyberte, prosím, farbu druhej vrstvy.",
        },
      },
    },
    cena: { typ: "Dvojvrstvové", zaSet: "cena za set na mieru" },
  },
  obrazky: {},
};
