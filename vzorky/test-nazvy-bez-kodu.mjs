/* test-nazvy-bez-kodu.mjs — vzorkovník po zjednodušení názvov v admine (Michal 2. 11. 2026).
 *
 * Michal: v košíku aj v objednávke len „Vzorka Diamond: Čierna prešívaná bronzovou“ — bez kódu „(D-9)“ a bez „- Áno“.
 * V admine preto parameter dostane zobrazovaný názov „Vzorka Diamond“ a voľba „Áno“ sa premenuje na farbu; kód vzorky
 * ostáva len v popise parametra („… [D-9] do objednávky …“). Test overuje, že oba konfigurátory vzoriek to zvládnu
 * a zároveň stále fungujú s dnešnými názvami:
 *   - nový vzhľad (konfigurator1v/vzorky-produkt.js): kodVzorky() z názvu aj z popisu, volbaAno() „Áno“ aj farba;
 *   - starý widget (?novy=0, vzorky-konfigurator): dlaždice vzoriek sa nájdu aj bez kódu v názve a klik zvolí farbu.
 * Spustenie: node vzorky/test-nazvy-bez-kodu.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM, VirtualConsole } from "jsdom";
import * as esbuild from "esbuild";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let zlyhania = 0;
const over = (podm, m, detail) => { if (podm) console.log("✓ " + m); else { zlyhania++; console.error("✗ " + m + (detail !== undefined ? " — " + JSON.stringify(detail) : "")); } };

async function bundle(entry, globalName) {
  const b = await esbuild.build({ entryPoints: [join(ROOT, entry)], bundle: true, format: "iife", globalName, write: false, logLevel: "silent" });
  return b.outputFiles[0].text;
}

/** Riadok živého formulára Shoptetu: label s tooltipom (popis parametra) + select. nove = názvy po úprave adminu. */
function riadok(pid, vid, { seria, farba, kod, nove, cz }) {
  const nazov = nove ? (seria === "2. vrstva" ? (cz ? "Vzorek druhé vrstvy" : "Vzorka druhej vrstvy") : (cz ? "Vzorek " : "Vzorka ") + seria)
    : (cz ? "Vzorek " : "Vzorka ") + seria + " – " + farba + " (" + kod + ")";
  const popis = (cz ? "Přidat vzorek " : "Pridať vzorku ") + seria + " (1. vrstva) – " + farba + " [" + kod + "] do objednávky. Vratná záloha 5 €.";
  const ano = nove ? farba : cz ? "Ano" : "Áno";
  return `<tr class="surcharge-list"><th><label for="surcharge-parameter-id-${pid}">${nazov} <span class="show-tooltip" title="${popis}">?</span></label></th>
    <td><select id="surcharge-parameter-id-${pid}" name="surchargeParameterValueId[${pid}]" class="surcharge-parameter" data-parameter-id="${pid}" data-parameter-name="${nazov}">
      <option value="" data-choose="true">Vyberte príplatok</option>
      <option value="${vid}" data-surcharge-final-price="0">${cz ? "Nechci" : "Nechcem"} +€0</option>
      <option value="${vid + 1}" data-surcharge-final-price="5">${ano} +€5</option>
    </select></td></tr>`;
}

const VZORKY = [
  { seria: "Diamond", farba: "Čierna prešívaná bronzovou", kod: "D-9" },
  { seria: "Diamond", farba: "Čierna prešívaná modrou", kod: "D-2" },
  { seria: "Hexa", farba: "Čierna prešívaná červenou", kod: "H-1" },
  { seria: "Stripe", farba: "Hnedá", kod: "S-6" },
  { seria: "2. vrstva", farba: "Lux Color 10 – čierna", kod: "LUX-10" },
];

function stranka(nove, cz) {
  let pid = 300, vid = 900;
  const rows = VZORKY.map((v) => { const r = riadok(pid++, vid, Object.assign({ nove, cz }, v)); vid += 2; return r; }).join("");
  return `<!DOCTYPE html><html><body><div class="p-detail"><div class="row"><div class="col-xs-12 col-lg-6 p-info-wrapper">
    <h1>Vzorkovník Dragonskin – objednávka vzoriek</h1>
    <form id="product-detail-form"><table class="surcharge-parameters"><tbody>${rows}</tbody></table>
    <button class="add-to-cart-button" type="submit">Pridať do košíka</button></form></div></div></div></body></html>`;
}

