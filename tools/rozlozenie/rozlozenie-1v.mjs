// Kontrola rozloženia 1V produktov (?novy=1) bez klikania: celá stránka po kúskoch okna na mnohých rozmeroch.
//   node rozlozenie-1v.mjs <out> [produkty: all | 598,616,...] [rozmery] [zdroj "" | lokal | <sha7> = assets/v z nového sha]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spustiChrome, pauza } from "../test-1v/cdp.mjs";
import { ANALYZA } from "./analyza-rozlozenia.mjs";
const [out, prodArg = "all", rozArg, zdroj = ""] = process.argv.slice(2);
const P = {
  598: "luxusne-autokoberce-dragonskin-diamond-line", 610: "luxusne-autokoberce-dragonskin-hexa-line", 613: "luxusne-autokoberce-dragonskin-stripe-line",
  601: "luxusne-autokoberce-dragonskin-elite-diamond-line", 604: "luxusne-autokoberce-dragonskin-elite-hexa-line", 607: "luxusne-autokoberce-dragonskin-elite-stripe-line",
  619: "luxusny-koberced-do-kufra-dragonskin-klasik", 622: "luxusny-koberced-do-kufra-dragonskin-klasik-hexa", 625: "luxusny-koberced-do-kufra-dragonskin-klasik-stripe",
  628: "luxusny-koberced-do-kufra-dragonskin-premium", 631: "luxusny-koberced-do-kufra-dragonskin-premium-hexa", 634: "luxusny-koberced-do-kufra-dragonskin-premium-stripe",
  616: "luxusny-boxi-do-kufra", 637: "vzorkovnik-dragonskin---objednavka-vzoriek",
};
const produkty = prodArg === "all" ? Object.keys(P) : prodArg.split(",");
const ROZMERY = (rozArg || "320x568m,360x780m,390x844m,430x932m,667x375m,844x390m,768x1024t,1024x768t,1180x820t,1280x720,1440x900,1920x1080,2560x1440")
  .split(",").map((s) => { const m = s.match(/^(\d+)x(\d+)([mt]?)$/); return { w: +m[1], h: +m[2], druh: m[3] || "p", tag: s }; });
