# Konfigurátor 1V — kontrakt pre nový vzhľad (SK produkty z registra, `?novy=1`)

Základ z 13. 10. 2026 (worktree `spt-luxuryCar-1v`, odpojený na `5db0f33` = živý web).
Cieľ: nový vzhľad konfigurátora a cenovej karty podľa schválených návrhov **nad živým Jánovým konfigurátorom**.
Zapína sa len na SK produktoch z registra (`konfigurator1v/produkty.js`) a len s flagom karty (`?novy=1`, vývoj `?novy=vyvoj`, sekcia 1). Pri sete autokobercov sú kufor a boxy viditeľné kroky 5 a 6 (dvojvrstvové 6 a 7).

**Jadro pre všetky typy (T0.1, 14. 10. 2026):** register produktov a typov, brána po typoch, `ctx.produkt` / `ctx.texty` / `ctx.obrazokVzoru`, kroky `farba2`, `pocet`, `velkost`, moduly podľa typu, ceny sesterských stránok (`ceny-ine.js`). Dnes vydaný typ: `jedno` (598, 610, 613). 598 sa tým nezmenil (test 598 bez flagu aj s `?novy=1` rovnaký ako pred jadrom).

Tento súbor platí pre všetkých workerov. Jadro (sekcia 10) mení len vydávacia úloha vlny.

---

## 1. Brána (gating)

| Čo | Kde | Pravidlo |
|---|---|---|
| Register produktov | `components/konfigurator1v/produkty.js` `PRODUKTY_1V = { 562035: { 598: { typ: "jedno", vzor: "diamond", url, obsah }, … } }` | kľúč = `projectId` Shoptetu (SK 562035, CZ 581408 zatiaľ nie). ID produktov sa medzi obchodmi líšia. CZ produkt 598 nie je Diamond. 13 SK produktov + vzorkovník 637 (typ `vzorky`, stub). Tvar riadku `598: { typ: "…"` číta test regulárnym výrazom — nemeniť. |
| Typy | `produkty.js` `TYPY[typ] = { kroky, moduly, obal }` | `jedno` 6 krokov, `dvoj` 7 (+ `farba2`), `kufor-classic` / `kufor-premium` 3 (vzor, auto, farba), `boxy` 3 (farba, pocet, velkost — poradie návrhu, v DOM je počet prvý), `vzorky` (bez krokov). `kroky` = poradie kariet a číslovanie, `moduly` = poradie init, `obal` = prvok formulára, bez ktorého sa nezapne. |
| Vydané typy | `produkty.js` `ZAPNUTE_TYPY` (jednoriadkový zoznam reťazcov; test ho číta) | dnes `["jedno"]`. Typ pridáva len vydanie (T1.1, T2.1, T3.1, T4.1, T5.1). |
| Zapnutie | `?novy=1` -> `sessionStorage.lcd1v = "1"`: len produkty vydaných typov · `?novy=vyvoj` -> `"vyvoj"`: celý register (vývoj, test `--vyvoj`, nie pre zákazníkov) · flag platí v karte aj po prechode bez parametra | `?novy=0` flag zmaže. Bez parametra sa nič nezapisuje. Zákazník s odkazom `?novy=1`, ktorý prejde na nevydaný typ, dostane starý vzhľad (zámer). |
| Trieda a typ | `body.lcd-1v` + `data-lcd1v-typ="<typ>"` + `data-lcd1v-vzor="<vzor>"` (box a vzorkovník bez vzoru) | len pri produkte z registra so zapnutým flagom. **Všetko nové CSS musí byť pod `body.lcd-1v`**; typ cez atribút: `body.lcd-1v[data-lcd1v-typ="dvoj"]`, rohože `[data-lcd1v-typ^="kufor"]`. Atribúty, nie triedy: `lcd1v-vzor-*` už majú dlaždice vzoru. |
| Kontext | `window.__lcd1v` = `ctx` (`ctx.produkt.typ`, …) | slúži na ladenie a test. Bez flagu (a na nevydanom type pri `?novy=1`) neexistuje. |
| Poistka | výnimka v `init()` modulu | `index.js` triedu `lcd-1v` aj atribúty typu zloží, zákazník dostane starý vzhľad. Chyby sú v `window.__lcd1v.chyby`. |

**Flag vypnutý = NULOVÁ zmena.** Test `nulova-zmena` porovnáva živý CDN a lokálny build (DOM krokov, počty, ceny, štýly, triedy body). Všetok nový JS kód začína až v `init(ctx)`. Volá ho len `index.js` za bránou: na úrovni modulu (pri importe) nesmie nič bežať.

## 2. Poradie spustenia (`assets/js/main.js`)

Callback `$.getJSON(data.json)`: `initKosikDoplnok` → `initProduct` (kroky, kufor/boxy, box-config) → `initModelSelect` (selecty auta do K1) → `validation` (výzva „vyberte model“) → `initConfiguratorEngine` (akordeón, „Prejsť k ďalšiemu kroku“, validácia košíka) → `initLivePrice` (cena) → `initCart` → **`initKonfigurator1v(setupData, texts)`** (posledný).

Prečo na konci: DOM konfigurátora už stojí a živé handlery sú zaregistrované skôr ako naše. Pri tom istom kliku teda bežia prvé.

**Čo pribudne až neskôr (asynchrónne), moduly s tým musia počítať** (`ctx.ked()` alebo MutationObserver):
- `.next-step-button` v každom kroku: 100–400 ms (`productPage.js` addNextStepButtons + MutationObserver).
- `configurator-enhance.js` beží 40× každých 600 ms (≈ 24 s):
  - obalí číslo kroku do `span.lcd-step-num`,
  - značí `.lcd-k3-layout` a `.lcd-najobjednavanejsie`,
  - prerába karty kufra (`data-lcd-card`, `.lcd-card-title`, `.lcd-save-pct`, `.lcd-upsale-badge`),
  - prepíše ceny boxov solo,
  - pridáva `.lcd-color-label`.
- `.image-wrap` (náhľad voľby) vzniká po kliku v kroku. Pravidlo „farba len náhľad“: hlavnú fotku nemeniť.
- FAQ sa načíta z `/faq/`, `.model-info` („Garancia kompatibility…“) vznikne po výbere auta.

## 3. DOM mapa živého konfigurátora (SK 598)

Všetko je vo `form#product-detail-form` (POST `/action/Cart/addCartItem/?simple_ajax_cart=1`, AJAX Shoptetu).

**Pozor, v popise produktu je duplikát** `.detail-parameters` + `.upsale-Banner` s kartami kufra a boxov (mimo formulára, skrytý). Vždy hľadajte vo formulári: `ctx.form()`, `ctx.krok()`.

`.p-info-wrapper` (deti v DOM poradí):
- `.benefitBanner__item`, `.p-detail-inner-header` (H1), `.p-detail-info`,
- **`.p-final-price-wrapper`**, `.availability-value`, `table.detail-parameters` (skryté selecty Shoptetu),
- **`.content-wrap`** (kroky K0–K3), **`.upsale-Banner`** (kufor + boxy),
- `.upsale-wrap`, **`.add-to-cart`**, `.p-short-description`, `.social-buttons-wrapper`, `.faq`.

| Krok (návrh) | Živý element (`ctx.krok(meno)`) | Ovládače | Select Shoptetu (`ctx.parameter(kluc)`) |
|---|---|---|---|
| 1 Vzor | `vzor`: `.content-wrap > .position-wrap.base-config` s `.patterns-wrap` | 3× `a.button.option-button[data-value=pattern1]`. Odkazy na sesterské produkty Hexa/Stripe, aktívny je Diamond. | — (nie je pole formulára) |
| 2 Vaše auto | `auto`: `.content-wrap > .position-wrap.base-config.active` s `.wheel-Position` | `#model-selector .modl-selector-wrap`: `.surcharge-list.brands / .models / .years / .type-selector select`. Selecty **nemajú name**, posielajú sa cez sessionStorage. Volant `.wheel-Position .option-button[data-value=left/right]`, miesta `.sit-Position [data-value=pass-2..9]` (predvolené 5), dvere `.door-Position [data-value=doors-2..6]` (predvolené 4). Všetko to ide len do sessionStorage. | `typ` (SK 74 / CZ 47) nastaví živý kód z typu karosérie (Combi +15 € …) pri ďalšom kliku na voľbu (`productPage.js` createModelInfo) |
| 3 Farba | `farba`: `.content-wrap > .parameter-wrap.parameter-<id>` (`.order`, `.name-wrap > h5`, `.options-wrap`) | 18× `.button.option-button[data-variant=<id>][data-value=<value>]` (text + `img`) | `farba` = variant (`parameterValueId[78]` SK / `[72]` CZ). Mení `priceId`. |
| 4 Rozloženie | `rozlozenie`: `.parameter-wrap.parameter-<id>.lcd-k3-layout` | 3× `.option-button.radio-row[data-variant][data-value]` s `input[type=radio][name=parameter-<id>]` + `label` + `img config/<slug>.png` | `rozlozenie` (SK 85 / CZ 57). Hodnoty: len 1. rad +0, 1.+2. rad +35 €, všetky 3 rady +155 € (CZ +0 / +899 / +3 899 Kč). |
| 5 Kufor | `kufor`: `.upsale-Banner > .upsale-buttons.trunk` (`.order`, `h5`, `.parameter-cars`, `.next-step-button`) | 3× `.upsale-button.radio[value="<id>-<value>"]` (Classic, Premium, NECHCEM) | `kufor` (SK 88 / CZ 60): dno +129 €, dno + boky +239 €, nie +0 |
| 6 Boxy | `boxy`: `.upsale-buttons.boxs` (`.order`, `h5`, `.parameter-cars`, `.box-config`, `.next-step-button.finish-button`) | karty `.upsale-button[value=conf1]` (1×), `[value=conf2]` (2×), `.upsale-button.none[value=0]` (nechcem). Okno `boxyVyber` = `.box-config` (`.close-btn.close`, `.close-btn.close.bottom` „Nechcem“, `.close-btn.return` „potvrdiť“, `.config-wrap` s `.parameter-wrap.parameter-<id>` pre farbu, 1. box, 2. box a solo) | `farbaBoxov` (91/63), `box1` (94/66), `box2` (97/69), `boxSolo` (104/78). Veľkosti S/M/L/XL podľa textu `S : 33x32x30 cm`. |

- **Cena:** `ctx.krok("cena")` = `.p-final-price-wrapper` obsahuje:
  - `span.price-standard`: `div.recommended-price` („Doporučená cena“ z `productPage.js:141`) + `span` (odporúčaná cena) + `span.price-save` („–39 %“),
  - `strong.price-final`: `div.recommended-price-final` („Aktuálna cena“) + `span.price-final-holder.calculated[data-price]` > `span.calculated-price`.
  - `livePrice.js` píše do `.calculated-price` a vyšle `LuxuryCarPriceRecalculated`. `productPage.js` prepíše odporúčanú cenu a percentá.
- **Košík:** `ctx.krok("kosik")` = `.add-to-cart > button.add-to-cart-button[type=submit]` („Pridať do košíka“). Ďalšie 2 tlačidlá s rovnakou triedou sú v plugine hlavičky `#js-plugin-header` (skryté).

**Validácia a stav** (`functions/configuratorEngine.js`):
- Poradie krokov: `lcdGetSteps()`.
- Kroky kufor/boxy sú vždy „vyplnené“.
- Krok auta je vyplnený, keď všetky 4 selecty majú skutočnú hodnotu.
- Nevyplnený krok pri kliku na „Pridať do košíka“:
  - dostane triedy **`.lcd-needs-fill.selection-required`** (na 3 s),
  - otvorí sa a na mobile sa naň posunie,
  - formulár sa neodošle.
- Box-config sa kontroluje zvlášť (`lcdHandleBoxConfig`): pri vybranom boxe musí mať farbu aj veľkosť.

**Ďalšie správanie živého kódu:**
- Klik kamkoľvek do `.content-wrap` bez auta otvorí okno `.overflow` s `h3` (texts.no_model_select) a tlačidlom `button.btn` („Rozumiem“) (`validation.js`). Pod `body.lcd-1v` nie v karte auta (§15).
- Body má na začiatku triedu `disabled-add-to-cart`, prvý klik na voľbu ju zloží.
- Po `ShoptetCartUpdated` stránka presmeruje na `/kosik/`.

**Udalosti:**

| Udalosť | Kto ju vyšle | Kedy |
|---|---|---|
| `LuxuryCarPriceRecalculated` (detail `{ basePrice, surcharge, total }`) | livePrice | po zmene príplatku |
| `ShoptetVariantChange` | Shoptet | po zmene farby |
| `ShoptetCartUpdated` | Shoptet | po pridaní do košíka |
| `lcd1v:zmena` | ctx.zapis() | interne cez `ctx.na("zmena", fn)` |

**Globálne funkcie:** `window.__lcdSetStepOpen(el, bool)`, `window.__lcdMeasureStep(el)`, `window.__lcdAnchorTo(el, ms)` (akordeón engine).

## 4. Objekt `ctx` (`components/konfigurator1v/ctx.js`)

