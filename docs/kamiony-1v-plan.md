# Kamióny 1V — plán stavby (SK produkt 640, `?novy=1`)

Stav: 18. 10. 2026, worktree `spt-luxuryCar-kamiony`, vetva `kamiony-1v-lokal` (z `origin/main` 9dbafff). Len lokálne commity, **nikdy push**, nič do adminu, CZ sa nemení.
Vzor: schválený artefakt `scratchpad/kamiony-app/` (ďalej **ART**) — `app.js` (UI 6 krokov), `cena.js`, `app.css` (= `data/styl-1v.css` + `work/app-extra.css`), `data/konfig-data.json`, `data/texty.json`, `data/zive-ceny.json`. Zverejnený: https://claude.ai/artifact/2NiuiZpK5qHy4BiKysBBRE. Michal ho ešte prechádza — pripomienky sa zapracujú do `kamion/texty.js` a CSS, architektúra sa nemení.

Cieľ: na `/luxusne-autokoberce-kamiony/` s flagom karty vyzerá a správa sa stránka ako ART (bez horného pásu ukážky, bez poznámok k návrhu, bez prepínača PC/Telefón), s ozajstným košíkom Shoptetu. **Bez flagu presne dnešný React.** Do košíka a do poznámky objednávky ide to isté, čo dnes posiela React.

---

## 0. Východiskový stav (overené pred zmenami)

| Kontrola | Výsledok |
|---|---|
| `yarn build:once` | `yarn` nie je na PATH. Ekvivalent `npm run build:once` **prechádza** (luxuryCar.js 2,9 MB, `.gen.jsx` 248/254 KB, 174 obrázkov) — po nastavení prostredia nižšie. |
| `yarn truck:test` (`npm run truck:test`) | 4 z 5 OK. **`test-vehicle-switch.mjs` padá na Windows** (už pred zmenami): do `import … from "${join(REPO,…)}"` dáva cestu s `\` → esbuild ju nenájde. Oprava = test (K9). `test-truck-mount.mjs` OK. |
| `test-truck-cart.mjs` | nie je v `truck:test`, číta `/tmp/truck-selects.html` (neexistuje) → nahradí ho fixture (K8). |

**Prostredie (Windows, platí pre obe časti):**
- `node_modules` v gite má len esbuild pre Mac. V tomto worktree sú už **junction-y** (ignorované gitom, `/node_modules` v `.gitignore`) na `C:\Users\M\Desktop\spt-luxuryCar-fixes\node_modules`: `jsdom`, `jquery`, `gsap`, `lenis`, `sharp`, `@esbuild/win32-x64`. Nové balíky neinštalovať (`yarn add` by prepísal sledované súbory v `node_modules`).
- Build/testy v Bashi: `export PATH="/c/Users/M/Desktop/spt-luxuryCar-fixes/node_modules/.bin:$PATH"` a potom `npm run build:once` / `npm run truck:test`.
- **`build:once` mení 2 sledované súbory:** `assets/js/luxuryCar.js` (build) a `assets/js/truck-konfigurator/truck-brands.js` (generátor `truck/build-truck-brands.mjs` má natvrdo staré adresy `/luxusne-autokoberce-truck/`). Po každom builde `git checkout -- assets/js/luxuryCar.js assets/js/truck-konfigurator/truck-brands.js`; nikdy ich necommitovať (generátor opraví K0).

---

## 1. Architektúra

### 1.1 Kde bude modul
Nový typ **`kamion`** v registri 1V, modul v podpriečinku (je väčší ako ostatné moduly typov):

```
assets/js/components/konfigurator1v/
  produkty.js            + 640: { typ: "kamion", vzor: null, url: "/luxusne-autokoberce-kamiony/", obsah: "kamiony" }
                         + TYPY.kamion = { kroky: [], moduly: ["kamion"], obal: null }
                         + TYPY_ZDROJ.kamion = kamion.TYP   (import ./typy/kamion.js)
                         + ZAPNUTE_TYPY += "kamion"  (AŽ posledný krok K10; dovtedy len ?novy=vyvoj)
  typy/kamion.js         TYP { texty: { cena: { typ: "Kamióny a dodávky" } }, obrazky: {} }
  index.js               + MODULY.kamion; + export budeKamion1v(); zlozit() volá zlozit() aktívnych modulov
  kamion/
    index.js             MENO = "kamion"; init(ctx); zlozit() -> návrat na React (1.4)
    stav.js              stav výberu S (presne ART app.js ř. 11–17) + adaptér naStavReactu(S) (2.3)
    data.js              materiály, farby, lemovania, motívy, nite, polia vozidla (z ART konfig-data.json, obrázky na web)
    texty.js             zákaznícke texty (z ART texty.json bez meta, poznamky_navrhu, na_overenie, obsah, seo)
    cena.js              port ART cena.js (ES modul): vypocitajCenu, ponuka, tapacirDostupny, najdiZnacku
    shoptet.js           čítanie živých cien, port syncToShoptet/resolveValue/findMatchingOption, doKosika, poznámka
    ui.js (+ ui-kroky.js, ui-lista.js podľa veľkosti)   port render/akcií ART app.js
assets/js/truck-konfigurator/mount.js   mountTruckConfigurator() + isTruckConfiguratorPage() presunuté 1:1 z productPage.js
assets/css/_lcd1v-kamiony.scss          CSS konfigurátora (blok LCD-1V-KAMIONY)
```

Vozidlá sa **neduplikujú**: `kamion/data.js` importuje `TRUCK_VEHICLES`, `TRUCK_FIELD_ORDER` z `truck-konfigurator/truck-brands.js` (ten istý zdroj ako React CONFIG a prepínač na titulke). Typ vozidla a tapacír = `/\(TIR\)/i` v kľúči značky (ako `doorUpholsteryAvailable`, gen.jsx ř. 1496; ART `tapacir_dveri_dostupny`). Labely/placeholdre polí z ART `konfig-data.json vozidla.polia` (`label_v_suhrne_objednavky` = `SUMMARY_TEXTS.sk.extras` v order-summary.mjs).

### 1.2 Ako sa zapne
- Brána je tá istá ako pri 1V (`index.js`): `prepinac(location.search)` → `jeZapnute()` → `jeProdukt1v(getShoptetContext(), flag)`. Pre 640 vracia `{ typ: "kamion" }` pri `?novy=vyvoj`, po K10 aj pri `?novy=1`.
- Kontext 640 (overené na živom HTML 18. 10.): `dataLayer.shoptet.projectId = 562035`, `product.id = 640` (pozor: `body.id-883` je pageId, nie produkt — `getShoptetContext` berie najprv dataLayer, OK).
- Nová funkcia v `konfigurator1v/index.js`:
  ```js
  /** true = na tejto stránke sa postaví kamión 1V (React sa nemontuje). Bez ?novy= nič nezapisuje. */
  export function budeKamion1v() {
    try { prepinac(window.location.search); const f = jeZapnute(); const p = f ? jeProdukt1v(getShoptetContext(), f) : null;
          return !!(p && p.typ === "kamion" && document.getElementById("product-detail-form")); } catch (e) { return false; }
  }
  ```
- `productPage.js` (jediná zmena v ňom):
  ```js
  import { isTruckConfiguratorPage, mountTruckConfigurator } from "../truck-konfigurator/mount.js";
  import { budeKamion1v } from "./konfigurator1v/index.js";
  …
  if (isTruckConfiguratorPage()) { if (!budeKamion1v()) mountTruckConfigurator(); return; }
  ```
  `mount.js` = presne dnešné `isTruckConfiguratorPage` (ř. 1747–1762) a `mountTruckConfigurator` (ř. 1764–1810) + import `renderTruckConfigurator`. Bez flagu sa vykoná ten istý kód v tom istom poradí → nulová zmena.

### 1.3 Poradie init (overené v kóde) — prečo nebeží vedľa Reactu
`main.js` callback `$.getJSON(data.json)`: `initKosikDoplnok` → **`initProduct`** (na kamiónoch hneď `mountTruckConfigurator(); return;` — ř. 99–102) → `initModelSelect` → `addNote` → `validation` → `initConfiguratorEngine` → `initLivePrice` → `initCart` → **`initKonfigurator1v`** (posledný).
- Bez flagu: `budeKamion1v()` = false → React ako dnes; `initKonfigurator1v` skončí (produkt nie je zapnutý).
- S flagom: `initProduct` React **nenamontuje** (vráti sa hneď) → `initKonfigurator1v` postaví nové UI (modul `kamion`, potom `obsah`). Obe rozhodnutia volajú tú istú bránu, takže nemôže nastať „obe“ ani „žiadne“ (okrem chyby → 1.4).
- `initConfiguratorEngine` na kamiónoch nemá kroky (`lcdFirstUnfilled()` = null), jeho handler na `button.add-to-cart-button` len nastaví presmerovanie na `/kosik/` po `ShoptetCartUpdated` — rovnako pre React aj nové UI.

### 1.4 Poistka (nikdy prázdna stránka)
- `kamion/index.js init(ctx)` hneď na začiatku overí: formulár, `.p-info-wrapper`, natívne tlačidlo `.add-to-cart button.add-to-cart-button`, **všetkých 15 selectov** (podľa `data-parameter-name`, 2.1) a `meta[itemprop=price]`. Chýba čokoľvek → `throw`.
- `index.js`: výnimka v `init` → `ctx.chyby` → `zlozit()`. **Úprava `zlozit()`:** najprv zavolá `zlozit()` modulov, ktoré ho exportujú (dnes žiadny, takže pre ostatné typy bez zmeny), potom zloží triedy. `kamion.zlozit()` odstráni svoje prvky, vráti H1 a hlavičku na pôvodné miesto, zruší lištu a poslucháče a zavolá `mountTruckConfigurator()` → zákazník dostane React. Rovnako pri asynchrónnej chybe cez `ctx.zlozit()` a v `catch` celej `initKonfigurator1v`.
- Ak `initKonfigurator1v` vráti `null` bez výnimky (napr. formulár zmizol), `budeKamion1v()` by bolo tiež false → React. Test K7 overí všetky tri cesty.

### 1.5 Umiestnenie v DOM
Živá stránka 640: `.p-detail-inner-header > h1` je NAD formulárom; `form#product-detail-form` obaľuje `.p-image-wrapper` (galéria) aj `.p-info-wrapper` (cena, `table.detail-parameters` so selectmi, `#divAddToCart`, krátky popis, benefit banner).
- Modul pridá `body.is-truck-konfigurator` (ako React — zachová dnešné skrytie obsahu pravého stĺpca a štýly starého popisu, keby obsah 1V neprišiel) a `.p-info-wrapper.active` (inak ho CSS `:not(.active)` skryje).
- Koreň: `div.truck-konfigurator-wrap.lcd1v-kamion > div#lcd1v-kamion` na konci `.p-info-wrapper` (rovnaké miesto ako React, preto ho pravidlo `> *:not(.truck-konfigurator-wrap)` neskryje). Živé selecty a tlačidlo ostanú v DOM (skryté), nič sa nemaže.
- Hlavička: `.p-detail-inner-header` sa **presunie** na začiatok koreňa (pri `zlozit` späť). Pozor: koreň je vo `<form>` → každé `<button>` musí mať `type="button"`, žiadne `name` na input/select (kontrakt §5).

