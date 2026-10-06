/* ==========================================================================
   AppHub.ID — countdown.js
   ========================================================================== */

(function () {
  'use strict';

  var LAUNCH_ISO = '2026-12-30T00:00:00+07:00';
  var LAUNCH_TIME = new Date(LAUNCH_ISO).getTime();
  var timers = [];

  function pad(v, len) {
    var s = String(Math.max(0, v));
    while (s.length < len) s = '0' + s;
    return s;
  }
  function fmt(v) { return pad(v, 2); }

  function stopAll() {
    timers.forEach(function (id) { window.clearInterval(id); });
    timers = [];
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

    var prev = { days: null, hours: null, minutes: null, seconds: null };

    function setVal(el, value, key) {
      var text = fmt(value);
      if (el.textContent === text) return;
      el.textContent = text;
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
      var diff = LAUNCH_TIME - Date.now();
      if (!isFinite(diff) || diff <= 0) { complete(); return; }
      var t = Math.floor(diff / 1000);
      setVal(daysEl, Math.floor(t / 86400), 'days');
      setVal(hoursEl, Math.floor((t % 86400) / 3600), 'hours');
      setVal(minutesEl, Math.floor((t % 3600) / 60), 'minutes');
      setVal(secondsEl, t % 60, 'seconds');
    }

    var initialDiff = LAUNCH_TIME - Date.now();
    if (!isFinite(initialDiff) || initialDiff <= 0) { complete(); return; }

    var initial = Math.floor(initialDiff / 1000);
    daysEl.textContent = fmt(Math.floor(initial / 86400));
    hoursEl.textContent = fmt(Math.floor((initial % 86400) / 3600));
    minutesEl.textContent = fmt(Math.floor((initial % 3600) / 60));
    secondsEl.textContent = fmt(initial % 60);
    prev.days = Math.floor(initial / 86400);
    prev.hours = Math.floor((initial % 86400) / 3600);
    prev.minutes = Math.floor((initial % 3600) / 60);
    prev.seconds = initial % 60;

    timers.push(window.setInterval(render, 1000));
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) render();
    });
  }

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-countdown]'), initCountdown);
  }

  function boot() {
    var ready = window.AppHub && window.AppHub.ready ? window.AppHub.ready : Promise.resolve();
    ready.then(initAll);
  }

  window.addEventListener('pagehide', stopAll);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
