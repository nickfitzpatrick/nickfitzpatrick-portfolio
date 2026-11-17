// Lighting for the fish: light falling from the surface above.
//
// The environment is a simple sky dome rendered once into a reflection map: brightest
// straight overhead, falling off toward the horizon, with a dim cool fill from below so
// the belly never goes black. The fish's materials are PBR, so this one map gives it both
// its soft overall light and its highlights. A directional light from above adds the crisp
// glint along the back.
//
// A betta is mostly thin, upright fins, and a surface facing sideways catches the same light
// wherever it is. So light also fades with depth (fadeWithDepth): full strength at the top of
// the fish, dimmer toward the bottom, the way light thins out under water.
//
// All of it is fixed to the page, not to the fish, so the lit side stays on top however the
// fish turns or banks.
import { BackSide, DirectionalLight, Mesh, PMREMGenerator, Scene, ShaderMaterial, SphereGeometry } from 'three';

const OVERHEAD = [2.6, 2.75, 2.9];   // light at the top of the dome (linear, above 1 = brighter than white)
const HORIZON = [0.66, 0.72, 0.78];  // light from the sides
const BELOW = [0.12, 0.15, 0.18];    // faint bounce from underneath
const FALLOFF = 2.2;                 // higher = tighter pool of light overhead
const ENV_INTENSITY = 1.2;
const KEY_INTENSITY = 1.5;
const DEPTH_FLOOR = 0.52;            // share of the light that reaches the bottom of the fish (1 = no fade)

const vec3 = (c) => `vec3(${c.map((n) => n.toFixed(3)).join(', ')})`;

export function addTopLight(renderer, scene) {
  const dome = new Mesh(
    new SphereGeometry(10, 32, 16),
    new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `varying vec3 vDir;
        void main() {
          float up = normalize(vDir).y;
          vec3 upper = mix(${vec3(HORIZON)}, ${vec3(OVERHEAD)}, pow(max(up, 0.0), ${FALLOFF.toFixed(2)}));
          vec3 lower = mix(${vec3(HORIZON)}, ${vec3(BELOW)}, smoothstep(0.0, 0.45, -up));
          gl_FragColor = vec4(up >= 0.0 ? upper : lower, 1.0);
        }`,
    }),
  );
  const sky = new Scene();
  sky.add(dome);
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(sky, 0, 0.1, 100, { size: 128 }).texture;
  scene.environmentIntensity = ENV_INTENSITY;
  pmrem.dispose();
  dome.geometry.dispose(); dome.material.dispose();

  const key = new DirectionalLight(0xf4fbff, KEY_INTENSITY); // from the surface: above, a touch in front
  key.position.set(0.5, 8, 2.2);
  scene.add(key);
}

/** Fades a material's light from `top` (full) down to `bottom` (DEPTH_FLOOR), in scene units of height. */
export function fadeWithDepth(material, bottom, top) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDepthFade = { value: [bottom, top, DEPTH_FLOOR] };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vHeight;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvHeight = (modelMatrix * vec4(transformed, 1.0)).y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vHeight;\nuniform vec3 uDepthFade;')
      .replace('#include <opaque_fragment>', 'outgoingLight *= mix(uDepthFade.z, 1.0, smoothstep(uDepthFade.x, uDepthFade.y, vHeight));\n#include <opaque_fragment>');
  };
  material.needsUpdate = true;
}
