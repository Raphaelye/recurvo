import { Euler, Group, Matrix4, Quaternion, Vector3, type Object3D } from "three";

import { services } from "@/data/services";

import { createBeam } from "../effects";
import { createBlob } from "../models/blob";
import { createCalendar, monthLabel } from "../models/calendar";
import { createCard, type CardFinish } from "../models/card";
import { CLOCK, createClockRing } from "../models/clockRing";
import { createCoin, type Coin } from "../models/coin";
import { createHolder } from "../models/holder";
import {
  applyBody,
  approach,
  clamp01,
  createBody,
  easeInOut,
  easeOutBack,
  poseValues,
  snapBody,
  springBody,
  type Body,
  type Pose,
} from "../motion";
import type { SceneDriver } from "../sceneDriver";
import type { SceneContent, SceneContext, SceneLayout } from "./types";

// The splash (stage 0) and the three welcome beats (1 to 3): one composition
// that morphs between them.
//  1. Subscriptions hide everywhere: three cards with the coins hiding between.
//  2. Recurvo finds them: a sweep flips each coin to its logo and the cards
//     slot into the holder.
//  3. Every renewal, on time: it all folds into the calendar. The coins ride the
//     clock ring, and each one that reaches 12 turns the page to its date.
//
// Poses are in design points (the 402 x 874 frame, y up, z towards the camera)
// around the composition's centre.

const CARD = 1.7;
const COIN = 1.75;
// Delay between objects when the stage changes, so they move one by one.
const STAGGER = 0.045;
// Beat 2 sweep: starts, then crosses the composition in SWEEP seconds.
const SWEEP_START = 0.2;
const SWEEP = 1.1;
const SWEEP_FROM = -210;
// Beat 3: the holder and cards squash into a blob that pops into the
// calendar at POP. Then the ring moves one coin on every STEP seconds; each
// step flips the page to the next renewal date.
const BLOB = { grow: [0.06, 0.32], shrink: [0.4, 0.68], radius: 58 };
const POP = 0.4;
const RING_INTRO = 1.5;
const STEP = 2;
const STEP_TURN = 0.7;
const FLIP = 0.6;

type Stages<T> = [T, T, T, T];

// In the holder, a card leans out from a point on its bottom edge (holder mm).
function slot(x: number, bottom: number, lean: number, z: number): Pose {
  const angle = (lean * Math.PI) / 180;
  return {
    at: [x - 27 * Math.sin(angle), bottom + 27 * Math.cos(angle), z],
    turn: [0, 0, lean],
    scale: 1,
  };
}

const cardSpecs: { id: string; finish: CardFinish; poses: Stages<Pose | null> }[] = [
  {
    id: "card-graphite",
    finish: "graphite",
    poses: [
      { at: [150, 318, -40], turn: [-22, -32, 24], scale: 2.1 },
      { at: [-2, 34, 40], turn: [-16, 26, -14], scale: CARD },
      slot(0, -25, -1, 0.9),
      null,
    ],
  },
  {
    id: "card-accent",
    finish: "accent",
    poses: [
      { at: [-150, -318, -20], turn: [18, 30, -22], scale: 2.1 },
      { at: [84, 112, -70], turn: [14, -30, 18], scale: CARD },
      slot(2.5, -18, -6.5, 0),
      null,
    ],
  },
  {
    id: "card-frost",
    finish: "frost",
    poses: [
      null,
      { at: [-86, -86, -36], turn: [-12, 32, 9], scale: CARD },
      slot(-2.5, -12, 8, -0.9),
      null,
    ],
  },
];

// Beat 2: the found coins gather in a loose arc over the holder, at slightly
// different depths and tilts so it does not read as a row of buttons.
const arcVariation: [number, number, number][] = [
  [-8, 30, 14],
  [10, -20, -10],
  [-4, 40, 8],
  [12, 0, -14],
  [-6, 24, 10],
  [6, -10, -6],
];

function arc(index: number): Pose {
  const angle = ((154 - index * 25.6) * Math.PI) / 180;
  const [dy, dz, tilt] = arcVariation[index];
  const x = Math.cos(angle) * 176;
  return {
    at: [x, -54 + Math.sin(angle) * 176 + dy, 20 + dz],
    turn: [-6 + tilt * 0.4, -(x / 176) * 16, tilt * 0.6],
    scale: COIN * (index % 2 ? 0.94 : 1.04),
  };
}