| Člen | Čo vráti / robí |
|---|---|
| `projectId`, `productId`, `jazyk` (`sk`/`cs`), `trh` (`sk`/`cz`), `setupData`, `texts` | kontext |
| `form()` | `#product-detail-form` |
| `produkt` | `{ id, typ, vzor, url, obsah, kroky, moduly, obal, texty, obrazky }` z registra (`produkty.js` `produkt1v`). `texty` a `obrazky` = `typy/jedno.js` zlúčené s `typy/<typ>.js`. |
| `texty(cast)` | texty typu pre časť: `"kroky"` (`{ postup(z), kroky: { <meno>: { nm, ti, vy, pod, chyba, pozn, dalej } } }`), `"cena"` (`{ typ, lista(info)? }` — `lista` = popis lepivej lišty, napr. rohože „Diamond Line · rohož do kufra“; vetu „Cena za … na mieru“ rámik ceny nemá, Michal 15. 10. 2026), voliteľne `"rozlozenie"`, `"kuforBoxy"` (prepisy textov modulu). Nič -> `{}`. |
| `obrazokVzoru(kluc)` | `typ.obrazky[kluc][vzor produktu]`, inak Diamond; kľúč nie je -> `null`. Kľúče `jedno`: `rozlozenie-1..3`, `kufor-classic`, `kufor-premium`, `kufor-nie`, `boxy-0..2`. |
| `parameter(kluc)` | `{ kluc, id, meno, select, variant }` podľa `data-parameter-name`. Kľúče: `farba, farba2, rozlozenie, kufor, farbaBoxov, box1, box2, box3, boxSolo, typ` (alebo číslo ID). `farba2` = dvojvrstvové (SK 71, variant), `box3` = box 616 (SK 100). Na boxe 616 je `farba` farba boxu. |
| `moznosti(kluc)` | `[{ hodnota, text (bez „+€N“), cena (príplatok s DPH zo Shoptetu), zvolena }]` |
| `precitaj(kluc)` | aktuálna hodnota selectu (`""` = nič) |
| **`zapis(kluc, hodnota)`** | **jediný zápis voľby** (sekcia 5). Vráti `"tlacidlo"`, `"karta"`, `"select"`, `"uz"` alebo `null`. Navyše `zapis("pocetKs", n)` (n = 1, 2 alebo 3) = počet boxov na produkte 616 (živé tlačidlo „N ks“; živý kód vyprázdni veľkosti nad počtom; chyba `priceActualization is not defined` z `creatButtons.js` je od integrácie WA opravená, na CDN do vydania ostáva). Zvolené veľkosti boxov v rozsahu počtu ostanú — živé „1 ks“ by zmazalo aj 1. box, `zapis` ho vráti cez živé tlačidlo; vyprázdnené veľkosti nad počtom dostanú `change` (prepočet živej ceny). |
| `krok(meno)` / `menoKroku(el)` | živý element kroku: `vzor, auto, farba, farba2, rozlozenie, kufor, boxy, boxyVyber, kosik, cena`; box 616 `pocet` (dieťa `.content-wrap` s `.amount-wrap`) a `velkost` (dieťa `.content-wrap` s `.parameter-sizes`). `menoKroku` skúša najprv kroky produktu. |
| `kroky()`, `vyplneny(el)`, `prvyNevyplneny()` | pravidlo validácie košíka + pravidlá typu (`pravidloKroku`). `prvyNevyplneny() === null` znamená „Vložte do košíka“, inak „Dokončite výber“. |
| `vyplnenyZivo(el)`, `prvyNevyplnenyZivo()` | len živé pravidlo (`lcdStepFilled` / `lcdFirstUnfilled`) = to, čo pustí živé tlačidlo košíka |
| `pravidloKroku(el, fn, { kosik })` | háčik typu (integrácia WA 14. 10. 2026): sprísni „krok vyplnený“ — `fn(true)` sa volá, až keď živé pravidlo krok berie ako vyplnený; `kosik: false` = len stav karty a postup (nie košík). Vráti zrušenie. Box 616 (od 23. 10. 2026 jedna karta): krok Farba = farba + veľkosť KAŽDÉHO boxu v počte (`kosik: true`). Živé tlačidlo košíka pravidlo nepozná — modul typu ho pred ním stráži sám (capture klik na `window`, `boxy-produkt.js`: každé `button.add-to-cart-button` aj „Pokračujte k súhrnu“ karty). |
| `hacik(meno, fn)` / `hacikom(meno, …arg)` | háčiky modulu typu pre spoločné moduly (jeden na meno, vráti zrušenie; zlyhaný háčik = `undefined`): `"cena:lista"` (`info { vzor, rozlozenie, farba }` -> text lepivej lišty; box „Box do kufra ×2 · S + L · <farba>“), `"cena:od"` (-> najnižšia možná suma, kým výber nie je úplný; box: nevybraté veľkosti v počte = najlacnejšia) |
| `zlozit()` | návrat na starý vzhľad (index.js) pre chybu, ktorá príde až po init. Obsah z CDN ho zámerne nevolá (pri chybe sa vráti len obsah). |
| `cena()` | `{ zaklad, priplatky, spolu, odporucana, maBeznuCenu, zlava }`. Variant z `necessaryVariantData` podľa `priceId` + zvolené príplatky. Odporúčaná cena = spolu × 1,6 nahor na desiatky (ako `productPage.js`), **len keď produkt má v admine bežnú cenu** (živý `.price-standard` v `.p-final-price-wrapper`, `maBeznuCenu: true`); inak `odporucana` a `zlava` = 0 (613, 625, 616, 637 — nič nevymýšľať, D2). |
| `formatCena(n)` | tvar ceny nového vzhľadu ako v návrhoch (SK `219 €`, NBSP pred menou; CZ `5 664 Kč`) — `sumaText(n, trh)` v `ctx.js` (integrácia 14. 10. 2026; predtým tvar Shoptetu `€219`) |
| `obrazok(meno)` | `…/eshopy/luxuryCar/assets/img/1v/<meno>` |
| *`ceny-ine.js`* (modul, nie člen ctx) | ceny a príplatky **iných** produktov zo živých stránok: `cenaProduktu(url)`, `priplatkyProduktu(url)` (mapa `mapaZFormulara`), `moznostiZMapy(mapa, kluc)`, `cenaTypu(projectId, typ, vzor)`, `priplatkyTypu(…)`. GET cez `stiahniDokument` z `lcdKosikDoplnok.js`, vlastná stránka bez siete, localStorage 24 h (`lcd1vStranka:v2:<cesta>`, všetko v try/catch), chyba -> `null`. `stranka(url)` -> `{ cena, mapa, bezna }`; `bezna` = produkt má v admine bežnú cenu (`.p-final-price-wrapper .price-standard` v cene stránky, rovnaké pravidlo ako `ctx.cena().maBeznuCenu`; v2 od 16. 10. 2026 kvôli tomuto poľu). Odkaz na produkt iného typu: `produkty.js` `najdiProdukt(projectId, typ, vzor)`. |
| *`posun.js`* (modul, nie člen ctx) | posun stránky po dokončení kroku (Michal 24. 10. 2026): `posunNaStred(el)` — „Pokračujte ďalej“, odpoveď, ktorá kartu sama zatvorí a otvorí ďalšiu („Nie, ďakujem“ v ponuke druhej vrstvy / setu), „Pokračujte k súhrnu“: novo otvorený krok (súhrn) VŽDY plynulo do stredu viditeľnej plochy (okno mínus pevná hlavička webu `vyskaHlavicky()`); krok vyšší ako plocha vrchom 12 px pod hlavičku; cieľ až z konečného rozloženia (poloha aj výška prvku stoja, najviac 700 ms), po dobehnutí prepočet a dorovnanie (najviac 2×, len ak stránku medzitým nikto iný neposunul); koliesko, ťahanie prstom (> 10 px) a iný kláves ako Enter / medzera posun zrušia hneď, ďalšie stlačenie (myš, prst, Enter / medzera) až po 500 ms — skôr je to druhé stlačenie toho istého dvojkliku / dvojťuknutia (nález recenzie 24. 10. 2026: dvojklik posun zrušil, stránka stála, nadpis nového kroku nad oknom); samotný klik druhého stlačenia sa zahodí — skutočný klik, ktorý prehliadač označí za dvojklik (`detail ≥ 2`, do 500 ms), klik na plochu prechodu na iný produkt (CELÁ dlaždica druhej vrstvy `.lcd1v-druha__dlazdica`, CELÝ banner setu `.lcd1v-komplet__bs` — klik kamkoľvek = Áno) do 500 ms, alebo klik na iný ovládač (hlavička, „Pokračujte“, „Nie“, košík) do 350 ms (iPhone dvojťuknutie neoznačí): zbalený krok vytiahne pod kurzor hlavičku / „Pokračujte“ nižšieho kroku a druhé stlačenie by otvorilo iný krok, posun ťahá dlaždicu / banner popod prst a druhé ťuknutie by odviedlo na iný produkt (nález recenzie 24. 10. 2026: stráž chránila len tlačidlá Áno, 619 → set, 598 → 601); ochrana aj stráž merajú čas VSTUPU (`Event.timeStamp`), nie spracovania — zaneprázdnený telefón druhé ťuknutie spracuje neskôr, stráž ostáva počúvať 2 s; neskôr ručné otvorenie / zatvorenie hlavičkou posun zruší; „Pokračujte ďalej“ v `kroky.js` sa neposúva len vtedy, keď neprejde validácia (`lcdOverKrok(krok, true)` pri kliku = podmienka enginu; posúva engine) — nie podľa globálnej `.lcd-needs-fill`, tá drží 3 s aj po doplnení (nález recenzie 24. 10. 2026); `prefers-reduced-motion: reduce` = skok (`instant` — `html` má na webe `scroll-behavior: smooth`). Používajú `kroky.js`, `druha-vrstva.js`, `komplet-ponuka.js`, `vzorky-produkt.js`; `vyskaHlavicky()` / `plynulo()` aj `boxy-produkt.js`. Nemení: klik na hlavičku kroku (drží kliknutú hlavičku na mieste), posun pri chybe / validácii, `cena.js`, `prenos.js`, kamióny. Test `posun-nastred`, `posun-bez-animacie`, `posun-po-chybe`, `posun-dvojklik`, `posun-dvojtuk-prechod`. |
| **`doKosika()`** | klik na živé „Pridať do košíka“. Validáciu aj odoslanie robí živý kód. |
| `na(meno, fn)` / `vysli(meno, detail)` | udalosti medzi modulmi. Vlastné mená s predponou modulu (`kroky:otvoreny` …). |
| `ked(podmienka, fn, { limit })` | čaká na asynchrónny DOM (každých 100 ms) |
| `chyby` | chyby z `init()` modulov |

## 5. Jediná schválená cesta zápisu

1. Voľbu zákazníka zapíše **len `ctx.zapis(kluc, hodnota)`**. Funkcia klikne natívnym `.click()` na existujúci živý ovládač vo formulári:
   - `.option-button[data-variant][data-value]`, alebo
   - `.upsale-button[value="<id>-<hodnota>"]`, alebo
   - karta počtu boxov `0 / conf1 / conf2`.

   Tým bežia všetky pôvodné handlery: `priceActualization` → `$(select).val(v).trigger("change")`, variant a `priceId` Shoptetu, livePrice, TYP z auta, aktívne triedy pre validáciu, odporúčaná cena. Až keď ovládač neexistuje, nastaví select rovnakou cestou `$(select).val(v).trigger("change")`.
2. Auto sa vyberá v živých selectoch `.modl-selector-wrap select` (natívny `change`). Ten zapíše sessionStorage `Brand/Model/Year/carType/model` a z toho vznikne poznámka objednávky `#remark` (`main.js` addNote).
   - Nový vzhľad môže selecty preštýlovať, alebo ich ovládať vlastným prvkom.
   - Vlastný prvok však musí nastaviť **ten istý `<select>`** a vyslať `change`.
3. Do košíka **len `ctx.doKosika()`**. Platí aj pre lepivú lištu.
4. **Zakázané:**
   - vlastný POST alebo fetch na `/action/…`,
   - ceny natvrdo (vždy `ctx.cena()` / `ctx.moznosti()` / `data-surcharge-*`),
   - ID parametrov natvrdo (vždy `ctx.parameter(kluc)`),
   - mazanie alebo nahrádzanie živého DOM: JS naň kotví za behu (incident 27. 8.). Dovolené je preštýlovať, presunúť a vizuálne skryť (CSS pod `body.lcd-1v`; prvok ostane v DOM aj so svojimi handlermi).
   - nové `<input>`/`<select>` **s atribútom `name`** vo formulári (išli by do POST, test to zachytí).
5. Opakovaný zápis tej istej hodnoty vráti `"uz"` a nič neprepína. Klik na aktívnu kartu by ju totiž odznačil.
6. `zapis("kufor", "")` voľbu zruší. `zapis("pocetBoxov", 0|1|2)` vyberie kartu. Okno box-config (`.upsale-Banner.showConf`) potom otvorí živý kód.

## 6. Kontrakt POST — čo dnes posiela živý web (zachytené 13. 10. 2026, CDN 5db0f33, 1280 aj 390 rovnako)

Auto pri všetkých scenároch: Audi A6 2015 Combi. Farba je 3. voľba (549, Čierna/Čierna, `priceId` 63493).

| Scenár | Telo POST (`application/x-www-form-urlencoded`) | Cena |
|---|---|---|
| `platne` (1.+2. rad, bez kufra a boxov) | `productId=598&priceId=63493&language=sk&parameterValueId[78]=549&surchargeParameterValueId[85]=589&surchargeParameterValueId[88]=&surchargeParameterValueId[91]=&surchargeParameterValueId[94]=&surchargeParameterValueId[97]=&surchargeParameterValueId[74]=470&surchargeParameterValueId[104]=&parameter-85=589&amount=1` | 269 (odp. 440, −39 %) |
| `kufor-classic` (len 1. rad) | `…[85]=586&…[88]=595&…[91]=&…[94]=&…[97]=&…[74]=470&…[104]=&parameter-85=586…` | 363 = 219 + 129 + 15 |
| `kufor-premium` | `…[85]=586&…[88]=601&…[91]=&…[94]=&…[97]=&…[74]=470&…[104]=…` | 473 = 219 + 239 + 15 |
| `box-1` (farba boxov 2., veľkosť M) | `…[85]=586&…[88]=&…[91]=610&…[94]=&…[97]=&…[74]=470&…[104]=734…` | 343 = 219 + 109 (solo M) + 15 |
| `box-2` (Classic + 2 boxy M a S) | `…[85]=586&…[88]=595&…[91]=604&…[94]=622&…[97]=634&…[74]=470&…[104]=…` | 551 = 219 + 129 + 99 + 89 + 15 |
| `ctx-zapis` (len `--novy`, cez ctx) | `priceId=63499&…[78]=555&…[85]=589&…[88]=595&…[91]=613&…[94]=625&…[97]=634&…[74]=470&…[104]=&amount=1` (bez `parameter-85`) | 606 |

Čo z toho vyplýva:
- **Nevybraný kufor alebo boxy = prázdna hodnota** (`[88]=`, `[91]=` …), nie „nie“ (598). Karta NECHCEM pri kufri nemá triedu `.none`, takže automatický výber „nechcem“ v `configuratorEngine.js` ju nechytí. Pri boxoch karta „nechcem“ vynuluje veľkosti. Test povoľuje prázdnu hodnotu aj hodnotu „nie/ŽIADNY“. Nový vzhľad musí poslať jedno z toho, nikdy cenu navyše.
- **610 Hexa: „nie“ stálo v admine +5 €** (chyba adminu, rozhodnutia.md D2; **opravené v admine 22. 10. 2026 na 0 €**, Michal). Pôvodne: Nový vzhľad posiela presne to, čo starý: klik na „Nechcem“ = voľba „nie“ `[88]=598` (+5 €), bez kliku `[88]=` (0 €). Karta „Nechcem“ ukáže „+ €5“ (nie „v cene“) a bez výberu nie je označená žiadna karta — cena na stránke = cena v košíku. Oprava je v admine (Michal).
- **1 box** = `boxSolo` (104), nie `box1`. **2 boxy** = `box1` + `box2`. V sete stojí 1 box (solo) iné peniaze ako 1. box z dvojice: M +109 € vs +99 €.
- **TYP** (74) ide vždy, podľa typu karosérie.
- `parameter-85` (rádio rozloženia) pribudne len pri skutočnom kliku na rádio. Server ho ignoruje, test ho berie ako voliteľný.
- Množina kľúčov = `productId, priceId, language, amount` + `name` všetkých selectov formulára (+ voliteľné rádio). Iný kľúč = chyba.

## 7. Ponuka v košíku (`lcdKosikDoplnok.js`) vs. kroky 5–6

Ponuka v košíku číta príplatky riadku setu (`coChyba(volby, mapa, R)`):
- **rohož** = `"ma"`, keď je `kufor` Classic alebo Premium. Inak `"chyba"`.
- **box** = `"ma"`, keď niektorý z `box1/box2/boxSolo` má veľkosť.

To, čo zákazník vyberie v krokoch 5–6, ide v tom istom riadku košíka. Ponuka ho teda podľa kódu znova neponúkne. **Worker kufor-boxy to musí overiť testom** (`tools/test-kosik-doplnok.mjs` + fixture riadku s `[88]=595` a s boxmi) a strážiť. Úpravy sú dovolené len vo vlastníctve kufor-boxy. Ponuka druhej vrstvy ostáva.

## 8. CSS a obrázky

- Partialy sú **čisté CSS** (nekompilujú sa, `luxuryCar.scss` NIKDY nekompilovať):
  - `assets/css/_lcd1v-kroky.scss`, `_lcd1v-rozlozenie.scss`, `_lcd1v-kufor-boxy.scss`, `_lcd1v-cena.scss`.
  - `tools/vloz-lcd-css.py` ich vkladá do `luxuryCar.css` ako bloky `LCD-1V-KROKY`, `LCD-1V-ROZLOZENIE`, `LCD-1V-KUFOR-BOXY`, `LCD-1V-CENA` (za `LCD-KOSIK`).
  - Typy (T0.1): `_lcd1v-dvoj.scss`, `_lcd1v-kufor.scss`, `_lcd1v-boxy.scss` -> `LCD-1V-DVOJ`, `LCD-1V-KUFOR`, `LCD-1V-BOXY`; obsah podľa typu `_lcd1v-obsah-{dvoj,classic,premium,boxy}.scss` -> `LCD-1V-OBSAH-<TYP>` (pri zlúčení so spoločnými blokmi obsahu 598 ostanú za nimi); vzorkovník `_lcd1v-vzorky.scss` -> `LCD-1V-VZORKY` (posledný blok, T5.1). Selektor typu: `body.lcd-1v[data-lcd1v-typ="…"]`.
  - Obsah pod konfigurátorom: spoločné partialy (`_lcd1v-obsah.scss`, `-a` … `-d`) cielia `:is(#p1v-598-1,#p1v-598-2,.p1v-obsah)` — koreň každého kľúča (`.p1v-obsah`) so špecificitou id (prebije LCD-HOME).
  - Rámik fotiek (Michal 16. 10. 2026, návrh „Vlasová linka“): `_lcd1v-galeria.scss` -> `LCD-1V-GALERIA` (za `LCD-1V-OBSAH-VZORKY`, pred `LCD-1V-COOKIES`) — hlavná fotka `div#wrap` 1 px šampanská linka + zaoblenie 14 px namiesto 5 px zlatého rámu, náhľady bez rámu (aktívny = tenký krúžok), všetky typy; starý vzhľad bez zmeny.
  - Živý H1 jednovrstvových a dvojvrstvových: `cena.js` obalí názov materiálu („Dragonskin Basic/Elite“) do `span.lcd1v-mat`, ktorý `_lcd1v-cena.scss` pod `body.lcd-1v` skryje (návrhy: „Luxusné autokoberce Diamond Line“); `textContent` H1 ostáva rovnaký.
- Box 616 (jedna karta „Vaše boxy do kufra“, Michal 23. 10. 2026; `boxy-produkt.js` + `_lcd1v-boxy.scss`): karta = živý krok Farba (`.lcd1v-k-farba`). Nové prvky v nej (bez `name`, bez tried `.option-button/.options-wrap/.parameter-wrap/.position-wrap/.amount-wrap/.parameter-sizes`): `p.lcd1v-bxp-nadp` (nadpisy sekcií, `--farba`, `--pocet`; v skupine veľkosti `span.lcd1v-bxp-nadp-t` + `em` „vyberte veľkosť“), `p.lcd1v-bxp-chyba[role=alert]` (`--farba` pod vzorkami, jedna v každej skupine veľkostí), `.lcd1v-bxp-pocty > .lcd1v-bxp-ksz > button.lcd1v-bxp-ks[data-ks][aria-pressed]` (segment počtu: `span.lcd1v-bxp-ks-nm` + `b.lcd1v-bxp-od`), `.lcd1v-bxp-velk > .lcd1v-bxp-vgrp[data-box]` (karty `button.lcd1v-bxp-vk[data-hodnota]`), `.lcd1v-bxp-nahlad` (pás 120/160 px), `.lcd1v-bxp-farba-popis`, `div.lcd1v-bxp-spolu[aria-hidden]` (len telefón do 991 px, kópia `.lcd1v-suhrn`). Atribúty: `data-lcd1v-bxp-skryte` na živých krokoch Počet a Veľkosť (skryté nosiče POST), na karte `data-lcd1v-vyber` (zhrnutie „Čierna / béžové šitie · 2 boxy · S + L“) a `data-lcd1v-chyba-cast` = `farba` | `velkost` (s červeným rámom `lcd1v-chyba`), na skupine veľkosti bez voľby `data-lcd1v-chyba`. Poradie v karte (flex `order`): hlavička −10, nadpis farby −5, vzorky 0, chyba farby 44, vybraná farba 45, náhľad 50, počet 60, veľkosti 70, Spolu 85, chyba-tx 90, tlačidlo 95. Ponuka setu `order: 2` hneď pod kartou (§13b). Postup a „Krok 1 z 1“ sú na boxe skryté. Michalovo pravidlo z 18. 10. 2026 „otázka po jednej, zodpovedaná sa zatvorí“ na 616 **neplatí** (novšie rozhodnutie 23. 10. 2026: „všetko na jednom mieste“) — kartu nerozdeľovať späť na kroky.
- **Každý selektor začína `body.lcd-1v`.** Žiadne `@import`, žiadne globálne premenné na `:root`. Premenné daj na `body.lcd-1v`. Výnimka: cookie lišta (`_lcd1v-cookies.scss`, blok `LCD-1V-COOKIES`) je pod `html:root` (pre všetkých) — sekcia 14.
- Test si skladá CSS sám (`vloz-lcd-css.py --vystup <tmp>`), workeri teda `luxuryCar.css` počas práce nemenia.
  - Pred commitom koordinátor spustí `python tools/vloz-lcd-css.py`.
  - CI kontroluje `--check`.
