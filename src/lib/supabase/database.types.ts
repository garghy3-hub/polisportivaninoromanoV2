// Generated from the Supabase project schema. Do not edit by hand.
// Regenerate after every database migration.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      club_profile: {
        Row: {
          content: Json
          id: string
          is_published: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          is_published?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          is_published?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      editorial_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          entity_id: string | null
          entity_type: string
          id: number
          occurred_at: string
          summary: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          entity_id?: string | null
          entity_type: string
          id?: never
          occurred_at?: string
          summary?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: never
          occurred_at?: string
          summary?: Json
        }
        Relationships: []
      }
      events: {
        Row: {
          away_score: number | null
          away_team: string
          competition: string | null
          created_at: string
          created_by: string | null
          display_order: number
          event_type: string
          home_score: number | null
          home_team: string
          id: string
          is_published: boolean
          notes: string | null
          round_label: string | null
          season_id: string | null
          starts_at: string
          status: string
          updated_at: string
          updated_by: string | null
          venue: string | null
        }
        Insert: {
          away_score?: number | null
          away_team: string
          competition?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_type?: string
          home_score?: number | null
          home_team: string
          id?: string
          is_published?: boolean
          notes?: string | null
          round_label?: string | null
          season_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
        }
        Update: {
          away_score?: number | null
          away_team?: string
          competition?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_type?: string
          home_score?: number | null
          home_team?: string
          id?: string
          is_published?: boolean
          notes?: string | null
          round_label?: string | null
          season_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string
          bucket_id: string
          caption: string | null
          file_name: string
          id: string
          is_decorative: boolean
          is_public: boolean
          mime_type: string
          size_bytes: number
          storage_key: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string
          bucket_id?: string
          caption?: string | null
          file_name: string
          id?: string
          is_decorative?: boolean
          is_public?: boolean
          mime_type: string
          size_bytes: number
          storage_key: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string
          bucket_id?: string
          caption?: string | null
          file_name?: string
          id?: string
          is_decorative?: boolean
          is_public?: boolean
          mime_type?: string
          size_bytes?: number
          storage_key?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          created_at: string
          created_by: string | null
          current_revision_id: string | null
          id: string
          published_at: string | null
          published_revision_id: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_revision_id?: string | null
          id?: string
          published_at?: string | null
          published_revision_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_revision_id?: string | null
          id?: string
          published_at?: string | null
          published_revision_id?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_current_revision_fk"
            columns: ["current_revision_id"]
            isOneToOne: false
            referencedRelation: "news_public_articles"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "news_articles_current_revision_fk"
            columns: ["current_revision_id"]
            isOneToOne: false
            referencedRelation: "news_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_articles_published_revision_fk"
            columns: ["published_revision_id"]
            isOneToOne: false
            referencedRelation: "news_public_articles"
            referencedColumns: ["revision_id"]
          },
          {
            foreignKeyName: "news_articles_published_revision_fk"
            columns: ["published_revision_id"]
            isOneToOne: false
            referencedRelation: "news_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      news_revisions: {
        Row: {
          article_id: string
          body: string
          category: string
          created_at: string
          created_by: string
          excerpt: string
          id: string
          image_alt: string
          image_asset_id: string | null
          image_url: string | null
          published_at: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          submitted_at: string | null
          title: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          article_id: string
          body: string
          category: string
          created_at?: string
          created_by: string
          excerpt: string
          id?: string
          image_alt?: string
          image_asset_id?: string | null
          image_url?: string | null
          published_at?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          submitted_at?: string | null
          title: string
          updated_at?: string
          updated_by: string
          version: number
        }
        Update: {
          article_id?: string
          body?: string
          category?: string
          created_at?: string
          created_by?: string
          excerpt?: string
          id?: string
          image_alt?: string
          image_asset_id?: string | null
          image_url?: string | null
          published_at?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          submitted_at?: string | null
          title?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_revisions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_revisions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_public_articles"
            referencedColumns: ["article_id"]
          },
          {
            foreignKeyName: "news_revisions_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_current: boolean
          is_published: boolean
          label: string
          starts_on: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_current?: boolean
          is_published?: boolean
          label: string
          starts_on: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_current?: boolean
          is_published?: boolean
          label?: string
          starts_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          content: Json
          id: string
          is_published: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          is_published?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          is_published?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          biography: string | null
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          jersey_number: number | null
          name: string
          photo_asset_id: string | null
          position: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          biography?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          jersey_number?: number | null
          name: string
          photo_asset_id?: string | null
          position?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          biography?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          jersey_number?: number | null
          name?: string
          photo_asset_id?: string | null
          position?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_photo_asset_id_fkey"
            columns: ["photo_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_staff: {
        Row: {
          biography: string | null
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          name: string
          photo_asset_id: string | null
          role_label: string
          team_id: string
          updated_at: string
        }
        Insert: {
          biography?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          name: string
          photo_asset_id?: string | null
          role_label: string
          team_id: string
          updated_at?: string
        }
        Update: {
          biography?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          name?: string
          photo_asset_id?: string | null
          role_label?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_staff_photo_asset_id_fkey"
            columns: ["photo_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_staff_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          editorial_status: string
          is_published: boolean
          logo_asset_id: string | null
          name: string
          season_id: string | null
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          editorial_status?: string
          is_published?: boolean
          logo_asset_id?: string | null
          name: string
          season_id?: string | null
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          editorial_status?: string
          is_published?: boolean
          logo_asset_id?: string | null
          name?: string
          season_id?: string | null
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_logo_asset_id_fkey"
            columns: ["logo_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      news_public_articles: {
        Row: {
          article_id: string | null
          body: string | null
          category: string | null
          excerpt: string | null
          image_alt: string | null
          image_url: string | null
          published_at: string | null
          revision_id: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      team_editorial_command: {
        Args: {
          p_action: string
          p_expected_updated_at?: string | null
          p_payload?: Json
          p_team_id?: string | null
        }
        Returns: Json
      }
      team_editorial_workflow_command: {
        Args: {
          p_action: string
          p_expected_updated_at?: string | null
          p_payload?: Json
          p_team_id?: string | null
        }
        Returns: Json
      }
      news_editorial_command: {
        Args: {
          p_action: string
          p_article_id?: string
          p_expected_version?: number
          p_payload?: Json
          p_revision_id?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
