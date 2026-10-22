// Snímky krokov boxu 616 v novom vzhľade (?novy=1) pre ľudskú kontrolu: krok 2 (dlaždice počtu) a krok 3 (kresba boxu
// vo farbe z kroku 1). Naživo (čo je v SK admine), nič neodosiela (POST košíka sa nevolá — nič sa neklikne do košíka).
//   node tools/snimky-box-kroky.mjs <priečinok> [--sirka 390,1280]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";

const arg = process.argv.slice(2);
const kam = arg[0];
if (!kam) throw new Error("použitie: node tools/snimky-box-kroky.mjs <priečinok> [--sirka 390,1280]");
const iS = arg.indexOf("--sirka");
const sirky = (iS > -1 ? arg[iS + 1] : "390,1280").split(",").map(Number);
mkdirSync(kam, { recursive: true });
const URL_BOX = "https://www.luxurycardesign.sk/luxusny-boxi-do-kufra/?novy=1";
const SKRY = `(function () { var s = document.createElement("style"); s.textContent = "body > [class*='cookie'],body > [id*='cookie'],body > [class*='luxia'],body > [id*='luxia'],body > [class*='Luxia']{display:none!important}"; document.head.appendChild(s); })()`;

async function posunNa(k, sel) {
  await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (e) { e.scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy(0, -86); } })()`);
  await pauza(700);
}
async function farba(k, re) {
  return k.ev(`(function () { var b = Array.prototype.find.call(document.querySelectorAll("#product-detail-form .lcd1v-k-farba > .options-wrap > .option-button"), function (x) { return ${re}.test(x.textContent.replace(/\\s+/g, " ")); }); if (b) b.click(); return b ? b.textContent.replace(/\\s+/g, " ").trim() : null; })()`);
}
async function otvor(k, krok) {
  await k.ev(`(function () { var e = document.querySelector("#product-detail-form .lcd1v-k-${krok}"); if (e && !e.classList.contains("active")) e.querySelector(":scope > .lcd1v-hd").click(); })()`);
  await pauza(900);
}

const ch = await spustiChrome();
try {
  for (const sirka of sirky) {
    const k = await ch.novaKarta({ sirka, vyska: sirka < 768 ? 844 : 900 });
    await k.chod(URL_BOX);
    await k.ev(SKRY);
    for (let i = 0; i < 40 && !(await k.ev(`!!document.querySelector("#product-detail-form .lcd1v-bxp-ks")`)); i++) await pauza(500);
    const f1 = await farba(k, "/Čierna.*Červen/i");
    await pauza(1200);
    await otvor(k, "pocet");
    await posunNa(k, "#product-detail-form .lcd1v-k-pocet");
    await k.snimka(join(kam, `krok2-1box-${sirka}.png`));
    await k.ev(`document.querySelector('#product-detail-form .lcd1v-bxp-ks[data-ks="2"]').click()`);
    await pauza(900);
    await posunNa(k, "#product-detail-form .lcd1v-k-pocet");
    await k.snimka(join(kam, `krok2-2boxy-${sirka}.png`));
    await otvor(k, "velkost");
    await posunNa(k, "#product-detail-form .lcd1v-bxp-velk");
    await k.snimka(join(kam, `krok3-cervene-${sirka}.png`));
    for (const [meno, re] of [["kava", "/Hnedá káva/i"], ["bezova", "/Béžová|Šedá/i"], ["biele", "/Čierna.*Biel/i"]]) {
      await otvor(k, "farba");
      await farba(k, re);
      await pauza(900);
      await otvor(k, "velkost");
      await posunNa(k, "#product-detail-form .lcd1v-bxp-velk");
      await k.snimka(join(kam, `krok3-${meno}-${sirka}.png`));
    }
    const info = await k.ev(`(function () { var v = document.querySelector(".lcd1v-bxp-velk"); return { farba: v && v.getAttribute("data-lcd1v-farba"), od: Array.prototype.map.call(document.querySelectorAll(".lcd1v-bxp-ks"), function (b) { return b.textContent.replace(/\\s+/g, " ").trim(); }), pretek: document.documentElement.scrollWidth > innerWidth + 1 }; })()`);
    console.log(sirka, f1, JSON.stringify(info));
    await k.zavri();
  }
} finally {
  ch.zavri();
}
