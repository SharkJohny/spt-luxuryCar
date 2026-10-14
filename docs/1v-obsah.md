# Obsah pod konfigurátorom 1V — všetky SK produkty (skupiny A–D + moduly typov, `?novy=1`)

Základ z 13. 10. 2026 (worktree `spt-luxuryCar-1v`, HEAD `a0d3ce8`). Skupiny A–D zlúčené 14. 10. 2026 (koordinátor): spoločné pravidlá presunuté do základu (bod 5 nižšie), jedno okno na fotky a videá, jeden reveal, stav a otvorené body v sekcii 10.
**T0.3 (14. 10. 2026): obsah pre všetky produkty z registra** — kľúč obsahu podľa produktu, kusy z CDN verzie bundle (rozhodnutia D1 = b, nie bannery v pätičke), čísla a odkazy podľa vzoru (`obsah-cisla.js`), moduly typov. Zmeny oproti základu sú v sekciách 1–4, 4b, 6, 7, 9 a 11.
Cieľ: všetko pod konfigurátorom vyzerá ako schválený návrh typu (`scratchpad/navrhy/<návrh>.html`, server `http://127.0.0.1:8952/`): jednovrstvove.html (598/610/613), dvojvrstvove.html, kufor-classic.html, kufor-premium.html, boxy.html, (vzorkovnik.html). Zatiaľ len s `?novy=1`.
Konfigurátor sám je v [`docs/1v-kontrakt.md`](1v-kontrakt.md) (brána, `ctx`, testy). Tento súbor platí pre workerov obsahu.

Hlavička, mega menu a päta už sú naživo, tie sa nerobia.

---

## 1. Kde obsah je — skúška (CDN) a spustenie (Popis produktu)

**Rozhodnutie D1 = b (rozhodnutia.md, 13. 10. 2026):**
- **Skúška (teraz):** obsah je na **CDN verzie bundle**, nie v admine. Build (`admin-html/dist/p1v-*.sk.html`) skopíruje `.github/workflows/production.yml` do `assets/v/<sha>/html/`. `obsah.js` ho stiahne **len pod bránou** (flag `?novy=1` + typ v `ZAPNUTE_TYPY`, alebo `?novy=vyvoj`) a len na produktoch s daným kľúčom obsahu. Návštevník bez flagu nestiahne nič a HTML stránky je nezmenené (žiadne bannery v pätičke, žiadny skrytý HTML). Do adminu sa počas skúšky ukladá len prepnutie sha v SK HTML kódoch (plan.md §3 A).
- **Po spustení pre všetkých:** Popis (description) každého produktu skupiny (runner, TinyMCE) — sekcie 7 a 9 B. Pravidlo „web bez prekrývania“ (obsah v admin HTML, JS len oživuje) sa splní až vtedy; CDN cesta je dočasná výnimka len pre skúšobný odkaz.

Prečo nie banner v pätičke (D1 = a, pôvodný základ): ~55–73 kB skrytého HTML na každej SK stránke pre všetkých a 8+ uložení v admine. Starý test v pätičke (`--miesto paticka`) ostáva v teste ako možnosť a `obsah.js` korene v DOM stále nájde (cesta a) v sekcii 2).

**Skupiny obsahu (kľúč = `obsah` v registri `konfigurator1v/produkty.js`):**

| Kľúč | Produkty | Zdroj | Kusy (dist / CDN `html/`) | Návrh | Stav |
|---|---|---|---|---|---|
| `598` | 598 Diamond, 613 Stripe, 610 Hexa (jednovrstvové) | `admin-html/src/p1v-598/` | `p1v-598-1.sk.html` (10–29: A + B), `p1v-598-2.sk.html` (30–49: C + D) | jednovrstvove.html v26 | hotové (značky čísel a odkazov podľa vzoru doplní T1.1) |
| `dvoj` | 601, 607, 604 | `src/p1v-dvoj/` | `p1v-dvoj-1/-2` | dvojvrstvove.html | stuby (T1.3) |
| `classic` | 619, 625, 622 | `src/p1v-classic/` | `p1v-classic-1/-2` | kufor-classic.html | stuby (T2.3) |
| `premium` | 628, 634, 631 | `src/p1v-premium/` | `p1v-premium-1/-2` | kufor-premium.html | stuby (T2.4) |
| `boxy` | 616 | `src/p1v-boxy/` | `p1v-boxy-1/-2` | boxy.html | stuby (T3.3) |
| `vzorky` | 637 | `src/p1v-vzorky/` | `p1v-vzorky-1/-2` | vzorkovnik.html | stub (T5.1, až po schválení) |

- Jeden obsah pre celú skupinu. Čo sa líši podľa vzoru alebo ceny (ceny, počet farieb, názov vzoru, odkazy na iný typ toho istého vzoru), je v značkách `data-p1v-cislo` / `data-p1v-odkaz` a dosadí to `obsah-cisla.js` zo živých dát (sekcia 4b). **V statickom HTML nikdy nie je cena** (build to kontroluje).
- **Každá skupina má presne 2 kusy** (`-1` = sekcie 10–29, `-2` = 30–49; `ciele.json` → `pravidla.obsah-1v.kusy` = `KUSY` v `obsah.js`; build kontroluje). Každý kus ≤ 45 000 zn. kvôli spusteniu (limit poľa Popis).
- Kus len so stubmi build postaví ako prázdny koreň (`<!-- -->`). `obsah.js` ho stiahne a **nič neukáže** (starý popis ostane, nič sa neskryje).
- `ciele.json`: časti `p1v-<kľúč>-<n>` majú `"cz": null` (obsah 1V je len SK; CZ súbor v zložke = chyba buildu), `"naVsetkychStrankach": false`, cieľ `"sk": { "typ": "cdn", "subor": "html/<časť>.sk.html", "poSpusteni": … }` a `"produkty"`. Stránky `produkt-<id>` (13 + 637) = `mega` + kusy kľúča → build kontroluje kolízie id a kotvy na každej stránke produktu.
- Build vypíše riadok `p1v-<kľúč>.sk … zn. spolu` = súčet pre jedno pole Popisu po spustení.
- **Agenti do adminu nikdy nepíšu.** Zápis (po spustení) robí koordinátor s Michalom (runner cez Chrome, `admin-html/README.md`).

## 2. Brána a umiestnenie

Obal vyrobí build, workeri ho nemenia:
```html
<div id="p1v-598-1" class="p1v-obsah" data-lcd-cast="p1v-598-1" data-lcd-v="…" data-lcd-brana="1v" style="display:none">
  …sekcie 10–29 v poradí názvov súborov…
</div>
```

**Bez flagu** (každý návštevník): `obsah.js` vôbec nebeží (je za bránou v `index.js`) → žiadna požiadavka na `…/html/p1v-*`, žiadny obrázok obsahu, HTML stránky bez zmeny. (Pri obsahu v DOM — Popis po spustení / starý test v pätičke — koreň `display:none`, stĺpec pätičky skrytý, médiá odložené.)

**S flagom** (`assets/js/components/konfigurator1v/obsah.js`, posledný modul v `index.js`):
1. Kľúč = `ctx.produkt.obsah` (register), inak `productId`.
2. **a) Korene v DOM** `[data-lcd-cast^="p1v-<kľúč>-"]` (Popis po spustení, starý test v pätičke) → tie, synchrónne (ako základ).
   **b) Inak, keď `OBSAH_CDN` (D1 = b; od integrácie WA 14. 10. 2026 v jadre predvolene `true` — sekcia 11; vypnúť sa dá bez úpravy kódu `--define:LCD_OBSAH_CDN=false`):** adresa bundle `…/assets/v/<sha>/js/luxuryCar.js` (skript na stránke) → `…/assets/v/<sha>/html/p1v-<kľúč>-1|2.sk.html`, `fetch` (CORS: CDN posiela `Access-Control-Allow-Origin: *`, overené 14. 10. na `assets/v/fc20e3e/js/version.json`), HTML cez inertný `<template>` (nič sa nesťahuje ani nespúšťa, kým sa koreň nevloží). Len SK (`ctx.trh`). Nevyverzovaný bundle (bez `v/<sha>/`) = nič. Kus, ktorý nepríde (404, sieť), chýba.
   Žiadna sekcia v koreňoch (len stuby) = nič, `window.__lcd1v.obsah.stav = "nic"`.
