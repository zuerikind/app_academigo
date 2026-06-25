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

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutComplete(session);
    } else if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoicePaid(invoice);
    }
  } catch (err) {
    console.error("[webhook] handler failed:", err);
    return new Response("Internal error", { status: 500 });
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

  // Look up the package to get credits and price
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
    stripe_session_id: stripeSessionId,
    package_id: packageId,
    amount: amountChf,
    status: "completed",
  });

  if (insertError) throw new Error(`payments insert failed: ${insertError.message}`);

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

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const studentId = invoice.metadata?.student_id;
  const packageId = invoice.metadata?.package_id;
  const invoiceId = invoice.id;

  if (!studentId || !packageId) return;

  const supabase = createServiceClient();

  // Idempotency check: if already processed, skip
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_session_id", invoiceId)
    .maybeSingle();

  if (existing) return;

  // Look up the package to get credits and price
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

  if (insertError) throw new Error(`invoice payments insert failed: ${insertError.message}`);

  const { error: rpcError } = await supabase.rpc("grant_subscription_credits", {
    p_student_id: studentId,
    p_credits: credits,
  });

  if (rpcError) throw new Error(`grant_subscription_credits failed: ${rpcError.message}`);
}
