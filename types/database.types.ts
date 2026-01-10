export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string;
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
        };
        Insert: {
          id?: string;
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
        };
        Update: {
          id?: string;
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
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          color: string | null;
          category: string | null;
          subcategory: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          color?: string | null;
          category?: string | null;
          subcategory?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          color?: string | null;
          category?: string | null;
          subcategory?: string | null;
          created_at?: string;
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
