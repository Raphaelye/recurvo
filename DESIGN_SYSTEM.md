# Recurvo design system

Source of truth: the Figma file **Recurvo** (variable collections `Colors` for dark and `Colors Light` for light).
Target stack: Expo, React Native, TypeScript (strict), **NativeWind 5 (rc) on Tailwind CSS 4**. Check `package.json` for the installed versions.
Tokens live in **CSS files in `src/theme/`** (`colors.css`, `typography.css`, `layout.css`), imported by `src/global.css`, which also holds the reusable class utilities. There is no `tailwind.config.js`.
Do not hard-code colours, fonts or radii in components.

Items marked **(verify)** depend on NativeWind 5 rc behaviour. Confirm them against the installed version when the token layer is built.

## 1. Principles
1. **Minimal.** Few elements per screen, one primary action, generous spacing.
2. **Accent only.** Orange appears on primary buttons, links, selected radios, toggles, progress and small highlights. Never as a large surface.
3. **Borderless cards.** Depth comes from the three surface levels, not outlines or shadows. Borders are for icon buttons, error and focus states.
4. **Tokens only.** If a colour is not in the token table, ask before adding it.
5. **One master per illustration.** Each illustration has one master SVG. Dark and light variants are generated from it (see section 8).
6. **Dark first.** Splash and onboarding are always dark. Everything after sign-in follows the user's theme preference.

## 2. Colour tokens

| Figma name | Tailwind class | Dark | Light | Use |
|---|---|---|---|---|
| Main BG | `bg-main` | `#000000` | `#e5e5e5` | Screen background |
| Card BG | `bg-card` | `#0d0d0d` | `#f2f2f2` | Cards, bottom sheets, list rows, settings groups |
| Foreground BG | `bg-foreground` | `#1a1a1a` | `#ffffff` | Inputs, chips, icon circles, selected rows (sits on top of cards) |
| Accent | `bg-accent` | `#e37531` | `#e0691f` | Primary buttons, selected radios, toggles, progress. Never large surfaces |
| Accent Text | `text-accent-text` | `#e37531` | `#a84a0a` | **New.** Orange text and links. Darker in light mode for legibility |
| Text | `text-content` | `#f2f2f2` | `#0d0d0d` | Primary text and icons |
| Text Muted | `text-muted` | `#b2b2b2` | `#4d4d4d` | Secondary text: subtitles, captions, labels |
| Text Soft | `text-soft` | `#999999` | `#666666` | Tertiary text: descriptions on cards, notices |
| Destructive | `bg-destructive / text-destructive` | `#ed0707` | `#da1010` | Delete, cancel, errors, warnings |
| Border | `border-line` | `#333333` | `#f7f7f7` | 1px borders on icon buttons and inputs in error/focus, dividers |
| Neutral | `bg-neutral / border-neutral` | `#808080` | `#808080` | Placeholders, inactive radio rings, disabled shapes |
| On Accent | `text-on-accent` | `#ffffff` | `#ffffff` | Text and icons on Accent or Destructive surfaces, and inactive tab icons. Stays white |
| Tab Bar | `bg-tab-bar` | `#5d5b5b` | `#5d5b5b` | Floating tab bar pill. Same in both themes |

`Accent Alt` (`#eb9f6f`) is not used by any screen, so it is not part of the token set. Add it back when a screen needs it.

**Surface layering.** Surfaces get lighter as they stack: `main` (screen) then `card` (cards, sheets, rows) then `foreground` (inputs, chips, icon circles, selected rows).
An element placed on a `foreground` surface that needs its own fill uses `card` as an inset.

**Text hierarchy.** `content` (titles, key values) then `muted` (subtitles, labels) then `soft` (descriptions on cards) then `neutral` (placeholders, inactive).
Note the names: `muted` is more prominent than `soft` in both themes. Keep the names as they are in Figma.

**Opacity.** Do not use Tailwind's alpha syntax on tokens (`bg-content/30`). With react-native-css 3.1.0-rc.0 it renders nothing on native. Translucent states have their own tokens in `src/theme/colors.css`: `segment-selected` (content 30%), `toggle-off` (content 20%), `grabber` (content 25%), `progress-track` (content 15%), `overlay` (black 55%).

