/* site.js - tabs, gallery filter and lightbox (only runs where those elements exist) */
(function () {
  'use strict';

  /* ---- tabs: arrow keys, #hash deep links ---- */
  var list = document.querySelector('[role="tablist"]');
  if (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
      if (history.replaceState) history.replaceState(null, '', '#' + tab.getAttribute('aria-controls'));
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
    var wanted = location.hash.slice(1);
    select(tabs.filter(function (t) { return t.getAttribute('aria-controls') === wanted; })[0] || tabs[0], false);
    // links elsewhere on the page that point at a tab (e.g. "#gallery")
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      var t = tabs.filter(function (x) { return '#' + x.getAttribute('aria-controls') === a.getAttribute('href'); })[0];
      if (t) a.addEventListener('click', function () { select(t, false); });
    });
  }

  /* ---- gallery filter by brand ---- */
  var filters = document.querySelectorAll('.filters button');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var f = btn.getAttribute('data-filter');
      document.querySelectorAll('.gallery figure').forEach(function (fig) {
        fig.hidden = f !== 'all' && fig.getAttribute('data-brand') !== f;
      });
    });
  });

  /* ---- lightbox ---- */
  var box = document.getElementById('lightbox');
  if (box && box.showModal) {
    var img = box.querySelector('img'), title = box.querySelector('.cap b'), sub = box.querySelector('.cap span');
    document.querySelectorAll('.shot').forEach(function (s) {
      s.addEventListener('click', function () {
        var i = s.querySelector('img');
        img.src = i.src; img.alt = i.alt;
        title.textContent = s.querySelector('span').textContent;
        sub.textContent = s.querySelector('small').textContent;
        box.showModal();
      });
    });
    box.querySelector('.close').addEventListener('click', function () { box.close(); });
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
  }
})();