- Vzhľad merať na návrhu (`http://127.0.0.1:8952/jednovrstvove.html`, `#sprv .krok[data-krok=1..6]`, finál v26) cez computed styles a snímky. Patch vrstvy nekopírovať.
- Nové obrázky ukladaj do `assets/img/1v/<nové-meno>` (nikdy neprepisovať existujúci súbor v `assets/img/`). Predpona podľa workera, aby sa mená nebili: `kroky-*`, `rozlozenie-*`, `kufor-*` / `box-*`, `cena-*`; typy `jedno-<vzor>-*`, `dvoj-*`, `rohoz-classic-*`, `rohoz-premium-*`, `boxprodukt-*`. Obrázok, ktorý sa líši podľa vzoru, patrí do `typy/<typ>.js` `obrazky` a modul ho číta cez `ctx.obrazokVzoru(kluc)`.
  - CDN: `ctx.obrazok("meno.jpg")` = `…/eshopy/luxuryCar/assets/img/1v/meno.jpg`. Test ich servíruje lokálne.
  - Do CSS píš absolútnu CDN adresu.
- Luxia (iframe `luxia-*.rostiapp.cz`, `position: fixed`, 76×76 vpravo dole, na 390 px pri x 312 / y 718) **nesmie zakryť ovládače** ani lepivú lištu. Každý klik testu to overuje.

## 9. Test `tools/test-konfigurator-1v.mjs`

E2E test na **živých stránkach** 13 SK produktov a vzorkovníka 637 s lokálnym buildom. Profily produktov (URL, typ, očakávané `priceId` a ceny z plan.md §4) sú v `tools/test-1v/produkty.mjs`. Bez `--produkt` beží 598.

```
node tools/test-konfigurator-1v.mjs                          # 598, sada scenárov z profilu, 1280 + 390, flag vypnutý
node tools/test-konfigurator-1v.mjs --novy                   # to isté s ?novy=1 (ovládače `novy`, kde chýbajú -> `stary`)
node tools/test-konfigurator-1v.mjs --vyvoj --produkt 601    # ?novy=vyvoj: aj typy, ktoré ešte nie sú vydané
node tools/test-konfigurator-1v.mjs --produkt 598,610        # id | all | typ:dvoj | typ:kufor | alias (jedno-hexa, boxy, vzorky …)
node tools/test-konfigurator-1v.mjs --novy --sirka 390 --krok platne,box-2 --snimky C:/tmp/s --vypis
node tools/test-konfigurator-1v.mjs --zdroj cdn --produkt all --sirka 1280 --paralelne 2 --json %TEMP%/1v-baseline.json
node tools/test-konfigurator-1v.mjs --zdroj <sha>            # verzia nahratá na CDN assets/v/<sha>/
```

**Prepínače:**

| Prepínač | Čo robí |
|---|---|
| `--novy` | stránky sa otvárajú s `?novy=1`, ovládače `novy` (kde ešte nie sú → `stary`) |
| `--vyvoj` | `?novy=vyvoj`: nový vzhľad aj na typoch, ktoré ešte nie sú v `ZAPNUTE_TYPY` (rozpracovaný typ). S `--novy` naraz nejde |
| `--produkt <zoznam>` | `598,610` · `all` · `typ:dvoj` · `typ:kufor` · alias `jedno-hexa`, `dvoj-stripe`, `classic-diamond`, `premium-hexa`, `boxy`, `vzorky` … Neznámy produkt = chyba |
| `--zapnute <typy>` | prepíše `ZAPNUTE_TYPY` zo zdroja brány (napr. pri `--zdroj <sha>` so starším stromom) |
| `--krok <scenáre>` | len tieto scenáre (bez `--produkt` na 598). Scenár iného typu, než má produkt, sa nespustí, len sa spočíta |
| `--sirka <px,…>` | predvolene `1280,390` |
| `--zdroj` | `lokal` (predvolené: čerstvý build) · `cdn` (živý web bez buildu) · `<sha>` (verzia z CDN `assets/v/<sha>/`) |
| `--url <adresa>` | iná adresa pre jeden produkt. **Bez `--produkt` len adresa registrovaného produktu**; neznáma adresa = chyba s hláškou (nikdy ticho profil 598). Pre cudziu adresu: `--url <adresa> --produkt <id>` |
| `--paralelne N` | počet Chromov naraz (predvolene 3; živý web šetri `2`) |
| `--limit <s>` | časový limit jedného scenára (predvolene 180, najmenej 30) |
| `--opakuj N` | zlyhaný scenár sa najviac N-krát zopakuje (predvolene **0**). Prešiel na opakovanie = vo výpise `OK*` + prvé zlyhanie |
| `--tolerovat-opakovanie` | `OK*` nie je zlyhanie behu. Bez neho beh s aspoň jedným `OK*` skončí exit 1 |
| `--cpu N` | CPU stránky N× pomalšie (CDP `Emulation.setCPUThrottlingRate`, pomalý telefón / zahltený stroj) |
| `--kolo N` | každú úlohu (produkt × šírka × scenár) spustiť N× — chyba, ktorá sa ukáže len občas (napr. `--krok miesta-podorys --kolo 20 --cpu 5`) |
| `--snimky <priečinok>` | snímka každého scenára aj tesne pred každým „Pridať do košíka“ |
| `--json <súbor>` | výsledky + POST + súhrn podľa produktu (živý POST scenára `platne` vs plan.md §4) |
| `--vypis` | ku každému scenáru POST telá a log |
| `--okno` | Chrome s oknom |
| `--bez-drop` | build bez `--drop:console` (ladenie) |
| `--help` | úvod z hlavičky súboru |

**Výsledok behu (exit kód):**
- `0`: všetko OK (preskočené scenáre a upozornenia `!` nevadia),
- `1`: aspoň jeden scenár ZLYHAL, alebo aspoň jeden prešiel až na opakovaný pokus (`OK*`) bez `--tolerovat-opakovanie`,
- `2`: chyba použitia (zlý prepínač, neznámy produkt alebo adresa, scenár) alebo infraštruktúry (build, Chrome).

**Ako funguje:**
- Chrome bez okna, surový CDP (žiadne npm balíky).
- **Živá stránka.** Požiadavky na `…/eshopy/luxuryCar/assets/v/<sha>/js/luxuryCar.js` a `…/css/luxuryCar.css` dostanú čerstvý lokálny build. Každý beh má vlastný dočasný priečinok, takže paralelné behy sa nebijú.
  - JS: `esbuild assets/js/main.js --bundle --format=iife --loader:.jsx=jsx --minify --drop:console --legal-comments=none`, rovnako ako `production.yml`.
  - CSS: `vloz-lcd-css.py --vystup`.
  - `…/assets/img/1v/*` → lokálne súbory.
  - Kusy obsahu `…/assets/v/<sha>/html/p1v-*.sk.html` (obsah.js `OBSAH_CDN`, D1 = b) → prázdny koreň: konfigurátor sa testuje bez obsahu (obsah.js stav „nic“), živá stránka priečinok `html/` vo svojej verzii nemá a 404 bez CORS by bola chyba v konzole. Obsah testuje `tools/test-1v-obsah.mjs` (z lokálneho `admin-html/dist`). Pri `--zdroj <sha>` idú kusy z CDN tej verzie.
- Prostredie Windows:
  - `node_modules` v gite má len esbuild pre Mac. Test použije rovnakú verziu cez `npx esbuild@0.24.2`: cache npm, beží mimo repa.
  - Chýbajúce `gsap` a `lenis` stiahne raz do `%LOCALAPPDATA%/lcd-1v-test/balicky-*` (verzie z `yarn.lock`, NIE do repa) a esbuild ich nájde cez `NODE_PATH`.
  - Ak chýbajú `assets/js/truck-konfigurator/*.gen.jsx` (sú v `.gitignore`), spustí `truck/build-truck-images.mjs`. Ten existujúce obrázky neprepisuje.
  - `tools/perf-markup.mjs` sa len kontroluje cez `--check`.
- **Brána** sa číta zo zdroja: `konfigurator1v/produkty.js` (`PRODUKTY_1V` + `ZAPNUTE_TYPY`; pred T0.1 `ZOZNAM_1V` v `index.js`). Test z toho vie, na ktorých produktoch má `?novy=1` aj `?novy=vyvoj` zapnúť nový vzhľad.
- **Bezpečnosť:**
  - POST `/action/Cart/addCartItem` sa zachytí (telo sa kontroluje) a zruší. Živý web sa nikdy neobjedná.
  - Iný ne-GET na `/action/` sa zruší a test zlyhá. Výnimka: odmietnutie cookies `CustomerCookieConsent`.
  - Merače sú zablokované, cookie lišta sa odmietne. Žiadna objednávka, žiadny admin, žiadne prihlásenie.
- **Konzola:** nové chyby (výnimky, `console.error`, log error) oproti načítaniu živého CDN. Zdroje tretích strán (twitter, Luxia, Google…) sa ignorujú. Známe chyby živého webu (`znameChyby` v profile) idú ako upozornenie `!`.

**Produkty a ich sada scenárov** (bez `--krok`; plná sada len na hlavnom produkte typu):

| Typ | Produkty | Predvolená sada |
|---|---|---|
| `jedno` | 598 Diamond, 613 Stripe, 610 Hexa | 598: plná (20 scenárov, aj `auto-poradie`, `box-bez-auta`) + `vzor-jedno odporucana-jedno posun-nastred posun-po-chybe posun-dvojklik posun-dvojtuk-prechod`. 613: `brana nulova-zmena platne kufor-classic box-1`, 610: `brana nulova-zmena platne kufor-classic kufor-nie`, obe + `vzor-jedno farba-nahlad vzor-prechod kufor-nie-cena odporucana-jedno` |
| `dvoj` | 601 Diamond, 604 Hexa, 607 Stripe | 601: plná + `farba2-prepni farba2-vzhlad farba2-chyba farba2-odporucanie dvoj-texty posun-nastred posun-po-chybe posun-dvojklik`. 604, 607: `brana nulova-zmena neuplne platne kufor-classic box-2 farba2-vzhlad farba2-odporucanie` |
| `kufor-classic` | 619 Diamond, 625 Stripe, 622 Hexa | 619: `brana nulova-zmena bez-auta neuplne platne dokoncit k-suhrnu kufor-vzhlad vzor-auto kufor-komplet-nie kufor-komplet-ano posun-nastred posun-po-chybe posun-dvojklik posun-dvojtuk-prechod`. 625, 622: `brana nulova-zmena neuplne platne dokoncit k-suhrnu kufor-vzhlad vzor-auto kufor-komplet-nie kufor-komplet-ano` |
| `kufor-premium` | 628 Diamond, 634 Stripe, 631 Hexa | 628 ako 619. 634, 631 ako 625 |
| `boxy` | 616 Box do kufra | `brana nulova-zmena neuplne platne box-pocet-2 box-pocet-3 box-3-na-1 dokoncit k-suhrnu box-start box-2-neuplne box-farby box-jedna-karta box-komplet-nie box-komplet-ano box-komplet-od box-komplet-seda box-komplet-bezova box-komplet-3 posun-nastred posun-bez-animacie posun-dvojtuk-prechod` |
| `vzorky` | 637 Vzorkovník | `brana nulova-zmena platne vzorky-0 vzorky-odober vzorky-nahlad posun-nastred posun-bez-animacie posun-dvojklik` |

Scenáre typov (`scenare-<typ>.mjs`, nižšie) sú v profiloch od integrácie WA (14. 10. 2026); bez flagu sa samy preskočia.

Profil nesie aj očakávané `priceId` a sumy (`platne`, `ceny`): scenár, ktorý vráti inú sumu, ZLYHÁ. `odporucana: false` (613, 625, 616, 637): v admine chýba bežná cena, odporúčaná sa nemá ukázať (pozri Prísnosť).

**Scenáre** (`--krok`). Jadro je v `tools/test-konfigurator-1v.mjs`, scenáre typov v `tools/test-1v/scenare-<typ>.mjs`:

