"use server";

import { createClient } from "@/lib/supabase/server";

export interface LessonWithRelations {
  id: string;
  student_id: string;
  teacher_id: string;
  schedule_id: string | null;
  start_time: string;
  end_time: string;
  meet_link: string | null;
  status: "confirmed" | "completed" | "cancelled" | "reschedule_requested" | "no_show";
  reschedule_proposed_start: string | null;
  reschedule_proposed_end: string | null;
  reschedule_requested_by: string | null;
  created_at: string;
  updated_at: string;
  other_party_name?: string;
}

export interface ActiveStudent {
  studentId: string;
  studentName: string;
  availableCredits: number;
}

export interface RecurringScheduleWithStudent {
  id: string;
  student_id: string;
  teacher_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  studentName?: string;
  teacherName?: string;
}

export async function getStudentUpcomingLessons(studentId: string): Promise<LessonWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id, student_id, teacher_id, schedule_id, start_time, end_time,
      meet_link, status, reschedule_proposed_start, reschedule_proposed_end,
      reschedule_requested_by, created_at, updated_at,
      teachers ( id, profiles ( full_name ) )
    `)
    .eq("student_id", studentId)
    .in("status", ["confirmed", "reschedule_requested"])
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((l) => ({
    id: l.id,
    student_id: l.student_id,
    teacher_id: l.teacher_id,
    schedule_id: l.schedule_id,
    start_time: l.start_time,
    end_time: l.end_time,
    meet_link: l.meet_link,
    status: l.status,
    reschedule_proposed_start: l.reschedule_proposed_start,
    reschedule_proposed_end: l.reschedule_proposed_end,
    reschedule_requested_by: l.reschedule_requested_by,
    created_at: l.created_at,
    updated_at: l.updated_at,
    other_party_name: l.teachers
      ? Array.isArray(l.teachers.profiles)
        ? l.teachers.profiles[0]?.full_name ?? ""
        : l.teachers.profiles?.full_name ?? ""
      : undefined,
  }));
}

export async function getTeacherUpcomingLessons(teacherId: string): Promise<LessonWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id, student_id, teacher_id, schedule_id, start_time, end_time,
      meet_link, status, reschedule_proposed_start, reschedule_proposed_end,
      reschedule_requested_by, created_at, updated_at,
      students ( id, profiles ( full_name ) )
    `)
    .eq("teacher_id", teacherId)
    .in("status", ["confirmed", "reschedule_requested"])
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((l) => ({
    id: l.id,
    student_id: l.student_id,
    teacher_id: l.teacher_id,
    schedule_id: l.schedule_id,
    start_time: l.start_time,
    end_time: l.end_time,
    meet_link: l.meet_link,
    status: l.status,
    reschedule_proposed_start: l.reschedule_proposed_start,
    reschedule_proposed_end: l.reschedule_proposed_end,
    reschedule_requested_by: l.reschedule_requested_by,
    created_at: l.created_at,
    updated_at: l.updated_at,
    other_party_name: l.students
      ? Array.isArray(l.students.profiles)
        ? l.students.profiles[0]?.full_name ?? ""
        : l.students.profiles?.full_name ?? ""
      : undefined,
  }));
}

export async function getTeacherActiveStudents(teacherId: string): Promise<ActiveStudent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_schedules")
    .select(`
      student_id,
      students ( id, profiles ( full_name ), credit_wallets ( available_balance ) )
    `)
    .eq("teacher_id", teacherId)
    .eq("status", "active");

  if (error || !data) return [];

  // Deduplicate by student_id
  const seen = new Set<string>();
  const result: ActiveStudent[] = [];

  for (const row of data as any[]) {
    if (seen.has(row.student_id)) continue;
    seen.add(row.student_id);

    const studentData = row.students;
    const profileName = Array.isArray(studentData?.profiles)
      ? studentData.profiles[0]?.full_name ?? ""
      : studentData?.profiles?.full_name ?? "";

    const walletEntry = Array.isArray(studentData?.credit_wallets)
      ? studentData.credit_wallets[0]
      : studentData?.credit_wallets;

    result.push({
      studentId: row.student_id,
      studentName: profileName,
      availableCredits: walletEntry?.available_balance ?? 0,
    });
  }

  return result;
}

export async function getTeacherSchedules(teacherId: string): Promise<RecurringScheduleWithStudent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_schedules")
    .select(`
      id, student_id, teacher_id, weekday, start_time, end_time, status, created_at, updated_at,
      students ( id, profiles ( full_name ) )
    `)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((s) => ({
    id: s.id,
    student_id: s.student_id,
    teacher_id: s.teacher_id,
    weekday: s.weekday,
    start_time: s.start_time,
    end_time: s.end_time,
    status: s.status,
    created_at: s.created_at,
    updated_at: s.updated_at,
    studentName: s.students
      ? Array.isArray(s.students.profiles)
        ? s.students.profiles[0]?.full_name ?? ""
        : s.students.profiles?.full_name ?? ""
      : undefined,
  }));
}

export async function getStudentSchedules(studentId: string): Promise<RecurringScheduleWithStudent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_schedules")
    .select(`
      id, student_id, teacher_id, weekday, start_time, end_time, status, created_at, updated_at,
      teachers ( id, profiles ( full_name ) )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((s) => ({
    id: s.id,
    student_id: s.student_id,
    teacher_id: s.teacher_id,
    weekday: s.weekday,
    start_time: s.start_time,
    end_time: s.end_time,
    status: s.status,
    created_at: s.created_at,
    updated_at: s.updated_at,
    teacherName: s.teachers
      ? Array.isArray(s.teachers.profiles)
        ? s.teachers.profiles[0]?.full_name ?? ""
        : s.teachers.profiles?.full_name ?? ""
      : undefined,
  }));
}

export async function getRescheduleRequests(teacherId: string): Promise<LessonWithRelations[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id, student_id, teacher_id, schedule_id, start_time, end_time,
      meet_link, status, reschedule_proposed_start, reschedule_proposed_end,
      reschedule_requested_by, created_at, updated_at,
      students ( id, profiles ( full_name ) )
    `)
    .eq("teacher_id", teacherId)
    .eq("status", "reschedule_requested")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((l) => ({
    id: l.id,
    student_id: l.student_id,
    teacher_id: l.teacher_id,
    schedule_id: l.schedule_id,
    start_time: l.start_time,
    end_time: l.end_time,
    meet_link: l.meet_link,
    status: l.status,
    reschedule_proposed_start: l.reschedule_proposed_start,
    reschedule_proposed_end: l.reschedule_proposed_end,
    reschedule_requested_by: l.reschedule_requested_by,
    created_at: l.created_at,
    updated_at: l.updated_at,
    other_party_name: l.students
      ? Array.isArray(l.students.profiles)
        ? l.students.profiles[0]?.full_name ?? ""
        : l.students.profiles?.full_name ?? ""
      : undefined,
  }));
}
