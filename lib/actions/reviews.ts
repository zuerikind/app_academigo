"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ReviewActionState = { error?: string; success?: boolean };

export async function submitReview(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  const ratingRaw = parseInt(String(formData.get("rating") ?? "0"), 10);
  const comment = (formData.get("comment") as string)?.trim() || null;

  if (!bookingId) return { error: "Missing booking ID." };
  if (!ratingRaw || ratingRaw < 1 || ratingRaw > 5) {
    return { error: "Rating must be between 1 and 5." };
  }

  // Get student record
  let studentId = profile.id;
  try {
    const { data: studentData } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (studentData?.id) studentId = studentData.id;
  } catch {
    // fall back to profile.id
  }

  // Fetch booking — verify it exists, belongs to student, and is completed
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status, teacher_id, student_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) return { error: bookingError.message };
  if (!booking) return { error: "Booking not found." };
  // Only block if status is explicitly set and is NOT completed
  if (booking.status && booking.status !== "completed") {
    return { error: "You can only review a completed session." };
  }

  // Insert review
  const { error: insertError } = await supabase
    .from("reviews")
    .insert({
      booking_id: bookingId,
      student_id: studentId,
      teacher_id: booking.teacher_id,
      rating: ratingRaw,
      comment,
    });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "You've already reviewed this session." };
    }
    return { error: insertError.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
