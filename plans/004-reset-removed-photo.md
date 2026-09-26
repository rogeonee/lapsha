# Plan 004: Reset presentation when a displayed photo disappears

> Executor: work only in your assigned isolated worktree. The coordinator owns the plan index and device/evidence scheduling. Commit the scoped source change; do not push or merge master.

## Status

- Priority: P2
- Effort: S (hours, plus focused native verification)
- Risk: LOW for the intended state reset; escalate if gesture or navigation architecture must change.
- Depends on: none
- Category: bug
- Planned at: 2835b29fdec6e5d8561d21d495f08dc627d27a8c, 2026-09-25
- Original audit finding: 4

## Why this matters

Expanding a saved avatar changes the header/status bar and Android scrim. Removing that photo replaces it with compact initials, but currently leaves the expansion state active. The header can remain white on the light screen, and a later photo inherits the stale expanded state. Losing the displayed photo must restore the complete compact presentation.

## Current state and conventions

Planning root: /Users/rogeonee/dev/projects/lapsha. Use your assigned worktree for all implementation commands.

src/screens/person/person-screen.tsx owns the shared screen used by both Home and People routes. At lines 127-136 it holds:

~~~ts
const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
const [isPhotoChromeExpanded, setIsPhotoChromeExpanded] = useState(false);
// other menu/scroll state omitted
const photoProgress = useSharedValue(0);
const pullStart = useSharedValue(0);
const pullEligible = useSharedValue(false);
~~~

The resolved photo is avatarUri(person?.avatar), which returns null for missing files. An animated reaction sets chrome expansion when progress crosses 0.22. The Android scrim opacity is 1 - photoProgress.value; the title/status-bar colors depend on isPhotoChromeExpanded. Gesture-end animations can schedule React-state updates through scheduleOnRN.

Removal at lines 246-255 currently is:

~~~ts
const removePhoto = () => {
  if (!person?.avatar) return;
  const previous = person.avatar;
  const response = updatePerson(person.id, { avatar: null });
  if (response.error) {
    Alert.alert('Error', "The photo couldn't be removed. Please try again.");
    return;
  }
  deleteAvatarFile(previous);
};
~~~

src/components/person/person-photo-hero.tsx:92 returns compact initials immediately when photo is null. It does not own/reset the parent's state.

Preserve the current useCurrentDay and useSyncExternalStore preference subscription already integrated on master. Preserve both person-route wrappers and the iOS/Android menu split.

DESIGN.md: "Initials and the person glyph never expand." It specifies Broth header tint and Paper screens, with the expanded photo temporarily occupying the header region. Reuse palette.broth and existing presentation, not new colors or layout.

Read AGENTS.md, PRODUCT.md, DESIGN.md, notebook.md, .agents/skills/lapsha-native-ui/SKILL.md and its review checklist. Known platform decisions: iOS 26+ keeps adaptive glass button tint, older iOS flips buttons white while a photo is expanded; Android uses a separate paper scrim. React Compiler is enabled; avoid manual memoization. Do not change ReduceMotion.Never or other acknowledged animation choices in this plan.

## Scope

Only production file permitted to change:

- src/screens/person/person-screen.tsx

Read-only consumers: src/components/person/person-photo-hero.tsx, person-menu.ios.tsx, person-menu.android.tsx, person-photo-layout.ts, src/lib/avatars.ts, both person route wrappers.

Out of scope: gesture thresholds/geometry, routing, photo persistence, image resizing, menu design, theme tokens, native dependencies/patches, current-day/preference-subscription behavior, reduced-motion policy, personal data and root PRELAUNCH.md/notebook.md.

No new unit test framework or implementation-mirroring test is required for this small native state change. Native evidence is the regression check. Coordinator-owned evidence under plans/evidence is allowed separately.

## Commands

| Purpose | Command | Expected |
| --- | --- | --- |
| Drift | git diff --stat 2835b29..HEAD -- src/screens/person/person-screen.tsx | No unexplained drift |
| Setup, fresh worktree | bun install --frozen-lockfile | Exit 0; lockfile unchanged |
| Types | ./node_modules/.bin/tsc --noEmit | Exit 0 |
| Lint | CI=1 bun run lint -- --no-cache | Exit 0 |
| Existing tests | bun test tests | All pass |
| Whitespace | git diff --check | Exit 0 |
| Device inventory | xcrun simctl list devices available; adb devices | Identify actual available targets |
| Metro | bun run start | Use a coordinator-assigned port and verify which checkout it serves |
| Native build if required | bun run ios --device <verified-UDID>; bun run android --device <verified-device-id> | Matching patched dev client builds/launches |
| iOS interaction stream | bunx serve-sim | Inspect through the Chrome computer-use surface per UI skill |

The angle-bracket device arguments above must be replaced with verified IDs. Do not launch builds for both platforms concurrently against one Metro instance.

## Steps

### 1. Record the reproduction and baseline

Read the current parent state, animated reaction, gesture-end callback, removePhoto error branch, header styles, and child no-photo branch. Use a synthetic person/photo on an available device to reproduce expand -> toolbar Remove photo -> unreadable header if practical before editing.

