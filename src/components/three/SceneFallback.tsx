import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Path,
  Polygon,
  RadialGradient,
  Rect as SvgRect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { services, type Service } from "@/data/services";

import { monthLabel } from "./models/calendar";
import type { CardFinish } from "./models/card";
import { R_MARK } from "./models/rMark";
import { rowY, SUBSCRIPTION_ROWS } from "./models/statement";
import type { Pose } from "./motion";
import { toHex, type ScenePalette } from "./palette";
import type { Rect } from "./sceneDriver";
import { celebrateLayout } from "./scenes/celebrate";
import { scanLayout } from "./scenes/scan";
import type { SceneLayout } from "./scenes/types";
import { welcomeLayout } from "./scenes/welcome";
import type { SceneMode } from "./world";

// Light version of the scenes for devices without GL or with little memory:
// the same layouts drawn flat, seen from the front, with a fade between stages
// instead of the animation. Everything inside the main group is in design
// points with y up, like the 3D scenes; models are drawn in millimetres.

const DEG = Math.PI / 180;
const FONT = "PlusJakartaSans-ExtraBold";

// A pose from the front: the tilts become a squash, depth is ignored.
function place({ at, turn = [0, 0, 0], scale }: Pose) {
  const sx = scale * Math.max(0.12, Math.abs(Math.cos(turn[1] * DEG)));
  const sy = scale * Math.max(0.12, Math.abs(Math.cos(turn[0] * DEG)));
  return `translate(${at[0]} ${at[1]}) rotate(${turn[2]}) scale(${sx} ${sy})`;
}

function polygonPath(flat: number[], scale: number) {
  let d = "";
  for (let i = 0; i < flat.length; i += 2) {
    d += `${i === 0 ? "M" : "L"}${flat[i] * scale} ${flat[i + 1] * scale}`;
  }
  return `${d}Z`;
}

const R_PATH = polygonPath(R_MARK.outline, 8.5) + polygonPath(R_MARK.hole, 8.5);

type ColorsProps = { c: ScenePalette };

function Card({ finish, c }: ColorsProps & { finish: CardFinish }) {
  const fill = { graphite: c.graphite, accent: c.accent, frost: c.frost }[finish];
  return (
    <>
      <SvgRect x={-42.8} y={-27} width={85.6} height={54} rx={3.2} fill={toHex(fill)} />
      <SvgRect x={-31.9} y={-0.2} width={11.4} height={8.8} rx={1.5} fill={toHex(c.champagne)} />
    </>
  );
}

// The brand mark on its enamel, 19.5 mm across its 24 unit box.
function Logo({ service }: { service: Service }) {
  const k = 19.5 / 24;
  if (!service.icon) {
    const [ribbon, uprights] = service.parts;
    return (
      <G transform={`scale(${k})`}>
        <SvgRect x={-5.4} y={-8.8} width={3.3} height={17.6} fill={uprights?.color} />
        <SvgRect x={2.1} y={-8.8} width={3.3} height={17.6} fill={uprights?.color} />
        <Polygon points="-5.4,8.8 -2.1,8.8 5.4,-8.8 2.1,-8.8" fill={ribbon?.color} />
      </G>
    );
  }
  // Icons are drawn y down: flip back, then centre the 24 box.
  return (
    <G transform={`scale(${k} ${-k}) translate(-12 -12)`}>
      {service.icon.map(([tag, attributes], index) => {
        const part = service.parts[index];
        if (!part) {
          return null;
        }
        const paint = part.fill
          ? { fill: part.color }
          : {
              fill: "none",
              stroke: part.color,
              strokeWidth: part.width ?? Number(attributes.strokeWidth ?? 1.5),
              strokeLinecap: "round" as const,
              strokeLinejoin: "round" as const,
            };
        if (tag === "circle") {
          return (
            <Circle
              key={index}
              cx={Number(attributes.cx)}
              cy={Number(attributes.cy)}
              r={Number(attributes.r)}
              {...paint}
            />
          );
        }
        return tag === "path" ? <Path key={index} d={String(attributes.d)} {...paint} /> : null;
      })}
    </G>
  );
}

function Coin({ service, logo, c }: ColorsProps & { service: Service; logo: boolean }) {
  return (
    <>
      <Circle r={15} fill={toHex(c.coinRim)} />
      <Circle r={12.6} fill={logo ? service.enamel : toHex(c.coinField)} />
      {logo ? <Logo service={service} /> : <Path d={R_PATH} fill={toHex(c.coinMark)} fillRule="evenodd" />}
    </>
  );
}

