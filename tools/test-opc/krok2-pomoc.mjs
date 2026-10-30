// Spoločné kroky scenárov jednostránkovej pokladne na kroku 2 (tools/test-opc/scenare-krok2.mjs, scenare-kosiky.mjs).
// Údaje zákazníka sú VYMYSLENÉ (Test Testovací, test@example.com, Testovacia 1, 811 01 Bratislava) — skutočné osobné
// údaje sa v testoch nikdy nepoužívajú. Odoslanie ide len do podvrhu (tools/test-opc/podvrh.mjs), nie do Shoptetu.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { krok1Model } from "../../assets/js/opc/krok1Model.js";
import { over, pauza, Zlyhanie, OPC, FLAG_OPC } from "./pomocnik.mjs";
import { FIXTURES } from "./podvrh.mjs";

export const KOSIK = "/kosik/", KROK1 = "/objednavka/krok-1/", KROK2 = "/objednavka/krok-2/";

/** Id dopravy a platieb podľa webu (kniha § 6.11, overené v krok1.html) a hodnota súhlasu consents[] (krok2.html: SK 9, CZ 4). */
export const ID = {
  sk: { doprava: "96", prevod: "5", dobierka: "3", karta: "103", apple: "106", gpay: "109", banka: "112", suhlas: "9" },
  cz: { doprava: "111", prevod: "5", dobierka: "87", karta: "114", apple: "117", gpay: "120", banka: null, suhlas: "4" },
};

/** Vymyslený zákazník (nikdy skutočné údaje). */
export const ZAKAZNIK = {
  sk: { meno: "Test Testovací", email: "test@example.com", telefon: "900 000 000", ulica: "Testovacia", cislo: "1", mesto: "Bratislava", psc: "811 01" },
  cz: { meno: "Test Testovací", email: "test@example.com", telefon: "600 000 000", ulica: "Testovací", cislo: "1", mesto: "Praha", psc: "110 00" },
};

/** „Celkom k úhrade“ zo zachyteného súhrnu (fixtures/<web>/suhrn-<platba>.html). */
export function celkomZFixture(web, platba, kosik = "vzorkovnik") {
  const dir = web + (kosik === "vzorkovnik" ? "" : "-" + kosik);
  const h = readFileSync(join(FIXTURES, dir, "suhrn-" + platba + ".html"), "utf8");
  const m = /data-testid="recapFullPrice"[^>]*>\s*([^<]+?)\s*</.exec(h);
  return m ? m[1].replace(/\s+/g, " ") : null;
}

/** Stav modulu na kroku 2 (pre kontroly). */
export function stavOpc(s) {
  return s.ev(`(function () {
    var o = window.__lcdOpc || null, k = o && o.krok2, sy = k && k.sync;
    var t = document.getElementById("submit-order"), box = document.getElementById("summary-box");
    var hl = document.querySelector("#lcd-opc .lcd-opc-hlaska");
    var txt = function (sel) { var e = box && box.querySelector(sel); return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; };
    var ch = function (n) { var e = document.querySelector('#lcd-opc input[name="' + n + '"]:checked'); return e ? e.value : null; };
    return {
      stav: o ? o.stav : null,
      vybrane: sy ? sy.vybrane() : null, potvrdene: sy ? sy.potvrdene() : null, poziadavky: sy ? sy.statistika().poziadavky : null,
      dopravaUI: ch("shippingId"), platbaUI: ch("billingId"),
      aria: t ? t.getAttribute("aria-disabled") : null,
      hlaska: hl && !hl.hidden ? hl.textContent.replace(/\\s+/g, " ").trim() : "",
      hlaskaOdkaz: hl && !hl.hidden && hl.querySelector("a") ? hl.querySelector("a").getAttribute("href") : null,
      celkom: txt('[data-testid="recapFullPrice"]'), platbaSuhrn: txt('[data-testid="recapPaymentMethod"]'),
      prepocet: !!(box && box.classList.contains("lcd-opc-prepocet")),
      lista: (document.querySelector(".lcd-opc-lista__celkom") || {}).textContent || null,
      zbalene: (document.querySelector(".lcd-opc-zbalene__celkom") || {}).textContent || null,
      udalosti: (window.dataLayer || []).filter(function (x) { return x && /^lcd_opc_/.test(x.event || ""); }).map(function (x) { return x.event; }),
    };
  })()`);
}

