import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "verified"
  | "muted"
  | "warning"
  | "outline"
  | "dark"
  | "brand"
  | "accent";

const variants: Record<Variant, string> = {
  default: "bg-academy-mist text-academy-navy border-academy-line",
  verified:
    "bg-[color:var(--academy-success-soft)] text-[color:var(--academy-success)] border-[color:var(--academy-success)]/20",
  muted: "bg-academy-mist text-academy-slate border-academy-line",
  warning:
    "bg-[color:var(--academy-warning-soft)] text-[color:var(--academy-warning)] border-[color:var(--academy-warning)]/25",
  outline: "bg-transparent text-academy-slate border-academy-line",
  dark: "bg-[color:var(--brand-deep)] text-white border-[color:var(--brand-deep)]",
  brand: "bg-[color:var(--brand-tint)] text-[color:var(--brand-deep)] border-[color:var(--brand)]/20",
  accent:
    "bg-[color:var(--accent-blue-soft)] text-[color:var(--accent-blue)] border-[color:var(--accent-blue)]/20",
};

export function Badge({
  children,
  className,
  variant = "default",
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  size?: "sm" | "md";
}) {
  const sizing =
    size === "sm"
      ? "h-5 px-1.5 text-[10px]"
      : "h-[22px] px-2 text-[11px]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] border font-medium tracking-wide",
        sizing,
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