// ---------------------------------------------------------------- nový vzhľad: kodVzorky + volbaAno
const kod1v = await bundle("assets/js/components/konfigurator1v/vzorky-produkt.js", "__VZ1V__");
for (const [nove, cz] of [[false, false], [true, false], [true, true]]) {
  const tag = (nove ? "nové názvy" : "dnešné názvy") + (cz ? " CZ" : " SK");
  const dom = new JSDOM(stranka(nove, cz), { url: "https://www.luxurycardesign.sk/vzorkovnik-dragonskin---objednavka-vzoriek/", runScripts: "outside-only", pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  dom.window.eval(kod1v);
  const M = dom.window.__VZ1V__;
  const form = dom.window.document.getElementById("product-detail-form");
  const kody = Array.from(form.querySelectorAll("select.surcharge-parameter")).map((s) => M.kodVzorky(form, s));
  over(JSON.stringify(kody) === JSON.stringify(VZORKY.map((v) => v.kod)), "1V " + tag + ": kód každej vzorky", kody);
  const ano = Array.from(form.querySelectorAll("select.surcharge-parameter")).map((s) => {
    const moz = Array.from(s.options).filter((o) => o.value).map((o) => ({ hodnota: o.value, text: o.text.replace(/\s*\+€\d+$/, ""), cena: Number(o.getAttribute("data-surcharge-final-price")) }));
    const a = M.volbaAno(moz);
    return a ? a.text : null;
  });
  const cakane = VZORKY.map((v) => (nove ? v.farba : cz ? "Ano" : "Áno"));
  over(JSON.stringify(ano) === JSON.stringify(cakane), "1V " + tag + ": voľba „chcem“ = " + (nove ? "farba" : "Áno"), ano);
}
// „Nechcem“ s cenou 0 ani bez ceny nikdy nie je „chcem“
{
  const dom = new JSDOM("", { runScripts: "outside-only" });
  dom.window.eval(kod1v);
  const M = dom.window.__VZ1V__;
  over(M.volbaAno([{ hodnota: "1", text: "Nechcem", cena: 0 }]) === null, "1V: len „Nechcem“ -> žiadna voľba");
  over(M.volbaAno([{ hodnota: "1", text: "Nechci", cena: 0 }, { hodnota: "2", text: "Hnědá káva", cena: 99 }]).hodnota === "2", "1V CZ: farba s cenou 99 Kč je „chcem“");
}

// ---------------------------------------------------------------- starý widget (?novy=0) s novými názvami
const kodStary = await bundle("assets/js/vzorky-konfigurator/index.js", "__VZ__");
{
  const chyby = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => chyby.push(e.message));
  const dom = new JSDOM(stranka(true, false), { url: "https://www.luxurycardesign.sk/vzorkovnik-dragonskin---objednavka-vzoriek/", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc });
  const doc = dom.window.document;
  const sc = doc.createElement("script");
  sc.textContent = kodStary;
  doc.body.appendChild(sc);
  dom.window.__VZ__.mountVzorkyConfigurator();
  await new Promise((r) => setTimeout(r, 50));
  over(!chyby.length, "starý widget: bez chýb", chyby);
  const root = doc.getElementById("lcd-vzorky-root");
  over(!!root, "starý widget: vykreslený aj bez kódu v názve parametra");
  const d9 = root && root.querySelector('[data-id="D-9"], [data-vz-id="D-9"], [data-swatch-id="D-9"]');
  over(!!d9, "starý widget: dlaždica D-9 sa našla podľa popisu parametra");
  if (d9) {
    d9.click();
    await new Promise((r) => setTimeout(r, 20));
    const s = doc.querySelector('select[data-parameter-id="300"]');
    over(s.options[s.selectedIndex].text.startsWith("Čierna prešívaná bronzovou"), "starý widget: klik na D-9 zvolí farbu", s.options[s.selectedIndex].text);
  }
}

console.log(zlyhania ? `\n${zlyhania} zlyhaní` : "\nVšetko OK");
process.exit(zlyhania ? 1 : 0);
