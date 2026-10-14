// Texty a obrázky typu „boxy“ (box do kufra 616). VLASTNÍK: worker boxy (T3.2). STUB z jadra T0.1: spoločné texty
// krokov doslovne zo špecifikácie navrh-boxy.md §3–4 a štítok ceny. Tvar a pravidlá: typy/jedno.js.
// Kroky (produkty.js TYPY.boxy): farba → pocet → velkost (návrh); v živom DOM je počet prvý — poradie kariet rieši
// CSS typu (_lcd1v-boxy.scss), DOM ostáva. Karty počtu a veľkostí postaví boxy-produkt.js.
export const TYP = {
  texty: {
    kroky: {
      postup: (z) => "Vaše boxy v " + z + " krokoch",
      kroky: {
        farba: {
          nm: "Farba boxov",
          ti: "Prosím, vyberte farbu boxu",
          pod: "Farba platí pre všetky boxy v objednávke. Po výbere uvidíte materiál zblízka.",
          chyba: "Vyberte, prosím, farbu boxov.",
        },
        pocet: {
          nm: "Počet boxov",
          ti: "Prosím, vyberte počet boxov",
          vy: "",
          pod: "Do kufra môžete zvoliť až tri boxy. Veľkosť vyberiete pri každom zvlášť.",
        },
        velkost: {
          nm: "Veľkosť boxov",
          ti: "Prosím, vyberte veľkosť boxu",
          vy: "Vyberte veľkosť",
          chyba: "Vyberte, prosím, veľkosť každého boxu.",
        },
      },
    },
    cena: { typ: "Box do kufra", zaSet: "cena za box" },
  },
  obrazky: {},
};
