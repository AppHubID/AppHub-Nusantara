/* =========================================================
   AppHub.ID — refresh.js
   ========================================================= */
(function () {
  'use strict';

  function getBasePath() {
    if (window.AppHub && window.AppHub.basePath) return window.AppHub.basePath;
    var meta = document.querySelector('meta[name="base-path"]');
    return meta && meta.content ? meta.content : './';
  }
  function qs(s, sc) { return (sc || document).querySelector(s); }

  function setStatus(id, type, text) {
    var el = qs('#' + id);
    if (!el) return;
    el.classList.remove('status-card--ok', 'status-card--warn', 'status-card--err');
    if (type === 'ok') el.classList.add('status-card--ok');
    if (type === 'warn') el.classList.add('status-card--warn');
    if (type === 'err') el.classList.add('status-card--err');
    var val = el.querySelector('.status-card__value');
    if (val) val.textContent = text;
  }

  function checkConnectivity() {
    setStatus('statusConn', navigator.onLine ? 'ok' : 'err',
      navigator.onLine ? 'Online' : 'Offline');
    var hint = qs('#statusConnHint');
    if (hint) hint.textContent = navigator.onLine
      ? 'Perangkat terhubung ke jaringan.'
      : 'Perangkat Anda sedang offline. Coba sambungkan kembali.';
  }

  function checkResource(url, id) {
    return fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r;
      })
      .then(function () { setStatus(id, 'ok', 'OK'); })
      .catch(function () { setStatus(id, 'err', 'Gagal dimuat'); });
  }

  function runResourceChecks() {
    var base = getBasePath();
    checkResource(base + 'assets/images/logo.png', 'statusLogo');
    checkResource(base + 'assets/css/style.css', 'statusCss');
    checkResource(base + 'assets/js/main.js', 'statusJs');
  }

  function bindActions() {
    var reloadBtn = qs('#btnReload');
    if (reloadBtn) reloadBtn.addEventListener('click', function () {
      reloadBtn.disabled = true;
      window.location.reload();
    });

    var recheckBtn = qs('#btnRecheck');
    if (recheckBtn) recheckBtn.addEventListener('click', function () {
      recheckBtn.disabled = true;
      setStatus('statusConn', 'warn', 'Memeriksa…');
      ['statusLogo', 'statusCss', 'statusJs'].forEach(function (id) {
        setStatus(id, 'warn', 'Memeriksa…');
      });
      checkConnectivity();
      runResourceChecks();
      setTimeout(function () { recheckBtn.disabled = false; }, 600);
    });
  }

  function init() {
    if (!qs('#refreshPanel')) return;
    checkConnectivity();
    runResourceChecks();
    bindActions();

    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);
  }

  var ready = (window.AppHub && window.AppHub.ready) ? window.AppHub.ready : Promise.resolve();
  ready.then(init);
})();