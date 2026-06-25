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
      availability_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_booked: boolean
          is_recurring: boolean
          recurrence_rule: string | null
          start_time: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean
          is_recurring?: boolean
          recurrence_rule?: string | null
          start_time: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          is_recurring?: boolean
          recurrence_rule?: string | null
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_subjects: {
        Row: {
          booking_id: string
          subject_id: string
        }
        Insert: {
          booking_id: string
          subject_id: string
        }
        Update: {
          booking_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_subjects_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          credits_reserved: number
          end_time: string
          id: string
          meeting_link: string | null
          reminder_1h_sent_at: string | null
          reminder_24h_sent_at: string | null
          session_rating: string | null
          start_time: string
          status: string
          student_id: string
          student_revenue_chf: number | null
          subject_id: string | null
          teacher_id: string
          teacher_private_notes: string | null
          topic_note: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_reserved?: number
          end_time: string
          id?: string
          meeting_link?: string | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          session_rating?: string | null
          start_time: string
          status?: string
          student_id: string
          student_revenue_chf?: number | null
          subject_id?: string | null
          teacher_id: string
          teacher_private_notes?: string | null
          topic_note?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_reserved?: number
          end_time?: string
          id?: string
          meeting_link?: string | null
          reminder_1h_sent_at?: string | null
          reminder_24h_sent_at?: string | null
          session_rating?: string | null
          start_time?: string
          status?: string
          student_id?: string
          student_revenue_chf?: number | null
          subject_id?: string | null
          teacher_id?: string
          teacher_private_notes?: string | null
          topic_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packages: {
        Row: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          is_subscription: boolean
          name: string
          price_chf: number
          slug: string
          stripe_price_id: string | null
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          is_subscription?: boolean
          name: string
          price_chf: number
          slug: string
          stripe_price_id?: string | null
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          is_subscription?: boolean
          name?: string
          price_chf?: number
          slug?: string
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          lesson_id: string | null
          student_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          student_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          lesson_id?: string | null
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_wallets: {
        Row: {
          available_balance: number
          student_id: string
          updated_at: string
        }
        Insert: {
          available_balance?: number
          student_id: string
          updated_at?: string
        }
        Update: {
          available_balance?: number
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_wallets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          end_time: string
          id: string
          meet_link: string | null
          reschedule_proposed_end: string | null
          reschedule_proposed_start: string | null
          reschedule_requested_by: string | null
          schedule_id: string | null
          start_time: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          meet_link?: string | null
          reschedule_proposed_end?: string | null
          reschedule_proposed_start?: string | null
          reschedule_requested_by?: string | null
          schedule_id?: string | null
          start_time: string
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          meet_link?: string | null
          reschedule_proposed_end?: string | null
          reschedule_proposed_start?: string | null
          reschedule_requested_by?: string | null
          schedule_id?: string | null
          start_time?: string
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "recurring_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      level_promotion_requests: {
        Row: {
          created_at: string
          id: string
          note: string | null
          requested_level: string
          status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          requested_level: string
          status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          requested_level?: string
          status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_promotion_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          package_id: string | null
          status: string
          stripe_session_id: string | null
          stripe_subscription_id: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          package_id?: string | null
          status?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          package_id?: string | null
          status?: string
          stripe_session_id?: string | null
          stripe_subscription_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "credit_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_requests: {
        Row: {
          amount_chf: number
          created_at: string
          id: string
          note: string | null
          paid_at: string | null
          payout_type: string | null
          status: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          amount_chf: number
          created_at?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          payout_type?: string | null
          status?: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          amount_chf?: number
          created_at?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          payout_type?: string | null
          status?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_schedules: {
        Row: {
          created_at: string
          end_time: string
          id: string
          start_time: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "recurring_schedules_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          student_id: string
          teacher_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          student_id: string
          teacher_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      student_credits: {
        Row: {
          extra_credits: number
          id: string
          reserved_credits: number
          student_id: string
          subscription_credits: number
          total_credits: number
          updated_at: string
          used_credits: number
        }
        Insert: {
          extra_credits?: number
          id?: string
          reserved_credits?: number
          student_id: string
          subscription_credits?: number
          total_credits?: number
          updated_at?: string
          used_credits?: number
        }
        Update: {
          extra_credits?: number
          id?: string
          reserved_credits?: number
          student_id?: string
          subscription_credits?: number
          total_credits?: number
          updated_at?: string
          used_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_credits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          id: string
          learning_goal: string | null
          notes: string | null
          preferred_language: string | null
          preferred_modality: string | null
          preferred_subject_id: string | null
          profile_id: string
          school_level: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          learning_goal?: string | null
          notes?: string | null
          preferred_language?: string | null
          preferred_modality?: string | null
          preferred_subject_id?: string | null
          profile_id: string
          school_level?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          learning_goal?: string | null
          notes?: string | null
          preferred_language?: string | null
          preferred_modality?: string | null
          preferred_subject_id?: string | null
          profile_id?: string
          school_level?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_preferred_subject_id_fkey"
            columns: ["preferred_subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_coming_soon: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_coming_soon?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_coming_soon?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      teacher_availability_blockers: {
        Row: {
          blocked_date: string
          created_at: string | null
          end_time: string | null
          id: string
          start_time: string | null
          teacher_id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          start_time?: string | null
          teacher_id: string
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          start_time?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_blockers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availability_ranges: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_ranges_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_earnings: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          id: string
          payout_request_id: string | null
          status: string
          teacher_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          id?: string
          payout_request_id?: string | null
          status?: string
          teacher_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          id?: string
          payout_request_id?: string | null
          status?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_earnings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_earnings_payout_request_id_fkey"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "payout_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_earnings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          subject_id: string
          teacher_id: string
        }
        Insert: {
          subject_id: string
          teacher_id: string
        }
        Update: {
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_unavailable_dates: {
        Row: {
          id: string
          teacher_id: string
          unavailable_date: string
        }
        Insert: {
          id?: string
          teacher_id: string
          unavailable_date: string
        }
        Update: {
          id?: string
          teacher_id?: string
          unavailable_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_unavailable_dates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          default_meet_link: string | null
          education: string | null
          experience: string | null
          id: string
          is_active: boolean
          is_approved: boolean
          is_verified: boolean
          languages: string[] | null
          location: string | null
          offers_in_person: boolean
          offers_online: boolean
          payout_info_placeholder: string | null
          payout_rate: number
          profile_id: string
          teacher_level: string
          teaching_style: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          default_meet_link?: string | null
          education?: string | null
          experience?: string | null
          id?: string
          is_active?: boolean
          is_approved?: boolean
          is_verified?: boolean
          languages?: string[] | null
          location?: string | null
          offers_in_person?: boolean
          offers_online?: boolean
          payout_info_placeholder?: string | null
          payout_rate?: number
          profile_id: string
          teacher_level?: string
          teaching_style?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          default_meet_link?: string | null
          education?: string | null
          experience?: string | null
          id?: string
          is_active?: boolean
          is_approved?: boolean
          is_verified?: boolean
          languages?: string[] | null
          location?: string | null
          offers_in_person?: boolean
          offers_online?: boolean
          payout_info_placeholder?: string | null
          payout_rate?: number
          profile_id?: string
          teacher_level?: string
          teaching_style?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_reschedule: { Args: { p_lesson_id: string }; Returns: string }
      auth_is_admin: { Args: never; Returns: boolean }
      auth_profile_id: { Args: never; Returns: string }
      auth_student_id: { Args: never; Returns: string }
      auth_teacher_id: { Args: never; Returns: string }
      cancel_booking: { Args: { p_booking_id: string }; Returns: undefined }
      complete_booking:
        | { Args: { p_booking_id: string }; Returns: undefined }
        | {
            Args: {
              p_booking_id: string
              p_session_rating?: string
              p_teacher_notes?: string
            }
            Returns: undefined
          }
      complete_lesson: { Args: { p_lesson_id: string }; Returns: undefined }
      create_booking:
        | {
            Args: {
              p_credits_to_reserve: number
              p_end_time: string
              p_start_time: string
              p_student_id: string
              p_subject_id: string
              p_teacher_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_credits_to_reserve: number
              p_end_time: string
              p_start_time: string
              p_student_id: string
              p_subject_id: string
              p_teacher_id: string
              p_topic_note?: string
            }
            Returns: string
          }
      grant_credits: {
        Args: { p_credits: number; p_student_id: string }
        Returns: undefined
      }
      grant_subscription_credits: {
        Args: { p_credits: number; p_student_id: string }
        Returns: undefined
      }
      reject_reschedule: { Args: { p_lesson_id: string }; Returns: undefined }
      student_available_credits:
        | { Args: never; Returns: number }
        | { Args: { p_student_id: string }; Returns: number }
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
