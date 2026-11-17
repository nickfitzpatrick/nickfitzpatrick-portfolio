// Media behaviour for [data-reveal] and [data-parallax] blocks.
//   reveal:   fades and settles in once; with a mouse it also gets a brief liquid ripple
//   parallax: the image drifts a few px against the cursor (mouse) or the scroll (touch)
// The frame loop only runs while a parallax block is on screen.
import { finePointer, reducedMotion } from './env.js';

export function initMedia() {
  const reduced = reducedMotion();
  const fine = finePointer();

  /* Reveal */
  const ripple = document.querySelector('#liquid feDisplacementMap');
  const reveal = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      reveal.unobserve(el);
      el.classList.add('is-in');
      if (reduced || !fine || !ripple) continue; // filter is too heavy for phones
      const start = performance.now(), dur = 1100;
      el.style.filter = 'url(#liquid)';
      (function step(now) {
        const p = Math.min(1, (now - start) / dur);
        ripple.setAttribute('scale', (26 * (1 - p) ** 3).toFixed(2));
        if (p < 1) requestAnimationFrame(step); else el.style.filter = '';
      })(start);
    }
  }, { threshold: 0.2 });
  document.querySelectorAll('[data-reveal]').forEach((el) => reveal.observe(el));
  if (reduced) return;

  /* Parallax */
  const pointer = { x: 0, y: 0, seen: false };
  if (fine) addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true; }, { passive: true });
  const items = [...document.querySelectorAll('[data-parallax]')]
    .map((el) => ({ el, img: el.querySelector('img'), x: 0, y: 0, vx: 0, vy: 0, on: false }))
    .filter((m) => m.img);
  let raf = 0;
  function frame() {
    let active = false;
    for (const m of items) {
      if (!m.on) continue;
      active = true;
      const b = m.el.getBoundingClientRect();
      let tx = 0, ty = 0;
      const inside = fine && pointer.seen && pointer.x > b.left && pointer.x < b.right && pointer.y > b.top && pointer.y < b.bottom;
      if (inside) {
        tx = ((pointer.x - b.left) / b.width - 0.5) * -14;
        ty = ((pointer.y - b.top) / b.height - 0.5) * -10;
      } else {
        ty = ((b.top + b.height / 2) / innerHeight - 0.5) * -16;
      }
      // a light spring gives the image a little weight
      m.vx = (m.vx + (tx - m.x) * 0.04) * 0.86; m.vy = (m.vy + (ty - m.y) * 0.04) * 0.86;
      m.x += m.vx; m.y += m.vy;
      m.img.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
    }
    raf = active ? requestAnimationFrame(frame) : 0;
  }
  const watch = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const m = items.find((i) => i.el === entry.target);
      if (m) m.on = entry.isIntersecting;
    }
    if (!raf && items.some((m) => m.on)) raf = requestAnimationFrame(frame);
  }, { rootMargin: '10% 0px' });
  items.forEach((m) => watch.observe(m.el));
}