**Contrast (WCAG).** Computed from the hex values above.

| Pair | Dark | Light |
|---|---|---|
| `content` on `main` | 18.8:1 | 15.4:1 |
| `content` on `card` | 17.4:1 | 17.4:1 |
| `muted` on `card` | 9.2:1 | 7.6:1 |
| `soft` on `card` | 6.8:1 | 5.1:1 |
| `soft` on `foreground` (chips) | 6.1:1 | 5.7:1 |
| `accent-text` on `main` | 6.9:1 | 4.6:1 |
| `accent-text` on `card` | 6.3:1 | 5.1:1 |
| `on-accent` on `accent` (button labels) | 3.1:1 | 3.4:1 |
| `on-accent` on `destructive` | 4.5:1 | 5.2:1 |
| `on-accent` on `tab-bar` (inactive tab icons) | 6.8:1 | 6.8:1 |
| `destructive` on `card` | 4.3:1 | 4.6:1 |
| `neutral` on `foreground` (placeholders) | 4.4:1 | 4.0:1 |

Rules:
- Body text must be `content`, `muted` or `soft`.
- Orange text always uses `text-accent-text`, never `text-accent`.
- Button labels are **bold and at least 19px**. This qualifies as WCAG large text (14pt bold is about 18.7px), which needs 3:1.

**Known exceptions (accepted, revisit if accessibility becomes a priority):**
- Light `Border` (`#f7f7f7`) is 1.04:1 on cards. Light-mode dividers and icon-button borders are effectively invisible. In light mode, rely on row padding for separation.
- `destructive` error text (12px) is 4.3:1 on `card` in dark and 3.8:1 on `foreground`.
- `neutral` placeholders are 3.5:1 on `card` and 4.0:1 on `foreground` in light mode, and 4.4:1 on `foreground` in dark mode.
- `on-accent` on `accent` is only 3.1:1 in dark mode. It passes as large text, with no margin.

## 3. Theming behaviour
- Preference in Settings > Appearance: **System** (default), **Light**, **Dark**. Persisted through the storage layer in `lib/`, never by calling AsyncStorage directly.
- One theme hook in `hooks/` (`useTheme`) returns the resolved scheme and the preference setter. Screens never read the system colour scheme directly.
- **Always dark:** splash screen and the three onboarding screens. Use light status-bar icons. The native launch screen must also be dark in both system modes so light-mode users never see a white flash.
- **Follows preference:** Sign-up, Sign-in, Forgot Password and the rest of the app.
- Switching from the dark onboarding to a light auth screen should cross-fade (about 200 ms).
- `global.css` defines the variables for light (`:root`) and dark. **(verify)** how NativeWind 5 switches them (system scheme, manual override, or a forced subtree). Forcing a subtree dark needs a style-prop fallback such as `vars()`. That is an inline style, which AGENTS.md normally forbids. It is the one approved exception, and it stays inside the onboarding wrapper.

## 4. Typography
One family: **Plus Jakarta Sans**, using only the `.ttf` files already in `assets/fonts`, loaded once at app start (`expo-font`). Those files are Light, Regular, Medium, SemiBold, Bold and ExtraBold. The sizes below use Regular to ExtraBold. Light is available but nothing uses it yet.
No other font family is used anywhere, and no font packages are installed.

There are no text-size tokens. Style each `Text` individually with the size, line height, weight and colour from the design, for example `text-[15px] leading-[22px] font-medium text-content`. The common sizes are:

| Classes | Weight | Use |
|---|---|---|
| `text-[44px] leading-[52px]` | Medium | Onboarding titles |
| `text-[14px] leading-[20px]` | Regular | Onboarding descriptions |
| `text-[34px] leading-[40px]` | ExtraBold (`font-extrabold`) | Hero totals such as total monthly spend |
| `text-[30px] leading-[38px]` | Bold | Auth titles |
| `text-[26px] leading-[32px]` | Bold | Setup and flow titles |
| `text-[22px] leading-[28px]` | Bold | Page and sheet headers |
| `text-[16px] leading-[24px]` | Regular / SemiBold | Input text, row titles (SemiBold) |
| `text-[15px] leading-[22px]` | Regular | Subtitles, paragraphs, links (SemiBold) |
| `text-[13px] leading-[19px]` | Regular / Medium | Descriptions, field labels (Medium) |
| `text-[12px] leading-[16px]` | Regular / Medium | Captions, meta, pills |
| `text-[19px] leading-[24px]` | Bold | Button labels |