/** Čaká, kým modul na kroku 2 nie je v stave (regex na ctx.stav, napr. /potvrdene|zachrana/) a formulár je odkrytý
 *  (html.lcd-opc-caka preč — doladenie 2: formulár je skrytý, kým nestojí dizajn A aj sekcia Doprava a platba). */
export async function cakajOpc(s, vzor, popis = "stav OPC") {
  await s.cakaj(`window.__lcdOpc && ${vzor}.test(window.__lcdOpc.stav || "") && !document.documentElement.classList.contains("lcd-opc-caka")`,
    { ms: 15000, popis: popis + " " + vzor });
  return stavOpc(s);
}

/**
 * Z košíka s tajným odkazom (?opc=KÓD) cez „Pokračovať“ na krok 2 a čaká na sekciu Doprava a platba. o.query = ďalšie parametre košíka
 * (&lcddoplnok=0 pri sete a kamióne: ponuka k setu by sťahovala stránky produktov), o.pred(s) = krok na košíku.
 */
export async function naKrok2(s, o = {}) {
  await s.chod(KOSIK + OPC + (o.query || ""), { popis: "košík s kódom OPC" });
  await s.cakaj(`window.__lcdOpc && window.__lcdOpc.stav === "kosik-pripraveny"`, { ms: 10000, popis: "modul OPC na košíku" });
  await s.odmietniCookies();
  if (o.pred) await o.pred(s);
  await s.klikni("#continue-order-button", { popis: "Pokračovať (košík)" });
  await s.cakajNaStranku(KROK2, "in-krok-2");
  const st = await cakajOpc(s, o.cakaj || /^krok2-(potvrdene|zachrana)$/, "krok 2");
  await s.odmietniCookies();
  return st;
}

/** Klik na platbu v našej sekcii (štítok rádia, ako zákazník). */
export async function zvolPlatbu(s, id) {
  await s.klikni(`#lcd-opc label[for="billingId-${id}"]`, { popis: "platba " + id });
}

/** Vyplní vymyslené údaje (bez čísla domu, keď o.bezCisla). */
export async function vyplnUdaje(s, o = {}) {
  const z = ZAKAZNIK[s.web];
  await s.pis("#billFullName", z.meno);
  await s.pis("#email", z.email);
  await s.pis("#phone", z.telefon);
  await s.pis("#billStreet", z.ulica);
  if (!o.bezCisla) await s.pis("#billHouseNumber", z.cislo);
  await s.pis("#billCity", z.mesto);
  await s.pis("#billZip", z.psc);
  await pauza(300); // validácia telefónu (GET ShoptetValidatePhone) a step2CustomerAjax Shoptetu
}

/** Súhlas s podmienkami (programový klik na checkbox — klik na štítok by mohol trafiť odkaz na VOP v novej karte). */
export async function suhlas(s) {
  const ok = await s.ev(`(function () { var c = document.querySelector('#order-form input[name="consents[]"]'); if (c && !c.checked) c.click(); return !!(c && c.checked); })()`);
  over(ok, "súhlas s podmienkami sa nedal zaškrtnúť");
}

/** Názov platby z kroku 1 podvrhu (ten istý, aký píše súhrn Shoptetu: volbaZoSuhrnu porovnáva práve tieto názvy). */
const nazvy = new Map();
export function nazovPlatby(s, id) {
  const h = s.p.subor("krok1.html");
  if (!nazvy.has(h)) {
    const m = krok1Model(null, { doc: new JSDOM(h).window.document });
    nazvy.set(h, new Map((m.platby || []).map((p) => [p.id, p.nazov])));
  }
  return nazvy.get(h).get(String(id)) || null;
}

