import { Database, type SQLQueryBindings } from 'bun:sqlite';
import type { MigrationDatabase } from '../../../src/api/migrations';

// Real disk SQLite and transactions; only Expo's synchronous connection API is
// adapted. Native SQLite listeners, UI, and OS storage remain device coverage.
export function openDiskDatabase(path: string) {
  const sqlite = new Database(path);
  const database = {
    execSync(sql: string) {
      sqlite.exec(sql);
    },
    getFirstSync<T>(sql: string, ...params: SQLQueryBindings[]): T | null {
      const statement = sqlite.prepare<T, SQLQueryBindings[]>(sql);
      try {
        return statement.get(...params);
      } finally {
        statement.finalize();
      }
    },
    getAllSync<T>(sql: string, ...params: SQLQueryBindings[]): T[] {
      const statement = sqlite.prepare<T, SQLQueryBindings[]>(sql);
      try {
        return statement.all(...params);
      } finally {
        statement.finalize();
      }
    },
    runSync(sql: string, ...params: SQLQueryBindings[]) {
      const statement = sqlite.prepare(sql);
      try {
        return statement.run(...params);
      } finally {
        statement.finalize();
      }
    },
    withTransactionSync(task: () => void) {
      sqlite.transaction(task)();
    },
  } satisfies MigrationDatabase;
  return { database, close: () => sqlite.close() };
}
