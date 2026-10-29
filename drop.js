/* Hero "drop-off" physics (Matter.js). Desktop only; falls back to the static cards otherwise. */
(function () {
  var hero = document.querySelector('.hero'), layer = hero && document.getElementById('drop');
  if (!hero || !layer || !window.Matter) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var mq = window.matchMedia('(min-width:1380px)');

  var M = Matter, Engine = M.Engine, Bodies = M.Bodies, Body = M.Body, Comp = M.Composite, Sleeping = M.Sleeping;
  var engine, items = [], walls = [], built = false, raf = 0, visible = true, drag = null;
  var els = [].slice.call(layer.querySelectorAll('.dobj'));

  function lanes() {
    var W = hero.clientWidth, H = hero.clientHeight;
    var top = hero.getBoundingClientRect().top + window.pageYOffset;
    var floor = Math.min(H - 12, window.innerHeight - top - 22);
    var copy = hero.querySelector('.hero__copy');
    var half = Math.min(copy.getBoundingClientRect().width / 2, 370) + 12;
    return { W: W, H: H, floor: floor, cx: W / 2, half: half };
  }
  function placeWalls() {
    var L = lanes();
    walls.forEach(function (w) { Comp.remove(engine.world, w); });
    var o = { isStatic: true, friction: 0.6, restitution: 0.2 }, T = 60, tall = L.H + 1400;
    walls = [
      Bodies.rectangle(L.cx, L.floor + T / 2, L.W + 400, T, o),
      Bodies.rectangle(-T / 2, L.H / 2 - 600, T, tall, o),
      Bodies.rectangle(L.W + T / 2, L.H / 2 - 600, T, tall, o),
      Bodies.rectangle(L.cx - L.half - T / 2, L.H / 2 - 600, T, tall, o),
      Bodies.rectangle(L.cx + L.half + T / 2, L.H / 2 - 600, T, tall, o)
    ];
    Comp.add(engine.world, walls);
  }
  function spawn(it, i) {
    var L = lanes(), left = i % 2 === 0;
    var lo = left ? 16 : L.cx + L.half + 16, hi = left ? L.cx - L.half - 16 : L.W - 16;
    var min = lo + it.w / 2, max = hi - it.w / 2;
    var x = max > min ? min + Math.random() * (max - min) : (lo + hi) / 2;
    var body = Bodies.rectangle(x, -it.h - 40 - Math.random() * 60, it.w, it.h, {
      chamfer: { radius: Math.min(16, it.h / 3) }, restitution: 0.42, friction: 0.5, frictionAir: 0.012, density: 0.0014,
      angle: (Math.random() - 0.5) * (it.w > 200 ? 0.2 : 0.8)
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * (it.w > 200 ? 0.02 : 0.08));
    it.body = body; it.added = true;
    Comp.add(engine.world, body);
    it.el.classList.add('on');
  }
  function frame() {
    if (!visible) { raf = 0; return; }
    Engine.update(engine, 1000 / 60);
    items.forEach(function (it) {
      if (!it.added) return;
      var p = it.body.position;
      it.el.style.transform = 'translate3d(' + (p.x - it.w / 2).toFixed(1) + 'px,' + (p.y - it.h / 2).toFixed(1) + 'px,0) rotate(' + it.body.angle.toFixed(4) + 'rad)';
    });
    raf = requestAnimationFrame(frame);
  }
  function loop() { if (!raf && visible && built) raf = requestAnimationFrame(frame); }

  function build() {
    hero.classList.add('phys');
    engine = Engine.create();
    engine.gravity.y = 1.15;
    placeWalls();
    items = els.map(function (el) { return { el: el, w: el.offsetWidth, h: el.offsetHeight, added: false }; });
    items.forEach(function (it, i) { setTimeout(function () { spawn(it, i); }, 600 + i * 420); });
    built = true; loop();
    bindDrag();
  }

  /* drag & throw */
  function bindDrag() {
    items.forEach(function (it) {
      it.el.addEventListener('pointerdown', function (e) {
        if (!it.added || e.button) return;
        e.preventDefault();
        it.el.setPointerCapture(e.pointerId);
        var hr = hero.getBoundingClientRect(), x = e.clientX - hr.left, y = e.clientY - hr.top;
        var b = it.body, dx = x - b.position.x, dy = y - b.position.y, c = Math.cos(-b.angle), s = Math.sin(-b.angle);
        var con = M.Constraint.create({ pointA: { x: x, y: y }, bodyB: b, pointB: { x: dx * c - dy * s, y: dx * s + dy * c }, stiffness: 0.14, damping: 0.12, length: 0 });
        Comp.add(engine.world, con);
        Sleeping.set(b, false);
        it.el.classList.add('grab');
        drag = { it: it, con: con };
      });
      it.el.addEventListener('pointermove', function (e) {
        if (!drag || drag.it !== it) return;
        var hr = hero.getBoundingClientRect();
        drag.con.pointA.x = e.clientX - hr.left; drag.con.pointA.y = e.clientY - hr.top;
        Sleeping.set(it.body, false);
      });
      function up() { if (drag && drag.it === it) { Comp.remove(engine.world, drag.con); it.el.classList.remove('grab'); drag = null; } }
      it.el.addEventListener('pointerup', up);
      it.el.addEventListener('pointercancel', up);
    });
  }

  /* pause when hero is off-screen */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) loop(); }).observe(hero);
  }
  function sync() {
    if (mq.matches) {
      if (!built) build(); else { hero.classList.add('phys'); placeWalls(); items.forEach(function (it) { if (it.body) Sleeping.set(it.body, false); }); loop(); }
    } else if (built) {
      hero.classList.remove('phys');
      cancelAnimationFrame(raf); raf = 0;
    }
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(sync, 150); });
  window.addEventListener('load', function () { setTimeout(sync, 300); });
})();