// One entry per service, in services order. Beat 3 is the ring, see below.
const coinPoses: Stages<Pose | null>[] = [
  [
    { at: [-176, -110, -120], turn: [10, 30, 0], scale: 1.5 },
    { at: [-136, 132, 20], turn: [18, -38, 12], scale: COIN },
    arc(0),
    null,
  ],
  [null, { at: [62, -10, -20], turn: [-24, 48, 0], scale: COIN * 0.92 }, arc(1), null],
  [
    { at: [-150, 262, 40], turn: [22, 28, -8], scale: 2.9 },
    { at: [150, 4, 70], turn: [-10, -62, 8], scale: COIN * 1.05 },
    arc(2),
    null,
  ],
  [
    { at: [150, -262, 30], turn: [-26, -30, 10], scale: 2.6 },
    { at: [-30, 96, -30], turn: [28, 20, -10], scale: COIN * 0.88 },
    arc(3),
    null,
  ],
  [
    { at: [178, 40, -140], turn: [-12, -40, 6], scale: 1.6 },
    { at: [118, -136, 30], turn: [62, -18, 0], scale: COIN },
    arc(4),
    null,
  ],
  [null, { at: [-150, -22, 80], turn: [-18, 36, -6], scale: COIN * 1.1 }, arc(5), null],
];

const HOLDER_POSE: Pose = { at: [0, -74, 0], turn: [-10, 16, -3], scale: 1.95 };
const CALENDAR_POSE: Pose = { at: [0, 6, 10], turn: [-4, -12, 1.5], scale: 1.95 };
const RING_POSE: Pose = { at: [0, 0, -12], turn: [-20, 10, 0], scale: 2.4 };
// The coin at 12 when beat 3 starts (Spotify, renews on the 12th).
const FIRST_DUE = 2;

const layouts: Stages<SceneLayout> = [
  { box: [402, 874], glow: [0, 0, 560, 560, 1] },
  { box: [380, 400], glow: [0, 20, 380, 380, 0.6] },
  { box: [380, 400], glow: [0, -10, 320, 380, 0.85] },
  { box: [380, 400], glow: [0, 0, 420, 420, 1] },
];

const hidden = (at: Pose["at"]): Pose => ({ at, scale: 0.001 });

// Start time of ring step k (1, 2, ...) after beat 3 began.
const stepStart = (k: number) => RING_INTRO + (k - 1) * STEP;

// Shared with the flat fallback (SceneFallback.tsx), so both draw the same layout.
export const welcomeLayout = {
  cards: cardSpecs,
  coins: coinPoses,
  holder: HOLDER_POSE,
  calendar: CALENDAR_POSE,
  ring: RING_POSE,
  firstDue: FIRST_DUE,
  coinScale: COIN,
  layouts,
};

