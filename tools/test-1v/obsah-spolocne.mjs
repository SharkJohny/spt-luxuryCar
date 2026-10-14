// Spoločné pomôcky testu OBSAHU pod konfigurátorom 1V (tools/test-1v-obsah.mjs). ZÁKLAD (13. 10. 2026) — mení koordinátor.
// Build JS/CSS je prevzatý zo zmrazeného tools/test-konfigurator-1v.mjs (ten sa nemení): esbuild assets/js/main.js s
// prepínačmi ako .github/workflows/production.yml + CSS z tools/vloz-lcd-css.py --vystup; HTML adminu z
// tools/build-admin-html.mjs --vystup. Všetko do dočasného priečinka behu, repo ostane nezmenené.
//
// Stránka: živá SK 598. Dokument stránky sa zachytí (Fetch, fáza Response) a do HTML sa vloží dist obsahu:
//   miesto "paticka" (predvolené = TEST FÁZA): každý kus ako nový banner v pätičke (.custom-footer), presne ako ho
//                     vypíše Shoptet (stĺpec .custom-footer__bannerN > .banner > .banner-wrapper > span[data-ec-promo-id]);
//   miesto "popis"   (SPUSTENIE): kusy namiesto starého obsahu .basic-description (Popis produktu 598).
// Do každého koreňa sa pridá SONDA (img loading=lazy 1×1 na …/assets/img/1v/obsah/__sonda-N.png): bez flagu sa nesmie
// stiahnuť (skrytý blok nič nesťahuje), s flagom po posune na ňu áno (kontrola, že meranie požiadaviek funguje).
// Bezpečnosť ako zmrazený runner: POST /action/Cart/addCartItem sa ZRUŠÍ, iný POST na /action/ tiež (okrem odmietnutia
// cookies), merače zablokované, cookie lišta odmietnutá. Žiadna objednávka, žiadny admin, žiadne prihlásenie.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pauza } from "./cdp.mjs";

export const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/";
export const URL_598 = "https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line/";
export const SONDA = CDN + "img/1v/obsah/__sonda-";
export const MERACE = [
  "*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*",
  "*google.com/pagead*", "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*",
  "*clarity.ms*", "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*", "*ecomail.cz/*track*",
];
const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const TYP = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".gif": "image/gif", ".mp4": "video/mp4", ".woff2": "font/woff2", ".json": "application/json" };

