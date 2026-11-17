(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var PEEL_QUERY = '(min-width: 900px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)';
  var peel = null; // set when the scroll peel is live

  /* ---------------- quote forms ---------------- */

  var EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[A-Za-z]{2,}$/;

  function check(form) {
    var f = form.elements;
    var business = f.business.value.trim();
    var team = f.team.value.trim().replace(/[,\s]/g, '');
    var email = f.email.value.trim();
    var errs = {};
    if (business.length < 2) errs.business = 'Add your business name.';
    if (!team) errs.team = 'Add how many people work for you.';
    else if (!/^\d{1,4}$/.test(team) || Number(team) < 1) errs.team = 'Use a whole number, like 14.';
    if (!email) errs.email = 'Add your email so we can send the quote.';
    else if (!EMAIL.test(email)) errs.email = 'Check the email. It should look like you@yourshop.com.';
    return { errs: errs, data: { business: business, team: team ? String(Number(team)) : '', email: email } };
  }

  function setError(input, msg) {
    var out = document.getElementById(input.getAttribute('aria-describedby'));
    if (out) out.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  // No backend yet: the request goes out through the visitor's email app.
  // Swap mailQuote for a real request when Harper has a quote endpoint.
  function mailQuote(business, size, email) {
    var body = 'Hi Harper team,\r\n\r\nPlease send a quote.\r\nBusiness: ' + business + '\r\nTeam size: ' + size + '\r\nReply to: ' + email + '\r\n\r\nThanks';
    window.location.href = 'mailto:contact@harperhealthnetwork.com?subject=' + encodeURIComponent('Quote request, ' + business) + '&body=' + encodeURIComponent(body);
  }
  function sendQuote(data) {
    mailQuote(data.business, data.team, data.email);
    return new Promise(function (resolve) { setTimeout(function () { resolve({ ok: true, data: data }); }, 250); });
  }

  function tearAway(sheet, kind) {
    if (reduce.matches || typeof sheet.animate !== 'function') return Promise.resolve();
    var frames = kind === 'stub'
      ? [
          { transform: 'none', easing: 'cubic-bezier(.3,0,.4,1)' },
          { transform: 'translate(2px,-3px) rotate(2.4deg)', offset: 0.26, easing: 'cubic-bezier(.2,0,.5,1)' },
          { transform: 'translate(5px,-6px) rotate(3.6deg)', opacity: 1, offset: 0.38, easing: 'cubic-bezier(.55,0,.85,.35)' },
          { transform: 'translate(95%, 20%) rotate(14deg)', opacity: 1, offset: 0.82 },
          { transform: 'translate(135%, 28%) rotate(19deg)', opacity: 0 }
        ]
      : [
          { transform: 'none', easing: 'cubic-bezier(.3,0,.4,1)' },
          { transform: 'translate(-3px,2px) rotate(-1.8deg)', offset: 0.24, easing: 'cubic-bezier(.2,0,.5,1)' },
          { transform: 'translate(-6px,5px) rotate(-2.8deg)', opacity: 1, offset: 0.36, easing: 'cubic-bezier(.55,0,.85,.35)' },
          { transform: 'translate(-7%, 85%) rotate(-9deg)', opacity: 1, offset: 0.82 },
          { transform: 'translate(-10%, 120%) rotate(-12deg)', opacity: 0 }
        ];
    sheet.style.transformOrigin = kind === 'stub' ? '0% 100%' : '100% 0%';
    var anim = sheet.animate(frames, { duration: 1000, fill: 'forwards' });
    sheet._tear = anim;
    return anim.finished.catch(function () {});
  }

  function initForm(form) {
    var box = form.closest('.tearoff');
    var receipt = box.querySelector('.tearoff__receipt');
    var kind = box.getAttribute('data-tear');
    var tried = false;

    form.addEventListener('input', function (e) {
      if (!tried || !e.target.name) return;
      var res = check(form);
      setError(e.target, res.errs[e.target.name]);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var res = check(form);
      var first = null;
      ['business', 'team', 'email'].forEach(function (name) {
        var input = form.elements[name];
        setError(input, res.errs[name]);
        if (res.errs[name] && !first) first = input;
      });
      if (first) { first.focus(); return; }

      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      sendQuote(res.data).then(function () {
        receipt.querySelectorAll('[data-out]').forEach(function (el) {
          el.textContent = res.data[el.getAttribute('data-out')];
        });
        receipt.querySelector('.receipt__msg').textContent =
          'Your email app should open with this request filled in. Send it, and Harper replies to ' + res.data.email + '. No email app? Write to contact@harperhealthnetwork.com.';
        receipt.hidden = false;
        box.classList.add('is-torn');
        return tearAway(form, kind);
      }).then(function () {
        form.hidden = true;
        btn.disabled = false;
        receipt.focus({ preventScroll: true });
      });
    });

    receipt.querySelector('[data-reset]').addEventListener('click', function () {
      if (form._tear) { form._tear.cancel(); form._tear = null; }
      form.reset();
      tried = false;
      form.hidden = false;
      box.classList.remove('is-torn');
      receipt.hidden = true;
      if (!reduce.matches && form.animate) {
        form.animate([{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
      form.elements.business.focus({ preventScroll: true });
    });
  }

  document.querySelectorAll('form.quote').forEach(initForm);

  /* ---------------- links that jump to a form or a copy ---------------- */

  function smooth() { return reduce.matches ? 'auto' : 'smooth'; }

  function focusQuote(which) {
    var input = document.getElementById(which === 'close' ? 'quote-close-business' : 'quote-business');
    if (!input) return;
    if (which !== 'close' && peel) {
      var top = peel.toScroll('white');
      var far = Math.abs(window.scrollY - top) > 4;
      window.scrollTo({ top: top, behavior: smooth() });
      setTimeout(function () { input.focus({ preventScroll: true }); }, far && !reduce.matches ? 700 : 0);
      return;
    }
    input.scrollIntoView({ behavior: smooth(), block: 'center' });
    input.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-focus-quote]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      focusQuote(a.getAttribute('data-focus-quote'));
    });
  });

  document.querySelectorAll('[data-peel]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!peel) return;
      e.preventDefault();
      window.scrollTo({ top: peel.toScroll(a.getAttribute('data-peel')), behavior: smooth() });
    });
  });

  /* ---------------- the scroll peel ---------------- */

  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  if (!gsap || !ST) { root.classList.remove('js'); return; }
  gsap.registerPlugin(ST);

  var stage = document.querySelector('.stage');
  var sheets = {
    white: stage.querySelector('[data-copy="white"]'),
    canary: stage.querySelector('[data-copy="canary"]'),
    pink: stage.querySelector('[data-copy="pink"]')
  };

  function inkOf(sheet) { return sheet.querySelectorAll('.record .hand'); }

  function addPeel(tl, top, under) {
    var at = tl.duration();
    var shade = top.querySelector('.sheet__shade');
    var curl = top.querySelector('.sheet__curl');
    var cast = under.querySelector('.sheet__cast');
    tl.addLabel('lift-' + top.getAttribute('data-copy'), at)
      // the bottom edge lifts toward you
      .to(top, { rotationX: 30, rotationY: 3, duration: 0.5, ease: 'sine.in' }, at)
      .to(shade, { opacity: 1, duration: 0.5 }, at)
      .to(curl, { opacity: 1, duration: 0.35 }, at)
      .to(cast, { opacity: 1, duration: 0.5 }, at)
      // carbon shows through on the copy below
      .to(inkOf(under), { clipPath: 'inset(-30% 0% -30% 0%)', duration: 0.2, stagger: 0.045, ease: 'power1.out' }, at + 0.06)
      // then it curls up and away over the spine
      .to(top, { rotationX: 84, rotationZ: -3, rotationY: 8, yPercent: -42, duration: 0.55, ease: 'power2.in' }, at + 0.5)
      .to(cast, { opacity: 0, duration: 0.35, ease: 'power1.in' }, at + 0.7)
      .to(top, { autoAlpha: 0, duration: 0.06 }, at + 0.99);
  }

  var mm = gsap.matchMedia();

  mm.add(PEEL_QUERY, function () {
    var hidden = [].concat(Array.prototype.slice.call(inkOf(sheets.canary)), Array.prototype.slice.call(inkOf(sheets.pink)));
    var ring = sheets.canary.querySelector('.mark-ring');
    var tick = sheets.pink.querySelector('.mark-tick');
    var strike = sheets.pink.querySelector('.strike path');
    var stamp = sheets.pink.querySelector('.stamp--paid');

    gsap.set([sheets.white, sheets.canary, sheets.pink], { transformOrigin: '50% 0%', force3D: true });
    gsap.set(hidden, { clipPath: 'inset(-30% 100% -30% 0%)' });
    gsap.set([ring, tick], { clipPath: 'inset(-40% 100% -40% 0%)' });
    gsap.set(strike, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(stamp, { autoAlpha: 0, scale: 1.45, rotation: -15 });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: function () { return '+=' + Math.round(window.innerHeight * 2.5); },
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    tl.addLabel('white', 0).to({}, { duration: 0.28 });
    addPeel(tl, sheets.white, sheets.canary);
    tl.to(ring, { clipPath: 'inset(-40% 0% -40% 0%)', duration: 0.18, ease: 'power1.inOut' })
      .addLabel('canary')
      .to({}, { duration: 0.4 });
    addPeel(tl, sheets.canary, sheets.pink);
    tl.to(tick, { clipPath: 'inset(-40% 0% -40% 0%)', duration: 0.1 })
      .to(strike, { strokeDashoffset: 0, duration: 0.1, ease: 'power1.out' })
      .to(stamp, { autoAlpha: 0.9, scale: 1, rotation: -9, duration: 0.12, ease: 'power4.in' })
      .addLabel('pink')
      .to({}, { duration: 0.5 });

    var st = tl.scrollTrigger;
    peel = {
      toScroll: function (label) { return Math.round(st.labelToScroll(label)) + (label === 'white' ? 0 : 2); }
    };

    // keyboard users land on the copy that holds their focus
    function onFocus(e) {
      var sheet = e.target.closest && e.target.closest('.sheet');
      if (!sheet) return;
      var name = sheet.getAttribute('data-copy');
      var y = window.scrollY;
      var showing = y < st.labelToScroll('lift-white') + 2 ? 'white'
        : (y >= st.labelToScroll('canary') && y < st.labelToScroll('lift-canary') + 2) ? 'canary'
        : y >= st.labelToScroll('pink') - 2 ? 'pink' : '';
      if (showing !== name) window.scrollTo({ top: peel.toScroll(name), behavior: 'auto' });
    }
    stage.addEventListener('focusin', onFocus);

    return function () {
      stage.removeEventListener('focusin', onFocus);
      peel = null;
    };
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
})();
