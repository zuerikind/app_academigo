"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cancelBooking } from "@/lib/actions/bookings";
import { ReviewForm } from "@/components/student/review-form";
import type { BookingWithRelations } from "@/lib/queries/bookings";

interface StudentBookingCardProps {
  booking: BookingWithRelations;
}

function CancelButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center justify-center rounded-[10px] border border-academy-line bg-white px-3 text-[13px] font-medium text-academy-navy transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Cancelling…" : label}
    </button>
  );
}

function CancelForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(cancelBooking, {});
  return (
    <form action={action}>
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error && (
        <p className="mb-1 text-sm text-red-600">{state.error}</p>
      )}
      <CancelButton label="Cancel booking" />
    </form>
  );
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({
  status,
}: {
  status: "pending" | "confirmed" | "completed" | "cancelled";
}) {
  const styles: Record<typeof status, string> = {
    pending:
      "bg-yellow-50 text-yellow-700 border border-yellow-200",
    confirmed:
      "bg-green-50 text-green-700 border border-green-200",
    completed:
      "bg-blue-50 text-blue-700 border border-blue-200",
    cancelled:
      "bg-academy-mist text-academy-slate-muted border border-academy-line",
  };
  const labels: Record<typeof status, string> = {
    pending: "Pending review",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function StudentBookingCard({ booking }: StudentBookingCardProps) {
  const teacherName = booking.teacher?.profiles?.full_name ?? "Teacher";
  const isUpcoming = new Date(booking.start_time) > new Date();

  return (
    <div className="rounded-[14px] border border-academy-line bg-white p-5 shadow-sm transition-shadow hover:shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-academy-navy">{teacherName}</p>
          <p className="mt-0.5 text-sm text-academy-slate">
            {formatDateTime(booking.start_time)}
          </p>
          {booking.topic_note && (
            <p className="mt-1 text-[13px] text-academy-slate-muted">
              Topic: {booking.topic_note}
            </p>
          )}
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {booking.status === "pending" && (
          <>
            <p className="text-[13px] text-academy-slate-muted">
              1 credit reserved
            </p>
            <CancelForm bookingId={booking.id} />
          </>
        )}

        {booking.status === "confirmed" && isUpcoming && (
          <>
            {booking.meeting_link ? (
              <a
                href={booking.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[color:var(--brand-deep)] px-4 text-sm font-medium text-white shadow-[var(--shadow-button)] transition-colors hover:bg-[color:var(--academy-navy)]"
              >
                Join Lesson
              </a>
            ) : (
              <button
                disabled
                className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-[10px] border border-academy-line bg-academy-mist px-4 text-sm font-medium text-academy-slate-muted opacity-50"
              >
                Waiting for teacher…
              </button>
            )}
            <a
              href={`/api/bookings/${booking.id}/ics`}
              className="inline-flex h-8 items-center justify-center rounded-[10px] border border-academy-line bg-white px-3 text-[13px] font-medium text-academy-navy transition-colors hover:border-[color:var(--brand)]/40 hover:bg-academy-mist"
            >
              Add to calendar
            </a>
            <CancelForm bookingId={booking.id} />
          </>
        )}

        {booking.status === "completed" && (
          <ReviewForm
            bookingId={booking.id}
            hasReview={booking.review !== null && booking.review !== undefined}
          />
        )}

        {booking.status === "cancelled" && (
          <p className="text-[13px] text-academy-slate-muted">
            This booking was cancelled.
          </p>
        )}
      </div>
    </div>
  );
}
