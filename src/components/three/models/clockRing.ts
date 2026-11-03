import { BoxGeometry, ExtrudeGeometry, Group, Mesh, Shape, TorusGeometry, type BufferGeometry } from "three";

import type { Finishes, Quality } from "../finishes";

// The clock ring the logo coins ride on in beat 3: a steel bezel with twelve
// hour ticks and an orange pip at 12, where each renewal comes due. It lies in
// the x/y plane, facing +z. Units are mm.

export const CLOCK = { radius: 62 };

type ClockGeometry = {
  ring: BufferGeometry;
  inner: BufferGeometry;
  tick: BufferGeometry;
  major: BufferGeometry;
  pip: BufferGeometry;
};

const cache = new Map<Quality, ClockGeometry>();

function geometryFor(quality: Quality): ClockGeometry {
  let geometry = cache.get(quality);
  if (!geometry) {
    const high = quality === "high";
    const pip = new Shape();
    pip.moveTo(-3.2, 0);
    pip.lineTo(3.2, 0);
    pip.lineTo(0, -5.2);
    pip.closePath();
    geometry = {
      ring: new TorusGeometry(CLOCK.radius, 1.1, high ? 14 : 8, high ? 180 : 96),
      inner: new TorusGeometry(CLOCK.radius - 4, 0.35, 8, high ? 160 : 80),
      tick: new BoxGeometry(1.2, 3.6, 1),
      major: new BoxGeometry(1.6, 6, 1.2),
      pip: new ExtrudeGeometry(pip, {
        depth: 0.8,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.3,
        bevelSegments: 2,
      }),
    };
    cache.set(quality, geometry);
  }
  return geometry;
}

// group turns with the coins; the pip stays put at 12, outside the coin that
// is due, pointing in at it.
export function createClockRing(finishes: Finishes, quality: Quality) {
  const geometry = geometryFor(quality);
  const group = new Group();
  const ring = new Mesh(geometry.ring, finishes.get("steelSatin"));
  const inner = new Mesh(geometry.inner, finishes.get("steelPolished"));
  ring.castShadow = true;
  ring.receiveShadow = true;
  group.add(ring, inner);

  const pip = new Mesh(geometry.pip, finishes.get("glossAccent"));
  pip.position.set(0, CLOCK.radius + 17, -0.4);
  pip.castShadow = true;

  for (let hour = 0; hour < 12; hour += 1) {
    const angle = Math.PI / 2 - (hour / 12) * Math.PI * 2;
    const major = hour % 3 === 0;
    const tick = new Mesh(major ? geometry.major : geometry.tick, finishes.get("steelPolished"));
    const distance = CLOCK.radius + (major ? 5.4 : 4.4);
    tick.position.set(Math.cos(angle) * distance, Math.sin(angle) * distance, 0);
    tick.rotation.z = angle - Math.PI / 2;
    tick.castShadow = true;
    group.add(tick);
  }
  return { group, pip };
}
