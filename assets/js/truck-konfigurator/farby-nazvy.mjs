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

/** Text do košíka a objednávky: „<materiál> – <názov> – <kód>“; bez známeho názvu ako predtým „<materiál> – <kód>“. */
export function materialFarbaText(material, kod, jazyk = "sk") {
  const nazov = nazovFarby(kod, jazyk);
  return [material, nazov, kod].filter(Boolean).join(" – ");
}

/** Názov na dlaždicu / do náhľadu konfigurátora: s veľkým písmenom („Čierna, červené šitie“). */
export function nazovFarbyVelky(kod, jazyk = "sk") {
  const n = nazovFarby(kod, jazyk);
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
}
