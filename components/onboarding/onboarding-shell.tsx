import { BrandMark } from "@/components/layout/brand-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/path";
import type { Dictionary } from "@/messages/types";

export function OnboardingShell({
  locale,
  dict,
  eyebrow,
  title,
  description,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-academy-mist">
      <header className="border-b border-academy-line bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <BrandMark
            href={localizedPath(locale, "/")}
            label={dict.common.brand}
            layout="full"
            showWordmark={false}
          />
          <LanguageSwitcher
            locale={locale}
            ariaLabel={dict.nav.languageSwitcher}
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-meta dot-accent">{eyebrow}</p>
        <h1 className="mt-4 font-display text-[28px] font-semibold tracking-tight text-academy-navy sm:text-[32px]">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-academy-slate">
          {description}
        </p>
        <div className="mt-10 rounded-xl border border-academy-line bg-white p-7 sm:p-9">
          {children}
        </div>
      </main>
    </div>
  );
}
