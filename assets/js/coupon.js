/* ==========================================================================
   AppHub.ID — coupon.js
   ========================================================================== */

(function () {
  'use strict';

  function renderCoupons(host, coupons) {
    if (!host || !Array.isArray(coupons)) return;
    host.innerHTML = coupons.map(function (c, i) {
      return '<article class="coupon-card reveal" style="--d:' + (i * 0.06) + 's">' +
        '<div class="coupon-card__ribbon">Contoh</div>' +
        '<div class="coupon-card__head">' +
          '<span class="coupon-card__discount">' + AppHub.escapeHtml(c.diskon) + '</span>' +
          '<span class="coupon-card__label">' + AppHub.escapeHtml(c.label) + '</span>' +
        '</div>' +
        '<p class="coupon-card__desc">' + AppHub.escapeHtml(c.deskripsi) + '</p>' +
        '<div class="coupon-card__code">' + AppHub.escapeHtml(c.kode) + '</div>' +
        '<div class="coupon-card__meta">' +
          '<span class="status-pill status-pill--planned">Tidak Aktif</span>' +
          '<span class="coupon-card__exp">Berlaku s.d. ' + AppHub.escapeHtml(c.berlakuSampai) + '</span>' +
        '</div>' +
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

  function init() {
    var gridHost = document.querySelector('[data-coupon-grid]');
    var stepsHost = document.querySelector('[data-coupon-steps]');
    if (!gridHost && !stepsHost) return;

    AppHub.fetchJSON('data/coupons.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data coupon tidak valid.');
        renderCoupons(gridHost, data.coupons);
        renderSteps(stepsHost, data.caraKerja);
      })
      .catch(function (err) {
        console.warn('[AppHub] coupons.json:', err.message);
        if (gridHost) AppHub.renderState(gridHost, 'error', 'Data Coupon Center belum dapat dimuat saat ini.');
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