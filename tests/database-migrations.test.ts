import { expect, test } from 'bun:test';
import { migrateDatabase } from '../src/api/migrations';
import { legacyVersions, seedLegacy } from './fixtures/legacy-databases';
import { sqliteFixture } from './helpers/sqlite-fixture';

test.each(legacyVersions)(
  '%s migrates without losing rows and is idempotent',
  (version) => {
    const { database, close } = sqliteFixture();
    try {
      seedLegacy(database, version);
      const rows = (table: string) =>
        database.getAllSync<Record<string, unknown>>(
          `SELECT * FROM ${table} ORDER BY id`,
        );
      const before =
        version === 'fresh'
          ? null
          : {
              persons: rows('persons'),
              facts: rows('facts'),
              dates: rows('dates'),
            };
      migrateDatabase(database);
      expect(database.getFirstSync('PRAGMA user_version')).toEqual({
        user_version: 7,
      });
      expect(database.getFirstSync('PRAGMA foreign_keys')).toEqual({
        foreign_keys: 1,
      });
      expect(database.getAllSync('PRAGMA foreign_key_check')).toEqual([]);
      for (const [table, column] of [
        ['gifts', 'status'],
        ['persons', 'avatar'],
        ['facts', 'sort_order'],
        ['dates', 'sort_order'],
      ]) {
        expect(
          database
            .getAllSync<{ name: string }>(`PRAGMA table_info(${table})`)
            .some((row) => row.name === column),
        ).toBe(true);
      }
      expect(
        database
          .getAllSync<{ name: string; notnull: number }>(
            'PRAGMA table_info(facts)',
          )
          .find((row) => row.name === 'label')?.notnull,
      ).toBe(0);
      expect(
        database
          .getAllSync<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type = 'index'",
          )
          .map((row) => row.name),
      ).toContain('idx_facts_person_id');
      expect(
        database
          .getAllSync<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type = 'index'",
          )
          .map((row) => row.name),
      ).toContain('idx_dates_person_id');
      if (before) {
        expect(rows('persons')).toEqual(
          before.persons.map((row) => ({ ...row, avatar: null })),
        );
        expect(rows('facts')).toEqual(
          before.facts.map((row) => ({
            ...row,
            label:
              version === 'v2' ? row.label : String(row.label).trim() || null,
            sort_order:
              version === 'v2'
                ? row.sort_order
                : Number(String(row.id).slice(-1)),
          })),
        );
        expect(rows('dates')).toEqual(
          before.dates.map((row) => ({
            ...row,
            sort_order:
              version === 'v2'
                ? row.sort_order
                : Number(String(row.id).slice(-1)),
          })),
        );
      } else {
        expect(rows('persons')).toEqual([]);
        expect(rows('facts')).toEqual([]);
        expect(rows('dates')).toEqual([]);
      }
      const snapshot = [
        rows('persons'),
        rows('facts'),
        rows('dates'),
        database.getAllSync('SELECT * FROM sqlite_master ORDER BY name'),
      ];
      migrateDatabase(database);
      expect([
        rows('persons'),
        rows('facts'),
        rows('dates'),
        database.getAllSync('SELECT * FROM sqlite_master ORDER BY name'),
      ]).toEqual(snapshot);
      expect(database.getFirstSync('PRAGMA user_version')).toEqual({
        user_version: 7,
      });
    } finally {
      close();
    }
  },
);

test('v3 schema and version are visible inside its transaction and roll back together', () => {
  const { database, close } = sqliteFixture();
  try {
    seedLegacy(database, 'v2');
    const snapshot = ['persons', 'facts', 'dates'].map((table) =>
      database.getAllSync(`SELECT * FROM ${table} ORDER BY id`),
    );
    let observed = false;
    expect(() =>
      migrateDatabase({
        ...database,
        withTransactionSync(task) {
          database.withTransactionSync(() => {
            task();
            expect(
              database
                .getAllSync<{ name: string }>('PRAGMA table_info(persons)')
                .map((row) => row.name),
            ).toContain('avatar');
            expect(database.getFirstSync('PRAGMA user_version')).toEqual({
              user_version: 3,
            });
            observed = true;
            throw new Error('injected before commit');
          });
        },
      }),
    ).toThrow('injected before commit');
    expect(observed).toBe(true);
    expect(
      database
        .getAllSync<{ name: string }>('PRAGMA table_info(persons)')
        .map((row) => row.name),
    ).not.toContain('avatar');
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 2,
    });
    expect(
      ['persons', 'facts', 'dates'].map((table) =>
        database.getAllSync(`SELECT * FROM ${table} ORDER BY id`),
      ),
    ).toEqual(snapshot);
    migrateDatabase(database);
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 7,
    });
    expect(database.getAllSync('PRAGMA foreign_key_check')).toEqual([]);
  } finally {
    close();
  }
});
