/**
 * Filtrovanie nášiviek podľa toho, čo je povolené v Shoptete.
 * Michal 2026-09-01: v CZ admine povypínal väčšinu nášiviek, konfigurátor
 * ich napriek tomu ďalej ponúkal.
 */
import { JSDOM } from "jsdom";
import { povoleneNasivkyVsade, filtrujNasivky, kodNasivky } from "./pricing.js";

const ZOZNAM = ["H1","H2","H3","H19","H21","N33"].map((code) => ({ code }));

/* CZ stav zo screenshotu: povolené len Bez nášivky, H19 a H21. */
const CZ = `
  <select data-parameter-id="403" data-parameter-name="Druh nášivky – boky">
    <option value=""></option>
    <option value="1474">Bez nášivky +0 Kč</option>
    <option value="1560">Nášivka H19 +0 Kč</option>
    <option value="1563">Nášivka H21 +0 Kč</option>
  </select>
  <select data-parameter-id="409" data-parameter-name="Druh nášivky – stred">
    <option value=""></option>
    <option value="1594">Bez nášivky +0 Kč</option>
    <option value="1597">Nášivka H1 +0 Kč</option>
  </select>
  <select data-parameter-id="406" data-parameter-name="Farba nášiviek na boky">
    <option value=""></option>
    <option value="1558">2999 – Čierna +0 Kč</option>
  </select>
  <select data-parameter-id="349" data-parameter-name="Rozloženie nášiviek">
    <option value=""></option>
    <option value="1378">Šofér + spolujazdec +59 Kč</option>
  </select>`;

/* SK stav: iné názvy parametrov, všetko zapnuté. */
const SK = `
  <select data-parameter-id="403" data-parameter-name="Typ nášiviek na boky">
    <option value=""></option>
    <option value="1474">Bez nášivky +€0</option>
    <option value="1477">Nášivka H1 +€0</option>
    <option value="1480">Nášivka H2 +€0</option>
    <option value="1483">Nášivka H3 +€0</option>
    <option value="1600">Nášivka H19 +€0</option>
    <option value="1603">Nášivka H21 +€0</option>
    <option value="1606">Nášivka N33 +€0</option>
  </select>
  <select data-parameter-id="397" data-parameter-name="Typ nášivky na tapacír">
    <option value=""></option>
    <option value="1711">Bez nášivky +€0</option>
    <option value="1714">Nášivka H2 +€0</option>
  </select>`;

let zlyhalo = 0;
function ok(popis, podmienka) {
  console.log(`${podmienka ? "✓" : "✗"} ${popis}`);
  if (!podmienka) zlyhalo++;
}

// --- kód z textu ---
ok("kód z textu option-u", kodNasivky("Nášivka H19 +0 Kč") === "H19");
ok("Bez nasivky nie je kod", kodNasivky("Bez nášivky +0 Kč") === null);

// --- CZ: väčšina vypnutá ---
{
  const doc = new JSDOM(`<body>${CZ}</body>`).window.document;
  const p = povoleneNasivkyVsade(doc);
  const boky = filtrujNasivky(ZOZNAM, p.boky).map((n) => n.code);
  const stred = filtrujNasivky(ZOZNAM, p.stred).map((n) => n.code);
  ok("CZ boky = len H19 a H21", JSON.stringify(boky) === JSON.stringify(["H19", "H21"]));
  ok("CZ stred = len H1", JSON.stringify(stred) === JSON.stringify(["H1"]));
  ok("farba nite sa nepletie do druhu", !p.boky.has("2999"));
  ok("tapacír nemá parameter → nefiltruje sa", p.dvere === null);
}

// --- SK: iné názvy, všetko zapnuté ---
{
  const doc = new JSDOM(`<body>${SK}</body>`).window.document;
  const p = povoleneNasivkyVsade(doc);
  ok("SK boky = celý zoznam", filtrujNasivky(ZOZNAM, p.boky).length === ZOZNAM.length);
  ok("SK tapacír = len H2", filtrujNasivky(ZOZNAM, p.dvere).map((n) => n.code).join() === "H2");
  ok("SK stred nemá parameter → nefiltruje sa", p.stred === null);
}

// --- mimo Shoptetu (vývoj) ---
{
  const doc = new JSDOM("<body></body>").window.document;
  const p = povoleneNasivkyVsade(doc);
  ok("bez parametrov sa nefiltruje", filtrujNasivky(ZOZNAM, p.boky).length === ZOZNAM.length);
}

// --- admin vypol úplne všetky ---
{
  const doc = new JSDOM(`<body>
    <select data-parameter-id="403" data-parameter-name="Druh nášivky – boky">
      <option value=""></option><option value="1474">Bez nášivky +0 Kč</option>
    </select></body>`).window.document;
  const p = povoleneNasivkyVsade(doc);
  ok("všetko vypnuté → prázdna ponuka", filtrujNasivky(ZOZNAM, p.boky).length === 0);
}

console.log(zlyhalo ? `\n${zlyhalo} test(ov) zlyhalo` : "\nvšetko OK");
process.exit(zlyhalo ? 1 : 0);
