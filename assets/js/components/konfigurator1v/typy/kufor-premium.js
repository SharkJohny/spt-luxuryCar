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
      alt: null, // Premium nemá odkaz pod košíkom (porovnanie s Classic je v obsahu pod konfigurátorom)
    },
    // Ponuka setu ako skrytá karta bez čísla medzi kartou Auto a Farba (komplet-ponuka.js; Michal 17. 10. 2026, návrh 1).
    // Čísla živo (cena tejto stránky vs. voľba kufra „dno + boky“ na jednovrstvových toho istého vzoru), nikdy „+ X €“.
    komplet: {
      nm: "Autokoberce pod sedadlá",
      ti: "Prosíte si aj autokoberce pod sedadlá?",
      vy: "Áno alebo nie",
      vyNie: "Len rohož do kufra",
      // telo karty = banner setu C (set-banner.js; Michal 17. 10. 2026: „toto má byť v medzikroku, nie ďalší iný banner“),
      // cena v sete NIE ako „+ X €“ (vyzerá ako príplatok k cene hore); „pod sedadlá“, lebo interiér auta je aj kufor
      banner: {
        ey: "Výhodnejšie v sete",
        h: "Rohož do kufra Premium len za",
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
      prenosRohoz: "rohož do kufra Premium",
    },
  },
};
