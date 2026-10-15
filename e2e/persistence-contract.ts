import assert from 'node:assert/strict';
import { selectedDate, civilDate } from './calendar';
export const maya = Object.freeze({
  name: 'Maya',
  factLabel: 'Favorite tea',
  factValue: 'Jasmine green tea',
  title: 'Blue ceramic mug',
  note: 'For slow Sunday mornings',
  url: 'https://example.com/maya-mug',
  status: 'given',
  givenOn: civilDate(selectedDate),
});
export interface Rows {
  persons: { id: string; name: string; deleted_at: string | null }[];
  facts: {
    person_id: string;
    label: string | null;
    value: string;
    deleted_at: string | null;
  }[];
  gifts: {
    person_id: string | null;
    title: string | null;
    note: string | null;
    url: string | null;
    photo: string | null;
    status: string;
    given_on: string | null;
    deleted_at: string | null;
  }[];
}
// Exact persisted values, relationships, and counts. No model judgment, date
// substring or app-rendered "Given" oracle. Expected date comes from the fixture.
export function assertMaya(rows: Rows) {
  assert.equal(
    rows.persons.length,
    1,
    'exactly one person, including tombstones',
  );
  assert.equal(rows.facts.length, 1, 'exactly one fact, including tombstones');
  assert.equal(rows.gifts.length, 1, 'exactly one gift, including tombstones');
  const person = rows.persons[0]!;
  assert.equal(person.name, maya.name);
  assert.equal(person.deleted_at, null, 'delete-cancel must preserve person');
  const fact = rows.facts[0]!;
  assert.deepEqual(
    [fact.person_id, fact.label, fact.value, fact.deleted_at],
    [person.id, maya.factLabel, maya.factValue, null],
  );
  const gift = rows.gifts[0]!;
  assert.deepEqual(
    [
      gift.person_id,
      gift.title,
      gift.note,
      gift.url,
      gift.photo,
      gift.status,
      gift.deleted_at,
    ],
    [person.id, maya.title, maya.note, maya.url, null, maya.status, null],
  );
  assert.equal(
    gift.given_on,
    civilDate(selectedDate),
    'Given date must remain the selected civil date after relaunch/cancel',
  );
}
