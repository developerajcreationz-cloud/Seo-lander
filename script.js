(function () {
  // mobile nav
  var burger = document.getElementById('burger');
  var links = document.getElementById('navLinks');
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  // tabs
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  function activate(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { activate(t); });
    t.addEventListener('keydown', function (e) {
      var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!n) return;
      var next = tabs[(i + n + tabs.length) % tabs.length];
      activate(next);
      next.focus();
    });
  });

  // reveal on scroll
  var rv = document.querySelectorAll('.sec__head,.panel.is-active,.case,.feat,.steps li,.faq details,.form');
  rv.forEach(function (el) { el.classList.add('rv'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  // count-up
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var counters = document.querySelectorAll('[data-count]');
  function run(el) {
    var end = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    var t0 = performance.now(), dur = 1400;
    (function tick(now) {
      var p = Math.min((now - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = pre + v + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // lightbox
  var lb = document.getElementById('lightbox');
  var lbImg = lb.querySelector('img');
  document.querySelectorAll('.shot').forEach(function (b) {
    b.addEventListener('click', function () {
      lbImg.src = b.dataset.full;
      lbImg.alt = b.querySelector('img').alt;
      lb.hidden = false;
    });
  });
  lb.addEventListener('click', function () { lb.hidden = true; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });

  // lead form
  // TODO: point FORM_ENDPOINT at your form handler (Formspree, Make, Zapier, WordPress, etc.)
  var FORM_ENDPOINT = '';
  var form = document.getElementById('leadForm');
  var msg = document.getElementById('formMsg');
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

  document.getElementById('yr').textContent = new Date().getFullYear();
})();
