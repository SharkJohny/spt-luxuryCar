// Chrome bez okna cez surový CDP (bez npm balíkov) pre test konfigurátora 1V (tools/test-konfigurator-1v.mjs).
// Odvodené zo scratchpad/_cdp7w.mjs (7. 10. 2026). SPOLOČNÝ SÚBOR — po základe (13. 10. 2026) sa nemení.
//
//   const ch = await spustiChrome();             // jeden prehliadač na beh testu
//   const k = await ch.novaKarta({ sirka: 390 }); // čistá karta (vlastný sessionStorage)
//   k.na("Fetch.requestPaused", fn); await k.posli("Fetch.enable", {...});
//   await k.chod(url); await k.ev("document.title"); await k.klik(x, y); await k.snimka(cesta);
//   await k.zavri(); ch.zavri();
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

const UA_MOBIL =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

export function najdiChrome() {
  const kandidati = [
    process.env.LCD_CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);
  const c = kandidati.find((p) => existsSync(p));
  if (!c) throw new Error("Chrome nenájdený (nastav LCD_CHROME=cesta k chrome)");
  return c;
}

export async function spustiChrome({ okno = false } = {}) {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profil = mkdtempSync(join(tmpdir(), "lcd-1v-chrome-"));
  const argv = [
    "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "--mute-audio",
    "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
    "--remote-debugging-port=" + port, "--user-data-dir=" + profil, "about:blank",
  ];
  if (!okno) argv.unshift("--headless=new");
  const proces = spawn(najdiChrome(), argv, { stdio: "ignore" });
  let ciel;
  for (let k = 0; k < 75 && !ciel; k++) {
    await pauza(200);
    try { ciel = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; } catch {}
  }
  if (!ciel) { proces.kill(); throw new Error("Chrome sa nespustil"); }
  const ws = new WebSocket(ciel);
  await new Promise((r, j) => { ws.addEventListener("open", r, { once: true }); ws.addEventListener("error", j, { once: true }); });

  let id = 0;
  const cakaju = new Map();
  const posluchaci = new Map(); // sessionId -> Map(method -> [fn])
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(typeof e.data === "string" ? e.data : e.data.toString());
    if (m.id && cakaju.has(m.id)) {
      const c = cakaju.get(m.id); cakaju.delete(m.id);
      if (m.error) c.rej(new Error(c.method + ": " + m.error.message)); else c.res(m.result);
      return;
    }
    if (!m.method) return;
    const mapa = posluchaci.get(m.sessionId || "");
    const fns = mapa && mapa.get(m.method);
    if (fns) fns.forEach((fn) => { try { fn(m.params); } catch (err) { console.error("posluchac " + m.method, err); } });
  });
  const posli = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const i = ++id; cakaju.set(i, { res, rej, method });
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

  async function novaKarta({ sirka = 1280, vyska, mobil = sirka < 768 } = {}) {
    const v = vyska || (mobil ? 844 : 900);
    const { targetId } = await posli("Target.createTarget", { url: "about:blank" });
    const { sessionId: s } = await posli("Target.attachToTarget", { targetId, flatten: true });
    posluchaci.set(s, new Map());
    const k = {
      sirka, vyska: v, mobil, targetId, sessionId: s,
      chyby: [], // výnimky a console.error stránky
      posli: (method, params) => posli(method, params, s),
      na(method, fn) {
        const mapa = posluchaci.get(s);
        if (!mapa.has(method)) mapa.set(method, []);
        mapa.get(method).push(fn);
      },
    };
    k.na("Runtime.exceptionThrown", (p) => {
      const d = p.exceptionDetails || {};
      const text = ((d.exception && d.exception.description) || d.text || "").split("\n")[0];
      k.chyby.push({ druh: "vynimka", text, zdroj: d.url || (d.stackTrace && d.stackTrace.callFrames[0] && d.stackTrace.callFrames[0].url) || "" });
    });
    k.na("Runtime.consoleAPICalled", (p) => {
      if (p.type !== "error") return;
      const text = p.args.map((a) => (a.value !== undefined ? String(a.value) : a.description || "")).join(" ").slice(0, 300);
      const f = p.stackTrace && p.stackTrace.callFrames[0];
      k.chyby.push({ druh: "konzola", text, zdroj: (f && f.url) || "" });
    });
    k.na("Log.entryAdded", (p) => {
      const e = p.entry || {};
      if (e.level !== "error" || e.source === "network") return; // sieť (zablokované merače, 404 obrázkov) nie je chyba kódu
      k.chyby.push({ druh: "log", text: String(e.text || "").slice(0, 300), zdroj: e.url || "" });
    });
    await k.posli("Runtime.enable");
    await k.posli("Page.enable");
    await k.posli("Log.enable");
    await k.posli("Network.enable");
    await k.posli("Emulation.setDeviceMetricsOverride", { width: sirka, height: v, deviceScaleFactor: 1, mobile: mobil });
    if (mobil) {
      await k.posli("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      await k.posli("Emulation.setUserAgentOverride", { userAgent: UA_MOBIL, platform: "iPhone" });
    }

    k.ev = async (expr) => {
      const r = await k.posli("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error("ev: " + ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text));
      return r.result.value;
    };
    k.chod = async (url, { cakajNaLoad = true, limit = 45000 } = {}) => {
      let hotovo;
      const nacitane = new Promise((r) => { hotovo = r; });
      k.na("Page.loadEventFired", () => hotovo && hotovo());
      await k.posli("Page.navigate", { url });
      if (cakajNaLoad) await Promise.race([nacitane, pauza(limit)]);
      hotovo = null;
    };
    k.klik = async (x, y) => {
      await k.posli("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await k.posli("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await k.posli("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    };
    k.tuk = async (x, y) => {
      const tp = [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
      await k.posli("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp });
      await pauza(50);
      await k.posli("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    k.snimka = async (cesta, { celaStrana = false } = {}) => {
      let param = { format: "png" };
      if (celaStrana) {
        const m = await k.posli("Page.getLayoutMetrics");
        const sz = m.cssContentSize || m.contentSize;
        param = { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: sirka, height: Math.min(sz.height, 16000), scale: 1 } };
      }
      const r = await k.posli("Page.captureScreenshot", param);
      writeFileSync(cesta, Buffer.from(r.data, "base64"));
      return cesta;
    };
    k.zavri = async () => {
      try { await posli("Target.closeTarget", { targetId }); } catch {}
      posluchaci.delete(s);
    };
    return k;
  }

  /** Zavrie Chrome a zmaže dočasný profil (await: na Windows drží Chrome súbory ešte chvíľu po skončení). */
  async function zavri() {
    try { ws.close(); } catch {}
    const skoncil = new Promise((r) => { if (proces.exitCode !== null) r(); else proces.once("exit", r); });
    try { proces.kill(); } catch {}
    await Promise.race([skoncil, pauza(5000)]);
    for (let i = 0; i < 15; i++) {
      try { rmSync(profil, { recursive: true, force: true }); break; } catch { await pauza(300); }
    }
  }
  return { posli, novaKarta, zavri };
}
