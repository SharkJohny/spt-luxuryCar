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
- Klik kamkoľvek do `.content-wrap` bez auta otvorí okno `.overflow` s `h3` (texts.no_model_select) a tlačidlom `button.btn` („Rozumiem“) (`validation.js`).
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
| `texty(cast)` | texty typu pre časť: `"kroky"` (`{ postup(z), kroky: { <meno>: { nm, ti, vy, pod, chyba, pozn, dalej } } }`), `"cena"` (`{ typ, zaSet }`), voliteľne `"rozlozenie"`, `"kuforBoxy"` (prepisy textov modulu). Nič -> `{}`. |
| `obrazokVzoru(kluc)` | `typ.obrazky[kluc][vzor produktu]`, inak Diamond; kľúč nie je -> `null`. Kľúče `jedno`: `rozlozenie-1..3`, `kufor-classic`, `kufor-premium`, `kufor-nie`, `boxy-0..2`. |
| `parameter(kluc)` | `{ kluc, id, meno, select, variant }` podľa `data-parameter-name`. Kľúče: `farba, farba2, rozlozenie, kufor, farbaBoxov, box1, box2, box3, boxSolo, typ` (alebo číslo ID). `farba2` = dvojvrstvové (SK 71, variant), `box3` = box 616 (SK 100). Na boxe 616 je `farba` farba boxu. |
| `moznosti(kluc)` | `[{ hodnota, text (bez „+€N“), cena (príplatok s DPH zo Shoptetu), zvolena }]` |
| `precitaj(kluc)` | aktuálna hodnota selectu (`""` = nič) |
| **`zapis(kluc, hodnota)`** | **jediný zápis voľby** (sekcia 5). Vráti `"tlacidlo"`, `"karta"`, `"select"`, `"uz"` alebo `null`. Navyše `zapis("pocetKs", n)` (n = 1, 2 alebo 3) = počet boxov na produkte 616 (živé tlačidlo „N ks“; živý kód vyprázdni veľkosti nad počtom a hodí známu chybu `priceActualization is not defined`). Zvolené veľkosti boxov v rozsahu počtu ostanú — živé „1 ks“ by zmazalo aj 1. box, `zapis` ho vráti cez živé tlačidlo; vyprázdnené veľkosti nad počtom dostanú `change` (prepočet živej ceny). |
| `krok(meno)` / `menoKroku(el)` | živý element kroku: `vzor, auto, farba, farba2, rozlozenie, kufor, boxy, boxyVyber, kosik, cena`; box 616 `pocet` (dieťa `.content-wrap` s `.amount-wrap`) a `velkost` (dieťa `.content-wrap` s `.parameter-sizes`). `menoKroku` skúša najprv kroky produktu. |
| `kroky()`, `vyplneny(el)`, `prvyNevyplneny()` | to isté pravidlo ako validácia košíka. `prvyNevyplneny() === null` znamená „Vložte do košíka“, inak „Dokončite výber“. |
| `cena()` | `{ zaklad, priplatky, spolu, odporucana, maBeznuCenu, zlava }`. Variant z `necessaryVariantData` podľa `priceId` + zvolené príplatky. Odporúčaná cena = spolu × 1,6 nahor na desiatky (ako `productPage.js`), **len keď produkt má v admine bežnú cenu** (živý `.price-standard` v `.p-final-price-wrapper`, `maBeznuCenu: true`); inak `odporucana` a `zlava` = 0 (613, 625, 616, 637 — nič nevymýšľať, D2). |
| `formatCena(n)` | tvar ceny ako Shoptet (SK `€219`, CZ `5 664 Kč`) |
| `obrazok(meno)` | `…/eshopy/luxuryCar/assets/img/1v/<meno>` |
| *`ceny-ine.js`* (modul, nie člen ctx) | ceny a príplatky **iných** produktov zo živých stránok: `cenaProduktu(url)`, `priplatkyProduktu(url)` (mapa `mapaZFormulara`), `moznostiZMapy(mapa, kluc)`, `cenaTypu(projectId, typ, vzor)`, `priplatkyTypu(…)`. GET cez `stiahniDokument` z `lcdKosikDoplnok.js`, vlastná stránka bez siete, localStorage 24 h (`lcd1vStranka:v1:<cesta>`, všetko v try/catch), chyba -> `null`. Odkaz na produkt iného typu: `produkty.js` `najdiProdukt(projectId, typ, vzor)`. |
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
- **610 Hexa: „nie“ stojí v admine +5 €** (chyba adminu, rozhodnutia.md D2). Nový vzhľad posiela presne to, čo starý: klik na „Nechcem“ = voľba „nie“ `[88]=598` (+5 €), bez kliku `[88]=` (0 €). Karta „Nechcem“ ukáže „+ €5“ (nie „v cene“) a bez výberu nie je označená žiadna karta — cena na stránke = cena v košíku. Oprava je v admine (Michal).
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
  - Typy (T0.1): `_lcd1v-dvoj.scss`, `_lcd1v-kufor.scss`, `_lcd1v-boxy.scss` -> `LCD-1V-DVOJ`, `LCD-1V-KUFOR`, `LCD-1V-BOXY`; obsah podľa typu `_lcd1v-obsah-{dvoj,classic,premium,boxy}.scss` -> `LCD-1V-OBSAH-<TYP>` (pri zlúčení so spoločnými blokmi obsahu 598 ostanú za nimi). Selektor typu: `body.lcd-1v[data-lcd1v-typ="…"]`.
