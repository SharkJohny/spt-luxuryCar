// Zákaznícke texty konfigurátora kamiónov (SK 640) — VYGENEROVANÉ zo schváleného artefaktu kamiony-app
// (data/texty.json bez meta, poznámok k návrhu, otázok na overenie, obsahu a SEO; 18. 10. 2026). Texty prešli kontrolou
// pravidiel — nemeniť ich zmysel. Pripomienky Michala sa zapracúvajú SEM. „ui“ = texty, ktoré má artefakt priamo
// v app.js. Ceny v textoch nie sú: {x}, {suma} dosadí ui.js z cena.js (živé ceny Shoptetu).
export const TEXTY = {
 "hlavicka": {
  "kicker": "Kamióny a dodávky",
  "h1": [
   "Luxusné autokoberce",
   "do kamiónov a dodávok"
  ],
  "perex": "Koberce do kabíny sa šijú podľa šablóny pre Váš model a vyhotovenie kabíny. Materiál, farbu, lemovanie aj nášivky si vyberiete sami a cenu vidíte hneď.",
  "hodnotenie": {
   "sablona": "{hodnotenie} ★★★★★ {pocet} {tvar} na Google",
   "tvary": [
    "recenzia",
    "recenzie",
    "recenzií"
   ]
  },
  "cena_popis": {
   "stitok": "Naša cena",
   "od": "od",
   "suma": "{cena} €",
   "veta_volitelna": "Farba ani lemovanie cenu nemenia."
  },
  "v_cene": {
   "nadpis": "V základnej cene",
   "chipy": [
    "Koberec šoféra",
    "Koberec spolujazdca",
    "Stredový koberec",
    "Farba a lemovanie v cene"
   ]
  },
  "kompatibilita": {
   "text": "Pre {vozidlo} máme šablóny.",
   "nie_je_v_zozname": "Váš model v zozname nie je? Zavolajte nám na +421 903 660 720 alebo napíšte na info@luxurycardesign.sk. Dostupnosť preveríme."
  }
 },
 "kroky": {
  "postup": "Váš set v 6 krokoch",
  "hotovo": "Hotovo {h} z 6",
  "kicker_sablona": "Krok {n} z 6",
  "vozidlo": {
   "kicker": "Krok 1 z 6",
   "nazov": "Vozidlo",
   "otazka": "Prosím, vyberte si svoje vozidlo",
   "pomocna_veta": "Po výbere modelu sa opýtame už len na to, v čom sa kabíny tohto modelu líšia – napríklad na prevodovku alebo sedadlo spolujazdca.",
   "prepinac": {
    "popis": "Typ vozidla",
    "kamion": "Kamión",
    "dodavka": "Dodávka"
   },
   "polia": {
    "znacka": {
     "label": "Značka",
     "placeholder": "Vyberte značku"
    },
    "model": {
     "label": "Model a roky výroby",
     "placeholder": "Vyberte model"
    },
    "prevodovka": {
     "label": "Prevodovka",
     "placeholder": "Vyberte prevodovku",
     "moznosti": {
      "Automatická prevodovka": "Automatická",
      "Manuálna prevodovka": "Manuálna"
     }
    },
    "sedadlo": {
     "label": "Sedadlo spolujazdca",
     "placeholder": "Vyberte sedadlo spolujazdca",
     "moznosti": {
      "Sedadlo spolujazdca CINEMA": "CINEMA",
      "Sedadlo spolujazdca odpružené": "Odpružené",
      "Sedadlo spolujazdca pevné": "Pevné",
      "Sedadlo spolujazdca pevné (taburet)": "Pevné (taburet)",
      "Sedadlo spolujazdca odpružené (veľká základňa)": "Odpružené (veľká základňa)",
      "Sedadlo spolujazdca odpružené (veľká základňa – ako u vodiča)": "Odpružené (veľká základňa, ako má šofér)",
      "Sedadlo spolujazdca odpružené + otočné (veľká základňa)": "Odpružené a otočné (veľká základňa)",
      "Sedadlo spolujazdca odpružené/otočné (veľká základňa)": "Odpružené alebo otočné (veľká základňa)",
      "Sedadlo spolujazdca odpružené/otočné/pneumatické (veľká základňa)": "Odpružené, otočné alebo pneumatické (veľká základňa)",
      "Sedadlo spolujazdca 1-miestne": "Jednomiestne",
      "Sedadlo spolujazdca 2-miestne": "Dvojmiestne",
      "Bez sedadla spolujazdca": "Bez sedadla spolujazdca"
     }
    },
    "zasuvky": {
     "label": "Počet zásuviek",
     "placeholder": "Vyberte počet zásuviek",
     "moznosti": {
      "1 zásuvka (šuplík)": "1 zásuvka",
      "2 zásuvky (šuplíky)": "2 zásuvky"
     }
    },
    "brzda": {
     "label": "Parkovacia (ručná) brzda",
     "placeholder": "Vyberte typ brzdy",
     "moznosti": {
      "Elektrická ručná brzda umiestnená na palubnej doske": "Elektrická, na palubnej doske",
      "ADR – pneumatická ručná brzda umiestnená v podlahe vedľa sedadla vodiča": "ADR – pneumatická, v podlahe vedľa sedadla šoféra"
     }
    }
   },
   "jedina_moznost": "{hodnota} – pre tento model je len táto možnosť.",
   "poznamka": "Šablóny máme pre 28 modelov kamiónov a 7 modelov dodávok.",
   "zhrnutie": "{znacka} {model} · {detaily}",
   "chyby": {
    "karta": "Prosím, doplňte údaje označené červenou.",
    "znacka": "Prosím, vyberte značku vozidla.",
    "model": "Prosím, vyberte model.",
    "prevodovka": "Prosím, vyberte prevodovku.",
    "sedadlo": "Prosím, vyberte sedadlo spolujazdca.",
    "zasuvky": "Prosím, vyberte počet zásuviek.",
    "brzda": "Prosím, vyberte typ parkovacej brzdy."
   }
  },
  "material": {
   "kicker": "Krok 2 z 6",
   "nazov": "Materiál",
   "otazka": "Prosím, vyberte si materiál",
   "pomocna_veta": "Príplatok za materiál platíte raz – za všetky tri koberce spolu. Farbu si vyberiete v ďalšom kroku.",
   "volby": [
    {
     "shoptet": "Prémiová syntetická koža – jednofarebná",
     "nazov": "Prémiová syntetická koža",
     "variant": "jednofarebná",
     "popis": "Hladký povrch v jednej farbe. Pôsobí čisto a nadčasovo.",
     "farby_text": "13 farieb"
    },
    {
     "shoptet": "Prémiová syntetická koža – prešívaná",
     "nazov": "Prémiová syntetická koža",
     "variant": "prešívaná",
     "popis": "Prešívaný kosoštvorcový vzor dodá kabíne luxusnejší vzhľad.",
     "farby_text": "14 farieb"
    },
    {
     "shoptet": "Prémiová syntetická koža – tónovaná",
     "nazov": "Prémiová syntetická koža",
     "variant": "tónovaná",
     "popis": "Povrch s jemne žíhaným, vintage vzhľadom.",
     "farby_text": "5 farieb"
    },
    {
     "shoptet": "Mikrosemiš – jednofarebný",
     "nazov": "Mikrosemiš",
     "variant": "jednofarebný",
     "popis": "Mäkký, jemný povrch v jednej farbe.",
     "farby_text": "5 farieb"
    },
    {
     "shoptet": "Mikrosemiš – dvojfarebný",
     "nazov": "Mikrosemiš",
     "variant": "dvojfarebný",
     "popis": "Mikrosemiš s melírovaným dvojfarebným efektom.",
     "farby_text": "6 farieb"
    }
   ],
   "cena_v_cene": "v cene",
   "zhrnutie": "{nazov}, {variant} · {cena_text}",
   "chyba": "Prosím, vyberte materiál."
  },
  "farba": {
   "kicker": "Krok 3 z 6",
   "nazov": "Farba",
   "otazka": "Prosím, vyberte si farbu materiálu",
   "pomocna_veta": "Farba cenu nemení. Vybraný odtieň uvidíte zväčšený pod ponukou.",
   "nahlad": "Vybraté: {farba} ({kod}) · {material}",
   "kod_popis": "kód {kod}",
   "zhrnutie": "{farba} ({kod})",
   "chyba": "Prosím, vyberte farbu materiálu.",
   "mena_farieb_navrh": {
    "Prémiová syntetická koža – prešívaná": [
     {
      "kod": "12",
      "meno": "Čierna"
     },
     {
      "kod": "6",
      "meno": "Čierna s červeným stehom"
     },
     {
      "kod": "11",
      "meno": "Grafitová"
     },
     {
      "kod": "5",
      "meno": "Sivá"
     },
     {
      "kod": "2",
      "meno": "Béžová"
     },
     {
      "kod": "8",
      "meno": "Karamelová"
     },
     {
      "kod": "4",
      "meno": "Hnedá"
     },
     {
      "kod": "10",
      "meno": "Tmavohnedá"
     },
     {
      "kod": "15",
      "meno": "Koňaková"
     },
     {
      "kod": "7",
      "meno": "Červená"
     },
     {
      "kod": "13",
      "meno": "Bordová"
     },
     {
      "kod": "14",
      "meno": "Zelená"
     },
     {
      "kod": "3",
      "meno": "Modrá"
     },
     {
      "kod": "9",
      "meno": "Tmavomodrá"
     }
    ],
    "Prémiová syntetická koža – jednofarebná": [
     {
      "kod": "10G",
      "meno": "Čierna"
     },
     {
      "kod": "6G",
      "meno": "Grafitová"
     },
     {
      "kod": "5G",
      "meno": "Sivá"
     },
     {
      "kod": "1G",
      "meno": "Béžová"
     },
     {
      "kod": "2G",
      "meno": "Karamelová"
     },
     {
      "kod": "3G",
      "meno": "Hnedá"
     },
     {
      "kod": "4G",
      "meno": "Tmavohnedá"
     },
     {
      "kod": "13G",
      "meno": "Koňaková"
     },
     {
      "kod": "8G",
      "meno": "Červená"
     },
     {
      "kod": "11G",
      "meno": "Bordová"
     },
     {
      "kod": "12G",
      "meno": "Zelená"
     },
     {
      "kod": "7G",
      "meno": "Modrá"
     },
     {
      "kod": "9G",
      "meno": "Tmavomodrá"
     }
    ],
    "Prémiová syntetická koža – tónovaná": [
     {
      "kod": "PES4",
      "meno": "Grafitová"
     },
     {
      "kod": "PES2",
      "meno": "Sivobéžová"
     },
     {
      "kod": "PES5",
      "meno": "Hnedá"
     },
     {
      "kod": "PES6",
      "meno": "Čokoládová"
     },
     {
      "kod": "PES3",
      "meno": "Koňaková"
     }
    ],
    "Mikrosemiš – jednofarebný": [
     {
      "kod": "3NUB",
      "meno": "Grafitová"
     },
     {
      "kod": "4NUB",
      "meno": "Sivá"
     },
     {
      "kod": "1NUB",
      "meno": "Krémová"
     },
     {
      "kod": "2NUB",
      "meno": "Koňaková"
     },
     {
      "kod": "5NUB",
      "meno": "Červená"
     }
    ],
    "Mikrosemiš – dvojfarebný": [
     {
      "kod": "2N",
      "meno": "Tmavosivá"
     },
     {
      "kod": "3N",
      "meno": "Sivá"
     },
     {
      "kod": "5N",
      "meno": "Béžová"
     },
     {
      "kod": "6N",
      "meno": "Tmavohnedá"
     },
     {
      "kod": "4N",
      "meno": "Bordová"
     },
     {
      "kod": "7N",
      "meno": "Tmavomodrá"
     }
    ]
   }
  },
  "lemovanie": {
   "kicker": "Krok 4 z 6",
   "nazov": "Lemovanie",
   "otazka": "Prosím, vyberte si lemovanie",
   "pomocna_veta": "Lemovanie je pásik, ktorým sa obšije okraj každého koberca. Prvá farba je farba pásika, druhá farba jemných pruhov na ňom.",
   "v_cene": "Všetkých 13 kombinácií je v cene.",
   "stitok_odporucame": "Odporúčame",
   "volby": [
    {
     "kod": "01",
     "nazov": "Čierna + Béžová"
    },
    {
     "kod": "02",
     "nazov": "Čierna + Sivá"
    },
    {
     "kod": "03",
     "nazov": "Čierna + Grafitová"
    },
    {
     "kod": "04",
     "nazov": "Čierna + Červená"
    },
    {
     "kod": "05",
     "nazov": "Čierna + Bordová"
    },
    {
     "kod": "06",
     "nazov": "Čierna + Modrá"
    },
    {
     "kod": "07",
     "nazov": "Čierna + Zelená"
    },
    {
     "kod": "08",
     "nazov": "Čierna + Hnedá"
    },
    {
     "kod": "09",
     "nazov": "Čierna + Čierna"
    },
    {
     "kod": "10",
     "nazov": "Béžová + Modrá"
    },
    {
     "kod": "11",
     "nazov": "Béžová + Hnedá"
    },
    {
     "kod": "12",
     "nazov": "Béžová + Červená"
    },
    {
     "kod": "13",
     "nazov": "Hnedá + Béžová"
    }
   ],
   "zhrnutie": "{nazov}",
   "chyba": "Prosím, vyberte lemovanie."
  },
  "nasivky": {
   "kicker": "Krok 5 z 6",
   "nazov": "Nášivky",
   "otazka": "Prosíte si nášivky na koberce?",
   "pomocna_veta": [
    "Nášivka je motív vyšitý priamo na koberci, ",
    "vo farbe nite podľa Vášho výberu",
    "."
   ],
   "kam": "Prosím, vyberte si, kam chcete nášivky",
   "ilustracna": "Ilustračná fotka",
   "miesta": {
    "sofer": "Šofér",
    "spolujazdec": "Spolujazdec",
    "stred": "Stredový koberec"
   },
   "s_kobercami": "S kobercami",
   "volby": {
    "boky": {
     "text": "Nášivky pod sedadlá šoféra a spolujazdca",
     "popis": "na koberec šoféra aj spolujazdca – dve menšie nášivky",
     "alt": "Kabína zhora – nášivky na koberci šoféra a spolujazdca"
    },
    "boky+stred": {
     "text": "Nášivky pod sedadlá šoféra a spolujazdca + na stredový koberec",
     "popis": "všetky tri koberce v jednom balíku",
     "alt": "Kabína zhora – nášivky na koberci šoféra, spolujazdca aj na stredovom koberci",
     "stitok": "★ Najobľúbenejšie ★"
    },
    "stred": {
     "text": "Nášivka na stredový koberec",
     "popis": "medzi sedadlami – jedna väčšia nášivka",
     "alt": "Kabína zhora – nášivka na stredovom koberci medzi sedadlami"
    },
    "nechcem": {
     "text": "Nie, ďakujem",
     "popis": "koberce bez nášiviek, bez príplatku",
     "pozn": "Pokračujete bez nášiviek."
    }
   },
   "schema": {
    "aria": "Schéma kabíny zhora: {x}",
    "miesta": {
     "sofer": "šofér",
     "spolujazdec": "spolujazdec",
     "stred": "stredový koberec",
     "nic": "bez nášiviek"
    }
   },
   "karta": {
    "boky": "Nášivky pod sedadlá šoféra a spolujazdca",
    "stred": "Stredový koberec",
    "stred_len": "Nášivka na stredový koberec"
   },
   "otazky": {
    "motiv": "Prosím, vyberte si motív",
    "nit": "Prosím, vyberte si farbu nite",
    "stred": "Prosím, vyberte si nášivku na stredový koberec"
   },
   "motiv": {
    "label": "Motív",
    "volby": [
     {
      "kod": "H19",
      "meno": "Kamión"
     },
     {
      "kod": "H21",
      "meno": "Trucker"
     }
    ]
   },
   "nit": {
    "label": "Farba nite",
    "volby": [
     {
      "kod": "2999",
      "meno": "Čierna"
     },
     {
      "kod": "2901",
      "meno": "Strieborná"
     },
     {
      "kod": "3738",
      "meno": "Svetlosivá"
     },
     {
      "kod": "3546",
      "meno": "Béžová"
     },
     {
      "kod": "3617",
      "meno": "Svetlohnedá"
     },
     {
      "kod": "3504",
      "meno": "Tmavohnedá"
     },
     {
      "kod": "3501",
      "meno": "Horčicová"
     },
     {
      "kod": "2824",
      "meno": "Červená"
     },
     {
      "kod": "2866",
      "meno": "Fialová"
     },
     {
      "kod": "3842",
      "meno": "Modrá"
     },
     {
      "kod": "2840",
      "meno": "Zelená"
     }
    ],
    "prve": 6,
    "viac": "Ďalšie farby (+{n})"
   },
   "stred_rovnaky": {
    "ano": "Rovnaká ako pod sedadlami šoféra a spolujazdca",
    "ano_bez_vyberu": "rovnaký motív aj farba nite",
    "inak": "Iná nášivka",
    "inak_popis": "iný motív alebo farba nite"
   },
   "hotove": {
    "boky": "Pod sedadlá šoféra a spolujazdca:",
    "stred": "Stredový koberec:",
    "stred_rovnaka": "rovnaká ako pod sedadlami – {x}",
    "bez_priplatku": "bez príplatku"
   },
   "kam_pride": {
    "boky+stred": "na všetky tri koberce – šoféra, spolujazdca aj na stredový koberec.",
    "boky": "na koberec šoféra aj spolujazdca.",
    "stred": "na stredový koberec medzi sedadlami."
   },
   "podklad": "farba Vašich kobercov – {x}.",
   "zhrnutie": "{rozsah} · {motiv} · niť {nit}",
   "rozsah": {
    "boky+stred": "Pod sedadlá šoféra a spolujazdca + stredový koberec",
    "boky": "Pod sedadlá šoféra a spolujazdca",
    "stred": "Na stredový koberec"
   },
   "zhrnutie_nie": "Bez nášiviek",
   "chyby": {
    "volba": "Prosím, vyberte si, kam chcete nášivky, alebo „Nie, ďakujem“.",
    "motiv": "Prosím, vyberte si motív nášivky.",
    "nit": "Prosím, vyberte si farbu nite.",
    "motiv_stred": "Prosím, vyberte si motív na stredový koberec.",
    "nit_stred": "Prosím, vyberte si farbu nite na stredový koberec.",
    "stred_volba": "Prosím, vyberte si nášivku na stredový koberec.",
    "pokracovat": "Prosím, potvrďte výber tlačidlom „Pokračovať“."
   }
  },
  "tapacir": {
   "kicker": "Krok 6 z 6",
   "nazov": "Tapacír dverí",
   "otazka": "Prosíte si aj tapacír dverí?",
   "vysvetlivka": "Tapacír je výplň v\u00a0strede panelu dverí – na fotke béžová s\u00a0červeným lemovaním. Ladí s\u00a0Vašimi kobercami.",
   "foto_alt": "Celý panel dverí kamióna s tapacírom a nášivkou v strede, ilustračná fotka",
   "foto_stitok": "Tapacír dverí",
   "ilustracna": "Ilustračná fotka",
   "benefit": "Ak nič nezmeníte, bude v\u00a0rovnakom materiáli, farbe a\u00a0lemovaní ako koberce. Môžete si ich však vybrať aj inak.",
   "volby": {
    "ano": {
     "text": "Áno, chcem aj tapacír dverí",
     "s_kobercami": "S kobercami"
    },
    "nie": {
     "text": "Nie, ďakujem",
     "pozn": "Pokračujete bez tapacíru."
    }
   },
   "rovnake": {
    "ano": "Rovnaké ako koberce",
    "inak": "Vybrať inak",
    "inak_popis": "iný materiál, farbu alebo lemovanie"
   },
   "otazky": {
    "mat": "Prosím, vyberte si materiál, farbu a lemovanie tapacíru",
    "material": "Prosím, vyberte si materiál tapacíru",
    "farba": "Prosím, vyberte si farbu tapacíru",
    "lemovanie": "Prosím, vyberte si lemovanie tapacíru",
    "nasivka": "Prosím, vyberte si nášivku na tapacír dverí",
    "motiv": "Prosím, vyberte si motív",
    "nit": "Prosím, vyberte si farbu nite"
   },
   "vlastne": {
    "vybrate": "Vybraté pre tapacír",
    "bez_materialu": "materiál vyberte vyššie",
    "bez_farby": "farbu vyberte vyššie",
    "bez_lemovania": "lemovanie vyberte vyššie",
    "farba_x": "farba {x}"
   },
   "nasivka_dvere": {
    "nadpis": "Nášivka na tapacír dverí",
    "kde": [
     "Motív bude vyšitý ",
     "do stredu výplne dverí",
     " – tam, kde je na fotke zlatý krúžok."
    ],
    "foto_alt": "Panel dverí – nášivka v strede výplne, ilustračná fotka",
    "bod": "Sem príde nášivka",
    "otazka": "Prosíte si aj nášivku na tapacír dverí?",
    "s_tapacirom": "S tapacírom",
    "ano": "Áno, s\u00a0nášivkou",
    "nie": "Nie, ďakujem",
    "bez_priplatku": "bez príplatku",
    "zmena_info": "Na kobercoch už nášivka nie je. Prosím, vyberte, či chcete nášivku na tapacír dverí.",
    "rovnaka": "Rovnaká ako na kobercoch",
    "ina": "Iná nášivka",
    "ina_popis": "iný motív alebo farba nite",
    "bez_kobercov_nevybrate": "Nášivku na koberce ste ešte nevybrali, preto si motív a farbu nite pre dvere vyberte tu.",
    "bez_kobercov": "Na kobercoch nášivku nemáte, preto si motív a farbu nite pre dvere vyberte tu.",
    "kam_pride": "do stredu výplne dverí.",
    "podklad": "tapacír – {x}."
   },
   "hotove": {
    "ponuka": "Tapacír dverí:",
    "ano": "áno · {x}",
    "nie": "nie, ďakujem",
    "mat": "Materiál, farba a lemovanie:",
    "mat_rovnake": "rovnaké ako koberce",
    "nas": "Nášivka na tapacír dverí:",
    "dvere": "Motív na tapacíre dverí:",
    "dvere_rovnaka": "rovnaká ako na kobercoch – {x}"
   },
   "zhrnutie_ano": "Áno · ako na kobercoch",
   "zhrnutie_ano_vlastne": "Áno · {nazov}, {variant} · {farba}",
   "zhrnutie_nie": "Bez tapacíru",
   "chyby": {
    "volba": "Prosím, vyberte si „Áno“ alebo „Nie“.",
    "rovnake": "Prosím, vyberte si, či má byť tapacír rovnaký ako koberce, alebo iný.",
    "material": "Prosím, vyberte si materiál tapacíru.",
    "farba": "Prosím, vyberte si farbu tapacíru.",
    "lemovanie": "Prosím, vyberte si lemovanie tapacíru.",
    "nasivka": "Prosím, vyberte si „Áno“ alebo „Nie“ pri nášivke na tapacír dverí.",
    "nasivka_volba": "Prosím, vyberte si nášivku na tapacír dverí.",
    "motiv": "Prosím, vyberte si motív nášivky na tapacír dverí.",
    "nit": "Prosím, vyberte si farbu nite na tapacír dverí.",
    "pokracovat": "Prosím, potvrďte výber tlačidlom „Pokračovať“."
   }
  },
  "tlacidla": {
   "dalej": "Pokračujte ďalej",
   "posledny_dalej": "Pokračujte k súhrnu",
   "pokracovat": "Pokračovať",
   "zmenit": "Zmeniť",
   "kosik": "Pridať do košíka",
   "dokoncite": "Dokončite výber"
  },
  "lista": {
   "spolu": "Spolu",
   "od": "od",
   "pokracovat": "Pokračovať",
   "do_kosika": "Do košíka"
  },
  "chyba_kosik": "Prosím, dokončite kroky označené červenou."
 },
 "suhrn": {
  "nadpis_kamion": "Koberce pre Váš kamión",
  "nadpis_dodavka": "Koberce pre Vašu dodávku",
  "riadky": {
   "koberce": {
    "nazov": "Koberce do kabíny",
    "popis": "šofér, spolujazdec, stred",
    "popis_bez_spolujazdca": "podľa šablóny Vášho modelu"
   },
   "material": {
    "nazov": "{material}, {variant} · {farba} ({kod})",
    "popis": "lemovanie {lemovanie}"
   },
   "nasivky": {
    "nazov_vsetky": "Nášivky na všetky tri koberce",
    "nazov_boky": "Nášivky pod sedadlá šoféra a spolujazdca",
    "nazov_stred": "Nášivka na stredový koberec",
    "popis": "{motiv} · niť {nit}",
    "popis_iny_stred": "stred: {motiv_stred} · niť {nit_stred}"
   },
   "tapacir": {
    "nazov": "Tapacír dverí",
    "popis_rovnaky": "rovnaký materiál, farba a lemovanie ako na kobercoch",
    "popis_vlastny": "{material} · {farba} ({kod}) · lemovanie {lemovanie}"
   },
   "nasivka_dvere": {
    "nazov": "Nášivka na tapacír dverí",
    "popis": "{motiv} · niť {nit}"
   }
  },
  "v_cene": "v cene",
  "samostatne": "samostatne",
  "spolu": "Spolu",
  "usetrili": "Ušetríte {x} oproti samostatnému nákupu",
  "fakty": [
   "Dodanie približne 20–30 dní",
   "Platba kartou alebo prevodom",
   "Odpovedáme spravidla do hodiny"
  ],
  "tlacidlo": "Pridať do košíka",
  "dopravcovia": {
   "text": "Máte vo firme viac kamiónov?",
   "text_dodavka": "Máte vo firme viac vozidiel?",
   "odkaz": "Napíšte nám"
  }
 },
 "ui": {
  "placeholder": {
   "vozidlo": "Značka, model a roky výroby",
   "material": "{n} prevedení materiálu",
   "farba": "{n} farieb na výber",
   "farba_bez": "Po výbere materiálu",
   "lemovanie": "13 kombinácií, všetky v cene",
   "nasivky": "Pod sedadlá šoféra a spolujazdca, na stredový koberec alebo všetky tri",
   "tapacir": "Výplne dverí zladené s kobercami"
  },
  "postup": "Váš set v {m} krokoch",
  "postup_hotovo": "Všetko vybrané",
  "postup_stav": "Hotovo {h} z {m}",
  "krok_ey": "Krok {n} z {m}",
  "krok_hotove": " – hotové",
  "model_bez_znacky": "Najprv vyberte značku",
  "farba_bez_materialu": "Najprv vyberte materiál v predchádzajúcom kroku.",
  "vybrate": "Vybraté: {x}",
  "lem_zblizka": "Lemovanie {x} zblízka",
  "tap_oddiel": "Materiál, farba a lemovanie tapacíru",
  "tap_s_nasivkou": " · s nášivkou",
  "nahlad_aria": "Náhľad motívu {x}",
  "nahlad": "Náhľad: {meno} ({kod})",
  "nahlad_nit": " · niť {nit} ({kod})",
  "nahlad_kam": "Kam príde:",
  "nahlad_podklad": "Podklad:",
  "nahlad_bez_nite": [
   "Farbu nite",
   " vyberte vyššie."
  ],
  "nahlad_ilustr": "Ilustračný náhľad.",
  "nahlad_bez_motivu": "Po výbere motívu sa tu ukáže veľký náhľad.",
  "schema_dvere_aria": "Schéma dverí: nášivka v strede výplne",
  "cenovka_samostatne": "Samostatne",
  "cenovka_usetrite": "Ušetríte {x}",
  "zmenit_aria": "Zmeniť – {x}",
  "suhrn_ey": "Súhrn objednávky",
  "suhrn_bez_vozidla": "Vozidlo zatiaľ nie je vybraté",
  "suhrn_bez_nasiviek": "Bez nášiviek",
  "suhrn_bez_tapaciru": "Bez tapacíru dverí",
  "suhrn_lemovanie": "lemovanie {x}",
  "suhrn_niet": "Zatiaľ nevybraté: {x}.",
  "suhrn_zatial": " zatiaľ",
  "suhrn_stred": "; stred: {x}",
  "nit": "niť {x}",
  "sedadlo": "sedadlo {x}",
  "brzda": "brzda {x}",
  "syntetika": "syntetická koža",
  "mikrosemis": "mikrosemiš",
  "koza": "koža",
  "vzorka": "Vzorka: {x}",
  "zvacsena": "Zväčšená vzorka: {x}",
  "motiv_alt": "Motív {x}",
  "farby_aria": "Farby",
  "lem_aria": "Lemovanie",
  "motiv_aria": "Motív",
  "nit_aria": "Farba nite",
  "nasivky_aria": "Nášivky",
  "kod_aria": "{meno}, kód {kod}",
  "hodnotenie_aria": "Hodnotenie {r} z 5 – {n} {tvar} na Google",
  "na_google": "na Google",
  "chyba_kosiku": "Konfiguráciu sa nepodarilo preniesť do košíka. Obnovte prosím stránku a skúste to znova."
 }
};
