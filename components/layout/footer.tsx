import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { siteConfig } from "@/config/site";
import { formatMessage } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import type { Dictionary } from "@/messages/types";

export function Footer({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const c = dict.common;

  const platform = [
    { label: c.ctaViewTeachers, href: localizedPath(locale, "/teachers") },
    { label: c.ctaViewPricing, href: localizedPath(locale, "/pricing") },
    { label: dict.nav.subjects, href: localizedPath(locale, "/subjects") },
    { label: dict.nav.about, href: localizedPath(locale, "/about") },
  ];

  const contact = [
    {
      label: c.ctaConsultation,
      href: siteConfig.links.consultation,
      external: true,
    },
    {
      label: c.ctaApplyTeacher,
      href: localizedPath(locale, "/signup?role=teacher"),
    },
  ];

  return (
    <footer className="border-t border-[color:var(--brand-deep)] bg-[color:var(--brand-deep)] text-white">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <BrandMark
              href={localizedPath(locale, "/")}
              label={c.brand}
              variant="light"
              layout="full"
              showWordmark={false}
            />
            <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed text-white/65">
              {c.footerTagline}
            </p>
          </div>

          <FooterColumn title={c.footerPlatform} items={platform} />
          <FooterColumn title={c.footerContact} items={contact} />

          <div>
            <p className="text-meta text-white/55">{dict.nav.languageSwitcher}</p>
            <ul className="mt-5 space-y-1.5 text-[13.5px] text-white/70">
              <li>Zürich, Switzerland</li>
              <li>Online &amp; in-person</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-[12px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>{formatMessage(c.footer, { year: new Date().getFullYear() })}</p>
          <p className="font-display tracking-tight">Made in Switzerland</p>
        </div>
      </div>
    </footer>
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
    <div>
      <p className="text-meta text-white/55">{title}</p>
      <ul className="mt-5 space-y-2.5 text-[13.5px]">
        {items.map((item) =>
          item.external ? (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/75 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            </li>
          ) : (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-white/75 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
