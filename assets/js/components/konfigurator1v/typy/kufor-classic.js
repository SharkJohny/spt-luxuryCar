// Texty a obrázky typu „kufor-classic“ (rohož do kufra Classic 619 Diamond, 622 Hexa, 625 Stripe).
// VLASTNÍK: worker kufor (T2.2). Texty doslovne zo schváleného návrhu navrhy/kufor-classic.html (špecifikácia
// prieskum-vsetky/navrh-kufor-classic.md §3–4). Tvar a pravidlá: typy/jedno.js (základ — čo tu nie je, platí z jedno).
// Posledný krok (farba) dostane „Pokračujte k súhrnu“ v kroky.js (živé tlačidlo by vkladalo do košíka).
//
// kuforProdukt = texty modulu kufor-produkt.js (ctx.texty("kuforProdukt")). Čísla v nich (ceny vzorov, cena v sete,
// úspora) NIKDY natvrdo: modul ich dosadí zo živých stránok (ceny-ine.js). Keď ich nezistí, vetu/banner neukáže.
// D3 (rozhodnutia.md): žiadne „logo“ / „kovový štítok“ ani dodacia lehota — tu nič také nie je.
export const TYP = {
  texty: {
    kroky: {
      postup: (z) => "Vaša rohož do kufra v " + z + " krokoch",
      kroky: {
        // vzor: podnadpis s cenami vzorov a ceny dlaždíc („230 € / 240 € / 240 €“) dosadí kufor-produkt.js zo sesterských
        // stránok (ceny-ine.js) — preto tu pod: null (statická veta s číslom by bola natvrdo)
        vzor: { pod: null },
        auto: { pod: "Tvar rohože sa šije podľa šablóny dna kufra Vášho modelu." },
        farba: {
          nm: "Farba a šitie",
          ti: "Prosím, vyberte si farbu rohože do kufra",
          pod: "Po výbere uvidíte materiál zblízka.",
          chyba: "Vyberte, prosím, farbu rohože do kufra.",
        },
      },
    },
    cena: {
      typ: "Dno kufra",
      // popis lepivej lišty (návrh kufor-classic.html lPop): „Diamond Line · rohož do kufra“, po výbere farby „Diamond Line · <farba>“
      // (Michal 16. 10. 2026: vždy povedať, kam rohož patrí; „… rohož do kufra Classic“ má 171 px a lišta pri 360/390 px
      // dá popisu najviac 151/165 px -> orezalo by sa na „…“, preto bez „Classic“ — Classic je v názve nad konfigurátorom)
      lista: (i) => [i.vzor, i.farba ? i.farba.toLowerCase() : "rohož do kufra"].filter(Boolean).join(" · "),
    },
    // „Poznámka k objednávke“ (poznamka.js; návrh kufor-classic.html .pozn-dole, navrh-kufor-classic.md §Súhrn)
    poznamka: {
      ph: "Napríklad: v kufri mám nadstandardnú výbavu, ktorú treba obísť…",
      hint: "Netypická výbava kufra alebo iné želanie — napíšte to sem.",
    },
    kuforProdukt: {
      // názov rohože len vizuálne (živý H1 ostáva v DOM pre SEO a živý kód): „Luxusná rohož do kufra Classic Diamond Line“
      nazov: "Luxusná rohož do kufra Classic",
      vzory: { diamond: "Diamond Line", stripe: "Stripe Line", hexa: "Hexa Line" },
      // podnadpis kroku 1 (návrh: „Diamond Line je v základnej cene. Stripe Line a Hexa Line stoja o 10 € viac.“)
      vzorPod: (lacny, drahe, rozdiel) => lacny + " je v základnej cene. " + drahe.join(" a ") + " stoja o " + rozdiel + " viac.",
      // všetky vzory za rovnakú cenu (veta zo schváleného návrhu jednovrstvove.html)
      vzorPodRovnako: "Všetky tri vzory majú rovnakú cenu.",
      // cena pod názvom vzoru na dlaždici = PLNÁ cena rohože v tom vzore (návrh: „230 € / 240 € / 240 €“, zo sesterských stránok)
      dlazdica: "cena",
      vCene: "v cene",
      // riadok pod tlačidlom košíka (návrh .kc-alt) -> rohož Premium v tom istom vzore
      alt: { text: "Chcete chrániť aj boky kufra?", odkaz: "Pozrite si rohož do kufra Premium", typ: "kufor-premium" },
    },
    // Ponuka setu ako skrytá karta bez čísla medzi kartou Auto a Farba (komplet-ponuka.js; Michal 17. 10. 2026: návrh 1
    // „Ponuka ako druhá vrstva“, „pri kufri skrytá sekcia predtým, ako si vyberie farbu“). Čísla dosadí modul živo
    // (cena tejto stránky vs. voľba kufra „dno“ na jednovrstvových toho istého vzoru), nikdy „+ X €“. Rohož v sete je vo
    // farbe autokobercov — farbu si zákazník vyberie až tam (veta ben).
    komplet: {
      nm: "Autokoberce pod sedadlá",
      ti: "Prosíte si aj autokoberce pod sedadlá?",
      vy: "Áno alebo nie",
      vyNie: "Len rohož do kufra",
      // telo karty = banner setu C (set-banner.js; Michal 17. 10. 2026: „toto má byť v medzikroku, nie ďalší iný banner“),
      // cena v sete NIE ako „+ X €“ (vyzerá ako príplatok k cene hore); „pod sedadlá“, lebo interiér auta je aj kufor
      banner: {
        ey: "Výhodnejšie v sete",
        h: "Rohož do kufra Classic len za",
        kd: "keď ju kúpite spolu s autokobercami pod sedadlá",
        sam: "Samostatne",
        us: "Ušetríte",
        stuha: "Zľava", // stuha cez roh banneru: „Zľava −30 %“ (percento živo, set-banner.js)
        // bez štítkov na fotkách („Autokoberce pod sedadlá“, „Rohož do kufra …“) — Michal 18. 10. 2026: „tie texty daj preč,
        // radšej daj tú fotku väčšiu“ (veta v banneri hovorí to isté)
      },
      ano: { tl: "Áno, chcem set s autokobercami" },
      ben: "Vzor aj auto Vám ostanú, rohož bude vo farbe autokobercov.",
      nie: { nm: "Nie, ďakujem", pozn: "Pokračujete len s rohožou do kufra." },
      prenos: "Prenášame Váš výber na autokoberce pod sedadlá…",
      prenosRohoz: "rohož do kufra Classic",
    },
  },
};
