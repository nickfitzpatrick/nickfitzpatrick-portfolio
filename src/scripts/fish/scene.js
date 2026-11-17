// The betta scene. Loaded on demand by ./index.js.
//
// Rendering: one small transparent canvas (about a fish and a half wide) that is
// moved around the viewport with a CSS transform. The GPU only ever shades that
// small square, which is what keeps this at 60fps on phones.
//
// Behaviour: the fish steers toward the resting spot of the section in view,
// weaving rather than going straight, is carried a little by scrolling, drifts
// toward a nearby cursor (or tap) and gives way if it gets close. Its body
// motion (./rig.js) and swim cycle scale with how hard it is swimming.
import {
  AnimationMixer, Box3, Group, MathUtils, NeutralToneMapping,
  PerspectiveCamera, Scene, Vector3, WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { addTopLight, fadeWithDepth } from './light.js';
import { createRig } from './rig.js';

const BASIS_PATH = '/basis/';        // KTX2 transcoder (public/basis, copied from three)
const FRAME_FIT = 0.94;              // share of the fish's bounding diagonal kept in frame (corners are empty)
const FOV = 22;
const ALPHA_CUTOFF = 0.4;            // fin texels more transparent than this are not drawn
const EDGE_TOP = 48, EDGE_BOTTOM = 72; // px kept clear for the nav bars
const YAW_SPRING = 15, YAW_DAMPING = 6.6; // side-flip spring (critical damping would be 7.7)
// Turning round. The head follows the spring above; the rest of the body follows the head on a
// softer, bouncier spring, so it curls into a C behind the head and then whips through.
const BODY_SPRING = 9, BODY_DAMPING = 3.6;
const MAX_CURL = 1.5;   // rad the tail end may lag the head (about 85 degrees)
const TURN_POINT = 0.14; // the fish turns about its shoulders, this far ahead of its middle (share of the canvas)
// Overall tempo. 1 is the original speed; lower is calmer. PACE slows travel, turning and
// wandering together; BODY_PACE slows the tail beat and fin motion.
const PACE = 0.55;
const BODY_PACE = 0.75;
const SCROLL_CARRY = 0.4; // share of a scroll that drags the fish along; lower keeps it in view
// Keeping clear of [data-fish-avoid] elements (project cards).
const BODY_REACH = 0.4;   // how far the body and fins reach from the canvas centre, as a share of the canvas
const KEEP_CLEAR = 8;     // px of gap kept between the fish and anything it must not cover
const THREE_QUARTER = Math.PI / 2 - 0.42; // side-on, turned slightly toward the viewer
const wrapAngle = (a) => MathUtils.euclideanModulo(a + Math.PI, Math.PI * 2) - Math.PI;
const damp = (current, target, rate, dt) => current + (target - current) * (1 - Math.exp(-rate * dt));
// Setup is split into short tasks so loading the fish never makes the page feel stuck.
// Each phase is also marked for the DevTools Performance panel ("fish:*").
const breathe = () => new Promise((resolve) => setTimeout(resolve, 0));
const mark = (name) => performance.mark(`fish:${name}`);

export async function createFish({ canvas, spots, avoid = [], url, reduced, fine }) {
  /* ---------- Renderer, light, camera ---------- */
  mark('start');
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearAlpha(0);
  renderer.toneMapping = NeutralToneMapping; // keeps the texture's own colours
  const scene = new Scene();
  await breathe();
  addTopLight(renderer, scene); // environment map + key light, both from above (./light.js)
  mark('lit');
  await breathe();
  const camera = new PerspectiveCamera(FOV, 1, 1, 80);

  /* ---------- Model ---------- */
  const ktx2 = new KTX2Loader().setTranscoderPath(BASIS_PATH).detectSupport(renderer);
  const gltf = await new GLTFLoader().setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder).loadAsync(url);
  ktx2.dispose();
  mark('loaded');
  await breathe();
  const model = gltf.scene;
  model.getObjectByName('Cube_0')?.removeFromParent(); // helper mesh left in the source file
  const mixer = new AnimationMixer(model);
  const clip = gltf.animations[0];
  mixer.clipAction(clip).play();
  const meshes = [];
  model.traverse((o) => { if (o.isSkinnedMesh) { o.frustumCulled = false; meshes.push(o); } }); // always framed, so never cull
  // The model's materials are alpha-blended and do not write depth. Left like that, the eyes are
  // painted over the head whatever is in front, so the far eye shows through as a second, misplaced
  // one. Writing depth (with an alpha cut-off so the clear parts of the fin texture stay clear)
  // makes the head hide the far eye and seats the near one in its socket.
  for (const mesh of meshes) {
    const eyes = /eye/i.test(mesh.name);
    mesh.material = mesh.material.clone();
    mesh.material.depthWrite = true;
    mesh.material.alphaTest = eyes ? 0.5 : ALPHA_CUTOFF;
    if (eyes) mesh.material.transparent = false; // eyes are solid; fins keep their soft blended edges
  }
  // Measure the fish across its whole swim cycle so fins never touch the canvas edge.
  const box = new Box3(), part = new Box3();
  for (let i = 0; i < 8; i++) {
    mixer.setTime((clip.duration * i) / 8);
    model.updateMatrixWorld(true);
    for (const mesh of meshes) { mesh.computeBoundingBox(); box.union(part.copy(mesh.boundingBox).applyMatrix4(mesh.matrixWorld)); }
  }
  mixer.setTime(0);
  const rig = createRig(model, mixer);
  if (import.meta.env.DEV) console.info(`fish: clip "${clip.name}", ${clip.duration}s, ${clip.tracks.length} tracks, ${meshes[0]?.skeleton.bones.length} bones`);
  const extent = box.getSize(new Vector3());
  const radius = Math.hypot(extent.y, extent.z) * 0.5 * FRAME_FIT;
  model.position.sub(box.getCenter(new Vector3())); // rotate about the middle of the fish
  const pivot = new Group();                         // model faces +Z; the pivot does the steering
  pivot.rotation.order = 'YXZ';
  pivot.add(model);
  scene.add(pivot);
  camera.position.z = radius / Math.sin(MathUtils.degToRad(FOV / 2));
  camera.near = camera.position.z - radius * 1.5; camera.far = camera.position.z + radius * 1.5;
  camera.updateProjectionMatrix();
  for (const mesh of meshes) fadeWithDepth(mesh.material, -extent.y * 0.42, extent.y * 0.34); // light thins out toward the belly
  mark('measured');
  await breathe();

  /* ---------- Size ---------- */
  let size = 0, W = innerWidth, H = innerHeight;
  function resize() {
    W = innerWidth; H = innerHeight;
    const next = canvas.clientWidth;
    if (next === size) return;
    size = next;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
  }
  resize();

  /* ---------- Reduced motion: one still pose, parked in the hero ---------- */
  if (reduced) {
    mixer.setTime(1.2);
    pivot.rotation.set(0.05, -THREE_QUARTER, 0);
    canvas.classList.add('is-still');
    spots[0].appendChild(canvas);
    await renderer.compileAsync(scene, camera);
    const still = () => { resize(); renderer.render(scene, camera); };
    still();
    addEventListener('resize', still);
    return;
  }

  /* ---------- Swimming ---------- */
  const fish = { x: 0, y: 0, heading: Math.PI, speed: 0, turn: 0, side: -1, yaw: -THREE_QUARTER, yawVel: 0, bodyYaw: -THREE_QUARTER, bodyVel: 0, pitch: 0, roll: 0, scale: 1, effort: 0 };
  // fish.x / fish.y is the point it turns about (its shoulders); its middle sits behind that, on whichever side it faces away from
  const lead = () => -size * fish.scale * TURN_POINT * Math.sin(fish.yaw);
  const pointer = { x: 0, y: 0, until: 0 };
  let lastScroll = scrollY, clock = 0;

  function target(t) {
    // the resting spot of whichever section is nearest the middle of the screen
    let rect = null, spot = null, best = Infinity;
    for (const el of spots) {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top - H * 0.42);
      if (d < best) { best = d; rect = r; spot = el; }
    }
    const scale = Number(spot.dataset.fishScale) || 1; // spots can ask for a smaller, "further away" fish
    const s = size * scale, m = s * 0.5;
    return {
      scale,
      x: MathUtils.clamp(rect.left + Math.sin(t * 0.17) * s * 0.28, m + s * TURN_POINT, Math.max(m, W - m - s * TURN_POINT)),   // slow figure of eight
      y: MathUtils.clamp(rect.top + Math.sin(t * 0.31 + 1) * s * 0.12, m + EDGE_TOP, Math.max(m + EDGE_TOP, H - m - EDGE_BOTTOM)),
    };
  }

  /* ---------- Keeping clear of cards ----------
     Each [data-fish-avoid] element is a no-go zone, grown by the fish's own reach so that only
     its centre needs testing. Three rules keep it out:
       1. its goal is never inside a zone (it waits just above or below, whichever is on screen);
       2. it is never drawn inside one (a card scrolling into it pushes it along);
       3. it never swims through one: to get to the other side it leaves by the edge of the
          screen and comes back in level with its goal. */
  const reach = () => size * fish.scale * BODY_REACH + KEEP_CLEAR;
  const inside = (zone, x, y) => x > zone.left && x < zone.right && y > zone.top && y < zone.bottom;
  function zones() {
    const grow = reach(), list = [];
    for (const el of avoid) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -H || r.top > H * 2 || !r.width) continue; // nowhere near the screen
      list.push({ left: r.left - grow, right: r.right + grow, top: r.top - grow, bottom: r.bottom + grow });
    }
    return list;
  }
  function keepGoalClear(goal, list) {
    const grow = reach(), inView = (y) => y > grow && y < H - grow;
    for (const zone of list) {
      if (!inside(zone, goal.x, goal.y)) continue;
      const fishAbove = fish.y < (zone.top + zone.bottom) / 2;
      const mine = fishAbove ? zone.top : zone.bottom, other = fishAbove ? zone.bottom : zone.top;
      goal.y = inView(mine) || !inView(other) ? mine : other; // stay on its side unless only the other side is on screen
    }
  }
  function keepFishClear(list) {
    for (const zone of list) {
      const x = fish.x + lead(); // zones are tested against the middle of the fish, not its turning point
      if (!inside(zone, x, fish.y)) continue;
      const exits = [
        [fish.y - zone.top, () => { fish.y = zone.top; }],
        [zone.bottom - fish.y, () => { fish.y = zone.bottom; }],
        [x - zone.left, () => { fish.x = zone.left - lead(); }],
        [zone.right - x, () => { fish.x = zone.right - lead(); }],
      ];
      exits.sort((a, b) => a[0] - b[0])[0][1](); // out by the nearest edge
    }
  }
  const blockedBy = (list, goal) => list.find((zone) =>
    ((fish.x + lead() > zone.left && fish.x + lead() < zone.right) || (goal.x > zone.left && goal.x < zone.right)) &&
    ((fish.y <= zone.top && goal.y >= zone.bottom) || (fish.y >= zone.bottom && goal.y <= zone.top)));
  const offScreen = () => { const h = size * fish.scale * 0.5, x = fish.x + lead(); return x < -h || x > W + h || fish.y < -h || fish.y > H + h; };

  const first = target(0);
  fish.scale = first.scale;
  fish.x = W + size; fish.y = first.y + size * 0.2; // enters from the right edge

  if (fine) addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.until = Infinity; }, { passive: true });
  else addEventListener('pointerdown', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.until = performance.now() + 2600; }, { passive: true });

  function step(frameDt, now) {
    const dt = frameDt * PACE; // everything the fish decides and does runs on its own, slower clock
    clock += dt;
    const t = clock;
    const scrolled = scrollY - lastScroll; lastScroll = scrollY;
    fish.y -= scrolled * SCROLL_CARRY; // the page moving past carries the water with it

    const goal = target(t);
    fish.scale = damp(fish.scale, goal.scale, 1.1, dt); // recedes or approaches as it changes section
    const clear = zones();
    keepGoalClear(goal, clear);
    keepFishClear(clear); // scrolling may have moved a card onto the fish
    let tx = goal.x, ty = goal.y;
    const detour = blockedBy(clear, goal);
    if (detour && offScreen()) { // out of sight: come back in from the side, level with the goal
      const fromRight = goal.x > W / 2, h = size * fish.scale * 0.5 + 4;
      fish.x = fromRight ? W + h : -h; fish.y = goal.y;
      fish.heading = fromRight ? Math.PI : 0; fish.turn = 0; fish.speed = size * 0.2;
      fish.side = fromRight ? -1 : 1; fish.yaw = fish.bodyYaw = fish.side * THREE_QUARTER; fish.yawVel = fish.bodyVel = 0;
    } else if (detour) {         // a card is in the way: leave by the nearer side of the screen, staying level
      tx = fish.x > W / 2 ? W + size : -size; ty = fish.y;
    } else if (now < pointer.until) {
      const dx = pointer.x - fish.x, dy = pointer.y - fish.y, d = Math.hypot(dx, dy) || 1;
      const near = size * 0.55, aware = size * 1.6;
      if (d < near) { tx -= (dx / d) * (near - d) * 1.6; ty -= (dy / d) * (near - d) * 1.6; }        // gives way
      else if (d < aware) { const k = fine ? 0.16 : 0.32; tx += (pointer.x - tx) * k; ty += (pointer.y - ty) * k; } // curious
    }

    const dx = tx - fish.x, dy = ty - fish.y, dist = Math.hypot(dx, dy);
    // Never a straight line: the wanted heading meanders, more so the further there is to go.
    const weave = (Math.sin(t * 0.83 + 1.7) * 0.36 + Math.sin(t * 0.37) * 0.2) * Math.min(1, dist / (size * 1.2));
    const diff = wrapAngle(Math.atan2(dy, dx) + weave - fish.heading);
    // Turn rate is itself eased, so the fish leans into a turn and out of it instead of snapping.
    const maxRate = Math.max(1.8, fish.speed / (size * 0.45)); // can pivot when slow, sweeps wider when fast
    fish.turn = damp(fish.turn, MathUtils.clamp(diff * 2.6, -maxRate, maxRate), 4.5, dt);
    fish.heading += fish.turn * dt;
    const pulse = 0.84 + 0.16 * Math.sin(t * 1.9 + 0.6); // burst and glide
    const cruise = Math.min(size * 2.4, size * 0.07 + dist * 0.85) * (0.5 + 0.5 * Math.max(0, Math.cos(diff))) * pulse;
    const gain = cruise - fish.speed;
    fish.speed = damp(fish.speed, cruise, gain < 0 ? 3.2 : 1.5, dt); // brakes faster than it accelerates, so it settles instead of overshooting
    fish.x += Math.cos(fish.heading) * fish.speed * dt;
    fish.y += Math.sin(fish.heading) * fish.speed * dt;
    keepFishClear(clear);
    // How hard it is working: mostly speed, plus a kick while accelerating or turning.
    const work = fish.speed / (size * 1.1) + Math.max(0, gain) / (size * 2.5) + Math.abs(fish.turn) * 0.06 + Math.abs(fish.yawVel) * 0.1; // turning round takes a few quick beats
    fish.effort = damp(fish.effort, MathUtils.clamp(work, 0, 1), 3, dt);

    // Pose: side-on to the viewer, facing the way it travels. It flips sides by turning through the camera.
    const hx = Math.cos(fish.heading), hy = Math.sin(fish.heading);
    if (fish.speed > size * 0.2) { // only turns around when actually travelling; while hovering it holds its facing and drifts
      if (hx > 0.3) fish.side = 1; else if (hx < -0.3) fish.side = -1;
    }
    const moving = Math.min(1, fish.speed / (size * 0.25));
    // A slightly under-damped spring: the turn eases in, eases out and settles with a hint of follow-through.
    fish.yawVel += (YAW_SPRING * (fish.side * THREE_QUARTER - fish.yaw) - YAW_DAMPING * fish.yawVel) * dt;
    fish.yaw += fish.yawVel * dt;
    fish.bodyVel += (BODY_SPRING * (fish.yaw - fish.bodyYaw) - BODY_DAMPING * fish.bodyVel) * dt;
    fish.bodyYaw += fish.bodyVel * dt;
    const curl = MathUtils.clamp(fish.bodyYaw - fish.yaw, -MAX_CURL, MAX_CURL); // how far the tail end trails the head
    fish.pitch = damp(fish.pitch, MathUtils.clamp(hy * 0.6, -0.42, 0.42) * moving, 3, dt);
    const bank = MathUtils.clamp(-fish.turn * 0.16, -0.3, 0.3) * fish.side + MathUtils.clamp(fish.yawVel * 0.07, -0.2, 0.2); // banks into curves and flips
    fish.roll = damp(fish.roll, bank, 3.5, dt);

    mixer.timeScale = 0.6 + fish.effort * 1.6; // the clip's own fin drift also follows effort
    const recoil = rig.update(frameDt * BODY_PACE, { effort: fish.effort, curl });
    pivot.rotation.set(fish.pitch, fish.yaw + recoil, fish.roll);
  }

  /* ---------- Frame loop: stops when the tab is hidden, skips drawing when off screen ---------- */
  let raf = 0, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = MathUtils.clamp((now - last) / 1000, 0.001, 0.05); last = now;
    step(dt, now);
    const bob = Math.sin(clock * 1.2) * size * 0.012;
    const middle = fish.x + lead();
    canvas.style.transform = `translate3d(${(middle - size / 2).toFixed(1)}px, ${(fish.y + bob - size / 2).toFixed(1)}px, 0) scale(${fish.scale.toFixed(3)})`;
    const h = size * fish.scale * 0.5;
    if (middle < -h || middle > W + h || fish.y < -h || fish.y > H + h) return; // off screen: nothing to draw
    renderer.render(scene, camera);
  }
  const play = () => { if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  addEventListener('resize', resize);

  await renderer.compileAsync(scene, camera); // compile shaders off the main thread before the first frame
  mark('compiled');
  play();
}