3. Vytvorí `div.p1v-miesto` **hneď pred** `.p-detail > .shp-tabs-wrapper` (záložky Popis/Diskusia) = priamo pod konfigurátorom, na celú šírku stránky (`.overall-wrapper`; `--p1v-sirka`, `--p1v-vlavo` podľa skutočnej geometrie).
4. Presunie korene doň v poradí kus 1, kus 2. Prázdny stĺpec pätičky (starý test) dostane `data-p1v-prazdny`.
5. Body dostane `.lcd-1v-obsah`. CSS (blok `LCD-1V-OBSAH`): ukáže korene v `.p1v-miesto`, **skryje záložky** (starý popis, Diskusia, Dodatočné parametre; ostávajú v DOM, JS na ne kotví).
6. `obsah-cisla.js` (synchrónne skryje nedosadené čísla a dosadí odkazy; hodnoty asynchrónne), potom `init(oc)` skupín A–D, potom **modul typu** (`obsah-dvoj.js`, `obsah-classic.js`, `obsah-premium.js`, `obsah-boxy.js`; `598` a `vzorky` nemajú).
7. Spoločný reveal `.rv` pre všetky sekcie (čo je vo výreze alebo nad ním hneď, zvyšok pri zobrazení), potom obal každej sekcie dostane `.p1v-rv`. Skupiny reveal nerobia.
- **Chyby:** cesta a) — výnimka modulu → `ctx.chyby`, `index.js` zloží celý nový vzhľad (ako základ). Cesta b) beží až po stiahnutí, keď je konfigurátor hotový a `index.js` už `ctx.chyby` nekontroluje → výnimka ide do `ctx.chyby` a **vráti sa len obsah** (`.p1v-miesto`, okno a linka čítania preč, `.lcd-1v-obsah` preč = starý popis späť); konfigurátor ostane nový.
- **Stav pre test a ladenie:** `window.__lcd1v.obsah = { kluc, zdroj: "dom"|"cdn"|null, stav: "nic"|"caka"|"hotovo"|"chyba", kusy, hotovo (Promise, len CDN), cisla (Promise) }`.

**Štýly titulky platia aj na obsahu.** `vloz-lcd-css.py` mení v bloku `LCD-HOME`:
- pôvodne: `#lcd-home` → `:is(#lcd-home,[data-lcd-cast^=hp])`,
- teraz: `#lcd-home` → `:is(#lcd-home,[data-lcd-cast^=hp],body.lcd-1v [data-lcd-cast^=p1v])` (všetky kľúče).

Dôsledky:
- Korene dostanú premenné (`--ink`, `--gold`, `--sand`…), písmo a všetky moduly titulky: `.chapter`, `.wrap`, `.rule`, `.lede`, `h2`, `lx-*` (galéria, farby, pred a po), `.deck`, `.revs`…
- Tie sú aj prvou časťou CSS návrhu. **Skupiny teda píšu len rozdiely oproti titulke**, nekopírujú 370 riadkov `lx-*`.
- Špecificita ostáva (1,0,0). Bez flagu alias nič nevyberá.
- `luxuryCar.css`: +~39 kB surových, +~2 kB brotli.
- Body 5–6 základu `_lcd1v-obsah.scss` a partialy A–D cielia `:is(#p1v-598-1,#p1v-598-2,.p1v-obsah)` (integrácia WA 14. 10. 2026; predtým len id 598): `:is()` berie špecificitu najšpecifickejšieho argumentu (1,0,0), takže prebije LCD-HOME rovnako a vyberie koreň každého kľúča (`dvoj` … `boxy`).

**Kapitoly návrhu** (`.kap[data-k=1–4]` = 4 tematické skupiny, 2. a 4. na svetlom podklade):
- Obal sekcie nesie `data-lcd-kap="N"`. Kapitola 2 má totiž sekcie dvoch skupín (B + C).
- Podklad, linky a rytmus odsadení `section.chapter` dáva `LCD-1V-OBSAH` bod 5.
- Ktorú kapitolu má sekcia, píše hlavička jej súboru.

## 3. Súbory a vlastníctvo

| Skupina | Sekcie (`admin-html/src/p1v-598/`, `data-lcd-sekcia`) | JS | CSS | Test |
|---|---|---|---|---|
| **A** | `10-a-ponuka` (Jazdíte aj v zime?), `11-a-referencie`, `12-a-galeria`, `13-a-recenzie` | `konfigurator1v/obsah-a.js` | `assets/css/_lcd1v-obsah-a.scss` | `tools/test-1v/obsah-a.mjs` |
| **B** | `20-b-ocakavat` (Deväť vecí + `#s2Mob`), `21-b-material`, `22-b-porovnanie` (+ výzva), `23-b-predapo` | `obsah-b.js` | `_lcd1v-obsah-b.scss` | `obsah-b.mjs` |
| **C** | `30-c-kam` (+ výzva), `31-c-domov`, `32-c-casova-os` (+ výzva), `33-c-farby`, `34-c-vzorky` | `obsah-c.js` | `_lcd1v-obsah-c.scss` | `obsah-c.mjs` |
| **D** | `40-d-realita`, `41-d-faq`, `42-d-koniec` (Kúpiť a nečakať), `43-d-pomocne` (zlatá linka `#citanie`, okno `#lb`) | `obsah-d.js` | `_lcd1v-obsah-d.scss` | `obsah-d.mjs` |

**Moduly typov (T0.3, stuby — vlastník = obsahová úloha typu):**

| Kľúč | Sekcie (`admin-html/src/p1v-<kľúč>/`) | JS (po A–D) | CSS | Test plugin | Úloha |
|---|---|---|---|---|---|
| `dvoj` | 17 stubov s menami 598 (`23-b-predapo` ostáva stub) | `obsah-dvoj.js` | `_lcd1v-obsah-dvoj.scss` | `tools/test-1v/obsah-dvoj.mjs` | T1.3 |
| `classic` | 19 stubov, nové `23-classic-premium`, `31-classic-box` | `obsah-classic.js` | `_lcd1v-obsah-classic.scss` | `obsah-classic.mjs` | T2.3 |
| `premium` | 17 stubov, nové `22-premium-porovnanie`, `30-premium-kryje` | `obsah-premium.js` | `_lcd1v-obsah-premium.scss` | `obsah-premium.mjs` | T2.4 |
| `boxy` | 15 stubov, nové `21-boxy-velkosti`, `40-boxy-cross` | `obsah-boxy.js` | `_lcd1v-obsah-boxy.scss` | `obsah-boxy.mjs` | T3.3 |
| `vzorky` | `10-vzorky-obsah` (stub) | — | — | — | T5.1 |

- Mená stubov sú návrh podľa spec typu (poradie z návrhu, mená 598 tam, kde sekciu oživuje skupina A–D). Úloha typu ich smie premenovať, zmazať alebo pridať (`NN-<meno>.sk.html`, rozsah 10–29 = kus 1, 30–49 = kus 2).
- **Spoločné sekcie** (referencie, galéria, recenzie, deväť vecí, materiál, porovnanie, časová os, farby, vzorky, realita, FAQ, záver, pomocné) nesú **mená 598** (`a-…`, `b-…`, `c-…`, `d-…`) → oživia ich A–D bez zmeny JS. Nový komponent typu = meno `<kľúč>-<meno>` a oživuje ho modul typu.
- A–D sú zovšeobecnené (T0.3): sekcia, ktorú skupina nemá, sa preskočí; rez materiálu má ľubovoľný počet dosiek (medzera `pw·0,58·min(1, 4/(n−1))`, pri 5 doskách ako 598).
- Obrázky: `assets/img/1v/obsah/<skupina>-<popisné-meno>.jpg` (typy: `dvoj-*`, `classic-*`, `premium-*`, `boxy-*`).
  - Nikdy neprepisovať existujúci súbor v `assets/img/`.
  - Max ~1600 px na šírku, JPEG q≈80 (WebP len tam, kde ho živý web už používa).
  - V HTML/CSS absolútna adresa `https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/obsah/<meno>` (v JS `oc.obrazok(meno)`). Test ich servíruje z repa.
