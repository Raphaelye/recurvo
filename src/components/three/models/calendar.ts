import {
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  Shape,
  ShapeGeometry,
  TorusGeometry,
  type BufferGeometry,
  type Material,
} from "three";

import type { Finishes, Quality } from "../finishes";
import { roundedRect } from "./shapes";
import { polyline, strokeGeometry } from "./stroke";
import { textGeometry } from "./text";

// A ring-bound page-a-day calendar on a graphite board. The top sheet shows the
// month on an orange header, the date, and a check badge that pops in when a
// renewal is "on time". Sheets hang from the rings and flip up over them.
// Units are mm; the front faces +z.

const BOARD = { width: 70, height: 84, depth: 3 };
const PAGE = { width: 62, height: 70, block: 6, centerY: -4 };
// The binding: the top edge of the pages, where the sheets pivot.
const BINDING_Y = PAGE.centerY + PAGE.height / 2;
const RING = { radius: 5.2, tube: 0.55, z: 1.5, xs: [-18, 0, 18] };
// Where the rings pass through the sheet, below its top edge.
const HOLE_DROP = 2.6;
const HEADER = 17;

export const CALENDAR = { width: BOARD.width, height: BOARD.height };

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function monthLabel(date: Date) {
  return MONTHS[date.getMonth()];
}

type CalendarGeometry = {
  board: BufferGeometry;
  block: BufferGeometry;
  sheet: BufferGeometry;
  header: BufferGeometry;
  hole: BufferGeometry;
  ring: BufferGeometry;
  badge: BufferGeometry;
  check: BufferGeometry;
};

const cache = new Map<Quality, CalendarGeometry>();
const labels = new Map<string, BufferGeometry>();

function label(text: string, size: number) {
  const key = `${text}:${size}`;
  let geometry = labels.get(key);
  if (!geometry) {
    geometry = textGeometry(text, { size, align: "center" });
    labels.set(key, geometry);
  }
  return geometry;
}

function geometryFor(quality: Quality): CalendarGeometry {
  let geometry = cache.get(quality);
  if (!geometry) {
    const high = quality === "high";
    const board = new ExtrudeGeometry(roundedRect(BOARD.width, BOARD.height, 6), {
      depth: BOARD.depth - 1.2,
      bevelEnabled: true,
      bevelThickness: 0.6,
      bevelSize: 0.5,
      bevelSegments: high ? 3 : 2,
      curveSegments: high ? 10 : 5,
    });
    board.translate(0, 0, -BOARD.depth + 0.6);

    const block = new ExtrudeGeometry(roundedRect(PAGE.width, PAGE.height, 4, 0, PAGE.centerY), {
      depth: PAGE.block - 0.6,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.3,
      bevelSegments: 1,
      curveSegments: high ? 8 : 4,
    });
    block.translate(0, 0, 0.3);

    // A sheet hangs from the binding: its top edge is at y = 0.
    const sheet = new ShapeGeometry(roundedRect(PAGE.width, PAGE.height, 4, 0, -PAGE.height / 2), 8);
    const half = PAGE.width / 2;
    const r = 4;
    const band = new Shape();
    band.moveTo(-half, -HEADER);
    band.lineTo(half, -HEADER);
    band.lineTo(half, -r);
    band.absarc(half - r, -r, r, 0, Math.PI / 2, false);
    band.lineTo(-half + r, 0);
    band.absarc(-half + r, -r, r, Math.PI / 2, Math.PI, false);
    band.closePath();
    const header = new ShapeGeometry(band, 8);

    const ring = new TorusGeometry(RING.radius, RING.tube, high ? 12 : 8, high ? 48 : 28);
    ring.rotateY(Math.PI / 2);

    const badge = new CylinderGeometry(6.2, 6.2, 1.2, high ? 40 : 24);
    badge.rotateX(Math.PI / 2);
    badge.translate(0, 0, 0.6);
    const check = strokeGeometry([polyline([[-2.9, 0.1], [-0.9, -2.0], [3.1, 2.4]], 0.3)], 0.75, quality);
    check.translate(0, 0, 1.2);

    geometry = {
      board,
      block,
      sheet,
      header,
      hole: new CircleGeometry(1.5, 16),
      ring,
      badge,
      check,
    };
    cache.set(quality, geometry);
  }
  return geometry;
}

