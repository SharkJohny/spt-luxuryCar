#!/usr/bin/env node
// Offline test one page checkoutu (kniha OPC § 7, 28. 10. 2026). Chrome bez okna (tools/test-1v/cdp.mjs), stránky majú
// skutočné adresy https://www.luxurycardesign.sk|cz/…, ale KAŽDÁ odpoveď ide zo súborov (tools/test-opc/podvrh.mjs):
// HTML košíka a krokov z tools/test-opc/fixtures/ (live-read zachytenie: tools/test-opc-zachyt.mjs), náš bundle a CSS
// z čerstvého lokálneho buildu (tools/test-opc/build.mjs), statické súbory Shoptetu z fixtures/cdn. Do Shoptetu neodíde
// nič: Step2Validate sa zachytí a dostane fiktívnu stránku „Objednávka prijatá (TEST)“, tretie strany sú zablokované.
//
//   node tools/test-opc.mjs                         # SK, všetky scenáre S1–S46, S50–S54 (+ S7K), šírky 1366 a 390
//                                                   # (S46 = rýchla platba cez banku, S50–S54 = ďakovná stránka, rekonštrukcia
//                                                   #  tools/test-opc/dakujeme-fixtures.mjs)
//   node tools/test-opc.mjs --web cz --krok S17 --sirka 390
//   (scenár s len: "sk" / "cz" sa na inom webe preskočí — set a kamión sú zachytené len pre SK, S12 je len CZ)
//   node tools/test-opc.mjs --snimky C:/tmp/opc --vypis      # snímka na konci každého scenára + zoznam požiadaviek
//   node tools/test-opc.mjs --doplnit-cdn           # chýbajúce statické súbory Shoptetu raz stiahnuť (GET z CDN) do
//                                                   # fixtures/cdn; bez prepínača sa nič zo siete neťahá (404 + upozornenie)
//   (--okno = viditeľný Chrome, --bez-drop = console.* v builde ostane, --limit 120 = s na scenár)
// Výpis: OK / ZLYHAL na riadok (šírka, scenár, čas, info alebo dôvod), na konci súhrn; exit 1 pri zlyhaní.
// Spoločné kontroly každej karty: žiadna nečakaná požiadavka na luxurycardesign.*, žiadny Step2Validate (kým ho scenár
// výslovne nečaká), žiadna chyba konzoly z nášho bundlu.
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";
import { pripravBuild } from "./test-opc/build.mjs";
import { vyzadujFixtures } from "./test-opc/zachytene.mjs";
import { vytvorStranku, Zlyhanie, over, naseChyby } from "./test-opc/pomocnik.mjs";
import { SCENARE as ZAKLAD } from "./test-opc/scenare-zaklad.mjs";
import { SCENARE as KROK2 } from "./test-opc/scenare-krok2.mjs";
import { SCENARE as KOSIKY } from "./test-opc/scenare-kosiky.mjs";
import { SCENARE as REVIZIA } from "./test-opc/scenare-revizia.mjs";
import { SCENARE as DOKAZ } from "./test-opc/scenare-dokaz.mjs";
import { SCENARE as SPRAVANIE } from "./test-opc/scenare-spravanie.mjs";
import { SCENARE as DIZAJN } from "./test-opc/scenare-dizajn.mjs";
import { SCENARE as BANKA } from "./test-opc/scenare-banka.mjs";
import { SCENARE as DAKUJEME } from "./test-opc/scenare-dakujeme.mjs";
import { SCENARE as JEDNA } from "./test-opc/scenare-jedna.mjs";

// poradie výpisu podľa čísla scenára (kniha § 7.6)
const SCENARE = Object.fromEntries(Object.entries({ ...ZAKLAD, ...KROK2, ...KOSIKY, ...REVIZIA, ...DOKAZ, ...SPRAVANIE, ...DIZAJN, ...BANKA, ...DAKUJEME, ...JEDNA })
  .sort((a, b) => parseInt(a[0].slice(1), 10) - parseInt(b[0].slice(1), 10) || a[0].localeCompare(b[0])));

