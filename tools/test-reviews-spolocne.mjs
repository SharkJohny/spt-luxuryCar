// Test CI kroku tools/reviews-spolocne.mjs s falošným CDN (127.0.0.1, samostatný proces) — nič nejde von.
//   node tools/test-reviews-spolocne.mjs   (exit 1 = chyba)
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "reviews-spolocne.mjs");
const data = (fetchedAt, text = "Super") =>
  `/* hlavička */\nwindow.LCD_REVIEWS = ${JSON.stringify({ place: { totalReviews: 101, rating: 5, fetchedAt }, reviews: [{ id: "g-1", text }] }, null, 2)};\n`;
const T0 = "2026-10-29T10:00:00.000Z", NOVSI = "2026-10-30T10:00:00.000Z", STARSI = "2026-10-28T10:00:00.000Z";

// falošný CDN v samostatnom procese (spawnSync by zablokoval server v tomto procese); PUT nastaví odpoveď
const SERVER_JS = `
import { createServer } from "node:http";
let cdn = { status: 404, body: "" };
const s = createServer((req, res) => {
  if (req.method === "PUT") { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { cdn = JSON.parse(b); res.end("ok"); }); return; }
  res.writeHead(cdn.status, { "content-type": "application/javascript" }); res.end(cdn.body);
});
s.listen(0, "127.0.0.1", () => console.log(s.address().port));
`;
const srv = spawn(process.execPath, ["--input-type=module", "-e", SERVER_JS], { stdio: ["ignore", "pipe", "inherit"] });
const port = await new Promise((r) => srv.stdout.once("data", (d) => r(String(d).trim())));
const ZIVE = `http://127.0.0.1:${port}/reviews-data.js`;

let ok = 0, zle = 0;
async function pripad(nazov, { lokal, status = 200, zive = "", ocakavaj }) {
  await fetch(ZIVE, { method: "PUT", body: JSON.stringify({ status, body: zive }) });
  const dir = mkdtempSync(path.join(tmpdir(), "lcd-spolocne-"));
  try {
    if (lokal !== null) { mkdirSync(path.join(dir, "assets/js"), { recursive: true }); writeFileSync(path.join(dir, "assets/js/reviews-data.js"), lokal); }
    const r = spawnSync(process.execPath, [SKRIPT], { cwd: dir, encoding: "utf8", env: { ...process.env, LCD_REVIEWS_ZIVE: ZIVE } });
    const cesta = path.join(dir, "assets/data/reviews-data.js");
    const skopirovane = existsSync(cesta);
    const sedi = r.status === 0 && skopirovane === ocakavaj && (!skopirovane || readFileSync(cesta, "utf8") === lokal);
    if (sedi) ok++; else zle++;
    console.log(`${sedi ? "OK  " : "ZLE "} ${nazov}: exit ${r.status}, ${skopirovane ? "skopírované" : "nekopírované"} | ${(r.stdout || r.stderr).trim().slice(0, 140)}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
try {
  await pripad("CDN 404 -> kopíruj", { lokal: data(T0), status: 404, ocakavaj: true });
  await pripad("CDN 500 -> nekopíruj", { lokal: data(T0), status: 500, ocakavaj: false });
  await pripad("rovnaké dáta -> nekopíruj", { lokal: data(T0), zive: data(T0), ocakavaj: false });
  await pripad("rovnaké dáta, iné konce riadkov -> nekopíruj", { lokal: data(T0), zive: data(T0).replace(/\n/g, "\r\n"), ocakavaj: false });
  await pripad("rovnaký fetchedAt, iný obsah (oprava) -> kopíruj", { lokal: data(T0, "Super, aj s fotkami"), zive: data(T0), ocakavaj: true });
  await pripad("lokálne novšie -> kopíruj", { lokal: data(NOVSI), zive: data(T0), ocakavaj: true });
  await pripad("na CDN novšie -> nikdy neprepíš", { lokal: data(STARSI, "iný text"), zive: data(T0), ocakavaj: false });
  await pripad("CDN bez fetchedAt -> kopíruj", { lokal: data(T0), zive: "/* nič */", ocakavaj: true });
  await pripad("lokálne chýba -> nekopíruj, exit 0", { lokal: null, ocakavaj: false });
  await pripad("lokálne bez fetchedAt -> nekopíruj", { lokal: "window.LCD_REVIEWS = {};\n", ocakavaj: false });
} finally { srv.kill(); }
console.log(`test-reviews-spolocne: ${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
