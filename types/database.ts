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
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
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
    };
    Views: Record<string, never>;
    Functions: {
      student_available_credits: {
        Args: { p_student_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
  };
};
