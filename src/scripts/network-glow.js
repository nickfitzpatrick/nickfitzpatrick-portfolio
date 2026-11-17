// Network glow.
//  - Random nodes across the section, invisible by default (layout is seeded, so it is
//    the same on every visit).
//  - Within RADIUS of the cursor, nodes fade in and link to neighbours closer than LINK.
//  - Lines teal, nodes white, every 5th gold. "Every 5th" counts among the currently
//    visible nodes, so colours swap as nodes enter and leave: that is the twinkle.
// Mouse: follows the pointer exactly, and redraws only when the pointer or page moves.
// Touch: follows the finger, then eases back to a slow drift around the resting spot.
// Reduced motion: no drift; the glow only moves when the person moves it.
import { finePointer, reducedMotion } from './env.js';

const RADIUS = 260;                     // px around the cursor that is revealed
const LINK = 140;                       // px: nodes closer than this are joined
const DENSITY = 160 / (1440 * 900);     // nodes per px²
const NODE_RADIUS = 2.5;
const LINE_ALPHA = 0.9;
const REST = { x: 0.68, y: 0.42 };      // where the glow sits before any input (share of the section)
const TOUCH_HOLD = 2500;                // ms the glow stays where a finger left it

export function initNetworkGlow(canvas) {
  const host = canvas?.parentElement;
  const ctx = canvas?.getContext('2d');
  if (!host || !ctx || canvas.dataset.on) return;
  canvas.dataset.on = '';
  const css = getComputedStyle(canvas);
  const colour = (token) => css.getPropertyValue(token).trim();
  const LINE = colour('--net-line'), NODE = colour('--net-node'), NODE_ALT = colour('--net-node-alt');
  const fine = finePointer(), reduced = reducedMotion();

  let W = 0, H = 0, radius = RADIUS, nodes = [];
  const at = { x: 0, y: 0 };            // glow centre, in section coordinates
  const pointer = { x: null, y: null }; // last pointer position, in viewport coordinates
  let visible = true, raf = 0, touchUntil = 0;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = host.clientWidth; H = host.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    radius = Math.min(RADIUS, W * 0.62); // keep it a pool of light on narrow screens, not the whole screen
    let seed = 3;
    const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    nodes = Array.from({ length: Math.round(W * H * DENSITY) }, () => [random() * W, random() * H]);
    if (pointer.x === null) { at.x = W * REST.x; at.y = H * REST.y; } else place();
    draw();
  }

  function place() { // section coordinates of the last pointer position
    const box = host.getBoundingClientRect();
    at.x = pointer.x - box.left; at.y = pointer.y - box.top;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const near = nodes.filter(([x, y]) => Math.hypot(x - at.x, y - at.y) < radius);
    ctx.lineWidth = 1; ctx.strokeStyle = LINE;
    for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
      const [ax, ay] = near[i], [bx, by] = near[j], d = Math.hypot(ax - bx, ay - by);
      if (d > LINK) continue;
      const f = (1 - Math.hypot((ax + bx) / 2 - at.x, (ay + by) / 2 - at.y) / radius) * (1 - d / LINK);
      if (f <= 0) continue;
      ctx.globalAlpha = f * LINE_ALPHA;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    near.forEach(([x, y], i) => {
      ctx.globalAlpha = 1 - Math.hypot(x - at.x, y - at.y) / radius;
      ctx.fillStyle = i % 5 ? NODE : NODE_ALT;
      ctx.beginPath(); ctx.arc(x, y, NODE_RADIUS, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  new ResizeObserver(resize).observe(host);
  resize();

  if (fine) {
    // One redraw per frame at most, and only when something moved.
    const update = () => { raf = 0; if (visible && pointer.x !== null) { place(); draw(); } };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = e.clientX; pointer.y = e.clientY; queue();
    }, { passive: true });
    addEventListener('scroll', queue, { passive: true }); // the section moves under a still pointer
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) queue(); }).observe(host);
    return;
  }

  // Touch
  const touch = (e) => {
    if (e.pointerType === 'mouse') return;
    pointer.x = e.clientX; pointer.y = e.clientY; touchUntil = performance.now() + TOUCH_HOLD;
    if (reduced) { place(); draw(); }
  };
  addEventListener('pointerdown', touch, { passive: true });
  addEventListener('pointermove', touch, { passive: true });
  if (reduced) return;

  let last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    let tx, ty;
    if (now < touchUntil) {
      const box = host.getBoundingClientRect();
      tx = pointer.x - box.left; ty = pointer.y - box.top;
    } else { // slow drift around the resting spot
      const t = now / 1000;
      tx = W * (REST.x + Math.sin(t * 0.21) * 0.2); ty = H * (REST.y + Math.cos(t * 0.16) * 0.12);
    }
    const ease = 1 - Math.exp(-(now < touchUntil ? 9 : 1.6) * dt);
    at.x += (tx - at.x) * ease; at.y += (ty - at.y) * ease;
    draw();
  }
  const sync = () => {
    const run = visible && !document.hidden;
    if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(host);
  document.addEventListener('visibilitychange', sync);
}
