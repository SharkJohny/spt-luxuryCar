// Test konfigurátora triedy V (SK 646). Produkt je pre hosťa 404, preto sa skúša na živej stránke kamiónov prerobenej na 646:
// rovnaká šablóna, skripty aj CSS, len formulár má 10 selectov príplatkov ako v admine. POST do košíka sa zachytí a zruší.
//
//   node tools/test-vclass.mjs --pw <file:///…/playwright/index.mjs> --dist <priečinok s luxuryCar.js a lcd-vclass.js> [--prehliadac chromium,webkit,firefox] [--snimky <priečinok>]
//   node tools/test-vclass.mjs --pw <…> --sha <verzia na CDN>
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { VELKOSTI, ROKY, VOLANT, STRED, DVERE, SEDADLA_TEXTY, sedadlaText, STOLCEK, ZASUVKY, VZORY, FARBY, LUX, BEZ_DRUHEJ, ROZ_PREDOK, ROZ_BEZ, rozSet, rozLen, rozRadRohoz, ROHOZ, ROHOZ_SAM, BOXY, BOX_FARBY } from "../assets/js/components/konfigurator1v/vclass/data.js";

const arg = (m, z) => { const i = process.argv.indexOf("--" + m); return i > -1 ? process.argv[i + 1] : z; };
const pw = await import(arg("pw"));
const dist = arg("dist"), sha = arg("sha"), snimky = arg("snimky");
if (snimky) mkdirSync(snimky, { recursive: true });
const ZIVA = "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/";
const CIEL = "https://www.luxurycardesign.sk/autokoberce-mercedes-v-class/";

// hodnoty ako v admine: [id, meno, prvé ID hodnoty (po troch) alebo zoznam ID, texty, ceny, nepovinný]
const farby = [].concat(...VZORY.map((v) => FARBY[v.id].map((f) => v.nm + " – " + f.nm)));
const luxId = LUX.map((_, i) => 2533 + i * 3).concat(2635);
const boxT = BOXY.map((b) => b.t), boxC = [99, 109, 129, 149], boxD = [89, 99, 119, 139];
const P = [
  [418, "Rok výroby", 2365, ROKY], [421, "Volant", 2404, VOLANT], [424, "Stred medzi sedadlami", 2410, STRED], [427, "Bočné dvere", 2416, DVERE],
  [430, "Sedadlá v 2. a 3. rade", 2422, SEDADLA_TEXTY], [433, "Stolček vzadu", 2434, STOLCEK], [436, "Zásuvky pod sedadlami", 2440, ZASUVKY],
  [439, "Vzor a farba 1. vrstvy", 2446, farby],
  [442, "Farba 2. vrstvy", luxId, LUX.map((l) => "Lux Color " + l[0]).concat(BEZ_DRUHEJ), LUX.map(() => 150).concat(0)],
  [445, "Rozloženie", [2581, 2584, 2587, 2590, 9001, 9002, 9003, 9004, 9005, 9006, 9007], [ROZ_PREDOK].concat(VELKOSTI.map((x) => rozSet(x.v)), VELKOSTI.map((x) => rozLen(x.v)), VELKOSTI.map((x) => rozRadRohoz(x.v)), ROZ_BEZ), [0, 600, 700, 800, 450, 550, 650, 300, 400, 500, 0]],
  [448, "Rohož do kufra", [2593, 2596, 9008], ROHOZ.concat(ROHOZ_SAM), [250, 0, 40]],
  [451, "Box do kufra", 2599, boxT, boxC, true], [454, "Prvý box z dvoch", 2611, boxT, boxD, true], [457, "Druhý box z dvoch", 2623, boxT, boxD, true],
  [460, "Farba boxov do kufra", 2638, BOX_FARBY.map((f) => f.nm), null, true],
];
const idHodnoty = (p, i) => (Array.isArray(p[2]) ? p[2][i] : p[2] + i * 3);
const riadok = (x) => { const [id, m, , H, c, nep] = x; return `<tr class="surcharge-list"><th><label for="surcharge-parameter-id-${id}">${m}</label></th><td><select name="surchargeParameterValueId[${id}]" id="surcharge-parameter-id-${id}" class="parameter-id-${id} surcharge-parameter form-control" data-parameter-id="${id}" data-parameter-name="${m}"${nep ? "" : ' required="required"'}><option value="" data-choose="true" data-index="0">Vyberte príplatok</option>${H.map((t, i) => { const pr = c ? c[i] : 0; return `<option value="${idHodnoty(x, i)}" data-surcharge-final-price="${pr}" data-surcharge-additional-price="${pr}">${t} +€${pr}</option>`; }).join("")}</select></td></tr>`; };
const hodnotaId = (meno, text) => { const p = P.find((x) => x[1] === meno); return String(idHodnoty(p, p[3].indexOf(text))); };

