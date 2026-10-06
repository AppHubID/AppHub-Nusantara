/* ==========================================================================
   AppHub.ID — roadmap.js
   ========================================================================== */

(function () {
  'use strict';

  function statusClass(s) {
    var n = String(s || '').toLowerCase();
    if (n.indexOf('berjalan') !== -1 || n.indexOf('sedang') !== -1) return 'status-pill--active';
    if (n.indexOf('segera') !== -1) return 'status-pill--soon';
    return 'status-pill--planned';
  }

  function renderPhase(phase, idx, iconPath) {
    var pts = Array.isArray(phase.poin) ? phase.poin : [];
    var list = pts.map(function (p) {
      return '<li>' +
        '<img class="icon icon--sm" src="' + iconPath + '" alt="" width="16" height="16" aria-hidden="true">' +
        '<span>' + AppHub.escapeHtml(p) + '</span>' +
      '</li>';
    }).join('');

    return '<article class="roadmap__item js-reveal" style="--d:' + (idx * 0.06) + 's">' +
      '<div class="roadmap__top">' +
        '<span class="roadmap__phase">Fase ' + AppHub.escapeHtml(phase.fase || (idx + 1)) + '</span>' +
        '<span class="status-pill ' + statusClass(phase.status) + '">' +
          AppHub.escapeHtml(phase.status || 'Direncanakan') +
        '</span>' +
      '</div>' +
      '<h3 class="roadmap__title">' + AppHub.escapeHtml(phase.nama) + '</h3>' +
      '<p class="roadmap__desc">' + AppHub.escapeHtml(phase.deskripsi) + '</p>' +
      (list ? '<ul class="roadmap__list">' + list + '</ul>' : '') +
    '</article>';
  }

  function render(container, data) {
    var phases = data && Array.isArray(data.phases) ? data.phases : [];
    if (!phases.length) {
      AppHub.renderState(container, 'empty', 'Belum ada data roadmap yang dapat ditampilkan.');
      return;
    }
    var limitAttr = container.getAttribute('data-limit');
    var limit = limitAttr ? parseInt(limitAttr, 10) : 0;
    var visible = (limit && limit > 0) ? phases.slice(0, limit) : phases;
    var iconPath = AppHub.basePath + 'assets/icons/check.svg';

    container.innerHTML = visible.map(function (p, i) {
      return renderPhase(p, i, iconPath);
    }).join('');
    container.setAttribute('data-roadmap-rendered', 'true');
  }

  function initContainer(container) {
    if (container.getAttribute('data-roadmap-loading') === 'true') return;
    container.setAttribute('data-roadmap-loading', 'true');

    AppHub.fetchJSON('data/roadmap.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data roadmap tidak valid.');
        render(container, data);
      })
      .catch(function (err) {
        console.warn('[AppHub] roadmap.json:', err.message);
        AppHub.renderState(container, 'error', 'Data roadmap belum dapat dimuat saat ini.');
      });
  }

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-roadmap]'), initContainer);
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