- **Každý selektor začína `body.lcd-1v`.** Žiadne `@import`, žiadne globálne premenné na `:root`. Premenné daj na `body.lcd-1v`.
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
| `jedno` | 598 Diamond, 613 Stripe, 610 Hexa | 598: plná (17 scenárov). 613: `brana nulova-zmena platne kufor-classic box-1`. 610: `brana nulova-zmena platne kufor-classic kufor-nie` |
| `dvoj` | 601 Diamond, 604 Hexa, 607 Stripe | 601: plná + `farba2-prepni`. 604: `brana nulova-zmena neuplne platne kufor-classic box-2`. 607: `brana nulova-zmena platne kufor-classic box-2` |
| `kufor-classic` | 619 Diamond, 625 Stripe, 622 Hexa | 619: `brana nulova-zmena bez-auta neuplne platne dokoncit k-suhrnu`. 625, 622: `brana nulova-zmena platne dokoncit` |
| `kufor-premium` | 628 Diamond, 634 Stripe, 631 Hexa | 628 ako 619. 634, 631 ako 625 |
| `boxy` | 616 Box do kufra | `brana nulova-zmena neuplne platne box-pocet-2 box-pocet-3 box-3-na-1 dokoncit k-suhrnu` |
| `vzorky` | 637 Vzorkovník | `brana nulova-zmena platne vzorky-0` |

Profil nesie aj očakávané `priceId` a sumy (`platne`, `ceny`): scenár, ktorý vráti inú sumu, ZLYHÁ. `odporucana: false` (613, 625, 616, 637): v admine chýba bežná cena, odporúčaná sa nemá ukázať (pozri Prísnosť).

**Scenáre** (`--krok`). Jadro je v `tools/test-konfigurator-1v.mjs`, scenáre typov v `tools/test-1v/scenare-<typ>.mjs`:

