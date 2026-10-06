#!/usr/bin/env node
/* perf-markup.mjs — úprava vygenerovaného markupu (S10, rýchlosť na pomalých mobiloch).

   Spracuje SK aj CZ reťazce v assets/js/lcdHome-markup.js, lcdHdr-markup.js a lcdRz-markup.js
   (riadky `export const X = "<...>";`, ktoré píšu generátory gen-lcd*-bundle.py cez json.dumps):

   1) každý <img> bez atribútu loading dostane loading="lazy" (+ decoding="async", ak chýba),
      OKREM obrázkov nad zlomom: hero (#heroBg, header.hero, section.rz) a logo (a.logo).
      Obrázky v zatvorenom menu nav#mega sú teda lazy — pred otvorením ich prepne na eager
      JS pri prvom dotyku / nabehnutí na #burg (lcdHome.js, lcdHdr.js, lcdRz.js).
   2) referenčné slučky <video src=".../refv-*.mp4">: src -> data-src (stiahne sa až pri
      zobrazení, rieši lcdHome.js), preload="none", poster=".../refv-*.jpg".

   width/height a ostatné atribúty sa nemenia (GSAP a sticky scény počítajú výšky).
   Skript je idempotentný — druhý beh nič nezmení.

   Použitie:
     node tools/perf-markup.mjs           zapíše zmeny do súborov
     node tools/perf-markup.mjs --check   nič nezapíše; exit 1, ak by niečo zmenil
   Bez závislostí (len Node). */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SUBORY = ["assets/js/lcdHome-markup.js", "assets/js/lcdHdr-markup.js", "assets/js/lcdRz-markup.js"];
const CHECK = process.argv.includes("--check");
const TICHO = process.argv.includes("--quiet");

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "title"]);

/* hodnota atribútu (null = atribút chýba, "" = bez hodnoty) */
function attr(attrs, meno) {
  const re = new RegExp("(?:^|\\s)" + meno + "(?=[\\s=/>]|$)(?:\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s\"'>]+)))?", "i");
  const m = attrs.match(re);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? "";
}
const maTriedu = (attrs, t) => (attr(attrs, "class") || "").split(/\s+/).includes(t);

/* obrázky nad zlomom (LCP / logo) — tie ostávajú eager */
function nadZlomom(predkovia) {
  return predkovia.some((p) =>
    attr(p.attrs, "id") === "heroBg" ||
    (p.meno === "header" && maTriedu(p.attrs, "hero")) ||
    (p.meno === "section" && maTriedu(p.attrs, "rz")) ||
    (p.meno === "a" && maTriedu(p.attrs, "logo")));
}

/* doplní atribút pred koniec tagu (zachová prípadné "/>") */
function pridaj(tag, text) {
  return tag.replace(/\s*(\/?)>$/, (m, lom) => " " + text + (lom ? " /" : "") + ">");
}

function upravVideo(tag, zaznam) {
  const src = attr(tag.slice(6, -1), "src");
  if (src === null || !/\/refv-[\w-]+\.mp4$/.test(src)) return tag;
  let t = tag;
  /* src -> data-src (zdroj ostáva v data-src, prehliadač nič nestiahne) */
  if (attr(t.slice(6, -1), "data-src") === null) {
    t = t.replace(/(\s)src(\s*=\s*)/i, "$1data-src$2");
  } else {
    t = t.replace(/\ssrc\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/i, "");
  }
  const pre = attr(t.slice(6, -1), "preload");
  if (pre === null) t = pridaj(t, 'preload="none"');
  else if (pre !== "none") t = t.replace(/(\s)preload\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/i, '$1preload="none"');
  if (attr(t.slice(6, -1), "poster") === null) t = pridaj(t, 'poster="' + src.replace(/\.mp4$/, ".jpg") + '"');
  if (t !== tag) zaznam.videa.push(src.split("/").pop());
  return t;
}

function upravHtml(html) {
  const zaznam = { lazy: [], eager: [], videa: [] };
  const zasobnik = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let out = "", posl = 0, m;
  while ((m = re.exec(html))) {
    if (!m[2]) continue; /* komentár */
    const [cely, zatv, menoRaw, attrs] = m;
    const meno = menoRaw.toLowerCase();
    if (zatv) {
      for (let i = zasobnik.length - 1; i >= 0; i--) {
        if (zasobnik[i].meno === meno) { zasobnik.length = i; break; }
      }
      continue;
    }
    let novy = cely;
    if (meno === "img") {
      const src = (attr(attrs, "src") || attr(attrs, "data-src") || "").split("/").pop();
      if (attr(attrs, "loading") === null) {
        if (nadZlomom(zasobnik)) zaznam.eager.push(src);
        else {
          novy = pridaj(novy, 'loading="lazy"');
          if (attr(attrs, "decoding") === null) novy = pridaj(novy, 'decoding="async"');
          zaznam.lazy.push(src);
        }
      }
    } else if (meno === "video") {
      novy = upravVideo(cely, zaznam);
    }
    if (novy !== cely) { out += html.slice(posl, m.index) + novy; posl = m.index + cely.length; }
    if (RAW.has(meno)) {
      const k = html.toLowerCase().indexOf("</" + meno, re.lastIndex);
      if (k !== -1) re.lastIndex = k;
      continue;
    }
    if (!VOID.has(meno) && !/\/\s*$/.test(attrs)) zasobnik.push({ meno, attrs });
  }
  return { html: out + html.slice(posl), zaznam };
}

let zmien = 0;
for (const rel of SUBORY) {
  const subor = path.join(ROOT, rel);
  const zdroj = fs.readFileSync(subor, "utf8");
  let novyZdroj = zdroj, pocet = 0;
  const re = /^export const (\w+) = (".*");$/gm;
  let m;
  while ((m = re.exec(zdroj))) {
    const [, meno, lit] = m;
    pocet++;
    const html = JSON.parse(lit);
    /* generátor píše json.dumps(ensure_ascii=False) = to isté ako JSON.stringify;
       keby sa formát zmenil, radšej skončiť než prepísať súbor inak kódovaným reťazcom */
    if (JSON.stringify(html) !== lit) {
      console.error(`perf-markup: ${rel} ${meno} — reťazec nie je v tvare JSON.stringify, končím bez zmien.`);
      process.exit(2);
    }
    const { html: nove, zaznam } = upravHtml(html);
    if (!TICHO) {
      console.log(`${rel} ${meno}: +lazy ${zaznam.lazy.length}, video ${zaznam.videa.length}, nad zlomom (bez zmeny) ${zaznam.eager.join(", ") || "-"}`);
    }
    if (nove !== html) {
      zmien++;
      novyZdroj = novyZdroj.replace(lit, () => JSON.stringify(nove));
    }
  }
  if (!pocet) {
    console.error(`perf-markup: v ${rel} som nenašiel žiadny "export const X = \\"...\\";" — zmenil sa generátor?`);
    process.exit(2);
  }
  if (novyZdroj !== zdroj && !CHECK) fs.writeFileSync(subor, novyZdroj, "utf8");
}

if (CHECK) {
  if (zmien) {
    console.error(`perf-markup --check: ${zmien} reťazcov treba upraviť. Spusti: node tools/perf-markup.mjs`);
    process.exit(1);
  }
  console.log("perf-markup --check: OK, markup je upravený.");
} else {
  console.log(zmien ? `perf-markup: upravených reťazcov ${zmien}.` : "perf-markup: bez zmien (už upravené).");
}
