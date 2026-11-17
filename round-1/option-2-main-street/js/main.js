/* Harper Health Network, option 2: forms, hero entrance, street walk */
(function () {
  'use strict';

  /* ---------- Quote placards ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function check(form) {
    var biz = form.elements.business;
    var size = form.elements.size;
    var email = form.elements.email;
    var errors = [];
    var bizVal = biz.value.trim();
    var sizeVal = size.value.trim();
    var emailVal = email.value.trim();

    if (bizVal.length < 2) errors.push([biz, 'Add your business name.']);
    else ok(biz);

    if (!sizeVal) errors.push([size, 'Add how many people work for you, like 18.']);
    else if (!/^\d+$/.test(sizeVal) || +sizeVal < 1) errors.push([size, 'Use a whole number, like 18.']);
    else if (+sizeVal > 5000) errors.push([size, 'That looks too big. Check the number.']);
    else ok(size);

    if (!emailVal) errors.push([email, 'Add your email so we can send the quote.']);
    else if (!EMAIL.test(emailVal)) errors.push([email, 'Check the email. It needs an @ and a domain, like you@shop.com.']);
    else ok(email);

    errors.forEach(function (e) { bad(e[0], e[1]); });
    return errors;
  }
  function errEl(input) { return document.getElementById(input.getAttribute('aria-describedby')); }
  function bad(input, msg) { input.setAttribute('aria-invalid', 'true'); errEl(input).textContent = msg; }
  function ok(input) { input.removeAttribute('aria-invalid'); errEl(input).textContent = ''; }

  // No backend yet: the request goes out through the visitor's email app.
  function mailQuote(business, size, email) {
    var body = 'Hi Harper team,\r\n\r\nPlease send a quote.\r\nBusiness: ' + business + '\r\nTeam size: ' + size + '\r\nReply to: ' + email + '\r\n\r\nThanks';
    window.location.href = 'mailto:contact@harperhealthnetwork.com?subject=' + encodeURIComponent('Quote request, ' + business) + '&body=' + encodeURIComponent(body);
  }

  document.querySelectorAll('[data-quote]').forEach(function (form) {
    var placard = form.closest('[data-placard]');
    var done = placard.querySelector('.quote-done');
    var btn = form.querySelector('.push-plate');
    var label = btn.querySelector('.push-plate__label');
    var touched = false;

    form.addEventListener('input', function (e) {
      if (touched && e.target.matches('input') && e.target.getAttribute('aria-invalid') === 'true') check(form);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      touched = true;
      var errors = check(form);
      if (errors.length) { errors[0][0].focus(); return; }

      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
      label.textContent = 'Sending';
      mailQuote(form.elements.business.value.trim(), form.elements.size.value.trim(), form.elements.email.value.trim());
      window.setTimeout(function () {
        done.querySelector('[data-out="business"]').textContent = form.elements.business.value.trim();
        done.querySelector('[data-out="email"]').textContent = form.elements.email.value.trim();
        form.hidden = true;
        done.hidden = false;
        done.focus();
        btn.removeAttribute('aria-busy');
        btn.disabled = false;
        label.textContent = 'Get my quote';
        if (window.gsap && !reduce()) {
          gsap.fromTo(placard, { rotation: -4 }, { rotation: 0, duration: 1.2, ease: 'elastic.out(1, 0.4)', transformOrigin: '50% -30px' });
        }
      }, 650);
    });

    done.querySelector('[data-reset]').addEventListener('click', function () {
      done.hidden = true;
      form.hidden = false;
      form.elements.business.focus();
    });
  });

  function reduce() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

  if (!window.gsap) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Hero entrance: the door opens, the sign gets painted, the placard swings ---------- */
  if (!reduce()) {
    var hero = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
    hero
      .from('.door__leaf', { attr: { points: '24,138 276,138 276,640 24,640' }, duration: 1.3, ease: 'power3.inOut' }, 0)
      .from('.door__pane', { attr: { points: '50,172 250,172 250,420 50,420' }, duration: 1.3, ease: 'power3.inOut' }, 0)
      .from('.door__plate', { attr: { points: '226,446 240,446 240,500 226,500' }, duration: 1.3, ease: 'power3.inOut' }, 0)
      .from('.door__room', { opacity: 0.35, duration: 1.2, ease: 'power2.out' }, 0.25)
      .from('.window__title', { clipPath: 'inset(-10% 100% -10% 0)', duration: 1.1, ease: 'power2.inOut', clearProps: 'clipPath' }, 0.3)
      .from('.window__script', { clipPath: 'inset(-20% 100% -20% 0)', duration: 0.9, ease: 'power1.inOut', clearProps: 'clipPath' }, 1.05)
      .from('.window__lede, .window__walk', { opacity: 0, y: 12, duration: 0.8, stagger: 0.08 }, 1.25)
      .from('.facade .placard-wrap', { rotation: -9, y: -18, opacity: 0, duration: 1.6, ease: 'elastic.out(1, 0.42)', transformOrigin: '50% 10px' }, 0.75);
  }

  /* ---------- The walk down Main Street ---------- */
  if (!window.ScrollTrigger) return;

  var walk = document.querySelector('.walk');
  var track = walk.querySelector('[data-track]');
  var shops = Array.prototype.slice.call(walk.querySelectorAll('[data-shop]'));
  var intro = walk.querySelector('.walk__intro');
  var traveler = walk.querySelector('[data-traveler]');
  var pathDone = walk.querySelector('[data-path]');
  var blade = walk.querySelector('[data-blade]');
  var bladeText = ['Start here', 'No. 1, your office', 'No. 2, your crew', 'No. 3, the clinic', 'No. 4, payday'];

  var mm = gsap.matchMedia();
  mm.add('(min-width: 961px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)', function () {
    walk.classList.add('is-walking');
    walk.setAttribute('data-stop', '0');

    function maxShift() { return Math.max(0, track.scrollWidth - window.innerWidth); }
    function trackW() { return track.scrollWidth; }
    function shopShift(i) {
      var s = shops[i];
      return -Math.min(maxShift(), Math.max(0, s.offsetLeft + s.offsetWidth / 2 - window.innerWidth / 2));
    }
    function doorX(i) {
      var s = shops[i];
      var m = s.querySelector('.shop__credit');
      return s.offsetLeft + m.offsetLeft + m.offsetWidth / 2;
    }
    function startX() { return intro.offsetLeft + intro.offsetWidth * 0.55; }

    gsap.set(traveler, { xPercent: -50, y: -38, x: startX });
    gsap.set(pathDone, { scaleX: function () { return startX() / trackW(); } });

    var arrivals = [];
    var tl = gsap.timeline({
      defaults: { ease: 'power1.inOut' },
      scrollTrigger: {
        trigger: walk,
        start: 'top top',
        end: function () { return '+=' + Math.round(maxShift() * 1.35); },
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: function () { setStop(); }
      }
    });

    tl.to({}, { duration: 0.25 });
    shops.forEach(function (s, i) {
      var at = tl.duration();
      tl.to(track, { x: function () { return shopShift(i); }, duration: 1 }, at)
        .to(traveler, { x: function () { return doorX(i); }, duration: 1 }, at)
        .to(pathDone, { scaleX: function () { return doorX(i) / trackW(); }, duration: 1 }, at);
      arrivals.push(tl.duration() - 0.08);
      tl.to({}, { duration: 0.45 });
    });

    var current = -1;
    function setStop() {
      var t = tl.time();
      var stop = 0;
      for (var i = 0; i < arrivals.length; i++) if (t >= arrivals[i]) stop = i + 1;
      if (stop === current) return;
      current = stop;
      walk.setAttribute('data-stop', String(stop));
      blade.textContent = bladeText[stop];
      shops.forEach(function (s, i) { s.classList.toggle('is-here', i < stop); });
    }
    setStop();

    return function () {
      walk.classList.remove('is-walking');
      walk.removeAttribute('data-stop');
      shops.forEach(function (s) { s.classList.remove('is-here'); });
      gsap.set([track, traveler, pathDone], { clearProps: 'all' });
      blade.textContent = bladeText[0];
    };
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
