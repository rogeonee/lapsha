import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

test('real services use SQLite with process-isolated native boundaries', () => {
  const result = Bun.spawnSync(
    [
      process.execPath,
      fileURLToPath(
        new URL('./helpers/database-service-worker.ts', import.meta.url),
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
  expect(result.stdout.toString()).toContain('Service SQL checks passed');
});
