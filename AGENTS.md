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

- People list screen (native large-title header) with add person (+ optional birthday)
- Person detail screen: facts & dates sections, pinned Birthday slot, add/edit/delete (tap to edit, swipe to delete), sort menu (date added / last modified)
- EntrySheet — single native SwiftUI bottom sheet (`@expo/ui`) for adding/editing facts and dates, reused by the person screen and quick add
- Quick add from any tab via `NativeTabs.BottomAccessory` (iOS 26+), person picker defaults to last-used
- Local SQLite database (expo-sqlite) with change-listener-driven UI refresh
- Settings screen with "Clear All Data"

**Not implemented (MVP gaps):**

- Custom drag-n-drop ordering of facts/dates (`sort_order` column is ready, UI deferred)
- Edit/delete person
- Timeline/home screen (shows upcoming dates across all people)
- Profile avatars/photos
- Search/filter people
- Quick add entry point on Android / iOS < 26 (person screen is the only path there)

## Key Screens

| Route                                 | Purpose                                 |
| ------------------------------------- | --------------------------------------- |
| `app/(tabs)/(people)/people.tsx`      | People list (main screen)               |
| `app/(tabs)/(people)/person/[id].tsx` | Person detail with facts/dates/notes    |
| `app/(tabs)/index.tsx`                | Home/timeline (placeholder)             |
| `app/add-person.tsx`                  | Modal to create new person (+ birthday) |
| `app/(tabs)/settings.tsx`             | App info + clear data                   |

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
