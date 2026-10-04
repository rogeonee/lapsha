import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

for (const scenario of [
  'camera cancel',
  'library cancel',
  'camera selection',
  'library selection',
  'camera rejection',
  'library rejection',
  'preparation failure',
  'staging failure',
  'pending camera recovery',
  'pending cancel recovery',
  'unrelated avatar selection',
]) {
  test(`gift photo selection: ${scenario}`, () => {
    const result = Bun.spawnSync(
      [
        process.execPath,
        fileURLToPath(
          new URL('./helpers/gift-photo-selection-worker.ts', import.meta.url),
        ),
        scenario,
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
}
