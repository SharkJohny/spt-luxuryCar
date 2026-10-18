#!/usr/bin/env node
// Fixture živej stránky kamiónov SK 640 pre jsdom testy kamion:test (docs/kamiony-1v-plan.md §5, K8).
//
//   node tools/test-1v/kamion-fixture.mjs --z-webu      # stiahne živú stránku (LEN GET) a prepíše kamion-640.fixture.html
//   node tools/test-1v/kamion-fixture.mjs --z-webu --subor C:/tmp/p640.html   # to isté z uloženého HTML (bez siete)
//   node tools/test-1v/kamion-fixture.mjs               # len vypíše selecty z uloženej fixture (kontrola)
//
// Fixture = to, čo konfigurátor kamiónov na stránke potrebuje, presne ako naživo: hlavička s H1 (mimo formulára),
// form#product-detail-form (skryté polia productId/priceId/language, meta[itemprop=price], galéria s 3 náhľadmi,
// .p-final-price-wrapper, table.detail-parameters s 15 selectmi príplatkov vrátane value, data-surcharge-*, required,
// .add-to-cart s natívnym tlačidlom, krátky popis), záložky .shp-tabs-wrapper (miesto obsahu) a dataLayer s
// projectId/language/product.id. Obnoviť po každej zmene príplatkov v admine (nová možnosť, nový motív).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const TU = dirname(fileURLToPath(import.meta.url));
export const FIXTURE = join(TU, "kamion-640.fixture.html");
export const URL_640 = "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/";

/** Zo živého HTML stránky 640 poskladá fixture (reťazec). */
export function vyrezFixture(html) {
  const d = new JSDOM(html).window.document;
  const form = d.getElementById("product-detail-form");
  const hlav = d.querySelector(".p-detail-inner-header");
  if (!form || !hlav) throw new Error("na stránke chýba form#product-detail-form alebo .p-detail-inner-header");
  const sel = form.querySelectorAll("select[data-parameter-id]");
  if (sel.length !== 15) throw new Error("čakám 15 selectov príplatkov, je " + sel.length);
  const f = form.cloneNode(true);
  // galéria: hlavná fotka + 3 náhľady (jsdom obrázky nenačítava; stačí štruktúra)
  f.querySelectorAll(".p-thumbnails-inner > *").forEach((x, i) => { if (i > 2) x.remove(); });
  f.querySelectorAll(".social-buttons-wrapper, script, noscript").forEach((x) => x.remove());
  const layer = (() => {
    const s = Array.prototype.map.call(d.scripts, (x) => x.textContent).find((t) => /dataLayer\.push\(\{'shoptet'/.test(t)) || "";
    const pid = /"projectId":\s*(\d+)/.exec(s), lang = /"language":\s*"(\w+)"/.exec(s), prod = /"product":\s*\{\s*"id":\s*(\d+)/.exec(s), page = /"pageId":\s*(\d+)/.exec(s);
    return { projectId: pid ? Number(pid[1]) : null, language: lang ? lang[1] : "sk", product: { id: prod ? Number(prod[1]) : null }, pageId: page ? Number(page[1]) : null };
  })();
  if (layer.projectId !== 562035 || layer.product.id !== 640) throw new Error("dataLayer nie je SK 640: " + JSON.stringify(layer));
  const telo = d.body.className;
  return "<!doctype html>\n<!-- VYGENEROVANÉ tools/test-1v/kamion-fixture.mjs --z-webu z " + URL_640 + " (" + new Date().toISOString().slice(0, 10) + ") — needitovať ručne -->\n" +
    '<html lang="sk"><head><meta charset="utf-8"><title>kamion 640 fixture</title>\n' +
    "<script>window.dataLayer = [{ shoptet: " + JSON.stringify({ pageId: layer.pageId, pageType: "productDetail", language: layer.language, projectId: layer.projectId, product: { id: layer.product.id } }) + " }];</script>\n" +
    '</head>\n<body class="' + telo + '">\n<div id="content-wrapper" class="container content-wrapper"><div class="content-wrapper-in"><main id="content" class="content wide">\n' +
    '<div class="p-detail"><div class="p-detail-inner">\n' + hlav.outerHTML + "\n" + f.outerHTML + "\n</div>\n" +
    '<div class="shp-tabs-wrapper p-detail-tabs-wrapper"><div class="basic-description"><p>popis</p></div></div>\n' +
    "</div>\n</main></div></div>\n</body></html>\n";
}

/** Prehľad selectov fixture: [{ id, meno, povinny, moznosti: [text] }] */
export function selectyFixture(html) {
  const d = new JSDOM(html).window.document;
  return Array.prototype.map.call(d.querySelectorAll("select[data-parameter-id]"), (s) => ({
    id: Number(s.getAttribute("data-parameter-id")),
    meno: s.getAttribute("data-parameter-name"),
    povinny: s.required,
    moznosti: Array.prototype.filter.call(s.options, (o) => o.value).map((o) => o.textContent.trim()),
  }));
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--z-webu")) {
    const i = argv.indexOf("--subor");
    let html;
    if (i > -1) html = readFileSync(argv[i + 1], "utf8");
    else {
      const r = await fetch(URL_640, { method: "GET", headers: { "user-agent": "Mozilla/5.0 (lcd kamion fixture)" } });
      if (!r.ok) throw new Error("GET " + URL_640 + " -> " + r.status);
      html = await r.text();
    }
    writeFileSync(FIXTURE, vyrezFixture(html));
    console.log("zapísané " + FIXTURE);
  }
  const s = selectyFixture(readFileSync(FIXTURE, "utf8"));
  s.forEach((x) => console.log(x.id + "  " + x.meno + (x.povinny ? " *" : "") + "  [" + x.moznosti.join(" | ") + "]"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error("CHYBA: " + e.message); process.exit(1); });
}
