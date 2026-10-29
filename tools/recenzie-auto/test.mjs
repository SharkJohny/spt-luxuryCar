// Testy čistých funkcií automatiky recenzií:  node tools/recenzie-auto/test.mjs   (exit 1 = chyba)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  nacitajData, odtlacok, povolena, parsujStatus, den9, zaznamenajNeuspech, zaznamenajUspech, trebaCrmUlohu, crmUloha,
  PRAZDNY_STAV, suhrnUpdate, zalozUlohuCrm, vypadnuteAutori, rozhodniVypadnutie, zahod,
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

// --- výpadok recenzií z Googlu (nález kontroly 29. 10.: neúplný scrape 95–99 % nesmie hneď vyhodiť recenzie)
t("vypadnuteAutori: párovanie podľa googleId alebo mena (bez diakritiky a veľkosti písmen)", () => {
  const zaklad = { reviews: [{ author: "Štefan Németh", googleId: "a" }, { author: "Ladislav T." }, { author: "PAVOL TOMÁŠIK" }, { author: "Iný Autor", googleId: "x" }] };
  const po = { reviews: [{ author: "Stefan Nemeth" }, { author: "pavol tomasik" }, { author: "Premenovaný", googleId: "x" }] };
  assert.deepEqual(vypadnuteAutori(zaklad, po), ["Ladislav T."]);
  assert.deepEqual(vypadnuteAutori(zaklad, zaklad), []);
});
t("výpadok: 1. deň čaká, rovnaký deň znova čaká, ďalší deň s rovnakými autormi = potvrdené", () => {
  let r = rozhodniVypadnutie(null, ["B", "A", "A"], "2026-10-30");
  assert.deepEqual(r, { potvrdene: false, cakaju: { den: "2026-10-30", autori: ["A", "B"] } });
  assert.equal(rozhodniVypadnutie(r.cakaju, ["A", "B"], "2026-10-30").potvrdene, false, "ten istý deň (--vynut) nepotvrdí");
  assert.deepEqual(rozhodniVypadnutie(r.cakaju, ["A", "B"], "2026-10-31"), { potvrdene: true, cakaju: null });
  assert.equal(rozhodniVypadnutie(r.cakaju, ["A"], "2026-10-31").potvrdene, true, "podmnožina včerajška = potvrdené");
  const nove = rozhodniVypadnutie(r.cakaju, ["A", "C"], "2026-10-31");
  assert.deepEqual(nove, { potvrdene: false, cakaju: { den: "2026-10-31", autori: ["A", "C"] } }, "nový autor -> znova čakať");
  assert.deepEqual(rozhodniVypadnutie(r.cakaju, [], "2026-10-31"), { potvrdene: true, cakaju: null });
});
t("stav: vypadnute je v prázdnom stave a neúspech ho nezmaže", () => {
  assert.ok("vypadnute" in PRAZDNY_STAV);
  const s = zaznamenajNeuspech({ ...PRAZDNY_STAV, vypadnute: { den: "2026-10-30", autori: ["A"] } }, "2026-10-31", "x", "l");
  assert.deepEqual(s.vypadnute, { den: "2026-10-30", autori: ["A"] });
});

// --- súhrn do commitu
t("súhrn reviews-update", () => {
  const v = "profil: 101 -> 102 recenzií, hodnotenie 5 -> 5\nv dátach: 101 -> 102 | nové: 1 | vypadli z Googlu: 0\n  + g-102 Jana K. | 5★ | ~2026-10 | sk | fotky 0 | Super\nfotky nových: ok 0, chyba 0\n";
  const s = suhrnUpdate(v);
  assert.match(s.profil, /101 -> 102/); assert.equal(s.nove.length, 1); assert.match(s.nove[0], /g-102 Jana K\./);
});