function Holder({ c }: ColorsProps) {
  const { cards, holder } = welcomeLayout;
  return (
    <G transform={place(holder)}>
      <SvgRect x={-49} y={-36} width={98} height={56} rx={7} fill={toHex(c.leather)} />
      {cards.map((card) => {
        const slot = card.poses[2];
        return slot ? (
          <G key={card.id} transform={`translate(${slot.at[0]} ${slot.at[1]}) rotate(${slot.turn?.[2] ?? 0})`}>
            <Card finish={card.finish} c={c} />
          </G>
        ) : null;
      })}
      <Path
        d="M-49 6 L-49 -29 Q-49 -36 -42 -36 L42 -36 Q49 -36 49 -29 L49 6 L10 6 A10 10 0 0 0 -10 6 Z"
        fill={toHex(c.leather)}
      />
      <Path
        d="M-45.6 2.6 L-45.6 -29 Q-45.6 -32.6 -42 -32.6 L42 -32.6 Q45.6 -32.6 45.6 -29 L45.6 2.6"
        fill="none"
        stroke={toHex(c.accent)}
        strokeWidth={0.7}
        strokeDasharray="1.6 1.1"
      />
    </G>
  );
}

// Text is drawn upright inside the y-up group by flipping it back.
function Label({ text, y, size, color }: { text: string; y: number; size: number; color: string }) {
  return (
    <G transform={`translate(0 ${y}) scale(1 -1)`}>
      <SvgText y={size * 0.36} textAnchor="middle" fontFamily={FONT} fontSize={size} fill={color}>
        {text}
      </SvgText>
    </G>
  );
}

function Calendar({ c, day }: ColorsProps & { day: number }) {
  return (
    <G transform={place(welcomeLayout.calendar)}>
      <SvgRect x={-35} y={-42} width={70} height={84} rx={6} fill={toHex(c.graphite)} />
      <SvgRect x={-31} y={-39} width={62} height={70} rx={4} fill={toHex(c.paper)} />
      <SvgRect x={-31} y={14} width={62} height={17} rx={4} fill={toHex(c.accent)} />
      <SvgRect x={-31} y={14} width={62} height={6} fill={toHex(c.accent)} />
      {[-18, 0, 18].map((x) => (
        <Path key={x} d={`M${x} 28.4 L${x} 36.2`} stroke={toHex(c.chrome)} strokeWidth={1.1} strokeLinecap="round" />
      ))}
      <Label text={monthLabel(new Date())} y={21} size={7} color={toHex(c.white)} />
      <Label text={String(day)} y={-11} size={30} color={toHex(c.ink)} />
      <Circle cx={19.5} cy={-29} r={6.2} fill={toHex(c.accent)} />
      <Path
        d="M16.6 -28.9 L18.6 -31 L22.6 -26.6"
        fill="none"
        stroke={toHex(c.white)}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  );
}

function Welcome({ stage, c }: ColorsProps & { stage: number }) {
  const { cards, coins, ring, firstDue, coinScale } = welcomeLayout;
  if (stage === 3) {
    const radius = 62 * ring.scale;
    const squash = Math.cos((ring.turn?.[0] ?? 0) * DEG);
    const [x, y] = ring.at;
    return (
      <>
        <Ellipse cx={x} cy={y} rx={radius} ry={radius * squash} fill="none" stroke={toHex(c.steel)} strokeWidth={2.6} />
        <Calendar c={c} day={services[firstDue].renewalDay} />
        {services.map((service, index) => {
          const angle = (90 + (index - firstDue) * 60) * DEG;
          const scale = coinScale * (index === firstDue ? 1.18 : 1);
          return (
            <G
              key={service.id}
              transform={`translate(${x + Math.cos(angle) * radius} ${y + Math.sin(angle) * radius * squash}) scale(${scale})`}
            >
              <Coin service={service} logo c={c} />
            </G>
          );
        })}
      </>
    );
  }

  // Loose cards (in beat 2 they are in the holder) and coins, back to front.
  const items = [
    ...cards.map((card) => ({
      key: card.id,
      pose: stage === 2 ? null : card.poses[stage],
      node: <Card finish={card.finish} c={c} />,
    })),
    ...services.map((service, index) => ({
      key: service.id,
      pose: coins[index][stage],
      node: <Coin service={service} logo={stage === 2} c={c} />,
    })),
  ].flatMap(({ key, pose, node }) => (pose ? [{ key, pose, node }] : []));
  items.sort((a, b) => a.pose.at[2] - b.pose.at[2]);

  return (
    <>
      {stage === 2 && <Holder c={c} />}
      {items.map(({ key, pose, node }) => (
        <G key={key} transform={place(pose)}>
          {node}
        </G>
      ))}
    </>
  );
}

