// Prázdny košík v štýle novej pokladne (Michal 2. 11. 2026: „Prázdny košík je stále rovnaký, není tu nič nové vymyslené.“).
// Pre všetkých zákazníkov (od 2. 11. 2026 22:39, opc/index.js PRAZDNY_PRE_VSETKYCH; predtým len s kódom OPC), len keď
// Shoptet vykreslil prázdny košík (.cart-inner.cart-empty). Vypínač: data.json "prazdny_kosik": false. Obsah: texty, odkazy a obrázky z hlavného menu webu (lcdHdr-markup.js — set so zľavou,
// konkrétne produkty, do kufra, kamióny, vzorkovník) a veta o 1000 modeloch z titulky (lcdHome-markup.js). Kontakt
// (telefón, e-mail, nadpis) sa prečíta z kontaktného boxu Shoptetu na tej istej stránke. Vyhľadávanie Shoptetu v bloku nie je
// (Michal 2. 11. 2026 23:40: „Áno, daj to odtiaľ preč.“). Pôvodný obsah Shoptetu ostáva skrytý v DOM; zrusPrazdny ho vráti.

const IMG = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/";
export const ID_PRAZDNY = "lcd-opc-prazdny";
/** Trieda na <html>, kým je nový prázdny košík na stránke (CSS skryje obsah Shoptetu okrem presunutého vyhľadávania). */
export const TRIEDA_PRAZDNY = "lcd-opc-prazdny";

// ✅ texty a odkazy = hlavné menu webu SK/CZ (assets/js/lcdHdr-markup.js), veta o modeloch = titulka (#konfNote)
export const PRAZDNY_TEXTY = {
  sk: {
    nadpis: "Váš košík je zatiaľ prázdny",
    uvod: "Vyberte si luxusné autokoberce na mieru. Šablóny máme pre viac než 1000 modelov osobných áut.",
    set: {
      k: "Vytvorte si vlastný set so zľavou",
      s: "Vyberte si rozloženie a farbu materiálu, budú ušité na mieru Vášho auta.",
      btn: "Vytvoriť vlastný set",
      href: "/luxusne-autokoberce-dragonskin-elite-diamond-line/",
      diely: [["set1.jpg", "Koberce pod sedadlá"], ["set2.jpg", "Rohož do kufra"], ["set3.jpg", "Box do kufra"]],
    },
    produktyNadpis: "Alebo si vyberte konkrétny produkt",
    produkty: [
      { n: "Jednovrstvové autokoberce", v: "Diamond · Stripe · Hexa", href: "/luxusne-autokoberce-dragonskin-diamond-line/", img: "m-jed.jpg" },
      { n: "Dvojvrstvové autokoberce", v: "Diamond · Stripe · Hexa", href: "/luxusne-autokoberce-dragonskin-elite-diamond-line/", img: "m-dvoj.jpg" },
      { n: "Autokoberce do kufra klasik", v: "Diamond · Stripe · Hexa", href: "/luxusny-koberced-do-kufra-dragonskin-klasik/", img: "m-k1.jpg" },
      { n: "Autokoberce do kufra premium", v: "Diamond · Stripe · Hexa", href: "/luxusny-koberced-do-kufra-dragonskin-premium/", img: "m-k2.jpg" },
      { n: "Boxy do kufra", v: "Diamond", href: "/luxusny-boxi-do-kufra/", img: "m-k3.jpg" },
      { n: "Kamióny a dodávky", v: "Na mieru aj pre pracovné auto", href: "/luxusne-autokoberce-kamiony/", img: "m-truck.jpg" },
    ],
    vz: { k: "Neviete, akú farbu?", s: "Pošleme Vám vzorky na adresu — farbu aj štruktúru si pozriete priamo vo svojom aute.", btn: "Objednať vzorky", href: "/vzorkovnik-dragonskin---objednavka-vzoriek/" },
    pomoc: "Potrebujete poradiť?",
    telefon: "Telefón",
    email: "E-mail",
  },
  cz: {
    nadpis: "Váš košík je zatím prázdný",
    uvod: "Vyberte si luxusní autokoberce na míru. Šablony máme pro více než 1000 modelů osobních aut.",
    set: {
      k: "Vytvořte si vlastní set se slevou",
      s: "Vyberte si rozložení a barvu materiálu, budou ušity na míru Vašeho auta.",
      btn: "Vytvořit vlastní set",
      href: "/luxusne-autokoberce-dragonskin-elite-diamond-line/",
      diely: [["set1.jpg", "Koberce pod sedadla"], ["set2.jpg", "Koberec do kufru"], ["set3.jpg", "Box do kufru"]],
    },
    produktyNadpis: "Nebo si vyberte konkrétní produkt",
    produkty: [
      { n: "Jednovrstvé autokoberce", v: "Diamond · Stripe · Hexa", href: "/luxusne-autokoberce-dragonskin-diamond-line/", img: "m-jed.jpg" },
      { n: "Dvouvrstvé autokoberce", v: "Diamond · Stripe · Hexa", href: "/luxusne-autokoberce-dragonskin-elite-diamond-line/", img: "m-dvoj.jpg" },
      { n: "Autokoberce do kufru klasik", v: "Diamond · Stripe · Hexa", href: "/luxusny-koberced-do-kufra-dragonskin-klasik/", img: "m-k1.jpg" },
      { n: "Autokoberce do kufru premium", v: "Diamond · Stripe · Hexa", href: "/luxusny-koberced-do-kufra-dragonskin-premium/", img: "m-k2.jpg" },
      { n: "Boxy do kufru", v: "Diamond", href: "/luxusny-boxi-do-kufra/", img: "m-k3.jpg" },
      { n: "Kamiony a dodávky", v: "Na míru i pro pracovní auto", href: "/luxusni-autokoberce-kamiony/", img: "m-truck.jpg" },
    ],
    vz: { k: "Nevíte, jakou barvu?", s: "Pošleme Vám vzorky na adresu — barvu i strukturu si prohlédnete přímo ve svém autě.", btn: "Objednat vzorky", href: "/vzorkovnik-dragonskin---objednavka-vzorku/" },
    pomoc: "Potřebujete pomoc?",
    telefon: "Telefon",
    email: "E-mail",
  },
};

