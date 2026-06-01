"use client";

import { startTransition, useState } from "react";
import { getAvailableDaysAction } from "@/lib/actions/availability";
import { cn } from "@/lib/utils";

const DAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface BookingCalendarProps {
  teacherId: string;
  initialAvailableDays: number[];
  initialYear: number;
  initialMonth: number; // 0-indexed
  onDaySelected: (day: number, year: number, month: number) => void;
}

export function BookingCalendar({
  teacherId,
  initialAvailableDays,
  initialYear,
  initialMonth,
  onDaySelected,
}: BookingCalendarProps) {
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth); // 0-indexed
  const [availableDays, setAvailableDays] = useState<number[]>(initialAvailableDays);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Compute calendar grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // getDay() returns 0=Sunday...6=Saturday; we want Mon=0...Sun=6
  const rawFirstDay = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayOffset = (rawFirstDay + 6) % 7; // shift so Monday=0

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  function navigateMonth(delta: number) {
    const date = new Date(currentYear, currentMonth + delta, 1);
    const newYear = date.getFullYear();
    const newMonth = date.getMonth(); // 0-indexed

    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDay(null);
    setLoading(true);

    startTransition(async () => {
      // getAvailableDaysForMonth uses 1-indexed months
      const days = await getAvailableDaysAction(teacherId, newYear, newMonth + 1);
      setAvailableDays(days);
      setLoading(false);
    });
  }

  function handleDayClick(day: number) {
    if (!availableDays.includes(day)) return;
    setSelectedDay(day);
    onDaySelected(day, currentYear, currentMonth);
  }

  const cells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          disabled={loading}
          className="rounded-md border border-academy-line px-2.5 py-1 text-[13px] text-academy-slate transition-colors hover:border-[color:var(--brand)]/40 hover:text-academy-navy disabled:opacity-40"
          aria-label="Previous month"
        >
          ← Prev
        </button>
        <span className="font-display text-[14px] font-semibold text-academy-navy">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <button
          onClick={() => navigateMonth(1)}
          disabled={loading}
          className="rounded-md border border-academy-line px-2.5 py-1 text-[13px] text-academy-slate transition-colors hover:border-[color:var(--brand)]/40 hover:text-academy-navy disabled:opacity-40"
          aria-label="Next month"
        >
          Next →
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_HEADERS.map((h) => (
          <div
            key={h}
            className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-academy-slate-muted"
          >
            {h}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-[13px] text-academy-slate-muted">
          Loading…
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px rounded-md bg-academy-line">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="bg-white p-1"
                  aria-hidden="true"
                />
              );
            }

            const isAvailable = availableDays.includes(day);
            const isSelected = selectedDay === day;
            const isPast = isCurrentMonth && day < today.getDate();

            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                disabled={!isAvailable || isPast}
                aria-pressed={isSelected}
                className={cn(
                  "relative bg-white p-1 text-center text-[13px] transition-colors",
                  isSelected &&
                    "bg-[color:var(--brand)] font-semibold text-white",
                  !isSelected &&
                    isAvailable &&
                    !isPast &&
                    "cursor-pointer bg-[color:var(--brand-tint)] font-semibold text-[color:var(--brand-deep)] hover:bg-[color:var(--brand)]/20",
                  (!isAvailable || isPast) &&
                    !isSelected &&
                    "cursor-default text-academy-slate-muted",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-academy-slate-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--brand-tint)]" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--brand)]" />
          Selected
        </span>
      </div>
    </div>
  );
}
