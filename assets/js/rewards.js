/* ==========================================================================
   AppHub.ID — rewards.js
   ========================================================================== */

(function () {
  'use strict';

  function renderRewards(host, items) {
    if (!host || !Array.isArray(items)) return;
    host.innerHTML = items.map(function (r, i) {
      return '<article class="reward-card reveal" style="--d:' + (i * 0.05) + 's">' +
        '<span class="reward-card__icon">' +
          '<img class="icon icon--lg" src="' + AppHub.basePath + r.icon + '" alt="" width="22" height="22" aria-hidden="true">' +
        '</span>' +
        '<h3 class="reward-card__title">' + AppHub.escapeHtml(r.title) + '</h3>' +
        '<p class="reward-card__text">' + AppHub.escapeHtml(r.text) + '</p>' +
        '<div class="reward-card__meta">' +
          '<span class="status-pill status-pill--planned">Contoh</span>' +
          '<span class="reward-card__cost">' + AppHub.escapeHtml(r.cost) + '</span>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function init() {
    var host = document.querySelector('[data-rewards-grid]');
    if (!host) return;

    AppHub.fetchJSON('data/rewards.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data rewards tidak valid.');
        renderRewards(host, data.rewards);
      })
      .catch(function (err) {
        console.warn('[AppHub] rewards.json:', err.message);
        AppHub.renderState(host, 'error', 'Data Reward Center belum dapat dimuat saat ini.');
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