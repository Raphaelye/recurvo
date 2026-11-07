import {
  CircleGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  Vector2,
  type BufferGeometry,
  type Material,
} from "three";

import type { Service } from "@/data/services";

import type { Finishes, Quality } from "../finishes";
import { createLogo } from "./logos";
import { rMarkGeometry } from "./rMark";

// A coin with a raised rim and a reeded edge. The front carries the Recurvo R,
// the back the service's brand mark on enamel. Faces point +z (R) and -z (logo).
// Units are mm.

export const COIN = { radius: 15, thickness: 3.4 };

// Radius and height of the inner faces; the rim stands 0.3 higher.
const FIELD = 12.6;
const FIELD_Z = 1.4;

export type Coin = {
  // Posed by the scene.
  group: Group;
  // Turned half a turn around y to show the logo.
  spin: Group;
  service: Service;
};

type CoinGeometry = { rim: BufferGeometry; edge: BufferGeometry; field: BufferGeometry };

const cache = new Map<Quality, CoinGeometry>();

function geometryFor(quality: Quality): CoinGeometry {
  let geometry = cache.get(quality);
  if (!geometry) {
    const segments = quality === "high" ? 96 : 56;
    const R = COIN.radius;
    const h = COIN.thickness / 2;
    // Profile from the back face, round the rim and edge, to the front face.
    const profile = [
      [FIELD, -FIELD_Z],
      [FIELD + 0.3, -h + 0.06],
      [FIELD + 0.8, -h],
      [R - 0.75, -h],
      [R - 0.3, -h + 0.08],
      [R - 0.1, -h + 0.32],
      [R - 0.12, -h + 0.6],
      [R - 0.12, h - 0.6],
      [R - 0.1, h - 0.32],
      [R - 0.3, h - 0.08],
      [R - 0.75, h],
      [FIELD + 0.8, h],
      [FIELD + 0.3, h - 0.06],
      [FIELD, FIELD_Z],
    ].map(([x, y]) => new Vector2(x, y));
    const rim = new LatheGeometry(profile, segments);
    rim.rotateX(Math.PI / 2);

    // Reeded edge: fine ridges round the side.
    const ridges = quality === "high" ? 90 : 60;
    const edge = new CylinderGeometry(R, R, COIN.thickness - 1.25, ridges * 4, 1, true);
    const position = edge.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const angle = Math.atan2(z, x);
      const radius = R - 0.12 + 0.13 * (0.5 + 0.5 * Math.cos(angle * ridges));
      position.setXYZ(i, Math.cos(angle) * radius, position.getY(i), Math.sin(angle) * radius);
    }
    edge.computeVertexNormals();
    edge.rotateX(Math.PI / 2);

    const field = new CircleGeometry(FIELD + 0.05, segments);
    geometry = { rim, edge, field };
    cache.set(quality, geometry);
  }
  return geometry;
}

function mesh(geometry: BufferGeometry, material: Material) {
  const result = new Mesh(geometry, material);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

export function createCoin(service: Service, finishes: Finishes, quality: Quality): Coin {
  const { rim, edge, field } = geometryFor(quality);
  // Two-tone: a satin graphite field with a polished steel rim and R.
  const rimFinish = finishes.get("coinRim");

  const spin = new Group();
  spin.add(mesh(rim, rimFinish), mesh(edge, rimFinish));

  const front = mesh(field, finishes.get("coinField"));
  front.position.z = FIELD_Z;
  const mark = mesh(rMarkGeometry(17, 0.42), finishes.get("coinMark"));
  mark.position.z = FIELD_Z;
  spin.add(front, mark);

  const enamel = mesh(field, finishes.brand(service.enamel));
  enamel.rotation.y = Math.PI;
  enamel.position.z = -FIELD_Z;
  const logo = createLogo(service, finishes, quality, 19.5);
  logo.rotation.y = Math.PI;
  logo.position.z = -FIELD_Z;
  spin.add(enamel, logo);

  const group = new Group();
  group.add(spin);
  return { group, spin, service };
}