| Scenár | Typy | Čo overí |
|---|---|---|
| `brana` | všetky | bez flagu nič; s flagom zapne body.lcd-1v (aj `window.__lcd1v`) len na produktoch zapnutých v bráne, platí v karte; CZ Diamond (iný projekt) nikdy; nezapnutý typ (dnes 601) a **610** (rovnaký typ ako 598) nie, kým ich brána nezapne (keď ich zapne, nový vzhľad **musí** naskočiť); `?novy=0` vypne |
| `nulova-zmena` | všetky | flag vypnutý: lokálny build = živý CDN toho istého produktu (DOM, počty selectov, ceny, štýly, triedy body). Rozmery majú toleranciu 6 px, všetko ostatné presne. S `--novy` vypíše aj rozdiel `?novy=1` oproti CDN (len informácia). Pri `--zdroj cdn` sa preskočí |
| `bez-auta` | jedno, dvoj, kufor-* | klik na hlavičku farby bez auta: starý vzhľad výzva na auto; nový vzhľad (§15) bez výzvy, otvorená len karta auta s červeným rámom; `pridajDoKosika` → POST 0, červený rám na `auto` |
| `neuplne` | jedno, dvoj, kufor-*, boxy | postupne každý povinný krok (jedno: auto, farba, rozloženie · dvoj: + farba 2. vrstvy · rohož: auto, farba · box: farba, veľkosť): červený rám na ňom, POST 0 |
| `platne` | jedno, dvoj, kufor-*, boxy | úplný výber → POST: kľúče = polia formulára, `productId`, `priceId` variantu, farba (aj 2. vrstvy), rozloženie, TYP, kufor/boxy nevybrané; zobrazená cena = variant + príplatky; odporúčaná = ×1,6 nahor na 10 a % zľava; `sessionStorage.model` pre `#remark`; suma a `priceId` proti profilu. Kufor a boxy na začiatku: skryté (`stary.skryteNaZaciatku`) alebo viditeľné (nový ovládač) |
| `dokoncit` | kufor-*, boxy | starý web: „Dokončiť konfiguráciu“ / „Prejsť k ďalšiemu kroku“ na poslednom kroku rovno vkladá → živý POST, zachytený a zrušený, overí sa ako `platne`. Nový vzhľad: preskočené (scenár `k-suhrnu`) |
| `k-suhrnu` | jedno, dvoj, kufor-*, boxy | len nový vzhľad: posledný krok typu „Pokračujte k súhrnu“ nič nevloží, zatvorí kroky a ukáže Spolu; potom košík → platný POST. Box 616: posledný (jediný) krok nového vzhľadu je karta Farba (`TYPY_TEST.boxy.poslednyNovy`, starý vzhľad `posledny: velkost` pre `dokoncit`); pri 1–2 boxoch a úplnom výbere sa najprv sama otvorí karta ponuky setu (§13b), „Nie, ďakujem“ pokračuje na súhrn |
| `ctx-zapis` | jedno, dvoj | len `--novy`: `ctx.zapis` všetkých volieb, `"uz"`, zrušenie kufra, `prvyNevyplneny()`, `ctx.cena()` = Shoptet, `ctx.doKosika()` → POST |
| `kufor-classic`, `kufor-premium` | jedno, dvoj | POST s `kufor`, cena |
| `box-1`, `box-2` | jedno, dvoj | 1 box (solo) / Classic + 2 boxy (farba, veľkosti) → POST, cena |
| `kufor-nie`, `box-nie` | jedno, dvoj | Classic → Nechcem / 1 box → Nechcem: POST bez kufra / boxov (prázdne alebo „nie“), cena bez nich. Voľba „nie“ s príplatkom > 0 (610 mal +5 € do 22. 10. 2026) je upozornenie (chyba v admine), nie zlyhanie |
| `rady-3` | jedno, dvoj | všetky tri rady (nový vzhľad: 7 miest dlaždicou v kroku 4 = aj krok 2 a `seatPosition`) → POST, cena s 3. radom |
| `box-krizik` | jedno, dvoj | len nový vzhľad: nový výber boxov zavretý krížikom bez potvrdenia = žiadny box (G10b) |
| `box-prepni` | jedno, dvoj | len nový vzhľad: 1 box → 2 boxy, v POST len 1. + 2. box (živý web tu má chybu: samostatný box ostane) |
| `box-farba` | jedno, dvoj | len nový vzhľad: popis „Vybraná farba: …“ pod vzorkami v okne boxov — bez voľby skrytý, po kliku na čiernu s béžovým šitím „Čierna koža, béžové šitie“ (text zvolenej možnosti živého selectu), po zmene priamo v živom selecte nový popis aj farba kresby, po krížiku skrytý; POST 0. Tú istú kontrolu popisu robí ovládač pri každom výbere farby boxov (okno boxov aj krok Farba boxu 616) |
| `miesta-5` | jedno, dvoj | len nový vzhľad: 7 miest + 3 rady → 5 miest: rozloženie sa samo prepne na 1.+2. rad, krok 4 ostane otvorený, POST bez 3. radu |
| `miesta-podorys` | jedno, dvoj | len nový vzhľad: pôdorys kreslí presne zvolený počet miest (2 = 1 rad, 4 = 2+2 … 9 = 3+3+3), dĺžka auta, kufor za posledným radom; karty: 6+ miest 1/2/3, 4–5 miest 1/2, **2 miesta len „Len prvý rad“** (§16); 5 miest + 1.+2. rad → 2 miesta = samo 1. rad, cena − príplatok 2. radu, bez POST; späť 5 miest = karty 1/2, výber 1. rad; 2 miesta aj z karty auta; POST = baseline 1. rad |
| `rozlozenie-pretek` | jedno, dvoj (v profile 601) | len nový vzhľad: CPU ≥ 4× (CDP), 20 dávok náhodných klikov v stránke (dlaždice miest kroku 4, živé miesta kroku 2, viditeľné karty; pauzy 0–60 ms aj vnútri 16 ms odkladu `synchronizuj()`); po každej dávke práve jedno aktívne živé tlačidlo = select (POST) = jedna viditeľná označená karta, 2 miesta = len 1. rad, pod 6 miest nikdy 3 rady, dlaždica = krok 2; na konci POST rozloženia = označená karta, cena = POST. Semienko vo výpise (`LCD_PRETEK_SEMIENKO`) |
| `farba2-prepni` | dvoj | zmena farby 2. vrstvy po celom výbere: `priceId` = variant `71-<lux>-78-<farba>`, POST nesie novú Lux |
| `box-pocet-2`, `box-pocet-3` | boxy | 2 boxy S+L, 3 boxy S+S+XL: POST, ceny podľa profilu |
| `box-3-na-1` | boxy | 3 boxy → 1 box: 2. a 3. box prázdne/chýbajú, cena 1 × S |
| `platne` (vzorky) | vzorky | vybrané vzorky → POST nesie presne tieto príplatky „Áno +€5“, záloha = 5 € × počet = súčet z POST; živá Shoptet cena o 5 € vyššia = upozornenie |
| `vzorky-0` | vzorky | bez vzorky: nový vzhľad POST 0; starý pustí POST so všetkými prázdnymi (upozornenie) |
| `vzor-jedno` | jedno | len nový vzhľad: vzor produktu v celej karte (body `data-*`, krok 1, názov radu, štítok typu, „N farieb na výber“), nič z cudzieho vzoru |
| `farba-nahlad` | jedno | výber farby mení len náhľad v kroku, hlavná fotka galérie ostáva |
| `vzor-prechod` | jedno | klik na sesterský vzor: správna adresa, flag ostane, auto ostane (kroky.js `prazdnePole`) |
| `kufor-nie-cena` | jedno | Nechcem rohož = presne to, čo pošle živý web (POST `[88]=598`; 610 „nie“ = 0 € od 22. 10. 2026, predtým +5 €, D2) |
| `odporucana-jedno` | jedno | 598/610 Odporúčaná cena (×1,6 nahor na desiatky), 613 (bez bežnej ceny) nie |
| `box-bez-auta` | jedno, dvoj | len nový vzhľad (`scenare-auto.mjs`, kontrola aee13cf 17. 10. 2026): v otvorenom kroku Boxy bez auta klik na „1× box“ aj „2× box“ = ako „Pokračujte ďalej“ v karte auta (§15): bez výzvy, **bez tmavého pozadia a okna boxov**, posúvanie stránky nezamknuté, box sa neoznačí (ani po 0,9 s), len karta auta, 4 červené polia, Značka na obrazovke; nikdy tmavá stránka bez okna; po aute + farbe + rozložení okno boxov normálne, 1 box (farba 1, M) -> POST ako `box-1` |
| `auto-poradie` | jedno, dvoj | len nový vzhľad (`scenare-auto.mjs`): 3 dvere + 4 miesta pred autom = bez výzvy a bez červenej, voľba drží; hlavička Farba bez auta (2×) a vzorka farby v otvorenej karte farby = ako „Pokračujte ďalej“ v karte auta (bez výzvy, len karta auta, 4 červené polia, Značka na obrazovke, vzorka ostane vybraná); „Pokračujte ďalej“ vzoru bez auta = len karta auta bez výzvy; „Pokračujte ďalej“ bez auta = rám karty + 4 červené polia, Značka na obrazovke; pri 560 px výšky a chýbajúcom Type karosérie posun naň; doplnenie = zvýraznenie mizne po poliach; POST = baseline starého vzhľadu, `doorPosition`/`seatPosition` v sessionStorage |
| `farba2-vzhlad`, `farba2-chyba`, `farba2-odporucanie` | dvoj | krok 4: 16 vzoriek (7 + 9), nič predvolené, náhľad bez zmeny hlavnej fotky, chybový text; štítok „Odporúčame“ na jednofarebnej Lux v tóne 1. vrstvy |
| `dvoj-texty` | dvoj | texty kariet a štítku typu podľa návrhu, žiadne zakázané slovo vo viditeľnom texte |
| `kufor-vzhlad` | kufor-* | názov rohože len vizuálne (živý H1 v DOM nezmenený), 3 kroky, auto bez volantu/miest/dverí, ceny dlaždíc proti sesterským stránkam, odkazy, skryté bannery; banner setu mimo medzikroku nie je (17. 10. 2026) |
| `vzor-auto` | kufor-* | prechod dlaždicou na sesterskú rohož: auto ostane (tvrdá kontrola od opravy `prazdnePole`), POST sesterského produktu platný |
| `box-start` | boxy | nový vzhľad: jediná viditeľná karta „Vaše boxy do kufra“ (`.lcd1v-k-farba`) a otvorená, živé kroky Počet a Veľkosť v DOM, ale skryté (`getClientRects().length === 0`), postup a „Krok 1 z 1“ skryté; sekcie zhora nadol nadpis farby < vzorky < segment počtu < veľkosti 1. boxu; 1 box, „od“ v segmente a ceny kariet veľkostí zo živých príplatkov; banner setu mimo karty ponuky nie je; POST 0 |
| `box-2-neuplne` | boxy | nový vzhľad: farba, 2 boxy, len S, košík → červený rám na karte boxov, `data-lcd1v-chyba-cast` „velkost“, veta len v skupine 2. boxu, karta otvorená, POST 0; po L rám zmizne, zhrnutie „… · 2 boxy · S + L“, POST [94] + [97] = 429 |
| `box-jedna-karta` | boxy | nový vzhľad (390 aj 1280): farba → 3 boxy + S, S, XL → 2 → 1; pri každom ťuknutí ostane ťuknutý prvok na mieste (< 2 px), karta otvorená, žiadne okno (`.upsale-Banner.showConf`, `[role=dialog]`, `body.lcd1v-bx-otvorene`); po 3 → 1 ostane 1. box zvolený a len jeho skupina; na telefóne „Spolu“ v karte = `.lcd1v-suhrn__suma` po každom kliku; nové prvky bez `[name]`; „Pokračujte k súhrnu“ pri neúplnom výbere: POST 0, karta otvorená, časť „velkost“, bez posunu na súhrn; poistka: `__lcdSetStepOpen(krok velkost, true)` → do 500 ms zatvorený a karta otvorená |
| `box-farby` | boxy | nový vzhľad: každá farba boxu → náhľad = fotka `assets/img/1v/boxprodukt-farba-*.jpg` (nie živá vzorka), kresba v kroku Veľkosť vo svojej farbe (`box-kresba.js` FARBY_KRESBY, kľúč = názov bez diakritiky), „Vybraná farba“ slovami; svetlý box = **Béžová** (Michal 22. 10. 2026: šedý box je chyba) → `boxprodukt-farba-bezova.jpg`, koža `#d4cbbb`; kým admin 616 hovorí „Šedá“ (558), len to vypíše; POST 0 |
| `vzorky-odober` | vzorky | nový vzhľad: × pri vybranej vzorke ju zruší, POST len so zvyšnými |
| `vzorky-nahlad` | vzorky | nový vzhľad: objednateľné vzorky = živý widget (30), náhľady (15) sa nedajú vybrať, názvy zo živej stránky |
| `druha-nie` | jedno | §13: bez flagu žiadna karta ani kľúč; karta druhej vrstvy skrytá do výberu farby, bez čísla (6 krokov ostáva); kým nie je karta otvorená, žiadna požiadavka na `druha-video-*` (ani poster), `<video>` bez `src`; „Pokračujte ďalej“ vo Farbe ju otvorí -> video č. 1 hrá (`readyState ≥ 2`, čas beží, WebM v Chrome, muted, playsinline, bez ovládania, rámik 4:5 / 1 px / 14 px), č. 2 sa ešte nestiahlo; koniec č. 1 -> hrá č. 2 (až teraz stiahnuté) -> koniec č. 2 -> znova č. 1; po „Nie“ video stojí; príplatok „+ N €“, Áno aj Nie sú skutočné `button type=button` dosiahnuteľné klávesnicou, „Nie, ďakujem“ (bez vety pod ním) -> Rozloženie, POST = baseline (1v-baseline.json); dlaždica podľa návrhu A (19. 10. 2026): „★ Odporúčame“, nadpis „Druhá vrstva“, štítok veľkými „Na celú sadu autokobercov“, riadky cien ako rohož do kufra (`.lcd1v-kb__ucet > .lcd1v-kb__r`, písmo a farby = riadky karty kufra na tej istej stránke, každý na jednom riadku): „Odporúčaná cena“, „Ušetríte −“ (`--zl`, zelené), „Príplatok od + N €“ (`--sum`), Odporúčaná − Ušetríte = Príplatok, čísla spočítané zo stránky (rámik: cena + odporúčaná, vzorec webu × 1,6 nahor na desiatky pre cenu + príplatok); 613 len riadok Príplatok; žiadna prečiarknutá cena, pilulka ani „Vzor, auto aj farba…“; dlaždica na 390 px najviac 480 px |
| `druha-ano` | jedno | §13: `prefers-reduced-motion` = len poster videa, bez `src`, nehrá, nič sa nestiahne; tlačidlo „Áno, chcem druhú vrstvu“ (klik myšou) -> správa, zablokované tlačidlá, dvojvrstvový produkt toho istého vzoru s prenesením vzoru, auta a farby, otvorený krok „Farba 2. vrstvy“ bez predvoľby a bez vety navyše; príplatok = živý rozdiel cien; odporúčaná v karte = rozdiel odporúčaných z rámikov oboch stránok, „Ušetríte“ = odporúčaná − príplatok; POST = baseline dvojvrstvového; Späť vráti auto aj farbu, karta nezodpovedaná |
| `druha-vsetko` | jedno | §13: 3 rady (7 miest), rohož Classic a 2 boxy pred „Áno“ (390 px: ťuk na video dlaždice, 1280 px: Enter na tlačidle Áno) -> na dvojvrstvovom rovnaké, okno boxov zatvorené, POST platný; riadky cien pri úplnom výbere „Príplatok“ (bez „od“), čísla = rámiky oboch stránok |
| `prenos-neplatny` | dvoj | §13: kľúč starší ako 10 min, pre iný produkt, s farbou, ktorú produkt nemá -> nič, bez chyby; chýbajúca farba = otvorený krok Farba |
| `kufor-komplet-nie` | kufor-* | §13b (`scenare-komplet.mjs`): karta ponuky setu skrytá do úplného auta, potom bez čísla medzi Autom a Farbou (DOM aj obrazovka), „Krok N z 3“ bez zmeny; „Pokračujte ďalej“ v Aute ju otvorí; texty, 2 fotky (autokoberce vzoru + og:image rohože, lenivo), cenovka „V sete len X €“ / „Samostatne <s>Y €</s>“ / „Ušetríte Z €“ = voľba kufra z GET jednovrstvových + cena z profilu, zelené Áno v dlaždici, zlaté Nie, bez „+ X €“ a zakázaných slov; Nie -> zbalená („Len rohož do kufra“), Farba; POST = baseline |
| `kufor-komplet-ano` | kufor-* | §13b: hlavička karty -> Áno (správa, zablokované tlačidlá) -> jednovrstvové toho istého vzoru: rohož predvybraná (select, živá karta, karta nového vzhľadu), auto prenesené, otvorená len Farba bez predvoľby, kľúč prijatý; farba + rozloženie -> POST; nanovo ručne -> POST zhodný pole po poli |
| `box-komplet-nie` | boxy | §13b: karta skrytá, kým nie je zvolená farba; potom zbalená hneď pod kartou boxov (bez čísla, postup skrytý); hlavička ju otvorí (POST 0, karta boxov zbalená); bez veľkosti „Box do kufra už od X €“ (X = najlacnejší Box solo z GET 598), „Box S samostatne Y €“ (Y = variant + príplatok S z DOM 616); Nie -> karta boxov; M + košík: POST = baseline |
| `box-komplet-ano` | boxy | §13b: 1 × M -> 2 boxy bez veľkostí („už od“ = najlacnejší 1. + 2. box na 598) -> M + L, čísla sa prepočítajú živo (1. box M + 2. box L na 598); „Pokračujte k súhrnu“ v karte boxov ju otvorí sama (karta boxov sa zbalí, POST 0); Áno -> 598: počet, farba boxov podľa názvu (nezávislé porovnanie testu) a veľkosti prenesené, okno zatvorené, otvorené Auto; POST = ručný výber pole po poli |
| `box-komplet-od` | boxy | §13b: „Áno“ v karte otvorenej hlavičkou (veľkosť nezvolená): kľúč `{ pocetBoxov: 1, farbaBoxov }` bez veľkosti; 598: okno boxov otvorené s farbou, bez veľkosti; veľkosť + Potvrďte -> Auto; POST platný (box solo, farba boxov) |
| `box-komplet-seda` | boxy | §13b: farba boxu, ktorú set nemá (test ju nájde porovnaním názvov 616 a 598 — do 22. 10. 2026 „Šedá“; po prestavení svetlého boxu na Béžovú žiadna → preskočí sa): veta „Farba „…“ sa v sete neponúka…“; Áno -> 598: 1 box S bez farby, otvorený krok Boxy s oknom na farbu; farba + Potvrďte -> otvorí sa Auto; POST platný |
| `box-komplet-bezova` | boxy | §13b: svetlý box „Béžová“ (admin 616: 558 „Šedá“ → 561 „Béžová“, 22. 10. 2026), 1 box S: veta „Farba aj veľkosť boxu Vám ostanú.“; Áno -> 598: kľúč prenosu a selecty = Box solo S + farba boxov Béžová (727, podľa názvu), kresba v okne boxov béžová; POST 0. Kým admin 616 hovorí „Šedá“, preskočí sa |
| `box-komplet-3` | boxy | §13b: pri 2 boxoch karta viditeľná, pri 3 boxoch skrytá; „Pokračujte k súhrnu“ v karte boxov rovno na súhrn; POST 3 boxov |
| `posun-nastred` | jedno, dvoj, kufor-*, boxy, vzorky | nový vzhľad (`scenare-posun.mjs`, Michal 24. 10. 2026): po „Pokračujte ďalej“, „Nie, ďakujem“ (druhá vrstva, ponuka setu) a „Pokračujte k súhrnu“ počká, kým posun dobehne (~0,8 s pokoja), a overí stred otvoreného kroku / súhrnu v strede viditeľnej plochy ± 40 px (hlavičku webu meria test sám: prvky `fixed`/`sticky` pri vrchu okna); krok vyšší ako plocha: vrch 0–30 px pod hlavičkou; okraj stránky len keď by krok potreboval ísť ďalej. Posun > 150 px plynulý (≥ 4 polohy stránky). jedno: vzor → auto → farba → druhá vrstva → Nie → rozloženie → kufor, boxy → súhrn · dvoj: … farba 2. vrstvy … · rohož: vzor → auto → ponuka setu → Nie → farba → súhrn · box: karta boxov → ponuka setu → Nie → súhrn · vzorky: 1 → 2 → 3 → 4 → súhrn. POST 0. So starým kódom (CDN pred 24. 10.) zlyhá (napr. 598/1280 auto +68 px) |
| `posun-bez-animacie` | jedno, dvoj, kufor-*, boxy, vzorky | to isté s `prefers-reduced-motion: reduce` (CDP `Emulation.setEmulatedMedia`): rovnaká poloha, ale skokom (≤ 2 polohy stránky po kliku) |
| `posun-po-chybe` | jedno, dvoj, kufor-* | nový vzhľad (`scenare-posun.mjs`, nález recenzie 24. 10. 2026): úspešné „Pokračujte ďalej“ do 3 s po neúspešnom (živá `.lcd-needs-fill` ešte drží — test to overí v okamihu kliku) sa musí posunúť. Auto bez Typu karosérie → neprejde (rám, otvorené len auto) → Typ → znova ~1,6–2,5 s po chybe (po overovacom posune enginu) → Farba (rohož: ponuka setu alebo Farba) v strede ± 40 px; jedno / dvoj aj Farba bez vzorky → vzorka → znova → karta druhej vrstvy / Farba 2. vrstvy v strede. POST 0. So starou podmienkou (globálna `.lcd-needs-fill`) zlyhá: 598/390 farba −465 px, 601/1280 −330 px, bez posunu |
| `posun-dvojklik` | jedno, dvoj, kufor-*, vzorky | nový vzhľad (`scenare-posun.mjs`, nález recenzie 24. 10. 2026): dvojklik (telefón: dvojité ťuknutie cez CDP dotyk) na „Pokračujte ďalej“, druhé stlačenie ~120 ms po prvom na tom istom mieste — posun sa nesmie zrušiť a druhé stlačenie nesmie otvoriť iný krok (často trafí hlavičku nižšieho kroku). Vzor s tlačidlom pri vrchu okna (20 % výšky) → Auto v strede (telefón: vrch pod hlavičkou); jedno / dvoj aj Auto → Farba; vzorky 1 → 2 → 3. Odstup stlačení meraný v stránke (≥ 450 ms = pomalý beh → zlyhá s touto hláškou), v info čo ktoré stlačenie trafilo. POST 0. Bez ochrany 500 ms (`OCHRANA = 0`) zlyhá 8/8: stránka stojí, nadpis nového kroku nad oknom (598/1280 auto −207 px, 0 polôh); bez zahodenia druhého kliku sa otvorí iný krok (598/390 „auto ďalej + boxy hlavička“, 601/1280 „+ farba2 hlavička“) |
| `posun-dvojtuk-prechod` | jedno, kufor-*, boxy | nový vzhľad (`scenare-posun.mjs`, nález recenzie 24. 10. 2026): dvojité ťuknutie ako iPhone — prvé dotyk (PC klik), druhé dôveryhodný klik s `detail 1` na tom istom mieste (iPhone ho za dvojklik neoznačí; CDP dotyk áno, preto ho `posun-dvojklik` nezachytí) — na „Pokračujte“, ktoré otvorí kartu s plochou „Áno“ = prechod na iný produkt: jedno Farba → druhá vrstva, rohož Auto → ponuka setu, box karta boxov → ponuka setu. Tlačidlo v 60 % výšky okna (posun ťahá kartu popod prst), okno chatu (Luxia) skryté. Čas vstupu zadáva test (CDP `timestamp`) — CDP pošle ďalšiu udalosť až po potvrdení predošlej, pri zaneprázdnenej stránke by druhé ťuknutie inak vzniklo neskôr; v info „spracované o N ms neskôr“ = koľko neskôr ho stránka spracovala. Odstupy 120 / 200 / 260 / 320 ms: bez prechodu (`.lcd1v-druha--prenos` / `.lcd1v-komplet__prenos`, adresa po 600 ms tá istá), karta otvorená, nezodpovedaná, v strede ± 40 px (vysoká vrchom 0–30 px pod hlavičkou); posledný 400 ms: len bez prechodu (po 350 ms smie prejsť „Nie“ / hlavička). Odstup ≥ 480 ms = pomalý beh → zlyhá s touto hláškou; v info čo druhé ťuknutie trafilo. POST 0. So strážou len na tlačidlách Áno zlyhá 8/8 (598 / 619 / 628 / 616 na 390 aj 1280: „dlaždica / banner mimo tlačidla: druhé ťuknutie spustilo prechod na iný produkt“) |