- **Jadro (mení len vydanie, plan.md §2.1):**
  - `obsah.js`, `obsah-cisla.js`, `assets/css/_lcd1v-obsah.scss`, `admin-html/ciele.json`,
  - `tools/build-admin-html.mjs`, `tools/vloz-lcd-css.py`,
  - `tools/test-1v-obsah.mjs`, `tools/test-1v/obsah-spolocne.mjs`, tento dokument, `.github/workflows/production.yml`,
  - generované `admin-html/dist/*` a `assets/css/luxuryCar.css`,
  - všetko z `docs/1v-kontrakt.md` sekcia 10.
- Okno boxov `#bxBox` a lepivá lišta `#lista` z návrhu patria konfigurátoru (kufor-boxy, cena), nie obsahu.
- Git: workeri len čítajú (`status/diff/log`). Commit robí koordinátor po vymenovaných cestách (nikdy `node_modules`, nikdy build `luxuryCar.js`).

## 4. Pravidlá HTML sekcie (build ich kontroluje)

- **Súbor = jeden prvok na najvyššej úrovni** s `data-lcd-sekcia="<meno>"` (meno = názov súboru bez čísla) a `data-lcd-kap` podľa hlavičky.
  - Súbor len s komentárom je stub a build ho preskočí.
  - Komentáre s textom build zmaže.
- **id len s predponou `p1v-`.** Titulka má `#galeria`, `#farby`, `#predapo`… Obsah všetkých kľúčov smie mať rovnaké id sekcií (napr. `p1v-referencie`, `p1v-lb`) — na stránke je vždy len jeden kľúč; build kolízie kontroluje po stránkach `produkt-<id>`.
- Kotva na konfigurátor (výzvy „Vyberte si model…“): `href="#product-detail-form"`. Iné kotvy len na `p1v-*` id toho istého kľúča (napr. záloha `href="#p1v-dvoj-1"`).
- **Zakázané triedy** (kotvy živého JS, zoznam v `ciele.json` → `pravidla.obsah-1v.zakazaneTriedy`), napr.:
  - `lcd-reviews-widget`, `lcd-videos-widget`: `main.js` by widget nevložil do starého popisu,
  - `text-block`, `twentytwenty-*`, `impact-text`, `layers-info-wrap`,
  - `wrapper`, `desctop`, `mobile` (`video-play-again.js`),
  - `faq`, `accordion`, `option-button`, `parameter-wrap`, `upsale-*`, `sec-header`, `lcd-root`.
  - Na triedy titulky (`chapter`, `wrap`, `lx-*`, `deck`, `revs`…) sa nič zo živého JS nekotví, tie sú v poriadku.
- Polia formulára sú zakázané:
  - žiadne `<form>`, `<input>`, `<select>`, `<textarea>`, ani atribút `name`,
  - každé `<button>` má `type="button"` a text (TinyMCE).
- **Médiá odložené:**
  - `<img loading="lazy" width height alt>`,
  - `<video preload="none" data-src data-poster>` (žiadny `src`/`poster`, `<source>` tiež `data-src`),
  - `<iframe data-src>`.
  - Načítanie pri zobrazení: `oc.priZobrazeni(el, oc.nacitajMedia)`.
  - Bez flagu test overí, že sa nestiahlo nič.
- **TinyMCE** (Popis po spustení):
  - žiadne `<details>`, `<template>`, `<dialog>`, `<style>`,
  - žiadny prázdny prvok (`<!-- -->` dovnútra),
  - žiadny blokový prvok v `<a>`,
  - žiadne `<h1>`, `<script>`, `on…=`, `javascript:`.
- **Čísla a odkazy** (sekcia 4b): `data-p1v-cislo` len so známym kľúčom a **bez hodnoty vnútri** (len `<!-- -->`), `data-p1v-tvar` s `{}` a bez číslic, `data-p1v-bez` bez číslic; `data-p1v-odkaz` len na `<a href>` s typom `jedno|dvoj|classic|premium|boxy`.
- **Texty:**
  - Preberajú sa zo schváleného návrhu typu (spec `prieskum-vsetky/navrh-<typ>.md`).
  - Zakázané:
    - „na milimeter“, 1. osoba „vyrábame“,
    - počty vrstiev, záruka ako argument,
    - názvy DragonSkin / Elite / Basic v novom texte,
    - uchytenie do fixačných bodov auta, „Comfort“ (druhá vrstva len „Lux“).
  - D3: tvrdenie, ktoré nie je doslovne v schválenom návrhu ani na živom webe, sa nepíše („kovový štítok“ vs „logo“ pri rohožiach, skladom/lehota boxu).
  - Kufrová rohož „Premium“ ako produkt áno.
  - Žiadne právne upozornenia pri cenách.
  - **Ceny nikdy natvrdo v HTML.** Cenu vpíše JS zo živých dát (`data-p1v-cislo`, `oc.ctx.cena()`, `ctx.moznosti()`), inak sa cena nezobrazí.
  - Keď text návrhu porušuje pravidlo, použi najbližšie dovolené znenie a napíš ho koordinátorovi.

## 4b. Čísla a odkazy podľa vzoru (`obsah-cisla.js`, plan.md §2.4)

```html
<p>Dvojvrstvové <span data-p1v-cislo="cena-od-dvoj" data-p1v-tvar="od {}"><!-- --></span></p>      <!-- „od 362 €“ na Hexa -->
<span data-p1v-cislo="pocet-farieb"><!-- --></span>                                                  <!-- „3 farby“ -->
<span data-p1v-cislo="set-usetrite" data-p1v-bez="v sete lacnejšie"><!-- --></span>                 <!-- náhradný text -->
<a class="btn" href="/luxusne-autokoberce-dragonskin-diamond-line/#p1v-x" data-p1v-odkaz="jedno">…</a>  <!-- href toho istého vzoru -->
```

- Hodnota je vo formáte „351 €“ (NBSP pred €; desatinné „1 234,50 €“), počet farieb so skloňovaním (1 farba, 2–4 farby, 5+ farieb). `data-p1v-tvar="od {}"` = predpona/prípona (nedosadené číslo skryje aj ju).
- Kým hodnota nie je zistená, je prvok `visibility:hidden` (nastaví sa v tej istej úlohe, v ktorej sa obsah ukáže → hodnota iného vzoru sa nikdy neukáže, ani na chvíľu). Nezistená: `data-p1v-bez` (náhradný text), inak `display:none`. Stav na prvku: `data-p1v-stav = caka | ok | bez | skryte` (kópie prvkov, ktoré skupiny vyrobia neskôr — napr. klony pásu galérie — dostanú hodnotu v druhom kole).
- **plan.md §2.4 a zadanie T1.1 hovoria „text vo vnútri = hodnota Diamond“ — neplatí** (T0.3, pokyn „never prices in static HTML“): vnútri len `<!-- -->`, build hodnotu odmietne. Dôvod: po spustení je obsah v Popise viditeľný ešte pred JS → na Hexa/Stripe by bliklo číslo Diamond.
- `obsah-cisla.js` mení len `textContent`, `href` a viditeľnosť vlastných prvkov obsahu. Nič neodosiela; ceny ani ID parametrov natvrdo nemá (parametre podľa `data-parameter-name`, `ctx.js` `PARAMETRE`).

| Kľúč | Hodnota | Zdroj |
|---|---|---|
| `cena-od` | základná cena tohto produktu | `ctx.cena().zaklad`, inak `[itemprop=price]` |
| `cena-od-jedno` / `-dvoj` / `-classic` / `-premium` / `-boxy` | základná cena produktu typu v tom istom vzore (box = 616; stránka boxu bez vzoru = Diamond) | `ceny-ine.js` `cenaTypu` (GET sesterskej stránky, `localStorage` 24 h; vlastná stránka z dokumentu) |
| `set-classic`, `set-premium` | príplatok „autokoberce do kufru“ (dno / dno + boky) na jednovrstvovom produkte vzoru | `priplatkyTypu(…, "jedno", vzor)` |
| `set-usetrite` | na rohoži Classic/Premium: `cena-od` − príslušný `set-*` (inde nezistené → `data-p1v-bez`) | |
| `set-usetrite-classic` / `-premium` | kdekoľvek: `cena-od-classic` − `set-classic` (resp. Premium) | |
| `box-sam-S…XL` | 616: základ + príplatok 1. boxu veľkosti | stránka 616 |
| `box2-sam-S…XL` | 616: príplatok 2. boxu | stránka 616 |
| `box-set-S…XL` | jednovrstvové vzoru (stránka boxu = 598): príplatok „Box solo“ | |
| `box-set2-S…XL` | jednovrstvové vzoru: príplatok 1. boxu (dva boxy v sete) | |
| `pocet-farieb`, `pocet-farieb-2` | počet farieb 1. / 2. vrstvy tohto produktu | `ctx.moznosti("farba" / "farba2")` |
| `vzor` | „Diamond Line“ / „Stripe Line“ / „Hexa Line“ (box: nič) | register `ctx.produkt.vzor` |

