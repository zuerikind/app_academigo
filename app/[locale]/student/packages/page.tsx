import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PricingGrid } from "@/components/pricing/pricing-grid";
import { BuyPricingGrid } from "@/components/pricing/buy-pricing-grid";
import { StatCard } from "@/components/ui/stat-card";
import { getStudentNav } from "@/config/navigation";
import { pricingTiers } from "@/config/pricing";
import { requireRoleFromParams } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { createCheckoutSession } from "@/lib/actions/payments";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string; cancelled?: string; session_id?: string }>;
};

export default async function StudentPackagesPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  await requireRoleFromParams("student", raw);

  const dict = getDictionary(raw);
  const t = dict.student.packages;
  const sp = await searchParams;

  // Fetch credit balance from Supabase RPC
  const supabase = await createClient();
  let availableCredits = 0;
  try {
    const { data } = await supabase.rpc("student_available_credits");
    if (typeof data === "number") availableCredits = data;
  } catch {
    // Non-fatal: display 0 if RPC fails
  }

  const showSuccess = sp.success === "true";
  const showCancelled = sp.cancelled === "true";

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.packages}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="space-y-6">
        {/* Credit balance */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Available credits"
            value={availableCredits}
            icon="coins"
            tone="brand"
            hint="1 credit = 1 lesson (50 min)"
          />
        </div>

        {/* Success / cancelled banners */}
        {showSuccess && (
          <div className="rounded-xl border border-[color:var(--academy-success)]/30 bg-[color:var(--academy-success-soft)] px-4 py-3 text-[13px] font-medium text-[color:var(--academy-success)]">
            Payment successful! Your credits have been added to your account.
          </div>
        )}
        {showCancelled && (
          <div className="rounded-xl border border-academy-line bg-academy-paper-soft px-4 py-3 text-[13px] text-academy-slate">
            Payment cancelled. No charges were made.
          </div>
        )}

        {/* Pricing grid with buy buttons */}
        <BuyPricingGrid action={createCheckoutSession} />
      </div>
    </DashboardLayout>
  );
}
