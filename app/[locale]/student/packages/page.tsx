import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { BuyPricingGrid } from "@/components/pricing/buy-pricing-grid";
import { StatCard } from "@/components/ui/stat-card";
import { CreditLedger } from "@/components/student/credit-ledger";
import { getStudentNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getStudentBillingInfo, getStudentCreditLedger } from "@/lib/queries/student";
import { createCheckoutSession } from "@/lib/actions/payments";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string; cancelled?: string; session_id?: string }>;
};

export default async function StudentPackagesPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const profile = await requireRoleFromParams("student", raw);

  const dict = getDictionary(raw);
  const t = dict.student.packages;
  const sp = await searchParams;

  const [billing, ledger] = await Promise.all([
    getStudentBillingInfo(profile.id),
    getStudentCreditLedger(profile.id),
  ]);

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={dict.student.dashboard.availableCredits}
            value={billing.availableCredits}
            icon="coins"
            tone="brand"
            hint={t.creditsHint}
          />
        </div>

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

        <CreditLedger
          entries={ledger}
          strings={{
            ledgerTitle: t.ledgerTitle,
            ledgerEmpty: t.ledgerEmpty,
            ledgerSessionWith: t.ledgerSessionWith,
            ledgerBalance: t.ledgerBalance,
          }}
          locale={raw}
        />

        <BuyPricingGrid action={createCheckoutSession} />
      </div>
    </DashboardLayout>
  );
}
