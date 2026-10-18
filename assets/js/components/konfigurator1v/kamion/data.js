// Dáta konfigurátora kamiónov (SK 640): materiály, farby, lemovania, nášivky, nite — VYGENEROVANÉ zo schváleného
// artefaktu kamiony-app (data/konfig-data.json = dátové bloky konfigurator.gen.jsx MATERIALS, LEMOVANIE, NASIVKY,
// NITE_FARBY; 18. 10. 2026). Obrázky = tie isté súbory, ktoré dnes používa React (IMG_BASE + zdrojový súbor), žiadne nové.
// Vozidlá sa NEduplikujú: truck-brands.js (TRUCK_VEHICLES, TRUCK_FIELD_ORDER) je ten istý zdroj ako React CONFIG.
// Ceny tu NIE SÚ (číta ich shoptet.js zo živých selectov), okrem prečiarknutých „samostatne“ cien, ktoré Shoptet nemá
// (konfigurator.gen.jsx FALLBACK_PRICES_EUR: NASIVKY_SAMO, TAPACIR_SAMO, NASIVKA_DVERE_SAMO; React robí to isté).
// Pri importe sa nič nespúšťa (len konštanty).
import { TRUCK_VEHICLES, TRUCK_FIELD_ORDER } from "../../../truck-konfigurator/truck-brands.js";

/** Priečinok obrázkov konfigurátora na webe (konfigurator.gen.jsx IMG_BASE). */
export const IMG_BASE = "https://cdn.myshoptet.com/usr/www.luxurycardesign.cz/user/documents/upload/assets/config/";
const img = (f) => IMG_BASE + f;

/** Prečiarknuté „samostatne“ ceny (EUR) — v Shoptete nie sú, natvrdo v konfigurator.gen.jsx FALLBACK_PRICES_EUR. */
export const PRECIARKNUTE_EUR = { nasivky_balik: 140, nasivky_sofer_spolujazdec: 70, nasivky_len_stred: 70, tapacir: 179, nasivka_na_dverach: 89 };

/** Fotka tapacíru dverí (React krok 5/A, IMG_BASE) — celý panel dverí 3:2, nášivka v strede výplne (~43 % / 45 %). */
export const FOTKA_DVERI = img("t894b009d54832cbd.png");

/**
 * Fotka kabíny zhora so všetkými tremi nášivkami (krok 5, návrh C schválený 18. 10. 2026) — súbor v assets/img/1v/
 * (adresa = OBRAZKY_1V z ../ctx.js + tento názov; ui.js). Fotka zákazníka (logo Scania), v UI vždy „Ilustračná fotka“.
 * 1160 × 870 (4:3); nášivky: šofér 33,8 % / 59 %, spolujazdec 73,6 % / 59 %, stredový koberec 53,1 % / 80,7 %.
 */
export const FOTKA_KABINY_NASIVKY = "kamion-nasivky-kabina.jpg";

