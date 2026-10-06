/* ==========================================================================
   AppHub.ID — security.js
   ========================================================================== */

(function () {
  'use strict';

  function renderFeatures(host, features) {
    if (!host || !Array.isArray(features)) return;
    host.innerHTML = features.map(function (f, i) {
      return '<article class="security-item reveal" style="--d:' + (i * 0.05) + 's">' +
        '<span class="security-item__icon">' +
          '<img class="icon icon--lg" src="' + AppHub.basePath + f.icon + '" alt="" width="22" height="22" aria-hidden="true">' +
        '</span>' +
        '<h3 class="security-item__title">' + AppHub.escapeHtml(f.title) + '</h3>' +
        '<p class="security-item__text">' + AppHub.escapeHtml(f.text) + '</p>' +
        '<span class="status-pill status-pill--planned">Rencana</span>' +
      '</article>';
    }).join('');
  }

  function renderStats(host, stats) {
    if (!host || !Array.isArray(stats)) return;
    host.innerHTML = stats.map(function (s, i) {
      return '<article class="stat-card reveal" style="--d:' + (i * 0.05) + 's">' +
        '<div class="stat-card__head">' +
          '<span class="stat-card__label">' + AppHub.escapeHtml(s.label) + '</span>' +
          '<img class="icon icon--sm" src="' + AppHub.basePath + s.icon + '" alt="" width="16" height="16" aria-hidden="true">' +
        '</div>' +
        '<span class="stat-card__value">' + AppHub.escapeHtml(s.value) + '</span>' +
        '<span class="stat-card__hint">' + AppHub.escapeHtml(s.hint || 'Contoh tampilan') + '</span>' +
      '</article>';
    }).join('');
  }

  function init() {
    var featuresHost = document.querySelector('[data-security-features]');
    var statsHost = document.querySelector('[data-security-stats]');
    if (!featuresHost && !statsHost) return;

    AppHub.fetchJSON('data/security.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data security tidak valid.');
        renderFeatures(featuresHost, data.fitur);
        renderStats(statsHost, data.stats);
      })
      .catch(function (err) {
        console.warn('[AppHub] security.json:', err.message);
        if (featuresHost) AppHub.renderState(featuresHost, 'error', 'Data Security Center belum dapat dimuat saat ini.');
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