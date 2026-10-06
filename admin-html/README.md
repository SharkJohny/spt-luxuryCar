# admin-html — obsah, ktorý je priamo v Shoptet admine

Titulka, menu a rozcestník už nie sú „nálepka“ z JS. Obsah je v HTML zo Shoptet adminu (bannery, popis stránky), `luxuryCar.js` ho len oživí (animácie, konfigurátor, menu). Zdrojom pravdy je tento priečinok.

Plán: vault `wiki/projekty/aktivne/web-a-konfigurator/web-bez-prekryvania.md` (variant A, Michal schválil 6. 10. 2026).

## Čo kam patrí

| Súbor v `dist/` | SK admin | CZ admin | Obsah |
|---|---|---|---|
| `hp-vrch.*.html` | banner **178** „Top 1“ (Stred titulky) | banner **117** „Stred“ | `#lcd-home`: hero, karta konfigurátora `#konfSlot`, sekcie po Referenčné videá |
| `hp-telo-1.*.html` | banner **181** „Top 2“ (Zápätie titulky) | banner **120** „Zápatí“ | `#lcd-home-2`: recenzie, kufor, set, realita |
| `hp-telo-2.*.html` | **NOVÝ** banner v Zápätí titulky, hneď za „Top 2“ | **NOVÝ** banner za „Zápatí“ | `#lcd-home-3`: čo očakávať, materiál, FAQ, galéria, kontakt, záver, lightbox |
| `mega.*.html` | banner **172** „menu“ (pätička, každá stránka) | banner **108** „menu.“ | `#megaOvl` + `nav#mega` + prepínač SK/CZ |
| `rz.*.html` | stránka **850** → Popis stránky | stránka **786** → Popis stránky | `#lcd-rz` (rozcestník `/rozcestnik/`) |

Presné údaje (kód banneru, pozícia, stránka) sú v `ciele.json` a po builde v `dist/manifest.json`.

- Prečo má `hp-vrch` aj sekcie a nie len hero: titulka má po zhutnení ~90 000 znakov a strop je 45 000 na banner. Na hraniciach sekcií sa to do 2 bannerov tela nezmestí (recenzie majú samy 21 600 znakov). Preto 3 kusy po ~30 000. Medzi bannerom Stred a bannermi Zápätia Shoptet nič nevypisuje, takže poradie na stránke ostáva rovnaké.
- `hp-telo-2` musí byť v admine **za** „Top 2“ / „Zápatí“. Či Shoptet radí Doplnkové bannery podľa priority alebo názvu, treba overiť pred zápisom (🟡).

## Ako upraviť obsah

1. Uprav `src/<časť>.sk.html` **aj** `src/<časť>.cz.html`.
2. Spusti `node tools/build-admin-html.mjs`. Musí skončiť `OK` (exit 0). Vypíše dĺžku každého kusu a rezervu do limitu.
3. Commitni `src/`, `dist/` aj `dist/manifest.json` spolu. CI (`.github/workflows/production.yml`, krok Build Project) spúšťa `node tools/build-admin-html.mjs --check`: zastaraný dist alebo chyba v `src/` zastaví build a nič sa nenahrá.
4. Do adminu ide **celý obsah súboru z `dist/`**, nikdy nie zo `src/`.

Pravidlá (build ich kontroluje):

- Žiadne `<h1>` (H1 dáva Shoptet z názvu stránky / Úvodného textu), `<main>`, `<script>`, `on…=` handlery, `javascript:`.
- Každý `<img>` má `loading` a `width` + `height`. `loading="eager"` + `fetchpriority="high"` má len hero, ostatné `lazy` (inak im Shoptet `unveil()` dá eager).
- `<video>`: zdroj v `data-src`, `preload="none"`, `poster` (stiahne sa až pri zobrazení).
- Každé `id` je unikátne na celej stránke, aj naprieč bannermi (menu je na každej stránke). Odkaz `href="#id"` musí viesť na existujúce id.
- Komentáre s textom sú poznámky pre ľudí, build ich zmaže. Prázdny komentár `<!-- -->` je zámerný (drží prázdny prvok pre TinyMCE), build ho nechá.
- `data-lcd-v` needituj, doplní ho build (hash obsahu, podľa neho JS a kontrola zistia verziu aj ručnú zmenu v admine).
- Limit 45 000 znakov na kus (`--limit` ho zmení). Keď kus pretečie, presuň **celú `<section>`** do susedného súboru a zachovaj poradie. Korene `#lcd-home`, `#lcd-home-2`, `#lcd-home-3` sú pevné, CSS aj JS s nimi rátajú.
- Texty pre zákazníka sa menia len vedome (brand voice, „Vám“ s veľkým V, SK aj CZ naraz).

### Rozcestník = TinyMCE pole

