/* =========================================================
   AppHub.ID — survey.js
   ========================================================= */
(function () {
  'use strict';

  var GMAIL_TO = 'apphubid@gmail.com';
  var GMAIL_SUBJECT = 'Survei AppHub.ID';
  var ESSAY_MAX = 800; // limit karakter per essay untuk menjaga URL

  var state = {
    data: null,
    answers: {},
    essay: {},
    respondentEmail: ''
  };

  function getBasePath() {
    if (window.AppHub && window.AppHub.basePath) return window.AppHub.basePath;
    var meta = document.querySelector('meta[name="base-path"]');
    return meta && meta.content ? meta.content : './';
  }
  function qs(s, sc) { return (sc || document).querySelector(s); }
  function qsa(s, sc) { return Array.prototype.slice.call((sc || document).querySelectorAll(s)); }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ---------- Render ---------- */
  function renderQuestions(data, root) {
    var sections = Array.isArray(data.sections) ? data.sections : [];
    if (!sections.length && Array.isArray(data.questions)) {
      sections = [{ title: 'Pertanyaan', questions: data.questions }];
    }

    var html = '';
    var n = 1;
    sections.forEach(function (section) {
      html += '<section class="survey-section">';
      html += '<h2 class="survey-section__title">' + escapeHtml(section.title || '') + '</h2>';

      section.questions.forEach(function (q) {
        html += renderQuestion(q, n);
        n++;
      });
      html += '</section>';
    });

    root.innerHTML = html;
  }

  function renderQuestion(q, idx) {
    var req = q.required ? '<span class="question__req" aria-hidden="true">*</span>' : '';
    var id = 'q-' + q.id;

    var body = '';
    if (q.type === 'essay') {
      body = '' +
        '<textarea class="field__textarea" id="' + id + '" data-qid="' + escapeHtml(q.id) + '" maxlength="' + ESSAY_MAX + '" placeholder="' + escapeHtml(q.placeholder || 'Tuliskan jawaban Anda…') + '"' + (q.required ? ' required' : '') + '></textarea>' +
        '<p class="field__hint">Maksimal ' + ESSAY_MAX + ' karakter.</p>';
    } else if (q.type === 'scale') {
      var from = Number(q.min) || 1;
      var to = Number(q.max) || 5;
      var scaleHtml = '';
      for (var v = from; v <= to; v++) {
        var vId = id + '-' + v;
        scaleHtml +=
          '<div class="question__scale-item">' +
            '<input type="radio" name="' + id + '" id="' + vId + '" value="' + v + '" data-qid="' + escapeHtml(q.id) + '"' + (q.required ? ' required' : '') + '>' +
            '<label for="' + vId + '">' + v + '</label>' +
          '</div>';
      }
      body = '<div class="question__scale" role="radiogroup" aria-label="' + escapeHtml(q.text) + '">' + scaleHtml + '</div>';
    } else {
      var opts = Array.isArray(q.options) ? q.options : [];
      body = '<div class="question__options">' + opts.map(function (o, i) {
        var optId = id + '-' + i;
        return '' +
          '<label class="question__option" for="' + optId + '">' +
            '<input type="radio" name="' + id + '" id="' + optId + '" value="' + escapeHtml(o.value || o.label || o) + '" data-qid="' + escapeHtml(q.id) + '"' + (q.required ? ' required' : '') + '>' +
            '<span>' + escapeHtml(o.label || o) + '</span>' +
          '</label>';
      }).join('') + '</div>';
    }

    return '' +
      '<article class="question" data-question-id="' + escapeHtml(q.id) + '" data-required="' + (q.required ? 'true' : 'false') + '">' +
        '<span class="question__number">' + idx + '</span>' +
        '<h3 class="question__text">' + escapeHtml(q.text) + ' ' + req + '</h3>' +
        body +
        '<p class="question__error" data-q-error></p>' +
      '</article>';
  }

  /* ---------- Collect answers ---------- */
  function collect() {
    state.answers = {};
    state.essay = {};

    qsa('.question').forEach(function (qEl) {
      var qid = qEl.getAttribute('data-question-id');
      var essay = qEl.querySelector('textarea[data-qid]');
      if (essay) {
        state.essay[qid] = essay.value.trim();
        return;
      }
      var checked = qEl.querySelector('input[type="radio"]:checked');
      if (checked) state.answers[qid] = checked.value;
    });

    var emailEl = qs('#respondentEmail');
    state.respondentEmail = emailEl ? emailEl.value.trim() : '';
  }

  /* ---------- Validation ---------- */
  function validate() {
    var firstError = null;
    var isValid = true;

    qsa('.question').forEach(function (qEl) {
      var required = qEl.getAttribute('data-required') === 'true';
      var errEl = qEl.querySelector('[data-q-error]');
      if (errEl) errEl.textContent = '';
      qEl.classList.remove('is-invalid');

      if (!required) return;

      var qid = qEl.getAttribute('data-question-id');
      var essay = qEl.querySelector('textarea[data-qid]');
      var isAnswered = essay ? essay.value.trim().length > 0 : !!qEl.querySelector('input[type="radio"]:checked');
      if (!isAnswered) {
        isValid = false;
        qEl.classList.add('is-invalid');
        if (errEl) errEl.textContent = 'Pertanyaan ini wajib diisi.';
        if (!firstError) firstError = qEl;
      }
    });

    var emailEl = qs('#respondentEmail');
    if (emailEl) {
      var emailErr = qs('#emailError');
      var v = emailEl.value.trim();
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (!v || !valid) {
        isValid = false;
        if (emailErr) emailErr.textContent = !v ? 'Email wajib diisi.' : 'Format email tidak valid.';
        if (!firstError) firstError = emailEl;
      } else if (emailErr) {
        emailErr.textContent = '';
      }
    }

    if (!isValid && firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return isValid;
  }

  /* ---------- Progress ---------- */
  function updateProgress() {
    var total = qsa('.question').length;
    var answered = 0;

    qsa('.question').forEach(function (qEl) {
      var essay = qEl.querySelector('textarea[data-qid]');
      if (essay) {
        if (essay.value.trim().length > 0) answered++;
      } else if (qEl.querySelector('input[type="radio"]:checked')) {
        answered++;
      }
    });

    var fill = qs('#surveyProgressFill');
    var text = qs('#surveyProgressText');
    var pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = answered + ' dari ' + total + ' terjawab (' + pct + '%)';
  }

  /* ---------- Email body ---------- */
  function buildEmailBody() {
    var lines = [];
    var data = state.data || {};
    var sections = Array.isArray(data.sections) ? data.sections : [];
    var flat = [];
    if (!sections.length && Array.isArray(data.questions)) flat = data.questions;
    else sections.forEach(function (s) { (s.questions || []).forEach(function (q) { flat.push(q); }); });

    lines.push('Survei AppHub.ID');
    lines.push('Versi website: ' + ((data.meta && data.meta.version) || '1.0.1.1.2v'));
    lines.push('Waktu pengisian: ' + new Date().toLocaleString('id-ID'));
    lines.push('Email responden: ' + (state.respondentEmail || '(tidak diisi)'));
    lines.push('');
    lines.push('===========================');
    lines.push('');

    var num = 1;
    flat.forEach(function (q) {
      var answer = '';
      if (q.type === 'essay') answer = state.essay[q.id] || '(kosong)';
      else answer = state.answers[q.id] || '(tidak dijawab)';
      lines.push(num + '. ' + q.text);
      lines.push('Jawaban: ' + answer);
      lines.push('');
      num++;
    });

    lines.push('---');
    lines.push('Dikirim melalui formulir Survei AppHub.ID.');
    return lines.join('\n');
  }

  /* ---------- Open Gmail ---------- */
  function openGmail() {
    var body = buildEmailBody();
    var url = 'https://mail.google.com/mail/?view=cm&fs=1&to=' +
              encodeURIComponent(GMAIL_TO) +
              '&su=' + encodeURIComponent(GMAIL_SUBJECT) +
              '&body=' + encodeURIComponent(body);

    var win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      var fallback = 'mailto:' + GMAIL_TO + '?subject=' + encodeURIComponent(GMAIL_SUBJECT) +
                     '&body=' + encodeURIComponent(body);
      window.location.href = fallback;
    }
  }

  function openMailto() {
    var body = buildEmailBody();
    window.location.href = 'mailto:' + GMAIL_TO +
      '?subject=' + encodeURIComponent(GMAIL_SUBJECT) +
      '&body=' + encodeURIComponent(body);
  }

  /* ---------- Show notice ---------- */
  function showSendNotice() {
    var box = qs('#surveySentNotice');
    if (!box) return;
    box.hidden = false;
    box.innerHTML =
      '<strong style="color:var(--text);">Draft email sudah dibuka.</strong>' +
      '<p class="field__hint" style="margin-top:6px;">' +
        'Formulir tidak mengirim email secara otomatis. Silakan periksa draft di Gmail, ' +
        'lalu tekan tombol <em>Kirim</em> pada halaman Gmail untuk benar-benar mengirimkan survei Anda.' +
      '</p>';
  }

  /* ---------- Bind ---------- */
  function bindActions(root) {
    root.addEventListener('input', function () { collect(); updateProgress(); });
    root.addEventListener('change', function () {
      collect();
      updateProgress();
      // highlight selected option
      qsa('.question__option').forEach(function (opt) {
        var input = opt.querySelector('input[type="radio"]');
        opt.classList.toggle('is-selected', !!(input && input.checked));
      });
    });

    var submitBtn = qs('#submitSurvey');
    if (submitBtn) submitBtn.addEventListener('click', function (e) {
      e.preventDefault();
      collect();
      if (!validate()) return;
      openGmail();
      showSendNotice();
    });

    var mailtoBtn = qs('#mailtoSurvey');
    if (mailtoBtn) mailtoBtn.addEventListener('click', function (e) {
      e.preventDefault();
      collect();
      if (!validate()) return;
      openMailto();
      showSendNotice();
    });

    var resetBtn = qs('#resetSurvey');
    if (resetBtn) resetBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!window.confirm('Kosongkan semua jawaban?')) return;
      qsa('#surveyForm input[type="radio"]').forEach(function (i) { i.checked = false; });
      qsa('#surveyForm textarea').forEach(function (t) { t.value = ''; });
      var em = qs('#respondentEmail'); if (em) em.value = '';
      state.answers = {}; state.essay = {}; state.respondentEmail = '';
      updateProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Init ---------- */
  function init() {
    var root = qs('#surveyForm');
    if (!root) return;
    var url = getBasePath() + 'data/survey.json';

    fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data || typeof data !== 'object') throw new Error('Data survei tidak valid.');
        state.data = data;
        renderQuestions(data, qs('#surveyQuestions'));
        updateProgress();
        bindActions(root);
      })
      .catch(function (err) {
        console.warn('[AppHub] survey.json:', err.message);
        var wrap = qs('#surveyQuestions');
        if (wrap) wrap.innerHTML =
          '<p class="state state--error">Data survei belum dapat dimuat saat ini. ' +
          'Silakan muat ulang halaman atau hubungi <a href="mailto:apphubid@gmail.com">apphubid@gmail.com</a>.</p>';
        var submit = qs('#submitSurvey'); if (submit) submit.disabled = true;
      });
  }

  var ready = (window.AppHub && window.AppHub.ready) ? window.AppHub.ready : Promise.resolve();
  ready.then(init);
})();