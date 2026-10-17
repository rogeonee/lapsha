import { describe, expect, test } from 'bun:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appInputsChanged,
  assertBetaChannel,
  planDelivery,
  readDeliveryState,
  recordDelivery,
  readyToPublish,
} from '../scripts/beta-delivery.mjs';

const fingerprints = { android: 'android-runtime', ios: 'ios-runtime' };
const createdAt = '2026-10-15T00:00:00Z';
const empty = { version: 1, android: null, ios: null };
const delivered = {
  version: 1,
  android: { buildId: 'android-1', createdAt, fingerprints },
  ios: { buildId: 'ios-1', createdAt, fingerprints },
};

function plan(overrides = {}) {
  return planDelivery({
    state: delivered,
    fingerprints,
    candidates: {},
    now: Date.parse('2026-10-16T00:00:00Z'),
    ...overrides,
  });
}

describe('master-to-beta delivery', () => {
  test('publication waits for both required submissions, including partial retries', () => {
    expect(
      readyToPublish('native', { android: true, ios: true }, { android: {} }),
    ).toBe(false);
    expect(
      readyToPublish('native', { android: false, ios: true }, { ios: {} }),
    ).toBe(true);
    expect(
      readyToPublish(
        'native',
        { android: true, ios: true },
        { android: {}, ios: {} },
      ),
    ).toBe(true);
    expect(readyToPublish('ota', {}, {})).toBe(true);
    expect(readyToPublish('none', {}, {})).toBe(false);
    expect(readyToPublish('native', {}, {})).toBe(false);
  });

  test('real Git guards permit newer docs but reject newer app code and off-master sources', () => {
    const root = mkdtempSync(join(tmpdir(), 'lapsha-beta-guard-'));
    const origin = join(root, 'origin');
    const checkout = join(root, 'checkout');
    const script = fileURLToPath(
      new URL('../scripts/beta-delivery.mjs', import.meta.url),
    );
    const git = (cwd, ...args) =>
      execFileSync('git', args, { cwd, stdio: 'ignore' });
    const commit = (cwd) => {
      git(cwd, 'add', '.');
      git(
        cwd,
        '-c',
        'user.name=Beta test',
        '-c',
        'user.email=beta@example.invalid',
        'commit',
        '-m',
        'Fixture',
      );
    };
    const guard = () =>
      spawnSync('bun', [script, 'guard'], {
        cwd: checkout,
        env: { ...process.env, APP_VARIANT: '' },
        encoding: 'utf8',
      });
    try {
      mkdirSync(join(origin, 'src'), { recursive: true });
      git(origin, 'init', '-b', 'master');
      writeFileSync(join(origin, 'src/app.ts'), 'original');
      commit(origin);
      git(root, 'clone', '--depth', '1', `file://${origin}`, checkout);
      writeFileSync(join(origin, 'README.md'), 'Updated docs');
      commit(origin);
      expect(guard().status).toBe(0);
      writeFileSync(join(origin, 'src/app.ts'), 'new app revision');
      commit(origin);
      expect(guard().stderr).toContain('superseded');
      git(checkout, 'checkout', '-b', 'feature');
      writeFileSync(join(checkout, 'README.md'), 'Feature work');
      commit(checkout);
      expect(guard().stderr).toContain('requires a commit on master');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('channel bootstrap is allowed but paused, redirected, or shared audiences are rejected', () => {
    const beta = {
      name: 'beta',
      isPaused: false,
      branchMapping: JSON.stringify({
        data: [{ branchId: 'beta-id', branchMappingLogic: 'true' }],
      }),
      updateBranches: [{ name: 'beta', id: 'beta-id' }],
    };
    expect(() => assertBetaChannel([])).not.toThrow();
    expect(() => assertBetaChannel([beta])).not.toThrow();
    expect(() => assertBetaChannel([{ ...beta, isPaused: true }])).toThrow();
    expect(() =>
      assertBetaChannel([
        { ...beta, updateBranches: [{ name: 'production', id: 'beta-id' }] },
      ]),
    ).toThrow();
    expect(() =>
      assertBetaChannel([beta, { ...beta, name: 'production' }]),
    ).toThrow();
  });
  test('ignores maintenance and reference artwork, including mixed doc changes', () => {
    expect(
      appInputsChanged([
        'README.md',
        '.agents/skills/example/SKILL.md',
        'tests/dates.test.ts',
        '.eas/workflows/beta.yml',
        'scripts/beta-delivery.mjs',
        'src/assets/abby/README.md',
        'assets/reference/app-icon/example.png',
        'assets/android-icon/play-store.png',
      ]),
    ).toBe(false);
    for (const file of [
      'src/lib/dates.ts',
      'src/global.css',
      'src/assets/abby/smile.png',
      'assets/lapsha-ios.icon/icon.json',
      'plugins/with-android-backup.js',
      'patches/expo.patch',
      'bun.lock',
      'package.json',
      'app.json',
      'eas.json',
    ])
      expect(appInputsChanged(['README.md', file])).toBe(true);
  });

  test('bootstraps with two native builds, then sends OTA for compatible binaries', () => {
    expect(plan({ state: empty })).toMatchObject({
      mode: 'native',
      android_build_id: '',
      ios_build_id: '',
      android_submit: true,
      ios_submit: true,
    });
    expect(plan()).toMatchObject({
      mode: 'ota',
      android_submit: false,
      ios_submit: false,
    });
  });

  test('a native change on either platform rebuilds both', () => {
    const next = { ...fingerprints, android: 'new-native-runtime' };
    expect(plan({ fingerprints: next })).toMatchObject({
      mode: 'native',
      android_build_id: '',
      ios_build_id: '',
      android_submit: true,
      ios_submit: true,
    });
  });

  test('retries the failed platform using its cached binary after partial delivery', () => {
    const partial = { ...delivered, ios: null };
    expect(
      plan({
        state: partial,
        candidates: { ios: { id: 'ios-pending', createdAt, reusable: true } },
      }),
    ).toMatchObject({
      mode: 'native',
      android_build_id: 'android-1',
      android_submit: false,
      ios_build_id: 'ios-pending',
      ios_submit: true,
    });
  });

  test('an old matching build cannot turn a native revert into OTA', () => {
    const next = { android: 'older-android', ios: 'older-ios' };
    const old = {
      id: 'historical',
      createdAt: '2026-09-01T00:00:00Z',
      reusable: true,
    };
    expect(
      plan({ fingerprints: next, candidates: { android: old, ios: old } }),
    ).toMatchObject({ mode: 'native', android_build_id: '', ios_build_id: '' });
  });

  test('reuses a newer pending native pair, but rejects builds from another branch', () => {
    const next = { ...fingerprints, ios: 'next-ios' };
    const pending = {
      id: 'pending',
      createdAt: '2026-10-16T00:00:00Z',
      reusable: true,
    };
    expect(
      plan({
        fingerprints: next,
        candidates: { android: pending, ios: pending },
      }),
    ).toMatchObject({ android_build_id: 'pending', ios_build_id: 'pending' });
    expect(
      plan({
        fingerprints: next,
        candidates: { ios: { ...pending, reusable: false } },
      }),
    ).toMatchObject({ ios_build_id: '' });
  });

  test('weekly checks do nothing until TestFlight needs renewal; force bypasses reuse', () => {
    expect(plan({ event: 'schedule' }).mode).toBe('none');
    expect(
      plan({ event: 'schedule', now: Date.parse('2026-12-29T00:00:00Z') }),
    ).toMatchObject({ mode: 'native', android_build_id: '', ios_build_id: '' });
    expect(plan({ forceNative: true })).toMatchObject({
      mode: 'native',
      android_build_id: '',
      ios_build_id: '',
    });
  });

  test('reads checkpoints from failed runs but never from a failed checkpoint job', () => {
    const jobs = [
      {
        key: 'record_delivery',
        status: 'SUCCESS',
        outputs: { state: JSON.stringify(delivered) },
      },
    ];
    expect(readDeliveryState({ status: 'FAILURE', jobs })).toEqual(delivered);
    expect(
      readDeliveryState({ jobs: [{ ...jobs[0], status: 'FAILURE' }] }),
    ).toBeNull();
  });

  test('records only successful submissions and rejects a binary with a wrong runtime or audience', () => {
    const build = {
      id: 'android-2',
      createdAt,
      status: 'FINISHED',
      platform: 'ANDROID',
      buildProfile: 'beta',
      distribution: 'STORE',
      appIdentifier: 'com.rogeonee.lapsha',
      updateChannel: { name: 'beta' },
      fingerprint: { hash: fingerprints.android },
      runtime: { version: fingerprints.android },
    };
    const state = recordDelivery(empty, fingerprints, { android: build });
    expect(state.android.buildId).toBe('android-2');
    expect(state.ios).toBeNull();
    expect(() =>
      recordDelivery(empty, fingerprints, {
        android: { ...build, runtime: { version: 'incompatible' } },
      }),
    ).toThrow();
    expect(() =>
      recordDelivery(empty, fingerprints, {
        android: { ...build, updateChannel: { name: 'production' } },
      }),
    ).toThrow();
  });
});
