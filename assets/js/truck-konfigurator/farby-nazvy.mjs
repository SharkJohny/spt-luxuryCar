// Názvy farieb materiálov kamiónov (640) – schválil Michal 25. 10. 2026 („Áno, tak je to správne“), prehľad so vzorkami:
// Desktop\kamiony\NÁZVY FARIEB – návrh\navrh-nazvov-farieb.png. Kódy = platný vzorkovník KRAM-TRUCK (10/2026), názvy podľa
// vzoriek; pri prešívanej koži farba kože aj farba šitia. Kód je v rámci všetkých materiálov jedinečný (G, PES, NUB, N, D,
// samotné číslo = prešívaná), takže názov sa hľadá len podľa kódu – rovnako pre SK aj CZ texty materiálu.
// Používa: order-summary.mjs (rozpis v košíku / pokladni / poznámka objednávky), nový konfigurátor (kamion/ui.js)
// aj starý React (konfigurator.jsx, konfigurator.phone.jsx). en = pre výrobu (dodávateľ).
export const NAZVY_FARIEB = {
  // Prémiová syntetická koža – jednofarebná (dodávateľ: Skóra syntetyczna gładka)
  "1G": { sk: "svetlobéžová", cs: "světle béžová", en: "light beige" },
  "2G": { sk: "karamelová", cs: "karamelová", en: "caramel" },
  "3G": { sk: "hnedá", cs: "hnědá", en: "brown" },
  "4G": { sk: "tmavohnedá", cs: "tmavě hnědá", en: "dark brown" },
  "5G": { sk: "svetlosivá", cs: "světle šedá", en: "light grey" },
  "6G": { sk: "tmavosivá", cs: "tmavě šedá", en: "dark grey" },
  "7G": { sk: "modrá", cs: "modrá", en: "blue" },
  "8G": { sk: "červená", cs: "červená", en: "red" },
  "9G": { sk: "tmavomodrá", cs: "tmavě modrá", en: "navy blue" },
  "10G": { sk: "čierna", cs: "černá", en: "black" },
  "11G": { sk: "bordová", cs: "vínová", en: "burgundy" },
  "12G": { sk: "tmavozelená", cs: "tmavě zelená", en: "dark green" },
  "13G": { sk: "koňaková", cs: "koňaková", en: "cognac" },
  // Prémiová syntetická koža – prešívaná (Skóra syntetyczna pikowana): farba kože, farba šitia
  "1": { sk: "béžová, béžové šitie", cs: "béžová, béžové prošití", en: "beige, beige stitching" },
  "2": { sk: "modrá, modré šitie", cs: "modrá, modré prošití", en: "blue, blue stitching" },
  "3": { sk: "hnedá, hnedé šitie", cs: "hnědá, hnědé prošití", en: "brown, brown stitching" },
  "4": { sk: "sivá, sivé šitie", cs: "šedá, šedé prošití", en: "grey, grey stitching" },
  "5": { sk: "čierna, červené šitie", cs: "černá, červené prošití", en: "black, red stitching" },
  "6": { sk: "červená, červené šitie", cs: "červená, červené prošití", en: "red, red stitching" },
  "7": { sk: "karamelová, karamelové šitie", cs: "karamelová, karamelové prošití", en: "caramel, caramel stitching" },
  "8": { sk: "tmavomodrá, tmavomodré šitie", cs: "tmavě modrá, tmavě modré prošití", en: "navy blue, navy blue stitching" },
  "9": { sk: "tmavohnedá, hnedé šitie", cs: "tmavě hnědá, hnědé prošití", en: "dark brown, brown stitching" },
  "10": { sk: "tmavosivá, tmavosivé šitie", cs: "tmavě šedá, tmavě šedé prošití", en: "dark grey, dark grey stitching" },
  "11": { sk: "čierna, čierne šitie", cs: "černá, černé prošití", en: "black, black stitching" },
  "12": { sk: "bordová, bordové šitie", cs: "vínová, vínové prošití", en: "burgundy, burgundy stitching" },
  "13": { sk: "tmavozelená, zelené šitie", cs: "tmavě zelená, zelené prošití", en: "dark green, green stitching" },
  "14": { sk: "koňaková, koňakové šitie", cs: "koňaková, koňakové prošití", en: "cognac, cognac stitching" },
  // Prémiová syntetická koža – tónovaná (Skóra syntetyczna gładka – Premium PES)
  "2PES": { sk: "svetlosivobéžová", cs: "světle šedobéžová", en: "light grey-beige" },
  "5PES": { sk: "koňaková", cs: "koňaková", en: "cognac" },
  "7PES": { sk: "tmavosivá", cs: "tmavě šedá", en: "dark grey" },
  "9PES": { sk: "hnedá", cs: "hnědá", en: "brown" },
  "11PES": { sk: "tmavohnedá", cs: "tmavě hnědá", en: "dark brown" },
  // Mikrosemiš – jednofarebný (Nubuck)
  "1NUB": { sk: "krémový", cs: "krémový", en: "cream" },
  "2NUB": { sk: "koňakový", cs: "koňakový", en: "cognac" },
  "3NUB": { sk: "tmavosivý", cs: "tmavě šedý", en: "dark grey" },
  "4NUB": { sk: "svetlosivý", cs: "světle šedý", en: "light grey" },
  "5NUB": { sk: "červený", cs: "červený", en: "red" },
  // Mikrosemiš – dvojfarebný (Welur Premium Navy)
  "1N": { sk: "tmavosivý", cs: "tmavě šedý", en: "dark grey" },
  "2N": { sk: "sivý", cs: "šedý", en: "grey" },
  "3N": { sk: "bordový", cs: "vínový", en: "burgundy" },
  "4N": { sk: "béžový", cs: "béžový", en: "beige" },
  "5N": { sk: "tmavohnedý", cs: "tmavě hnědý", en: "dark brown" },
  "6N": { sk: "tmavomodrý", cs: "tmavě modrý", en: "navy blue" },
  // Vzorovaný velúr (Duński welur)
  "1D": { sk: "červený", cs: "červený", en: "red" },
  "2D": { sk: "modrý", cs: "modrý", en: "blue" },
  "3D": { sk: "sivý", cs: "šedý", en: "grey" },
  "4D": { sk: "žltý", cs: "žlutý", en: "yellow" },
  "5D": { sk: "hnedý", cs: "hnědý", en: "brown" },
};

