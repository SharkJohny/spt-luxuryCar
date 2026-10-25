import { nazovFarby, materialFarbaText, lemovanieText } from "./farby-nazvy.mjs";

const SUMMARY_TEXTS = {
  sk: {
    headings: {
      vehicle: "ŠPECIFIKÁCIA VOZIDLA",
      carpets: "KOBERČEKY POD SEDAČKY",
      doors: "TAPACÍR DVERÍ",
    },
    labels: {
      vehicle: "Vozidlo",
      materialColor: "Typ a farba materiálu",
      edgingColor: "Farba lemovania",
      embroideryPlacement: "Rozloženie nášiviek",
      centrePatchType: "Typ nášivky na stred",
      centrePatchColor: "Farba nášivky na stred",
      sidePatchType: "Typ nášiviek na boky",
      sidePatchColor: "Farba nášiviek na boky",
      doorPatches: "Nášivky na tapacír",
      doorPatchType: "Typ nášivky na tapacír",
      doorPatchColor: "Farba nášiviek na tapacíre",
    },
    extras: {
      prevodovka: "Typ prevodovky",
      sedadlo: "Typ sedadla spolujazdca",
      zasuvky: "Počet zásuviek",
      brzda: "Typ parkovacej brzdy",
      podlaha: "Typ podlahy",
    },
    placements: {
      nechcem: "Bez nášiviek",
      stred: "Len stred",
      boky: "Šofér + spolujazdec",
      "boky+stred": "Šofér + spolujazdec + stred",
    },
    noPatch: "Bez nášivky",
    yes: "Chcem",
    no: "Nechcem",
    sameMaterial: "Rovnaký ako koberčeky",
    sameEdging: "Rovnaká ako farba lemovania koberčekov",
    samePatch: "Rovnaká ako na koberčekoch",
    samePatchSides: "Rovnaká ako pod sedadlami",
    markerStart: "[KONFIGURÁCIA KAMIÓNA]",
    markerEnd: "[/KONFIGURÁCIA KAMIÓNA]",
  },
  cs: {
    headings: {
      vehicle: "SPECIFIKACE VOZIDLA",
      carpets: "KOBEREČKY POD SEDAČKY",
      doors: "TAPACÍR DVEŘÍ",
    },
    labels: {
      vehicle: "Vozidlo",
      materialColor: "Typ a barva materiálu",
      edgingColor: "Barva lemování",
      embroideryPlacement: "Rozložení nášivek",
      centrePatchType: "Typ nášivky na střed",
      centrePatchColor: "Barva nášivky na střed",
      sidePatchType: "Typ nášivek na boky",
      sidePatchColor: "Barva nášivek na boky",
      doorPatches: "Nášivky na tapacír",
      doorPatchType: "Typ nášivky na tapacír",
      doorPatchColor: "Barva nášivek na tapacíru",
    },
    extras: {
      prevodovka: "Typ převodovky",
      sedadlo: "Typ sedadla spolujezdce",
      zasuvky: "Počet zásuvek",
      brzda: "Typ parkovací brzdy",
      podlaha: "Typ podlahy",
    },
    placements: {
      nechcem: "Bez nášivek",
      stred: "Pouze střed",
      boky: "Řidič + spolujezdec",
      "boky+stred": "Řidič + spolujezdec + střed",
    },
    noPatch: "Bez nášivky",
    yes: "Chci",
    no: "Nechci",
    sameMaterial: "Stejný jako koberečky",
    sameEdging: "Stejná jako barva lemování koberečků",
    samePatch: "Stejná jako na koberečcích",
    samePatchSides: "Stejná jako pod sedačkami",
    markerStart: "[KONFIGURACE KAMIONU]",
    markerEnd: "[/KONFIGURACE KAMIONU]",
  },
};

