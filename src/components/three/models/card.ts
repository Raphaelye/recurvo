import {
  ExtrudeGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  ShapeGeometry,
  type BufferGeometry,
  type Material,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import type { FinishKey, Finishes, Quality } from "../finishes";
import { rMarkGeometry } from "./rMark";
import { arcBand, roundedRect } from "./shapes";
import { textGeometry } from "./text";

// A payment card (ISO ID-1 size, mm) with a beveled edge, an EMV chip, the
// contactless waves, the wordmark and the Recurvo R. The front faces +z.

export const CARD = { width: 85.6, height: 54, thickness: 0.9, radius: 3.2 };

export type CardFinish = "graphite" | "accent" | "frost";

const looks: Record<CardFinish, { face: FinishKey; edge: FinishKey; print: FinishKey; mark: FinishKey }> = {
  graphite: { face: "graphiteBrushed", edge: "graphitePolished", print: "steelSatin", mark: "steelSatin" },
  accent: { face: "accentAnodized", edge: "accentPolished", print: "printWhite", mark: "accentAltPolished" },
  frost: { face: "frost", edge: "frostEdge", print: "ink", mark: "accentPolished" },
};

// Print and parts sit this far off the face so they never flicker into it.
const LIFT = 0.03;

type CardGeometry = {
  body: BufferGeometry;
  plate: BufferGeometry;
  pads: BufferGeometry;
  waves: BufferGeometry;
  wordmark: BufferGeometry;
  stripe: BufferGeometry;
};

const cache = new Map<Quality, CardGeometry>();

function geometryFor(quality: Quality): CardGeometry {
  let geometry = cache.get(quality);
  if (!geometry) {
    const { width, height, thickness, radius } = CARD;
    const bevel = 0.22;
    const body = new ExtrudeGeometry(roundedRect(width - bevel * 2, height - bevel * 2, radius - bevel), {
      depth: thickness - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: quality === "high" ? 3 : 2,
      curveSegments: quality === "high" ? 10 : 5,
    });
    body.translate(0, 0, -(thickness - bevel * 2) / 2);

    // EMV chip: a plate with a 3 x 3 grid of contact pads.
    const plate = new ExtrudeGeometry(roundedRect(11.4, 8.8, 1.5), {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.05,
      bevelSegments: 1,
      curveSegments: 6,
    });
    const rows: [number, number][] = [[1.55, 3.95], [-1.15, 1.15], [-3.95, -1.55]];
    const columns: [number, number][] = [[-5.25, -1.95], [-1.6, 1.6], [1.95, 5.25]];
    const pads = mergeGeometries(
      rows.flatMap(([bottom, top]) =>
        columns.map(([left, right]) => {
          const shape = roundedRect(right - left, top - bottom, 0.45, (left + right) / 2, (bottom + top) / 2);
          const pad = new ShapeGeometry(shape, 3);
          pad.translate(0, 0, 0.11);
          return pad;
        }),
      ),
    );

    // Contactless waves, opening to the right.
    const waves = mergeGeometries(
      [1.3, 2.45, 3.6, 4.75].map((r) => new ShapeGeometry(arcBand(r, 0.55, -0.72, 0.72), 10)),
    );

    const wordmark = textGeometry("Recurvo", { size: 4.4 });
    const stripe = new PlaneGeometry(width - 0.6, 9.5);
    geometry = { body, plate, pads, waves, wordmark, stripe };
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

export function createCard(finish: CardFinish, finishes: Finishes, quality: Quality) {
  const { body, plate, pads, waves, wordmark, stripe } = geometryFor(quality);
  const look = looks[finish];
  const front = CARD.thickness / 2;
  const group = new Group();

  group.add(mesh(body, [finishes.get(look.face), finishes.get(look.edge)]));

  const chip = new Group();
  chip.position.set(-26.2, 4.2, front);
  chip.add(mesh(plate, finishes.get("chipSatin")), mesh(pads, finishes.get("chipPolished")));
  group.add(chip);

  const print = finishes.get(look.print);
  const contactless = mesh(waves, print);
  contactless.position.set(-13.6, 4.2, front + LIFT);
  const name = mesh(wordmark, print);
  name.position.set(-37.4, 16.4, front + LIFT);
  group.add(contactless, name);

  const mark = mesh(rMarkGeometry(10, 0.24), finishes.get(look.mark));
  mark.position.set(34.2, -17.6, front);
  group.add(mark);

  // Back: the magnetic stripe.
  const magnetic = mesh(stripe, finishes.get("inkGloss"));
  magnetic.rotation.y = Math.PI;
  magnetic.position.set(0, 14.5, -front - LIFT);
  group.add(magnetic);

  return group;
}
