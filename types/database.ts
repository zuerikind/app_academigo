export type UserRole = "student" | "teacher" | "admin";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "completed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: UserRole;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      students: {
        Row: {
          id: string;
          profile_id: string;
          school_level: string | null;
          learning_goal: string | null;
          preferred_language: string | null;
          preferred_modality: "online" | "in_person" | "both" | null;
          preferred_subject_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          school_level?: string | null;
          learning_goal?: string | null;
          preferred_language?: string | null;
          preferred_modality?: "online" | "in_person" | "both" | null;
          preferred_subject_id?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      teachers: {
        Row: {
          id: string;
          profile_id: string;
          bio: string | null;
          education: string | null;
          experience: string | null;
          teaching_style: string | null;
          is_verified: boolean;
          is_approved: boolean;
          is_active: boolean;
          teacher_level: 'junior' | 'academigo_teacher' | 'verified';
          payout_rate: number;
          location: string | null;
          languages: string[];
          offers_online: boolean;
          offers_in_person: boolean;
          payout_info_placeholder: string | null;
          default_meet_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          bio?: string | null;
          education?: string | null;
          experience?: string | null;
          teaching_style?: string | null;
          is_verified?: boolean;
          is_approved?: boolean;
          is_active?: boolean;
          teacher_level?: 'junior' | 'academigo_teacher' | 'verified';
          payout_rate?: number;
          location?: string | null;
          languages?: string[];
          offers_online?: boolean;
          offers_in_person?: boolean;
          payout_info_placeholder?: string | null;
          default_meet_link?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["teachers"]["Insert"]>;
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          is_coming_soon: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          is_coming_soon?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Insert"]>;
      };
      teacher_subjects: {
        Row: { teacher_id: string; subject_id: string };
        Insert: { teacher_id: string; subject_id: string };
        Update: Partial<Database["public"]["Tables"]["teacher_subjects"]["Insert"]>;
      };
      student_credits: {
        Row: {
          id: string;
          student_id: string;
          total_credits: number;
          used_credits: number;
          reserved_credits: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          total_credits?: number;
          used_credits?: number;
          reserved_credits?: number;
        };
        Update: Partial<Database["public"]["Tables"]["student_credits"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          subject_id: string | null;
          start_time: string;
          end_time: string;
          status: BookingStatus;
          credits_reserved: number;
          meeting_link: string | null;
          topic_note: string | null;
          reminder_24h_sent_at: string | null;
          reminder_1h_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          subject_id?: string | null;
          start_time: string;
          end_time: string;
          status?: BookingStatus;
          credits_reserved?: number;
          meeting_link?: string | null;
          topic_note?: string | null;
          reminder_24h_sent_at?: string | null;
          reminder_1h_sent_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      teacher_availability_ranges: {
        Row: {
          id: string;
          teacher_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_availability_ranges_teacher_id_fkey";
            columns: ["teacher_id"];
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          }
        ];
      };
      teacher_availability_blockers: {
        Row: {
          id: string;
          teacher_id: string;
          blocked_date: string;
          start_time: string | null;
          end_time: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          blocked_date: string;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          blocked_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_availability_blockers_teacher_id_fkey";
            columns: ["teacher_id"];
            referencedRelation: "teachers";
            referencedColumns: ["id"];
          }
        ];
      };
      credit_packages: {
        Row: {
          id: string;
          slug: string;
          name: string;
          credits: number;
          price_chf: number;
          is_active: boolean;
          is_subscription: boolean;
          stripe_price_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          credits: number;
          price_chf: number;
          is_active?: boolean;
          is_subscription?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["credit_packages"]["Insert"]>;
      };
      level_promotion_requests: {
        Row: {
          id: string;
          teacher_id: string;
          requested_level: 'academigo_teacher' | 'verified';
          status: 'pending' | 'approved' | 'rejected';
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          requested_level: 'academigo_teacher' | 'verified';
          status?: 'pending' | 'approved' | 'rejected';
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["level_promotion_requests"]["Insert"]>;
      };
      payout_requests: {
        Row: {
          id: string;
          teacher_id: string;
          amount_chf: number;
          status: 'pending' | 'processed';
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          amount_chf: number;
          status?: 'pending' | 'processed';
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payout_requests"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      student_available_credits: {
        Args: { p_student_id: string };
        Returns: number;
      };
      create_booking: {
        Args: {
          p_student_id: string;
          p_teacher_id: string;
          p_subject_id: string;
          p_start_time: string;
          p_end_time: string;
          p_credits_to_reserve: number;
          p_topic_note?: string;
        };
        Returns: string;
      };
      complete_booking: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      cancel_booking: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      grant_credits: {
        Args: { p_student_id: string; p_credits: number };
        Returns: undefined;
      };
      grant_subscription_credits: {
        Args: { p_student_id: string; p_credits: number };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
};
