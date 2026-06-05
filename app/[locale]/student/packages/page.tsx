import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BuyPricingGrid } from "@/components/pricing/buy-pricing-grid";
import { StatCard } from "@/components/ui/stat-card";
import { BillingSection } from "@/components/student/billing-section";
import { getStudentNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getStudentBillingInfo } from "@/lib/queries/student";
import { createCheckoutSession, createPortalSession, reactivateSubscription } from "@/lib/actions/payments";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string; cancelled?: string; session_id?: string; upgraded?: string }>;
};

export default async function StudentPackagesPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const profile = await requireRoleFromParams("student", raw);

  const dict = getDictionary(raw);
  const t = dict.student.packages;
  const sp = await searchParams;

  const billing = await getStudentBillingInfo(profile.id);

  const showSuccess = sp.success === "true";
  const showCancelled = sp.cancelled === "true";
  const showUpgraded = sp.upgraded === "true";

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
            label={dict.student.dashboard.availableCredits}
            value={billing.availableCredits}
            icon="coins"
            tone="brand"
            hint={t.creditsHint}
          />
        </div>

        {/* Success / cancelled banners */}
        {showUpgraded && (
          <div className="rounded-xl border border-[color:var(--academy-success)]/30 bg-[color:var(--academy-success-soft)] px-4 py-3 text-[13px] font-medium text-[color:var(--academy-success)]">
            {t.planUpgraded}
          </div>
        )}
        {showSuccess && (
          <div className="rounded-xl border border-[color:var(--academy-success)]/30 bg-[color:var(--academy-success-soft)] px-4 py-3 text-[13px] font-medium text-[color:var(--academy-success)]">
            {t.paymentSuccess}
          </div>
        )}
        {showCancelled && (
          <div className="rounded-xl border border-academy-line bg-academy-paper-soft px-4 py-3 text-[13px] text-academy-slate">
            {t.paymentCancelled}
          </div>
        )}

        {/* Current plan + credit breakdown + billing history */}
        <BillingSection
          activePlan={billing.activePlan}
          paymentHistory={billing.paymentHistory}
          subscriptionRemaining={billing.subscriptionRemaining}
          extraRemaining={billing.extraRemaining}
          cancelAtPeriodEnd={billing.cancelAtPeriodEnd}
          cancelPeriodEnd={billing.cancelPeriodEnd}
          strings={{
            currentPlan: t.currentPlan,
            active: t.active,
            renewsOn: t.renewsOn,
            oneTimePurchase: t.oneTimePurchase,
            purchasedOn: t.purchasedOn,
            billingHistory: t.billingHistory,
            hideBillingHistory: t.hideBillingHistory,
            noPayments: t.noPayments,
            subscriptionCredits: t.subscriptionCredits,
            extraCredits: t.extraCredits,
            creditsLabel: t.creditsLabel,
            manageSubscription: t.manageSubscription,
            cancelledNotice: t.cancelledNotice,
            reactivateSubscription: t.reactivateSubscription,
            reactivating: t.reactivating,
          }}
          locale={raw}
          manageSubscriptionAction={
            billing.activePlan?.isSubscription && !billing.cancelAtPeriodEnd
              ? createPortalSession
              : undefined
          }
          reactivateAction={
            billing.cancelAtPeriodEnd ? reactivateSubscription : undefined
          }
        />

        {/* Pricing grid with buy buttons */}
        <BuyPricingGrid action={createCheckoutSession} />
      </div>
    </DashboardLayout>
  );
}
