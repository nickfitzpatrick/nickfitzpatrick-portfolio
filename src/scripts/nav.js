// Marks the nav link for the section currently in view.
export function initNav() {
  const links = [...document.querySelectorAll('.nav__link[data-section]')];
  const sections = links.map((a) => document.getElementById(a.dataset.section)).filter(Boolean);
  if (!sections.length) return;
  let queued = false;
  const update = () => {
    queued = false;
    const mid = innerHeight * 0.45;
    let current = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= mid) current = s;
    for (const a of links) {
      if (a.dataset.section === current.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