Požiadavky nového vzhľadu sa kontrolujú len keď existuje príslušný `novy` ovládač:
- štítok „Odporúčaná cena“ (ovládač `cena`),
- kufor a boxy viditeľné od začiatku (`kuforBoxy.skryteNaZaciatku === false`).

**Prísnosť** (T0.2b, 14. 10. 2026: nezávislá kontrola našla povolené miesta):
- **Opakovanie.** `--opakuj` je predvolene 0. Scenár, ktorý prešiel až na druhý pokus (`OK*`), je nestabilný test alebo chyba, čo sa ukáže občas: beh skončí exit 1, kým nie je `--tolerovat-opakovanie` (len na pomalý živý web).
- **Odporúčaná cena bez bežnej ceny.** Produkt s `odporucana: false` (613, 625, 616, 637) nemá v admine bežnú cenu. **Nový vzhľad** (`body.lcd-1v`) tam „Odporúčanú cenu“ ukázať nesmie (ani riadok `.lcd1v-cena__bolo`, ani viditeľný text „Odporúčaná cena“ vo formulári produktu, v cenovom bloku a v lepivej lište; `j.novaOdporucana(s)`) → scenár ZLYHÁ. Platí v `overCenu` (všetky scenáre s cenou) aj vo vzorkovníku (`platne`). **Starý vzhľad** je len upozornenie, lebo prečiarknutú cenu kreslí Shoptet.
- **Farba sa nepreskakuje.** `overPost` pri formulári s parametrom farby (alebo farby 2. vrstvy) vyžaduje `ocak.farba` (`ocak.farba2`): scenár musí farbu zvoliť a odovzdať jej value, inak zlyhá. `priceId` sa potom overuje proti kľúču z variantných selectov a farba v POST proti zvolenej.
- **Brána** v behu s `--novy` overí okrem P aj nezapnutý typ a 610 (pozri tabuľku scenárov).
- **`--url`** bez `--produkt` na neregistrovanej adrese = chyba, nie tichý profil 598.
- **Zaseknutý Chrome.** Pokus (Chrome + scenár + zatvorenie), ktorý trvá dlhšie než 2 × `--limit` + 150 s, je ZLYHAL („tvrdý časový limit“) a jeho Chrome sa zabije. Beh sa tak nikdy nezasekne bez výsledku, keď stroj zahltia iné Chromy (pozri `--paralelne`).

**Ovládače:** `tools/test-1v/ovladac-<krok>.mjs`. Každý exportuje `stary` (živý web, NEMENIŤ) a `novy` (kým je `null`, `--novy` aj `--vyvoj` použijú `stary`). Metódy `novy` musia mať **rovnaké mená a návratové hodnoty** ako `stary`:

| Súbor | Metódy |
|---|---|
| `ovladac-kroky.mjs` | `vyberAuto(t, {znacka, model, rok, typ})` → sessionStorage.model · `vyberFarbu(t, {index})` → value farby · `skusBezAuta(t)` → `{vyzva}` (nový: `{vyzva, otvorene, cerveny}`) · `zavriVyzvu(t)` · `cervenyKrok(t)` → `"auto"\|"farba"\|"farba2"\|"rozlozenie"\|…\|null` · `hodnota(t, kluc)` · `dokonci(t, krok)` → text tlačidla posledného kroku |
| `ovladac-rozlozenie.mjs` | `vyberRozlozenie(t, {index})` → value (0 = len 1. rad, 1 = 1.+2., 2 = všetky) |
| `ovladac-kufor-boxy.mjs` | `skryteNaZaciatku` (bool) · `stav(t)` → `{kufor, boxy}` viditeľné · `vyberKufor(t, "classic"\|"premium"\|"nie")` → value · `vyberBoxy(t, {pocet, farba, velkost, velkost2})` → `{farbaBoxov, box1, box2, boxSolo}` |
| `ovladac-cena.mjs` | `zobrazenaCena(t)` → číslo · `odporucana(t)` → `{cena, zlava, stitok}` (nový vzhľad: `−X %` z pruhu dole v rámiku) · `pridajDoKosika(t)` (nový vzhľad môže klikať lepivú lištu). Rámik hlavnej ceny (návrh 3, Michal 15. 10. 2026) stráži jadro: `overCenu` → `overRamik` (rámik je, veta „… na mieru“ v ňom nie je, Naša cena / odporúčaná / −X % / Ušetríte = živý blok Shoptetu, zápis s NBSP; bez bežnej ceny jedna polovica bez pruhu); vzorkovník `j.ramCeny(s)` v `platne` |
| `ovladac-farba2.mjs` | `vyberFarbu2(t, {index})` → value farby 2. vrstvy (dvojvrstvové); `novy` navyše `otvor(t)`, `stav(t)`, `prepniVysvetlenie(t)` (T1.2) |
| `ovladac-boxy-produkt.mjs` | produkt Box do kufra 616: `vyberPocet(t, n)` · `pocet(t)` · `vyberFarbu(t, {index})` · `vyberVelkosti(t, [..])` · `hodnoty(t)`; `novy` (T3.2) navyše `stav(t)` |
| `ovladac-vzorky.mjs` | vzorkovník 637: `vyberVzorky(t, [id, …])` · `pocet(t)` · `zaloha(t)`; `novy` (T5.1) navyše `otvorKrokVzorky`, `odoberVzorku`, `zobrazenaCena`, `odporucana`, `stav`, `pridajDoKosika` (nemá kartu `.lcd1v-cena`; `--snimky` fotí aj pred jeho košíkom) |

**Pomocník `t`** (`tools/test-1v/pomocnik.mjs`):
- `t.klikni(sel, {index, popis, vRamci})` — **skutočný klik myšou**. Prvok sa posunie do stredu, počká sa, kým stojí, a overí sa, že ho nič nezakrýva (Luxia, lišta, hlavička). Inak test zlyhá.
- `t.cakaj(expr, {ms})`: každé zistenie podmienky má vlastný limit 10 s (zaseknuté `Runtime.evaluate` pri výmene dokumentu / zahltenom stroji sa zahodí a skúša sa znova do `ms`; integrácia WA). Čakania ovládačov na výsledok kliku majú 10–25 s (vrátia sa hneď, keď podmienka platí).
- `t.nastavSelect(sel, text|index)`, `t.ev(expr)`, `t.idParametra(kluc)` (výnimka, keď parameter nie je), `t.maParameter(kluc)` (`null`, keď nie je), `t.moznost(kluc, /regex/)`, `t.zabudni()`, `t.mobil`, `t.sirka`, `t.novy`, `t.pauza(ms)`.
- Kľúče parametrov (`farba`, `farba2`, `rozlozenie`, `kufor`, `farbaBoxov`, `box1`–`box3`, `boxSolo`, `typ`) sa hľadajú podľa `data-parameter-name`, nikdy podľa ID natvrdo.
- Selektory starého vzhľadu a `otvorKrok()` sú v `tools/test-1v/stary-ui.mjs`.
- Nový ovládač kliká na to, čo vidí zákazník v novom vzhľade. Starý DOM, ktorý je vizuálne skrytý, nie.

**Scenár v `scenare-<typ>.mjs`:** `export const SCENARE = { "<meno>": { typy: ["<typ>"], async fn(s, a, pom, ovl, j) { … return { info, post, spolu } | { preskoc } } } }`. `j` = jadro `{ otvor, zaklad, overPost, overCenu, cakajNaPost, nieHodnoty, novaOdporucana, ramCeny, eur, over, pauza, AUTO, TYPY_TEST }`. `overPost(s, post, ocak)` dostane `ocak` s farbou (z `zaklad()`), inak zlyhá. Vrátené `spolu` sa porovná s `ceny[<meno>]` v profile.

**Pred odovzdaním každý worker:** svoj typ s `--novy` (alebo `--vyvoj`, kým typ nie je zapnutý) aj bez flagu zelené na 1280 aj 390. Pri zmenách CSS `--snimky` a porovnanie s návrhom.

**Výsledok behu (14. 10. 2026, worktree 8df75cd + T0.2b):**
- `--produkt 598` (bez flagu, lokálny build): 24 OK + 10 preskočených (34 úloh = 17 scenárov × 2 šírky), exit 0, rovnako ako pred T0.2b,
- `--novy --produkt 598`: 34 OK + 0 preskočených, exit 0, rovnako ako pred T0.2b (`brana` je dlhšia: pribudli 610 aj 601),
- `--zdroj cdn --produkt 610,613,616,637 --sirka 1280 --paralelne 2` (živý web, starý vzhľad): 18 OK + 5 preskočených (`nulova-zmena` a `k-suhrnu` pri CDN), 8 upozornení (610 „nie“ +5 €, 5× `priceActualization` na 616, vzorkovník 637 cena 20 vs 15 €, 637 bez vzoriek pustí POST), exit 0,
- `--zdroj cdn --produkt all --sirka 1280` (T0.2 základ): 72 OK + 27 preskočených, 8 upozornení,
- bez flagu je to nulová zmena (všetkých 14 produktov); s `?novy=1` sa zapnutý produkt líši od CDN novým vzhľadom (`body.lcd-1v`, `data-lcd1v-typ`/`-vzor`, `lcd1v-bublina`, štýly 1V),
- kontrola testu: necielené CSS pravidlo v `_lcd1v-kroky.scss` (bez `body.lcd-1v`) `nulova-zmena` zachytí; umelá chyba (iná očakávaná suma v `produkty.mjs`) → exit 1.

**Po integrácii vlny W0a (14. 10. 2026, T0.1 + T0.2b + opravy integrátora):**
- `--produkt 598 --paralelne 2`: 24 OK + 10 preskočených, exit 0; `--novy --produkt 598`: 34 OK, exit 0,
- `--produkt all --krok brana,nulova-zmena --sirka 1280 --paralelne 2`: 28 OK (nulová zmena bez flagu na všetkých 14 produktoch), exit 0,
- `--novy --produkt 610,613 --paralelne 2`: 20 OK, 2 upozornenia (610 „nie“ +5 €, D2), exit 0; `--novy --produkt 610,613 --krok ctx-zapis`: 4 OK (613 bez bežnej ceny: `ctx.cena().odporucana` = 0),
- `--vyvoj --krok brana --sirka 1280` na 601, 604, 607, 619, 622, 625, 628, 631, 634, 616, 637: 11 OK, `window.__lcd1v.chyby` prázdne.

**Po integrácii vlny WA (14. 10. 2026, T0.3 + T1.1 + T1.2 + T2.2 + T3.2 + T5.1 + opravy integrátora, lokálny build, každý POST zachytený a zrušený):**
- `--produkt all --krok brana,nulova-zmena --sirka 1280,390 --paralelne 2`: 56 OK, exit 0 (bez flagu nulová zmena na všetkých 14 produktoch),
- `--novy --produkt 598,610,613 --paralelne 2`: 78 OK, 4 upozornenia (610 „nie“ +5 €, D2), exit 0,
- `--vyvoj --produkt 601,604,607,619,622,625,628,631,634,616,637 --sirka 1280,390 --paralelne 2`: 194 OK, 2 zlyhalo, 14 preskočených, exit 1 — `619 vzor-auto 1280` (POST so starým `priceId` variantu, Shoptet ho pod záťažou stroja prepísal neskôr) a `619 nulova-zmena 390` (výnimky skriptov Shoptetu `datepicker-sk.js`, `ProductNote.js` pri načítaní); opakovanie `--vyvoj --produkt 619 --krok vzor-auto,nulova-zmena --sirka 1280,390`: 4 OK, exit 0, a 2× `--vyvoj --produkt 619,622,625 --sirka 1280 --krok vzor-auto`: 3 OK, exit 0,
- `tools/test-1v-obsah.mjs --produkt 598,610,613`: 32 OK, exit 0 (bez flagu 0 požiadaviek na kusy obsahu a 0 médií; s `?novy=1` obsah z CDN verzie, na 610/613 „od 230 €“),
- `tools/test-boxy-prepni.mjs`: 8/8 OK, exit 0.

**Po ponuke druhej vrstvy (14. 10. 2026, §13, lokálny build, každý POST zachytený a zrušený):**
- `--novy --produkt 598,610,613,601,604,607 --sirka 1280,390 --paralelne 2`: 178 OK, 0 zlyhalo, 4 upozornenia (610 „nie“ +5 €, D2), exit 0 — z toho `druha-nie`, `druha-ano`, `druha-vsetko` na 598/610/613 a `prenos-neplatny` na 601/604/607, obe šírky; príplatok na karte 598 a 610 + 132 €, 613 + 127 € (Stripe Combi), vždy = živý rozdiel cien,
- `--produkt 598,610,613,601,604,607 --krok brana,nulova-zmena --sirka 1280,390 --paralelne 2` (bez flagu): 24 OK, exit 0,
- `tools/test-1v-obsah.mjs --produkt 598,610,613`: 30 OK, exit 0.

## 10. Vlastníctvo súborov

Od T0.1 (14. 10. 2026) sú moduly 598 súčasťou **jadra**. Jadro mení len vydávacia úloha vlny (T1.1, T2.1, T3.1, T4.1, T5.1; plan.md §2.1):
- `assets/js/components/konfigurator1v/{index,ctx,produkty,ceny-ine,kroky,rozlozenie,kufor-boxy,cena,poznamka,obsah,obsah-cisla,druha-vrstva,prenos,komplet-ponuka}.js`,
- spoločné partialy `assets/css/_lcd1v-{kroky,rozlozenie,kufor-boxy,cena,druha,komplet}.scss`, `tools/vloz-lcd-css.py`, `tools/build-admin-html.mjs`,
- `tools/test-konfigurator-1v.mjs`, `tools/test-1v/{produkty,pomocnik,stary-ui,cdp,scenare-druha,scenare-auto,scenare-komplet}.mjs`,
- `assets/js/lcdKosikDoplnok.js` (+ test a fixture), `assets/js/main.js`, `assets/js/functions/configuratorEngine.js` (exporty),
- tento dokument, `assets/css/luxuryCar.css` a `admin-html/dist/*` (generuje nástroj), `.dashboard/roadmap.md`.

Workeri typov (každý len svoje súbory):

