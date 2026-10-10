import { expect, test } from 'bun:test';
import { migrateDatabase } from '../src/api/migrations';
import { sqliteFixture } from './helpers/sqlite-fixture';

function versionSixDatabase() {
  const fixture = sqliteFixture();
  migrateDatabase(fixture.database);
  fixture.database.execSync(`
    DROP INDEX idx_persons_active_created_at;
    DROP INDEX idx_gifts_active_person_id;
    INSERT INTO persons (id, name, created_at, updated_at, deleted_at) VALUES
      ('active', 'Synthetic', '2020-01-01', '2020-01-01', NULL),
      ('deleted', 'Deleted synthetic', '2021-01-01', '2021-01-01', '2021-02-01');
    INSERT INTO gifts (id, person_id, note, created_at, updated_at, deleted_at) VALUES
      ('assigned', 'active', 'Synthetic gift', 'now', 'now', NULL),
      ('unsorted', NULL, 'Synthetic unsorted', 'now', 'now', NULL),
      ('deleted-gift', NULL, 'Deleted gift', 'now', 'now', 'later');
    PRAGMA user_version = 6;
  `);
  return fixture;
}

test('v7 preserves v6 rows and adds indexes that avoid people sorting and cover summaries', () => {
  const { database, close } = versionSixDatabase();
  try {
    const rows = () =>
      ['persons', 'gifts'].map((table) =>
        database.getAllSync(`SELECT * FROM ${table} ORDER BY id`),
      );
    const before = rows();
    const query =
      'SELECT * FROM persons WHERE deleted_at IS NULL ORDER BY created_at DESC';
    const plan = () =>
      database
        .getAllSync<{ detail: string }>(`EXPLAIN QUERY PLAN ${query}`)
        .map((row) => row.detail)
        .join('\n');
    expect(plan()).toContain('TEMP B-TREE');
    migrateDatabase(database);
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 7,
    });
    expect(rows()).toEqual(before);
    expect(plan()).toContain('idx_persons_active_created_at');
    expect(plan()).not.toContain('TEMP B-TREE');
    expect(database.getAllSync('PRAGMA foreign_key_check')).toEqual([]);
    const schema = database.getAllSync(
      'SELECT * FROM sqlite_master ORDER BY name',
    );
    migrateDatabase(database);
    expect(rows()).toEqual(before);
    expect(
      database.getAllSync('SELECT * FROM sqlite_master ORDER BY name'),
    ).toEqual(schema);
  } finally {
    close();
  }
});

test('v7 indexes and version roll back together when interrupted before commit', () => {
  const { database, close } = versionSixDatabase();
  try {
    const schema = database.getAllSync(
      'SELECT * FROM sqlite_master ORDER BY name',
    );
    expect(() =>
      migrateDatabase({
        ...database,
        withTransactionSync(task) {
          database.withTransactionSync(() => {
            task();
            expect(database.getFirstSync('PRAGMA user_version')).toEqual({
              user_version: 7,
            });
            expect(
              database.getAllSync(
                'PRAGMA index_info(idx_gifts_active_person_id)',
              ),
            ).toHaveLength(1);
            throw new Error('interrupted v7');
          });
        },
      }),
    ).toThrow('interrupted v7');
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 6,
    });
    expect(
      database.getAllSync('SELECT * FROM sqlite_master ORDER BY name'),
    ).toEqual(schema);
    migrateDatabase(database);
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 7,
    });
  } finally {
    close();
  }
});
