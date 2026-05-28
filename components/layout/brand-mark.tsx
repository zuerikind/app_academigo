import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand mark — wordmark with a small brand-blue square monogram.
 * Apple-leaning restraint: tight tracking, subtle hover.
 */
export function BrandMark({
  href = "/",
  label = "Academigo",
  className,
  variant = "dark",
  showMonogram = true,
}: {
  href?: string;
  label?: string;
  className?: string;
  variant?: "dark" | "light";
  showMonogram?: boolean;
}) {
  const color = variant === "light" ? "text-white" : "text-academy-navy";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 font-display text-[15px] font-bold tracking-[-0.018em]",
        color,
        className,
      )}
      aria-label={label}
    >
      {showMonogram && (
        <span
          aria-hidden
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-[7px] text-[11px] font-bold leading-none",
            "transition-transform duration-200 group-hover:scale-[1.03]",
            variant === "light"
              ? "bg-white/12 text-white"
              : "bg-[color:var(--brand-deep)] text-white",
          )}
        >
          A
        </span>
      )}
      <span>{label}</span>
    </Link>
  );
}