| Scenár | Typy | Čo overí |
|---|---|---|
| `brana` | všetky | bez flagu nič; s flagom zapne body.lcd-1v (aj `window.__lcd1v`) len na produktoch zapnutých v bráne, platí v karte; CZ Diamond (iný projekt) nikdy; nezapnutý typ (dnes 601) a **610** (rovnaký typ ako 598) nie, kým ich brána nezapne (keď ich zapne, nový vzhľad **musí** naskočiť); `?novy=0` vypne |
| `nulova-zmena` | všetky | flag vypnutý: lokálny build = živý CDN toho istého produktu (DOM, počty selectov, ceny, štýly, triedy body). Rozmery majú toleranciu 6 px, všetko ostatné presne. S `--novy` vypíše aj rozdiel `?novy=1` oproti CDN (len informácia). Pri `--zdroj cdn` sa preskočí |
| `bez-auta` | jedno, dvoj, kufor-* | výzva na auto, `pridajDoKosika` → POST 0, červený rám na `auto` |
| `neuplne` | jedno, dvoj, kufor-*, boxy | postupne každý povinný krok (jedno: auto, farba, rozloženie · dvoj: + farba 2. vrstvy · rohož: auto, farba · box: farba, veľkosť): červený rám na ňom, POST 0 |
| `platne` | jedno, dvoj, kufor-*, boxy | úplný výber → POST: kľúče = polia formulára, `productId`, `priceId` variantu, farba (aj 2. vrstvy), rozloženie, TYP, kufor/boxy nevybrané; zobrazená cena = variant + príplatky; odporúčaná = ×1,6 nahor na 10 a % zľava; `sessionStorage.model` pre `#remark`; suma a `priceId` proti profilu. Kufor a boxy na začiatku: skryté (`stary.skryteNaZaciatku`) alebo viditeľné (nový ovládač) |
| `dokoncit` | kufor-*, boxy | starý web: „Dokončiť konfiguráciu“ / „Prejsť k ďalšiemu kroku“ na poslednom kroku rovno vkladá → živý POST, zachytený a zrušený, overí sa ako `platne`. Nový vzhľad: preskočené (scenár `k-suhrnu`) |
| `k-suhrnu` | jedno, dvoj, kufor-*, boxy | len nový vzhľad: posledný krok typu „Pokračujte k súhrnu“ nič nevloží, zatvorí kroky a ukáže Spolu; potom košík → platný POST |
| `ctx-zapis` | jedno, dvoj | len `--novy`: `ctx.zapis` všetkých volieb, `"uz"`, zrušenie kufra, `prvyNevyplneny()`, `ctx.cena()` = Shoptet, `ctx.doKosika()` → POST |
| `kufor-classic`, `kufor-premium` | jedno, dvoj | POST s `kufor`, cena |
| `box-1`, `box-2` | jedno, dvoj | 1 box (solo) / Classic + 2 boxy (farba, veľkosti) → POST, cena |
| `kufor-nie`, `box-nie` | jedno, dvoj | Classic → Nechcem / 1 box → Nechcem: POST bez kufra / boxov (prázdne alebo „nie“), cena bez nich. Voľba „nie“ s príplatkom > 0 (610: +5 €) je upozornenie (chyba v admine), nie zlyhanie |
| `rady-3` | jedno, dvoj | všetky tri rady (nový vzhľad: 7 miest dlaždicou v kroku 4 = aj krok 2 a `seatPosition`) → POST, cena s 3. radom |
| `box-krizik` | jedno, dvoj | len nový vzhľad: nový výber boxov zavretý krížikom bez potvrdenia = žiadny box (G10b) |
| `box-prepni` | jedno, dvoj | len nový vzhľad: 1 box → 2 boxy, v POST len 1. + 2. box (živý web tu má chybu: samostatný box ostane) |
| `miesta-5` | jedno, dvoj | len nový vzhľad: 7 miest + 3 rady → 5 miest: rozloženie sa samo prepne na 1.+2. rad, krok 4 ostane otvorený, POST bez 3. radu |
| `farba2-prepni` | dvoj | zmena farby 2. vrstvy po celom výbere: `priceId` = variant `71-<lux>-78-<farba>`, POST nesie novú Lux |
| `box-pocet-2`, `box-pocet-3` | boxy | 2 boxy S+L, 3 boxy S+S+XL: POST, ceny podľa profilu |
| `box-3-na-1` | boxy | 3 boxy → 1 box: 2. a 3. box prázdne/chýbajú, cena 1 × S |
| `platne` (vzorky) | vzorky | vybrané vzorky → POST nesie presne tieto príplatky „Áno +€5“, záloha = 5 € × počet = súčet z POST; živá Shoptet cena o 5 € vyššia = upozornenie |
| `vzorky-0` | vzorky | bez vzorky: nový vzhľad POST 0; starý pustí POST so všetkými prázdnymi (upozornenie) |

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
| `ovladac-kroky.mjs` | `vyberAuto(t, {znacka, model, rok, typ})` → sessionStorage.model · `vyberFarbu(t, {index})` → value farby · `skusBezAuta(t)` → `{vyzva}` · `zavriVyzvu(t)` · `cervenyKrok(t)` → `"auto"\|"farba"\|"farba2"\|"rozlozenie"\|…\|null` · `hodnota(t, kluc)` · `dokonci(t, krok)` → text tlačidla posledného kroku |
| `ovladac-rozlozenie.mjs` | `vyberRozlozenie(t, {index})` → value (0 = len 1. rad, 1 = 1.+2., 2 = všetky) |
| `ovladac-kufor-boxy.mjs` | `skryteNaZaciatku` (bool) · `stav(t)` → `{kufor, boxy}` viditeľné · `vyberKufor(t, "classic"\|"premium"\|"nie")` → value · `vyberBoxy(t, {pocet, farba, velkost, velkost2})` → `{farbaBoxov, box1, box2, boxSolo}` |
| `ovladac-cena.mjs` | `zobrazenaCena(t)` → číslo · `odporucana(t)` → `{cena, zlava, stitok}` · `pridajDoKosika(t)` (nový vzhľad môže klikať lepivú lištu) |
| `ovladac-farba2.mjs` | `vyberFarbu2(t, {index})` → value farby 2. vrstvy (dvojvrstvové; `novy` zatiaľ `null`) |
| `ovladac-boxy-produkt.mjs` | produkt Box do kufra 616: `vyberPocet(t, n)` · `pocet(t)` · `vyberFarbu(t, {index})` · `vyberVelkosti(t, [..])` · `hodnoty(t)` (`novy` zatiaľ `null`) |
| `ovladac-vzorky.mjs` | vzorkovník 637: `vyberVzorky(t, [id, …])` · `pocet(t)` · `zaloha(t)` (`novy` zatiaľ `null`) |

