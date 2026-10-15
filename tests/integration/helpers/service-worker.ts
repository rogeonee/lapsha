import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mock, setSystemTime } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { migrateDatabase } from '../../../src/api/migrations';
import type { ServiceResponse } from '../../../src/api/error-handling';
import { openDiskDatabase } from './disk-database';

const [phase, path, today] = process.argv.slice(2);
assert.ok(
  path && today,
  'fixture path and independent expected civil date required',
);
const { database, close } = openDiskDatabase(path);
const instant = '2032-02-29T00:30:00.000Z';
const explicitDate = '2031-12-24';
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const personId = id(1);
const factId = id(2);
const dateId = id(3);
const explicitId = id(4);
const createdGivenId = id(5);
const transitionedId = id(6);
const reports: Error[] = [];

// Module mocks are confined to this child so ordinary DB tests cannot inherit
// them. Validation, service code, date conversion and migration SQL are real.
mock.module(
  fileURLToPath(new URL('../../../src/api/database.ts', import.meta.url)),
  () => ({ db: database }),
);
mock.module('expo-crypto', () => ({ randomUUID }));
mock.module('expo-observe', () => ({
  Observe: { reportError: (error: Error) => reports.push(error) },
}));

function ok<T>(response: ServiceResponse<T>): T {
  assert.equal(response.error, null);
  assert.notEqual(response.data, null);
  return response.data!;
}

