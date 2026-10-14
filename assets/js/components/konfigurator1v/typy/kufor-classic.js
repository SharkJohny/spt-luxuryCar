// Texty a obrázky typu „kufor-classic“ (rohož do kufra Classic 619 Diamond, 622 Hexa, 625 Stripe).
// VLASTNÍK: worker kufor (T2.2). Texty doslovne zo schváleného návrhu navrhy/kufor-classic.html (špecifikácia
// prieskum-vsetky/navrh-kufor-classic.md §3–4). Tvar a pravidlá: typy/jedno.js (základ — čo tu nie je, platí z jedno).
// Posledný krok (farba) dostane „Pokračujte k súhrnu“ v kroky.js (živé tlačidlo by vkladalo do košíka).
//
// kuforProdukt = texty modulu kufor-produkt.js (ctx.texty("kuforProdukt")). Čísla v nich (ceny vzorov, príplatok
// setu, úspora) NIKDY natvrdo: modul ich dosadí zo živých stránok (ceny-ine.js). Keď ich nezistí, vetu/pás neukáže.
// D3 (rozhodnutia.md): žiadne „logo“ / „kovový štítok“ ani dodacia lehota — tu nič také nie je.
export const TYP = {
  texty: {
    kroky: {
      postup: (z) => "Vaša rohož v " + z + " krokoch",
      kroky: {
        // vzor: podnadpis s cenami vzorov a ceny dlaždíc („v cene / + 10 €“) dosadí kufor-produkt.js zo sesterských
        // stránok (ceny-ine.js) — preto tu pod: null (statická veta s číslom by bola natvrdo)
        vzor: { pod: null },
        auto: { pod: "Tvar rohože sa šije podľa šablóny dna kufra Vášho modelu." },
        farba: {
          nm: "Farba a šitie",
          ti: "Prosím, vyberte farbu rohože",
          pod: "Po výbere uvidíte materiál zblízka.",
          chyba: "Vyberte, prosím, farbu rohože.",
        },
      },
    },
    cena: {
      typ: "Dno kufra",
      zaSet: "cena za rohož na mieru",
      // popis lepivej lišty (návrh kufor-classic.html lPop): „Diamond Line · rohož Classic“, po výbere farby „Diamond Line · <farba>“
      lista: (i) => [i.vzor, i.farba ? i.farba.toLowerCase() : "rohož Classic"].filter(Boolean).join(" · "),
    },
    kuforProdukt: {
      // názov rohože len vizuálne (živý H1 ostáva v DOM pre SEO a živý kód): „Luxusná rohož do kufra Classic Diamond Line“
      nazov: "Luxusná rohož do kufra Classic",
      vzory: { diamond: "Diamond Line", stripe: "Stripe Line", hexa: "Hexa Line" },
      // podnadpis kroku 1 (návrh: „Diamond Line je v základnej cene. Stripe Line a Hexa Line stoja o 10 € viac.“)
      vzorPod: (lacny, drahe, rozdiel) => lacny + " je v základnej cene. " + drahe.join(" a ") + " stoja o " + rozdiel + " viac.",
      // všetky vzory za rovnakú cenu (veta zo schváleného návrhu jednovrstvove.html)
      vzorPodRovnako: "Všetky tri vzory majú rovnakú cenu.",
      // cena pod názvom vzoru na dlaždici = cena sesterskej stránky − cena tejto stránky
      vCene: "v cene",
      // pás pod cenou (návrh .kc-set): „V sete s autokobercami len + 129 € (ušetríte 101 €)“ + „Zostaviť set“
      set: {
        tvar: "riadok",
        rohoz: "classic", // voľba kufra na jednovrstvovom produkte: dno (bez bokov)
        text: "V sete s autokobercami len",
        usetrite: (suma) => "(ušetríte " + suma + ")",
        odkaz: "Zostaviť set",
      },
      // riadok pod tlačidlom košíka (návrh .kc-alt) -> rohož Premium v tom istom vzore
      alt: { text: "Chcete chrániť aj boky kufra?", odkaz: "Pozrite si rohož Premium", typ: "kufor-premium" },
    },
  },
  obrazky: {},
};
