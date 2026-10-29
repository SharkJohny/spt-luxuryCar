# Rýchlosť webu — čo platí pre celý luxuryCar.js / luxuryCar.css (od 25. 10. 2026)

Michal 25. 10. 2026: „optimalizácia a zrýchľovanie stránok, aby sa aj na pomalších zariadeniach všetko rýchlo načítavalo
… aby sme o žiadne zariadenie neprišli“. Zrýchlenie 1V produktov (obsah, obrázky obsahu) má vlastný plán
`docs/1v-rychlost.md` (session Shoptet úpravy); tu sú spoločné pravidlá bundla, CSS a obrázkov.

## 1. Samostatné časti bundla (`functions/lcdCasti.js`)
- Kód, ktorý treba len na jednej stránke, nepatrí do `luxuryCar.js` (ten sa sťahuje a parsuje na **každej** stránke).
- Časť = vlastný vstup (napr. `truck-konfigurator/cast.jsx`), ktorý sa sám zapíše do `window.__lcdCasti[meno]`.
  Bundle ju stiahne cez `nacitajCast(meno)` z tej istej verzie (`LCD_ZAKLAD` = `…/assets/v/<sha>/`), 3 pokusy.
- Nová časť = riadok v `SUBORY` (lcdCasti.js) + ďalší `yarn esbuild` v `.github/workflows/production.yml` + `cp`/`rm`
  v kroku „Verzia do vlastného priečinka“ + `.gitignore` + `tools/test-konfigurator-1v.mjs` (`priprav` ju postaví,
  aj zoznam pri `--zdroj <sha>`) + `package.json` (`build`, `build:once`).
- Pri zlyhaní siete musí stránka ostať použiteľná (kamióny: formulár Shoptetu + „Načítať znova“, `truck-konfigurator/mount.js`).
- Dnes:
  - `lcd-truck.js` = React konfigurátor kamiónov (~450 kB). Stiahne ho len produkt kamiónov bez `?novy=` — hneď pri
    spustení bundla (`predpripravTruck`), paralelne s data.json.
  - `lcd-gsap.js` (vstup `assets/js/casti/gsap.js`) = GSAP + ScrollTrigger, 111 kB / prenos ~45 kB. Len PC titulka, modul
    Materiál (`lcdHome.js` `lcdhStOn`, mimo zlomu `MATMQ`): stiahne sa pri štarte titulky; kým nepríde (alebo pri výpadku),
    rozklad materiálu riadi `frame()` pri scrolle — rovnaký výpočet, len bez vyhladenia `scrub`. Telefón ho nesťahuje vôbec.
  - `lcd-reels.js` (`casti/reels.js`) = reels pásu videí SK+CZ (modul 07), 87 kB / ~23 kB. Sťahuje sa, keď je pás 2500 px od
    okna; pridá sa ako doteraz pri 900 px. Pri výpadku ostanú dlaždice z adminu.
  - `lcd-hp.js` (`casti/hp.js`) = záložný markup titulky SK+CZ, 167 kB / ~20 kB. Len keď v HTML chýbajú statické korene
    `[data-lcd-cast^="hp-"]` (dnes ich SK aj CZ majú → nesťahuje sa nikde); boot titulky sa po príchode spustí znova.

### 1a. Rozbor luxuryCar.js (úloha C, 25. 10. 2026, SK `d20c8e2`)
Prínos skupiny = build bez nej (moduly nahradené prázdnymi exportmi) vs plný build, prenos = brotli q4 ako CDN
(živý `d20c8e2`: 1 169 943 B, prenos br 315 kB). Skript: scratchpad úlohy C `split/analyza.cjs <repo>`.

