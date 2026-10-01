import { LCDH_REELS, LCDH_REELS_CZ } from "./lcdHome-reels.js";
import { LCDH_MARKUP, LCDH_MARKUP_CZ } from "./lcdHome-markup.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);
/* Lenis smooth scroll - LEN desktop (rada kamarata: pod tablet breakpoint vypnute) */
var lcdhLenisMQ = matchMedia("(min-width:1025px) and (hover:hover) and (pointer:fine)");
var lcdhLenis = null;
function lcdhLenisRaf(t){ if (lcdhLenis) { lcdhLenis.raf(t); requestAnimationFrame(lcdhLenisRaf); } }
function lcdhLenisSync(){
  /* LEN desktop - Michal 2026-08-27: "Lenis nechaj len na pc nie na telefone" */
  var rezim = lcdhLenisMQ.matches ? "pc" : null;
  if (rezim && !lcdhLenis) {
    lcdhLenis = new Lenis({ lerp: 0.12 });
    lcdhLenis.on("scroll", ScrollTrigger.update);
    requestAnimationFrame(lcdhLenisRaf);
    /* Lenis si vysku stranky odmeria pri starte. Markup, reels aj obrazky pribudaju
       az potom -> limit ostane nespravny (merane 2026-08-27 na live: +293 px) a stranka
       sa da doscrollovat "za koniec", co sposobuje trhanie a preblikavanie cudzieho obsahu.
       Preto prepocet po kazdej zmene vysky. */
    var lcdhPrepocetT = null;
    var lcdhPrepocet = function () {
      clearTimeout(lcdhPrepocetT);
      lcdhPrepocetT = setTimeout(function () { if (lcdhLenis) lcdhLenis.resize(); }, 120);
    };
    if (window.ResizeObserver) {
      var lcdhRO = new ResizeObserver(lcdhPrepocet);
      lcdhRO.observe(document.documentElement);
      var lcdhROCiel = function () {
        var h = document.getElementById("lcd-home") || document.getElementById("lcd-rz");
        if (h) lcdhRO.observe(h);
      };
      lcdhROCiel(); setTimeout(lcdhROCiel, 1500);
    }
    addEventListener("load", lcdhPrepocet);
    [400, 1500, 3000, 6000].forEach(function (ms) { setTimeout(lcdhPrepocet, ms); });
    /* Vodorovne pasy: koliesko NADOL musi patrit Lenisu, inak nativny scroll bojuje
       s Lenisom a stranka sa tahá spat (Michal 2026-08-27: modul 04 "nechce ma pustit
       par scrolov dole"). Nativne ostava len vodorovne gesto a dotyk. */
    var lcdhLenisVyn = function () {
      [].forEach.call(document.querySelectorAll(".deck,.vids,#revs,.duo,.modl-selector-wrap"),
        function (el) {
          el.removeAttribute("data-lenis-prevent");
          el.setAttribute("data-lenis-prevent-horizontal", "");
          el.setAttribute("data-lenis-prevent-touch", "");
        });
    };
    lcdhLenisVyn(); setTimeout(lcdhLenisVyn, 1500); setTimeout(lcdhLenisVyn, 4000);
  } else if (!rezim && lcdhLenis) { lcdhLenis.destroy(); lcdhLenis = null; }
}
lcdhLenisSync();
lcdhLenisMQ.addEventListener("change", lcdhLenisSync);
window.__lcdhLenis = function(){ return lcdhLenis; };
/* lcdHome.js - GENEROVANE extract-lcd-home.py, RUCNE NEEDITUJ.
   Zdroj: hp-tpl.html
   Obal riesi to, ze povodny <script> v navrhu bezal az ZA markupom.
   V bundli luxuryCar.js sa spusta skor, preto DOMContentLoaded + guard. */
