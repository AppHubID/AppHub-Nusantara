/* ==========================================================================
   AppHub.ID — main.js
   Inisialisasi website, komponen, drawer menu, aksesibilitas, reveal,
   dan pemuatan data produk.
   ========================================================================== */

(function () {
  'use strict';

  var html = document.documentElement;
  var BASE = html.getAttribute('data-base') || '';

  var AppHub = {
    base: BASE,
    ready: false
  };
  window.AppHub = AppHub;

  /* ---------------------------------------------------------------------
     Util
     --------------------------------------------------------------------- */

  function applyBase(markup) {
    return String(markup).split('{{base}}').join(BASE);
  }

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function fetchText(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' untuk ' + url);
      return res.text();
    });
  }

  function fetchJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' untuk ' + url);
      return res.json();
    });
  }

  AppHub.fetchText = fetchText;
  AppHub.fetchJSON = fetchJSON;
  AppHub.applyBase = applyBase;

  /* ---------------------------------------------------------------------
     Komponen
     --------------------------------------------------------------------- */

  var COMPONENTS = [
    { name: 'navbar', selector: '[data-component="navbar"]' },
    { name: 'footer', selector: '[data-component="footer"]' },
    { name: 'countdown', selector: '[data-component="countdown"]' },
    { name: 'product-list', selector: '[data-component="product-list"]' }
  ];

  function loadComponent(component) {
    var targets = qsa(component.selector);
    if (!targets.length) return Promise.resolve();

    var url = BASE + 'components/' + component.name + '.html';

    return fetchText(url).then(function (markup) {
      var html = applyBase(markup);
      targets.forEach(function (target) {
        target.innerHTML = html;
      });
    }).catch(function (err) {
      console.warn('[AppHub] Gagal memuat komponen "' + component.name + '":', err.message);
      targets.forEach(function (target) {
        if (component.name === 'navbar' || component.name === 'footer') {
          target.innerHTML = '';
        }
      });
    });
  }

  function loadAllComponents() {
    return Promise.all(COMPONENTS.map(loadComponent));
  }

  /* ---------------------------------------------------------------------
     Drawer menu
     --------------------------------------------------------------------- */

  var drawerState = {
    drawer: null,
    overlay: null,
    openBtn: null,
    closeBtn: null,
    lastFocused: null
  };

  function focusables(root) {
    return qsa(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      root
    ).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function openDrawer() {
    if (!drawerState.drawer) return;

    drawerState.lastFocused = document.activeElement;
    drawerState.drawer.classList.add('is-open');
    drawerState.overlay.classList.add('is-open');
    drawerState.drawer.setAttribute('aria-hidden', 'false');
    if (drawerState.openBtn) drawerState.openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');

    var items = focusables(drawerState.drawer);
    if (items.length) {
      window.setTimeout(function () { items[0].focus(); }, 60);
    }
  }

  function closeDrawer() {
    if (!drawerState.drawer) return;
    if (!drawerState.drawer.classList.contains('is-open')) return;

    drawerState.drawer.classList.remove('is-open');
    drawerState.overlay.classList.remove('is-open');
    drawerState.drawer.setAttribute('aria-hidden', 'true');
    if (drawerState.openBtn) drawerState.openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');

    var restore = drawerState.lastFocused || drawerState.openBtn;
    if (restore && typeof restore.focus === 'function') {
      window.setTimeout(function () { restore.focus(); }, 40);
    }
  }

  function initDrawer() {
    var drawer = qs('#apphubDrawer');
    var overlay = qs('#apphubDrawerOverlay');
    var openBtn = qs('#apphubMenuBtn');
    var closeBtn = qs('#apphubDrawerClose');

    if (!drawer || !overlay || !openBtn) return;

    drawerState.drawer = drawer;
    drawerState.overlay = overlay;
    drawerState.openBtn = openBtn;
    drawerState.closeBtn = closeBtn;

    openBtn.addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

    qsa('a', drawer).forEach(function (link) {
      link.addEventListener('click', function () {
        closeDrawer();
      });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' || event.key === 'Esc') {
        closeDrawer();
        return;
      }

      if (event.key === 'Tab' && drawer.classList.contains('is-open')) {
        var items = focusables(drawer);
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 960) closeDrawer();
    });
  }

  AppHub.openDrawer = openDrawer;
  AppHub.closeDrawer = closeDrawer;

  /* ---------------------------------------------------------------------
     Active navigation
     --------------------------------------------------------------------- */

  function normalizePath(path) {
    var value = String(path || '').split('?')[0].split('#')[0];
    value = value.replace(/\/index\.html$/, '/');
    if (value.length > 1) value = value.replace(/\/$/, '');
    return value;
  }

  function initActiveNav() {
    var current = normalizePath(window.location.pathname);
    var links = qsa('[data-nav-link]');

    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var target = normalizePath(new URL(href, window.location.href).pathname);

      var isActive =
        (target === current) ||
        (target !== '' && target !== '/' && current.indexOf(target) === 0) ||
        (target === '/' && (current === '/' || current === '' || /\/index\.html$/.test(window.location.pathname)));

      if (isActive) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ---------------------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------------------- */

  function initReveal() {
    var targets = qsa('[data-reveal]');
    if (!targets.length) return;

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  AppHub.observeReveal = function (root) {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var targets = qsa('[data-reveal]', root || document);

    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) { observer.observe(el); });
  };

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */

  function initYear() {
    qsa('[data-current-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------------------------------------------------------------------
     Produk & kategori
     --------------------------------------------------------------------- */

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  AppHub.escapeHtml = escapeHtml;

  function statusMarkup(status) {
    return '<span class="status" data-status="' + escapeHtml(status) + '">' +
      '<span class="status-dot" aria-hidden="true"></span>' + escapeHtml(status) +
      '</span>';
  }

  function renderProductList(data) {
    var grid = qs('#productGrid');
    var starterWrap = qs('#starterKits');
    if (!grid) return;

    var categories = (data && data.categories) || [];

    if (!categories.length) {
      grid.innerHTML = '<p class="state-msg">Data kategori belum tersedia.</p>';
      return;
    }

    grid.innerHTML = categories.map(function (item) {
      var icon = BASE + 'assets/icons/' + (item.icon || 'box.svg');
      return '' +
        '<article class="product-card">' +
          '<div class="product-card-top">' +
            '<img src="' + escapeHtml(icon) + '" alt="" width="24" height="24" class="icon-md">' +
            statusMarkup(item.status || 'Direncanakan') +
          '</div>' +
          '<h3 class="product-card-name">' + escapeHtml(item.name) + '</h3>' +
          '<p class="product-card-desc">' + escapeHtml(item.description) + '</p>' +
        '</article>';
    }).join('');

    grid.classList.add('stagger');

    if (starterWrap) {
      var kits = (data && data.starterKits) || [];
      if (kits.length) {
        starterWrap.innerHTML = '' +
          '<h3 class="starter-title">Starter Kits</h3>' +
          '<p class="starter-desc">Paket awal yang sedang dipersiapkan untuk berbagai kebutuhan.</p>' +
          '<div class="starter-grid">' +
            kits.map(function (kit) {
              return '' +
                '<div class="starter-item">' +
                  '<img src="' + BASE + 'assets/icons/check.svg" alt="" width="18" height="18">' +
                  '<span>' + escapeHtml(kit) + '</span>' +
                '</div>';
            }).join('') +
          '</div>';
      }
    }
  }

  function initProducts() {
    if (!qs('#productGrid')) return Promise.resolve();

    return fetchJSON(BASE + 'data/products.json')
      .then(function (data) { renderProductList(data); })
      .catch(function (err) {
        console.warn('[AppHub] Gagal memuat data produk:', err.message);
        var grid = qs('#productGrid');
        if (grid) grid.innerHTML = '<p class="state-msg">Data kategori belum dapat dimuat saat ini.</p>';
      });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */

  function boot() {
    loadAllComponents().then(function () {
      initDrawer();
      initActiveNav();
      initYear();
      initReveal();
      AppHub.observeReveal(document);

      return initProducts();
    }).then(function () {
      AppHub.ready = true;
      document.dispatchEvent(new CustomEvent('apphub:ready'));
    }).catch(function (err) {
      console.error('[AppHub] Kesalahan inisialisasi:', err);
      AppHub.ready = true;
      document.dispatchEvent(new CustomEvent('apphub:ready'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
