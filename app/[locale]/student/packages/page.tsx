import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PricingCard } from "@/components/pricing/pricing-card";
import { lessonPackages } from "@/config/pricing";
import { getStudentNav } from "@/config/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

type Props = { params: Promise<{ locale: string }> };

export default async function StudentPackagesPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.student.packages;

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.packages}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="mb-7 rounded-md border border-dashed border-academy-line bg-academy-mist px-4 py-3 text-[13px] leading-relaxed text-academy-slate">
        {t.stripeNote}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessonPackages.map((pkg) => (
          <PricingCard
            key={pkg.id}
            packageId={pkg.id}
            priceChf={pkg.priceChf}
            credits={pkg.credits}
            highlight={pkg.highlight}
            ctaHref={localizedPath(raw, "/pricing")}
            ctaLabel={t.viewDetails}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}
