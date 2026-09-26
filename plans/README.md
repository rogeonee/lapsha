# Lapsha improvement plans

Prepared on 2026-09-25 against commit 2835b29fdec6e5d8561d21d495f08dc627d27a8c.
The user selected original audit findings 3, 4, and 5 for implementation by subagents under a separate coordinator task. Plan numbers preserve the original finding numbers.

## Execution order and status

| Plan | Outcome | Priority | Effort | Depends on | Status |
| --- | --- | --- | --- | --- | --- |
| [003](003-complete-entry-saves.md) | Complete entry saves when last-person preference persistence fails | P2 | S | None | DONE |
| [004](004-reset-removed-photo.md) | Restore compact photo and readable header state after photo removal | P2 | S | None | DONE |
| [005](005-database-regression-tests.md) | Exercise actual migrations and services with repeatable SQLite tests | P2 | M | None | DONE |

Read each plan completely. The coordinator owns this index, its status updates, and evidence files; implementation agents must not race to edit it.
Status vocabulary: TODO, IN PROGRESS, DONE, BLOCKED (with reason), REJECTED (with reason).
DONE requires reviewed implementation and the plan's required verification; record incomplete platform checks explicitly.

## Dependencies and integration

- All three plans can start in parallel in separate Git worktrees. Their production file ownership is disjoint: 003 owns prefs.ts; 004 owns person-screen.tsx; 005 owns database.ts and the new migration module.
- Plan 005 must extend the current cleanup/calendar test baseline. It must not recreate the already-completed cleanup/calendar fixes.
- Run the complete test suite after combining the three approved commits. Isolate native-module mocks in child processes so preferences/service tests cannot contaminate one another.
- Before any future schema or service behavior change, land the repeatable coverage from 005.
- See [COORDINATOR.md](COORDINATOR.md) for dispatch, review, device coordination, and final handoff.

## Current baseline

- Branch master; planned commit 2835b29.
- On 2026-09-25, bun test tests passed: 50 tests, 133 assertions, three files.
- TypeScript check: ./node_modules/.bin/tsc --noEmit passed.
- Lint: CI=1 bun run lint -- --no-cache passed.
- Bun 1.3.6; in-memory bun:sqlite works; bun:test mock.module is available from a plain Bun worker.
- Native setup commands are bun run ios and bun run android; Metro is bun run start.
- The root checkout already has user edits to PRELAUNCH.md and notebook.md. Preserve them exactly; do not stage, revert, copy over, or bundle them with this work.
- No source edits were made to prepare these plans. The plan files themselves are initially uncommitted.
- A fresh-context review of the complete plans found one verification gap: rollback tests must observe the schema and version stamp inside the transaction before injecting failure. Plan 005 now explicitly requires that assertion.

## Device availability and user answer

At planning time no simulator was booted and adb devices showed no device.
Available runtimes include iOS 18.0 and iOS 27.0; iOS 26 is not currently installed.
The user answered: "I’ll connect it for verification" about the physical Pixel.
Continue implementation while waiting; inspect adb devices when verification is ready.
Never substitute an Android emulator or claim Android testing without the physical device.
Use synthetic records/photos only, preserve existing personal data, and serialize access to Metro and each device.

## Findings considered and closed or deferred

- Original #1, integrating the existing cleanup/calendar fixes: completed. Current database.ts delegates cleanup to clearDeviceData, useCurrentDay is present, and clear-data/current-day tests are in the baseline. Do not reopen.
- Original #2, privacy/Observe disclosure: user reports completed. Do not reopen or change privacy documents or the landing site.
- Original #6, native setup documentation: not selected. Do not expand into README cleanup.
- Search and feedback entry: optional product ideas, not authorized in this implementation.
- Local-only data, soft deletion, unknown-year sentinel 0001 (including February 29), light mode, Android photo backup exclusion, and platform-split UI remain accepted choices.
- Timeline unused-option semantics and multi-field person-update atomicity were not demonstrated as active UI bugs. Do not introduce unrelated refactors.
- The audit's dependency advisories do not authorize dependency upgrades.

## Coordinator record

- Coordinator task: Coordinate Lapsha save, photo, and database fixes (01a0dbec-056f-7f32-a43e-9c1bb1316748, local).
- Integration branch/worktree: `codex/improve-003-005` at `/Users/rogeonee/.codex/worktrees/improve-003-005/lapsha` at combined code commit `7e2e113b7fdfc69a60378980efff8f1945dc0297`.
- Final verification/evidence: completed. All three full diffs were reviewed; the coordinator independently reran each applicable test/type/lint gate and the combined suite. Evidence is in [003](evidence/003-entry-save.json), [004](evidence/004-photo-reset.json), and [005](evidence/005-database-tests.json).

## Final handoff

- Combined branch: `codex/improve-003-005`, code HEAD `7e2e113b7fdfc69a60378980efff8f1945dc0297`.
- Combined commits: `64e182ccdadfea2e3bc17d9c69bc2e6f454d259b` (003), `0b03fe0e93c5f3c86bfb17520996a50c0b837a2e` (004), `7e2e113b7fdfc69a60378980efff8f1945dc0297` (005).
- Automated: 57 tests passed, 203 Bun expectations plus worker assertions; TypeScript, lint, committed diff hygiene passed. Calendar checks in UTC, Asia/Tokyo, and America/Edmonton each passed 46 tests / 115 expectations. Process-isolated preference and service mocks coexist.
- Native: focused cases passed on physical Pixel 6 / Android 17 (API 37) and iPhone 16 Pro simulator / iOS 18.0. An additional focused pass also passed on iPhone 18 Pro / iOS 27.0 at `2219241`. Android used distinct `com.rogeonee.lapsha.qa004` because the installed personal release uses another signing key; the release app was preserved. iOS used the existing matching regular development client.
- Native smoke confirmed create/edit, list refresh, correct tab back stacks, and persistence after restart. Photo checks covered removal/readable chrome, re-add/tap/pull, replacement, cancellation, and missing-file fallback after reopen. Synthetic moved files were restored. Device/Metro ownership was serialized; both Metro instances and serve-sim were stopped.
- Coverage limits: the earlier iOS 27 input blocker was resolved with the simulator software keyboard. Its additional pass covered saves/editing, remembered quick-add, glass-header photo reset/re-add/replacement/cancellation, gestures, navigation, and restart persistence. Missing-file and timing repetitions were not repeated on 27; they remain covered on 18/Android. No iOS 26 runtime exists. Rapid removal is immediate sequential UI evidence, not frame-level injection within the 220 ms animation. Failed removal is code-reviewed; preference failure is automated-injected. Native migration/restore and full OS/accessibility matrices remain outside this quick pass. Android emitted Reanimated render-access warnings without observed failure.
- Primary source stayed at `2835b29fdec6e5d8561d21d495f08dc627d27a8c`; existing PRELAUNCH.md and notebook.md content hashes remain unchanged. No merge into master. The user subsequently authorized pushing the combined branch and opening a PR after iOS 27 verification; that verification passed.
