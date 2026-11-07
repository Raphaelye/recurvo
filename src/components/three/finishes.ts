import {
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector2,
  type Texture,
} from "three";

import type { RGB, ScenePalette } from "./palette";
import { brushed, grain, pageEdges, sparkle } from "./textures";

// The surface finishes every model is made of: PBR materials lit by the studio
// environment. Colours come from the scene palette (theme tokens), except the
// brand enamel of the service logos.
//
// "high" uses MeshPhysicalMaterial (clearcoat, sheen); "low" the cheaper
// MeshStandardMaterial with the same colours and roughness.

export type Quality = "high" | "low";

type PaletteColor = {
  [K in keyof ScenePalette]: ScenePalette[K] extends RGB ? K : never;
}[keyof ScenePalette];

type Spec = {
  color: PaletteColor;
  metalness: number;
  roughness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  sheen?: number;
  // Stretches highlights along the brushing (texture x).
  anisotropy?: number;
  normal?: "brushed" | "grain" | "sparkle";
  normalScale?: number;
  // Texture tiles per model unit (mm).
  repeat?: number;
  map?: "pageEdges";
  // Seen from both sides (single sheets of paper).
  double?: boolean;
};

const specs = {
  // Metals
  graphiteBrushed: {
    color: "graphite",
    metalness: 1,
    roughness: 0.24,
    anisotropy: 0.5,
    normal: "brushed",
    normalScale: 0.08,
    repeat: 1 / 60,
  },
  graphiteSatin: { color: "graphite", metalness: 1, roughness: 0.36 },
  graphitePolished: { color: "graphite", metalness: 1, roughness: 0.16 },
  // Anodised: dye in a clear layer over metal, so part diffuse, part metallic.
  accentAnodized: {
    color: "accent",
    metalness: 0.55,
    roughness: 0.34,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
    anisotropy: 0.6,
    normal: "brushed",
    normalScale: 0.08,
    repeat: 1 / 60,
  },
  accentPolished: { color: "accent", metalness: 0.6, roughness: 0.16, clearcoat: 0.5 },
  accentAltPolished: { color: "accentAlt", metalness: 0.6, roughness: 0.18, clearcoat: 0.5 },
  steelSatin: { color: "steel", metalness: 1, roughness: 0.32 },
  steelPolished: { color: "steel", metalness: 1, roughness: 0.12 },
  // Coins: graphite field, steel rim and R (see palette.ts).
  coinField: { color: "coinField", metalness: 1, roughness: 0.36 },
  coinRim: { color: "coinRim", metalness: 1, roughness: 0.12 },
  coinMark: { color: "coinMark", metalness: 1, roughness: 0.12 },
  chrome: { color: "chrome", metalness: 1, roughness: 0.05 },
  chipSatin: { color: "champagne", metalness: 1, roughness: 0.42 },
  chipPolished: { color: "champagne", metalness: 1, roughness: 0.2 },
  // Frosted card: soft white polymer with a glitter of facets under a clear coat.
  frost: {
    color: "frost",
    metalness: 0,
    roughness: 0.38,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
    normal: "sparkle",
    normalScale: 0.9,
    // About 0.35 mm facets.
    repeat: 1 / 45,
  },
  frostEdge: { color: "frost", metalness: 0, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 },
  // Paper and print
  paper: { color: "paper", metalness: 0, roughness: 0.82 },
  sheet: { color: "paper", metalness: 0, roughness: 0.82, double: true },
  pageEdge: { color: "paper", metalness: 0, roughness: 0.9, map: "pageEdges" },
  ink: { color: "ink", metalness: 0, roughness: 0.55 },
  inkGloss: { color: "ink", metalness: 0, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1 },
  inkSoft: { color: "inkSoft", metalness: 0, roughness: 0.7 },
  printAccent: { color: "accent", metalness: 0, roughness: 0.5 },
  printTint: { color: "accentTint", metalness: 0, roughness: 0.6 },
  printWhite: { color: "white", metalness: 0, roughness: 0.45 },
  // Card holder
  leather: {
    color: "leather",
    metalness: 0,
    roughness: 0.6,
    sheen: 0.25,
    normal: "grain",
    normalScale: 0.55,
    repeat: 1 / 20,
  },
  leatherEdge: { color: "leather", metalness: 0, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2 },
  stitch: { color: "accent", metalness: 0, roughness: 0.7, sheen: 0.6 },
  // Glossy plastic and enamel: confetti, the blob, badges
  glossAccent: { color: "accent", metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06 },
  glossAccentAlt: { color: "accentAlt", metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06 },
  glossAccentDeep: { color: "accentDeep", metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06 },
  glossWhite: { color: "white", metalness: 0, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06 },
  glossGraphite: { color: "graphite", metalness: 0, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06 },
} satisfies Record<string, Spec>;

