import { useFrame, useThree } from "@react-three/fiber/native";
import { useEffect, useMemo, useState, type RefObject } from "react";
import { Vector2, type Object3D, type PerspectiveCamera } from "three";

import type { Quality } from "./finishes";
import type { ScenePalette } from "./palette";
import { now, type SceneDriver } from "./sceneDriver";
import { createWorld, type SceneMode } from "./world";

type SceneProps = {
  mode: SceneMode;
  driverRef: RefObject<SceneDriver>;
  palette: ScenePalette;
  quality: Quality;
};

function isShown(object: Object3D) {
  for (let current: Object3D | null = object; current; current = current.parent) {
    if (!current.visible) {
      return false;
    }
  }
  return true;
}

// Everything inside the canvas. The scene itself is plain three.js (world.ts);
// this hosts it, frames the camera and runs it from the render loop. Nothing
// here sets React state per frame.
export function Scene({ mode, driverRef, palette, quality }: SceneProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  // Later theme changes go through setPalette, the world is built once.
  const [initialPalette] = useState(palette);
  const world = useMemo(
    () => createWorld(mode, gl, initialPalette, quality),
    [mode, gl, initialPalette, quality],
  );

  useEffect(() => {
    if (__DEV__) {
      const lighting = world.environment ? "studio reflections" : "lit fallback (no reflection map)";
      console.log(`[3D] ${mode}: ${lighting}`);
    }
    return () => world.dispose();
  }, [mode, world]);

  // New theme: recolour, rebuild the studio reflections, and draw once more
  // (with reduce motion the canvas only draws on demand).
  useEffect(() => {
    world.setPalette(palette, gl);
    scene.environment = world.environment;
    invalidate();
    return () => {
      scene.environment = null;
    };
  }, [world, palette, gl, scene, invalidate]);

  // Timed animations (the All set burst) start when the GL scene is up, not
  // when the screen mounted, so a slow GL start does not skip them.
  useEffect(() => {
    driverRef.current.stageChangedAt = now();
  }, [driverRef]);

  // Tap: a ray from the camera through the touch point. The front-most object
  // that reacts wins.
  useEffect(() => {
    const d = driverRef.current;
    const ndc = new Vector2();
    d.pick = (x, y) => {
      const { size, camera, raycaster } = get();
      ndc.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      for (const hit of raycaster.intersectObject(world.pickables, true)) {
        if (isShown(hit.object) && world.poke(hit.object, now())) {
          invalidate();
          return true;
        }
      }
      return false;
    };
    return () => {
      d.pick = undefined;
    };
  }, [driverRef, get, invalidate, world]);

  useFrame((state, delta) => {
    const d = driverRef.current;
    const dt = Math.min(delta, 1 / 30);
    const camera = state.camera as PerspectiveCamera;
    // The frame is in window points; the world wants it in canvas points.
    const frame = d.frame && {
      x: d.frame.x - d.canvasRect.x,
      y: d.frame.y - d.canvasRect.y,
      width: d.frame.width,
      height: d.frame.height,
    };
    world.frame(camera, state.size, frame, d, dt);
    world.update(now(), dt, d, camera);
  });

  return <primitive object={world.root} />;
}
