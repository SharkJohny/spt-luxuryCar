# Rýchlosť webu — čo platí pre celý luxuryCar.js / luxuryCar.css (od 25. 10. 2026)

Michal 25. 10. 2026: „optimalizácia a zrýchľovanie stránok, aby sa aj na pomalších zariadeniach všetko rýchlo načítavalo
… aby sme o žiadne zariadenie neprišli“. Zrýchlenie 1V produktov (obsah, obrázky obsahu) má vlastný plán
`docs/1v-rychlost.md` (session Shoptet úpravy); tu sú spoločné pravidlá bundla, CSS a obrázkov.

## 1. Samostatné časti bundla (`functions/lcdCasti.js`)
- Kód, ktorý treba len na jednej stránke, nepatrí do `luxuryCar.js` (ten sa sťahuje a parsuje na **každej** stránke).
- Časť = vlastný vstup (napr. `truck-konfigurator/cast.jsx`), ktorý sa sám zapíše do `window.__lcdCasti[meno]`.
  Bundle ju stiahne cez `nacitajCast(meno)` z tej istej verzie (`LCD_ZAKLAD` = `…/assets/v/<sha>/`), 3 pokusy.
- Nová časť = riadok v `SUBORY` (lcdCasti.js) + druhý `yarn esbuild` v `.github/workflows/production.yml` + `cp`/`rm`
  v kroku „Verzia do vlastného priečinka“ + `.gitignore` + `tools/test-konfigurator-1v.mjs` (`priprav` ju postaví).
- Pri zlyhaní siete musí stránka ostať použiteľná (kamióny: formulár Shoptetu + „Načítať znova“, `truck-konfigurator/mount.js`).
- Dnes: `lcd-truck.js` = React konfigurátor kamiónov (~450 kB). Stiahne ho len produkt kamiónov bez `?novy=` — hneď pri
  spustení bundla (`predpripravTruck`), paralelne s data.json.
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
- Overené, že veľkosť CSS (−35 % bez blokov 1V) ani `:has()` prepočty štýlov citeľne nezrýchlia — rozhoduje ich počet.
- Nástroje (scratchpad session kamióny, 25. 10.): `styl-detail.mjs` (najdrahšie prepočty a ich spúšťač), `necinnost.mjs`
  (CPU v nečinnosti), `animacie.mjs` (bežiace animácie).

## 6. Odozva konfigurátora kamiónov na ťuknutie (640, `?novy=1`)
- Meranie: Event Timing API (čas od ťuknutia po vykreslenie), telefón 390 px, CPU 6×, 16 ťuknutí celou cestou; súčet
  4,1 s → 3,6 s (−13 %). Zvyšok je hlavne prepočet rozloženia po `innerHTML` celého kroku (`render()` v `kamion/ui.js`).
- `kamion/ui.js`: nezmenený náhľad motívu (plátno s rovnakou triedou, motívom, niťou, podkladom, `data-k`) sa po
  prekreslení kroku vráti na miesto aj s obrázkom; `data-nakreslene` = šírka okna pri kreslení (po otočení telefónu sa
  kreslí nanovo), plátno so strateným kontextom sa nepoužije. Prefarbený motív sa pamätá podľa farby, šírka plátna podľa triedy.
- `kamion/index.js`: výška okna chatu Luxia cez `ResizeObserver` (predtým `getBoundingClientRect` každú sekundu a po
  každom ťuknutí = vynútený prepočet rozloženia); bez ResizeObserver (Safari 13.0) ako predtým.
