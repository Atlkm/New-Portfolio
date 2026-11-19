/* =========================================================
   ATLKM portfolio — script.js
   ========================================================= */
(() => {
  'use strict';

  // ---- Settings you may want to change -----------------------------------
  const CONTACT_EMAIL = 'hello@example.com';   // <- put your real email here
  // -------------------------------------------------------------------------

  const COLORS = ['#EBC13E', '#69BF4A', '#FF8040', '#FF5C5C'];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- intro: cube → sphere → triangle → star ---------- */
  const root = document.documentElement;
  const intro = $('#intro');
  let introDone = false;

  function endIntro() {
    if (introDone) return;
    introDone = true;
    root.classList.remove('intro-active');
    if (intro) { intro.classList.add('hide'); setTimeout(() => intro.remove(), 900); }
  }

  async function runIntro() {
    const stage = $('.intro__shape', intro);
    const shapes = $$('.intro__shape svg', intro);
    const show = i => shapes.forEach((s, k) => s.classList.toggle('on', k === i));
    const JUMP = 900;
    const up = 'cubic-bezier(.2,.7,.3,1)', down = 'cubic-bezier(.7,0,.9,.5)';

    // each jump: crouch (squash) → launch (stretch) → apex (shape + colour switch) → fall (stretch) → land (squash) → settle
    const jump = [
      { offset: 0,   transform: 'translateY(0) scale(1,1)',            easing: 'ease-in' },
      { offset: .10, transform: 'translateY(0) scale(1.22,.76)',       easing: up },
      { offset: .26, transform: 'translateY(-34px) scale(.84,1.24)',   easing: up },
      { offset: .55, transform: 'translateY(-150px) scale(1,1)',       easing: down },
      { offset: .86, transform: 'translateY(-12px) scale(.88,1.18)',   easing: 'ease-out' },
      { offset: .94, transform: 'translateY(0) scale(1.24,.74)',       easing: 'ease-out' },
      { offset: 1,   transform: 'translateY(0) scale(1,1)' }
    ];

    try {
      show(0);
      await stage.animate([
        { offset: 0,   transform: 'translateY(-55vh) scale(.88,1.25)', opacity: 0, easing: 'ease-in' },
        { offset: .15, transform: 'translateY(-45vh) scale(.88,1.25)', opacity: 1, easing: 'ease-in' },
        { offset: .72, transform: 'translateY(0) scale(1.26,.72)',     opacity: 1, easing: 'ease-out' },
        { offset: 1,   transform: 'translateY(0) scale(1,1)',          opacity: 1 }
      ], { duration: 700 }).finished;

      for (let i = 1; i <= 3 && !introDone; i++) {
        setTimeout(() => { if (!introDone) show(i); }, JUMP * .55);
        await stage.animate(jump, { duration: JUMP }).finished;
      }

      // the star leaves: crouch, then stretches up and away
      if (!introDone) {
        await stage.animate([
          { offset: 0,   transform: 'translateY(0) scale(1,1)',        easing: 'ease-in' },
          { offset: .28, transform: 'translateY(0) scale(1.24,.74)',   easing: up },
          { offset: 1,   transform: 'translateY(-75vh) scale(.7,1.4)', opacity: 0 }
        ], { duration: 600, fill: 'forwards' }).finished;
      }
    } catch (err) { /* animation cancelled — just move on */ }
    endIntro();
  }

  if (intro && !reduceMotion && typeof intro.animate === 'function' && root.classList.contains('intro-active')) {
    intro.addEventListener('click', endIntro);   // click to skip
    setTimeout(endIntro, 8000);                  // safety net
    runIntro();
  } else {
    endIntro();
  }

  // on the game pages: remember that the visitor is heading back home, so the intro doesn't replay
  if (!intro) {
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href^="index.html"]');
      if (a) { try { sessionStorage.setItem('skipIntro', '1'); } catch (err) { /* ignore */ } }
    });
  }

  /* ---------- eased scrolling (wheel + anchor links) ---------- */
  let cur = window.scrollY, mid = cur, tgt = cur, mode = null, raf = 0;
  const maxY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const stopSmooth = () => { cancelAnimationFrame(raf); mode = null; };

  // wheel: two chained easings give a soft ease-in at the start and ease-out at the end
  function wheelLoop() {
    mid += (tgt - mid) * .14;
    cur += (mid - cur) * .14;
    if (Math.abs(tgt - cur) < .4 && Math.abs(tgt - mid) < .4) { cur = mid = tgt; }
    window.scrollTo(0, cur);
    if (cur === tgt) { mode = null; return; }
    raf = requestAnimationFrame(wheelLoop);
  }

  // anchor links: ease-in-out cubic
  function animateTo(y) {
    y = Math.min(maxY(), Math.max(0, y));
    const from = window.scrollY;
    if (reduceMotion) { window.scrollTo(0, y); return; }
    const dur = Math.min(1600, Math.max(800, 600 + Math.abs(y - from) * .35));
    const t0 = performance.now();
    stopSmooth(); mode = 'anim';
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      cur = mid = tgt = from + (y - from) * e;
      window.scrollTo(0, cur);
      if (p < 1 && mode === 'anim') raf = requestAnimationFrame(step);
      else if (mode === 'anim') mode = null;
    };
    raf = requestAnimationFrame(step);
  }

  if (finePointer && !reduceMotion) {
    window.addEventListener('wheel', e => {
      if (e.ctrlKey || e.defaultPrevented || root.classList.contains('intro-active')) return;
      if (e.target.closest && e.target.closest('textarea')) return;
      e.preventDefault();
      if (mode !== 'wheel') { stopSmooth(); cur = mid = tgt = window.scrollY; mode = 'wheel'; }
      const unit = e.deltaMode === 1 ? 34 : e.deltaMode === 2 ? window.innerHeight : 1;
      tgt = Math.min(maxY(), Math.max(0, tgt + e.deltaY * unit));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(wheelLoop);
    }, { passive: false });
  }
  ['touchstart', 'mousedown', 'keydown'].forEach(t => window.addEventListener(t, stopSmooth, { passive: true }));
  window.addEventListener('scroll', () => { if (!mode) cur = mid = tgt = window.scrollY; }, { passive: true });

  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href').slice(1);
    e.preventDefault();
    if (!id) return;                       // placeholder links (href="#")
    const el = document.getElementById(id);
    if (!el) return;
    animateTo(id === 'home' ? 0 : el.getBoundingClientRect().top + window.scrollY - 70);
    try { history.pushState(null, '', '#' + id); } catch (err) { /* ignore */ }
  });

  /* ---------- footer year ---------- */
  const yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- nav: sticky state, mobile toggle, active link ---------- */
  const nav = $('#nav');
  const navList = $('#navList');
  const navToggle = $('#navToggle');

  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  onScrollNav();

  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
  });
  $$('.nav__link').forEach(a => a.addEventListener('click', () => {
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navList.classList.contains('open')) {
      navList.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });

  const links = $$('.nav__link');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* ---------- scroll reveal ---------- */
  const revealIO = new IntersectionObserver((entries, io) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el, i) => {
    // light stagger for siblings inside the games stage
    if (el.classList.contains('game')) el.style.transitionDelay = (i % 4) * 0.08 + 's';
    revealIO.observe(el);
  });

  /* ---------- hero / about mouse parallax ---------- */
  if (finePointer && !reduceMotion) {
    const zones = [$('.hero'), $('.art')].filter(Boolean);
    zones.forEach(zone => {
      const items = $$('[data-depth]', zone);
      zone.addEventListener('pointermove', e => {
        const r = zone.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - .5;
        const ny = (e.clientY - r.top) / r.height - .5;
        items.forEach(el => {
          const d = parseFloat(el.dataset.depth);
          el.style.translate = `${nx * d}px ${ny * d}px`;
        });
      });
      zone.addEventListener('pointerleave', () => items.forEach(el => (el.style.translate = '')));
    });
  }

  /* ---------- floating colour shapes in the paper background ---------- */
  const floatWrap = $('#floaters');
  const floaters = [];
  function buildFloaters() {
    if (!floatWrap || reduceMotion) return;
    floatWrap.innerHTML = '';
    floaters.length = 0;
    const docH = document.documentElement.scrollHeight;
    const isMobile = window.innerWidth < 700;
    const count = isMobile ? 9 : 18;
    const types = ['circle', 'square', 'tri', 'ring', 'plus'];

    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      const type = types[i % types.length];
      const size = rand(isMobile ? 12 : 14, isMobile ? 24 : 34);
      const onLeft = i % 2 === 0;
      const x = onLeft ? rand(1, isMobile ? 6 : 8) : rand(isMobile ? 92 : 90, 98);
      const y = ((i + .5) / count) * docH + rand(-80, 80);

      el.className = 'fl fl--' + type;
      el.style.cssText =
        `left:${x}%;top:${Math.max(40, y)}px;--s:${size}px;--c:${COLORS[i % 4]};` +
        `--t:${rand(4, 9).toFixed(1)}s;--dl:${(-rand(0, 6)).toFixed(1)}s;` +
        `--dx:${rand(-20, 20).toFixed(0)}px;--dy:${rand(-30, 30).toFixed(0)}px;--rot:${rand(-180, 180).toFixed(0)}deg;`;
      floatWrap.appendChild(el);
      floaters.push({ el, speed: rand(.03, .14) * (i % 3 === 0 ? -1 : 1) });
    }
    updateParallax();
  }

  let ticking = false;
  function updateParallax() {
    const y = window.scrollY;
    floaters.forEach(f => f.el.style.setProperty('--py', (y * f.speed).toFixed(1) + 'px'));
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    onScrollNav();
    if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
  }, { passive: true });

  window.addEventListener('load', buildFloaters);
  let rz;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(buildFloaters, 300); });

  /* ---------- scroll ribbon: a green line that draws itself as you scroll and ends in Contact ---------- */
  const ribbonBox = $('#ribbon');
  const ribbonPath = $('#ribbonPath');
  const mainEl = $('main');
  if (ribbonBox && ribbonPath && mainEl) {
    const ribbonSvg = $('svg', ribbonBox);
    const STEP = 6;                 // sampling step (px) used to map page position -> length along the line
    let total = 0, ys = [], mainTop = 0, shown = 0, rbRaf = 0;

    // position of an element inside <main>, ignoring transforms (so reveal animations don't skew it)
    const pos = el => {
      let x = 0, y = 0, n = el;
      while (n && n !== mainEl) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { l: x, t: y, r: x + el.offsetWidth, b: y + el.offsetHeight };
    };

    // smooth S-curve between two points, with vertical tangents at both ends
    const S = (x0, y0, x1, y1) => {
      const k = (y1 - y0) * .7;
      return ` L${x0},${y0} C${x0},${y0 + k} ${x1},${y1 - k} ${x1},${y1}`;
    };

    function buildRibbon() {
      const W = mainEl.offsetWidth, H = mainEl.offsetHeight;
      ribbonSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);

      const hero = pos($('#home')), about = pos($('#about')), games = pos($('#games')),
            works = pos($('#works')), contact = pos($('#contact'));
      const sq = pos($('.connect .sq--big'));
      const padX = parseFloat(getComputedStyle($('#about')).paddingLeft) || 20;
      const L = about.l + padX / 2, R = about.r - padX / 2;      // left / right gutters
      const gap = 90;                                           // how far each crossing reaches into a section's padding

      let d = `M${W / 2},${hero.b - 70}`;
      d += S(W / 2, hero.b - 70, R, about.t + 120);             // hero  -> right gutter
      d += S(R, about.b - gap, L, games.t + gap);               // about -> games   (right to left)
      d += S(L, games.b - gap, R, works.t + gap);               // games -> works   (left to right)
      d += S(R, works.b - gap, L, contact.t + gap);             // works -> contact (right to left)

      // final run: down the left gutter, then turn into the contact colour squares and stop there
      const endY = sq.t + sq.b > 0 ? (sq.t + sq.b) / 2 : contact.b - 120;
      const endX = sq.l - 16;
      const dx = endX - L;
      if (dx > 40) {
        const r = Math.min(40, dx / 2);
        d += ` L${L},${endY - r} Q${L},${endY} ${L + r},${endY} L${endX},${endY}`;
      } else {
        d += ` L${L},${endY}`;
      }
      ribbonPath.setAttribute('d', d);

      total = ribbonPath.getTotalLength();
      ribbonPath.style.strokeDasharray = total;
      ys = [];
      for (let l = 0; l <= total + STEP; l += STEP) ys.push(ribbonPath.getPointAtLength(Math.min(l, total)).y);
      mainTop = mainEl.getBoundingClientRect().top + window.scrollY;

      shown = targetLength();
      paintRibbon();
    }

    // how much of the line should be drawn for the current scroll position
    function targetLength() {
      if (!ys.length) return 0;
      const max = maxY();
      const prog = max ? Math.min(1, window.scrollY / max) : 1;
      // the "pen" sits half way down the screen at the top of the page and slides to the very bottom at the end of the page,
      // so the line always finishes exactly at the contact section
      const yT = window.scrollY + window.innerHeight * (.5 + .5 * prog) - mainTop;
      if (yT <= ys[0]) return 0;
      if (yT >= ys[ys.length - 1]) return total;
      let lo = 0, hi = ys.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ys[m] <= yT) lo = m; else hi = m; }
      const f = (yT - ys[lo]) / ((ys[hi] - ys[lo]) || 1);
      return Math.min(total, (lo + f) * STEP);
    }

    function paintRibbon() { ribbonPath.style.strokeDashoffset = (total - shown).toFixed(1); }

    // ease the drawn length towards its target every frame -> soft, flowing movement
    function ribbonLoop() {
      const t = targetLength();
      shown += (t - shown) * (reduceMotion ? 1 : .09);
      if (Math.abs(t - shown) < .3) shown = t;
      paintRibbon();
      rbRaf = shown === t ? 0 : requestAnimationFrame(ribbonLoop);
    }
    const kickRibbon = () => { if (!rbRaf) rbRaf = requestAnimationFrame(ribbonLoop); };

    window.addEventListener('scroll', kickRibbon, { passive: true });
    window.addEventListener('load', buildRibbon);
    let rbT;
    const rebuild = () => { clearTimeout(rbT); rbT = setTimeout(buildRibbon, 150); };
    window.addEventListener('resize', rebuild);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(mainEl);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildRibbon);
    buildRibbon();
  }

  /* ---------- Personal Works: stacked sheets ---------- */
  const stack = $('#stack');
  if (stack) {
    const sheets = $$('.sheet', stack);
    let order = sheets.map(s => s.dataset.key);          // order[0] is the front sheet
    let busy = false;
    const byKey = k => sheets.find(s => s.dataset.key === k);

    function layout() {
      sheets.forEach(s => {
        const pos = order.indexOf(s.dataset.key);
        s.dataset.pos = pos;
        const content = $('.sheet__content', s);
        if (content) content.inert = pos !== 0;          // only the front sheet's content is reachable
        const tag = $('.tag', s);
        if (pos === 0) tag.setAttribute('aria-current', 'true'); else tag.removeAttribute('aria-current');
      });
    }
    const dots = $$('.stack-dot');
    function paintDots() { dots.forEach(d => { const on = d.dataset.key === order[0]; d.classList.toggle('on', on); on ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'); }); }
    layout();
    paintDots();

    function bringToFront(key, back) {
      if (busy || order[0] === key) return;
      busy = true;
      const clicked = byKey(key);
      const prev = byKey(order[0]);
      // 1) the chosen sheet slips out of the pile, the front sheet drops away
      clicked.classList.add('lift');
      prev.classList.add('drop');
      setTimeout(() => {
        // 2) swap: chosen sheet to the front, old front sheet to the back
        const rest = order.filter(k => k !== key && k !== prev.dataset.key);
        // forward: old front goes to the very back; backward (swipe right): old front slides in right behind the new one
        order = back ? [key, prev.dataset.key, ...rest] : [key, ...rest, prev.dataset.key];
        clicked.classList.remove('lift');
        prev.classList.remove('drop');
        layout();
        paintDots();
        setTimeout(() => { busy = false; }, reduceMotion ? 0 : 700);
      }, reduceMotion ? 0 : 330);
    }

    sheets.forEach(s => {
      s.addEventListener('click', e => {
        if (e.target.closest('.tag')) return;
        if (s.dataset.pos !== '0') bringToFront(s.dataset.key);
      });
      $('.tag', s).addEventListener('click', () => bringToFront(s.dataset.key));
    });
    dots.forEach(d => d.addEventListener('click', () => {
      const from = sheets.map(s => s.dataset.key);          // fixed order: yellow, green, orange
      bringToFront(d.dataset.key, from.indexOf(d.dataset.key) < from.indexOf(order[0]));
    }));

    // swipe: left = next section, right = previous (touch, pen or mouse drag)
    const go = dir => dir > 0 ? bringToFront(order[1]) : bringToFront(order[order.length - 1], true);
    let sx = 0, sy = 0, sid = null, swiped = false;
    stack.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sx = e.clientX; sy = e.clientY; sid = e.pointerId; swiped = false;
    });
    stack.addEventListener('pointerup', e => {
      if (sid !== e.pointerId) return;
      sid = null;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { swiped = true; go(dx < 0 ? 1 : -1); }
    });
    stack.addEventListener('pointercancel', () => { sid = null; });
    stack.addEventListener('click', e => { if (swiped) { e.stopPropagation(); e.preventDefault(); swiped = false; } }, true);
    stack.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
  }

  /* ---------- contact form (opens the visitor's mail app) ---------- */
  const form = $('#contactForm');
  if (form) {
    const note = $('#formNote');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = form.elements;
      let ok = true;
      ['name', 'email', 'message'].forEach(k => {
        const el = f[k];
        const bad = !el.value.trim() || (k === 'email' && !/^\S+@\S+\.\S+$/.test(el.value));
        el.classList.remove('invalid');
        if (bad) { void el.offsetWidth; el.classList.add('invalid'); ok = false; }
      });
      if (!ok) { note.textContent = 'Please fill in every field with a valid email.'; return; }

      const subject = encodeURIComponent('Hello from ' + f.name.value.trim());
      const body = encodeURIComponent(f.message.value.trim() + '\n\n— ' + f.name.value.trim() + ' (' + f.email.value.trim() + ')');
      note.textContent = 'Opening your mail app…';
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    });
  }
})();
