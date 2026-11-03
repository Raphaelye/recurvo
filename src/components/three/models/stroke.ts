import { CatmullRomCurve3, SphereGeometry, TubeGeometry, Vector2, Vector3, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import type { Quality } from "../finishes";

// Round raised lines (logo strokes, the check mark): a tube through evenly
// spaced points, with round caps on open ends. Standing on z = 0, partly sunk.

export type Line = { points: Vector2[]; closed: boolean };

export function strokeGeometry(lines: Line[], radius: number, quality: Quality): BufferGeometry {
  const radial = quality === "high" ? 10 : 6;
  const pieces: BufferGeometry[] = [];
  for (const line of lines) {
    if (line.points.length < 2) {
      continue;
    }
    const points = line.points.map((point) => new Vector3(point.x, point.y, 0));
    const curve = new CatmullRomCurve3(points, line.closed, "centripetal");
    pieces.push(new TubeGeometry(curve, points.length * 2, radius, radial, line.closed));
    if (!line.closed) {
      for (const end of [points[0], points[points.length - 1]]) {
        const cap = new SphereGeometry(radius, radial, Math.ceil(radial / 2));
        cap.translate(end.x, end.y, 0);
        pieces.push(cap);
      }
    }
  }
  const geometry = mergeGeometries(pieces);
  pieces.forEach((piece) => piece.dispose());
  geometry.translate(0, 0, radius * 0.25);
  return geometry;
}

// Evenly spaced points along a polyline, so the tube keeps its corners tight.
export function polyline(corners: [number, number][], spacing: number): Line {
  const points: Vector2[] = [];
  for (let i = 0; i < corners.length - 1; i += 1) {
    const a = new Vector2(...corners[i]);
    const b = new Vector2(...corners[i + 1]);
    const steps = Math.max(1, Math.ceil(a.distanceTo(b) / spacing));
    for (let s = 0; s < steps; s += 1) {
      points.push(a.clone().lerp(b, s / steps));
    }
  }
  points.push(new Vector2(...corners[corners.length - 1]));
  return { points, closed: false };
}
