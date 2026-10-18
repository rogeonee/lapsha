import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'bun:test';

const worker = fileURLToPath(
  new URL('./helpers/service-worker.ts', import.meta.url),
);
const root = fileURLToPath(new URL('../../', import.meta.url));

// Each phase is a fresh process. Native mocks and frozen time cannot leak into
// other suites. SIGKILL is sent only to the child returned by spawn().
function runWorker(phase: string, path: string, zone: string, today: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [worker, phase, path, today], {
      cwd: root,
      env: { ...process.env, TZ: zone },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let killedAfterCommit = false;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, 10_000);
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (
        phase === 'write' &&
        stdout.includes('COMMITTED\n') &&
        !killedAfterCommit
      ) {
        killedAfterCommit = true;
        child.kill('SIGKILL');
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      try {
        const diagnostic = `${phase} (${zone})\n${stdout}${stderr}`;
        assert.equal(timedOut, false, `Worker timed out: ${diagnostic}`);
        if (phase === 'write') {
          assert.equal(killedAfterCommit, true, diagnostic);
          assert.equal(signal, 'SIGKILL', diagnostic);
        } else {
          assert.equal(code, 0, diagnostic);
          assert.ok(stdout.includes(`PASS ${phase}`), diagnostic);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Independent literals at one frozen UTC instant catch accidental UTC getters
// and the previously surviving hard-coded default Given date.
for (const [zone, today] of [
  ['UTC', '2032-02-29'],
  ['Asia/Tokyo', '2032-02-29'],
  ['America/Edmonton', '2032-02-28'],
]) {
  test(`services persist exact rows through writer termination and deletion (${zone})`, async () => {
    const directory = mkdtempSync(
      join(tmpdir(), 'lapsha-service-integration-'),
    );
    try {
      const path = join(directory, 'fixture.sqlite');
      for (const phase of ['write', 'verify', 'delete', 'verify-deleted']) {
        await runWorker(phase, path, zone, today);
      }
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }, 45_000);
}
