# Nový vzhľad 1V za `?novy=1` — odkazy a kroky v admine

Testovacie odkazy pre všetkých 13 SK produktov + vzorkovník a presné kroky, ktoré robí Michal v SK admine. Claude do adminu nikdy nič neuloží.
Pre zákazníka bez `?novy=1` sa nemení nič (brána: `konfigurator1v/produkty.js`, `ZAPNUTE_TYPY` = jedno, dvoj, kufor-classic, kufor-premium, boxy, vzorky).

Odkaz = adresa + `?novy=1`. Flag platí v celej karte prehliadača (prechod medzi produktmi ho drží). `?novy=0` vzhľad vypne.

**sha vydania:** `adb9eaa` (naživo od 15. 10. 2026 17:27; predtým `145a9f5`, `d582a33`, `4be992b`, `2e02539`). Nové: ponuka druhej vrstvy na 598/610/613 po výbere farby (Áno → dvojvrstvové so zachovaným výberom).

---

## Odkazy (14)

| # | Produkt | Typ | Odkaz | Čo skontrolovať |
|---|---|---|---|---|
| 1 | 598 Jednovrstvové Diamond | jedno | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line/?novy=1 | 6 krokov (vzor → auto → farba → rozloženie → rohož do kufra → box); cena „219 €“, odporúčaná prečiarknutá s % a „Ušetríte … €“; „Spolu“ a lišta na telefóne s tou istou cenou; obsah pod konfigurátorom; klik na „Zmeniť“ pri Vzore bez auta otvorí výber vzoru (žiadne okno „najskôr vyberte model“) |
| 2 | 610 Jednovrstvové Hexa | jedno | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-hexa-line/?novy=1 | cena „230 €“ s odporúčanou; „Ku ktorej farbe patrí Vaše auto?“ ukazuje 3 vzorky Hexa Line (nie Diamond); odkaz na dvojvrstvové vedie na Hexa; voľba „nechcem rohož do kufra“ stojí +5 € (chyba v admine, pozri C1) |
| 3 | 613 Jednovrstvové Stripe | jedno | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-stripe-line/?novy=1 | cena „230 €“ bez odporúčanej ceny (v admine chýba bežná cena, C4); 8 vzoriek Stripe Line pod konfigurátorom; odkazy na Stripe produkty |
| 4 | 601 Dvojvrstvové Diamond | dvoj | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-elite-diamond-line/?novy=1 | 7 krokov s krokom „Farba 2. vrstvy“ (16 Lux, štítok „Odporúčame“ pri jednofarebných Lux v tóne 1. vrstvy, nič predvolené); cena „351 €“; obsah dvojvrstvových |
| 5 | 604 Dvojvrstvové Hexa | dvoj | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-elite-hexa-line/?novy=1 | ako 601; cena „362 €“; príplatok 1.+2. rad +55 € (C2) |
| 6 | 607 Dvojvrstvové Stripe | dvoj | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-elite-stripe-line/?novy=1 | ako 601; cena „362 €“; príplatky iné ako pri 601 (C3) |
| 7 | 619 Rohož do kufra Classic Diamond | kufor-classic | https://www.luxurycardesign.sk/luxusny-koberced-do-kufra-dragonskin-klasik/?novy=1 | 3 kroky (vzor → auto → farba); dlaždice vzorov „230 € / 240 € / 240 €“, zhrnutie „Diamond Line · 230 €“; pás „V sete s autokobercami len + 129 € (ušetríte 101 €)“; pod košíkom odkaz na Premium; FAQ 9, 10, 11 s cenami; paleta bez 4 farieb (C5) |
| 8 | 622 Rohož do kufra Classic Hexa | kufor-classic | https://www.luxurycardesign.sk/luxusny-koberced-do-kufra-dragonskin-klasik-hexa/?novy=1 | ako 619; cena „240 €“; vzorky farieb Hexa Line (3), odkazy na Hexa produkty |
| 9 | 625 Rohož do kufra Classic Stripe | kufor-classic | https://www.luxurycardesign.sk/luxusny-koberced-do-kufra-dragonskin-klasik-stripe/?novy=1 | ako 619; cena „240 €“ bez odporúčanej (C4); vzorky Stripe Line |
| 10 | 628 Rohož do kufra Premium Diamond | kufor-premium | https://www.luxurycardesign.sk/luxusny-koberced-do-kufra-dragonskin-premium/?novy=1 | 3 kroky; dlaždice „v cene / + 10 € / + 10 €“; pás „V sete s autokobercami len + 239 €“ (celý pás je odkaz); cena „340 €“; obsah s mapou „Čo kryje“ |
| 11 | 631 Rohož do kufra Premium Hexa | kufor-premium | https://www.luxurycardesign.sk/luxusny-koberced-do-kufra-dragonskin-premium-hexa/?novy=1 | ako 628; cena „350 €“, zhrnutie „Hexa Line · + 10 €“; vzorky Hexa Line |
| 12 | 634 Rohož do kufra Premium Stripe | kufor-premium | https://www.luxurycardesign.sk/luxusny-koberced-do-kufra-dragonskin-premium-stripe/?novy=1 | ako 628; cena „350 €“; vzorky Stripe Line; chýba farba Hnedá (C5) |
| 13 | 616 Box do kufra | boxy | https://www.luxurycardesign.sk/luxusny-boxi-do-kufra/?novy=1 | 3 kroky (farba → počet → veľkosť); 1 box „od 197 €“, veľkosti „197 / 207 / 232 / 246 €“; 2. a 3. box; prepnutie 3 → 1 vyprázdni 2. a 3. box; bez veľkosti sa do košíka nedá; XL 246 vs 249 € (C6) |
| 14 | 637 Vzorkovník | vzorky | https://www.luxurycardesign.sk/vzorkovnik-dragonskin---objednavka-vzoriek/?novy=1 | výber vzoriek, „5 € za vzorku · vratná záloha“; „Spolu“ = 5 € × počet; bez vzorky sa do košíka nedá; obsah o vrátení zálohy a FAQ |