/** Čo zákazník vidí tesne pred odoslaním: platba v súhrne Shoptetu (bez ceny) a zaškrtnuté rádio našej sekcie. */
export function videnaPlatba(s) {
  return s.ev(`(function () {
    var r = document.querySelector('#summary-box [data-testid="recapPaymentMethod"]');
    var k = r ? r.cloneNode(true) : null;
    if (k) k.querySelectorAll('[data-testid="recapItemPrice"]').forEach(function (x) { x.remove(); });
    var ch = document.querySelector('#lcd-opc input[name="billingId"]:checked');
    return { suhrn: k ? k.textContent.replace(/\\s+/g, " ").trim() : null, ui: ch ? ch.value : null, prepocet: !!document.querySelector("#summary-box.lcd-opc-prepocet") };
  })()`).catch(() => ({ suhrn: null, ui: null }));
}

/**
 * Klik na „Objednať“ a čakanie na n zachytených Step2Validate (podvrh) — alebo na uplynutie ms, keď n = 0.
 * Spoločná kontrola (kniha § 6.10 bod 4, revízia R1/R2): platba v session pri Step2Validate = platba, ktorú súhrn
 * ukazoval tesne pred klikom (aj zaškrtnuté rádio sekcie). Pri klik: false sa stav berie pri volaní (ak stránka ešte stojí).
 */
export async function objednaj(s, { n = 1, ms = 8000, klik = true } = {}) {
  const videna = await videnaPlatba(s);
  if (klik) await s.klikni("#submit-order", { popis: "Objednať" });
  if (n === 0) { await pauza(ms); return s.p.zaznam.step2; }
  const koniec = Date.now() + ms;
  while (Date.now() < koniec && s.p.zaznam.step2.length < n) await pauza(100);
  over(s.p.zaznam.step2.length >= n, "Step2Validate " + s.p.zaznam.step2.length + "× (čakal som " + n + ")");
  const z = s.p.zaznam.step2[n - 1];
  if (klik) over(videna.suhrn, "pred klikom na „Objednať“ nebolo v súhrne vidno platbu");
  if (videna.suhrn) {
    const nazov = nazovPlatby(s, z.platba);
    over(String(nazov || "").toLowerCase() === videna.suhrn.toLowerCase(),
      "objednávka odišla s platbou " + z.platba + " („" + nazov + "“), súhrn pred klikom ukazoval „" + videna.suhrn + "“");
    if (videna.ui) over(videna.ui === z.platba, "objednávka odišla s platbou " + z.platba + ", zaškrtnutá bola " + videna.ui);
  }
  return s.p.zaznam.step2;
}

/** Telo Step2Validate -> mapa názov -> [hodnoty]. */
export function poleTela(zaznam) {
  const m = new Map();
  for (const [k, v] of zaznam.pole) { if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
  return m;
}

/** Kontrola tela objednávky: povinné polia, súhlas, žiadna doprava/platba z našej sekcie. */
export function overTeloObjednavky(s, zaznam) {
  const m = poleTela(zaznam);
  const z = ZAKAZNIK[s.web];
  for (const [k, v] of [["billFullName", z.meno], ["email", z.email], ["billStreet", z.ulica], ["billHouseNumber", z.cislo], ["billCity", z.mesto], ["billZip", z.psc]]) {
    over((m.get(k) || [])[0] === v, "Step2Validate: " + k + " = " + JSON.stringify(m.get(k)) + " (čakal som " + v + ")");
  }
  over((m.get("phone") || [""])[0].replace(/\s/g, "") === z.telefon.replace(/\s/g, ""), "Step2Validate: phone = " + JSON.stringify(m.get("phone")));
  over((m.get("consents[]") || []).includes(ID[s.web].suhlas), "Step2Validate bez consents[]=" + ID[s.web].suhlas);
  over(!m.has("billingId") && !m.has("shippingId"), "Step2Validate obsahuje billingId/shippingId z našej sekcie: " + JSON.stringify([m.get("shippingId"), m.get("billingId")]));
  over(zaznam.metoda === "POST" && zaznam.typ === "Document" && !zaznam.xhr, "Step2Validate nebol natívny formulár (" + zaznam.metoda + " " + zaznam.typ + (zaznam.xhr ? " XHR" : "") + ")");
  return m;
}

/** Step1Validate XHR z kroku 2 (bez prechodu z košíka). */
export const step1Xhr = (s) => s.p.zaznam.step1.filter((x) => x.xhr);

export { over, pauza, Zlyhanie, OPC, FLAG_OPC };
