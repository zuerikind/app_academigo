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

// Reads the real credit ledger (student_credits) for the logged-in student.
// credit_wallets was only seeded once and never credited by purchases — do not use it.
export async function getWalletBalance(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("student_available_credits");

  if (error || data == null) return 0;
  return data as number;
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
