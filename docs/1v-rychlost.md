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
- Rozpis 598 ?novy=1 do konca luxuryCar.js (37,4 s, `scratchpad/cls/predbundlom.mjs`): spolu 5,9 MB — obrázky starého
  Popisu a bannerov 3,7 MB (four.jpg 430 kB, Posuvka-after1/before1 695 kB, craftman.png 321 kB, poster2.jpg 307 kB,
  first/two.jpg 526 kB, lazers.jpg 201 kB, j1–j8 …), Google Tag Manager 704 kB (gtag G-2TH0ZK5HF4 2× po 194 kB),
  skripty Shoptetu 490 kB, písma 372 kB, CSS 236 kB, náš bundel 306 kB. Konfigurátor je použiteľný ~2,5 s po bundli.
  Po bundli sa sťahuje ďalších 1,6 MB obrázkov — konfigurátor už vtedy beží. Väčšinu vkladá starý konfigurátor
  (`components/productPage.js`: bannery vzorov diamont/hesaline/stripe-line 306 kB, fotky farieb kože v `.options-wrap`,
  `.box-config`, `.upsale-Banner`, kufor base-p/full-p…), pod 1V sú skryté (`scratchpad/cls/skryte.mjs`). Pri spustení
  (alebo so súhlasom meniť starý kód teraz): pod 1V ich nevkladať / `loading="lazy"`. Teraz nie — Michal 25. 10.: starý
  kód produktov nemeniť; čas do použiteľného konfigurátora to aj tak neskracuje (beží ~2,5 s po bundli).
  Po spustení (25. 10. 2026 večer): obrázky, ktoré 1V nikdy neukáže (bannery vzorov, volant Layer, rady rozloženia,
  živé karty kufra/boxov base-p/full-p/empty-trunk1/boxy), dostanú pod 1V `loading="lazy"` (`components/creatButtons.js`
  `odlozenyObrazok`, tá istá brána ako `initKonfigurator1v`, jadro sa nemení) -> nestiahnu sa: 598/601 −679 kB, 619/628 −313 kB, 616 bez
  zmeny (sieť CDP, telefón 412 px). Pri zložení 1V sa po zobrazení stiahnu samé; `?novy=0` bez zmeny. Fotky farieb
  (`.options-wrap`, `.box-config`) ostávajú — 1V ich ukazuje v kroku Farba a v okne boxov.
- Hlavné vlákno spolu +3 až +16 %: sekcie obsahu sa oživujú postupne v nečinnosti (kvôli polohe pri reload), A ich
  bez posunu neoživí vôbec. TBT (blokovanie) je pritom nižší na 4 zo 6.
- 637: obsah vzorkovníka prichádza skôr, preto sa jeho obrázky stihnú stiahnuť v okne merania (+0,43 MB).
- CLS 0,25 na Classic / Premium / box: prvý snímok 1V posunul hlavnú fotku (4 px) a zväčšil ju (8 px), lebo rám 1 px
  nahradil starý 5 px až s bundlom. Opravené v `ebada7d` (`_lcd1v-galeria.scss`: rám 5 px priehľadný + linka vnútorným
  tieňom): Premium telefón posun 0,54 → 0,09; zvyšok 0,09 = skrytie starého tlačidla košíka (pod hranicou 0,1).

### WebP aj pre kus 1 z Popisu (25. 10. 2026 v noci)

Regresia po kroku 2 spustenia: kus 1 v poli Popis je postavený `--bez-webp` (limit poľa, TinyMCE), takže na
598/601/619/628/616 (a ich vzoroch) sa jeho fotky sťahovali ako plné JPG — WebP mal len kus 2 z CDN. Admin sa nemení.

- **Riešenie:** `build-admin-html.mjs` zapíše do bundla mapu obalov kusu 1 (`konfigurator1v/obsah-webp-mapa.js`,
  generovaná, `--check` ju porovná so src; 5,6 kB, v bundli +5,5 kB / +1,3 kB gzip): `data-lcd-v` kusu `--bez-webp`
  a pre každú obalenú fotku meno JPG, poradie medzi `<img>` s tým istým `src`, šírky WebP, index `sizes`, `media`.
  `obsah-webp.js` (z `obsah.js`, cesta a) pri umiestnení kusu z Popisu — synchrónne, kým je koreň ešte `display:none`
  a lazy fotky sa nesťahujú — obalí tie isté `<img>` do toho istého `<picture>` ako dist (v DOM: `type, srcset, sizes
  [, media]`, `<img>` sa len presunie). Build pri každom behu overí, že mapa použitá na kus bez obalov dá presne dist.
  Nič sa neobalí pri inej verzii kusu (`data-lcd-v`), bez mapy (vzorky, kamióny), bez natívneho `loading="lazy"`
  (Safari < 15.4 sťahuje JPG už od parsovania) ani pri už stiahnutej fotke. Stav `__lcd1v.obsah.webp`.
