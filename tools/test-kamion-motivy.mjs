#!/usr/bin/env node
// Test motívov nášiviek konfigurátora kamiónov 1V (kniha Brain napady/2026-11-12-kamiony-vlna-2-3-disk-a-odpov.md §2.2 A1):
//   - N2 = samotný nápis IVECO („Iveco – nápis“): nové súbory v assets/img/1v/kamion/, ktoré existujú, 100 × 100 a 300 × 300
//     JPEG, meno = t + 16 znakov sha256 obsahu; obsah iný ako pôvodný obrázok spojeného motívu IVECO S-WAY;
//   - staré mená obrázkov N2 (spojený motív) sa v kóde 1V nepoužívajú, súbory na disku ostávajú;
//   - lebka H20 v NASIVKY ani v textoch nie je; spojený motív „IVECO S-WAY“ nikde (S-Way je len H26 „Iveco – S-Way“);
//   - názvy N2 a H26 sedia SK aj CZ.
//   node tools/test-kamion-motivy.mjs
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { KOREN, nacitajModul } from "./test-1v/kamion-spolocne.mjs";

let ok = 0, zle = 0;
const over = (nazov, podm, detail) => {
  if (podm) { ok++; console.log("  OK   " + nazov); }
  else { zle++; console.log("  ZLE  " + nazov + (detail ? " — " + detail : "")); }
};

const IMG = join(KOREN, "assets/img/1v/kamion");
const DIR_1V = join(KOREN, "assets/js/components/konfigurator1v");
const STARE_N2 = ["t6dc097b8e05eddff", "t0c37994928748c3d"]; // spojený motív IVECO S-WAY (do 12. 11. 2026)
const NOVE_N2 = { thumb: "t624769a5cc01f55c.jpg", full: "tc7824b5dac3dc015.jpg" }; // HAFTY AUKCJA/IVECO NAPIS/2.png

const D = await nacitajModul("assets/js/components/konfigurator1v/kamion/data.js");
const { TEXTY } = await nacitajModul("assets/js/components/konfigurator1v/kamion/texty.js");
const { TEXTY_CS } = await nacitajModul("assets/js/components/konfigurator1v/kamion/texty-cs.js");
const O = await nacitajModul("assets/js/components/konfigurator1v/kamion/obrazky.js");

/** Všetky { kod, meno } motívov (H…, N…) kdekoľvek v textoch. */
function motivy(o, out = []) {
  if (Array.isArray(o)) o.forEach((x) => motivy(x, out));
  else if (o && typeof o === "object") {
    if (typeof o.kod === "string" && /^[HN]\d+$/.test(o.kod) && typeof o.meno === "string") out.push({ kod: o.kod, meno: o.meno });
    Object.keys(o).forEach((k) => motivy(o[k], out));
  }
  return out;
}

console.log("1) N2 = samotný nápis IVECO — nové súbory");
{
  const n2 = D.NASIVKY.filter((n) => n.kod === "N2");
  over("N2 je v NASIVKY práve raz", n2.length === 1);
  const n = n2[0] || {};
  for (const [pole, meno, px] of [["thumb", NOVE_N2.thumb, 100], ["full", NOVE_N2.full, 300]]) {
    const url = String(n[pole] || "");
    over("N2 " + pole + " -> kamion/" + meno + " (z repa, nie z IMG_BASE)", url === O.MENSIE_ZAKLAD + "kamion/" + meno && url.indexOf(D.IMG_BASE) !== 0, url);
    const cesta = join(IMG, meno);
    over("súbor " + meno + " existuje", existsSync(cesta));
    if (!existsSync(cesta)) continue;
    const buf = readFileSync(cesta);
    over(meno + ": meno = t + 16 znakov sha256 obsahu", "t" + createHash("sha256").update(buf).digest("hex").slice(0, 16) + ".jpg" === meno);
    const m = await sharp(buf).metadata();
    over(meno + ": JPEG " + px + " × " + px + " progresívny (ako dnešná dvojica N2)", m.format === "jpeg" && m.width === px && m.height === px && m.isProgressive === true, m.format + " " + m.width + "×" + m.height + " prog " + m.isProgressive);
    const stary = join(IMG, STARE_N2[pole === "thumb" ? 0 : 1] + ".jpg");
    over(meno + ": obsah iný ako pôvodný spojený motív", existsSync(stary) && !readFileSync(stary).equals(buf));
  }
  over("obrazky.js: MENSIE má nové mená N2", Object.values(O.MENSIE).filter((v) => v === "kamion/" + NOVE_N2.thumb || v === "kamion/" + NOVE_N2.full).length === 2);
}

