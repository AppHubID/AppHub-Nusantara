/* ==========================================================================
   AppHub.ID — main.js
   Inisialisasi umum, pemuatan komponen, navbar, menu hamburger,
   helper umum, data paket langganan bersama, dan renderer paket.
   ========================================================================== */

(function () {
  'use strict';

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
    if (path.indexOf('/pages/') !== -1 || path.indexOf('/subscription/') !== -1) return '../';
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

  window.AppHub.qs = qs;
  window.AppHub.qsa = qsa;
  window.AppHub.escapeHtml = escapeHtml;
  window.AppHub.resolvePath = function (relativePath) { return BASE + relativePath; };

  /* ----------------------------------------------------------------------
     Data paket langganan (sumber tunggal, dipakai di semua halaman paket)
     ---------------------------------------------------------------------- */
  var PROMO_END_ISO = '2026-11-30T23:59:59+07:00';
  var PROMO_END_LABEL = '30 November 2026';

  var PACKAGES = {
    free: {
      id: 'free',
      nama: 'FREE',
      icon: 'assets/icons/gift.svg',
      tagline: 'Coba dulu, tanpa biaya.',
      order: 1,
      masa: '24 jam',
      refund: null,
      refundLabel: '—',
      inherits: [],
      harga: {
        normal: 0,
        normalUsd: 0,
        promo: null,
        promoUsd: null,
        masaNormal: '24 jam',
        masaPromo: null
      },
      benefit: [
        'Akses selama 24 jam',
        'Update dengan keterlambatan maksimal 5 menit',
        '1× pembuatan website HTML gratis'
      ]
    },

    basic: {
      id: 'basic',
      nama: 'BASIC',
      icon: 'assets/icons/box.svg',
      tagline: 'Untuk yang ingin mulai lebih cepat.',
      order: 2,
      masa: '7 hari',
      refund: 15,
      refundLabel: '15%',
      inherits: ['free'],
      harga: {
        normal: 200000,
        normalUsd: 11.18,
        promo: null,
        promoUsd: null,
        masaNormal: '7 hari',
        masaPromo: null
      },
      benefit: [
        'Update dengan keterlambatan maksimal 2 menit',
        '300 Free Points'
      ]
    },

    standard: {
      id: 'standard',
      nama: 'STANDARD',
      icon: 'assets/icons/star.svg',
      tagline: 'Pilihan seimbang untuk pengguna aktif.',
      order: 3,
      masa: '1 bulan',
      refund: 25,
      refundLabel: '25%',
      inherits: ['basic'],
      harga: {
        normal: 1000000,
        normalUsd: 55.90,
        promo: null,
        promoUsd: null,
        masaNormal: '1 bulan',
        masaPromo: null
      },
      benefit: [
        'Fresh Update',
        '450 Free Points',
        'Diskon 10%',
        '1× Free Domain',
        '1× pembuatan website gratis',
        '1× firebes'
      ]
    },

    pro: {
      id: 'pro',
      nama: 'PRO',
      icon: 'assets/icons/crown.svg',
      tagline: 'Untuk kebutuhan proyek yang lebih serius.',
      order: 4,
      masa: '2 bulan / 6 bulan (promo)',
      refund: 30,
      refundLabel: '30%',
      inherits: ['basic'],
      harga: {
        normal: 3500000,
        normalUsd: 195.66,
        promo: 2599999,
        promoUsd: 145.34,
        masaNormal: '2 bulan',
        masaPromo: '6 bulan'
      },
      benefit: [
        '500 Free Points',
        'Diskon 15%',
        '1× Free Landing Page Website untuk UMKM',
        '1× Free Revision',
        '500 Free Coding Prompts'
      ]
    },

    lifetime: {
      id: 'lifetime',
      nama: 'LIFETIME',
      icon: 'assets/icons/infinity.svg',
      tagline: 'Akses menyeluruh, tanpa batas waktu.',
      order: 5,
      masa: 'Selamanya',
      refund: 50,
      refundLabel: '50%',
      inherits: ['pro'],
      harga: {
        normal: 10000000,
        normalUsd: 559.02,
        promo: 7999999,
        promoUsd: 447.21,
        masaNormal: 'Selamanya',
        masaPromo: 'Selamanya'
      },
      benefit: [
        'Official Reseller',
        'Akses website sebagai Admin',
        'Diskon 40%',
        'Free Website Training',
        'Free Domain',
        'Free Database',
        'Bebas request website',
        'Free Template',
        'Free download file PDF hingga 10×',
        'Panduan mengelola website',
        'Dan berbagai benefit lainnya'
      ]
    }
  };

  /* Urutan paket */
  var PACKAGE_ORDER = ['free', 'basic', 'standard', 'pro', 'lifetime'];

  /* ----------------------------------------------------------------------
     Promo
     ---------------------------------------------------------------------- */
  function isPromoActive() {
    var end = new Date(PROMO_END_ISO).getTime();
    if (!isFinite(end)) return false;
    return Date.now() < end;
  }

  function getPromoEndLabel() { return PROMO_END_LABEL; }

  /* ----------------------------------------------------------------------
     Formatter
     ---------------------------------------------------------------------- */
  function formatRupiah(value) {
    if (value === null || value === undefined) return '—';
    if (value === 0) return 'Gratis';
    return 'Rp' + Number(value).toLocaleString('id-ID');
  }

  function formatUsd(value) {
    if (value === null || value === undefined) return '';
    return '$' + Number(value).toFixed(2).replace('.', ',');
  }

  /* ----------------------------------------------------------------------
     Akses data paket
     ---------------------------------------------------------------------- */
  function getPackage(id) {
    return PACKAGES[id] || null;
  }

  function getAllInherited(id) {
    var result = [];
    var visited = {};
    var current = PACKAGES[id];

    while (current && Array.isArray(current.inherits) && current.inherits.length) {
      var parentId = current.inherits[0];
      if (visited[parentId]) break;
      visited[parentId] = true;
      var parent = PACKAGES[parentId];
      if (!parent) break;
      result.push(parent);
      current = parent;
    }

    return result;
  }

  window.AppHub.packages = PACKAGES;
  window.AppHub.packageOrder = PACKAGE_ORDER;
  window.AppHub.getPackage = getPackage;
  window.AppHub.getAllInherited = getAllInherited;
  window.AppHub.isPromoActive = isPromoActive;
  window.AppHub.getPromoEndLabel = getPromoEndLabel;
  window.AppHub.formatRupiah = formatRupiah;
  window.AppHub.formatUsd = formatUsd;

  /* ----------------------------------------------------------------------
     Komponen
     ---------------------------------------------------------------------- */
  function loadComponent(node) {
    var name = node.getAttribute('data-component');
    if (!name) return Promise.resolve();

    var url = BASE + 'components/' + name + '.html';

    return fetch(url, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status + ' untuk ' + url);
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
     Navbar scroll
     ---------------------------------------------------------------------- */
  var ScrollState = {
    init: function () {
      var navbar = qs('#navbar');
      if (!navbar) return;
      var ticking = false;

      function update() {
        if (window.scrollY > 12) navbar.classList.add('is-scrolled');
        else navbar.classList.remove('is-scrolled');
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

  /* ----------------------------------------------------------------------
     Menu hamburger
     ---------------------------------------------------------------------- */
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

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && self.isOpen) self.close();
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
        if (!self.isOpen) self.overlay.hidden = true;
      }, 380);

      if (this.lastFocused && typeof this.lastFocused.focus === 'function') {
        this.lastFocused.focus({ preventScroll: true });
      }
    }
  };

  /* ----------------------------------------------------------------------
     Navigasi aktif
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
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ----------------------------------------------------------------------
     Product list (homepage & about)
     ---------------------------------------------------------------------- */
  var ProductList = {
    init: function () {
      var grid = qs('[data-product-grid]');
      if (!grid) return;
      var meta = qs('[data-product-note]');

      fetch(BASE + 'data/products.json', { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) { render(data, grid, meta); })
        .catch(function (error) {
          console.warn('[AppHub] Gagal memuat products.json:', error.message);
          grid.innerHTML =
            '<p class="state state--error">Daftar kategori belum dapat dimuat saat ini. ' +
            'Silakan muat ulang halaman atau hubungi <a href="mailto:apphubid@gmail.com">apphubid@gmail.com</a>.</p>';
        });
    }
  };

  function productStatusClass(status) {
    var n = String(status || '').toLowerCase();
    if (n.indexOf('segera') !== -1) return 'status-pill--soon';
    if (n.indexOf('dipersiapkan') !== -1 || n.indexOf('sedang') !== -1) return 'status-pill--active';
    return 'status-pill--planned';
  }

  function productCard(item, index) {
    var status = item.status || 'Direncanakan';
    var number = String(index + 1).padStart(2, '0');
    return '' +
      '<article class="product-card js-reveal" style="--d:' + (index * 0.04) + 's">' +
        '<span class="product-card__index">' + number + '</span>' +
        '<h3 class="product-card__title">' + escapeHtml(item.nama) + '</h3>' +
        '<p class="product-card__desc">' + escapeHtml(item.deskripsi) + '</p>' +
        '<div class="product-card__foot">' +
          '<span class="status-pill ' + productStatusClass(status) + '">' +
            escapeHtml(status) +
          '</span>' +
        '</div>' +
      '</article>';
  }

  function render(data, grid, meta) {
    if (!data || !Array.isArray(data.categories) || !data.categories.length) {
      grid.innerHTML = '<p class="state">Belum ada kategori yang dapat ditampilkan.</p>';
      return;
    }

    var main = data.categories.filter(function (i) { return i.grup !== 'Starter Kits'; });
    var kits = data.categories.filter(function (i) { return i.grup === 'Starter Kits'; });

    grid.innerHTML = main.map(productCard).join('');

    if (kits.length) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML =
        '<h3 class="product-group-title">Starter Kits</h3>' +
        '<div class="product-grid">' +
          kits.map(function (item, i) { return productCard(item, main.length + i); }).join('') +
        '</div>';
      grid.parentNode.insertBefore(wrapper, grid.nextSibling);
    }

    if (meta && data.meta && data.meta.catatan) meta.textContent = data.meta.catatan;
  }

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  function initFooterYear() {
    qsa('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ----------------------------------------------------------------------
     Render paket — Preview homepage
     ---------------------------------------------------------------------- */
  function renderPreviewPlans() {
    var host = qs('[data-plans-preview]');
    if (!host) return;

    var promoActive = isPromoActive();
    var html = PACKAGE_ORDER.map(function (id) {
      var pkg = PACKAGES[id];
      if (!pkg) return '';
      return buildPlanCard(pkg, promoActive, { preview: true });
    }).join('');

    host.innerHTML = html;
  }

  /* ----------------------------------------------------------------------
     Render paket — Kartu
     ---------------------------------------------------------------------- */
  function buildPlanCard(pkg, promoActive, options) {
    options = options || {};
    var featured = pkg.id === 'pro';
    var hasPromo = promoActive && pkg.harga.promo !== null && pkg.harga.promo !== undefined;
    var priceMain = hasPromo ? pkg.harga.promo : pkg.harga.normal;
    var priceUsd = hasPromo ? pkg.harga.promoUsd : pkg.harga.normalUsd;
    var duration = hasPromo ? pkg.harga.masaPromo : pkg.harga.masaNormal;

    var priceHtml;
    if (pkg.harga.normal === 0) {
      priceHtml = '<span class="plan-card__price-main">Gratis</span>';
    } else if (hasPromo) {
      priceHtml =
        '<span class="plan-card__price-promo">' + formatRupiah(priceMain) + '</span>' +
        '<span class="plan-card__price-normal">' + formatRupiah(pkg.harga.normal) + '</span>' +
        '<span class="plan-card__price-usd">' + formatUsd(priceUsd) + ' · ' + escapeHtml(duration) + '</span>';
    } else {
      priceHtml =
        '<span class="plan-card__price-main">' + formatRupiah(priceMain) + '</span>' +
        '<span class="plan-card__price-usd">' + formatUsd(priceUsd) + ' · ' + escapeHtml(duration) + '</span>';
    }

    var durationRow = '';
    if (!hasPromo && pkg.harga.masaNormal) {
      durationRow =
        '<span class="plan-card__duration">' +
          '<img class="icon icon--sm" src="' + BASE + 'assets/icons/clock.svg" alt="" width="16" height="16" aria-hidden="true">' +
          '<span>' + escapeHtml(pkg.harga.masaNormal) + '</span>' +
        '</span>';
    }

    var benefitLimit = options.preview ? 3 : 5;
    var benefitHtml = pkg.benefit.slice(0, benefitLimit).map(function (text) {
      return '<li class="plan-card__benefit">' +
        '<img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true">' +
        '<span>' + escapeHtml(text) + '</span>' +
      '</li>';
    }).join('');

    /* Warisan ditampilkan sebagai satu baris ringkas di kartu */
    if (pkg.inherits.length) {
      var parentNames = getAllInherited(pkg.id).map(function (p) { return p.nama; }).join(' + ');
      benefitHtml =
        '<li class="plan-card__benefit plan-card__benefit--inherit">' +
          '<img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true">' +
          '<span>Semua benefit dari ' + escapeHtml(parentNames) + '</span>' +
        '</li>' + benefitHtml;
    }

    if (pkg.benefit.length > benefitLimit) {
      benefitHtml +=
        '<li class="plan-card__benefit plan-card__benefit--inherit">' +
          '<span>+ ' + (pkg.benefit.length - benefitLimit) + ' benefit lainnya</span>' +
        '</li>';
    }

    var badgeHtml = '';
    if (featured) {
      badgeHtml = '<span class="plan-card__badge">' +
        (hasPromo ? 'Promo' : 'Populer') +
      '</span>';
    } else if (hasPromo) {
      badgeHtml = '<span class="plan-card__badge">Promo</span>';
    }

    var href = BASE + 'subscription/detail.html?plan=' + encodeURIComponent(pkg.id);

    return '' +
      '<article class="plan-card js-reveal' + (featured ? ' plan-card--featured' : '') + '">' +
        badgeHtml +
        '<div class="plan-card__head">' +
          '<span class="plan-card__icon">' +
            '<img class="icon" src="' + BASE + pkg.icon + '" alt="" width="26" height="26" aria-hidden="true">' +
          '</span>' +
          '<div>' +
            '<h3 class="plan-card__name">' + escapeHtml(pkg.nama) + '</h3>' +
            '<p class="plan-card__tagline">' + escapeHtml(pkg.tagline) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="plan-card__price">' +
          priceHtml +
          durationRow +
        '</div>' +
        '<ul class="plan-card__benefits">' + benefitHtml + '</ul>' +
        '<div class="plan-card__foot">' +
          '<a class="btn btn--outline btn--block btn--sm" href="' + href + '">' +
            'Lihat Detail' +
            '<img class="icon icon--sm" src="' + BASE + 'assets/icons/arrow-right.svg" alt="" width="16" height="16" aria-hidden="true">' +
          '</a>' +
        '</div>' +
      '</article>';
  }

  /* ----------------------------------------------------------------------
     Render paket — Halaman index
     ---------------------------------------------------------------------- */
  function renderPlansIndex() {
    var host = qs('[data-plans-index]');
    if (!host) return;

    var promoActive = isPromoActive();
    var promoNotice = qs('[data-promo-notice]');
    if (promoNotice) {
      if (promoActive) {
        promoNotice.hidden = false;
        var span = qs('[data-promo-end]', promoNotice);
        if (span) span.textContent = getPromoEndLabel();
      } else {
        promoNotice.hidden = true;
      }
    }

    host.innerHTML = PACKAGE_ORDER.map(function (id) {
      return buildPlanCard(PACKAGES[id], promoActive);
    }).join('');
  }

  /* ----------------------------------------------------------------------
     Query param
     ---------------------------------------------------------------------- */
  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /* ----------------------------------------------------------------------
     Render paket — Detail
     ---------------------------------------------------------------------- */
  function renderPlanDetail() {
    var host = qs('[data-plan-detail]');
    if (!host) return;

    var planId = getQueryParam('plan');
    var pkg = planId ? PACKAGES[planId.toLowerCase()] : null;

    if (!pkg) {
      renderEmptyState(host, 'Paket tidak ditemukan',
        'Parameter paket tidak valid atau tidak dikenali.',
        BASE + 'subscription/index.html', 'Kembali ke Daftar Paket');
      return;
    }

    var promoActive = isPromoActive();
    var hasPromo = promoActive && pkg.harga.promo !== null && pkg.harga.promo !== undefined;
    var priceMain = hasPromo ? pkg.harga.promo : pkg.harga.normal;
    var priceUsd = hasPromo ? pkg.harga.promoUsd : pkg.harga.normalUsd;
    var duration = hasPromo ? pkg.harga.masaPromo : pkg.harga.masaNormal;

    document.title = 'Paket ' + pkg.nama + ' — AppHub.ID';
    var crumbCurrent = qs('[data-plan-crumb]');
    if (crumbCurrent) crumbCurrent.textContent = 'Paket ' + pkg.nama;
    var headerTitle = qs('[data-plan-title]');
    if (headerTitle) headerTitle.textContent = 'Paket ' + pkg.nama;
    var headerDesc = qs('[data-plan-desc]');
    if (headerDesc) headerDesc.textContent = pkg.tagline;

    var priceHtml = '';
    if (pkg.harga.normal === 0) {
      priceHtml =
        '<span class="plan-card__price-main">Gratis</span>' +
        '<span class="plan-card__price-usd">Tanpa biaya</span>';
    } else if (hasPromo) {
      priceHtml =
        '<span class="plan-card__price-promo">' + formatRupiah(priceMain) + '</span>' +
        '<span class="plan-card__price-normal">Harga normal ' + formatRupiah(pkg.harga.normal) + '</span>' +
        '<span class="plan-card__price-usd">' + formatUsd(priceUsd) + ' · ' + escapeHtml(duration) + '</span>';
    } else {
      priceHtml =
        '<span class="plan-card__price-main">' + formatRupiah(priceMain) + '</span>' +
        '<span class="plan-card__price-usd">' + formatUsd(priceUsd) + ' · ' + escapeHtml(duration) + '</span>';
    }

    /* Benefit langsung */
    var directHtml = pkg.benefit.map(function (text) {
      var badge = '';
      if (pkg.id === 'lifetime' && text === 'Official Reseller') {
        badge = '<span class="plan-benefit__badge">' +
          '<img class="icon icon--sm" src="' + BASE + 'assets/icons/verified-badge.svg" alt="Terverifikasi" width="16" height="16">' +
        '</span>';
      }
      return '<li class="plan-benefit">' +
        '<img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true">' +
        '<span>' + escapeHtml(text) + badge + '</span>' +
      '</li>';
    }).join('');

    /* Benefit warisan */
    var inherited = getAllInherited(pkg.id);
    var inheritedHtml = inherited.map(function (parent) {
      var parentItems = parent.benefit.map(function (text) {
        return '<li class="plan-inherit__item">' +
          '<img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true">' +
          '<span>' + escapeHtml(text) + '</span>' +
        '</li>';
      }).join('');

      return '' +
        '<div class="plan-inherit">' +
          '<p class="plan-inherit__label">' +
            '<img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="14" height="14" aria-hidden="true">' +
            'Termasuk dari paket ' + escapeHtml(parent.nama) +
          '</p>' +
          '<ul class="plan-inherit__list">' + parentItems + '</ul>' +
        '</div>';
    }).join('');

    /* Ringkasan refund */
    var refundHtml = '';
    if (pkg.refund !== null && pkg.refund !== undefined) {
      refundHtml = pkg.refundLabel + ' dari nominal pembayaran yang memenuhi syarat pengembalian.';
    } else {
      refundHtml = 'Paket ini tidak memiliki ketentuan pengembalian dana.';
    }

    /* Info promo */
    var promoInfoHtml = '';
    if (hasPromo) {
      promoInfoHtml =
        '<p class="promo-notice" style="margin:0 0 18px;">' +
          '<img class="icon icon--sm" src="' + BASE + 'assets/icons/bell.svg" alt="" width="16" height="16" aria-hidden="true">' +
          'Promo berlaku sampai ' + escapeHtml(getPromoEndLabel()) +
        '</p>';
    }

    host.innerHTML = '' +
      '<div class="plan-detail">' +
        '<aside class="plan-detail__aside">' +
          '<div class="plan-card__head">' +
            '<span class="plan-card__icon">' +
              '<img class="icon" src="' + BASE + pkg.icon + '" alt="" width="26" height="26" aria-hidden="true">' +
            '</span>' +
            '<div>' +
              '<h2 class="plan-card__name">' + escapeHtml(pkg.nama) + '</h2>' +
              '<p class="plan-card__tagline">' + escapeHtml(pkg.tagline) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="plan-card__price">' + priceHtml + '</div>' +
          '<div class="checkout__actions">' +
            '<a class="btn btn--primary btn--block" href="' + BASE + 'subscription/checkout.html?plan=' + encodeURIComponent(pkg.id) + '">' +
              'Pesan Paket Ini' +
              '<img class="icon icon--sm" src="' + BASE + 'assets/icons/arrow-right.svg" alt="" width="16" height="16" aria-hidden="true">' +
            '</a>' +
            '<a class="btn btn--ghost btn--block" href="' + BASE + 'subscription/index.html">' +
              '<img class="icon icon--sm" src="' + BASE + 'assets/icons/arrow-left.svg" alt="" width="16" height="16" aria-hidden="true">' +
              'Kembali ke Daftar Paket' +
            '</a>' +
          '</div>' +
        '</aside>' +

        '<div class="plan-detail__main">' +
          promoInfoHtml +

          '<section class="plan-detail__section">' +
            '<h2 class="plan-detail__section-title">Benefit paket ' + escapeHtml(pkg.nama) + '</h2>' +
            '<ul class="plan-benefits">' + directHtml + '</ul>' +
            inheritedHtml +
          '</section>' +

          '<section class="plan-detail__section">' +
            '<h2 class="plan-detail__section-title">Masa akses</h2>' +
            '<p class="about-card__text">' + escapeHtml(pkg.masa) + '</p>' +
          '</section>' +

          '<section class="plan-detail__section">' +
            '<h2 class="plan-detail__section-title">Pembatalan & Pengembalian Dana</h2>' +
            '<p class="about-card__text">Jika pelanggan membatalkan langganan sesuai dengan ketentuan yang berlaku, pengembalian dana diberikan berdasarkan paket yang digunakan.</p>' +
            '<p class="about-card__text" style="margin-top:12px;"><strong style="color:var(--text);">Paket ' + escapeHtml(pkg.nama) + ':</strong> ' + escapeHtml(refundHtml) + '</p>' +
            '<p class="about-card__text" style="margin-top:12px;">Persentase pengembalian dana dihitung berdasarkan nominal pembayaran yang memenuhi syarat pengembalian sesuai ketentuan pembatalan.</p>' +
          '</section>' +

          '<section class="plan-detail__section">' +
            '<h2 class="plan-detail__section-title">Catatan</h2>' +
            '<p class="about-card__text">Halaman ini merupakan halaman informasi paket. Website AppHub.ID belum memiliki sistem pembayaran otomatis. Untuk pemesanan, silakan lanjut ke halaman konfirmasi pemesanan.</p>' +
          '</section>' +
        '</div>' +
      '</div>';
  }

  /* ----------------------------------------------------------------------
     Render paket — Checkout
     ---------------------------------------------------------------------- */
  function renderPlanCheckout() {
    var host = qs('[data-plan-checkout]');
    if (!host) return;

    var planId = getQueryParam('plan');
    var pkg = planId ? PACKAGES[planId.toLowerCase()] : null;

    if (!pkg) {
      renderEmptyState(host, 'Paket tidak ditemukan',
        'Parameter paket tidak valid atau tidak dikenali.',
        BASE + 'subscription/index.html', 'Kembali ke Daftar Paket');
      return;
    }

    var promoActive = isPromoActive();
    var hasPromo = promoActive && pkg.harga.promo !== null && pkg.harga.promo !== undefined;
    var priceMain = hasPromo ? pkg.harga.promo : pkg.harga.normal;
    var priceUsd = hasPromo ? pkg.harga.promoUsd : pkg.harga.normalUsd;
    var duration = hasPromo ? pkg.harga.masaPromo : pkg.harga.masaNormal;

    document.title = 'Pemesanan Paket ' + pkg.nama + ' — AppHub.ID';
    var crumbCurrent = qs('[data-plan-crumb]');
    if (crumbCurrent) crumbCurrent.textContent = 'Pemesanan ' + pkg.nama;
    var headerTitle = qs('[data-plan-title]');
    if (headerTitle) headerTitle.textContent = 'Konfirmasi Pemesanan — ' + pkg.nama;

    /* Ringkasan harga */
    var priceSummary = '';
    if (pkg.harga.normal === 0) {
      priceSummary = '<span class="checkout__total-value">Gratis</span>';
    } else {
      priceSummary = '<span class="checkout__total-value">' + formatRupiah(priceMain) + '</span>';
    }

    var normalRow = '';
    if (hasPromo) {
      normalRow =
        '<div class="checkout__row"><span>Harga normal</span><strong>' + formatRupiah(pkg.harga.normal) + '</strong></div>' +
        '<div class="checkout__row"><span>Harga promo</span><strong>' + formatRupiah(pkg.harga.promo) + '</strong></div>' +
        '<div class="checkout__row"><span>Masa akses promo</span><strong>' + escapeHtml(pkg.harga.masaPromo) + '</strong></div>';
    } else if (pkg.harga.normal > 0) {
      normalRow =
        '<div class="checkout__row"><span>Harga</span><strong>' + formatRupiah(pkg.harga.normal) + '</strong></div>' +
        '<div class="checkout__row"><span>Masa akses</span><strong>' + escapeHtml(pkg.harga.masaNormal) + '</strong></div>';
    }

    /* Benefit ringkas */
    var benefitPreview = pkg.benefit.slice(0, 5).map(function (text) {
      return '<li class="plan-benefit">' +
        '<img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true">' +
        '<span>' + escapeHtml(text) + '</span>' +
      '</li>';
    }).join('');

    if (pkg.inherits.length) {
      var inheritedNames = getAllInherited(pkg.id).map(function (p) { return p.nama; }).join(' + ');
      benefitPreview =
        '<li class="plan-benefit">' +
          '<img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true">' +
          '<span>Semua benefit dari ' + escapeHtml(inheritedNames) + '</span>' +
        '</li>' + benefitPreview;
    }

    /* Pesan WhatsApp dinamis */
    var waMessage = encodeURIComponent('Halo AppHub.ID, saya ingin berlangganan paket ' + pkg.nama + '.');
    var waHref = 'https://wa.me/6288970200455?text=' + waMessage;

    /* Email dinamis */
    var emailSubject = 'Pesanan Paket ' + pkg.nama + ' - AppHub.ID';
    var emailBody =
      'Halo AppHub.ID,\n\n' +
      'Saya ingin berlangganan paket ' + pkg.nama + '.\n\n' +
      'Rincian paket:\n' +
      '- Nama paket: ' + pkg.nama + '\n' +
      '- Harga: ' + (pkg.harga.normal === 0 ? 'Gratis' : formatRupiah(priceMain)) + '\n' +
      '- Masa akses: ' + duration + '\n\n' +
      'Mohon informasi lebih lanjut mengenai langkah selanjutnya.\n\nTerima kasih.';
    var mailHref = 'mailto:apphubid@gmail.com' +
      '?subject=' + encodeURIComponent(emailSubject) +
      '&body=' + encodeURIComponent(emailBody);

    /* Refund */
    var refundText = pkg.refund !== null && pkg.refund !== undefined
      ? pkg.refundLabel + ' dari nominal pembayaran yang memenuhi syarat pengembalian.'
      : 'Paket ini tidak memiliki ketentuan pengembalian dana.';

    host.innerHTML = '' +
      '<div class="checkout">' +
        '<div class="checkout__main">' +
          '<section class="checkout__panel">' +
            '<h2 class="plan-detail__section-title">Ringkasan benefit</h2>' +
            '<ul class="plan-benefits">' + benefitPreview + '</ul>' +
          '</section>' +

          '<section class="checkout__panel">' +
            '<h2 class="plan-detail__section-title">Ketentuan pembatalan & pengembalian dana</h2>' +
            '<p class="about-card__text">Jika pelanggan membatalkan langganan sesuai dengan ketentuan yang berlaku, pengembalian dana diberikan berdasarkan paket yang digunakan.</p>' +
            '<p class="about-card__text" style="margin-top:12px;"><strong style="color:var(--text);">Paket ' + escapeHtml(pkg.nama) + ':</strong> ' + escapeHtml(refundText) + '</p>' +
            '<p class="about-card__text" style="margin-top:12px;">Persentase pengembalian dana dihitung berdasarkan nominal pembayaran yang memenuhi syarat pengembalian sesuai ketentuan pembatalan.</p>' +
          '</section>' +

          '<section class="checkout__panel">' +
            '<h2 class="plan-detail__section-title">Cara menyelesaikan pemesanan</h2>' +
            '<p class="about-card__text">Website AppHub.ID belum memiliki sistem pembayaran otomatis. Untuk menyelesaikan pemesanan, silakan hubungi tim AppHub.ID melalui salah satu kanal di bawah ini.</p>' +
            '<ul class="plan-benefits" style="margin-top:16px;">' +
              '<li class="plan-benefit"><img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true"><span>Kirim pesan WhatsApp dengan paket yang sudah otomatis terisi.</span></li>' +
              '<li class="plan-benefit"><img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true"><span>Atau kirim email ke apphubid@gmail.com dengan subjek yang sudah terisi.</span></li>' +
              '<li class="plan-benefit"><img class="icon icon--sm" src="' + BASE + 'assets/icons/check.svg" alt="" width="16" height="16" aria-hidden="true"><span>Tim AppHub.ID akan memberikan informasi langkah selanjutnya.</span></li>' +
            '</ul>' +
          '</section>' +
        '</div>' +

        '<aside class="checkout__aside">' +
          '<div class="checkout__summary">' +
            '<div class="plan-card__head">' +
              '<span class="plan-card__icon">' +
                '<img class="icon" src="' + BASE + pkg.icon + '" alt="" width="26" height="26" aria-hidden="true">' +
              '</span>' +
              '<div>' +
                '<h2 class="plan-card__name">' + escapeHtml(pkg.nama) + '</h2>' +
                '<p class="plan-card__tagline">' + escapeHtml(pkg.tagline) + '</p>' +
              '</div>' +
            '</div>' +

            '<div>' +
              normalRow +
              '<div class="checkout__total">' +
                '<span class="checkout__total-label">Total</span>' +
                priceSummary +
              '</div>' +
              '<p class="plan-card__price-usd" style="margin-top:8px;">' + formatUsd(priceUsd) + '</p>' +
            '</div>' +

            (hasPromo
              ? '<p class="promo-notice" style="margin:0;">' +
                  '<img class="icon icon--sm" src="' + BASE + 'assets/icons/bell.svg" alt="" width="16" height="16" aria-hidden="true">' +
                  'Promo berlaku sampai ' + escapeHtml(getPromoEndLabel()) +
                '</p>'
              : '') +

            '<div class="checkout__actions">' +
              '<a class="btn btn--primary btn--block" href="' + waHref + '" target="_blank" rel="noopener noreferrer">' +
                '<img class="icon icon--sm" src="' + BASE + 'assets/icons/whatsapp.svg" alt="" width="16" height="16" aria-hidden="true">' +
                'Pesan via WhatsApp' +
              '</a>' +
              '<a class="btn btn--ghost btn--block" href="' + mailHref + '">' +
                '<img class="icon icon--sm" src="' + BASE + 'assets/icons/gmail.svg" alt="" width="16" height="16" aria-hidden="true">' +
                'Pesan via Email' +
              '</a>' +
              '<a class="btn btn--outline btn--block" href="' + BASE + 'subscription/detail.html?plan=' + encodeURIComponent(pkg.id) + '">' +
                '<img class="icon icon--sm" src="' + BASE + 'assets/icons/arrow-left.svg" alt="" width="16" height="16" aria-hidden="true">' +
                'Lihat Detail Paket' +
              '</a>' +
            '</div>' +

            '<p class="checkout__note">Website ini belum memiliki sistem pembayaran otomatis. Tidak ada transaksi yang diproses melalui website ini. Pemesanan dilakukan melalui kontak resmi AppHub.ID.</p>' +
          '</div>' +
        '</aside>' +
      '</div>';
  }

  /* ----------------------------------------------------------------------
     Empty state
     ---------------------------------------------------------------------- */
  function renderEmptyState(host, title, desc, backHref, backLabel) {
    host.innerHTML = '' +
      '<div class="empty-state">' +
        '<img class="empty-state__icon" src="' + BASE + 'assets/icons/x.svg" alt="" width="64" height="64" aria-hidden="true">' +
        '<h2 class="empty-state__title">' + escapeHtml(title) + '</h2>' +
        '<p class="empty-state__desc">' + escapeHtml(desc) + '</p>' +
        '<a class="btn btn--primary" href="' + backHref + '">' + escapeHtml(backLabel) + '</a>' +
      '</div>';
  }

  /* ----------------------------------------------------------------------
     Boot
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

        var page = document.body.getAttribute('data-page');
        if (page === 'home') renderPreviewPlans();
        if (page === 'subscription-index') renderPlansIndex();
        if (page === 'subscription-detail') renderPlanDetail();
        if (page === 'subscription-checkout') renderPlanCheckout();

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
