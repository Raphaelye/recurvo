import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
} from "three";

// Small tiling textures made in code, so the scenes need no image files:
// brushed metal, leather grain and glitter normal maps, and the page edges of
// the calendar block. Each is made once and shared.

const SIZE = 256;

// Same seed, same texture on every launch.
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function texture(data: Uint8Array, width: number, height: number) {
  const result = new DataTexture(data, width, height, RGBAFormat);
  result.wrapS = RepeatWrapping;
  result.wrapT = RepeatWrapping;
  result.magFilter = LinearFilter;
  result.minFilter = LinearMipmapLinearFilter;
  result.generateMipmaps = true;
  result.anisotropy = 4;
  result.needsUpdate = true;
  return result;
}

// A tiling height field to a normal map. strength scales the slopes.
function normalMap(height: Float32Array, strength: number) {
  const data = new Uint8Array(SIZE * SIZE * 4);
  const at = (x: number, y: number) => height[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const length = Math.hypot(dx, dy, 1);
      const i = (y * SIZE + x) * 4;
      data[i] = Math.round((-dx / length) * 127.5 + 127.5);
      data[i + 1] = Math.round((-dy / length) * 127.5 + 127.5);
      data[i + 2] = Math.round((1 / length) * 127.5 + 127.5);
      data[i + 3] = 255;
    }
  }
  return texture(data, SIZE, SIZE);
}

let brushedMap: DataTexture | undefined;

// Fine streaks along x, like brushed aluminium.
export function brushed() {
  if (!brushedMap) {
    const rand = random(7);
    const rows = Float32Array.from({ length: SIZE }, () => rand() * 2 - 1);
    const phases = Float32Array.from({ length: SIZE }, () => rand() * Math.PI * 2);
    const height = new Float32Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y += 1) {
      // Streaks fade in and out along their length, with whole periods so it tiles.
      const row = (rows[y] + rows[(y + 1) % SIZE] * 0.5 + rows[(y + SIZE - 1) % SIZE] * 0.5) / 2;
      for (let x = 0; x < SIZE; x += 1) {
        const along = 0.75 + 0.25 * Math.sin((x / SIZE) * Math.PI * 2 * 3 + phases[y]);
        height[y * SIZE + x] = row * along;
      }
    }
    brushedMap = normalMap(height, 0.9);
  }
  return brushedMap;
}

let grainMap: DataTexture | undefined;

// Pebbled leather: soft bumps on a jittered grid, with some fine noise.
export function grain() {
  if (!grainMap) {
    const rand = random(11);
    const cells = 28;
    const cell = SIZE / cells;
    const points = Array.from({ length: cells * cells }, () => [rand(), rand()]);
    const height = new Float32Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        const cx = Math.floor(x / cell);
        const cy = Math.floor(y / cell);
        let nearest = Infinity;
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            const gx = (cx + ox + cells) % cells;
            const gy = (cy + oy + cells) % cells;
            const [px, py] = points[gy * cells + gx];
            const dx = (cx + ox + px) * cell - x;
            const dy = (cy + oy + py) * cell - y;
            nearest = Math.min(nearest, Math.hypot(dx, dy));
          }
        }
        const bump = Math.max(0, 1 - nearest / (cell * 0.75));
        height[y * SIZE + x] = bump * bump * 1.4 + rand() * 0.08;
      }
    }
    grainMap = normalMap(height, 1.6);
  }
  return grainMap;
}

let sparkleMap: DataTexture | undefined;

// Glitter: tiny facets tilted at random, so they catch the light one by one.
export function sparkle() {
  if (!sparkleMap) {
    const rand = random(23);
    const data = new Uint8Array(SIZE * SIZE * 4);
    const facet = 2;
    for (let y = 0; y < SIZE; y += facet) {
      for (let x = 0; x < SIZE; x += facet) {
        const tilt = rand() < 0.55 ? 0.65 : 0.12;
        const nx = (rand() * 2 - 1) * tilt;
        const ny = (rand() * 2 - 1) * tilt;
        const length = Math.hypot(nx, ny, 1);
        for (let fy = 0; fy < facet; fy += 1) {
          for (let fx = 0; fx < facet; fx += 1) {
            const i = ((y + fy) * SIZE + x + fx) * 4;
            data[i] = Math.round((nx / length) * 127.5 + 127.5);
            data[i + 1] = Math.round((ny / length) * 127.5 + 127.5);
            data[i + 2] = Math.round((1 / length) * 127.5 + 127.5);
            data[i + 3] = 255;
          }
        }
      }
    }
    sparkleMap = texture(data, SIZE, SIZE);
  }
  return sparkleMap;
}

let pageMap: DataTexture | undefined;

// Page edges for the side of the calendar block: thin light and dark lines.
export function pageEdges() {
  if (!pageMap) {
    const rand = random(31);
    const height = 64;
    const data = new Uint8Array(4 * height * 4);
    for (let y = 0; y < height; y += 1) {
      const shade = y % 2 === 0 ? 255 : Math.round(200 + rand() * 30);
      for (let x = 0; x < 4; x += 1) {
        const i = (y * 4 + x) * 4;
        data[i] = shade;
        data[i + 1] = shade;
        data[i + 2] = shade;
        data[i + 3] = 255;
      }
    }
    pageMap = texture(data, 4, height);
    pageMap.colorSpace = SRGBColorSpace;
  }
  return pageMap;
}
