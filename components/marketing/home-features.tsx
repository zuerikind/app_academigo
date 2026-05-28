"use client";

import { AppIcon } from "@/components/icons/app-icon";
import { useI18n } from "@/components/i18n/locale-provider";
import type { IconName } from "@/lib/icons";

const featureIcons: IconName[] = ["users", "mapPin", "bookOpen"];

export function HomeFeatures() {
  const { dict } = useI18n();
  const features = [
    { ...dict.home.features.teachers, icon: featureIcons[0] },
    { ...dict.home.features.flexible, icon: featureIcons[1] },
    { ...dict.home.features.trusted, icon: featureIcons[2] },
  ];

  return (
    <div className="grid gap-px overflow-hidden rounded-[18px] border border-academy-line bg-academy-line lg:grid-cols-3">
      {features.map(({ icon, title, desc }, idx) => (
        <div
          key={title}
          className="group relative flex h-full flex-col bg-white p-7 transition-colors hover:bg-academy-paper-soft"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-[11px] font-semibold tracking-[0.14em] text-academy-slate-muted text-numeric">
              0{idx + 1}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[color:var(--brand-tint)]">
              <AppIcon
                name={icon}
                className="h-4 w-4 text-[color:var(--brand-deep)]"
                strokeWidth={1.6}
              />
            </span>
          </div>
          <h3 className="mt-9 font-display text-[17px] font-semibold tracking-[-0.018em] text-academy-navy">
            {title}
          </h3>
          <p className="mt-3 text-[14px] leading-relaxed text-academy-slate">
            {desc}
          </p>
        </div>
      ))}
    </div>
  );
}
