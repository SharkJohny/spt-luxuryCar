# Obsah pod konfigurátorom 1V — základ pre skupiny A–D (SK Diamond Line 598, `?novy=1`)

Základ z 13. 10. 2026 (worktree `spt-luxuryCar-1v`, HEAD `a0d3ce8`). Skupiny A–D zlúčené 14. 10. 2026 (koordinátor): spoločné pravidlá presunuté do základu (bod 5 nižšie), jedno okno na fotky a videá, jeden reveal, stav a otvorené body v sekcii 10.
Cieľ: všetko pod konfigurátorom vyzerá ako návrh v26 (`scratchpad/navrhy/jednovrstvove.html`, `http://127.0.0.1:8952/jednovrstvove.html`). Zatiaľ len s `?novy=1`.
Konfigurátor sám je v [`docs/1v-kontrakt.md`](1v-kontrakt.md) (brána, `ctx`, testy). Tento súbor platí pre štyroch workerov obsahu.

Hlavička, mega menu a päta už sú naživo, tie sa nerobia.

---

## 1. Kde obsah v admine je

**Rozhodnutie:**
- **Test (teraz):** 2 nové SK bannery v pozícii **Pätička (custom-footer)**, ako menu 172.
- **Po spustení pre všetkých:** Popis produktu 598.

Prečo:

| Možnosť | Zistené 13. 10. (živá 598 + `raw-sk.html`) | Výsledok |
|---|---|---|
| Popis 598 (`#description .basic-description`) | Starý obsah má **42 440 zn.**, do limitu 45 000 ostáva 2 560 zn. Návrh má v sekciách pod konfigurátorom ≈ 69 000 zn. HTML, s CDN adresami obrázkov ešte viac. | Starý aj nový obsah sa do jedného poľa nezmestí. |
| Krátky popis (`.p-short-description`) | Je **vo vnútri `form#product-detail-form`** (formulár košíka). | Nie. Tlačidlo alebo pole by išlo do košíka. |
| Benefit banner (`.benefitBanner.position--benefitProduct`) | `productPage.js:186` presúva jeho položky do `.p-info-wrapper` (r. 152 ich na id-751 maže). | Nie. Živý JS by ho prehadzoval. |
| Iné pozície bannerov na detaile | Na 598 sa vypisuje len pätička: 166, 169, 172 (menu), 175, 190. | **Pätička** = jediná voľná pozícia, ktorá sa na 598 vypíše. |

**Cena testu:**
- Bannery v pätičke sú na **každej SK stránke** (~+ znaky oboch kusov HTML, gzip ≈ ¼).
- Sú neviditeľné a nič nesťahujú:
  - koreň má `display:none`,
  - stĺpec pätičky skryje CSS,
  - obrázky `lazy`, videá `data-src`.
- Preto build kontroluje kolízie id aj na titulke a rozcestníku (`naVsetkychStrankach`) a zakazuje triedy, na ktoré kotví živý JS (`ciele.json` → `pravidla.obsah-1v`).
- Plán B, keby záťaž HTML vadila: skrytá stránka Shoptetu a `fetch` len pod flagom. Nulová cena bez flagu, ale je to JS obsah. Nie je hotové.

**Dva kusy, každý ≤ 45 000 zn.** (`admin-html/ciele.json`):

| Časť (dist) | Sekcie | Skupiny | Test: admin | Po spustení |
|---|---|---|---|---|
| `p1v-598-1.sk.html` | `src/p1v-598/10–29` | A + B | banner „1V obsah 1 (test)“, Pätička | Popis 598 |
| `p1v-598-2.sk.html` | `src/p1v-598/30–49` | C + D | banner „1V obsah 2 (test)“, Pätička, hneď za kusom 1 | Popis 598 spolu s kusom 1, ak súčet ≤ 45 000. Inak ostáva banner (rozhodne Michal). |

- Build vypíše riadok `p1v-598.sk … zn. spolu` = súčet pre jedno pole po spustení.
- Keď kus pretečie, koordinátor posunie hranicu `sekcie` v `ciele.json`. Workeri súbory nepresúvajú.
- `id`/`kod` bannerov sú v `ciele.json` `null`. Koordinátor ich doplní po vytvorení v admine, potom build + commit.
- **Agenti do adminu nikdy nepíšu.** Zápis robí koordinátor s Michalom (runner cez Chrome, `admin-html/README.md`).

## 2. Brána a umiestnenie

Obal vyrobí build, workeri ho nemenia:
```html
<div id="p1v-598-1" class="p1v-obsah" data-lcd-cast="p1v-598-1" data-lcd-v="…" data-lcd-brana="1v" style="display:none">
  …sekcie 10–29 v poradí názvov súborov…
</div>
```

