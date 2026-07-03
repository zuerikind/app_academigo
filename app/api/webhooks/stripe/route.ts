import Stripe from "stripe";
import { fulfillCheckoutSession } from "@/lib/services/fulfillment";

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
      await fulfillCheckoutSession(session);
    }
    // invoice.paid removed: no subscription checkout exists, and invoice.metadata
    // is never populated — the handler could only ever no-op. Re-add with
    // subscription_details metadata plumbing if subscriptions ship.
  } catch (err) {
    console.error("[webhook] handler failed:", err);
    return new Response("Internal error", { status: 500 });
  }

  return Response.json({ received: true }, { status: 200 });
}
