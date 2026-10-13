/* ==========================================================
   bot.js - Freddy, the guide bot.
   - floats bottom-right, lags behind scrolling (spring) and leans
   - looks at the pointer
   - explains any element that has data-bot="..." on hover / focus / touch
   - mood changes per section (data-mood) and per element (data-mood)
   - falls asleep after a while, wakes on activity
   ========================================================== */
(function () {
  'use strict';
  if (!window.FreddyAvatar || !window.FREDDY_AVATAR) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.getElementById('freddy');
  if (!root) return;

  var host = root.querySelector('.bot-avatar');
  var bubble = root.querySelector('.bot-bubble');
  var bubbleText = root.querySelector('.bot-text');
  var toggle = root.querySelector('.bot-toggle');

  function sizeFor() { return window.innerWidth < 760 ? 92 : 132; }
  var avatar = new FreddyAvatar(host, window.FREDDY_AVATAR, { size: sizeFor(), reducedMotion: reduced });
  window.addEventListener('resize', function () { avatar.setSize(sizeFor()); });

  var hintsOn = true;
  var sectionMood = 'curious';
  var hoverEl = null;
  var hideTimer = null, sleepTimer = null, touchTimer = null;
  var asleep = false;

  /* ---------- mood + speech ---------- */
  function rest() { avatar.play(asleep ? 'sleeping' : (hoverEl ? hoverEl.getAttribute('data-mood') || 'listening' : sectionMood)); }

  function say(text, ms) {
    if (!hintsOn) return;
    clearTimeout(hideTimer);
    bubbleText.textContent = text;
    bubble.classList.add('show');
    if (ms) hideTimer = setTimeout(function () { bubble.classList.remove('show'); }, ms);
  }
  function hush() {
    hideTimer = setTimeout(function () { bubble.classList.remove('show'); }, 160);
  }

  /* ---------- sleep / wake ---------- */
  function poke() {
    if (asleep) { asleep = false; avatar.play('waking'); setTimeout(rest, 900); }
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(function () {
      asleep = true; hoverEl = null; avatar.play('sleeping'); bubble.classList.remove('show');
    }, 30000);
  }
  ['pointermove', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, poke, { passive: true });
  });

  /* ---------- explain on hover / focus / touch ---------- */
  function enter(t) {
    var target = t.closest('[data-bot]');
    if (!target || target === hoverEl) return;
    hoverEl = target;
    avatar.play(target.getAttribute('data-mood') || 'listening');
    say(target.getAttribute('data-bot'));
  }
  function leave(t) {
    var target = t.closest('[data-bot]');
    if (!target || target !== hoverEl) return;
    hoverEl = null; rest(); hush();
  }
  document.addEventListener('mouseover', function (e) { enter(e.target); });
  document.addEventListener('mouseout', function (e) {
    if (!e.relatedTarget || !e.target.closest('[data-bot]') || !e.target.closest('[data-bot]').contains(e.relatedTarget)) leave(e.target);
  });
  document.addEventListener('focusin', function (e) { enter(e.target); });
  document.addEventListener('focusout', function (e) { leave(e.target); });
  document.addEventListener('touchstart', function (e) {
    var t = e.target.closest('[data-bot]');
    if (!t) return;
    enter(t);
    clearTimeout(touchTimer);
    touchTimer = setTimeout(function () { leave(t); }, 3000);
  }, { passive: true });

  /* ---------- hints on/off ---------- */
  toggle.addEventListener('click', function () {
    hintsOn = !hintsOn;
    toggle.setAttribute('aria-pressed', String(!hintsOn));
    toggle.textContent = hintsOn ? 'Hide hints' : 'Show hints';
    root.classList.toggle('quiet', !hintsOn);
    if (!hintsOn) bubble.classList.remove('show');
    else say('Hints are back on.', 2500);
  });
  host.addEventListener('click', function () {
    if (!hintsOn) return;
    say('Hover over any button and I will tell you what it does.', 4000);
    avatar.play('excited'); setTimeout(rest, 2200);
  });

  /* ---------- pointer: look at it ---------- */
  window.addEventListener('pointermove', function (e) {
    var r = host.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    avatar.setLook((e.clientX - cx) / (window.innerWidth * 0.5), (e.clientY - cy) / (window.innerHeight * 0.5));
  }, { passive: true });

  /* ---------- section mood ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          sectionMood = en.target.getAttribute('data-mood') || 'curious';
          if (!hoverEl && !asleep) avatar.play(sectionMood);
          var hi = en.target.getAttribute('data-bot-section');
          if (hi && !hoverEl) say(hi, 3800);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('[data-mood][data-section]').forEach(function (s) { io.observe(s); });
  }

  /* ---------- scroll-follow spring ---------- */
  var lastY = window.scrollY, pos = 0, vel = 0;
  function physics() {
    var y = window.scrollY, dy = y - lastY;
    lastY = y;
    vel += clamp(-dy * 0.18, -9, 9);          // lag behind the page
    vel += -pos * 0.06;                        // spring home
    vel *= 0.86;                               // damping
    pos = clamp(pos + vel, -70, 70);
    root.style.transform = 'translateY(' + pos.toFixed(1) + 'px)';
    avatar.setExtra({ hx: clamp(vel * 1.6, -16, 16), hz: clamp(vel * -0.9, -10, 10), lift: 0 });
    requestAnimationFrame(physics);
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  if (!reduced) requestAnimationFrame(physics);

  /* ---------- intro ---------- */
  avatar.play('sleeping');
  setTimeout(function () {
    avatar.play('waking');
    setTimeout(function () {
      avatar.play(sectionMood);
      say('Hi, I am Freddy. Hover over any button and I will explain it.', 5500);
    }, 900);
  }, 700);
  poke();
})();
