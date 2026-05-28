import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import type { IconName } from "@/lib/icons";

export function EmptyState({
  icon,
  title,
  description,
  hint,
  actionLabel,
  actionHref,
}: {
  icon: IconName;
  title: string;
  description: string;
  hint?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-[14px] border border-academy-line bg-white">
      <div className="grid gap-6 px-6 py-14 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8 sm:px-10 sm:py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[color:var(--brand-tint)]">
          <AppIcon
            name={icon}
            className="h-5 w-5 text-[color:var(--brand-deep)]"
            strokeWidth={1.6}
          />
        </div>
        <div className="max-w-md">
          <h3 className="text-subheading text-academy-navy">{title}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-academy-slate">
            {description}
          </p>
          {hint && (
            <p className="mt-3 text-[13px] leading-relaxed text-academy-slate-muted">
              {hint}
            </p>
          )}
          {actionLabel && actionHref && (
            <Button
              href={actionHref}
              variant="primary"
              size="sm"
              className="mt-6"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
