#!/usr/bin/env node
/* admin-html/porovnaj-texty.mjs — nezmizol žiadny text? Porovná texty v admin-html/dist/ s textami
   živej stránky po spustení JS (to, čo vidí zákazník aj Google).

   Živú stránku stiahne headless Chrome (--dump-dom = DOM po spustení JS), alebo sa dá podať uložený súbor:
     node admin-html/porovnaj-texty.mjs --stranka titulka --web sk
     node admin-html/porovnaj-texty.mjs --stranka rozcestnik --web cz
     node admin-html/porovnaj-texty.mjs --stranka titulka --web sk --zive C:/tmp/sk.html
   Porovnáva textové uzly (normalizované medzery) a texty atribútov alt / aria-label / placeholder / title
   v koreni dnešného dizajnu (#lcd-home / #lcd-rz) proti dist časti danej stránky (ciele.json -> stranky).
   Vypíše: texty, ktoré sú naživo, ale v dist nie sú (CHÝBA), a nové texty v dist (NOVÉ).
   Známe rozdiely (texty, ktoré za behu dopĺňa/mení JS a nie sú obsahom adminu) sú vypísané zvlášť
   a nepočítajú sa ako chyba. Exit 1 = chýba text. Potrebuje jsdom (devDependency) a Chrome. */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const TU = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(TU, "..");
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const STRANKA = arg("--stranka", "titulka");
const WEB = arg("--web", "sk");
const require = createRequire(path.join(REPO, "package.json"));
const { JSDOM } = require("jsdom");
const CIELE = JSON.parse(fs.readFileSync(path.join(TU, "ciele.json"), "utf8"));
const sd = CIELE.stranky[STRANKA];
if (!sd) { console.error("neznáma stránka " + STRANKA); process.exit(2); }

const URL_STRANKY = { titulka: "/", rozcestnik: "/rozcestnik/" };
const KOREN_ZIVE = { titulka: "#lcd-home", rozcestnik: "#lcd-rz" };

function zive() {
  const subor = arg("--zive", null);
  if (subor) return fs.readFileSync(subor, "utf8");
  const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
  if (!chrome) throw new Error("nenašiel som Chrome — podaj --zive <uložený DOM>");
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), "lcd-porovnaj-"));
  const url = `https://www.luxurycardesign.${WEB}${URL_STRANKY[STRANKA]}`;
  try {
    return execFileSync(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + prof,
      "--window-size=1366,900", "--virtual-time-budget=25000", "--dump-dom", url], { encoding: "utf8", maxBuffer: 64 << 20, timeout: 120000 });
  } finally { try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }
}

const norm = (s) => s.replace(/[\s\u00a0]+/g, " ").trim();
/* data-bez-auta = text, ktorý JS dosadí, keď auto nepozná (rozcestník) */
const ATR = ["alt", "aria-label", "placeholder", "title", "data-bez-auta"];
function texty(korene, vynechaj) {
  const out = new Map();
  const pridaj = (t, kde) => { t = norm(t); if (t && !out.has(t)) out.set(t, kde); };
  for (const k of korene) {
    const walker = k.ownerDocument.createTreeWalker(k, 1 | 4);
    for (let n = walker.currentNode; n; n = walker.nextNode()) {
      const el = n.nodeType === 1 ? n : n.parentElement;
      if (el && el.closest("script,style,noscript")) continue;
      if (el && vynechaj && el.closest(vynechaj)) continue;
      if (n.nodeType === 3) pridaj(n.data, el ? el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : "") : "");
      else for (const a of ATR) if (n.hasAttribute(a)) pridaj(n.getAttribute(a), `@${a}`);
    }
  }
  return out;
}

