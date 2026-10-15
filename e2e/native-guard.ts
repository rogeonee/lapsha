import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
export const syntheticBundle = 'com.rogeonee.lapsha.e2e';
export function nativeGuard() {
  assert.equal(process.env.LAPSHA_E2E_SYNTHETIC, syntheticBundle);
  const device = process.env.LAPSHA_E2E_DEVICE;
  assert.match(device ?? '', /^[A-F0-9-]{36}$/i);
  const session = JSON.parse(
    readFileSync(process.env.LAPSHA_E2E_SESSION_FILE!, 'utf8'),
  );
  assert.equal(session.token, process.env.LAPSHA_E2E_SESSION_TOKEN);
  assert.equal(session.device, device);
  assert.equal(session.bundle, syntheticBundle);
  process.kill(session.pid, 0);
  return device!;
}