| Worker | Smie meniť |
|---|---|
| **jedno-vzory** (T1.1: 610, 613) | `typy/jedno.js`, `tools/test-1v/scenare-jedno.mjs`, nové obrázky `assets/img/1v/jedno-<vzor>-*` |
| **dvoj** (T1.2: 601, 604, 607) | `konfigurator1v/farba2.js`, `typy/dvoj.js`, `assets/css/_lcd1v-dvoj.scss`, `tools/test-1v/ovladac-farba2.mjs` (len `novy`), `tools/test-1v/scenare-dvoj.mjs`, `assets/img/1v/dvoj-*` |
| **kufor** (T2.2: 619–634) | `konfigurator1v/kufor-produkt.js`, `typy/kufor-classic.js`, `typy/kufor-premium.js`, `assets/css/_lcd1v-kufor.scss`, `tools/test-1v/scenare-kufor.mjs`, `assets/img/1v/rohoz-classic-*`, `rohoz-premium-*` |
| **boxy** (T3.2: 616) | `konfigurator1v/boxy-produkt.js`, `konfigurator1v/box-kresba.js` (kresba boxu a farby kresby — používa ju aj okno boxov `kufor-boxy.js` na 598/610/613/601/604/607, 18. 10. 2026), `typy/boxy.js`, `assets/css/_lcd1v-boxy.scss`, `tools/test-1v/ovladac-boxy-produkt.mjs` (len `novy`), `tools/test-1v/scenare-boxy.mjs`, `assets/img/1v/boxprodukt-*` |
| **vzorky** (T5.1: 637) | `konfigurator1v/vzorky-produkt.js`, `typy/vzorky.js`, `assets/css/_lcd1v-vzorky.scss`, `tools/test-1v/ovladac-vzorky.mjs` (len `novy`), `tools/test-1v/scenare-vzorky.mjs` (+ register 637 v jadre v rámci svojho vydania) |
| **obsah <typ>** (T1.3, T2.3, T2.4, T3.3) | `konfigurator1v/obsah-<typ>.js`, `assets/css/_lcd1v-obsah-<typ>.scss`, `admin-html/src/p1v-<typ>/*`, `tools/test-1v/obsah-<typ>.mjs`, `assets/img/1v/obsah/<typ>-*` |

Stuby z T0.1 (modul `init(){}`, typ len so spoločnými textami, prázdny partial) existujú pre všetky typy, takže `?novy=vyvoj` funguje na celom registri hneď (surový vzhľad nových krokov, `window.__lcd1v.chyby` prázdne).

Potrebuješ zmenu v jadre? Napíš ju do výstupu, spraví ju vydanie, nerob ju sám. Hranice medzi modulmi:
- **kroky** vlastnia obal a postup (karty, číslo, „Pokračujte ďalej“, posledný krok „Pokračujte k súhrnu“ bez košíka, červený rám). Modul typu na kroku len stavia telo a zhrnutie dáva cez `data-lcd1v-vyber`.
- **cena** vlastní tlačidlo košíka a lištu. Tlačidlo volá `ctx.doKosika()`, text „Dokončite výber / Vložte do košíka“ podľa `ctx.prvyNevyplneny()`.
- **poznamka** (14. 10. 2026, všetky typy okrem vzorkovníka) — „Poznámka k objednávke“ pod tlačidlom podľa návrhov (.pozn-dole): pole je doplnku Shoptetu `ProductNote.js` (`.NoteDiv > textarea#Note`, text do objednávky `#remark` ukladá doplnok, 1V nepridáva nič s `name`). Modul doplní pilulku „nepovinné“, placeholder a vetu z `ctx.texty("poznamka")` { nepovinne, ph, hint }; štýl v `_lcd1v-cena.scss`. Na PC doplnok pole vloží až pri prvom `shoptet.surcharges.updatePrices` -> modul hneď zavolá jeho `showNoteTextArea(productNoteConfig)`. Vzorkovník 637: návrh poznámku nemá -> `_lcd1v-vzorky.scss` pole skryje.
- Starý banner „Hľadáte ešte lepšiu ochranu? … 90 % … CHCEM TO!“ mimo formulára (`.p-detail > .benefitBanner.position--benefitProduct`, vzorkovník 637) skrýva `_lcd1v-obsah.scss` pod `body.lcd-1v`.
- Moduly si posielajú udalosti cez `ctx.na/vysli`.

Git: workeri len čítajú (`status/diff/log`). Commit robí koordinátor po vymenovaných cestách (`node_modules` a build `luxuryCar.js` nikdy).

## 11. Texty pre zákazníka (SK)

Texty prebrať z návrhu.

**Zakázané:**
- „na milimeter“,
- 1. osoba „vyrábame“,
- počty vrstiev,
- záruka ako argument,
- názvy DragonSkin / Elite / Basic v novom texte,
- tvrdenia o uchytení do fixačných bodov auta,
- „Comfort“.

**Povinné:**
- cenový štítok „Odporúčaná cena“ (nie „Doporučená“), bez právnych upozornení.
- Kam produkt patrí (Michal 16. 10. 2026, upresnené večer): na **autokobercoch do interiéru** (598/610/613, dvojvrstvové 601/604/607) ostáva „set“ ako predtým — postup „Váš set v 6/7 krokoch“, tlačidlá „Zostavte si set“, „Vyberte si model a poskladajte set.“, „Set sa prekontroluje…“, „Jeden set na leto aj zimu“; holé „koberce“ = „autokoberce“. Na **rohožiach do kufra** (619–634), **boxe** (616) a **vzorkovníku** (637) vždy konkrétny produkt („rohož do kufra“, „box“) a ponuka setu s plným názvom, nech zákazník vie, čo za tú cenu dostane.
- Michal 17. 10. 2026: všade v novom vzhľade **„autokoberce pod sedadlá“** (všetky pády, „s autokobercami pod sedadlá“, „Vzorky sú pre autokoberce pod sedadlá v osobných autách“), nikdy „do interiéru“ — interiér auta je aj kufor (`grep -rn "do interiéru"` v `konfigurator1v/` a `admin-html/src/` = 0). Na rohožiach do kufra, boxe a vzorkovníku sa cena setu **nepíše ako „+ X €“** (vyzerá ako príplatok k cene hore), ale vysvetlí sa: „Rohož do kufra Premium len za 239 €, keď ju kúpite spolu s autokobercami pod sedadlá“ + „Samostatne <s>340 €</s>“ + „Ušetríte 101 €“, „Box do kufra už od 99 €, keď ho kúpite spolu s autokobercami pod sedadlá“, v obsahu „S autokobercami pod sedadlá len za X €“ / „Len za X € (samostatne Y €)“ (pod tučným „Spolu s autokobercami pod sedadlá“ v stĺpci rohože). Na autokobercoch (598/610/613, 601/604/607) ostáva „set“ a „+ X €“ pri rohoži/boxe v krokoch 5–6 aj „S autokobercami od + N €“ pri druhej vrstve (tam je to naozaj príplatok k setu).
- Banner setu C „Fotka cez celú šírku“ (Michal schválil 17. 10. 2026; `konfigurator1v/set-banner.js`, CSS `_lcd1v-kufor.scss` `.lcd1v-bs`): od 17. 10. 2026 večer LEN telo skrytého medzikroku ponuky setu (§13b, `komplet-ponuka.js`) — Michal: „toto má byť v medzikroku, nie ďalší iný banner“; samostatný banner pod cenou rohože aj boxu zrušený. Čísla živo (`komplet-ponuka.js` cez `ceny-ine.js`: rohož = voľba kufra na jednovrstvových vs. cena stránky; box = box solo / 1. + 2. box pre zvolené veľkosti vs. cena stránky), fotka pozadia `assets/img/1v/set-banner-autokoberce-480.jpg` / `-800.jpg` (autokoberce Diamond béžové z galérie 598, srcset, lenivo), malá fotka = og:image produktu / `boxprodukt-pocet-N.jpg`. Zelené tlačidlo = „Áno, chcem set s autokobercami“ (klik kamkoľvek do banneru = to isté, prenos §13), zlaté „Nie, ďakujem“ pod bannerom. Stuha „Zľava −X %“ cez pravý horný roh (X = round((samostatne − v sete) / samostatne × 100) živo, `percentoZlavy`; pri boxe pre zvolené veľkosti, bez „až“), pod cenou dve bunky „Samostatne <s>Y €</s>“ | „Ušetríte Z €“ (čísla 23 px); malá fotka produktu vľavo pod štítkom autokobercov (telefón) / vpravo dole nad tlačidlom (PC). Štítky drží mimo pásky `.lcd1v-bs__side`. Kontrola: `tools/test-1v/set-banner-kontrola.mjs` (scenare-komplet.mjs).
- Premium v kroku 5 áno (Michal schválil kufor Classic/Premium/Nechcem v konfigurátore).

## 12. Známe nástrahy

- **Mobil, K3:** klik na rozloženie po 350 ms sám zbalí krok a otvorí kufor. Do 700 ms drží na K3 inline `max-height: 50px !important`, po 2,5 s ho zruší (`configuratorEngine.js`). Desktop len odkryje `.upsale-Banner`. **Pod `body.lcd-1v` (integrácia 13. 10.) sa ani mobil sám nehýbe** (`configuratorEngine.js`, podmienka `lcd-1v` pri K3 auto-postupe): krok 4 prepína rozloženie aj pri zmene počtu miest a nesmel by zbaliť krok 2 a skočiť na kufor. Flag vypnutý = správanie bez zmeny.
- **Krok 6 „Pokračujte k súhrnu“** (integrácia 13. 10., `kroky.js`): živé tlačidlo posledného kroku (`.next-step-button.finish-button`) by hneď vkladalo do košíka. Pod 1V ho zachytí capture handler na `document` — kroky zatvorí a posunie `.lcd1v-suhrn` do stredu viditeľnej plochy (`posun.js`, 24. 10. 2026); kontrolu výberu robí tlačidlo košíka. Scenár `k-suhrnu`.
- **Karty kufra a boxov sú prepínače.** Klik na aktívnu ju odznačí a select nastaví na prázdnu hodnotu (`productPage.js` updateUpsale). Preto `zapis` vracia `"uz"`.
- **`conf1` / `conf2`** otvoria `.upsale-Banner.showConf` (box-config).
  - „Nechcem“ / `.close-btn.close` vynuluje farbu aj veľkosti (`resetBoxConfigDefaults`).
  - „potvrdiť“ (`.close-btn.return`) kontroluje farbu a veľkosť.
- **`.order`:** text čísla kroku obalí `configurator-enhance` do `span.lcd-step-num`. `productPage.js` čísla kufra a boxov prepisuje (`contentStepCount`).
- **Hlavičky krokov** (`.order`, `h5`, `.variant.name`) otvárajú akordeón cez delegovaný handler na `document`. Pozor na dvojité prepnutie, ak pridáte vlastný klik.
- **Okno „vyberte model“** sa ukáže pri **akomkoľvek** kliku do `.content-wrap` bez kompletného auta. Výnimka: klik vo vnútri `.modl-selector-wrap`; pod `body.lcd-1v` celá karta auta `.lcd1v-k-auto` (§15). Starý vzhľad po 1 s odznačí kliknutú dlaždicu (sessionStorage ostane) — preto tam „zmiznú“ dvere/miesta zvolené pred autom.
- **FAQ:** otázky sú `button type=submit` vo formulári. Odoslaniu bráni len `preventDefault` v `components/index.js`.
- **Štítok galérie** („€350 −37 %“) nesedí s cenou z JS (360 / −39 %). Riešenie patrí worker cena (skryť pod `body.lcd-1v`).
- **CZ** je nedotknutá (brána). Iné ID: farba 72, rozloženie 57, kufor 60, boxy 63/66/69, solo **78**, TYP 47. Ceny v Kč. Preto nikdy ID natvrdo.

## 13. Ponuka druhej vrstvy a prenos výberu (Michal 14. 10. 2026)

Návrh: `druha-vrstva.html` (texty, dlaždice), technický rozbor `prenos` (kľúč, zápis cez živé ovládače). Rozhodnutia Michala z 14. 10. 2026 platia pred rozborom: karta NIE je číslovaný krok, na dvojvrstvovom žiadna veta navyše.

| Čo | Kde | Pravidlo |
|---|---|---|
| Karta otázky | `konfigurator1v/druha-vrstva.js` (`TYPY.jedno.moduly`, len 598/610/613) | nový `div.lcd1v-krok.lcd1v-druha` v `.content-wrap` hneď za krokom Farba, BEZ tried `.position-wrap/.parameter-wrap` a bez `name` -> nie je v `lcdGetSteps`, validácia košíka aj „Krok N z 6“ / postup sa nemenia. Skrytá (`hidden`), kým nie je zvolená farba. Bez čísla (namiesto čísla prázdne miesto, po „Nie“ fajka). Nepovinná: bez odpovede = Nie. |
| Otvorenie | to isté | „Pokračujte ďalej“ vo Farbe (capture na `document`, ako posledný krok v `kroky.js`) otvorí kartu namiesto Rozloženia, kým nie je zodpovedaná; nevyplnená farba = živá validácia ako doteraz. Hlavička karty ju otvára / zatvára. Otvorenie živého kroku kartu zatvorí. |
| Áno | to isté | zlatá dlaždica `div.lcd1v-druha__dlazdica` (vzhľad `.lcd1v-kb__karta`; od 15. 10. 2026 `div`, nie `button`) so skutočným zeleným tlačidlom `button.lcd1v-druha__ano` (zelené od 16. 10. 2026) „Áno, chcem druhú vrstvu“ dole cez celú šírku (Michal: „ani neviem, že na to môžem kliknúť“; klávesnica = tlačidlo, klik kamkoľvek do dlaždice robí to isté — jeden poslucháč na dlaždici; atribút `data-lcd1v-priplatok` nesie tlačidlo); v stĺpci fotky od 16. 10. 2026 krátke video (riadok Video; fotka `druha-vrstva-lux.jpg` z 15. 10. ostáva na CDN, kód ju nepoužíva); príplatok „+ N €“ = cena dvojvrstvového produktu pri tých istých voľbách (`ceny-ine.js stranka` -> `mapa.kom` variantov + rovnaké hodnoty príplatkov) − `ctx.cena().spolu`; chyba siete alebo chýbajúca hodnota = cenovka sa skryje. **Riadky cien** (Michal 19. 10. 2026, návrh A „Video A“: „rôzne rozhádzané tie ceny … jeden štýl ako pri rohožiach do kufra“; predtým od 16. 10. cenovka `.lcd1v-druha__cb` s prečiarknutou cenou a pilulkou): v texte vedľa videa nadpis `.lcd1v-kb__nm` „Druhá vrstva“, zlatý štítok `.lcd1v-kb__po` „Na celú sadu autokobercov“ (príplatok je za celú sadu, nie za 1 ks — Michal 16. 10.) a `.lcd1v-kb__ucet.lcd1v-druha__ucet` s riadkami z `_lcd1v-kufor-boxy.scss` (rovnaké triedy ako `kufor-boxy.js riadky()`): „Odporúčaná cena X €“ (`.lcd1v-druha__r-odp`), „Ušetríte − Z €“ (`.lcd1v-kb__r--zl`, zelené), „Príplatok od + N €“ (`.lcd1v-kb__r--sum`, `__rh.lcd1v-druha__suma`; „od“ kým `ctx.prvyNevyplneny()` nie je `null` — pravidlo hlavného rámika, potom „Príplatok“). Kým nie je cena známa, celý blok skrytý; Odporúčaná a Ušetríte skryté, keď sa nedajú spočítať (613) — ostane len Príplatok bez čiary navrchu. Telefón 360–389 px stĺpec videa 36 %, pod 360 px 30 % (riadky cien na jeden riadok). Odporúčaná druhej vrstvy = `ceil(cena dvoj × 1,6 / 10) × 10 − ctx.cena().odporucana` (rozdiel čísel z rámikov oboch stránok), len keď obe stránky majú bežnú cenu (`stranka().bezna` cieľa a `ctx.cena().maBeznuCenu`) a je vyššia než príplatok — inak (613) len príplatok. Atribúty tlačidla `data-lcd1v-priplatok` / `data-lcd1v-odporucana`. Texty `typy/jedno.js` `druha.cena`. Klik: správa „Prenášame Váš výber…“, tlačidlá zablokované, `zapisPrenos`, po 450 ms `location.assign` na `najdiProdukt(projectId, "dvoj", vzor).url` (598 -> 601, 610 -> 604, 613 -> 607). |
| Video | to isté (blok „video v dlaždici“) + `typy/jedno.js` `obrazky["druha-video-1" / "druha-video-2"]` + CSS `.lcd1v-druha__ram` / `__video` | Michal 16. 10. 2026 vybral č. 5 „vapka“ (najviac sa mu páči) a č. 1 „príbeh“. Súbory `assets/img/1v/druha-video-vapka.{mp4,webm}` + `-poster.jpg` a `druha-video-pribeh.{mp4,webm}` + `-poster.jpg` (576 × 720, 4:5, bez zvuku, ~12 s, MP4 H.264 faststart ~0,9 MB, WebM VP9 ~0,65 MB, poster ~20–32 kB; „vapka“ je od 16. 10. 2026 zostrihaná z 1080p zdroja (ostrejšia, rovnaké zábery); CI ich nahrá zrkadlom `assets/` na CDN, MP4 ide ako `video/mp4` s `Accept-Ranges`). **Lenivé načítanie:** `<video muted playsinline preload="none">` bez `src` aj bez posteru — pri načítaní stránky sa nestiahne nič; poster + `src` prvého videa až keď je dlaždica na obrazovke (otvorená karta, `IntersectionObserver` > 15 %; bez IO = otvorená karta), potom `play()`. **Striedanie:** po `ended` sa nastaví druhé video (vtedy sa prvý raz stiahne), po jeho konci znova prvé … dookola; poster ďalšieho (~20–32 kB) sa načíta v poslednej 1,5 s. Mimo obrazovky, zbalená karta alebo skrytá záložka = pauza. WebM len kde `canPlayType('video/webm; codecs="vp9"') === "probably"` a nie WebKit (`navigator.vendor` Apple) — Safari/iPhone MP4; chyba WebM -> to isté video v MP4, chyba MP4 -> ostane poster. `prefers-reduced-motion`, `saveData`, 2G/3G: len poster, video sa nesťahuje. Zlyhané `play()` (úsporný režim iPhonu) = ostane poster. Vzhľad: obal `.lcd1v-druha__ram` 4:5 v stĺpci fotky (telefón 44 % ako fotka predtým -> karta nevyrástla; PC `min(40 %, 210 px)`), 1 px `rgba(196,155,49,.6)`, zaoblenie 14 px, jemný tieň (ako `_lcd1v-galeria.scss`), `overflow: hidden` (Safari); samotné `<video>` `border: 0 !important` (starý globálny `video { border: 5px … !important }`). `aria-label` = `texty.druha.ano.alt`. Klik/ťuk na video = klik do dlaždice (Áno). |
| Nie | to isté | zlaté tlačidlo `button.lcd1v-druha__nie` „Nie, ďakujem“ pod dlaždicou (tvar „Pokračujte ďalej“; od 16. 10. je zelené „Áno“ — zelené = kam chceme zákazníka): karta sa zbalí („Bez druhej vrstvy“) a otvorí sa ďalší živý krok (Rozloženie). |
| Kľúč | `konfigurator1v/prenos.js` | `sessionStorage["lcd1vPrenos:v1"] = { v: 1, t, z, na, vyber, prijate }`; `vyber` = ID hodnôt (farba, rozlozenie, kufor, pocetBoxov + farbaBoxov + veľkosti len úplné, volant/miesta/dvere z aktívnych dlaždíc kroku 2). Prenos platí 10 min. |
| Rohož do kufra -> jednovrstvové (Michal 17. 10. 2026) | `komplet-ponuka.js` (skrytý medzikrok s bannerom setu) + `prenos.js zapisVyber` | „Áno“ v medzikroku zapíše `{ z: <rohož>, na: <jednovrstvové vzoru>, vyber: { kufor: <ID voľby Classic = dno / Premium = dno + boky zo živej stránky cieľa> } }`; prijímač ho zapíše cez `ctx.zapis` (klik na živú kartu kufra) a otvorí prvý nevyplnený krok — POST = ručný výber (scenár `kufor-komplet-ano`). Box: počet, veľkosti a farba podľa názvu (`box-komplet-ano`). |
| Prijímač | `prenos.js` (`TYPY.jedno/dvoj.moduly`, posledný) | na cieli (`na === productId`, neprijaté): `prijate` sa zapíše hneď, potom (keď je živý konfigurátor postavený) dlaždice kroku 2 -> `ctx.zapis` farba, rozloženie, kufor -> boxy (počet, farba, veľkosti, živé „potvrdiť“) a otvorí sa `ctx.prvyNevyplneny()` (po prenose „Farba 2. vrstvy“, nič nepredvolené). Hodnota, ktorú produkt nemá, sa preskočí (chýbajúca farba = otvorí sa krok Farba). Späť na zdroji (`back_forward`, `z === productId`, do 30 min): ten istý zápis vráti výber, kľúč sa zmaže; Safari bfcache (`pageshow persisted`) kartu odblokuje. |
| POST | — | všetko ide cez `ctx.zapis` / klik na živé ovládače -> telo POST = starý vzhľad pri tých istých voľbách (scenáre `druha-*` porovnávajú s baseline 1v-baseline.json). |
| Texty | `typy/jedno.js` `texty.druha` | zo schválených návrhov `druha-vrstva.html` / `dvojvrstvove.html`; 15. 10. 2026: nadpis dlaždice „Dvojvrstvové koberce“ (16. 10. 2026: „Dvojvrstvové autokoberce“), pod ním „Prvá prešívaná + druhá vrstva“; od 19. 10. 2026 (návrh A) nadpis „Druhá vrstva“ + štítok „Na celú sadu autokobercov“ (kam produkt patrí), bez vety „Vzor, auto aj farba Vám ostanú.“ a bez vety pod „Nie“; riadky cien `druha.cena` (`odporucana`, `usetrite`, `priplatok`, `od`); tlačidlo `ano.tl`, vrstvy vždy „prvá prešívaná“ / „druhá“ (docs/1v-obsah.md § 15). |
| CSS | `assets/css/_lcd1v-druha.scss` -> blok `LCD-1V-DRUHA` (za `LCD-1V-CENA`) | len pod `body.lcd-1v`. |
| Bez flagu | brána `index.js` | nič: žiadna karta, kľúč ani handler (`nulova-zmena`). |

