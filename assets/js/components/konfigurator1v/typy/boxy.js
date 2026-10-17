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
          pod: "Dva rozmery (32 a 30 cm) sú pri všetkých veľkostiach rovnaké, líši sa len šírka. Silueta na každej karte je v skutočnom pomere.",
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
      // krok 1: náhľad farby „Diamond Line — <farba>“
      nahlad: "Diamond Line",
      // krok 2: karty počtu (fotka + názov + podnázov + „od“ cena zo živých príplatkov)
      pocet: {
        1: { nm: "1× box", po: "Praktický organizér", alt: "Jeden box v kufri", vy: "1 box" },
        2: { nm: "2× box", po: "Dvojitá kapacita", alt: "Dva boxy v kufri", vy: "2 boxy" },
        3: { nm: "3× box", po: "Celý kufor v poriadku", alt: "Tri boxy v kufri", vy: "3 boxy" },
      },
      skupinaPocet: "Počet boxov",
      od: "od",
      // krok 3: veľkosti
      box: (n) => n + ". box",
      vyberteVelkost: "vyberte veľkosť",
      tipB: "Tip:",
      tip: " zmerajte šírku miesta v kufri. Pri dvoch alebo troch boxoch vedľa seba sa ich šírky sčítavajú.",
      // banner setu pod cenou (set-banner.js, návrh C, Michal 17. 10. 2026; odkaz na jednovrstvové, čísla zo živých
      // stránok): „Box do kufra už od 99 €, keď ho kúpite spolu s autokobercami pod sedadlá“ + „Box S samostatne 197 €“
      // (prečiarknuté) + „Ušetríte 98 €“ — nikdy „+ 99 €“ (vyzerá ako príplatok k cene hore)
      set: {
        ey: "Výhodnejšie v sete",
        h: "Box do kufra už od",
        kd: "keď ho kúpite spolu s autokobercami pod sedadlá",
        sam: "Box S samostatne",
        us: "Ušetríte",
        stuha: "Zľava", // stuha cez roh banneru: „Zľava −50 %“ = box S v sete vs. samostatne (živo)
        pip: "Box do kufra",
        tag: "Autokoberce pod sedadlá",
        odkaz: "Zostaviť set s autokobercami",
      },
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
    "boxprodukt-farba-seda": { diamond: "boxprodukt-farba-seda.jpg" },
  },
};
