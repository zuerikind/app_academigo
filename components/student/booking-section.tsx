"use client";

import { useState } from "react";
import { BookingCalendar } from "@/components/student/booking-calendar";
import { SlotPicker } from "@/components/student/slot-picker";
import { BookingRequestForm } from "@/components/student/booking-request-form";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface BookingSectionProps {
  teacherId: string;
  teacherName: string;
  subjects: Subject[];
  initialAvailableDays: number[];
  initialYear: number;
  initialMonth: number; // 0-indexed
}

export function BookingSection({
  teacherId,
  teacherName,
  subjects,
  initialAvailableDays,
  initialYear,
  initialMonth,
}: BookingSectionProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth); // 0-indexed
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [selectedSlotEnd, setSelectedSlotEnd] = useState<string | null>(null);

  function handleDaySelected(day: number, year: number, month: number) {
    setSelectedDay(day);
    setSelectedYear(year);
    setSelectedMonth(month);
    // Reset slot selection when day changes
    setSelectedSlotStart(null);
    setSelectedSlotEnd(null);
  }

  function handleSlotSelected(slotStart: string, slotEnd: string) {
    setSelectedSlotStart(slotStart);
    setSelectedSlotEnd(slotEnd);
  }

  const selectedDate =
    selectedDay !== null
      ? new Date(selectedYear, selectedMonth, selectedDay)
      : null;

  return (
    <div className="space-y-6">
      <BookingCalendar
        teacherId={teacherId}
        initialAvailableDays={initialAvailableDays}
        initialYear={initialYear}
        initialMonth={initialMonth}
        onDaySelected={handleDaySelected}
      />

      {selectedDate && (
        <div className="border-t border-academy-line pt-6">
          <SlotPicker
            teacherId={teacherId}
            selectedDate={selectedDate}
            onSlotSelected={handleSlotSelected}
          />
        </div>
      )}

      {selectedSlotStart && selectedSlotEnd && (
        <div className="border-t border-academy-line pt-6">
          <BookingRequestForm
            teacherId={teacherId}
            selectedSlotStart={selectedSlotStart}
            selectedSlotEnd={selectedSlotEnd}
            teacherName={teacherName}
            subjects={subjects}
          />
        </div>
      )}
    </div>
  );
}