Neprenáša sa: poznámka k objednávke (doplnok ukladá text až pri vložení do košíka), prenos v novej karte prehliadača, pri zakázanom úložisku a po 10 minútach (auto ostáva vďaka `sessionStorage` živého kódu). Odkaz „Pozrite si dvojvrstvové“ v obsahu pod konfigurátorom kľúč nepoužíva.

## 13b. Ponuka setu s autokobercami na rohoži do kufra a boxe (Michal 17. 10. 2026)

Michal vybral návrh 1 „Ponuka ako druhá vrstva“ (komplet-navrhy `v1-*`) a upresnil: pri kufri skrytá sekcia **predtým**, ako si vyberie farbu; pri boxoch skrytá sekcia hneď **po** poslednom výbere. Telo karty = banner setu C (`set-banner.js`); samostatný banner pod cenou zrušený (Michal 17. 10. 2026 večer: „toto má byť v medzikroku, nie ďalší iný banner“).

| Čo | Kde | Pravidlo |
|---|---|---|
| Karta | `konfigurator1v/komplet-ponuka.js` (`TYPY["kufor-classic" / "kufor-premium" / "boxy"].moduly` za modulom typu) | nový `div.lcd1v-krok.lcd1v-druha.lcd1v-komplet` v `.content-wrap` BEZ `.position-wrap/.parameter-wrap` a bez `name` -> nie je v `lcdGetSteps`, „Krok N z 3“, postup aj validácia košíka sa nemenia. Vzhľad = schválená karta druhej vrstvy (§13; triedy `.lcd1v-druha*` nesie kvôli `_lcd1v-druha.scss`), bez čísla, po „Nie“ fajka. Nepovinná: bez odpovede = Nie. |
| Rohože 619–634 | to isté | v DOM hneď za kartou Auto (pred Farbou), `hidden`, kým auto nie je úplné (`ctx.vyplneny(auto)`). „Pokračujte ďalej“ v Aute ju otvorí (kým nie je zodpovedaná; nevyplnené auto = živá validácia ako doteraz). „Nie“ -> zbalená („Len rohož do kufra“) a otvorí sa Farba. |
| Box 616 | to isté + `_lcd1v-komplet.scss` (`order: 2`; karta boxov `order: 1`) | **Michal 23. 10. 2026 (jedna karta, variant C):** v DOM aj na obrazovke hneď pod kartou „Vaše boxy do kufra“ (kotva = živý krok Farba); `hidden`, kým nie je zvolená farba (živé pravidlo `ctx.vyplnenyZivo`, bez veľkostí) — viditeľná zbalená po farbe a 1–2 boxoch; **pri 3 boxoch nikdy** (set má najviac 2). „Pokračujte k súhrnu“ v karte boxov ju pri **úplnom** výbere (farba + veľkosť každého boxu) otvorí sama s presnými číslami (capture na `window`; neúplný výber zastaví skôr stráž `boxy-produkt.js`, tiež `window`, registruje sa skôr) — Áno: úplný prenos, na 598 rovno Auto bez okna boxov. Hlavičkou sa dá otvoriť kedykoľvek; bez veľkostí banner „už od“ (najlacnejšia veľkosť, ktorú má set aj 616, pri každom boxe; „Box S samostatne“ = variant + jej príplatok). „Nie“: pri úplnom výbere súhrn s košíkom, inak späť do karty boxov. |
| Texty | `typy/kufor-classic.js`, `kufor-premium.js`, `boxy.js` `texty.komplet` | nadpis „Prosíte si aj autokoberce pod sedadlá?“; veta „Rohož do kufra Premium len za 239 €, keď ju kúpite spolu s autokobercami pod sedadlá.“ / „Box do kufra M len za 109 €, keď ho …“ / „Boxy do kufra M + L len za 218 €, keď ich …“; dlaždica „★ Výhodnejšie v sete“, „Autokoberce pod sedadlá“, „+ rohož do kufra Premium“ / „+ box do kufra M“ / „+ 2 boxy do kufra M + L“; rohož: „Vzor aj auto Vám ostanú, rohož bude vo farbe autokobercov.“ (farbu volí zákazník až na autokobercoch); box: „Farba aj veľkosť boxu Vám ostanú.“, farba mimo setu „Farba „Šedá“ sa v sete neponúka, farbu boxu si vyberiete pri autokobercoch.“; zelené „Áno, chcem set s autokobercami“, zlaté „Nie, ďakujem“ + „Pokračujete len s rohožou do kufra / boxom do kufra / boxmi do kufra.“ Vykanie, žiadne „+ X €“ pri cene, zakázané slová §11. |
| Čísla | `komplet-ponuka.js` (`ceny-ine.js stranka` jednovrstvových = tá istá požiadavka ako banner, localStorage 24 h) | cenovka „V SETE LEN“ + veľká cena X, „Samostatne <s>Y €</s>“ (červená čiara), zelená pilulka „Ušetríte Z €“: X = voľba kufra na jednovrstvových toho istého vzoru podľa textu (`volbaRohoze`: Classic = „dno“ bez bokov, Premium = „boky“; tá istá funkcia ako banner) / box: „Box solo“ pri 1 boxe, „1. box“ + „2. box“ pri 2 boxoch podľa písmena S/M/L/XL (`boxyNaCieli`) + príplatok farby boxov, ak ho má; Y = `ctx.cena().spolu`; Z = Y − X. Bez X (sieť, voľba chýba) sa karta neukáže; Y ≤ X = len X. |
| Fotky | `typy/*.js obrazky["komplet-autokoberce"]` | dve reálne fotky nad sebou so zlatým „+“ (rámik 4:5 ako video druhej vrstvy), lenivo: autokoberce pod sedadlá vo vzore (`kroky-vzor-<vzor>.jpg`, box Diamond) + rohož = `og:image` stránky / box = `boxprodukt-pocet-1/2.jpg` podľa počtu. |
| Áno | `komplet-ponuka.js` + `prenos.js zapisVyber` | klik na tlačidlo alebo kamkoľvek do dlaždice: správa „Prenášame Váš výber na autokoberce pod sedadlá…“, tlačidlá zablokované, kľúč `{ z: <táto>, na: <jednovrstvové>, vyber }`, prechod (619/628 -> 598, 622/631 -> 610, 625/634 -> 613, 616 -> 598). `vyber` rohože `{ kufor }`; boxu `{ pocetBoxov, boxSolo | box1 + box2, farbaBoxov }` — farba boxu sa mapuje podľa **názvu** (`klucFarby`: `nazovFarby`, bez diakritiky, sivé = šedé šitie); farbu, ktorú set nemá (dnes Šedá), neprenáša. Auto ide živým `sessionStorage`. |
| Prijímač | `prenos.js` | ako §13: `ctx.zapis` (kufor; boxy počet -> farba -> veľkosti -> živé „potvrdiť“) a otvorí prvý nevyplnený krok (rohož: Farba; box: Auto, keď zákazník auto ešte nevybral). Box **bez farby alebo bez veľkostí** (Áno hneď po počte): zapíše sa, čo je (počet, farba, veľkosti), živé okno boxov ostane otvorené a otvorí sa krok Boxy (okno je v ňom — v zbalenom kroku sa nevykreslí); po potvrdení / zrušení okna prvý nevyplnený krok. Voľby v otvorenom okne boxov `kroky.js` nepresmeruje na auto (§15); karta „1× / 2× box“ bez auta okno neotvorí a ide na auto (§15, `box-bez-auta`). POST = ručný výber (scenáre `kufor-komplet-ano`, `box-komplet-ano` pole po poli). |
| CSS | `assets/css/_lcd1v-komplet.scss` -> blok `LCD-1V-KOMPLET` (hneď za `LCD-1V-DRUHA`) | len pod `body.lcd-1v`: fotky `.lcd1v-komplet__duo`, `+`, prvý riadok cenovky, `order` karty na boxe. |
| Testy | `tools/test-1v/scenare-komplet.mjs` | `kufor-komplet-nie`, `kufor-komplet-ano`, `box-komplet-nie`, `box-komplet-ano`, `box-komplet-od`, `box-komplet-seda`, `box-komplet-bezova`, `box-komplet-3` (§9); `kufor-vzhlad`, `box-start` a `brana` kartu ponuky nerátajú ako krok; `k-suhrnu` na boxe (1 × M, úplný výber): „Pokračujte k súhrnu“ otvorí kartu ponuky, „Nie, ďakujem“ -> súhrn (23. 10. 2026; tým platí aj §9 `k-suhrnu`). |
| Bez flagu | brána `index.js` | nič (`nulova-zmena`). |

## 14. Cookie lišta v štýle C — PRE VŠETKÝCH (Michal 15. 10. 2026)

Michal: „cookie lištu vyber ty, ktorá bude podľa teba najlepšia“ -> návrh C „Prémiová karta“ + „Nastavenia v štýle C“. Po tichom teste (len s flagom 1V, vydanie 3d779e9) Michal 15. 10. schválil **zapnutie pre všetkých návštevníkov SK** a odstránenie ~0,5 s bliknutia starej modrej lišty (príčina: trieda z bundla na konci `<body>`, Shoptet kreslí lištu hneď na začiatku `<body>`). Mení sa **len vzhľad** nad DOM Shoptetu: tlačidlá, triedy `js-*`, `value` a ukladanie súhlasu (`POST /action/CustomerCookieConsent/`, cookie `CookiesConsent`) ostávajú Shoptetu. Texty (veta, nápisy tlačidiel, texty okna) sú v admine Shoptetu — Claude do adminu nevstupuje, návrhy textov ide Michalovi.

**SK a CZ:** CSS aj JS sú v spoločnom bundli/CSS verzie. Živý web sa prepne až adresou verzie v admine — SK po prepnutí na túto verziu (lišta C pre všetkých na SK), **CZ ostáva na svojej verzii (5db0f33, stará lišta) až do vlastného prepnutia sha v CZ admine**; potom dostane to isté (nadpis „Cookies a soukromí“, odkaz „Nastavení cookies“).

