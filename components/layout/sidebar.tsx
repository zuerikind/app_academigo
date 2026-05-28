"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/icons/app-icon";
import { BrandMark } from "@/components/layout/brand-mark";
import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({
  items,
  brand,
  homeHref,
}: {
  items: NavItem[];
  brand: string;
  homeHref: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-academy-line bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
        <BrandMark href={homeHref} label={brand} className="mb-9 pl-1" />
        <nav className="flex flex-1 flex-col gap-0.5">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium",
                  "transition-colors duration-150",
                  active
                    ? "bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)]"
                    : "text-academy-slate hover:bg-academy-mist hover:text-academy-navy",
                )}
                aria-current={active ? "page" : undefined}
              >
                <AppIcon
                  name={item.icon}
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active
                      ? "text-[color:var(--brand-deep)]"
                      : "text-academy-slate-muted group-hover:text-academy-navy",
                  )}
                  strokeWidth={1.6}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 rounded-[10px] border border-academy-line bg-academy-paper-soft p-3 text-[11.5px] leading-relaxed text-academy-slate">
          <p className="text-meta-brand mb-1">Academigo · CH</p>
          <p>Zürich · Online &amp; in-person</p>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-academy-line bg-white/95 backdrop-blur-md lg:hidden">
      {items.slice(0, 5).map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium tracking-tight transition-colors",
              active
                ? "text-[color:var(--brand-deep)]"
                : "text-academy-slate-muted",
            )}
          >
            <AppIcon
              name={item.icon}
              className="h-[18px] w-[18px]"
              strokeWidth={1.6}
            />
            <span className="truncate px-1 text-center">
              {item.label.split(" ")[0]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
