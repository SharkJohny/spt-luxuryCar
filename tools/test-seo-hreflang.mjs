// Jazykové odkazy SK ↔ CZ pre Google (assets/js/seo-hreflang.js).
//   node tools/test-seo-hreflang.mjs          pravidlá
//   node tools/test-seo-hreflang.mjs --zivy   navyše: každá adresa zo zoznamu odpovie 200 a sitemap nemá adresu mimo zoznamu
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { cestyStranky, VSETKY_PARY } = await import(pathToFileURL(join(ROOT, "assets/js/seo-hreflang.js")).href);

assert.deepEqual(cestyStranky("/", true), { sk: "/", cz: "/" });
assert.deepEqual(cestyStranky("/index.php", false), { sk: "/", cz: "/" });
assert.deepEqual(cestyStranky("/luxusne-autokoberce-kamiony/", true), { sk: "/luxusne-autokoberce-kamiony/", cz: "/luxusni-autokoberce-kamiony/" });
assert.deepEqual(cestyStranky("/luxusni-autokoberce-kamiony/", false), { sk: "/luxusne-autokoberce-kamiony/", cz: "/luxusni-autokoberce-kamiony/" });
assert.equal(cestyStranky("/luxusni-autokoberce-kamiony/", true), null, "CZ adresa na SK webe");
assert.equal(cestyStranky("/kosik/", true), null, "košík nemá jazykové odkazy");
assert.equal(cestyStranky("/blog/najnovsie-trendy-v-dizajne-luxusnych-aut/", true), null, "článok len na SK");
for (const c of [0, 1]) assert.equal(new Set(VSETKY_PARY.map((p) => p[c])).size, VSETKY_PARY.length, "duplicitná adresa v zozname");
// stránky kamiónov (konfigurator1v/kamion/stranky.js, vlny 1–3): každá s pevným modelom má pár SK = CZ, skrytá kópia nie;
// SK aj CZ majú tie isté adresy stránok kamiónov
const { KAMION_STRANKY } = await import(pathToFileURL(join(ROOT, "assets/js/components/konfigurator1v/kamion/stranky.js")).href);
const stranky = { 562035: [], 581408: [] };
for (const proj of [562035, 581408]) {
  for (const [c, z] of Object.entries(KAMION_STRANKY[proj])) {
    if (z.kamion) { stranky[proj].push(c); assert.deepEqual(cestyStranky(c, proj === 562035), { sk: c, cz: c }, "stránka kamióna bez páru: " + c); }
    else assert.equal(cestyStranky(c, proj === 562035), null, "skrytá kópia nesmie mať jazykový pár: " + c);
  }
}
assert.deepEqual(stranky[562035].slice().sort(), stranky[581408].slice().sort(), "stránky kamiónov SK a CZ sa líšia");
console.log(`Pravidlá OK (${VSETKY_PARY.length} párov, z toho ${stranky[562035].length} stránok kamiónov)`);

if (process.argv.includes("--zivy")) {
  const SK = "https://www.luxurycardesign.sk", CZ = "https://www.luxurycardesign.cz";
  // bez protějšku: staré články len na SK, poukážka len na CZ, demo značky CZ (čakajú na admin)
  const BEZ_PARU = /^\/blog\/(luxusne-autokoberce-pre-dokonalu-ochranu|luxusne-automobily-pre-rok-2023|najnovsie-trendy-v-dizajne-luxusnych-aut)\/$|^\/darkovy-poukaz\/$|^\/znacka\/(?!luxury-car-design\/)/;
  const stav = async (u) => (await fetch(u, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0" } })).status;
  let zle = 0;
  for (const [s, c] of VSETKY_PARY) {
    const [a, b] = await Promise.all([stav(SK + s), stav(CZ + c)]);
    if (a !== 200 || b !== 200) { zle++; console.log("ZLE", a, s, "|", b, c); }
  }
  for (const [web, st] of [[SK, 0], [CZ, 1]]) {
    const r = await fetch(web + "/sitemaps/sitemap0.xml.gz", { headers: { "user-agent": "Mozilla/5.0" } });
    const b = Buffer.from(await r.arrayBuffer());
    const xml = (b[0] === 0x1f ? gunzipSync(b) : b).toString("utf8");
    const cesty = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(web, ""));
    const znamy = new Set(VSETKY_PARY.map((p) => p[st]));
    for (const c of cesty) if (!znamy.has(c) && !BEZ_PARU.test(c)) { zle++; console.log("MIMO ZOZNAMU", web, c); }
  }
  console.log(zle ? `ZLE: ${zle}` : "Naživo OK: všetky adresy 200, sitemap bez neznámych adries");
  process.exit(zle ? 1 : 0);
}
