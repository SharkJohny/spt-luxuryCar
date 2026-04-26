# spt-luxuryCar — pracovní poznámky

## Klíčová pravidla (pro Codex)

### Shoptet XML import — VALIDACE
Před každou úpravou XML feedu **zvaliduj proti RELAX NG**:
```bash
xmllint --relaxng docs/shoptet-products-complete-v10.rng <feed>.xml --noout
```
Symlinky v `docs/` (`products-supplier-v10.rng`, `products-datatype-v10.rng`) jsou nastaveny.

**Časté chyby:**
- `GUID` musí odpovídat regexu `[0-9a-f]{8}-…` (lowercase hex UUID). Generuj přes `uuid.uuid1()`.
- `RECYCLING_FEE_*` tagy – buď **všechny 4 v pořadí** `CATEGORY → PRICE → CURRENCY → TYPE`, nebo **žádný**. Nikdy mix.
- Shoptet **export** feed neprojde importní validací bez úprav (má jiné pořadí RECYCLING_FEE, obsahuje export-only tagy jako `ARUKERESO_*`).
- `SURCHARGE_PARAMETER` — buď máš `DESCRIPTION+SHORT_NAME+CURRENCY+INCLUDING_VAT` všechny čtyři, nebo žádnou. `REQUIRED_VALUE` a `VALUES` jsou povinné.

Plná dokumentace: [`docs/SHOPTET_XML_NOTES.md`](./docs/SHOPTET_XML_NOTES.md)

### Build systém
```
assets/js/main.js              ← ESBuild entry point (zdroj)
  └─ assets/js/luxuryCar.js    ← compiled bundle (commitnutý)

assets/js/script.js            ← DEV BOOTSTRAP (loaded by Bender)
  └─ dynamicky injektuje /assets/js/luxuryCar.js jako ES module
```

- **Dev:** `yarn build` (watch mode) přestaví luxuryCar.js při každé úpravě
- **CI:** `.github/workflows/production.yml` → `esbuild main.js → luxuryCar.js --drop:console`
- **Bender:** injektuje `/assets/js/script.js` (bootstrap), NE luxuryCar.js přímo. Proto musí být script.js bootstrap-only (žádné JSX importy!)

### Truck konfigurátor — ceník DOM-driven
Ceny v `assets/js/truck-konfigurator/pricing.js` **nejsou hardcoded**. `calculatePrice(state)` čte ze Shoptet DOM:
- `<select data-parameter-id data-parameter-name>` → option text s `+XX €` suffix
- `<meta itemprop="price">` → základní cena

Když admin změní cenu příplatku v Shoptete, konfigurátor ji automaticky použije. Mapování `state → Shoptet parameter` je v `PRICING_LINES` v `pricing.js`.

### Test produkt
- `test-truck.xml` — 1 SHOPITEM (id=3099, CODE=TEST-TRUCK), 19 SURCHARGE_PARAMETER, validuje proti schématu.
- URL pro konfigurátor: `/test-truck/` (detekováno v `productPage.js`).

### Klientský repo
- **`luxusnerohoze-dev/konfigurator`** — zdroj (`cennik_konfigurator.xlsx`, JSX konfigurátor, obrázky nášivek)
- **`SharkJohny/LuxuryCarExport`** — náš pricelist pipeline (Google Sheets → XML feed update)