console.log("2) Staré mená N2 sa v kóde 1V nepoužívajú, súbory ostávajú");
{
  const subory = [];
  const prejdi = (d) => readdirSync(d).forEach((f) => { const c = join(d, f); if (statSync(c).isDirectory()) prejdi(c); else if (/\.(js|mjs|json)$/.test(f)) subory.push(c); });
  prejdi(DIR_1V);
  for (const s of STARE_N2) {
    const kde = subory.filter((c) => readFileSync(c, "utf8").indexOf(s) > -1).map((c) => c.slice(KOREN.length + 1));
    over("„" + s + "“ nie je v konfigurator1v/** (" + subory.length + " súborov)", kde.length === 0, kde.join(", "));
    over("„" + s + "“ nie je v D.ZDROJ_OBRAZKOV", !D.ZDROJ_OBRAZKOV.some((f) => f.indexOf(s) > -1));
    over("súbor " + s + ".jpg ostáva na disku (assets/img je spoločné pre všetky verzie)", existsSync(join(IMG, s + ".jpg")));
  }
}

console.log("3) Lebka H20 a spojený motív IVECO S-WAY nikde");
{
  over("H20 nie je v NASIVKY", !D.NASIVKY.some((n) => n.kod === "H20"));
  over("H20 nie je v NASIVKY_ZALOHA", D.NASIVKY_ZALOHA.indexOf("H20") < 0);
  for (const [jazyk, T] of [["SK", TEXTY], ["CZ", TEXTY_CS]]) {
    const m = motivy(T);
    over(jazyk + ": v textoch sú motívy (" + m.length + ")", m.length >= 20);
    over(jazyk + ": H20 v textoch nie je", !m.some((x) => x.kod === "H20"));
    over(jazyk + ": žiadny motív s lebkou / Kram Truck", !m.some((x) => /lebk|lebka|czaszk|kram/i.test(x.meno)), m.filter((x) => /lebk|czaszk|kram/i.test(x.meno)).map((x) => x.kod).join());
    const sway = m.filter((x) => /s-?way/i.test(x.meno)).map((x) => x.kod);
    over(jazyk + ": „S-Way“ má len H26", sway.length > 0 && sway.every((k) => k === "H26"), sway.join());
    const surovy = JSON.stringify(T);
    over(jazyk + ": text „IVECO S-WAY“ (spojený motív) v textoch nie je", !/iveco\s*[–-]?\s*s-?way(?!\s*\d)/i.test(surovy.replace(/Iveco – S-Way/g, "")));
  }
}

console.log("4) Názvy N2 a H26 SK aj CZ");
{
  const ocak = { N2: "Iveco – nápis", H26: "Iveco – S-Way" };
  for (const [jazyk, T] of [["SK", TEXTY], ["CZ", TEXTY_CS]]) {
    const m = motivy(T);
    for (const kod of Object.keys(ocak)) {
      const mena = [...new Set(m.filter((x) => x.kod === kod).map((x) => x.meno))];
      over(jazyk + " " + kod + " = „" + ocak[kod] + "“", mena.length === 1 && mena[0] === ocak[kod], mena.join(" | "));
    }
  }
  over("H26 má vlastné obrázky (nie nové N2)", D.NASIVKY.some((n) => n.kod === "H26" && n.full.indexOf(NOVE_N2.full) < 0 && n.thumb.indexOf(NOVE_N2.thumb) < 0));
}

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
