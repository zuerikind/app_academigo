import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/config/site";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const dict = getDictionary(raw);
  const seo = dict.seo.about;
  return buildPageMetadata({
    locale: raw,
    path: "/about",
    title: seo.title,
    description: seo.description,
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.about;

  return (
    <PublicLayout locale={raw}>
      <Section pad="tight" width="narrow" className="pt-12">
        <PageHeader
          eyebrow={dict.nav.about}
          title={t.title.replace("Academigo", siteConfig.brand)}
          description={dict.meta.description}
          size="lg"
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-meta">01</p>
            <h2 className="mt-3 font-display text-[20px] font-semibold tracking-tight text-academy-navy">
              {t.missionTitle}
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-academy-slate lg:col-span-8">
            {t.missionText}
          </p>
        </div>

        <hr className="my-14 border-academy-line" />

        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-meta">02</p>
            <h2 className="mt-3 font-display text-[20px] font-semibold tracking-tight text-academy-navy">
              {t.teachersTitle}
            </h2>
          </div>
          <p className="text-[15px] leading-relaxed text-academy-slate lg:col-span-8">
            {t.teachersText}
          </p>
        </div>
      </Section>
    </PublicLayout>
  );
}
