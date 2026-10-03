/* ==========================================================================
   AppHub.ID — roadmap.js
   Memuat data/roadmap.json dan merender roadmap (preview & lengkap).
   ========================================================================== */

(function () {
  'use strict';

  var BASE = (window.AppHub && window.AppHub.base) || '';
  var ROADMAP_URL = BASE + 'data/roadmap.json';

  var STATE_LABEL = {
    done: 'Selesai',
    active: 'Sedang Berjalan',
    planned: 'Direncanakan'
  };

  function escapeHtml(value) {
    if (window.AppHub && typeof window.AppHub.escapeHtml === 'function') {
      return window.AppHub.escapeHtml(value);
    }
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function statusPill(state) {
    var label = STATE_LABEL[state] || STATE_LABEL.planned;
    var dataStatus = state === 'done' ? 'Segera Hadir' :
                     state === 'active' ? 'Sedang Dipersiapkan' : 'Direncanakan';
    return '<span class="status" data-status="' + dataStatus + '">' +
      '<span class="status-dot" aria-hidden="true"></span>' + escapeHtml(label) + '</span>';
  }

  function itemMarkup(item, index) {
    var points = Array.isArray(item.points) ? item.points : [];
    var state = item.state || 'planned';

    var pointsMarkup = points.map(function (point) {
      return '<li><img src="' + BASE + 'assets/icons/check.svg" alt="" width="15" height="15">' +
        '<span>' + escapeHtml(point) + '</span></li>';
    }).join('');

    return '' +
      '<article class="roadmap-item" data-state="' + escapeHtml(state) + '">' +
        '<div class="roadmap-marker" aria-hidden="true">' + String(index + 1).padStart(2, '0') + '</div>' +
        '<div class="roadmap-body">' +
          '<div class="roadmap-head">' +
            '<h3 class="roadmap-phase">' + escapeHtml(item.phase) + '</h3>' +
            statusPill(state) +
          '</div>' +
          '<p class="roadmap-desc">' + escapeHtml(item.description) + '</p>' +
          (pointsMarkup ? '<ul class="roadmap-points">' + pointsMarkup + '</ul>' : '') +
        '</div>' +
      '</article>';
  }

  function render(container, items, limit) {
    var list = limit ? items.slice(0, limit) : items;

    if (!list.length) {
      container.innerHTML = '<p class="state-msg">Data roadmap belum tersedia.</p>';
      return;
    }

    container.innerHTML = list.map(itemMarkup).join('');
    container.classList.add('stagger');

    if (window.AppHub && typeof window.AppHub.observeReveal === 'function') {
      window.AppHub.observeReveal(container);
    }
  }

  function init() {
    var preview = document.querySelector('[data-roadmap="preview"]');
    var full = document.querySelector('[data-roadmap="full"]');

    if (!preview && !full) return;

    fetch(ROADMAP_URL, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var items = (data && data.phases) || [];

        if (preview) render(preview, items, 3);
        if (full) render(full, items, 0);
      })
      .catch(function (err) {
        console.warn('[AppHub] Gagal memuat roadmap:', err.message);

        var message = '<p class="state-msg">Data roadmap belum dapat dimuat saat ini. ' +
          'Silakan muat ulang halaman.</p>';

        if (preview) preview.innerHTML = message;
        if (full) full.innerHTML = message;
      });
  }

  if (window.AppHub && window.AppHub.ready) {
    init();
  } else {
    document.addEventListener('apphub:ready', init);
  }
})();
