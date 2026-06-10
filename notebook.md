# Notebook

A shared scratchpad for Claude and other agents. Not a spec — `CLAUDE.md` (technical) and `AGENTS.md` (product/state) hold the canonical rules. This is for the softer stuff: decisions and their _why_, gotchas that cost time, product direction, and context that isn't obvious from the code.

**How to use it:** append entries when something is worth a future agent knowing — a non-obvious decision, a trap you hit, a product call. Keep entries short (a few lines). Date them. Prune what goes stale. Don't log routine work; git already does that.

---

## Decisions

- **2026-06 — Dropped Supabase + auth, went local-first SQLite.** App is single-user now; all data lives in `lapsha.db` via `expo-sqlite`. No accounts, no network. Simplifies everything but means no sync/backup yet.
- **2026-06 — Migrated npm → bun.** Use `bun install` and `bunx expo install` for native packages. Lockfile is `bun.lock`.
- **Synchronous DB layer.** Services use `expo-sqlite` sync APIs and return `ServiceResponse<T>` directly, not Promises. Don't `await` them.

## Product direction

- **"Lapsha"** = noodles (RU). It's a personal CRM for remembering details about people who matter — facts, dates, notes.
- Notes are modeled as facts with `label="note"`, displayed separately. Keep that in mind before adding a `notes` table.
- Local-first is a deliberate stance, not a temporary shortcut. Revisit sync only if there's a real multi-device need.

## Gotchas

- **No global `crypto`** in the Expo native runtime — use `randomUUID()` from `expo-crypto` for IDs.
- **No web target.** `expo-sqlite` needs native modules; `bun run web` won't work.
- React Compiler is on — don't hand-roll `useMemo`/`useCallback`/`memo`, and never mutate state in place.

## Open threads / next up

- MVP gaps tracked in `AGENTS.md` (edit/delete entities, add-dates creation, timeline/home screen, search, avatars). Update that list as items land.
