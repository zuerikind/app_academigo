import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/ui/page-header";
import { PricingCard } from "@/components/pricing/pricing-card";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { lessonPackages, platformSubscription } from "@/config/pricing";
import { siteConfig } from "@/config/site";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMessage } from "@/lib/i18n/format";
import { localizedPath } from "@/lib/i18n/path";
import { formatChf } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export default async function PricingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.pricing;
  const c = dict.common;

  return (
    <PublicLayout locale={raw}>
      <Section pad="tight" width="wide" className="pt-12">
        <PageHeader
          eyebrow={dict.nav.pricing}
          title={t.title}
          description={t.subtitle}
          size="lg"
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {lessonPackages.map((pkg) => (
            <PricingCard
              key={pkg.id}
              packageId={pkg.id}
              priceChf={pkg.priceChf}
              credits={pkg.credits}
              highlight={pkg.highlight}
              ctaHref={localizedPath(raw, "/signup?role=student")}
            />
          ))}
        </div>

        <div className="mt-14 grid gap-6 rounded-lg border border-academy-line bg-academy-mist p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
          <div>
            <p className="text-meta">{t.platformTitle}</p>
            <h2 className="mt-2 font-display text-[18px] font-semibold tracking-tight text-academy-navy">
              {formatMessage(t.platformDesc, {
                price: formatChf(platformSubscription.priceChf),
              })}
            </h2>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-academy-slate-muted">
              {t.platformNote}
            </p>
          </div>
          <Button href={siteConfig.links.consultation} variant="primary" external>
            {c.ctaConsultation}
          </Button>
        </div>
      </Section>
    </PublicLayout>
  );
}
