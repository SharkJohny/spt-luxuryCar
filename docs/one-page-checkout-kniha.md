---
title: One page checkout LCD – kniha (špecifikácia pred stavbou)
type: project
status: draft
datum: 2026-10-28
created: 2026-10-28
updated: 2026-10-30
verzia: 0.1
tags: [one-page-checkout, shoptet, kosik, objednavka, sk, cz]
---

# One page checkout LCD – kniha v0.1

Táto kniha opisuje, ako na luxurycardesign.sk a .cz spojiť kroky objednávky „Doprava a platba“ a „Informácie o Vás“ do jednej stránky. Riešenie sa najprv postaví a otestuje ako prototyp mimo e-shopu a naživo pôjde až za prepínačom `?opc=1`.

Značky: ✅ overené (so zdrojom) · 🟡 predpoklad (s dôvodom) · ❓ neoverené · ⛔ rozpor medzi zdrojmi alebo rozhodnutiami.

> **Rozhodnutie Michala 29. 10. 2026 (konečné): variant A.**
> - Košík ostáva samostatná stránka: zákazník si v ňom urobí rekapituláciu a môže pridať doplnky a príplatky (dnešná ponuka `lcdKosikDoplnok.js`).
> - Po košíku je **jedna finálna stránka** (krok 2 Shoptetu) so všetkým: osobné údaje, adresa, doprava, platba, súhrn, súhlas, „Objednať“.
> - **Variant B je zamietnutý a nestavia sa.** Ide o náčrt „všetko na jednej stránke vrátane košíka“ (náčrty z 29. 10.: `…/scratchpad/opc/varianty/varianty.html`, § 8 otázka 1b). Nestavia sa ani variant B z § 5 (doprava a platba v košíku).
> - Písomnú otázku podpore Shoptetu (VOP čl. 7.1) Michal zamietol („to je moja vec“). Z plánu je vyškrtnutá (§ 5, § 7.8 F2, § 8 otázka 4, § 10.5).
> - Nič nejde naživo bez Michalovho súhlasu. Najprv živý test len pre Michala (`?opc=1`), až potom zákazníci (§ 10.5).

> **Rozhodnutia Michala 29. 10. 2026 (popoludnie), podrobne § 10.8:**
> - **Termín doručenia bez dátumov:** „Doručenie do 21–29 dní“, kamióny 14–25 dní (CZ „Doručení do 21–29 dnů“). Pri vzorkách a poukážke termín nie je (§ 8 otázka 2 → b).
> - **Právne vety: „použi, čo už máme vo VOP“.** Záloha pri dobierke podľa VOP bod 4.13 (50 %), tovar na mieru podľa VOP bod 6.13, spôsoby platby v záchrane podľa VOP bod 4.5, každá veta s odkazom na obchodné podmienky (§ 8 otázka 3 → a so znením VOP).
> - **Rýchla platba cez banku (len SK)** ostáva ako riadok s odkazom „Vybrať banku“ (§ 8 otázka 6, doplnok).
> - **„Objednať“ stále viditeľné a klik na chýbajúce pole:** lišta dole „Celkom … | Objednať s povinnosťou platby“ (PC: karta nad súhrnom, keď tlačidlo nevidno). Klik pri chýbajúcom alebo zlom poli posunie na prvé také pole, zvýrazní ho červeným a dá doň kurzor; ďalší klik → ďalšie pole (§ 6.4).
> - Vzhľad („doladiť nášmu e-shopu, kompaktne, menej scrollovania“) Michal ešte vyberá z návrhov; správanie vyššie od neho nezávisí.

Podklady: päť línií prieskumu v `C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/` (`shoptet-moznosti`, `sucasna-pokladna`, `kod-kosika`, `osvedcene-postupy`, `konkurencia`) a jeden doplnkový test pre túto knihu (§ 4.5).

---

## Obsah

