(() => {
  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');

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
    closeAll(); toggleMobile(false);
    if (open) open.querySelector('.menu__btn').focus();
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

  /* ===== Hero ledger: one month on a calendar ===== */
  const ledger = document.getElementById('ledger');
  const wrap = document.getElementById('ledger-wrap');
  const cal = ledger.querySelector('.cal');
  const dayBtns = [...cal.querySelectorAll('button.cal__day')];
  const allDays = [...cal.querySelectorAll('.cal__day')];
  const today = document.getElementById('cal-today');
  const fill = document.getElementById('cal-fill');
  const track = document.getElementById('cal-track');
  const rows = [...ledger.querySelectorAll('.mstep')];
  const statusText = ledger.querySelector('#ledger-status span');
  const hint = document.querySelector('.hero__hint');
  const STATUS = ['Billed', 'Credits ready', 'Visit done', 'Paid'];
  let step = -1, pos = [0, 0, 0, 0], dayY = [], markerY = 0, st = null;

  function measure() {
    const cr = cal.getBoundingClientRect();
    const mid = el => { const r = el.getBoundingClientRect(); return r.top - cr.top + r.height / 2; };
    pos = dayBtns.map(mid);
    dayY = allDays.map(mid);
    const first = dayY[0], last = dayY[dayY.length - 1];
    track.style.top = first + 'px'; track.style.height = (last - first) + 'px';
    fill.style.top = first + 'px';
  }
  function setMarker(y) {
    markerY = y;
    today.style.transform = `translateY(${y.toFixed(1)}px)`;
    fill.style.height = Math.max(0, y - pos[0]).toFixed(1) + 'px';
    allDays.forEach((d, k) => d.classList.toggle('is-past', dayY[k] < y - 4));
  }

  function setStep(i, moveMarker) {
    if (i !== step) {
      step = i;
      ledger.dataset.step = i;
      rows.forEach((r, k) => { r.classList.toggle('is-done', k < i); r.classList.toggle('is-on', k === i); r.classList.toggle('is-future', k > i); });
      dayBtns.forEach((b, k) => { b.classList.toggle('is-today', k === i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      statusText.textContent = STATUS[i];
    }
    if (moveMarker) setMarker(pos[i]);
  }

  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function fromProgress(p) {
    const seg = Math.min(3.999, p * 4);
    const i = Math.floor(seg), local = seg - i;
    let y = pos[i];
    if (i < 3 && local > .6) y = pos[i] + (pos[i + 1] - pos[i]) * ease((local - .6) / .4);
    setStep(i, false);
    setMarker(y);
  }

  dayBtns.forEach((b, i) => {
    b.addEventListener('click', () => {
      if (st) {
        const y = st.start + (st.end - st.start) * ((i + .3) / 4);
        scrollTo({ top: y, behavior: reduceMq.matches ? 'auto' : 'smooth' });
      } else setStep(i, true);
    });
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = (i + d + dayBtns.length) % dayBtns.length;
      dayBtns[n].focus(); dayBtns[n].click();
    });
  });

  rows.forEach(r => r.addEventListener('click', () => dayBtns[+r.dataset.go].click()));
  measure(); setStep(0, true);
  const remeasure = () => { measure(); if (st) fromProgress(st.progress); else setMarker(pos[step]); };
  addEventListener('resize', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

  const hasGsap = window.gsap && window.ScrollTrigger;
  const staticMode = () => { ledger.classList.remove('is-live', 'is-scrub'); hint.lastChild.textContent = 'Pick a date to see each moment'; };
  staticMode();

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add({ big: '(min-width: 861px) and (min-height: 700px)', small: '(max-width: 860px), (max-height: 699px)', reduce: '(prefers-reduced-motion: reduce)' }, ctx => {
      const { big, reduce } = ctx.conditions;
      if (reduce) { staticMode(); return; }
      let trig;
      if (big) {
        trig = { trigger: '.hero', start: 'top top', end: '+=2400', pin: true };
      } else {
        // Phone or short screen: pin only the ledger card, if it fits.
        if (wrap.offsetHeight > innerHeight - 84) { staticMode(); return; }
        trig = { trigger: wrap, start: () => `top ${Math.max(76, (innerHeight - wrap.offsetHeight) / 2 + 20)}px`, end: '+=1800', pin: true };
      }
      ledger.classList.add('is-live', 'is-scrub');
      hint.lastChild.textContent = 'Scroll to see one month';
      st = ScrollTrigger.create({ ...trig, pinSpacing: true, invalidateOnRefresh: true, onUpdate: self => fromProgress(self.progress), onRefresh: self => { measure(); fromProgress(self.progress); } });
      fromProgress(st.progress);
      gsap.to('.hero__lines', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: () => '+=' + (big ? 2400 : 1800), scrub: true } });
      return () => { st = null; staticMode(); setStep(step, true); };
    });
  }

  /* Reveal */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* People scroller on phones: drag with a mouse too */
  const sc = document.getElementById('scroller');
  let down = false, sx = 0, sl = 0;
  sc.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || sc.scrollWidth <= sc.clientWidth) return; down = true; sx = e.clientX; sl = sc.scrollLeft; });
  addEventListener('pointermove', e => { if (down) sc.scrollLeft = sl - (e.clientX - sx); });
  addEventListener('pointerup', () => { down = false; });

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
      if (e.key === 'Home') selectTab(0, true);
      if (e.key === 'End') selectTab(tabs.length - 1, true);
    });
  });
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
    else if (!f.email.value.trim() || !f.email.checkValidity()) { msg = 'Add a work email, for example you@yourshop.com.'; f.email.setAttribute('aria-invalid', 'true'); }
    err.textContent = msg;
    if (msg) { q.querySelector('[aria-invalid=true]').focus(); return; }
    q.querySelector('.qcard__fields').hidden = true;
    q.querySelector('.qcard__head').hidden = true;
    const done = q.querySelector('.qcard__done'); done.hidden = false; done.focus();
  });

  /* Newsletter */
  const news = document.querySelector('.news');
  news.addEventListener('submit', e => {
    e.preventDefault();
    const i = news.querySelector('input'), m = news.querySelector('.news__msg');
    const ok = i.value.trim() && i.checkValidity();
    i.setAttribute('aria-invalid', String(!ok));
    m.textContent = ok ? 'Thanks. Review build: nothing was sent.' : 'Add an email address, for example you@yourshop.com.';
  });
})();
