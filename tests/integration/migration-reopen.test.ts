import { expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrateDatabase } from '../../src/api/migrations';
import { seedLegacy } from '../fixtures/legacy-databases';
import { openDiskDatabase } from './helpers/disk-database';

test('failed migration rolls back on disk and retries after reopening without losing legacy rows', () => {
  const directory = mkdtempSync(
    join(tmpdir(), 'lapsha-migration-integration-'),
  );
  const path = join(directory, 'fixture.sqlite');
  let connection = openDiskDatabase(path);
  const rows = () =>
    ['persons', 'facts', 'dates'].map((table) =>
      connection.database.getAllSync<Record<string, unknown>>(
        `SELECT * FROM ${table} ORDER BY id`,
      ),
    );
  const reopen = () => {
    connection.close();
    connection = openDiskDatabase(path);
  };
  try {
    seedLegacy(connection.database, 'v2');
    const before = rows();
    reopen();
    expect(rows()).toEqual(before);
    let reachedCommit = false;
    expect(() =>
      migrateDatabase({
        ...connection.database,
        withTransactionSync(task) {
          connection.database.withTransactionSync(() => {
            task();
            expect(
              connection.database.getFirstSync('PRAGMA user_version'),
            ).toEqual({ user_version: 3 });
            reachedCommit = true;
            throw new Error('synthetic failure before migration commit');
          });
        },
      }),
    ).toThrow('synthetic failure before migration commit');
    expect(reachedCommit).toBe(true);
    reopen();
    expect(connection.database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 2,
    });
    expect(rows()).toEqual(before);
    migrateDatabase(connection.database);
    reopen();
    expect(connection.database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 7,
    });
    expect(rows()).toEqual([
      before[0].map((person) => ({ ...person, avatar: null })),
      before[1],
      before[2],
    ]);
    const schema = connection.database.getAllSync(
      'SELECT * FROM sqlite_master ORDER BY name',
    );
    migrateDatabase(connection.database);
    expect(
      connection.database.getAllSync(
        'SELECT * FROM sqlite_master ORDER BY name',
      ),
    ).toEqual(schema);
    expect(connection.database.getAllSync('PRAGMA foreign_key_check')).toEqual(
      [],
    );
    expect(connection.database.getFirstSync('PRAGMA integrity_check')).toEqual({
      integrity_check: 'ok',
    });
  } finally {
    connection.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
