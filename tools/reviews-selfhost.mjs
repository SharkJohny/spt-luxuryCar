import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const DATA = 'assets/js/reviews-data.js', OUT = 'assets/img/reviews';
const CDN = 'https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/reviews/';

const raw = await readFile(DATA, 'utf8');
const idx = raw.indexOf('window.LCD_REVIEWS');
const m = raw.slice(idx).match(/window\.LCD_REVIEWS\s*=\s*([\s\S]*?);\s*$/);
if (!m) { console.error('NEMÔŽEM PARSOVAŤ reviews-data.js'); process.exit(1); }
const header = raw.slice(0, idx);
const data = JSON.parse(m[1]);

// merge čerstvých Google URL — match podľa autora (autori v dátach sú unikátni,
// fresh.text je prázdny, preto text-match nepoužívame). Dedup fresh + preferuj záznam s fotkami.
let fresh = [];
try { fresh = JSON.parse(await readFile('tools/google-reviews-fresh.json', 'utf8')); } catch {}
// od 29. 10. 2026 je fresh objekt { place, reviews } (nový scrape-google-reviews.mjs); starý formát = pole
if (!Array.isArray(fresh)) fresh = (fresh && fresh.reviews) || [];
const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
// dedup fresh podľa autor + prvá fotka
const seen = new Set();
const freshU = [];
for (const r of fresh) { const k = norm(r.author) + '|' + (r.photos[0] || ''); if (seen.has(k)) continue; seen.add(k); freshU.push(r); }
let merged = 0, noMatch = [];
for (const r of data.reviews) {
  const cands = freshU.filter(x => norm(x.author) === norm(r.author));
  const f = cands.find(x => x.photos.length) || cands[0];
  if (f && f.photos.length) { r.photos = f.photos; merged++; }
  else if (r.photos && r.photos.length) noMatch.push(r.author); // mal fotky v dátach, fresh nenašiel
}
if (fresh.length) console.log(`fresh: ${fresh.length} → dedup ${freshU.length}; merge fotiek do ${merged} recenzií`);
if (noMatch.length) console.log(`!! bez fresh matchu (mali fotky v dátach): ${noMatch.join(', ')}`);

await mkdir(OUT, { recursive: true });
let okN = 0, deadN = 0;
const dead = [];
const map = new Map();
const jobs = [];
data.reviews.forEach(r => (r.photos || []).forEach((u, i) => jobs.push({ r, i, u })));
console.log(`spolu foto URL na stiahnutie: ${jobs.length}`);

async function dl(j) {
  const f = `r${j.r.id}-${j.i}.jpg`;
  try {
    const res = await fetch(j.u, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const ct = res.headers.get('content-type') || '';
    if (!/image\//.test(ct)) throw new Error('ct=' + ct);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) throw new Error('tiny ' + buf.length);
    await writeFile(path.join(OUT, f), buf);
    if (!map.has(j.r.id)) map.set(j.r.id, []);
    map.get(j.r.id).push(CDN + f);
    okN++;
  } catch (e) {
    deadN++;
    dead.push({ author: j.r.author, id: j.r.id, idx: j.i, reason: String(e.message || e), url: j.u.slice(0, 90) });
  }
}

for (let i = 0; i < jobs.length; i += 6) {
  await Promise.all(jobs.slice(i, i + 6).map(dl));
  process.stdout.write(`\r  ${Math.min(i + 6, jobs.length)}/${jobs.length} (ok ${okN}, dead ${deadN})`);
}
process.stdout.write('\n');

for (const r of data.reviews) r.photos = map.get(r.id) || [];
await writeFile(DATA, header + 'window.LCD_REVIEWS = ' + JSON.stringify(data, null, 2) + ';\n', 'utf8');
if (dead.length) await writeFile('tools/reviews-dead.json', JSON.stringify(dead, null, 2));
const reviewsWithPhotos = data.reviews.filter(r => r.photos.length).length;
console.log(`\nself-hostovaných fotiek: ${okN} | nedostupných: ${deadN}`);
console.log(`recenzií s aspoň 1 fotkou po self-hoste: ${reviewsWithPhotos}/${data.reviews.length}`);