Odkazy `data-p1v-odkaz="jedno|dvoj|classic|premium|boxy"` → `href` = adresa z registra (`produkty.js` `najdiProdukt`) v tom istom vzore, fragment `#…` ostane. S `?novy=1` netreba (flag je v karte). Zoznam kľúčov je v `obsah-cisla.js` (`RE_KLUC`) aj v `ciele.json` (`pravidla.obsah-1v.cisla`) — meniť oba naraz.

## 5. CSS a JS skupiny

- **CSS:**
  - Čisté CSS v `_lcd1v-obsah-<x>.scss`. **Každý selektor začína `body.lcd-1v`**, najlepšie `body.lcd-1v [data-lcd-sekcia="b-material"] …`.
  - Žiadne `@import` ani `:root`. Nikdy nekompilovať `luxuryCar.scss`.
  - Pravidlá titulky (blok LCD-HOME) majú špecificitu id. Na prepísanie použi `body.lcd-1v :is(#p1v-598-1,#p1v-598-2) …` alebo `!important` s mierou.
  - Merať na návrhu (computed styles, snímky). Patch vrstvy návrhu nekopírovať.
- **Spoločné pravidlá sú v základe `_lcd1v-obsah.scss`, skupiny ich nekopírujú:**
  - bod 5: rytmus kapitol `clamp(38px,4.8vw,68px)` so selektorom s id koreňov (prebije LCD-HOME ARMOR `.chapter{padding…!important}`), linka medzi sekciami kapitoly bez id (skupina ju vie zrušiť, napr. B pred porovnaním),
  - bod 6: zlaté nadpisy `.chapter h2` / `.pinhead h2`, `.lede{max-width:46ch}`, reveal `.rv` viditeľné bez `.p1v-rv`, `.sr-only` / `.p1v-sr`,
  - bod 7: `#content-wrapper` od 761 px `overflow:visible` (lepené scény + miesto na celú šírku), na telefóne `overflow-x:clip` + zvislo visible (pred a po lepí ako v návrhu a na titulke; `#content-wrapper` je tam na celú šírku okna, overené 360/390; celé `clip` by orezalo posledný px obsahu),
  - bod 8: starý FAQ pri konfigurátore skrytý, keď je na stránke nový `d-faq`,
  - bod 9: lepená scéna (pred a po, na tablete aj galéria) má spodok o výšku lepivej lišty konfigurátora vyššie (`body.lcd1v-lista-on`, do 991 px).
  - Sekcie skupiny A sú v návrhu mimo kapitol, ich rytmus `clamp(46px,6vw,86px)` ostáva v `_lcd1v-obsah-a.scss`.
- **JS:**
  - Len `export function init(oc)`. Pri importe nič nebeží.
  - Nič zo živého DOM nemazať, žiadny `fetch`/POST, žiadne ceny ani ID natvrdo.
  - Sekcia, ktorá je ešte stub, nie je v DOM: `oc.sekcia(meno) === null`, vtedy nerob nič.
  - `oc` = `{ ctx, kluc (kľúč obsahu: 598 | dvoj | classic | premium | boxy | vzorky), korene, koren (multi), miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el), ked, na, vysli }`.
- **Moduly titulky** (`assets/js/lcdHomeModuly.js`):
  - Galéria, farby a pred a po sa oživia cez `lxModulyOziv(lcdMultiKoren([sekcia]), false)` (import z `../../lcdHomeModuly.js` a `../../functions/lcdOziv.js`). Každá skupina volá len na svoju sekciu.
  - `lcdMultiKoren([sekcia]).querySelectorAll(sel)` sekciu samu nevracia (`querySelector` áno). `lcdOziv.js` sa zámerne nemení (titulka a rozcestník ho používajú tiež). Dôsledok pre galériu: `lxModulyOziv` nepostaví vlastné `.lx-zoom`, fotku otvorí jediné okno obsahu `#p1v-lb` (sekcia 8; `obsah-a.js` doplní tlačidlám `data-p1v-lb-foto` a sadu `a-galeria`).
  - Markup musí sedieť s titulkou (`admin-html/src/hp-*.sk.html`).
- **Reveal `.rv`** robí `obsah.js` pre všetky sekcie naraz (krok 6 v sekcii 2). Skupina, ktorá potrebuje iné odhaľovanie, ho nesmie duplikovať, ale dohodne ho s koordinátorom.
- **Recenzie:** `window.LCD_REVIEWS` (`reviews-data.js`). Na 598 sa načíta, kým je v starom popise `.lcd-reviews-widget`.
- **FAQ:** starý blok FAQ v `.p-info-wrapper` (`components/index.js`) je pri konfigurátore. Nový FAQ je dole (D). Starý skrýva základ (bod 8), len keď nový na stránke je; v DOM ostáva.
- **Hodnotenie pod H1** (`cena.js`, „5,0 ★ … recenzií“): s novým obsahom posunie na sekciu `a-recenzie`, bez nej (alebo keď je skrytá) na starý widget ako doteraz.

## 6. Testy

```
node tools/build-admin-html.mjs                 # build dist + manifest; dĺžky sekcií, súčet p1v-<kľúč> (integrátor/vydanie)
node tools/build-admin-html.mjs --vystup %TEMP%/d   # build mimo repa (workeri; dist mení len vydanie)
node tools/build-admin-html.mjs --check         # CI
node tools/build-admin-html.mjs --test          # samotest kontrol (aj značky data-p1v-cislo / data-p1v-odkaz)
python tools/vloz-lcd-css.py --check            # CI (luxuryCar.css generuje vydanie)
node tools/test-1v-obsah.mjs                                    # 598, CDN cesta (D1 = b), bez flagu + ?novy=1, snímky
node tools/test-1v-obsah.mjs --produkt 598,610,613              # viac produktov (id | all | typ:dvoj | alias)
node tools/test-1v-obsah.mjs --vyvoj --produkt 601,604,607      # ?novy=vyvoj: typ, ktorý ešte nie je v ZAPNUTE_TYPY
node tools/test-1v-obsah.mjs --len bez --produkt 598,610,601,619,616   # bez flagu: 0 požiadaviek na obsah
node tools/test-1v-obsah.mjs --sonda-cisla --vyvoj --produkt 604 --len novy --sirka 1280 --bez-snimok   # čísla a odkazy
node tools/test-1v-obsah.mjs --skupina b --sirka 390 --snimky-sirky 390 --snimky …   # rýchlo, len skupina B
node tools/test-1v-obsah.mjs --miesto popis     # obsah v Popise (simulácia spustenia, brána ešte zapnutá)
node tools/test-1v-obsah.mjs --miesto paticka   # starý test D1 = a (bannery v pätičke)
node tools/test-1v-obsah.mjs --miesto zive      # nič sa nevkladá ani neobsluhuje: obsah zo živej stránky / živej CDN verzie
node tools/test-konfigurator-1v.mjs             # konfigurátor bez flagu (musí ostať zelený)
node tools/test-konfigurator-1v.mjs --novy      # konfigurátor s ?novy=1 (musí ostať zelený)
```

**`test-1v-obsah`** (T0.3) zostaví HTML obsahu (`--vystup`), JS a CSS ako CI do dočasného priečinka a otvorí živé stránky produktov z `--produkt` (register `konfigurator1v/produkty.js` sa číta zo zdroja: typ, vzor, adresa, kľúč obsahu, `ZAPNUTE_TYPY`; `?novy=1` na nezapnutom type = chyba použitia, treba `--vyvoj`). Bundle a CSS nahradí lokálnym buildom (adresa `…/assets/v/<sha>/js/luxuryCar.js` ostane, takže `obsah.js` počíta CDN adresu presne ako naživo). Miesto obsahu (`--miesto`):
- **`cdn` (predvolené, D1 = b):** nič sa do stránky nevkladá. Požiadavky `…/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html` test obslúži lokálnym dist (+ sonda), neznámy kus = 404 ako CDN. Základ „bez obsahu“ dostane prázdne korene.
- `paticka` / `popis`: kusy vložené do dokumentu produktu (pätička = starý test, Popis = spustenie). `zive`: nič.

