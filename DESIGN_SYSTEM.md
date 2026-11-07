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
6. **Dark first.** The splash screen is always dark. Everything else, including the welcome screens, follows the user's theme preference.

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

`Accent Alt` (`#eb9f6f`) is not a token. The 3D scenes derive it as `accent` mixed with 30% `on-accent` (`components/three/palette.ts`), along with every other 3D colour.

**Brand colours (approved exception, 2026-11-03).** The service logos on the onboarding coins (Spotify, Netflix, CapCut, Figma, YouTube, ChatGPT) use their own brand colours, because the logos are only recognisable in them. They live only in `src/data/services.ts`; nothing else in the app uses them.
Service logos in the app UI are images from Logo.dev (`ServiceLogo`, looked up by name, cached on the phone), not colours.

**Surface layering.** Surfaces get lighter as they stack: `main` (screen) then `card` (cards, sheets, rows) then `foreground` (inputs, chips, icon circles, selected rows).
An element placed on a `foreground` surface that needs its own fill uses `card` as an inset.

**Text hierarchy.** `content` (titles, key values) then `muted` (subtitles, labels) then `soft` (descriptions on cards) then `neutral` (placeholders, inactive).
Note the names: `muted` is more prominent than `soft` in both themes. Keep the names as they are in Figma.

**Opacity.** Do not use Tailwind's alpha syntax on tokens (`bg-content/30`). With react-native-css 3.1.0-rc.0 it renders nothing on native. Translucent states have their own tokens in `src/theme/colors.css`: `segment-selected` (content 30%), `toggle-off` (content 20%), `grabber` (content 25%), `progress-track` (content 15%), `overlay` (black 55%). For an accent tint (accent at about 16%, e.g. the upload icon circle or the "Set cycle" chip) use the `AccentTint` component, which layers `bg-accent opacity-15` under its content.

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
- The active tab icon (`accent` on `tab-bar`) is 2.2:1 in dark and 2.0:1 in light, under the 3:1 for UI icons. Screen readers get the selected state from `accessibilityState`.

## 3. Theming behaviour
- Preference in Settings > Appearance: **System** (default), **Light**, **Dark**. Persisted through the storage layer in `lib/`, never by calling AsyncStorage directly.
- One theme hook in `hooks/` (`useTheme`) returns the resolved scheme and the preference setter. Screens never read the system colour scheme directly.
- **Always dark:** the splash screen only (decided 2026-11-02). Use light status-bar icons. The native launch screen must also be dark in both system modes so light-mode users never see a white flash.
- **Follows preference:** Sign-up, Sign-in, Forgot Password and the rest of the app.
- The app starts with the dark override on, so a signed-out launch goes from the native splash to the splash screen without a light frame. The override is released when the splash ends, or at launch for signed-in users.
- Each palette is written once in `src/theme/colors.css`, as the `palette-light` and `palette-dark` utilities. `:root` applies `palette-light`, and the dark media query applies `palette-dark`. (Tailwind 4 already has `scheme-light`/`scheme-dark`, which set `color-scheme`, so the names must not be those.)
- **Pinned palette:** a View with `className="palette-light"` (or `palette-dark`) gives everything inside it that palette in either theme. react-native-css passes class-set variables down to children, so put the colour classes on the children, not on that View. Used by the Appearance previews.
- `global.css` defines the variables for light (`:root`) and dark. **(verify)** how NativeWind 5 switches them (system scheme, manual override, or a forced subtree). Forcing a subtree dark needs a style-prop fallback such as `vars()`. That is an inline style, which AGENTS.md normally forbids. It is the one approved exception, and it stays inside the onboarding wrapper.

## 4. Typography
One family: **Plus Jakarta Sans**, using only the `.ttf` files already in `assets/fonts`, loaded once at app start (`expo-font`). Those files are Light, Regular, Medium, SemiBold, Bold and ExtraBold. The sizes below use Regular to ExtraBold. Light is available but nothing uses it yet.
No other font family is used anywhere, and no font packages are installed.

