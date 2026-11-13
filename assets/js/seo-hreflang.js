// Jazykové odkazy pre Google (hreflang, seo-runtime.js): ktorá stránka SK patrí ku ktorej CZ.
// Adresy sú zo sitemap oboch webov (4. 11. 2026), všetky overené naživo: node tools/test-seo-hreflang.mjs --zivy.
// Stránka mimo zoznamov protějšok nemá a jazykové odkazy nedostane. Nový článok alebo stránku s protějškom pridaj sem;
// ďalší trh = ďalší stĺpec v PARY.

/** Tá istá adresa na SK aj CZ. */
const ROVNAKE = [
  "/",
  "/autokoberce-do-kamionu/",
  // podkategórie značiek kamiónov (13. 11. 2026, build-kamiony-stranky.mjs): rovnaký slug SK aj CZ.
  "/autokoberce-do-kamionu-daf/",
  "/autokoberce-do-kamionu-man/",
  "/autokoberce-do-kamionu-mercedes-benz/",
  "/autokoberce-do-kamionu-renault/",
  "/autokoberce-do-kamionu-scania/",
  "/autokoberce-do-kamionu-volvo/",
  // stránky kamiónov pre Google, prvá vlna (kniha 11. 11. 2026 §2.3; konfigurator1v/kamion/stranky.js): rovnaký slug SK aj CZ.
  // Naživo až po vytvorení OBOCH kópií v admine (dovtedy --zivy hlási 404). Skrytá kópia s logami tu nie je (noindex).
  "/autokoberce-do-kamionu-man-tgx/",
  "/autokoberce-do-kamionu-mercedes-actros/",
  "/autokoberce-do-kamionu-scania-r/",
  "/autokoberce-do-kamionu-volvo-fh4/",
  // vlna 2 a 3 (kniha 12. 11. 2026 §2.1, variant A po generáciách): 16 adries, rovnaký slug SK aj CZ, produkty zatiaľ nie sú.
  // Kým nie sú naživo OBE kópie, --zivy hlási pri nich 404 (očakávané).
  "/autokoberce-do-kamionu-daf-xf105/",
  "/autokoberce-do-kamionu-daf-xf106/",
  // "/autokoberce-do-kamionu-daf-xg/" – vrátiť, keď bude stránka DAF XG (čaká na fotky celej sady); dovtedy 404 SK aj CZ
  "/autokoberce-do-kamionu-man-tgx-2018/",
  "/autokoberce-do-kamionu-mercedes-actros-solostar/",
  "/autokoberce-do-kamionu-scania-s/",
  "/autokoberce-do-kamionu-daf-xf106-2013/",
  "/autokoberce-do-kamionu-man-tgx-2007/",
  "/autokoberce-do-kamionu-mercedes-actros-2003/",
  "/autokoberce-do-kamionu-mercedes-actros-f/",
  "/autokoberce-do-kamionu-renault-t/",
  "/autokoberce-do-kamionu-renault-t-s-tunelom/",
  "/autokoberce-do-kamionu-scania-r-2004/",
  "/autokoberce-do-kamionu-scania-r-2009/",
  "/autokoberce-do-kamionu-scania-r-2014/",
  "/autokoberce-do-kamionu-volvo-fh13/",
  // stránky podľa auta (12. 11. 2026): produkt SK aj CZ s rovnakou adresou, kategórie značiek rovnaký slug.
  "/autokoberce-audi/",
  "/autokoberce-audi-a6-c7/",
  "/autokoberce-bmw/",
  "/autokoberce-bmw-3-g20-g21/",
  "/autokoberce-bmw-5-g30-g31/",
  "/autokoberce-bmw-x7-g07/",
  "/autokoberce-mercedes-benz/",
  "/autokoberce-mercedes-eqe-suv/",
  "/autokoberce-mercedes-g-class/",
  "/autokoberce-mercedes-gle/",
  "/autokoberce-mercedes-gls/",
  "/autokoberce-mercedes-v-class/",
  "/autokoberce-skoda/",
  "/autokoberce-skoda-kodiaq-i/",
  "/autokoberce-skoda-kodiaq-ii/",
  "/autokoberce-volkswagen/",
  "/blog/",
  "/faq/",
  "/kontakty/",
  "/luxusne-autokoberce-dragonskin-diamond-line/",
  "/luxusne-autokoberce-dragonskin-elite-diamond-line/",
  "/luxusne-autokoberce-dragonskin-elite-hexa-line/",
  "/luxusne-autokoberce-dragonskin-elite-stripe-line/",
  "/luxusne-autokoberce-dragonskin-hexa-line/",
  "/luxusne-autokoberce-dragonskin-stripe-line/",
  "/luxusny-boxi-do-kufra/",
  "/luxusny-koberced-do-kufra-dragonskin-klasik-hexa/",
  "/luxusny-koberced-do-kufra-dragonskin-klasik-stripe/",
  "/luxusny-koberced-do-kufra-dragonskin-klasik/",
  "/luxusny-koberced-do-kufra-dragonskin-premium-hexa/",
  "/luxusny-koberced-do-kufra-dragonskin-premium-stripe/",
  "/luxusny-koberced-do-kufra-dragonskin-premium/",
  "/nase-produkty/",
  "/navod-na-udrzbu/",
  "/o-nas/",
  "/rozcestnik/",
  "/znacka/luxury-car-design/",
];

