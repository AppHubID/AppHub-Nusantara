/* ==========================================================================
   AppHub.ID — verification.js
   ========================================================================== */

(function () {
  'use strict';

  function renderIdentity(host, list) {
    if (!host || !Array.isArray(list)) return;
    host.innerHTML = list.map(function (item) {
      return '<li>' +
        '<img class="icon icon--sm" src="' + AppHub.basePath + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true">' +
        '<span>' + item + '</span>' +
      '</li>';
    }).join('');
  }

  function renderTips(host, tips) {
    if (!host || !Array.isArray(tips)) return;
    host.innerHTML = tips.map(function (t, i) {
      return '<article class="about-card reveal" style="--d:' + (i * 0.06) + 's">' +
        '<h3 class="about-card__title">' + AppHub.escapeHtml(t.title) + '</h3>' +
        '<p class="about-card__text">' + AppHub.escapeHtml(t.text) + '</p>' +
      '</article>';
    }).join('');
  }

  function init() {
    var idHost = document.querySelector('[data-verify-identity]');
    var tipsHost = document.querySelector('[data-verify-tips]');
    var input = document.querySelector('#verifyCode');
    var btn = document.querySelector('[data-verify-submit]');
    var result = document.querySelector('[data-verify-result]');

    if (!idHost && !tipsHost && !input) return;

    AppHub.fetchJSON('data/verification.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data verifikasi tidak valid.');
        renderIdentity(idHost, data.identitasResmi);
        renderTips(tipsHost, data.tips);
      })
      .catch(function (err) {
        console.warn('[AppHub] verification.json:', err.message);
        if (idHost) AppHub.renderState(idHost, 'error', 'Data verifikasi belum dapat dimuat saat ini.');
      });

    if (btn && result) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        result.hidden = false;
        result.classList.add('verify-result--demo');
        var v = input && input.value ? input.value.trim() : '';
        if (!v) {
          result.textContent = 'Masukkan kode verifikasi terlebih dahulu. Sistem verifikasi belum aktif.';
        } else {
          result.textContent = 'Demo verification: kode "' + v + '" tidak dapat diverifikasi karena sistem backend belum tersedia. Fitur verifikasi resmi akan hadir setelah backend AppHub.ID aktif.';
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