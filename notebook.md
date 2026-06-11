# Notebook

A shared scratchpad for Claude and other agents. Not a spec — `CLAUDE.md` (technical) and `AGENTS.md` (product/state) hold the canonical rules. This is for the softer stuff: decisions and their _why_, gotchas that cost time, product direction, and context that isn't obvious from the code.

**How to use it:** append entries when something is worth a future agent knowing — a non-obvious decision, a trap you hit, a product call. Keep entries short (a few lines). Date them. Prune what goes stale. Don't log routine work; git already does that.

---

## Decisions

- **2026-06-10 — Styling engine is Uniwind (Tailwind v4), NativeWind is gone.** Pure JS, no Babel preset, no `tailwind.config.js` — theme lives in `global.css` (`@theme` + `@layer theme` `@variant light/dark` blocks). Metro: `withUniwindConfig` with `polyfills: { rem: 14 }` (Uniwind defaults to 16px rem; NativeWind used 14 — dropping the polyfill silently grows every rem-based size). `group-*`/`peer-*` variants are Uniwind **Pro-only** (parse but no-op) — don't reintroduce them.
- **2026-06-10 — Android UI is HeroUI Native (1.0.4, stable, pinned exact), iOS stays native SwiftUI.** `HeroUINativeProvider` mounts Android-only via `components/ui-providers(.android).tsx`, so iOS ships zero HeroUI JS. The entry sheet is platform-split: `entry-sheet.ios.tsx` (SwiftUI, verbatim) / `entry-sheet.android.tsx` (HeroUI BottomSheet + Select + Tabs + M3 `DatePickerDialog` from `@expo/ui/jetpack-compose`); shared state/save logic in `use-entry-form.ts`. `entry-sheet.tsx` is a type-only shim — tsc has no platform moduleSuffixes; Metro never bundles it.
- **2026-06-10 — Theme tokens: HeroUI owns `accent` and `muted`, we own the neutrals.** Our `background`/`foreground`/`border` overrides come after HeroUI's import in `global.css`, so its components adopt the Lapsha palette; `--color-accent` is re-pointed to brand amber **in `@theme`** (HeroUI maps tokens there — variant-level overrides don't reach it). Android quick add = M3 FAB (`components/quick-add/quick-add-fab.android.tsx`) as a NativeTabs sibling overlay; `Stack.Toolbar`/`Menu`/`MenuAction` work on Android as Compose dropdowns but need `require()`d XML drawable icons (`assets/icons/`), not SF Symbol names.
- **2026-06-09 — Facts/dates core loop landed.** Schema v2: `facts.label` is now nullable (plain-text facts) — required a table rebuild since SQLite can't drop NOT NULL; both `facts` and `dates` gained `sort_order` (backfilled by `created_at`), reserved for future drag-n-drop custom ordering. Current sort modes are 'created'/'modified', stored globally in `expo-sqlite/kv-store` (`sort.facts`, `sort.dates`; also `lastPersonId` for quick add — see `lib/prefs.ts`).
- **2026-06-09 — UI refresh via SQLite update hook, not focus effects.** `lapsha.db` opens with `enableChangeListener: true`; `useTableVersion(tables)` bumps a counter on writes and screens _derive data during render_ from sync services (no setState-in-effect — the React Compiler lint rule rejects that pattern). The quick-add sheet isn't a route, so focus effects alone could never refresh after it saves.
- **2026-06-09 — `'birthday'` is a reserved date label** (matched case-insensitively, pinned first by `getDatesByPerson`). Same trick as notes (`label="note"` facts). Person screen shows an "Add birthday" placeholder when missing.
- **2026-06-09 — One EntrySheet for everything.** Add/edit of facts and dates all go through `components/entry/` (platform-split since 2026-06-10, see above). Quick add triggers from `NativeTabs.BottomAccessory` — **iOS 26+ only, alpha API** (Android uses the FAB). NativeTabs has no real '+' tab-bar button API (tab presses can't be intercepted), the accessory is the closest native thing.
- **2026-06-09 — BottomAccessory gotcha: the system renders TWO copies of the accessory component** (one per placement, 'regular' above the tab bar and 'inline' docked beside the minimized bar) **and component-local state is not shared between them.** Keep accessory content stateless; the quick-add sheet + its state live in `app/(tabs)/_layout.tsx` and are mounted once as a sibling of `<NativeTabs>` (other non-trigger children inside `<NativeTabs>` are silently dropped on iOS). Inline placement only ever appears because `minimizeBehavior="onScrollDown"` is set — the default never minimizes.
- **2026-06 — Dropped Supabase + auth, went local-first SQLite.** App is single-user now; all data lives in `lapsha.db` via `expo-sqlite`. No accounts, no network. Simplifies everything but means no sync/backup yet.
- **2026-06 — Migrated npm → bun.** Use `bun install` and `bunx expo install` for native packages. Lockfile is `bun.lock`.
- **Synchronous DB layer.** Services use `expo-sqlite` sync APIs and return `ServiceResponse<T>` directly, not Promises. Don't `await` them.

## Product direction

- **"Lapsha"** = noodles (RU). It's a personal CRM for remembering details about people who matter — facts, dates, notes.
- Notes are modeled as facts with `label="note"`, displayed separately. Keep that in mind before adding a `notes` table.
- Local-first is a deliberate stance, not a temporary shortcut. Revisit sync only if there's a real multi-device need.

## Gotchas

- **2026-06-10 — Editing `global.css` theme blocks in multiple steps spams "All themes must have the same variables" errors** at runtime — Uniwind validates light/dark symmetry on every save, and a half-applied edit is asymmetric. They're transient; confirm the final state with `bunx uniwind generate-artifacts --css ./global.css`.
- **2026-06-10 — HeroUI BottomSheet only animates open on an `isOpen` false→true transition** (it snapshots `isOpen` at mount). Keep it mounted with `isOpen={false}` and gate the *content*, never mount-on-demand with `isOpen` already true — that leaves it permanently closed with no error.
- **2026-06-10 — M3 `DatePickerDialog` returns UTC-midnight millis** — read it back via `getUTC*()` or the picked date shifts a day behind in western timezones. Also every `@expo/ui/jetpack-compose` view (dialogs included) must be a **direct child of `<Host>`**.
- **2026-06-10 — SwiftUI reuses TextField views across the fact/date tab switch in the entry sheet**, so the placeholder doesn't update (shows "The fact itself" on the date tab). Pre-existing, cosmetic; needs distinct view identity per tab if it starts to matter.
- **2026-06-09 — Stamp `PRAGMA user_version` INSIDE each migration's transaction**, never after the fact. A fast-refresh mid-edit once ran `migrate()` with the version bumped but the migration block missing, stamping v2 onto a v1 schema ("table dates has no column named sort_order" at runtime). `migrate()` now also self-heals that exact state by checking the actual schema before trusting the stamp.
- **2026-06-09 — iOS sheets expand to their largest detent when the keyboard appears.** The quick-add sheet auto-focuses a TextField, so detents `['medium', 'large']` meant it opened straight to full height. Use a single `'medium'` detent to keep it compact.
- **No global `crypto`** in the Expo native runtime — use `randomUUID()` from `expo-crypto` for IDs.
- **No web target.** `expo-sqlite` needs native modules; `bun run web` won't work.
- React Compiler is on — don't hand-roll `useMemo`/`useCallback`/`memo`, and never mutate state in place.

## Open threads / next up

- MVP gaps tracked in `AGENTS.md` (drag-n-drop ordering, edit/delete person, timeline/home screen, search, avatars). Update that list as items land.
- Drag-n-drop custom order: `sort_order` is populated and ready; add a 'custom' `EntrySort` mode + reorder UI (`@expo/ui` `List.ForEach` has native `onMove`/`onDelete`).
- Quick-add sheet is mounted in the tabs layout (not inside the accessory) — if presentation from there misbehaves on device, try the root layout next.
