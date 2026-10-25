// Kontrola rozloženia kamiónov SK 640 ?novy=1 na mnohých zariadeniach (25. 10. 2026, Michal: „optimalizácie na rôzne zariadenia“).
//   node rozlozenie-kamion.mjs <out> [zdroj: "" = živý | lokal | <sha>] [rozmery 390x844m,1024x768t,...] [--bez-obsahu]
// Každý rozmer: celý konfigurátor reálnymi klikmi (vozidlo -> ... -> prehľad, aj chyba, vlastná kombinácia tapacíru,
// rôzne nášivky) a v každom stave nálezy v okne: prekryté texty, text/objekt, pretečenie, orezanie, vodorovný posuvník,
// prvky mimo okna, malé dotykové ciele (dotyk), tlačidlo zakryté lištou, mierka písma (pismo-kamion.mjs).
// Potom obsah pod konfigurátorom po kúskoch okna. Výstup: <out>/vysledok.json + <out>/<rozmer>/<stav>.jpg
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spustiChrome, pauza } from "../test-1v/cdp.mjs";
import { pismoVyraz, ROLY_KONFIGURATOR, ROLY_OBSAH, ROLY_SPOLOCNE } from "../test-1v/pismo-kamion.mjs";

const arg = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const BEZ_OBSAHU = process.argv.includes("--bez-obsahu");
const [out, zdroj = "", rozArg] = arg;
const LOK = "" + (process.env.LCD_LOKAL || "lokal") + "/";
// m = telefón (mobilný UA + dotyk), t = tablet (UA PC ako iPad + dotyk), bez písmena = PC (myš)
const ROZMERY = (rozArg || "320x568m,360x640m,360x780m,375x667m,390x844m,412x915m,430x932m,568x320m,667x375m,844x390m,932x430m," +
  "768x1024t,820x1180t,1024x768t,1180x820t,1024x1366t,1100x700,1280x720,1366x768,1440x900,1536x864,1920x1080,2560x1440")
  .split(",").map((s) => { const m = s.match(/^(\d+)x(\d+)([mt]?)$/); return { w: +m[1], h: +m[2], druh: m[3] || "p", tag: s }; });
mkdirSync(out, { recursive: true });