const zaklad = await (await fetch(ZIVA, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
function stranka() {
  let h = zaklad;
  let prvy = true;
  h = h.replace(/<tr class="surcharge-list[\s\S]*?<\/tr>/g, () => { if (prvy) { prvy = false; return P.map(riadok).join(""); } return ""; });
  h = h.replace('name="productId" value="640"', 'name="productId" value="646"').replace('name="priceId" value="68383"', 'name="priceId" value="68434"');
  h = h.replace(/("product":\s*\{\s*"id":\s*)640/, "$1646");
  h = h.replace(/(<meta itemprop="price" content=")[^"]*"/, '$1300.00"');
  h = h.replace('itemprop="productID" content="640"', 'itemprop="productID" content="646"');
  h = h.replace(/luxusné autokoberce do kamionov(\s*<\/h1>)/, "Autokoberce Mercedes triedy V$1");
  return h;
}
const html = stranka();
if (!/data-parameter-name="Rozloženie"/.test(html) || !/name="productId" value="646"/.test(html)) throw new Error("prerobenie stránky zlyhalo");

let ok = 0, zle = 0;
const over = (c, t) => { if (c) ok++; else { zle++; console.log("  ✗ " + t); } };

async function klik(p, k, v, t = 320) { await p.click(`#lcd-vclass [data-k="${k}"][data-v="${v}"]`); await p.waitForTimeout(t); }
/** „Pokračujte“ je na konci každého kroku aj na telefóne. */
const dalej = async (p) => { await p.click("#lcd-vclass .lv-ot .lv-dalej"); await p.waitForTimeout(220); };
async function prejdi(p, o) {
  // prvý krok: všetky údaje o aute naraz, rok a veľkosť sú rozbaľovacie menu vedľa seba
  await p.selectOption("#lv-velkost", o.velkost);
  over(!!(await p.$("#lv-rok")), "rok výroby je v prvom kroku");
  over(await p.evaluate(() => { const a = document.getElementById("lv-rok").getBoundingClientRect(), b = document.getElementById("lv-velkost").getBoundingClientRect(); return Math.abs(a.top - b.top) < 2 && b.left > a.left; }), "rok a veľkosť sú vedľa seba");
  await p.selectOption("#lv-rok", o.rok);
  await klik(p, "volant", o.volant, 40); await klik(p, "rad2", o.rad2, 40); await klik(p, "rad3", o.rad3, 40); await klik(p, "dvere", o.dvere, 40);
  await klik(p, "stred", o.stred, 40); await klik(p, "stolcek", o.stolcek, 40);
  await dalej(p); await p.waitForTimeout(900);
  over(!!(await p.$("#lcd-vclass .lv-chyba")), "chýbajúce údaje o aute sú označené");
  // Michal 7. 11. 2026: chýbajúca voľba je dole, po kontrole vidno krok aj červené pole, nie len pole vo výške očí
  { const m = await p.evaluate(() => { const k = document.querySelector("#lcd-vclass .lv-ot").getBoundingClientRect(), c = document.querySelector("#lcd-vclass .lv-chyba").getBoundingClientRect(); return { k: k.top, kd: k.bottom, c: c.top, cd: c.bottom, v: window.innerHeight }; });
    over(m.c > 90 && m.cd < m.v - 70, "kontrola: červené pole je celé na obrazovke " + JSON.stringify(m));
    over(m.c - Math.max(m.k, 0) > 150, "kontrola: vidno aj zvyšok kroku nad poľom " + JSON.stringify(m)); }
  if (o.info) {
    await p.click('#lcd-vclass [data-info="zasuvky"]'); await p.waitForTimeout(150);
    over(await p.isVisible(".lv-info-p img"), "ikona i ukáže obrázok zásuviek");
    if (o.snimka) await p.screenshot({ path: o.snimka + "-info.png" });
    await p.keyboard.press("Escape"); await p.waitForTimeout(80);
    over(!(await p.$(".lv-info")), "okienko i sa zavrie");
  }
  await klik(p, "zasuvky", o.zasuvky, 40);
  if (o.snimkaAuto) await p.screenshot({ path: o.snimkaAuto, fullPage: true });
  over(o.mobil ? !(await p.isVisible("#lcd-vclass-nakres")) : !(await p.isVisible("#lcd-vclass-nakres canvas.lv-pred")), "v prvom kroku sa set nekreslí");
  await dalej(p);
  if (o.snimka) await p.screenshot({ path: o.snimka + "-rozl.png", fullPage: true });
  over(/len spolu/.test(await p.textContent("#lcd-vclass .lv-ot")), "povedané, že 2. a 3. rad idú len spolu");
  over(/aspoň dve časti/.test(await p.textContent("#lcd-vclass .lv-ot")), "povedané, kedy je zľava");
  over((await p.$$("#lcd-vclass .lv-ot .lcd1v-kb__karta")).length === 3, "rozloženie má dlaždice predok, 2. a 3. rad, kufor");
  over(/Samostatne/.test(await p.textContent("#lcd-vclass .lv-ot")) && /Výhoda v sete/.test(await p.textContent("#lcd-vclass .lv-ot")), "dlaždice ukazujú zľavu v sete");
  over(await p.isVisible("#lcd-vclass-nakres canvas.lv-pred"), "od rozloženia sa ukazuje kresba");
  if (o.predok === "nie") {
    await klik(p, "predok", "ano", 120); // odobrať predné sedadlá
    await dalej(p); await p.waitForTimeout(700);
    over(!!(await p.$("#lcd-vclass .lv-dl-w.lv-chyba")), "bez výberu krok Rozloženie neprejde");
    over(/aspoň jednu možnosť/.test(await p.textContent("#lcd-vclass .lv-ot")), "krok povie, čo chýba");
  }
  if (o.rozl === "Z") await klik(p, "rozl", "Z", 80);
  if (o.rohoz === "ano") await klik(p, "rohoz", "ano", 80);
  if (o.predok === "nie") {
    const t = await p.textContent("#lcd-vclass .lv-ponuka");
    if (o.rozl === "Z" && o.rohoz === "ano") over(/V sete ušetríte/.test(t), "dve časti majú zľavu: " + t);
    else over(/bez zľavy/.test(t), "jedna časť je bez zľavy: " + t);
  }
  if (o.snimka) await p.screenshot({ path: o.snimka + "-rozl2.png", fullPage: true });
  await dalej(p);
  over(/banners\/diamont\.jpg/.test(await p.innerHTML("#lcd-vclass .lv-ot")), "vzor ukazuje čisté vzorky ako Basic");
  if (o.snimka) await p.screenshot({ path: o.snimka + "-vzor.png" });
  await klik(p, "vzor", o.vzor, 80); await dalej(p);
  await klik(p, "farba", o.farba, 80); await dalej(p);
  if (o.predok === "nie") {
    over(!(await p.$("#lcd-vclass .lcd1v-druha__video")), "bez predných sedadiel sa druhá vrstva preskočí");
  } else {
  over(!!(await p.$("#lcd-vclass .lcd1v-druha__video")), "video v kroku druhej vrstvy");
  over(/nedáva/.test(await p.textContent("#lcd-vclass .lv-ot")), "povedané, že druhá vrstva je len vpredu");
  if (o.okno) {
    await p.click("#lcd-vclass [data-okno]"); await p.waitForTimeout(150);
    over(await p.isVisible(".lcd1v-druha-okno__panel"), "okienko Zistiť viac sa otvorí");
    await p.keyboard.press("Escape"); await p.waitForTimeout(100);
    over(!(await p.isVisible(".lcd1v-druha-okno__panel")), "okienko sa zavrie");
  }
  if (o.snimka) await p.screenshot({ path: o.snimka + "-druha.png", fullPage: true });
  await klik(p, "vrstva", o.lux ? "ano" : "nie");
  if (o.lux) {
    over((await p.evaluate(() => window.__lcdVclass.S.farba2)) === o.lux, "odporúčaná farba 2. vrstvy je vopred vybraná: " + await p.evaluate(() => window.__lcdVclass.S.farba2));
    if (o.snimka) await p.screenshot({ path: o.snimka + "-lux.png", fullPage: true });
    await dalej(p);
  }
  }
  if (o.snimka) await p.screenshot({ path: o.snimka + "-boxy0.png", fullPage: true });
  await dalej(p);
  over(!!(await p.$("#lcd-vclass .lv-chyba")), "bez výberu boxov krok neprejde");
  if (o.boxy.length) {
    await p.click(`#lcd-vclass [data-box-n="${o.boxy.length}"]`); await p.waitForTimeout(320);
    over(await p.isVisible(".lv-bx-obal .lcd1v-bx__ok"), "boxy sa vyberajú v okne");
    if (!o.mobil) {
      const y0 = await p.evaluate(() => window.scrollY);
      await p.mouse.move(683, 400); await p.mouse.wheel(0, 300); await p.waitForTimeout(150);
      over((await p.evaluate(() => window.scrollY)) === y0, "koliesko v okne boxov neposúva stránku");
      await p.evaluate(() => { document.querySelector(".lv-bx-obal .box-config").scrollTop = 0; });
    }
    await p.click(".lv-bx-obal .lcd1v-bx__ok"); await p.waitForTimeout(150);
    over(await p.isVisible(".lv-bx-obal .lcd-needs-fill .lcd1v-bx__chyba"), "okno pýta chýbajúci výber");
    over(/Ešte chýba/.test(await p.textContent(".lv-bx-obal .lv-bx-spr")) && await p.isVisible(".lv-bx-obal .lv-bx-spr"), "okno povie, čo chýba");
    await p.click(`.lv-bx-obal [data-bx-farba="${o.boxFarba}"]`);
    for (const [i, v] of o.boxy.entries()) await p.click(`.lv-bx-obal [data-bx-box="${i + 1}"] [data-bx-vel="${v}"]`);
    if (o.snimka) await p.screenshot({ path: o.snimka + "-okno.png" });
    if (arg("bx")) console.log(JSON.stringify(await p.evaluate(() => { const b = document.querySelector(".lv-bx-obal .lcd1v-bx-velk .option-button"), v = b.querySelector(".lcd1v-bx__vel"), g = b.querySelector("svg"), c = getComputedStyle(b), r = (e) => { const x = e.getBoundingClientRect(); return [Math.round(x.width), Math.round(x.height)]; }; return { b: r(b), v: r(v), g: r(g), d: c.display, h: c.height, mh: c.maxHeight, o: c.overflow, gc: [getComputedStyle(g).height, getComputedStyle(g).display, getComputedStyle(g).maxHeight, g.getAttribute("class")], vc: getComputedStyle(v).display }; })));
    await p.click(".lv-bx-obal .lcd1v-bx__ok"); await p.waitForTimeout(320);
    over(!(await p.isVisible(".lv-bx-obal .lcd1v-bx__ok")), "okno sa po potvrdení zavrie");
    over(await p.getAttribute(`#lcd-vclass [data-box-n="${o.boxy.length}"]`, "aria-pressed") === "true", "dlaždica boxov je označená");
    if (o.snimka) await p.screenshot({ path: o.snimka + "-boxy.png", fullPage: true });
  } else await klik(p, "boxy", "0", 80);
  await dalej(p);
}

const SCEN = [
  { velkost: "M", rok: "2020", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], rad2: "2", rad3: "3", stolcek: STOLCEK[0], zasuvky: ZASUVKY[0], vzor: "diamond", farba: "Čierna, béžové šitie", lux: "10", okno: true, info: true, rozl: "Z", rohoz: "ano", boxy: [], cena: 1300 },
  { velkost: "L", rok: "2024", volant: "Vpravo", stred: STRED[1], dvere: DVERE[0], rad2: "2", rad3: "2", stolcek: STOLCEK[1], zasuvky: ZASUVKY[1], vzor: "stripe", farba: "Béžová", lux: "12", rozl: "P", rohoz: "nie", boxy: [], cena: 450 },
  { velkost: "XL", rok: "2016", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], rad2: "3", rad3: "3", stolcek: STOLCEK[1], zasuvky: ZASUVKY[1], vzor: "hexa", farba: "Čierna, červené šitie", lux: "", rozl: "Z", rohoz: "ano", boxy: ["M", "XL"], boxFarba: "Béžová", cena: 1588 },
  { velkost: "M", rok: "2019", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], rad2: "3", rad3: "2", stolcek: STOLCEK[0], zasuvky: ZASUVKY[0], vzor: "diamond", farba: "Hnedá", lux: "", rozl: "P", rohoz: "ano", boxy: ["S", "L"], boxFarba: "Hnedá káva", cena: 758 },
  { velkost: "L", rok: "2022", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], rad2: "2", rad3: "2", stolcek: STOLCEK[0], zasuvky: ZASUVKY[1], vzor: "diamond", farba: "Čierna, modré šitie", lux: "10", rozl: "Z", rohoz: "nie", boxy: [], cena: 1150 },
  { velkost: "M", rok: "2021", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], rad2: "2", rad3: "3", stolcek: STOLCEK[0], zasuvky: ZASUVKY[0], vzor: "diamond", farba: "Čierna, béžové šitie", lux: "", predok: "nie", rozl: "Z", rohoz: "nie", boxy: [], cena: 750, roz: rozLen("M"), roh: ROHOZ[1] },
  { velkost: "L", rok: "2021", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], rad2: "2", rad3: "2", stolcek: STOLCEK[0], zasuvky: ZASUVKY[0], vzor: "diamond", farba: "Čierna, béžové šitie", lux: "", predok: "nie", rozl: "P", rohoz: "ano", boxy: ["L"], boxFarba: "Hnedá káva", cena: 469, roz: ROZ_BEZ, roh: ROHOZ_SAM },
  { velkost: "XL", rok: "2021", volant: "Vľavo", stred: STRED[0], dvere: DVERE[1], rad2: "3", rad3: "3", stolcek: STOLCEK[0], zasuvky: ZASUVKY[0], vzor: "diamond", farba: "Čierna, béžové šitie", lux: "", predok: "nie", rozl: "Z", rohoz: "ano", boxy: [], cena: 1050, roz: rozRadRohoz("XL"), roh: ROHOZ[0] },
];
const SIRKY = { chromium: [1366, 390], webkit: [390], firefox: [1366] };

