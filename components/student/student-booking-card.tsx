"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { cancelBooking } from "@/lib/actions/bookings";
import { ReviewForm } from "@/components/student/review-form";
import { useI18n } from "@/components/i18n/locale-provider";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { BookingWithRelations } from "@/lib/queries/bookings";

interface StudentBookingCardProps {
  booking: BookingWithRelations;
}

function CancelButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-8 items-center justify-center rounded-[10px] border border-academy-line bg-white px-3 text-[13px] font-medium text-academy-navy transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function CancelForm({ bookingId }: { bookingId: string }) {
  const { dict } = useI18n();
  const tb = dict.bookings;
  const [state, action] = useActionState(cancelBooking, {});
  return (
    <form action={action}>
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error && <p className="mb-1 text-sm text-red-600">{state.error}</p>}
      <CancelButton label={tb.cancelBooking} pendingLabel={tb.cancelling} />
    </form>
  );
}

function formatSessionTime(start: string, end: string, locale: string) {
  const dateLocale = locale === "de" ? "de-CH" : "en-CH";
  const s = new Date(start);
  const e = new Date(end);
  const date = s.toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const startTime = s.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  const endTime = e.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  return `${date} · ${startTime} – ${endTime}`;
}

export function StudentBookingCard({ booking }: StudentBookingCardProps) {
  const { dict, locale } = useI18n();
  const tb = dict.bookings;

  const statusStyles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    confirmed: "bg-green-50 text-green-700 border border-green-200",
    completed: "bg-blue-50 text-blue-700 border border-blue-200",
    cancelled: "bg-academy-mist text-academy-slate-muted border border-academy-line",
  };
  const statusLabels: Record<string, string> = {
    pending: tb.pendingReview,
    confirmed: tb.statusConfirmed,
    completed: tb.statusCompleted,
    cancelled: tb.statusCancelled,
  };

  const teacherName = booking.teacher?.profiles?.full_name ?? "Teacher";
  const isUpcoming = new Date(booking.start_time) > new Date();

  return (
    <div className="rounded-[14px] border border-academy-line bg-white p-5 shadow-sm transition-shadow hover:shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-academy-navy">{teacherName}</p>
          <p className="mt-0.5 text-sm text-academy-slate">
            {formatSessionTime(booking.start_time, booking.end_time, locale)}
          </p>
          {booking.subjects.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {booking.subjects.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center rounded-full border border-[color:var(--brand)]/30 bg-[color:var(--brand)]/8 px-2 py-0.5 text-[11px] font-medium text-[color:var(--brand-deep)]"
                >
                  {translateSubjectName(dict, s.slug, s.name)}
                </span>
              ))}
            </div>
          )}
          {booking.topic_note && (
            <p className="mt-1 text-[13px] text-academy-slate-muted">
              {tb.topic} {booking.topic_note}
            </p>
          )}
          <p className="mt-1 text-[12px] text-academy-slate-muted">
            {tb.creditsLabel} {booking.credits_reserved}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${statusStyles[booking.status] ?? ""}`}>
          {statusLabels[booking.status] ?? booking.status}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {booking.status === "pending" && (
          <CancelForm bookingId={booking.id} />
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
                {tb.joinLesson}
              </a>
            ) : (
              <button
                disabled
                className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-[10px] border border-academy-line bg-academy-mist px-4 text-sm font-medium text-academy-slate-muted opacity-50"
              >
                {tb.waitingForTeacher}
              </button>
            )}
            <a
              href={`/api/bookings/${booking.id}/ics`}
              className="inline-flex h-8 items-center justify-center rounded-[10px] border border-academy-line bg-white px-3 text-[13px] font-medium text-academy-navy transition-colors hover:border-[color:var(--brand)]/40 hover:bg-academy-mist"
            >
              {tb.addToCalendar}
            </a>
            <CancelForm bookingId={booking.id} />
          </>
        )}

        {booking.status === "completed" && (
          <div className="mt-2 rounded-[12px] border border-academy-line bg-academy-mist p-4">
            <p className="mb-0.5 text-[13px] font-semibold text-academy-navy">
              {dict.reviews.feedbackTitle}
            </p>
            <p className="mb-3 text-[12px] text-academy-slate-muted">
              {dict.reviews.feedbackSubtitle}
            </p>
            <ReviewForm
              bookingId={booking.id}
              hasReview={booking.review !== null && booking.review !== undefined}
            />
          </div>
        )}

        {booking.status === "cancelled" && (
          <p className="text-[13px] text-academy-slate-muted">{tb.bookingCancelled}</p>
        )}
      </div>
    </div>
  );
}
