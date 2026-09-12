export interface TransactionDatabase {
  execSync(source: string): void;
  withTransactionSync(task: () => void): void;
}

export type ClearDataCleanup = 'preferences' | 'photos';

export interface ClearDataOutcome {
  incompleteCleanup: ClearDataCleanup[];
}

/** Relational data is all-or-nothing so facts and dates cannot be orphaned. */
export function clearRelationalData(database: TransactionDatabase): void {
  database.withTransactionSync(() => {
    database.execSync('DELETE FROM facts;');
    database.execSync('DELETE FROM dates;');
    database.execSync('DELETE FROM persons;');
  });
}

export function clearDeviceData(
  database: TransactionDatabase,
  clearPreferences: () => void,
  clearPhotos: () => boolean,
): ClearDataOutcome {
  clearRelationalData(database);

  const incompleteCleanup: ClearDataCleanup[] = [];
  try {
    clearPreferences();
  } catch {
    incompleteCleanup.push('preferences');
  }
  if (!clearPhotos()) incompleteCleanup.push('photos');

  return { incompleteCleanup };
}
