import { notFound } from "next/navigation";
import { PublicLayout } from "@/components/layout/public-layout";
import { PricingGrid } from "@/components/pricing/pricing-grid";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = { params: Promise<{ locale: string }> };

export default async function PricingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.pricing;

  return (
    <PublicLayout locale={raw}>
      <Section pad="tight" width="wide" className="pt-8 sm:pt-12">
        <PageHeader
          eyebrow={dict.nav.pricing}
          title={t.title}
          description={t.subtitle}
          size="lg"
        />

        <div className="mt-8 rounded-2xl border border-academy-line/80 bg-gradient-to-b from-academy-paper-soft to-white p-3 sm:mt-12 sm:rounded-[20px] sm:p-5 lg:mt-16 lg:p-8">
          <PricingGrid />
        </div>

        <p className="mx-auto mt-6 max-w-xl rounded-xl border border-academy-line bg-white px-4 py-3.5 text-center text-[13px] leading-relaxed text-academy-slate-muted shadow-soft sm:mt-8 sm:px-5 sm:py-4">
          {t.checkoutNote}
        </p>
      </Section>
    </PublicLayout>
  );
}