Kontroluje:
- **bez flagu (1280, 390):**
  - žiadne `body.lcd-1v`, `.p1v-miesto`; pri `cdn` žiadne korene v DOM a **žiadna požiadavka** na `…/html/p1v-*`,
  - **žiadne** médiá obsahu, nič z `assets/img/1v/obsah/` ani sonda,
  - (paticka/popis: korene `display:none`, stĺpce pätičky skryté),
  - pätička a výška stránky ako bez obsahu (±40 px; konfigurátor sám kolíše ±7 px),
  - žiadne nové chyby v konzole, žiadny vodorovný posun.
- **s flagom (360, 390, 768, 1280):**
  - `lcd-1v`, `__lcd1v.chyby` prázdne; pri `cdn` stiahnuté oba kusy kľúča,
  - **kľúč len so stubmi:** `__lcd1v.obsah.stav = "nic"`, žiadne `.lcd-1v-obsah` ani `.p1v-miesto`, starý popis (záložky) viditeľný,
  - inak: `__lcd1v.obsah` = `hotovo` / zdroj / kľúč, `lcd-1v-obsah`, `.p1v-miesto` pred záložkami, korene v poradí a viditeľné, starý popis skrytý, `--gold` na koreni (alias titulky),
  - každá sekcia má výšku (okrem `*-pomocne`) a `.p1v-rv`,
  - **čísla:** každé `[data-p1v-cislo]` má `data-p1v-stav` a nič neostalo `visibility:hidden`; **odkazy:** každé `a[data-p1v-odkaz]` vedie na produkt typu v **tom istom vzore** (register),
  - sonda sa po posune stiahne,
  - žiadny prvok za okrajom okna (okrem vnútra posuvných pásov), žiadne nové chyby v konzole,
  - **kontroly skupín:** kľúč `598` → `tools/test-1v/obsah-a…d.mjs` (počty a správanie obsahu v26); iný kľúč → `obsah-<kľúč>.mjs` + skupiny z jeho `zdielane`.
- **`--sonda-cisla`:** do 1. kusu sa pridá sekcia `x-sonda-cisla` so všetkými kľúčmi čísel (+ neznámy kľúč = skrytý, `set-usetrite` mimo rohože = `data-p1v-bez`) a všetkými typmi odkazov. Očakávané hodnoty test zistí **sám** (GET živých stránok sestier, `[itemprop=price]` a `data-surcharge-final-price` selectov podľa `data-parameter-name`; register zo zdroja), nie z kódu webu.
- **Snímky** (`--snimky-sirky`, predvolene 390 a 1280): `<snimky>/<kľúč>/<sekcia>/web-<id>-<š>.png`, `navrh-<š>.png` (návrh kľúča) a `porovnanie-<id>-<š>.png`. Fixné a lepivé prvky (hlavička, lišta, chat) sa na snímku skryjú.

**Plugin skupiny** `tools/test-1v/obsah-<x>.mjs`:
- `sekcie = [{ meno, navrh: [{sel, text?, za?, pred?}] }]`: ako nájsť tú istú časť v návrhu. Snímka je spoločný obdĺžnik.
- `async kontroly(t)` → `[{ ok, popis, pozor? }]` (`pozor: true` = upozornenie, nie zlyhanie).
- `t` = pomocník `tools/test-1v/pomocnik.mjs` (skutočný klik s kontrolou zakrytia…) + `t.sekcia(meno)` (selektor) + `await t.je(meno)` + `t.produkt` `{ id, typ, vzor, kluc, url, cesta }` + `t.sestra(typ)` (cesta produktu typu v tom istom vzore).
- Plugin typu (`obsah-dvoj|classic|premium|boxy.mjs`): navyše `NAVRH` (súbor návrhu) a `zdielane` (skupiny A–D, ktorých kontroly platia bez zmeny).
- `obsah-a.mjs` (T0.3, `--produkt`): tlačidlo `a-ponuka` musí viesť na dvojvrstvové **toho istého vzoru**; na 610/613 bez značky `data-p1v-odkaz` (kým ju nedoplní T1.1) = upozornenie.

**Výsledok základu** (13. 10. 2026, všetky sekcie stub):
- `build-admin-html --check` OK,
- `vloz-lcd-css --check` OK,
- `test-1v-obsah`: pätička 12/12 OK (bez flagu 0 stiahnutých médií aj sond, výška +0 px), `--miesto popis` 8/8 OK,
- `test-konfigurator-1v` bez flagu 24 OK + 10 preskočených, `--novy` 34/34 OK,
- kontrolný beh s dočasnou sekciou (obrázok + video, potom zmazaná): bez flagu 0 z 3 médií stiahnutých, s flagom sekcia viditeľná so štýlmi titulky; našiel a opravil posun miesta o 7 px pri skrytom posuvníku.

**Výsledok integrácie** (14. 10. 2026, všetkých 17 sekcií, lokálny build):
- `build-admin-html` + `--check` OK, `--test` samotest OK; `vloz-lcd-css --check` OK,
- `test-1v-obsah` (pätička): 12/12 OK — bez flagu 1280/390: 0 zo 74 médií + sondy, výška +0/+2 px; `?novy=1` 360/390/768/1280: A 18–20, B 15, C 14–15, D 38 kontrol OK, bez vodorovného posunu a chýb konzoly,
- `test-1v-obsah --miesto popis` 360/390/768/1280: 10/10 OK,
- `test-konfigurator-1v` bez flagu 24 OK + 10 preskočených, `--novy` 34/34 OK,
- `test-boxy-prepni` SK + CZ (1-2, 2-1, 1-0, 2-0) 1280 aj 390: 8/8 OK,
- regresia lokálny build vs živý CDN (skript koordinátora, test fáza = bannery vložené do pätičky každej SK stránky): SK 601/610/613, CZ 2403, titulka SK/CZ, `/kosik/` SK/CZ, 390 aj 1280: 0 rozdielov bez flagu aj s `?novy=1`, 0 nových chýb, korene obsahu `display:none` so skrytým stĺpcom pätičky, 0 stiahnutých médií obsahu (košík pätičku nemá),
- celostranová galéria návrh v26 vs web (390, 1280): `scratchpad/navrhy/_prieskum/snimky/obsah/final/` (`index.html`, `porovnanie-<š>.jpg`, `sekcie/`).

**Oprava textov pred zápisom** (14. 10. 2026: uchytenie podľa pravidla zo 17. 9., video s náhľadom „NA MILIMETER.“ vynechané, `obsah-d.mjs` čaká 5 dlaždíc):
- `build-admin-html` + `--check` + `--test` OK; `vloz-lcd-css --check` OK; v `dist/` 0× „nepohne / uchytení / posúva a prekáža / milimeter / m1IitFACh1Y“,
- `test-1v-obsah` pätička 12/12 OK (bez flagu 0 zo 73 médií), `--miesto popis` 12/12 OK,
- `test-konfigurator-1v` bez flagu 24 OK + 10 preskočených, `--novy` 34/34 OK; `test-boxy-prepni` SK + CZ 1280 aj 390: 8/8 OK.

Výsledky T0.3 sú v sekcii 11.

## 7. Spustenie pre všetkých (neskôr, s Michalom)

Platí pre každú skupinu (`598` = 598/610/613, `dvoj`, `classic`, `premium`, `boxy`). Kus obsahu ide do **Popisu každého produktu skupiny** (rovnaký `dist` pre všetky tri vzory; čísla a odkazy dosadí `obsah-cisla.js` na stránke).
1. **Veľkosť:** `node tools/build-admin-html.mjs` → riadok `p1v-<kľúč>.sk … spolu`.
   - **≤ 45 000:** v `ciele.json` jedna časť `p1v-<kľúč>-1` so `sekcie: ["10","49"]`, kus 2 zmazať — **a v `obsah.js` + `pravidla.obsah-1v.kusy` znížiť `KUSY`** (build kontroluje počet kusov skupiny), `sk` = `{ "typ": "produkt", "id": <id>, "pole": "Popis (description)" }` pre každý produkt.
   - **> 45 000** (dnes `598`: 57 316 zn.): kus 1 → Popis, kus 2 nemá kam (pole má limit). Možnosti pre Michala: (a) obsah skrátiť o ~12 300 zn.; (b) kus 2 ostáva na CDN a `obsah.js` ho stiahne aj bez flagu (cesta b) bez brány — JS obsah, „web bez prekrývania“ len čiastočne); (c) kus 2 ako banner v pätičke, skrytý mimo produktov skupiny (HTML navyše na každej stránke natrvalo).