const SVG = {
  kosik: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 8h15l-1.1 10.2a2 2 0 01-2 1.8H7.6a2 2 0 01-2-1.8z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.8 8V6.4a3.2 3.2 0 016.4 0V8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  tel: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 3.5h2.6l1.4 4-2 1.3a11 11 0 006.6 6.6l1.3-2 4 1.4v2.6a2 2 0 01-2.2 2A16.5 16.5 0 014.6 5.7a2 2 0 012-2.2z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.5" y="5.5" width="17" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4.5 7l7.5 6 7.5-6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dalej: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const cisty = (t) => String(t || "").replace(/\s+/g, " ").trim();

function el(doc, tag, attrs, deti) {
  const e = doc.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) return;
    if (k === "text") e.textContent = v;
    else if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else e.setAttribute(k, v === true ? "" : v);
  });
  (deti || []).forEach(function (d) { if (d) e.appendChild(typeof d === "string" ? doc.createTextNode(d) : d); });
  return e;
}
const obr = (doc, subor, w, h, trieda) => el(doc, "img", { class: trieda, src: IMG + subor, alt: "", width: String(w), height: String(h), loading: "lazy", decoding: "async" });

/** Prázdny košík Shoptetu na stránke? (Shoptet SK aj CZ: .cart-inner.cart-empty, bez tlačidla Pokračovať) */
export function jePrazdny(doc) {
  return !!doc.querySelector(".cart-inner.cart-empty") && !doc.getElementById("continue-order-button");
}

/** Kontakt z kontaktného boxu Shoptetu na stránke prázdneho košíka -> { nadpis, tel, telHref, mail, mailHref } (čo chýba = null). */
export function kontaktShoptetu(doc) {
  const box = doc.querySelector(".cart-empty .contact-box");
  const t = box && box.querySelector('a[href^="tel:"]');
  const m = box && box.querySelector('a[href^="mailto:"]');
  const h = doc.querySelector(".cart-empty .cart-row h2, .cart-empty .cart-row .h4");
  return {
    nadpis: h ? cisty(h.textContent) : null,
    tel: t ? cisty(t.textContent) || null : null,
    telHref: t ? t.getAttribute("href") : null,
    mail: m ? cisty(m.textContent) || null : null,
    mailHref: m ? m.getAttribute("href") : null,
  };
}