const THREAD_COLOR_NAMES = {
  sk: {
    "2999": "Čierna",
    "2901": "Strieborná",
    "3738": "Svetlo sivá",
    "3546": "Béžová",
    "3617": "Svetlohnedá",
    "3504": "Tmavohnedá",
    "3501": "Horčicová",
    "2824": "Červená",
    "2866": "Fialová",
    "3842": "Modrá",
    "2840": "Zelená",
  },
  cs: {
    "2999": "Černá",
    "2901": "Stříbrná",
    "3738": "Světle šedá",
    "3546": "Béžová",
    "3617": "Světle hnědá",
    "3504": "Tmavě hnědá",
    "3501": "Hořčicová",
    "2824": "Červená",
    "2866": "Fialová",
    "3842": "Modrá",
    "2840": "Zelená",
  },
};

export function detectTruckSummaryLanguage() {
  if (typeof window === "undefined") return "sk";
  try {
    const hostname = String(window.location && window.location.hostname || "").toLowerCase();
    if (hostname === "luxurycardesign.cz" || hostname.endsWith(".luxurycardesign.cz")) return "cs";
    if (hostname === "luxurycardesign.sk" || hostname.endsWith(".luxurycardesign.sk")) return "sk";

    const dlEntry = Array.isArray(window.dataLayer)
      ? window.dataLayer.find((entry) => entry && entry.shoptet)
      : null;
    if (dlEntry && (dlEntry.shoptet.language === "cs" || String(dlEntry.shoptet.projectId) === "704436")) {
      return "cs";
    }
  } catch (e) { /* use Slovak fallback */ }
  return "sk";
}

function selectedText(value, preferName = false) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (preferName && value.name) return value.name;
  return value.code || value.name || "";
}

function selectedThreadColor(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  const code = String(value.code || "").trim();
  const localizedNames = THREAD_COLOR_NAMES[language] || THREAD_COLOR_NAMES.sk;
  const name = String(localizedNames[code] || value.name || "").trim();
  if (!code) return name;
  const nameAlreadyHasCode = name === code || [" ", "-", "–", "—", ":"]
    .some((separator) => name.startsWith(code + separator));
  if (!name || nameAlreadyHasCode) return name || code;
  return `${code} – ${name}`;
}

function enrichThreadColorText(value, language) {
  const text = String(value || "").trim();
  if (!text) return text;
  const localizedNames = THREAD_COLOR_NAMES[language] || THREAD_COLOR_NAMES.sk;

  for (const code of Object.keys(localizedNames)) {
    const knownNames = [...new Set([
      THREAD_COLOR_NAMES.sk[code],
      THREAD_COLOR_NAMES.cs[code],
    ].filter(Boolean))];
    for (const knownName of knownNames) {
      if (text === knownName) return `${code} – ${localizedNames[code]}`;
      const suffix = ` – ${knownName}`;
      if (text.endsWith(suffix)) {
        return `${text.slice(0, -knownName.length)}${code} – ${localizedNames[code]}`;
      }
    }
  }
  return text;
}

function addLine(lines, label, value) {
  if (value === null || value === undefined || value === "") return;
  lines.push(`- ${label}: ${value}`);
}

// Michal 25. 10. 2026: v košíku aj v objednávke aj názov farby („Prémiová syntetická koža – prešívaná – čierna,
// červené šitie – 5“); kód ostáva na konci – podľa neho vyrába dodávateľ. Neznámy kód = ako predtým.
function materialAndColor(material, color, language) {
  const kod = color && typeof color === "object" ? String(color.code || "").trim() : "";
  if (kod && nazovFarby(kod, language)) return materialFarbaText(material, kod, language);
  return [material, selectedText(color, true)].filter(Boolean).join(" – ");
}

// Michal 25. 10. 2026: lemovanie „základ + pásiky“ s číslom na konci („čierny základ, bordové pásiky – 05“);
// neznámy kód = ako predtým len meno.
function edgingText(lem, language) {
  const kod = lem && typeof lem === "object" ? String(lem.code || "").trim() : "";
  return (kod && lemovanieText(kod, language)) || selectedText(lem, true);
}

