/* ============================================================================
   LCD Videos Widget  —  YouTube carousel pre Shoptet
   ----------------------------------------------------------------------------
   Vertikálny carousel YouTube videí. Vlož tento <script> RAZ globálne
   (zápätie šablóny Shoptetu) a kdekoľvek chceš widget, vlož prázdny div:

       <div class="lcd-videos-widget"></div>

   Data-atribúty (všetky voliteľné):
     data-title      veľký nadpis
     data-subtitle   podnadpis
     data-text       odstavec pod nadpisom
     data-limit      max. počet videí v carouseli   (default 24)
     data-playlist   ID YouTube playlistu           (default nižšie)
     data-api-key    YouTube Data API kľúč          (default nižšie)

   Videá sa načítavajú naživo z YouTube Data API. Keď API nie je dostupné
   (napr. lokálny test), widget použije záložný zoznam (FALLBACK nižšie).
   Videá sa prehrávajú priamo z YouTube (embed) — nič sa nesťahuje.
   ============================================================================ */
(function () {
  'use strict';

  if (window.__lcdVideosLoaded) return;
  window.__lcdVideosLoaded = true;

  /* ----------------------------------------------------------- konfig ----- */
  var CONFIG = {
    apiKey: 'AIzaSyC1oohVIKqPPcxL3rZKZ_ZPKLoWS9CbRgQ',
    playlistId: 'PL5uNhg-LR1do0MIzDRJGM4d-2Kj1uLwxU',
    maxFetch: 500,                       /* koľko položiek max ťahať z API */
    cacheHours: 1                        /* ako dlho držať dáta v cache (auto-refresh playlistu — Michal pridáva videá denne) */
  };

  /* Lokalizácia nadpisu/podnadpisu podľa domény (.cz -> čeština).
     Popisky jednotlivých videí ostávajú v slovenčine zámerne. */
  var I18N = {
    sk: {
      title: 'Realita luxusných autokobercov',
      subtitle: 'Pozrite sa, ako naše autokoberce vyzerajú a fungujú v praxi'
    },
    cz: {
      title: 'Realita luxusních autokoberců',
      subtitle: 'Podívejte se, jak naše autokoberce vypadají a fungují v praxi'
    }
  };
  function lcdvLang() {
    return /\.cz$/i.test(location.hostname) ? 'cz' : 'sk';
  }

  var DEFAULTS = {
    title: I18N[lcdvLang()].title,
    subtitle: I18N[lcdvLang()].subtitle,
    text: '',
    limit: 300
  };

  /* Záložný zoznam — použije sa, len keď YouTube API nie je dostupné
     (napr. otvorenie dema lokálne cez file://). Na webe ide všetko cez API. */
  var FALLBACK = [
    { id: 'NEfum87glYY', title: 'Toto nie je reklama. Toto je realita.' },
    { id: 'nH958ntlTF0', title: 'Špina v aute? Toto ju vyrieši navždy!' },
    { id: 'bZuCP3c99Go', title: 'Prečo je škoda, že o nás ešte nevie každý?' },
    { id: 'J370aJJKHok', title: 'Prečo sú naše autokoberce TOP do dažďa a snehu?' },
    { id: 'IrbggbBwelE', title: 'TOTO ste o autokoberčekoch netušili!' },
    { id: '4HsygrdIWCw', title: 'Helenke sa niečo STALO s krémovými autokobercami' },
    { id: 'XwXNqlTaoHU', title: 'Včera nám umelá inteligencia vymyslela kabelku' },
    { id: 'KKGTh5oHjd4', title: 'V Luxury Car Design sme pre vás vytvorili niečo nové' },
    { id: '1gM3C3m59R4', title: 'Neviete sa rozhodnúť, aký materiál a lem?' }
  ];

  /* ------------------------------------------------------------- CSS ------ */
  var CSS = [
    '.lcd-videos-widget{',
    '--lcdv-heading:#161617;--lcdv-muted:#6b6b70;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
    'display:block;box-sizing:border-box;color:#3a3a3c;-webkit-font-smoothing:antialiased;}',
    '.lcd-videos-widget *,.lcd-videos-widget *::before,.lcd-videos-widget *::after{box-sizing:border-box;}',
    '.lcdv-head{text-align:center;max-width:680px;margin:0 auto 10px;}',
    '.lcdv-title{font-size:30px;font-weight:800;color:var(--lcdv-heading);margin:0 0 8px;',
    'letter-spacing:-.02em;line-height:1.15;}',
    '.lcdv-subtitle{font-size:16px;font-weight:600;color:var(--lcdv-heading);margin:0 0 8px;line-height:1.4;}',
    '.lcdv-text{font-size:14.5px;line-height:1.6;color:var(--lcdv-muted);margin:0;}',
    '.lcdv-viewport{position:relative;}',
    '.lcdv-track{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;',
    'scroll-behavior:smooth;padding:36px 0 32px;-ms-overflow-style:none;scrollbar-width:none;outline:none;}',
    '.lcdv-track::-webkit-scrollbar{display:none;}',
    '.lcdv-card{flex:0 0 232px;max-width:74vw;scroll-snap-align:center;cursor:pointer;',
    'border:0;padding:0;margin:0;background:#111;position:relative;border-radius:16px;',
    'aspect-ratio:9/16;overflow:hidden;display:block;',
    'transform:scale(.84);opacity:.72;transition:transform .35s ease,opacity .35s ease,box-shadow .35s ease;',
    'box-shadow:0 6px 20px rgba(0,0,0,.18);}',
    '.lcdv-card.is-active{transform:scale(1.04);opacity:1;z-index:2;box-shadow:0 20px 46px rgba(0,0,0,.34);}',
    '.lcdv-card:focus-visible{outline:3px solid #1a73e8;outline-offset:3px;}',
    '@media(max-width:560px){.lcdv-card{flex-basis:54vw;max-width:58vw;border-radius:14px;}.lcdv-card.is-active{transform:scale(1.05);}.lcdv-track{gap:8px;padding:30px 0 26px;}.lcdv-play{width:48px;height:48px;}.lcdv-play svg{width:18px;height:18px;}.lcdv-arrow{width:40px;height:40px;}.lcdv-arrow svg{width:16px;height:16px;}.lcdv-title{font-size:21px;}.lcdv-subtitle{font-size:13px;}}',
    '.lcdv-thumb{width:100%;height:100%;object-fit:cover;display:block;}',
    '.lcdv-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);',
    'width:62px;height:62px;border-radius:50%;background:rgba(255,255,255,.92);',
    'display:flex;align-items:center;justify-content:center;',
    'box-shadow:0 4px 16px rgba(0,0,0,.3);transition:transform .2s ease,background .2s ease;}',
    '.lcdv-card:hover .lcdv-play{transform:translate(-50%,-50%) scale(1.09);background:#fff;}',
    '.lcdv-play svg{width:24px;height:24px;margin-left:3px;color:#111;display:block;}',
    '.lcdv-cap{position:absolute;left:0;right:0;bottom:0;padding:34px 14px 14px;',
    'background:linear-gradient(to top,rgba(0,0,0,.9),rgba(0,0,0,.55) 45%,rgba(0,0,0,0));}',
    '.lcdv-cap-title{color:#fff;font-size:13px;font-weight:600;line-height:1.36;margin:0;text-align:left;',
    'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.lcdv-arrow{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;',
    'border-radius:50%;background:#fff;border:1px solid #e4e4e4;cursor:pointer;color:#1c1c1c;',
    'display:flex;align-items:center;justify-content:center;',
    'box-shadow:0 4px 16px rgba(0,0,0,.16);z-index:5;transition:transform .15s ease,opacity .15s ease;}',
    '.lcdv-arrow:hover{transform:translateY(-50%) scale(1.07);}',
    '.lcdv-arrow:focus-visible{outline:2px solid #1a73e8;outline-offset:2px;}',
    '.lcdv-arrow--prev{left:-6px;}.lcdv-arrow--next{right:-6px;}',
    '.lcdv-arrow[disabled]{opacity:0;pointer-events:none;}',
    '.lcdv-arrow svg{width:20px;height:20px;display:block;}',
    '.lcdv-state{text-align:center;color:var(--lcdv-muted);font-size:14px;padding:46px 0;}',
    /* lightbox */
    '.lcdv-lb{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.94);',
    'display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .2s ease;}',
    '.lcdv-lb.is-open{opacity:1;pointer-events:auto;}',
    '.lcdv-lb-frame{position:relative;width:min(440px,94vw);aspect-ratio:9/16;max-height:86vh;',
    'background:#000;border-radius:14px;overflow:hidden;box-shadow:0 16px 60px rgba(0,0,0,.6);}',
    '.lcdv-lb-frame iframe{width:100%;height:100%;border:0;display:block;}',
    '.lcdv-lb-btn{position:fixed;background:rgba(255,255,255,.15);border:none;color:#fff;cursor:pointer;',
    'border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;',
    'transition:background .15s ease;}',
    '.lcdv-lb-btn:hover{background:rgba(255,255,255,.3);}',
    '.lcdv-lb-btn svg{width:24px;height:24px;display:block;}',
    '.lcdv-lb-close{top:18px;right:18px;}',
    '.lcdv-lb-prev{left:18px;top:50%;transform:translateY(-50%);}',
    '.lcdv-lb-next{right:18px;top:50%;transform:translateY(-50%);}',
    '@media(prefers-reduced-motion:reduce){.lcdv-track{scroll-behavior:auto;}',
    '.lcdv-card,.lcdv-arrow,.lcdv-lb{transition:none;}}'
  ].join('');

  /* ----------------------------------------------------------- ikony ------ */
  var ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  /* --------------------------------------------------------- pomocné ------ */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null) continue;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k === 'html') n.innerHTML = v;
        else n.setAttribute(k, v);
      }
    }
    if (kids) {
      if (!Array.isArray(kids)) kids = [kids];
      for (var i = 0; i < kids.length; i++) {
        var c = kids[i];
        if (c == null) continue;
        n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return n;
  }

  function int(v, d) { var n = parseInt(v, 10); return isNaN(n) ? d : n; }

  /* prísna validácia YouTube video ID — 11 znakov [A-Za-z0-9_-] */
  function validId(id) {
    return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);
  }

  function thumbUrl(id) { return 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg'; }
  function thumbFallback(id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }
  function embedUrl(id) {
    return 'https://www.youtube-nocookie.com/embed/' + id +
      '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
  }

  /* ------------------------------------------------------- dáta z API ----- */
  function loadVideos(cfg, cb) {
    var cacheKey = 'lcdVideos_v2_' + cfg.playlistId;
    /* cache */
    try {
      var c = JSON.parse(window.localStorage.getItem(cacheKey) || 'null');
      if (c && c.t && c.v && c.v.length &&
          (Date.now() - c.t) < CONFIG.cacheHours * 3600000) {
        cb(c.v); return;
      }
    } catch (e) { /* localStorage nedostupné — pokračuj */ }

    if (typeof window.fetch !== 'function') { cb(FALLBACK.slice()); return; }

    var out = [];
    function page(token) {
      var url = 'https://www.googleapis.com/youtube/v3/playlistItems' +
        '?part=snippet,status,contentDetails&maxResults=50' +
        '&playlistId=' + encodeURIComponent(cfg.playlistId) +
        '&key=' + encodeURIComponent(cfg.apiKey) +
        (token ? '&pageToken=' + token : '');
      window.fetch(url, { credentials: 'omit' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.error) { throw new Error(j.error.message || 'API error'); }
          (j.items || []).forEach(function (it) {
            var s = it.snippet || {}, st = it.status || {}, cd = it.contentDetails || {};
            var vid = s.resourceId && s.resourceId.videoId;
            if (!validId(vid)) return;
            var ps = st.privacyStatus;
            if (ps === 'private' || ps === 'privacyStatusUnspecified') return;
            if (s.title === 'Private video' || s.title === 'Deleted video') return;
            if (!s.thumbnails) return;            /* nedostupné video */
            // Datum publikacie videa (NIE pridania do playlistu)
            var pub = cd.videoPublishedAt || s.publishedAt || '';
            out.push({ id: vid, title: s.title || '', publishedAt: pub });
          });
          if (j.nextPageToken && out.length < CONFIG.maxFetch) {
            page(j.nextPageToken);
          } else {
            if (!out.length) { cb(FALLBACK.slice()); return; }
            // Sort najnovsie prve (desc podla publishedAt)
            out.sort(function (a, b) {
              return (b.publishedAt || '').localeCompare(a.publishedAt || '');
            });
            try { window.localStorage.setItem(cacheKey,
              JSON.stringify({ t: Date.now(), v: out })); } catch (e) {}
            cb(out);
          }
        })
        .catch(function (err) {
          if (window.console) console.warn('[LCD Videos] API:', err.message,
            '— použijem záložný zoznam');
          cb(FALLBACK.slice());
        });
    }
    page(null);
  }

  /* -------------------------------------------------------- lightbox ----- */
  var lb = null, lbList = [], lbIndex = 0, lbReturnFocus = null;

  function ensureLightbox() {
    if (lb) return lb;
    lb = el('div', { class: 'lcdv-lb', role: 'dialog', 'aria-modal': 'true',
      'aria-label': 'Prehrávač videa' });
    var frame = el('div', { class: 'lcdv-lb-frame' });
    var close = el('button', { class: 'lcdv-lb-btn lcdv-lb-close', type: 'button',
      'aria-label': 'Zavrieť', html: ICON.close });
    var prev = el('button', { class: 'lcdv-lb-btn lcdv-lb-prev', type: 'button',
      'aria-label': 'Predchádzajúce video', html: ICON.chevL });
    var next = el('button', { class: 'lcdv-lb-btn lcdv-lb-next', type: 'button',
      'aria-label': 'Ďalšie video', html: ICON.chevR });
    lb.appendChild(frame); lb.appendChild(close);
    lb.appendChild(prev); lb.appendChild(next);

    function render() {
      frame.textContent = '';
      var v = lbList[lbIndex];
      if (!v) return;
      frame.appendChild(el('iframe', {
        src: embedUrl(v.id),
        title: v.title || 'Video',
        allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture',
        allowfullscreen: 'true'
      }));
      var multi = lbList.length > 1;
      prev.style.display = next.style.display = multi ? '' : 'none';
    }
    function go(d) {
      lbIndex = (lbIndex + d + lbList.length) % lbList.length;
      render();
    }
    function closeFn() {
      lb.classList.remove('is-open');
      frame.textContent = '';                 /* zastaví prehrávanie */
      document.removeEventListener('keydown', onKey);
      if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { closeFn(); return; }
      if (e.key === 'ArrowLeft' && lbList.length > 1) { go(-1); return; }
      if (e.key === 'ArrowRight' && lbList.length > 1) { go(1); return; }
      if (e.key === 'Tab') {
        var f = [close, prev, next].filter(function (b) { return b.style.display !== 'none'; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (f.indexOf(document.activeElement) === -1) { e.preventDefault(); first.focus(); }
      }
    }
    prev.addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    close.addEventListener('click', closeFn);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeFn(); });
    lb._render = render;
    lb._onKey = onKey;
    lb._close = close;
    document.body.appendChild(lb);
    return lb;
  }

  function openLightbox(list, index) {
    if (!list || !list.length) return;
    if (location.protocol === 'file:') { window.open('https://www.youtube.com/watch?v=' + list[index].id, '_blank'); return; }
    var x = ensureLightbox();
    lbReturnFocus = document.activeElement;
    lbList = list;
    lbIndex = Math.min(Math.max(index || 0, 0), list.length - 1);
    x._render();
    x.classList.add('is-open');
    document.addEventListener('keydown', x._onKey);
    x._close.focus();
  }

  /* ----------------------------------------------------------- karta ----- */
  function buildCard(video, list, index) {
    var card = el('button', { class: 'lcdv-card', type: 'button',
      'aria-label': 'Prehrať video: ' + (video.title || 'video') });
    var img = el('img', { class: 'lcdv-thumb', loading: 'lazy', alt: '',
      src: thumbUrl(video.id) });
    img.addEventListener('error', function handler() {
      img.removeEventListener('error', handler);
      img.src = thumbFallback(video.id);
    });
    card.appendChild(img);
    card.appendChild(el('span', { class: 'lcdv-play', html: ICON.play, 'aria-hidden': 'true' }));
    if (video.title) {
      card.appendChild(el('span', { class: 'lcdv-cap' }, [
        el('span', { class: 'lcdv-cap-title', text: video.title })
      ]));
    }
    card.addEventListener('click', function () { openLightbox(list, index); });
    return card;
  }

  /* -------------------------------------------------------- carousel ----- */
  function buildCarousel(videos) {
    var vp = el('div', { class: 'lcdv-viewport' });
    var track = el('div', { class: 'lcdv-track', role: 'list',
      tabindex: '0', 'aria-label': 'Videá' });
    videos.forEach(function (v, i) {
      var c = buildCard(v, videos, i);
      c.setAttribute('role', 'listitem');
      track.appendChild(c);
    });
    var prev = el('button', { class: 'lcdv-arrow lcdv-arrow--prev', type: 'button',
      'aria-label': 'Predchádzajúce', html: ICON.chevL });
    var next = el('button', { class: 'lcdv-arrow lcdv-arrow--next', type: 'button',
      'aria-label': 'Ďalšie', html: ICON.chevR });
    vp.appendChild(prev); vp.appendChild(track); vp.appendChild(next);
    var lockCenter = false;
    setTimeout(function () { lockCenter = true; }, 5000);

    /* okraje, aby aj prvá/posledná karta vedeli byť v strede */
    function pad() {
      var c = track.querySelector('.lcdv-card');
      if (!c) return;
      var p = 6;
      track.style.paddingLeft = track.style.paddingRight = p + 'px';
    }
    /* zvýrazni kartu najbližšie k stredu */
    function markActive() {
      var cards = track.querySelectorAll('.lcdv-card');
      var mid = track.scrollLeft + track.clientWidth / 2;
      var best = null, bestD = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var cMid = c.offsetLeft + c.offsetWidth / 2;
        var d = Math.abs(cMid - mid);
        if (d < bestD) { bestD = d; best = c; }
      }
      for (var j = 0; j < cards.length; j++) {
        cards[j].classList.toggle('is-active', cards[j] === best);
      }
    }
    function step() {
      var c = track.querySelector('.lcdv-card');
      if (!c) return track.clientWidth * 0.6;
      var cs = getComputedStyle(track);
      var gap = parseInt(cs.columnGap || cs.gap, 10) || 18;
      return c.offsetWidth + gap;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max || max <= 0;
      markActive();
    }
    prev.addEventListener('click', function () {
      lockCenter = true;
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    next.addEventListener('click', function () {
      lockCenter = true;
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });
    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', function () {
      pad();
      window.requestAnimationFrame(update);
    });

    /* ťahanie myšou */
    var startX = 0, startScroll = 0, moved = false;
    function onMove(e) {
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    }
    function onUp() {
      track.style.userSelect = ''; track.style.cursor = '';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    track.addEventListener('pointerdown', function (e) {
      lockCenter = true;
      if (e.pointerType !== 'mouse') return;
      moved = false; startX = e.clientX; startScroll = track.scrollLeft;
      track.style.userSelect = 'none'; track.style.cursor = 'grabbing';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    /* vycentruje 4. kartu -> 3 vlavo + 1 zvacsena v strede + 3 vpravo.
       Robustne: caka na layout a overuje, ze scroll naozaj zostal nastaveny
       (scroll-snap moze hodnotu vratit, kym sa carousel este renderuje). */
    function centerCard() {
      var icards = track.querySelectorAll('.lcdv-card');
      if (!icards.length) return false;
      var si = Math.min(3, icards.length - 1);
      var c = icards[si];
      if (!c || !c.offsetWidth) return false;
      var target = c.offsetLeft + c.offsetWidth / 2 - track.clientWidth / 2;
      target = Math.max(0, Math.min(target, track.scrollWidth - track.clientWidth));
      /* DOLEZITE: scroll-behavior:smooth + scroll-snap:mandatory blokuju
         programove nastavenie scrollLeft (hodnota ostane 0). Docasne
         vypneme smooth, nastavime scroll instantne a hned obnovime. */
      var prevBehav = track.style.scrollBehavior;
      track.style.scrollBehavior = 'auto';
      track.scrollLeft = target;
      track.style.scrollBehavior = prevBehav;
      markActive();
      /* uspesne ak sa stred drzi na pozadovanej karte (snap toleruje par px) */
      var mid = track.scrollLeft + track.clientWidth / 2;
      return Math.abs((c.offsetLeft + c.offsetWidth / 2) - mid) < c.offsetWidth / 2;
    }
    function initCarousel(tries) {
      tries = tries || 0;
      if (!track.clientWidth || !track.scrollWidth) {
        if (tries < 40) { setTimeout(function () { initCarousel(tries + 1); }, 80); }
        return;
      }
      pad();
      var ok = centerCard();
      update();
      /* opakuj, kym sa carousel neustali (lazy obrazky / async render) */
      if (!ok && tries < 40) {
        setTimeout(function () { initCarousel(tries + 1); }, 80);
      } else {
        /* finalne docentrovanie po ustaleni layoutu */
        requestAnimationFrame(function () { centerCard(); update(); });
        setTimeout(function () { centerCard(); update(); }, 300);
      }
    }
    setTimeout(function () { initCarousel(0); }, 60);
    /* re-center ked sa nacitaju thumbnaily (menia rozmery layoutu) */
    track.addEventListener('load', function () {
      if (lockCenter) return;
      requestAnimationFrame(function () { centerCard(); update(); });
    }, true);
    return vp;
  }

  /* --------------------------------------------------------- hlavička ---- */
  function buildHeader(cfg) {
    var head = el('div', { class: 'lcdv-head' });
    if (cfg.title) head.appendChild(el('h3', { class: 'lcdv-title', text: cfg.title }));
    if (cfg.subtitle) head.appendChild(el('p', { class: 'lcdv-subtitle', text: cfg.subtitle }));
    if (cfg.text) head.appendChild(el('p', { class: 'lcdv-text', text: cfg.text }));
    return head;
  }

  /* ----------------------------------------------------- render widget --- */
  function renderWidget(host) {
    if (host.classList.contains('lcdv-ready')) return;
    host.classList.add('lcdv-ready');

    var cfg = {
      title: host.hasAttribute('data-title') ? host.getAttribute('data-title') : DEFAULTS.title,
      subtitle: host.hasAttribute('data-subtitle') ? host.getAttribute('data-subtitle') : DEFAULTS.subtitle,
      text: host.hasAttribute('data-text') ? host.getAttribute('data-text') : DEFAULTS.text,
      limit: int(host.getAttribute('data-limit'), DEFAULTS.limit),
      playlistId: host.getAttribute('data-playlist') || CONFIG.playlistId,
      apiKey: host.getAttribute('data-api-key') || CONFIG.apiKey
    };

    host.textContent = '';
    host.appendChild(el('div', { class: 'lcdv-state', text: 'Načítavam videá…' }));

    loadVideos(cfg, function (videos) {
      host.textContent = '';
      var list = (videos || []).filter(function (v) { return v && validId(v.id); })
        .slice(0, cfg.limit);
      if (!list.length) { host.style.display = 'none'; return; }
      host.appendChild(buildHeader(cfg));
      host.appendChild(buildCarousel(list));
    });
  }

  /* --------------------------------------------------------------- init -- */
  function injectCss() {
    if (document.getElementById('lcdv-css')) return;
    var s = document.createElement('style');
    s.id = 'lcdv-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  /* Widget je hlboko pod zlomom (produkt: pod „Zloženie materiálu“). Playlist
     z YouTube Data API (pri prvej návšteve ~10 požiadaviek, ~234 kB JSON) a náhľady
     sa preto ťahajú až keď sa widget priblíži k obrazovke (600 px vopred).
     Bez IntersectionObserver sa vykreslí hneď ako doteraz. */
  var io = null;
  function lazyObserver() {
    if (io || typeof window.IntersectionObserver !== 'function') return io;
    io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var host = entries[i].target;
        io.unobserve(host);
        host.classList.remove('lcdv-wait');
        renderWidget(host);
      }
    }, { rootMargin: '600px 0px 600px 0px' });
    return io;
  }

  function initAll() {
    injectCss();
    var hosts = document.querySelectorAll('.lcd-videos-widget:not(.lcdv-ready):not(.lcdv-wait)');
    var obs = lazyObserver();
    for (var i = 0; i < hosts.length; i++) {
      if (obs) { hosts[i].classList.add('lcdv-wait'); obs.observe(hosts[i]); }
      else renderWidget(hosts[i]);
    }
  }

  /* Shoptet donačítava obsah cez AJAX — sleduj nové widgety */
  function watchDom() {
    if (typeof MutationObserver !== 'function' || !document.body) return;
    var timer = null;
    new MutationObserver(function () {
      if (timer) return;
      timer = setTimeout(function () {
        timer = null;
        if (document.querySelector('.lcd-videos-widget:not(.lcdv-ready):not(.lcdv-wait)')) initAll();
      }, 300);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function boot() { initAll(); watchDom(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.LcdVideos = { render: initAll };

})();