**Bez flagu** (každý návštevník, každá SK stránka):
- koreň `display:none`, stĺpec pätičky skrytý (`.custom-footer > div:has([data-lcd-brana])`),
- nič sa nesťahuje,
- nič nebeží (`obsah.js` je za bránou v `index.js`).

**S `?novy=1`** (`assets/js/components/konfigurator1v/obsah.js`, posledný modul v `index.js`):
1. Nájde korene `[data-lcd-cast^="p1v-598-"]` (pätička v teste, Popis po spustení). Keď nie sú, nerobí nič a starý popis ostáva.
2. Vytvorí `div.p1v-miesto` **hneď pred** `.p-detail > .shp-tabs-wrapper` (záložky Popis/Diskusia). Je to priamo pod konfigurátorom, na celú šírku stránky (`.overall-wrapper`; `--p1v-sirka`, `--p1v-vlavo` podľa skutočnej geometrie).
3. Presunie korene doň v poradí kus 1, kus 2. Prázdny stĺpec pätičky dostane `data-p1v-prazdny`.
4. Body dostane `.lcd-1v-obsah`. CSS (blok `LCD-1V-OBSAH`):
   - ukáže korene v `.p1v-miesto`,
   - **skryje záložky** (starý popis, Diskusia, Dodatočné parametre). Ostávajú v DOM, JS na ne kotví.
5. Zavolá `init(oc)` skupín A–D. Výnimka sa zapíše do `ctx.chyby`, `index.js` zloží `lcd-1v` a zákazník vidí starý vzhľad celý.
6. Spoločný reveal `.rv` pre všetky sekcie (čo je vo výreze alebo nad ním hneď, zvyšok pri zobrazení), potom obal každej sekcie dostane `.p1v-rv`. Skupiny reveal nerobia.

**Štýly titulky platia aj na obsahu.** `vloz-lcd-css.py` mení v bloku `LCD-HOME`:
- pôvodne: `#lcd-home` → `:is(#lcd-home,[data-lcd-cast^=hp])`,
- teraz: `#lcd-home` → `:is(#lcd-home,[data-lcd-cast^=hp],body.lcd-1v [data-lcd-cast^=p1v])`.

Dôsledky:
- Korene dostanú premenné (`--ink`, `--gold`, `--sand`…), písmo a všetky moduly titulky: `.chapter`, `.wrap`, `.rule`, `.lede`, `h2`, `lx-*` (galéria, farby, pred a po), `.deck`, `.revs`…
- Tie sú aj prvou časťou CSS návrhu. **Skupiny teda píšu len rozdiely oproti titulke**, nekopírujú 370 riadkov `lx-*`.
- Špecificita ostáva (1,0,0). Bez flagu alias nič nevyberá.
- `luxuryCar.css`: +~39 kB surových, +~2 kB brotli.

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

- Obrázky: `assets/img/1v/obsah/<skupina>-<popisné-meno>.jpg`.
  - Nikdy neprepisovať existujúci súbor v `assets/img/`.
  - Max ~1600 px na šírku, JPEG q≈80 (WebP len tam, kde ho živý web už používa).
  - V HTML/CSS absolútna adresa `https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/obsah/<meno>` (v JS `oc.obrazok(meno)`). Test ich servíruje z repa.
- **Spoločné, len koordinátor:**
  - `obsah.js`, `assets/css/_lcd1v-obsah.scss`, `admin-html/ciele.json`,
  - `tools/build-admin-html.mjs`, `tools/vloz-lcd-css.py`,
  - `tools/test-1v-obsah.mjs`, `tools/test-1v/obsah-spolocne.mjs`, tento dokument,
  - generované `admin-html/dist/*` a `assets/css/luxuryCar.css`,
  - všetko z `docs/1v-kontrakt.md` sekcia 10.
- Okno boxov `#bxBox` a lepivá lišta `#lista` z návrhu patria konfigurátoru (kufor-boxy, cena), nie obsahu.
- Git: workeri len čítajú (`status/diff/log`). Commit robí koordinátor po vymenovaných cestách (nikdy `node_modules`, nikdy build `luxuryCar.js`).

## 4. Pravidlá HTML sekcie (build ich kontroluje)

- **Súbor = jeden prvok na najvyššej úrovni** s `data-lcd-sekcia="<meno>"` (meno = názov súboru bez čísla) a `data-lcd-kap` podľa hlavičky.
  - Súbor len s komentárom je stub a build ho preskočí.
  - Komentáre s textom build zmaže.