2. **Zrušiť bránu** (všetko v repe, jeden commit):
   - `ciele.json` `obal` bez `brana` (build už nedá `style="display:none"` ani `data-lcd-brana`),
   - v `index.js` pre typ zrušiť podmienku flagu (`jeZapnute`),
   - v `vloz-lcd-css.py` alias bez `body.lcd-1v` (`[data-lcd-cast^=p1v]`, aby obsah mal štýly aj bez JS),
   - v `_lcd1v-obsah.scss` zmazať body 1 a 2; v bodoch 3–9 a v `_lcd1v-obsah-*.scss` zmazať predponu `body.lcd-1v` (selektory koreňov `:is(#p1v-598-1,…)` ostávajú; bod 6c `.rv` bez `.p1v-rv` = obsah viditeľný aj bez JS),
   - `.lcd-1v-obsah` na body ostáva (pridáva ho `obsah.js`); kým JS nepríde, je obsah v Popise na mieste starého popisu, nie pod konfigurátorom — preto JS presun nechať, len bez flagu.
   - Značky `data-p1v-cislo` sú v Popise prázdne → bez JS sa číslo neukáže (nič nesprávne sa neukáže); `data-p1v-odkaz` má záložný `href` (Diamond) — na Hexa/Stripe bez JS vedie na Diamond, s JS na správny vzor.
3. **TinyMCE normalizácia (pred prvým zápisom, upozornenie z revízie):** Shoptet ukladá Popis cez TinyMCE, ktorý pri `setContent`/uložení HTML **normalizuje** — môže meniť poradie a úvodzovky atribútov, kódovať znaky na entity (`&nbsp;`, `&euro;`), mazať alebo presúvať komentáre `<!-- -->`, prázdne prvky, `<img>` bez `src` (8 fotiek farieb má len `data-src`), obaľovať inline uzly do `<p>`, prípadne odfiltrovať atribúty mimo schémy (`data-p1v-*`, `data-lcd-*`, `style`). Preto:
   - pred zápisom replika: rovnaká verzia a konfigurácia TinyMCE (`setContent(dist)` → `getContent()`), rozdiel voči `dist` zapísať a buď upraviť build tak, aby `dist` bol už v normalizovanom tvare, alebo rozdiel vedome prijať,
   - povinne overiť, že prežijú: `data-lcd-cast`, `data-lcd-sekcia`, `data-p1v-cislo|tvar|bez|odkaz`, `data-src`/`data-poster`, `loading="lazy"`, `<button type="button">`, `<!-- -->` v prázdnych prvkoch,
   - po zápise `--miesto zive` porovnáva len `data-lcd-v` (hash z buildu je atribút — TinyMCE ho nezmení, aj keď zmení obsah) → **nestačí**; k nemu snímky a porovnanie počtu sekcií, značiek a médií živého koreňa s `dist` (doplniť do testu pred spustením).
4. **Pred zápisom:** `test-1v-obsah --miesto popis --produkt <skupina>` + `test-konfigurator-1v` (oba režimy) + celý web zo smoke harnessu.
5. **Admin (koordinátor + Michal, runner):** presne podľa sekcie 9 B.
6. **Po zmazaní starého obsahu skontrolovať živý JS starého popisu:**
   - `main.js` lcdReviews/lcdVideos: widget sa vloží na koniec `.basic-description`, ktorá je skrytá,
   - `popisModuly.js` (nájde málo alebo nič),
   - `productPage.js` (prázdne `<p>`).
   - Konzola bez chýb. Ak treba, vypnúť ich pre dané produkty.
7. **Návrat:** Popis zo zálohy, `?v=`/sha predošlej verzie v HTML kódoch (poradie podľa `admin-html/README.md` „Návrat“). CDN kusy predošlej verzie ostávajú v jej `assets/v/<sha>/html/`.

## 8. Okno na fotky a videá `#p1v-lb` (skupina D, pre všetky skupiny)

Okno je statické HTML v `43-d-pomocne` (kus 2). `obsah-d.js` ho pod `body.lcd-1v` presunie priamo do `<body>` (nad hlavičkou, Luxiou aj lepivou lištou, z-index 2147483001). Zatvorené má atribút `hidden`.

**Bez JS kódu — atribúty na tlačidle alebo odkaze v obsahu** (klik zachytí delegovaný handler na `.p1v-miesto`):

| Atribút | Čo otvorí |
|---|---|
| `data-p1v-lb-foto="https://…/fotka.jpg"` | fotku (celá v okne, `object-fit: contain`) |
| `data-p1v-lb-yt="snb_QNjkcIs"` | YouTube (`youtube-nocookie`, rám 9:16 ako Shorts) |
| `data-p1v-lb-video="https://…/video.mp4"` | mp4 s ovládaním (rám 9:16) |
| `data-p1v-lb-popis="…"` | popis pod oknom. Bez neho: text `.cap` alebo `figcaption` vnútri, inak `alt` obrázka. |
| `data-p1v-lb-sada="meno"` | sada: všetky prvky s rovnakou sadou v poradí DOM. Šípky, klávesy ←/→, potiahnutie prstom, počítadlo „2 / 8“. Prvky v `[aria-hidden=true]` (klony pásov) sa preskočia. |

- Prvok je `<button type="button">` alebo `<a href="veľká fotka">`. Odkaz funguje aj bez JS (otvorí fotku).
- Handler skupiny, ktorý zavolá `preventDefault()`, má prednosť. D potom nič neotvorí.

**Z JS:**
```js
import { otvorOkno, zavriOkno } from "./obsah-d.js";
otvorOkno([{ typ: "foto", src, popis, alt }, …], index, prvokNaFokus); // false = okno nie je (stub / starý vzhľad) alebo neplatná položka
// alebo bez importu:
oc.vysli("obsah-d:okno", { polozky: [{ typ: "yt", src: "snb_QNjkcIs", popis: "…" }], index: 0 });
```

- Platné sú len `https://` alebo `/` adresy a YouTube id `[\w-]{6,20}`.
- Zatváranie: ×, Escape, klik na pozadie. Fokus sa vráti na prvok, ktorý okno otvoril. Stránka sa pod oknom neposúva (`html{overflow:hidden}` inline).
- Galéria titulky (`lx-gal`, skupina A) má vlastné zväčšenie `.lx-zoom` z `lxModulyOziv`. Okno D je pre ostatné fotky a videá (napr. referenčné videá `data-p1v-lb-yt`).

**Ďalšie správanie D, ktoré platí pre celý obsah:**
- **Odkaz na konfigurátor:** každý `a[href="#product-detail-form"]` (aj `[data-p1v-konf]`) v `.p1v-miesto`:
  - posunie na prvý nevyplnený krok (`ctx.prvyNevyplneny()`), otvorí ho a ostatné zatvorí (`__lcdSetStepOpen`),
  - keď je výber hotový, posunie na súhrn s tlačidlom košíka,
  - nikdy nič neodosiela.
  - Skupina, ktorá chce iné správanie, zavolá vo vlastnom handleri `preventDefault()`.
- **Odkaz na sekciu inej skupiny:** `data-p1v-ciel="a-referencie a-recenzie"` posunie na prvú existujúcu sekciu podľa `data-lcd-sekcia`. `href` je záloha (v teste `#p1v-598-1`).
- **Zlatá linka čítania `#p1v-citanie`** (v `<body>`): plní sa od začiatku po koniec `.p1v-miesto` (stred okna). Mimo obsahu je skrytá.
- **Pozor pre testy:** na telefóne Luxia asi po 25 s rozbalí pozdrav cez spodnú polovicu okna (360×348). Klik do stredu okna ho trafí. `tools/test-1v/obsah-d.mjs` (`klik`) preto kliká s prvkom v hornej tretine okna.

