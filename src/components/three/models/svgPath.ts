import { Path, Shape, ShapePath } from "three";

import type { IconData } from "@/data/services";

import type { Line } from "./stroke";

// Turns Hugeicons elements (path, circle, rect) into three.js paths, so the brand
// marks can be filled or stroked in 3D. SVG's y runs down, three's runs up, so
// every y is flipped. Units stay the icon's own (a 24 x 24 box).

type Attributes = IconData[number][1];

const TOKEN = /[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g;

export function parsePath(d: string, target = new ShapePath()) {
  const tokens = d.match(TOKEN) ?? [];
  let i = 0;
  let command = "";
  let previous = "";
  // Current point, start of the subpath and last control point, in SVG space.
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let controlX = 0;
  let controlY = 0;
  const read = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) {
      command = tokens[i++];
    }
    const relative = command === command.toLowerCase();
    const ox = relative ? x : 0;
    const oy = relative ? y : 0;
    switch (command.toUpperCase()) {
      case "M":
        x = ox + read();
        y = oy + read();
        target.moveTo(x, -y);
        startX = x;
        startY = y;
        // Further pairs after a move are lines.
        command = relative ? "l" : "L";
        break;
      case "L":
        x = ox + read();
        y = oy + read();
        target.lineTo(x, -y);
        break;
      case "H":
        x = ox + read();
        target.lineTo(x, -y);
        break;
      case "V":
        y = oy + read();
        target.lineTo(x, -y);
        break;
      case "C": {
        const x1 = ox + read();
        const y1 = oy + read();
        controlX = ox + read();
        controlY = oy + read();
        x = ox + read();
        y = oy + read();
        target.bezierCurveTo(x1, -y1, controlX, -controlY, x, -y);
        break;
      }
      case "S": {
        const smooth = /[CS]/i.test(previous);
        const x1 = smooth ? 2 * x - controlX : x;
        const y1 = smooth ? 2 * y - controlY : y;
        controlX = ox + read();
        controlY = oy + read();
        x = ox + read();
        y = oy + read();
        target.bezierCurveTo(x1, -y1, controlX, -controlY, x, -y);
        break;
      }
      case "Q":
        controlX = ox + read();
        controlY = oy + read();
        x = ox + read();
        y = oy + read();
        target.quadraticCurveTo(controlX, -controlY, x, -y);
        break;
      case "T": {
        const smooth = /[QT]/i.test(previous);
        controlX = smooth ? 2 * x - controlX : x;
        controlY = smooth ? 2 * y - controlY : y;
        x = ox + read();
        y = oy + read();
        target.quadraticCurveTo(controlX, -controlY, x, -y);
        break;
      }
      case "A": {
        const rx = read();
        const ry = read();
        const rotation = read();
        const large = read();
        const sweep = read();
        const ex = ox + read();
        const ey = oy + read();
        arc(target, x, y, rx, ry, rotation, large === 1, sweep === 1, ex, ey);
        x = ex;
        y = ey;
        break;
      }
      case "Z":
        target.currentPath?.closePath();
        x = startX;
        y = startY;
        break;
      default:
        throw new Error(`Unsupported SVG path command "${command}"`);
    }
    if (!/[CSQT]/i.test(command)) {
      controlX = x;
      controlY = y;
    }
    previous = command;
  }
  return target;
}

// SVG endpoint arc to a three ellipse (SVG 1.1 spec, appendix F.6.5).
function arc(
  target: ShapePath,
  x1: number,
  y1: number,
  rx: number,
  ry: number,
  rotation: number,
  large: boolean,
  sweep: boolean,
  x2: number,
  y2: number,
) {
  if (rx === 0 || ry === 0) {
    target.lineTo(x2, -y2);
    return;
  }
  const phi = (rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const px = cos * dx + sin * dy;
  const py = -sin * dx + cos * dy;
  let rxa = Math.abs(rx);
  let rya = Math.abs(ry);
  const lambda = (px * px) / (rxa * rxa) + (py * py) / (rya * rya);
  if (lambda > 1) {
    rxa *= Math.sqrt(lambda);
    rya *= Math.sqrt(lambda);
  }
  const numerator = rxa * rxa * rya * rya - rxa * rxa * py * py - rya * rya * px * px;
  const denominator = rxa * rxa * py * py + rya * rya * px * px;
  const factor = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
  const cpx = (factor * rxa * py) / rya;
  const cpy = (-factor * rya * px) / rxa;
  const cx = cos * cpx - sin * cpy + (x1 + x2) / 2;
  const cy = sin * cpx + cos * cpy + (y1 + y2) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const start = angle(1, 0, (px - cpx) / rxa, (py - cpy) / rya);
  let delta = angle((px - cpx) / rxa, (py - cpy) / rya, (-px - cpx) / rxa, (-py - cpy) / rya);
  if (!sweep && delta > 0) {
    delta -= Math.PI * 2;
  } else if (sweep && delta < 0) {
    delta += Math.PI * 2;
  }
  // Flipping y mirrors the angles and the direction.
  target.currentPath?.absellipse(cx, -cy, rxa, rya, -start, -(start + delta), delta > 0, -phi);
}

function number(value: string | number | undefined, fallback = 0) {
  return value === undefined ? fallback : Number(value);
}

function rounded(x: number, y: number, width: number, height: number, radius: number) {
  const shape = new Shape();
  const r = Math.min(radius, width / 2, height / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

// The element as closed shapes, for a filled part.
export function elementShapes(tag: string, attributes: Attributes): Shape[] {
  switch (tag) {
    case "path":
      return parsePath(String(attributes.d)).toShapes(true);
    case "circle": {
      const shape = new Shape();
      shape.absarc(number(attributes.cx), -number(attributes.cy), number(attributes.r), 0, Math.PI * 2, false);
      return [shape];
    }
    case "rect": {
      const width = number(attributes.width);
      const height = number(attributes.height);
      const y = -number(attributes.y) - height;
      return [rounded(number(attributes.x), y, width, height, number(attributes.rx))];
    }
    default:
      return [];
  }
}

// The element as evenly spaced lines, for a stroked part.
export function elementLines(tag: string, attributes: Attributes, spacing: number): Line[] {
  const paths: { path: Path; closed: boolean }[] =
    tag === "path"
      ? parsePath(String(attributes.d)).subPaths.map((path) => ({
          path,
          closed: path.autoClose || isClosed(path),
        }))
      : elementShapes(tag, attributes).map((path) => ({ path, closed: true }));
  return paths.map(({ path, closed }) => {
    const count = Math.max(2, Math.ceil(path.getLength() / spacing));
    const points = path.getSpacedPoints(count);
    if (closed) {
      points.pop();
    }
    return { points, closed };
  });
}

function isClosed(path: Path) {
  const points = path.getPoints(1);
  return points.length > 2 && points[0].distanceTo(points[points.length - 1]) < 1e-3;
}
