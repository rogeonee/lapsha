import assert from 'node:assert/strict';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { mock } from 'bun:test';

const scenario = process.argv[2];
const root = mkdtempSync(join(tmpdir(), 'lapsha-gift-selection-'));
const photos = join(root, 'gift-photos');
const marker = join(photos, 'library.pending');
const prepared = join(root, 'prepared.jpg');
const photoId = '20000000-0000-4000-8000-000000000001';
const personId = '10000000-0000-4000-8000-000000000001';
const asset = { uri: join(root, 'camera.jpg'), width: 4000, height: 3000 };
const selected = { canceled: false, assets: [asset] };
const canceled = { canceled: true, assets: null };
let preparationFails = scenario === 'preparation failure';
let stagingFails = scenario === 'staging failure';
let pendingResult: typeof selected | typeof canceled | null = selected;
let pendingReads = 0;
let launched: 'camera' | 'library' | null = null;
let preparations = 0;

class TestPath {
  uri: string;
  constructor(...parts: (string | TestPath)[]) {
    this.uri = join(
      ...parts.map((part) => (typeof part === 'string' ? part : part.uri)),
    );
  }
  get exists() {
    return existsSync(this.uri);
  }
  get name() {
    return basename(this.uri);
  }
  delete() {
    rmSync(this.uri, { recursive: true });
  }
}
class Directory extends TestPath {
  create() {
    mkdirSync(this.uri, { recursive: true });
  }
  list() {
    return readdirSync(this.uri).map((name) => new File(this, name));
  }
}
class File extends TestPath {
  write(value: string) {
    writeFileSync(this.uri, value);
  }
  textSync() {
    return readFileSync(this.uri, 'utf8');
  }
  copy(target: File) {
    if (stagingFails) throw new Error('Photo copy failed');
    copyFileSync(this.uri, target.uri);
  }
}

async function launch(source: 'camera' | 'library', options: unknown) {
  launched = source;
  assert.deepEqual(options, {
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  assert.equal(
    readFileSync(marker, 'utf8'),
    'null',
    'recovery is armed before native launch',
  );
  if (scenario.endsWith('rejection')) throw new Error('Native launch failed');
  return scenario.endsWith('cancel') ? canceled : selected;
}

mock.module('expo-file-system', () => ({
  Directory,
  File,
  Paths: { document: root },
}));
mock.module('expo-crypto', () => ({ randomUUID: () => photoId }));
mock.module('expo-observe', () => ({
  Observe: {
    reportError: (error: Error) => {
      throw error;
    },
  },
}));
mock.module('expo-image-picker', () => ({
  launchCameraAsync: (options: unknown) => launch('camera', options),
  launchImageLibraryAsync: (options: unknown) => launch('library', options),
  getPendingResultAsync: async () => {
    pendingReads += 1;
    const result = pendingResult;
    pendingResult = null;
    return result;
  },
}));
mock.module('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate(uri: string) {
      assert.equal(uri, asset.uri);
      preparations += 1;
      return {
        resize: (size: unknown) => assert.deepEqual(size, { width: 2560 }),
        renderAsync: async () => {
          if (preparationFails) throw new Error('Image preparation failed');
          return {
            saveAsync: async (options: unknown) => {
              assert.deepEqual(options, { format: 'jpeg', compress: 0.85 });
              writeFileSync(prepared, 'synthetic prepared image');
              return { uri: prepared };
            },
          };
        },
      };
    },
  },
}));

