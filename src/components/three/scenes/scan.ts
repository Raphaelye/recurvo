import { Group, Matrix4, Vector3, type Object3D } from "three";

import { services } from "@/data/services";

import { createBeam } from "../effects";
import { createCoin } from "../models/coin";
import { createStatement, rowY, SUBSCRIPTION_ROWS } from "../models/statement";
import { applyBody, clamp01, createBody, easeInOut, poseValues, snapBody, springBody, type Pose } from "../motion";
import type { Glow, SceneContent, SceneContext } from "./types";

// Scanning: the statement is read top to bottom. The beam follows the parser's
// real progress, and each subscription row it passes lights up and lets its
// coin out, which flips to its logo and joins the arc on the right.

const STATEMENT_POSE: Pose = { at: [-46, -6, 0], turn: [-18, 26, -5], scale: 2.5 };
const COIN = 1.4;
// The beam's travel on the statement (mm, from its top row to below the last).
const BEAM_TOP = 26;
const BEAM_BOTTOM = -40;

// Found coins gather in an arc round the statement's right edge.
function slot(index: number): Pose {
  const angle = ((48 - index * 19) * Math.PI) / 180;
  return {
    at: [-40 + Math.cos(angle) * 158, Math.sin(angle) * 150, 30],
    turn: [-4, -16, 0],
    scale: COIN,
  };
}

// Progress at which the beam reaches a statement row.
function reached(y: number) {
  return (BEAM_TOP - y) / (BEAM_TOP - BEAM_BOTTOM);
}

const LAYOUT = { box: [402, 268] as [number, number], glow: [-40, 0, 200, 300, 0.9] as Glow };

// Shared with the flat fallback (SceneFallback.tsx).
export const scanLayout = { statement: STATEMENT_POSE, slot, layout: LAYOUT };

export function createScan({ finishes, quality }: SceneContext): SceneContent {
  const root = new Group();
  const statement = createStatement(finishes, quality);
  const paper = createBody(statement.group, "statement");
  const beam = createBeam();
  statement.group.add(beam.group);
  root.add(statement.group);

  const coins = services.map((service, index) => {
    const coin = createCoin(service, finishes, quality);
    root.add(coin.group);
    const row = SUBSCRIPTION_ROWS[index % SUBSCRIPTION_ROWS.length];
    return { coin, body: createBody(coin.group, service.id), row, at: reached(rowY(row)), found: false, flip: 0, poked: -10 };
  });

  const target: number[] = [];
  const origin = new Vector3();
  const matrix = new Matrix4();

  return {
    root,
    layout: () => LAYOUT,

    update(time, dt, driver, palette) {
      const still = driver.reduceMotion;
      const progress = driver.progress;
      if (still) {
        snapBody(paper, poseValues(STATEMENT_POSE, target));
      } else {
        springBody(paper, poseValues(STATEMENT_POSE, target), dt);
      }
      applyBody(paper, time, still ? 0 : 0.5);
      statement.group.updateMatrix();
      matrix.copy(statement.group.matrix);

      // The beam lies across the sheet and moves down it with the progress.
      const y = BEAM_TOP + (BEAM_BOTTOM - BEAM_TOP) * progress;
      beam.group.position.set(0, y, 1.2);
      beam.group.rotation.z = Math.PI / 2;
      beam.set(palette.accent, 72, still ? 0 : 1 - clamp01((progress - 0.97) / 0.03), 0.9, 26);

      SUBSCRIPTION_ROWS.forEach((row, index) => {
        statement.tints[index].visible = progress >= reached(rowY(row));
      });

      coins.forEach((entry, index) => {
        const found = progress >= entry.at;
        if (found && !entry.found) {
          // Out of the paper at its row, small, then off to the arc.
          origin.set(0, rowY(entry.row), 2).applyMatrix4(matrix);
          snapBody(entry.body, [origin.x, origin.y, origin.z, 0, 0, 0, 0.25]);
        }
        entry.found = found;
        const values = found ? poseValues(slot(index), target) : [0, 0, -400, 0, 0, 0, 0.001];
        if (still || !found) {
          snapBody(entry.body, values);
        } else {
          springBody(entry.body, values, dt);
        }
        applyBody(entry.body, time, still ? 0 : 0.6);
        // Half a turn to the logo once out, plus a full turn when tapped.
        entry.flip = still ? (found ? 1 : 0) : entry.flip + ((found ? 1 : 0) - entry.flip) * (1 - Math.exp(-8 * dt));
        const poke = easeInOut(clamp01((time - entry.poked) / 0.7));
        entry.coin.spin.rotation.y = (entry.flip + (poke < 1 ? poke * 2 : 0)) * Math.PI;
      });
    },

    poke(object: Object3D, time) {
      for (const entry of coins) {
        for (let current: Object3D | null = object; current; current = current.parent) {
          if (current === entry.coin.group) {
            entry.poked = time;
            return true;
          }
        }
      }
      return false;
    },

    dispose() {
      beam.dispose();
    },
  };
}
