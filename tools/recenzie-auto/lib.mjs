// Čisté pomocné funkcie automatiky recenzií (tools/recenzie-auto/beh.mjs) — bez súborov, siete a gitu,
// aby sa dali otestovať (node tools/recenzie-auto/test.mjs).

/** Dáta webu z assets/js/reviews-data.js („/* hlavička *\/ window.LCD_REVIEWS = {...};“) -> objekt. */
export function nacitajData(txt) {
  const s = String(txt || "");
  const idx = s.indexOf("window.LCD_REVIEWS");
  if (idx < 0) throw new Error("reviews-data.js: chýba window.LCD_REVIEWS");
  const m = s.slice(idx).match(/window\.LCD_REVIEWS\s*=\s*([\s\S]*?);\s*$/);
  if (!m) throw new Error("reviews-data.js: nečitateľný tvar");
  const d = JSON.parse(m[1]);
  if (!d || !d.place || !Array.isArray(d.reviews)) throw new Error("reviews-data.js: chýba place alebo reviews");
  return d;
}

/**
 * Odtlačok dát BEZ toho, čo sa mení pri každom stiahnutí, aj keď na Googli nič nepribudlo:
 * place.fetchedAt (čas stiahnutia) a relativeDate („Pred N týždňami“ — prepočítané k fetchedAt).
 * Rovnaký odtlačok = nič nové -> necommitovať (web má stále konzistentné staré dáta, relativeDate sedí k ich fetchedAt).
 */
export function odtlacok(data) {
  const d = JSON.parse(JSON.stringify(data));
  if (d.place) delete d.place.fetchedAt;
  for (const r of d.reviews || []) delete r.relativeDate;
  return JSON.stringify(d);
}

/** Súbory, ktoré smie automatika commitnúť (všetko ostatné sa ignoruje a nahlási). */
export const POVOLENE = [
  /^assets\/js\/reviews-data\.js$/,
  /^tools\/google-reviews-fresh\.json$/,
  /^assets\/img\/reviews\/rg-\d+-\d+\.jpg$/,
  /^assets\/img\/reviews\/m\/rg-\d+-\d+\.jpg$/,
];
export const POVOLENE_CESTY = ["assets/js/reviews-data.js", "tools/google-reviews-fresh.json", "assets/img/reviews"];
export const povolena = (p) => POVOLENE.some((re) => re.test(String(p).replace(/\\/g, "/")));

/** `git status --porcelain=v1 -uall` -> [{ kod: "M " | "??" | " D" …, cesta }] */
export function parsujStatus(txt) {
  return String(txt || "").split(/\r?\n/).filter(Boolean).map((r) => {
    const kod = r.slice(0, 2);
    let cesta = r.slice(3);
    if (cesta.includes(" -> ")) cesta = cesta.split(" -> ").pop();
    return { kod, cesta: cesta.replace(/^"|"$/g, "") };
  });
}

