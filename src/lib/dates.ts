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

/** "Jul" — short month name, for the date row's day block */
export function formatMonthShort(personDate: PersonDate): string {
  return new Date(
    2000,
    personDate.month - 1,
    personDate.day,
  ).toLocaleDateString(undefined, { month: 'short' });
}

/**
 * Detail line under a date row's label: "2019 · turns 8" for birthdays,
 * "2019 · 8 years" otherwise. The count is at the next occurrence, matching
 * the timeline. Null when the year is unknown.
 */
export function formatDateDetail(personDate: PersonDate): string | null {
  if (!personDate.year_known) return null;
  const year = Number(personDate.date.slice(0, 4));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(
    today.getFullYear(),
    personDate.month - 1,
    personDate.day,
  );
  if (next < today) {
    next = new Date(
      today.getFullYear() + 1,
      personDate.month - 1,
      personDate.day,
    );
  }
  const elapsed = next.getFullYear() - year;
  if (elapsed <= 0) return String(year);
  const suffix =
    personDate.label.toLowerCase() === 'birthday'
      ? `turns ${elapsed}`
      : `${elapsed} ${elapsed === 1 ? 'year' : 'years'}`;
  return `${year} · ${suffix}`;
}
