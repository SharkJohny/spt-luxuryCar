// Pomocník pre ovládače krokov (tools/test-1v/ovladac-*.mjs). JADRO — mení len vydanie (T0.2 14. 10. 2026: farba2,
// box3, t.maParameter, t.zabudni pre viac produktov).
//
// Ovládač dostane objekt t (jedna otvorená stránka):
//   t.ev(expr)                     -> hodnota výrazu v stránke (Runtime.evaluate, returnByValue)
//   t.cakaj(expr, {ms, popis})     -> čaká, kým je výraz pravdivý (inak výnimka „Nedočkal som sa“)
//   t.klikni(selektor, {index, popis, vRamci}) -> SKUTOČNÝ klik myšou do stredu prvku: posunie ho do stredu okna, overí,
//                                     že je viditeľný a NIČ ho nezakrýva (bublina Luxie, lepivá lišta, hlavička…);
//                                     zakrytý prvok = výnimka „zakryté: …“ (test zlyhá ako u zákazníka);
//                                     vRamci = selektor oblasti, v ktorej je zásah iného prvku v poriadku
//                                     (napr. hlavička kroku: nadpis cez číslo kroku)
//   t.nastavSelect(selektor, text|index) -> vyberie možnosť natívneho <select> a vyšle change (ako výber zo zoznamu)
//   t.idParametra(kluc)            -> data-parameter-id selectu formulára podľa data-parameter-name (bez ID natvrdo)
//   t.maParameter(kluc)            -> to isté, ale null (bez výnimky), keď formulár parameter nemá (rohož, box)
//   t.zabudni()                    -> zabudne ID parametrov (po prechode na iný produkt v tej istej karte)
//   t.moznost(kluc, vzor)          -> value možnosti selectu, ktorej text sedí na regex vzor (napr. /dno/)
//   t.pauza(ms), t.mobil, t.sirka, t.novy (beží s ?novy=1), t.log(...)
import { pauza } from "./cdp.mjs";

/** Najdlhšie čakanie na jedno zistenie podmienky v t.cakaj (potom sa skúša znova). */
const LIMIT_POKUSU = 10000;

// Rovnaké mená ako assets/js/components/konfigurator1v/ctx.js (PARAMETRE) — test ich má vlastné, nezávislé od kódu webu.
export const PARAMETRE = {
  farba: "^(farba|barva)\\s*1\\.?\\s*vrstv",
  farba2: "^(farba|barva)\\s*2\\.?\\s*vrstv", // dvojvrstvové (SK 71 „farba 2.vrstvy“)
  rozlozenie: "rozlo[žz]en",
  kufor: "do\\s+kufr",
  farbaBoxov: "^(farba|barva)\\s+box",
  box1: "\\b1\\.\\s*box",
  box2: "\\b2\\.\\s*box",
  box3: "\\b3\\.\\s*box", // box do kufra 616 (SK 100 „Velikost 3. boxu“)
  boxSolo: "box\\s*solo",
  typ: "^typ$",
};

// v stránke: prvok podľa selektora (n-tý viditeľný) -> posun do stredu -> bod kliku alebo popis toho, čo ho zakrýva
const PRIPRAV_KLIK = `(function (sel, index, vRamci) {
  function vid(e) { var r = e.getBoundingClientRect(); var s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity || "1") > 0.05; }
  function popis(e) { if (!e) return "nič"; var c = (e.className && typeof e.className === "string") ? "." + e.className.trim().split(/\\s+/).slice(0, 4).join(".") : ""; return e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + c + (e.src ? " " + String(e.src).slice(0, 60) : ""); }
  var vsetky = Array.prototype.slice.call(document.querySelectorAll(sel));
  var vidne = vsetky.filter(vid);
  var el = vidne[index];
  if (!el) return { chyba: "prvok nenájdený alebo neviditeľný: " + sel + " [" + index + "] (spolu " + vsetky.length + ", viditeľných " + vidne.length + ")" };
  el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  return new Promise(function (hotovo) {
    // počkaj, kým prvok stojí (rozbaľovanie krokov, prekreslenie po výbere) — inak klik trafí miesto, kde už nie je
    var pred = null, stoji = 0, start = Date.now();
    (function sleduj() {
      var q = el.getBoundingClientRect();
      var teraz = [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)].join(",");
      stoji = teraz === pred ? stoji + 1 : 0;
      pred = teraz;
      if (stoji < 3 && Date.now() - start < 2500) { setTimeout(sleduj, 50); return; }
      if (Date.now() - start > 300 && (q.top < 0 || q.bottom > innerHeight)) el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      setTimeout(function () {
      var r = el.getBoundingClientRect();
      var vw = innerWidth, vh = innerHeight;
      var x0 = Math.max(r.left, 0), x1 = Math.min(r.right, vw), y0 = Math.max(r.top, 0), y1 = Math.min(r.bottom, vh);
      if (x1 - x0 < 2 || y1 - y0 < 2) return hotovo({ chyba: "prvok mimo okna: " + popis(el) });
      var x = Math.round((x0 + x1) / 2), y = Math.round((y0 + y1) / 2);
      var hit = document.elementFromPoint(x, y);
      var oblast = vRamci && el.closest(vRamci);
      if (!hit || !(el === hit || el.contains(hit) || (oblast && hit.closest(vRamci) === oblast))) return hotovo({ chyba: "zakryté: " + popis(el) + " zakrýva " + popis(hit) + " v bode " + x + "," + y });
      hotovo({ x: x, y: y, prvok: popis(el) });
      }, 60);
    })();
  });
})`;

