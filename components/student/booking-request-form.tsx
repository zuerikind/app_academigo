"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestBooking } from "@/lib/actions/bookings";

interface BookingRequestFormProps {
  teacherId: string;
  selectedSlotStart: string; // "YYYY-MM-DDTHH:MM:00"
  selectedSlotEnd: string;   // "YYYY-MM-DDTHH:MM:00"
  teacherName: string;
}

function formatSlotDisplay(isoStart: string, isoEnd: string): string {
  try {
    const start = new Date(isoStart);
    const end = new Date(isoEnd);
    const dateStr = start.toLocaleDateString("en-CH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/Zurich",
    });
    const startTime = start.toLocaleTimeString("en-CH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Zurich",
    });
    const endTime = end.toLocaleTimeString("en-CH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Zurich",
    });
    return `${dateStr} · ${startTime}–${endTime}`;
  } catch {
    return `${isoStart} – ${isoEnd}`;
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-[color:var(--brand)] px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Requesting…" : "Request booking"}
    </button>
  );
}

export function BookingRequestForm({
  teacherId,
  selectedSlotStart,
  selectedSlotEnd,
  teacherName,
}: BookingRequestFormProps) {
  const [state, action] = useActionState(requestBooking, {});

  if (state.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-[13.5px] text-green-800">
        <p className="font-semibold">Booking requested!</p>
        <p className="mt-1">
          Your slot is reserved while {teacherName} reviews your request. You will receive a
          confirmation email once they confirm.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="rounded-md border border-academy-line bg-academy-mist px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-academy-slate-muted">
          Selected slot
        </p>
        <p className="mt-0.5 text-[13.5px] font-medium text-academy-navy">
          {formatSlotDisplay(selectedSlotStart, selectedSlotEnd)}
        </p>
        <p className="mt-0.5 text-[12px] text-academy-slate-muted">
          with {teacherName}
        </p>
      </div>

      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="startTime" value={selectedSlotStart} />
      <input type="hidden" name="endTime" value={selectedSlotEnd} />

      <div>
        <label
          htmlFor="topicNote"
          className="mb-1.5 block text-[13px] font-medium text-academy-navy"
        >
          What would you like to work on?{" "}
          <span className="font-normal text-academy-slate-muted">(optional)</span>
        </label>
        <textarea
          id="topicNote"
          name="topicNote"
          rows={3}
          placeholder="e.g. Quadratic equations, exam prep for Matura, grammar review…"
          className="w-full rounded-lg border border-academy-line bg-white px-3 py-2 text-[13.5px] text-academy-navy placeholder:text-academy-slate-muted focus:border-[color:var(--brand)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
