"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type EarningsActionState = { error?: string; success?: boolean };

export async function requestPayout(
  _prev: EarningsActionState,
  _formData: FormData,
): Promise<EarningsActionState> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  // Resolve teachers.id and check bank details from profile_id
  const { data: teacherRecord, error: teacherError } = await supabase
    .from("teachers")
    .select("id, payout_info_placeholder")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (teacherError || !teacherRecord) {
    return { error: "Teacher record not found." };
  }

  if (!teacherRecord.payout_info_placeholder?.trim()) {
    return { error: "Please save your bank details in Settings before requesting a payout." };
  }

  const teacherId = teacherRecord.id;

  // One open request at a time — otherwise the same 'available' earnings get
  // summed into a second request and paid twice.
  const { data: openRequest } = await supabase
    .from("payout_requests")
    .select("id")
    .eq("teacher_id", teacherId)
    .eq("status", "pending")
    .maybeSingle();

  if (openRequest) {
    return { error: "You already have a pending payout request." };
  }

  // Sum all available (unpaid) earnings
  const { data: earningsData, error: earningsError } = await supabase
    .from("teacher_earnings")
    .select("amount")
    .eq("teacher_id", teacherId)
    .eq("status", "available");

  if (earningsError) return { error: earningsError.message };

  const pendingBalance = (earningsData ?? []).reduce(
    (sum: number, row: any) => sum + (row.amount ?? 0),
    0,
  );

  if (pendingBalance <= 0) {
    return { error: "No pending balance." };
  }

  const { data: insertData, error: insertError } = await supabase
    .from("payout_requests")
    .insert({
      teacher_id: teacherId,
      amount_chf: Math.round(pendingBalance * 100) / 100,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !insertData) return { error: insertError?.message ?? "Insert failed" };

  // Link rows to this request AND flip them out of 'available' so they can't
  // be summed into a future request. Teachers have no UPDATE RLS policy on
  // teacher_earnings — service role required.
  const serviceClient = createServiceClient();
  await serviceClient
    .from("teacher_earnings")
    .update({ payout_request_id: insertData.id, status: "requested" })
    .eq("teacher_id", teacherId)
    .eq("status", "available");

  revalidatePath("/", "layout");
  return { success: true };
}