Všade: cena v novom vzhľade v tvare „230 €“ (nie „€230“); krátky popis pod hodnotením je pod novým vzhľadom skrytý (ostáva v kóde stránky); pri farbe sa hlavná fotka nemení; v košíku presne tá cena, ktorú stránka ukáže.

---

## Admin kroky (Michal)

**A. Povinné pre odkazy.** Shoptet **SK** admin → HTML kódy: v oboch adresách `…/eshopy/luxuryCar/assets/v/<sha>/js/luxuryCar.js` a `…/assets/v/<sha>/css/luxuryCar.css` vymeň `fc20e3e` za `2e02539` (2× v Záhlaví, 2× v Zápätí).
- Pred zmenou si zapíš súčasný sha (návrat).
- **CZ HTML kódy nemeň** (ostáva `5db0f33`).
- Bez tohto kroku odkazy ukazujú starý vzhľad.

**B. Obsah pod konfigurátorom.** Podľa D1 = b nič: obsah príde z CDN verzie (`assets/v/<sha>/html/p1v-*.sk.html`) len s `?novy=1`.

**C. Opravy v SK admine** (platia pre všetkých zákazníkov, s flagom aj bez neho; nový vzhľad ukazuje presne to, čo je v admine — D2):
1. **610 Hexa**: parameter 88 „autokoberce do kufru“, hodnota „nie“ má príplatok +5 €, má byť 0 €.
2. **604 Elite Hexa**: parameter 85, „1.+2. rad“ +55 € (601 má +50 €) — ak to nie je zámer.
3. **607 Elite Stripe**: príplatky rohože do kufra (88), boxov (94, 97) a karosérie (74) sú iné ako pri 601 — ak to nie je zámer, zjednotiť (zoznam v `plan.md` §3 C3).
4. **Bežná cena** chýba pri 613 Stripe a 625 Classic Stripe — preto sa neukáže odporúčaná cena ani zľava.
5. **Palety farieb:** 619 Classic Diamond nemá bielu, žltú, zelenú a bronzovú niť; 634 Premium Stripe nemá Hnedú; 616 box má Šedú namiesto Béžovej („Farba boxov“ v sete).
6. **Box 616 XL**: 1. box 246 €, 2. a 3. box +249 €.
7. Voliteľné: preklepy v názvoch rohoží a boxu („Luxusný koberce…“, „luxusný boxi“) — prejaví sa aj v košíku, na faktúrach a vo feede; v H1 boxu musí ostať slovo „box“.

**D. Pri spustení pre všetkých (neskôr, samostatné rozhodnutie):** obsah do Popisu produktov (z `admin-html/dist`), brána `?novy=1` preč.

## Návrat

Vymeň sha v SK HTML kódoch späť za zapísaný predchádzajúci. Nič iné nie je potrebné.