class ChybaPouzitia extends Error {}
function argumenty(argv) {
  const a = { web: "sk", sirky: [1366, 390], kroky: null, snimky: null, vypis: false, okno: false, doplnitCdn: false, bezDrop: false, limit: 120 };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], dalsi = () => { if (i + 1 >= argv.length) throw new ChybaPouzitia(x + " potrebuje hodnotu"); return argv[++i]; };
    if (x === "--web") { a.web = dalsi(); if (!/^(sk|cz)$/.test(a.web)) throw new ChybaPouzitia("--web sk alebo cz"); }
    else if (x === "--sirka") a.sirky = dalsi().split(",").map((v) => Number(v.trim())).filter(Boolean);
    else if (x === "--krok") a.kroky = dalsi().split(",").map((v) => v.trim().toUpperCase()).filter(Boolean);
    else if (x === "--snimky") a.snimky = resolve(dalsi());
    else if (x === "--vypis") a.vypis = true;
    else if (x === "--okno") a.okno = true;
    else if (x === "--doplnit-cdn") a.doplnitCdn = true;
    else if (x === "--bez-drop") a.bezDrop = true;
    else if (x === "--limit") a.limit = Math.max(20, Number(dalsi()) || 120);
    else if (x === "--help" || x === "-h") { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 18).join("\n")); process.exit(0); }
    else throw new ChybaPouzitia("neznámy prepínač " + x + " (zoznam: --help)");
  }
  (a.kroky || []).forEach((m) => { if (!SCENARE[m]) throw new ChybaPouzitia("neznámy scenár " + m + " (sú: " + Object.keys(SCENARE).join(", ") + ")"); });
  return a;
}

function sLimitom(prom, ms, popis) {
  let tm;
  const l = new Promise((_, rej) => { tm = setTimeout(() => rej(new Zlyhanie("časový limit " + Math.round(ms / 1000) + " s: " + popis)), ms); });
  prom.catch(() => {});
  return Promise.race([prom, l]).finally(() => clearTimeout(tm));
}

