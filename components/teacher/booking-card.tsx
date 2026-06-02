"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle, AlertCircle, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/locale-provider";
import { translateSubjectName } from "@/lib/i18n/subjects";
import {
  confirmBooking,
  declineBooking,
  markComplete,
  cancelBookingAsTeacher,
  updateBookingMeetLink,
} from "@/lib/actions/bookings";
import type { BookingWithRelations } from "@/lib/queries/bookings";

function SubmitButton({ label, pendingLabel, variant = "primary" }: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function formatDate(iso: string, locale: string) {
  const dateLocale = locale === "de" ? "de-CH" : "en-CH";
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" }),
  };
}

function PendingCard({
  booking,
  teacherDefaultMeetLink,
}: {
  booking: BookingWithRelations;
  teacherDefaultMeetLink: string | null;
}) {
  const { dict, locale } = useI18n();
  const tb = dict.bookings;
  const [confirmState, confirmAction] = useActionState(confirmBooking, {});
  const [declineState, declineAction] = useActionState(declineBooking, {});

  const studentName = booking.student?.profiles.full_name ?? "Student";
  const start = formatDate(booking.start_time, locale);
  const end = formatDate(booking.end_time, locale);

  return (
    <Card padding="compact" elevation="soft" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{studentName}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {start.date} · {start.time} – {end.time}
          </p>
          {booking.subjects.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
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
            <p className="mt-1 text-[12px] text-academy-slate">
              <span className="font-medium">{tb.topic}</span> {booking.topic_note}
            </p>
          )}
        </div>
        <Badge variant="warning">{tb.statusPending}</Badge>
      </div>

      {/* Confirm form */}
      <div className="rounded-[10px] border border-academy-line bg-academy-mist p-4 space-y-3">
        <p className="text-[12px] font-semibold text-academy-navy uppercase tracking-wide">
          {tb.confirmBookingTitle}
        </p>

        {teacherDefaultMeetLink === null && (
          <div className="flex items-start gap-2 rounded-[8px] border border-[color:var(--academy-warning)]/30 bg-[color:var(--academy-warning-soft)] p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--academy-warning)]" />
            <div className="text-[12px] text-[color:var(--academy-warning)]">
              <p>{tb.noMeetLinkWarning}</p>
              <p className="mt-1">
                <a href="../settings" className="underline font-medium">{tb.settingsLink}</a>
              </p>
            </div>
          </div>
        )}

        <form action={confirmAction} className="space-y-3">
          <input type="hidden" name="bookingId" value={booking.id} />
          <Field>
            <Label htmlFor={`meetLink-${booking.id}`}>{tb.meetLinkFieldLabel}</Label>
            <Input
              id={`meetLink-${booking.id}`}
              type="url"
              name="meetingLink"
              defaultValue={teacherDefaultMeetLink ?? ""}
              placeholder={tb.meetLinkPlaceholder}
              required
            />
          </Field>
          {confirmState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{confirmState.error}</p>
          )}
          <SubmitButton label={tb.confirmBookingTitle} pendingLabel={tb.confirming} />
        </form>
      </div>

      {/* Decline form */}
      <div className="rounded-[10px] border border-academy-line bg-white p-4 space-y-3">
        <p className="text-[12px] font-semibold text-academy-navy uppercase tracking-wide">
          {tb.declineTitle}
        </p>
        <form action={declineAction} className="space-y-3">
          <input type="hidden" name="bookingId" value={booking.id} />
          {declineState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{declineState.error}</p>
          )}
          <SubmitButton label={tb.decline} pendingLabel={tb.declining} variant="outline" />
        </form>
      </div>
    </Card>
  );
}

