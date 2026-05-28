import type { NavItem } from "@/config/navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/messages/types";

export function DashboardLayout({
  children,
  navItems,
  title,
  subtitle,
  eyebrow,
  actions,
  locale,
  dict,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <div className="flex min-h-screen bg-academy-paper-soft">
      <Sidebar
        items={navItems}
        brand={dict.common.brand}
        homeHref={`/${locale}`}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-academy-line bg-white/85 backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-5 sm:px-10 sm:py-7">
            <div className="min-w-0">
              {eyebrow && <p className="text-meta-brand mb-1.5">{eyebrow}</p>}
              <h1 className="font-display text-[22px] font-semibold tracking-[-0.022em] text-academy-navy sm:text-[26px]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-academy-slate">
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <LanguageSwitcher
                locale={locale}
                ariaLabel={dict.nav.languageSwitcher}
              />
              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit" variant="ghost" size="sm">
                  {dict.common.signOut}
                </Button>
              </form>
            </div>
          </div>
        </header>
        <main className="flex-1 px-5 py-10 pb-24 sm:px-10 sm:py-12 lg:pb-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileNav items={navItems} />
    </div>
  );
}
