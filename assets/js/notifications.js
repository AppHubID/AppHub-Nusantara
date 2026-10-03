/* ==========================================================================
   AppHub.ID — notifications.js
   Menampilkan catatan pembaruan (data/updates.json) dan menangani
   aksi kontak nyata. Tidak ada backend, tidak ada langganan palsu.
   ========================================================================== */

(function () {
  'use strict';

  var MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function getBasePath() {
    if (window.AppHub && window.AppHub.basePath) return window.AppHub.basePath;
    var meta = document.querySelector('meta[name="base-path"]');
    if (meta && meta.content) return meta.content;
    return window.location.pathname.indexOf('/pages/') !== -1 ? '../' : './';
  }

  function escapeHtml(value) {
    if (window.AppHub && window.AppHub.escapeHtml) {
      return window.AppHub.escapeHtml(value);
    }
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(isoString) {
    if (!isoString) return '';

    var parts = String(isoString).split('-');
    if (parts.length !== 3) return isoString;

    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);

    if (!year || !month || !day || month < 1 || month > 12) return isoString;

    return day + ' ' + MONTHS_ID[month - 1] + ' ' + year;
  }

  function renderItem(item, index, iconPath) {
    return '' +
      '<article class="update-item js-reveal" style="--d:' + (index * 0.05) + 's">' +
        '<div class="update-item__aside">' +
          '<span class="update-item__date">' +
            '<img class="icon icon--sm" src="' + iconPath + '" alt="" width="16" height="16" aria-hidden="true">' +
            '<time datetime="' + escapeHtml(item.tanggal) + '">' +
              escapeHtml(formatDate(item.tanggal)) +
            '</time>' +
          '</span>' +
          (item.kategori
            ? '<span class="update-item__tag">' + escapeHtml(item.kategori) + '</span>'
            : '') +
        '</div>' +
        '<div class="update-item__body">' +
          '<h3 class="update-item__title">' + escapeHtml(item.judul) + '</h3>' +
          '<p class="update-item__text">' + escapeHtml(item.isi) + '</p>' +
        '</div>' +
      '</article>';
  }

  function render(container, data) {
    var updates = data && Array.isArray(data.updates) ? data.updates : [];

    if (!updates.length) {
      container.innerHTML =
        '<p class="state">Belum ada pembaruan yang dipublikasikan saat ini.</p>';
      return;
    }

    var limitAttr = container.getAttribute('data-limit');
    var limit = limitAttr ? parseInt(limitAttr, 10) : 0;

    var sorted = updates.slice().sort(function (a, b) {
      return String(b.tanggal).localeCompare(String(a.tanggal));
    });

    var visible = (limit && limit > 0) ? sorted.slice(0, limit) : sorted;
    var iconPath = getBasePath() + 'assets/icons/bell.svg';

    container.innerHTML = visible.map(function (item, index) {
      return renderItem(item, index, iconPath);
    }).join('');

    container.setAttribute('data-updates-rendered', 'true');

    document.dispatchEvent(new CustomEvent('apphub:updates-rendered', {
      detail: { total: visible.length }
    }));
  }

  function showError(container) {
    container.innerHTML =
      '<p class="state state--error">' +
        'Catatan pembaruan belum dapat dimuat saat ini. ' +
        'Silakan muat ulang halaman atau hubungi ' +
        '<a href="mailto:apphubid@gmail.com">apphubid@gmail.com</a>.' +
      '</p>';
  }

  function initContainer(container) {
    if (container.getAttribute('data-updates-loading') === 'true') return;
    container.setAttribute('data-updates-loading', 'true');

    fetch(getBasePath() + 'data/updates.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!data || typeof data !== 'object') {
          throw new Error('Format data pembaruan tidak valid.');
        }
        render(container, data);
      })
      .catch(function (error) {
        console.warn('[AppHub] Gagal memuat updates.json:', error.message);
        showError(container);
      });
  }

  function initAll() {
    var containers = document.querySelectorAll('[data-updates]');
    Array.prototype.forEach.call(containers, initContainer);
  }

  function boot() {
    var ready = window.AppHub && window.AppHub.ready
      ? window.AppHub.ready
      : Promise.resolve();

    ready.then(initAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();