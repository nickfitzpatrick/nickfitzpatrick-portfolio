// Fish controller (tiny, ships with the page). Decides whether and when to load
// the heavy part (three.js + model) and publishes the state as
// <html data-fish="loading | ready | off"> for CSS to react to.
import { finePointer, reducedMotion, smallScreen } from '../env.js';

const MODELS = { large: '/models/betta-2k.glb', small: '/models/betta-1k.glb' };

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export function initFish(root) {
  const canvas = root?.querySelector('canvas');
  const spots = [...document.querySelectorAll('[data-fish-spot]')];
  const avoid = [...document.querySelectorAll('[data-fish-avoid]')]; // things the fish must never cover
  const setState = (s) => { document.documentElement.dataset.fish = s; };
  if (!canvas || !spots.length || !hasWebGL()) return setState('off');
  setState('loading');

  const small = smallScreen() || !finePointer() || navigator.connection?.saveData === true;
  const start = async () => {
    try {
      const { createFish } = await import('./scene.js');
      await createFish({
        canvas, spots, avoid,
        url: small ? MODELS.small : MODELS.large,
        reduced: reducedMotion(),
        fine: finePointer(),
      });
      setState('ready');
    } catch (err) {
      console.warn('Fish unavailable:', err);
      setState('off');
    }
  };
  // After the page has loaded, and only when the browser is idle.
  const whenIdle = () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 300));
  if (document.readyState === 'complete') whenIdle();
  else addEventListener('load', whenIdle, { once: true });
}