- **Zvážené a zamietnuté:** mapa ako súbor na CDN (požiadavka navyše a čakanie na sieť pri umiestnení — fotky by sa
  medzitým mohli začať sťahovať ako JPG, alebo by sa umiestnenie oneskorilo); obaly priamo v Popise (admin sa nemení,
  limit 45 000 zn., TinyMCE by `<picture>` mohol prerobiť); `srcset` dopočítať v JS z mien súborov a pravidiel
  (duplicita pravidiel `OBRAZKY_1V`, ktoré závisia od CSS rozloženia — mapa z buildu je presne to, čo má dist);
  stiahnuť kus 1 z CDN namiesto Popisu (+35–50 kB HTML a obsah by čakal na sieť).
- **Meranie** (25. 10. 2026 v noci, `scratchpad/webp-popis/meraj-obrazky.mjs`: živá SK stránka bez parametra, Popis =
  kus 1 `--bez-webp`, kus 2 z CDN `d20c8e2`, bundle nahradený buildom pred = `d4ac44d` / po = tento commit; pomalý
  telefón RTT 562,5 ms, 1,47 Mbit/s, CPU 4×, 412 px, merače blokované; po umiestnení obsahu posun dole po 80 % okna
  každých 700 ms až po koniec a čakanie na dobehnutie obrázkov; sieť CDP, skutočné bajty; mediány 3 behov, všetky 3
  behy zhodné na kB):

| stránka | obrázky obsahu 1V | z toho kus 1 (Popis) | JPG obsahu | všetky obrázky stránky | prenos spolu |
|---|---|---|---|---|---|
| 601 dvoj | 1 593 → 741 kB (−852 kB, −53 %) | 1 079 → 226 kB (−79 %, 5 fotiek, všetky WebP) | 1 571 → 492 kB | 5 509 → 4 656 kB | 7 917 → 7 070 kB |
| 619 Classic | 1 225 → 483 kB (−742 kB, −61 %) | 1 214 → 472 kB (−61 %) | 1 179 → 178 kB | 4 136 → 3 395 kB | 6 566 → 5 830 kB |

  Zvyšné JPG: 619 `classic-d7.jpg` 178 kB (fotka farieb, ktorú build neobalí — rovnako v dist, pozri Otvorené), 601
  `dvoj-koniec.jpg` (CSS pozadie) a `dvoj-farby-diamond.jpg` (prepína JS) v kuse 2.
- **Testy:** `test-1v-obsah --miesto popis-cdn` kontroluje navyše, že kus 1 z Popisu má po umiestnení tie isté `<picture>`
  ako dist (počet, poradie, `srcset`, `sizes`, `media`, `src`, `display:contents`), `__lcd1v.obsah.webp` = počet obalov
  dist, a po prejdení obsahu sa nestiahol JPG fotky, ktorú má dist pri danej šírke ako WebP (očakávania z dist; požiadavky
  počas kontrol skupín sa nerátajú — okno na fotky sťahuje plný JPG naschvál). Na pôvodnom kóde zlyhá (0/15, 0/29
  `<picture>`, 619 @390 stiahnuté `classic-cmp-us.jpg`, `classic-cmp-prem.jpg`).
  Výsledky: `build-admin-html --check` OK, `--test` OK (+5 kontrol mapy); `test-1v-obsah --miesto popis-cdn` 598, 601,
  616, 619, 628, 637, 640 × 390/1280 (základ, bez flagu, `?novy=1` s polohou, výpadok CDN) 70/70 OK — 601 a 640 na druhý
  beh (prvý skončil „Chrome sa nespustil“ pri zaťaženom stroji, nie zlyhaním kontroly); `test-konfigurator-1v --krok
  brana --produkt all` 30/30 (19 opakovaných samostatne po „Chrome sa nespustil“ / časovom limite pod záťažou, všetky
  OK); `--stary --krok brana,nulova-zmena --produkt all` 60/60 OK.
