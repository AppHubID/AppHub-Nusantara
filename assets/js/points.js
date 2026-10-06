/* ==========================================================================
   AppHub.ID — points.js
   ========================================================================== */

(function () {
  'use strict';

  function renderUses(host, uses) {
    if (!host || !Array.isArray(uses)) return;
    host.innerHTML = uses.map(function (u, i) {
      return '<article class="about-card reveal" style="--d:' + (i * 0.06) + 's">' +
        '<h3 class="about-card__title">' + AppHub.escapeHtml(u.title) + '</h3>' +
        '<p class="about-card__text">' + AppHub.escapeHtml(u.text) + '</p>' +
      '</article>';
    }).join('');
  }

  function renderEarn(host, items) {
    if (!host || !Array.isArray(items)) return;
    host.innerHTML = items.map(function (e, i) {
      return '<article class="step reveal" style="--d:' + (i * 0.06) + 's">' +
        '<span class="step__number">' +
          '<img class="icon icon--sm" src="' + AppHub.basePath + e.icon + '" alt="" width="18" height="18" aria-hidden="true">' +
        '</span>' +
        '<div class="step__body">' +
          '<h3 class="step__title">' + AppHub.escapeHtml(e.title) + '</h3>' +
          '<p class="step__text">' + AppHub.escapeHtml(e.text) + '</p>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderExamples(host, items) {
    if (!host || !Array.isArray(items)) return;
    host.innerHTML = items.map(function (s, i) {
      return '<article class="stat-card reveal" style="--d:' + (i * 0.05) + 's">' +
        '<div class="stat-card__head">' +
          '<span class="stat-card__label">' + AppHub.escapeHtml(s.label) + '</span>' +
          '<img class="icon icon--sm" src="' + AppHub.basePath + s.icon + '" alt="" width="16" height="16" aria-hidden="true">' +
        '</div>' +
        '<span class="stat-card__value">' + AppHub.escapeHtml(s.value) + '</span>' +
        '<span class="stat-card__hint">' + AppHub.escapeHtml(s.hint || 'Contoh penggunaan') + '</span>' +
      '</article>';
    }).join('');
  }

  function init() {
    var usesHost = document.querySelector('[data-points-uses]');
    var earnHost = document.querySelector('[data-points-earn]');
    var exHost = document.querySelector('[data-points-examples]');
    if (!usesHost && !earnHost && !exHost) return;

    AppHub.fetchJSON('data/points.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data points tidak valid.');
        renderUses(usesHost, data.kegunaan);
        renderEarn(earnHost, data.caraMemperoleh);
        renderExamples(exHost, data.contohPenggunaan);
      })
      .catch(function (err) {
        console.warn('[AppHub] points.json:', err.message);
        if (usesHost) AppHub.renderState(usesHost, 'error', 'Data AppHub Points belum dapat dimuat saat ini.');
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