---

## 2. Napojenie na Shoptet

### 2.1 Stav UI → select → presný text možnosti (živý web 18. 10. 2026, `zive-ceny.json` + `data-surcharge-final-price`)
Selecty sa hľadajú podľa `data-parameter-name` (SK aj CZ mená ako `resolveValue`), nie podľa ID (kontrakt §5; ID sú len pre orientáciu). Text sa porovnáva po `normalizeOptionText` (bez „+€N“, bez diakritiky). „nenastavovať“ = hodnota ostane, aká bola (presne ako React: `resolveValue` vráti `null` → `syncToShoptet` select nemení). ART stav: `S` z `app.js`.

| ID | `data-parameter-name` | povinný | Stav UI → text možnosti |
|---|---|---|---|
| 346 | Typ materiálu | áno | `S.material` → ten istý text: „Prémiová syntetická koža – jednofarebná“ (+0) / „– prešívaná“ (+10) / „– tónovaná“ (+40), „Mikrosemiš – jednofarebný“ (+40) / „– dvojfarebný“ (+50). Bez výberu nenastavovať. |
| 376 | Farba materiálu | áno | jediná možnosť „Vyberie sa v konfigurátore“ → nastaviť **hneď pri štarte** (pravidlo `realOptions.length === 1` v `syncToShoptet`). Farba ide len do poznámky. |
| 379 | Farba lemovania | áno | jediná možnosť „Vyberie sa v konfigurátore“ → hneď pri štarte. |
| 349 | Rozloženie nášiviek | áno | `S.nas`: nechcem → „Bez nášiviek“ (+0), stred → „Len stred“ (+59), boky → „Šofér + spolujazdec“ (+59), boky+stred → „Šofér + spolujazdec + stred (BALÍK)“ (+95). `null` → nenastavovať. |
| 403 | Typ nášiviek na boky | nie | `S.nas` null → nenastavovať; boky / boky+stred → „Nášivka H19“ / „Nášivka H21“ (`S.nasBoky.motiv`; bez motívu nenastavovať); nechcem / stred → „Bez nášivky“. |
| 406 | Farba nášiviek na boky | nie | boky*: s motívom aj niťou → „2999 – Čierna“ … (hľadá sa kód nite, zhoda „obsahuje“); nechcem / stred → „Bez nite“. |
| 409 | Typ nášivky na stred | nie | stred / boky+stred → „Nášivka “ + motív stredu (pri boky+stred a „rovnaký motív“ = motív bokov); inak „Bez nášivky“. |
| 412 | Farba nášivky na stred | nie | stred*: kód nite stredu → „2999 – Čierna“ …; inak „Bez nite“. |
| 352 | Tapacír | áno | značka „(TIR)“ a `S.tap === "ano"` → „Áno chcem (v konfigurátore – balík)“ (+119); inak (nie, dodávka, nezvolené) → „Nie nechcem tapacír dverí“. |
| 388 | Typ materiálu tapacíru | nie | len `tap = ano`: rovnaký ako koberce → „Rovnaký ako koberec“; vlastný materiál vybraný → „Vyberie sa v konfigurátore“; inak nenastavovať. |
| 391 | Farba materiálu tapacíru | nie | len `tap = ano`: rovnaký → „Rovnaká ako koberec“; vlastný s materiálom aj farbou → „Vyberie sa v konfigurátore“. |
| 394 | Farba lemovania tapacíru | nie | len `tap = ano`: rovnaký → „Rovnaké ako koberec“; vlastné lemovanie → „Vyberie sa v konfigurátore“. |
| 355 | Nášivky na tapacír | nie | `tap ≠ ano` → „Nie nechcem nášivku na dverách“; `tap = ano`: `tapNas` true → „Áno chcem nášivku na dverách“ (+49), false → „Nie …“, null → nenastavovať. |
| 397 | Typ nášivky na tapacír | nie | dodávka / tapacír nezvolený (`doorPanelChoice` null) → nenastavovať (ostane prázdne); `tap = nie` alebo `tapNas = false` → „Bez nášivky“; `tapNas` null → nenastavovať; „rovnaká ako na kobercoch“ → „Rovnaká ako koberec“; vlastná → „Nášivka H19|H21“. |
| 400 | Farba nášiviek na tapacíre | nie | ako 397: „Bez nite“ / „Rovnaká ako koberec“ / kód nite „2999 – Čierna“ …. |

ART `pripravKosik()` (app.js ř. 688–713) sa od toho líši (napr. pri dodávke nenastaví 355) — **platí táto tabuľka (= React)**, ART tabuľka košíka vypadne.
Kombinácia „Šofér + spolujazdec“ vs „… + stred (BALÍK)“: `findMatchingOption` skúša najprv presnú zhodu, potom „obsahuje“ — port musí zachovať poradie, inak by „Šofér + spolujazdec“ trafil BALÍK.

### 2.2 Ako to robí React (presné miesta; `.gen.jsx` vznikne buildom, čísla riadkov po `build:once`)
| Funkcia | `konfigurator.gen.jsx` (PC) | `konfigurator.phone.gen.jsx` |
|---|---|---|
| `_parseOptionPrice` / `_readSurchargeMap` / `_readBasePrice` (`meta[itemprop=price]`) | 882 / 895 / 912 | — / — / — (rovnaké pred 813) |
| `readShoptetPrices(fallback)` | 928 | 813 |
| `normalizeOptionText` | 1141 | 1038 |
| `findMatchingOption` | 1173 | 1070 |
| `resolveValue(paramName, s)` | 1190 | 1087 |
| `syncToShoptet(state)` (+ `sessionStorage.truckVehicle`) | 1374 | 1271 |
| `useEffect` → `syncToShoptet` pri každej zmene | ~1609 | obdobne |
| klik „Pridať do košíka“: validácia → `syncToShoptet(final)` → `persistTruckOrderSummary(final)` → kontrola povinných selectov → `setTimeout(100) nativeBtn.click()` (záloha `form.requestSubmit`) | 4225–4390 (persist 4342, tlačidlo 4365) | 4363 / 4386 |
| filter motívov `povoleneNasivkyVsade()` / `filtrujNasivky()` | `pricing.js` ř. 397–437 | |

Nepoužiť: `pricing.js calculatePrice` (mŕtvy kód, zlé „+€10“). Nekopírovať chyby gen.jsx: Z1 (+49 € v súhrne po tapacír → Nie) a Z2 (úspora 11 € pri jednej strane nášiviek sa nezapočíta) — `kamion/cena.js` ich nemá (ART `kontrola-cien.mjs`: Z1 160×, Z2 520× zámerne, inak 0 rozdielov).

### 2.3 Čo modul pošle (rovnako ako React)
1. **Ceny** (`kamion/shoptet.js citajCeny()`): základ = `meta[itemprop=price]` (199), príplatky = text možnosti (`_parseOptionPrice`, „+€10“ aj „+10 €“), kontrola proti `data-surcharge-final-price`. Výsledok v tvare `data.ceny` ART (`zaklad_eur`, `priplatky.material{}`, `nasivky_rozlozenie{}`, `tapacir_balik`, `nasivka_na_dverach`). Prečiarknuté „samostatne“ ceny (nasivky_balik 140, sofer_spolujazdec 70, len_stred 70, tapacir 179, nasivka_na_dverach 89) **Shoptet nemá** — sú natvrdo v `FALLBACK_PRICES_EUR` gen.jsx (ř. 812); modul ich prevezme ako konštanty v `kamion/data.js` s odkazom na zdroj (to isté robí React). Chýba select → `throw` (poistka 1.4).
2. **Adaptér `naStavReactu(S)`** (`kamion/stav.js`) → objekt v tvare `finalConfiguration` gen.jsx:
   `znacka` (kľúč s „(TIR)“/„(dodávka)“), `model`, `extras` (= `S.polia`), `selectedMaterial`, `selectedColor: { code }` (**len code** — `buildTruckOrderSummary` pri `name` použije meno a poznámka by sa zmenila), `selectedLemovanie: { code, name }` (name z `LEMOVANIE` gen.jsx = ART `lemovanie[].meno`, nie text UI), `nasivkyPlacement`, `selectedNasivka`/`selectedNitColor` (boky), `selectedStredNasivka`/`selectedStredNitColor` (stred; pri „rovnaký“ = boky), `doorPanelChoice` (`"ano"|"nie"` len pri TIR, inak `null`), `doorSameAsCarpet: { material: S.tapRovnaky, lemovanie: S.tapRovnaky }`, `doorMaterial`, `doorColor: { code }`, `doorLemovanie: { code, name }`, `doorWantsNasivka`, `doorSameNasivkaAsCarpet`, `doorNasivka: { code }`, `doorSameNitAsCarpet`, `doorNitColor: { code, name }`.
3. **Sync** pri každej zmene: `syncToShoptet(naStavReactu(S))` = doslovný port gen.jsx ř. 1141–1424 (vrátane CZ vetiev; `$(select)` netreba — React tiež len `sel.value = …; dispatchEvent(new Event("change", { bubbles: true }))`). Zapisuje aj `sessionStorage.truckVehicle = "<značka> <model>"` (`cart.js` ř. 239 ho ukazuje v košíku).
4. **Predvýber vozidla:** pri štarte `sessionStorage.truckBrand/truckModel/truckExtras` (píše prepínač na titulke `main.js` ř. 691–694), overené proti `TRUCK_VEHICLES` ako gen.jsx ř. 1428–1445. Modul tieto kľúče nepíše (React tiež nie).
5. **Poznámka objednávky:** pri „Pridať do košíka“ `persistTruckOrderSummary(naStavReactu(S))` z `truck-konfigurator/order-summary.mjs` (ř. 298) → `sessionStorage.truckOrderSummary`. Na objednávke ho `main.js toNote()` (ř. 1314) vloží do `#remark` cez `mergeTruckOrderSummaryIntoNote` (ř. 306) a `cart.js` (ř. 149) ho vykreslí v košíku (`parseTruckOrderSummary`). Žiadna vlastná formátovacia funkcia (ART `poznamkaObjednavky()` vypadne) → formát je identický z definície.
6. **Do košíka:** validácia ART (`chyba()`, prvý nevyplnený krok sa otvorí, červený rámik) → finálny sync → `persistTruckOrderSummary` → kontrola `select[data-parameter-id][required]` bez hodnoty (ako gen.jsx; ak niečo chýba, hláška a `console.error`, žiadny klik) → `setTimeout(100)` → **`ctx.doKosika()`** (= klik na `.add-to-cart button.add-to-cart-button`, to isté tlačidlo ako `[data-testid=buttonAddToCart]`). Lepivá lišta volá tú istú funkciu.
7. **Kontrola ceny:** po syncu musí `ctx.cena().spolu` (základ + zvolené príplatky zo Shoptetu) = `vypocitajCenu(S).spolu`. Rozdiel = `console.error("[lcd-1v] kamion: cena …")` (test ho berie ako zlyhanie).
8. **Motívy nášiviek:** len tie, ktoré sú v selectoch (`povoleneNasivkyVsade()` z `pricing.js` — dnes H19, H21 na boky, stred aj dvere); prázdny filter = ponúknuť zoznam ART (rovnako ako `filtrujNasivky`).

---

## 3. UI

