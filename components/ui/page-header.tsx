import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
  size = "md",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const headingClass =
    size === "lg"
      ? "text-display"
      : size === "sm"
        ? "text-subheading"
        : "text-heading";

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && <p className="text-meta-brand mb-3 dot-accent">{eyebrow}</p>}
      <h1 className={cn(headingClass, "text-academy-navy")}>{title}</h1>
      {description && (
        <p className="text-lead mt-4 max-w-xl">{description}</p>
      )}
      {children && <div className="mt-7">{children}</div>}
    </div>
  );
}

export function SectionHeader({
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
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-xl">
        {eyebrow && <p className="text-meta-brand mb-2">{eyebrow}</p>}
        <h2 className="text-heading text-academy-navy">{title}</h2>
        {description && (
          <p className="mt-2 text-[14.5px] leading-relaxed text-academy-slate">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
