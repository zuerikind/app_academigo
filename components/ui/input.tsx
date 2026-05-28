import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-[10px] border border-academy-line bg-white px-3.5 py-2.5 text-[14px] text-academy-navy " +
  "placeholder:text-academy-slate-soft outline-none " +
  "transition-[border-color,box-shadow] duration-150 " +
  "hover:border-academy-line-strong " +
  "focus:border-[color:var(--brand)] focus:ring-4 focus:ring-[color:var(--brand)]/12 " +
  "disabled:cursor-not-allowed disabled:bg-academy-mist disabled:text-academy-slate-muted";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={4}
      className={cn(fieldBase, "min-h-[6.5rem] resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          fieldBase,
          "appearance-none pr-10",
          "[background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 viewBox=%220 0 16 16%22><path stroke=%22%2364748b%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m4 6 4 4 4-4%22/></svg>')]",
          "bg-[length:1rem_1rem] bg-[position:right_0.75rem_center] bg-no-repeat",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function Label({
  children,
  htmlFor,
  className,
  hint,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "mb-1.5 flex items-baseline justify-between gap-3",
        className,
      )}
    >
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-academy-navy"
      >
        {children}
      </label>
      {hint && (
        <span className="text-[11px] text-academy-slate-muted">{hint}</span>
      )}
    </div>
  );
}

export function Field({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}