try {
  const {
    takeGiftPhoto,
    pickGiftPhoto,
    pendingGiftLibraryPhoto,
    stageGiftPhoto,
    pendingGiftPhotos,
    finishGiftPhoto,
  } = await import('../../src/lib/gift-photos');
  const select = scenario.startsWith('library') ? pickGiftPhoto : takeGiftPhoto;

  if (scenario.endsWith('cancel')) {
    assert.equal(await select(), null);
    assert.equal(existsSync(marker), false, 'cancel disarms gift recovery');
    assert.equal(preparations, 0);
    assert.equal(await pendingGiftLibraryPhoto(), null);
    assert.equal(pendingReads, 0);
  } else if (scenario.endsWith('rejection')) {
    await assert.rejects(select(), /Native launch failed/);
    assert.equal(
      existsSync(marker),
      false,
      'failed launch must not claim a later avatar selection',
    );
    assert.equal(await pendingGiftLibraryPhoto(), null);
    assert.equal(pendingReads, 0);
  } else if (
    scenario.endsWith('selection') &&
    scenario !== 'unrelated avatar selection'
  ) {
    assert.equal(await select(), prepared);
    assert.equal(
      launched,
      scenario.startsWith('camera') ? 'camera' : 'library',
    );
    assert.deepEqual(JSON.parse(readFileSync(marker, 'utf8')), asset);
    assert.equal(
      await pendingGiftLibraryPhoto(),
      prepared,
      'selected asset remains recoverable before staging',
    );
    assert.equal(
      pendingReads,
      0,
      'stored asset recovery does not consume a different native picker result',
    );
    const staged = stageGiftPhoto(prepared, personId);
    assert.equal(existsSync(marker), false);
    assert.deepEqual(staged, {
      id: photoId,
      personId,
      photo: `${photoId}.jpg`,
    });
    assert.deepEqual(
      pendingGiftPhotos(),
      [staged],
      'durable capture journal replaces the picker marker',
    );
    finishGiftPhoto(staged);
    assert.deepEqual(pendingGiftPhotos(), []);
    assert.equal(
      readFileSync(join(photos, staged.photo), 'utf8'),
      'synthetic prepared image',
    );
  } else if (scenario === 'staging failure') {
    const uri = await takeGiftPhoto();
    assert.equal(uri, prepared);
    assert.throws(() => stageGiftPhoto(uri!, personId), /Photo copy failed/);
    assert.deepEqual(JSON.parse(readFileSync(marker, 'utf8')), asset);
    assert.deepEqual(
      pendingGiftPhotos(),
      [],
      'an incomplete copy cannot be recovered as a gift',
    );
    stagingFails = false;
    const staged = stageGiftPhoto((await pendingGiftLibraryPhoto())!, personId);
    assert.equal(existsSync(marker), false);
    assert.deepEqual(pendingGiftPhotos(), [staged]);
  } else if (scenario === 'preparation failure') {
    await assert.rejects(takeGiftPhoto(), /Image preparation failed/);
    assert.deepEqual(
      JSON.parse(readFileSync(marker, 'utf8')),
      asset,
      'failed processing retains the original asset',
    );
    preparationFails = false;
    assert.equal(await pendingGiftLibraryPhoto(), prepared);
    assert.equal(pendingReads, 0);
  } else if (scenario.startsWith('pending')) {
    mkdirSync(photos);
    writeFileSync(marker, 'null');
    if (scenario === 'pending cancel recovery') pendingResult = canceled;
    assert.equal(
      await pendingGiftLibraryPhoto(),
      scenario === 'pending cancel recovery' ? null : prepared,
    );
    assert.equal(pendingReads, 1);
    if (scenario === 'pending cancel recovery') {
      assert.equal(existsSync(marker), false);
      assert.equal(preparations, 0);
    } else {
      assert.deepEqual(JSON.parse(readFileSync(marker, 'utf8')), asset);
      assert.equal(
        await pendingGiftLibraryPhoto(),
        prepared,
        'recovery survives another interruption after consuming the native result',
      );
      assert.equal(pendingReads, 1);
    }
  } else if (scenario === 'unrelated avatar selection') {
    assert.equal(await pendingGiftLibraryPhoto(), null);
    assert.equal(
      pendingReads,
      0,
      'without a gift marker the shared native result belongs to another picker',
    );
    assert.equal(preparations, 0);
  } else {
    throw new Error(`Unknown scenario: ${scenario}`);
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
