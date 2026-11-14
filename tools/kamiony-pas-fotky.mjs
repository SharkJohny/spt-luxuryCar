#!/usr/bin/env node
// Fotky „bežiaceho pásu“ galérie stránok kamiónov a dodávok (Michal 14. 11. 2026: galéria „rovnako ako pri osobných
// autách, je to krajšie ako pár fotiek pod sebou“). Pás = sekcia a-galeria (lx galéria titulky), karty 760 × 950.
//
//   node tools/kamiony-pas-fotky.mjs                    chýbajúce fotky pásu všetkých hotových stránok
//   node tools/kamiony-pas-fotky.mjs volvo-fh5 ...      len tieto stránky
//   node tools/kamiony-pas-fotky.mjs --prepis           prepíše aj existujúce (nová fotka galérie, iný orez)
//   node tools/kamiony-pas-fotky.mjs --nahlad <subor.jpg> [slug ...]   kontaktný hárok pásových fotiek (na kontrolu okom)
//
// Číta admin-html/kamiony/stranky.json (fotky[] v poradí stránky, SK = CZ). Zdroj = okno galérie v repe
// assets/img/1v/kamion-stranky/<slug>/<meno>-galeria-NN(-vN).jpg (oknoVerzia -> -vN), <meno> = fotkyMeno alebo adresa
// bez lomiek. Výstup <slug>/pas/<meno>-pas-NN.jpg: JPEG q82, sRGB, bez EXIF.
//   typ "studio"            celá fotka na bielom (contain, okraj 40 px; biely okraj zdroja sa najprv oreže)
//   "kabina", "zakaznik"    orez na výšku (cover, stred)
// CDN drží obrázky rok: nová fotka pod tým istým menom = zvýš VERZIA_GALERIE v tools/build-kamiony-stranky.mjs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const KOREN = join(dirname(fileURLToPath(import.meta.url)), "..");
const IMG = join(KOREN, "assets", "img", "1v", "kamion-stranky");
const W = 760, H = 950, OKRAJ = 40, KVALITA = 82;
const BIELA = { r: 255, g: 255, b: 255 };

const arg = process.argv.slice(2);
const PREPIS = arg.includes("--prepis");
const iN = arg.indexOf("--nahlad");
const NAHLAD = iN > -1 ? resolve(arg[iN + 1] || "") : null;
const vyber = arg.filter((x, i) => !x.startsWith("--") && !(iN > -1 && i === iN + 1));

const data = JSON.parse(readFileSync(join(KOREN, "admin-html", "kamiony", "stranky.json"), "utf8"));
const slugy = Object.keys(data.stranky).sort().filter((s) => data.stranky[s].sk.fotky.length && !data.stranky[s].sk.caka);
for (const s of vyber) if (!slugy.includes(s)) { console.error("neznáma alebo čakajúca stránka: " + s); process.exit(1); }
const meno = (s) => s.fotkyMeno || s.url.replace(/^\/|\/$/g, "");

/** Fotky pásu stránky: [{ zdroj, ciel, typ, popis }] (SK a CZ musia mať rovnaké fotky). */
function fotkyStranky(slug) {
  const { sk, cz } = data.stranky[slug];
  const kluc = (s) => s.fotky.map((f) => f.n + "/" + f.typ + "/" + (f.oknoVerzia || "")).join() + "|" + meno(s);
  if (kluc(sk) !== kluc(cz)) throw new Error(slug + ": fotky SK ≠ CZ (poradie, typ alebo oknoVerzia)");
  return sk.fotky.map((f) => ({
    zdroj: join(IMG, slug, meno(sk) + "-galeria-" + f.n + (f.oknoVerzia ? "-v" + f.oknoVerzia : "") + ".jpg"),
    ciel: join(IMG, slug, "pas", meno(sk) + "-pas-" + f.n + ".jpg"),
    typ: f.typ,
    popis: f.popis,
  }));
}

