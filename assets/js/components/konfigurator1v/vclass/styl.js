// Štýly konfigurátora triedy V. Sú v samostatnej časti, aby ostatné stránky webu nesťahovali ani bajt navyše. Všetko pod body.lcd-vclass.
// Vzhľad podľa konfigurátora 1V: zlatý rám otvoreného kroku, zvolené = zelený rám a fajka, zelené tlačidlo = kam chceme klik.
export const CSS = `
body.lcd-vclass{--lv-ink:#14110c;--lv-line:#d9d4c6;--lv-gold:#c49b31;--lv-gt:#7c5f16;--lv-mute:#6e6752;--lv-text:#3d3728;--lv-sand:#f6f4ef;--lv-zel:#1f7a52;--lv-zg:linear-gradient(100deg,#1d6b4a,#2f9c68 42%,#1f7350);--lv-disp:"Exo 2",system-ui,sans-serif;--lv-body:"Source Sans 3",system-ui,sans-serif}
body.lcd-vclass .p-image-wrapper>*:not(#lcd-vclass-nakres){display:none!important}
body.lcd-vclass .p-info-wrapper>*:not(#lcd-vclass){display:none!important}
body.lcd-vclass .p-info-wrapper{opacity:1!important;visibility:visible!important;display:block!important}
body.lcd-vclass .p-detail-inner-header{display:block;margin:0;padding:0;width:auto}
body.lcd-vclass #lcd-vclass h1{font:800 clamp(28px,3vw,40px)/1.08 var(--lv-disp);text-transform:uppercase;color:var(--lv-ink);margin:0 0 12px;text-align:left}
#lcd-vclass-nakres{position:sticky;top:96px;min-width:0}
#lcd-vclass-nakres .lv-pl{display:flex;flex-direction:column;align-items:center;gap:6px;width:min(100%,calc((100vh - 150px)/1.96));margin:0 auto}
#lcd-vclass-nakres canvas{display:block;height:auto;max-width:100%}
#lcd-vclass-nakres .lv-pred{width:100%}
#lcd-vclass-nakres .lv-zad{width:74.5%}
#lcd-vclass-nakres .lv-pop{margin:8px 0 0;text-align:center;font:400 14px var(--lv-body);color:var(--lv-mute)}
#lcd-vclass{font:400 16px/1.45 var(--lv-body);color:var(--lv-text);min-width:0}
#lcd-vclass *{box-sizing:border-box}
#lcd-vclass .lv-cena{border:1px solid var(--lv-line);border-radius:12px;background:#fff;overflow:hidden}
#lcd-vclass .lv-cena>div:first-child{padding:12px 16px;text-align:center}
#lcd-vclass .lv-cena small{display:block;font:700 12px var(--lv-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--lv-mute)}
#lcd-vclass .lv-c{font:800 clamp(28px,2.6vw,36px)/1.1 var(--lv-disp);color:var(--lv-ink)}
#lcd-vclass .lv-c small{display:inline;font:600 15px var(--lv-body);letter-spacing:0;text-transform:none}
#lcd-vclass .lv-v{background:#eef6f0;color:var(--lv-zel);text-align:center;padding:8px 12px;font-weight:600;border-top:1px solid var(--lv-line)}
#lcd-vclass .lv-po{display:flex;justify-content:space-between;margin:18px 0 6px;font:700 12px var(--lv-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--lv-ink)}
#lcd-vclass .lv-po2{color:var(--lv-gt)}
#lcd-vclass .lv-ps{display:flex;gap:4px;margin-bottom:12px}
#lcd-vclass .lv-ps i{flex:1;height:4px;border-radius:2px;background:var(--lv-line)}
#lcd-vclass .lv-ps i.h{background:var(--lv-zel)}
#lcd-vclass .lv-kr{border:1px solid var(--lv-line);border-radius:12px;background:var(--lv-sand);margin-bottom:9px}
#lcd-vclass .lv-kr.lv-ho{background:#fff}
#lcd-vclass .lv-ot{background:#fff;border-color:var(--lv-gold);border-top-width:3px;box-shadow:0 14px 34px -22px rgba(143,112,32,.6);padding:16px 18px 18px}
#lcd-vclass .lv-k{font:700 12px var(--lv-disp);letter-spacing:.14em;text-transform:uppercase;color:var(--lv-gt)}
#lcd-vclass .lv-t{font:800 clamp(20px,1.8vw,25px)/1.14 var(--lv-disp);text-transform:uppercase;color:var(--lv-ink);margin:3px 0 10px}
#lcd-vclass .lv-p{color:var(--lv-mute);margin:-4px 0 12px;font-size:16px}
#lcd-vclass .lv-r{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px;width:100%;text-align:left;background:none;border:0;font:inherit;color:inherit;cursor:default}
#lcd-vclass .lv-ho .lv-r{cursor:pointer}
#lcd-vclass .lv-c-k{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font:800 13px var(--lv-disp);background:#e4e0d4;color:var(--lv-mute)}
#lcd-vclass .lv-ho .lv-c-k{background:var(--lv-zg);color:#fff}
#lcd-vclass .lv-r-t b{display:block;font:700 15px/1.25 var(--lv-disp);color:var(--lv-ink)}
#lcd-vclass .lv-r-t small{display:block;color:var(--lv-mute);font-size:14px;line-height:1.3}
#lcd-vclass .lv-z{font:800 12px var(--lv-disp);letter-spacing:.1em;color:var(--lv-gt);text-transform:uppercase}
#lcd-vclass .lv-g{display:grid;gap:10px}
#lcd-vclass .lv-g2{grid-template-columns:repeat(2,minmax(0,1fr))}
#lcd-vclass .lv-g3{grid-template-columns:repeat(3,minmax(0,1fr))}
#lcd-vclass .lv-g4{grid-template-columns:repeat(4,minmax(0,1fr))}
#lcd-vclass .lv-v1,#lcd-vclass .lv-sw{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:58px;padding:12px 8px;border:2px solid var(--lv-line);border-radius:12px;background:#fff;color:var(--lv-ink);font:700 15px/1.25 var(--lv-disp);text-align:center;cursor:pointer;overflow:hidden;transition:border-color .2s}
#lcd-vclass .lv-v1 b{font:800 24px/1 var(--lv-disp)}
#lcd-vclass .lv-v1 span{font-weight:700}
#lcd-vclass .lv-v1 b+span{font:400 14px/1.25 var(--lv-body);color:var(--lv-mute)}
#lcd-vclass .lv-v1 em{font:700 15px var(--lv-disp);font-style:normal;color:var(--lv-gt)}
#lcd-vclass .lv-foto{padding:0}
#lcd-vclass .lv-foto img{display:block;width:100%;aspect-ratio:1.25;object-fit:cover}
#lcd-vclass .lv-foto span{display:block;padding:8px 6px 10px}
#lcd-vclass .lv-f{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
#lcd-vclass .lv-sw{min-height:0;padding:0;border-width:2px;font:600 13px/1.15 var(--lv-body);color:var(--lv-text);justify-content:flex-start}
#lcd-vclass .lv-sw img{display:block;width:100%;aspect-ratio:1;object-fit:cover}
#lcd-vclass .lv-sw span{display:block;padding:4px 3px 6px;min-height:36px}
#lcd-vclass [aria-pressed=true]{border-color:var(--lv-zel)}
#lcd-vclass [aria-pressed=true]::after{content:"";position:absolute;right:6px;top:6px;width:22px;height:22px;border-radius:50%;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3.4'%3E%3Cpath d='M5 12.5l4.6 4.6L19 7.6'/%3E%3C/svg%3E") center/15px no-repeat,var(--lv-zg)}
#lcd-vclass button:focus-visible,#lcd-vclass select:focus-visible{outline:3px solid var(--lv-gold);outline-offset:2px}
#lcd-vclass .lv-l{display:block;margin:14px 0 6px;font:700 12px var(--lv-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--lv-text)}
#lcd-vclass .lv-l:first-of-type{margin-top:4px}
#lcd-vclass .lv-sel{width:100%;height:auto;padding:12px 14px;border:1px solid var(--lv-line);border-radius:9px;background:#fff;font:400 16px var(--lv-body);color:var(--lv-ink)}
#lcd-vclass .lv-dalej,#lcd-vclass .lv-cta{display:block;width:100%;margin-top:14px;padding:15px 18px;border:0;border-radius:10px;background:var(--lv-zg);color:#fff;font:800 16px var(--lv-disp);letter-spacing:.04em;text-transform:uppercase;cursor:pointer}
#lcd-vclass .lv-cta:not(.lv-hotovo){background:#e4e0d4;color:var(--lv-mute)}
#lcd-vclass .lv-cta:disabled{opacity:.75;cursor:default}
#lcd-vclass .lv-suhrn{margin-top:14px}
#lcd-vclass .lv-spolu{display:flex;justify-content:space-between;align-items:baseline;margin:0}
#lcd-vclass .lv-spolu span{font:700 12px var(--lv-disp);letter-spacing:.1em;text-transform:uppercase;color:var(--lv-ink)}
#lcd-vclass .lv-spolu b{font:800 30px var(--lv-disp);color:var(--lv-ink)}
#lcd-vclass .lv-spr{margin:10px 0 0;padding:11px 13px;border-radius:9px;background:#fbf7ea;border:1px solid #e9dcae;color:var(--lv-gt);font-size:15px}
@media (max-width:991px){
  #lcd-vclass-nakres{position:static}
  #lcd-vclass-nakres .lv-pl{flex-direction:row;align-items:center;justify-content:center;gap:10px;width:100%}
  #lcd-vclass-nakres .lv-pred{width:56%}
  #lcd-vclass-nakres .lv-zad{width:40%}
}
@media (max-width:480px){
  #lcd-vclass .lv-g3:not(:has(.lv-foto)){grid-template-columns:1fr}
  #lcd-vclass .lv-g2{grid-template-columns:1fr}
  #lcd-vclass .lv-ot{padding:14px 12px 16px}
  #lcd-vclass .lv-f{grid-template-columns:repeat(4,minmax(0,1fr))}
}
@media (prefers-reduced-motion:reduce){#lcd-vclass *{transition:none!important}}
`;