export function createWelcome({ finishes, quality }: SceneContext): SceneContent {
  const root = new Group();

  const cards = cardSpecs.map((spec) => {
    const object = createCard(spec.finish, finishes, quality);
    root.add(object);
    return { spec, body: createBody(object, spec.id), poked: -10 };
  });

  const coins = services.map((service, index) => {
    const coin: Coin = createCoin(service, finishes, quality);
    root.add(coin.group);
    return {
      coin,
      poses: coinPoses[index],
      body: createBody(coin.group, service.id),
      // Current half-turns to show the logo: 0 the R, 1 the logo.
      flip: 0,
      flipVelocity: 0,
      // 1 while this coin is at 12 on the ring.
      focus: 0,
      poked: -10,
    };
  });

  const holder = createBody(createHolder(finishes, quality), "holder");
  const calendar = createCalendar(finishes, quality);
  const calendarBody = createBody(calendar.group, "calendar");
  const ringTilt = new Group();
  const ringSpin = new Group();
  const clock = createClockRing(finishes, quality);
  ringSpin.add(clock.group);
  ringTilt.add(ringSpin, clock.pip);
  const ringBody = createBody(ringTilt, "ring");
  const beam = createBeam();
  const blob = createBlob(finishes.get("graphitePolished"), quality);
  root.add(holder.object, calendar.group, ringTilt, beam.group, blob.mesh);

  const month = monthLabel(new Date());
  const target: number[] = [];
  const parentMatrix = new Matrix4();
  const localMatrix = new Matrix4();
  const position = new Vector3();
  const quaternion = new Quaternion();
  const scale = new Vector3();
  const euler = new Euler();

  // Pose values for something sitting on a parent (the holder, the ring) at a
  // local pose, so it follows the parent as it moves.
  const onParent = (parent: Matrix4, local: Pose) => {
    poseValues(local, target);
    localMatrix.compose(
      position.set(target[0], target[1], target[2]),
      quaternion.setFromEuler(euler.set(target[3], target[4], target[5])),
      scale.setScalar(target[6]),
    );
    localMatrix.premultiply(parent).decompose(position, quaternion, scale);
    euler.setFromQuaternion(quaternion);
    return [position.x, position.y, position.z, euler.x, euler.y, euler.z, scale.x];
  };

  const holderMatrix = new Matrix4();
  // Ring step whose date is on the calendar's top sheet; -1 outside beat 3.
  let page = -1;
  const day = (step: number) => services[(FIRST_DUE + step) % services.length].renewalDay;

  const content: SceneContent = {
    root,
    layout: (stage) => layouts[stage] ?? layouts[1],

    update(time, dt, driver: SceneDriver, palette) {
      const since = time - driver.stageChangedAt;
      const still = driver.reduceMotion;
      // Each object moves to the new stage after its own small delay.
      const stageOf = (index: number) =>
        since < index * STAGGER ? driver.previousStage : driver.stage;
      const move = (body: Body, values: number[], idle: number) => {
        if (still) {
          snapBody(body, values);
        } else {
          springBody(body, values, dt);
        }
        applyBody(body, time, still ? 0 : idle);
      };

      // Holder, calendar and ring first: the cards and coins are placed on them.
      const stage = driver.stage;
      move(holder, poseValues(stage === 2 ? HOLDER_POSE : hidden(HOLDER_POSE.at), target), 0.6);
      // Beat 3: the holder folds away into the blob, the calendar and ring pop out of it.
      const popped = stage === 3 && (still || since > POP);
      move(calendarBody, poseValues(popped ? CALENDAR_POSE : hidden([0, 0, 0]), target), 0.5);
      move(ringBody, poseValues(popped ? RING_POSE : hidden([0, 0, -12]), target), 0.3);

      // The blob: grows with a squash and stretch, wobbles, then shrinks away
      // as the calendar pops.
      const grow = clamp01((since - BLOB.grow[0]) / (BLOB.grow[1] - BLOB.grow[0]));
      const shrink = clamp01((since - BLOB.shrink[0]) / (BLOB.shrink[1] - BLOB.shrink[0]));
      const size = stage === 3 && !still ? BLOB.radius * easeOutBack(grow, 1.8) * (1 - easeInOut(shrink)) : 0;
      blob.mesh.visible = size > 0.5;
      if (blob.mesh.visible) {
        const squash = 0.2 * Math.sin(since * 26) * Math.exp(-since * 3);
        blob.mesh.position.set(0, 0, 20);
        blob.mesh.scale.set(size * (1 + squash), size * (1 - squash), size);
        blob.wobble(time, 1 - shrink);
      }

      // Ring steps: one coin further every STEP seconds, with a little overshoot.
      const steps = stage === 3 && !still ? Math.max(0, Math.floor((since - RING_INTRO) / STEP) + 1) : 0;
      const turning = steps > 0 ? easeOutBack(clamp01((since - stepStart(steps)) / STEP_TURN), 1.2) : 1;
      ringSpin.rotation.z = steps > 0 ? -((steps - 1 + turning) * Math.PI) / 3 : 0;
      const due = (FIRST_DUE + steps) % coins.length;

      // The calendar: each step flips the top sheet over the rings, showing the
      // sheet under it with the next date; its check pops once it is on top.
      if (stage === 3) {
        if (page < 0 || steps > page + 1) {
          // Entering beat 3, or catching up after a pause: no flip.
          page = Math.max(0, steps - 1);
          calendar.top.setDate(day(page), month);
          calendar.under.setDate(day(page + 1), month);
        }
        const flip = steps > page ? clamp01((since - stepStart(steps) - 0.1) / FLIP) : 0;
        calendar.top.setFlip(flip);
        if (flip >= 1) {
          calendar.swap();
          page = steps;
          calendar.under.setDate(day(page + 1), month);
        }
        const checkAt = page === 0 ? POP + 0.35 : stepStart(page) + 0.15 + FLIP;
        calendar.top.setChecked(still ? 1 : easeOutBack(clamp01((since - checkAt) / 0.45), 2.2));
        calendar.under.setChecked(0);
      } else {
        page = -1;
      }

      // Cards in the holder follow it as it floats, at its full size even while
      // it grows in, so they slide into the pocket instead of shrinking with it.
      holderMatrix.compose(
        holder.object.position,
        quaternion.setFromEuler(holder.object.rotation),
        scale.setScalar(HOLDER_POSE.scale),
      );
      cards.forEach((card, index) => {
        const cardStage = stageOf(index);
        const pose = card.spec.poses[cardStage];
        let values: number[];
        if (cardStage === 2 && pose) {
          values = onParent(holderMatrix, pose);
        } else if (cardStage === 3) {
          values = poseValues(hidden([0, 0, 0]), target);
        } else {
          values = poseValues(pose ?? hidden(card.spec.poses[1]?.at ?? [0, 0, 0]), target);
        }
        // A tap gives the card a quick wobble.
        const wobble = Math.sin(clamp01((time - card.poked) / 0.5) * Math.PI) * 0.18;
        values[5] += wobble;
        move(card.body, values, cardStage === 2 ? 0 : 1);
      });

      ringTilt.updateMatrix();
      ringSpin.updateMatrix();
      parentMatrix.multiplyMatrices(ringTilt.matrix, ringSpin.matrix);
      coins.forEach((entry, index) => {
        const coinStage = stageOf(index + cards.length);
        let values: number[];
        let idle = 1;
        // The coin at 12 comes forward and grows a little, so it stays in front
        // of the page as it flips.
        const isDue = coinStage === 3 && index === due ? 1 : 0;
        entry.focus = still ? isDue : approach(entry.focus, isDue, 6, dt);
        if (coinStage === 3) {
          // On the ring in front of the bezel, turned against the spin to stay upright.
          const angle = Math.PI / 2 + ((index - FIRST_DUE) * Math.PI) / 3;
          values = onParent(parentMatrix, {
            at: [Math.cos(angle) * CLOCK.radius, Math.sin(angle) * CLOCK.radius, 4 + entry.focus * 30],
            turn: [0, 0, (-ringSpin.rotation.z * 180) / Math.PI],
            scale: (COIN / RING_POSE.scale) * (1 + entry.focus * 0.18),
          });
          idle = 0;
        } else {
          const pose = entry.poses[coinStage];
          values = poseValues(pose ?? hidden(entry.poses[1]?.at ?? [0, 0, 0]), target);
        }
        // Once on the ring the coins ride it exactly instead of chasing it.
        if (coinStage === 3 && since > RING_INTRO - 0.1 && !still) {
          snapBody(entry.body, values);
          applyBody(entry.body, time, 0);
        } else {
          move(entry.body, values, idle);
        }

        // Flip to the logo: in beat 2 once the sweep has passed, in beat 3 always.
        // A coin still in beat 2 only while it waits its turn to leave was found already.
        let showLogo = coinStage === 3;
        if (coinStage === 2) {
          const sweepX = SWEEP_FROM + -2 * SWEEP_FROM * easeInOut(clamp01((since - SWEEP_START) / SWEEP));
          showLogo = still || stage !== 2 || sweepX > entry.body.value[0];
        }
        const flipTarget = showLogo ? 1 : 0;
        if (still) {
          entry.flip = flipTarget;
          entry.flipVelocity = 0;
        } else {
          entry.flipVelocity += ((flipTarget - entry.flip) * 90 - entry.flipVelocity * 11) * dt;
          entry.flip += entry.flipVelocity * dt;
        }
        // While hiding they tumble a little, so the logo side shows now and then.
        const tumble = still ? 0 : (1 - clamp01(entry.flip)) * Math.sin(time * 0.6 + index * 1.9) * 0.16;
        // A tap spins the coin a full turn.
        const poke = easeInOut(clamp01((time - entry.poked) / 0.7));
        entry.coin.spin.rotation.y = (entry.flip + tumble + (poke < 1 ? poke * 2 : 0)) * Math.PI;
      });

      // Beat 2 sweep: an upright orange line crossing the composition.
      const sweep = stage === 2 && !still ? clamp01((since - SWEEP_START) / SWEEP) : 1;
      const sweepOpacity = stage === 2 && !still ? Math.sin(sweep * Math.PI) : 0;
      beam.group.position.set(SWEEP_FROM + -2 * SWEEP_FROM * easeInOut(sweep), 10, 90);
      beam.set(palette.accent, 380, sweepOpacity);
    },

    poke(object, time) {
      for (const card of cards) {
        if (isInside(object, card.body.object)) {
          card.poked = time;
          return true;
        }
      }
      for (const coin of coins) {
        if (isInside(object, coin.coin.group)) {
          coin.poked = time;
          return true;
        }
      }
      return false;
    },

    dispose() {
      beam.dispose();
      blob.dispose();
    },
  };
  return content;
}

function isInside(object: Object3D, parent: Object3D) {
  for (let current: Object3D | null = object; current; current = current.parent) {
    if (current === parent) {
      return true;
    }
  }
  return false;
}
