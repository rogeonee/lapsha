import Storage from 'expo-sqlite/kv-store';
import type { EntrySort } from '~/types/db';

/**
 * App preferences stored in expo-sqlite's key-value store (separate DB
 * file from lapsha.db, so writes never trigger the data change listener).
 */

const SORT_KEYS = {
  facts: 'sort.facts',
  dates: 'sort.dates',
} as const;

export type SortSection = keyof typeof SORT_KEYS;

const LAST_PERSON_KEY = 'lastPersonId';

export function getSortPref(section: SortSection): EntrySort {
  return Storage.getItemSync(SORT_KEYS[section]) === 'modified'
    ? 'modified'
    : 'created';
}

export function setSortPref(section: SortSection, sort: EntrySort): void {
  Storage.setItemSync(SORT_KEYS[section], sort);
}

/** Person last used in the quick-add sheet */
export function getLastPersonId(): string | null {
  return Storage.getItemSync(LAST_PERSON_KEY);
}

export function setLastPersonId(personId: string): void {
  Storage.setItemSync(LAST_PERSON_KEY, personId);
}
