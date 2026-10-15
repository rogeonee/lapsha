import assert from 'node:assert/strict';
import { mock, setSystemTime } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { migrateDatabase } from '../../src/api/migrations';
import type { Gift } from '../../src/api/gifts/gift-schema';
import { sqliteFixture } from './sqlite-fixture';

const [operation, now, expectedDate] = process.argv.slice(2);
assert.ok(operation === 'create' || operation === 'update');
const { database, close } = sqliteFixture();
const reports: Error[] = [];
mock.module(
  fileURLToPath(new URL('../../src/api/database.ts', import.meta.url)),
  () => ({ db: database }),
);
mock.module('expo-crypto', () => ({
  randomUUID: () => '10000000-0000-4000-8000-000000000001',
}));
mock.module('expo-observe', () => ({
  Observe: {
    reportError(error: Error) {
      reports.push(error);
    },
  },
}));

try {
  migrateDatabase(database);
  const { createGift, updateGift } =
    await import('../../src/api/gifts/gifts-service');
  const fields = {
    person_id: null,
    title: 'Synthetic gift',
    note: null,
    url: null,
  };
  let existing: Gift | undefined;
  if (operation === 'update') {
    setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
    const response = createGift({ ...fields, status: 'idea' });
    assert.equal(response.error, null);
    assert.ok(response.data);
    existing = response.data;
    assert.equal(existing.given_on, null);
  }

  setSystemTime(new Date(now));
  const response = existing
    ? updateGift(existing.id, { ...fields, status: 'given', given_on: null })
    : createGift({ ...fields, status: 'given' });
  assert.equal(response.error, null);
  assert.ok(response.data);
  assert.deepEqual(
    database.getFirstSync<{ status: string; given_on: string | null }>(
      'SELECT status, given_on FROM gifts WHERE id = ?',
      response.data.id,
    ),
    { status: 'given', given_on: expectedDate },
    'the first Given save must persist the current local calendar date',
  );
  assert.equal(response.data.given_on, expectedDate);
  assert.deepEqual(reports, []);
} finally {
  setSystemTime();
  close();
}
