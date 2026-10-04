---
name: lapsha-native-ui
description: Design, shape, implement, review, polish, or harden Lapsha's native mobile interface. Use for UI, UX, interaction, accessibility, visual-system, navigation, forms, sheets, gestures, animation, empty-state, and platform-adaptation work in this repository. Covers Expo Router and React Native surfaces plus Lapsha's SwiftUI iOS and HeroUI Native/Jetpack Compose Android implementations. Do not use for backend-only or data-service work.
---

# Lapsha Native UI

Build and evaluate Lapsha as a warm, personal, platform-native mobile app. Treat the repository's product and design documents as the source of truth; this skill supplies the workflow, not a second copy of those decisions.

## Load context

Before acting:

1. Read `PRODUCT.md` and `DESIGN.md`.
2. Follow `AGENTS.md` and read the relevant entries in `notebook.md`.
3. Inspect the target screen or component and its surrounding route.
4. Search for other consumers of any shared interaction or visual pattern that may change.
5. Inspect the existing platform-specific implementation before proposing a shared abstraction.

Use `building-native-ui` or `heroui-native` only when current framework or component API guidance is needed. Lapsha's repository instructions and tested platform decisions override generic guidance.

## Select the workflow

Infer the workflow from the request; do not require a command vocabulary.

### Review

For critique, audit, or assessment requests:

- Do not edit unless the user also asks for changes.
- Read [references/review-checklist.md](references/review-checklist.md) completely.
- Inspect code and obtain device or rendered evidence at the selected verification depth.
- Report evidence-backed findings in priority order.
- Respect accepted tradeoffs and avoid unrelated issues.

### Shape

For planning or design-direction requests:

- Establish the user's task, entry point, success state, and failure states.
- Define shared behavior first, then the appropriate iOS and Android presentations.
- Reuse existing patterns unless a concrete UX improvement justifies divergence.
- Cover loading, empty, error, destructive, keyboard, and interrupted states when relevant.
- Produce an implementation-ready brief, not mood-board language.
- Ask only when a missing decision would materially change the result.

### Implement

For build, redesign, polish, or hardening requests:

1. Form a brief platform-aware approach from the existing product and design context.
2. Implement the complete requested behavior.
3. Keep shared behavior in hooks or shared logic and platform presentation in platform files.
4. Reuse theme tokens and shared components; do not introduce a parallel visual vocabulary.
5. Read [references/review-checklist.md](references/review-checklist.md) completely and run the relevant checks.
6. Iterate on problems found during verification.

## Select verification depth

State the selected depth before verification. Use **quick** unless the user asks for full verification or the work meets the full criteria below.

Text-size and display-zoom coverage is separate from functional verification depth. During feature iterations, check at the default scale, even when platform risk warrants broader interaction testing. Reserve the full scale matrix for full end-to-end runs. Outside those runs, exercise an additional scale only when the user requests it or it is needed to reproduce and verify a scaling-specific bug. Restore the device's original settings after changing them.

### Quick

Use during active implementation, early reviews, and routine polish:

- Inspect the target, relevant shared consumers, and affected platform implementations.
- Run `bun run lint` after code changes.
- Exercise the changed interaction on one directly affected available device or simulator when practical.
- Check the primary success path and the most likely regression or failure state.
- Stop when there is enough evidence to guide the next iteration.

Do not expand a quick pass into exhaustive OS, accessibility-setting, or state-matrix coverage. Report the exact limited coverage and any risks deferred to full verification.

### Full

Use when the user requests it, the feature or surface is nearly finished, the work is being prepared to ship, or the change carries substantial platform risk. Navigation architecture, native modules, gestures, sheets, keyboard behavior, accessibility foundations, and OS-version gates commonly justify full verification.

- Run all relevant checklist sections and static checks.
- Exercise complete success, cancellation, dismissal, failure, interruption, and recovery paths.
- Check accessibility semantics, reduced motion, safe areas, and keyboard behavior when relevant; apply the scale coverage rule above for text size and display zoom.
- Discover installed iOS runtimes with `xcrun simctl list runtimes`. For version-sensitive behavior, test both sides of relevant OS gates and the newest installed runtime: iOS 18/26 for a gate at 26, and iOS 26/27 for a gate at 27, as applicable. Report unavailable coverage.
- Use the authorized physical Android device when Android is in scope.
- Rebuild, cold-start, or force-stop where `notebook.md` says Fast Refresh is insufficient.

## Lapsha-specific priorities

Apply these priorities when tradeoffs compete:

1. Capture and recall speed.
2. Familiar native behavior on each platform.
3. Clear, readable personal content.
4. Consistency with Lapsha's restrained visual system.
5. Delight only when it does not add friction or decoration.

Preserve these architectural boundaries:

- Use Expo Router and native stack/tab affordances.
- Prefer Uniwind classes; use native styles where the API requires them.
- Keep the mirrored theme tokens in `global.css` and `lib/theme.ts` synchronized.
- Use SwiftUI/native toolbar surfaces on iOS where established.
- Use HeroUI Native and Jetpack Compose surfaces on Android where established.
- Do not force identical presentation across platforms.
- Do not introduce web-only behavior or treat web as a verification target.

## Device rules

- Use available, authorized simulator controls or a `bunx serve-sim` stream in an available browser to inspect and interact with iOS. Native screenshots or recordings can supply visual evidence; interaction claims require exercising the flow. Chrome is optional, and its absence alone does not require new permission to use an authorized alternative.
- Prefer the authorized physical Android device. If none is connected and Android verification is required, ask the user to connect it; do not silently substitute an emulator.
- Report exactly which platforms and OS versions were exercised.
- Distinguish static inspection from device verification and state any unverified scope.
