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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aliases: {
        Row: {
          birth_day: number
          birth_month: number
          birth_year: number
          created_at: string
          creature: string
          display_name: string
          emoji: string
          emotion: string
          nation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_day: number
          birth_month: number
          birth_year: number
          created_at?: string
          creature: string
          display_name: string
          emoji: string
          emotion: string
          nation: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_day?: number
          birth_month?: number
          birth_year?: number
          created_at?: string
          creature?: string
          display_name?: string
          emoji?: string
          emotion?: string
          nation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checkin_responses: {
        Row: {
          alias_id: string
          checkin_id: string
          clean_text: string | null
          created_at: string
          id: string
          rescan: number | null
          resolution: Database["public"]["Enums"]["situation_status"] | null
          situation_id: string
          trajectory: Database["public"]["Enums"]["trajectory"] | null
          would_again: string | null
        }
        Insert: {
          alias_id: string
          checkin_id: string
          clean_text?: string | null
          created_at?: string
          id?: string
          rescan?: number | null
          resolution?: Database["public"]["Enums"]["situation_status"] | null
          situation_id: string
          trajectory?: Database["public"]["Enums"]["trajectory"] | null
          would_again?: string | null
        }
        Update: {
          alias_id?: string
          checkin_id?: string
          clean_text?: string | null
          created_at?: string
          id?: string
          rescan?: number | null
          resolution?: Database["public"]["Enums"]["situation_status"] | null
          situation_id?: string
          trajectory?: Database["public"]["Enums"]["trajectory"] | null
          would_again?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_responses_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_responses_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          alias_id: string
          channel: string
          created_at: string
          id: string
          opened_at: string | null
          responded_at: string | null
          scheduled_at: string
          sent_at: string | null
          situation_id: string
          state: Database["public"]["Enums"]["checkin_state"]
          type: Database["public"]["Enums"]["checkin_type"]
        }
        Insert: {
          alias_id: string
          channel?: string
          created_at?: string
          id?: string
          opened_at?: string | null
          responded_at?: string | null
          scheduled_at: string
          sent_at?: string | null
          situation_id: string
          state?: Database["public"]["Enums"]["checkin_state"]
          type: Database["public"]["Enums"]["checkin_type"]
        }
        Update: {
          alias_id?: string
          channel?: string
          created_at?: string
          id?: string
          opened_at?: string | null
          responded_at?: string | null
          scheduled_at?: string
          sent_at?: string | null
          situation_id?: string
          state?: Database["public"]["Enums"]["checkin_state"]
          type?: Database["public"]["Enums"]["checkin_type"]
        }
        Relationships: [
          {
            foreignKeyName: "checkins_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_events: {
        Row: {
          alias_id: string | null
          category: string
          created_at: string
          id: string
          resources_shown: boolean
          severity: string
          situation_id: string | null
        }
        Insert: {
          alias_id?: string | null
          category: string
          created_at?: string
          id?: string
          resources_shown?: boolean
          severity: string
          situation_id?: string | null
        }
        Update: {
          alias_id?: string | null
          category?: string
          created_at?: string
          id?: string
          resources_shown?: boolean
          severity?: string
          situation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crisis_events_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_events: {
        Row: {
          alias: string | null
          created_at: string
          id: string
          intent: string | null
          kind: string | null
          label: string | null
          mode: string | null
          note: string | null
          page: string | null
          payload: Json | null
          score: number | null
          sec: number | null
          sid: string | null
          signature: string | null
          t: string
          target: string | null
          text: string | null
          trigger: string | null
          type: string
          v: string
        }
        Insert: {
          alias?: string | null
          created_at?: string
          id?: string
          intent?: string | null
          kind?: string | null
          label?: string | null
          mode?: string | null
          note?: string | null
          page?: string | null
          payload?: Json | null
          score?: number | null
          sec?: number | null
          sid?: string | null
          signature?: string | null
          t?: string
          target?: string | null
          text?: string | null
          trigger?: string | null
          type: string
          v: string
        }
        Update: {
          alias?: string | null
          created_at?: string
          id?: string
          intent?: string | null
          kind?: string | null
          label?: string | null
          mode?: string | null
          note?: string | null
          page?: string | null
          payload?: Json | null
          score?: number | null
          sec?: number | null
          sid?: string | null
          signature?: string | null
          t?: string
          target?: string | null
          text?: string | null
          trigger?: string | null
          type?: string
          v?: string
        }
        Relationships: []
      }
      mirror_onboarding: {
        Row: {
          created_at: string
          onboarded_at: string
          source: string
          updated_at: string
          user_id: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          created_at?: string
          onboarded_at?: string
          source?: string
          updated_at?: string
          user_id: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          created_at?: string
          onboarded_at?: string
          source?: string
          updated_at?: string
          user_id?: string
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      outcomes: {
        Row: {
          alias_id: string
          captured_at: string
          decision_summary: string
          id: string
          resolution: Database["public"]["Enums"]["situation_status"]
          situation_id: string
          trajectory_curve: Json
          would_again: string | null
        }
        Insert: {
          alias_id: string
          captured_at?: string
          decision_summary: string
          id?: string
          resolution: Database["public"]["Enums"]["situation_status"]
          situation_id: string
          trajectory_curve?: Json
          would_again?: string | null
        }
        Update: {
          alias_id?: string
          captured_at?: string
          decision_summary?: string
          id?: string
          resolution?: Database["public"]["Enums"]["situation_status"]
          situation_id?: string
          trajectory_curve?: Json
          would_again?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcomes_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: true
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_scrub_log: {
        Row: {
          alias_id: string | null
          count: number
          created_at: string
          detected_type: string
          id: number
          replacement_token: string
          situation_id: string | null
        }
        Insert: {
          alias_id?: string | null
          count?: number
          created_at?: string
          detected_type: string
          id?: number
          replacement_token: string
          situation_id?: string | null
        }
        Update: {
          alias_id?: string | null
          count?: number
          created_at?: string
          detected_type?: string
          id?: number
          replacement_token?: string
          situation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pii_scrub_log_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "situations"
            referencedColumns: ["id"]
          },
        ]
      }
      room_reactions: {
        Row: {
          created_at: string
          kind: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          kind: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          kind?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_reactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_relates: {
        Row: {
          created_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_relates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          alias: string
          author_id: string
          body: string
          created_at: string
          emoji: string
          hall: string
          id: string
          reflection: string | null
          support: string
          title: string
          updated_at: string
        }
        Insert: {
          alias: string
          author_id: string
          body: string
          created_at?: string
          emoji: string
          hall: string
          id?: string
          reflection?: string | null
          support: string
          title: string
          updated_at?: string
        }
        Update: {
          alias?: string
          author_id?: string
          body?: string
          created_at?: string
          emoji?: string
          hall?: string
          id?: string
          reflection?: string | null
          support?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      situations: {
        Row: {
          alias_id: string
          clean_text: string
          created_at: string
          crisis_flag: boolean
          id: string
          initial_scan: number | null
          is_public: boolean
          pillar: Database["public"]["Enums"]["situation_pillar"]
          reflection: string | null
          room_id: string | null
          scan_band: Database["public"]["Enums"]["scan_band"] | null
          status: Database["public"]["Enums"]["situation_status"]
          tags: string[]
          updated_at: string
        }
        Insert: {
          alias_id: string
          clean_text: string
          created_at?: string
          crisis_flag?: boolean
          id?: string
          initial_scan?: number | null
          is_public?: boolean
          pillar: Database["public"]["Enums"]["situation_pillar"]
          reflection?: string | null
          room_id?: string | null
          scan_band?: Database["public"]["Enums"]["scan_band"] | null
          status?: Database["public"]["Enums"]["situation_status"]
          tags?: string[]
          updated_at?: string
        }
        Update: {
          alias_id?: string
          clean_text?: string
          created_at?: string
          crisis_flag?: boolean
          id?: string
          initial_scan?: number | null
          is_public?: boolean
          pillar?: Database["public"]["Enums"]["situation_pillar"]
          reflection?: string | null
          room_id?: string | null
          scan_band?: Database["public"]["Enums"]["scan_band"] | null
          status?: Database["public"]["Enums"]["situation_status"]
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "situations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_patterns: {
        Row: {
          alias_id: string
          id: string
          support: number
          tendency: string
          trigger: string
          updated_at: string
          what_helps: string | null
        }
        Insert: {
          alias_id: string
          id?: string
          support?: number
          tendency: string
          trigger: string
          updated_at?: string
          what_helps?: string | null
        }
        Update: {
          alias_id?: string
          id?: string
          support?: number
          tendency?: string
          trigger?: string
          updated_at?: string
          what_helps?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_mirror: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      checkin_state:
        | "scheduled"
        | "sent"
        | "opened"
        | "responded"
        | "suppressed"
        | "snoozed"
        | "muted"
      checkin_type:
        | "day0"
        | "day1"
        | "day2"
        | "day3"
        | "day7"
        | "day14"
        | "adaptive30"
      scan_band: "quiet" | "real" | "hot" | "heavy" | "serious"
      situation_pillar: "relationships" | "marriage" | "family" | "career"
      situation_status: "in_progress" | "resolved" | "avoided" | "worse"
      trajectory: "better" | "same" | "worse"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      checkin_state: [
        "scheduled",
        "sent",
        "opened",
        "responded",
        "suppressed",
        "snoozed",
        "muted",
      ],
      checkin_type: [
        "day0",
        "day1",
        "day2",
        "day3",
        "day7",
        "day14",
        "adaptive30",
      ],
      scan_band: ["quiet", "real", "hot", "heavy", "serious"],
      situation_pillar: ["relationships", "marriage", "family", "career"],
      situation_status: ["in_progress", "resolved", "avoided", "worse"],
      trajectory: ["better", "same", "worse"],
    },
  },
} as const