const LOK = "" + (process.env.LCD_LOKAL || "lokal") + "/";
mkdirSync(out, { recursive: true });
const ch = await spustiChrome();
const vysledok = { rozmery: [] };
for (const pid of produkty) for (const R of ROZMERY) {
  const tag = pid + "-" + R.tag, dir = join(out, tag); mkdirSync(dir, { recursive: true });
  const mobil = R.druh === "m", dotyk = R.druh !== "p";
  const k = await ch.novaKarta({ sirka: R.w, vyska: R.h, mobil });
  const r = { rozmer: tag, stavy: [], chyby: [] };
  try {
    if (dotyk && !mobil) await k.posli("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await k.posli("Network.setBlockedURLs", { urls: ["*google-analytics.com/g/collect*", "*facebook.com/tr*", "*clarity.ms/collect*"] });
    if (zdroj === "lokal") {
      k.na("Fetch.requestPaused", async (p) => {
        const f = p.request.url.split("?")[0].split("/").pop();
        if (/\/assets\/v\/[0-9a-f]{7}\/(js|css)\//.test(p.request.url) && /^(luxuryCar\.(js|css)|lcd-[a-z0-9-]+\.js)$/.test(f)) {
          try { return await k.posli("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: f.endsWith(".css") ? "text/css" : "application/javascript" }, { name: "Access-Control-Allow-Origin", value: "*" }], body: readFileSync(LOK + f).toString("base64") }); } catch (e) {}
        }
        await k.posli("Fetch.continueRequest", { requestId: p.requestId });
      });
      await k.posli("Fetch.enable", { patterns: [{ urlPattern: "*luxuryCar/assets/v/*" }] });
    }
    if (zdroj && zdroj !== "lokal") {
      // sha mód (Shoptet úpravy 25. 10. 2026): všetko z CDN assets/v/<živý sha>/ presmerovať na nový sha (pred prepnutím adminu)
      k.na("Fetch.requestPaused", async (p) => {
        const u = p.request.url.replace(/\/assets\/v\/[0-9a-f]{7}\//, "/assets/v/" + zdroj + "/").replace(/([?&]v=)[0-9a-f]{7}/, "$1" + zdroj);
        try { await k.posli("Fetch.continueRequest", u === p.request.url ? { requestId: p.requestId } : { requestId: p.requestId, url: u }); } catch (e) {}
      });
      await k.posli("Fetch.enable", { patterns: [{ urlPattern: "*luxuryCar/assets/v/*" }] });
    }
    await k.posli("Page.navigate", { url: "https://www.luxurycardesign.sk/" + P[pid] + "/?novy=1&t=" + Date.now() });
    for (let i = 0; i < 120 && !(await k.ev(`document.readyState==="complete" && document.body.classList.contains("lcd-1v")`).catch(() => false)); i++) await pauza(500);
    await pauza(2500);
    await k.ev(`(function(){var b=Array.prototype.find.call(document.querySelectorAll("button, a"),function(e){return e.offsetParent&&/^\s*Odmietnu/i.test(e.textContent||"")});if(b)b.click();})()`);
    await pauza(600);
    await k.ev(`(function(){var st=document.createElement("style");st.textContent="body iframe{visibility:hidden!important} #provesrc-notification-container{display:none!important}";document.head.appendChild(st);document.documentElement.style.scrollBehavior="auto";})()`);
    const H = await k.ev(`document.documentElement.scrollHeight`);
    const korene = ["#product-detail-form", ".p-detail-inner", '[data-lcd-cast^="p1v"]', ".lcd1v-lista"];
    for (let y = 0, i = 0; y < H && i < 70; y += Math.round(R.h * 0.85), i++) {
      await k.ev(`window.scrollTo({top:${y},behavior:"instant"}); true`); await pauza(500);
      const z = { stav: "y" + String(i).padStart(2, "0"), body: [{ bod: "y" + y, obsah: [] }] };
      for (const sel of korene) {
        const n = await k.ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
        for (let j = 0; j < n; j++) {
          await k.ev(`(function(){var e=document.querySelectorAll(${JSON.stringify(sel)})[${j}];e.setAttribute("data-x-k","${i}-${sel.length}-${j}");})()`);
          const a = await k.ev(`${ANALYZA}('[data-x-k="${i}-${sel.length}-${j}"]', ${dotyk})`);
          if (a) z.body[0].obsah.push(a);
        }
      }
      const pocet = z.body[0].obsah.reduce((s, x) => s + x.nalezy.length + x.orezane.length + x.pretecenie.length + x.mimo.length + (x.vodorovne ? 1 : 0), 0);
      if (pocet) { const sn = await k.posli("Page.captureScreenshot", { format: "jpeg", quality: 55 }); writeFileSync(join(dir, z.stav + ".jpg"), Buffer.from(sn.data, "base64")); z.body[0].snimka = tag + "/" + z.stav + ".jpg"; }
      r.stavy.push(z);
    }
    r.jsChyby = k.chyby.filter((c) => !/googletagmanager|facebook|hotjar|clarity|tiktok|doubleclick|google-analytics|net::|ERR_|provesrc|luxia/i.test(c.zdroj + c.text)).map((c) => c.text.slice(0, 160));
  } catch (e) { r.chyby.push("VÝNIMKA " + String(e && e.stack || e).slice(0, 300)); }
  vysledok.rozmery.push(r);
  writeFileSync(join(out, "vysledok.json"), JSON.stringify(vysledok, null, 1));
  console.log(tag + ": kúskov " + r.stavy.length + ", chyby " + r.chyby.length);
  await k.zavri();
}
await ch.zavri(); process.exit(0);
