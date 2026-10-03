/* ==========================================================================
   AppHub.ID — roadmap.js
   Memuat data/roadmap.json dan merendernya ke elemen [data-roadmap].
   ========================================================================== */

(function () {
  'use strict';

  function getBasePath() {
    if (window.AppHub && window.AppHub.basePath) return window.AppHub.basePath;
    var meta = document.querySelector('meta[name="base-path"]');
    if (meta && meta.content) return meta.content;
    var p = window.location.pathname;
    return (p.indexOf('/pages/') !== -1 || p.indexOf('/subscription/') !== -1) ? '../' : './';
  }

  function escapeHtml(value) {
    if (window.AppHub && window.AppHub.escapeHtml) return window.AppHub.escapeHtml(value);
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function statusClass(status) {
    var n = String(status || '').toLowerCase();
    if (n.indexOf('berjalan') !== -1 || n.indexOf('sedang') !== -1) return 'status-pill--active';
    if (n.indexOf('segera') !== -1) return 'status-pill--soon';
    return 'status-pill--planned';
  }

  function showError(container, message) {
    container.innerHTML =
      '<p class="state state--error">' + escapeHtml(message) +
      ' Silakan muat ulang halaman atau hubungi ' +
      '<a href="mailto:apphubid@gmail.com">apphubid@gmail.com</a>.</p>';
  }

  function renderPhase(phase, index, iconPath) {
    var points = Array.isArray(phase.poin) ? phase.poin : [];
    var listHtml = points.map(function (point) {
      return '<li>' +
        '<img class="icon icon--sm" src="' + iconPath + '" alt="" width="16" height="16" aria-hidden="true">' +
        '<span>' + escapeHtml(point) + '</span>' +
      '</li>';
    }).join('');

    return '' +
      '<article class="roadmap__item js-reveal" style="--d:' + (index * 0.06) + 's">' +
        '<div class="roadmap__top">' +
          '<span class="roadmap__phase">Fase ' + escapeHtml(phase.fase || (index + 1)) + '</span>' +
          '<span class="status-pill ' + statusClass(phase.status) + '">' +
            escapeHtml(phase.status || 'Direncanakan') +
          '</span>' +
        '</div>' +
        '<h3 class="roadmap__title">' + escapeHtml(phase.nama) + '</h3>' +
        '<p class="roadmap__desc">' + escapeHtml(phase.deskripsi) + '</p>' +
        (listHtml ? '<ul class="roadmap__list">' + listHtml + '</ul>' : '') +
      '</article>';
  }

  function render(container, data) {
    var phases = data && Array.isArray(data.phases) ? data.phases : [];
    if (!phases.length) {
      container.innerHTML = '<p class="state">Belum ada data roadmap yang dapat ditampilkan.</p>';
      return;
    }

    var limitAttr = container.getAttribute('data-limit');
    var limit = limitAttr ? parseInt(limitAttr, 10) : 0;
    var visible = (limit && limit > 0) ? phases.slice(0, limit) : phases;
    var iconPath = getBasePath() + 'assets/icons/check.svg';

    container.innerHTML = visible.map(function (phase, index) {
      return renderPhase(phase, index, iconPath);
    }).join('');

    container.setAttribute('data-roadmap-rendered', 'true');
    document.dispatchEvent(new CustomEvent('apphub:roadmap-rendered', {
      detail: { total: visible.length }
    }));
  }

  function initContainer(container) {
    if (container.getAttribute('data-roadmap-loading') === 'true') return;
    container.setAttribute('data-roadmap-loading', 'true');

    fetch(getBasePath() + 'data/roadmap.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data roadmap tidak valid.');
        render(container, data);
      })
      .catch(function (error) {
        console.warn('[AppHub] Gagal memuat roadmap.json:', error.message);
        showError(container, 'Data roadmap belum dapat dimuat saat ini.');
      });
  }

  function initAll() {
    var containers = document.querySelectorAll('[data-roadmap]');
    Array.prototype.forEach.call(containers, initContainer);
  }

  function boot() {
    var ready = window.AppHub && window.AppHub.ready ? window.AppHub.ready : Promise.resolve();
    ready.then(initAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
