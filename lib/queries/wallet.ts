"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreditTransaction {
  id: string;
  student_id: string;
  lesson_id: string | null;
  amount: number;
  type: "purchase" | "completion_deduction" | "cancellation_refund" | "admin_grant";
  description: string | null;
  created_at: string;
}

export async function getWalletBalance(studentId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_wallets")
    .select("available_balance")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error || !data) return 0;
  return data.available_balance ?? 0;
}

export async function getCreditTransactions(studentId: string): Promise<CreditTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("id, student_id, lesson_id, amount, type, description, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as CreditTransaction[];
}
