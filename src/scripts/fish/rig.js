// Procedural swimming, layered on top of the model's built-in clip.
//
// The clip that ships with the model ("Take 01") only drifts the fins and jaw a
// little; the spine and tail base have no keyframes, so on its own the fish
// reads as rigid. This adds, every frame, after the clip has been applied:
//   - a travelling S-wave down the spine (yaw per joint, stronger toward the tail)
//   - tail lobes and fins that trail and flutter behind that wave
//   - fins that flare open when idle and fold back as the fish speeds up
//   - pectoral fins that scull while hovering
//   - a body bend into turns
// Everything scales with `effort` (0 = hovering, 1 = swimming hard).
import { MathUtils, Quaternion, Vector3 } from 'three';

const UP = new Vector3(0, 1, 0);       // model space: the fish faces +Z, back is +Y
const FORWARD = new Vector3(0, 0, 1);
const SIDE = new Vector3(1, 0, 0);
const TAU = Math.PI * 2;
const WAVE_STEP = 0.8;                 // phase lag between neighbouring spine joints (rad)

const name = (id) => `Bone${id}_Armature`;

// Spine joints from head to tail; `share` is how much of the wave each carries.
const SPINE = [
  { ids: ['002'], share: 0.1 },
  { ids: ['003'], share: 0.28 },
  { ids: ['004'], share: 0.52 },
  { ids: ['005'], share: 0.8 },
  { ids: ['039', '020'], share: 1 },   // tail base (lower and upper halves)
];
// Tail lobes as [base, tip]. fold: -1 closes downward (upper lobes), +1 closes upward (lower lobes).
const TAIL = [
  { ids: ['040', '041'], fold: 0, lag: 0 },
  { ids: ['025', '026'], fold: -1, lag: 0.35 },
  { ids: ['042', '043'], fold: 1, lag: 0.55 },
  { ids: ['044', '045'], fold: 1, lag: 0.95 },
];
// Dorsal, ventral, anal and pelvic fins as [base, tip]. `at` = position along the body in spine joints.
const FINS = [
  { ids: ['021', '022'], fold: -1, at: 1.2 },
  { ids: ['023', '024'], fold: -1, at: 3.1 },
  { ids: ['035', '037'], fold: 1, at: 0.7 },
  { ids: ['036', '038'], fold: 1, at: 2.8 },
  { ids: ['029', '031'], fold: 1, at: 0.3 },
  { ids: ['030', '032'], fold: 1, at: 0.5 },
];
const PECTORALS = [
  { ids: ['012'], sign: 1 },
  { ids: ['013'], sign: -1 },
];

export function createRig(model, mixer) {
  model.updateMatrixWorld(true);
  const driven = new Map(); // bone -> { bone, mixed, up, forward, side }
  const world = new Quaternion();
  const grab = (id) => {
    const bone = model.getObjectByName(name(id));
    if (!bone) return null;
    if (!driven.has(bone)) {
      // model-space axes expressed in this bone's own frame, so rotations stay anatomical
      const inverse = bone.getWorldQuaternion(world).clone().invert();
      driven.set(bone, {
        bone,
        mixed: bone.quaternion.clone(), // what the clip last wrote
        up: UP.clone().applyQuaternion(inverse),
        forward: FORWARD.clone().applyQuaternion(inverse),
        side: SIDE.clone().applyQuaternion(inverse),
      });
    }
    return driven.get(bone);
  };
  const resolve = (group) => group.map((g) => ({ ...g, joints: g.ids.map(grab).filter(Boolean) })).filter((g) => g.joints.length);
  const spine = resolve(SPINE), tail = resolve(TAIL), fins = resolve(FINS), pectorals = resolve(PECTORALS);

  const q = new Quaternion();
  const turn = (joint, axis, angle) => { if (angle) joint.bone.quaternion.multiply(q.setFromAxisAngle(axis, angle)); };
  let phase = 0, scull = 0, slow = 0;

  return {
    /** Advances the clip and the procedural layer. Returns the head-recoil yaw (rad) for the caller to apply to the whole fish.
     *  @param {number} dt seconds  @param {{effort:number, yawRate:number}} state */
    update(dt, { effort = 0, yawRate = 0 } = {}) {
      // The mixer skips writing values that did not change, so start every frame from what it
      // last wrote, let it update, remember that, and only then add the procedural layer.
      for (const j of driven.values()) j.bone.quaternion.copy(j.mixed);
      mixer.update(dt);
      for (const j of driven.values()) j.mixed.copy(j.bone.quaternion);

      phase += dt * TAU * MathUtils.lerp(0.42, 2.3, effort);  // tail-beat frequency
      scull += dt * TAU * MathUtils.lerp(1.15, 1.9, effort);
      slow += dt;
      const amp = MathUtils.lerp(0.06, 0.19, effort);          // joint swing at the tail base (rad)
      const flutter = MathUtils.lerp(0.06, 0.11, effort);     // in-plane ripple of fins and tail lobes (rad)
      const bend = MathUtils.clamp(-yawRate * 0.085, -0.24, 0.24); // tail trails behind a turn
      const fold = MathUtils.lerp(-0.07, 0.17, effort);        // fins flare when idle, streamline at speed

      spine.forEach((s, i) => {
        const a = amp * s.share * Math.sin(phase - i * WAVE_STEP) + bend * s.share;
        for (const j of s.joints) turn(j, j.up, a);
      });
      const n = spine.length;
      for (const lobe of tail) {
        const [base, tip] = lobe.joints;
        const breathe = 0.08 * Math.sin(slow * 0.7 + lobe.lag * 4);
        const ripple = flutter * Math.sin(phase - n * WAVE_STEP - lobe.lag * 2.4);
        turn(base, base.up, amp * 1.25 * Math.sin(phase - n * WAVE_STEP - lobe.lag) + bend);
        turn(base, base.side, lobe.fold * (fold + breathe) + ripple);
        if (tip) {
          turn(tip, tip.up, amp * 1.6 * Math.sin(phase - (n + 1) * WAVE_STEP - lobe.lag * 1.4) + bend * 0.8);
          turn(tip, tip.side, flutter * 1.3 * Math.sin(phase - (n + 1.4) * WAVE_STEP - lobe.lag * 2.4)); // tips trail the base
        }
      }
      for (const fin of fins) {
        const [base, tip] = fin.joints;
        const breathe = 0.09 * Math.sin(slow * 0.55 + fin.at * 2.1);
        const ripple = flutter * Math.sin(phase - fin.at * WAVE_STEP - 1.2);
        turn(base, base.forward, amp * 1.3 * Math.sin(phase - fin.at * WAVE_STEP - 0.9) - bend * 0.5); // leans away from the wave
        turn(base, base.side, fin.fold * (fold * 0.8 + breathe) + ripple);
        if (tip) {
          turn(tip, tip.forward, amp * 1.6 * Math.sin(phase - fin.at * WAVE_STEP - 1.7));
          turn(tip, tip.side, flutter * 1.2 * Math.sin(phase - fin.at * WAVE_STEP - 2.1));
        }
      }
      for (const fin of pectorals) {
        const [base] = fin.joints;
        const hover = 1 - effort * 0.65; // sculls most when hovering
        turn(base, base.up, fin.sign * (0.2 * hover * Math.sin(scull + (fin.sign > 0 ? 0 : 2.6)) - effort * 0.3));
        turn(base, base.forward, fin.sign * 0.1 * hover * Math.sin(scull * 0.5 + 1));
      }
      return amp * 0.3 * Math.sin(phase + 0.9); // head recoil: the body yaws slightly against the tail
    },
  };
}