### 3.1 Čo sa prenesie z ART
- `app.js` → `kamion/ui*.js` + `stav.js`: stav `S`/`U`, prístup k dátam (ř. 38–130), kontrola krokov `chyba()` (164–216), hlavička (233–250), kroky a telá (286–625: vozidlo s prepínačom Kamión/Dodávka, materiál, farba, lemovanie s „Odporúčame“, nášivky s náhľadom kabíny a canvasom nite 868–900, tapacír 5/A–5/E), súhrn (625–680), lišta (755–765), posun/otváranie (919–982), zmeny výberu `zmena()` (982–995, vrátane návratu nášivky na dverách), delegované akcie `data-a`.
  ES moduly, `export`/`import`, **žiadne `window.*`** (ART `window.LCD_DATA`, `window.LCDCena` → importy `data.js`, `texty.js`, `cena.js`). Všetko sa spúšťa až v `init(ctx)`; pri importe nič.
- `cena.js` → `kamion/cena.js`: tie isté funkcie, UMD obal preč, `data.ceny` z `citajCeny()` (2.3/1), `vypocitajCenu(stav, data, { usporaAjPriJednejStrane })` — predvolene `true` (ART; Z2 je rozhodnutie Michala, 7).
- Obrázky: ART `img/*` sú lokálne kópie obrázkov webu. V `data.js` sa každá cesta nahradí `IMG_BASE + zdroj_*` (`IMG_BASE = "https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/documents/upload/assets/config/"`, gen.jsx; zdroje sú v `konfig-data.json`: `zdroj_swatch`, `zdroj_full`, `zdroj_thumb`, nite `zdroj`, dvere `t894b009d54832cbd.png`). Fotka nášiviek v kabíne = URL, ktorú dnes používa gen.jsx ř. 2318 (jsDelivr `91ThIMeaukL.jpg`). **Nepoužiť** `hero.jpg`, `set-bezovy.jpg`, `kabina-*`, `dvere-scania-detail.jpg` (na webe nie sú alebo sú to fotky klientov s logom Scania).
- Texty: `texty.json` → `kamion/texty.js` (hlavička, kroky, tlačidlá, lišta, súhrn, chyby, `mena_farieb_navrh`); cena v texte vždy z `ponuka()` / `vypocitajCenu()`, nikdy natvrdo.

### 3.2 Čo vypadne
Pás ukážky (`.uk-lista`), prepínač PC/Telefón, poznámky k návrhu (`pn()`, `pripravPoznamky`, `#pn-zoznam`, `renderPnZoznam`), simulovaná hlavička webu (`.web-hl`, drobky), vlastná galéria ART (`renderGaleria`, `GAL`), panel „ukážka košíka“ (`kosikPanel`, `pripravKosik`, `poznamkaObjednavky`), obsah pod konfigurátorom (`renderObsah` → časť OBSAH), `localStorage` ART.

### 3.3 Napojenie na stránku
- **Galéria:** ostáva natívna Shoptet (`.p-image-wrapper`, 30 fotiek produktu 640) s rámikom 1V (`_lcd1v-galeria.scss`, platí pre všetky typy). Výber farby galériu nemení (pravidlo „farba len náhľad“).
- **Hlavička** (ako 1V `cena.js` ř. 115–160): `.p-detail-inner-header` presunutá do koreňa; nad H1 štítok `p.lcd1v-typ` „Kamióny a dodávky“; pod H1 hodnotenie `a.lcd1v-hodn` z `window.LCD_REVIEWS` (skryté, kým dáta neprídu; klik na `[data-lcd-sekcia="a-recenzie"]`, inak `.lcd-reviews-widget`); perex; cena „Naša cena od {zaklad} €“ bez Odporúčanej ceny (produkt nemá bežnú cenu, D2); čipy „V základnej cene“; riadok kompatibility.
- **H1:** živý text je „luxusné autokoberce do kamionov“, ART chce „Luxusné autokoberce **do kamiónov a dodávok**“. Pod flagom modul prepíše text H1 na text ART (pôvodný uloží a pri `zlozit` vráti). Flag má len testovací odkaz, roboti ho nemajú. Pred spustením pre všetkých premenuje produkt Michal v admine (7).
- **Lepivá lišta (telefón do 991 px):** rovnaký prvok a triedy ako 1V (`#lcd1v-lista.lcd1v-lista` + `__c`, `__suma`, `__popis`, `__kos`; `body.lcd1v-lista-on`, `body.lcd1v-bublina` pre Luxiu) → štýl z `_lcd1v-cena.scss` a odsadenie obsahu (obsah bod 9) platia bez kópie. Texty a správanie ART `renderLista()`/`lista()`: „Spolu od X € · Pokračovať“ → „Spolu X € · Do košíka“. Zobrazí sa, keď je koreň mimo obrazovky (ako 1V `obnovListu`).
- **Obsah pod konfigurátorom:** výzvy `a[href="#product-detail-form"]` v `.p1v-miesto` modul zachytí → otvorí krok „vozidlo“ a posunie naň; odkaz „Napíšte nám“ v súhrne vedie na `#p1v-kamiony-dopravcovia` (zmluva s OBSAH, 4.3).

### 3.4 CSS
- `assets/css/_lcd1v-kamiony.scss`, blok **`LCD-1V-KAMIONY`** v `tools/vloz-lcd-css.py` (za `LCD-1V-BOXY`). Každý selektor `body.lcd-1v[data-lcd1v-typ="kamion"] …`; premenné na tomto selektore (nie `:root`), žiadny `@import`.
- Zdroj: ART `data/styl-1v.css` (pôvodné `@media`) + `work/app-extra.css` (tam `@container k (…)` → `@media (…)`, `cqi` → `vw`, `.k-stranka` → koreňový selektor). Nie `app.css` (je prevedený na kontajnery pre prepínač PC/Telefón).
- Prevod jednorazovým skriptom `tools/kamion-css-z-artefaktu.mjs`: predpona selektorov, zahodí `:root`, `@import`, `.uk-*`, `.pn*`, `.web-*`, `.k-galeria*`, `.k-nahlad*`, `.k-gal-*`, `.dk*`, `.k-obsah`/`.k-kap*` a pravidlá tried, ktoré `kamion/*.js` nevyrába (zoznam tried z kódu). Výstup sa commitne a ďalej upravuje ručne. Cieľ ≤ 45 kB surového CSS (luxuryCar.css ide na každú stránku; zmerať brotli pred/po).
- Preskryť: `body.lcd-1v[data-lcd1v-typ="kamion"] .p-info-wrapper > *:not(.truck-konfigurator-wrap)` ostáva skryté pravidlom React; Luxia nesmie zakryť ovládače ani lištu.

---

## 4. Obsah pod konfigurátorom (`p1v-kamiony`)

### 4.1 Súbory (pravidlá `docs/1v-obsah.md` §2–5, build ich kontroluje)
Kľúč obsahu `kamiony` (register 640). Presne 2 kusy, každý ≤ 45 000 zn., len SK, obal robí build.

| Kus | Súbor `admin-html/src/p1v-kamiony/` | Obsah (texty `texty.json obsah.*`) |
|---|---|---|
| 1 (10–29) | `10-kamiony-galeria.sk.html` | `galeria`: fotky produktu 640 z galérie Shoptetu (`…/user/shop/big/640-N_…png`), tlačidlo „Vybrať vozidlo a zistiť cenu“ → `#product-detail-form` |
| | `12-kamiony-co-dostanete.sk.html` | `co_dostanete` (3 koberce, „Za príplatok: Tapacír dverí“ — sumy cez `data-p1v-cislo`) |
| | `14-kamiony-materialy.sk.html` | `materialy` (5 kariet; obrázky `IMG_BASE` + `zdroj_full` prvej farby) |
| | `16-kamiony-detaily.sk.html` | `nasivky_lemovanie` (obrázky lemovania/nášiviek z `IMG_BASE`) |
| | `18-kamiony-postup.sk.html` | `ako_to_prebieha` (4 kroky) |
| | `20-kamiony-dopravcovia.sk.html` | `pre_dopravcov`, koreň sekcie `id="p1v-kamiony-dopravcovia"`, tlačidlá `mailto:`/`tel:` |
| 2 (30–49) | `30-a-recenzie.sk.html` | spoločná sekcia A (markup ako `p1v-598/10-a-recenzie`), oživí `obsah-a.js` z `LCD_REVIEWS`; texty `recenzie` |
| | `40-d-faq.sk.html` | spoločná sekcia D (markup ako `p1v-598/41-d-faq`), 7 otázok `faq.otazky` |
| | `42-kamiony-vyzva.sk.html` | `vyzva` → `#product-detail-form` |
| | `43-d-pomocne.sk.html` | spoločné (okno `#p1v-lb`, linka čítania) — kópia z `p1v-598` |

Poradie = ART (`obsah.poradie`); recenzie hore ako pri 598 (§14) je otázka pre Michala (7).

### 4.2 Pravidlá
- id len `p1v-…`, žiadne zakázané triedy (`ciele.json pravidla.obsah-1v.zakazaneTriedy`), žiadne polia formulára, `<button type="button">`, médiá odložené (`loading="lazy" width height alt`), TinyMCE pravidlá.
- **Žiadna cena v HTML.** Tri miesta s cenou cez nové kľúče `data-p1v-cislo` (vnútri len `<!-- -->`): `kamion-material-presivana` („príplatok {x}“), `kamion-tapacir` („S kobercami len za {suma}“), `kamion-tapacir-samostatne` („samostatne {povodna}“). Základ „od 199 €“ = existujúci `cena-od`.
- Texty len z ART `texty.json` (už prešli kontrolou pravidiel); otvorené body `na_overenie` (dodanie 20–30 dní, platba, doprava, garancia, motívy) sa píšu tak, ako sú v ART, a zoznam ide Michalovi (7). Nič nové nevymýšľať (D3).
- Obrázky len z webu: fotky produktu 640 (`www.luxurycardesign.sk/user/shop/big/640-*`), `IMG_BASE` (konfigurátor), žiadne nové súbory v `assets/img/`.

### 4.3 Zmluva KONFIGURÁTOR ↔ OBSAH (dohodnuté vopred, nikto ju sám nemení)
| Čo | Hodnota |
|---|---|
| kľúč obsahu | `kamiony` (`produkty.js` → `obsah: "kamiony"`) |
| kotva na konfigurátor | `href="#product-detail-form"` (modul ju zachytí a otvorí krok 1) |
| kotva dopravcov | `id="p1v-kamiony-dopravcovia"` |
| nové kľúče čísel | `kamion-material-presivana`, `kamion-tapacir`, `kamion-tapacir-samostatne` — `obsah-cisla.js RE_KLUC` (KONFIGURÁTOR) a `ciele.json pravidla.obsah-1v.cisla` (OBSAH) doplnia **ten istý** reťazec `|kamion-(material-presivana|tapacir|tapacir-samostatne)` |
| hodnoty čísel | `obsah-cisla.js` ich berie z `kamion/cena.js ponuka(citajCeny())` (živé selecty, prečiarknutá cena z `data.js`) |
| modul obsahu typu | `konfigurator1v/obsah-kamiony.js` (`export function init(oc)`): stub + import a zaradenie v `obsah.js` robí KONFIGURÁTOR (K1), telo píše OBSAH |
| CSS obsahu | `assets/css/_lcd1v-obsah-kamiony.scss`, blok `LCD-1V-OBSAH-KAMIONY` (za `LCD-1V-OBSAH-VZORKY`): prázdny partial + riadok vo `vloz-lcd-css.py` robí KONFIGURÁTOR (K1), obsah píše OBSAH |

