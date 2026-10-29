// Skúška push/rebase cesty automatiky v PIESKOVISKU — bez GitHubu, bez Googlu, bez CRM:
//   lokálny „origin“ (bare repo v priečinku) z HEAD tohto repa, klon automatiky so značkou, falošný scraper
//   (pridá 1 skúšobnú recenziu) a „iná session“, ktorá počas scrapu pushne do main.
//
//   node tools/recenzie-auto/test-push.mjs [priečinok]     # exit 1 = chyba
//
// Scenáre: A) iná session zmení iný súbor -> rebase prejde, push ✓
//          B) iná session zmení reviews-data.js -> rebase konflikt -> dáta sa poskladajú znova na novom main, push ✓
//          C) Google nič nové -> žiadny commit
//          D) z Googlu vypadne recenzia -> 1. deň sa nič nevyhodí (čaká na potvrdenie), ďalší deň vypadne (push ✓)
// Beh používa beh.mjs z tohto priečinka (aj necommitnuté zmeny), nástroje dát (reviews-update…) z HEAD.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const TU = path.dirname(fileURLToPath(import.meta.url));
const ZDROJ = path.resolve(TU, "../..");
const ROOT = path.resolve(process.argv[2] || path.join(tmpdir(), "lcd-recenzie-test-push"));
rmSync(ROOT, { recursive: true, force: true });
mkdirSync(ROOT, { recursive: true });
const ORIGIN = path.join(ROOT, "origin.git"), BEH = path.join(ROOT, "beh"), INY = path.join(ROOT, "iny"), STAV = path.join(ROOT, "stav");

