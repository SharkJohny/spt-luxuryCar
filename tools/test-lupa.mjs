#!/usr/bin/env node
/*
 * Lupa až na požiadanie (assets/js/functions/lupaNaPoziadanie.js) na živých stránkach s lokálnym buildom alebo verziou z CDN.
 *   node tools/test-lupa.mjs --pw <file:///.../playwright/index.mjs>              lokálny build (esbuild ako CI)
 *   node tools/test-lupa.mjs --pw <...> --sha <7 znakov>                          súbor z CDN assets/v/<sha>/
 * Telefón: žiadny originál /user/shop/orig/, ani po prepnutí fotky. PC: žiadny do prejdenia myšou, potom sa stiahne a lupa
 * funguje. Rám fotky (#wrap) a klik na fotku ostávajú. Nič sa neobjednáva.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const pwUrl = arg("pw");
if (!pwUrl) { console.error("chýba --pw"); process.exit(2); }
const sha = arg("sha");
const STRANKY = [
  ["sk", "https://www.luxurycardesign.sk/luxusny-koberced-do-kufra-dragonskin-klasik/"],
  ["sk", "https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line/"],
  ["cz", "https://www.luxurycardesign.cz/luxusny-boxi-do-kufra/"],
];
const BLOK = /googletagmanager|google-analytics|doubleclick|facebook|tiktok|hotjar|clarity\.ms|ecomail|smartsupp|bing\.com|sklik|seznam|luxia/i;
const BUNDEL = /\/eshopy\/luxuryCar\/assets\/v\/([0-9a-f]{7})\/js\/luxuryCar\.js/;

let lokalny = null;
if (!sha) {
  const out = join(mkdtempSync(join(tmpdir(), "lcd-lupa-")), "luxuryCar.js");
  const r = spawnSync(process.execPath, ["node_modules/esbuild/bin/esbuild", "assets/js/main.js", "--bundle", "--outfile=" + out,
    "--format=iife", "--loader:.jsx=jsx", "--legal-comments=none", "--minify", "--log-level=error"], { stdio: "inherit" });
  if (r.status !== 0) process.exit(2);
  lokalny = readFileSync(out);
}

const pw = await import(pathToFileURL(pwUrl.replace(/^file:\/+/, "")).href);
let zle = 0;
const pis = (ok, txt) => { if (!ok) zle++; console.log((ok ? "OK   " : "ZLE  ") + txt); };
const orig = (u) => /\/user\/shop\/orig\//.test(u);

async function stranka(prehliadac, nastavenia) {
  const kontext = await prehliadac.newContext(nastavenia);
  await kontext.route("**/*", async (r) => {
    const u = r.request().url();
    if (BLOK.test(u)) return r.abort();
    if (BUNDEL.test(u)) {
      if (lokalny) return r.fulfill({ status: 200, contentType: "application/javascript", body: lokalny });
      return r.continue({ url: u.replace(BUNDEL, (m, s) => m.replace(s, sha)) });
    }
    return r.continue();
  });
  const p = await kontext.newPage();
  const zaznam = { orig: [], chyby: [] };
  p.on("request", (q) => { if (orig(q.url())) zaznam.orig.push(q.url()); });
  p.on("pageerror", (e) => zaznam.chyby.push(String(e.message || e).slice(0, 160)));
  return { kontext, p, zaznam };
}

const stav = (p) => p.evaluate(() => {
  const a = document.querySelector("a.p-main-image"), w = document.querySelector("#wrap");
  const r = w && w.getBoundingClientRect();
  return { a: !!a, href: a && /\/big\//.test(a.getAttribute("href") || ""), data: a && a.getAttribute("data-href"),
    wrap: !!w, vyska: r ? Math.round(r.height) : 0, trap: !!document.querySelector(".mousetrap"), jQ: !!(window.jQuery && window.jQuery.fn.CloudZoom) };
});

