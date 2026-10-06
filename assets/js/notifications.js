/* ==========================================================================
   AppHub.ID — notifications.js
   Memuat data/updates.json dan merender daftar pembaruan ke elemen
   [data-updates]. Mendukung:
   - sortir otomatis (tanggal terbaru di atas, tie-break by id)
   - limit jumlah item lewat atribut data-limit
   - format tanggal Indonesia (contoh: 6 Oktober 2026)
   - loading / empty / error state
   ========================================================================== */

(function () {
  'use strict';

  var MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  var loaded = false;

  /* ----------------------------------------------------------------------
     Helper base path — mendukung halaman di root maupun di /pages/
     ---------------------------------------------------------------------- */
  function getBasePath() {
    if (window.AppHub && window.AppHub.basePath) return window.AppHub.basePath;
    var meta = document.querySelector('meta[name="base-path"]');
    if (meta && meta.content) return meta.content;
    var p = window.location.pathname;
    if (p.indexOf('/pages/') !== -1 || p.indexOf('/subscription/') !== -1) return '../';
    return './';
  }

  /* ----------------------------------------------------------------------
     Helper escape HTML
     ---------------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------------
     Format tanggal "2026-10-06" → "6 Oktober 2026"
     Aman terhadap nilai yang tidak valid: kembalikan string asli.
     ---------------------------------------------------------------------- */
  function formatDate(iso) {
    if (!iso) return '';
    var parts = String(iso).split('-');
    if (parts.length !== 3) return iso;

    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);

    if (!year || !month || !day || month < 1 || month > 12) return iso;
    if (day < 1 || day > 31) return iso;

    return day + ' ' + MONTHS_ID[month - 1] + ' ' + year;
  }

  /* ----------------------------------------------------------------------
     Sortir: tanggal DESC, lalu id DESC sebagai tie-break
     ---------------------------------------------------------------------- */
  function sortUpdates(list) {
    return list.slice().sort(function (a, b) {
      var dateCompare = String(b.tanggal || '').localeCompare(String(a.tanggal || ''));
      if (dateCompare !== 0) return dateCompare;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }

  /* ----------------------------------------------------------------------
     Render satu item update
     ---------------------------------------------------------------------- */
  function renderItem(item, idx, iconPath) {
    var kategoriHtml = item.kategori
      ? '<span class="update-item__tag">' + escapeHtml(item.kategori) + '</span>'
      : '';

    return '' +
      '<article class="update-item js-reveal" style="--d:' + (idx * 0.05) + 's">' +
        '<div class="update-item__aside">' +
          '<span class="update-item__date">' +
            '<img class="icon icon--sm" src="' + iconPath + '" alt="" width="16" height="16" aria-hidden="true">' +
            '<time datetime="' + escapeHtml(item.tanggal || '') + '">' +
              escapeHtml(formatDate(item.tanggal)) +
            '</time>' +
          '</span>' +
          kategoriHtml +
        '</div>' +
        '<div class="update-item__body">' +
          '<h3 class="update-item__title">' + escapeHtml(item.judul || 'Tanpa judul') + '</h3>' +
          '<p class="update-item__text">' + escapeHtml(item.isi || '') + '</p>' +
        '</div>' +
      '</article>';
  }

  /* ----------------------------------------------------------------------
     Render daftar update ke container
     ---------------------------------------------------------------------- */
  function render(container, data) {
    var list = (data && Array.isArray(data.updates)) ? data.updates : [];

    if (!list.length) {
      container.innerHTML = '<p class="state">Belum ada pembaruan yang dipublikasikan saat ini.</p>';
      return;
    }

    var limitAttr = container.getAttribute('data-limit');
    var limit = limitAttr ? parseInt(limitAttr, 10) : 0;

    var sorted = sortUpdates(list);
    var visible = (limit && limit > 0) ? sorted.slice(0, limit) : sorted;

    var iconPath = getBasePath() + 'assets/icons/bell.svg';

    container.innerHTML = visible.map(function (item, i) {
      return renderItem(item, i, iconPath);
    }).join('');

    container.setAttribute('data-updates-rendered', 'true');
    container.setAttribute('data-updates-count', String(visible.length));

    document.dispatchEvent(new CustomEvent('apphub:updates-rendered', {
      detail: { total: visible.length, source: 'notifications.js' }
    }));
  }

  /* ----------------------------------------------------------------------
     Error state
     ---------------------------------------------------------------------- */
  function showError(container) {
    container.innerHTML =
      '<p class="state state--error">' +
        'Catatan pembaruan belum dapat dimuat saat ini. ' +
        'Silakan muat ulang halaman atau hubungi ' +
        '<a href="mailto:apphubid@gmail.com">apphubid@gmail.com</a>.' +
      '</p>';
  }

  /* ----------------------------------------------------------------------
     Inisialisasi per container
     ---------------------------------------------------------------------- */
  function initContainer(container) {
    if (!container || container.getAttribute('data-updates-loading') === 'true') return;
    container.setAttribute('data-updates-loading', 'true');

    var url = getBasePath() + 'data/updates.json';

    fetch(url, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ' untuk ' + url);
        }
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
    loaded = true;
  }

  /* ----------------------------------------------------------------------
     Boot — tunggu AppHub.ready bila tersedia
     ---------------------------------------------------------------------- */
  function boot() {
    if (loaded) return;
    var ready = (window.AppHub && window.AppHub.ready)
      ? window.AppHub.ready
      : Promise.resolve();

    ready.then(function () {
      initAll();
      console.info('[AppHub] Modul pembaruan (notifications.js) siap.');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
