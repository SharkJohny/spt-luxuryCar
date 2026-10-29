// Denná automatika recenzií Google na Michalovom PC (Plánovač úloh „LCD Recenzie Google“, 8:30 + po prihlásení).
// Návod: docs/recenzie-automatika.md
//
// Beh (v SAMOSTATNOM klone len pre automatiku, nikdy nie v dev worktree):
//   1. git fetch + reset --hard origin/main (čistý stav)
//   2. node tools/scrape-google-reviews.mjs  (headless Chrome, Google Vyhľadávanie; < 90 % = exit 2)
//   3. node tools/reviews-update.mjs + python tools/recenzie-nahlady.py (+ --check)
//   4. zmenili sa dáta? (bez fetchedAt/relativeDate) -> commit LEN dátových súborov -> fetch/rebase -> push do main
//      (max 3 pokusy, nikdy force); inak nič necommituje
//   5. po pushi počká, kým CI (production.yml) dá dáta na CDN (assets/data/reviews-data.js)
// Zlyhanie: počítadlo neúspešných dní v stave mimo repa; 3. deň po sebe -> úloha v CRM (Supabase todos, 9:00,
// dedup cez auto_ulohy). Úspech počítadlo vynuluje. Log každého behu v <stav>/logy (posledných 60).
//
//   node tools/recenzie-auto/beh.mjs                 # ostrý beh (to spúšťa Plánovač)
//   node tools/recenzie-auto/beh.mjs --vynut         # aj keď dnes už raz úspešne prebehol
//   node tools/recenzie-auto/beh.mjs --bez-push      # skúška: všetko naostro, commit len lokálne, bez pushu, CRM len výpis
//   node tools/recenzie-auto/beh.mjs --simuluj-chybu # skúška zlyhania (bez scrapu); s --dnes YYYY-MM-DD simuluje ďalšie dni
//   node tools/recenzie-auto/beh.mjs --over-crm      # len overí kľúč CRM (čítanie, nič nezakladá)
//   node tools/recenzie-auto/beh.mjs --len-priprav   # len pripraví klon (registruj.ps1)
// Skúšobné voľby (len s --bez-push / --simuluj-chybu): --ref <git ref> (základ namiesto origin/main),
//   --commit-aj-bez-zmeny, --dnes YYYY-MM-DD, --stav <priečinok>, --repo <priečinok>.
import { spawnSync } from "node:child_process";
import {
  existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync, unlinkSync, copyFileSync, renameSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  nacitajData, odtlacok, povolena, parsujStatus, miestnyDen, zaznamenajNeuspech, zaznamenajUspech, trebaCrmUlohu,
  crmUloha, suhrnUpdate, POVOLENE_CESTY, PRAZDNY_STAV, LIMIT_DNI, zalozUlohuCrm,
} from "./lib.mjs";

// ------------------------------------------------------------------ voľby
const A = process.argv.slice(2);
const ma = (n) => A.includes(n);
const hodnota = (n) => { const i = A.indexOf(n); return i >= 0 && A[i + 1] && !A[i + 1].startsWith("--") ? A[i + 1] : undefined; };
const V = {
  bezPush: ma("--bez-push"),
  simulujChybu: ma("--simuluj-chybu"),
  vynut: ma("--vynut"),
  commitVzdy: ma("--commit-aj-bez-zmeny"),
  overCrm: ma("--over-crm"),
  lenPriprav: ma("--len-priprav"),
  dnes: hodnota("--dnes"),
  ref: hodnota("--ref"),
  repo: path.resolve(hodnota("--repo") || process.env.LCD_RECENZIE_REPO || "C:/Users/M/Desktop/spt-luxuryCar-recenzie-beh"),
};
const SKUSKA = V.bezPush || V.simulujChybu; // nikdy nepushne, CRM úlohu len vypíše
// skúška má vlastný stav (inak by „dnes úspešne“ zo skúšky preskočilo ostrý beh alebo pokazilo počítadlo)
const STAV_ZAKLAD = process.env.LCD_RECENZIE_STAV || path.join(os.homedir(), "Documents", "LCD-recenzie-auto");
V.stav = path.resolve(hodnota("--stav") || (SKUSKA ? path.join(STAV_ZAKLAD, "skuska") : STAV_ZAKLAD));
if (!SKUSKA && (V.ref || V.dnes || V.commitVzdy)) {
  console.error("--ref, --dnes a --commit-aj-bez-zmeny sú len na skúšku (s --bez-push alebo --simuluj-chybu).");
  process.exit(64);
}
if (V.dnes && !/^\d{4}-\d{2}-\d{2}$/.test(V.dnes)) { console.error("--dnes YYYY-MM-DD"); process.exit(64); }

