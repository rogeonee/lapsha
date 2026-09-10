import { describe, expect, test } from 'bun:test';
import {
  createDateSchema,
  updateDateSchema,
} from '../src/api/dates/date-schema';
import {
  fromAndroidPickerDate,
  fromStorageDate,
  nextDateOccurrence,
  toAndroidPickerDate,
  toStorageDate,
} from '../src/lib/dates';

// Run in separate processes with TZ=UTC, Asia/Tokyo, and America/Edmonton.
describe(`calendar dates in ${process.env.TZ}`, () => {
  test.each([
    '0001-02-29',
    '0001-04-02',
    '1990-04-02',
    '2000-02-29',
    '2024-02-29',
    '0096-02-29',
  ])(
    '%s survives editing and confirming an unchanged Android selection',
    (stored) => {
      const { date, includeYear } = fromStorageDate(stored);
      expect(toStorageDate(date, includeYear)).toBe(stored);
      const pickerDate = toAndroidPickerDate(date);
      expect(pickerDate.slice(5, 10)).toBe(stored.slice(5));
      expect(pickerDate.slice(10)).toBe('T00:00:00.000Z');
      expect(
        toStorageDate(fromAndroidPickerDate(new Date(pickerDate)), includeYear),
      ).toBe(stored);
    },
  );

  test.each(['2026-03-08', '2026-11-01', '2026-12-31', '2027-01-01'])(
    '%s survives an add-person picker round trip, including a non-midnight time',
    (stored) => {
      const { date } = fromStorageDate(stored);
      date.setHours(23, 45);
      const selected = fromAndroidPickerDate(
        new Date(toAndroidPickerDate(date)),
      );
      expect(toStorageDate(selected, true)).toBe(stored);
    },
  );

  test.each([
    ['2026-02-28', '2026-03-01'],
    ['2026-03-01', '2026-03-01'],
    ['2026-03-02', '2027-03-01'],
    ['2027-03-02', '2028-02-29'],
    ['2028-02-29', '2028-02-29'],
    ['2028-03-01', '2029-03-01'],
  ])('February 29 after %s occurs on %s', (today, expected) => {
    expect(
      toStorageDate(
        nextDateOccurrence(2, 29, fromStorageDate(today).date),
        true,
      ),
    ).toBe(expected);
    expect(toStorageDate(fromStorageDate('0001-02-29').date, false)).toBe(
      '0001-02-29',
    );
  });
});

const person_id = 'a10d5d55-71ce-4cfe-b131-c759b91e9f54';
describe('stored date validation', () => {
  test.each([
    '0001-02-29',
    '2000-02-29',
    '2024-02-29',
    '0096-02-29',
    '1990-04-02',
    '2026-04-30',
  ])('create and update accept %s', (date) => {
    expect(
      createDateSchema.safeParse({ person_id, label: 'Birthday', date })
        .success,
    ).toBe(true);
    expect(updateDateSchema.safeParse({ date }).success).toBe(true);
  });
  test.each([
    '2026-02-29',
    '2026-02-30',
    '2026-04-31',
    '1900-02-29',
    '2100-02-29',
    '0001-02-30',
    '0001-04-31',
    '0000-01-01',
    '2026-00-10',
    '2026-13-01',
    '2026-01-00',
    '2026-01-32',
    '2026-2-03',
    'invalid',
  ])('create and update reject %s', (date) => {
    expect(
      createDateSchema.safeParse({ person_id, label: 'Birthday', date })
        .success,
    ).toBe(false);
    expect(updateDateSchema.safeParse({ date }).success).toBe(false);
  });
  test('label-only updates remain valid', () => {
    expect(updateDateSchema.safeParse({ label: 'Anniversary' }).success).toBe(
      true,
    );
  });
});
