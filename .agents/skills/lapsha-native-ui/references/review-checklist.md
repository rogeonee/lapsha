# Lapsha native UI review checklist

Use this checklist for reviews and after UI implementation. Apply only relevant sections; absence of an irrelevant state is not a finding.

## 1. Product task

- Can the user understand the screen's primary job immediately?
- Does capture remain achievable in a few taps and roughly under ten seconds?
- Is recall fast, with the person's content more prominent than app chrome?
- Does the change avoid sales-CRM, public-profile, and generic cross-platform framing?
- Is private, local-first data treated with appropriate restraint?

## 2. Platform authenticity

- Does iOS use familiar stack, toolbar, sheet, menu, picker, and swipe conventions?
- Does Android use appropriate Material/HeroUI patterns rather than copied iOS chrome?
- Is shared behavior separated cleanly from platform presentation?
- Are version gates intentional and supported by observed iOS 18/26 behavior?
- Are invented controls justified by a real native limitation recorded in the project?

## 3. Interaction

- Is the primary action reachable and clear during one-handed use?
- Are interactive targets comfortably tappable and visually identifiable?
- Do tap, long-press, pan, scroll, text selection, and navigation gestures coexist?
- Does pressed feedback communicate state without decorative motion?
- Do sheets and dialogs open, focus, avoid the keyboard, dismiss, and recover reliably?
- Can interrupted or repeated actions produce duplicate saves, trapped overlays, or stale state?
- Are destructive actions clearly named, confirmed when appropriate, and recoverable where possible?

## 4. Content and states

- Are labels, actions, confirmations, and errors concise and specific?
- Are empty states useful without becoming onboarding ceremony?
- Are validation errors shown near the responsible input and is recovery obvious?
- Are loading, saving, disabled, missing-record, and failure states handled where applicable?
- Do long names, labels, values, localized copy, and unknown years remain understandable?
- Are birthday and date semantics consistent with the domain rules?

## 5. Visual system

- Is Paper the screen surface and Card White reserved for grouped content?
- Is amber limited to interactive or identity-bearing roles?
- Is body/value text full-strength Ink and secondary text still readable?
- Are system typography, existing size classes, continuous card curves, and Whisper elevation preserved?
- Are tokens reused instead of hard-coded palette values?
- Do `global.css` and `lib/theme.ts` remain synchronized when tokens change?
- Are cards, dividers, radii, icons, and spacing consistent with nearby screens?
- Is visual warmth coming from content, copy, and the amber system rather than decoration?

## 6. Accessibility and resilience

- Do custom controls expose useful roles, labels, values, hints, and disabled state?
- Is information conveyed by more than color alone?
- Do text growth and larger accessibility sizes avoid clipping, overlap, or unreachable actions?
- Do controls and content remain usable with reduced motion?
- Is important selectable content selectable unless selection conflicts with an intentional gesture?
- Do contrast and legibility hold on the actual device surface and system material?
- Are safe areas, orientation or width changes, and keyboard sizes handled without fixed-screen assumptions?

## 7. Consistency and implementation

- Were all consumers of a changed shared pattern inspected?
- Are intentional platform or screen differences documented or obvious from native convention?
- Does the implementation follow existing hooks, services, component boundaries, and icon sources?
- Are platform shims free of the other platform's runtime imports?
- Does the change avoid unnecessary dependencies, abstractions, memoization, and duplicated state?
- Are known device-tested constraints in `notebook.md` preserved?

## 8. Evidence

- Apply evidence checks at the quick or full depth selected in `SKILL.md`.
- Run the repository's static checks after implementation.
- In a quick pass, verify the primary path and highest-risk regression on one directly affected available platform when practical.
- In a full pass, verify complete interaction paths and relevant state, accessibility, and platform matrices.
- For full platform-sensitive work, compare iOS 18 and iOS 26 rather than generalizing from one.
- For full Android work, use the physical Android device when Android is in scope.
- Record exactly what was tested, along with anything that remains unverified.

## Review output

Lead with the most consequential findings. For each finding, include:

- Severity: P0 critical, P1 high, P2 medium, or P3 minor.
- Concrete evidence and affected screen or interaction.
- User impact.
- A scoped correction that respects existing platform and product decisions.

Then note meaningful strengths and verification gaps. Do not manufacture findings to fill every severity or checklist section.