for (const nazov of arg("prehliadac", "chromium").split(",")) {
  for (const sirka of SIRKY[nazov] || [1366]) {
    console.log("== " + nazov + " " + sirka);
    const b = await pw[nazov].launch({ slowMo: Number(arg("pomaly", 0)) });
    for (const [i, o] of SCEN.slice(0, Number(arg("scen", 99))).entries()) {
      const c = await b.newContext({ viewport: { width: sirka, height: sirka < 500 ? 844 : 800 }, ...(arg("video") && sirka < 500 ? { recordVideo: { dir: arg("video"), size: { width: 390, height: 844 } } } : {}) });
      const p = await c.newPage();
      const chyby = [];
      p.on("pageerror", (e) => chyby.push(String(e.message).slice(0, 200)));
      p.on("console", (m) => { if (m.type() === "error" && /vclass|lcd-1v/.test(m.text())) chyby.push(m.text().slice(0, 200)); });
      let post = null;
      await c.route(CIEL, (r) => r.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
      if (dist) {
        await c.route(/assets\/v\/[^/]+\/js\/luxuryCar\.js/, (r) => r.fulfill({ contentType: "application/javascript", body: readFileSync(join(dist, "luxuryCar.js")) }));
        await c.route(/assets\/v\/[^/]+\/js\/lcd-vclass\.js/, (r) => r.fulfill({ contentType: "application/javascript", body: readFileSync(join(dist, "lcd-vclass.js")) }));
        // fotky ešte nemusia byť na CDN
        await c.route(/assets\/img\/1v\/obsah\/[^/?]*mercedes-v-class[^/?]*/, (r) => { const m = /obsah\/([^/?]+)$/.exec(new URL(r.request().url()).pathname); r.fulfill({ contentType: m[1].endsWith("webp") ? "image/webp" : "image/jpeg", body: readFileSync(new URL("../assets/img/1v/obsah/" + m[1], import.meta.url)) }); });
        await c.route(/assets\/img\/1v\/mercedes-v-class-(film|sken|druha)[^/?]*/, (r) => { const m = /1v\/([^/?]+)$/.exec(new URL(r.request().url()).pathname); r.fulfill({ contentType: m[1].endsWith("mp4") ? "video/mp4" : m[1].endsWith("bin") ? "application/octet-stream" : "image/jpeg", body: readFileSync(new URL("../assets/img/1v/" + m[1], import.meta.url)) }); });
        await c.route(/assets\/v\/[^/]+\/html\/p1v-vclass-\d\.sk\.html/, (r) => { const m = /(p1v-vclass-\d\.sk\.html)/.exec(r.request().url()); r.fulfill({ contentType: "text/html; charset=utf-8", body: readFileSync(new URL("../admin-html/dist/" + m[1], import.meta.url)) }); });
      } else {
        await c.route(/assets\/v\/[^/]+\/(js\/(luxuryCar|lcd-[a-z]+)\.js|html\/p1v-)/, (r) => r.continue({ url: r.request().url().replace(/assets\/v\/[^/]+\//, "assets/v/" + sha + "/") }));
      }
      await c.route(/action\/Cart\/addCartItem/, (r) => { post = r.request().postData(); r.abort(); });
      await p.goto(CIEL, { waitUntil: "domcontentloaded" });
      await p.waitForSelector("#lcd-vclass .lv-kr", { timeout: 25000 });
      await p.waitForTimeout(1200);
      { const odm = await p.$('button:has-text("Odmietnuť")'); if (odm) await odm.click().catch(() => {}); await p.waitForTimeout(300); }
      if (i === 0) over(!(await p.$(".content-wrap")), "na stránke nesmie byť konfigurátor osobných áut");
      over((await p.evaluate(() => document.documentElement.scrollWidth)) <= sirka, "stránka sa nesmie posúvať do boku");
      if (snimky && i === 0) await p.screenshot({ path: join(snimky, `${nazov}-${sirka}-start.png`) });
      const mobil = sirka < 992;
      if (i === 0 && mobil) {
        // Michal 7. 11. 2026: video od kraja po kraj; iPhone s lištami Chromu ukáže cca 678 px, tlačidlo musí byť vidno bez posúvania
        const h = await p.evaluate(() => { const g = document.querySelector("#lcd-vclass-hero .lh-g").getBoundingClientRect(), c = document.querySelector("#lcd-vclass-hero .lh-cta").getBoundingClientRect(); return { l: g.left, s: g.width, k: document.querySelector(".overall-wrapper").getBoundingClientRect().width, c: c.bottom }; });
        over(Math.abs(h.l) < 1 && Math.abs(h.s - h.k) < 1, "video na telefóne ide od kraja po kraj: " + JSON.stringify(h));
        over(h.c <= 678, "tlačidlo Zostaviť môj set je na telefóne na prvej obrazovke: " + JSON.stringify(h));
      }
      if (i === 0) {
        // Michal 7. 11. 2026: na počítači vršok po okraj, väčší nadpis, vpravo jedno video; telefón bez zmeny
        const v = await p.evaluate(() => { const t = document.querySelector("#lcd-vclass-hero .lh-tx"); return { f: parseFloat(getComputedStyle(document.querySelector("#lcd-vclass-hero h1")).fontSize), m: t.scrollWidth <= t.clientWidth, g: document.querySelector("#lcd-vclass-hero .lh-g").getBoundingClientRect().right }; });
        if (mobil) {
          over(!(await p.$("#lcd-vclass-hero .lh-dl")), "vo vršku nie je riadok dĺžok");
        } else {
          over(v.f >= 40, "nadpis vršku je na počítači veľký: " + v.f);
          over(v.m, "text vršku sa zmestí do stĺpca");
          over(Math.abs(v.g - sirka) < 20, "zábery idú po okraj obrazovky: " + v.g);
          over(await p.evaluate(() => document.querySelectorAll("#lcd-vclass-hero img").length === 0), "vpravo je len video, žiadne fotky");
        }
      }
      if (i === 0) {
        over(/od\s*300\s*€/.test((await p.textContent("#lcd-vclass-hero .lh-c")).replace(/\u00a0/g, " ")), "hore cena od 300 €");
        over(/predným sedadlám/.test(await p.textContent("#lcd-vclass-hero .lh-c")), "hore povedané, že cena je za predné sedadlá");
        over((await p.textContent("#lcd-vclass .lv-c2")).replace(/\s/g, "") === "300€", "Spolu začína na 300 €");
      }
      if (mobil) { await p.evaluate(() => document.getElementById("lcd-vclass-cesta").scrollIntoView()); await p.waitForTimeout(450); over(await p.isVisible("#lcd1v-lista.on"), "lišta na telefóne sa ukáže pri krokoch"); }
      if (arg("ladenie")) console.log(JSON.stringify(await p.evaluate(() => ["#lcd-vclass-hero", "#lcd-vclass-hero .lh-in", "#lcd-vclass-hero .lh-g", "#lcd-vclass-hero .lh-st", "#lcd-vclass-hero .lh-f", "#lcd-vclass-hero .lh-f picture", "#lcd-vclass-hero .lh-f img"].map((q) => { const e = document.querySelector(q), r = e.getBoundingClientRect(), c = getComputedStyle(e); return q.slice(-8) + " x" + Math.round(r.left) + " y" + Math.round(r.top) + " " + Math.round(r.width) + "x" + Math.round(r.height) + " m:" + c.marginTop + "/" + c.marginLeft + " p:" + c.paddingTop + " d:" + c.display + " pos:" + c.position + " ins:" + c.top; }))));
      await p.click("#lcd-vclass .lv-cta"); await p.waitForTimeout(200);
      over(post === null, "nedokončený výber nesmie ísť do košíka");
      over(/Ešte chýba/.test(await p.textContent("#lcd-vclass .lv-suhrn .lv-spr")), "chýba hláška pri nedokončenom výbere");
      await prejdi(p, snimky ? { ...o, mobil, snimka: join(snimky, `${nazov}-${sirka}-farba-${o.velkost}.png`), snimkaAuto: i === 0 ? join(snimky, `${nazov}-${sirka}-auto.png`) : null } : { ...o, mobil });
      const vzorNm = VZORY.find((v) => v.id === o.vzor).nm;
      const cena = await p.evaluate(() => window.__lcdVclass.cenaSpolu());
      over(cena === o.cena, o.velkost + ": cena " + cena);
      over((await p.textContent("#lcd-vclass .lv-c2")).replace(/\s/g, "") === String(o.cena) + "€", "súhrn ceny");
      over((await p.textContent("#lcd-vclass .lv-cta")).trim() === "Vložte do košíka", "tlačidlo hotového výberu");
      over(await p.isVisible("#lcd-vclass .lv-cc"), "cenová karta po dokončení výberu");
      over((await p.textContent("#lcd-vclass .lv-cc b")).replace(/\s/g, "") === String(o.cena) + "€", "naša cena na karte");
      if (arg("ladenie")) console.log(JSON.stringify(await p.evaluate(() => ["#lcd-vclass-nakres", ".p-image-wrapper", ".p-info-wrapper", ".row.product-top", "#product-detail-form", ".p-detail-inner"].map((q) => { const e = document.querySelector(q), r = e.getBoundingClientRect(), c = getComputedStyle(e); return q + " y" + Math.round(r.top + scrollY) + " h" + Math.round(r.height) + " pos:" + c.position + " top:" + c.top + " mt:" + c.marginTop + " tr:" + c.transform.slice(0, 40) + " inl:" + (e.getAttribute("style") || "").slice(0, 90) + " x" + Math.round(r.left) + " w" + Math.round(r.width) + " scr:" + Math.round(scrollY); }))));
      if (sirka > 991) over(await p.evaluate(() => { const n = document.getElementById("lcd-vclass-nakres").getBoundingClientRect(), r = document.querySelector(".row.product-top").getBoundingClientRect(); return n.bottom <= r.bottom + 1 && n.top >= r.top - 1; }), "kresba ostáva v stĺpci, nejde pod pätu");
      over((await p.$$("#lcd-vclass .lv-kr.lv-ho")).length === 6, "všetkých 6 krokov hotových");
      over(await p.evaluate(() => getComputedStyle(document.querySelector(".p-detail-inner > .row.product-top") || document.querySelector(".p-detail-inner > *")).visibility === "visible"), "po spustení je obsah viditeľný");
      const sucet = await p.evaluate(() => [...document.querySelectorAll("#product-detail-form select.surcharge-parameter")].reduce((s, e) => s + (e.value ? Number(e.options[e.selectedIndex].getAttribute("data-surcharge-final-price")) : 0), Number(document.querySelector('meta[itemprop="price"]').content)));
      over(sucet === o.cena, o.velkost + ": súčet príplatkov Shoptetu " + sucet + " ≠ " + o.cena);
      over(/mercedes-v-class-film-3-(pc|tel)\.jpg/.test(await p.getAttribute("#lcd-vclass-hero video", "poster")), "hore je video z V Class");
      over(!(await p.$("#lcd-vclass-hero .lh-t")), "hore nie je rad malých fotiek");
      if (i === 0) {
        await p.waitForSelector('[data-lcd-sekcia="vclass-prehliadka"] .vp-b', { timeout: 15000 });
        over((await p.$$('[data-lcd-sekcia="vclass-prehliadka"] .vp-b')).length === 5, "pôdorys má 5 miest");
        await p.click('[data-lcd-sekcia="vclass-prehliadka"] .vp-b:nth-of-type(1)').catch(() => {});
        await p.click('[data-lcd-sekcia="vclass-prehliadka"] .vp-chips button:nth-child(5)'); await p.waitForTimeout(120);
        over(/Rohož do kufra/.test(await p.textContent('[data-lcd-sekcia="vclass-prehliadka"] .vp-k.on')), "prehliadka prepne miesto");
        await p.click('[data-lcd-sekcia="vclass-prehliadka"] [data-vz="stripe"]'); await p.waitForTimeout(250);
        over(/Stripe Line/.test(await p.textContent('[data-lcd-sekcia="vclass-prehliadka"] .vp-far-n')), "prehliadka mení vzor setu");
        over((await p.textContent('[data-lv-cena="komplet-L"]')).replace(/\s/g, "") === "1400€", "cena kompletného setu v obsahu");
        over(!!(await p.$("#lcd-vclass-faq-data")), "otázky pre vyhľadávače");
        over(!!(await p.$('[data-lcd-sekcia="vclass-sken"] .vk-3d img')), "modul so skenom má obrázok");
        over((await p.$$('[data-lcd-sekcia="vclass-sken"] [data-p1v-lb-yt]')).length === 3, "modul so skenom má tri videá");
        over((await p.$$('[data-lcd-sekcia="vclass-videa"] [data-p1v-lb-yt]')).length === 9, "sekcia videí má všetky videá");
        over((await p.$$('[data-lcd-sekcia="vclass-galeria"] [data-p1v-lb-foto]')).length === 43, "galéria má 43 fotiek so zväčšením");
        over((await p.$$('[data-lcd-sekcia="vclass-galeria"] .vl-sip')).length === 2, "galéria má šípky");
        over(!!(await p.$('[data-lcd-sekcia="vclass-kontakt"] form input[name="email"]')), "kontaktný formulár");
        over(/Andrej J\./.test(await p.textContent('[data-lcd-sekcia="vclass-zakaznik"] blockquote')) && !!(await p.$('[data-lcd-sekcia="vclass-zakaznik"] [data-p1v-lb-yt="fQWIIpz9gWc"]')), "skúsenosť zákazníka s videom");
        over(!!(await p.$('[data-lcd-sekcia="c-vzorky"]')) && !!(await p.$('[data-lcd-sekcia="c-domov"]')), "moduly vzorky a Čo Vám príde domov");
        over(await p.evaluate(() => { const k = document.querySelector('[data-lcd-sekcia="vclass-verzie"] canvas'); return !!k && k.width > 100; }), "kresba verzie auta");
        // odkazy a otvorenie otázky, ktoré na testovacej stránke nesmú zlyhať
        await p.click('.p1v-faq-q'); await p.waitForTimeout(600);
        over(await p.evaluate(() => document.querySelector(".p1v-faq-a").getBoundingClientRect().height > 20), "otázka sa otvorí");
        await p.click('.p1v-faq-q'); await p.waitForTimeout(300);
        await p.click('[data-lcd-sekcia] a[data-lv-velkost="' + o.velkost + '"]'); await p.waitForTimeout(1800);
        over(await p.evaluate(() => { const y = document.getElementById("lcd-vclass-cesta").getBoundingClientRect().top; return y > 40 && y < 200; }), "odkaz Vybrať posunie ku krokom: " + await p.evaluate(() => Math.round(document.getElementById("lcd-vclass-cesta").getBoundingClientRect().top)));
        if (snimky) {
          const H = await p.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0; y < H; y += 450) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(90); }
          await p.waitForTimeout(500);
          await p.screenshot({ path: join(snimky, `${nazov}-${sirka}-cela.png`), fullPage: true });
        }
      }
      over((await p.evaluate(() => { const r = document.getElementById("lcd-vclass-hero").getBoundingClientRect(); return Math.abs(r.left) < 2 && Math.abs(r.width - document.querySelector(".overall-wrapper").getBoundingClientRect().width) < 1; })), "fotky na celú šírku");
      const kres = await p.evaluate(() => [...document.querySelectorAll("#lcd-vclass-nakres canvas")].map((k) => { const d = k.getContext("2d").getImageData(0, 0, k.width, k.height).data; let n = 0; for (let i = 3; i < d.length; i += 40) if (d[i] > 20) n++; return n; }));
      over(kres.length === 2 && kres.every((n) => n > 500), "kresba predku aj zadku " + kres);
      if (snimky) await p.screenshot({ path: join(snimky, `${nazov}-${sirka}-${o.velkost}.png`), fullPage: sirka < 500 });
      over(chyby.length === 0, "chyby pred košíkom: " + chyby.join(" | "));
      const predKosikom = chyby.length;
      await p.click("#lcd-vclass .lv-cta"); await p.waitForTimeout(500);
      over(!!post, "POST do košíka");
      const q = new URLSearchParams(post || "");
      over(q.get("productId") === "646", "productId");
      over(q.get("priceId") === "68434", "priceId");
      const ma = { "Rok výroby": o.rok, Volant: o.volant, "Stred medzi sedadlami": o.stred, "Bočné dvere": o.dvere, "Sedadlá v 2. a 3. rade": sedadlaText(o.rad2, o.rad3), "Stolček vzadu": o.stolcek, "Zásuvky pod sedadlami": o.zasuvky, "Vzor a farba 1. vrstvy": vzorNm + " – " + o.farba, "Farba 2. vrstvy": o.lux ? "Lux Color " + o.lux : BEZ_DRUHEJ, "Rozloženie": o.roz || (o.rozl === "P" ? ROZ_PREDOK : rozSet(o.velkost)), "Rohož do kufra": o.roh || (o.rohoz === "ano" ? ROHOZ[0] : ROHOZ[1]) };
      const menaBoxov = o.boxy.length === 1 ? ["Box do kufra"] : ["Prvý box z dvoch", "Druhý box z dvoch"];
      o.boxy.forEach((v, i) => { ma[menaBoxov[i]] = BOXY.find((b) => b.v === v).t; });
      if (o.boxy.length) ma["Farba boxov do kufra"] = o.boxFarba;
      [[451, "Box do kufra"], [454, "Prvý box z dvoch"], [457, "Druhý box z dvoch"]].forEach(([id, m]) => { if (!ma[m]) over(!q.get(`surchargeParameterValueId[${id}]`), "nevybraný box je prázdny: " + m); });
      for (const m of Object.keys(ma)) { const id = P.find((x) => x[1] === m)[0]; over(q.get(`surchargeParameterValueId[${id}]`) === hodnotaId(m, ma[m]), m + " = " + ma[m] + " (je " + q.get(`surchargeParameterValueId[${id}]`) + ")"); }
      over((await p.evaluate(() => sessionStorage.getItem("model"))) === `Mercedes-Benz ${{ M: "V Class M (compact 4895 mm)", L: "V Class L (long 5140 mm)", XL: "V Class XL (Extra Long 5370 mm)" }[o.velkost]} ${o.rok}`, "auto do poznámky objednávky");
      // zrušený POST testu natívny Shoptet hlási ako odmietnutý sľub, to nie je chyba konfigurátora
      over(chyby.slice(predKosikom).every((t) => /in promise|\[object Object\]|statusText/.test(t)), "chyby po košíku: " + chyby.slice(predKosikom).join(" | "));
      await c.close();
    }
    await b.close();
  }
}
console.log(`OK ${ok}, zle ${zle}`);
process.exit(zle ? 1 : 0);