| skupina | raw kB | prenos kB | % prenosu | kto ju potrebuje | produkt 598/601 (1V aj `?novy=0`) | rozhodnutie |
|---|---|---|---|---|---|---|
| GSAP + ScrollTrigger | 111,7 | 46,6 | 15,0 % | PC titulka, modul Materiál | nie | → `lcd-gsap.js` |
| reels pásu videí (`lcdHome-reels.js`) | 86,8 | 22,5 | 7,3 % | titulka pri priblížení pásu | nie | → `lcd-reels.js` |
| záložný markup titulky (`lcdHome-markup.js`) | 167,0 | 19,7 | 6,3 % | titulka bez statických koreňov | nie | → `lcd-hp.js` |
| kamióny 1V (`konfigurator1v/kamion/*`) | 118,8 | 37,7 | 12,2 % | len 640 | nie | ostáva: 640 by konfigurátor dostal o RTT + 38 kB neskôr |
| `lcdKosikDoplnok.js` | 64,9 | 20,1 | 6,5 % | košík aj 1V (ceny v sete, farby Lux, boxy, veľkosť) | áno | ostáva |
| kód titulky `lcdHome.js` (bez dát, GSAP, Lenis) | ~47 | ~14 | ~4,5 % | titulka (oživenie pri DCL) | nie | ostáva: presun = neskoršie oživenie titulky |
| blog `lcdBlog.js` | 33,5 | 10,1 | 3,3 % | blog (kreslí zoznam aj článok pri štarte) | nie | ostáva: presun = blikanie / CLS blogu |
| starý vzorkovník `vzorky-konfigurator/index.js` | 25,8 | 7,6 | 2,5 % | 637 s `?novy=0` | nie | ostáva (malé) |
| rozcestník `lcdRz.js` + markup | 49,1 | 6,0 | 1,9 % | rozcestník | nie | ostáva (malé, oživenie pri DCL) |
| Lenis | 18,2 | 4,9 | 1,6 % | každá stránka na PC (plynulé rolovanie) | áno (PC) | ostáva |
| záložný markup hlavičky (`lcdHdr-markup.js`) | 14,5 | 0,1 | 0 % | košík / objednávka (`#mega`) | nie | ostáva |

- Presunuté 3 skupiny: luxuryCar.js 1 142 → 778 kB raw (−32 %), prenos br q4 310 → 221 kB (−89 kB, −28,6 %).
  Produkt, košík, blog, rozcestník a kategórie nové časti nesťahujú; PC titulka stiahne `lcd-gsap.js` hneď a `lcd-reels.js`
  pri priblížení pásu, telefón len `lcd-reels.js`.
- Ďalší kandidát s najväčším prínosom pre 598/601 sú kamióny 1V (−38 kB), ale len s prednačítaním na 640 hneď pri štarte
  bundla a s meraním 640 (session kamióny) — inak 640 stratí ~1 RTT.
- Starý React konfigurátor poukážky (`voucher-konfigurator/index.jsx`) sa od 4. 10. 2026 nemontuje; productPage.js berie len
  `voucher-konfigurator/stranka.js` (bez Reactu). Neimportovať index.jsx späť do bundla.

## 2. CSS
- Zdroj ostáva `assets/css/luxuryCar.css` (partialy + `tools/vloz-lcd-css.py`). CI ho zmenší esbuildom do
  `luxuryCar.min.css` a nahrá ako `v/<sha>/css/luxuryCar.css` (1,19 MB -> 0,93 MB, prenos ~−40 %).
- `--target=chrome80,firefox78,safari13`: esbuild by inak skladal top/right/bottom/left do `inset` (Safari až 14.1);
  s cieľom ich rozpíše aj tam, kde `inset` je v zdroji. `:is()`/`:has()` nemení.
- Overenie zhody: vypočítané štýly všetkých prvkov 12 stránok × 390/1280 px, nezmenšené vs zmenšené = zhodné
  (rozdiely len šum načítania a zápis prechodov farieb `0%`/`100%`).

## 3. Obrázky
- Žiadne WebP bez zálohy: iOS ≤ 13 ho nezobrazí. Buď JPEG/PNG, alebo `<picture>` so `source type="image/webp"` a JPG v `<img>`.
- Kamióny: `node tools/kamion-obrazky.mjs` prevedie nepriehľadné PNG z Shoptet uploadu (lemovania, nášivky, materiály) na
  progresívny JPEG q85 v `assets/img/1v/kamion/` (rovnaké rozmery; 76 súborov 3,2 MB -> 0,4 MB) a zapíše
  `konfigurator1v/kamion/obrazky.js`. Používa ho nový konfigurátor (`kamion/data.js`) aj React (`truck/build-truck-images.mjs`).
  `--check` = zoznam sedí so súbormi. Existujúci obrázok sa nikdy neprepisuje (assets/img je spoločné pre všetky verzie).

