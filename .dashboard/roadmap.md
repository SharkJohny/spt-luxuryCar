# Roadmap

## Darčeková poukážka (fáze 1 — frontend UI + XML produkty, bez backendu)
Zdroj: `luxusnerohoze-dev/darcekova-poukazka` (privátne repo). Rozsah zúžený s klientom:
žiadny Cloudflare Worker/D1/PDF/email — všetko beží v Shoptete. Hodnota = 5 "mincí"
100/200/300/400/500 €, vlastná suma sa skladá kombináciou po 100 €. Plán:
`/Users/sharkjohny/.claude/plans/mossy-nibbling-eagle.md`.
- [x] Analýza zdrojového repa (frontend `konfigurator.jsx`/`index.html`, backend, Shoptet glue)
      a rozsahu s klientom — backend úplne mimo, XML produkty namiesto floating custom sumy
- [x] `assets/js/voucher-konfigurator/` — port konfigurátora (vzor truck-konfigurator):
      `pricing.js` (hodnoty, `decomposeToCoins`), `cart.js` (napojenie na košík),
      `styles.js` (scoped CSS pod `#lcd-voucher-root`, `vch-`/`gv-` prefixy),
      `konfigurator.jsx` (React UI, texty zmiernené — žiadny sľub automatického PDF/5 min),
      `index.jsx` (`isVoucherPage`, `mountVoucherConfigurator`, ErrorBoundary)
- [x] Texty upravené: PRESET_VALUES 100–500, vlastná suma krokovaná po 100 € (100–2000 €),
      rozklad na mince zobrazený zákazníkovi (`CoinsBreakdown`), doručenie = "kód emailom
      po spracovaní objednávky" (nie sľub konkrétneho PDF/5 minút — backend neexistuje)
- [x] `voucher/build-voucher-xml.mjs` → `voucher/dist/voucher-products.xml`: 1× master
      (VOUCHER, visible, cena 0,01 €) + 5× mincí (VOUCHER-100…500, `VISIBILITY=detailOnly`
      — dostupné cez URL pre košík, ale nezobrazia sa v katalógu/vyhľadávaní); zľavy/kupóny
      na minciach vypnuté. Validuje proti `docs/shoptet-products-complete-v10.rng`
- [x] `productPage.js`: import + `isVoucherPage()`/`mountVoucherConfigurator()` výnimka v
      `initProduct` (vzor truck — plný takeover, `return`)
- [x] `package.json`: skripty `voucher:product` (build+validácia XML), `voucher:test` (mount test)
- [x] `assets/js/voucher-konfigurator/test-voucher-mount.mjs` (`yarn voucher:test`) — OK
- [x] `yarn build:once` — voucher modul zabundlovaný do `luxuryCar.js` bez chýb
- [ ] **RIZIKO — over pred nasadením:** napojenie na košík (`cart.js`) používa skryté
      `<iframe>` + natívny klik na `.add-to-cart-button` (žiadny reverse-engineering
      interného Shoptet AJAX API) — potrebné doplniť/overiť na živom webe:
      1) `COIN_URLS` v `cart.js` (reálne slugy 5 mincí PO importe XML — Shoptet ich
         generuje z NAME, nedajú sa predpovedať vopred),
      2) `CART_URL` (skutočná URL košíka),
      3) `AMOUNT_INPUT_SELECTORS`/`ADD_BUTTON_SELECTOR` (ak sa líšia od predpokladu)
- [ ] Naimportovať `voucher/dist/voucher-products.xml` do Shoptetu, over VAT sadzbu (teraz 21 %)
- [ ] Vytvoriť/pomenovať stránku poukazu v Shoptet adminovi, zladiť slug s `isVoucherPage()`
      (predpoklad `/darcekova-poukazka/`)
- [ ] Vizuálne overiť konfigurátor na živom webe (desktop + mobil), otestovať golden path
      (200 €, 700 € zložené z viacerých mincí) — pridanie do košíka, súčet, checkout
- [ ] Mimo fázy 1 (samostatný plán neskôr): uplatnenie/doručenie unikátnych kódov —
      zatiaľ rieši admin ručne cez Shoptet zľavové kupóny

## Vzorkovník → Shoptet (pasteable HTML)
- [x] Analýza klientskeho repa `luxusnerohoze-dev/vzorky` (zdroj, obrázky, runtime deps)
- [x] Build pipeline `vzorky/build-vzorky.mjs` (sharp resize + esbuild JSX→JS)
- [x] Inline React (UMD z node_modules) — odstránený unpkg/Babel CDN
- [x] Inline base64 obrázky (len 48 referencovaných, downscale) — žiadne externé cesty
- [x] Scopnuté CSS pod `#lcd-vzorky-root` + guard proti dvojitému mountu
- [x] `fetch-source.sh` + npm scripty (`vzorky:fetch`, `build:vzorky`, `vzorky:test`)
- [x] jsdom mount test — 0 runtime chýb, 49 base64 img, order math OK
- [x] Výstup `vzorky/dist/vzorky-shoptet.html` (~2.7 MB), pripravený na vloženie
- [x] Fix: celý blok prepísaný na čisté ASCII (\uXXXX) — opravená rozsypaná diakritika
- [x] Klient doplnil fotky `2.vrstva/new/Lux_color_14/15/16.png` (commit `de70531`,
      8.5.2026) → `yarn vzorky:fetch` (opravený `mapfile`→portable read loop pre bash 3.2
      + `Accept: application/vnd.github.raw` namiesto base64 `content`, ktorý má na GH API
      1MB limit — fotky boli 14-18MB) + `yarn build:vzorky` → placeholder v
      `dist/vzorky-shoptet.html` nahradený reálnymi náhľadmi, `yarn vzorky:test` OK
