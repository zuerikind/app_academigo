import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";
import { JsonLd } from "@/components/seo/json-ld";
import { PricingGrid } from "@/components/pricing/pricing-grid";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { faqPageJsonLd } from "@/lib/seo/schemas";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const dict = getDictionary(raw);
  const seo = dict.seo.pricing;
  return buildPageMetadata({
    locale: raw,
    path: "/pricing",
    title: seo.title,
    description: seo.description,
  });
}

export default async function PricingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.pricing;

  const faq = t.faq;

  return (
    <PublicLayout locale={raw}>
      <JsonLd data={faqPageJsonLd(faq.items)} />
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

        {/* FAQ */}
        <div className="mt-16 sm:mt-20 lg:mt-24">
          <h2 className="font-display text-[22px] font-semibold tracking-tight text-academy-navy sm:text-[26px]">
            {faq.title}
          </h2>
          <div className="mt-6 divide-y divide-academy-line">
            {faq.items.map((item) => (
              <details key={item.q} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-[15px] font-medium text-academy-navy group-open:text-[color:var(--brand-deep)]">
                    {item.q}
                  </span>
                  <span className="shrink-0 text-academy-slate-muted transition-transform group-open:rotate-45">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-[14px] leading-relaxed text-academy-slate">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Section>
    </PublicLayout>
  );
}