1. [Hlavička](#one-page-checkout-lcd--kniha-v01)
2. Obsah
3. [Úvod – problém, pre koho, čo je „hotovo“](#3-úvod)
4. [Čo už existuje](#4-čo-už-existuje)
5. [Tri varianty riešenia a odporúčanie](#5-tri-varianty-riešenia)
6. [Jadro odporúčaného variantu A](#6-jadro-odporúčaného-variantu-a)
7. [Prototyp mimo e-shopu a cesta naživo](#7-prototyp-mimo-e-shopu)
8. [Otvorené otázky pre Michala](#8-otvorené-otázky-pre-michala)
9. [Záver](#9-záver)
10. [Stav prototypu](#10-stav-prototypu-29-10-2026)
11. [Živý dôkaz 28./29. 10. 2026](#11-živý-dôkaz-2829-10-2026)

---

## 3. Úvod

### 3.1 Problém: dnešná pokladňa

✅ Zachytené 28. 10. 2026 na SK aj CZ, na telefóne (390×844) aj na PC (1366×768). Objednávka sa neodoslala. Zdroj: `sucasna-pokladna/*/tok.json`, https://www.luxurycardesign.sk/objednavka/krok-1/, https://www.luxurycardesign.cz/objednavka/krok-1/

| | SK | CZ |
|---|---|---|
| Obrazovky | 3: `/kosik/` → `/objednavka/krok-1/` („Doprava & platba“) → `/objednavka/krok-2/` („Informácie o Vás“ + súhrn + odoslanie) | rovnako |
| Samostatný krok so súhrnom | nie je, súhrn je na kroku 2 | nie je |
| Doprava | 1, predvolená: Expres kurier DPD 5 € (`shippingId 96`) | 1, predvolená: Expres Kurýr 150 Kč (`111`) |
| Platby | 6: Prevodom (predvolená), Dobierkou 3 €, karta, Apple Pay, Google Pay, Rýchla platba cez banku | 5: Převodem (predvolená), Dobírka 50 Kč, karta, Apple Pay, Google Pay |
| Kliky od košíka po odoslanie (minimum) | 4: Pokračovať, Pokračovať, súhlas, Objednať | 4 |
| Povinné textové polia | 7: meno a priezvisko, e-mail, telefón, ulica, číslo domu, mesto, PSČ | 7 |
| Plné načítania stránky pred odoslaním | 2 (krok-1, krok-2) | 2 |
| Zmena platby na kroku s údajmi | nedá sa, treba sa vrátiť na krok 1 | nedá sa |

Krok 1 dnes nič nerieši. Doprava je jediná a predvolená, prevod je predvolený, takže väčšina zákazníkov len klikne „Pokračovať“ a čaká na načítanie ďalšej stránky. Na kroku 2 zákazník vidí súhrn s platbou, ale zmeniť ju tam nemôže.

Čo hovorí prieskum (línia `osvedcene-postupy`):
- ✅ Priemerne sa opustí 70,22 % košíkov. Dôvody pri pokladni: extra náklady 40 %, dlhý alebo zložitý checkout 17 %, celková cena nie je vidieť vopred 12 %. https://baymard.com/lists/cart-abandonment-rate
- ✅ Priemerná pokladňa má 11,3 poľa, väčšine webov stačí 8. https://baymard.com/research-articles/checkout-flow-average-form-fields. LCD so 7 povinnými poľami je pod touto hranicou, takže veľa sa na poliach neušetrí.
- ✅ Jedna stránka sama o sebe konverziu nezvýši. Rozhoduje, čo zákazník musí na stránke urobiť. https://baymard.com/blog/one-page-checkout
- 🟡 Shopify uvádza +3,5 % a +7 % po prechode na one page. Sú to čísla od predajcu. https://www.shopify.com/case-studies/stellar-eats

Čo z toho vyplýva: hlavný prínos je, že zákazník uvidí adresu, dopravu, platbu, súhrn aj celkovú sumu naraz a platbu zmení bez návratu. Ubudne 1 klik a 1 načítanie stránky. Konkrétne % zlepšenia nesľubujeme, zmeriame ho (§ 6.12).

### 3.2 Pre koho

- **Zákazník SK a CZ** na telefóne aj na PC. ❓ Podiel telefónov v pokladni som neoveroval. Pred stavbou ho treba vytiahnuť z GA4 (SK 356219817, CZ 383485750).
- **Michal:** rozhoduje o otázkach v § 8 a robí živý test (odošle objednávku sám).
- **Výroba a Ján Kučera:** export číta poznámku objednávky (`#remark`) a skryté polia `varchar1–3`. Ich formát sa nesmie zmeniť.
- **Session „Shoptet úpravy“:** zdieľa SK sha bundla a spoločný kód. Nasadenie sa s ňou musí zladiť.

### 3.3 Čo znamená „hotovo“

1. Po kliknutí na „Pokračovať“ v košíku je celá objednávka na **jednej stránke**: údaje, doprava, platba, súhrn, súhlas a tlačidlo. Kliky klesnú zo 4 na 3 a načítania pred odoslaním z 2 na 1, na SK aj CZ.
2. Platba sa dá zmeniť na tej istej stránke. Súhrn a „Celkom k úhrade“ sa prepočítajú do 1 s a súhlasia so serverom.
3. Objednávka sa **odosiela výhradne pôvodným formulárom Shoptetu** (`POST /action/orderingProcess/Step2Validate/`, normálne odoslanie stránky). Nepoužíva sa vlastný backend, API objednávok ani fetch na Step2Validate.
4. Bez zmeny zostáva: poznámka `#remark` (`model: …` alebo blok kamióna), `varchar1–3`, „+ záloha“ pri dobierke, prevod ako predvolená platba, povinné číslo domu, tichá Luxia, žiadne „s DPH / bez DPH“ a podpis Shoptetu.
5. Zákonné náležitosti platia (§ 6.10): text tlačidla, cena vrátane dopravy tesne pred tlačidlom, súhlas a žiadne predzaškrtnuté platené doplnky.
6. Prototyp prejde všetkými scenármi v § 7.6 mimo e-shopu, potom live-read testom (bez objednávky) a nakoniec živým testom s Michalom.
7. Keď hocičo zlyhá, stránka sa vráti k dnešnému toku (odkaz na krok 1). Vypnúť sa dá bez nasadenia (`data.json` `"opc": false`).
8. Meranie beží (dataLayer `lcd_opc_*`, lievik v GA4) a po 2–4 týždňoch je porovnanie s obdobím pred spustením.

---

## 4. Čo už existuje

### 4.1 Natívne v Shoptete

| Možnosť | Stav | Zdroj |
|---|---|---|
| Vlastný one page checkout Shoptetu | ✅ neexistuje. Nastavenia objednávky obsahujú len min. cenu, históriu, rozšírenú objednávku, kompletáciu, ostatné náklady, doplňujúce informácie a odstúpenie | https://podpora.shoptet.cz/ostatni-nastaveni-objednavky/ |
| Šablóna LCD | ✅ Classic (`11-one`, `body.template-11`), SK aj CZ | zdrojový HTML https://www.luxurycardesign.sk/ a https://www.luxurycardesign.cz/ |
| Prázdna šablóna (vlastné JS/CSS aj funkčnosť) | ✅ len tarif Premium | https://developers.shoptet.com/shoptet-tools/editing-templates/blank-template-mode/ |
| HTML kódy (záhlavie/päta) | ✅ bežia na `/kosik/` aj na oboch krokoch, náš bundle `luxuryCar.js` v/6197fc5 je tam na SK aj CZ. Limit je 8 192 znakov na sekciu | `sucasna-pokladna/*-skripty.json`; https://developers.shoptet.com/shoptet-tools/editing-templates/things-to-be-careful-about/ |
| Zdokumentované JS nástroje | ✅ `shoptet.cartShared.addToCart`, Developers Tools (eventy, callbacky). Endpointy `/action/orderingProcess/*` zdokumentované nie sú | https://developers.shoptet.com/shoptet-tools/editing-templates/shoptet-developers-tools/ |
| API objednávok `POST /api/orders` | ✅ slúži na import, ceny posiela volajúci. Private API je len pre Premium, inak len partner doplnky. „The API is not intended for editing the e-shop frontend.“ | https://developers.shoptet.com/api/documentation/creating-order/ ; https://developers.shoptet.com/api/documentation/basic-information-about-api/ |
| CSRF | ✅ mechanizmus existuje, na LCD je `shoptet.csrf.enabled = false`. POST bez tokenu prechádza | inline config https://www.luxurycardesign.sk/kosik/ |

### 4.2 Doplnky z marketplace (ceny z CZ katalógu)

✅ Žiadny doplnok nespája košík, dopravu, platbu a údaje na jednu stránku. Hľadané výrazy: objednávka, košík, checkout, pokladna, rychlá, krok, dokončení, objednávkový proces. Zdroj: https://doplnky.shoptet.cz/hledani?q=…

| Doplnok | Čo robí | Cena | Pre LCD |
|---|---|---|---|
| Rozšířená objednávka | popup po pridaní do košíka | zdarma od Business, inak 50 Kč/mes. | nie je to checkout |
| Doplňkový prodej v košíku | doplnky v košíku | 200 Kč/mes. | už máme `lcdKosikDoplnok.js` |
| Upsell a cross sell | navýšenie objednávky | 490 Kč/mes. | nie je to checkout |
| Šablona Sniper ONE | šablóna na Classic | 4 490 Kč jednorazovo | stále viac krokov |
| Foxentry | našepkávač a kontrola adries a e-mailov | od 349 Kč | skráti vypĺňanie, voliteľné neskôr |
| Smartform | našepkávač adries | 396 Kč/mes. | to isté |
| Doplnění údajů po zadání IČO | firma podľa IČO | ❓ | len B2B |

❓ Kompatibilitu Foxentry a Smartform so šablónou Classic som neoveroval.

### 4.3 Ako to riešia iné e-shopy (línia `konkurencia`, snímky v `opc/konkurencia/`)

| E-shop | Platforma | Kroky | Čo prevziať / čo nie |
|---|---|---|---|
| autorohoze.sk | Shoptet | 3 | ✅ Nepovolené kombinácie dopravy a platby sú sivé s vysvetlením. Neprevziať: na mobile začína doprava až pod prvou obrazovkou |
| bohempia.com | Shoptet + vlastné CSS + doplnok cartupsell | 3 | ✅ Dôkaz, že kroky Shoptetu sa dajú vizuálne vyladiť (logá dopravcov, súhrn vpravo, „Doručení možné do“) |
| greendrive-accessories.com/sk | PrestaShop | 1 URL, akordeón so 4 sekciami | Prevziať: hlavičku len s logom. Neprevziať: dopravu skrytú až do vyplnenia údajov a „s DPH“ |
| vilgain.cz | vlastná | 3 | ✅ Dátum doručenia pri každej doprave, výdajné miesta v jednej voľbe |
| vasky.cz | Shopify | 1 (skutočne jedna stránka) | ✅ Poradie Kontakt → Doručenie → Doprava → Platba → Fakturačná = dodacia → Dokončiť. Na mobile zbalený súhrn hore so sumou |

✅ Shoptet e-shop so skutočnou jednokrokovou pokladňou sa nenašiel (autorohoze.sk aj bohempia.com majú `/kosik/` → `krok-1` → `krok-2`).

### 4.4 Náš kód v pokladni (línia `kod-kosika`, repo `C:/Users/M/Desktop/spt-luxuryCar-cz`, len čítané)

- ✅ V košíku a objednávke robíme 14 úprav. Tri z nich sú kritické pre výrobu:
  1. poznámka `#remark` cez `shoptet.custom.postSuccessfulValidation` (`main.js` r. 1302–1361),
  2. skryté `varchar1–3` (volant, sedadlá, dvere; `cart.js` r. 40–61),
  3. ponuka k setu `lcdKosikDoplnok.js` (výmena riadkov košíka cez `/action/Cart/*` a potom reload).
- ✅ Predvolený prevod a povinné číslo domu v repe nie sú. 🟡 Sú to nastavenia v admine (admin som neotváral).
- ✅ „+ záloha“ pri dobierke robí `lcdDobierkaZaloha` (`cart.js` r. 71–88, CSS `input:checked + label`).
- ✅ Testy: `test-kosik-doplnok` 89 OK, `test-kosik-rozpis` 12 OK, `test-auto-pamat` 8 OK. `test-kamion-kosik` a `test-auto-vyber` (#remark) sa nespustili, lebo v `node_modules` je esbuild pre darwin-arm64.
- ⚠️ Riziko pre one page: `cart.js` volá `location.reload()` po každom `ShoptetCartUpdated` a ponuka k setu po výmene. Na stránke s formulárom by reload zmazal vypísané údaje.

### 4.5 Overené pre túto knihu (28. 10. 2026, ~23:00)

Test cez curl v anonymnej session. Do košíka som pridal vzorkovník za 5 € (productId 637), na konci som košík vyprázdnil (overené „je prázdny“, `krok-1` → 302 `/kosik/`) a cookies zmazal. Objednávku ani údaje som neodoslal. Uložené HTML (CSRF tokeny začiernené) je v `C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/kniha/test-krok2/`.

| Test | Výsledok |
|---|---|
| `GET /objednavka/krok-2/` s košíkom, ale **bez** Step1Validate | ✅ **302 → `/objednavka/krok-1/`**. Pred príchodom na jednostránkovú pokladňu sa teda musí poslať Step1Validate |
| `POST /action/orderingProcess/Step1Validate/` (XHR, `language=sk&shippingId=96&billingId=5`) | ✅ `{"code":303,"payload":{"returnUrl":".../objednavka/krok-2/"}}` za 0,17 s |
| `GET /objednavka/krok-1/` | ✅ 200, 101 kB, 0,49 s (čas servera z PC, bez vykreslenia) |
| `GET /objednavka/krok-2/` po Step1Validate | ✅ 200, 459 kB, 0,26 s |
| Tlačidlo na kroku 2 | ✅ `button#submit-order` = `<span>Objednať</span><span>s povinnosťou platby</span>` |
| Poradie v DOM kroku 2 | ✅ `#order-form` → … → `#remark` → `#checkoutSidebar` (súhrn) → `consents[]` → `#submit-order`. Súhrn je tesne nad súhlasom a tlačidlom |
| Rádiá na kroku 1 (SK) | ✅ `shippingId-96` (`data-relations="5,3,103,106,109,112"`, checked), `billingId-5` `data-payment-type="transfer"` checked, `billingId-3` `cashOnDelivery`, `103/106/109/112` `shoptetpay` |

---

## 5. Tri varianty riešenia

Spoločné pre všetky varianty: košík zostáva samostatnou stránkou so zeleným „Pokračovať“ a zlatými doplnkami pod ním (rozhodnutie z 8. 10.). Zlúčenie košíka je otázka 1 v § 8.

✅ **Rozhodnuté 29. 10. 2026 (Michal): variant A.** Košík samostatne, potom jedna finálna stránka. Zlúčenie košíka (§ 8 otázka 1b) aj variant B nižšie sa nestavajú.

### Variant A – jedna stránka zložená z krokov Shoptetu (odporúčaný, ✅ zvolený 29. 10.)

**Ako funguje technicky**
- **Stránka:** jednostránková pokladňa je skutočná stránka Shoptetu `/objednavka/krok-2/`. Má natívny formulár `#order-form` (Step2Validate), súhrn `#checkoutSidebar`, súhlas aj tlačidlo. Adresa sa nemení, takže platí tichá Luxia (`&ticho=1` na `/objednavka/`), `body.ordering-process` aj `id--17` a hook `postSuccessfulValidation` funguje ďalej.
- **Prechod z košíka:** náš JS si na košíku na pozadí stiahne `GET /objednavka/krok-1/` a z neho vyčíta voľby (predvolené alebo naposledy zvolené). Po kliknutí na „Pokračovať“ (aj v lište dole) pošle `Step1Validate` cez XHR. Pri odpovedi 303 prejde na `/objednavka/krok-2/`. Ak XHR zlyhá, odkaz ide normálne na `/objednavka/krok-1/`, teda dnešný tok.
- **Na kroku 2:** náš JS stiahne `GET /objednavka/krok-1/` a cez `DOMParser` z neho vezme rádiá dopravy a platby (`data-relations`, `data-payment-type`, `data-*-price-*`, názvy, popisy). Vykreslí z nich sekciu „Doprava a platba“ medzi adresu a poznámku.
  - Rádiá dostanú atribút `form="lcd-opc-nic"` (prázdny pomocný formulár). Nepošlú sa teda so Step2Validate, ale zoskupenie podľa `name` funguje. 🟡 Overiť testom S16.
- **Zmena platby:**
  1. lokálny prepočet súhrnu z `data-*-price` (ako `checkout-3g.js`),
  2. `Step1Validate` cez XHR, ktorý uloží voľbu do session Shoptetu,
  3. potvrdenie súhrnu zo servera cez to isté volanie, ktoré robí Shoptet (`step2CustomerAjax`). ❓ Formát jeho odpovede je neoverený (HAR nemá telá), náhradou je `GET krok-2` a výmena `#checkoutSidebar`.
  - Kým voľba nie je potvrdená, tlačidlo „Objednať“ čaká (§ 6.5).
- **Odoslanie objednávky:** natívne tlačidlo `#submit-order` a natívny POST Step2Validate (celá stránka). Validáciu, vytvorenie objednávky, e-maily, Shoptet Pay aj stránku po objednávke rieši Shoptet. Platba sa berie zo session, kam ju uložil Step1Validate. ✅ Overené na SK: po XHR prepnutí na dobierku ukázal krok 2 „Dobierkou €3, celkom €205“ (`shoptet-moznosti`).

**Plusy**
- Je to skutočne jedna stránka po košíku: 3 kliky, 1 načítanie. Platbu aj súhrn zákazník vidí a mení na jednom mieste.
- Objednávka ide 100 % cez Shoptet. Nemení sa cenotvorba, kupóny, Shoptet Pay, e-maily ani Jánov export.
- Všetkých 14 dnešných úprav funguje ďalej, lebo stránka zostáva `krok-2` (kotvy `#order-form`, `#remark`, `.co-billing-address`, `id--17`).
- Dodržiava rozhodnutie z 8. 10.: doprava sa v košíku vopred neukazuje.
- Má záchranu: pri chybe sa zobrazí dnešný krok 2 s odkazom na krok 1.

**Mínusy**
- Závisí od nezdokumentovaného `Step1Validate` a od HTML štruktúry kroku 1. Po aktualizácii Shoptetu sa môže rozbiť, preto je potrebná automatická kontrola (§ 7.8).
- Pri platbách Shoptet Pay (rýchla platba cez banku s výberom banky `shoptetPayPisCode`, viditeľnosť Apple Pay) treba v našej sekcii zopakovať logiku, ktorú dnes robí `checkout-3g.js` na kroku 1.
- Na každú zmenu platby idú 1–2 požiadavky navyše (VOP čl. 11.4: zanedbateľné, ale s debounce a max. 1 súbežnou).

**Riziká**

| Oblasť | Riziko | Opatrenie |
|---|---|---|
| Platby | vybraná platba v UI ≠ platba v session → objednávka s inou platbou | tlačidlo zablokované, kým posledný Step1Validate nevráti 303 a súhrn nepotvrdí názov platby; pred odoslaním kontrola zhody |
| Shoptet Pay | ❓ krok 1 volá `getShoptetPayStatus` a `getBankProviderData`, krok 2 nie. Či platba kartou funguje aj bez nich, je neoverené | test F4 (§ 7.8) s kartou; rýchla platba v1 cez záchranný odkaz (otázka 6) |
| Výdajné miesta | dnes nie sú. Widget Packety žije v `checkout-3g.js` na kroku 1 | v1 nerieši; ak pribudnú, takáto doprava pošle zákazníka na krok 1 (§ 6.6) |
| Validácia | osobné údaje validuje natívne `shoptet.validator`, to sa nemení. ❓ Ako Step2Validate vracia chyby zo servera (znova načítaný krok 2?) | po každom načítaní kroku 2 sa sekcia postaví znova; overiť v F4 |
| Aktualizácie Shoptetu | zmena HTML kroku 1 alebo odpovede Step1Validate | parser je fail-closed (nesedí = záchrana), denná kontrola live-read, VOP čl. 4.5 (individuálne úpravy) |
| VOP 07/2026 | čl. 7.1: úpravy len cez API alebo „výslovně zpřístupněné nástroje“. Volanie `/action/orderingProcess/*` z nášho JS je sivá zóna. Posielame tú istú požiadavku, akú pošle formulár Shoptetu na kroku 1, len na pozadí. Čl. 11.3: podpis Shoptetu sa nemení. Pokuta 100 000 Kč za porušenie čl. 11 | ~~pred spustením sa písomne spýtať podpory Shoptetu (otázka 4)~~ vyškrtnuté 29. 10.: Michal otázku zamietol („to je moja vec“), rozhodnutie o riziku čl. 7.1 je jeho. Čl. 11 nie je dotknutý, kým sa nečíta ani neupravuje kód Shoptetu (fixtures s kópiami Shoptetu sú mimo gitu, `tools/test-opc/FIXTURES.md`) |
| CSRF | ak Shoptet zapne CSRF, XHR bez tokenu zlyhá | posielať `__csrf__` zo `shoptet.csrf.token`, ako to robí `lcdKosikDoplnok.js`; test S15 |

**Náročnosť:** 🟡 odhad 4–6 pracovných dní: prototyp a testy 2–3 dni, live-read a úpravy 1 deň, živý test, CZ a nasadenie 1–2 dni. Novej logiky je ~500–800 riadkov JS + SCSS.

**Čo z dnešných úprav sa zachová:** všetko. Bez zmeny ostáva `#remark`, `varchar1–3`, rozpis položiek, kamión, autoPamat, panel a ponuka k setu (tá je v košíku). Treba doplniť toto:
- `lcdDobierkaZaloha` musí pracovať aj nad našou sekciou platieb (rovnaké poradie `input` → `label`),
- `lcdBublinaMimoTlacidla` treba rozšíriť o `#submit-order`,
- `listaKosika` a „Pokračovať“ v košíku treba presmerovať cez Step1Validate,
- lištu krokov `ol.cart-header` treba zmeniť na 2 kroky.

### Variant B – zjednodušenie bez zmeny mechaniky

⛔ **Zamietnuté 29. 10. 2026 (Michal), nestavia sa.** Michal zvolil variant A. Zamietol aj náčrt „všetko na jednej stránke vrátane košíka“ (§ 8 otázka 1b). Popis nižšie ostáva len pre úplnosť.

**Ako funguje technicky**
- **Stránka 1 = košík + doprava a platba:** pod položkami košíka sa ukáže sekcia doprava a platba. Dáta sú z `GET /objednavka/krok-1/` na pozadí, rovnako ako v A. „Pokračovať“ pošle Step1Validate cez XHR so zvolenou platbou a prejde na krok 2.
- **Stránka 2 = dnešný krok 2 bez zásahu:** údaje, súhrn, súhlas a odoslanie natívne. Krok 1 sa preskočí.
- **Odoslanie:** natívny Step2Validate.

**Plusy**
- Formulár s údajmi a odoslaním je úplne natívny, takže tam je najmenšie riziko.
- Rovnaký počet klikov a načítaní ako A (3 kliky, 1 načítanie pred odoslaním).
- Menej kódu na kroku 2.

**Mínusy**
- ⛔ Ide proti rozhodnutiu z 8. 10. („doprava sa v košíku neukazuje vopred“).
- Nie je to jedna stránka. Platbu nevidno pri súhrne a zmeniť sa dá len návratom do košíka.
- Košík je už teraz plný (ponuka k setu, lišta). Reload po výmene doplnku by zmazal výber platby, preto by sa musel ukladať do sessionStorage.

**Riziká:** rovnaké ako A pri Step1Validate, VOP 7.1, Shoptet Pay a CSRF. Navyše hrozí strata voľby platby pri reloade košíka.

**Náročnosť:** 🟡 2–4 pracovné dni.

**Čo sa zachová:** všetko na kroku 2. V košíku treba zladiť ponuku k setu a lištu s novou sekciou.

### Variant C – natívne alebo doplnok Shoptetu

**Ako funguje:** podľa toho, čo Shoptet ponúka.
- **C1 Počkať / požiadať Shoptet:** natívny one page checkout neexistuje. Môžeme poslať požiadavku na funkciu, termín je neznámy.
- **C2 Premium:** prázdna šablóna alebo Private API. ❓ Cenu Premium som neoveroval. Celý frontend by sa robil nanovo.
- **C3 Partner doplnok cez API** (napr. cez Jána Kučeru, 🟡 ak má partnerský prístup): `POST /api/orders` je na import. Obchádza cenotvorbu, kupóny aj Shoptet Pay a podľa Shoptetu nie je určený na frontend.
- **C4 Vizuálne doplnky:** Foxentry (od 349 Kč) alebo Smartform (396 Kč/mes.) skrátia písanie adresy. Sniper ONE (4 490 Kč) zmení vzhľad, kroky ostanú.

**Plusy:** C1 a C4 sú bez rizika voči VOP a bez údržby nášho kódu.

**Mínusy:** ani jedna možnosť nedá jednu stránku na Basicu. C2 a C3 sú drahé a rizikové (obchádzajú Shoptet Pay a ceny).

**Riziká:** C3 môže priniesť objednávky s nesprávnou cenou alebo bez platby. C2 je zmena tarifu.

**Náročnosť:** C4 0,5 dňa + poplatok. C2 a C3 týždne.

**Čo sa zachová:** pri C1 a C4 všetko. Pri C2 a C3 by sa všetko písalo nanovo.

### Porovnanie

| | A | B | C (C4) |
|---|---|---|---|
| Obrazovky po košíku | **1** | 1 (platba je v košíku) | 2 (ako dnes) |
| Kliky košík → odoslanie | **3** | 3 | 4 |
| Načítania pred odoslaním | **1** | 1 | 2 |
| Zmena platby pri súhrne | **áno** | nie (návrat do košíka) | nie |
| Odoslanie cez natívny Step2Validate | áno | áno | áno |
| Rozhodnutie z 8. 10. (doprava nie v košíku) | **dodržané** | ⛔ porušené | dodržané |
| Riziko VOP 7.1 | sivá zóna (Step1Validate) | sivá zóna | žiadne |
| Náročnosť | 4–6 dní | 2–4 dni | 0,5 dňa + poplatok |

**Odporúčanie: variant A.** ✅ Michal ho 29. 10. 2026 zvolil, B zamietol.
- Je to jediný variant, ktorý dá skutočne jednu stránku po košíku.
- Objednávka sa pritom stále odosiela pôvodným formulárom Shoptetu, takže ceny, platobná brána, e-maily a Jánov export sa nemenia.
- Stránka zostáva `/objednavka/krok-2/`, takže dnešné úpravy a tichá Luxia fungujú bez prepisovania.
- Dodržiava rozhodnutie z 8. 10.
- Pri chybe sa vráti k dnešnému toku.
- ~~B je záložný plán, ak by sa sekcia platieb na kroku 2 ukázala nestabilná.~~ B je od 29. 10. zamietnutý. Ak by sekcia platieb na kroku 2 bola nestabilná, záložný plán je záchrana: dnešný krok 2 s odkazom na krok 1 (§ 6.5 bod 7). C4 (našepkávač adries) sa dá pridať neskôr nezávisle.

---

## 6. Jadro odporúčaného variantu A

### 6.1 Tok a adresy

```
/kosik/  (bez zmeny: položky, ponuka k setu, zelené „Pokračovať“, zlaté doplnky pod ním)
   │  klik „Pokračovať“ (aj lišta dole)
   │  → XHR Step1Validate (doprava + platba: posledná voľba, inak predvolená zo Shoptetu)
   │  → 303 → location = /objednavka/krok-2/
   │  (zlyhanie → pôvodný odkaz /objednavka/krok-1/ = dnešný tok)
   ▼
/objednavka/krok-2/  = JEDNOSTRÁNKOVÁ POKLADŇA (natívny formulár + naša sekcia „Doprava a platba“)
   │  „Objednať s povinnosťou platby“ → natívny POST Step2Validate
   ▼
stránka Shoptetu po objednávke / platobná brána Shoptet Pay (bez zmeny)
```

- Tlačidlo Späť v prehliadači z kroku 2 vedie do košíka, lebo krok 1 sa neotvoril.
- Ak sa zákazník dostane na `/objednavka/krok-1/` priamo (záchrana, starý odkaz), uvidí dnešnú stránku a funguje ako dnes.

### 6.2 Rozloženie na telefóne (< 992 px, jeden stĺpec)

| # | Sekcia | Natívne / naše | Obsah a správanie |
|---|---|---|---|
| 0 | Hlavička | natívne + `lcdHdr` | ako dnes. Lišta krokov sa zmení na „1 Košík · 2 Objednávka“ |
| 1 | Zbalený súhrn | naše | pruh „Vaša objednávka · N položiek · Spolu X €“ ˅. Po rozbalení ukáže položky s rozpisom (§ 6.8). Vzor vasky.cz |
| 2 | Osobné údaje | natívne | meno a priezvisko, e-mail, telefón (+421/+420). „Prihlásiť sa“ ako malý odkaz |
| 3 | Adresa | natívne | ulica, **číslo domu (povinné)**, mesto, PSČ, štát (text). „Objednávam na firmu“ a „Doručiť na inú adresu“ ostávajú ako zaškrtávacie políčka Shoptetu |
| 4 | Doprava | naše (dáta z kroku 1) | karta dopravy s logom, cenou a **termínom doručenia** „Doručenie do 21–29 dní“, kamióny 14–25 (✅ Michal 29. 10.: bez dátumov). Dnes je jediná a predvolená |
| 5 | Platba | naše (dáta z kroku 1) | prevod navrchu a predvolený, potom karta, Apple Pay (len kde je dostupná), Google Pay, (SK) rýchla platba, dobierka. Pri dobierke po výbere „+ záloha“ (§ 6.7) |
| 6 | Poznámka | natívne `#remark` | za odkazom „Pridať poznámku“. **`#remark` musí zostať v DOM a odoslať sa aj skrytá**, lebo do nej píše `toNote` |
| 7 | Súhrn | natívne `#checkoutSidebar` + rozpis | položky s rozpisom konfigurácie, doprava s cenou, platba s cenou, „Celkom k úhrade“. Bez „s DPH“ |
| 8 | Súhlas | natívne `consents[]` | „Odoslaním objednávky súhlasíte s obchodnými podmienkami…“ + Heureka ako dnes. Riadok o tovare na mieru podľa otázky 3 |
| 9 | Tlačidlo | natívne `#submit-order` | „Objednať s povinnosťou platby“, text sa nemení |
| 10 | Lišta dole | naše (z `listaKosika`) | „Celkom X € \| Objednať s povinnosťou platby“ (✅ Michal 29. 10.). Text je text tlačidla Shoptetu (zákonná formulácia), suma je pri ňom. **Klik = klik na `#submit-order`** (tie isté kontroly, odíde práve 1×). Skryje sa, keď je `#submit-order` na obrazovke. Do 29. 10. len „K súhrnu“ (posúvala, neodosielala) |

Pátu Shoptet v pokladni nevypisuje (✅ grep „Vytvoril Shoptet“ = 0 na všetkých krokoch, `sucasna-pokladna`). Nič sa nepridáva ani neskrýva.

### 6.3 Rozloženie na PC (≥ 992 px)

✅ Dnešný krok 2 má dva stĺpce: vľavo formulár, vpravo pás „Potrebujete poradiť?“, zhrnutie, celková suma, súhlas a „Objednať“ (`sucasna-pokladna/sk-pc/3-udaje-zakaznika.png`). Návrh:
- **Vľavo:** Osobné údaje → Adresa → **Doprava** → **Platba** → Poznámka (odkaz) → „Chcem sa registrovať“ ako dnes.
- **Vpravo (lepkavé):** „Potrebujete poradiť?“ → Zhrnutie s rozpisom → Celkom k úhrade → súhlas → Objednať → Späť.
- Zbalený súhrn (sekcia 1) sa na PC nezobrazuje. Bočný panel sleduje obrazovku (Shoptet `fixSidebar`), takže „Objednať“ je takmer vždy na obrazovke. Keď je panel vyšší ako okno (set, kamión) a zákazník je navrchu stránky, ukáže sa lišta ako **karta nad stĺpcom súhrnu** („Celkom | Objednať s povinnosťou platby“, rovnaká šírka ako panel) a zmizne, keď tlačidlo v paneli vidno (✅ S39, Michal 29. 10.). 🟡 Karta môže dočasne zakryť spodok panela (súhlas), kým zákazník neposunie stránku.

### 6.4 Správanie polí

- Osobné údaje a adresa zostávajú natívne. Nemeníme poradie, názvy ani validáciu (`shoptet.validator`, `js-validate-required`, PSČ a telefón podľa krajiny). Autofill prehliadača tak funguje ako dnes.
- ❓ `autocomplete` a `inputmode` na natívnych poliach som neoveroval. Ak chýbajú, náš JS ich doplní (`email`, `tel`, `postal-code`, `address-line1`, `inputmode="numeric"` pre PSČ). Nič iné na poliach nemeníme.
- **Klik na „Objednať“ pri chýbajúcom alebo zlom poli (✅ Michal 29. 10., `assets/js/opc/kontrola.js`):** stránka sa posunie na **prvé** také pole v poradí na stránke (meno, e-mail, telefón, adresa, naša doprava a platba, súhlas), pole dostane červený rám, pod ním červený text a kurzor. Nič neodíde a neoveruje sa so serverom. Zákazník pole vyplní (rám zmizne hneď pri písaní), klikne znova → ďalšie pole, až kým nie je všetko v poriadku. Potom ide odoslanie ako doteraz (kontrola so serverom, zámok, natívny Step2Validate práve 1×).
  - Pravidlá sú Shoptetu: tie isté polia ako jeho validátor (`shoptetFormValidator`), povinné = `required` / `js-validate-required`, chyby formátu (telefón, PSČ, e-mail) hlási Shoptet sám (`js-error-field`) a jeho texty („Zadajte telefónne číslo.“, „Potvrďte svoj súhlas.“). Náš text „Toto pole treba vyplniť.“ len keď Shoptet pre pole text nemá.
  - Overenie telefónu Shoptetu je asynchrónne: telefón, ktorý sa práve overuje, neblokujeme. Ak overenie neprejde, Shoptet ohlási chybu (`ShoptetFailedValidation`) a stránka sa posunie na telefón rovnako (S38).
  - Pole sa posúva na 20 % výšky okna, teda nad lištu a nad klávesnicu telefónu. Ak je už celé na obrazovke, stránka sa nehýbe.
- Na stránke sa **nikdy nevolá reload**. Položky košíka sú tu len na čítanie, upraviť sa dajú cez odkaz „Upraviť košík“ → `/kosik/`. Tým odpadá riziko straty vypísaných údajov. Osobné údaje do sessionStorage neukladáme.
- Honeypot `surname` a skryté polia (`language`, `billCountryId`, `deliveryCountryId`) sa nechajú bez zmeny.

### 6.5 Doprava a platba – mechanika (stavový stroj)

Stavy: `nacitavam` → `potvrdene` ↔ `meni-sa` → (`potvrdene` | `chyba`); a `zachrana`.

1. **Načítanie:** `GET /objednavka/krok-1/` (fetch, same-origin, cookies). Parser (čistá funkcia `krok1Model(html)`) vráti:
   - `doprava[]`: id, názov, cena, `data-relations`, `checked`, výdajné miesto áno/nie,
   - `platby[]`: id, názov, popis, cena, `data-payment-type`, `checked`,
   - hlášku o nepovolenej kombinácii.
   - Keď parser nenájde formulár `Step1Validate` alebo aspoň 1 dopravu a 1 platbu, prejde do `zachrana`.
2. **Vykreslenie:** klon označenia Shoptetu (`input` → `label` → `.shipping-billing-name`), aby fungovalo `lcdDobierkaZaloha` aj CSS. Rádiá majú `form="lcd-opc-nic"`. Nepovolené kombinácie sú sivé s textom Shoptetu („Táto kombinácia dopravy a platby nie je možná“, vzor autorohoze.sk).
3. **Zmena voľby:**
   1. stav `meni-sa`, tlačidlo „Objednať“ dostane `aria-disabled`, pri platbe sa zobrazí „Prepočítavam…“,
   2. lokálny prepočet „Celkom k úhrade“ z `data-*-price`,
   3. po debounce 300 ms XHR `Step1Validate` (`language`, `shippingId`, `billingId`, prípadne `shoptetPayPisCode`, `gopayPayInstrument=""`, pri zapnutom CSRF aj `__csrf__`). Naraz beží najviac 1 požiadavka.
4. **Potvrdenie:** odpoveď `code 303` + obnovený súhrn zo servera obsahuje názov zvolenej platby → `potvrdene`, tlačidlo sa odomkne.
5. **Chyba:** iný kód, sieť alebo nezhoda súhrnu → rádio sa vráti na poslednú potvrdenú voľbu a ukáže sa hláška: „Platbu sa nepodarilo zmeniť. Skúste znova alebo ju zmeňte v [klasickom kroku](/objednavka/krok-1/).“ Stav `chyba`.
6. **Pred odoslaním:** listener `submit` na `#order-form` vo fáze capture. Ak stav nie je `potvrdene`, `preventDefault`, počká sa na dokončenie a potom `form.requestSubmit(#submit-order)`. Potom už beží natívne poradie: validácia Shoptetu → `postSuccessfulValidation` (`toNote`) → POST.
   - 🟡 `toNote` nesmie pri dvojitom spustení zdvojiť „model: …“, overí to test S9.
7. **Záchrana:** sekcia sa nezobrazí. Súhrn Shoptetu ukazuje dopravu a platbu a pod ním je odkaz „Zmeniť dopravu alebo platbu“ → `/objednavka/krok-1/`. Stránka funguje ako dnešný krok 2.
8. **Krajina:** v1 nemení krajinu na stránke. Odkaz Shoptetu ostáva a vedie na krok 1 (`Step1ChooseDelivery`), len jeho text „Môžete zmeniť v predchádzajúcom kroku“ OPC mení na „Zmeniť štát“ / „Změnit zemi“ (revízia 29. 10.: predchádzajúci krok s krajinou zákazník pri OPC nevidel, S36). SK ponúka CZ, FI, DE, PL, SK, CZ ponúka CZ, DE, PL, SK. ❓ Dopravy a ceny pre zahraničie neoverené.

### 6.6 Výdajné miesta

- ✅ Dnes ich na SK ani CZ nie je (jediná doprava DPD / Expres Kurýr).
- **v1:** sa nerieši. Ak Michal neskôr pridá dopravu s výdajným miestom (napr. Packeta), OPC ju zobrazí s tlačidlom „Vybrať miesto“, ktoré pošle zákazníka na klasický krok 1. Widget (`PickupPoint/Search`, `NewGenWidget/Choose`) prenesieme až vo v2.
- Prieskum hovorí, že vo v2 by sa oplatili. ✅ SK: 70 % zásielok ide mimo domov (DPD E-shopper barometer 2025). Poradie by sa potom zmenilo na Kontakt → Doprava → Adresa (adresa len pri kuriérovi).
- ❓ Či sa set kobercov alebo box do kufra zmestí do Z-BOXu a iných boxov, neoverené (rozmery).

### 6.7 Platby

| Platba | SK id | CZ id | v1 v OPC | Poznámka |
|---|---|---|---|---|
| Prevod | 5 (predvolená) | 5 (predvolená) | áno, navrchu | predvoľbu berieme z `checked` v kroku 1 (admin), nie napevno |
| Dobierka | 3, 3 € | 87 (🟡 odvodené vylúčením), 50 Kč | áno | po výbere „+ záloha“ (`lcd-dob-pozn`, sivá, malá) a poučenie podľa VOP bod 4.13 (záloha 50 %, § 10.8) |
| Karta (Shoptet Pay) | 103 | 114 | áno | ❓ funkčnosť brány bez volaní z kroku 1 overí F4 |
| Google Pay | 109 | 120 | áno | |
| Apple Pay | 106 | 117 | áno, len keď `window.ApplePaySession?.canMakePayments()` | 🟡 Shoptet ju na telefóne v Chromiu skryl, na PC ukázal. Pravidlo prehliadača je bezpečnejšie než kópia zo servera |
| Rýchla platba cez banku | 112 | – | riadok s odkazom „Vybrať banku“ (✅ Michal 29. 10.) | potrebuje výber banky (`shoptetPayPisCode`). Predvolená hodnota v požiadavke bola `slovenska_sporitelna_oauth_client_sk`, posielať ju naslepo je zlé. ✅ Pole je vo fixtures mimo formulára Step1Validate (kód dopĺňa widget Shoptet Pay), náš `krok1Model` ho nevidí → OPC pri 112 Step1Validate nikdy nepošle: košík ide na klasický krok 1 (S27), kontrola pred odoslaním na kroku 2 overí len GET krokom 1 (S34) |

- Žiadna platba sa neskrýva bez súhlasu Michala. Ak niečo v OPC nevieme, zobrazí sa s odkazom na klasický krok.
- ⛔ Napätie s rozhodnutím „prevod predvolený“. Na SK je prevod len 9,2 % nákupov, karta 27,6 %, dobierka >43 % (Shoptet cez SITA, 4. 6. 2025, https://sita.sk/vofinanciach/platba-na-dobierku-je-slovenskym-specifikom-skoro-polovicu-kupujucich-neodradi-ani-extra-poplatok/). Prevod ostáva predvolený (legálne, bez poplatku), karta a Apple/Google Pay však musia byť rovnako viditeľné hneď pod ním.

### 6.8 Rekapitulácia konfigurácie produktu

- Súhrn položiek používa existujúce funkcie: `lcdRozpis` / `lcdVrstvy` / `lcdPriplatky` (`functions/kosikRozpis.js`) a „Auto: …“ zo sessionStorage alebo `autoPamat`.
- Rozsah: značka, model, ročník, 1 alebo 2 vrstvy, farba a lemovanie s kódom, rohož do kufra, box, každé s cenou.
- Kamión 640: blok zo `sessionStorage.truckOrderSummary` (`order-summary.mjs`), na celú šírku ako dnes.
- Selektor `LCD_POLOZKA = "tr, …"` je príliš široký. V OPC sa obmedzí na `#checkoutSidebar .cart-item` / položky súhrnu, aby nechytal rádiá dopravy a platby.
- Nad tlačidlom sa nezobrazí žiadny platený doplnok ako predvolený (SK § 5 ods. 2). Doplnky sa ponúkajú len v košíku.
- **Od 29. 10. 2026 (§ 10.9):** v súhrne je pri každej položke malá fotka a zobáčik „Zobraziť detail“. Pod položkou sa rozbalí natívny rozpis z košíka (presunutý, nie kópia), predvolene zbalené.

### 6.9 Chybové stavy

| Situácia | Čo vidí zákazník | Čo urobí kód |
|---|---|---|
| `GET krok-1` zlyhá alebo parser nesedí | dnešný krok 2 + odkaz „Zmeniť dopravu alebo platbu“ | stav `zachrana`, `dataLayer lcd_opc_zachrana` |
| Step1Validate ≠ 303 / sieť | rádio sa vráti, hláška + odkaz na klasický krok | stav `chyba`, max. 1 automatický pokus |
| Súhrn zo servera nesedí s voľbou | „Overujem platbu…“ → hláška | tlačidlo zostane zablokované |
| Klik „Objednať“ počas `meni-sa` | „Čakám na potvrdenie platby…“ (≤ 3 s) | odloží odoslanie, potom `requestSubmit` |
| Chýbajúce alebo zlé pole (napr. číslo domu) | posun na prvé zlé pole, červený rám, text Shoptetu pod ním, kurzor; ďalší klik → ďalšie pole (Michal 29. 10.) | `kontrola.js` pred kontrolou so serverom; chyba, ktorú nájde až Shoptet (telefón po overení), rovnako (`ShoptetFailedValidation`) |
| Chyba zo servera po Step2Validate | ❓ Shoptet znova vykreslí krok 2 s chybami (neoverené) | sekcia sa postaví znova z kroku 1 |
| Prázdny košík alebo vypršaná session | Shoptet presmeruje na `/kosik/` (✅ 302) | nič |
| Dvojklik na „Objednať“ | jedno odoslanie | natívne `sending-order` + náš zámok po prvom odoslaní |
| Výnimka v našom JS | dnešný krok 2 | `try/catch` okolo celého modulu |
| Zlyhá platobná brána | stránka Shoptetu na opakovanie platby | bez zásahu |
| Prebieha výmena doplnku (`lcdDoplnokVymena`) | „Čakám na dokončenie úpravy košíka“ | `zablokujStranku` zaradí `#submit-order` medzi blokované |

### 6.10 Čo sa nesmie zmeniť

1. **Podpis Shoptetu** („Vytvoril/Vytvořil Shoptet“): nič ho neskrýva ani neprekrýva (VOP čl. 11.3, pokuta 100 000 Kč za porušenie čl. 11). V pokladni ho Shoptet nevypisuje, na ostatných stránkach ho necháme bez zásahu.
2. **Tlačidlo** `#submit-order` s textom Shoptetu „Objednať s povinnosťou platby“ / „Objednat s povinností platby“:
   - SK § 17 ods. 4 zák. 108/2024 Z. z. vyžaduje „objednávka s povinnosťou platby“ alebo jednoznačne obdobnú formuláciu. Pri porušení zákazníkovi nevzniknú záväzky (ods. 6).
   - CZ § 1826a OZ vyžaduje „Objednávka zavazující k platbě“ alebo zodpovedajúcu formuláciu, inak je zmluva neplatná, ak sa jej spotrebiteľ dovolá.
   - Zdroje: https://www.zakonypreludi.sk/print/zz/2024-108/znenie-20260619.htm, https://www.zakonyprolidi.cz/cs/2012-89.
   - Lišta dole nesie ten istý text („Objednať s povinnosťou platby“, prevzatý z tlačidla) a pri ňom sumu, klik je klik na natívne tlačidlo (✅ Michal 29. 10.). Do 29. 10. lišta neodosielala, lebo mala iný text („K súhrnu“).
3. **Súhlas** `consents[]` (value 9) a jeho text sa nemenia.
4. **Cena vrátane dopravy a poplatkov tesne pred tlačidlom** (SK § 17 ods. 3, CZ § 1826a ods. 1). Súhrn je hneď nad súhlasom a tlačidlom (✅ dnes je to tak).
5. **Spôsoby platby sú viditeľné najneskôr na začiatku objednávky** (SK § 17 ods. 2). Sekcia platby je na tej istej stránke. V záchrane (sekcia sa nenačíta) je pod odkazom „Zmeniť dopravu alebo platbu“ zoznam spôsobov platby podľa VOP bod 4.5 (✅ Michal 29. 10.).
6. **Žiadne predzaškrtnuté platené doplnky** (SK § 5 ods. 2). Newsletter nikdy predzaškrtnutý.
7. **`#remark`**: formát `model: …` a blok `[KONFIGURÁCIA KAMIÓNA]` / `[KONFIGURACE KAMIONU]` číta Jánov export.
8. **`varchar1–3`**: názvy a hodnoty 1 : 1 (pri čisto kamiónovom košíku sa nevkladajú).
9. **Odoslanie len natívnym POST Step2Validate.** Žiadny fetch, API ani vlastný backend.
10. **Bez „s DPH / bez DPH“** (LCD nie je platca DPH).
11. **Adresa pod `/objednavka/`** (tichá Luxia).
12. **Predvolený prevod a povinné číslo domu** berieme zo Shoptetu (admin), nenahrádzame ich vlastnou logikou.

### 6.11 Rozdiely SK / CZ

| | SK | CZ | Zdroj |
|---|---|---|---|
| Doprava | Expres kurier DPD 5 €, id 96 | Expres Kurýr 150 Kč, id 111 | ✅ `tok.json` |
| Platby (id) | 5, 3, 103, 106, 109, 112 | 5, 87, 114, 117, 120 | ✅ `data-relations` |
| Dobierka | 3 € | 50 Kč | ✅ |
| Rýchla platba cez banku | áno (112) | nie | ✅ |
| Text tlačidla | Objednať s povinnosťou platby | Objednat s povinností platby | ✅ |
| `language` v Step1Validate | `sk` | 🟡 `cs` (overiť v live-read) | |
| PSČ (vzor Shoptetu) | `^[0\|8\|9]\d{2}\s*\d{2}$` | `^[1-7]\d{2}\s*\d{2}$` | ✅ |
| IČO | 8 alebo 12 číslic | 8 číslic | ✅ |
| Predvoľba telefónu | +421 | +420 | ✅ |
| Krajiny doručenia | CZ, FI, DE, PL, SK | CZ, DE, PL, SK | ✅ |
| projectId | 562035 | 581408 | ✅ `kod-kosika` |
| Blok kamióna v poznámke | `[KONFIGURÁCIA KAMIÓNA]` | `[KONFIGURACE KAMIONU]` | ✅ |
| Zákon | 108/2024 Z. z. | 89/2012 Sb. (OZ) | ✅ |
| Texty OPC | SK | CZ (mapa segmentov ako pri 1V) | 🟡 |

### 6.12 Meranie

- `dataLayer` udalosti: `lcd_opc_zobrazenie`, `lcd_opc_zmena_platby` (id), `lcd_opc_chyba` (typ), `lcd_opc_zachrana`, `lcd_opc_odoslanie`, `lcd_opc_platba` (len keď sa add_payment_info nedá poslať).
- GA4 udalosti, ktoré by inak chýbali (begin_checkout pri preskočenom kroku 1, add_payment_info pri zmene platby), posiela `opc/analytika.js` (§ 10.6).
- Pred spustením zmerať východisko: lievik GA4 `begin_checkout` → `add_shipping_info` → `add_payment_info` → `purchase` za posledné 4 týždne (SK 356219817, CZ 383485750). ~~❓ Či Shoptet tieto udalosti posiela, neoverené.~~ ✅ Overené živo 29. 10. (T9a, § 11): krok 1 posiela `begin_checkout`, krok 2 pri načítaní `add_payment_info`, `add_shipping_info` a `checkout_progress` (natívne aj po OPC rovnako). `purchase` sa netestoval, objednávka neodišla.
- Po spustení porovnať 2–4 týždne. Pri nízkom počte objednávok výsledok neberieme ako štatisticky istý.

### 6.13 Nálezy mimo rozsahu (OPC ich neopravuje, posunúť do session „Shoptet úpravy“)

1. `varchar1–3` dostanú reťazec „null“, keď sessionStorage nemá polohy (nová karta, iPhone). 🟡 Dopad na objednávku treba overiť na hotovej objednávke (`cart.js` r. 44–61).
2. Neuzavretá úvodzovka v `class` polí `varchar` (`cart.js`).
3. CZ pokladňa ukazuje v páse „Potřebujete pomoc?“ slovenské číslo +421 903 660 720 (✅ `cz-pc/tok.json`).
4. CZ vzorkovník: „Ano +99 Kč“ na produkte, ale 100 Kč v košíku (🟡 zaokrúhľovanie Shoptetu).
5. Lokálna vetva `main` v repe je stará (6. 10.), živý kód je `origin/main`.
6. Kontrast šablóny na finálnej stránke (revízia 29. 10., bez vplyvu OPC): zlaté texty na bielom 2,6 : 1 (odkazy na obchodné podmienky, „predchádzajúcom kroku“, ceny v súhrne), box „Potrebujete poradiť? +421…“ biely text na zlatej. Návrh: na text tmavšie zlaté (napr. `#8f7020`, v OPC `--o-gold-lo`).
7. Rozpis kamióna v súhrne kroku 2 má na PC a tablete (od 768 px) písmo 12,5 px aj bez `?opc=1` (revízia 29. 10.). Návrh: aspoň 14 px.
8. Mimo OPC aj mimo „Shoptet úpravy“: v gite sú 2 Google API kľúče prehliadača (`assets/js/lcd-videos.js` r. 29, `dist/bundle.js` Places API), už v `origin/main` a na GitHube (commity 2ad466a, 96a9c27). Takéto kľúče idú aj do klienta; v Google Cloud treba overiť obmedzenie na HTTP referrer (luxurycardesign.sk/.cz) a len potrebné API. Rotovať len ak obmedzenie chýba.

---

## 7. Prototyp mimo e-shopu

### 7.1 Princíp

Prototyp beží v Chrome bez okna cez CDP, rovnako ako `tools/test-1v/*.mjs` (`cdp.mjs`: `spustiChrome`, `novaKarta`, `Fetch.requestPaused`). Stránky majú skutočné adresy `https://www.luxurycardesign.sk/...`, ale **odpovede dávame z uložených súborov**. Do Shoptetu tak neodíde nič. Odoslanie objednávky test zachytí, zapíše a zruší.

Dva režimy:
- **offline (predvolený):** všetko z `www.luxurycardesign.*` ide z fixtures. Je to deterministické, beží pri každej zmene kódu a obsahuje len vymyslené testovacie údaje.
- **live-read (ručne, pred nasadením a denne po ňom):** skutočný web, v košíku vzorkovník, povolené sú len GET, `/action/Cart/*` a `Step1Validate`. **Formulár údajov sa nevypĺňa a Step2Validate sa vždy zruší.** Na konci sa košík vyprázdni a overí.

### 7.2 Súbory (návrh, v repe sa zatiaľ nič nemení)

```
assets/js/opc/index.js         brána (?opc=1 / 0, data.json "opc"), init na id--9 (košík) a id--17 (krok 2)
assets/js/opc/krok1Model.js    čistá funkcia: HTML kroku 1 → {doprava[], platby[], relacie, hlaska}
assets/js/opc/sync.js          stavový stroj Step1Validate (debounce, 1 súbežná, CSRF, potvrdenie súhrnu)
assets/js/opc/vzhlad.js        sekcia Doprava a platba, zbalený súhrn, lišta, krokové menu
assets/css/_lcdOpc.scss        vzhľad (vloží tools/vloz-lcd-css.py, blok LCD-OPC)
tools/test-opc/fixtures/       sk|cz × pc|mobil × kosik|krok1|krok2 (+ dobierka, set, kamión 640)
tools/test-opc/podvrh.mjs      mapa požiadavka → odpoveď (Fetch.requestPaused) + poistka
tools/test-opc/scenare-*.mjs   scenáre z § 7.6
tools/test-opc-jednotky.mjs    jsdom testy čistých funkcií (krok1Model, prepočet, sync)
tools/test-opc-zachyt.mjs      obnova fixtures zo živého webu (live-read) + diff = upozornenie na zmenu Shoptetu
```

Pred prvým testom treba opraviť prostredie: `node_modules` majú esbuild pre darwin-arm64, na Windows je potrebný `npm rebuild esbuild` alebo nová inštalácia. Inak nebeží ani `test-auto-vyber` (#remark).

### 7.3 Fixtures

- **Zdroj:** `sucasna-pokladna/{sk,cz}-{pc,mobil}/1-kosik.html`, `2-doprava-platba.html`, `2a-…-vybrane.html`, `3-udaje-zakaznika.html` a `kniha/test-krok2/krok1.html`, `krok2.html`. Formuláre sú prázdne, osobné údaje v nich nie sú. Pred uložením do repa začierniť CSRF tokeny.
- **Chýba a treba zachytiť (live-read, bez objednávky):**
  - košík so setom autokobercov (ponuka k setu, rozpis, `varchar1–3`),
  - košík s kamiónom 640,
  - CZ krok 1 a 2 s dobierkou.
  - Pre odpovede Step2Validate (úspech aj chyba validácie) reálne dáta nemáme. Fixtúra je ❓ odhad, kým ju neoverí F4.
- **Tretie strany** (GTM, GA4, FB, Ecomail, Luxia, `jkbase.js`, `ProductNote.js`) v offline režime blokovať. Statické súbory Shoptetu (`cdn.myshoptet.com` `checkout-3g.js`, `main-3g.js`) uložiť ako kópiu, aby sa dalo testovať offline. Náš bundle podvrhnúť z lokálneho buildu namiesto CDN `assets/v/<sha>/`.

### 7.4 Podvrh siete v teste

| Požiadavka | Odpoveď v offline teste |
|---|---|
| `GET /kosik/`, `/objednavka/krok-1/`, `/objednavka/krok-2/` | fixture podľa scenára (stav košíka a zvolenej platby) |
| `GET /objednavka/krok-2/` bez predchádzajúceho Step1Validate | `302 → /objednavka/krok-1/` (✅ skutočné správanie) |
| `POST /action/orderingProcess/Step1Validate/` (XHR) | `{"code":303,"payload":{"returnUrl":".../krok-2/"}}` + zápis tela. V scenároch chýb 500 / timeout |
| `POST /action/OrderingProcess/step2CustomerAjax/` | fixture súhrnu podľa zvolenej platby |
| `GET /action/Cart/GetCartContent/`, `POST /action/Cart/*` | ako v `test-kosik-doplnok.mjs` (podvrhnutý košík) |
| `POST /action/orderingProcess/Step2Validate/` | **zachytiť, zapísať celé telo, odpovedať fiktívnou stránkou „Objednávka prijatá (TEST)“** |
| čokoľvek iné na `luxurycardesign.*` | test zlyhá („nečakaná požiadavka“) |

**Poistka proti objednávke (live-read):** `Fetch.requestPaused` so vzorom `*Step2Validate*`, `*finish*`, `*krok-3*` a každý ne-GET mimo zoznamu povolených → `Fetch.failRequest`. Test zlyhá, ak by takáto požiadavka prešla. Rovnaká poistka ako v `sucasna-pokladna/zachyt.mjs`, ktorá na kroku 2 nezachytila nič, lebo stránka sama nič neposiela.

### 7.5 Ako sa testuje vzhľad

Snímky 390×844 a 1366×768, SK aj CZ, do scratchpadu, potom jedno kolo Michalovej kontroly: 1 audit + 1 oprava + 1 kontrola. Kontrola, že stránka nemá vodorovný posun, lišta neprekrýva tlačidlo a bublina Luxie neprekrýva `#submit-order`.

### 7.6 Testovacie scenáre

| # | Scenár | Očakávanie |
|---|---|---|
| S1 | SK, vzorkovník, predvolené voľby, vyplnené vymyslené údaje, Objednať | presne 1 zachytený Step2Validate. Telo má povinné polia, `consents[]=9`, žiadne `billingId` z našej sekcie. Pred ním bol Step1Validate `shippingId=96&billingId=5` |
| S2 | Košík → Pokračovať | Step1Validate XHR → priamo krok 2 (krok 1 sa nenačíta), 1 načítanie |
| S3 | Zmena na dobierku | „+ záloha“ viditeľná, Step1Validate `billingId=3`, súhrn +3 €, celkom správne |
| S4 | Zmena na kartu a späť na prevod | 2 požiadavky (debounce), súhrn sedí, tlačidlo sa odomkne až po potvrdení |
| S5 | Step1Validate vráti 500 | rádio sa vráti, hláška s odkazom, tlačidlo stále funguje s pôvodnou (potvrdenou) platbou |
| S6 | Klik Objednať počas `meni-sa` | odoslanie počká, potom 1× Step2Validate s potvrdenou voľbou |
| S7 | `GET krok-1` zlyhá alebo je zmenené HTML | `zachrana`: stránka = dnešný krok 2 + odkaz na krok 1, žiadna chyba v konzole |
| S8 | Set autokobercov (1V) | rozpis v súhrne (auto, vrstvy, farby, rohož, box), `varchar1–3` v tele s hodnotami |
| S9 | Set + odoslanie 2× (chyba validácie, potom OK) | `#remark` obsahuje „model: …“ práve raz, ručný text ostáva |
| S10 | Kamión 640 | žiadne `varchar1–3`, `#remark` s blokom `[KONFIGURÁCIA KAMIÓNA]` |
| S11 | Bez čísla domu | chyba Shoptetu pri poli, žiadny Step2Validate |
| S12 | CZ (pc + mobil) | 150 Kč, Dobírka 50 Kč, text tlačidla CZ, `language=cs`, blok `[KONFIGURACE KAMIONU]` |
| S13 | Mobil 390 | bez vodorovného posunu. Lišta „Celkom \| Objednať s povinnosťou platby“: na prázdnej stránke posunie na meno (nič neodíde ani sa neoveruje), skryje sa pri tlačidle. Luxia neprekrýva tlačidlo |
| S14 | Apple Pay | bez `ApplePaySession` sa nezobrazí, s podvrhnutým `canMakePayments()=true` áno |
| S15 | CSRF zapnuté (podvrh `shoptet.csrf.enabled=true`) | `__csrf__` v každom XHR |
| S16 | Rádiá s `form="lcd-opc-nic"` | v tele Step2Validate nie sú, skupina rádií funguje |
| S17 | `?opc=0` / bez flagu / `data.json "opc": false` | presne dnešný tok (krok 1 sa zobrazí), náš modul nič nemení |
| S18 | Celá stránka | žiadne „s DPH / bez DPH“, text tlačidla nezmenený, súhlas nepredzaškrtnutý, newsletter nepredzaškrtnutý |
| S19 | Prebieha výmena doplnku | `#submit-order` blokované, po dokončení odomknuté |
| S20 | Späť v prehliadači z kroku 2 | košík, nie rozbitý krok 1 |
| S37 | Klik „Objednať“ na prázdnej stránke a postupné dopĺňanie (SK, CZ, 390, 1366) | meno → e-mail → telefón → ulica → číslo → mesto → PSČ → súhlas: vždy 1 pole s rámom, textom a kurzorom, nad lištou; rám zmizne pri písaní; dovtedy žiadna požiadavka; potom 1× Step1Validate a 1× Step2Validate |
| S38 | Neplatný telefón | označený Shoptetom → posun na telefón s jeho textom, nič neodíde; počas overenia → po chybe Shoptetu posun na telefón |
| S39 | Lišta / karta „Objednať“ | telefón: všetko vyplnené, klik v lište = 1× objednávka; PC set navrchu: karta nad súhrnom, klik → meno, pri tlačidle zmizne |
| S42 | Zobáčik, fotka, košík v štýle pokladne (§ 10.9, 10.10, 10.12) | zbalené → rozbalené (klik, Enter, medzerník, aria vrátane popisu názvom položky, 44 px, CZ texty); rozbalené = celý názov; karta = PRESNE rozpis z košíka v jeho vzhľade (riadky, farba, hrúbka, písmo; bez obrázkov, guličiek, Počet / Cena, „Niečo nesedí“), zbalený súhrn navrchu s rozpisom aj kariet kamióna, auto pre poznámku (`sessionStorage.model`), pri kamióne `truckOrderSummary` a zhoda s príplatkami položky; fotka 60 × 60 pri správnej položke (kľúč aj s kódom varianty), načítaná, bez posunu; súčty košíka = celkom; košík ?opc=1 v štýle kroku 2, bez ?opc=1 bez zmeny; set, dve položky, kamión, vzorkovník; 360–1920, 1366×657 |
| S45 | Súhlasy B1 (§ 10.12) | dve biele dlaždice 10 px od seba; povinný (required, nie poradie) zlatý rám 2 px a štítok „Povinné“ (pre čítačku bez textu), miesto preň aj pri opačnom poradí; klik kamkoľvek prepne, zaškrtnuté zelené; chyba = červený rám + text pod dlaždicou; fokus z klávesnice; PC: Tab na súhlas nad kartu „Celkom \| Objednať“ (set 1366×657, kamión 1920×1080, CZ) |

### 7.7 Prepínač

Prepínač funguje ako `?novy=1` pri konfigurátore (`konfigurator1v/index.js` `prepinac`/`jeZapnute`):
- `?opc=1` zapíše flag karty do sessionStorage (`lcdOpc`), `?opc=0` ho zmaže.
- Bez flagu rozhoduje konštanta `SPUSTENE` (spočiatku `false`).
- Núdzový vypínač bez nasadenia je `data.json` `"opc": false` (rovnako ako `"kosik_doplnky": false`). Má prednosť pred flagom aj pred `SPUSTENE`.

### 7.8 Cesta naživo

| Fáza | Čo | Kto | Podmienka prechodu |
|---|---|---|---|
| F0 | Odpovede na § 8, východisko z GA4, oprava esbuild | Michal, Claude | odpovede |
| F1 | Prototyp offline: jednotky + S1–S20 zelené, snímky | Claude | všetko zelené, Michal schváli vzhľad |
| ~~F2~~ | ~~Otázka na podporu Shoptetu (VOP 7.1)~~ – vyškrtnuté 29. 10.: Michal otázku zamietol („to je moja vec“) | – | – |
| F3 | Kód do `main` „spiaci“ (bez flagu nerobí nič) → nový sha. Prepnúť sha v HTML kódoch SK (zdieľané so session „Shoptet úpravy“, zladiť). Zlúčenie vetvy `opc-prototyp` len cez squash merge (staré bloby fixtures nesmú na GitHub, `tools/test-opc/FIXTURES.md`). **Len so súhlasom Michala** | Claude | S17 zelený aj naživo (bez flagu sa nič nezmenilo) |
| F4 | Live-read s `?opc=1` na SK: vzorkovník, zmeny platieb, bez odoslania. Potom **živý test s Michalom**: Michal sám odošle 2–3 objednávky (prevod, dobierka, karta) a skontroluje admin, `#remark`, `varchar1–3` a Jánov export. Zákazníci `?opc=1` nepoznajú a bez neho sa nič nemení. Termín určí Michal (§ 8 otázka 7) | Claude, Michal | všetko sedí, objednávky zrušené v admine (Michal) |
| F5 | SK pre všetkých (`SPUSTENE=true`), denná kontrola live-read (zmena HTML Shoptetu → upozornenie). **Až po F4 a len na Michalov výslovný pokyn** (napr. „spusti“), dovtedy `SPUSTENE = false` | Claude (po súhlase Michala) | 1–2 týždne bez chyby `lcd_opc_chyba` nad prahom |
| F6 | CZ: texty, fixtures, S12, F4 na CZ, potom pre všetkých | Claude, Michal | ako SK |

---

## 8. Otvorené otázky pre Michala

**Stav 29. 10. 2026 – čo ostáva otvorené (krátko):**
- ~~**Pre právnikov, ktorí robili VOP** (otázka 3): poučenie pri dobierke a výška zálohy, nemožnosť odstúpiť pri tovare na mieru, spôsoby platby pri záchrane.~~ ✅ **Rozhodnuté 29. 10.:** Michal „použi, čo už máme vo VOP“ → znenie a body VOP v § 10.8.
- ~~**Termín doručenia** (otázka 2): kalendárne, alebo pracovné dni?~~ ✅ **Rozhodnuté 29. 10.:** bez dátumov, „Doručenie do 21–29 dní“ (kamióny 14–25).
- ~~**Riadok „Rýchla platba cez banku“** (otázka 6, doplnok): ponechať ako odkaz, alebo vynechať?~~ ✅ **Rozhodnuté 29. 10.:** ostáva riadok s odkazom „Vybrať banku“.
- **„+ záloha“ pri dobierke má v OPC 14 px** (poznámka, na klasickom kroku 1 má 10,5 px). Stačí 14 px, alebo 16 px ako hlavný text?
- **Vzhľad finálnej stránky** (Michal 29. 10.: „doladiť nášmu e-shopu“, kompaktne): výber z návrhov.
- **Rozpory VOP s webom** (nové 29. 10., § 10.8): VOP bod 5.9 „30 až 90 pracovných dní“ vs. „Doručenie do 21–29 dní“, VOP bod 4.11 „Obchodník je platcom DPH“ vs. „nie sme platcami DPH“, CZ VOP bod 4.5 f) rýchla platba, ktorú CZ pokladňa nemá. Upraviť VOP, alebo texty?
- **Živý test len pre Michala (`?opc=1`) – kedy?** (otázka 7). Bez neho nejde nič ďalej.
- Rozhodnuté: otázka 1 → a (variant A, Michal 29. 10.). Otázka 4 je vyškrtnutá (Michal: „to je moja vec“). Otázka 5 → a podľa Michalovho pravidla „živý test s ním pred zákazníkmi“ (termín je otázka 7).

1. **Košík: samostatný, alebo tiež na jednej stránke?** ✅ **Rozhodnuté 29. 10. 2026: a)** (variant A, B zamietnutý).
   - a) Košík zostane samostatný (zelené „Pokračovať“, zlaté doplnky pod ním), pokladňa je 1 stránka po ňom. **Odporúčam.** Je to v súlade s 8. 10., ponuka k setu potrebuje reload a samostatný košík odporúča aj línia `osvedcene-postupy` (🟡 jej záver, nie priamo Baymard).
   - b) Všetko vrátane košíka na jednej stránke. Treba prepísať ponuku k setu bez reloadu a doprava sa ukáže hneď vedľa košíka (⛔ proti 8. 10.).
2. **Termín doručenia pri doprave?** ✅ **Rozhodnuté 29. 10. 2026: b)** „Doručenie do 21–29 dní“ (kamióny 14–25), bez dátumov.
   - a) Dátumy od–do, napr. „Doručenie medzi 18. 11. a 26. 11.“ (21–29 dní od dnes, kamióny 14–25). **Odporúčam.** Baymard: dátumy fungujú lepšie ako „X dní“. Potrebujem vedieť, či sú to kalendárne alebo pracovné dni.
   - b) Text „21–29 dní“.
   - c) Nič.
3. **Zákonné texty nad tlačidlom (dobierka so zálohou a tovar na mieru):** ✅ **Rozhodnuté 29. 10. 2026: a)** so znením našich VOP (Michal: „použi, čo už máme vo VOP“), texty a body v § 10.8.
   - a) Pri dobierke po výbere „+ záloha“ a pod tým 1 sivý riadok s výškou zálohy, ako a kedy sa platí. Pri súhlase 1 riadok „Koberce sa pripravujú na mieru, preto pri nich nie je možné odstúpenie od zmluvy“. **Odporúčam.** Zákon chce poučenie o preddavku pred objednávkou (SK § 15 ods. 1 písm. k, CZ § 1820 odst. 1 písm. q) a informáciu o nemožnosti odstúpiť (SK § 19 ods. 1 písm. c, CZ § 1837 písm. d). Text nech potvrdia právnici, ktorí robili VOP.
   - b) Len „+ záloha“ ako dnes. Hrozí, že to nestačí.
   - c) Dobierku z OPC vynechať. Neodporúčam, na SK je to >43 % nákupov.
4. ~~**Interné volanie Step1Validate a VOP Shoptetu (čl. 7.1):**~~ **Vyškrtnuté 29. 10. 2026.** Písomnú otázku podpore Shoptetu Michal zamietol („to je moja vec“), rozhodnutie o riziku čl. 7.1 je jeho. Pôvodné možnosti len pre úplnosť:
   - ~~a) Pred spustením sa písomne spýtať podpory Shoptetu, či smie náš JS posielať formulár kroku 1 na pozadí. Pokuta 100 000 Kč platí pri čl. 11, nie pri 7.1, ale písomná odpoveď odstráni neistotu.~~
   - ~~b) Spustiť bez otázky. Robí to rovnakú požiadavku ako formulár Shoptetu.~~
   - ~~c) Nevolať nič interné. Zostáva len C4 (našepkávač adries), one page nebude.~~
