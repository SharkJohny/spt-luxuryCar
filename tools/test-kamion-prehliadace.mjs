// Kamióny 1V (SK 640, CZ 2452) v Chromium / WebKit / Firefox (Playwright) na živom webe s CDN verziou --sha
// (assets/v/<živý>/ -> assets/v/<sha>/ len v tomto prehliadači, admin sa nemení). Skutočné ťuknutia (dotyk) / kliky (myš),
// celý konfigurátor až po „do košíka“ (POST /action/Cart/addCartItem zachytený a zrušený; pri --kosik pustený a overený
// košík v jednorazovom kontexte), obsah pod konfigurátorom, chyby konzoly, 4xx/5xx, vodorovné pretečenie.
// Playwright nie je v repe: --pw = file:/// adresa index.mjs Playwrightu, ktorého prehliadače sú nainštalované
// (29. 10. 2026: npx cache …/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs = 1.64.1, WebKit 27.2, Firefox 157).
// WebKit na Windows je najbližšie k Safari, nie skutočný iPhone. Zachytený POST do košíka sa ruší; pri --kosik sa pustí
// do jednorazového kontextu, iné POST na /action/ (napr. FacebookCAPI) test ruší, aby neposielal falošné nákupy do reklám.
// node tools/test-kamion-prehliadace.mjs --pw <file:///…/playwright/index.mjs> --sha <sha> [--prehliadac webkit] [--produkt 640] [--sirka 390] [--kosik] [--out dir]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const pw = await import(arg("pw"));
const SHA = arg("sha");
const OUT = arg("out", tmpdir() + "/lcd-kamion-prehliadace");
const KOSIK = process.argv.includes("--kosik");
mkdirSync(OUT, { recursive: true });
const MANIFEST = readFileSync(new URL("../assets/js/components/konfigurator1v/kamion/obrazky.js", import.meta.url), "utf8");
const KAMION_SUBORY = new Set([...MANIFEST.matchAll(/"(t[0-9a-f]+\.(?:png|jpg))":/g)].map((m) => m[1]));

const PRODUKTY = {
  640: { url: "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/", cz: false, locale: "sk-SK" },
  2452: { url: "https://www.luxurycardesign.cz/luxusni-autokoberce-kamiony/", cz: true, locale: "cs-CZ" },
};
const SIRKY = { 360: 780, 390: 844, 414: 896, 768: 1024, 1024: 768, 1280: 800, 1366: 657, 1920: 1080, 2560: 1440 };
const prehliadace = arg("prehliadac", "chromium,webkit,firefox").split(",");
const produkty = arg("produkt", "640,2452").split(",");
const sirky = arg("sirka", Object.keys(SIRKY).join(",")).split(",").map(Number);

function profil(engine, w) {
  const D = pw.devices, dotyk = w <= 1024, mobil = w <= 414;
  const o = { viewport: { width: w, height: SIRKY[w] || 900 }, hasTouch: dotyk, deviceScaleFactor: mobil ? 3 : dotyk ? 2 : 1 };
  if (engine !== "firefox") o.isMobile = mobil; // Firefox isMobile nepodporuje
  if (engine === "webkit" && mobil) o.userAgent = D["iPhone 13"].userAgent;
  if (engine === "webkit" && dotyk && !mobil) o.userAgent = D["iPad Mini"].userAgent;
  if (engine === "chromium" && mobil) o.userAgent = D["Pixel 7"].userAgent;
  if (engine === "chromium" && dotyk && !mobil) o.userAgent = D["Galaxy Tab S4"].userAgent;
  return o;
}
const nasa = (u) => /^https?:\/\/([^/]*\.)?(luxurycardesign\.(sk|cz)|cdn\.myshoptet\.com)\//.test(u || "");
const a_ = (akcia, v, m) => '[data-a="' + akcia + '"]' + (m ? '[data-m="' + m + '"]' : "") + (v != null ? '[data-v="' + v + '"]' : "");
const KROKY = [
  ["vyber", "znacka", "DAF (TIR)"], ["vyber", "model", "XF106 2017-2021"], ["dalej", "vozidlo"], ["obr", "mat"],
  ["klik", a_("mat", "Prémiová syntetická koža – prešívaná")], ["dalej", "material"], ["obr", "farba"],
  ["klik", a_("farba", "11")], ["nahlad"], ["dalej", "farba"], ["obr", "lem"],
  ["klik", a_("lem", "04")], ["dalej", "lemovanie"],
  ["klik", a_("nas", "boky+stred")], ["obr", "motiv"], ["klik", a_("motiv", "H19", "boky")], ["klik", a_("nit", "2999", "boky")], ["canvas"], ["klik", a_("potvrd", "boky")],
  ["klik", a_("stredRovnaky", "1")], ["klik", a_("tap", "ano")], ["klik", a_("tapRovnake")], ["klik", a_("tapNas", "nie")],
];
const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

