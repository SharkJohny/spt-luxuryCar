// Spoločná kontrola banneru setu (set-banner.js) pre scenáre kufor-vzhlad (scenare-kufor.mjs) a box-start
// (scenare-boxy.mjs): stuha „Zľava −X %“ cez pravý horný roh (Michal 17. 10. 2026) a väčšie bunky
// „Samostatne <s>…</s>“ / „Ušetríte …“ POD cenou.
//
// stavStuhy(sel) = výraz pre t.ev (beží v stránke): text stuhy, či je v rohu banneru, či jej text nie je orezaný,
// ktoré prvky banneru stuha prekrýva (presne: otočený obdĺžnik pásky proti obdĺžnikom prvkov — oddeľujúce osi),
// veľkosti písma buniek, poloha buniek pod cenou, vodorovný posun stránky.
// overStuhu(j, G, ocak) = kontroly v teste; percento počíta volajúci zo živých čísel (percentoZlavy nižšie).

/** Percento zľavy setu ako v set-banner.js (nezávislá kópia vzorca, test ho nepreberá z kódu webu). */
export const percentoZlavy = (samostatne, vSete) => Math.round(((samostatne - vSete) / samostatne) * 100);

/** Prvky banneru, ktoré stuha nesmie prekryť (aj tlačidlo a cena). */
const PRVKY = [".lcd1v-bs__ey", ".lcd1v-bs__h", ".lcd1v-bs__c", ".lcd1v-bs__kd", ".lcd1v-bs__s", ".lcd1v-bs__u", ".lcd1v-bs__tag",
  ".lcd1v-bs__pip img", ".lcd1v-bs__pip i", ".lcd1v-bs__plus", "a.lcd1v-bs__tl"];

export function stavStuhy(sel) {
  return `(function () {
    var b = document.querySelector(${JSON.stringify(sel)});
    if (!b) return { chyba: "banner ${sel} chýba" };
    function tx(e) { return e ? e.textContent.replace(/\\s+/g, " ").trim() : null; }
    var st = b.querySelector(":scope > .lcd1v-bs__stuha"), sp = st && st.querySelector(":scope > span");
    var rb = b.getBoundingClientRect();
    var c0 = b.querySelector(".lcd1v-bs__c"), sb = b.querySelector(".lcd1v-bs__sb"), ss = b.querySelector(".lcd1v-bs__s s"), ub = b.querySelector(".lcd1v-bs__u b");
    var out = {
      stuha: tx(sp), kolizie: [], vRohu: false, textCely: false, px: 0, cervena: false,
      sPx: ss ? parseFloat(getComputedStyle(ss).fontSize) : 0, uPx: ub ? parseFloat(getComputedStyle(ub).fontSize) : 0,
      bunkyPodCenou: !!(c0 && sb && sb.getBoundingClientRect().top >= c0.getBoundingClientRect().bottom - 1),
      posunStranky: document.documentElement.scrollWidth > innerWidth + 1, sirka: Math.round(rb.width)
    };
    if (!sp) return out;
    var rs = st.getBoundingClientRect(), cs = getComputedStyle(sp);
    out.vRohu = Math.abs(rs.right - rb.right) < 2 && Math.abs(rs.top - rb.top) < 2 && rs.width > 40;
    out.px = parseFloat(cs.fontSize);
    out.cervena = /rgb\\(2[0-3]\\d, \\d{1,2}, \\d{1,2}\\)/.test(cs.backgroundImage);
    // otočená páska: stred = stred obalu otočeného prvku, rozmery bez otočenia (offsetWidth/Height), uhol z matice
    var m = new DOMMatrixReadOnly(cs.transform), u = Math.atan2(m.b, m.a), co = Math.cos(u), si = Math.sin(u);
    var r = sp.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
    function bod(x, y) { return [cx + x * co - y * si, cy + x * si + y * co]; }
    var w = sp.offsetWidth / 2, h = sp.offsetHeight / 2;
    var paska = [bod(-w, -h), bod(w, -h), bod(w, h), bod(-w, h)];
    var osi = [[1, 0], [0, 1], [co, si], [-si, co]];
    function pr(ps, a) { var v = ps.map(function (p) { return p[0] * a[0] + p[1] * a[1]; }); return [Math.min.apply(null, v), Math.max.apply(null, v)]; }
    function prekryva(q) {
      var rp = [[q.left, q.top], [q.right, q.top], [q.right, q.bottom], [q.left, q.bottom]];
      return osi.every(function (a) { var x = pr(paska, a), y = pr(rp, a); return x[0] < y[1] - 0.5 && y[0] < x[1] - 0.5; });
    }
    ${JSON.stringify(PRVKY)}.forEach(function (q) {
      Array.prototype.forEach.call(b.querySelectorAll(q), function (e) {
        var g = e.getBoundingClientRect();
        if (g.width >= 1 && g.height >= 1 && prekryva(g)) out.kolizie.push(q + " [" + Math.round(g.left - rb.left) + "," + Math.round(g.top - rb.top) + " " + Math.round(g.width) + "×" + Math.round(g.height) + "]");
      });
    });
    // text stuhy celý viditeľný: rohy obdĺžnika textu (šírka z canvas + rozostup písmen, výška ~ veľkosť písma) v obale
    var k = document.createElement("canvas").getContext("2d");
    k.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    var t = (sp.textContent || "").toUpperCase(), ls = parseFloat(cs.letterSpacing) || 0;
    var tw = (k.measureText(t).width + ls * t.length) / 2, th = out.px * 0.5;
    out.textCely = [bod(-tw, -th), bod(tw, -th), bod(tw, th), bod(-tw, th)].every(function (p) {
      return p[0] >= rs.left + 1 && p[0] <= rs.right - 1 && p[1] >= rs.top + 1 && p[1] <= rs.bottom - 1; });
    out.textSirka = Math.round(tw * 2);
    return out;
  })()`;
}

/** Kontroly stuhy a buniek; ocak = { percento, popis }. */
export function overStuhu(j, G, ocak) {
  const o = "Zľava −" + ocak.percento + " %";
  j.over(!G.chyba, G.chyba);
  j.over(G.stuha === o, "stuha „" + G.stuha + "“ ≠ „" + o + "“ (" + ocak.popis + ")");
  j.over(G.vRohu && G.cervena, "stuha nie je červená páska v pravom hornom rohu banneru (roh " + G.vRohu + ", červená " + G.cervena + ")");
  j.over(G.px >= 14, "písmo stuhy " + G.px + " px < 14");
  j.over(G.textCely, "text stuhy (" + G.textSirka + " px) je v rohu orezaný");
  j.over(!G.kolizie.length, "stuha prekrýva: " + G.kolizie.join(", "));
  j.over(G.bunkyPodCenou, "„Samostatne / Ušetríte“ nie sú pod cenou v sete");
  j.over(G.sPx >= 20 && G.uPx >= 20, "čísla „Samostatne / Ušetríte“ majú byť ≥ 20 px: " + G.sPx + " / " + G.uPx);
  j.over(!G.posunStranky, "stránka sa posúva do strany (banner " + G.sirka + " px)");
}
