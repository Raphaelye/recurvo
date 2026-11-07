import { Group, type Object3D, type PerspectiveCamera, type Texture, type WebGLRenderer } from "three";

import { createGlow } from "./effects";
import { createFinishes, type Quality } from "./finishes";
import { approach } from "./motion";
import type { ScenePalette } from "./palette";
import type { SceneDriver } from "./sceneDriver";
import { createCelebrate } from "./scenes/celebrate";
import { createScan } from "./scenes/scan";
import type { Glow, SceneContent } from "./scenes/types";
import { createWelcome } from "./scenes/welcome";
import { createEnvironment, createLights } from "./studio";

// Everything inside the canvas for one scene: the studio lighting, the glow and
// the scene's models, plus the camera framing. Plain three.js, so the same code
// runs in the app (hosted by Scene.tsx) and in still renders.

export type SceneMode = "welcome" | "scan" | "celebrate";

const builders = { welcome: createWelcome, scan: createScan, celebrate: createCelebrate };

// A long lens, like a product shot: little perspective distortion.
export const FOV = 24;
const DEG = Math.PI / 180;

export type Size = { width: number; height: number };
// Where the composition should sit, in canvas points.
export type Frame = { x: number; y: number; width: number; height: number };

export type World = {
  root: Group;
  environment: Texture | null;
  // Objects a tap can hit.
  pickables: Object3D;
  update(time: number, dt: number, driver: SceneDriver, camera: PerspectiveCamera): void;
  frame(camera: PerspectiveCamera, size: Size, frame: Frame | undefined, driver: SceneDriver, dt: number): void;
  poke(object: Object3D, time: number): boolean;
  setPalette(palette: ScenePalette, renderer: WebGLRenderer): void;
  dispose(): void;
};

export function createWorld(
  mode: SceneMode,
  renderer: WebGLRenderer,
  palette: ScenePalette,
  quality: Quality,
): World {
  let current = palette;
  let environment = createEnvironment(renderer, palette);
  const finishes = createFinishes(palette, quality, Boolean(environment));
  const lights = createLights(palette, quality === "high", Boolean(environment));
  const content: SceneContent = builders[mode]({ finishes, quality });
  const glow = createGlow();
  const root = new Group();
  root.add(lights.group, glow.mesh, content.root);

  // Eased framing and glow, so a stage change pans instead of jumping.
  const view = { zoom: 0, x: 0, y: 0 };
  const parallax = { x: 0, y: 0 };
  let glowState: Glow | undefined;
  let shadowStage = -1;

  return {
    root,
    get environment() {
      return environment?.texture ?? null;
    },
    pickables: content.root,

    update(time, dt, driver, camera) {
      content.update(time, dt, driver, current);
      const goal = content.layout(driver.stage).glow;
      const state = (glowState ??= [...goal]);
      for (let i = 0; i < goal.length; i += 1) {
        state[i] = driver.reduceMotion ? goal[i] : approach(state[i], goal[i], 3, dt);
      }
      const [x, y, width, height, strength] = state;
      glow.set(camera, current.glow, x, y, width, height, current.glowOpacity * strength);
    },

    frame(camera, size, frame, driver, dt) {
      const { box } = content.layout(driver.stage);
      if (shadowStage !== driver.stage) {
        shadowStage = driver.stage;
        lights.fitShadow(Math.max(box[0], box[1]) * 0.6);
      }
      const area = frame ?? { x: 0, y: 0, width: size.width, height: size.height };
      const goal = {
        zoom: Math.max(0.1, Math.min(area.width / box[0], area.height / box[1])),
        x: area.x + area.width / 2 - size.width / 2,
        y: area.y + area.height / 2 - size.height / 2,
      };
      const snap = view.zoom === 0 || driver.reduceMotion;
      view.zoom = snap ? goal.zoom : approach(view.zoom, goal.zoom, 5, dt);
      view.x = snap ? goal.x : approach(view.x, goal.x, 5, dt);
      view.y = snap ? goal.y : approach(view.y, goal.y, 5, dt);

      // Touch parallax swings the camera a few degrees round the middle.
      parallax.x = driver.reduceMotion ? 0 : approach(parallax.x, driver.parallax.x, 6, dt);
      parallax.y = driver.reduceMotion ? 0 : approach(parallax.y, driver.parallax.y, 6, dt);
      const azimuth = parallax.x * 7 * DEG;
      const elevation = -parallax.y * 5 * DEG;

      // Distance at which one design point at z = 0 covers `zoom` canvas points.
      const distance = size.height / view.zoom / 2 / Math.tan((FOV / 2) * DEG);
      camera.position.set(
        distance * Math.sin(azimuth) * Math.cos(elevation),
        distance * Math.sin(elevation),
        distance * Math.cos(azimuth) * Math.cos(elevation),
      );
      camera.lookAt(0, 0, 0);
      camera.fov = FOV;
      camera.near = Math.max(1, distance - 700);
      camera.far = distance + 700;
      // Shift the picture so the composition's centre lands on the frame's centre.
      camera.setViewOffset(size.width, size.height, -view.x, -view.y, size.width, size.height);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
    },

    poke: (object, time) => content.poke(object, time),

    setPalette(next, renderer) {
      if (next === current) {
        return;
      }
      current = next;
      finishes.setPalette(next);
      lights.setPalette(next);
      // The materials were made for reflections or for the lit fallback; a
      // device that had none at the start keeps the fallback.
      if (environment) {
        const previous = environment;
        environment = createEnvironment(renderer, next);
        previous.dispose();
      }
    },

    dispose() {
      content.dispose();
      glow.dispose();
      finishes.dispose();
      environment?.dispose();
    },
  };
}