**Pomocník `t`** (`tools/test-1v/pomocnik.mjs`):
- `t.klikni(sel, {index, popis, vRamci})` — **skutočný klik myšou**. Prvok sa posunie do stredu, počká sa, kým stojí, a overí sa, že ho nič nezakrýva (Luxia, lišta, hlavička). Inak test zlyhá.
- `t.nastavSelect(sel, text|index)`, `t.cakaj(expr, {ms})`, `t.ev(expr)`, `t.idParametra(kluc)` (výnimka, keď parameter nie je), `t.maParameter(kluc)` (`null`, keď nie je), `t.moznost(kluc, /regex/)`, `t.zabudni()`, `t.mobil`, `t.sirka`, `t.novy`, `t.pauza(ms)`.
- Kľúče parametrov (`farba`, `farba2`, `rozlozenie`, `kufor`, `farbaBoxov`, `box1`–`box3`, `boxSolo`, `typ`) sa hľadajú podľa `data-parameter-name`, nikdy podľa ID natvrdo.
- Selektory starého vzhľadu a `otvorKrok()` sú v `tools/test-1v/stary-ui.mjs`.
- Nový ovládač kliká na to, čo vidí zákazník v novom vzhľade. Starý DOM, ktorý je vizuálne skrytý, nie.

**Scenár v `scenare-<typ>.mjs`:** `export const SCENARE = { "<meno>": { typy: ["<typ>"], async fn(s, a, pom, ovl, j) { … return { info, post, spolu } | { preskoc } } } }`. `j` = jadro `{ otvor, zaklad, overPost, overCenu, cakajNaPost, nieHodnoty, novaOdporucana, over, pauza, AUTO, TYPY_TEST }`. `overPost(s, post, ocak)` dostane `ocak` s farbou (z `zaklad()`), inak zlyhá. Vrátené `spolu` sa porovná s `ceny[<meno>]` v profile.

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

## 10. Vlastníctvo súborov

Od T0.1 (14. 10. 2026) sú moduly 598 súčasťou **jadra**. Jadro mení len vydávacia úloha vlny (T1.1, T2.1, T3.1, T4.1, T5.1; plan.md §2.1):
- `assets/js/components/konfigurator1v/{index,ctx,produkty,ceny-ine,kroky,rozlozenie,kufor-boxy,cena,obsah,obsah-cisla}.js`,
- spoločné partialy `assets/css/_lcd1v-{kroky,rozlozenie,kufor-boxy,cena}.scss`, `tools/vloz-lcd-css.py`, `tools/build-admin-html.mjs`,
- `tools/test-konfigurator-1v.mjs`, `tools/test-1v/{produkty,pomocnik,stary-ui,cdp}.mjs`,
- `assets/js/lcdKosikDoplnok.js` (+ test a fixture), `assets/js/main.js`, `assets/js/functions/configuratorEngine.js` (exporty),
- tento dokument, `assets/css/luxuryCar.css` a `admin-html/dist/*` (generuje nástroj), `.dashboard/roadmap.md`.

Workeri typov (každý len svoje súbory):

| Worker | Smie meniť |
|---|---|
| **jedno-vzory** (T1.1: 610, 613) | `typy/jedno.js`, `tools/test-1v/scenare-jedno.mjs`, nové obrázky `assets/img/1v/jedno-<vzor>-*` |
| **dvoj** (T1.2: 601, 604, 607) | `konfigurator1v/farba2.js`, `typy/dvoj.js`, `assets/css/_lcd1v-dvoj.scss`, `tools/test-1v/ovladac-farba2.mjs` (len `novy`), `tools/test-1v/scenare-dvoj.mjs`, `assets/img/1v/dvoj-*` |
| **kufor** (T2.2: 619–634) | `konfigurator1v/kufor-produkt.js`, `typy/kufor-classic.js`, `typy/kufor-premium.js`, `assets/css/_lcd1v-kufor.scss`, `tools/test-1v/scenare-kufor.mjs`, `assets/img/1v/rohoz-classic-*`, `rohoz-premium-*` |
| **boxy** (T3.2: 616) | `konfigurator1v/boxy-produkt.js`, `typy/boxy.js`, `assets/css/_lcd1v-boxy.scss`, `tools/test-1v/ovladac-boxy-produkt.mjs` (len `novy`), `tools/test-1v/scenare-boxy.mjs`, `assets/img/1v/boxprodukt-*` |
| **vzorky** (T5.1: 637) | `konfigurator1v/vzorky-produkt.js`, `typy/vzorky.js` (+ register 637 v jadre v rámci svojho vydania) |
| **obsah <typ>** (T1.3, T2.3, T2.4, T3.3) | `konfigurator1v/obsah-<typ>.js`, `assets/css/_lcd1v-obsah-<typ>.scss`, `admin-html/src/p1v-<typ>/*`, `tools/test-1v/obsah-<typ>.mjs`, `assets/img/1v/obsah/<typ>-*` |

