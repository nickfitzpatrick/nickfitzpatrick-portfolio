// Dot follows the pointer 1:1. Ring eases after it, snaps to the box of the
// nearest [data-snap] ancestor, and grows over [data-cursor="grow"].
// data-snap="fit" is for targets that are already a visible pill (the Work Index bubbles):
// the ring sits centred on the target with the same gap all the way round.
// The loop only runs while something is still moving, and eases by elapsed time
// so it feels the same at 60Hz and 120Hz.
// What is under the pointer is re-checked on scroll and resize too, not just on
// mouse move: otherwise the ring stays stuck to a link that has scrolled away.
import { finePointer, reducedMotion } from './env.js';

const REST = 34, GROWN = 76;
const RATE = 14; // higher = snappier ring
const FIT_GAP = 5; // px between a data-snap="fit" target and the ring
const frameDt = (dt) => Math.min(0.05, Math.max(0, dt)); // frame timestamps can sit slightly before the event that woke the loop

export function initCursor(root) {
  if (!root || !finePointer()) return;
  const ring = root.querySelector('.cursor__ring');
  const dot = root.querySelector('.cursor__dot');
  const instant = reducedMotion();
  const p = { x: innerWidth / 2, y: innerHeight / 2 };
  const r = { x: p.x, y: p.y, w: REST, h: REST };
  let snap = null, grow = false, raf = 0, last = 0, stale = false, seen = false;
  document.documentElement.classList.add('has-cursor');

  const retarget = (el) => {
    snap = el?.closest?.('[data-snap]') ?? null;
    grow = !snap && !!el?.closest?.('[data-cursor="grow"]');
    root.classList.toggle('is-grown', grow);
  };

  function frame(now) {
    const ease = instant ? 1 : 1 - Math.exp(-RATE * frameDt((now - last) / 1000));
    last = now;
    if (stale) { stale = false; retarget(document.elementFromPoint(p.x, p.y)); } // the page moved under a still pointer
    let tx = p.x, ty = p.y, tw = REST, th = REST;
    if (snap?.isConnected) {
      const b = snap.getBoundingClientRect();
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      if (snap.dataset.snap === 'fit') { tx = cx; ty = cy; tw = b.width + FIT_GAP * 2; th = b.height + FIT_GAP * 2; }
      else {
        tx = cx + (p.x - cx) * 0.12; ty = cy + (p.y - cy) * 0.12; // slight pull toward the pointer
        tw = b.width + 16; th = Math.max(b.height + 4, 30);
      }
    } else if (grow) { tw = th = GROWN; }
    r.x += (tx - r.x) * ease; r.y += (ty - r.y) * ease; r.w += (tw - r.w) * ease; r.h += (th - r.h) * ease;
    ring.style.width = `${r.w}px`; ring.style.height = `${r.h}px`;
    ring.style.transform = `translate3d(${r.x - r.w / 2}px, ${r.y - r.h / 2}px, 0)`;
    const settled = Math.abs(tx - r.x) + Math.abs(ty - r.y) + Math.abs(tw - r.w) + Math.abs(th - r.h) < 0.2;
    raf = settled && !snap ? 0 : requestAnimationFrame(frame); // stay awake while snapped: the target can move or resize
  }
  const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    p.x = e.clientX; p.y = e.clientY;
    if (!seen) { seen = true; r.x = p.x; r.y = p.y; } // first move: start at the pointer, not at the screen centre
    retarget(e.target);
    root.classList.add('is-on');
    // Position with `translate`, not `transform`: the click state changes `scale`, and CSS applies
    // scale outside a transform, which would multiply the position and throw the dot across the screen.
    dot.style.translate = `${p.x}px ${p.y}px`;
    wake();
  }, { passive: true });
  const moved = () => { if (seen) { stale = true; wake(); } };
  addEventListener('scroll', moved, { passive: true });
  addEventListener('resize', moved, { passive: true });
  addEventListener('pointerdown', () => root.classList.add('is-down'));
  addEventListener('pointerup', () => root.classList.remove('is-down'));
  addEventListener('pointercancel', () => root.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => root.classList.remove('is-on'));
}
