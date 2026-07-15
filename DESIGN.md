---
name: Lapsha
description: A warm, native, local-first notebook about the people who matter.
colors:
  noodle-gold: '#F6B756'
  broth: '#B07818'
  cream-swirl: '#FBEAC9'
  paper: '#F9F7F4'
  card-white: '#FFFFFF'
  ink: '#09090B'
  ink-primary: '#18181B'
  ink-muted: '#71717A'
  hairline: '#E4E4E7'
  pressed-fill: '#F4F4F5'
  warm-gray-deep: '#8A8577'
  destructive: '#EF4444'
typography:
  title:
    fontFamily: 'system-ui (SF Pro on iOS, Roboto on Android)'
    fontSize: '34px'
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: 'system-ui (SF Pro on iOS, Roboto on Android)'
    fontSize: '1.125rem'
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: 'system-ui (SF Pro on iOS, Roboto on Android)'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'system-ui (SF Pro on iOS, Roboto on Android)'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.35
rounded:
  md: '0.375rem'
  card: '1rem'
  full: '9999px'
spacing:
  sm: '0.5rem'
  md: '0.75rem'
  lg: '1rem'
  xl: '1.5rem'
components:
  button-primary:
    backgroundColor: '{colors.ink-primary}'
    textColor: '#FAFAFA'
    rounded: '{rounded.md}'
    height: '48px'
    padding: '12px 20px'
  button-destructive:
    backgroundColor: '{colors.destructive}'
    textColor: '#FAFAFA'
    rounded: '{rounded.md}'
    height: '48px'
    padding: '12px 20px'
  button-outline:
    backgroundColor: '{colors.card-white}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    height: '48px'
    padding: '12px 20px'
  card:
    backgroundColor: '{colors.card-white}'
    rounded: '{rounded.card}'
    padding: '1rem'
  entry-row:
    backgroundColor: '{colors.card-white}'
    textColor: '{colors.ink}'
    padding: '0.75rem 1rem'
  avatar:
    backgroundColor: '{colors.cream-swirl}'
    textColor: '{colors.broth}'
    rounded: '{rounded.full}'
    size: '48px'
  input:
    backgroundColor: '{colors.card-white}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    height: '48px'
    padding: '0 0.75rem'
---

# Design System: Lapsha

## 1. Overview

**Creative North Star: "The Well-Kept Notebook"**

Lapsha looks like a notebook someone actually keeps: quiet warm paper, tidy white cards, and one golden thread of amber marking identity and accent actions. The content — people and the details you've saved about them — is intimate, so the interface stays out of the way. Chrome is native wherever the platform provides it (large-title headers, sheets, swipe actions on iOS; Material 3 on Android), and the custom layer on top is deliberately plain: white cards on paper, hairline dividers, system type. Components are **native and quiet** — system affordances first, custom chrome only where the platform has no answer.

This system explicitly rejects the sales-CRM look (data tables, pipelines, "contacts as leads" coldness), the generic web-app-in-a-wrapper feel, and social-network profile aesthetics. A person's screen should read as "my notes about Anna," never as a database record or a public profile.

**Key Characteristics:**

- Warm paper background with white cards; separation by tone, not lines or heavy shadows
- One amber family (Noodle Gold / Broth / Cream Swirl) carries warmth, identity, and accent interactions
- System fonts only; the platform's own voice
- Continuous-curve corners (`borderCurve: 'continuous'`) on every card — iOS-squircle softness
- Density is low; every screen has one job

## 2. Colors

A restrained warm palette: near-neutral surfaces, zinc-cool ink, and a single amber family used only where it means something.

Tokens live in two mirrored places: `global.css` `@theme` for Tailwind classes (`bg-paper`, `text-broth`, `bg-cream-swirl`, plus the shadcn/HeroUI semantic set) and `lib/theme.ts` (`palette`, `shadows`) for native props — header tints, icon colors, the Android FAB, shadows. Never hard-code a hex from this palette in a component; add a token instead and keep both files in sync.

### Primary

