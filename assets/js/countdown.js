/* ==========================================================================
   AppHub.ID — countdown.js
   Countdown realtime menuju peluncuran 30 Desember 2026, 00:00 WIB.
   ========================================================================== */

(function () {
  'use strict';

  var TARGET_ISO = '2026-12-30T00:00:00+07:00';
  var TARGET_TIME = new Date(TARGET_ISO).getTime();
  var LAUNCH_MESSAGE = 'AppHub.ID Telah Resmi Diluncurkan';

  var timerId = null;
  var root = null;
  var nodes = null;
  var labelEl = null;
  var noteEl = null;

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function resolveElements() {
    root = document.querySelector('[data-countdown]');
    if (!root) return false;

    nodes = {
      days: root.querySelector('[data-unit="days"]'),
      hours: root.querySelector('[data-unit="hours"]'),
      minutes: root.querySelector('[data-unit="minutes"]'),
      seconds: root.querySelector('[data-unit="seconds"]')
    };

    labelEl = document.querySelector('[data-countdown-label]');
    noteEl = document.querySelector('[data-countdown-note]');

    return !!(nodes.days && nodes.hours && nodes.minutes && nodes.seconds);
  }

  function setLaunchedState() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }

    if (root) {
      root.classList.add('is-launched');
      root.innerHTML = '<p class="countdown-launched">' + LAUNCH_MESSAGE + '</p>';
    }

    if (labelEl) labelEl.textContent = 'Status Peluncuran';
    if (noteEl) noteEl.textContent = 'Terima kasih atas dukungan Anda terhadap AppHub.ID.';
  }

  function render() {
    if (!nodes) return;

    var diff = TARGET_TIME - Date.now();

    if (diff <= 0) {
      setLaunchedState();
      return;
    }

    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    nodes.days.textContent = pad(days);
    nodes.hours.textContent = pad(hours);
    nodes.minutes.textContent = pad(minutes);
    nodes.seconds.textContent = pad(seconds);
  }

  function init() {
    if (!resolveElements()) return;

    render();

    if (TARGET_TIME - Date.now() <= 0) {
      setLaunchedState();
      return;
    }

    if (timerId) window.clearInterval(timerId);
    timerId = window.setInterval(render, 1000);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) render();
    });
  }

  if (window.AppHub && window.AppHub.ready) {
    init();
  } else {
    document.addEventListener('apphub:ready', init);
  }
})();
