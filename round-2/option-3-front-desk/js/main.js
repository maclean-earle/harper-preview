(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    m.addEventListener('focusout', e => { if (!m.contains(e.relatedTarget)) b.setAttribute('aria-expanded', 'false'); });
    m.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeAll()));
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = menus.find(m => m.querySelector('.menu__btn').getAttribute('aria-expanded') === 'true');
    closeAll();
    if (open) open.querySelector('.menu__btn').focus();
    if (burger.getAttribute('aria-expanded') === 'true') { toggleMobile(false); burger.focus(); }
  });
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

  /* Hero: one visit in four captions. The portrait never moves. */
  const hero = document.querySelector('.hero');
  const caps = [...hero.querySelectorAll('.caps li')];
  const rail = [...hero.querySelectorAll('.rail button')];
  let current = -1;
  function setStep(i) {
    if (i === current) return; current = i;
    hero.dataset.step = i;
    caps.forEach((c, k) => c.classList.toggle('is-on', k === i));
    rail.forEach((b, k) => { if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  }

  const hasGsap = window.gsap && window.ScrollTrigger;
  let st = null;
  if (hasGsap && !reduce) {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('motion');
    st = ScrollTrigger.create({
      trigger: hero,
      start: 'bottom bottom',          // desktop: at once; phone: when portrait and captions fill the screen
      end: () => '+=' + Math.round(innerHeight * 2.4),
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => setStep(Math.min(3, Math.floor(self.progress * 4)))
    });
  }
  rail.forEach((b, i) => b.addEventListener('click', () => {
    if (st) scrollTo({ top: Math.round(st.start + (st.end - st.start) * ((i + .5) / 4)), behavior: 'smooth' });
    else setStep(i);
  }));
  setStep(0);

  /* Gentle reveal: only when motion is on; content stays visible otherwise */
  if (root.classList.contains('motion') && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  /* Tabs */
  const tabs = [...document.querySelectorAll('.tabs__list [role=tab]')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  function selectTab(i, focus) {
    tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panels[k].hidden = !on; });
    if (focus) tabs[i].focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(i));
    t.addEventListener('keydown', e => {
      const n = tabs.length;
      const map = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 };
      if (e.key in map) { e.preventDefault(); selectTab(map[e.key], true); }
    });
  });
  document.querySelectorAll('a[href="#tab-providers"]').forEach(a => a.addEventListener('click', () => selectTab(2)));

  /* Quote form: inline errors that name the fix */
  const q = document.getElementById('quote');
  const checks = [
    ['business', v => v.trim() ? '' : 'Add your business name.'],
    ['size', v => /^\d+$/.test(v.trim()) && +v > 0 ? '' : 'Use a number, for example 14.'],
    ['email', (v, el) => v.trim() && el.checkValidity() ? '' : 'Add a work email, for example you@yourshop.com.']
  ];
  function validate(name) {
    const el = q.elements[name], rule = checks.find(c => c[0] === name)[1];
    const msg = rule(el.value, el);
    document.getElementById('e-' + name).textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return !msg;
  }
  checks.forEach(([name]) => {
    const el = q.elements[name];
    el.addEventListener('blur', () => { if (el.value || el.hasAttribute('aria-invalid')) validate(name); });
    el.addEventListener('input', () => { if (el.hasAttribute('aria-invalid')) validate(name); });
  });
  q.addEventListener('submit', e => {
    e.preventDefault();
    const bad = checks.map(([n]) => validate(n) ? null : n).filter(Boolean);
    if (bad.length) { q.elements[bad[0]].focus(); return; }
    q.querySelector('.qform__fields').hidden = true;
    q.querySelector('.qform__head').hidden = true;
    const done = q.querySelector('.qform__done');
    done.hidden = false;
    done.querySelector('[tabindex]').focus();
  });

  /* Newsletter */
  const news = document.querySelector('.news');
  news.addEventListener('submit', e => {
    e.preventDefault();
    const i = news.querySelector('input'), m = news.querySelector('.news__msg');
    const ok = i.checkValidity() && i.value;
    m.textContent = ok ? 'Thanks. This is a review build, so nothing was sent.' : 'Add an email address, for example you@yourshop.com.';
    if (ok) i.removeAttribute('aria-invalid'); else i.setAttribute('aria-invalid', 'true');
  });
})();
