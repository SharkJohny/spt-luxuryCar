#!/usr/bin/env node
/**
 * test-objednavka-polia.mjs — auto, volant, miesta a dvere musia ísť do objednávky aj bez data.json (kniha § 10.41).
 *
 * Prečo: objednávky 1820260079 (5. 11. 2026) a 1120260090 (11. 10. 2026) prišli bez auta aj bez varchar1–3. Všetko
 * bežalo až v callbacku $.getJSON(data.json), takže pomalý alebo zlyhaný súbor nechal formulár bez našich polí.
 *
 * Živý web, NIČ sa neodosiela: pridá set do košíka v izolovanom prehliadači, prejde na krok 2 a poznámku overí priamym
 * volaním shoptet.custom.postSuccessfulValidation. Košík zanikne so zatvorením kontextu.
 *
 *   node tools/test-objednavka-polia.mjs --pw <file:///.../playwright/index.mjs>            lokálny build (esbuild ako CI)
 *   node tools/test-objednavka-polia.mjs --pw <...> --sha <7 znakov>                        súbor z CDN assets/v/<sha>/
 *   voliteľne: --prehliadace chromium,webkit,firefox  --weby sk,cz
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const arg = (n, d) => { const i = process.argv.indexOf("--" + n); return i > 0 ? process.argv[i + 1] : d; };
const pwUrl = arg("pw");
if (!pwUrl) { console.error("chýba --pw"); process.exit(2); }
const sha = arg("sha");
const prehliadace = arg("prehliadace", "chromium,webkit,firefox").split(",");
const weby = arg("weby", "sk,cz").split(",");

const WEB = {
  sk: { host: "https://www.luxurycardesign.sk", produkt: "/luxusne-autokoberce-dragonskin-diamond-line/" },
  cz: { host: "https://www.luxurycardesign.cz", produkt: "/luxusne-autokoberce-dragonskin-diamond-line/" },
};
const AUTO = [["Brand", "BMW"], ["Model", "X5"], ["Year", "2021"], ["carType", "SUV"], ["model", "BMW X5 2021 SUV"],
  ["wheelPosition", "right"], ["seatPosition", "pass-7"], ["doorPosition", "doors-5"]];
const BLOK = /googletagmanager|google-analytics|doubleclick|facebook|tiktok|hotjar|clarity\.ms|ecomail|smartsupp|bing\.com|sklik|seznam|luxia/i;
const BUNDEL = /\/eshopy\/luxuryCar\/assets\/v\/([0-9a-f]{7})\/js\/luxuryCar\.js/;
const DATA = /\/upload\/data\.json/;

let lokalny = null, tmp = null;
if (!sha) {
  tmp = mkdtempSync(join(tmpdir(), "lcd-polia-"));
  const out = join(tmp, "luxuryCar.js");
  const r = spawnSync(process.execPath, ["node_modules/esbuild/bin/esbuild", "assets/js/main.js", "--bundle", "--outfile=" + out,
    "--format=iife", "--loader:.jsx=jsx", "--legal-comments=none", "--minify", "--log-level=error"], { stdio: "inherit" });
  if (r.status !== 0) process.exit(2);
  lokalny = readFileSync(out);
}

const pw = await import(pathToFileURL(pwUrl.replace(/^file:\/+/, "")).href);
let zle = 0;
const pis = (ok, txt) => { if (!ok) zle++; console.log((ok ? "OK   " : "ZLE  ") + txt); };

async function naKrok2(p, w) {
  await p.goto(w.host + w.produkt, { waitUntil: "load" });
  await p.waitForTimeout(2500);
  // CZ nepustí set bez príplatkových parametrov: vyberie sa prvá možnosť v každom výbere formulára.
  await p.evaluate(async (auto) => {
    for (const [k, v] of auto) sessionStorage.setItem(k, v);
    const f = document.querySelector("form.p-to-cart-block, form[action*='addCartItem'], #product-detail-form");
    const variant = f.querySelector("select[name^='parameterValueId']");
    if (variant) {
      variant.value = [...variant.options].find((o) => o.value).value;
      variant.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 1500));
    }
    const fd = new FormData(f);
    f.querySelectorAll("select[name]").forEach((v) => {
      const o = [...v.options].find((x) => x.value);
      if (o && !fd.get(v.name)) fd.set(v.name, o.value);
    });
    const b = new URLSearchParams();
    for (const [k, v] of fd) if (k && typeof v === "string") b.append(k, v);
    b.set("amount", "1");
    await fetch("/action/Cart/addCartItem/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Requested-With": "XMLHttpRequest" }, body: b.toString(), credentials: "same-origin" });
  }, AUTO);
  await p.goto(w.host + "/objednavka/krok-1/?opc=0", { waitUntil: "load" });
  await p.waitForTimeout(2000);
  await p.evaluate(() => { document.querySelector("input[name=shippingId]")?.click(); });
  await p.waitForTimeout(900);
  await p.evaluate(() => { document.querySelector("input[name=billingId]")?.click(); });
  await p.waitForTimeout(900);
}

async function stav(p) {
  return p.evaluate(() => {
    const f = document.getElementById("order-form");
    if (f) shoptet.custom.postSuccessfulValidation(f);
    return {
      varchar: ["varchar1", "varchar2", "varchar3"].map((n) => document.querySelector(`[name=${n}]`)?.value ?? null),
      remark: document.getElementById("remark")?.value ?? null,
      krok2: !!document.querySelector(".id--17"),
    };
  });
}

for (const eng of prehliadace) {
  for (const web of weby) {
    for (const bezDat of [true, false]) {
      const b = await pw[eng].launch();
      const ctx = await b.newContext({ viewport: { width: 1366, height: 800 } });
      let blokujData = false;
      await ctx.route("**/*", async (r) => {
        const u = r.request().url();
        if (BLOK.test(u)) return r.abort();
        if (blokujData && DATA.test(u)) return r.abort();
        const m = BUNDEL.exec(u);
        if (m && lokalny) return r.fulfill({ status: 200, contentType: "application/javascript", body: lokalny });
        if (m && sha && m[1] !== sha) return r.continue({ url: u.replace("/assets/v/" + m[1] + "/", "/assets/v/" + sha + "/") });
        return r.continue();
      });
      const p = await ctx.newPage();
      const chyby = [];
      p.on("pageerror", (e) => chyby.push(String(e.message).slice(0, 120)));
      const nazov = `${eng} ${web} ${bezDat ? "bez data.json" : "s data.json"}`;
      try {
        await naKrok2(p, WEB[web]);
        blokujData = bezDat;
        await p.click("#orderFormButton", { timeout: 15000 });
        await p.waitForURL(/krok-2/, { timeout: 20000 });
        await p.waitForTimeout(3500);
        const s = await stav(p);
        const ok = s.krok2 && s.varchar.join() === "right,pass-7,doors-5" && String(s.remark).includes("model: BMW X5 2021 SUV") && !chyby.length;
        pis(ok, `${nazov} | polia ${s.varchar.join()} | poznámka ${JSON.stringify(s.remark)}${chyby.length ? " | chyby " + chyby.join(" ; ") : ""}`);
      } catch (e) {
        pis(false, `${nazov} | ${String(e.message).split("\n")[0].slice(0, 140)}`);
      }
      await b.close();
    }
  }
}
if (tmp) rmSync(tmp, { recursive: true, force: true });
console.log(zle ? `VYSLEDOK ZLE ${zle}` : "VYSLEDOK OK");
process.exit(zle ? 1 : 0);
