// Drives <Rotator>: swaps the current phrase on a timer and eases the window's
// width to fit the next one. Pauses while the tab is hidden, the phrase is off
// screen, or the mouse is over it. Does nothing under prefers-reduced-motion.
import { reducedMotion } from './env.js';

export function initRotators() {
  if (reducedMotion()) return;
  for (const root of document.querySelectorAll('[data-rotator]:not([data-rotator-on])')) {
    root.dataset.rotatorOn = '';
    const win = root.querySelector('.rotator__window');
    const items = [...root.querySelectorAll('.rotator__item')];
    if (!win || items.length < 2) continue;
    const interval = Number(root.dataset.interval) || 2600;
    let index = 0, timer = 0, onScreen = true, hovered = false;

    const advance = () => {
      const from = items[index];
      index = (index + 1) % items.length;
      const to = items[index];
      win.classList.toggle('is-growing', to.offsetWidth > from.offsetWidth);
      win.style.width = `${from.offsetWidth}px`; // pin the current width so the change can ease
      root.classList.add('is-live');
      for (const item of items) item.classList.remove('is-leaving');
      from.classList.replace('is-current', 'is-leaving');
      to.classList.add('is-current');
      void win.offsetWidth;                       // commit the starting width
      win.style.width = `${to.offsetWidth}px`;
    };
    const stop = () => { clearInterval(timer); timer = 0; };
    const sync = () => {
      const run = onScreen && !hovered && !document.hidden;
      if (run && !timer) timer = setInterval(advance, interval);
      else if (!run) stop();
    };

    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); }).observe(root);
    document.addEventListener('visibilitychange', sync);
    root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovered = true; sync(); } });
    root.addEventListener('pointerleave', () => { hovered = false; sync(); });
    // The pinned width is in px; let it re-fit when the type size or font changes.
    const refit = () => { win.style.width = ''; };
    addEventListener('resize', refit, { passive: true });
    document.fonts?.ready.then(refit);
    sync();
  }
}
