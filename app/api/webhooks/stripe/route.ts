import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

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

  return Response.json({ received: true }, { status: 200 });
}

async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const studentId = session.metadata?.student_id;
  const packageId = session.metadata?.package_id;
  const stripeSessionId = session.id;

  if (!studentId || !packageId) return;

  const supabase = await createClient();

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

  // Insert payment record (UNIQUE constraint on stripe_session_id prevents double-grant)
  await supabase.from("payments").insert({
    student_id: studentId,
    stripe_session_id: stripeSessionId,
    package_id: packageId,
    amount_chf: amountChf,
  });

  // Grant credits via appropriate RPC
  if (isSubscription) {
    await supabase.rpc("grant_subscription_credits", {
      p_student_id: studentId,
      p_credits: credits,
    });
  } else {
    await supabase.rpc("grant_credits", {
      p_student_id: studentId,
      p_credits: credits,
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const studentId = invoice.metadata?.student_id;
  const packageId = invoice.metadata?.package_id;
  const invoiceId = invoice.id;

  if (!studentId || !packageId || !invoiceId) return;

  const supabase = await createClient();

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

  // Insert payment record for this renewal
  await supabase.from("payments").insert({
    student_id: studentId,
    stripe_session_id: invoiceId,
    package_id: packageId,
    amount_chf: amountChf,
  });

  // Subscription renewal always resets credits
  await supabase.rpc("grant_subscription_credits", {
    p_student_id: studentId,
    p_credits: credits,
  });
}
