// supabase gen types typescript --local --schema public > lib/database.types.ts

export type UUID = string; // Postgres uuid

export interface Tables {
  users: {
    Row: {
      id: UUID;
      username: string | null;
      avatar_url: string | null;
      created_at: string; // ISO string
      updated_at: string;
      deleted_at: string | null;
    };
    Insert: {
      id?: UUID;
      username?: string | null;
      avatar_url?: string | null;
    };
    Update: {
      username?: string | null;
      avatar_url?: string | null;
      deleted_at?: string | null;
    };
  };

  persons: {
    Row: {
      id: UUID;
      user_id: UUID;
      name: string;
      photo_url: string | null;
      created_at: string;
      updated_at: string;
      deleted_at: string | null;
    };
    Insert: {
      id?: UUID;
      user_id: UUID;
      name: string;
      photo_url?: string | null;
    };
    Update: {
      name?: string;
      photo_url?: string | null;
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
