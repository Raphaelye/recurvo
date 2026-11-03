import {
  CapsuleGeometry,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  Path,
  Shape,
  Vector2,
  type BufferGeometry,
  type Material,
} from "three";

import type { Finishes, Quality } from "../finishes";
import { rMarkGeometry } from "./rMark";
import { roundedRect } from "./shapes";

// A leather card holder: a tall back panel and a shorter front pocket with a
// thumb notch, orange stitching and the R pressed into the leather. Cards slot
// between the panels (z between -GAP and GAP) and stick out above the pocket.
// Units are mm, origin in the middle of the pocket opening's plane.

export const HOLDER = {
  width: 98,
  // Back panel from BOTTOM to BACK_TOP, front pocket from BOTTOM to FRONT_TOP.
  bottom: -36,
  backTop: 20,
  frontTop: 6,
  panel: 1.7,
  gap: 1.6,
  radius: 7,
};

const STITCH_INSET = 3.4;
const STITCH_PITCH = 2.7;

type HolderGeometry = {
  back: BufferGeometry;
  front: BufferGeometry;
  stitch: BufferGeometry;
  backStitches: Vector2[][];
  frontStitches: Vector2[][];
};

const cache = new Map<Quality, HolderGeometry>();

function panelGeometry(shape: Shape, quality: Quality) {
  const bevel = 0.55;
  const geometry = new ExtrudeGeometry(shape, {
    depth: HOLDER.panel - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.7,
    bevelSegments: quality === "high" ? 3 : 2,
    curveSegments: quality === "high" ? 12 : 6,
  });
  geometry.translate(0, 0, bevel);
  return geometry;
}

// Points every STITCH_PITCH along a path, with the direction at each.
function along(path: Path, pitch: number) {
  const count = Math.floor(path.getLength() / pitch);
  const result: Vector2[][] = [];
  for (let i = 0; i <= count; i += 1) {
    const u = i / Math.max(1, count);
    result.push([path.getPointAt(u), path.getTangentAt(u)]);
  }
  return result;
}

function geometryFor(quality: Quality): HolderGeometry {
  let geometry = cache.get(quality);
  if (!geometry) {
    const { width, bottom, backTop, frontTop, radius } = HOLDER;
    const backHeight = backTop - bottom;
    const back = panelGeometry(roundedRect(width, backHeight, radius, 0, (backTop + bottom) / 2), quality);

    // Front pocket: rounded at the bottom, square at the top, with a half-round
    // thumb notch in the middle of the top edge.
    const half = width / 2;
    const notch = 10;
    const front = new Shape();
    front.moveTo(-half, frontTop);
    front.lineTo(-half, bottom + radius);
    front.absarc(-half + radius, bottom + radius, radius, Math.PI, Math.PI * 1.5, false);
    front.lineTo(half - radius, bottom);
    front.absarc(half - radius, bottom + radius, radius, Math.PI * 1.5, Math.PI * 2, false);
    front.lineTo(half, frontTop);
    front.lineTo(notch, frontTop);
    front.absarc(0, frontTop, notch, 0, Math.PI, true);
    front.lineTo(-half, frontTop);

    // Stitch lines, inset from the edges.
    const inset = STITCH_INSET;
    const frontLine = new Path();
    frontLine.moveTo(-half + inset, frontTop - inset);
    frontLine.lineTo(-half + inset, bottom + radius);
    frontLine.absarc(-half + radius, bottom + radius, radius - inset, Math.PI, Math.PI * 1.5, false);
    frontLine.lineTo(half - radius, bottom + inset);
    frontLine.absarc(half - radius, bottom + radius, radius - inset, Math.PI * 1.5, Math.PI * 2, false);
    frontLine.lineTo(half - inset, frontTop - inset);
    // The back panel's stitching only shows above the pocket.
    const backLine = new Path();
    backLine.moveTo(-half + inset, frontTop);
    backLine.lineTo(-half + inset, backTop - radius);
    backLine.absarc(-half + radius, backTop - radius, radius - inset, Math.PI, Math.PI / 2, true);
    backLine.lineTo(half - radius, backTop - inset);
    backLine.absarc(half - radius, backTop - radius, radius - inset, Math.PI / 2, 0, true);
    backLine.lineTo(half - inset, frontTop);

    const stitch = new CapsuleGeometry(0.34, 1.5, 2, quality === "high" ? 6 : 4);
    // Capsules stand along y; lay them along x so the tangent turns them.
    stitch.rotateZ(Math.PI / 2);

    geometry = {
      back: back,
      front: panelGeometry(front, quality),
      stitch,
      backStitches: along(backLine, STITCH_PITCH),
      frontStitches: along(frontLine, STITCH_PITCH),
    };
    cache.set(quality, geometry);
  }
  return geometry;
}

function mesh(geometry: BufferGeometry, material: Material | Material[]) {
  const result = new Mesh(geometry, material);
  result.castShadow = true;
  result.receiveShadow = true;
  return result;
}

function stitches(points: Vector2[][], geometry: BufferGeometry, material: Material, z: number) {
  const instances = new InstancedMesh(geometry, material, points.length);
  const dummy = new Object3D();
  points.forEach(([point, tangent], i) => {
    dummy.position.set(point.x, point.y, z);
    dummy.rotation.set(0, 0, Math.atan2(tangent.y, tangent.x));
    dummy.updateMatrix();
    instances.setMatrixAt(i, dummy.matrix);
  });
  instances.castShadow = true;
  return instances;
}

export function createHolder(finishes: Finishes, quality: Quality) {
  const { back, front, stitch, backStitches, frontStitches } = geometryFor(quality);
  const leather = [finishes.get("leather"), finishes.get("leatherEdge")];
  const thread = finishes.get("stitch");
  const group = new Group();

  const backPanel = mesh(back, leather);
  backPanel.position.z = -HOLDER.gap - HOLDER.panel;
  const frontPanel = mesh(front, leather);
  frontPanel.position.z = HOLDER.gap;
  group.add(backPanel, frontPanel);

  group.add(stitches(backStitches, stitch, thread, -HOLDER.gap + 0.12));
  group.add(stitches(frontStitches, stitch, thread, HOLDER.gap + HOLDER.panel + 0.12));

  // The R pressed into the pocket, in the glossier edge finish.
  const mark = mesh(rMarkGeometry(15, 0.3), finishes.get("leatherEdge"));
  mark.position.set(0, -17, HOLDER.gap + HOLDER.panel);
  group.add(mark);
  return group;
}
