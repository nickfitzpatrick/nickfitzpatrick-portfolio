// Sparse rising bubbles. Each one is a tiny element animated by CSS on the
// compositor (transform + opacity only), so there is no per-frame script.
// Size, blur and opacity vary together to suggest depth.
import { reducedMotion, smallScreen } from './env.js';

export function initBubbles(root) {
  if (!root || reducedMotion()) return;
  const count = smallScreen() ? 14 : 26;
  const rand = (a, b) => a + Math.random() * (b - a);
  for (let i = 0; i < count; i++) {
    const depth = Math.random();                 // 0 = far and sharp, 1 = near and soft
    const size = 3 + depth * depth * 9;          // 3 to 12px
    const rise = rand(30, 44) - depth * 10;      // nearer bubbles pass a little faster
    const b = document.createElement('span');
    b.className = 'bubble';
    b.style.setProperty('--x', `${rand(2, 98).toFixed(1)}%`);
    b.style.setProperty('--size', `${size.toFixed(1)}px`);
    b.style.setProperty('--blur', `${(depth > 0.55 ? (depth - 0.55) * 5 : 0).toFixed(2)}px`);
    b.style.setProperty('--alpha', (0.1 + (1 - depth) * 0.12).toFixed(2));
    b.style.setProperty('--rise', `${rise.toFixed(1)}s`);
    b.style.setProperty('--delay', `${(-Math.random() * rise).toFixed(1)}s`);
    b.style.setProperty('--sway', `${rand(4, 12).toFixed(1)}px`);
    b.style.setProperty('--sway-time', `${rand(3.2, 6.5).toFixed(1)}s`);
    b.appendChild(document.createElement('i'));
    root.appendChild(b);
  }
  requestAnimationFrame(() => root.classList.add('is-on'));
}
