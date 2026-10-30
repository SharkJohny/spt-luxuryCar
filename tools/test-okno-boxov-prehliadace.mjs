// Okno boxov konfigurátora 1V (SK 598/601, CZ 2403/2406) v Chromium / WebKit / Firefox (Playwright) na živom webe
// s LOKÁLNYM buildom (luxuryCar.js + luxuryCar.css zostavené ako v CI, CSS zmenšené esbuildom s cieľmi CI) alebo
// s CDN verziou --zdroj <sha>. Admin sa nemení, POST do košíka sa nerobí (každý POST na /action/ okrem odmietnutia
// cookies sa zruší), merače a chat Luxia sú zablokované.
// Cesta ako zákazník: auto (Audi A6 2015 Combi) -> krok boxov -> karta „2 boxy“ -> farba -> M + M -> JEDNO ťuknutie
// (dotyk) / klik (myš) na „Potvrďte výber boxov“ -> okno zavreté, karta „2 boxy“ označená, súhrn „2× box · M + M · …“.
// Navyše: trieda lcd1v-bx--ios len na iPhone / iPade (WebKit s UA iPhone / iPad); na telefóne (do 720 px) okno sedí na
// spodku výrezu a päta má 20 px (Playwright nemá zbalenú lištu Safari = rozbalený stav, 909cc67 aj variant B rovnako);
// chyby konzoly našich domén, pády stránky. WebKit na Windows je najbližšie k Safari, nie skutočný iPhone.
// Playwright nie je v repe: --pw = file:/// adresa index.mjs Playwrightu s nainštalovanými prehliadačmi
// (30. 10. 2026: npx cache …/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs = 1.64.1).
//   node tools/test-okno-boxov-prehliadace.mjs --pw <file:///…/playwright/index.mjs> [--zdroj lokal|<sha>]
//     [--prehliadac chromium,webkit,firefox] [--produkt 598,601,2403,2406] [--sirka 390,768,1366,1920] [--out dir]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const PW = arg("pw", process.env.LCD_PLAYWRIGHT);
if (!PW) throw new Error("chýba --pw <file:///…/playwright/index.mjs> (alebo LCD_PLAYWRIGHT)");
const pw = await import(PW);
const ZDROJ = arg("zdroj", "lokal");
const OUT = resolve(arg("out", join(tmpdir(), "lcd-okno-boxov-prehliadace")));
mkdirSync(OUT, { recursive: true });
const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

const SK = "https://www.luxurycardesign.sk", CZ = "https://www.luxurycardesign.cz";
const PRODUKTY = {
  598: { url: SK + "/luxusne-autokoberce-dragonskin-diamond-line/", locale: "sk-SK" },
  601: { url: SK + "/luxusne-autokoberce-dragonskin-elite-diamond-line/", locale: "sk-SK" },
  2403: { url: CZ + "/luxusne-autokoberce-dragonskin-diamond-line/", locale: "cs-CZ" },
  2406: { url: CZ + "/luxusne-autokoberce-dragonskin-elite-diamond-line/", locale: "cs-CZ" },
};
const SIRKY = { 390: 844, 440: 956, 768: 1024, 1366: 657, 1920: 1080 };
const prehliadace = arg("prehliadac", "chromium,webkit,firefox").split(",");
const produkty = arg("produkt", Object.keys(PRODUKTY).join(",")).split(",");
const sirky = arg("sirka", "390,768,1366,1920").split(",").map(Number);
const AUTO = { znacka: "Audi", model: "A6", rok: "2015", typ: "Combi" };
const MERACE = /google-analytics\.com|googletagmanager\.com|doubleclick\.net|googleadservices\.com|google\.com\/(ccm|pagead)|facebook\.net|facebook\.com\/tr|connect\.facebook|tiktok|hotjar|clarity\.ms|bat\.bing\.com|heureka\.|c\.seznam\.cz|sklik|ecomail\.cz\/.*track|luxia-[^/]*\.rostiapp\.cz/i;
const F = "#product-detail-form";
const OKNO = F + " .upsale-Banner.lcd1v-kb .box-config";

