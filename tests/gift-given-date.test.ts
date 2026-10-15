import { describe, expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

const cases = [
  ['UTC', '2026-01-01T00:30:00.000Z', '2026-01-01'],
  ['America/Edmonton', '2026-01-01T00:30:00.000Z', '2025-12-31'],
  ['Asia/Tokyo', '2026-12-31T23:30:00.000Z', '2027-01-01'],
];

describe.each(cases)(
  'initial Given date in %s at %s is %s',
  (tz, now, date) => {
    test.each(['create', 'update'])(
      '%s persists the local date without a selected date',
      (operation) => {
        // Each worker owns its clock, timezone, SQLite fixture, and native mocks.
        const result = Bun.spawnSync(
          [
            process.execPath,
            fileURLToPath(
              new URL('./helpers/gift-given-date-worker.ts', import.meta.url),
            ),
            operation,
            now,
            date,
          ],
          {
            cwd: fileURLToPath(new URL('..', import.meta.url)),
            env: { ...process.env, TZ: tz },
            stdout: 'pipe',
            stderr: 'pipe',
          },
        );
        expect(
          result.exitCode,
          result.stdout.toString() + result.stderr.toString(),
        ).toBe(0);
      },
    );
  },
);