### 4.4 `ciele.json` a build
- `casti.p1v-kamiony-1` / `-2` podľa vzoru `p1v-boxy-1/-2` (`zlozka: "p1v-kamiony"`, `sekcie: ["10","29"]` / `["30","49"]`, `produkty: [640]`, `"cz": null`, `sk: { typ: "cdn", subor: "html/p1v-kamiony-N.sk.html", … }`), `stranky.produkt-640 = { casti: ["mega","p1v-kamiony-1","p1v-kamiony-2"], idStranky: ["product-detail-form","content","description","footer"] }`.
- Počas práce `node tools/build-admin-html.mjs --vystup %TEMP%/kam-dist`, `--test`; `admin-html/dist/p1v-kamiony-*` vygeneruje integrácia (I1). CDN cestu kopíruje `production.yml` (`cp admin-html/dist/p1v-*.sk.html`) — bez zmeny workflow.

---

## 5. Testy

Nový skript v `package.json`: `"kamion:test": "node tools/test-kamion-cena.mjs && node tools/test-kamion-ceny-gen.mjs && node tools/test-kamion-kosik.mjs && node tools/test-kamion-brana.mjs"`.
Fixture (K8): `tools/test-1v/kamion-640.fixture.html` = zo živej stránky (GET) vyrezaný `form#product-detail-form` (hidden `productId=640`, `priceId=68383`, `language`, `amount`, 15 × `<tr class="surcharge-list">` so selectmi presne ako naživo vrátane `value`, `data-surcharge-*`, `required`, placeholdera „Vyberte príplatok“, tlačidlo `button.add-to-cart-button[data-testid=buttonAddToCart]` v `.add-to-cart`) + `meta[itemprop=price]` + `.p-detail-inner-header h1` + dataLayer `{ projectId: 562035, product: { id: 640 } }`. Generátor `tools/test-1v/kamion-fixture.mjs --z-webu` (len GET), aby sa dal obnoviť po zmene v admine; `zive-ceny.json` z ART sa porovná s fixture (počet, mená, texty možností).

**(a) Cena** — `tools/test-kamion-cena.mjs`: prenesený ART `test-cena.mjs` (58 kontrol) nad `kamion/cena.js` + `citajCeny()` z fixture (jsdom). `tools/test-kamion-ceny-gen.mjs`: port ART `work/kontrola-cien.mjs` — `calculatePrice`/`readShoptetPrices`/`syncToShoptet` vyrezané z `konfigurator.gen.jsx` aj `.phone.gen.jsx` (hranice `const FIELD_META` … `function Configurator()`, ako `nacitajZivy`) vs `kamion/cena.js` vo všetkých 1 092 kombináciách; očakávané len zámerné rozdiely Z1 (160×) a Z2 (520×), všetko ostatné 0; cena v košíku (súčet zvolených možností po syncu) = `vypocitajCenu().spolu`. Spustí `build-truck-images.mjs`, ak `.gen.jsx` chýbajú.

**(b) Košík — jsdom E2E** — `tools/test-kamion-kosik.mjs` (vzor `assets/js/truck-konfigurator/test-truck-cart.mjs`): esbuild bundle `konfigurator1v/index.js` + `productPage.js` cesta, fixture, `sessionStorage.lcd1v = "vyvoj"`, klikanie po UI (`data-a` akcie, nie volanie funkcií). Natívne tlačidlo dostane spy (počet klikov, `FormData` formulára v okamihu kliku). Cesty:

| # | Cesta | Očakávané |
|---|---|---|
| 1 | DAF (TIR) XF106 2017-2021, automatická, prešívaná 12, lem 04, nášivky na všetky tri H19 / 2999, stred rovnaký, tapacír áno rovnaký, bez nášivky na dverách | 423 €, ušetríte 105 € (20 %); poznámka = `konfig-data.json suhrn.priklad_423` znak po znaku |
| 2 | Fiat (dodávka) Ducato 2007-2025, jednofarebná 10G, lem 09, len stred H21 / 3546 | krok tapacíru nie je; 352 „Nie nechcem tapacír dverí“, 355 „Nie …“, 388/391/394/397/400 prázdne; 258 € |
| 3 | MAN (TIR) TGX 2007-2017 (prevodovka + zásuvky) | bez oboch polí krok 1 červený a POST 0; s nimi poznámka má „Typ prevodovky“ aj „Počet zásuviek“ |
| 4 | Len stred (TIR, tapacír nie) | 403 „Bez nášivky“, 406 „Bez nite“, 409 motív, 412 niť; 397 „Bez nášivky“, 400 „Bez nite“ |
| 5 | Šofér + spolujazdec | 349 „Šofér + spolujazdec“ (nie BALÍK), 409 „Bez nášivky“, 412 „Bez nite“; Shoptet súčet = 199 + mat + 59 |
| 6a / 6b | Tapacír áno, nášivka na dverách áno (rovnaká) / nie | 355 „Áno …“ +49, 397/400 „Rovnaká ako koberec“ / 355 „Nie …“, 397 „Bez nášivky“, 400 „Bez nite“ |
| 7 | Tapacír áno → nášivka áno → prepnúť tapacír na Nie | spolu klesne o 119 + 49 (oprava Z1); 352 „Nie …“, 355 „Nie …“, 397 „Bez nášivky“, 400 „Bez nite“; 388/391/394 = to, čo nechá React (2.1 „nenastavovať“, 7) |
| 8 | Iný materiál dverí: Mikrosemiš – dvojfarebný 3N, lemovanie 11, vlastný motív H21 / 2840 | 388/391/394 „Vyberie sa v konfigurátore“, 397 „Nášivka H21“, 400 „2840 – Zelená“; poznámka „TAPACÍR DVERÍ … Mikrosemiš – dvojfarebný – 3N“ |
| 9 | Nič nevybraté → Do košíka (aj z lišty) | 0 klikov na natívne tlačidlo, otvorí sa krok 1 s červeným rámikom |
| 10 | Predvýber `truckBrand/truckModel/truckExtras` (aj neplatný model) | vozidlo predvyplnené len platnými hodnotami |
| 11 | (N1) TIR, tapacír Áno + vlastná nášivka H21 / 2824 → prepnúť na Fiat (dodávka) Ducato | 352/355 „Nie …“, 388/391/394/397/400 prázdne (ako čerstvá dodávka), 209 € |
| 12 | (N3) „Pridať do košíka“ a do 100 ms iný materiál | 0 klikov, poznámka sa nezapíše, tlačidlo znova aktívne |
| 13 | (N4) dve ťuknutia 300 ms po sebe (súhrn aj lišta) | 1 klik; tlačidlo aj lišta `disabled` + `aria-busy`; po `ShoptetCartUpdated` alebo 3 s znova aktívne |
| 14 | (N2, časť) povinný select bez hodnoty | 0 klikov, poznámka položky, ktorá už je v košíku, ostane |
| 15 | (R3) výzva `a[href="#product-detail-form"][data-p1v-kamion-krok]` | bez vozidla krok 1 červený, s vozidlom „material“, bez nápovedy / neznámy krok → vozidlo |
| 16 | (R5) „… recenzií na Google“ pod H1 | `href="#p1v-recenzie"`, klik posunie na `[data-lcd-sekcia="a-recenzie"]` − 90 px |

Od revízie 18. 10. (N1) sa „15 selectov = React“ porovnáva so zrkadlom krok po kroku, ale detaily tapacíru (388–400) bez tapacíru s Reactom na **čistej** stránke; navyše každá cesta kontroluje, že 15 selectov nezávisí od histórie (= React z čistej stránky len s finálnym stavom).

V každej ceste: všetkých 5 povinných selectov (346, 376, 379, 349, 352) má hodnotu; text zvolenej možnosti každého z 15 selectov = tabuľka 2.1; **hodnoty selectov = výsledok vyrezaného gen.jsx `syncToShoptet(naStavReactu(S))` na čistej kópii fixture** (parita s Reactom); kľúče `FormData` = `productId, priceId, language, amount` + 15 × `surchargeParameterValueId[N]`; `sessionStorage.truckOrderSummary` = `buildTruckOrderSummary(naStavReactu(S))` a `mergeTruckOrderSummaryIntoNote("", …)` má značky `[KONFIGURÁCIA KAMIÓNA]`; `truckVehicle` = „<značka> <model>“; `ctx.cena().spolu` = súčet modulu; 1 klik na natívne tlačidlo; žiadny `console.error`.

**(c) Nulová zmena bez flagu**
- `tools/test-kamion-brana.mjs` (jsdom, fixture): bez flagu → `#truck-konfigurator-root[data-tk-mounted="1"]`, žiadne `body.lcd-1v`, `#lcd1v-kamion`, `window.__lcd1v`, sessionStorage bez `lcd1v`; `?novy=vyvoj` → kamión, React root neexistuje; `?novy=1` pred K10 → React (typ nevydaný), po K10 → kamión; vynútená chyba v `init` (fixture bez selectu 352) a asynchrónna `ctx.zlozit()` → React namontovaný, `lcd-1v` preč, H1 a hlavička na pôvodnom mieste; CZ kontext (581408) → React.
- `tools/test-konfigurator-1v.mjs`: profil 640 v `tools/test-1v/produkty.mjs` (`typ: "kamion"`, `scenare: ["brana", "nulova-zmena", "kamion-platne", "kamion-dodavka", "kamion-neuplne"]`, `ceny: { "kamion-platne": 423 }`, `pripravene` = React root alebo `#lcd1v-kamion`), `TYPY_TEST.kamion`, alias `kamion`/`kamiony`; scenáre v novom `tools/test-1v/scenare-kamion.mjs`. `nulova-zmena` na 640 (lokálny build = živý CDN) musí prejsť, rovnako celý doterajší beh (`--produkt all` bez flagu aj `--novy`) bez zmeny výsledkov.

**(d)** `npm run truck:test` zelený — vrátane opravy `test-vehicle-switch.mjs` na Windows (`pathToFileURL(…).href` alebo `/` v ceste importu; mení len test). `truck/*`, `konfigurator*.jsx` a `order-summary.mjs` sa nemenia.

**(e) Náhľad na živej stránke s lokálnym buildom** (`tools/test-konfigurator-1v.mjs`, surový CDP, bez npm balíkov):
- Mechanizmus (už v teste, ř. 236–280): Chrome cez CDP `Fetch.enable`; požiadavky `…/eshopy/luxuryCar/assets/v/<sha>/js/luxuryCar.js` a `…/css/luxuryCar.css` dostanú čerstvý lokálny build (`esbuild … --minify --drop:console` ako `production.yml`, CSS `vloz-lcd-css.py --vystup`); `…/html/p1v-*.sk.html` lokálny `dist`; **každý `POST /action/Cart/addCartItem` sa zachytí (telo sa uloží do výsledku) a zruší `Fetch.failRequest Aborted`**, iný ne-GET na `/action/` sa zruší a test zlyhá (výnimka odmietnutie cookies), merače zablokované, cookie lišta odmietnutá.
- Postup:
  1. `node tools/test-konfigurator-1v.mjs --vyvoj --produkt 640 --sirka 1280,390 --snimky %TEMP%/kam-snimky --vypis` (POST telá vo výpise, snímky pred každým „Pridať do košíka“).
  2. Ručná kontrola: nový prepínač `--nechaj-otvorene` (K6) s `--okno`: po scenároch ostane okno Chromu otvorené s tým istým zachytávaním (lokálny bundle, POST do košíka zrušený a vypísaný v termináli), kým sa proces neukončí.
  3. Obsah: `node tools/test-1v-obsah.mjs --vyvoj --produkt 640` (+ `--len bez`, `--sonda-cisla --len novy`).
  4. Snímky porovnať s ART (`finalne/pc-*.png`, `tel-*.png`) na 390 a 1280.
