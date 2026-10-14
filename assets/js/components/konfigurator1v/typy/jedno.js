// Texty a obrázky typu „jedno“ (jednovrstvové 598 Diamond, 610 Hexa, 613 Stripe). VLASTNÍK: worker jedno-vzory
// (T1.1); založené jadrom T0.1 s dnešnými textami 598 (návrh v26), takže 598 sa nemení.
// Je to aj ZÁKLAD ostatných typov: produkty.js zlúči jedno + <typ> (typ prepíše len to, čo potrebuje; null = nemať).
//
// Tvar (rovnaký vo všetkých typy/<typ>.js):
//   TYP.texty.kroky   { postup(z), kroky: { <meno kroku>: { nm, ti, vy, pod, chyba, pozn, dalej } } }   -> kroky.js
//   TYP.texty.cena    { typ (štítok nad H1), zaSet (veta pri cene) }                                   -> cena.js
//   TYP.texty.rozlozenie, TYP.texty.kuforBoxy  — voliteľné prepisy textov modulov (kľúče ako v module)
//   TYP.obrazky       { "<kľúč>": { diamond, stripe, hexa } } — súbory v assets/img/1v/; ctx.obrazokVzoru(kľúč)
//                     vráti súbor vzoru produktu, inak diamond. Zoznam je explicitný (žiadne 404).
// Zákaznícky text: vykanie, bez „na milimeter“, „vyrábame“, počtu vrstiev, záruky ako argumentu, DragonSkin/Elite/
// Basic, fixačných bodov a „Comfort“ (docs/1v-kontrakt.md §11).
export const TYP = {
  texty: {
    kroky: {
      postup: (z) => "Váš set v " + z + " krokoch",
      kroky: {
        // pod: null — veta návrhu „Všetky tri vzory majú rovnakú cenu.“ dnes neplatí (13. 10. 2026 SK: Diamond 598 = 219 €,
        // Hexa 610 a Stripe 613 = 230 €). Vrátiť až po zjednotení cien v SK admine.
        vzor: { nm: "Vzor prešívania", ti: "Prosím, vyberte vzor prešívania", vy: "", pod: null, dalej: "Potvrďte vzor" }, // vy: názov vzoru píše kroky.js z aktívnej dlaždice (598 Diamond, 610 Hexa, 613 Stripe) — nikdy natvrdo Diamond
        auto: { nm: "Vaše auto", ti: "Prosím, zadajte svoje auto", vy: "Značka, model a rok výroby", chyba: "Doplňte, prosím, údaje označené červenou.", pozn: "Šablóny máme pre viac než 1000 modelov osobných áut." },
        farba: { nm: "Farba koberca", ti: "Prosím, vyberte farbu koberca", vy: "", pod: "Po výbere uvidíte materiál zblízka.", chyba: "Vyberte, prosím, farbu koberca." },
        rozlozenie: { nm: "Rozloženie", ti: "Prosím, vyberte rozloženie kobercov", vy: "Podľa počtu radov vo Vašom aute", chyba: "Vyberte, prosím, rozloženie kobercov." },
        kufor: { nm: "Rohož do kufra", ti: "Prosím, vyberte rohož do kufra", vy: "Bez rohože do kufra" },
        boxy: { nm: "Boxy do kufra", ti: "Prosím, vyberte boxy do kufra", vy: "Bez boxov", dalej: "Pokračujte k súhrnu" },
      },
    },
    cena: { typ: "Jednovrstvové", zaSet: "cena za set na mieru" },
    // Ponuka druhej vrstvy po kroku Farba (druha-vrstva.js; Michal 14. 10. 2026: skrytá karta BEZ čísla, nepovinná).
    // Texty doslovne zo schváleného návrhu druha-vrstva.html (krok „Druhá vrstva“, dlaždice Áno / Nie, správa pri prenose);
    // podnadpis = dvojvrstvove.html krok 4 (#v3b), rovnaký ako farba2.js. Cena „+ N €“ sa ráta živo (nikdy natvrdo).
    druha: {
      nm: "Druhá vrstva",
      ti: "Chcete aj druhú vrstvu?",
      vy: "Áno alebo nie",
      vyNie: "Bez druhej vrstvy",
      pod: "Druhá vrstva sa kladie na prešívanú vrstvu tam, kde sa šliape. Zachytí vodu, sneh aj blato a dá sa vybrať a umyť aj vapkou.",
      naj: "★ Odporúčame",
      ano: { nm: "Áno, chcem", po: "Dvojvrstvové koberce", ben: "Vzor, auto aj farba Vám ostanú.", alt: "Dvojvrstvové autokoberce vo vzore Diamond so šedou jednofarebnou druhou vrstvou" },
      priplatok: "Príplatok",
      nie: { nm: "Nie, ďakujem", pozn: "Pokračujete s doterajším výberom." },
      prenos: "Prenášame Váš výber na dvojvrstvové koberce…",
    },
    // „Poznámka k objednávke“ pod tlačidlom košíka (poznamka.js; návrh jednovrstvove.html .pozn-dole — dvojvrstvové
    // majú v návrhu ten istý placeholder aj vetu, preberajú ich odtiaľto)
    poznamka: {
      nepovinne: "nepovinné",
      ph: "Napríklad: auto má vyhrievané sedadlá v druhom rade…",
      hint: "Netypická výbava, tretí rad na objednávku alebo iné želanie — napíšte to sem.",
    },
  },
  // Fotky v krokoch 4–6 sú Diamond v béžovej (plan.md §2.5: schválený návrh ich pri inom vzore nemení).
  obrazky: {
    "rozlozenie-1": { diamond: "rozlozenie-rad-prvy.jpg" },
    "rozlozenie-2": { diamond: "rozlozenie-rad-vsetky.jpg" },
    "rozlozenie-3": { diamond: "rozlozenie-rad-vsetky.jpg" },
    "kufor-classic": { diamond: "kufor-boxy-classic.jpg" },
    "kufor-premium": { diamond: "kufor-boxy-premium.jpg" },
    "kufor-nie": { diamond: "kufor-boxy-bez-rohoze.jpg" },
    "boxy-1": { diamond: "kufor-boxy-1-box.jpg" },
    "boxy-2": { diamond: "kufor-boxy-2-boxy.jpg" },
    "boxy-0": { diamond: "kufor-boxy-premium.jpg" },
    // dlaždica „Áno“ ponuky druhej vrstvy (Michal 15. 10. 2026): JEDNA reálna fotka pre všetky vzory — Diamond so šedou
    // jednofarebnou druhou vrstvou Lux (fotka schválená v návrhu, dv-hero-1). Nový súbor (spoločné assets/img sa neprepisujú).
    "druha-ano": { diamond: "druha-vrstva-lux.jpg", stripe: "druha-vrstva-lux.jpg", hexa: "druha-vrstva-lux.jpg" },
  },
};