Verify: TypeScript and lint pass before the change. Inventory confirms which simulator/physical device is being used. Record whether the before-state was observed on-device or established by code inspection.

### 2. Restore the complete compact state on photo loss

Implement a small reset in the shared screen, triggered when the resolved photo becomes absent. Do not reset merely on every non-null photo URI change: changing one photo for another should preserve the existing viewing behavior.

The reset must cancel an in-flight photoProgress animation, zero photoProgress and pullStart, invalidate pullEligible, and clear expansion/chrome React state. Ensure a late scheduled expansion callback cannot keep a no-photo screen visually expanded. Derive visible header/menu/status-bar appearance from photo presence as well as chrome state where necessary; Android's no-photo scrim must be fully opaque. Keep shared-value writes outside render and use the existing React/Reanimated APIs, not a new state machine.

An unsuccessful database removal must leave the existing photo and its presentation intact. Keep the existing error alert and file-deletion ordering. A missing file (avatarUri returns null) must show readable initials too. The first added photo after removal starts compact and can expand/collapse normally.

Verify: TypeScript, lint, and git diff --check pass. Read git diff -- src/screens/person/person-screen.tsx and confirm the failure return remains before destructive success-only effects and unrelated calendar/preference code is unchanged.

### 3. Run the focused native regression

Select quick verification depth under the Lapsha UI skill for this local state correction. Do not expand it into a redesign or full OS/accessibility matrix. If implementation turns into a gesture/navigation architecture change, stop and let the coordinator reassess scope and full verification.

Exercise on one available iOS simulator and the authorized physical Pixel:

1. Compact photo -> expand -> remove: compact initials, readable header/status bar/menu; Android paper scrim restored.
2. Remove during or immediately after an expansion/collapse animation, repeat: no delayed return to white/no-photo chrome.
3. Add another photo after removal: starts compact; tap and pull still expand/collapse.
4. Replace one existing photo with another: does not unintentionally reset a valid viewing state.
5. Cancel the picker and return: no presentation change.
6. Initial no-photo and missing-photo fallback: compact readable presentation.
7. Confirm by code review that a service-error return does not reset or delete the existing photo. Only use actual failure injection if a safe disposable QA setup is already available; distinguish review evidence from device evidence.
8. Open the shared person screen once from each originating tab and check back navigation.

At planning time iOS 18.0 and 27.0 simulators are available; no iOS 26 runtime is installed. Prefer current iOS 27 for the quick pass; do not claim an iOS 26 check. The Pixel was disconnected, and the user said they will connect it for verification. Continue non-device work meanwhile.

Use only synthetic records/photos; do not remove existing personal photos, erase a simulator, clear all app data, or replace an existing QA prototype. Coordinate before booting/building. Capture screenshots only of synthetic data to an ignored .expo/qa directory. Record exact platform/OS/build/checkouts.

Verify: all applicable cases have explicit observed outcomes in coordinator-written plans/evidence/004-photo-reset.json. If Android remains unavailable, mark that check pending and keep the plan's verification status explicit; do not use an emulator as a substitute.

### 4. Final static regression and handoff

Run bun test tests, TypeScript, lint, and git diff --check. Submit the full scoped diff and commit to the coordinator.

Verify: all static commands exit 0; git diff --name-only 2835b29..HEAD in the isolated branch names only the allowed source file (apart from coordinator-approved inherited changes).

## Test plan

Use the exact native cases in step 3 as the regression test, plus the unchanged automated suite, lint, and typecheck. A source-text assertion or mocked animation test cannot establish header/gesture correctness. Do not introduce a unit framework for this change. The coordinator stores actual device evidence and distinguishes reviewed failure branches from exercised failures.

## Done criteria

- [ ] Static/type/lint/existing test commands pass.
- [ ] Native cases 1-6 are observed on the available iOS simulator and connected physical Android device, or the coordinator records a user-approved reduced verification scope without overstating it.
- [ ] Both originating tab routes retain navigation behavior.
- [ ] Failure-path code review confirms unsuccessful removal preserves the photo and presentation.
- [ ] Only person-screen.tsx changes; no dependency or native-patch changes.
- [ ] Coordinator evidence records each case, platform, result, screenshots where useful, and remaining limits.

## Git workflow

Branch codex/reset-removed-photo. Commit message example: "fix: reset expanded photo state after removal".
Do not push or merge into the user's branch. Send commit SHA, worktree, commands, device evidence, and any gaps to the coordinator.

## STOP conditions

- Drift changes how photos, menus, current-day state, or preference subscriptions are owned.
- Correctness would require changing gesture design or files outside scope.
- A reset causes render loops or stale UI-thread callbacks that cannot be resolved within a small scoped change.
- Two focused repair attempts fail the same gate; report the evidence.
- Device verification would require destroying user data or modifying an unrelated installed QA app.

## Maintenance

Photo availability and expansion must remain consistent. Future photo loading/restoration should preserve the invariant that no displayed photo means compact/readable chrome. Review both JS state and Reanimated progress/callbacks; resetting one boolean alone does not fix the bug.