Section labels in Settings: SemiBold 12, uppercase, `tracking-[0.8px]`, `text-muted`.

React Native needs one font-family name per weight (for example `PlusJakartaSans-Bold`), so the weight classes (`font-normal` to `font-extrabold`) map to family names in `src/theme/typography.css`. **(verify)** the mapping works with NativeWind 5.

Plus Jakarta Sans is wider than Inter, so check truncation in buttons, chips, tab labels and list rows.

## 5. Spacing and layout
- 4px base scale. Tailwind 4 generates spacing from `--spacing: 4px`, so `p-4` = 16px and `p-3.5` = 14px. The values actually used: 4, 8, 12, 14, 16, 20, 24, 28.
- Screen horizontal padding: **20px** (`px-screen`), **24px** on auth and form screens (`px-screen-lg`). Both are `--spacing-*` tokens in `@theme`.
- Top: safe-area inset plus about 20px. Bottom: safe-area inset plus 16px for the primary button.
- Gaps: 8 between a label and its field, 12 between list rows and cards in a list, 16 to 28 between sections.
- Primary action sits at the bottom of the screen on flow screens (pinned), directly under the form on auth screens.

## 6. Radius and elevation
`--radius-*` tokens in `@theme`. They replace Tailwind's default values.

| Token | px | Use |
|---|---|---|
| `rounded-full` | 9999 | Buttons, chips, avatars, toggles, progress steps |
| `rounded-xl` | 20 | Cards, option rows |
| `rounded-lg` | 16 | List rows, notices |
| `rounded-md` | 14 | Inputs |
| `rounded-sm` | 10 | Small tiles |
| `rounded-sheet` / `rounded-t-sheet` | 30 | Bottom sheet top corners, tab bar pill |

Elevation: none by default. The only shadow is `shadow-card` (`0 4px 30px`, black 50%) on the hero total card.

## 7. Icons
**Hugeicons** only. Do not mix in other icon sets.
Packages (installed): `@hugeicons/react-native` and `@hugeicons/core-free-icons`. Use the **free** set only. Hugeicons needs `react-native-svg`, which is also used for the illustrations (section 8).
Stroke width stays at the Hugeicons default (1.5). Do not override it.
Sizes: 14, 16, 18, 20, 24. Colour: `content` when active, `muted` for secondary, `neutral` for inactive or placeholder.
Icon circles: 32, 36, 40, 44 or 56px, `bg-foreground`, icon at half the circle size, `content` colour (orange only for a success check).
**(verify)** how icon colours come from tokens (`className` on the icon, or reading a CSS variable with a hook). Never hard-code hex.

## 8. Logo and illustrations
- Logo: the Recurvo "R" mark, `assets/logo.png`, exported `@1x/@2x/@3x` from Figma (used at 40px on auth, 112px on splash). Import it only through `constants/images.ts`.
- Illustrations: `no_sub`, `no_insight`, `no_internet`. The master SVGs in `assets/` are auto-traced and drawn for dark mode.
  They have 11 to 96 near-gray fills and no named colour slots, so a runtime colours prop cannot theme them.
- Approach:
  1. A node script (`scripts/generate-illustrations.js`) reads each master SVG.
  2. It writes `data/illustrations.ts` with a `dark` string (the master as-is) and a `light` string.
  3. The light string flips the lightness of neutral grays into the light surface range. It keeps the orange (`#E37531`) and any other chromatic fills.
  4. An `Illustration` component picks the variant from `useTheme` and renders it with `SvgXml` from `react-native-svg`.
  5. Re-run the script whenever a master SVG changes.