function ConfirmedCard({ booking }: { booking: BookingWithRelations }) {
  const { dict, locale } = useI18n();
  const tb = dict.bookings;
  const [updateLinkState, updateLinkAction] = useActionState(updateBookingMeetLink, {});
  const [markCompleteState, markCompleteAction] = useActionState(markComplete, {});
  const [cancelState, cancelAction] = useActionState(cancelBookingAsTeacher, {});

  const studentName = booking.student?.profiles.full_name ?? "Student";
  const start = formatDate(booking.start_time, locale);
  const end = formatDate(booking.end_time, locale);
  const isPast = new Date(booking.start_time) < new Date();

  return (
    <Card padding="compact" elevation="soft" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{studentName}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {start.date} · {start.time} – {end.time}
          </p>
          {booking.subjects.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
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
            <p className="mt-1 text-[12px] text-academy-slate">
              <span className="font-medium">{tb.topic}</span> {booking.topic_note}
            </p>
          )}
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {tb.creditsLabel} {booking.credits_reserved}
          </p>
        </div>
        <Badge variant="verified">{tb.statusConfirmed}</Badge>
      </div>

      {/* Meet Link Status */}
      {booking.meeting_link !== null ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[color:var(--academy-success)]" />
            <Badge variant="verified">{tb.meetLinkAdded}</Badge>
            <a
              href={booking.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px] text-[color:var(--brand-deep)] hover:underline truncate max-w-[220px]"
            >
              <Link2 className="h-3 w-3 shrink-0" />
              {booking.meeting_link}
            </a>
          </div>
          <form action={updateLinkAction} className="flex items-end gap-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <div className="flex-1">
              <Input type="url" name="meetingLink" defaultValue={booking.meeting_link}
                placeholder={tb.meetLinkPlaceholder} required />
            </div>
            <SubmitButton label={tb.update} pendingLabel={tb.saving} variant="secondary" />
          </form>
          {updateLinkState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{updateLinkState.error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[color:var(--academy-warning)]" />
            <Badge variant="warning">{tb.meetLinkMissing}</Badge>
          </div>
          <form action={updateLinkAction} className="flex items-end gap-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <div className="flex-1">
              <Input type="url" name="meetingLink" placeholder={tb.meetLinkPlaceholder} required />
            </div>
            <SubmitButton label={tb.addLink} pendingLabel={tb.saving} variant="primary" />
          </form>
          {updateLinkState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{updateLinkState.error}</p>
          )}
        </div>
      )}

      {/* Calendar download */}
      <a
        href={`/api/bookings/${booking.id}/ics`}
        className="inline-flex items-center gap-1.5 text-[12px] text-[color:var(--brand-deep)] hover:underline"
        download
      >
        <Link2 className="h-3.5 w-3.5" />
        {tb.downloadIcs}
      </a>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isPast && (
          <form action={markCompleteAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            {markCompleteState.error && (
              <p className="text-[12px] text-[color:var(--academy-danger)]">{markCompleteState.error}</p>
            )}
            <SubmitButton label={tb.markComplete} pendingLabel={tb.saving} variant="primary" />
          </form>
        )}
        <form action={cancelAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          {cancelState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{cancelState.error}</p>
          )}
          <SubmitButton label={tb.cancelSession} pendingLabel={tb.cancelling} variant="ghost" />
        </form>
      </div>
    </Card>
  );
}

function CompletedCard({ booking }: { booking: BookingWithRelations }) {
  const { dict, locale } = useI18n();
  const tb = dict.bookings;
  const studentName = booking.student?.profiles.full_name ?? "Student";
  const start = formatDate(booking.start_time, locale);
  const end = formatDate(booking.end_time, locale);

  return (
    <Card padding="compact" tone="muted" className="space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{studentName}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {start.date} · {start.time} – {end.time}
          </p>
          {booking.subjects.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
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
            <p className="mt-1 text-[12px] text-academy-slate">
              <span className="font-medium">{tb.topic}</span> {booking.topic_note}
            </p>
          )}
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {tb.earnedLabel} {booking.credits_reserved} credit{booking.credits_reserved !== 1 ? "s" : ""}
          </p>
        </div>
        <Badge variant="verified">{tb.statusCompleted}</Badge>
      </div>
    </Card>
  );
}

function CancelledCard({ booking }: { booking: BookingWithRelations }) {
  const { dict, locale } = useI18n();
  const tb = dict.bookings;
  const studentName = booking.student?.profiles.full_name ?? "Student";
  const start = formatDate(booking.start_time, locale);
  const end = formatDate(booking.end_time, locale);

  return (
    <Card padding="compact" tone="muted" className="space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{studentName}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {start.date} · {start.time} – {end.time}
          </p>
          {booking.subjects.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
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
            <p className="mt-1 text-[12px] text-academy-slate">
              <span className="font-medium">{tb.topic}</span> {booking.topic_note}
            </p>
          )}
        </div>
        <Badge variant="muted">{tb.statusCancelled}</Badge>
      </div>
    </Card>
  );
}

export interface TeacherBookingCardProps {
  booking: BookingWithRelations;
  teacherDefaultMeetLink: string | null;
}

export function TeacherBookingCard({ booking, teacherDefaultMeetLink }: TeacherBookingCardProps) {
  if (booking.status === "pending") {
    return <PendingCard booking={booking} teacherDefaultMeetLink={teacherDefaultMeetLink} />;
  }
  if (booking.status === "confirmed") {
    return <ConfirmedCard booking={booking} />;
  }
  if (booking.status === "completed") {
    return <CompletedCard booking={booking} />;
  }
  return <CancelledCard booking={booking} />;
}
