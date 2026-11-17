// Project cards behaviour, ported from the design file (3a · 6a · 7a). Changes for the site:
//  - the title, ticks and hint line up with the site name in the nav ("Nick Fitzpatrick"),
//    and the gold node sits just after the end of the title, with the lines redrawn from there;
//  - keyboard: Enter or Space opens a card and focus moves to its close button; Esc or × closes
//    and returns focus to the card; tabbing to a card on another page scrolls to that page;
//  - reduced motion: no tilt, no smooth scrolling;
//  - the custom cursor ring only grows over closed cards.
import { reducedMotion } from './env.js';

const SLOTS = [[520, 70], [880, 150], [560, 430], [920, 500]];
const NODE_GAP = 30;      // stage px from the end of the title to the centre of the node
const NODE_HEIGHT = 0.52; // the node sits this far down the title's last line (as designed: 50 of 96 px)
const TEXT_BOTTOM = 252 - 16; // closed card: text stops this far down (card height less a 16px buffer)

export function initProjectCards(sectionEls) {
  const reduced = reducedMotion();
  const navName = document.querySelector('.nav__name');
  let scale = 1;

  const sections = [...sectionEls].map((sec) => {
    const stage = sec.querySelector('.pc-stage');
    const st = { sec, stage, cards: [...stage.querySelectorAll('.pc-card')], pages: Number(sec.dataset.pages), cur: -1, hot: -1, open: -1 };
    st.n = st.cards.length;
    st.cards.forEach((el, i) => {
      place(el, i);
      el.addEventListener('mouseenter', () => { if (st.open < 0) { st.hot = i; paint(st); } });
      el.addEventListener('mouseleave', () => { if (st.open < 0) { st.hot = -1; paint(st); } el.style.setProperty('--tx', 0); el.style.setProperty('--ty', 0); });
      el.addEventListener('click', (e) => { if (st.open < 0) { e.stopPropagation(); settleThenOpen(st, i); } });
      el.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === el && st.open < 0) { e.preventDefault(); settleThenOpen(st, i); }
      });
      el.addEventListener('focus', () => { // a keyboard user tabbing to a card on another page: go there
        if (st.open >= 0) return;
        const k = Math.floor(i / 4);
        if (k !== st.cur) jump(st, k);
        st.hot = i; paint(st);
      });
      el.addEventListener('blur', () => { if (st.open < 0) { st.hot = -1; paint(st); } });
      el.addEventListener('mousemove', (e) => {
        if (st.open !== i || reduced) return;
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--tx', ((x - 0.5) * 2).toFixed(3)); el.style.setProperty('--ty', ((y - 0.5) * 2).toFixed(3));
        el.style.setProperty('--mx', x * 100 + '%'); el.style.setProperty('--my', y * 100 + '%');
      });
      const sc = el.querySelector('.pc-scroll');
      sc.addEventListener('scroll', () => {
        const max = sc.scrollHeight - sc.clientHeight;
        el.querySelector('.pc-prog i').style.width = (max > 0 ? (sc.scrollTop / max) * 100 : 0) + '%';
        el.classList.toggle('scrolled', sc.scrollTop > 20);
      });
      el.querySelector('.pc-x').addEventListener('click', (e) => { e.stopPropagation(); closeCard(st); });
      const nx = el.querySelector('.pc-next');
      if (nx) nx.addEventListener('click', (e) => { e.stopPropagation(); openCard(st, (i + 1) % st.n); });
    });
    sec.querySelector('.pc-pin').addEventListener('click', (e) => { if (st.open >= 0 && !e.target.closest('.pc-card.open')) closeCard(st); });
    stage.querySelectorAll('.pc-tick').forEach((b) => b.addEventListener('click', () => jump(st, Number(b.dataset.k))));

    // small screens: tap to expand inline
    const listCards = st.list = [...sec.querySelectorAll('.pc-list .pc-card')];
    // while any card is open it fills the screen, so the fish swims behind the cards instead of leaving
    const syncFish = () => {
      const anyOpen = listCards.some((c) => c.classList.contains('expanded'));
      listCards.forEach((c) => { if (anyOpen) delete c.dataset.fishAvoid; else c.dataset.fishAvoid = ''; });
    };
    listCards.forEach((el, i) => {
      el.setAttribute('aria-expanded', 'false');
      const toggle = (on) => {
        el.classList.toggle('expanded', on); el.setAttribute('aria-expanded', String(on));
        syncFish();
        // collapsing a card the reader has scrolled into would leave them several cards further down; bring its top back into view
        const top = el.getBoundingClientRect().top;
        if (!on && top < 0) window.scrollTo({ top: top + scrollY - 72, behavior: 'instant' });
      };
      el.pcToggle = toggle;
      el.addEventListener('click', (e) => { if (!e.target.closest('.pc-next, a, video')) toggle(!el.classList.contains('expanded')); });
      el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); toggle(!el.classList.contains('expanded')); } });
      const nx = el.querySelector('.pc-next');
      if (nx) nx.addEventListener('click', (e) => {
        e.stopPropagation(); toggle(false);
        const to = listCards[(i + 1) % listCards.length];
        to.classList.add('expanded'); to.setAttribute('aria-expanded', 'true'); syncFish();
        window.scrollTo({ top: to.getBoundingClientRect().top + scrollY - 20, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
    return st;
  });
  if (!sections.length) return;

  function jump(st, k) {
    window.scrollTo({ top: st.sec.offsetTop + k * innerHeight, behavior: reduced ? 'auto' : 'smooth' });
  }

  function place(el, i) { const [x, y] = SLOTS[i % 4]; Object.assign(el.style, { left: x + 'px', top: y + 'px', width: '270px', height: '252px' }); }

  function fit(st) {
    // Fills the space under the nav: a small gap below the nav bar, a matching one at the bottom.
    const el = st.cards[st.open], r = st.stage.getBoundingClientRect();
    const nav = document.querySelector('.nav'), gap = 16;
    const top = (nav ? nav.getBoundingClientRect().bottom : 0) + gap, bottom = innerHeight - gap * 1.5;
    Object.assign(el.style, {
      left: (innerWidth * 0.1 - r.left) / scale + 'px', top: (top - r.top) / scale + 'px',
      width: (innerWidth * 0.8) / scale + 'px', height: (bottom - top) / scale + 'px',
    });
  }

  function shut(st) { // undo the open state of the current card, without touching anything else
    const el = st.cards[st.open];
    el.classList.remove('open', 'scrolled');
    el.dataset.cursor = 'grow';
    place(el, st.open);
  }

  // If the section is only partly on screen (the pin isn't stuck to the top yet, or is leaving),
  // scroll it flush first; otherwise the pin's clipping cuts the open card in half.
  function settleThenOpen(st, i) {
    const off = st.sec.querySelector('.pc-pin').getBoundingClientRect().top;
    if (Math.abs(off) < 2) return openCard(st, i);
    let done = false;
    const go = () => { if (done) return; done = true; removeEventListener('scrollend', go); openCard(st, i); };
    addEventListener('scrollend', go, { once: true });
    setTimeout(go, reduced ? 50 : 700); // browsers without scrollend
    scrollBy({ top: off, behavior: reduced ? 'auto' : 'smooth' });
  }

  function openCard(st, i) {
    const wasOpen = st.open >= 0;
    if (wasOpen) shut(st);
    st.open = i; st.hot = -1;
    const el = st.cards[i];
    el.querySelector('.pc-scroll').scrollTop = 0; el.querySelector('.pc-prog i').style.width = '0%';
    el.classList.add('open'); st.stage.classList.add('is-open');
    delete el.dataset.cursor; // the cursor ring stays small inside the open case study
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.classList.add('pc-open'); // hides the nav's fade so it doesn't dim the card's top
    // The fish stays where it is, behind the open card, instead of being pushed out from under the cards.
    if (!wasOpen) st.cards.forEach((c) => { c.dataset.fishAvoidWas = c.dataset.fishAvoid ?? ''; delete c.dataset.fishAvoid; });
    fit(st); paint(st);
    el.querySelector('.pc-x').focus({ preventScroll: true });
  }

  function closeCard(st) {
    if (st.open < 0) return;
    const el = st.cards[st.open];
    shut(st); st.open = -1;
    st.stage.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    document.documentElement.classList.remove('pc-open');
    st.cards.forEach((c) => { c.dataset.fishAvoid = c.dataset.fishAvoidWas; delete c.dataset.fishAvoidWas; });
    paint(st);
    el.focus({ preventScroll: true });
  }

  addEventListener('keydown', (e) => { if (e.key === 'Escape') sections.forEach(closeCard); });

  // A project picked in the Work Index: scroll to its card and open it.
  const small = matchMedia('(max-width: 759px)');
  document.addEventListener('project:open', ({ detail: { cat, slug } }) => {
    const st = sections.find((s) => s.sec.id === cat);
    if (!st) return;
    if (small.matches) { // stacked list: expand inline, then bring its top just under the nav name
      const el = st.list.find((c) => c.dataset.slug === slug);
      if (!el) return;
      if (!el.classList.contains('expanded')) el.pcToggle(true);
      window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 72, behavior: reduced ? 'auto' : 'smooth' });
      return;
    }
    const i = st.cards.findIndex((c) => c.dataset.slug === slug);
    if (i < 0) return;
    sections.forEach(closeCard);
    scrollThen(st.sec.offsetTop + Math.floor(i / 4) * innerHeight, () => openCard(st, i)); // the page of the pin that holds it
  });

  // Scroll to `top`, then run `done` once the page has stopped moving (smooth scrolls of any length;
  // not every browser has scrollend).
  function scrollThen(top, done) {
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    let last = -1, still = 0;
    const start = performance.now();
    const check = () => {
      update(); // the pin's page follows the scroll before the card opens
      still = Math.abs(scrollY - last) < 0.5 ? still + 1 : 0; last = scrollY;
      const settled = still >= 3 && (Math.abs(scrollY - top) < 2 || performance.now() - start > 400); // may stop short at the page end
      if (settled || performance.now() - start > 3000) done(); else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  function paint(st) {
    const { stage, cards, cur, hot, n, open } = st;
    stage.classList.toggle('has-hover', hot >= 0);
    cards.forEach((el, i) => {
      const pg = Math.floor(i / 4), slot = i % 4;
      el.classList.toggle('on', pg === cur); el.classList.toggle('past', pg < cur); el.classList.toggle('hot', i === hot);
      el.style.setProperty('--od', pg === cur && open < 0 ? `${0.15 + slot * 0.08}s` : '0s');
    });
    const lit = open >= 0 ? open : hot;
    stage.querySelectorAll('path[data-s]').forEach((p) => {
      const i = cur * 4 + Number(p.dataset.s);
      p.style.strokeDashoffset = i < n ? 0 : 1200;
      p.style.stroke = lit === i ? '#1fc3c3' : lit < 0 || open >= 0 ? '#1fc3c355' : '#1fc3c31a';
      p.style.strokeWidth = lit === i ? 1.5 : 1;
    });
    stage.querySelectorAll('circle[data-s]').forEach((c) => {
      const i = cur * 4 + Number(c.dataset.s);
      c.style.opacity = i < n && (hot < 0 || hot === i || open >= 0) ? 1 : 0;
    });
    stage.querySelectorAll('.pc-tick').forEach((b) => {
      const on = Number(b.dataset.k) === cur;
      b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'true' : 'false');
    });
    const hint = stage.querySelector('.pc-hint'); if (hint) hint.style.opacity = cur < st.pages - 1 ? 1 : 0;
  }

  // Title column and node position, in the stage's own 1280 x 800 coordinates.
  function placeTitle(st) {
    const { stage } = st, pin = stage.parentElement;
    const stageLeft = (pin.clientWidth - 1280 * scale) / 2;
    const x = navName ? (navName.getBoundingClientRect().left - stageLeft) / scale : 80;
    const title = stage.querySelector('.pc-title'), lines = title.querySelectorAll('span');
    title.style.left = `${x}px`;
    for (const el of stage.querySelectorAll('.pc-ticks, .pc-hint')) el.style.left = `${x + 4}px`;
    const last = lines[lines.length - 1] ?? title, line = Number(title.dataset.line) || 96;
    const nx = x + last.offsetLeft + last.offsetWidth + NODE_GAP;
    const ny = title.offsetTop + last.offsetTop + line * NODE_HEIGHT;
    for (const c of stage.querySelectorAll('.pc-node')) { c.setAttribute('cx', nx); c.setAttribute('cy', ny); }
    for (const p of stage.querySelectorAll('path[data-slot]')) {
      const [sx, sy] = p.dataset.slot.split(',').map(Number);
      p.setAttribute('d', `M${nx} ${ny} C ${nx + 140} ${ny}, ${sx - 140} ${sy + 100}, ${sx} ${sy + 100}`);
    }
  }

  // Closed cards are a fixed height, so a long title leaves less room for the hook: show only the
  // hook lines that fit above the buffer (measured once fonts are in, since line widths change).
  function fitHooks(st) {
    st.cards.forEach((el) => {
      if (el.classList.contains('open')) return;
      const t = el.querySelector('.pc-t'), h = el.querySelector('.pc-h');
      const line = parseFloat(getComputedStyle(h).lineHeight) || 19.5;
      const room = TEXT_BOTTOM - (t.offsetTop + t.offsetHeight + 8); // offsets within the card's scroll box; 8: title-to-hook gap
      const n = Math.max(0, Math.floor(room / line));
      h.style.setProperty('--pc-lines', n); h.dataset.lines = n;
    });
  }

  let queued = false, relayout = true, lastScale = 0;
  function update() {
    queued = false;
    scale = Math.min(innerWidth / 1280, innerHeight / 800, 1.25);
    const rescale = scale !== lastScale || relayout; lastScale = scale; relayout = false;
    sections.forEach((st) => {
      if (rescale) { st.stage.style.transform = `scale(${scale})`; placeTitle(st); fitHooks(st); }
      if (st.open >= 0) { fit(st); return; }
      const top = st.sec.getBoundingClientRect().top;
      const cur = Math.max(0, Math.min(st.pages - 1, Math.round(-top / innerHeight)));
      if (cur !== st.cur) { st.cur = cur; st.hot = -1; paint(st); }
    });
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { relayout = true; queue(); });
  document.fonts?.ready.then(() => { relayout = true; queue(); }); // line widths change once the title font loads
  document.fonts?.addEventListener?.('loadingdone', () => { relayout = true; queue(); }); // Switzer arrives late (third-party)
  update();
}