5. **Test skutočnej objednávky pred spustením:** (🟡 29. 10.: platí a), termín je otázka 7)
   - a) Michal s `?opc=1` sám odošle 2–3 objednávky (prevod, dobierka, karta) a zruší ich v admine. **Odporúčam.** Je to jediný spôsob, ako overiť Step2Validate, chyby a Shoptet Pay.
   - b) Testovací Shoptet e-shop cez Jána (ak má partnerský prístup, ❓).
   - c) Bez skutočnej objednávky. Neodporúčam.
6. **Platby vo v1:**
   - a) V OPC prevod, dobierka, karta, Google Pay a Apple Pay (len na zariadeniach, ktoré ju vedia). „Rýchla platba cez banku“ (len SK) cez odkaz „vybrať banku“ na klasický krok. **Odporúčam.** Výber banky je samostatný widget Shoptet Pay, ktorý by sme museli kopírovať.
   - b) Všetky platby priamo v OPC hneď vo v1. Dlhšie a rizikovejšie.
   - c) Rýchlu platbu z ponuky odstrániť. Neodporúčam bez dát o jej využití.
   - ✅ **Rozhodnuté 29. 10. 2026:** riadok ostáva ako odkaz „Vybrať banku“.
   - Doplnok (revízia 29. 10.): riadok „Rýchla platba cez banku“ na finálnej stránke vedie preč na samostatný krok 1 (výber banky), čo nesedí so zadaním „všetko na jednom mieste“ a v náčrte variantu A nie je. Teraz má namiesto krúžku rádia zlatú šípku a popis „Banku si vyberiete na samostatnej stránke.“ Otázka: **ponechať riadok ako odkaz (odporúčam, kým nie sú dáta o využití), alebo ho z finálnej stránky vynechať** (zákazník by rýchlu platbu videl len na klasickom kroku 1, napr. cez „Zmeniť dopravu alebo platbu“)?
