#!/usr/bin/env node
// Ďakovná stránka (assets/js/opc/dakujeme.js, návrh 4) v Chromium / WebKit / Firefox (Playwright), offline: každá
// požiadavka ide zo súborov — REKONŠTRUKCIA ďakovnej stránky (tools/test-opc/dakujeme-fixtures.mjs) v obale zachyteného
// kroku 2 (fixtures/<web>/krok2.html, mimo gitu), náš bundle a CSS z lokálneho buildu (tools/test-opc/build.mjs),
// statické súbory Shoptetu z fixtures/cdn, tretie strany zablokované. Do Shoptetu neodíde nič.
// Playwright nie je v repe: --pw = file:/// adresa index.mjs (30. 10. 2026: npx cache …/_npx/e41f203b7505f1fb/
// node_modules/playwright/index.mjs = 1.64.1) alebo premenná LCD_PLAYWRIGHT. WebKit na Windows ≈ Safari, nie iPhone.
//
//   node tools/test-opc-dakujeme-prehliadace.mjs --pw <file:///…/playwright/index.mjs> [--out <priečinok>]
//        [--profil webkit-390,chromium-1366,firefox-1366] [--varianty cz-prevod,cz-karta-ok,…]
//
// Pre každý profil: bez kódu stránka Shoptetu bez zmeny (žiadny blok, trieda, záznam, požiadavka navyše); s kódom pre každý
// variant stav a hodnoty (karta bez jednoznačného výsledku, napr. zaplatené alebo čaká = pôvodná stránka viditeľná), Kopírovať skutočným klikom (Clipboard API alebo záloha), nič nepreteká 320–1920 px, písmo
// (text ≥ 16, poznámky ≥ 14, štítky ≥ 12 px), jedno zelené hlavné tlačidlo, žiadne zakázané slová, snímka celej stránky
// <out>/<profil>-<variant>.png. Exit 1 pri zlyhaní.
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { tmpdir } from "node:os";
import { pripravBuild, KOREN } from "./test-opc/build.mjs";
import { cdnSubor, WEBY } from "./test-opc/podvrh.mjs";
import { FIXTURES, vyzadujFixtures } from "./test-opc/zachytene.mjs";
import { stranka, VARIANTY, ocakavane, CESTY } from "./test-opc/dakujeme-fixtures.mjs";
import { KOD } from "../assets/js/opc/index.js";

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const PW = arg("pw", process.env.LCD_PLAYWRIGHT);
if (!PW) { console.error("chýba --pw <file:///…/playwright/index.mjs> (alebo LCD_PLAYWRIGHT)"); process.exit(2); }
vyzadujFixtures(["sk", "cz"]);
const pw = await import(PW);
const OUT = arg("out", join(tmpdir(), "lcd-opc-dakujeme-prehliadace"));
mkdirSync(OUT, { recursive: true });
const PROFILY = arg("profil", "webkit-390,chromium-1366,firefox-1366").split(",");
// + matica platieb (31. 10. 2026): rýchla platba cez banku pred bránou a po návrate, Apple Pay / Google Pay po návrate
const VAR = arg("varianty", "cz-prevod,cz-karta-ok,cz-karta-nie,cz-karta-form,cz-karta-caka,cz-dobierka,sk-prevod,sk-karta-ok,sk-karta-nie,sk-dobierka,sk-kamion,sk-vzorky,sk-pis-pred,sk-pis-nie,sk-pis-caka-banka,sk-apple-nie,cz-google-nie").split(",");
const SIRKY = [320, 360, 390, 414, 768, 1024, 1280, 1366, 1920];
const ZAKAZANE = /z[aá]loh|21\s*[–-]\s*29|\bdn[ií]\b|dodan|dodán|vyr[aá]b|\bDPH\b|z[aá]ruk|IBAN|na milimet/i;
const TYP = { ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

const build = pripravBuild();
console.log("Ďakovná stránka v prehliadačoch — " + build.popis + "\n  profily: " + PROFILY.join(", ") + "\n  varianty: " + VAR.join(", ") + "\n  snímky: " + OUT);

function profil(meno) {
  const [engine, w] = meno.split("-");
  const s = Number(w), mobil = s < 768, D = pw.devices;
  const o = { viewport: { width: s, height: mobil ? 844 : 768 }, deviceScaleFactor: mobil ? 2 : 1, hasTouch: mobil, locale: "sk-SK", serviceWorkers: "block" };
  if (engine !== "firefox") o.isMobile = mobil;
  if (engine === "webkit" && mobil) o.userAgent = D["iPhone 13"].userAgent;
  if (engine === "chromium" && mobil) o.userAgent = D["Pixel 7"].userAgent;
  return { engine, sirka: s, mobil, o };
}

/** Smerovač jednej stránky: zapisuje požiadavky, odpovedá zo súborov. */
async function smeruj(page, stav) {
  await page.route("**/*", async (route) => {
    const rq = route.request();
    let u;
    try { u = new URL(rq.url()); } catch { return route.abort(); }
    const odpoved = (status, telo, typ) => route.fulfill({ status, body: telo == null ? "" : telo, headers: { "Content-Type": typ, "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } });
    if (/^www\.luxurycardesign\.(sk|cz)$/.test(u.hostname)) {
      const z = { metoda: rq.method(), cesta: u.pathname, typ: rq.resourceType() };
      stav.www.push(z);
      if (rq.method() === "GET" && /^\/(user|cms)\//.test(u.pathname)) { z.staticke = true; const k = cdnSubor(u); return k ? odpoved(200, k.telo, k.typ) : odpoved(404, "", "text/plain"); }
      if (rq.method() === "GET" && /^\/objednavka\/d[ae]kujeme\/?$/.test(u.pathname)) {
        let h = stranka(stav.kluc, readFileSync(join(FIXTURES, VARIANTY[stav.kluc].web, "krok2.html"), "utf8"));
        if (stav.mobil) h = h.replace(/<body class="desktop /, '<body class="mobile ');
        return odpoved(200, h, "text/html; charset=utf-8");
      }
      if (rq.method() === "POST" && /^\/action\/CustomerCookieConsent\/?$/i.test(u.pathname)) { z.cookies = true; return odpoved(200, '{"code":200,"message":null,"messages":[],"payload":[]}', TYP[".json"]); }
      if (rq.method() === "GET" && /^\/action\/ShoptetPayPaymentData\//i.test(u.pathname)) { z.shoptetpay = true; return odpoved(200, '{"isHealthy":true}', TYP[".json"]); }
      stav.necakane.push(rq.method() + " " + u.pathname);
      return odpoved(404, "TEST: nečakaná požiadavka", "text/plain");
    }
    if (u.hostname === "cdn.myshoptet.com") {
      const nas = /\/usr\/shoptet\.jankucera\.work\/user\/documents\/eshopy\/luxuryCar\/assets\/(?:v\/[^/]+\/)?(.+)$/.exec(u.pathname);
      if (nas) {
        const rel = nas[1];
        if (rel === "js/luxuryCar.js") { stav.bundle++; return odpoved(200, build.js, TYP[".js"]); }
        if (rel === "css/luxuryCar.css") return odpoved(200, build.css, TYP[".css"]);
        const cast = /^js\/(lcd-[a-z0-9-]+\.js)$/.exec(rel);
        if (cast && build.casti[cast[1]]) return odpoved(200, build.casti[cast[1]], TYP[".js"]);
        const subor = join(KOREN, "assets", decodeURIComponent(rel));
        if (existsSync(subor)) return odpoved(200, readFileSync(subor), TYP[extname(subor).toLowerCase()] || "application/octet-stream");
        return odpoved(404, "", "text/plain");
      }
      if (/\/user\/documents\/upload\/data\.json$/.test(u.pathname)) { stav.dataJson++; return odpoved(200, readFileSync(join(FIXTURES, "data.json")), TYP[".json"]); }
      if (/^\/usr\/(shoptet\.jankucera\.work\/user\/documents\/api\/|webotvurci\.myshoptet\.com\/|apollo\.jakubtursky\.sk\/)/.test(u.pathname)) return route.abort("blockedbyclient");
      const k = cdnSubor(u);
      return k ? odpoved(200, k.telo, k.typ) : odpoved(404, "", "text/plain");
    }
    return route.abort("blockedbyclient");
  });
}

const STOPA = `(() => {
  const cw = document.getElementById("content-wrapper"), cs = cw ? getComputedStyle(cw) : null;
  let z = null; try { z = localStorage.getItem("lcdOpcDakujemeZaznam"); } catch (e) {}
  return { stav: window.__lcdOpc ? window.__lcdOpc.stav : null, globalne: typeof window.__lcdOpc !== "undefined",
    prvky: document.querySelectorAll('[id^="lcd-dak"], [class*="lcd-dak"], [class*="lcd-opc"]').length,
    triedy: document.documentElement.className.split(/\\s+/).filter((c) => /opc|dak/i.test(c)), zaznam: z,
    povodnyViditelny: !!(cw && cs.display !== "none" && cs.visibility === "visible" && cw.getBoundingClientRect().height > 50) };
})()`;
const KONTROLA_ROZLOZENIA = `(() => {
  const b = document.getElementById("lcd-dakujeme"), W = document.documentElement.clientWidth, zle = [];
  if (document.documentElement.scrollWidth > W + 1) zle.push("stránka " + document.documentElement.scrollWidth + " > " + W);
  b.querySelectorAll("*").forEach((e) => {
    const r = e.getBoundingClientRect(); if (!r.width) return;
    if (r.right > W + 0.5 || r.left < -0.5) zle.push(String(e.className && e.className.baseVal === undefined ? e.className : e.tagName) + " " + Math.round(r.left) + "–" + Math.round(r.right));
    if (!Array.prototype.some.call(e.childNodes, (x) => x.nodeType === 3 && /\\S/.test(x.nodeValue))) return;
    const fs = parseFloat(getComputedStyle(e).fontSize), c = (e.className || "") + " " + (e.parentNode.className || "");
    const min = /hero__cislo|platba__stitok|osa__bod/.test(c) || e.tagName === "EM" ? 12 : /udaj__n|platba__navod|polozka__cena|lcd-rozpis|kopia|qr__text/.test(c) || e.tagName === "SMALL" ? 14 : 16;
    if (fs < min) zle.push("písmo " + fs + " < " + min + ": " + e.textContent.trim().slice(0, 30));
  });
  // pečať v páse nesmie zájsť pod logo hlavičky (logo Shoptetu presahuje pod lištu hlavičky)
  const p = b.querySelector(".lcd-dak-pecat").getBoundingClientRect();
  const logo = Array.prototype.map.call(document.querySelectorAll("#header img, #header .site-name"), (e) => e.getBoundingClientRect()).filter((r) => r.width && r.height).reduce((m, r) => Math.max(m, r.bottom), 0);
  if (p.top - logo < 8) zle.push("pečať " + Math.round(p.top) + " pod logom " + Math.round(logo));
  return zle.slice(0, 6);
})()`;

let ok = 0, zle = 0;
const vysledok = (popis, chyba) => {
  if (chyba) { zle++; console.log("ZLYHAL  " + popis + " — " + chyba); } else { ok++; console.log("OK      " + popis); }
};

for (const meno of PROFILY) {
  const P = profil(meno);
  const B = await pw[P.engine].launch();
  try {
    // 1) bez kódu: stránka Shoptetu bez zmeny
    for (const kluc of ["cz-prevod", "sk-karta-nie"]) {
      const ctx = await B.newContext(P.o);
      const page = await ctx.newPage();
      const stav = { kluc, mobil: P.mobil, www: [], necakane: [], bundle: 0, dataJson: 0 };
      await smeruj(page, stav);
      let chyba = null;
      try {
        const o0 = ocakavane(kluc); // sk-karta-nie = návrat z brány (?autoredir=off) + ?opc=1 (nie kód)
        await page.goto(WEBY[o0.web].base + o0.adresa + (kluc === "sk-karta-nie" ? (o0.navrat ? "&" : "?") + "opc=1" : ""), { waitUntil: "load", timeout: 45000 });
        await page.waitForFunction(() => performance.getEntriesByType("resource").some((e) => /\/upload\/data\.json/.test(e.name)), null, { timeout: 20000 });
        await page.waitForTimeout(1200);
        const st = await page.evaluate(STOPA);
        const www = stav.www.filter((z) => !z.staticke);
        if (st.globalne || st.prvky || st.triedy.length || st.zaznam !== null) chyba = "modul niečo spravil: " + JSON.stringify(st);
        else if (!st.povodnyViditelny) chyba = "pôvodný obsah nie je viditeľný";
        else if (!stav.bundle || !stav.dataJson) chyba = "bundle/data.json sa nenačítal";
        else if (www.length !== 1 || stav.necakane.length) chyba = "požiadavky navyše: " + www.map((z) => z.metoda + " " + z.cesta).join(", ") + " " + stav.necakane.join(", ");
      } catch (e) { chyba = String(e && e.message || e).split("\n")[0]; }
      vysledok(meno + " bez kódu " + kluc, chyba);
      await ctx.close();
    }
    // 2) s kódom: každý variant
    for (const kluc of VAR) {
      const o = ocakavane(kluc), w = VARIANTY[kluc].web;
      const ctx = await B.newContext(P.o);
      const page = await ctx.newPage();
      const chybyKonzoly = [];
      page.on("pageerror", (e) => { if (/lcd|dakujeme|luxuryCar/i.test(String(e.stack || e.message))) chybyKonzoly.push(String(e.message)); });
      const stav = { kluc, mobil: P.mobil, www: [], necakane: [], bundle: 0, dataJson: 0 };
      await smeruj(page, stav);
      let chyba = null;
      try {
        // návrat z brány (navrat): /…/dakujeme|dekujeme/?autoredir=off, kód OPC za ním
        await page.goto(WEBY[w].base + o.adresa + (o.navrat ? "&" : "?") + "opc=" + KOD, { waitUntil: "load", timeout: 45000 });
        await page.waitForFunction(() => window.__lcdOpc && /^dakujeme-/.test(window.__lcdOpc.stav), null, { timeout: 20000 });
        const st = await page.evaluate(STOPA);
        if (o.povodna) {
          // revízia 31. 10.: výsledok platby kartou nie je jednoznačný -> stránka Shoptetu bez zmeny (len záznam s dôvodom)
          if (st.stav !== "dakujeme-povodna" || !st.povodnyViditelny || st.triedy.length) throw new Error("pôvodná stránka: " + JSON.stringify(st));
          if (await page.evaluate(() => !!document.getElementById("lcd-dakujeme"))) throw new Error("blok sa postavil");
          await page.evaluate(() => { const b = Array.prototype.find.call(document.querySelectorAll(".siteCookies button, .siteCookies a"), (e) => e.offsetParent && /^\s*(Odmietnu|Odmítnou)/i.test(e.textContent || "")); if (b) b.click(); });
          await page.waitForTimeout(300);
          await page.screenshot({ path: join(OUT, meno + "-" + kluc + ".png"), fullPage: true });
          if (stav.necakane.length) throw new Error("nečakané požiadavky: " + stav.necakane.join(", "));
          if (chybyKonzoly.length) throw new Error("chyby nášho kódu: " + chybyKonzoly.join("; "));
          vysledok(meno + " s kódom " + kluc + " (pôvodná stránka)", null);
          await ctx.close();
          continue;
        }
        if (st.stav !== "dakujeme-" + o.stav) throw new Error("stav " + st.stav + " ≠ dakujeme-" + o.stav);
        if (st.povodnyViditelny) throw new Error("pôvodný obsah ostal viditeľný");
        const h = await page.evaluate(() => [".lcd-dak-hero__cislo", ".lcd-dak-platba__suma", ".lcd-dak-suhrn__spolu span:last-child"].map((s) => { const e = document.querySelector("#lcd-dakujeme " + s); return e ? e.textContent.replace(/[\s ]+/g, " ").trim() : null; }));
        const n = (x) => String(x).replace(/[\s ]+/g, " ").trim();
        if (JSON.stringify(h) !== JSON.stringify(["Objednávka č. " + o.cislo, n(o.sumaText), n(o.sumaText)])) throw new Error("hodnoty " + JSON.stringify(h));
        // cookie lišta Shoptetu (odmietnuť), aby nezakrývala snímku a klik
        await page.evaluate(() => { const b = Array.prototype.find.call(document.querySelectorAll(".siteCookies button, .siteCookies a"), (e) => e.offsetParent && /^\s*(Odmietnu|Odmítnou)/i.test(e.textContent || "")); if (b) b.click(); });
        await page.waitForTimeout(300);
        // Kopírovať skutočným klikom (prevod; pri karte len keď je rozbalený prevod — tu nie)
        if (await page.locator("#lcd-dakujeme .lcd-dak-kopia").count()) {
          const k = page.locator("#lcd-dakujeme .lcd-dak-udaj:nth-child(2) .lcd-dak-kopia");
          if (P.mobil) await k.tap(); else await k.click();
          await page.waitForFunction(() => /✓/.test(document.querySelector("#lcd-dakujeme .lcd-dak-udaj:nth-child(2) .lcd-dak-kopia").textContent), null, { timeout: 3000 })
            .catch(async () => { throw new Error("Kopírovať: bez „✓“ (výber: " + (await page.evaluate(() => String(getSelection()))) + ")"); });
          await page.waitForTimeout(1900);
        }
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await page.evaluate(() => Promise.all(Array.prototype.map.call(document.querySelectorAll("#lcd-dakujeme img"), (i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
        // pečať v páse nesmie zájsť pod logo hlavičky (logo Shoptetu presahuje pod lištu hlavičky)
        const geo = await page.evaluate(() => {
          const p = document.querySelector("#lcd-dakujeme .lcd-dak-pecat").getBoundingClientRect();
          const loga = Array.prototype.map.call(document.querySelectorAll("#header img, #header .site-name"), (e) => e.getBoundingClientRect()).filter((r) => r.width && r.height);
          const spodok = loga.reduce((m, r) => Math.max(m, r.bottom), 0);
          return { pecat: Math.round(p.top), logo: Math.round(spodok), medzera: Math.round(p.top - spodok) };
        });
        if (process.env.LCD_MERAJ) console.log("        geometria " + JSON.stringify(geo));
        if (geo.medzera < 8) throw new Error("pečať pod logom hlavičky: " + JSON.stringify(geo));
        await page.screenshot({ path: join(OUT, meno + "-" + kluc + ".png"), fullPage: true });
        const rozl = [];
        for (const s of SIRKY) {
          await page.setViewportSize({ width: s, height: s < 768 ? 844 : 900 });
          await page.waitForTimeout(120);
          const r = await page.evaluate(KONTROLA_ROZLOZENIA);
          if (r.length) rozl.push(s + ": " + r.join(" | "));
        }
        if (rozl.length) throw new Error("rozloženie/písmo:\n      " + rozl.join("\n      "));
        const text = await page.evaluate(() => document.getElementById("lcd-dakujeme").innerText);
        const z = ZAKAZANE.exec(text);
        if (z) throw new Error("zakázané slovo „" + z[0] + "“");
        const zel = await page.evaluate(() => Array.prototype.map.call(document.querySelectorAll("#lcd-dakujeme .lcd-dak-btn-zeleny"), (b) => getComputedStyle(b).backgroundImage));
        if (zel.length !== 1 || !/46, 125, 50/.test(zel[0])) throw new Error("zelené tlačidlo " + JSON.stringify(zel));
        if (stav.necakane.length) throw new Error("nečakané požiadavky: " + stav.necakane.join(", "));
        if (chybyKonzoly.length) throw new Error("chyby nášho kódu: " + chybyKonzoly.join("; "));
      } catch (e) { chyba = String(e && e.message || e).split("\n").slice(0, 8).join("\n"); }
      vysledok(meno + " s kódom " + kluc + " (" + o.stav + ")", chyba);
      await ctx.close();
    }
  } finally {
    await B.close();
  }
}
console.log(`\nSpolu: ${ok} OK, ${zle} zlyhalo (snímky v ${OUT})`);
process.exit(zle ? 1 : 0);
