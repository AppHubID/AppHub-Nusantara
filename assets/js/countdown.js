/* =========================================================
   AppHub.ID — countdown.js
   ========================================================= */
(function () {
  'use strict';

  var TARGET_ISO = '2026-12-30T00:00:00+07:00';
  var TARGET_TS = new Date(TARGET_ISO).getTime();
  var intervals = [];

  function pad(v, len) {
    var s = String(Math.max(0, v));
    while (s.length < len) s = '0' + s;
    return s;
  }
  function fmt(v) { return pad(v, 2); }

  function stopAll() {
    intervals.forEach(function (id) { clearInterval(id); });
    intervals = [];
  }

  function initCountdown(root) {
    if (!root || root.getAttribute('data-countdown-ready') === 'true') return;

    var daysEl = root.querySelector('[data-unit="days"]');
    var hoursEl = root.querySelector('[data-unit="hours"]');
    var minutesEl = root.querySelector('[data-unit="minutes"]');
    var secondsEl = root.querySelector('[data-unit="seconds"]');
    var statusEl = root.querySelector('[data-countdown-status]');
    var gridEl = root.querySelector('.countdown__grid');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
    root.setAttribute('data-countdown-ready', 'true');

    var prev = { d: null, h: null, m: null, s: null };

    function setVal(el, value, key) {
      var t = fmt(value);
      if (el.textContent === t) return;
      el.textContent = t;
      if (prev[key] !== null) {
        el.classList.remove('is-ticking');
        void el.offsetWidth;
        el.classList.add('is-ticking');
      }
      prev[key] = value;
    }

    function complete() {
      if (gridEl) gridEl.hidden = true;
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = 'Waktu peluncuran telah tiba. Selamat datang di AppHub.ID.';
      }
      root.classList.add('is-complete');
      stopAll();
    }

    function render() {
      var diff = TARGET_TS - Date.now();
      if (!isFinite(diff) || diff <= 0) { complete(); return; }
      var total = Math.floor(diff / 1000);
      setVal(daysEl, Math.floor(total / 86400), 'd');
      setVal(hoursEl, Math.floor((total % 86400) / 3600), 'h');
      setVal(minutesEl, Math.floor((total % 3600) / 60), 'm');
      setVal(secondsEl, total % 60, 's');
    }

    var initial = Math.floor((TARGET_TS - Date.now()) / 1000);
    if (!isFinite(initial) || initial <= 0) { complete(); return; }

    daysEl.textContent = fmt(Math.floor(initial / 86400));
    hoursEl.textContent = fmt(Math.floor((initial % 86400) / 3600));
    minutesEl.textContent = fmt(Math.floor((initial % 3600) / 60));
    secondsEl.textContent = fmt(initial % 60);
    prev.d = Math.floor(initial / 86400);
    prev.h = Math.floor((initial % 86400) / 3600);
    prev.m = Math.floor((initial % 3600) / 60);
    prev.s = initial % 60;

    intervals.push(setInterval(render, 1000));

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) render();
    });
  }

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-countdown]'), initCountdown);
  }

  function boot() {
    var ready = (window.AppHub && window.AppHub.ready) ? window.AppHub.ready : Promise.resolve();
    ready.then(initAll);
  }

  window.addEventListener('pagehide', stopAll);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();