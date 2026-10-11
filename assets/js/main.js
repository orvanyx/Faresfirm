// main.js - mobile menu + footer year (loaded on every page)
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  }
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