async function main() {
  const a = argumenty(process.argv.slice(2));
  vyzadujFixtures([a.web], { bezCdn: a.doplnitCdn }); // fixtures nie sú v gite (tools/test-opc/FIXTURES.md)
  const build = pripravBuild({ bezDrop: a.bezDrop });
  const kroky = a.kroky || Object.keys(SCENARE);
  if (a.snimky) mkdirSync(a.snimky, { recursive: true });
  console.log(`One page checkout — offline test ${a.web.toUpperCase()}
  zdroj: ${build.popis} v ${build.tmp}
  šírky: ${a.sirky.join(", ")}  scenáre: ${kroky.join(", ")}${a.doplnitCdn ? "  (dopĺňam fixtures/cdn)" : ""}`);
  const ch = await spustiChrome({ okno: a.okno });
  const vysledky = [];
  let preskocene = 0;
  const chybaCdn = new Set(), doplnene = new Set();
  try {
    for (const sirka of a.sirky) for (const m of kroky) {
      if (SCENARE[m].len && SCENARE[m].len !== a.web) {
        if (a.kroky) console.log(`PRESK.  ${String(sirka).padEnd(5)} ${m.padEnd(4)}          len ${SCENARE[m].len.toUpperCase()} (fixtures)`);
        preskocene++;
        continue;
      }
      const t0 = Date.now();
      const stranky = [];
      const J = {
        web: a.web, sirka, over, pauza,
        novaStranka: async (o = {}) => {
          // flag OPC je v localStorage (tajný odkaz platí pre všetky karty): prvá stránka scenára a o.bezOpc = zákazník bez kódu
          const s = await vytvorStranku(ch, { web: a.web, sirka: o.sirka || sirka, vyska: o.vyska, build, doplnitCdn: a.doplnitCdn, kosik: o.kosik, scenar: o.scenar, applePay: o.applePay, skript: o.skript, zabudniOpc: !!o.bezOpc || !stranky.length });
          stranky.push(s);
          return s;
        },
      };
      const v = { sirka, scenar: m, stav: "OK", info: "", sprava: "", upozornenia: [] };
      try {
        const r = (await sLimitom(Promise.resolve().then(() => SCENARE[m].fn(J)), a.limit * 1000, "scenár " + m)) || {};
        v.info = r.info || "";
        for (const s of stranky) {
          over(!s.p.zaznam.necakane.length, "nečakaná požiadavka na web: " + s.p.zaznam.necakane.join(", "));
          if (!r.step2) over(!s.p.zaznam.step2.length, "Step2Validate bez scenára (" + s.p.zaznam.step2.length + "×) — objednávka by odišla");
          const nase = naseChyby(s.k.chyby);
          over(!nase.length, "chyby nášho kódu v konzole:\n      " + nase.map((c) => c.druh + ": " + c.text + " @" + String(c.zdroj).slice(-50)).join("\n      "));
        }
      } catch (e) {
        v.stav = "ZLYHAL";
        v.sprava = e instanceof Zlyhanie ? e.message : (e && e.stack ? e.stack.split("\n").slice(0, 4).join("\n      ") : String(e));
      }
      for (const s of stranky) {
        s.p.zaznam.chybaCdn.forEach((x) => chybaCdn.add(x));
        s.p.zaznam.doplnene.forEach((x) => doplnene.add(x));
        v.upozornenia.push(...s.upozornenia);
        if (a.vypis || v.stav === "ZLYHAL") {
          const kde = await s.ev("location.href + ' body.' + (document.body ? document.body.className.split(' ').slice(0, 4).join('.') : '')").catch(() => "?");
          v.upozornenia.push("karta: " + kde + " | dokumenty: " + s.p.zaznam.www.filter((z) => z.typ === "Document").map((z) => z.metoda + " " + z.cesta + " " + z.odpoved).join(", ") +
            " | Step1Validate: " + s.p.zaznam.step1.map((x) => (x.xhr ? "XHR " : "form ") + x.telo).join("; "));
        }
        if (a.vypis) {
          v.upozornenia.push(...s.k.chyby.filter((c) => !naseChyby([c]).length).map((c) => "konzola (nie náš kód): " + c.text.slice(0, 140)));
          v.upozornenia.push("požiadavky www: " + s.p.zaznam.www.map((z) => z.metoda + " " + z.cesta + "[" + z.typ + "] " + z.odpoved).join(", "));
          v.upozornenia.push("zablokované: " + s.p.zaznam.blokovane.length);
        }
      }
      if (a.snimky && stranky.length) {
        const s = stranky[stranky.length - 1];
        try { await sLimitom(s.k.snimka(join(a.snimky, `${a.web}-${m}-${sirka}${v.stav === "ZLYHAL" ? "-CHYBA" : ""}.png`)), 20000, "snímka"); } catch {}
      }
      for (const s of stranky) await s.zavri().catch(() => {});
      v.s = ((Date.now() - t0) / 1000).toFixed(1);
      vysledky.push(v);
      console.log(`${v.stav === "OK" ? "OK    " : "ZLYHAL"}  ${String(sirka).padEnd(5)} ${m.padEnd(4)} ${v.s.padStart(5)} s  ${v.stav === "OK" ? v.info : v.sprava}`);
      [...new Set(v.upozornenia)].forEach((x) => console.log("        ! " + x));
    }
  } finally {
    await ch.zavri();
    try { rmSync(build.tmp, { recursive: true, force: true }); } catch {}
  }
  if (doplnene.size) console.log(`\nDoplnené do fixtures/cdn: ${doplnene.size} súborov`);
  if (chybaCdn.size) console.log(`\nChýbajúce statické súbory (404, v teste nevadí; doplní --doplnit-cdn): ${chybaCdn.size}${a.vypis ? "\n  " + [...chybaCdn].join("\n  ") : ""}`);
  const ok = vysledky.filter((v) => v.stav === "OK").length, zle = vysledky.length - ok;
  console.log(`\nSpolu: ${ok} OK, ${zle} zlyhalo${preskocene ? ", " + preskocene + " preskočených (len iný web)" : ""} (${a.web.toUpperCase()}, ${build.popis.split(" (")[0]}, offline)`);
  process.exit(zle ? 1 : 0);
}

main().catch((e) => { console.error("CHYBA:", e instanceof ChybaPouzitia ? e.message : e && e.stack ? e.stack : e); process.exit(2); });
