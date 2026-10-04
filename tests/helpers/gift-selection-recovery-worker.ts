import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mock } from 'bun:test';

const scenario = process.argv[2];
const filesystemFailure = scenario === 'filesystem check failure';
let reads = 0;
let saves = 0;
let reports = 0;
const gift = { id: '20000000-0000-4000-8000-000000000001', person_id: null };
let resolveSelection!: (uri: string | null) => void;
const selection = new Promise<string | null>((resolve) => {
  resolveSelection = resolve;
});
mock.module('expo-observe', () => ({
  Observe: {
    reportError(error: Error) {
      assert.equal(error.message, 'Gift library recovery failed');
      reports += 1;
    },
  },
}));
mock.module(
  fileURLToPath(new URL('../../src/lib/gift-photos.ts', import.meta.url)),
  () => ({
    hasPendingGiftLibrarySelection: () => {
      if (filesystemFailure) throw new Error('Synthetic filesystem failure');
      return scenario !== 'absent';
    },
    pendingGiftLibraryPhoto: () => {
      reads += 1;
      return selection;
    },
    stageGiftPhoto: (uri: string, personId: string | null) => {
      assert.equal(uri, 'synthetic-photo');
      assert.equal(
        personId,
        null,
        'recovered native selections go to Unsorted',
      );
      return { id: gift.id, personId, photo: 'synthetic.jpg' };
    },
  }),
);
mock.module(
  fileURLToPath(
    new URL('../../src/api/gifts/capture-service.ts', import.meta.url),
  ),
  () => ({
    saveGiftCapture: () => {
      saves += 1;
      return scenario === 'failed'
        ? { data: null, error: new Error('Synthetic save failure') }
        : { data: gift, error: null };
    },
  }),
);
const { recoverGiftLibrarySelection, consumeRecoveredGiftSelection } =
  await import('../../src/lib/recover-gift-library-selection');

const rootRecovery = recoverGiftLibrarySelection();
assert.equal(
  recoverGiftLibrarySelection(),
  rootRecovery,
  'root recovery is shared',
);
const laterCapture = scenario === 'later capture';
if (laterCapture) {
  resolveSelection('synthetic-photo');
  assert.equal((await rootRecovery).status, 'recovered');
}
const restoredCapture = consumeRecoveredGiftSelection(!laterCapture);
let captureSettled = false;
void restoredCapture.then(() => {
  captureSettled = true;
});
await Promise.resolve();
if (scenario !== 'absent' && !filesystemFailure && !laterCapture) {
  assert.equal(
    captureSettled,
    false,
    'the capture route waits instead of launching another camera',
  );
  assert.equal(reads, 1, 'only one consumer reads the native pending result');
}
resolveSelection(scenario === 'canceled' ? null : 'synthetic-photo');
const result = await restoredCapture;
if (laterCapture) {
  assert.equal(
    result.status,
    'none',
    'a deliberate camera request must not reopen an earlier recovered gift',
  );
} else {
  assert.equal(result, await rootRecovery);
}
assert.equal(
  result.status,
  laterCapture
    ? 'none'
    : scenario === 'selected'
      ? 'recovered'
      : scenario === 'absent'
        ? 'none'
        : filesystemFailure
          ? 'failed'
          : scenario,
);
assert.equal(
  saves,
  scenario === 'selected' || scenario === 'failed' || laterCapture ? 1 : 0,
);
assert.equal(reports, scenario === 'failed' || filesystemFailure ? 1 : 0);
assert.deepEqual(
  await consumeRecoveredGiftSelection(!laterCapture),
  { status: 'none' },
  'subsequent deliberate captures can launch normally',
);
assert.equal(reads, scenario === 'absent' || filesystemFailure ? 0 : 1);
