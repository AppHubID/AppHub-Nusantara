/* ==========================================================================
   AppHub.ID — gift-code.js
   ========================================================================== */

(function () {
  'use strict';

  function renderBenefits(host, benefits) {
    if (!host || !Array.isArray(benefits)) return;
    host.innerHTML = benefits.map(function (b, i) {
      return '<article class="reward-card reveal" style="--d:' + (i * 0.06) + 's">' +
        '<span class="reward-card__icon">' +
          '<img class="icon icon--lg" src="' + AppHub.basePath + b.icon + '" alt="" width="22" height="22" aria-hidden="true">' +
        '</span>' +
        '<h3 class="reward-card__title">' + AppHub.escapeHtml(b.title) + '</h3>' +
        '<p class="reward-card__text">' + AppHub.escapeHtml(b.text) + '</p>' +
        '<span class="status-pill status-pill--planned">Contoh</span>' +
      '</article>';
    }).join('');
  }

  function renderFormat(host, code) {
    if (!host || !code) return;
    var v = host.querySelector('[data-gift-format-value]');
    if (v) v.textContent = code;
  }

  function init() {
    var benefitsHost = document.querySelector('[data-gift-benefits]');
    var formatHost = document.querySelector('[data-gift-format]');
    var input = document.querySelector('#giftCodeInput');
    var btn = document.querySelector('[data-gift-submit]');
    var result = document.querySelector('[data-gift-result]');

    if (!benefitsHost && !formatHost && !input) return;

    AppHub.fetchJSON('data/gift-codes.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data gift code tidak valid.');
        renderBenefits(benefitsHost, data.benefit);
        renderFormat(formatHost, data.contohFormat);
      })
      .catch(function (err) {
        console.warn('[AppHub] gift-codes.json:', err.message);
        if (benefitsHost) AppHub.renderState(benefitsHost, 'error', 'Data Gift Code belum dapat dimuat saat ini.');
      });

    if (btn && result) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        result.hidden = false;
        result.classList.add('verify-result--demo');
        var val = input && input.value ? input.value.trim() : '';
        if (!val) {
          result.textContent = 'Masukkan kode terlebih dahulu. Sistem Gift Code belum aktif, jadi tombol ini hanya simulasi.';
        } else {
          result.textContent = 'Simulasi: Gift Code "' + val + '" belum dapat divalidasi karena sistem Gift Code belum aktif.';
        }
      });
    }
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