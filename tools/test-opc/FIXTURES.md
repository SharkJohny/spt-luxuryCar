# Fixtures offline testu one page checkoutu

Priečinok `tools/test-opc/fixtures/` **nie je v gite** (`.gitignore`: `/tools/test-opc/fixtures/`). Každý si ho vyrobí lokálne.

**Prečo:** VOP Shoptet 07/2026 čl. 11.3 zakazuje mať v repe kópie JS Shoptetu (zmluvná pokuta 100 000 Kč). Vo fixtures je `cdn/` so súbormi Shoptetu (`main-3g.js`, `checkout-3g.js`, CSS, písma) a HTML krokov s inline skriptami Shoptetu.

Testy bez fixtures nebežia. `tools/test-opc.mjs`, `tools/test-opc-jednotky.mjs` aj `tools/test-opc-snimky.mjs` vtedy vypíšu zoznam chýbajúcich súborov s týmto návodom a skončia s exit 1. Iné umiestnenie sa dá zadať premennou `LCD_OPC_FIXTURES=<priečinok>`.

Kópia repa na porovnanie (napr. export starého commitu v dočasnom priečinku) má na fixtures ukazovať premennou `LCD_OPC_FIXTURES`, nie junction / symlinkom. Rekurzívne zmazanie takej kópie (PowerShell `Remove-Item -Recurse`, upratovanie dočasných súborov) môže zmazať aj cieľ junction a fixtures sa potom dajú obnoviť len novým zachytením zo živého webu. Ak junction už existuje, najprv ju odstráň bez rekurzie (`cmd /c rmdir <cesta k junction>`), až potom maž priečinok.

## Čo tam patrí

| Cesta | Obsah | Odkiaľ |
|---|---|---|
| `sk/`, `cz/` | `kosik.html`, `krok1.html` (pred Step1Validate), `krok1-dobierka.html` (po Step1Validate s dobierkou), `krok2.html`, `suhrn-<platba>.html` (`#summary-box` kroku 2 pre každú platbu), `step1-303.json`, `shoptetpay-*.json`, `zachyt.json` (záznam behu) | `test-opc-zachyt.mjs --web sk` / `--web cz` |
| `sk-set/`, `sk-kamion/` | košík, krok 1, krok 2, `suhrn-5.html`, `step1-303.json` pre set autokobercov a kamión | `test-opc-zachyt.mjs --web sk --kosik set` / `kamion --telo <súbor>` |
| `data.json` | kópia nášho `data.json` (dáta LCD, nie Shoptetu) | GET `https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/data.json` (adresa v `assets/js/option.js`) |
| `cdn/` | statické súbory Shoptetu a tretích strán (JS, CSS, písma, obrázky) + `manifest.json` (adresa → súbor) | `test-opc.mjs --doplnit-cdn` |
| `.gitattributes` | `* -text` (súbory bajt po bajte ako zo servera) | ručne |

Ďakovná stránka po objednávke **nie je zachytená** (ukáže sa raz po odoslaní objednávky, zachytenie objednávku neodosiela). Testy ďakovnej stránky (`test-opc-dakujeme.mjs`, scenáre S50–S53, `test-opc-dakujeme-prehliadace.mjs`) používajú **rekonštrukciu** z `tools/test-opc/dakujeme-fixtures.mjs` (je v gite, žiadny kód Shoptetu) v obale `sk|cz/krok2.html`. Skutočné HTML pribudne zo záznamu `lcdOpcDakujemeZaznam` po skúšobnej objednávke (kniha § 10.16).

## Ako ich znova vyrobiť

Z koreňa worktree. Zachytenie ide na **živý web v režime live-read**. Pravidlá platia vždy:
- povolené sú len GET, `POST /action/Cart/addCartItem|deleteCartItem/` a `POST /action/orderingProcess/Step1Validate/`,
- skript iné požiadavky (Step2Validate, step2CustomerAjax, prihlásenie) odmietne skôr, než odídu,
- formulár údajov sa nevypĺňa, objednávka nevznikne,
- na konci sa košík vyprázdni a overí (`/objednavka/krok-1/` → 302 `/kosik/`),
- CSRF token, id košíka a cookies session sa vo fixtures začiernia.

```
node tools/test-opc-zachyt.mjs --web sk                                   # vzorkovník SK
node tools/test-opc-zachyt.mjs --web cz                                   # vzorkovník CZ
node tools/test-opc-zachyt.mjs --web sk --kosik set --telo <telo addCartItem setu>
node tools/test-opc-zachyt.mjs --web sk --kosik kamion --telo <telo addCartItem kamióna>
node tools/test-opc.mjs --doplnit-cdn            # chýbajúce statické súbory raz GET-om z cdn.myshoptet.com do cdn/
node tools/test-opc.mjs --web cz --doplnit-cdn
```

`data.json` sa stiahne jedným GET-om z adresy v tabuľke (bez prihlásenia). Stav krokov Shoptetu sa dá denne porovnať bez prepisu: `node tools/test-opc-zachyt.mjs --web sk --porovnaj`.

## Pri zlúčení do `main`

Fixtures boli v gite na vetve `opc-prototyp` od commitu „One page checkout: kostra modulu za ?opc=1 + offline test s podvrhom siete“ po commit „Test OPC: fixtures mimo gitu (VOP Shoptet čl. 11.3), návod FIXTURES.md“, ktorý ich z gitu odstránil. Hashe sa pri každom prebázovaní vetvy menia, aktuálne ich ukáže `git log --oneline origin/main..opc-prototyp -- tools/test-opc/fixtures`. Ich bloby so súbormi Shoptetu ostávajú v histórii tejto vetvy. Preto pri zlúčení do `main` treba **squash merge** (`git merge --squash opc-prototyp`, jeden nový commit), nikdy obyčajný merge ani rebase s celou históriou. Inak by sa staré bloby dostali na GitHub (`SharkJohny/spt-luxuryCar`).

Pred pushom over:

```
git ls-files | grep -i "test-opc/fixtures/"                                # prázdne
git grep -l -e validatorPhone -e registerFunction -- tools/ ':!*.md'      # prázdne = žiadny skopírovaný kód Shoptetu
```
