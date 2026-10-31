// Scenáre ďakovnej stránky (assets/js/opc/dakujeme.js, návrh 4 z 30. 10. 2026) v offline teste tools/test-opc.mjs.
// Stránka = REKONŠTRUKCIA (tools/test-opc/dakujeme-fixtures.mjs) v obale zachyteného kroku 2 so skriptmi Shoptetu,
// náš bundle a CSS z lokálneho buildu (podvrh: GET /objednavka/dekujeme|dakujeme/ so scenárom dakujeme).
//   S50 bez kódu (aj ?opc=1): stránka Shoptetu bez zmeny — žiadny prvok, trieda, globál ani záznam, obsah viditeľný,
//       na www len dokument (a statické súbory), bundle a data.json načítané (inak by „nič“ nič nedokazovalo)
//   S51 s kódom, prevod: hodnoty z popisov Shoptetu, pôvodný obsah len skrytý (v DOM), Kopírovať skutočným klikom,
//       záznam v localStorage (adresa bez query, bez skriptov); potom ?opc=0 -> zase pôvodná stránka
//   S52 stavy s kódom: kartou neprebehla (zelené tlačidlo = odkaz Shoptetu), dobierka (nikde záloha); kartou zaplatené
//       a čaká (PENDING) -> pôvodná stránka (revízia 31. 10.: „Zaplatené“ podľa textu vypnuté), chýbajúca suma -> pôvodná
//   S53 rozloženie: nič nepreteká 320–1920 px (prevod aj neprebehla), písmo text ≥ 16 / poznámky ≥ 14 / štítky ≥ 12 px,
//       hlavné tlačidlo zelené, žiadne zakázané slová
import { over, pauza, OPC, FLAG_OPC } from "./pomocnik.mjs";
import { CESTY, ocakavane } from "./dakujeme-fixtures.mjs";

const ZAKAZANE = "z[aá]loh|21\\s*[–-]\\s*29|\\bdn[ií]\\b|dodan|dodán|vyr[aá]b|\\bDPH\\b|z[aá]ruk|IBAN|na milimet";

/** Stopa nášho kódu na ďakovnej stránke. */
async function stopa(s) {
  return s.ev(`(function () {
    var cw = document.getElementById("content-wrapper"), cs = cw ? getComputedStyle(cw) : null;
    var z = null; try { z = localStorage.getItem("lcdOpcDakujemeZaznam"); } catch (e) {}
    return {
      globalne: typeof window.__lcdOpc !== "undefined",
      stav: window.__lcdOpc ? window.__lcdOpc.stav : null,
      dovod: window.__lcdOpc ? window.__lcdOpc.dovod || null : null,
      prvky: document.querySelectorAll('[id^="lcd-dak"], [class*="lcd-dak"], [class*="lcd-opc"], [id^="lcd-opc"]').length,
      triedyHtml: document.documentElement.className.split(/\\s+/).filter(function (c) { return /opc|dak/i.test(c); }),
      zaznam: z,
      flag: ${FLAG_OPC},
      povodnyViditelny: !!(cw && cs.display !== "none" && cs.visibility === "visible" && cw.getBoundingClientRect().height > 50),
      povodnyVDom: !!document.querySelector("#content .order-summary-heading"),
      blok: !!document.getElementById("lcd-dakujeme"),
    };
  })()`);
}

async function otvor(J, kluc, { kod = false, hladanie = "" } = {}) {
  const v = ocakavane(kluc);
  const s = await J.novaStranka({ scenar: { dakujeme: kluc } });
  await s.chod(CESTY[v.web] + (kod ? OPC : hladanie), { popis: "ďakovná " + kluc });
  if (kod) await s.cakaj(`window.__lcdOpc && /^dakujeme-/.test(window.__lcdOpc.stav)`, { ms: 10000, popis: "modul ďakovnej stránky " + kluc });
  return { s, o: v };
}
const t = (s, sel) => s.ev(`(function () { var e = document.querySelector(${JSON.stringify(sel)}); return e ? e.textContent.replace(/[\\s\\u00a0]+/g, " ").trim() : null; })()`);
const n = (x) => String(x == null ? "" : x).replace(/[\s ]+/g, " ").trim();