- Chrome DevTools MCP vie stránku otvoriť a odfotiť, ale nevie podvrhnúť bundle ani zrušiť POST → na náhľad lokálneho buildu ho nepoužívať; použiť ho až na verziu, ktorú nahrá Michal.

---

## 6. Rozdelenie práce (2 nezávislé časti)

Obe vetvia z `kamiony-1v-lokal` po commite **K1 (kostra)**, potom bežia paralelne; súbory sa neprekrývajú. Spoločné súbory patria len KONFIGURÁTORU.

### KONFIGURÁTOR
**Smie meniť:** `assets/js/components/konfigurator1v/{produkty,index,obsah,obsah-cisla}.js`, `konfigurator1v/typy/kamion.js`, `konfigurator1v/kamion/*`, stub `konfigurator1v/obsah-kamiony.js` (len K1), `assets/js/components/productPage.js`, nový `assets/js/truck-konfigurator/mount.js`, `truck/build-truck-brands.mjs` (len adresy), `assets/css/_lcd1v-kamiony.scss`, prázdny `assets/css/_lcd1v-obsah-kamiony.scss` (len K1), `tools/vloz-lcd-css.py`, `tools/kamion-css-z-artefaktu.mjs`, `tools/test-kamion-*.mjs`, `tools/test-1v/{produkty,scenare-kamion,kamion-fixture}.mjs`, `tools/test-1v/kamion-640.fixture.html`, `tools/test-konfigurator-1v.mjs` (`--nechaj-otvorene`), `assets/js/truck-konfigurator/test-vehicle-switch.mjs`, `package.json` (len skript `kamion:test`), `docs/1v-kontrakt.md` (nová sekcia Kamióny), tento plán.

| Krok | Čo | Hotové, keď |
|---|---|---|
| K0 | `build-truck-brands.mjs` generuje `/luxusne-autokoberce-kamiony/` a `/luxusni-autokoberce-kamiony/` | `build:once` nechá `truck-brands.js` bez diffu |
| K1 | kostra: register 640 (`typ kamion`, bez ZAPNUTE_TYPY), `TYPY.kamion`, `typy/kamion.js`, `kamion/index.js` stub, `budeKamion1v`, `zlozit` modulov, `mount.js` + `productPage.js`, stuby `obsah-kamiony.js` + `_lcd1v-obsah-kamiony.scss` + bloky v `vloz-lcd-css.py`, kľúče `kamion-*` v `obsah-cisla.js` (zatiaľ `null` → `data-p1v-bez`) | build OK, `truck:test` (okrem K9) a `test-konfigurator-1v` bez flagu ako pred zmenou; **commit, potom štart OBSAH** |
| K2 | `kamion/data.js`, `texty.js`, `cena.js` + `test-kamion-cena.mjs` | 58 OK |
| K3 | `kamion/shoptet.js` (ceny, sync, doKosika) + `stav.js` adaptér + fixture + `test-kamion-ceny-gen.mjs` | 1 092 kombinácií, len Z1/Z2 |
| K4 | `kamion/ui*.js` (hlavička, 6 krokov, súhrn, lišta, H1, predvýber) | ART v jsdom aj v prehliadači |
| K5 | `_lcd1v-kamiony.scss` (prevod + ručné doladenie) | snímky 390/1280 ≈ ART |
| K6 | `test-kamion-kosik.mjs` (10 ciest), `test-kamion-brana.mjs`, profil 640 + `scenare-kamion.mjs`, `--nechaj-otvorene` | všetko zelené |
| K7 | poistka: chyba init / async / chýbajúci select → React | `test-kamion-brana` |
| K8 | `obsah-cisla.js` hodnoty `kamion-*` z `kamion/cena.js` | sonda čísel OK |
| K9 | oprava `test-vehicle-switch.mjs` (Windows) | `npm run truck:test` 5/5 |
| K10 | `ZAPNUTE_TYPY += "kamion"`, sekcia v `docs/1v-kontrakt.md`, riadok v `docs/1v-odkazy.md` (odkaz `…/luxusne-autokoberce-kamiony/?novy=1`) | testy (c) s `?novy=1` |

### OBSAH
**Smie meniť:** `admin-html/src/p1v-kamiony/*`, `assets/css/_lcd1v-obsah-kamiony.scss` (po K1), `konfigurator1v/obsah-kamiony.js` (po K1, len telo `init`), `admin-html/ciele.json`, `admin-html/dist/p1v-kamiony-*` (generuje build), `tools/test-1v/obsah-kamiony.mjs`, `tools/test-1v-obsah.mjs` (zaradenie pluginu `kamiony`), `docs/1v-obsah.md` (riadok skupiny `kamiony`).

| Krok | Čo | Hotové, keď |
|---|---|---|
| O1 | `ciele.json` (2 kusy, `produkt-640`, kľúče `kamion-*` v `pravidla.obsah-1v.cisla`) | `build-admin-html --vystup … --test` OK |
| O2 | sekcie kusu 1 (6 súborov) z `texty.json obsah.*` | ≤ 45 000 zn. |
| O3 | sekcie kusu 2 (recenzie, FAQ, výzva, pomocné) | ≤ 45 000 zn. |
| O4 | `_lcd1v-obsah-kamiony.scss` podľa ART `app.css` sekcií `.k-kap`/`.k-end` (prevedené ako 3.4) | snímky ≈ ART |
| O5 | `obsah-kamiony.js` (len ak treba správanie navyše, napr. pás galérie) + `tools/test-1v/obsah-kamiony.mjs` | `test-1v-obsah --vyvoj --produkt 640` OK |
| O6 | bez flagu 0 požiadaviek na `html/p1v-kamiony-*` a 0 médií obsahu | `test-1v-obsah --len bez --produkt 640` OK |

### INTEGRÁCIA (po oboch, jeden agent, poradie pevné)
I1 `python tools/vloz-lcd-css.py` + `node tools/build-admin-html.mjs` (dist + luxuryCar.css) · I2 `--check` oboch · I3 `npm run truck:test`, `npm run kamion:test`, `node tools/test-konfigurator-1v.mjs` (bez flagu, `--novy`, `--vyvoj --produkt 640`), `node tools/test-1v-obsah.mjs --vyvoj --produkt 640` · I4 snímky ART vs web (390, 1280) Michalovi · lokálny commit (bez `luxuryCar.js`, bez `node_modules`, bez `truck-brands.js` diffu). Push a prepnutie verzie v admine nie sú súčasťou plánu.

---

## 7. Riziká a čo nechať na Michala

**Riziká (technické):**
- **Prázdna stránka pri chybe** — React sa pri flagu nemontuje; poistka 1.4 + `test-kamion-brana` (chyba v init, async chyba, chýbajúci select). Bez flagu sa riziko netýka zákazníkov.
- **Parita košíka** — jediný nový kus je adaptér `naStavReactu`; sync a poznámka sú port/import Reactu a test (b) ich porovnáva priamo s vyrezaným gen.jsx. Pozor na `selectedColor` bez `name` a mená lemovania z gen.jsx.
- **Zmena Reactu neskôr** (re-sync z klientskeho repa) → port `syncToShoptet` sa rozíde; test (a)/(b) to chytí, lebo porovnáva s aktuálnym `.gen.jsx`.
- **Zmena selectov v admine** (nová možnosť, nový motív) — ceny a motívy sa čítajú živo; chýbajúci select = poistka (React). Fixture obnoví `kamion-fixture.mjs --z-webu`.
- **Veľkosť CSS** — luxuryCar.css ide na všetky stránky; prevod ART pridá desiatky kB. Prečistiť podľa použitých tried, zmerať brotli.
- **Formulár obaľuje UI** — každé tlačidlo `type="button"`, žiadne `name`; inak by Enter/klik odoslal formulár.
- **Recenzie** — `LCD_REVIEWS` sa na 640 načíta len ak `googleReviews` umiestni widget (do `div.basic-description`); overiť v (e), inak hodnotenie pod H1 a sekcia `a-recenzie` ostanú skryté.
- **Prostredie** — chýba `yarn`; `build:once` mení sledované `luxuryCar.js` a `truck-brands.js` (K0); `test-vehicle-switch` padá na Windows už dnes (K9).

**Na Michala (rozhodnutia a admin):**
1. Úspora pri „Šofér + spolujazdec“ / „Len stred“ (11 €): nové UI ju počíta do „Ušetríte“ (ART), React nie (Z2, `na_overenie` 14).
2. ~~Po prepnutí tapacíru na Nie nechá React v selectoch 388/391/394 „Rovnaký/á/é ako koberec“ (za 0 €, ale v košíku viditeľné).~~ **Vyriešené revíziou 18. 10. (N1):** nové UI bez tapacíru detaily tapacíru (388/391/394/397/400) vyprázdni — rovnako ako keby zákazník tapacír nikdy nevybral. React to robí naďalej po starom (mení sa len po vydaní nového UI).
3. Admin pred spustením pre všetkých: názov produktu/H1 („Luxusné autokoberce do kamiónov a dodávok“), SEO titulok a meta popis (`texty.json seo`, dnes „Testovací produkt…“), dostupnosť „Na dotaz“, kód `TEST-TRUCK`, bežná cena (dnes žiadna → bez Odporúčanej ceny).
4. Otvorené body ART `texty.json na_overenie` (21): lehota 20–30 vs 21–29 dní, čo je v základe 199 €, mená farieb a motívov (návrh), dve farby lemovania, vlastné logo/motívy (25 vs H19/H21), garancia, potvrdenie objednávky, čistenie mikrosemišu, štítok „Najobľúbenejšie“, odpoveď do hodiny, platba, doprava, „samostatne“ ceny (179/140/70/89 € sú len v kóde, nie v Shoptete), Scania R sedadlá, CINEMA, Actros MP2/MP3 roky, vodoodolnosť.
5. Fotky do galérie a obsahu: dnes len 30 fotiek produktu 640; fotky kabín zákazníkov s logom Scania sa nepoužijú — dodá fotky bez loga?
6. Poradie obsahu: ART (galéria … recenzie … FAQ) vs. pravidlo 1V „recenzie hore“.
7. Vydanie: kedy pridať `kamion` do `ZAPNUTE_TYPY` (K10) a kedy push + prepnutie verzie v SK admine (mimo tohto plánu); CZ ostáva React.

---

## 8. Stav časti KONFIGURÁTOR (18. 10. 2026, lokálne commity na `kamiony-1v-lokal`, bez pushu)

