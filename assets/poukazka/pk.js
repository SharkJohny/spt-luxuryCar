/* GENEROVANE tools/extract-lcd-pk.py z navrhu poukazka.html — needituj rucne.
   Spúšťa ho assets/js/lcdPoukazka.js len na stránke darčekovej poukážky. */
(function(){
  if (window.__LCD_PK_HOTOVO__) return;
  var PK = window.__LCD_PK__ || {};
  var MARKUP = "<!-- ================= PRODUKT ================= -->\n<div data-s=\"1\" class=\"pr\"><div class=\"in\">\n\n  <div class=\"gal\">\n    <div class=\"big pk-big\">\n      <span class=\"znac\"><span>Darčeková poukážka</span><span class=\"tmavy\">A4 na vytlačenie</span></span>\n      <div class=\"pk-scena\" id=\"pkScena\">\n        <div class=\"pk-a4\" id=\"pkA4\">\n          <img id=\"pkA4Img\" src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-vysku-prazdna.jpg\" alt=\"Darčeková poukážka Luxury Car Design v hodnote 300 €\" width=\"1100\" height=\"1556\">\n          <p class=\"pk-hod\" aria-hidden=\"true\"><span class=\"pk-hod-t\">V hodnote</span><span class=\"pk-hod-s\">300 €</span></p>\n        </div>\n        <img class=\"pk-foto\" id=\"galBig\" src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-sirka-300.jpg\" alt=\"\" aria-hidden=\"true\">\n      </div>\n      <span class=\"rohy\" aria-hidden=\"true\"><i></i><i></i><i></i><i></i></span>\n    </div>\n    <div class=\"mini\" id=\"galMini\">\n      <button type=\"button\" class=\"on pk-mv\" data-pk=\"nahlad\" aria-pressed=\"true\" aria-label=\"Náhľad poukážky so zvolenou hodnotou\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-vysku-prazdna.jpg\" alt=\"\"><span class=\"pk-mini-s\">300 €</span></button>\n      <button type=\"button\" class=\"pk-mv\" data-src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-sirka-300.jpg\" data-fit=\"contain\" data-alt=\"Darčeková poukážka na šírku, ukážka v hodnote 300 €\" aria-pressed=\"false\" aria-label=\"Poukážka na šírku\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-sirka-300.jpg\" alt=\"\"></button>\n      <button type=\"button\" data-src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-interier.jpg\" data-pos=\"30% 50%\" data-alt=\"Oranžové luxusné autokoberce v interiéri auta\" aria-pressed=\"false\" aria-label=\"Autokoberce v interiéri\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-interier.jpg\" alt=\"\"></button>\n      <button type=\"button\" data-src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-detail.jpg\" data-alt=\"Autokoberec pri sedadle vodiča zblízka\" aria-pressed=\"false\" aria-label=\"Autokoberec zblízka\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-detail.jpg\" alt=\"\"></button>\n    </div>\n  </div>\n\n  <div class=\"buy\" id=\"konf\">\n    <h1>Darčeková poukážka<em>na luxusné autokoberce</em></h1>\n    <a class=\"hodn\" href=\"#recenzie\"><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg><b>5,0</b><span class=\"col\"><span class=\"st\">★★★★★</span><i>89 recenzií na Google</i></span></a>\n\n    <div class=\"cena\">\n      <span class=\"cena-fig\"><span class=\"teraz\" id=\"cenaTeraz\">od 100 €</span></span>\n      <span class=\"cena-note\" id=\"cenaNote\">Hodnotu volíte od 100 do 800 € po 50 €</span>\n    </div>\n    <p class=\"lede\">Obdarovaný si sám vyberie produkt, farbu, vzor prešívania aj typ. Vy nemusíte poznať presný model jeho auta.</p>\n\n    <div class=\"sprv\" id=\"sprv\">\n\n      <div class=\"krok otvoreny\" data-krok=\"1\">\n        <button type=\"button\" class=\"kr-hd\" aria-expanded=\"true\">\n          <span class=\"kr-no\">1</span>\n          <span class=\"kr-tx\"><span class=\"kr-nm\">Hodnota poukážky</span>\n            <span class=\"kr-vy\" data-vyber>300 €</span></span>\n          <span class=\"kr-zm\">Zmeniť</span>\n        </button>\n        <div class=\"kr-body\">\n          <p class=\"podnadpis\">Ťuknite na sumu — obdarovaný ju minie na čokoľvek z ponuky.</p>\n          <div class=\"pk-sumy\" id=\"pkSumy\" role=\"radiogroup\" aria-label=\"Hodnota poukážky\">\n            <button type=\"button\" role=\"radio\" data-v=\"100\" aria-checked=\"false\" tabindex=\"-1\">100&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"150\" aria-checked=\"false\" tabindex=\"-1\">150&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"200\" aria-checked=\"false\" tabindex=\"-1\">200&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"250\" aria-checked=\"false\" tabindex=\"-1\">250&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"300\" aria-checked=\"true\" tabindex=\"0\" class=\"on\">300&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"350\" aria-checked=\"false\" tabindex=\"-1\">350&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"400\" aria-checked=\"false\" tabindex=\"-1\">400&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"450\" aria-checked=\"false\" tabindex=\"-1\">450&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"500\" aria-checked=\"false\" tabindex=\"-1\">500&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"550\" aria-checked=\"false\" tabindex=\"-1\">550&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"600\" aria-checked=\"false\" tabindex=\"-1\">600&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"650\" aria-checked=\"false\" tabindex=\"-1\">650&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"700\" aria-checked=\"false\" tabindex=\"-1\">700&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"750\" aria-checked=\"false\" tabindex=\"-1\">750&nbsp;€</button>\n            <button type=\"button\" role=\"radio\" data-v=\"800\" aria-checked=\"false\" tabindex=\"-1\">800&nbsp;€</button>\n          </div>\n          <div class=\"pk-krokuj\">\n            <span class=\"pk-krokuj-t\">Upravte po&nbsp;50&nbsp;€<small>od 100 do 800 €</small></span>\n            <span class=\"pk-step\">\n              <button type=\"button\" id=\"pkMinus\" aria-label=\"Znížiť hodnotu o 50 €\" aria-controls=\"pkVal\" aria-disabled=\"false\">&minus;</button>\n              <output id=\"pkVal\" aria-live=\"polite\">300 €</output>\n              <button type=\"button\" id=\"pkPlus\" aria-label=\"Zvýšiť hodnotu o 50 €\" aria-controls=\"pkVal\" aria-disabled=\"false\">+</button>\n            </span>\n          </div>\n          <a class=\"btn dalej\" href=\"#\" data-dalej=\"1\">Potvrďte hodnotu</a>\n        </div>\n      </div>\n\n      <div class=\"krok\" data-krok=\"2\">\n        <button type=\"button\" class=\"kr-hd\" aria-expanded=\"false\">\n          <span class=\"kr-no\">2</span>\n          <span class=\"kr-tx\"><span class=\"kr-nm\">Doručenie</span>\n            <span class=\"kr-vy\" data-vyber><span class=\"nw\">E-mailom</span> · bez príplatku</span></span>\n          <span class=\"kr-zm\">Zmeniť</span>\n        </button>\n        <div class=\"kr-body\">\n          <div class=\"pk-dor\">\n            <div class=\"pk-dor-r\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"2\"/><path d=\"m3.8 7 8.2 6 8.2-6\"/></svg></span><span class=\"pk-dor-t\"><b>Kód poukážky <span class=\"nw\">e-mailom</span></b><span>Príde po spracovaní objednávky. Obdarovaný ho zadá v košíku na luxurycardesign.sk.</span></span></div>\n            <div class=\"pk-dor-r\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M7 8.5V3.5h10v5\"/><rect x=\"3.5\" y=\"8.5\" width=\"17\" height=\"7.5\" rx=\"2\"/><path d=\"M7 13.5h10v7H7z\"/><path d=\"M9.5 16.5h5M9.5 18.5h3.5\"/></svg></span><span class=\"pk-dor-t\"><b>Poukážka A4 na vytlačenie</b><span>Elegantná poukážka príde spolu s kódom — vytlačíte ju a darček odovzdáte do ruky.</span></span></div>\n            <div class=\"pk-dor-c\"><span>Doručenie</span><b>Bez príplatku</b></div>\n          </div>\n          <a class=\"btn dalej\" href=\"#\" data-dalej=\"2\">Hotovo</a>\n        </div>\n      </div>\n\n    </div>\n\n    <div class=\"sumar\">\n      <span class=\"sum-lb\">Spolu</span>\n      <span class=\"sum\" id=\"sumaCelkom\">300 €</span>\n    </div>\n    <a class=\"btn kos\" href=\"#\" id=\"doKosika\" aria-disabled=\"false\">Vložte do košíka</a>\n    <ul class=\"usp-r pk-dovera\">\n      <li>Platnosť 12 mesiacov</li>\n      <li>Na celý sortiment</li>\n      <li>Kód e-mailom</li>\n    </ul>\n  </div>\n\n</div></div>\n\n<div data-s=\"1\" class=\"chapter\" id=\"pouzitie\"><div class=\"wrap\">\n  <h2 class=\"rv\">Na čo ju obdarovaný použije</h2>\n  <p class=\"lede rv\" style=\"margin-top:12px\">Poukážka platí na celý sortiment — autokoberce, rohože do kufra, boxy aj sety. Obdarovaný si vyberie, čo jeho autu chýba.</p>\n  <div class=\"pk-prod rv\">\n    <a class=\"pk-p\" href=\"/luxusne-autokoberce-dragonskin-diamond-line/\"><span class=\"ph\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-5a1138a62553.jpg\" alt=\"Jednovrstvové autokoberce s červeným prešívaním\" loading=\"lazy\" width=\"760\" height=\"666\"></span>\n      <span class=\"tx\"><span class=\"nm\">Jednovrstvové autokoberce</span><span class=\"po\">Na jar, leto aj jeseň</span><span class=\"cn\"><b>od 219 €</b><i>Pozrieť</i></span></span></a>\n    <a class=\"pk-p\" href=\"/luxusne-autokoberce-dragonskin-elite-diamond-line/\"><span class=\"ph\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/dv-hero-1.jpg\" alt=\"Dvojvrstvové autokoberce s vrchnou vrstvou\" loading=\"lazy\" width=\"1200\" height=\"1000\"></span>\n      <span class=\"tx\"><span class=\"nm\">Dvojvrstvové autokoberce</span><span class=\"po\">S odnímateľnou vrchnou vrstvou na celý rok</span><span class=\"cn\"><b>od 351 €</b><i>Pozrieť</i></span></span></a>\n    <a class=\"pk-p\" href=\"/luxusny-koberced-do-kufra-dragonskin-klasik/\"><span class=\"ph\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/kc-d7.jpg\" alt=\"Rohož do kufra Classic na dne kufra\" loading=\"lazy\" width=\"1024\" height=\"1024\"></span>\n      <span class=\"tx\"><span class=\"nm\">Rohož do kufra Classic</span><span class=\"po\">Na dno kufra</span><span class=\"cn\"><b>230 €</b><i>Pozrieť</i></span></span></a>\n    <a class=\"pk-p\" href=\"/luxusny-koberced-do-kufra-dragonskin-premium/\"><span class=\"ph\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/kp-diamond-celok.jpg\" alt=\"Rohož do kufra Premium na dne aj bokoch kufra\" loading=\"lazy\" width=\"1200\" height=\"1200\"></span>\n      <span class=\"tx\"><span class=\"nm\">Rohož do kufra Premium</span><span class=\"po\">Na dno, boky aj operadlá</span><span class=\"cn\"><b>340 €</b><i>Pozrieť</i></span></span></a>\n    <a class=\"pk-p\" href=\"/luxusny-boxi-do-kufra/\"><span class=\"ph\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/bx-hero-1.jpg\" alt=\"Boxy do kufra na rohoži v kufri\" loading=\"lazy\" width=\"1200\" height=\"900\"></span>\n      <span class=\"tx\"><span class=\"nm\">Box do kufra</span><span class=\"po\">Skladací organizér do kufra</span><span class=\"cn\"><b>od 197 €</b><i>Pozrieť</i></span></span></a>\n  </div>\n</div></div>\n<div data-s=\"1\" class=\"chapter faqsec\"><div class=\"wrap\">\n  <h2 class=\"rv\">Na čo sa nás pýtate najčastejšie</h2>\n  <div class=\"faq rv\" style=\"margin-top:26px\">\n    <details><summary><span class=\"i\">01</span><span class=\"t\">Ako sa poukážka uplatní?</span><span class=\"p\">+</span></summary>\n      <div class=\"a\">Obdarovaný si na luxurycardesign.sk vyberie produkt, v košíku zadá kód poukážky a hodnota poukážky sa odráta z objednávky.</div></details>\n    <details><summary><span class=\"i\">02</span><span class=\"t\">Kedy mi poukážka príde?</span><span class=\"p\">+</span></summary>\n      <div class=\"a\">Po spracovaní objednávky Vám príde <span class=\"nw\">e-mailom</span> kód poukážky spolu s elegantnou poukážkou vo formáte A4 na vytlačenie.</div></details>\n    <details><summary><span class=\"i\">03</span><span class=\"t\">Ako dlho poukážka platí?</span><span class=\"p\">+</span></summary>\n      <div class=\"a\">12 mesiacov od kúpy.</div></details>\n    <details><summary><span class=\"i\">04</span><span class=\"t\">Na čo sa dá poukážka použiť?</span><span class=\"p\">+</span></summary>\n      <div class=\"a\">Na celý sortiment: autokoberce, rohože do kufra, boxy do kufra aj sety.</div></details>\n    <details><summary><span class=\"i\">05</span><span class=\"t\">Môžem zvoliť vlastnú sumu?</span><span class=\"p\">+</span></summary>\n      <div class=\"a\">Áno. Hodnotu volíte od 100 do 800 € po 50 € — v konfigurátore ťuknete na sumu alebo ju upravíte tlačidlami − a +.</div></details>\n    <details><summary><span class=\"i\">06</span><span class=\"t\">Dá sa poukážka vytlačiť?</span><span class=\"p\">+</span></summary>\n      <div class=\"a\">Áno. Spolu s kódom príde <span class=\"nw\">e-mailom</span> elegantná poukážka vo formáte A4. Vytlačíte ju a darček odovzdáte pekne do ruky.</div></details>\n    <details><summary><span class=\"i\">07</span><span class=\"t\">Čo ak nepoznám presný model auta obdarovaného?</span><span class=\"p\">+</span></summary>\n      <div class=\"a\">Nevadí, nemusíte ho poznať. Produkt, farbu, vzor prešívania aj typ si obdarovaný vyberie sám a model auta zadá až pri objednávke. Šablóny sú hotové pre viac ako 1000 modelov.</div></details>\n  </div>\n</div></div>\n<div data-s=\"1\" class=\"lx lx-tma lx-gal\" id=\"galeria\"><div class=\"lx-gal-lep lx-vzor\"><div class=\"lx-gal-pin\"><div class=\"lx-gal-hore\"><div class=\"lx-hlava\"><div class=\"lx-hlava-t\"><h2 class=\"lx-h\">Z áut našich zákazníkov</h2></div><div class=\"lx-pocet lx-gal-pocet\"><span><span class=\"lx-gal-cislo\">01</span> / 08</span><small>fotka</small></div></div></div><div class=\"lx-gal-okno\"><div class=\"lx-gal-znak\" aria-hidden=\"true\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/logo-velke.png\" alt=\"\" decoding=\"async\" loading=\"lazy\"></div><div class=\"lx-gal-trat\"><figure class=\"lx-gal-k\"><button class=\"lx-gal-f\" type=\"button\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Osobné auto · vpredu\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/f03.jpg\" alt=\"Osobné auto · vpredu\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Osobné auto · vpredu</figcaption></figure><figure class=\"lx-gal-k\"><button class=\"lx-gal-f\" type=\"button\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Kufor · béžová\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/set2.jpg\" alt=\"Kufor · béžová\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Kufor · béžová</figcaption></figure><figure class=\"lx-gal-k\"><button class=\"lx-gal-f\" type=\"button\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Kamión · čierna s červenou\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/truck.jpg\" alt=\"Kamión · čierna s červenou\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Kamión · čierna s červenou</figcaption></figure><figure class=\"lx-gal-k\"><button class=\"lx-gal-f\" type=\"button\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Čierna · červené šitie\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/f04.jpg\" alt=\"Čierna · červené šitie\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Čierna · červené šitie</figcaption></figure><figure class=\"lx-gal-k\"><button class=\"lx-gal-f\" type=\"button\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Box do kufra\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/k-box.jpg\" alt=\"Box do kufra\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Box do kufra</figcaption></figure><figure class=\"lx-gal-k\"><button class=\"lx-gal-f\" type=\"button\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Béžová · vpredu\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/set1.jpg\" alt=\"Béžová · vpredu\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Béžová · vpredu</figcaption></figure><figure class=\"lx-gal-k\"><button class=\"lx-gal-f\" type=\"button\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Kufor · celý priestor\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/k-hf.jpg\" alt=\"Kufor · celý priestor\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Kufor · celý priestor</figcaption></figure><figure class=\"lx-gal-k\"><button class=\"lx-gal-f\" type=\"button\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Dvojvrstvové · pruh\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/p-dd.jpg\" alt=\"Dvojvrstvové · pruh\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Dvojvrstvové · pruh</figcaption></figure><figure class=\"lx-gal-k lx-klon\" aria-hidden=\"true\"><button class=\"lx-gal-f\" type=\"button\" tabindex=\"-1\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Osobné auto · vpredu\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/f03.jpg\" alt=\"\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Osobné auto · vpredu</figcaption></figure><figure class=\"lx-gal-k lx-klon\" aria-hidden=\"true\"><button class=\"lx-gal-f\" type=\"button\" tabindex=\"-1\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Kufor · béžová\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/set2.jpg\" alt=\"\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Kufor · béžová</figcaption></figure><figure class=\"lx-gal-k lx-klon\" aria-hidden=\"true\"><button class=\"lx-gal-f\" type=\"button\" tabindex=\"-1\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Kamión · čierna s červenou\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/truck.jpg\" alt=\"\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Kamión · čierna s červenou</figcaption></figure><figure class=\"lx-gal-k lx-klon\" aria-hidden=\"true\"><button class=\"lx-gal-f\" type=\"button\" tabindex=\"-1\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Čierna · červené šitie\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/f04.jpg\" alt=\"\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Čierna · červené šitie</figcaption></figure><figure class=\"lx-gal-k lx-klon\" aria-hidden=\"true\"><button class=\"lx-gal-f\" type=\"button\" tabindex=\"-1\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Box do kufra\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/k-box.jpg\" alt=\"\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Box do kufra</figcaption></figure><figure class=\"lx-gal-k lx-klon\" aria-hidden=\"true\"><button class=\"lx-gal-f\" type=\"button\" tabindex=\"-1\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Béžová · vpredu\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/set1.jpg\" alt=\"\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Béžová · vpredu</figcaption></figure><figure class=\"lx-gal-k lx-klon\" aria-hidden=\"true\"><button class=\"lx-gal-f\" type=\"button\" tabindex=\"-1\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Kufor · celý priestor\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/k-hf.jpg\" alt=\"\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Kufor · celý priestor</figcaption></figure><figure class=\"lx-gal-k lx-klon\" aria-hidden=\"true\"><button class=\"lx-gal-f\" type=\"button\" tabindex=\"-1\" data-lx-kurzor=\"Pozrieť\" aria-label=\"Pozrieť: Dvojvrstvové · pruh\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/p-dd.jpg\" alt=\"\" decoding=\"async\" loading=\"lazy\"></button><figcaption>Dvojvrstvové · pruh</figcaption></figure></div></div><div class=\"lx-gal-dole\"><div class=\"pinfoot lx-foot\"><span class=\"pf-hint\">Rolujte<span> — fotky sa posúvajú</span></span><span class=\"pf-bar\"><i class=\"lx-bar\"></i></span><a class=\"btn pf-cta\" href=\"#konf\">Vyberte hodnotu</a></div></div></div></div></div>\n\n\n<!-- ================= FAQ ================= -->\n\n\n<div data-s=\"1\" class=\"chapter after-dark\" id=\"recenzie\"><div class=\"wrap\">\n  <h2 class=\"rv\">Hodnotenia priamo z Google</h2>\n  <div class=\"revhead rv\">\n    <svg class=\"gmark\" viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg>\n    <span class=\"score\">5,0</span>\n    <div class=\"col\"><span class=\"stars\">★★★★★</span><span class=\"sub\">89 recenzií na Google &middot; hodnotenie 5,0</span></div>\n    <span class=\"cta\"><a class=\"btn ghost\" href=\"https://g.page/r/CSB8eNYW5ALXEAI/review\" target=\"_blank\" rel=\"noopener\">Napíšte recenziu</a><a class=\"btn ghost\" href=\"https://g.page/r/CSB8eNYW5ALXEAI\" target=\"_blank\" rel=\"noopener\">Prečítajte si všetky</a></span>\n  </div>\n  <div class=\"revwrap rv\">\n    <div class=\"revs\" id=\"revs\">\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Nemám slov.Som maximálne ale že maximálne spokojný.Rohože vyzerajú úplne skvelo.Či už dizajnovo aj čo sa týka materiálu.Krasne mi sadli do auta čoho som sa bál že nebudú sedieť.A krásne pasujú.Takze môžem len a len odporučiť každému kto by váhal.Dakujem Firme Luxury Car Design aj za rýchlu…</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-f6c91e807b3c.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-457864d2ffe8.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-1115231bf108.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">MM</span><span class=\"meta\"><b>Majlo Mario</b><i>Pred 8 týždňami</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Mám koberce Dragon skit od Luxury Car design a som s nimi nad mieru spokojný ihneď po inštalácii sadli a oživili priestor môjho interiéru, čistia sa jednoducho stačí použiť v podstate len vlhkú handričku a za krátky čas máte vyčistené celé auto. V balení dostanete aj sadu niekoľkých klipov na…</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-baa8026a188d.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-c5a842a064a2.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">PP</span><span class=\"meta\"><b>Pavol Papúch</b><i>Pred 34 týždňami</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Veľmi seriózne jednanie , rýchla a veľmi ústretová reakcia na reklamáciu ktorá sa týkala rozmeru zadnej rohože na Ssangyong TORRES 2023. Bolo to nové auto na ktoré ešte neboli matrice na šitie a doriešili dodanie novej rohože . Túto firmu môžem len odporučiť všetkým čo chcú mať luxusné koberce…</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-1f21049b8262.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-7b5bba093fab.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-fb3ce1287e21.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">FV</span><span class=\"meta\"><b>Frantisek Varga</b><i>Pred 34 týždňami</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Tak tedy, toto jsem nečekal, to je nádhera, ale dal bych 4,5 hvězd, vždy je co zlepšovat, na záhyby pod přední sedadla našít suchý zip a na zadní zase udělat je cca o 20 cm delší, také to co se strčí pod přední sedačky, upevnění je také někdy složité, ale pouďte sami, za mne - skvělé. +2</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-3a2d79926651.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-774167847264.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-0bc362f743aa.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">MF</span><span class=\"meta\"><b>Milan Funtíček</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Musím v prvom rade pochváliť majiteľa, keď som vybavoval boli sviatky a ešte sobota večer cca 21:30 v čete pomôže vám? Čakáte bota ktorý odpovie, nie! Majiteľ odpisoval riešil, nedeľu volal, hneď všetko promtne riešené, žiadne natahovacky, nič, pekne rovno povedal, že to bude trvať 4až5 týždňov,…</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-ff1733d38cf4.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-36e3c7250713.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-ef37e53435c7.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">PK</span><span class=\"meta\"><b>Peter Kucek</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Koberčeky do autá sú skutočne krásne, hrubá koža a na nej druhá vrstva, sivá melírovaná, dodali interiéru ten správny šmrnc. Kvalita kože aj prešívania je skutočne vysoká, fotky a recenzie na stránke zodpovedajú reálnym produktom, nejde o žiadne čínske napodobeniny. Zároveň je pán Švancár…</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-d944a588a2e5.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-612467ee1810.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-345582cbeb3e.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">MR</span><span class=\"meta\"><b>maria rentkova</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Musím vychválit Luxury Car Design, byl jsem víc než mile překvapen.Koberečky jsou nejen krásně zpracované, ale i sedí na 100%. Neměl jsem žádné problémy s položením.Opravdu moc chválím a přeji více spokojených zákazníků.Smekám klobouk 🙂. S pozdravem a přáním Strnad Pavel.</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-e07256fef2b3.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-037fc8884cba.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-f7d82545300a.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">PS</span><span class=\"meta\"><b>Pavel Strnad</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Profesionálny prístup, rýchla reakcia,lepšie pre zákazníkov je materiál vidieť a chytiť na živo mal som túto možnosť vďaka ústretovosti predajcu. Šablóny sú super všetko perfektné sadlo na svoje miesto. Jedna hviezdička dole len za predĺženú dobu dodávky. Bolo to pre chorobu vo výrobe. S čim som…</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-a1aa72eab702.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-47d4fc55ec52.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-7097c23e7137.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">DJ</span><span class=\"meta\"><b>Daniel Janči</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Označení koberců jako Luxury je opravdu výstižné a tyto koberce jsou opravdu luxusní výrobek, jak kvalitou zpracování tak designem. Mám je ve všech svých autech a fungují naprosto skvěle i v náročných užitkových vlastnostech. Naprostá spokojenost. +2</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-0f71fb2a726f.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-143fec79add5.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-92f133c5e9fb.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">DU</span><span class=\"meta\"><b>David Ulrych</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Odporúčam pán veľmi ochotný pomôže s objednávkou a rohože prišli v poriadku krásne a detailne spracované. Nám už zdobia našu q5 🙂 Luxury Car Design Vlastník 23. 8. 2023 Ďakujeme za objednávku ,a tešíme sa na ďalšiu spoluprácu 🙂 Upraviť Odstrániť</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-991b51504698.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-0d735c1d94c1.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-979299df49c4.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">KS</span><span class=\"meta\"><b>Katarína Smolková</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Seriózne jednanie a ako pán sľúbil tak aj bolo pretože som sa obával kvality .Vyzeraju veľmi pekne luxusne a sú aj kvalitne vypracované .Co sa týka montaže- rýchle a jednoduché keďže sedia úplne na mieru .Mozem len odporúcit 👍</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-e7f5b2c7cce0.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-ea51710e86ce.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-b744067d4236.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">EH</span><span class=\"meta\"><b>emil herko</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n        <article class=\"rev\">\n          <span class=\"qm\">&ldquo;</span>\n          <div class=\"st\">★★★★★</div>\n          <p>Dobrý den, chtěla bych poděkovat za ochotu pri objednávání, velmi detailní vysvětlení celé mé objednávky ,děkuji moc za nádherně propracované koberce , přesně sedí jak mají ,vypadají krásně. Jste super obchod ,vřele doporučuji</p>\n          <div class=\"shots\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-4361b7de69f1.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-91f2e82df77f.jpg\" alt=\"\" loading=\"lazy\" width=\"260\" height=\"260\"></div>\n          <div class=\"foot\"><span class=\"av\">DČ</span><span class=\"meta\"><b>Daniela Červenkova</b><i>Overený zákazník</i></span><svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path fill=\"#4285F4\" d=\"M45.1 24.5c0-1.6-.1-2.7-.4-3.9H24v7.1h12.1c-.2 1.8-1.6 4.6-4.5 6.5l6.9 5.3c4.1-3.8 6.6-9.4 6.6-15z\"/><path fill=\"#34A853\" d=\"M24 46c5.9 0 10.9-2 14.5-5.3l-6.9-5.3c-1.9 1.3-4.4 2.2-7.6 2.2-5.8 0-10.7-3.8-12.5-9.1l-7.1 5.5C8.1 41.1 15.4 46 24 46z\"/><path fill=\"#FBBC05\" d=\"M11.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.7-4.5l-7.1-5.5C2.8 17 2 20.4 2 24s.8 7 2.3 10z\"/><path fill=\"#EA4335\" d=\"M24 9.9c4.1 0 6.9 1.8 8.5 3.3l6.2-6C34.9 3.8 29.9 2 24 2 15.4 2 8.1 6.9 4.3 14l7.1 5.5C13.3 13.7 18.2 9.9 24 9.9z\"/></svg></div>\n        </article>\n    </div>\n    <div class=\"revnav\">\n      <button type=\"button\" id=\"revPrev\" aria-label=\"Predchádzajúca recenzia\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 18l-6-6 6-6\"/></svg></button>\n      <button type=\"button\" id=\"revNext\" aria-label=\"Ďalšia recenzia\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 18l6-6-6-6\"/></svg></button>\n    </div>\n  </div>\n</div></div>\n\n<div class=\"kap\" data-k=\"1\">\n\n<div data-s=\"1\" id=\"ocakavat\">\n  <div class=\"stage2\" id=\"stage2\">\n    <div class=\"pin2\">\n      <div class=\"pinhead\">\n        <h2>Šesť dôvodov, prečo ňou nič nepokazíte</h2>\n        <p class=\"lede\">Darček, ktorý si obdarovaný vyberie sám. Vy pritom nemusíte vedieť nič o jeho aute.</p>\n      </div>\n      <div class=\"pintop\">\n        <span class=\"chip\">Kód e-mailom</span>\n        <span class=\"chip\">A4 na vytlačenie</span>\n        <span class=\"chip\">100 – 800 €</span>\n        <span class=\"chip\">Platnosť 12 mesiacov</span>\n        <span class=\"chip\">Celý sortiment</span>\n        <span class=\"chip\">Viac ako 1000 modelov</span>\n      </div>\n      <div class=\"pinmain\">\n      <div class=\"s2-media\">\n        <img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-08c360575353.jpg\" alt=\"Autokoberce sadnuté v interiéri auta\" data-i=\"0\" class=\"on\" width=\"760\" height=\"950\">\n        <img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-email.jpg\" alt=\"Darčeková poukážka v obálke\" data-i=\"1\" width=\"760\" height=\"950\">\n        <img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-vysku-300-v2.jpg\" alt=\"Darčeková poukážka vo formáte A4 v hodnote 300 €\" data-i=\"2\" width=\"760\" height=\"950\" style=\"object-position:50% 30%\">\n        <img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-hodnoty.jpg\" alt=\"Hodnoty poukážky od 100 do 800 €\" data-i=\"3\" width=\"760\" height=\"950\">\n        <img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-detail.jpg\" alt=\"Oranžový autokoberec pri sedadle vodiča\" data-i=\"4\" width=\"760\" height=\"950\">\n        <img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/bx-hero-1.jpg\" alt=\"Rohož a boxy do kufra\" data-i=\"5\" width=\"760\" height=\"950\">\n        <span class=\"s2-big\" id=\"s2Big\">01</span>\n      </div>\n      <div class=\"s2-body\">\n        <div class=\"s2-rail\" id=\"s2Rail\">\n        <button type=\"button\" data-i=\"0\" class=\"on\"><span>01</span></button>\n        <button type=\"button\" data-i=\"1\"><span>02</span></button>\n        <button type=\"button\" data-i=\"2\"><span>03</span></button>\n        <button type=\"button\" data-i=\"3\"><span>04</span></button>\n        <button type=\"button\" data-i=\"4\"><span>05</span></button>\n        <button type=\"button\" data-i=\"5\"><span>06</span></button>\n        </div>\n        <div class=\"s2-col\">\n        <div class=\"s2-texts\">\n        <div class=\"s2-t on\" data-i=\"0\">\n          <div class=\"k\">Istota</div>\n          <h3>Nemôžete sa netrafiť</h3>\n          <p>Autokoberce sa šijú na mieru konkrétneho auta. S poukážkou si produkt, farbu aj vzor prešívania vyberie obdarovaný sám a zadá model svojho auta — šablóny sú hotové pre viac ako 1000 modelov.</p>\n        </div>\n        <div class=\"s2-t\" data-i=\"1\">\n          <div class=\"k\">E-mail</div>\n          <h3>Príde e-mailom</h3>\n          <p>Po spracovaní objednávky Vám príde <span class=\"nw\">e-mailom</span> kód poukážky. Nikam nemusíte chodiť a nič nemusíte vyzdvihnúť — všetko máte v <span class=\"nw\">e-maile</span>.</p>\n        </div>\n        <div class=\"s2-t\" data-i=\"2\">\n          <div class=\"k\">Na vytlačenie</div>\n          <h3>Vyzerá ako darček</h3>\n          <p>Spolu s kódom príde elegantná poukážka vo formáte A4. Vytlačíte ju a odovzdáte pekne do ruky — nie ako holý kód v správe.</p>\n        </div>\n        <div class=\"s2-t\" data-i=\"3\">\n          <div class=\"k\">Hodnota</div>\n          <h3>Hodnotu volíte Vy</h3>\n          <p>Od 100 do 800 € po 50 €. Vyberiete sumu, ktorá sedí Vášmu rozpočtu — a tá je napísaná priamo na poukážke.</p>\n        </div>\n        <div class=\"s2-t\" data-i=\"4\">\n          <div class=\"k\">Platnosť</div>\n          <h3>Celý rok platnosti</h3>\n          <p>Poukážka platí 12 mesiacov od kúpy. Obdarovaný sa nemusí ponáhľať — vyberie si, keď sa mu to hodí.</p>\n        </div>\n        <div class=\"s2-t\" data-i=\"5\">\n          <div class=\"k\">Sortiment</div>\n          <h3>Platí na celý sortiment</h3>\n          <p>Autokoberce, rohože do kufra, boxy aj sety. Obdarovaný ju použije na to, čo jeho autu chýba najviac.</p>\n        </div>\n        </div>\n        <div class=\"s2-thumbs\" id=\"s2Thumbs\"></div>\n        </div>\n      </div>\n      </div>\n      <div class=\"pinfoot\">\n        <span class=\"pf-hint\">Rolujte<span> — dôvody sa menia</span></span>\n        <span class=\"pf-bar\"><i id=\"s2Prog\"></i></span>\n        <a class=\"btn pf-cta\" href=\"#konf\">Vyberte hodnotu</a>\n      </div>\n    </div>\n  </div>\n  <div class=\"s2-mob\" id=\"s2Mob\"></div>\n</div>\n\n<div class=\"spat rv\">\n  <p>Vyberte hodnotu, zvyšok nechajte na obdarovanom.</p>\n  <a class=\"btn spat-btn\" href=\"#konf\">Vyberte hodnotu poukážky</a>\n</div>\n\n</div>\n\n\n<div class=\"kap\" data-k=\"2\">\n\n<div data-s=\"1\" class=\"chapter\" id=\"komu\"><div class=\"wrap\">\n  <h2 class=\"rv\">Komu poukážka sadne</h2>\n  <p class=\"lede rv\" style=\"margin-top:12px\">Autokoberce sú darček na mieru konkrétneho auta. Poukážka z nich robí darček pre kohokoľvek.</p>\n  <div class=\"pk-komu rv\">\n    <article class=\"pk-k hl\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"12\" cy=\"12\" r=\"8.6\"/><path d=\"M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8v.6\"/><path d=\"M12 16.9v.1\"/></svg></span><h3>Keď neviete, čo presne kúpiť</h3><p>Autokoberce sa šijú na mieru konkrétneho auta. Bez presného typu vozidla darček ľahko netrafíte — poukážka to vyrieši: produkt, farbu aj vzor si obdarovaný vyberie sám podľa svojho auta.</p></article>\n    <article class=\"pk-k\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"12\" cy=\"12\" r=\"8.6\"/><circle cx=\"12\" cy=\"12\" r=\"2.3\"/><path d=\"M3.6 10.6c2.6-.9 5.4-1.3 8.4-1.3s5.8.4 8.4 1.3M10 13.4l-3.6 6M14 13.4l3.6 6\"/></svg></span><h3>Pre milovníka svojho auta</h3><p>Pre človeka, ktorý má svoje auto rád a stará sa oň. Luxusné autokoberce uvidí pri každom nastúpení.</p></article>\n    <article class=\"pk-k\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"3\" y=\"7.5\" width=\"18\" height=\"12.5\" rx=\"2\"/><path d=\"M8.5 7.5V5.6c0-.9.7-1.6 1.6-1.6h3.8c.9 0 1.6.7 1.6 1.6v1.9M3 12.5h18M12 11v3\"/></svg></span><h3>Ako firemný darček</h3><p>Pre zamestnancov, klientov aj partnerov. Hodnotu zvolíte podľa rozpočtu a každý si vyberie podľa svojho auta.</p></article>\n    <article class=\"pk-k\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"12\" cy=\"13.2\" r=\"7.8\"/><path d=\"M12 9.2v4l2.6 2M9.6 2.8h4.8M19 5.5l1.4 1.4\"/></svg></span><h3>Na poslednú chvíľu</h3><p>Autokoberce sa šijú až po objednávke, poukážka na nič nečaká — kód aj poukážku na vytlačenie dostanete <span class=\"nw\">e-mailom</span>.</p></article>\n  </div>\n</div></div>\n<div data-s=\"1\" class=\"chapter\" id=\"prilezitosti\"><div class=\"wrap\">\n  <h2 class=\"rv\">Sadne na každú príležitosť</h2>\n  <p class=\"lede rv\" style=\"margin-top:12px\">Hodnotu prispôsobíte rozpočtu, poukážku vytlačíte a odovzdáte, keď príde ten správny deň.</p>\n  <ul class=\"pk-prilez rv\">\n    <li class=\"pk-pr\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M12 2.8l4.6 6.1h-2.7l4.2 5.6h-3.1l3.7 4.7H5.3L9 14.5H5.9l4.2-5.6H7.4z\"/><path d=\"M12 19.2v2.3\"/></svg></span>Vianoce</li>\n    <li class=\"pk-pr\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M3.8 20.5h16.4M5.2 20.5v-6.3c0-.8.7-1.5 1.5-1.5h10.6c.8 0 1.5.7 1.5 1.5v6.3\"/><path d=\"M5.2 16.2c1.2.9 2.3.9 3.4 0s2.3-.9 3.4 0 2.3.9 3.4 0 2.3-.9 3.4 0\"/><path d=\"M8.4 12.7v-2.4M12 12.7v-2.4M15.6 12.7v-2.4\"/><path d=\"M8.4 7.6c-.9-.8-.9-1.9 0-3.2.9 1.3.9 2.4 0 3.2zM12 7.6c-.9-.8-.9-1.9 0-3.2.9 1.3.9 2.4 0 3.2zM15.6 7.6c-.9-.8-.9-1.9 0-3.2.9 1.3.9 2.4 0 3.2z\"/></svg></span>Narodeniny</li>\n    <li class=\"pk-pr\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M3.2 15.6v-2.9c0-.6.4-1.2 1-1.4l2.4-.9 1.9-3.4c.3-.5.8-.8 1.4-.8h5.1c.6 0 1.1.3 1.4.8l1.9 3.4 2.4.9c.6.2 1 .8 1 1.4v2.9\"/><path d=\"M3.2 15.6h1.6M9.2 15.6h5.6M19.2 15.6h1.6M6.4 10.4h11.2\"/><circle cx=\"7\" cy=\"16\" r=\"2.1\"/><circle cx=\"17\" cy=\"16\" r=\"2.1\"/></svg></span>Nové auto</li>\n    <li class=\"pk-pr\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><circle cx=\"9\" cy=\"14.2\" r=\"5.4\"/><circle cx=\"15\" cy=\"14.2\" r=\"5.4\"/><path d=\"M10.6 5.2 12 3.4l1.4 1.8L12 7z\"/></svg></span>Výročie</li>\n    <li class=\"pk-pr\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M9.6 3h4.8l-1.1 3.3h-2.6z\"/><path d=\"M10.7 6.3 8.4 15.6l3.6 5 3.6-5-2.3-9.3\"/></svg></span>Deň otcov</li>\n    <li class=\"pk-pr\"><span class=\"pk-ic\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"3.5\" y=\"8\" width=\"17\" height=\"4.2\" rx=\"1\"/><path d=\"M5 12.2v8.3h14v-8.3M12 8v12.5\"/><path d=\"M12 8c-1.4-3.4-5.4-4-5.4-1.6C6.6 7.7 9.6 8 12 8zm0 0c1.4-3.4 5.4-4 5.4-1.6 0 1.3-3 1.6-5.4 1.6z\"/></svg></span>Firemný darček</li>\n  </ul>\n</div></div>\n\n<div class=\"spat rv\">\n  <p>Hodnotu zvolíte od 100 do 800 € po 50 €.</p>\n  <a class=\"btn spat-btn\" href=\"#konf\">Pokračujte vo výbere</a>\n</div>\n\n</div>\n\n\n<div class=\"kap\" data-k=\"3\">\n\n<div data-s=\"1\" class=\"chapter\" id=\"ukazka\"><div class=\"wrap\">\n  <h2 class=\"rv\">Takto vyzerá poukážka</h2>\n  <p class=\"lede rv\" style=\"margin-top:12px\">Spolu s kódom príde <span class=\"nw\">e-mailom</span> elegantná poukážka vo formáte A4. Vytlačíte ju a darček odovzdáte pekne do ruky.</p>\n  <div class=\"pk-ukazka rv\" style=\"margin-top:26px\">\n    <div class=\"pk-stol\">\n      <figure class=\"pk-list v\">\n        <div class=\"pk-ram\"><div class=\"pk-a4\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-vysku-prazdna.jpg\" alt=\"Darčeková poukážka na výšku so zvolenou hodnotou\" loading=\"lazy\" width=\"1100\" height=\"1556\"><p class=\"pk-hod\" aria-hidden=\"true\"><span class=\"pk-hod-t\">V hodnote</span><span class=\"pk-hod-s\">300 €</span></p></div></div>\n        <figcaption>Na výšku<i>so sumou, ktorú zvolíte</i></figcaption>\n      </figure>\n      <figure class=\"pk-list s\">\n        <div class=\"pk-ram\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-sirka-300.jpg\" alt=\"Darčeková poukážka na šírku, ukážka v hodnote 300 €\" loading=\"lazy\" width=\"1500\" height=\"1061\"></div>\n        <figcaption>Na šírku<i>ukážka v hodnote 300 €</i></figcaption>\n      </figure>\n    </div>\n    <div class=\"pk-ukazka-tx\">\n      <h3>Darček, ktorý sa dá odovzdať do ruky</h3>\n      <ul>\n        <li>Formát A4 v čiernej a zlatej</li>\n        <li>Hodnota je napísaná priamo na poukážke</li>\n        <li>Miesto pre číslo poukážky a dátum platnosti</li>\n        <li>Príde <span class=\"nw\">e-mailom</span> spolu s kódom poukážky</li>\n      </ul>\n      <a class=\"btn\" href=\"#konf\">Vyberte hodnotu</a>\n    </div>\n  </div>\n</div></div>\n<div data-s=\"1\" class=\"chapter\"><div class=\"wrap\">\n  <h2 class=\"rv\">Tri kroky a darček je hotový</h2>\n  <p class=\"lede rv\" style=\"margin-top:12px\">Kúpite ju za chvíľu — kód aj poukážka na vytlačenie prídu <span class=\"nw\">e-mailom</span>.</p>\n  <ol class=\"tml rv\" id=\"tml\" style=\"margin-top:30px\">\n    <li><i>1</i><div class=\"c\"><b>Vyberiete hodnotu</b><span class=\"tt\">hneď</span><p>V konfigurátore zvolíte sumu od 100 do 800 € a vložíte poukážku do košíka.</p></div></li>\n    <li><i>2</i><div class=\"c\"><b>Kód a poukážka prídu <span class=\"nw\">e-mailom</span></b><span class=\"tt\">po spracovaní objednávky</span><p>Dostanete kód poukážky a elegantnú poukážku A4 na vytlačenie. Vytlačíte ju a odovzdáte do ruky.</p></div></li>\n    <li><i>3</i><div class=\"c\"><b>Obdarovaný uplatní kód v košíku</b><span class=\"tt\">do 12 mesiacov</span><p>Vyberie si produkt, farbu, vzor prešívania aj typ. V košíku na luxurycardesign.sk zadá kód a hodnota sa odráta z objednávky.</p></div></li>\n  </ol>\n</div></div>\n<div class=\"spat rv\">\n  <p>Zostáva už len vybrať hodnotu.</p>\n  <a class=\"btn spat-btn\" href=\"#konf\">Vyberte hodnotu poukážky</a>\n</div>\n\n</div>\n\n\n<div class=\"kap\" data-k=\"4\">\n\n<div data-s=\"1\" class=\"end\">\n  <div class=\"endbg\"><img src=\"https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/pk-interier.jpg\" alt=\"\" loading=\"lazy\" width=\"1600\" height=\"734\"></div>\n  <div class=\"eyebrow\">Luxury Car Design</div>\n  <h2 style=\"margin-top:14px\">Darček, ktorý si obdarovaný vyberie sám</h2>\n  <p class=\"lede\">Poukážka na autokoberce, rohože do kufra, boxy aj sety v hodnote od 100 do 800 €. Kód príde <span class=\"nw\">e-mailom</span> spolu s poukážkou A4 na vytlačenie.</p>\n  <div class=\"end-cta\">\n    <a class=\"btn\" href=\"#konf\">Vyberte hodnotu poukážky</a>\n    <a class=\"btn ghost\" href=\"#recenzie\" style=\"color:#fff;border-color:rgba(230,200,119,.45)\">Pozrite si recenzie</a>\n  </div>\n  <div class=\"end-tr\"><span>Platnosť 12 mesiacov</span><span>Na celý sortiment</span><span>Kód e-mailom</span></div>\n</div>\n\n</div>\n\n<div class=\"citanie\" id=\"citanie\" aria-hidden=\"true\"><i></i></div>";
  function spusti(){
    var wrap = document.getElementById('content-wrapper');
    if (!wrap || document.getElementById('lcd-pk')) return;
    var koren = document.createElement('div');
    koren.id = 'lcd-pk';
    koren.innerHTML = MARKUP;
    wrap.parentNode.insertBefore(koren, wrap);
    window.__LCD_PK_HOTOVO__ = true;
    document.documentElement.classList.add('lcd-pk-on');
    try {
    /* Konfigurátor darčekovej poukážky (Michal 3. 10. 2026): hodnoty LEN 100 – 800 € po 50 €
       (15 možností), predvolená 300 €. Iná hodnota sa zvoliť nedá — každý vstup sa zaokrúhli
       na 50 € a oreže do 100 – 800 €. Cena hore ukazuje „od 100 €“, kým zákazník nič nezvolí.
       Náhľad poukážky (každé .pk-hod-s na stránke) ukazuje zvolenú sumu.
       Tlačidlo do košíka je len maketa — nič sa neodosiela. */
    (function(){
      var MIN = 100, MAX = 800, KROK = 50, PREDVOLENA = 300;
      var $ = function(id){ return document.getElementById(id); };
      var sumyEl = $('pkSumy'),
          volby = [].slice.call(sumyEl.querySelectorAll('button[data-v]')),
          minus = $('pkMinus'), plus = $('pkPlus'), out = $('pkVal'),
          teraz = $('cenaTeraz'), note = $('cenaNote'), spolu = $('sumaCelkom'),
          kos = $('doKosika'), lista = $('lista'), lCena = $('listaCena'), lKos = $('listaKos'),
          buy = document.querySelector('.buy'),
          kroky = [].slice.call(document.querySelectorAll('#sprv .krok')),
          scena = $('pkScena'), a4 = $('pkA4'), a4Img = $('pkA4Img'), foto = $('galBig'), mini = $('galMini'),
          RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
      var suma = PREDVOLENA, zvolene = false;
    
      function platna(v){
        v = Math.round(Number(v) / KROK) * KROK;
        if(!isFinite(v)) v = PREDVOLENA;
        return Math.min(MAX, Math.max(MIN, v));
      }
      function eur(v){ return v + ' €'; }
    
      /* ---- galéria: živý náhľad alebo fotka ---- */
      function oznacMini(b){
        [].forEach.call(mini.children, function(x){
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
      }
      function ukazNahlad(){
        scena.classList.remove('pk-ina');
        a4.removeAttribute('aria-hidden'); foto.setAttribute('aria-hidden', 'true');
        oznacMini(mini.querySelector('[data-pk="nahlad"]'));
      }
      mini.addEventListener('click', function(e){
        var b = e.target.closest('button'); if(!b) return;
        if(b.dataset.pk === 'nahlad'){ ukazNahlad(); return; }
        oznacMini(b);
        foto.src = b.dataset.src; foto.alt = b.dataset.alt || '';
        foto.classList.toggle('pk-contain', b.dataset.fit === 'contain');
        foto.style.objectPosition = b.dataset.pos || '';
        scena.classList.add('pk-ina');
        a4.setAttribute('aria-hidden', 'true'); foto.removeAttribute('aria-hidden');
      });
    
      /* ---- hodnota ---- */
      function nastav(v, odZakaznika){
        v = platna(v);
        var ina = v !== suma;
        suma = v;
        if(odZakaznika) zvolene = true;
        volby.forEach(function(b){
          var on = +b.dataset.v === suma;
          b.classList.toggle('on', on);
          b.setAttribute('aria-checked', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
        });
        out.textContent = eur(suma);
        minus.setAttribute('aria-disabled', suma <= MIN ? 'true' : 'false');
        plus.setAttribute('aria-disabled', suma >= MAX ? 'true' : 'false');
        teraz.textContent = zvolene ? eur(suma) : 'od ' + eur(MIN);
        note.textContent = zvolene
          ? 'Poukážka v hodnote ' + eur(suma) + ' · kód príde e-mailom'
          : 'Hodnotu volíte od 100 do 800 € po 50 €';
        spolu.textContent = eur(suma);
        if(lCena) lCena.textContent = eur(suma);
        kroky[0].querySelector('[data-vyber]').textContent = eur(suma);
        if(a4Img) a4Img.alt = 'Darčeková poukážka Luxury Car Design v hodnote ' + eur(suma);
        document.querySelectorAll('.pk-hod-s, .pk-mini-s').forEach(function(el){
          el.textContent = eur(suma);
          if(ina && !RM && el.classList.contains('pk-hod-s')){
            el.classList.remove('pk-anim'); void el.offsetWidth; el.classList.add('pk-anim');
          }
        });
        /* zmena hodnoty pri otvorenej fotke vráti živý náhľad, nech je zmena vidno */
        if(odZakaznika && scena.classList.contains('pk-ina')) ukazNahlad();
      }
    
      sumyEl.addEventListener('click', function(e){
        var b = e.target.closest('button[data-v]'); if(b) nastav(b.dataset.v, true);
      });
      /* skupina prepínačov: šípky menia hodnotu po 50 €, Home/End na kraj rozsahu */
      sumyEl.addEventListener('keydown', function(e){
        var d = {ArrowRight:1, ArrowDown:1, ArrowLeft:-1, ArrowUp:-1}[e.key];
        var v = d ? suma + d * KROK : (e.key === 'Home' ? MIN : (e.key === 'End' ? MAX : null));
        if(v === null) return;
        e.preventDefault();
        nastav(v, true);
        var b = sumyEl.querySelector('button.on'); if(b) b.focus();
      });
      minus.addEventListener('click', function(){ nastav(suma - KROK, true); });
      plus.addEventListener('click', function(){ nastav(suma + KROK, true); });
    
      /* ---- sprievodca: akordeón (klik na otvorený krok ho zatvorí) ---- */
      function otvor(n){
        kroky.forEach(function(k){
          var on = +k.dataset.krok === n;
          k.classList.toggle('otvoreny', on);
          k.querySelector('.kr-hd').setAttribute('aria-expanded', on ? 'true' : 'false');
        });
        var k = kroky[n-1];
        if(k && k.getBoundingClientRect().top < 70){
          scrollTo({top: k.getBoundingClientRect().top + scrollY - 90, behavior: RM ? 'auto' : 'smooth'});
        }
      }
      function zatvorVsetky(){
        kroky.forEach(function(k){
          k.classList.remove('otvoreny');
          k.querySelector('.kr-hd').setAttribute('aria-expanded', 'false');
        });
      }
      kroky.forEach(function(k){
        var hd = k.querySelector('.kr-hd');
        hd.addEventListener('click', function(){
          if(k.classList.contains('otvoreny')){ k.classList.remove('otvoreny'); hd.setAttribute('aria-expanded', 'false'); }
          else otvor(+k.dataset.krok);
        });
      });
      document.querySelectorAll('#sprv [data-dalej]').forEach(function(btn){
        btn.addEventListener('click', function(e){
          e.preventDefault();
          var n = +btn.dataset.dalej;
          kroky[n-1].classList.add('hotovy');
          if(n === 1){ nastav(suma, true); otvor(2); }
          else {
            zatvorVsetky();
            kos.scrollIntoView({block:'center', behavior: RM ? 'auto' : 'smooth'});
          }
        });
      });
    
      /* ---- košík: variant podľa zvolenej sumy (POUKAZKA-300 / POUKAZ-7500) cez Shoptet ----
         Úspech/chybu čítame z odpovede /action/Cart/addCartItem/ (code 200 = vložené). Po úspechu ide zákazník
         rovno do košíka (Michal 4. 10. 2026). Shoptet po úspechu stránku obnoví a mohol by presmerovanie prebiť —
         preto aj značka lcdPkDoKosika, podľa ktorej lcdPoukazka.js po obnovení presmeruje do košíka. */
      function ukazPridane(v){
        var bar = document.getElementById('pkPridane');
        if(!bar){
          bar = document.createElement('div');
          bar.id = 'pkPridane'; bar.className = 'pk-pridane'; bar.setAttribute('role', 'status');
          kos.parentNode.insertBefore(bar, kos.nextSibling);
        }
        bar.innerHTML = '<span class="pk-pridane-t"></span><a class="pk-pridane-a" href="' + PK.kosikUrl + '"></a>';
        bar.querySelector('.pk-pridane-t').textContent = PK.textVKosiku.replace('%s', eur(v));
        bar.querySelector('.pk-pridane-a').textContent = PK.textDoKosika + ' →';
      }
      function doKosika(e){
        e.preventDefault();
        var t = this;
        if(t.dataset.pov) return;
        t.dataset.pov = t.textContent;
        t.textContent = PK.textPridavam;
        var povodny = XMLHttpRequest.prototype.open, hotovo = false;
        function koniec(ok, sprava){
          if(hotovo) return; hotovo = true;
          XMLHttpRequest.prototype.open = povodny;
          if(ok){
            try { sessionStorage.setItem('lcdPkDoKosika', String(Date.now())); } catch(_){}
            t.textContent = PK.textPridane;
            ukazPridane(suma);
            location.href = PK.kosikUrl;
          } else {
            t.textContent = (sprava && String(sprava).replace(/<[^>]+>/g, '')) || PK.textChyba;
            setTimeout(function(){ t.textContent = t.dataset.pov; delete t.dataset.pov; }, 4000);
          }
        }
        XMLHttpRequest.prototype.open = function(m, u){
          if(/addCartItem/.test(String(u))){
            XMLHttpRequest.prototype.open = povodny;
            var x = this;
            x.addEventListener('load', function(){
              var j = {}; try { j = JSON.parse(x.responseText); } catch(_){}
              koniec(x.status === 200 && (j.code === undefined || j.code === 200), j.message);
            });
            x.addEventListener('error', function(){ koniec(false); });
          }
          return povodny.apply(this, arguments);
        };
        setTimeout(function(){ koniec(false); }, 15000);
        try { shoptet.cartShared.addToCart({ productCode: PK.kod + suma, amount: 1 }); }
        catch(err){ koniec(false); if(window.console) console.warn('lcdPk kosik', err); }
      }
      kos.addEventListener('click', doKosika);
      if(lKos) lKos.addEventListener('click', doKosika);
      try { sessionStorage.removeItem('lcdPkPridane'); } catch(_){}
    
      /* ---- lišta s cenou na telefóne ---- */
      if('IntersectionObserver' in window && buy && lista){
        new IntersectionObserver(function(en){
          lista.classList.toggle('on', !en[0].isIntersecting);
        },{threshold:0, rootMargin:'-80px 0px 0px 0px'}).observe(buy);
      }
    
      /* ---- plynulé odkrytie sekcií ---- */
      var rv = [].slice.call(document.querySelectorAll('.rv'));
      if('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(en){
          en.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } });
        },{threshold:.12, rootMargin:'0px 0px -8% 0px'});
        rv.forEach(function(el){ io.observe(el); });
      } else { rv.forEach(function(el){ el.classList.add('on'); }); }
    
      nastav(PREDVOLENA, false);
    })();
    } catch (e) { if (window.console) console.warn('lcdPk skript', e); }
    try {
    /* Moduly prevzate z navrhu uvodnej stranky: trustbar, pripnute 01-05,
       rozlozeny rez materialom. Logika je zhodna s hp-tpl.html. */
    (function(){
      var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
    
      /* --- trustbar: nahlad fotky pri kurzore (len mys) --- */
      (function(){
        if(!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
        var bunky=document.querySelectorAll('.tstrip .ts[data-peek]');
        if(!bunky.length) return;
        var im=document.createElement('img');
        im.className='ts-peek'; im.alt=''; im.decoding='async';
        /* bez src by prehliadac siahol na adresu stranky a zapisal 404 */
        im.src='https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/poukazka/m-e2216a7e9b73.gif';
        document.body.appendChild(im);
        function poloz(e){
          var w=im.offsetWidth||400, h=im.offsetHeight||400;
          var x=Math.min(e.clientX+22, innerWidth-w-14);
          var y=Math.min(Math.max(e.clientY-h/2,14), innerHeight-h-14);
          im.style.transform='translate('+x+'px,'+y+'px) scale('+(im.classList.contains('on')?1:0.94)+')';
          im.style.left='0'; im.style.top='0';
        }
        [].forEach.call(bunky,function(b){
          b.addEventListener('mouseenter',function(e){
            if(im.getAttribute('src')!==b.dataset.peek) im.src=b.dataset.peek;
            poloz(e); im.classList.add('on');
          });
          b.addEventListener('mousemove',poloz);
          b.addEventListener('mouseleave',function(){ im.classList.remove('on'); });
        });
      })();
    
      /* --- pocitadla v trustbare --- */
      document.querySelectorAll('[data-count]').forEach(function(el){
        var done=false;
        new IntersectionObserver(function(es){
          es.forEach(function(e){
            if(!e.isIntersecting||done) return; done=true;
            var to=+el.dataset.count, suf=el.dataset.suffix||'', t0=null;
            if(RM){el.textContent=to+suf;return;}
            function tick(t){ t0=t0||t; var p=Math.min(1,(t-t0)/1100);
              el.textContent=Math.round(to*(1-Math.pow(1-p,3)))+suf;
              if(p<1) requestAnimationFrame(tick); }
            requestAnimationFrame(tick);
          });
        },{threshold:.6}).observe(el);
      });
    
      /* --- legenda a hotspoty na materiali --- */
      (function(){
        var L=[].slice.call(document.querySelectorAll('.leg')),
            H=[].slice.call(document.querySelectorAll('.exp .hot'));
        function set(i,on){ if(L[i])L[i].classList.toggle('on',on); if(H[i])H[i].classList.toggle('on',on); }
        L.forEach(function(el,i){
          el.addEventListener('mouseenter',function(){set(i,true)});
          el.addEventListener('mouseleave',function(){set(i,false)});
          var h=el.querySelector('.leg-h'), d=el.querySelector('.leg-d');
          if(!h||!d) return;
          h.addEventListener('click',function(){
            var open=h.getAttribute('aria-expanded')==='true';
            L.forEach(function(o){
              var oh=o.querySelector('.leg-h'), od=o.querySelector('.leg-d');
              if(oh&&od){ oh.setAttribute('aria-expanded','false'); od.style.maxHeight='0px'; }
            });
            if(!open){ h.setAttribute('aria-expanded','true'); d.style.maxHeight=d.scrollHeight+'px'; }
          });
        });
        addEventListener('resize',function(){
          L.forEach(function(o){
            var oh=o.querySelector('.leg-h'), od=o.querySelector('.leg-d');
            if(oh&&od&&oh.getAttribute('aria-expanded')==='true') od.style.maxHeight=od.scrollHeight+'px';
          });
        });
        H.forEach(function(el,i){
          el.addEventListener('mouseenter',function(){set(i,true)});
          el.addEventListener('mouseleave',function(){set(i,false)});
          el.addEventListener('click',function(){ if(L[i]) L[i].scrollIntoView({block:'center',behavior:'smooth'}); });
        });
      })();
    
      /* --- 01-05: jeden krok naraz, riadene scrollom --- */
      var stage2=document.getElementById('stage2');
      if(stage2){
        var s2imgs=[].slice.call(document.querySelectorAll('.s2-media img')),
            s2texts=[].slice.call(document.querySelectorAll('.s2-t')),
            s2btns=[].slice.call(document.querySelectorAll('.s2-rail button')),
            s2big=document.getElementById('s2Big'), s2prog=document.getElementById('s2Prog'),
            s2cur=-1;
        var s2th=document.getElementById('s2Thumbs'), s2thumbs=[];
        if(s2th){
          s2imgs.forEach(function(img,i){
            var b=document.createElement('button');
            b.type='button'; b.dataset.i=i;
            b.setAttribute('aria-label','Krok '+(i+1));
            var im=document.createElement('img');
            im.src=img.getAttribute('src'); im.alt=''; im.loading='lazy';
            var no=document.createElement('b'); no.textContent=String(i+1).padStart(2,'0');
            b.appendChild(im); b.appendChild(no); s2th.appendChild(b); s2thumbs.push(b);
          });
        }
        stage2.style.height=(s2imgs.length*(s2imgs.length>6?44:62))+'vh';
        var s2set=function(i){
          if(i===s2cur) return; s2cur=i;
          s2imgs.forEach(function(e,k){e.classList.toggle('on',k===i)});
          s2texts.forEach(function(e,k){e.classList.toggle('on',k===i)});
          s2btns.forEach(function(e,k){e.classList.toggle('on',k===i);e.classList.toggle('done',k<i)});
          s2thumbs.forEach(function(e,k){e.classList.toggle('on',k===i)});
          s2big.textContent=String(i+1).padStart(2,'0');
        };
        s2btns.concat(s2thumbs).forEach(function(b){
          b.addEventListener('click',function(){
            var i=+b.dataset.i, r=stage2.getBoundingClientRect(), top=r.top+scrollY;
            scrollTo({top:top+(stage2.offsetHeight-innerHeight)*((i+0.5)/s2imgs.length),behavior:'smooth'});
          });
        });
        var s2frame=function(){
          var r=stage2.getBoundingClientRect();
          var p=Math.min(0.999,Math.max(0,(-r.top)/(r.height-innerHeight)));
          s2set(Math.floor(p*s2imgs.length));
          if(s2prog) s2prog.style.width=(p*100)+'%';
        };
        addEventListener('scroll',s2frame,{passive:true});
        addEventListener('resize',s2frame);
        s2frame();
    
        /* mobil: rovnaky obsah ako swipe karusel v normalnom toku */
        var mob=document.getElementById('s2Mob');
        if(mob){
          var head=stage2.querySelector('.pinhead');
          if(head) mob.appendChild(head.cloneNode(true));
          var track=document.createElement('div'); track.className='s2m-track';
          s2imgs.forEach(function(img,i){
            var card=document.createElement('article'); card.className='s2m-card';
            var ph=document.createElement('div'); ph.className='s2m-ph';
            var im=img.cloneNode(true); im.className=''; im.removeAttribute('data-i');
            im.setAttribute('loading','lazy');
            var no=document.createElement('span'); no.className='s2m-no';
            no.textContent=String(i+1).padStart(2,'0');
            ph.appendChild(im); ph.appendChild(no);
            var body=document.createElement('div'); body.className='s2m-body';
            body.innerHTML=s2texts[i].innerHTML;
            card.appendChild(ph); card.appendChild(body); track.appendChild(card);
          });
          mob.appendChild(track);
          var dots=document.createElement('div'); dots.className='s2m-dots';
          s2imgs.forEach(function(_x,i){
            var b=document.createElement('button'); b.type='button';
            b.textContent=String(i+1);
            var h=s2texts[i].querySelector('h3');
            b.setAttribute('aria-label', h?h.textContent:String(i+1));
            b.onclick=function(){
              var c=track.children[i];
              track.scrollTo({left:c.offsetLeft-track.offsetLeft-(track.clientWidth-c.offsetWidth)/2,behavior:'smooth'});
            };
            dots.appendChild(b);
          });
          mob.appendChild(dots);
          var mt=null;
          var mupd=function(){
            var mid=track.scrollLeft+track.clientWidth/2, best=0, bd=1e9;
            [].forEach.call(track.children,function(c,i){
              var cc=c.offsetLeft-track.offsetLeft+c.offsetWidth/2, dd=Math.abs(cc-mid);
              if(dd<bd){ bd=dd; best=i; }
            });
            [].forEach.call(dots.children,function(b,i){ b.classList.toggle('on',i===best) });
          };
          track.addEventListener('scroll',function(){ clearTimeout(mt); mt=setTimeout(mupd,60) },{passive:true});
          mupd();
        }
      }
    
      /* --- rozlozeny rez materialom --- */
      var stage=document.getElementById('stage'),
          expCard=document.getElementById('exp'), mx=0, my=0,
          boxes=[].slice.call(document.querySelectorAll('.mbox'));
      var TF=boxes.map(function(B){return parseFloat(B.dataset.t)||0.05});
      var lastOpen=0, RX=-7, RY=30, SC=1;
      function tilt(){
        if(!expCard) return;
        expCard.style.transform='scale('+SC.toFixed(3)+') rotateX('+(RX-my*4)+'deg) rotateY('+(RY+mx*7)+'deg)';
      }
      if(expCard){
        expCard.parentNode.addEventListener('mousemove',function(e){
          var r=expCard.getBoundingClientRect();
          mx=((e.clientX-r.left)/r.width-.5)*2; my=((e.clientY-r.top)/r.height-.5)*2; tilt();
        });
        expCard.parentNode.addEventListener('mouseleave',function(){mx=0;my=0;tilt()});
      }
      function explode(open){
        lastOpen=open;
        if(!expCard||!boxes.length) return;
        var n=boxes.length, W=expCard.clientWidth||600;
        var pw=Math.min(W*0.42,460), ph=pw/1.55;
        var th=TF.map(function(f){return Math.max(3,f*pw)});
        var tot=th.reduce(function(x,y){return x+y},0);
        var gap=pw*0.58, acc=0;
        boxes.forEach(function(B,i){
          var z=tot/2-acc-th[i]/2 + ((n-1)/2-i)*gap*open;
          acc+=th[i];
          B.style.setProperty('--pw',pw.toFixed(1)+'px');
          B.style.setProperty('--ph',ph.toFixed(1)+'px');
          B.style.setProperty('--t',th[i].toFixed(1)+'px');
          B.style.transform='translateZ('+z.toFixed(1)+'px)';
          var h=B.querySelector('.hot');
          if(h) h.style.transform='translate(-50%,-50%) translateZ('+(th[i]/2+14).toFixed(1)+'px)';
        });
        SC=1.34-0.34*open; tilt();
        var gs=document.querySelector('.mgs');
        if(gs){ gs.style.width=(30+46*open)+'%'; gs.style.opacity=String(0.55+0.45*open); }
        expCard.classList.toggle('open', open>0.35);
      }
      tilt();
      var MATMQ=matchMedia('(max-width:900px)'), matToggle=document.getElementById('matToggle'),
          matOpen=0, matIO=null, matT=null, matProg=document.getElementById('matProg');
      function setMat(o){
        if(matOpen===o) return;
        matOpen=o; explode(o);
        if(matToggle){
          matToggle.classList.toggle('on', o>0.5);
          matToggle.textContent = o>0.5 ? 'Zložiť materiál' : 'Rozložiť materiál';
        }
      }
      if(matToggle){
        matToggle.addEventListener('click',function(){ clearTimeout(matT); setMat(matOpen>0.5?0:1) });
      }
      function matAuto(){
        if(matIO){ matIO.disconnect(); matIO=null; }
        clearTimeout(matT);
        if(!MATMQ.matches || !expCard || !('IntersectionObserver' in window)) return;
        matIO=new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            clearTimeout(matT);
            if(en.isIntersecting) matT=setTimeout(function(){ setMat(1) },500);
            else setMat(0);
          });
        },{threshold:0.45});
        matIO.observe(expCard);
      }
      matAuto();
      MATMQ.addEventListener('change',function(){
        matOpen=0; explode(0);
        if(matToggle){ matToggle.classList.remove('on'); matToggle.textContent='Rozložiť materiál'; }
        matAuto();
      });
      addEventListener('resize',function(){explode(lastOpen)});
      explode(0);
      var ticking=false;
      function frame(){
        ticking=false;
        if(stage&&expCard&&!MATMQ.matches){
          var r=stage.getBoundingClientRect();
          var p=Math.min(1,Math.max(0,(-r.top)/(r.height-innerHeight)));
          var o=p<.22?p/.22:(p<.86?1:Math.max(0,1-(p-.86)/.14));
          o=o<0?0:o>1?1:o; o=o*o*(3-2*o);
          explode(o);
          if(matProg) matProg.style.width=Math.round(o*100)+'%';
        }
      }
      function onScroll(){ if(!ticking&&!RM){ ticking=true; requestAnimationFrame(frame);} }
      addEventListener('scroll',onScroll,{passive:true});
      addEventListener('resize',onScroll);
      frame();
    })();
    } catch (e) { if (window.console) console.warn('lcdPk skript', e); }
    try {
    /* Posuvnik pred/po a sipky pri recenziach — prevzate z navrhu uvodnej stranky. */
    (function(){
      /* --- pred a po: posuvnik (mys, dotyk aj klavesnica) --- */
      (function(){
        var ba=document.getElementById('ba'), top=document.getElementById('baTop'),
            line=document.getElementById('baLine'), h=document.getElementById('baH');
        if(!ba) return;
        var pos=50, drag=false, ciel=null, lerpT=null;
        function lerpBez(){
          if(ciel===null){ lerpT=null; return; }
          var d=ciel-pos;
          if(Math.abs(d)<0.15){ set(ciel,true); ciel=null; lerpT=null; return; }
          set(pos+d*0.09,true);
          lerpT=requestAnimationFrame(lerpBez);
        }
        function set(v,mark){
          pos=Math.max(0,Math.min(100,v));
          top.style.clipPath='inset(0 '+(100-pos).toFixed(2)+'% 0 0)';
          line.style.left=pos.toFixed(2)+'%'; h.style.left=pos.toFixed(2)+'%';
          h.setAttribute('aria-valuenow',Math.round(pos));
          if(mark) ba.classList.add('moved');
        }
        function xTo(e){ var r=ba.getBoundingClientRect(); return (e.clientX-r.left)/r.width*100 }
        function ease(on){
          top.style.transition = on ? 'clip-path .45s cubic-bezier(.2,.7,.2,1)' : '';
          line.style.transition = h.style.transition = on ? 'left .45s cubic-bezier(.2,.7,.2,1)' : '';
        }
        ba.addEventListener('pointerdown',function(e){
          drag=true; ease(false); try{ba.setPointerCapture(e.pointerId)}catch(_){}
          set(xTo(e),true); e.preventDefault();
        });
        ba.addEventListener('pointermove',function(e){
          if(drag){ ease(false); ciel=null; set(xTo(e),true); return; }
          if(e.pointerType==='mouse'){ ease(false); ciel=xTo(e); if(!lerpT) lerpBez(); }
        });
        ba.addEventListener('pointerleave',function(e){
          if(e.pointerType==='mouse' && !drag){ ciel=null; ease(true); set(50,true);
            setTimeout(function(){ease(false)},500); }
        });
        ['pointerup','pointercancel'].forEach(function(t){
          ba.addEventListener(t,function(e){ drag=false;
            try{ba.releasePointerCapture(e.pointerId)}catch(_){} });
        });
        h.addEventListener('keydown',function(e){
          var d = e.key==='ArrowLeft'?-3 : e.key==='ArrowRight'?3 : 0;
          if(d){ e.preventDefault(); set(pos+d,true); }
        });
        set(50,false);
        var hintEl=ba.parentNode.querySelector('.ba-hint');
        if(hintEl && matchMedia('(hover: hover) and (pointer: fine)').matches)
          hintEl.textContent='Prejdite myšou cez fotku';
        if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
          var done=false;
          var io=new IntersectionObserver(function(en){
            if(!en[0].isIntersecting||done) return; done=true; io.disconnect();
            [[68,600],[36,1750],[50,2950]].forEach(function(st){
              setTimeout(function(){ if(!ba.classList.contains('moved')){
                top.style.transition='clip-path .95s cubic-bezier(.25,.6,.25,1)';
                line.style.transition=h.style.transition='left .95s cubic-bezier(.25,.6,.25,1)';
                set(st[0],false);
                setTimeout(function(){ top.style.transition=line.style.transition=h.style.transition='' },1000);
              }},st[1]);
            });
          },{threshold:0.45});
          io.observe(ba);
        }
      })();
    
      /* --- sipky pri recenziach --- */
      var revs=document.getElementById('revs');
      if(revs){
        var step=function(){var c=revs.querySelector('.rev');return c?c.getBoundingClientRect().width+16:300};
        var pv=document.getElementById('revPrev'), nx=document.getElementById('revNext');
        if(pv) pv.onclick=function(){revs.scrollBy({left:-step(),behavior:'smooth'})};
        if(nx) nx.onclick=function(){revs.scrollBy({left:step(),behavior:'smooth'})};
      }
    })();
    } catch (e) { if (window.console) console.warn('lcdPk skript', e); }
    try {
    /* Casova os: linka sa plni podla scrollu a cislo sa rozsvieti, ked na neho
       pride rad. Ziadna kniznica — staci poloha krokov voci stredu obrazovky. */
    (function(){
      var tml=document.getElementById('tml');
      if(!tml) return;
      var kroky=[].slice.call(tml.children);
      if(matchMedia('(prefers-reduced-motion:reduce)').matches){
        tml.style.setProperty('--p','1'); kroky.forEach(function(k){k.classList.add('on')});
        return;
      }
      var tik=false;
      function kresli(){
        tik=false;
        var r=tml.getBoundingClientRect(), ciara=innerHeight*0.62;
        var p=(ciara-r.top)/r.height;
        tml.style.setProperty('--p', String(Math.max(0,Math.min(1,p))));
        kroky.forEach(function(k){
          var kr=k.querySelector('i').getBoundingClientRect();
          k.classList.toggle('on', kr.top+kr.height/2 <= ciara);
        });
      }
      function nascroll(){ if(!tik){ tik=true; requestAnimationFrame(kresli) } }
      addEventListener('scroll',nascroll,{passive:true});
      addEventListener('resize',nascroll);
      kresli();
    })();
    } catch (e) { if (window.console) console.warn('lcdPk skript', e); }
    try {
    /* Zlata linka na vrchu okna: kolko z casti pod konfiguratorom ma clovek za
       sebou. Mimo tejto casti sa schova, aby nerusila pri vybere ani v pate. */
    (function(){
      var pas = document.getElementById('citanie');
      if(!pas) return;
      var ciara = pas.querySelector('i');
      var skupiny = [].slice.call(document.querySelectorAll('.kap'));
      if(!skupiny.length) return;
    
      var caka = false;
      function prepocitaj(){
        caka = false;
        var prva = skupiny[0].getBoundingClientRect(),
            posl = skupiny[skupiny.length - 1].getBoundingClientRect();
        var zac = prva.top + scrollY, kon = posl.bottom + scrollY;
        var p = (scrollY + innerHeight * 0.5 - zac) / Math.max(1, kon - zac);
        pas.classList.toggle('zap', p > 0 && p < 1);
        ciara.style.width = (Math.max(0, Math.min(1, p)) * 100).toFixed(2) + '%';
      }
      function naplanuj(){ if(!caka){ caka = true; requestAnimationFrame(prepocitaj); } }
    
      addEventListener('scroll', naplanuj, {passive:true});
      addEventListener('resize', naplanuj);
      prepocitaj();
    })();
    } catch (e) { if (window.console) console.warn('lcdPk skript', e); }
    try {
    /* Kazdy odkaz na konfigurator scrolluje plynulo a s odstupom na hlavicku,
       nech tlacidlo do kosika neskonci schovane pod nou. */
    (function(){
      var ciel = document.getElementById('konf');
      if(!ciel) return;
      [].forEach.call(document.querySelectorAll('a[href="#konf"]'), function(a){
        a.addEventListener('click', function(e){
          e.preventDefault();
          scrollTo({top: ciel.getBoundingClientRect().top + scrollY - 78,
                    behavior:'smooth'});
        });
      });
    })();
    } catch (e) { if (window.console) console.warn('lcdPk skript', e); }
    try {
    (function(){
    /* Tri moduly z konceptu redizajnu na úvodnej stránke (od 1. 10. 2026), postavené ako
       sticky scény 08 a 09 (Materiál): číslovaná hlavička, štítky, legenda, spodná lišta
       s postupom a tlačidlom, jemný vzor kosoštvorcov v pozadí.
       PRED A PO — tmavá scéna za porovnaním s konkurenciou; čiara pri scrollovaní prejde
                   z holej podlahy na koberce a v legende sa rozsvietia body,
       FARBY     — svetlá sekcia pred vzorkovníkom: oficiálne vzorky z konfigurátora
                   a k nim fotky zo skutočných áut,
       GALÉRIA   — tmavý pás fotiek pred kontaktným formulárom; na PC ho posúva scroll.
       Tmavé moduly stoja medzi svetlými, aby nešla tmavá sekcia do tmavej.
       Rovnaký kód používa aj návrh produktovej stránky, preto adresy obrázkov idú cez `obr`.
       Štýly: blok „HP: PRED A PO + FARBY + GALÉRIA" v _lcdHome.scss / luxuryCar.css. */
    
    const CDN = "https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/";
    
    const TEXTY = {
      sk: {
        cta: "Zvoliť model vozidla", zavriet: "Zavrieť",
        pp: {
          rule: "Pred a po", h: "Pred a <b>po</b>",
          p: "Rolujte a sledujte, ako luxusné autokoberce zmenia vzhľad vozidla. Rovnaké auto, rovnaké svetlo, jediný rozdiel sú koberce.",
          pocet: "podlahy pod ochranou", po: "Po", pred: "Pred", kurzor: "Rolujte",
          altPred: "Interiér auta bez autokobercov", altPo: "Ten istý interiér s luxusnými autokobercami",
          chips: ["Rovnaké auto", "Rovnaké svetlo", "Rovnaký uhol", "Jediný rozdiel: koberce"],
          body: [
            ["Celá podlaha", "Pokrýva 100 % podlahy", "Podlaha"],
            ["Aj boky", "Boky kryté z 95 %", "Boky"],
            ["Šité na mieru", "Podľa šablóny pre Váš model", "Strih"],
            ["Čistenie za minútu", "Vyberiete a utriete vlhkou handrou", "Údržba"],
          ],
          hint: "Rolujte", hint2: " — podlaha sa zakryje",
        },
        f: {
          rule: "Farby", h: "Ku ktorej farbe patrí Vaše auto?",
          p: "Vyberte vzorku a pozrite si farbu na skutočných kobercoch v aute.",
          chips: ["Farba kože", "Farba šitia", "Fotky zo skutočných áut", "Vzorky aj poštou"],
          skupina: "Farebné vzorky", vzorka: "Vzorka", kurzor: "Farba",
          viac: "Mnoho ďalších farieb",
        },
        g: {
          rule: "Realizácie", h: "Z áut našich zákazníkov",
          p: "Osobné autá, SUV, kufre aj kamióny. Každý set na šablóne pre konkrétny model.",
          chips: ["Osobné autá", "SUV", "Kufre", "Boxy do kufra", "Kamióny"],
          fotka: "fotka", kurzor: "Pozrieť", hint: "Rolujte", hint2: " — fotky sa posúvajú",
        },
      },
      cs: {
        cta: "Zvolit model vozidla", zavriet: "Zavřít",
        pp: {
          rule: "Před a po", h: "Před a <b>po</b>",
          p: "Posouvejte a sledujte, jak luxusní autokoberce změní vzhled vozu. Stejné auto, stejné světlo, jediný rozdíl jsou koberce.",
          pocet: "podlahy pod ochranou", po: "Po", pred: "Před", kurzor: "Posouvejte",
          altPred: "Interiér auta bez autokoberců", altPo: "Tentýž interiér s luxusními autokoberci",
          chips: ["Stejné auto", "Stejné světlo", "Stejný úhel", "Jediný rozdíl: koberce"],
          body: [
            ["Celá podlaha", "Pokrývá 100 % podlahy", "Podlaha"],
            ["I boky", "Boky kryté z 95 %", "Boky"],
            ["Šité na míru", "Podle šablony pro Váš model", "Střih"],
            ["Čištění za minutu", "Vyjmete a otřete vlhkým hadříkem", "Údržba"],
          ],
          hint: "Posouvejte", hint2: " — podlaha se zakryje",
        },
        f: {
          rule: "Barvy", h: "Ke které barvě patří Vaše auto?",
          p: "Vyberte vzorek a podívejte se na barvu na skutečných kobercích v autě.",
          chips: ["Barva kůže", "Barva prošití", "Fotky ze skutečných aut", "Vzorky i poštou"],
          skupina: "Barevné vzorky", vzorka: "Vzorek", kurzor: "Barva",
          viac: "Mnoho dalších barev",
        },
        g: {
          rule: "Realizace", h: "Z aut našich zákazníků",
          p: "Osobní auta, SUV, kufry i kamiony. Každý set na šabloně pro konkrétní model.",
          chips: ["Osobní auta", "SUV", "Kufry", "Boxy do kufru", "Kamiony"],
          fotka: "fotka", kurzor: "Detail", hint: "Posouvejte", hint2: " — fotky se posouvají",
        },
      },
    };
    
    /* vzorka = oficiálny obrázok z konfigurátora, foto = rovnaká farba v skutočnom aute
       (časť z galérie e-shopu, časť z recenzií zákazníkov) */
    const FARBY = [
      { id: "cierna-cervena", vzor: "Diamond Line", sk: "Čierna · červené šitie", cs: "Černá · červené prošití" },
      { id: "cierna-modra", vzor: "Diamond Line", sk: "Čierna · modré šitie", cs: "Černá · modré prošití" },
      { id: "cierna-bezova", vzor: "Diamond Line", sk: "Čierna · béžové šitie", cs: "Černá · béžové prošití" },
      { id: "bezova", vzor: "Diamond Line", sk: "Béžová", cs: "Béžová" },
      { id: "hneda", vzor: "Diamond Line", sk: "Hnedá", cs: "Hnědá" },
      { id: "hneda-kava", vzor: "Diamond Line", sk: "Hnedá káva", cs: "Hnědá káva" },
      { id: "vinovo-cervena", vzor: "Diamond Line", sk: "Vínovo červená", cs: "Vínově červená" },
      { id: "oranzova", vzor: "Diamond Line", sk: "Oranžová", cs: "Oranžová" },
      { id: "modra", vzor: "Diamond Line", sk: "Modrá", cs: "Modrá" },
    ];
    /* koniec druhého radu vzoriek: ďalšie farby sú v konfigurátore */
    const VIAC_HREF = "/luxusne-autokoberce-dragonskin-elite-diamond-line/";
    const VIAC_VEJAR = ["x-fialova", "x-cierna-zlta", "x-seda", "x-cervena"];
    
    const GALERIA = [
      { f: "lcd-home/f03.jpg", sk: "Osobné auto · vpredu", cs: "Osobní auto · vpředu" },
      { f: "lcd-home/set2.jpg", sk: "Kufor · béžová", cs: "Kufr · béžová" },
      { f: "lcd-home/truck.jpg", sk: "Kamión · čierna s červenou", cs: "Kamion · černá s červenou" },
      { f: "lcd-home/f04.jpg", sk: "Čierna · červené šitie", cs: "Černá · červené prošití" },
      { f: "lcd-home/k-box.jpg", sk: "Box do kufra", cs: "Box do kufru" },
      { f: "lcd-home/set1.jpg", sk: "Béžová · vpredu", cs: "Béžová · vpředu" },
      { f: "lcd-home/k-hf.jpg", sk: "Kufor · celý priestor", cs: "Kufr · celý prostor" },
      { f: "lcd-home/p-dd.jpg", sk: "Dvojvrstvové · pruh", cs: "Dvouvrstvé · pruh" },
    ];
    
    const cdnObr = (cesta) => CDN + cesta;
    const dve = (n) => String(n).padStart(2, "0");
    
    function hlava(rule, h, p, vpravo) {
      return '<div class="lx-hlava"><div class="lx-hlava-t">' +
        (rule ? '<div class="rule"><span class="n">00 — ' + rule + "</span></div>" : "") +
        '<h2 class="lx-h">' + h + "</h2>" + (p ? '<p class="lx-p">' + p + "</p>" : "") + "</div>" + (vpravo || "") + "</div>";
    }
    const stitky = (chips) => '<div class="lx-chips">' + chips.map((c) => '<span class="chip">' + c + "</span>").join("") + "</div>";
    const lista = (hint, hint2, cta) =>
      '<div class="pinfoot lx-foot"><span class="pf-hint">' + hint + "<span>" + hint2 + "</span></span>" +
      '<span class="pf-bar"><i class="lx-bar"></i></span>' +
      '<a class="btn pf-cta" href="' + cta.href + '">' + cta.text + "</a></div>";
    
    /* HTML troch modulov; `obr` premení relatívnu cestu obrázka na adresu,
       `moznosti.cta` = kam vedie tlačidlo, `moznosti.viac` = odkaz „Mnoho ďalších farieb",
       `moznosti.kapitoly: false` = bez čísla kapitoly (stránka, ktorá ich nepoužíva) */
    function lxModulyHTML(cz, obr = cdnObr, moznosti = {}) {
      const T = cz ? TEXTY.cs : TEXTY.sk;
      const jaz = cz ? "cs" : "sk";
      const cta = moznosti.cta || { href: "#konf", text: T.cta };
      const kap = moznosti.kapitoly !== false;
      const od = [0.12, 0.36, 0.6, 0.84];
    
      const predPo =
        '<div data-s="1" class="lx lx-tma lx-pp" id="predapo"><div class="lx-pp-lep lx-vzor"><div class="lx-pin">' +
        hlava(kap && T.pp.rule, T.pp.h, T.pp.p,
          '<div class="lx-pocet"><span><span class="lx-pp-cislo">0</span>&nbsp;%</span><small>' + T.pp.pocet + "</small></div>") +
        stitky(T.pp.chips) +
        '<div class="lx-pp-main"><div class="lx-pp-stage">' +
        '<div class="lx-pp-plocha" data-lx-kurzor="' + T.pp.kurzor + '">' +
        '<img src="' + obr("lcd-home/ba-before.jpg") + '" alt="' + T.pp.altPred + '" width="1400" height="655" decoding="async" loading="lazy">' +
        '<div class="lx-pp-okno"><img class="lx-pp-po" src="' + obr("lcd-home/ba-after.jpg") + '" alt="' + T.pp.altPo + '" width="1400" height="655" decoding="async" loading="lazy"></div>' +
        '<div class="lx-pp-hrana" aria-hidden="true"></div>' +
        '<div class="lx-cip lx-cip-l">' + T.pp.po + '</div><div class="lx-cip lx-cip-r">' + T.pp.pred + "</div></div>" +
        '<ol class="lx-leg">' +
        T.pp.body.map((b, i) =>
          '<li class="lx-leg-r" data-od="' + od[i] + '"><span class="lx-leg-no">' + (i + 1) + "</span>" +
          '<span class="lx-leg-sw" style="background-image:url(' + obr("lcd-home/pp-" + (i + 1) + ".jpg") + ')"></span>' +
          '<span class="lx-leg-t"><b>' + b[0] + "</b><span>" + b[1] + "</span></span>" +
          '<span class="lx-leg-i">' + b[2] + '</span><span class="lx-leg-ok" aria-hidden="true"></span></li>'
        ).join("") +
        "</ol></div></div>" +
        lista(T.pp.hint, T.pp.hint2, cta) +
        "</div></div></div>";
    
      const farby =
        '<div data-s="1" class="lx lx-svetla lx-farby" id="farby"><div class="lx-vzor"><div class="lx-wrap lx-farby-in">' +
        hlava(kap && T.f.rule, T.f.h, T.f.p) +
        '<div class="lx-farby-main">' +
        '<div class="lx-farby-velka" data-lx-kurzor="' + T.f.kurzor + '">' +
        FARBY.map((f, i) =>
          '<img' + (i === 0 ? ' class="on"' : "") + ' src="' + obr("farby/" + f.id + ".jpg") + '" alt="' + f[jaz] + " · " + f.vzor + '" decoding="async" loading="lazy">'
        ).join("") +
        '<div class="lx-farby-stitok"><span class="lx-farby-cislo">01</span><span> / ' + dve(FARBY.length) + "</span></div></div>" +
        '<div class="lx-farby-panel">' +
        '<div class="lx-farby-vzor-n">' + T.f.vzorka + " · " + FARBY[0].vzor + "</div>" +
        '<div class="lx-farby-meno" aria-live="polite">' + FARBY[0][jaz] + "</div>" +
        '<div class="lx-farby-vzorky" role="group" aria-label="' + T.f.skupina + '">' +
        FARBY.map((f, i) =>
          '<button class="lx-farby-vzorka" type="button" data-i="' + i + '" data-vzor="' + f.vzor + '" aria-pressed="' + (i === 0) + '" aria-label="' + f[jaz] + ", " + f.vzor + '">' +
          '<img src="' + obr("farby/sw-" + f.id + ".jpg") + '" alt="" width="68" height="68" decoding="async" loading="lazy"></button>'
        ).join("") +
        '<a class="lx-farby-viac" href="' + (moznosti.viac || VIAC_HREF) + '" style="grid-column:span ' + (7 - (FARBY.length % 7 || 7) || 7) + '">' +
        '<span class="lx-farby-viac-vejar" aria-hidden="true">' +
        VIAC_VEJAR.map((v) => '<i style="background-image:url(' + obr("farby/sw-" + v + ".jpg") + ')"></i>').join("") + "</span>" +
        '<span class="lx-farby-viac-txt"><b>' + T.f.viac + "</b></span></a>" +
        "</div>" +
        /* „Objednať vzorky" preč — vzorkovník je hneď pod modulom (Michal 2026-10-02) */
        '<div class="lx-farby-akcie"><a class="btn pf-cta" href="' + cta.href + '">' + cta.text + "</a></div>" +
        "</div></div></div></div></div>";
    
      const galeria =
        '<div data-s="1" class="lx lx-tma lx-gal" id="galeria"><div class="lx-gal-lep lx-vzor"><div class="lx-gal-pin">' +
        '<div class="lx-gal-hore">' +
        hlava(kap && T.g.rule, T.g.h, null,
          '<div class="lx-pocet lx-gal-pocet"><span><span class="lx-gal-cislo">01</span> / ' + dve(GALERIA.length) + "</span><small>" + T.g.fotka + "</small></div>") +
        "</div>" +
        '<div class="lx-gal-okno"><div class="lx-gal-znak" aria-hidden="true"><img src="' + obr("lcd-home/logo-velke.png") + '" alt="" decoding="async" loading="lazy"></div><div class="lx-gal-trat">' +
        /* za originálmi ide ich kópia: na mobile z nich vznikne nekonečný pás, na PC je skrytá */
        GALERIA.concat(GALERIA).map((g, i) => {
          const klon = i >= GALERIA.length;
          return '<figure class="lx-gal-k' + (klon ? ' lx-klon" aria-hidden="true' : "") + '">' +
            '<button class="lx-gal-f" type="button"' + (klon ? ' tabindex="-1"' : "") + ' data-lx-kurzor="' + T.g.kurzor + '" aria-label="' + T.g.kurzor + ": " + g[jaz] + '">' +
            '<img src="' + obr(g.f) + '" alt="' + (klon ? "" : g[jaz]) + '" decoding="async" loading="lazy"></button>' +
            "<figcaption>" + g[jaz] + "</figcaption></figure>";
        }).join("") +
        "</div></div>" +
        '<div class="lx-gal-dole">' + lista(T.g.hint, T.g.hint2, cta) + "</div>" +
        "</div></div></div>";
    
      return { predPo, farby, galeria };
    }
    
    function zHTML(html) {
      const t = document.createElement("template");
      t.innerHTML = html;
      return t.content.firstElementChild;
    }
    
    /* čísla kapitol „NN — názov" idú za sebou podľa poradia na stránke
       (rovnaký názov = rovnaké číslo, napr. mobilná kópia hlavičky) */
    function lxCislujKapitoly(root) {
      const cisla = new Map();
      root.querySelectorAll(".rule .n").forEach((n) => {
        const m = n.textContent.match(/^\s*\d{1,2}\s+—\s+(.+)$/);
        if (!m) return;
        if (!cisla.has(m[1])) cisla.set(m[1], cisla.size + 1);
        n.textContent = dve(cisla.get(m[1])) + " — " + m[1];
      });
    }
    
    /* úvodná stránka: starý posuvník (modul 01) ide preč; farby pred vzorkovník,
       pred a po za porovnanie s konkurenciou, galéria pred kontaktný formulár —
       ešte pred vložením do stránky, aby GSAP počítal pozície už s nimi */
    function lcdhModulyPostav(root, cz) {
      const h = lxModulyHTML(cz);
      const stary = root.querySelector("#predapo");
      if (stary) stary.remove();
      const vzorky = root.querySelector("#vzorky");
      if (vzorky) vzorky.before(zHTML(h.farby));
      const porovnanie = root.querySelector("#porovnanie");
      if (porovnanie) porovnanie.after(zHTML(h.predPo));
      const napiste = root.querySelector("#napiste");
      if (napiste) napiste.before(zHTML(h.galeria));
      lxCislujKapitoly(root);
      /* referenčné videá: náhľad z prvej sekundy — iPhone pri preload=metadata ukáže čierny rám */
      root.querySelectorAll(".ref-v video").forEach((v) => {
        const src = v.getAttribute("src") || "";
        if (!v.getAttribute("poster") && /\.mp4$/.test(src)) v.setAttribute("poster", src.replace(/\.mp4$/, ".jpg"));
      });
    }
    
    /* správanie: scroll scény, prepínanie farieb, zväčšenie fotky */
    function lxModulyOziv(root, cz) {
      const T = cz ? TEXTY.cs : TEXTY.sk;
      const obmedz = (x) => Math.min(1, Math.max(0, x));
    
      /* farby — prepína sa kliknutím (prejdenie myšou meniť nebude, fotka by blikala) */
      root.querySelectorAll(".lx-farby").forEach((sek) => {
        const velke = sek.querySelectorAll(".lx-farby-velka img");
        const vzorky = sek.querySelectorAll(".lx-farby-vzorka");
        const meno = sek.querySelector(".lx-farby-meno");
        const vzorN = sek.querySelector(".lx-farby-vzor-n");
        const cislo = sek.querySelector(".lx-farby-cislo");
        vzorky.forEach((v) => v.addEventListener("click", () => {
          const i = +v.dataset.i;
          velke.forEach((im, j) => im.classList.toggle("on", i === j));
          vzorky.forEach((w) => w.setAttribute("aria-pressed", w === v ? "true" : "false"));
          if (meno) meno.textContent = (v.getAttribute("aria-label") || "").split(", ")[0];
          if (vzorN) vzorN.textContent = T.f.vzorka + " · " + v.dataset.vzor;
          if (cislo) cislo.textContent = dve(i + 1);
        }));
        /* fotky ostatných farieb stiahnuť až keď je sekcia blízko */
        const nacitaj = () => velke.forEach((im) => { im.loading = "eager"; });
        if ("IntersectionObserver" in window) {
          const io = new IntersectionObserver((z) => { if (z.some((x) => x.isIntersecting)) { nacitaj(); io.disconnect(); } }, { rootMargin: "600px 0px" });
          io.observe(sek);
        } else nacitaj();
      });
    
      /* galéria: klik zväčší fotku */
      const galerie = root.querySelectorAll(".lx-gal");
      if (galerie.length) {
        const zoom = zHTML('<div class="lx-zoom" hidden><img alt=""><button class="lx-zoom-x" type="button" aria-label="' + T.zavriet + '">&times;</button></div>');
        root.appendChild(zoom);
        const zImg = zoom.querySelector("img");
        let spat = null;
        const zatvor = () => { zoom.hidden = true; zImg.removeAttribute("src"); if (spat) spat.focus(); };
        zoom.addEventListener("click", zatvor);
        document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !zoom.hidden) zatvor(); });
        galerie.forEach((g) => g.querySelectorAll(".lx-gal-f").forEach((b) => {
          b.addEventListener("click", () => {
            const im = b.querySelector("img");
            zImg.src = im.currentSrc || im.src; zImg.alt = im.alt;
            spat = b; zoom.hidden = false; zoom.querySelector(".lx-zoom-x").focus();
          });
        }));
      }
    
      /* kurzor so štítkom (Farba / Pozrieť / Rolujte) Michal 2. 10. 2026 nechcel — ostáva bežná šípka */
    
      /* sekcia hneď za tmavou, ktorá má v HTML natvrdo padding-top:0, bola na mobile nalepená
         (napr. „01 — Pre osobné autá" za kamiónmi, „05 — Na vlastné oči" za pred a po):
         nulu presunieme do triedy lx-po-tmavej, aby ju mobil v CSS mohol prepísať; PC ostáva ako bolo */
      const tmave = (el) => {
        const c = (getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || []).map(Number);
        return c.length >= 3 && (c[3] === undefined || c[3] > 0.5) && 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] < 70;
      };
      root.querySelectorAll("[data-s][style]").forEach((sek) => {
        if (!/padding-top\s*:\s*0/.test(sek.getAttribute("style"))) return;
        const pred = sek.previousElementSibling;
        if (!pred || !tmave(pred)) return;
        sek.style.removeProperty("padding-top");
        sek.classList.add("lx-po-tmavej");
      });
    
      /* scény riadené scrollovaním */
      const pp = root.querySelector(".lx-pp");
      const plocha = pp && pp.querySelector(".lx-pp-plocha");
      const okno = pp && pp.querySelector(".lx-pp-okno");
      const poImg = pp && pp.querySelector(".lx-pp-po");
      const hrana = pp && pp.querySelector(".lx-pp-hrana");
      let ppQ = -1, ppPct = -1, galIdx = -1;
      const ppCislo = pp && pp.querySelector(".lx-pp-cislo");
      const ppBar = pp && pp.querySelector(".lx-bar");
      const body = pp ? pp.querySelectorAll(".lx-leg-r") : [];
      const gal = root.querySelector(".lx-gal");
      const trat = gal && gal.querySelector(".lx-gal-trat");
      const galCislo = gal && gal.querySelector(".lx-gal-cislo");
      const galBar = gal && gal.querySelector(".lx-bar");
      const znak = gal && gal.querySelector(".lx-gal-znak");
      const galPocet = gal ? gal.querySelectorAll(".lx-gal-k:not(.lx-klon)").length : 0;
      if (!pp && !gal) return;
    
      /* position:sticky nefunguje, keď má niektorý predok overflow hidden/auto —
         vtedy scéna beží ako normálny blok a postup sa ráta podľa polohy fotky */
      const galLepi = () => gal && innerWidth > 760 && !gal.classList.contains("lx-bez-lepu");
      const rezim = () => {
        [pp, gal].forEach((s) => {
          if (!s) return;
          let el = s.parentElement, zly = false;
          while (el && el !== document.body && el !== document.documentElement) {
            const cs = getComputedStyle(el);
            if (/(hidden|auto|scroll)/.test(cs.overflowY + " " + cs.overflowX)) { zly = true; break; }
            el = el.parentElement;
          }
          s.classList.toggle("lx-bez-lepu", zly);
        });
        /* výška galérie podľa dĺžky pásu: scroll a posun idú zhruba 1 : 1 */
        if (gal && trat) {
          if (galLepi()) {
            const cesta = Math.max(0, trat.scrollWidth - innerWidth);
            gal.style.height = Math.round(innerHeight * 1.2 + cesta) + "px";
          } else gal.style.height = "";
        }
      };
      const postup = (el) => {
        const lep = el.firstElementChild;
        const r = el.getBoundingClientRect(), dlzka = r.height - (lep ? lep.offsetHeight : innerHeight);
        return dlzka > 0 ? obmedz(-r.top / dlzka) : 0;
      };
      const kresli = () => {
        const r = plocha && plocha.getBoundingClientRect();
        /* mimo obrazovky sa nič neprepočítava */
        if (pp && r && r.bottom > -innerHeight && r.top < innerHeight * 2) {
          const q = pp.classList.contains("lx-bez-lepu")
            ? obmedz((innerHeight * 0.8 - r.top) / (innerHeight * 0.55))
            : obmedz((postup(pp) - 0.05) / 0.85);
          if (Math.abs(q - ppQ) > 0.0004) {
            ppQ = q;
            if (okno) okno.style.transform = "translate3d(" + ((q - 1) * 100).toFixed(2) + "%,0,0)";
            if (poImg) poImg.style.transform = "translate3d(" + ((1 - q) * 100).toFixed(2) + "%,0,0)";
            if (hrana) hrana.style.transform = "translate3d(" + (q * r.width).toFixed(1) + "px,0,0)";
            if (ppBar) ppBar.style.width = (q * 100).toFixed(1) + "%";
            const pct = Math.round(q * 100);
            if (pct !== ppPct) {
              ppPct = pct;
              if (ppCislo) ppCislo.textContent = pct;
              body.forEach((b) => b.classList.toggle("on", q >= +b.dataset.od));
            }
          }
        }
        if (gal && trat && innerWidth > 760) {
          let g;
          if (galLepi()) {
            g = postup(gal);
            const cesta = Math.max(0, trat.scrollWidth - innerWidth);
            trat.style.transform = "translate3d(" + (-g * cesta).toFixed(1) + "px,0,0)";
            /* logo za fotkami sa posúva len jemne — hĺbka */
            if (znak) znak.style.setProperty("--lx-zx", ((0.5 - g) * innerWidth * 0.16).toFixed(1) + "px");
          } else {
            trat.style.transform = "";
            const max = trat.scrollWidth - trat.clientWidth;
            g = max > 0 ? obmedz(trat.scrollLeft / max) : 0;
          }
          const idx = Math.min(galPocet, Math.round(g * (galPocet - 1)) + 1);
          if (galCislo && idx !== galIdx) { galIdx = idx; galCislo.textContent = dve(idx); }
          if (galBar) galBar.style.width = (g * 100).toFixed(1) + "%";
        }
      };
      let caka = false;
      const naRaf = () => { if (!caka) { caka = true; requestAnimationFrame(() => { caka = false; kresli(); }); } };
      addEventListener("scroll", naRaf, { passive: true });
      if (trat) trat.addEventListener("scroll", naRaf, { passive: true });
      addEventListener("resize", () => { rezim(); naRaf(); });
      addEventListener("load", () => { rezim(); naRaf(); });
      requestAnimationFrame(() => { rezim(); kresli(); });
    }
    
    lxModulyOziv(document.body,false);
    })();
    } catch (e) { if (window.console) console.warn('lcdPk skript', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', spusti); else spusti();
})();
