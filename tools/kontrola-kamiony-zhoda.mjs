// Zhoda zoznamu kamiónov na troch miestach: tabuľka (data.json) <-> záloha v kóde (truck-brands.js) <-> vedomosti Luxie (kamiony-dodavky.txt).
//   node tools/kontrola-kamiony-zhoda.mjs [--md <súbor.md>] [--luxia <cesta k kamiony-dodavky.txt>]
// Tri časti výpisu: 1 tabuľka SK <-> CZ, 2 tabuľka <-> záloha v kóde, 3 tabuľka <-> Luxia.
// Exit 1: web tabuľku neprijme (alebo sa data.json nedá stiahnuť), alebo sa tabuľka líši od zálohy v kóde.
// Rozdiely voči Luxii sú len upozornenie (exit 0). Súbor Luxie sa iba číta, nič sa nezapisuje okrem --md.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { kamionyZDat, nacitajKamiony } from "../assets/js/components/konfigurator1v/kamion/tabulka.js";
import { TRUCK_VEHICLES, TRUCK_FIELD_ORDER } from "../assets/js/truck-konfigurator/truck-brands.js";

const DATA_URL = "https://cdn.myshoptet.com/usr/www.luxurycardesign.sk/user/documents/upload/data.json?t=";
// Živé vedomosti Luxie = modul v Mega App (commit eb67400 12. 11. 2026 „Luxia: autá aj kamióny z tabuľky konfigurátora“).
// luxia-test je stará kópia z 29. 8. 2026 (len na porovnanie cez --luxia).
const LUXIA_PREDVOLENE = "C:/Users/M/Desktop/claud/mega app/modules/AI chat bot/knowledge/kamiony-dodavky.txt";
const LUXIA_STARA = "C:/Users/M/Desktop/claud/luxia-test/knowledge/kamiony-dodavky.txt";

const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null; };
const mdSubor = arg("--md");
const luxiaSubor = arg("--luxia") || LUXIA_PREDVOLENE;

// ---- výpis (konzola aj markdown) ----
const riadky = [];
const vypis = (t = "") => riadky.push(t);
const nadpis = (t) => { vypis(""); vypis("## " + t); vypis(""); };
let chyby = 0, upozornenia = 0;
const chyba = (t) => { chyby++; vypis("- CHYBA: " + t); };
const pozor = (t) => { upozornenia++; vypis("- upozornenie: " + t); };
const info = (t) => vypis("- " + t);

const bezDiakritiky = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const rozdel = (kluc) => { const m = /^(.*) \((TIR|dodávka)\)$/.exec(kluc); return m ? { znacka: m[1], typ: m[2] } : { znacka: kluc, typ: "" }; };
const roky = (nazov) => { const m = /(\d{4})(?:\s*[-–]\s*(\d{4}))?(?!.*\d{4})/.exec(nazov); return m ? { od: +m[1], do: +(m[2] || m[1]), index: m.index } : null; };

