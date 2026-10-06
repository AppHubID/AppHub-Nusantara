/* ==========================================================================
   AppHub.ID — version.js
   ========================================================================== */

(function () {
  'use strict';

  function renderCurrent(host, current) {
    if (!host || !current) return;
    host.innerHTML =
      '<div class="version-card__head">' +
        '<span class="version-card__icon">' +
          '<img class="icon icon--lg" src="' + AppHub.basePath + 'assets/icons/verified-badge.svg" alt="" width="24" height="24" aria-hidden="true">' +
        '</span>' +
        '<div class="version-card__brand">' +
          '<span class="version-card__brand-name">' + AppHub.escapeHtml(current.brand || 'AppHub.ID') +
            '<img class="verified-badge verified-badge--inline" src="' + AppHub.basePath + 'assets/icons/verified-badge.svg" alt="Terverifikasi" width="20" height="20">' +
          '</span>' +
          '<span class="version-card__brand-tag">' + AppHub.escapeHtml(current.tagline || '') + '</span>' +
        '</div>' +
        '<span class="version-card__status">' + AppHub.escapeHtml(current.status) + '</span>' +
      '</div>' +
      '<div class="version-card__grid">' +
        '<div class="version-card__item"><span class="version-card__label">Version</span><span class="version-card__value">' + AppHub.escapeHtml(current.version) + '</span></div>' +
        '<div class="version-card__item"><span class="version-card__label">Status</span><span class="version-card__value">' + AppHub.escapeHtml(current.status) + '</span></div>' +
        '<div class="version-card__item"><span class="version-card__label">Release</span><span class="version-card__value">' + AppHub.escapeHtml(current.release) + '</span></div>' +
        '<div class="version-card__item"><span class="version-card__label">Channel</span><span class="version-card__value">' + AppHub.escapeHtml(current.channel || 'Production') + '</span></div>' +
      '</div>';
  }

  function renderInfo(host, current) {
    if (!host || !current) return;
    var rows = [
      { k: 'Nomor Versi', v: current.version },
      { k: 'Nama Rilis', v: current.release },
      { k: 'Status', v: current.status },
      { k: 'Channel', v: current.channel || 'Production' },
      { k: 'Platform', v: current.platform || 'Static Web (GitHub Pages)' },
      { k: 'Catatan', v: current.note || 'Rilis awal website Coming Soon' }
    ];
    host.innerHTML = rows.map(function (r) {
      return '<div class="info-row"><div class="info-row__key">' + AppHub.escapeHtml(r.k) + '</div>' +
             '<div class="info-row__value">' + AppHub.escapeHtml(r.v) + '</div></div>';
    }).join('');
  }

  function renderTags(host, tags) {
    if (!host || !Array.isArray(tags)) return;
    host.innerHTML = tags.map(function (t) {
      return '<span class="feature-tag">' + AppHub.escapeHtml(t) + '</span>';
    }).join('');
  }

  function renderPrevious(host, previous) {
    if (!host || !Array.isArray(previous) || !previous.length) return;
    host.innerHTML = previous.map(function (p, i) {
      return '<article class="about-card reveal" style="--d:' + (i * 0.06) + 's">' +
        '<h3 class="about-card__title">' + AppHub.escapeHtml(p.title) + '</h3>' +
        '<p class="about-card__text">' + AppHub.escapeHtml(p.text) + '</p>' +
      '</article>';
    }).join('');
  }

  function init() {
    var currentHost = document.querySelector('[data-version-current]');
    var infoHost = document.querySelector('[data-version-info]');
    var tagsHost = document.querySelector('[data-version-tags]');
    var prevHost = document.querySelector('[data-version-previous]');
    if (!currentHost && !infoHost && !tagsHost && !prevHost) return;

    AppHub.fetchJSON('data/versions.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data versi tidak valid.');
        renderCurrent(currentHost, data.current);
        renderInfo(infoHost, data.current);
        renderTags(tagsHost, data.tags);
        renderPrevious(prevHost, data.rencana);
      })
      .catch(function (err) {
        console.warn('[AppHub] versions.json:', err.message);
        if (currentHost) AppHub.renderState(currentHost, 'error', 'Data versi belum dapat dimuat saat ini.');
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