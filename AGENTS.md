You are an expert React Native and Expo engineer helping me build RECURVO.
Write clean, simple, maintainable code. Prioritize clarity over unnecessary abstraction.
Think like a senior mobile developer.

---

## Project Overview

We are building RECURVO, a subscription management app for iOS and Android (no web).
It tracks subscriptions automatically from a user's bank statement and falls back to manual entry.

The app includes:
1. Tracking from CSV or PDF bank statements
2. Manual subscription entry (fallback)
3. Multi-currency support
4. Timely reminders for upcoming charges
5. AI smart reviews (tailored insights on spending)

Keep the implementation simple and readable.

---

## Tech Stack

- Expo (iOS and Android only, no web)
- React Native
- TypeScript (strict)
- Expo Router
- NativeWind
- Zustand
- AsyncStorage (persistence during frontend development)
- Supabase (database, storage, Edge Functions)
- Clerk (authentication)
- PostHog (analytics)
- OpenAI (AI reviews and statement parsing, called only from Supabase Edge Functions)
- CodeRabbit (PR review)

Do not introduce new libraries, including CSV, PDF, file-picking and notification
libraries, without proposing them first and getting approval.
Ask before installing anything new.

---

## Development Philosophy

Build feature by feature. For every feature:
1. Read this file first.
2. Keep the implementation simple.
3. Avoid overengineering.
4. Prefer readable code over clever code.
5. Build the smallest useful version first.
6. Refactor only when repetition appears.

---

## Decision Making

If something is unclear or could be improved, suggest a better approach.
If a new library would significantly help, recommend it, explain why, and ask before adding it.
Do not install new libraries without approval.

---

## Architecture

```
app/
  (auth)/
  (tabs)/        Home, Subscriptions, Insight, Settings
components/
constants/
data/
hooks/
lib/
store/
types/
assets/
```

**app/** is for routes and screens only. Screens compose components and call hooks
or stores. No large reusable UI blocks or business logic.

**components/** is for reusable UI. Create a component when it is reused in multiple
places, makes a screen easier to read, or is a clear UI concept.
Example: SubscriptionCard. Do not create components too early.

**data/** holds hardcoded, typed content.

**store/** holds Zustand stores. Examples of state to keep here: the subscription list,
preferred currency, notification preferences.
During frontend development, persist with AsyncStorage behind a small storage layer
(for example a `subscriptionRepository` in lib/). Supabase replaces it once the
frontend is done, so screens and stores must never call AsyncStorage or Supabase
directly outside that layer.

**lib/** holds external service helpers (clerk.ts, supabase.ts, posthog.ts, cn.ts).
Never expose secret keys here.

---

## UI Rules

For any UI task:
- Always replicate the provided Figma design exactly.
- Match layout, spacing, padding, font sizes, font hierarchy, colors, border radius,
  shadows, alignment, and proportions.
- Do not approximate. Do not simplify unless explicitly asked.
- Every screen must work in both light and dark mode.

---

## Styling Rules

- NativeWind is installed and set up by me. Always style with NativeWind (Tailwind) classes.
- Always use flex for layout (flex-1, flex-[n], flex-row, gap, justify-*, items-*).
  Avoid fixed heights and absolute positioning for laying out content. Use them only
  when flex cannot do it, such as overlays.
- Use StyleSheet only for components or props that className cannot style.
  Check before assuming a component needs StyleSheet. Many do not.
  SafeAreaView cannot be styled with NativeWind, so use StyleSheet for it.
- Do not use inline styles or StyleSheet out of habit.
- Use the NativeWind version installed in this project (check package.json).
  Do not upgrade without approval.
- Reuse class patterns through utilities in global.css.
- Colors come from theme tokens, never hardcoded hex values in components.
- If a feature would be better styled with StyleSheet than NativeWind
  (for example animated values or runtime-calculated styles), recommend it and
  explain why before using it. Likewise, if StyleSheet is used somewhere
  NativeWind would work, recommend switching.

---

## Theme

- The app supports light and dark mode through a single theme hook in hooks/.
- The splash screen and onboarding are forced to dark mode. After onboarding, the
  theme hook takes over (user setting, then system).
- Do not read the system color scheme directly in screens. Always use the theme hook.

---

## Fonts and Icons

- Fonts are .ttf files in assets/fonts, loaded once at app start.
  Use only the fonts from the design.
- Icons use Hugeicons. Propose the exact package before installing.
  Do not mix in other icon sets.

---

## Image Rule

Use centralized image imports.
1. Check if constants/images.ts exists.
2. If not, create it.
3. Import all app images there.
4. Use them through the centralized object.

```ts
import mascot from "@/assets/images/mascot.png";
export const images = { mascot };
```
```tsx
<Image source={images.mascot} />
```

Do not import image assets directly inside screens or components.

---

## State Management

- Zustand for global client state.
- Local state for temporary UI state.
- AsyncStorage for persistence (via the storage layer, see Architecture).

---

## TypeScript

- Strict mode.
- No `any`.
- Keep types simple and readable.

---

## Authentication

- Use Clerk. Do not build custom auth.
- The (auth) group gates the app. Signed-out users cannot reach (tabs).
- Clerk tokens authenticate requests to Supabase.

---

## Backend and Secrets

- Never expose secret keys in client code.
- Supabase Edge Functions are the only place that calls OpenAI or uses secret keys.
  The app never calls OpenAI directly.
- Row-level security must be on for every Supabase table, tied to the Clerk user.

---

## Notifications

- Push notifications only (Expo push service), sent from Supabase.
- Used for subscription reminders and AI smart reviews.
- Ask for notification permission with a clear explanation. Handle denial gracefully.
- Store each device's push token in Supabase, tied to the Clerk user.
- Reminders and AI reviews are sent by scheduled Supabase functions, never from the app.
- Tapping a notification deep-links to the relevant screen through Expo Router.

---

## Data and Privacy

- Bank statements (CSV or PDF) are deleted immediately after parsing. Only the
  extracted subscription data is kept.
- Never store, log, or send statement contents, amounts, or account numbers to
  logs or analytics.

---

## Analytics

- Use PostHog through lib/posthog.ts only.
- Track screen views and key events: subscription added, statement imported, reminder opened.
- Never send amounts, merchant names, or statement contents.

---

## Currency

- Always display amounts in the user's preferred currency.
- The exchange-rate source is proposed and approved when we build that feature.

---

## Feature Implementation

When building a feature:
1. Read this file first.
2. Identify the files to change.
3. Keep changes focused.
4. Do not rewrite unrelated code.
5. Follow existing patterns.
6. Make sure the feature works end to end on both iOS and Android.
7. Run ESLint and the TypeScript check, and fix all errors before finishing.
8. Replicate the Figma screens exactly.

---

## Testing and Git

- Manual testing only for now. Tell me how to test on iOS and Android.
- I handle all git commits and pushes. Never commit or push.
- PRs are reviewed by CodeRabbit.

---

## Communication

Be concise. Explain what changed and how to test it.

---

## Final Reminder

Before every feature:
- Read this file.
- Follow it strictly.
- Build clean, simple code.
- Always replicate the Figma screens exactly.
