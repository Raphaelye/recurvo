import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  type Camera,
} from "three";

import type { RGB } from "./palette";

// Light effects drawn on camera-facing planes: the soft glow behind each
// composition and the orange scan beam. Cheaper than blur or post-processing.

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = 1.0 - smoothstep(0.0, 1.0, d);
    gl_FragColor = vec4(uColor, a * a * uOpacity);
    #include <colorspace_fragment>
  }
`;

export type RadialMaterial = ShaderMaterial & {
  uniforms: { uColor: { value: Color }; uOpacity: { value: number } };
};

export function radialMaterial(): RadialMaterial {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color() }, uOpacity: { value: 0 } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  }) as RadialMaterial;
}

function setColor(color: Color, rgb: RGB) {
  color.setRGB(rgb[0], rgb[1], rgb[2], SRGBColorSpace);
}

let plane: PlaneGeometry | undefined;
function unitPlane() {
  plane ??= new PlaneGeometry(1, 1);
  return plane;
}

// Soft accent glow far behind the composition.
export function createGlow() {
  const material = radialMaterial();
  const mesh = new Mesh(unitPlane(), material);
  mesh.renderOrder = -10;
  mesh.frustumCulled = false;
  return {
    mesh,
    // x, y, width, height in design points; opacity 0 to 1.
    set(camera: Camera, rgb: RGB, x: number, y: number, width: number, height: number, opacity: number) {
      mesh.position.set(x, y, -260);
      mesh.quaternion.copy(camera.quaternion);
      mesh.scale.set(width, height, 1);
      setColor(material.uniforms.uColor.value, rgb);
      material.uniforms.uOpacity.value = opacity;
      mesh.visible = opacity > 0.001;
    },
    dispose() {
      material.dispose();
    },
  };
}

// A thin bright line with a soft halo. Lies in its group's x/y plane along y;
// turn the group to sweep across or down.
export function createBeam() {
  const line = new MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false });
  const halo = radialMaterial();
  halo.blending = AdditiveBlending;
  const group = new Group();
  const lineMesh = new Mesh(unitPlane(), line);
  const haloMesh = new Mesh(unitPlane(), halo);
  lineMesh.renderOrder = 20;
  haloMesh.renderOrder = 19;
  group.add(haloMesh, lineMesh);
  return {
    group,
    // Sizes in the group's units: design points, or mm when on a model.
    set(rgb: RGB, length: number, opacity: number, width = 2.4, haloWidth = 90) {
      lineMesh.scale.set(width, length, 1);
      haloMesh.scale.set(haloWidth, length * 1.15, 1);
      setColor(line.color, rgb);
      setColor(halo.uniforms.uColor.value, rgb);
      line.opacity = opacity;
      halo.uniforms.uOpacity.value = 0.5 * opacity;
      group.visible = opacity > 0.01;
    },
    dispose() {
      line.dispose();
      halo.dispose();
    },
  };
}
