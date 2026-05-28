import type { Database, UserRole } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type StudentCredits = Database["public"]["Tables"]["student_credits"]["Row"];

export type { UserRole, BookingStatus } from "@/types/database";

export type TeacherWithProfile = Teacher & {
  profile: Pick<Profile, "full_name" | "avatar_url" | "email">;
  subjects: Subject[];
};

export type TeacherListItem = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  experience: string | null;
  isVerified: boolean;
  offersOnline: boolean;
  offersInPerson: boolean;
  subjects: { id: string; name: string; slug: string }[];
};
