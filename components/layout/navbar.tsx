"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { BrandMark } from "@/components/layout/brand-mark";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getPublicNav } from "@/config/navigation";
import { localizedPath } from "@/lib/i18n/path";
import { cn } from "@/lib/utils";

export function Navbar({ isAuthenticated }: { isAuthenticated?: boolean }) {
  const { locale, dict } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const publicNav = getPublicNav(dict, locale);
  const c = dict.common;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-200",
        scrolled
          ? "border-b border-academy-line bg-white/90 backdrop-blur-md"
          : "border-b border-transparent bg-white/70 backdrop-blur",
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-10">
            <BrandMark
              href={localizedPath(locale, "/")}
              label={c.brand}
            />
            <nav className="hidden items-center gap-7 lg:flex">
              {publicNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[13.5px] font-medium text-academy-slate transition-colors hover:text-academy-navy"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-2.5 lg:flex">
            <LanguageSwitcher
              locale={locale}
              ariaLabel={dict.nav.languageSwitcher}
            />
            {isAuthenticated ? (
              <Button
                href={localizedPath(locale, "/student/dashboard")}
                variant="primary"
                size="sm"
                shape="pill"
              >
                {dict.nav.dashboard}
              </Button>
            ) : (
              <>
                <Button
                  href={localizedPath(locale, "/login")}
                  variant="ghost"
                  size="sm"
                >
                  {c.logIn}
                </Button>
                <Button
                  href={siteConfig.links.consultation}
                  variant="primary"
                  size="sm"
                  shape="pill"
                  external
                >
                  {c.ctaConsultation}
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-academy-navy lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-[max-height] duration-300 lg:hidden",
            open ? "max-h-[32rem] border-t border-academy-line" : "max-h-0",
          )}
        >
          <nav className="flex flex-col gap-1 py-4">
            {publicNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-academy-navy hover:bg-academy-mist"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-academy-line pt-4">
              <LanguageSwitcher
                locale={locale}
                ariaLabel={dict.nav.languageSwitcher}
              />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                href={siteConfig.links.consultation}
                variant="primary"
                shape="pill"
                external
                fullWidth
              >
                {c.ctaConsultation}
              </Button>
              <Button
                href={localizedPath(locale, "/login")}
                variant="secondary"
                shape="pill"
                fullWidth
              >
                {c.logIn}
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
