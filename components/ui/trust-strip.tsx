"use client";

import { AppIcon } from "@/components/icons/app-icon";
import type { IconName } from "@/lib/icons";

/**
 * Hairline trust bar — under the hero. Apple-like restraint: small icons,
 * tight rhythm, brand-blue glyphs, no decoration.
 */
export function TrustStrip({
  items,
}: {
  items: { icon: IconName; label: string }[];
}) {
  return (
    <div className="hairline-t hairline-b bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-10">
        <ul className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-4 sm:py-5 lg:grid-cols-5">
          {items.map(({ icon, label }) => (
            <li
              key={label}
              className="flex min-w-0 items-center gap-2.5 text-[12.5px] leading-snug text-academy-navy sm:text-[13px]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--brand-tint)]">
                <AppIcon
                  name={icon}
                  className="h-3.5 w-3.5 text-[color:var(--brand-deep)]"
                  strokeWidth={1.7}
                />
              </span>
              <span className="min-w-0 font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