/** Materiály v poradí Shoptetu; farby v poradí kódu (karta = full prvej farby, ako MATERIALS[mat][0].full). */
export const MATERIALY = [{"nazov":"Prémiová syntetická koža – jednofarebná","slug":"jednofarebna","farby":[["10G","t9e11360c8b5b33f2.jpg","t3e47c28253d486bf.jpg"],["11G","tba7fac3d76222872.jpg","t24b3f5cb859e77d3.jpg"],["12G","t78c3b5a4253754a4.jpg","t7a764b16123d98a3.jpg"],["13G","t82d11db508e728b1.jpg","ta153addec6a8283e.jpg"],["1G","ta8e3c50870857155.jpg","t8394fa2fda6eb360.jpg"],["2G","t2994f34d4cd53d21.jpg","t02c7c9a827a2bbc9.jpg"],["3G","t6d6715bc70f7d5f4.jpg","t0f8b0f0f7051239a.jpg"],["4G","t3b3c512732d75fa7.jpg","tf755c78a1ce50400.jpg"],["5G","tac00c31fd8a5f219.jpg","t51297446ab803c6e.jpg"],["6G","taea811c46742e0f3.jpg","tbc00e77770ca0c02.jpg"],["7G","tb63fbc08be84eb79.jpg","t8d52d44ad793c32f.jpg"],["8G","tcdc846ecc726e2a8.jpg","t6e91f296f502914d.jpg"],["9G","tcd5917f59b3a5564.jpg","td7dcfb1aa59d4d4e.jpg"]]},{"nazov":"Prémiová syntetická koža – prešívaná","slug":"presivana","farby":[["10","te9ac7f5351b68e09.jpg","te69da20aa41cfff3.jpg"],["11","t353babf7c464a09d.jpg","te336d117c5367d5e.jpg"],["12","t1f1c099993a3d774.jpg","t8131265bc4c64fbf.jpg"],["13","t8b516a6d49d330b5.jpg","t0b38d0fda7a57d1f.jpg"],["14","tfe31ca1dba5c2610.jpg","t17ff27defa0022b9.jpg"],["15","t62bc83cf8d7026cb.jpg","tfb06efd104e1fcc0.jpg"],["2","t5f8ab6691d211623.jpg","t9b1c37eeb17d3693.jpg"],["3","t1a30d3a35534feec.jpg","t1fdf04e79a61d5ed.jpg"],["4","t03b5a82f305ee506.jpg","tb91308eb655ef52e.jpg"],["5","tc6a4c024068862d2.jpg","t2d8d9f4c253ba6b2.jpg"],["6","t886fcd9fc535d354.jpg","tc464971278671ee7.jpg"],["7","t1f7a82cd181a914b.jpg","te679cce95c0c10e5.jpg"],["8","t4b3c9bf0ab291c76.jpg","t668402f24e15e4ce.jpg"],["9","t2f607992556a7d2d.jpg","t843a05ba466bdbb3.jpg"]]},{"nazov":"Prémiová syntetická koža – tónovaná","slug":"tonovana","farby":[["PES2","t77244e4fd2331431.jpg","tf1503ccd74e74267.jpg"],["PES3","tc132f79a910cedaf.jpg","t0a3c866cebb0f7ea.jpg"],["PES4","te8f61760afc6a0b7.jpg","t97b51774dce7522c.jpg"],["PES5","tf0381ae5cd0f4595.jpg","t2ce1313e82b0bf9c.jpg"],["PES6","t4225053cfbd5ea08.jpg","t77e5e3e37e15eba5.jpg"]]},{"nazov":"Mikrosemiš – jednofarebný","slug":"mikro-jedno","farby":[["1NUB","t74e84ff1cbef77d2.jpg","t4e39131904cb5a1c.jpg"],["2NUB","t4c8fac5b2e089427.jpg","ta7a6d458feb9b6cc.jpg"],["3NUB","t9f2ce71b9ea9a0cb.jpg","t973b34223983eacc.jpg"],["4NUB","t7e490684c5cfb3d7.jpg","t115d67261c502d47.jpg"],["5NUB","ta3c1e0db99eb4409.jpg","te6d976d441141a05.jpg"]]},{"nazov":"Mikrosemiš – dvojfarebný","slug":"mikro-dvoj","farby":[["2N","t14ffc532d58baf8c.jpg","t53ca6a0f2fcb0a10.jpg"],["3N","tbba36859f6967aed.jpg","t02a642474cb8c6bd.jpg"],["4N","t74392c518fc6ec1b.jpg","t69943bafb228c8ad.jpg"],["5N","t52b6c137891c5863.jpg","t7bbced787e4a7daf.jpg"],["6N","tb0ae3048c30a937f.jpg","t7400d0be7ba993c1.jpg"],["7N","tb7a10c5ed6ad891c.jpg","t0a63d8c78141af3b.jpg"]]}].map((m) => {
  const farby = m.farby.map((f) => ({ kod: f[0], swatch: img(f[1]), full: img(f[2]) }));
  return { nazov: m.nazov, slug: m.slug, farby, karta_obrazok: farby[0].full };
});

/** Lemovania: kód, meno (= LEMOVANIE gen.jsx — ide do poznámky objednávky), obrázky. */
export const LEMOVANIE = [["01","Čierna + Béžová","t8cd5b7dd871c7d37.png","t353eac4f6e2fed27.png"],["02","Čierna + Šedá","t5d2273518a7d03f8.png","t65dfa103b6fc5c04.png"],["03","Čierna + Grafitová","tb23f7f2a9337c47d.png","t718fe120effd7b36.png"],["04","Čierna + Červená","t08b2c2399b439af8.png","t0b02d8db6ee469d1.png"],["05","Čierna + Bordová","t235c691ebe554953.png","tcac87c5af6e1c9a8.png"],["06","Čierna + Modrá","td153a83b797b61f5.png","tda3375b84f071e71.png"],["07","Čierna + Zelená","td19269a158a9fe4a.png","t9e4085eceed2bea8.png"],["08","Čierna + Hnedá","teabe8146719a305d.png","t08325b69dc4beed4.png"],["09","Čierna + Čierna","tcd8a3bba4fa4b28e.png","t47458e405e4075ef.png"],["10","Béžová + Modrá","t7cdffaf0dc4420e9.png","tad5d5768523d63dc.png"],["11","Béžová + Hnedá","tfaeac0c543f1b878.png","tcc199b3b006ab1a3.png"],["12","Béžová + Červená","tc8cc61dfa37ba5db.png","ta45e72b6236e2b1e.png"],["13","Hnedá + Béžová","t961e3c232fb27023.png","ta54d3d1d54081e28.png"]].map((l) => ({ kod: l[0], meno: l[1], swatch: img(l[2]), full: img(l[3]) }));