- Do not hand-maintain a second light image. Edit the master and regenerate.
- Review each light variant by eye before shipping. The auto-flip is a starting point, and a hand fix goes into the script as an override, not into the output.
- Bundle size: the masters are about 16 to 79 KB each, so the generated file holds about 330 KB of strings. Acceptable for three illustrations. If it grows, simplify the paths in the master.
- Longer term, re-exported layered SVGs with named theme slots would replace the flip with a simple colours prop.

## 9. Components
All sizes at the 402 x 874 design frame. Use `min-h-*` for text-bearing containers so Dynamic Type can grow them.

| Component | Spec |
|---|---|
| **Button (primary)** | Min height 55, full width, `rounded-full`, `bg-accent`, label Bold `text-[19px] leading-[24px] text-on-accent`. States below. |
| **Button (destructive)** | Same as primary with `bg-destructive`. Delete account only. |
| **Button (secondary)** | Same size, `bg-foreground`, label `text-content`. |
| **Text link** | SemiBold 15, `text-accent-text` (use `text-soft` for neutral actions like "Skip"). Visual height 24, centred, hit area 44 via `hitSlop`. |
| **Input** | Label above (Medium 13, `muted`, 8 gap). Field min height 54, `rounded-md`, `bg-foreground`, padding 16, text 16 `content`, placeholder `neutral`. Password field has a show/hide eye icon (`neutral`, 20). Error: 1px `destructive` border and a 12px `destructive` message below. |
| **Card** | `bg-card`, `rounded-xl`, padding 16, no border. |
| **List row** | `rounded-lg`, padding 12 to 16, gap 12, optional 44px logo circle (initials fallback, 1.5px `neutral` ring), title SemiBold 16, subtitle 12 `soft`. Selected row: `bg-foreground`. |
| **Chip** | Pill, padding 14 x 7, `bg-foreground`, Medium 13 `soft`. Small cycle chip: padding 8 x 3, text 12, trailing chevron 12. Hit area 44 via `hitSlop` when tappable. |
| **Segmented control** | Container pill, padding 4, `bg-foreground`. Segments 40 high pills. Selected: `bg-segment-selected`, label `content`. Unselected label `soft`. |
| **Toggle** | 46 x 28 pill, knob 22 white. On: `bg-accent`. Off: `bg-toggle-off`. Hit area 44 via `hitSlop`. |
| **Radio** | 22 circle. Selected: `bg-accent` with an 8px `on-accent` dot. Unselected: 2px `neutral` ring. Hit area 44 via `hitSlop`. |
| **Progress steps** | 4 segments, height 4, `rounded-full`, gap 6. Active `bg-accent`, inactive `bg-progress-track`. Counter "1/4" Medium 13 `muted`. |
| **Icon button** | 40px circle, `bg-card`, 1px `border-line`, icon 20. Hit area 44 via `hitSlop`. |
| **Notice** | `bg-card`, `rounded-lg`, padding 14, 32px icon circle, text 13/19 `soft`. |
| **Status pill** | Padding 10 x 4, `bg-foreground`, SemiBold 12 `content`. |
| **Bottom sheet** | `bg-card`, `rounded-t-sheet`, padding 12 / 20 / 40 / 20, grabber 40 x 5 `bg-grabber`, dim overlay `bg-overlay` (black 55%). Title Bold `text-[22px] leading-[28px]`. |
| **Settings group** | Section label (see typography), then a `bg-card` `rounded-xl` card of rows (padding 12 x 16, 1px `line` dividers). Row: optional 36px icon circle, title Medium 15, value `muted` 14, chevron 18 `neutral`. |
| **Tab bar** | Floating pill about 64 high, 20px side margin, `rounded-sheet`, `bg-tab-bar`. Active tab: 44px `bg-accent` circle with an `on-accent` icon. Inactive icons `on-accent` (white) in both themes. |
| **Empty state** | Illustration (about 164 wide), title SemiBold 16, text 13 `soft`, then a primary button and a text link. |
| **Hero card** | `bg-card`, `rounded-xl`, `shadow-card`, amount in ExtraBold `text-[34px] leading-[40px]`. |