const b = await pw.chromium.launch();
for (const [web, url] of STRANKY) {
  // telefón
  {
    const { kontext, p, zaznam } = await stranka(b, { ...pw.devices["iPhone 13"], locale: web === "cz" ? "cs-CZ" : "sk-SK" });
    await p.goto(url, { waitUntil: "load" });
    await p.waitForTimeout(3500);
    const s = await stav(p);
    pis(s.a && s.wrap && s.vyska > 100, `${web} telefón: fotka s rámom #wrap (${s.vyska} px) ${url.slice(-34)}`);
    pis(zaznam.orig.length === 0, `${web} telefón: žiadny originál po načítaní (${zaznam.orig.length})`);
    const t = p.locator(".p-thumbnails-inner a.p-thumbnail").nth(1);
    if (await t.count()) {
      await p.evaluate(() => { const x = document.querySelectorAll(".p-thumbnails-inner a.p-thumbnail")[1]; x && x.click(); });
      await p.waitForTimeout(900);
      pis(zaznam.orig.length === 0, `${web} telefón: žiadny originál po prepnutí fotky (${zaznam.orig.length})`);
    }
    await p.locator("#wrap").tap();
    await p.waitForTimeout(1200);
    const galeria = await p.evaluate(() => { const c = document.querySelector("#colorbox, #cboxOverlay, .lcd-lb, #p1v-lb"); return !!c && getComputedStyle(c).display !== "none" && c.getBoundingClientRect().height > 50; });
    pis(galeria, `${web} telefón: ťuknutie na fotku otvorí galériu`);
    pis(!zaznam.chyby.length, `${web} telefón: bez chýb v stránke ${zaznam.chyby.slice(0, 2).join(" | ")}`);
    await kontext.close();
  }
  // PC
  {
    const { kontext, p, zaznam } = await stranka(b, { viewport: { width: 1366, height: 800 }, locale: web === "cz" ? "cs-CZ" : "sk-SK" });
    await p.goto(url, { waitUntil: "load" });
    await p.waitForTimeout(3500);
    const s = await stav(p);
    pis(s.wrap && s.trap, `${web} PC: rám aj vrstva lupy sú na stránke (trap ${s.trap})`);
    pis(zaznam.orig.length === 0, `${web} PC: žiadny originál pred prejdením myšou (${zaznam.orig.length})`);
    await p.locator("#wrap").scrollIntoViewIfNeeded();
    const box = await p.locator("#wrap").boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(600);
    await p.mouse.move(box.x + box.width / 2 + 6, box.y + box.height / 2 + 6);
    for (let i = 0; i < 40 && !zaznam.orig.length; i++) await p.waitForTimeout(100);
    pis(zaznam.orig.length === 1, `${web} PC: po prejdení myšou sa stiahne originál (${zaznam.orig.length})`);
    await p.waitForTimeout(2500);
    await p.mouse.move(box.x + box.width / 2 + 16, box.y + box.height / 2 + 12);
    await p.waitForTimeout(900);
    const lupa = await p.evaluate(() => ({ big: !!document.querySelector(".cloud-zoom-big"), text: (document.querySelector(".cloud-zoom-loading") || {}).offsetHeight || 0 }));
    pis(lupa.big, `${web} PC: lupa sa ukáže (${JSON.stringify(lupa)})`);
    await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(1200);
    const galeria = await p.evaluate(() => { const c = document.querySelector("#colorbox, #cboxOverlay, .lcd-lb, #p1v-lb"); return !!c && getComputedStyle(c).display !== "none" && c.getBoundingClientRect().height > 50; });
    pis(galeria, `${web} PC: klik na fotku otvorí galériu`);
    pis(!zaznam.chyby.length, `${web} PC: bez chýb v stránke ${zaznam.chyby.slice(0, 2).join(" | ")}`);
    await kontext.close();
  }
}
await b.close();
console.log(zle ? `\nZLYHALO ${zle}` : "\nVŠETKO OK");
process.exit(zle ? 1 : 0);
