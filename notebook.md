# Notebook

Keep non-obvious decisions and device-tested traps here. [AGENTS.md](AGENTS.md) owns engineering conventions; [PRODUCT.md](PRODUCT.md) and [DESIGN.md](DESIGN.md) own product and visual direction. Use [README.md](README.md#task-to-code-map) to find implementations and [PRELAUNCH.md](PRELAUNCH.md) for release status.

Date entries, keep the reason and revisit condition, and prune obsolete guidance. Git and PRs retain investigation and verification history.

## Accepted decisions

- **2026-10-16 — Master delivers to the beta audience.** The EAS beta workflow uses the `beta` build/submit profile and channel for Play internal/completed and internal TestFlight. Keep the production channel separate for future public builds. Fingerprint compatibility and successful distribution checkpoints decide native builds versus OTA; native build completion alone is insufficient. Activation and rollback are documented in [the delivery runbook](docs/releases/ota.md).

- **2026-10-11 — Keep read-error recovery simple.** [PR #40](https://github.com/rogeonee/lapsha/pull/40)'s section errors and Try again behavior are accepted. Retry rereads SQLite; it does not repair data. Defer richer failed-retry feedback and guided recovery until a real report establishes the need.

- **2026-10-11 — Photos follow platform backup rules.** iOS retains default photo eligibility. Android cloud backups omit person and gift photos to protect the quota; supported direct transfers include them on Android 9+, while older versions omit them from both modes. Both SQLite stores live in `files/SQLite/`, not the `database` backup domain; SecureStore was removed because its shared-preferences-only rules excluded them, so reassess backup rules before re-adding it. Android 9–11 includes replace defaults: add future persistent `files/` directories explicitly in [the backup plugin](plugins/with-android-backup.js). Rule changes require native regeneration and a rebuild. Restore/transfer verification remains deferred to the friends beta; device verification was waived for this policy revision.

- **2026-10-03 — Gifts use the system camera with confirmation.** Android uses ImagePicker so the phone supplies camera controls and retake. The extra confirmation is accepted. Photos save before optional details; removing the last photo or details may leave an existing idea blank, but creating one still requires content. Keep that distinction in both `use-entry-form.ts` and `use-gift-editor.ts`.

- **2026-09-10 — February 29 anniversaries fall on March 1 in non-leap years.** Projection must not change the stored month/day. Unknown-year storage and picker conversion rules are in AGENTS.md and `src/lib/dates.ts`.

- **2026-10-16 — Preserve the accepted beta scope.** Export/import and full OS restore/transfer testing remain deferred. Search, manual ordering, a separate Notes section, dark mode, notifications, sync/accounts, pre-iOS-26 global quick add, gift link previews, and share-sheet capture need not block the small beta. Dates appear in Upcoming without sending notifications. The accent-contrast tradeoff remains accepted for beta; DESIGN.md records its public-release revisit. Font/Dynamic Type/display-scaling sweeps were excluded from the October verification scope by user request.

## Native patches and builds

Current patch filenames and versions are defined once in [package.json](package.json)'s `patchedDependencies`. All native patch changes require rebuilding the affected app; Fast Refresh cannot apply them.

- **2026-07-15 — Keep the iOS TextField backspace patch.** Rapid software-keyboard deletion in prefilled fields crashed iOS 18 even with upstream's clamped binding. The `@expo/ui` patch restricts selection-enabled fields to iOS 26+; selection APIs below 26 are unused by Lapsha. JavaScript-side workarounds (modifier identity, Form/VStack hosting, detents) all failed; the crash is native. Recheck rapid deletion in name/fact/date fields after dependency upgrades. Hardware-keyboard deletion is not an adequate reproduction.

- **2026-10-16 — Use upstream tab prominence on SDK 58.** Screens now owns the `UITab` implementation and selection delegates; the native patch is removed. Set `unstable_nativeProps.ios.prominentScreenKey` to `quick-add` on iOS 27+, keeping the search role only on iOS 26. The key is the trigger name, not Router’s route key. Revisit when Router exposes a stable prominence prop. Disabled quick-add taps still use the trigger’s `tabPress` listener: Router overwrites a host `onTabSelectionPrevented` callback.

- **2026-10-16 — SDK 58 generates scenes by default.** The SDK 57 `enableSceneSupport` opt-in and otherwise unused build-properties plugin are removed. Regenerate both native projects when upgrading; iOS must contain `SceneDelegate.swift` and its scene manifest.

- **2026-10-03 — Keep both Android activity-result patches together.** The `expo-modules-core` patch persists request state before launching an external activity, because process death need not run destruction callbacks. The `expo` patch waits for `ReactHost.start()` outside the lifecycle mutex before forwarding results: a nonnull ReactContext can still lack registered listeners. Recheck interrupted confirmation, cancellation, and the next normal capture after upgrades. Recovery retains Expo's five-minute expiry. Before adding file/directory picking, reassess registry serialization of its `initialUri`; current ImagePicker inputs are serializable.

- **2026-10-16 — HeroUI’s emitted input refs need Strict API types.** Version 1.0.10 fixes its source refs but still publishes legacy `TextInput` refs in four declarations. A types-only patch uses `TextInputInstance` for Input, InputGroup, SearchField, and TextArea. Revisit on the next HeroUI release; retain Expo’s Gesture Handler 3 recommendation while verifying sheets because HeroUI still declares a v2 peer range.

- **2026-10-16 — SDK 58 bundled fonts need the shared asset registry.** The release APK silently lost all Android tab icons because expo-asset’s public React Native `AssetRegistry` import was undefined. Its patch uses `react-native/asset-registry`, the same entry point Metro uses to register assets, in source and built output. Revisit when upstream fixes public-registry access; verify outline/filled icons after a cold start.

- **2026-09-18 — Align Expo native dependencies before rebuilding.** Precompiled-module mismatches caused iOS launch-time missing symbols and Android Observe artifact-resolution failures; clean prebuilds alone did not help. Use `bunx expo install --fix`, inspect lockfile/autolinked versions, then rebuild and reinstall. Avoid independently bumping `expo-modules-core` with `bun update`.

- **2026-10-03 — Regenerate native output when switching Lab variants.** `APP_VARIANT=gifts-lab` gives Android and iOS separate app identities. Generated folders retain that variant until regenerated. Keep explicit development schemes distinct and `addGeneratedScheme: false`; an old QA app's shared scheme previously opened the wrong binary. Pass `--device <udid>` to scripted iOS runs to avoid an invisible simulator-selection prompt.

## Data and capture

- **2026-09-12 — Hermes can mix old and new device timezones.** On Pixel 6 / Android 17, local Date operations stayed inconsistent after a timezone change even when fresh Intl formatting reported the new zone. Carry civil year/month/day fields from explicit-zone Intl formatting and use UTC calendar arithmetic. Converting them back to local-midnight Dates reintroduces wrong relative groups and ages.

- **2026-10-03 — Separate gift recovery from avatar picking.** Gift camera/gallery requests share a dedicated marker (`library.pending`) so ImagePicker's pending result cannot turn an avatar into a gift. Clear the marker on launch rejection or cancellation; retain the selected-asset journal when preparation/staging fails. Startup and a restored capture route must await the same recovery promise before launching another picker; only a route mounted during startup consumes the recovered gift. See [capture persistence](docs/prototypes/gifts.md#persistence-and-recovery).

- **2026-10-11 — Camera recovery differs between debug and release builds.** Interrupted confirmation lost results in the debug client but passed four confirmation trials in a standalone release APK. That does not establish Play-signed recovery coverage; reproduce on the affected distributed build before changing the recovery design.

- **2026-07-13 — New avatar filenames prevent stale image caching.** Store bare filenames because iOS container paths change; write a new UUID filename on replacement because expo-image caches by URI. Delete the old file only after the database update succeeds. Synchronous file helpers and capture journals must use `moveSync`, `copySync`, and `writeSync`; their unqualified counterparts return promises on SDK 58.

- **2026-10-16 — ImagePicker owns camera permissions.** Its library manifest declares CAMERA, and `cameraPermission: false` would block it for every package, breaking gift capture. Keep `microphonePermission: false` so RECORD_AUDIO stays blocked; regenerate native output and inspect final permissions after changes. The unused expo-camera dependency was removed.

## Sheets and navigation

- **2026-07-02 — HeroUI sheets need a mounted, closed starting state.** Opening on mount can silently fail. The route-mounted add-person sheet requests open after layout and retries `snapToIndex(0)` until animation starts. Ignore an initial close only before requesting open; every subsequent close must pop the transparent route, with a root fallback for deep links, or an invisible overlay can trap input. Android's native `formSheet` previously rendered full-screen, which is why this route uses HeroUI.

- **2026-10-04 — Replace closed entry-sheet content before gift navigation.** On Pixel, waiting only for `onChange(-1)` let the sheet resurface after an external camera activity. Retain the form through dismissal, clear/remount its closed content, then navigate after the replacement's layout with a generation guard. Keep the sheet root mounted for HeroUI's required false-to-true transition.

- **2026-09-11 — Use sheet-aware scrolling for overflow.** Android's React Native ScrollView lost gestures to the sheet; use `BottomSheetScrollView` with dynamic sizing off and keyboard padding inside its content. Compact forms remain fitted; overflow uses a bounded sheet. iOS overflow uses SwiftUI ScrollView and medium/large detents; its hand-laid VStack cards are deliberate because SwiftUI `Form` cannot take the theme cleanly. The inline person list is deliberate: HeroUI Select's nested presentations failed on-device. SwiftUI `.infinity` does not cross the bridge; a large finite maxWidth supplies fill behavior.

- **2026-07-01 — Keyboard-controller owns Android avoidance.** Gorhom's keyboard height resolved to zero under KeyboardProvider. Use `useReanimatedKeyboardAnimation()` (negative height while open), and autofocus after sheet animation starts. The configured `pan` mode may double-shift padding on Android 14 and below; check this when verifying those OS versions.

- **2026-10-16 — SDK 58 owns removal prevention in Router.** The gift editor protects dirty details while editing, clears prevention on save/discard, and calls the callback’s `repeat()` to continue the blocked action. Redispatching the old action while prevention remains active blocks it again. This replaces the SDK 57 stable-guard workaround. Loading the initial record once still prevents soft deletion from unmounting navigation effects before returning.

- **2026-10-11 — Keep the person screen shell mounted through read errors.** Remounting its ScrollView on retry shifted the avatar beneath the iOS 18 transparent header. Render errors inside the existing shell, keep fact/date failures section-local, and explicitly invalidate retries for React Compiler.

## Rendering and controls

- **2026-10-10 — Keep pre-26 person-header blur mounted.** Switching native blur at the photo threshold caused a visible snap. Drive Blur intensity/opacity from photo progress inside native `headerBackground`; a negatively offset content backdrop gets clipped. Use measured `useHeaderHeight` for iOS overlap, never fixed safe-area arithmetic; Android edge-to-edge content must not receive that negative offset. Keep iOS 26+ on system header treatment.

- **2026-07-13 — Gate person-header chrome by iOS version.** Liquid-glass buttons wash out when forced white, so only pre-26 buttons change tint over the expanded photo. Inline toolbar-menu groups leave chunky gaps on iOS 18; use a flat list there. `Stack.Toolbar.Menu` rejects fragments: pass action arrays.

- **2026-06-10 — SwiftUI may reuse TextFields across entry kinds.** If placeholders go stale after switching Fact/Date/Gift, give each body a distinct native view identity.

- **2026-07-15 — Android uses a custom collapsing header.** The classic native header ignored large-title props. Keep the shared `use-collapsing-header` implementation until a supported Router/native-stack path provides the behavior. Its collapse threshold depends on the screens' content padding; change them together. Android overflow/sort menus use HeroUI because native toolbar menus could not match the theme and left a gray frame.

- **2026-07-12 — Keep row text outside swipe animation nodes.** Translating the Android row tree under Fabric made text selectable or disappear. Keep content stationary and reveal the delete action. Force-stop after changing gesture implementations; Fast Refresh can retain a stale gesture graph.

- **2026-10-16 — Use native presses inside swipe rows.** On SDK 58, iOS 18 could reveal Delete and fire React Native Pressable's edit action from the same fast swipe, with both legacy and hook-based gestures. Gesture Handler's Pressable cancels the competing tap natively. Keep the hidden Delete button disabled. Explicitly making presses wait for the pan blocked ordinary Android taps; native cancellation passed on both platforms.

- **2026-10-03 — Read shared values directly inside animated style mappers.** Hiding every `.get()` in a captured helper left photo-viewer styles unsubscribed despite gesture state changing. Read values in the mapper and pass them into geometry helpers.

- **2026-10-03 — Android photo-viewer status bars need keyboard-controller coordination.** Its override updates the activity but misses Modal windows. Temporarily disable the controller, wait before showing the Modal, reapply light icons in `onShow`, and restore the prior enabled state on unmount.

- **2026-06-10 — Preserve both light-mode locks and HeroUI color overrides.** Cold starts need both `Appearance.setColorScheme('light')` and `Uniwind.setTheme('light')`. Overrides follow HeroUI's CSS import; set both Tailwind `--color-accent` and raw `--accent` / `--accent-foreground` or pressed states stay blue. Keep the rem polyfill at 14; `group-*` and `peer-*` require Uniwind Pro.

- **2026-07-15 — Pin Android tab appearance and use vector icon pairs.** Unset appearance slots fall back to wallpaper colors. MaterialCommunityIcons provides the outline/filled pairs missing from bundled Material Symbols. Shared `expo-image` `sf:` sources fail silently on Android; use the shared icon components. Compose controls, including date dialogs, must be direct children of Host.
