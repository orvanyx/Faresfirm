/* freddy.js - Freddy the guide bot: part 1 = avatar renderer, part 2 = behaviour. Needs freddy-data.js loaded first. */
/* ==========================================================
   avatar.js - tiny renderer for a *.avatar.json definition
   (schema "bible-strong/avatar-definition", v1).
   Draws the cube head, ears and eyes with CSS 3D and plays the
   named animations (expression steps, hold, smooth transition,
   blinking, eye "shake" and body "slowDrift"/"shake" motion).

   Usage:
     const a = new FreddyAvatar(hostElement, window.FREDDY_AVATAR, { size: 150 });
     a.play('happy');  a.setLook(-1..1, -1..1);  a.setExtra({hx, hy, hz});
   ========================================================== */
(function (global) {
  'use strict';

  var SCENE_W = 280, SCENE_H = 250, CX = 140, CY = 135;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var ease = { smooth: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; } };

  function shade(hex, f) {
    var n = parseInt(hex.replace('#', ''), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var m = function (c) { return Math.round(clamp(f < 1 ? c * f : c + (255 - c) * (f - 1), 0, 255)); };
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  function el(cls, parent) {
    var d = document.createElement('div');
    d.className = cls;
    if (parent) parent.appendChild(d);
    return d;
  }
  // flat numeric vector so two expressions can be blended
  function vecOf(e) {
    var L = e.eyes.left, R = e.eyes.right;
    return [e.head.x, e.head.y, e.head.z, e.eyes.spacing,
      L.width, L.height, L.x, L.y, L.angle,
      R.width, R.height, R.x, R.y, R.angle];
  }

  function FreddyAvatar(host, def, opts) {
    opts = opts || {};
    this.def = def;
    this.host = host;
    this.reduced = !!opts.reducedMotion;
    this.look = { x: 0, y: 0, tx: 0, ty: 0 };
    this.extra = { hx: 0, hy: 0, hz: 0 };
    this.lift = 0;
    this.motion = { eyes: 'none', body: 'none' };
    this.animName = null;
    this.anim = null;
    this.step = 0;
    this.phase = 'hold';
    this.build(opts.size || 150);

    this.cur = vecOf(def.expressions.neutral);
    this.from = this.cur.slice();
    this.to = this.cur.slice();
    this.t0 = 0; this.dur = 1; this.holdEnd = 0;
    this.blinkStart = -1e9; this.nextBlink = 1500;
    this._loop = this._loop.bind(this);
    this.raf = requestAnimationFrame(this._loop);
  }

  FreddyAvatar.prototype.build = function (size) {
    var def = this.def, p = def.body.primary, c = def.colors.body;
    var host = this.host;
    host.innerHTML = '';
    host.classList.add('fa-host');
    this.setSize(size);

    this.scene = el('fa-scene', host);
    this.floater = el('fa-float', this.scene);
    this.head = el('fa-head', this.floater);

    // layered, rounded slabs give the cube real thickness when it rotates
    var self = this;
    function slabs(w, h, d, round, x, y, z, n, front) {
      var r = Math.min(w, h) / 2 * round;
      for (var i = 0; i < n; i++) {
        var t = n === 1 ? 1 : i / (n - 1);
        var s = el('fa-slab', self.head);
        s.style.width = w + 'px'; s.style.height = h + 'px';
        s.style.marginLeft = -w / 2 + 'px'; s.style.marginTop = -h / 2 + 'px';
        s.style.borderRadius = r + 'px';
        s.style.background = shade(c, 0.62 + 0.38 * t);
        s.style.transform = 'translate3d(' + x + 'px,' + y + 'px,' + (z - d / 2 + d * t) + 'px)';
        if (i === n - 1 && front) {
          s.style.background = 'radial-gradient(circle at 34% 24%, rgba(255,255,255,.26), rgba(255,255,255,0) 58%), ' + c;
        }
      }
    }
    // ears (body.nodes) first, then the head so the head sorts in front
    (def.body.nodes || []).forEach(function (n) {
      var s = n.surface;
      slabs(s.width, s.height, s.depth, 1, n.position[0], n.position[1], n.position[2], 7, false);
      var inner = el('fa-ear-inner', self.head);
      var iw = s.width * 0.52, ih = s.height * 0.52;
      inner.style.width = iw + 'px'; inner.style.height = ih + 'px';
      inner.style.marginLeft = -iw / 2 + 'px'; inner.style.marginTop = -ih / 2 + 'px';
      inner.style.background = shade(c, 0.74);
      inner.style.transform = 'translate3d(' + n.position[0] + 'px,' + n.position[1] + 'px,' + (n.position[2] + s.depth / 2 + 1) + 'px)';
    });
    slabs(p.width, p.height, p.depth, p.roundness, 0, 0, 0, 26, true);

    this.face = el('fa-face', this.head);
    this.face.style.transform = 'translateZ(' + (p.depth / 2 + 2) + 'px)';
    this.eyeL = el('fa-eye', this.face);
    this.eyeR = el('fa-eye', this.face);
    this.eyeL.style.background = this.eyeR.style.background = def.colors.eyes;
  };

  FreddyAvatar.prototype.setSize = function (size) {
    var s = size / SCENE_W;
    this.host.style.width = size + 'px';
    this.host.style.height = SCENE_H * s + 'px';
    this.host.style.setProperty('--fa-scale', s);
  };

  FreddyAvatar.prototype.setLook = function (x, y) {
    this.look.tx = clamp(x, -1, 1);
    this.look.ty = clamp(y, -1, 1);
  };
  FreddyAvatar.prototype.setExtra = function (e) {
    this.extra.hx = e.hx || 0; this.extra.hy = e.hy || 0; this.extra.hz = e.hz || 0;
    this.lift = e.lift || 0;
  };

  FreddyAvatar.prototype.play = function (name) {
    var a = this.def.animations[name];
    if (!a || name === this.animName) return;
    this.animName = name;
    this.anim = a;
    this.step = -1;
    this._advance(performance.now(), true);
  };

  FreddyAvatar.prototype._advance = function (now, first) {
    var steps = this.anim.steps;
    this.step = (this.step + 1) % steps.length;
    var s = steps[this.step];
    var e = this.def.expressions[s.expression] || this.def.expressions.neutral;
    this.from = this.cur.slice();
    this.to = vecOf(e);
    this.motion = e.motion || { eyes: 'none', body: 'none' };
    this.t0 = now;
    this.dur = this.reduced ? 1 : Math.max(60, first ? Math.min(s.transitionMs, 420) : s.transitionMs);
    this.holdMs = s.holdMs;
    this.phase = 'move';
    var b = this.anim.blink;
    if (first && b) this.nextBlink = now + (b.initialDelayMs || 1200);
  };

  FreddyAvatar.prototype._blinkAmount = function (now) {
    var b = this.anim && this.anim.blink;
    if (!b || !b.enabled || this.reduced) return 0;
    if (now >= this.nextBlink) {
      this.blinkStart = now;
      this.nextBlink = now + b.minIntervalMs + Math.random() * (b.maxIntervalMs - b.minIntervalMs);
    }
    var t = (now - this.blinkStart) / b.durationMs;
    return t >= 0 && t <= 1 ? Math.sin(Math.PI * t) : 0;
  };

  FreddyAvatar.prototype._loop = function (now) {
    // expression state machine
    if (this.anim) {
      if (this.phase === 'move') {
        var p = clamp((now - this.t0) / this.dur, 0, 1), k = ease.smooth(p);
        for (var i = 0; i < this.cur.length; i++) this.cur[i] = this.from[i] + (this.to[i] - this.from[i]) * k;
        if (p >= 1) { this.phase = 'hold'; this.holdEnd = now + this.holdMs; }
      } else if (now >= this.holdEnd && !this.reduced) {
        this._advance(now, false);
      }
    }
    // smooth look-at
    this.look.x += (this.look.tx - this.look.x) * 0.12;
    this.look.y += (this.look.ty - this.look.y) * 0.12;

    var v = this.cur, sec = now / 1000, still = this.reduced;
    var drift = !still && this.motion.body === 'slowDrift' ? Math.sin(sec * 0.9) * 4 : 0;
    var bshake = !still && this.motion.body === 'shake' ? Math.sin(sec * 38) * 2.2 : 0;
    var eshake = !still && this.motion.eyes === 'shake' ? Math.sin(sec * 46) * 2.6 : 0;
    var bob = still ? 0 : Math.sin(sec * 1.6) * 3;

    // CSS rotateX(+) looks up and rotateY(+) looks left, hence the minus signs for "look at pointer"
    var hx = v[0] - this.look.y * 9 + this.extra.hx;
    var hy = v[1] - this.look.x * 13 + this.extra.hy + drift;
    var hz = v[2] + this.extra.hz + bshake;
    this.head.style.transform = 'rotateX(' + hx + 'deg) rotateY(' + hy + 'deg) rotateZ(' + hz + 'deg)';
    this.floater.style.transform = 'translateY(' + (bob + this.lift) + 'px)';

    var hs = 1 - this._blinkAmount(now) * 0.92, lx = this.look.x * 6 + eshake, ly = this.look.y * 5;
    this._eye(this.eyeL, v[4], v[5] * hs, -v[3] + v[6] + lx, v[7] + ly, v[8]);
    this._eye(this.eyeR, v[9], v[10] * hs, v[3] + v[11] + lx, v[12] + ly, v[13]);

    this.raf = requestAnimationFrame(this._loop);
  };

  FreddyAvatar.prototype._eye = function (n, w, h, x, y, a) {
    n.style.width = w + 'px';
    n.style.height = h + 'px';
    n.style.transform = 'translate(' + (x - w / 2) + 'px,' + (y - h / 2) + 'px) rotate(' + a + 'deg)';
  };

  FreddyAvatar.prototype.destroy = function () { cancelAnimationFrame(this.raf); this.host.innerHTML = ''; };

  global.FreddyAvatar = FreddyAvatar;
})(window);

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
  var touch = window.matchMedia('(hover: none)').matches;
  var root = document.getElementById('freddy');
  if (!root) return;

  var host = root.querySelector('.bot-avatar');
  var bubble = root.querySelector('.bot-bubble');
  var bubbleText = root.querySelector('.bot-text');
  var toggle = root.querySelector('.bot-toggle');

  function sizeFor() { return window.innerWidth < 700 ? 84 : 128; }
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
    say(touch ? 'Tap any button and I will tell you what it does.' : 'Hover over any button and I will tell you what it does.', 4000);
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
          if (hi && !hoverEl && !en.target.__told) { en.target.__told = true; say(hi, 3800); }
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

  /* ---------- intro (full greeting only on the first page of a visit) ---------- */
  var seen = false;
  try { seen = sessionStorage.getItem('freddy-seen') === '1'; sessionStorage.setItem('freddy-seen', '1'); } catch (e) {}
  avatar.play('sleeping');
  setTimeout(function () {
    avatar.play('waking');
    setTimeout(function () {
      avatar.play(sectionMood);
      if (!seen) say(touch ? 'Hi, I am Freddy. Tap a button and I will explain it.' : 'Hi, I am Freddy. Hover over any button and I will explain it.', 5500);
    }, 900);
  }, seen ? 200 : 700);
  poke();
})();