/** Miestny dátum PC „YYYY-MM-DD“. */
export function miestnyDen(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** „2026-10-29“ -> „2026-10-29T09:00:00+01:00“ (9:00 miestneho času PC = Bratislava, s letným/zimným posunom). */
export function den9(den) {
  const [y, m, d] = String(den).split("-").map(Number);
  const t = new Date(y, m - 1, d, 9, 0, 0);
  const off = -t.getTimezoneOffset();
  const a = Math.abs(off);
  return `${den}T09:00:00${off >= 0 ? "+" : "-"}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

/** „2026-10-27“ -> „27. 10. 2026“ */
export const ludskyDen = (den) => { const [y, m, d] = String(den).split("-").map(Number); return `${d}. ${m}. ${y}`; };

export const PRAZDNY_STAV = Object.freeze({
  neuspesneDni: 0,          // počet RÔZNYCH dní so zlyhaným behom od posledného úspechu
  prvyNeuspesnyDen: null,   // začiatok série (kľúč CRM úlohy -> 1 úloha na 1 sériu)
  poslednyNeuspesnyDen: null,
  poslednaChyba: null,
  poslednyLog: null,
  crmUloha: null,           // { kluc, kedy, todo?, skuska? } — úloha pre aktuálnu sériu už je
  poslednyUspech: null,
  poslednyUspechDen: null,
  poslednyVysledok: null,
  vypadnute: null,          // { den, autori } — recenzie, ktoré z Googlu vypadli, čakajú na potvrdenie ďalší deň
});

/** Zlyhaný beh: ten istý deň sa ráta raz (ručné opakovanie nezvýši počet). Vráti nový stav. */
export function zaznamenajNeuspech(stav, den, chyba, log) {
  const s = { ...PRAZDNY_STAV, ...stav };
  if (s.poslednyNeuspesnyDen !== den) {
    s.neuspesneDni = (s.neuspesneDni || 0) + 1;
    s.poslednyNeuspesnyDen = den;
    if (!s.prvyNeuspesnyDen) s.prvyNeuspesnyDen = den;
  }
  s.poslednaChyba = String(chyba || "neznáma chyba").slice(0, 600);
  s.poslednyLog = log || s.poslednyLog;
  return s;
}

/** Úspešný beh: séria zlyhaní sa končí. */
export function zaznamenajUspech(stav, den, kedy, vysledok) {
  return { ...PRAZDNY_STAV, ...stav, neuspesneDni: 0, prvyNeuspesnyDen: null, poslednyNeuspesnyDen: null, poslednaChyba: null,
    crmUloha: null, poslednyUspech: kedy, poslednyUspechDen: den, poslednyVysledok: vysledok || null,
    poslednyLog: (vysledok && vysledok.log) || stav.poslednyLog || null };
}

export const LIMIT_DNI = 3;

/** Michal 29. 10. 2026: stačí raz za 2 týždne. Plánovač spúšťa denne, beh hneď skončí, kým od úspechu neuplynie interval. */
export const INTERVAL_DNI = 14;
const dniMedzi = (od, po) => Math.round((Date.parse(po + "T00:00:00Z") - Date.parse(od + "T00:00:00Z")) / 864e5);

/** Dôvod, prečo dnes nebežať, alebo null = bežať. Po zlyhaní ostáva úspech starý, takže sa skúša každý deň (CRM úloha
 *  pri LIMIT_DNI. dni). Čakajúce potvrdenie vypadnutej recenzie (stav.vypadnute) sa overí hneď ďalší deň. */
export function dovodPreskocenia(stav, dnes, interval = INTERVAL_DNI) {
  const posledny = stav && stav.poslednyUspechDen;
  if (!posledny) return null;
  if (posledny === dnes) return `dnes už úspešne (${stav.poslednyUspech || posledny})`;
  if (stav.vypadnute) return null;
  const dni = dniMedzi(posledny, dnes);
  return dni < interval ? `posledný úspech pred ${dni} dní (${posledny}), interval ${interval} dní` : null;
}
export const crmKluc = (stav) => "recenzie-google-zlyhanie-" + stav.prvyNeuspesnyDen;

/** Kľúč CRM úlohy, ak ju treba založiť (3. neúspešný deň a pre túto sériu ešte nie je), inak null. */
export function trebaCrmUlohu(stav) {
  if (!stav || (stav.neuspesneDni || 0) < LIMIT_DNI || !stav.prvyNeuspesnyDen) return null;
  const kluc = crmKluc(stav);
  return stav.crmUloha && stav.crmUloha.kluc === kluc ? null : kluc;
}

/** Text úlohy do CRM (todos) — po slovensky: čo zlyhalo, kde je log, ako spustiť ručne, čo napísať Claudovi. */
export function crmUloha(stav, { den, repo, stavDir }) {
  const beh = `${repo.replace(/\//g, "\\")}\\tools\\recenzie-auto\\beh.mjs`;
  const log = String(stav.poslednyLog || `${stavDir}/logy`).replace(/\//g, "\\");
  const text = `Recenzie z Google sa na webe neaktualizujú — automatika zlyháva od ${ludskyDen(stav.prvyNeuspesnyDen)}`;
  const note = [
    `Denná automatika recenzií (Plánovač úloh „LCD Recenzie Google“) zlyhala ${stav.neuspesneDni} dni po sebe.`,
    `Web zatiaľ ukazuje posledné dobré recenzie — nič sa nepokazilo, len nepribúdajú nové.`,
    ``,
    `Posledná chyba: ${stav.poslednaChyba || "?"}`,
    `Log: ${log}`,
    `Všetky logy: ${String(stavDir).replace(/\//g, "\\")}\\logy`,
    ``,
    `Ručne spustiť (PowerShell): node "${beh}" --vynut`,
    `alebo: Start-ScheduledTask -TaskName "LCD Recenzie Google"`,
    ``,
    `Claudovi napíš: „Recenzie Google: automatika ${stav.neuspesneDni} dni zlyháva, pozri log ${log} a oprav to.“`,
  ].join("\n");
  const due = den9(den);
  return { text, note, due_at: due, reminder_at: due };
}

const normAutor = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Autori recenzií zo základu, ktoré v nových dátach chýbajú (párovanie ako reviews-update: googleId alebo meno autora). */
export function vypadnuteAutori(zaklad, po) {
  const ids = new Set(((po && po.reviews) || []).map((r) => r.googleId).filter(Boolean));
  const mena = new Set(((po && po.reviews) || []).map((r) => normAutor(r.author)));
  return ((zaklad && zaklad.reviews) || []).filter((r) => !(r.googleId && ids.has(r.googleId)) && !mena.has(normAutor(r.author))).map((r) => r.author);
}

/**
 * Výpadok recenzií z Googlu ide do main, až keď ho potvrdí aj iný (skorší) deň: jednorazovo neúplný scrape (95–99 %)
 * by inak recenzie vyhodil a pri ich návrate by dostali nové id g-N, nový odhad dátumu a fotky znova pod iným menom.
 * pred = stav.vypadnute { den, autori } z posledného úspešného behu. Vráti { potvrdene, cakaju }.
 */
export function rozhodniVypadnutie(pred, autori, den) {
  const a = [...new Set(autori)].sort();
  if (!a.length) return { potvrdene: true, cakaju: null };
  const potvrdene = !!(pred && pred.den && pred.den < den && Array.isArray(pred.autori) && a.every((x) => pred.autori.includes(x)));
  return potvrdene ? { potvrdene: true, cakaju: null } : { potvrdene: false, cakaju: { den, autori: a } };
}

/** Súhrn pre správu commitu zo štandardného výstupu reviews-update.mjs. */
export function suhrnUpdate(vystup) {
  const r = String(vystup || "").split(/\r?\n/);
  const profil = r.find((x) => x.startsWith("profil:")) || "";
  const data = r.find((x) => x.startsWith("v dátach:")) || "";
  const nove = r.filter((x) => /^\s+\+ g-\d+/.test(x)).map((x) => x.trim().split(" | ").slice(0, 3).join(" | "));
  return { profil, data, nove };
}

/**
 * Založí úlohu v CRM (Supabase REST, rovnaký vzor ako kontakty-app api/email.js doMesacneUlohy):
 * značka auto_ulohy (PK user_id+kluc; 409 = už založená) -> úloha s rovnakým textom už je? -> insert todos.
 * Zlyhaný insert značku zruší, aby to ďalší beh skúsil znova. apiKluc sa nikde nevypisuje.
 */
/** Neprečítané telo odpovede zahodiť — inak otvorené spojenie pri ukončení Node (v24) padá na assert v libuv (0xC0000409). */
export async function zahod(res) {
  try { if (res && res.body && !res.bodyUsed && typeof res.body.cancel === "function") await res.body.cancel(); } catch {}
}

export async function zalozUlohuCrm({ url, apiKluc, dedup, uloha, fetchFn = fetch }) {
  const h = { apikey: apiKluc, authorization: "Bearer " + apiKluc, "content-type": "application/json" };
  const sb = (p, o = {}) => fetchFn(url + p, { ...o, headers: { ...h, ...(o.headers || {}) }, signal: AbortSignal.timeout(20000) });
  try {
    const o = await sb("/rest/v1/app_owner?select=user_id&limit=1");
    const ow = o.ok ? await o.json() : (await zahod(o), []);
    const userId = ow && ow[0] && ow[0].user_id;
    if (!userId) return { ok: false, chyba: `app_owner ${o.status} — majiteľ CRM sa nenašiel` };
    const zn = await sb("/rest/v1/auto_ulohy", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ user_id: userId, kluc: dedup }) });
    if (zn.status === 409) { await zahod(zn); return { ok: true, existuje: true }; }
    await zahod(zn);
    const znackaOk = zn.ok; // !ok = tabuľka chýba -> dedup len podľa textu
    const zrus = () => (znackaOk ? sb(`/rest/v1/auto_ulohy?user_id=eq.${userId}&kluc=eq.${encodeURIComponent(dedup)}`, { method: "DELETE" }).catch(() => {}) : null);
    const ex = await sb(`/rest/v1/todos?select=id&user_id=eq.${userId}&text=eq.${encodeURIComponent(uloha.text)}&limit=1`);
    if (!ex.ok) { await zahod(ex); await zrus(); return { ok: false, chyba: `todos select ${ex.status}` }; }
    const exRows = await ex.json().catch(() => []);
    if (Array.isArray(exRows) && exRows[0]) return { ok: true, existuje: true, todo: exRows[0].id };
    const ins = await sb("/rest/v1/todos", { method: "POST", headers: { prefer: "return=representation" },
      body: JSON.stringify({ user_id: userId, text: uloha.text, note: uloha.note, done: false, due_at: uloha.due_at, reminder_at: uloha.reminder_at }) });
    if (!ins.ok) { await zahod(ins); await zrus(); return { ok: false, chyba: `todos insert ${ins.status}` }; }
    const row = await ins.json().catch(() => []);
    return { ok: true, todo: (row && row[0] && row[0].id) || null, znacka: znackaOk };
  } catch (e) { return { ok: false, chyba: "CRM nedostupné: " + e.message }; }
}