7. **Živý test len pre Michala (`?opc=1`) – kedy?** (pridané 29. 10. 2026)
   - Čo to je: Michal otvorí košík s `?opc=1`, prejde finálnou stránkou a sám odošle 2–3 objednávky (prevod, dobierka, karta), potom ich zruší v admine (§ 7.8 F4). Pred tým Claude spraví live-read bez odoslania.
   - Podmienka: kód musí byť na webe „spiaci“ (F3, nový sha v HTML kódoch SK). To je zásah do živého webu, preto **len so súhlasom Michala**. Zákazníci bez `?opc=1` nič nevidia.
   - Treba od Michala: termín (cca 30–45 min) a súhlas s F3.
   - Až po úspešnom teste a na Michalov pokyn ide OPC pre zákazníkov (F5). Nič naživo bez jeho súhlasu.

---

## 9. Záver

- Shoptet ani jeho doplnky one page checkout nemajú. Na Basicu sa dá postaviť len vlastným JS nad krokmi Shoptetu, pričom objednávka sa odosiela stále jeho formulárom.
- Dnešný krok 1 nič nerieši (1 doprava, predvolený prevod) a stojí 1 klik a 1 načítanie. Overili sme, že ho zvládne XHR `Step1Validate` (303, 0,17 s), bez ktorého krok 2 presmeruje späť (302).
- Odporúčaný (a 29. 10. 2026 Michalom zvolený) je **variant A**: pokladňa = `/objednavka/krok-2/` so sekciou „Doprava a platba“. Košík zostáva, odoslanie je natívne, dnešné úpravy a tichá Luxia ostávajú bez prepisovania a pri chybe sa stránka vráti k dnešnému toku.
- Najväčšie riziká: nezdokumentovaný endpoint (VOP 7.1), platby Shoptet Pay mimo kroku 1 a neoverené správanie Step2Validate pri chybách. Rieši ich záchrana, poistky v teste, ~~otázka na Shoptet~~ (vyškrtnutá 29. 10., rozhodnutie o VOP 7.1 je Michalovo) a živý test s Michalom.
- Prínos nebude veľký skok, ale menej trenia: 4 → 3 kliky, 2 → 1 načítanie, platba a súhrn na jednom mieste. Zmeriame ho v GA4.

**Ďalší krok (28. 10., hotové):** Michal odpovie na 6 otázok v § 8. Potom sa opraví esbuild v repe, zachytia sa chýbajúce fixtures (set, kamión, CZ s dobierkou) a postaví sa prototyp offline (`tools/test-opc/`). Výsledkom budú snímky na schválenie, všetko zatiaľ bez zásahu do živého webu.

**Ďalší krok (29. 10. 2026):** prototyp variantu A je hotový a otestovaný offline (§ 10). Teraz Michal pozrie finálne snímky a odpovie na otvorené otázky (§ 8, stav 29. 10.). Potom príde **živý test s Michalom** (`?opc=1`, F3 + F4) a **až potom zákazníci** (F5). Nič naživo bez jeho súhlasu (§ 10.5).

---

## 10. Stav prototypu (29. 10. 2026)

Prototyp je na lokálnej vetve `opc-prototyp` vo worktree `C:/Users/M/Desktop/spt-luxuryCar-opc` (z `origin/main`). **Vetva sa nepushuje**: push inej vetvy než `main` prepíše CDN živého webu. Bez `?opc=1` modul nič nerobí (✅ S17: bez flagu, s `?opc=0` aj s `data.json "opc": false` presne dnešný tok).

Na otvorené otázky § 8 sú zatiaľ použité odporúčané možnosti: 1a (košík samostatný), 2a (termín ako dátumy, kalendárne dni 21–29, kamióny 14–25, v kóde `TODO-MICHAL`), 3a (sivé riadky, v kóde `TODO-PRAVNICI`), 6a (platby). Otázky 4 a 5 sa týkajú až živého nasadenia.

Stav 29. 10. 2026: 1a je Michalovo konečné rozhodnutie (variant A, B zamietnutý). Otázka 4 je vyškrtnutá. Popoludní rozhodol aj 2 (b, bez dátumov), 3 (a, znenie VOP) a 6 (riadok s odkazom), § 10.8. Zostáva 7 (termín živého testu), vzhľad a rozpory VOP s webom, pozri § 8.

### 10.1 Čo je hotové

**Súbory**
- `assets/js/opc/` – `index.js` (brána), `kosik.js`, `krok1Model.js`, `krok2.js`, `sync.js` (stavový stroj), `vzhlad.js`, `texty.js` (SK + CZ), `analytika.js` (GA4, § 10.6).
- `assets/css/_lcdOpc.scss` – blok `LCD-OPC` v `luxuryCar.css` (vkladá `tools/vloz-lcd-css.py`). Všetko je pod `html.lcd-opc*`, `[data-lcd-opc-caka]` alebo `.lcd-opc-kroky` (triedy dáva len OPC). Komentáre len `/* */`: partial sa kopíruje do `luxuryCar.css` bez zmeny a `//` by prehliadač zahodil spolu s pravidlom za ním (jednotka „CSS OPC“).
- Spoločný kód (len exporty, zladiť so session „Shoptet úpravy“):
  - `components/cart.js`: export `lcdDobierkaZaloha`, `lcdBublinaMimoTlacidla` (+ `#submit-order`) a `changeDescription`,
  - `lcdKosikDoplnok.js`: export `vymenaBezi`,
  - `main.js`: volanie `initOpc(setupData)`.
- Testy: `tools/test-opc.mjs` (S1–S36 v Chrome bez okna, podvrh siete), `tools/test-opc-jednotky.mjs` (jsdom), `tools/test-opc-snimky.mjs` (snímky), `tools/test-opc-zachyt.mjs` (live-read obnova fixtures, bez Step2Validate).

**Košík**
- „Pokračovať“ aj lišta dole pošlú `Step1Validate` (XHR) s voľbou z kroku 1 a idú rovno na krok 2. Krok 1 sa nenačíta (S2).
- Počas prechodu sú tlačidlá stlmené a ukazujú „Načítavam…“ / „Načítám…“.
- Hocičo zlyhá → pôvodný odkaz na krok 1 = dnešný tok (S7K, S25):
  - zmenené HTML kroku 1,
  - Step1Validate 500 alebo bez odpovede 8 s,
  - GET kroku 1 bez odpovede 4 s.
- Rýchla platba cez banku (SK 112) v session → klasický krok 1, lebo banka sa vyberá len tam (S27).
- Lišta krokov už na košíku „Nákupný košík · Objednávka“ (krok Doprava & platba sa skryje), bez `?opc=1` 3 kroky Shoptetu bez zmeny (S36).

**Krok 2 = jednostránková pokladňa**
- Sekcia „Doprava a platba“ medzi adresou a poznámkou je klon označenia Shoptetu. Rádiá sú mimo `#order-form` (S16).
- Termín doručenia, poradie platieb, Apple Pay len s `canMakePayments()` (S14), rýchla platba ako riadok s odkazom „Vybrať banku“ (nezvolená: zlatá šípka namiesto krúžku, „Banku si vyberiete na samostatnej stránke.“, S36).
- Pri dobierke „+ záloha“ a poučenie (S3).
- Telefón: zbalený súhrn, lišta „Celkom · K súhrnu“ (posúva, neodosiela), Luxia ustúpi z „Objednať“ (S13).
- 2 kroky v lište krokov, „Späť do košíka“ / „Zpět do košíku“ vedie do košíka, Späť v prehliadači tiež (S20, S36). Pri štáte „Zmeniť štát“ namiesto „Môžete zmeniť v predchádzajúcom kroku“ (S36).
- Bez zmeny ostáva: tlačidlo a jeho text, súhlas, súhrn nad tlačidlom, `#remark` (S8–S10, S12), `varchar1–3`, natívny POST Step2Validate (S1, S16). Bez „s DPH“ a nič predzaškrtnuté (S18).
- Záchrana: krok 1 nejde stiahnuť (aj po 4 s), zmenené HTML, nezhoda súhrnu alebo výnimka → dnešný krok 2 + odkaz „Zmeniť dopravu alebo platbu“ (S7, S25).

