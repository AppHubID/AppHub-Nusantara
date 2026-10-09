/* =========================================================
   AppHub.ID — calculator.js
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'apphub.calc.v1';
  var config = { incomeCategories: [], expenseCategories: [] };

  /* ---------- Utilities ---------- */
  function getBasePath() {
    if (window.AppHub && window.AppHub.basePath) return window.AppHub.basePath;
    var meta = document.querySelector('meta[name="base-path"]');
    return meta && meta.content ? meta.content : './';
  }
  function parseNumber(v) {
    if (v === '' || v == null) return 0;
    var n = Number(String(v).replace(/[^\d.-]/g, ''));
    return isFinite(n) ? n : 0;
  }
  function formatRupiah(n) {
    if (!isFinite(n)) return 'Rp0';
    var abs = Math.abs(Math.round(n));
    var s = abs.toLocaleString('id-ID');
    return (n < 0 ? '-Rp' : 'Rp') + s;
  }
  function qs(s, sc) { return (sc || document).querySelector(s); }
  function qsa(s, sc) { return Array.prototype.slice.call((sc || document).querySelectorAll(s)); }
  function escapeHtml(value) {
    if (window.AppHub && window.AppHub.escapeHtml) return window.AppHub.escapeHtml(value);
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  /* ---------- Data load ---------- */
  function loadConfig() {
    var url = getBasePath() + 'data/calculator.json';
    return fetch(url, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        config.incomeCategories = Array.isArray(data.incomeCategories) ? data.incomeCategories : [];
        config.expenseCategories = Array.isArray(data.expenseCategories) ? data.expenseCategories : [];
      })
      .catch(function (err) {
        console.warn('[AppHub] calculator.json fallback:', err.message);
        config.incomeCategories = [{ id: 'gaji', label: 'Gaji / Pemasukan Utama' }];
        config.expenseCategories = [{ id: 'harian', label: 'Kebutuhan Harian' }];
      });
  }

  /* ---------- Expense rows ---------- */
  function createExpenseRow(categoryId, amount) {
    var wrap = document.createElement('div');
    wrap.className = 'expense-row';
    wrap.style.display = 'grid';
    wrap.style.gridTemplateColumns = '1fr 1fr auto';
    wrap.style.gap = '10px';
    wrap.style.marginBottom = '10px';

    var options = config.expenseCategories.map(function (c) {
      return '<option value="' + escapeHtml(c.id) + '"' + (c.id === categoryId ? ' selected' : '') + '>' + escapeHtml(c.label) + '</option>';
    }).join('');

    wrap.innerHTML =
      '<select class="field__select" data-exp-cat aria-label="Kategori pengeluaran">' + options + '</select>' +
      '<input class="field__input" type="number" min="0" step="1000" inputmode="numeric" placeholder="Jumlah (Rp)" value="' + (amount || '') + '" data-exp-amount aria-label="Jumlah pengeluaran">' +
      '<button type="button" class="btn btn--ghost btn--sm" data-exp-remove aria-label="Hapus baris pengeluaran">' +
        '<img class="icon icon--sm" src="' + getBasePath() + 'assets/icons/x.svg" alt="" width="16" height="16" aria-hidden="true">' +
      '</button>';

    wrap.querySelector('[data-exp-remove]').addEventListener('click', function () {
      wrap.parentNode && wrap.parentNode.removeChild(wrap);
      recalc();
      saveState();
    });
    wrap.querySelectorAll('input, select').forEach(function (el) {
      el.addEventListener('input', function () { recalc(); saveState(); });
      el.addEventListener('change', function () { recalc(); saveState(); });
    });

    return wrap;
  }

  /* ---------- Calc ---------- */
  function readState() {
    var income = qs('#calcIncome') ? parseNumber(qs('#calcIncome').value) : 0;
    var target = qs('#calcTarget') ? parseNumber(qs('#calcTarget').value) : 0;
    var saved  = qs('#calcSaved') ? parseNumber(qs('#calcSaved').value) : 0;
    var expenses = qsa('[data-exp-amount]').map(function (input) {
      var row = input.closest('.expense-row');
      var catSelect = row ? row.querySelector('[data-exp-cat]') : null;
      return {
        category: catSelect ? catSelect.value : '',
        amount: parseNumber(input.value)
      };
    });
    return { income: income, target: target, saved: saved, expenses: expenses };
  }

  function recalc() {
    var s = readState();
    var totalExpense = s.expenses.reduce(function (a, b) { return a + b.amount; }, 0);
    var balance = s.income - totalExpense;
    var ratio = s.income > 0 ? Math.round((totalExpense / s.income) * 100) : 0;
    var remainingTarget = Math.max(0, s.target - s.saved);
    var monthlyCap = Math.max(0, balance);
    var months = remainingTarget > 0 && monthlyCap > 0
      ? Math.ceil(remainingTarget / monthlyCap)
      : null;

    var el = function (id) { return qs('#' + id); };
    if (el('calcTotalIncome'))  el('calcTotalIncome').textContent  = formatRupiah(s.income);
    if (el('calcTotalExpense')) el('calcTotalExpense').textContent = formatRupiah(totalExpense);
    if (el('calcBalance'))      el('calcBalance').textContent      = formatRupiah(balance);
    if (el('calcRatio'))        el('calcRatio').textContent        = ratio + '%';
    if (el('calcTargetRemain')) el('calcTargetRemain').textContent = formatRupiah(remainingTarget);

    var estEl = el('calcEstimate');
    if (estEl) {
      if (!s.target || remainingTarget === 0) estEl.textContent = 'Target belum diisi atau sudah tercapai.';
      else if (!monthlyCap) estEl.textContent = 'Sisa saldo bulanan belum mencukupi untuk menabung.';
      else estEl.textContent = months + ' bulan (asumsi menabung ' + formatRupiah(monthlyCap) + '/bulan).';
    }

    var ratioEl = el('calcRatioBar');
    if (ratioEl) {
      var width = Math.max(0, Math.min(100, ratio));
      ratioEl.style.width = width + '%';
      ratioEl.style.background = ratio > 100 ? 'var(--danger)' : 'linear-gradient(90deg, var(--brand), var(--brand-2))';
    }
  }

  /* ---------- Persistence ---------- */
  function saveState() {
    try {
      var s = readState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) { /* storage mungkin disabled */ }
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function applyState(s) {
    if (!s) return;
    if (qs('#calcIncome') && s.income != null) qs('#calcIncome').value = s.income || '';
    if (qs('#calcTarget') && s.target != null) qs('#calcTarget').value = s.target || '';
    if (qs('#calcSaved')  && s.saved  != null) qs('#calcSaved').value  = s.saved  || '';
    var container = qs('#expenseList');
    if (container) {
      container.innerHTML = '';
      var list = Array.isArray(s.expenses) && s.expenses.length ? s.expenses : [{ category: '', amount: '' }];
      list.forEach(function (row) {
        container.appendChild(createExpenseRow(row.category, row.amount));
      });
    }
  }

  /* ---------- Init ---------- */
  function init() {
    if (!qs('#calcForm')) return;

    loadConfig().then(function () {
      var saved = loadState();
      if (saved) applyState(saved);
      else if (qs('#expenseList')) {
        qs('#expenseList').innerHTML = '';
        qs('#expenseList').appendChild(createExpenseRow('', ''));
      }

      var addBtn = qs('#addExpense');
      if (addBtn) addBtn.addEventListener('click', function () {
        qs('#expenseList').appendChild(createExpenseRow('', ''));
        recalc();
        saveState();
      });

      ['#calcIncome', '#calcTarget', '#calcSaved'].forEach(function (sel) {
        var el = qs(sel);
        if (el) {
          el.addEventListener('input', function () { recalc(); saveState(); });
          el.addEventListener('change', function () { recalc(); saveState(); });
        }
      });

      var resetBtn = qs('#resetCalc');
      if (resetBtn) resetBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!window.confirm('Hapus semua data yang tersimpan di peramban Anda?')) return;
        clearState();
        qsa('#calcForm input').forEach(function (i) { i.value = ''; });
        var list = qs('#expenseList');
        if (list) { list.innerHTML = ''; list.appendChild(createExpenseRow('', '')); }
        recalc();
      });

      recalc();
    });
  }

  var ready = (window.AppHub && window.AppHub.ready) ? window.AppHub.ready : Promise.resolve();
  ready.then(init);
})();