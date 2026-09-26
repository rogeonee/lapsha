# Plan 005: Add repeatable tests for actual SQLite migrations and services

> Executor: work in your assigned isolated worktree, preserve production behavior, and commit the scoped changes. The coordinator maintains the index. Do not push or merge master.

## Status

- Priority: P2
- Effort: M (approximately a day)
- Risk: LOW for tests; MED for the mechanical migration-runner extraction, which must preserve every SQL statement and native startup behavior.
- Depends on: none; original audit #1 is already fixed on this baseline.
- Category: tests
- Planned at: 2835b29fdec6e5d8561d21d495f08dc627d27a8c, 2026-09-25
- Original audit finding: 5

## Why this matters

Lapsha's only notebook copy lives in local SQLite. The current 50-test suite covers dates, civil-day updates, and clear-data behavior, but not the real schema migrations or the CRUD service SQL. Repeatable in-memory tests should detect data loss, broken deletion visibility, incorrect denormalized dates, and schema-version drift before an app update.

## Current state and domain rules

Planning root is /Users/rogeonee/dev/projects/lapsha; implementation commands run from your worktree.

src/api/database.ts opens the native database immediately:

~~~ts
export const db = openDatabaseSync('lapsha.db', { enableChangeListener: true });
~~~

Its private migrate() sets WAL/foreign keys, reads user_version, repairs the historical incorrectly stamped v2 case, then applies v1/v2/v3 in separate synchronous transactions. Schema version is 3. The v2 block rebuilds facts, normalizes blank labels to NULL, and assigns sort_order; v3 adds persons.avatar.

Key v2 SQL from src/api/database.ts:

~~~sql
INSERT INTO facts_new (id, person_id, label, value, sort_order, created_at, updated_at, deleted_at)
  SELECT id, person_id, NULLIF(TRIM(label), ''), value, 0, created_at, updated_at, deleted_at
  FROM facts;
DROP TABLE facts;
ALTER TABLE facts_new RENAME TO facts;
CREATE INDEX IF NOT EXISTS idx_facts_person_id ON facts(person_id);
ALTER TABLE dates ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
~~~

Every migration stamps PRAGMA user_version inside its own transaction. Preserve the historical repair exactly: a stamp >=2 with no dates.sort_order is treated as version 1.

clearAllData already delegates to clearDeviceData(db, clearPreferences, clearAvatarFiles). Existing tests/clear-data.test.ts uses real bun:sqlite and a small adapter:

~~~ts
const sqlite = new Database(':memory:');
const database = {
  execSync: (source) => sqlite.exec(source),
  withTransactionSync: (task) => sqlite.transaction(task)(),
};
~~~

Follow this pattern with typed boundaries and close each test database. No React Native runtime is needed for SQL behavior.

Production services are src/api/people/people-service.ts, facts/facts-service.ts, dates/dates-service.ts, and timeline/timeline-service.ts. They import the singleton db, use synchronous methods, validate with real Zod schemas, and return ServiceResponse<T>. Example, facts-service.ts:

~~~ts
return runServiceOperation(() => {
  const validated = createFactSchema.parse(factData);
  assertPersonExists(validated.person_id);
  // Parameter-bound SQL insert, then read the actual row.
  return getFactOrThrow(id);
});
~~~

Use actual services and runServiceOperation, not mock implementations. Notebook facts with label NULL are valid unlabeled details, not a separate notes entity. All ordinary lists exclude deleted_at rows; timeline excludes deleted people too. Birthday ordering uses a case-insensitive reserved label, not a newly invented uniqueness constraint.

Unknown-year dates store 0001, including intentional 0001-02-29; rowToDate converts year_known 0/1 to a boolean. Date helpers project February 29 to March 1 in non-leap years. Do not reinterpret unknown-year storage or change timeline semantics in this plan.

AGENTS.md: "Stamp PRAGMA user_version inside the same transaction as each migration's schema changes." Services use expo-crypto randomUUID in production. Never use global crypto in app code. Synthetic deterministic UUIDs or node:crypto are fine inside isolated tests.

## Scope

Allowed production files:

- src/api/database.ts
- src/api/migrations.ts (new, native-runtime-independent migration runner)

Allowed tests:

- tests/database-migrations.test.ts
- tests/database-services.test.ts
- tests/helpers/sqlite-fixture.ts
- tests/helpers/database-service-worker.ts
- tests/fixtures/legacy-databases.ts

Read existing tests/dates.test.ts, tests/current-day.test.ts, tests/clear-data.test.ts and the actual services/schema modules before writing expectations.

Out of scope: production service/schema/query changes, a new schema version, rewriting migrations, data repair beyond existing behavior, ORM/dependency/test-framework additions, package.json/bun.lock/tsconfig changes, UI code, backup/export work, telemetry redesign, existing user databases, PRELAUNCH.md/notebook.md. Do not fix a newly discovered bug silently to make a characterization test pass; report it separately.