**Zmena platby (stavový stroj, § 6.5)**
- Debounce 300 ms, naraz 1 požiadavka, 1 automatický pokus.
- ~~Súhrn sa potvrdí zo servera (`step2CustomerAjax`, náhradne GET krok 2).~~ Od 29. 10. (commit 917ce50) sa súhrn potvrdzuje cez **GET krok 1** s limitom 4 s. Zaškrtnutá doprava a platba = session, súhrn kroku 2 sa zloží len z dát servera, záloha je GET krok 2. Dôvod: živý `step2CustomerAjax` vracia `payload: []` bez HTML (§ 11).
- Úspech Step1Validate len pri `code 303` + `returnUrl` na krok 2 toho istého webu + bez `messages.errors` (commit fbc1b74, S28). Živý dôkaz: neplatná voľba vracia tiež 303, ale s chybami a krokom 1 (§ 11). Odmietnutie sa automaticky neopakuje.
- Pri chybe sa voľba vráti a hláška povie, ktorá platba ostala (S3–S6, S15).

**Objednávka = to, čo zákazník vidí** (pravidlá doplnené po revízii 29. 10.)
1. Súhrn nad tlačidlom je vždy zo servera: nový, alebo posledný potvrdený. Lokálny prepočet je len počas zmeny a nikdy neostane (S21).
2. Keď požiadavka dobehne až po ďalšej zmene a súhrn sa nedá overiť, voľba je neoverená. Najnovšia voľba sa pošle vždy, „Objednať“ stojí (S22).
3. Pred odoslaním sa kontroluje zhoda: súhrn = potvrdená voľba = zaškrtnuté rádio. Pri nezhode sa platba overí zo servera a objednávka neodíde. To isté platí, keď Shoptet súhrn prekreslí sám (🟡 bez vlastného scenára, podvrh túto situáciu zatiaľ nevie vyvolať).
4. Klik „Objednať“ počas zmeny počká. Objednávka odíde len s potvrdenou voľbou z času kliku. Ak zmena zlyhá alebo zákazník medzitým zvolí inú platbu, odoslanie sa zruší a pri tlačidle sa ukáže „Objednávka neodišla. Skontrolujte, prosím, platbu a súhrn a kliknite znova.“ (S6, S23).
5. Zámok proti dvojkliku (5 s po úspešnej validácii Shoptetu) zruší neúspešná validácia. Zahodený klik ukáže „Objednávka sa odosiela…“ (S26).
6. Spoločná kontrola v každom teste s objednávkou (`objednaj()`): platba v session pri Step2Validate = platba zo súhrnu aj zaškrtnuté rádio pred klikom.
7. Resync tesne pred odoslaním (živý dôkaz T5b, T6b: Step2Validate nenesie platbu ani košík, berie ich zo session). Po kliku „Objednať“ ide Step1Validate so zobrazenou voľbou a GET krok 1. Voľba aj „Celkom k úhrade“ musia sedieť so súhrnom na stránke, až potom ide natívny submit Shoptetu (práve 1×). Pri nezhode (iné okno zmenilo košík) objednávka neodíde, súhrn a voľba sa prevezmú zo servera a pri tlačidle je „Košík alebo platba sa zmenili v inom okne. Skontrolujte, prosím, súhrn a kliknite znova.“ Bežné odoslanie = 2 požiadavky navyše, v podvrhu do 1 s (🟡 naživo odhad ~0,3 s podľa časov z dôkazu). Druhá karta s inou platbou → objednávka s platbou, ktorú zákazník vidí (S30, S31).
   - Rýchla platba cez banku (112 vybraná s bankou na klasickom kroku 1): Step1Validate sa NEPOŠLE (niesol by 112 bez `shoptetPayPisCode`; ❓ naživo by Shoptet voľbu odmietol, alebo ju prijal bez banky). Overí sa len GET krokom 1: voľba aj suma. Iná karta s inou platbou → neodíde, hláška (S34). 🟡 Súhrn kroku 2 so 112 je v podvrhu poskladaný zo súhrnu prevodu; zodpovedá živému T11 („Rýchla platba cez banku“, €10).
   - Keď kontrola zlyhá: dočasná chyba (sieť, limit, 5xx) → „Objednávku sa zatiaľ nepodarilo odoslať. Skúste to, prosím, znova alebo vyberte dopravu a platbu na samostatnej stránke.“ (odkaz na klasický krok 1). Trvalá chyba (odmietnutie servera 303 + errors, ktoré v session zruší krok 1, session alebo košík preč, zmenené HTML) alebo 2. zlyhanie za sebou → záchrana: sekcia preč, „Objednávka neodišla, dopravu a platbu sa nepodarilo overiť. Skontrolujte, prosím, súhrn a kliknite znova alebo …“ s odkazom, ďalší klik ide natívne ako bez OPC (S35). Bočný panel Shoptetu (súhrn, hláška, tlačidlo) posúva na PC inline `top` jeho `fixSidebar`, ktorý pri spodku stránky nič neprepočíta. Keď panel narastie (hláška pri tlačidle) alebo obsah vľavo zmizne (neskorá záchrana), starý posun vytlačí tlačidlo pod koniec obsahu (`overflow:clip`) a zákazník ho nevidí. `srovnajPanel()` preto po zmene výšky hlášky a pri neskorej záchrane spustí prepočet Shoptetu (`contentResized`) a posun obmedzí po spodok obsahu (zistené testami S22 a S35 na 1366; mutácia bez neho → obe zlyhajú).
8. Zámok pri odoslaní je viditeľný (overené výsledným štýlom, nie triedou, S29): sekcia stlmená (opacity .55) so sivým „Objednávka sa odosiela…“ (telefón: Shoptet posunie stránku k telefónu a tlačidlo je mimo obrazovky), tlačidlo „Odosielam…“ plne zelené. Hláška pri tlačidle (neodišlo, iné okno) je červený box 16 px (S31).

### 10.2 Opravené po revízii (29. 10. 2026)

| Nález | Závažnosť | Oprava | Test |
|---|---|---|---|
| R2: návrat na pôvodnú platbu počas letu + zlyhané potvrdenie → objednávka s inou platbou | kritická | `sync.js` `dobehla()`: nevieme → `overene = false`, najnovšia voľba sa pošle | jednotky R2, S22 |
| R7: odložené odoslanie odíde samo po zlyhanej zmene / po novej voľbe | vysoká | `krok2.js` `odlozOdoslanie`: len potvrdená voľba z času kliku, inak zrušiť + hláška | S23 |
| R1: dobierka a späť v debounce → súhrn ukazuje dobierku a vyššiu sumu | vysoká | súhrn = server alebo posledný potvrdený; lokálny prepočet od toho, čo je na stránke; kontrola zhody pred odoslaním | S21 |
| R3: druhé `changeDescription` zmaže rozpis kamióna bez `truckOrderSummary` | vysoká | rozpis len nad čerstvým HTML zo servera, vlastný zápis bez pozorovateľa | S24 |
| R5/R6: visiaci GET kroku 1 zasekne „Pokračovať“ / krok 2 | stredná | `fetchSLimitom` 4 s → dnešný tok / záchrana | S25 |
| Rýchla platba 112 bez `shoptetPayPisCode` | stredná | 112 v session → klasický krok 1 | S27 |
| Riadok „nie je možné odstúpiť“ aj pri boxe | stredná | `naMieru()`: len koberce, rohože, kamióny; pod súhlasmi, nad tlačidlom | jednotky, S8, S18 |
| Tichý 5 s zámok | nízka | zrušenie pri `ShoptetFailedValidation` + hláška | S26 |
| `inputmode` pri PL PSČ | nízka | len keď vzor PSČ nemá pomlčku (SK, CZ) | – |
| Vzhľad: rýchla platba (čiarkovaný krúžok, „stránka Doprava a platba“) | stredná | plný krúžok, celý riadok odkaz, „Banku si vyberiete po kliknutí na Vybrať banku.“ | jednotky (text), S18 (zobrazenie), snímky |
| Vzhľad: hláška nepovie, ktorá platba ostala | stredná | „…zvolená ostáva: Prevodom. Skúste to znova alebo vyberte platbu na samostatnej stránke.“ | S5, jednotky |
| Vzhľad: dátum sa láme v strede | stredná | nezalomiteľná medzera v `datumText` | jednotky, S8, S10 |
| Vzhľad: „Pokračovať“ bez odozvy | stredná | `!important`, „Načítavam…“, bez klikania počas prechodu | snímky |
| Vzhľad (nízke) | nízka | „Prepočítavam…“ pri platbách, lišta zmizne aj pri súhlase, „K súhrnu“ na tablete užšie, prvé písmeno v zbalenom súhrne, kontrast „+ záloha“ a „Upraviť košík“, medzera pod odkazom v záchrane, „Prihlásiť sa“ ako odkaz na telefóne | snímky |

Druhá revízia (29. 10. 2026 večer, po resyncu a analytike):

| Nález | Závažnosť | Oprava | Test |
|---|---|---|---|
| Resync pred odoslaním posielal pri 112 Step1Validate bez `shoptetPayPisCode` | vysoká | pri „pis“ len GET krok 1 (`krok2.js` `jePis`) | S34 |
| Komentáre `//` v `_lcdOpc.scss` zahodili v prehliadači pravidlá: hláška pri tlačidle sivá 15 px, zamknutá sekcia nestlmená | vysoká | `/* */`; test výsledného štýlu, nie triedy | jednotka „CSS OPC“, S29, S31 |
| Zlyhaná kontrola pred odoslaním: stále „skúste o chvíľu“ bez cesty ďalej | stredná | odkaz na klasický krok 1; trvalá chyba alebo 2. zlyhanie → záchrana; reset posunu bočného panelu | S35 |
| Košík ukazoval 3 kroky (aj „Doprava & platba“), finálna stránka 2 | stredná | `upravKroky` aj na košíku | S36 |
| (nové pri teste opráv) Na PC tlačidlo pod koncom obsahu po zväčšení hlášky alebo po neskorej záchrane (starý `top` bočného panelu Shoptetu) | vysoká | `srovnajPanel()`: prepočet Shoptetom + posun najviac po spodok obsahu | S22, S35 (1366) |
| Zamknutá sekcia bez vysvetlenia (telefón), „Odosielam…“ bledé (kontrast 2,5–2,9 : 1) | nízka | „Objednávka sa odosiela…“ v sekcii, tlačidlo počas odosielania opacity 1 | S29 |
| „Späť“ bez cieľa, „Môžete zmeniť v predchádzajúcom kroku“ | nízka | „Späť do košíka“, „Zmeniť štát“ (odkaz ostáva) | S36 |
| Riadok rýchlej platby vyzerá ako rádio | nízka | zlatá šípka, „Banku si vyberiete na samostatnej stránke.“; otázka § 8 bod 6 | S36 |
| Rozpis kamióna v zbalenom súhrne tučne 15 px | nízka | 400 14px ako v súhrne | S24 |
| Google API kľúče v gite, kontrast šablóny, rozpis kamióna 12,5 px na PC | nízka | mimo OPC, § 6.13 body 6–8 | – |

### 10.3 Čo nie je hotové alebo zostáva otvorené

- ~~Spôsoby platby v záchrane, texty pre právnikov, termín doručenia~~ ✅ rozhodnuté 29. 10. (§ 10.8). V kóde už nie je `TODO-PRAVNICI` ani `TODO-MICHAL`.
- **Rozpory VOP s webom** (⛔, § 10.8): dodacia lehota, platca DPH, CZ rýchla platba.
- **Neopravené nízke nálezy vzhľadu:**
  - odkaz „Upraviť košík“ stojí nad nadpisom súhrnu (vložiť ho do `#summary-box` by vyžadovalo strážiť prekreslenie Shoptetom),
  - slovenské číslo v CZ páse „Potřebujete pomoc?“ (mimo OPC, § 6.13 bod 3).
- **Test bfcache:** S20 prejde cez nové načítanie košíka. Podvrh posiela `Cache-Control: no-store`, preto sa vetva `pageshow persisted` v teste nespustí.
- **Neoverené naživo (F4):** ~~tvar odpovede `step2CustomerAjax` (🟡 z `checkout-3g.js`)~~ (✅ overené 29. 10.: `payload: []`, OPC ho už nevolá, § 11), chyba zo servera po Step2Validate (❓ odhad v podvrhu), Shoptet Pay karta bez volaní z kroku 1, CZ fixtures pre set a kamión (zachytené sú len SK).
- **Mimo OPC, nájdené pri teste:** `assets/js/truck-konfigurator/test-cart-summary.mjs` zlyháva už na `origin/main`. Čaká starý tvar „2901 – Strieborná“, kód má od 1V číslo na konci. Patrí do session kamióny.

### 10.4 Ako spustiť testy

Z koreňa worktree `C:/Users/M/Desktop/spt-luxuryCar-opc`. Všetko je offline: odpovede `www.luxurycardesign.*` idú zo súborov a Step2Validate sa vždy zachytí.

```
node tools/test-opc-jednotky.mjs                      # jsdom: brána, krok1Model, sync, vzhľad, texty
node tools/test-opc.mjs                               # SK, S1–S39 (+ S7K), šírky 1366 a 390
node tools/test-opc.mjs --web cz                      # CZ (set, kamión a rýchla platba S27, S34 sa preskočia: fixtures len SK)
node tools/test-opc.mjs --krok S21,S22 --sirka 390    # vybrané scenáre
python tools/vloz-lcd-css.py --check                  # luxuryCar.css sedí s _lcdOpc.scss
node tools/test-opc-snimky.mjs <priečinok> --stavy kosik,kosikCaka,zakladny,dobierka,chyba   # snímky na schválenie vzhľadu
node tools/test-opc-snimky.mjs <priečinok> --stavy lista,chybaMeno,chybaTelefon,chybaSuhlas,kartaPc,set,zachrana,dobierka   # správanie „Objednať“, VOP texty
node tools/test-kosik-doplnok.mjs; node tools/test-kosik-rozpis.mjs; node tools/test-auto-vyber.mjs; node tools/test-auto-pamat.mjs; node tools/test-kamion-kosik.mjs
```

Výsledok 29. 10. 2026 (po opravách):
- jednotky: 46 OK,
- SK: S1–S27 a S7K na 1366 a 390: 54 OK, 0 zlyhalo, 2 preskočené (S12 je len CZ),
- CZ: 46 OK, 0 zlyhalo, 10 preskočených (S8–S10, S24, S27 majú fixtures len pre SK),
- testy košíka: doplnok 89 OK, rozpis OK, auto výber OK, auto pamäť 8 OK, kamión košík 464 OK,
- `vloz-lcd-css --check` OK.

Výsledok 29. 10. 2026 po analytike (§ 10.6):
- jednotky: 66 OK,
- SK: S1–S33 a S7K na 1366 a 390: 66 OK, 0 zlyhalo, 2 preskočené (S12 je len CZ),
- CZ: 58 OK, 0 zlyhalo, 10 preskočených (S8–S10, S24, S27 majú fixtures len pre SK),
- testy košíka: doplnok 89 OK, rozpis OK, auto výber OK, auto pamäť 8 OK, kamión košík 464 OK,
- `vloz-lcd-css --check` OK, `build-admin-html --check` OK.

Výsledok 29. 10. 2026 po druhej revízii (S34–S36, opravy v § 10.2):
- jednotky: 67 OK,
- SK: S1–S36 a S7K na 1366 a 390: 72 OK, 0 zlyhalo, 2 preskočené (S12 je len CZ),
- CZ: 62 OK, 0 zlyhalo, 12 preskočených (S8–S10, S24, S27, S34 majú fixtures len pre SK),
- testy košíka: doplnok 89 OK, rozpis OK, auto výber OK, auto pamäť 8 OK, kamión košík 464 OK,
- `vloz-lcd-css --check` OK, `build-admin-html --check` OK,
- upozornenie behu: chýbajúce statické súbory CDN (404, SK 4, CZ 1) test neovplyvňujú.

Záverečný beh 29. 10. 2026 nad 133e2a0 (kód bez zmeny, len kniha a finálne snímky variantu A, § 10.7), všetko exit 0:
- jednotky: VŠETKO OK (67 OK),
- SK: S1–S36 a S7K na 1366 a 390: 72 OK, 0 zlyhalo, 2 preskočené (S12 je len CZ),
- CZ: 62 OK, 0 zlyhalo, 12 preskočených (S8–S10, S24, S27, S34 majú fixtures len pre SK),
- testy košíka: doplnok 89 OK, rozpis „Všetko OK“, auto výber „Všetky kontroly OK“, auto pamäť 8 OK, kamión košík 464 OK, 0 ZLE,
- `vloz-lcd-css --check` OK (luxuryCar.css sedí s partialmi), `build-admin-html --check` OK (src v poriadku, dist aktuálny),
- upozornenie behu: chýbajúce statické súbory CDN (404, SK 4, CZ 1) test neovplyvňujú,
- logy: `C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/final3/`.

Beh 29. 10. 2026 po rozhodnutiach Michala (§ 10.8, commit d94e578), všetko exit 0:
- jednotky: VŠETKO OK (76 OK),
- SK: S1–S39 a S7K na 1366 a 390: 78 OK, 0 zlyhalo, 2 preskočené (S12 je len CZ),
- CZ: 68 OK, 0 zlyhalo, 12 preskočených (S8–S10, S24, S27, S34 majú fixtures len pre SK; S39 na PC beží len so SK setom),
- `vloz-lcd-css --check` OK, `build-admin-html --check` OK,
- upozornenie behu: chýbajúce statické súbory CDN (404, SK 4, CZ 1) test neovplyvňujú,
- logy: `C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/spravanie-testy/`.

### 10.5 Ďalší krok

Aktualizované 29. 10. 2026 po rozhodnutí Michala (variant A):

1. **F1:** Michal schváli vzhľad podľa finálnych snímok variantu A (`C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/snimky/variant-a-final/`): košík SK 390, finálna stránka celá SK a CZ (390 aj 1366), dobierka SK 390, set autokobercov SK 390. Zároveň odpovie na otvorené otázky (§ 8, stav 29. 10.).
2. ~~**F2:** otázka na podporu Shoptetu (§ 8 otázka 4).~~ Vyškrtnuté 29. 10. (Michal: „to je moja vec“).
3. **F3:** kód do `main` „spiaci“ (bez flagu nič nerobí), nový sha, zladiť so session „Shoptet úpravy“ (spoločný `cart.js`). Vetvu zlúčiť len cez squash merge (`tools/test-opc/FIXTURES.md`). **Len so súhlasom Michala**, je to zásah do živého webu.
4. **F4: živý test s Michalom** (`?opc=1`, § 8 otázky 5 a 7). Najprv live-read bez odoslania, potom Michal sám odošle 2–3 objednávky a zruší ich v admine. Potom znova spustiť `tools/test-opc-zachyt.mjs` a zachytiť aj CZ set, CZ kamión a CZ dobierku. Overiť aj ❓ body z § 11 (Shoptet Pay karta bez volaní kroku 1, `cashOnDelivery~Dobierkou`, Meta `fbq` so súhlasom s cookies).
5. **Až potom zákazníci (F5)**, a len na Michalov výslovný pokyn. Do vtedy `SPUSTENE = false` a bez `?opc=1` sa web nemení. **Nič naživo bez jeho súhlasu.**

### 10.6 Analytika GA4 (`assets/js/opc/analytika.js`)

OPC obchádza načítanie kroku 1 a pri zmene platby aj nové načítanie kroku 2. Udalosti, ktoré by inak poslal Shoptet, preto pošle OPC samo, ale len tam, kde ich Shoptet neposlal.

- **begin_checkout:** ✅ natívny krok 1 ho posiela inline cez `gtag('event', 'begin_checkout', {…})` (SK aj CZ fixtures), krok 2 nie.
  - Košík tesne pred prechodom zapíše do sessionStorage príznak `lcdOpcPreskocilKrok1` (platí 1 min).
  - Krok 2 s OPC príznak prečíta a hneď zmaže. Potom pošle begin_checkout s payloadom z HTML kroku 1, ktorý OPC aj tak sťahuje. Po F5 už nič.
  - Každá iná stránka s OPC (aj natívny krok 1 po prerušenom prechode) príznak zahodí, takže sa nikdy nepočíta 2× (S32 c).
  - Späť (OPC ho smeruje do košíka) a návrat prehliadačom na krok 2 nepošle nič, príznak už nie je (S32 a). Nový prechod z košíka pošle nový begin_checkout práve 1×, rovnako ako natívny krok 1 pri každom prechode.
  - 🟡 Keď krok 2 skončí v záchrane skôr, než stiahne krok 1 (sieť, presmerovanie na košík), begin_checkout sa nepošle, lebo chýba payload. Zákazník, ktorý ide cez odkaz na krok 1, ho dostane natívne.
