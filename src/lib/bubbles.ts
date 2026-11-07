// Packs the Spend by Category bubbles into the chart: the biggest in the middle,
// each next one at the free spot nearest the middle that touches one or two
// already placed. Sizes are in proportion to the square root of the value, so a
// bubble's area matches its cost.

export type PackedBubble = {
  id: string;
  // The bubble's top-left corner and diameter, in pixels inside the chart.
  left: number;
  top: number;
  size: number;
};

type Circle = { id: string; x: number; y: number; r: number };

// The cheapest bubble is never smaller than this share of the biggest, so it stays tappable.
const MIN_RADIUS = 0.4;
// Space between bubbles, as a share of the biggest radius.
const GAP = 0.04;
// The biggest bubble's largest radius in pixels, as in Figma (84 across).
const MAX_RADIUS_PX = 42;
// Space kept clear inside the chart's edge, in pixels.
const PADDING = 12;

function overlaps(x: number, y: number, r: number, placed: Circle[]) {
  return placed.some((other) => Math.hypot(other.x - x, other.y - y) < other.r + r + GAP - 1e-6);
}

// The two centres where a circle of radius r touches both a and b.
function touchingBoth(a: Circle, b: Circle, r: number) {
  const da = a.r + r + GAP;
  const db = b.r + r + GAP;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy);
  if (d === 0 || d > da + db || d < Math.abs(da - db)) {
    return [];
  }
  const along = (da * da - db * db + d * d) / (2 * d);
  const across = Math.sqrt(Math.max(0, da * da - along * along));
  const x = a.x + (along * dx) / d;
  const y = a.y + (along * dy) / d;
  return [
    { x: x + (across * dy) / d, y: y - (across * dx) / d },
    { x: x - (across * dy) / d, y: y + (across * dx) / d },
  ];
}

export function packBubbles(
  items: { id: string; value: number }[],
  width: number,
  height: number,
): PackedBubble[] {
  const biggest = Math.max(0, ...items.map((item) => item.value));
  if (items.length === 0 || biggest <= 0 || width <= 0 || height <= 0) {
    return [];
  }

  // The chart is wider than it is tall, so spots to the sides count as nearer.
  const stretch = width / height;
  const placed: Circle[] = [];

  [...items]
    .sort((a, b) => b.value - a.value)
    .forEach((item) => {
      const r = Math.max(MIN_RADIUS, Math.sqrt(item.value / biggest));
      if (placed.length === 0) {
        placed.push({ id: item.id, x: 0, y: 0, r });
        return;
      }

      // Spots touching one placed bubble (12 directions) or two at once.
      const spots = placed.flatMap((a) => [
        ...Array.from({ length: 12 }, (_, step) => {
          const angle = (step * Math.PI) / 6;
          const distance = a.r + r + GAP;
          return { x: a.x + distance * Math.cos(angle), y: a.y + distance * Math.sin(angle) };
        }),
        ...placed.filter((b) => b !== a).flatMap((b) => touchingBoth(a, b, r)),
      ]);

      let best = spots[0];
      let bestScore = Infinity;
      spots.forEach((spot) => {
        if (overlaps(spot.x, spot.y, r, placed)) {
          return;
        }
        const score = (spot.x / stretch) ** 2 + spot.y ** 2;
        if (score < bestScore) {
          best = spot;
          bestScore = score;
        }
      });
      placed.push({ id: item.id, x: best.x, y: best.y, r });
    });

  // Scale the group to fit inside the padding and centre it.
  const minX = Math.min(...placed.map((circle) => circle.x - circle.r));
  const maxX = Math.max(...placed.map((circle) => circle.x + circle.r));
  const minY = Math.min(...placed.map((circle) => circle.y - circle.r));
  const maxY = Math.max(...placed.map((circle) => circle.y + circle.r));
  const scale = Math.min(
    (width - PADDING * 2) / (maxX - minX),
    (height - PADDING * 2) / (maxY - minY),
    MAX_RADIUS_PX,
  );
  const offsetX = width / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = height / 2 - ((minY + maxY) / 2) * scale;

  return placed.map((circle) => ({
    id: circle.id,
    left: offsetX + (circle.x - circle.r) * scale,
    top: offsetY + (circle.y - circle.r) * scale,
    size: circle.r * 2 * scale,
  }));
}
