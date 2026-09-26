import assert from 'node:assert/strict';
import { mock } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { migrateDatabase } from '../../src/api/migrations';
import type { ServiceResponse } from '../../src/api/error-handling';
import { sqliteFixture } from './sqlite-fixture';

const { database, close } = sqliteFixture();
const reports: Error[] = [];
let sequence = 0;
const uuid = () =>
  `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
mock.module(
  fileURLToPath(new URL('../../src/api/database.ts', import.meta.url)),
  () => ({ db: database }),
);
mock.module('expo-crypto', () => ({ randomUUID: uuid }));
mock.module('expo-observe', () => ({
  Observe: {
    reportError(error: Error) {
      reports.push(error);
    },
  },
}));

function ok<T>(response: ServiceResponse<T>): T {
  assert.equal(response.error, null);
  assert.notEqual(response.data, null);
  return response.data!;
}
function failure<T>(response: ServiceResponse<T>, code: string) {
  assert.equal(response.data, null);
  assert.equal(response.error?.code, code);
}
const count = (table: string) =>
  database.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  )!.count;
const row = (table: string, id: string) =>
  database.getFirstSync<Record<string, unknown>>(
    `SELECT * FROM ${table} WHERE id = ?`,
    id,
  )!;

try {
  migrateDatabase(database);
  const people = await import('../../src/api/people/people-service');
  const facts = await import('../../src/api/facts/facts-service');
  const dates = await import('../../src/api/dates/dates-service');
  const timeline = await import('../../src/api/timeline/timeline-service');
  const { ErrorCode } = await import('../../src/api/error-handling');
  const person = ok(
    people.createPerson({
      name: '  Synthetic Person  ',
      avatar: 'synthetic.jpg',
    }),
  );
  assert.equal(person.name, 'Synthetic Person');
  assert.deepEqual(row('persons', person.id), person);
  assert.deepEqual(ok(people.getPerson(person.id)), person);
  assert.equal(
    ok(people.updatePerson(person.id, { name: '  Updated Person  ' })).name,
    'Updated Person',
  );
  assert.equal(
    ok(people.updatePerson(person.id, { avatar: null })).avatar,
    null,
  );
  const personCount = count('persons');
  for (const input of [
    { name: ' ' },
    { name: 'Synthetic', avatar: '/synthetic/path.jpg' },
  ]) {
    failure(people.createPerson(input), ErrorCode.VALIDATION_ERROR);
    assert.equal(count('persons'), personCount);
  }
  const other = ok(people.createPerson({ name: 'Other Synthetic' }));
  database.runSync(
    'UPDATE persons SET created_at = ? WHERE id = ?',
    '2020-01-01',
    person.id,
  );
  database.runSync(
    'UPDATE persons SET created_at = ? WHERE id = ?',
    '2021-01-01',
    other.id,
  );
  assert.deepEqual(
    ok(people.getPeople()).map((value) => value.id),
    [other.id, person.id],
  );

  const fact = ok(
    facts.createFact({
      person_id: person.id,
      label: '  Hobby  ',
      value: '  Chess  ',
    }),
  );
  assert.equal(fact.label, 'Hobby');
  assert.equal(fact.value, 'Chess');
  assert.deepEqual(row('facts', fact.id), fact);
  const omitted = ok(
    facts.createFact({ person_id: person.id, value: 'Unlabeled' }),
  );
  const nullLabel = ok(
    facts.createFact({
      person_id: person.id,
      label: null,
      value: 'Also unlabeled',
    }),
  );
  assert.equal(omitted.label, null);
  assert.equal(nullLabel.label, null);
  assert.equal(ok(facts.updateFact(fact.id, { value: 'Go' })).label, 'Hobby');
  assert.equal(ok(facts.updateFact(fact.id, { label: null })).label, null);
  assert.equal(row('facts', fact.id).label, null);
  const factCount = count('facts');
  failure(
    facts.createFact({ person_id: person.id, value: ' ' }),
    ErrorCode.VALIDATION_ERROR,
  );
  failure(
    facts.createFact({ person_id: uuid(), value: 'Missing parent' }),
    ErrorCode.PERSON_NOT_FOUND,
  );
  assert.equal(count('facts'), factCount);
  const beforeInvalidFact = row('facts', fact.id);
  failure(facts.updateFact(fact.id, { label: '' }), ErrorCode.VALIDATION_ERROR);
  assert.deepEqual(row('facts', fact.id), beforeInvalidFact);
  for (const [index, entry] of [fact, omitted, nullLabel].entries()) {
    database.runSync(
      'UPDATE facts SET created_at = ?, updated_at = ? WHERE id = ?',
      `2020-01-0${index + 1}`,
      `2020-02-0${3 - index}`,
      entry.id,
    );
  }
  assert.deepEqual(
    ok(facts.getFactsByPerson(person.id)).map((value) => value.id),
    [nullLabel.id, omitted.id, fact.id],
  );
  assert.deepEqual(
    ok(facts.getFactsByPerson(person.id, 'modified')).map((value) => value.id),
    [fact.id, omitted.id, nullLabel.id],
  );
  assert.ok(ok(facts.deleteFact(nullLabel.id)).deleted_at);
  assert.ok(row('facts', nullLabel.id).deleted_at);
  assert.equal(ok(facts.getFactsByPerson(person.id)).length, 2);
  failure(
    facts.updateFact(nullLabel.id, { value: 'Hidden' }),
    ErrorCode.FACT_NOT_FOUND,
  );

  const birthday = ok(
    dates.createDate({
      person_id: person.id,
      label: 'BiRtHdAy',
      date: '0001-02-29',
    }),
  );
  assert.equal(birthday.year_known, false);
  assert.deepEqual(
    [
      row('dates', birthday.id).date,
      row('dates', birthday.id).month,
      row('dates', birthday.id).day,
      row('dates', birthday.id).year_known,
    ],
    ['0001-02-29', 2, 29, 0],
  );
  assert.equal(
    ok(dates.updateDate(birthday.id, { label: 'BIRTHDAY' })).date,
    '0001-02-29',
  );
  const date = ok(
    dates.createDate({
      person_id: person.id,
      label: 'Occasion',
      date: '2024-02-29',
    }),
  );
  const date2 = ok(
    dates.createDate({
      person_id: person.id,
      label: 'Other occasion',
      date: '2020-06-15',
    }),
  );
  const updated = ok(dates.updateDate(date.id, { date: '2001-12-31' }));
  assert.deepEqual(
    [updated.month, updated.day, updated.year_known],
    [12, 31, true],
  );
  assert.deepEqual(
    [
      row('dates', date.id).date,
      row('dates', date.id).month,
      row('dates', date.id).day,
      row('dates', date.id).year_known,
    ],
    ['2001-12-31', 12, 31, 1],
  );
  assert.equal(
    ok(dates.updateDate(date.id, { date: '0001-02-29' })).year_known,
    false,
  );
  const dateCount = count('dates');
  const beforeInvalidDate = row('dates', date.id);
  failure(
    dates.createDate({
      person_id: person.id,
      label: 'Invalid',
      date: '2026-02-29',
    }),
    ErrorCode.VALIDATION_ERROR,
  );
  failure(
    dates.updateDate(date.id, { date: '0001-04-31' }),
    ErrorCode.VALIDATION_ERROR,
  );
  assert.equal(count('dates'), dateCount);
  assert.deepEqual(row('dates', date.id), beforeInvalidDate);
  for (const [index, entry] of [birthday, date, date2].entries()) {
    database.runSync(
      'UPDATE dates SET created_at = ?, updated_at = ? WHERE id = ?',
      `2020-01-0${index + 1}`,
      `2020-02-0${3 - index}`,
      entry.id,
    );
  }
  assert.deepEqual(
    ok(dates.getDatesByPerson(person.id)).map((value) => value.id),
    [birthday.id, date2.id, date.id],
  );
  assert.deepEqual(
    ok(dates.getDatesByPerson(person.id, 'modified')).map((value) => value.id),
    [birthday.id, date.id, date2.id],
  );
  const hidden = ok(
    dates.createDate({
      person_id: other.id,
      label: 'Hidden with person',
      date: '2020-01-01',
    }),
  );
  assert.ok(ok(dates.deleteDate(date2.id)).deleted_at);
  assert.ok(row('dates', date2.id).deleted_at);
  failure(
    dates.updateDate(date2.id, { label: 'Hidden' }),
    ErrorCode.DATE_NOT_FOUND,
  );
  assert.equal(ok(dates.getDatesByPerson(person.id)).length, 2);
  assert.ok(ok(people.deletePerson(other.id)).deleted_at);
  assert.ok(row('persons', other.id).deleted_at);
  failure(people.getPerson(other.id), ErrorCode.PERSON_NOT_FOUND);
  assert.deepEqual(
    ok(people.getPeople()).map((value) => value.id),
    [person.id],
  );
  failure(
    facts.createFact({ person_id: other.id, value: 'Deleted parent' }),
    ErrorCode.PERSON_NOT_FOUND,
  );
  failure(facts.getFactsByPerson(other.id), ErrorCode.PERSON_NOT_FOUND);
  failure(dates.getDatesByPerson(other.id), ErrorCode.PERSON_NOT_FOUND);
  failure(
    dates.createDate({
      person_id: other.id,
      label: 'Deleted parent',
      date: '2020-01-01',
    }),
    ErrorCode.PERSON_NOT_FOUND,
  );
  const entries = ok(timeline.getTimeline());
  assert.deepEqual(
    entries.map((value) => value.id).sort(),
    [birthday.id, date.id].sort(),
  );
  assert.ok(!entries.some((value) => value.id === hidden.id));
  assert.equal(entries[0].person.name, 'Updated Person');
  assert.equal(entries[0].year_known, false);
  assert.equal(reports.length, 0);
  const beforeConstraint = count('persons');
  const constraint = people.createPerson({
    id: person.id,
    name: 'Synthetic private value',
  });
  failure(constraint, ErrorCode.VALIDATION_ERROR);
  assert.equal(constraint.error?.message, 'Data violates database constraints');
  assert.equal(count('persons'), beforeConstraint);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].message, 'Database operation failed');
  assert.equal(reports[0].cause, undefined);
  assert.deepEqual(Object.keys(reports[0]), []);
  console.log('Service SQL checks passed');
} finally {
  close();
}