async function beh(B, engine, pid, w, kosik) {
  const P = PRODUKTY[pid], o = profil(engine, w), dotyk = o.hasTouch;
  const ctx = await B.newContext({ ...o, locale: P.locale, serviceWorkers: "block" });
  const r = { engine, pid, w, vstup: dotyk ? "dotyk" : "myš", kosik, chyby: [], konzola: [], http: [], zlyhane: [], pretecenie: [], obrazky: [], storage: 0, podvrhnute: 0, posty: [] };
  await ctx.route(/\/eshopy\/luxuryCar\/assets\/v\/[0-9a-f]{7,40}\//, async (route) => {
    const u = route.request().url(), m = u.match(/\/assets\/v\/([0-9a-f]{7,40})\//);
    if (m[1] === SHA) { r.nazivo = (r.nazivo || 0) + 1; return route.continue(); } // --sha = verzia, ktorá už je naživo
    r.podvrhnute++;
    try { return route.fulfill({ response: await route.fetch({ url: u.replace(m[0], "/assets/v/" + SHA + "/") }) }); } catch (e) { r.chyby.push("podvrh " + e.message.slice(0, 80)); return route.abort(); }
  });
  await ctx.route(/\/action\//, (route) => {
    const q = route.request();
    if (q.method() !== "POST" || /CustomerCookieConsent/.test(q.url())) return route.continue(); // súhlas (odmietnutý) smie uložiť
    if (/Cart\/addCartItem/i.test(q.url())) { r.posty.push(q.postData() || ""); if (kosik) return route.continue(); }
    r.zrusene = (r.zrusene || []).concat(q.url().slice(0, 140));
    return route.abort();
  });
  const page = await ctx.newPage();
  r.faza = "cesta"; r.cudzie = [];
  // chyba z cudzej domény (Luxia, Google…) -> cudzie; po ZÁMERNE zrušenom POST do košíka (bez --kosik) -> artefakt testu
  const zapis = (t, u) => { if (u && !nasa(u)) return r.cudzie.push(t.slice(0, 160) + " @" + u.slice(0, 80)); if (r.faza === "po-kosiku" && !kosik) return; r.konzola.push(t.slice(0, 220) + (u ? " @" + u.slice(0, 120) : "")); };
  page.on("console", (m) => { if (m.type() === "error") zapis(m.text(), (m.location() || {}).url || ""); });
  page.on("pageerror", (e) => zapis("pageerror: " + e.message, ""));
  page.on("request", (q) => { const u = q.url(); if (/luxurycardesign\.cz\/user\/documents\/upload\/assets\/config\//.test(u) && KAMION_SUBORY.has(u.split("/").pop().split("?")[0])) r.storage++; });
  page.on("response", (s) => { if (s.status() >= 400 && nasa(s.url()) && !/\/action\//.test(s.url())) r.http.push(s.status() + " " + s.url().slice(0, 160)); });
  page.on("requestfailed", (q) => { const u = q.url(); if (nasa(u) && !/\/action\//.test(u)) r.zlyhane.push((q.failure() || {}).errorText + " " + u.slice(0, 160)); });
  const pretek = async (kde) => { const x = await page.evaluate(() => { const k = document.getElementById("lcd1v-kamion"); return { sw: document.documentElement.scrollWidth, iw: innerWidth, kr: k ? Math.round(k.getBoundingClientRect().right) : 0 }; }); if (x.sw > x.iw + 1 || x.kr > x.iw + 1) r.pretecenie.push(kde + " " + JSON.stringify(x)); };
  const t0 = Date.now();
  try {
    await page.goto(P.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.__lcd1vKamion && document.querySelector("#lcd1v-kamion select[data-p='znacka']"), null, { timeout: 45000 });
    // cookie lišta: najšetrnejšia voľba (odmietnuť / len nevyhnutné), ak je
    const odm = page.locator("button, a").filter({ hasText: /odmietnu|odmítnou|len nevyhnutn|pouze nezbytn|nevyhnutné|nezbytné/i }).first();
    if (await odm.isVisible().catch(() => false)) { await (dotyk ? odm.tap() : odm.click()).catch(() => {}); await pauza(400); }
    await pretek("štart");
    for (const k of KROKY) {
      if (k[0] === "obr") { // obrázky volieb aktuálneho kroku načítané (nie rozbité)
        const sel = k[1] === "motiv" ? '#lcd1v-kamion [data-a="motiv"] img' : '#lcd1v-kamion [data-a="' + k[1] + '"] img';
        let x = null;
        for (let i = 0; i < 60; i++) { x = await page.evaluate((s) => { const im = [...document.querySelectorAll(s)]; return { n: im.length, ok: im.filter((i) => i.complete && i.naturalWidth > 0).length, zle: im.filter((i) => i.complete && !i.naturalWidth).map((i) => i.currentSrc || i.src) }; }, sel); if (x.n && x.ok === x.n) break; await pauza(250); }
        r.obrazky.push(k[1] + " " + x.ok + "/" + x.n);
        if (!x.n || x.ok !== x.n) r.chyby.push("obrázky " + k[1] + " " + x.ok + "/" + x.n + " " + x.zle.slice(0, 3).join(" "));
        continue;
      }
      if (k[0] === "nahlad") {
        let ok = false; for (let i = 0; i < 40 && !ok; i++) { ok = await page.evaluate(() => { const i = document.querySelector("#lcd1v-kamion .k-nahlad-farby__img"); return !!i && i.complete && i.naturalWidth > 0; }); if (!ok) await pauza(150); }
        if (!ok) r.chyby.push("náhľad farby sa nenačítal");
        continue;
      }
      if (k[0] === "canvas") {
        let c = null; for (let i = 0; i < 30; i++) { c = await page.evaluate(() => { const cv = document.querySelector("#lcd1v-kamion canvas[data-motiv]"); if (!cv) return "chýba"; try { const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n > 50 ? "" : "prázdny"; } catch (e) { return "tainted " + e.message; } }); if (!c) break; await pauza(200); }
        if (c) r.chyby.push("náhľad nášivky (canvas): " + c);
        continue;
      }
      if (k[0] === "vyber") { await page.locator('#lcd1v-kamion select[data-p="' + k[1] + '"]').selectOption(k[2], { timeout: 15000 }); await pauza(250); continue; }
      const sel = "#lcd1v-kamion " + (k[0] === "dalej" ? '[data-a="dalej"][data-v="' + k[1] + '"]' : k[1]);
      const loc = page.locator(sel).first();
      await loc.waitFor({ state: "visible", timeout: 15000 });
      if (dotyk) await loc.tap({ timeout: 15000 }); else await loc.click({ timeout: 15000 });
      await pauza(350);
      if (k[0] === "dalej") await pretek("po " + k[1]);
    }
    await pauza(600);
    const st = await page.evaluate(() => { const k = window.__lcd1vKamion, s = document.querySelector("#lcd1v-kamion .k-suhrn__suma"); const ine = {}; document.querySelectorAll("#product-detail-form select.surcharge-parameter").forEach((x) => { if (x.value) ine[x.name || x.getAttribute("data-parameter-id")] = x.value; }); return { spolu: k.ui.cena().spolu, suma: s ? s.textContent.trim() : null, ine, poznamka: (sessionStorage.getItem("truckOrderSummary") || "").slice(0, 40) }; });
    r.spolu = st.spolu; r.suma = st.suma;
    await pretek("súhrn");
    const kos = page.locator("#lcd1v-kamion " + a_("kosik")).first();
    await kos.waitFor({ state: "visible", timeout: 15000 });
    r.faza = "po-kosiku";
    if (dotyk) await kos.tap(); else await kos.click();
    for (let i = 0; i < 40 && !r.posty.length; i++) await pauza(150);
    if (!r.posty.length) r.chyby.push("POST do košíka neodišiel");
    const pozn = await page.evaluate(() => (sessionStorage.getItem("truckOrderSummary") || "").slice(0, 40)).catch(() => "");
    if (!/^(ŠPECIFIKÁCIA|SPECIFIKACE) VOZIDLA/.test(pozn)) r.chyby.push("poznámka objednávky: " + pozn);
    else {
      const telo = new URLSearchParams(r.posty[0]);
      const chyba = Object.entries(st.ine).filter(([n, v]) => telo.get(n) !== v);
      if (chyba.length) r.chyby.push("POST nesedí so selectmi: " + JSON.stringify(chyba.slice(0, 3)));
      r.post = r.posty[0];
    }
    if (kosik) {
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await pauza(1500);
      if (!/\/kosik\//.test(page.url())) await page.goto(new URL("/kosik/", P.url).href, { waitUntil: "domcontentloaded" });
      await pauza(2500);
      const k = await page.evaluate(() => { const t = document.body.innerText; return { kamion: /kami[oó]n/i.test(t), riadky: document.querySelectorAll(".cart-table tr, .cart-item, [data-micro='cartItem']").length, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
      r.kosikStav = k;
      if (!k.kamion) r.chyby.push("košík: položka kamióna chýba");
      if (k.sw > k.iw + 1) r.pretecenie.push("košík " + JSON.stringify(k));
    } else {
      // obsah pod konfigurátorom (zákaznícky pohľad): prescrolovať celú stránku, potom rozbité obrázky z našich domén
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += Math.round((SIRKY[w] || 900) * 0.8)) { await page.mouse.wheel(0, Math.round((SIRKY[w] || 900) * 0.8)).catch(() => page.evaluate((yy) => scrollTo(0, yy), y)); await pauza(180); }
      await pauza(1500);
      const ob = await page.evaluate(() => { const im = [...document.querySelectorAll("img")].filter((i) => /luxurycardesign|myshoptet/.test(i.currentSrc || i.src)); return { n: im.length, zle: im.filter((i) => i.complete && !i.naturalWidth && (i.currentSrc || i.src)).map((i) => (i.currentSrc || i.src).slice(0, 140)), sekcie: document.querySelectorAll(".p-detail-inner [data-lcd-sekcia], #description section, .p1v-obsah section").length }; });
      r.obsah = ob.n + " obr., " + ob.sekcie + " sekcií";
      if (ob.zle.length) r.chyby.push("rozbité obrázky na stránke: " + ob.zle.slice(0, 4).join(" "));
      await pretek("koniec stránky");
    }
  } catch (e) { r.chyby.push("PÁD: " + e.message.split("\n")[0].slice(0, 200)); await page.screenshot({ path: OUT + "/" + [engine, pid, w, kosik ? "kosik" : "cesta"].join("-") + ".png" }).catch(() => {}); }
  r.s = Math.round((Date.now() - t0) / 1000);
  if (!r.podvrhnute && !r.nazivo) r.chyby.push("verzia " + SHA + " sa nepodvrhla ani nie je naživo");
  if (r.storage) r.chyby.push(r.storage + "× obrázok kamióna z CZ úložiska");
  if (r.http.length) r.chyby.push("HTTP: " + r.http.slice(0, 3).join(" | "));
  if (r.pretecenie.length) r.chyby.push("pretečenie: " + r.pretecenie.slice(0, 2).join(" | "));
  r.konzola = r.konzola.filter((k) => !/\/action\/FacebookCAPI\//.test(k)); // test ho sám ruší (vyššie)
  if (r.konzola.length) r.chyby.push("konzola: " + r.konzola.slice(0, 3).join(" | "));
  if (r.zlyhane.length) r.chyby.push("zlyhané požiadavky: " + r.zlyhane.slice(0, 3).join(" | "));
  await ctx.close();
  return r;
}

const vysledky = [];
for (const engine of prehliadace) {
  const B = await pw[engine].launch();
  for (const pid of produkty) {
    for (const w of sirky) {
      const r = await beh(B, engine, pid, w, false);
      vysledky.push(r);
      console.log([r.chyby.length ? "ZLYHAL" : "OK    ", engine.padEnd(8), pid, String(w).padEnd(4), r.vstup.padEnd(5), r.s + " s", r.suma || "", r.obrazky.join(","), r.obsah || "", r.cudzie.length ? "cudzie " + r.cudzie.length : ""].join("  "));
      for (const c of r.chyby) console.log("        ✗ " + c);
    }
    if (KOSIK) for (const w of [390, 1280]) {
      const r = await beh(B, engine, pid, w, true);
      vysledky.push(r);
      console.log([r.chyby.length ? "ZLYHAL" : "OK    ", engine.padEnd(8), pid, String(w).padEnd(4), "KOŠÍK", r.s + " s", r.suma || "", JSON.stringify(r.kosikStav || {}), r.cudzie.length ? "cudzie " + r.cudzie.length : ""].join("  "));
      for (const c of r.chyby) console.log("        ✗ " + c);
    }
  }
  await B.close();
}
writeFileSync(OUT + "/vysledky-" + prehliadace.join("_") + "-" + produkty.join("_") + ".json", JSON.stringify(vysledky, null, 1));
const zl = vysledky.filter((r) => r.chyby.length).length;
console.log("Spolu: " + (vysledky.length - zl) + " OK, " + zl + " zlyhalo");
process.exit(zl ? 1 : 0);
