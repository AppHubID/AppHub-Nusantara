/* =========================================================
   AppHub.ID — main.js
   ========================================================= */
(function () {
  'use strict';

  window.AppHub = window.AppHub || {};
  var AppHub = window.AppHub;

  AppHub.ready = new Promise(function (resolve) {
    AppHub._resolveReady = resolve;
  });

  /* ---------- Base path ---------- */
  function detectBasePath() {
    var meta = document.querySelector('meta[name="base-path"]');
    if (meta && meta.content) return meta.content;
    return './';
  }
  var BASE = detectBasePath();
  AppHub.basePath = BASE;

  /* ---------- Helpers ---------- */
  function qs(sel, scope) { return (scope || document).querySelector(sel); }
  function qsa(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  AppHub.escapeHtml = escapeHtml;
  AppHub.qs = qs;
  AppHub.qsa = qsa;

  function fetchJSON(relativePath) {
    return fetch(BASE + relativePath, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + relativePath);
        return r.json();
      });
  }
  AppHub.fetchJSON = fetchJSON;

  function renderState(container, type, message) {
    var cls = type === 'error' ? 'state state--error'
            : type === 'loading' ? 'state state--loading'
            : 'state';
    container.innerHTML = '<p class="' + cls + '">' + escapeHtml(message) + '</p>';
  }
  AppHub.renderState = renderState;

  /* ---------- Component loader ---------- */
  function loadComponent(node) {
    var name = node.getAttribute('data-component');
    if (!name) return Promise.resolve();
    var url = BASE + 'components/' + name + '.html';

    return fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status + ' — ' + url);
        return r.text();
      })
      .then(function (html) {
        node.innerHTML = html.split('{{BASE}}').join(BASE);
        node.setAttribute('data-component-loaded', name);
      })
      .catch(function (err) {
        console.warn('[AppHub] Gagal memuat komponen "' + name + '":', err.message);
        node.setAttribute('data-component-error', name);
      });
  }

  function loadAllComponents() {
    return Promise.all(qsa('[data-component]').map(loadComponent));
  }

  /* ---------- Navbar scroll ---------- */
  var ScrollState = {
    init: function () {
      var navbar = qs('#navbar');
      if (!navbar) return;
      var ticking = false;
      function update() { navbar.classList.toggle('is-scrolled', window.scrollY > 12); ticking = false; }
      update();
      window.addEventListener('scroll', function () {
        if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
    }
  };

  /* ---------- Menu ---------- */
  var Menu = {
    toggle: null, panel: null, overlay: null, lastFocused: null, isOpen: false,
    init: function () {
      this.toggle = qs('#navToggle');
      this.panel = qs('#navPanel');
      this.overlay = qs('#navOverlay');
      if (!this.toggle || !this.panel || !this.overlay) return;

      var self = this;
      this.toggle.addEventListener('click', function () {
        self.isOpen ? self.close() : self.open();
      });
      this.overlay.addEventListener('click', function () { self.close(); });
      qsa('a', this.panel).forEach(function (link) {
        link.addEventListener('click', function () { self.close(); });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.isOpen) self.close();
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 900 && self.isOpen) self.close();
      });
    },
    lockScroll: function () {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    },
    unlockScroll: function () {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
    },
    open: function () {
      if (this.isOpen) return;
      this.lastFocused = document.activeElement;
      this.isOpen = true;
      this.overlay.hidden = false;
      this.overlay.setAttribute('aria-hidden', 'false');
      void this.overlay.offsetWidth;
      this.overlay.classList.add('is-open');
      this.panel.classList.add('is-open');
      this.panel.setAttribute('aria-hidden', 'false');
      this.toggle.setAttribute('aria-expanded', 'true');
      this.toggle.setAttribute('aria-label', 'Tutup menu');
      this.lockScroll();
      var first = qs('a', this.panel);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 220);
    },
    close: function () {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.panel.classList.remove('is-open');
      this.panel.setAttribute('aria-hidden', 'true');
      this.overlay.classList.remove('is-open');
      this.overlay.setAttribute('aria-hidden', 'true');
      this.toggle.setAttribute('aria-expanded', 'false');
      this.toggle.setAttribute('aria-label', 'Buka menu');
      this.unlockScroll();
      var self = this;
      setTimeout(function () { if (!self.isOpen) self.overlay.hidden = true; }, 380);
      if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
        this.lastFocused.focus({ preventScroll: true });
      }
    }
  };

  /* ---------- Active nav ---------- */
  function initActiveNav() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    qsa('[data-nav]').forEach(function (link) {
      var target = link.getAttribute('data-nav');
      if (target === page) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ---------- Reveal ---------- */
  function initReveal() {
    var els = qsa('.reveal');
    if (!els.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Footer year ---------- */
  function initFooterYear() {
    qsa('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- Features preview (homepage & features page) ---------- */
  function featureStatusClass(status) {
    var n = String(status || '').toLowerCase();
    if (n.indexOf('segera') !== -1) return 'status-pill--soon';
    if (n.indexOf('persiapan') !== -1 || n.indexOf('dalam') !== -1) return 'status-pill--active';
    return 'status-pill--planned';
  }

  function buildFeatureCard(item, idx) {
    return '' +
      '<article class="feature-card js-reveal" style="--d:' + (idx * 0.04) + 's">' +
        '<span class="feature-card__icon">' +
          '<img class="icon icon--lg" src="' + BASE + (item.icon || 'assets/icons/box.svg') + '" alt="" width="22" height="22" aria-hidden="true">' +
        '</span>' +
        '<h3 class="feature-card__title">' + escapeHtml(item.nama) + '</h3>' +
        '<p class="feature-card__desc">' + escapeHtml(item.deskripsi) + '</p>' +
        '<div class="feature-card__foot">' +
          '<span class="status-pill ' + featureStatusClass(item.status) + '">' + escapeHtml(item.status || 'Direncanakan') + '</span>' +
        '</div>' +
      '</article>';
  }

  function renderFeaturesPreview() {
    var containers = qsa('[data-features-preview]');
    if (!containers.length) return;
    fetchJSON('data/features.json')
      .then(function (data) {
        var list = data && Array.isArray(data.items) ? data.items : [];
        if (!list.length) {
          containers.forEach(function (c) { renderState(c, 'empty', 'Belum ada kategori yang dapat ditampilkan.'); });
          return;
        }
        var limitAttr = containers[0].getAttribute('data-limit');
        var limit = limitAttr ? parseInt(limitAttr, 10) : 0;
        var visible = (limit && limit > 0) ? list.slice(0, limit) : list;
        containers.forEach(function (c) {
          c.innerHTML = visible.map(buildFeatureCard).join('');
        });
      })
      .catch(function (err) {
        console.warn('[AppHub] features.json:', err.message);
        containers.forEach(function (c) { renderState(c, 'error', 'Data kategori belum dapat dimuat saat ini.'); });
      });
  }

  /* ---------- Init ---------- */
  function init() {
    document.body.classList.add('is-loaded');

    loadAllComponents()
      .then(function () {
        ScrollState.init();
        Menu.init();
        initActiveNav();
        initFooterYear();
        renderFeaturesPreview();
        initReveal();
        document.dispatchEvent(new CustomEvent('apphub:components-ready'));
        AppHub._resolveReady();
      })
      .catch(function (err) {
        console.error('[AppHub] Kesalahan inisialisasi:', err);
        AppHub._resolveReady();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();