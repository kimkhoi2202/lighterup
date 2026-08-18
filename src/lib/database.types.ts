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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      availability_blackouts: {
        Row: {
          blackout_date: string
          created_at: string | null
          id: string
          is_all_day: boolean
          reason: string | null
          schedule_id: string
        }
        Insert: {
          blackout_date: string
          created_at?: string | null
          id?: string
          is_all_day?: boolean
          reason?: string | null
          schedule_id: string
        }
        Update: {
          blackout_date?: string
          created_at?: string | null
          id?: string
          is_all_day?: boolean
          reason?: string | null
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blackouts_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "availability_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_schedules: {
        Row: {
          contractor_id: string
          created_at: string | null
          id: string
          is_default: boolean
          name: string
          timezone: string
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          name: string
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          timezone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_schedules_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_windows: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          schedule_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          schedule_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          schedule_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_windows_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "availability_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          contractor_id: string
          created_at: string | null
          homeowner_id: string
          id: string
          job_id: string
          last_message_at: string | null
          updated_at: string | null
        }
        Insert: {
          contractor_id: string
          created_at?: string | null
          homeowner_id: string
          id?: string
          job_id: string
          last_message_at?: string | null
          updated_at?: string | null
        }
        Update: {
          contractor_id?: string
          created_at?: string | null
          homeowner_id?: string
          id?: string
          job_id?: string
          last_message_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          created_at: string | null
          file_name: string
          file_size_bytes: number | null
          id: string
          is_cover: boolean | null
          job_id: string
          mime_type: string | null
          storage_bucket: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          id?: string
          is_cover?: boolean | null
          job_id: string
          mime_type?: string | null
          storage_bucket?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          is_cover?: boolean | null
          job_id?: string
          mime_type?: string | null
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string
          areas: string[] | null
          assigned_at: string | null
          base_price_cents: number
          booker_email: string | null
          booker_name: string | null
          booker_notes: string | null
          booker_phone: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          city: string
          completed_at: string | null
          completed_date: string | null
          completion_requested_at: string | null
          complexity: string
          complexity_addon_cents: number
          contractor_id: string | null
          contractor_payout_cents: number
          created_at: string | null
          description: string
          distance_miles: number | null
          end_time: string | null
          estimated_length_feet: number
          google_calendar_event_id: string | null
          homeowner_id: string | null
          house_size: string | null
          id: string
          latitude: number | null
          lights_provided: boolean | null
          longitude: number | null
          meeting_location_details: string | null
          meeting_location_type: string | null
          num_stories: number
          options_addon_cents: number
          payment_status: string | null
          region_id: string | null
          requested_date_end: string | null
          requested_date_start: string | null
          scheduled_date: string | null
          start_time: string | null
          started_at: string | null
          state: string
          status: string
          storage_needed: boolean | null
          tip_amount_cents: number | null
          total_price_cents: number
          updated_at: string | null
          zip: string
        }
        Insert: {
          address: string
          areas?: string[] | null
          assigned_at?: string | null
          base_price_cents: number
          booker_email?: string | null
          booker_name?: string | null
          booker_notes?: string | null
          booker_phone?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          city?: string
          completed_at?: string | null
          completed_date?: string | null
          completion_requested_at?: string | null
          complexity: string
          complexity_addon_cents?: number
          contractor_id?: string | null
          contractor_payout_cents?: number
          created_at?: string | null
          description: string
          distance_miles?: number | null
          end_time?: string | null
          estimated_length_feet: number
          google_calendar_event_id?: string | null
          homeowner_id?: string | null
          house_size?: string | null
          id?: string
          latitude?: number | null
          lights_provided?: boolean | null
          longitude?: number | null
          meeting_location_details?: string | null
          meeting_location_type?: string | null
          num_stories?: number
          options_addon_cents?: number
          payment_status?: string | null
          region_id?: string | null
          requested_date_end?: string | null
          requested_date_start?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          started_at?: string | null
          state?: string
          status?: string
          storage_needed?: boolean | null
          tip_amount_cents?: number | null
          total_price_cents?: number
          updated_at?: string | null
          zip?: string
        }
        Update: {
          address?: string
          areas?: string[] | null
          assigned_at?: string | null
          base_price_cents?: number
          booker_email?: string | null
          booker_name?: string | null
          booker_notes?: string | null
          booker_phone?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          city?: string
          completed_at?: string | null
          completed_date?: string | null
          completion_requested_at?: string | null
          complexity?: string
          complexity_addon_cents?: number
          contractor_id?: string | null
          contractor_payout_cents?: number
          created_at?: string | null
          description?: string
          distance_miles?: number | null
          end_time?: string | null
          estimated_length_feet?: number
          google_calendar_event_id?: string | null
          homeowner_id?: string | null
          house_size?: string | null
          id?: string
          latitude?: number | null
          lights_provided?: boolean | null
          longitude?: number | null
          meeting_location_details?: string | null
          meeting_location_type?: string | null
          num_stories?: number
          options_addon_cents?: number
          payment_status?: string | null
          region_id?: string | null
          requested_date_end?: string | null
          requested_date_start?: string | null
          scheduled_date?: string | null
          start_time?: string | null
          started_at?: string | null
          state?: string
          status?: string
          storage_needed?: boolean | null
          tip_amount_cents?: number | null
          total_price_cents?: number
          updated_at?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean
          reactions: Json
          read_at: string | null
          reply_to_message_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean
          reactions?: Json
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean
          reactions?: Json
          read_at?: string | null
          reply_to_message_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          base_hourly_rate_cents: number | null
          bio: string | null
          buffer_after_minutes: number | null
          buffer_before_minutes: number | null
          business_email: string | null
          business_name: string | null
          created_at: string | null
          default_schedule_id: string | null
          event_type_currency: string | null
          event_type_description: string | null
          event_type_duration_minutes: number | null
          event_type_location_options: Json | null
          event_type_price_cents: number | null
          event_type_title: string | null
          facebook_url: string | null
          full_name: string | null
          future_booking_days: number | null
          google_calendar_access_token: string | null
          google_calendar_connected_at: string | null
          google_calendar_destination_id: string | null
          google_calendar_id: string | null
          google_calendar_last_sync: string | null
          google_calendar_refresh_token: string | null
          google_calendar_selected_ids: Json | null
          google_calendar_sync_token: string | null
          google_calendar_token_expires_at: string | null
          home_address: string | null
          home_city: string | null
          home_latitude: number | null
          home_longitude: number | null
          home_state: string | null
          home_zip: string | null
          id: string
          instagram_handle: string | null
          insurance_info: string | null
          is_active: boolean | null
          is_profile_public: boolean | null
          license_number: string | null
          max_jobs_per_week: number | null
          minimum_notice_hours: number | null
          onboarding_step: string | null
          phone: string | null
          profile_completed_at: string | null
          public_slug: string | null
          role: string
          service_base_address: string | null
          service_base_city: string | null
          service_base_latitude: number | null
          service_base_longitude: number | null
          service_base_state: string | null
          service_base_zip: string | null
          service_radius_miles: number | null
          slot_interval_minutes: number | null
          tagline: string | null
          updated_at: string | null
          website_url: string | null
          years_in_business: number | null
        }
        Insert: {
          avatar_url?: string | null
          base_hourly_rate_cents?: number | null
          bio?: string | null
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          business_email?: string | null
          business_name?: string | null
          created_at?: string | null
          default_schedule_id?: string | null
          event_type_currency?: string | null
          event_type_description?: string | null
          event_type_duration_minutes?: number | null
          event_type_location_options?: Json | null
          event_type_price_cents?: number | null
          event_type_title?: string | null
          facebook_url?: string | null
          full_name?: string | null
          future_booking_days?: number | null
          google_calendar_access_token?: string | null
          google_calendar_connected_at?: string | null
          google_calendar_destination_id?: string | null
          google_calendar_id?: string | null
          google_calendar_last_sync?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_selected_ids?: Json | null
          google_calendar_sync_token?: string | null
          google_calendar_token_expires_at?: string | null
          home_address?: string | null
          home_city?: string | null
          home_latitude?: number | null
          home_longitude?: number | null
          home_state?: string | null
          home_zip?: string | null
          id: string
          instagram_handle?: string | null
          insurance_info?: string | null
          is_active?: boolean | null
          is_profile_public?: boolean | null
          license_number?: string | null
          max_jobs_per_week?: number | null
          minimum_notice_hours?: number | null
          onboarding_step?: string | null
          phone?: string | null
          profile_completed_at?: string | null
          public_slug?: string | null
          role: string
          service_base_address?: string | null
          service_base_city?: string | null
          service_base_latitude?: number | null
          service_base_longitude?: number | null
          service_base_state?: string | null
          service_base_zip?: string | null
          service_radius_miles?: number | null
          slot_interval_minutes?: number | null
          tagline?: string | null
          updated_at?: string | null
          website_url?: string | null
          years_in_business?: number | null
        }
        Update: {
          avatar_url?: string | null
          base_hourly_rate_cents?: number | null
          bio?: string | null
          buffer_after_minutes?: number | null
          buffer_before_minutes?: number | null
          business_email?: string | null
          business_name?: string | null
          created_at?: string | null
          default_schedule_id?: string | null
          event_type_currency?: string | null
          event_type_description?: string | null
          event_type_duration_minutes?: number | null
          event_type_location_options?: Json | null
          event_type_price_cents?: number | null
          event_type_title?: string | null
          facebook_url?: string | null
          full_name?: string | null
          future_booking_days?: number | null
          google_calendar_access_token?: string | null
          google_calendar_connected_at?: string | null
          google_calendar_destination_id?: string | null
          google_calendar_id?: string | null
          google_calendar_last_sync?: string | null
          google_calendar_refresh_token?: string | null
          google_calendar_selected_ids?: Json | null
          google_calendar_sync_token?: string | null
          google_calendar_token_expires_at?: string | null
          home_address?: string | null
          home_city?: string | null
          home_latitude?: number | null
          home_longitude?: number | null
          home_state?: string | null
          home_zip?: string | null
          id?: string
          instagram_handle?: string | null
          insurance_info?: string | null
          is_active?: boolean | null
          is_profile_public?: boolean | null
          license_number?: string | null
          max_jobs_per_week?: number | null
          minimum_notice_hours?: number | null
          onboarding_step?: string | null
          phone?: string | null
          profile_completed_at?: string | null
          public_slug?: string | null
          role?: string
          service_base_address?: string | null
          service_base_city?: string | null
          service_base_latitude?: number | null
          service_base_longitude?: number | null
          service_base_state?: string | null
          service_base_zip?: string | null
          service_radius_miles?: number | null
          slot_interval_minutes?: number | null
          tagline?: string | null
          updated_at?: string | null
          website_url?: string | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_schedule_id_fkey"
            columns: ["default_schedule_id"]
            isOneToOne: false
            referencedRelation: "availability_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          complexity_complex_cents: number | null
          complexity_medium_cents: number | null
          complexity_simple_cents: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          labor_rate_per_foot_cents: number
          lights_provided_addon_cents: number | null
          name: string
          state: string
          storage_addon_cents: number | null
          updated_at: string | null
        }
        Insert: {
          complexity_complex_cents?: number | null
          complexity_medium_cents?: number | null
          complexity_simple_cents?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          labor_rate_per_foot_cents: number
          lights_provided_addon_cents?: number | null
          name: string
          state: string
          storage_addon_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          complexity_complex_cents?: number | null
          complexity_medium_cents?: number | null
          complexity_simple_cents?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          labor_rate_per_foot_cents?: number
          lights_provided_addon_cents?: number | null
          name?: string
          state?: string
          storage_addon_cents?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          id: string
          zip_code: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          zip_code?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mark_messages_as_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
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
    Enums: {},
  },
} as const
