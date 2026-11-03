import type { Group, Object3D } from "three";

import type { Finishes, Quality } from "../finishes";
import type { ScenePalette } from "../palette";
import type { SceneDriver } from "../sceneDriver";

export type SceneContext = { finishes: Finishes; quality: Quality };

// Glow behind a stage: x, y, width, height in design points, strength 0 to 1.
export type Glow = [number, number, number, number, number];

export type SceneLayout = {
  // Size of the composition in design points; the camera fits it into the frame.
  box: [number, number];
  glow: Glow;
};

export type SceneContent = {
  root: Group;
  layout(stage: number): SceneLayout;
  update(time: number, dt: number, driver: SceneDriver, palette: ScenePalette): void;
  // Tap: true when the object belongs to something that reacted.
  poke(object: Object3D, time: number): boolean;
  dispose(): void;
};
