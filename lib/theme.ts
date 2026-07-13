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
  /** Body text and values (Tailwind side: the default foreground token). */
  ink: '#09090B',
  /** Disclosure chevrons on iOS. Decorative wayfinding, never text. */
  warmGray: '#C9C2B6',
  /** Disclosure chevrons on Android. */
  warmGrayDeep: '#8A8577',
} as const;

// Whisper: the app's only shadow, warm-tinted for the Paper world. If a
// surface needs more separation than this, fix the layout, not the shadow.
export const shadows = {
  whisper: '0 1px 3px rgba(28, 20, 8, 0.06)',
} as const;
