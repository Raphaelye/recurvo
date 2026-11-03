import {
  BackSide,
  BoxGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from "three";

import type { RGB, ScenePalette } from "./palette";

// The lighting: a small photo studio (a room with softboxes) baked into a
// reflection map, which gives the metals and gloss their highlights, plus one
// key light for the soft shadows between objects.

// The reflection map is rendered into half-float targets. Without support for
// them the scene falls back to plain lights (see createFinishes).
export function supportsEnvironment(renderer: WebGLRenderer) {
  const { extensions } = renderer;
  return extensions.has("EXT_color_buffer_half_float") || extensions.has("EXT_color_buffer_float");
}

function emissive(rgb: RGB, intensity: number) {
  const material = new MeshBasicMaterial();
  material.color.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace).multiplyScalar(intensity);
  return material;
}

// Softbox: a glowing panel looking at the middle of the room. With two
// intensities it fades from the top one to the bottom one, which draws a
// smooth gradient across flat metal.
function softbox(
  scene: Scene,
  size: [number, number],
  at: [number, number, number],
  rgb: RGB,
  intensity: number | [number, number],
) {
  const [top, bottom] = typeof intensity === "number" ? [intensity, intensity] : intensity;
  const geometry = new PlaneGeometry(size[0], size[1], 1, 8);
  const color = new Color().setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    const t = position.getY(i) / size[1] + 0.5;
    const k = bottom + (top - bottom) * t;
    colors.set([color.r * k, color.g * k, color.b * k], i * 3);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const panel = new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true }));
  panel.position.set(...at);
  panel.lookAt(0, 0, 0);
  scene.add(panel);
}

// The camera looks down -z, so surfaces facing it reflect what is behind the
// camera (+z): that is where the main softboxes are.
function studioScene(palette: ScenePalette) {
  const scene = new Scene();
  const dark = palette.scheme === "dark";
  const room = new Mesh(new BoxGeometry(30, 18, 30), emissive(palette.room, 1));
  room.material.side = BackSide;
  scene.add(room);
  const floor = new Mesh(new PlaneGeometry(30, 30), emissive(palette.floor, 1));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -8.9;
  scene.add(floor);

  const lamp = palette.lamp;
  // Key: big panel high on the left, in front.
  softbox(scene, [16, 11], [-9, 7.5, 9], lamp, dark ? 6 : 3.5);
  // Front: a panel behind the camera that fades out downwards, so faces turned
  // towards the camera get a sweep from light to dark instead of a flat grey.
  softbox(scene, [22, 14], [2, 2.5, 14.5], lamp, dark ? [1.8, 0.05] : [1.3, 0.1]);
  // Top: soft overhead panel.
  softbox(scene, [16, 14], [0, 8.9, 1], lamp, dark ? 2.4 : 1.8);
  // Sides, a little in front.
  softbox(scene, [8, 12], [-14, 1, 5], lamp, dark ? 1.4 : 1);
  softbox(scene, [8, 11], [14, -1, 7], lamp, dark ? 1.2 : 0.9);
  // Rim: a tall strip on the right, behind.
  softbox(scene, [2.4, 15], [12, 1, -6], lamp, dark ? 8 : 4.5);
  // Kicker: a strip on the left, behind.
  softbox(scene, [2, 13], [-13, 0, -3], lamp, dark ? 4 : 2.6);
  // Fill: a long low strip in front, so the lower edges are not black.
  softbox(scene, [20, 2.2], [1, -5.5, 11], lamp, dark ? 2 : 1.5);
  // A warm bounce card from the accent, low on the right.
  softbox(scene, [6, 6], [10, -4, 8], palette.accent, dark ? 1.2 : 0.7);
  return scene;
}

// The reflection map (its texture goes on scene.environment), or null.
export function createEnvironment(
  renderer: WebGLRenderer,
  palette: ScenePalette,
): WebGLRenderTarget | null {
  if (!supportsEnvironment(renderer)) {
    return null;
  }
  const scene = studioScene(palette);
  const generator = new PMREMGenerator(renderer);
  const target = generator.fromScene(scene, 0.035);
  generator.dispose();
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });
  return target;
}

export type StudioLights = {
  group: Group;
  key: DirectionalLight;
  // Fit the shadow camera around a composition of this radius (world units).
  fitShadow(radius: number): void;
  setPalette(palette: ScenePalette): void;
};

export function createLights(palette: ScenePalette, shadows: boolean, environment: boolean) {
  const group = new Group();
  const key = new DirectionalLight();
  key.position.set(-0.55, 0.8, 0.75).multiplyScalar(1000);
  key.castShadow = shadows;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.8;
  // Soft edges (PCF samples a disc this many texels wide).
  key.shadow.radius = 5;
  group.add(key);

  const rim = new DirectionalLight();
  rim.position.set(0.8, 0.35, -0.6).multiplyScalar(1000);
  group.add(rim);

  // Without the reflection map, a sky light stands in for the studio.
  const sky = environment ? null : new HemisphereLight();
  if (sky) {
    group.add(sky);
  }

  const lights: StudioLights = {
    group,
    key,
    fitShadow(radius) {
      const camera = key.shadow.camera;
      camera.left = -radius;
      camera.right = radius;
      camera.top = radius;
      camera.bottom = -radius;
      camera.near = 1000 - radius * 2;
      camera.far = 1000 + radius * 2;
      camera.updateProjectionMatrix();
    },
    setPalette(next) {
      const dark = next.scheme === "dark";
      key.color.setRGB(next.lamp[0], next.lamp[1], next.lamp[2], SRGBColorSpace);
      key.intensity = environment ? (dark ? 1.5 : 1.1) : 2.4;
      rim.color.copy(key.color);
      rim.intensity = environment ? (dark ? 0.9 : 0.5) : 1;
      if (sky) {
        sky.color.copy(key.color);
        sky.groundColor = new Color().setRGB(next.room[0], next.room[1], next.room[2], SRGBColorSpace);
        sky.intensity = 1.6;
      }
    },
  };
  lights.setPalette(palette);
  return lights;
}
