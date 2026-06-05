"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export type TeacherPerfRow = {
  id: string;
  name: string;
  level: "junior" | "academigo_teacher" | "verified";
  sessions: number;
  teacherPayout: number;
  studentRevenue: number;
  platformMargin: number;
  marginPct: number;
  avgRating: number | null;
  reviewCount: number;
};

type SortKey = keyof Pick<
  TeacherPerfRow,
  "sessions" | "teacherPayout" | "studentRevenue" | "platformMargin" | "marginPct" | "avgRating" | "reviewCount"
>;

const LEVEL_BADGE: Record<TeacherPerfRow["level"], { variant: "warning" | "brand" | "verified"; label: string }> = {
  junior: { variant: "warning", label: "Junior" },
  academigo_teacher: { variant: "brand", label: "Academigo" },
  verified: { variant: "verified", label: "Verified" },
};

function Stars({ value }: { value: number }) {
  return (
    <span className="text-[13px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? "text-yellow-500" : "text-academy-slate-muted"}>★</span>
      ))}
      <span className="ml-1 text-[12px] text-academy-slate">{value.toFixed(1)}</span>
    </span>
  );
}

function SortTh({ label, k, sortKey, sortDir, onSort }: {
  label: string; k: SortKey; sortKey: SortKey; sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => onSort(k)}
        className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-academy-slate hover:text-academy-navy"
      >
        {label}
        <span className="text-[9px]">{active ? (sortDir === "desc" ? "▼" : "▲") : "⇅"}</span>
      </button>
    </th>
  );
}

export function TeacherAnalyticsTable({
  rows,
  labels,
}: {
  rows: TeacherPerfRow[];
  labels: {
    colName: string; colLevel: string; colSessions: string; colRating: string;
    colReviews: string; colStudentRevenue: string; colTeacherPayout: string;
    colMargin: string; colMarginPct: string; noRating: string; empty: string;
  };
}) {
  const [sortKey, setSortKey] = useState<SortKey>("sessions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(k: SortKey) {
    if (k === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(k); setSortDir("desc"); }
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? -Infinity;
    const bv = b[sortKey] ?? -Infinity;
    return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
  });

  if (sorted.length === 0) {
    return <p className="py-10 text-center text-[13px] text-academy-slate">{labels.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead className="border-b border-academy-line bg-academy-mist/50">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-academy-slate">{labels.colName}</th>
            <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-academy-slate">{labels.colLevel}</th>
            <SortTh label={labels.colSessions} k="sessions" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortTh label={labels.colRating} k="avgRating" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortTh label={labels.colReviews} k="reviewCount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortTh label={labels.colStudentRevenue} k="studentRevenue" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortTh label={labels.colTeacherPayout} k="teacherPayout" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortTh label={labels.colMargin} k="platformMargin" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            <SortTh label={labels.colMarginPct} k="marginPct" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-academy-line">
          {sorted.map((row) => {
            const badge = LEVEL_BADGE[row.level];
            const marginColor = row.platformMargin >= 0 ? "text-green-600" : "text-red-600";
            return (
              <tr key={row.id} className="transition-colors hover:bg-academy-mist/40">
                <td className="px-4 py-3.5 text-[13px] font-medium text-academy-navy">{row.name}</td>
                <td className="px-4 py-3.5"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                <td className="px-4 py-3.5 text-[13px] text-academy-navy">{row.sessions}</td>
                <td className="px-4 py-3.5">
                  {row.avgRating !== null
                    ? <Stars value={row.avgRating} />
                    : <span className="text-[12px] text-academy-slate-muted">{labels.noRating}</span>}
                </td>
                <td className="px-4 py-3.5 text-[13px] text-academy-navy">{row.reviewCount}</td>
                <td className="px-4 py-3.5 text-[13px] text-academy-navy">CHF {row.studentRevenue.toFixed(2)}</td>
                <td className="px-4 py-3.5 text-[13px] text-academy-navy">CHF {row.teacherPayout.toFixed(2)}</td>
                <td className={`px-4 py-3.5 text-[13px] font-medium ${marginColor}`}>CHF {row.platformMargin.toFixed(2)}</td>
                <td className={`px-4 py-3.5 text-[13px] font-medium ${marginColor}`}>{row.marginPct.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