- **id len s predponou `p1v-`.** Titulka má `#galeria`, `#farby`, `#predapo`… a banner je v teste aj na nej.
- Kotva na konfigurátor (výzvy „Vyberte si model…“): `href="#product-detail-form"`. Iné kotvy len na `p1v-*` id na stránke 598.
- **Zakázané triedy** (kotvy živého JS, zoznam v `ciele.json` → `pravidla.obsah-1v.zakazaneTriedy`), napr.:
  - `lcd-reviews-widget`, `lcd-videos-widget`: `main.js` by widget nevložil do starého popisu,
  - `text-block`, `twentytwenty-*`, `impact-text`, `layers-info-wrap`,
  - `wrapper`, `desctop`, `mobile` (`video-play-again.js`),
  - `faq`, `accordion`, `option-button`, `parameter-wrap`, `upsale-*`, `sec-header`, `lcd-root`.
  - Na triedy titulky (`chapter`, `wrap`, `lx-*`, `deck`, `revs`…) sa nič zo živého JS na 598 neviaže, tie sú v poriadku.
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
- **Texty:**
  - Preberajú sa z návrhu.
  - Zakázané:
    - „na milimeter“, 1. osoba „vyrábame“,
    - počty vrstiev, záruka ako argument,
    - názvy DragonSkin / Elite / Basic v novom texte,
    - uchytenie do fixačných bodov auta, „Comfort“ (druhá vrstva len „Lux“).
  - Kufrová rohož „Premium“ ako produkt áno.
  - Žiadne právne upozornenia pri cenách.
  - **Ceny nikdy natvrdo v HTML.** Cenu vpíše JS zo živých dát (`oc.ctx.cena()`, `ctx.moznosti()`), inak sa cena nezobrazí.
  - Keď text návrhu porušuje pravidlo, použi najbližšie dovolené znenie a napíš ho koordinátorovi.

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
  - `oc` = `{ ctx, korene, koren (multi), miesto, sekcia(meno), obrazok(meno), priZobrazeni(el, fn, {okraj}), nacitajMedia(el), ked, na, vysli }`.
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
node tools/build-admin-html.mjs                 # build dist + manifest; vypíše dĺžky sekcií a súčet p1v-598
node tools/build-admin-html.mjs --check         # CI
python tools/vloz-lcd-css.py --check            # CI (luxuryCar.css generuje koordinátor)
node tools/test-1v-obsah.mjs --snimky <scratchpad>/navrhy/_prieskum/snimky/obsah
node tools/test-1v-obsah.mjs --skupina b --sirka 390 --snimky-sirky 390 --snimky …   # rýchlo, len skupina B
node tools/test-1v-obsah.mjs --miesto popis     # obsah v Popise (simulácia spustenia, brána ešte zapnutá)
node tools/test-1v-obsah.mjs --miesto zive      # po zápise do adminu: nič sa nevkladá, porovná data-lcd-v s buildom
node tools/test-konfigurator-1v.mjs             # konfigurátor bez flagu (musí ostať zelený)
node tools/test-konfigurator-1v.mjs --novy      # konfigurátor s ?novy=1 (musí ostať zelený)
```

**`test-1v-obsah`** zostaví HTML adminu (`--vystup`), JS a CSS ako CI do dočasného priečinka. Do dokumentu živej 598 vloží kusy ako bannery pätičky + sondu (img lazy 1×1). Kontroluje:

- **bez flagu (1280, 390):**
  - korene `display:none`, stĺpce pätičky skryté,
  - **žiadne** médiá obsahu ani sonda stiahnuté,
  - pätička a výška stránky ako bez obsahu (±40 px; konfigurátor sám kolíše ±7 px),
  - žiadne nové chyby v konzole, žiadny vodorovný posun.
- **`?novy=1` (360, 390, 768, 1280):**
  - `lcd-1v` + `lcd-1v-obsah`, `__lcd1v.chyby` prázdne,
  - `.p1v-miesto` pred záložkami, korene v poradí a viditeľné,
  - starý popis skrytý, `--gold` na koreni (alias titulky),
  - sonda sa po posune stiahne,
  - žiadny prvok za okrajom okna (okrem vnútra posuvných pásov), žiadne nové chyby v konzole,
  - **kontroly skupín** `tools/test-1v/obsah-<x>.mjs`.
- **Snímky** (`--snimky-sirky`, predvolene 390 a 1280): `<snimky>/<sekcia>/web-<š>.png`, `navrh-<š>.png` a `porovnanie-<š>.png` (vedľa seba). Fixné a lepivé prvky (hlavička, lišta, chat) sa na snímku skryjú.

**Plugin skupiny** `tools/test-1v/obsah-<x>.mjs`:
- `sekcie = [{ meno, navrh: [{sel, text?, za?, pred?}] }]`: ako nájsť tú istú časť v návrhu. Snímka je spoločný obdĺžnik.
- `async kontroly(t)` → `[{ ok, popis }]`.
- `t` = pomocník `tools/test-1v/pomocnik.mjs` (skutočný klik s kontrolou zakrytia…) + `t.sekcia(meno)` (selektor) + `await t.je(meno)`.

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

## 7. Spustenie pre všetkých (neskôr, s Michalom)

1. **Veľkosť:** `node tools/build-admin-html.mjs` → riadok `p1v-598.sk … spolu`.
   - **≤ 45 000:** v `ciele.json` jedna časť `p1v-598-1` so `sekcie: ["10","49"]` (kus 2 zmazať), `sk` = `{ "typ": "produkt", "id": 598, "pole": "Popis (description)" }`, `naVsetkychStrankach: false`.
   - **> 45 000:** kus 1 → Popis, kus 2 ostáva banner v pätičke **bez brány**, ale skrytý mimo 598. Treba pravidlo podľa `body` 598 a `obsah.js` ho presunie. To je rozhodnutie pre Michala (HTML navyše na každej stránke natrvalo). Alebo obsah skrátiť.
2. **Zrušiť bránu** (všetko v repe, jeden commit):
   - `ciele.json` `obal` bez `brana` (build už nedá `style="display:none"` ani `data-lcd-brana`),
   - v `index.js` pre 598 zrušiť podmienku flagu (`jeZapnute`),
   - v `vloz-lcd-css.py` alias bez `body.lcd-1v` (`[data-lcd-cast^=p1v]`, aby obsah mal štýly aj bez JS),
   - v `_lcd1v-obsah.scss` zmazať body 1 a 2; v bodoch 3–9 a v `_lcd1v-obsah-a…d.scss` zmazať predponu `body.lcd-1v` (id koreňov `:is(#p1v-598-1,#p1v-598-2)` ostávajú; bod 6c `.rv` bez `.p1v-rv` = obsah viditeľný aj bez JS),
   - `.lcd-1v-obsah` na body ostáva (pridáva ho `obsah.js`); kým JS nepríde, je obsah v Popise na mieste starého popisu, nie pod konfigurátorom — preto JS presun nechať, len bez flagu.
3. **Pred zápisom:** `test-1v-obsah --miesto popis` + `test-konfigurator-1v` (oba režimy) + celý web zo smoke harnessu.
4. **Admin (koordinátor + Michal, runner):** presne podľa sekcie 9 B.
5. **Po zmazaní starého obsahu skontrolovať živý JS starého popisu:**
   - `main.js` lcdReviews/lcdVideos: widget sa vloží na koniec `.basic-description`, ktorá je skrytá,
   - `popisModuly.js` (nájde málo alebo nič),
   - `productPage.js` (prázdne `<p>`).
   - Konzola bez chýb. Ak treba, vypnúť ich pre 598.
6. **Návrat:** Popis zo zálohy, bannery späť, `?v=` predošlej verzie v HTML kódoch (poradie podľa `admin-html/README.md` „Návrat“).

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

### 9 A. Test fáza (teraz): 2 bannery v Pätičke, Popis 598 sa NEMENÍ

Predpoklady (v tomto poradí, inak by bol v pätičke každej SK stránky prázdny stĺpec):
1. Kód: commit + push do `main`, CI zelené, `assets/v/<sha>/js/version.json` vracia sha. V SK HTML kódoch (Záhlavie CSS, Zápätie JS) je adresa `…/assets/v/<sha>/…` novej verzie (prepnutie len po Michalovom „prepni“, postup `docs/1v-kontrakt.md`). Až nový `luxuryCar.css` obsahuje pravidlo, ktoré stĺpec pätičky s bannerom skryje (`LCD-1V-OBSAH` bod 1).
2. `node tools/build-admin-html.mjs --check` OK, `python tools/vloz-lcd-css.py --check` OK, `dist/` a `manifest.json` commitnuté.

Záloha (pred prvým zápisom):
- zoznam bannerov pozície Pätička (názov, kód, poradie, zapnuté) + snímka obrazovky do `C:/Users/M/Desktop/LCD/web/zalohy-admin/<dátum>/bannery-paticka.sk.json`,
- Popis 598 (pole „Popis“, dnes 42 440 zn.) do `…/zalohy-admin/<dátum>/produkt-598-popis.sk.html` — v test fáze sa nemení, ale je to východiskový bod pre spustenie.

Zápis:
| Krok | Kde v admine | Pole | Obsah |
|---|---|---|---|
| 1 | Bannery (tam, kde je banner 172 „menu“) → nový banner, pozícia **Pätička (custom-footer)** | Názov | `1V obsah 1 (test)` |
| | | Text banneru (HTML) | **celý** súbor `admin-html/dist/p1v-598-1.sk.html` (34 238 zn.) |
| | | Zobraziť | PC aj mobil, zapnutý |
| 2 | to isté, poradie **hneď za** „1V obsah 1 (test)“ | Názov | `1V obsah 2 (test)` |
| | | Text banneru (HTML) | **celý** súbor `admin-html/dist/p1v-598-2.sk.html` (23 472 zn.) |
| 3 | repo | `admin-html/ciele.json` | `id` a `kod` oboch bannerov (z adminu) → `node tools/build-admin-html.mjs` → commit `ciele.json` + `dist/manifest.json` |

Overenie hneď po zápise:
- `node tools/test-1v-obsah.mjs --miesto zive` (nič nevkladá; porovná `data-lcd-v` v admine s buildom, bez flagu 0 stiahnutých médií),
- bez flagu SK titulka, 598, `/kosik/`, jedna kategória: pätička vyzerá ako predtým (žiadny prázdny stĺpec), v zdrojovom kóde je `data-lcd-brana="1v"` so `style="display:none"`,
- s `?novy=1` na 598 obsah pod konfigurátorom (Michal na iPhone).
- Ak hash nesedí: admin (TinyMCE alebo filter bannerov) HTML zmenil → banner vypnúť, rozdiel nahlásiť, nič neopravovať ručne.

Návrat test fázy: oba bannery vypnúť (zmazať až po dohode). Nič iné sa nemenilo.

### 9 B. Spustenie pre všetkých (neskôr, po Michalovom „spusti“): Popis produktu 598

Predpoklady: kroky 1–3 zo sekcie 7 (veľkosť, brána zrušená v kóde, kód nasadený a prepnutý, testy `--miesto popis`).

1. **Záloha:** pole „Popis“ produktu 598 (SK admin, detail produktu ID 598 „Luxusné autokoberce DragonSkin Diamond Line“; na webe `#description .basic-description`) celé do `C:/Users/M/Desktop/LCD/web/zalohy-admin/<dátum>/produkt-598-popis.sk.html` + dĺžka (dnes 42 440 zn.) + snímka. Bez zálohy sa nepokračuje.
2. **Ktorý súbor:**
   - súčet ≤ 45 000 zn. (riadok `p1v-598.sk … spolu` v builde): jedna časť `p1v-598-1` so `sekcie: ["10","49"]` → do Popisu ide **celý** `admin-html/dist/p1v-598-1.sk.html`;
   - dnes je súčet **57 710 zn.** (kus 1 34 238 + kus 2 23 472) → do Popisu ide `dist/p1v-598-1.sk.html`, kus 2 ostáva banner bez brány (rozhodnutie pre Michala, sekcia 7 bod 1).
3. **Zápis:** runner nastaví obsah poľa „Popis“ cez API TinyMCE (`setContent` celého súboru), uloží produkt. Starý obsah sa tým nahradí celý (nič sa neprikladá).
4. **Overenie:** uložené HTML z adminu = `dist` (TinyMCE nesmie nič zmeniť; overené replikou ešte pred zápisom — pozor na `<img>` bez `src` vo farbách, sekcia 10), `node tools/test-1v-obsah.mjs --miesto zive`, `test-konfigurator-1v` oba režimy, snímky 390/1280.
5. Testovacie bannery: kus 1 vypnúť; kus 2 podľa bodu 2.
6. **Návrat:** Popis 598 zo zálohy (runner), bannery späť, kód podľa `admin-html/README.md` „Návrat“.

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
- cena v porovnaní v tvare Shoptetu „od €219“ (návrh „od 219 €“), rovnako ako v konfigurátore.

**Technické, pred spustením:**
- TinyMCE: 8 veľkých fotiek farieb má len `data-src` (bez `src`) — overiť replikou, že ich uloženie Popisu neodstráni (v banneri nevadí),
- `Záhlavie` každej SK stránky má `<link rel="preload" as="image" fetchpriority="high" …/lcd-home/hero.jpg>` aj mimo titulky (145 kB) — samostatná úloha, obsahu 1V sa netýka,
- fotky recenzií z `reviews-data.js` majú 700×525 px a zobrazujú sa ako 54 px náhľady (rovnako na živom widgete) — návrh: scraper nech robí aj malé náhľady.