const GITHUB = "https://github.com/SharkJohny/spt-luxuryCar.git";
const REFERENCIA = "C:/Users/M/Desktop/spt-luxuryCar-fixes/.git"; // lokálne objekty -> rýchly klon (ak existuje)
const ZNACKA = path.join(V.repo, ".git", "lcd-recenzie-beh");    // klon automatiky; bez nej sa reset NIKDY nespustí
const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/data/reviews-data.js";
const SUPABASE_URL_DEFAULT = "https://jwhbnsbozakeehnvfcvj.supabase.co"; // projekt CRM (nie tajné)
const DATA = "assets/js/reviews-data.js", FRESH = "tools/google-reviews-fresh.json";
const DEN = miestnyDen();
const DNES = V.dnes || DEN;
const MAX_LOGOV = 60;
const CDN_CAKAJ_MIN = Number(process.env.LCD_RECENZIE_CDN_CAKAJ ?? 20); // po pushi čakať na CI (min)
let PIESKOVISKO = false; // nastaví pripravKlon: LEN lokálny origin (priečinok) + LCD_RECENZIE_TEST_ORIGIN=1 (test-push.mjs)

// ------------------------------------------------------------------ log
const LOGY = path.join(V.stav, "logy");
mkdirSync(LOGY, { recursive: true });
const zaciatok = new Date();
const hhmmss = (d) => `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
const LOG = path.join(LOGY, `${DNES}_${hhmmss(zaciatok)}${SKUSKA ? "_skuska" : ""}.log`);
let logZapisany = false;
function log(...a) {
  const riadok = `[${new Date().toLocaleTimeString("sk-SK")}] ` + a.join(" ");
  console.log(riadok);
  try { appendFileSync(LOG, riadok + "\n", "utf8"); logZapisany = true; } catch {}
}
const logBlok = (nadpis, txt) => { const t = String(txt || "").trimEnd(); if (t) log(nadpis + "\n" + t.split(/\r?\n/).map((r) => "    " + r).join("\n")); };
function historia(riadok) {
  const f = path.join(V.stav, "historia.log");
  try {
    appendFileSync(f, `${new Date().toISOString()} ${riadok}\n`, "utf8");
    const r = readFileSync(f, "utf8").split("\n");
    if (r.length > 1200) writeFileSync(f, r.slice(-1000).join("\n"), "utf8");
  } catch {}
}
function rotujLogy() {
  try {
    const f = readdirSync(LOGY).filter((x) => /\.(log|png)$/.test(x)).sort();
    const logy = f.filter((x) => x.endsWith(".log"));
    for (const x of logy.slice(0, Math.max(0, logy.length - MAX_LOGOV))) {
      unlinkSync(path.join(LOGY, x));
      for (const p of f.filter((y) => y.endsWith(".png") && y.startsWith(x.replace(/\.log$/, "")))) unlinkSync(path.join(LOGY, p));
    }
  } catch {}
}

class Chyba extends Error {}

// ------------------------------------------------------------------ stav (mimo repa)
const STAV = path.join(V.stav, "stav.json");
function nacitajStav() {
  try { return { ...PRAZDNY_STAV, ...JSON.parse(readFileSync(STAV, "utf8")) }; } catch { return { ...PRAZDNY_STAV }; }
}
function ulozStav(s) {
  const tmp = STAV + ".tmp";
  writeFileSync(tmp, JSON.stringify(s, null, 2) + "\n", "utf8");
  renameSync(tmp, STAV);
}
const ZAMOK = path.join(V.stav, "beh.lock");
function zamkni() {
  if (existsSync(ZAMOK)) {
    try {
      const z = JSON.parse(readFileSync(ZAMOK, "utf8"));
      const zije = (() => { try { process.kill(z.pid, 0); return true; } catch { return false; } })();
      if (zije && Date.now() - Date.parse(z.od) < 2 * 3600e3) return false;
    } catch {}
  }
  writeFileSync(ZAMOK, JSON.stringify({ pid: process.pid, od: new Date().toISOString() }), "utf8");
  return true;
}
const odomkni = () => { try { unlinkSync(ZAMOK); } catch {} };

// ------------------------------------------------------------------ príkazy
const ENV = { ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "never", PYTHONIOENCODING: "utf-8" };
function spusti(prikaz, argv, { cwd = V.repo, limit = 180000, tichy = false } = {}) {
  const r = spawnSync(prikaz, argv, { cwd, env: ENV, encoding: "utf8", timeout: limit, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  const vystup = `${r.stdout || ""}${r.stderr ? (r.stdout ? "\n" : "") + r.stderr : ""}`.trim();
  const kod = r.error ? (r.error.code === "ETIMEDOUT" ? "časový limit" : r.error.message) : r.status;
  if (!tichy) logBlok(`$ ${path.basename(prikaz)} ${argv.join(" ")}  -> ${kod}`, vystup);
  return { kod, ok: r.status === 0 && !r.error, vystup, stdout: r.stdout || "" };
}
const git = (argv, o = {}) => spusti("git", ["-c", "core.quotepath=off", ...argv], o);
function gitMusi(argv, popis, o = {}) {
  const r = git(argv, o);
  if (!r.ok) throw new Chyba(`${popis}: git ${argv[0]} -> ${r.kod}${r.vystup ? " (" + r.vystup.split("\n").slice(-2).join(" | ").slice(0, 300) + ")" : ""}`);
  return r;
}
const NODE = process.execPath;
const PYTHON = process.env.LCD_PYTHON || "python";
const posledne = (txt, n = 4) => String(txt || "").split(/\r?\n/).filter(Boolean).slice(-n).join(" | ").slice(0, 400);
const pauza = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ klon automatiky
function pripravKlon() {
  if (!existsSync(path.join(V.repo, ".git"))) {
    log(`klon automatiky neexistuje -> git clone do ${V.repo}`);
    const argv = ["clone", "-q"];
    if (existsSync(REFERENCIA)) argv.push("--reference-if-able", REFERENCIA, "--dissociate");
    argv.push(GITHUB, V.repo);
    gitMusi(argv, "klon automatiky", { cwd: path.dirname(V.repo), limit: 900000 });
    writeFileSync(ZNACKA, "Klon LEN pre automatiku recenzií (tools/recenzie-auto/beh.mjs) — každý beh robí reset --hard origin/main.\n", "utf8");
  }
  if (!existsSync(ZNACKA)) throw new Chyba(`${V.repo} nie je klon automatiky (chýba .git/lcd-recenzie-beh) — reset --hard tam nespustím`);
  const url = git(["remote", "get-url", "origin"], { tichy: true }).stdout.trim();
  // pieskovisko (tools/recenzie-auto/test-push.mjs): origin je lokálny priečinok, nikdy GitHub -> smie falošný scraper
  PIESKOVISKO = process.env.LCD_RECENZIE_TEST_ORIGIN === "1" && !!url && !/^(https?:|git@|ssh:)/i.test(url) && !/github/i.test(url);
  if (!PIESKOVISKO && !/github\.com[/:]SharkJohny\/spt-luxuryCar(\.git)?$/i.test(url)) throw new Chyba(`origin klonu nie je SharkJohny/spt-luxuryCar`);
  if (PIESKOVISKO) log(`PIESKOVISKO: origin = ${url} (lokálny priečinok, nie GitHub)`);
}

/** Čistý stav na základe (origin/main alebo --ref pri skúške). Vráti sha základu. */
function cistyStav() {
  git(["rebase", "--abort"], { tichy: true });
  git(["merge", "--abort"], { tichy: true });
  let zaklad;
  if (V.ref) zaklad = V.ref;
  else {
    let f;
    for (let i = 1; i <= 3; i++) { f = git(["fetch", "--prune", "origin", "main"], { limit: 300000 }); if (f.ok) break; }
    if (!f.ok) throw new Chyba("git fetch origin main zlyhal 3× (internet / GitHub prihlásenie?)");
    zaklad = "origin/main";
  }
  gitMusi(["checkout", "-q", "-f", "--detach", zaklad], "checkout základu");
  gitMusi(["reset", "--hard", zaklad], "reset na základ");
  gitMusi(["clean", "-fd"], "clean");
  return git(["rev-parse", "HEAD"], { tichy: true }).stdout.trim();
}

// ------------------------------------------------------------------ jadro
function aktualizuj() {
  const u = spusti(NODE, ["tools/reviews-update.mjs"], { limit: 600000 });
  if (!u.ok) throw new Chyba(`reviews-update zlyhal (exit ${u.kod}): ${posledne(u.vystup, 2)}`);
  const n = spusti(PYTHON, ["tools/recenzie-nahlady.py"], { limit: 300000 });
  if (!n.ok) throw new Chyba(`recenzie-nahlady zlyhal (exit ${n.kod}): ${posledne(n.vystup, 2)}`);
  const c = spusti(PYTHON, ["tools/recenzie-nahlady.py", "--check"], { limit: 120000 });
  if (!c.ok) throw new Chyba(`recenzie-nahlady --check: ${posledne(c.vystup, 1)}`);
  return u.stdout;
}

/** Porovná pracovný stav so základom. Vráti { zmenene, povolene[], ine[], suhrn }. */
function zmeny(zakladData) {
  const st = parsujStatus(git(["status", "--porcelain=v1", "-uall"], { tichy: true }).stdout);
  const pov = st.filter((x) => povolena(x.cesta));
  const ine = st.filter((x) => !povolena(x.cesta));
  const zmazane = pov.filter((x) => x.kod.includes("D"));
  if (zmazane.length) throw new Chyba("aktualizácia by zmazala dátové súbory: " + zmazane.map((x) => x.cesta).join(", "));
  const noveObrazky = pov.filter((x) => x.kod === "??" && x.cesta.startsWith("assets/img/"));
  const po = nacitajData(readFileSync(path.join(V.repo, DATA), "utf8"));
  const zmenene = odtlacok(zakladData) !== odtlacok(po) || noveObrazky.length > 0;
  return { zmenene, povolene: pov, ine, po, noveObrazky };
}

function commitni(zakladData, po, vystupUpdate) {
  gitMusi(["add", "-A", "--", ...POVOLENE_CESTY], "git add dát");
  const staged = git(["diff", "--cached", "--name-only"], { tichy: true }).stdout.split(/\r?\n/).filter(Boolean);
  const zle = staged.filter((p) => !povolena(p));
  if (zle.length) throw new Chyba("v commite by boli nedátové súbory: " + zle.join(", "));
  if (!staged.length) throw new Chyba("nie je čo commitnúť (prázdny index)");
  const s = suhrnUpdate(vystupUpdate);
  const nadpis = `Recenzie Google: automatická aktualizácia dát ${DNES} (${zakladData.place.totalReviews} → ${po.place.totalReviews} na profile, v súbore ${po.reviews.length})`;
  const telo = [s.profil, s.data, ...s.nove.map((x) => "  " + x), "", `Súbory: ${staged.length} (len dáta recenzií).`,
    "Automatika: tools/recenzie-auto/beh.mjs (Plánovač úloh „LCD Recenzie Google“), docs/recenzie-automatika.md"].filter((x, i, a) => x || a[i - 1]);
  const msgSubor = path.join(V.stav, "commit-msg.txt");
  writeFileSync(msgSubor, nadpis + "\n\n" + telo.join("\n") + "\n", "utf8");
  gitMusi(["commit", "-q", "-F", msgSubor], "git commit");
  const sha = git(["rev-parse", "HEAD"], { tichy: true }).stdout.trim();
  git(["show", "--stat", "--format=%h %s", "HEAD"]);
  return { sha, staged };
}

async function cdnFetchedAt() {
  try {
    const r = await fetch(CDN + "?t=" + Date.now(), { signal: AbortSignal.timeout(20000) });
    if (r.status === 404) return { stav: 404, t: NaN };
    if (!r.ok) return { stav: r.status, t: NaN };
    const m = /"fetchedAt"\s*:\s*"([^"]+)"/.exec(await r.text());
    return { stav: r.status, t: m ? Date.parse(m[1]) : NaN };
  } catch (e) { return { stav: "nedostupný (" + e.message + ")", t: NaN }; }
}

/**
 * Sú dáta z main naozaj na webe (CDN assets/data/reviews-data.js, kopíruje ich CI production.yml)?
 * cakajMin > 0 = po pushi čakaj na CI. Staré dáta na CDN > 3 h po commite = zlyhanie (CI nedobehol?).
 */
async function overCdn(repoFetchedAt, commitCasMs, cakajMin) {
  const koniec = Date.now() + cakajMin * 60e3;
  let c;
  for (;;) {
    c = await cdnFetchedAt();
    if (c.t >= repoFetchedAt) { log(`CDN OK: na webe sú dáta z ${new Date(c.t).toISOString()}`); return "naživo"; }
    if (Date.now() >= koniec) break;
    await pauza(60e3);
  }
  const vek = (Date.now() - commitCasMs) / 3600e3;
  const popis = `CDN (${c.stav}): ${c.t > 0 ? "dáta z " + new Date(c.t).toISOString() : "žiadne dáta"}, v main sú z ${new Date(repoFetchedAt).toISOString()} (commit pred ${vek.toFixed(1)} h)`;
  if (SKUSKA) { log("CDN (len informácia pri skúške): " + popis); return "skúška"; }
  if (vek > 3) throw new Chyba(popis + " — CI production.yml asi nedobehol, pozri GitHub Actions");
  log("CDN zatiaľ nemá nové dáta (CI ešte beží?): " + popis + " — overí ďalší beh");
  return "čaká na CI";
}

async function beh() {
  if (V.simulujChybu) throw new Chyba("simulovaná chyba (--simuluj-chybu) — scraper sa nespúšťal");
  pripravKlon();
  const zaklad = cistyStav();
  log(`základ: ${V.ref || "origin/main"} = ${zaklad.slice(0, 7)} v ${V.repo}`);
  for (const f of ["tools/scrape-google-reviews.mjs", "tools/reviews-update.mjs", "tools/recenzie-nahlady.py", DATA]) {
    if (!existsSync(path.join(V.repo, f))) throw new Chyba(`v základe chýba ${f}`);
  }
  const zakladData = nacitajData(readFileSync(path.join(V.repo, DATA), "utf8"));
  const zakladCommitCas = Number(git(["log", "-1", "--format=%ct", "--", DATA], { tichy: true }).stdout.trim()) * 1000 || Date.now();

  // 1) scrape (headless Chrome; diagnostické snímky pri chybe sa skopírujú k logu)
  for (const f of readdirSync(path.join(V.repo, "tools")).filter((x) => /^_scrape-.*\.png$/.test(x))) unlinkSync(path.join(V.repo, "tools", f));
  const scraper = PIESKOVISKO && process.env.LCD_RECENZIE_SCRAPER ? process.env.LCD_RECENZIE_SCRAPER : "tools/scrape-google-reviews.mjs";
  const s = spusti(NODE, [scraper], { limit: 20 * 60e3 });
  if (!s.ok) {
    for (const f of readdirSync(path.join(V.repo, "tools")).filter((x) => /^_scrape-.*\.png$/.test(x))) {
      try { copyFileSync(path.join(V.repo, "tools", f), LOG.replace(/\.log$/, "") + "-" + f.replace(/^_scrape-/, "")); } catch {}
    }
    throw new Chyba(`scraper Google zlyhal (exit ${s.kod}): ${posledne(s.vystup, 2)}`);
  }
  const zaloha = path.join(V.stav, "posledny-scrape.json");
  copyFileSync(path.join(V.repo, FRESH), zaloha);

  // 2) zlúčenie + náhľady, 3) commit len pri skutočnej zmene, 4) push (max 3 pokusy)
  let vystupUpdate = aktualizuj();
  let z = zmeny(zakladData);
  if (z.ine.length) log("POZOR: zmenené aj iné súbory (necommitujú sa): " + z.ine.map((x) => x.kod.trim() + " " + x.cesta).join(", "));
  log(`zmeny dát: ${z.povolene.map((x) => x.kod.trim() + " " + x.cesta).join(", ") || "žiadne"} | skutočná zmena: ${z.zmenene ? "ÁNO" : "nie (len čas stiahnutia / relatívne dátumy)"}`);
  if (!z.zmenene && !V.commitVzdy) {
    git(["reset", "-q", "--hard"], { tichy: true }); git(["clean", "-fdq"], { tichy: true });
    const cdn = await overCdn(Date.parse(zakladData.place.fetchedAt), zakladCommitCas, 0);
    return { stav: "bez-zmeny", recenzii: zakladData.place.totalReviews, cdn };
  }
  if (!z.zmenene) log("--commit-aj-bez-zmeny: commitujem aj bez skutočnej zmeny (skúška cesty commitu)");

  let { sha, staged } = commitni(zakladData, z.po, vystupUpdate);
  // zvyšky mimo commitu (nedátové zmeny) preč — rebase potrebuje čistý strom; commit ich neobsahuje
  git(["reset", "-q", "--hard", "HEAD"], { tichy: true }); git(["clean", "-fdq"], { tichy: true });

  /** fetch + rebase na origin/main; pri konflikte dáta poskladá znova z uloženého scrapu. false = nie je čo pushnúť. */
  const naNovyMain = (pokus) => {
    gitMusi(["fetch", "origin", "main"], "fetch pred pushom", { limit: 300000 });
    const rb = git(["rebase", "origin/main"]);
    if (rb.ok) { sha = git(["rev-parse", "HEAD"], { tichy: true }).stdout.trim(); return true; }
    // konflikt (niekto medzitým zmenil dáta recenzií) -> poskladať znova na novom main, nikdy nie force
    git(["rebase", "--abort"], { tichy: true });
    log(`pokus ${pokus}: rebase na origin/main mal konflikt -> skladám dáta znova na novom main`);
    gitMusi(["reset", "--hard", "origin/main"], "reset na nový main");
    gitMusi(["clean", "-fd"], "clean");
    const novyZaklad = nacitajData(readFileSync(path.join(V.repo, DATA), "utf8"));
    copyFileSync(zaloha, path.join(V.repo, FRESH));
    vystupUpdate = aktualizuj();
    z = zmeny(novyZaklad);
    if (!z.zmenene) { log("na novom main už nie je čo pridať (niekto nahral rovnaké dáta)"); return false; }
    ({ sha, staged } = commitni(novyZaklad, z.po, vystupUpdate));
    git(["reset", "-q", "--hard", "HEAD"], { tichy: true }); git(["clean", "-fdq"], { tichy: true });
    return true;
  };

  if (V.bezPush) {
    if (!V.ref && !naNovyMain(1)) return { stav: "bez-zmeny", recenzii: zakladData.place.totalReviews };
    log(`--bez-push: commit ${sha.slice(0, 7)} ostáva LEN lokálne v ${V.repo} (ďalší beh ho zmaže resetom), push sa nerobí`);
    return { stav: "commit-lokalne", sha, subory: staged, recenzii: z.po.place.totalReviews, nove: z.po.reviews.length - zakladData.reviews.length };
  }

  for (let pokus = 1; pokus <= 3; pokus++) {
    if (!naNovyMain(pokus)) return { stav: "bez-zmeny", recenzii: z.po.place.totalReviews };
    const p = git(["push", "origin", "HEAD:refs/heads/main"], { limit: 300000 });
    if (p.ok) {
      sha = git(["rev-parse", "HEAD"], { tichy: true }).stdout.trim();
      log(`PUSH OK: ${sha.slice(0, 7)} -> main (pokus ${pokus})`);
      const cdn = await overCdn(Date.parse(z.po.place.fetchedAt), Date.now(), CDN_CAKAJ_MIN);
      return { stav: "pushnute", sha, subory: staged, recenzii: z.po.place.totalReviews, cdn };
    }
    log(`push pokus ${pokus} neprešiel${/rejected|non-fast-forward|fetch first/i.test(p.vystup) ? " (main sa medzitým posunul)" : ""}`);
  }
  throw new Chyba("push do main neprešiel ani na 3. pokus (kolízia s iným pushom alebo GitHub prihlásenie)");
}

// ------------------------------------------------------------------ CRM (Supabase todos + auto_ulohy)
function nacitajKlucCrm() {
  const kandidati = [process.env.LCD_CRM_ENV, path.join(os.homedir(), ".claude", "secrets", "crm.env"),
    "C:/Users/M/Desktop/claud/kontakty-app/.env.local", "C:/Users/M/Desktop/claud/kontakty-app/.env"].filter(Boolean);
  for (const f of kandidati) {
    let txt; try { txt = readFileSync(f, "utf8"); } catch { continue; }
    const env = {};
    for (const r of txt.split(/\r?\n/)) { const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(r); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
    const kluc = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
    if (kluc) return { subor: f, url: (env.SUPABASE_URL || SUPABASE_URL_DEFAULT).replace(/\/+$/, ""), kluc };
  }
  return { subor: null, kandidati };
}

async function zalozCrmUlohu(kluc, uloha, { naostro }) {
  const k = nacitajKlucCrm();
  const url = k.url || SUPABASE_URL_DEFAULT;
  if (!naostro) {
    log("CRM — SKÚŠKA, nič sa neposiela. Ostrý beh by poslal (kľúč sa nikdy nevypisuje):");
    log(`  kľúč: ${k.subor ? "nájdený v " + k.subor : "NENÁJDENÝ (hľadané: " + k.kandidati.join(", ") + ") — ostrý beh by ukázal upozornenie Windows"}`);
    log(`  GET  ${url}/rest/v1/app_owner?select=user_id&limit=1   hlavičky: apikey=<skryté>, Authorization=Bearer <skryté>`);
    log(`  POST ${url}/rest/v1/auto_ulohy   ${JSON.stringify({ user_id: "<z app_owner>", kluc })}   (409 = už založená -> koniec)`);
    log(`  GET  ${url}/rest/v1/todos?select=id&user_id=eq.<id>&text=eq.<text>&limit=1   (rovnaký text už je -> koniec)`);
    log(`  POST ${url}/rest/v1/todos   ` + JSON.stringify({ user_id: "<z app_owner>", text: uloha.text, done: false, due_at: uloha.due_at, reminder_at: uloha.reminder_at }));
    logBlok("  note:", uloha.note);
    return { ok: true, skuska: true };
  }
  if (!k.subor) return { ok: false, chyba: "chýba kľúč CRM (nastav ho: tools/recenzie-auto/nastav-kluc-crm.ps1)" };
  return zalozUlohuCrm({ url, apiKluc: k.kluc, dedup: kluc, uloha });
}

/** Záloha, keď sa CRM úloha nedá založiť: upozornenie Windows (len pri ostrom behu). */
function upozornenieWindows(nadpis, text) {
  const ps = "$ErrorActionPreference='Stop';" +
    "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null;" +
    "$x=[Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);" +
    "$t=$x.GetElementsByTagName('text');$t.Item(0).AppendChild($x.CreateTextNode($env:LCD_N))>$null;$t.Item(1).AppendChild($x.CreateTextNode($env:LCD_T))>$null;" +
    "[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe').Show([Windows.UI.Notifications.ToastNotification]::new($x))";
  const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", ps], { env: { ...process.env, LCD_N: nadpis, LCD_T: text }, windowsHide: true, timeout: 30000, encoding: "utf8" });
  log(`upozornenie Windows: ${r.status === 0 ? "zobrazené" : "nepodarilo sa (" + String(r.stderr || r.error || "").trim().slice(0, 200) + ")"}`);
}

async function overCrm() {
  const k = nacitajKlucCrm();
  if (!k.subor) { console.log("Kľúč CRM nenájdený. Hľadané: " + k.kandidati.join(", ") + "\nNastav ho: powershell -File tools\\recenzie-auto\\nastav-kluc-crm.ps1"); return 1; }
  try {
    const r = await fetch(k.url + "/rest/v1/app_owner?select=user_id&limit=1", { headers: { apikey: k.kluc, authorization: "Bearer " + k.kluc }, signal: AbortSignal.timeout(20000) });
    const d = r.ok ? await r.json() : null;
    const ok = r.ok && Array.isArray(d) && d.length === 1;
    console.log(`Kľúč CRM z ${k.subor}: HTTP ${r.status} — ${ok ? "OK, majiteľ CRM nájdený (úlohu by vedel založiť)" : "NEFUNGUJE (zlý kľúč alebo nie je secret/service_role)"}`);
    return ok ? 0 : 1;
  } catch (e) { console.log("CRM nedostupné: " + e.message); return 1; }
}

// ------------------------------------------------------------------ hlavný tok
/** registruj.ps1: klon automatiky + reset na origin/main, stav ani počítadlo sa nemenia. */
function lenPriprav() {
  try {
    pripravKlon();
    const z = cistyStav();
    const chyba = ["tools/recenzie-auto/beh.mjs", "tools/recenzie-auto/spusti-skryto.vbs", "tools/scrape-google-reviews.mjs", "tools/reviews-update.mjs"]
      .filter((f) => !existsSync(path.join(V.repo, f)));
    if (chyba.length) { log(`klon ${V.repo} je na origin/main ${z.slice(0, 7)}, ale chýba: ${chyba.join(", ")} — najprv push automatiky do main`); return 2; }
    log(`klon pripravený: ${V.repo} na origin/main ${z.slice(0, 7)}`);
    return 0;
  } catch (e) { log("príprava klonu zlyhala: " + e.message); return 1; }
}

async function hlavny() {
  if (V.overCrm) return overCrm();
  if (V.lenPriprav) return lenPriprav();
  if (!zamkni()) { historia(`${DNES} preskočené — beží iný beh (${ZAMOK})`); console.log("Beží iný beh automatiky — končím."); return 0; }
  let stav = nacitajStav();
  try {
    if (!V.vynut && !SKUSKA && stav.poslednyUspechDen === DNES) {
      historia(`${DNES} preskočené — dnes už úspešne (${stav.poslednyUspech})`);
      return 0;
    }
    log(`=== Recenzie Google — automatika ${DNES}${SKUSKA ? " (SKÚŠKA: " + [V.bezPush && "--bez-push", V.simulujChybu && "--simuluj-chybu", V.ref && "--ref " + V.ref, V.dnes && "--dnes " + V.dnes].filter(Boolean).join(" ") + ")" : ""} ===`);
    log(`klon: ${V.repo} | stav a logy: ${V.stav}`);
    try {
      const v = await beh();
      stav =zaznamenajUspech(stav, DNES, new Date().toISOString(), { ...v, log: LOG });
      ulozStav(stav);
      log(`HOTOVO: ${v.stav}${v.sha ? " " + v.sha.slice(0, 7) : ""}${v.cdn ? " | CDN: " + v.cdn : ""} — počítadlo zlyhaní vynulované`);
      historia(`${DNES} OK ${v.stav}${v.sha ? " " + v.sha.slice(0, 7) : ""} recenzií ${v.recenzii ?? "?"}${SKUSKA ? " (skúška)" : ""}`);
      return 0;
    } catch (e) {
      const sprava = e instanceof Chyba ? e.message : "nečakaná chyba: " + (e && e.stack || e);
      log("ZLYHANIE: " + sprava);
      stav = zaznamenajNeuspech(stav, DNES, sprava.split("\n")[0], LOG);
      log(`neúspešné dni po sebe: ${stav.neuspesneDni} (séria od ${stav.prvyNeuspesnyDen}); CRM úloha pri ${LIMIT_DNI}. dni`);
      const kluc = trebaCrmUlohu(stav);
      if (kluc) {
        const uloha = crmUloha(stav, { den: DNES, repo: V.repo, stavDir: V.stav });
        const r = await zalozCrmUlohu(kluc, uloha, { naostro: !SKUSKA });
        if (r.ok) {
          stav = { ...stav, crmUloha: { kluc, kedy: new Date().toISOString(), todo: r.todo || null, existovala: !!r.existuje, skuska: !!r.skuska } };
          log(`CRM úloha ${r.skuska ? "(skúška — nezaložená)" : r.existuje ? "už existovala" : "ZALOŽENÁ"}: ${kluc}`);
        } else {
          log("CRM úlohu sa nepodarilo založiť: " + r.chyba + " — skúsi sa znova pri ďalšom behu");
          upozornenieWindows("Recenzie Google sa neaktualizujú", `Automatika zlyháva ${stav.neuspesneDni} dni. Log: ${LOG}`);
        }
      } else if (stav.crmUloha && stav.crmUloha.kluc) log(`CRM úloha pre túto sériu už je (${stav.crmUloha.kluc}) — nová sa nezakladá`);
      ulozStav(stav);
      historia(`${DNES} ZLYHANIE (${stav.neuspesneDni}. deň) ${sprava.split("\n")[0].slice(0, 200)}${SKUSKA ? " (skúška)" : ""}`);
      return 1;
    }
  } finally {
    odomkni();
    rotujLogy();
  }
}

hlavny().then((kod) => process.exit(kod), (e) => { console.error(e); process.exit(1); });