// A finished scan: every subscription row found, the coins in their arc.
function Scan({ c }: ColorsProps) {
  const rows = Array.from({ length: 10 }, (_, row) => rowY(row));
  return (
    <>
      <G transform={place(scanLayout.statement)}>
        <SvgRect x={-32} y={-43} width={64} height={86} rx={1} fill={toHex(c.paper)} />
        <SvgRect x={-28} y={33.2} width={6.4} height={6.4} rx={1.6} fill={toHex(c.ink)} />
        <SvgRect x={-19.5} y={36.4} width={17} height={2.4} rx={1.2} fill={toHex(c.ink)} />
        {SUBSCRIPTION_ROWS.map((row) => (
          <SvgRect key={row} x={-30} y={rows[row] - 2.3} width={60} height={4.6} rx={2.3} fill={toHex(c.accentTint)} />
        ))}
        {rows.map((y, row) => (
          <G key={row}>
            <SvgRect x={-27.75} y={y - 0.75} width={6.5} height={1.5} rx={0.75} fill={toHex(c.inkSoft)} />
            <SvgRect x={-18} y={y - 0.9} width={14 + ((row * 7) % 11)} height={1.8} rx={0.9} fill={toHex(c.ink)} />
            <SvgRect x={19.5} y={y - 0.9} width={8} height={1.8} rx={0.9} fill={toHex(c.ink)} />
          </G>
        ))}
      </G>
      {services.map((service, index) => (
        <G key={service.id} transform={place(scanLayout.slot(index))}>
          <Coin service={service} logo c={c} />
        </G>
      ))}
    </>
  );
}

function Celebrate({ c }: ColorsProps) {
  const { cards, orbit, coinScale } = celebrateLayout;
  const squash = Math.cos(orbit.tilt * DEG);
  return (
    <>
      {cards.map(({ finish, pose }) => (
        <G key={finish} transform={place(pose)}>
          <Card finish={finish} c={c} />
        </G>
      ))}
      {services.map((service, index) => {
        const angle = Math.PI / 2 - (index / services.length) * Math.PI * 2;
        return (
          <G
            key={service.id}
            transform={`translate(${Math.cos(angle) * orbit.radius} ${Math.sin(angle) * orbit.radius * squash}) scale(${coinScale})`}
          >
            <Coin service={service} logo c={c} />
          </G>
        );
      })}
    </>
  );
}

function layoutFor(mode: SceneMode, stage: number): SceneLayout {
  if (mode === "welcome") {
    return welcomeLayout.layouts[stage] ?? welcomeLayout.layouts[1];
  }
  return mode === "scan" ? scanLayout.layout : celebrateLayout.layout;
}

type SceneFallbackProps = {
  mode: SceneMode;
  stage: number;
  palette: ScenePalette;
  // Canvas rect the composition should fit in.
  frame?: Rect;
};

export function SceneFallback({ mode, stage, palette, frame }: SceneFallbackProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const box = frame ?? { x: 0, y: 0, ...size };
  const { box: design, glow } = layoutFor(mode, stage);
  const zoom = Math.min(box.width / design[0], box.height / design[1]);
  const centreX = box.x + box.width / 2;
  const centreY = box.y + box.height / 2;
  const [glowX, glowY, glowWidth, glowHeight, strength] = glow;

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(event) => setSize(event.nativeEvent.layout)}>
      {zoom > 0 && (
        <Animated.View
          key={`${mode}-${stage}`}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={StyleSheet.absoluteFill}
        >
          <Svg width={size.width} height={size.height}>
            <Defs>
              <RadialGradient id="glow">
                <Stop offset="0" stopColor={toHex(palette.glow)} stopOpacity={palette.glowOpacity * strength} />
                <Stop offset="1" stopColor={toHex(palette.glow)} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <G transform={`translate(${centreX} ${centreY}) scale(${zoom} ${-zoom})`}>
              <Ellipse cx={glowX} cy={glowY} rx={glowWidth / 2} ry={glowHeight / 2} fill="url(#glow)" />
              {mode === "welcome" && <Welcome stage={stage} c={palette} />}
              {mode === "scan" && <Scan c={palette} />}
              {mode === "celebrate" && <Celebrate c={palette} />}
            </G>
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
