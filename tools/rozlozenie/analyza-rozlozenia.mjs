// Spoločná analýza rozloženia (z rozlozenie-kamion.mjs): prekrytia, pretečenie, orezanie, mimo okna, malé dotykové ciele.
export const ANALYZA = String.raw`((sel, dotyk) => {
  const vw = document.documentElement.clientWidth, vh = innerHeight;
  const sec = document.querySelector(sel); if (!sec) return null;
  const DEKOR = "script,style,noscript,[aria-hidden=true] svg";
  const viditelny = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.15) return false;
      if (cs.position === "absolute" && (cs.clip !== "auto" || /inset|rect/.test(cs.clipPath))) return false;
      if (cs.overflow !== "visible") { const q = e.getBoundingClientRect(); if (q.width <= 2 || q.height <= 2) return false; } } return true; };
  // zámerná vrstva nad fotkou (štítok, cena, bodka, pozadie CTA, úvodzovka): prvok alebo predok do 3 úrovní je absolute
  const nadFotkou = (el) => { for (let e = el, i = 0; e && e !== sec && i < 4; e = e.parentElement, i++) { const p = getComputedStyle(e).position; if (p === "absolute" || p === "fixed") return true; } return false; };
  const jeFotka = (el) => el.tagName === "IMG" || el.tagName === "PICTURE" || el.tagName === "VIDEO";
  const orez = (el, r) => { let x1 = r.l, y1 = r.t, x2 = r.r, y2 = r.b;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e);
      if (cs.overflowX !== "visible" || cs.overflowY !== "visible") { const p = e.getBoundingClientRect();
        x1 = Math.max(x1, p.left); y1 = Math.max(y1, p.top); x2 = Math.min(x2, p.right); y2 = Math.min(y2, p.bottom); } }
    x1 = Math.max(x1, 0); y1 = Math.max(y1, 0); x2 = Math.min(x2, vw); y2 = Math.min(y2, vh);
    return x2 - x1 > 1 && y2 - y1 > 1 ? { l: x1, t: y1, r: x2, b: y2 } : null; };
  const plocha = (a) => Math.max(0, a.r - a.l) * Math.max(0, a.b - a.t);
  const prienik = (a, b) => plocha({ l: Math.max(a.l, b.l), t: Math.max(a.t, b.t), r: Math.min(a.r, b.r), b: Math.min(a.b, b.b) });
  const popis = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += "#" + el.id; const c = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 2); if (c.length) s += "." + c.join("."); const a = el.getAttribute("data-a"); if (a) s += "[" + a + "=" + (el.getAttribute("data-v") || "") + "]"; return s; };
  const cesta = (el) => { const p = []; for (let e = el; e && e !== sec && p.length < 3; e = e.parentElement) p.unshift(popis(e)); return p.join(" > "); };
  const zaokr = (r) => ({ l: Math.round(r.l), t: Math.round(r.t), r: Math.round(r.r), b: Math.round(r.b) });
  // posuvný kontajner (zámerný vodorovný posun) -> obsah mimo okna nie je chyba
  const vPosuvnom = (el) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 2) return true; } return false; };
  const texty = [], orezane = [];
  const tw = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    const txt = n.textContent.replace(/\s+/g, " ").trim(); if (!txt) continue;
    const el = n.parentElement; if (!el || el.closest(DEKOR) || !viditelny(el)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r0 of rg.getClientRects()) {
      if (r0.width < 2 || r0.height < 2) continue;
      if (r0.bottom < 0 || r0.top > vh || r0.right < 0 || r0.left > vw) continue;
      const surovy = { l: r0.left, t: r0.top, r: r0.right, b: r0.bottom };
      const c = orez(el, surovy);
      if (!c) continue;
      const vnutri = { l: Math.max(surovy.l, 0), t: Math.max(surovy.t, 0), r: Math.min(surovy.r, vw), b: Math.min(surovy.b, vh) };
      if (plocha(vnutri) - plocha(c) > 0.25 * plocha(vnutri) && plocha(vnutri) > 40 && !vPosuvnom(el)) orezane.push({ el: cesta(el), text: txt.slice(0, 50), rect: zaokr(surovy), viditelne: zaokr(c) });
      texty.push({ el, rect: c, text: txt.slice(0, 50) });
    }
  }
  const OBJ = "img,svg,button,a.btn,.btn,input,select,[data-a],.kn-tv__mt,.kn-tv__lt";
  const objekty = [];
  for (const el of sec.querySelectorAll(OBJ)) {
    if (el.closest(DEKOR) || !viditelny(el)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
    const c = orez(el, { l: r.left, t: r.top, r: r.right, b: r.bottom }); if (!c) continue;
    if ((c.r - c.l) > 140 && (c.b - c.t) > 140) continue;
    objekty.push({ el, rect: c });
  }
  const nalezy = [];
  const rodina = (a, b) => a === b || a.contains(b) || b.contains(a);
  for (let i = 0; i < texty.length; i++) for (let j = i + 1; j < texty.length; j++) {
    const a = texty[i], b = texty[j]; if (rodina(a.el, b.el)) continue;
    const p = prienik(a.rect, b.rect); if (p < 12) continue;
    if ((a.el.closest("[aria-hidden=true]") && nadFotkou(a.el)) || (b.el.closest("[aria-hidden=true]") && nadFotkou(b.el))) continue;
    if (p > 0.15 * Math.min(plocha(a.rect), plocha(b.rect))) nalezy.push({ typ: "text-text", a: cesta(a.el) + " „" + a.text + "“", b: cesta(b.el) + " „" + b.text + "“", rect: zaokr(a.rect), px: Math.round(p) });
  }
  for (const t of texty) for (const ob of objekty) {
    if (rodina(t.el, ob.el)) continue;
    const p = prienik(t.rect, ob.rect); if (p < 12) continue;
    if (jeFotka(ob.el) && (nadFotkou(t.el) || nadFotkou(ob.el))) continue;
    if (p > 0.12 * Math.min(plocha(t.rect), plocha(ob.rect))) nalezy.push({ typ: "text-objekt", a: cesta(t.el) + " „" + t.text + "“", b: cesta(ob.el), rect: zaokr(t.rect), px: Math.round(p) });
  }
  for (let i = 0; i < objekty.length; i++) for (let j = i + 1; j < objekty.length; j++) {
    const a = objekty[i], b = objekty[j]; if (rodina(a.el, b.el)) continue;
    const p = prienik(a.rect, b.rect); if (p < 16) continue;
    if ((jeFotka(a.el) || jeFotka(b.el)) && (nadFotkou(a.el) || nadFotkou(b.el))) continue;
    if (p > 0.15 * Math.min(plocha(a.rect), plocha(b.rect))) nalezy.push({ typ: "objekt-objekt", a: cesta(a.el), b: cesta(b.el), rect: zaokr(a.rect), px: Math.round(p) });
  }
  const pretecenie = [], videne = new Set();
  for (const t of texty) {
    const el = t.el; if (videne.has(el)) continue;
    const cs = getComputedStyle(el); if (cs.display === "inline") continue;
    const er = el.getBoundingClientRect(); const rg = document.createRange();
    for (const c of el.childNodes) { if (c.nodeType !== 3 || !c.textContent.trim()) continue; rg.selectNodeContents(c);
      const tr = rg.getBoundingClientRect();
      const von = Math.max(0, er.left - tr.left, tr.right - er.right);
      if (von > 2) { videne.add(el); pretecenie.push({ el: cesta(el), text: t.text.slice(0, 40), box: Math.round(er.width), text_px: Math.round(tr.width), von: Math.round(von) }); break; } }
  }
  // prvky mimo okna (vodorovne), mimo zámerne posuvných pásov
  const mimo = [];
  for (const el of sec.querySelectorAll("*")) {
    if (mimo.length >= 12) break;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > vh) continue;
    if ((r.right > vw + 1 || r.left < -1) && viditelny(el) && !vPosuvnom(el)) {
      let orezany = false; for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== "visible") { const p = e.getBoundingClientRect(); if (p.right <= vw + 1 && p.left >= -1) { orezany = true; break; } } }
      if (!orezany) mimo.push({ el: cesta(el), l: Math.round(r.left), r: Math.round(r.right) });
    }
  }
  // malé dotykové ciele
  const male = [];
  if (dotyk) for (const el of sec.querySelectorAll("[data-a],button,a[href],select,input:not([type=hidden]),label[for]")) {
    if (!viditelny(el)) continue;
    if (el.tagName === "A" && getComputedStyle(el).display === "inline" && el.parentElement && (el.parentElement.textContent || "").trim().length > (el.textContent || "").trim().length + 3) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > vh) continue;
    if (r.width < 40 || r.height < 36) male.push({ el: cesta(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 30) });
  }
  return { texty: texty.length, nalezy, orezane, pretecenie: pretecenie.slice(0, 20), mimo, male: male.slice(0, 30),
    vodorovne: document.documentElement.scrollWidth > vw + 1 ? document.documentElement.scrollWidth : 0 };
})`;
