// One page checkout: texty pre zákazníka SK + CZ (kniha OPC § 6.2–6.9, § 6.11). Vykanie s veľkým V, krátko.
// Nikde „s DPH / bez DPH“ (LCD nie je platca DPH). Text tlačidla „Objednať s povinnosťou platby“ a súhlas dáva Shoptet,
// tu nie sú a nemenia sa (SK § 17 ods. 4 zák. 108/2024, CZ § 1826a OZ); lišta dole preberá text z tlačidla (objednat je
// len záloha, keď tlačidlo chýba). Právne vety sú z našich obchodných podmienok (Michal 29. 10. 2026: „použi, čo už máme
// vo VOP“), s odkazom na bod VOP: záloha pri dobierke = bod 4.13, tovar na mieru = bod 6.13, spôsoby platby = bod 4.5
// (živé VOP luxurycardesign.sk/.cz stiahnuté 29. 10. 2026, kniha § 8 otázka 3).

/** Tvar slova „položka“ podľa počtu: 1 položka, 2–4 položky, 5+ položiek / položek. */
function polozky(n, piat) {
  if (n === 1) return "1 položka";
  if (n >= 2 && n <= 4) return n + " položky";
  return n + " " + piat;
}

export const TEXTY = {
  sk: {
    doprava: "Doprava",
    platba: "Platba",
    nacitavam: "Načítavam dopravu a platbu…",
    // termín bez dátumov (Michal 29. 10.): 21–29 dní, kamióny 14–25; nezalomiteľná medzera pred „dní“
    termin: (od, po) => "Doručenie do " + od + "–" + po + "\u00a0dní",
    prepocitavam: "Prepočítavam…",
    // hláška pri platbách: ktorá platba ostala zvolená (zákazník ju na telefóne nevidí, zoznam je vyššie) + odkaz na krok 1
    chybaPlatby: (nazov) => "Platbu sa nepodarilo zmeniť, zvolená ostáva: " + nazov + ". Skúste to znova alebo ",
    chybaPlatbyOdkaz: "vyberte platbu na samostatnej stránke",
    chybaOverenia: "Platbu sa nepodarilo overiť. Zvoľte ju, prosím, znova alebo ",
    cakamPlatbu: "Čakám na potvrdenie platby…",
    cakamKosik: "Čakám na dokončenie úpravy košíka…",
    // kontrola pred odoslaním zlyhala: hláška pri tlačidle + odkaz na klasický krok 1 (cesta ďalej, revízia 29. 10.)
    neodoslane: "Objednávku sa zatiaľ nepodarilo odoslať. Skúste to, prosím, znova alebo ",
    neodoslaneOdkaz: "vyberte dopravu a platbu na samostatnej stránke",
    // odmietnutie servera / stratená session / 2. zlyhanie za sebou: sekcia preč (záchrana), ďalší klik ide natívne
    neodoslaneZachrana: "Objednávka neodišla, dopravu a platbu sa nepodarilo overiť. Skontrolujte, prosím, súhrn a kliknite znova alebo ",
    // pri tlačidle, keď sa odložené odoslanie zrušilo (zmena platby zlyhala / zákazník medzitým zvolil inú / nezhoda)
    skontrolujte: "Objednávka neodišla. Skontrolujte, prosím, platbu a súhrn a kliknite znova.",
    overujem: "Overujem platbu…",
    odosiela: "Objednávka sa odosiela…",
    // v tlačidle „Objednať“, kým beží kontrola pred odoslaním a odoslanie (pôvodný text tlačidla sa potom vráti)
    odosielam: "Odosielam…",
    // pred odoslaním má server iný košík alebo platbu (iné okno / karta): objednávka neodišla, súhrn je zo servera
    zmenaInde: "Košík alebo platba sa zmenili v inom okne. Skontrolujte, prosím, súhrn a kliknite znova.",
    nacitavamKosik: "Načítavam…",
    zmenitVolby: "Zmeniť dopravu alebo platbu",
    vybratBanku: "Vybrať banku",
    bankaPopis: "Banku si vyberiete na samostatnej stránke.",
    bankaZvolena: "Banku máte vybranú.",
    zmenitBanku: "Zmeniť banku",
    vybratMiesto: "Vybrať miesto",
    // obchodné podmienky (odkazy pri právnych vetách sa otvárajú v novej karte, rozpísaná objednávka ostane)
    vop: "/obchodne-podmienky/",
    // poučenie o zálohe pri dobierke (SK § 15 ods. 1 písm. k): VOP 4.13 „Objednávka, pri ktorej si Kupujúci zvolí spôsob
    // platby na dobierku, je podmienená úhradou zálohovej faktúry vo výške 50 % z celkovej ceny objednávky.“ + 4.15 (zvyšok
    // splatný pri prevzatí); veta s odkazom: vzhlad.js vetaSOdkazom
    zalohaInfo: "Pri dobierke najprv uhradíte zálohovú faktúru na 50\u00a0% z ceny objednávky, zvyšok zaplatíte pri prevzatí",
    zalohaOdkaz: "podľa obchodných podmienok, bod 4.13",
    // tovar na mieru (SK § 19 ods. 1 písm. c): VOP 6.13 „…Kupujúci nemôže odstúpiť od zmluvy v prípade tovaru zhotoveného
    // podľa špeciálnych požiadaviek…, pokiaľ výroba tohto tovaru bola začatá, tovar už bol vyrobený, alebo dodaný.“
    // (VOP 1.7: autokoberce zhotovované na mieru); rozsah riadku vzhlad.js naMieru
    naMieru: "Koberce sa pripravujú na mieru Vášho auta, po začatí výroby od zmluvy nemožno odstúpiť",
    naMieruOdkaz: "podľa obchodných podmienok, bod 6.13",
    // záchrana (sekcia platieb sa nenačítala): spôsoby platby z VOP 4.5 (SK § 17 ods. 2), pod odkazom „Zmeniť dopravu…“
    platbyZachrana: "Spôsoby platby: Apple Pay, Google Pay, platba kartou online, bankový prevod, dobierka (záloha 50\u00a0%), rýchla platba cez banku",
    platbyZachranaOdkaz: "podľa obchodných podmienok, bod 4.5",
    vasaObjednavka: "Vaša objednávka",
    polozky: (n) => polozky(n, "položiek"),
    celkom: "Celkom",
    // lišta dole: text z tlačidla Shoptetu (vzhlad.js textTlacidla), toto je len záloha
    objednat: "Objednať s povinnosťou platby",
    listaAria: "Celková suma a objednanie",
    // kontrola polí pred odoslaním (opc/kontrola.js, Michal 29. 10.): text pod prvým zlým poľom, keď Shoptet pre pole
    // nemá vlastný (shoptet.messages.validator.<pole>Required)
    poleChyba: "Toto pole treba vyplniť.",
    poleSkontrolujte: "Skontrolujte, prosím, toto pole.",
    vyberteDopravu: "Vyberte dopravu.",
    vybertePlatbu: "Vyberte platbu.",
    upravitKosik: "Upraviť košík",
    kroky: ["Nákupný košík", "Objednávka"],
    // zobáčik pri položke súhrnu (Michal 29. 10. 2026, náhľad 2): zlatá pilulka; pod názvom rekapitulácia z košíka (náhľad 5)
    zobrazitDetail: "Zobraziť detail",
    skrytDetail: "Skryť detail",
    // odkaz pod „Objednať“ vedie pri OPC do košíka (natívne „Späť“ na krok Doprava a platba)
    spatKosik: "Späť do košíka",
    // pri štáte v adrese namiesto „Môžete zmeniť v predchádzajúcom kroku“ (krok s krajinou zákazník pri OPC nevidel)
    zmenitStat: "Zmeniť štát",
    // dizajn A (Michal 29. 10.): nadpisy kariet 1 a 2 (3 a 4 = doprava, platba) a krátky odkaz na prihlásenie v hlavičke karty
    kontakt: "Kontakt",
    adresa: "Adresa",
    prihlasit: "Prihlásiť sa",
  },
  cz: {
    doprava: "Doprava",
    platba: "Platba",
    nacitavam: "Načítám dopravu a platbu…",
    termin: (od, po) => "Doručení do " + od + "–" + po + "\u00a0dnů",
    prepocitavam: "Přepočítávám…",
    chybaPlatby: (nazov) => "Platbu se nepodařilo změnit, zvolená zůstává: " + nazov + ". Zkuste to znovu nebo ",
    chybaPlatbyOdkaz: "vyberte platbu na samostatné stránce",
    chybaOverenia: "Platbu se nepodařilo ověřit. Zvolte ji, prosím, znovu nebo ",
    cakamPlatbu: "Čekám na potvrzení platby…",
    cakamKosik: "Čekám na dokončení úpravy košíku…",
    neodoslane: "Objednávku se zatím nepodařilo odeslat. Zkuste to, prosím, znovu nebo ",
    neodoslaneOdkaz: "vyberte dopravu a platbu na samostatné stránce",
    neodoslaneZachrana: "Objednávka neodešla, dopravu a platbu se nepodařilo ověřit. Zkontrolujte, prosím, souhrn a klikněte znovu nebo ",
    skontrolujte: "Objednávka neodešla. Zkontrolujte, prosím, platbu a souhrn a klikněte znovu.",
    overujem: "Ověřuji platbu…",
    odosiela: "Objednávka se odesílá…",
    odosielam: "Odesílám…",
    zmenaInde: "Košík nebo platba se změnily v jiném okně. Zkontrolujte, prosím, souhrn a klikněte znovu.",
    nacitavamKosik: "Načítám…",
    zmenitVolby: "Změnit dopravu nebo platbu",
    vybratBanku: "Vybrat banku",
    bankaPopis: "Banku si vyberete na samostatné stránce.",
    bankaZvolena: "Banku máte vybranou.",
    zmenitBanku: "Změnit banku",
    vybratMiesto: "Vybrat místo",
    vop: "/obchodni-podminky/",
    // CZ § 1820 odst. 1 písm. q OZ: VOP CZ 4.13 (záloha 50 %) a 4.15
    zalohaInfo: "U dobírky nejprve uhradíte zálohovou fakturu na 50\u00a0% z ceny objednávky, zbytek zaplatíte při převzetí",
    zalohaOdkaz: "podle obchodních podmínek, bod 4.13",
    // CZ § 1837 písm. d OZ: VOP CZ 6.13 (zboží vyrobené podle speciálních požadavků, po zahájení výroby)
    naMieru: "Koberce se připravují na míru Vašeho auta, po zahájení výroby nelze od smlouvy odstoupit",
    naMieruOdkaz: "podle obchodních podmínek, bod 6.13",
    // VOP CZ 4.5 a)–f) vymenúva aj rychlou platbu přes banku, hoci ju CZ pokladňa nemá (kniha § 8, otvorený bod)
    platbyZachrana: "Způsoby platby: Apple Pay, Google Pay, platba kartou online, bankovní převod, dobírka (záloha 50\u00a0%), rychlá platba přes banku",
    platbyZachranaOdkaz: "podle obchodních podmínek, bod 4.5",
    vasaObjednavka: "Vaše objednávka",
    polozky: (n) => polozky(n, "položek"),
    celkom: "Celkem",
    objednat: "Objednat s povinností platby",
    listaAria: "Celková částka a objednání",
    poleChyba: "Toto pole je potřeba vyplnit.",
    poleSkontrolujte: "Zkontrolujte, prosím, toto pole.",
    vyberteDopravu: "Vyberte dopravu.",
    vybertePlatbu: "Vyberte platbu.",
    upravitKosik: "Upravit košík",
    kroky: ["Nákupní košík", "Objednávka"],
    zobrazitDetail: "Zobrazit detail",
    skrytDetail: "Skrýt detail",
    spatKosik: "Zpět do košíku",
    zmenitStat: "Změnit zemi",
    kontakt: "Kontakt",
    adresa: "Adresa",
    prihlasit: "Přihlásit se",
  },
};
