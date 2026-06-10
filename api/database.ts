import { openDatabaseSync } from 'expo-sqlite';

/**
 * Singleton SQLite database for the app.
 *
 * Schema changes are applied via incremental migrations keyed off
 * `PRAGMA user_version`: bump SCHEMA_VERSION and add a block below
 * for each new version.
 */
const SCHEMA_VERSION = 1;

export const db = openDatabaseSync('lapsha.db');

function migrate(): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  if (currentVersion < 1) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS persons (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS facts (
        id TEXT PRIMARY KEY NOT NULL,
        person_id TEXT NOT NULL REFERENCES persons(id),
        label TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS dates (
        id TEXT PRIMARY KEY NOT NULL,
        person_id TEXT NOT NULL REFERENCES persons(id),
        label TEXT NOT NULL,
        date TEXT NOT NULL,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        year_known INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_facts_person_id ON facts(person_id);
      CREATE INDEX IF NOT EXISTS idx_dates_person_id ON dates(person_id);
    `);
  }

  db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

migrate();

/**
 * Permanently delete all user data. Used by the "Clear All Data"
 * action in settings.
 */
export function clearAllData(): void {
  db.execSync(`
    DELETE FROM facts;
    DELETE FROM dates;
    DELETE FROM persons;
  `);
}
