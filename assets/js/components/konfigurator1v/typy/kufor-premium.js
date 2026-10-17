// Texty a obrázky typu „kufor-premium“ (rohož do kufra Premium 628 Diamond, 631 Hexa, 634 Stripe).
// VLASTNÍK: worker kufor (T2.2). Texty doslovne zo schváleného návrhu navrhy/kufor-premium.html (špecifikácia
// prieskum-vsetky/navrh-kufor-premium.md §3–4). Tvar a pravidlá: typy/jedno.js (základ — čo tu nie je, platí z jedno).
// Krok 2 (auto) nemá podnadpis (návrh). Dlaždice vzoru majú fotky vzorov 598 (kroky-vzor-*.jpg, ako v návrhu).
//
// kuforProdukt = texty modulu kufor-produkt.js; čísla dosadí modul zo živých stránok (ceny-ine.js), nič natvrdo.
// D3 (rozhodnutia.md): žiadny „kovový štítok“ / „logo“ ani dodacia lehota.
export const TYP = {
  texty: {
    kroky: {
      postup: (z) => "Vaša rohož do kufra v " + z + " krokoch",
      kroky: {
        vzor: { pod: null }, // podnadpis s cenami vzorov dosadí kufor-produkt.js
        farba: {
          nm: "Farba rohože do kufra",
          ti: "Prosím, vyberte si farbu rohože do kufra",
          chyba: "Vyberte, prosím, farbu rohože do kufra.",
        },
      },
    },
    cena: {
      typ: "Celý kufor",
      // popis lepivej lišty (návrh kufor-premium.html lPop): „Premium · Diamond Line“ (+ „ · <farba>“)
      lista: (i) => ["Premium", i.vzor, i.farba ? i.farba.toLowerCase() : ""].filter(Boolean).join(" · "),
    },
    // „Poznámka k objednávke“ (poznamka.js; návrh kufor-premium.html .pozn-dole, navrh-kufor-premium.md §Súhrn)
    poznamka: {
      ph: "Napríklad: v kufri mám aj sieťku na boku…",
      hint: "Netypická výbava alebo iné želanie — napíšte to sem.",
    },
    kuforProdukt: {
      nazov: "Luxusná rohož do kufra Premium",
      vzory: { diamond: "Diamond Line", stripe: "Stripe Line", hexa: "Hexa Line" },
      // návrh: „Diamond Line je v základnej cene, Stripe Line a Hexa Line stoja o 10 € viac. Ponuka farieb sa pri každom vzore líši.“
      vzorPod: (lacny, drahe, rozdiel) => lacny + " je v základnej cene, " + drahe.join(" a ") + " stoja o " + rozdiel + " viac. Ponuka farieb sa pri každom vzore líši.",
      vzorPodRovnako: "Všetky tri vzory majú rovnakú cenu. Ponuka farieb sa pri každom vzore líši.",
      vCene: "v cene",
      // banner setu pod cenou (set-banner.js, návrh C, Michal 17. 10. 2026): „Rohož do kufra Premium len za 239 €, keď ju
      // kúpite spolu s autokobercami pod sedadlá“ + „Samostatne 340 €“ (prečiarknuté) + „Ušetríte 101 €“ — nikdy „+ 239 €“
      set: {
        rohoz: "premium", // voľba kufra na jednovrstvovom produkte: dno + boky
        ey: "Výhodnejšie v sete",
        h: "Rohož do kufra Premium len za",
        kd: "keď ju kúpite spolu s autokobercami pod sedadlá",
        sam: "Samostatne",
        us: "Ušetríte",
        pip: "Rohož do kufra Premium",
        tag: "Autokoberce pod sedadlá",
        odkaz: "Zostaviť set s autokobercami",
      },
      alt: null, // Premium nemá odkaz pod košíkom (porovnanie s Classic je v obsahu pod konfigurátorom)
    },
  },
  obrazky: {},
};