## 4. Meranie
- Lighthouse A/B: `Desktop/LCD/web/perf-nastroje/ab-harness/ab.mjs` (simulate: 150 ms RTT, 1,6 Mbit/s, CPU 4×) s B cez
  `--b-dir <priečinok s assets/v/<živé sha>/js|css/…>`, vlastná `--cache` a `--out`.
- Čas do použiteľného konfigurátora: `ab-harness/cas-produkt.mjs` (DevTools škrtenie RTT 562,5 ms, 1,47 Mbit/s, CPU 4×).
- Rozloženie na 23 rozmeroch (telefóny 320–430, na šírku, tablety, PC do 2560): `tools/rozlozenie/`
  (`rozlozenie-kamion.mjs` = celý konfigurátor kamiónov reálnymi klikmi + obsah, `rozlozenie-1v.mjs` = 1V produkty bez
  klikania, `zhrn-kamion.mjs` = zhrnutie nálezov, `harok.py` = hárok snímok; `lokal` = podstrčený build z priečinka
  `LCD_LOKAL`). Hľadá prekryté texty, pretečenie, orezanie, vodorovný posuvník, prvky mimo okna, malé dotykové ciele,
  tlačidlo zakryté lištou a mierku písma. Pozor na falošné nálezy počas animácie — nález vždy over snímkou.
- Záhlavie HTML kódov platí na KAŽDEJ stránke: žiadny `<link rel="preload">` obrázka jednej stránky. Preload fotky titulky
  (`lcd-home/hero.jpg`, high) sťahoval 140 kB aj na produktoch → zmazaný 25. 10. 2026 (Michal), 640 LCP −0,8 až −1 s,
  titulka bez zmeny (hero je `<img fetchpriority="high">` v `hp-vrch`). Preload loga ostáva (`admin-html/zahlavie-riadok.html`).
- Obrázky v popisoch produktov nemajú `loading="lazy"` — produkt 598 sťahuje ~3–4 MB fotiek spodného popisu hneď pri
  načítaní (aj pod `?novy=1`, kde je popis skrytý). Michal 25. 10.: v admine sa nemení, vyrieši to nahradenie popisu obsahom 1V.

## 5. Animácie a prepočty štýlov (SK `0fa8584`)
- Nekonečné CSS animácie (lesk tlačidiel `lcdh-sheen`, `lcdh-pfScroll`, pás galérie `lxPas`) bežali aj mimo obrazovky: nečinná
  titulka / 1V produkt na telefóne (CPU 4×) držala hlavné vlákno 2,0 s z 6 s. `functions/lcdAnimMimo.js` (volá main.js) ich mimo
  okna (+300 px) pozastaví cez Web Animations API a pri priblížení spustí → 0,1 s. Nová nekonečná animácia nič nepotrebuje,
  zachytí ju sken každých 5 s; konečné nástupy sa nemenia.
- GSAP ScrollTrigger sa registruje len v module Materiál na titulke (`lcdHome.js` lcdhStRegistruj): registrácia pri štarte
  každej stránky vynucovala prepočty štýlov (598: 640 → 140). Nový ScrollTrigger mimo titulky = najprv `lcdhStRegistruj()`.
- Pri načítaní stránky veľkosť CSS (−35 % bez blokov 1V) ani `:has()` všeobecne prepočty citeľne nezrýchlia — rozhoduje ich
  počet. Pri ťuknutí však rozhodujú dve konkrétne chyby selektorov, pozri §7.
- Nástroje (scratchpad session kamióny, 25. 10.): `styl-detail.mjs` (najdrahšie prepočty a ich spúšťač), `necinnost.mjs`
  (CPU v nečinnosti), `animacie.mjs` (bežiace animácie).

## 6. Odozva konfigurátora kamiónov na ťuknutie (640, `?novy=1`)
- Meranie: Event Timing API (čas od ťuknutia po vykreslenie), telefón 390 px, CPU 6×, 16 ťuknutí celou cestou; súčet
  4,1 s → 3,6 s (−13 %). Zvyšok tvoria hlavne prepočty štýlov celej stránky po každej zmene DOM / triedy (§7).
