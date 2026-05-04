# SEO Fáza A — luxurycardesign.sk + .cz

> **Status:** Code-side fixes hotové na branchi `seo-faza-a-fixes`.
> Admin-only fixes čakajú na manuálnu prácu cez Shoptet UI.
> **Goal:** Zvýšiť SEO Health Score zo 42→55 (sk) a 36→52 (cz).

## Čo som zmenil v repe (6 fixov v kóde)

### Fix #4 — Lazy-load images
- **Súbor:** `assets/js/main.js` (append na koniec, line 991+)
- **Build:** `yarn build:once` → `assets/js/luxuryCar.js` bundle
- **Logika:** Pridáva `loading="lazy"` + `decoding="async"` na všetky `<img>` okrem hero (`.banner img`, `.hero img`, `#main-banner img`).
- **Verifikácia:** DevTools → Elements → grep `loading="lazy"`. Hero má ostať bez (nie pridať `fetchpriority="high"` separátne v hero markup).

### Fix #5 — Štruktúrované dáta (JSON-LD)
- **Súbory:**
  - `seo-faza-a/jsonld-sk-sitewide.html` — Organization + WebSite (paste do Shoptet sk admin > Custom HTML head)
  - `seo-faza-a/jsonld-sk-homepage.html` — LocalBusiness (homepage only)
  - `seo-faza-a/jsonld-cz-sitewide.html` — Organization + WebSite (paste do Shoptet cz admin > Custom HTML head)
  - `seo-faza-a/jsonld-cz-homepage.html` — LocalBusiness (homepage only)
- **Validácia:** https://validator.schema.org + https://search.google.com/test/rich-results
- **POZN k logo URL:** CZ verzia predpokladá samostatný CDN priečinok pre cz doménu. Ak je realita iná (zdieľaný), uprav `logo.url` v cz súboroch.

### Fix #6 — /llms.txt pre AI crawlers
- **Súbory:**
  - `seo-faza-a/llms-sk.txt` — pre upload na sk doménu ako `/llms.txt`
  - `seo-faza-a/llms-cz.txt` — pre upload na cz doménu ako `/llms.txt`
- **Upload:** FTP do root oboch domén ako `llms.txt`.
- **Test:** `curl https://www.luxurycardesign.sk/llms.txt` → vráti obsah.

### Fix #9 — hreflang tagy
- **Súbor:** `seo-faza-a/hreflang-snippet.html`
- **Inject:** Do `<head>` každej stránky cez Shoptet template injection.
- **Mapping:** Static-page table v komentári súboru. Product/category pages cez Shoptet template variable.

### Fix #3 — Viditeľný H1 (CSS)
- **Súbor:** `seo-faza-a/h1-visible.css`
- **Apply:** Import do `assets/css/luxuryCar.css` alebo nový SEO patch súbor v bundle.
- **Template change:** V Shoptet homepage šablóne (`final_wellcome.html` / `upravene pro home.html`) nahradiť `<h1 class="sr-only">Vitajte v našom obchode</h1>` za viditeľný H1 (text v komentári CSS súboru).

### Fix #8 — /o-nas refresh scaffold
- **Súbor:** `seo-faza-a/o-nas-scaffold.html`
- **Status:** HTML scaffold ready. Inline schema (Person + LocalBusiness) je tam.
- **Michal dodá:**
  - Profil foto `/assets/images/michal-svancar.jpg`
  - Bio text 3-4 vety
  - Filozofia text 1-2 odstavce
  - 3 YouTube video linky pre embed
- **Deploy:** Paste do Shoptet admin > Stránky > /o-nas.

## Čo zostáva — admin-only fixes (Michal alebo Ján cez Shoptet UI)

### Fix #1 — CZ sitemap cleanup (Shoptet admin)
**Iba CZ doména.** SK sitemap je čistý.

Shoptet cz admin > Katalog > Značky > zmazať týchto **24** brand značiek:

```
andie, bermuda, burton, citizen, columbia, elise, fila, fly-london,
gola, hi-tec, jamie, linteo, livestrong, maui-jim, nike, north-face,
oakley, paul-green, pelle, ray-ban, rockport, seiko, storm, suunto
```

**NECHAŤ:** `luxury-car-design`.

**POZN k /test-truck/ + /luxusne-autokoberce-truck---test-konfigurator/:**
NEMAZAŤ — sú to live test pages pre Truck konfigurátor (videl som
`assets/js/truck-konfigurator/` v repe + `test-truck.xml`). Iba pridať
`<meta name="robots" content="noindex,follow">` cez Shoptet admin (alebo
template) kým konfigurátor nie je production-ready.

Po cleanup: Submit nový sitemap.xml v Google Search Console.

### Fix #2 — /kontakt → /kontakty/ (301 redirect)
Shoptet admin > Web > Presmerovania:
- sk: `/kontakt` → `301` → `/kontakty/`
- cz: `/kontakt` → `301` → `/kontakty/`

### Fix #7 — WebP hero + responsive srcset
- **Shoptet admin (oba projekty):** Web > Optimalizácia obrázkov > zapnúť WebP generation.
- **Hero markup change:** V homepage šablóne nahradiť hero `<img>` za:
  ```html
  <img src="hero-1920.webp"
       srcset="hero-320.webp 320w, hero-640.webp 640w,
               hero-1280.webp 1280w, hero-1920.webp 1920w"
       sizes="100vw"
       alt="Luxusné autokoberce DragonSkin Diamond Line"
       fetchpriority="high">
  ```
- **Anti-FOUC hack:** Vyhodiť `<style>body{display:none}</style>` z homepage `<head>` — blokuje paint.
- **Smartsupp lazy load:** Posunúť init na `scroll` / `mouseenter` event (~300 KB JS savings na first paint).

### Fix #10 — Drop Hotjar (keep Clarity)
Shoptet admin > Marketing & SEO > Externé skripty > odstrániť Hotjar tracking code (`hjid:6369713` alebo URL `static.hotjar.com`). Microsoft Clarity (`r2wlz8pgh1`) ostáva ako jediný session recording (FREE unlimited).

## Verifikácia po nasadení

1. **Lighthouse pre/po:**
   ```
   https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fluxurycardesign.sk
   https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fluxurycardesign.cz
   ```
2. **Schema validation:**
   ```
   https://validator.schema.org/
   https://search.google.com/test/rich-results
   ```
3. **hreflang validation:**
   ```
   https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/
   ```
4. **/llms.txt accessibility:**
   ```
   curl https://www.luxurycardesign.sk/llms.txt
   curl https://www.luxurycardesign.cz/llms.txt
   ```
5. **Sitemap re-submit** v Google Search Console pre obe domény.

## Cieľ

Po Fáze A (všetkých 10 fixov): SEO Health Score 42→55 (sk), 36→52 (cz).
Detailný audit report: viď interný brief od klienta (Michal vie poslať na vyžiadanie).

## Branch + commit history

Vetva: `seo-faza-a-fixes` (off `main`).

Commits:
1. `feat(seo): #4 lazy-load images in main.js`
2. `feat(seo): #5 JSON-LD templates (Organization, WebSite, LocalBusiness) sk + cz`
3. `feat(seo): #6 /llms.txt for AI crawlers (sk + cz)`
4. `feat(seo): #9 hreflang snippet (sk-SK / cs-CZ / x-default)`
5. `feat(seo): #3 visible H1 CSS override`
6. `feat(seo): #8 /o-nas refresh scaffold (Michal dodá content)`

PR open keď bude všetkých 6 code-side commits ready.
