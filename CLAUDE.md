# CLAUDE.md

Technical guidance for coding agents working in this repository.

See `AGENTS.md` for app context, implemented state, and current gaps.
See `notebook.md` for non-obvious decisions and device-tested gotchas.

## Project Handling

### Device Verification

- **iOS:** Run `bunx serve-sim` to stream the active iOS Simulator to localhost for inspection and interaction. Codex agents should use the Chrome plugin against that stream; Claude agents should operate it manually.
- **iOS versions:** For platform-sensitive UI or native behavior, verify on both iOS 18 and the current iOS 26 simulator when relevant. Report exactly which versions were tested; do not imply cross-version coverage from one simulator.
- **Android:** Prefer the physical Android phone connected over USB in debug mode. Check for an authorized device and use it when present. If none is available, ask the user to connect the phone before attempting Android verification; do not silently substitute an emulator.

### Reviews and Consistency

- Keep code reviews scoped to the requested changes. Respect explicitly accepted tradeoffs and previously approved work; do not re-flag acknowledged dependency bumps or unrelated changes.
- When changing a shared interaction or visual pattern, search for its other consumers. Update them together when they should stay consistent, or explicitly call out any intentional or remaining differences.

### Pull Requests

Before drafting a PR, inspect the 2–3 most recent PRs and match their writing style while keeping the new PR focused. The current house style is:

- A short, sentence-case title.
- One concise opening paragraph describing the outcome.
- A small number of `###` headings grouped by feature area when the scope benefits from them.
- Concise, past-tense bullets covering user-visible changes and material implementation details; omit routine file-by-file narration and boilerplate.
- Keep the body proportional to the change. Add screenshots when they materially help explain visual work.

## Design Context

- `PRODUCT.md` defines the product, users, brand personality (“warm, personal, native”), anti-references, and design principles.
- `DESIGN.md` defines “The Well-Kept Notebook” visual system: palette/tokens, typography, elevation, component rules, and platform behavior.

Read both before UI/design work.

## Commands

```bash
# Dependencies (use Expo's installer for native packages)
bun install
bunx expo install <package-name>

# Development
bunx expo start
bun run start
bun run ios
bun run android

# Static checks
bun run lint
```

Web is not a supported target. The app relies on native Expo Router, SwiftUI, and Jetpack Compose modules.

## Architecture

### Tech Stack

- Expo SDK 56, React Native 0.85, React 19, and Expo Router.
- TypeScript 6 in strict mode with React Compiler enabled.
- `expo-sqlite` for the local, single-user database; no authentication or backend.
- Uniwind 1.8 with Tailwind CSS v4 for utility styling.
- `@expo/ui/swift-ui` for native iOS surfaces.
- HeroUI Native 1.0.4 plus `@expo/ui/jetpack-compose` for Android surfaces.
- React Hook Form and Zod for the add-person form/service validation.
- `expo-image-picker`, `expo-image-manipulator`, and `expo-file-system` for avatar photos (picked with the system square-crop editor, downscaled, stored under `<documents>/avatars/`).
- React Native Keyboard Controller, Gesture Handler, and Reanimated for Android sheet/gesture behavior.

### Project Structure

```
app/
├── _layout.tsx                         # Providers, theme lock, root stack
├── add-person.tsx                     # iOS modal / Android sheet route host
└── (tabs)/
    ├── _layout.tsx                    # NativeTabs + global quick add
    ├── quick-add.tsx                  # Disabled/hidden route required by NativeTabs
    ├── settings.tsx
    ├── (home)/
    │   ├── index.tsx                  # Upcoming timeline
    │   └── person/[id].tsx            # Re-exports shared PersonScreen
    └── (people)/
        ├── people.tsx                 # People list
        └── person/[id].tsx            # Re-exports shared PersonScreen

api/
├── database.ts                        # SQLite singleton + migrations
├── people/                            # Person services/schema
├── facts/                             # Fact services/schema
├── dates/                             # Date services/schema
├── timeline/                          # Cross-person date queries
└── error-handling.ts                  # ServiceResponse/error mapping

components/
├── entry/                             # Platform-split EntrySheet + shared state
├── person/                            # Add-person UI, rows, cards
├── quick-add/                         # Android FAB (iOS no-op shim)
├── ui/                                # Shared primitives/icons
└── ui-providers.*.tsx                 # Android-only HeroUI provider

screens/person/person-screen.tsx       # Shared detail screen for both stacks
lib/                                   # Preferences, avatar/date/theme helpers, DB hook
types/db.ts                            # Database and service types
global.css                             # Uniwind/HeroUI theme tokens
```

### Platform UI Boundaries

