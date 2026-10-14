// Texty a obrázky typu „vzorky“ (vzorkovník 637). VLASTNÍK: T5.1 (14. 10. 2026). Konfigurátor stavia
// vzorky-produkt.js podľa návrhu navrhy/vzorkovnik.html (opravený 14. 10. podľa rozhodnutia.md „Doplnené ~01:50“).
// Typ je v registri (produkty.js) a zapína ho len vydanie (ZAPNUTE_TYPY); do vydania len ?novy=vyvoj.
//
// Pravidlá (rozhodnutia.md, kontrakt §11): každá vzorka = vratná záloha (cena z príplatku „Áno“ v Shoptete, nikdy
// natvrdo, vždy s cenou); objednať sa dá presne to, čo dnes živý widget (assets/js/vzorky-konfigurator:
// manifest orderable + select vo formulári; z druhej vrstvy dnes len LUX-10, ostatné Lux = „len náhľad“).
// Názvy vzoriek berie modul doslovne zo živej stránky (popis parametra), nie odtiaľto.
//
// Tvar (texty sú len SK, CZ zatiaľ nie je v registri):
//   TYP.texty.vzorky.serie   { <kľúč série z manifestu>: { nm, ey, pod, info?, skupiny: [{ nadpis, idcka }] } }
//                            idcka = kódy vzoriek (data-parameter-name živého selectu, napr. „D-3“), nie ID parametrov.
//                            Vzorka, ktorá v skupinách nie je, sa pridá do poslednej skupiny série (nič sa nestratí).
//   TYP.texty.vzorky.*       texty hlavičky, ceny, krokov, zoznamu, súhrnu, tlačidla a lišty
export const TYP = {
  texty: {
    // štítok nad nadpisom (kroky.js / cena.js na vzorkovníku nebežia; pre istotu rovnaký tvar ako ostatné typy)
    cena: { typ: "Vzorkovník", zaSet: "vratná záloha" },
    vzorky: {
      typ: "Vzorkovník",
      // nadpis len vizuálne (živý H1 ostáva v DOM, plan.md §2.5)
      nazov: ["Vzorky farieb", "a prešívania"],
      cena: {
        stitok: "Každá vzorka",
        zaloha: "Vratná záloha",
        za: "vrátime ju po obdržaní vzoriek späť",
        infoAria: "Čo je vratná záloha",
        // doslovne živý popis parametra (Vratná záloha 5 € …); suma = cena príplatku „Áno“ zo Shoptetu
        info: (cena) => "Vratná záloha " + cena + " (vrátime po obdržaní vzoriek späť).",
      },
      vratenie: {
        nadpis: "Zálohu dostanete späť",
        text: "Na účet, alebo jej hodnotu odpočítame z objednávky",
        go: "Ako na to",
        // rozbalený popis, kým pod konfigurátorom nie je sekcia o vrátení (živý widget, vykanie)
        kroky: ["Vyplníte formulár na odstúpenie od zmluvy", "Vzorky nám pošlete späť"],
        zaver: "Zálohu Vám vrátime na účet, alebo jej hodnotu odpočítame z objednávky.",
        odkaz: "Formulár nájdete tu",
        url: "/moja-objednavka/",
      },
      postup: (z) => "Vaše vzorky v " + z + " krokoch",
      krokNz: (n, z) => "Krok " + n + " z " + z,
      ti: "Prosím, vyberte vzorky",
      zmenit: "Zmeniť",
      dalej: "Pokračujte ďalej",
      kSuhrnu: "Pokračujte k súhrnu",
      chyba: "Vyberte, prosím, aspoň jednu vzorku.",
      bezVzorky: "Bez vzorky z tejto série",
      // tvary podľa počtu: 1 vzorka, 2–4 vzorky, 5+ vzoriek
      tvar: ["vzorka", "vzorky", "vzoriek"],
      naVyber: "na výber",
      vybrane: "Vybrané: ",
      vybranych: "Vybraných ",
      // postup nad krokmi: počet vybraných vzoriek (žiadna séria nie je povinná, preto nikdy „Všetko vybrané“)
      stavNula: "Zatiaľ žiadna vzorka",
      stav: (n, slovo) => (n === 1 ? "Vybraná 1 " + slovo : n <= 4 ? "Vybrané " + n + " " + slovo : "Vybraných " + n + " " + slovo),
      nahladTag: "Len náhľad",
      nahladSuffix: " — len náhľad, neposiela sa",
      nahladSkupina: "Len náhľad, neposiela sa",
      objednanieSkupina: "Na objednanie",
      // jedna objednateľná vzorka v sérii s náhľadmi (dnes Lux 10): „Posielame vzorku Lux 10. …“
      nahladPozn: (posielame) =>
        (posielame ? "Posielame vzorku " + posielame + ". " : "") + "Ostatné farby druhej vrstvy sú len náhľad.",
      ukazka: "Vyberte vzorku",
      vyber: {
        nadpis: "Vybrané vzorky",
        prazdne: "Zatiaľ žiadna. Kliknite na vzorky v krokoch vyššie.",
        odobrat: "Odobrať vzorku ",
      },
      spolu: "Spolu",
      pozn: (n, cena) =>
        (n ? n + " × " + cena : cena + " za vzorku") + " · vratná záloha · poštovné uvidíte v košíku",
      vyberte: "Vyberte vzorky",
      vlozte: "Vložte do košíka",
      lista: (n, slovo, cena) => (n ? n + " " + slovo + " · vratná záloha" : "Vzorkovník · " + cena + " za vzorku"),
      recenzie: ["recenzia", "recenzie", "recenzií"],
      naGoogle: "na Google",
      hodnotenie: "Hodnotenie",
      z5: "z 5",
      serie: {
        diamond: {
          nm: "Diamond Line",
          pod: "Kosoštvorcové prešívanie. Kliknutím vzorku pridáte, ďalším kliknutím ju odoberiete.",
          skupiny: [
            { nadpis: "Čierna s farebným prešívaním", idcka: ["D-1", "D-2", "D-3", "D-4", "D-5", "D-6", "D-7", "D-8", "D-9"] },
            { nadpis: "Jednofarebné", idcka: ["D-10", "D-11", "D-12", "D-13", "D-14", "D-15", "D-16", "D-17", "D-18"] },
          ],
        },
        stripe: {
          nm: "Stripe Line",
          pod: "Prešívanie vo vodorovných pruhoch. Vyberte ľubovoľný počet vzoriek.",
          skupiny: [
            { nadpis: "Čierna s prešívaním", idcka: ["S-1", "S-2", "S-3"] },
            { nadpis: "Jednofarebné", idcka: ["S-4", "S-5", "S-6", "S-7", "S-8"] },
          ],
        },
        hexa: {
          nm: "Hexa Line",
          pod: "Prešívanie do šesťuholníkov.",
          skupiny: [{ nadpis: "Čierna s farebným prešívaním", idcka: ["H-1", "H-2", "H-3"] }],
        },
        second: {
          nm: "Druhá vrstva Lux",
          pod: "Odnímateľná vrstva navrchu dvojvrstvových autokobercov. Najlepšie vyzerá v tóne koberca — k čiernej Lux 10, k béžovej 12, k hnedej 11.",
          info: "Druhá vrstva sa kladie na prešívanú vrstvu tam, kde sa šliape. Zachytí vodu, sneh aj blato a dá sa vybrať a umyť aj vapkou.",
          infoNadpis: "Druhá vrstva",
          // skupiny sa skladajú podľa živého widgetu: objednateľné / len náhľad
          skupiny: null,
        },
      },
    },
  },
  obrazky: {},
};