There are no text-size tokens. Style each `Text` individually with the size, line height, weight and colour from the design, for example `text-[15px] leading-[22px] font-medium text-content`. The common sizes are:

| Classes | Weight | Use |
|---|---|---|
| `text-[44px] leading-[52px]` | Medium | Onboarding titles |
| `text-[14px] leading-[20px]` | Regular | Onboarding descriptions |
| `text-[44px] leading-[52px]` | ExtraBold (`font-extrabold`) | Hero totals: the Total Spend amount on Home |
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
Sizes: 14, 16, 18, 20, 24 (exception from Figma: the 38px calendar icon in the subscription details modal). Colour: `content` when active, `muted` for secondary, `neutral` for inactive or placeholder.
Icon circles: 32, 36, 40, 44 or 56px, `bg-foreground`, icon at half the circle size, `content` colour (orange only for a success check).
**(verify)** how icon colours come from tokens (`className` on the icon, or reading a CSS variable with a hook). Never hard-code hex.

## 8. Logo and illustrations
- Logo: the Recurvo "R" mark, `assets/logo.png`, exported `@1x/@2x/@3x` from Figma (used at 40px on auth, 112px on splash). Import it only through `constants/images.ts`.
- Illustrations: `no_sub`, `no_insight`, `no_internet`. The master SVGs in `assets/` are auto-traced and drawn for dark mode.
- `piggy_bank` (Insights' saved banner, 46 x 48) is drawn by hand in the same style: a grey piggy bank (dark body, grey rim, slot, ear, snout, legs) under an orange coin with a white "$" and two orange ticks. Figma's green piggy bank is not used (green is not a token).
  They have 11 to 96 near-gray fills and no named colour slots, so a runtime colours prop cannot theme them.
- `no_cancelled` (Subscriptions, Cancelled tab) has no Figma source yet. It is drawn by hand in the same style (tilted phone with subscriptions still switched on, scissors with orange handles, orange ticks), dark-mode master like the others. Replace it when a designed one exists.
- `no_notifications` (Notifications page) has no Figma source either. Drawn by hand the same way: a sleeping bell (grey rim, dark body, orange clapper) in front of two empty notification cards, orange "z z" and orange ticks. Shapes use absolute viewBox coordinates (no translate groups) so the generator's region test turns the dark body white in light mode. Replace it when a designed one exists.
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
| **Button (destructive)** | `Button` with `destructive`. Same as primary with `bg-destructive`. Delete account, the confirm button in `ConfirmSheet` (delete a subscription) and "Stop tracking" in `StopTrackingSheet`. |
| **Button (compact)** | Subscription details modal only. Min height 36, `rounded-[8px]`, padding 16 x 8, label SemiBold 14/20. Primary: `bg-accent`, label `on-accent`. Secondary: `bg-foreground`, label `content`. 200 wide on the 402 frame (inset 30 inside the card padding), 10 apart. |
| **Button (secondary)** | Same size, `bg-foreground`, label `text-content`. |
| **Text link** | SemiBold 15, `text-accent-text` (`link-neutral` uses `text-muted` for neutral actions like "Add manually instead"). Visual height 24, centred, hit area 44 via `hitSlop`. |
| **Input** | Label above (Medium 13, `muted`, 8 gap). Field min height 54, `rounded-md`, `bg-foreground`, padding 16, text 16 `content`, placeholder `neutral`. Password field has a show/hide eye icon (`neutral`, 20). Error: 1px `destructive` border and a 12px `destructive` message below. |
| **Card** | `bg-card`, `rounded-xl`, padding 16, no border. |
| **List row** | `rounded-lg`, padding 12 to 16, gap 12, optional logo tile (see Subscription logo), title SemiBold 16, subtitle 12 `soft`. Selected row: `bg-foreground`. |
| **Subscription logo** | `SubscriptionLogo`. 40px `rounded-sm` tile, `bg-foreground`, with the 30px Logo.dev logo (5px radius) centred. First letter (SemiBold 16 `content`) when there is no Logo.dev key. `size="lg"` (details modal): 52px tile, 12px radius, 39px logo (6px radius), letter SemiBold 20. |
| **Subscription row** | `SubscriptionRow`. `bg-card`, `rounded-md`, padding 12 (18 left, 20 right), gap 8. Logo tile, then name SemiBold `text-[20px] leading-[26px]` `content` over the category 13/19 `muted`, then right-aligned amount SemiBold 16/22 `content` over the cycle 13/19 `muted`. Rows 8 apart. |
| **Upcoming card** | `UpcomingCard`, in Home's horizontal row (12 gap, snaps card by card). Width is half the content width, set at runtime. `bg-card`, `rounded-lg`, padding 15 / 20 / 15 / 17. Logo tile with the amount SemiBold 13/19 `content` over the cycle 13/19 `soft` (8 gap), name Medium `text-[20px] leading-[26px]` `content` 10 below, then "N Days Left" SemiBold 14/20 `destructive`, right-aligned, 27 below. |
| **Chip** | Pill, padding 14 x 7, `bg-foreground`, Medium 13 `soft`. Small cycle chip: padding 8 x 3, text 12, trailing chevron 12. Hit area 44 via `hitSlop` when tappable. |
| **Segmented control** | Container pill, padding 4, `bg-card` (it sits on a `foreground` sheet). Segments 38 high pills. Selected: one `bg-accent` pill that slides to the tapped segment (150 ms, ease-in-out `cubicBezier(0.77, 0, 0.175, 1)`, a Reanimated CSS transition; it jumps with reduced motion), label SemiBold 14 `on-accent` changing colour in step. Unselected label `content`. |
| **Toggle** | `Toggle` component. 46 x 28 pill, knob 22 white, the knob slides in 200 ms. On: `bg-accent`. Off: `bg-toggle-off`. Hit area 44 via `hitSlop`. iOS 26+: the native Liquid Glass switch (SwiftUI `Toggle` from `@expo/ui`) tinted `accent`, following the theme. |
| **Radio** | 22 circle. Selected: `bg-accent` with an 8px `on-accent` dot. Unselected: 2px `neutral` ring. Hit area 44 via `hitSlop`. |
| **Progress steps** | 4 segments, height 4, `rounded-full`, gap 6. Active `bg-accent`, inactive `bg-progress-track`. Counter "1/4" Medium 13 `muted`. |
| **Icon button** | 40px circle, `bg-card`, 1px `border-line`, icon 20. Hit area 44 via `hitSlop`. |
| **Notice** | `bg-card`, `rounded-lg`, padding 14, 32px icon circle, text 13/19 `soft`. |
| **Status pill** | Padding 10 x 4, `bg-foreground`, SemiBold 12 `content`. |
| **Bottom sheet** | `bg-foreground` (rows inside use `bg-card` as the inset), `rounded-t-sheet`, padding 12 / 20 / 40 / 20, grabber 40 x 5 `bg-grabber`, dim overlay `bg-overlay` (black 55%). Title Bold `text-[22px] leading-[28px]`. |
| **Currency sheet** | `CurrencySheet`, used by the Add form's currency pill (with search) and Create account's preferred currency row (no search). Lists the 55 currencies in `data/currencies.ts`, a pinned one first (the preferred currency, or the phone's), the rest A–Z by code. Row: 40px `rounded-sm` symbol tile, code SemiBold 16 over the name 13 `muted`, radio. Search: 48 high `bg-card` field with a search icon; no matches shows "No currency matches." |
| **Amounts** | `formatAmount` puts the currency's symbol first. Symbols are distinct and in Latin script (CA$, A$, CN¥, E£, SR). A symbol made of letters gets a space (CHF 1,600, KSh 1,600); a sign or one letter doesn't (₦1,600, R1,600). |
| **Confirm sheet** | `ConfirmSheet` (delete a subscription). A bottom sheet with the title, the message centred (15/22 `muted`) 4 below, then a destructive `Button` 24 below and a "Keep it" `link-neutral` 12 below that (its text 16 below, with the link's 4px padding). The permission and Add subscriptions sheets use the same button and link spacing. |
| **Modal backdrop** | `ModalBackdrop`, behind a centred modal. Tapping it closes the modal. iOS: `expo-blur` `BlurView`, tint follows the theme, intensity 70. Android: solid `bg-main` (Android draws blur poorly). |
| **Subscription details** | Route `subscription/[id]`, a transparent modal that fades in. `bg-card` card, `rounded-sheet`, 43 from the screen sides on the 402 frame, centred vertically, padding 18 top, 28 sides, 20 bottom. Top right: edit and delete icon buttons (36px circles, `bg-foreground`, 1px `border-line`, icon 16, delete icon `destructive`, 8 apart, 20 from the card edge). 26 below: the large logo tile and, 12 to its right, the name SemiBold `text-[24px] leading-[30px]` `content` over "amount / cycle" Medium 15/20 `muted`, centred as a group. 26 below: 38px calendar icon (`content`), 4 gap, "Renews" (or "Cancelled on") 13/18 `muted` over the date SemiBold 15/20 `accent-text`. 18 below: Category and Payment Method rows (min height 26, label 13/19 `muted`, value SemiBold 13/19 `content`, right-aligned). The payment method is a pill (`bg-foreground`, padding 12 / 8 / 4, SemiBold 13/19, chevron 16) that opens the payment method sheet. 32 below: the compact buttons. |
| **Settings group** | `SettingsGroup`. Section label (SemiBold 12/16 uppercase, `tracking-[0.8px]`, `muted`, 10 below it), then a `settings-group` card: `bg-card`, `rounded-xl`, padding 16 top and bottom (the rows add 16 at the sides), no dividers, rows 29 apart. Groups are 18 apart. |
| **Settings row** | `SettingsRow`. Padding 16 sides, none top or bottom (hitSlop 12 gives the touch area). Optional leading node (the avatar), gap 12. Title Medium 15/20 `content` (`destructive` for "Delete account", SemiBold for the account name), optional subtitle Regular 12/16 `muted` 2 below. Value Regular 13/19 `muted`, chevron 20 `muted`, or a trailing control (toggle). |
| **Notification card** | `NotificationCard`. Same box as the subscription row (`bg-card`, `rounded-md`, padding 12, 18 left, 20 right, gap 8). Logo tile, then "<Name> renews today / tomorrow / in N days" SemiBold 15/20 `content` (up to 2 lines) over "amount · Mon, 9 Nov" Regular 13/19 `muted` 2 below. Cards 8 apart. A cancel reminder reads "Cancel <Name> with <Provider> before 28 Oct" ("today" on the day; "with <Provider>" is left out when the provider is the name). |
| **Screen header** | `ScreenHeader`, on pushed screens (Add Subscription, Notifications, Profile, Appearance, Delete account) and the offline state. 40px `icon-button` back arrow, title SemiBold 22/28 `content` 16 to its right. The title is optional, and the back arrow hides when there is no screen to go back to (the offline state on the first screen of the stack). |
| **Appearance option** | `AppearanceOptionCard`. `rounded-xl`, padding 14 x 16, `bg-foreground` when selected, `bg-card` otherwise, 16 apart. `ThemePreview` (72 x 96, `rounded-sm`, 1px `border-line`), then 16 to the right the title SemiBold 16/22 `content` over the description 13/19 `muted` 4 below, then the radio. The preview draws a mini screen in a pinned palette: `main` fill, a 30 x 5 `content` bar, two 56 x 24 `card` blocks (radius 5) with `muted`, `accent` and `content` bars. System shows the light half left, the dark half right. |
| **Tab bar** | `TabBar` component. Floating pill, min height 64, 20px side margin, `rounded-sheet`, floating over the screen with its bottom edge on the safe-area inset (16 minimum). Four equal-width tabs, 24px icons centred, icons only. Active icon `accent`. iOS 26+: Liquid Glass (`GlassView`) following the theme, inactive icons `content` (black on light glass, white on dark). Android and older iOS: `bg-tab-bar`, inactive icons `on-accent` (white) in both themes. No haptics or animation on tab change. Utilities: `tab-bar`, `tab-bar-glass`, `tab-item`. |
| **Empty state** | Home with no subscriptions: `Illustration` at 154 x 123, centred. Below it a row with a 44px `icon-circle` (icon 20 `content`), title SemiBold 15 `content` and text 12/17 `soft`, then a primary button. Inset 10px inside the screen padding. |
| **Empty state (Subscriptions tab)** | Centred: `Illustration` at 180 x 144, title Medium `text-[20px] leading-[26px]` `content` 10 below, text Medium 11/14 `soft` 8 below. Monthly and Yearly then show the primary button 51 below (inset 18 inside the screen padding) and an "Add manually" `link` 12 below it. Cancelled has no actions. |
| **Empty state (Notifications)** | Same type as the Subscriptions empty state: `no_notifications` at 180 x 144, "No Notifications Yet", "We’ll remind you here before a subscription renews." Centred in the page, lifted 32 above the middle. When notifications are off (Settings switch or phone permission), a primary "Turn on notifications" button 51 below (inset 18) opens the permission sheet. |
| **Empty state (Offline)** | `OfflineScreen`, shown by `useOffline` (expo-network) in place of the screens that need the internet while the phone is offline: Sign in, Create account, Reset password, statement upload, Profile and Delete account. Screen header (with the page title on Profile and Delete account), then the Notifications empty-state type, centred and lifted 32 above the middle: `no_internet` at 177 x 176, "No Internet Connection", "Check your connection and try again.", and a primary "Try again" button 51 below (inset 18) that rechecks the connection. Statement upload adds an "Add manually instead" `link` 12 below. The screen comes back by itself, with what was typed, when the connection does. Everything else works offline from the data on the phone. |
| **Search field** | Subscriptions. Height 52, `rounded-[18px]`, `bg-foreground`, 1px `border-line`, padding 28 x 16, text Medium 13/18 `content`, placeholder `neutral`. No icon. |
| **Hero card** | `TotalSpendCard`. Dark in both themes: the `dash_bg` image (cover, centred, filling the card) under a `bg-overlay` layer, `rounded-sheet`, 1px `border-line` in dark mode only, `shadow-card`, padding 24 (32 right). Count row top right (icon 24 `accent`, SemiBold 18 `on-accent`), label SemiBold 14 `neutral`, amount ExtraBold `text-[44px] leading-[52px]` `on-accent`. |
| **Avatar** | 50px circle (Home, Settings). The Clerk profile photo if the user has one, otherwise up to two initials (Bold 18 `text-main`) on `bg-content`. `size="lg"`: 88px with initials Bold 30 (Profile). |
| **Outlined pill** | Home's bell button (42px circle, icon 20) and "View All" (padding 14 x 4, Medium 12 `content`): `bg-foreground` with 1px `border-line`. While a renewal is due within 3 days, the bell has a 12px `bg-accent` badge with a 2px `border-foreground` ring, 8 from its top and right edges. |
| **Insight stat card** | `InsightStatCard`, two side by side on Insights, 20 apart, 16 from the screen edges. `bg-card`, `rounded-lg`, padding 16 (20 right, 14 bottom). Label Regular 11/16 uppercase `muted` with a 20px `accent` icon on the right (Monthly: trend up or down; Yearly: columns), amount Bold 20/28 `content` 12 below (shrinks to fit), caption Regular 11/14 `soft`. |
| **Smart review card** | `SmartReviewCard`. `rounded-xl`, padding 16 x 14, 12 apart. 40px `icon-circle` with the sparkle (20 `content`), 12 gap, title SemiBold 15/21 `content` over the message 13/19 `soft`. One card is open at a time: `bg-foreground` with a row 12 below of two half-width text buttons, "Keep" SemiBold 15 `content` and "Cancel" SemiBold 15 `destructive` (44 tall). Closed cards are `bg-card`; tapping one opens it (no animation). |
| **Saved banner** | `SavedBanner`. `bg-card`, `rounded-sm`, 1px `border-line` (as in Figma, an exception to borderless cards), padding 20 x 18, 16 from the screen edges. `piggyBank` illustration 46 x 48, 10 gap, "You’ve saved ₦X" SemiBold 16/22 `content` over "by canceling unused subscriptions" 13/18 `muted`, arrow 24 `content`. Opens Subscriptions on Cancelled. |
| **Category chip** | Spend by Category. Pill, padding 14 x 6, 1px border, Medium 12/16. Selected: `bg-accent`, `border-accent`, `on-accent`. Others: `bg-foreground`, `border-line`, `content`. 8 apart, scrolls edge to edge. |
| **Bubble chart** | `BubbleChart`. `bg-card` `rounded-xl` box, padding 14 (10 top, 16 bottom), 16 from the screen edges; legend "Big Bubble = Expensive" / "Small Bubble = Cheap" Regular 11/14 `muted` at the two ends; 12 below, a `bg-main` `rounded-lg` area at 334:184. Bubbles are `bg-foreground` circles packed in the middle (`lib/bubbles.ts`), area in proportion to monthly cost, at most 84 across, the cheapest at least 40% of the biggest's width. 64+ across: logo 24 over the name Medium 11/14 `content`; 28+: logo 16; smaller: empty. Size and position are a runtime style (approved). Tapping one opens its details. Brand colours are not used. |
| **Stop tracking sheet** | `StopTrackingSheet`. Bottom sheet titled "Stop tracking <Name>?", the message centred 15/22 `muted` 4 below. 18 below: a `bg-card` `rounded-md` box (padding 16, 14 top, 12 bottom): "You will save" 12/16 `muted` over "₦15,700 a month" Bold 20/28 `content`; right-aligned "about ₦188,400 / a year" 12/16 `muted` (a yearly plan shows "a month"). 15 below: a `bg-card` `rounded-md` notice (padding 14, info icon 18 `content` in a 32 box, 12 gap): "This does not cancel <Provider>" SemiBold 14/20 `content` over "Cancel with <Provider> before 28 Oct, or the next ₦15,700 charge will still go through." 13/19 `soft`. 16 below: destructive "Stop tracking" `Button`, "Keep tracking" `link-neutral`. |

**Button states** (primary, destructive and secondary):
- **Default:** as specced above.
- **Pressed (clicked):** 90% opacity while the finger is down.
- **Loading:** the label is replaced by a centred spinner in the label colour. Size does not change, so the layout does not jump. The button ignores presses and is announced as busy (`accessibilityState={{ busy: true }}`). Use it for sign-in, sign-up, and any async action.
- **Disabled:** 40% opacity, ignores presses.

## 10. Screen patterns
- **Auth (Sign-up, Sign-in, Forgot Password):** logo and wordmark (40px mark + ExtraBold 20), Bold `text-[30px] leading-[38px]` title, one muted line, form, one primary button, then a text switch link. Sign-up adds a legal line (Terms of Service and Privacy Policy in `content`). Sign-in shows "Forgot password?" right-aligned under the password field in `accent-text`. Forgot Password has a back icon button. Auth is built with Clerk hooks, not custom auth.
- **Setup flow:** back button, progress steps, Bold `text-[26px] leading-[32px]` heading, muted subtitle, content, pinned primary button, then a text link.
- **Home with subscriptions:** header, Total Spend card (monthly total in the preferred currency), upcoming cards 40 below (renewals due within 7 days, soonest first, hidden when none), "Active Subscriptions" header 36 below, then the latest 3 subscription rows (newest first) 30 below. Without upcoming cards, the header sits 56 below the Total Spend card, as in the empty state.
- **Subscriptions:** fixed header (title Medium `text-[23px] leading-[30px]`, search field 22 below, orange segmented control Monthly / Yearly / Cancelled 31 below), then the scrolling list: subscription rows 30 below the tabs, newest first. Weekly subscriptions are listed under Monthly. Search filters the selected tab by name or category; no matches shows one centred 13/19 `soft` line. Empty tabs show the Subscriptions empty state 72 below the tabs.
- **Subscription details:** tapping a subscription row (Home, Subscriptions) or an upcoming card opens the details modal. A tracked subscription shows "Cancel Subscription", a cancelled one "Continue Tracking" (no confirm step) and "Cancelled on" with the cancel date. Pencil opens the Add Subscription form in edit mode ("Edit Subscription", "Save Changes"). Cancelled subscriptions are listed only under the Cancelled tab, and left out of Home's total, count, upcoming cards and rows.
- **Settings:** title SemiBold `text-[28px] leading-[36px]`, then the groups Account (avatar, name SemiBold, email), Preferences (Currency, Appearance, Notifications toggle, Smart review alerts, App lock toggle), Support & Legal, Data & Account. The first group starts 34 below the title. "Recurvo 1.0.0 (build 1)" Regular 12/16 `muted`, centred, 16 below the last group (version and build from expo-application).
- **Notifications:** Home's bell opens it. Screen header, then notification cards 20 below, soonest first: every tracked subscription with Remind me on (statement imports count as on) renewing within 3 days, the push reminder's rule. Tapping a card opens the subscription details. No reminders shows the Notifications empty state. Reminders stay listed when notifications are off; only the push stops. Cancel reminders (below) are listed with them, from 2 days before the charge.
- **Appearance:** screen header, then 15/22 `muted` text 14 below, then the three options 20 below it. The theme changes on tap.
- **Delete account:** screen header, then a `bg-card` `rounded-xl` card (padding 14 x 16): 40px icon circle with the warning icon (20, `destructive`), "This can't be undone" Bold 16/22 `content` over 13/19 `muted`, then 10 below a bulleted list (5px `muted` dots, 14/18 `muted`, 9 apart). 16 below: a notice card (`rounded-xl`, padding 14, 32px icon circle, 13/19 `soft`). 14 below: "Type DELETE to confirm" (`field-label`) and an input. Pinned: destructive "Delete my account" (disabled until DELETE is typed) and a "Cancel" `link-neutral` 10 below it.
- **Profile** (no Figma yet, built from the Add form pattern): screen header, 88px avatar centred with a "Change photo" `link`, First name and Last name fields, the email as a read-only field (`muted` text) with "Your email can't be changed." 12/16 `soft`, and a pinned "Save Changes" button.
- **App lock screen** (no Figma yet): follows the theme. 64px logo, "Recurvo is locked" Bold 22/28, a 15/22 `muted` line, and a pinned "Unlock" button.
- **Add subscriptions sheet:** Home's + button opens `AddSubscriptionsSheet` (no Figma; same layout as `ConfirmSheet`): title "Add subscriptions", a centred 15/22 `muted` line, a primary "Find my subscriptions" button (statement upload) and an "Add manually instead" `link-neutral` (Add Subscription form). Statements and cards are no longer managed in Settings.
- **Bottom sheets** for pickers (payment method, billing cycle, currency, smart review alerts, profile photo), choices (add subscriptions) and confirmations (stop tracking).
- **Cancel / delete:** destructive actions need a confirm step that restates the consequence and, for subscriptions, reminds that the provider must also be cancelled. Use `ConfirmSheet`.
- **Insights:** title Medium `text-[28px] leading-[36px]`, the two stat cards 32 below (Monthly: monthly spend, with "+₦2,300 vs last month" / "-₦…" / "Same as last month"; Yearly: monthly × 12, "Projected annual spend"). "Smart Reviews" Medium 18/24 20 below, cards 12 below (hidden when there are none). The saved banner 44 below (20 below the stat cards without reviews). "Spend by Category" Medium 18/24 52 below, chips 20 below, the bubble chart 16 below. Nothing tracked (even with cancelled subscriptions) shows ₦0.00 figures ("₦0.00 from last month") and the empty state 88 below: `no_insight` at 169 x 137, "Add Subscriptions to get Insights" Medium 20/26 `content` 4 below, two lines Medium 11/14 `soft` 8 below, the primary "Find my subscriptions" button 30 below (42 from the screen edges) and an "Add manually" `link`.
- **Last month:** subscriptions added by hand save `addedAt`; statement imports count as already running. Last month's spend is everything added before this month and not cancelled before it, at today's rates.
- **Smart Reviews (local rules until the AI Edge Function):** "<Name> is your most expensive subscription" / "₦15,700 a month, about half of what you spend. Do you still need it?" (2+ tracked), and for each one in another currency "<Name> is billed in US dollars" / "$4.00 a month costs ₦6,200 today, up ₦400 since you started. Keep it?" (the change only when the start rate is known). Keep hides a review for good; Cancel opens the Stop tracking sheet.
- **Stop tracking:** the details modal's "Cancel Subscription" and a review's Cancel open `StopTrackingSheet`, then the removed screen (`removed/[id]`, fades in): a 72px `bg-foreground` circle with a 32px `accent` tick, "<Name> removed" Bold 26/32 22 below, "Your monthly spend is now ₦14,400." 15/22 `muted` 8 below, then 14 below a `bg-card` `rounded-xl` card (padding 18, 15 top, 16 bottom): "One more step: cancel with <Provider>" SemiBold 15/20 `content` over "Your next ₦15,700 charge is due on 28 Oct. Cancel before then to avoid it." 13/19 `soft`, and 16 below a `bg-foreground` `rounded-md` row (16 from the card edge, padding 14 x 10): bell 20, "Remind me on 26 Oct" SemiBold 15/20 over "Two days before the charge" 12/16 `soft`, toggle. The row is left out when the charge is 2 days away or less. Pinned "Done" button and an "Undo" `link-neutral` (tracks it again). Content centred above the button.
- **Cancel reminder:** saved on the subscription (`cancelReminder`). Starts on when notifications are allowed; switching it on without permission uses the permission sheet. It is listed on the Notifications page from 2 days before the first charge after stopping, until that day.

## 11. Motion and feedback (proposed, not in Figma)
200 ms ease-out for transitions and sheets. 90% opacity on press for buttons and rows, 70% for text links (90% can't be seen on text). Respect the reduce-motion setting.
- **Bottom sheet:** one shared value moves the sheet in, out and under the finger; the overlay's opacity follows it. Opening and every close (overlay tap, back button, a choice, a drag) use the same spring, `{ duration: 300, dampingRatio: 1, overshootClamping: true }`, so the sheet always leaves the way it came. Reduced motion: no slide, the Modal's fade.
- **Tick (`CheckCircle`):** fades in and grows from 90% in 200 ms, `Easing.bezier(0.23, 1, 0.32, 1)`, when it appears (scan step done, subscription ticked, card found). Lists that show ticks on load wrap themselves in `LayoutAnimationConfig skipEntering`. Reduced motion keeps the fade.
- **Upload:** the dropzone and the picked-file block fade in over 200 ms (same curve) when they swap. Not on arrival.
Haptics on toggle and radio changes: a light selection tap (`Haptics.selectionAsync()` from `expo-haptics`).

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
| `src/theme/colors.css` | The light and dark palettes (`palette-light`, `palette-dark`), applied to `:root` by scheme, plus the `@theme` colour mapping |
| `src/theme/typography.css` | Weight classes that map to Plus Jakarta Sans family names |
| `src/theme/layout.css` | Spacing, radius and shadow tokens |
| `src/global.css` | Imports Tailwind, NativeWind and the theme files, and defines the reusable utilities (`btn-primary`, `card`, `input-field`, `chip`, `toggle`, `sheet`, ...) |
| `src/constants/fonts.ts` | Font name to `.ttf` map, loaded once in `app/_layout.tsx` |
| `src/hooks/useTheme.ts` | Theme hook: resolved scheme, preference, setter (persisted via the `lib/` storage layer) |
| `src/components/` | Reference implementations: `Button`, `Input`, `Card`, `Illustration` |
| `src/data/illustrations.ts` | Generated dark and light SVG strings. Do not edit by hand |
| `scripts/generate-illustrations.js` | Generates `data/illustrations.ts` from the master SVGs in `assets/` |
| `src/constants/images.ts` | Centralised image imports (logo) |
| `assets/fonts/` | Plus Jakarta Sans `.ttf` files |

`tokens.json` and a hex map in `theme.ts` are not used. They would duplicate the CSS in `src/theme/`.
