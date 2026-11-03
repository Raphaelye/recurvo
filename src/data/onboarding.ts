// The three beats of the welcome screen. The 3D scene has a stage per beat
// (components/three/scenes/welcome.ts), in the same order, after the splash.
export type WelcomeBeat = {
  eyebrow: string;
  caption: string;
  // Line 1 is in the main text colour, line 2 in the muted one.
  title: [string, string];
};

export const welcomeBeats: WelcomeBeat[] = [
  {
    eyebrow: "Welcome to Recurvo",
    caption: "Scattered across cards",
    title: ["Subscriptions hide", "everywhere."],
  },
  {
    eyebrow: "Auto-detect",
    caption: "Spotted from your statement",
    title: ["Recurvo finds them", "for you."],
  },
  {
    eyebrow: "Stay in control",
    caption: "Reminders before each charge",
    title: ["Every renewal,", "always on time."],
  },
];

// Time on each beat before it moves on by itself.
export const BEAT_DURATION_MS = 4500;

// How long the splash stays before the welcome beats start.
export const SPLASH_DURATION_MS = 1800;
