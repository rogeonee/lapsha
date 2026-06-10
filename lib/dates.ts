import type { Date as PersonDate } from '~/types/db';

/** Year used in stored dates when the year is unknown (recurring dates) */
const UNKNOWN_YEAR = '0001';

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/**
 * Build the stored YYYY-MM-DD string from a picked Date.
 * `includeYear: false` stores year 0001 (the year-unknown convention).
 */
export function toStorageDate(date: Date, includeYear: boolean): string {
  const year = includeYear ? pad(date.getFullYear(), 4) : UNKNOWN_YEAR;
  return `${year}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
}

/**
 * Inverse of toStorageDate, for prefilling edit forms. Year-unknown dates
 * come back in the current year with `includeYear: false`.
 */
export function fromStorageDate(stored: string): {
  date: Date;
  includeYear: boolean;
} {
  const [year, month, day] = stored.split('-').map(Number);
  const includeYear = year !== Number(UNKNOWN_YEAR);
  return {
    date: new Date(
      includeYear ? year : new Date().getFullYear(),
      month - 1,
      day,
    ),
    includeYear,
  };
}

/** "March 15, 1990" when the year is known, "March 15" otherwise */
export function formatDisplayDate(personDate: PersonDate): string {
  const year = Number(personDate.date.slice(0, 4));
  const value = new Date(
    personDate.year_known ? year : 2000,
    personDate.month - 1,
    personDate.day,
  );
  return value.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    ...(personDate.year_known ? { year: 'numeric' } : {}),
  });
}
