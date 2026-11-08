// Štýly stránky triedy V. Sú v samostatnej časti, aby ostatné stránky webu nesťahovali ani bajt navyše. Všetko pod body.lcd-vclass.
// Úvodná časť čierna so zlatým písmom ako hlavička webu, krok „Vaše auto“ rovnaký ako v konfigurátore 1V: zlaté prepínače,
// zlatý rám selectov, zelené tlačidlo = kam chceme klik, chýbajúci údaj = červený rám.

/** Obsah pod konfigurátorom na počítači: blok LCD-HOME má špecificitu id, tak aj tu musí byť id koreňa. Telefón sa nesmie zmeniť. */
const O = "body.lcd-vclass.lcd-1v :is(#p1v-vclass-1,#p1v-vclass-2)";
/** Sekcia podľa mena, aby sa rady pozadí a farieb dali čítať. */
const S = (...m) => O + " :is(" + m.map((x) => '[data-lcd-sekcia="' + x + '"]').join(",") + ")";

export const CSS = `
body.lcd-vclass{--lv-ink:#14110c;--lv-line:#d9d4c6;--lv-gold:#c49b31;--lv-gt:#7c5f16;--lv-mute:#6e6752;--lv-text:#3d3728;--lv-sand:#f6f4ef;--lv-zel:#1f7a52;--lv-zg:linear-gradient(100deg,#1d6b4a,#1f7a52 42%,#1f7350);--lv-zl:linear-gradient(100deg,#8f7020,#e6c877 48%,#c49b31);--lv-disp:"Exo 2",system-ui,sans-serif;--lv-body:"Source Sans 3",system-ui,sans-serif}
body.lcd-vclass .p-image-wrapper>*:not(#lcd-vclass-nakres){display:none!important}
body.lcd-vclass .p-info-wrapper>*:not(#lcd-vclass){display:none!important}
body.lcd-vclass .p-info-wrapper{opacity:1!important;visibility:visible!important;display:block!important}
body.lcd-vclass .p-detail-inner-header{display:block;margin:0;padding:0;width:auto;background:none;border:0}
body.lcd-vclass .p-detail-inner{max-width:none}

#lcd-vclass-hero{position:relative;background:#0d0b08;color:#fff;margin-bottom:0;overflow:hidden;width:var(--lv-vw,100%);margin-left:calc((100% - var(--lv-vw,100%))/2)}
#lcd-vclass-hero *{box-sizing:border-box}
#lcd-vclass-hero .lh-in{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:clamp(24px,5vw,72px);align-items:center;max-width:1280px;margin:0 auto;padding:clamp(24px,3vw,40px) 24px}
#lcd-vclass-hero .lh-tx{grid-column:1;grid-row:1;position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:0}
#lcd-vclass-hero .lh-g{grid-column:2;grid-row:1;position:relative;height:min(76vh,660px);aspect-ratio:4/5;border-radius:14px;overflow:hidden;background:#000}
#lcd-vclass-hero h1{display:block!important;margin:0;font:800 clamp(34px,4.4vw,60px)/1.04 var(--lv-disp);text-transform:uppercase;color:#fff;text-align:left}
#lcd-vclass-hero h1 span{display:block;background:var(--lv-zl);-webkit-background-clip:text;background-clip:text;color:transparent}
#lcd-vclass-hero .lh-p{margin:0;max-width:30em;font:400 18px/1.45 var(--lv-body);color:#d9d4c6}
#lcd-vclass-hero .lh-c{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 8px;color:#fff}
#lcd-vclass-hero .lh-c small{font:600 16px var(--lv-body);color:#d9d4c6}
#lcd-vclass-hero .lh-c b{font:800 clamp(30px,3vw,42px)/1 var(--lv-disp)}
#lcd-vclass-hero .lh-c span{flex:1 0 100%;font:600 16px/1.35 var(--lv-body);color:#e6c877}
#lcd-vclass-hero .lh-cta{align-self:flex-start;padding:16px 34px;border:0;border-radius:10px;background:var(--lv-zg);color:#fff;font:800 16px var(--lv-disp);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;box-shadow:0 14px 30px -14px rgba(47,156,104,.8)}
#lcd-vclass-hero button:focus-visible{outline:3px solid #e6c877;outline-offset:2px}
/* Vršok na počítači (Michal 7. 11. 2026: splývalo to s hlavičkou, text bol stiesnený, na monitore je miesta dosť).
   Piesočná strana s textom oddelí vršok od čiernej hlavičky, vpravo je len jedno video po okraj obrazovky.
   Video sa nenaťahuje nad svoje rozlíšenie, preto najviac 900 px. Nadpis drží pravidlo webu, preto !important. */
@media (min-width:992px){
  #lcd-vclass-hero{background:var(--lv-sand);color:var(--lv-ink)}
  #lcd-vclass-hero .lh-in{max-width:none;grid-template-columns:minmax(0,1fr) min(46vw,880px);gap:0;padding:0;align-items:stretch;height:clamp(640px,calc(100vh - 74px),1040px)}
  /* video v zaoblenom ráme s okrajom, nie po kraj obrazovky (Michal 8. 11. 2026) */
  #lcd-vclass-hero .lh-g{align-self:stretch;height:auto;aspect-ratio:auto;margin:clamp(24px,4vh,48px) clamp(24px,3vw,56px) clamp(24px,4vh,48px) 0;border-radius:22px;box-shadow:0 30px 60px -32px rgba(13,11,8,.6)}
  #lcd-vclass-hero .lh-pauza{right:auto;left:14px}
  #lcd-vclass-hero .lh-tx{justify-content:center;gap:0;padding:clamp(56px,7vh,90px) clamp(40px,6vw,150px) clamp(32px,4vh,56px)}
  #lcd-vclass-hero h1{margin-bottom:clamp(22px,3.4vh,38px);font-size:clamp(36px,4.1vw,112px)!important;line-height:1.1!important;color:var(--lv-ink)}
  #lcd-vclass-hero h1 span{background:linear-gradient(100deg,#8a6a1c,#c49b31 55%,#8a6a1c);-webkit-background-clip:text;background-clip:text;color:transparent}
  #lcd-vclass-hero .lh-p{max-width:34em;margin-bottom:clamp(32px,5vh,60px);font-size:clamp(18px,1.15vw,26px);line-height:1.55;color:var(--lv-text)}
  #lcd-vclass-hero .lh-dol{display:flex;align-items:center;justify-content:space-between;gap:32px;padding:0}
  #lcd-vclass-hero .lh-c{min-width:0;gap:0 10px;color:var(--lv-ink)}
  #lcd-vclass-hero .lh-c small{font-size:clamp(16px,1vw,22px);color:var(--lv-text)}
  #lcd-vclass-hero .lh-c b{font-size:clamp(40px,3.4vw,84px)}
  #lcd-vclass-hero .lh-c span{margin-top:6px;font-size:clamp(15px,.95vw,21px);color:var(--lv-gt)}
  #lcd-vclass-hero .lh-cta{flex:none;align-self:center;padding:clamp(18px,2.4vh,26px) clamp(30px,2.6vw,60px);font-size:clamp(16px,1vw,22px)}
}
@media (min-width:992px) and (max-width:1279px){
  #lcd-vclass-hero .lh-in{grid-template-columns:minmax(0,1fr) 44vw}
  #lcd-vclass-hero h1{font-size:clamp(32px,3.7vw,46px)!important}
  #lcd-vclass-hero .lh-dol{flex-wrap:wrap;gap:16px}
}
#lcd-vclass-hero .lh-v{position:absolute;inset:0;display:block;width:100%!important;height:100%!important;max-width:none!important;margin:0;object-fit:cover;background:#0d0b08;border:0!important;border-radius:0!important;box-shadow:none!important}
#lcd-vclass-hero .lh-pauza{position:absolute;right:14px;bottom:14px;z-index:2;width:40px;height:40px;padding:0;border:1px solid rgba(230,200,119,.55);border-radius:50%;background:rgba(13,11,8,.62) linear-gradient(90deg,#e6c877 0 3px,transparent 3px 8px,#e6c877 8px 11px) center/11px 14px no-repeat;cursor:pointer}
#lcd-vclass-hero .lh-pauza.lh-hraj{background:rgba(13,11,8,.62) conic-gradient(from 60deg at 0 50%,#e6c877 0 60deg,transparent 0) 15px center/13px 16px no-repeat}

#lcd-vclass-cesta{max-width:1280px;margin:0 auto;padding:clamp(22px,3vw,34px) 24px 6px}
#lcd-vclass-cesta .lv-c-ol{display:flex;list-style:none;margin:0;padding:0;counter-reset:none}
#lcd-vclass-cesta li{position:relative;flex:1 1 0;min-width:0;margin:0;padding:0;text-align:center}
#lcd-vclass-cesta li::before{content:"";position:absolute;top:16px;left:calc(-50% + 22px);right:calc(50% + 22px);height:2px;background:var(--lv-line)}
#lcd-vclass-cesta li:first-child::before{display:none}
#lcd-vclass-cesta li.lv-hot::before,#lcd-vclass-cesta li.lv-teraz::before{background:var(--lv-zel)}
#lcd-vclass-cesta button{all:unset;display:inline-flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;max-width:100%}
#lcd-vclass-cesta button:disabled{cursor:default}
#lcd-vclass-cesta i{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#e4e0d4;color:var(--lv-mute);font:800 15px var(--lv-disp);font-style:normal}
#lcd-vclass-cesta span{font:700 13px/1.2 var(--lv-disp);letter-spacing:.06em;text-transform:uppercase;color:var(--lv-mute)}
#lcd-vclass-cesta .lv-hot i{background:var(--lv-zg);color:#fff}
#lcd-vclass-cesta .lv-hot span{color:var(--lv-ink)}
#lcd-vclass-cesta .lv-teraz i{background:var(--lv-zl);color:#16120a;box-shadow:0 0 0 4px rgba(196,155,49,.2)}
#lcd-vclass-cesta .lv-teraz span{color:var(--lv-gt)}
#lcd-vclass-cesta button:focus-visible i{outline:3px solid var(--lv-gold);outline-offset:2px}

#lcd-vclass-nakres{position:sticky;top:96px;min-width:0;padding:16px 16px 12px;border-radius:14px;background:var(--lv-sand)}
#lcd-vclass-nakres .lv-n-h{font:800 15px var(--lv-disp);letter-spacing:.08em;text-transform:uppercase;color:var(--lv-ink);margin:0 0 10px;text-align:center}
#lcd-vclass-nakres .lv-pl{display:flex;flex-direction:column;align-items:center;gap:6px;width:min(100%,calc((100vh - 200px)/1.96));margin:0 auto}
#lcd-vclass-nakres canvas{display:block;height:auto;max-width:100%}
#lcd-vclass-nakres .lv-pred{width:100%}
#lcd-vclass-nakres .lv-zad{width:74.5%}
#lcd-vclass-nakres .lv-pop{margin:8px 0 0;text-align:center;font:400 14px var(--lv-body);color:var(--lv-mute)}
#lcd-vclass-nakres.lv-uvod .lv-n-set,#lcd-vclass-nakres:not(.lv-uvod) .lv-n-f{display:none}
#lcd-vclass-nakres .lv-n-f{margin:0}
#lcd-vclass-nakres .lv-n-f img{display:block;width:100%;height:auto;border-radius:10px}
#lcd-vclass-nakres .lv-n-f figcaption{margin:12px 6px 4px;text-align:center;font:400 16px/1.4 var(--lv-body);color:var(--lv-text)}

#lcd-vclass{font:400 16px/1.45 var(--lv-body);color:var(--lv-text);min-width:0}
#lcd-vclass *{box-sizing:border-box}
#lcd-vclass .lv-kr{border:1px solid var(--lv-line);border-radius:12px;background:var(--lv-sand);margin-bottom:9px}
#lcd-vclass .lv-kr.lv-ho{background:#fff}
#lcd-vclass .lv-ot{background:#fff;border-color:var(--lv-gold);border-top-width:3px;box-shadow:0 14px 34px -22px rgba(143,112,32,.6);padding:20px 26px 24px}
#lcd-vclass .lv-k{font:700 12px var(--lv-disp);letter-spacing:.16em;text-transform:uppercase;color:var(--lv-gt)}
#lcd-vclass .lv-t{font:800 clamp(24px,2.2vw,30px)/1.12 var(--lv-disp);text-transform:uppercase;color:var(--lv-ink);margin:8px 0 8px}
#lcd-vclass .lv-ciara{display:block;width:44px;height:3px;border-radius:2px;background:var(--lv-zl);margin:0 0 16px}
#lcd-vclass .lv-p{color:var(--lv-mute);margin:-6px 0 12px;font-size:16px}
#lcd-vclass .lv-r{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px;width:100%;text-align:left;background:none;border:0;font:inherit;color:inherit;cursor:default}
#lcd-vclass .lv-ho .lv-r{cursor:pointer}
#lcd-vclass .lv-c-k{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:800 13px var(--lv-disp);background:#e4e0d4;color:#48412f}
#lcd-vclass .lv-ho .lv-c-k{background:var(--lv-zg);color:#fff}
#lcd-vclass .lv-r-t b{display:block;font:700 15px/1.25 var(--lv-disp);color:var(--lv-ink)}
#lcd-vclass .lv-r-t small{display:block;color:var(--lv-mute);font-size:14px;line-height:1.3}
#lcd-vclass .lv-z{font:800 12px var(--lv-disp);letter-spacing:.1em;color:var(--lv-gt);text-transform:uppercase}
#lcd-vclass .lv-rr{display:flex;flex-direction:column;align-items:flex-end;gap:3px;text-align:right}
#lcd-vclass .lv-rc{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:baseline;gap:0 8px;white-space:nowrap}
#lcd-vclass .lv-rc b{font:800 16px/1.2 var(--lv-disp);color:var(--lv-ink)}
#lcd-vclass .lv-rc s{font:600 14px/1.2 var(--lv-body);color:#b3261e}
#lcd-vclass .lv-rc-0{font:600 14px/1.2 var(--lv-body);color:var(--lv-mute)}

#lcd-vclass .lv-pole{margin:0 0 16px;min-width:0;border-radius:12px}
#lcd-vclass .lv-pole.lv-chyba .lv-l{color:#b3261e}
#lcd-vclass .lv-pole.lv-chyba .lv-s1,#lcd-vclass .lv-pole.lv-chyba .lv-sel{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}
#lcd-vclass .lv-chyba[data-pole-w]:not(.lv-pole){outline:2px solid #c0392b;outline-offset:4px;border-radius:12px}
#lcd-vclass .lv-l{display:block;margin:0 0 8px;font:700 16px/1.25 var(--lv-body);color:var(--lv-ink)}
#lcd-vclass .lv-i{display:inline-grid!important;place-items:center;width:22px!important;height:22px!important;min-width:0!important;min-height:0!important;margin:-3px 0 -3px 4px!important;padding:0!important;border:1.5px solid #b8912f!important;border-radius:50%!important;background:#fff!important;box-shadow:none!important;color:#8a6a1c!important;font:italic 700 14px/1 Georgia,serif!important;vertical-align:middle;cursor:pointer;position:relative;transform:none!important}
#lcd-vclass .lv-i::after{content:"";position:absolute;inset:-9px}
#lcd-vclass .lv-pole.lv-chyba .lv-i{border-color:#c0392b;color:#b3261e}
#lcd-vclass .lv-dl-w.lv-chyba:not([data-pole-w]){outline:2px solid #c0392b;outline-offset:4px;border-radius:12px}
.lv-info{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;background:rgba(13,11,8,.72);overscroll-behavior:contain}
.lv-info-p{position:relative;width:min(520px,100%);max-height:calc(100vh - 32px);overflow:hidden;padding:18px;border-radius:14px;background:#fff;color:#14110c;font:400 16px/1.4 "Source Sans 3",Arial,sans-serif}
.lv-info-p img{display:block;width:100%;height:auto;max-height:52vh;object-fit:contain;margin:0 0 12px;border-radius:8px;background:#f5f3ee}
.lv-info-p b{display:block;margin:0 0 6px;font-size:18px}
.lv-info-p p{margin:0 0 8px}
.lv-info-p a{color:#8a6a1c;font-weight:700}
.lv-info-x{position:absolute;right:8px;top:8px;width:38px;height:38px;padding:0;border:0;border-radius:50%;background:rgba(13,11,8,.75);color:#fff;font:400 24px/1 Arial,sans-serif;cursor:pointer}
#lcd-vclass .lv-hr{border:0;border-top:2px dashed #e4dfd0;margin:2px 0 16px}
#lcd-vclass .lv-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px;align-items:end}
#lcd-vclass .lv-fix{display:block;padding:12px 14px;border:1px solid var(--lv-line);border-radius:9px;background:var(--lv-sand);font:600 16px var(--lv-body);color:var(--lv-ink)}
#lcd-vclass .lv-sel{display:block;width:100%;max-width:none;height:52px;margin:0;padding:0 36px 0 14px;border:2px solid #8f7020;border-radius:12px;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='9' viewBox='0 0 14 9'%3E%3Cpath d='M1 1l6 6 6-6' fill='none' stroke='%238f7020' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 14px center;font:700 16px var(--lv-body);color:var(--lv-ink);text-overflow:ellipsis;cursor:pointer;-webkit-appearance:none;appearance:none}
#lcd-vclass .lv-sel.lv-pr{background-color:#fbf5e3;color:var(--lv-gt);box-shadow:0 0 0 3px rgba(196,155,49,.2)}
#lcd-vclass .lv-veta{margin:-8px 0 16px;font-size:15px;line-height:1.4;color:var(--lv-mute)}
#lcd-vclass .lv-veta a{color:var(--lv-gt);font-weight:700;white-space:nowrap}
#lcd-vclass .lv-pozn{margin:0 0 12px;padding:9px 12px;border-radius:9px;background:#fbf7ea;border:1px solid #e9dcae;font-size:15px;line-height:1.4;color:var(--lv-text)}
#lcd-vclass .lv-dv{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:10px 12px;border-radius:10px;background:#eef6f1;border:1px solid #bcdcca;font-size:15px;line-height:1.3;color:var(--lv-ink)}
#lcd-vclass .lv-dv button{flex:none;padding:8px 12px;border:0;border-radius:9px;background:var(--lv-zl);color:#16120a;font:800 13px var(--lv-disp);cursor:pointer}
#lcd-vclass .lv-odp{position:absolute;left:0;right:0;top:0;z-index:1;padding:2px 0;background:var(--lv-zg);color:#fff;font:700 12px/1.3 var(--lv-disp);font-style:normal}
#lcd-vclass .lv-rozpis{margin:0 0 10px;padding:9px 12px;list-style:none;border:1px solid var(--lv-line);border-radius:10px;background:var(--lv-sand)}
#lcd-vclass .lv-rozpis li{display:flex;justify-content:space-between;gap:12px;margin:2px 0;padding:0;font-size:15px;line-height:1.4}
#lcd-vclass .lv-rozpis b{flex:none;font:700 15px var(--lv-disp);color:var(--lv-ink)}
#lcd-vclass .lv-dod{margin:10px 0 0;text-align:center;font-size:15px;color:var(--lv-mute)}
#lcd-vclass .lcd1v-druha{margin:0;padding:0;border:0;background:none;box-shadow:none}
#lcd-vclass .lv-cc{position:relative;overflow:hidden;margin:0 0 14px;padding:20px 22px 16px;border:1px solid #8a6a1c;border-radius:16px;background:radial-gradient(130% 110% at 100% 0,#30281a,#0d0b08 62%);box-shadow:0 22px 44px -26px rgba(13,11,8,.85);color:#d9d4c6}
#lcd-vclass .lv-cc[hidden]{display:none}
#lcd-vclass .lv-cc-h{display:flex;align-items:center;gap:9px;margin:0 0 14px;font:800 14px/1.2 var(--lv-disp);letter-spacing:.14em;text-transform:uppercase;color:#e6c877}
#lcd-vclass .lv-cc-h::before{content:"✓";display:grid;place-items:center;flex:none;width:24px;height:24px;border-radius:50%;background:var(--lv-zg);color:#fff;font:800 14px/1 var(--lv-body);letter-spacing:0}
#lcd-vclass .lv-cc-g{display:flex;align-items:center;justify-content:space-between;gap:16px}
#lcd-vclass .lv-cc-c{min-width:0}
#lcd-vclass .lv-cc-c small{display:block;margin:0 0 10px;font:400 15px/1.3 var(--lv-body);color:#b9b3a4}
#lcd-vclass .lv-cc-c small s{font-weight:700;color:#d9d4c6;text-decoration-color:#d0342f;text-decoration-thickness:2px}
#lcd-vclass .lv-cc-c span{display:block;margin:0 0 2px;font:700 13px var(--lv-disp);letter-spacing:.08em;text-transform:uppercase;color:#e6c877}
#lcd-vclass .lv-cc-c b{display:block;font:800 clamp(40px,5vw,52px)/1 var(--lv-disp);color:#fff}
#lcd-vclass .lv-cc-z{flex:none;display:grid;justify-items:center;gap:7px;text-align:center}
#lcd-vclass .lv-cc-s{display:grid;place-items:center;width:84px;height:84px;border-radius:50%;background:var(--lv-zl);box-shadow:0 0 0 3px #0d0b08,0 0 0 4px #c49b31;color:#16120a;font:800 23px/1 var(--lv-disp);font-style:normal;transform:rotate(-8deg)}
#lcd-vclass .lv-cc-p{font:800 15px/1.2 var(--lv-disp);color:#7fd4a6}
#lcd-vclass .lv-cc-1 .lv-cc-z,#lcd-vclass .lv-cc-1 .lv-cc-c small{display:none}
#lcd-vclass .lv-cc-l{display:grid;gap:5px;margin:16px 0 0;padding:12px 0 0;border-top:1px solid rgba(230,200,119,.28);list-style:none}
#lcd-vclass .lv-cc-l li{display:flex;justify-content:space-between;gap:12px;margin:0;padding:0;font:400 15px/1.35 var(--lv-body);color:#d9d4c6}
#lcd-vclass .lv-cc-l li::before{content:none}
#lcd-vclass .lv-cc-l b{flex:none;font-weight:700;color:#fff}
@media (max-width:480px){#lcd-vclass .lv-cc{padding:18px 16px 14px}#lcd-vclass .lv-cc-s{width:72px;height:72px;font-size:20px}}
#lcd-vclass .lcd1v-druha__dlazdica.lv-d2-k{display:grid!important;grid-template-columns:minmax(0,7fr) minmax(0,8fr)!important;gap:0!important;padding:0!important;margin:0 0 12px;overflow:hidden;border:1px solid #8a6a1c;border-radius:16px;background:radial-gradient(120% 90% at 100% 0,#2c2415,#0d0b08 64%);box-shadow:0 22px 44px -26px rgba(13,11,8,.85);color:#d9d4c6;cursor:pointer}
#lcd-vclass .lv-d2-v{position:relative;min-height:340px;background:#000;overflow:hidden}
#lcd-vclass .lv-d2-v video{position:absolute;inset:0;display:block;width:100%!important;height:100%!important;max-width:none!important;margin:0;object-fit:cover;border:0!important;border-radius:0!important}
#lcd-vclass .lv-d2-st{position:absolute;left:10px;right:10px;bottom:10px;padding:9px 12px;border-radius:10px;background:rgba(13,11,8,.74);color:#fff;font:600 14px/1.3 var(--lv-body)}
#lcd-vclass .lv-d2-st b{display:block;font:800 24px/1.1 var(--lv-disp);color:#e6c877}
#lcd-vclass .lv-d2-t{display:grid;gap:9px;align-content:start;min-width:0;padding:20px 20px 18px}
#lcd-vclass .lv-d2-top{margin:0;font:800 13px/1.2 var(--lv-disp);letter-spacing:.12em;text-transform:uppercase;color:#e6c877}
#lcd-vclass .lv-d2-nm{margin:0;font:800 clamp(26px,3vw,34px)/1.05 var(--lv-disp);color:#fff}
#lcd-vclass .lv-d2-po{margin:-5px 0 3px;font:700 14px/1.2 var(--lv-body);color:#e6c877}
#lcd-vclass .lv-d2 .lcd1v-druha__vrstvy{display:grid;gap:8px;margin:0;padding:10px 0 0;border-top:1px solid rgba(230,200,119,.28)}
#lcd-vclass .lv-d2 .lcd1v-druha__stitok{color:#e6c877}
#lcd-vclass .lv-d2 .lcd1v-druha__bod-t{color:#efeadf}
#lcd-vclass .lv-d2 .lcd1v-druha__viac,#lcd-vclass .lv-d2 .lcd1v-druha__viac-t,#lcd-vclass .lv-d2 .lcd1v-druha__viac-i{color:#e6c877;border-color:#e6c877}
#lcd-vclass .lv-d2-c{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:10px 0 2px;border-top:1px solid rgba(230,200,119,.28)}
#lcd-vclass .lv-d2-c span{font:700 13px var(--lv-disp);letter-spacing:.08em;text-transform:uppercase;color:#d9d4c6}
#lcd-vclass .lv-d2-c b{font:800 30px/1 var(--lv-disp);color:#fff}
#lcd-vclass .lv-d2 .lcd1v-druha__ano{width:100%;margin:2px 0 0}
#lcd-vclass .lv-d2 .lcd1v-druha__nie{width:100%}
@media (hover:hover){#lcd-vclass .lv-d2-k{transition:border-color .2s,box-shadow .2s}#lcd-vclass .lv-d2-k:hover{border-color:#e6c877;box-shadow:0 26px 50px -24px rgba(13,11,8,.95)}}
@media (max-width:640px){#lcd-vclass .lcd1v-druha__dlazdica.lv-d2-k{display:block!important;padding:0!important}#lcd-vclass .lv-d2-k .lv-d2-v{min-height:0;width:100%;aspect-ratio:4/5}#lcd-vclass .lv-d2-k .lv-d2-t{padding:16px 16px 16px}}
#lcd-vclass .lv-pi,#lcd-vclass .lv-seg{display:grid;gap:8px}
#lcd-vclass .lv-pi{grid-template-columns:1fr 1fr}
#lcd-vclass .lv-seg2{grid-template-columns:repeat(2,minmax(0,1fr))}
/* voľba musí vyzerať ako tlačidlo aj pred kliknutím (Michal 7. 11. 2026: „je to proste len biele“): krémová plocha, zlatý rám, spodná hrana a krúžok */
#lcd-vclass .lv-s1{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;min-height:54px;padding:10px;border:2px solid #957622;border-radius:11px;background:linear-gradient(180deg,#fffdf6,#f8efd5);color:var(--lv-ink);font:700 15px/1.2 var(--lv-disp);text-align:left;cursor:pointer;box-shadow:0 3px 0 #e2d2a4,0 7px 12px -8px rgba(143,112,32,.6);transition:transform .12s,box-shadow .12s,border-color .12s}
#lcd-vclass .lv-s1::before{content:"";flex:none;width:20px;height:20px;box-sizing:border-box;border:2px solid #8f7020;border-radius:50%;background:#fff}
#lcd-vclass .lv-s1:active{transform:translateY(2px);box-shadow:0 1px 0 #e2d2a4}
#lcd-vclass .lv-s1[aria-pressed=true]{border-color:#8f7020;background:var(--lv-zl);color:#16120a;box-shadow:0 8px 16px -10px rgba(143,112,32,.9)}
#lcd-vclass .lv-s1[aria-pressed=true]::before{border-color:#16120a;background:#16120a url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23e6c877' stroke-width='4'%3E%3Cpath d='M5 13l4.5 4.5L19 7'/%3E%3C/svg%3E") center/13px no-repeat}
@media (hover:hover){#lcd-vclass .lv-s1:hover{border-color:#7c5f16;transform:translateY(-1px)}#lcd-vclass .lv-s1[aria-pressed=true]:hover{border-color:#8f7020;transform:none}}

/* dlaždice s ponukou: vzhľad z _lcd1v-kufor-boxy.scss, navyše zľava na fotke a tlačidlo */
#lcd-vclass .lv-dl-w{margin:0}
#lcd-vclass .lv-fotw{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}
#lcd-vclass .lv-dl .lcd1v-kb__fot picture{display:block;width:100%}
#lcd-vclass .lv-dl-vzdy{cursor:default}
#lcd-vclass .lcd1v-kb[data-lcd1v-kb] .lv-dl.lcd1v-kb__karta--naj[aria-pressed=true]::after{top:48px}
#lcd-vclass .lcd1v-kb[data-lcd1v-kb="vclass-boxy"] .lv-dl.lcd1v-kb__karta--naj[aria-pressed=true]::after{top:66px}
/* zľava ako zlatá pečať nad fotkou, nie na nej (Michal 9. 11. 2026) */#lcd-vclass .lv-zlava{order:-1;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:var(--lv-zl);color:#16120a;font:800 16px/1 var(--lv-disp);font-style:normal;box-shadow:0 0 0 3px #fff,0 0 0 4px var(--lv-gold),0 8px 16px -8px rgba(80,60,10,.6)}#lcd-vclass .lv-zlava small{display:block;margin-top:3px;font:600 11px/1 var(--lv-body)}
#lcd-vclass .lv-tl{display:block;margin-top:9px;padding:9px 10px;border-radius:9px;background:var(--lv-zg);color:#fff;font:800 14px/1.2 var(--lv-disp);text-align:center;box-shadow:0 8px 16px -10px rgba(29,107,74,.9)}
#lcd-vclass .lv-tl-b{display:none}
#lcd-vclass .lv-dl[aria-pressed=true] .lv-tl{background:#fff;color:var(--lv-text);box-shadow:inset 0 0 0 1px var(--lv-line)}
#lcd-vclass .lv-dl[aria-pressed=true] .lv-tl-a{display:none}
#lcd-vclass .lv-dl[aria-pressed=true] .lv-tl-b{display:inline}
#lcd-vclass .lv-dl .lv-tl.lv-tl-v{background:#eef6f1;color:var(--lv-zel);box-shadow:none}
#lcd-vclass .lv-ponuka{margin:12px 0 0;padding:11px 13px;border:1px solid #bcdcca;border-radius:10px;background:#eef6f1;color:var(--lv-ink);font-size:16px;line-height:1.35;text-align:center}
#lcd-vclass .lv-ponuka b{color:var(--lv-zel);font-weight:800;white-space:nowrap}
#lcd-vclass .lv-us{margin:0;text-align:right;font-size:16px;color:var(--lv-zel)}
#lcd-vclass .lv-us b{font-weight:800}
#lcd-vclass .lv-vzorky img{aspect-ratio:350/206}

#lcd-vclass .lv-g{display:grid;gap:10px}
#lcd-vclass .lv-g2{grid-template-columns:repeat(2,minmax(0,1fr))}
#lcd-vclass .lv-g3{grid-template-columns:repeat(3,minmax(0,1fr))}
#lcd-vclass .lv-v1 em{display:block;margin-top:3px;font:800 18px var(--lv-disp);font-style:normal;color:var(--lv-gt)}
#lcd-vclass .lv-bezf{padding:14px 10px}
#lcd-vclass .lv-i{margin:0 0 8px;padding:9px 12px;border-radius:9px;background:#fbf7ea;border:1px solid #e9dcae;font-size:16px;color:var(--lv-text)}
#lcd-vclass .lv-body{margin:0 0 12px;padding:0;list-style:none}
#lcd-vclass .lv-body li{position:relative;margin:3px 0;padding-left:22px;font-size:16px}
#lcd-vclass .lv-body li::before{content:"✓";position:absolute;left:2px;top:0;font-weight:800;color:var(--lv-zel)}
#lcd-vclass .lv-an{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0 0 16px}
#lcd-vclass .lv-an button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:58px;padding:11px 10px;border:0;border-radius:10px;font:800 15px/1.2 var(--lv-disp);text-align:center;cursor:pointer}
#lcd-vclass .lv-an small{font:700 14px var(--lv-disp)}
#lcd-vclass .lv-ano{background:var(--lv-zg);color:#fff}
#lcd-vclass .lv-nie{background:var(--lv-zl);color:#16120a}
#lcd-vclass .lv-an button[aria-pressed=true]{box-shadow:0 0 0 2px #fff,0 0 0 5px var(--lv-zel)}
#lcd-vclass .lv-v1,#lcd-vclass .lv-sw{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:0;border:2px solid var(--lv-line);border-radius:12px;background:#fff;color:var(--lv-ink);font:700 15px/1.25 var(--lv-disp);text-align:center;cursor:pointer;overflow:hidden;transition:border-color .2s}
#lcd-vclass .lv-foto{justify-content:flex-start}
#lcd-vclass .lv-foto picture{display:block;width:100%}
#lcd-vclass .lv-foto img{display:block;width:100%;height:auto;aspect-ratio:1.25;object-fit:cover}
#lcd-vclass .lv-foto span{display:block;padding:8px 6px 10px}
#lcd-vclass .lv-f{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
#lcd-vclass .lv-sw{font:600 13px/1.15 var(--lv-body);color:var(--lv-text);justify-content:flex-start}
#lcd-vclass .lv-sw img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
#lcd-vclass .lv-sw span{display:block;padding:4px 3px 6px;min-height:36px}
#lcd-vclass .lv-v1[aria-pressed=true],#lcd-vclass .lv-sw[aria-pressed=true]{border-color:var(--lv-zel)}
#lcd-vclass .lv-v1[aria-pressed=true]::after,#lcd-vclass .lv-sw[aria-pressed=true]::after{content:"";position:absolute;right:6px;top:6px;width:22px;height:22px;border-radius:50%;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.4'%3E%3Cpath d='M5 12.5l4.6 4.6L19 7.6'/%3E%3C/svg%3E") center/15px no-repeat,var(--lv-zg)}
#lcd-vclass .lv-sw-odp[aria-pressed=true]::after{top:26px}
@media (hover:hover){#lcd-vclass .lv-v1:hover,#lcd-vclass .lv-sw:hover{border-color:var(--lv-gold)}#lcd-vclass .lv-v1[aria-pressed=true]:hover,#lcd-vclass .lv-sw[aria-pressed=true]:hover{border-color:var(--lv-zel)}}
#lcd-vclass button:focus-visible,#lcd-vclass select:focus-visible{outline:3px solid var(--lv-gold);outline-offset:2px}
#lcd-vclass .lv-dalej,#lcd-vclass .lv-cta{display:block;width:100%;margin-top:14px;padding:16px 18px;border:0;border-radius:10px;background:var(--lv-zg);color:#fff;font:800 16px var(--lv-disp);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;box-shadow:0 14px 28px -16px rgba(47,156,104,.8)}
#lcd-vclass .lv-cta:not(.lv-hotovo){background:#e4e0d4;color:#48412f;box-shadow:none}
#lcd-vclass .lv-cta:disabled{opacity:.75;cursor:default}
#lcd-vclass .lv-suhrn{margin-top:14px}
#lcd-vclass .lv-ot .lv-spr{margin:12px 0 0;border-color:#e3b3ad;background:#fdf4f3;color:#a9342a}
#lcd-vclass .lv-spolu{display:flex;justify-content:space-between;align-items:baseline;margin:0}
#lcd-vclass .lv-spolu[hidden]{display:none}
#lcd-vclass .lv-spolu span{font:700 12px var(--lv-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--lv-ink)}
#lcd-vclass .lv-spolu b{font:800 30px var(--lv-disp);color:var(--lv-ink)}
#lcd-vclass .lv-spr{margin:10px 0 0;padding:11px 13px;border-radius:9px;background:#fbf7ea;border:1px solid #e9dcae;color:var(--lv-gt);font-size:15px}

/* stĺpce rovnako vysoké, kresba lepí v ľavom; starý posun fotky pri skrolovaní (stickyphotos.js) tu neplatí, po zbalení krokov by kresba ostala pod pätou */
@media (min-width:992px){
  body.lcd-vclass .row.product-top{display:flex;flex-wrap:wrap;align-items:stretch}
  body.lcd-vclass .p-image-wrapper{transform:none!important;float:none}
  body.lcd-vclass .p-info-wrapper{float:none}
}
@media (max-width:991px){
  #lcd-vclass-hero .lh-in{grid-template-columns:minmax(0,1fr);gap:0;padding:0;max-width:none}
  #lcd-vclass-hero .lh-g{grid-column:1;grid-row:1;height:auto;aspect-ratio:10/9;border-radius:0}
  #lcd-vclass-hero .lh-p{display:none}
  #lcd-vclass-hero .lh-g::before{inset:auto 0 0 0;width:100%;height:30%;background:linear-gradient(0deg,#0d0b08,rgba(13,11,8,0))}
  #lcd-vclass-hero .lh-tx{grid-column:1;grid-row:2;padding:6px 16px 24px;gap:11px}
  #lcd-vclass-hero .lh-cta{align-self:stretch;text-align:center}
  #lcd-vclass-hero .lh-dol{display:contents}
  body.lcd-vclass .p-image-wrapper{display:none!important}
  #lcd-vclass-cesta{padding:18px 8px 4px}
  #lcd-vclass-cesta span{font-size:11px;letter-spacing:.02em;white-space:nowrap}
  #lcd-vclass-cesta li:not(.lv-teraz) span{display:none}
  #lcd-vclass-cesta i{width:28px;height:28px;font-size:13px}
  #lcd-vclass-cesta li::before{top:13px;left:calc(-50% + 16px);right:calc(50% + 16px)}
  #lcd-vclass-nakres{position:static;margin:14px 0 0;padding:12px 10px 8px}
  #lcd-vclass-nakres.lv-uvod{display:none}
  #lcd-vclass-nakres .lv-pl{flex-direction:row;align-items:center;justify-content:center;gap:10px;width:100%}
  #lcd-vclass-nakres .lv-pred{width:56%}
  #lcd-vclass-nakres .lv-zad{width:40%}
}
@media (max-width:480px){
  #lcd-vclass .lv-ot{padding:16px 13px 18px}
  #lcd-vclass .lv-f{grid-template-columns:repeat(4,minmax(0,1fr))}
  #lcd-vclass .lv-an{grid-template-columns:minmax(0,1fr)}
}
@media (prefers-reduced-motion:reduce){#lcd-vclass *,#lcd-vclass-hero *{transition:none!important}}

.lv-bx-obal{display:block;height:0;margin:0!important;padding:0}
body.lcd-1v .lv-bx-obal.upsale-Banner.lcd1v-kb .box-config .lcd1v-bx__pata{z-index:30!important}
body.lcd-1v .lv-bx-obal.upsale-Banner.lcd1v-kb .box-config .lcd1v-bx-velk .button.option-button{position:relative;z-index:0!important;transform:none!important}
body.lcd-1v .lv-bx-obal.upsale-Banner.lcd1v-kb .box-config .parameter-wrap.lcd-needs-fill,body.lcd-1v .lv-bx-obal.upsale-Banner.lcd1v-kb .box-config .lcd-needs-fill{padding:10px;border:2px solid #c0392b;border-radius:12px;background:#fdf0ee}
body.lcd-1v .lv-bx-obal.upsale-Banner.lcd1v-kb .box-config .lcd-needs-fill .lcd1v-bx__nadp{color:#b3261e}
body.lcd-1v .lv-bx-obal.upsale-Banner.lcd1v-kb .box-config .lcd-needs-fill .lcd1v-bx__chyba{font-size:16px;font-weight:800;color:#b3261e}
body.lcd-1v .lv-bx-obal .lv-bx-spr{margin:0 0 8px;padding:8px 12px;border:1px solid #e3a59c;border-radius:9px;background:#fdecea;color:#b3261e;font:700 15px/1.3 var(--lv-body,Arial,sans-serif);text-align:center}
body.lcd-1v .lv-bx-obal.upsale-Banner.lcd1v-kb .box-config .lcd1v-bx-velk .options-wrap .button.option-button{aspect-ratio:auto!important;overflow:visible!important;height:auto!important;min-height:0!important}
body.lcd-1v .lcd1v-lista.lv-bez button.lcd1v-lista__kos{display:none}
body.lcd-1v .lcd1v-lista.lv-bez .lcd1v-lista__c{max-width:none;flex:1 1 auto;flex-direction:row;align-items:baseline;justify-content:space-between}
body.lcd-vclass.lcd1v-vclass-bez-bubliny:not(#lcd1v-x) iframe[title="Luxia chat"]{visibility:hidden!important}

/* obsah pod konfigurátorom (admin-html/src/p1v-vclass): prehliadka auta, verzie, set, galéria */
body.lcd-vclass .sr-only{position:absolute!important;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);border:0;white-space:nowrap}
body.lcd-vclass .vl-pas{position:relative}
body.lcd-vclass .vl-sip{position:absolute;top:50%;z-index:3;width:48px;height:48px;margin-top:-24px;padding:0;border:2px solid #e6c877;border-radius:50%;background:rgba(13,11,8,.82);cursor:pointer;box-shadow:0 6px 16px rgba(0,0,0,.35)}
body.lcd-vclass .vl-sip::after{content:"";position:absolute;left:50%;top:50%;width:12px;height:12px;border:solid #e6c877;border-width:0 3px 3px 0;transform:translate(-68%,-50%) rotate(-45deg)}
body.lcd-vclass .vl-sip-l{left:-10px}
body.lcd-vclass .vl-sip-l::after{transform:translate(-32%,-50%) rotate(135deg)}
body.lcd-vclass .vl-sip-p{right:-10px}
body.lcd-vclass .vl-sip:disabled{opacity:0;pointer-events:none}
body.lcd-vclass .vy{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(210px,calc((100% - 48px)/4));gap:16px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding-bottom:4px}
body.lcd-vclass .vy::-webkit-scrollbar,body.lcd-vclass .vg::-webkit-scrollbar{display:none}
body.lcd-vclass .vy-f{margin:0;min-width:0;scroll-snap-align:start}
body.lcd-vclass .vy-f button{position:relative;display:block;width:100%;padding:0;border:0;border-radius:14px;background:#0d0b08;overflow:hidden;cursor:pointer}
body.lcd-vclass .vy-f img{display:block;width:100%;height:auto;aspect-ratio:9/16;object-fit:cover}
body.lcd-vclass .vy-play{position:absolute;left:12px;bottom:12px;width:52px;height:52px;border-radius:50%;background:rgba(13,11,8,.72);box-shadow:inset 0 0 0 2px #e6c877}
body.lcd-vclass .vy-play::after{content:"";position:absolute;left:20px;top:15px;border-style:solid;border-width:11px 0 11px 17px;border-color:transparent transparent transparent #e6c877}
body.lcd-vclass .vy-f figcaption{margin:9px 2px 0;font:700 16px/1.3 var(--lv-disp);color:var(--lv-ink);text-align:left}
body.lcd-vclass .vg{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,auto);grid-auto-columns:minmax(240px,calc((100% - 36px)/4));gap:12px;overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;padding-bottom:4px}
body.lcd-vclass .vg-f{margin:0;min-width:0;scroll-snap-align:start}
body.lcd-vclass .vg-f button{display:block;width:100%;padding:0;border:0;border-radius:12px;background:none;overflow:hidden;cursor:zoom-in}
body.lcd-vclass .vg-f img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;transition:transform .25s}
@media (hover:hover){body.lcd-vclass .vg-f button:hover img{transform:scale(1.04)}}
@media (max-width:640px){body.lcd-vclass .vy{grid-auto-columns:62%}body.lcd-vclass .vg{grid-auto-columns:76%}body.lcd-vclass .vl-sip{width:42px;height:42px;margin-top:-21px}body.lcd-vclass .vl-sip-l{left:-6px}body.lcd-vclass .vl-sip-p{right:-6px}}
body.lcd-vclass .vt{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:clamp(18px,3vw,36px);align-items:start}
body.lcd-vclass .vt-pri{display:grid;gap:10px}
body.lcd-vclass .vt-pri a{display:block;padding:14px 16px;border:1px solid var(--lv-line);border-radius:12px;background:#fff;color:var(--lv-gt);font:800 17px/1.25 var(--lv-disp);text-decoration:none;word-break:break-word}
body.lcd-vclass .vt-f{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:clamp(16px,2.4vw,24px);border:1px solid var(--lv-line);border-radius:14px;background:#fff}
body.lcd-vclass .vt-p{display:block;margin:0}
body.lcd-vclass .vt-p>span{display:block;margin:0 0 6px;font:700 15px/1.25 var(--lv-body);color:var(--lv-ink)}
body.lcd-vclass .vt-p small{font-weight:400;color:var(--lv-mute)}
body.lcd-vclass .vt-p input,body.lcd-vclass .vt-p textarea{display:block;box-sizing:border-box;width:100%;max-width:none;height:auto;min-height:48px;margin:0;padding:11px 13px;border:1px solid #857d6a;border-radius:10px;background:#fff;color:var(--lv-ink);font:400 16px/1.35 var(--lv-body)}
body.lcd-vclass .vt-p em{display:none;margin-top:4px;font:400 14px var(--lv-body);font-style:normal;color:#b3261e}
body.lcd-vclass .vt-f.overene .vt-p input:invalid{border-color:#c0392b}
body.lcd-vclass .vt-f.overene .vt-p input:invalid~em{display:block}
body.lcd-vclass .vt-s,body.lcd-vclass .vt-a,body.lcd-vclass .vt-st{grid-column:1/-1}
body.lcd-vclass .vt-hp{position:absolute;left:-9999px}
body.lcd-vclass .vt-a{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}
body.lcd-vclass .vt-a button{padding:14px 26px;border:0;border-radius:10px;background:var(--lv-zg);color:#fff;font:800 15px var(--lv-disp);letter-spacing:.04em;text-transform:uppercase;cursor:pointer}
body.lcd-vclass .vt-a p{flex:1 1 220px;margin:0;font:400 14px/1.35 var(--lv-body);color:var(--lv-mute)}
body.lcd-vclass .vt-st{margin:0;padding:11px 13px;border-radius:10px;background:#eef6f1;color:var(--lv-zel);font:700 16px/1.35 var(--lv-body)}
@media (max-width:760px){body.lcd-vclass .vt,body.lcd-vclass .vt-f{grid-template-columns:minmax(0,1fr)}}
body.lcd-vclass .vk-panel{padding:clamp(22px,3.6vw,48px) clamp(14px,3vw,44px) clamp(20px,3vw,40px);border-radius:20px;background:radial-gradient(90% 60% at 50% 38%,#2a2315,#0d0b08 72%);color:#d9d4c6}
body.lcd-vclass .vk-hl{max-width:760px;margin:0 auto 10px;text-align:center}
body.lcd-vclass .vk-hl .lede{margin-left:auto!important;margin-right:auto!important;color:#d9d4c6!important}
body.lcd-vclass .vk-hl .eyebrow{color:#e6c877!important;justify-content:center}
body.lcd-vclass .vk{display:block;margin:0 0 22px}
body.lcd-vclass .vk-3d{position:relative;aspect-ratio:2/1;margin-top:-14px;overflow:hidden}
body.lcd-vclass .vk-3d img{display:block;width:100%;height:100%;object-fit:contain}
body.lcd-vclass .vk-zive img{visibility:hidden}
body.lcd-vclass .vk-gl{position:absolute;inset:0;display:block;width:100%;height:100%;cursor:grab;touch-action:pan-y}
body.lcd-vclass .vk-gl.vk-tah{cursor:grabbing}
body.lcd-vclass .vk-hint{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);white-space:nowrap;padding:5px 10px;border-radius:999px;background:rgba(13,11,8,.66);color:#e6c877;font:600 14px/1.2 var(--lv-body);pointer-events:none}
body.lcd-vclass .vk-f{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:14px 0 0;padding:0;list-style:none}
body.lcd-vclass .vk-f li{margin:0;padding:14px 16px;border-top:2px solid var(--lv-gold);background:rgba(255,255,255,.04);font:400 16px/1.4 var(--lv-body);color:#d9d4c6;text-align:center}
body.lcd-vclass .vk-f b{display:block;margin:0 0 3px;font:800 21px/1.2 var(--lv-disp);color:#fff}
body.lcd-vclass .vk-pozn{margin:0 auto 22px!important;max-width:none!important;font:400 16px/1.45 var(--lv-body);color:#b9b3a4!important;text-align:center}
body.lcd-vclass .vk-panel .vy{grid-auto-flow:row;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-columns:auto;overflow:visible;padding:0}
body.lcd-vclass .vk-panel .vy-f img{aspect-ratio:4/5;object-position:50% 30%}
body.lcd-vclass .vk-panel .vy-f figcaption{color:#fff}
@media (max-width:760px){body.lcd-vclass .vk-3d{aspect-ratio:4/3}body.lcd-vclass .vk-f{grid-template-columns:minmax(0,1fr)}body.lcd-vclass .vk-panel .vy{grid-auto-flow:column;grid-template-columns:none;grid-auto-columns:62%;overflow-x:auto}}
body.lcd-vclass .vy-f button{position:relative;display:block;width:100%;padding:0;border:0;border-radius:14px;background:#0d0b08;overflow:hidden;cursor:pointer}
body.lcd-vclass .vy-f img{display:block;width:100%;height:auto;aspect-ratio:9/16;object-fit:cover}
body.lcd-vclass .vy-f figcaption{margin:9px 2px 0;font:700 16px/1.3 var(--lv-disp);color:var(--lv-ink);text-align:center}
body.lcd-vclass .vp-fakty{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:24px 0 28px;padding:0;list-style:none}
body.lcd-vclass .vp-fakty li{margin:0;padding:15px 18px;border:1px solid var(--lv-line);border-top:3px solid var(--lv-gold);border-radius:12px;background:#fff;font:400 16px/1.4 var(--lv-body);color:var(--lv-text)}
body.lcd-vclass .vp-fakty b{display:block;margin:0 0 3px;font:800 19px/1.2 var(--lv-disp);color:var(--lv-ink)}
body.lcd-vclass .vp{margin-top:8px}
body.lcd-vclass .vp-k{display:grid;gap:12px;margin:0 0 28px}
body.lcd-vclass .vp-t h3{margin:0 0 6px;font:800 22px/1.2 var(--lv-disp);color:var(--lv-ink)}
body.lcd-vclass .vp-t p{margin:0;font:400 17px/1.55 var(--lv-body);color:var(--lv-text)}
body.lcd-vclass .vp-js{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,8fr);grid-template-rows:auto 1fr auto;gap:0 clamp(20px,3.4vw,44px);align-items:start;padding:clamp(14px,2.4vw,28px);border-radius:20px;background:#0d0b08}
body.lcd-vclass .vp-lava{grid-column:1;grid-row:1/span 2;display:grid;gap:12px;min-width:0;align-self:stretch}
body.lcd-vclass .vp-mapa{display:flex;flex-direction:column;align-items:center;gap:6px}
body.lcd-vclass .vp-js .vp-mapa{position:relative;overflow:hidden;padding:14px;border-radius:16px;background:var(--lv-sand)}
body.lcd-vclass .vp-sv{position:absolute;z-index:1;border:2px solid var(--lv-gold);border-radius:14px;box-shadow:0 0 0 1400px rgba(246,244,239,.74);pointer-events:none;transition:left .45s cubic-bezier(.3,.8,.3,1),top .45s cubic-bezier(.3,.8,.3,1),width .45s cubic-bezier(.3,.8,.3,1),height .45s cubic-bezier(.3,.8,.3,1)}
body.lcd-vclass .vp-c{position:relative;width:100%}
body.lcd-vclass .vp-c2{width:74.5%}
body.lcd-vclass .vp-c canvas{display:block;width:100%;height:auto}
body.lcd-vclass .vp-b{position:absolute;z-index:2;width:38px;height:38px;margin:-19px 0 0 -19px;padding:0;border:2px solid #fff;border-radius:50%;background:var(--lv-zl);color:#16120a;font:800 16px var(--lv-disp);cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.35);transition:transform .15s}
body.lcd-vclass .vp-b:hover{transform:scale(1.1)}
body.lcd-vclass .vp-b[aria-pressed=true]{background:var(--lv-zg);color:#fff;transform:scale(1.15)}
body.lcd-vclass .vp-far{padding:14px 16px 16px;border-radius:16px;background:#1a1712;color:#d9d4c6}
body.lcd-vclass .vp-js .vp-far{grid-column:1/-1;grid-row:3;display:grid;grid-template-columns:minmax(230px,300px) minmax(0,1fr) minmax(190px,230px);grid-template-areas:"t sw ch" "vz n ch";gap:6px 26px;align-items:center;margin-top:22px;padding:18px 22px}
body.lcd-vclass .vp-js .vp-far-t{grid-area:t;margin:0}
body.lcd-vclass .vp-js .vp-vz{grid-area:vz;margin:0}
body.lcd-vclass .vp-js .vp-sw{grid-area:sw;margin:0}
body.lcd-vclass .vp-js .vp-far-n{grid-area:n;margin:0}
body.lcd-vclass .vp-js .vp-chcem{grid-area:ch}
body.lcd-vclass .vp-js .vp-f img{aspect-ratio:4/3}
body.lcd-vclass .vp-far-t{margin:0 0 10px;font:800 17px/1.25 var(--lv-disp);color:#fff}
body.lcd-vclass .vp-vz{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0 0 12px}
body.lcd-vclass .vp-vz button{min-width:0;padding:8px 4px;border:1px solid #5b5138;border-radius:9px;background:none;color:#d9d4c6;font:700 13px/1.2 var(--lv-disp);cursor:pointer}
body.lcd-vclass .vp-vz button[aria-pressed=true]{border-color:transparent;background:var(--lv-zl);color:#16120a}
body.lcd-vclass .vp-sw{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 10px}
body.lcd-vclass .vp-sw button{width:40px;height:40px;padding:0;border:2px solid transparent;border-radius:50%;background:none;overflow:hidden;cursor:pointer}
body.lcd-vclass .vp-sw img{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover}
body.lcd-vclass .vp-sw button[aria-pressed=true]{border-color:#e6c877;box-shadow:0 0 0 2px #0d0b08 inset}
body.lcd-vclass .vp-far-n{margin:0 0 12px;font:400 15px/1.3 var(--lv-body);color:#e6c877}
body.lcd-vclass .vp-chcem{display:block;width:100%;padding:12px 14px;border:0;border-radius:10px;background:var(--lv-zg);color:#fff;font:800 14px/1.2 var(--lv-disp);letter-spacing:.04em;text-transform:uppercase;cursor:pointer}
body.lcd-vclass .vp-js .vp-chips{grid-column:2;grid-row:1;display:flex;margin:0 0 16px;padding:0}
body.lcd-vclass .vp-chips button{position:relative;flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:6px;padding:0 3px;border:0;background:none;color:#a39b86;font:700 13px/1.2 var(--lv-disp);text-align:center;cursor:pointer}
body.lcd-vclass .vp-chips button::before{content:"";position:absolute;left:-50%;right:50%;top:14px;height:2px;background:#3a3427}
body.lcd-vclass .vp-chips button:first-child::before{display:none}
body.lcd-vclass .vp-chips i{position:relative;z-index:1;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#2a2519;color:#d9d4c6;font:800 14px var(--lv-disp);font-style:normal}
body.lcd-vclass .vp-chips .vp-pred-h::before,body.lcd-vclass .vp-chips button[aria-pressed=true]::before{background:var(--lv-gold)}
body.lcd-vclass .vp-chips .vp-pred-h i{background:#6e5a24;color:#fff}
body.lcd-vclass .vp-chips button[aria-pressed=true]{color:#e6c877}
body.lcd-vclass .vp-chips button[aria-pressed=true] i{background:var(--lv-zl);color:#16120a;box-shadow:0 0 0 4px rgba(196,155,49,.25)}
body.lcd-vclass .vp-js .vp-zoz{grid-column:2;grid-row:2;min-width:0}
body.lcd-vclass .vp-js .vp-k{display:none;gap:14px;margin:0}
body.lcd-vclass .vp-js .vp-k.on{display:grid}
body.lcd-vclass .vp-js .vp-f{position:relative}
body.lcd-vclass .vp-cislo{position:absolute;right:12px;top:12px;padding:5px 11px;border-radius:999px;background:rgba(13,11,8,.72);color:#e6c877;font:800 14px var(--lv-disp)}
body.lcd-vclass .vp-js .vp-t h3{margin:0 0 6px;font-size:26px;color:#fff}
body.lcd-vclass .vp-js .vp-t p{color:#d9d4c6}
body.lcd-vclass .vp-pata{display:none}
body.lcd-vclass .vp-js .vp-pata{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
body.lcd-vclass .vp-spat,body.lcd-vclass .vp-dalej{padding:11px 16px;border:0;border-radius:10px;font:800 14px var(--lv-disp);cursor:pointer}
body.lcd-vclass .vp-spat{background:none;box-shadow:inset 0 0 0 1px #5b5138;color:#d9d4c6}
body.lcd-vclass .vp-dalej{background:var(--lv-zl);color:#16120a}
body.lcd-vclass .vp-f,body.lcd-vclass .vs-f,body.lcd-vclass .vg-f{margin:0}
body.lcd-vclass .vp-f img{display:block;width:100%;height:auto;border-radius:14px;aspect-ratio:3/2;object-fit:cover}

body.lcd-vclass .vv{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(24px,4vw,56px);align-items:start;margin-top:8px}
body.lcd-vclass .vv-kresba{display:flex;gap:16px;align-items:center;padding:16px;border-radius:16px;background:var(--lv-sand)}
body.lcd-vclass .vv-kresba:empty{display:none}
body.lcd-vclass .vv-kresba canvas{display:block;flex:0 1 46%;min-width:0;height:auto;max-width:46%}
body.lcd-vclass .vv-pole{flex:1 1 0;min-width:0;display:grid;gap:12px}
body.lcd-vclass .vv-r span{display:block;margin:0 0 5px;font:700 12px var(--lv-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--lv-text)}
body.lcd-vclass .vv-r div{display:flex;flex-wrap:wrap;gap:5px}
body.lcd-vclass .vv-r button{padding:8px 11px;border:2px solid #d8c9a0;border-radius:9px;background:#fff;color:var(--lv-ink);font:700 14px var(--lv-disp);cursor:pointer}
body.lcd-vclass .vv-r button[aria-pressed=true]{border-color:transparent;background:var(--lv-zl);color:#16120a}
body.lcd-vclass .vv-tab{width:100%;margin:0 0 20px;border-collapse:collapse;font:400 16px/1.4 var(--lv-body);color:var(--lv-text)}
body.lcd-vclass .vv-tab th,body.lcd-vclass .vv-tab td{padding:10px 8px;border-bottom:1px solid var(--lv-line);text-align:left;font-weight:400}
body.lcd-vclass .vv-tab thead th{font:700 12px var(--lv-disp);letter-spacing:.1em;text-transform:uppercase}
body.lcd-vclass .vv-tab tbody th{font:800 18px var(--lv-disp);color:var(--lv-ink)}
body.lcd-vclass .vv-tab a{color:var(--lv-gt);font-weight:700;white-space:nowrap}
body.lcd-vclass .vv-t h3{margin:0 0 8px;font:800 20px/1.2 var(--lv-disp);color:var(--lv-ink)}
body.lcd-vclass .vv-zoz{margin:0;padding:0;list-style:none}
body.lcd-vclass .vv-zoz li{margin:0 0 9px;padding:0;font:400 16px/1.5 var(--lv-body);color:var(--lv-text)}
body.lcd-vclass .vv-zoz b{color:var(--lv-ink)}

body.lcd-vclass .vs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:8px 0 18px;padding:0;list-style:none}
body.lcd-vclass .vs-k{display:flex;flex-direction:column;margin:0;padding:0;border:1px solid var(--lv-line);border-radius:14px;background:#fff;overflow:hidden}
body.lcd-vclass .vs-f img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover}
body.lcd-vclass .vs-t{display:flex;flex-direction:column;flex:1 1 auto;gap:4px;padding:12px}
body.lcd-vclass .vs-t h3{margin:0;font:800 17px/1.2 var(--lv-disp);color:var(--lv-ink)}
body.lcd-vclass .vs-t p{margin:0;flex:1 1 auto;font:400 15px/1.4 var(--lv-body);color:var(--lv-text)}
body.lcd-vclass .vs-c{margin-top:4px;font:800 17px var(--lv-disp);color:var(--lv-gt)}
body.lcd-vclass .vs-sp{margin:0;font:400 17px/1.5 var(--lv-body);color:var(--lv-text)}
body.lcd-vclass .vs-sp b{color:var(--lv-ink)}

@media (max-width:991px){
  body.lcd-vclass .vp-fakty{grid-template-columns:minmax(0,1fr)}
  body.lcd-vclass .vp-js{grid-template-columns:minmax(0,1fr);padding:12px}
  body.lcd-vclass .vp-lava{grid-column:1;grid-row:auto;margin:0 0 14px}
  body.lcd-vclass .vp-js .vp-mapa{flex-direction:row;justify-content:center;align-items:center;gap:8px;padding:10px}
  body.lcd-vclass .vp-c{width:56%}
  body.lcd-vclass .vp-c2{width:40%}
  body.lcd-vclass .vp-b{width:30px;height:30px;margin:-15px 0 0 -15px;font-size:14px}
  body.lcd-vclass .vp-js .vp-chips{grid-column:1;grid-row:auto}
  body.lcd-vclass .vp-chips span{display:none}
  body.lcd-vclass .vp-chips button[aria-pressed=true] span{display:block;position:absolute;top:36px;width:max-content;max-width:160px}
  body.lcd-vclass .vp-js .vp-chips{margin-bottom:34px}
  body.lcd-vclass .vp-js .vp-zoz{grid-column:1;grid-row:auto}
  body.lcd-vclass .vp-js .vp-far{grid-column:1;grid-row:auto;display:block;margin-top:14px;padding:14px 16px 16px}
  body.lcd-vclass .vp-js .vp-far-t,body.lcd-vclass .vp-js .vp-vz,body.lcd-vclass .vp-js .vp-sw,body.lcd-vclass .vp-js .vp-far-n{margin:0 0 10px}
  body.lcd-vclass .vp-js .vp-f img{aspect-ratio:3/2}
  body.lcd-vclass .vv{grid-template-columns:minmax(0,1fr)}
  body.lcd-vclass .vs{grid-template-columns:repeat(2,minmax(0,1fr))}
  body.lcd-vclass .vs-k:first-child{grid-column:1/-1}
  body.lcd-vclass .vs-k:first-child .vs-f img{aspect-ratio:2/1}
}

/* Rozloženie obsahu na počítači (Michal 7. 11. 2026: „text je strašne na sebe“, „prečo to troška nerozťahneš, veď tam je dosť miesta“).
   --lv-st = šírka stĺpca obsahu, --lv-ok = voľný okraj vedľa stĺpca, --lv-odst = odstup úvodu od obsahu sekcie.
   Rytmus sekcií je od 992 px, širší stĺpec a väčšie písmo od 1600 px. */
@media (min-width:992px){
  ${O}{--lv-st:min(1240px,calc(var(--p1v-sirka,100vw) - 2*var(--pad)));--lv-ok:calc((var(--p1v-sirka,100vw) - var(--lv-st))/2);--lv-odst:clamp(28px,calc(18px + 1vw),44px);--lv-pies:#e9e4d8}
  ${O} .eyebrow{margin:0 0 10px}
  ${O} :is(.wrap,.vk-hl)>h2 + .lede{margin-top:16px}
  ${O} .chapter :is(.wrap,.vk-hl)>.lede{max-width:70ch}
  ${O} .chapter .wrap>.lede{color:var(--lv-text)}
  ${O} .chapter .wrap>.lede + *,${O} .chapter .wrap>h2 + :not(.lede){margin-top:var(--lv-odst)}
  ${O} .vk-hl{margin-bottom:var(--lv-odst)}
  ${O} .vk-3d{margin-top:0}
  ${O} .vp-js .vp-t h3{margin:0 0 10px;font-size:26px}
  ${O} .vv-t h3{margin:0 0 12px}
  ${O} .vs{margin-bottom:24px}
  ${O} .vs-t{gap:8px}
  ${O} .vs-t h3{margin:0}
  ${O} .vs-t p{font-size:16px}
  ${O} .k-cta{margin-top:24px}
  ${O} :is(.vp-fakty li,.vv-zoz li,.vk-f li,.vk-pozn){font-size:17px}

  /* susedné sekcie sa striedajú: biela, piesok, tmavý pás; zlatý nadpis je tmavší, svetlé zlato sa na piesku zle číta */
  ${O} section.chapter{border-top:0}
  ${O} .chapter .wrap>h2{background:linear-gradient(100deg,#7c5f16,#9c7b26 55%,#7c5f16);-webkit-background-clip:text;background-clip:text}
  ${S("vclass-prehliadka", "vclass-set", "c-casova-os", "c-domov", "vclass-kontakt")}{background:var(--lv-pies)}
  ${S("vclass-verzie", "vclass-sken", "vclass-videa", "a-recenzie", "d-faq")}{background:#fff}
  ${S("vclass-galeria")}{background:#0d0b08}
  ${S("vclass-galeria")} .eyebrow{color:#e6c877}
  ${S("vclass-galeria")} .wrap>h2{background:linear-gradient(100deg,#c49b31,#e6c877 50%,#d9b558);-webkit-background-clip:text;background-clip:text}
  ${S("vclass-galeria")} .wrap>.lede{color:#d9d4c6}

  /* pásy fotiek a videí: 4 vedľa seba v stĺpci, šípky nad pásom. Stopa minmax() v dlhom páse nikdy nerastie. */
  ${O} .vg{grid-auto-columns:calc((var(--lv-st) - 36px)/4)}
  ${S("vclass-videa")} .vy{grid-auto-columns:calc((var(--lv-st) - 48px)/4)}
  ${S("vclass-galeria", "vclass-videa")} .vl-sip{top:auto;bottom:calc(100% + 10px);margin-top:0}
  ${S("vclass-galeria", "vclass-videa")} .vl-sip-p{right:0}
  ${S("vclass-galeria", "vclass-videa")} .vl-sip-l{left:auto;right:60px}
  /* zábery videí majú 480 px, ďalej sa nenaťahujú */
  ${O} .vk-panel .vy{grid-template-columns:repeat(3,minmax(0,480px));justify-content:center}

  /* výzva: fotka 1800 × 1350 ostrá v polovici pásu, text vedľa nej v stĺpci obsahu. Starý obrázok z HTML je skrytý, zmazať sa dá len v Popise. */
  ${O} .end{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;min-height:clamp(440px,32vw,700px);padding-left:var(--lv-ok)!important;padding-right:calc(50% + clamp(32px,4vw,90px))!important;text-align:left}
  ${O} .end h2{margin:0;max-width:none}
  ${O} .end h2 + .lede{margin:16px 0 0;max-width:none}
  ${O} .end-cta{justify-content:flex-start;margin-top:var(--lv-odst)}
  ${O} .endbg{left:50%;z-index:-1;background:#181510 url("https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/obsah/autokoberce-mercedes-v-class-detail-cela-w1200.webp") 50% 60%/cover no-repeat}
  ${O} .endbg img{display:none}

  /* vzorky v stĺpci obsahu */
  ${O} .vz .in{box-sizing:border-box;width:var(--lv-st);max-width:none;padding-left:0;padding-right:0}
  ${O} .vz h2 + p{margin-top:16px}
  ${O} .vz .row{margin-top:var(--lv-odst)}

  /* verzie: väčšia kresba, Vybrať ako tlačidlá */
  ${O} .vv-kresba canvas{flex:0 1 56%;max-width:56%}
  ${O} .vv-tab a{display:inline-block;padding:10px 16px;border-radius:9px;background:var(--lv-zel);color:#fff;font:800 16px/1.2 var(--lv-disp);text-decoration:none;box-shadow:0 8px 16px -10px rgba(31,122,82,.8)}
  ${O} .vv-tab a:focus-visible{outline:3px solid var(--lv-gold);outline-offset:2px}

  /* kontakt: tri polia v riadku, aby vedľa telefónu neostala diera. Do 1199 px sa zmestia, len keď ide formulár cez celý stĺpec (blok nižšie). */
  ${O} .vt-f{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (min-width:992px) and (hover:hover){${O} .vv-tab a:hover{background:#176443}}
/* nadpis v tmavej karte skenu: svetlé zlato (tmavší prechod webu je pre svetlé pozadie, tu by bol 1,9:1) */
/* Skúsenosť zákazníka (Michal 7. 11. 2026): tmavý pás, vľavo citát, vpravo video. Telefón: pod sebou, video pod textom. */
${S("vclass-zakaznik")}{background:#0d0b08}
${S("vclass-zakaznik")} .eyebrow{color:#e6c877}
${S("vclass-zakaznik")} .wrap>.vzk-t>h2,${S("vclass-zakaznik")} .vzk-t>h2{background:linear-gradient(100deg,#c49b31,#e6c877 50%,#d9b558);-webkit-background-clip:text;background-clip:text;color:transparent}
${S("vclass-zakaznik")} .vzk{display:grid;gap:26px}
${S("vclass-zakaznik")} .vzk-q{position:relative;margin:22px 0 0;padding:6px 0 0 26px;border-left:3px solid #c49b31}
${S("vclass-zakaznik")} .vzk-q p{margin:0;font:700 clamp(22px,2.2vw,30px)/1.35 var(--lv-disp);color:#fff}
${S("vclass-zakaznik")} .vzk-q footer{margin-top:14px;font:600 17px/1.3 var(--lv-body);color:#e6c877}
${S("vclass-zakaznik")} .vzk-t .lede{margin-top:22px;color:#d9d4c6}
${S("vclass-zakaznik")} .vzk-v{width:min(100%,380px);justify-self:center}
${S("vclass-zakaznik")} .vzk-v img{aspect-ratio:4/5}
@media (max-width:991px){${O} .endbg{background:#181510 url("https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/obsah/autokoberce-mercedes-v-class-detail-cela-w800.webp") 50% 60%/cover no-repeat}}
@media (min-width:992px){
  ${S("vclass-zakaznik")} .vzk{grid-template-columns:minmax(0,1fr) minmax(0,400px);gap:clamp(32px,5vw,80px);align-items:center}
  ${S("vclass-zakaznik")} .vzk-v{width:100%}
}
${O} .vk-hl>h2{background:linear-gradient(100deg,#c49b31,#e6c877 50%,#d9b558);-webkit-background-clip:text;background-clip:text;color:transparent}
@media (min-width:992px) and (max-width:1199px){
  ${O} .vt{grid-template-columns:minmax(0,1fr)}
  ${O} .vt-pri{grid-template-columns:repeat(2,minmax(0,1fr))}
}
/* Širší stĺpec od 1600 px zrušený (Michal 7. 11. 2026: „až moc rozťahané“), šírka ostáva ako pri Diamond Line. */
/* výzva: na veľkom monitore polovica pásu presiahne 1200 px, vtedy väčší súbor */
@media (min-width:2200px),(min-width:992px) and (min-resolution:1.5dppx){
  ${O} .endbg{background-image:url("https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/1v/obsah/autokoberce-mercedes-v-class-detail-cela-w1800.webp")}
}
`;
