// Štýly stránky triedy V. Sú v samostatnej časti, aby ostatné stránky webu nesťahovali ani bajt navyše. Všetko pod body.lcd-vclass.
// Úvodná časť čierna so zlatým písmom ako hlavička webu, krok „Vaše auto“ rovnaký ako v konfigurátore 1V: zlaté prepínače,
// zlatý rám selectov, zelené tlačidlo = kam chceme klik, chýbajúci údaj = červený rám.
export const CSS = `
body.lcd-vclass{--lv-ink:#14110c;--lv-line:#d9d4c6;--lv-gold:#c49b31;--lv-gt:#7c5f16;--lv-mute:#6e6752;--lv-text:#3d3728;--lv-sand:#f6f4ef;--lv-zel:#1f7a52;--lv-zg:linear-gradient(100deg,#1d6b4a,#2f9c68 42%,#1f7350);--lv-zl:linear-gradient(100deg,#8f7020,#e6c877 48%,#c49b31);--lv-disp:"Exo 2",system-ui,sans-serif;--lv-body:"Source Sans 3",system-ui,sans-serif}
body.lcd-vclass .p-image-wrapper>*:not(#lcd-vclass-nakres){display:none!important}
body.lcd-vclass .p-info-wrapper>*:not(#lcd-vclass){display:none!important}
body.lcd-vclass .p-info-wrapper{opacity:1!important;visibility:visible!important;display:block!important}
body.lcd-vclass .p-detail-inner-header{display:block;margin:0;padding:0;width:auto;background:none;border:0}
body.lcd-vclass .p-detail-inner{max-width:none}

#lcd-vclass-hero{position:relative;background:#0d0b08;color:#fff;margin-bottom:0;overflow:hidden;width:var(--lv-vw,100%);margin-left:calc((100% - var(--lv-vw,100%))/2)}
#lcd-vclass-hero *{box-sizing:border-box}
#lcd-vclass-hero .lh-in{position:relative;display:grid;grid-template-columns:minmax(0,38fr) minmax(0,62fr);min-height:min(74vh,640px)}
#lcd-vclass-hero .lh-tx{grid-column:1;grid-row:1;position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:clamp(28px,4vw,56px) 0 clamp(28px,4vw,56px) max(24px,calc(50vw - 640px))}
#lcd-vclass-hero .lh-g{grid-column:2;grid-row:1;position:relative;min-width:0}
#lcd-vclass-hero .lh-g::before{content:"";position:absolute;inset:0 auto 0 0;width:34%;z-index:1;pointer-events:none;background:linear-gradient(90deg,#0d0b08,rgba(13,11,8,0))}
#lcd-vclass-hero .lh-st{position:absolute;inset:0;display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;outline-offset:-3px}
#lcd-vclass-hero .lh-st::-webkit-scrollbar{display:none}
#lcd-vclass-hero .lh-f{flex:0 0 100%;margin:0;scroll-snap-align:start;height:100%}
#lcd-vclass-hero .lh-f picture{display:block;width:100%;height:100%}
#lcd-vclass-hero .lh-f img{display:block;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important}
#lcd-vclass-hero .lh-sip{position:absolute;top:50%;z-index:2;width:44px;height:44px;margin-top:-22px;border:1px solid rgba(230,200,119,.55);border-radius:50%;background:rgba(13,11,8,.62);cursor:pointer;padding:0}
#lcd-vclass-hero .lh-sip::after{content:"";position:absolute;left:50%;top:50%;width:11px;height:11px;border:solid #e6c877;border-width:0 2px 2px 0;transform:translate(-65%,-50%) rotate(-45deg)}
#lcd-vclass-hero .lh-sip-l{left:16px}
#lcd-vclass-hero .lh-sip-l::after{transform:translate(-35%,-50%) rotate(135deg)}
#lcd-vclass-hero .lh-sip-p{right:16px}
#lcd-vclass-hero .lh-ei{font:700 13px var(--lv-disp);letter-spacing:.18em;text-transform:uppercase;color:#e6c877}
#lcd-vclass-hero h1{display:block!important;margin:0;font:800 clamp(34px,3.6vw,54px)/1.04 var(--lv-disp);text-transform:uppercase;color:#fff;text-align:left}
#lcd-vclass-hero h1 span{display:block;background:var(--lv-zl);-webkit-background-clip:text;background-clip:text;color:transparent}
#lcd-vclass-hero .lh-p{margin:0;max-width:30em;font:400 18px/1.45 var(--lv-body);color:#d9d4c6}
#lcd-vclass-hero .lh-c{display:flex;align-items:baseline;gap:8px;color:#fff}
#lcd-vclass-hero .lh-c small{font:600 16px var(--lv-body);color:#d9d4c6}
#lcd-vclass-hero .lh-c b{font:800 clamp(30px,3vw,42px)/1 var(--lv-disp)}
#lcd-vclass-hero .lh-cta{align-self:flex-start;padding:16px 34px;border:0;border-radius:10px;background:var(--lv-zg);color:#fff;font:800 16px var(--lv-disp);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;box-shadow:0 14px 30px -14px rgba(47,156,104,.8)}
#lcd-vclass-hero .lh-t{display:flex;gap:8px;margin-top:10px}
#lcd-vclass-hero .lh-t button{flex:0 1 72px;min-width:0;padding:0;border:2px solid transparent;border-radius:8px;background:none;cursor:pointer;overflow:hidden;opacity:.6;transition:opacity .2s}
#lcd-vclass-hero .lh-t img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover}
#lcd-vclass-hero .lh-t button[aria-pressed=true]{border-color:#e6c877;opacity:1}
#lcd-vclass-hero button:focus-visible{outline:3px solid #e6c877;outline-offset:2px}

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
#lcd-vclass .lv-c-k{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:800 13px var(--lv-disp);background:#e4e0d4;color:var(--lv-mute)}
#lcd-vclass .lv-ho .lv-c-k{background:var(--lv-zg);color:#fff}
#lcd-vclass .lv-r-t b{display:block;font:700 15px/1.25 var(--lv-disp);color:var(--lv-ink)}
#lcd-vclass .lv-r-t small{display:block;color:var(--lv-mute);font-size:14px;line-height:1.3}
#lcd-vclass .lv-z{font:800 12px var(--lv-disp);letter-spacing:.1em;color:var(--lv-gt);text-transform:uppercase}

#lcd-vclass .lv-pole{margin:0 0 16px;min-width:0;border-radius:12px}
#lcd-vclass .lv-pole.lv-chyba .lv-l{color:#b3261e}
#lcd-vclass .lv-pole.lv-chyba .lv-seg,#lcd-vclass .lv-pole.lv-chyba .lv-sel{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}
#lcd-vclass .lv-l{display:block;margin:0 0 7px;font:700 12px var(--lv-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--lv-text)}
#lcd-vclass .lv-hr{border:0;border-top:2px dashed #e4dfd0;margin:2px 0 16px}
#lcd-vclass .lv-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}
#lcd-vclass .lv-fix{display:block;padding:12px 14px;border:1px solid var(--lv-line);border-radius:9px;background:var(--lv-sand);font:600 16px var(--lv-body);color:var(--lv-ink)}
#lcd-vclass .lv-sel{width:100%;height:auto;padding:12px 14px;border:2px solid #d8c9a0;border-radius:10px;background:#fff;font:400 16px var(--lv-body);color:var(--lv-ink)}
#lcd-vclass .lv-pi,#lcd-vclass .lv-seg{display:grid;gap:4px;padding:5px;border:2px solid #d8c9a0;border-radius:12px;background:#fff}
#lcd-vclass .lv-pi{grid-template-columns:1fr 1fr;border-radius:999px}
#lcd-vclass .lv-seg2{grid-template-columns:repeat(2,minmax(0,1fr))}
#lcd-vclass .lv-seg3{grid-template-columns:repeat(3,minmax(0,1fr))}
#lcd-vclass .lv-seg4{grid-template-columns:repeat(4,minmax(0,1fr))}
#lcd-vclass .lv-s1{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:44px;padding:9px 8px;border:0;border-radius:9px;background:none;color:var(--lv-ink);font:700 14px/1.2 var(--lv-disp);text-align:center;cursor:pointer}
#lcd-vclass .lv-pi .lv-s1{border-radius:999px;letter-spacing:.05em;text-transform:uppercase}
#lcd-vclass .lv-s1[aria-pressed=true]{background:var(--lv-zl);color:#16120a;box-shadow:0 8px 16px -10px rgba(143,112,32,.9)}
#lcd-vclass .lv-vel .lv-s1 b{font:800 22px/1 var(--lv-disp)}
#lcd-vclass .lv-vel .lv-s1 small{font:400 13px/1.2 var(--lv-body);color:var(--lv-mute)}
#lcd-vclass .lv-vel .lv-s1 em{font:700 14px var(--lv-disp);font-style:normal;color:var(--lv-gt)}
#lcd-vclass .lv-vel .lv-s1[aria-pressed=true] small,#lcd-vclass .lv-vel .lv-s1[aria-pressed=true] em{color:#16120a}

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
#lcd-vclass .lv-foto img{display:block;width:100%;aspect-ratio:1.25;object-fit:cover}
#lcd-vclass .lv-foto span{display:block;padding:8px 6px 10px}
#lcd-vclass .lv-f{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
#lcd-vclass .lv-sw{font:600 13px/1.15 var(--lv-body);color:var(--lv-text);justify-content:flex-start}
#lcd-vclass .lv-sw img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
#lcd-vclass .lv-sw span{display:block;padding:4px 3px 6px;min-height:36px}
#lcd-vclass .lv-v1[aria-pressed=true],#lcd-vclass .lv-sw[aria-pressed=true]{border-color:var(--lv-zel)}
#lcd-vclass .lv-v1[aria-pressed=true]::after,#lcd-vclass .lv-sw[aria-pressed=true]::after{content:"";position:absolute;right:6px;top:6px;width:22px;height:22px;border-radius:50%;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.4'%3E%3Cpath d='M5 12.5l4.6 4.6L19 7.6'/%3E%3C/svg%3E") center/15px no-repeat,var(--lv-zg)}
#lcd-vclass button:focus-visible,#lcd-vclass select:focus-visible{outline:3px solid var(--lv-gold);outline-offset:2px}
#lcd-vclass .lv-dalej,#lcd-vclass .lv-cta{display:block;width:100%;margin-top:14px;padding:16px 18px;border:0;border-radius:10px;background:var(--lv-zg);color:#fff;font:800 16px var(--lv-disp);letter-spacing:.05em;text-transform:uppercase;cursor:pointer;box-shadow:0 14px 28px -16px rgba(47,156,104,.8)}
#lcd-vclass .lv-cta:not(.lv-hotovo){background:#e4e0d4;color:var(--lv-mute);box-shadow:none}
#lcd-vclass .lv-cta:disabled{opacity:.75;cursor:default}
#lcd-vclass .lv-suhrn{margin-top:14px}
#lcd-vclass .lv-spolu{display:flex;justify-content:space-between;align-items:baseline;margin:0}
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
  #lcd-vclass-hero .lh-in{grid-template-columns:minmax(0,1fr);min-height:0}
  #lcd-vclass-hero .lh-g{grid-column:1;grid-row:1;aspect-ratio:3/2}
  #lcd-vclass-hero .lh-g::before{inset:auto 0 0 0;width:100%;height:30%;background:linear-gradient(0deg,#0d0b08,rgba(13,11,8,0))}
  #lcd-vclass-hero .lh-sip{display:none}
  #lcd-vclass-hero .lh-tx{grid-column:1;grid-row:2;padding:6px 16px 24px;gap:11px}
  #lcd-vclass-hero .lh-cta{align-self:stretch;text-align:center}
  #lcd-vclass-hero .lh-t{order:-1;margin:-34px 0 6px;position:relative;z-index:2}
  body.lcd-vclass .p-image-wrapper{display:none!important}
  #lcd-vclass-cesta{padding:18px 8px 4px}
  #lcd-vclass-cesta span{font-size:11px;letter-spacing:.02em;white-space:nowrap}
  #lcd-vclass-cesta li:not(.lv-teraz) span{display:none}
  #lcd-vclass-cesta i{width:28px;height:28px;font-size:13px}
  #lcd-vclass-cesta li::before{top:13px;left:calc(-50% + 16px);right:calc(50% + 16px)}
  #lcd-vclass-nakres{position:static;margin:0 0 9px;padding:12px 10px 8px}
  #lcd-vclass-nakres .lv-pl{flex-direction:row;align-items:center;justify-content:center;gap:10px;width:100%}
  #lcd-vclass-nakres .lv-pred{width:56%}
  #lcd-vclass-nakres .lv-zad{width:40%}
}
@media (max-width:480px){
  #lcd-vclass .lv-ot{padding:16px 13px 18px}
  #lcd-vclass .lv-f{grid-template-columns:repeat(4,minmax(0,1fr))}
  #lcd-vclass .lv-seg2{grid-template-columns:repeat(2,minmax(0,1fr))}
  #lcd-vclass .lv-an{grid-template-columns:minmax(0,1fr)}
  #lcd-vclass .lv-vel .lv-s1 small{font-size:12px}
  #lcd-vclass .lv-2{grid-template-columns:minmax(0,1fr)}
  #lcd-vclass .lv-2:has(.lv-fix){grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (prefers-reduced-motion:reduce){#lcd-vclass *,#lcd-vclass-hero *{transition:none!important}}
`;
