// Project cards behaviour, ported from the design file. Additions for the site: keyboard focus
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

  let scale = 0, queued = false;
  function update() {
    queued = false;
    const s = Math.min(innerWidth / 1280, innerHeight / 800, 1.25);
    const rescale = s !== scale; scale = s;
    sections.forEach((st) => {
      if (rescale) st.stage.style.transform = `scale(${s})`;
      const top = st.sec.getBoundingClientRect().top;
      const cur = Math.max(0, Math.min(st.pages - 1, Math.round(-top / innerHeight)));
      if (cur !== st.cur) { st.cur = cur; st.hot = -1; paint(st); }
    });
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
}
