import { Database, type SQLQueryBindings } from 'bun:sqlite';
import type { MigrationDatabase } from '../../src/api/migrations';

// Only the positional synchronous API used by migrations and services is modeled.
// Native change listeners and Expo's platform storage are verified on device.
export function sqliteFixture() {
  const sqlite = new Database(':memory:');
  const database = {
    execSync(source: string) {
      sqlite.exec(source);
    },
    getFirstSync<T>(source: string, ...params: SQLQueryBindings[]): T | null {
      const statement = sqlite.prepare<T, SQLQueryBindings[]>(source);
      try {
        return statement.get(...params);
      } finally {
        statement.finalize();
      }
    },
    getAllSync<T>(source: string, ...params: SQLQueryBindings[]): T[] {
      const statement = sqlite.prepare<T, SQLQueryBindings[]>(source);
      try {
        return statement.all(...params);
      } finally {
        statement.finalize();
      }
    },
    runSync(source: string, ...params: SQLQueryBindings[]) {
      const statement = sqlite.prepare(source);
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
