// Pomocník scenárov offline testu one page checkoutu (tools/test-opc.mjs): karta s podvrhom siete a ovládanie stránky.
import { pauza } from "../test-1v/cdp.mjs";
import { zapniPodvrh, WEBY } from "./podvrh.mjs";
import { KOD } from "../../assets/js/opc/index.js";

/** Tajný odkaz OPC (assets/js/opc/index.js KOD) — ?opc=1 už nič nezapne. Flag sa ukladá do localStorage (všetky karty). */
export const OPC = "?opc=" + KOD;
/** Flag OPC na stránke (výraz pre s.ev): localStorage, inak sessionStorage (náhrada bez localStorage). */
export const FLAG_OPC = `(function () { var f = null; try { f = localStorage.getItem("lcdOpc"); } catch (e) {} if (f === null) { try { f = sessionStorage.getItem("lcdOpc"); } catch (e) {} } return f; })()`;

export class Zlyhanie extends Error {}
export const over = (podm, sprava) => { if (!podm) throw new Zlyhanie(sprava); };
export { pauza };

/** Chyby konzoly z nášho kódu (bundle z …/eshopy/luxuryCar/assets/) — ostatné (Shoptet bez meračov) len upozornenie. */
export const naseChyby = (chyby) => chyby.filter((c) => /\/eshopy\/luxuryCar\/assets\//.test(c.zdroj || "") || /\blcd[-_]?opc\b|__lcdOpc/i.test(c.text || ""));

/**
 * Nová karta s podvrhom. o: { web, sirka, vyska, build, kosik, scenar, doplnitCdn, applePay, skript, zabudniOpc }.
 *   applePay: true = podvrhnutá window.ApplePaySession s canMakePayments() = true (S14), skript = JS pred každou stránkou,
 *   zabudniOpc: true = localStorage webov zmazaný (zákazník bez tajného odkazu; flag OPC platí pre všetky karty prehliadača)
 * -> s = { k, p, W, chod, ev, cakaj, pripravene, odmietniCookies, klikni, viditelne, cesta, pis, stranky[] }
 */
export async function vytvorStranku(ch, o) {
  const mobil = o.sirka < 768;
  const k = await ch.novaKarta({ sirka: o.sirka, vyska: o.vyska || (mobil ? 844 : 768) }); // vyska: reálne okno notebooku (S41)
  if (o.zabudniOpc) for (const w of Object.values(WEBY)) await k.posli("Storage.clearDataForOrigin", { origin: w.base, storageTypes: "local_storage" });
  const pred = [];
  if (o.applePay) pred.push("window.ApplePaySession = { canMakePayments: function () { return true; }, supportsVersion: function () { return true; } };");
  if (o.skript) pred.push(o.skript);
  if (pred.length) await k.posli("Page.addScriptToEvaluateOnNewDocument", { source: pred.join("\n") });
  const p = await zapniPodvrh(k, { web: o.web, build: o.build, kosik: o.kosik, scenar: o.scenar, doplnitCdn: o.doplnitCdn, mobil });
  const W = WEBY[o.web];
  const s = { k, p, W, web: o.web, sirka: o.sirka, mobil, upozornenia: [] };
  // alert/confirm/beforeunload by zablokoval Runtime.evaluate -> zavrieť a zapísať
  k.na("Page.javascriptDialogOpening", (d) => {
    s.upozornenia.push("dialóg (" + d.type + "): " + String(d.message || "").slice(0, 100));
    k.posli("Page.handleJavaScriptDialog", { accept: d.type === "beforeunload" }).catch(() => {});
  });

  s.ev = (expr) => k.ev(expr);
  s.cakaj = async (expr, { ms = 15000, popis = expr } = {}) => {
    const koniec = Date.now() + ms;
    let posledne;
    while (Date.now() < koniec) {
      try { posledne = await k.ev(expr); if (posledne) return posledne; } catch (e) { posledne = e.message; }
      await pauza(100);
    }
    throw new Zlyhanie("čakanie vypršalo (" + ms / 1000 + " s): " + popis + (posledne ? " — posledné: " + String(posledne).slice(0, 120) : ""));
  };
  s.cesta = () => k.ev("location.pathname + location.search");
  /** Načítaná stránka Shoptetu + náš bundle prebehol (data.json stiahnutý, callback main.js hotový). */
  s.pripravene = async (popis = "stránka") => {
    await s.cakaj(`document.readyState === "complete" && !!window.jQuery`, { ms: 30000, popis: popis + ": načítanie" });
    await s.cakaj(`performance.getEntriesByType("resource").some(function (e) { return /\\/upload\\/data\\.json/.test(e.name); })`, { ms: 20000, popis: popis + ": data.json (bundle)" });
    await pauza(1200); // callback data.json (initKosikDoplnok … initOpc) + prvé prekreslenie
  };
  s.chod = async (cesta, { popis } = {}) => {
    await k.posli("Page.bringToFront").catch(() => {});
    await k.chod(W.base + cesta);
    await s.pripravene(popis || cesta);
  };
  s.odmietniCookies = async () => {
    for (let i = 0; i < 20; i++) {
      const r = await k.ev(`(function () {
        var b = Array.prototype.find.call(document.querySelectorAll(".siteCookies button, .siteCookies a"), function (e) { return e.offsetParent && /^\\s*(Odmietnu|Odmítnou)/i.test(e.textContent || ""); });
        if (b) { b.click(); return "odmietnuté"; }
        var l = document.querySelector(".siteCookies");
        return l && l.offsetHeight ? "" : "bez lišty";
      })()`).catch(() => "");
      if (r) return r;
      await pauza(200);
    }
    return "lišta ostala";
  };
  s.viditelne = (sel) => k.ev(`(function () {
    var e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false;
    var r = e.getBoundingClientRect(), c = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && c.visibility !== "hidden" && c.display !== "none";
  })()`);
  /**
   * Skutočný klik myšou (CDP) do stredu prvku; zlyhá, keď ho niečo prekrýva. Po posune čaká, kým sa poloha ustáli
   * (lepivá hlavička sa po posune stránky zmení a tlačidlo poskočí — klik by trafil iný prvok).
   */
  s.klikni = async (sel, { popis = sel } = {}) => {
    const zmeraj = (posun) => k.ev(`(function () {
      var e = document.querySelector(${JSON.stringify(sel)}); if (!e) return { chyba: "nenájdené" };
      if (${posun ? "true" : "false"}) e.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      var r = e.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return { chyba: "nevidno" };
      var x = r.left + r.width / 2, y = r.top + r.height / 2, h = document.elementFromPoint(x, y);
      if (!h || !(h === e || e.contains(h))) return { chyba: "prekrýva " + (h ? (h.id ? "#" + h.id : h.tagName.toLowerCase() + "." + String(h.className || "").split(" ")[0]) : "nič"), x: x, y: y };
      return { x: Math.round(x), y: Math.round(y) };
    })()`);
    let b = await zmeraj(true);
    for (let i = 0; i < 12; i++) {
      await pauza(150);
      const c = await zmeraj(false);
      const stabilne = !c.chyba && !b.chyba && c.x === b.x && c.y === b.y;
      b = c;
      if (stabilne) break;
    }
    if (b.chyba) throw new Zlyhanie("klik na " + popis + ": " + b.chyba);
    if (s.mobil) await k.tuk(b.x, b.y); else await k.klik(b.x, b.y);
    return b;
  };
  /** Počká na stránku s cestou a triedou tela (napr. "/objednavka/krok-2/", "in-krok-2") a na bundle. */
  s.cakajNaStranku = async (cesta, trieda, { ms = 20000 } = {}) => {
    await s.cakaj(`location.pathname === ${JSON.stringify(cesta)} && document.body && document.body.classList.contains(${JSON.stringify(trieda)}) && document.readyState === "complete"`,
      { ms, popis: "stránka " + cesta + " (body." + trieda + ")" });
    await s.pripravene(cesta);
  };
  /** Dokumenty (navigácie) na www v poradí. */
  s.dokumenty = () => p.zaznam.www.filter((z) => z.typ === "Document").map((z) => z.metoda + " " + z.cesta + " -> " + z.odpoved);
  /**
   * Píše do poľa ako človek: fokus, výber obsahu, vloženie textu (CDP Input.insertText = udalosti input), potom change
   * a blur (Shoptet validuje pri opustení poľa a posiela step2CustomerAjax). Prázdny text = vymazať pole.
   */
  s.pis = async (sel, text) => {
    const ok = await k.ev(`(function () {
      var e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false;
      e.scrollIntoView({ block: "center", behavior: "instant" }); e.focus(); if (e.select) e.select(); return true;
    })()`);
    if (!ok) throw new Zlyhanie("pole " + sel + " nenájdené");
    if (text) await k.posli("Input.insertText", { text });
    else await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); e.value = ""; e.dispatchEvent(new Event("input", { bubbles: true })); })()`);
    await k.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); e.dispatchEvent(new Event("change", { bubbles: true })); e.blur(); })()`);
  };
  s.zavri = () => k.zavri();
  return s;
}
