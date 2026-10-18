import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { bundleId, iosDevice } from './target';

export interface Rows {
  persons: { id: string; name: string; deleted_at: string | null }[];
  facts: {
    person_id: string;
    label: string | null;
    value: string;
    deleted_at: string | null;
  }[];
  gifts: {
    person_id: string | null;
    title: string | null;
    note: string | null;
    url: string | null;
    photo: string | null;
    status: string;
    given_on: string | null;
    deleted_at: string | null;
  }[];
}

const xcrun = (...args: string[]) =>
  execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8' });

function databasePath() {
  const { devices } = JSON.parse(xcrun('list', 'devices', 'booted', '--json'));
  const [device, ...others] = Object.values(
    devices as Record<string, { udid: string; name: string }[]>,
  )
    .flat()
    .filter(({ udid, name }) => udid === iosDevice || name === iosDevice);
  if (!device || others.length > 0) {
    throw new Error(`Expected one booted simulator named ${iosDevice}`);
  }
  const container = xcrun(
    'get_app_container',
    device.udid,
    bundleId,
    'data',
  ).trim();
  return join(container, 'Documents', 'SQLite', 'lapsha.db');
}

/** Every row, tombstones included, as the app committed them to disk. */
export function readRows(): Rows {
  const path = databasePath();
  const table = (name: keyof Rows) =>
    JSON.parse(
      execFileSync(
        '/usr/bin/sqlite3',
        ['-readonly', '-json', path, `SELECT * FROM ${name}`],
        { encoding: 'utf8' },
      ) || '[]',
    );
  return {
    persons: table('persons'),
    facts: table('facts'),
    gifts: table('gifts'),
  };
}
