(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme */
  document.querySelectorAll('[data-set-theme]').forEach(b => b.addEventListener('click', () => {
    root.dataset.theme = b.dataset.setTheme;
    try { localStorage.setItem('hh-theme', b.dataset.setTheme); } catch (e) {}
  }));

  /* Nav: solid on scroll */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 20);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  /* Mega menus */
  const menus = [...document.querySelectorAll('.menu')];
  const closeAll = except => menus.forEach(m => { const b = m.querySelector('.menu__btn'); if (b !== except) b.setAttribute('aria-expanded', 'false'); });
  menus.forEach(m => {
    const b = m.querySelector('.menu__btn');
    b.addEventListener('click', () => { const open = b.getAttribute('aria-expanded') === 'true'; closeAll(b); b.setAttribute('aria-expanded', String(!open)); });
    m.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) { closeAll(b); b.setAttribute('aria-expanded', 'true'); } });
    m.addEventListener('mouseleave', () => { if (matchMedia('(hover:hover)').matches) b.setAttribute('aria-expanded', 'false'); });
    m.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeAll()));
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); toggleMobile(false); } });
  document.addEventListener('click', e => { if (!e.target.closest('.menu')) closeAll(); });

  /* Mobile menu */
  const burger = document.querySelector('.nav__burger');
  const mobile = document.getElementById('mobile-menu');
  function toggleMobile(force) {
    const open = force ?? burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    burger.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    mobile.hidden = !open;
    if (open) nav.classList.add('is-solid'); else onScroll();
  }
  burger.addEventListener('click', () => toggleMobile());
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMobile(false)));

  /* Hero stage */
  const stage = document.getElementById('stage');
  const inner = stage.querySelector('.stage__inner');
  const railBtns = [...stage.querySelectorAll('.rail button')];
  const railDot = stage.querySelector('.rail__dot');
  let current = -1;
  function setStage(i) {
    if (i === current) return; current = i;
    stage.dataset.stage = i;
    railBtns.forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    const b = railBtns[i], rail = b.parentElement.getBoundingClientRect(), r = b.getBoundingClientRect();
    railDot.style.left = (r.left - rail.left + r.width / 2 - 3) + 'px';
  }
  function fit() {
    const w = stage.clientWidth;
    const s = w < 640 ? Math.min(1, w / 560) : Math.min(1, w / 1040);
    inner.style.setProperty('--s', s.toFixed(3));
    const i = current; current = -1; setStage(Math.max(0, i));
  }
  stage.querySelectorAll('.graph > span, .graph > div').forEach(n => {
    const l = parseFloat(n.style.left), t = parseFloat(n.style.top);
    n.style.setProperty('--dx', ((50 - l) * 10).toFixed(0) + 'px');
    n.style.setProperty('--dy', ((40 - t) * 5).toFixed(0) + 'px');
  });
  stage.querySelectorAll('.m1 .tree li').forEach((li, k) => li.style.setProperty('--i', k));
  fit(); addEventListener('resize', fit);

  /* Dots */
  const dots = document.getElementById('dots');
  const palette = ['#1A93A8', '#136BC3', '#2FC3DA', '#BFE8EF', '#E3F5F8', '#E3F5F8', '#BFE8EF', '#1A93A8'];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 46; k++) {
    const d = document.createElement('i');
    const c = palette[Math.floor(rnd() * palette.length)];
    d.style.cssText = `left:${(4 + rnd() * 92).toFixed(1)}%;top:${(4 + rnd() * 84).toFixed(1)}%;background:${c};opacity:${c.startsWith('#F3') ? .9 : .85}`;
    dots.appendChild(d);
  }

  function field(host, n, pal, x0 = 3, xw = 94) {
    for (let k = 0; k < n; k++) {
      const d = document.createElement('i'); const c = pal[Math.floor(rnd() * pal.length)];
      d.style.cssText = `left:${(x0 + rnd() * xw).toFixed(1)}%;top:${(4 + rnd() * 90).toFixed(1)}%;background:${c}`;
      host.appendChild(d);
    }
  }
  const cd = document.querySelector('.close__dots'); if (cd) field(cd, 18, ['#1A93A8', '#136BC3', '#2FC3DA', '#E6F6F9', '#E6F6F9'], 56, 41);
  const lay = document.querySelector('.layers');
  if (lay) { const ld = document.createElement('div'); ld.className = 'layers__dots'; ld.setAttribute('aria-hidden', 'true'); lay.prepend(ld); field(ld, 34, ['#1A93A8', '#136BC3', '#2FC3DA', '#BFE8EF', '#E3F5F8', '#E3F5F8']); }

  const hasGsap = window.gsap && window.ScrollTrigger;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* Scroll-tied morph: hold each step, then interpolate geometry into the next */
  const morph = document.getElementById('morph');
  const mqMobile = matchMedia('(max-width: 600px)');
  const geo = () => [[430, 172, 140, 42], mqMobile.matches ? [330, 0, 340, 392] : [200, 0, 340, 392], [330, 0, 340, 392], [330, 0, 340, 392]];
  const ease = t => 1 - Math.pow(1 - t, 3);
  const layers = [...morph.querySelectorAll('.mlayer')];
  function scrub(p) {
    const x = Math.min(3.999, Math.max(0, p * 4));
    const i = Math.floor(x), f = x - i;
    let a = i, b = i, t = 0;
    if (f > 0.7 && i < 3) { b = i + 1; t = ease((f - 0.7) / 0.3); }
    const G = geo(), A = G[a], B = G[b];
    const v = A.map((n, k) => n + (B[k] - n) * t);
    morph.style.left = v[0] + 'px'; morph.style.top = v[1] + 'px'; morph.style.width = v[2] + 'px'; morph.style.height = v[3] + 'px';
    setStage(t > 0.45 ? b : a);
    layers.forEach((L, k) => {
      let o = 0;
      if (k === a) o = b === a ? 1 : Math.max(0, 1 - t * 2.2);
      if (k === b && b !== a) o = Math.min(1, Math.max(0, (t - 0.4) * 1.8));
      L.style.opacity = o; L.style.visibility = o > 0 ? 'visible' : 'hidden';
    });
  }

  let st = null;
  if (hasGsap && !reduce) {
    st = ScrollTrigger.create({
      trigger: '#stage-wrap', start: 'center 54%', end: '+=2600', pin: true, pinSpacing: true,
      onUpdate: self => scrub(self.progress),
      onToggle: self => morph.classList.toggle('is-scrub', self.isActive || self.progress > 0)
    });
    gsap.utils.toArray('.dots i, .layers__dots i').forEach((d, k) => {
      gsap.to(d, { x: () => gsap.utils.random(-18, 18), y: () => gsap.utils.random(-14, 14), duration: gsap.utils.random(3, 6), repeat: -1, yoyo: true, ease: 'sine.inOut', delay: k * .05 });
    });
    gsap.to('.arcs', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '#stage-wrap', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  railBtns.forEach((b, i) => b.addEventListener('click', () => {
    if (st) { const y = st.start + (st.end - st.start) * ((i + .5) / 4); scrollTo({ top: y, behavior: 'smooth' }); }
    else setStage(i);
  }));
  setStage(0);

  /* Reveal */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => reduce ? el.classList.add('in') : io.observe(el));

  /* People scroller: drag to scroll */
  const sc = document.getElementById('scroller');
  let down = false, sx = 0, sl = 0, moved = false;
  sc.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = sc.scrollLeft; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; sc.classList.add('is-drag'); } sc.scrollLeft = sl - dx; });
  addEventListener('pointerup', () => { if (!down) return; down = false; sc.classList.remove('is-drag'); });

  /* Tabs */
  const tabs = [...document.querySelectorAll('.tabs__list [role=tab]')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  function selectTab(i, focus) {
    tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panels[k].hidden = !on; panels[k].classList.toggle('is-on', on); });
    if (focus) tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') selectTab((i + 1) % tabs.length, true);
      if (e.key === 'ArrowLeft') selectTab((i - 1 + tabs.length) % tabs.length, true);
    });
  });
  // Deep link to the providers tab from menus and links
  document.querySelectorAll('a[href="#tab-providers"]').forEach(a => a.addEventListener('click', () => selectTab(2)));

  /* Quote form */
  const q = document.getElementById('quote');
  q.addEventListener('submit', e => {
    e.preventDefault();
    const err = q.querySelector('.field__err');
    const f = { business: q.business, size: q.size, email: q.email };
    let msg = '';
    Object.values(f).forEach(i => i.removeAttribute('aria-invalid'));
    if (!f.business.value.trim()) { msg = 'Add your business name.'; f.business.setAttribute('aria-invalid', 'true'); }
    else if (!/^\d+$/.test(f.size.value.trim()) || +f.size.value < 1) { msg = 'Add your team size as a number, for example 14.'; f.size.setAttribute('aria-invalid', 'true'); }
    else if (!f.email.checkValidity() || !f.email.value) { msg = 'Add a work email, for example you@yourshop.com.'; f.email.setAttribute('aria-invalid', 'true'); }
    err.textContent = msg;
    if (msg) { q.querySelector('[aria-invalid=true]').focus(); return; }
    q.querySelector('.qcard__fields').hidden = true;
    q.querySelector('.qcard__head').hidden = true;
    q.querySelector('.qcard__done').hidden = false;
  });

  /* Newsletter */
  const news = document.querySelector('.news');
  news.addEventListener('submit', e => {
    e.preventDefault();
    const i = news.querySelector('input'), m = news.querySelector('.news__msg');
    m.textContent = i.checkValidity() && i.value ? 'Thanks. Review build: nothing was sent.' : 'Add an email address, for example you@yourshop.com.';
  });
})();