const ANALYZA = String.raw`((sel, dotyk) => {
  const vw = document.documentElement.clientWidth, vh = innerHeight;
  const sec = document.querySelector(sel); if (!sec) return null;
  const DEKOR = "script,style,noscript,[aria-hidden=true] svg";
  const viditelny = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.15) return false;
      if (cs.position === "absolute" && (cs.clip !== "auto" || /inset|rect/.test(cs.clipPath))) return false;
      if (cs.overflow !== "visible") { const q = e.getBoundingClientRect(); if (q.width <= 2 || q.height <= 2) return false; } } return true; };
  // zámerná vrstva nad fotkou (štítok, cena, bodka, pozadie CTA, úvodzovka): prvok alebo predok do 3 úrovní je absolute
  const nadFotkou = (el) => { for (let e = el, i = 0; e && e !== sec && i < 4; e = e.parentElement, i++) { const p = getComputedStyle(e).position; if (p === "absolute" || p === "fixed") return true; } return false; };
  const jeFotka = (el) => el.tagName === "IMG" || el.tagName === "PICTURE" || el.tagName === "VIDEO";
  const orez = (el, r) => { let x1 = r.l, y1 = r.t, x2 = r.r, y2 = r.b;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") { const p = e.getBoundingClientRect();
        x1 = Math.max(x1, p.left); y1 = Math.max(y1, p.top); x2 = Math.min(x2, p.right); y2 = Math.min(y2, p.bottom); } }
    x1 = Math.max(x1, 0); y1 = Math.max(y1, 0); x2 = Math.min(x2, vw); y2 = Math.min(y2, vh);
    return x2 - x1 > 1 && y2 - y1 > 1 ? { l: x1, t: y1, r: x2, b: y2 } : null; };
  const plocha = (a) => Math.max(0, a.r - a.l) * Math.max(0, a.b - a.t);
  const prienik = (a, b) => plocha({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const popis = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += "#" + el.id; const c = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 2); if (c.length) s += "." + c.join("."); const a = el.getAttribute("data-a"); if (a) s += "[" + a + "=" + (el.getAttribute("data-v") || "") + "]"; return s; };
  const cesta = (el) => { const p = []; for (let e = el; e && e !== sec && p.length < 3; e = e.parentElement) p.unshift(popis(e)); return p.join(" > "); };
  const zaokr = (r) => ({ l: Math.round(r.l), t: Math.round(r.t), r: Math.round(r.r), b: Math.round(r.b) });
  // posuvný kontajner (zámerný vodorovný posun) -> obsah mimo okna nie je chyba
  const vPosuvnom = (el) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 2) return true; } return false; };
  const texty = [], orezane = [];
  const tw = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    const txt = n.textContent.replace(/\s+/g, " ").trim(); if (!txt) continue;
    const el = n.parentElement; if (!el || el.closest(DEKOR) || !viditelny(el)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r0 of rg.getClientRects()) {
      if (r0.width < 2 || r0.height < 2) continue;
      if (r0.bottom < 0 || r0.top > vh || r0.right < 0 || r0.left > vw) continue;
      const surovy = { l: r0.left, t: r0.top, r: r0.right, b: r0.bottom };
      const c = orez(el, surovy);
      if (!c) continue;
      const vnutri = { l: Math.max(surovy.l, 0), t: Math.max(surovy.t, 0), r: Math.min(surovy.r, vw), b: Math.min(surovy.b, vh) };
      if (plocha(vnutri) - plocha(c) > 0.25 * plocha(vnutri) && plocha(vnutri) > 40 && !vPosuvnom(el)) orezane.push({ el: cesta(el), text: txt.slice(0, 50), rect: zaokr(surovy), viditelne: zaokr(c) });
      texty.push({ el, rect: c, text: txt.slice(0, 50) });
    }
  }
  const OBJ = "img,svg,button,a.btn,.btn,input,select,[data-a],.kn-tv__mt,.kn-tv__lt";
  const objekty = [];
  for (const el of sec.querySelectorAll(OBJ)) {
    if (el.closest(DEKOR) || !viditelny(el)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const c = orez(el, { l: r.left, t: r.top, r: r.right, b: r.bottom }); if (!c) continue;
    if ((c.r - c.l) > 140 && (c.b - c.t) > 140) continue;
    objekty.push({ el, rect: c });
  }
  const nalezy = [];
  const rodina = (a, b) => a === b || a.contains(b) || b.contains(a);
  for (let i = 0; i < texty.length; i++) for (let j = i + 1; j < texty.length; j++) {
    const a = texty[i], b = texty[j]; if (rodina(a.el, b.el)) continue;
    const p = prienik(a.rect, b.rect); if (p < 12) continue;
    if ((a.el.closest("[aria-hidden=true]") && nadFotkou(a.el)) || (b.el.closest("[aria-hidden=true]") && nadFotkou(b.el))) continue;
    if (p > 0.15 * Math.min(plocha(a.rect), plocha(b.rect))) nalezy.push({ typ: "text-text", a: cesta(a.el) + " „" + a.text + "“", b: cesta(b.el) + " „" + b.text + "“", rect: zaokr(a.rect), px: Math.round(p) });
  }
  for (const t of texty) for (const ob of objekty) {
    if (rodina(t.el, ob.el)) continue;
    const p = prienik(t.rect, ob.rect); if (p < 12) continue;
    if (jeFotka(ob.el) && (nadFotkou(t.el) || nadFotkou(ob.el))) continue;
    if (p > 0.12 * Math.min(plocha(t.rect), plocha(ob.rect))) nalezy.push({ typ: "text-objekt", a: cesta(t.el) + " „" + t.text + "“", b: cesta(ob.el), rect: zaokr(t.rect), px: Math.round(p) });
  }
  for (let i = 0; i < objekty.length; i++) for (let j = i + 1; j < objekty.length; j++) {
    const a = objekty[i], b = objekty[j]; if (rodina(a.el, b.el)) continue;
    const p = prienik(a.rect, b.rect); if (p < 16) continue;
    if ((jeFotka(a.el) || jeFotka(b.el)) && (nadFotkou(a.el) || nadFotkou(b.el))) continue;
    if (p > 0.15 * Math.min(plocha(a.rect), plocha(b.rect))) nalezy.push({ typ: "objekt-objekt", a: cesta(a.el), b: cesta(b.el), rect: zaokr(a.rect), px: Math.round(p) });
  }
  const pretecenie = [], videne = new Set();
  for (const t of texty) {
    const el = t.el; if (videne.has(el)) continue;
    const cs = getComputedStyle(el); if (cs.display === "inline") continue;
    const er = el.getBoundingClientRect(); const rg = document.createRange();
    for (const c of el.childNodes) { if (c.nodeType !== 3 || !c.textContent.trim()) continue; rg.selectNodeContents(c);
      const tr = rg.getBoundingClientRect();
      const von = Math.max(0, er.left - tr.left, tr.right - er.right);
      if (von > 2) { videne.add(el); pretecenie.push({ el: cesta(el), text: t.text.slice(0, 40), box: Math.round(er.width), text_px: Math.round(tr.width), von: Math.round(von) }); break; } }
  }
  // prvky mimo okna (vodorovne), mimo zámerne posuvných pásov
  const mimo = [];
  for (const el of sec.querySelectorAll("*")) {
    if (mimo.length >= 12) break;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh) continue;
    if ((r.right > vw + 1 || r.left < -1) && viditelny(el) && !vPosuvnom(el)) {
      let orezany = false; for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== "visible") { const p = e.getBoundingClientRect(); if (p.right <= vw + 1 && p.left >= -1) { orezany = true; break; } } }
      if (!orezany) mimo.push({ el: cesta(el), l: Math.round(r.left), r: Math.round(r.right) });
    }
  }
  // malé dotykové ciele
  const male = [];
  if (dotyk) for (const el of sec.querySelectorAll("[data-a],button,a[href],select,input:not([type=hidden]),label[for]")) {
    if (!viditelny(el)) continue;
    if (el.tagName === "A" && getComputedStyle(el).display === "inline" && el.parentElement && (el.parentElement.textContent || "").trim().length > (el.textContent || "").trim().length + 3) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > vh) continue;
    if (r.width < 40 || r.height < 36) male.push({ el: cesta(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 30) });
  }
  return { texty: texty.length, nalezy, orezane, pretecenie: pretecenie.slice(0, 20), mimo, male: male.slice(0, 30),
    vodorovne: document.documentElement.scrollWidth > vw + 1 ? document.documentElement.scrollWidth : 0 };
})`;

