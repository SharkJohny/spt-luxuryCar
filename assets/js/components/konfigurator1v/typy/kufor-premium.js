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
      postup: (z) => "Vaša rohož v " + z + " krokoch",
      kroky: {
        vzor: { pod: null }, // podnadpis s cenami vzorov dosadí kufor-produkt.js
        farba: {
          nm: "Farba rohože",
          ti: "Prosím, vyberte si farbu rohože",
          chyba: "Vyberte, prosím, farbu rohože.",
        },
      },
    },
    cena: {
      typ: "Celý kufor",
      zaSet: "cena za rohož na mieru",
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
      // pás pod cenou (návrh .setpas, celý pás je odkaz): „V sete s autokobercami len + 239 €“ + veta o úspore + „Zostavte set“
      set: {
        tvar: "pas",
        rohoz: "premium", // voľba kufra na jednovrstvovom produkte: dno + boky
        text: "V sete s autokobercami len",
        // návrh: „… o viac než 100 € lacnejšie …“ — platí len pri úspore nad 100 €, inak presná suma
        usetrite: (suma, n) => (n > 100 ? "Rohož Premium vyjde o viac než 100 € lacnejšie než samostatne." : "Rohož Premium vyjde o " + suma + " lacnejšie než samostatne."),
        odkaz: "Zostavte set",
      },
      alt: null, // Premium nemá odkaz pod košíkom (porovnanie s Classic je v obsahu pod konfigurátorom)
    },
  },
  obrazky: {},
};
