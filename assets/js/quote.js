/* =========================================================
   AppHub.ID — quote.js
   ========================================================= */
(function () {
  'use strict';

  var ROTATE_MS = 1000;
  var timer = null;
  var quotes = [];
  var currentIndex = -1;
  var previewEls = [];
  var manualBtn = null;

  var FALLBACK = [
    { text: 'Kesuksesan bukan tentang seberapa cepat, tetapi seberapa konsisten.', author: 'Inspirasi AppHub.ID', category: 'Konsistensi' },
    { text: 'Fondasi yang kuat membuat bangunan tinggi tetap berdiri.', author: 'Inspirasi AppHub.ID', category: 'Motivasi' },
    { text: 'Berhenti sejenak bukan berarti berhenti berjalan.', author: 'Inspirasi AppHub.ID', category: 'Motivasi' },
    { text: 'Kualitas lahir dari perhatian pada detail kecil.', author: 'Inspirasi AppHub.ID', category: 'Kualitas' },
    { text: 'Belajar dari kegagalan lebih berharga dari merayakan keberhasilan.', author: 'Inspirasi AppHub.ID', category: 'Pembelajaran' }
  ];

  function getBasePath() {
    if (window.AppHub && window.AppHub.basePath) return window.AppHub.basePath;
    var meta = document.querySelector('meta[name="base-path"]');
    return meta && meta.content ? meta.content : './';
  }

  function pickNextIndex() {
    if (quotes.length <= 1) return 0;
    var next = currentIndex;
    var safety = 0;
    while ((next === currentIndex || next === -1) && safety < 12) {
      next = Math.floor(Math.random() * quotes.length);
      safety++;
    }
    return next;
  }

  function setTransitionState(el, on) {
    if (!el) return;
    el.classList.toggle('is-transitioning', !!on);
  }

  function applyQuote(q, el) {
    if (!q || !el) return;
    var textEl = el.querySelector('[data-quote-text]');
    var authorEl = el.querySelector('[data-quote-author]');
    var catEl = el.querySelector('[data-quote-category]');
    if (textEl) textEl.textContent = '“' + (q.text || '') + '”';
    if (authorEl) authorEl.textContent = q.author ? '— ' + q.author : '';
    if (catEl) {
      if (q.category) { catEl.textContent = q.category; catEl.hidden = false; }
      else catEl.hidden = true;
    }
  }

  function renderQuote() {
    if (!quotes.length) return;
    currentIndex = pickNextIndex();
    var q = quotes[currentIndex];

    previewEls.forEach(function (el) {
      setTransitionState(el, true);
      setTimeout(function () {
        applyQuote(q, el);
        setTransitionState(el, false);
      }, 180);
    });
  }

  function startRotation() {
    if (timer) return;
    timer = setInterval(renderQuote, ROTATE_MS);
  }

  function stopRotation() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function handleVisibility() {
    if (document.hidden) stopRotation();
    else startRotation();
  }

  function setupManualButton() {
    manualBtn = document.querySelector('[data-quote-next]');
    if (!manualBtn) return;
    manualBtn.addEventListener('click', function (e) {
      e.preventDefault();
      renderQuote();
      stopRotation();
      startRotation();
    });
  }

  function normalizeQuotes(data) {
    if (!data) return [];
    var list = Array.isArray(data) ? data : (Array.isArray(data.quotes) ? data.quotes : []);
    return list.filter(function (q) {
      return q && typeof q.text === 'string' && q.text.trim().length > 0;
    }).map(function (q) {
      return {
        text: q.text.trim(),
        author: q.author && String(q.author).trim() ? String(q.author).trim() : '',
        category: q.category && String(q.category).trim() ? String(q.category).trim() : ''
      };
    });
  }

  function boot() {
    previewEls = Array.prototype.slice.call(document.querySelectorAll('[data-quote-preview], [data-quote-full]'));
    if (!previewEls.length) return;

    var url = getBasePath() + 'data/quotes.json';

    fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url);
        return r.json();
      })
      .then(function (data) {
        quotes = normalizeQuotes(data);
        if (!quotes.length) throw new Error('Daftar kutipan kosong.');
      })
      .catch(function (err) {
        console.warn('[AppHub] Gagal memuat quotes.json, memakai fallback:', err.message);
        quotes = FALLBACK;
      })
      .then(function () {
        setupManualButton();
        renderQuote();
        startRotation();
        document.addEventListener('visibilitychange', handleVisibility);
      });
  }

  window.addEventListener('pagehide', function () {
    stopRotation();
    document.removeEventListener('visibilitychange', handleVisibility);
  });

  var ready = (window.AppHub && window.AppHub.ready) ? window.AppHub.ready : Promise.resolve();
  ready.then(boot);
})();