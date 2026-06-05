"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getActionLocale } from "@/lib/actions/locale";
import { localizedPath } from "@/lib/i18n/path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_placeholder");

export async function createCheckoutSession(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const locale = await getActionLocale(formData);
  const profile = await requireRole("student", locale);
  const packageSlug = String(formData.get("packageSlug") ?? "");

  const supabase = await createClient();

  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("id, slug, name, stripe_price_id, is_subscription, price_chf, credits")
    .eq("slug", packageSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!pkg || !pkg.stripe_price_id) {
    return { error: "Package not found." };
  }

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!student) {
    return { error: "Student record not found." };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const packagesUrl = `${baseUrl}${localizedPath(locale, "/student/packages")}`;

  // If buying a subscription and one is already active → upgrade in-place
  if (pkg.is_subscription) {
    const { data: existingSubPayment } = await supabase
      .from("payments")
      .select("stripe_subscription_id")
      .eq("student_id", student.id)
      .not("stripe_subscription_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSubPayment?.stripe_subscription_id) {
      try {
        const existingSub = await stripe.subscriptions.retrieve(
          existingSubPayment.stripe_subscription_id,
        );

        if (existingSub.status === "active" || existingSub.status === "trialing") {
          const currentPriceId = existingSub.items.data[0]?.price?.id;
          if (currentPriceId === pkg.stripe_price_id) {
            return { error: "You are already subscribed to this plan." };
          }

          // Swap price on the existing subscription (prorated invoice created by Stripe)
          await stripe.subscriptions.update(existingSub.id, {
            items: [{ id: existingSub.items.data[0].id, price: pkg.stripe_price_id }],
            metadata: { student_id: student.id, package_id: pkg.id },
            proration_behavior: "always_invoice",
            cancel_at_period_end: false,
          });

          // Grant the new credit amount immediately (webhook skips non-renewal invoices)
          await supabase.rpc("grant_subscription_credits", {
            p_student_id: student.id,
            p_credits: pkg.credits ?? 0,
          });

          redirect(`${packagesUrl}?upgraded=true`);
        }
      } catch (err) {
        // If Stripe error during upgrade, surface it; otherwise fall through to normal checkout
        if (err instanceof Stripe.errors.StripeError) {
          return { error: err.message };
        }
        // NEXT_REDIRECT throws — re-throw so redirect works
        throw err;
      }
    }
  }

  const successUrl = `${packagesUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${packagesUrl}?cancelled=true`;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: pkg.is_subscription ? "subscription" : "payment",
      line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        student_id: student.id,
        package_id: pkg.id,
        package_slug: pkg.slug,
      },
      ...(pkg.is_subscription && {
        subscription_data: {
          metadata: {
            student_id: student.id,
            package_id: pkg.id,
          },
        },
      }),
    });
  } catch {
    return { error: "Checkout session creation failed." };
  }

  if (!session.url) return { error: "Checkout session creation failed." };

  redirect(session.url);
}

export async function createPortalSession(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const locale = await getActionLocale(formData);
  const profile = await requireRole("student", locale);
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, stripe_customer_id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!student) {
    return { error: "No billing account found." };
  }

  // Look up the most recent active subscription ID so we can deep-link
  // directly to the cancellation flow instead of the portal overview.
  const { data: latestSubPayment } = await supabase
    .from("payments")
    .select("stripe_subscription_id")
    .eq("student_id", student.id)
    .not("stripe_subscription_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}${localizedPath(locale, "/student/packages")}`;
  const subscriptionId = latestSubPayment?.stripe_subscription_id ?? null;

  // Recover stripe_customer_id from the subscription if the webhook missed saving it
  let customerId = student.stripe_customer_id;
  if (!customerId) {
    if (!subscriptionId) {
      return { error: "No billing account found." };
    }
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer as Stripe.Customer).id;
      await supabase.from("students").update({ stripe_customer_id: customerId }).eq("id", student.id);
    } catch {
      return { error: "Could not find billing account." };
    }
  }

  let portalSession: Stripe.BillingPortal.Session;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      ...(subscriptionId && {
        flow_data: {
          type: "subscription_cancel",
          after_completion: {
            type: "redirect",
            redirect: { return_url: returnUrl },
          },
          subscription_cancel: {
            subscription: subscriptionId,
          },
        },
      }),
    });
  } catch (err) {
    const msg = err instanceof Stripe.errors.StripeError ? err.message : "Could not open billing portal.";
    return { error: msg };
  }

  redirect(portalSession.url);
}

export async function reactivateSubscription(
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const locale = await getActionLocale(formData);
  const profile = await requireRole("student", locale);
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!student) return { error: "Student record not found." };

  const { data: subPayment } = await supabase
    .from("payments")
    .select("stripe_subscription_id")
    .eq("student_id", student.id)
    .not("stripe_subscription_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subPayment?.stripe_subscription_id) {
    return { error: "No active subscription found." };
  }

  try {
    await stripe.subscriptions.update(subPayment.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
  } catch (err) {
    const msg = err instanceof Stripe.errors.StripeError ? err.message : "Could not reactivate subscription.";
    return { error: msg };
  }

  redirect(localizedPath(locale, "/student/packages"));
}
