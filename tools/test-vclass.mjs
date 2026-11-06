// Test konfigurátora triedy V (SK 646). Produkt je pre hosťa 404, preto sa skúša na živej stránke kamiónov prerobenej na 646:
// rovnaká šablóna, skripty aj CSS, len formulár má 10 selectov príplatkov ako v admine. POST do košíka sa zachytí a zruší.
//
//   node tools/test-vclass.mjs --pw <file:///…/playwright/index.mjs> --dist <priečinok s luxuryCar.js a lcd-vclass.js> [--prehliadac chromium,webkit,firefox] [--snimky <priečinok>]
//   node tools/test-vclass.mjs --pw <…> --sha <verzia na CDN>
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { VELKOSTI, ROKY, VOLANT, STRED, DVERE, MIESTA, STOLCEK, ZASUVKY, VZORY, FARBY, LUX } from "../assets/js/components/konfigurator1v/vclass/data.js";

const arg = (m, z) => { const i = process.argv.indexOf("--" + m); return i > -1 ? process.argv[i + 1] : z; };
const pw = await import(arg("pw"));
const dist = arg("dist"), sha = arg("sha"), snimky = arg("snimky");
if (snimky) mkdirSync(snimky, { recursive: true });
const ZIVA = "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/";
const CIEL = "https://www.luxurycardesign.sk/autokoberce-mercedes-triedy-v/";

// hodnoty ako v admine: ID idú po troch v poradí zakladania
const farby = [].concat(...VZORY.map((v) => FARBY[v.id].map((f) => v.nm + " – " + f.nm)));
const P = [
  [415, "Veľkosť", 2356, VELKOSTI.map((x) => x.v), [0, 100, 200]],
  [418, "Rok výroby", 2365, ROKY], [421, "Volant", 2404, VOLANT], [424, "Stred medzi sedadlami", 2410, STRED], [427, "Bočné dvere", 2416, DVERE],
  [430, "Počet miest", 2422, MIESTA], [433, "Stolček vzadu", 2434, STOLCEK], [436, "Zásuvky pod sedadlami", 2440, ZASUVKY],
  [439, "Vzor a farba 1. vrstvy", 2446, farby], [442, "Farba 2. vrstvy", 2533, LUX.map((l) => "Lux Color " + l[0])],
];
const riadok = ([id, m, od, H, c]) => `<tr class="surcharge-list"><th><label for="surcharge-parameter-id-${id}">${m}</label></th><td><select name="surchargeParameterValueId[${id}]" id="surcharge-parameter-id-${id}" class="parameter-id-${id} surcharge-parameter form-control" data-parameter-id="${id}" data-parameter-name="${m}" required="required"><option value="" data-choose="true" data-index="0">Vyberte príplatok</option>${H.map((t, i) => { const p = c ? c[i] : 0; return `<option value="${od + i * 3}" data-surcharge-final-price="${p}" data-surcharge-additional-price="${p}">${t} +€${p}</option>`; }).join("")}</select></td></tr>`;
const hodnotaId = (meno, text) => { const p = P.find((x) => x[1] === meno); return String(p[2] + p[3].indexOf(text) * 3); };