/** Názov farby podľa kódu (jazyk sk | cs | en), "" keď kód nepoznáme. */
export function nazovFarby(kod, jazyk = "sk") {
  const z = NAZVY_FARIEB[String(kod == null ? "" : kod).trim()];
  return z ? z[jazyk] || z.sk : "";
}

/** Text do košíka a objednávky: „<materiál> – <kód> – <názov>“ (Michal 25. 10. 2026: kód najprv); bez známeho názvu „<materiál> – <kód>“. */
export function materialFarbaText(material, kod, jazyk = "sk") {
  const nazov = nazovFarby(kod, jazyk);
  return [material, kod, nazov].filter(Boolean).join(" – ");
}

// Lemovania (pásik okolo koberca): prvá farba = základ pásky, druhá = šikmé pásiky na nej (vzorky lemovaní).
// Michal 25. 10. 2026 schválil „Základ + pásiky“, kód vždy na začiatku („05 – čierny základ, bordové pásiky“).
export const NAZVY_LEMOVANI = {
  "01": { sk: "čierny základ, béžové pásiky", cs: "černý základ, béžové proužky", en: "black base, beige stripes" },
  "02": { sk: "čierny základ, sivé pásiky", cs: "černý základ, šedé proužky", en: "black base, grey stripes" },
  "03": { sk: "čierny základ, grafitové pásiky", cs: "černý základ, grafitové proužky", en: "black base, graphite stripes" },
  "04": { sk: "čierny základ, červené pásiky", cs: "černý základ, červené proužky", en: "black base, red stripes" },
  "05": { sk: "čierny základ, bordové pásiky", cs: "černý základ, vínové proužky", en: "black base, burgundy stripes" },
  "06": { sk: "čierny základ, modré pásiky", cs: "černý základ, modré proužky", en: "black base, blue stripes" },
  "07": { sk: "čierny základ, zelené pásiky", cs: "černý základ, zelené proužky", en: "black base, green stripes" },
  "08": { sk: "čierny základ, hnedé pásiky", cs: "černý základ, hnědé proužky", en: "black base, brown stripes" },
  "09": { sk: "čierny základ, čierne pásiky", cs: "černý základ, černé proužky", en: "black base, black stripes" },
  "10": { sk: "béžový základ, modré pásiky", cs: "béžový základ, modré proužky", en: "beige base, blue stripes" },
  "11": { sk: "béžový základ, hnedé pásiky", cs: "béžový základ, hnědé proužky", en: "beige base, brown stripes" },
  "12": { sk: "béžový základ, červené pásiky", cs: "béžový základ, červené proužky", en: "beige base, red stripes" },
  "13": { sk: "hnedý základ, béžové pásiky", cs: "hnědý základ, béžové proužky", en: "brown base, beige stripes" },
};