(function () {
  if (window.__LCD_HOME_INIT__) return;
  window.__LCD_HOME_INIT__ = true;

  /* zivy konfigurator (cars.js) sa ADOPTUJE do karty navrhu - logika sa nemeni */
  function lcdhAdoptujSelector(root) {
    var pokusy = 0;
    var t = setInterval(function () {
      pokusy++;
      var ms = document.querySelector("body.lcdh-on .overall-wrapper > section .model-selector, .model-selector");
      if (!ms) { if (pokusy > 40) clearInterval(t); return; }
      clearInterval(t);
      if (root.contains(ms)) return;
      var karta = root.querySelector("#konfCard");
      if (!karta) return;
      var stareMiesto = ms.closest("section") && !root.contains(ms.closest("section"))
                        ? ms.closest("section") : ms.parentElement;
      [".tabs", "#fields"].forEach(function (s) {
        var e = karta.querySelector(s);
        if (e) e.style.display = "none";
      });
      var slot = document.createElement("div");
      slot.className = "lcdh-konf-slot";
      karta.appendChild(slot);
      slot.appendChild(ms);
      var pozn = karta.querySelector(".konf-note");
      if (pozn) karta.appendChild(pozn);   /* poznamka patri POD tlacidlo (navrh) */
      if (stareMiesto && stareMiesto !== ms) stareMiesto.style.display = "none";
    }, 250);
  }
  /* Zmaze zvysky starej titulky. Idempotentne — da sa volat opakovane.

     !! POUCENIE Z 27. 8. 2026 (commit 69ad97c -> revert c312341) !!
     Prve riesenie maazalo tieto bloky hned po vlozeni noveho dizajnu a ROZBILO
     konfigurator na oboch weboch. Dovod: main.js/initModelSelect() vklada
     konfigurator RELATIVNE k staremu obsahu —
       $(section).insertAfter(".in-index .content-wrapper.container:eq(1)")
     — a bezi az v callbacku $.getJSON(), teda dlho po boote. Ked kotva zmizne
     skor, jQuery nema kam vlozit a konfigurator nevznikne vobec (0 <select>).
     Staticka kontrola to neodhali: v HTML ziadna taka zavislost nie je vidno.

     Preto sa NEMAZE NIC, kym nie je konfigurator adoptovany v novom dizajne.
     Ked sa adopcia nestane, necha sa stranka tak — radsej pomalsia nez rozbita. */
  function lcdhUpracStaruHP() {
    var wrap = document.querySelector(".overall-wrapper");
    if (!wrap || !document.getElementById("lcd-home")) return 0;
    /* tvrda poistka: bez adoptovaneho konfiguratora sa nemaze nic */
    if (!document.querySelector("#lcd-home .lcdh-konf-slot .model-selector")) return 0;
    var CHRANENE_ID = ["header", "content-wrapper", "model-selector", "footer", "lcd-home"];
    var CHRANENE_TR = ["user-action", "top-navigation-bar"];
    var n = 0;
    [].slice.call(wrap.children).forEach(function (el) {
      if (el.id && CHRANENE_ID.indexOf(el.id) !== -1) return;
      if (CHRANENE_TR.some(function (c) { return el.classList.contains(c); })) return;
      /* cokolvek, co este moze byt zive alebo sluzit ako kotva pre iny skript */
      if (el.querySelector(".model-selector, select, form, script, iframe")) return;
      if (!el.classList.contains("content-wrapper") &&
          !el.classList.contains("lcd-reviews-widget")) return;
      el.remove(); n++;
    });
    [].forEach.call(document.querySelectorAll(".lcd-reviews-widget"), function (el) {
      if (el.closest("#lcd-home")) return;
      if (el.querySelector("select, form, script, iframe")) return;
      el.remove(); n++;
    });
    return n;
  }

  /* Caka na adopciu konfiguratora a az potom uprace. Po adopcii este chvilu pocka —
     v tom istom $.getJSON callbacku bezia aj googleReviews() a lcdVideos(),
     ktore takisto vkladaju do stareho obsahu. */
  function lcdhCakajAUprac() {
    var pokusy = 0;
    var t = setInterval(function () {
      pokusy++;
      if (document.querySelector("#lcd-home .lcdh-konf-slot .model-selector")) {
        clearInterval(t);
        setTimeout(lcdhUpracStaruHP, 1500);
        setTimeout(lcdhUpracStaruHP, 4000);
        setTimeout(lcdhUpracStaruHP, 9000);
        return;
      }
      if (pokusy > 100) clearInterval(t);   /* 25 s a koniec — radsej neupratovat */
    }, 250);
  }

  /* Kontaktny formular v module 11. Shoptet vo formulari prijima len meno,
     e-mail a spravu, takze telefon a udaje o aute pripneme na zaciatok
     spravy — rovnako to robi aj formular na /kontakty/. Odosielame cez
     fetch, aby clovek neodisiel z uvodnej stranky; ked to zlyha, formular
     sa odosle klasicky a sprava sa nestrati. */
  function lcdhKontakt(root, cz) {
    var f = root.querySelector("#lcdKontakt");
    if (!f) return;
    var stav = root.querySelector("#kfStav");
    var NL = String.fromCharCode(10);
    var T = cz
      ? { hotovo: "Děkujeme, zpráva odešla. Ozveme se Vám zpravidla do hodiny.",
          odosielam: "Odesílám…", tel: "Telefon: ", auto: "Auto: " }
      : { hotovo: "Ďakujeme, správa odišla. Ozveme sa Vám spravidla do hodiny.",
          odosielam: "Odosielam…", tel: "Telefón: ", auto: "Auto: " };

    function hodnota(id) {
      var p = root.querySelector("#" + id);
      return p ? p.value.trim() : "";
    }
    function zlozSpravu() {
      var pole = f.querySelector('textarea[name="message"]');
      if (!pole || pole.dataset.zlozene) return;
      var auto = [hodnota("kfZn"), hodnota("kfMo"), hodnota("kfRo"),
                  hodnota("kfTy")].filter(Boolean).join(" ");
      var hlava = T.tel + hodnota("kfTel");
      if (auto) hlava += NL + T.auto + auto;
      pole.value = hlava + NL + NL + pole.value.trim();
      pole.dataset.zlozene = "1";
    }

    f.addEventListener("submit", function (e) {
      f.classList.add("overene");
      if (!f.checkValidity()) {
        e.preventDefault();
        var prve = f.querySelector(":invalid");
        if (prve) prve.focus();
        return;
      }
      zlozSpravu();
      if (!window.fetch || !window.FormData) return;
      e.preventDefault();
      var tl = f.querySelector('button[type="submit"]');
      var povodny = tl.textContent;
      tl.disabled = true;
      tl.textContent = T.odosielam;
      fetch(f.action, { method: "POST", body: new FormData(f),
                        credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          f.reset();
          delete f.querySelector('textarea[name="message"]').dataset.zlozene;
          f.classList.remove("overene");
          if (stav) {
            stav.textContent = T.hotovo;
            stav.classList.remove("zle");
            stav.hidden = false;
          }
        })
        .catch(function () { f.submit(); })
        .then(function () { tl.disabled = false; tl.textContent = povodny; });
    });
  }

  function boot() {
    /* len SK web - ceska faza ma vlastne preklady a ide zvlast */
    var lcdhCZ = location.hostname.indexOf("luxurycardesign.cz") !== -1;
    if (location.hostname.indexOf("luxurycardesign.sk") === -1 && !lcdhCZ) return;
    /* len titulna stranka (Shoptet: body.in-index) */
    if (!document.body || !document.body.classList.contains("in-index")) return;
    if (!document.getElementById("lcd-home")) {
      var lcdhHost  = document.querySelector(".overall-wrapper") || document.body;
      var lcdhKotva = lcdhHost.querySelector(".content-wrapper.homepage-box, .content-wrapper.container")
                      || document.getElementById("footer");
      var lcdhWrap = document.createElement("div");
      lcdhWrap.innerHTML = lcdhCZ ? LCDH_MARKUP_CZ : LCDH_MARKUP;
      var lcdhRoot = lcdhWrap.firstElementChild;
      if (!lcdhRoot) return;
      /* plynuly nastup na PC: kratky fade-in namiesto tvrdeho skoku */
      lcdhRoot.style.opacity = "0";
      lcdhRoot.style.transition = "opacity .38s ease";
      lcdhHost.insertBefore(lcdhRoot, lcdhKotva);
      requestAnimationFrame(function () { requestAnimationFrame(function () { lcdhRoot.style.opacity = "1"; }); });
      setTimeout(function () { lcdhRoot.style.opacity = "1"; }, 900);
      /* skryt povodny obsah titulky - uzko cielene, len pod body.lcdh-on */
      var lcdhSt = document.createElement("style");
      lcdhSt.id = "lcdh-gate";
      lcdhSt.textContent =
        "body.lcdh-on .content-wrapper.homepage-box," +
        "body.lcdh-on .content-wrapper.container," +
        "body.lcdh-on .lcd-reviews-widget," +
        "body.lcdh-on #header," +
        "body.lcdh-on .top-navigation-bar{display:none !important}" +
        "body.lcdh-on #footer{margin-top:-1px !important}" +
        /* overflow:hidden na wrapperi zabijal position:sticky; clip oreze rovnako,
           ale nevytvara scroll container */
        "body.lcdh-on .overall-wrapper{overflow:clip}" +
        "#lcd-home .lcdh-konf-slot{margin-top:16px;text-align:left}" +
        "#lcd-home .lcdh-konf-slot .model-selector > h2," +
        "#lcd-home .lcdh-konf-slot .model-selector > .prefix{display:none}" +
        "#lcd-home .lcdh-konf-slot .model-selector{margin:0;max-width:none;width:100%}";
      document.head.appendChild(lcdhSt);
      document.body.classList.add("lcdh-on");
      /* Stara homepage ostavala v DOM len skryta cez display:none — prehliadac ju aj
         tak cely cas stavia a stahuje jej obrazky. Michal 2026-08-27: "sprav to aby
         bola iba jedna homepage". Merane na live pred zmenou: 9 616 prvkov, z toho
         4 658 stara HP; widget recenzii (stavia ho lcd-reviews.js az za behu) sam
         stiahol 96 fotiek, ktore nikto nikdy neuvidi.
         Bezi hned po vlozeni noveho dizajnu, teda skor nez lcd-reviews.js stihne
         svoj DOMContentLoaded — vdaka tomu sa tie fotky vobec nezacnu stahovat. */
      lcdhCakajAUprac();
      /* modul 11: kontaktny formular */
      lcdhKontakt(lcdhRoot, lcdhCZ);
      /* modul 07: VSETKY SK reels z kanala (nahradza staticke dlazdice) */
      try {
        var lcdhReels = lcdhCZ && typeof LCDH_REELS_CZ !== "undefined" && LCDH_REELS_CZ.length
                        ? LCDH_REELS_CZ : (typeof LCDH_REELS !== "undefined" ? LCDH_REELS : []);
        if (lcdhReels.length) {
          var lcdhVids = lcdhRoot.querySelector("#vids");
          if (lcdhVids) {
            var lcdhFrag = document.createDocumentFragment();
            lcdhReels.forEach(function (r) {
              var b = document.createElement("button");
              b.type = "button"; b.className = "vid"; b.setAttribute("data-yt", r[0]);
              var im = document.createElement("img");
              im.alt = ""; im.decoding = "async";
              /* src sa NEnastavuje hned - 497 dekodovanych thumbnailov zabijalo iOS Safari
                 (native lazy je v horizontalnom pase nanic: vsetky su v rovnakej vyske) */
              im.setAttribute("data-src", "https://i.ytimg.com/vi/" + r[0] + "/oar2.jpg");
              /* fallback retaz: oar2 -> frame0 (realny prvy zaber) -> hqdefault */
              im.onerror = function(){
                var krok = +(this.getAttribute("data-fb") || 0) + 1;
                this.setAttribute("data-fb", krok);
                var u = krok === 1 ? "https://i.ytimg.com/vi/" + r[0] + "/frame0.jpg"
                      : krok === 2 ? "https://i.ytimg.com/vi/" + r[0] + "/hqdefault.jpg" : null;
                if (!u) { this.onerror = null; return; }
                this.setAttribute("data-src", u); this.src = u;
              };
              var pl = document.createElement("span"); pl.className = "play";
              var cp = document.createElement("span"); cp.className = "cap"; cp.textContent = r[1];
              b.appendChild(im); b.appendChild(pl); b.appendChild(cp);
              lcdhFrag.appendChild(b);
            });
            lcdhVids.innerHTML = "";
            lcdhVids.appendChild(lcdhFrag);
            /* okno: nacitavaj len okolie viditelneho vyseku pasu, daleke uvolni z pamate */
            try {
              var lcdhIO = new IntersectionObserver(function (es) {
                es.forEach(function (e) {
                  var im2 = e.target.firstElementChild;
                  if (!im2 || im2.tagName !== "IMG") return;
                  if (e.isIntersecting) {
                    if (!im2.getAttribute("src")) im2.src = im2.getAttribute("data-src");
                  } else if (im2.getAttribute("src")) {
                    im2.removeAttribute("src");
                  }
                });
              }, { root: lcdhVids, rootMargin: "0px 1200px 0px 1200px", threshold: 0 });
              [].forEach.call(lcdhVids.children, function (b2) { lcdhIO.observe(b2); });
            } catch (eIO) {
              [].forEach.call(lcdhVids.children, function (b2, i2) {
                var im3 = b2.firstElementChild;
                if (i2 < 30 && im3) im3.src = im3.getAttribute("data-src");
              });
            }
          }
        }
      } catch (e) {}
      lcdhAdoptujSelector(lcdhRoot);
    }
    var LCDH = document.getElementById("lcd-home");
    /* smooth scroll na vnutrostrankove kotvy (nahrada za html{scroll-behavior}) */
    function lcdhSmoothAnchor(e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    LCDH.addEventListener("click", lcdhSmoothAnchor);
  /* stranka bez noveho HP */
(function(){
  /* prepojenie legendy a hotspotov na materiali */
  (function(){
    var L=[].slice.call(LCDH.querySelectorAll('.leg')),
        H=[].slice.call(LCDH.querySelectorAll('.exp .hot'));
    function set(i,on){ if(L[i])L[i].classList.toggle('on',on); if(H[i])H[i].classList.toggle('on',on); }
    L.forEach(function(el,i){
      el.addEventListener('mouseenter',function(){set(i,true)});
      el.addEventListener('mouseleave',function(){set(i,false)});
      var h=el.querySelector('.leg-h'), d=el.querySelector('.leg-d');
      if(!h||!d) return;
      h.addEventListener('click',function(){
        var open=h.getAttribute('aria-expanded')==='true';
        /* naraz je otvorený len jeden popis */
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
  /* videa sa otvaraju v lightboxe priamo na stranke, nie v novej karte */
  (function(){
    var lb=document.getElementById('lb'), fr=document.getElementById('lbFrame'),
        cap=document.getElementById('lbCap'), last=null;
    if(!lb) return;
    function open(id,title,src){
      last=src;
      if(id && id.indexOf('.mp4')>-1){
        fr.innerHTML='<video src="'+id+'" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;background:#000"></video>';
        cap.textContent=title||'';
        lb.hidden=false;
        requestAnimationFrame(function(){ lb.classList.add('on') });
        document.body.style.overflow='hidden';
        return;
      }
      fr.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+id
        +'?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="'+(title||'Video')
        +'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"'
        +' referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
      cap.textContent=title||'';
      lb.hidden=false;
      requestAnimationFrame(function(){ lb.classList.add('on') });
      document.body.style.overflow='hidden';
      var x=document.getElementById('lbX'); if(x) x.focus();
    }
    function close(){
      lb.classList.remove('on');
      document.body.style.overflow='';
      setTimeout(function(){ lb.hidden=true; fr.innerHTML=''; },300);
      if(last&&last.focus) last.focus();
    }
    [].forEach.call(LCDH.querySelectorAll('.ref-v'),function(a){
      a.addEventListener('click',function(e){
        var id=a.dataset.yt;
        if(!id) return;
        e.preventDefault();
        open(id, a.dataset.cap||'', a);
      });
    });
    [].forEach.call(LCDH.querySelectorAll('.vid'),function(a){
      a.addEventListener('click',function(e){
        var id=a.dataset.yt;
        if(!id) return;
        e.preventDefault();
        var c=a.querySelector('.cap');
        open(id, c?c.textContent.trim():'', a);
      });
    });
    lb.addEventListener('click',function(e){
      if(e.target===lb||e.target===document.getElementById('lbX')||e.target.closest('.lb-x')) close();
    });
    addEventListener('keydown',function(e){ if(e.key==='Escape'&&!lb.hidden) close() });
  })();

  var vids=document.getElementById('vids');
  if(vids){
    var vstep=function(){var c=vids.querySelector('.vid');return c?c.getBoundingClientRect().width+16:220};
    document.getElementById('vidPrev').onclick=function(){vids.scrollBy({left:-vstep(),behavior:'smooth'})};
    document.getElementById('vidNext').onclick=function(){vids.scrollBy({left:vstep(),behavior:'smooth'})};
  }
  /* coverflow: stredna karta vpredu, bocne miznu do 'strechy' */
  function lcdhCoverflow(cont, sel){
    if(!cont) return;
    /* iOS nevykresli <video> pod 3D transformaciou -> refs na dotyku len 2D */
    var plain2d = cont.classList.contains('refs') && matchMedia('(hover:none)').matches;
    var ticking=false;
    function upd(){
      ticking=false;
      var mid=cont.getBoundingClientRect().left + cont.clientWidth/2;
      var cw=cont.clientWidth;
      [].forEach.call(cont.querySelectorAll(sel),function(el){
        var r=el.getBoundingClientRect();
        var c=r.left + r.width/2;
        if(c < mid-cw || c > mid+cw){
          if(el.style.transform){ el.style.transform=''; el.style.zIndex=''; }
          return;
        }
        var d=Math.max(-1, Math.min(1,(c-mid)/(r.width*1.15)));
        var a=Math.abs(d);
        el.style.transform = plain2d
          ? 'scale('+(1-a*0.14)+') translateY('+Math.round(a*8)+'px)'
          : 'rotateY('+(-d*16)+'deg) translateZ('+(-a*95)+'px) scale('+(1-a*0.10)+')';
        el.style.zIndex=String(100-Math.round(a*40));
      });
    }
    function req(){ if(!ticking){ ticking=true; requestAnimationFrame(upd); } }
    cont.addEventListener('scroll',req,{passive:true});
    addEventListener('resize',req);
    req(); setTimeout(req,400); setTimeout(req,1200);
  }
  lcdhCoverflow(LCDH.querySelector('.deck.refs'),'.ref');
  lcdhCoverflow(document.getElementById('vids'),'.vid');

  /* produktove decky — nekonecny slider (klikanim sa toci dokola ako retaz) */
  [].forEach.call(LCDH.querySelectorAll('.deckwrap'),function(w){
    var d=w.querySelector('.deck'), nav=w.querySelector('.decknav'),
        b=nav?nav.querySelectorAll('button'):[],
        orig=[].slice.call(d.children), loop=false, oneW=0, t=null,
        noloop=w.hasAttribute("data-noloop");
    function gap(){ return parseFloat(getComputedStyle(d).columnGap)||16 }
    function step(){ var c=d.querySelector('.pc,.ref'); return c?c.getBoundingClientRect().width+gap():280 }
    function measure(){ oneW=0; orig.forEach(function(el){ oneW+=el.getBoundingClientRect().width+gap() }); }
    function overflows(){ return oneW-gap() > d.clientWidth+6 }
    function normalize(){
      if(!loop||!oneW) return;
      /* obsah je identicky, takze skok o jednu sadu je nevideitelny;
         stredne pasmo je [1.5w, 2.5w] z celkovych 5 sad */
      while(d.scrollLeft < oneW*2.5) d.scrollLeft += oneW;
      while(d.scrollLeft > oneW*4.5) d.scrollLeft -= oneW;
    }
    /* iOS: scrollLeft sa pocas momentum nedodrzi -> normalizuj az v uplnom pokoji */
    var idleT=null, lastX=-1;
    function idleWatch(){
      cancelAnimationFrame(idleT);
      var stable=0;
      (function tick(){
        if(Math.abs(d.scrollLeft-lastX)<1){ stable++; } else { stable=0; }
        lastX=d.scrollLeft;
        if(stable>=6){ normalize(); return; }
        idleT=requestAnimationFrame(tick);
      })();
    }
    function build(){
      measure();
      var n=overflows();
      if(nav) nav.style.display = n ? 'flex' : 'none';
      if(noloop) return;
      if(n && !loop){
        var pre=document.createDocumentFragment(), post=document.createDocumentFragment();
        for(var kk=0;kk<3;kk++){
          orig.forEach(function(el){
            [pre,post].forEach(function(frag){
              var c=el.cloneNode(true);
              c.setAttribute('aria-hidden','true'); c.setAttribute('data-clone','1'); c.tabIndex=-1;
              c.classList.add('on');         /* klon vznika az po reveal observeri */
              frag.appendChild(c);
            });
          });
        }
        d.appendChild(post); d.insertBefore(pre, d.firstChild);
        loop=true; d.scrollLeft=oneW*3;
      } else if(!n && loop){
        [].slice.call(d.querySelectorAll('[data-clone]')).forEach(function(e){e.remove()});
        loop=false; d.scrollLeft=0;
      } else if(loop){ normalize(); }
    }
    d.addEventListener('scroll',function(){
      if(loop&&oneW){
        var max=d.scrollWidth-d.clientWidth;
        if(d.scrollLeft<oneW*0.7 || d.scrollLeft>max-oneW*0.7) normalize();
      }
      clearTimeout(t); t=setTimeout(idleWatch,80)
    },{passive:true});
    if(b.length){
      b[0].onclick=function(){ normalize(); d.scrollBy({left:-step(),behavior:'smooth'}) };
      b[1].onclick=function(){ normalize(); d.scrollBy({left:step(),behavior:'smooth'}) };
    }
    build();
    var rt=null;
    addEventListener('resize',function(){ clearTimeout(rt); rt=setTimeout(build,160) });
    setTimeout(build,400);
  });
  /* pred a po — posuvnik (mys, dotyk aj klavesnica) */
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
      var t = on ? 'clip-path .45s cubic-bezier(.2,.7,.2,1)' : '';
      top.style.transition = t;
      line.style.transition = h.style.transition = on ? 'left .45s cubic-bezier(.2,.7,.2,1)' : '';
    }
    ba.addEventListener('pointerdown',function(e){
      drag=true; ease(false); try{ba.setPointerCapture(e.pointerId)}catch(_){}
      set(xTo(e),true); e.preventDefault();
    });
    /* mysou staci prejst — netreba drzat tlacidlo; dotykom sa taha */
    ba.addEventListener('pointermove',function(e){
      if(drag){ ease(false); ciel=null; set(xTo(e),true); return; }
      if(e.pointerType==='mouse'){ ease(false); ciel=xTo(e); if(!lerpT) lerpBez(); }
    });
    ba.addEventListener('pointerleave',function(e){
      if(e.pointerType==='mouse' && !drag){ ciel=null; ease(true); set(50,true); setTimeout(function(){ease(false)},500); }
    });
    ['pointerup','pointercancel'].forEach(function(t){
      ba.addEventListener(t,function(e){ drag=false; try{ba.releasePointerCapture(e.pointerId)}catch(_){} });
    });
    h.addEventListener('keydown',function(e){
      var d = e.key==='ArrowLeft'?-3 : e.key==='ArrowRight'?3 : 0;
      if(d){ e.preventDefault(); set(pos+d,true); }
    });
    set(50,false);
    var hintEl=ba.parentNode.querySelector('.ba-hint');
    if(hintEl && matchMedia('(hover: hover) and (pointer: fine)').matches)
      hintEl.textContent='Prejdite myšou cez fotku';
    /* jednorazova napoveda, ked sa sekcia objavi — ukaze, ze sa s tym da hybat */
    if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      var done=false;
      var io=new IntersectionObserver(function(en){
        if(!en[0].isIntersecting||done) return; done=true; io.disconnect();
        var steps=[[68,600],[36,1750],[50,2950]];
        steps.forEach(function(st){ setTimeout(function(){ if(!ba.classList.contains('moved')){
          top.style.transition='clip-path .95s cubic-bezier(.25,.6,.25,1)';
          line.style.transition=h.style.transition='left .95s cubic-bezier(.25,.6,.25,1)';
          set(st[0],false);
          setTimeout(function(){ top.style.transition=line.style.transition=h.style.transition='' },1000);
        }},st[1]); });
      },{threshold:0.45});
      io.observe(ba);
    }
  })();

  /* nahladove slucky: na PC hraju vsetky viditelne, na telefone len to v strede */
  (function(){
    var deck=LCDH.querySelector('.deck.refs');
    var vs=[].slice.call(LCDH.querySelectorAll('.ref-v video'));
    if(!vs.length||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var MOB=matchMedia('(max-width:820px)'), onScreen=false, cards=deck?[].slice.call(deck.children):[];
    function play(v){ var r=v.play(); if(r&&r.catch) r.catch(function(){}) }
    function mid(){
      if(!deck) return -1;
      var c=deck.scrollLeft+deck.clientWidth/2, best=-1, bd=1e9;
      cards.forEach(function(el,i){
        var d=Math.abs(el.offsetLeft+el.offsetWidth/2-c);
        if(d<bd){ bd=d; best=i }
      });
      return best;
    }
    function sync(){
      if(!deck) return;
      var m = MOB.matches ? mid() : -1;
      cards.forEach(function(el,i){
        el.classList.toggle('mid', MOB.matches && i===m);
        var v=el.querySelector('video'); if(!v) return;
        /* hraju vsetky viditelne dlazdice — aj tie po krajoch */
        /* PC: hraju vsetky viditelne; telefon: LEN stredna (6 dekoderov drhlo swipe) */
        var chce = onScreen && (!MOB.matches || i===m);
        chce ? play(v) : v.pause();
      });
    }
    /* stred zacina na slovenskej recenzii */
    function center(i){
      if(!deck||!cards[i]) return;
      deck.scrollLeft = cards[i].offsetLeft + cards[i].offsetWidth/2 - deck.clientWidth/2;
    }
    if(deck){
      var st=null;
      deck.addEventListener('scroll',function(){ clearTimeout(st); st=setTimeout(sync,90) },{passive:true});
      MOB.addEventListener('change',function(){ if(MOB.matches) center(0); sync() });
      addEventListener('resize',function(){ clearTimeout(st); st=setTimeout(sync,160) });
      if('IntersectionObserver' in window){
        new IntersectionObserver(function(en){
          onScreen = en[0].isIntersecting; sync();
        },{threshold:0.15}).observe(deck);
      } else { onScreen=true; }
      requestAnimationFrame(function(){ if(MOB.matches) center(0); sync() });
    } else { vs.forEach(play) }
  })();

  /* nekonecny pas: ked sa pri kraji minu dlazdice, presunieme ich z druhej strany.
     Poloha sa dopocita tak, aby to divak nezbadal — nic sa nekopiruje, len presuva. */
  function nekonecnyPas(track){
    if(!track||track.children.length<4) return;
    var cs=getComputedStyle(track), gap=parseFloat(cs.columnGap||cs.gap)||0;
    function w(el){ return el.getBoundingClientRect().width+gap }
    function room(){ return track.scrollWidth-track.clientWidth-track.scrollLeft }
    var busy=false, spi=false;
    function fix(){
      /* fix() meni scrollLeft -> scroll event -> fix() ... busy + spi lomia slucku,
         ktora inak tocila layout merania donekonecna (4 s reflow z 5 s idle na PC) */
      if(busy||spi) return;
      if(track.scrollWidth-track.clientWidth<12) return;
      /* prikratky pas: obe strany chcu doplnat naraz -> oscilacia. Radsej spat. */
      if(track.scrollWidth - track.clientWidth < w(track.firstElementChild)*5){
        spi=true; setTimeout(function(){spi=false},3000); return;
      }
      busy=true;
      var pred=track.scrollLeft;
      /* prichytavanie na chvilu vypneme, inak prehliadac posun vrati spat */
      var snap=track.style.scrollSnapType;
      track.style.scrollSnapType='none';
      var g=0;
      /* vlavo nechavame rozbeh na dve a pol dlazdice, aby ani rychle svihnutie nenarazilo na koniec */
      while(track.scrollLeft < w(track.firstElementChild)*2.4 && g++<12){
        var last=track.lastElementChild, lw=w(last);
        track.insertBefore(last,track.firstElementChild);
        track.scrollLeft+=lw;
      }
      g=0;
      while(room() < w(track.lastElementChild)*2.4 && g++<12){
        var first=track.firstElementChild, fw=w(first);
        track.appendChild(first);
        track.scrollLeft-=fw;
      }
      /* bez pokroku = pas sa nevie pohnut (clamp/snap) - 2 s spanku, nech sa netoci naprazdno */
      if(Math.abs(track.scrollLeft-pred)<1){ spi=true; setTimeout(function(){spi=false},2000); }
      requestAnimationFrame(function(){ track.style.scrollSnapType=snap||''; busy=false });
    }
    var t=null;
    function later(ms){ clearTimeout(t); t=setTimeout(fix,ms) }
    /* handler NESMIE citat layout - kazde citanie pri scrolle je forced reflow */
    track.addEventListener('scroll',function(){ if(!busy) later(120); },{passive:true});
    if('onscrollend' in window) track.addEventListener('scrollend',function(){ fix() });
    addEventListener('resize',function(){ later(220) });
    requestAnimationFrame(function(){ fix(); requestAnimationFrame(fix) });
  }
  nekonecnyPas(LCDH.querySelector('.deck.refs'));
  nekonecnyPas(document.getElementById('revs'));

  var revs=document.getElementById('revs');
  if(revs){
    var step=function(){var c=revs.querySelector('.rev');return c?c.getBoundingClientRect().width+16:300};
    document.getElementById('revPrev').onclick=function(){revs.scrollBy({left:-step(),behavior:'smooth'})};
    document.getElementById('revNext').onclick=function(){revs.scrollBy({left:step(),behavior:'smooth'})};
  }
  /* konfigurator: polia navyse pribudaju az ked su pre dane vozidlo potrebne (ako na Shoptete).
     Tlacidlo je vzdy aktivne — chybajuci vyber sa oznaci hlaskou pri poli. */
  var fieldsEl=document.getElementById('fields'), konfNote=document.getElementById('konfNote');
  var FS=fieldsEl?[].slice.call(fieldsEl.querySelectorAll('.field:not(.go)')):[],
      goBtn=fieldsEl?fieldsEl.querySelector('.btn.go'):null, mode='a';
  /* osobne auta: vzdy 4 polia. Kamiony a dodavky: 2 + doplnkove podla vozidla. */
  var BASEN={a:4, b:2}, BASE=4;
  var SAMPLE={a:['Audi','A6 Avant (C7)','2011 – 2018','Kombi'],
              b:['MAN (TIR)','TGX 2018-2020','Automatická','2 zásuvky']};
  /* kolko doplnkovych poli si dane vozidlo vyziada — na webe to urcuje katalog */
  var EXTRA={a:0, b:2};
  /* Poznamka pod konfiguratorom. Bola natvrdo po slovensky a prepisala aj spravne
     prelozeny text z ceskeho markupu — Michal to nasiel 2026-08-27 na .cz.
     Text pre kamiony hovori aj to, kam sa navstevnik po kliku dostane
     (main.js riadok 596: window.location.href = TRUCK_PRODUCT_URLS[...]). */
  var NOTE = location.hostname.indexOf('luxurycardesign.cz') !== -1
    ? {a:'Šablony máme pro více než 1000 modelů osobních aut.',
       b:'Tahače i dodávky — Scania, Volvo, DAF, MAN, Sprinter, Transit, Crafter a další. '
         +'Po zvolení modelu vás přeneseme na stránku s koberci pro kamiony.'}
    : {a:'Šablóny máme pre viac než 1000 modelov osobných áut.',
       b:'Ťahače aj dodávky — Scania, Volvo, DAF, MAN, Sprinter, Transit, Crafter a ďalšie. '
         +'Po zvolení modelu vás prenesieme na stránku s kobercami pre kamióny.'};

  /* Prepinac vozidiel (.lcd-vehicle-switch__tab) patri adoptovanemu konfiguratoru
     a s vnutornym 'mode' navrhu nie je prepojeny — poznamka preto ostavala v rezime
     osobnych aut aj po prepnuti na kamiony. Synchronizujeme ju podla toho, ktory
     obal je prave viditelny. */
  function lcdhSyncPoznamku() {
    var n = document.getElementById('konfNote');
    if (!n) return;
    var truck = document.querySelector('.lcdh-konf-slot .lcd-truck-wrap');
    var jeKamion = !!(truck && truck.getBoundingClientRect().width > 0);
    var t = jeKamion ? NOTE.b : NOTE.a;
    if (n.textContent !== t) n.textContent = t;
  }
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.lcd-vehicle-switch__tab')) {
      setTimeout(lcdhSyncPoznamku, 350);
      setTimeout(lcdhSyncPoznamku, 1200);
    }
  });
  [1500, 4000].forEach(function (ms) { setTimeout(lcdhSyncPoznamku, ms); });

  function clearErr(f){ f.classList.remove('err'); }
  function showErr(f){
    var msg=f.dataset[mode==='b'&&f.dataset.errB?'errB':'err']||'Toto pole je potrebné vyplniť.';
    var e=f.querySelector('.ferr'); if(e) e.textContent=msg;
    f.classList.remove('err'); void f.offsetWidth; f.classList.add('err');
  }
  function konfReset(){
    BASE=BASEN[mode];
    /* kamiony maju vlastny produkt — tlacidlo tam vedie priamo */
    if(goBtn){
      var h = mode==='b' ? goBtn.dataset.hrefB : goBtn.dataset.hrefA;
      if(h) goBtn.setAttribute('href', h);
    }
    FS.forEach(function(f,i){
      f.classList.remove('done','err','pop');
      f.classList.toggle('hide', i>=BASE);
      var fk=f.querySelector('.fake'); if(fk) fk.textContent=fk.dataset[mode]||fk.textContent;
      var lb=f.querySelector('label'); if(lb&&lb.dataset[mode]) lb.textContent=lb.dataset[mode];
    });
    if(konfNote) konfNote.textContent=NOTE[mode];
  }
  function revealExtras(){
    for(var i=BASE;i<FS.length;i++){
      var on = i < BASE+(EXTRA[mode]||0);
      if(on && FS[i].classList.contains('hide')){
        FS[i].classList.remove('hide'); FS[i].classList.add('pop');
      } else if(!on){ FS[i].classList.add('hide'); FS[i].classList.remove('done','err'); }
    }
  }
  FS.forEach(function(f,i){
    var fk=f.querySelector('.fake'); if(!fk) return;
    fk.addEventListener('click',function(){
      f.classList.add('done'); clearErr(f);
      fk.textContent=SAMPLE[mode][i]||fk.textContent;
      if(i===BASE-1) revealExtras();          /* pri kamionoch po vybere modelu pribudnu dalsie kroky */
    });
  });
  if(goBtn) goBtn.addEventListener('click',function(e){
    var miss=FS.filter(function(f){
      return !f.classList.contains('hide') && !f.classList.contains('done');
    });
    if(!miss.length) return;                  /* vsetko vyplnene — ide sa dalej */
    e.preventDefault();
    miss.forEach(showErr);
    var r=miss[0].getBoundingClientRect();
    if(r.top<70||r.bottom>innerHeight) miss[0].scrollIntoView({block:'center',behavior:'smooth'});
  });
  if(FS.length) konfReset();

  var tabs=document.getElementById('tabs');
  if(tabs) tabs.addEventListener('click',function(e){
    var b=e.target.closest('.tab'); if(!b) return;
    tabs.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('on',t===b)});
    var truck = b.dataset.i==='1';
    tabs.classList.toggle('two', truck);
    mode = truck ? 'b' : 'a';
    LCDH.querySelectorAll('#fields [data-a]').forEach(function(el){
      el.textContent = truck ? el.dataset.b : el.dataset.a;
    });
    konfReset();
  });
  var bg=document.getElementById('burg'), mega=document.getElementById('mega'),
      ovl=document.getElementById('megaOvl'), mx=document.getElementById('megaX');
  function megaSet(o){mega.classList.toggle('open',o);ovl.classList.toggle('open',o);
    bg.setAttribute('aria-expanded',o?'true':'false');document.body.style.overflow=o?'hidden':'';
    /* Lenis inak zoberie koliesko sebe a menu sa neposunie (len PC) */
    mega.setAttribute('data-lenis-prevent','');}
  if(bg) bg.addEventListener('click',function(){megaSet(!mega.classList.contains('open'))});
  if(ovl) ovl.addEventListener('click',function(){megaSet(false)});
  if(mx) mx.addEventListener('click',function(){megaSet(false)});
  mega.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){megaSet(false)})});
  LCDH.querySelectorAll('.hdr nav a').forEach(function(a){a.addEventListener('click',function(){LCDH.querySelector('.hdr').classList.remove('open')})});
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- FAQ zoznam ---
     Bol natvrdo po slovensky, takze cely FAQ sa na .cz zobrazoval po slovensky.
     Michal 2026-08-27: "prejdi cele faq a najdi ci tam nenajdes este nejake nezhody". */
  var Q_SK = [
    ["Ako si môžem objednať?","Vyberte model vozidla v konfigurátore, zvoľte prevedenie a farbu. Zvyšok vybavíme my."],
    ["Budú tieto koberce pasovať do môjho auta?","Áno. Šijú sa podľa hotových šablón pre konkrétny model, rok a typ karosérie — vďaka tomu sadnú presne do Vášho auta."],
    /* bolo "Videli ste..." — jedina otazka v hlase obchodu, zvysok je v hlase zakaznika */
    ["Videl som podobne vyzerajúce koberce online. Prečo práve Luxury Car Design?","Rozdiel je v materiáli, presnosti a uchytení — pozrite si sekciu Porovnanie vyššie."],
    /* bolo "šablónu vieme doskenovať" — o skenovani sa v zakaznickom texte nepise */
    ["Ponúkate koberčeky pre moje auto? Čo ak moje auto nie je v zozname?","Máme viac než 1000 modelov. Ak Váš model v zozname nevidíte, napíšte nám na info@luxurycardesign.sk — často je šablóna hotová, len ešte nie je na e-shope. A ak ju naozaj nemáme, auto sa dá naskenovať a podľa skenu šablónu vytvoriť."],
    ["Z čoho sú luxusné autokoberce vyrobené?","Zhora nadol: prémiová ekokoža na povrchu, vysokohustotná pena pre komfort, priedušná netkaná vrstva, izolačný XPE materiál a protišmyková vrstva na spodku. Celý prierez aj s popisom každej vrstvy nájdete vyššie v sekcii Materiál."],
    ["Ako sa koberce uchytávajú?","Na spodnej strane koberca sú našité suché zipsy. V balení nájdete obojstrannú lepiacu pásku so suchým zipsom a klipy na uchytenie pod plastové časti."],
    ["Ako sa luxusné koberce čistia?","Prvú vrstvu stačí vybrať a utrieť vlhkou handrou. Druhá vrstva znesie aj prúd vody — pokojne ju opláchnite a nechajte uschnúť."],
    ["Sú rohože do každého počasia?","Prvá vrstva je sezónna — na jar a leto. Znesie vlhkosť aj občasný dážď, voda sa do čalúnenia nedostane. Na celý rok, teda aj na sneh, blato a soľ, sú dvojvrstvové: druhú vrstvu jednoducho vyberiete, opláchnete a vrátite späť."],
    ["Koľko stojí poštovné?","Poštovné a podmienky dopravy nájdete v košíku pri dokončení objednávky."],
    ["Sú dostupné aj špeciálne prešívania alebo farby?","Áno. Na výber sú tri druhy prešívania: Diamond-Line s kosoštvorcami, Stripe-Line s vodorovnými pruhmi a Hexa-Line so šesťuholníkmi. Farbu materiálu aj nite si zvolíte v konfigurátore."],
    ["Čo robiť, ak koberce nesedia alebo ak je balík poškodený?","Napíšte nám na info@luxurycardesign.sk a vyriešime to. Vždy sa snažíme byť na strane zákazníka."],
    ["Aká je záruka na koberce?","Záruka je 2 roky pre súkromné osoby a 1 rok pri nákupe na firmu."]
  ];
  var Q_CZ = [
    ["Jak si mohu objednat?","Vyberte model vozidla v konfigurátoru, zvolte provedení a barvu. Zbytek vyřídíme my."],
    ["Budou tyto koberce pasovat do mého auta?","Ano. Šijí se podle hotových šablon pro konkrétní model, rok a typ karoserie — díky tomu sednou přesně do Vašeho auta."],
    ["Viděl jsem podobně vypadající koberce online. Proč právě Luxury Car Design?","Rozdíl je v materiálu, přesnosti a uchycení — podívejte se na sekci Porovnání výše."],
    ["Nabízíte koberečky pro moje auto? Co když moje auto není v seznamu?","Máme více než 1000 modelů. Pokud Váš model v seznamu nevidíte, napište nám na info@luxurycardesign.cz — často je šablona hotová, jen ještě není na e-shopu. A pokud ji opravdu nemáme, auto se dá naskenovat a podle skenu šablonu vytvořit."],
    ["Z čeho jsou luxusní autokoberce vyrobené?","Shora dolů: prémiová ekokůže na povrchu, vysokohustotní pěna pro komfort, prodyšná netkaná vrstva, izolační XPE materiál a protiskluzová vrstva na spodku. Celý průřez i s popisem každé vrstvy najdete výše v sekci Materiál."],
    ["Jak se koberce uchycují?","Na spodní straně koberce jsou našité suché zipy. V balení najdete oboustrannou lepicí pásku se suchým zipem a klipy na uchycení pod plastové části."],
    ["Jak se luxusní koberce čistí?","První vrstvu stačí vyjmout a otřít vlhkým hadrem. Druhá vrstva snese i proud vody — klidně ji opláchněte a nechte uschnout."],
    ["Jsou rohože do každého počasí?","První vrstva je sezónní — na jaro a léto. Snese vlhkost i občasný déšť, voda se do čalounění nedostane. Na celý rok, tedy i na sníh, bláto a sůl, jsou dvouvrstvé: druhou vrstvu jednoduše vyjmete, opláchnete a vrátíte zpět."],
    ["Kolik stojí poštovné?","Poštovné a podmínky dopravy najdete v košíku při dokončení objednávky."],
    ["Jsou dostupné i speciální prošívání nebo barvy?","Ano. Na výběr jsou tři druhy prošívání: Diamond-Line s kosočtverci, Stripe-Line s vodorovnými pruhy a Hexa-Line se šestiúhelníky. Barvu materiálu i nitě si zvolíte v konfigurátoru."],
    ["Co dělat, když koberce nesedí nebo je balík poškozený?","Napište nám na info@luxurycardesign.cz a vyřešíme to. Vždy se snažíme být na straně zákazníka."],
    ["Jaká je záruka na koberce?","Záruka je 2 roky pro soukromé osoby a 1 rok při nákupu na firmu."]
  ];
  var Q = location.hostname.indexOf('luxurycardesign.cz') !== -1 ? Q_CZ : Q_SK;
  var faq=document.getElementById('faq');
  Q.forEach(function(q,i){
    var d=document.createElement('details');
    d.innerHTML='<summary><span class="i">'+String(i+1).padStart(2,'0')+
      '</span><span class="t"></span><span class="p">+</span></summary><div class="a"></div>';
    d.querySelector('.t').textContent=q[0];
    d.querySelector('.a').textContent=q[1];
    faq.appendChild(d);
  });

  /* prefetch velkych fotiek nizsie na stranke - nech nenabiehaju na ocach */
  addEventListener('load',function lcdhPrefetch(){
    setTimeout(function(){ ['https://cdn.myshoptet.com/usr/shoptet.jankucera.work/user/documents/eshopy/luxuryCar/assets/img/lcd-home/truck.jpg'].forEach(function(u){ var im=new Image(); im.src=u; }); },1200);
    /* pred-dekodovanie kariet deckov: velke JPG dekodovane pri prvom vykresleni
       robili zaseknuty frame presne pocas reveal animacie */
    setTimeout(function(){
      if(!matchMedia('(hover:hover)').matches) return;
      [].forEach.call(LCDH.querySelectorAll('#lcd-home .deck img, #lcd-home .pc img, #lcd-home .mat img'),function(im){
        if(im.decode) im.decode().catch(function(){});
      });
    },1600);
  });

  /* trustbar: hover zobrazi fotku pri kurzore (len hover zariadenia) */
  (function(){
    if(!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var bunky=LCDH.querySelectorAll('.tstrip .ts[data-peek]');
    if(!bunky.length) return;
    var im=document.createElement('img');
    im.className='ts-peek'; im.alt=''; im.decoding='async';
    /* musi byt vnutri #lcd-home — styl .ts-peek je scopovany nan;
       v <body> ostavala fotka bez stylu visiet na konci stranky */
    LCDH.appendChild(im);
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

  /* --- reveal --- */
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target);} });
  },{rootMargin:'0px 0px -6% 0px',threshold:.08});
  LCDH.querySelectorAll('.rv,.pc,.cmpc').forEach(function(e){io.observe(e)});

  /* --- konfigurator karta --- */
  var kc=document.getElementById('konfCard');
  new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)kc.classList.add('on')})},
    {threshold:.25}).observe(kc);

  /* --- pocitadla --- */
  LCDH.querySelectorAll('[data-count]').forEach(function(el){
    var done=false;
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(!e.isIntersecting||done) return; done=true;
        var to=+el.dataset.count, suf=el.dataset.suffix||'', pre=el.dataset.prefix||'',
            dec=+(el.dataset.dec||0), t0=null;
        function fmt(x){ return dec ? x.toFixed(dec).replace('.', ',') : String(Math.round(x)) }
        if(RM){el.textContent=pre+fmt(to)+suf;return;}
        function tick(t){ t0=t0||t; var p=Math.min(1,(t-t0)/1100);
          el.textContent=pre+fmt(to*(1-Math.pow(1-p,3)))+suf; if(p<1) requestAnimationFrame(tick); }
        requestAnimationFrame(tick);
      });
    },{threshold:.6}).observe(el);
  });

  /* --- 01-05: jeden krok naraz, riadene scrollom --- */
  var stage2=document.getElementById('stage2');
  if(stage2){
    var s2imgs=[].slice.call(LCDH.querySelectorAll('.s2-media img')),
        s2texts=[].slice.call(LCDH.querySelectorAll('.s2-t')),
        s2btns=[].slice.call(LCDH.querySelectorAll('.s2-rail button')),
        s2big=document.getElementById('s2Big'), s2prog=document.getElementById('s2Prog'),
        s2cur=-1;
    /* filmovy pas piatich krokov — vyplna miesto pod textom a da sa nim preklikavat */
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
    stage2.style.height=(s2imgs.length*62)+'vh';
    function s2set(i){
      if(i===s2cur) return; s2cur=i;
      s2imgs.forEach(function(e,k){e.classList.toggle('on',k===i)});
      s2texts.forEach(function(e,k){e.classList.toggle('on',k===i)});
      s2btns.forEach(function(e,k){e.classList.toggle('on',k===i);e.classList.toggle('done',k<i)});
      s2thumbs.forEach(function(e,k){e.classList.toggle('on',k===i)});
      s2big.textContent=String(i+1).padStart(2,'0');
    }
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

    /* --- mobilna verzia: rovnaky obsah, ale ako swipe karusel v normalnom toku --- */
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
      s2imgs.forEach(function(_,i){
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
      function mupd(){
        var mid=track.scrollLeft+track.clientWidth/2, best=0, bd=1e9;
        [].forEach.call(track.children,function(c,i){
          var cc=c.offsetLeft-track.offsetLeft+c.offsetWidth/2, dd=Math.abs(cc-mid);
          if(dd<bd){ bd=dd; best=i; }
        });
        [].forEach.call(dots.children,function(b,i){ b.classList.toggle('on',i===best) });
      }
      track.addEventListener('scroll',function(){ clearTimeout(mt); mt=setTimeout(mupd,60) },{passive:true});
      mupd();
    }
  }

  /* --- scroll: hero parallax + exploded vrstvy --- */
  var heroBg=document.getElementById('heroBg'), truckBg=document.getElementById('truckBg'),
      stage=document.getElementById('stage'),
      legs=[].slice.call(LCDH.querySelectorAll('.leg'));
  var expCard=document.getElementById('exp'), mx=0, my=0,
      boxes=[].slice.call(LCDH.querySelectorAll('.mbox'));
  var TF=boxes.map(function(B){return parseFloat(B.dataset.t)||0.05});
  var lastOpen=0, RX=-7, RY=30, SC=1;
  if(expCard){
    expCard.parentNode.addEventListener('mousemove',function(e){
      var r=expCard.getBoundingClientRect();
      mx=((e.clientX-r.left)/r.width-.5)*2; my=((e.clientY-r.top)/r.height-.5)*2; tilt();
    });
    expCard.parentNode.addEventListener('mouseleave',function(){mx=0;my=0;tilt()});
  }
  function tilt(){
    if(!expCard) return;
    expCard.style.transform='scale('+SC.toFixed(3)+') rotateX('+(RX-my*4)+'deg) rotateY('+(RY+mx*7)+'deg)';
  }
  function explode(open){
    lastOpen=open;
    if(!expCard||!boxes.length) return;
    var n=boxes.length, W=expCard.clientWidth||600;
    /* rozlozene vrstvy zaberu do sirky asi 2,23x hrubku dosky —
       velkost preto pocitam tak, aby sa zostava vzdy zmestila do ramu */
    var pw=Math.min(W*0.42,460), ph=pw/1.55;
    var th=TF.map(function(f){return Math.max(3,f*pw)});
    var tot=th.reduce(function(x,y){return x+y},0);
    var gap=pw*0.58;
    var acc=0;
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
    var gs=LCDH.querySelector('.mgs');
    if(gs){ gs.style.width=(30+46*open)+'%'; gs.style.opacity=String(0.55+0.45*open); }
    expCard.classList.toggle('open', open>0.35);
    var pl=LCDH.querySelector('.pinlab'); if(pl) pl.style.opacity=String(1-Math.min(1,open*1.6));
  }
  tilt();
  /* mobil: sekcia je v normalnom toku — rozklad sa spusti sam, ked na nu doscrollujes */
  var MATMQ=matchMedia('(max-width:900px)'), matToggle=document.getElementById('matToggle'),
      matOpen=0, matIO=null, matT=null;
  var matProg=document.getElementById('matProg');
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
        /* 500 ms pauza, nech to nevyskoci hned pri prelete cez sekciu */
        if(en.isIntersecting) matT=setTimeout(function(){ setMat(1) },500);
        else setMat(0);
      });
    },{threshold:0.45});
    matIO.observe(expCard);
  }
  matAuto();
  MATMQ.addEventListener('change',function(){
    if(MATMQ.matches) lcdhStOff(); else lcdhStOn();
    matOpen=0; explode(0);
    if(matToggle){ matToggle.classList.remove('on'); matToggle.textContent='Rozložiť materiál'; }
    matAuto();
  });
  addEventListener('resize',function(){explode(lastOpen)});
  explode(0);
  /* GSAP pilot: scrub vyhladeny progres scrollu -> existujuca spojita explode(o) */
  function lcdhStOn(){
    if(window.__lcdhST||MATMQ.matches||!stage||!expCard) return;
    if(typeof ScrollTrigger==='undefined') return;
    window.__lcdhST=ScrollTrigger.create({
      trigger:stage, start:'top top', end:'bottom bottom', scrub:0.6,
      onUpdate:function(self){
        var p=self.progress;
        var o=p<.22?p/.22:(p<.86?1:Math.max(0,1-(p-.86)/.14));
        o=o<0?0:o>1?1:o; o=o*o*(3-2*o);
        explode(o);
        if(matProg) matProg.style.width=Math.round(o*100)+'%';
      }
    });
  }
  function lcdhStOff(){ if(window.__lcdhST){ window.__lcdhST.kill(); window.__lcdhST=null; } }
  lcdhStOn();
  var ticking=false;
  function frame(){
    ticking=false;
    var vh=innerHeight;
    if(heroBg&&innerWidth>760){ var hr=heroBg.parentNode.getBoundingClientRect();
      /* hero sa pri scrolle nehybe (Michal 2026-08-26) */ }
    if(truckBg){ var tr=truckBg.parentNode.getBoundingClientRect();
      if(tr.bottom>0&&tr.top<vh) truckBg.style.transform='translate3d(0,'+((vh/2-(tr.top+tr.height/2))*0.09)+'px,0)'; }
    if(stage&&expCard&&!MATMQ.matches&&!window.__lcdhST){
      var r=stage.getBoundingClientRect();
      var p=Math.min(1,Math.max(0,(-r.top)/(r.height-vh)));
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
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
