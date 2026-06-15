# Notebook

A shared scratchpad for Claude and other agents. Not a spec — `CLAUDE.md` (technical) and `AGENTS.md` (product/state) hold the canonical rules. This is for the softer stuff: decisions and their _why_, gotchas that cost time, product direction, and context that isn't obvious from the code.

**How to use it:** append entries when something is worth a future agent knowing — a non-obvious decision, a trap you hit, a product call. Keep entries short (a few lines). Date them. Prune what goes stale. Don't log routine work; git already does that.

---

## Decisions

- **2026-06-09 — Facts/dates core loop landed.** Schema v2: `facts.label` is now nullable (plain-text facts) — required a table rebuild since SQLite can't drop NOT NULL; both `facts` and `dates` gained `sort_order` (backfilled by `created_at`), reserved for future drag-n-drop custom ordering. Current sort modes are 'created'/'modified', stored globally in `expo-sqlite/kv-store` (`sort.facts`, `sort.dates`; also `lastPersonId` for quick add — see `lib/prefs.ts`).
- **2026-06-09 — UI refresh via SQLite update hook, not focus effects.** `lapsha.db` opens with `enableChangeListener: true`; `useTableVersion(tables)` bumps a counter on writes and screens _derive data during render_ from sync services (no setState-in-effect — the React Compiler lint rule rejects that pattern). The quick-add sheet isn't a route, so focus effects alone could never refresh after it saves.
- **2026-06-09 — `'birthday'` is a reserved date label** (matched case-insensitively, pinned first by `getDatesByPerson`). Same trick as notes (`label="note"` facts). Person screen shows an "Add birthday" placeholder when missing.
- **2026-06-09 — One EntrySheet for everything.** Add/edit of facts and dates all go through `components/entry/entry-sheet.tsx` (`@expo/ui` SwiftUI BottomSheet). Quick add triggers from `NativeTabs.BottomAccessory` — **iOS 26+ only, alpha API**; Android/older iOS rely on the person screen. NativeTabs has no real '+' tab-bar button API (tab presses can't be intercepted), the accessory is the closest native thing.
- **2026-06-09 — BottomAccessory gotcha: the system renders TWO copies of the accessory component** (one per placement, 'regular' above the tab bar and 'inline' docked beside the minimized bar) **and component-local state is not shared between them.** Keep accessory content stateless; the quick-add sheet + its state live in `app/(tabs)/_layout.tsx` and are mounted once as a sibling of `<NativeTabs>` (other non-trigger children inside `<NativeTabs>` are silently dropped on iOS). Inline placement only ever appears because `minimizeBehavior="onScrollDown"` is set — the default never minimizes.
- **2026-06 — Dropped Supabase + auth, went local-first SQLite.** App is single-user now; all data lives in `lapsha.db` via `expo-sqlite`. No accounts, no network. Simplifies everything but means no sync/backup yet.
- **2026-06 — Migrated npm → bun.** Use `bun install` and `bunx expo install` for native packages. Lockfile is `bun.lock`.
- **Synchronous DB layer.** Services use `expo-sqlite` sync APIs and return `ServiceResponse<T>` directly, not Promises. Don't `await` them.

## Product direction

- **"Lapsha"** = noodles (RU). It's a personal CRM for remembering details about people who matter — facts, dates, notes.
- Notes are modeled as facts with `label="note"`, displayed separately. Keep that in mind before adding a `notes` table.
- Local-first is a deliberate stance, not a temporary shortcut. Revisit sync only if there's a real multi-device need.

## Gotchas

- **2026-06-09 — Stamp `PRAGMA user_version` INSIDE each migration's transaction**, never after the fact. A fast-refresh mid-edit once ran `migrate()` with the version bumped but the migration block missing, stamping v2 onto a v1 schema ("table dates has no column named sort_order" at runtime). `migrate()` now also self-heals that exact state by checking the actual schema before trusting the stamp.
- **2026-06-09 — iOS sheets expand to their largest detent when the keyboard appears.** The quick-add sheet auto-focuses a TextField, so detents `['medium', 'large']` meant it opened straight to full height. Use a single `'medium'` detent to keep it compact.
- **No global `crypto`** in the Expo native runtime — use `randomUUID()` from `expo-crypto` for IDs.
- **No web target.** `expo-sqlite` needs native modules; `bun run web` won't work.
- React Compiler is on — don't hand-roll `useMemo`/`useCallback`/`memo`, and never mutate state in place.

## Open threads / next up

- MVP gaps tracked in `AGENTS.md` (drag-n-drop ordering, edit/delete person, timeline/home screen, search, avatars). Update that list as items land.
- Drag-n-drop custom order: `sort_order` is populated and ready; add a 'custom' `EntrySort` mode + reorder UI (`@expo/ui` `List.ForEach` has native `onMove`/`onDelete`).
- Quick-add sheet is mounted in the tabs layout (not inside the accessory) — if presentation from there misbehaves on device, try the root layout next.
