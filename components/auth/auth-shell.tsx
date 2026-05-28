import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import type { Dictionary } from "@/messages/types";

export function AuthShell({
  locale,
  dict,
  title,
  description,
  children,
  switchHref,
  switchPrompt,
  switchCta,
  asideEyebrow,
  asideTitle,
  asideBody,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  description: string;
  children: React.ReactNode;
  switchHref: string;
  switchPrompt: string;
  switchCta: string;
  asideEyebrow: string;
  asideTitle: string;
  asideBody: string;
}) {
  const c = dict.common;

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Left — brand panel */}
      <aside className="relative hidden flex-col justify-between bg-[color:var(--brand-deep)] px-10 py-9 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(70%_45%_at_30%_10%,rgba(255,255,255,0.07),transparent_55%)]"
        />
        <div className="relative">
          <BrandMark
            href={localizedPath(locale, "/")}
            label={c.brand}
            variant="light"
            layout="full"
            showWordmark={false}
          />
        </div>

        <div className="relative max-w-md">
          <p className="text-meta text-white/55">{asideEyebrow}</p>
          <h2 className="mt-4 font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.022em]">
            {asideTitle}
          </h2>
          <p className="mt-5 text-[14.5px] leading-relaxed text-white/72">
            {asideBody}
          </p>

          {/* Editorial micro-list */}
          <ul className="mt-10 space-y-2.5 text-[13px] text-white/72">
            <li className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-white/55"
              />
              {dict.home.trust.experience}
            </li>
            <li className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-white/55"
              />
              {dict.home.trust.platform}
            </li>
            <li className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-white/55"
              />
              {dict.home.trust.locations}
            </li>
          </ul>
        </div>

        <div className="relative flex items-center justify-between text-[12px] text-white/55">
          <p>Zürich · Online &amp; in-person</p>
          <p className="font-display tracking-tight">2026</p>
        </div>
      </aside>

      {/* Right — form */}
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex items-center justify-between border-b border-academy-line px-6 py-5 lg:hidden">
          <BrandMark
            href={localizedPath(locale, "/")}
            label={c.brand}
            layout="full"
            showWordmark={false}
          />
          <LanguageSwitcher
            locale={locale}
            ariaLabel={dict.nav.languageSwitcher}
          />
        </div>

        <div className="hidden justify-end px-10 py-6 lg:flex">
          <LanguageSwitcher
            locale={locale}
            ariaLabel={dict.nav.languageSwitcher}
          />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.022em] text-academy-navy">
              {title}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-academy-slate">
              {description}
            </p>
            <div className="mt-9">{children}</div>
            <p className="mt-8 text-[13px] text-academy-slate">
              {switchPrompt}{" "}
              <Link
                href={switchHref}
                className="font-medium text-[color:var(--brand-deep)] link-underline"
              >
                {switchCta}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
