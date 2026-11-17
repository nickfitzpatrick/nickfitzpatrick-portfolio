// Work Index behaviour, ported from the design file. Differences from that file are only
// the ones the site needs: it pauses when off screen or in a hidden tab, respects reduced
// motion (no drift, pulses or twinkle; hover still works), works with the custom cursor,
// and on narrow screens starts in Simple view with the hubs wrapped onto rows.
import { reducedMotion } from './env.js';

const NARROW = '(max-width: 767px)';
const BASE_HEIGHT = 780;       // matches .wi in work-index.css
const HUB_ROW_TOP = 140;       // Simple view: where the row of hubs sits
const LIST_TOP = 200;          // Simple view: where the list starts under one row of hubs
const HIT_RADIUS = 16;         // px around a dot that counts as hovering it

export function initWorkIndex(root) {
  const { categories: CATEGORIES, projects: PROJECTS } = JSON.parse(root.querySelector('[data-work-index-data]').textContent);
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  const card = root.querySelector('.wi-card'), list = root.querySelector('.wi-list'), listEl = root.querySelector('.wi-list-inner');
  const css = getComputedStyle(root), token = (name) => css.getPropertyValue(name).trim();
  const TEAL = token('--wi-wire-rgb'), GOLD = token('--wi-gold-rgb'), INK = token('--wi-ink-rgb');
  const MONO = `12px ${token('--font-wi-mono')}`;
  const reduced = reducedMotion();
  const narrow = matchMedia(NARROW);
  let W, H, dpr = Math.min(devicePixelRatio || 1, 2), simple = narrow.matches, hubHover = -1, dotHover = -1, simCat = 0;
  let pulses = [], lastPulse = 0, raf = 0, onScreen = true, simpleSince = -1e9;

  // hubs
  const hubs = CATEGORIES.map((c, i) => {
    const a = document.createElement('a');
    a.className = 'wi-hub wi-glass'; a.href = '#' + c.id; a.dataset.snap = 'fit';
    const edge = document.createElement('span'); edge.className = 'wi-edge';
    a.append(edge, c.name);
    const on = () => { if (!simple) { hubHover = i; sync(); } };
    const off = () => { if (!simple) { hubHover = -1; sync(); } };
    a.addEventListener('mouseenter', on); a.addEventListener('mouseleave', off);
    a.addEventListener('focus', on); a.addEventListener('blur', off); // keyboard gets the same highlight
    a.addEventListener('click', (e) => { if (simple) { e.preventDefault(); simCat = i; renderList(); placeHubs(); sync(); } });
    root.insertBefore(a, card); return a;
  });

  // stable project layout: centroid of its hubs + seeded jitter
  let s = 21; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const jitter = PROJECTS.map((p) => ({ a: rnd() * 6.28, d: (p.cats.length > 1 ? 30 : 90) + rnd() * 70 }));
  let nodes = [];
  function layout() {
    placeHubs(); // may change the section's height on narrow screens
    W = root.clientWidth; H = root.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const hp = hubXY();
    nodes = PROJECTS.map((p, i) => {
      const cx = p.cats.reduce((t, k) => t + hp[k][0], 0) / p.cats.length, cy = p.cats.reduce((t, k) => t + hp[k][1], 0) / p.cats.length;
      return { x: cx + Math.cos(jitter[i].a) * jitter[i].d, y: cy + Math.sin(jitter[i].a) * jitter[i].d };
    });
    wake();
  }
  function hubXY() { return CATEGORIES.map((c) => [c.pos[0] * W, c.pos[1] * H]); }
  function placeHubs() {
    const width = root.clientWidth;
    if (!simple) {
      CATEGORIES.forEach((c, i) => { hubs[i].style.left = c.pos[0] * 100 + '%'; hubs[i].style.top = c.pos[1] * 100 + '%'; });
      root.style.removeProperty('--wi-list-top'); root.style.height = '';
      return;
    }
    // simple: centred row, wrapping onto more rows when the screen is too narrow for one
    const gap = narrow.matches ? 10 : 14, ws = hubs.map((h) => h.offsetWidth), rowH = hubs[0].offsetHeight + gap;
    const max = width - 2 * (narrow.matches ? 20 : 24), rows = [[]];
    ws.forEach((w, i) => {
      const row = rows[rows.length - 1], used = row.reduce((t, k) => t + ws[k] + gap, 0);
      if (row.length && used + w > max) rows.push([i]); else row.push(i);
    });
    rows.forEach((row, r) => {
      const total = row.reduce((t, k) => t + ws[k], 0) + gap * (row.length - 1);
      let x = (width - total) / 2;
      row.forEach((k) => { hubs[k].style.left = (x + ws[k] / 2) + 'px'; hubs[k].style.top = (HUB_ROW_TOP + r * rowH) + 'px'; x += ws[k] + gap; });
    });
    const listTop = LIST_TOP + (rows.length - 1) * rowH;
    root.style.setProperty('--wi-list-top', listTop + 'px');
    // grow to fit a long list; on narrow screens also shrink to fit a short one
    const needed = listTop + listEl.offsetHeight + 56;
    root.style.height = narrow.matches || needed > BASE_HEIGHT ? needed + 'px' : '';
  }

  function sync() {
    root.classList.toggle('simple', simple);
    root.classList.toggle('has-hover', !simple && hubHover >= 0);
    hubs.forEach((h, i) => h.classList.toggle('on', simple ? i === simCat : i === hubHover));
    root.querySelectorAll('.wi-toggle button').forEach((b) => {
      const on = (b.dataset.mode === 'simple') === simple;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
    list.inert = !simple; // the hidden list must not take keyboard focus in Network view
    if (simple || dotHover < 0) card.classList.remove('show');
    wake();
  }

  const setThumb = (el, img) => { el.classList.toggle('has-img', !!img); if (img) el.style.setProperty('--wi-img', `url("${img}")`); };
  function renderList() {
    listEl.replaceChildren(...PROJECTS.filter((p) => p.cats.includes(simCat)).map((p) => {
      const a = document.createElement('a'); a.className = 'wi-row'; a.href = p.href; a.dataset.cursor = 'grow';
      const th = document.createElement('span'); th.className = 'wi-thumb'; setThumb(th, p.img);
      const t = document.createElement('span'); t.className = 't'; t.textContent = p.title;
      const h = document.createElement('span'); h.className = 'h'; h.textContent = p.hook;
      const ar = document.createElement('span'); ar.className = 'a'; ar.textContent = '→'; ar.setAttribute('aria-hidden', 'true');
      a.append(th, t, h, ar); return a;
    }));
  }

  function showCard(i) {
    const p = PROJECTS[i], n = nodes[i];
    card.querySelector('.t').textContent = p.title + ' →';
    card.querySelector('.h').textContent = p.hook;
    setThumb(card.querySelector('.wi-thumb'), p.img);
    card.style.left = n.x + 'px'; card.style.top = n.y + 'px';
    card.style.transform = `translate(${n.x > W * 0.7 ? 'calc(-100% - 14px)' : '14px'}, -50%)`;
    card.classList.add('show');
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const hp = hubXY(), any = hubHover >= 0 || dotHover >= 0;
    const pos = nodes.map((n, i) => reduced ? [n.x, n.y] : [n.x + Math.sin(t * 0.00035 + i * 1.7) * 7, n.y + Math.cos(t * 0.0003 + i * 2.3) * 6]);
    PROJECTS.forEach((p, i) => p.cats.forEach((k) => {
      const on = hubHover === k || dotHover === i, [x, y] = pos[i];
      const g = ctx.createLinearGradient(x, y, hp[k][0], hp[k][1]), a = on ? 0.9 : any ? 0.06 : 0.42;
      g.addColorStop(0, `rgba(${TEAL},${a})`); g.addColorStop(1, `rgba(${TEAL},${on ? 0.5 : a * 0.15})`);
      ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hp[k][0], hp[k][1]); ctx.stroke();
    }));
    // pulses
    if (!reduced && !any && t - lastPulse > 700) {
      lastPulse = t; const pi = Math.floor(Math.random() * PROJECTS.length), c = PROJECTS[pi].cats;
      pulses.push({ pi, k: c[Math.floor(Math.random() * c.length)], s: t });
    }
    pulses = pulses.filter((q) => t - q.s < 1800);
    if (!any) pulses.forEach((q) => {
      const e = (t - q.s) / 1800, ease = e * e * (3 - 2 * e), [x, y] = pos[q.pi], [hx, hy] = hp[q.k];
      ctx.shadowColor = `rgba(${GOLD},.9)`; ctx.shadowBlur = 10; ctx.fillStyle = `rgba(${GOLD},${Math.sin(e * Math.PI)})`;
      ctx.beginPath(); ctx.arc(x + (hx - x) * ease, y + (hy - y) * ease, 2, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    });
    // dots
    PROJECTS.forEach((p, i) => {
      const on = dotHover === i || (hubHover >= 0 && p.cats.includes(hubHover)), [x, y] = pos[i], multi = p.cats.length > 1;
      const b = reduced ? 1 : 0.75 + 0.25 * Math.sin(t * 0.0012 + i);
      ctx.shadowColor = multi ? `rgba(${GOLD},.8)` : `rgba(${INK},.6)`; ctx.shadowBlur = on ? 14 : any ? 0 : 8 * b;
      ctx.fillStyle = on ? (multi ? `rgb(${GOLD})` : `rgb(${INK})`) : any ? `rgba(${INK},.18)` : multi ? `rgba(${GOLD},${0.85 * b})` : `rgba(${INK},${0.8 * b})`;
      ctx.beginPath(); ctx.arc(x, y, dotHover === i ? 4.5 : multi ? 3.4 : 2.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (on && dotHover !== i) { ctx.font = MONO; ctx.fillStyle = '#c9c7c0'; ctx.fillText(p.title, x + 10, y + 4); }
    });
  }

  // The loop runs only while the network can be seen; reduced motion draws once per change instead.
  const visible = () => onScreen && !document.hidden && (!simple || performance.now() - simpleSince < 900);
  function frame(t) { raf = 0; if (!visible()) return; draw(t); raf = requestAnimationFrame(frame); }
  function wake() {
    if (reduced) { if (W) draw(0); return; }
    if (!raf && visible()) raf = requestAnimationFrame(frame);
  }
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; wake(); }, { rootMargin: '80px' }).observe(root);
  document.addEventListener('visibilitychange', wake);

  const ownCursor = () => document.documentElement.classList.contains('has-cursor');
  const setPointer = (on) => { // native pointer, or the site's cursor ring growing
    if (ownCursor()) { if (on) root.dataset.cursor = 'grow'; else delete root.dataset.cursor; root.style.cursor = ''; }
    else root.style.cursor = on ? 'pointer' : '';
  };
  root.addEventListener('mousemove', (e) => {
    if (simple) return;
    const r = root.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let hit = -1; nodes.forEach((n, i) => { if (Math.hypot(n.x - mx, n.y - my) < HIT_RADIUS) hit = i; });
    if (e.target.closest('.wi-hub, .wi-toggle')) hit = -1;
    if (hit !== dotHover) { dotHover = hit; setPointer(hit >= 0); if (hit >= 0) showCard(hit); else card.classList.remove('show'); wake(); }
  });
  root.addEventListener('mouseleave', () => { dotHover = -1; card.classList.remove('show'); setPointer(false); wake(); });
  root.addEventListener('click', (e) => { if (!simple && dotHover >= 0 && !e.target.closest('.wi-hub, .wi-toggle')) location.href = PROJECTS[dotHover].href; });
  root.querySelectorAll('.wi-toggle button').forEach((b) => b.addEventListener('click', () => {
    simple = b.dataset.mode === 'simple'; if (simple) simpleSince = performance.now();
    hubHover = -1; dotHover = -1; setPointer(false); placeHubs(); sync();
  }));
  addEventListener('resize', layout);
  narrow.addEventListener('change', () => { simple = narrow.matches; hubHover = -1; dotHover = -1; layout(); sync(); }); // phones get Simple, wider screens get Network

  renderList(); layout(); sync();
  // hub widths depend on the font; place them again once it has loaded, then allow the glide
  (document.fonts?.ready ?? Promise.resolve()).then(() => { layout(); requestAnimationFrame(() => root.classList.add('ready')); });
}
