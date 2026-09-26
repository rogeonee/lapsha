import { expect, test } from 'bun:test';

// Native module mocks stay in a child process so other tests can use their own.
test('last-person preference failures do not interrupt completed entry saves', () => {
  const result = Bun.spawnSync(
    [process.execPath, 'run', 'tests/helpers/last-person-preference-worker.ts'],
    { cwd: new URL('..', import.meta.url).pathname },
  );

  expect(result.stderr.toString()).toBe('');
  expect(result.exitCode).toBe(0);
  expect(result.stdout.toString()).toBe('Last-person preference checks passed\n');
});