// --- CRM úloha cez Supabase REST (falošný fetch, nič sa neposiela von)
const ULOHA = { text: "Recenzie z Google sa na webe neaktualizujú — automatika zlyháva od 27. 10. 2026", note: "n", due_at: "2026-10-29T09:00:00+01:00", reminder_at: "2026-10-29T09:00:00+01:00" };
function falosneCrm({ znacka = 201, select = [], insert = 201 } = {}) {
  const volania = [];
  const zrusene = [];
  const odp = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body, bodyUsed: false, body: { cancel: async () => { zrusene.push(status); } } });
  const fetchFn = async (url, o = {}) => {
    const m = (o.method || "GET") + " " + url.replace("https://x.supabase.co", "").split("?")[0];
    volania.push({ m, url, o });
    if (m === "GET /rest/v1/app_owner") return odp(200, [{ user_id: "u1" }]);
    if (m === "POST /rest/v1/auto_ulohy") return odp(znacka, null);
    if (m === "GET /rest/v1/todos") return odp(200, select);
    if (m === "POST /rest/v1/todos") return odp(insert, insert < 300 ? [{ id: "t1" }] : { message: "x" });
    if (m === "DELETE /rest/v1/auto_ulohy") return odp(204, null);
    return odp(500, null);
  };
  return { fetchFn, volania, zrusene };
}
const crm = (o) => zalozUlohuCrm({ url: "https://x.supabase.co", apiKluc: "TAJNY-KLUC-123", dedup: "recenzie-google-zlyhanie-2026-10-27", uloha: ULOHA, fetchFn: o.fetchFn });
const tA = async (nazov, fn) => { try { await fn(); ok++; } catch (e) { console.error("CHYBA " + nazov + ": " + e.message); process.exitCode = 1; } };
await tA("CRM: nová úloha = značka + insert s due_at/reminder_at 9:00 a user_id majiteľa", async () => {
  const f = falosneCrm(); const r = await crm(f);
  assert.deepEqual([r.ok, r.todo, r.znacka], [true, "t1", true]);
  const ins = f.volania.find((v) => v.m === "POST /rest/v1/todos"); const b = JSON.parse(ins.o.body);
  assert.deepEqual([b.user_id, b.done, b.due_at, b.reminder_at], ["u1", false, ULOHA.due_at, ULOHA.reminder_at]);
  assert.equal(JSON.parse(f.volania.find((v) => v.m === "POST /rest/v1/auto_ulohy").o.body).kluc, "recenzie-google-zlyhanie-2026-10-27");
  assert.equal(ins.o.headers.apikey, "TAJNY-KLUC-123"); // kľúč ide len v hlavičke
  assert.ok(f.volania.every((v) => !v.url.includes("TAJNY")));
});
await tA("CRM: značka 409 = už založená, druhá úloha nevznikne", async () => {
  const f = falosneCrm({ znacka: 409 }); const r = await crm(f);
  assert.equal(r.existuje, true); assert.ok(!f.volania.some((v) => v.m === "POST /rest/v1/todos"));
  assert.equal(f.zrusene.length >= 1, true, "telo 409 sa zahodí (inak Node pri ukončení padá 0xC0000409)");
});
await tA("zahod: zruší neprečítané telo, prečítané/prázdne nechá", async () => {
  let n = 0; const telo = { cancel: async () => { n++; } };
  await zahod({ body: telo, bodyUsed: false }); await zahod({ body: telo, bodyUsed: true }); await zahod({ body: null }); await zahod(null);
  await zahod({ body: { cancel: async () => { throw new Error("x"); } }, bodyUsed: false });
  assert.equal(n, 1);
});
await tA("CRM: rovnaký text už je (bez tabuľky auto_ulohy) -> nič nové", async () => {
  const f = falosneCrm({ znacka: 404, select: [{ id: "t0" }] }); const r = await crm(f);
  assert.deepEqual([r.ok, r.existuje, r.todo], [true, true, "t0"]); assert.ok(!f.volania.some((v) => v.m === "POST /rest/v1/todos"));
});
await tA("CRM: zlyhaný insert zruší značku (ďalší beh skúsi znova)", async () => {
  const f = falosneCrm({ insert: 500 }); const r = await crm(f);
  assert.equal(r.ok, false); assert.ok(f.volania.some((v) => v.m === "DELETE /rest/v1/auto_ulohy"));
});

console.log(`recenzie-auto test: ${ok} OK${process.exitCode ? " — SÚ CHYBY" : ""}`);
