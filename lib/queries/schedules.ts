"use server";

import { createClient } from "@/lib/supabase/server";

export async function getStudentSchedules(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_schedules")
    .select(`
      id, weekday, start_time, end_time, status, created_at,
      teachers!inner(
        id,
        profiles!inner(full_name)
      )
    `)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((s) => {
    const teacher = s.teachers as any;
    // ponytail: Supabase infers join as array type — use [0] pattern (Phase 2 decision)
    const teacherProfile = Array.isArray(teacher?.profiles) ? teacher.profiles[0] : teacher?.profiles;
    return {
      id: s.id,
      weekday: s.weekday as number,
      start_time: s.start_time as string,
      end_time: s.end_time as string,
      status: s.status as string,
      created_at: s.created_at as string,
      teacherId: teacher?.id as string,
      teacherName: (teacherProfile?.full_name as string) ?? "Unknown",
    };
  });
}

export async function getTeacherSchedules(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_schedules")
    .select(`
      id, weekday, start_time, end_time, status, created_at,
      students!inner(
        id,
        profiles!inner(full_name)
      )
    `)
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((s) => {
    const student = s.students as any;
    const studentProfile = Array.isArray(student?.profiles) ? student.profiles[0] : student?.profiles;
    return {
      id: s.id,
      weekday: s.weekday as number,
      start_time: s.start_time as string,
      end_time: s.end_time as string,
      status: s.status as string,
      created_at: s.created_at as string,
      studentId: student?.id as string,
      studentName: (studentProfile?.full_name as string) ?? "Unknown",
    };
  });
}
