# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `AGENTS.md` for app context, domain model, current implementation state, and MVP gaps.

## Commands

```bash
# Install dependencies (always use npx expo install for new packages)
npm install
npx expo install <package-name>

# Start development server
npx expo start
npm run start          # starts with --tunnel flag

# Run on specific platform
npm run ios            # expo run:ios
npm run android        # expo run:android

# Lint
npm run lint           # expo lint
```

**Note:** Web target (`npm run web`) is not supported — `expo-sqlite` requires native modules.

## Architecture

### Tech Stack

- **Expo SDK 54+** with Expo Router for file-based routing
- **TypeScript** in strict mode
- **expo-sqlite** for local database (single-user, no auth)
- **NativeWind** (Tailwind CSS) + StyleSheet for styling
- **Zod** for schema validation
- **React Hook Form** for form handling

### Project Structure

```
app/                    # Expo Router screens (file-based routing)
├── (tabs)/            # Tab navigation group
├── person/[id].tsx    # Dynamic route
├── _layout.tsx        # Root layout (no auth)
└── add-person.tsx     # Add person modal

api/                    # Domain-driven data layer
├── database.ts        # SQLite setup + schema (singleton db)
├── people/            # People CRUD
├── facts/             # Person facts CRUD
├── dates/             # Person dates CRUD
├── timeline/          # Cross-person date aggregation
└── error-handling.ts  # Shared error utilities

components/             # Reusable UI components
├── ui/                # Base components (button, input, text)
└── person/            # Person-related components

lib/                    # Utilities and hooks
types/db.ts            # Database types
```

### Key Patterns

**Service Response Pattern**: All API services return `ServiceResponse<T>`:

```typescript
interface ServiceResponse<T> {
  data: T | null;
  error: ServiceError | null;
}
```

**Synchronous services**: All database operations use `expo-sqlite` sync APIs (`db.runSync`, `db.getFirstSync`, `db.getAllSync`). Service functions return `ServiceResponse<T>` directly (not Promises).

**Path Alias**: Use `~/` to import from project root (e.g., `import { db } from '~/api/database'`).

### React Compiler

React Compiler is enabled by default (Expo 54+). Write code that the compiler can optimize automatically:

- Avoid manual `useMemo`/`useCallback`/`React.memo` unless profiling shows a need
- Don't mutate objects/arrays - always return new references
- Keep component logic predictable (no conditional hooks, consistent render paths)

### Conventions

- Components: kebab-case (`user-profile.tsx`)
- Hooks: kebab-case with 'use' prefix (`use-data.tsx`)
- Screens: default exports for Expo Router
- Other components: named exports
- Styling: NativeWind classes preferred, StyleSheet for complex styles
- Forms: react-hook-form + zod resolver

## Database

Local SQLite database (`lapsha.db`) via `expo-sqlite`. Schema defined in `api/database.ts`.

| Table     | Key Columns                                        | Notes                          |
| --------- | -------------------------------------------------- | ------------------------------ |
| `persons` | id, name                                           | People you track               |
| `facts`   | id, person_id, label, value                        | Key-value pairs about a person |
| `dates`   | id, person_id, label, date, month, day, year_known | Important dates                |

All tables have `created_at`, `updated_at`, `deleted_at` (soft delete). IDs are UUIDs generated via `randomUUID()` from `expo-crypto` (there is no global `crypto` in the Expo native runtime).

Types in `types/db.ts`.
