# AGENTS.md

See `CLAUDE.md` for commands, architecture, and technical patterns.
See `notebook.md` for non-obvious decisions and device-tested gotchas.
Read `PRODUCT.md` (strategic product context) and `DESIGN.md` (visual system) before any UI/design work.

## What is Lapsha?

Lapsha is a personal relationship manager for remembering details about significant people: facts such as favorite coffee or allergies, important dates such as birthdays and anniversaries, and free-form details. “Lapsha” means “noodles” in Russian.

It is a single-user, local-first app with no authentication or network backend. All user data is stored on-device in SQLite.

## Domain Model

```
Person (someone you want to remember details about)
  ├── Fact (value with an optional label)
  └── Date (label plus recurring month/day and optional known year)
```

There is no separate notes table. The current UI treats unlabeled/free-form details as facts with `label = NULL` and displays them in the Facts section; it does not yet have a dedicated Notes section. The date label `birthday` is reserved case-insensitively and pinned first on a person screen.

## Current State

**Implemented:**

- Upcoming timeline/home screen: projects every saved date to its next occurrence, groups entries by today/tomorrow/month, combines same-person events on the same day, and shows age/anniversary details when the original year is known.
- People list with native large-title navigation and add-person entry point.
- Avatar photos: picked from the system photo library with the platform square-crop editor, downscaled to 1536px JPEG files under `<documents>/avatars/`, and shown by the shared `Avatar` component (photo → initial → person glyph) on the people list, person screen, add-person preview, and today/tomorrow timeline rows.
- Platform-specific add-person flow with an optional birthday and a live avatar preview that doubles as the photo picker: native iOS modal with toolbar actions; HeroUI bottom sheet hosted by a transparent route on Android.
- Person detail screen shared by the Home and People stacks: pinned Birthday slot, facts and dates, tap-to-edit, swipe-to-delete, and created/modified sorting for facts only (a small menu on the Facts section header). Other dates stay in date-added order. A toolbar menu manages the person: edit name, add/change/remove photo, and delete (soft) with confirmation; tapping the empty initials circle also opens the photo picker.
- Platform-split EntrySheet for adding/editing facts and dates plus a single-field edit-name mode: SwiftUI via `@expo/ui` on iOS; HeroUI Native plus Jetpack Compose date controls on Android. Shared form/save behavior lives in `components/entry/use-entry-form.ts`.
- Global quick add: detached disabled native-tab action on iOS 26+ and Material FAB on Android. The person picker defaults to the last-used person.
- Local SQLite database with versioned migrations, soft deletes, synchronous services, and change-listener-driven UI refresh.
- Settings screen with app version and destructive “Clear All Data.”

**Not implemented / current gaps:**

- Manual drag-and-drop ordering of facts/dates (`sort_order` is populated but not read by the UI).
- Search/filter people.
- A global quick-add entry point on iOS below 26 (entries can still be added from a person screen).
- Dedicated notes presentation/behavior separate from ordinary facts.

## Key Screens

| Route                                 | Purpose                                       |
| ------------------------------------- | --------------------------------------------- |
| `app/(tabs)/(home)/index.tsx`         | Upcoming timeline/home screen                 |
| `app/(tabs)/(home)/person/[id].tsx`   | Person detail reached from Home               |
| `app/(tabs)/(people)/people.tsx`      | People list                                   |
| `app/(tabs)/(people)/person/[id].tsx` | Person detail reached from People             |
| `app/add-person.tsx`                  | Platform-specific add-person modal/sheet host |
| `app/(tabs)/settings.tsx`             | App info and clear-data action                |
| `app/(tabs)/_layout.tsx`              | Native tabs and global quick-add state        |

Both person routes re-export the shared `screens/person/person-screen.tsx` implementation so navigation stays inside the originating tab stack.

## Coding Conventions

- React Compiler is on: skip manual `useMemo` / `useCallback` / `memo` unless profiling proves a need, and never mutate state.
- Use Expo Router for routing and native tabs/stacks; do not configure React Navigation directly.
- Use Uniwind/Tailwind v4 `className` styling first. Use native `style` props for APIs Uniwind cannot express (native header props, shadows, animation styles, and similar cases).
- Use `bun install` and `bunx expo install <package>`; `bun.lock` is the lockfile.
- All data services follow `ServiceResponse<T>`; check `response.error` before using `response.data`.
- Database services are synchronous and use `expo-sqlite` sync APIs. Do not `await` them.
- Validate service inputs with Zod. React Native forms may use React Hook Form plus Zod; platform-native EntrySheet controls deliberately share state through `use-entry-form.ts` instead.
- Use `~/` for imports from the project root.
- Expo Router screens default-export; reusable components use named exports.
- Use kebab-case module names for components and hooks. Platform-specific modules use `.ios.tsx` / `.android.tsx` plus a type-only or no-op unsuffixed shim when TypeScript needs one.
- Web is not a supported target; the app depends on native Expo, SwiftUI, and Jetpack Compose surfaces.
