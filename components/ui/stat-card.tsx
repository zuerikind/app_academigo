import Link from "next/link";
import { AppIcon } from "@/components/icons/app-icon";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Tone = "default" | "brand" | "calm" | "ink";

/**
 * Apple Wallet / Fitness inspired stat card:
 * generous numeric, calm caption, hairline border, optional brand or ink tone
 * for emphasis, very subtle elevation on hover.
 */
export function StatCard({
  label,
  value,
  icon,
  href,
  hrefLabel,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: IconName;
  href?: string;
  hrefLabel?: string;
  hint?: string;
  tone?: Tone;
}) {
  const surface = {
    default: "bg-white border-academy-line text-academy-navy",
    brand:
      "bg-[color:var(--brand-tint)] border-[color:var(--brand)]/20 text-[color:var(--brand-deep)]",
    calm:
      "bg-[color:var(--academy-success-soft)] border-[color:var(--academy-success)]/20 text-[color:var(--academy-success)]",
    ink: "bg-[color:var(--brand-deep)] border-[color:var(--brand-deep)] text-white",
  }[tone];

  const labelColor =
    tone === "ink"
      ? "text-white/60"
      : tone === "default"
        ? "text-academy-slate-muted"
        : "opacity-80";

  const valueColor = tone === "ink" ? "text-white" : "text-academy-navy";
  const valueColorBrand =
    tone === "brand"
      ? "text-[color:var(--brand-deep)]"
      : tone === "calm"
        ? "text-[color:var(--academy-success)]"
        : valueColor;

  const iconColor =
    tone === "ink"
      ? "text-white/70"
      : tone === "brand"
        ? "text-[color:var(--brand)]"
        : tone === "calm"
          ? "text-[color:var(--academy-success)]"
          : "text-academy-slate-muted";

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[14px] border p-5",
        "transition-shadow duration-200 hover:shadow-card",
        surface,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-meta", labelColor)}>{label}</p>
        <AppIcon
          name={icon}
          className={cn("h-4 w-4", iconColor)}
          strokeWidth={1.6}
        />
      </div>

      <p
        className={cn(
          "mt-6 font-display text-[34px] font-semibold leading-none tracking-tight text-numeric",
          valueColorBrand,
        )}
      >
        {value}
      </p>

      {hint && (
        <p
          className={cn(
            "mt-1.5 text-[12px] leading-snug",
            tone === "ink" ? "text-white/55" : "text-academy-slate-muted",
          )}
        >
          {hint}
        </p>
      )}

      {href && hrefLabel && (
        <Link
          href={href}
          className={cn(
            "mt-5 inline-flex items-center gap-1 text-[12px] font-medium",
            tone === "ink"
              ? "text-white/85 hover:text-white"
              : "text-[color:var(--brand-deep)] hover:text-academy-navy",
          )}
        >
          {hrefLabel}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      )}
    </div>
  );
}