async function main() {
  vypis("# Zhoda kamiónov: tabuľka, záloha v kóde, Luxia");
  vypis("");
  vypis("Spustené: " + new Date().toISOString());

  // ---- stiahnutie ----
  let d, lastMod;
  try {
    const r = await fetch(DATA_URL + Date.now());
    if (!r.ok) throw new Error("HTTP " + r.status);
    lastMod = r.headers.get("last-modified");
    d = await r.json();
  } catch (e) {
    chyba("data.json sa nedá stiahnuť (" + e.message + ")");
    return;
  }
  vypis("data.json z " + lastMod + " (stiahnuté s ?t=<čas>, kľúče settings.kamiony a settings.kamionycs)");

  const s = d.settings || {};
  const riadkyTabu = (t) => (typeof t === "string" ? t.replace(/[,\s]+$/, "").split("\n").map((r) => r.split("\t")) : null);
  const surSk = riadkyTabu(s.kamiony), surCs = riadkyTabu(s.kamionycs);
  const web = kamionyZDat(d); // rovnaká kontrola ako na webe
  const v = nacitajKamiony(surSk, surCs);

  // ---- 1. SK <-> CZ ----
  nadpis("1. Tabuľka SK ↔ CZ");
  if (!web || !v.vozidla) {
    chyba("web tabuľku NEPRIJME: " + (v.chyba || "chýba kľúč kamiony/kamionycs v data.json") + " (web by išiel zo zálohy v kóde)");
  } else {
    info("web tabuľku prijme (rovnaká kontrola ako main.js).");
  }
  if (surSk && surCs) {
    const telo = (r) => r.slice(1).filter((x) => x.some((b) => String(b).trim()));
    const sk = telo(surSk), cs = telo(surCs);
    info("riadkov SK " + sk.length + ", CZ " + cs.length + (sk.length === cs.length ? " (rovnako)" : " (ROZDIEL)"));
    if (sk.length !== cs.length) chyba("počet riadkov SK a CZ sa líši");
    const neprelozene = [], prazdnePrekl = [];
    const n = Math.min(sk.length, cs.length);
    for (let i = 0; i < n; i++) {
      const cislo = i + 2;
      for (let p = 0; p < TRUCK_FIELD_ORDER.length; p++) {
        const a = (sk[i][3 + p] || "").trim(), b = (cs[i][3 + p] || "").trim();
        if (a && !b) prazdnePrekl.push(`riadok ${cislo} ${sk[i][0]} ${sk[i][2]}: CZ ${TRUCK_FIELD_ORDER[p]} prázdne`);
        else if (a && a === b) neprelozene.push(a);
      }
    }
    if (prazdnePrekl.length) prazdnePrekl.forEach((t) => chyba(t));
    const jedinecne = [...new Set(neprelozene)];
    if (jedinecne.length) pozor("výbava rovnaká v SK aj CZ (nepreložená?): " + jedinecne.join(" | "));
    else info("každá možnosť výbavy má v CZ iný text (preložená).");
  }
  if (v.vozidla) {
    const mc = Object.keys(v.modelyCs).length, vc = Object.keys(v.vybavaCs).length;
    info(`preklady modelov (SK → CZ, len rozdielne): ${mc}; preklady výbavy: ${vc}`);
    const bezPrekladu = [];
    for (const [k, m] of Object.entries(v.vozidla)) for (const nm of Object.keys(m)) if (!v.modelyCs[nm]) bezPrekladu.push(nm);
    if (bezPrekladu.length) info("modely s rovnakým názvom v SK aj CZ (je to bežné): " + bezPrekladu.length);
  }

  // ---- 2. tabuľka <-> záloha ----
  nadpis("2. Tabuľka ↔ záloha v kóde (truck-brands.js)");
  if (!v.vozidla) {
    chyba("tabuľka sa nenačítala, nemá sa čo porovnať so zálohou");
  } else {
    const tab = v.vozidla, zal = TRUCK_VEHICLES;
    const pocet = (o) => Object.values(o).reduce((n, z) => n + Object.keys(z).length, 0);
    info(`tabuľka: ${Object.keys(tab).length} značiek (kľúčov), ${pocet(tab)} modelov; záloha: ${Object.keys(zal).length} značiek, ${pocet(zal)} modelov`);
    const pred = chyby;
    for (const k of Object.keys(zal)) if (!tab[k]) chyba(`značka ${k} je v zálohe, v tabuľke nie`);
    for (const k of Object.keys(tab)) if (!zal[k]) chyba(`značka ${k} je v tabuľke, v zálohe nie`);
    for (const k of Object.keys(tab)) {
      if (!zal[k]) continue;
      for (const m of Object.keys(zal[k])) if (!tab[k][m]) chyba(`model ${k} / ${m} je v zálohe, v tabuľke nie`);
      for (const m of Object.keys(tab[k])) {
        if (!zal[k][m]) { chyba(`model ${k} / ${m} je v tabuľke, v zálohe nie`); continue; }
        for (const pole of TRUCK_FIELD_ORDER) {
          const a = (tab[k][m][pole] || []).join(" ; "), b = (zal[k][m][pole] || []).join(" ; ");
          if (a !== b) chyba(`${k} / ${m} / ${pole}: tabuľka [${a}] ≠ záloha [${b}]`);
        }
      }
    }
    // poradie modelov a značiek nie je chyba, len informácia
    const poradieTab = Object.entries(tab).flatMap(([k, m]) => Object.keys(m).map((x) => k + "|" + x)).join("\n");
    const poradieZal = Object.entries(zal).flatMap(([k, m]) => Object.keys(m).map((x) => k + "|" + x)).join("\n");
    if (chyby === pred) {
      info("tabuľka a záloha sú rovnaké (značky, modely vrátane rokov, výbava).");
      if (poradieTab !== poradieZal) info("poradie modelov je iné (nevadí, web zoraďuje sám).");
    }
  }

  // ---- 3. tabuľka <-> Luxia ----
  nadpis("3. Tabuľka ↔ Luxia (kamiony-dodavky.txt)");
  const zdroj = v.vozidla || TRUCK_VEHICLES;
  if (!v.vozidla) pozor("tabuľka sa nenačítala, porovnávam so zálohou v kóde");
  if (!existsSync(luxiaSubor)) {
    pozor("súbor Luxie sa nenašiel: " + luxiaSubor);
  } else {
    info("súbor Luxie (len čítaný): " + luxiaSubor);
    if (luxiaSubor === LUXIA_STARA) info("pozn.: luxia-test je stará kópia z 29. 8. 2026; živé vedomosti sú v Mega App (predvolené)");
    luxiaPorovnanie(readFileSync(luxiaSubor, "utf8"), zdroj);
  }

  vypis("");
  vypis(`Súhrn: chyby ${chyby}, upozornenia ${upozornenia}. Exit ${chyby ? 1 : 0}.`);
}

