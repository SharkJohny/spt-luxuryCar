#!/usr/bin/env node
/* test-ulozisko-siet.mjs — sonda siete: produkty SK aj CZ nesmú sťahovať súbory z úložiska webu
   …/user/documents/upload/assets/config/ (fotky volieb, farby, vzorky; tools/config-obrazky.mjs, 29. 10. 2026).

   node tools/test-ulozisko-siet.mjs                        lokálny build (ako CI) nad živými stránkami, všetky produkty
                                                            registra (tools/test-1v/produkty.mjs), 390 a 1280 px,
                                                            nový vzhľad (bez parametra) aj starý (?novy=0)
   node tools/test-ulozisko-siet.mjs --zdroj cdn            živý web bez zmeny (porovnanie: koľko požiadaviek ide dnes)
   node tools/test-ulozisko-siet.mjs --produkt 598,2403 --sirka 390 --vzhlad novy|stary|oba --paralelne 1 --vystup x.json

   Ako: Chrome bez okna (tools/test-1v/cdp.mjs). Bundle, časti a CSS živej verzie (…/assets/v/<sha>/…) dostanú odpoveď
   z lokálneho buildu (esbuild s prepínačmi production.yml + vloz-lcd-css.py --vystup), obrázky …/assets/img/* z repa
   (na CDN ešte nie sú). Stránka sa pomaly prescroluje dole (lenivé obrázky). Merače zablokované, každý ne-GET na
   /action/ sa zruší (žiadna objednávka). Chyba: požiadavka na …/user/documents/upload/assets/config/ alebo 4xx
   na img/ulozisko/ (súbor chýba v repe). Ostatné požiadavky na úložisko (obsah adminu) sa len vypíšu. */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hodnota = (m, d) => { const i = process.argv.indexOf(m); return i > 0 ? process.argv[i + 1] : d; };
const a = {
  zdroj: hodnota("--zdroj", "lokal"),
  produkt: hodnota("--produkt", null),
  sirky: hodnota("--sirka", "390,1280").split(",").map(Number),
  vzhlad: hodnota("--vzhlad", "oba"),
  paralelne: Number(hodnota("--paralelne", "1")),
  vystup: hodnota("--vystup", null),
};
const MERACE = ["*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*",
  "*google.com/pagead*", "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*", "*clarity.ms*",
  "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*", "*ecomail.cz/*track*", "*luxia-*.rostiapp.cz*"];
const RE_CONFIG = /\/user\/documents\/upload\/assets\/config\//;
const RE_ULOZISKO = /\/user\/documents\/upload\//;
const TYP = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".gif": "image/gif", ".mp4": "video/mp4" };

function build() {
  const tmp = mkdtempSync(join(tmpdir(), "lcd-ulozisko-"));
  const spusti = (cmd, args) => { const r = spawnSync(cmd, args, { cwd: KOREN, encoding: "utf8", maxBuffer: 64 << 20 }); if (r.status !== 0) throw new Error(cmd + " " + args.join(" ") + ":\n" + r.stderr + r.stdout); };
  // kroky CI pred esbuildom: generované *.gen.jsx (React kamiónov) — len keď chýbajú alebo sú staršie ako zdroj
  const tk = join(KOREN, "assets/js/truck-konfigurator");
  const mt = (f) => { try { return statSync(f).mtimeMs; } catch { return 0; } };
  if (["konfigurator", "konfigurator.phone"].some((n) => mt(join(tk, n + ".gen.jsx")) < mt(join(tk, n + ".jsx")))) spusti(process.execPath, ["truck/build-truck-images.mjs"]);
  return import("esbuild").then(async (esb) => {
    const spolu = { bundle: true, format: "iife", loader: { ".jsx": "jsx" }, minify: true, drop: ["console"], legalComments: "none", logLevel: "warning", absWorkingDir: KOREN };
    const out = { casti: {} };
    for (const [vstup, f] of [["assets/js/main.js", "luxuryCar.js"], ["assets/js/truck-konfigurator/cast.jsx", "lcd-truck.js"],
      ["assets/js/casti/gsap.js", "lcd-gsap.js"], ["assets/js/casti/reels.js", "lcd-reels.js"], ["assets/js/casti/hp.js", "lcd-hp.js"]]) {
      await esb.build({ ...spolu, entryPoints: [join(KOREN, vstup)], outfile: join(tmp, f) });
      if (f === "luxuryCar.js") out.js = readFileSync(join(tmp, f)); else out.casti[f] = readFileSync(join(tmp, f));
    }
    const py = ["python", "python3", "py"].find((p) => spawnSync(p, ["--version"]).status === 0);
    spusti(py, ["tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")]);
    out.css = readFileSync(join(tmp, "luxuryCar.css"));
    out.popis = "lokálny build " + (out.js.length / 1024).toFixed(0) + " kB JS, " + (out.css.length / 1024).toFixed(0) + " kB CSS (" + tmp + ")";
    return out;
  });
}

