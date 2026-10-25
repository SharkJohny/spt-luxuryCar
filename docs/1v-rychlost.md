# Rýchlosť 1V produktov (nový vzhľad za `?novy=1`)

Michal 25. 10. 2026 (nočný beh): „všetky produkty teraz treba optimalizovať rýchlosť načítania, aby sa to otváralo rýchlo
aj na starších zariadeniach, tak isto ako sme optimalizovali homepage — ale tie nové, ktoré sú stále ako testovacie“;
poradie: „najskôr optimalizácie na rôzne zariadenia… potom testovať na spoločnom zariadení a následne zrýchľovať,
aby sme o žiadne zariadenie neprišli“.

## Hranice

- Mení sa len cesta 1V (`body.lcd-1v`, brána `konfigurator1v/produkty.js`). Bez `?novy=1` sa nesmie zmeniť nič
  (test: `test-1v-obsah.mjs --len bez` = 0 požiadaviek na obsah, `test-konfigurator-1v.mjs` bez `--novy`).
- Admin (Záhlavie/Zápätie, bannery) sa nemení — okrem prepnutia sha po zelených testoch (trvalý súhlas).
- Rozdelenie práce so session kamióny (25. 10. 2026): kamióny = minifikácia `luxuryCar.css` v CI, vyňatie zriedkavých
  častí z bundla (`main.js`, `production.yml`, `package.json`), kontrola rozloženia na ~16 rozmeroch, meranie pomalého
  telefónu; táto session = kód `konfigurator1v/*` a obsah `admin-html/src/p1v-*`.
- Žiadne „schovaj a nahraď“ (pravidlo web bez prekrývania), podpis Shoptetu v päte ostáva, ceny len zo živých dát.

## Meranie

Nástroj z titulky: `Desktop/LCD/web/perf-nastroje/ab-harness` (NAVOD.txt) — `ab.mjs` (Lighthouse mobil, simulované
škrtenie 150 ms RTT / 1,6 Mbit/s / CPU 4×, A = živý web, B = build z repa), `cas-konfigurator.mjs` (DevTools škrtenie
RTT 562,5 ms / 1,47 Mbit/s / CPU 4×, čas do použiteľného konfigurátora), `rozlozenie.mjs` (prekryvy a pretečenia na
rozmeroch). Stránky: 598 (jedno), 601 (dvoj), 628 (Premium), 619 (Classic), 616 (box), 637 (vzorky), 640 (kamióny).

## Kde sa čas stráca (mapa 25. 10. 2026)

1. Spoločné: blokujúce `luxuryCar.css` (~1,2 MB raw, nemimifikované) a jeden bundel `luxuryCar.js` (~1,17 MB) na každej
   stránke; `data.json` sa sťahuje až po spustení bundla (reťaz HTML → CSS → JS → data.json). → kamióny (CSS, bundel).
2. Obsah pod konfigurátorom: fetch až po postavení konfigurátora (`obsah.js`, posledný modul), kus 1 čaká na kus 2
   (`Promise.all`), všetky moduly A–D sa spustia naraz pri vložení.
3. Susedné stránky kvôli cenám: celé HTML produktov + `DOMParser` na hlavnom vlákne pri prvej návšteve
   (`kufor-produkt.js`, `komplet-ponuka.js`, `obsah-cisla.js` → `ceny-ine.js`).
4. Obrázky obsahu: 104 JPG v `assets/img/1v/obsah` (12 MB), bez WebP a `srcset`; dlaždice konfigurátora bez `loading`.
5. Časovače a široké MutationObservery (`configurator-enhance.js` 41× po 600 ms, `cena.js` 1 s, `productPage.js`).

## Plán (v tomto poradí)

1. Rozloženie na zariadeniach — nálezy z kontroly ~16 rozmerov opraviť v 1V súboroch.
2. Základné meranie (pred) na pomalom telefóne pre 7 stránok vyššie.
3. Zrýchlenie 1V (každý krok A/B meraním, testy konfigurátora a obsahu zelené):
   - obsah: fetch hneď na začiatku 1V, kus 1 vložiť bez čakania na kus 2, moduly A–D spúšťať pri priblížení sekcie;
   - susedné stránky kvôli cenám až v nečinnosti / pri priblížení prvku, ktorý cenu ukazuje;
   - obrázky obsahu: WebP + `srcset` (nové mená súborov, staré sa neprepisujú), `sizes`;
   - 1V: časovače a observery len kým treba (odpojiť po hotovom kroku), bez zásahu do starého vzhľadu.
