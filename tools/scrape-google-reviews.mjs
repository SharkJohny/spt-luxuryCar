// Stiahne VŠETKY recenzie z Google profilu Luxury Car Design cez Google Vyhľadávanie (panel firmy -> „N recenzií“)
// v Chrome (CDP, bez prihlásenia, bez závislostí — Chrome z tools/test-1v/cdp.mjs).
// Výstup: tools/google-reviews-fresh.json = { place: { rating, totalReviews, url, fetchedAt }, reviews: [...] }.
// Dáta webu (assets/js/reviews-data.js) z neho poskladá až tools/reviews-update.mjs — tento skript web nemení.
//
//   node tools/scrape-google-reviews.mjs            # headless Chrome (bez okna)
//   node tools/scrape-google-reviews.mjs --okno     # viditeľné okno (diagnostika)
//
// Prečo Vyhľadávanie a nie Mapy (29. 10. 2026): Mapy Google bez prihlásenia ukážu len 5 recenzií a pri ďalších chcú
// prihlásenie („Prihláste sa … prečítajte si všetky recenzie“); headless Chrome navyše dostane obmedzené Mapy bez
// záložky Recenzie. Vyhľadávanie bez prihlásenia vypíše všetkých N recenzií (tlačidlo „Ďalšie recenzie používateľov“).
// Pôvodná verzia (playwright, Mapy) brala len autora, text a fotky — playwright v repe nie je, čísla profilu chýbali.
// Cookies Googlu: vždy „Odmietnuť všetko“.
// Exit 0 = OK; 2 = Google nevrátil použiteľné dáta -> súbor sa NEPREPÍŠE (ostanú posledné dobré). Snímky pri chybe:
// tools/_scrape-*.png (v .gitignore).
import { writeFile } from "node:fs/promises";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";

const HLADAJ = process.env.LCD_GOOGLE_QUERY || "Luxury Car Design Žilina";
const OUT = "tools/google-reviews-fresh.json";
const okno = process.argv.includes("--okno");
const log = (...a) => console.log("[scrape]", ...a);

// Spoločné pomocné funkcie v stránke: položka recenzie = predok span[data-review-id], ktorý už obsahuje hodnotenie
// („5 z 5“ v aria-label položky zoznamu). Triedy Googlu sú zahmlené a menia sa — opierame sa o role/aria-label.
const POMOC = `
  window.__lcdPolozky = () => [...document.querySelectorAll("span[data-review-id]")].map(s => {
    let p = s; for (let i = 0; i < 12 && p.parentElement; i++) { p = p.parentElement; if (p.querySelector("[role=listitem][aria-label]")) return p; }
    return null; }).filter(Boolean);
  window.__lcdRiadky = (el) => (el.innerText || "").split("\\n").map(x => x.trim()).filter(Boolean);
`;