| Krok | Stav |
|---|---|
| K0, K9 | hotové (`cf459d9`) — `build:once` nechá `truck-brands.js` bez obsahovej zmeny (len CRLF), `truck:test` 5/5 |
| K1 | hotové (`88c4116`) |
| K2–K4, K7 | hotové — `kamion/{data,texty,cena,shoptet,stav,ui,index}.js`; poistka navyše: nezhoda materiálov Shoptet ≠ konfigurátor a chyba po štarte (klik/zmena) → React |
| K5 | hotové — `_lcd1v-kamiony.scss` 63,6 kB surovo / ~7,8 kB brotli (**nad cieľom 45 kB**: predpona `body.lcd-1v[data-lcd1v-typ="kamion"] #lcd1v-kamion` × ~340 selektorov ≈ 18 kB); Shoptet téma: `.p-detail-inner-header { order: 1 }` a `h1 { display: none }` riešené v časti RUČNE |
| K6 | hotové — `kamion:test` (cena 68, 1 320 kombinácií, košík 194, brána 40), profil 640 + `scenare-kamion.mjs`, `--nechaj-otvorene` (nespustené — otvára okno Chromu) |
| K8 | hotové — `kamion-*` v `obsah-cisla.js` |
| K10 | **nespravené zámerne**: `kamion` nie je v `ZAPNUTE_TYPY` a `docs/1v-odkazy.md` bez riadku — o vydaní rozhoduje Michal (§7 bod 7). Sekcia „Kamióny“ v `docs/1v-kontrakt.md` (§17) je. |

Odchýlky od plánu: lišta na telefóne sa ukazuje ako v artefakte (keď súhrn s tlačidlom nie je na obrazovke), nie až keď je celý konfigurátor mimo obrazovky; prvok a triedy sú 1V (`#lcd1v-lista`). Hlavička používa triedy artefaktu (`.k-typ`, `.k-h1`, `.k-hodn`), nie `.lcd1v-typ` / `.lcd1v-hodn`.

---

## 9. Integrácia (18. 10. 2026, lokálny commit na `kamiony-1v-lokal`, bez pushu)

| Krok | Výsledok |
|---|---|
| I1 | `python tools/vloz-lcd-css.py` (bloky LCD-1V-KAMIONY + LCD-1V-OBSAH-KAMIONY, `luxuryCar.css` len pridané riadky) + `node tools/build-admin-html.mjs` (`dist/p1v-kamiony-1/-2.sk.html`, manifest) |
| I2 | `vloz-lcd-css.py --check` OK, `build-admin-html.mjs --check` OK |
| I3 | `build:once` OK · `truck:test` 5/5 · `kamion:test` (cena 68, 1 320 kombinácií, košík 194, brána 40) · `test-konfigurator-1v` 640: `--vyvoj` 10/10, bez flagu 4/4, `--novy` 4 OK + 6 preskočené (kamion nie je v `ZAPNUTE_TYPY` → React) · `--produkt all --krok brana,nulova-zmena --sirka 1280`: bez flagu 30/30, `--novy` 30/30 · `test-1v-obsah --vyvoj --produkt 640` 10/10, sonda čísel OK |
| I4 | Snímky živej stránky s lokálnym buildom (`?novy=vyvoj`) a bez flagu v `docs/kamiony-snimky/`; POST do košíka nového UI = POST Reactu bajt po bajte, poznámka objednávky zhodná (`docs/kamiony-snimky/post-porovnanie.json`) |

Opravy testov pri integrácii: `scenare-kamion.mjs` — pri `?novy=1` pred vydaním sa scenáre preskočia (predtým zlyhali na chýbajúcom `body.lcd-1v`); `obsah-kamiony.mjs` — „vo výreze“ = nad spodnými 8 % ako reveal v `obsah.js` (na 390 px tlačidlo galérie trčalo 5 px pod hranicu).
`?novy=1` na 640 = React až do K10 (rozhodnutie Michala). Nové UI sa dá pozrieť len cez `?novy=vyvoj`.

---

## 10. Stav a nasadenie (18. 10. 2026, po revízii; lokálne commity na `kamiony-1v-lokal`, bez pushu)

### 10.1 Čo je hotové

Celý nový konfigurátor kamiónov a dodávok (6 krokov ako schválený artefakt, ozajstný košík Shoptetu) + obsah pod ním, za bránou. Bez flagu sa pre zákazníka nemení nič (`nulova-zmena` na všetkých 15 produktoch OK). Na 640 dnes: bez flagu aj s `?novy=1` = React (kamion nie je v `ZAPNUTE_TYPY`), nové UI len s `?novy=vyvoj`.

Revízia (2 modely, 9 nálezov) — každý nález som zopakoval (jsdom alebo kód/CSS), výsledok:

| Nález | Overené | Stav |
|---|---|---|
| R1 náhľad nášivky neprefarbí motív (canvas „tainted“) | áno — `nacitaj()` bez `crossOrigin` | **opravené**: `i.crossOrigin = "anonymous"` (ako React); živý test: náhľad je červený pri niti 2824 a béžový pri 3546, canvas nie je tainted |
| R2 v CSS chýbali pravidlá tried s `--` (Áno/Nie sivé, ponuka tapacíru, „Najobľúbenejšie“, dlaždice motívov a materiálov) | áno — 0 výskytov v SCSS, príčina regex `tools/kamion-css-z-artefaktu.mjs:39` | **opravené**: regex `(?:--\|-\|__)`, prevod znova spustený (len +13 pravidiel + 1 `@media`, inak bez zmeny), `vloz-lcd-css.py`; živý test kontroluje farby (Áno zelené, Nie zlaté, zlatý rám, biely podklad motívu) |
| R3 „Vybrať materiál“ v obsahu otvorí krok Vozidlo | áno | **opravené**: `naVyzvu` číta `data-p1v-kamion-krok`; `otvorKrok` pri neznámom kroku → Vozidlo; košík cesta 15 + `obsah-kamiony.mjs` (živá stránka) |
| R4 okno Luxie zakrýva konfigurátor a chybové hlásenie | v mojich behoch (Chrome bez okna) sa uvítanie ani VIP okno neukázalo, len bublina; revízia ho má na snímkach | **neopravené — rozhodnutie Michala** (celý web, modul Luxia je iné repo); návrh v 10.4 |
| R5 „… recenzií na Google“ nikam nevedie | áno — `href="#"`, bez poslucháča | **opravené**: `href="#p1v-recenzie"` + posun na `[data-lcd-sekcia="a-recenzie"]` − 90 px (ako 1V `cena.js`); košík cesta 16 |
| N1 TIR s tapacírom → dodávka: 388–400 nesú starú nášivku na dverách | áno — POST `[397]=1765`, `[400]=1813` pri `[352]=1384` | **opravené** v novom module (`shoptet.js upratTapacir`; doslovná kópia Reactu nedotknutá): bez tapacíru sa 388/391/394/397/400 vrátia na „Vyberte príplatok“ = rovnaký stav, ako keď zákazník tapacír nikdy nevybral; vyrieši aj starý bod §7.2; cesty 7 a 11 + v každej ceste kontrola „15 selectov nezávisí od histórie“ |
| N2 dve konfigurácie v jednom košíku → poznámka len poslednej | áno (2 POST, poznámka len „– 10“); aj prepis poznámky pri nepodarenom pridaní | **čiastočne**: poznámka sa zapíše až tesne pred klikom (nepodarené pridanie ju už neprepíše, cesta 14). Viac konfigurácií = **rozhodnutie Michala** (týka sa aj Reactu, `order-summary.mjs` je spoločný) |
| N3 zmena výberu do 100 ms po „Pridať do košíka“ | áno — POST s Mikrosemišom, poznámka s prešívanou | **opravené**: každá zmena zruší čakajúci klik; pred klikom kontrola, že sa výber nezmenil; cesta 12 |
| N4 dvojité ťuknutie = 2× v košíku | áno — 2 kliky pri 300 ms | **opravené**: po „Pridať do košíka“ sú tlačidlo aj lišta `disabled` + `aria-busy`, kým nepríde `ShoptetCartUpdated` (najviac 3 s); zmena výberu ich zapne hneď; cesta 13 |

React (`truck-konfigurator/*`, `order-summary.mjs`) sa nemenil — N1, N3, N4 tam ostávajú, kým je React naživo.

### 10.2 Výsledky testov (18. 10. 2026, po opravách)

| Test | Výsledok |
|---|---|
| `build:once` | OK. Na Windows `npm run build:once` nenájde `esbuild` (cmd), bundle preto rovnakým príkazom cez `node node_modules/esbuild/bin/esbuild …`; `yarn` na PC nie je. `truck-brands.js` bez obsahovej zmeny |
| `npm run truck:test` | 5/5, VÝSLEDOK: OK |
| `kamion:test` | cena 68 OK · ceny vs gen.jsx 1 320 kombinácií, NÁLEZ 0 (len zámerné Z1/Z2) · košík **244 OK** (cesty 1–16) · brána 40 OK |
| `vloz-lcd-css.py --check`, `build-admin-html.mjs --check` | OK |
| `test-konfigurator-1v --vyvoj --produkt 640 --sirka 1280,390` | 10/10 (kamion-platne 423 €, kamion-dodavka 258 €, kamion-neuplne, brana, nulova-zmena) |
| `test-konfigurator-1v --produkt 640` bez flagu / `--novy` | 4 OK + 6 preskočené / 4 OK + 6 preskočené (React) |
| `test-konfigurator-1v --produkt all --krok brana,nulova-zmena --sirka 1280` bez flagu / `--novy` | 30/30 / 30/30 |
| `test-1v-obsah --vyvoj --produkt 640` / `--len bez` | 10/10 (skupina KAMIONY 40–41 kontrol, vrátane „Vybrať materiál“) / 4/4 |

POST šťastnej cesty (DAF XF106 2017–2021, prešívaná 12, lem 04, balík H19/2999, tapacír ako koberce) na živej 640 s lokálnym buildom, zachytený a zrušený: **423 €**, telo na 1280 aj 390 **bajt po bajte = React** (`docs/kamiony-snimky/post-porovnanie.json` → `revizia_2026_10_18`).

Snímky `docs/kamiony-snimky/` (lokálny build, `?novy=vyvoj`): `pc-vrch`, `tel-vrch`, `pc-kroky` (krok 5, zlatý „Najobľúbenejšie“), `pc-nahlad` + `tel-nasivky` (náhľad v červenej niti), `pc-tapacir` (ponuka 119 €), `pc-tapacir-zmenit` (5 materiálov v rade), `pc-tapacir-nasivka` + `tel-tapacir` (nášivka na tapacír: Áno zelené, Nie zlaté), `pc-suhrn` + `tel-suhrn` (423 €), `tel-dodavka-suhrn` (258 €); `bez-flagu`, `obsah-pc`, `obsah-tel` z integrácie (bez zmeny).

### 10.3 Postup nasadenia (len na Michalov pokyn)

