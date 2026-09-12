export interface CurrentDaySnapshot {
  today: CalendarDay;
  key: string;
  timeZone: string;
}

export interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const SEARCH_MARGIN_MS = 36 * 60 * 60 * 1000;

export function getSystemTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function calendarDayFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

function calendarDayAt(
  instant: Date,
  formatter: Intl.DateTimeFormat,
): CalendarDay {
  const parts = formatter.formatToParts(instant);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function calendarDayKey({ year, month, day }: CalendarDay): string {
  return `${year}-${month}-${day}`;
}

function calendarDayNumber(day: CalendarDay): number {
  return Date.UTC(day.year, day.month - 1, day.day) / DAY_MS;
}

function startOfCalendarDay(day: CalendarDay, timeZone: string): number {
  const target = calendarDayNumber(day);
  const targetUtc = target * DAY_MS;
  const formatter = calendarDayFormatter(timeZone);
  let low = targetUtc - SEARCH_MARGIN_MS;
  let high = targetUtc + SEARCH_MARGIN_MS;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (
      calendarDayNumber(calendarDayAt(new Date(middle), formatter)) >= target
    ) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }

  return low;
}

/** A stable local-calendar reference shared by relative date calculations. */
export function getCurrentDaySnapshot(
  now = new Date(),
  timeZone = getSystemTimeZone(),
): CurrentDaySnapshot {
  const day = calendarDayAt(now, calendarDayFormatter(timeZone));
  return {
    today: day,
    key: calendarDayKey(day),
    timeZone,
  };
}

export function hasCurrentDayChanged(
  previous: CurrentDaySnapshot,
  now = new Date(),
  timeZone = getSystemTimeZone(),
): boolean {
  const day = calendarDayAt(now, calendarDayFormatter(timeZone));
  return previous.key !== calendarDayKey(day) || previous.timeZone !== timeZone;
}

export function refreshCurrentDaySnapshot(
  previous: CurrentDaySnapshot,
  now = new Date(),
  timeZone = getSystemTimeZone(),
): CurrentDaySnapshot {
  return hasCurrentDayChanged(previous, now, timeZone)
    ? getCurrentDaySnapshot(now, timeZone)
    : previous;
}

/** Delay until the current IANA timezone enters its next calendar day. */
export function millisecondsUntilNextDay(
  now = new Date(),
  timeZone = getSystemTimeZone(),
): number {
  const current = calendarDayAt(now, calendarDayFormatter(timeZone));
  const nextUtc = new Date(
    Date.UTC(current.year, current.month - 1, current.day + 1),
  );
  const next = {
    year: nextUtc.getUTCFullYear(),
    month: nextUtc.getUTCMonth() + 1,
    day: nextUtc.getUTCDate(),
  };
  return Math.max(0, startOfCalendarDay(next, timeZone) - now.getTime());
}

interface CurrentDayMonitorOptions {
  now: () => Date;
  timeZone: () => string;
  initialSnapshot?: CurrentDaySnapshot;
  onChange: (snapshot: CurrentDaySnapshot) => void;
  setTimeout: (
    callback: () => void,
    delay: number,
  ) => ReturnType<typeof setTimeout>;
  clearTimeout: (timer: ReturnType<typeof setTimeout>) => void;
  setInterval: (
    callback: () => void,
    delay: number,
  ) => ReturnType<typeof setInterval>;
  clearInterval: (timer: ReturnType<typeof setInterval>) => void;
  timezoneCheckInterval: number;
}

/** Calendar monitor kept platform-free so lifecycle scheduling is testable. */
export function createCurrentDayMonitor(options: CurrentDayMonitorOptions) {
  let snapshot =
    options.initialSnapshot ??
    getCurrentDaySnapshot(options.now(), options.timeZone());
  let midnightTimer: ReturnType<typeof setTimeout> | undefined;
  let timezoneTimer: ReturnType<typeof setInterval> | undefined;

  const scheduleMidnight = () => {
    if (midnightTimer !== undefined) options.clearTimeout(midnightTimer);
    midnightTimer = options.setTimeout(
      () => {
        if (!check()) scheduleMidnight();
      },
      millisecondsUntilNextDay(options.now(), options.timeZone()) + 100,
    );
  };

  const check = () => {
    const next = refreshCurrentDaySnapshot(
      snapshot,
      options.now(),
      options.timeZone(),
    );
    if (next === snapshot) return false;

    snapshot = next;
    options.onChange(next);
    scheduleMidnight();
    return true;
  };

  return {
    start() {
      if (!check()) scheduleMidnight();
      timezoneTimer = options.setInterval(check, options.timezoneCheckInterval);
    },
    check,
    resync() {
      if (!check()) scheduleMidnight();
    },
    stop() {
      if (midnightTimer !== undefined) options.clearTimeout(midnightTimer);
      if (timezoneTimer !== undefined) options.clearInterval(timezoneTimer);
    },
  };
}