function mesh(geometry: BufferGeometry, material: Material | Material[], shadows = true) {
  const result = new Mesh(geometry, material);
  result.castShadow = shadows;
  result.receiveShadow = true;
  return result;
}

// One sheet: paper, the orange header with the month, the date and the badge.
// It turns round the rings, so a flip lifts it over the top and drops it
// behind the board, like a page-a-day.
export type Sheet = {
  // Pivots on the rings' centre line.
  group: Group;
  setDate(day: number, month: string): void;
  // 0 hidden, 1 shown. Scales the badge so it can pop in.
  setChecked(amount: number): void;
  // 0 hanging in front, 1 flipped over and dropped out of sight behind.
  setFlip(amount: number): void;
};

function createSheet(finishes: Finishes, geometry: CalendarGeometry): Sheet {
  const group = new Group();
  // The paper lies on the front of the block, in front of the rings' centre.
  const leaf = new Group();
  leaf.position.z = PAGE.block + 0.05 - RING.z;
  group.add(leaf);
  leaf.add(mesh(geometry.sheet, finishes.get("sheet")));

  const header = mesh(geometry.header, finishes.get("printAccent"), false);
  header.position.z = 0.03;
  leaf.add(header);
  for (const x of RING.xs) {
    const hole = mesh(geometry.hole, finishes.get("ink"), false);
    hole.position.set(x, -HOLE_DROP, 0.06);
    leaf.add(hole);
  }

  const month = mesh(label("JAN", 7), finishes.get("printWhite"), false);
  month.position.set(0, -10, 0.06);
  const date = mesh(label("1", 30), finishes.get("ink"), false);
  date.position.set(0, -42, 0.03);
  leaf.add(month, date);

  const badge = new Group();
  badge.position.set(19.5, -60, 0.03);
  badge.add(mesh(geometry.badge, finishes.get("glossAccent")), mesh(geometry.check, finishes.get("glossWhite")));
  leaf.add(badge);

  return {
    group,
    setDate(day, monthText) {
      date.geometry = label(String(day), 30);
      month.geometry = label(monthText, 7);
    },
    setChecked(amount) {
      badge.visible = amount > 0.001;
      badge.scale.setScalar(Math.max(0.001, amount));
    },
    setFlip(amount) {
      // Three quarters of the time going over the top, then dropping behind.
      const over = Math.min(1, amount / 0.75);
      const eased = over < 0.5 ? 2 * over * over : 1 - (-2 * over + 2) ** 2 / 2;
      group.rotation.x = -Math.PI * eased;
      const drop = Math.max(0, (amount - 0.75) / 0.25);
      // Upside down by then, so +y in the sheet is down on screen.
      leaf.position.y = drop * drop * (PAGE.height + 6);
      group.visible = amount < 1;
    },
  };
}

export type Calendar = {
  group: Group;
  // The sheet on top and the one under it, for the flip.
  top: Sheet;
  under: Sheet;
  // Swap the two sheets' roles after a flip.
  swap(): void;
};

export function createCalendar(finishes: Finishes, quality: Quality): Calendar {
  const geometry = geometryFor(quality);
  const group = new Group();

  const board = mesh(geometry.board, [finishes.get("graphiteSatin"), finishes.get("graphitePolished")]);
  const block = mesh(geometry.block, [finishes.get("paper"), finishes.get("pageEdge")]);
  group.add(board, block);

  const sheets = [createSheet(finishes, geometry), createSheet(finishes, geometry)];
  // The top sheet sits a hair in front of the one under it.
  const place = (sheet: Sheet, lift: number) => {
    sheet.group.position.set(0, BINDING_Y, RING.z + lift);
    sheet.setFlip(0);
  };
  place(sheets[0], 0.11);
  place(sheets[1], 0);
  group.add(sheets[0].group, sheets[1].group);

  for (const x of RING.xs) {
    const ring = mesh(geometry.ring, finishes.get("chrome"));
    ring.position.set(x, BINDING_Y, RING.z);
    group.add(ring);
  }

  const calendar: Calendar = {
    group,
    top: sheets[0],
    under: sheets[1],
    swap() {
      [calendar.top, calendar.under] = [calendar.under, calendar.top];
      place(calendar.top, 0.11);
      place(calendar.under, 0);
    },
  };
  return calendar;
}