// ---- Luxia ----
function parsujLuxiu(text) {
  const polozky = [], nepriradene = [];
  let typ = "", znacka = "", posl = null;
  for (const surovy of text.split(/\r?\n/)) {
    if (!surovy.trim()) continue;
    if (/^===.*KAMIÓNY\s*===/.test(surovy)) { typ = "TIR"; znacka = ""; posl = null; continue; }
    if (/^===.*DODÁVKY\s*===/.test(surovy)) { typ = "dodávka"; znacka = ""; posl = null; continue; }
    if (/^===/.test(surovy)) { typ = ""; znacka = ""; posl = null; continue; }
    if (!typ) continue;
    if (/^\s/.test(surovy)) { if (posl) posl.text += " " + surovy.trim(); else nepriradene.push(surovy.trim()); continue; }
    if (/^- /.test(surovy)) {
      posl = { znacka, typ, text: surovy.slice(2).trim(), surovy: surovy.trim() };
      polozky.push(posl);
      continue;
    }
    if (/^[A-Za-zÀ-ž]/.test(surovy) && !/[|]/.test(surovy)) { znacka = surovy.replace(/\s*\((kamión|dodávka)\)\s*$/i, "").trim(); posl = null; continue; }
    nepriradene.push(surovy.trim());
  }
  return { polozky, nepriradene };
}

const kluc = (s) => bezDiakritiky(s).toLowerCase().replace(/\s+a\s+/g, "/").replace(/\s+/g, "").replace(/\(aj ?fh16\)/g, "");

function rozborLuxia(p) {
  const casti = p.text.split("|").map((x) => x.trim());
  const nazov = casti[0] || "";
  const ry = roky(casti[1] || "");
  const zvysok = casti.slice(2).join(" | ");
  if (!nazov || !ry) return { p, chyba: true };
  const t = p.text.toLowerCase();
  const obytna = /obytn/.test(t);
  const bez = /bežn[áa] kabína/.test(t);
  return {
    p, nazov, od: ry.od, do: ry.do, obytna, bezObytnej: bez, zvysok,
    manual: /manuáln/.test(t), len_auto: /len automatick/.test(t) || (/\| automatick/.test(t) && !/manuáln/.test(t)),
    zasuvky: /zásuv/.test(t), brzda: /brzda/.test(t), sedadlo: /sedadlo spolujazdca/.test(t),
  };
}

function polozkyTabulky(zdroj) {
  const r = [];
  for (const [k, m] of Object.entries(zdroj)) {
    const { znacka, typ } = rozdel(k);
    for (const [nm, vyb] of Object.entries(m)) {
      const ry = roky(nm);
      let nazov = ry ? nm.slice(0, ry.index).trim() : nm;
      const zvysok = ry ? nm.slice(ry.index).replace(/^\d{4}(?:\s*[-–]\s*\d{4})?/, "").trim() : "";
      const obytna = /obytn/i.test(zvysok);
      r.push({ k, znacka, typ, nm, nazov, od: ry && ry.od, do: ry && ry.do, obytna, vyb });
    }
  }
  return r;
}