function hasSideEmbroidery(placement) {
  return placement === "boky" || placement === "boky+stred";
}

function hasCentreEmbroidery(placement) {
  return placement === "stred" || placement === "boky+stred";
}

function addGroup(lines, heading, entries) {
  const group = [];
  entries(group);
  if (!group.length) return;
  if (lines.length) lines.push("");
  lines.push(heading, ...group);
}

/**
 * Text urceny priamo do poznamky objednavky v Shoptete. Neobsahuje ceny — tie
 * Shoptet eviduje cez priplatkove parametre — iba vyrobne specifikacie, ktore
 * sa z dynamickeho konfiguratora inak do administracie nedostanu.
 */
export function buildTruckOrderSummary(state, language = detectTruckSummaryLanguage()) {
  const s = state || {};
  const texts = SUMMARY_TEXTS[language] || SUMMARY_TEXTS.sk;
  const lines = [];
  const carpetMaterial = materialAndColor(s.selectedMaterial, s.selectedColor, language);
  const carpetEdging = edgingText(s.selectedLemovanie, language);
  const threadColor = (value) => selectedThreadColor(value, language);
  const sideEmbroidery = hasSideEmbroidery(s.nasivkyPlacement);
  const centreEmbroidery = hasCentreEmbroidery(s.nasivkyPlacement);

  addGroup(lines, texts.headings.vehicle, (group) => {
    addLine(group, texts.labels.vehicle, [s.znacka, s.model].filter(Boolean).join(" "));
    Object.keys(texts.extras).forEach((key) => {
      addLine(group, texts.extras[key], s.extras && s.extras[key]);
    });
  });

  addGroup(lines, texts.headings.carpets, (group) => {
    addLine(group, texts.labels.materialColor, carpetMaterial);
    addLine(group, texts.labels.edgingColor, carpetEdging);
    addLine(group, texts.labels.embroideryPlacement, texts.placements[s.nasivkyPlacement]);
    // poradie ako v konfigurátore aj v príplatkoch Shoptetu (Michal 25. 10. 2026): najprv boky (šofér + spolujazdec), potom stred
    addLine(group, texts.labels.sidePatchType, sideEmbroidery ? selectedText(s.selectedNasivka) : texts.noPatch);
    addLine(group, texts.labels.sidePatchColor, sideEmbroidery ? threadColor(s.selectedNitColor) : texts.noPatch);
    addLine(group, texts.labels.centrePatchType, centreEmbroidery ? selectedText(s.selectedStredNasivka) : texts.noPatch);
    addLine(group, texts.labels.centrePatchColor, centreEmbroidery ? threadColor(s.selectedStredNitColor) : texts.noPatch);
  });

  const wantsDoorPanels = s.doorPanelChoice === true || s.doorPanelChoice === "ano";
  if (wantsDoorPanels) {
    const wantsDoorPatch = s.doorWantsNasivka === true;
    const doorMaterial = materialAndColor(s.doorMaterial, s.doorColor, language);
    const doorMaterialValue = s.doorSameAsCarpet && s.doorSameAsCarpet.material
      ? `${texts.sameMaterial} – ${carpetMaterial}`
      : doorMaterial;
    const doorEdging = edgingText(s.doorLemovanie, language);
    const doorEdgingValue = s.doorSameAsCarpet && s.doorSameAsCarpet.lemovanie
      ? `${texts.sameEdging} – ${carpetEdging}`
      : doorEdging;
    // Michal 25. 10. 2026: pod sedadlami a v strede rôzne nášivky -> tapacír preberá tú spod sedadiel a poznámka to
    // povie („ako na koberčekoch“ by bolo nejasné — ktorých?)
    const kod = (v) => (v && (v.code || v.name)) || "";
    const roznePodSedadlamiAStred = s.nasivkyPlacement === "boky+stred" &&
      (kod(s.selectedNasivka) !== kod(s.selectedStredNasivka) || kod(s.selectedNitColor) !== kod(s.selectedStredNitColor));
    const samePatch = roznePodSedadlamiAStred ? texts.samePatchSides : texts.samePatch;
    const doorPatch = s.doorSameNasivkaAsCarpet
      ? `${samePatch} – ${selectedText(s.doorNasivka)}`
      : selectedText(s.doorNasivka);
    const doorPatchColor = s.doorSameNitAsCarpet
      ? `${samePatch} – ${threadColor(s.doorNitColor)}`
      : threadColor(s.doorNitColor);

    addGroup(lines, texts.headings.doors, (group) => {
      addLine(group, texts.labels.materialColor, doorMaterialValue);
      addLine(group, texts.labels.edgingColor, doorEdgingValue);
      addLine(group, texts.labels.doorPatches, wantsDoorPatch ? texts.yes : texts.no);
      if (wantsDoorPatch) {
        addLine(group, texts.labels.doorPatchType, doorPatch);
        addLine(group, texts.labels.doorPatchColor, doorPatchColor);
      }
    });
  }

  return lines.join("\n");
}