export type FinishKey = keyof typeof specs;

export type Finishes = {
  get(key: FinishKey): MeshStandardMaterial;
  // Glossy enamel in a brand colour (hex), for the service logos.
  brand(hex: string): MeshStandardMaterial;
  setPalette(palette: ScenePalette): void;
  dispose(): void;
};

const normals = { brushed, grain, sparkle };

function setColor(color: Color, rgb: RGB) {
  color.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace);
}

// A shared texture with its own tiling. Clones share the pixels on the GPU.
function tiled(source: Texture, repeat: number) {
  const texture = source.clone();
  texture.repeat.set(repeat, repeat);
  return texture;
}

// environment: false when the device cannot build the reflection map. Metals
// then reflect nothing and look black, so they are made mostly diffuse instead.
export function createFinishes(
  palette: ScenePalette,
  quality: Quality,
  environment: boolean,
): Finishes {
  const made = new Map<string, MeshStandardMaterial>();
  const textures: Texture[] = [];
  let current = palette;

  const make = (spec: Spec | Omit<Spec, "color">, rgb: RGB) => {
    const physical = quality === "high";
    const metalness = environment ? spec.metalness : spec.metalness * 0.3;
    const material = physical
      ? new MeshPhysicalMaterial({
          metalness,
          roughness: spec.roughness,
          clearcoat: spec.clearcoat ?? 0,
          clearcoatRoughness: spec.clearcoatRoughness ?? 0,
          sheen: spec.sheen ?? 0,
          sheenRoughness: 0.5,
          anisotropy: spec.anisotropy ?? 0,
        })
      : new MeshStandardMaterial({ metalness, roughness: spec.roughness });
    setColor(material.color, rgb);
    if (spec.double) {
      material.side = DoubleSide;
    }
    if (spec.sheen && material instanceof MeshPhysicalMaterial) {
      setColor(material.sheenColor, current.white);
    }
    // Glitter only sparkles in reflections; without them it reads as grey noise.
    if (spec.normal && (environment || spec.normal !== "sparkle")) {
      const map = tiled(normals[spec.normal](), spec.repeat ?? 1);
      textures.push(map);
      material.normalMap = map;
      material.normalScale = new Vector2(spec.normalScale ?? 1, spec.normalScale ?? 1);
    }
    if (spec.map === "pageEdges") {
      const map = pageEdges().clone();
      // About 8 sheets per mm along the depth of the block.
      map.repeat.set(1, 0.125);
      textures.push(map);
      material.map = map;
    }
    return material;
  };

  return {
    get(key) {
      let material = made.get(key);
      if (!material) {
        const spec: Spec = specs[key];
        material = make(spec, current[spec.color]);
        made.set(key, material);
      }
      return material;
    },
    brand(hex) {
      const key = `brand:${hex}`;
      let material = made.get(key);
      if (!material) {
        const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as RGB;
        material = make(
          { metalness: 0, roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.12 },
          rgb,
        );
        // Weaker reflections, so dark enamel stays dark in a bright studio.
        if (material instanceof MeshPhysicalMaterial) {
          material.specularIntensity = 0.5;
        }
        made.set(key, material);
      }
      return material;
    },
    setPalette(next) {
      current = next;
      for (const [key, material] of made) {
        if (key in specs) {
          setColor(material.color, next[specs[key as FinishKey].color]);
        }
        if (material instanceof MeshPhysicalMaterial && material.sheen > 0) {
          setColor(material.sheenColor, next.white);
        }
      }
    },
    dispose() {
      made.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      made.clear();
    },
  };
}
