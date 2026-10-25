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
| `dvoj` | 601, 607, 604 | `src/p1v-dvoj/` | `p1v-dvoj-1/-2` | dvojvrstvove.html | hotové (T1.3, integrácia WB 14. 10.; `23-b-predapo` stub) |
| `classic` | 619, 625, 622 | `src/p1v-classic/` | `p1v-classic-1/-2` | kufor-classic.html | stuby — T2.3 nie je v integrácii WB (sekcia 12) |
| `premium` | 628, 634, 631 | `src/p1v-premium/` | `p1v-premium-1/-2` | kufor-premium.html | hotové (T2.4, integrácia WB) |
| `boxy` | 616 | `src/p1v-boxy/` | `p1v-boxy-1/-2` | boxy.html | hotové (T3.3, integrácia WB) |
| `vzorky` | 637 | `src/p1v-vzorky/` | `p1v-vzorky-1/-2` | vzorkovnik.html | hotové (T5.1b, integrácia WB) |

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
2. **Po kusoch** (od 25. 10. 2026, krok 2 spustenia — sekcia 7 bod 1 b):
   **a) Kus, ktorého koreň je v DOM** `[data-lcd-cast="p1v-<kľúč>-<n>"]` (Popis po spustení, starý test v pätičke) → ten, synchrónne (ako základ).
   **b) Kus, ktorý v DOM nie je, keď `OBSAH_CDN` (D1 = b; od integrácie WA 14. 10. 2026 v jadre predvolene `true` — sekcia 11; vypnúť sa dá bez úpravy kódu `--define:LCD_OBSAH_CDN=false`):** adresa bundle `…/assets/v/<sha>/js/luxuryCar.js` (skript na stránke) → `…/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html`, `fetch` (CORS: CDN posiela `Access-Control-Allow-Origin: *`, overené 14. 10. na `assets/v/fc20e3e/js/version.json`), HTML cez inertný `<template>` (nič sa nesťahuje ani nespúšťa, kým sa koreň nevloží). Len SK (`ctx.trh`). Nevyverzovaný bundle (bez `v/<sha>/`) = nič. Kus, ktorý nepríde (404, sieť), chýba.
   - Krok 2: v Popise je kus 1 (a), kus 2 príde z CDN (b) — `predstiahni` sťahuje len kusy, ktoré v DOM nie sú (bundle je synchrónny skript na konci `<body>`, Popis je už sparsovaný), a kus z CDN sa vloží na miesto podľa čísla (kus 2 za kus 1).
   - Výpadok CDN: kus z Popisu ostane, `chybaju = ["p1v-<kľúč>-2"]`, starý popis sa nevracia (v Popise už nie je). Chyba pri vložení kusu z CDN odoberie len ten kus (bez kusu z Popisu sa ako doteraz vráti celý obsah).
   Žiadna sekcia v koreňoch (len stuby) = nič, `window.__lcd1v.obsah.stav = "nic"`.
3. Vytvorí `div.p1v-miesto` **hneď pred** `.p-detail > .shp-tabs-wrapper` (záložky Popis/Diskusia) = priamo pod konfigurátorom, na celú šírku stránky (`.overall-wrapper`; `--p1v-sirka`, `--p1v-vlavo` podľa skutočnej geometrie).
4. Presunie korene doň v poradí kus 1, kus 2. Prázdny stĺpec pätičky (starý test) dostane `data-p1v-prazdny`.
5. Body dostane `.lcd-1v-obsah`. CSS (blok `LCD-1V-OBSAH`): ukáže korene v `.p1v-miesto`, **skryje záložky** (starý popis, Diskusia, Dodatočné parametre; ostávajú v DOM, JS na ne kotví).
6. `obsah-cisla.js` (synchrónne skryje nedosadené čísla a dosadí odkazy; hodnoty asynchrónne), potom `init(oc)` skupín A–D, potom **modul typu** (`obsah-dvoj.js`, `obsah-classic.js`, `obsah-premium.js`, `obsah-boxy.js`; `598` a `vzorky` nemajú).
7. Spoločný reveal `.rv` pre všetky sekcie (čo je vo výreze alebo nad ním hneď, zvyšok pri zobrazení), potom obal každej sekcie dostane `.p1v-rv`. Skupiny reveal nerobia.
- **Chyby:** cesta a) — výnimka modulu → `ctx.chyby`, `index.js` zloží celý nový vzhľad (ako základ). Cesta b) beží až po stiahnutí, keď je konfigurátor hotový a `index.js` už `ctx.chyby` nekontroluje → výnimka ide do `ctx.chyby` a **vráti sa len obsah** (`.p1v-miesto`, okno a linka čítania preč, `.lcd-1v-obsah` preč = starý popis späť); konfigurátor ostane nový.
- **Stav pre test a ladenie:** `window.__lcd1v.obsah = { kluc, zdroj: "dom"|"cdn"|"dom+cdn"|null, stav: "nic"|"caka"|"hotovo"|"chyba", kusy, casti: { "p1v-<kľúč>-<n>": "dom"|"cdn" }, chybaju: [kusy z CDN, ktoré neprišli], hotovo (Promise, keď sa sťahuje z CDN), cisla (Promise) }`. Krok 2: `zdroj "dom+cdn"`, `casti { -1: "dom", -2: "cdn" }`, `kusy 2`.

