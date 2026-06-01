import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const brandAssetPaths = {
  icon: "/brand/logo-icon.png",
  full: "/brand/logo-full.png",
} as const;

function LogoTile({
  children,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  const sizes = {
    sm: "h-10 w-10 p-1.5",
    md: "h-11 w-11 p-2",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-white/90",
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Academigo brand mark — logo assets in /public/brand/.
 * `layout="full"` — stacked icon + wordmark image (nav on white backgrounds).
 * `layout="stacked"` — centered icon + wordmark in a white tile (dark panels).
 * `layout="compact"` — circle-A icon only (sidebar, mobile).
 */
export function BrandMark({
  href = "/",
  label = "Academigo",
  className,
  variant = "dark",
  layout = "compact",
  showWordmark = true,
}: {
  href?: string;
  label?: string;
  className?: string;
  variant?: "dark" | "light";
  layout?: "compact" | "full" | "stacked";
  /** @deprecated Use layout="full" instead */
  showMonogram?: boolean;
  /** Ignored when layout="full" or layout="stacked". */
  showWordmark?: boolean;
}) {
  const onDark = variant === "light";
  const useFull = layout === "full";
  const useStacked = layout === "stacked";

  const icon = (
    <Image
      src={brandAssetPaths.icon}
      alt=""
      width={40}
      height={40}
      priority={useFull || useStacked}
      className="h-8 w-8 object-contain object-center sm:h-9 sm:w-9"
      aria-hidden
    />
  );

  const fullLogo = (
    <Image
      src={brandAssetPaths.full}
      alt=""
      width={220}
      height={132}
      priority
      className="h-[3.25rem] w-auto max-w-[min(220px,70vw)] object-contain object-center sm:h-[3.75rem]"
      aria-hidden
    />
  );

  const stackedLogo = (
    <span className="inline-flex size-[7.5rem] flex-col items-center justify-center rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-white/90">
      <Image
        src={brandAssetPaths.icon}
        alt=""
        width={48}
        height={48}
        priority
        className="h-10 w-10 shrink-0 object-contain object-center"
        aria-hidden
      />
      <span className="mt-2 font-display text-[14px] font-bold leading-none tracking-[-0.018em] text-academy-navy">
        {label}
      </span>
    </span>
  );

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]/40 focus-visible:ring-offset-2",
        useFull ? "items-center gap-0" : useStacked ? "items-center" : "items-center gap-2.5",
        !useFull && !useStacked && showWordmark && onDark && "text-white",
        !useFull && !useStacked && showWordmark && !onDark && "text-academy-navy",
        className,
      )}
      aria-label={label}
    >
      {useStacked ? (
        stackedLogo
      ) : useFull ? (
        fullLogo
      ) : (
        <>
          {onDark ? <LogoTile size="sm">{icon}</LogoTile> : icon}
          {showWordmark && (
            <span className="font-display text-[15px] font-bold tracking-[-0.018em]">
              {label}
            </span>
          )}
        </>
      )}
    </Link>
  );
}
