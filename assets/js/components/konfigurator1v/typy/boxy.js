// Texty a obrázky typu „boxy“ (box do kufra 616). VLASTNÍK: worker boxy (T3.2). Tvar a pravidlá: typy/jedno.js.
// Texty zo schváleného návrhu boxy.html (navrh-boxy.md §3–4). Kroky (produkty.js TYPY.boxy): JEDNA karta „Vaše boxy do
// kufra“ = živý krok Farba (Michal 23. 10. 2026: „všetko na jednom mieste“, nič sa neotvára); farbu, počet a veľkosti
// v nej postaví boxy-produkt.js (texty: boxyProdukt nižšie), živé kroky Počet a Veľkosť sú len skryté nosiče POST.
// D3 (rozhodnutia.md): nič o skladovosti ani o lehote dodania boxu.
export const TYP = {
  texty: {
    kroky: {
      // jedna karta: postup sa na boxe neukazuje (CSS), text len pre úplnosť (bez „v 1 krokoch“)
      postup: () => "Vaše boxy do kufra",
      kroky: {
        // zhrnutie zbalenej karty (data-lcd1v-vyber) píše boxy-produkt.js: „Čierna / béžové šitie · 2 boxy · S + L“;
        // chybové vety sú pri sekciách (boxyProdukt.chyby), nie pod kartou. pod a chyba = null: základ typy/jedno.js
        // („Po výbere uvidíte materiál zblízka.“, „… farbu autokobercov.“) sa na boxe nededí
        farba: {
          nm: "Vaše boxy do kufra",
          ti: "Prosím, vyberte si farbu, počet a veľkosť boxov",
          pod: null,
          chyba: null,
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
      // sekcie jednej karty (Michal 23. 10. 2026): farba hore, počet, pre každý box v počte veľkosť
      sekcie: {
        farba: "Farba boxov",
        farbaEm: "platí pre všetky boxy",
        pocet: "Počet boxov",
        velkost: (i, n) => (n > 1 ? "Veľkosť " + i + ". boxu" : "Veľkosť boxu"),
      },
      // vety pri sekcii, ktorá chýba (stráž košíka a „Pokračujte k súhrnu“)
      chyby: {
        farba: "Vyberte, prosím, farbu boxov.",
        velkost: (i, n) => "Vyberte, prosím, veľkosť " + (n > 1 ? i + ". boxu" : "boxu") + ".",
      },
      // riadok „Spolu“ v karte na telefóne = kópia súhrnu pod kartou (cena.js), žiadny vlastný výpočet
      spolu: "Spolu",
      // štítok náhľadu materiálu (farbu slovami ukazuje riadok vybranaFarba nad ním)
      nahlad: "Diamond Line",
      // krok 1: pod vzorkami vybraná farba slovami „Vybraná farba: Čierna koža, béžové šitie“ (kroky.js popisFarby)
      vybranaFarba: "Vybraná farba:",
      // počet: kompaktný segment [1 box][2 boxy][3 boxy] bez fotiek (Michal 23. 10. 2026) — názov a pod ním cena „od“
      // zo živých príplatkov; vy = zhrnutie zbalenej karty. ben a alt sa v segmente nepoužívajú (fotky počtu berie
      // ponuka setu, komplet-ponuka.js)
      pocet: {
        1: { nm: "1 box", ben: "Na nákup a drobnosti, ktoré by sa inak v kufri kotúľali.", alt: "Jeden box v kufri", vy: "1 box" },
        2: { nm: "2 boxy", ben: "Dva vedľa seba — miesto aj na väčší nákup.", alt: "Dva boxy v kufri", vy: "2 boxy" },
        3: { nm: "3 boxy", ben: "Celý kufor rozdelený, každá vec má svoje miesto.", alt: "Tri boxy v kufri", vy: "3 boxy" },
      },
      skupinaPocet: "Počet boxov",
      od: "od",
      // veľkosti (karty s kresbou boxu; aria-label karty „2. box: L, 54 × 32 × 30 cm“)
      box: (n) => n + ". box",
      vyberteVelkost: "vyberte veľkosť",
      tipB: "Tip:",
      tip: " zmerajte šírku miesta v kufri. Boxy vedľa seba = súčet šírok.",
      // farby kresby boxu v kroku 3: mapa je v box-kresba.js FARBY_KRESBY (spoločná s oknom boxov na autokobercoch,
      // Michal 18. 10. 2026)
    },
    // Ponuka setu ako skrytá karta bez čísla hneď pod kartou „Vaše boxy do kufra“ (komplet-ponuka.js; ukáže sa po farbe pri
    // 1–2 boxoch, sama sa otvorí pri „Pokračujte k súhrnu“ s úplným výberom — Michal 23. 10. 2026, variant C). Len pri
    // 1 alebo 2 boxoch (set má najviac 2). d = { pocet, od (veľkosti ešte
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
