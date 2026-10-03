import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mock } from 'bun:test';
import { migrateDatabase } from '../../src/api/migrations';
import { sqliteFixture } from './sqlite-fixture';

const { database, close } = sqliteFixture();
const personId = '10000000-0000-4000-8000-000000000001';
const capture = {
  id: '20000000-0000-4000-8000-000000000001',
  personId,
  photo: 'capture.jpg',
};
let pending = [capture];
let failInsert = false;
mock.module(
  fileURLToPath(new URL('../../src/api/database.ts', import.meta.url)),
  () => ({
    db: {
      ...database,
      runSync(
        source: string,
        ...params: Parameters<typeof database.runSync> extends [
          string,
          ...infer P,
        ]
          ? P
          : never
      ) {
        if (failInsert && source.startsWith('INSERT INTO gifts'))
          throw new Error('Synthetic storage error');
        return database.runSync(source, ...params);
      },
    },
  }),
);
mock.module('expo-crypto', () => ({
  randomUUID: () => '30000000-0000-4000-8000-000000000001',
}));
mock.module('expo-observe', () => ({
  Observe: {
    reportError(error: Error) {
      assert.equal(error.message, 'Database operation failed');
    },
  },
}));
mock.module(
  fileURLToPath(new URL('../../src/lib/gift-photos.ts', import.meta.url)),
  () => ({
    pendingGiftPhotos: () => pending,
    finishGiftPhoto: (photo: typeof capture) => {
      pending = pending.filter((p) => p.id !== photo.id);
    },
  }),
);
try {
  migrateDatabase(database);
  database.runSync(
    'INSERT INTO persons (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
    personId,
    'Synthetic person',
    'now',
    'now',
  );
  const { saveGiftCapture, recoverGiftCaptures } =
    await import('../../src/api/gifts/capture-service');
  failInsert = true;
  assert.ok(saveGiftCapture(capture).error);
  assert.equal(
    pending.length,
    1,
    'failed database write retains the recoverable photo journal',
  );
  failInsert = false;
  assert.equal(recoverGiftCaptures().error, null);
  assert.equal(pending.length, 0);
  assert.equal(
    database.getFirstSync<{ count: number }>(
      'SELECT count(*) AS count FROM gifts',
    )!.count,
    1,
  );
  assert.equal(saveGiftCapture(capture).error, null);
  assert.equal(
    database.getFirstSync<{ count: number }>(
      'SELECT count(*) AS count FROM gifts',
    )!.count,
    1,
    'retry cannot duplicate a photo',
  );
  database.runSync(
    'UPDATE gifts SET deleted_at = ? WHERE id = ?',
    'now',
    capture.id,
  );
  pending = [capture];
  assert.equal(recoverGiftCaptures().error, null);
  assert.equal(pending.length, 0, 'cleanup does not resurrect a deleted gift');
  database.runSync(
    'UPDATE persons SET deleted_at = ? WHERE id = ?',
    'now',
    personId,
  );
  pending = [{ ...capture, id: '20000000-0000-4000-8000-000000000002' }];
  assert.equal(recoverGiftCaptures().error, null);
  assert.equal(
    database.getFirstSync<{ person_id: string | null }>(
      'SELECT person_id FROM gifts WHERE id = ?',
      '20000000-0000-4000-8000-000000000002',
    )!.person_id,
    null,
    'a missing person sends the recovered photo to Unsorted',
  );
  console.log('Gift capture recovery checks passed');
} finally {
  close();
}