- **add_payment_info:** ✅ krok 2 ho posiela pri načítaní s platbou zo session. `payment_type` má tvar `<data-payment-type>~<názov>`, napr. `transfer~Prevodom`, `shoptetpay~Apple Pay` (🟡 `cashOnDelivery~Dobierkou` podľa toho istého vzoru).
  - OPC ho pošle len pri potvrdenej zmene platby: nie pri prvom zobrazení, nie pri chybe a nie 2× za sebou pre tú istú platbu. Návrat na pôvodnú voľbu ešte v debounce nepošle nič, ani požiadavku na server (S33 a).
  - Platbu, ktorú session dostala inde, OPC len zapamätá a neposiela. Ide o overenie zo servera s inou platbou (stav chyba) a o prevzatie pri resyncu pred odoslaním (`prevzate` zo `sync.js`). Do GA ju poslala karta, ktorá ju zmenila (S33 b, jednotka `zname`).
  - 🟡 Zvyškové riziko: zmena, ktorá prešla na serveri len medzi dvoma rýchlymi voľbami a skončila chybou ďalšej voľby, sa do GA nepošle (nedá sa odlíšiť od zmeny z inej karty). Radšej chýbajúca udalosť než dvojité počítanie.
  - Payload je vzor zo skriptu kroku 2, vymení sa len `payment_type`.
  - Keď vzor alebo typ chýba, ide len vlastná udalosť `lcd_opc_platba` do dataLayer.
- **Fail-closed:** payload sa číta bez `eval`, cez `JSON.parse`. Volanie musí byť v skripte práve 1× a mať pole `items`, inak sa nič neposiela.
- **Bez `window.gtag`** (Shoptet bez GA) ani bez sessionStorage nevznikne chyba. Do GA nejde nič a zmena platby ide len ako `lcd_opc_platba` s typom do dataLayer (S33 c, jednotky).
- **Bez `?opc=1`** OPC nepošle nič (S32 b).
- **add_shipping_info:** ✅ každý web má jednu dopravu (SK 96 „Expres kurier DPD“, CZ 111 „Expres Kurýr“), takže sa doprava v OPC nemení a udalosť posiela Shoptet pri načítaní kroku 2. Ak pribudne druhá doprava, treba ju doplniť rovnako ako platbu. `checkout_progress` (starý formát) OPC neposiela.
- ❓ **Meta** (`fbq` InitiateCheckout / AddPaymentInfo, Shoptet FB CAPI): test bez súhlasu s cookies `fbq` na kroku 1 ani 2 nezachytil, preto sa zatiaľ nerieši.
- Testy: jednotky `analytika: …` a `sync: prevezmi`, scenáre S32 (begin_checkout: OPC, F5, Späť, nový prechod, natívny tok, prerušený prechod) a S33 (add_payment_info: chyba, debounce, iná karta, bez gtag), SK aj CZ.

### 10.7 Kolo 29. 10. 2026 (variant A) – čo pribudlo

Všetko je na lokálnej vetve `opc-prototyp`. Nič sa nepushovalo, `SPUSTENE = false`, živý web ani admin Shoptetu sa nemenili. Spoločný kód (`cart.js`, `lcdKosikDoplnok.js`, `main.js`) sa v tomto kole nemenil.

| Téma | Commit | Čo sa zmenilo | Prečo (živý dôkaz, § 11) | Test |
|---|---|---|---|---|
| Fixtures mimo gitu | cd3483a | `tools/test-opc/fixtures/` je v `.gitignore` a postup je v `tools/test-opc/FIXTURES.md`. Bez fixtures testy skončia hláškou s návodom, nie pádom. **Do `main` len squash merge**, lebo staré bloby fixtures ostali v histórii vetvy a nesmú na GitHub | VOP Shoptet čl. 11.3: kópie JS/CSS Shoptetu nikdy do gitu (pokuta 100 000 Kč) | jednotka `zachytene`; `git ls-files` fixtures = 0 |
| Prísne 303 | fbc1b74 | úspech Step1Validate len pri 303 + `returnUrl` krok 2 toho istého webu + bez `messages.errors`, odmietnutie sa neopakuje | neplatná voľba vracia 303 s chybami a krokom 1; bez session prichádza HTML (T7b) | S28, jednotky |
| Potvrdenie cez GET krok 1 | 917ce50 | súhrn kroku 2 sa skladá z GET kroku 1 (limit 4 s), záloha GET krok 2; `step2CustomerAjax` sa nevolá | `step2CustomerAjax` vracia `payload: []` | S3, S15, jednotky |
| Zámok pri odoslaní | e398f6f | od pustenia submitu k Shoptetu je sekcia Doprava a platba zamknutá (rádiá disabled + inert, sync nič nepošle), „Odosielam…“; odomkne `ShoptetFailedValidation`, `pageshow`, limit 20 s | T3-L7: zmena platby počas overovania telefónu odišla a objednávka mala inú platbu, než stránka ukazovala | S29 |
| Resync pred odoslaním | f3dd88f, kniha 43d0e42 | po kliku Objednať Step1Validate so zobrazenou voľbou + GET krok 1; voľba aj „Celkom k úhrade“ musia sedieť, inak neodíde a súhrn sa prevezme | T5a/T5b (iné okno zmenilo platbu), T6a/T6b (iné okno zmenilo košík) | S30, S31 |
| Analytika GA4 | 276d80e | `begin_checkout` 1× pri preskočenom kroku 1, `add_payment_info` pri potvrdenej zmene platby, bez dvojitého počítania (§ 10.6) | T9a: krok 1 posiela begin_checkout, krok 2 nie; T12: tvar `payment_type` | S32, S33, jednotky |
| Druhá revízia | f3e93a6, 4da8ee8, c3b1067, efd2813, 329d3bf, 065ea7d, kniha 133e2a0 | opravy v § 10.2 (druhá tabuľka) | – | S22, S24, S29, S31, S34–S36, jednotka „CSS OPC“ |

**Revízie tohto kola** (nezávislé, offline cez podvrh, repo nemenili; podklady `…/scratchpad/opc/rev-a/`):
- **Správnosť objednávky:** 3 nálezy.
  - vysoká: resync posielal pri rýchlej platbe 112 Step1Validate bez `shoptetPayPisCode` → opravené 4da8ee8 (S34),
  - stredná: zlyhaná kontrola pred odoslaním bez cesty ďalej → opravené c3b1067 (S35),
  - nízka: 2 Google API kľúče v gite → mimo OPC, § 6.13 bod 8.
  - Bez nálezu (adversariálne overené): Enter aj 2× Enter v poli, pomalý telefón s chýbajúcim číslom domu, dvojklik, odložené odoslanie, analytika bez dvojitého počítania, Meta CAPI pri sťahovaní kroku 1 na pozadí.
- **Vzhľad finálnej stránky:** 9 nálezov.
  - vysoká: komentáre `//` v CSS zahodili pravidlá → opravené f3e93a6,
  - stredná: košík ukazoval 3 kroky → opravené efd2813,
  - 6 nízkych opravených (f3e93a6, efd2813, 329d3bf): vysvetlenie v zamknutej sekcii, kontrast „Odosielam…“, „Späť do košíka“, „Zmeniť štát“, šípka pri rýchlej platbe, rozpis kamióna v zbalenom súhrne,
  - 1 mimo OPC (kontrast šablóny, rozpis kamióna 12,5 px, § 6.13 body 6–7).
  - Bez nálezu: vodorovný posun (0 vo všetkých stavoch a šírkach 360–1920), písmo ≥ 14 px (hlavné 16 px), CZ bez slovakizmov, nikde „s DPH“ ani „vyrábame“, poradie stránky podľa náčrtu A.
- **Nový nález pri teste opráv** (vysoká): na PC tlačidlo pod koncom obsahu (bočný panel Shoptetu) → opravené 065ea7d (S22, S35 na 1366).

**Finálne snímky variantu A** (offline podvrh, vymyslené údaje, lišta dole na snímkach celej stránky skrytá, lebo je to artefakt snímania): `C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/snimky/variant-a-final/`
- `sk-390-kosik-vrch.png` – košík, telefón,
- `sk-390-finalna-cela.png`, `sk-1366-finalna-cela.png` – finálna stránka SK celá,
- `cz-390-finalna-cela.png`, `cz-1366-finalna-cela.png` – finálna stránka CZ celá,
- `sk-390-dobierka-sekcia.png`, `sk-390-dobierka-suhrn.png` – dobierka („+ záloha“, poučenie, súhrn €13),
- `sk-390-set.png`, `sk-390-set-doprava.png` – set autokobercov (termín „Doručenie medzi 19. 11. a 27. 11.“, riadok o tovare na mieru nad tlačidlom).
- Kontrola snímok: všetky stavy bez vodorovného posunu (posunX ≤ 0), poradie údaje → adresa → doprava → platba → súhrn → súhlas → Objednať, „Späť do košíka“ / „Zpět do košíku“, „Zmeniť štát“ / „Změnit zemi“. Nová chyba nenájdená. Skript snímok: `…/scratchpad/opc/skripty/snimky-variant-a.mjs`.

**Výsledok testov po tomto kole:** pozri § 10.4 (posledný blok).

### 10.8 Rozhodnutia Michala 29. 10. 2026 (popoludnie) – termín, VOP, banka, „Objednať“ stále viditeľné

**Zdroj VOP:** živé obchodné podmienky stiahnuté 29. 10. 2026 jedným GET: SK `https://www.luxurycardesign.sk/obchodne-podmienky/`, CZ `https://www.luxurycardesign.cz/obchodni-podminky/` (kópia a text: `C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/vop/`, `sk-vop.txt`, `cz-vop.txt`). Každá právna veta na finálnej stránke má odkaz na obchodné podmienky (nová karta, rozpísaná objednávka ostane).

**1. Termín doručenia bez dátumov** (§ 8 otázka 2 → b). Kód: `vzhlad.js terminDorucenia(druh)`, `texty.js termin`.

| | Pred | Po |
|---|---|---|
| SK koberce, rohože, box | „Doručenie medzi 19. 11. a 27. 11.“ | „Doručenie do 21–29 dní“ |
| SK kamión | „Doručenie medzi 12. 11. a 23. 11.“ | „Doručenie do 14–25 dní“ |
| CZ | „Doručení mezi … a …“ | „Doručení do 21–29 dnů“ / „Doručení do 14–25 dnů“ |
| vzorky, poukážka | bez termínu | bez termínu |

**2. Záloha pri dobierke** (sivý riadok pri zvolenej dobierke, SK § 15 ods. 1 písm. k, CZ § 1820 odst. 1 písm. q OZ).
- ✅ VOP SK bod 4.13: „Objednávka, pri ktorej si Kupujúci zvolí spôsob platby na dobierku, je podmienená úhradou zálohovej faktúry vo výške 50 % z celkovej ceny objednávky.“ Bod 4.15: „Kúpna cena pri platbe na dobierku je splatná pri prevzatí tovaru…“ Bod 4.9: zálohová faktúra sa posiela elektronicky na e-mail z objednávky. ✅ VOP CZ bod 4.13 a 4.15 rovnako (50 %).
- SK pred: „Pri dobierke Vám po objednávke pošleme zálohovú faktúru. Zvyšok zaplatíte kuriérovi pri prevzatí.“
- SK po: „Pri dobierke najprv uhradíte zálohovú faktúru na 50 % z ceny objednávky, zvyšok zaplatíte pri prevzatí – [podľa obchodných podmienok, bod 4.13](/obchodne-podmienky/).“
- CZ pred: „U dobírky Vám po objednávce pošleme zálohovou fakturu. Zbytek zaplatíte kurýrovi při převzetí.“
- CZ po: „U dobírky nejprve uhradíte zálohovou fakturu na 50 % z ceny objednávky, zbytek zaplatíte při převzetí – [podle obchodních podmínek, bod 4.13](/obchodni-podminky/).“
- Výška zálohy je vo VOP (50 %), `TODO-MICHAL` odpadol.

**3. Tovar na mieru – nemožnosť odstúpiť** (sivý riadok pod súhlasmi, nad tlačidlom; SK § 19 ods. 1 písm. c, CZ § 1837 písm. d OZ).
- ✅ VOP SK bod 6.13: „Ak sa Obchodník a Kupujúci nedohodnú inak, Kupujúci nemôže odstúpiť od zmluvy v prípade tovaru zhotoveného podľa špeciálnych požiadaviek, alebo tovaru, ktorý vzhľadom na jeho vlastnosti nemožno vrátiť, pokiaľ výroba tohto tovaru bola začatá, tovar už bol vyrobený, alebo dodaný.“ Bod 1.7: „…najmä luxusných autokobercov zhotovovaných na mieru podľa požiadaviek Kupujúceho.“ ✅ VOP CZ bod 6.13 a 1.7 rovnako.
- SK pred: „Koberce sa pripravujú na mieru, preto pri nich nie je možné odstúpiť od zmluvy.“
- SK po: „Koberce sa pripravujú na mieru Vášho auta, po začatí výroby od zmluvy nemožno odstúpiť – [podľa obchodných podmienok, bod 6.13](/obchodne-podmienky/).“
- CZ pred: „Koberce se připravují na míru, proto u nich nelze odstoupit od smlouvy.“
- CZ po: „Koberce se připravují na míru Vašeho auta, po zahájení výroby nelze od smlouvy odstoupit – [podle obchodních podmínek, bod 6.13](/obchodni-podminky/).“
- Pôvodná veta tvrdila viac ako VOP (odstúpiť sa nedá až po začatí výroby). Nová drží znenie bodu 6.13.
- **Rozsah riadku podľa VOP:** áno pri autokobercoch (aj sety 1V), rohožiach do kufra (na webe „autokoberce do kufra“) a kobercoch do kamiónov. 🟡 Samotný box do kufra nie: VOP ho ako tovar na mieru neuvádza (bod 1.7 hovorí o autokobercoch, bod 6.13 o tovare podľa špeciálnych požiadaviek). Vzorkovník a poukážka nie. Kód `vzhlad.js naMieru` sa nemenil, rozsah bol rovnaký.

**4. Spôsoby platby v záchrane** (sekcia Doprava a platba sa nenačíta; SK § 17 ods. 2). Pod odkazom „Zmeniť dopravu alebo platbu“ je nový sivý riadok.
- ✅ VOP SK bod 4.5: Apple Pay, Google Pay, on-line platba kartou, on-line bankový prevod, dobierka (hotovosť alebo karta kuriérovi), rýchla platba cez banku (Shoptet Pay). ✅ VOP CZ bod 4.5 a)–f) rovnako.
- SK: „Spôsoby platby: Apple Pay, Google Pay, platba kartou online, bankový prevod, dobierka (záloha 50 %), rýchla platba cez banku – [podľa obchodných podmienok, bod 4.5](/obchodne-podmienky/).“
- CZ: „Způsoby platby: Apple Pay, Google Pay, platba kartou online, bankovní převod, dobírka (záloha 50 %), rychlá platba přes banku – [podle obchodních podmínek, bod 4.5](/obchodni-podminky/).“

**5. Rýchla platba cez banku (len SK)** ostáva ako riadok s odkazom „Vybrať banku“ (§ 8 otázka 6, doplnok). Kód bez zmeny.

**6. „Objednať“ stále viditeľné a klik pri chýbajúcom poli** (§ 6.2 riadok 10, § 6.3, § 6.4). Michal: „strašne veľa musí zákazník scrollovať… sticky button objednať… keď niečo nemá vyplnené, vyroluje ho to na to, zobrazí sa to červeným“.
- **Telefón a tablet:** lišta dole „Celkom 274 € | Objednať s povinnosťou platby“ (predtým „Celkom · K súhrnu“). Text je prevzatý z tlačidla Shoptetu, CZ „Objednat s povinností platby“. Klik je klik na `#submit-order`. Lišta zmizne, keď je tlačidlo na obrazovke. Súhlas ju už neskrýva (predtým áno), aby „Objednať“ bolo vidno stále. Stav tlačidla („Odosielam…“, čakanie) je aj v lište. Výsledná hláška pri tlačidle (napr. „Objednávka neodišla…“) sa po kliku v lište posunie na obrazovku.
- **PC:** bočný panel sleduje obrazovku (Shoptet). Keď je panel vyšší ako okno (set, kamión) a zákazník je navrchu, ukáže sa karta nad stĺpcom súhrnu (S39).
- **Klik pri chýbajúcom alebo zlom poli** (`assets/js/opc/kontrola.js`, nový modul): posun na prvé zlé pole v poradí na stránke, červený rám, text Shoptetu pod poľom („Zadajte telefónne číslo.“, „Potvrďte svoj súhlas.“ atď., inak „Toto pole treba vyplniť.“ / „Toto pole je potřeba vyplnit.“), kurzor v poli. Rám zmizne už pri písaní. Ďalší klik → ďalšie pole. Pri neúplnom formulári nejde na server nič, ani kontrola pred odoslaním (predtým išla 2 požiadavky a potom Shoptet ukázal všetky chyby naraz).
- Keď je všetko v poriadku, odoslanie ide bez zmeny: kontrola so serverom (resync), zámok, analytika, natívny Step2Validate práve 1× (S37, S39). Chyba, ktorú nájde až Shoptet (telefón neprešiel overením), sa ukáže rovnako (S38). Meranie: `lcd_opc_chyba` s `lcd_opc_typ: "pole"`, `lcd_opc_pole`, `lcd_opc_dovod`.
- Snímky stavov: `C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/dizajn/spravanie/` (`<web>-<šírka>-chybaMeno-po-kliku.png`, `-chybaTelefon-po-kliku.png` = klik s prázdnym telefónom, `-chybaSuhlas-po-kliku.png`, `-lista-vrch.png`, `sk-1366-kartaPc-vrch.png`, `-set-*.png`, `-zachrana-suhrn.png`, `-dobierka-*.png`).

**7. Otvorené po tomto kole:**
- ⛔ **Dodacia lehota:** VOP SK bod 5.9 / CZ bod 5.8 „v lehote od 30 do 90 pracovných dní…, štandardná dodacia lehota je približne 50 pracovných dní“. Na finálnej stránke je „Doručenie do 21–29 dní“ (Michal 29. 10., pamäť 22. 10.). Zosúladiť VOP s webom, alebo text?
- ⛔ **DPH:** VOP SK aj CZ bod 4.11 „Obchodník je platcom DPH“ a bod 4.1 „vrátane dane z pridanej hodnoty“. Pravidlo webu je „nie sme platcami DPH“, na stránke DPH nie je (S18).
- ⛔ **CZ rýchla platba:** VOP CZ bod 4.5 f) ju uvádza, CZ pokladňa ju nemá. Zoznam v záchrane drží VOP.
- ⛔ **Postup objednávky vo VOP:** body 3.3.4 a 3.3.5 opisujú dva kroky („Pokračovať“ s dopravou a platbou, potom údaje). Pred spustením OPC pre zákazníkov (F5) treba upraviť text VOP.
- 🟡 VOP bod 4.9 „Zálohová faktúra je vystavená… po úhrade kúpnej ceny“ sa bije s bodom 4.13 (záloha pred dobierkou). Veta na stránke drží bod 4.13.
- 🟡 Slovo „výroba“ je z VOP 6.13. Michalovo pravidlo „nikdy vyrábame“ sa týka tvrdenia, že LCD vyrába. Veta to netvrdí, ale nech ju Michal pozrie.
- 🟡 Karta „Objednať“ na PC môže na chvíľu zakryť spodok bočného panela (súhlas), kým zákazník neposunie stránku (`sk-1366-kartaPc-vrch.png`).

### 10.9 Doladenie 1 (29. 10. 2026 večer) – zobáčik pri položke, fotka v súhrne, košík v štýle pokladne

**Zadanie:** Michal schválil 29. 10. náhľady v `…/scratchpad/opc/nahlad-2/` (2a, 2b, 4, 1, 5). Všetko len pod `?opc=1`. `SPUSTENE = false`, nič sa nepushovalo, admin Shoptetu ani živý web sa nemenili.

**Základ:** vetva `opc-prototyp` prebázovaná na `origin/main` (8de7717). Main už mal nový košík: bez „Pripravené pre“, „Rohož do kufra Classic“, hodnotenie z Google pri „Pokračovať“. Konflikt bol len v `.gitignore` (oba bloky ostali). `luxuryCar.css` sa zlúčil sám a `vloz-lcd-css.py --check` je OK. Pred prebázovaním bola vetva na f232658, záloha je v lokálnej vetve `opc-prototyp-pred-rebase-doladenie1`. Po prebázovaní prešli všetky testy (SK 82 OK, CZ 72 OK, jednotky, košík, kamión).

