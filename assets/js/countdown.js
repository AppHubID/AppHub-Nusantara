/* ==========================================================================
   AppHub.ID — countdown.js
   Hitung mundur real-time menuju peluncuran AppHub.ID.
   Target: 30 Desember 2026, 00:00 WIB (Asia/Jakarta, UTC+7).
   ========================================================================== */

(function () {
  'use strict';

  var LAUNCH_ISO = '2026-12-30T00:00:00+07:00';
  var LAUNCH_TIME = new Date(LAUNCH_ISO).getTime();
  var LAUNCH_LABEL = '30 Desember 2026, 00:00 WIB';

  var timers = [];

  function pad(value, length) {
    var str = String(Math.max(0, value));
    while (str.length < length) str = '0' + str;
    return str;
  }

  function formatNumber(value) { return pad(value, 2); }

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

    var previous = { days: null, hours: null, minutes: null, seconds: null };

    function setValue(el, value, key) {
      var text = formatNumber(value);
      if (el.textContent === text) return;

      el.textContent = text;

      if (previous[key] !== null) {
        el.classList.remove('is-ticking');
        void el.offsetWidth;
        el.classList.add('is-ticking');
      }

      previous[key] = value;
    }

    function markComplete() {
      if (gridEl) gridEl.hidden = true;

      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = 'Waktu peluncuran telah tiba. Selamat datang di AppHub.ID.';
      }

      root.classList.add('is-complete');
      stopAll();
    }

    function render() {
      var now = Date.now();
      var diff = LAUNCH_TIME - now;

      if (!isFinite(diff) || diff <= 0) { markComplete(); return; }

      var totalSeconds = Math.floor(diff / 1000);

      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      setValue(daysEl, days, 'days');
      setValue(hoursEl, hours, 'hours');
      setValue(minutesEl, minutes, 'minutes');
      setValue(secondsEl, seconds, 'seconds');
    }

    var initialDiff = LAUNCH_TIME - Date.now();

    if (!isFinite(initialDiff) || initialDiff <= 0) { markComplete(); return; }

    var initialSeconds = Math.floor(initialDiff / 1000);
    daysEl.textContent = formatNumber(Math.floor(initialSeconds / 86400));
    hoursEl.textContent = formatNumber(Math.floor((initialSeconds % 86400) / 3600));
    minutesEl.textContent = formatNumber(Math.floor((initialSeconds % 3600) / 60));
    secondsEl.textContent = formatNumber(initialSeconds % 60);

    previous.days = Math.floor(initialSeconds / 86400);
    previous.hours = Math.floor((initialSeconds % 86400) / 3600);
    previous.minutes = Math.floor((initialSeconds % 3600) / 60);
    previous.seconds = initialSeconds % 60;

    var intervalId = window.setInterval(render, 1000);
    timers.push(intervalId);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) render();
    });
  }

  function initAll() {
    var roots = document.querySelectorAll('[data-countdown]');
    Array.prototype.forEach.call(roots, initCountdown);
  }

  function boot() {
    var ready = window.AppHub && window.AppHub.ready ? window.AppHub.ready : Promise.resolve();
    ready.then(function () {
      initAll();
      console.info('[AppHub] Countdown aktif. Target: ' + LAUNCH_LABEL);
    });
  }

  window.addEventListener('pagehide', stopAll);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
