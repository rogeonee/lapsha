import { db } from '~/api/database';
import { runServiceOperation } from '~/api/error-handling';
import { ServiceResponse, TimelineEntry, UpcomingDate } from '~/types/db';

/**
 * Options for filtering timeline results
 */
export interface TimelineOptions {
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  limit?: number;
  includeUnknownYears?: boolean; // Whether to include dates with year 0001
}

/**
 * Raw timeline row: a `dates` row joined with its person's name
 * (booleans are 0/1 integers in SQLite)
 */
type TimelineRow = Omit<TimelineEntry, 'person' | 'year_known'> & {
  year_known: number;
  person_name: string;
};

function rowToTimelineEntry(row: TimelineRow): TimelineEntry {
  const { person_name, ...date } = row;
  return {
    ...date,
    year_known: row.year_known === 1,
    person: { id: row.person_id, name: person_name },
  };
}

/**
 * Get timeline of all dates across all people, sorted chronologically
 * Handles recurring dates (year 0001) by treating them as annual events
 */
export function getTimeline(
  options: TimelineOptions = {},
): ServiceResponse<TimelineEntry[]> {
  return runServiceOperation(() => {
    const { startDate, endDate, limit, includeUnknownYears = true } = options;

    const conditions = ['d.deleted_at IS NULL', 'p.deleted_at IS NULL'];
    const params: (string | number)[] = [];

    if (startDate) {
      conditions.push('d.date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('d.date <= ?');
      params.push(endDate);
    }
    if (!includeUnknownYears) {
      conditions.push('d.year_known = 1');
    }

    let query = `
      SELECT d.*, p.name AS person_name
      FROM dates d
      JOIN persons p ON p.id = d.person_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY d.date ASC
    `;

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const rows = db.getAllSync<TimelineRow>(query, ...params);
    const timelineEntries = rows.map(rowToTimelineEntry);

    // Sort chronologically with special handling for recurring dates
    // (year 0001), which are projected onto the current year
    const currentYear = new Date().getFullYear();

    return timelineEntries.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);

      if (dateA.getFullYear() === 1) {
        dateA.setFullYear(currentYear);
      }
      if (dateB.getFullYear() === 1) {
        dateB.setFullYear(currentYear);
      }

      return dateA.getTime() - dateB.getTime();
    });
  });
}

/**
 * Get upcoming dates within a specified number of days
 * Useful for dashboard widgets or notifications
 */
export function getUpcomingDates(
  daysAhead: number = 30,
): ServiceResponse<UpcomingDate[]> {
  return runServiceOperation(() => {
    const rows = db.getAllSync<TimelineRow>(
      `SELECT d.*, p.name AS person_name
       FROM dates d
       JOIN persons p ON p.id = d.person_id
       WHERE d.deleted_at IS NULL AND p.deleted_at IS NULL`,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const upcoming: (UpcomingDate & { nextTime: number })[] = [];

    for (const row of rows) {
      // Next occurrence of this month/day, today or later
      let next = new Date(today.getFullYear(), row.month - 1, row.day);
      if (next < today) {
        next = new Date(today.getFullYear() + 1, row.month - 1, row.day);
      }

      if (next <= cutoff) {
        const pad = (n: number) => String(n).padStart(2, '0');
        upcoming.push({
          date_id: row.id,
          person_id: row.person_id,
          label: row.label,
          event_date: row.date,
          next_occurrence: `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`,
          nextTime: next.getTime(),
        });
      }
    }

    return upcoming
      .sort((a, b) => a.nextTime - b.nextTime)
      .map(({ nextTime, ...entry }) => entry);
  });
}

/**
 * Get dates for a specific month across all people
 * Useful for calendar views
 */
export function getTimelineForMonth(
  year: number,
  month: number,
): ServiceResponse<TimelineEntry[]> {
  // Create start and end dates for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month

  return getTimeline({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    includeUnknownYears: true,
  });
}