Popis stránky edituje TinyMCE 4.6. Pri ručnom uložení v admine HTML prepíše. Preto:

- **Nikdy neukladať ručne v admine.** Zapisuje sa priamo (runner cez prihlásený Chrome: diff → Michal schváli → zápis → overenie).
- Žiadny prázdny prvok: do prázdneho `<i>`, `<span>`, `<s>`, `<div>` daj `<!-- -->`.
- Žiadny blokový prvok (`div`, `p`, `h2`…) v `<a>`: použi `<span>`.
- Tlačidlo musí mať text, nie len SVG (`<span class="sr-only">…</span>`).
- Bez `<details>`, `<template>`, `<dialog>`, `<style>`. Na najvyššej úrovni je jediný `<div id="lcd-rz">`.
- Overené 6. 10. replikou Shoptet TinyMCE (konfigurácia z `admin_smarty.js`): `dist/rz.sk|cz` po uložení majú rovnaký DOM a druhé uloženie nič nezmení.

## Dohoda s JS a CSS (kontrakt)

- Korene `[data-lcd-cast]`: `hp-vrch` (`#lcd-home`), `hp-telo-1` (`#lcd-home-2`), `hp-telo-2` (`#lcd-home-3`), `mega` (`nav#mega`), `rz` (`#lcd-rz`). Všetky okrem menu majú triedu `lcd-root`. Keď statický koreň na stránke je, JS nič nekreslí ani neprekrýva, len oživí. Keď nie je (prechod), kreslí ako doteraz.
- `<main id="hlavne">` už nie je, sekcie sú priamo v koreni. CSS `#lcd-home main{overflow-x:clip}` treba presunúť na `.lcd-root`.
- H1 → `h2.lcd-h1[data-lcd-h1]` (hero titulky aj nadpis rozcestníka). CSS `#lcd-home .hero h1`, `#lcd-rz .rz h1` treba rozšíriť na `.lcd-h1`. `lcdRz.js` hľadá `h1, [data-lcd-h1]`, auto patrí do `em.rz-auto`.
- Konfigurátor: `#konfSlot` (titulka `.lcdh-konf-slot`, rozcestník `.lcdrz-konf-slot`) má rezervovanú výšku podľa živého konfigurátora 6. 10.: titulka 503 px pod 761 px šírky a 231 px od 761 px, rozcestník 427 / 148 px. Je to `style="min-height:max(…,min(…,(761px - 100vw)*1000))"`, schod na tom istom zlome ako `@media(min-width:761px)` v CSS. Atrapa `#tabs` / `#fields` je preč.
  - Titulka: v slote je `a.konf-bezjs` „Vybrať auto“ / „Vybrat auto“ na `/rozcestnik/` pre prípad bez JS. Keď JS vloží `.model-selector`, odkaz skryje (alebo CSS `#konfSlot:has(.model-selector) .konf-bezjs{display:none}`).
  - Rozcestník: v slote sú záložné kotvy `#Model-selecte` (PC) a `#sets` (mobil), takže aj starý `main.js` vloží konfigurátor do karty.
- Zapečené v HTML (JS ich už nesmie pridať znova): FAQ (`#faq details`), `#s2Thumbs`, `#s2Mob`, moduly farby / pred a po / galéria (`#farby`, `#predapo`, `#galeria`) aj čísla kapitol.
- `#vids`: 6 statických dlaždíc z markupu (vlastné náhľady `yt-*.jpg`). Ďalšie videá z `LCDH_REELS` pridá JS pri priblížení a preskočí `data-yt`, ktoré už v `#vids` sú. `.deck.refs`: všetkých 12 referenčných videí (`data-src`, `preload="none"`, `poster`).
- Texty, ktoré JS dnes píše natvrdo po slovensky (aj na .cz), sú v `data-*`: `#matToggle[data-rozlozit][data-zlozit]`, rozcestník `h2.lcd-h1[data-bez-auta]`.
- Rozcestník nesie **oba stavy hlavičky** v HTML: `.rz-sa` = auto poznáme (štítok `.plate`, „Krok 2 z 3“, 3 kroky, `em.rz-auto`), `.rz-ba` = auto nepoznáme („…pre svoje vozidlo“, „Krok 1 z 2“, 2 kroky, otvorený `#konf`). Prepína ich CSS (`_lcdKorene.scss` bod 8) podľa `html.lcd-rz-auto`, ktorú nastaví riadok Záhlavia nižšie ešte pred `<body>` → stránka sa po načítaní JS neposunie (CLS). Bez triedy (bez JS, Google, priamy príchod) = auto nepoznáme. Vzorové auto nie je v texte stránky: `em.rz-auto` a položky štítka `.plate .v i` sú prázdne (`<!-- -->`) a vzor nesú v `data-vzor`. CSS ním cez `::after` len neviditeľne drží miesto, kým `lcdRz.js` nevpíše skutočné auto (`html.lcd-rz-plne`). Nadpis bez CSS a JS je teda len „Vyberte si koberce pre svoje vozidlo“.
- Rozcestník na mobile: pri statickom koreni `lcdRz.js` **nespúšťa** stlmenie s nápovedou cez karty (`#duoCoach` v statickom HTML ani nie je) ani samovoľný posun pásu kariet. JS môže prísť o desiatky sekúnd neskôr, keď už zákazník karty používa, a stlmenie by ich prekrylo. Nápoveda je len statický text `.duoswipe` („Potiahnite prstom“ / „Přejeďte prstem“) pod kartami. Kreslený rozcestník (prechod) ich má ako doteraz.
- Sekcie hneď za tmavou (`#produkty`, `#referencie`) majú triedu `lx-po-tmavej` zapečenú v HTML (na mobile odstup, na PC 0). `lxModulyOziv` ju pri statickom koreni nepridáva ani nemení `padding`, takže sa po načítaní JS nič neposunie. Pri novej sekcii za tmavou ju pridaj ručne.
- Menu: `nav#mega` sa ukazuje cez stav Shoptetu `body.navigation-window-visible`, nie cez vlastný klik. Krížik `#megaX` má triedy Shoptetu `toggle-window hide-content-windows` → zavrie menu natívne (main-3g.js, aj dotykom) ešte pred načítaním nášho JS; `lcdHdr`/`lcdOziv` ho zatvárajú tiež (hideNavigation je idempotentné, nič sa neprepína späť). Prepínač jazyka je `a.lang.m-lang` hneď za `#megaX`; `lcdLang.js` ho rozbalí na výber SK/CZ ako dnes.

