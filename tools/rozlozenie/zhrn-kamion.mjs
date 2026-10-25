// Zhrnutie vysledok.json z rozlozenie-kamion.mjs: unikátne nálezy (typ + prvok + text) a na ktorých rozmeroch / stavoch.
//   node zhrn-kamion.mjs <out> [--detail]
import { readFileSync } from "node:fs";
import { join } from "node:path";
const [out] = process.argv.slice(2);
const DETAIL = process.argv.includes("--detail");
const V = JSON.parse(readFileSync(join(out, "vysledok.json"), "utf8"));
const mapa = new Map();
const pridaj = (kluc, rozmer, stav, snimka, ukazka) => {
  if (!mapa.has(kluc)) mapa.set(kluc, { rozmery: new Set(), stavy: new Set(), snimky: [], ukazka });
  const m = mapa.get(kluc); m.rozmery.add(rozmer); m.stavy.add(stav); if (snimka && m.snimky.length < 4) m.snimky.push(snimka);
};
const cist = (s) => String(s || "").replace(/\d+/g, "#");
for (const r of V.rozmery) {
  if (r.chyby.length) for (const c of r.chyby) pridaj("CHYBA BEHU " + c, r.rozmer, "-", null, c);
  if (r.jsChyby && r.jsChyby.length) for (const c of r.jsChyby) pridaj("JS " + c, r.rozmer, "-", null, c);
  for (const z of r.stavy) for (const b of z.body) {
    const an = [["konf", b.konf], ["lista", b.lista], ...(b.obsah || []).map((x) => ["obsah", x])];
    for (const [kde, x] of an) {
      if (!x) continue;
      for (const n of x.nalezy) pridaj(`${kde} ${n.typ}: ${n.a} ⟂ ${n.b}`, r.rozmer, z.stav, b.snimka, n.px + " px");
      for (const n of x.orezane) pridaj(`${kde} orezané: ${n.el} „${n.text}“`, r.rozmer, z.stav, b.snimka, JSON.stringify(n.viditelne));
      for (const n of x.pretecenie) pridaj(`${kde} pretečenie: ${n.el} „${n.text}“`, r.rozmer, z.stav, b.snimka, `box ${n.box}, text ${n.text_px}, von ${n.von}`);
      for (const n of x.mimo) pridaj(`${kde} mimo okna: ${n.el}`, r.rozmer, z.stav, b.snimka, `${n.l}–${n.r}`);
      if (x.vodorovne) pridaj(`${kde} VODOROVNÝ POSUVNÍK stránky`, r.rozmer, z.stav, b.snimka, x.vodorovne);
      for (const n of x.male || []) pridaj(`${kde} malý dotykový cieľ: ${cist(n.el)} „${n.text}“`, r.rozmer, z.stav, b.snimka, `${n.w}×${n.h}`);
    }
    if (b.zakryte) for (const n of b.zakryte.zakryte) pridaj(`zakryté tlačidlo ${n.tlacidlo} <- ${n.zakryva}`, r.rozmer, z.stav, b.snimka, "y " + n.y);
    const p = b.pismo;
    if (p && p.zle) {
      for (const n of p.zle) pridaj(`písmo${n.z ? " (spoločné)" : ""}: ${n.el} ${n.fs}px < ${n.min} (${n.r})`, r.rozmer, z.stav, b.snimka, n.t);
      for (const n of p.zlom || []) pridaj(`slovo zalomené: ${n.el} „${n.w}“`, r.rozmer, z.stav, b.snimka, "");
      for (const n of p.pretek || []) pridaj(`písmo pretek: ${n.el} „${n.w || n.t}“`, r.rozmer, z.stav, b.snimka, "");
      for (const n of p.orez || []) pridaj(`písmo orez: ${n.el} „${n.w || n.t}“`, r.rozmer, z.stav, b.snimka, "");
    }
  }
}
const vsetky = V.rozmery.length;
const riadky = [...mapa.entries()].sort((x, y) => y[1].rozmery.size - x[1].rozmery.size);
console.log(`Rozmerov: ${vsetky}, unikátnych nálezov: ${riadky.length}`);
for (const [kluc, m] of riadky) {
  const roz = m.rozmery.size === vsetky ? "VŠETKY" : [...m.rozmery].join(" ");
  console.log(`\n• ${kluc.slice(0, 260)}\n   rozmery (${m.rozmery.size}): ${roz}\n   stavy: ${[...m.stavy].slice(0, 8).join(" ")}${m.stavy.size > 8 ? " …" : ""} | ${m.ukazka ? String(m.ukazka).slice(0, 80) : ""}${DETAIL ? "\n   snímky: " + m.snimky.join(" ") : ""}`);
}