Stuby z T0.1 (modul `init(){}`, typ len so spoločnými textami, prázdny partial) existujú pre všetky typy, takže `?novy=vyvoj` funguje na celom registri hneď (surový vzhľad nových krokov, `window.__lcd1v.chyby` prázdne).

Potrebuješ zmenu v jadre? Napíš ju do výstupu, spraví ju vydanie, nerob ju sám. Hranice medzi modulmi:
- **kroky** vlastnia obal a postup (karty, číslo, „Pokračujte ďalej“, posledný krok „Pokračujte k súhrnu“ bez košíka, červený rám). Modul typu na kroku len stavia telo a zhrnutie dáva cez `data-lcd1v-vyber`.
- **cena** vlastní tlačidlo košíka a lištu. Tlačidlo volá `ctx.doKosika()`, text „Dokončite výber / Vložte do košíka“ podľa `ctx.prvyNevyplneny()`.
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
- Premium v kroku 5 áno (Michal schválil kufor Classic/Premium/Nechcem v konfigurátore).

## 12. Známe nástrahy

- **Mobil, K3:** klik na rozloženie po 350 ms sám zbalí krok a otvorí kufor. Do 700 ms drží na K3 inline `max-height: 50px !important`, po 2,5 s ho zruší (`configuratorEngine.js`). Desktop len odkryje `.upsale-Banner`. **Pod `body.lcd-1v` (integrácia 13. 10.) sa ani mobil sám nehýbe** (`configuratorEngine.js`, podmienka `lcd-1v` pri K3 auto-postupe): krok 4 prepína rozloženie aj pri zmene počtu miest a nesmel by zbaliť krok 2 a skočiť na kufor. Flag vypnutý = správanie bez zmeny.
- **Krok 6 „Pokračujte k súhrnu“** (integrácia 13. 10., `kroky.js`): živé tlačidlo posledného kroku (`.next-step-button.finish-button`) by hneď vkladalo do košíka. Pod 1V ho zachytí capture handler na `document` — kroky zatvorí a posunie na `.lcd1v-suhrn`; kontrolu výberu robí tlačidlo košíka. Scenár `k-suhrnu`.
- **Karty kufra a boxov sú prepínače.** Klik na aktívnu ju odznačí a select nastaví na prázdnu hodnotu (`productPage.js` updateUpsale). Preto `zapis` vracia `"uz"`.
- **`conf1` / `conf2`** otvoria `.upsale-Banner.showConf` (box-config).
  - „Nechcem“ / `.close-btn.close` vynuluje farbu aj veľkosti (`resetBoxConfigDefaults`).
  - „potvrdiť“ (`.close-btn.return`) kontroluje farbu a veľkosť.
- **`.order`:** text čísla kroku obalí `configurator-enhance` do `span.lcd-step-num`. `productPage.js` čísla kufra a boxov prepisuje (`contentStepCount`).
- **Hlavičky krokov** (`.order`, `h5`, `.variant.name`) otvárajú akordeón cez delegovaný handler na `document`. Pozor na dvojité prepnutie, ak pridáte vlastný klik.
- **Okno „vyberte model“** sa ukáže pri **akomkoľvek** kliku do `.content-wrap` bez kompletného auta. Výnimka: klik vo vnútri `.modl-selector-wrap`.
- **FAQ:** otázky sú `button type=submit` vo formulári. Odoslaniu bráni len `preventDefault` v `components/index.js`.
- **Štítok galérie** („€350 −37 %“) nesedí s cenou z JS (360 / −39 %). Riešenie patrí worker cena (skryť pod `body.lcd-1v`).
- **CZ** je nedotknutá (brána). Iné ID: farba 72, rozloženie 57, kufor 60, boxy 63/66/69, solo **78**, TYP 47. Ceny v Kč. Preto nikdy ID natvrdo.
