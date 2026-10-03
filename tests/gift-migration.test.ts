import { expect, test } from 'bun:test';
import { migrateDatabase } from '../src/api/migrations';
import { sqliteFixture } from './helpers/sqlite-fixture';

function prototypeDatabase() {
  const fixture = sqliteFixture();
  migrateDatabase(fixture.database);
  fixture.database.execSync(`
    DROP TABLE gifts;
    CREATE TABLE gifts (
      id TEXT PRIMARY KEY NOT NULL, person_id TEXT NOT NULL REFERENCES persons(id),
      title TEXT NOT NULL, note TEXT, url TEXT, status TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
    );
    CREATE INDEX idx_gifts_person_id ON gifts(person_id);
    INSERT INTO persons (id, name, created_at, updated_at) VALUES ('person', 'Test person', '2026-09-01', '2026-09-01');
    INSERT INTO gifts VALUES ('old-gift', 'person', 'Pallas cat plush', 'Saw it together', 'https://example.com', 'given', '2026-09-20T12:00:00Z', '2026-10-01T12:00:00Z', NULL);
    PRAGMA user_version = 4;
  `);
  return fixture;
}

test('gift migration preserves the prototype and accepts photo-only unassigned ideas', () => {
  const { database, close } = prototypeDatabase();
  try {
    migrateDatabase(database);
    expect(database.getFirstSync('SELECT * FROM gifts')).toMatchObject({
      id: 'old-gift',
      person_id: 'person',
      title: 'Pallas cat plush',
      note: 'Saw it together',
      url: 'https://example.com',
      status: 'given',
      given_on: '2026-10-01',
      photo: null,
    });
    database.runSync(
      'INSERT INTO gifts (id, photo, created_at, updated_at) VALUES (?, ?, ?, ?)',
      'new-gift',
      'photo.jpg',
      'now',
      'now',
    );
    expect(
      database.getFirstSync(
        "SELECT title, person_id FROM gifts WHERE id = 'new-gift'",
      ),
    ).toEqual({ title: null, person_id: null });
    expect(() =>
      database.execSync(
        "INSERT INTO gifts (id, created_at, updated_at) VALUES ('empty', 'now', 'now')",
      ),
    ).toThrow();
    expect(database.getAllSync('PRAGMA foreign_key_check')).toEqual([]);
  } finally {
    close();
  }
});

test('gift table rebuild and version stamp roll back together', () => {
  const { database, close } = prototypeDatabase();
  try {
    expect(() =>
      migrateDatabase({
        ...database,
        withTransactionSync(task) {
          database.withTransactionSync(() => {
            task();
            expect(database.getFirstSync('PRAGMA user_version')).toEqual({
              user_version: 5,
            });
            throw new Error('interrupted');
          });
        },
      }),
    ).toThrow('interrupted');
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 4,
    });
    expect(
      database
        .getAllSync<{ name: string }>('PRAGMA table_info(gifts)')
        .some((column) => column.name === 'photo'),
    ).toBe(false);
    expect(database.getFirstSync('SELECT title FROM gifts')).toEqual({
      title: 'Pallas cat plush',
    });
  } finally {
    close();
  }
});