export function parseTruckOrderSummary(summary) {
  const groups = [];
  let current = null;
  const language = /^SPECIFIKACE VOZIDLA\b/m.test(String(summary || "")) ? "cs" : "sk";
  const colorLabels = new Set([
    SUMMARY_TEXTS.sk.labels.centrePatchColor,
    SUMMARY_TEXTS.sk.labels.sidePatchColor,
    SUMMARY_TEXTS.sk.labels.doorPatchColor,
    SUMMARY_TEXTS.cs.labels.centrePatchColor,
    SUMMARY_TEXTS.cs.labels.sidePatchColor,
    SUMMARY_TEXTS.cs.labels.doorPatchColor,
  ]);

  String(summary || "").split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    if (!line.startsWith("- ")) {
      current = { heading: line, items: [] };
      groups.push(current);
      return;
    }
    if (!current) return;
    const item = line.slice(2);
    const separator = item.indexOf(":");
    if (separator < 0) return;
    const label = item.slice(0, separator).trim();
    const rawValue = item.slice(separator + 1).trim();
    current.items.push({
      label,
      value: colorLabels.has(label) ? enrichThreadColorText(rawValue, language) : rawValue,
    });
  });

  return groups.filter((group) => group.items.length);
}

export function persistTruckOrderSummary(state) {
  const summary = buildTruckOrderSummary(state, detectTruckSummaryLanguage());
  if (typeof sessionStorage !== "undefined" && summary) {
    sessionStorage.setItem("truckOrderSummary", summary);
  }
  return summary;
}

export function mergeTruckOrderSummaryIntoNote(currentNote, summary) {
  const texts = /^SPECIFIKACE VOZIDLA\b/m.test(String(summary || ""))
    ? SUMMARY_TEXTS.cs
    : SUMMARY_TEXTS.sk;
  const markerPairs = [
    [SUMMARY_TEXTS.sk.markerStart, SUMMARY_TEXTS.sk.markerEnd],
    [SUMMARY_TEXTS.cs.markerStart, SUMMARY_TEXTS.cs.markerEnd],
    ["[TRUCK CONFIGURATION]", "[/TRUCK CONFIGURATION]"],
    ["[TRUCK KONFIGURÁCIA]", "[/TRUCK KONFIGURÁCIA]"],
  ];
  const withoutOldSummary = markerPairs.reduce((note, [start, end]) => {
    const escapedStart = start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedEnd = end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return note.replace(new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "g"), "");
  }, String(currentNote || "")).trim();

  if (!summary) return withoutOldSummary;
  // Formát bloku (nadpis časti + riadky „- Popis: hodnota“) číta Jánov export objednávok pre výrobu
  // (all_orders_last_month.txt) – meniť len po dohode s Jánom (25. 10. 2026: očíslované riadky vrátené späť).
  const block = `${texts.markerStart}\n${summary}\n${texts.markerEnd}`;
  return withoutOldSummary ? `${withoutOldSummary}\n\n${block}` : block;
}
