# Plan 003: Complete entry saves when preference storage fails

> Executor: implement this plan only in your assigned isolated worktree. Follow the verification gates and report deviations. The coordinator maintains plans/README.md. Commit only the allowed implementation/test files; do not push or merge master.

## Status

- Priority: P2
- Effort: S (hours)
- Risk: LOW; one optional-preference operation, preserving primary database saves.
- Depends on: none
- Category: bug
- Planned at: 2835b29fdec6e5d8561d21d495f08dc627d27a8c, 2026-09-25
- Original audit finding: 3

## Why this matters

A successful fact/date save currently persists the optional last-person preference before dismissing its sheet. That preference lives in a separate SQLite database. If its synchronous write throws after the notebook record commits, the sheet remains open and a retry can create another record. Make remembering the selection best effort so this optional operation cannot turn a completed content save into an apparent failure.

## Current state and conventions

Repository root at planning time: /Users/rogeonee/dev/projects/lapsha. Run commands from your assigned worktree root instead.

src/components/entry/use-entry-form.ts:113-121 handles the primary service result:

~~~ts
if (response.error) {
  Alert.alert('Error', response.error.message || 'Failed to save.');
  return;
}
if (config.mode === 'create') {
  setLastPersonId(personId);
}
onClose();
~~~

src/lib/prefs.ts:45-48 is its only last-person setter:

~~~ts
export function setLastPersonId(personId: string): void {
  Storage.setItemSync(LAST_PERSON_KEY, personId);
  notifyPreferenceChange();
}
~~~

notifyPreferenceChange synchronously calls a Set of subscribers. The person screen subscribes for sorting. clearPreferences uses clearPreferenceKeys and must still signal incomplete cleanup to the existing Clear All Data workflow. Do not hide those errors.

Error reporting follows the fixed-message pattern in src/lib/avatars.ts and src/api/error-handling.ts:

~~~ts
Observe.reportError(new Error('Avatar deletion failed'));
~~~

Use a new fixed message for a last-person preference failure, with no original exception, cause, ID, key value, or personal content attached. expo-observe is already installed; its reportError API handles its own reporting errors.

AGENTS.md says: "Services are synchronous" and "handled failures use fixed error messages." PRODUCT.md's relevant goal is "Capture in seconds." Both native sheets share useEntryForm, so fix the shared operation without changing iOS/Android presentations. React Compiler is enabled; no manual memoization is needed.

## Scope

Only modify/create:

- src/lib/prefs.ts
- tests/last-person-preference.test.ts
- tests/helpers/last-person-preference-worker.ts

Read-only context: src/components/entry/use-entry-form.ts, src/api/error-handling.ts, src/lib/avatars.ts, src/lib/preference-cleanup.ts, tests/clear-data.test.ts, both entry-sheet platform files.

Out of scope: sorting behavior, preference reads, listener architecture, Clear All Data behavior, schemas, services, sheet presentation, add-person flow, dependencies/lockfile, global duplicate-tap prevention, unrelated telemetry changes, PRELAUNCH.md, notebook.md. Do not add a generic save controller or a fake React renderer for this small change.

## Commands

| Purpose | Command | Expected |
| --- | --- | --- |
| Drift | git diff --stat 2835b29..HEAD -- src/lib/prefs.ts tests/last-person-preference.test.ts tests/helpers/last-person-preference-worker.ts | No unexplained implementation drift |
| Setup, new worktree only | bun install --frozen-lockfile | Exit 0; bun.lock unchanged; native patches apply |
| Baseline/all tests | bun test tests | Baseline 50 pass; final all pass |
| Focused test | bun test tests/last-person-preference.test.ts | All failure/success cases pass after implementation |
| Types | ./node_modules/.bin/tsc --noEmit | Exit 0 |
| Lint | CI=1 bun run lint -- --no-cache | Exit 0 |
| Diff hygiene | git diff --check | Exit 0 |

## Steps

### 1. Establish the regression at the exported preference boundary

Create a Bun test wrapper that launches the worker in a separate process with Bun.spawnSync and checks exitCode/stdout/stderr. In the worker, use mock.module from bun:test for expo-sqlite/kv-store and expo-observe BEFORE dynamically importing the actual src/lib/prefs.ts. Use node:assert/strict for assertions. This keeps native-module mocks out of the parent test process and avoids affecting the database tests from another plan.

