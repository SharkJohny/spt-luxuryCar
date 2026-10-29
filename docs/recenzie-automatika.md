# Recenzie Google: automatika (raz za 2 týždne)

Nové recenzie z Google profilu sa raz za 2 týždne samy dostanú na web luxurycardesign.sk a .cz (Michal 29. 10. 2026: denne netreba). V admine Shoptetu sa nič neprepína.

## Čo beží

| Čo | Kde |
|---|---|
| Úloha v Plánovači úloh | **„LCD Recenzie Google“**. Plánovač ju spúšťa denne o 8:30 a 15 min po prihlásení, ale beh hneď skončí, kým od posledného úspechu neuplynie 14 dní (INTERVAL_DNI v lib.mjs, premenná LCD_RECENZIE_INTERVAL_DNI). Zmeškaný termín (vypnutý PC) dobehne pri najbližšom spustení, po zlyhaní sa skúša každý deň (CRM úloha pri 3. neúspešnom dni po sebe). Spúšťa sa len vtedy, keď je Michal prihlásený, lebo scraper potrebuje Chrome. |
| Spúšťač bez okna | `wscript.exe tools\recenzie-auto\spusti-skryto.vbs "C:\Program Files\nodejs\node.exe"` |
| Skript | `tools/recenzie-auto/beh.mjs` v **samostatnom klone** `C:\Users\M\Desktop\spt-luxuryCar-recenzie-beh`. Klon slúži len pre automatiku: každý beh ho vráti na `origin/main`, preto doň nič nepíš. |
| Stav a logy (mimo repa) | `C:\Users\M\Documents\LCD-recenzie-auto\`: `stav.json` (počítadlo zlyhaní), `historia.log` (1 riadok na beh), `logy\` (posledných 60 behov a snímky pri chybe), `posledny-scrape.json` |

**Jeden beh (cca 1–2 min; po pushi ešte čaká na CDN najviac 20 min):**
1. Vráti klon na `origin/main` (fetch + `reset --hard`).
2. Stiahne recenzie z Googlu: `node tools/scrape-google-reviews.mjs`, Chrome bez okna. Ak načíta menej ako 90 % recenzií, končí chybou a nič nemení.
3. Spojí ich s doterajšími recenziami (`tools/reviews-update.mjs`) a pripraví náhľady fotiek (`tools/recenzie-nahlady.py`).
4. Ak pribudlo niečo skutočné (nová recenzia, text, hviezdy, počet alebo fotka; nestačí nový čas stiahnutia), urobí **commit len dátových súborov**:
   - `assets/js/reviews-data.js`
   - `tools/google-reviews-fresh.json`
   - `assets/img/reviews/(m/)rg-*.jpg`

   Potom fetch, rebase a **push do main**. Skúsi to najviac 3×, nikdy nie force.
5. Počká, kým CI (`production.yml`) dá dáta na CDN `assets/data/reviews-data.js`. Odtiaľ si ich web berie (`?h=` = 6-hodinový blok).
6. Ak sa nič nezmenilo, nič necommitne. Ak dnes už raz prebehol úspešne, ďalšie spustenie v ten deň hneď skončí.

## Keď to zlyhá

- Každý deň so zlyhaním zvýši počítadlo v `stav.json`. Úspešný beh ho vynuluje.
- Pri **3. neúspešnom dni po sebe** vznikne **úloha v CRM**:
  - termín a pripomienka dnes o 9:00,
  - text obsahuje, čo zlyhalo, kde je log a ako beh spustiť ručne,
  - na jednu sériu zlyhaní vznikne len jedna úloha (značka `auto_ulohy`).
- Ak CRM nejde (napr. chýba kľúč), ukáže sa upozornenie Windows.
- Web medzitým ukazuje posledné dobré recenzie, takže sa nič nepokazí.

**Čo robiť pri CRM úlohe:**
1. Otvor log z úlohy, alebo najnovší súbor v `Documents\LCD-recenzie-auto\logy`. Pri chybe scrapera sú pri ňom aj snímky `*-CHYBA.png`.
2. Spusti beh ručne (pozri nižšie). Ak prejde, úloha je vybavená.
3. Ak neprejde, napíš Claudovi: „Recenzie Google: automatika zlyháva, pozri log … a oprav to.“

Časté príčiny:
- Google zmenil vzhľad stránky alebo ukázal captchu: treba upraviť scraper.
- Chýba internet alebo prihlásenie do GitHubu (`gh auth status`).
- CI na GitHube nedobehol: pozri GitHub Actions.

## Ručné spustenie

```powershell
Start-ScheduledTask -TaskName "LCD Recenzie Google"                        # ako Plánovač (bez okna)
node C:\Users\M\Desktop\spt-luxuryCar-recenzie-beh\tools\recenzie-auto\beh.mjs --vynut   # s výpisom, aj keď dnes už prebehol
```

Skúšky (nič nepushnú; CRM úlohu len vypíšu; majú vlastný stav v `Documents\LCD-recenzie-auto\skuska`):

```powershell
node tools\recenzie-auto\beh.mjs --bez-push                 # celý beh naostro, commit ostane len v klone
node tools\recenzie-auto\beh.mjs --simuluj-chybu --dnes 2026-10-27   # zlyhanie; ďalšie dni = 3. deň vypíše CRM úlohu
node tools\recenzie-auto\test.mjs                           # testy logiky (počítadlo, CRM úloha, súbory)
node tools\recenzie-auto\test-push.mjs                      # push/rebase/konflikt v pieskovisku (bez GitHubu a Googlu)
```

## Zapnutie, vypnutie, kľúč CRM

```powershell
powershell -ExecutionPolicy Bypass -File tools\recenzie-auto\registruj.ps1        # pripraví klon a zaregistruje úlohu (-Skus = len výpis)
powershell -ExecutionPolicy Bypass -File tools\recenzie-auto\odregistruj.ps1 -LenVypni   # dočasne vypnúť (Enable-ScheduledTask zapne)
powershell -ExecutionPolicy Bypass -File tools\recenzie-auto\odregistruj.ps1      # zrušiť úlohu
powershell -ExecutionPolicy Bypass -File tools\recenzie-auto\nastav-kluc-crm.ps1  # Michal vloží kľúč CRM do skrytého vstupu
```

**Kľúč CRM:**
- Je to Supabase secret kľúč projektu CRM. Odporúčaný je vlastný kľúč, napr. `recenzie_pc_2026_10`, aby sa dal zrušiť samostatne.
- Uloží sa do `%USERPROFILE%\.claude\secrets\crm.env`. Nikdy nie do repa a nikdy sa nevypisuje.
- Overenie (len čítanie): `node tools\recenzie-auto\beh.mjs --over-crm`.

Vypnutie automatiky webu nič neuberie: zostanú posledné nahraté recenzie, len nové nepribudnú.

## Neskôr: oficiálne Google Business Profile API

Po schválení prístupu sa scraper nahradí volaním API (`accounts.locations.reviews.list`), ktoré vráti rovnaký `google-reviews-fresh.json`. `reviews-update.mjs` ani táto automatika sa nemenia.
