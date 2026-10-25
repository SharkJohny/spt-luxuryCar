#!/usr/bin/env node
// Test (c) brány kamiónov SK 640 — nulová zmena bez flagu a poistka (docs/kamiony-1v-plan.md §1.2–1.4, §5 (c)).
// Fixture živej stránky + ozajstná cesta productPage.js initProduct -> konfigurator1v initKonfigurator1v (jsdom).
//   node tools/test-kamion-brana.mjs
import { readFileSync } from "node:fs";
import { spustiStranku, pauza } from "./test-1v/kamion-spolocne.mjs";

let ok = 0, zle = 0;
const over = (nazov, podm, detail) => {
  if (podm) { ok++; console.log("  OK   " + nazov); }
  else { zle++; console.log("  ZLE  " + nazov + (detail ? " — " + detail : "")); }
};
const URL0 = "https://www.luxurycardesign.sk/luxusne-autokoberce-kamiony/";
const H1_ZIVY = (d) => (d.querySelector(".p-detail-inner-header h1") || {}).textContent;
const react = (d) => !!d.querySelector('#truck-konfigurator-root[data-tk-mounted="1"]');
const hlavickaNaMieste = (d) => {
  const h = d.querySelector(".p-detail-inner-header");
  return !!(h && h.parentNode && h.parentNode.classList.contains("p-detail-inner") && h.nextElementSibling && h.nextElementSibling.id === "product-detail-form");
};
const lcdChyby = (ch) => ch.filter((x) => /\[lcd-1v\]|kamion/i.test(x));
// spustenie pre všetkých (index.js SPUSTENE, Michal 25. 10. 2026): bez flagu nový konfigurátor, starý React len s ?novy=0
const SPUSTENE = /export const SPUSTENE\s*=\s*true/.test(readFileSync(new URL("../assets/js/components/konfigurator1v/index.js", import.meta.url), "utf8"));

/** Starý vzhľad = presne dnešný React (bez flagu pred spustením, ?novy=0 po ňom). */
function overReact(s, flag) {
  const d = s.document;
  over("React namontovaný (#truck-konfigurator-root[data-tk-mounted=1])", react(d));
  over("body bez lcd-1v a data-lcd1v-typ", !d.body.classList.contains("lcd-1v") && !d.body.hasAttribute("data-lcd1v-typ"));
  over("žiadny #lcd1v-kamion ani #lcd1v-lista", !d.getElementById("lcd1v-kamion") && !d.getElementById("lcd1v-lista"));
  over("window.__lcd1v nie je", s.window.__lcd1v === undefined);
  over("sessionStorage lcd1v = " + flag, s.window.sessionStorage.getItem("lcd1v") === flag);
  over("H1 a hlavička nezmenené", /luxusné autokoberce do kamionov/.test(H1_ZIVY(d)) && hlavickaNaMieste(d));
  over("body.is-truck-konfigurator (ako dnes)", d.body.classList.contains("is-truck-konfigurator"));
}

