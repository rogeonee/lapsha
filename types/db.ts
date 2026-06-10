export type UUID = string;

export interface Person {
  id: UUID;
  name: string;
  created_at: string; // ISO string
  updated_at: string;
  deleted_at: string | null;
}

export interface PersonInsert {
  id?: UUID;
  name: string;
}

export interface PersonUpdate {
  name?: string;
}

export interface Fact {
  id: UUID;
  person_id: UUID;
  label: string;
  value: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FactInsert {
  id?: UUID;
  person_id: UUID;
  label: string;
  value: string;
}

export interface FactUpdate {
  label?: string;
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
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

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
  person: Pick<Person, 'id' | 'name'>;
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
