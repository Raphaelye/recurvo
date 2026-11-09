# Onboarding flow (v3, streamlined)

Splash → Welcome (3 beats) → Create account (1/3) → email code → Upload statement (2/3) → Scanning → Review (3/3) → All set.
Side flows: Sign in and Reset password, reached from Welcome ("I already have an account") and Create account.

## Routes

| Screen | Route | Notes |
|---|---|---|
| Launch splash | `components/LaunchSplash.tsx` | Shown by the root layout on every launch, forced dark, with the 3D scene's splash stage. |
| Welcome | `app/onboarding.tsx` | Three beats on one 3D canvas that morphs between them. |
| Create account | `app/(auth)/sign-up.tsx` | Clerk sign-up, preferred currency row (`PreferredCurrencyPicker`, a scrollable list of the 55 offered currencies, the phone's own first), then the `VerifyEmail` code step in the same flow layout. |
| Sign in | `app/(auth)/sign-in.tsx` | Links to Reset password. |
| Reset password | `app/(auth)/forgot-password.tsx` | Clerk email code: send code, then code + new password. Signs the user in. |
| Upload statement | `app/setup/upload.tsx` | Bank, file, card read from the statement (manual name + last 4 if it cannot be read). |
| Scanning | `app/setup/scanning.tsx` | Real parser progress drives the % and the 3D beam. Leaving cancels. Error state with retry. |
| Review + billing sheet | `app/setup/review.tsx` | Cycle per row, renewal date (inline date chips), confirm and save. |
| All set | `app/setup/done.tsx` | Celebration scene. "Add another card or bank" goes back to Upload with a clean card. |

After sign-up, `pendingSetupFor` in `store/onboardingStore.ts` (the new Clerk user id, saved through `lib/setupRepository.ts`) makes `app/index.tsx` redirect that user to the upload step, also after a restart. Finishing or skipping setup clears it.

Statements are deleted from the phone (`lib/statementFiles.ts`) as soon as they are parsed, when the picked file is replaced or removed, when the user leaves setup, and at app start for any copy left in the document picker cache. A failed scan keeps the file so "Try again" works.

The step bar comes from `flowSteps` in `data/setup.ts`, matched to the route name by `FlowScreen`. The back button shows when there is somewhere to go back to.

Theme: only the launch splash is forced dark. The theme store starts dark, so the native splash hands over without a light frame, and the root layout releases it when the launch splash ends.

## 3D scenes (`components/three/`)

High-detail models built in code (three.js, no model files), lit like a product shot: PBR materials in a small softbox studio baked into a reflection map, one shadow-casting key light, perspective camera. Every colour is mixed from the theme tokens (`palette.ts`), except the service brand colours in `data/services.ts` (approved exception).

| Scene | Stages |
|---|---|
| `welcome` | 0 launch splash (coins and cards at the edges). 1 cards with the coins hiding between them, R side out. 2 a sweep flips each coin to its logo while the cards slot into the leather holder. 3 holder and cards squash into a blob that pops into the calendar; the coins ride the clock ring, and each one that reaches 12 flips the page to its renewal date and pops the check. |
| `scan` | The beam moves down the statement with the parser's real progress; each subscription row it passes lights up and lets its coin out into the arc. |
| `celebrate` | The coins burst out into a slow orbit round the summary circle, with two cards and glossy confetti at the Figma positions. |

| File | What it does |
|---|---|
| `SceneCanvas.tsx` | React Native wrapper: R3F `Canvas`, quality tier, SVG fallback (low-end setup screens, GL error or no GL after 8 s), Reduce Motion crossfade, pause when unfocused. Hidden from screen readers. |
| `Scene.tsx` | Hosts the world in the canvas: camera framing, render loop, theme changes, tap picking. |
| `world.ts` | Plain three.js, no React: builds a scene's studio, glow and models, frames the camera on the screen area. |
| `scenes/welcome.ts`, `scan.ts`, `celebrate.ts` | Poses per stage (design points: the 402 x 874 frame, y up, z towards the camera) and the choreography. |
| `models/` | `card`, `coin` (+ `logos` from Hugeicons, Netflix N by hand), `holder`, `calendar`, `clockRing`, `statement`, `confetti`, `blob`. Units are mm. `rMark` is the R traced from `assets/logo.png`; `text` uses `data/glyphs.ts`. |
| `finishes.ts` | The PBR materials (brushed graphite, anodised orange, frosted glitter, leather, chrome, paper, enamel). "high" is MeshPhysicalMaterial, "low" MeshStandardMaterial without shadows. |
| `studio.ts` | Reflection map and lights. Without half-float render targets, or when the map comes out black (checked once by drawing a metal tile into a 4 x 4 target and reading it back), it falls back to plain lights so metals never render black. In dev, Metro logs `[3D] welcome: studio reflections` or `lit fallback`. |
| `textures.ts` | Brushed, leather grain, glitter and page-edge textures made in code. |
| `motion.ts` | Springs (`SPRING`), idle float and easing. |
| `palette.ts`, `sceneColors.ts` | Token colours to scene colours, and the hook that reads them. |
| `effects.ts` | Glow and beam planes. |
| `sceneDriver.ts` | Mutable ref shared by the screen, gestures and the render loop (stage, progress, parallax, pick). |
| `SceneFallback.tsx` | The same layouts drawn flat in SVG. |

Animation runs in `useFrame` and reads the driver ref, so nothing sets React state per frame. Quality is "low" on devices with under 3 GB of memory or from before 2018.

**Move something:** change its pose in the scene file (`at`, `turn` in degrees, `scale`). The fallback reads the same poses.

**Add a service:** add it to `data/services.ts` with its Hugeicons icon, enamel colour, one part per icon element and its renewal day. Six coins sit every two hours on the clock ring; a different count needs new angles in `scenes/welcome.ts`.

**Text in 3D:** only the characters in `scripts/generate-glyphs.js` exist. Add characters there and run `node scripts/generate-glyphs.js`.

**Tuning:** spring feel is `SPRING` in `motion.ts`; beat stagger, sweep, blob and ring timing are the constants at the top of `scenes/welcome.ts`; beat length is `BEAT_DURATION_MS` in `data/onboarding.ts`. Tilt parallax is behind `TILT_PARALLAX` in `sceneDriver.ts` (off).

## Services to replace

| Interface | Mock now | Replace with |
|---|---|---|
| `StatementParser` (`lib/statementParser.ts`): `readCard(file, bank)` and `parse(file, bank, onProgress, signal)` | Real: the `parse-statement` Edge Function (OpenAI; card read with gpt-6-luna, scan with gpt-6.1-terra). The file only lives in the request's memory and is never logged. Scan progress is estimated. 20 requests per account per day. | Done. |
| `detectCurrency()` (`lib/currencyDetector.ts`) | Real: expo-localization time zone (African zones), then the locale's currency, else USD. | Keep. |
| `track(event, props)` (`lib/posthog.ts`) | Logs in development only. | PostHog. Never send amounts, merchant names or card digits. |
| `preferencesRepository`, `subscriptionRepository` (`lib/`) | Real: Supabase, with a copy on the phone through `lib/storage.ts`. | Done. |

## Assets

The onboarding uses no image or model files: the scenes, textures and the R on the coins are built in code. The only image is the logo (`constants/images.ts`). The old `assets/onboarding1–3.png` have been deleted.