/** Jedna fotka pásu 760 × 950. */
async function pasFotka(zdroj, typ) {
  const vstup = sharp(zdroj).rotate();
  if (typ !== "studio") {
    return vstup.resize(W, H, { fit: "cover", position: "centre" }).toColorspace("srgb").jpeg({ quality: KVALITA, mozjpeg: true }).toBuffer();
  }
  // biely okraj zdroja preč (len keď sú rohy biele), potom celá fotka do 680 × 870 na bielom
  const { data: px, info } = await sharp(zdroj).rotate().raw().toBuffer({ resolveWithObject: true });
  const roh = (x, y) => { const i = (y * info.width + x) * info.channels; return Math.min(px[i], px[i + 1], px[i + 2]); };
  const biele = [roh(0, 0), roh(info.width - 1, 0), roh(0, info.height - 1), roh(info.width - 1, info.height - 1)].every((c) => c >= 245);
  let buf = await vstup.png().toBuffer(); // medzikrok bez straty
  if (biele) buf = await sharp(buf).trim({ background: "#ffffff", threshold: 12 }).png().toBuffer();
  const vnutro = await sharp(buf).resize(W - 2 * OKRAJ, H - 2 * OKRAJ, { fit: "inside" }).png().toBuffer({ resolveWithObject: true });
  return sharp({ create: { width: W, height: H, channels: 3, background: BIELA } })
    .composite([{ input: vnutro.data, left: Math.round((W - vnutro.info.width) / 2), top: Math.round((H - vnutro.info.height) / 2) }])
    .toColorspace("srgb").jpeg({ quality: KVALITA, mozjpeg: true }).toBuffer();
}

const ciele = vyber.length ? vyber : slugy;

if (NAHLAD) {
  // kontaktný hárok: riadok = stránka, fotky pásu 190 × 238 vedľa seba (zo súborov pas/, inak vyrobené v pamäti)
  const TW = 190, TH = 238, M = 10, POPIS = 26;
  const riadky = [];
  for (const slug of ciele) {
    const f = fotkyStranky(slug);
    const male = [];
    for (const x of f) {
      const b = existsSync(x.ciel) ? readFileSync(x.ciel) : await pasFotka(x.zdroj, x.typ);
      male.push(await sharp(b).resize(TW, TH).toBuffer());
    }
    riadky.push({ slug, male, typy: f.map((x) => x.typ) });
  }
  const sirka = M + Math.max(...riadky.map((r) => r.male.length)) * (TW + M);
  const vyska = M + riadky.length * (POPIS + TH + M);
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const comp = [];
  riadky.forEach((r, i) => {
    const y = M + i * (POPIS + TH + M);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + sirka + '" height="' + POPIS + '"><text x="' + M + '" y="18" font-family="Arial" font-size="16" fill="#e6c877">' +
      esc(r.slug + "  (" + r.typy.join(", ") + ")") + "</text></svg>";
    comp.push({ input: Buffer.from(svg), left: 0, top: y });
    r.male.forEach((b, k) => comp.push({ input: b, left: M + k * (TW + M), top: y + POPIS }));
  });
  mkdirSync(dirname(NAHLAD), { recursive: true });
  await sharp({ create: { width: sirka, height: vyska, channels: 3, background: { r: 13, g: 11, b: 8 } } }).composite(comp).jpeg({ quality: 85 }).toFile(NAHLAD);
  console.log("náhľad: " + NAHLAD + " (" + riadky.length + " stránok)");
  process.exit(0);
}

let nove = 0, preskocene = 0;
const chyby = [];
for (const slug of ciele) {
  for (const x of fotkyStranky(slug)) {
    if (!existsSync(x.zdroj)) { chyby.push("chýba zdroj " + x.zdroj.slice(IMG.length + 1)); continue; }
    if (existsSync(x.ciel) && !PREPIS) { preskocene++; continue; }
    mkdirSync(dirname(x.ciel), { recursive: true });
    writeFileSync(x.ciel, await pasFotka(x.zdroj, x.typ));
    nove++;
  }
}
console.log("fotky pásu: " + nove + " zapísaných, " + preskocene + " už bolo (bez --prepis sa neprepisujú), stránok " + ciele.length);
if (chyby.length) { console.log("CHYBY (" + chyby.length + "):\n" + chyby.join("\n")); process.exit(1); }
