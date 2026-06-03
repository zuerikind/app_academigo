"use client";

import { startTransition, useEffect, useState } from "react";
import { getSlotsByStatusAction } from "@/lib/actions/availability";
import { useI18n } from "@/components/i18n/locale-provider";
import { LESSON_DURATION_MINUTES } from "@/lib/utils/slots";
import { cn } from "@/lib/utils";

interface SlotPickerProps {
  teacherId: string;
  selectedDate: Date;
  onSlotSelected: (slotStart: string, slotEnd: string) => void;
}

function toDateTimeString(dateStr: string, time: string): string {
  return `${dateStr}T${time}:00Z`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function SlotPicker({ teacherId, selectedDate, onSlotSelected }: SlotPickerProps) {
  const { dict } = useI18n();
  const tb = dict.bookings;

  const [available, setAvailable] = useState<string[]>([]);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const day = String(selectedDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  useEffect(() => {
    setSelectedSlot(null);
    setLoading(true);
    startTransition(async () => {
      const result = await getSlotsByStatusAction(teacherId, dateStr);
      setAvailable(result.available);
      setUnavailable(result.unavailable);
      setLoading(false);
    });
  }, [teacherId, dateStr]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSlotClick(slotTime: string) {
    setSelectedSlot(slotTime);
    const endTime = addMinutes(slotTime, LESSON_DURATION_MINUTES);
    const startISO = toDateTimeString(dateStr, slotTime);
    const endISO = toDateTimeString(dateStr, endTime);
    onSlotSelected(startISO, endISO);
  }

  if (loading) {
    return (
      <div className="flex h-16 items-center justify-center text-[13px] text-academy-slate-muted">
        {tb.loadingSlots}
      </div>
    );
  }

  if (available.length === 0 && unavailable.length === 0) {
    return (
      <p className="text-[13px] text-academy-slate-muted">{tb.noSlotsForDay}</p>
    );
  }

  // Merge and sort all slots for display order
  const allSlotTimes = [...new Set([...available, ...unavailable])].sort();
  const unavailableSet = new Set(unavailable);

  return (
    <div>
      <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-academy-slate-muted">
        {tb.availableTimesOn.replace("{date}", dateStr)}
      </p>
      <div className="flex flex-wrap gap-2">
        {allSlotTimes.map((slot) => {
          const isUnavailable = unavailableSet.has(slot);
          const isSelected = selectedSlot === slot;
          return (
            <button
              key={slot}
              onClick={() => !isUnavailable && handleSlotClick(slot)}
              disabled={isUnavailable}
              aria-pressed={isSelected}
              title={isUnavailable ? tb.slotUnavailable : undefined}
              className={cn(
                "rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors",
                isSelected &&
                  "border-[color:var(--brand)] bg-[color:var(--brand)] text-white",
                !isSelected &&
                  !isUnavailable &&
                  "border-academy-line text-academy-navy hover:border-[color:var(--brand)]/40 hover:bg-[color:var(--brand-tint)]",
                isUnavailable &&
                  "cursor-not-allowed border-academy-line/50 text-academy-slate-muted line-through opacity-50",
              )}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
