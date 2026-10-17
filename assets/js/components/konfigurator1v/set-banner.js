// Banner setu „Fotka cez celú šírku“ (návrh C, Michal schválil 17. 10. 2026) — od 17. 10. 2026 večer LEN v skrytom
// medzikroku ponuky setu (komplet-ponuka.js) na sólo rohožiach do kufra Classic 619/622/625, Premium 628/631/634 a na
// boxe 616. Michal: „toto má byť v medzikroku, nie ďalší iný banner“ -> samostatný banner pod cenou zrušený, jeho vzhľad
// je telom karty „Prosíte si aj autokoberce pod sedadlá?“ a zelené tlačidlo = „Áno, chcem set s autokobercami“.
// Nie je to modul ctx: stavia ho komplet-ponuka.js s číslami zo živých stránok (ceny-ine.js) — tu nič natvrdo.
// Texty: typy/kufor-classic.js, typy/kufor-premium.js, typy/boxy.js (komplet.banner). CSS: assets/css/_lcd1v-kufor.scss.
//
// Cena v sete NIE JE „+ X €“ (Michal 17. 10. 2026: vyzerá ako príplatok k cene hore): „Rohož do kufra Premium len za
// 239 €“ + „keď ju kúpite spolu s autokobercami pod sedadlá“ + „Samostatne <s>340 €</s>“ + „Ušetríte 101 €“.
// V DOM ide veta celá za sebou (nadpis, cena, podmienka), „Samostatne / Ušetríte“ až za ňou.
//
// Stuha „Zľava −30 %“ cez pravý horný roh (Michal 17. 10. 2026: „stále je to ako doplnok — chcem, aby tam svietila taká
// stuha, že zľava“): percento = round((samostatne − v sete) / samostatne × 100) zo živých čísel volajúceho
// (percentoZlavy), bez čísla stuha nie je. V medzikroku sú čísla pre zvolený box (veľkosť, počet), nie „až“.
// „Samostatne <s>340 €</s>“ a „Ušetríte 101 €“ sú dve väčšie bunky POD cenou v tmavej ploche; malá fotka produktu je
// vľavo pod štítkom „Autokoberce pod sedadlá“ (telefón) / vpravo dole nad tlačidlom (PC), pravý horný roh patrí stuhe.
//
// Fotky (reálne, tie isté ako v návrhu C):
//  - pozadie = autokoberce Diamond Line béžové (galéria 598, „diamond-bezove-4“), zmenšená kópia pod novým menom
//    assets/img/1v/set-banner-autokoberce-480.jpg (33 kB) a -800.jpg (70 kB), srcset, lenivo (karta je skrytá -> stiahne
//    sa, až keď sa ukáže);
//  - malá fotka = hlavná fotka produktu (og:image = tá istá adresa ako galéria, už je načítaná) / box (boxprodukt-pocet-N
//    z kroku Počet). Bez adresy sa malá fotka vynechá.
// Prvky bez name, nič sa neodosiela; tlačidlo je zelené (kam chceme zákazníka) a akciu mu dá volajúci.

/** Fotka pozadia: [súbor v assets/img/1v/, šírka v px] — nové mená, existujúce súbory sa neprepisujú. */
export const FOTKA = [["set-banner-autokoberce-480.jpg", 480], ["set-banner-autokoberce-800.jpg", 800]];

/** Percento zľavy setu oproti samostatnej cene (celé číslo, 340 -> 239 = 30), inak null (žiadne vymyslené číslo). */
export function percentoZlavy(samostatne, vSete) {
  if (!(samostatne > 0) || !(vSete > 0) || !(samostatne > vSete)) return null;
  const p = Math.round(((samostatne - vSete) / samostatne) * 100);
  return p > 0 ? p : null;
}

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
 * @param {{ ey: string, h: string, kd: string, sam?: string, us?: string, stuha?: string, pip?: string, tag?: string,
 *           tl: string }} T texty (tl = text zeleného tlačidla)
 * @param {{ cena: string, samostatne?: string|null, usetrite?: string|null, zlava?: number|null, pip?: string|null,
 *           tlTrieda?: string, obrazok: (meno: string) => string }} d  zlava = percentoZlavy(samostatne, v sete)
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

  // stuha cez pravý horný roh: „Zľava −30 %“ (čítačka ju prečíta ako prvú; obrys banneru ju oreže, nič nepreteká)
  if (T.stuha && d.zlava > 0) {
    const st = el("div", "lcd1v-bs__stuha");
    st.appendChild(el("span", null, T.stuha +" \u2212" + d.zlava + "\u00a0%")); // „−“ (mínus), pevná medzera pred %
    b.appendChild(st);
  }

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
    if (d.usetrite) {
      const u = el("span", "lcd1v-bs__u", (T.us || "") + " ");
      u.appendChild(el("b", null, d.usetrite));
      pridaj(sb, u);
    }
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
    // posledné dve slová spolu (pevná medzera): na úzkom telefóne sa štítok zalomí „Autokoberce / pod sedadlá“
    if (T.tag) pridaj(side, el("span", "lcd1v-bs__tag", T.tag.replace(/ (\S+)$/, "\u00a0$1")));
    pridaj(vnutro, side);
  }

  const tl = el("button", "lcd1v-bs__tl" + (d.tlTrieda ? " " + d.tlTrieda : ""), T.tl);
  tl.type = "button";
  pridaj(vnutro, tl);
  b.appendChild(vnutro);
  return b;
}
