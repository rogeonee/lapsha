// The Lapsha palette (see DESIGN.md § Colors). Tailwind utilities come
// from the matching @theme tokens in global.css (bg-paper, text-broth,
// bg-cream-swirl) — reach for these constants only where a raw value is
// required: native props (header tints, icon colors, FAB containers)
// and style objects. Keep global.css in sync when values change.
export const palette = {
  /** Brand amber for icons and tints. Never text — fails contrast. */
  noodleGold: '#F6B756',
  /** Deep amber; the only amber allowed as text (tints, accent labels). */
  broth: '#B07818',
  /** Soft amber fill (avatars, Android FAB container); pair with Broth. */
  creamSwirl: '#FBEAC9',
  /** Screen background. Screens sit on Paper; white is earned by cards. */
  paper: '#F9F7F4',
  /** Android tab-bar surface — one tonal step below Paper so chrome separates. */
  paperDeep: '#F1EDE6',
  /** Card and row surface — earned by sitting on Paper (card-white). */
  cardWhite: '#FFFFFF',
  /** Body text and values (Tailwind side: the default foreground token). */
  ink: '#09090B',
  /** Filled primary-button background (the shadcn `primary` token). */
  inkPrimary: '#18181B',
  /** Text on filled primary buttons (`primary-foreground`). */
  primaryForeground: '#FAFAFA',
  /** Muted secondary text and inactive tab items (`muted-foreground`). */
  inkMuted: '#71717A',
  /** Disclosure chevrons. Decorative wayfinding, never text. */
  warmGrayDeep: '#8A8577',
  /** Destructive actions (matches --color-destructive / HeroUI --danger). */
  destructive: '#EF4444',
} as const;

// Whisper: the app's only shadow, warm-tinted for the Paper world. If a
// surface needs more separation than this, fix the layout, not the shadow.
export const shadows = {
  whisper: '0 1px 3px rgba(28, 20, 8, 0.06)',
} as const;
