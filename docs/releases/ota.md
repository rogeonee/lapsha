# Beta delivery

[The beta workflow](../../.eas/workflows/beta.yml) delivers app changes from `master` after quality checks pass. Matching native fingerprints publish Android and iOS OTA updates; a changed runtime builds and submits both platforms to Play internal testing and internal TestFlight. Docs, skills, tests, and deployment tooling alone do not deploy; the workflow owns the path filters.

## Setup

- Connect the repository to EAS with base directory `/` and retain its managed signing/store credentials.
- Store an Expo access token as `BETA_EXPO_TOKEN`, visibility **Secret**, in the EAS `production` environment. Custom jobs use it to read delivery history and publish updates.
- Enable automatic distribution for the intended internal TestFlight group and automatic app updates on both phones.
- Keep the `beta` build/submit profile and OTA channel separate from public `production`. The `beta` channel must point only to the EAS `beta` branch. Leave `APP_VARIANT` unset in production.

Merging the workflow activates delivery. Install the first OTA-enabled store binaries without uninstalling, verify existing data/photos and offline launch, then check a JS-only OTA on both devices. By default, an OTA downloads on launch and applies on the following restart.

## Retry and renewal

Inspect failures in the EAS workflow dashboard. Successful submissions are recorded in workflow outputs, so a retry can reuse a compatible pending build and skip the platform already delivered. Newer app revisions supersede older runs; docs-only commits do not interrupt delivery.

Retry the current master, or force fresh binaries when needed:

```sh
eas workflow:run .eas/workflows/beta.yml --ref master
eas workflow:run .eas/workflows/beta.yml --ref master --input force_native=true
```

Use `force_native` if a store accepted an upload before its delivery checkpoint was saved, or the planner cannot find a recent checkpoint. Check the store first to avoid repeatedly submitting an accepted binary.

A Monday 15:00 UTC check renews binaries when the iOS build reaches 75 days, before TestFlight's 90-day expiry. Otherwise it does nothing. EAS schedules require a paid plan; use the manual fresh-build command before expiry if scheduling is unavailable.

## Rollback

Inspect the affected platform/runtime and choose a known-good update with the same runtime, or restore that runtime's embedded bundle:

```sh
eas update:republish --group KNOWN_GOOD_GROUP_ID --destination-channel beta --platform android --message "Restore known-good beta"
eas update:roll-back-to-embedded --channel beta --platform android --runtime-version EXACT_ANDROID_RUNTIME --message "Restore embedded beta"
```

Use the corresponding iOS runtime separately. Revert or fix the bad source change too: the next compatible master delivery supersedes the rollback. Recovery reaches devices after they reconnect and restart. OTA rollback cannot undo SQLite migrations or restore deleted photos, so persisted-data changes must remain backward compatible.
