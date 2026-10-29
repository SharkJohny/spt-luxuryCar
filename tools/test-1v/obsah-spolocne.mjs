// Spoločné pomôcky testu OBSAHU pod konfigurátorom 1V (tools/test-1v-obsah.mjs). JADRO (T0.3, 14. 10. 2026: všetky
// SK produkty z registra, obsah z CDN verzie podľa rozhodnutia D1 = b) — mení len vydanie.
// Build JS/CSS je prevzatý zo zmrazeného tools/test-konfigurator-1v.mjs (ten sa nemení): esbuild assets/js/main.js s
// prepínačmi ako .github/workflows/production.yml + CSS z tools/vloz-lcd-css.py --vystup; HTML obsahu z
// tools/build-admin-html.mjs --vystup. Všetko do dočasného priečinka behu, repo ostane nezmenené.
//
// Stránka: živá SK stránka produktu (register konfigurator1v/produkty.js). Bundle a CSS sa nahradia lokálnym buildom.
// Kde je obsah (miesto):
//   "cdn"     (predvolené = SKÚŠKA, D1 = b): nič sa do stránky nevkladá. obsah.js pod bránou stiahne
//             …/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html (sha z adresy luxuryCar.js) — test tieto požiadavky obslúži
//             lokálnym dist (ako production.yml kopíruje admin-html/dist/p1v-*.sk.html do assets/v/<sha>/html/);
//   "paticka" (starý test D1 = a): každý kus ako nový banner v pätičke (.custom-footer), presne ako ho vypíše Shoptet;
//   "popis"   (SPUSTENIE): kusy namiesto starého obsahu .basic-description (Popis produktu);
//   "popis-cdn" (KROK 2 SPUSTENIA, docs/1v-obsah.md §7 bod 1 b): do Popisu len dokKusy (kus 1 postavený --bez-webp, ako
//             pôjde do adminu), CDN obslúži všetky kusy lokálnym dist ako pri "cdn"; vypadok = požiadavky na kusy
//             z CDN zlyhajú ako výpadok siete;
//   "zive"    nič sa nevkladá ani neobsluhuje (obsah, ktorý už je na stránke / na CDN).
// Do každého neprázdneho koreňa sa pridá SONDA (img loading=lazy 1×1 na …/assets/img/1v/obsah/__sonda-N.png): bez flagu
// sa nesmie stiahnuť, s flagom po posune na ňu áno (kontrola, že meranie požiadaviek funguje).
// Bezpečnosť ako zmrazený runner: POST /action/Cart/addCartItem sa ZRUŠÍ, iný POST na /action/ tiež (okrem odmietnutia
// cookies), merače zablokované, cookie lišta odmietnutá. Žiadna objednávka, žiadny admin, žiadne prihlásenie.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pauza } from "./cdp.mjs";

export const KOREN = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/";
export const SK = "https://www.luxurycardesign.sk";
export const CZ = "https://www.luxurycardesign.cz";
export const URL_598 = SK + "/luxusne-autokoberce-dragonskin-diamond-line/";
export const SONDA = CDN + "img/1v/obsah/__sonda-";

let PREKLAD_CZ = null;
const SEG_CZ = join(KOREN, ".cz-podklady", "seg");
/** Mapa prekladu je nesledovaná (.cz-podklady/ nie je v gite): v čistom checkoute chýba. */
export function prekladCzDostupny() { return existsSync(join(SEG_CZ, "segmenty.json")) && existsSync(join(SEG_CZ, "preklad")); }
/** Presný SK -> CZ preklad zákazníckeho textu z mapy, z ktorej sa skladá CZ admin obsah. Bez mapy výnimka s `preskoc`:
 *  runner (a skupina DVOJ) ju hlási ako upozornenie „preskočené“, nie ako chybu (revízia 29. 10. 2026). */
