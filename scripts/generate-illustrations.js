// Generates src/data/illustrations.ts from the master SVGs in assets/.
// The master is drawn for dark mode. The light variant recolours it:
//   - dark fills inside a `foreground` region (phone, receipt, wifi) become --foreground
//   - dark fills inside a `clothes` region become --card
//   - other dark fills (hair, eyebrows, face details) stay as they are
//   - mid greys flip to darker greys, orange and near-white fills (eye whites) keep their colour
// Shapes that cross a region edge get a clipped copy on top of the original.
// Run: node scripts/generate-illustrations.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const masters = {
  noSub: "assets/no_sub_illustration.svg",
  noInsight: "assets/no_insight_illustration.svg",
  noInternet: "assets/no_internet_illustration.svg",
};

// Regions are polygons of [x, y] points in the SVG's own viewBox units.
const everything = [[-10, -10], [400, -10], [400, 400], [-10, 400]];

const regions = {
  noSub: {
    // Everything to the right of the phone's left edge
    foreground: [[190.6, -20], [400, -20], [400, 300], [117.7, 300]],
    // Sweater: shoulders, sleeves and torso
    clothes: [
      [43.8, 156.3], [59.4, 143.1], [76.6, 140.6], [89.1, 153.1], [103.1, 170.3],
      [150, 170.3], [153.1, 228.1], [131.3, 228.1], [109.4, 239.1], [93.8, 247.5],
      [73.4, 247.5], [59.4, 232.8], [45.3, 215.6],
    ],
  },
  noInsight: {
    foreground: [[203.6, -20], [400, -20], [400, 300], [139.6, 300]],
    clothes: [
      [50, 146.9], [60.9, 137.5], [78.1, 132.8], [103.1, 135], [125, 140.6],
      [176, 142.2], [176, 225], [131.3, 231.9], [115.6, 232.8], [103.1, 239.1],
      [81.3, 239.1], [67.2, 225], [51.6, 215.6],
    ],
  },
  noInternet: { foreground: everything },
};

// Hand fixes for the light variant, per illustration: { "#RRGGBB": "#RRGGBB" }.
// Applied to non-dark fills only.
const overrides = {
  noSub: {},
  noInsight: {},
  noInternet: {},
};

// Fills darker than this lightness are "dark" and follow the regions above.
const DARK_BELOW = 0.2;

// Fills lighter than this lightness are left as they are.
const LIGHT_ABOVE = 0.8;

// Read from the :root block (light) of the colour tokens so the hex is not duplicated.
const colors = fs.readFileSync(path.join(root, "src/theme/colors.css"), "utf8");
function lightToken(name) {
  const pattern = new RegExp(`:root\\s*\\{[^}]*--${name}:\\s*(#[0-9a-fA-F]{6})`);
  return colors.match(pattern)[1].toUpperCase();
}
const FOREGROUND = lightToken("foreground");
const CARD = lightToken("card");

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

function hslToHex({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

// Light variant of a fill that is not dark.
function flipFill(name, hex) {
  if (overrides[name][hex]) return overrides[name][hex];
  const { h, s, l } = hexToHsl(hex);
  // Orange family (accent, skin and its shadow tints) keeps its colour.
  const isOrange = h >= 0 && h <= 50 && s > 0.15;
  if (isOrange && (s > 0.3 || l > 0.15)) return hex;
  // Near-white fills (eye whites) keep their colour.
  if (l > LIGHT_ABOVE) return hex;
  return hslToHex({ h, s, l: 0.92 - 0.95 * l });
}

/* Geometry helpers for deciding which region a path is in */

function pathBox(d, tx, ty) {
  const numbers = d.match(/-?\d+\.?\d*/g).map(Number);
  const xs = numbers.filter((_, i) => i % 2 === 0).map((x) => x + tx);
  const ys = numbers.filter((_, i) => i % 2 === 1).map((y) => y + ty);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function inPolygon([px, py], polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function segmentsCross([a, b], [c, d]) {
  const side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

// "inside" if the box is fully in the polygon, "outside" if it does not touch it, else "partial".
function relation(box, polygon) {
  const corners = [[box.x0, box.y0], [box.x1, box.y0], [box.x1, box.y1], [box.x0, box.y1]];
  const insideCount = corners.filter((corner) => inPolygon(corner, polygon)).length;
  if (insideCount === 4) return "inside";
  const edges = corners.map((corner, i) => [corner, corners[(i + 1) % 4]]);
  const polygonEdges = polygon.map((point, i) => [point, polygon[(i + 1) % polygon.length]]);
  const crosses = edges.some((edge) => polygonEdges.some((other) => segmentsCross(edge, other)));
  const containsVertex = polygon.some(
    ([x, y]) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1,
  );
  return insideCount > 0 || crosses || containsVertex ? "partial" : "outside";
}

function polygonPath(polygon) {
  return `M${polygon.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
}

const PATH = /<path d="([^"]*)" fill="(#[0-9A-Fa-f]{6})" transform="translate\(([-\d.]+),([-\d.]+)\)"\s*\/>/g;

function lightVariant(name, svg) {
  const { foreground, clothes } = regions[name];
  const layers = [
    { id: `${name}-clothes`, polygon: clothes, color: CARD },
    { id: `${name}-foreground`, polygon: foreground, color: FOREGROUND },
  ].filter((layer) => layer.polygon);

  const body = svg.replace(PATH, (path, d, fill, tx, ty) => {
    const hex = fill.toUpperCase();
    if (hexToHsl(hex).l >= DARK_BELOW) {
      return path.replace(fill, flipFill(name, hex));
    }

    const box = pathBox(d, Number(tx), Number(ty));
    const hits = layers
      .map((layer) => ({ layer, relation: relation(box, layer.polygon) }))
      .filter((hit) => hit.relation !== "outside");

    // Fully inside one region: recolour in place. The last matching layer wins, as it paints last.
    const whole = hits.find((hit) => hit.relation === "inside");
    if (whole && hits.length === 1) {
      return path.replace(fill, whole.layer.color);
    }

    // No region: keep the dark fill (hair, eyebrows, face details).
    // Partly in a region: keep the original and paint a clipped copy on top.
    const copies = hits.map(
      ({ layer }) =>
        `<g clip-path="url(#${layer.id})">${path.replace(fill, layer.color)}</g>`,
    );
    return [path, ...copies].join("");
  });

  const defs = layers
    .map((layer) => `<clipPath id="${layer.id}"><path d="${polygonPath(layer.polygon)}"/></clipPath>`)
    .join("");

  return body.replace(/(<svg[^>]*>)/, `$1<defs>${defs}</defs>`);
}

const entries = Object.entries(masters).map(([name, file]) => {
  const dark = fs.readFileSync(path.join(root, file), "utf8").trim();
  return `  ${name}: {\n    dark: ${JSON.stringify(dark)},\n    light: ${JSON.stringify(lightVariant(name, dark))},\n  },`;
});

const output = `// Generated by scripts/generate-illustrations.js. Do not edit by hand.
export const illustrations = {
${entries.join("\n")}
} as const;

export type IllustrationName = keyof typeof illustrations;
`;

fs.writeFileSync(path.join(root, "src/data/illustrations.ts"), output);
console.log("Wrote src/data/illustrations.ts");