if (SPUSTENE) {
  console.log("1) Bez flagu (spustené) = nový konfigurátor, React sa nemontuje");
  const s = await spustiStranku({ url: URL0 });
  const d = s.document;
  over("#lcd1v-kamion postavený, React sa nemontuje", !!d.getElementById("lcd1v-kamion") && !d.getElementById("truck-konfigurator-root"));
  over("body.lcd-1v + data-lcd1v-typ=kamion", d.body.classList.contains("lcd-1v") && d.body.getAttribute("data-lcd1v-typ") === "kamion");
  over("6 krokov (kamión)", d.querySelectorAll("#lcd1v-kamion .k-krok").length === 6);
  over("sessionStorage bez lcd1v (flag sa nezapisuje)", s.window.sessionStorage.getItem("lcd1v") === null);
  over("bez chýb [lcd-1v]", lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
  console.log("1b) ?novy=0 (spustené) = presne dnešný React");
  overReact(await spustiStranku({ url: URL0 + "?novy=0" }), "0");
} else {
  console.log("1) Bez flagu = presne dnešný React");
  overReact(await spustiStranku({ url: URL0 }), null);
}

console.log("2) ?novy=vyvoj = nový konfigurátor, React sa nemontuje");
{
  const s = await spustiStranku({ url: URL0 + "?novy=vyvoj" });
  const d = s.document;
  over("#lcd1v-kamion postavený", !!d.getElementById("lcd1v-kamion"));
  over("React root neexistuje", !d.getElementById("truck-konfigurator-root"));
  over("body.lcd-1v + data-lcd1v-typ=kamion", d.body.classList.contains("lcd-1v") && d.body.getAttribute("data-lcd1v-typ") === "kamion");
  over("koreň v .p-info-wrapper (.truck-konfigurator-wrap)", !!d.querySelector(".p-info-wrapper > .truck-konfigurator-wrap.lcd1v-kamion > #lcd1v-kamion"));
  over("hlavička presunutá do koreňa, H1 = text artefaktu", !!d.querySelector("#lcd1v-kamion > .p-detail-inner-header h1.k-h1") && /do kamiónov a dodávok/.test(H1_ZIVY(d)));
  over("6 krokov (kamión)", d.querySelectorAll("#lcd1v-kamion .k-krok").length === 6);
  over("každé tlačidlo v koreni má type=button", Array.from(d.querySelectorAll("#lcd1v-kamion button, #lcd1v-lista button")).every((b) => b.getAttribute("type") === "button"));
  over("žiadne name na poliach nového UI", !d.querySelector("#lcd1v-kamion [name], #lcd1v-lista [name]"));
  over("bez chýb [lcd-1v]", lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
  over("ctx.chyby prázdne", s.ctx && s.ctx.chyby.length === 0, s.ctx && s.ctx.chyby.join(" | "));
}

// ?novy=1 sa riadi vydaním: kamion v ZAPNUTE_TYPY (K10) = nový konfigurátor, inak React.
const { ZAPNUTE_TYPY } = await import("../assets/js/components/konfigurator1v/produkty.js");
const vydany = ZAPNUTE_TYPY.includes("kamion");
console.log("3) ?novy=1 " + (vydany ? "po vydaní (kamion v ZAPNUTE_TYPY) = nový konfigurátor" : "pred vydaním (kamion nie je v ZAPNUTE_TYPY) = React"));
{
  const s = await spustiStranku({ url: URL0 + "?novy=1" });
  const d = s.document;
  if (vydany) {
    over("#lcd1v-kamion postavený, React sa nemontuje", !!d.getElementById("lcd1v-kamion") && !d.getElementById("truck-konfigurator-root"));
    over("body.lcd-1v + data-lcd1v-typ=kamion", d.body.classList.contains("lcd-1v") && d.body.getAttribute("data-lcd1v-typ") === "kamion");
    over("6 krokov (kamión)", d.querySelectorAll("#lcd1v-kamion .k-krok").length === 6);
    over("bez chýb [lcd-1v]", lcdChyby(s.chyby).length === 0, lcdChyby(s.chyby).join(" | "));
  } else {
    over("React namontovaný", react(d));
    over("bez nového UI a lcd-1v", !d.getElementById("lcd1v-kamion") && !d.body.classList.contains("lcd-1v"));
  }
}

console.log("4) Poistka: chýba select Tapacír (352) -> React, nič nového");
{
  const s = await spustiStranku({
    url: URL0 + "?novy=vyvoj",
    uprav: (h) => h.replace(/<select name="surchargeParameterValueId\[352\]"[\s\S]*?<\/select>/, ""),
  });
  const d = s.document;
  over("React namontovaný", react(d));
  over("bez lcd-1v, #lcd1v-kamion a lišty", !d.body.classList.contains("lcd-1v") && !d.getElementById("lcd1v-kamion") && !d.getElementById("lcd1v-lista"));
  over("H1 a hlavička na pôvodnom mieste", /luxusné autokoberce do kamionov/.test(H1_ZIVY(d)) && !/kamiónov a dodávok/.test(H1_ZIVY(d)) && hlavickaNaMieste(d));
  over("chyba zapísaná v ctx.chyby", s.ctx && s.ctx.chyby.some((x) => /kamion/.test(x)), s.ctx && s.ctx.chyby.join(" | "));
}

console.log("5) Poistka: asynchrónna chyba (ctx.zlozit) po postavení -> React");
{
  const s = await spustiStranku({ url: URL0 + "?novy=vyvoj" });
  const d = s.document;
  over("najprv nový konfigurátor", !!d.getElementById("lcd1v-kamion") && !react(d));
  s.ctx.zlozit();
  await pauza(150);
  over("React namontovaný", react(d));
  over("lcd-1v, koreň a lišta preč", !d.body.classList.contains("lcd-1v") && !d.getElementById("lcd1v-kamion") && !d.getElementById("lcd1v-lista"));
  over("H1 a hlavička na pôvodnom mieste", /luxusné autokoberce do kamionov/.test(H1_ZIVY(d)) && hlavickaNaMieste(d) && !d.querySelector(".k-typ, .k-hodn"));
  over("window.__lcd1vKamion preč", s.window.__lcd1vKamion === undefined);
}

console.log("6) Poistka: chyba v init UI (rozbitá ponuka materiálu) -> React, nič rozostavané");
{
  const s = await spustiStranku({
    url: URL0 + "?novy=vyvoj",
    // materiál, ktorý konfigurátor nepozná -> výpočet ceny v UI vyhodí chybu počas stavby
    uprav: (h) => h.replace(/Prémiová syntetická koža – tónovaná \+€40/, "Neznámy materiál +€40"),
  });
  const d = s.document;
  over("React namontovaný", react(d));
  over("bez lcd-1v, koreňa a lišty", !d.body.classList.contains("lcd-1v") && !d.getElementById("lcd1v-kamion") && !d.getElementById("lcd1v-lista"));
  over("hlavička na pôvodnom mieste", hlavickaNaMieste(d) && /luxusné autokoberce do kamionov/.test(H1_ZIVY(d)));
}

console.log("6b) Poistka: chyba po štarte (zápis do košíka zlyhá pri kliku) -> React");
{
  const s = await spustiStranku({ url: URL0 + "?novy=vyvoj" });
  const d = s.document, w = s.window;
  over("najprv nový konfigurátor", !!d.getElementById("lcd1v-kamion") && !react(d));
  // jednorazová chyba v syncToShoptet (document.querySelectorAll) pri výbere značky
  const povodna = d.querySelectorAll;
  d.querySelectorAll = function (sel) {
    if (sel === "select[data-parameter-id]") { d.querySelectorAll = povodna; throw new Error("test: sync zlyhal"); }
    return povodna.call(this, sel);
  };
  const sel = d.querySelector('#lcd1v-kamion select[data-p="znacka"]');
  sel.value = "DAF (TIR)";
  sel.dispatchEvent(new w.Event("change", { bubbles: true }));
  await pauza(150);
  over("React namontovaný", react(d));
  over("lcd-1v, koreň a lišta preč", !d.body.classList.contains("lcd-1v") && !d.getElementById("lcd1v-kamion") && !d.getElementById("lcd1v-lista"));
  over("hlavička na pôvodnom mieste", hlavickaNaMieste(d) && /luxusné autokoberce do kamionov/.test(H1_ZIVY(d)));
  over("chyba nahlásená v konzole", s.chyby.some((x) => /chyba po štarte/.test(x)));
}

console.log("7) CZ kontext (projekt 581408) s ?novy=vyvoj -> React (CZ sa nemení)");
{
  const s = await spustiStranku({
    url: "https://www.luxurycardesign.cz/luxusni-autokoberce-kamiony/?novy=vyvoj",
    uprav: (h) => h.replace('"projectId":562035', '"projectId":581408').replace('"language":"sk"', '"language":"cs"'),
  });
  const d = s.document;
  over("React namontovaný", react(d));
  over("bez nového UI", !d.getElementById("lcd1v-kamion") && !d.body.classList.contains("lcd-1v"));
}

console.log("8) ?novy=0 po vývoji vypne flag -> React");
{
  const s = await spustiStranku({ url: URL0 + "?novy=0", session: { lcd1v: "vyvoj" } });
  const d = s.document;
  over("React namontovaný", react(d));
  over(SPUSTENE ? "flag = 0 (starý vzhľad v karte)" : "flag zmazaný", s.window.sessionStorage.getItem("lcd1v") === (SPUSTENE ? "0" : null));
}

console.log(`\n${ok} OK, ${zle} ZLE`);
process.exit(zle ? 1 : 0);
