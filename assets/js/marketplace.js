/* ==========================================================================
   AppHub.ID — marketplace.js
   Render preview Marketplace dari data/marketplace.json.
   ========================================================================== */

(function () {
  'use strict';

  function renderCategories(container, cats) {
    if (!Array.isArray(cats) || !cats.length) return;
    container.innerHTML = cats.map(function (c, i) {
      return '<span class="chip' + (i === 0 ? ' chip--active' : '') + '">' + AppHub.escapeHtml(c.nama) + '</span>';
    }).join('');
  }

  function renderGrid(grid, items) {
    if (!Array.isArray(items) || !items.length) {
      AppHub.renderState(grid, 'empty', 'Belum ada produk yang dapat ditampilkan pada preview ini.');
      return;
    }
    grid.innerHTML = items.map(function (item, i) {
      return '<article class="placeholder-card js-reveal" style="--d:' + (i * 0.05) + 's">' +
        '<div class="placeholder-card__media">' +
          '<img class="icon icon--xl" src="' + AppHub.basePath + item.icon + '" alt="" width="40" height="40" aria-hidden="true">' +
        '</div>' +
        '<div class="placeholder-card__body">' +
          '<span class="placeholder-card__line placeholder-card__line--title"></span>' +
          '<span class="placeholder-card__line"></span>' +
          '<span class="placeholder-card__line placeholder-card__line--short"></span>' +
        '</div>' +
        '<div class="placeholder-card__foot">' +
          '<span class="status-pill ' + (item.status === 'Segera Hadir' ? 'status-pill--soon' : 'status-pill--planned') + '">' +
            AppHub.escapeHtml(item.status || 'Menunggu') +
          '</span>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderNotes(container, notes) {
    if (!container || !Array.isArray(notes)) return;
    container.innerHTML = notes.map(function (n) {
      return '<li>' +
        '<img class="icon icon--sm" src="' + AppHub.basePath + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true">' +
        '<span>' + AppHub.escapeHtml(n) + '</span>' +
      '</li>';
    }).join('');
  }

  function init() {
    var chips = document.querySelector('[data-market-categories]');
    var grid = document.querySelector('[data-market-grid]');
    var notes = document.querySelector('[data-market-notes]');
    if (!grid && !chips && !notes) return;

    AppHub.fetchJSON('data/marketplace.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data marketplace tidak valid.');
        if (chips && data.kategori) renderCategories(chips, data.kategori);
        if (grid && data.preview) renderGrid(grid, data.preview);
        if (notes && data.catatan) renderNotes(notes, data.catatan);
      })
      .catch(function (err) {
        console.warn('[AppHub] marketplace.json:', err.message);
        if (grid) AppHub.renderState(grid, 'error', 'Data marketplace belum dapat dimuat saat ini.');
      });
  }

  function boot() {
    var ready = window.AppHub && window.AppHub.ready ? window.AppHub.ready : Promise.resolve();
    ready.then(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();