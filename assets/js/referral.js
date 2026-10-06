/* ==========================================================================
   AppHub.ID — referral.js
   ========================================================================== */

(function () {
  'use strict';

  function renderStats(host, stats) {
    if (!host || !Array.isArray(stats)) return;
    host.innerHTML = stats.map(function (s, i) {
      return '<article class="stat-card reveal" style="--d:' + (i * 0.05) + 's">' +
        '<div class="stat-card__head">' +
          '<span class="stat-card__label">' + AppHub.escapeHtml(s.label) + '</span>' +
          '<img class="icon icon--sm" src="' + AppHub.basePath + s.icon + '" alt="" width="16" height="16" aria-hidden="true">' +
        '</div>' +
        '<span class="stat-card__value">' + AppHub.escapeHtml(s.value) + '</span>' +
        '<span class="stat-card__hint">' + AppHub.escapeHtml(s.hint || 'Contoh data') + '</span>' +
      '</article>';
    }).join('');
  }

  function renderSteps(host, steps) {
    if (!host || !Array.isArray(steps)) return;
    host.innerHTML = steps.map(function (s, i) {
      return '<article class="step reveal" style="--d:' + (i * 0.06) + 's">' +
        '<span class="step__number">' + AppHub.escapeHtml(s.number) + '</span>' +
        '<div class="step__body">' +
          '<h3 class="step__title">' + AppHub.escapeHtml(s.title) + '</h3>' +
          '<p class="step__text">' + AppHub.escapeHtml(s.text) + '</p>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function renderRewards(host, rewards) {
    if (!host || !Array.isArray(rewards)) return;
    host.innerHTML = rewards.map(function (r, i) {
      return '<article class="reward-card reveal" style="--d:' + (i * 0.06) + 's">' +
        '<span class="reward-card__icon">' +
          '<img class="icon icon--lg" src="' + AppHub.basePath + r.icon + '" alt="" width="22" height="22" aria-hidden="true">' +
        '</span>' +
        '<h3 class="reward-card__title">' + AppHub.escapeHtml(r.title) + '</h3>' +
        '<p class="reward-card__text">' + AppHub.escapeHtml(r.text) + '</p>' +
        '<span class="status-pill status-pill--planned">Contoh</span>' +
      '</article>';
    }).join('');
  }

  function renderCode(host, code) {
    if (!host || !code) return;
    var v = host.querySelector('[data-referral-code-value]');
    if (v) v.textContent = code;
  }

  function init() {
    var statsHost = document.querySelector('[data-referral-stats]');
    var stepsHost = document.querySelector('[data-referral-steps]');
    var rewardsHost = document.querySelector('[data-referral-rewards]');
    var codeHost = document.querySelector('[data-referral-code]');
    if (!statsHost && !stepsHost && !rewardsHost && !codeHost) return;

    AppHub.fetchJSON('data/referral.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data referral tidak valid.');
        renderStats(statsHost, data.stats);
        renderSteps(stepsHost, data.caraKerja);
        renderRewards(rewardsHost, data.rewards);
        renderCode(codeHost, data.contohKode);
      })
      .catch(function (err) {
        console.warn('[AppHub] referral.json:', err.message);
        if (statsHost) AppHub.renderState(statsHost, 'error', 'Data referral belum dapat dimuat saat ini.');
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