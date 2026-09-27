import { openDatabaseSync } from 'expo-sqlite';
import { clearDeviceData, type ClearDataOutcome } from '~/api/clear-data';
import { migrateDatabase } from '~/api/migrations';
import { clearAvatarFiles } from '~/lib/avatars';
import { clearPreferences } from '~/lib/prefs';

// enableChangeListener powers addDatabaseChangeListener-based UI refresh
// (see lib/use-table-version.ts)
export const db = openDatabaseSync('lapsha.db', { enableChangeListener: true });

migrateDatabase(db);

/**
 * Permanently delete all user data. Used by the "Clear All Data"
 * action in settings.
 */
export function clearAllData(): ClearDataOutcome {
  return clearDeviceData(db, clearPreferences, clearAvatarFiles);
}