/** Postaví nový prázdny košík (raz). trh "sk" | "cz". -> blok | null (nie je prázdny košík / už je hotový). */
export function prazdnyKosik(doc, trh) {
  if (!jePrazdny(doc)) return null;
  const hotovy = doc.getElementById(ID_PRAZDNY);
  if (hotovy) return hotovy;
  const T = PRAZDNY_TEXTY[trh] || PRAZDNY_TEXTY.sk;
  const kam = doc.querySelector(".cart-inner.cart-empty");

  // --- 1. dlaždica: výrazne „Váš košík je zatiaľ prázdny“ + veta (Michal 2. 11. 22:58: „Viacej by som zvýraznil, že váš
  // košík je prázdny, spravil by som to ako dlaždicu s tými textami, ako sú tam, plus tomu potom tú dlaždicu … set“)
  const prazdna = el(doc, "div", { class: "lcd-prz-karta lcd-prz-prazdna" }, [
    el(doc, "div", { class: "lcd-prz-hlava" }, [
      el(doc, "span", { class: "lcd-prz-hlava__ikona", "aria-hidden": "true", html: SVG.kosik + '<i class="lcd-prz-hlava__nula">0</i>' }),
      el(doc, "h2", { id: "lcd-prz-h", class: "lcd-prz-hlava__nadpis", text: T.nadpis }),
    ]),
    el(doc, "p", { class: "lcd-prz-uvod", text: T.uvod }),
  ]);
  // --- 2. dlaždica: set so zľavou (celá dlaždica je odkaz); 3. dlaždica: konkrétne produkty a vzorkovník
  const set = el(doc, "a", { class: "lcd-prz-karta lcd-prz-set", href: T.set.href }, [
    el(doc, "span", { class: "lcd-prz-set__diely", "aria-hidden": "true" }, T.set.diely.reduce(function (a, d, i) {
      if (i) a.push(el(doc, "span", { class: "lcd-prz-set__plus", text: "+" }));
      a.push(el(doc, "span", { class: "lcd-prz-set__diel" }, [obr(doc, d[0], 520, 520, "lcd-prz-set__foto"), el(doc, "span", { class: "lcd-prz-set__lbl", text: d[1] })]));
      return a;
    }, [])),
    el(doc, "span", { class: "lcd-prz-set__text" }, [
      el(doc, "b", { class: "lcd-prz-set__k", text: T.set.k }),
      el(doc, "span", { class: "lcd-prz-set__s", text: T.set.s }),
      el(doc, "span", { class: "lcd-prz-btn", text: T.set.btn }),
    ]),
  ]);
  const produkty = el(doc, "ul", { class: "lcd-prz-produkty" }, T.produkty.map(function (p) {
    return el(doc, "li", {}, [el(doc, "a", { class: "lcd-prz-produkt", href: p.href }, [
      el(doc, "span", { class: "lcd-prz-produkt__foto" }, [obr(doc, p.img, 560, 350)]),
      el(doc, "span", { class: "lcd-prz-produkt__text" }, [el(doc, "b", { text: p.n }), el(doc, "span", { text: p.v })]),
      el(doc, "span", { class: "lcd-prz-produkt__sip", html: SVG.dalej }),
    ])]);
  }));
  const vz = el(doc, "a", { class: "lcd-prz-vz", href: T.vz.href }, [
    el(doc, "span", { class: "lcd-prz-vz__vejar", "aria-hidden": "true" }, [1, 2, 3, 4, 5].map(function (i) { return el(doc, "i", { style: "background-image:url(" + IMG + "sw" + i + ".jpg)" }); })),
    el(doc, "span", { class: "lcd-prz-vz__text" }, [el(doc, "b", { text: T.vz.k }), el(doc, "span", { text: T.vz.s })]),
    el(doc, "span", { class: "lcd-prz-vz__btn", text: T.vz.btn }),
  ]);
  const hlavna = el(doc, "div", { class: "lcd-prz-karta lcd-prz-hlavna" }, [
    el(doc, "h3", { class: "lcd-prz-sek", text: T.produktyNadpis }),
    produkty,
    vz,
  ]);

  // --- bok: kontakt zo Shoptetu + vyhľadávanie Shoptetu (presunuté)
  const k = kontaktShoptetu(doc);
  const bok = el(doc, "div", { class: "lcd-prz-bok" });
  if (k.tel || k.mail) {
    bok.appendChild(el(doc, "div", { class: "lcd-prz-karta lcd-prz-pomoc" }, [
      el(doc, "h2", { class: "lcd-prz-karta__nadpis", text: k.nadpis || T.pomoc }),
      k.tel ? el(doc, "a", { class: "lcd-prz-kontakt", href: k.telHref }, [el(doc, "span", { class: "lcd-prz-kontakt__ikona", html: SVG.tel }), el(doc, "span", { class: "lcd-prz-kontakt__text" }, [el(doc, "small", { text: T.telefon }), el(doc, "b", { text: k.tel })])]) : null,
      k.mail ? el(doc, "a", { class: "lcd-prz-kontakt", href: k.mailHref }, [el(doc, "span", { class: "lcd-prz-kontakt__ikona", html: SVG.mail }), el(doc, "span", { class: "lcd-prz-kontakt__text" }, [el(doc, "small", { text: T.email }), el(doc, "b", { text: k.mail })])]) : null,
    ]));
  }

  const blok = el(doc, "div", { id: ID_PRAZDNY, class: "lcd-prz lcd-prz--dlazdice", role: "region", "aria-labelledby": "lcd-prz-h" }, [prazdna, set, hlavna, bok.childNodes.length ? bok : null]);
  kam.insertBefore(blok, kam.firstChild);
  doc.documentElement.classList.add(TRIEDA_PRAZDNY);
  return blok;
}

/** Späť na prázdny košík Shoptetu (núdzový vypínač): blok a trieda preč (obsah Shoptetu sa nemenil, len bol skrytý). */
export function zrusPrazdny(doc) {
  const blok = doc.getElementById(ID_PRAZDNY);
  doc.documentElement.classList.remove(TRIEDA_PRAZDNY);
  if (blok) blok.parentNode.removeChild(blok);
}
