# SEO Fáza A — Changelog & Work Log

> Tento súbor dokumentuje **čo, kedy a prečo** sme menili v rámci SEO Fáza A
> brief-u. Slúži aby sa Ján alebo iný developer vedel kedykoľvek vrátiť ku
> kontextu zmien bez toho aby musel hľadať v emailoch / chate.

---

## 2026-05-04 — Initial SEO Fáza A implementation

### Trigger
Klient (Michal Švancár, Luxury Car Design s.r.o.) spustil cez Claude Code +
plugin `claude-seo` full SEO audit oboch domén:

- `luxurycardesign.sk` — health score ~42/100
- `luxurycardesign.cz` — health score ~36/100

PSI bol počas auditu rate-limit-nutý → estimates zo statickej analýzy:
Lighthouse Best Practices ~77 sk / ~58 cz, A11y ~78 sk / ~80 cz,
Performance ~25-45 mobile (oba).

Audit zachytil 9 sub-reportov per doména (technical, content, schema,
sitemap, ecommerce, performance, geo, sxo, visual).

### Cieľ
Implementovať 10 quick wins tak, aby sa skóre zvýšilo na 55+ sk / 52+ cz.

### Code-side fixes (6) — implementované v tomto repe na branchi `seo-faza-a-fixes`

| # | Fix | Kde | Commit |
|---|-----|-----|--------|
| 4 | Lazy-load images | `assets/js/main.js` (append) | `272a9d2` |
| 5 | JSON-LD (Organization + WebSite + LocalBusiness) | `seo-faza-a/jsonld-{sk,cz}-{sitewide,homepage}.html` | `d5b0c22` |
| 6 | /llms.txt pre AI crawlers | `seo-faza-a/llms-{sk,cz}.txt` | `43a823c` |
| 9 | hreflang trio | `seo-faza-a/hreflang-snippet.html` | `d305cb7` |
| 3 | Viditeľný H1 CSS | `seo-faza-a/h1-visible.css` | `92244fc` |
| 8 | /o-nas refresh scaffold | `seo-faza-a/o-nas-scaffold.html` | `956781e` |

Plus README + tento CHANGELOG.

### Admin-only fixes (4) — NIE v kóde, robí sa cez Shoptet UI

| # | Fix | Kto | Kde |
|---|-----|-----|-----|
| 1 | CZ sitemap cleanup (24 brand značiek) | Michal alebo Ján | Shoptet cz admin > Katalog > Značky |
| 2 | /kontakt → /kontakty/ 301 redirect (sk + cz) | Ján | Shoptet admin > Web > Presmerovania |
| 7 | WebP auto-variants + hero srcset | Ján | Shoptet admin > Web > Optimalizácia obrázkov + template |
| 10 | Hotjar drop (Clarity zostáva) | Ján | Shoptet admin > Marketing & SEO > Externé skripty |

Detail krokov v `seo-faza-a/README.md`.

### Verifikované entity dáta (použité v JSON-LD + /llms.txt)

- Plný názov: Luxury Car Design, s.r.o.
- IČO: 55 793 061
- DIČ: 2122088243 / IČ DPH: SK2122088243
- Sídlo: Školský dvor 12/10, 010 09 Žilina-Bytčica
- Founding: 10.10.2023
- Telefón: +421 903 660 720 (jediné LCD číslo, žiadny CZ +420)
- Email sk: info@luxurycardesign.sk
- Email cz: info@luxurycardesign.cz
- Search URL sk: `/vyhladavanie/`
- Search URL cz: `/vyhledavani/`
- Logo CDN: `https://cdn.myshoptet.com/usr/www.luxurycardesign.{sk,cz}/user/logos/logo-web-png-v2.png`
- Sociálne: facebook.com/luxurycardes, instagram.com/luxury_car_design_official, tiktok.com/@luxurycardesign, youtube.com/@Luxury_Car_Design

### Pravidlá brand voice (rešpektované v copy)

- ✅ POUŽÍVAŤ: „Slovenská rodinná značka", „Slovak family business"
- ❌ NEPOUŽÍVAŤ: „Slovenský výrobca", „Made in Slovakia", „we manufacture"
  (LCD je značka + dizajn + customizácia v SK; finálna výroba prebieha
  u dodávateľa XC DJD v Číne — Michal sa tým nechváli, ale ani netají)

### Subjekt — Dessign vs Design transition

Zmluva o dielo z 1.1.2025 medzi Jánom a klientom bola podpísaná so starým
subjektom **Luxury Car Dessign** (s 2 S, IČO 56 238 398, historická firma).

Aktuálne aktívna firma je **Luxury Car Design** (s 1 S, IČO 55 793 061).
Pri budúcich faktúrach prosím používajte nové údaje (uvedené vyššie).

### Čo NIE JE v scope tohto brief-u

- Slug-translate sprint pre cz doménu (slovenské slugy → české) — separátny
  task, hreflang funguje aj s identickými slugmi
- Product-page schema (Product + Offer + AggregateRating + Review) —
  Fáza B, vyžaduje napojenie na live review widget (Elfsight ecmwidget IDs
  `8-0ff8f206...` a `12-04d9c954...`)
- FAQPage schema — Fáza B (potrebuje najprv reálnu /faq stránku s 10-15 Q&A)
- Real PLP categories (`/kategoria/luxusne-autokoberce/`) — Fáza C / Q3 2026
- `/test-truck/` + `/luxusne-autokoberce-truck---test-konfigurator/` —
  NEMAZAŤ (live test pages pre Truck konfigurátor v
  `assets/js/truck-konfigurator/`). Iba pridať `<meta name="robots"
  content="noindex,follow">` kým konfigurátor nie je production-ready.

### Verifikácia po deploy

1. **Lighthouse pre/po:**
   ```
   https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fluxurycardesign.sk
   https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fluxurycardesign.cz
   ```
2. **JSON-LD validácia:**
   ```
   https://validator.schema.org/
   https://search.google.com/test/rich-results
   ```
3. **/llms.txt:**
   ```
   curl https://www.luxurycardesign.sk/llms.txt
   curl https://www.luxurycardesign.cz/llms.txt
   ```
4. **hreflang:**
   ```
   https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/
   ```
5. **Sitemap re-submit** v GSC pre obe domény (po Fix #1 brand cleanup).

---

## Future entries

Pri ďalšej SEO/dev fáze pridaj sekciu pod túto so štruktúrou:
```
## YYYY-MM-DD — Fáza X popis

### Trigger
### Cieľ
### Code changes (commits)
### Admin-only changes
### Notes
```
