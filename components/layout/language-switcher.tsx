"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";
import { localizedPath, stripLocale } from "@/lib/i18n/path";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  ariaLabel,
  variant = "default",
}: {
  locale: Locale;
  ariaLabel: string;
  variant?: "default" | "inverse";
}) {
  const pathname = usePathname();
  const pathWithoutLocale = stripLocale(pathname);

  const inverse = variant === "inverse";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 text-[11px] font-semibold tracking-[0.12em]",
        inverse
          ? "border-white/15 bg-white/[0.04]"
          : "border-academy-line bg-white",
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {locales.map((l) => {
        const href = localizedPath(l, pathWithoutLocale);
        const active = locale === l;
        return (
          <Link
            key={l}
            href={href}
            className={cn(
              "rounded-full px-2.5 py-1 uppercase transition-colors duration-150",
              active
                ? inverse
                  ? "bg-white text-academy-navy"
                  : "bg-[color:var(--brand-deep)] text-white"
                : inverse
                  ? "text-white/70 hover:text-white"
                  : "text-academy-slate hover:text-academy-navy",
            )}
            aria-current={active ? "true" : undefined}
            lang={l}
          >
            {l === "de" ? "DE" : "EN"}
            <span className="sr-only"> ({localeLabels[l]})</span>
          </Link>
        );
      })}
    </div>
  );
}
