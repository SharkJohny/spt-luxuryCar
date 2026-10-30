#!/usr/bin/env node
// Snímky jednostránkovej pokladne na schválenie vzhľadu (kniha OPC § 7.5): košík, krok 2 s OPC (prevod), so zvolenou
// dobierkou, stav chyby pri zmene platby, záchrana a set (len SK) — SK aj CZ, 390 × 844 a 1366 × 768. Offline ako
// tools/test-opc.mjs (podvrh siete, lokálny build, vymyslené údaje), do Shoptetu nič neodíde.
//   node tools/test-opc-snimky.mjs C:/tmp/opc-snimky [--web sk|cz] [--sirka 390,1366] [--stavy kosik,kosikCaka,zakladny,dobierka,chyba,
//                                  odosielam,zamok,inyOkno,set,zachrana,lista,chybaMeno,chybaTelefon,chybaSuhlas,kartaPc]
//                                  [--cela]   (navyše snímka celej stránky; lišta dole je na nej v strede — chyba snímania)
// Súbory: <web>-<sirka>-<stav>-<pohľad>.png; pohľad = miesto na stránke (vrch, sekcia, hlaska, suhrn).
import { mkdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spustiChrome, pauza } from "./test-1v/cdp.mjs";
import { pripravBuild } from "./test-opc/build.mjs";
import { vytvorStranku, OPC } from "./test-opc/pomocnik.mjs";
import { vyzadujFixtures } from "./test-opc/zachytene.mjs";
import { ID, ZAKAZNIK, naKrok2, zvolPlatbu, cakajOpc, vyplnUdaje, suhlas, KOSIK, KROK2 } from "./test-opc/krok2-pomoc.mjs";
import { klikObjednat } from "./test-opc/scenare-spravanie.mjs";

const argv = process.argv.slice(2);
const SHODNOTOU = ["--web", "--sirka", "--stavy"];
const kam = resolve(argv.find((x, i) => !x.startsWith("--") && !(i > 0 && SHODNOTOU.includes(argv[i - 1]))) || "opc-snimky");
const hodnota = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const weby = hodnota("--web", "sk,cz").split(",");
const sirky = hodnota("--sirka", "390,1366").split(",").map(Number);
const cela = argv.includes("--cela");
vyzadujFixtures(weby); // fixtures nie sú v gite (tools/test-opc/FIXTURES.md)
mkdirSync(kam, { recursive: true });

// pohľad: [meno, selektor (null = vrch stránky), kde má byť horný okraj prvku v okne (podiel výšky)]
const VRCH = ["vrch", null, 0];
const SEKCIA = ["sekcia", "#lcd-opc .co-payment-method", 0.06];
const SUHRN = ["suhrn", "#summary-box", 0.06];
// pohľad bez posunu: to, čo zákazník vidí hneď po kliku na „Objednať“ (stránka sa posunula sama)
const PO_KLIKU = ["po-kliku", "-", 0];
/** Správanie „Objednať“ (Michal 29. 10.): vyplní polia okrem posledných, klikne ako zákazník (lišta / tlačidlo) a počká na posun. */
const klikPriChybe = (vyplnit, bezSuhlasu) => async (s) => {
  const z = ZAKAZNIK[s.web];
  const h = { billFullName: z.meno, email: z.email, phone: z.telefon, billStreet: z.ulica, billHouseNumber: z.cislo, billCity: z.mesto, billZip: z.psc };
  for (const id of vyplnit) await s.pis("#" + id, h[id]);
  if (!bezSuhlasu && vyplnit.length === 7) await suhlas(s);
  await s.ev('window.scrollTo({ top: 0, behavior: "instant" }), 1');
  await pauza(400);
  await klikObjednat(s);
  await pauza(1100);
};
const STAVY = {
  kosik: { o: {}, kosik: true, pohlady: [VRCH] },
  // košík po kliku na „Pokračovať“ (pomalý server 1,5 s): stlmené tlačidlo s „Načítavam…“
  kosikCaka: { o: { scenar: { step1: "pomaly" } }, kosik: true, klik: "#continue-order-button", pohlady: [["caka", null, 0]] },
  zakladny: { o: {}, krok: async () => {}, pohlady: [VRCH, SEKCIA, SUHRN] },
  dobierka: { o: {}, krok: async (s) => { await zvolPlatbu(s, ID[s.web].dobierka); await cakajOpc(s, /^krok2-(potvrdene|chyba)$/); }, pohlady: [SEKCIA, SUHRN] },
  chyba: {
    o: (web) => ({ scenar: { step1: (n, telo) => (telo.billingId === ID[web].dobierka ? "500" : "ok") } }),
    krok: async (s) => { await zvolPlatbu(s, ID[s.web].dobierka); await cakajOpc(s, /^krok2-(potvrdene|chyba)$/); },
    pohlady: [["hlaska", "#lcd-opc .lcd-opc-hlaska", 0.5], SUHRN],
  },
  zachrana: { o: { scenar: { zaciatok: "krok2", krok1: "500" } }, priamo: true, pohlady: [SUHRN] },
  // kontrola so serverom pred odoslaním (resync; Step1Validate po kliku odpovie až po 6 s): „Odosielam…“, sekcia zamknutá
  odosielam: {
    o: { scenar: { step1: (n) => (n >= 2 ? "pomaly" : "ok"), pomalyMs: 6000 } },
    krok: async (s) => { await vyplnUdaje(s); await suhlas(s); await s.klikni("#submit-order"); },
    pohlady: [["tlacidlo", "#submit-order", 0.55], SEKCIA],
  },
  // submit už u Shoptetu, ten 6 s overuje telefón: sekcia Doprava a platba zamknutá (T3-L7)
  zamok: {
    o: { scenar: { pomalyMs: 6000 } },
    krok: async (s) => {
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.scenar.telefon = "pomaly";
      await s.pis("#phone", ZAKAZNIK[s.web].telefon.replace(/0$/, "1"));
      await s.klikni("#submit-order");
    },
    pohlady: [SEKCIA, ["tlacidlo", "#submit-order", 0.55]],
  },
  // košík zmenený v inom okne: objednávka neodišla, súhrn zo servera, hláška pri tlačidle
  inyOkno: {
    o: {},
    krok: async (s) => {
      await vyplnUdaje(s);
      await suhlas(s);
      s.p.stav.priplatok = s.web === "cz" ? 50 : 5;
      await s.klikni("#submit-order");
      await s.cakaj(`(function () { var e = document.querySelector(".lcd-opc-cakam"); return !!e && !e.hidden && /okne|okně/.test(e.textContent); })()`, { ms: 6000, popis: "hláška o zmene v inom okne" });
    },
    pohlady: [["hlaska", ".lcd-opc-cakam", 0.5], SUHRN],
  },
  // set autokobercov (len SK fixtures): termín doručenia pri doprave a riadok o tovare na mieru nad tlačidlom
  set: { len: "sk", o: { kosik: "set" }, query: "&lcddoplnok=0", krok: async () => {}, pohlady: [["doprava", "#lcd-opc", 0.06], SUHRN] },
  // lišta dole „Celkom | Objednať s povinnosťou platby“ navrchu stránky (telefón)
  lista: { o: {}, krok: async () => {}, pohlady: [VRCH] },
  // klik „Objednať“ na prázdnej stránke -> meno; s menom a e-mailom -> telefón; všetko okrem súhlasu -> súhlas
  chybaMeno: { o: {}, krok: klikPriChybe([]), pohlady: [PO_KLIKU] },
  chybaTelefon: { o: {}, krok: klikPriChybe(["billFullName", "email"]), pohlady: [PO_KLIKU] },
  chybaSuhlas: { o: {}, krok: klikPriChybe(["billFullName", "email", "phone", "billStreet", "billHouseNumber", "billCity", "billZip"], true), pohlady: [PO_KLIKU] },
  // PC, vysoký panel (set) navrchu stránky: karta „Objednať“ nad stĺpcom súhrnu
  kartaPc: { len: "sk", o: { kosik: "set" }, query: "&lcddoplnok=0", krok: async () => {}, pohlady: [VRCH] },
};
const stavy = hodnota("--stavy", Object.keys(STAVY).join(",")).split(",").filter((x) => STAVY[x]);

