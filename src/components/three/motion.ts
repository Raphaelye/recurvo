import type { Object3D } from "three";

// Springs and easing for the scenes. Every moving object is a Body: each frame
// the scene gives it a target Pose and the body springs towards it, then idle
// float is added on top. Nothing here touches React.

export type Vec3 = [number, number, number];

// Position in design points (x right, y up, z towards the camera), rotation in
// degrees (x, y, z order) and a uniform scale.
export type Pose = { at: Vec3; turn?: Vec3; scale: number };

const DEG = Math.PI / 180;

// About 700 ms to settle with a little overshoot.
export const SPRING = { stiffness: 120, damping: 17 };

export type Body = {
  object: Object3D;
  // x, y, z, rotation x, y, z (radians), scale
  value: number[];
  velocity: number[];
  started: boolean;
  phase: number;
};

// Same id, same phase, so idle motion never lines up between bodies.
function phaseOf(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 997;
  }
  return (hash / 997) * Math.PI * 2;
}

export function createBody(object: Object3D, id: string): Body {
  return {
    object,
    value: [0, 0, 0, 0, 0, 0, 0.001],
    velocity: [0, 0, 0, 0, 0, 0, 0],
    started: false,
    phase: phaseOf(id),
  };
}

export function poseValues(pose: Pose, out: number[] = []) {
  const [rx, ry, rz] = pose.turn ?? [0, 0, 0];
  out[0] = pose.at[0];
  out[1] = pose.at[1];
  out[2] = pose.at[2];
  out[3] = rx * DEG;
  out[4] = ry * DEG;
  out[5] = rz * DEG;
  out[6] = pose.scale;
  return out;
}

// Read the body back from its object, after it moved to a new parent.
export function syncBody(body: Body) {
  const { position, rotation, scale } = body.object;
  body.value = [position.x, position.y, position.z, rotation.x, rotation.y, rotation.z, scale.x];
}

export function snapBody(body: Body, target: number[]) {
  for (let i = 0; i < 7; i += 1) {
    body.value[i] = target[i];
    body.velocity[i] = 0;
  }
  body.started = true;
}

export function springBody(body: Body, target: number[], dt: number, spring = SPRING) {
  if (!body.started) {
    // First frame: start in place, scaled down, so it grows in.
    snapBody(body, target);
    body.value[6] = 0.001;
  }
  for (let i = 0; i < 7; i += 1) {
    const v = body.velocity[i] + ((target[i] - body.value[i]) * spring.stiffness - body.velocity[i] * spring.damping) * dt;
    body.velocity[i] = v;
    body.value[i] += v * dt;
  }
}

// Write the body to its object, with idle float (0 to 1) on top: a slow bob,
// sway and a little turn, at the body's own phase.
export function applyBody(body: Body, time: number, idle: number) {
  const [x, y, z, rx, ry, rz, s] = body.value;
  const p = body.phase;
  const bob = Math.sin(time * 1.1 + p) * 3.2 * idle;
  body.object.position.set(x, y + bob, z);
  body.object.rotation.set(
    rx + Math.sin(time * 0.6 + p) * 3 * DEG * idle,
    ry + Math.sin(time * 0.45 + p * 1.7) * 5 * DEG * idle,
    rz + Math.sin(time * 0.5 + p * 0.7) * 2 * DEG * idle,
  );
  const scale = Math.max(0.001, s);
  body.object.scale.setScalar(scale);
  body.object.visible = scale > 0.002;
}

export function approach(value: number, target: number, rate: number, dt: number) {
  return value + (target - value) * (1 - Math.exp(-rate * dt));
}

export function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

export function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function easeOutBack(t: number, overshoot = 1.5) {
  return 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2;
}
