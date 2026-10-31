// Ďakovná stránka Shoptetu (/objednavka/dekujeme/, SK aj /objednavka/dakujeme/) v návrhu „4 – Prémiový s platbou hore“
// (schválené náhľady 30. 10. 2026: scratchpad dakujeme/4-premiovy-platba = prevod, 4-stavy = kartou zaplatené /
// kartou neprebehla / dobierka). CZ texty presne z náhľadov, SK = ich preklad. Vykanie, krátko.
// Michal 30. 10. 2026: žiadny vlastný QR kód ani IBAN (len údaje, ktoré vypíše Shoptet), žiadna lehota dodania ani blok
// „Dodanie“, pri dobierke nikde záloha (aby sa ľudia nebáli), bez „vyrábame“, bez DPH, bez záruky.
// Texty označené 🟡 v náhľadoch neboli (stav bez odkazu na opakovanú platbu, kamión, vzorky, QR zo Shoptetu) — odvodené
// z náhľadov čo najbližšie, na schválenie Michalom.

export const TEXTY_DAKUJEME = {
  sk: {
    jazyk: "sk",
    cisloObjednavky: (c) => "Objednávka č. " + c,
    nadpis: "Ďakujeme za objednávku",
    hero: {
      prevod: "Zostáva zaplatiť prevodom – údaje nájdete nižšie.",
      zaplatene: "Platba kartou prebehla v poriadku.",
      zaplateneIna: "Platba prebehla v poriadku.",
      neprebehla: "Objednávku sme prijali, zostáva ju zaplatiť.",
      dobierka: "Zaplatíte až pri prevzatí zásielky.",
    },
    stitokPrevod: "Platba prevodom",
    stitokKarta: "Platba kartou",
    stitokDobierka: "Dobierka",
    navodPrevod: "Údaje skopírujte do aplikácie svojej banky.",
    qrNavod: "Alebo naskenujte QR kód v aplikácii banky.", // 🟡 len keď QR obrázok vykreslí sám Shoptet
    ucet: "Číslo účtu",
    vs: "Variabilný symbol",
    suma: "Suma",
    kopirovat: "Kopírovať",
    skopirovane: "Skopírované ✓",
    kopirovatAria: { ucet: "Kopírovať číslo účtu", vs: "Kopírovať variabilný symbol", suma: "Kopírovať sumu" },
    zaplateneTitul: "Zaplatené",
    zaplatenePotvrd: "Objednávka je zaplatená, nič ďalšie platiť nemusíte.",
    neprebehlaTitul: "Platba zatiaľ neprebehla",
    neprebehlaNavod: "Platbu sa nepodarilo dokončiť. Skúste to, prosím, znova.",
    zaplatitKartouZnova: "Zaplatiť kartou znova",
    zaplatitKartou: "Zaplatiť kartou", // 🟡 odkaz Shoptetu bez textu o neúspechu (napr. pred presmerovaním na bránu)
    zaplatitZnova: "Zaplatiť znova", // 🟡 Apple Pay / Google Pay / rýchla platba
    zaplatit: "Zaplatiť", // 🟡
    aleboPrevodom: "alebo zaplaťte prevodom",
    dobierkaTitul: "Platba pri prevzatí",
    dobierkaNavod: "Zaplatíte kuriérovi pri prevzatí zásielky.",
    vasaObjednavka: "Vaša objednávka",
    kusy: (n) => n + " ks",
    dopravaAPlatba: "Doprava a platba",
    zadarmo: "Zadarmo",
    spolu: "Celkom",
    coBudeDalej: "Čo bude ďalej",
    teraz: "Teraz",
    krokPrijata: "Objednávka prijatá",
    krokPrijataText: "Rekapituláciu vám pošleme aj e‑mailom.",
    krokPlatbaPrevodom: "Platba prevodom",
    krokPlatbaPrevodomText: "Podľa údajov vyššie.",
    krokPlatbaPrijata: "Platba prijatá",
    krokPlatbaPrijataText: (suma) => "Suma " + suma + " je uhradená.",
    krokPlatba: "Platba",
    krokPlatbaKartouAPrevodom: "Kartou znova alebo prevodom podľa údajov vyššie.",
    krokPlatbaKartou: "Kartou znova tlačidlom vyššie.", // 🟡 bez údajov na prevod
    krokPlatbaCaka: "Čaká na potvrdenie platby.", // 🟡 bez odkazu Shoptetu na opakovanú platbu
    krokKonzultacia: "Konzultácia",
    krokKonzultaciaText: "Ozveme sa vám kvôli detailom objednávky.",
    krokPriprava: "Príprava a doručenie",
    // druh: auto | kamion | vzorky; dopravca = názov dopravy zo Shoptetu (null = neznámy kuriér)
    krokPripravaText: (druh, dopravca) => {
      const doruci = dopravca ? "zásielku vám dovezie " + dopravca + "." : "zásielku vám doručíme.";
      if (druh === "vzorky") return "Vzorky pripravíme a " + doruci; // 🟡
      return "Objednávku pripravíme na mieru " + (druh === "kamion" ? "vášmu vozidlu" : "vášmu autu") + " a " + doruci;
    },
    krokPrevzatie: "Platba pri prevzatí",
    krokPrevzatieText: (suma) => "Sumu " + suma + " zaplatíte kuriérovi.",
    kontaktNadpis: "Máte otázku k objednávke?",
    kontaktText: (c) => "Zavolajte alebo napíšte, stačí uviesť číslo objednávky " + c + ".",
    telefonPopis: "Telefón",
    emailPopis: "E‑mail",
    telefon: "+421 903 660 720",
    telefonHref: "tel:+421903660720",
    email: "info@luxurycardesign.sk",
    spat: "Späť do obchodu",
  },
  cz: {
    jazyk: "cs",
    cisloObjednavky: (c) => "Objednávka č. " + c,
    nadpis: "Děkujeme za objednávku",
    hero: {
      prevod: "Zbývá zaplatit převodem – údaje najdete níže.",
      zaplatene: "Platba kartou proběhla v pořádku.",
      zaplateneIna: "Platba proběhla v pořádku.",
      neprebehla: "Objednávku jsme přijali, zbývá ji zaplatit.",
      dobierka: "Zaplatíte až při převzetí zásilky.",
    },
    stitokPrevod: "Platba převodem",
    stitokKarta: "Platba kartou",
    stitokDobierka: "Dobírka",
    navodPrevod: "Údaje zkopírujte do aplikace své banky.",
    qrNavod: "Nebo naskenujte QR kód v aplikaci banky.", // 🟡
    ucet: "Číslo účtu",
    vs: "Variabilní symbol",
    suma: "Částka",
    kopirovat: "Kopírovat",
    skopirovane: "Zkopírováno ✓",
    kopirovatAria: { ucet: "Kopírovat číslo účtu", vs: "Kopírovat variabilní symbol", suma: "Kopírovat částku" },
    zaplateneTitul: "Zaplaceno",
    zaplatenePotvrd: "Objednávka je zaplacená, nic dalšího platit nemusíte.",
    neprebehlaTitul: "Platba zatím neproběhla",
    neprebehlaNavod: "Platbu se nepodařilo dokončit. Zkuste to prosím znovu.",
    zaplatitKartouZnova: "Zaplatit kartou znovu",
    zaplatitKartou: "Zaplatit kartou", // 🟡
    zaplatitZnova: "Zaplatit znovu", // 🟡
    zaplatit: "Zaplatit", // 🟡
    aleboPrevodom: "nebo zaplaťte převodem",
    dobierkaTitul: "Platba při převzetí",
    dobierkaNavod: "Zaplatíte kurýrovi při převzetí zásilky.",
    vasaObjednavka: "Vaše objednávka",
    kusy: (n) => n + " ks",
    dopravaAPlatba: "Doprava a platba",
    zadarmo: "Zdarma",
    spolu: "Celkem",
    coBudeDalej: "Co bude dál",
    teraz: "Nyní",
    krokPrijata: "Objednávka přijata",
    krokPrijataText: "Rekapitulaci vám pošleme i e‑mailem.",
    krokPlatbaPrevodom: "Platba převodem",
    krokPlatbaPrevodomText: "Podle údajů výše.",
    krokPlatbaPrijata: "Platba přijata",
    krokPlatbaPrijataText: (suma) => "Částka " + suma + " je uhrazena.",
    krokPlatba: "Platba",
    krokPlatbaKartouAPrevodom: "Kartou znovu, nebo převodem podle údajů výše.",
    krokPlatbaKartou: "Kartou znovu tlačítkem výše.", // 🟡
    krokPlatbaCaka: "Čeká na potvrzení platby.", // 🟡
    krokKonzultacia: "Konzultace",
    krokKonzultaciaText: "Ozveme se vám kvůli detailům objednávky.",
    krokPriprava: "Příprava a doručení",
    krokPripravaText: (druh, dopravca) => {
      const doruci = dopravca ? "zásilku vám doveze " + dopravca + "." : "zásilku vám doručíme.";
      if (druh === "vzorky") return "Vzorky připravíme a " + doruci; // 🟡
      return "Objednávku připravíme na míru " + (druh === "kamion" ? "vašemu vozidlu" : "vašemu autu") + " a " + doruci;
    },
    krokPrevzatie: "Platba při převzetí",
    krokPrevzatieText: (suma) => "Částku " + suma + " zaplatíte kurýrovi.",
    kontaktNadpis: "Máte dotaz k objednávce?",
    kontaktText: (c) => "Zavolejte nebo napište, stačí uvést číslo objednávky " + c + ".",
    telefonPopis: "Telefon",
    emailPopis: "E‑mail",
    telefon: "+421 903 660 720",
    telefonHref: "tel:+421903660720",
    email: "info@luxurycardesign.cz",
    spat: "Zpět do obchodu",
  },
};