4. Merania po, snímky, prepnutie SK, zápis výsledkov sem.

## Poznámky k commitom (revízia 25. 10. 2026)

- **c5edd1f (WebP obsahu) nesie aj `luxuryCar.css` pre 0293264:** 0293264 zmenil partial `_lcd1v-kufor.scss` (rezervovaný
  riadok ceny dlaždíc, `data-lcd1v-ceny="caka"`), ale `luxuryCar.css` sa vložil až v c5edd1f (spolu s `picture{display:contents}`
  z `_lcd1v-obsah.scss`). Návrat WebP preto **nie holým `git revert c5edd1f`** (zobral by aj CSS kufra a `vloz-lcd-css.py --check`
  by nesedel), ale: vrátiť súbory WebP zmeny (`tools/build-admin-html.mjs` obrazky1v / `admin-html/dist`, pravidlo 2c
  v `_lcd1v-obsah.scss`), spustiť `python tools/vloz-lcd-css.py` a `node tools/build-admin-html.mjs`, potom oba `--check`.
- **Revízia F2 (25. 10. 2026):** okno na fotky ukáže hneď náhľad z galérie a plný JPG podloží po stiahnutí (obsah-d.js);
  výrez susednej stránky len pri formulári s `id="product-detail-form"` (susedne.js); ponuka setu sťahuje 598 hneď
  a pri „Pokračujte ďalej“ čaká na ceny najviac 1,5 s (komplet-ponuka.js); podnadpis kroku 1 rohože má rezervované
  miesto (kufor-produkt.js); v tlači je `.rv` obsahu viditeľné (`_lcd1v-obsah.scss` 6 c2).

- **Stĺpec bez skokov + rozloženie (4abb7df, 25. 10. 2026):** stĺpec konfigurátora má pod kostrou Shoptetu
  (`.p-info-wrapper:not(.active)`, 2 000 px) hneď prirodzenú výšku, riadok hodnotenia drží miesto zástupnými prvkami
  (`cena.js zastupHodn`), starý FAQ v stĺpci je skrytý, kým sa vkladá obsah (`staryFaqPocasObsahu`), rezerva pre
  „Pokračujte ďalej“ a poznámku karty auta (`_lcd1v-kroky.scss`, text poznámky skopírovaný z `typy/jedno.js` — pri
  zmene textu zmeniť aj tam), názov rohože/boxu a „Spolu“ v mikroúlohe. Posun stĺpca do 5 s (pomalý telefón, CPU 4×,
  6 produktov × 390/1280): spolu 0,319 → 0. Opravy z kontroly rozloženia (session kamióny, 6 typov × 9 rozmerov):
  G6 Deväť vecí na nízkych PC oknách, G1/G2/G3 plochy na ťuknutie (zadné body rezu sa predtým nedali ťuknúť), G7 vodoznak.
- **Reload / Späť na PC bez animácie (obsah.js `obnovaBezAnimacie`):** web má `html{scroll-behavior:smooth}` a Chrome
  obnovu polohy animuje; posun počas animácie (ručné ukotvenie — na PC jediné, posun.js) ju zastaví — reload pri FAQ
  na 628 @1280 skončil pod záťažou o ~10 000 px vyššie (1–3 z 5 behov, aj na a7c5caf). Pri reload/back_forward nad
  768 px dostane html inline `scroll-behavior:auto` do hotového obsahu + 2,5 s (poistka 20 s): 4 stránky @1280 naraz
  2× po sebe 8/8 OK. Telefón bez zmeny — tam obnova s animáciou prechádzala a bez nej narazila na ešte krátku stránku
  (598 @390 −4 000 px). Zavrhnuté: vrátiť polohu zo sessionStorage po vložení obsahu (−130 až −1 070 px na oboch šírkach).
- **Test `vzorky-0` (02725c8):** klikal „Pokračujte“ po 250 ms, počas plynulého posunu k ďalšiemu kroku, a trafil
  vzorku pod tlačidlom (padalo aj naživo). Teraz čaká na ďalší aktívny krok a 300 ms pokoja okna.

## Otvorené

- `classic-d7` sa na Classic sťahuje 2× — WebP v galérii a JPG vo farbách (iná sekcia, iná adresa).
- 51 z 205 vygenerovaných WebP v `assets/img/1v/obsah` žiadny kus `admin-html/dist` nepoužíva — fotky, ktoré build
  neobalí: pozadia z CSS (`boxy-end`, `dvoj-koniec`) a fotky, ktoré prepína JS (`boxy-farba-*`, `dvoj-farby-*`, pred a po
  `*-pp-*`, `boxy-pred`/`boxy-po`). Buď ich zapojiť, alebo negenerovať.
