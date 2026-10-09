/**
 * kosikRozpis.js — rozpis položky košíka (farby vrstiev + príplatky po riadkoch) pre panel košíka v hlavičke.
 *
 * Prečo (Michal 9. 10. 2026, iPhone CZ): panel po ťuknutí na ikonu košíka ukazoval „Příplatky: rozložení koberců -
 * první a druhá řada,…“ — Shoptet text príplatkov v paneli skracuje už na serveri („autokoberce do…“), takže sa nedá
 * len prestylovať. Plný text je v obsahu košíka (shoptet.config.cartContentUrl, ten istý, z ktorého Shoptet kreslí
 * /kosik/); riadky sa párujú podľa itemId. Delenie a vynechávanie je rovnaké ako v cart.js (changeDescription).
 */

const SEP = /\s[-–]\s/;

/** Farby vrstiev z variantu „Barva 1.vrstvy: …, Barva 2.vrstvy: …“ (SK „Farba“); hodnota môže obsahovať čiarku aj „/“. */
export function lcdVrstvy(variant) {
  const t = String(variant || "").replace(/\s+/g, " ").trim();
  const m1 = t.match(/(?:farba|barva)\s*1\.?\s*vrstvy\s*:\s*(.+?)(?=\s*,?\s*(?:farba|barva)\s*2\.?\s*vrstvy|\s*$)/i);
  const m2 = t.match(/(?:farba|barva)\s*2\.?\s*vrstvy\s*:\s*(.+)$/i);
  return [m1 && m1[1].trim(), m2 && m2[1].trim()];
}

/** Príplatky „Příplatky: názov - hodnota, názov - hodnota“ -> položky; deliť len na čiarke pred ďalším „názov - “ / „názov:“. */
export function lcdPriplatky(text) {
  const t = String(text || "").replace(/\s+/g, " ").replace(/^\s*P[rř][ií]platky\s*:\s*/i, "").trim();
  if (!t) return [];
  return t.split(/,\s*(?=[^,]*(?:\s[-–]\s|:))/).map((s) => s.trim()).filter(Boolean);
}

const velke = (s) => s.charAt(0).toLocaleUpperCase() + s.slice(1);
/** „Farba kože : Čierna“, „S : 33x32x30 cm“ (texty z adminu) -> bez medzery pred dvojbodkou */
const hodnota = (s) => s.replace(/\s+:/g, ":").trim();

/**
 * Riadky rozpisu jednej položky: [{ n: názov | null, h: hodnota }].
 * Vynecháva „TYP - …“ (typ karosérie ukazuje konfigurátor, v košíku ho cart.js tiež vynecháva) a zástupné hodnoty
 * kamiónového konfigurátora. Prázdne pole = nie je čo rozpisovať (panel nechá natívny text).
 */
export function lcdRozpis({ variant, priplatky, cz }) {
  const out = [];
  const [v1, v2] = lcdVrstvy(variant);
  const vrstva = (n) => (cz ? "Barva " : "Farba ") + n + ". vrstvy";
  // zvyšok variantu mimo farieb vrstiev („Typ: Combi, …“) — natívny variant sa v paneli skryje, nesmie sa stratiť
  const zvysok = String(variant || "").replace(/\s+/g, " ")
    .replace(/(?:farba|barva)\s*[12]\.?\s*vrstvy\s*:\s*(.+?)(?=\s*,?\s*(?:farba|barva)\s*[12]\.?\s*vrstvy|\s*$)/gi, "")
    .replace(/^[\s,;/]+|[\s,;/]+$/g, "");
  if (zvysok) out.push({ n: null, h: velke(hodnota(zvysok)) });
  if (v1) out.push({ n: vrstva(1), h: hodnota(v1) });
  if (v2) out.push({ n: vrstva(2), h: hodnota(v2) });
  for (const p of lcdPriplatky(priplatky)) {
    if (/\bTYP\b/.test(p) || /Vyberie sa v konfigurátore/i.test(p)) continue;
    const i = p.search(SEP);
    if (i > 0) {
      const n = p.slice(0, i).replace(/\s*:\s*$/, "").trim();
      const h = hodnota(p.slice(i).replace(SEP, ""));
      if (h) { out.push({ n: velke(n), h }); continue; }
    }
    out.push({ n: null, h: velke(hodnota(p)) });
  }
  // len zvyšok variantu bez farieb a príplatkov (poukážka „Hodnota: 100 €“) -> nič, panel nechá natívny text
  return out.length === 1 && zvysok ? [] : out;
}

/** <ul class="{trieda}"><li><span class="{trieda}__n">Názov: </span><span class="{trieda}__h">hodnota</span></li>… (textContent, bez HTML) */
export function lcdRozpisEl(doc, riadky, trieda) {
  const ul = doc.createElement("ul");
  ul.className = trieda;
  riadky.forEach((x) => {
    const li = doc.createElement("li");
    if (x.n) {
      const n = doc.createElement("span");
      n.className = trieda + "__n";
      n.textContent = x.n + ": ";
      li.appendChild(n);
    }
    const h = doc.createElement("span");
    h.className = trieda + "__h";
    h.textContent = x.h;
    li.appendChild(h);
    ul.appendChild(li);
  });
  return ul;
}

/** Z HTML obsahu košíka (payload.content) -> { itemId: { v: variant, p: príplatky } }. */
export function lcdRozpisZObsahu(html, Parser = typeof DOMParser !== "undefined" ? DOMParser : null) {
  const out = {};
  if (!html || !Parser) return out;
  const doc = new Parser().parseFromString(String(html), "text/html");
  doc.querySelectorAll('tr[data-micro="cartItem"], tr.removeable').forEach((tr) => {
    const id = tr.querySelector('input[name="itemId"]');
    if (!id || !id.value) return;
    const txt = (sel) => {
      const e = tr.querySelector(sel);
      return e ? e.textContent.replace(/\s+/g, " ").trim() : "";
    };
    out[id.value] = {
      v: txt('[data-testid="cartWidgetVariantName"], .main-link-variant'),
      p: txt('[data-testid="cartWidgetSurchargeName"], .main-link-surcharges'),
    };
  });
  return out;
}
