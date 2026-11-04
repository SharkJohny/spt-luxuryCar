// Odhad prínosu zmien v admine: zablokuje vybrané skripty a odmeria telefón na pomalšej sieti (nič na webe nemení; docs/rychlost-web.md § 10).
//   node tools/perf-telefon-ab.mjs   (Playwright: cesta nižšie, pozri databázu vedomostí časť 6)
import { chromium, devices } from 'file:///C:/Users/M/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const HP = 'https://www.luxurycardesign.sk/', PR = 'https://www.luxurycardesign.sk/luxusne-autokoberce-dragonskin-diamond-line/';
const V = {
  zaklad: [],
  'bez priameho GA (ostane v GTM)': [/gtag\/js\?id=G-[A-Z0-9]+$/],
  'bez Facebook SDK (nie pixel)': [/connect\.facebook\.net\/[a-z_A-Z]+\/(bundle\/)?sdk\.js/],
  'bez Twitter': [/platform\.twitter\.com/],
  'bez starych CSS+JS (slick, twentytwenty)': [/slick/, /twentytwenty/],
  'bez generic.css': [/assets\/css\/generic\.css/],
};
const scen = [[HP, ['zaklad', 'bez priameho GA (ostane v GTM)', 'bez Facebook SDK (nie pixel)']], [PR, ['zaklad', 'bez priameho GA (ostane v GTM)', 'bez Facebook SDK (nie pixel)', 'bez Twitter']]];
const b = await chromium.launch();
for (const [u, vs] of scen) for (const v of vs) {
  const riad = [];
  for (let i = 0; i < 3; i++) {
    const c = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
    const p = await c.newPage();
    for (const re of V[v]) await p.route(re, (r) => r.abort());
    const cdp = await c.newCDPSession(p);
    await cdp.send('Network.enable');
    let kB = 0;
    cdp.on('Network.loadingFinished', (e) => { kB += e.encodedDataLength / 1024; });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.addInitScript(() => {
      window.__l = 0; window.__t = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__l = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__t += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });
    });
    const t0 = Date.now();
    await p.goto(u, { waitUntil: 'load', timeout: 90000 }).catch(() => {});
    const load = Date.now() - t0;
    await p.waitForTimeout(4000);
    const r = await p.evaluate(() => ({ lcp: Math.round(window.__l), tbt: Math.round(window.__t) }));
    riad.push({ load, ...r, kB: Math.round(kB) });
    await c.close();
  }
  const med = (k) => riad.map((x) => x[k]).sort((a, b) => a - b)[1];
  console.log((u === HP ? 'titulka' : 'produkt').padEnd(8), v.padEnd(34), 'load', med('load'), 'LCP', med('lcp'), 'TBT', med('tbt'), 'kB', med('kB'));
}
await b.close();
