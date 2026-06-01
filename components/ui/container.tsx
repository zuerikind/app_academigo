import { cn } from "@/lib/utils";

type Width = "default" | "wide" | "narrow" | "prose";

const widths: Record<Width, string> = {
  default: "max-w-6xl",
  wide: "max-w-7xl",
  narrow: "max-w-4xl",
  prose: "max-w-2xl",
};

export function Container({
  children,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: Width;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-8 lg:px-10",
        widths[width],
        className,
      )}
    >
      {children}
    </div>
  );
}
