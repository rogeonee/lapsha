# AGENTS.md

Lapsha is a personal relationship manager: people have facts and recurring dates.
It is a single-user, local-first Expo/React Native app with on-device SQLite, no authentication or backend, and no supported web target.

## Task context

- For UI/design work, use `.agents/skills/lapsha-native-ui/SKILL.md`. It owns the workflow and device-verification rules; read `PRODUCT.md` and `DESIGN.md` before changing the interface.
- Consult relevant entries in `notebook.md` for non-obvious decisions and device-tested gotchas, especially before changing native behavior or dependencies.
- Unlabeled/free-form details are facts with `label = NULL`, not a separate notes entity. The date label `birthday` is reserved case-insensitively and pinned first on a person screen.

## Commands

```bash
bun install
bunx expo install <package-name>  # Add native/Expo packages
bun run start                    # Metro
bun run ios                      # Build/run iOS
bun run android                  # Build/run Android
bun run lint                     # Oxlint
bun run check                    # Lint, format, Expo types, and TypeScript
bun run format                   # Oxfmt
```

Use Bun and `bun.lock`. Use `bun run check` before committing; do not run `expo lint`, which recreates the old ESLint setup. Run lint after code changes; follow the UI skill for relevant device verification.

## Architecture and conventions

- Use Expo Router with native stacks/tabs; do not configure React Navigation directly. Both person routes share `src/screens/person/person-screen.tsx` to preserve the originating tab stack.
- Keep shared form/save behavior in hooks and platform presentation in `.ios.tsx` / `.android.tsx` files. iOS entry/add-person surfaces use SwiftUI/native toolbars; Android uses HeroUI sheets and Jetpack Compose date controls.
- Keep unsuffixed platform shims free of platform-specific runtime imports: TypeScript and Metro resolve platform files differently. `HeroUINativeProvider` stays Android-only.
- Prefer Uniwind/Tailwind `className` utilities; use native styles for unsupported APIs. Keep tokens in `src/global.css` and `src/lib/theme.ts` synchronized. The app is intentionally light-only; styling traps are recorded in `notebook.md`.
- Access Reanimated shared values with `.get()` / `.set()` in callbacks and worklets.
- React Compiler is enabled: avoid manual `useMemo`, `useCallback`, and `memo` unless profiling justifies them. Sheet state derived during render deliberately keeps native content mounted through dismissal; inspect that pattern before replacing it.
- Use `~/` for imports from `src/`, kebab-case module names, default exports for routes, and named exports for reusable components.

## Data and state

- Services are synchronous and return `ServiceResponse<T>`: check `response.error` before using `response.data`; never `await` service calls. Validate inputs with Zod and wrap database operations with `runServiceOperation()`.
- Screens use `useTableVersion(tables)` to invalidate synchronous service reads during render. Do not mirror database rows into state from an effect. Preferences use `expo-sqlite/kv-store`.
- CRUD uses soft deletes; normal reads must filter `deleted_at IS NULL`.
- Schema and migrations live in `src/api/database.ts`. Stamp `PRAGMA user_version` inside the same transaction as each migration's schema changes.
- Use `src/lib/dates.ts` for date conversions. Unknown years are stored as `0001` (including the February 29 sentinel); the editor uses a leap year. Android picker values are UTC-midnight calendar dates and require UTC getters.
- Generate IDs with `randomUUID()` from `expo-crypto`, not global `crypto`. Avatar columns store bare file names, not absolute container paths.
- Keep personal details, IDs, photo paths, and database values out of telemetry; handled failures use fixed error messages.

## Reviews and pull requests

- Keep reviews scoped to the requested changes and respect explicitly accepted tradeoffs; do not re-flag acknowledged dependency bumps or unrelated work.
- When changing a shared pattern, check its other consumers and update them consistently or explain intentional differences.
- Use short, sentence-case PR titles and concise, outcome-focused descriptions. Include material decisions and screenshots when helpful; omit routine file-by-file narration and boilerplate.