## 9. Zápis do adminu — presný postup (koordinátor + Michal; agenti do adminu nikdy nepíšu)

Platí pre SK admin (`luxurycardesign.sk`). CZ obsah 1V zatiaľ nemá. Zapisuje runner cez Michalov prihlásený Chrome (`admin-html/README.md`): **diff → Michal schváli → záloha → zápis → overenie**. Nikdy ručné vloženie do WYSIWYG ani ručné uloženie TinyMCE.

### 9 A. Skúška (teraz, D1 = b): do adminu sa obsah NEZAPISUJE

Obsah ide s verziou kódu na CDN (`assets/v/<sha>/html/`, `production.yml`). Jediný zápis v admine je prepnutie sha v SK HTML kódoch (plan.md §3 A, `docs/1v-kontrakt.md`), ktoré robí Michal po vydaní. Žiadne bannery, Popis žiadneho produktu sa nemení.

Predpoklady vydania:
1. `node tools/build-admin-html.mjs` (vydanie) → `dist/` vrátane všetkých `p1v-*.sk.html` a `manifest.json` commitnuté; `--check` OK, `python tools/vloz-lcd-css.py --check` OK.
2. Commit + push do `main`, CI zelené. Overenie po CI (pred prepnutím adminu):
   - `curl -s …/assets/v/<sha>/js/version.json` = sha,
   - `curl -sI -H "Origin: https://www.luxurycardesign.sk" …/assets/v/<sha>/html/p1v-598-1.sk.html` → `200`, `Access-Control-Allow-Origin: *` (prvé vydanie s `html/` — overiť, že CDN `.html` servíruje; `fetch` číta text bez ohľadu na Content-Type),
   - obsah súboru = `admin-html/dist/p1v-598-1.sk.html`.
3. Po prepnutí sha: `?novy=1` na 598 (a ďalších zapnutých typoch) obsah pod konfigurátorom (Michal na iPhone); bez flagu žiadna požiadavka na `…/html/` (DevTools → Network).

Návrat skúšky: sha predošlej verzie v SK HTML kódoch (obsah zmizne spolu s kódom). Nič iné sa nemenilo.

Starý postup D1 = a (2 bannery v Pätičke, `--miesto paticka`) sa nepoužíva; `obsah.js` by korene z pätičky stále našiel (cesta a), keby ich tam niekto vložil.

### 9 B. Spustenie pre všetkých (neskôr, po Michalovom „spusti“): Popis produktov skupiny

Predpoklady: kroky 1–4 zo sekcie 7 (veľkosť, brána zrušená v kóde, TinyMCE replika, kód nasadený a prepnutý, testy `--miesto popis`).

1. **Záloha:** pole „Popis“ každého produktu skupiny (SK admin, detail produktu; na webe `#description .basic-description`) celé do `C:/Users/M/Desktop/LCD/web/zalohy-admin/<dátum>/produkt-<id>-popis.sk.html` + dĺžka (598 dnes 42 440 zn.) + snímka. Bez zálohy sa nepokračuje.
2. **Ktorý súbor:**
   - súčet ≤ 45 000 zn. (riadok `p1v-<kľúč>.sk … spolu` v builde): jedna časť `p1v-<kľúč>-1` so `sekcie: ["10","49"]` → do Popisu **každého** produktu skupiny ide **celý** `admin-html/dist/p1v-<kľúč>-1.sk.html`;
   - nad limitom (dnes `598`: 57 316 zn. = 34 227 + 23 089) → do Popisu ide `dist/p1v-<kľúč>-1.sk.html`, kus 2 podľa rozhodnutia v sekcii 7 bod 1.
3. **Zápis:** runner nastaví obsah poľa „Popis“ cez API TinyMCE (`setContent` celého súboru), uloží produkt. Starý obsah sa tým nahradí celý (nič sa neprikladá). Rovnaký súbor pre všetky vzory skupiny.
4. **Overenie:** uložené HTML z adminu proti `dist` (rozdiely len tie, ktoré replika TinyMCE v sekcii 7 bod 3 vopred ukázala a boli prijaté), `node tools/test-1v-obsah.mjs --miesto zive --produkt <skupina>`, `test-konfigurator-1v` oba režimy, snímky 390/1280 na každom vzore (čísla a odkazy podľa vzoru).
5. **Návrat:** Popis zo zálohy (runner), kód podľa `admin-html/README.md` „Návrat“.

## 10. Integrácia 14. 10. 2026 — stav

**Veľkosť (build):** `p1v-598-1.sk` 34 238 zn. (rezerva 10 762), `p1v-598-2.sk` 23 472 zn. (rezerva 21 528) — každý kus je pod limitom 45 000. Spolu pre jedno pole Popisu 57 710 zn. (−12 710). Samotné CDN adresy obrázkov (84 × 96 zn. ≈ 8 000) to nevyriešia; jedno pole by vyžadovalo skrátiť obsah alebo nechať kus 2 v banneri.

**Zjednotené pri integrácii:**
- rytmus kapitol, zlaté nadpisy, `.lede`, reveal `.rv`, `.sr-only` a `overflow` `#content-wrapper` → základ (sekcia 5), zo skupín zmazané,
- reveal `.rv` v `obsah.js` (skupiny A–D ho mali každá zvlášť),
- jedno okno: galéria otvára fotky v `#p1v-lb` (sada 8 fotiek, šípky, potiahnutie, počítadlo); klik na kópiu pásu (`aria-hidden`) okno namapuje na originál,
- starý FAQ pri konfigurátore skrytý (FAQ bol dvakrát),
- telefón: pred a po lepí ako v návrhu (`#content-wrapper` `overflow-x:clip`),
- lepená scéna nie je pod lepivou lištou konfigurátora (do 991 px),
- hodnotenie pod H1 vedie na nové recenzie,
- miesto obsahu presne podľa `.overall-wrapper` (bez zaokrúhlenia: pri polovičných px bolo o 1 px vpravo).

**Pás 15 px vpravo na snímkach 1280:** artefakt testovacieho Chrome (emulácia počíta posuvník 15 px: `html`, hlavička aj päta majú 1265 px aj bez obsahu 1V), nie chyba obsahu.

**Rozhodnutia pre Michala (kód je pripravený, zmena je v jednom súbore):**
- lehota „25 – 35 dní“ (`32-c-casova-os`, 2×) vs návrh „21 – 29“ (vo vaulte ⛔ rozpor),
- tlačidlá recenzií podľa návrhu v26 (tmavé + zlatý rám) vs novšie „pilulky“ titulky (`_lcd1v-obsah-a.scss`),
- FAQ: 03 bez „a uchytení“, 12 „Aká je záruka…“ ponechané (vecná odpoveď), 05 vymenúva vrstvy bez počtu,
- video „Inštalácia na mieru pre V-klasu XL“ (m1IitFACh1Y) z pásu „Pozrite sa, ako fungujú v praxi“ **vynechané** (5 dlaždíc namiesto 6): náhľad `lcd-home/yt-m1IitFACh1Y.jpg` má vpálený text „NA MILIMETER.“. Návrat: nový náhľad bez textu (iný záber videa, napr. z YouTube `maxres2.jpg`, orezaný na 9:16) ako `assets/img/1v/obsah/d-realita-m1IitFACh1Y.jpg` + dlaždica späť v `40-d-realita` + test `obsah-d.mjs` na 6. Titulka (`hp-telo-1`) má ten istý náhľad — riešiť s Michalom osobitne,
- spustenie: kus 2 v banneri natrvalo, alebo obsah skrátiť o ~12 700 zn.,
- texty o uchytení (návrh v26) **upravené** podľa pravidla zo 17. 9. (upevnenie nie je argument, „obyčajný sa posúva“ nepísať): porovnanie riadok „Uchytenie“ → „Strih“ (presne podľa modelu, nezasahuje do pedálov ani koľajníc / približný, pri pedáloch a koľajniciach nesedí); deväť vecí 06 „Dvojité uchytenie, ktoré sa nepohne“ → „Suché zipsy aj klipy v balení“ (aj alt, aria-label, štítok „Montáž“); úvod bez „uchytení“ („o strihu, krytí, detailoch“); čo príde domov bez „koberec sa potom nepohne“. Titulka (`hp-*`) má pôvodné znenie — riešiť s Michalom osobitne.

