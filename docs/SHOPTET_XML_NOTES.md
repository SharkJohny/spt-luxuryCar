# Shoptet XML import — specifikace a časté chyby

**Oficiální validátor:** https://podpora.shoptet.cz/xml-validace/

## RELAX NG schémata (uloženy v `docs/`)

- [`shoptet-products-complete-v10.rng`](./shoptet-products-complete-v10.rng) — kompletní schéma (rozšíření supplier)
- [`shoptet-products-supplier-v10.rng`](./shoptet-products-supplier-v10.rng) — základní dodavatelský import
- [`shoptet-products-datatype-v10.rng`](./shoptet-products-datatype-v10.rng) — datatypes
- [`shoptet-variant-item-example.xml`](./shoptet-variant-item-example.xml) — vzorový XML

**Zdroje online:**
- https://www.shoptet.cz/export/schema/products-complete-v10.rng
- https://www.shoptet.cz/export/schema/products-supplier-v10.rng
- https://www.shoptet.cz/export/schema/products-datatype-v10.rng

## Lokální validace

```bash
# Symlinky jsou vytvořené pro include href v schématech
xmllint --relaxng docs/shoptet-products-complete-v10.rng <soubor>.xml --noout
# → "validates" = OK
```

## Klíčová pravidla, která často zlobí

### 1. `GUID` musí odpovídat regexu
```
([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})|([0-9a-f]{32})
```
Pouze lowercase hex (+ pomlčky). `test-truck-0000-...` **nestačí** (obsahuje písmena mimo hex). Generuj přes `uuid.uuid1()` nebo podobně.

### 2. `RECYCLING_FEE_*` — striktní `<group>` pořadí
Schéma povoluje **pouze 4 varianty** (`<choice>`):
1. **Nic** — žádný tag (nejjednodušší, default používej tuto)
2. Jen `<RECYCLING_FEE_CATEGORY>` (prázdný)
3. Všechny 4 prázdné v pořadí `CATEGORY → PRICE → CURRENCY → TYPE`
4. Všechny 4 vyplněné v pořadí `CATEGORY → PRICE → CURRENCY → TYPE`

**Typická chyba:** „RECYCLING_FEE_CURRENCY not allowed yet" — znamená že **máš špatné pořadí**, nebo chybí prostřední tag.

Shoptet **export** feed (`productsComplete.xml` stažený z eshopu) porušuje tohle pravidlo — má všechny 4 prázdné ale ve špatném pořadí (CATEGORY, CURRENCY, PRICE, TYPE). Proto se nedá přímo importovat zpět bez úprav. **Při generování importních XML prostě vynechej všechny `RECYCLING_FEE_*` tagy.**

### 3. `SURCHARGE_PARAMETER` — `<optional>` group = všechno nebo nic
```xml
<SURCHARGE_PARAMETER>
  <NAME/>                  <!-- povinný -->
  <!-- Následující 4 jsou jedna <optional> skupina: BUĎ VŠECHNY, NEBO ŽÁDNÁ -->
  <DESCRIPTION/>
  <SHORT_NAME/>
  <CURRENCY/>
  <INCLUDING_VAT/>
  <!-- -->
  <REQUIRED_VALUE/>        <!-- povinný -->
  <VALUES>                 <!-- povinný -->
    <VALUE>
      <NAME/>              <!-- povinný -->
      <PRICE/>              <!-- povinný -->
    </VALUE>
    ...
  </VALUES>
</SURCHARGE_PARAMETER>
```
Pokud chceš jen základ, vynech DESCRIPTION+SHORT_NAME+CURRENCY+INCLUDING_VAT všechny dohromady.

### 4. Pořadí elementů v `<SHOPITEM>`
Top-level SHOPITEM je `<interleave>` — elementy můžou být v **libovolném pořadí**. Takže `EAN` může být před i po `CATEGORIES` atd. Strict ordering se uplatňuje jen uvnitř `<group>` (hlavně RECYCLING_FEE_* a pár dalších).

### 5. `CURRENCY` povolené hodnoty
`currencyDatatype` (viz `datatype-v10.rng`):
- `CZK`, `EUR`, `USD`, `GBP`, `PLN`, `HUF`, `RON`, `BGN`, `SKK`, … (ISO 4217 3-písmenný kód)

Takže `EUR` je **OK**, ne pouze CZK.

### 6. Elementy NEPOVOLENÉ v SHOPITEM (časté omyly při kopírování z exportu)
Export z Shoptetu obsahuje pole, která **nejsou v importním schématu**:
- `FIRMY_CZ`, `HEUREKA_*`, `ZBOZI_*`, `GOOGLE_CATEGORY_ID`, `GLAMI_CATEGORY_ID`
  - Některé JSOU povoleny, jiné ne. Vždy ověř schématem.
- `ARUKERESO_*` — obvykle **ne** v importu.

**Pravidlo:** když kopíruješ SHOPITEM z exportu do importu, nejdřív zvaliduj — `xmllint --relaxng` ti řekne co vyhodit.

### 7. `VISIBILITY` vs. `VISIBLE`
- `VISIBILITY` = `visible` / `hidden` / … (string z enum)
- `VISIBLE` = `0` / `1` (boolean)
- Obě jsou platná, mají jinou sémantiku.

### 8. Limit
Feed nesmí obsahovat víc než **20 000 položek** (`<SHOPITEM>`).

### 9. Kódy produktů (`<CODE>`)
Povolené znaky: `A–Z`, `0–9`, `_`, `/`, `-`, mezera. Nesmí obsahovat diakritiku ani speciální znaky.

## Vzorový minimální platný SHOPITEM
```xml
<SHOPITEM id="1">
  <NAME>Produkt</NAME>
  <GUID>bc6e215c-401f-11f1-b8e9-8eff75da36ba</GUID>
  <ITEM_TYPE>product</ITEM_TYPE>
  <CATEGORIES>
    <CATEGORY id="1">Kategória</CATEGORY>
    <DEFAULT_CATEGORY id="1">Kategória</DEFAULT_CATEGORY>
  </CATEGORIES>
  <CODE>ABC-001</CODE>
  <CURRENCY>EUR</CURRENCY>
  <PRICE>199</PRICE>
  <VAT>21</VAT>
  <STOCK><AMOUNT>1</AMOUNT></STOCK>
  <VISIBLE>1</VISIBLE>
</SHOPITEM>
```

## V tomto projektu
- **`test-truck.xml`** — testovací produkt, 1 SHOPITEM, ceny navázané na `assets/js/truck-konfigurator/pricing.js` přes `<SURCHARGE_PARAMETER>`. Validuje proti schématu.
- **Validační příkaz:** `xmllint --relaxng docs/shoptet-products-complete-v10.rng test-truck.xml --noout`
