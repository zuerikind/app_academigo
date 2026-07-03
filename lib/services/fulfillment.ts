import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_placeholder");

/**
 * Idempotently record a paid checkout session and grant credits.
 * Called from the Stripe webhook AND from the success-page reconcile path,
 * so a delayed/lost webhook can't leave a paid student without credits.
 * Idempotency is enforced by the unique index on payments.stripe_session_id.
 */
export async function fulfillCheckoutSession(session: {
  id: string;
  metadata?: { student_id?: string; package_id?: string } | null;
  customer?: string | Stripe.Customer | Stripe.DeletedCustomer | null;
}): Promise<void> {
  const studentId = session.metadata?.student_id;
  const packageId = session.metadata?.package_id;

  if (!studentId || !packageId) return;

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existing) return;

  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("credits, price_chf")
    .eq("id", packageId)
    .maybeSingle();

  const credits = pkg?.credits ?? 0;
  const amountChf = pkg?.price_chf ?? 0;

  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  const { error: insertError } = await supabase.from("payments").insert({
    student_id: studentId,
    stripe_session_id: session.id,
    package_id: packageId,
    amount: amountChf,
    status: "completed",
  });

  if (insertError) {
    // 23505 = unique violation: a concurrent webhook/reconcile already
    // processed this session — safe to treat as done.
    if (insertError.code === "23505") return;
    throw new Error(`payments insert failed: ${insertError.message}`);
  }

  if (stripeCustomerId) {
    await supabase
      .from("students")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", studentId);
  }

  const { error: rpcError } = await supabase.rpc("grant_credits", {
    p_student_id: studentId,
    p_credits: credits,
  });

  if (rpcError) throw new Error(`grant_credits failed: ${rpcError.message}`);
}

/**
 * Success-page fallback: fetch the session from Stripe, verify it is paid,
 * and fulfill it if the webhook hasn't yet. Never throws — the page must
 * render regardless.
 */
export async function reconcileCheckoutSession(sessionId: string): Promise<void> {
  if (!sessionId || !sessionId.startsWith("cs_")) return;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") return;
    await fulfillCheckoutSession(session);
  } catch (err) {
    console.error("[fulfillment] reconcileCheckoutSession failed:", err);
  }
}