| Čo | Kde | Pravidlo |
|---|---|---|
| Pre všetkých | CSS `html:root` + `cookies.js` bez brány | Žiadny prepínač, žiadna trieda z JS potrebná na vzhľad. Návrat = predošlá verzia (sha) v admine. Flag 1V (`?novy=1`) na lištu nemá vplyv. |
| CSS | `assets/css/_lcd1v-cookies.scss` -> blok `LCD-1V-COOKIES` (posledný) | **každý selektor pod `html:root`** (výnimka z „každý selektor začína `body.lcd-1v`“: lišta je na každej stránke). `html:root` = vždy `<html>` s váhou (0,1,1) ako predošlé `html.lcd1v-cookies` -> kaskáda je rovnaká ako v tichom teste. CSS je v `<head>` -> lišta je karta C **od prvého vykreslenia**, aj keby sa bundle vôbec nenačítal (scenár `bez-js`). Rezerva 96 px (`_lcdNativeHdr.scss`) a čierne `#cboxLoadedContent` (`luxuryCar.scss`, „Bender“) sa prebijú (`!important`, vyššia špecificita) — ostávajú v kóde, sú mŕtve len pre okno cookies. |
| `cookies.js` | `konfigurator1v/cookies.js` `initCookies1v()`, volá ju `main.js` hneď po `initAutoPamat()` na **každej** stránke, pre každého | 1) `prepinac()` (flag 1V platí aj mimo produktu), 2) značka `html.lcd1v-cookies` („modul bežal“ — CSS ju nepotrebuje; `nulova-zmena` ju ignoruje), 3) posun bubliny Luxie, 4) odkaz v päte. Nikdy nehádže; bez Luxie, bez päty alebo bez súhlasu v Shoptete nerobí nič. |
| 1. vrstva | `.siteCookies__form` = mriežka | Obal `.siteCookies` bez pozadia a tieňa (Shoptet od 768 px po prvom scrolle pridá `.siteCookies--scrolled` s pozadím `#1A1937` a modrou žiarou -> za zaoblenými rohmi karty boli modré hranaté rohy; kontrola 16. 10. 2026). PC (≥ 1024): karta 960 px v strede dole, 20 px nad okrajom; ikona štítu, nadpis „Cookies a súkromie“ (`.siteCookies__text::before`; CZ `html[lang\|=cs]` „Cookies a soukromí“), „Nastavenie“ ako odkaz s ikonou, Odmietnuť = Súhlasím (172 × 48, rovnaké zlaté). Tablet (768–1023) a telefón: text cez celú šírku, „Nastavenie“ vpravo hore, dve tlačidlá vedľa seba; telefón 10 px od okrajov, karta ≤ 22,5 % výšky okna (SK dnes 186 px z 844). |
| Chat Luxia | `cookies.js` sledujLuxiu + CSS | kým je lišta na obrazovke a chat je zbalený (bublina / uvítanie; `html.lcd1v-cookies-bublina` podľa inline štýlu iframu: otvorený = `border-radius: 20px` na PC alebo `top: 0` / `height: 100%` na mobile), iframe sa zdvihne nad kartu: `bottom = --lcd1v-cookies-vyska + 4 px` (premennú meria `cookies.js` cez ResizeObserver). Otvorený chat sa nehýbe. Otvorené okno nastavení -> chat `visibility: hidden` (len CSS). Kód Luxie sa nemení. |
| 2. vrstva | colorbox Shoptetu: `#cboxContent:is(.cookiesDialog, :has(.cookiesSetting__form))`, `#colorbox:has(#cboxContent.cookiesDialog, #cboxContent .cookiesSetting__form)` | Okno cookies sa spozná podľa **obsahu** (`.cookiesSetting__form`, od prvého snímku otvárania) alebo triedy `cookiesDialog` (Shoptet ju dá až v `onComplete`, ~0,3 s po kliknutí — dovtedy sa mihlo staré biele okno s animáciou výšky). `#cboxLoadedContent` `display: block !important` (colorbox ho počas animácie skrýva) -> okno je celé a na mieste hneď v prvom snímku. Váha selektorov rovnaká ako predtým. PC: čierna karta 640 px v strede okna; telefón: spodný panel cez celú šírku. Inline rozmery colorboxu prebité, rámové bunky (`#cboxTopLeft` …) skryté, obsah sa posúva v `#cboxLoadedContent`, `.cookiesSetting__bottom` je prilepený dole (tlačidlá vždy viditeľné). „Všetko vypnuté“ (`value=none`) = „Povoliť všetko“ (`value=all`), rovnaké zlaté; „Potvrdiť moje voľby“ obrys. Prepínače = label Shoptetu (checkbox ostáva skrytý a prepína ho label): dráha 46 × 26, vypnuté tmavé, zapnuté zlaté s gombíkom vpravo; Nevyhnutné = stály stlmený zapnutý prepínač. Tmavá clona. Iné colorboxy (galéria, vyskakovacie okná) sa nemenia. |
| Odkaz v päte | `cookies.js` `odkazVPate()` + CSS sekcia 3 | GDPR čl. 7 ods. 3 (odvolať súhlas rovnako ľahko ako ho dať): `<button type="button" class="lcd-cookies-odkaz js-cookies-settings">` na konci `#footer .footer-bottom .copyright` — „Nastavenia cookies“ (SK) / „Nastavení cookies“ (CZ, podľa `html[lang]`). Shoptet má delegovaný handler `$("html").on("click", ".js-cookies-settings", shoptet.consent.openCookiesSettingModal)` -> to isté okno ako „Nastavenie“ na lište, s uloženými voľbami, **aj po súhlase/odmietnutí** (lišta už nie je). Len ak `shoptet.config.cookiesConsentIsActive === 1` a funkcia existuje; bez päty (napr. `/kosik/` ju nemá) nič. Nenápadný: písmo a farba copyrightu, podčiarknutý; PC v riadku za copyrightom, telefón samostatný stredený riadok (28 px). Nič existujúce sa neskrýva. Kým je lišta na obrazovke, päta leží pod ňou (lišta má vlastné „Nastavenie“). Telefón do 468 px na produkte: lepkavá lišta „Do košíka“ Shoptetu (`#js-plugin-header.active`, dole, 61 px) ležala aj na úplnom spodku stránky na odkaze (ťuk trafil „Do košíka“; kontrola 16. 10. 2026) -> `body:not(.lcd-1v):has(#js-plugin-header.active) #footer .footer-bottom { padding-bottom: 72px }` (podmienka a výška ako bublina Luxie v LCD-HDR; odkaz 30 px nad lištou). S flagom 1V je lišta Shoptetu skrytá a rezervu dáva lišta 1V (`body.lcd1v-lista-on`). |
| Test | `tools/test-cookies-1v.mjs` | živý web, lokálny build, čistý návštevník (cookies zmazané pred každou stránkou), SK titulka + 598 (+ CZ titulka), 1280 aj 390. **Prvý snímok:** skript pred stránkou v každom `requestAnimationFrame` zapíše štýl lišty v prvom snímku, kde je na obrazovke — musí byť karta C (so starým CSS zlyhá: „mihla by sa stará lišta“). `bez-js` = bundle zablokovaný, karta C aj okno len z CSS. `karta` bez flagu, `flag 598`, okno nastavení (každý snímok otvárania = okno C na mieste), odkaz v päte (pred súhlasom aj po odmietnutí skutočným klikom). Po scrolle (`bez-js`, `karta`): obal priehľadný a bez tieňa aj s `.siteCookies--scrolled`, karta stojí (+ výrez rohu 3×). `odmietnutie titulka / 598 / 598 flag`: na **úplnom spodku stránky** (scrollY = max) odkaz nič nezakrýva (598 na 390: lišta „Do košíka“ musí byť aktívna, inak by sa zakrytie neoverilo) a skutočný klik otvorí okno. So starým CSS (b1bbcc9) zlyhá: obal `rgb(26, 25, 55)` + tieň po scrolle na 1280 a „zakrytý: button#js-plugin-fixed-header-add-to-cart“ na 598/390 (overené). `--len` = len vybrané scenáre. POST súhlasu prejde len ako `consent=none`; súhlas so štatistikou/marketingom sa zruší. |

**Testy, ktoré zatvárajú lištu:** `tools/test-konfigurator-1v.mjs`, `tools/test-boxy-prepni.mjs`, `tools/test-1v/obsah-spolocne.mjs` hľadajú tlačidlo podľa textu `/^(Odmietnu|Odmítnou)/` (`textContent`, CSS `text-transform` ho nemení). Ak Michal v admine zmení nápis (napr. „Len nevyhnutné“), treba ich najprv prepnúť na `.siteCookies__button[value=reject]` (vydanie — jadro).

## 15. Karta auta: overenie až pri „Pokračujte ďalej“ (Michal 16. 10. 2026)

Hlásenie (telefón, `?novy=1`): klik na počet miest/dverí bez značky, modelu a roku vyhodil výzvu „vyberte model“ a zvolené dvere aj miesta zmizli. Príčina: `validation.js` (klik do `.content-wrap` bez auta = výzva + po 1 s `removeClass("active")` na kliknutej dlaždici; sessionStorage `doorPosition`/`seatPosition` ostal, takže objednávka by dostala voľbu, ktorú zákazník už nevidel). Starý vzhľad to robí stále (nulová zmena).

Pravidlo pod `body.lcd-1v`:
- V karte auta sa volant, miesta, dvere a polia auta vyberajú **v ľubovoľnom poradí**. Počas vyberania nič nesvieti načerveno.
- **Výzva „Prosím, najskôr vyberte model“ sa pod 1V neukazuje vôbec** a nič sa po 1 s neodznačí (`validation.js`: pod `body.lcd-1v` hneď `return`). Michal: „verifikácia by sa nemala vyvolať, až keď klikne na Pokračovať a niečo nemá vybraté — tak mu zvýrazni, čo nevybral.“
- Overenie až pri „Pokračujte ďalej“ (alebo košíku): živý engine dá `.lcd-needs-fill` -> `kroky.js` trvalý rám karty + červené presne prázdne polia (`lcd1v-err`) + hláška; verifikačný posun ide na **prvé prázdne pole** (`configuratorEngine.js` `lcd1vPrvePrazdnePole`, bez 1V vrch kroku ako doteraz). Po doplnení poľa jeho zvýraznenie zmizne hneď, rám karty po poslednom.
- **Pokus prejsť na kartu za autom bez auta = „Pokračujte ďalej“ v karte auta** (nezávislá kontrola 16. 10. 2026: klik na hlavičku Farba vyhodil výzvu, zavrel kartu auta, po „Rozumiem“ boli otvorené dve karty a vzorka farby sa po 1 s odznačila). `kroky.js` (capture `click` na `document`, len `isTrusted`): klik zákazníka na hlavičku (`.order`/`.lcd1v-hd`, aj Enter na hlavičke) alebo voľbu (dlaždica, tlačidlo, select…) karty za autom (farba, farba2, rozloženie, kufor, boxy), kým `lcdOverKrok(auto, true)` hlási nevyplnený krok -> `configuratorEngine.js` `lcdOverKrok(auto)` = to isté ako tlačidlo karty auta: `.lcd-needs-fill` (rám + červené polia), otvorená **len** karta auta, posun na prvé prázdne pole. Hlavička: klik ďalej nejde (akordeón by kartu otvoril); voľba: výber ostane (živé handlery dobehnú), prechod na auto až po nich. Programové kliky modulov (prenos, rozloženie, `ctx.zapis`) sa nezdržiavajú. Auto úplné = nič sa nemení. Výnimka (17. 10. 2026, §13b): voľby v **otvorenom okne boxov** (`.upsale-Banner.showConf .box-config`) sa nepresmerujú — zbalením kroku boxov by okno zmizlo a ostalo by tmavé pozadie; po prenose z boxu bez auta sa auto otvorí až po zatvorení okna. **Karta počtu boxov „1× box“ / „2× box“** (aj živá `conf1`/`conf2`) bez auta (17. 10. 2026, kontrola aee13cf: stránka stmavla a okno sa neukázalo — okno sa otvorilo, prechod na auto zbalil krok boxov, tmavé pozadie a zamknuté posúvanie na `body` ostali) = ako hlavička: klik ďalej nejde (okno sa neotvorí, box sa neoznačí — box bez farby by aj tak poistka G10b vrátila na Nechcem) a hneď ako „Pokračujte ďalej“ v karte auta. Zvolené pred okno, nie „okno teraz, auto pri košíku“: rovnaké pravidlo ako ostatné karty za autom (aj rohož v tom istom kroku), modálne okno pred autom by zákazník vypĺňal a potom aj tak skončil na aute. „Nechcem“ okno neotvára — ostáva voľba (výber dobehne, potom auto). Test `box-bez-auta`.
- „Pokračujte ďalej“ ostatných kariet rieši engine sám (prvý nevyplnený krok = auto, bez výzvy); „Pokračujte ďalej“ vzoru (karta **pred** autom) len otvorí kartu auta, bez výzvy a bez červenej.
- Košík/POST sa nemení: dvere a miesta idú len cez sessionStorage (`cart.js` varchar2/varchar3), ako zo starého vzhľadu. Testy: `auto-poradie` (dvere/miesta pred autom, hlavička Farba 2×, vzorka farby v otvorenej karte farby, „Pokračujte ďalej“ vzoru, „Pokračujte ďalej“ bez auta, 560 px, POST = baseline) a `bez-auta` (nový vzhľad: hlavička farby bez výzvy, len karta auta s červeným rámom; starý vzhľad výzva ako doteraz).
- Starý vzhľad (bez flagu) bez zmeny: výzva + odznačenie po 1 s ostáva (`brana` + `nulova-zmena`).

## 16. Rozloženie pri 2 miestach (Michal 16. 10. 2026)

Hlásenie: „keď zvolím, že len dvojmiestne auto, tak mi tam nechá možnosť prvý aj druhý rad — to je zbytočné.“

Pravidlo pod `body.lcd-1v` (jedno aj dvoj, `konfigurator1v/rozlozenie.js` + `_lcd1v-rozlozenie.scss`):
- Auto bez 2. radu (2 miesta; `sedadlaPodlaMiest` = `[2, 0, 0]`, koreň `.lcd1v-rz[data-r2="0"]`) ponúka **len kartu „Len prvý rad“** — karty „Prvý a druhý rad“ aj „Všetky tri rady“ skryje CSS (`data-r2="0"` / `data-r3="0"`).
- Bola zvolená skrytá karta → `synchronizuj()` sám zvolí „Len prvý rad“ cez `ctx.zapis("rozlozenie", …)` (klik na živé tlačidlo voľby = cena aj POST ako starý web; bez POST do košíka). Platí, nech sa počet miest zvolí kdekoľvek: dlaždice v kroku Rozloženie aj karta auta (krok 2) — zdroj pravdy je živá dlaždica `.sit-Position` / `sessionStorage.seatPosition`, modul ju sleduje cez MutationObserver.
- Späť na 4+ miest sa karty znova ukážu; výber ostane „Len prvý rad“, kým ho zákazník nezmení. 3. rad ostáva podľa návrhu v26 (karta len pri 6+ miestach, 3 rady → menej miest = 1.+2. rad).
- Starý vzhľad (bez flagu) počet miest s rozložením neviaže — bez zmeny (`nulova-zmena`). Test: `miesta-podorys`.

## 17. Kamióny a dodávky SK 640 (typ `kamion`, 18. 10. 2026)

Plán a rozhodnutia: `docs/kamiony-1v-plan.md`. Vzor: schválený artefakt `kamiony-app` (Michal ho ešte prechádza).

- **Brána:** register `produkty.js` 640 → `{ typ: "kamion", obsah: "kamiony" }`, `TYPY.kamion = { kroky: [], moduly: ["kamion"], obal: null }`. Do vydania LEN `?novy=vyvoj` (`kamion` nie je v `ZAPNUTE_TYPY` — pridá vydanie, rozhoduje Michal). O tom, či beží React alebo nové UI, rozhoduje jediná funkcia `budeKamion1v()` (`index.js`): volá ju `productPage.js initProduct` (React sa vtedy nemontuje) a tú istú bránu používa `initKonfigurator1v`. Montáž Reactu je v `truck-konfigurator/mount.js` (presunutá 1:1 z `productPage.js`). Bez flagu = presne dnešný React (test `tools/test-kamion-brana.mjs`, živý `nulova-zmena`).
- **Poistka (nikdy prázdna stránka):** `kamion/index.js init` overí formulár, stĺpec, natívne tlačidlo, `meta[itemprop=price]`, všetkých 15 selectov príplatkov (podľa `data-parameter-name`) a zhodu materiálov Shoptet = konfigurátor; chýba čokoľvek → `throw` → `index.js zlozit()` → `kamion.zlozit()` = upratanie + `mountTruckConfigurator()`. To isté pri chybe po štarte (klik, zmena → `ctx.zlozit()`), pri `ctx.zlozit()` iného pôvodu a pri chybe skôr, než sa modul zaradil. `zlozit()` v `index.js` najprv volá `zlozit()` modulov typu, ktoré ho exportujú (dnes len `kamion`).
- **Moduly:** `kamion/data.js` (materiály, farby, lemovania, nášivky, nite z kódu Reactu; vozidlá z `truck-brands.js`; prečiarknuté „samostatne“ ceny = `FALLBACK_PRICES_EUR`, Shoptet ich nemá), `texty.js` (texty artefaktu, prešli kontrolou — pripomienky Michala sem), `cena.js` (port artefaktu, bez chýb Reactu Z1/Z2), `shoptet.js` (živé ceny zo selectov + DOSLOVNÁ kópia `normalizeOptionText`/`findMatchingOption`/`resolveValue`/`syncToShoptet` z `konfigurator.gen.jsx`), `stav.js` (stav UI + adaptér `naStavReactu(S)` = tvar React `finalConfiguration`), `ui.js` (6 krokov, súhrn, lišta), `index.js` (napojenie).
- **Košík:** každá zmena → `syncToShoptet(naStavReactu(S))` + `upratTapacir` (bez tapacíru prázdne 388/391/394/397/400, N1) + kontrola „súčet Shoptetu = cena konfigurátora“ (inak `console.error`); zmena zároveň zruší čakajúci klik do košíka. „Pridať do košíka“ → finálny sync → kontrola povinných selectov → tlačidlá „odosiela sa“ (`disabled` + `aria-busy`, do `ShoptetCartUpdated`, najviac 3 s) → o 100 ms: výber sa nezmenil → `persistTruckOrderSummary` (poznámka objednávky ako React) → klik na natívne tlačidlo. Žiadny vlastný POST.
- **DOM:** `body.is-truck-konfigurator` + `.p-info-wrapper.active` (ako React), koreň `.truck-konfigurator-wrap.lcd1v-kamion > #lcd1v-kamion.k-info` na konci `.p-info-wrapper`, hlavička produktu presunutá do koreňa (H1 dostane text artefaktu, pri `zlozit` sa vráti), lišta `#lcd1v-lista.lcd1v-lista` (štýl 1V). Výzvy obsahu `a[href="#product-detail-form"]` otvoria krok Vozidlo; „Napíšte nám“ v súhrne → `#p1v-kamiony-dopravcovia`. Všetky tlačidlá `type="button"`, žiadne `name`.
- **CSS:** `assets/css/_lcd1v-kamiony.scss`, blok `LCD-1V-KAMIONY` (za `LCD-1V-BOXY`), každý selektor `body.lcd-1v[data-lcd1v-typ="kamion"] …` (spravidla s `#lcd1v-kamion`). Časť nad „RUČNE“ generuje `tools/kamion-css-z-artefaktu.mjs` z CSS artefaktu.
- **Čísla v obsahu:** `kamion-material-presivana`, `kamion-tapacir`, `kamion-tapacir-samostatne` (`obsah-cisla.js` z `kamion/cena.js ponuka(citajCeny())`).
- **Testy:** `npm run kamion:test` (cena 68, 1 320 kombinácií proti gen.jsx, košík 10 ciest, brána 40) + `npm run truck:test`; živý: `node tools/test-konfigurator-1v.mjs --vyvoj --produkt 640 --sirka 1280,390` (`kamion-platne` 423 €, `kamion-dodavka` 258 €, `kamion-neuplne`), ručne `--nechaj-otvorene`. Fixture: `node tools/test-1v/kamion-fixture.mjs --z-webu` po zmene príplatkov v admine.
