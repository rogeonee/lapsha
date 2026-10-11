import type { CalendarDay } from '~/lib/current-day';
import {
  calendarDaysBetween,
  formatCalendarDay,
  nextCalendarDateOccurrence,
} from '~/lib/dates';
import type { TimelineEntry } from '~/types/db';

export interface UpcomingEntry {
  entry: TimelineEntry;
  next: CalendarDay;
  daysUntil: number;
  years: number | null;
}

export interface UpcomingRowGroup {
  key: string;
  personId: string;
  personName: string;
  personAvatar: string | null;
  next: CalendarDay;
  daysUntil: number;
  entries: UpcomingEntry[];
}

export interface UpcomingSection {
  key: string;
  title: string;
  subtitle?: string;
  showDay: boolean;
  data: UpcomingRowGroup[];
}

export function buildUpcomingSections(
  entries: TimelineEntry[],
  today: CalendarDay,
): UpcomingSection[] {
  const upcoming = entries
    .map((entry) => {
      const next = nextCalendarDateOccurrence(entry.month, entry.day, today);
      const daysUntil = calendarDaysBetween(today, next);
      const elapsed = next.year - Number(entry.date.slice(0, 4));
      const years = entry.year_known && elapsed > 0 ? elapsed : null;
      return { entry, next, daysUntil, years };
    })
    .sort(
      (a, b) =>
        a.daysUntil - b.daysUntil ||
        a.entry.person.name.localeCompare(b.entry.person.name) ||
        a.entry.person_id.localeCompare(b.entry.person_id) ||
        a.entry.date.localeCompare(b.entry.date) ||
        a.entry.id.localeCompare(b.entry.id),
    );

  const sections: UpcomingSection[] = [];
  for (const item of upcoming) {
    const key =
      item.daysUntil === 0
        ? 'today'
        : item.daysUntil === 1
          ? 'tomorrow'
          : `${item.next.year}-${item.next.month}`;
    let section = sections[sections.length - 1];
    if (!section || section.key !== key) {
      const showDay = item.daysUntil > 1;
      section = {
        key,
        title: showDay
          ? formatCalendarDay(item.next, {
              month: 'long',
              ...(item.next.year !== today.year ? { year: 'numeric' } : {}),
            })
          : item.daysUntil === 0
            ? 'Today'
            : 'Tomorrow',
        subtitle: showDay
          ? undefined
          : formatCalendarDay(item.next, { month: 'long', day: 'numeric' }),
        showDay,
        data: [],
      };
      sections.push(section);
    }

    const lastRow = section.data[section.data.length - 1];
    if (
      lastRow &&
      lastRow.personId === item.entry.person_id &&
      lastRow.next.year === item.next.year &&
      lastRow.next.month === item.next.month &&
      lastRow.next.day === item.next.day
    ) {
      lastRow.entries.push(item);
    } else {
      section.data.push({
        key: `${item.entry.person_id}:${item.next.year}-${item.next.month}-${item.next.day}`,
        personId: item.entry.person_id,
        personName: item.entry.person.name,
        personAvatar: item.entry.person.avatar,
        next: item.next,
        daysUntil: item.daysUntil,
        entries: [item],
      });
    }
  }
  return sections;
}
