import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

type Pad = "default" | "tight" | "loose" | "flush";
type Surface = "paper" | "muted" | "ink";
type Width = "default" | "wide" | "narrow" | "prose";

const padding: Record<Pad, string> = {
  default: "py-12 sm:py-24",
  tight: "py-8 sm:py-14",
  loose: "py-16 sm:py-28 lg:py-32",
  flush: "py-0",
};

const surfaces: Record<Surface, string> = {
  paper: "bg-white",
  muted: "bg-academy-mist",
  ink: "bg-academy-navy text-white",
};

export function Section({
  children,
  className,
  surface,
  pad = "default",
  width = "default",
  divider,
  id,
  /** legacy convenience flags — kept for back-compat */
  muted,
  tight,
}: {
  children: React.ReactNode;
  className?: string;
  surface?: Surface;
  pad?: Pad;
  width?: Width;
  divider?: boolean;
  id?: string;
  muted?: boolean;
  tight?: boolean;
}) {
  const resolvedSurface: Surface = surface ?? (muted ? "muted" : "paper");
  const resolvedPad: Pad = tight ? "tight" : pad;

  return (
    <section
      id={id}
      className={cn(
        padding[resolvedPad],
        surfaces[resolvedSurface],
        divider && "hairline-t",
        className,
      )}
    >
      <Container width={width}>{children}</Container>
    </section>
  );
}