## Poradie nasadenia (inak ostane titulka neviditeľná)

1. Najprv JS + CSS, ktoré zvládnu statické korene (v HTML kódoch oboch adminov adresa `…/assets/v/<sha>/css/luxuryCar.css` a `…/assets/v/<sha>/js/luxuryCar.js` novej verzie).
2. Potom v HTML kódoch Záhlavie (SK aj CZ) **len** pridať riadok z `admin-html/zahlavie-riadok.html` (jeden `<script>`): zapne natívnu hlavičku (`html.lcd-native-hdr`, `lcdHdr.js` potom nekreslí `#lcd-hdr`) a nastaví `html.lcd-rz-auto`, keď sessionStorage pozná auto (Brand, Model, Year, carType — rovnako ako `lcdRz.js`). Spolu s bannerom menu 172 / 108 (F1a). Návrat = riadok zmazať.
   - **Poistku (`lcdh-early` / `lcdrz-early`) v tomto kroku NEMAZAŤ.** Kým sa titulka a rozcestník ešte kreslia, poistka zakrýva starú titulku, kým JS nakreslí novú. Bez nej starý obsah (`section#models`, twentytwenty) na SK titulke ~1 s blikne a posunie stránku (harness 6. 10., Záhlavie bez poistky a titulka ešte kreslená: SK titulka CLS 0,44 namiesto 0,032, najväčší posun `section#models` v 1,04 s; CZ podľa revízie 0,048 namiesto 0,004). Keby sa prepínanie zaseklo, okno by ostalo otvorené natrvalo.
3. Až potom bannery a popis stránky (najprv SK, kontrola, potom CZ). Zároveň:
   - carousel SK 184 / CZ 123 vypnúť,
   - popis Úvodného textu vyprázdniť **a v tom istom kroku** nastaviť explicitný meta description titulky SK aj CZ (dnes je šablóna `#TITLE#. #DESCRIPTION#`). Názov Úvodného textu (= H1 titulky, `main#content > h1.sr-only`) ostáva „Vitajte v našom obchode“ / „Vítejte v našem obchodě“, kým Michal neschváli novú H1 frázu (`seo-runtime.js` ho v `h1.sr-only` po načítaní prepíše na „Luxusné autokoberce DragonSkin — na mieru pre vaše auto“, ako dnes). Pás `.welcome-wrapper` pod telom titulky (vizuálna kópia názvu, `div.h1`, nie nadpis) skrýva CSS (`_lcdKorene.scss` bod 6b), takže titulka vyzerá ako dnes,
   - pri premenovaní rozcestníka nastaviť meta titulok (je prázdny, `<title>` sa odvodzuje z názvu),
   - **posledný bod, pre každý web zvlášť:** až keď je na danom webe titulka **aj** rozcestník statický a overený, zmazať poistku v jeho Záhlaví: SK `lcdh-early` (riadok ~67) a `lcdrz-early` (~69), CZ jedna spoločná `lcdh-early` (~73) pre titulku aj rozcestník. Je to len upratanie, nie podmienka: pri statickom koreni poistka neprekáža, CSS ju neutralizuje (`_lcdKorene.scss` bod 4, na rozcestníku obe triedy) a JS ju odoberie (`lcdHome.js` `lcdh-early`, `lcdRz.js` `lcdrz-early` aj `lcdh-early`). Overené harnessom 6. 10.: celé prepnutie bez zmazania poistky SK 164/164 aj CZ 164/164 OK, poistka na `<html>` nevisí, CLS SK titulka 0,032, CZ titulka 0,067, rozcestník 0,009.

