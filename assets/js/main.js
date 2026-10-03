/* ==========================================================================
   AppHub.ID — main.js
   Inisialisasi umum: pemuatan komponen, navbar, menu hamburger,
   aksesibilitas, scroll state, navigasi aktif, dan render kategori produk.
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Inisialisasi namespace global + promise kesiapan komponen
     ---------------------------------------------------------------------- */
  window.AppHub = window.AppHub || {};

  window.AppHub.ready = new Promise(function (resolve) {
    window.AppHub._resolveReady = resolve;
  });

  /* ----------------------------------------------------------------------
     Base path
     ---------------------------------------------------------------------- */
  function detectBasePath() {
    var meta = document.querySelector('meta[name="base-path"]');
    if (meta && meta.content) return meta.content;

    var path = window.location.pathname;
    if (path.indexOf('/pages/') !== -1) return '../';
    return './';
  }

  var BASE = detectBasePath();

  window.AppHub.basePath = BASE;

  /* ----------------------------------------------------------------------
     Helper umum
     ---------------------------------------------------------------------- */
  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.AppHub.escapeHtml = escapeHtml;

  window.AppHub.resolvePath = function (relativePath) {
    return BASE + relativePath;
  };

  /* ----------------------------------------------------------------------
     Pemuatan komponen HTML statis (kompatibel GitHub Pages)
     ---------------------------------------------------------------------- */
  function loadComponent(node) {
    var name = node.getAttribute('data-component');
    if (!name) return Promise.resolve();

    var url = BASE + 'components/' + name + '.html';

    return fetch(url, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ' untuk ' + url);
        }
        return response.text();
      })
      .then(function (html) {
        node.innerHTML = html.split('{{BASE}}').join(BASE);
        node.setAttribute('data-component-loaded', name);
      })
      .catch(function (error) {
        console.warn('[AppHub] Gagal memuat komponen "' + name + '":', error.message);
        node.setAttribute('data-component-error', name);
      });
  }

  function loadAllComponents() {
    var nodes = qsa('[data-component]');
    return Promise.all(nodes.map(loadComponent));
  }

  /* ----------------------------------------------------------------------
     Navbar: scroll state + menu hamburger
     ---------------------------------------------------------------------- */
  var ScrollState = {
    init: function () {
      var navbar = qs('#navbar');
      if (!navbar) return;

      var ticking = false;

      function update() {
        if (window.scrollY > 12) {
          navbar.classList.add('is-scrolled');
        } else {
          navbar.classList.remove('is-scrolled');
        }
        ticking = false;
      }

      function onScroll() {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      }

      update();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  };

  var Menu = {
    toggle: null,
    panel: null,
    overlay: null,
    lastFocused: null,
    isOpen: false,

    init: function () {
      this.toggle = qs('#navToggle');
      this.panel = qs('#navPanel');
      this.overlay = qs('#navOverlay');

      if (!this.toggle || !this.panel || !this.overlay) return;

      var self = this;

      this.toggle.addEventListener('click', function () {
        self.isOpen ? self.close() : self.open();
      });

      this.overlay.addEventListener('click', function () {
        self.close();
      });

      qsa('a', this.panel).forEach(function (link) {
        link.addEventListener('click', function () {
          self.close();
        });
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && self.isOpen) {
          self.close();
        }
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth > 900 && self.isOpen) {
          self.close();
        }
      });
    },

    lockScroll: function () {
      var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty('--sbw', scrollbarWidth + 'px');
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    },

    unlockScroll: function () {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('no-scroll');
      document.documentElement.style.removeProperty('--sbw');
    },

    open: function () {
      if (this.isOpen) return;

      this.lastFocused = document.activeElement;
      this.isOpen = true;

      this.overlay.hidden = false;
      this.overlay.setAttribute('aria-hidden', 'false');

      /* Paksa reflow agar transisi overlay berjalan */
      void this.overlay.offsetWidth;
      this.overlay.classList.add('is-open');

      this.panel.classList.add('is-open');
      this.panel.setAttribute('aria-hidden', 'false');

      this.toggle.setAttribute('aria-expanded', 'true');
      this.toggle.setAttribute('aria-label', 'Tutup menu');

      this.lockScroll();

      var firstLink = qs('a', this.panel);
      if (firstLink) {
        window.setTimeout(function () {
          firstLink.focus({ preventScroll: true });
        }, 220);
      }
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
      window.setTimeout(function () {
        if (!self.isOpen) {
          self.overlay.hidden = true;
        }
      }, 380);

      if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
        this.lastFocused.focus({ preventScroll: true });
      }
    }
  };

  /* ----------------------------------------------------------------------
     Navigasi aktif berdasarkan body[data-page]
     ---------------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */
  function initReveal() {
    var elements = qsa('.reveal');
    if (!elements.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.12
    });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ----------------------------------------------------------------------
     Kategori produk (data/products.json)
     ---------------------------------------------------------------------- */
  var ProductList = {
    grid: null,
    meta: null,
    loaded: false,

    init: function () {
      this.grid = qs('[data-product-grid]');
      this.meta = qs('[data-product-note]');
      if (!this.grid) return;

      var self = this;

      fetch(BASE + 'data/products.json', { cache: 'no-cache' })
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function (data) {
          self.render(data);
        })
        .catch(function (error) {
          console.warn('[AppHub] Gagal memuat products.json:', error.message);
          self.grid.innerHTML =
            '<p class="state state--error">Daftar kategori belum dapat dimuat saat ini. ' +
            'Silakan muat ulang halaman atau hubungi <a href="mailto:apphubid@gmail.com">apphubid@gmail.com</a>.</p>';
        });
    },

    statusClass: function (status) {
      var normalized = String(status || '').toLowerCase();
      if (normalized.indexOf('segera') !== -1) return 'status-pill--soon';
      if (normalized.indexOf('dipersiapkan') !== -1 || normalized.indexOf('sedang') !== -1) {
        return 'status-pill--active';
      }
      return 'status-pill--planned';
    },

    card: function (item, index) {
      var status = item.status || 'Direncanakan';
      var number = String(index + 1).padStart(2, '0');

      return '' +
        '<article class="product-card js-reveal" style="--d:' + (index * 0.04) + 's">' +
          '<span class="product-card__index">' + number + '</span>' +
          '<h3 class="product-card__title">' + escapeHtml(item.nama) + '</h3>' +
          '<p class="product-card__desc">' + escapeHtml(item.deskripsi) + '</p>' +
          '<div class="product-card__foot">' +
            '<span class="status-pill ' + this.statusClass(status) + '">' +
              escapeHtml(status) +
            '</span>' +
          '</div>' +
        '</article>';
    },

    render: function (data) {
      if (!data || !Array.isArray(data.categories) || !data.categories.length) {
        this.grid.innerHTML = '<p class="state">Belum ada kategori yang dapat ditampilkan.</p>';
        return;
      }

      var self = this;
      var mainCategories = data.categories.filter(function (item) {
        return item.grup !== 'Starter Kits';
      });
      var starterKits = data.categories.filter(function (item) {
        return item.grup === 'Starter Kits';
      });

      var html = mainCategories.map(function (item, index) {
        return self.card(item, index);
      }).join('');

      this.grid.innerHTML = html;

      if (starterKits.length) {
        var groupTitle = '<h3 class="product-group-title">Starter Kits</h3>';
        var starterHtml = starterKits.map(function (item, index) {
          return self.card(item, mainCategories.length + index);
        }).join('');

        var groupWrapper = document.createElement('div');
        groupWrapper.innerHTML = groupTitle +
          '<div class="product-grid">' + starterHtml + '</div>';

        this.grid.parentNode.insertBefore(groupWrapper, this.grid.nextSibling);
      }

      if (this.meta && data.meta && data.meta.catatan) {
        this.meta.textContent = data.meta.catatan;
      }

      this.loaded = true;
    }
  };

  /* ----------------------------------------------------------------------
     Tahun berjalan pada footer
     ---------------------------------------------------------------------- */
  function initFooterYear() {
    qsa('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ----------------------------------------------------------------------
     Inisialisasi utama
     ---------------------------------------------------------------------- */
  function init() {
    document.body.classList.add('is-loaded');

    loadAllComponents()
      .then(function () {
        ScrollState.init();
        Menu.init();
        initActiveNav();
        initFooterYear();
        ProductList.init();
        initReveal();

        document.dispatchEvent(new CustomEvent('apphub:components-ready'));
        window.AppHub._resolveReady();
      })
      .catch(function (error) {
        console.error('[AppHub] Kesalahan inisialisasi:', error);
        window.AppHub._resolveReady();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();