/* ============================================================================
   LCD Reviews Widget  —  Google recenzie pre Shoptet
   ----------------------------------------------------------------------------
   Jeden súbor = celý widget (HTML aj CSS si injektuje sám).
   Kompatibilný so Shoptetom: vlož tento <script> RAZ globálne (zápätie šablóny),
   a kdekoľvek chceš widget, vlož len prázdny div:

       <div class="lcd-reviews-widget"
            data-title="Čo hovoria naši zákazníci"
            data-limit="9"
            data-min-rating="4"></div>

   Data-atribúty (všetky voliteľné):
     data-title       nadpis nad widgetom        (default "Čo hovoria naši zákazníci")
     data-limit       max. počet recenzií        (default 12)
     data-min-rating  minimálny počet hviezd     (default 4)
     data-sentences   koľko viet textu zobraziť  (default 3)
     data-lang        filter jazyka: sk/cz/all   (default all)
     data-source      URL na reviews.json        (default: window.LCD_REVIEWS)

   Dáta: buď window.LCD_REVIEWS (súbor reviews-data.js), alebo data-source URL.
   ============================================================================ */
(function () {
  'use strict';

  /* poistka proti dvojitému načítaniu */
  if (window.__lcdReviewsLoaded) return;
  window.__lcdReviewsLoaded = true;

  /* -------------------------------------------------------------- konfig --- */
  // Pevne Google linky pre LCD profil — Zobrazit profil + Napisat recenziu
  var LCD_GOOGLE_VIEW_URL = "https://www.google.com/maps/place/Luxury+Car+Design/@49.1861708,18.7330054,1043m/data=!3m1!1e3!4m8!3m7!1s0x8c8f632b21071671:0xd702e416d6787c20!8m2!3d49.1861708!4d18.7330054!9m1!1b1!16s%2Fg%2F11txlgxckd?authuser=0&hl=cs&entry=ttu&g_ep=EgoyMDI2MDUyNi4wIKXMDSoASAFQAw%3D%3D";
  var LCD_GOOGLE_WRITE_URL = "https://g.page/r/CSB8eNYW5ALXEAI/review";

  var DEFAULTS = {
    limit: 12,
    minRating: 4,
    title: 'Čo hovoria naši zákazníci',
    lang: 'all',
    sentences: 3,
    maxChars: 240
  };

  var SK_MONTHS = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna',
    'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];
  var CZ_MONTHS = ['ledna', 'února', 'března', 'dubna', 'května', 'června',
    'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

  /* ----------------------------------------------------------------- CSS --- */
  var CSS = [
    '.lcd-reviews-widget{',
    '--lcdr-star:#FBBC05;--lcdr-gold:#c49b31;--lcdr-card-bg:#ffffff;--lcdr-card-border:#ece6d6;',
    '--lcdr-text:#4d4d4d;--lcdr-heading:#1f1f1f;--lcdr-muted:#8a8276;--lcdr-radius:14px;',
    'font-family:"Source Sans 3","Source Sans Pro",-apple-system,Segoe UI,Roboto,Arial,sans-serif;',
    'display:block;box-sizing:border-box;color:var(--lcdr-text);-webkit-font-smoothing:antialiased;background:#f8f6f1;border-radius:24px;padding:42px 30px;}',
    '.lcd-reviews-widget *,.lcd-reviews-widget *::before,.lcd-reviews-widget *::after{box-sizing:border-box;}',
    '.lcdr-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px;margin:0 0 28px;}',
    '.lcdr-title{font-family:"Exo 2",sans-serif;font-size:26px;font-weight:700;color:var(--lcdr-gold);margin:0;text-transform:uppercase;letter-spacing:.04em;line-height:1.2;}','.lcdr-title::after{content:"";display:block;width:54px;height:3px;background:var(--lcdr-gold);margin:14px auto 0;border-radius:2px;}',
    '.lcdr-gbadge{display:inline-flex;align-items:center;gap:18px;max-width:100%;background:#fff;border:1px solid var(--lcdr-card-border);border-radius:16px;padding:15px 24px;box-shadow:0 6px 22px rgba(0,0,0,.08);}',
    '.lcdr-gbadge-left{display:flex;flex-direction:column;align-items:center;gap:6px;}',
    '.lcdr-gbadge-score{font-family:"Exo 2",sans-serif;font-size:40px;font-weight:700;color:var(--lcdr-gold);line-height:1;}',
    '.lcdr-gbadge-stars{display:inline-flex;gap:2px;}',
    '.lcdr-gbadge-stars .lcdr-star{width:16px;height:16px;}',
    '.lcdr-gbadge-div{width:1px;align-self:stretch;background:var(--lcdr-card-border);}',
    '.lcdr-gbadge-right{display:flex;flex-direction:column;align-items:flex-start;gap:3px;}',
    '.lcdr-gbadge-brand{font-family:"Exo 2",sans-serif;font-size:18px;font-weight:700;color:var(--lcdr-heading);letter-spacing:.01em;}',
    '.lcdr-gbadge-sub{font-size:13px;color:var(--lcdr-muted);}',
    '.lcdr-gbadge-logo{width:38px;height:38px;display:inline-flex;flex:0 0 auto;}',
    '.lcdr-gbadge-logo svg{width:100%;height:100%;display:block;}',
    '.lcdr-viewport{position:relative;}',
    '.lcdr-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;',
    'scroll-behavior:smooth;padding:6px 2px 14px;margin:0 -2px;',
    '-ms-overflow-style:none;scrollbar-width:none;outline:none;}',
    '.lcdr-track::-webkit-scrollbar{display:none;}',
    '.lcdr-card{flex:0 0 320px;max-width:86vw;scroll-snap-align:start;',
    'background:var(--lcdr-card-bg);border:1px solid var(--lcdr-card-border);',
    'border-radius:var(--lcdr-radius);padding:20px;display:flex;flex-direction:column;gap:12px;height:340px;position:relative;box-shadow:0 8px 28px rgba(0,0,0,.09);}',
    '@media(max-width:560px){.lcdr-card{flex-basis:84vw;}.lcdr-title{font-size:20px;}.lcdr-gbadge{gap:12px;padding:13px 16px;}.lcdr-gbadge-score{font-size:32px;}.lcdr-gbadge-logo{width:30px;height:30px;}.lcdr-gbadge-brand{font-size:16px;}}',
    '@media(max-width:768px){.lcd-reviews-widget{width:100% !important;max-width:100% !important;}.lcd-reviews-widget .lcdr-head{display:flex !important;visibility:visible !important;opacity:1 !important;}.lcd-reviews-widget .lcdr-title{display:block !important;visibility:visible !important;opacity:1 !important;color:var(--lcdr-gold) !important;}.lcd-reviews-widget .lcdr-gbadge{display:inline-flex !important;visibility:visible !important;opacity:1 !important;background:#fff !important;}.lcd-reviews-widget .lcdr-gbadge *{visibility:visible !important;}.lcd-reviews-widget .lcdr-cta{display:flex !important;visibility:visible !important;opacity:1 !important;}.lcd-reviews-widget .lcdr-cta a{display:inline-flex !important;visibility:visible !important;opacity:1 !important;background:var(--lcdr-gold) !important;color:#fff !important;}}',
    '.lcdr-arrow{position:absolute;top:42%;transform:translateY(-50%);width:42px;height:42px;',
    'border-radius:50%;background:#fff;border:1px solid #e4e4e4;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;color:#1c1c1c;',
    'box-shadow:0 4px 14px rgba(0,0,0,.13);z-index:4;transition:opacity .15s,transform .15s;}',
    '.lcdr-arrow:hover{transform:translateY(-50%) scale(1.07);}',
    '.lcdr-arrow:focus-visible{outline:2px solid #1a73e8;outline-offset:2px;}',
    '.lcdr-arrow--prev{left:-14px;}.lcdr-arrow--next{right:-14px;}',
    '.lcdr-arrow[disabled]{opacity:0;pointer-events:none;}',
    '.lcdr-arrow svg{width:18px;height:18px;display:block;}',
    '.lcdr-card-top{display:flex;align-items:center;gap:12px;}',
    '.lcdr-avatar{width:44px;height:44px;border-radius:50%;flex:0 0 44px;display:flex;',
    'align-items:center;justify-content:center;font-weight:700;font-size:17px;color:#fff;overflow:hidden;box-shadow:0 0 0 2px #fff,0 0 0 3px rgba(196,155,49,.5);}',
    '.lcdr-avatar img{width:100%;height:100%;object-fit:cover;}',
    '.lcdr-meta{min-width:0;flex:1;}',
    '.lcdr-name{font-family:"Exo 2",sans-serif;font-weight:700;font-size:15px;color:var(--lcdr-heading);',
    'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.lcdr-date{font-size:12.5px;color:var(--lcdr-muted);margin-top:1px;}',
    '.lcdr-gmark{flex:0 0 auto;width:28px;height:28px;}',
    '.lcdr-gmark svg{width:100%;height:100%;display:block;}',
    '.lcdr-stars-row{display:flex;align-items:center;gap:7px;}',
    '.lcdr-stars{display:inline-flex;gap:2px;}',
    '.lcdr-stars .lcdr-star{width:17px;height:17px;}',
    '.lcdr-star{display:inline-flex;line-height:0;}',
    '.lcdr-star svg{width:100%;height:100%;display:block;}',
    '.lcdr-star.is-on svg{fill:var(--lcdr-star);}',
    '.lcdr-star.is-off svg{fill:#dcdcdc;}',
    '.lcdr-verified{width:15px;height:15px;display:inline-flex;flex:0 0 auto;}',
    '.lcdr-verified svg{width:100%;height:100%;display:block;}',
    '.lcdr-text{font-size:14.5px;line-height:1.62;color:var(--lcdr-text);margin:0;flex:1;white-space:pre-line;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:6;}','',
    '.lcdr-photos{display:flex;gap:6px;flex-wrap:wrap;}',
    '.lcdr-thumb{width:58px;height:58px;border-radius:9px;overflow:hidden;padding:0;',
    'border:1px solid var(--lcdr-card-border);cursor:pointer;background:#e9e9e9;position:relative;}',
    '.lcdr-thumb:hover{border-color:#c4c4c4;}',
    '.lcdr-thumb:focus-visible{outline:2px solid #1a73e8;outline-offset:1px;}',
    '.lcdr-thumb img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.lcdr-thumb-more{position:absolute;inset:0;background:rgba(0,0,0,.55);color:#fff;',
    'font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;}',
    '.lcdr-more{font-size:13px;color:var(--lcdr-gold);text-decoration:none;',
    'display:inline-flex;align-items:center;gap:5px;align-self:flex-start;font-weight:600;}',
    '.lcdr-more:hover{color:var(--lcdr-heading);text-decoration:underline;}',
    '.lcdr-more svg{width:12px;height:12px;display:block;}',
    '.lcdr-state{font-size:14px;color:var(--lcdr-muted);padding:18px 2px;}',
    '.lcdr-lb{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.92);',
    'display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;',
    'transition:opacity .2s;}',
    '.lcdr-lb.is-open{opacity:1;pointer-events:auto;}',
    '.lcdr-lb img{max-width:90vw;max-height:84vh;border-radius:8px;box-shadow:0 12px 50px rgba(0,0,0,.55);}',
    '.lcdr-lb-btn{position:absolute;background:rgba(255,255,255,.14);border:none;color:#fff;',
    'cursor:pointer;border-radius:50%;width:48px;height:48px;display:flex;align-items:center;',
    'justify-content:center;transition:background .15s;}',
    '.lcdr-lb-btn:hover{background:rgba(255,255,255,.3);}',
    '.lcdr-lb-btn svg{width:22px;height:22px;display:block;}',
    '.lcdr-lb-close{top:18px;right:18px;}',
    '.lcdr-lb-prev{left:18px;top:50%;transform:translateY(-50%);}',
    '.lcdr-lb-next{right:18px;top:50%;transform:translateY(-50%);}',
    '.lcdr-lb-count{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);',
    'color:#fff;font-size:13px;background:rgba(0,0,0,.45);padding:5px 13px;border-radius:20px;}',
    '.lcdr-lb-glink{position:absolute;bottom:58px;left:50%;transform:translateX(-50%);',
    'display:inline-flex;align-items:center;gap:7px;color:#fff;font-size:13px;font-weight:600;',
    'text-decoration:none;background:rgba(0,0,0,.55);padding:7px 16px;border-radius:22px;',
    'white-space:nowrap;border:1px solid rgba(255,255,255,.18);transition:background .15s;}',
    '.lcdr-lb-glink:hover{background:rgba(255,255,255,.2);}',
    '.lcdr-lb-glink svg{width:16px;height:16px;flex:0 0 16px;display:block;}',
    '.lcdr-cta{margin:32px auto 0;display:flex;justify-content:center;}',
    '.lcdr-cta a{display:inline-flex;align-items:center;gap:9px;background:var(--lcdr-gold);color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 30px;border-radius:10px;transition:filter .15s,transform .15s;}',
    '.lcdr-cta a:hover{filter:brightness(1.08);transform:translateY(-1px);}',
    '.lcdr-cta a svg{width:18px;height:18px;}',
    '@media(prefers-reduced-motion:reduce){.lcdr-track{scroll-behavior:auto;}.lcdr-lb,.lcdr-arrow{transition:none;}}'
  ].join('');

  /* --------------------------------------------------------------- ikony --- */
  /* Inline SVG — pevné konštanty, nikdy neobsahujú dáta používateľa. */
  var ICON = {
    star: '<svg viewBox="0 0 24 24"><path d="M12 2.4l2.95 5.98 6.6.96-4.77 4.65 1.12 6.57L12 17.43 6.1 20.56l1.12-6.57L2.45 9.34l6.6-.96z"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    extlink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h10v10M19 5L8 16"/></svg>',
    write: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    verified: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#c49b31"/><path d="M7 12.4l3.3 3.3L17 9" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    google: '<svg viewBox="0 0 24 24">' +
      '<path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87z"/>' +
      '<path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.46 1.15-4.05 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24z"/>' +
      '<path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.57.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38z"/>' +
      '<path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.86 8.87 4.75 12 4.75z"/></svg>'
  };

  /* ------------------------------------------------------------- pomocné --- */

  /* Vytvorí element. POZOR: kľúč 'html' nastaví innerHTML — použiť LEN pre
     dôveryhodné konštanty (ICON.*), NIKDY pre dáta od používateľa. */
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

  /* povolí len http(s) odkazy — blokuje javascript: a pod. */
  function safeLink(u) {
    return (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) ? u.trim() : null;
  }

  /* povolí http(s), data:image a relatívne cesty — blokuje cudzie schémy */
  function safeImg(u) {
    if (typeof u !== 'string' || !u) return null;
    u = u.trim();
    if (/^https?:\/\//i.test(u)) return u;
    if (/^data:image\//i.test(u)) return u;
    if (/^\/\//.test(u)) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return null;
    return u;
  }

  /* deterministická farba avatara z mena */
  function initialsColor(name) {
    var pal = ['#7e57c2', '#26a69a', '#d96d9a', '#5c6bc0', '#e8833a', '#42a5b3',
      '#8d6e63', '#5b8a72', '#c0573b', '#4f7a8b'];
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return pal[h % pal.length];
  }

  /* dátum -> "9. mája 2026"; pri cz recenzii české mesiace; fallback na text z Googlu */
  function fmtDate(iso, rel, lang) {
    if (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) {
      var d = new Date(iso);
      if (!isNaN(d.getTime())) {
        var months = (lang === 'cz' || lang === 'cs') ? CZ_MONTHS : SK_MONTHS;
        return d.getDate() + '. ' + months[d.getMonth()] + ' ' + d.getFullYear();
      }
    }
    return rel || '';
  }

  /* skráti text na N viet, tvrdý strop maxChars, pridá "…" */
  function truncate(text, maxSentences, maxChars) {
    var clean = (text || '').trim().replace(/[ \t]+/g, ' ');
    if (!clean) return '';
    var parts = clean.match(/[^.!?…]+[.!?…]+(?:["'’)]+)?|[^.!?…]+$/g) || [clean];
    var out = parts.slice(0, maxSentences).join(' ').trim();
    var cut = parts.length > maxSentences;
    if (out.length > maxChars) {
      out = out.slice(0, maxChars);
      var sp = out.lastIndexOf(' ');
      if (sp > 40) out = out.slice(0, sp);
      cut = true;
    }
    if (cut) out = out.replace(/[\s.,;:!?–-]+$/, '') + ' …';
    return out;
  }

  /* riadok 5 hviezd podľa hodnotenia */
  function starRow(rating) {
    var n = Math.round(rating) || 0;
    var wrap = el('span', { class: 'lcdr-stars', role: 'img',
      'aria-label': 'Hodnotenie ' + n + ' z 5' });
    for (var i = 1; i <= 5; i++) {
      wrap.appendChild(el('span', {
        class: 'lcdr-star ' + (i <= n ? 'is-on' : 'is-off'),
        html: ICON.star, 'aria-hidden': 'true'
      }));
    }
    return wrap;
  }

  /* ------------------------------------------------------------ lightbox --- */
  var lb = null, lbState = { photos: [], i: 0, reviewUrl: null }, lbReturnFocus = null;

  function ensureLightbox() {
    if (lb) return lb;
    lb = el('div', { class: 'lcdr-lb', role: 'dialog', 'aria-modal': 'true',
      'aria-label': 'Fotka od zákazníka' });
    var img = el('img', { alt: 'Fotka od zákazníka' });
    var prev = el('button', { class: 'lcdr-lb-btn lcdr-lb-prev', type: 'button',
      'aria-label': 'Predchádzajúca fotka', html: ICON.chevL });
    var next = el('button', { class: 'lcdr-lb-btn lcdr-lb-next', type: 'button',
      'aria-label': 'Ďalšia fotka', html: ICON.chevR });
    var close = el('button', { class: 'lcdr-lb-btn lcdr-lb-close', type: 'button',
      'aria-label': 'Zavrieť', html: ICON.close });
    var count = el('div', { class: 'lcdr-lb-count' });
    var glink = el('a', { class: 'lcdr-lb-glink', target: '_blank',
      rel: 'noopener noreferrer nofollow',
      'aria-label': 'Zobraziť recenziu na Google' }, [
      el('span', { html: ICON.google, 'aria-hidden': 'true' }),
      'Zobraziť recenziu na Google'
    ]);
    glink.style.display = 'none';
    lb.appendChild(prev); lb.appendChild(next); lb.appendChild(close);
    lb.appendChild(img); lb.appendChild(count); lb.appendChild(glink);

    function show() {
      img.src = lbState.photos[lbState.i];
      count.textContent = (lbState.i + 1) + ' / ' + lbState.photos.length;
      var multi = lbState.photos.length > 1;
      prev.style.display = next.style.display = multi ? '' : 'none';
      count.style.display = multi ? '' : 'none';
      var gu = lbState.reviewUrl;
      if (gu) { glink.href = gu; glink.style.display = ''; }
      else { glink.style.display = 'none'; }
    }
    function go(d) {
      lbState.i = (lbState.i + d + lbState.photos.length) % lbState.photos.length;
      show();
    }
    function closeFn() {
      lb.classList.remove('is-open');
      img.removeAttribute('src');
      document.removeEventListener('keydown', onKey);
      if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    }
    function onKey(e) {
      if (e.key === 'Escape') { closeFn(); return; }
      if (e.key === 'ArrowLeft') { go(-1); return; }
      if (e.key === 'ArrowRight') { go(1); return; }
      if (e.key === 'Tab') {
        var f = [prev, next, close].filter(function (b) {
          return b.style.display !== 'none';
        });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        } else if (f.indexOf(document.activeElement) === -1) {
          e.preventDefault(); first.focus();
        }
      }
    }
    prev.addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); go(1); });
    close.addEventListener('click', closeFn);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeFn(); });
    lb._show = show;
    lb._onKey = onKey;
    lb._closeBtn = close;
    document.body.appendChild(lb);
    return lb;
  }

  function openLightbox(photos, i, reviewUrl) {
    if (!photos || !photos.length) return;
    var x = ensureLightbox();
    lbReturnFocus = document.activeElement;
    lbState.photos = photos;
    lbState.i = Math.min(Math.max(i || 0, 0), photos.length - 1);
    lbState.reviewUrl = reviewUrl || null;
    x._show();
    x.classList.add('is-open');
    document.addEventListener('keydown', x._onKey);
    x._closeBtn.focus();
  }

  /* ---------------------------------------------------------------- karta --- */
  function buildCard(r, cfg) {
    var card = el('div', { class: 'lcdr-card', role: 'listitem' });

    var av = el('div', { class: 'lcdr-avatar' });
    var nm = (r.author || '?').trim();
    function setInitial() {
      av.style.background = initialsColor(nm || '?');
      av.textContent = (nm.charAt(0) || '?').toUpperCase();
    }
    var ap = safeImg(r.authorPhoto);
    if (ap) {
      var aimg = el('img', { src: ap, alt: '', loading: 'lazy' });
      aimg.addEventListener('error', setInitial);
      av.appendChild(aimg);
    } else {
      setInitial();
    }
    var meta = el('div', { class: 'lcdr-meta' }, [
      el('div', { class: 'lcdr-name', text: r.author || 'Zákazník' }),
      el('div', { class: 'lcdr-date', text: fmtDate(r.date, r.relativeDate, r.language) })
    ]);
    card.appendChild(el('div', { class: 'lcdr-card-top' }, [
      av, meta,
      el('span', { class: 'lcdr-gmark', html: ICON.google,
        'aria-hidden': 'true', title: tr(cfg).gReview })
    ]));

    card.appendChild(el('div', { class: 'lcdr-stars-row' }, [
      starRow(r.rating),
      el('span', { class: 'lcdr-verified', html: ICON.verified,
        'aria-hidden': 'true', title: tr(cfg).verified })
    ]));

    card.appendChild(el('p', { class: 'lcdr-text', text: truncate(r.text, cfg.sentences, cfg.maxChars) }));

    var photos = (r.photos || []).map(safeImg).filter(Boolean);
    if (photos.length) {
      var SHOW = 4;
      var prow = el('div', { class: 'lcdr-photos' });
      // Self-healing: niektoré Google review fotky (grass-cs URL) môžu expirovať.
      // Pri chybe načítania fotku odstránime z radu aj z lightboxu a rad prerenderujeme
      // (oprava počtu + slotov), aby zákazník nikdy nevidel rozbitý placeholder.
      var renderThumbs = function () {
        prow.innerHTML = '';
        photos.slice(0, SHOW).forEach(function (p, i) {
          var btn = el('button', { class: 'lcdr-thumb', type: 'button',
            'aria-label': tr(cfg).zoom + (i + 1) });
          var pimg = el('img', { src: p, alt: 'Fotka od zákazníka', loading: 'lazy' });
          pimg.addEventListener('error', function () {
            var idx = photos.indexOf(p);
            if (idx !== -1) photos.splice(idx, 1);
            if (!photos.length) { if (prow.parentNode) prow.parentNode.removeChild(prow); return; }
            renderThumbs();
          });
          btn.appendChild(pimg);
          if (i === SHOW - 1 && photos.length > SHOW) {
            btn.appendChild(el('span', { class: 'lcdr-thumb-more',
              text: '+' + (photos.length - SHOW) }));
          }
          btn.addEventListener('click', function () { openLightbox(photos, i, safeLink(r.url) || LCD_GOOGLE_VIEW_URL); });
          prow.appendChild(btn);
        });
      };
      renderThumbs();
      card.appendChild(prow);
    }

    var href = LCD_GOOGLE_VIEW_URL;
    if (href) {
      card.appendChild(el('a', {
        class: 'lcdr-more', href: href, target: '_blank',
        rel: 'noopener noreferrer nofollow'
      }, [
        tr(cfg).readMore,
        el('span', { html: ICON.extlink, 'aria-hidden': 'true' })
      ]));
    }
    return card;
  }

  /* ------------------------------------------------------------- carousel --- */
  function buildCarousel(reviews, cfg) {
    var vp = el('div', { class: 'lcdr-viewport' });
    var track = el('div', { class: 'lcdr-track', role: 'list',
      tabindex: '0', 'aria-label': tr(cfg).list });
    reviews.forEach(function (r) { track.appendChild(buildCard(r, cfg)); });

    var prev = el('button', { class: 'lcdr-arrow lcdr-arrow--prev', type: 'button',
      'aria-label': tr(cfg).prev, html: ICON.chevL });
    var next = el('button', { class: 'lcdr-arrow lcdr-arrow--next', type: 'button',
      'aria-label': tr(cfg).next, html: ICON.chevR });
    vp.appendChild(prev);
    vp.appendChild(track);
    vp.appendChild(next);

    function step() {
      var c = track.querySelector('.lcdr-card');
      if (!c) return track.clientWidth * 0.9;
      var cs = getComputedStyle(track);
      var gap = parseInt(cs.columnGap || cs.gap, 10) || 16;
      return c.offsetWidth + gap;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max || max <= 0;
    }
    prev.addEventListener('click', function () {
      track.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    next.addEventListener('click', function () {
      track.scrollBy({ left: step(), behavior: 'smooth' });
    });
    track.addEventListener('scroll', function () {
      window.requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', function () {
      window.requestAnimationFrame(update);
    });

    /* ťahanie myšou (desktop) — listenery žijú len počas ťahania */
    var startX = 0, startScroll = 0, moved = false;
    function onDragMove(e) {
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    }
    function onDragEnd() {
      track.style.userSelect = '';
      track.style.cursor = '';
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragEnd);
    }
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.style.userSelect = 'none';
      track.style.cursor = 'grabbing';
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup', onDragEnd);
    });
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);

    setTimeout(update, 60);
    return vp;
  }

  /* ------------------------------------------------------------- hlavička --- */
  /* ----------------------------------------------------------- preklady --- */
  var I18N = {
    sk: { readMore: 'Čítať viac', verified: 'Overená recenzia', gReview: 'Recenzia z Google',
          prev: 'Predchádzajúce recenzie', next: 'Ďalšie recenzie', list: 'Recenzie zákazníkov',
          loading: 'Načítavam recenzie…', zoom: 'Zväčšiť fotku ',
          ratingAria: 'Hodnotenie', avg: 'priemerné hodnotenie',
          rev1: 'recenzia', rev2: 'recenzie', rev5: 'recenzií', writeReview: 'Napíšte nám recenziu' },
    cz: { readMore: 'Číst více', verified: 'Ověřená recenze', gReview: 'Recenze z Google',
          prev: 'Předchozí recenze', next: 'Další recenze', list: 'Recenze zákazníků',
          loading: 'Načítám recenze…', zoom: 'Zvětšit fotku ',
          ratingAria: 'Hodnocení', avg: 'průměrné hodnocení',
          rev1: 'recenze', rev2: 'recenze', rev5: 'recenzí', writeReview: 'Napište nám recenzi' }
  };
  function tr(cfg) {
    return (cfg && (cfg.lang === 'cz' || cfg.lang === 'cs')) ? I18N.cz : I18N.sk;
  }

  function buildHeader(place, cfg) {
    var head = el('div', { class: 'lcdr-head' });
    head.appendChild(el('h3', { class: 'lcdr-title', text: cfg.title }));
    if (place && place.rating) {
      var ss = el('span', { class: 'lcdr-gbadge-stars', 'aria-hidden': 'true' });
      var rn = Math.round(Number(place.rating)) || 0;
      for (var i = 1; i <= 5; i++) {
        ss.appendChild(el('span', { class: 'lcdr-star ' + (i <= rn ? 'is-on' : 'is-off'),
          html: ICON.star }));
      }
      var rt = Number(place.rating).toFixed(1).replace('.', ',');
      var sub = place.totalReviews
        ? place.totalReviews + ' ' +
          plural(place.totalReviews, tr(cfg).rev1, tr(cfg).rev2, tr(cfg).rev5)
        : tr(cfg).avg;
      var badge = el('div', { class: 'lcdr-gbadge', role: 'img',
        'aria-label': tr(cfg).ratingAria + ' ' + rt + ' z 5 na Google' }, [
        el('div', { class: 'lcdr-gbadge-left' }, [
          el('span', { class: 'lcdr-gbadge-score', text: rt }),
          ss
        ]),
        el('span', { class: 'lcdr-gbadge-div', 'aria-hidden': 'true' }),
        el('div', { class: 'lcdr-gbadge-right' }, [
          el('span', { class: 'lcdr-gbadge-brand', text: 'Google' }),
          el('span', { class: 'lcdr-gbadge-sub', text: sub })
        ]),
        el('span', { class: 'lcdr-gbadge-logo', html: ICON.google,
          'aria-hidden': 'true' })
      ]);
      head.appendChild(badge);
    }
    return head;
  }

  /* slovenské skloňovanie počtu */
  function plural(n, one, few, many) {
    n = Math.abs(n) % 100;
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return many;
  }

  /* --------------------------------------------------------------- dáta --- */
  function normalize(j) {
    if (!j) return null;
    if (Array.isArray(j)) return { place: null, reviews: j };
    return { place: j.place || null, reviews: j.reviews || [] };
  }

  function getData(host, cb) {
    var src = host.getAttribute('data-source');
    if (src) {
      if (typeof window.fetch !== 'function') { cb(new Error('fetch nie je dostupný')); return; }
      window.fetch(src, { credentials: 'omit' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (j) { cb(null, normalize(j)); })
        .catch(function (e) { cb(e); });
      return;
    }
    if (window.LCD_REVIEWS) { cb(null, normalize(window.LCD_REVIEWS)); return; }
    cb(new Error('Chýba window.LCD_REVIEWS aj data-source'));
  }

  /* ----------------------------------------------------- render widgetu --- */
  function renderWidget(host) {
    if (host.classList.contains('lcdr-ready')) return;
    host.classList.add('lcdr-ready');

    var cfg = {
      limit: int(host.getAttribute('data-limit'), DEFAULTS.limit),
      minRating: int(host.getAttribute('data-min-rating'), DEFAULTS.minRating),
      title: host.getAttribute('data-title') || DEFAULTS.title,
      lang: (host.getAttribute('data-lang') || DEFAULTS.lang).toLowerCase(),
      sentences: int(host.getAttribute('data-sentences'), DEFAULTS.sentences),
      maxChars: DEFAULTS.maxChars,
      placeUrl: ''
    };

    host.textContent = '';
    host.appendChild(el('div', { class: 'lcdr-state', text: tr(cfg).loading }));

    getData(host, function (err, data) {
      host.textContent = '';
      if (err || !data || !data.reviews || !data.reviews.length) {
        host.style.display = 'none';
        if (window.console) console.warn('[LCD Reviews]', err ? err.message : 'žiadne recenzie');
        return;
      }
      cfg.placeUrl = (data.place && safeLink(data.place.url)) || '';

      var list = data.reviews.filter(function (r) {
        if (!r || !r.text || !r.text.trim()) return false;
        if ((r.rating || 0) < cfg.minRating) return false;
        if (cfg.lang !== 'all' && r.language &&
            String(r.language).toLowerCase() !== cfg.lang) return false;
        return true;
      });
      list.sort(function (a, b) {
        var ap = (a.photos && a.photos.length) ? 1 : 0;
        var bp = (b.photos && b.photos.length) ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return (b.text ? b.text.length : 0) - (a.text ? a.text.length : 0);
      });
      list = list.slice(0, cfg.limit);

      if (!list.length) { host.style.display = 'none'; return; }

      host.appendChild(buildHeader(data.place, cfg));
      host.appendChild(buildCarousel(list, cfg));
      host.appendChild(buildReviewBtn(cfg));
    });
  }

  /* --------------------------------------------------------- CTA tlacidlo --- */
  function buildReviewBtn(cfg) {
    var wrap = el('div', { class: 'lcdr-cta' });
    var href = LCD_GOOGLE_WRITE_URL;
    if (!href) return wrap;
    wrap.appendChild(el('a', {
      href: href, target: '_blank', rel: 'noopener noreferrer nofollow'
    }, [
      el('span', { html: ICON.write, 'aria-hidden': 'true' }),
      tr(cfg).writeReview
    ]));
    return wrap;
  }

  /* --------------------------------------------------------------- init --- */
  /* Shoptet uz na kazdej stranke nacitava Exo 2 aj Source Sans 3
     (cdn.myshoptet.com .../font-face/exo-2.css a source-sans-3.css, rezy 300-900
     vratane 600 a 700, ktore widget pouziva). Google Fonts by tie iste rodiny
     stiahol druhykrat (~157 kB) a po dotiahnuti prebil rezy na celej stranke.
     Google link sa preto vklada len tam, kde stranka tie rodiny nema
     (napr. samostatne demo widgetu). */
  function pageHasFonts() {
    var exo = false, ss3 = false;
    var links = document.querySelectorAll('link[href]');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].getAttribute('href') || '';
      if (/exo-2\.css|family=Exo\+2/i.test(h)) exo = true;
      if (/source-sans-3\.css|family=Source\+Sans\+3/i.test(h)) ss3 = true;
    }
    if (exo && ss3) return true;
    try {
      if (document.fonts && document.fonts.forEach) {
        document.fonts.forEach(function (f) {
          var fam = String(f.family || '').replace(/["']/g, '');
          if (fam === 'Exo 2') exo = true;
          if (fam === 'Source Sans 3') ss3 = true;
        });
      }
    } catch (e) { /* FontFaceSet nedostupny — ostane Google link */ }
    return exo && ss3;
  }

  function injectCss() {
    if (!document.getElementById('lcdr-fonts') && !pageHasFonts()) {
      var lf = document.createElement('link');
      lf.id = 'lcdr-fonts'; lf.rel = 'stylesheet';
      lf.href = 'https://fonts.googleapis.com/css2?family=Exo+2:wght@600;700;800&family=Source+Sans+3:wght@400;600;700&display=swap';
      (document.head || document.documentElement).appendChild(lf);
    }
    if (document.getElementById('lcdr-css')) return;
    var s = document.createElement('style');
    s.id = 'lcdr-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function initAll() {
    injectCss();
    var hosts = document.querySelectorAll('.lcd-reviews-widget');
    for (var i = 0; i < hosts.length; i++) renderWidget(hosts[i]);
  }

  /* Shoptet donačítava obsah cez AJAX (varianty, filtre) — sleduj nové widgety */
  function watchDom() {
    if (typeof MutationObserver !== 'function' || !document.body) return;
    var timer = null;
    new MutationObserver(function () {
      if (timer) return;
      timer = setTimeout(function () {
        timer = null;
        if (document.querySelector('.lcd-reviews-widget:not(.lcdr-ready)')) initAll();
      }, 300);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    initAll();
    watchDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* verejné API — dá sa zavolať window.LcdReviews.render() po vlastnom donačítaní */
  window.LcdReviews = { render: initAll };

})();