// tlačidlo Pokračovať / košík zakryté lištou alebo inou fixnou vrstvou v aktuálnom okne
const ZAKRYTE = String.raw`(() => {
  const vh = innerHeight, out = [], y0 = scrollY;
  for (const el of document.querySelectorAll('#lcd1v-kamion .k-krok.is-open [data-a="dalej"], #lcd1v-kamion .k-krok.is-open [data-a="potvrd"], #lcd1v-kamion [data-a="kosik"]')) {
    let r = el.getBoundingClientRect(); if (r.height < 2) continue;
    window.scrollTo({ top: Math.max(0, r.top + scrollY - vh / 2 + r.height / 2), behavior: "instant" }); r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = Math.min(vh - 2, r.top + r.height / 2);
    const h = document.elementFromPoint(x, y);
    if (h && h !== el && !el.contains(h)) { let s = h.tagName.toLowerCase() + (h.id ? "#" + h.id : "") + "." + String(h.className || "").split(" ")[0]; out.push({ tlacidlo: el.getAttribute("data-a") + ":" + (el.getAttribute("data-v") || ""), zakryva: s, y: Math.round(r.top) }); }
  }
  window.scrollTo({ top: y0, behavior: "instant" });
  const l = document.querySelector(".lcd1v-lista"); let lista = null;
  if (l && getComputedStyle(l).display !== "none") { const r = l.getBoundingClientRect(); if (r.height && r.top < vh) lista = Math.round(vh - r.top); }
  return { zakryte: out, lista };
})()`;

const STAV_KROKU = `(() => { const k = document.querySelector("#lcd1v-kamion .k-krok.is-open"); if (!k) return null; const r = k.getBoundingClientRect();
  return { krok: k.getAttribute("data-krok"), top: Math.round(r.top + scrollY), h: Math.round(r.height), hd: Math.round(r.top) }; })()`;

const ch = await spustiChrome();
const vysledok = { zdroj: zdroj || "zivy", rozmery: [] };
const a = (akcia, v, m) => '[data-a="' + akcia + '"]' + (m ? '[data-m="' + m + '"]' : "") + (v != null ? '[data-v="' + v + '"]' : "");
const pismoKonf = pismoVyraz(["#lcd1v-kamion", ".lcd1v-lista"], ROLY_KONFIGURATOR, ROLY_SPOLOCNE);