// ------------------------------------------------------------------ build (rovnako ako tools/test-konfigurator-1v.mjs + CSS ako CI)
function spusti(cmd, args, { cwd = KOREN, env = process.env, shell = false, popis } = {}) {
  const r = shell
    ? spawnSync([cmd, ...args].map((x) => (/[\s"&|<>^]/.test(x) ? '"' + x.replace(/"/g, '\\"') + '"' : x)).join(" "), { cwd, env, encoding: "utf8", shell, maxBuffer: 64 << 20 })
    : spawnSync(cmd, args, { cwd, env, encoding: "utf8", maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error((popis || cmd) + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || ""));
  return r;
}
function verziaZLocku(meno) {
  try {
    const lock = readFileSync(join(KOREN, "yarn.lock"), "utf8");
    const m = new RegExp('^"?' + meno.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "@[^\\n]*:\\r?\\n\\s+version \"([^\"]+)\"", "m").exec(lock);
    return m ? m[1] : null;
  } catch { return null; }
}
/** Balíky z package.json, ktoré v node_modules repa nie sú — cache mimo repa (rovnaká ako test-konfigurator-1v.mjs). */
function balickyMimoRepa() {
  const pkg = JSON.parse(readFileSync(join(KOREN, "package.json"), "utf8"));
  const chyba = Object.keys(pkg.dependencies || {}).filter((n) => !existsSync(join(KOREN, "node_modules", n, "package.json")));
  if (!chyba.length) return null;
  const spec = chyba.map((n) => n + "@" + (verziaZLocku(n) || pkg.dependencies[n]));
  const dir = join(process.env.LOCALAPPDATA || tmpdir(), "lcd-1v-test", "balicky-" + spec.join(",").replace(/[^a-z0-9.,@-]/gi, "_").slice(0, 80));
  if (!chyba.every((n) => existsSync(join(dir, "node_modules", n, "package.json")))) {
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, "package.json"))) writeFileSync(join(dir, "package.json"), '{ "private": true }\n');
    spusti(process.platform === "win32" ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...spec], { cwd: dir, shell: process.platform === "win32", popis: "npm install (cache testu)" });
  }
  return join(dir, "node_modules");
}
function postav() {
  const tmp = mkdtempSync(join(tmpdir(), "lcd-okno-build-"));
  const ver = JSON.parse(readFileSync(join(KOREN, "node_modules/esbuild/package.json"), "utf8")).version;
  const win = process.platform === "win32";
  const np = balickyMimoRepa();
  const env = np ? { ...process.env, NODE_PATH: [np, process.env.NODE_PATH].filter(Boolean).join(delimiter) } : process.env;
  const esb = (args, popis) => spusti(win ? "npx.cmd" : "npx", ["--yes", "esbuild@" + ver, ...args], { cwd: tmp, env, shell: win, popis });
  // .github/workflows/production.yml: bundle a zmenšené CSS (--target CI)
  esb([join(KOREN, "assets/js/main.js"), "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"), "--format=iife", "--loader:.jsx=jsx", "--minify", "--drop:console", "--legal-comments=none", "--log-level=warning"], "esbuild luxuryCar.js");
  const py = ["python", "python3"].find((p) => spawnSync(p, ["--version"]).status === 0);
  spusti(py, ["tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], { popis: "vloz-lcd-css.py --vystup" });
  esb([join(tmp, "luxuryCar.css"), "--minify", "--target=chrome80,firefox78,safari13", "--outfile=" + join(tmp, "luxuryCar.min.css"), "--log-level=error"], "esbuild CSS --minify");
  return { popis: "lokálny build " + tmp, js: readFileSync(join(tmp, "luxuryCar.js")), css: readFileSync(join(tmp, "luxuryCar.min.css")) };
}
const build = ZDROJ === "lokal" ? postav() : /^[0-9a-f]{7,40}$/i.test(ZDROJ) ? { popis: "CDN verzia " + ZDROJ, sha: ZDROJ } : null;
if (!build) throw new Error("--zdroj lokal | <sha>");
console.log("Okno boxov v prehliadačoch — " + build.popis + "; prehliadače " + prehliadace.join(", ") + "; produkty " + produkty.join(", ") + "; šírky " + sirky.join(", "));

// ------------------------------------------------------------------ profil prehliadača
function profil(engine, w) {
  const D = pw.devices, dotyk = w <= 1024, mobil = w <= 440;
  const o = { viewport: { width: w, height: SIRKY[w] || 900 }, hasTouch: dotyk, deviceScaleFactor: mobil ? 3 : dotyk ? 2 : 1 };
  if (engine !== "firefox") o.isMobile = mobil; // Firefox isMobile nepodporuje
  if (engine === "webkit" && mobil) o.userAgent = D["iPhone 13"].userAgent;
  if (engine === "webkit" && dotyk && !mobil) o.userAgent = D["iPad Mini"].userAgent;
  if (engine === "chromium" && mobil) o.userAgent = D["Pixel 7"].userAgent;
  if (engine === "chromium" && dotyk && !mobil) o.userAgent = D["Galaxy Tab S4"].userAgent;
  return o;
}
const nasa = (u) => /^https?:\/\/([^/]*\.)?(luxurycardesign\.(sk|cz)|cdn\.myshoptet\.com)\//.test(u || "");

async function beh(B, engine, pid, w) {
  const P = PRODUKTY[pid], o = profil(engine, w), dotyk = o.hasTouch;
  const ios = engine === "webkit" && w <= 1024; // UA iPhone / iPad -> trieda lcd1v-bx--ios
  const ctx = await B.newContext({ ...o, locale: P.locale, serviceWorkers: "block" });
  const r = { engine, pid, w, vstup: dotyk ? "dotyk" : "myš", chyby: [], konzola: [], cudzie: [], podvrhnute: 0, zrusene: [] };
  await ctx.route(MERACE, (route) => route.abort());
  await ctx.route(/\/eshopy\/luxuryCar\/assets\/v\/[0-9a-z]+\/(js\/luxuryCar\.js|css\/luxuryCar\.css)/, async (route) => {
    const u = route.request().url(), css = /\/css\/luxuryCar\.css/.test(u);
    r.podvrhnute++;
    if (build.sha) return route.fulfill({ response: await route.fetch({ url: u.replace(/\/assets\/v\/[0-9a-z]+\//, "/assets/v/" + build.sha + "/") }) });
    return route.fulfill({ status: 200, body: css ? build.css : build.js, headers: { "Content-Type": css ? "text/css; charset=utf-8" : "application/javascript; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
  });
  await ctx.route(/\/action\//, (route) => {
    const q = route.request();
    if (q.method() !== "POST" || /CustomerCookieConsent/.test(q.url())) return route.continue();
    r.zrusene.push(q.url().slice(0, 120));
    return route.abort();
  });
  const page = await ctx.newPage();
  // cudzia doména alebo merač, ktorý test sám zablokoval (Firefox hlási zrušený connect.facebook.net ako CORS bez adresy)
  const zapis = (t, u) => { if ((u && !nasa(u)) || MERACE.test(t)) return r.cudzie.push(t.slice(0, 140)); r.konzola.push(t.slice(0, 200) + (u ? " @" + u.slice(0, 100) : "")); };
  page.on("console", (m) => { if (m.type() === "error") zapis(m.text(), (m.location() || {}).url || ""); });
  page.on("pageerror", (e) => zapis("pageerror: " + e.message, ""));
  const tukni = async (loc) => { await loc.waitFor({ state: "visible", timeout: 15000 }); if (dotyk) await loc.tap({ timeout: 15000 }); else await loc.click({ timeout: 15000 }); };
  const t0 = Date.now();
  try {
    await page.goto(P.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction((f) => document.body.classList.contains("lcd-1v") && !!document.querySelector(f + " .lcd1v-krok.lcd1v-k-boxy"), F, { timeout: 45000 });
    const odm = page.locator("button, a").filter({ hasText: /^\s*(Odmietnu|Odmítnou)/i }).first();
    if (await odm.isVisible().catch(() => false)) { await odm.click().catch(() => {}); await pauza(400); }
    await pauza(1200);
    // auto (ako ovladac-kroky novy.vyberAuto): karta „Vaše auto“, natívne selecty
    const AUTO_K = F + " .lcd1v-krok.lcd1v-k-auto";
    if (!(await page.locator(AUTO_K + ".active").count())) await tukni(page.locator(AUTO_K + " > .lcd1v-hd"));
    const W = AUTO_K + " .modl-selector-wrap";
    await page.locator(W + " .brands select").selectOption({ label: AUTO.znacka });
    await page.waitForFunction((s) => document.querySelector(s).options.length > 1, W + " .models select", { timeout: 15000 });
    await page.locator(W + " .models select").selectOption({ label: AUTO.model });
    await page.locator(W + " .years select").selectOption({ label: AUTO.rok });
    await page.locator(W + " .type-selector select").selectOption({ label: AUTO.typ });
    await page.waitForFunction(() => { const k = document.querySelector(".lcd1v-kompat"); return !!(k && !k.hidden && k.offsetHeight > 0); }, null, { timeout: 25000 });
    await pauza(600);
    // krok boxov -> karta „2 boxy“
    const KARTA = F + ' .upsale-buttons.boxs .lcd1v-kb__karta[data-boxy="2"]';
    if (!(await page.locator(KARTA).isVisible())) {
      await page.evaluate((f) => { const h = document.querySelector(f + " .lcd1v-k-boxy > .lcd1v-hd"); if (h) h.click(); }, F);
      await pauza(900);
    }
    await tukni(page.locator(KARTA));
    await page.waitForFunction((s) => { const e = document.querySelector(s); return !!(e && e.closest(".upsale-Banner").classList.contains("showConf") && getComputedStyle(e).opacity === "1"); }, OKNO, { timeout: 10000 });
    await pauza(400);
    // farba (2. vzorka) a veľkosti M + M (ID parametrov a hodnôt zo živého formulára, CZ má iné)
    const id = await page.evaluate((f) => {
      const najdi = (re) => { const s = Array.prototype.find.call(document.querySelectorAll(f + " select[data-parameter-name]"), (x) => re.test((x.getAttribute("data-parameter-name") || "").trim())); return s ? s.getAttribute("data-parameter-id") : null; };
      const m = (pid) => { const s = document.querySelector(f + ' select[data-parameter-id="' + pid + '"]'); const o = s && Array.prototype.find.call(s.options, (x) => x.value && /^M\s*:/i.test(x.text.trim())); return o ? o.value : null; };
      const b1 = najdi(/\b1\.\s*box/i), b2 = najdi(/\b2\.\s*box/i);
      return { farba: najdi(/^(farba|barva)\s+box/i), b1, b2, m1: b1 && m(b1), m2: b2 && m(b2) };
    }, F);
    if (!id.farba || !id.m1 || !id.m2) throw new Error("parametre boxov vo formulári: " + JSON.stringify(id));
    await tukni(page.locator(OKNO + " .parameter-wrap.parameter-" + id.farba + " .option-button").nth(1));
    await page.waitForFunction(([f, p]) => !!(document.querySelector(f + ' select[data-parameter-id="' + p + '"]') || {}).value, [F, id.farba], { timeout: 10000 });
    for (const [p, v] of [[id.b1, id.m1], [id.b2, id.m2]]) {
      await tukni(page.locator(OKNO + ' .option-button[data-variant="' + p + '"][data-value="' + v + '"]'));
      await page.waitForFunction(([f, p, v]) => (document.querySelector(f + ' select[data-parameter-id="' + p + '"]') || {}).value === v, [F, p, v], { timeout: 10000 });
    }
    await pauza(500);
    const pred = await page.evaluate((s) => {
      const o = document.querySelector(s), b = o.querySelector(".lcd1v-bx__ok"), p = o.querySelector(".lcd1v-bx__pata");
      const ro = o.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return { ih: innerHeight, trieda: o.classList.contains("lcd1v-bx--ios"), oknoSpodok: Math.round(ro.bottom * 10) / 10, tlacSpodok: Math.round(rb.bottom * 10) / 10,
        pata: getComputedStyle(p).paddingBottom, bottom: getComputedStyle(o).bottom, radius: getComputedStyle(o).borderRadius };
    }, OKNO);
    r.okno = pred;
    if (pred.trieda !== ios) r.chyby.push("trieda lcd1v-bx--ios " + (pred.trieda ? "je" : "chýba") + " (čakám " + (ios ? "áno" : "nie") + ")");
    if (w <= 720) {
      if (Math.abs(pred.oknoSpodok - pred.ih) > 1) r.chyby.push("telefón: spodok okna " + pred.oknoSpodok + ", výrez " + pred.ih + " (rozbalená lišta / bez lišty = na spodku)");
      if (pred.pata !== "20px") r.chyby.push("telefón: päta " + pred.pata + " (čakám 20px)");
    }
    // JEDNO ťuknutie / klik na „Potvrďte výber boxov“
    await tukni(page.locator(OKNO + " .lcd1v-bx__ok"));
    let zavrete = false;
    for (let i = 0; i < 20 && !zavrete; i++) { await pauza(100); zavrete = await page.evaluate((f) => !document.querySelector(f + " .upsale-Banner").classList.contains("showConf"), F); }
    await pauza(500);
    const st = await page.evaluate((f) => { const k = document.querySelector(f + ' .upsale-buttons.boxs .lcd1v-kb__karta[aria-pressed="true"]'); return { vyber: document.querySelector(f + " .upsale-buttons.boxs").getAttribute("data-lcd1v-vyber"), karta: k ? k.getAttribute("data-boxy") : null }; }, F);
    r.vyber = st.vyber;
    if (!zavrete) r.chyby.push("okno ostalo otvorené po 1 ťuknutí / kliku na „Potvrďte výber boxov“");
    if (st.karta !== "2" || !/^2× box · M \+ M · /.test(st.vyber || "")) r.chyby.push("súhrn „" + st.vyber + "“, označená karta " + st.karta);
  } catch (e) {
    r.chyby.push("PÁD: " + e.message.split("\n")[0].slice(0, 200));
    await page.screenshot({ path: join(OUT, [engine, pid, w].join("-") + ".png") }).catch(() => {});
  }
  r.s = Math.round((Date.now() - t0) / 1000);
  if (!r.podvrhnute) r.chyby.push("build sa nepodvrhol (luxuryCar.js / .css z assets/v/<sha>/?)");
  if (r.zrusene.length) r.chyby.push("nečakaný POST: " + r.zrusene.slice(0, 2).join(" | "));
  if (r.konzola.length) r.chyby.push("konzola: " + r.konzola.slice(0, 3).join(" | "));
  await ctx.close();
  return r;
}

const vysledky = [];
for (const engine of prehliadace) {
  const B = await pw[engine].launch();
  for (const pid of produkty) for (const w of sirky) {
    let r = await beh(B, engine, pid, w);
    if (r.chyby.some((c) => /^PÁD/.test(c))) { const r2 = await beh(B, engine, pid, w); r2.opakovane = r.chyby; r = r2; } // živý web / súbežné behy: pád raz zopakovať
    vysledky.push(r);
    const ok = r.okno || {};
    console.log([r.chyby.length ? "ZLYHAL" : "OK    ", engine.padEnd(8), String(pid).padEnd(4), String(w).padEnd(4), r.vstup.padEnd(5), (r.s + " s").padEnd(5),
      "ios " + (ok.trieda ? "áno" : "nie"), "okno " + ok.oknoSpodok + "/" + ok.ih, "päta " + ok.pata, "„" + (r.vyber || "") + "“", r.opakovane ? "(2. pokus)" : ""].join("  "));
    for (const c of r.chyby) console.log("        ✗ " + c);
  }
  await B.close();
}
writeFileSync(join(OUT, "vysledky-" + prehliadace.join("_") + ".json"), JSON.stringify({ zdroj: build.popis, vysledky }, null, 1));
const zl = vysledky.filter((r) => r.chyby.length).length;
console.log("Spolu: " + (vysledky.length - zl) + " OK, " + zl + " zlyhalo (" + build.popis + ")");
process.exit(zl ? 1 : 0);
