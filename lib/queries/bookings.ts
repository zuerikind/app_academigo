import { createClient } from "@/lib/supabase/server";

export type BookingSubject = { id: string; name: string; slug: string };

export type BookingWithRelations = {
  id: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  topic_note: string | null;
  credits_reserved: number;
  reminder_24h_sent_at: string | null;
  reminder_1h_sent_at: string | null;
  teacher?: { id: string; profiles: { full_name: string; avatar_url: string | null } };
  student?: { id: string; profiles: { full_name: string; avatar_url: string | null } };
  review?: { id: string; rating: number; comment: string | null } | null;
  subjects: BookingSubject[];
};

export async function getStudentBookings(studentId: string): Promise<BookingWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, status, start_time, end_time, meeting_link, topic_note,
      credits_reserved, reminder_24h_sent_at, reminder_1h_sent_at,
      teachers ( id, profiles ( full_name, avatar_url ) ),
      reviews ( id, rating, comment ),
      booking_subjects ( subjects ( id, name, slug ) )
    `)
    .eq("student_id", studentId)
    .order("start_time", { ascending: false });

  if (error || !data) return [];

  return data.map((b: any) => ({
    id: b.id,
    status: b.status,
    start_time: b.start_time,
    end_time: b.end_time,
    meeting_link: b.meeting_link,
    topic_note: b.topic_note,
    credits_reserved: b.credits_reserved,
    reminder_24h_sent_at: b.reminder_24h_sent_at,
    reminder_1h_sent_at: b.reminder_1h_sent_at,
    teacher: b.teachers
      ? {
          id: b.teachers.id,
          profiles: {
            full_name: Array.isArray(b.teachers.profiles)
              ? b.teachers.profiles[0]?.full_name ?? ""
              : b.teachers.profiles?.full_name ?? "",
            avatar_url: Array.isArray(b.teachers.profiles)
              ? b.teachers.profiles[0]?.avatar_url ?? null
              : b.teachers.profiles?.avatar_url ?? null,
          },
        }
      : undefined,
    review: b.reviews
      ? Array.isArray(b.reviews)
        ? b.reviews[0] ?? null
        : b.reviews
      : null,
    subjects: (Array.isArray(b.booking_subjects) ? b.booking_subjects : [])
      .map((bs: any) => bs.subjects)
      .filter(Boolean),
  }));
}

export async function getTeacherBookings(teacherId: string): Promise<BookingWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, status, start_time, end_time, meeting_link, topic_note,
      credits_reserved, reminder_24h_sent_at, reminder_1h_sent_at,
      students ( id, profiles ( full_name, avatar_url ) ),
      booking_subjects ( subjects ( id, name, slug ) )
    `)
    .eq("teacher_id", teacherId)
    .order("start_time", { ascending: true });

  if (error || !data) return [];

  return data.map((b: any) => ({
    id: b.id,
    status: b.status,
    start_time: b.start_time,
    end_time: b.end_time,
    meeting_link: b.meeting_link,
    topic_note: b.topic_note,
    credits_reserved: b.credits_reserved,
    reminder_24h_sent_at: b.reminder_24h_sent_at,
    reminder_1h_sent_at: b.reminder_1h_sent_at,
    student: b.students
      ? {
          id: b.students.id,
          profiles: {
            full_name: Array.isArray(b.students.profiles)
              ? b.students.profiles[0]?.full_name ?? ""
              : b.students.profiles?.full_name ?? "",
            avatar_url: Array.isArray(b.students.profiles)
              ? b.students.profiles[0]?.avatar_url ?? null
              : b.students.profiles?.avatar_url ?? null,
          },
        }
      : undefined,
    subjects: (Array.isArray(b.booking_subjects) ? b.booking_subjects : [])
      .map((bs: any) => bs.subjects)
      .filter(Boolean),
  }));
}

export async function getBookingById(bookingId: string): Promise<BookingWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, status, start_time, end_time, meeting_link, topic_note,
      credits_reserved, reminder_24h_sent_at, reminder_1h_sent_at,
      teachers ( id, profiles ( full_name, avatar_url ) ),
      students ( id, profiles ( full_name, avatar_url ) ),
      reviews ( id, rating, comment ),
      booking_subjects ( subjects ( id, name, slug ) )
    `)
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) return null;

  const b: any = data;
  return {
    id: b.id,
    status: b.status,
    start_time: b.start_time,
    end_time: b.end_time,
    meeting_link: b.meeting_link,
    topic_note: b.topic_note,
    credits_reserved: b.credits_reserved,
    reminder_24h_sent_at: b.reminder_24h_sent_at,
    reminder_1h_sent_at: b.reminder_1h_sent_at,
    teacher: b.teachers
      ? {
          id: b.teachers.id,
          profiles: {
            full_name: Array.isArray(b.teachers.profiles)
              ? b.teachers.profiles[0]?.full_name ?? ""
              : b.teachers.profiles?.full_name ?? "",
            avatar_url: Array.isArray(b.teachers.profiles)
              ? b.teachers.profiles[0]?.avatar_url ?? null
              : b.teachers.profiles?.avatar_url ?? null,
          },
        }
      : undefined,
    student: b.students
      ? {
          id: b.students.id,
          profiles: {
            full_name: Array.isArray(b.students.profiles)
              ? b.students.profiles[0]?.full_name ?? ""
              : b.students.profiles?.full_name ?? "",
            avatar_url: Array.isArray(b.students.profiles)
              ? b.students.profiles[0]?.avatar_url ?? null
              : b.students.profiles?.avatar_url ?? null,
          },
        }
      : undefined,
    review: b.reviews
      ? Array.isArray(b.reviews)
        ? b.reviews[0] ?? null
        : b.reviews
      : null,
    subjects: (Array.isArray(b.booking_subjects) ? b.booking_subjects : [])
      .map((bs: any) => bs.subjects)
      .filter(Boolean),
  };
}
