# OTA releases and rollback

EAS Update ships JavaScript and bundled assets to compatible installed binaries. This setup is preparation only: no update, channel, branch, build, submission, credential, or account setting was created remotely by this change. Use Bun 1.3.6 and EAS CLI 24.14.0 or newer; commands below were checked against 24.14.0. Run them from the repository root.

## Initial native builds are required

Both platforms need a **new native build and tester installation** before the first OTA. Adding `expo-updates`, its URL, runtime policy, and channel cannot retrofit an installed app through JavaScript. This is a CNG project: `ios/` and `android/` are untracked and EAS generates their configuration.

Read-only EAS inspection on October 15, 2026 confirmed project `@rogeonee/lapsha`, ID `22e93af4-b730-40d9-8d51-cb0b60f2603e`, with no channels or update branches. The relevant existing builds are:

| Binary                                       | EAS build                                                                                                                                | Source    | OTA readiness                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| Android internal `0.1.0 (4)`                 | [`39b73a36-43d1-4c0d-aa6f-1377f72d88c0`](https://expo.dev/accounts/rogeonee/projects/lapsha/builds/39b73a36-43d1-4c0d-aa6f-1377f72d88c0) | `4e7c619` | Cannot receive this OTA setup; rebuild and update via Play       |
| Latest completed iOS store build `0.1.0 (4)` | [`19add89f-8a05-48a5-a45d-6a2707d0097f`](https://expo.dev/accounts/rogeonee/projects/lapsha/builds/19add89f-8a05-48a5-a45d-6a2707d0097f) | `5ee1dda` | Cannot receive this OTA setup; rebuild and update via TestFlight |

Both source revisions lack the `expo-updates` dependency, update URL, runtime policy, and EAS channels. Earlier preview/development/production builds from the inspected history likewise predate this setup. `expo-updates-interface` already in the dependency tree is not the OTA client. EAS build fingerprints recorded for these old builds do **not** imply that the binaries contain an EAS Update runtime. This conclusion uses source/config and EAS records; IPA/AAB contents and the exact build installed through TestFlight were not independently inspected here. Do not treat any previously installed binary as OTA-ready.

After merge and explicit release authorization, build each platform **sequentially**, using the new `beta` profile and the existing auto-submit convention:

```sh
env -u APP_VARIANT eas build --platform android --profile beta --auto-submit
# Wait for completion and verify the internal Play release before starting iOS.
env -u APP_VARIANT eas build --platform ios --profile beta --auto-submit
```

These are paid/native build and store-submission actions; they were not run during setup. `submit.beta` inherits the existing `production` submit destinations: Android `internal` / `completed`, and iOS App Store Connect app `6823006461`, team `NWFF68ZSMD`. iOS upload does not prove TestFlight group/review availability. Verify the actual store release and installation on each device. Keep existing data; do not uninstall to test an upgrade.

Record each new build ID, source SHA, platform, version/build number, embedded channel, and **actual runtime version** in its release record. Verify the artifact's update URL, enabled setting, runtime and `expo-channel-name` header (iOS `Expo.plist`, Android manifest/resources), and that it contains `expo-updates`. The iOS `file:fingerprint` configuration placeholder resolves during native build; it is not the final runtime hash. Test cold/offline launch and data retention before publishing anything.

## Audiences and environments

| EAS build profile              | Distribution                                             | OTA channel / intended branch                | EAS environment                                |
| ------------------------------ | -------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| `development`, `ios-simulator` | Development client                                       | None pinned; not an audience acceptance test | `development`                                  |
| `preview`                      | Direct internal distribution                             | `preview`                                    | `preview`                                      |
| `beta`                         | Store binary: Play internal/closed testing or TestFlight | `beta`                                       | `production`                                   |
| `production`                   | Future public store binary                               | `production`                                 | `production`                                   |
| `gifts-lab`                    | Separate Lab app, internal distribution                  | `gifts-lab`                                  | `preview` plus profile `APP_VARIANT=gifts-lab` |

Use **`beta` for future store beta builds**, replacing earlier instructions that used the `production` build profile. It inherits the existing native release settings, remote build numbering, source-map upload, Bun version, and pinned iOS image. `production` is now a separate future OTA audience. Its Android submit profile still targets internal testing as before; public store promotion requires a separate reviewed release decision.

Keep one EAS branch of the same name behind each channel; EAS branches are unrelated to the checked-out Git branch. Verify mappings before every mutation. Do not repoint channels, use branch rollouts, channel surfing, `--auto`, or `--force-end-active-rollout` in this workflow. A publish may create a missing branch/channel, so missing or unexpected mappings are a stop condition after initial bootstrap. A first authorized EAS build normally creates its named channel; inspect it before the first authorized publish and explicitly resolve any missing mapping.

Android internal and closed testers share the `beta` channel deliberately. Play track changes and TestFlight tester groups do not alter an embedded channel. To isolate closed testers later, create a new reviewed channel/profile and rebuild for it. **Never promote a `beta` binary into a public store release:** it retains the beta channel. Build with `production` first; that binary can pass through store testing before public promotion, but will already follow the production OTA audience. Similarly, do not point beta and production channels at the same branch.

The beta build and beta updates use `production` environment because this is the real local-first app, with no staging backend. Read-only inspection found no project or account variables in `production` or `preview`; recheck at release time. SDK 57 requires `--environment` for publishing. `eas update` does not select a build profile or inherit its `env` block. Local `.env` files are not used with `--environment`; secret-visibility EAS variables are unavailable to local update generation. Do not move native/config inputs into secrets or depend on build-only environment variables. Keep `APP_VARIANT` unset for main-app operations, including on EAS; Lab updates are a separate reviewed workflow and are not covered by the main-app commands below.

## Runtime compatibility

The runtime policy is `fingerprint`. Lapsha has native Expo/React Native modules, local native patches, and config plugins, while the marketing version has stayed `0.1.0` across different binaries. A policy tied only to that version could incorrectly label different native runtimes compatible. Fingerprints derive compatibility separately for each platform; **never force a matching runtime string or exclude native inputs to make an update deliver**.

The current [runtime guide](https://docs.expo.dev/eas-update/runtime-versions/) describes fingerprint as the safer automatic choice when native inputs change, and the [Updates SDK reference](https://docs.expo.dev/versions/latest/sdk/updates/#runtime-version) documents it. The [deployment guide](https://docs.expo.dev/eas-update/deployment/#runtime-version-configuration) still calls fingerprint experimental and recommends `appVersion`. This repository deliberately chooses the supported fingerprint policy for its native patches, accepting conservative rebuilds and requiring a real beta-build compatibility check before first use. It is not a claim that Expo universally recommends fingerprint.

The installed SDK fingerprint implementation includes `patches/`, plugin/native dependency inputs, app configuration, and package scripts. Even some non-native maintenance changes can change the hash. Reinstall from `bun.lock`, compare exact inputs and environments, and rebuild when a mismatch cannot be explained safely. Do not manually edit generated native directories in this CNG release workflow.

| Change                                                                                                       | Release path                                                                           |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| JS/TS logic, text, styles, bundled content images; same runtime                                              | OTA after testing                                                                      |
| Expo/RN/native dependency changes; Bun native patches; native plugin/config changes                          | New native build for affected platforms                                                |
| Permissions, entitlements, app icons/splash, bundle/package/scheme, update URL/channel/runtime configuration | New native build                                                                       |
| Different fingerprint, even if a change appears JS-only                                                      | Stop; inspect the difference and build if needed                                       |
| SQLite migrations, persisted-data or file-format changes                                                     | Review rollback compatibility as well as runtime; fingerprint cannot protect user data |

OTA rollback does not reverse SQLite migrations or restore photos. Updates must remain compatible with both the prior OTA and embedded bundle after they have run. Prefer additive/backward-compatible migrations; use a new native release and a planned recovery path if an old bundle cannot read the new data. Never use uninstall or Clear All Data as a rollback procedure.

## Release preflight (no publication)

Start from the reviewed commit in a clean worktree. Check `git status --short` and `git rev-parse HEAD`, install with `bun install --frozen-lockfile`, then run `bun run check`, `bun run test`, and `bun run test:timezones`. OTA does not run `eas-build-post-install`; the existing EAS quality workflow must be green for this exact commit. It has no publish trigger.

```sh
eas whoami
eas project:info
eas channel:view beta --json
eas channel:view production --json
eas env:list production --format short
eas env:list production --scope account --format short
eas build:view YOUR_INSTALLED_BETA_BUILD_ID --json
eas update:list --branch beta --limit 10 --json
```

Expected project is `@rogeonee/lapsha` / `22e93af4-b730-40d9-8d51-cb0b60f2603e`, main app `com.rogeonee.lapsha`. Confirm beta maps only to beta and no other channel shares that branch. Before production bootstrap, a missing production channel is expected; once it exists verify its mapping too. Check that the target channel is not paused, and check for an active rollout; finish/revert it deliberately before publishing another update. Review environment names/values locally without copying credentials into release evidence.

Resolve the candidate runtime using the same environment as the installed beta binary. These commands only read EAS variables and compute local configuration/hashes; they do not upload an update:

```sh
env -u APP_VARIANT EXPO_NO_DOTENV=1 eas env:exec --environment production 'test -z "$APP_VARIANT" && bunx expo-updates runtimeversion:resolve --platform android'
env -u APP_VARIANT EXPO_NO_DOTENV=1 eas env:exec --environment production 'test -z "$APP_VARIANT" && bunx expo-updates runtimeversion:resolve --platform ios'
```

Compare each resulting `runtimeVersion` with the **same platform's installed beta build runtime** recorded above. No match means no OTA for that binary: stop and prepare a native build, or check out the old binary's source and backport a JS-only fix. Do not assume the latest build is the one testers installed. For source-level diagnosis, `bunx expo-updates fingerprint:generate --platform android` (or `ios`) emits local hash inputs; use the same environment. `eas fingerprint:generate/compare` can upload fingerprint records, so they are not part of this no-publication validation path.

When the single heavy-job slot is available, validate exports sequentially under the same environment, using distinct output directories:

```sh
env -u APP_VARIANT EXPO_NO_DOTENV=1 eas env:exec --environment production 'test -z "$APP_VARIANT" && bunx expo export --platform android --output-dir dist/ota-android'
env -u APP_VARIANT EXPO_NO_DOTENV=1 eas env:exec --environment production 'test -z "$APP_VARIANT" && bunx expo export --platform ios --output-dir dist/ota-ios'
```

These are local bundles, not native builds or delivery tests. A compatible release build on a device is still required. Preview testing uses `preview` channel/environment and must independently match its runtime; a development client's ability to load an update does not prove the beta channel is wired correctly.

## Publish only after release authorization

Choose one platform explicitly. Example for Android beta after all gates above pass:

```sh
env -u APP_VARIANT eas update --channel beta --environment production --platform android --message "Describe the fix; source COMMIT_SHA" --upload-source-maps
```

For iOS, use the same command with `--platform ios` after its own runtime/device checks. This keeps an Android-only fix from updating iOS by default. Use `--platform all` only when both runtimes and both platform changes are approved. Publishing exports the current working tree; a commit message alone does not guarantee clean source. Avoid `--skip-bundler` and stale `dist` artifacts. Build-profile `uploadSourceMaps` does not apply to updates, hence the explicit flag for Observe symbolication.

Save returned group/update IDs, branch, platform, runtime(s), source SHA, EAS environment, target build IDs, operator, and rollback target. Confirm with `eas update:view GROUP_ID --json`. On an installed compatible beta release, launch online to download, then fully close/reopen (up to twice); verify the intended change and update identity, cold/offline launch, records/photos/preferences, and Observe diagnostics. Normal startup downloads in the background and applies on a later restart; it does not force a reload while someone is editing. Delivery and diagnostics are owner acceptance gates, not established by this PR.

For a larger beta or future public release, add `--rollout-percentage 10` to the approved publish. It is a percentage of eligible installations, not a named tester group. For a tiny beta, the default 100% after preview/device acceptance is more useful. Inspect the exact group and increase deliberately:

```sh
eas update:view GROUP_ID --json
eas update:edit GROUP_ID --rollout-percentage 100
```

For future production, require a production-channel binary with the same platform/runtime and identical code/config environment. After beta acceptance, promote the exact tested bundle rather than rebuilding it:

```sh
eas update:view VERIFIED_BETA_GROUP_ID --json
eas update:republish --group VERIFIED_BETA_GROUP_ID --destination-channel production --platform android --rollout-percentage 10 --message "Promote verified beta fix"
```

Recheck both channel mappings and the production runtime first. Substitute `ios` for an independently verified iOS group. Promoting an OTA does not promote a store binary and never changes its embedded channel.

## Rollback

First record the bad group ID, channel/branch, runtime, platform, and incident; inspect `eas update:view BAD_GROUP_ID --json` and channel mappings. All commands below mutate delivery and need release/incident authorization. Use one option appropriate to the state:

```sh
# Active percentage rollout: return to its control update (or embedded bundle).
eas update:revert-update-rollout --group BAD_ROLLOUT_GROUP_ID --message "Revert failed rollout"

# Completed rollout: publish a newer copy of a known-good, same-runtime bundle.
eas update:republish --group KNOWN_GOOD_GROUP_ID --destination-channel beta --platform android --message "Rollback bad group BAD_GROUP_ID"

# No safe previous OTA: target one platform and exact installed runtime.
eas update:roll-back-to-embedded --channel beta --platform android --runtime-version EXACT_ANDROID_RUNTIME --message "Restore embedded beta bundle"
```

Use `ios` with its own runtime for iOS; use `production` only for a confirmed production incident. Reverting a rollout group affects its platform set, so inspect the group before doing so. For a simpler latest-group rollback, `eas update:rollback BAD_GROUP_ID --platform android` selects the preceding update, or embedded when none exists; inspect that target rather than assuming it is healthy. Never delete an update or move a channel to a different runtime as a rollback strategy. Republish/rollback does not need `--environment` because it does not rebuild JS.

Verify the new group, then online restart/download behavior and data retention on affected devices. Offline devices cannot receive the rollback until they reconnect. A paused channel serves no new updates, including recovery updates: pausing is containment for future downloads, not a fix for devices already running bad code. Resume only after verifying the channel's recovery target. Recheck every affected runtime independently; a command for one runtime does not recover others. Fix forward if persisted data no longer supports the older bundle. A later compatible publish supersedes an embedded rollback directive.

## Official references

Reviewed October 15, 2026; CLI flags also checked locally against EAS CLI 24.14.0 and `expo-updates` 57.0.26.

- [EAS Update setup](https://docs.expo.dev/eas-update/getting-started/): client/configuration, initial build, explicit environment, restart behavior.
- [Branches and channels](https://docs.expo.dev/eas-update/eas-cli/): mappings and inspection commands.
- [Runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/) and [Updates SDK](https://docs.expo.dev/versions/latest/sdk/updates/): native boundaries, fingerprint policy, client behavior.
- [Deployment](https://docs.expo.dev/eas-update/deployment/): stable audiences and promotion; fingerprint recommendation caveat above.
- [EAS environments](https://docs.expo.dev/eas/environment-variables/usage/): SDK 55+ environment requirement and build/update consistency.
- [Rollouts](https://docs.expo.dev/eas-update/rollouts/) and [rollbacks](https://docs.expo.dev/eas-update/rollbacks/): gradual delivery and recovery.
- [EAS CLI reference](https://docs.expo.dev/eas/cli/): exact update, republish, rollback, and inspection flags.
