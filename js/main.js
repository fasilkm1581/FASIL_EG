(() => {
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (t, o = {}) => lenis ? lenis.scrollTo(t, { offset: 0, ...o }) : (typeof t === 'number' ? scrollTo_(t) : $(t)?.scrollIntoView({ behavior: 'smooth' }));
  const scrollTo_ = y => window.scrollTo({ top: y, behavior: 'smooth' });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const h = a.getAttribute('href'); if (h.length < 2 && h !== '#top') return;
    e.preventDefault(); closeMenu(); scrollTo(h === '#top' ? 0 : h, { duration: 1.6 });
  }));

  /* ---------- split text ---------- */
  function split(el) {
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(p => {
          if (!p.trim()) { f.append(p); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.className = 'wi'; i.textContent = p; w.append(i); f.append(w);
        });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(el);
  }
  $$('[data-split]').forEach(split);

  /* ---------- custom cursor ---------- */
  const cur = $('#cursor');
  if (fine && cur) {
    document.body.classList.add('cursor-on');
    const xt = gsap.quickTo(cur, 'x', { duration: .45, ease: 'power3' }), yt = gsap.quickTo(cur, 'y', { duration: .45, ease: 'power3' });
    const dot = $('.c-dot'), dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
    const ring = $('.c-ring i');
    addEventListener('mousemove', e => { xt(e.clientX); yt(e.clientY); if (window.EG3D) { EG3D.mx = e.clientX / innerWidth * 2 - 1; EG3D.my = e.clientY / innerHeight * 2 - 1; } });
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-cursor]');
      cur.classList.remove('link', 'view');
      if (t) { const k = t.dataset.cursor; cur.classList.add(k); if (k === 'view') ring.textContent = 'VIEW'; }
    });
    addEventListener('mousedown', () => cur.classList.add('down'));
    addEventListener('mouseup', () => cur.classList.remove('down'));
  }

  /* ---------- magnetic buttons ---------- */
  if (fine) $$('.magnetic').forEach(el => {
    const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.5)' }), my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.5)' });
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * .35); my((e.clientY - r.top - r.height / 2) * .35); });
    el.addEventListener('mouseleave', () => { mx(0); my(0); });
  });

  /* ---------- 3D tilt cards ---------- */
  if (fine) $$('.tilt').forEach(el => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' }), ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      ry((px - .5) * 18); rx(-(py - .5) * 18);
      el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
    });
    el.addEventListener('mouseleave', () => { rx(0); ry(0); });
  });

  /* ---------- menu ---------- */
  const menu = $('#menu'), burger = $('#burger');
  let menuOpen = false;
  const menuTl = gsap.timeline({ paused: true, onReverseComplete: () => { menu.style.visibility = 'hidden'; } })
    .set(menu, { visibility: 'visible' })
    .to(menu, { clipPath: 'circle(150% at calc(100% - 60px) 46px)', duration: 1, ease: 'power4.inOut' })
    .from('.menu-main li a', { yPercent: 110, duration: .9, stagger: .07, ease: 'power4.out' }, '-=.45')
    .from('.menu-side > *', { y: 24, opacity: 0, duration: .7, stagger: .06, ease: 'power3.out' }, '-=.7');
  function openMenu() { menuOpen = true; burger.classList.add('open'); burger.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false'); lenis?.stop(); menuTl.timeScale(1).play(); }
  function closeMenu() { if (!menuOpen) return; menuOpen = false; burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); lenis?.start(); menuTl.timeScale(1.4).reverse(); }
  burger.addEventListener('click', () => menuOpen ? closeMenu() : openMenu());
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); closeModal(); } });

  /* ---------- header + progress ---------- */
  const header = $('#header'), prog = $('#progress');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: s => {
      const y = scrollY;
      gsap.set(prog, { scaleX: s.progress });
      header.classList.toggle('scrolled', y > 60);
      header.classList.toggle('hide', y > lastY && y > 400 && !menuOpen);
      lastY = y;
      if (window.EG3D) EG3D.scroll = Math.min(y / innerHeight, 1.2);
    }
  });

  /* ---------- hero slider ---------- */
  const slides = $$('.slide'), dots = $$('#dots button');
  let idx = 0, timer = null, busy = false, ready = false;
  const DUR = 6.5;
  function enter(s) {
    s.classList.add('is-active');
    const lines = $$('.ln > span', s);
    return gsap.timeline()
      .fromTo($('.eyebrow', s), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .8, ease: 'power3.out' })
      .fromTo(lines, { yPercent: 115, rotate: 4, opacity: 1 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, stagger: .1, ease: 'power4.out' }, '<.05')
      .fromTo($$('.lead,.btn', s), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .9, stagger: .1, ease: 'power3.out' }, '-=.8');
  }
  function leave(s) {
    return gsap.timeline({ onComplete: () => s.classList.remove('is-active') })
      .to($$('.ln > span', s), { yPercent: -115, duration: .7, stagger: .05, ease: 'power3.in' })
      .to($$('.eyebrow,.lead,.btn', s), { opacity: 0, y: -16, duration: .5 }, 0);
  }
  function go(n) {
    if (busy || n === idx) return;
    busy = true; clearTimeout(timer);
    const prev = slides[idx]; idx = (n + slides.length) % slides.length;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    if (window.EG3D) EG3D.pose = idx;
    leave(prev).then(() => { enter(slides[idx]).then(() => busy = false); });
    dotBar();
  }
  let dotTween;
  function dotBar() {
    dotTween?.kill();
    dots.forEach((d, i) => gsap.set($('i', d), { scaleX: i < idx ? 1 : 0 }));
    dotTween = gsap.to($('i', dots[idx]), { scaleX: 1, duration: DUR, ease: 'none', onComplete: () => go(idx + 1) });
  }
  dots.forEach((d, i) => d.addEventListener('click', () => { if (ready) go(i); }));

  /* ---------- reveal on scroll ---------- */
  function setupScroll() {
    $$('[data-split]').forEach(el => {
      gsap.from($$('.wi', el), { yPercent: 115, rotate: 3, duration: 1.1, stagger: .045, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    $$('.reveal').forEach(el => gsap.from(el, { y: 36, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

    // word-by-word fill
    const ft = $('#fillText'); ft.innerHTML = ft.textContent.trim().split(/\s+/).map(w => `<span class="fw">${w}</span>`).join(' ');
    gsap.to('.fw', { opacity: 1, stagger: .5, ease: 'none', scrollTrigger: { trigger: ft, start: 'top 80%', end: 'bottom 55%', scrub: .6 } });

    // counters
    $$('[data-count]').forEach(el => {
      const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2.4, ease: 'power3.out', onUpdate: () => el.textContent = o.v.toFixed(dec) }) });
    });
    gsap.from('.stat', { y: 60, opacity: 0, stagger: .12, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

    // marquee: scroll-velocity driven
    const track = $('.marquee-track'), half = () => track.scrollWidth / 2;
    let mx = 0, dir = -1, vel = 0;
    gsap.ticker.add(() => { vel *= .92; mx += dir * (1.2 + Math.abs(vel)); if (mx <= -half()) mx += half(); if (mx > 0) mx -= half(); gsap.set(track, { x: mx }); });
    ScrollTrigger.create({ onUpdate: s => { vel = s.getVelocity() / 300; dir = s.direction === 1 ? -1 : 1; } });

    // cards
    gsap.from('.card', { y: 120, rotateX: -18, opacity: 0, stagger: .15, duration: 1.3, ease: 'power4.out', scrollTrigger: { trigger: '.cards', start: 'top 82%' } });

    // collections parallax
    gsap.fromTo('#colBg', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.collections', scrub: true } });
    gsap.to('#colPat', { yPercent: -14, rotate: 6, ease: 'none', scrollTrigger: { trigger: '.collections', scrub: true } });
    gsap.from('.collections', { clipPath: 'inset(8% 6% round 40px)', ease: 'none', scrollTrigger: { trigger: '.collections', start: 'top bottom', end: 'top 20%', scrub: true } });

    // compliance rows
    gsap.from('.comp-list li', { y: 50, opacity: 0, stagger: .12, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.comp-list', start: 'top 85%' } });

    // footer mark
    gsap.from('.foot-mark', { yPercent: 40, opacity: 0, duration: 1.3, ease: 'power4.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });

    // services pinned horizontal scroll (desktop & tablet); stacked on small screens
    const mm = gsap.matchMedia();
    mm.add('(min-width: 800px)', () => {
      document.body.classList.remove('no-hscroll');
      const tr = $('#svcTrack'), dist = () => tr.scrollWidth - innerWidth;
      const bar = $('#svcBar'), now = $('#svcNow');
      gsap.to(tr, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.services', start: 'top top', end: () => '+=' + (dist() + innerHeight * .4), pin: '.svc-pin', scrub: .8, invalidateOnRefresh: true,
          onUpdate: s => {
            gsap.set(bar, { scaleX: s.progress });
            now.textContent = String(Math.max(1, Math.min(7, Math.round(s.progress * 6) + 1))).padStart(2, '0');
          }
        }
      });
    });
    mm.add('(max-width: 799px)', () => {
      document.body.classList.add('no-hscroll');
      gsap.from('.panel', { y: 60, opacity: 0, stagger: .1, duration: 1, scrollTrigger: { trigger: '.svc-track', start: 'top 85%' } });
    });
  }

  /* service art (inline animated SVG) */
  const arts = {
    refine: '<svg viewBox="0 0 100 100"><path class="fl float" d="M30 40h40l6 30H24z"/><circle class="st pulse" cx="50" cy="22" r="8"/><path class="st" d="M40 78q10 8 20 0"/></svg>',
    assay: '<svg viewBox="0 0 100 100"><circle class="st" cx="50" cy="50" r="34"/><g class="spin"><path class="st" d="M50 16v68M16 50h68"/></g><circle class="fl pulse" cx="50" cy="50" r="10"/></svg>',
    smelt: '<svg viewBox="0 0 100 100"><path class="st" d="M26 30h48l-8 44H34z"/><path class="fl pulse" d="M34 44h32l-4 24H38z"/><path class="st float" d="M42 20q8-10 16 0"/></svg>',
    bullion: '<svg viewBox="0 0 100 100"><path class="fl float" d="M22 56h56l8 22H14z"/><path class="fl" d="M32 36h36l6 16H26z" opacity=".75"/></svg>',
    mint: '<svg viewBox="0 0 100 100"><circle class="fl spin rev" cx="50" cy="50" r="34"/><circle class="st" cx="50" cy="50" r="26"/><path class="st" d="M50 32l5 12h13l-10 8 4 13-12-8-12 8 4-13-10-8h13z"/></svg>',
    stones: '<svg viewBox="0 0 100 100"><path class="st pulse" d="M30 34h40l12 16-32 36L18 50z"/><path class="st" d="M18 50h64M42 34l8 16 8-16M50 50v36"/></svg>',
    gift: '<svg viewBox="0 0 100 100"><rect class="st" x="20" y="42" width="60" height="40"/><rect class="fl" x="20" y="34" width="60" height="12"/><path class="fl" d="M46 34h8v48h-8z"/><path class="st float" d="M50 34q-18-24-20-8t20 8q20-16 20-8t-20 8"/></svg>'
  };
  $$('.p-art').forEach(el => el.innerHTML = arts[el.dataset.art] || '');

  /* ---------- gold ticker (simulated random walk) ---------- */
  const px = { Au: 2650.4, Ag: 31.18 }, base = { ...px };
  function tick() {
    ['Au', 'Ag'].forEach(k => {
      px[k] *= 1 + (Math.random() - .5) * .0008;
      const ch = (px[k] / base[k] - 1) * 100;
      $('#p' + k).textContent = px[k].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const e = $('#c' + k); e.textContent = (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%'; e.classList.toggle('dn', ch < 0);
    });
  }
  tick(); setInterval(tick, 1800);

  /* ---------- forms + modals ---------- */
  function validate(form, ok, msg) {
    form.addEventListener('submit', e => {
      e.preventDefault(); let bad = false;
      $$('input[required],textarea[required]', form).forEach(f => {
        const v = f.value.trim(), invalid = !v || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v));
        f.closest('.fld').classList.toggle('err', invalid); bad ||= invalid;
      });
      ok.textContent = bad ? 'Please complete the required fields.' : msg;
      if (!bad) { form.reset(); gsap.fromTo(ok, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: .6 }); }
    });
  }
  validate($('#contactForm'), $('#formOk'), 'Thank you. This demo form does not send data.');
  validate($('#enqForm'), $('#enqOk'), 'Thank you. This demo form does not send data.');
  validate($('#verForm'), $('#verOk'), 'Demo only: certificate lookup is not connected.');

  let openM = null;
  function openModal(id) {
    const m = $('#modal-' + id); if (!m) return; openM = m; m.style.visibility = 'visible'; m.setAttribute('aria-hidden', 'false'); lenis?.stop();
    gsap.to($('.m-back', m), { opacity: 1, duration: .5 });
    gsap.fromTo($('.m-box', m), { y: 60, opacity: 0, scale: .96 }, { y: 0, opacity: 1, scale: 1, duration: .8, ease: 'power4.out' });
    $('input', m)?.focus({ preventScroll: true });
  }
  function closeModal() {
    if (!openM) return; const m = openM; openM = null; lenis?.start(); m.setAttribute('aria-hidden', 'true');
    gsap.to($('.m-box', m), { y: 40, opacity: 0, duration: .45, ease: 'power3.in' });
    gsap.to($('.m-back', m), { opacity: 0, duration: .5, onComplete: () => m.style.visibility = 'hidden' });
  }
  $$('[data-open]').forEach(b => b.addEventListener('click', () => { closeMenu(); openModal(b.dataset.open); }));
  $$('[data-close]').forEach(b => b.addEventListener('click', closeModal));

  /* ---------- preloader -> intro ---------- */
  function intro() {
    const pre = $('#preloader'), num = $('#plnum'), fill = $('#plfill'), o = { v: 0 };
    const tl = gsap.timeline();
    tl.to(o, { v: 100, duration: reduce ? .3 : 2.2, ease: 'power2.inOut', onUpdate: () => { num.textContent = Math.round(o.v); fill.setAttribute('width', o.v * 2.2); } })
      .to('.pl-center', { scale: .9, opacity: 0, duration: .6, ease: 'power3.in' })
      .to('.pl-top', { yPercent: -101, duration: 1.1, ease: 'power4.inOut' }, '-=.1')
      .to('.pl-bot', { yPercent: 101, duration: 1.1, ease: 'power4.inOut' }, '<')
      .add(() => {
        document.body.classList.remove('is-loading'); pre.style.display = 'none'; lenis?.start();
        if (window.EG3D) gsap.to(EG3D, { intro: 1, duration: 2.2, ease: 'expo.out' });
        enter(slides[0]).then(() => { ready = true; });
        dotBar();
        gsap.from('.header', { y: -80, opacity: 0, duration: 1.2, ease: 'power4.out' });
        gsap.from('.hero-ui,.ticker', { y: 40, opacity: 0, duration: 1.2, delay: .4, ease: 'power3.out' });
      }, '-=.7');
  }
  slides.forEach((s, i) => { if (i) s.classList.remove('is-active'); });
  gsap.set($$('.slide.is-active .ln > span,.slide.is-active .eyebrow,.slide.is-active .lead,.slide.is-active .btn'), { opacity: 0 });
  setupScroll();
  (document.fonts?.ready || Promise.resolve()).then(() => { ScrollTrigger.refresh(); intro(); });
  addEventListener('load', () => ScrollTrigger.refresh());
})();
