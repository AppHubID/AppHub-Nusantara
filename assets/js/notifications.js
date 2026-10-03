/* ==========================================================================
   AppHub.ID — notifications.js
   Interaksi kontak & notifikasi ringan (toast). Tanpa backend.
   ========================================================================== */

(function () {
  'use strict';

  var BASE = (window.AppHub && window.AppHub.base) || '';

  var CONTACT = {
    whatsapp: 'https://wa.me/6288970200455',
    gmail: 'mailto:apphubid@gmail.com'
  };

  /* ---------------------------------------------------------------------
     Toast
     --------------------------------------------------------------------- */

  function toastStack() {
    var stack = document.getElementById('toastStack');
    if (stack) return stack;

    stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-atomic', 'true');
    document.body.appendChild(stack);
    return stack;
  }

  function showToast(message) {
    var stack = toastStack();
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');

    el.innerHTML =
      '<img src="' + BASE + 'assets/icons/bell.svg" alt="" width="16" height="16">' +
      '<span>' + String(message) + '</span>';

    stack.appendChild(el);

    window.setTimeout(function () {
      el.classList.add('is-leaving');
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 260);
    }, 3200);
  }

  window.AppHub = window.AppHub || {};
  window.AppHub.toast = showToast;

  /* ---------------------------------------------------------------------
     Copy to clipboard
     --------------------------------------------------------------------- */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      try {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /* ---------------------------------------------------------------------
     Kontak
     --------------------------------------------------------------------- */

  function initContactActions() {
    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-copy]');
      if (!trigger) return;

      event.preventDefault();
      var value = trigger.getAttribute('data-copy');

      copyText(value).then(function () {
        showToast('Disalin: ' + value);
      }).catch(function () {
        showToast('Tidak dapat menyalin otomatis. Nilai: ' + value);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Promo (dicek di sisi browser, tanpa backend)
     --------------------------------------------------------------------- */

  var PROMO_END = new Date('2026-11-30T23:59:59+07:00').getTime();

  function isPromoActive() {
    return Date.now() <= PROMO_END;
  }

  function initPromoBanner() {
    var banners = document.querySelectorAll('[data-promo-banner]');
    if (!banners.length) return;

    var active = isPromoActive();

    Array.prototype.forEach.call(banners, function (banner) {
      if (active) {
        banner.classList.remove('is-expired');
        banner.innerHTML =
          '<img src="' + BASE + 'assets/icons/gift.svg" alt="" width="18" height="18">' +
          '<span>Harga promo tersedia hingga <strong>30 November 2026</strong>. ' +
          'Setelah tanggal tersebut, harga normal berlaku.</span>';
      } else {
        banner.classList.add('is-expired');
        banner.innerHTML =
          '<img src="' + BASE + 'assets/icons/clock.svg" alt="" width="18" height="18">' +
          '<span>Periode harga promo telah berakhir pada <strong>30 November 2026</strong>. ' +
          'Harga yang berlaku adalah harga normal.</span>';
      }
    });

    document.querySelectorAll('[data-promo-price]').forEach(function (el) {
      el.hidden = !active;
    });

    document.querySelectorAll('[data-normal-price-note]').forEach(function (el) {
      el.hidden = active;
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */

  function init() {
    initContactActions();
    initPromoBanner();
  }

  if (window.AppHub && window.AppHub.ready) {
    init();
  } else {
    document.addEventListener('apphub:ready', init);
  }

  window.AppHub.contact = CONTACT;
  window.AppHub.isPromoActive = isPromoActive;
})();