const chrome = await spustiChrome({ okno });
let kod = 0;
try {
  const k = await chrome.novaKarta({ sirka: 1280, vyska: 1000 });
  const snimka = (n) => k.snimka(`tools/_scrape-${n}.png`).catch(() => {});
  // headless Chrome sa hlási ako „HeadlessChrome“ -> Google dáva obmedzené stránky
  const ua = (await k.ev("navigator.userAgent")).replace(/HeadlessChrome/g, "Chrome");
  await k.posli("Emulation.setUserAgentOverride", { userAgent: ua, acceptLanguage: "sk-SK,sk;q=0.9,cs;q=0.8", platform: "Win32" });

  await k.chod("https://www.google.com/search?hl=sk&q=" + encodeURIComponent(HLADAJ), { limit: 45000 });
  await pauza(2500);
  const consent = await k.ev(`(() => { const b = [...document.querySelectorAll("button, input[type=submit]")]
    .find(x => /Odmietnuť všetko|Odmítnout vše|Reject all|Alle ablehnen/i.test(x.textContent || x.value || "")); if (b) { b.click(); return true; } return false; })()`);
  if (consent) { log("cookies: odmietnuté"); await pauza(4000); }
  await snimka("1-vyhladavanie");

  // panel firmy: „5,0 ★★★★★ 101 recenzií“ -> hodnotenie, počet; klik otvorí zoznam recenzií
  const panel = await k.ev(`(() => {
    const kand = [...document.querySelectorAll("a, span")].filter(x => x.getClientRects().length && /^\\s*\\d[\\d\\s\\u00a0.]*\\s*recenzi/i.test((x.textContent || "").trim()) && (x.textContent || "").length < 30);
    const a = kand[0]; if (!a) return null;
    const pocet = Number(a.textContent.replace(/[^\\d]/g, ""));
    let p = a, rating = null;
    for (let i = 0; i < 4 && p && rating == null; i++, p = p.parentElement) { const m = (p.innerText || "").match(/([1-5][,.]\\d)/); if (m) rating = Number(m[1].replace(",", ".")); }
    (a.closest("a") || a).click();
    return { pocet, rating };
  })()`);
  if (!panel) throw new Error("panel firmy s počtom recenzií sa nenašiel (captcha / iný vzhľad) — pozri tools/_scrape-1-vyhladavanie.png");
  log("panel:", JSON.stringify(panel));
  await pauza(4500);
  await k.ev(POMOC);

  // „Ďalšie recenzie používateľov“, kým pribúdajú
  let pred = -1, stoji = 0;
  for (let i = 0; i < 80; i++) {
    const r = await k.ev(`(() => { const n = window.__lcdPolozky().length;
      const b = [...document.querySelectorAll("div[role=button], button, a")].find(x => x.getClientRects().length && /^\\s*Ďalšie recenzie/i.test(x.textContent || ""));
      if (b) { b.scrollIntoView({ block: "center" }); b.click(); } return { n, b: !!b }; })()`);
    if (i % 5 === 0) log(`načítané ${r.n}`);
    if (r.n >= panel.pocet && !r.b) break;
    if (r.n === pred) { if (++stoji >= 6) break; } else { stoji = 0; pred = r.n; }
    await pauza(2000);
  }
  await snimka("2-zoznam");

  // položky zo zoznamu
  const zoznam = await k.ev(`window.__lcdPolozky().map((p, idx) => {
    const id = p.querySelector("span[data-review-id]").getAttribute("data-review-id");
    const menu = p.querySelector("[aria-label^='Možnosti recenzie od autora']");
    const riadky = window.__lcdRiadky(p);
    const author = menu ? menu.getAttribute("aria-label").replace(/^Možnosti recenzie od autora\\s*/, "").trim() : riadky[0];
    const hv = p.querySelector("[role=listitem][aria-label]");
    const rating = hv ? Number((hv.getAttribute("aria-label").match(/([1-5])/) || [])[1]) || null : null;
    const di = riadky.findIndex(x => /^·?\\s*(Upravené\\s+)?[Pp]red\\b|^·?\\s*[Pp]řed\\b/.test(x.replace(/^·\\s*/, "")));
    const relativeDate = di >= 0 ? riadky[di].replace(/^·\\s*/, "").trim() : "";
    const textRiadky = di >= 0 ? riadky.slice(di + 1).filter(x => !/^(Nové|Viac|Nahlásiť recenziu)$/.test(x)) : [];
    const viac = p.querySelector("a[aria-label='Zobraziť celú recenziu']");
    const foto = [...p.querySelectorAll("img")].map(i => i.src || "").filter(s => /googleusercontent|ggpht/.test(s) && !/=s\\d{2}-|\\/a\\//.test(s));
    return { idx, googleId: id, author, rating, relativeDate, text: textRiadky.join("\\n").replace(/\\s*…\\s*Viac$/, "…").trim(), skratene: !!viac, photos: foto };
  })`);
  log(`položiek: ${zoznam.length} | skrátených textov: ${zoznam.filter((r) => r.skratene).length}`);

  // skrátené texty: „Viac“ otvorí bočný panel s celou recenziou (Google ju tam môže preložiť -> „Zobraziť originál“)
  for (const r of zoznam.filter((x) => x.skratene)) {
    try {
      const plny = await k.ev(`(async () => {
        const p = window.__lcdPolozky()[${r.idx}]; const a = p && p.querySelector("a[aria-label='Zobraziť celú recenziu']"); if (!a) return null;
        a.click(); await new Promise(s => setTimeout(s, 2200));
        const panel = () => [...document.querySelectorAll("[role=dialog], [aria-modal=true], div")].filter(d => d.getClientRects().length && d.innerText && d.innerText.includes(${JSON.stringify(r.author)}) && /Ďalšie recenzie|Preložené|Reagovať/.test(d.innerText) && d.innerText.length < 4000).sort((x, y) => x.innerText.length - y.innerText.length)[0];
        let d = panel(); if (!d) return null;
        const PREKLAD = /Preložené Googlom|Přeloženo Googlem|Translated by Google/i;
        const foto0 = [...d.querySelectorAll("img")].map(i => i.src || "").filter(s => /googleusercontent/.test(s) && !/=s\\d{2}-|\\/a\\//.test(s));
        // Panel ukazuje preklad (často do angličtiny) a originál má v DOM skrytý vedľa tlačidla „Zobraziť preklad (…)“
        const tlPreklad = [...d.querySelectorAll("button, [role=button]")].find(b => /(Zobrazi.\\s+preklad|Zobrazit\\s+překlad|See\\s+translation)/i.test(b.textContent || ""));
        const origEl = tlPreklad && [...tlPreklad.parentElement.children].find(x => x !== tlPreklad && (x.textContent || "").trim().length > 0);
        if (origEl) {
          const z = d.querySelector("[aria-label='Zavrieť'], [aria-label='Close']"); if (z) z.click();
          const kopia = origEl.cloneNode(true); kopia.querySelectorAll("br").forEach(b => b.replaceWith("\\n")); // skrytý prvok nemá innerText
          return { text: kopia.textContent.trim(), foto: foto0, preklad: false };
        }
        // text je preložený a originál sa nenašiel -> text nepoužiť (ostane skrátený originál zo zoznamu), fotky áno
        if (PREKLAD.test(d.innerText)) {
          const foto = [...d.querySelectorAll("img")].map(i => i.src || "").filter(s => /googleusercontent/.test(s) && !/=s\\d{2}-|\\/a\\//.test(s));
          const z = d.querySelector("[aria-label='Zavrieť'], [aria-label='Close']"); if (z) z.click();
          return { text: "", foto, preklad: true };
        }
        const riadky = window.__lcdRiadky(d);
        const di = riadky.findIndex(x => /(pred|před)\\s|ago$|^\\d+\\s+(months?|years?|weeks?|days?)/i.test(x));
        const koniec = riadky.findIndex((x, i) => i > di && /^(Preložené Googlom|Zobraziť preklad|Reagovať|Ďalšie recenzie|Páči sa mi|Zdieľať)/.test(x));
        const text = di >= 0 ? riadky.slice(di + 1, koniec > di ? koniec : undefined).filter(x => !/^(Nové|Zobraziť originál.*)$/.test(x)).join("\\n").trim() : "";
        const foto = [...d.querySelectorAll("img")].map(i => i.src || "").filter(s => /googleusercontent/.test(s) && !/=s\\d{2}-|\\/a\\//.test(s));
        const zavri = [...d.querySelectorAll("[aria-label='Zavrieť'], [aria-label='Close']")][0]; if (zavri) zavri.click();
        return { text, foto, preklad: !!orig };
      })()`);
      if (plny && plny.text && plny.text.length > r.text.replace(/…$/, "").length - 5) { r.text = plny.text; r.skratene = false; }
      if (plny && plny.foto && plny.foto.length) r.photos = plny.foto;
      log(`  „Viac“ ${r.author}: ${!plny ? "panel sa neotvoril" : plny.preklad ? "len preklad (text ostáva skrátený)" : r.skratene ? "text sa nenašiel" : "celý text"}${plny && plny.foto && plny.foto.length ? ", fotky " + plny.foto.length : ""}`);
      await pauza(800);
    } catch (e) { log(`  celý text ${r.author}: ${e.message}`); }
  }

  const fotkaVelka = (u) => u.replace(/=w\d+-h\d+[^/]*$/, "=s700").replace(/=s\d+[^/]*$/, "=s700");
  const videne = new Set();
  const reviews = zoznam.filter((r) => r.googleId && !videne.has(r.googleId) && videne.add(r.googleId)).map((r) => ({
    googleId: r.googleId, author: r.author, authorPhoto: null, rating: r.rating, relativeDate: r.relativeDate,
    text: r.text, textSkrateny: r.skratene || undefined, photos: [...new Set(r.photos.map(fotkaVelka))], ownerResponse: null,
  }));
  const place = { rating: panel.rating, totalReviews: panel.pocet, url: "https://g.page/r/CSB8eNYW5ALXEAI", fetchedAt: new Date().toISOString() };
  log(`recenzií: ${reviews.length} / profil ${place.totalReviews} | hodnotenie ${place.rating} | skrátené ${reviews.filter((r) => r.textSkrateny).length} | s fotkami ${reviews.filter((r) => r.photos.length).length} | bez hviezd ${reviews.filter((r) => !r.rating).length}`);

  // poistky: neprepíš posledné dobré dáta nezmyslom
  const chyby = [];
  if (!(place.rating >= 1 && place.rating <= 5)) chyby.push("hodnotenie profilu chýba");
  if (!(place.totalReviews > 0)) chyby.push("počet recenzií profilu chýba");
  if (reviews.length < place.totalReviews * 0.9) chyby.push(`načítaných ${reviews.length} z ${place.totalReviews} (< 90 %)`);
  if (reviews.some((r) => !r.author || !r.rating)) chyby.push("recenzia bez autora alebo hviezd (zmenený vzhľad Googlu?)");
  if (chyby.length) {
    await snimka("CHYBA");
    log("!! NEPREPISUJEM " + OUT + ": " + chyby.join("; "));
    kod = 2;
  } else {
    await writeFile(OUT, JSON.stringify({ place, reviews }, null, 2) + "\n", "utf8");
    log("zapísané " + OUT);
  }
} catch (e) {
  log("FATAL", e.message);
  kod = 2;
} finally {
  await chrome.zavri();
}
process.exit(kod);
