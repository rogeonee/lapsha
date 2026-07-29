export type UUID = string;

export interface Person {
  id: UUID;
  name: string;
  avatar: string | null; // photo file name in <documents>/avatars/, null = initials
  created_at: string; // ISO string
  updated_at: string;
  deleted_at: string | null;
}

export interface PersonInsert {
  id?: UUID;
  name: string;
  avatar?: string | null;
}

export interface PersonUpdate {
  name?: string;
  avatar?: string | null; // null removes the photo, undefined leaves it unchanged
}

export interface Fact {
  id: UUID;
  person_id: UUID;
  label: string | null; // null = plain-text fact (no label)
  value: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FactInsert {
  id?: UUID;
  person_id: UUID;
  label?: string | null;
  value: string;
}

export interface FactUpdate {
  label?: string | null; // null clears the label, undefined leaves it unchanged
  value?: string;
}

export interface Date {
  id: UUID;
  person_id: UUID;
  label: string;
  date: string; // YYYY-MM-DD, year 0001 = year unknown (recurring)
  month: number;
  day: number;
  year_known: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Sort modes for a person's facts/dates lists.
 * 'custom' (drag-n-drop via sort_order) is planned but not implemented yet.
 */
export type EntrySort = 'created' | 'modified';

export interface DateInsert {
  id?: UUID;
  person_id: UUID;
  label: string;
  date: string;
}

export interface DateUpdate {
  label?: string;
  date?: string;
}

// Composite types for enhanced queries
export type PersonWithDetails = Person & {
  facts: Fact[];
  dates: Date[];
};

export type TimelineEntry = Date & {
  person: Pick<Person, 'id' | 'name' | 'avatar'>;
};

export type UpcomingDate = {
  date_id: UUID;
  person_id: UUID;
  label: string;
  event_date: string;
  next_occurrence: string;
};

// Re-export service types for consistency
export { ErrorCode } from '../api/error-handling';
export type { ServiceError, ServiceResponse } from '../api/error-handling';
