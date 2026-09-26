export interface PreferenceStorage {
  removeItemSync(key: string): void;
}

export function clearPreferenceKeys(
  storage: PreferenceStorage,
  keys: readonly string[],
  onChange: () => void,
): void {
  let failed = false;
  for (const key of keys) {
    try {
      storage.removeItemSync(key);
    } catch {
      failed = true;
    }
  }
  onChange();
  if (failed) throw new Error('Preference cleanup incomplete');
}
