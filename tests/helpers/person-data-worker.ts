import assert from 'node:assert/strict';
import { mock } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { migrateDatabase } from '../../src/api/migrations';
import { sqliteFixture } from './sqlite-fixture';

const { database, close } = sqliteFixture();
let failedTable: 'facts' | 'dates' | 'both' | 'persons' | null = null;
const getAllSync = database.getAllSync;
const getFirstSync = database.getFirstSync;
database.getAllSync = (sql, ...params) => {
  if (
    failedTable &&
    (failedTable === 'both' || sql.includes(`FROM ${failedTable}`))
  ) {
    throw new Error('Simulated private database error');
  }
  return getAllSync(sql, ...params);
};
database.getFirstSync = (sql, ...params) => {
  if (failedTable === 'persons')
    throw new Error('Simulated private database error');
  return getFirstSync(sql, ...params);
};
mock.module(
  fileURLToPath(new URL('../../src/api/database.ts', import.meta.url)),
  () => ({ db: database }),
);
let sequence = 0;
mock.module('expo-crypto', () => ({
  randomUUID: () =>
    `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`,
}));
mock.module('expo-observe', () => ({ Observe: { reportError() {} } }));

try {
  migrateDatabase(database);
  const { createPerson, deletePerson } =
    await import('../../src/api/people/people-service');
  const { createFact } = await import('../../src/api/facts/facts-service');
  const { createDate } = await import('../../src/api/dates/dates-service');
  const { loadPersonData } =
    await import('../../src/screens/person/load-person-data');
  const person = createPerson({ name: 'Synthetic Reader' }).data!;
  const empty = loadPersonData(person.id, 'created', 0, 0);
  assert.equal(empty.error, null);
  assert.deepEqual(empty.facts, []);
  assert.deepEqual(empty.dates, []);
  const fact = createFact({
    person_id: person.id,
    label: null,
    value: 'Oat latte',
  }).data!;
  const date = createDate({
    person_id: person.id,
    label: 'Birthday',
    date: '1990-04-02',
  }).data!;
  const saved = loadPersonData(person.id, 'created', 1, 0);
  assert.equal(saved.error, null);
  assert.deepEqual(saved.facts, [fact]);
  assert.deepEqual(saved.dates, [date]);
  for (const table of ['facts', 'dates', 'both'] as const) {
    failedTable = table;
    const failed = loadPersonData(person.id, 'created', 1, 0);
    assert.equal(failed.person?.id, person.id);
    assert.equal(failed.error, null);
    assert.deepEqual(failed.facts, table === 'dates' ? [fact] : null);
    assert.deepEqual(failed.dates, table === 'facts' ? [date] : null);
    assert.deepEqual(loadPersonData(person.id, 'created', 1, 1), failed);
    // Retry must reread unchanged data: no write or table-version change is needed.
    failedTable = null;
    assert.deepEqual(loadPersonData(person.id, 'created', 1, 2), saved);
  }
  failedTable = 'persons';
  const personFailure = loadPersonData(person.id, 'created', 1, 0);
  assert.equal(personFailure.person, null);
  assert.equal(personFailure.canRetry, true);
  assert.equal(
    personFailure.error,
    "Couldn't load this person. Please try again.",
  );
  failedTable = null;
  assert.deepEqual(loadPersonData(person.id, 'created', 1, 1), saved);
  for (const id of [undefined, 'missing']) {
    const missing = loadPersonData(id, 'created', 1, 0);
    assert.equal(missing.error, 'Person not found');
    assert.equal(missing.canRetry, false);
  }
  deletePerson(person.id);
  const deleted = loadPersonData(person.id, 'created', 2, 0);
  assert.equal(deleted.error, 'Person not found');
  assert.equal(deleted.canRetry, false);
  console.log('Person read recovery checks passed');
} finally {
  close();
}
