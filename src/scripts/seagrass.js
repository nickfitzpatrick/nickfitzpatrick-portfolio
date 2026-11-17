// Footer seagrass: three layers of dark blades swaying in a current; a few tips pulse teal or gold
// and release small bubbles. A pointer (mouse, pen or a dragging finger) slowly parts the blades.
// Reduced motion: one still frame. Pauses when off-screen or when the tab is hidden.
import { reducedMotion } from './env.js';

const GRASS = {
  heightScale: 0.75, // overall blade height
  heightVar: 0.14, // random height variation (plus a gentle ±8% wave)
  brightness: 1.5, // blade lightness multiplier
  swaySpeed: 0.5, // current speed
  partStiffness: 0.0025, partDamping: 0.93, // pointer parting: lower stiffness = slower
  glowChance: 0.08, // share of mid/front blades with glowing tips
};
const TIPS = ['31,195,195', '216,177,58']; // --wi-teal, --wi-gold

export function initSeagrass(canvas) {
  const host = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const still = reducedMotion();
  const rnd = (a, b) => a + Math.random() * (b - a);
  let W = 0, H = 0, blades = [], bubbles = [], pointer = null, raf = 0, onScreen = false;
  const t0 = performance.now();

  function build() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const k = (H / 350) * GRASS.heightScale;
    blades = [];
    [{ n: W / 4, h: [190, 240], l: [4, 7], w: [3, 6], hue: [178, 196] },
     { n: W / 6, h: [215, 262], l: [7, 11], w: [4, 7.5], hue: [170, 188] },
     { n: W / 10, h: [232, 282], l: [10, 15], w: [5, 9], hue: [166, 182], rib: true },
    ].forEach((L, li) => {
      for (let i = 0; i < L.n; i++) {
        const x = rnd(-10, W + 10), even = 1 + Math.sin(x * 0.02 + li) * 0.08 + rnd(-GRASS.heightVar, GRASS.heightVar);
        blades.push({
          x, rib: L.rib, h: rnd(L.h[0], L.h[1]) * even * k, w: rnd(L.w[0], L.w[1]), ph: rnd(0, 6.28), sp: rnd(0.45, 0.8),
          hue: rnd(L.hue[0], L.hue[1]), sat: rnd(30, 50), lit: rnd(L.l[0], L.l[1]) * GRASS.brightness, b: 0, v: 0,
          tip: li > 0 && Math.random() < GRASS.glowChance ? TIPS[Math.random() < 0.5 ? 0 : 1] : null, tph: rnd(0, 6.28),
        });
      }
    });
  }

  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000, ts = t * GRASS.swaySpeed;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const bl of blades) {
      const h = bl.h;
      let target = (Math.sin(ts * bl.sp + bl.x * 0.008 + bl.ph) * 0.6 + Math.sin(ts * 0.37 + bl.x * 0.002) * 0.9) * h / 13;
      if (pointer) {
        const dx = bl.x - pointer.x, d = Math.hypot(dx, (H - h * 0.6 - pointer.y) * 0.7);
        if (d < 110) target += Math.sign(dx || 1) * (1 - d / 110) * h * 0.9;
      }
      if (still) bl.b = target;
      else { bl.v += (target - bl.b) * GRASS.partStiffness; bl.v *= GRASS.partDamping; bl.b += bl.v; }
      const bx = bl.x, w = bl.w, wave = Math.sin(t * 0.6 + bl.ph * 2 + bl.x * 0.015) * h * 0.035;
      const c1x = bx + bl.b * 0.08, c1y = H - h * 0.38, c2x = bx + bl.b * 0.6 + wave, c2y = H - h * 0.78;
      const tx = bx + bl.b + wave * 1.4, ty = H - h + Math.abs(bl.b) * 0.2;
      ctx.beginPath();
      ctx.moveTo(bx - w / 2, H);
      ctx.bezierCurveTo(c1x - w * 0.45, c1y, c2x - w * 0.22, c2y, tx, ty);
      ctx.bezierCurveTo(c2x + w * 0.22, c2y, c1x + w * 0.45, c1y, bx + w / 2, H);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, H, 0, H - h);
      g.addColorStop(0, `hsl(${bl.hue},${bl.sat}%,${bl.lit * 0.4}%)`);
      g.addColorStop(0.6, `hsl(${bl.hue},${bl.sat}%,${bl.lit * 0.85}%)`);
      g.addColorStop(1, `hsl(${bl.hue + 6},${bl.sat + 8}%,${bl.lit * 1.15}%)`);
      ctx.fillStyle = g; ctx.fill();
      if (bl.rib) {
        ctx.beginPath(); ctx.moveTo(bx, H); ctx.bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty);
        ctx.strokeStyle = 'rgba(120,230,220,.07)'; ctx.lineWidth = 0.7; ctx.stroke();
      }
      if (bl.tip) {
        const a = (Math.sin(t * 1.3 + bl.tph) * 0.5 + 0.5) * 0.75 + 0.1;
        ctx.shadowColor = ctx.fillStyle = `rgba(${bl.tip},${a})`; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(tx, ty, 1.7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        if (!still && Math.random() < 0.004) bubbles.push({ x: tx, y: ty, r: rnd(1, 2.4), vy: rnd(10, 22), ph: rnd(0, 6) });
      }
    }
    bubbles = bubbles.filter((b) => b.y > -4);
    for (const b of bubbles) {
      b.y -= b.vy / 60;
      ctx.strokeStyle = `rgba(244,242,236,${Math.min(0.35, (b.y / H) * 0.5)})`; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(b.x + Math.sin(t * 2 + b.ph) * 2, b.y, b.r, 0, 7); ctx.stroke();
    }
    if (!still) start();
  }

  function start() { if (!raf && onScreen && !document.hidden) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  host.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; }, { passive: true });
  host.addEventListener('pointerleave', () => { pointer = null; });
  host.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') pointer = null; });
  new ResizeObserver(() => { build(); if (still) frame(performance.now()); }).observe(canvas);
  new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; if (onScreen && !still) start(); else stop(); }).observe(host);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : !still && start()));
}