function luxiaPorovnanie(text, zdroj) {
  const { polozky, nepriradene } = parsujLuxiu(text);
  const rozobrane = polozky.map((p) => rozborLuxia(p));
  const nejasne = rozobrane.filter((x) => x.chyba).map((x) => `${x.p.znacka || "?"}: ${x.p.surovy}`).concat(nepriradene.map((t) => "mimo zoznamu: " + t));
  const luxia = rozobrane.filter((x) => !x.chyba);
  info(`riadkov modelov v Luxii: ${luxia.length}`);

  const tab = polozkyTabulky(zdroj);
  const zhoda = new Map(); // tab -> luxia
  const pouzite = new Set();
  const lk = (znacka, typ) => bezDiakritiky(znacka).toLowerCase() + "|" + typ;
  for (const t of tab) {
    const cand = luxia.filter((l) => !pouzite.has(l) || true).filter((l) => lk(l.p.znacka.replace(/\s*\(.*\)/, ""), l.p.typ) === lk(t.znacka, t.typ));
    const najdeny = cand.find((l) => {
      if (kluc(l.nazov) !== kluc(t.nazov) || l.od !== t.od) return false;
      if (t.obytna) return l.obytna;
      return !l.obytna || l.bezObytnej;
    });
    if (najdeny) { zhoda.set(t, najdeny); pouzite.add(najdeny); }
  }

  const chybaVLuxii = tab.filter((t) => !zhoda.has(t));
  const navyse = luxia.filter((l) => !pouzite.has(l));
  const rozdielyRokov = [], rozdielyVyb = [];
  for (const [t, l] of zhoda) {
    if (l.do !== t.do) rozdielyRokov.push(`${t.znacka} ${t.nm}: tabuľka ${t.od}–${t.do}, Luxia ${l.od === l.do ? l.od : l.od + "–" + l.do}`);
    const maM = (t.vyb.prevodovka || []).some((x) => /manuál/i.test(x));
    if (l.manual !== maM && (l.manual || l.len_auto)) rozdielyVyb.push(`${t.znacka} ${t.nm}: manuálna prevodovka — tabuľka ${maM ? "áno" : "nie"}, Luxia ${l.manual ? "áno" : "nie"}`);
    if (l.zasuvky !== !!(t.vyb.zasuvky && t.vyb.zasuvky.length)) rozdielyVyb.push(`${t.znacka} ${t.nm}: zásuvky — tabuľka ${t.vyb.zasuvky ? "áno" : "nie"}, Luxia ${l.zasuvky ? "áno" : "nie"}`);
    if (l.brzda !== !!(t.vyb.brzda && t.vyb.brzda.length)) rozdielyVyb.push(`${t.znacka} ${t.nm}: brzda — tabuľka ${t.vyb.brzda ? "áno" : "nie"}, Luxia ${l.brzda ? "áno" : "nie"}`);
    const maSed = !!(t.vyb.sedadlo && t.vyb.sedadlo.length);
    if (maSed && !l.sedadlo) rozdielyVyb.push(`${t.znacka} ${t.nm}: sedadlo — tabuľka ponúka ${t.vyb.sedadlo.length} možn., Luxia o sedadle nič`);
    else if (!maSed && l.sedadlo && !/pevné/i.test(l.zvysok)) rozdielyVyb.push(`${t.znacka} ${t.nm}: sedadlo — Luxia ho spomína, tabuľka nemá voľbu`);
  }
  info(`modelov v tabuľke: ${tab.length}, so zhodou v Luxii (značka + názov + začiatok rokov): ${zhoda.size}`);
  if (!chybaVLuxii.length) info("každý model z tabuľky Luxia pozná.");
  chybaVLuxii.forEach((t) => pozor(`${t.znacka} ${t.nm} je v tabuľke, v Luxii ho nenašiel (Luxia by povedala „preveríme dostupnosť“)`));
  navyse.forEach((l) => pozor(`${l.p.znacka} ${l.nazov} ${l.od === l.do ? l.od : l.od + "–" + l.do} je v Luxii, v tabuľke nie`));
  rozdielyRokov.forEach((t) => pozor("roky: " + t));
  rozdielyVyb.forEach((t) => pozor("výbava: " + t));
  if (nejasne.length) {
    vypis("");
    vypis("Neviem priradiť (riadky Luxie bez modelu a rokov):");
    nejasne.forEach((t) => vypis("  - neviem priradiť: " + t));
  } else info("neviem priradiť: nič (každý riadok Luxie som vedel rozobrať).");
}

await main();
const text = riadky.join("\n");
console.log(text);
if (mdSubor) { writeFileSync(mdSubor, text + "\n", "utf8"); console.log("\nSpráva zapísaná do " + mdSubor); }
process.exitCode = chyby ? 1 : 0; // bez process.exit(): na Windows po fetch padá libuv assertion
