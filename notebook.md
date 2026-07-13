# Notebook

A shared scratchpad for agents. It is not a spec: `AGENTS.md` owns product/state, `CLAUDE.md` owns technical guidance, and `PRODUCT.md` / `DESIGN.md` own product and visual direction.

Record only non-obvious decisions, device-tested traps, and context that cannot be recovered quickly from the code. Keep entries short, date them, and prune them when the implementation changes. Git already records routine work.

---

## Decisions

- **2026-07-12 — Person rows share the timeline's visual language.** Dates use a day/month block plus `formatDateDetail`; facts use label-over-value rows. Dates have one UI order (birthday pinned, then date added), while only facts expose created/modified sorting. The 72px initial avatar is an identity marker; the native title remains the person's name rather than turning the screen into a social-style profile.
- **2026-07-02 — Add person is platform-native.** iOS uses a native modal and `Stack.Toolbar`; Android uses the same route as a transparent host for a HeroUI sheet because React Native Screens `formSheet` rendered full-screen. Shared state/save logic lives in `use-add-person-form.ts`; the birthday picker and switch are platform-split.
- **2026-06-10 — Uniwind (Tailwind v4) replaced NativeWind.** Theme variables live in `global.css`; Metro uses `withUniwindConfig` with `polyfills: { rem: 14 }`. Removing that polyfill silently enlarges rem-based sizing. `group-*` and `peer-*` are Uniwind Pro-only and otherwise no-op.
- **2026-06-10 — Android uses HeroUI Native; iOS uses SwiftUI-native controls.** `HeroUINativeProvider` is Android-only. Entry sheets are platform-split, with form/save behavior shared in `use-entry-form.ts`; `entry-sheet.tsx` remains a type-only shim because TypeScript does not resolve Metro platform suffixes.
- **2026-06-10 — HeroUI owns `accent` and `muted`; Lapsha owns the neutrals.** Overrides must follow HeroUI's import in `global.css`. Set brand amber on both `--color-accent` in `@theme` and raw `--accent` / `--accent-foreground` in each theme variant, or HeroUI pressed states stay blue.
- **2026-06-09 — `sort_order` is reserved for future manual ordering.** Schema v2 backfilled it for facts and dates, but the current UI does not read it.

## Gotchas

- **2026-07-12 — Keep person-row text outside Android swipe animation nodes.** Under Fabric, translating the row tree made text selectable or disappear and could leave a stale gesture graph after Fast Refresh. `entry-row.tsx` keeps content stationary and reveals a fixed 80px action with `Gesture.Pan`. Force-stop the development build after changing gesture implementations; HMR is not a reliable verification pass.
- **2026-07-12 — `Stack.Toolbar` menus have Android-specific traps.** Inline submenu titles disappear and leave a stray divider, so inline groups stay iOS-only. Android hard-tints menu items with the toolbar tint; tint the toolbar ink and the trigger amber separately. The menu rejects fragments, so pass an array of `MenuAction`s. See `screens/person/person-screen.tsx`.
- **2026-07-02 — A route-mounted HeroUI sheet needs three guards.** Start closed and open from the content's first `onLayout`; ignore the initial spurious `onOpenChange(false)` until opening begins; close with `canGoBack() ? back() : replace('/')` for deep links. See `add-person-sheet.android.tsx`.
- **2026-07-01 — Android keyboard avoidance belongs to `react-native-keyboard-controller`.** Drive resizable sheet padding from `useReanimatedKeyboardAnimation()` (`height` is negative while open), and start autofocus shortly after the sheet's `onAnimate` begins so sheet and keyboard motions overlap. Gorhom's keyboard height resolves to zero under the root `KeyboardProvider`. `softwareKeyboardLayoutMode: "pan"` is ignored on Android 15+ but can double-shift manual padding on Android 14 and below; retest there if those versions become targets.
- **2026-06-10 — Light mode requires two locks.** Keep `Appearance.setColorScheme('light')` and `Uniwind.setTheme('light')` together in `app/_layout.tsx`; cold starts can otherwise render HeroUI dark even when hot reload looks correct.
- **2026-06-10 — Shared icons cannot use `expo-image` `sf:` sources.** Android Glide silently rejects them. Use `components/ui/icons.tsx`; Android `Stack.Toolbar` icons require `require()`d XML drawables.
- **2026-06-10 — Do not put HeroUI `Select` inside the entry sheet.** Its popover, dialog, and nested-sheet presentations all failed on-device. The inline expanding person list is deliberate.
- **2026-06-10 — HeroUI BottomSheet requires a false-to-true open transition.** Keep it mounted closed and gate its content; mounting it already open can leave it permanently closed without an error.
- **2026-06-10 — M3 `DatePickerDialog` returns UTC-midnight milliseconds.** Read with `getUTC*()` to avoid a one-day shift in western timezones. Every Jetpack Compose view, including dialogs, must be a direct child of `<Host>`.
- **2026-06-13 — A disabled native-tab trigger does not emit `tabPress`.** It emits `onTabSelectionPrevented` through `NativeTabs.unstable_nativeProps`; this is how the iOS 26 detached quick-add tab opens without selecting a route.
- **2026-06-10 — SwiftUI may reuse TextFields across the fact/date switch.** If placeholders become stale, give the two tab bodies distinct native view identities.
- **2026-06-09 — Stamp `PRAGMA user_version` inside each migration transaction.** A Fast Refresh once stamped v2 without applying it. `migrate()` still self-heals that exact schema mismatch; keep the repair until old development databases no longer matter.
- **2026-06-09 — Keep the iOS quick-add sheet at one medium detent.** Autofocus expands a multi-detent sheet to its largest detent.