1. **Vydanie pre `?novy=1` (K10)** — v `assets/js/components/konfigurator1v/produkty.js` pridať `"kamion"` do `ZAPNUTE_TYPY`; do `docs/1v-odkazy.md` riadok „15 · 640 Kamióny a dodávky · kamion · https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/?novy=1 · 6 krokov, 423 € pri DAF XF106 + balík + tapacír; dodávka bez kroku tapacíru“. Potom `kamion:test` (brána: `?novy=1` → kamión), `test-konfigurator-1v --novy --produkt 640` (scenáre sa už nepreskočia) a `--produkt all --krok brana,nulova-zmena` bez flagu. Commit.
2. **Zosúladiť s main:** `git fetch origin` → `git rebase origin/main` (medzitým mohla pushnúť iná session; konflikt v `luxuryCar.css` vyriešiť znova cez `python tools/vloz-lcd-css.py`, v `admin-html/dist` cez `node tools/build-admin-html.mjs`) → znova celá sada 10.2.
3. **Push do `main`** (`SharkJohny/spt-luxuryCar`, iba main). GitHub Actions `production.yml` zbalí `luxuryCar.js` (`--minify --drop:console`) a `luxuryCar.css` a nahrá ich spolu s `html/p1v-*.sk.html` do `…/eshopy/luxuryCar/assets/v/<sha>/` (sha = `git rev-parse --short HEAD`). Overiť `assets/js/version.json` (prepis CDN z inej vetvy).
4. **Kontrola verzie z CDN pred prepnutím:** `node tools/test-konfigurator-1v.mjs --zdroj <sha> --novy --produkt 640` a `--zdroj <sha> --produkt all --krok brana,nulova-zmena --sirka 1280` (bez flagu 30/30).
5. **Prepnutie SK:** Shoptet **SK** admin → HTML kódy: v `…/assets/v/<sha>/js/luxuryCar.js` a `…/assets/v/<sha>/css/luxuryCar.css` vymeniť súčasný sha (dnes `d65c8fd`; zapísať si ho na návrat) za nový — 2× Záhlavie, 2× Zápätie. Prepnutie sha po zelených testoch má Michal schválené natrvalo (15. 10.), urobí ho Michal alebo Claude. **CZ HTML kódy nemeniť** (CZ ostáva `5db0f33`, kamióny na CZ = React). Nový sha nesie aj všetky zmeny main od `d65c8fd` (dnes len tento projekt + docs).
6. **Po prepnutí:** odkaz **https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/?novy=1** (bez flagu React, `?novy=0` vypne); `test-konfigurator-1v --zdroj cdn --novy --produkt 640` a kontrola na telefóne. Skutočná objednávka len s Michalom (živý test s Michalom).
7. **Návrat:** sha v SK HTML kódoch späť na zapísaný. Nič iné.

Spustenie pre všetkých (bez flagu) je samostatné rozhodnutie neskôr (§7 bod 3 — admin: názov/H1, SEO, dostupnosť, kód `TEST-TRUCK`, bežná cena; obsah do Popisu produktu).

### 10.4 Čo čaká na Michala

1. **Pripomienky k artefaktu** — ak ešte nejaké pošle, premietnuť do `kamion/texty.js` / `ui.js` / CSS a zopakovať 10.2.
2. **K10 + push + prepnutie sha** (10.3) — kedy.
3. **N2 – viac konfigurácií v jednom košíku** (React aj nové UI: poznámka objednávky opisuje len poslednú pridanú konfiguráciu; farba, lemovanie a vozidlo sú len v poznámke). Možnosti: (a) poznámka ako zoznam všetkých pridaných konfigurácií (`order-summary.mjs`, spoločné pre React aj nové UI) — odporúčam, najlacnejšie; (b) po pridaní ďalšiu 640 v tej istej relácii zablokovať alebo upozorniť; (c) farbu a lemovanie písať aj do selectov 376/379 (treba nové možnosti v admine).
4. **R4 – okno Luxie** (uvítanie a VIP výzva) na stránke s konfigurátorom zakrýva chybové hlásenia a tlačidlá, kým ho zákazník nezavrie. Návrh: na stránkach s konfigurátorom 1V potlačiť automatické uvítanie a VIP výzvu (ostane bublina, ktorú 1V už zdvíha nad lištu), alebo ich ukázať až po pridaní do košíka. Týka sa celého webu a modulu Luxia (iné repo).
5. Body §7 3–6 (admin pred spustením pre všetkých, `na_overenie` z artefaktu, fotky bez loga Scania — logo má aj ilustračná fotka tapacíru v kroku 6, poradie obsahu).

---

## 11. Kroky 5 a 6 podľa návrhu C + „zvolené = zelené“ (18. 10. 2026, lokálny commit na `kamiony-1v-lokal`, bez pushu)

Michal vybral návrh C (`scratchpad/kamiony-nasivky/navrh-c.html`, 5 pripomienok k nášivkám a tapacíru). Košík a ceny sa nemenia: tie isté 4 stavy `S.nas` (`nechcem` / `stred` / `boky` / `boky+stred`), tie isté selecty a poznámka, `cena.js`, `stav.js` a `shoptet.js` bez zmeny.

| Čo | Ako |
|---|---|
| Krok 5 — kde budú nášivky | 3 fotkové dlaždice (pred sedadlá — ★ všetky tri v strede — stredový koberec) so skutočnou fotkou kabíny a zlatými krúžkami na nášivkách, „Nie, ďakujem“ zlaté pod nimi. Dlaždice sa zaškrtávajú (`data-a="nas"`, `data-v` = miesto); z prázdneho výberu klik = presne ten stav ako predtým, preto testy košíka ostali. Fotka `assets/img/1v/kamion-nasivky-kabina.jpg` (1160 × 870, 291 kB, z Michalovho `91ThIMeaukL.jpg` otočená podľa EXIF), adresa `OBRAZKY_1V` + `data.js FOTKA_KABINY_NASIVKY`; výrez dlaždíc cez CSS (`--z`, `--fx`, `--fy`), text „Ilustračná fotka“. |
| Vaša voľba | až po výbere, schéma kabíny, cena v rámiku, pri jednom mieste tip na balík (suma z `ponuka()`). |
| Veľký náhľad | `canvas.kn-nh__cv` cez celú šírku karty (PC ~515 px, telefón ~325 px), rozlíšenie = šírka × max(2, DPR) (≤ 1600 px), 3:2; prefarbenie nite ako predtým, motív na fotke materiálu (cover) s tieňom; pod ním „Kam príde“ so schémou a „Podklad“. |
| Nite | prvých 6 + „Ďalšie farby (+5)“ (`data-a="viac"`); vybraná sa nikdy neskryje. |
| Stred pri balíku, tapacír, nášivka na dvere | dve rovnocenné dlaždice namiesto políčka / odkazu: `stredRovnaky` 1/0, `tapRovnake` / `tapZmenit`, `tapNasRovnaka` 1/0. Vlastný motív dverí (bez nášivky na kobercoch) sa neskôr neprepíše motívom kobercov. |
| Krok 6 | celá fotka dverí 3:2 bez orezania (`FOTKA_DVERI`), ponuka 119 € v rámiku, výrez dverí so zlatým krúžkom „Sem príde nášivka“, otázka na nášivku s cenou v rámiku (+ 49 €, 89 €, Ušetríte 40 €). |
| Zvolené = zelené (celé kamióny) | blok na konci `_lcd1v-kamiony.scss` (RUČNE): rám #1f7a52 3 px (rám + box-shadow), fajka so zeleným prechodom a bielou fajkou — segment Kamión/Dodávka, materiál, farba, lemovanie, motív, niť, dlaždice nášiviek, rovnaké/inak, Áno/Nie. Zlatá ostáva na štítkoch (★ Najobľúbenejšie, Odporúčame), ponukách v rámiku a „Nie, ďakujem“. |

Testy po zmene: `kamion:test` (cena 68, ceny vs gen.jsx 1 320 kombinácií NÁLEZ 0, košík **274 OK** — nová cesta 17 = kontroly návrhu C, brána 42) · `truck:test` OK · `test-konfigurator-1v --novy --produkt 640 --sirka 1280,390` 10/10 (POST 423 € a 258 € ako predtým; nové kontroly: zelené zvolené, 3 fotkové dlaždice s načítanou fotkou, plátno ≥ 2× CSS šírky cez celú kartu, celá fotka dverí, dve voľby tapacíru) · `--produkt all --krok brana,nulova-zmena --sirka 1280` bez flagu 30/30 · POST do košíka (kamion-platne 423 €, kamion-dodavka 258 €; 1280 aj 390) bajt po bajte = telá revízie v `post-porovnanie.json` → `revizia_2026_10_18` (= React) · `test-1v-obsah --produkt 640` 10/10. Snímky `docs/kamiony-snimky/c-krok5-*.png`, `c-krok6-*.png` (390, 1280; `node tools/snimky-kamion-kroky.mjs docs/kamiony-snimky`).

### 11.1 Opravy po dvojitej revízii (18. 10. 2026, lokálne, bez pushu)

Vetva zosúladená s `origin/main` (`git rebase origin/main` na `eb13dcf` — box-kresba, „zvolené = zelené“ ostatných 1V; bez konfliktu, `vloz-lcd-css.py --check` OK).

| Nález | Oprava |
|---|---|
| Vysoká: „Vybrať inak“ → dvojfarebný mikrosemiš → znova „Vybrať inak“ = pád zhrnutia (farba 12 k materiálu nepatrí) → React | `tapZmenit` pri už zvolenom „Vybrať inak“ nič nerobí; farba kobercov sa doplní len ak patrí k materiálu tapacíru; `chyba("tapacir")` vráti chybu farby aj pri farbe z iného materiálu; `zhrnutie` bez pádu. |
| Stredná: odznačenie dlaždice → `S.nas = null` → selecty Shoptetu na starej hodnote, `console.error` ceny | Výber sa nikdy nevráti na prázdny: ťuk na jediné zvolené miesto ani na zvolený balík nič nemení. Zmena = iné miesto (balík ↔ jedna strana) alebo „Nie, ďakujem“. `shoptet.js`/`index.js` bez zmeny. |
| Stredná: zelený pás „✓ Vybraté“ na balíku odznačoval všetko | pás je po výbere stav (`.kn-dv__cta--stav`, svetlozelený, bez účinku). |
| Stredná (vzhľad): dlaždice motívov slabšie než návrh C | motív cez celú dlaždicu (`cover`), béžový podklad `#f0edda`, mriežka max 380 px; mozaika „Iný motív“ béžová. |
| Nízke | fotka dverí ako JPEG `assets/img/1v/kamion-dvere-tapacir.jpg` (1536 × 1024, 212 kB namiesto PNG 2,7 MB); pulz krúžkov cez `transform`/`opacity`; fotka v dlaždici `aria-hidden` (meno = názov + cena), „Vaša voľba“ `aria-live`; NBSP za jednopísmenovými predložkami v texte kroku 6 („Áno, s nášivkou“); „pred sedadlá“; lemovanie uprostred vety malým písmom (krok 6 aj súhrn); súhrn „Nášivky na všetky tri koberce“ / „Nášivky pred sedadlá (šofér a spolujazdec)“; úvodná veta kroku 5 „… – pred sedadlá, na stredový koberec alebo na všetky tri.“ |

