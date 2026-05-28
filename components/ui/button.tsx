import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "ghost"
  | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";
type ButtonShape = "rounded" | "pill";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[color:var(--brand-deep)] text-white border border-[color:var(--brand-deep)] " +
    "hover:bg-[color:var(--academy-navy)] hover:border-[color:var(--academy-navy)] " +
    "shadow-[var(--shadow-button)]",
  secondary:
    "bg-white text-academy-navy border border-academy-line " +
    "hover:border-[color:var(--brand)]/40 hover:bg-academy-mist",
  accent:
    "bg-[color:var(--brand)] text-white border border-[color:var(--brand)] " +
    "hover:bg-[color:var(--brand-deep)] hover:border-[color:var(--brand-deep)] " +
    "shadow-[var(--shadow-button)]",
  outline:
    "bg-transparent text-academy-navy border border-academy-line " +
    "hover:border-[color:var(--brand)]/40 hover:text-[color:var(--brand-deep)]",
  ghost:
    "bg-transparent text-academy-navy border border-transparent " +
    "hover:bg-academy-mist",
  link:
    "bg-transparent text-[color:var(--brand-deep)] border-0 px-0 py-0 " +
    "underline-offset-4 hover:underline",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-[15px] gap-2",
  icon: "h-9 w-9 p-0",
};

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  external?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  name?: string;
  value?: string;
  ariaLabel?: string;
};

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  shape = "rounded",
  className,
  disabled,
  type = "button",
  external,
  onClick,
  fullWidth,
  name,
  value,
  ariaLabel,
}: ButtonProps) {
  const radius =
    variant === "link"
      ? ""
      : shape === "pill"
        ? "rounded-full"
        : "rounded-[10px]";

  const base = cn(
    "inline-flex items-center justify-center font-medium tracking-tight",
    "btn-tactile",
    "disabled:pointer-events-none disabled:opacity-50",
    variant !== "link" && sizes[size],
    radius,
    variants[variant],
    fullWidth && "w-full",
    className,
  );

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={base}
          aria-label={ariaLabel}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={base} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
      name={name}
      value={value}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