Use controlled storage and observer spies, not a replacement implementation of setLastPersonId. Subscribe/unsubscribe through the real subscribeToPreferences API. Cover:

1. Successful storage writes the lastPersonId key with the supplied synthetic UUID and notifies once.
2. A storage exception does not escape setLastPersonId; no change notification is issued for the failed write.
3. A subscriber exception after successful storage also cannot escape this optional last-person operation.
4. Failure reports use a fixed message and do not forward a synthetic sensitive marker from the original exception or ID.
5. clearPreferences still reports failed removals; the last-person best-effort boundary must not swallow cleanup failures.

Verify: bun test tests/last-person-preference.test.ts must initially fail for the expected uncaught last-person error; the existing bun test tests/clear-data.test.ts must still pass. Record the red result before fixing it.

### 2. Make just the last-person update best effort

Add an Observe import and a narrow try/catch around the existing storage write and notification in setLastPersonId. Catch without binding or forwarding the original error. Report one fixed diagnostic such as "Saving last person preference failed" and return normally. Successful behavior and the public void return type stay the same.

Do not wrap all preferences or change clearPreferences/setSortPref. Leave useEntryForm's service-error return and subsequent onClose sequence intact; verify the current caller inventory with rg -n 'setLastPersonId' src.

Verify: bun test tests/last-person-preference.test.ts passes all cases, including the formerly failing storage/subscriber cases. The caller inventory still shows the one entry-form call.

### 3. Validate both the fix and the unaffected cleanup contract

Run bun test tests, TypeScript, lint, and git diff --check. Review the whole diff for scope. The automated regression proves that the actual optional setter cannot interrupt its caller; do not describe this as an end-to-end native failure-injection test.

Coordinate a quick native success-path check through the coordinator: create one synthetic fact and one synthetic date, verify each sheet dismisses and each entry appears exactly once; reopen global quick add and verify the last-person choice is remembered on normal storage. Test editing once to ensure it remains unaffected. Do not damage a device's preference database to manufacture the failure.

Use the existing iOS development client/simulator or the connected physical Pixel; no native API changed. Device ownership is serialized by the coordinator. If a rebuild is necessary, use the existing native patch configuration and an explicit simulator/device selection.

Verify: commands above exit 0 and the coordinator records actual native outcomes in plans/evidence/003-entry-save.json, including platform, OS, commit, cases, and any unverified scope.

## Test plan

The new process-isolated last-person preference worker tests the exported production setter with controlled native boundaries. Follow the assertion style in tests/clear-data.test.ts; cases are enumerated in step 1. Run the focused test before/after the fix, then the full suite. Native success-path evidence complements the injected storage/subscriber failures; it does not replace them.

## Done criteria

- [ ] Focused tests prove actual setLastPersonId contains storage/subscriber errors and preserves its successful write/notify contract.
- [ ] The sensitive synthetic exception marker and person ID do not reach the reported Error payload.
- [ ] Existing cleanup error tests still pass.
- [ ] bun test tests, TypeScript, lint, and git diff --check pass.
- [ ] Changes are limited to the three in-scope implementation/test files.
- [ ] Coordinator records the native success-path result or explicitly retains a verification blocker.

## Git workflow

Use branch codex/complete-entry-saves in the assigned worktree. Commit a coherent passing change with a message such as "fix: complete entry saves when preferences fail". Send the coordinator the commit SHA, worktree path, complete diff scope, commands/results, and limitations. The coordinator updates the index/evidence; do not edit the primary checkout.

## STOP conditions

- Live excerpts or caller inventory differ materially; ask the coordinator to reconcile the plan.
- The fix needs broader preference/error-handling changes, dependencies, or out-of-scope source edits.
- The new tests load a real device database, native module, or personal data.
- A check fails twice after reasonable targeted corrections. Report the actual failure, not success.

## Maintenance

The last-person value is a convenience, not part of a notebook save's transaction. Keep this contract explicit when adding callers. Preference reads/sort failures and generic repeated-tap guards are separate work. Preserve truthful cleanup reporting even though individual optional preference writes now tolerate failure.