/** Názov lemovania podľa kódu (sk | cs | en), "" keď kód nepoznáme. */
export function nazovLemovania(kod, jazyk = "sk") {
  const z = NAZVY_LEMOVANI[String(kod == null ? "" : kod).trim()];
  return z ? z[jazyk] || z.sk : "";
}

/** Lemovanie do košíka, poznámky aj príplatku: „<kód> – <názov>“; neznámy kód = "". */
export function lemovanieText(kod, jazyk = "sk") {
  const nazov = nazovLemovania(kod, jazyk);
  return nazov ? `${String(kod).trim()} – ${nazov}` : "";
}

/** Hodnota príplatku „Farba materiálu“ v admine Shoptetu (SK 640 od 25. 10. 2026): „<kód> – <názov>“ („3 – hnedá, hnedé šitie“). */
export function hodnotaPriplatkuFarby(kod, jazyk = "sk") {
  const nazov = nazovFarby(kod, jazyk);
  return nazov ? `${kod} – ${nazov}` : "";
}

/**
 * Stav v tvare Reactu (finalConfiguration) doplnený o texty hodnôt príplatkov farby a lemovania koberčekov aj tapacíru.
 * Michal 25. 10. 2026: farba patrí priamo do položky objednávky, nie len do poznámky – v admine sú hodnoty
 * „<kód> – <názov>“ (farba) a „<kód> – <meno>“ (lemovanie). resolveValue ich použije; keď hodnotu admin nemá,
 * syncToShoptet vyberie „Vyberie sa v konfigurátore“ ako doteraz.
 */
export function sTextamiPriplatkov(stav, jazyk = "sk") {
  const s = stav || {};
  const lem = (l) => (l && l.code ? lemovanieText(l.code, jazyk) || [l.code, l.name].filter(Boolean).join(" – ") : "");
  return Object.assign({}, s, {
    farbaPriplatok: s.selectedColor ? hodnotaPriplatkuFarby(s.selectedColor.code, jazyk) : "",
    lemovaniePriplatok: lem(s.selectedLemovanie),
    doorFarbaPriplatok: s.doorColor ? hodnotaPriplatkuFarby(s.doorColor.code, jazyk) : "",
    doorLemovaniePriplatok: lem(s.doorLemovanie),
  });
}

/** Názov na dlaždicu / do náhľadu konfigurátora: s veľkým písmenom („Čierna, červené šitie“). */
export function nazovFarbyVelky(kod, jazyk = "sk") {
  const n = nazovFarby(kod, jazyk);
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
}
