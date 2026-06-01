"use client";

import { startTransition, useEffect, useState } from "react";
import { getAvailableSlotsAction } from "@/lib/actions/availability";
import { LESSON_DURATION_MINUTES } from "@/lib/utils/slots";
import { cn } from "@/lib/utils";

interface SlotPickerProps {
  teacherId: string;
  selectedDate: Date;
  onSlotSelected: (slotStart: string, slotEnd: string) => void;
}

/**
 * Formats a "HH:MM" time string into a localized display string (e.g. "14:00").
 * The display is kept simple as HH:MM in local time.
 */
function formatSlotTime(time: string): string {
  return time;
}

/**
 * Converts a YYYY-MM-DD date string and "HH:MM" time string into an ISO-like
 * datetime string "YYYY-MM-DDTHH:MM:00" suitable for the booking RPC.
 */
function toDateTimeString(dateStr: string, time: string): string {
  return `${dateStr}T${time}:00`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function SlotPicker({ teacherId, selectedDate, onSlotSelected }: SlotPickerProps) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Build date string for the selected date
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
  const day = String(selectedDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  useEffect(() => {
    setSelectedSlot(null);
    setLoading(true);
    startTransition(async () => {
      const result = await getAvailableSlotsAction(teacherId, selectedDate.toISOString());
      setSlots(result);
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
        Loading slots…
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-[13px] text-academy-slate-muted">
        No available slots for this day.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-academy-slate-muted">
        Available times on {dateStr}
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => handleSlotClick(slot)}
            aria-pressed={selectedSlot === slot}
            className={cn(
              "rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors",
              selectedSlot === slot
                ? "border-[color:var(--brand)] bg-[color:var(--brand)] text-white"
                : "border-academy-line text-academy-navy hover:border-[color:var(--brand)]/40 hover:bg-[color:var(--brand-tint)]",
            )}
          >
            {formatSlotTime(slot)}
          </button>
        ))}
      </div>
    </div>
  );
}
