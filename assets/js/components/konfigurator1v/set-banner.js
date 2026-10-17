// Banner setu „Fotka cez celú šírku“ (návrh C, Michal schválil 17. 10. 2026) pod rámikom ceny na sólo rohožiach do kufra
// Classic 619/622/625, Premium 628/631/634 a na boxe 616 — nahrádza pás setu na tom istom mieste. Nie je to modul ctx:
// stavajú ho kufor-produkt.js a boxy-produkt.js, ktoré dosadia čísla zo živých stránok (ceny-ine.js) — tu nič natvrdo.
// Texty: typy/kufor-classic.js a typy/kufor-premium.js (kuforProdukt.set), typy/boxy.js (boxyProdukt.set).
// CSS: assets/css/_lcd1v-kufor.scss (spoločné pre rohože aj box; poradie boxu v _lcd1v-boxy.scss).
//
// Cena v sete NIE JE „+ X €“ (Michal 17. 10. 2026: vyzerá ako príplatok k cene hore): „Rohož do kufra Premium len za
// 239 €“ + „keď ju kúpite spolu s autokobercami pod sedadlá“ + „Samostatne <s>340 €</s>“ + „Ušetríte 101 €“.
// V DOM ide veta celá za sebou (nadpis, cena, podmienka), „Samostatne / Ušetríte“ až za ňou — na obrazovke je vedľa ceny (CSS grid).
//
// Fotky (reálne, tie isté ako v návrhu C):
//  - pozadie = autokoberce Diamond Line béžové (galéria 598, „diamond-bezove-4“), zmenšená kópia pod novým menom
//    assets/img/1v/set-banner-autokoberce-480.jpg (33 kB) a -800.jpg (70 kB), srcset, lenivo;
//  - malá fotka vpravo hore = hlavná fotka produktu (og:image = tá istá adresa ako galéria, už je načítaná) / box
//    (boxprodukt-pocet-1.jpg z kroku Počet). Bez adresy sa malá fotka vynechá.
// Prvky bez name, nič sa neodosiela; odkaz je zelené tlačidlo (kam chceme zákazníka).

/** Fotka pozadia: [súbor v assets/img/1v/, šírka v px] — nové mená, existujúce súbory sa neprepisujú. */
export const FOTKA = [["set-banner-autokoberce-480.jpg", 480], ["set-banner-autokoberce-800.jpg", 800]];

/** Vloží prvok; medzi súrodencov dá medzeru (textContent a čítačka „… len za 239 € keď ju …“, nie „za239 €keď“;
 *  v grid/flex/blokových obaloch banneru sa medzera nevykreslí). */
function pridaj(rodic, prvok) {
  if (rodic.firstChild) rodic.appendChild(document.createTextNode(" "));
  rodic.appendChild(prvok);
}

function el(tag, trieda, text) {
  const e = document.createElement(tag);
  if (trieda) e.className = trieda;
  if (text != null) e.textContent = text;
  return e;
}

/** Lenivý obrázok; srcset/sizes sa nastavia PRED src (prehliadač vyberie veľkosť hneď pri prvej požiadavke). */
function obr(src, trieda, srcset, sizes) {
  const i = el("img", trieda);
  i.alt = ""; // ozdoba: čo je na fotkách, hovoria štítky (a tie sú pre čítačku skryté rovnako ako fotky)
  i.loading = "lazy";
  i.decoding = "async";
  if (srcset) {
    i.srcset = srcset;
    i.sizes = sizes;
  }
  i.src = src;
  return i;
}

/**
 * Banner setu (div.lcd1v-bs). Čísla prídu už ako text („239 €“), chýbajúce sa vynechajú (žiadne vymyslené čísla).
 * @param {{ ey: string, h: string, kd: string, sam?: string, us?: string, pip?: string, tag?: string, odkaz: string }} T texty
 * @param {{ cena: string, samostatne?: string|null, usetrite?: string|null, href: string, pip?: string|null,
 *           obrazok: (meno: string) => string }} d
 * @returns {HTMLDivElement}
 */
export function postavBanner(T, d) {
  const b = el("div", "lcd1v-bs");
  // pozadie: srcset podľa šírky banneru (telefón celá šírka, PC ~72 % stĺpca ≈ 400 px)
  const bg = obr(d.obrazok(FOTKA[0][0]), "lcd1v-bs__bg", FOTKA.map((f) => d.obrazok(f[0]) + " " + f[1] + "w").join(", "), "(min-width: 768px) 400px, 100vw");
  bg.width = FOTKA[FOTKA.length - 1][1];
  bg.height = FOTKA[FOTKA.length - 1][1];
  bg.setAttribute("aria-hidden", "true");
  b.appendChild(bg);

  const vnutro = el("div", "lcd1v-bs__in");
  const txt = el("div", "lcd1v-bs__txt");
  const ey = el("span", "lcd1v-bs__ey");
  const hv = el("span", null, "★ ");
  hv.setAttribute("aria-hidden", "true");
  ey.appendChild(hv);
  ey.appendChild(document.createTextNode(T.ey));
  pridaj(txt, ey);
  pridaj(txt, el("span", "lcd1v-bs__h", T.h));
  const rad = el("span", "lcd1v-bs__row");
  pridaj(rad, el("span", "lcd1v-bs__c", d.cena));
  pridaj(rad, el("span", "lcd1v-bs__kd", T.kd));
  if (d.samostatne || d.usetrite) {
    const sb = el("span", "lcd1v-bs__sb");
    if (d.samostatne) {
      const s = el("span", "lcd1v-bs__s", (T.sam || "") + " ");
      s.appendChild(el("s", null, d.samostatne));
      pridaj(sb, s);
    }
    if (d.usetrite) pridaj(sb, el("span", "lcd1v-bs__u", (T.us || "") + " " + d.usetrite));
    pridaj(rad, sb);
  }
  pridaj(txt, rad);
  pridaj(vnutro, txt);

  // štítky na fotkách (len obraz: veta nad tlačidlom hovorí to isté) — malá fotka produktu + „Autokoberce pod sedadlá“
  if (d.pip || T.tag) {
    const side = el("div", "lcd1v-bs__side");
    side.setAttribute("aria-hidden", "true");
    if (d.pip) {
      const pip = el("span", "lcd1v-bs__pip");
      pip.appendChild(obr(d.pip, null));
      if (T.pip) pip.appendChild(el("i", null, T.pip));
      pip.appendChild(el("span", "lcd1v-bs__plus", "+"));
      pridaj(side, pip);
    }
    if (T.tag) pridaj(side, el("span", "lcd1v-bs__tag", T.tag));
    pridaj(vnutro, side);
  }

  const a = el("a", "lcd1v-bs__tl", T.odkaz);
  a.href = d.href;
  pridaj(vnutro, a);
  b.appendChild(vnutro);
  return b;
}