async function sonda(ch, b, url, sirka) {
  const k = await ch.novaKarta({ sirka });
  const r = { url, sirka, config: [], ine: [], chybaRepo: [], postZrusene: [] };
  const odpovedz = (p, body, typ) => k.posli("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, body: body.toString("base64"),
    responseHeaders: [{ name: "Content-Type", value: typ }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Cache-Control", value: "no-store" }] });
  k.na("Network.requestWillBeSent", (p) => {
    const u = p.request.url;
    if (RE_CONFIG.test(u)) r.config.push(u); else if (RE_ULOZISKO.test(u)) r.ine.push(u);
  });
  k.na("Network.responseReceived", (p) => { if (/\/img\/ulozisko\//.test(p.response.url) && p.response.status >= 400) r.chybaRepo.push(p.response.status + " " + p.response.url); });
  k.na("Fetch.requestPaused", async (p) => {
    const u = p.request.url;
    try {
      if (/\/action\//i.test(u) && p.request.method !== "GET" && !/\/action\/CustomerCookieConsent\//i.test(u)) {
        r.postZrusene.push(p.request.method + " " + u);
        return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
      }
      if (b) {
        if (/\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?js\/luxuryCar\.js(\?|$)/.test(u)) return await odpovedz(p, b.js, "application/javascript; charset=utf-8");
        const c = /\/eshopy\/luxuryCar\/assets\/(?:v\/[^/]+\/)?js\/(lcd-(?:truck|gsap|reels|hp)\.js)(\?|$)/.exec(u);
        if (c && b.casti[c[1]]) return await odpovedz(p, b.casti[c[1]], "application/javascript; charset=utf-8");
        if (/\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?css\/luxuryCar\.css(\?|$)/.test(u)) return await odpovedz(p, b.css, "text/css; charset=utf-8");
        const m = /\/eshopy\/luxuryCar\/assets\/(img\/[^?#]+)/.exec(u);
        const subor = m && join(KOREN, "assets", ...decodeURIComponent(m[1]).split("/"));
        if (subor && existsSync(subor)) return await odpovedz(p, readFileSync(subor), TYP[extname(subor).toLowerCase()] || "application/octet-stream");
      }
      await k.posli("Fetch.continueRequest", { requestId: p.requestId });
    } catch (e) { /* karta zavretá */ }
  });
  await k.posli("Network.setBlockedURLs", { urls: MERACE });
  await k.posli("Network.setCacheDisabled", { cacheDisabled: true });
  await k.posli("Fetch.enable", { patterns: [{ urlPattern: "*/eshopy/luxuryCar/assets/*", requestStage: "Request" }, { urlPattern: "*/action/*", requestStage: "Request" }] });
  await k.chod(url, { limit: 60000 });
  await pauza(2500);
  // pomaly dole (lenivé obrázky, obsah pod konfigurátorom) a späť hore
  for (let i = 0; i < 40; i++) {
    const koniec = await k.ev("(() => { const y = scrollY; scrollBy(0, innerHeight * 0.8); return scrollY === y; })()").catch(() => true);
    await pauza(250);
    if (koniec) break;
  }
  await pauza(2000);
  r.konfigurator = await k.ev("!!document.querySelector('.lcd1v, #lcd1v, .lcd-1v, body.lcd-1v, .options-wrap, .option-button')").catch(() => null);
  await k.zavri();
  return r;
}

const P = await import(pathToFileURL(join(KOREN, "tools/test-1v/produkty.mjs")).href);
const vsetky = { ...P.PRODUKTY, ...P.PRODUKTY_CZ };
const idcka = a.produkt ? a.produkt.split(",").map((x) => Number(x.trim())) : [...P.PORADIE, ...P.PORADIE_CZ];
const ulohy = [];
for (const id of idcka) {
  if (!vsetky[id]) throw new Error("neznámy produkt " + id + " (register tools/test-1v/produkty.mjs)");
  for (const vz of a.vzhlad === "oba" ? ["novy", "stary"] : [a.vzhlad])
    for (const s of a.sirky) ulohy.push({ id, vz, sirka: s, url: vsetky[id].url + (vz === "stary" ? "?novy=0" : "") });
}
const b = a.zdroj === "lokal" ? await build() : null;
console.log("sonda úložiska: " + ulohy.length + " stránok (" + (b ? b.popis : "živý CDN bez zmeny") + ")");
const ch = await spustiChrome();
const vysledky = [];
let i = 0;
try {
  await Promise.all(Array.from({ length: a.paralelne }, async () => {
    while (i < ulohy.length) {
      const u = ulohy[i++];
      const r = await sonda(ch, b, u.url, u.sirka);
      Object.assign(r, { id: u.id, vzhlad: u.vz });
      vysledky.push(r);
      const ok = !r.config.length && !r.chybaRepo.length && !r.postZrusene.length;
      console.log((ok ? "OK   " : "CHYBA") + " " + u.id + " " + u.vz.padEnd(5) + " " + String(u.sirka).padStart(4) + " px  config " + r.config.length +
        ", iné úložisko " + r.ine.length + (r.chybaRepo.length ? ", 4xx repo " + r.chybaRepo.length : "") + (r.postZrusene.length ? ", ne-GET " + r.postZrusene.length : ""));
      for (const x of [...new Set(r.config)].slice(0, 6)) console.log("        " + x);
      for (const x of r.chybaRepo.slice(0, 6)) console.log("        " + x);
    }
  }));
} finally { ch.zavri(); }
const zle = vysledky.filter((r) => r.config.length || r.chybaRepo.length || r.postZrusene.length);
const ine = [...new Set(vysledky.flatMap((r) => r.ine.map((u) => u.replace(/\?.*$/, ""))))].sort();
console.log("iné súbory úložiska (obsah adminu, nie kód; len informácia): " + ine.length + (ine.length ? "\n  " + ine.join("\n  ") : ""));
const vsetkyConfig = [...new Set(vysledky.flatMap((r) => r.config.map((u) => u.replace(/\?.*$/, ""))))].sort();
if (a.vystup) writeFileSync(a.vystup, JSON.stringify({ zdroj: a.zdroj, vysledky, configUnikatne: vsetkyConfig, ine }, null, 1));
console.log(zle.length ? "NESEDÍ: " + zle.length + " z " + vysledky.length + " stránok (požiadaviek na …/assets/config/ spolu " +
  vysledky.reduce((s, r) => s + r.config.length, 0) + ", unikátnych " + vsetkyConfig.length + ")" : "OK: " + vysledky.length + " stránok, 0 požiadaviek na …/user/documents/upload/assets/config/");
process.exit(zle.length ? 1 : 0);