// ------------------------------------------------------------------ build (prevzaté z test-konfigurator-1v.mjs)
function esbuild() {
  if (process.env.ESBUILD_BINARY_PATH && existsSync(process.env.ESBUILD_BINARY_PATH)) return { cmd: process.env.ESBUILD_BINARY_PATH, pred: [], shell: false };
  const plat = process.platform + "-" + process.arch;
  const bin = join(KOREN, "node_modules", "@esbuild", plat, process.platform === "win32" ? "esbuild.exe" : "bin/esbuild");
  if (existsSync(bin)) return { cmd: bin, pred: [], shell: false };
  const ver = JSON.parse(readFileSync(join(KOREN, "node_modules/esbuild/package.json"), "utf8")).version;
  return { cmd: process.platform === "win32" ? "npx.cmd" : "npx", pred: ["--yes", "esbuild@" + ver], shell: process.platform === "win32", mimoRepa: true };
}
function verziaZLocku(meno) {
  try {
    const lock = readFileSync(join(KOREN, "yarn.lock"), "utf8");
    const m = new RegExp('^"?' + meno.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "@[^\\n]*:\\r?\\n\\s+version \"([^\"]+)\"", "m").exec(lock);
    return m ? m[1] : null;
  } catch { return null; }
}
function chybajuceBalicky() {
  const pkg = JSON.parse(readFileSync(join(KOREN, "package.json"), "utf8"));
  const chyba = Object.keys(pkg.dependencies || {}).filter((n) => !existsSync(join(KOREN, "node_modules", n, "package.json")));
  if (!chyba.length) return null;
  const spec = chyba.map((n) => n + "@" + (verziaZLocku(n) || pkg.dependencies[n]));
  const kluc = spec.join(",").replace(/[^a-z0-9.,@-]/gi, "_").slice(0, 80);
  const dir = join(process.env.LOCALAPPDATA || tmpdir(), "lcd-1v-test", "balicky-" + kluc);
  if (!chyba.every((n) => existsSync(join(dir, "node_modules", n, "package.json")))) {
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, "package.json"))) writeFileSync(join(dir, "package.json"), '{ "private": true }\n');
    spusti(process.platform === "win32" ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...spec], { shell: process.platform === "win32", popis: "npm install (cache testu)", cwd: dir });
  }
  return join(dir, "node_modules");
}
function python() {
  const kandidati = [process.env.LCD_PYTHON && [process.env.LCD_PYTHON], ["python"], ["python3"], ["py", "-3"]].filter(Boolean);
  for (const k of kandidati) {
    const r = spawnSync(k[0], [...k.slice(1), "--version"], { encoding: "utf8" });
    if (r.status === 0) return k;
  }
  throw new Error("python nenájdený (nastav LCD_PYTHON)");
}
export function spusti(cmd, args, { shell = false, popis, cwd = KOREN, env, ticho = false } = {}) {
  const moznosti = { cwd, env: env || process.env, encoding: "utf8", shell, maxBuffer: 64 * 1024 * 1024 };
  const r = shell
    ? spawnSync([cmd, ...args].map((x) => (/[\s"&|<>^]/.test(x) ? '"' + x.replace(/"/g, '\\"') + '"' : x)).join(" "), moznosti)
    : spawnSync(cmd, args, moznosti);
  if (r.status !== 0 && !ticho) throw new Error((popis || cmd) + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || "") + (r.error ? String(r.error) : ""));
  return r;
}

/** Lokálny build: { js, css, admin: { casti: [{cast, html, sekcie}], manifest }, tmp, popis }. */
export function priprav({ bezDrop = false } = {}) {
  const tmp = mkdtempSync(join(tmpdir(), "lcd-1v-obsah-"));
  const t0 = Date.now();
  // HTML adminu (kontroly build-admin-html; chyba = test hneď končí, obsah by v admine neprešiel)
  const adm = spusti(process.execPath, ["tools/build-admin-html.mjs", "--vystup", join(tmp, "admin")], { popis: "build-admin-html --vystup", ticho: true });
  if (adm.status !== 0) throw new Error("tools/build-admin-html.mjs hlási chyby (obsah by do adminu neprešiel):\n" + (adm.stdout || "").split("\n").filter((r) => /CHYBA|✗|POZOR/.test(r)).join("\n"));
  const manifest = JSON.parse(readFileSync(join(tmp, "admin", "manifest.json"), "utf8"));
  const casti = manifest.casti.filter((c) => /^p1v-598-\d+$/.test(c.cast) && c.web === "sk")
    .sort((a, b) => a.cast.localeCompare(b.cast, "en", { numeric: true }))
    .map((c) => ({ cast: c.cast, html: readFileSync(join(tmp, "admin", c.subor), "utf8"), sekcie: c.sekcie || [], znaky: c.znaky, hash: c.hash }));
  if (!casti.length) throw new Error("manifest nemá časti p1v-598-* (admin-html/ciele.json)");
  // JS + CSS (kroky CI pred esbuildom ako zmrazený runner)
  const tk = join(KOREN, "assets/js/truck-konfigurator");
  const gen = ["konfigurator.gen.jsx", "konfigurator.phone.gen.jsx"].map((f) => join(tk, f));
  const zdroje = ["konfigurator.jsx", "konfigurator.phone.jsx"].map((f) => join(tk, f));
  const mtime = (f) => { try { return statSync(f).mtimeMs; } catch { return 0; } };
  if (gen.some((g, i) => mtime(g) < mtime(zdroje[i]))) spusti(process.execPath, ["truck/build-truck-images.mjs"], { popis: "truck/build-truck-images.mjs" });
  const nodePath = chybajuceBalicky();
  const e = esbuild();
  const prep = [join(KOREN, "assets/js/main.js"), "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"), "--format=iife", "--loader:.jsx=jsx", "--minify", "--legal-comments=none", "--log-level=warning"];
  if (!bezDrop) prep.push("--drop:console");
  const env = nodePath ? { ...process.env, NODE_PATH: [nodePath, process.env.NODE_PATH].filter(Boolean).join(delimiter) } : process.env;
  spusti(e.cmd, [...e.pred, ...prep], { shell: e.shell, popis: "esbuild", cwd: e.mimoRepa ? tmp : KOREN, env });
  const py = python();
  spusti(py[0], [...py.slice(1), "tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], { popis: "vloz-lcd-css.py --vystup" });
  const js = readFileSync(join(tmp, "luxuryCar.js")), css = readFileSync(join(tmp, "luxuryCar.css"));
  return {
    js, css, tmp, admin: { casti, manifest },
    popis: `lokálny build (${(js.length / 1024).toFixed(0)} kB JS, ${(css.length / 1024).toFixed(0)} kB CSS, obsah ${casti.map((c) => c.cast + " " + c.znaky + " zn.").join(", ")}, ${((Date.now() - t0) / 1000).toFixed(1)} s) v ${tmp}`,
  };
}

/** Adresy médií v HTML obsahu (src, data-src, poster, data-poster, srcset, url()) — bez flagu sa nesmie stiahnuť ani jedna. */
export function adresyMedii(html) {
  const out = new Set();
  const pridaj = (u) => { u = String(u || "").trim().replace(/&amp;/g, "&"); if (u && !/^(data:|#|mailto:|tel:|javascript:)/i.test(u)) out.add(u.split("#")[0]); };
  for (const m of html.matchAll(/\s(?:src|data-src|poster|data-poster)\s*=\s*"([^"]*)"/gi)) pridaj(m[1]);
  for (const m of html.matchAll(/\s(?:srcset|data-srcset)\s*=\s*"([^"]*)"/gi)) m[1].split(",").forEach((x) => pridaj(x.trim().split(/\s+/)[0]));
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) pridaj(m[1]);
  for (const m of html.matchAll(/\shref\s*=\s*"([^"]*\.(?:mp4|webm|jpe?g|png|webp|avif))"/gi)) pridaj(m[1]);
  return [...out];
}

/** index konca prvku <div …> začínajúceho na indexe zac (za jeho </div>) */
function koniecDiv(html, zac) {
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = zac + 4;
  let hlbka = 1, m;
  while ((m = re.exec(html))) {
    hlbka += m[0].toLowerCase() === "</div>" ? -1 : 1;
    if (!hlbka) return m.index + m[0].length;
  }
  return -1;
}

/** Sonda do koreňa (pred jeho posledné </div>) */
function sSondou(cast, n) {
  const i = cast.lastIndexOf("</div>");
  return cast.slice(0, i) + `<img class="p1v-sonda" src="${SONDA}${n}.png" alt="" width="1" height="1" loading="lazy">` + cast.slice(i);
}

/** Vloží kusy obsahu do HTML živej stránky. Vráti { html, ok, popis }. */
export function vlozObsah(html, casti, miesto) {
  const kusy = casti.map((c, i) => sSondou(c.html, i + 1));
  if (miesto === "popis") {
    const zac = html.indexOf('<div class="basic-description">');
    if (zac < 0) return { html, ok: false, popis: "na stránke nie je .basic-description" };
    const kon = koniecDiv(html, zac);
    const h3 = html.indexOf("</h3>", zac);
    const odkial = h3 > zac && h3 < kon ? h3 + 5 : html.indexOf(">", zac) + 1;
    return { html: html.slice(0, odkial) + "\n" + kusy.join("\n") + "\n</div>" + html.slice(kon), ok: true, popis: "Popis produktu (starý obsah nahradený)" };
  }
  const m = /<div class="custom-footer elements-(\d+)">/.exec(html);
  if (!m) return { html, ok: false, popis: "na stránke nie je .custom-footer" };
  const kon = koniecDiv(html, m.index);
  const stlpce = kusy.map((k, i) => `\n<div class="custom-footer__banner${90 + i} ">\n<div class="banner">\n<div class="banner-wrapper">\n<span data-ec-promo-id="${990 + i}">${k}</span>\n</div>\n</div>\n</div>\n`).join("");
  const vnutro = html.slice(m.index, kon - 6).replace(`elements-${m[1]}`, `elements-${Number(m[1]) + kusy.length}`);
  return { html: html.slice(0, m.index) + vnutro + stlpce + "</div>" + html.slice(kon), ok: true, popis: `pätička (${kusy.length} nové bannery ako v Shoptete)` };
}

/** Nová karta: bundle/CSS z buildu, obrázky 1V lokálne, sonda, (voliteľne) vloženie obsahu do dokumentu 598, log požiadaviek. */
export async function novaStranka(ch, sirka, build, { vlozit = true, miesto = "paticka", log = () => {} } = {}) {
  const k = await ch.novaKarta({ sirka });
  const s = { k, sirka, posty: [], inePosty: [], poziadavky: [], vlozene: null };
  await k.posli("Network.setBlockedURLs", { urls: MERACE });
  await k.posli("Network.setCacheDisabled", { cacheDisabled: true });
  k.na("Network.requestWillBeSent", (p) => s.poziadavky.push(p.request.url));
  const odpovedz = (p, body, typ) => k.posli("Fetch.fulfillRequest", {
    requestId: p.requestId, responseCode: 200, body: Buffer.from(body).toString("base64"),
    responseHeaders: [{ name: "Content-Type", value: typ }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Cache-Control", value: "no-store" }],
  });
  k.na("Fetch.requestPaused", async (p) => {
    const u = p.request.url;
    try {
      if (p.responseStatusCode !== undefined || p.responseErrorReason) {
        // dokument 598 (fáza Response): vlož obsah
        if (vlozit && p.resourceType === "Document" && p.responseStatusCode === 200) {
          const telo = await k.posli("Fetch.getResponseBody", { requestId: p.requestId });
          const html = telo.base64Encoded ? Buffer.from(telo.body, "base64").toString("utf8") : telo.body;
          const v = vlozObsah(html, build.admin.casti, miesto);
          s.vlozene = v;
          const hlavicky = (p.responseHeaders || []).filter((h) => !/^(content-length|content-encoding|transfer-encoding)$/i.test(h.name));
          return await k.posli("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, responseHeaders: hlavicky, body: Buffer.from(v.html, "utf8").toString("base64") });
        }
        return await k.posli("Fetch.continueRequest", { requestId: p.requestId });
      }
      if (/\/action\//i.test(u)) {
        if (/\/action\/Cart\/addCartItem/i.test(u)) {
          s.posty.push(u);
          return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        }
        if (p.request.method !== "GET" && !/\/action\/CustomerCookieConsent\//i.test(u)) {
          s.inePosty.push(p.request.method + " " + u);
          return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        }
      } else if (u.indexOf(SONDA) === 0) {
        return await odpovedz(p, PNG_1x1, "image/png");
      } else if (/\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?js\/luxuryCar\.js(\?|$)/.test(u)) {
        return await odpovedz(p, build.js, "application/javascript; charset=utf-8");
      } else if (/\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?css\/luxuryCar\.css(\?|$)/.test(u)) {
        return await odpovedz(p, build.css, "text/css; charset=utf-8");
      } else {
        const m = /\/eshopy\/luxuryCar\/assets\/img\/1v\/([^?#]+)/.exec(u);
        const subor = m && join(KOREN, "assets/img/1v", decodeURIComponent(m[1]));
        if (subor && existsSync(subor)) return await odpovedz(p, readFileSync(subor), TYP[extname(subor).toLowerCase()] || "application/octet-stream");
      }
      await k.posli("Fetch.continueRequest", { requestId: p.requestId });
    } catch (e) { log("fetch " + u.slice(0, 80) + ": " + e.message); }
  });
  await k.posli("Fetch.enable", { patterns: [
    { urlPattern: "*/eshopy/luxuryCar/assets/*", requestStage: "Request" },
    { urlPattern: "*/action/*", requestStage: "Request" },
    { urlPattern: "*luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line*", resourceType: "Document", requestStage: "Response" },
  ] });
  return s;
}

/** Otvorí 598 (s ?novy=1 alebo bez), odmietne cookies, počká na konfigurátor a ustálenie. */
export async function otvor598(s, { novy = false, url = URL_598 } = {}) {
  const ciel = novy ? url + (url.includes("?") ? "&" : "?") + "novy=1" : url;
  await s.k.posli("Page.bringToFront").catch(() => {});
  await s.k.chod(ciel);
  for (let i = 0; i < 30; i++) {
    const r = await s.k.ev(`(function () {
      var b = Array.prototype.find.call(document.querySelectorAll(".siteCookies button, .siteCookies a, button, a"), function (e) { return e.offsetParent && /^\\s*(Odmietnu|Odmítnou)/i.test(e.textContent || ""); });
      if (b) { b.click(); return "odmietnuté"; }
      return document.querySelector(".siteCookies") && document.querySelector(".siteCookies").offsetHeight ? "" : "bez lišty";
    })()`).catch(() => "");
    if (r) break;
    await pauza(250);
  }
  const start = Date.now();
  while (Date.now() - start < 30000) {
    const ok = await s.k.ev(`!!(function () { var f = document.getElementById("product-detail-form"); return f && f.querySelector(".content-wrap .wheel-Position") && f.querySelector(".content-wrap .next-step-button"); })()`).catch(() => false);
    if (ok) break;
    await pauza(250);
  }
  await pauza(2500); // configurator-enhance, moduly 1V, widgety starého popisu (recenzie, videá)
}

export { pauza };
