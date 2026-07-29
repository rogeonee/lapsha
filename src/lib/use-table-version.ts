import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useState } from 'react';

/**
 * Returns a counter that increments whenever one of the given lapsha.db
 * tables changes. Key data-loading effects on it so screens refresh after
 * writes that happen outside navigation (e.g. the quick-add sheet, which
 * is not a route and never triggers useFocusEffect).
 */
export function useTableVersion(tables: readonly string[]): number {
  const [version, setVersion] = useState(0);
  const tablesKey = tables.join(',');

  useEffect(() => {
    const watched = tablesKey.split(',');
    const subscription = addDatabaseChangeListener((event) => {
      if (
        event.databaseFilePath.endsWith('lapsha.db') &&
        watched.includes(event.tableName)
      ) {
        setVersion((v) => v + 1);
      }
    });
    return () => subscription.remove();
  }, [tablesKey]);

  return version;
}