## Commands

| Purpose | Command | Expected |
| --- | --- | --- |
| Drift | git diff --stat 2835b29..HEAD -- src/api/database.ts src/api/migrations.ts tests/database-migrations.test.ts tests/database-services.test.ts tests/helpers/sqlite-fixture.ts tests/helpers/database-service-worker.ts tests/fixtures/legacy-databases.ts | No unexplained drift |
| Setup | bun install --frozen-lockfile | Exit 0; lockfile unchanged |
| Baseline/all tests | bun test tests | Baseline 50 tests pass; final expanded suite passes |
| Focused SQL coverage | bun test tests/database-migrations.test.ts tests/database-services.test.ts | All migration/service cases pass |
| Calendar zones | TZ=UTC bun test tests/dates.test.ts tests/current-day.test.ts | Pass |
| Calendar zones | TZ=Asia/Tokyo bun test tests/dates.test.ts tests/current-day.test.ts | Pass |
| Calendar zones | TZ=America/Edmonton bun test tests/dates.test.ts tests/current-day.test.ts | Pass |
| Types | ./node_modules/.bin/tsc --noEmit | Exit 0 |
| Lint | CI=1 bun run lint -- --no-cache | Exit 0 |
| Whitespace | git diff --check | Exit 0 |

## Steps

### 1. Extract only the existing migration runner

Create src/api/migrations.ts with an exported migrateDatabase(database) and a minimal structural database interface for execSync, generic getFirstSync/getAllSync, and withTransactionSync. Move SCHEMA_VERSION, hasColumn, and the existing migration body into this module mechanically; pass the database explicitly.

Keep src/api/database.ts responsible for openDatabaseSync('lapsha.db', { enableChangeListener: true }), exactly one migrateDatabase(db) startup call, the exported db, and the existing clearAllData delegation. Keep the new module free of runtime imports from Expo, avatars, preferences, or services. Do not change SQL text, PRAGMA placement, transaction boundaries, migration order, or the historical repair.

Verify: TypeScript and bun test tests pass. Review git diff -- src/api/database.ts src/api/migrations.ts against the original SQL; all behavioral content is preserved and only the dependency boundary moved.

### 2. Exercise migrations using real SQLite and legacy fixtures

Extend the adapter pattern from tests/clear-data.test.ts into tests/helpers/sqlite-fixture.ts. It must wrap an in-memory bun:sqlite Database, expose only the required Expo-compatible synchronous methods, and close the connection during test cleanup. Keep tests deterministic with synthetic UUIDs and distinct fixed creation timestamps.

Build legacy fixtures in tests/fixtures/legacy-databases.ts: fresh v0; actual historical v1 schema; v1 schema incorrectly stamped v2; actual v2 schema. Fixtures describe old schemas and rows only. Never duplicate the CURRENT migration implementation or extract/execute source text with regex/eval.

For each fixture call the actual migrateDatabase and assert:

- Final user_version = 3; tables, person/date indexes, nullable facts.label, dates.sort_order, and persons.avatar exist.
- Seeded people, active/deleted facts and dates, timestamps, links, and 0001-02-29 survive unchanged except the intended v2 label/order transformations.
- Blank/whitespace legacy labels become NULL; meaningful labels retain the migration's existing TRIM behavior.
- sort_order backfill is deterministic per person with distinct timestamps; don't assert ordering of timestamp ties.
- PRAGMA foreign_key_check returns no rows and foreign_keys is enabled. In-memory SQLite does not report journal_mode=wal, so do not assert WAL as a result on :memory:.
- Calling migrateDatabase again is idempotent.
- v2->v3 rollback: wrap withTransactionSync with a real Bun transaction that calls the migration callback. INSIDE that transaction, after the callback and before throwing, assert that persons.avatar exists and user_version is already 3; then throw an injected error before commit. Outside the failed transaction, verify avatar is absent, user_version is 2, legacy rows survived, and a normal retry succeeds. The inside-transaction assertions are essential: otherwise moving the stamp after withTransactionSync could incorrectly pass this test because the injected throw prevents the misplaced stamp from executing. This must exercise a real SQL rollback, not a mocked assertion that a callback was called.

Verify: bun test tests/database-migrations.test.ts passes. Deliberately changing the fixture's expected preserved value should fail the appropriate test; restore that temporary expectation before committing.

### 3. Test real service SQL behind native-boundary mocks

Create tests/database-services.test.ts as a parent Bun test that spawns a separate Bun worker process and asserts a successful exit with useful error output. The worker tests the actual services. Keep native-module mocking entirely inside tests/helpers/database-service-worker.ts so it cannot poison the preference worker or existing date tests in the parent suite.

