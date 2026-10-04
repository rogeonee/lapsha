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
  const gifts = await import('../../src/api/gifts/gifts-service');
  const photoIdea = ok(
    gifts.createGift({
      person_id: null,
      title: null,
      note: null,
      url: null,
      photo: 'capture.jpg',
      status: 'idea',
    }),
  );
  assert.equal(photoIdea.title, null);
  assert.equal(ok(gifts.getGiftsByPerson(null))[0].id, photoIdea.id);
  const assigned = ok(gifts.assignGift(photoIdea.id, person.id));
  assert.equal(assigned.person_id, person.id);
  assert.equal(ok(gifts.getGiftsByPerson(null)).length, 0);
  const { giftLabel } = await import('../../src/api/gifts/gift-schema');
  assert.equal(giftLabel(assigned), 'Photo idea');
  const blank = ok(
    gifts.updateGift(assigned.id, {
      ...assigned,
      title: ' ',
      note: '',
      photo: null,
    }),
  );
  assert.equal(blank.title, null);
  assert.equal(blank.note, null);
  assert.equal(blank.url, null);
  assert.equal(blank.photo, null);
  assert.equal(blank.person_id, person.id);
  assert.equal(blank.created_at, assigned.created_at);
  assert.equal(blank.deleted_at, null);
  assert.equal(giftLabel(blank), 'Gift idea');
  assert.deepEqual(ok(gifts.getGift(blank.id)), blank);
  assert.deepEqual(ok(gifts.getGiftsByPerson(person.id)), [blank]);
  const blankBought = ok(
    gifts.updateGift(blank.id, { ...blank, status: 'bought' }),
  );
  assert.equal(blankBought.status, 'bought');
  for (const invalidFields of [
    { title: 'a'.repeat(201) },
    { url: 'javascript:alert(1)' },
    { photo: '../capture.jpg' },
    { given_on: 'not-a-date' },
  ]) {
    failure(
      gifts.updateGift(blank.id, { ...blankBought, ...invalidFields }),
      ErrorCode.VALIDATION_ERROR,
    );
    assert.deepEqual(ok(gifts.getGift(blank.id)), blankBought);
  }
  const refilled = ok(
    gifts.updateGift(blank.id, {
      ...ok(gifts.getGift(blank.id)),
      note: '  Another thought  ',
    }),
  );
  assert.equal(refilled.note, 'Another thought');
  assert.equal(refilled.photo, null);
  assert.equal(refilled.id, assigned.id);
  assert.equal(giftLabel(refilled), 'Another thought');
  const given = ok(
    gifts.updateGift(photoIdea.id, { ...assigned, status: 'given' }),
  );
  assert.match(given.given_on!, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(
    ok(gifts.updateGift(given.id, { ...given, note: 'A small thought' }))
      .given_on,
    given.given_on,
  );
  assert.equal(
    ok(gifts.updateGift(given.id, { ...given, status: 'idea' })).given_on,
    null,
  );
  const giftCount = count('gifts');
  failure(
    gifts.createGift({
      person_id: null,
      title: ' ',
      note: '',
      url: null,
      status: 'idea',
    }),
    ErrorCode.VALIDATION_ERROR,
  );
  failure(
    gifts.createGift({
      person_id: null,
      title: null,
      note: null,
      url: null,
      photo: '../capture.jpg',
      status: 'idea',
    }),
    ErrorCode.VALIDATION_ERROR,
  );
  failure(gifts.assignGift(given.id, other.id), ErrorCode.NOT_FOUND);
  assert.equal(count('gifts'), giftCount);
  ok(
    gifts.createGift({
      person_id: person.id,
      title: null,
      note: 'A pottery class',
      url: null,
      status: 'idea',
    }),
  );
  ok(
    gifts.createGift({
      person_id: person.id,
      title: null,
      note: null,
      url: 'https://example.com',
      status: 'idea',
    }),
  );
  failure(
    gifts.createGift({
      person_id: null,
      title: null,
      note: null,
      url: 'javascript:alert(1)',
      status: 'idea',
    }),
    ErrorCode.VALIDATION_ERROR,
  );
  const replacement = ok(
    gifts.createGift({
      person_id: person.id,
      title: null,
      note: null,
      url: null,
      photo: 'replacement.jpg',
      status: 'idea',
    }),
  );
  const attached = ok(gifts.attachCapturedPhoto(given.id, replacement.id));
  assert.equal(attached.photo, 'replacement.jpg');
  assert.equal(attached.person_id, person.id);
  failure(gifts.getGift(replacement.id), ErrorCode.NOT_FOUND);
  assert.ok(
    !ok(gifts.getGiftsByPerson(person.id)).some(
      (gift) => gift.id === replacement.id,
    ),
  );
  ok(gifts.deleteGift(given.id));
  failure(gifts.getGift(given.id), ErrorCode.NOT_FOUND);
  assert.ok(
    !ok(gifts.getGiftsByPerson(person.id)).some((gift) => gift.id === given.id),
  );
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
