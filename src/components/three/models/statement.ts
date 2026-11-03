import { Group, Mesh, PlaneGeometry, ShapeGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import type { Finishes, Quality } from "../finishes";
import { roundedRect } from "./shapes";

// A bank statement: a sheet of paper with a gentle bend and a lifted corner,
// a printed header and rows of transactions. Rows that are subscriptions get an
// orange tint when the scan finds them. Units are mm; the front faces +z.

export const STATEMENT = { width: 64, height: 86 };

// Rows from the top, and which of them are subscriptions.
const ROW_TOP = 22;
const ROW_STEP = 6.6;
const ROWS = 10;
export const SUBSCRIPTION_ROWS = [0, 2, 3, 5, 7, 8];

export function rowY(row: number) {
  return ROW_TOP - row * ROW_STEP;
}

// The paper's shape: edges curl towards the viewer a little, and the bottom
// right corner lifts off.
function bend(x: number, y: number) {
  const across = (x / (STATEMENT.width / 2)) ** 2 * 1.6;
  const corner = Math.max(0, x / (STATEMENT.width / 2) - y / (STATEMENT.height / 2) - 1.45);
  return across + corner * corner * 22;
}

function bent(geometry: BufferGeometry, lift: number) {
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    position.setZ(i, position.getZ(i) + bend(position.getX(i), position.getY(i)) + lift);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function bar(width: number, height: number, x: number, y: number) {
  return new ShapeGeometry(roundedRect(width, height, height / 2, x, y), 3);
}

type StatementGeometry = {
  paper: BufferGeometry;
  ink: BufferGeometry;
  soft: BufferGeometry;
  // One per subscription row.
  tints: BufferGeometry[];
};

const cache = new Map<Quality, StatementGeometry>();

function geometryFor(quality: Quality): StatementGeometry {
  let geometry = cache.get(quality);
  if (!geometry) {
    const segments = quality === "high" ? 2 : 1;
    const paper = bent(new PlaneGeometry(STATEMENT.width, STATEMENT.height, 16 * segments, 22 * segments), 0);
    const half = STATEMENT.width / 2;
    // Header: bank mark, name and the statement title, then a rule.
    const ink = [
      new ShapeGeometry(roundedRect(6.4, 6.4, 1.6, -half + 7.2, 36.4), 3),
      bar(17, 2.4, -half + 21, 37.6),
      bar(16, 2.6, half - 13, 37.4),
    ];
    const soft = [bar(12, 1.6, -half + 18.5, 34), bar(11, 1.6, half - 11.5, 33.8), bar(56, 0.35, 0, 29.5)];
    for (let row = 0; row < ROWS; row += 1) {
      const y = rowY(row);
      const merchant = 14 + ((row * 7) % 11);
      soft.push(bar(6.5, 1.5, -half + 7.5, y));
      ink.push(bar(merchant, 1.8, -half + 14 + merchant / 2, y));
      ink.push(bar(8, 1.8, half - 8.5, y));
    }
    const merge = (parts: BufferGeometry[], lift: number) => {
      const merged = bent(mergeGeometries(parts), lift);
      parts.forEach((part) => part.dispose());
      return merged;
    };
    geometry = {
      paper,
      ink: merge(ink, 0.08),
      soft: merge(soft, 0.08),
      tints: SUBSCRIPTION_ROWS.map((row) => bent(bar(60, 4.6, 0, rowY(row)), 0.04)),
    };
    cache.set(quality, geometry);
  }
  return geometry;
}

// tints: one mesh per subscription row, hidden until the scan finds the row.
export function createStatement(finishes: Finishes, quality: Quality) {
  const geometry = geometryFor(quality);
  const group = new Group();
  const paper = new Mesh(geometry.paper, finishes.get("sheet"));
  paper.castShadow = true;
  paper.receiveShadow = true;
  const ink = new Mesh(geometry.ink, finishes.get("ink"));
  const soft = new Mesh(geometry.soft, finishes.get("inkSoft"));
  const tints = geometry.tints.map((tint) => new Mesh(tint, finishes.get("printTint")));
  for (const print of [ink, soft, ...tints]) {
    print.receiveShadow = true;
  }
  group.add(paper, ink, soft, ...tints);
  return { group, tints };
}
