import { cn } from "@/lib/utils";

type Padding = "default" | "compact" | "loose" | "none";
type Tone = "paper" | "muted" | "inset" | "brand";
type Elevation = "flat" | "soft" | "raised";

const paddings: Record<Padding, string> = {
  default: "p-6",
  compact: "p-5",
  loose: "p-7 sm:p-9",
  none: "p-0",
};

const tones: Record<Tone, string> = {
  paper: "bg-white border-academy-line",
  muted: "bg-academy-mist border-academy-line",
  inset: "bg-academy-paper-soft border-academy-line-soft",
  brand: "bg-[color:var(--brand-deep)] text-white border-[color:var(--brand-deep)]",
};

const elevations: Record<Elevation, string> = {
  flat: "",
  soft: "shadow-soft",
  raised: "shadow-card",
};

export function Card({
  children,
  className,
  highlight,
  padding = "default",
  tone = "paper",
  elevation = "flat",
  interactive,
}: {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  padding?: Padding;
  tone?: Tone;
  elevation?: Elevation;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border transition-colors duration-200",
        tones[tone],
        paddings[padding],
        elevations[elevation],
        highlight && "border-[color:var(--brand)]/40 ring-1 ring-[color:var(--brand)]/15",
        interactive && "hover:border-[color:var(--brand)]/30 hover:shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-meta mb-1.5">{eyebrow}</p>}
        <h3 className="text-subheading text-academy-navy">{title}</h3>
        {description && (
          <p className="mt-1 text-[13.5px] leading-relaxed text-academy-slate">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
