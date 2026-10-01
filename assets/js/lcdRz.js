import { LCDRZ_MARKUP, LCDRZ_MARKUP_CZ } from "./lcdRz-markup.js";
/* lcdRz.js - GENEROVANE extract-lcd-rz.py, RUCNE NEEDITUJ.
   Zdroj: rz-tpl.html
   Obal riesi to, ze povodne <script> bloky v navrhu bezali az ZA markupom.
   V bundli luxuryCar.js sa spusta skor, preto DOMContentLoaded + guard.
   Guard flag je vlastny (__LCD_RZ_INIT__), NIE zdielany s titulkou. */
(function () {
  if (window.__LCD_RZ_INIT__) return;
  window.__LCD_RZ_INIT__ = true;

  /* Zivy konfigurator (.model-selector z cars.js) sa ADOPTUJE do karty navrhu -
     logika sa nemeni, meni sa len to, kde uzol v DOM visi (kniha A.5).
     Polling je nutny: boot bezi na DOMContentLoaded, teda SKOR nez initModelSelect()
     v jQuery ready. Jednorazovy pokus by nasiel null a konfigurator by ostal
     navzdy pod skrytym gateom - bez chybovej hlasky. */
  function lcdrzAdoptujSelector(root) {
    var pokusy = 0;
    var t = setInterval(function () {
      pokusy++;
      /* prva vetva cieli konfigurator v skrytom starom strome (main.js:182/187),
         druha je fallback, keby Jan kotvu zmenil. Obe scopnute na body.lcdrz-on. */
      var ms = document.querySelector("body.lcdrz-on #content-wrapper .model-selector")
            || document.querySelector("body.lcdrz-on .model-selector");
      if (!ms) { if (pokusy > 40) clearInterval(t); return; }
      clearInterval(t);
      if (root.contains(ms)) return;   /* uz adoptovany - nic nerob */
      var karta = root.querySelector("#konfCard");
      if (!karta) return;
      var stareMiesto = ms.closest("section") && !root.contains(ms.closest("section"))
                        ? ms.closest("section") : ms.parentElement;
      /* .tabs a #fields v navrhu su atrapy - zivy selector prinasa skutocne polia */
      [".tabs", "#fields"].forEach(function (s) {
        var e = karta.querySelector(s);
        if (e) e.style.display = "none";
      });
      var slot = document.createElement("div");
      slot.className = "lcdrz-konf-slot";
      karta.appendChild(slot);
      slot.appendChild(ms);
      var pozn = karta.querySelector(".konf-note");
      if (pozn) karta.appendChild(pozn);   /* poznamka patri POD tlacidlo (navrh) */
      if (stareMiesto && stareMiesto !== ms) stareMiesto.style.display = "none";
    }, 250);
  }

  /* ---- Michal 2026-08-27 ----
     1) Segmenty v hlavicke (znacka/model/rok/typ) sa daju klikat a menit PRIAMO tam.
        Nedotykame sa cars.js: len nastavime hodnotu jeho selectu a posleme 'change',
        aby si dopocital nasledujuce zoznamy tak, ako keby to klikol clovek.
     2) Po kliknuti na "Zvolit model" sa hlavicka obnovi (predtym ostavala stara).
     3) Cela karta vyberu je klikatelna, nielen tlacidlo. */
  var LCDRZ_SEL = [".surcharge-list.brands.dm-selector select",
                   ".surcharge-list.models.dm-selector select",
                   ".surcharge-list.years.dm-selector select",
                   ".surcharge-list.type-selector select"];

  function lcdrzRealne(root) {
    return LCDRZ_SEL.map(function (s) { return root.querySelector(s) || document.querySelector(s); });
  }

  function lcdrzPrepisPlate(root) {
    var sel = lcdrzRealne(root);
    var pol = root.querySelectorAll(".plate .v i");
    for (var i = 0; i < pol.length && i < 4; i++) {
      if (pol[i].querySelector("select")) continue;      /* prave sa edituje */
      var s = sel[i];
      /* aj ked je vybrany placeholder (index 0) - navstevnik ma vidiet, co mu chyba */
      if (s && s.selectedIndex >= 0 && s.options[s.selectedIndex])
        pol[i].textContent = s.options[s.selectedIndex].text;
    }
  }

  /* Popisky prepinaca karty vyberu. Boli natvrdo po slovensky, takze na .cz
     sa po prvom prepnuti zmenili na slovenske. */
  function lcdrzPopis(kluc) {
    var cz = location.hostname.indexOf("luxurycardesign.cz") !== -1;
    if (kluc === "zmenit") return cz ? "Změnit" : "Zmeniť";
    return cz ? "Skrýt" : "Skryť";
  }

  /* Zavrie kartu "Iné vozidlo?" a vrati prepinac do stavu "Zmenit". */
  function lcdrzZavriKonf(root) {
    var kf = (root && root.querySelector("#konf")) || document.getElementById("konf");
    var ch = document.getElementById("rzChange");
    if (kf && !kf.hasAttribute("hidden")) kf.setAttribute("hidden", "");
    if (ch) ch.textContent = lcdrzPopis("zmenit");
  }

  function lcdrzUloz(root) {
    var btn = root.querySelector(".btn.choice-Model") || document.querySelector(".btn.choice-Model");
    if (btn) btn.click();
    setTimeout(function () { lcdrzHlavicka(root); lcdrzPrepisPlate(root); }, 500);
  }

  function lcdrzInline(root) {
    var v = root.querySelector(".plate .v");
    if (!v) return;
    var pol = v.querySelectorAll("i");
    [].forEach.call(pol, function (el, idx) {
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.addEventListener("click", function () { lcdrzOtvor(root, el, idx); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); lcdrzOtvor(root, el, idx); }
      });
    });
    /* akykolvek klik na povodne tlacidlo konfiguratora tiez obnovi hlavicku
       a zavrie kartu vyberu — Michal 2026-08-27: "ked zmenim model auta a dam
       zvolit tak chcem aby ten modul s vyberom zmyzol a ostalo len to co je hore" */
    var btn = root.querySelector(".btn.choice-Model") || document.querySelector(".btn.choice-Model");
    if (btn) btn.addEventListener("click", function () {
      lcdrzZavriKonf(root);
      setTimeout(function () { lcdrzHlavicka(root); lcdrzPrepisPlate(root); lcdrzZavriKonf(root); }, 500);
    });
  }

  function lcdrzOtvor(root, el, idx) {
    if (el.querySelector("select")) return;
    var realny = lcdrzRealne(root)[idx];
    if (!realny || realny.options.length < 2) return;     /* zoznam este nie je naplneny */
    var povodny = el.textContent;
    var s = document.createElement("select");
    s.className = "rz-inline";
    for (var i = 0; i < realny.options.length; i++) {
      var o = document.createElement("option");
      o.value = realny.options[i].value;
      o.textContent = realny.options[i].text;
      s.appendChild(o);
    }
    s.selectedIndex = realny.selectedIndex;
    el.textContent = "";
    el.classList.add("rz-akt");
    el.appendChild(s);
    s.focus();
    if (s.showPicker) { try { s.showPicker(); } catch (e) {} }

    function zavri(text) {
      el.classList.remove("rz-akt");
      el.textContent = text;
    }
    s.addEventListener("change", function () {
      realny.value = s.value;
      realny.dispatchEvent(new Event("change", { bubbles: true }));
      zavri(s.options[s.selectedIndex].text);
      /* cars.js dopocita nasledujuce zoznamy - pockame a az potom ulozime */
      setTimeout(function () {
        lcdrzPrepisPlate(root);
        var sel = lcdrzRealne(root);
        var kompletne = sel.every(function (x) { return x && x.selectedIndex > 0; });
        if (kompletne) lcdrzUloz(root);
      }, 700);
    });
    s.addEventListener("blur", function () {
      setTimeout(function () { if (el.contains(s)) zavri(povodny); }, 150);
    });
  }

  function lcdrzKlikatelnaKarta(root) {
    [].forEach.call(root.querySelectorAll(".opt"), function (karta) {
      var hlavny = karta.querySelector(".go a.btn, .go a");
      if (!hlavny) return;
      karta.addEventListener("click", function (e) {
        if (e.target.closest("a, button, select, input")) return;  /* vlastne odkazy nechame */
        hlavny.click();
      });
    });
  }

  /* Hlavicka navrhu sa plni zo sessionStorage, ktory zapisuje saveModel() (main.js:614).
     Kniha A.6, alternativa 1: ak chyba co i len jeden zo styroch klucov, degradujeme
     na genericky tvar. NIKDY sa nevypisuje null a NIKDY sa neredirectuje - stranka je
     indexovana a sessionStorage je per-karta.
     Citanie je v try/catch, privatny rezim vie na sessionStorage hodit vynimku. */
  function lcdrzHlavicka(root) {
    var v = null;
    try {
      var ss = window.sessionStorage;
      v = { znacka: ss.getItem("Brand"), model: ss.getItem("Model"),
            rok: ss.getItem("Year"), typ: ss.getItem("carType") };
    } catch (e) { v = null; }

    var h1    = root.querySelector("h1");
    var plate = root.querySelector(".plate");
    var kroky = root.querySelector(".rzsteps");
    var orn   = root.querySelector(".orn span");

    if (v && v.znacka && v.model && v.rok && v.typ) {
      var em = h1 ? h1.querySelector("em") : null;
      if (em) em.textContent = v.znacka + " " + v.model;
      var pol = plate ? plate.querySelectorAll(".v i") : [];
      var hod = [v.znacka, v.model, v.rok, v.typ];
      for (var i = 0; i < pol.length && i < 4; i++) pol[i].textContent = hod[i];
      return;
    }

    /* vozidlo nepozname - genericka hlavicka, stitok prec, krokovnik 1 z 2,
       konfigurator otvoreny, aby mal navstevnik kde vozidlo zadat */
    if (h1) h1.textContent = "Vyberte si koberce pre svoje vozidlo";
    if (plate) plate.style.display = "none";
    if (orn) orn.textContent = "Krok 1 z 2";
    if (kroky) kroky.innerHTML =
      '<div class="on"><b>1</b>Typ kobercov</div><s></s><div><b>2</b>Farba a pre\u0161\u00edvanie</div>';
    var kf = root.querySelector("#konf");
    if (kf) kf.removeAttribute("hidden");
  }
  function boot() {
    /* stranka bez rozcestnika -> nic sa nedeje */
    /* ---- BRANA (kniha A.2) ---- */
    /* len SK web - ceska faza ma vlastne preklady a ide zvlast */
    var lcdrzCZ = location.hostname.indexOf("luxurycardesign.cz") !== -1;
    if (location.hostname.indexOf("luxurycardesign.sk") === -1 && !lcdrzCZ) return;
    /* len /rozcestnik/ (Shoptet: body.in-rozcestnik) a len ako STRANKA, nie kategoria/produkt */
    if (!document.body) return;
    if (!document.body.classList.contains("in-rozcestnik")) return;
    if (!document.body.classList.contains("type-page")) return;
    /* HP a rozcestnik sa nikdy nesmu spustit na tej istej stranke */
    if (document.body.classList.contains("in-index")) return;
    if (document.getElementById("lcd-home")) return;
    if (document.getElementById("lcd-rz")) return;

    /* ---- KAM SA MARKUP VLOZI (kniha A.3) ----
       :scope > vynuti PRIAME dieta hosta, inak by insertBefore hodil NotFoundError.
       rzKotva === null -> insertBefore sa sprava ako appendChild (navrh ide na koniec). */
    var rzHost  = document.querySelector(".overall-wrapper") || document.body;
    var rzKotva = rzHost.querySelector(":scope > #content-wrapper, :scope > .content-wrapper.container")
                  || rzHost.querySelector(":scope > #footer")
                  || null;
    var rzWrap = document.createElement("div");
    rzWrap.innerHTML = lcdrzCZ ? LCDRZ_MARKUP_CZ : LCDRZ_MARKUP;
    var rzRoot = rzWrap.firstElementChild;
    if (!rzRoot) return;
    rzHost.insertBefore(rzRoot, rzKotva);

    /* ---- GATE (kniha A.4) ----
       Stary obsah stranky sa LEN SKRYVA, NIKDY nemaze: <h1>Rozcestnik</h1>,
       section#Model-selecte a section#sets su kotvy pre main.js:140 a main.js:153
       a obsah admin pola nie je vo verziovanom repe.
       Vlastne id gate stylu aj vlastna body trieda - HP menny priestor sa nedotyka. */
    var rzSt = document.createElement("style");
    rzSt.id = "lcdrz-gate";
    rzSt.textContent =
      "body.lcdrz-on #content-wrapper," +
      "body.lcdrz-on .content-wrapper.container," +
      "body.lcdrz-on #header," +
      "body.lcdrz-on .top-navigation-bar," +
      "body.lcdrz-on .lcd-reviews-widget{display:none !important}" +
      /* poucenie E.12: tema dava #footer horny margin, po skryti obsahu by ostal biely pas */
      "body.lcdrz-on #footer{margin-top:0 !important}" +
      "#lcd-rz .lcdrz-konf-slot{margin-top:16px;text-align:left}" +
      "#lcd-rz .lcdrz-konf-slot .model-selector{margin:0;max-width:none;width:100%}";
    document.head.appendChild(rzSt);
    document.body.classList.add("lcdrz-on");

    /* hlavicka podla zvoleneho vozidla + adopcia ziveho konfiguratora */
    lcdrzHlavicka(rzRoot);
    lcdrzAdoptujSelector(rzRoot);
    lcdrzKlikatelnaKarta(rzRoot);
    setTimeout(function () { lcdrzInline(rzRoot); }, 1200);

    /* vychodiskove zobrazenie (Michal 2026-08-27): stranka sa otvori na neviditelnej
       ciare NAD bunkami vyberu - ako prve vidno fotky a celu bunku. Len pri cerstvom
       otvoreni hore (scrollY < 60), nech sa nebije s navratom spat v prehliadaci. */
    if (window.scrollY < 60) {
      var rzUser = false;
      ["wheel", "touchstart", "keydown"].forEach(function (t) {
        addEventListener(t, function () { rzUser = true; }, { passive: true, once: true });
      });
      var rzNastav = function () {
        var pick = rzRoot.querySelector("#vyber, .pick");
        if (!pick) return;
        var hdrEl = rzRoot.querySelector(".hdr");
        var hdrV = hdrEl ? hdrEl.getBoundingClientRect().height : 0;
        var y = pick.getBoundingClientRect().top + window.scrollY - hdrV - 14;
        if (y > 40) window.scrollTo(0, y);
      };
      requestAnimationFrame(rzNastav);
      /* adopcia konfiguratora (poll ~250ms) posunie bunky - po ustaleni doladit */
      setTimeout(function () { if (!rzUser) rzNastav(); }, 900);
    }
    var LCDRZ = document.getElementById("lcd-rz");
    /* smooth scroll na vnutrostrankove kotvy (nahrada za html{scroll-behavior}) */
    function lcdrzSmoothAnchor(e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) return;
      var t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    LCDRZ.addEventListener("click", lcdrzSmoothAnchor);

/* Telefon: stranku posadime na vyber kobercov EST PRED prvym vykreslenim.
   Preto tu nie je ziadna animacia ani skok — prehliadac to rovno nakresli spravne. */
(function(){
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
  if(!matchMedia('(max-width:900px)').matches) return;
  var w=LCDRZ.querySelector('.duowrap');
  if(!w) return;
  function usad(){
    var r=w.getBoundingClientRect(),
        max=document.documentElement.scrollHeight-innerHeight,
        ciel=Math.max(0, Math.min(Math.round(scrollY+r.bottom-innerHeight+12), max));
    /* natvrdo — html ma scroll-behavior:smooth a animovany posun by trhal */
    if(Math.abs(ciel-scrollY)>1){
      try{ scrollTo({top:ciel,left:0,behavior:'instant'}) }
      catch(e){ var b=document.documentElement.style.scrollBehavior;
                document.documentElement.style.scrollBehavior='auto';
                scrollTo(0,ciel);
                document.documentElement.style.scrollBehavior=b; }
    }
  }
  usad();
  /* jedina oprava, ak by sa rozlozenie po nacitani este zmenilo — a len ked
     zakaznik zatial nic nespravil */
  var volny=true;
  ['touchstart','wheel','keydown','pointerdown'].forEach(function(ev){
    addEventListener(ev,function(){ volny=false },{passive:true,once:true});
  });
  addEventListener('load',function(){ if(volny) usad() });
  /* ked prehliadac dodatocne zmeni vysku okna (lista s adresou, nahladove okno),
     usadime este raz — ale len kym sa zakaznik niceho nedotkol */
  addEventListener('resize',function(){ if(volny) usad() });
})();


(function(){
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var bg=document.getElementById('burg'), mega=document.getElementById('mega'),
      ovl=document.getElementById('megaOvl'), mx=document.getElementById('megaX');
  function megaSet(o){ if(!mega) return;
    mega.classList.toggle('open',o); ovl.classList.toggle('open',o);
    bg.setAttribute('aria-expanded', o?'true':'false');
    document.body.style.overflow = o && innerWidth<=760 ? 'hidden' : '';
    /* Lenis inak zoberie koliesko sebe a menu sa neposunie (len PC) */
    mega.setAttribute('data-lenis-prevent',''); }
  if(bg) bg.addEventListener('click',function(){ megaSet(!mega.classList.contains('open')) });
  if(ovl) ovl.addEventListener('click',function(){ megaSet(false) });
  if(mx) mx.addEventListener('click',function(){ megaSet(false) });
  addEventListener('keydown',function(e){ if(e.key==='Escape') megaSet(false) });

  if('IntersectionObserver' in window && !RM){
    var io=new IntersectionObserver(function(en){
      en.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target) } });
    },{threshold:0.12,rootMargin:'0px 0px -5% 0px'});
    [].forEach.call(LCDRZ.querySelectorAll('.rv'),function(el){ io.observe(el) });
  } else {
    [].forEach.call(LCDRZ.querySelectorAll('.rv'),function(el){ el.classList.add('on') });
  }

  /* konfigurator */
  var fieldsEl=document.getElementById('fields'), konfNote=document.getElementById('konfNote');
  var FS=fieldsEl?[].slice.call(fieldsEl.querySelectorAll('.field:not(.go)')):[],
      goBtn=fieldsEl?fieldsEl.querySelector('.btn.go'):null, mode='a';
  var BASEN={a:4, b:2}, BASE=4;
  var SAMPLE={a:['Audi','A6 Avant (C7)','2011 – 2018','Kombi'],
              b:['MAN (TIR)','TGX 2018-2020','Automatická','2 zásuvky']};
  var EXTRA={a:0, b:2};
  var NOTE={a:'Šablóny máme pre viac než 1000 modelov osobných áut.',
            b:'Ťahače aj dodávky — počet krokov závisí od vozidla.'};
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
      if(on && FS[i].classList.contains('hide')){ FS[i].classList.remove('hide'); FS[i].classList.add('pop'); }
      else if(!on){ FS[i].classList.add('hide'); FS[i].classList.remove('done','err'); }
    }
  }
  FS.forEach(function(f,i){
    var fk=f.querySelector('.fake'); if(!fk) return;
    fk.addEventListener('click',function(){
      f.classList.add('done'); f.classList.remove('err');
      fk.textContent=SAMPLE[mode][i]||fk.textContent;
      if(i===BASE-1) revealExtras();
    });
  });
  if(goBtn) goBtn.addEventListener('click',function(e){
    var miss=FS.filter(function(f){ return !f.classList.contains('hide') && !f.classList.contains('done') });
    if(!miss.length) return;
    e.preventDefault(); miss.forEach(showErr);
    miss[0].scrollIntoView({block:'center',behavior:'smooth'});
  });
  if(FS.length) konfReset();

  var tabs=document.getElementById('tabs');
  if(tabs) tabs.addEventListener('click',function(e){
    var b=e.target.closest('.tab'); if(!b) return;
    tabs.querySelectorAll('.tab').forEach(function(t){t.classList.toggle('on',t===b)});
    var truck = b.dataset.i==='1';
    tabs.classList.toggle('two', truck);
    mode = truck ? 'b' : 'a';
    LCDRZ.querySelectorAll('#fields [data-a]').forEach(function(el){
      el.textContent = truck ? el.dataset.b : el.dataset.a;
    });
    konfReset();
  });

  /* Telefon: dve karty vedla seba. Po chvili sa pas jemne pohne,
     aby bolo vidno, ze sa da prepnut prstom. */
  (function(){
    var duo=LCDRZ.querySelector('.duo'), dots=document.getElementById('duoDots');
    if(!duo||!dots) return;
    var karty=[].slice.call(duo.children), bodky=[].slice.call(dots.children);
    function mobil(){ return matchMedia('(max-width:900px)').matches }
    /* prehliadac si pri navrate na stranku pamata, kde bol pas — chceme vzdy prvu kartu */
    var zaciatok=Date.now();
    function naZaciatok(){ if(mobil()&&duo.scrollLeft) duo.scrollLeft=0 }
    naZaciatok();
    requestAnimationFrame(naZaciatok);
    addEventListener('load',naZaciatok);
    function aktualna(){
      var r=duo.getBoundingClientRect(), c=r.left+r.width/2, best=0, bd=1e9;
      karty.forEach(function(el,i){
        var b=el.getBoundingClientRect(), d=Math.abs(b.left+b.width/2-c);
        if(d<bd){ bd=d; best=i }
      });
      return best;
    }
    function sync(){
      var i=aktualna();
      bodky.forEach(function(b,k){ b.classList.toggle('on',k===i) });
    }
    /* pri programovom posune treba prichytavanie na chvilu vypnut,
       inak prehliadac posun okamzite vrati na najblizsi bod */
    function posun(x,potom){
      duo.style.scrollSnapType='none';
      duo.scrollTo({left:x,behavior:'smooth'});
      setTimeout(function(){
        duo.style.scrollSnapType='';
        if(potom) potom();
      },520);
    }
    var t=null, vlastny=false, hral=false;
    duo.addEventListener('scroll',function(){
      /* posun, ktory nerobime my, znamena ze zakaznik uz karty ovlada
         (prvych par stovak milisekund ignorujeme — vtedy este dobieha nacitanie) */
      if(!vlastny&&duo.scrollLeft>30&&Date.now()-zaciatok>800){ zavriNapovedu(); prestan() }
      clearTimeout(t); t=setTimeout(sync,80);
    },{passive:true});
    bodky.forEach(function(b,i){
      b.addEventListener('click',function(){
        var r=duo.getBoundingClientRect(), k=karty[i].getBoundingClientRect(),
            pad=parseFloat(getComputedStyle(duo).paddingLeft)||0;
        posun(duo.scrollLeft+(k.left-r.left)-pad);
      });
    });
    /* Napoveda: pas sa sam jemne pohne doprava a vrati sa.
       Opakuje sa kazde 4 sekundy, kym zakaznik s kartami nepohne sam. */
    var pohol=false, tikanie=null, zavrete=false,
        coach=document.getElementById('duoCoach'),
        pokoj=matchMedia('(prefers-reduced-motion: reduce)');
    function pohniPasom(){
      if(pohol||hral||!mobil()||duo.scrollLeft>4||pokoj.matches) return;
      hral=true; vlastny=true;
      duo.style.scrollSnapType='none';
      var zac=null, trvanie=1500, kam=72;
      function krok(ts){
        if(zac===null) zac=ts;
        var t=Math.min(1,(ts-zac)/trvanie);
        /* tam a spat jednym plynulym oblukom */
        duo.scrollLeft=kam*Math.sin(Math.PI*t);
        if(t<1){ requestAnimationFrame(krok); return }
        duo.scrollLeft=0;
        duo.style.scrollSnapType='';
        setTimeout(function(){ vlastny=false; hral=false },260);
      }
      requestAnimationFrame(krok);
    }
    function spusti(){
      if(pohol||tikanie) return;
      setTimeout(pohniPasom,500);
      tikanie=setInterval(pohniPasom,4000);
    }
    /* napoveda cez cele karty — kym ju zakaznik nezavrie, pas sa nehybe */
    function zavriNapovedu(){
      if(zavrete) return;
      zavrete=true;
      clearTimeout(odpocet);
      if(coach){ coach.classList.add('pryc'); coach.classList.remove('on');
                 setTimeout(function(){ coach.style.display='none' },560); }
      spusti();
    }
    /* napoveda zmizne az ked zakaznik naozaj potiahne — samotne tuknutie ju nezavrie,
       aby ju nezmazal skor, nez si ju stihne precitat */
    var xod=null, yod=null;
    duo.addEventListener('touchstart',function(e){
      var t=e.touches&&e.touches[0];
      xod=t?t.clientX:null; yod=t?t.clientY:null;
    },{passive:true});
    duo.addEventListener('touchmove',function(e){
      var t=e.touches&&e.touches[0];
      if(xod===null||!t) return;
      var dx=Math.abs(t.clientX-xod), dy=Math.abs(t.clientY-yod);
      /* len jasny pohyb do strany — pri rolovani stranky prst vzdy trochu ujde
         do boku a napoveda by zmizla skor, nez si ju stihne niekto precitat */
      if(dx>40&&dx>dy*1.5){ zavriNapovedu(); prestan() }
    },{passive:true});
    duo.addEventListener('touchend',function(){ xod=null; yod=null },{passive:true});
    duo.addEventListener('wheel',function(e){
      if(Math.abs(e.deltaX)>30&&Math.abs(e.deltaX)>Math.abs(e.deltaY)){ zavriNapovedu(); prestan() }
    },{passive:true});
    function zastav(){ if(tikanie){ clearInterval(tikanie); tikanie=null } }
    function prestan(){ pohol=true; zastav() }
    duo.addEventListener('keydown',prestan,{passive:true});
    var samozavret=null;
    /* Napoveda sa ukaze, ked je z kariet vidno dost na to, aby sa dala precitat.
       Ratame v pixeloch — percenta na nizkom displeji nikdy nevyjdu. */
    function dostVidno(){
      var r=duo.getBoundingClientRect(),
          vid=Math.min(r.bottom,innerHeight)-Math.max(r.top,0);
      return vid >= Math.min(300, r.height*0.5);
    }
    var panel=coach?coach.querySelector('.dc-panel'):null;
    var obal=duo.closest('.duowrap'), hero=LCDRZ.querySelector('section.rz');
    function polohaPanela(){
      if(!panel) return;
      /* stlmenie natiahneme od cierneho banera az na uplny koniec stranky,
         aby dole nezostal svetly pruh */
      if(coach&&obal){
        var o=obal.getBoundingClientRect(),
            ban=LCDRZ.querySelector('section.rz'),
            hl=LCDRZ.querySelector('.hdr'),
            vrch=Math.max(ban?ban.getBoundingClientRect().bottom:0,
                          hl?hl.getBoundingClientRect().bottom:0);
        coach.style.top=Math.round(vrch-o.top)+'px';
        var podObalom=document.documentElement.scrollHeight-(scrollY+o.bottom);
        coach.style.bottom=Math.round(-podObalom)+'px';
      }
      var r=duo.getBoundingClientRect(),
          hore=Math.max(r.top,0), dole=Math.min(r.bottom,innerHeight);
      if(dole<=hore) return;
      panel.style.top=Math.round((hore+dole)/2-r.top)+'px';
    }
    var odpocet=null;
    function prehodnot(){
      if(zavrete||!coach||!mobil()) return;
      if(dostVidno()){
        polohaPanela();
        if(!coach.classList.contains('on')){
          coach.classList.add('on');
          /* pat sekund staci na precitanie, potom nechame karty na pokoji */
          clearTimeout(odpocet);
          odpocet=setTimeout(zavriNapovedu,5000);
        }
        spusti();
      } else {
        coach.classList.remove('on');
        clearTimeout(odpocet); odpocet=null;
        zastav();
      }
    }
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(){ prehodnot() },
        {threshold:[0,.1,.25,.5,.75,1]}).observe(duo);
    }
    var lcdrzRafPending=false;
    function lcdrzRafPrehodnot(){ if(lcdrzRafPending) return; lcdrzRafPending=true;
      requestAnimationFrame(function(){ lcdrzRafPending=false; prehodnot(); }); }
    addEventListener('scroll',lcdrzRafPrehodnot,{passive:true});
    addEventListener('resize',prehodnot);
    setTimeout(prehodnot,300);
    if(!coach||!mobil()){ zavrete=true; spusti() }
    sync();
  })();

  var ch=document.getElementById('rzChange'), kf=document.getElementById('konf');
  if(ch&&kf) ch.addEventListener('click',function(){
    var open = !kf.hasAttribute('hidden');
    if(open){ kf.setAttribute('hidden',''); ch.textContent=lcdrzPopis('zmenit'); }
    else { kf.removeAttribute('hidden'); ch.textContent=lcdrzPopis('skryt');
           kf.scrollIntoView({block:'start',behavior:'smooth'}); }
  });
})();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
