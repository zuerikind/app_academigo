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
    .select("id, slug, name, stripe_price_id, is_subscription, price_chf")
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
  const successUrl = `${baseUrl}${localizedPath(locale, "/student/packages")}?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}${localizedPath(locale, "/student/packages")}?cancelled=true`;

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

  if (!student?.stripe_customer_id) {
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

  let portalSession: Stripe.BillingPortal.Session;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer: student.stripe_customer_id,
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
  } catch {
    return { error: "Could not open billing portal." };
  }

  redirect(portalSession.url);
}
