# Testing Lapsha

Prefer complete user journeys and integration boundaries for new regression
coverage. Keep focused database/migration tests. Retire a narrow unit test only
when a passing replacement protects the same useful behavior (including its
failure cases). The existing date/DST, capture recovery, photo selection,
geometry, and partial-read tests still cover cases outside this first native
slice, so they remain in the host gate.

## Host checks

```sh
bun install --frozen-lockfile
bun run check
bun run test                 # complete host gate, including integration
bun run test:timezones       # calendar/lifecycle checks in Tokyo and Edmonton
bun run test:db              # focused database/service/Given-date regressions
bun run test:integration     # disk persistence and migration reopen/retry
```

The EAS quality workflow runs `check`, `test`, and `test:timezones` on PRs and
master. `test` already includes `tests/integration`; no duplicate CI job is needed.
It does **not** run iOS simulator tests. Host SQL tests use Bun SQLite with mocked
native module boundaries; they do not establish Expo SQLite or OS behavior.

`tests/integration` uses isolated temporary disk databases and actual migrations,
validation and services. An owned writer is killed after its committed marker;
fresh processes assert exact rows, foreign keys and values, perform soft deletion,
and reopen again. A failed migration is closed/reopened, retried and checked for
row/version preservation. Fixed-clock assertions cover UTC, Tokyo and Edmonton.
Temporary databases and child processes are cleaned in `finally` paths.

## Native iOS

Use macOS/Xcode, Node `^22.22.3` or `>=24.8.0`, Bun 1.3.6,
and one of the existing baseline simulators. Serialize all native builds and
device jobs across worktrees. Do not create a simulator to run this suite.

```sh
bun install --cwd e2e --frozen-lockfile --ignore-scripts
bun run test:e2e:check
xcrun simctl list devices available
```

Build a **development simulator binary from the current native dependencies** in
an isolated checkout. Generate/install pods first, then build without launching
or installing the production identity:

```sh
CI=1 node node_modules/expo/bin/cli prebuild --platform ios --no-install
(cd ios && pod install)
xcodebuild -workspace ios/Lapsha.xcworkspace -scheme Lapsha \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath .e2e-build CODE_SIGNING_ALLOWED=NO
bun run test:e2e:ios --app .e2e-build/Build/Products/Debug-iphonesimulator/Lapsha.app \
  --device EXISTING_SIMULATOR_UUID --runs 3
```

The harness validates the source's identity/platform/development-client bundle,
copies only its binary, changes the copy to `com.rogeonee.lapsha.e2e`, ad-hoc signs
it and gives every run a fresh sandbox. It serves this checkout through its owned
Metro port (8092 by default). It refuses an already-installed synthetic identity
and an occupied port. Production/Lab app data is never seeded, read, cleared or
uninstalled. No credentials, AI agent/model, paid service or EAS build is used.

The test cancels an unsaved person draft, then creates Maya, a fact and a text/link
gift through the UI; selects a Given date in the previous month; terminates and relaunches; checks exact native SQLite
values and relationships; cancels person deletion; discards a changed Given date;
relaunches and checks the saved editor values; then confirms gift/person deletion
and checks persisted tombstones after another relaunch. No service seeding or app
backdoor substitutes for UI creation. Day 8/9 of the previous month avoid a moving
"Today" label and exercise month/year navigation. There is no fixed October date.

The runner is pinned separately to `e2e@0.20.0`, `@e2e-dev/mobile@0.12.0`,
and `agent-device@0.21.25` through `e2e/bun.lock`. Upgrade those pins deliberately
and rerun clean repetitions plus the fault experiment.

Locators use accessible names and roles. Calendar dismissal uses the
measured originating Date Picker bounds; sheet dismissal uses a backdrop point
above the observed Sheet Grabber bounds. There are no fixed pixel coordinates. UIKit's
calendar day role varies, so days are matched by exact English accessible label.
The suite currently requires an English, portrait simulator at normal text size.
Do not interpret this as coverage of every locale, size or OS version.

`e2e/artifacts/<timestamp>/` retains setup, Metro and runner logs, reports,
traces, screenshots, provenance, per-run result and cleanup status. Retries are
zero; the first failed repetition stops the run. Keep these synthetic artifacts
local unless deliberately reviewed for sharing. The harness stops only its owned
processes and driver state, uninstalls its clone, removes its binary copy,
and shuts down only a simulator it booted. SIGINT/SIGTERM run cleanup. SIGKILL or
host failure requires inspecting recorded ownership before manual cleanup; never
kill processes by broad name or delete a live session's lock. The cross-worktree
file lock serializes this harness; coordinate other native build tools separately.

## Proving failure detection

After a clean baseline, use an exclusively owned isolated checkout for a mutation
experiment. Temporarily replace the selected/default date expression in production
`createGift` with the literal `2000-01-01`, then run the same `test:e2e:ios` command
against a fresh fixture. Require the **specific persisted Given-date assertion**
to fail; a setup or locator failure is not evidence of fault detection. Restore
the exact original source bytes (verify the hash), then require a fresh unchanged
suite to pass. Do not commit the fault or run another Metro session against that
checkout while it is present. The [verification record](docs/verification/e2e-adoption-2026-10-15.md) links
the measured pass/fail/pass evidence for this adoption slice.

## Limits and next coverage

This is a local development-client proof, not a signed release/update-install or
offline proof. Android has no automated native coverage in this slice; do not run
the destructive fixture against a user's physical installation. A future Android
suite needs its own verified disposable package and synthetic photo fixtures.
Native photo/camera permissions and recovery, real midnight/background transitions,
VoiceOver/TalkBack, physical iOS and remote macOS CI remain separate work. Preserve
the existing host tests protecting those paths until replacements are demonstrated.
