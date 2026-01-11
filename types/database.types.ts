export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          description: string | null;
          status: string;
          priority: string;
          project_id: string | null;
          category: string | null;
          subcategory: string | null;
          tags: string[];
          attachments: string[];
          created_at: string;
          updated_at: string;
          deadline: string | null;
          start_at: string | null;
          end_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          description?: string | null;
          status?: string;
          priority?: string;
          project_id?: string | null;
          category?: string | null;
          subcategory?: string | null;
          tags?: string[];
          attachments?: string[];
          created_at?: string;
          updated_at?: string;
          deadline?: string | null;
          start_at?: string | null;
          end_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: string;
          project_id?: string | null;
          category?: string | null;
          subcategory?: string | null;
          tags?: string[];
          attachments?: string[];
          created_at?: string;
          updated_at?: string;
          deadline?: string | null;
          start_at?: string | null;
          end_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          description: string | null;
          color: string | null;
          category: string | null;
          subcategory: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          description?: string | null;
          color?: string | null;
          category?: string | null;
          subcategory?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          description?: string | null;
          color?: string | null;
          category?: string | null;
          subcategory?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string | null;
          project_id: string | null;
          title: string;
          description: string | null;
          location: string | null;
          start_at: string;
          end_at: string;
          is_all_day: boolean;
          rrule: string | null;
          exdates: string[] | null;
          source: string;
          source_uid: string | null;
          source_calendar: string | null;
          raw_payload: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          project_id?: string | null;
          title: string;
          description?: string | null;
          location?: string | null;
          start_at: string;
          end_at: string;
          is_all_day?: boolean;
          rrule?: string | null;
          exdates?: string[] | null;
          source?: string;
          source_uid?: string | null;
          source_calendar?: string | null;
          raw_payload?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          location?: string | null;
          start_at?: string;
          end_at?: string;
          is_all_day?: boolean;
          rrule?: string | null;
          exdates?: string[] | null;
          source?: string;
          source_uid?: string | null;
          source_calendar?: string | null;
          raw_payload?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          id: number;
          owner_user_id: string | null;
          public_calendar_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          owner_user_id?: string | null;
          public_calendar_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          owner_user_id?: string | null;
          public_calendar_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
