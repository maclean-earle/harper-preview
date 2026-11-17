(function () {
  'use strict';
  var doc = document.documentElement;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function unguard() { doc.classList.remove('hm-motion'); }

  /* Provider screen: visits grid (sample pattern, fixed so it never changes between loads) */
  var dots = $('.dots');
  if (dots) {
    var pattern = '000100201030010220013021002031002001300120031012002103200130';
    pattern.split('').forEach(function (c) {
      var i = document.createElement('i');
      if (c !== '0') i.className = 'l' + c;
      dots.appendChild(i);
    });
  }

  /* Sticky nav pill */
  var navWrap = $('.nav-wrap');
  function onScroll() { navWrap.classList.toggle('is-stuck', window.scrollY > 120); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = $('.nav-toggle'), links = $('#nav-links');
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    links.classList.toggle('open', !open);
  });
  $$('a', links).forEach(function (a) {
    a.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    });
  });

  /* Hero cursor glow (fine pointers only) */
  var hero = $('.hero-box'), glow = $('.hero-glow');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && hero) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      glow.style.setProperty('--gx', (e.clientX - r.left) + 'px');
      glow.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      glow.style.setProperty('--go', '1');
    });
    hero.addEventListener('pointerleave', function () { glow.style.setProperty('--go', '0'); });
  }

  /* Plan buttons preselect team size */
  var sizeSel = $('#q-size');
  $$('.plan .btn').forEach(function (b) {
    b.addEventListener('click', function () {
      sizeSel.value = b.getAttribute('data-size');
      setTimeout(function () { $('#q-email').focus({ preventScroll: true }); }, 700);
    });
  });

  /* Quote form */
  var form = $('.quote'), msg = $('.form-msg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#q-email'), ok = true, first = null;
    [email, sizeSel].forEach(function (el) { el.removeAttribute('aria-invalid'); });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.setAttribute('aria-invalid', 'true'); ok = false; first = email; }
    if (!sizeSel.value) { sizeSel.setAttribute('aria-invalid', 'true'); ok = false; first = first || sizeSel; }
    if (!ok) {
      msg.className = 'form-msg err';
      msg.textContent = first === email ? 'Enter a work email, like name@yourshop.com.' : 'Pick your team size.';
      first.focus();
      return;
    }
    var size = sizeSel.options[sizeSel.selectedIndex].text;
    var body = 'Hi Harper team,%0D%0A%0D%0APlease send a quote.%0D%0ATeam size: ' + encodeURIComponent(size) + '%0D%0AReply to: ' + encodeURIComponent(email.value.trim()) + '%0D%0A%0D%0AThanks';
    window.location.href = 'mailto:contact@harperhealthnetwork.com?subject=' + encodeURIComponent('Quote request, ' + size + ' employees') + '&body=' + body;
    msg.className = 'form-msg';
    msg.textContent = 'Your email app should open with the request filled in. Send it, and Harper replies with your quote. No email app? Write to contact@harperhealthnetwork.com.';
  });

  /* Motion */
  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (!gsap) { unguard(); return; }
  if (ST) gsap.registerPlugin(ST);

  function offscreen(el) { return el && el.getBoundingClientRect().top > window.innerHeight * 0.9; }

  gsap.matchMedia().add({
    ok: '(prefers-reduced-motion: no-preference)',
    reduce: '(prefers-reduced-motion: reduce)'
  }, function (ctx) {
    if (ctx.conditions.reduce) { unguard(); return; }

    /* 1. Hero: one rehearsed entrance */
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onStart: unguard });
    tl.fromTo('.badge', { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.05)
      .add(window.innerWidth > 560
        ? gsap.fromTo('.hero-h .line > span', { yPercent: 105 }, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' })
        : gsap.fromTo('.hero-h', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }), 0.12)
      .fromTo('.hero-h .accent', { filter: 'blur(10px)', letterSpacing: '0.06em' }, { filter: 'blur(0px)', letterSpacing: '-0.01em', duration: 1.4 }, 0.38)
      .fromTo('.hero-sub', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.5)
      .fromTo('.hero-copy .btn-lg', { y: 14, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 1 }, 0.6)
      .fromTo('.phone-center', { y: 260, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 }, 0.55)
      .fromTo('.phone-left', { y: 300, x: 70, opacity: 0 }, { y: 0, x: 0, opacity: 1, duration: 1.6 }, 0.72)
      .fromTo('.phone-right', { y: 300, x: -70, opacity: 0 }, { y: 0, x: 0, opacity: 1, duration: 1.6 }, 0.72);
    gsap.set('.hero-copy', { opacity: 1 });

    if (!ST) return;

    /* Phones drift apart slightly as the hero scrolls away */
    gsap.to('.phone-left', { xPercent: -14, scrollTrigger: { trigger: '.hero-box', start: 'top top', end: 'bottom top', scrub: 0.6 } });
    gsap.to('.phone-right', { xPercent: 14, scrollTrigger: { trigger: '.hero-box', start: 'top top', end: 'bottom top', scrub: 0.6 } });

    /* 2. Features read as a grid: columns settle left to right */
    var cards = $$('.bento .card').filter(offscreen);
    if (cards.length) {
      gsap.set(cards, { y: 36, opacity: 0, scale: 0.97 });
      ST.batch(cards, {
        start: 'top 88%',
        onEnter: function (batch) {
          batch.sort(function (a, b) { return a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
          gsap.to(batch, { y: 0, opacity: 1, scale: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
        }
      });
    }
    var mini = $('.mini-phone');
    if (mini && offscreen(mini)) {
      gsap.fromTo(mini, { y: 120 }, { y: 0, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: mini, start: 'top 92%' } });
    }

    /* 3. Steps read as a sequence */
    var steps = $$('.step');
    if (steps.length && offscreen(steps[0])) {
      gsap.set(steps, { x: -24, opacity: 0 });
      gsap.to(steps, {
        x: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.22,
        scrollTrigger: { trigger: '.steps', start: 'top 82%' }
      });
      gsap.from('.step .ico', {
        scale: 0.4, duration: 0.8, ease: 'back.out(2.2)', stagger: 0.22, delay: 0.15,
        scrollTrigger: { trigger: '.steps', start: 'top 82%' }
      });
    }

    /* 4. Pricing resolves onto the best-fit plan */
    var plans = $$('.plan');
    if (plans.length && offscreen(plans[0])) {
      var best = $('.plan-best');
      gsap.set(plans, { y: 40, opacity: 0 });
      var pt = gsap.timeline({ scrollTrigger: { trigger: '.plans', start: 'top 86%' } });
      pt.to(plans, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08 })
        .fromTo(best, { boxShadow: '0 0 0 0 rgba(31,64,110,0)' }, { boxShadow: '0 30px 50px -30px rgba(31,64,110,.45)', duration: 0.9, ease: 'expo.out' }, '-=0.5')
        .from('.best', { scale: 0.6, opacity: 0, duration: 0.6, ease: 'back.out(2)' }, '<0.1');
      gsap.from('.includes li', { y: 10, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: '.includes', start: 'top 86%' } });
    }

    /* 5. Closing CTA: rings open out from the PIN */
    var ctaBox = $('.cta-box');
    if (ctaBox && offscreen(ctaBox)) {
      gsap.from('.cta-rings i', { scale: 0.4, opacity: 0, duration: 1.6, ease: 'expo.out', stagger: { each: 0.08, from: 'end' }, scrollTrigger: { trigger: ctaBox, start: 'top 80%' } });
      gsap.from('.pin-tile', { y: 30, rotate: -6, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: ctaBox, start: 'top 80%' } });
    }

    /* 6. Footer mark rises with the scroll */
    gsap.fromTo('.footer-mark', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 30%', scrub: 0.8 } });
  });

  /* Failsafe: nothing stays hidden if a trigger never fires (print, link previews) */
  setTimeout(function () {
    $$('.bento .card, .step, .plan, .includes li').forEach(function (el) {
      if (getComputedStyle(el).opacity === '0' && el.getBoundingClientRect().top < window.innerHeight) {
        el.style.opacity = 1; el.style.transform = 'none';
      }
    });
  }, 4000);
  window.addEventListener('beforeprint', function () {
    $$('.bento .card, .step, .plan, .includes li, .phone').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; });
  });
})();