export function vytvorT(k, { novy = false, log = () => {} } = {}) {
  const idCache = new Map();
  const t = {
    k, novy, log, pauza,
    mobil: k.mobil,
    sirka: k.sirka,
    ev: k.ev,
  };
  // Každé zisťovanie podmienky má vlastný limit (LIMIT_POKUSU): pri výmene dokumentu alebo zahltenom stroji môže jedno
  // Runtime.evaluate ostať bez odpovede a celé čakanie by na ňom viselo až do limitu CDP (120 s, cdp.mjs) — integrácia
  // WA 14. 10. 2026 (hlásené T1.1, T2.2, T3.2). Zaseknutý pokus sa zahodí a podmienka sa skúša znova do `ms`.
  // Podmienky sú len čítanie stránky, opakovanie je bezpečné.
  t.cakaj = async (expr, { ms = 8000, krok = 120, popis } = {}) => {
    const koniec = Date.now() + ms;
    let posledna;
    while (Date.now() < koniec) {
      let tm;
      try {
        const v = await Promise.race([k.ev(expr), new Promise((_, rej) => { tm = setTimeout(() => rej(new Error("Chrome neodpovedal do " + LIMIT_POKUSU / 1000 + " s")), LIMIT_POKUSU); })]);
        if (v) return v;
      } catch (e) { posledna = e; } finally { clearTimeout(tm); }
      await pauza(krok);
    }
    throw new Error("Nedočkal som sa: " + (popis || expr.replace(/\s+/g, " ").slice(0, 140)) + (posledna ? " (" + posledna.message + ")" : ""));
  };
  t.klikni = async (selektor, { index = 0, popis, pockaj = 300, vRamci = null } = {}) => {
    let r;
    for (let pokus = 0; pokus < 3; pokus++) {
      r = await k.ev(PRIPRAV_KLIK + "(" + JSON.stringify(selektor) + "," + index + "," + JSON.stringify(vRamci) + ")");
      if (!r.chyba) break;
      await pauza(400); // krok sa ešte rozbaľuje / prvok sa ešte kreslí
    }
    if (r.chyba) throw new Error((popis ? popis + ": " : "") + r.chyba);
    await k.klik(r.x, r.y);
    await pauza(pockaj);
    return r;
  };
  t.nastavSelect = async (selektor, hodnota) => {
    const r = await k.ev(`(function () {
      var s = document.querySelector(${JSON.stringify(selektor)});
      if (!s) return { chyba: "select nenájdený: " + ${JSON.stringify(selektor)} };
      var h = ${JSON.stringify(hodnota)};
      var o = typeof h === "number" ? s.options[h] : Array.prototype.find.call(s.options, function (o) { return o.text.trim() === h; });
      if (!o) return { chyba: "možnosť " + h + " v " + ${JSON.stringify(selektor)} + " nie je (" + s.options.length + " možností)" };
      s.value = o.value;
      s.dispatchEvent(new Event("input", { bubbles: true }));
      s.dispatchEvent(new Event("change", { bubbles: true }));
      return { text: o.text.trim() };
    })()`);
    if (r.chyba) throw new Error(r.chyba);
    await pauza(150);
    return r.text;
  };
  t.maParameter = async (kluc) => {
    if (idCache.has(kluc)) return idCache.get(kluc);
    const vzor = PARAMETRE[kluc];
    if (!vzor) throw new Error("neznámy kľúč parametra: " + kluc);
    const id = await k.ev(`(function () {
      var re = new RegExp(${JSON.stringify(vzor)}, "i");
      var s = Array.prototype.find.call(document.querySelectorAll("#product-detail-form select[data-parameter-name]"), function (s) { return re.test((s.getAttribute("data-parameter-name") || "").trim()); });
      return s ? s.getAttribute("data-parameter-id") : null;
    })()`);
    if (id) idCache.set(kluc, id);
    return id || null;
  };
  t.idParametra = async (kluc) => {
    const id = await t.maParameter(kluc);
    if (!id) throw new Error("parameter „" + kluc + "“ vo formulári nie je");
    return id;
  };
  t.zabudni = () => idCache.clear();
  t.moznost = async (kluc, vzor) => {
    const id = await t.idParametra(kluc);
    const v = await k.ev(`(function () {
      var re = new RegExp(${JSON.stringify(vzor.source)}, ${JSON.stringify(vzor.flags)});
      var s = document.querySelector('#product-detail-form select[data-parameter-id="${id}"]');
      var o = s && Array.prototype.find.call(s.options, function (o) { return o.value && re.test(o.text.trim()); });
      return o ? o.value : null;
    })()`);
    if (!v) throw new Error("možnosť " + vzor + " v parametri " + kluc + " (" + id + ") nie je");
    return v;
  };
  return t;
}