for (const R of ROZMERY) {
  const dir = join(out, R.tag); mkdirSync(dir, { recursive: true });
  const mobil = R.druh === "m", dotyk = R.druh !== "p";
  const k = await ch.novaKarta({ sirka: R.w, vyska: R.h, mobil });
  const r = { rozmer: R.tag, stavy: [], chyby: [] };
  try {
    if (dotyk && !mobil) await k.posli("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await k.posli("Network.setBlockedURLs", { urls: ["*google-analytics.com/g/collect*", "*analytics.google.com/g/collect*", "*facebook.com/tr*", "*clarity.ms/collect*", "*googleadservices.com/pagead/conversion*"] });
    if (zdroj) {
      k.na("Fetch.requestPaused", async (p) => {
        const m = p.request.url.match(/\/assets\/v\/([0-9a-f]{7})\//);
        try {
          if (zdroj === "lokal" && m && /luxuryCar\.(js|css)/.test(p.request.url)) {
            const css = /\.css/.test(p.request.url.split("?")[0]);
            const buf = readFileSync(LOK + "luxuryCar." + (css ? "css" : "js"));
            await k.posli("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: css ? "text/css" : "application/javascript" }, { name: "Access-Control-Allow-Origin", value: "*" }], body: buf.toString("base64") });
            return;
          }
          if (m && zdroj !== "lokal" && m[1] !== zdroj) {
            const rr = await fetch(p.request.url.split(m[1]).join(zdroj)); const buf = Buffer.from(await rr.arrayBuffer());
            await k.posli("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: rr.status, responseHeaders: [{ name: "Content-Type", value: rr.headers.get("content-type") || "application/octet-stream" }, { name: "Access-Control-Allow-Origin", value: "*" }], body: buf.toString("base64") });
            return;
          }
        } catch (e) { /* nižšie */ }
        await k.posli("Fetch.continueRequest", { requestId: p.requestId });
      });
      await k.posli("Fetch.enable", { patterns: [{ urlPattern: "*luxuryCar/assets/v/*" }] });
    }
    await k.posli("Page.navigate", { url: "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/?novy=1&t=" + Date.now() });
    for (let i = 0; i < 160 && !(await k.ev(`!!document.querySelector("#lcd1v-kamion .k-krok")`).catch(() => false)); i++) await pauza(500);
    await pauza(1500);
    await k.ev(`(function(){var b=Array.prototype.find.call(document.querySelectorAll("button, a"),function(e){return e.offsetParent&&/^\\s*Odmietnu/i.test(e.textContent||"")});if(b)b.click();})()`);
    await pauza(500);
    await k.ev(`(function(){var st=document.createElement("style");st.textContent="body iframe{pointer-events:none!important;visibility:hidden!important} #provesrc-notification-container{display:none!important}";document.head.appendChild(st);})()`);
    const snimka = async (meno) => { const s = await k.posli("Page.captureScreenshot", { format: "jpeg", quality: 55 }); writeFileSync(join(dir, meno + ".jpg"), Buffer.from(s.data, "base64")); return R.tag + "/" + meno + ".jpg"; };
    const analyzuj = async (meno, { prejdi = true, foto = true } = {}) => {
      await pauza(1900);
      const z = { stav: meno, krok: await k.ev(STAV_KROKU), body: [] };
      const bod = async (nm, s) => {
        const ak = await k.ev(`${ANALYZA}("#lcd1v-kamion", ${dotyk})`);
        const al = await k.ev(`${ANALYZA}(".lcd1v-lista", ${dotyk})`);
        const zk = await k.ev(ZAKRYTE);
        const pis = await k.ev(pismoKonf).catch((e) => ({ chyba: String(e).slice(0, 120) }));
        const pocet = (x) => x ? x.nalezy.length + x.orezane.length + x.pretecenie.length + x.mimo.length + (x.vodorovne ? 1 : 0) : 0;
        const zaznam = { bod: nm, scrollY: await k.ev("Math.round(scrollY)"), konf: ak, lista: al, zakryte: zk, pismo: pis && pis.zle ? { n: pis.n, zle: pis.zle.slice(0, 12), zlom: (pis.zlom || []).slice(0, 6), pretek: (pis.pretek || []).slice(0, 6), orez: (pis.orez || []).slice(0, 6), strana: pis.strana } : pis };
        const vazne = pocet(ak) + pocet(al) + zk.zakryte.length + (pis && pis.zle ? pis.zle.length + (pis.zlom || []).length + (pis.pretek || []).length + (pis.orez || []).length : 0);
        if (s || vazne) zaznam.snimka = await snimka(meno + "-" + nm);
        z.body.push(zaznam);
      };
      await bod("auto", foto);
      if (prejdi && z.krok && z.krok.h > R.h - 40) {
        let y = z.krok.top; const koniec = z.krok.top + z.krok.h - R.h;
        for (let i = 1; y < koniec && i < 12; i++) {
          y = Math.min(koniec, y + Math.round(R.h * 0.8));
          await k.ev(`window.scrollTo({top:${y},behavior:"instant"}); true`); await pauza(450);
          await bod("p" + i, false);
        }
      }
      r.stavy.push(z);
      process.stdout.write(".");
    };
    const tuk = async (sel, meno) => {
      const pos = await k.ev(`(function(){var e=document.querySelector("#lcd1v-kamion ${sel.replace(/"/g, '\\"')}");if(!e)return null;var r=e.getBoundingClientRect();
        if(r.top<70||r.bottom>innerHeight-110){window.scrollBy({top:r.top-innerHeight/2+r.height/2,behavior:"instant"});r=e.getBoundingClientRect();}return JSON.stringify({x:r.left+r.width/2,y:r.top+Math.min(r.height/2,24)});})()`);
      if (!pos) { r.chyby.push("chýba " + (meno || sel)); return false; }
      await pauza(200);
      const p = JSON.parse(pos);
      const hit = await k.ev(`(function(){var e=document.elementFromPoint(${p.x},${p.y});var t=document.querySelector("#lcd1v-kamion ${sel.replace(/"/g, '\\"')}");return e&&t&&(t===e||t.contains(e))?"":"MIMO:"+(e?e.tagName+"."+String(e.className).slice(0,40):"nič")})()`);
      if (hit) { r.chyby.push("klik " + (meno || sel) + " " + hit); await k.ev(`document.querySelector("#lcd1v-kamion ${sel.replace(/"/g, '\\"')}").click()`); }
      else await k.klik(p.x, p.y);
      return true;
    };
    const vyber = (p, v) => k.ev(`(function(){var s=document.querySelector('#lcd1v-kamion select[data-p="${p}"]');if(!s)return false;s.value=${JSON.stringify(v)};s.dispatchEvent(new Event("change",{bubbles:true}));return true})()`);

    await k.ev(`window.scrollTo({top:0,behavior:"instant"}); true`);
    await pauza(300);
    await k.ev(`(function(){var e=document.querySelector("#lcd1v-kamion");if(e)window.scrollTo({top:e.getBoundingClientRect().top+scrollY-10,behavior:"instant"});})()`);
    await analyzuj("01-vozidlo");
    await tuk(a("dalej", "vozidlo")); await analyzuj("02-vozidlo-chyba", { prejdi: false });
    await vyber("znacka", "DAF (TIR)"); await pauza(300); await vyber("model", "XF106 2017-2021"); await analyzuj("03-vozidlo-vybrane", { prejdi: false });
    await tuk(a("dalej", "vozidlo")); await analyzuj("04-material");
    await tuk(a("mat", "Prémiová syntetická koža – prešívaná")); await pauza(400); await tuk(a("dalej", "material")); await analyzuj("05-farba");
    await tuk(a("farba", "11")); await pauza(400); await tuk(a("dalej", "farba")); await analyzuj("06-lemovanie");
    await tuk(a("lem", "04")); await pauza(400); await tuk(a("dalej", "lemovanie")); await analyzuj("07-nasivky-kam");
    await tuk(a("nas", "boky+stred")); await analyzuj("08-nasivky-boky");
    await tuk(a("motiv", "H19", "boky")); await pauza(400); await tuk(a("nit", "2824", "boky")); await pauza(400); await tuk(a("potvrd", "boky")); await analyzuj("09-nasivky-stred");
    await tuk(a("stredRovnaky", "0")); await analyzuj("10-stred-ina", { prejdi: true, foto: true });
    await tuk(a("motiv", "H21", "stred")); await pauza(400); await tuk(a("nit", "2866", "stred")); await pauza(400); await tuk(a("potvrd", "stred")); await analyzuj("11-tapacir-ponuka");
    await tuk(a("tap", "ano")); await analyzuj("12-tapacir-material");
    await tuk(a("tapZmenit")); await analyzuj("13-tapacir-vlastna");
    await tuk(a("tapMat", "Vzorovaný velúr")); await pauza(400); await tuk(a("tapFarba", "2D")); await pauza(400);
    await k.ev(`(function(){var e=document.querySelector('#lcd1v-kamion [data-a="tapLem"][data-v="04"]')||document.querySelector('#lcd1v-kamion [data-a="tapLem"]');if(e)e.setAttribute("data-x-lem","1");return !!e})()`);
    await tuk('[data-x-lem="1"]', "tapLem"); await pauza(400); await tuk(a("potvrd", "tapMat")); await analyzuj("14-tapacir-nasivka");
    await tuk(a("tapNas", "ano")); await analyzuj("15-tapacir-motiv");
    await tuk(a("tapNasRovnaka", "1")); await pauza(800); await analyzuj("16-prehlad", { prejdi: false });
    // celý konfigurátor ešte raz po kúskoch (zatvorené kroky + prehľad + košík)
    const kon = await k.ev(`(function(){var e=document.querySelector("#lcd1v-kamion").getBoundingClientRect();return {t:Math.round(e.top+scrollY),h:Math.round(e.height)}})()`);
    for (let y = kon.t, i = 0; y < kon.t + kon.h && i < 10; y += Math.round(R.h * 0.8), i++) {
      await k.ev(`window.scrollTo({top:${y},behavior:"instant"}); true`); await pauza(500);
      const ak = await k.ev(`${ANALYZA}("#lcd1v-kamion", ${dotyk})`);
      const n = ak.nalezy.length + ak.orezane.length + ak.pretecenie.length + ak.mimo.length + (ak.vodorovne ? 1 : 0);
      const z = { stav: "17-hotovy-" + i, body: [{ bod: "y" + y, konf: ak }] };
      if (n || i === 0) z.body[0].snimka = await snimka("17-hotovy-" + i);
      r.stavy.push(z);
    }
    if (!BEZ_OBSAHU) {
      const korene = await k.ev(`JSON.stringify(Array.prototype.map.call(document.querySelectorAll('[data-lcd-cast^="p1v"]'),function(e,i){e.setAttribute("data-x-obsah",i);var r=e.getBoundingClientRect();return {i:i,t:Math.round(r.top+scrollY),h:Math.round(r.height)}}))`);
      const KK = JSON.parse(korene || "[]");
      const pismoObs = pismoVyraz(['[data-lcd-cast^="p1v"]'], ROLY_OBSAH, ROLY_SPOLOCNE);
      if (KK.length) {
        const t0 = Math.min(...KK.map((x) => x.t)), t1 = Math.max(...KK.map((x) => x.t + x.h));
        for (let y = t0, i = 0; y < t1 && i < 60; y += Math.round(R.h * 0.85), i++) {
          await k.ev(`window.scrollTo({top:${y},behavior:"instant"}); true`); await pauza(550);
          const z = { stav: "obsah-" + String(i).padStart(2, "0"), body: [] };
          const zaz = { bod: "y" + y, obsah: [] };
          for (const kk of KK) { if (kk.t > y + R.h || kk.t + kk.h < y) continue; zaz.obsah.push(await k.ev(`${ANALYZA}('[data-x-obsah="${kk.i}"]', ${dotyk})`)); }
          const n = zaz.obsah.reduce((s, x) => s + (x ? x.nalezy.length + x.orezane.length + x.pretecenie.length + x.mimo.length + (x.vodorovne ? 1 : 0) : 0), 0);
          if (i === 0) { const pis = await k.ev(pismoObs).catch(() => null); zaz.pismo = pis && pis.zle ? { n: pis.n, zle: pis.zle.slice(0, 15), zlom: (pis.zlom || []).slice(0, 8), pretek: (pis.pretek || []).slice(0, 8), orez: (pis.orez || []).slice(0, 8), strana: pis.strana } : pis; }
          if (n) zaz.snimka = await snimka(z.stav);
          z.body.push(zaz); r.stavy.push(z);
        }
      }
    }
    r.jsChyby = k.chyby.filter((c) => !/googletagmanager|facebook|hotjar|clarity|tiktok|doubleclick|google-analytics|net::|ERR_|provesrc|luxia/i.test(c.zdroj + c.text)).map((c) => c.text.slice(0, 160));
  } catch (e) { r.chyby.push("VÝNIMKA " + String(e && e.stack || e).slice(0, 300)); }
  vysledok.rozmery.push(r);
  writeFileSync(join(out, "vysledok.json"), JSON.stringify(vysledok, null, 1));
  console.log(" " + R.tag + ": stavov " + r.stavy.length + ", chyby " + r.chyby.length);
  await k.zavri();
}
await ch.zavri();
process.exit(0);