Testy: `kamion:test` (cena 68, NÁLEZ 0, košík **282 OK** — +8 kontrol v ceste 17; na starej logike 8 ZLE, brána 42) · `truck:test` OK · `test-konfigurator-1v --novy --produkt 640 --sirka 1280,390` 10/10 (kontrola dlaždice motívu = béžový podklad + cover) · POST kamion-platne 423 € a kamion-dodavka 258 € na 1280 aj 390 bajt po bajte = `post-porovnanie.json` → `revizia_2026_10_18` · bez flagu `--produkt all --krok brana,nulova-zmena` 30/30 · `test-1v-obsah --produkt 640` 10/10. Snímky `docs/kamiony-snimky/c-krok5-*`, `c-krok6-*` (390, 1280) nové.

Pred vydaním na web: push nahrá aj `kamion-nasivky-kabina.jpg` a `kamion-dvere-tapacir.jpg` do `…/assets/img/1v/` — overiť HTTP 200 oboch ešte pred prepnutím sha v SK admine.

---

## 12. Kroky 5 a 6 — otázky po jednej (Michal 18. 10. 2026 večer, lokálny commit na `kamiony-1v-lokal`, bez pushu)

Michal po prechode naživo (`?novy=1`, 85a2a4c): zaškrtávanie miest a „všetky tri“ so zeleným tlačidlom mätie, otázka na stredový koberec je malá, všetko je otvorené naraz. Chce pôvodný princíp: jasná otázka, jasné možnosti, zodpovedané sa zatvorí. Košík a ceny sa nemenia: tie isté 4 stavy `S.nas`, tie isté polia `S`, `cena.js`, `stav.js`, `shoptet.js` bez zmeny; ktorá podotázka je otvorená, drží len UI stav `U` (`U.n5`, `U.n6`, `U.znova`).

| Čo | Ako |
|---|---|
| 5.1 kam | veľká otázka „Prosím, vyberte si, kam chcete nášivky“, 4 **výlučné** voľby v poradí (1) pod sedadlá šoféra a spolujazdca, (2) stredový koberec, (3) ★ všetky tri (zlatý pás „★ Najobľúbenejšie ★“ ako odporúčaná karta rohože/boxu), (4) „Nie, ďakujem“ (zlaté). Rádio: zelený rám + zelená fajka LEN na zvolenej. Bez zeleného tlačidla v dlaždici, bez „Vaša voľba“. Cenovka = `kufor-boxy.js cenovka()` (`.k-cenovka`: „S KOBERCAMI“, + 59 € / Samostatne ~~70 €~~ / Ušetríte 11 €; všetky tri + 95 € / ~~140 €~~ / 45 €) zo `ponuka()`. |
| 5.2 pod sedadlami | karta „Nášivky pod sedadlá šoféra a spolujazdca“: „Prosím, vyberte si motív“ (veľké dlaždice H19 / H21), „Prosím, vyberte si farbu nite“ (6 + Ďalšie farby), veľký náhľad, zelené „Pokračovať“ → riadok „✓ Pod sedadlá šoféra a spolujazdca: Trucker (H21) · niť červená (2824) — Zmeniť“. |
| 5.3 stred pri (3) | karta „Stredový koberec“: „Prosím, vyberte si nášivku na stredový koberec“ — „Rovnaká ako pod sedadlami šoféra a spolujazdca“ (náhľad motívu v nití) = hotovo / „Iná nášivka“ → motív, niť, náhľad, Pokračovať. Nič nie je predvolené. |
| 5.4 len stred | karta „Nášivka na stredový koberec“: motív, niť, náhľad, Pokračovať. |
| Krok 6 | ponuka (celá fotka dverí, cenovka „S KOBERCAMI“ 119 € / ~~179 €~~ / 60 €, zelené Áno, zlaté Nie) → riadok → karta „Materiál, farba a lemovanie tapacíru“ (Rovnaké ako koberce = hotovo / Vybrať inak → materiál, farba, lemovanie, Pokračovať) → karta „Nášivka na tapacír dverí“ (výrez „Sem príde nášivka“, Áno/Nie, cenovka „S TAPACÍROM“ + 49 € / ~~89 €~~ / 40 €) → pri Áno „Rovnaká ako na kobercoch / Iná nášivka“ (bez nášivky na kobercoch rovno motív a niť) → Pokračovať → „Pokračujte k súhrnu“. |
| Spoločné | vždy otvorená LEN jedna podotázka, za ňou nič; „Pokračujte ďalej / k súhrnu“ až keď je všetko zodpovedané; „Zmeniť“ (44 px) otvorí podotázku znova so zvolenou voľbou; po zatvorení plynulý posun na novú kartu (fokus na ňu); lišta „Pokračovať“ na telefóne = „Pokračovať“ v karte; „Nie, ďakujem“ (krok 5 aj 6) ide ďalej samo ako doteraz. Krok je hotový (košík) až po potvrdení kariet a odpovedi na stred / materiál / nášivku na dvere. |
| Oprava popri | nášivka na dvere „ako na kobercoch“ po zrušení nášiviek na kobercoch: `S.tapNas` ostane (predtým `null` → select 355 ostal „Áno“ = cena Shoptetu o 49 € vyššia + `console.error`), otázka Áno/Nie na dvere sa ukáže znova s vysvetlením a bez predvoľby. |

Testy: `kamion:test` (cena 68 · ceny vs gen.jsx NÁLEZ 0 · košík **309 OK** — cesty 1–11 s klikmi „Pokračovať“ / „Rovnaké“ v podotázkach, cesta 17 prepísaná na nový tok, nová cesta 18 = lišta a košík bez potvrdenia · brána 42) · `truck:test` OK · `test-konfigurator-1v --novy --produkt 640 --sirka 1280,390` 10/10 (nové kontroly: 5.1 bez zeleného tlačidla, cenovka červená čiara + zelená pilulka, veľká otázka, zelená LEN jedna dlaždica, karta pod sedadlami sama, posun na kartu stredu, „Zmeniť“ ≥ 44 px) · POST kamion-platne 423 € a kamion-dodavka 258 € na 1280 aj 390 **bajt po bajte** = `post-porovnanie.json` → `revizia_2026_10_18` (scenáre vracajú telo POST do `--json`) · bez flagu `--produkt all --krok brana,nulova-zmena --sirka 1280` 30/30 · `test-1v-obsah --produkt 640` 10/10 · `build:once`, `vloz-lcd-css.py --check`, `build-admin-html.mjs --check` OK. Snímky `docs/kamiony-snimky/d-krok5-*.jpg`, `d-krok6-*.jpg` (390, 1280; JPEG, `node tools/snimky-kamion-kroky.mjs docs/kamiony-snimky`).

### 12.1 Opravy po dvojitej revízii (logika + UX, 18. 10. 2026 večer; lokálny commit, bez pushu)

Košík a ceny bez zmeny (`cena.js`, `stav.js`, `shoptet.js` nedotknuté; POST kamion-platne 423 € a kamion-dodavka 258 € na 1280 aj 390 bajt po bajte = `post-porovnanie.json` → `revizia_2026_10_18`).

| Nález | Oprava |
|---|---|
| Otázka znova otvorená cez „Zmeniť“ na hotovom kroku: zmizlo „Pokračujte ďalej / k súhrnu“, `U.znova` prežil zatvorenie hlavičky aj iný krok, lišta „Pokračovať“ pri otázke nad nepotvrdenou kartou skončila na hlavičke | `telo56`: tlačidlo sa skryje len keď krok nie je hotový (`!hotovy(id)`); `zavriZnova()` v `otvorKrok` a pri zatvorení hlavičky; `lista()`: znova otvorenú otázku zavrie a posunie na prvú nezodpovedanú kartu (nič nepotvrdí) |
| Nášivka na dvere „ako na kobercoch“ bez vzoru (`U.dvereInfo`): Zmeniť ponuku + znova Áno otázku obišlo | otázku Áno / Nie otvára `chyba()` (pole `tapNas`, kým platí `U.dvereInfo`), nie `U.znova`; akcia `tap` `U.dvereInfo` nemaže — zruší ho až odpoveď Áno / Nie (`tapNas`) alebo návrat nášivky na koberce; pri dodávke sa nuluje |
| Pod sedadlá → stredový koberec prevzal starý vlastný stred z histórie | `odoberBoky`: z „pod sedadlá“ sa motív a niť prenesú vždy, keď sú obe vybraté |
| Texty | „Stredový koberec: rovnaká **nášivka** ako pod sedadlami – …“, „Motív nášivky na tapacír dverí: rovnak**ý** ako na kobercoch – …“ (predtým „na tapacíre“ a nezhoda rodu), karta motívu na dvere má vlastný nadpis „Motív nášivky na tapacír dverí“, vnorený riadok „✓ Iný materiál, farba alebo lemovanie“ (nie sloveso „Vybrať inak“), ponuka tapacíru „Môže byť v rovnakom materiáli, farbe a lemovaní ako koberce, alebo si ich vyberiete inak.“ (nesľubuje predvoľbu), „áno · 119 €“ a „· + 95 €“ s nezalomiteľnými medzerami (riadok na telefóne nezačne bodkou) |
| Vzhľad | farby tapacíru v karte („Vybrať inak“) v stĺpcoch ≥ 86 px (`auto-fill`) — „Tmavohnedá“, „Tmavomodrá“, „Karamelová“ sa nelámu ani na 360 px, ani v úzkom stĺpci na 1024 px; otázky „Prosím, vyberte si …“ 20 px (PC 21 px); pás „★ Najobľúbenejšie ★“ ako rohož a box (13,5 px, .14em, 9/12/8 px); PC (≥ 600 px): fotka v dlaždici 5.1 vyplní celú výšku dlaždice — zväčšenie ostáva z `--z` (krúžky a štítky celé), scéna je aspoň taká vysoká ako okno (`height: max(z·75cqw, 100,5 %)`, šírka z pomeru 4:3) a výrez sa len posunie (`clamp`), aby pri okraji nevznikla medzera; `@supports (width: 1cqw)`, inak 4:3 ako doteraz (pozor: `cqh` pri výške z `min-height` Chrome vyhodnotí ako 0) |

Nové kontroly: `test-kamion-kosik` 334 OK (cesta 17: Zmeniť na hotovom kroku 5 aj 6 → „Pokračujte“, hlavička zavrieť/otvoriť → riadky ✓, Zmeniť ponuku + Áno pri strate vzoru, nadpis karty motívu, nové texty; cesta 18: lišta pri znova otvorenej otázke; nová cesta 19: všetky tri s iným stredom → pod sedadlá → stredový koberec + košík = React) · `scenare-kamion` (fotka 5.1 pokrýva okno a na PC vyplní výšku dlaždice, otázka ≥ 20 px, „Vybrať inak“ vždy: žiadny názov farby zalomený uprostred slova — overené na 360, 390, 430, 600, 768, 820, 1024, 1280 a 1366 px; kontroly zlyhajú na pôvodnom CSS).

Vedome nezmenené (na rozhodnutie Michala): po poslednej podotázke sa ešte klikne „Pokračujte ďalej“ (ako kroky 1–4; automatický posun by sa dal doplniť) · dlaždica (3) ostáva výrez `--z:1.4` (všetky tri krúžky veľké), nie celá fotka · veta „Zákazníci si ich vyberajú najčastejšie“ pod pásom chýba (štítok „Najobľúbenejšie“ je stále otvorený bod §7 — veta by tvrdenie zosilnila) · lehota v súhrne 20–30 dní (texty ART; LCD inde 21–29 dní — otvorený bod §7).
