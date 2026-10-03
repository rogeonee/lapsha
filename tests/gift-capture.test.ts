import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

test('gift capture retries and recovery preserve a single photo idea', () => {
  const result = Bun.spawnSync(
    [
      process.execPath,
      fileURLToPath(
        new URL('./helpers/gift-capture-worker.ts', import.meta.url),
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
});
