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
    database.execSync("UPDATE gifts SET photo = NULL WHERE id = 'new-gift'");
    expect(
      database.getFirstSync(
        "SELECT title, note, url, photo FROM gifts WHERE id = 'new-gift'",
      ),
    ).toEqual({ title: null, note: null, url: null, photo: null });
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

function photoDatabase() {
  const fixture = prototypeDatabase();
  fixture.database.execSync(`
    DROP TABLE gifts;
    CREATE TABLE gifts (
      id TEXT PRIMARY KEY NOT NULL,
      person_id TEXT REFERENCES persons(id),
      title TEXT, note TEXT, url TEXT, photo TEXT,
      status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'bought', 'given')),
      given_on TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
      CHECK (NULLIF(TRIM(title), '') IS NOT NULL OR NULLIF(TRIM(note), '') IS NOT NULL OR url IS NOT NULL OR photo IS NOT NULL)
    );
    CREATE INDEX idx_gifts_person_id ON gifts(person_id);
    INSERT INTO gifts VALUES
      ('full', 'person', 'Title', 'A thought', 'https://example.com', 'full.jpg', 'given', '2026-09-15', '2026-09-01', '2026-09-15', NULL),
      ('photo', NULL, NULL, NULL, NULL, 'capture.jpg', 'idea', NULL, '2026-09-02', '2026-09-02', NULL),
      ('deleted', 'person', NULL, 'Old thought', NULL, 'old.jpg', 'bought', NULL, '2026-09-03', '2026-09-04', '2026-09-04');
    PRAGMA user_version = 5;
  `);
  return fixture;
}

test('v6 preserves every gift field and index while permitting the last photo to be removed', () => {
  const { database, close } = photoDatabase();
  try {
    const before = database.getAllSync('SELECT * FROM gifts ORDER BY id');
    migrateDatabase(database);
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 7,
    });
    expect(database.getAllSync('SELECT * FROM gifts ORDER BY id')).toEqual(
      before,
    );
    expect(
      database.getAllSync('PRAGMA index_info(idx_gifts_person_id)'),
    ).toEqual([{ seqno: 0, cid: 1, name: 'person_id' }]);
    expect(database.getAllSync('PRAGMA foreign_key_check')).toEqual([]);
    database.execSync("UPDATE gifts SET photo = NULL WHERE id = 'photo'");
    expect(
      database.getFirstSync(
        "SELECT title, note, url, photo, person_id FROM gifts WHERE id = 'photo'",
      ),
    ).toEqual({
      title: null,
      note: null,
      url: null,
      photo: null,
      person_id: null,
    });
    expect(() =>
      database.execSync(
        "UPDATE gifts SET status = 'invalid' WHERE id = 'photo'",
      ),
    ).toThrow();
    expect(() =>
      database.execSync(
        "UPDATE gifts SET person_id = 'missing' WHERE id = 'photo'",
      ),
    ).toThrow();
    const snapshot = database.getAllSync('SELECT * FROM gifts ORDER BY id');
    migrateDatabase(database);
    expect(database.getAllSync('SELECT * FROM gifts ORDER BY id')).toEqual(
      snapshot,
    );
  } finally {
    close();
  }
});

test('v6 rolls back the gift constraint removal, data, index, and version together', () => {
  const { database, close } = photoDatabase();
  try {
    const snapshot = database.getAllSync('SELECT * FROM gifts ORDER BY id');
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
              user_version: 6,
            });
            database.execSync(
              "UPDATE gifts SET photo = NULL WHERE id = 'photo'",
            );
            throw new Error('interrupted v6');
          });
        },
      }),
    ).toThrow('interrupted v6');
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 5,
    });
    expect(database.getAllSync('SELECT * FROM gifts ORDER BY id')).toEqual(
      snapshot,
    );
    expect(
      database.getAllSync('SELECT * FROM sqlite_master ORDER BY name'),
    ).toEqual(schema);
    expect(() =>
      database.execSync("UPDATE gifts SET photo = NULL WHERE id = 'photo'"),
    ).toThrow();
    migrateDatabase(database);
    expect(database.getFirstSync('PRAGMA user_version')).toEqual({
      user_version: 7,
    });
    expect(database.getAllSync('SELECT * FROM gifts ORDER BY id')).toEqual(
      snapshot,
    );
  } finally {
    close();
  }
});
