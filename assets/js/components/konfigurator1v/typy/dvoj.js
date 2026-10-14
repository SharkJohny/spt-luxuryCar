// Texty a obrázky typu „dvoj“ (dvojvrstvové 601 Diamond, 604 Hexa, 607 Stripe). VLASTNÍK: worker dvoj (T1.2).
// Tvar a pravidlá: typy/jedno.js (základ — produkty.js zlúči jedno + dvoj, čo tu nie je, platí z jedno: krok auta, rozloženie,
// boxy a „Váš set v N krokoch“ sú rovnaké ako pri jednovrstvových). Texty doslovne z návrhu dvojvrstvove.html
// (navrh-dvojvrstvove.md §3.3–3.8). Krok „Farba 2. vrstvy“ (karta 4) staví farba2.js.
// Zákaznícky text: vykanie, bez „na milimeter“, „vyrábame“, počtu vrstiev materiálu, záruky ako argumentu,
// DragonSkin/Elite/Basic, fixačných bodov a „Comfort“ (docs/1v-kontrakt.md §11).
export const TYP = {
  texty: {
    kroky: {
      kroky: {
        // Krok 1 (N:3834): veta návrhu „Všetky tri vzory majú rovnakú cenu.“ neplatí (SK 13. 10. 2026: Diamond 351 €, Hexa a
        // Stripe 362 €) — vypustená, ostáva len druhá veta.
        vzor: { pod: "Vzor je na prvej vrstve — vidno ho po bokoch aj okolo druhej vrstvy." },
        // Krok 3 (N:3896): počet farieb („N farieb na výber“) dopočíta kroky.js z DOM (601: 18, 604: 3, 607: 8).
        farba: {
          nm: "Farba 1. vrstvy",
          ti: "Prosím, vyberte farbu prvej vrstvy",
          pod: "Prvá vrstva je prešívaný koberec. Po výbere uvidíte materiál zblízka.",
          chyba: "Vyberte, prosím, farbu prvej vrstvy.",
        },
        // Krok 4 (N:3964): podnadpis s „i“ a vysvetlením, mriežku a náhľad dodá farba2.js. Zhrnutie v hlavičke
        // („16 farieb na výber“ / „Lux Color 10“) píše farba2.js cez data-lcd1v-vyber; tu je rovnaký text pre prípad, že ešte nebeží.
        farba2: {
          nm: "Farba 2. vrstvy",
          ti: "Prosím, vyberte farbu druhej vrstvy",
          vy: "16 farieb na výber",
          pod: "Druhá vrstva vyzerá najlepšie v tóne prvej — k čiernej Lux Color 10, k béžovej 12, k hnedej 11.",
          chyba: "Vyberte, prosím, farbu druhej vrstvy.",
        },
      },
    },
    cena: { typ: "Dvojvrstvové", zaSet: "cena za set na mieru" },
    // Krok 6 (N:4073): všetko ako pri jednovrstvových, iné je len vysvetlenie „i“ (#v5 v návrhu).
    kuforBoxy: {
      kufor: {
        vysv: [
          ["Classic", " chráni dno batožinového priestoru. "],
          ["Premium", " kryje dno, boky kufra aj chrbty zadných sedadiel — nič sa nedostane do čalúnenia, keď naložíte niečo mokré alebo špinavé."],
        ],
      },
    },
  },
  // Náhľady vzoru v kroku 1 (dvojvrstvový koberec v aute, návrh dv-vz-*-lux.jpg) sú v CSS typu (_lcd1v-dvoj.scss,
  // assets/img/1v/dvoj-vzor-{diamond,stripe,hexa}.jpg). Fotky krokov 5–6 sú rovnaké ako pri jednovrstvových (typy/jedno.js).
  obrazky: {},
};
