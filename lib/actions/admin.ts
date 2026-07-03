"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { sendPayoutProcessed, sendTeacherApproved } from "@/lib/services/email";
import { defaultPayoutRates } from "@/config/earnings";

export type AdminActionState = { error?: string; success?: boolean };

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

  const { data: teacher } = await supabase
    .from("teachers")
    .select("profiles(email, full_name)")
    .eq("id", teacherId)
    .single();
  const profile = Array.isArray(teacher?.profiles) ? teacher.profiles[0] : teacher?.profiles;
  if (profile?.email) {
    await sendTeacherApproved({
      to: profile.email,
      teacherName: profile.full_name ?? "Teacher",
      dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/teacher/dashboard`,
    });
  }

  revalidatePath("/[locale]/admin/teachers", "layout");
  return {};
}

export async function setTeacherActive(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  if (!teacherId) return { error: "Missing teacher ID" };

  const isActive = formData.get("isActive") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("teachers")
    .update({ is_active: isActive })
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

  const { data: request, error: fetchError } = await supabase
    .from("level_promotion_requests")
    .select("teacher_id, requested_level")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) return { error: fetchError?.message ?? "Request not found" };

  const newLevel = request.requested_level as keyof typeof defaultPayoutRates;
  const newRate = defaultPayoutRates[newLevel];

  const { error: teacherError } = await supabase
    .from("teachers")
    .update({ teacher_level: newLevel, payout_rate: newRate })
    .eq("id", request.teacher_id);

  if (teacherError) return { error: teacherError.message };

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

const SETTING_KEYS = [
  "tier_junior_rate_chf",
  "tier_junior_sessions_to_promote",
  "tier_junior_rating_to_promote",
  "tier_mid_rate_chf",
  "tier_mid_sessions_to_promote",
  "tier_mid_rating_to_promote",
  "tier_top_rate_chf",
] as const;

export async function saveSettings(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  for (const key of SETTING_KEYS) {
    const value = (formData.get(key) as string | null)?.trim();
    if (!value) continue;
    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function markPayoutProcessed(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireRole("admin");
  const payoutId = String(formData.get("payoutId") ?? "").trim();
  if (!payoutId) return { error: "Missing payout ID" };

  const supabase = await createClient();

  const { data: payout } = await supabase
    .from("payout_requests")
    .select("id, amount_chf, teachers ( profiles ( full_name, email ) )")
    .eq("id", payoutId)
    .maybeSingle();

  if (!payout) return { error: "Payout not found" };

  const { error } = await supabase
    .from("payout_requests")
    .update({ status: "processed" })
    .eq("id", payoutId);

  if (error) return { error: error.message };

  // Requires the teacher_earnings_admin_update RLS policy — without it this
  // silently updated 0 rows and earnings stayed re-payable.
  const { error: earningsError } = await supabase
    .from("teacher_earnings")
    .update({ status: "paid" })
    .eq("payout_request_id", payoutId);

  if (earningsError) {
    console.error("[admin] markPayoutProcessed: earnings update failed:", earningsError.message);
  }

  const tc = Array.isArray(payout.teachers) ? payout.teachers[0] : payout.teachers;
  const profile = Array.isArray(tc?.profiles) ? tc?.profiles[0] : tc?.profiles;
  if (profile?.email) {
    await sendPayoutProcessed({
      to: profile.email,
      teacherName: profile.full_name ?? "Teacher",
      amountChf: Number(payout.amount_chf),
    });
  }

  revalidatePath("/[locale]/admin/payouts", "page");
  return { success: true };
}
