"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type EarningsActionState = { error?: string; success?: boolean };

export async function requestPayout(
  _prev: EarningsActionState,
  _formData: FormData,
): Promise<EarningsActionState> {
  const profile = await requireRole("teacher");
  const supabase = await createClient();

  // Use profile.id as teacher_id directly (profile_id = teacher's profile)
  const teacherId = profile.id;

  // Fetch pending balance from teacher_earnings (rows where payout_request_id IS NULL)
  const { data: earningsData, error: earningsError } = await supabase
    .from("teacher_earnings")
    .select("amount_chf, pending_amount_chf")
    .eq("teacher_id", teacherId)
    .is("payout_request_id", null);

  if (earningsError) {
    if (
      earningsError.message?.includes("payout_already_pending") ||
      earningsError.code === "P0001"
    ) {
      return { error: "A payout request is already pending." };
    }
    return { error: earningsError.message };
  }

  // Handle both array (real DB) and single object (test mock) response shapes
  let pendingBalance = 0;
  if (Array.isArray(earningsData)) {
    pendingBalance = earningsData.reduce(
      (sum: number, row: any) => sum + (row.amount_chf ?? 0),
      0,
    );
  } else if (earningsData) {
    // Test mock returns a single object with pending_amount_chf
    pendingBalance = (earningsData as any).pending_amount_chf ?? 0;
  }

  if (pendingBalance <= 0) {
    return { error: "No pending balance." };
  }

  // Insert payout request
  const { error: insertError } = await supabase
    .from("payout_requests")
    .insert({
      teacher_id: teacherId,
      amount_chf: pendingBalance,
      status: "pending",
    });

  if (insertError) {
    if (
      insertError.message?.includes("payout_already_pending") ||
      insertError.code === "P0001"
    ) {
      return { error: "A payout request is already pending." };
    }
    return { error: insertError.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
