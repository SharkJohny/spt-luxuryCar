// Testy čistých funkcií automatiky recenzií:  node tools/recenzie-auto/test.mjs   (exit 1 = chyba)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  nacitajData, odtlacok, povolena, parsujStatus, den9, zaznamenajNeuspech, zaznamenajUspech, trebaCrmUlohu, crmUloha,
  PRAZDNY_STAV, suhrnUpdate,
} from "./lib.mjs";

let ok = 0;
const t = (nazov, fn) => { try { fn(); ok++; } catch (e) { console.error("CHYBA " + nazov + ": " + e.message); process.exitCode = 1; } };

// --- dáta webu
const realne = readFileSync(new URL("../../assets/js/reviews-data.js", import.meta.url), "utf8");
t("nacitajData z reálneho súboru", () => {
  const d = nacitajData(realne);
  assert.ok(d.place.totalReviews > 0 && d.reviews.length > 0);
});
t("odtlačok ignoruje fetchedAt a relativeDate", () => {
  const d = nacitajData(realne);
  const e = JSON.parse(JSON.stringify(d));
  e.place.fetchedAt = "2030-01-01T00:00:00.000Z";
  e.reviews.forEach((r) => { r.relativeDate = "Pred 999 týždňami"; });
  assert.equal(odtlacok(d), odtlacok(e));
});
t("odtlačok zachytí novú recenziu, hodnotenie aj text", () => {
  const d = nacitajData(realne);
  const a = JSON.parse(JSON.stringify(d)); a.reviews.push({ id: "g-999", author: "X" });
  const b = JSON.parse(JSON.stringify(d)); b.place.rating = 4.9;
  const c = JSON.parse(JSON.stringify(d)); c.reviews[0].text += "!";
  for (const x of [a, b, c]) assert.notEqual(odtlacok(d), odtlacok(x));
});
t("nacitajData odmietne nezmysel", () => { assert.throws(() => nacitajData("var x = 1;")); });

// --- povolené súbory
t("povolené cesty", () => {
  for (const p of ["assets/js/reviews-data.js", "tools/google-reviews-fresh.json", "assets/img/reviews/rg-97-0.jpg", "assets/img/reviews/m/rg-97-12.jpg"]) assert.ok(povolena(p), p);
  for (const p of ["assets/js/main.js", "assets/img/reviews/iny.jpg", "tools/reviews-update.mjs", ".github/workflows/production.yml", "assets/data/reviews-data.js", "tools/_scrape-CHYBA.png"]) assert.ok(!povolena(p), p);
});
t("git status porcelain", () => {
  const s = parsujStatus(" M assets/js/reviews-data.js\n?? assets/img/reviews/rg-102-0.jpg\nR  a.js -> b.js\n");
  assert.deepEqual(s.map((x) => x.kod), [" M", "??", "R "]);
  assert.equal(s[2].cesta, "b.js");
});

// --- čas úlohy
t("9:00 v zime +01:00, v lete +02:00 (PC v Bratislave)", () => {
  assert.equal(den9("2026-10-29"), "2026-10-29T09:00:00+01:00");
  assert.equal(den9("2026-07-01"), "2026-07-01T09:00:00+02:00");
});

// --- séria zlyhaní a CRM úloha
t("3 neúspešné dni -> 1 CRM úloha, opakovanie v ten istý deň neráta", () => {
  let s = { ...PRAZDNY_STAV };
  s = zaznamenajNeuspech(s, "2026-10-27", "e1", "l1");
  s = zaznamenajNeuspech(s, "2026-10-27", "e1b", "l1b"); // ručné opakovanie v ten istý deň
  assert.equal(s.neuspesneDni, 1);
  assert.equal(trebaCrmUlohu(s), null);
  s = zaznamenajNeuspech(s, "2026-10-28", "e2", "l2");
  assert.equal(trebaCrmUlohu(s), null);
  s = zaznamenajNeuspech(s, "2026-10-29", "e3", "l3");
  assert.equal(s.neuspesneDni, 3);
  assert.equal(trebaCrmUlohu(s), "recenzie-google-zlyhanie-2026-10-27");
  s = { ...s, crmUloha: { kluc: "recenzie-google-zlyhanie-2026-10-27" } };
  s = zaznamenajNeuspech(s, "2026-10-30", "e4", "l4");
  assert.equal(trebaCrmUlohu(s), null, "4. deň tej istej série nezakladá druhú úlohu");
});
t("úspech vynuluje sériu, nová séria = nový kľúč", () => {
  let s = { ...PRAZDNY_STAV, neuspesneDni: 4, prvyNeuspesnyDen: "2026-10-27", poslednyNeuspesnyDen: "2026-10-30", crmUloha: { kluc: "recenzie-google-zlyhanie-2026-10-27" } };
  s = zaznamenajUspech(s, "2026-10-31", "2026-10-31T08:31:00Z", { stav: "bez-zmeny" });
  assert.equal(s.neuspesneDni, 0); assert.equal(s.crmUloha, null); assert.equal(s.poslednyUspechDen, "2026-10-31");
  for (const d of ["2026-11-02", "2026-11-03", "2026-11-04"]) s = zaznamenajNeuspech(s, d, "x", "y");
  assert.equal(trebaCrmUlohu(s), "recenzie-google-zlyhanie-2026-11-02");
});
t("text CRM úlohy: čo zlyhalo, log, ručné spustenie, 9:00", () => {
  const s = zaznamenajNeuspech(zaznamenajNeuspech(zaznamenajNeuspech({ ...PRAZDNY_STAV }, "2026-10-27", "a"), "2026-10-28", "b"), "2026-10-29", "scraper zlyhal (exit 2)", "C:/x/logy/2026-10-29_083000.log");
  const u = crmUloha(s, { den: "2026-10-29", repo: "C:/Users/M/Desktop/spt-luxuryCar-recenzie-beh", stavDir: "C:/Users/M/Documents/LCD-recenzie-auto" });
  assert.match(u.text, /od 27\. 10\. 2026/);
  assert.match(u.note, /scraper zlyhal \(exit 2\)/);
  assert.match(u.note, /C:\\x\\logy\\2026-10-29_083000\.log/);
  assert.match(u.note, /beh\.mjs" --vynut/);
  assert.equal(u.due_at, "2026-10-29T09:00:00+01:00");
  assert.equal(u.reminder_at, u.due_at);
  assert.ok(!/DPH|kľúč:|sb_secret|eyJ/.test(u.text + u.note));
});

// --- súhrn do commitu
t("súhrn reviews-update", () => {
  const v = "profil: 101 -> 102 recenzií, hodnotenie 5 -> 5\nv dátach: 101 -> 102 | nové: 1 | vypadli z Googlu: 0\n  + g-102 Jana K. | 5★ | ~2026-10 | sk | fotky 0 | Super\nfotky nových: ok 0, chyba 0\n";
  const s = suhrnUpdate(v);
  assert.match(s.profil, /101 -> 102/); assert.equal(s.nove.length, 1); assert.match(s.nove[0], /g-102 Jana K\./);
});

console.log(`recenzie-auto test: ${ok} OK${process.exitCode ? " — SÚ CHYBY" : ""}`);