const sh = (cmd, argv, cwd = ROOT, env = {}) => {
  const r = spawnSync(cmd, argv, { cwd, encoding: "utf8", windowsHide: true, env: { ...process.env, ...env }, maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(`${cmd} ${argv.join(" ")} -> ${r.status}\n${r.stdout}\n${r.stderr}`);
  return (r.stdout || "").trim();
};
const git = (cwd, ...a) => sh("git", ["-c", "core.quotepath=off", ...a], cwd);

// pieskovisko
git(ROOT, "init", "-q", "--bare", ORIGIN);
git(ZDROJ, "push", "-q", ORIGIN, "HEAD:refs/heads/main");
git(ROOT, "clone", "-q", ORIGIN, BEH);
writeFileSync(path.join(BEH, ".git", "lcd-recenzie-beh"), "pieskovisko\n");
git(ROOT, "clone", "-q", ORIGIN, INY);
const FALOSNY = path.join(ROOT, "falosny-scraper.mjs");
writeFileSync(FALOSNY, `
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const rezim = process.env.LCD_TEST_REZIM, INY = ${JSON.stringify(INY)};
const g = (...a) => { const r = spawnSync("git", a, { cwd: INY, encoding: "utf8", windowsHide: true }); if (r.status) { console.error(r.stderr); process.exit(3); } return r.stdout; };
const f = JSON.parse(readFileSync("tools/google-reviews-fresh.json", "utf8"));
if (rezim === "vypadla") f.reviews.shift(); // najnovšia recenzia „zmizne“ (počet na profile ostáva -> scrape ≥ 95 %)
else if (rezim !== "nic") {
  f.reviews.unshift({ googleId: "test-" + rezim, author: "Skúšobná Recenzia " + rezim, authorPhoto: null, rating: 5, relativeDate: "pred 2 dňami",
    text: "Len pieskovisko test-push.mjs (" + rezim + ").", photos: [], ownerResponse: null });
  f.place.totalReviews = f.reviews.length;
}
f.place.fetchedAt = new Date().toISOString();
writeFileSync("tools/google-reviews-fresh.json", JSON.stringify(f, null, 2) + "\\n");
// „iná session“ pushne do main počas scrapu
g("pull", "-q", "--ff-only", "origin", "main");
if (rezim === "iny-subor") { writeFileSync(INY + "/iny-subor.txt", "iná session " + Date.now() + "\\n"); g("add", "iny-subor.txt"); }
if (rezim === "konflikt") {
  const p = INY + "/assets/js/reviews-data.js";
  writeFileSync(p, readFileSync(p, "utf8").replace(/Stiahnuté z Google profilu Luxury Car Design: .*/, "Stiahnuté z Google profilu Luxury Car Design: RUČNÁ ZMENA INEJ SESSION")
    .replace(/(\d+) recenzií na profile/, "$1 recenzií na profile (iná session)"));
  g("add", "assets/js/reviews-data.js");
}
if (rezim === "iny-subor" || rezim === "konflikt") { g("-c", "user.name=Ina Session", "-c", "user.email=ina@test", "commit", "-q", "-m", "iná session: " + rezim); g("push", "-q", "origin", "HEAD:main"); }
console.log("[falošný scraper] " + rezim + ": recenzií " + f.reviews.length);
`);

const behRun = (rezim) => {
  const r = spawnSync(process.execPath, [path.join(TU, "beh.mjs"), "--vynut"], {
    cwd: ROOT, encoding: "utf8", windowsHide: true, maxBuffer: 64 << 20,
    env: { ...process.env, LCD_RECENZIE_REPO: BEH, LCD_RECENZIE_STAV: STAV, LCD_RECENZIE_TEST_ORIGIN: "1", LCD_RECENZIE_SCRAPER: FALOSNY,
      LCD_RECENZIE_CDN_CAKAJ: "0", LCD_TEST_REZIM: rezim, LCD_CRM_ENV: path.join(ROOT, "ziadny-kluc.env") },
  });
  writeFileSync(path.join(ROOT, `beh-${rezim}.log`), (r.stdout || "") + (r.stderr || ""));
  return { kod: r.status, out: (r.stdout || "") + (r.stderr || "") };
};
const mainLog = () => git(ORIGIN, "log", "--format=%s", "-3", "main").split("\n");
const suboryCommitu = (ref) => git(ORIGIN, "show", "--name-only", "--format=", ref).split("\n").filter(Boolean);
const dataMain = () => git(ORIGIN, "show", "main:assets/js/reviews-data.js");
let ok = 0;
const krok = (nazov, fn) => { try { fn(); ok++; console.log("OK  " + nazov); } catch (e) { process.exitCode = 1; console.log("CHYBA " + nazov + ": " + e.message.split("\n")[0]); } };

// A) iná session zmení iný súbor -> rebase prejde
let r = behRun("iny-subor");
krok("A: beh skončil úspešne (exit 0) a pushol", () => { assert.equal(r.kod, 0, r.out.slice(-800)); assert.match(r.out, /PUSH OK/); });
krok("A: commit automatiky je NAD commitom inej session", () => { const l = mainLog(); assert.match(l[0], /^Recenzie Google: automatická aktualizácia/); assert.equal(l[1], "iná session: iny-subor"); });
krok("A: commit obsahuje len dátové súbory", () => { for (const f of suboryCommitu("main")) assert.match(f, /^(assets\/js\/reviews-data\.js|tools\/google-reviews-fresh\.json|assets\/img\/reviews\/(m\/)?rg-\d+-\d+\.jpg)$/, f); });
krok("A: nová recenzia je v main", () => assert.match(dataMain(), /Skúšobná Recenzia iny-subor/));

// B) iná session zmení reviews-data.js -> konflikt -> poskladať znova
r = behRun("konflikt");
krok("B: beh skončil úspešne a pushol", () => { assert.equal(r.kod, 0, r.out.slice(-800)); assert.match(r.out, /PUSH OK/); });
krok("B: rebase konflikt sa vyriešil poskladaním dát znova (nie force)", () => assert.match(r.out, /rebase na origin\/main mal konflikt -> skladám dáta znova/));
krok("B: commit automatiky je nad commitom inej session, obe recenzie v main", () => {
  const l = mainLog(); assert.match(l[0], /^Recenzie Google/); assert.equal(l[1], "iná session: konflikt");
  const d = dataMain(); assert.match(d, /Skúšobná Recenzia konflikt/); assert.match(d, /Skúšobná Recenzia iny-subor/);
});
krok("B: commit obsahuje len dátové súbory", () => { for (const f of suboryCommitu("main")) assert.match(f, /^(assets\/js\/reviews-data\.js|tools\/google-reviews-fresh\.json|assets\/img\/reviews\/(m\/)?rg-\d+-\d+\.jpg)$/, f); });

// C) nič nové -> žiadny commit
const pred = git(ORIGIN, "rev-parse", "main");
r = behRun("nic");
krok("C: bez skutočnej zmeny sa nič necommituje ani nepushne", () => {
  assert.equal(r.kod, 0, r.out.slice(-800)); assert.match(r.out, /HOTOVO: bez-zmeny/); assert.equal(git(ORIGIN, "rev-parse", "main"), pred);
});
krok("stav: počítadlo zlyhaní 0, posledný výsledok bez-zmeny", () => {
  const s = JSON.parse(readFileSync(path.join(STAV, "stav.json"), "utf8")); assert.equal(s.neuspesneDni, 0); assert.equal(s.poslednyVysledok.stav, "bez-zmeny");
});

// D) recenzia vypadne z Googlu -> 1. deň nič (čaká), ďalší deň potvrdené -> vypadne
const predD = git(ORIGIN, "rev-parse", "main");
r = behRun("vypadla");
const stavD = () => JSON.parse(readFileSync(path.join(STAV, "stav.json"), "utf8"));
krok("D1: 1. deň výpadku sa recenzia NEVYHODÍ, nič sa nepushne", () => {
  assert.equal(r.kod, 0, r.out.slice(-800)); assert.match(r.out, /NEVYHADZUJEM/); assert.match(r.out, /HOTOVO: bez-zmeny/);
  assert.equal(git(ORIGIN, "rev-parse", "main"), predD); assert.match(dataMain(), /Skúšobná Recenzia konflikt/);
});
krok("D1: stav si pamätá, kto vypadol a kedy", () => { const s = stavD(); assert.deepEqual(s.vypadnute && s.vypadnute.autori, ["Skúšobná Recenzia konflikt"]); });
// „ďalší deň“: posunúť deň pozorovania do minulosti (ostrý beh --dnes nepovolí)
{ const s = stavD(); s.vypadnute.den = "2000-01-01"; writeFileSync(path.join(STAV, "stav.json"), JSON.stringify(s, null, 2)); }
r = behRun("vypadla");
krok("D2: výpadok potvrdený ďalší deň -> recenzia vypadne, push", () => {
  assert.equal(r.kod, 0, r.out.slice(-800)); assert.match(r.out, /výpadok potvrdil aj 2000-01-01/); assert.match(r.out, /PUSH OK/);
  const d = dataMain(); assert.doesNotMatch(d, /Skúšobná Recenzia konflikt/); assert.match(d, /Skúšobná Recenzia iny-subor/);
});
krok("D2: commit len dáta, stav.vypadnute vynulované", () => {
  for (const f of suboryCommitu("main")) assert.match(f, /^(assets\/js\/reviews-data\.js|tools\/google-reviews-fresh\.json|assets\/img\/reviews\/(m\/)?rg-\d+-\d+\.jpg)$/, f);
  assert.equal(stavD().vypadnute, null);
});
krok("v main nikdy nebol force push (história lineárna, 5 commitov nad základom)", () => {
  const n = Number(git(ORIGIN, "rev-list", "--count", `${git(ZDROJ, "rev-parse", "HEAD")}..main`)); assert.equal(n, 5);
});
krok("beh skončil bez pádu Node (exit 0/1, nie 0xC0000409)", () => { assert.ok([0, 1].includes(r.kod), String(r.kod)); });
console.log(`test-push: ${ok} OK${process.exitCode ? " — SÚ CHYBY (logy: " + ROOT + ")" : ""} | pieskovisko: ${ROOT}`);