Worker setup:

1. Create an in-memory DB with the same typed adapter and run the actual migrateDatabase.
2. Before importing services, mock only their native boundaries: the resolved src/api/database module exports this adapter as db; expo-crypto exports synthetic UUID generation; expo-observe exposes a recording no-op reportError.
3. Dynamically import the real people/facts/dates/timeline services and real error-handling/Zod modules. Verify mock resolution respects the repository's ~/ alias.
4. Use node:assert/strict on service responses AND persisted SQL rows. Close the DB in finally. Do not mock services, schemas, runServiceOperation, or SQL results.

Coverage:

- People create/read/update, trimmed names, avatar bare filenames, validation failures with no inserted row, and soft deletion.
- Fact create/read/update/delete; null vs omitted label semantics; invalid parent/soft-deleted parent rejection; validation failure leaves row counts unchanged.
- Date create/update including 0001-02-29, label-only updates preserving date, consistent month/day/year_known, invalid-date rejection without writes, and case-insensitive birthday-first ordering.
- Deterministic created/modified ordering using explicitly seeded distinct timestamps, not real-time sleeps.
- Timeline includes live dates/people and excludes soft-deleted dates and dates belonging to soft-deleted people. Do not assert a new behavior for unused timeline options.
- Database constraint failure becomes an error response and uses the existing fixed telemetry message; never forward synthetic sensitive error values to the observer spy.

Verify: bun test tests/database-services.test.ts passes; then bun test tests proves the worker's mocks have not affected any other file.

### 4. Check native startup and report test boundaries

Run focused SQL tests, all tests, the three-zone calendar commands, TypeScript, lint, and diff hygiene once after final changes.

Coordinate a quick native smoke check on one available iOS simulator with an existing matching development client: cold launch the JS change, create/edit a synthetic person/fact/date, navigate between lists/details, and restart to verify persistence and change-listener-driven refresh. Do not upgrade, reset, or manipulate an existing user's schema. A full native migration/OS-restore matrix remains outside this coverage plan.

If a fresh development build is necessary, the coordinator schedules bun run ios with an explicit verified simulator UDID; do not remove native patches or bypass their installation.

Verify: all commands exit 0 and coordinator evidence plans/evidence/005-database-tests.json records test totals plus native smoke platform/OS/commit/outcomes. Explicitly distinguish desktop SQLite coverage from Hermes/Expo-native SQLite verification.

## Test plan

Use tests/clear-data.test.ts as the real-SQL adapter/assertion exemplar and tests/dates.test.ts for table-driven validation cases. New migration tests call the actual extracted runner; new service tests execute actual production services against SQLite in a process-isolated native-boundary harness. Steps 2 and 3 enumerate required assertions. Run both focused files and the whole suite, plus calendar tests in the three listed timezones.

## Done criteria

- [ ] All five migration scenarios (fresh, v1, bad v2 stamp, v2, injected rollback/retry) exercise the actual runner and pass; the rollback test observes both the schema change and new version inside the transaction before verifying both roll back.
- [ ] Re-running migrations preserves schema/data/version.
- [ ] Real services are exercised against actual SQL, including validation, CRUD, soft-deleted visibility, birthday order and denormalized dates.
- [ ] Native-boundary mocks remain process-isolated; bun test tests passes as one suite.
- [ ] Calendar timezone checks, TypeScript, lint, and git diff --check pass.
- [ ] Native startup/list-refresh/persistence smoke result is recorded without claiming full device migration/restore coverage.
- [ ] The only production diff is migration extraction/wiring; no SQL/domain behavior or dependency changes.
- [ ] Every changed file is within scope.

## Git workflow

Branch codex/database-regression-tests. Suggested commit: "ref: expose migrations for database regression tests" or separate coherent ref/chore commits. Commit only the scoped files in the isolated worktree, then report SHA(s), actual cases/checks, and limitations to the coordinator. Do not push or merge master.

## STOP conditions

- Live migration/service contracts differ from this plan; reconcile before implementing.
- A behavior test uncovers a real production bug: report the smallest reproduction and expected/actual behavior; do not alter services outside scope.
- Adapter parity requires mocking SQL outcomes or duplicating migration code.
- Native module mocks leak into another suite, a real on-device DB is opened, or any personal data enters fixtures/output.
- A production behavior/schema change, dependency addition, or out-of-scope file edit appears necessary.
- The same required check fails twice after targeted attempts.

## Maintenance

Future migrations must get a new legacy fixture plus data/version rollback assertions. Run these tests before altering destructive schema operations. Keep the adapter small and explicit; its limitations must not be confused with Expo-native guarantees. The native change listener, iOS/Android SQLite versions, backup/restore, and real storage failure modes still need device coverage when those behaviors change.
