// Project cards behaviour, ported from the design file. Changes for the site:
//  - the title, ticks and hint line up with the site name in the nav ("Nick Fitzpatrick"),
//    and the gold node sits just after the end of the title, with the lines redrawn from there;
// Additions for the site: keyboard focus
// on a hidden card scrolls to its page, tick jumps respect reduced motion, and the stage is only
// rescaled and repainted when something changed.
import { reducedMotion } from './env.js';

export function initProjectCards(sectionEls) {
  const sections = [...sectionEls].map((sec) => {
    const stage = sec.querySelector('.pc-stage');
    const st = { sec, stage, cards: [...stage.querySelectorAll('.pc-card')], pages: Number(sec.dataset.pages), cur: -1, hot: -1 };
    st.n = st.cards.length;
    st.cards.forEach((el, i) => {
      el.addEventListener('mouseenter', () => { st.hot = i; paint(st); });
      el.addEventListener('mouseleave', () => { st.hot = -1; paint(st); });
      el.addEventListener('focus', () => { // a keyboard user tabbing to a card on another page: go there
        const k = Math.floor(i / 4);
        if (k !== st.cur) jump(st, k);
        st.hot = i; paint(st);
      });
      el.addEventListener('blur', () => { st.hot = -1; paint(st); });
    });
    stage.querySelectorAll('.pc-tick').forEach((b) => b.addEventListener('click', () => jump(st, Number(b.dataset.k))));
    return st;
  });
  if (!sections.length) return;

  function jump(st, k) {
    window.scrollTo({ top: st.sec.offsetTop + k * innerHeight, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function paint(st) {
    const { stage, cards, cur, hot, n } = st;
    stage.classList.toggle('has-hover', hot >= 0);
    cards.forEach((el, i) => {
      const pg = Math.floor(i / 4), slot = i % 4;
      el.classList.toggle('on', pg === cur); el.classList.toggle('past', pg < cur); el.classList.toggle('hot', i === hot);
      el.tabIndex = 0;
      el.style.transitionDelay = pg === cur ? `${0.15 + slot * 0.08}s, ${0.15 + slot * 0.08}s, 0s, 0s` : '0s';
    });
    stage.querySelectorAll('path[data-s]').forEach((p) => {
      const i = cur * 4 + Number(p.dataset.s), has = i < n;
      p.style.strokeDashoffset = has ? 0 : 1200;
      p.style.stroke = hot === i ? '#1fc3c3' : hot < 0 ? '#1fc3c355' : '#1fc3c31a';
      p.style.strokeWidth = hot === i ? 1.5 : 1;
    });
    stage.querySelectorAll('circle[data-s]').forEach((c) => {
      const i = cur * 4 + Number(c.dataset.s);
      c.style.opacity = i < n && (hot < 0 || hot === i) ? 1 : 0;
    });
    stage.querySelectorAll('.pc-tick').forEach((b) => {
      const on = Number(b.dataset.k) === cur;
      b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'true' : 'false');
    });
    const hint = stage.querySelector('.pc-hint'); if (hint) hint.style.opacity = cur < st.pages - 1 ? 1 : 0;
  }

  const NODE_GAP = 30;      // stage px from the end of the title to the centre of the node
  const NODE_HEIGHT = 0.52; // the node sits this far down the title's last line (as designed: 50 of 96 px)
  const navName = document.querySelector('.nav__name');
  // Title column and node position, in the stage's own 1280 x 800 coordinates.
  function placeTitle(st, s) {
    const { stage } = st, pin = stage.parentElement;
    const stageLeft = (pin.clientWidth - 1280 * s) / 2;
    const x = navName ? (navName.getBoundingClientRect().left - stageLeft) / s : 80;
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

  let scale = 0, queued = false, relayout = true;
  function update() {
    queued = false;
    const s = Math.min(innerWidth / 1280, innerHeight / 800, 1.25);
    const rescale = s !== scale || relayout; scale = s; relayout = false;
    sections.forEach((st) => {
      if (rescale) { st.stage.style.transform = `scale(${s})`; placeTitle(st, s); }
      const top = st.sec.getBoundingClientRect().top;
      const cur = Math.max(0, Math.min(st.pages - 1, Math.round(-top / innerHeight)));
      if (cur !== st.cur) { st.cur = cur; st.hot = -1; paint(st); }
    });
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { relayout = true; queue(); });
  document.fonts?.ready.then(() => { relayout = true; queue(); }); // line widths change once the title font loads
  update();
}
