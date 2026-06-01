"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AdminActionState = { error?: string };

export async function approveTeacher(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  if (!teacherId) return { error: "Missing teacher ID" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("teachers")
    .update({ is_approved: true })
    .eq("id", teacherId);

  if (error) return { error: error.message };
  revalidatePath("/[locale]/admin/teachers", "layout");
  return {};
}

export async function approvePromotion(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) return { error: "Missing request ID" };
  const note = String(formData.get("note") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("level_promotion_requests")
    .update({ status: "approved", note })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath("/[locale]/admin/promotions", "page");
  return {};
}

export async function rejectPromotion(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const requestId = String(formData.get("requestId") ?? "").trim();
  if (!requestId) return { error: "Missing request ID" };
  const note = String(formData.get("note") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("level_promotion_requests")
    .update({ status: "rejected", note })
    .eq("id", requestId);

  if (error) return { error: error.message };
  revalidatePath("/[locale]/admin/promotions", "page");
  return {};
}

export async function markPayoutProcessed(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const payoutId = String(formData.get("payoutId") ?? "").trim();
  if (!payoutId) return { error: "Missing payout ID" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payout_requests")
    .update({ status: "processed" })
    .eq("id", payoutId);

  if (error) return { error: error.message };
  revalidatePath("/[locale]/admin/payouts", "page");
  return {};
}