- **Noodle Gold** (#F6B756): The brand amber. The iOS selected-tab tint, plus-circle actions, switches, and picker accents. It marks "this is Lapsha and this is touchable." Never used as text — too light against any surface here.
- **Broth** (#B07818): The deep, concentrated amber. The only amber allowed as text: navigation header tint, "Add fact / Add date" row labels, avatar initials, and selection checkmarks; it also colors the Android FAB glyph. Use at ≥14px; at small sizes it thins out against Paper (~3.6:1 — acceptable for accent labels now, revisit before App Store release).
- **Cream Swirl** (#FBEAC9): The soft amber fill. Avatar circles, the Android FAB container. Always paired with Broth content on top of it.

### Neutral

- **Paper** (#F9F7F4): Every screen's background. Warm, quiet, never pure white.
- **Card White** (#FFFFFF): Reserved for cards and rows that sit on Paper. The tonal step between the two IS the layout.
- **Ink** (#09090B): Body text and values. Full-strength, readable; never gray-for-elegance.
- **Ink Primary** (#18181B): Filled primary-button background (the shadcn-style `primary` token).
- **Ink Muted** (#71717A): Caption labels over values (the small label above a fact), placeholder text.
- **Hairline** (#E4E4E7): Input borders. Row dividers use `black/5` overlay instead — dividers should be felt, not seen.
- **Pressed Fill** (#F4F4F5): Secondary button fill; `black/5` serves the same role as the pressed state on white rows.
- **Warm Gray Deep** (#8A8577): Disclosure chevrons only. The lighter predecessor did not remain visible enough on device. Decorative wayfinding, never text.
- **Destructive** (#EF4444): Swipe-to-delete action background and destructive buttons. The only non-amber saturated color in the app.

### Named Rules

**The Golden Thread Rule.** Amber appears only on things that are interactive or identity-bearing (add actions, tints, avatars, selection). Amber as decoration — backgrounds, dividers, flourishes — is forbidden.

**The Paper Rule.** Screens sit on Paper (#F9F7F4); pure white is earned by being a card. Never place a screen on #FFFFFF and never place a card on a card.

## 3. Typography

**Display Font:** System (SF Pro on iOS, Roboto on Android)
**Body Font:** Same — one family, the platform's own
**Label/Mono Font:** None

**Character:** The platform's voice, unmodified. Warmth comes from color and copy, not from a typeface. Note: the Uniwind rem polyfill sets **1rem = 14px** (NativeWind legacy), so Tailwind size classes render smaller than web defaults — `text-base` is 14px, not 16px.

### Hierarchy

- **Title** (700, ~34px, system-rendered): Native large-title headers ("People", person name). Owned by the platform; never hand-rolled.
- **Headline** (500 medium, 1.125rem ≈ 15.75px): Person names in list cards, fact values and date labels on the person screen, button text at `lg` size.
- **Body** (400, 1rem = 14px): Notes, row detail lines, section headers above card groups (medium weight, sentence case). Selectable where it's user data.
- **Label** (400, 0.875rem ≈ 12.25px, Ink Muted): The caption above a fact value ("Favorite coffee"). Sentence case, never uppercase-tracked.

### Named Rules

**The System Voice Rule.** No custom or display fonts, ever. If a screen needs more hierarchy, use weight and the tonal Paper/White step, not a new typeface.

## 4. Elevation

Whisper elevation. Depth is carried first by tone (white cards on warm Paper) and second by a single, barely-there warm shadow. Anything darker or larger reads as a different, louder app.

### Shadow Vocabulary

- **Whisper** (`box-shadow: 0 1px 3px rgba(28, 20, 8, 0.06)`): The only shadow in the app. Applied to cards and card-like groups sitting on Paper. Note the warm-tinted shadow color — it's shadow of the Paper world, not neutral black.

### Named Rules

**The Whisper Rule.** One shadow token exists. If a surface needs more separation than Whisper provides, the answer is layout (spacing, tonal grouping), never a bigger shadow. If it looks lifted, it's wrong.

## 5. Components

Native and quiet: system components wherever the platform has one (sheets, headers, swipe actions, date pickers), and this vocabulary for the custom layer.

### Buttons

- **Shape:** Gently rounded (0.375rem), 48px tall on native
- **Primary:** Ink Primary (#18181B) fill, near-white (#FAFAFA) medium text — deliberately _not_ amber; amber is for accents, primary actions are calm ink
- **Pressed:** Opacity drop to 90% (fills) or Pressed Fill background (ghost/outline); no scale effects, no springs
- **Destructive:** Destructive (#EF4444) fill, same geometry
- **Outline / Secondary / Ghost:** Hairline border on white / Pressed Fill / transparent with pressed fill — same shape family throughout

### Cards / Containers

- **Corner Style:** 1rem (14px) radius with `borderCurve: 'continuous'` — the squircle curve is part of the identity
- **Background:** Card White on Paper, always
- **Shadow Strategy:** Whisper only (see Elevation)
- **Border:** None
- **Internal Padding:** 1rem (list cards); grouped rows use 1rem horizontal / 0.75rem vertical

### Inputs / Fields

- **Style:** Card White fill, Hairline (#E4E4E7) border, 0.375rem radius, 48px tall
- **Placeholder:** Ink Muted
- **Disabled:** 50% opacity
- **Pickers:** Always the platform's own (SwiftUI date picker on iOS, M3 DatePickerDialog on Android)

### Entry Row (signature component)

The atom of the person screen, in two forms. **Fact row:** optional Ink Muted label (0.875rem) above an Ink value (1.125rem). **Date row:** the timeline's row language — a `w-11` day-number-over-short-month block (semibold Ink day, muted month) beside a prominent label (1.125rem medium), with a muted year + age detail line ("2019 · turns 8", counted at the next occurrence) when the year is known; always the literal date, never today/tomorrow relative form. Both: tap to edit (pressed state `black/5`), swipe left to reveal an 80px-wide Destructive delete action, `black/5` hairline dividers between rows. The "Add …" foot row pairs a Noodle Gold plus-circle icon with a Broth label — the Golden Thread marking the primary action of every card. The Facts card's title row carries a small Broth sort glyph on the right with a SwiftUI menu on iOS and a HeroUI popover on Android.

### Avatar

A Cream Swirl circle in four sizes: 40px on timeline rows, 48px on list cards, 72px in the add-person preview, and 96px as the centered identity header on the person screen. Content priority: the person's photo (center-cropped to the circle) → Broth semibold initial → Broth person glyph (no name yet). Photos inherit the initial-avatar geometry exactly — no rings, borders, or badges. Photo management lives in the person screen's toolbar menu (edit name / add, change, remove photo / delete person); tapping the empty initials circle also opens the picker. When a photo exists, tapping or pulling down the compact circle expands that same square crop to full screen width, behind the transparent native header and status bar, and pushes the person's details down; tapping or dragging upward collapses it. Initials and the person glyph never expand. Photo viewing and photo editing remain separate actions.

### Navigation

Native tabs use SF Symbols on iOS and XML drawables on Android. iOS uses a Noodle Gold selected tint; Android keeps the platform-native tab treatment. Stack headers use native large titles with Broth tint and a transparent-on-Paper large style. Quick add lives in a platform-native affordance: a detached, disabled native-tab action on iOS 26+, and an M3 FAB with a Cream Swirl container and Broth icon on Android.

## 6. Do's and Don'ts

### Do:

- **Do** keep every screen on Paper (#F9F7F4) with Card White groups — the tonal step is the layout system.
- **Do** route all interactivity signaling through the amber family: Noodle Gold for icons/tints, Broth for accent text, Cream Swirl for soft fills.
- **Do** use platform components first (sheets, pickers, swipe actions, large titles); reach for custom chrome only when the platform has no answer — and then keep it quiet.
- **Do** use `borderCurve: 'continuous'` on every rounded card.
- **Do** keep body text at full Ink (#09090B); labels may be Ink Muted, values never are.
- **Do** keep pressed states instant and plain: opacity or `black/5`, 150–250ms, nothing choreographed.

### Don't:

- **Don't** let Lapsha look like a **sales CRM (Salesforce, HubSpot)** — no data tables of people, no pipelines, no stat dashboards about relationships.
- **Don't** ship **generic cross-platform** chrome — no web-app-in-a-wrapper components, no identical custom UI on both platforms where native affordances differ.
- **Don't** style person screens like **social network profiles** — no cover photos, follower-style counts, or public-profile layouts; these are private notes.
- **Don't** use Noodle Gold (#F6B756) as text on any surface — it fails contrast everywhere; Broth is the only text amber.
- **Don't** add a second shadow token, darken Whisper, or lift elements on press. If it looks elevated, it's too much.
- **Don't** introduce custom fonts, uppercase-tracked labels, or decorative color. Warmth is amber + copy, never ornament.
- **Don't** nest cards or put white on white — one Paper, one card layer, done.
