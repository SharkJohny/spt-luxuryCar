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

## Výsledky

(doplní sa po meraní)