/** Tá istá stránka, iná adresa: [SK, CZ]. */
const PARY = [
  ["/luxusne-autokoberce-kamiony/", "/luxusni-autokoberce-kamiony/"],
  ["/vzorkovnik-dragonskin---objednavka-vzoriek/", "/vzorkovnik-dragonskin---objednavka-vzorku/"],
  ["/galeria/", "/galerie/"],
  ["/autokoberce-podla-auta/", "/autokoberce-podle-auta/"],
  ["/manual-na-instalaciu/", "/manual-na-instalaci/"],
  ["/manual-na-zaslanie-fotiek/", "/manual-pro-zasilani-fotek/"],
  ["/obchodne-podmienky/", "/obchodni-podminky/"],
  ["/odstupenie-od-zmluvy/", "/odstoupeni-od-smlouvy/"],
  ["/podmienky-ochrany-osobnych-udajov/", "/podminky-ochrany-osobnich-udaju/"],
  ["/priloha-c-2-reklamacny-formular/", "/reklamacni-formular/"],
  ["/suhlas-s-marketingom/", "/souhlas-se-zasilanim-newsletteru/"],
  ["/blog/5-dovodov-preco-kupit-ojazdene-auto-namiesto-noveho/", "/blog/5-duvodu-proc-koupit-ojete-auto-misto-noveho/"],
  ["/blog/5-veci-ktore-zvysia-predajnu-cenu-ojazdeneho-auta/", "/blog/prodejte-auto-draz-5-kroku-pred-zverejnenim-inzeratu/"],
  ["/blog/Luxusny-vzhlad/", "/blog/luxusni-vzhled/"],
  ["/blog/audi-q8-kufor-vs-q7/", "/blog/kufr-audi-q8-proc-je-tak-velky-jako-u-q7/"],
  ["/blog/auto-bez-volantu-volvo-interier/", "/blog/auto-bez-volantu-jak-volvo-meni-interier-aut/"],
  ["/blog/autokoberce-bratislava-original-od-dealera-vs-na-mieru/", "/blog/autokoberce-bratislava-original-od-dealera-vs-na-miru/"],
  ["/blog/autokoberce-na-zimu-treba-ich-menit-ako-pneumatiky/", "/blog/autokoberce-na-zimu-je-potreba-je-menit-jako-pneumatiky/"],
  ["/blog/blog/", "/blog/elektricka-skoda-teren-autokoberce-na-mieru/"],
  ["/blog/bmw-x5-xdrive30d-4-zony-opotrebenia-co-predajca-nepovie/", "/blog/4-mista-v-interieru-bmw-x5-o-kterych-vam-prodejce-nerekne/"],
  ["/blog/box-do-kufra-auta-alebo-kufrova-rohoz-co-kupit-skor/", "/blog/box-do-kufru-auta-nebo-rohoz-do-kufru-co-koupit-driv/"],
  ["/blog/byd-yuan-plus-autokoberce-ochrana-interieru/", "/blog/byd-yuan-plus-ochrana-interieru-od-prvniho-dne/"],
  ["/blog/kedy-autokoberce-s-logom-v-luxusnom-aute-posobia-lacno/", "/blog/kdy-autokoberce-s-logem-v-luxusnim-aute-pusobi-lacine/"],
  ["/blog/mercedes-benz-trieda-v-ochrana-velkoryseho-interieru-2/", "/blog/mercedes-benz-trida-v-ochrana-velkoryseho-interieru/"],
  ["/blog/myty-o-baterii-jazdeneho-elektromobilu/", "/blog/3-myty-o-baterii-ojeteho-elektromobilu/"],
  ["/blog/oplati-sa-kupit-nove-auto-skladom-alebo-na-objednavku/", "/blog/vyplati-se-koupit-nove-auto-skladem-nebo-na-objednavku/"],
  ["/blog/organizer-do-kufra-skladaci-pevny-alebo-sietka/", "/blog/organizer-do-kufru-skladaci-pevny-nebo-sitka/"],
  ["/blog/vyhody-luxusnych-autokobercov/", "/blog/vyhody-luxusnich-autokobercu/"],
  ["/blog/xiaomi-yu9-dojazd-1500-km-elektromobil/", "/blog/xiaomi-yu9-dojezd-1-500-km-a-co-to-znamena-pro-vas/"],
  ["/blog/zanik-autosalonu-v-zeneve-3-myty-o-kupe-auta/", "/blog/zanik-autosalonu-v-zeneve-3-myty-o-koupi-auta/"],
];

/** Cesta stránky (bez dopytu) -> { sk, cz }; null, keď stránka protějšok nemá. */
export function cestyStranky(cesta, jeSk) {
  const c = cesta === "/index.php" ? "/" : cesta;
  if (ROVNAKE.includes(c)) return { sk: c, cz: c };
  const par = PARY.find((p) => p[jeSk ? 0 : 1] === c);
  return par ? { sk: par[0], cz: par[1] } : null;
}

export const VSETKY_PARY = ROVNAKE.map((c) => [c, c]).concat(PARY);
