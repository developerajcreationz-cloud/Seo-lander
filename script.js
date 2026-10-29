(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -70, duration: 1.3 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var t = id.length > 1 && $(id);
      if (!t) return;
      e.preventDefault();
      scrollToEl(t);
      closeMenu();
    });
  });

  /* ---------- mobile nav ---------- */
  var burger = $('#burger'), links = $('#navLinks');
  function closeMenu() { links.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  /* ---------- reveal ---------- */
  var rv = $$('[data-rv]');
  var scards = $$('.scard');
  scards.forEach(function (c) { rv.push(c); c.setAttribute('data-rv', ''); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  rv.forEach(function (el) { io.observe(el); });

  /* ---------- count-up ---------- */
  var counters = $$('[data-count]');
  function run(el) {
    var end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    var t0 = performance.now(), dur = 1500;
    (function tick(now) {
      var p = Math.min((now - t0) / dur, 1);
      el.textContent = pre + Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if (!reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- scroll-driven effects ---------- */
  var nav = $('#nav'), bar = $('#progress');
  var hero = $('.hero'), hcards = $$('.hcard');
  var steps = $('#steps'), stepItems = $$('#steps li');
  var navLinks = $$('.nav__links a:not(.btn)');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  var stickyOK = function () { return window.innerWidth > 980; };

  function onScroll() {
    var y = window.pageYOffset, vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    nav.classList.toggle('scrolled', y > 10);

    // hero parallax
    if (!reduce && y < vh * 1.2 && window.innerWidth > 1180) {
      hcards.forEach(function (c) {
        var d = parseFloat(c.dataset.depth) || 0;
        c.style.translate = '0 ' + (y * d * -3) + 'px';
      });
    }

    // stacked cards: scale back as the next one covers them
    if (stickyOK() && !reduce) {
      scards.forEach(function (c, i) {
        var next = scards[i + 1];
        if (!next) return;
        var stick = 96 + i * 26;
        var gap = next.getBoundingClientRect().top - stick;
        var p = clamp(1 - gap / (vh * 0.55), 0, 1);
        c.style.transform = 'scale(' + (1 - p * 0.06) + ')';
        c.style.filter = p > 0 ? 'brightness(' + (1 - p * 0.05) + ')' : '';
      });
    } else {
      scards.forEach(function (c) { c.style.transform = ''; c.style.filter = ''; });
    }

    // process timeline
    if (steps) {
      var r = steps.getBoundingClientRect();
      var prog = clamp((vh * 0.75 - r.top) / (r.height + vh * 0.1), 0, 1);
      steps.style.setProperty('--p', prog.toFixed(3));
      var n = stepItems.length;
      stepItems.forEach(function (li, i) { li.classList.toggle('on', prog > (i + 0.2) / n || prog >= 1); });
    }

    // active nav link
    var cur = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * 0.4) cur = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
  }
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- hero mouse tilt ---------- */
  if (!reduce && window.matchMedia('(hover:hover)').matches && hero) {
    hero.addEventListener('mousemove', function (e) {
      var x = (e.clientX / window.innerWidth - 0.5), y = (e.clientY / window.innerHeight - 0.5);
      hcards.forEach(function (c, i) {
        var dir = i ? 1 : -1;
        c.style.rotate = (dir * (10 + x * 6)) + 'deg';
      });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (!reduce && window.matchMedia('(hover:hover)').matches) {
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- results slider ---------- */
  var track = $('#track'), slides = $$('.slide'), dotsEl = $('#dots');
  var prev = $('#prev'), next = $('#next'), idx = 0;
  slides.forEach(function (s, i) {
    var d = document.createElement('button');
    d.setAttribute('aria-label', 'Go to project ' + (i + 1));
    d.addEventListener('click', function () { go(i); });
    dotsEl.appendChild(d);
  });
  var dots = $$('button', dotsEl);
  function go(i) {
    i = clamp(i, 0, slides.length - 1);
    var s = slides[i];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2, behavior: 'smooth' });
  }
  function sync() {
    var c = track.scrollLeft + track.clientWidth / 2, best = 0, bd = 1e9;
    slides.forEach(function (s, i) {
      var d = Math.abs(s.offsetLeft + s.clientWidth / 2 - c);
      if (d < bd) { bd = d; best = i; }
    });
    idx = best;
    slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
    prev.disabled = idx === 0; next.disabled = idx === slides.length - 1;
  }
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  prev.addEventListener('click', function () { go(idx - 1); });
  next.addEventListener('click', function () { go(idx + 1); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
  });
  // mouse drag
  var down = false, sx = 0, sl = 0, moved = false;
  track.addEventListener('mousedown', function (e) { down = true; moved = false; sx = e.pageX; sl = track.scrollLeft; });
  window.addEventListener('mouseup', function () {
    if (!down) return;
    down = false; track.classList.remove('drag');
    if (moved) go(idx);
  });
  window.addEventListener('mousemove', function (e) {
    if (!down) return;
    var dx = e.pageX - sx;
    if (Math.abs(dx) > 5) { moved = true; track.classList.add('drag'); }
    if (moved) track.scrollLeft = sl - dx;
  });
  // wheel over slider should not hijack page scroll; lenis handles vertical
  if (lenis) track.setAttribute('data-lenis-prevent-touch', '');
  sync();

  /* ---------- lightbox ---------- */
  var lb = $('#lightbox'), lbImg = $('img', lb);
  $$('.shot').forEach(function (b) {
    b.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); moved = false; return; }
      lbImg.src = b.dataset.full;
      lbImg.alt = $('img', b).alt;
      lb.hidden = false;
      if (lenis) lenis.stop();
    });
  });
  function closeLb() { lb.hidden = true; if (lenis) lenis.start(); }
  lb.addEventListener('click', closeLb);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });


  /* ---------- interactive extras ---------- */
  var canHover = window.matchMedia('(hover:hover)').matches;

  // spotlight follows pointer on cards
  $$('[data-spot]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // 3D tilt
  if (!reduce && canHover) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // button ripple
  $$('.btn').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
      var d = document.createElement('span');
      d.className = 'ripple';
      d.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      b.appendChild(d);
      setTimeout(function () { d.remove(); }, 700);
    });
  });

  // cursor ring
  if (!reduce && canHover) {
    var ring = document.createElement('div');
    ring.className = 'cursor';
    document.body.appendChild(ring);
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; ring.classList.add('show'); });
    document.addEventListener('pointerleave', function () { ring.classList.remove('show'); });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      ring.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('pointerover', function (e) {
      ring.classList.toggle('big', !!e.target.closest('a,button,summary,.shot,[data-magnet]'));
    });
  }

  // hero orbs follow mouse a little
  var orbs = $$('.orb');
  if (!reduce && canHover && hero) {
    hero.addEventListener('mousemove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      orbs.forEach(function (o, i) { o.style.translate = (x * (i ? -90 : 90)) + 'px ' + (y * 60) + 'px'; });
    });
  }

  // AI answer typing loop
  var ans = $('.a');
  if (ans && !reduce) {
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = document.createDocumentFragment();
          n.textContent.split('').forEach(function (c) {
            var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; f.appendChild(s);
          });
          node.replaceChild(f, n);
        } else if (n.nodeType === 1) wrap(n);
      });
    })(ans);
    var chars = $$('.ch', ans), k = 0;
    function typeStep() {
      ans.classList.add('typing');
      if (k < chars.length) { chars[k++].classList.add('on'); setTimeout(typeStep, 28); }
      else { ans.classList.remove('typing'); setTimeout(function () { chars.forEach(function (c) { c.classList.remove('on'); }); k = 0; setTimeout(typeStep, 600); }, 5000); }
    }
    setTimeout(typeStep, 1800);
  }

  /* ---------- lead form ---------- */
  // TODO: point FORM_ENDPOINT at your form handler (Formspree, Make, Zapier, WordPress, etc.)
  var FORM_ENDPOINT = '';
  var form = $('#leadForm'), msg = $('#formMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'form__msg';
    var ok = true;
    ['name', 'email'].forEach(function (n) {
      var f = form.elements[n];
      var bad = !f.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('err', bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.textContent = 'Please enter your name and a valid email.'; msg.classList.add('bad'); return; }
    function done() {
      msg.textContent = 'Thanks! We’ll send your audit within 1–2 business days.';
      msg.classList.add('ok');
      form.reset();
    }
    if (!FORM_ENDPOINT) { done(); return; }
    fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
      .then(function (r) { if (!r.ok) throw 0; done(); })
      .catch(function () { msg.textContent = 'Something went wrong. Please try again.'; msg.classList.add('bad'); });
  });

  $('#yr').textContent = new Date().getFullYear();
})();