**Button states** (primary, destructive and secondary):
- **Default:** as specced above.
- **Pressed (clicked):** 90% opacity while the finger is down.
- **Loading:** the label is replaced by a centred spinner in the label colour. Size does not change, so the layout does not jump. The button ignores presses and is announced as busy (`accessibilityState={{ busy: true }}`). Use it for sign-in, sign-up, and any async action.
- **Disabled:** 40% opacity, ignores presses.

## 10. Screen patterns
- **Auth (Sign-up, Sign-in, Forgot Password):** logo and wordmark (40px mark + ExtraBold 20), Bold `text-[30px] leading-[38px]` title, one muted line, form, one primary button, then a text switch link. Sign-up adds a legal line (Terms of Service and Privacy Policy in `content`). Sign-in shows "Forgot password?" right-aligned under the password field in `accent-text`. Forgot Password has a back icon button. Auth is built with Clerk hooks, not custom auth.
- **Setup flow:** back button, progress steps, Bold `text-[26px] leading-[32px]` heading, muted subtitle, content, pinned primary button, then a text link.
- **Bottom sheets** for pickers (payment method, billing cycle, theme) and confirmations (stop tracking).
- **Cancel / delete:** destructive actions need a confirm step that restates the consequence and, for subscriptions, reminds that the provider must also be cancelled.

## 11. Motion and feedback (proposed, not in Figma)
200 ms ease-out for transitions and sheets. 90% opacity on press. Respect the reduce-motion setting.
Haptics on toggle and radio changes are deferred. They need `expo-haptics`, which is not installed or approved.

## 12. Accessibility
Minimum touch target 44 x 44. Smaller controls (icon buttons, links, chips, toggles, radios) extend the hit area with `hitSlop`. Every icon button needs an `accessibilityLabel`. Do not rely on colour alone for state (selected rows also change fill, radios also fill). Support Dynamic Type: use the line-height tokens and `min-h-*`, never fixed-height containers for text.

## 13. Figma updates required before building
The code follows this doc. Figma has to match it so "replicate Figma exactly" holds.
1. **Fonts:** replace Manrope and Inter with Plus Jakarta Sans on every screen. Use the mapping in section 4. Re-check text fit.
2. **Button label:** 19px bold (line height 24).
3. **Accent Text:** add a variable. Dark `#e37531`, light `#a84a0a`. Apply it to links and orange text.
4. **Tab Bar:** add `#5d5b5b` as a variable in both collections. Inactive tab icons become white.
5. **Accent Alt:** remove it, or fix the light collection's two-space name (`Accent  Alt`) if it stays.
6. **Icons:** swap to Hugeicons free icons at the default 1.5 stroke. Check each icon exists in the free set.
7. **Illustrations:** no Figma change. The generated light variants need a visual review.

## 14. Files
| File | Purpose |
|---|---|
| `src/theme/colors.css` | Colour variables for light (`:root`) and dark, plus the `@theme` colour mapping |
| `src/theme/typography.css` | Weight classes that map to Plus Jakarta Sans family names |
| `src/theme/layout.css` | Spacing, radius and shadow tokens |
| `src/global.css` | Imports Tailwind, NativeWind and the theme files, and defines the reusable utilities (`btn-primary`, `card`, `input-field`, `chip`, `toggle`, `sheet`, ...) |
| `src/constants/fonts.ts` | Font name to `.ttf` map, loaded once in `app/_layout.tsx` |
| `src/hooks/useTheme.ts` | Theme hook: resolved scheme, preference, setter (persisted via the `lib/` storage layer) |
| `src/components/` | Reference implementations: `Button`, `Input`, `Card`, `Illustration` |
| `src/data/illustrations.ts` | Generated dark and light SVG strings. Do not edit by hand |
| `scripts/generate-illustrations.js` | Generates `data/illustrations.ts` from the master SVGs in `assets/` |
| `src/constants/images.ts` | Centralised image imports (logo, onboarding) |
| `assets/fonts/` | Plus Jakarta Sans `.ttf` files |

`tokens.json` and a hex map in `theme.ts` are not used. They would duplicate the CSS in `src/theme/`.