- [ ] Klient: vložiť blok do Shoptet stránky a vizuálne overiť

## Vzorkovník — JS výnimka v HLAVNOM kóde (vizuálny vzorkovník napojený na košík)
Pôvodný pokus (mount celého standalone React bloku s base64) ZAMIETNUTÝ — rozbíjal
bundle. Nová, čistá implementácia:
- [x] `assets/js/vzorky-konfigurator/index.js` — vanilla (žiadny React/base64),
      nájde 45 surcharge `<select>`-ov (ID z `data-parameter-name` „(S-1)"), skryje
      natívne riadky, zoskupí do 4 sérií POD SEBA, vyrenderuje mriežku dlaždíc;
      klik → set `<select>` na „Chcem/Nechcem" + `change` → Shoptet ráta zálohu
- [x] Swatch obrázky cez CDN: `vzorky/build-swatch-assets.mjs` (`yarn vzorky:swatches`)
      optimalizuje 42 fotiek do `assets/img/vzorky/<ID>.jpg` (1.1 MB), CI ich mirroruje
      na CDN — **žiadny base64 bloat** (bundle ostáva 10.4 MB)
- [x] Manifest `assets/js/vzorky-konfigurator/swatch-data.js` (45 položiek, ~3 KB)
- [x] `productPage.js`: import + `isVzorkyConfiguratorPage()` (slug /vzorkovnik-dragonskin
      al. H1) + výnimka v `initProduct` (vzor truck)
- [x] FIX umiestnenia: selecty hľadané cez `.surcharge-parameter` + `data-parameter-name`;
      mount do PRAVÉHO stĺpca `.p-info-wrapper` ZA `<table>` surcharge parametrov (nie cez
      celú šírku) → cena/množstvo/„Pridať do košíka" ostávajú, e-shop funguje normálne
- [x] FIX „JS sa nespúšťa / overlay visí": odstránený `return` po mountVzorkyConfigurator.
      Truck má `return` (nahrádza celú stránku), ale vzorkovník je NORMÁLNY produkt →
      initProduct musí dobehnúť do konca (inak sa nedokončí init stránky a overlay ostane).
      Overené proti reálnemu DOM (stiahnuté live HTML): mount bez výnimky, 45 dlaždíc,
      root v `.p-info-wrapper`, 4 natívne riadky skryté
- [x] MULTI-SELECT: každá vzorka = vlastný yes/no parameter → dá sa vybrať
      ľubovoľný počet vzoriek (aj viac v jednej sérii), opätovný klik ruší len daný výber
- [x] `productPage.js`: príznak `isVzorky` vypína generátory autokoberec-konfigurátora
      (`createModelInfo`, `priplatky` = upsale/kroky, cenové bannery) na vzorkovníku —
      bez `return` (odhalenie stĺpca/cena/košík bežia ďalej, stránka nevisí).
      `createModelInfo` má aj vlastný guard (bráni globálnemu `.position-wrap` klik handleru)
- [x] UI ako konfigurátor: série = AKORDEONY (zlatý gradient header `#c5a44e→#a8893a`,
      'Exo 2', číslo kroku, počítadlo vybraných, šípka; single-open, 1. otvorený default).
      Vlastné `.lcd-vz-*` triedy (nie `.position-wrap`) → bez väzby na auto-konfigurátor
- [x] NÁHĽADY (neobjednávateľné) podľa návrhu: Lux Color bez parametra sa zobrazia ako dlaždice
      so štítkom „Neposiela sa“, nejdú vybrať; LUX-10 zvýraznená „Posielame“ (zelená)
- [x] REKAPITULÁCIA objednávky = tmavá karta podľa návrhu (#2E1810 + zlaté akcenty):
      počet vzoriek + vratná záloha spolu, zoznam „ID — séria: farba“, live update, prázdny/plný stav
- [x] Zaokrúhlenie ZOBRAZENEJ ceny na celé eurá (`normalizePrices`/`watchPrices` v index.js):
      admin base 0,01 € (Shoptet inak produkt nezobrazí) → zákazník vidí 0 € / 5 € / 10 €…
      Beží pri mounte aj po každej zmene (MutationObserver). Mení len zobrazenie, nie cenu objednávky.
- [x] DLAŽDICE podľa návrhu: full-bleed obrázky bez paddingu (`.lcd-vz-thumb-wrap` štvorec,
      `object-fit:cover`, štítky stavu ako prekryv na obrázku, názov farby pod ním); mriežka
      max 5 v rade (`repeat(5,1fr)`, mobil 3); v každej sérii PRVÁ dlaždica „Nechcem"
      (`buildSkipTile`) — aktívna keď nič nevybrané, klik zruší celý výber série
- [x] Integračný jsdom test `vzorky/test-konfigurator.mjs` (`yarn vzorky:test`) — 45/45 OK:
      akordeony + single-open toggle, multi-select v sérii aj naprieč, náhľady (15× neobjednávateľné,
      klik nič nerobí), LUX-10 „Posielame“, rekapitulácia (počet/záloha/poradie/formát položky),
      zaokrúhlenie ceny (0,01 €→0 €, 5,01 €→5 €), skip dlaždice (4×, prvá v mriežke, aktivita
      podľa výberu, klik zruší len danú sériu)
- [x] FIX „vyberateľné aj to, čo nemá ísť vybrať": objednávateľnosť je teraz
      AUTORITATÍVNE z manifestu (`orderable` flag), nie z prítomnosti `<select>` v DOM-e.
      `build-swatch-assets.mjs` nesie `orderable` do `swatch-data.js` (30 orderable /
      15 náhľadov); `index.js` `isOrderableId()` → náhľad sa nedá vybrať, ani keď preň
      Shoptet vystaví parameter (poistne držaný na „Nechcem"). Regresný test
      v `test-konfigurator.mjs` (LUX-01 so selectom ostáva náhľad). 46/46 OK, bundle rebuilt.
- [x] LUX-14/15/16: fotky doplnené do `vzorky/images/web/2.vrstva/new/`,
      `yarn vzorky:swatches` vygeneroval `assets/img/vzorky/LUX-{14,15,16}.jpg`
      (42→45 súborov) + zapísal manifest, `yarn vzorky:test` OK (nezmenené počty
      dlaždíc/náhľadov, LUX-14/15/16 ostávajú `orderable:false`)
- [x] Poradie sérií zmenené na Diamond ako 1. voľba: `order` pole v `index.js`
      (`["diamond","stripe","hexa","second"]`) + `SERIES` v `build-swatch-assets.mjs`
      zosúladené s `vzorky/src/konfigurator.jsx` (klientský zdroj mal Diamond už
      prvý v akordeóne). Testy (`test-konfigurator.mjs`) prepísané na nové
      očakávané poradie (akordeóny aj rekapitulácia), `yarn vzorky:test` OK
- [ ] DEPLOY na produkciu: `luxuryCar.js` tam teraz 404-uje → výnimka beží len v deve.
      Treba commit+push (CI rebuild+SFTP mirror) alebo manuálny upload bundla+`assets/img/vzorky/`
- [ ] Vizuálne overiť v deve na /vzorkovnik-dragonskin---objednavka-vzoriek

## Vzorkovník ako Shoptet PRODUKT (SURCHARGE_PARAMETER)
- [x] v1: 30 samostatných yes/no parametrov — kedysi zamietnuté
- [x] v4: **4 vrstvy = 4 parametre** (farby ako hodnoty +5 €) — problém: parameter je single-select, z vrstvy šlo vybrať len 1 farbu
- [x] v5: každá vzorka = samostatný yes/no parameter (Nechcem 0 € / Chcem +5 €) → viac vzoriek naraz
- [x] v6 (FINAL): LEN OBJEDNÁVATEĽNÉ vzorky = parameter — **30 parametrov** (Stripe 8 + Hexa 3 +
      Diamond 18 + 2.vrstva len LUX-10). Ostatné Lux Color (15×) sú v konfigurátore len náhľady
      (orderable:false v `konfigurator.jsx`), nemajú parameter → nedajú sa objednať
- [x] Zdroj farieb = repo konfigurátor (rozhodnutie klienta)
- [x] Bez fotiek pri voľbách (stačia príplatkové parametre)
- [x] `vzorky/dist/vzorky-product.xml` validuje proti RELAX NG (`yarn vzorky:product`)
- [ ] Potvrdiť VAT na vratnej zálohe (teraz 21 %, deposit môže byť 0 %)
- [ ] Naimportovať do Shoptetu cez XML import a overiť parametre v košíku

## Truck konfigurátor — re-sync z klienta + mobilná verzia
- [x] DESKTOP update z klienta (`luxusnerohoze-dev/konfigurator` origin/master): 3-way
      git merge (base=abad847 → theirs=origin/master) na spt `konfigurator.jsx` —
      prinieslo klientove UX zmeny (scroll-once `*Scrolled`, galéria fotiek `activePhoto`,
      odstránený auto-advance, door-lemovanie sync) a zachovalo spt adaptácie (React import,
      DOM-pricing, syncToShoptet, add-to-cart, export). 2 triviálne konflikty vyriešené.
- [x] PHONE verzia (`phone/konfigurator.jsx`) zapojená ako `konfigurator.phone.jsx` —
      rovnaké Shoptet adaptácie aplikované scriptom (pricing/sync/state shape identický s desktopom).
- [x] FIX TDZ bug v klientovom phone kóde: auto-scroll useEffect referencoval `step1Done`
      v deps PRED jeho deklaráciou → presunutý za deklaráciu.
- [x] Viewport switch v `index.jsx`: `matchMedia(max-width:768px)` → phone, inak desktop (mount-time).
- [x] Smoke test `assets/js/truck-konfigurator/test-truck-mount.mjs` (`yarn truck:test`):
      obe verzie mountujú bez runtime chýb + renderujú DOM. OK.
- [x] Bundle: base64 obrázky von z bundla → **19.7MB → 1.5MB** (aj pôvodný desktop
      externalizovaný). `truck/build-truck-images.mjs` (`yarn truck:images`, beží v build:once
      a v CI) vytiahne 174 unikátnych obrázkov (dedup desktop+phone) do `assets/img/truck/`
      a vygeneruje `konfigurator*.gen.jsx` (base64→URL `…/upload/assets/config/truck/`).
      Zdrojové `konfigurator*.jsx` ostávajú s base64 (čistý re-sync); `index.jsx` bundluje .gen.
      IMG_BASE = `https://www.luxurycardesign.cz/user/documents/upload/assets/config/`
      (file manager NIE je zdieľaný medzi doménami: truck = .cz, vzorky = .sk).
- [x] ⬆️ Obrázky nahraté klientom do Shoptet (.cz) `assets/config/` — overené všetkých 174/174 = HTTP 200.
- [ ] Vizuálne overiť desktop aj mobil na reálnom truck produkte (cena/sync/košík).
- [ ] Breakpoint 768px doladiť podľa reálneho zariadenia (tablet teraz dostáva desktop).

## Konfigurátor — redesign kroku "Autokoberce do kufra" podľa návrhu (2.7.2026)
- [x] `lcdTrunkCardsRedesign()` v `configurator-enhance.js`: split textu karty na
      titulok + podtitulok, save badge s percentom (−66 % / −58 % z data-recommended),
      NECHCEM podtitulok "Ponechať kufor prázdny" + poznámka "Bez zľavy na tento doplnok",
      badge "★ Najobjednávanejšie" na PREMIUM karte (SK/CZ lokalizácia)
- [x] SCSS `_productPage.scss`: horizontálne karty (obrázok 38 % vľavo, object-fit cover),
      veľká cena s prečiarknutou RRP, zelený save badge, ✓ krúžok na aktívnej karte,
      NECHCEM grayscale obrázok; mobilná verzia (≤768px)
- [x] jsdom test logiky (3 karty, percentá sedia s návrhom) + `yarn build:once` OK
- [x] Presné gradienty podľa spec od Michala (2.7.2026): hlavička kroku
      135deg #d9bb6b→#b98f36; badge Najobjednávanejšie 135deg #e2c163→#b98f36;
      zelená (save lišta + všetky flow CTA vrátane potvrdiť — klientove pravidlo
      jednotnej zelenej) 135deg #34a865→#238049, hover #2f9a5c→#1e7241
- [ ] Zlatý oddeľovač pod názvom (90deg #e2c163→#b98f36) — čaká na upresnenie,
      pod ktorým názvom má byť (v dodanom výreze návrhu nie je vidieť)
- [x] Hlavička akordeónu: číslo kroku v tmavom štvorčeku (#1d1911, JS wrap
      `lcdWrapStepNumbers()` — samoopravný voči `.text()` prepisu z productPage.js),
      tmavý titulok #1f1a10 weight 800, malá tmavá šipka; výška 48px desktop /
      40px mobil (rešpektuje max-height 50/42px zbaleného kroku); jsdom test OK
- [ ] Vizuálne overiť na reálnom produkte (desktop + mobil) a odladiť podľa návrhu

## Konfigurátor — UX revízia „aby neskákal" (8.7.2026)
- [x] FIX ceny: updateUpsale nastavoval surcharge select bez trigger("change") —
      livePrice cenu pri výbere kobercov/boxov do kufra vôbec neprepočítal;
      doplnený trigger aj v close/none handleroch boxov (productPage.js)
- [x] Scroll engine (configuratorEngine.js): zarovnanie na VRCH kroku namiesto
      centrovania; „pohodlná zóna" (krok viditeľný hore = žiadny scroll);
      jeden smooth scroll namiesto čakania 1.4s + instant teleport + korekcia
- [x] Anti-jump kotva v lcdGoToStep: po zavretí krokov nad viewportom instantná
      kompenzácia scrollTop o deltu — cieľ opticky nedrgne
- [x] K3→kufor auto-advance: 350ms pauza (user vidí označenie výberu), inline
      max-height zámok skrátený 5s→2.5s + self-heal klik na hlavičku ho zruší hneď
- [x] CSS: trunk/boxs transition 1s → max-height 0.3s (lenivé animácie preč)
- [x] Overené v náhľade: desktop + mobil screenshot OK, audit bez nových vád,
      console bez chýb z nášho JS; build OK
- [x] Auto-scroll pri výberoch na DESKTOPE úplne vypnutý (klient: „popojíždění
      je matoucí"). Ostáva len verifikačný scroll (chýbajúci krok pri Pridať
      do košíka) a mobil (max-width 768px), kde je krok mimo viewport
- [x] Verifikačný scroll na PC bez animácie — behavior:"instant" (obchádza aj
      scroll-behavior:smooth šablóny); smooth ostáva len na mobile
- [x] „Skočí kúsok dole pri výbere": priceActualization pri KAŽDOM kliku
      globálne mazala všetky .image-wrap preview a znovu ich vkladala
      s fadeIn(1000) → zmrštenie+nafúknutie kroku. Nově výmena len v kroku,
      kde sa kliklo, bez fade; + guard na e=undefined (box produkt)
- [x] „Vyjde o kus hore pri rozložení": K4→kufor auto-prechod (force-close K3
      + otvorenie trunku) na DESKTOPE úplne vypnutý — kufor sa otvorí až
      tlačidlom „Prejsť k ďalšiemu kroku". Mobil ponechaný pôvodný flow
- [x] SCROLL ANCHORING (lcdAnchorTo): pri zatváraní predchádzajúceho kroku
      drží aktívny/kliknutý krok rAF dorovnávaním scrollu na rovnakej
      vizuálnej výške počas celej 300ms animácie. Zapojené do lcdGoToStep
      (next-step tlačidlo) aj akordeonového kliku na hlavičku
      (window.__lcdAnchorTo v productPage.js). Len desktop; ruší sa pri
      user scrolle a verifikačnom scrolle
- [x] FIX kotvy pre „dogenerované" kroky 5/6 (kufor/boxy): skrytý cieľ má
      rect.top 0 → kotva strieľala obrovskú deltu. Skrytý cieľ → kotví sa
      posledný VIDITEĽNÝ krok pred ním; + offsetParent guard v tick()
- [x] FINÁLNE UKĽUDNENIE (desktop): akordeón BEZ CSS animácie (transition:none
      ≥769px; max-height transition mala mŕtvu zónu a behala trhane) —
      zatvorenie + otvorenie + synchrónna scroll kompenzácia v JEDNOM frame,
      vizuálne sa nepohne nič; rAF kotva 600ms dolapá neskoré reflowy
      (obrázky). Zapojené v lcdGoToStep aj akordeónovom kliku. Mobil
      ponecháva 0.3s animáciu + smooth scroll
- [x] „Problikáva hlavička": konverzná fixná lišta (.plugin-fixed-header,
      header.js) prepínala .active na ostrom prahu pageYOffset >
      buttonOffsetTop (navyše prah z initu = po klikoch v akordeóne stale).
      Fix: hysteréza ±120px + živý prepočet prahu + skip počas
      window.__lcdAnchoring (flag nastavuje lcdAnchorTo)
- [x] Kroky 5/6 (kufor/boxy) VIDITEĽNÉ OD NAČÍTANIA ako zbalené položky
      akordeónu — odstránený $(".upsale-Banner").hide() v createUpsaleButton.
      Žiadne neskoršie „dogenerovanie" krokov = žiadny brajgel pri ich
      objavení; show() volania v lcdOpenStep/updateUpsale sú teraz no-op
- [x] Kroky 5/6 zbalené PRESNE ako 1-4: min-height 52px → 0 (trčal pruh
      obsahu pod hlavičkou, zbalený krok má max-height 50px)
- [x] Zjednotenie krokov 5/6 s 1-4: nadpis font-size 15px/margin 0 (dedil
      väčší template h5 = „jiný formát nadpisu"); active max-height 2600px
      (karty presahovali generický 1000px limit a orezávali sa)
- [x] „Zabliká patička pri kliku na K4": transition:none = obsah pod
      zatváraným krokom preskočil v 1 frame (číta sa ako blik). Desktop
      mikro-animácia max-height 0.18s ease-out + kotva aj v ZAVÁRACEJ vetve
      akordeónu (jediná cesta bez nej, productPage.js:516)
- [x] FINÁLNY flow krokov 5/6: skryté od načítania (hide obnovený), odhalia
      sa ZBALENÉ po výbere rozloženia kobercov (K3 handler, desktop: len
      show bez scrollu/otvárania — banner sa pridá pod aktuálny krok, nič
      neskáče; mobil: pôvodný auto-prechod). Otvorenie tlačidlom
      „Prejsť k ďalšiemu kroku"
- [x] MOBIL „prázdny košík": redirect na /kosik/ bežal na ShoptetCartUpdated
      aj keď pridanie zlyhalo. Guard: redirect LEN ak badge košíka v headri
      ukazuje > 0 položiek (200ms delay na update badge), inak ostať na
      produkte (Shoptet ukáže chybu). + nativny $cart[0].click() namiesto
      jQuery trigger (garantovaný submit formulára)
- [ ] Overiť na reálnom mobile: Prejsť do košíka → produkt v košíku
- [x] test-truck.xml: nové ceny podľa cennik_konfigurator (1).xlsx (EUR×25 → CZK):
      prešívaná 10€/250, tónovaná 40€/1000, mikrosemiš 40€/1000 a 50€/1250,
      nášivky stred/predné 59€/1475, bundle 95€/2375, tapacír 119€/2975,
      nášivka dvere 49€/1225. Base 199€/4975 bez zmeny. RELAX NG validuje.
- [x] test-truck.xml: prevod na EUR (slovenský shop) — import padal na
      "Invalid currency 'CZK' of surcharge parameter". Všetkých 20 CURRENCY
      tagov CZK→EUR, ceny priamo z ceníka v €: base 199, prešívaná 10,
      tónovaná 40, mikrosemiš 40/50, nášivky 59/59/95, tapacír 119,
      nášivka dvere 49. RELAX NG validuje.

## CZ import: Vzorkovník + TRUCK zo živého SK feedu (19.7.2026)
Zdroj: `productsComplete.xml?patternId=-5&partnerId=3&hash=...` (živý SK e-shop).
- [x] Stiahnutý živý feed, identifikované 2 produkty: id 637 (Vzorkovník Dragonskin,
      45 SURCHARGE_PARAMETER) a id 640 (autokoberce TRUCK, 19 SURCHARGE_PARAMETER)
- [x] Kurz + zaokrúhlenie odsúhlasené s klientom: ČNB 24,205 CZK/EUR, psychologické
      ceny (…90/…99)
- [x] Prepočet cien: 5€→99 Kč (vzorka záloha), 199€→4799 Kč (TRUCK base) +
      všetky surcharge hodnoty (materiály, nášivky, tapacír)
- [x] Kompletný SK→CZ preklad NAME/DESCRIPTION/SURCHARGE_PARAMETER (skript +
      manuálna kontrola, 0 zvyšných SK-only znakov ľ/ĺ/ô/ŕ/ä)
- [x] `cz-import/vzorky-a-truck-cz.xml` — 2× SHOPITEM, CZK, VAT 21 %, kategórie
      500/502 (zhoda s existujúcim test-truck.xml), validuje proti
      `docs/shoptet-products-complete-v10.rng`
- [ ] Klient: skontrolovať placeholder ID (9101/9102), CODE (VZORKY-DRAGONSKIN/TRUCK),
      link na `/luxusni-autokoberce/` v CTA vzorkovníka (odhad slugu, neoverené na CZ webe)
- [ ] Naimportovať do CZ Shoptetu, overiť kategórie/ceny po importe

## Truck konfigurátor — pripomienky klienta (kamiony pripomienky.odt, 18.7.2026)
- [x] Bod 2 ceny VRÁTENÉ na ceníkové (Jan: "ceny neupravovat, sú presne
      z ceníka") — XML 59/59/95, fallback 70/70/100. Strikethrough UI na
      kartách B/C ponechaný (zobrazí sa, len keď rrp > cena). Ak klient na
      139/89/59 trvá, mení sa ceník/admin, nie kód.
- [x] FIX po bode 7: preskočený krok 5 nechával POVINNÝ Shoptet select
      "Tapacír" prázdny → natívne Pridať do košíka potichu zlyhalo.
      resolveValue: null = "Nie nechcem tapacír dverí".
- [x] Bod 4b: „bundle" → „balík" (TEXTS, sync texty, pricing bucket kľúče
      s BUNDLE fallbackom, findMatchingOption tolerantný na obe slová,
      test-truck.xml). POZOR: premenovať aj option texty v Shoptet admine
      produkčného produktu (id 883), inak košík ďalej píše „bundle".
- [x] Bod 5: verifikácia chýbajúcej farby nite roluje priamo na výber farby
      (nové kotvy konfig-sub-4b2 / 4c2), nie na vrch kroku 4/B / 4/C.
- [x] Bod 6: krok 5 "áno" + Pridať do košíka → vynútené dokončenie všetkých
      podkrokov 5b–5d (validačná reťaz už existovala; overiť na produkcii —
      klient zrejme testoval starší build).
- [x] Bod 7: krok 5 voliteľný — nič nevybraté/"nie" = rovno do košíka
      (odstránený doorPanelChoice===null blocker).
- [x] Bod 8: tlačidlo v kroku 5 „Dokončiť konfiguráciu ✓" → „Prejsť na ďalší
      krok →" + scroll na cenový súhrn.
- [x] Smoke test yarn truck:test — desktop aj phone mount OK.
- [ ] Bod 1: CZ preklady celého konfigurátora (TEXTS pokrýva len časť UI;
      treba obsahový prechod všetkých SK stringov v JSX) — VEĽKÁ úloha.
- [ ] Bod 3: ceník riadený z klientovho excelu (cennik_konfigurator.xlsx →
      Shoptet príplatky; pipeline SharkJohny/LuxuryCarExport) — mimo FE repo.
- [ ] Bod 4a: „košík neprepisuje správne dáta" — treba od klienta konkrétny
      príklad (ktorý parameter/hodnota), bez repro nefixovať naslepo.
- [ ] Popisky (bod 8b): klient dodá texty a fotky — čaká sa na podklady.
- [x] FIX writePrices TypeError (konzola klienta): livePrice.js prepisoval
      .price-final-holder cez $holder.text() a ničil Shoptetov vnútorný
      <span class="calculated-price"> — každý shoptet.surcharges.updatePrices
      potom padal na null.textContent. Teraz píšeme do vnútorného spanu.
- [x] FIX CORS obrázkov truck konfigurátora: IMG_BASE z absolútnej .cz URL
      na RELATÍVNU /user/documents/upload/assets/config/ (na .sk shope
      absolútna .cz padala na CORS pri canvas tintingu nášiviek).
      TODO KLIENT/JAN: nahrať assets/img/truck/* do file managera .SK shopu
      (assets/config/) — súbory sú zatiaľ len na .cz.
- [ ] Košík "kliknutie nič neurobí": pridaná diagnostika pred submitom —
      povinné Shoptet selecty bez hodnoty sa vypíšu do konzoly
      ("[truck-konfig] POVINNÉ selecty bez hodnoty"). Po nasadení zopakovať
      test a poslať výpis konzoly.
- [x] E2E test košíka: nový test-truck-cart.mjs (jsdom + reálne selecty zo
      živej stránky vrátane required a BUNDLE textov) — prejde kroky 1–4,
      krok 5 nechá prázdny (bod 7), klikne košík. VÝSLEDOK OK: všetkých
      6 povinných selectov naplnených, natívne tlačidlo kliknuté, žiadna
      validačná hláška. Obrázky: preview audit 0 broken-image (CDN URL).
- [x] ROOT CAUSE košíka nájdený E2E testom + konzolou klienta: required
      select "Nášivky" ostal prázdny pri variante A — regex na odstrih
      cenového suffixu nepoznal formát "+€95" (mena PRED číslom, Shoptet SK),
      takže "(BALÍK)"/"(BUNDLE)" option sa nedala namatchovať. Opravené
      v findMatchingOption (3×) aj PRICE_SUFFIX_RE (čítanie cien z DOM),
      obe verzie. E2E test-truck-cart.mjs teraz prechádza BALÍK cestou:
      Nášivky = "Šofér + spolujazdec + stred (BUNDLE) +€95" ✓, natívne
      tlačidlo kliknuté ✓.
- [x] FIX "pridá do košíka už na 4. kroku": React <button> bez type vo
      vnútri Shoptet product formu je implicitne type=submit — každé
      "Pokračovať" odoslalo formulár (viditeľné až po oprave Nášivky
      selectu, dovtedy submit blokovala HTML5 validácia). Všetkých 9+11
      buttonov v oboch verziách má teraz type="button". E2E rozšírený
      o guard "žiadny submit počas konfigurácie" — prechádza.
- [x] Košík truck/vzorkovník: riadky "Značka/Model/Rok/Typ: undefined" preč —
      vypisujú sa len s reálnou hodnotou a len pre autokoberce. Truck riadok
      má namiesto nich "Vozidlo: <značka model>" (konfigurátor ukladá vozidlo
      do sessionStorage.truckVehicle; Shoptet select Vozidlo má len
      placeholder). Placeholder bullety "… - Vyberie sa v konfigurátore" sa
      u trucku skrývajú. Overené v preview košíku.
- [x] Cenník skontrolovaný (Downloads xlsx = identický s repo verziou, md5
      zhoda): test-truck.xml sedí 10/10 položiek. FALLBACK_PRICES v kóde boli
      zastarané (V4) — zarovnané s cenníkom: materiály 10/40/40/50, nášivky
      59/59/95, tapacír 119, nášivka dvere 49 (solo 89). Živé ceny sa ďalej
      čítajú zo Shoptet DOM; fallback je len pre offline/preview.
      POZN. klientovi: v cenníku nesedí tapacír "samostatná cena" — stĺpec C
      hovorí 199, poznámka "Bežne 179" — kód drží 179, nech si to ujednotí.

## Nášivky per pozícia vo feedoch (test-truck.xml + cz-import) — 29.7.2026
Klient: konfigurátor umožňuje vybrať INÚ nášivku a INÚ farbu nite pre boky
(šofér+spolujazdec), stred (stredový koberec) aj dvere — feed to nevedel zachytiť
(stred chýbal úplne, „Nášivka"/„Niť" boli nejednoznačné — niesli len hodnotu bokov).
Plán: `/Users/sharkjohny/.claude/plans/misty-singing-muffin.md`.
- [x] Zdroj potvrdený: `NASIVKY` (25 kódov H1-H26/N1/N2/N33) a `NITE_FARBY` (11 farieb)
      v `konfigurator.jsx:289,597` — jeden zdieľaný katalóg pre všetky 3 pozície
- [x] `resolveValue()`/`syncToShoptet()` (konfigurator.jsx:1061-1214) potvrdené: písal len
      boky+dvere, `selectedStredNasivka`/`selectedStredNitColor` sa nikde neukladali
- [x] 6 informatívnych (cena 0) parametrov v oboch feedoch: `Nášivka boky`/`Niť boky`
      (rename z `Nášivka`/`Niť`), `Nášivka stred`/`Niť stred` (nové), `Nášivka dvere druh`/
      `Niť dvere` (zjednotený pravopis CZ, predtým „dveře druh"). Každý s placeholderom,
      „Bez nášivky"/„Bez nite" a plným katalógom (25 kódov / 11 farieb kód+názov)
- [x] Priced parametre nedotknuté: `Nášivky` (umiestnenie), `Nášivka dvere`/`Nášivka boky`
      yes/no zostali ako boli — žiadny konflikt s `pricing.js` matchermi
- [x] Oba feedy validujú proti `docs/shoptet-products-complete-v10.rng`
- [ ] Frontend mapping (resolveValue) na nové SHORT_NAME per pozícia — klient si upraví sám
- [ ] Naimportovať oba feedy do Shoptetu (SK test-truck aj CZ TRUCK) a overiť 6 selectov
- [ ] Mimo rozsahu, len zaznamenané: CZ `Čalounění` (SHORT_NAME) nesedí s `pricing.js`
      matcherom `eq("Tapacír","Tapacir")` — cenotvorba na CZ e-shope preto na tomto
      parametri padá; riešiť samostatne

## Hlavný prepínač osobáky ↔ kamióny (homepage)
- [x] truck/build-truck-brands.mjs — značky+modely sa ťahajú priamo z
      konfigurátora (CONFIG v konfigurator.jsx) do truck-brands.js.
      13 značiek / 35 modelov. Zapojené do yarn build/build:once/truck:test,
      takže dáta ostávajú v sync automaticky.
- [x] main.js → initVehicleKindSwitch: posuvný prepínač nad výberom.
      Osobácka vetva NEZMENENÁ. Kamiónový panel = REPLIKA kroku 1 truck
      konfigurátora (Dropdown komponenta): vlastný dropdown, zlatý rámček
      pri výbere, chevron, zoznam s aktívnou položkou, model až po značke,
      zelené CTA až po kompletnom výbere.
- [x] Výber sa ukladá do sessionStorage (truckBrand/truckModel) a konfigurátor
      si ho predvyplní (validácia proti CONFIG).
- [x] test-vehicle-switch.mjs — 19 kontrol (render, prepínanie, dropdown
      interakcia, viditeľnosť modelu/CTA, redirect, session). Zelené.
- [ ] Overiť vizuál v náhľade — preview servíruje produkčný CDN bundle
      (project.json override jsFileName=/assets/js/main.js). Prepnúť na
      /assets/js/luxuryCar.js.
- [ ] TRUCK_PRODUCT_URL zatiaľ mieri na testovací produkt
      /luxusne-autokoberce-truck---test-konfigurator/ — po spustení ostrého
      produktu prepísať v truck-brands.js (resp. build skripte).
- [x] Prepínač PREROBENÝ podľa pripomienok: (1) taby = piktogramy (SVG auto /
      kamión) s názvom, aktívny = zlaté podčiarknutie — žiadne veľké pill
      tlačidlá; (2) kamiónová vetva má IDENTICKÝ dizajn ako osobácke selecty
      (rovnaký markup surcharge-list/dm-selector + CSS zoznam rozšírený o
      truck-brands/truck-models) + tlačidlo .btn.choice-Model + errorToCart
      validácia; dáta ďalej z truck konfigurátora; (3) init volaný ako
      POSLEDNÝ v initModelSelect a v try/catch — nemôže zhodiť osobáky;
      truck change handlery so stopImmediatePropagation (globálny saveModel
      binding by prepisoval sessionStorage osobákov). initModelSelect
      overený jsdom harnessom: brands aj roky sa plnia, žiadny throw.
      test-vehicle-switch: 15 kontrol vrátane saveModel interferencie.
- [x] Prepínač v3 podľa pripomienok: (1) piktogramy nahradené Font Awesome
      Free ikonami (car-side / truck-moving, CC BY 4.0) — stiahnuté z unpkg,
      inline SVG; (2) preverené jsdom testom, že preselect z homepage v
      konfigurátore predvyplní značku+model A zobrazí povinné parametre
      (prevodovka/sedadlo…, single-option sa auto-vyberie) — funguje;
      (3) CZ/SK: všetky texty prepínača sú dvojjazyčné, cieľová URL per-lang.
      Vizuál overený v preview (desktop + mobil screenshot).
- [x] Cieľová URL OPRAVENÁ na ostré produkty (zo sitemap, oboje 200):
      SK /luxusne-autokoberce-truck/ (19 surcharge selectov),
      CZ /luxusni-autokoberce-truck/. Testovací slug
      ...---test-konfigurator/ sa už nepoužíva.

## Menu widget — CTA na vzorkovník (18.8.2026)
- [x] CTA pás `.menu-widget-cta` na spodku #menu-widget (JS injekcia v
      header.js, ako truck dlaždica) — 4 reálne swatche z uploadu
      /user/documents/upload/assets/config/ (D-1, S-1, H-1, LUX-01), text
      krátky claim + tlačidlo na produkt vzorkovníka.
      SK aj CZ URL overené (200 + klik v preview naviguje na produkt).
- [x] Copy prepísané po pripomienke klienta — pôvodné „Nevíte vybrat barvu?"
      bol slovakizmus. Teraz SK „Neviete, akú farbu?" / CZ „Nevíte, jakou barvu?"
      + kratší podtext „Záloha 99 Kč se vrací." (CZ panel je užší ako SK,
      dlhší text sa lámal na 4 riadky). Overené na CZ desktop aj mobile.
- [x] Mobil: menu sa nedalo scrollovať — `overflow: scroll` bez stropu výšky
      nemá čo scrollovať, panel len pretiekol pod spodok obrazovky. Doplnené
      `max-height: calc(100dvh - 46px)` (+ vh fallback), `overflow-y: auto`,
      `overscroll-behavior: contain`. Overené dočasným stropom 400px:
      kontajner reálne odscrolloval o 511px na CTA.

## Pripomienky klienta k vzorkovníku + kamiónom (20.8.2026)
- [x] Poznámka objednávky „model: undefined undefined undefined undefined":
      `saveModel()` (main.js) ukladal reťazec aj keď selecty auto-konfigurátora
      na stránke nie sú (vzorkovník/truck). Guard: ukladá len s vyplnenými
      Brand+Model+Year+type; `toNote()` navyše cez `isUsableSavedModel()`
      odmieta akýkoľvek reťazec s „undefined"/„null".
- [x] Názvy vzoriek v objednávke: Shoptet zobrazuje SHORT_NAME, ktorý bol len
      kód („LUX-01"). Teraz SHORT_NAME = séria + farba kože prešívaná farbou
      šitia + kód v zátvorke. Zmenené v `vzorky/build-product-xml.mjs` (SK,
      pregenerované, validuje) aj v `cz-import/vzorky-a-truck-cz.xml`
      (45 parametrov prepísaných, validuje). NUTNÝ RE-IMPORT feedu.
- [x] Kamióny: 3-riadkový nadpis nad galériou (LUXURY CAR DESIGN / LUXUSNÉ
      AUTOKOBERCE / DRAGONSKIN BASIC DIAMOND LINE) odstránený — JS
      (`ensureTruckGalleryHeading` v productPage.js) aj CSS
      (`.truck-gallery-heading*` v _truckKonfigurator.scss).
- [ ] Cena vzorkovníka 0,01 € / 1 Kč: ide o ADMIN nastavenie základnej ceny,
      nie o kód. Naše JS zaokrúhľuje len ZOBRAZENÚ cenu — v objednávke cent
      zostáva. Pôvodná poznámka hovorí, že 0,01 € bolo zvolené preto, že
      Shoptet nulový produkt nezobrazí — treba v admine overiť cenu 0.
- [ ] „Popisky nie sú vycentrované a dokončené, pozor na pozadie" — čaká na
      spresnenie (ktoré popisky/stránka); náhľadový server bol počas úpravy
      nedostupný, vizuál sa nedal skontrolovať.
- [ ] `yarn vzorky:test` padá 5 kontrol (skip dlaždica, odznačenie D-2,
      LUX-01, počítadlo Diamond) — overené `git stash`om, že padá aj bez
      dnešných zmien. Samostatná regresia na doriešenie.

## Zadání 1.10. — vzorky v objednávce (feedback klienta)
- [x] Názvy vzorků: "Diamond – kůže černá, prošití červené (D-1)" místo kódu / "Černá prošívaná…"
    - Změny: cz-import/vzorky-a-truck-cz.xml — 45× SHORT_NAME, hodnota "Chci – vratná záloha 99 Kč" → "Ano"
    - Změny: vzorky/build-product-xml.mjs (sampleLabel, "Áno") + regenerovaný vzorky/dist/vzorky-product.xml; oba validní RELAX NG
    - [ ] Zkontroluj: po re-importu feedu v adminu objednávka vzorku ukazuje "Diamond – kůže …, prošití … (D-x) - Ano"
- [ ] Barva prošití u jednobarevných vzorků (D-10…D-18, S-4…S-8) — chybí v datech, čeká na klienta
- [ ] Nasadit: merge feat/vzorky-shoptet-html → main (fix poznámky "model: undefined…") + re-import CZ i SK feedu
