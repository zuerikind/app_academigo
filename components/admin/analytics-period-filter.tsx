"use client";

import { useRouter } from "next/navigation";

const PERIODS = [
  "all",
  "this_month",
  "last_month",
  "last_30",
  "last_90",
  "ytd",
] as const;

type Period = (typeof PERIODS)[number];

export function AnalyticsPeriodFilter({
  current,
  basePath,
  labels,
}: {
  current: string;
  basePath: string;
  labels: Record<string, string>;
}) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const p = e.target.value;
    if (p === "all") {
      router.push(basePath);
    } else {
      router.push(`${basePath}?period=${p}`);
    }
  }

  const value = (PERIODS as readonly string[]).includes(current) ? current : "all";

  return (
    <div className="flex items-center gap-2">
      <label className="text-[12px] font-medium text-academy-slate">{labels.periodLabel}</label>
      <select
        value={value}
        onChange={onChange}
        className="rounded-[8px] border border-academy-line bg-white px-3 py-1.5 text-[13px] text-academy-navy focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/30"
      >
        {PERIODS.map((p) => (
          <option key={p} value={p}>
            {labels[`period${p.split("_").map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? p}
          </option>
        ))}
      </select>
    </div>
  );
}
