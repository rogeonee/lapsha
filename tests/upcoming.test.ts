import { expect, spyOn, test } from 'bun:test';
import { buildUpcomingSections } from '../src/lib/upcoming';
import type { TimelineEntry } from '../src/types/db';

function entry(
  id: string,
  date: string,
  personId = id,
  name = personId,
): TimelineEntry {
  const [year, month, day] = date.split('-').map(Number);
  return {
    id,
    person_id: personId,
    person: { id: personId, name, avatar: null },
    label: 'Birthday',
    date,
    month,
    day,
    year_known: year !== 1,
    sort_order: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    deleted_at: null,
  };
}

test('unsorted dates become Today, Tomorrow, and chronological month sections', () => {
  const entries = [
    entry('past-this-year', '2000-09-15'),
    entry('tomorrow', '0001-10-07'),
    entry('later', '2020-11-10'),
    entry('today', '1990-10-06'),
    entry('soon', '0001-10-08'),
  ];
  const before = structuredClone(entries);
  const sections = buildUpcomingSections(entries, {
    year: 2026,
    month: 10,
    day: 6,
  });
  expect(sections.map((section) => section.key)).toEqual([
    'today',
    'tomorrow',
    '2026-10',
    '2026-11',
    '2027-9',
  ]);
  expect(sections.map((section) => section.showDay)).toEqual([
    false,
    false,
    true,
    true,
    true,
  ]);
  expect(sections[0].title).toBe('Today');
  expect(sections[1].title).toBe('Tomorrow');
  expect(sections[4].title).toContain('2027');
  expect(
    sections.flatMap((section) => section.data).map((row) => row.daysUntil),
  ).toEqual([0, 1, 2, 35, 344]);
  expect(sections[0].data[0].entries[0].years).toBe(36);
  expect(sections[1].data[0].entries[0].years).toBeNull();
  expect(entries).toEqual(before);
});

test('same-day dates stack per person, with stable ordering for identical names', () => {
  const inputs = [
    entry('known', '2000-10-09', 'b', 'Same name'),
    entry('a', '0001-10-09', 'a', 'Same name'),
    entry('unknown', '0001-10-09', 'b', 'Same name'),
    entry('other-day', '2000-10-10', 'b', 'Same name'),
    entry('first-name', '2000-10-09', 'c', 'Alpha'),
  ];
  const today = { year: 2026, month: 10, day: 6 };
  const sections = buildUpcomingSections(inputs, today);
  const rows = sections[0].data;
  expect(rows.map((row) => row.personId)).toEqual(['c', 'a', 'b', 'b']);
  expect(rows[2].entries.map((item) => item.entry.id)).toEqual([
    'unknown',
    'known',
  ]);
  expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  expect(buildUpcomingSections(inputs.toReversed(), today)).toEqual(sections);
});

test('leap-day dates keep their stored date and merge on March 1 in non-leap years', () => {
  const sections = buildUpcomingSections(
    [
      entry('leap', '0001-02-29', 'person'),
      entry('march', '2000-03-01', 'person'),
    ],
    { year: 2027, month: 2, day: 28 },
  );
  expect(sections.map((section) => section.key)).toEqual(['tomorrow']);
  expect(sections[0].data).toHaveLength(1);
  expect(sections[0].data[0].next).toEqual({ year: 2027, month: 3, day: 1 });
  expect(sections[0].data[0].entries.map((item) => item.entry.date)).toEqual([
    '0001-02-29',
    '2000-03-01',
  ]);
  const leapYear = buildUpcomingSections([entry('leap', '0001-02-29')], {
    year: 2028,
    month: 2,
    day: 28,
  });
  expect(leapYear[0].data[0].next).toEqual({ year: 2028, month: 2, day: 29 });
});

test('year-end Tomorrow belongs to the next year and future known years have no age', () => {
  const sections = buildUpcomingSections(
    [entry('new-year', '2030-01-01'), entry('later', '2000-01-03')],
    { year: 2026, month: 12, day: 31 },
  );
  expect(sections.map((section) => section.key)).toEqual([
    'tomorrow',
    '2027-1',
  ]);
  expect(sections[0].data[0].next.year).toBe(2027);
  expect(sections[0].data[0].entries[0].years).toBeNull();
  expect(sections[1].data[0].entries[0].years).toBe(27);
});

test('empty input has no sections or rows', () => {
  expect(buildUpcomingSections([], { year: 2026, month: 10, day: 6 })).toEqual(
    [],
  );
});

test('a busy month exposes individual rows and formats its heading once', () => {
  const entries = Array.from({ length: 2000 }, (_, index) =>
    entry(String(index), '0001-10-15'),
  );
  const format = spyOn(Date.prototype, 'toLocaleDateString');
  try {
    const sections = buildUpcomingSections(entries, {
      year: 2026,
      month: 10,
      day: 6,
    });
    expect(sections).toHaveLength(1);
    expect(sections[0].data).toHaveLength(2000);
    expect(sections[0].data.every((row) => row.entries.length === 1)).toBe(
      true,
    );
    expect(format).toHaveBeenCalledTimes(1);
  } finally {
    format.mockRestore();
  }
});