export function prelozCz(sk) {
  if (!PREKLAD_CZ) {
    if (!prekladCzDostupny()) throw Object.assign(new Error("CZ kontroly s prekladom preskočené — chýba nesledovaný .cz-podklady/seg/segmenty.json (mapa SK -> CZ)"), { preskoc: true });
    const dir = join(SEG_CZ, "preklad");
    const segmenty = JSON.parse(readFileSync(join(SEG_CZ, "segmenty.json"), "utf8"));
    const podlaId = Object.assign({}, ...readdirSync(dir).filter((f) => /\.json$/i.test(f)).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8"))));
    PREKLAD_CZ = new Map(segmenty.filter((s) => Object.prototype.hasOwnProperty.call(podlaId, s.id)).map((s) => [s.sk, podlaId[s.id]]));
  }
  return PREKLAD_CZ.get(sk) || sk;
}
/** kus obsahu na CDN verzie (obsah.js): …/assets/v/<sha>/html/p1v-<kľúč>-<n>.sk.html */
export const RE_HTML_KUS = /\/eshopy\/luxuryCar\/assets\/v\/[^/]+\/html\/(p1v-[a-z0-9]+-\d+)\.(?:sk|cz)\.html(?:[?#]|$)/;
export const MERACE = [
  "*google-analytics.com*", "*googletagmanager.com*", "*doubleclick.net*", "*googleadservices.com*", "*google.com/ccm*",
  "*google.com/pagead*", "*facebook.net*", "*facebook.com/tr*", "*connect.facebook*", "*tiktok*", "*hotjar*",
  "*clarity.ms*", "*bat.bing.com*", "*heureka.*", "*c.seznam.cz*", "*sklik*", "*ecomail.cz/*track*",
];
/** Návrh (server návrhov http://127.0.0.1:8952/) podľa kľúča obsahu. */
export const NAVRHY = { 598: "jednovrstvove.html", dvoj: "dvojvrstvove.html", classic: "kufor-classic.html", premium: "kufor-premium.html", boxy: "boxy.html", vzorky: "vzorkovnik.html" };
const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const TYP = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml", ".gif": "image/gif", ".mp4": "video/mp4", ".woff2": "font/woff2", ".json": "application/json" };

// ------------------------------------------------------------------ register (zo zdroja, nie natvrdo)
/**
 * Register produktov z assets/js/components/konfigurator1v/produkty.js (regulárnym výrazom, ako test konfigurátora):
 * { produkty: { id: { id, typ, vzor, url (celá), cesta, obsah } }, zapnute: [typy] }.
 */
export function register(web = "sk") {
  const src = readFileSync(join(KOREN, "assets/js/components/konfigurator1v/produkty.js"), "utf8");
  const produkty = {};
  const re = /\b(\d{3,4})\s*:\s*\{\s*typ\s*:\s*"([a-z-]+)"\s*,\s*vzor\s*:\s*(?:"([a-z]+)"|null)\s*,\s*url\s*:\s*"([^"]+)"\s*,\s*obsah\s*:\s*"([a-z0-9]+)"/g;
  const blok = src.split(new RegExp(`\\n\\s*${web === "cz" ? "581408" : "562035"}:\\s*\\{`))[1]?.split(/\n\s*\},\n\s*(?:581408:|\};)/)[0] || "";
  for (const m of blok.matchAll(re)) produkty[m[1]] = { id: Number(m[1]), typ: m[2], vzor: m[3] || null, cesta: m[4], url: (web === "cz" ? CZ : SK) + m[4], obsah: m[5] };
  const z = /ZAPNUTE_TYPY\s*=\s*\[([^\]]*)\]/.exec(src);
  if (!Object.keys(produkty).length || !z) throw new Error("register PRODUKTY_1V / ZAPNUTE_TYPY v konfigurator1v/produkty.js sa nedá prečítať");
  return { produkty, zapnute: [...z[1].matchAll(/"([a-z-]+)"/g)].map((x) => x[1]) };
}

/** Produkt registra iného typu v tom istom vzore (ako produkty.js najdiProdukt: bez vzoru = Diamond). */
export function sestra(reg, typ, vzor) {
  const v = vzor || "diamond";
  return Object.values(reg.produkty).find((p) => p.typ === typ && (p.vzor === v || p.vzor == null)) || null;
}

