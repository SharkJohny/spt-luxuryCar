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
    crmUloha: null, poslednyUspech: kedy, poslednyUspechDen: den, poslednyVysledok: vysledok || null };
}

export const LIMIT_DNI = 3;
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

/** Súhrn pre správu commitu zo štandardného výstupu reviews-update.mjs. */
export function suhrnUpdate(vystup) {
  const r = String(vystup || "").split(/\r?\n/);
  const profil = r.find((x) => x.startsWith("profil:")) || "";
  const data = r.find((x) => x.startsWith("v dátach:")) || "";
  const nove = r.filter((x) => /^\s+\+ g-\d+/.test(x)).map((x) => x.trim().split(" | ").slice(0, 3).join(" | "));
  return { profil, data, nove };
}
