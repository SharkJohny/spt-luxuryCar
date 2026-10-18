// Snímky pre ľudskú kontrolu (naživo, ?novy=1, nič neodosiela — košík sa nestláča):
//   - okno „Vaše boxy do kufra“ na jednovrstvových 598 s kresbou boxov (2 boxy, farba čierna/červené šitie a béžová),
//   - krok „Farba 2. vrstvy“ na dvojvrstvových 601 so zvolenou odporúčanou vzorkou (hviezdička + zelený rám).
//   node tools/snimky-okno-boxov.mjs <priečinok> [--sirka 390,1280]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";
import { vytvorT } from "./test-1v/pomocnik.mjs";
import { novy as kroky } from "./test-1v/ovladac-kroky.mjs";

const arg = process.argv.slice(2);
const kam = arg[0];
if (!kam) throw new Error("použitie: node tools/snimky-okno-boxov.mjs <priečinok> [--sirka 390,1280]");
const iS = arg.indexOf("--sirka");
const sirky = (iS > -1 ? arg[iS + 1] : "390,1280").split(",").map(Number);
mkdirSync(kam, { recursive: true });
const AUTO = { znacka: "Audi", model: "A6", rok: "2015", typ: "Combi" };
const F = "#product-detail-form";
const SKRY = `(function () { var s = document.createElement("style"); s.textContent = "body > [class*='cookie'],body > [id*='cookie'],body > [class*='luxia'],body > [id*='luxia'],body > [class*='Luxia']{display:none!important}"; document.head.appendChild(s);
  // bublina chatu (fixná, mimo formulára) — len pre snímku
  setInterval(function () { Array.prototype.forEach.call(document.querySelectorAll("body *"), function (e) { if (!e.closest("#product-detail-form") && /Začať konverzáciu|Sme práve online/.test(e.textContent || "") && getComputedStyle(e).position === "fixed") e.style.display = "none"; }); }, 1000); })()`;

async function otvor(k, url) {
  await k.chod(url);
  await k.ev(SKRY);
  for (let i = 0; i < 40 && !(await k.ev(`document.body.classList.contains("lcd-1v") && !!document.querySelector("${F} .lcd1v-krok")`)); i++) await pauza(500);
  await pauza(1500);
}
const klikJs = (k, sel, i = 0) => k.ev(`(function () { var e = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; if (e) e.click(); return !!e; })()`);

const ch = await spustiChrome();
try {
  for (const sirka of sirky) {
    // ---- 598: okno boxov
    let k = await ch.novaKarta({ sirka, vyska: sirka < 768 ? 844 : 900 });
    let t = vytvorT(k, { novy: true });
    await otvor(k, "https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line/?novy=1");
    await kroky.vyberAuto(t, AUTO);
    await pauza(800);
    await k.ev(`(function () { var h = document.querySelector("${F} .lcd1v-k-boxy > .lcd1v-hd"); if (h && !h.closest(".lcd1v-krok").classList.contains("active")) h.click(); })()`);
    await pauza(900);
    await klikJs(k, `${F} .upsale-buttons.boxs .lcd1v-kb__karta[data-boxy="2"]`);
    await pauza(1500);
    const idFB = await t.idParametra("farbaBoxov");
    const SEL_F = `${F} .upsale-Banner.lcd1v-kb .box-config .parameter-wrap.parameter-${idFB} .option-button`;
    const farby = await k.ev(`(function () { var s = document.querySelector('${F} select[data-parameter-id="${idFB}"]'); return Array.prototype.map.call(document.querySelectorAll(${JSON.stringify(SEL_F)}), function (b) { var v = b.getAttribute("data-value"), o = s && Array.prototype.find.call(s.options, function (x) { return x.value === v; }); return o ? o.textContent.replace(/\\s+/g, " ").trim() : "?"; }); })()`);
    // čierna s červeným šitím, béžová KOŽA (nie čierna s béžovým šitím), hnedá káva
    for (const [meno, re] of [["cervene", /Čierna.*šitia:\s*Červen/i], ["bezova", /kože\s*:\s*Béžov/i], ["kava", /Hnedá káva/i]]) {
      const i = farby.findIndex((x) => re.test(x));
      if (i > -1) await klikJs(k, SEL_F, i);
      await pauza(900);
      const stav = await k.ev(`(function () { var o = document.querySelector("${F} .upsale-Banner.lcd1v-kb .box-config"), c = o && getComputedStyle(o); var s = document.querySelector('${F} select[data-parameter-id="${idFB}"]'); return { vybrata: s && s.selectedIndex > -1 ? s.options[s.selectedIndex].textContent.replace(/\\s+/g, " ").trim() : null, koza: c && c.getPropertyValue("--bxp-lth").trim(), sitie: c && c.getPropertyValue("--bxp-st").trim() }; })()`);
      console.log(sirka, meno, i, JSON.stringify(stav));
      await k.ev(`(function () { var o = document.querySelector("${F} .upsale-Banner.lcd1v-kb .box-config"); var v = o && o.querySelector(".lcd1v-bx-velk"); (v || o).scrollIntoView({ block: "start", behavior: "instant" }); })()`);
      await pauza(600);
      await k.snimka(join(kam, `598-okno-boxov-${meno}-${sirka}.png`));
    }
    console.log(sirka, "598 farby v okne:", JSON.stringify(farby.slice(0, 12)));
    await k.zavri();

    // ---- 601: farba 2. vrstvy (odporúčaná vzorka)
    k = await ch.novaKarta({ sirka, vyska: sirka < 768 ? 844 : 900 });
    t = vytvorT(k, { novy: true });
    await otvor(k, "https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-elite-diamond-line/?novy=1");
    await kroky.vyberAuto(t, AUTO);
    await kroky.vyberFarbu(t, { index: 1 });
    await pauza(800);
    await k.ev(`(function () { var h = document.querySelector("${F} .lcd1v-k-farba2 > .lcd1v-hd"); if (h && !h.closest(".lcd1v-krok").classList.contains("active")) h.click(); })()`);
    await pauza(900);
    await klikJs(k, `${F} .lcd1v-f2-odporucana`);
    await pauza(900);
    await k.ev(`(function () { var e = document.querySelector("${F} .lcd1v-k-farba2"); if (e) { e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -80); } })()`);
    await pauza(600);
    await k.snimka(join(kam, `601-farba2-odporucana-${sirka}.png`));
    await k.zavri();
  }
} finally {
  ch.zavri();
}