// ------------------------------------------------------------------ build (prevzaté z test-konfigurator-1v.mjs)
function esbuild() {
  if (process.env.ESBUILD_BINARY_PATH && existsSync(process.env.ESBUILD_BINARY_PATH)) return { cmd: process.env.ESBUILD_BINARY_PATH, pred: [], shell: false };
  const plat = process.platform + "-" + process.arch;
  const bin = join(KOREN, "node_modules", "@esbuild", plat, process.platform === "win32" ? "esbuild.exe" : "bin/esbuild");
  if (existsSync(bin)) return { cmd: bin, pred: [], shell: false };
  const ver = JSON.parse(readFileSync(join(KOREN, "node_modules/esbuild/package.json"), "utf8")).version;
  return { cmd: process.platform === "win32" ? "npx.cmd" : "npx", pred: ["--yes", "esbuild@" + ver], shell: process.platform === "win32", mimoRepa: true };
}
function verziaZLocku(meno) {
  try {
    const lock = readFileSync(join(KOREN, "yarn.lock"), "utf8");
    const m = new RegExp('^"?' + meno.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "@[^\\n]*:\\r?\\n\\s+version \"([^\"]+)\"", "m").exec(lock);
    return m ? m[1] : null;
  } catch { return null; }
}
function chybajuceBalicky() {
  const pkg = JSON.parse(readFileSync(join(KOREN, "package.json"), "utf8"));
  const chyba = Object.keys(pkg.dependencies || {}).filter((n) => !existsSync(join(KOREN, "node_modules", n, "package.json")));
  if (!chyba.length) return null;
  const spec = chyba.map((n) => n + "@" + (verziaZLocku(n) || pkg.dependencies[n]));
  const kluc = spec.join(",").replace(/[^a-z0-9.,@-]/gi, "_").slice(0, 80);
  const dir = join(process.env.LOCALAPPDATA || tmpdir(), "lcd-1v-test", "balicky-" + kluc);
  if (!chyba.every((n) => existsSync(join(dir, "node_modules", n, "package.json")))) {
    mkdirSync(dir, { recursive: true });
    if (!existsSync(join(dir, "package.json"))) writeFileSync(join(dir, "package.json"), '{ "private": true }\n');
    spusti(process.platform === "win32" ? "npm.cmd" : "npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...spec], { shell: process.platform === "win32", popis: "npm install (cache testu)", cwd: dir });
  }
  return join(dir, "node_modules");
}
function python() {
  const kandidati = [process.env.LCD_PYTHON && [process.env.LCD_PYTHON], ["python"], ["python3"], ["py", "-3"]].filter(Boolean);
  for (const k of kandidati) {
    const r = spawnSync(k[0], [...k.slice(1), "--version"], { encoding: "utf8" });
    if (r.status === 0) return k;
  }
  throw new Error("python nenájdený (nastav LCD_PYTHON)");
}
export function spusti(cmd, args, { shell = false, popis, cwd = KOREN, env, ticho = false } = {}) {
  const moznosti = { cwd, env: env || process.env, encoding: "utf8", shell, maxBuffer: 64 * 1024 * 1024 };
  const r = shell
    ? spawnSync([cmd, ...args].map((x) => (/[\s"&|<>^]/.test(x) ? '"' + x.replace(/"/g, '\\"') + '"' : x)).join(" "), moznosti)
    : spawnSync(cmd, args, moznosti);
  if (r.status !== 0 && !ticho) throw new Error((popis || cmd) + " zlyhal (" + r.status + "):\n" + (r.stderr || "") + (r.stdout || "") + (r.error ? String(r.error) : ""));
  return r;
}

/** build-admin-html --vystup <dir> [ďalšie prepínače] -> { kusy: Map(kľúč -> [kus]), manifest }; chyba buildu = výnimka. */
function buildObsahu(dir, prepinace = [], web = "sk") {
  // HTML obsahu (kontroly build-admin-html; chyba = test hneď končí, obsah by na CDN ani do adminu neprešiel)
  const adm = spusti(process.execPath, ["tools/build-admin-html.mjs", "--vystup", dir, ...prepinace], { popis: "build-admin-html --vystup " + prepinace.join(" "), ticho: true });
  if (adm.status !== 0) throw new Error(`tools/build-admin-html.mjs ${prepinace.join(" ")} hlási chyby (obsah by neprešiel):\n` + (adm.stdout || "").split("\n").filter((r) => /CHYBA|✗|POZOR/.test(r)).join("\n"));
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const kusy = new Map();
  manifest.casti.filter((c) => /^p1v-[a-z0-9]+-\d+$/.test(c.cast) && c.web === web)
    .sort((a, b) => a.cast.localeCompare(b.cast, "en", { numeric: true }))
    .forEach((c) => {
      const kluc = /^p1v-([a-z0-9]+)-\d+$/.exec(c.cast)[1];
      if (!kusy.has(kluc)) kusy.set(kluc, []);
      const sekcie = c.sekcie || [];
      kusy.get(kluc).push({ cast: c.cast, html: readFileSync(join(dir, c.subor), "utf8"), sekcie, znaky: c.znaky, hash: c.hash, plne: sekcie.filter((s) => s.znaky > 0).length });
    });
  return { kusy, manifest };
}

/**
 * Lokálny build: { js, css, admin: { kusy: Map(kľúč -> [{ cast, html, sekcie, znaky, hash, plne }]), manifest, casti(kľúč),
 * popis: { kusy, manifest, casti(kľúč) } | null }, tmp, popis }.
 * kusy = všetky SK časti obsahu 1V (p1v-<kľúč>-<n>) v poradí (dist pre CDN, s obalmi WebP); plne = počet neprázdnych
 * sekcií kusu. bezWebp: navyše admin.popis = kusy postavené --bez-webp (to, čo ide do Popisu v admine, §7 docs/1v-obsah.md).
 */
export function priprav({ bezDrop = false, bezWebp = false, web = "sk" } = {}) {
  const tmp = mkdtempSync(join(tmpdir(), "lcd-1v-obsah-"));
  const t0 = Date.now();
  const { kusy, manifest } = buildObsahu(join(tmp, "admin"), [], web);
  if (!kusy.has("598")) throw new Error("manifest nemá časti p1v-598-* (admin-html/ciele.json)");
  const popis = bezWebp ? buildObsahu(join(tmp, "admin-popis"), ["--bez-webp"], web) : null;
  // JS + CSS (kroky CI pred esbuildom ako zmrazený runner)
  const tk = join(KOREN, "assets/js/truck-konfigurator");
  const gen = ["konfigurator.gen.jsx", "konfigurator.phone.gen.jsx"].map((f) => join(tk, f));
  const zdroje = ["konfigurator.jsx", "konfigurator.phone.jsx"].map((f) => join(tk, f));
  const mtime = (f) => { try { return statSync(f).mtimeMs; } catch { return 0; } };
  if (gen.some((g, i) => mtime(g) < mtime(zdroje[i]))) spusti(process.execPath, ["truck/build-truck-images.mjs"], { popis: "truck/build-truck-images.mjs" });
  const nodePath = chybajuceBalicky();
  const e = esbuild();
  const prep = [join(KOREN, "assets/js/main.js"), "--bundle", "--outfile=" + join(tmp, "luxuryCar.js"), "--format=iife", "--loader:.jsx=jsx", "--minify", "--legal-comments=none", "--log-level=warning"];
  if (!bezDrop) prep.push("--drop:console");
  // obsah z CDN verzie (D1 = b) je v jadre vypnutý, kým ho prvé vydanie nezapne (obsah.js OBSAH_CDN) — test ho zapína
  // vždy a kusy obsluhuje z lokálneho dist (novaStranka). Ostatné správanie bundle je zhodné s CI.
  prep.push("--define:LCD_OBSAH_CDN=true");
  const env = nodePath ? { ...process.env, NODE_PATH: [nodePath, process.env.NODE_PATH].filter(Boolean).join(delimiter) } : process.env;
  spusti(e.cmd, [...e.pred, ...prep], { shell: e.shell, popis: "esbuild", cwd: e.mimoRepa ? tmp : KOREN, env });
  const py = python();
  spusti(py[0], [...py.slice(1), "tools/vloz-lcd-css.py", "--vystup", join(tmp, "luxuryCar.css")], { popis: "vloz-lcd-css.py --vystup" });
  const js = readFileSync(join(tmp, "luxuryCar.js")), css = readFileSync(join(tmp, "luxuryCar.css"));
  return {
    js, css, tmp,
    admin: {
      kusy, manifest, casti: (kluc) => kusy.get(String(kluc)) || [],
      popis: popis ? { ...popis, casti: (kluc) => popis.kusy.get(String(kluc)) || [] } : null,
    },
    popis: `lokálny build (${(js.length / 1024).toFixed(0)} kB JS, ${(css.length / 1024).toFixed(0)} kB CSS, obsah ${[...kusy].map(([k, v]) => k + " " + v.map((c) => c.znaky).join("+") + " zn.").join(", ")}${popis ? "; do Popisu --bez-webp " + [...popis.kusy].map(([k, v]) => k + " " + v.map((c) => c.znaky).join("+") + " zn.").join(", ") : ""}, ${((Date.now() - t0) / 1000).toFixed(1)} s) v ${tmp}`,
  };
}

/** Adresy médií v HTML obsahu (src, data-src, poster, data-poster, srcset, url()) — bez flagu sa nesmie stiahnuť ani jedna. */
export function adresyMedii(html) {
  const out = new Set();
  const pridaj = (u) => { u = String(u || "").trim().replace(/&amp;/g, "&"); if (u && !/^(data:|#|mailto:|tel:|javascript:)/i.test(u)) out.add(u.split("#")[0]); };
  for (const m of html.matchAll(/\s(?:src|data-src|poster|data-poster)\s*=\s*"([^"]*)"/gi)) pridaj(m[1]);
  for (const m of html.matchAll(/\s(?:srcset|data-srcset)\s*=\s*"([^"]*)"/gi)) m[1].split(",").forEach((x) => pridaj(x.trim().split(/\s+/)[0]));
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) pridaj(m[1]);
  for (const m of html.matchAll(/\shref\s*=\s*"([^"]*\.(?:mp4|webm|jpe?g|png|webp|avif))"/gi)) pridaj(m[1]);
  return [...out];
}

/** index konca prvku <div …> začínajúceho na indexe zac (za jeho </div>) */
function koniecDiv(html, zac) {
  const re = /<div\b|<\/div>/gi;
  re.lastIndex = zac + 4;
  let hlbka = 1, m;
  while ((m = re.exec(html))) {
    hlbka += m[0].toLowerCase() === "</div>" ? -1 : 1;
    if (!hlbka) return m.index + m[0].length;
  }
  return -1;
}

/** Vloží HTML pred posledné </div> koreňa kusu. */
export function doKorena(cast, vlozit) {
  const i = cast.lastIndexOf("</div>");
  return cast.slice(0, i) + vlozit + cast.slice(i);
}
/** Sonda do koreňa (pred jeho posledné </div>) */
function sSondou(cast, n) {
  return doKorena(cast, `<img class="p1v-sonda" src="${SONDA}${n}.png" alt="" width="1" height="1" loading="lazy">`);
}
/** Prázdny koreň kusu (základ bez obsahu: obsah.js stiahne kus, ale nič neukáže) */
export function prazdnyKus(c) {
  const m = /^<div\b[^>]*>/.exec(c.html);
  return m ? m[0] + "\n<!-- -->\n</div>" : c.html;
}

/** Vloží kusy obsahu do HTML živej stránky (miesto paticka | popis). Vráti { html, ok, popis }. */
export function vlozObsah(html, casti, miesto) {
  const kusy = casti.map((c, i) => (c.plne ? sSondou(c.html, i + 1) : c.html));
  if (miesto === "popis") {
    const zac = html.indexOf('<div class="basic-description">');
    if (zac < 0) return { html, ok: false, popis: "na stránke nie je .basic-description" };
    const kon = koniecDiv(html, zac);
    const h3 = html.indexOf("</h3>", zac);
    const odkial = h3 > zac && h3 < kon ? h3 + 5 : html.indexOf(">", zac) + 1;
    return { html: html.slice(0, odkial) + "\n" + kusy.join("\n") + "\n</div>" + html.slice(kon), ok: true, popis: "Popis produktu (starý obsah nahradený)" };
  }
  const m = /<div class="custom-footer elements-(\d+)">/.exec(html);
  if (!m) return { html, ok: false, popis: "na stránke nie je .custom-footer" };
  const kon = koniecDiv(html, m.index);
  const stlpce = kusy.map((k, i) => `\n<div class="custom-footer__banner${90 + i} ">\n<div class="banner">\n<div class="banner-wrapper">\n<span data-ec-promo-id="${990 + i}">${k}</span>\n</div>\n</div>\n</div>\n`).join("");
  const vnutro = html.slice(m.index, kon - 6).replace(`elements-${m[1]}`, `elements-${Number(m[1]) + kusy.length}`);
  return { html: html.slice(0, m.index) + vnutro + stlpce + "</div>" + html.slice(kon), ok: true, popis: `pätička (${kusy.length} nové bannery ako v Shoptete)` };
}

/**
 * Nová karta: bundle/CSS z buildu, obrázky 1V lokálne, sonda, log požiadaviek.
 *   kusy   – časti obsahu produktu (build.admin.casti(kľúč)); cdnKusy = { cast: html } prepíše, čo dostane obsah.js z CDN
 *            (základ bez obsahu = prázdne korene, sonda čísel = kus s pridanou sekciou)
 *   miesto – cdn | paticka | popis | popis-cdn | zive (pri paticka/popis/popis-cdn sa dokument produktu zachytí a kusy
 *            sa doň vložia)
 *   dokKusy – popis-cdn: kusy do Popisu (kus 1 --bez-webp); CDN obslúži všetky kusy (kusy) ako pri cdn
 *   vypadok – požiadavky na kusy z CDN zlyhajú ako výpadok siete (Fetch.failRequest ConnectionFailed)
 */
export async function novaStranka(ch, sirka, build, { vlozit = true, miesto = "cdn", log = () => {}, produkt = null, kusy = null, cdnKusy = null, dokKusy = null, vypadok = false } = {}) {
  const k = await ch.novaKarta({ sirka });
  const casti = kusy || build.admin.casti("598");
  const doDokumentu = miesto === "popis-cdn" ? dokKusy || casti.slice(0, 1) : casti;
  const s = { k, sirka, posty: [], inePosty: [], poziadavky: [], html: [], vlozene: null };
  await k.posli("Network.setBlockedURLs", { urls: MERACE });
  await k.posli("Network.setCacheDisabled", { cacheDisabled: true });
  k.na("Network.requestWillBeSent", (p) => s.poziadavky.push(p.request.url));
  const odpovedz = (p, body, typ, kod = 200) => k.posli("Fetch.fulfillRequest", {
    requestId: p.requestId, responseCode: kod, body: Buffer.from(body).toString("base64"),
    responseHeaders: [{ name: "Content-Type", value: typ }, { name: "Access-Control-Allow-Origin", value: "*" }, { name: "Cache-Control", value: "no-store" }],
  });
  // CDN kusy: lokálny dist (s sondou), alebo prepis z cdnKusy; neznámy kus = 404 ako na CDN
  const cdnHtml = {};
  if (miesto === "cdn" || miesto === "popis-cdn") casti.forEach((c, i) => { cdnHtml[c.cast] = c.plne ? sSondou(c.html, i + 1) : c.html; });
  if (cdnKusy) Object.assign(cdnHtml, cdnKusy);
  const cesta = produkt ? new URL(produkt.url).pathname : "/luxusne-autokoberce-dragonskin-diamond-line/";
  const vlozitDoc = vlozit && (miesto === "paticka" || miesto === "popis" || miesto === "popis-cdn");
  k.na("Fetch.requestPaused", async (p) => {
    const u = p.request.url;
    try {
      if (p.responseStatusCode !== undefined || p.responseErrorReason) {
        // dokument produktu (fáza Response): vlož obsah
        if (vlozitDoc && p.resourceType === "Document" && p.responseStatusCode === 200) {
          const telo = await k.posli("Fetch.getResponseBody", { requestId: p.requestId });
          const html = telo.base64Encoded ? Buffer.from(telo.body, "base64").toString("utf8") : telo.body;
          const v = vlozObsah(html, doDokumentu, miesto === "popis-cdn" ? "popis" : miesto);
          s.vlozene = v;
          const hlavicky = (p.responseHeaders || []).filter((h) => !/^(content-length|content-encoding|transfer-encoding)$/i.test(h.name));
          return await k.posli("Fetch.fulfillRequest", { requestId: p.requestId, responseCode: 200, responseHeaders: hlavicky, body: Buffer.from(v.html, "utf8").toString("base64") });
        }
        return await k.posli("Fetch.continueRequest", { requestId: p.requestId });
      }
      const kus = RE_HTML_KUS.exec(u);
      if (/\/action\//i.test(u)) {
        if (/\/action\/Cart\/addCartItem/i.test(u)) {
          s.posty.push(u);
          return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        }
        // merač Mety (Shoptet FacebookCAPI, naživo od 15. 10. 2026): zrušiť, nepočítať ako zápis nášho kódu
        if (/\/action\/FacebookCAPI\//i.test(u)) return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        if (p.request.method !== "GET" && !/\/action\/CustomerCookieConsent\//i.test(u)) {
          s.inePosty.push(p.request.method + " " + u);
          return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "Aborted" });
        }
      } else if (u.indexOf(SONDA) === 0) {
        return await odpovedz(p, PNG_1x1, "image/png");
      } else if (kus && miesto !== "zive") {
        s.html.push(kus[1]);
        if (vypadok) return await k.posli("Fetch.failRequest", { requestId: p.requestId, errorReason: "ConnectionFailed" });
        if (cdnHtml[kus[1]] != null) return await odpovedz(p, cdnHtml[kus[1]], "text/html; charset=utf-8");
        return await odpovedz(p, "Not found", "text/plain", 404);
      } else if (/\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?js\/luxuryCar\.js(\?|$)/.test(u)) {
        return await odpovedz(p, build.js, "application/javascript; charset=utf-8");
      } else if (/\/eshopy\/luxuryCar\/assets\/(v\/[^/]+\/)?css\/luxuryCar\.css(\?|$)/.test(u)) {
        return await odpovedz(p, build.css, "text/css; charset=utf-8");
      } else {
        const m = /\/eshopy\/luxuryCar\/assets\/img\/1v\/([^?#]+)/.exec(u);
        const subor = m && join(KOREN, "assets/img/1v", decodeURIComponent(m[1]));
        if (subor && existsSync(subor)) return await odpovedz(p, readFileSync(subor), TYP[extname(subor).toLowerCase()] || "application/octet-stream");
      }
      await k.posli("Fetch.continueRequest", { requestId: p.requestId });
    } catch (e) { log("fetch " + u.slice(0, 80) + ": " + e.message); }
  });
  const vzory = [
    { urlPattern: "*/eshopy/luxuryCar/assets/*", requestStage: "Request" },
    { urlPattern: "*/action/*", requestStage: "Request" },
  ];
  if (vlozitDoc) vzory.push({ urlPattern: "*luxurycardesign.*" + cesta.replace(/\/$/, "") + "*", resourceType: "Document", requestStage: "Response" });
  await k.posli("Fetch.enable", { patterns: vzory });
  return s;
}

/** Konfigurátor živej stránky je postavený (výraz v stránke) — predvolene set (598 a spol.). */
const PRIPRAVENY_SET = `!!(function () { var f = document.getElementById("product-detail-form"); return f && f.querySelector(".content-wrap .wheel-Position") && f.querySelector(".content-wrap .next-step-button"); })()`;

/**
 * Otvorí produkt (flag "1" | "vyvoj" | null), odmietne cookies, počká na konfigurátor (pripravene = výraz z
 * tools/test-1v/produkty.mjs TYPY_TEST[typ].pripravene), pri flagu aj na obsah z CDN, a na ustálenie.
 */
export async function otvorProdukt(s, { url = URL_598, flag = null, pripravene = PRIPRAVENY_SET } = {}) {
  const ciel = flag ? url + (url.includes("?") ? "&" : "?") + "novy=" + flag : url;
  await s.k.posli("Page.bringToFront").catch(() => {});
  await s.k.chod(ciel);
  for (let i = 0; i < 30; i++) {
    const r = await s.k.ev(`(function () {
      var b = Array.prototype.find.call(document.querySelectorAll(".siteCookies button, .siteCookies a, button, a"), function (e) { return e.offsetParent && /^\\s*(Odmietnu|Odmítnou)/i.test(e.textContent || ""); });
      if (b) { b.click(); return "odmietnuté"; }
      return document.querySelector(".siteCookies") && document.querySelector(".siteCookies").offsetHeight ? "" : "bez lišty";
    })()`).catch(() => "");
    if (r) break;
    await pauza(250);
  }
  const start = Date.now();
  while (Date.now() - start < 30000) {
    const ok = await s.k.ev(pripravene).catch(() => false);
    if (ok) break;
    await pauza(250);
  }
  if (flag) {
    // obsah z CDN: obsah.js po stiahnutí (window.__lcd1v.obsah.hotovo) + dosadené čísla (cisla)
    await s.k.ev(`(async function () {
      var t0 = Date.now();
      while (Date.now() - t0 < 15000 && !(window.__lcd1v && window.__lcd1v.obsah)) await new Promise(function (r) { setTimeout(r, 100); });
      var o = window.__lcd1v && window.__lcd1v.obsah;
      if (!o) return null;
      if (o.hotovo) await Promise.race([o.hotovo, new Promise(function (r) { setTimeout(r, 15000); })]);
      if (o.cisla) await Promise.race([o.cisla, new Promise(function (r) { setTimeout(r, 15000); })]);
      return o.stav;
    })()`).catch(() => null);
  }
  await pauza(2500); // configurator-enhance, moduly 1V, widgety starého popisu (recenzie, videá)
}

/** Spätná kompatibilita: 598 s ?novy=1 alebo bez. */
export function otvor598(s, { novy = false, url = URL_598 } = {}) {
  return otvorProdukt(s, { url, flag: novy ? "1" : null });
}

// ------------------------------------------------------------------ čísla obsahu: nezávislé očakávania (GET živých stránok)
const strankyCache = new Map();
const dekoduj = (s) => String(s || "").replace(/&nbsp;| /g, " ").replace(/&amp;/g, "&").replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, " ").trim();

/** Živá stránka produktu (len GET): { cena, selecty: { "<data-parameter-name>": [{ value, text, fp }] } }. */
export async function zivaStranka(url) {
  if (!strankyCache.has(url)) {
    strankyCache.set(url, fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (lcd-1v test)" } }).then((r) => {
      if (!r.ok) throw new Error("GET " + url + " -> HTTP " + r.status);
      return r.text();
    }).then((html) => {
      const c = /itemprop="price"\s+content="([\d.]+)"/.exec(html);
      const selecty = {};
      for (const m of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
        const n = /data-parameter-name="([^"]*)"/.exec(m[1]);
        if (!n) continue;
        selecty[dekoduj(n[1])] = [...m[2].matchAll(/<option\b([^>]*)>([^<]*)/gi)]
          .map((o) => ({ value: (/value="([^"]*)"/.exec(o[1]) || [])[1] || "", fp: Number((/data-surcharge-final-price="([^"]*)"/.exec(o[1]) || [])[1]), text: dekoduj(o[2]) }))
          .filter((o) => /^\d+$/.test(o.value));
      }
      return { cena: c ? Number(c[1]) : null, selecty };
    }));
  }
  return strankyCache.get(url);
}

const sumaTrhu = (n, web) => (Number(n) > 0 ? String(Math.round(n)) + (web === "cz" ? " Kč" : " €") : null);
const select = (st, re) => { const k = Object.keys(st.selecty).find((x) => re.test(x)); return k ? st.selecty[k] : []; };
const vel = (o) => ((/^(XL|S|M|L)\s*:/i.exec(o.text) || [])[1] || "").toUpperCase();

/**
 * Očakávané texty sondy čísel pre produkt (nezávisle od kódu webu: register zo zdroja + GET živých stránok).
 * -> [{ kluc, text | null, tvar? }] a odkazy [{ typ, href }].
 */
export async function ocakavaneCisla(reg, produkt, web = "sk") {
  const v = produkt.vzor;
  const url = (typ) => { const p = sestra(reg, typ, v); return p ? p.url : null; };
  const st = (typ) => zivaStranka(url(typ));
  const ja = await zivaStranka(produkt.url);
  const jedno = await st("jedno"), box = await st("boxy");
  const kufor = select(jedno, /do\s+kufr/i);
  const classic = (kufor.find((o) => /dno/i.test(o.text) && !/bok/i.test(o.text)) || {}).fp;
  const premium = (kufor.find((o) => /bok/i.test(o.text)) || {}).fp;
  const velkost = (stranka, re, V) => (select(stranka, re).find((o) => vel(o) === V) || {}).fp;
  const cenaTypu = async (t) => (await st(t)).cena;
  const farby = (re) => { const n = select(ja, re).length; return n ? n + " " + (web === "cz" ? (n === 1 ? "barva" : n <= 4 ? "barvy" : "barev") : (n === 1 ? "farba" : n <= 4 ? "farby" : "farieb")) : null; };
  const suma = (n) => sumaTrhu(n, web);
  const bezDruhej = web === "cz" ? "bez druhé vrstvy" : "bez druhej vrstvy";
  const bezUspory = "bez úspory";
  const cisla = [
    { kluc: "cena-od", tvar: "od {}", text: suma(ja.cena) && "od " + suma(ja.cena) },
    { kluc: "cena-od-jedno", text: suma(await cenaTypu("jedno")) },
    { kluc: "cena-od-dvoj", text: suma(await cenaTypu("dvoj")) },
    { kluc: "cena-od-classic", text: suma(await cenaTypu("kufor-classic")) },
    { kluc: "cena-od-premium", text: suma(await cenaTypu("kufor-premium")) },
    { kluc: "cena-od-boxy", text: suma(box.cena) },
    // cena typu v ZADANOM vzore (integrácia 14. 10. 2026, Classic FAQ 11) — nezávisle: GET stránky toho vzoru z registra
    { kluc: "cena-od-classic-diamond", text: suma((await zivaStranka(sestra(reg, "kufor-classic", "diamond").url)).cena) },
    { kluc: "cena-od-classic-hexa", text: suma((await zivaStranka(sestra(reg, "kufor-classic", "hexa").url)).cena) },
    { kluc: "cena-od-premium-stripe", text: suma((await zivaStranka(sestra(reg, "kufor-premium", "stripe").url)).cena) },
    { kluc: "set-classic", text: suma(classic) },
    { kluc: "set-premium", text: suma(premium) },
    { kluc: "set-usetrite-classic", text: suma((await cenaTypu("kufor-classic")) - classic) },
    { kluc: "box-sam-M", text: suma(box.cena + velkost(box, /\b1\.\s*box/i, "M")) },
    { kluc: "box-sam-XL", text: suma(box.cena + velkost(box, /\b1\.\s*box/i, "XL")) },
    { kluc: "box2-sam-XL", text: suma(velkost(box, /\b2\.\s*box/i, "XL")) },
    { kluc: "box-set-L", text: suma(velkost(jedno, /box\s*solo/i, "L")) },
    { kluc: "box-set2-S", text: suma(velkost(jedno, /\b1\.\s*box/i, "S")) },
    { kluc: "pocet-farieb", text: farby(/^(farba|barva)\s*1\.?\s*vrstv/i) },
    { kluc: "pocet-farieb-2", text: farby(/^(farba|barva)\s*2\.?\s*vrstv/i) || bezDruhej, bez: bezDruhej },
    { kluc: "vzor", text: v ? v.charAt(0).toUpperCase() + v.slice(1) + " Line" : null },
    // na rohoži úspora setu; inde nezistená -> náhradný text
    { kluc: "set-usetrite", bez: bezUspory, text: /^kufor-/.test(produkt.typ) ? suma(ja.cena - (produkt.typ === "kufor-premium" ? premium : classic)) : bezUspory },
    { kluc: "neexistuje-xyz", text: null },
  ];
  const odkazy = ["jedno", "dvoj", "classic", "premium", "boxy"].map((t) => {
    const p = sestra(reg, { classic: "kufor-classic", premium: "kufor-premium" }[t] || t, v);
    return { typ: t, href: p ? p.cesta + "#p1v-test" : null };
  });
  return { cisla, odkazy };
}

/** Sekcia sondy čísel (pridá sa do 1. kusu kľúča pri --sonda-cisla). */
export function sekciaSondyCisel(oc) {
  const sp = oc.cisla.map((c) => `<li data-p1v-sonda="${c.kluc}"><span data-p1v-cislo="${c.kluc}"${c.tvar ? ` data-p1v-tvar="${c.tvar}"` : ""}${c.bez ? ` data-p1v-bez="${c.bez}"` : ""}><!-- --></span></li>`).join("");
  const od = oc.odkazy.map((o) => `<li><a href="/luxusne-autokoberce-dragonskin-diamond-line/#p1v-test" data-p1v-odkaz="${o.typ}">${o.typ}</a></li>`).join("");
  return `<section data-lcd-sekcia="x-sonda-cisla" class="chapter"><div class="wrap"><ul>${sp}</ul><ul class="p1v-sonda-odkazy">${od}</ul></div></section>`;
}

export { pauza };