**A) Zobáčik pri každej položke** (`assets/js/opc/polozky.js`, volá ho `krok2.js`):
- Pod názvom položky v „Zhrnutí objednávky“ je zlatá pilulka „Zobraziť detail ⌄“ (CZ „Zobrazit detail“). Po ťuknutí sa zmení na „Skryť detail ⌃“ (CZ „Skrýt detail“).
- Je to `<button type="button">` s `aria-expanded` a `aria-controls`. Funguje Enter aj medzerník. Dotyková plocha má 44 px, pilulka 36 px.
- Predvolene je zbalené (telefón aj PC). Stav sa pamätá aj po prekreslení súhrnu Shoptetom alebo po zmene platby.
- Pod položkou je piesková karta s riadkami: Auto, Prvá prešívaná vrstva, Farba kože ● a Farba šitia ●, Rozloženie kobercov, druhá vrstva, nášivky a pri kamióne vozidlo a jeho voľby. Na konci je Počet, Cena a „Niečo nesedí? Upraviť v košíku“ (odkaz `/kosik/`).
- **Web bez prekrývania:** karta je natívny rozpis košíka z `cart.js` (`ul.lcd-rozpis`, pri kamióne `span.main-link-surcharges` s `.lcd-truck-cart-summary`). Kód ho **presunie** pod položku, nič neskrýva a nekopíruje.
- Riadok „Farba 1. vrstvy: Diamond Farba kože: Čierna / Farba šitia: Čierna“ sa v tom istom zozname rozdelí na 3 riadky. Bodka sa ukáže len pri známej farbe (koža z `box-kresba.js`, šitie z `kamion/data.js`). Neznáma farba, napríklad „Lux Color 10“, je bez bodky.
- Riadok, ktorý v rozpise nie je, sa nezobrazí. Počet a cena sú texty buniek súhrnu Shoptetu.
- Obsah a čísla `#summary-box` sa nemenia (jednotka „súhrn Shoptetu bez zmeny“).
- Zbalený súhrn navrchu na telefóne („Vaša objednávka“) ukazuje rozpis ako doteraz, bez fotky a zobáčika (`vycistiKopiu`).

**B) Fotka v súhrne:**
- Košík (`opc/kosik.js` → `ulozFotky`) uloží do `sessionStorage.lcdOpcFotky` mapu `data-micro-identifier|data-micro-sku → URL malého náhľadu` (kód varianty pribudol po revízii, § 10.10). Náhľad je z `data-src` riadku košíka, `related/…?x=100&y=100`. Originál `/orig/` ani `data:` sa nepoužije.
- Krok 2 vloží `<img width=60 height=60>` vľavo od názvu. Výška položky je pred aj po načítaní fotky rovnaká (S42), fotka teda nič neposúva.
- Bez záznamu v mape je položka bez fotky a nič sa nerozbije.

**C) Košík v štýle pokladne** (`_lcdOpc.scss`, blok „KOŠÍK V ŠTÝLE POKLADNE“, len `html.lcd-opc-kosik`):
- piesok `#f7f5ef`, krokovník „① Nákupný košík“ (zlatý) → „② Objednávka“ (sivý),
- položky ako biele karty, súhrn ako karta so zlatým horným pruhom, zelené Pokračovať,
- ponuka „Doplňte svoj set“, hodnotenie z Google a Späť do obchodu ostávajú ako dnes.
- Trieda sa pridá hneď pri načítaní bundla (`opc/index.js vzhladKosikaSkoro`), nie až po `data.json`, aby obsah menej poskočil. Núdzový vypínač v `data.json` ju potom vráti späť aj s krokmi (`zrusVzhladKosika`, jednotka).
- **Bez `?opc=1` sa košík nezmenil.** Porovnanie pred/po (SK set, SK vzorkovník, SK kamión, CZ; 390 a 1366):
  - 0 odlišných pixelov na všetkých 8 snímkach,
  - DOM je rovnaký, keď sa odfiltruje poradie lišty a colorboxu na konci `<body>` a `loading="eager"` z menu. Tieto dve veci sa líšia podľa časovania, nie podľa kódu OPC.
  - Podklady: `…/scratchpad/opc/doladenie-1/kosik-pred/`, `kosik-po/`.

**D) Testy:**
- **S42** (`scenare-dizajn.mjs`) pokrýva:
  - zbalené → rozbalené klikom aj ťukom, Enter a medzerník, aria, 44 px, CZ texty,
  - karta obsahuje každé slovo rozpisu z košíka a auto, ktoré `toNote` zapíše do poznámky (`sessionStorage.model`; pri kamióne každú hodnotu `truckOrderSummary` a zhodu s príplatkami položky — od § 10.10),
  - „Prvá prešívaná vrstva“, bodky, počet, cena a odkaz do košíka,
  - stav po zmene platby,
  - fotka pri tej istej položke, 60 × 60, vľavo od názvu a bez posunu,
  - košík pod `?opc=1` (piesok, krokovník ① ②, karty, zlatý pruh, mapa fotiek) a bez `?opc=1` (bez triedy, mapy a krokov OPC),
  - košíky set, dve položky, kamión a vzorkovník (SK) a vzorkovník (CZ),
  - šírky 360, 390, 768, 1366, 1920 (rozbalené: pretečenie a písmo) a notebook 1366×657.
- Košík „dve“ je syntetický: set a 2. položka koberec do kufra (`podvrh.mjs sDvomaPolozkami`, sumy +129).
- **Červená fáza** (nové testy nad starým kódom 1997c43): S42 SK 390, SK 1366 aj CZ 390 ZLYHAL („košík ?opc=1 bez html.lcd-opc-kosik“). Jednotky padli na `ERR_MODULE_NOT_FOUND opc/polozky.js`.
- **Zmenené limity:**
  - S40: telefón set ≤ 2 380 px (predtým 2 350, set má teraz 2 355), položka rekapitulácie ≤ 120 px (predtým 1 riadok ≤ 72).
  - S41: „Objednať“ celé nad lištou sa vyžaduje na 1366×657. Na 1366×625 ho po novom rieši lišta, ako na 1280×577.
  - S24: rozpis kamióna sa číta aj z karty detailu (na chvíľu odkrytej). V krátkej rekapitulácii pribudol riadok „Zobraziť detail“.
- **Zelená fáza** (6058bab):
  - SK: všetkých 84 scenárov OK; S24 až po úprave testu, prvý beh ho mal v starej podobe,
  - CZ: 74 OK,
  - jednotky: 90 OK,
  - košík, auto, kamión, `vloz-lcd-css.py --check` a `build-admin-html.mjs --check`: OK.

**Výšky pred → po** (zbalené, offline podvrh; „Objednať“ = poloha tlačidla na stránke):

| Košík | Telefón 390×844: výška stránky | Telefón: položka | PC 1366: Objednať | PC: položka |
|---|---|---|---|---|
| SK set | 2 288 → 2 355 | 51 → 117 | 545–605 → 579–639 | 51 → 89 |
| SK dve položky | 2 347 → 2 463 | 51 / 59 → 117 / 109 | 603–663 → 679–739 (lišta na 657) | 51 / 59 → 89 / 101 |
| SK kamión | 2 285 → 2 334 | 48 → 97 | 542–602 → 579–639 | 48 → 89 |
| SK vzorkovník | 2 211 → 2 257 | 51 → 97 | 480–540 → 514–574 | 51 → 89 |
| CZ vzorkovník | 2 086 → 2 132 | 51 → 97 | 480–540 → 514–574 | 51 → 89 |

- Na PC sa výška stránky nemení (1 095 / 1 083 / 1 004 px), lebo bočný panel je kratší ako formulár.
- 1366×657: „Objednať“ je 579–639, celé nad lištou ako dnes.
- Telefón: CLS kroku 2 je 0 pred aj po.
- CLS košíka pod `?opc=1` na PC: 0,014 → 0,038 (set) a 0,064 → 0,099 (kamión). Telefón ostal 0. Bez `?opc=1` sa CLS nezmenil.

**Snímky** (`…/scratchpad/opc/doladenie-1/stavba/`):
- tie isté zábery ako náhľady: `1-kosik-mobil-390`, `2a-suhrn-zbaleny-mobil-390`, `2b-suhrn-rozbaleny-mobil-390`, `4-pc-1366-rozbaleny`, `5-kosik-pc-1366`,
- ďalej `4z-pc-1366x657-zbaleny-okno`, `cz-390-rozbaleny`, `sk-390-dve-polozky-rozbalene`, `sk-390-kamion-rozbaleny`,
- porovnanie náhľad vs. stavba: `porovnanie-2b-nahlad-vs-stavba-390.png`, `porovnanie-1-kosik-nahlad-vs-stavba-390.png`.

**Rozdiely oproti náhľadu:**
- Na PC má **zbalená** položka názov na 2 riadkoch (ako doteraz v dizajne A), napríklad „Luxusné autokoberce Dragonskin Basic…“. S 3 riadkami by „Objednať“ na 1366×657 zišlo pod lištu. Na telefóne sú 3 riadky ako v náhľade 2a. **Rozbalená** položka má od § 10.10 celý názov ako v náhľade 4.
- Na PC je pilulka bližšie k názvu a nadpis súhrnu o 4 px bližšie k položke (spolu −8 px). Dôvod je ten istý.
- Pilulka má písmo 16 px (v náhľade 15 px) podľa Michalovej mierky textu.
- Hodnotenie v košíku má „101 recenzií“ (v náhľade 89), lebo main má novšie dáta.

**Otvorené po tomto kole:**
- 🟡 CLS kroku 2 na PC je ~0,52–0,58 už pred týmto kolom. Pred aj po je rovnaké, posuny robí `div.cart-content`, `fieldset.box` a `ol.cart-header`, keď sa po `data.json` prepne dizajn A. Pred spustením (F5) treba prepínať štýl skôr, ako je to teraz pri košíku.
- 🟡 Košík pod `?opc=1` na PC: CLS +0,02 (set) a +0,035 (kamión) kvôli prestylovaniu po prvom vykreslení. Bez inline skriptu v hlavičke (admin) sa to celé neodstráni.
- 🟡 1366×625 (notebook s lištou záložiek): „Objednať“ je po novom za lištou s kartou, nie celé na obrazovke.
- ❓ Fotka 2. položky v teste „dve“ je fotka rohože z nášho CDN, nie skutočný náhľad Shoptetu. Košík s 2 položkami nie je zachytený zo živého webu.

### 10.10 Oprava po revízii doladenia 1 (29. 10. 2026 noc)

**Základ:** vetva prebázovaná na `origin/main` 0f43931 (3 nové commity mainu: obrázky kamiónov, recenzie raz za 2 týždne, test kamiónov v prehliadačoch; košík ani pokladňu nemenia). Záloha pred prebázovaním: lokálna vetva `opc-prototyp-pred-rebase-final`. Nič sa nepushovalo, admin ani živý web sa nemenili.

**Opravené:**
- **Kamión — test už nie je kruhový.** Detail kamióna (aj košík a poznámka objednávky cez `toNote` → `mergeTruckOrderSummaryIntoNote`) číta ✅ `sessionStorage.truckOrderSummary`, **nie príplatky položky** Shoptetu. S42 a snímky predtým zasievali kamión iný, než bol v príplatkoch zachytenej položky (K2, „Červené lemovanie“, bez nášiviek a tapacíru vs. čierna 11, lemovanie 04, nášivky H19 / 2999, tapacír). Teraz:
  - seed `KAMION` (`scenare-kosiky.mjs`, používa ho S10, S12 aj S42) zodpovedá príplatkom položky vo `fixtures/sk-kamion`,
  - S42 porovná detail kamióna s príplatkami položky (`cartWidgetSurchargeName`: materiál, farba, lemovanie, typ a farba nášiviek, tapacír). So starým seedom test zlyhá („chýba čierna“).
  - 🟡 Na živom webe to sedí, len kým `truckOrderSummary` v karte zodpovedá kamiónu v košíku (napr. nie po konfigurácii druhého kamióna v inej karte). Platí to aj pre poznámku objednávky, nie je to novinka OPC.
- **Auto pre poznámku sa naozaj overuje.** `#remark` je na kroku 2 prázdny (`toNote` ho plní až pri odoslaní), stará kontrola sa preto nikdy nevykonala. S42 teraz porovná detail so `sessionStorage.model` (presne to `toNote` zapíše ako „model: …“) a pri kamióne s každou hodnotou `truckOrderSummary`.
- **Fotka podľa kódu varianty:** kľúč mapy je `data-micro-identifier|data-micro-sku`. Dva sety toho istého produktu v inej farbe majú každý svoju fotku (jednotka).
- **Fotka sa musí načítať:** S42 kontroluje `naturalWidth > 0` (prázdny rámik = chyba).
- **Popis zobáčika pre čítačku:** `aria-describedby` na `.cart-item-name` položky (id `lcd-opc-nazov-N`). Kópia v zbalenom súhrne id nenesie (žiadne duplicitné id).
- **Rozbalená položka má celý názov** (trieda `lcd-opc-otvorena`, `display:block` + `-webkit-line-clamp:none`) ako v náhľade 2b a 4. Zbalená ostáva na telefóne na 3 riadkoch a na PC na 2 riadkoch. Samotné `line-clamp:none` nestačí: `-webkit-box` bez orezania Chrome kreslí ako starý flexbox a veľké začiatočné písmeno (`::first-letter`) zmizlo („luxusné“). Zachytené na snímke, opravené.
- **Testovacie dáta „dve“:** súčet riadku 2. položky je €129, „Celkom za tovar“ €398 (predtým €398 pri oboch riadkoch). S42 kontroluje súčty riadkov košíka proti celku.
- **FIXTURES.md:** namiesto neplatných hashov popis commitov a príkaz na ich nájdenie. Pribudlo varovanie: kópia repa má fixtures dostať cez `LCD_OPC_FIXTURES`, nie junction (rekurzívne mazanie kópie by zmazalo fixtures). Junction v `…/doladenie-1/pred-koren` sú odstránené (`rmdir` bez rekurzie), node_modules aj fixtures ostali celé.

**Testy:**
- Červená fáza (testy nad kódom pred opravou): jednotky 3 ZLYHALO (kľúč fotky, popis zobáčika, súčty „dve“). S42 SK aj CZ ZLYHAL na mape fotiek. Samostatne overené: so starým seedom kamióna S42 zlyhá na zhode s príplatkami („chýba čierna“), bez CSS pravidla zlyhá na 1366 („rozbalená položka má orezaný názov“).
- Zelená fáza: SK 84 OK, CZ 74 OK, jednotky 93 OK, `test-kosik-doplnok` 91 OK, `test-kosik-rozpis`, `test-auto-pamat` 21 OK, `test-auto-vyber`, `test-kosik-auto-hodnotenie`, `test-kamion-kosik` 464 OK, `vloz-lcd-css.py --check` a `build-admin-html.mjs --check` OK. Po oprave `::first-letter` znova S24, S40, S41, S42 (SK 8 OK, CZ 6 OK) a jednotky.
- Výšky zbalené sa nezmenili (telefón set 2 355 px, PC 1366×657 „Objednať“ 579–639).

**Snímky** (`…/scratchpad/opc/doladenie-1/final/`): tie isté zábery ako v `stavba/` a porovnania `nahlad-vs-stavba-2b.png`, `nahlad-vs-stavba-kosik.png`. Skript snímok (`_skript/snimky-krok2-final.mjs`) pred snímkou fotky dekóduje. Prázdny rámik 2. položky v `stavba/` bol artefakt snímania mimo okna, fotka sa v teste načítala (`naturalWidth` 720).

**Na rozhodnutie Michala (nezmenené):**
- 🟡 **Zbalená položka na PC: 2 riadky názvu.** Na 1366×657 je „Objednať“ zbalené na 579–639. Lišta sa zapína, keď je horný okraj tlačidla nižšie ako výška okna mínus 72 px, teda 585. Tretí riadok názvu (+~21 px) by tlačidlo posunul pod lištu. Možnosti: (a) 3 riadky aj zbalené a „Objednať“ na 1366×657 rieši lišta, (b) nechať 2 riadky (teraz).
- 🟡 **1366×625** (notebook s lištou záložiek): „Objednať“ je zbalené na 579–639 a zakryje ho lišta s tým istým tlačidlom. Predtým bolo 545–605 celé na obrazovke. Späť by to dostalo len odstránenie fotky alebo zobáčika na PC.

### 10.11 Doladenie 2 (30. 10. 2026) – názov na 2 riadky, fotka bez rámika, CLS kroku 2

**Zadanie:** tri drobnosti z revízie doladenia 1. Všetko len pod `?opc=1`, `SPUSTENE = false`. Nič sa nepushovalo, admin Shoptetu ani živý web sa nemenili. Vetva `opc-prototyp` od f384817 bez prebázovania.

**Pred zmenou** ✅ (logy `…/scratchpad/opc/doladenie-2/logy/pred-*.log`): SK 84 OK, CZ 74 OK, jednotky 93 OK (zhodné s § 10.10).

**1) Zbalený názov najviac na 2 riadkoch, PC aj telefón** (`_lcdOpc.scss`, preč pravidlo `-webkit-line-clamp:3` pre šírku < 992 px):
- 🟡 3 riadky **na PC** sa v offline podvrhu nepotvrdili. SK set na 1366×657 mal zbalený názov na 2 riadkoch v Chromiu, WebKite aj Firefoxe (3. riadok orezaný). 3 riadky mal **telefón** podľa náhľadu 2a. Teraz sú 2 riadky všade.
- Telefón set: položka 117 → 97 px, stránka 2 355 → 2 334 px. PC 1366×657: „Objednať“ ostáva na 579–639, v súhrne, bez lišty.
- Rozbalená položka ukazuje celý názov s veľkým začiatočným písmenom (blok z 0e2e877, snímky nižšie).
- Test S42: zbalený názov má najviac 2 viditeľné riadky na 360, 390, 768, 1366, 1920 a 1366×657.
- Otázka z § 10.10 (3 alebo 2 riadky zbalené na PC) je týmto zadaním uzavretá: 2 riadky na PC aj na telefóne. Otázka 1366×625 ostáva otvorená.

**2) Fotka, ktorá sa nenačíta** (`opc/polozky.js`):
- Pri chybe načítania (404, chyba siete) sa odstráni `<img>` aj trieda `lcd-opc-s-fotkou`. Názov a zobáčik začínajú pri ľavom okraji položky, prázdny rámik 60 px neostane.
- Zlá adresa sa pamätá v stave položiek (`zle`). Prekreslenie súhrnu Shoptetom (zmena platby) ju už nevloží.
- Test S43: mapa fotiek s adresou, ktorú podvrh vráti ako 404 (SK set, CZ vzorkovník, 1366 aj 390, aj po zmene platby). K tomu jednotka s udalosťou `error`.

**3) CLS kroku 2** (`opc/index.js vzhladKrok2Skoro`, `opc/krok2.js odkry`, `_lcdOpc.scss`):
- **Príčina:** natívny krok 2 sa vykreslil (prvé vykreslenie ~120 ms v podvrhu). Po data.json sa prepol dizajn A (karty, polia, súhrn s fotkou a zobáčikom). Po kroku 1 pribudla sekcia, kroky a zbalený súhrn, takže obsah poskočil dvakrát.
- **Riešenie:** pri načítaní bundla (koniec `<body>`, brána ako pri košíku: `?opc=1` alebo flag, len krok 2 SK a CZ) dostane `html` triedu `lcd-opc-caka`. Formulár aj súhrn sú `visibility:hidden` aj s potomkami a bez prechodov, rozloženie sa nemení. Dizajn A (`html.lcd-opc`) pridá `initKrok2` ako doteraz, po `initCart`. Keď stojí sekcia (`postav`) alebo záchrana, formulár sa odkryje naraz. Odkrytie trvá 2 snímky: v prvom je nové rozloženie ešte skryté, v druhom sa ukáže. Posun skrytého obsahu sa do CLS neráta.
- **Poistky:**
  - pomalý krok 1: formulár sa odkryje najneskôr 3 s od začiatku stránky (aspoň 0,8 s po štarte `initKrok2`), vtedy s „Načítavam dopravu a platbu…“. Táto karta drží približnú výšku sekcie (SK 606 / 467 / 483 px, CZ 482 / 388 / 404 px pre telefón / tablet / PC),
  - data.json do 3 s nepríde (`initOpc` nebežal): dnešný krok 2,
  - `data.json "opc": false` alebo flag „0“: trieda preč, dnešný krok 2,
  - výnimka v `initKrok2`: formulár sa odkryje.
  - Po 0,4 s čakania je nad formulárom „Načítavam…“ (`data-lcd-opc-nacitava`). Text je absolútne umiestnený, takže nič neposunie.
- **Čo nevyšlo cestou:**
  - Tlačidlá a odkazy Shoptetu (`#submit-order`, `.btn`, `a.main-link`) majú `transition: all`. Pri skrytí by `visibility` ostala „visible“ počas celého prechodu, takže ich posun sa rátal (CLS 0,104). Preto `transition:none` počas čakania.
  - Skorá trieda `html.lcd-opc` už pri načítaní bundla zmenila rozloženie, ktoré na telefóne videl štart Shoptetu. Súhrn sa prekreslil, `changeDescription` bežal 2× a rozpis kamióna v karte ostal prázdny (S24 SK 390 ZLYHAL). Preto sa pri načítaní bundla len skrýva.
- **Meranie:** PerformanceObserver `layout-shift` od začiatku dokumentu. CLS je najväčšie okno relácie (ako web-vitals) a rátajú sa **všetky** posuny. ⛔ Údaj „Telefón: CLS kroku 2 je 0“ v § 10.9 bol omyl merania: ťuk na „Pokračovať“ v košíku dáva v teste `hadRecentInput` aj posunom na kroku 2, lebo prechod trvá v podvrhu menej ako 500 ms. Bez filtra mal telefón 0,413.

| CLS kroku 2 (Chromium, podvrh) | pred | po | po, pomalá sieť (data.json 0,6 s, krok 1 1,5 s) |
|---|---|---|---|
| SK set 1366×768 | 0,543 | 0 | 0 |
| SK set 1920×1080 | 0,43 | 0 | 0 |
| SK set 390×844 | 0,413 | 0 | 0 |
| CZ vzorkovník 1366×768 | 0,525 | 0 | 0 |
| CZ vzorkovník 1920×1080 | 0,416 | 0 | 0 |
| CZ vzorkovník 390×844 | 0,461 | 0 | 0 |