/* JS mení/dopĺňa za behu, nie je to obsah adminu (selektor: dôvod) */
const ZA_BEHU = {
  ".model-selector": "konfigurátor Shoptetu (main.js) — vloží ho JS do #konfSlot",
  "#vids .vid": "YouTube videá — dnes JS nahradí 6 statických dlaždíc celým LCDH_REELS; v dist ostáva 6 statických z markupu, ďalšie pridá JS",
  ".lcdlang": "prepínač jazyka — rozbalí lcdLang.js z a.lang (v dist je a.lang v menu)",
  ".lx-zoom, .ts-peek": "zväčšenie fotky / náhľad pri kurzore — vytvorí JS",
  "[data-clone]": "kópie kariet nekonečného pásu — vytvorí JS",
  "#lbFrame, #lbCap": "lightbox — plní JS",
  ".rzsteps": "kroky rozcestníka — lcdRz.js ich prepíše podľa toho, či pozná auto (dnes aj na .cz po slovensky)",
  "#lcd-rz #konfNote": "poznámka karty „Iné vozidlo?“ — prepisovala ju atrapa konfigurátora (dnes na .cz po slovensky)",
};
/* dnešný obsah, ktorý zámerne nahrádza niečo iné (selektor: dôvod) */
const NAHRADENE = {
  "header.hdr": "hlavička dnešného dizajnu — nahrádza ju natívna hlavička Shoptetu (logo, košík, kontakt, burger)",
  "#konfCard > .tabs, #konfCard > #fields": "atrapa konfigurátora (naživo skrytá) — nahradil ju #konfSlot so živým konfigurátorom",
};

const html = zive();
const dZive = new JSDOM(html).window.document;
const korenZive = dZive.querySelector(KOREN_ZIVE[STRANKA]);
if (!korenZive) { console.error(`na živej stránke chýba ${KOREN_ZIVE[STRANKA]}`); process.exit(2); }
/* menu dnešného dizajnu je vnútri koreňa; v dist je samostatná časť (mega) */
const vynechajZive = [...Object.keys(ZA_BEHU), ...Object.keys(NAHRADENE)].join(",");
const zivePrvky = texty([korenZive], vynechajZive);
const zaBehu = new Map(), nahradene = new Map();
for (const [kam, zoznam] of [[zaBehu, ZA_BEHU], [nahradene, NAHRADENE]]) {
  for (const [sel, dovod] of Object.entries(zoznam)) {
    const t = texty([...korenZive.querySelectorAll(sel)], null);
    if (t.size) kam.set(sel, [dovod, t]);
  }
}
const vsetkyVynechane = new Set([...zaBehu.values(), ...nahradene.values()].flatMap(([, t]) => [...t.keys()]));

const distHtml = sd.casti.map((c) => fs.readFileSync(path.join(TU, "dist", `${c}.${WEB}.html`), "utf8")).join("\n");
const dDist = new JSDOM(`<!doctype html><body>${distHtml}</body>`).window.document;
const distPrvky = texty([dDist.body], null);

const chyba = [...zivePrvky].filter(([t]) => !distPrvky.has(t));
const nove = [...distPrvky].filter(([t]) => !zivePrvky.has(t));

console.log(`porovnaj-texty: ${STRANKA} ${WEB.toUpperCase()} — živé ${KOREN_ZIVE[STRANKA]}: ${zivePrvky.size} textov, dist (${sd.casti.join(" + ")}): ${distPrvky.size} textov`);
console.log(`\nCHÝBA v dist (je naživo): ${chyba.length}`);
for (const [t, kde] of chyba) console.log(`  - [${kde}] ${t.slice(0, 140)}`);
console.log(`\nNOVÉ v dist (naživo nie je): ${nove.length}`);
for (const [t, kde] of nove) console.log(`  + [${kde}] ${t.slice(0, 140)}${vsetkyVynechane.has(t) ? "   (naživo je vo vynechanej časti nižšie)" : ""}`);
for (const [nadpis, mapa] of [["Zámerne nahradené (nie je chyba)", nahradene], ["Za behu (JS, nie admin) — vynechané z porovnania", zaBehu]]) {
  console.log(`\n${nadpis}:`);
  for (const [sel, [dovod, t]] of mapa) {
    const vDist = [...t.keys()].filter((x) => distPrvky.has(x)).length;
    console.log(`  ~ ${sel}: ${t.size} textov (${vDist} z nich je v dist aj tak) — ${dovod}`);
    if (mapa === nahradene) for (const x of [...t.keys()].filter((y) => !distPrvky.has(y))) console.log(`      · ${x.slice(0, 100)}`);
  }
}
process.exitCode = chyba.length ? 1 : 0;