- WebP nemajú odtlačok zdroja: po výmene JPG s tým istým menom ostane starý WebP a `obrazky-1v-webp.py --check` to
  nezistí (treba hash JPG v mene alebo v zozname vedľa WebP).

## Výsledky

A/B 25. 10. 2026 (ab-harness `ab.mjs`, Lighthouse simulate 150 ms / 1,6 Mbit/s / CPU 4×, 3 behy + zahriatie, mediány;
A = živé SK `73fe86b` bez preloadu hero, B = `901f460` z repa; ab-harness opravený: kopíruje `admin-html` a
`assets/img/1v`, mapuje `assets/v/<sha>/{js,css,html}` na build):

| stránka ?novy=1 | prenos | obrázky | požiadavky | TBT | CLS | Speed Index | LCP |
|---|---|---|---|---|---|---|---|
| 598 jedno | 11,1 → 9,0 MB (−18 %) | −33 % | 201 → 181 | 737 → 780 (šum) | 0,047 → 0,020 | 12,5 → 13,0 s (šum) | 30,3 → 31,1 s (šum) |
| 601 dvoj | 13,1 → 10,0 MB (−23 %) | −29 % | 220 → 199 | 947 → 852 | 0,038 → 0,020 | 12,0 → 13,5 s | 34,6 → 35,0 s (šum) |
| 619 Classic | 10,1 → 7,3 MB (−28 %) | −39 % | 177 → 157 | 475 → 411 | 0,252 = | 12,4 → 11,2 s | 30,2 → 29,0 s (šum) |
| 628 Premium | 11,5 → 8,7 MB (−25 %) | −33 % | 183 → 163 | 473 → 391 | 0,252 = | 13,0 → 11,9 s | 34,0 → 32,9 s (šum) |
| 616 box | 10,0 → 8,0 MB (−20 %) | −36 % | 148 → 128 | 348 → 320 | 0,251 = | 13,3 → 12,7 s | 34,4 → 34,2 s (šum) |
| 637 vzorky | 3,7 → 4,1 MB (+12 %) | +32 % | 119 → 121 | 253 → 262 | 0,021 = | 9,1 → 8,6 s | 20,3 → 20,1 s |

- LCP okolo 30 s je artefakt simulácie Lighthouse (Lantern počíta fotku za bundlom). Skutočné škrtenie v Chrome
  (`scratchpad/cls/lcp.mjs`: RTT 562,5 ms, 1,47 Mbit/s, CPU 4×, telefón 412 px, 25. 10. 2026 večer, `ebada7d`):
  hlavná fotka (LCP) 598 5,1 s · 619 5,6 s · 616 5,7 s · 628 8,6 s · 601 13,5 s; starý vzhľad 598 4,9 s, 601 12,6 s
  (rovnaké). Pomalé je až použitie konfigurátora: luxuryCar.js dobehne o 29–44 s (starý vzhľad 598 37,6 s). Linku mu berú
  obrázky starého Popisu s `loading="eager"` (601: lazers.jpg, dv1–3.jpg do 24–30 s; 598: craftman.png 321 kB do 38 s).
  JS 1V ich zastaviť nevie, beží až po nich. Vyrieši spustenie (nový obsah nahradí Popis) alebo lazy v admine
  (Michal 25. 10.: admin a živé produkty teraz nemeniť).
- Hlavné vlákno spolu +3 až +16 %: sekcie obsahu sa oživujú postupne v nečinnosti (kvôli polohe pri reload), A ich
  bez posunu neoživí vôbec. TBT (blokovanie) je pritom nižší na 4 zo 6.
- 637: obsah vzorkovníka prichádza skôr, preto sa jeho obrázky stihnú stiahnuť v okne merania (+0,43 MB).
- CLS 0,25 na Classic / Premium / box: prvý snímok 1V posunul hlavnú fotku (4 px) a zväčšil ju (8 px), lebo rám 1 px
  nahradil starý 5 px až s bundlom. Opravené v `ebada7d` (`_lcd1v-galeria.scss`: rám 5 px priehľadný + linka vnútorným
  tieňom): Premium telefón posun 0,54 → 0,09; zvyšok 0,09 = skrytie starého tlačidla košíka (pod hranicou 0,1).
