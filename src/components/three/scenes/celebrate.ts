import { Euler, Group, Mesh, Vector3, type Object3D } from "three";

import { services } from "@/data/services";

import type { FinishKey } from "../finishes";
import { createCard } from "../models/card";
import { createCoin } from "../models/coin";
import { confettiGeometry, type ConfettiShape } from "../models/confetti";
import { applyBody, clamp01, createBody, easeInOut, easeOutBack, poseValues, snapBody, type Pose } from "../motion";
import type { Glow, SceneContent, SceneContext } from "./types";

// All set: the coins burst out from behind the summary circle into a slow
// orbit round it, two cards float in the corners and glossy confetti settles
// where the Figma frame has its squiggles.

// Figma frame point (402 x 874) of the composition's centre.
const CENTRE: [number, number] = [201, 350];
// Degrees for the tilt and turn of the ring; one lap every `period` seconds.
const ORBIT = { radius: 166, tilt: -16, turn: 8, period: 48 };
const COIN = 1.5;
const BURST = 0.9;

function fromFigma([x, y]: [number, number]): [number, number] {
  return [x - CENTRE[0], CENTRE[1] - y];
}

const cardPoses: { finish: "graphite" | "accent"; pose: Pose }[] = [
  { finish: "graphite", pose: { at: [...fromFigma([62, 150]), -80], turn: [-18, 34, 22], scale: 1.15 } },
  { finish: "accent", pose: { at: [...fromFigma([338, 612]), -60], turn: [20, -30, -16], scale: 1.15 } },
];

type Confetti = { at: [number, number]; shape: ConfettiShape; angle: number; finish: FinishKey };

// The squiggles round the circle in the Figma frame.
const confetti: Confetti[] = [
  { at: [28, 93], shape: 2, angle: -6, finish: "glossAccentDeep" },
  { at: [128, 157], shape: 1, angle: 10, finish: "glossAccentDeep" },
  { at: [360, 332], shape: 0, angle: 70, finish: "glossAccent" },
  { at: [38, 393], shape: 2, angle: 50, finish: "glossAccentDeep" },
  { at: [75, 497], shape: 0, angle: 0, finish: "glossWhite" },
  { at: [68, 505], shape: 1, angle: -10, finish: "glossAccent" },
  { at: [135, 487], shape: 2, angle: 35, finish: "glossAccentAlt" },
  { at: [178, 497], shape: 1, angle: 95, finish: "steelPolished" },
  { at: [345, 522], shape: 2, angle: 30, finish: "glossAccentDeep" },
  { at: [368, 518], shape: 2, angle: 80, finish: "glossAccentDeep" },
  { at: [290, 540], shape: 1, angle: 5, finish: "steelPolished" },
  { at: [205, 560], shape: 0, angle: 30, finish: "steelPolished" },
  { at: [235, 580], shape: 0, angle: 60, finish: "steelPolished" },
  { at: [285, 575], shape: 2, angle: 130, finish: "glossWhite" },
  { at: [35, 595], shape: 1, angle: 80, finish: "steelPolished" },
  { at: [260, 628], shape: 1, angle: 120, finish: "glossAccent" },
  { at: [178, 652], shape: 0, angle: 10, finish: "glossAccentDeep" },
  { at: [335, 300], shape: 2, angle: 60, finish: "steelPolished" },
];

const DEG = Math.PI / 180;

const LAYOUT = { box: [402, 578] as [number, number], glow: [0, 0, 520, 520, 1] as Glow };

// Shared with the flat fallback (SceneFallback.tsx).
export const celebrateLayout = { cards: cardPoses, orbit: ORBIT, coinScale: COIN, layout: LAYOUT };

export function createCelebrate({ finishes, quality }: SceneContext): SceneContent {
  const root = new Group();

  const cards = cardPoses.map(({ finish, pose }, index) => {
    const object = createCard(finish, finishes, quality);
    root.add(object);
    return { pose, body: createBody(object, `card-${index}`) };
  });

  const coins = services.map((service) => {
    const coin = createCoin(service, finishes, quality);
    coin.spin.rotation.y = Math.PI;
    root.add(coin.group);
    return { coin, body: createBody(coin.group, service.id), poked: -10 };
  });

  const pieces = confetti.map((piece, index) => {
    const mesh = new Mesh(confettiGeometry(piece.shape, quality), finishes.get(piece.finish));
    mesh.castShadow = true;
    root.add(mesh);
    return { piece, body: createBody(mesh, `confetti-${index}`) };
  });

  const target: number[] = [];
  const point = new Vector3();
  const tilt = new Euler(ORBIT.tilt * DEG, ORBIT.turn * DEG, 0);

  return {
    root,
    layout: () => LAYOUT,

    update(time, _dt, driver) {
      const still = driver.reduceMotion;
      const since = time - driver.stageChangedAt;
      // 0 to 1 over the burst, with a little overshoot.
      const burst = (delay: number) => (still ? 1 : easeOutBack(clamp01((since - delay) / BURST), 1.3));

      cards.forEach(({ pose, body }, index) => {
        const t = burst(0.1 + index * 0.08);
        poseValues(pose, target);
        target[0] *= t;
        target[1] *= t;
        target[6] *= Math.min(1, t * 1.4) || 0.001;
        snapBody(body, target);
        applyBody(body, time, still ? 0 : t);
      });

      // Coins on a tilted ring round the circle, turning slowly.
      const turn = still ? 0 : (since / ORBIT.period) * Math.PI * 2;
      coins.forEach((entry, index) => {
        const t = burst(0.05 * index);
        const angle = Math.PI / 2 - (index / coins.length) * Math.PI * 2 - turn;
        point.set(Math.cos(angle) * ORBIT.radius * t, Math.sin(angle) * ORBIT.radius * t, 0).applyEuler(tilt);
        poseValues({ at: [point.x, point.y, point.z + 40], turn: [ORBIT.tilt, ORBIT.turn, 0], scale: COIN }, target);
        target[6] *= Math.min(1, t * 1.6) || 0.001;
        snapBody(entry.body, target);
        applyBody(entry.body, time, still ? 0 : 0.5);
        const poke = easeInOut(clamp01((time - entry.poked) / 0.7));
        entry.coin.spin.rotation.y = Math.PI * (1 + (poke < 1 ? poke * 2 : 0));
      });

      pieces.forEach(({ piece, body }, index) => {
        const t = burst(0.02 * index);
        const [x, y] = fromFigma(piece.at);
        target[0] = x * t;
        target[1] = y * t;
        target[2] = 20 + ((index * 37) % 60) - 30;
        target[3] = Math.sin(index * 1.7) * 0.5;
        target[4] = Math.cos(index * 2.3) * 0.6;
        target[5] = (piece.angle + (1 - t) * 180) * DEG;
        target[6] = 1.2 * Math.min(1, t * 1.5) || 0.001;
        snapBody(body, target);
        applyBody(body, time, still ? 0 : t);
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

    dispose() {},
  };
}
