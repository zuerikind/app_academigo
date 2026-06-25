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
    .select("id, slug, name, stripe_price_id, price_chf")
    .eq("slug", packageSlug)
    .eq("is_active", true)
    .eq("is_subscription", false)
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const packagesUrl = `${baseUrl}${localizedPath(locale, "/student/packages")}`;
  const successUrl = `${packagesUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${packagesUrl}?cancelled=true`;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        student_id: student.id,
        package_id: pkg.id,
        package_slug: pkg.slug,
      },
    });
  } catch {
    return { error: "Checkout session creation failed." };
  }

  if (!session.url) return { error: "Checkout session creation failed." };

  redirect(session.url);
}