**Štýly titulky platia aj na obsahu.** `vloz-lcd-css.py` mení v bloku `LCD-HOME`:
- pôvodne: `#lcd-home` → `:is(#lcd-home,[data-lcd-cast^=hp])`,
- teraz: `#lcd-home` → `:is(#lcd-home,[data-lcd-cast^=hp],body.lcd-1v [data-lcd-cast^=p1v])` (všetky kľúče).

Dôsledky:
- Korene dostanú premenné (`--ink`, `--gold`, `--sand`…), písmo a všetky moduly titulky: `.chapter`, `.wrap`, `.rule`, `.lede`, `h2`, `lx-*` (galéria, farby, pred a po), `.deck`, `.revs`…
- Tie sú aj prvou časťou CSS návrhu. **Skupiny teda píšu len rozdiely oproti titulke**, nekopírujú 370 riadkov `lx-*`.
- Špecificita ostáva (1,0,0). Bez flagu alias nič nevyberá.
- `luxuryCar.css`: +~39 kB surových, +~2 kB brotli.
- **Vybavené (integrácie WA a WB 14. 10. 2026):** body 5–6 základu `_lcd1v-obsah.scss` a partialy A–D cielia `:is(#p1v-598-1,#p1v-598-2,.p1v-obsah)` — `:is()` berie špecificitu najšpecifickejšieho argumentu (1,0,0), takže prebije LCD-HOME rovnako, ale vyberie koreň každého kľúča. Typy už nemajú kópie týchto pravidiel (premium TEMP-JADRO-KOPIA a boxy ZAPLATA-ROZSAH zmazané). Fotky náhľadov Deväť vecí (data-i 0–8) a legenda pred a po (pp-1…4) v B sú viazané len na korene 598 — iný kľúč dáva vlastné.

**Kapitoly návrhu** (`.kap[data-k=1–4]` = 4 tematické skupiny, 2. a 4. na svetlom podklade):
- Obal sekcie nesie `data-lcd-kap="N"`. Kapitola 2 má totiž sekcie dvoch skupín (B + C).
- Podklad, linky a rytmus odsadení `section.chapter` dáva `LCD-1V-OBSAH` bod 5.
- Ktorú kapitolu má sekcia, píše hlavička jej súboru.

## 3. Súbory a vlastníctvo

| Skupina | Sekcie (`admin-html/src/p1v-598/`, `data-lcd-sekcia`) | JS | CSS | Test |
|---|---|---|---|---|
| **A** | `10-a-recenzie` (prvé pod konfigurátorom; hneď za ním je `10-b-predapo` skupiny B, § 16), `11-a-referencie`, `12-a-galeria`, `13-a-ponuka` (Jazdíte aj v zime?, bez tlačidla) | `konfigurator1v/obsah-a.js` | `assets/css/_lcd1v-obsah-a.scss` | `tools/test-1v/obsah-a.mjs` |
| **B** | `10-b-predapo` (Pred a po, od 24. 10. 2026 hneď za recenziami, § 16), `20-b-ocakavat` (Deväť vecí + `#s2Mob`), `21-b-material`, `22-b-porovnanie` (+ výzva) | `obsah-b.js` | `_lcd1v-obsah-b.scss` | `obsah-b.mjs` |
| **C** | `30-c-kam` (+ výzva), `31-c-domov`, `32-c-casova-os` (+ výzva), `33-c-farby`, `34-c-vzorky` | `obsah-c.js` | `_lcd1v-obsah-c.scss` | `obsah-c.mjs` |
| **D** | `40-d-realita`, `41-d-faq`, `42-d-koniec` (Kúpiť a nečakať), `43-d-pomocne` (zlatá linka `#citanie`, okno `#lb`) | `obsah-d.js` | `_lcd1v-obsah-d.scss` | `obsah-d.mjs` |

**Moduly typov (T0.3, stuby — vlastník = obsahová úloha typu):**

