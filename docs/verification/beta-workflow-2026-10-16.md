# Automatic beta workflow verification — October 16, 2026

PR #45 was updated in its existing `codex/eas-ota-tracks` checkout by merging `origin/master` at `0505de6` (Expo 58). The package and lockfile conflicts were resolved from master, then `bunx expo install expo-updates` selected `~58.0.17`. No app screen or behavior was edited.

## Verified without delivery

- Frozen Bun dependency installation and online `expo install --check` passed.
- `bun run check` passed. The UTC suite passed 110 tests, including 12 rollout tests; the Edmonton and Tokyo suites each passed 52 tests.
- EAS CLI 25.1.1's server-side `workflow:validate` accepted both `beta.yml` and the existing `quality.yml`. Validation does not enqueue a run.
- The rollout tests cover input filtering, bootstrap, OTA selection, native changes on either platform, cached submission retries, historical native reverts, TestFlight renewal, force-native recovery, partial checkpoints, publication gating, and channel isolation.
- A real temporary shallow Git checkout test allowed a newer documentation commit, rejected newer app code, and rejected a feature-branch source. Its origin was a local fixture, with no external delivery calls.
- Expo native config introspection enabled the update client on both platforms with the correct project URL and automatic launch checks. iOS uses the fingerprint placeholder; Android uses the generated runtime resource. Both local runtime-resolution commands completed. Runtime values must be recomputed for the final release environment, not copied from this evidence.
- Read-only EAS inspection found no update channels. `BETA_EXPO_TOKEN` was absent from both project and account production environments. No environment values or credentials were recorded.
- `git diff --check` passed. The merged Expo 58 source and patches remain unchanged relative to master.

## Activation and remaining acceptance

Before merging, configure the production `BETA_EXPO_TOKEN` secret and confirm that the intended internal TestFlight group automatically receives builds. The weekly expiry schedule requires a paid EAS plan; manual `force_native` remains available otherwise.

Merging this PR activates master-to-beta delivery and triggers the initial OTA-enabled store builds. Actual signing/build success, store processing, internal group availability, installation without data loss, and delivery of a subsequent OTA require that first authorized run and device acceptance.

No workflow was dispatched, no native build or JS export was run, no store submission or OTA was published, and no channel, branch, credential, or account setting was changed during this rework. The PR remains a draft.
