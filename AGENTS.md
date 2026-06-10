# AGENTS.md

See `CLAUDE.md` for commands, architecture, and technical patterns.
See `notebook.md` for the running log of decisions, gotchas, and product direction.

## What is Lapsha?

A personal relationship management app for keeping notes about significant people in your life. Track facts (favorite coffee, allergies, interests), important dates (birthdays, anniversaries), and free-form notes about each person. "Lapsha" means "noodles" in Russian.

## Domain Model

```
Person (someone you want to remember details about)
  ├── Fact (label/value pairs: "Favorite color" → "Blue")
  ├── Date (labeled dates: "Birthday" → "1990-03-15")
  └── Note (facts where label="note", displayed separately)
```

Single-user, local-first app. No authentication — all data stored locally via SQLite.

## Current State

**Implemented:**

- People list screen with add person
- Person detail screen showing facts, dates, notes
- Add fact/note sheet (bottom sheet modal)
- Local SQLite database (expo-sqlite)
- Settings screen with "Clear All Data"

**Not implemented (MVP gaps):**

- Edit/delete facts, dates, notes
- Edit/delete person
- Add dates (UI exists but creation missing)
- Timeline/home screen (shows upcoming dates across all people)
- Profile avatars/photos
- Search/filter people
- Pull-to-refresh

## Key Screens

| Route                     | Purpose                              |
| ------------------------- | ------------------------------------ |
| `app/(tabs)/people.tsx`   | People list (main screen)            |
| `app/(tabs)/index.tsx`    | Home/timeline (placeholder)          |
| `app/person/[id].tsx`     | Person detail with facts/dates/notes |
| `app/add-person.tsx`      | Modal to create new person           |
| `app/(tabs)/settings.tsx` | App info + clear data                |

## Coding Conventions

- **React Compiler** is on - skip manual `useMemo`/`useCallback`/`memo`, don't mutate state
- **Expo Router** for navigation (not React Navigation directly)
- **NativeWind** classes preferred over StyleSheet
- **`bunx expo install`** for all new dependencies
- **ServiceResponse pattern** for all API calls (check `response.error` first)
- **Synchronous services** — all DB operations use `expo-sqlite` sync APIs
- **Zod** for form validation with react-hook-form
- Path alias: `~/` maps to project root
- Screens: default export; Components: named export
- File naming: kebab-case for components, camelCase for hooks/utils