- Krok 1 pomalší ako poistka (3,3 s, odkryté s „Načítavam…“): SK 1366 0,01, SK 390 0,064 (zbalený súhrn navrchu pribudne až s krokom 1).
- 🟡 **Cena:** formulár je skrytý od načítania bundla po krok 1. V podvrhu je to ~0,1 s. Naživo je to čas data.json (s `?timestamp`, teda vždy zo siete) plus GET kroku 1. ❓ Naživo nemerané, odhad 0,3–0,7 s, najviac 3 s.
- Zvážené alternatívy:
  - (a) skorý dizajn A bez skrytia: CLS by závisel od toho, či bundle beží pred prvým vykreslením. V podvrhu je to náhoda (bundle ~137 ms, prvé vykreslenie 116–152 ms) a naživo s dlhším HTML skôr nie,
  - (b) skript v hlavičke (HTML kódy v admine): mimo rozsahu, admin sa nemení,
  - (c) skrytie do dokončenia: zvolené.
- Firefox a WebKit nemajú `layout-shift` API. CLS je merané len v Chromiu, vo WebKite a Firefoxe je vzhľad overený snímkami.

**4) Veľké začiatočné písmeno názvu aj v Safari** (`opc/polozky.js velkePismenoNazvu`, nález zo snímok WebKitu):
- Shoptet posiela názov malým písmenom („luxusné autokoberce…“). `::first-letter` vo WebKite (Safari, iPhone) na zbalenom názve (`-webkit-box` s `line-clamp`) neplatí, takže zbalený súhrn a súhrn bez fotky ukazovali „luxusné…“. Chromium a Firefox áno.
- Oprava: prvé písmeno prvého neprázdneho textového uzla odkazu sa zmení cez `toLocaleUpperCase(sk / cs)` priamo v texte. Zvyšok názvu a potomkovia (príplatky) sa nemenia. Volá sa pri každom vykreslení aj prekreslení súhrnu; keď je už veľké, nič sa nestane. Kópia v zbalenom súhrne navrchu ho preberá. `::first-letter` v CSS ostáva ako poistka.
- Košík `?opc=1` sa nemenil: tam je `a.main-link` blok a `::first-letter` platí vo všetkých troch prehliadačoch (overené vykreslením).
- Vykreslenie overuje `…/doladenie-2/_skript/pismeno.mjs` (Playwright). Porovnáva šírku vykresleného prvého znaku so šírkou veľkého a malého znaku v tom istom písme, takže vidí aj `::first-letter`. Kontrolované miesta: košík, súhrn zbalený, rozbalený a bez fotky (404), kópia navrchu; SK set, dve položky, kamión a CZ vzorkovník; 1366 aj 390. Pred opravou bolo vo WebKite 10 miest malým písmenom, po oprave je všetkých 117 miest veľkým (WebKit, Firefox, Chromium).
- Testy: S42 a S43 kontrolujú prvé písmeno v DOM (Chromium by chybu cez `::first-letter` skryl), jednotka kontroluje SK aj CZ diakritiku (ľ → Ľ, č → Č), opakované volanie a kópiu.

**Testy:**
- Červená fáza (8308fc3, 072c4ec, 091a5d8):
  - jednotky 1 ZLYHALO pri položke 2 a 1 ZLYHALO pri položke 3,
  - S42 SK 390 aj CZ 390 ZLYHAL (3 riadky),
  - S43 SK aj CZ ZLYHAL (prázdny rámik 60 px),
  - S44 SK 0,543 / 0,413 a CZ 0,525 / 0,461 ZLYHAL,
  - veľké písmeno: jednotky 2 ZLYHALO, S42 a S43 SK 1366 aj 390 ZLYHAL, vo WebKite 10 miest malým písmenom.
- Nové a zmenené testy:
  - S43 (fotka 404) a S44 (CLS),
  - podvrh má scenár `dataJsonMs` / `krok1Ms`,
  - `cakajOpc` čaká aj na odkrytie formulára,
  - jednotky čakajú aj na neskoré asynchrónne testy.
- Zelená fáza:
  - po ed93b24: SK 88 OK, CZ 78 OK, jednotky 95 OK,
  - po d71ad4a (veľké písmeno): SK 88 OK, CZ 78 OK (2 a 12 preskočených, fixtures len SK), jednotky 96 OK, `vloz-lcd-css.py --check` OK, `build-admin-html.mjs --check` OK.

**Snímky** (`…/scratchpad/opc/doladenie-2/<chromium|webkit|firefox>/`, Playwright cez adaptér podvrhu `…/doladenie-2/_skript/pw-ch.mjs`, skript `_skript/snimky.mjs`, merania `meranie.json`):
- `<web>-kosik-1366.png`, `<web>-kosik-390.png` (košík `?opc=1`),
- `<web>-krok2-1366x657-zbalene-okno.png`, `-rozbalene-okno.png`, `<web>-krok2-1366-rozbalene-cela.png`,
- `<web>-suhrn-1366-zbaleny.png`, `-rozbaleny.png`, `<web>-suhrn-390-zbaleny.png`, `-rozbaleny.png`, `<web>-krok2-390-okno.png`, `-cela.png`,
- `<web>-suhrn-1366-bez-fotky-404.png`, `<web>-suhrn-390-bez-fotky-404.png`,
- pre `sk` (set) aj `cz` (vzorkovník).

### 10.12 Náhľad 5 a súhlasy B1 (30. 10. 2026) a oprava po ich revízii

**Schválené Michalom 30. 10. 2026** („B1 + odsúhlasujem vizuálne, ktorý si mi poslal“):
- **Náhľad 5 – súhrn = rekapitulácia z košíka** (b7467b2): po „Zobraziť detail“ je pod názvom presne natívny rozpis z košíka (`ul.lcd-rozpis`, pri kamióne karty skupín `.lcd-truck-cart-summary`) v jeho vzhľade. Bez obrázkov, guličiek, riadkov Počet / Cena a „Niečo nesedí“. Položka bez rozpisu nemá zobáčik.
- **Súhlasy B1 – náhľad 3** (1c5257e): dve biele dlaždice 10 px od seba, povinný súhlas so zlatým rámom 2 px a štítkom „Povinné“, zaškrtnutý zelený, chyba = červený rám dlaždice a text Shoptetu pod ňou. Text súhlasov dáva Shoptet a nemení sa.

**Opravené po revízii** (každá oprava: najprv test v červenej fáze, potom kód):

| Nález | Čo bolo zle | Oprava | Test |
|---|---|---|---|
| K1-3 | Keď náš rozpis dobehol skôr, než Shoptet vložil `#shipping-billing-summary` (pomalé zariadenie, data.json z keše), pozorovateľ súhrnu spustil `changeDescription` druhýkrát a rozpis kamióna bez `truckOrderSummary` zmizol natrvalo | rozpis len pri nových `.cart-items` / `.cart-item` (a843737) | S24 (e65c1d0) |
| R1-3, UX-4 | Rozbalený detail kamióna: presunutý span príplatkov stratil dedenie z `a.main-link` – sivé písmo Source Sans 3 namiesto tmavého Exo 2 ako v košíku | span v detaile: `--o-ink`, Exo 2, rozostup .08 px (ba71d22) | S24, S42 (37d7f66) |
| N2 | Zbalený súhrn navrchu na telefóne pri kamióne so súhrnom: karty skupín skryté (`display:none` od 6d22385) | karty ako v pokladni, dt/dd 14 px (0389a21) | S42 (50de740) |
| N3 | Kópia kamióna bez súhrnu: riadok „Vozidlo“ 12 px (`.id--17 .model` s `!important`) | 14 px ako ostatné riadky (0389a21) | S24 (50de740) |
| N5 | Štítok „Povinné“ aj pri `.js-validate-required`, kontrola pred „Objednať“ túto triedu nehľadala | `SELEKTOR_POLI` + `.js-validate-required` (b6dcb63) | jednotky (69e3510) |
| UX-3 | Čítačka čítala „… osobných údajov POVINNÉ, začiarkavacie políčko, povinné“ | `content:"Povinné" / ""` – štítok len vizuálny (afa6949) | S45 (e0adcfd) |
| N6 | Miesto pre štítok (24 px) dostával prvý súhlas podľa poradia | margin-top štítku povinného súhlasu, obal `flow-root` (afa6949) | S45 (e0adcfd) |
| K1-2 | PC: Tab na povinný súhlas nechal dlaždicu pod kartou „Celkom \| Objednať“ (skrytý vstup 1 × 1 px je v okne, WebKit neráta scroll-padding) | `scroll-padding-bottom:96px` pri karte + posun v `krok2.js` pri `:focus-visible` (e3af177) | S45 (4afcbb0) |

- Pri dnešnom poradí súhlasov sa polohy nezmenili (SK 1366: dlaždice 398–518 / 528–602, „Objednať“ 677–737).
- Kamión rozbalený na PC je vyšší (1 727 → 1 788 px), Exo 2 je širšie.
- 🟡 **UX-4 je drobná zmena písma oproti obrázku náhľadu 5** (tam dt/dd kamióna mali Source Sans 3). Urobená podľa textu schválenia „v rovnakom vzhľade ako v košíku“ – v košíku aj v pokladni je Exo 2. Ak by Michal chcel písmo z obrázka, stačí vrátiť `font-family` na spane a v S42 očakávať Source Sans 3.
- Overené aj Playwrightom (WebKit, Firefox, Chromium): K1-2 všetky cesty Tab (zo súhrnu, od mena, Shift+Tab od „Objednať“) pre SK set, set2v, kamión, CZ vzorkovník na 1366×657 a kamión na 1920×1080 – dlaždica s obrysom celá nad kartou.

**⛔ Otvorené – čaká na rozhodnutie Michala** (zmena vzhľadu nad rámec schváleného, preto bez opravy):

1) **Notebook 1366×657: „Objednať“ už nie je na prvej obrazovke** (K1-1, R1-1, UX-1, N1). Dlaždice B1 pridali do bočného panela ~98 px. Michal schválil vzhľad dlaždíc na výreze panela, kde bola karta skrytá (`nahlad-3/_skript/render.mjs` r. 183), nie stratu tlačidla.

| 1366×657, zbalené, navrchu | pred B1 (b7467b2) | teraz |
|---|---|---|
| SK set, kamión | „Objednať“ 579–639, bez karty, veta o tovare na mieru 512–569 | „Objednať“ 677–737 pod oknom, karta 581–657 zakryje spodok nepovinnej dlaždice (21 px) aj vetu o tovare na mieru (610–667) |
| SK vzorkovník | 514–574, bez karty | 612–672, karta |
| CZ vzorkovník | 514–574, bez karty | 590–650, karta (prah 585) |
| 1366×768 | celé, bez karty | celé, bez karty |

- Testy S41 a S42 boli v 1c5257e zmiernené (stačí karta a povinný súhlas nad ňou). Od 8a5f221 info behu píše „POZOR … čaká na rozhodnutie Michala (§ 10.12)“, aby to nebolo potichu OK.
- Možnosti (všetky menia schválený vzhľad na PC, preto najprv náhľad a Michalov súhlas):
  - (a) Prijať kartu na 1366×657. Aspoň vetu o tovare na mieru (náš text) dať na PC nad súhlasy, aby ju karta nezakryla.
  - (b) Na PC (≥ 992 px) kompaktné dlaždice (napr. okraj 14 px, výška 48 px, odsadenie 10 px) a nepovinný súhlas pod „Objednať“. Zmerané: SK set „Objednať“ 574–634 bez karty, CZ 487–547.
  - (c) Dlaždice B1 len pod 992 px, na PC pôvodné kompaktné súhlasy so štítkom „Povinné“.
  - Samotné zhutnenie dlaždíc nestačí: SK set by mal „Objednať“ ~615–677, stále pod prahom karty.
- Snímky celej prvej obrazovky pre Michala: `…/scratchpad/opc/stavba-6/overenie/ux-1/chromium-PRED_B1-sk-set-1366x657.png` a `chromium-HEAD-sk-set-1366x657.png`, porovnanie `…/stavba-6/overenie/porovnanie-sk-set-1366x657-pred-vs-B1.png`.

2) **Štítok „Povinné“ má malý kontrast** (UX-2, N4). Biele písmo 12 px na zlatej #c49b31 = 2,60 : 1, WCAG AA žiada 4,5 : 1 (zelený 5,13 a červený 5,44 sú v poriadku). Kód zodpovedá schválenému náhľadu 3. Možnosti: tmavé písmo `--o-ink` na tej istej zlatej (7,25 : 1) alebo tmavšia zlatá `--o-gold-lo` #8f7020 (4,66 : 1) či `--o-gold-t` #7c5f16 (5,99 : 1). Najprv náhľad staré → nové.

---

## 11. Živý dôkaz 28./29. 10. 2026

Skutočný web luxurycardesign.sk a .cz, anonymná session, v košíku vzorkovník. **Žiadna objednávka neodišla:** každý Step2Validate prehliadač zachytil a zrušil, poistka pustila len GET, `/action/Cart/*`, Step1Validate, súhlas s cookies a `step2CustomerAjax` Shoptetu. Košík bol na konci prázdny a overený (krok 1 aj krok 2 → `/kosik/`). Údaje zákazníka boli vymyslené alebo emulované lokálne.

Priečinok s dôkazmi (ďalej `D/`): `C:/Users/M/AppData/Local/Temp/claude/C--Users-M-Desktop-Luxury-Car-Design-Brain/5221ec94-54a1-4a44-a68d-4e616a31f2ac/scratchpad/opc/dokaz/`

- **Dôkaz 28. 10. (~23:41–23:45):** 6 behov, SK aj CZ × Chromium telefón, Chromium PC, WebKit iPhone. Kontroly SK 31 OK, CZ 30 OK, 0 zlyhaní, `PRESLO` 0. Súbor `D/dokaz/suhrn-vsetky-behy.json`, snímky `D/dokaz/<web>-<prehliadač>/`.
- **Skeptické overenie 29. 10. (~00:00–00:15):** 7 behov, `PRESLO` 0, 24 Step2Validate zachytených a zrušených. Súbor `D/skeptik/suhrn-skeptik.json`, detaily `D/skeptik/vysledky*/<beh>/`, logy `D/skeptik/beh-*.log`.

| Test | Čo sa zistilo | Značka | Súbor | Dôsledok v OPC |
|---|---|---|---|---|
| Zmena platby (všetky behy) | Step1Validate 303 za 126–150 ms, potvrdenie zo servera 143–240 ms, od kliku po novú sumu 275–396 ms (SK, Chromium telefón). Server mal vždy zvolenú platbu, suma sedela | ✅ | `D/dokaz/suhrn-vsetky-behy.json` (`prepinanie`) | základ § 6.5 |
| `step2CustomerAjax` | odpoveď `{"code":200,"message":null,"messages":[],"payload":[]}`, žiadne HTML súhrnu (všetkých 6 behov) | ✅ | `D/dokaz/suhrn-vsetky-behy.json` (`step2CustomerAjax`) | potvrdenie cez GET krok 1 (917ce50) |
| Neplatná voľba ruší krok 1 | SK Step1Validate s `billingId=87` (CZ id) vráti tiež `code 303`, ale s `messages.errors` („Prosím, vyberte si spôsob platby.“, „Fakturačné alebo doručovacie údaje sú neplatné“) a `returnUrl` krok 1. Potom GET krok 2 presmeruje na krok 1 a platba v session je preč | ✅ | `D/dokaz/suhrn-vsetky-behy.json` (`nepovolena`) | prísne 303 (fbc1b74); pri resyncu odmietnutie = záchrana (c3b1067) |
| T7b | Step1Validate bez session: HTTP 200, ale HTML košíka namiesto JSON (`code` null), krok 2 → `/kosik/` | ✅ | `D/skeptik/vysledky/sk-chromium-pc/beh.json` (`T7`) | „code null“ nie je úspech (fbc1b74) |
| T3-L7 | Shoptet čaká na overenie telefónu (oneskorenie 2,5 s emulované lokálne), zákazník medzitým ťukne dobierku: OPC poslal Step1Validate (303), Shoptet potom `form.submit()` → 1× Step2Validate. Stránka ukazovala Prevodom, server mal Dobierkou | ✅ (telefón 🟡 emulovaný) | `D/skeptik/vysledky3/sk-webkit-iphone/beh.json`, aj `vysledky4`, `vysledky5` (`T3`) | zámok sekcie pri odoslaní (e398f6f, S29) |
| T5 | T5a: karta A ukazovala prevod, iná karta prepla na dobierku → A odoslala Step2Validate bez platby v tele a server mal dobierku (riziko je aj v natívnom Shoptete). T5b: zopakovať zobrazenú voľbu tesne pred odoslaním → server má prevod, odoslanie práve 1× | ✅ | `D/skeptik/vysledky/sk-chromium-pc/beh.json` (`T5`) | resync (f3dd88f, S30) |
| T6 | T6a: košík zmenený v inej karte → krok 2 ostáva 200, server suma €15, karta A ukazuje €10. T6b: Step2Validate nenesie košík ani sumu → objednávka by bola s novým košíkom (natívne správanie Shoptetu) | ✅ | `D/skeptik/vysledky/sk-chromium-pc/beh.json` (`T6`, `T6b`) | resync porovnáva aj „Celkom k úhrade“ (f3dd88f, S31) |
| T9a | dataLayer: košík `view_cart`, krok 1 `begin_checkout`, krok 2 natívne aj po OPC `add_payment_info`, `add_shipping_info`, `checkout_progress` | ✅ | `D/skeptik/vysledky/sk-chromium-pc/T9-krok1-vedlajsie-ucinky.json`, `vysledky4/cz-chromium-mobil/` | OPC pošle chýbajúci `begin_checkout` (276d80e, § 10.6) |
| T9c | natívne „Pokračovať“ posiela Step1Validate s tými istými kľúčmi ako OPC; na SK navyše `shoptetPayPisCode=slovenska_sporitelna_oauth_client_sk` | ✅ | ten istý súbor (`natPokracovat`) | pri 112 OPC Step1Validate neposiela (S27, S34) |
| T11 | krok 2 je pre všetky platby rovnaký (polia, súhlasy, tlačidlo, skripty). Pri platbách Shoptet Pay (103, 106, 109, 112) pribudne 1 inline skript. Súhrn so 112: „Rýchla platba cez banku“, celkom €10 | ✅ | `D/skeptik/vysledky/sk-chromium-pc/T11-krok2-podla-platby.json` | súhrn 112 v podvrhu (S34) |
| T12 | ten inline skript je `gtag('event','add_payment_info', {…})` s `payment_type` napr. `shoptetpay~Apple Pay`. V konfigurácii `fbCAPIEnabled = true`, `fbPixelEnabled = true` | ✅ | `D/skeptik/vysledky2/sk-chromium-pc/T12-inline-platby.json` | tvar `payment_type` v analytike (§ 10.6) |
| T15 | karta: krok 2 po natívnom kroku 1 = krok 2 po OPC (polia, súhlasy, tlačidlo, skripty), SK aj CZ. Rozdiel je len v tele Step1Validate. Natívny krok 1 navyše volá `getShoptetPayStatus` (SK aj `getBankProviderData`) a `step2CustomerAjax`, OPC nie | ✅ stránka; ❓ či brána karty tie volania potrebuje | `D/skeptik/vysledky6/sk-chromium-pc/beh.json`, `vysledky6/cz-chromium-pc/beh.json` | overiť pri živom teste kartou (F4) |
| T4 | vlastný `step2CustomerAjax` Shoptetu na kroku 2 neposiela `billingId`/`shippingId`, voľbu OPC neprepíše. Súhrn na stránke však po ňom ostane starý | ✅ | `D/skeptik/vysledky/sk-chromium-pc/beh.json` (`T4`) | súhrn obnovuje OPC samo |
| T8a | Späť z kroku 2 vedie do košíka (krok 1 nie je v histórii) | ✅ | ten istý súbor (`T8`) | S20, S32 |
| T14 | zmazané len `PHPSESSID` (košík v `pcart` ostal): krok 2 sa hneď načíta, Step1Validate 303, krok 2 s prevodom €10 | ✅ | `D/skeptik/vysledky2/sk-chromium-pc/beh.json` (`T14`) | bez zmeny |
| T13 Meta | bez súhlasu s cookies žiadne `fbq` na košíku ani na krokoch 1 a 2; `connect.facebook.net` test blokoval | ❓ | `D/skeptik/vysledky2/sk-chromium-pc/beh.json` (`T13`) | Meta (`InitiateCheckout`, `AddPaymentInfo`, Shoptet FB CAPI) neimplementované; overiť so súhlasom s cookies pri živom teste (F4) |

🟡 **Zvyšky na overenie pri živom teste s Michalom (F4):** odpoveď Shoptetu po Step2Validate s chybou, platobná brána karty bez volaní z kroku 1 (T15), `payment_type` dobierky `cashOnDelivery~Dobierkou` (odvodené zo vzoru, naživo nevidené), Meta so súhlasom s cookies (T13). Či Shoptet pri session bez kroku 1 sám presmeruje (S35).
