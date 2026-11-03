import { Shape } from "three";

// A rectangle with round corners, centred on (x, y).
export function roundedRect(width: number, height: number, radius: number, x = 0, y = 0) {
  const r = Math.min(radius, width / 2, height / 2);
  const left = x - width / 2;
  const bottom = y - height / 2;
  const shape = new Shape();
  shape.moveTo(left + r, bottom);
  shape.lineTo(left + width - r, bottom);
  shape.absarc(left + width - r, bottom + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(left + width, bottom + height - r);
  shape.absarc(left + width - r, bottom + height - r, r, 0, Math.PI / 2, false);
  shape.lineTo(left + r, bottom + height);
  shape.absarc(left + r, bottom + height - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(left, bottom + r);
  shape.absarc(left + r, bottom + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}

// A band along an arc (the contactless waves, the check mark's ring), from
// angle `from` to `to` in radians.
export function arcBand(radius: number, width: number, from: number, to: number) {
  const shape = new Shape();
  shape.absarc(0, 0, radius + width / 2, from, to, false);
  shape.absarc(0, 0, radius - width / 2, to, from, true);
  shape.closePath();
  return shape;
}
