import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import {
  clearDeviceData,
  clearRelationalData,
  type TransactionDatabase,
} from '../src/api/clear-data';
import { clearPreferenceKeys } from '../src/lib/preference-cleanup';

function databaseFixture(): {
  sqlite: Database;
  database: TransactionDatabase;
} {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE persons (id TEXT PRIMARY KEY);
    CREATE TABLE facts (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL REFERENCES persons(id)
    );
    CREATE TABLE dates (
      id TEXT PRIMARY KEY,
      person_id TEXT NOT NULL REFERENCES persons(id)
    );
    INSERT INTO persons VALUES ('person');
    INSERT INTO facts VALUES ('fact', 'person');
    INSERT INTO dates VALUES ('date', 'person');
  `);
  return {
    sqlite,
    database: {
      execSync: (source) => sqlite.exec(source),
      withTransactionSync: (task) => sqlite.transaction(task)(),
    },
  };
}

function rowCount(sqlite: Database, table: string): number {
  return sqlite.query(`SELECT COUNT(*) AS count FROM ${table}`).get()!
    .count as number;
}

describe('clear all data', () => {
  test('commits relational deletes together and runs preference/photo cleanup', () => {
    const { sqlite, database } = databaseFixture();
    let preferencesCleared = false;
    let photosCleared = false;

    const result = clearDeviceData(
      database,
      () => {
        preferencesCleared = true;
      },
      () => {
        photosCleared = true;
        return true;
      },
    );

    expect(rowCount(sqlite, 'persons')).toBe(0);
    expect(rowCount(sqlite, 'facts')).toBe(0);
    expect(rowCount(sqlite, 'dates')).toBe(0);
    expect(preferencesCleared).toBe(true);
    expect(photosCleared).toBe(true);
    expect(result.incompleteCleanup).toEqual([]);
  });

  test('rolls every relational delete back when a statement fails', () => {
    const { sqlite, database } = databaseFixture();
    sqlite.exec(`
      CREATE TRIGGER fail_date_delete BEFORE DELETE ON dates
      BEGIN SELECT RAISE(ABORT, 'injected failure'); END;
    `);

    expect(() => clearRelationalData(database)).toThrow('injected failure');
    expect(rowCount(sqlite, 'persons')).toBe(1);
    expect(rowCount(sqlite, 'facts')).toBe(1);
    expect(rowCount(sqlite, 'dates')).toBe(1);
  });

  test('reports failed preferences and photos, then permits an idempotent retry', () => {
    const { sqlite, database } = databaseFixture();
    const partial = clearDeviceData(
      database,
      () => {
        throw new Error('injected preference failure');
      },
      () => false,
    );
    expect(partial.incompleteCleanup).toEqual(['preferences', 'photos']);
    expect(rowCount(sqlite, 'persons')).toBe(0);

    expect(
      clearDeviceData(
        database,
        () => {},
        () => true,
      ).incompleteCleanup,
    ).toEqual([]);
  });
});

test('preference reset attempts both keys and refreshes mounted consumers', () => {
  const attempted: string[] = [];
  let refreshes = 0;

  expect(() =>
    clearPreferenceKeys(
      {
        removeItemSync(key) {
          attempted.push(key);
          if (key === 'sort.facts') throw new Error('injected failure');
        },
      },
      ['sort.facts', 'lastPersonId'],
      () => {
        refreshes += 1;
      },
    ),
  ).toThrow('Preference cleanup incomplete');

  expect(attempted).toEqual(['sort.facts', 'lastPersonId']);
  expect(refreshes).toBe(1);
});