Návrat: presne podľa `C:/Users/M/Desktop/LCD/web/zalohy-admin/2026-10-06/NAVRAT-NAVOD.md`, sekcia „Návrat po prepnutí na web bez prekrývania“. Postup „Návrat — postup“ hore v tom súbore platí len pre admin, ktorý ešte nie je prepnutý. Poradie v skratke:

1. vypnúť nový banner „Top 3“ / „Zápatí 2“;
2. zo zálohy vrátiť bannery 178 / 181 / 172 (CZ 117 / 120 / 108), zapnúť carousel 184 / 123, vrátiť Úvodný text (názov, popis, meta description) a rozcestník 850 / 786 (popis, názov, meta titulok);
3. až potom HTML kódy (poistka späť, riadok `lcd-native-hdr` preč);
4. kód (adresa verzie v HTML kódoch) až nakoniec a len pri chybe v kóde. Nový kód zvláda aj starý admin.

## CSS — čo je zdroj pravdy

Na web ide `assets/css/luxuryCar.css` tak, ako je v repe. CI ho nekompiluje zo SCSS, len ho skopíruje do `assets/v/<sha>/css/`.

| Časť `luxuryCar.css` | Zdroj pravdy | Ako zmeniť |
|---|---|---|
| blok `LCD-HOME` (titulka) | `assets/css/_lcdHome.scss` | uprav partial → `python tools/vloz-lcd-css.py` |
| blok `LCD-RZ` (rozcestník) | `assets/css/_lcdRz.scss` | to isté |
| blok `LCD-HDR` (hlavička, menu `#mega`) | `assets/css/_lcdNativeHdr.scss` | to isté |
| blok `LCD-KORENE` (statické korene v obaloch Shoptetu) | `assets/css/_lcdKorene.scss` | to isté |
| blok `LCD-BLOG` | `assets/css/_lcdBlog.scss` | `python tools/vloz-lcd-blog-css.py` |
| blok `LCD-PK` (poukážka) a všetko mimo blokov (šablóna) | priamo `luxuryCar.css` | ručne v `luxuryCar.css` |

- `tools/vloz-lcd-css.py` prepíše **len** obsah medzi značkami `/* ===== LCD-… START … */` a `/* ===== LCD-… END ===== */`. Pri `LCD-HOME` zmení `#lcd-home` na `:is(#lcd-home,[data-lcd-cast^=hp])` (telo titulky je v 3 banneroch). Pri `LCD-HOME` a `LCD-RZ` pridá ku každému selektoru s `h1` dvojča s `.lcd-h1`. Deklarácie a komentáre nemení.
- Ručná úprava vnútri bloku sa pri ďalšom behu stratí. CI ju odmietne: `python3 tools/vloz-lcd-css.py --check` vráti exit 1, keď `luxuryCar.css` nesedí s partialmi. Na koncoch riadkov nezáleží (Windows CRLF aj LF).
- `luxuryCar.scss`, `_index.scss` a ďalšie partialy šablóny sú staršie ako `luxuryCar.css`, rozchádzajú sa s ním. **Nikdy ich znova neskompiluj do `luxuryCar.css`.** Zmazalo by to LCD bloky aj opravy urobené priamo v CSS. Dve výnimky `:not(.lcd-root *)` z 10/2026 (`.footer-banner section` a `.type-page .content … a/span`) sú pre istotu aj v `_index.scss` a `luxuryCar.scss`.

## Nástroje

- `node tools/build-admin-html.mjs` — build + kontroly; `--check` (len kontrola, CI), `--limit 50000`, `--test` (samotest kontrol), `--snimky <priečinok verejne-stranky>` (kolízie id so Shoptet stránkou). Čísla riadkov v chybách sú riadky v `dist/`.
- `node admin-html/porovnaj-texty.mjs --stranka titulka|rozcestnik --web sk|cz [--zive <uložený DOM>]` — porovná texty `dist/` so živou stránkou po spustení JS (headless Chrome). Vypíše chýbajúce a nové texty, známe rozdiely (texty za behu JS, nahradená hlavička) zvlášť.
- `node admin-html/extract-z-markup.mjs [--rev HEAD|<commit>|worktree]` — jednorazový prevod z `assets/js/*-markup.js` (a modulov, FAQ z `lcdHome.js`). **Prepíše `src/`!** Po prevode sa upravuje už len `src/`.
