/* ==========================================================================
   AppHub.ID — changelog.js
   ========================================================================== */

(function () {
  'use strict';

  function formatDate(iso) {
    if (!iso) return '';
    var MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    var y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
    if (!y || !m || !d || m < 1 || m > 12) return iso;
    return d + ' ' + MONTHS[m - 1] + ' ' + y;
  }

  function statusClass(s) {
    var n = String(s || '').toLowerCase();
    if (n.indexOf('stable') !== -1 || n.indexOf('rilis') !== -1) return 'status-pill--active';
    if (n.indexOf('rencana') !== -1 || n.indexOf('plan') !== -1) return 'status-pill--planned';
    return 'status-pill--active';
  }

  function renderItem(entry, idx) {
    var isPlanned = String(entry.status || '').toLowerCase().indexOf('rencana') !== -1;
    var dotClass = isPlanned ? 'timeline-item__dot timeline-item__dot--planned' : 'timeline-item__dot';
    var badgeClass = isPlanned ? 'version-badge version-badge--planned' : 'version-badge';
    var badgeIcon = isPlanned ? 'clock.svg' : 'verified-badge.svg';
    var tags = (entry.tags || []).map(function (t) {
      return '<span class="feature-tag">' + AppHub.escapeHtml(t) + '</span>';
    }).join('');

    return '<article class="timeline-item reveal" style="--d:' + (idx * 0.06) + 's">' +
      '<span class="' + dotClass + '" aria-hidden="true"></span>' +
      '<header class="timeline-item__head">' +
        '<div class="timeline-item__meta">' +
          '<span class="' + badgeClass + '">' +
            '<img class="icon icon--sm" src="' + AppHub.basePath + 'assets/icons/' + badgeIcon + '" alt="" width="14" height="14" aria-hidden="true">' +
            AppHub.escapeHtml(entry.version || '') +
          '</span>' +
          '<span class="status-pill ' + statusClass(entry.status) + '">' + AppHub.escapeHtml(entry.status || '') + '</span>' +
          (entry.date ? '<time class="timeline-item__date" datetime="' + AppHub.escapeHtml(entry.date) + '">' + AppHub.escapeHtml(formatDate(entry.date)) + '</time>' : '') +
        '</div>' +
        '<h3 class="timeline-item__title">' + AppHub.escapeHtml(entry.title) + '</h3>' +
      '</header>' +
      '<div class="timeline-item__card">' +
        '<p class="timeline-item__desc">' + AppHub.escapeHtml(entry.summary) + '</p>' +
        (tags ? '<div class="feature-tags">' + tags + '</div>' : '') +
      '</div>' +
    '</article>';
  }

  function renderStats(host, summary) {
    if (!host || !summary) return;
    host.innerHTML =
      '<article class="stat-card reveal">' +
        '<div class="stat-card__head"><span class="stat-card__label">Versi Saat Ini</span>' +
          '<img class="icon icon--sm" src="' + AppHub.basePath + 'assets/icons/verified-badge.svg" alt="" width="16" height="16" aria-hidden="true"></div>' +
        '<span class="stat-card__value">' + AppHub.escapeHtml(summary.currentVersion) + '</span>' +
        '<span class="stat-card__hint">Rilis stabil</span>' +
      '</article>' +
      '<article class="stat-card reveal" style="--d:.05s">' +
        '<div class="stat-card__head"><span class="stat-card__label">Total Rilis</span>' +
          '<img class="icon icon--sm" src="' + AppHub.basePath + 'assets/icons/box.svg" alt="" width="16" height="16" aria-hidden="true"></div>' +
        '<span class="stat-card__value">' + AppHub.escapeHtml(summary.totalRilis) + '</span>' +
        '<span class="stat-card__hint">Sejak awal</span>' +
      '</article>' +
      '<article class="stat-card reveal" style="--d:.1s">' +
        '<div class="stat-card__head"><span class="stat-card__label">Status</span>' +
          '<img class="icon icon--sm" src="' + AppHub.basePath + 'assets/icons/star.svg" alt="" width="16" height="16" aria-hidden="true"></div>' +
        '<span class="stat-card__value" style="font-size:1.1rem;">' + AppHub.escapeHtml(summary.status) + '</span>' +
        '<span class="stat-card__hint">' + AppHub.escapeHtml(summary.channel || 'Production') + '</span>' +
      '</article>' +
      '<article class="stat-card reveal" style="--d:.15s">' +
        '<div class="stat-card__head"><span class="stat-card__label">Kanal</span>' +
          '<img class="icon icon--sm" src="' + AppHub.basePath + 'assets/icons/infinity.svg" alt="" width="16" height="16" aria-hidden="true"></div>' +
        '<span class="stat-card__value" style="font-size:1.1rem;">' + AppHub.escapeHtml(summary.channel || 'Production') + '</span>' +
        '<span class="stat-card__hint">Rilis publik</span>' +
      '</article>';
  }

  function init() {
    var statsHost = document.querySelector('[data-changelog-stats]');
    var timelineHost = document.querySelector('[data-changelog-timeline]');
    if (!statsHost && !timelineHost) return;

    AppHub.fetchJSON('data/changelog.json')
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Format data changelog tidak valid.');
        renderStats(statsHost, data.summary);
        if (timelineHost) {
          var entries = data.entries || [];
          if (!entries.length) {
            AppHub.renderState(timelineHost, 'empty', 'Belum ada entri changelog yang dipublikasikan.');
          } else {
            timelineHost.innerHTML = entries.map(renderItem).join('');
          }
        }
      })
      .catch(function (err) {
        console.warn('[AppHub] changelog.json:', err.message);
        if (timelineHost) AppHub.renderState(timelineHost, 'error', 'Data changelog belum dapat dimuat saat ini.');
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