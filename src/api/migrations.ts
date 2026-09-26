export interface MigrationDatabase {
  execSync(source: string): void;
  getFirstSync<T>(source: string): T | null;
  getAllSync<T>(source: string): T[];
  withTransactionSync(task: () => void): void;
}

/**
 * Incremental SQLite schema migrations.
 *
 * Schema changes are applied via incremental migrations keyed off
 * `PRAGMA user_version`: bump SCHEMA_VERSION and add a block below
 * for each new version. Each block must stamp its own version INSIDE
 * its transaction, so the stamp can never outrun the schema.
 */
const SCHEMA_VERSION = 3;

function hasColumn(
  database: MigrationDatabase,
  table: string,
  column: string,
): boolean {
  return database
    .getAllSync<{ name: string }>(`PRAGMA table_info(${table})`)
    .some((c) => c.name === column);
}

export function migrateDatabase(database: MigrationDatabase): void {
  database.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  const row = database.getFirstSync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  let currentVersion = row?.user_version ?? 0;

  // Repair: a dev build briefly stamped version 2 without applying the v2
  // migration. Trust the actual schema over the stamp.
  if (currentVersion >= 2 && !hasColumn(database, 'dates', 'sort_order')) {
    currentVersion = 1;
  }

  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  if (currentVersion < 1) {
    database.withTransactionSync(() => {
      database.execSync(`
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

      PRAGMA user_version = 1;
    `);
    });
  }

  if (currentVersion < 2) {
    // v2: facts.label becomes nullable (plain-text facts) — SQLite cannot
    // drop NOT NULL, so the table is rebuilt. Both tables gain sort_order
    // (reserved for custom drag-n-drop ordering; backfilled by created_at).
    database.withTransactionSync(() => {
      database.execSync(`
        CREATE TABLE facts_new (
          id TEXT PRIMARY KEY NOT NULL,
          person_id TEXT NOT NULL REFERENCES persons(id),
          label TEXT,
          value TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        );

        INSERT INTO facts_new (id, person_id, label, value, sort_order, created_at, updated_at, deleted_at)
          SELECT id, person_id, NULLIF(TRIM(label), ''), value, 0, created_at, updated_at, deleted_at
          FROM facts;

        DROP TABLE facts;
        ALTER TABLE facts_new RENAME TO facts;
        CREATE INDEX IF NOT EXISTS idx_facts_person_id ON facts(person_id);

        ALTER TABLE dates ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

        UPDATE facts SET sort_order = t.rn
          FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY created_at) AS rn
            FROM facts
          ) AS t
          WHERE t.id = facts.id;

        UPDATE dates SET sort_order = t.rn
          FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY person_id ORDER BY created_at) AS rn
            FROM dates
          ) AS t
          WHERE t.id = dates.id;

        PRAGMA user_version = 2;
      `);
    });
  }

  if (currentVersion < 3) {
    database.withTransactionSync(() => {
      database.execSync(`
        ALTER TABLE persons ADD COLUMN avatar TEXT;

        PRAGMA user_version = 3;
      `);
    });
  }
}