/** Všetky nášivky kódu; ponúknu sa len tie, ktoré sú v selectoch Shoptetu (shoptet.js povoleneMotivy). */
export const NASIVKY = [["H1","t97aba50e89494538.png","tae6af2a2426f3396.png"],["H2","tefdfbcaa49c586de.png","t88cd60ff4179cd60.png"],["H3","t3a7f2ecdc2ae06f3.png","te5281b4dc864e342.png"],["H4","t782b9d55b443142b.png","tfd63103ea75e08a4.png"],["H5","td99b76208d7d97db.png","t953ee53e6ef7fc50.png"],["H6","tdc6ca6b6c655f185.png","t835e56cd8cff04c2.png"],["H7","t13e4e576fa722665.png","t18bba598907f12c0.png"],["H8","tfe8d5bf5f95cae08.png","t8d4cbf08d914fcd7.png"],["H9","tbe9ef9df3cc78198.png","t02065da04d45b21c.png"],["H10","t023eea1802bc4a3a.png","t152d539643aec880.png"],["H11","t362fc49cb1cad159.png","t3b3203796236c251.png"],["H12","t18e93d5020621814.png","t3f7859d64f7a43be.png"],["H15","ta80db3a2f86e9750.png","tc731364614d4135d.png"],["H16","t80f7f32aca53fad7.png","t8625f632250c0b3c.png"],["H17","tef23e2e366c78310.png","t3c8c42b6dcd0ecc0.png"],["H18","t7e67f725075ea44b.png","t1dc00f58e2c8fd92.png"],["H19","tbaed0fcf26e0755f.png","t5d1a5bb38fb3d278.png"],["H21","ta7694a7fb98ce642.png","t763e4244ae30e974.png"],["H23","t0af786a945838e5d.png","t89ffba643e72778b.png"],["H24","t1e1ec0dfc2602d62.png","t58c10a630f2960c5.png"],["H25","ta8f936f019bebe61.png","t8cc35e39496af51a.png"],["H26","t88c7848a702e5745.png","t172d8e7f5f88700d.png"],["N1","t39963bf133e59132.png","tbe16336055795dd3.png"],["N2","t6dc097b8e05eddff.png","t0c37994928748c3d.png"],["N33","t9095f5d3730395c4.png","t23288d73822219ed.png"]].map((n) => ({ kod: n[0], thumb: img(n[1]), full: img(n[2]) }));
/** Keď select druhu nášivky na stránke nie je: zoznam schváleného artefaktu (v Shoptete sú zapnuté len tieto). */
export const NASIVKY_ZALOHA = ["H19", "H21"];

/** Farby nite v poradí ponuky: kód, meno (Shoptet), farba čipu (NITE_FARBY.color). */
export const NITE = [["2999","Čierna","#2a2a2a"],["2901","Strieborná","#b0b0b0"],["3738","Svetlo sivá","#c0c0c0"],["3546","Béžová","#dcc8a8"],["3617","Svetlohnedá","#c9a06a"],["3504","Tmavohnedá","#5a3520"],["3501","Horčicová","#c49a40"],["2824","Červená","#c82030"],["2866","Fialová","#6b3a6b"],["3842","Modrá","#3a6a9a"],["2840","Zelená","#4a8a4a"]].map((n) => ({ kod: n[0], meno: n[1], hex: n[2] }));

/** Polia vozidla (label a placeholder kódu; texty UI sú v texty.js). */
export const POLIA = {"prevodovka":{"label":"Typ prevodovky","placeholder":"Vyberte typ prevodovky..."},"sedadlo":{"label":"Typ sedadla spolujazdca","placeholder":"Vyberte typ sedadla spolujazdca..."},"zasuvky":{"label":"Počet zásuviek (šuplíkov)","placeholder":"Vyberte počet zásuviek (šuplíkov)..."},"brzda":{"label":"Typ parkovacej (ručnej) brzdy","placeholder":"Vyberte typ parkovacej (ručnej) brzdy..."},"podlaha":{"label":"Typ podlahy","placeholder":"Vyberte typ podlahy..."}};
export const PORADIE_POLI = TRUCK_FIELD_ORDER;

/** Kamión s tapacírom dverí = „(TIR)“ v kľúči značky (gen.jsx doorUpholsteryAvailable). */
export const jeTir = (kluc) => /\(TIR\)/i.test(kluc || "");

/**
 * Značky z TRUCK_VEHICLES v tvare artefaktu: { kluc, meno, typ, tapacir_dveri_dostupny, modely: [{ nazov, polia,
 * povinne_polia, auto_vybrane }] } — polia = len tie s voľbami (poradie TRUCK_FIELD_ORDER), povinné = všetky
 * prítomné, auto_vybrane = polia s jedinou voľbou (React ich vyplní sám).
 */
export function znacky(vozidla) {
  const V = vozidla || TRUCK_VEHICLES;
  return Object.keys(V).map((kluc) => {
    const tir = jeTir(kluc);
    return {
      kluc,
      meno: kluc.replace(/\s*\((TIR|dodávka)\)\s*$/i, ""),
      typ: tir ? "kamion" : "dodavka",
      tapacir_dveri_dostupny: tir,
      modely: Object.keys(V[kluc]).map((nazov) => {
        const c = V[kluc][nazov] || {};
        const polia = {}, auto = {};
        TRUCK_FIELD_ORDER.forEach((p) => {
          if (Array.isArray(c[p]) && c[p].length) { polia[p] = c[p].slice(); if (c[p].length === 1) auto[p] = c[p][0]; }
        });
        return { nazov, polia, povinne_polia: Object.keys(polia), auto_vybrane: auto };
      }),
    };
  });
}
export const ZNACKY = znacky();
