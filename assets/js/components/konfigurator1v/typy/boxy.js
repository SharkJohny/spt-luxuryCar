// Texty a obrázky typu „boxy“ (box do kufra 616). VLASTNÍK: worker boxy (T3.2). Tvar a pravidlá: typy/jedno.js.
// Texty doslovne zo schváleného návrhu boxy.html (navrh-boxy.md §3–4). Kroky (produkty.js TYPY.boxy): farba → pocet →
// velkost (návrh); v živom DOM je počet prvý — poradie kariet rieši CSS typu (_lcd1v-boxy.scss), DOM ostáva.
// Karty počtu, veľkostí, náhľad farby, banner setu a vizuálny názov postaví boxy-produkt.js (texty: boxyProdukt nižšie).
// D3 (rozhodnutia.md): nič o skladovosti ani o lehote dodania boxu.
export const TYP = {
  texty: {
    kroky: {
      postup: (z) => "Vaše boxy v " + z + " krokoch",
      kroky: {
        farba: {
          nm: "Farba boxov",
          ti: "Prosím, vyberte si farbu boxu",
          pod: "Farba platí pre všetky boxy v objednávke. Po výbere uvidíte materiál zblízka.",
          chyba: "Vyberte, prosím, farbu boxov.",
        },
        pocet: {
          nm: "Počet boxov",
          ti: "Prosím, vyberte si počet boxov",
          vy: "1 box",
          pod: "Do kufra môžete zvoliť až tri boxy. Veľkosť vyberiete pri každom zvlášť.",
        },
        velkost: {
          nm: "Veľkosť boxov",
          ti: "Prosím, vyberte si veľkosť boxu",
          vy: "Vyberte veľkosť",
          pod: "Dva rozmery (32 a 30 cm) sú pri všetkých veľkostiach rovnaké, líši sa len šírka. Kresba boxu na každej karte je v skutočnom pomere a vo farbe, ktorú ste si vybrali.",
          chyba: "Vyberte, prosím, veľkosť každého boxu.",
        },
      },
    },
    cena: { typ: "Box do kufra" },
    // „Poznámka k objednávke“ (poznamka.js; návrh boxy.html .pozn-dole, navrh-boxy.md §Súhrn)
    poznamka: {
      ph: "Napríklad: do kufra mi vojde šírka približne 80 cm — poraďte, ktoré veľkosti zvoliť…",
      hint: "Otázka k veľkosti, želanie k farbe alebo iná požiadavka — napíšte to sem.",
    },
    // boxy-produkt.js
    boxyProdukt: {
      // vizuálny názov (živý H1 „luxusný boxi do kufra“ ostáva v DOM, len vizuálne skrytý — plan.md §2.5)
      nazov: "Luxusný box do kufra",
      // popis lepivej lišty (návrh boxy.html lPop): „Box do kufra ×2 · S + L · <farba>“ (háčik cena:lista v boxy-produkt.js)
      lista: "Box do kufra",
      rad: "Diamond Line",
      // krok 1: štítok náhľadu materiálu (farbu slovami ukazuje riadok vybranaFarba nad ním)
      nahlad: "Diamond Line",
      // krok 1: pod vzorkami vybraná farba slovami „Vybraná farba: Čierna koža, béžové šitie“ (kroky.js popisFarby)
      vybranaFarba: "Vybraná farba:",
      // krok 2: dlaždice počtu (návrh C „Fotka cez celú dlaždicu“, Michal 18. 10. 2026): názov, veta o využití, cena „od“
      // zo živých príplatkov a pod ňou „2 × od 197 €“ (len keď je každý box od rovnakej sumy)
      pocet: {
        1: { nm: "1 box", ben: "Na nákup a drobnosti, ktoré by sa inak v kufri kotúľali.", alt: "Jeden box v kufri", vy: "1 box" },
        2: { nm: "2 boxy", ben: "Dva vedľa seba — miesto aj na väčší nákup.", alt: "Dva boxy v kufri", vy: "2 boxy" },
        3: { nm: "3 boxy", ben: "Celý kufor rozdelený, každá vec má svoje miesto.", alt: "Tri boxy v kufri", vy: "3 boxy" },
      },
      krat: (n, cena) => n + " × od " + cena,
      skupinaPocet: "Počet boxov",
      od: "od",
      // krok 3: veľkosti
      box: (n) => n + ". box",
      vyberteVelkost: "vyberte veľkosť",
      tipB: "Tip:",
      tip: " zmerajte šírku miesta v kufri. Pri dvoch alebo troch boxoch vedľa seba sa ich šírky sčítavajú.",
      // farby kresby boxu v kroku 3: mapa je v box-kresba.js FARBY_KRESBY (spoločná s oknom boxov na autokobercoch,
      // Michal 18. 10. 2026)
    },
    // Ponuka setu ako skrytá karta bez čísla za kartou Počet boxov (komplet-ponuka.js; Michal 17. 10. 2026 večer: „toto
    // sa má zobrazovať po kroku počet boxov“). Len pri 1 alebo 2 boxoch (set má najviac 2). d = { pocet, od (veľkosti ešte
    // nie sú zvolené -> „už od“ s najlacnejšou veľkosťou), velkosti „S“ / „M + L“, cena „99 €“, farba "ok" | "nie" (farbu
    // set nemá) | "ziadna", nazov farby }; čísla živo (cena tejto stránky vs. box solo / 1. + 2. box na 598), nikdy „+ X €“.
    komplet: {
      nm: "Autokoberce pod sedadlá",
      ti: "Prosíte si aj autokoberce pod sedadlá?",
      vy: "Áno alebo nie",
      vyNie: (d) => (d.pocet > 1 ? "Len boxy do kufra" : "Len box do kufra"),
      // telo karty = banner setu C (set-banner.js; Michal 17. 10. 2026: „toto má byť v medzikroku, nie ďalší iný banner“)
      // s číslami pre zvolený počet a veľkosti: „Box do kufra M len za 109 €“ / „Boxy do kufra M + L len za …“
      banner: {
        ey: "Výhodnejšie v sete",
        h: (d) => (d.pocet > 1 ? "Boxy do kufra " : "Box do kufra ") + (d.od ? "už od" : d.velkosti + " len za"),
        kd: (d) => (d.pocet > 1 ? "keď ich kúpite spolu s autokobercami pod sedadlá" : "keď ho kúpite spolu s autokobercami pod sedadlá"),
        // „už od“: porovnanie tej istej veľkosti („Box S samostatne 197 €“, „Boxy S + S samostatne 394 €“)
        sam: (d) => (d.od ? (d.pocet > 1 ? "Boxy " : "Box ") + d.velkosti + " samostatne" : "Samostatne"),
        us: "Ušetríte",
        stuha: "Zľava", // stuha cez roh banneru: „Zľava −X %“ pre zvolené veľkosti (živo, set-banner.js)
        // bez štítkov na fotkách („Autokoberce pod sedadlá“, „2 boxy do kufra“) — Michal 18. 10. 2026: „tie texty daj preč,
        // radšej daj tú fotku väčšiu“ (veta v banneri hovorí to isté)
      },
      ano: { tl: "Áno, chcem set s autokobercami" },
      // farba boxu, ktorú set nemá: povedať to a farbu neprenášať — zákazník ju vyberie v okne boxov (do 22. 10. 2026
      // to bola „Šedá“ 616; po prestavení na Béžovú má set všetky farby boxu a veta je len poistka)
      ben: (d) => {
        const dva = d.pocet > 1;
        if (d.od) {
          // veľkosti ešte nie sú zvolené: vyberú sa pri autokobercoch (okno boxov)
          if (d.farba === "nie") return "Farba „" + d.nazov + "“ sa v sete neponúka, farbu aj " + (dva ? "veľkosti boxov" : "veľkosť boxu") + " si vyberiete pri autokobercoch.";
          if (d.farba === "ziadna") return (dva ? "Počet boxov Vám ostane, farbu aj veľkosti" : "Farbu aj veľkosť boxu") + " vyberiete pri autokobercoch.";
          return dva ? "Farba a počet boxov Vám ostanú, veľkosti vyberiete pri autokobercoch." : "Farba boxu Vám ostane, veľkosť vyberiete pri autokobercoch.";
        }
        if (d.farba === "nie") return "Farba „" + d.nazov + "“ sa v sete neponúka, farbu boxu si vyberiete pri autokobercoch.";
        if (d.farba === "ziadna") return dva ? "Veľkosti boxov Vám ostanú, farbu vyberiete pri autokobercoch." : "Veľkosť boxu Vám ostane, farbu vyberiete pri autokobercoch.";
        return dva ? "Farba aj veľkosti boxov Vám ostanú." : "Farba aj veľkosť boxu Vám ostanú.";
      },
      nie: { nm: "Nie, ďakujem", pozn: (d) => (d.pocet > 1 ? "Pokračujete len s boxmi do kufra." : "Pokračujete len s boxom do kufra.") },
      prenos: "Prenášame Váš výber na autokoberce pod sedadlá…",
    },
  },
  // Fotky (assets/img/1v/boxprodukt-*; reálne fotky z návrhu boxy.html). Box nemá vzor -> kľúč „diamond“.
  // Farby podľa názvu farby (kroky.js nazovFarby, bez diakritiky): náhľad materiálu v kroku 1; farba bez fotky = vzorka.
  obrazky: {
    "boxprodukt-pocet-1": { diamond: "boxprodukt-pocet-1.jpg" },
    "boxprodukt-pocet-2": { diamond: "boxprodukt-pocet-2.jpg" },
    "boxprodukt-pocet-3": { diamond: "boxprodukt-pocet-3.jpg" },
    "boxprodukt-farba-cierna-cervene-sitie": { diamond: "boxprodukt-farba-cierna-cervene.jpg" },
    "boxprodukt-farba-cierna-modre-sitie": { diamond: "boxprodukt-farba-cierna-modre.jpg" },
    "boxprodukt-farba-cierna-cierne-sitie": { diamond: "boxprodukt-farba-cierna-cierne.jpg" },
    "boxprodukt-farba-cierna-bezove-sitie": { diamond: "boxprodukt-farba-cierna-bezove.jpg" },
    "boxprodukt-farba-cierna-sive-sitie": { diamond: "boxprodukt-farba-cierna-sive.jpg" },
    "boxprodukt-farba-cierna-biele-sitie": { diamond: "boxprodukt-farba-cierna-biele.jpg" },
    "boxprodukt-farba-hneda-kava": { diamond: "boxprodukt-farba-hneda-kava.jpg" },
    "boxprodukt-farba-vinovo-cervena": { diamond: "boxprodukt-farba-vinovo-cervena.jpg" },
    // svetlý box = Béžová (Michal 22. 10. 2026: „Tam, kde je box so šedou farbou, daj preč, to je chyba. Má to byť
    // v béžovej farbe.“): variant 616 sa v admine prestavuje z „Diamond Farba kože : Šedá“ (558) na „… : Béžová“ (561).
    // Fotka je tá istá vzorka béžovej kože (= sw-bezova.jpg webu); „seda“ ostáva len ako prechod, kým admin hovorí „Šedá“.
    "boxprodukt-farba-bezova": { diamond: "boxprodukt-farba-bezova.jpg" },
    "boxprodukt-farba-seda": { diamond: "boxprodukt-farba-bezova.jpg" },
  },
};
