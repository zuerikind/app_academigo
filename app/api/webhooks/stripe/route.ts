import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_placeholder");

export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutComplete(session);
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    await handleInvoicePaid(invoice);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await handleSubscriptionDeleted(subscription);
  }

  return Response.json({ received: true }, { status: 200 });
}

async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const studentId = session.metadata?.student_id;
  const packageId = session.metadata?.package_id;
  const stripeSessionId = session.id;

  if (!studentId || !packageId) return;

  const supabase = createServiceClient();

  // Idempotency check: if already processed, skip
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (existing) return;

  // Look up the package to get credits and subscription type
  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("credits, is_subscription, price_chf")
    .eq("id", packageId)
    .maybeSingle();

  const credits = pkg?.credits ?? 0;
  const isSubscription = pkg?.is_subscription ?? false;
  const amountChf = pkg?.price_chf ?? 0;

  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const { error: insertError } = await supabase.from("payments").insert({
    student_id: studentId,
    stripe_session_id: stripeSessionId,
    stripe_subscription_id: stripeSubscriptionId,
    package_id: packageId,
    amount: amountChf,
    status: "completed",
  });

  if (insertError) {
    console.error("[webhook] payments insert failed:", insertError.message);
    return;
  }

  if (stripeCustomerId) {
    await supabase
      .from("students")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", studentId);
  }

  const rpcName = isSubscription ? "grant_subscription_credits" : "grant_credits";
  const { error: rpcError } = await supabase.rpc(rpcName, {
    p_student_id: studentId,
    p_credits: credits,
  });

  if (rpcError) {
    console.error(`[webhook] ${rpcName} failed:`, rpcError.message);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  // Initial purchase is handled by checkout.session.completed — skip it here
  // to avoid double-crediting. Only process monthly renewal invoices.
  if (invoice.billing_reason !== "subscription_cycle") return;

  // Metadata lives on the subscription (propagated via subscription_data.metadata)
  const subscriptionMetadata =
    typeof invoice.subscription === "object" && invoice.subscription !== null
      ? invoice.subscription.metadata
      : undefined;
  const studentId = subscriptionMetadata?.student_id ?? invoice.metadata?.student_id;
  const packageId = subscriptionMetadata?.package_id ?? invoice.metadata?.package_id;
  const invoiceId = invoice.id;

  if (!studentId || !packageId || !invoiceId) return;

  const supabase = createServiceClient();

  // Idempotency check via invoice id stored as stripe_session_id
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_session_id", invoiceId)
    .maybeSingle();

  if (existing) return;

  // Look up the package to get credits
  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("credits, price_chf")
    .eq("id", packageId)
    .maybeSingle();

  const credits = pkg?.credits ?? 0;
  const amountChf = pkg?.price_chf ?? 0;

  const { error: insertError } = await supabase.from("payments").insert({
    student_id: studentId,
    stripe_session_id: invoiceId,
    package_id: packageId,
    amount: amountChf,
    status: "completed",
  });

  if (insertError) {
    console.error("[webhook] payments insert failed (invoice):", insertError.message);
    return;
  }

  const { error: rpcError } = await supabase.rpc("grant_subscription_credits", {
    p_student_id: studentId,
    p_credits: credits,
  });

  if (rpcError) {
    console.error("[webhook] grant_subscription_credits failed:", rpcError.message);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = createServiceClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("student_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!payment) return;

  const { error } = await supabase.rpc("grant_subscription_credits", {
    p_student_id: payment.student_id,
    p_credits: 0,
  });

  if (error) {
    console.error("[webhook] subscription cancellation credit reset failed:", error.message);
  }
}
