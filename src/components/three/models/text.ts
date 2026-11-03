import { ExtrudeGeometry, ShapeGeometry, type BufferGeometry } from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";

import { glyphs } from "@/data/glyphs";

// Text in Plus Jakarta Sans ExtraBold, from the outlines in data/glyphs.ts. Only
// the characters listed in scripts/generate-glyphs.js exist.

let font: Font | undefined;

export type TextOptions = {
  // Cap height, roughly: the font size in model units.
  size: number;
  // Raised this far above z = 0. 0 gives flat print.
  depth?: number;
  align?: "left" | "center";
};

export function textGeometry(text: string, { size, depth = 0, align = "left" }: TextOptions) {
  font ??= new Font(glyphs);
  const shapes = font.generateShapes(text, size);
  const geometry: BufferGeometry =
    depth > 0
      ? new ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 6 })
      : new ShapeGeometry(shapes, 6);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box && align === "center") {
    geometry.translate(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, 0);
  }
  return geometry;
}
