import type { MigrationDatabase } from '../../src/api/migrations';

export const legacyId = (kind: number, person: number, order = 0) =>
  `00000000-0000-4000-8000-${kind}${person}${String(order).padStart(10, '0')}`;

export const legacyVersions = ['fresh', 'v1', 'bad-v2-stamp', 'v2'] as const;
export type LegacyVersion = (typeof legacyVersions)[number];

// Historical layouts, independent of the current migration runner.
export function seedLegacy(
  database: MigrationDatabase,
  version: LegacyVersion,
) {
  if (version === 'fresh') return;
  const v2 = version === 'v2';
  database.execSync(`
    CREATE TABLE persons (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE TABLE facts (id TEXT PRIMARY KEY NOT NULL,
      person_id TEXT NOT NULL REFERENCES persons(id), label TEXT ${v2 ? '' : 'NOT NULL'},
      value TEXT NOT NULL, ${v2 ? 'sort_order INTEGER NOT NULL DEFAULT 0,' : ''}
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT);
    CREATE TABLE dates (id TEXT PRIMARY KEY NOT NULL,
      person_id TEXT NOT NULL REFERENCES persons(id), label TEXT NOT NULL,
      date TEXT NOT NULL, month INTEGER NOT NULL, day INTEGER NOT NULL,
      year_known INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, deleted_at TEXT
      ${v2 ? ', sort_order INTEGER NOT NULL DEFAULT 0' : ''});
    CREATE INDEX idx_facts_person_id ON facts(person_id);
    CREATE INDEX idx_dates_person_id ON dates(person_id);
    PRAGMA user_version = ${version === 'v1' ? 1 : 2};
  `);
  for (const person of [1, 2]) {
    database.execSync(`INSERT INTO persons VALUES ('${legacyId(1, person)}', 'Synthetic ${person}',
      '2020-01-01', '2020-02-01', ${person === 2 ? "'2020-03-01'" : 'NULL'});`);
    for (const order of [3, 1, 2]) {
      const label = v2
        ? order === 3
          ? 'NULL'
          : "'Existing'"
        : order === 1
          ? "''"
          : order === 2
            ? "'   '"
            : "'  Hobby  '";
      const deleted = order === 2 ? "'2020-04-01'" : 'NULL';
      database.execSync(`
        INSERT INTO facts (id, person_id, label, value, created_at, updated_at, deleted_at${v2 ? ', sort_order' : ''})
        VALUES ('${legacyId(2, person, order)}', '${legacyId(1, person)}', ${label}, 'Synthetic value ${order}',
          '2020-01-0${order}', '2020-02-0${order}', ${deleted}${v2 ? `, ${10 + order}` : ''});
        INSERT INTO dates (id, person_id, label, date, month, day, year_known, created_at, updated_at, deleted_at${v2 ? ', sort_order' : ''})
        VALUES ('${legacyId(3, person, order)}', '${legacyId(1, person)}', 'Occasion', '0001-02-29', 2, 29, 0,
          '2020-01-0${order}', '2020-02-0${order}', ${deleted}${v2 ? `, ${20 + order}` : ''});
      `);
    }
  }
}