try {
  setSystemTime(new Date(instant));
  migrateDatabase(database);
  const people = await import('../../../src/api/people/people-service');
  const facts = await import('../../../src/api/facts/facts-service');
  const dates = await import('../../../src/api/dates/dates-service');
  const gifts = await import('../../../src/api/gifts/gifts-service');
  const timeline = await import('../../../src/api/timeline/timeline-service');

  if (phase === 'write') {
    assert.deepEqual(ok(people.getPeople()), []);
    ok(people.createPerson({ id: personId, name: 'Synthetic Maya' }));
    ok(
      facts.createFact({
        id: factId,
        person_id: personId,
        label: null,
        value: 'Enjoys pottery',
      }),
    );
    ok(
      dates.createDate({
        id: dateId,
        person_id: personId,
        label: 'Birthday',
        date: '0001-02-29',
      }),
    );
    for (const [giftId, title, givenOn] of [
      [explicitId, 'Explicit gift', explicitDate],
      [createdGivenId, 'Default on creation', null],
    ] as const) {
      ok(
        gifts.createGift({
          id: giftId,
          person_id: personId,
          title,
          note: 'Synthetic note',
          url: 'https://example.com/gift',
          photo: null,
          status: 'given',
          given_on: givenOn,
        }),
      );
    }
    const idea = ok(
      gifts.createGift({
        id: transitionedId,
        person_id: personId,
        title: 'Default on transition',
        note: null,
        url: null,
        photo: null,
        status: 'idea',
      }),
    );
    const given = ok(gifts.updateGift(idea.id, { ...idea, status: 'given' }));
    assert.equal(
      given.given_on,
      today,
      'Idea → Given uses the current local civil day',
    );
    const edited = ok(
      gifts.updateGift(explicitId, {
        ...ok(gifts.getGift(explicitId)),
        note: 'Synthetic note',
        given_on: null,
      }),
    );
    assert.equal(
      edited.given_on,
      explicitDate,
      'editing Given without a date preserves the saved date',
    );
    const reset = ok(
      gifts.updateGift(given.id, { ...given, status: 'bought' }),
    );
    assert.equal(reset.given_on, null, 'leaving Given clears its date');
    ok(gifts.updateGift(reset.id, { ...reset, status: 'given' }));
    assert.deepEqual(reports, []);
    process.stdout.write('COMMITTED\n');
    // The parent kills this exact child after the marker. No graceful close or
    // checkpoint runs first: subsequent workers must recover the WAL on disk.
    await new Promise(() => setInterval(() => {}, 60_000));
  } else {
    assert.ok(['verify', 'delete', 'verify-deleted'].includes(phase));
    const deleted = phase === 'verify-deleted';
    assert.deepEqual(database.getAllSync('PRAGMA foreign_key_check'), []);
    assert.deepEqual(database.getFirstSync('PRAGMA integrity_check'), {
      integrity_check: 'ok',
    });
    assert.deepEqual(database.getAllSync('SELECT * FROM persons'), [
      {
        id: personId,
        name: 'Synthetic Maya',
        avatar: null,
        created_at: instant,
        updated_at: instant,
        deleted_at: deleted ? instant : null,
      },
    ]);
    assert.deepEqual(database.getAllSync('SELECT * FROM facts'), [
      {
        id: factId,
        person_id: personId,
        label: null,
        value: 'Enjoys pottery',
        sort_order: 1,
        created_at: instant,
        updated_at: instant,
        deleted_at: null,
      },
    ]);
    assert.deepEqual(database.getAllSync('SELECT * FROM dates'), [
      {
        id: dateId,
        person_id: personId,
        label: 'Birthday',
        date: '0001-02-29',
        month: 2,
        day: 29,
        year_known: 0,
        sort_order: 1,
        created_at: instant,
        updated_at: instant,
        deleted_at: null,
      },
    ]);
    assert.deepEqual(
      database.getAllSync('SELECT * FROM gifts ORDER BY id'),
      [
        {
          id: explicitId,
          title: 'Explicit gift',
          note: 'Synthetic note',
          url: 'https://example.com/gift',
          given_on: explicitDate,
        },
        {
          id: createdGivenId,
          title: 'Default on creation',
          note: 'Synthetic note',
          url: 'https://example.com/gift',
          given_on: today,
        },
        {
          id: transitionedId,
          title: 'Default on transition',
          note: null,
          url: null,
          given_on: today,
        },
      ].map((gift) => ({
        ...gift,
        person_id: personId,
        photo: null,
        status: 'given',
        created_at: instant,
        updated_at: instant,
        deleted_at: deleted && gift.id === explicitId ? instant : null,
      })),
    );
    if (deleted) {
      assert.deepEqual(ok(people.getPeople()), []);
      assert.equal(people.getPerson(personId).error?.code, 'PERSON_NOT_FOUND');
      assert.equal(
        facts.getFactsByPerson(personId).error?.code,
        'PERSON_NOT_FOUND',
      );
      assert.equal(
        dates.getDatesByPerson(personId).error?.code,
        'PERSON_NOT_FOUND',
      );
      for (const giftId of [explicitId, createdGivenId, transitionedId]) {
        assert.equal(gifts.getGift(giftId).error?.code, 'NOT_FOUND');
      }
      assert.deepEqual(ok(timeline.getTimeline()), []);
      assert.deepEqual(ok(timeline.getUpcomingDates()), []);
    } else {
      assert.deepEqual(
        ok(people.getPeople()).map((person) => person.id),
        [personId],
      );
      assert.equal(
        ok(facts.getFactsByPerson(personId))[0].value,
        'Enjoys pottery',
      );
      assert.equal(ok(dates.getDatesByPerson(personId))[0].date, '0001-02-29');
      assert.deepEqual(
        ok(gifts.getGiftsByPerson(personId)).map((gift) => [
          gift.id,
          gift.given_on,
        ]),
        [
          [explicitId, explicitDate],
          [createdGivenId, today],
          [transitionedId, today],
        ],
      );
      assert.deepEqual(
        ok(timeline.getUpcomingDates()).map((date) => date.id),
        [dateId],
      );
    }
    if (phase === 'delete') {
      ok(gifts.deleteGift(explicitId));
      assert.equal(gifts.getGift(explicitId).error?.code, 'NOT_FOUND');
      assert.deepEqual(
        ok(gifts.getGiftsByPerson(personId)).map((gift) => gift.id),
        [createdGivenId, transitionedId],
      );
      ok(people.deletePerson(personId));
    }
    assert.deepEqual(reports, []);
    console.log(`PASS ${phase}`);
  }
} finally {
  setSystemTime();
  close();
}