export const SCENARE = {
  S50: {
    popis: "Ďakovná stránka bez kódu (aj ?opc=1): presne stránka Shoptetu — žiadny prvok, trieda, globál, záznam ani požiadavka navyše",
    async fn(J) {
      const casti = [];
      for (const [kluc, hladanie] of [[J.web + "-prevod", ""], [J.web + "-karta-nie", "?opc=1"], [J.web + "-dobierka", ""]]) {
        const { s } = await otvor(J, kluc, { hladanie });
        const st = await stopa(s);
        over(!st.globalne && st.prvky === 0 && !st.triedyHtml.length && st.zaznam === null && st.flag === null,
          kluc + ": modul niečo spravil bez kódu: " + JSON.stringify(st));
        over(st.povodnyViditelny && st.povodnyVDom, kluc + ": pôvodný obsah nie je viditeľný: " + JSON.stringify(st));
        over(s.p.zaznam.podvrhnute.some((x) => /luxuryCar\.js$/.test(x)) && s.p.zaznam.dataJson > 0, kluc + ": bundle alebo data.json sa nenačítal");
        const www = s.p.zaznam.www.filter((z) => z.odpoved !== "staticke");
        over(www.length === 1 && www[0].typ === "Document" && /^dakujeme-/.test(www[0].odpoved),
          kluc + ": požiadavky na web navyše: " + www.map((z) => z.metoda + " " + z.cesta + " " + z.odpoved).join(", "));
        casti.push(kluc + (hladanie ? hladanie : "") + " bez zmeny");
        await s.zavri();
      }
      return { info: casti.join("; ") };
    },
  },
  S51: {
    popis: "Ďakovná stránka s kódom, prevod: hodnoty podľa popisov, pôvodný obsah skrytý (nie zmazaný), Kopírovať, záznam; ?opc=0 vráti stránku Shoptetu",
    async fn(J) {
      const kluc = J.web + "-prevod";
      const { s, o } = await otvor(J, kluc, { kod: true });
      const st = await stopa(s);
      over(st.stav === "dakujeme-prevod" && st.blok && !st.povodnyViditelny && st.povodnyVDom, "stav: " + JSON.stringify(st));
      over(st.triedyHtml.includes("lcd-opc-dakujeme") && !st.triedyHtml.includes("lcd-opc-dakujeme-caka"), "triedy " + st.triedyHtml);
      over((await t(s, ".lcd-dak-hero__cislo")) === "Objednávka č. " + o.cislo, "číslo " + (await t(s, ".lcd-dak-hero__cislo")));
      over((await t(s, ".lcd-dak-platba__suma")) === n(o.sumaText), "suma " + (await t(s, ".lcd-dak-platba__suma")));
      const udaje = await s.ev(`Array.prototype.map.call(document.querySelectorAll("#lcd-dakujeme .lcd-dak-udaj"), function (li) {
        return [li.querySelector(".lcd-dak-udaj__h").textContent.replace(/[\\s\\u00a0]+/g, " ").trim(), li.querySelector(".lcd-dak-kopia").getAttribute("data-kopia")]; })`);
      over(JSON.stringify(udaje) === JSON.stringify([[o.ucet, o.ucet], [o.vs, o.vs], [n(o.sumaText), String(o.suma)]]), "údaje " + JSON.stringify(udaje));
      over((await s.ev(`!!document.querySelector("#lcd-dakujeme .lcd-dak-qr img")`)) === o.qr, "QR obrázok Shoptetu " + o.qr);
      // Kopírovať skutočným klikom (Clipboard API alebo záloha execCommand)
      await s.odmietniCookies();
      await s.klikni("#lcd-dakujeme .lcd-dak-udaj:nth-child(2) .lcd-dak-kopia", { popis: "Kopírovať VS" });
      await s.cakaj(`/✓/.test(document.querySelector("#lcd-dakujeme .lcd-dak-udaj:nth-child(2) .lcd-dak-kopia").textContent)`, { ms: 3000, popis: "„Skopírované ✓“" });
      await pauza(2000);
      over(/^Kop[ií]rova[tť]$/.test(n(await t(s, "#lcd-dakujeme .lcd-dak-udaj:nth-child(2) .lcd-dak-kopia"))), "tlačidlo sa nevrátilo");
      const z = JSON.parse(st.zaznam || "[]");
      over(z.length === 1 && z[0].url === s.W.base + CESTY[o.web] && /Objednávka odeslána|Objednávka odoslaná/.test(z[0].html) && !/<script/i.test(z[0].html) && z[0].stav === "prevod",
        "záznam: " + JSON.stringify(z.map((x) => ({ url: x.url, stav: x.stav, dlzka: x.html.length, skript: /<script/i.test(x.html) }))));
      // ?opc=0: flag preč, ďakovná stránka zase pôvodná
      await s.chod(CESTY[o.web] + "?opc=0", { popis: "ďakovná ?opc=0" });
      const st0 = await stopa(s);
      over(!st0.globalne && !st0.blok && st0.povodnyViditelny && st0.flag === null && !st0.triedyHtml.length, "?opc=0: " + JSON.stringify(st0));
      return { info: "prevod " + o.cislo + " " + n(o.sumaText) + ", Kopírovať OK, záznam " + z[0].html.length + " znakov, ?opc=0 pôvodná" };
    },
  },
  S52: {
    popis: "Ďakovná stránka s kódom: kartou neprebehla (odkaz Shoptetu), dobierka (bez zálohy); kartou zaplatené, čaká a chýbajúca suma -> pôvodná stránka",
    async fn(J) {
      const casti = [];
      // revízia 31. 10.: „Zaplatené“ len podľa textu sa neukazuje (kým záznam nepotvrdí text Shoptetu), PENDING tiež nie
      for (const kluc of [J.web + "-karta-ok", J.web + "-karta-caka"]) {
        const { s } = await otvor(J, kluc, { kod: true });
        const st = await stopa(s);
        over(st.stav === "dakujeme-povodna" && /^stav platby/.test(st.dovod || "") && !st.blok && st.povodnyViditelny && !st.triedyHtml.length, kluc + ": " + JSON.stringify(st));
        // záznamy sa v profile prehliadača hromadia (karta-ok, potom karta-caka) -> posledný je táto stránka
        const z = JSON.parse(st.zaznam || "[]"), posl = z[z.length - 1];
        over(posl && posl.stav === null && /^stav platby/.test(posl.dovod || "") && posl.url === s.W.base + CESTY[J.web], kluc + ": záznam " + JSON.stringify(z.map((x) => ({ url: x.url, stav: x.stav, dovod: x.dovod }))));
        casti.push(kluc.replace(/^\w+-/, "") + " -> pôvodná");
        await s.zavri();
      }
      {
        const { s, o } = await otvor(J, J.web + "-karta-nie", { kod: true });
        const st = await stopa(s);
        over(st.stav === "dakujeme-neprebehla", "karta nie: " + JSON.stringify(st));
        const btn = await s.ev(`(function () { var b = document.querySelector("#lcd-dakujeme .lcd-dak-platba__btn"); return b ? [b.tagName, b.getAttribute("href"), b.className, getComputedStyle(b).backgroundImage] : null; })()`);
        over(btn && btn[0] === "A" && btn[1] === o.odkazPlatby && /lcd-dak-btn-zeleny/.test(btn[2]) && /46, 125, 50/.test(btn[3]), "tlačidlo platby: " + JSON.stringify(btn));
        over(await s.ev(`!!document.querySelector("#lcd-dakujeme .lcd-dak-spat .lcd-dak-btn-vedlajsi")`), "späť nie je vedľajšie");
        casti.push("neprebehla -> " + btn[1]);
        await s.zavri();
      }
      {
        const { s, o } = await otvor(J, J.web + "-dobierka", { kod: true });
        const st = await stopa(s);
        over(st.stav === "dakujeme-dobierka", "dobierka: " + JSON.stringify(st));
        const text = await t(s, "#lcd-dakujeme");
        over(!/z[aá]loh/i.test(text), "dobierka: záloha v texte");
        over(text.includes(n(o.sumaText)), "dobierka: suma");
        casti.push("dobierka bez zálohy");
        await s.zavri();
      }
      {
        const kluc = J.web + "-chyba-suma";
        const { s } = await otvor(J, kluc, { hladanie: OPC });
        await s.cakaj(`window.__lcdOpc && /^dakujeme-/.test(window.__lcdOpc.stav)`, { ms: 10000, popis: "modul " + kluc });
        const st = await stopa(s);
        over(st.stav === "dakujeme-povodna" && !st.blok && st.povodnyViditelny && !st.triedyHtml.length, "fallback: " + JSON.stringify(st));
        casti.push("bez sumy -> pôvodná (" + st.dovod + ")");
        await s.zavri();
      }
      return { info: casti.join("; ") };
    },
  },
  S53: {
    popis: "Ďakovná stránka s kódom: nič nepreteká 320–1920 px, písmo text ≥ 16 / poznámky ≥ 14 / štítky ≥ 12 px, zelené hlavné tlačidlo, žiadne zakázané slová",
    async fn(J) {
      const casti = [];
      for (const kluc of [J.web + "-prevod", J.web + "-karta-nie", J.web + "-dobierka"]) {
        const { s } = await otvor(J, kluc, { kod: true });
        const chyby = [];
        for (const w of [320, 360, 390, 414, 768, 1024, 1280, 1366, 1920]) {
          await s.k.posli("Emulation.setDeviceMetricsOverride", { width: w, height: w < 768 ? 844 : 900, deviceScaleFactor: 1, mobile: w < 768 });
          await pauza(150);
          const r = await s.ev(`(function () {
            var b = document.getElementById("lcd-dakujeme"), W = document.documentElement.clientWidth, zle = [];
            if (document.documentElement.scrollWidth > W + 1) zle.push("stránka " + document.documentElement.scrollWidth + " > " + W);
            b.querySelectorAll("*").forEach(function (e) {
              var r = e.getBoundingClientRect(); if (!r.width) return;
              if (r.right > W + 0.5 || r.left < -0.5) zle.push((e.className && e.className.baseVal === undefined ? e.className : e.tagName) + " " + Math.round(r.left) + "–" + Math.round(r.right));
              var vlastny = Array.prototype.some.call(e.childNodes, function (x) { return x.nodeType === 3 && /\\S/.test(x.nodeValue); });
              if (!vlastny) return;
              var fs = parseFloat(getComputedStyle(e).fontSize), c = (e.className || "") + " " + (e.parentNode.className || "");
              var stitok = /hero__cislo|platba__stitok|osa__bod/.test(c) || e.tagName === "EM";
              var poznamka = /udaj__n|platba__navod|polozka__cena|lcd-rozpis|kopia|qr__text/.test(c) || e.tagName === "SMALL";
              var min = stitok ? 12 : poznamka ? 14 : 16;
              if (fs < min) zle.push("písmo " + fs + " px < " + min + ": " + e.textContent.trim().slice(0, 30));
            });
            return zle.slice(0, 6);
          })()`);
          if (r.length) chyby.push(w + ": " + r.join(" | "));
        }
        over(!chyby.length, kluc + ": " + chyby.join("\n      "));
        const text = await s.ev(`document.getElementById("lcd-dakujeme").innerText`);
        const z = new RegExp(ZAKAZANE, "i").exec(text);
        over(!z, kluc + ": zakázané slovo „" + (z && z[0]) + "“");
        const zelene = await s.ev(`Array.prototype.map.call(document.querySelectorAll("#lcd-dakujeme .lcd-dak-btn-zeleny"), function (b) { return getComputedStyle(b).backgroundImage; })`);
        over(zelene.length === 1 && /46, 125, 50/.test(zelene[0]), kluc + ": zelené tlačidlo " + JSON.stringify(zelene));
        casti.push(kluc + " OK");
        await s.zavri();
      }
      return { info: "320–1920 bez pretečenia, písmo, zelené, slová: " + casti.join(", ") };
    },
  },
};
