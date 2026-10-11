import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

test('person reads distinguish empty sections, partial failures, and recovery', () => {
  const result = Bun.spawnSync(
    [
      process.execPath,
      fileURLToPath(
        new URL('./helpers/person-data-worker.ts', import.meta.url),
      ),
    ],
    {
      cwd: fileURLToPath(new URL('..', import.meta.url)),
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );
  expect(
    result.exitCode,
    result.stdout.toString() + result.stderr.toString(),
  ).toBe(0);
  expect(result.stdout.toString()).toContain(
    'Person read recovery checks passed',
  );
});
