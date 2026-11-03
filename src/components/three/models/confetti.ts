import { CapsuleGeometry, CatmullRomCurve3, TubeGeometry, Vector3, type BufferGeometry } from "three";

import type { Quality } from "../finishes";

// Glossy ribbons for the All set burst: a long wave, a short wave and a stick,
// like the flat squiggles in the Figma frame but round and shiny. Flattened
// tubes in the x/y plane. Units are mm.

export type ConfettiShape = 0 | 1 | 2;

const cache = new Map<string, BufferGeometry>();

function wave(length: number, waves: number, amplitude: number, quality: Quality) {
  const points: Vector3[] = [];
  for (let i = 0; i <= 24; i += 1) {
    const t = i / 24;
    points.push(new Vector3((t - 0.5) * length, Math.sin(t * Math.PI * 2 * waves) * amplitude, 0));
  }
  const high = quality === "high";
  const geometry = new TubeGeometry(new CatmullRomCurve3(points), high ? 64 : 32, 2.1, high ? 10 : 6, false);
  // Flatten into a ribbon.
  geometry.scale(1, 1, 0.6);
  return geometry;
}

export function confettiGeometry(shape: ConfettiShape, quality: Quality) {
  const key = `${shape}:${quality}`;
  let geometry = cache.get(key);
  if (!geometry) {
    if (shape === 2) {
      geometry = new CapsuleGeometry(2, 30, 4, quality === "high" ? 10 : 6);
      geometry.rotateZ(Math.PI / 2);
    } else {
      geometry = shape === 0 ? wave(30, 1.5, 4, quality) : wave(22, 1, 5, quality);
    }
    cache.set(key, geometry);
  }
  return geometry;
}
