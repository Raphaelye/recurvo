import { IcosahedronGeometry, Mesh, type Material } from "three";

import type { Quality } from "../finishes";

// The blob the holder and cards squash into between beat 2 and beat 3, before it
// pops into the calendar: a unit sphere whose surface wobbles.
export function createBlob(material: Material, quality: Quality) {
  const geometry = new IcosahedronGeometry(1, quality === "high" ? 12 : 6);
  const position = geometry.attributes.position;
  const base = Float32Array.from(position.array);
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  // The wobble pushes the surface past the sphere's bounds.
  mesh.frustumCulled = false;

  return {
    mesh,
    // amount 0 is a smooth sphere. The normals stay the sphere's, which reads
    // fine for the half second the blob is on screen.
    wobble(time: number, amount: number) {
      for (let i = 0; i < position.count; i += 1) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const z = base[i * 3 + 2];
        const wave =
          Math.sin(x * 3.1 + time * 9) * Math.sin(y * 2.7 + time * 7.3) +
          Math.sin(z * 3.7 - time * 8.1) * 0.6;
        const k = 1 + amount * 0.16 * wave;
        position.setXYZ(i, x * k, y * k, z * k);
      }
      position.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
    },
  };
}
