# Automatic beta delivery

`.eas/workflows/beta.yml` delivers app changes from Git `master` to the existing Play internal track and internal TestFlight. It uses Expo 58, EAS CLI 25.1.1, Bun 1.3.6, fingerprint runtimes, and the real EAS `production` environment. No repack or release branch is involved.

## Activation and first delivery

This change prepares the workflow. No build, submission, OTA, channel, or credential has been created by this rework. **Merging it activates delivery**: the dependency/configuration changes match its push filter, so the first master run creates the OTA-enabled binaries.

Before merging:

- Keep the existing EAS GitHub connection at base directory `/`, with a linked account member who can access the repository.
- Store an EAS access token as the **secret** `BETA_EXPO_TOKEN` in the `production` EAS environment. The custom CLI jobs need project access to read workflow/build history and publish updates; they explicitly use this token rather than relying on a worker's scoped token. Never commit it or put it in an `EXPO_PUBLIC_` variable.
- Retain the existing managed signing and store submission credentials. `submit.beta.android` explicitly targets `internal` / `completed`; beta iOS inherits the existing App Store Connect app/team.
- Enable automatic distribution for the intended internal TestFlight group. The `testflight` job uploads, waits for processing, and supplies test notes; automatic groups receive the new build. No external groups or beta review are configured.
- Enable Lapsha's automatic updates in Play and TestFlight on the phones.

The previously distributed SDK 57 binaries cannot acquire `expo-updates` through OTA. Install the first new beta binary from each store without uninstalling. Check data/photos/preferences, offline cold launch, and one subsequent JS-only OTA on both devices. Local/schema validation does not establish on-device delivery.

## What runs

Pushes to `master` trigger delivery only for paths listed in `beta.yml`: application source, shipped assets, native plugins/patches/modules, dependencies, and app/build configuration. Markdown, reference artwork, the Play listing image, tests, skills, and deployment tooling alone do not deploy. `quality.yml` continues checking all pushes and PRs independently.

The beta workflow has its own quality job running `bun run check`, `bun run test`, and `bun run test:timezones`. Fingerprinting and every delivery job depend on these checks for the checked-out revision.

| Decision                                                           | Delivery                                                                           |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Both recorded beta runtimes match                                  | Publish Android and iOS OTA at 100%                                                |
| Either native fingerprint changes, or no delivered baseline exists | Build and distribute both store binaries                                           |
| A compatible build exists from a failed submission attempt         | Reuse it and retry only the undelivered platform                                   |
| A native revert matches an older historical binary                 | Create new store binaries; the currently installed runtime still needs replacement |
| Weekly check with unchanged runtimes and a fresh iOS binary        | No delivery                                                                        |
| iOS binary is at least 75 days old                                 | Renew both native binaries before TestFlight's 90-day expiry                       |

A native delivery also publishes the current commit's OTA after both submissions succeed, so a reused binary receives the latest JS/assets. The custom publish step passes `--upload-source-maps` for Observe; the native profile retains `uploadSourceMaps: true`.

The Monday 15:00 UTC schedule checks the default branch; EAS schedules require a paid plan. Without scheduling, use the manual fresh-build path before TestFlight expires. It does not send weekly OTA updates. Native renewals intentionally bypass cached binaries. A manual `force_native` input provides the same fresh-build path for recovery. All entry points reject feature-branch commits.

## Compatibility and audiences

The main app remains `com.rogeonee.lapsha`. The store build and OTA channel is `beta`; it maps to the EAS update branch `beta`. EAS branches are separate from Git branches. Standard EAS build/update behavior bootstraps the beta channel/branch on first delivery; verify the mapping during initial acceptance and keep it stable afterward. Before each publish, the helper rejects a paused channel, a branch rollout/redirect, or another channel sharing the beta branch.

`beta` extends the release build settings with `distribution: store` and `environment: production`. Play's internal track is a submission destination, distinct from EAS direct internal distribution. Preview, Gifts Lab, and future public production retain separate channels. A public binary must be built with the production channel; do not promote the beta-channel binary to public release.

The workflow computes fingerprints using the same environment as native builds and updates. Do not set `APP_VARIANT` in production. Native dependencies, config plugins, permissions, icons, and local patches require new runtimes. Fingerprinting may conservatively rebuild for other configuration changes too; never force matching runtime strings to bypass a mismatch.

## Failures and overlapping merges

The `record_delivery` job stores a versioned checkpoint in EAS workflow outputs: each platform's successfully submitted build ID, creation date, and fingerprint pair. It preserves partial success even when another job fails. A completed native build alone never advances this checkpoint. The planner reads the most recent checkpoint, including from failed runs, and reuses compatible pending builds only from commits on the master history. The record is carried through OTA and maintenance runs; no release-state commit or separate database is needed.

New GitHub runs cancel superseded same-branch runs. Guards before native work, submission, and publication reject revisions when newer app inputs exist on master. Later docs-only commits are allowed, so documentation cannot strand an otherwise current app rollout. Cancellation cannot undo a store upload already in progress.

Inspect a failed run before retrying. If cancellation or a worker failure happened after a store accepted an upload but before its checkpoint was saved, inspect the store and use `force_native` for fresh build numbers rather than repeatedly submitting the same binary. If the last 100 runs contain no checkpoint, the planner requires `force_native` to recover conservatively. These checks do not prove a device installed a submitted build; stores control processing and automatic-install timing.

To deliberately retry delivery **after activation**, use EAS's workflow UI or `eas workflow:run .eas/workflows/beta.yml --ref master`. Pass `--input force_native=true` only when new binaries are intended. Both commands perform real delivery; they are not validation commands.

## Rollback

Inspect the bad group, platform, runtime, and previous healthy update in EAS before acting. Republish a known-good **same-runtime** update, or roll that runtime back to its embedded bundle. For example, these commands mutate delivery:

```sh
eas update:republish --group KNOWN_GOOD_GROUP_ID --destination-channel beta --platform android --message "Restore known-good beta"
eas update:roll-back-to-embedded --channel beta --platform android --runtime-version EXACT_ANDROID_RUNTIME --message "Restore embedded beta"
```

Use the corresponding iOS runtime separately. Offline devices receive recovery only after reconnecting. OTA rollback cannot undo SQLite migrations or restore deleted photos: keep persisted-data changes backward compatible, or fix forward. The next compatible master delivery supersedes a rollback, so resolve or revert the bad source change too.

## References

- [EAS deployment pattern](https://docs.expo.dev/eas/workflows/examples/deploy-to-production/) and [workflow syntax](https://docs.expo.dev/eas/workflows/syntax/).
- [Runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/), [update startup behavior](https://docs.expo.dev/versions/latest/sdk/updates/#usage), and [Observe source maps](https://docs.expo.dev/eas/observe/errors/).
- [TestFlight workflow job](https://docs.expo.dev/eas/workflows/pre-packaged-jobs/#testflight) and [Apple's 90-day limit](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).
