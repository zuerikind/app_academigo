import { createClient } from "@/lib/supabase/server";
import type { Subject } from "@/lib/types";

export async function getSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .order("is_coming_soon", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getActiveSubjects(): Promise<Subject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}
