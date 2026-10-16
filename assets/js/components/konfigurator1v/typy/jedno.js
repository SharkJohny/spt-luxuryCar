// Texty a obrázky typu „jedno“ (jednovrstvové 598 Diamond, 610 Hexa, 613 Stripe). VLASTNÍK: worker jedno-vzory
// (T1.1); založené jadrom T0.1 s dnešnými textami 598 (návrh v26), takže 598 sa nemení.
// Je to aj ZÁKLAD ostatných typov: produkty.js zlúči jedno + <typ> (typ prepíše len to, čo potrebuje; null = nemať).
//
// Tvar (rovnaký vo všetkých typy/<typ>.js):
//   TYP.texty.kroky   { postup(z), kroky: { <meno kroku>: { nm, ti, vy, pod, chyba, pozn, dalej } } }   -> kroky.js
//   TYP.texty.cena    { typ (štítok nad H1), lista? (popis lepivej lišty) } — vetu pri cene rámik nemá -> cena.js
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
        vzor: { nm: "Vzor prešívania", ti: "Prosím, vyberte si vzor prešívania", vy: "", pod: null, dalej: "Potvrďte vzor" }, // vy: názov vzoru píše kroky.js z aktívnej dlaždice (598 Diamond, 610 Hexa, 613 Stripe) — nikdy natvrdo Diamond
        auto: { nm: "Vaše auto", ti: "Prosím, vyberte si svoje auto", vy: "Značka, model a rok výroby", chyba: "Doplňte, prosím, údaje označené červenou.", pozn: "Šablóny máme pre viac než 1000 modelov osobných áut." },
        farba: { nm: "Farba koberca", ti: "Prosím, vyberte si farbu 1. vrstvy", vy: "", pod: "Po výbere uvidíte materiál zblízka.", chyba: "Vyberte, prosím, farbu koberca." },
        rozlozenie: { nm: "Rozloženie", ti: "Prosím, vyberte si rozloženie kobercov", vy: "Podľa počtu radov vo Vašom aute", chyba: "Vyberte, prosím, rozloženie kobercov." },
        kufor: { nm: "Rohož do kufra", ti: "Prosím, vyberte si rohož do kufra", vy: "Bez rohože do kufra" },
        boxy: { nm: "Boxy do kufra", ti: "Prosím, vyberte si boxy do kufra", vy: "Bez boxov", dalej: "Pokračujte k súhrnu" },
      },
    },
    cena: { typ: "Jednovrstvové" },
    // Ponuka druhej vrstvy po kroku Farba (druha-vrstva.js; Michal 14. 10. 2026: skrytá karta BEZ čísla, nepovinná).
    // Texty zo schváleného návrhu druha-vrstva.html (krok „Druhá vrstva“, dlaždica, Nie, správa pri prenose); podnadpis =
    // dvojvrstvove.html krok 4 (#v3b), rovnaký ako farba2.js. Cena „+ N €“ sa ráta živo (nikdy natvrdo).
    // Michal 15. 10. 2026: v dlaždici zlaté tlačidlo „Áno“ (ano.tl; nadpis dlaždice už nie je „Áno, chcem“) a vrstvy vždy
    // pomenované: „prvá prešívaná vrstva“ / „druhá vrstva“, nikdy len „prešívaná vrstva“.
    // Michal 15. 10. 2026 („strojové, chladné“): nadpis „Prosíte si aj druhú odnímateľnú vrstvu?“ a podnadpis ľudsky — len fakty
    // zo živej stránky a schválených návrhov (zachytí vodu, sneh, blato aj soľ; dá sa vybrať a umyť aj vapkou; prvá
    // prešívaná vrstva ostane čistá), žiadne nové čísla ani sľuby.
    druha: {
      nm: "Druhá vrstva",
      ti: "Prosíte si aj druhú odnímateľnú vrstvu?",
      vy: "Áno alebo nie",
      vyNie: "Bez druhej vrstvy",
      // Michal 16. 10. 2026 (telefón): podnadpis najviac 1,5 vety — presne táto veta.
      pod: "Vodu, sneh, blato aj soľ z topánok zachytí druhá vrstva – jednoducho ju vyberiete, umyjete aj vapkou a prvá prešívaná vrstva ostane čistá.",
      naj: "★ Odporúčame",
      ano: {
        nm: "Dvojvrstvové koberce",
        po: "Prvá prešívaná + druhá vrstva",
        ben: "Vzor, auto aj farba Vám ostanú.",
        tl: "Áno, chcem druhú vrstvu",
        // popis videa pre čítačky obrazovky (aria-label na <video>; video je bez zvuku a ovládania)
        alt: "Video: druhá vrstva zachytí vodu, vyberiete ju, umyjete vapkou a prvá prešívaná vrstva ostane čistá",
      },
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
    // dlaždica „Áno“ ponuky druhej vrstvy: od 16. 10. 2026 krátke VIDEO namiesto fotky (Michal vybral č. 5 „vapka“ — najviac
    // sa mu páči — a č. 1 „príbeh“), striedajú sa dookola: 1 -> 2 -> 1 … (druha-vrstva.js). Kľúč = .mp4 (H.264); vedľa
    // neho rovnaké meno .webm (VP9, menšie — Chrome/Firefox/Android) a <meno>-poster.jpg (prvý snímok, 576 × 720, 4:5).
    // Jedno video pre všetky vzory. Fotka druha-vrstva-lux.jpg (15. 10. 2026) ostáva na CDN, kód ju už nepoužíva.
    "druha-video-1": { diamond: "druha-video-vapka.mp4" },
    "druha-video-2": { diamond: "druha-video-pribeh.mp4" },
  },
};