- iOS entry/add-person surfaces use SwiftUI or native stack toolbars.
- Android entry/add-person surfaces use HeroUI bottom sheets with Jetpack Compose date controls.
- Shared behavior belongs in hooks (`use-entry-form.ts`, `use-add-person-form.ts`); platform files own presentation and platform quirks.
- Unsuffixed platform shims must stay free of the other platform's runtime imports. TypeScript does not use Metro platform suffix resolution, while Metro does.
- `HeroUINativeProvider` mounts Android-only so iOS does not bundle HeroUI.
- Global quick-add state and the single EntrySheet instance live beside `<NativeTabs>` in `app/(tabs)/_layout.tsx`: iOS 26+ opens it through `onTabSelectionPrevented`; Android opens it from the FAB.

## Data and State Patterns

### ServiceResponse

Every API service returns synchronously:

```typescript
interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}
```

Check `response.error` first. Services wrap operations with `runServiceOperation()` and use `db.runSync`, `db.getFirstSync`, or `db.getAllSync`; never `await` a service call.

### SQLite-Driven Refresh

`lapsha.db` opens with `enableChangeListener: true`. `useTableVersion(tables)` subscribes through `addDatabaseChangeListener` and supplies an invalidation counter. Screens synchronously derive service results during render from that counter; do not mirror database rows into state from an effect.

Preferences live in `expo-sqlite/kv-store`, separate from the main database. Current keys are fact sort mode (`sort.facts`) and last quick-add person (`lastPersonId`).

### React Compiler

- Avoid manual `useMemo`, `useCallback`, and `React.memo` unless profiling justifies them.
- Do not mutate objects or arrays.
- Keep hook order and render paths predictable.
- Derived-state updates during render are used intentionally where native sheet content must remain mounted through dismissal; inspect the existing pattern before replacing it.

## Styling and Themes

- Prefer Uniwind `className` / `contentContainerClassName` utilities.
- Tailwind v4 tokens live in `global.css`; imperative native colors and shadows live in `lib/theme.ts`. Keep the two token sets synchronized.
- Metro's `withUniwindConfig` sets `polyfills: { rem: 14 }`. Do not remove it: changing rem back to 16 silently scales the interface.
- `group-*` and `peer-*` variants are Uniwind Pro-only and no-op in this project.
- Use native `style` props where required for headers, shadows, animated values, or unsupported properties.
- The app is intentionally light-only for now. `Appearance.setColorScheme('light')` and `Uniwind.setTheme('light')` in `app/_layout.tsx` must change together when dark mode is implemented.
- Use `components/ui/icons.tsx` for shared icons. Android toolbar icons require bundled XML drawables; `expo-image` SF-symbol sources are iOS-only.

## Forms

- Service input schemas live beside their domains and use Zod.
- Add person uses React Hook Form with `zodResolver` in `use-add-person-form.ts`.
- EntrySheet uses shared React state in `use-entry-form.ts` because SwiftUI and HeroUI own their platform controls.
- Keep UTC storage conversion in `lib/dates.ts`. An unknown year is stored as year `0001`; Android date pickers return UTC-midnight milliseconds and must be read with UTC getters.

## Database

The local database is `lapsha.db`; schema and migrations are in `api/database.ts`.

| Table     | Key columns                                                              | Notes                                                                                                                          |
| --------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `persons` | `id`, `name`, nullable `avatar`                                          | `avatar` is a bare photo file name resolved by `lib/avatars.ts`; name edit and delete live in the person screen's toolbar menu |
| `facts`   | `person_id`, nullable `label`, `value`, `sort_order`                     | `NULL` label is an unlabeled/free-form fact                                                                                    |
| `dates`   | `person_id`, `label`, `date`, `month`, `day`, `year_known`, `sort_order` | `birthday` is reserved case-insensitively and pinned first                                                                     |

All tables include `created_at`, `updated_at`, and nullable `deleted_at`. CRUD uses soft deletes; normal reads must filter `deleted_at IS NULL`. IDs come from `randomUUID()` in `expo-crypto`; Expo native does not provide a usable global `crypto` here.

Schema migrations are keyed by `PRAGMA user_version`. Each migration must stamp its version inside the same transaction as its schema changes. `sort_order` is populated for facts and dates but is reserved for future manual ordering; the current UI does not consume it.

## Conventions

- Root import alias: `~/`.
- Expo Router screens default-export; reusable components use named exports.
- Component and hook module names use kebab-case.
- Platform implementations use `.ios.tsx` / `.android.tsx` and an unsuffixed shim where required.
- Prefer synchronous, domain-focused services and central database types from `types/db.ts`.
- Preserve the originating tab stack when linking to a person; both person routes share `PersonScreen` intentionally.
