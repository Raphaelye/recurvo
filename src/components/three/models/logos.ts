import { ExtrudeGeometry, Group, Mesh, Shape, Vector2, type BufferGeometry } from "three";

import type { Service } from "@/data/services";

import type { Finishes, Quality } from "../finishes";
import { strokeGeometry } from "./stroke";
import { elementLines, elementShapes } from "./svgPath";

// A service's brand mark in its brand colours, raised off the coin's enamel.
// Built in the icon's own 24 x 24 box, centred on 0 with y up; the coin scales it.

// How far filled parts stand up from the enamel, in icon units.
const RELIEF = 0.55;

type Part = { geometry: BufferGeometry; color: string };

const cache = new Map<string, Part[]>();

function fill(shapes: Shape[], depth: number, lift: number) {
  const bevel = 0.14;
  const geometry = new ExtrudeGeometry(shapes, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelSegments: 2,
    curveSegments: 18,
  });
  geometry.translate(0, 0, bevel + lift);
  return geometry;
}

function quad(points: [number, number][]) {
  return new Shape(points.map(([x, y]) => new Vector2(x, y)));
}

// Netflix's N is not in the Hugeicons free set: two uprights with the diagonal
// ribbon laid over them.
function netflix(service: Service): Part[] {
  const [diagonal, uprights] = service.parts;
  const [w, h] = [3.3, 8.8];
  const left = quad([[-5.4, -h], [-5.4 + w, -h], [-5.4 + w, h], [-5.4, h]]);
  const right = quad([[5.4 - w, -h], [5.4, -h], [5.4, h], [5.4 - w, h]]);
  const ribbon = quad([[-5.4, h], [-5.4 + w, h], [5.4, -h], [5.4 - w, -h]]);
  return [
    { geometry: fill([left, right], RELIEF * 0.8, 0), color: uprights?.color ?? "#000000" },
    { geometry: fill([ribbon], RELIEF, 0.02), color: diagonal?.color ?? "#000000" },
  ];
}

function build(service: Service, quality: Quality): Part[] {
  if (!service.icon) {
    return netflix(service);
  }
  const parts: Part[] = [];
  service.icon.forEach(([tag, attributes], index) => {
    const part = service.parts[index];
    if (!part) {
      return;
    }
    const geometry = part.fill
      ? fill(elementShapes(tag, attributes), RELIEF, index * 0.04)
      : strokeGeometry(
          elementLines(tag, attributes, quality === "high" ? 0.22 : 0.4),
          (part.width ?? Number(attributes.strokeWidth ?? 1.5)) / 2,
          quality,
        );
    // Icon box (0..24, y down flipped to 0..-24) to centred.
    geometry.translate(-12, 12, 0);
    parts.push({ geometry, color: part.color });
  });
  return parts;
}

// The mark as meshes standing on z = 0, `size` model units across its 24 box.
export function createLogo(service: Service, finishes: Finishes, quality: Quality, size: number) {
  const key = `${service.id}:${quality}`;
  let parts = cache.get(key);
  if (!parts) {
    parts = build(service, quality);
    cache.set(key, parts);
  }
  const group = new Group();
  for (const part of parts) {
    const mesh = new Mesh(part.geometry, finishes.brand(part.color));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  group.scale.setScalar(size / 24);
  return group;
}
