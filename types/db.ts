// supabase gen types typescript --local --schema public > lib/database.types.ts for local SB in Docker

export type UUID = string; // Postgres uuid

export interface Tables {
  users: {
    Row: {
      id: UUID;
      username: string | null;
      display_name: string | null;
      timezone: string;
      locale: string | null;
      nudges_enabled: boolean;
      created_at: string; // ISO string
      updated_at: string;
      deleted_at: string | null;
    };
    Insert: {
      id?: UUID;
      username?: string | null;
      display_name?: string | null;
      timezone?: string;
      locale?: string | null;
      nudges_enabled?: boolean;
    };
    Update: {
      username?: string | null;
      display_name?: string | null;
      timezone?: string;
      locale?: string | null;
      nudges_enabled?: boolean;
      deleted_at?: string | null;
    };
  };

  persons: {
    Row: {
      id: UUID;
      user_id: UUID;
      name: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
    Insert: {
      id?: UUID;
      user_id: UUID;
      name: string;
    };
    Update: {
      name?: string;
      deleted_at?: string | null;
    };
  };

  facts: {
    Row: {
      id: UUID;
      person_id: UUID;
      label: string;
      value: string;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
    Insert: {
      id?: UUID;
      person_id: UUID;
      label: string;
      value: string;
    };
    Update: {
      label?: string;
      value?: string;
      deleted_at?: string | null;
    };
  };

  dates: {
    Row: {
      id: UUID;
      person_id: UUID;
      label: string;
      date: string; // YYYY-MM-DD
      month: number;
      day: number;
      year_known: boolean;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
    Insert: {
      id?: UUID;
      person_id: UUID;
      label: string;
      date: string;
    };
    Update: {
      label?: string;
      date?: string;
      deleted_at?: string | null;
    };
  };
}

// Basic type exports following existing patterns
export type Person = Tables['persons']['Row'];
export type PersonInsert = Tables['persons']['Insert'];
export type PersonUpdate = Tables['persons']['Update'];

export type Fact = Tables['facts']['Row'];
export type FactInsert = Tables['facts']['Insert'];
export type FactUpdate = Tables['facts']['Update'];

export type Date = Tables['dates']['Row'];
export type DateInsert = Tables['dates']['Insert'];
export type DateUpdate = Tables['dates']['Update'];

export type User = Tables['users']['Row'];
export type UserInsert = Tables['users']['Insert'];
export type UserUpdate = Tables['users']['Update'];

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