const zaklad = await (await fetch(ZIVA, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
function stranka() {
  let h = zaklad;
  let prvy = true;
  h = h.replace(/<tr class="surcharge-list[\s\S]*?<\/tr>/g, () => { if (prvy) { prvy = false; return P.map(riadok).join(""); } return ""; });
  h = h.replace('name="productId" value="640"', 'name="productId" value="646"').replace('name="priceId" value="68383"', 'name="priceId" value="68434"');
  h = h.replace(/("product":\s*\{\s*"id":\s*)640/, "$1646");
  h = h.replace(/(<meta itemprop="price" content=")[^"]*"/, '$11300.00"');
  h = h.replace(/luxusné autokoberce do kamionov(\s*<\/h1>)/, "Autokoberce Mercedes triedy V$1");
  return h;
}
const html = stranka();
if (!/data-parameter-name="Veľkosť"/.test(html) || !/name="productId" value="646"/.test(html)) throw new Error("prerobenie stránky zlyhalo");

let ok = 0, zle = 0;
const over = (c, t) => { if (c) ok++; else { zle++; console.log("  ✗ " + t); } };

async function klik(p, k, v) { await p.click(`#lcd-vclass [data-k="${k}"][data-v="${v}"]`); await p.waitForTimeout(320); }
async function prejdi(p, o) {
  await klik(p, "velkost", o.velkost);
  await p.selectOption("#lv-rok", o.rok);
  await klik(p, "volant", o.volant);
  await p.click("#lcd-vclass .lv-dalej"); await p.waitForTimeout(150);
  await klik(p, "stred", o.stred); await klik(p, "dvere", o.dvere); await klik(p, "miesta", o.miesta);
  await klik(p, "stolcek", o.stolcek); await klik(p, "zasuvky", o.zasuvky); await klik(p, "vzor", o.vzor);
  await klik(p, "farba", o.farba); if (o.snimka) await p.screenshot({ path: o.snimka }); await p.click("#lcd-vclass .lv-dalej"); await p.waitForTimeout(150);
  await klik(p, "farba2", o.lux); await p.click("#lcd-vclass .lv-dalej"); await p.waitForTimeout(150);
}

const SCEN = [
  { velkost: "M", rok: "2020", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], miesta: "7", stolcek: STOLCEK[0], zasuvky: ZASUVKY[0], vzor: "diamond", farba: "Čierna, béžové šitie", lux: "10", cena: 1300 },
  { velkost: "L", rok: "2024", volant: "Vpravo", stred: STRED[1], dvere: DVERE[0], miesta: "6", stolcek: STOLCEK[1], zasuvky: ZASUVKY[1], vzor: "stripe", farba: "Béžová", lux: "12", cena: 1400 },
  { velkost: "XL", rok: "2016", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], miesta: "8", stolcek: STOLCEK[1], zasuvky: ZASUVKY[1], vzor: "hexa", farba: "Čierna, červené šitie", lux: "05", cena: 1500 },
];
const SIRKY = { chromium: [1366, 390], webkit: [390], firefox: [1366] };

for (const nazov of arg("prehliadac", "chromium").split(",")) {
  for (const sirka of SIRKY[nazov] || [1366]) {
    console.log("== " + nazov + " " + sirka);
    const b = await pw[nazov].launch();
    for (const [i, o] of SCEN.entries()) {
      const c = await b.newContext({ viewport: { width: sirka, height: sirka < 500 ? 844 : 800 } });
      const p = await c.newPage();
      const chyby = [];
      p.on("pageerror", (e) => chyby.push(String(e.message).slice(0, 200)));
      p.on("console", (m) => { if (m.type() === "error" && /vclass|lcd-1v/.test(m.text())) chyby.push(m.text().slice(0, 200)); });
      let post = null;
      await c.route(CIEL, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
      if (dist) {
        await c.route(/assets\/v\/[^/]+\/js\/luxuryCar\.js/, (r) => r.fulfill({ contentType: "application/javascript", body: readFileSync(join(dist, "luxuryCar.js")) }));
        await c.route(/assets\/v\/[^/]+\/js\/lcd-vclass\.js/, (r) => r.fulfill({ contentType: "application/javascript", body: readFileSync(join(dist, "lcd-vclass.js")) }));
      } else {
        await c.route(/assets\/v\/[^/]+\/js\/(luxuryCar|lcd-[a-z]+)\.js/, (r) => r.continue({ url: r.request().url().replace(/assets\/v\/[^/]+\//, "assets/v/" + sha + "/") }));
      }
      await c.route(/action\/Cart\/addCartItem/, (r) => { post = r.request().postData(); r.abort(); });
      await p.goto(CIEL, { waitUntil: "domcontentloaded" });
      await p.waitForSelector("#lcd-vclass .lv-kr", { timeout: 25000 });
      await p.waitForTimeout(1200);
      if (i === 0) over(!(await p.$(".content-wrap")), "na stránke nesmie byť konfigurátor osobných áut");
      over((await p.evaluate(() => document.documentElement.scrollWidth)) <= sirka, "stránka sa nesmie posúvať do boku");
      await p.click("#lcd-vclass .lv-cta"); await p.waitForTimeout(200);
      over(post === null, "nedokončený výber nesmie ísť do košíka");
      over(/Ešte chýba/.test(await p.textContent("#lcd-vclass .lv-spr")), "chýba hláška pri nedokončenom výbere");
      if (snimky && i === 0) await p.screenshot({ path: join(snimky, `${nazov}-${sirka}-start.png`) });
      await prejdi(p, snimky ? { ...o, snimka: join(snimky, `${nazov}-${sirka}-farba-${o.velkost}.png`) } : o);
      const vzorNm = VZORY.find((v) => v.id === o.vzor).nm;
      const cena = await p.evaluate(() => window.__lcdVclass.cenaSpolu());
      over(cena === o.cena, o.velkost + ": cena " + cena);
      over((await p.textContent("#lcd-vclass .lv-c2")).replace(/\s/g, "") === String(o.cena) + "€", "súhrn ceny");
      over((await p.textContent("#lcd-vclass .lv-cta")).trim() === "Vložte do košíka", "tlačidlo hotového výberu");
      over((await p.$$("#lcd-vclass .lv-kr.lv-ho")).length === 10, "všetkých 10 krokov hotových");
      const kres = await p.evaluate(() => [...document.querySelectorAll("#lcd-vclass-nakres canvas")].map((k) => { const d = k.getContext("2d").getImageData(0, 0, k.width, k.height).data; let n = 0; for (let i = 3; i < d.length; i += 40) if (d[i] > 200) n++; return n; }));
      over(kres.length === 2 && kres.every((n) => n > 500), "kresba predku aj zadku " + kres);
      if (snimky) await p.screenshot({ path: join(snimky, `${nazov}-${sirka}-${o.velkost}.png`), fullPage: sirka < 500 });
      over(chyby.length === 0, "chyby pred košíkom: " + chyby.join(" | "));
      const predKosikom = chyby.length;
      await p.click("#lcd-vclass .lv-cta"); await p.waitForTimeout(500);
      over(!!post, "POST do košíka");
      const q = new URLSearchParams(post || "");
      over(q.get("productId") === "646", "productId");
      over(q.get("priceId") === "68434", "priceId");
      const ma = { "Veľkosť": o.velkost, "Rok výroby": o.rok, Volant: o.volant, "Stred medzi sedadlami": o.stred, "Bočné dvere": o.dvere, "Počet miest": o.miesta, "Stolček vzadu": o.stolcek, "Zásuvky pod sedadlami": o.zasuvky, "Vzor a farba 1. vrstvy": vzorNm + " – " + o.farba, "Farba 2. vrstvy": "Lux Color " + o.lux };
      for (const m of Object.keys(ma)) { const id = P.find((x) => x[1] === m)[0]; over(q.get(`surchargeParameterValueId[${id}]`) === hodnotaId(m, ma[m]), m + " = " + ma[m] + " (je " + q.get(`surchargeParameterValueId[${id}]`) + ")"); }
      over((await p.evaluate(() => sessionStorage.getItem("model"))) === `Mercedes-Benz Trieda V ${o.rok} ${o.velkost}`, "auto do poznámky objednávky");
      // zrušený POST testu natívny Shoptet hlási ako odmietnutý sľub, to nie je chyba konfigurátora
      over(chyby.slice(predKosikom).every((t) => /Uncaught \(in promise\)/.test(t)), "chyby po košíku: " + chyby.slice(predKosikom).join(" | "));
      await c.close();
    }
    await b.close();
  }
}
console.log(`OK ${ok}, zle ${zle}`);
process.exit(zle ? 1 : 0);