| Kľúč | Sekcie (`admin-html/src/p1v-<kľúč>/`) | JS (po A–D) | CSS | Test plugin | Úloha |
|---|---|---|---|---|---|
| `dvoj` | 17 stubov s menami 598 (`23-b-predapo` ostáva stub) | `obsah-dvoj.js` | `_lcd1v-obsah-dvoj.scss` | `tools/test-1v/obsah-dvoj.mjs` | T1.3 |
| `classic` | 19 stubov, nové `23-classic-premium`, `31-classic-box` | `obsah-classic.js` | `_lcd1v-obsah-classic.scss` | `obsah-classic.mjs` | T2.3 |
| `premium` | 17 stubov, nové `22-premium-porovnanie`, `30-premium-kryje` | `obsah-premium.js` | `_lcd1v-obsah-premium.scss` | `obsah-premium.mjs` | T2.4 |
| `boxy` | 15 stubov, nové `21-boxy-velkosti`, `40-boxy-cross`; 23. 10. 2026 zmazané `30-c-kam` a `31-c-domov` (opakovali „Osem vecí“) | `obsah-boxy.js` | `_lcd1v-obsah-boxy.scss` | `obsah-boxy.mjs` | T3.3 |
| `vzorky` | `10-c-casova-os`, `20-vzorky-vratenie` (kotva „Ako na to“), `30-a-ponuka`, `40-d-faq` | — (A, C, D stačia) | `_lcd1v-obsah-vzorky.scss` (blok `LCD-1V-OBSAH-VZORKY`) | `obsah-vzorky.mjs` | T5.1b |
| `kamiony` (640) | kus 1: `10-kamiony-galeria`, `12-kamiony-co-dostanete`, `14-kamiony-materialy`, `16-kamiony-detaily`, `18-c-casova-os`, `20-kamiony-dopravcovia` (`#p1v-kamiony-dopravcovia`); kus 2: `30-a-recenzie`, `40-d-faq` (7 otázok zo vzoru, nie živé /faq/), `42-kamiony-vyzva`, `43-d-pomocne`. Texty = schválený vzor kamiony-app (`texty.json obsah.*`), poradie vzoru; obrázky len z webu (fotky produktu 640 `…/user/shop/big/640-N_…`, obrázky konfigurátora `IMG_BASE`); čísla `cena-od`, `kamion-material-presivana`, `kamion-tapacir`, `kamion-tapacir-samostatne` | `obsah-kamiony.js` (prázdny: okno fotiek = `data-p1v-lb-foto`, A, C, D stačia) | `_lcd1v-obsah-kamiony.scss` (blok `LCD-1V-OBSAH-KAMIONY`) | `obsah-kamiony.mjs` | kamióny OBSAH (docs/kamiony-1v-plan.md §4) |

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
| `cena-od-<typ>-<vzor>` (vzor = `diamond` / `stripe` / `hexa`) | to isté v ZADANOM vzore (Classic FAQ 11 „Diamond Line je v základnej cene 230 €, Stripe Line stojí 240 € …“; integrácia 14. 10. 2026 — nahradilo vlastné `data-cl-cena` v `obsah-classic.js`) | `cenaTypu(…, typ, vzor)` |
| `set-classic`, `set-premium` | príplatok „autokoberce do kufru“ (dno / dno + boky) na jednovrstvovom produkte vzoru | `priplatkyTypu(…, "jedno", vzor)` |
| `set-usetrite` | na rohoži Classic/Premium: `cena-od` − príslušný `set-*` (inde nezistené → `data-p1v-bez`) | |
| `set-usetrite-classic` / `-premium` | kdekoľvek: `cena-od-classic` − `set-classic` (resp. Premium) | |
| `box-sam-S…XL` | 616: základ + príplatok 1. boxu veľkosti | stránka 616 |
| `box2-sam-S…XL` | 616: príplatok 2. boxu | stránka 616 |
| `box-set-S…XL` | jednovrstvové vzoru (stránka boxu = 598): príplatok „Box solo“ | |
| `box-set2-S…XL` | jednovrstvové vzoru: príplatok 1. boxu (dva boxy v sete) | |
| `pocet-farieb`, `pocet-farieb-2` | počet farieb 1. / 2. vrstvy tohto produktu — **len vo vete o vzore tohto produktu**, nikdy vo vete, ktorá menuje všetky tri vzory (604 „3 farby“ by tvrdilo, že celá ponuka má 3 farby) | `ctx.moznosti("farba" / "farba2")` |
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
  - bod 6: zlaté nadpisy `.chapter h2` / `.pinhead h2`, `.lede{max-width:46ch}` okrem `.pinhead .lede` (70ch), `.setb .lede` (54ch) a `.end .lede` (56ch), ktoré ostávajú z titulky ako v návrhoch (integrácia WB), reveal `.rv` viditeľné bez `.p1v-rv`, `.sr-only` / `.p1v-sr`,
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
node tools/test-1v-obsah.mjs --miesto popis-cdn --produkt 598,601,616,619,628 --sirka 390,1280 --paralelne 2 --bez-snimok   # krok 2: kus 1 (--bez-webp) v Popise, kus 2 z CDN + výpadok CDN
node tools/test-1v-obsah.mjs --miesto paticka   # starý test D1 = a (bannery v pätičke)
node tools/test-1v-obsah.mjs --miesto zive      # nič sa nevkladá ani neobsluhuje: obsah zo živej stránky / živej CDN verzie
node tools/test-konfigurator-1v.mjs             # konfigurátor bez flagu (musí ostať zelený)
node tools/test-konfigurator-1v.mjs --novy      # konfigurátor s ?novy=1 (musí ostať zelený)
```

**`test-1v-obsah`** (T0.3) zostaví HTML obsahu (`--vystup`), JS a CSS ako CI do dočasného priečinka a otvorí živé stránky produktov z `--produkt` (register `konfigurator1v/produkty.js` sa číta zo zdroja: typ, vzor, adresa, kľúč obsahu, `ZAPNUTE_TYPY`; `?novy=1` na nezapnutom type = chyba použitia, treba `--vyvoj`). Bundle a CSS nahradí lokálnym buildom (adresa `…/assets/v/<sha>/js/luxuryCar.js` ostane, takže `obsah.js` počíta CDN adresu presne ako naživo). Miesto obsahu (`--miesto`):
- **`cdn` (predvolené, D1 = b):** nič sa do stránky nevkladá. Požiadavky `…/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html` test obslúži lokálnym dist (+ sonda), neznámy kus = 404 ako CDN. Základ „bez obsahu“ dostane prázdne korene.
- `paticka` / `popis`: kusy vložené do dokumentu produktu (pätička = starý test, Popis = spustenie). `zive`: nič.
- **`popis-cdn` (krok 2 spustenia, sekcia 7 bod 1 b):** do Popisu len kus 1 postavený `--bez-webp` (presne to, čo pôjde do adminu), CDN obslúži všetky kusy lokálnym dist (s WebP). S flagom kontroluje navyše: `zdroj "dom+cdn"`, `casti`, z CDN sa stiahol len kus 2 (nie kus z Popisu), v `.p1v-miesto` všetky sekcie skupiny v poradí, žiadny kus, sekcia ani id dvakrát, `data-lcd-v` kusu 1 = verzia `--bez-webp`. Úloha **výpadok CDN** (každá šírka s flagom, vypne `--bez-vypadku`): kusy z CDN zlyhajú ako výpadok siete → kus 1 na mieste a viditeľný so svojimi sekciami (oživené), `stav "hotovo"`, `chybaju` = kus 2, starý popis skrytý. Poloha (End + posun hore, reload pri FAQ) beží tiež s kusom 1 v Popise.
- Základ (`popis`, `popis-cdn`): kusy v Popise nahrádzajú starý popis, preto má základ Popis s prázdnymi koreňmi (výška bez flagu = starý vzhľad `?novy=0` bez starého popisu; s plným starým popisom by sa porovnávalo ≈ −10 500 px na 598 @1280).

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
- `obsah-a.mjs`: „poradie A“ = `a-recenzie` je prvá sekcia pod konfigurátorom, potom referencie, galéria, `a-ponuka` (platí pre 598 aj dvoj); `a-ponuka` **nemá tlačidlo ani odkaz** na iný produkt (od 15. 10. 2026; predtým T0.3: tlačidlo na dvojvrstvové toho istého vzoru).

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

Platí pre každú skupinu (`598` = 598/610/613, `dvoj`, `classic`, `premium`, `boxy`). Kus obsahu ide do **Popisu každého produktu skupiny** (rovnaký súbor pre všetky tri vzory; čísla a odkazy dosadí `obsah-cisla.js` na stránke).

**Ktorý súbor ide do Popisu (od 25. 10. 2026):** kus postavený **bez obalov `<picture>`** — `node tools/build-admin-html.mjs --vystup <priečinok> --bez-webp` → `<priečinok>/p1v-<kľúč>-N.sk.html`. `admin-html/dist/` je verzia pre CDN: build v nej obalí fotky obsahu do `<picture>` so zmenšeným WebP (commit c5edd1f), preto je dlhšia a do Popisu nepatrí (limit 45 000 zn. by nesedel; TinyMCE by obaly mohol prerobiť). Riadok `p1v-<kľúč>.sk … spolu` a kontrola limitu v builde počítajú dĺžku už bez obalov.

**WebP pre kus 1 z Popisu (25. 10. 2026 v noci):** build zapíše do bundla mapu obalov kusu 1
(`assets/js/components/konfigurator1v/obsah-webp-mapa.js`, generovaná, `--check` ju stráži): `data-lcd-v` kusu
`--bez-webp` a pre každú obalenú fotku meno JPG, poradie medzi `<img>` s tým istým `src`, šírky WebP, `sizes`, `media`.
`obsah-webp.js` (volá `obsah.js`, cesta a) pri umiestnení kusu z Popisu, kým je koreň ešte skrytý, obalí tie isté `<img>`
do toho istého `<picture>` ako dist (synchrónne, bez siete, `<picture>` má `display:contents`). Stav: `__lcd1v.obsah.webp`
= `{ "p1v-<kľúč>-1": počet | "iná verzia" | "bez mapy" | "bez lazy" }`. **Po zmene `src` kusu 1** treba do Popisu nahrať
nový `--bez-webp` kus spolu s prepnutím sha — inak `data-lcd-v` v Popise nesedí s mapou a fotky ostanú JPG (nič sa
nepokazí, len bez WebP). Prehliadač bez natívneho `loading="lazy"` (Safari < 15.4) dostane JPG ako doteraz (JPG už
sťahuje od parsovania, obal by pridal WebP navyše). Test: `test-1v-obsah --miesto popis-cdn` (počet a atribúty
`<picture>` ako dist, po prejdení obsahu žiadny JPG fotky, ktorá má pri tej šírke WebP).

1. **Veľkosť:** `node tools/build-admin-html.mjs` → riadok `p1v-<kľúč>.sk … spolu` (bez obalov WebP = to, čo pôjde do Popisu).
   - **≤ 45 000:** v `ciele.json` jedna časť `p1v-<kľúč>-1` so `sekcie: ["10","49"]`, kus 2 zmazať — **a v `obsah.js` + `pravidla.obsah-1v.kusy` znížiť `KUSY`** (build kontroluje počet kusov skupiny), `sk` = `{ "typ": "produkt", "id": <id>, "pole": "Popis (description)" }` pre každý produkt.
   - **> 45 000** (dnes `598`: 57 316 zn.): kus 1 → Popis, kus 2 nemá kam (pole má limit). Možnosti pre Michala: (a) obsah skrátiť o ~12 300 zn.; (b) kus 2 ostáva na CDN a `obsah.js` ho stiahne aj bez flagu (cesta b) bez brány — JS obsah, „web bez prekrývania“ len čiastočne); (c) kus 2 ako banner v pätičke, skrytý mimo produktov skupiny (HTML navyše na každej stránke natrvalo).
   - **Michal 25. 10. 2026: (b).** `obsah.js` berie korene po kusoch (sekcia 2): kus 1 z Popisu, chýbajúci kus 2 z CDN verzie bundle za ním; pri výpadku CDN ostane kus 1. Test: `test-1v-obsah --miesto popis-cdn` (sekcia 6).
2. **Zrušiť bránu** (všetko v repe, jeden commit):
   - `ciele.json` `obal` bez `brana` (build už nedá `style="display:none"` ani `data-lcd-brana`),
   - v `index.js` pre typ zrušiť podmienku flagu (`jeZapnute`),
   - v `vloz-lcd-css.py` alias bez `body.lcd-1v` (`[data-lcd-cast^=p1v]`, aby obsah mal štýly aj bez JS),
   - v `_lcd1v-obsah.scss` zmazať body 1 a 2; v bodoch 3–9 a v `_lcd1v-obsah-*.scss` zmazať predponu `body.lcd-1v` (selektory koreňov `:is(#p1v-598-1,…)` ostávajú; bod 6c `.rv` bez `.p1v-rv` = obsah viditeľný aj bez JS),
   - `.lcd-1v-obsah` na body ostáva (pridáva ho `obsah.js`); kým JS nepríde, je obsah v Popise na mieste starého popisu, nie pod konfigurátorom — preto JS presun nechať, len bez flagu.
   - Značky `data-p1v-cislo` sú v Popise prázdne → bez JS sa číslo neukáže (nič nesprávne sa neukáže); `data-p1v-odkaz` má záložný `href` (Diamond) — na Hexa/Stripe bez JS vedie na Diamond, s JS na správny vzor.
3. **TinyMCE normalizácia (pred prvým zápisom, upozornenie z revízie):** Shoptet ukladá Popis cez TinyMCE, ktorý pri `setContent`/uložení HTML **normalizuje** — môže meniť poradie a úvodzovky atribútov, kódovať znaky na entity (`&nbsp;`, `&euro;`), mazať alebo presúvať komentáre `<!-- -->`, prázdne prvky, `<img>` bez `src` (8 fotiek farieb má len `data-src`), obaľovať inline uzly do `<p>`, prípadne odfiltrovať atribúty mimo schémy (`data-p1v-*`, `data-lcd-*`, `style`). Preto:
   - pred zápisom replika: rovnaká verzia a konfigurácia TinyMCE (`setContent(<kus bez obalov>)` → `getContent()`; kus = `--bez-webp`, pozri vyššie), rozdiel voči nemu zapísať a buď upraviť build tak, aby kus bol už v normalizovanom tvare, alebo rozdiel vedome prijať,
   - povinne overiť, že prežijú: `data-lcd-cast`, `data-lcd-sekcia`, `data-p1v-cislo|tvar|bez|odkaz`, `data-src`/`data-poster`, `loading="lazy"`, `<button type="button">`, `<!-- -->` v prázdnych prvkoch,
   - po zápise `--miesto zive` porovnáva len `data-lcd-v` (hash z buildu je atribút — TinyMCE ho nezmení, aj keď zmení obsah) → **nestačí**; k nemu snímky a porovnanie počtu sekcií, značiek a médií živého koreňa s kusom bez obalov (doplniť do testu pred spustením).
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
- **Fotka a pomalá sieť (25. 10. 2026):** galéria ukazuje zmenšené WebP, okno plný JPG z `data-p1v-lb-foto`. Kým JPG nie je stiahnutý, okno ukáže hneď fotku, ktorú prehliadač už má (`currentSrc` kliknutej fotky, šírka súboru z `srcset` obalu `<picture>`) v rozmere plnej fotky (atribút `width` obrázka = rozmer JPG) a plný JPG ju nahradí po stiahnutí — rám neposkočí. Atribút `src` obrázka v okne je vždy plná fotka. Myšou sa JPG začne sťahovať už pri stlačení (`pointerdown`), dotykom nie (potiahnutie pásu). Bez `width` alebo bez obalu `<picture>` (napr. fotky titulky, kamióny) ako doteraz rovno plná fotka.
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
2. **Ktorý súbor:** vždy kus **bez obalov `<picture>`** — `node tools/build-admin-html.mjs --vystup <priečinok> --bez-webp` (nie `admin-html/dist/`: tam sú obaly WebP pre CDN a kus je dlhší; sekcia 7):
   - súčet ≤ 45 000 zn. (riadok `p1v-<kľúč>.sk … spolu` v builde): jedna časť `p1v-<kľúč>-1` so `sekcie: ["10","49"]` → do Popisu **každého** produktu skupiny ide **celý** `<priečinok>/p1v-<kľúč>-1.sk.html`;
   - nad limitom (dnes `598`: 57 316 zn. = 34 227 + 23 089) → do Popisu ide `<priečinok>/p1v-<kľúč>-1.sk.html`, kus 2 podľa rozhodnutia v sekcii 7 bod 1.
3. **Zápis:** runner nastaví obsah poľa „Popis“ cez API TinyMCE (`setContent` celého súboru), uloží produkt. Starý obsah sa tým nahradí celý (nič sa neprikladá). Rovnaký súbor pre všetky vzory skupiny.
4. **Overenie:** uložené HTML z adminu proti zapísanému súboru bez obalov z bodu 2 (rozdiely len tie, ktoré replika TinyMCE v sekcii 7 bod 3 vopred ukázala a boli prijaté), `node tools/test-1v-obsah.mjs --miesto zive --produkt <skupina>`, `test-konfigurator-1v` oba režimy, snímky 390/1280 na každom vzore (čísla a odkazy podľa vzoru).
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

## 12. Integrácia WB (14. 10. 2026) — obsah dvojvrstvových, Premium, boxu a vzorkovníka

**Zlúčené (worktree `spt-luxuryCar-1v-int2`, základ `3cdcd96`):** T1.3 dvoj, T2.4 premium, T3.3 boxy, T5.1b vzorky. **T2.3 Classic nie je zlúčené** (stav úlohy „partial“ a kontrola neprešla — ostáva v `spt-luxuryCar-1v-c-classic`, na 619/622/625 sú zatiaľ stuby: nič sa neukáže, starý popis ostane).

**Opravy jadra:**
- CSS: scope `.p1v-obsah` (sekcia 2), `.lede` 46ch nie pre úvod scén a záver (sekcia 5), fotky náhľadov a legendy pred a po v B len pre 598; dočasné kópie pravidiel jadra v partialoch premium a boxy zmazané; nový blok `LCD-1V-OBSAH-VZORKY` vo `vloz-lcd-css.py`.
- Čísla vo FAQ: `test-1v-obsah.mjs` berie **vlastnú** viditeľnosť čísla (inline `visibility:hidden` z `obsah-cisla.js`, kým čaká, alebo hidden, ktoré nededí od rodiča) a stav `caka` = nedosadené. Číslo v zbalenej odpovedi FAQ dedí hidden od `.p1v-faq-a` a je v poriadku → vo FAQ sa píše štandardná značka `data-p1v-cislo` (boxy už nemá `data-p1v-faq-cislo`, premium nemá obchádzku `visibility:visible` + `aria-hidden`; dvoj má späť číslo vo FAQ 3 ako v návrhu).
- Dvoj FAQ 10 (oprava po revízii WB): integrácia vrátila do vety „tri vzory prešívania — Diamond Line, Stripe Line a Hexa Line — a … farieb“ `pocet-farieb`, takže 604 tvrdilo „a 3 farby“, 607 „a 8 farieb“ (Diamond má 18). Číslo je preč (znenie ako worker `afae8e5`, „a farby materiálu a nite“; návrhové „18 farieb“ platí len pre Diamond → D3). Plugin `obsah-dvoj.mjs` kontroluje doslovné znenie odpovede 10 a že v nej nie je žiadne číslo ani `data-p1v-cislo`.
- `data-p1v-bez` build povoľuje len spolu s `data-p1v-cislo`.
- Test: plugin `obsah-vzorky.mjs` zapojený (`PLUGINY.vzorky`), tvrdý limit úlohy 480 s, výška bez flagu pri `cdn` len upozornenie (ako WA), snímka čaká 1,4 s na prechody lepených scén, sekcia `*-pomocne` nehlási „nemá mapu“, D (linka čítania, okno, FAQ, šípka reality, posun „Zadajte údaje o vozidle“) a B (rez materiálu na telefóne, legenda) čakajú na stav namiesto pevných pauz.

**Veľkosti (build):** `p1v-dvoj` 33 363 + 21 495 zn., `p1v-premium` 32 413 + 26 242, `p1v-boxy` 26 312 + 22 382, `p1v-vzorky` 1 970 + 3 910 — každý kus ≤ 45 000. Spolu pre jedno pole Popisu po spustení: dvoj 54 858 (−9 858), premium 58 655 (−13 655), boxy 48 694 (−3 694), vzorky 5 880 (OK) — pri spustení pre všetkých platí sekcia 7 (rozhodne Michal, rovnako ako 598 s 57 316).

**Neurobené (nie chyby, ale chýbajúce kľúče čísel — obsah ich podľa D3 vynechal):** `cena-od-<typ>-<vzor>` (cena rohože iného vzoru, Classic FAQ 11), `pocet-farieb-classic` a rozdiel ceny medzi vzormi (Premium porovnanie a FAQ 12).

## 13. Finálna integrácia (14. 10. 2026) — všetky typy za `?novy=1`

- **Brána:** `ZAPNUTE_TYPY` = jedno, dvoj, kufor-classic, kufor-premium, boxy, vzorky (13 SK produktov + vzorkovník). Obsah sa pre každý typ berie z CDN verzie bundle (D1 = b, `OBSAH_CDN`), nič ďalšie sa neprepína.
- **T2.3 Classic zlúčené** (worktree `spt-luxuryCar-1v-c-classic`, `b802f8d`) + dorobené: FAQ 9/10/11 len štandardné `data-p1v-cislo` (FAQ 11 nový kľúč `cena-od-classic-<vzor>`), obchádzky zmazané (inline `visibility:visible` na číslach FAQ a CSS `display:none` zbalených čísel — test jadra berie vlastnú viditeľnosť čísla), odsadenie upsellu boxu overené proti návrhu (1280 px: linka 1 px + 61 px nad kartou, 124 px od „Kam všade rohož siaha“; 390 px: 1 px + 38 px, 77 px — zhodne s `kufor-classic.html`). D3 ostáva: žiadna dodacia lehota, „logo“ ani „kovový štítok“.
- **Farby vlastného vzoru** (`obsah-c.js` `farbyVzoru`): na 610/613, 622/625, 631/634 sa sekcia `c-farby` (statické vzorky Diamond Line) pred oživením prestaví z farieb produktu (živý krok Farba: názov `data-lcd1v-nazov`, fotka vzorky konfigurátora), „Vzorka · Hexa Line“, počítadlo; úvodná veta o autách -> „Vyberte vzorku a pozrite si materiál aj prešívanie zblízka.“ (návrh `boxy.html`); „Mnoho ďalších farieb“ na vlastný konfigurátor sa skryje (všetky farby sú vo vzorkách), odkaz na dvojvrstvové (`data-p1v-odkaz`) ostáva. Dvojvrstvové (zmiešané skutočné fotky rôznych vzorov) a box (len Diamond) sa nemenia. Test: `tools/test-1v/obsah-c.mjs` (bez Diamond textu, fotiek `img/farby/` a s počtom vzoriek = počet farieb produktu).
- **Tvar cien** v celom novom vzhľade „230 €“ (`ctx.formatCena` = `sumaText` v `ctx.js`, `obsah-cisla.js` `formatCena` to isté); cenová karta, „Spolu“ a lišta zrkadlia živú cenu, ale prepíšu ju do tohto tvaru. Shoptetové „€230“ ostáva len v jeho skrytých prvkoch. Testy (`ovladac-cena.mjs`, `ovladac-vzorky.mjs`) tvar vyžadujú.
- **Test obsahu:** výška bez flagu sa porovnáva so základom meraným dvakrát (tolerancia 40 px + 2 × kolísanie základu, pri prekročení ešte jedno meranie) — znova tvrdá chyba aj pri `--miesto cdn`; každá úloha má navyše `Promise.race` s limitom 480 s (pracovník nečaká na zamrznutý Chrome).

## 14. Recenzie hore, porovnanie bez tlačidla (15. 10. 2026, Michal)

- Michal (snímky dvojvrstvových z telefónu): „Toto porovnanie jednovrstvové a dvojvrstvové vymeň s recenziami a nedávaj tam tlačidlo pozrieť jednovrstvové — my chceme, aby sme zákazníka nechali tu na tomto odkaze.“
- **598 aj dvoj:** súbory prehodené — `10-a-recenzie` (Hodnotenia priamo z Google) je prvá sekcia pod konfigurátorom, `13-a-ponuka` (598 „Jazdíte aj v zime?“, dvoj „Jednovrstvové alebo dvojvrstvové?“ s tabuľkou `.vs2`) je za galériou. Obe ostávajú v kuse 1 (10–29), id, triedy a JS bez zmeny (`obsah-a.js` hľadá sekcie podľa mena, nie poradia).
- **Tlačidlo preč:** `a.btn[data-p1v-odkaz]` („Pozrite si jednovrstvové“ / „Pozrite si dvojvrstvové“) zmazané, iný odkaz sa nepridal. Ceny v tabuľke dvoj ostávajú živé (`data-p1v-cislo`). Druhú vrstvu na 598 ponúka konfigurátor (karta „Áno“, `druha-vrstva.js`).
- **Odsadenie:** trieda `after-dark` (väčšie odsadenie hore za tmavou galériou) presunutá z recenzií na `a-ponuka`; pravidlo v `_lcd1v-obsah-a.scss` je teraz `section.chapter.after-dark[data-lcd-sekcia^="a-"]` (classic, premium a boxy majú `after-dark` stále na recenziách → bez zmeny).
- Ostatné kľúče (classic, premium, boxy, vzorky) sa nemenili — ich odkazy na iné produkty sú zatiaľ na mieste (zoznam v odovzdaní koordinátorovi).

## 15. Vrstvy vždy pomenované, nadpis 598 bez odkazu (15. 10. 2026, Michal)

- Michal: „vždy to povedz poriadne… prvá prešívaná vrstva… aby ten zákazník presne vedel, o ktorú vrstvu sa jedná, prvú a druhú.“
- **Pravidlo pre zákaznícky text (konfigurátor aj obsah):** „prvá prešívaná vrstva“ (alebo „prvá vrstva“, keď „prešívaná“ už padlo v tej istej vete) a „druhá vrstva“ — nikdy samotné „prešívaná vrstva“, „vrchná vrstva“ ani „vrstva“, keď nie je jasné, ktorá. Materiál navrchu je **„umelá koža“, nikdy „ekokoža“ / „eko-koža“** (Michal 22. 10. 2026). Vrstvy materiálu v reze (`21-b-material`: umelá koža, pena, netkaná, XPE, protišmyková) sú „vrstvy materiálu“, nie prvá/druhá; počet vrstiev materiálu sa naďalej nepíše.
- **Výnimky:** FAQ (`41-d-faq`, `40-d-faq` vzorkovníka — doslovne ako živý web) a citované recenzie zákazníkov sa nemenia. Classic a Premium (rohože do kufra nemajú druhú vrstvu) bez zmeny.
- **598 `13-a-ponuka`:** nadpis „Jazdíte aj v zime? Pridajte si druhú vrstvu“ (tlačidlo na dvojvrstvové je preč od § 14) + veta „Pridáte si ju v konfigurátore hneď po výbere farby.“ — bez odkazu.

## 16. Upratanejší banner druhej vrstvy, Pred a po hneď pod recenziami (24. 10. 2026, Michal)

- **Banner „Jazdíte aj v zime? Pridajte si druhú vrstvu“ (598 `13-a-ponuka`).** Michal: „tento banner veľa textu na kope, nie je to nejako porozdeľované, je to také neupratané.“
  - Text (schválený): štítok „Celoročné riešenie“, nadpis bez zmeny, pod ním jedna veta „Pridáte si ju v konfigurátore hneď po výbere farby.“ a 4 odrážky: „Sneh, soľ a blato zachytí druhá vrstva“, „Prvá prešívaná vrstva ostane čistá“, „Druhú vrstvu vyberiete a umyjete aj vapkou“, „S druhou vrstvou ich používate celý rok“. Dlhý odsek (5 viet) a opakovanie (vapka 2×) sú preč.
  - Vzhľad (`_lcd1v-obsah-a.scss`, spoločné `.ups` všetkých `a-ponuka`): odrážky v **jednom stĺpci** so **zlatou fajkou** (`content:"\2713"` — v CSS vždy escape, nie znak), medzi riadkami 11 px; na PC (od 821 px) fotka vysoká aspoň `clamp(320px,33vw,420px)` a text **zvislo v strede** voči nej; `text-wrap:pretty` (na telefóne nezostane posledné slovo samo na riadku). Na 1280 px je každá odrážka 598 na jednom riadku.
  - Rovnaký vzhľad zoznamu dostali všetky karty `a-ponuka` s odrážkami: vzorkovník 637, Classic, Premium (obe karty), box 616 má tabuľku `.cenv` (bez zoznamu), dvoj tabuľku `.vs2` (iný obsah „Jednovrstvové alebo dvojvrstvové?“ — text nemenený). Upsell boxu v Classic (`31-classic-box`) má vlastnú kópiu štýlov v `_lcd1v-obsah-classic.scss` a ostal s bodkami v dvoch stĺpcoch.
  - Vzorkovník `30-a-ponuka`: 1. odrážka „Jednovrstvové zvládnu jar až leto“ (pravidlo Michal 22. 10. 2026: jednovrstvové = jar až leto; predtým „jar, leto aj jeseň“), test `obsah-vzorky.mjs` upravený.
- **Pred a po hneď pod recenziami.** Michal: „obrázok Pred a po daj hneď pod recenzie, je to veľmi dobrý predajný point.“
  - Súbor sekcie `b-predapo` premenovaný tak, aby ho build (radí podľa celého názvu súboru, rovnaké číslo povolí — kontroluje len duplicitné meno sekcie) zaradil hneď za recenzie, v kuse 1 (10–29): 598 `23-b-predapo` → `10-b-predapo` (za `10-a-recenzie`, pred `11-a-referencie`); Classic `24-b-predapo`, Premium a box `23-b-predapo` → `14-b-predapo` (za `13-a-recenzie`, pred `20-b-ocakavat`). Ostatné poradie bez zmeny.
  - `data-lcd-kap="2"` zo sekcie zmazané — je pred prvou kapitolou ako sekcie A. Pravidlá kapitol (`_lcd1v-obsah.scss` bod 5) sa jej netýkajú (nie je `.chapter`, podklad dáva tmavé `.lx-tma`).
  - Striedanie podkladu ostáva svetlá/tmavá bez dvoch tmavých za sebou: 598 recenzie (svetlé) → Pred a po (tmavé) → referencie (svetlé) → galéria (tmavá) → ponuka (`after-dark`); Classic/Premium/box … galéria (tmavá) → recenzie (`after-dark`) → Pred a po (tmavé) → Deväť/Päť/Osem vecí (kapitola 1, svetlé). Kapitola 1 (porovnanie, resp. veľkosti boxov) teraz končí kus 1 a kus 2 začína kapitolou 2 (box 3) — prechod robí podklad (zem → piesok), linka medzi koreňmi nie je (selektor `+` cez dva korene nefunguje), na snímkach nevadí.
  - JS bez zmeny: `obsah-b.js` hľadá sekciu podľa mena (`oc.sekcia("b-predapo")`), posuvník `lxModulyOziv` nezávisí od poradia; CSS Pred a po je viazané na meno sekcie a koreň `#p1v-<kľúč>-1/-2`, nie na susedov.
  - Dvojvrstvové: `23-b-predapo` ostáva stub (návrh ho nemá, test `obsah-dvoj.mjs` to vyžaduje) — nič sa nepresúvalo.
  - Testy: `obsah-b.mjs`, `obsah-classic.mjs`, `obsah-boxy.mjs` nová kontrola „b-predapo je hneď za a-recenzie“ (susedná sekcia na stránke), `obsah-premium.mjs` `PORADIE` s Pred a po za recenziami; zoznamy `sekcie` v poradí stránky.
