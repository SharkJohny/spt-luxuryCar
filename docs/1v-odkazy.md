# Nový vzhľad 1V za `?novy=1` — odkazy a kroky v adminoch

Zoznam vydaní, testovacie odkazy a presné kroky, ktoré robí Michal v SK admine. Claude do adminu nikdy nič neuloží.
Pre zákazníka bez `?novy=1` sa nemení nič (brána: `konfigurator1v/produkty.js`, `ZAPNUTE_TYPY`).

Odkaz = adresa + `?novy=1`. Flag platí v celej karte prehliadača. `?novy=0` vzhľad vypne.

---

## Vlna 1 — Jednovrstvové (598 Diamond, 610 Hexa, 613 Stripe)

**Stav:** pripravené v kóde a testoch, vydanie (commit, push, sha na CDN) robí integrátor.
**sha vydania:** `SHA_DOPLNI_VYDANIE` (po vydaní vyplniť z `assets/v/<sha>/js/version.json`).

### Odkazy na skúšku

| Produkt | Odkaz |
|---|---|
| 598 Jednovrstvové Diamond (219 €) | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line/?novy=1 |
| 610 Jednovrstvové Hexa (230 €) | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-hexa-line/?novy=1 |
| 613 Jednovrstvové Stripe (230 €) | https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-stripe-line/?novy=1 |

Medzi vzormi sa dá prepínať v kroku 1 (nový vzhľad ostane zapnutý, auto sa zachová).
Obsah pod konfigurátorom je pri 610 a 613 ten istý ako pri 598 (jeden obsah pre jednovrstvové). Čo závisí od vzoru, sú značky v `admin-html/src/p1v-598/`:
- `data-p1v-odkaz="dvoj"` (tlačidlo „Pozrite si dvojvrstvové“, odkaz „Mnoho ďalších farieb“) → na 610 `/luxusne-autokoberce-dragonskin-elite-hexa-line/`, na 613 `/…-elite-stripe-line/`, na 598 `/…-elite-diamond-line/`.
- `data-p1v-cislo="cena-od"` (porovnanie s napodobeninami) → cena „od …“ zo živých dát: 598 `od €219`, 610 a 613 `od €230` (formát `od €230` je pôvodný zápis obsah-b.js).
Dosadzuje to `obsah-cisla.js` z T0.3 (načítanie obsahu z CDN, D1 = b). **Bez T0.3 sa obsah na 610 a 613 vôbec nenačíta**, takže toto platí až po jeho zlúčení (overené na spojení T0.1+T1.1+T0.3: `test-1v-obsah.mjs --produkt 598,610,613`).
Ostatné čísla (ceny rohože do kufra, boxu, počty farieb) v obsahu 598 nie sú, preto im nič nemusí byť značkou.

### Admin kroky (Michal)

**A. Povinné pre odkazy.** Shoptet **SK** admin → HTML kódy: v oboch adresách `…/eshopy/luxuryCar/assets/v/<sha>/js/luxuryCar.js` a `…/assets/v/<sha>/css/luxuryCar.css` vymeň sha za `SHA_DOPLNI_VYDANIE`.
- Pred zmenou si zapíš súčasný sha (návrat).
- **CZ HTML kódy nemeň** (ostáva `5db0f33`).
- Bez tohto kroku odkazy ukazujú starý vzhľad.

**B. Obsah pod konfigurátorom.** Podľa D1 = b nič: obsah príde z CDN len s `?novy=1`.

**C. Opravy v SK admine, ktoré sa týkajú týchto produktov** (platia pre všetkých zákazníkov, nový vzhľad ukazuje presne to, čo je v admine):
1. **610 Hexa**: parameter 88 „autokoberce do kufru“, hodnota 598 „nie“ má príplatok +5 €, má byť 0 €. Dnes zákazník, ktorý rohož do kufra nechce, platí o 5 € viac (to isté robí starý vzhľad; v teste s rozložením 1. rad a TYP Combi 250 € namiesto 245 €).
2. **613 Stripe**: chýba bežná cena, preto sa neukáže odporúčaná cena ani zľava. Pre porovnanie: 610 má bežnú cenu 368 €.
3. Poznámka (nie oprava): ceny jednovrstvových sú 219 € (Diamond) a 230 € (Hexa, Stripe), preto je veta „všetky vzory majú rovnakú cenu“ v novom vzhľade vypnutá.

**D. Pri spustení pre všetkých (neskôr, samostatné rozhodnutie):** obsah do Popisu produktu, brána `?novy=1` preč.

### Otázky pre Michala

- Sekcia „Ku ktorej farbe patrí Vaše auto?“ pod konfigurátorom ukazuje pri 610 a 613 vzorky a popisy Diamond Line (podľa plánu ostáva obsah 598 bez zmeny, mení sa len čísla a odkazy). Nechať, alebo ju na 610 a 613 schovať?
- Klik na „Zmeniť“ pri kroku Vzor bez vybraného auta ukáže okno „Vyberte model“ (pôvodný kód `validation.js` ho ukazuje pri kliku kamkoľvek do konfigurátora bez auta). Chceš, aby sa pri výbere vzoru neukazovalo?

### Návrat

Vymeň sha v SK HTML kódoch späť za zapísaný predchádzajúci. Nič iné nie je potrebné.
