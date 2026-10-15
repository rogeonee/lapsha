import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { nativeGuard, syntheticBundle } from './native-guard';
import { assertMaya, type Rows } from './persistence-contract';
export function readNativeRows(): Rows {
  const device = nativeGuard();
  // A distinct bundle ID means a distinct sandbox. No fallback to production or
  // Gifts Lab. This function only reads the dedicated synthetic container.
  const container = execFileSync(
    'xcrun',
    ['simctl', 'get_app_container', device, syntheticBundle, 'data'],
    { encoding: 'utf8' },
  ).trim();
  const path = join(container, 'Documents', 'SQLite', 'lapsha.db');
  assert.ok(existsSync(path), 'synthetic app must have initialized SQLite');
  assert.ok(realpathSync(path).startsWith(realpathSync(container) + '/'));
  const rows = (table: 'persons' | 'facts' | 'gifts') =>
    JSON.parse(
      execFileSync(
        '/usr/bin/sqlite3',
        ['-readonly', '-json', path, `SELECT * FROM ${table};`],
        { encoding: 'utf8' },
      ) || '[]',
    );
  return {
    persons: rows('persons'),
    facts: rows('facts'),
    gifts: rows('gifts'),
  };
}
export function assertNativeEmpty() {
  const rows = readNativeRows();
  assert.deepEqual(
    [rows.persons.length, rows.facts.length, rows.gifts.length],
    [0, 0, 0],
    'require empty synthetic fixture; never clear it automatically',
  );
}
export function assertNativeMaya() {
  assertMaya(readNativeRows());
}
