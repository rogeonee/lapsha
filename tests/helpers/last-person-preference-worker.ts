import assert from 'node:assert/strict';
import { mock } from 'bun:test';

const personId = '11111111-1111-4111-8111-111111111111';
const sensitiveMarker = 'synthetic-private-preference-content';
const writes: [string, string][] = [];
const removals: string[] = [];
const reports: Error[] = [];
let writeFails = false;
let removalFails = false;

mock.module('expo-sqlite/kv-store', () => ({
  default: {
    setItemSync(key: string, value: string) {
      if (writeFails) throw new Error(`${sensitiveMarker}: ${value}`);
      writes.push([key, value]);
    },
    removeItemSync(key: string) {
      removals.push(key);
      if (removalFails && key === 'sort.facts') {
        throw new Error(sensitiveMarker);
      }
    },
  },
}));
mock.module('expo-observe', () => ({
  Observe: { reportError: (error: Error) => reports.push(error) },
}));

const { setLastPersonId, subscribeToPreferences, clearPreferences } =
  await import('../../src/lib/prefs');

let notifications = 0;
const unsubscribe = subscribeToPreferences(() => {
  notifications += 1;
});
assert.equal(setLastPersonId(personId), undefined);
assert.deepEqual(writes, [['lastPersonId', personId]]);
assert.equal(notifications, 1);
assert.equal(reports.length, 0);

writeFails = true;
assert.doesNotThrow(() => setLastPersonId(personId));
assert.equal(writes.length, 1);
assert.equal(notifications, 1);
assert.equal(reports.length, 1);

writeFails = false;
const unsubscribeThrowing = subscribeToPreferences(() => {
  throw new Error(`${sensitiveMarker}: ${personId}`);
});
assert.doesNotThrow(() => setLastPersonId(personId));
assert.deepEqual(writes, [
  ['lastPersonId', personId],
  ['lastPersonId', personId],
]);
assert.equal(notifications, 2);
assert.equal(reports.length, 2);
unsubscribeThrowing();

for (const report of reports) {
  assert.ok(report instanceof Error);
  assert.equal(report.message, 'Saving last person preference failed');
  assert.equal(report.cause, undefined);
  const diagnostic = `${report.stack}\n${JSON.stringify(report)}`;
  assert.ok(!diagnostic.includes(sensitiveMarker));
  assert.ok(!diagnostic.includes(personId));
}

removalFails = true;
assert.throws(() => clearPreferences(), /Preference cleanup incomplete/);
assert.deepEqual(removals, ['sort.facts', 'lastPersonId']);
assert.equal(notifications, 3);
assert.equal(reports.length, 2);
unsubscribe();

console.log('Last-person preference checks passed');
