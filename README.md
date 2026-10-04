# Lapsha

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   bun install
   ```

2. Start the app

   ```bash
   bunx expo start
   ```

## Task-to-code map

| Task                      | Related implementations                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Person details            | [Home person route](<src/app/(tabs)/(home)/person/[id].tsx>) and [People person route](<src/app/(tabs)/(people)/person/[id].tsx>) both use [the shared person screen](src/screens/person/person-screen.tsx), preserving the originating tab stack.                                                                                                                                                                                                                                                                                               |
| Entry forms and quick add | [Shared form/save hook](src/components/entry/use-entry-form.ts) feeds [iOS](src/components/entry/entry-sheet.ios.tsx) and [Android](src/components/entry/entry-sheet.android.tsx) sheets; [the tab layout](<src/app/(tabs)/_layout.tsx>) hosts quick add.                                                                                                                                                                                                                                                                                        |
| Add person                | [The route](src/app/add-person.tsx) and platform sheets in [the person components](src/components/person) share [the form hook](src/components/person/use-add-person-form.ts).                                                                                                                                                                                                                                                                                                                                                                   |
| Gift editing              | [Android editor](src/components/gifts/gift-editor.android.tsx) uses [its editor hook](src/components/gifts/use-gift-editor.ts); iOS text/link gifts use the entry sheet. Both save through [gift services](src/api/gifts/gifts-service.ts).                                                                                                                                                                                                                                                                                                      |
| Gift capture and recovery | [Capture route](src/app/gift-capture.tsx) uses [the Android native camera launcher](src/components/gifts/gift-camera.android.tsx), [photo journals](src/lib/gift-photos.ts), and [capture saves](src/api/gifts/capture-service.ts). [Root startup](src/app/_layout.tsx) and the restored route share [picker recovery](src/lib/recover-gift-library-selection.ts). For paired native patches and rebuild constraints, read [persistence and recovery](docs/prototypes/gifts.md#persistence-and-recovery) and the relevant `notebook.md` entries. |
| Schema and clear data     | [Migrations](src/api/migrations.ts) run from [database bootstrap](src/api/database.ts), which also wires [clear-data transactions](src/api/clear-data.ts) to preference and photo cleanup. [Settings](<src/app/(tabs)/(settings)/settings.tsx>) invokes that operation through platform confirmations in [settings components](src/components/settings).                                                                                                                                                                                         |
| Abby artwork              | [Empty states](src/components/ui/empty-state.tsx) and person details use [the shared Abby component](src/components/ui/abby.tsx), which selects the poses documented in [the asset README](src/assets/abby/README.md).                                                                                                                                                                                                                                                                                                                           |

## Code checks

Use Bun 1.3.6, matching `packageManager` and EAS. Install the recommended Oxc editor extension for formatting and lint fixes on save.

```bash
bun run check         # Lint, format check, Expo type generation, and TypeScript
bun run lint:fix      # Apply safe lint fixes
bun run format       # Format supported files, including Tailwind classes
```

Oxlint and Oxfmt are pinned in `package.json`. Configuration lives in `.oxlintrc.json` and `.oxfmtrc.json`. Import and package-field sorting are disabled; Tailwind sorting uses `src/global.css`, `cva`, `cn`, and `contentContainerClassName`. Generated native projects, Expo declarations, and Uniwind declarations are excluded.

Oxlint retains the supported Expo preset rules and adds its correctness checks. React Hooks and React Compiler checks run natively, including immutability, refs, purity, and unsupported syntax. Reanimated shared values use `.get()` / `.set()` in callbacks and worklets. The existing React Hook Form `watch` exception remains local to that call; Oxlint understands its `eslint-disable` directive and `react-hooks` rule name.

`eslint-plugin-expo` runs through Oxlint's JS-plugin support to preserve Expo's environment-variable and DOM-export checks. It still brings ESLint as a transitive dependency, but no ESLint command or config is used. Do not run `expo lint`, which would recreate the old setup.

TypeScript checks source imports and types separately with Expo's TypeScript version. Oxlint does not implement `import/no-unresolved`, and its compiler uses fixed options rather than exposing the old `config` / `gating` rules. The former `react/no-deprecated` rule is not retained; type-aware linting would be needed for Oxlint's replacement. When upgrading Expo, review changes to its lint preset as well as the dependency versions.

`bun run check` generates `expo-env.d.ts` and Router types before typechecking so it also works in a fresh checkout. These declarations stay untracked. Type-aware Oxlint is not enabled; `tsc --noEmit` remains the type checker.

## EAS checks

`.eas/workflows/quality.yml` runs checks for pushes and pull requests to `master` when the repository is connected to EAS. It can also be run manually:

```bash
eas workflow:run .eas/workflows/quality.yml
```

The workflow installs from `bun.lock` using EAS's frozen-lockfile behavior. Keep optional dependencies enabled: Oxlint and Oxfmt distribute platform binaries through them. The SDK 57 image supplies Node; the tools require Node 20.19+ on the 20.x line or 22.12+.

`eas-build-post-install` runs the same checks for direct `eas build` calls, after prebuild (and CocoaPods on iOS). Future build or update jobs in the quality workflow should use `needs: [quality]` to fail before native builds start. Custom build configurations must call the checks explicitly because EAS does not automatically execute lifecycle hooks for them.