**Vedomé odchýlky od návrhu:**
- pätka lepených scén („Zostavte si set“) má pod 1340 px vpravo 84 px pre bublinu chatu Luxia (pravidlo titulky); na telefóne by bublina nad lepivou lištou ležala na tlačidle — návrh chat nemá,
- cena v porovnaní: od integrácie WA (14. 10. 2026) ju dosadí `obsah-cisla.js` zo značky `data-p1v-cislo="cena-od"` v tvare návrhu „od 219 €“ (na Hexa/Stripe cena toho vzoru); `obsah-b.js` len ukáže riadok (`.ma-cenu`), keď je hodnota zistená. Konfigurátor ostáva v tvare Shoptetu „€219“.

**Technické, pred spustením:**
- TinyMCE: 8 veľkých fotiek farieb má len `data-src` (bez `src`) — overiť replikou, že ich uloženie Popisu neodstráni (v banneri nevadí),
- `Záhlavie` každej SK stránky má `<link rel="preload" as="image" fetchpriority="high" …/lcd-home/hero.jpg>` aj mimo titulky (145 kB) — samostatná úloha, obsahu 1V sa netýka,
- fotky recenzií z `reviews-data.js` majú 700×525 px a zobrazujú sa ako 54 px náhľady (rovnako na živom widgete) — návrh: scraper nech robí aj malé náhľady.

## 11. T0.3 (14. 10. 2026) — obsah pre všetky produkty: stav

**Čo pribudlo (worktree `spt-luxuryCar-1v-obsahjadro`, základ `31472c9`):**
- `obsah.js`: kľúč z registra (`ctx.produkt.obsah`), cesta a) korene v DOM / b) kusy z CDN verzie bundle (`OBSAH_CDN` predvolene `false` = `typeof LCD_OBSAH_CDN === "boolean" ? LCD_OBSAH_CDN : false`, `KUSY = 2`), stub-only = nič, chyba v ceste b) vráti len obsah, stav `window.__lcd1v.obsah`, modul typu po A–D.
- `obsah-cisla.js` (nový): `data-p1v-cislo` (17 kľúčov + veľkosti boxov), `data-p1v-tvar`, `data-p1v-bez`, `data-p1v-odkaz` (sekcia 4b).
- `obsah-dvoj|classic|premium|boxy.js` (stuby), `obsah-b.js` medzera dosiek podľa počtu, A–D hlavičky (sekcia, ktorú skupina nemá = nič).
- `admin-html/ciele.json`: 12 častí `p1v-<kľúč>-1|2` (598, dvoj, classic, premium, boxy, vzorky; `cz: null`, cieľ `cdn`, `naVsetkychStrankach: false`), pravidlá `cisla` / `odkazy` / `kusy`, 14 stránok `produkt-<id>`.
- `admin-html/src/p1v-dvoj|classic|premium|boxy|vzorky/` stuby sekcií (sekcia 3).
- `tools/build-admin-html.mjs`: kontroly značiek čísel a odkazov (aj samotest), skupina = presne `kusy` častí, obsah 1V len SK, výpis cieľa `cdn`, riadok „len stuby“.
- `.github/workflows/production.yml`: `cp admin-html/dist/p1v-*.sk.html "$REL/html/"`.
- Test: `--produkt`, `--vyvoj`, `--miesto cdn` (predvolené), `--sonda-cisla`, plugin typu + `zdielane`, upozornenia `pozor`, `t.produkt` / `t.sestra`; `obsah-a.mjs` a-ponuka podľa vzoru.

**Výsledky (lokálny build, živý web, každý POST na `/action/Cart/` zachytený a zrušený):**
- `build-admin-html --vystup %TEMP%/d` OK (22 súborov; 10 kusov typov len zo stubov, CZ pre p1v sa nestavia), `--test` samotest OK (vrátane 9 nových prípadov značiek); `p1v-598-1/-2` majú rovnaký obsah a hash ako pred T0.3 (`--check` hlási len chýbajúce nové `dist/p1v-<typ>-*` a manifest — vygeneruje vydanie).
- `test-1v-obsah --produkt 598` (CDN): 12/12 OK — bez flagu 0 požiadaviek na kusy, 0 zo 73 médií, výška +0 px; `?novy=1` 360/390/768/1280: A 18/18/20/20, B 15, C 14/14/14/15, D 38 kontrol = rovnako ako pred zmenou (pätička 10/10), výšky stránky zhodné.
- `--miesto paticka` 10/10 OK (zhodné so základom), `--miesto popis` 390/1280 8/8 OK.
- `--vyvoj --produkt 610`: 12/12 OK, obsah 598 pod konfigurátorom 610 bez chýb; 4 upozornenia = `a-ponuka` vedie na elite Diamond namiesto elite Hexa (chýba `data-p1v-odkaz`, doplní T1.1).
- `--len bez --produkt 598,610,601,619,616`: 20/20 OK — 0 požiadaviek na `…/html/p1v-*`, 0 na `img/1v/obsah/`, výška +0/+1/+8 px.
- `--vyvoj --produkt 601,619,628,616,637` (len stuby): 10/10 OK — stav `nic`, starý popis ostal.
- `--sonda-cisla --vyvoj --produkt 604` 390/1280: 4/4 OK — „od 362 €“, „3 farby“ a všetky ďalšie kľúče a odkazy zhodné s nezávislým GET (sekcia 4b).
- 2. kolo (po `OBSAH_CDN` predvolene `false` + `--define` v teste a druhom kole čísel pre kópie prvkov): `--produkt 598` 12/12, `--vyvoj --produkt 610 --bez-snimok` 10/10 (4 upozornenia a-ponuka), `--len bez` 5 produktov 20/20, `--miesto paticka` 10/10, `--miesto popis` 8/8, sonda 604 4/4, stuby 601/619/628/616/637 10/10 — všetko OK.
- `test-konfigurator-1v --produkt 598` bez flagu 24 OK + 10 preskočených; `--novy` 33/34 (1 scenár zakaždým iný — `platne` 1280 / `brana` 390 — s chybou spojenia „Chrome neodpovedal / spojenie sa zavrelo“ pri ~85 procesoch Chrome iných workerov), samostatný beh `--novy --krok brana,platne` 4/4 OK. S `OBSAH_CDN = true` a bez úpravy runnera bolo `--novy` 2/34 (len chyby CORS konzoly, viď nižšie).

**Zapnutie CDN cesty (prvé vydanie, plan.md §2.6 bod 2) — v tomto poradí:**
1. `tools/test-konfigurator-1v.mjs` (jadro, nie T0.3): runner musí obslúžiť `…/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html` z lokálneho `admin-html/dist` (vzor: `tools/test-1v/obsah-spolocne.mjs` `RE_HTML_KUS` v `novaStranka`), alebo ich vrátiť ako prázdne korene. Overené 14. 10.: s `OBSAH_CDN = true` a bez tejto úpravy `test-konfigurator-1v --novy --produkt 598` = 2 OK / 32 zlyhalo, jediná príčina 2 chyby konzoly „blocked by CORS policy“ na `…/v/fc20e3e/html/p1v-598-1|2.sk.html` (živá verzia `html/` nemá, 404 CDN nemá `Access-Control-Allow-Origin`).
2. `obsah.js`: `: false` → `: true` v `OBSAH_CDN`.
3. Vydanie podľa §2.6 (dist s `p1v-*.sk.html` commitnutý, `production.yml` ich skopíruje do `assets/v/<sha>/html/`), po CI `curl -sI` kusu (sekcia 9 A).

**Integrácia WA (14. 10. 2026):** body 1 a 2 hotové — `tools/test-konfigurator-1v.mjs` a `tools/test-boxy-prepni.mjs` pri lokálnom builde vrátia na kus prázdny koreň (konfigurátor sa testuje bez obsahu, obsah.js stav „nic“), `OBSAH_CDN` predvolene `true`. Bod 3 (push, CI, `curl -sI` kusu na CDN) ostáva na vydaní. `test-1v-obsah.mjs`: výška stránky bez flagu pri `--miesto cdn` je len upozornenie (HTML stránky sa bez flagu nemení, kolíše živá stránka), každá úloha má tvrdý limit 480 s.

