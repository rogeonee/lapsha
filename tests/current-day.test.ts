import { describe, expect, test } from 'bun:test';
import {
  createCurrentDayMonitor,
  getCurrentDaySnapshot,
  millisecondsUntilNextDay,
  refreshCurrentDaySnapshot,
} from '../src/lib/current-day';
import {
  calendarDaysBetween,
  formatDateDetail,
  nextCalendarDateOccurrence,
  nextDateOccurrence,
} from '../src/lib/dates';
import type { Date as PersonDate } from '../src/types/db';

function localDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  return new Date(year, month - 1, day, hour, minute);
}

const birthday: PersonDate = {
  id: 'date-id',
  person_id: 'person-id',
  label: 'Birthday',
  date: '2000-02-29',
  month: 2,
  day: 29,
  year_known: true,
  sort_order: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
};

describe(`current local day in ${process.env.TZ}`, () => {
  test('keeps the same reference during a day and invalidates at midnight', () => {
    const beforeMidnight = getCurrentDaySnapshot(
      localDate(2026, 12, 31, 23, 59),
    );
    expect(
      refreshCurrentDaySnapshot(
        beforeMidnight,
        localDate(2026, 12, 31, 23, 59),
      ),
    ).toBe(beforeMidnight);

    const afterMidnight = refreshCurrentDaySnapshot(
      beforeMidnight,
      localDate(2027, 1, 1),
    );
    expect(afterMidnight).not.toBe(beforeMidnight);
    expect(afterMidnight.key).toBe('2027-1-1');
  });

  test('a resume check catches days elapsed while suspended', () => {
    const suspended = getCurrentDaySnapshot(localDate(2026, 6, 30, 12));
    const resumed = refreshCurrentDaySnapshot(
      suspended,
      localDate(2026, 7, 2, 8),
    );
    expect(resumed.key).toBe('2026-7-2');
  });

  test('a timezone-offset change invalidates on the same calendar day', () => {
    const original = getCurrentDaySnapshot(localDate(2026, 7, 2, 8));
    const previous = {
      ...original,
      timeZone:
        original.timeZone === 'Asia/Tokyo' ? 'America/Edmonton' : 'Asia/Tokyo',
    };
    expect(
      refreshCurrentDaySnapshot(previous, localDate(2026, 7, 2, 8)),
    ).not.toBe(previous);
  });

  test('lifecycle checks publish changes and rearm local midnight', () => {
    let now = new Date('2026-07-01T05:59:00.000Z');
    let timeZone = 'America/Edmonton';
    const timeoutCalls: {
      id: ReturnType<typeof setTimeout>;
      delay: number;
    }[] = [];
    const clearedTimeouts: ReturnType<typeof setTimeout>[] = [];
    let intervalCallback: (() => void) | undefined;
    const changes: string[] = [];

    const monitor = createCurrentDayMonitor({
      now: () => now,
      timeZone: () => timeZone,
      onChange: (snapshot) => changes.push(snapshot.key),
      setTimeout: (_callback, delay) => {
        const id = {} as ReturnType<typeof setTimeout>;
        timeoutCalls.push({ id, delay });
        return id;
      },
      clearTimeout: (id) => clearedTimeouts.push(id),
      setInterval: (callback) => {
        intervalCallback = callback;
        return {} as ReturnType<typeof setInterval>;
      },
      clearInterval: () => {},
      timezoneCheckInterval: 60_000,
    });

    monitor.start();
    expect(timeoutCalls).toHaveLength(1);

    monitor.resync();
    expect(clearedTimeouts).toEqual([timeoutCalls[0].id]);
    expect(timeoutCalls).toHaveLength(2);

    now = new Date('2026-07-02T14:00:00.000Z');
    expect(monitor.check()).toBe(true);
    expect(changes).toEqual(['2026-7-2']);
    expect(clearedTimeouts).toHaveLength(2);
    expect(timeoutCalls).toHaveLength(3);

    timeZone = 'America/Regina';
    intervalCallback?.();
    expect(changes).toEqual(['2026-7-2', '2026-7-2']);
    expect(clearedTimeouts).toHaveLength(3);
    expect(timeoutCalls).toHaveLength(4);
  });

  test('the midnight timer publishes, rearms, and cleans up', () => {
    let now = new Date('2026-12-31T23:59:00.000Z');
    const timeouts: {
      id: ReturnType<typeof setTimeout>;
      callback: () => void;
    }[] = [];
    const clearedTimeouts: ReturnType<typeof setTimeout>[] = [];
    const intervalId = {} as ReturnType<typeof setInterval>;
    const clearedIntervals: ReturnType<typeof setInterval>[] = [];
    const changes: string[] = [];

    const monitor = createCurrentDayMonitor({
      now: () => now,
      timeZone: () => 'UTC',
      onChange: (snapshot) => changes.push(snapshot.key),
      setTimeout: (callback) => {
        const id = {} as ReturnType<typeof setTimeout>;
        timeouts.push({ id, callback });
        return id;
      },
      clearTimeout: (id) => clearedTimeouts.push(id),
      setInterval: () => intervalId,
      clearInterval: (id) => clearedIntervals.push(id),
      timezoneCheckInterval: 60_000,
    });

    monitor.start();
    const firstMidnight = timeouts[0];
    now = new Date('2027-01-01T00:01:00.000Z');
    firstMidnight.callback();

    expect(changes).toEqual(['2027-1-1']);
    expect(timeouts).toHaveLength(2);
    expect(clearedTimeouts).toEqual([firstMidnight.id]);

    monitor.stop();
    expect(clearedTimeouts).toContain(timeouts[1].id);
    expect(clearedIntervals).toEqual([intervalId]);
  });

  test('monitor startup publishes when provider initialization crossed midnight', () => {
    const initialSnapshot = getCurrentDaySnapshot(
      new Date('2026-12-31T23:59:59.999Z'),
      'UTC',
    );
    const changes: string[] = [];
    const monitor = createCurrentDayMonitor({
      now: () => new Date('2027-01-01T00:00:00.001Z'),
      timeZone: () => 'UTC',
      initialSnapshot,
      onChange: (snapshot) => changes.push(snapshot.key),
      setTimeout: () => ({}) as ReturnType<typeof setTimeout>,
      clearTimeout: () => {},
      setInterval: () => ({}) as ReturnType<typeof setInterval>,
      clearInterval: () => {},
      timezoneCheckInterval: 60_000,
    });

    monitor.start();
    expect(changes).toEqual(['2027-1-1']);
    monitor.stop();
  });

  test('the midnight delay follows local DST day length', () => {
    expect(
      millisecondsUntilNextDay(
        new Date('2025-03-09T05:00:00.000Z'),
        'America/New_York',
      ),
    ).toBe(23 * 60 * 60 * 1000);
    expect(
      millisecondsUntilNextDay(
        new Date('2025-11-02T04:00:00.000Z'),
        'America/New_York',
      ),
    ).toBe(25 * 60 * 60 * 1000);
  });

  test('explicit Intl timezone overrides a stale runtime Date timezone', () => {
    const instant = new Date('2026-09-12T05:35:00.000Z');
    expect(getCurrentDaySnapshot(instant, 'America/Edmonton').key).toBe(
      '2026-9-11',
    );
    expect(getCurrentDaySnapshot(instant, 'Asia/Tokyo').key).toBe('2026-9-12');

    const edmonton = getCurrentDaySnapshot(instant, 'America/Edmonton').today;
    const september11 = nextCalendarDateOccurrence(9, 11, edmonton);
    const september12 = nextCalendarDateOccurrence(9, 12, edmonton);
    expect(calendarDaysBetween(edmonton, september11)).toBe(0);
    expect(calendarDaysBetween(edmonton, september12)).toBe(1);

    const tokyo = getCurrentDaySnapshot(instant, 'Asia/Tokyo').today;
    const tokyoSeptember11 = nextCalendarDateOccurrence(9, 11, tokyo);
    const tokyoSeptember12 = nextCalendarDateOccurrence(9, 12, tokyo);
    expect(tokyoSeptember11.year).toBe(2027);
    expect(calendarDaysBetween(tokyo, tokyoSeptember12)).toBe(0);
  });

  test('age calculations share the same leap-day reference', () => {
    const before = localDate(2027, 2, 28);
    const occurrence = nextDateOccurrence(2, 29, before);
    expect(occurrence.getFullYear()).toBe(2027);
    expect(occurrence.getMonth()).toBe(2);
    expect(occurrence.getDate()).toBe(1);
    expect(formatDateDetail(birthday, { year: 2027, month: 2, day: 28 })).toBe(
      '2000 · turns 27',
    );

    const after = localDate(2027, 3, 2);
    expect(formatDateDetail(birthday, { year: 2027, month: 3, day: 2 })).toBe(
      '2000 · turns 28',
    );
  });
});
