import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

for (const scenario of [
  'selected',
  'canceled',
  'absent',
  'failed',
  'filesystem check failure',
  'later capture',
]) {
  test(`startup gift selection recovery coordinates restored capture: ${scenario}`, () => {
    const result = Bun.spawnSync(
      [
        process.execPath,
        fileURLToPath(
          new URL(
            './helpers/gift-selection-recovery-worker.ts',
            import.meta.url,
          ),
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
