import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { FooterLanguageSwitcher } from "@/components/layout/footer-language-switcher";
import { siteConfig } from "@/config/site";
import { formatMessage } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import type { Dictionary } from "@/messages/types";

export function Footer({
  locale,
  dict,
  tagline,
}: {
  locale: Locale;
  dict: Dictionary;
  tagline?: string;
}) {
  const c = dict.common;

  const platform = [
    { label: c.ctaViewTeachers, href: localizedPath(locale, "/teachers") },
    { label: c.ctaViewPricing, href: localizedPath(locale, "/pricing") },
    { label: dict.nav.subjects, href: localizedPath(locale, "/subjects") },
    { label: dict.nav.about, href: localizedPath(locale, "/about") },
    {
      label: c.ctaApplyTeacher,
      href: localizedPath(locale, "/signup?role=teacher"),
    },
  ];

  const contact = [
    {
      label: c.ctaConsultation,
      href: siteConfig.links.consultation,
      external: true,
    },
    {
      label: c.footerEmail,
      href: siteConfig.links.email,
      external: true,
    },
    {
      label: c.footerLearnMore,
      href: siteConfig.domain,
      external: true,
    },
  ];

  return (
    <footer className="border-t border-[color:var(--brand-deep)] bg-[color:var(--brand-deep)] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-10">
        <div className="grid gap-10 py-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:py-16 lg:grid-cols-4 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <BrandMark
              href={localizedPath(locale, "/")}
              label={c.brand}
              layout="stacked"
            />
            <p className="mt-5 max-w-md text-[13.5px] leading-relaxed text-white/65">
              {tagline ?? c.footerTagline}
            </p>
            <p className="mt-3 text-[12.5px] text-white/45">{c.footerLocation}</p>
          </div>

          <FooterColumn title={c.footerPlatform} items={platform} />
          <FooterColumn title={c.footerContact} items={contact} />

          <FooterSection title={c.footerLanguage}>
            <FooterLanguageSwitcher
              locale={locale}
              ariaLabel={dict.nav.languageSwitcher}
            />
          </FooterSection>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{formatMessage(c.footer, { year: new Date().getFullYear() })}</p>
          <p className="font-display tracking-tight">Made in Switzerland</p>
        </div>
      </div>
    </footer>
  );
}

function FooterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-meta text-white/55">{title}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <FooterSection title={title}>
      <ul className="space-y-2.5 text-[13.5px]">
        {items.map((item) => (
          <li key={item.href + item.label}>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/75 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ) : (
              <Link
                href={item.href}
                className="text-white/75 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </FooterSection>
  );
}