- `kamion/ui.js`: nezmenený náhľad motívu (plátno s rovnakou triedou, motívom, niťou, podkladom, `data-k`) sa po
  prekreslení kroku vráti na miesto aj s obrázkom; `data-nakreslene` = šírka okna pri kreslení (po otočení telefónu sa
  kreslí nanovo), plátno so strateným kontextom sa nepoužije. Prefarbený motív sa pamätá podľa farby, šírka plátna podľa triedy.
- `kamion/index.js`: výška okna chatu Luxia cez `ResizeObserver` (predtým `getBoundingClientRect` každú sekundu a po
  každom ťuknutí = vynútený prepočet rozloženia); bez ResizeObserver (Safari 13.0) ako predtým.

## 7. Selektory, ktoré spomaľujú každé ťuknutie (zistené 25. 10. 2026 na 640, Chrome trace invalidationTracking)
- **Atribút `class` s podreťazcom v predkovi a vpravo nič**, napr. `#lcd-blog [class*="rc-image-"][class$="__text"]>:first-child`
  (`_lcdBlog.scss`): Chrome potom pri zmene triedy na AKOMKOĽVEK prvku prepočíta celý strom pod ním
  (`allDescendantsMightBeInvalid`). Na ťuknutie v konfigurátore 2–7 prepočtov ~1160 prvkov (60–115 ms pri CPU 6×).
  Pravidlo: `[class*=…]` / `[class^=…]` / `[class$=…]` nepoužívať; vymenovať triedy. Vpravo vždy trieda/značka.
- **`:has()` ukotvený na `html` / `body` s ďalším prvkom za ním** (`body:has(X) .y`, `html:has(.a .b) .y`): po každom
  vložení DOM prepočet celej stránky. Stráž `:not(.trieda)` nepomáha; pomáha len kladná trieda v tom istom zloženom
  selektore, ktorá na stránke nie je (`body.in-index:has(…)` je v poriadku). `html:has(#footer)` bez ďalšieho prvku je lacné.
  Pravidlo: stav, ktorý JS aj tak pozná, dať ako triedu; `:has` kotviť čo najbližšie k prvku.
- Pokus na 640 (4 ťuknutia, súčet prepočtov štýlov): 906 ms → blog opravený 588 → `:has` opravené 418 → oboje 167 ms;
  odozva 16 ťuknutí 3,32 → 2,57 s. Opravu robí session Shoptet úpravy (spoločné CSS). Nástroje v scratchpade session
  kamióny: `layout-exp.mjs <variant>`, `odozva-exp.mjs 6 <variant>`, `layout-tuk3.mjs` (dôvody zneplatnenia), `css-bez.mjs`,
  `css-blog.mjs`, `css-strazca*.mjs` (varianty CSS v `lokal-<variant>/`).

## 8. Kostra stĺpca produktu a posuny rozloženia (CLS, 29. 10. 2026)
- `.col-xs-12.col-lg-6.p-info-wrapper:not(.active)` je kostra (výška 2 000 px, `overflow: hidden`, nepriehľadná trblietavá
  vrstva `::before` so `z-index: 10`, `_productPage.scss`); `.active` pridá `productPage.js` 1 s po `initProduct`
  (data.json), kamióny React `mount.js`. Obsah pod vrstvou zákazník nevidí, ale Chrome jeho posuny ráta do CLS.
- Preto je obsah kostry `visibility: hidden` (`_lcd1v-cena.scss`, blok LCD-1V-CENA): ukáže sa s `body.lcd-1v` (1V) alebo
  s `.active`. Skrytý prvok (aj `opacity: 0`) sa do posunov nepočíta, ani keď sa v tom istom snímku pohne a ukáže (pokus
  29. 10. 2026 v Chrome: skrytý + posun = 0, hidden -> visible + posun naraz = 0, viditeľný posun = 0,031).
- Nový prvok v stĺpci, ktorý má byť viditeľný ešte pred `.active` a nad trblietavou vrstvou, potrebuje vlastné
  `visibility: visible` (dnes taký nie je). Čísla pred/po: `docs/1v-rychlost.md` (Výsledky, 29. 10. 2026).