const build = pripravBuild({});
const ch = await spustiChrome({});
const subory = [];
try {
  for (const web of weby) for (const sirka of sirky) for (const nazov of stavy) {
    const st = STAVY[nazov];
    if (st.len && st.len !== web) continue;
    const o = typeof st.o === "function" ? st.o(web) : st.o;
    const s = await vytvorStranku(ch, { web, sirka, build, ...o, zabudniOpc: true });
    try {
      if (st.kosik) {
        await s.chod(KOSIK + OPC, { popis: "košík" });
        await s.cakaj(`window.__lcdOpc && /^kosik-/.test(window.__lcdOpc.stav)`, { ms: 10000, popis: "modul OPC na košíku" });
        await s.odmietniCookies();
        if (st.klik) { await s.ev("window.scrollTo(0, 0), 1"); await s.klikni(st.klik); }
      } else if (st.priamo) {
        await s.chod(KROK2 + OPC);
        await cakajOpc(s, /^krok2-(potvrdene|zachrana)$/);
        await s.odmietniCookies();
      } else {
        await naKrok2(s, { query: st.query || "" });
        await st.krok(s);
      }
      await pauza(st.klik ? 100 : 600);
      for (const [pohlad, sel, poloha] of st.pohlady) {
        if (st.klik) { const a = join(kam, `${web}-${sirka}-${nazov}-${pohlad}.png`); await s.k.snimka(a); subory.push(a); continue; }
        if (sel !== "-") await s.ev(sel ? `(function () { var e = document.querySelector(${JSON.stringify(sel)}); if (e) window.scrollTo(0, Math.max(0, e.getBoundingClientRect().top + pageYOffset - innerHeight * ${poloha} - ${sirka < 992 ? 60 : 0})); return 1; })()` : "window.scrollTo(0, 0), 1");
        await pauza(700);
        const a = join(kam, `${web}-${sirka}-${nazov}-${pohlad}.png`);
        await s.k.snimka(a);
        subory.push(a);
      }
      if (cela) { const b = join(kam, `${web}-${sirka}-${nazov}-cela.png`); await s.k.snimka(b, { celaStrana: true }); subory.push(b); }
      console.log("OK  " + web + " " + sirka + " " + nazov);
    } catch (e) {
      console.log("ZLYHAL " + web + " " + sirka + " " + nazov + ": " + (e && e.message));
    } finally {
      await s.zavri().catch(() => {});
    }
  }
} finally {
  await ch.zavri();
  try { rmSync(build.tmp, { recursive: true, force: true }); } catch {}
}
console.log("\n" + subory.length + " snímok v " + kam);
