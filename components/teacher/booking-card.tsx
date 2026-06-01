"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle, AlertCircle, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/input";
import {
  confirmBooking,
  declineBooking,
  markComplete,
  cancelBookingAsTeacher,
  updateBookingMeetLink,
} from "@/lib/actions/bookings";
import type { BookingWithRelations } from "@/lib/queries/bookings";

// ---- Submit button with pending state --------------------------------

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

// ---- Pending booking card -------------------------------------------

function PendingCard({
  booking,
  teacherDefaultMeetLink,
}: {
  booking: BookingWithRelations;
  teacherDefaultMeetLink: string | null;
}) {
  const [confirmState, confirmAction] = useActionState(confirmBooking, {});
  const [declineState, declineAction] = useActionState(declineBooking, {});

  const studentName = booking.student?.profiles.full_name ?? "Student";
  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);

  return (
    <Card padding="compact" elevation="soft" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{studentName}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {startDate.toLocaleDateString("en-CH", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            {" · "}
            {startDate.toLocaleTimeString("en-CH", { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {endDate.toLocaleTimeString("en-CH", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {booking.topic_note && (
            <p className="mt-1 text-[12px] text-academy-slate">
              <span className="font-medium">Topic:</span> {booking.topic_note}
            </p>
          )}
        </div>
        <Badge variant="warning">Pending</Badge>
      </div>

      {/* Confirm form */}
      <div className="rounded-[10px] border border-academy-line bg-academy-mist p-4 space-y-3">
        <p className="text-[12px] font-semibold text-academy-navy uppercase tracking-wide">Confirm booking</p>

        {teacherDefaultMeetLink === null && (
          <div className="flex items-start gap-2 rounded-[8px] border border-[color:var(--academy-warning)]/30 bg-[color:var(--academy-warning-soft)] p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--academy-warning)]" />
            <p className="text-[12px] text-[color:var(--academy-warning)]">
              No default Meet link set — you must enter one before confirming. You can save a default link in{" "}
              <a href="../settings" className="underline font-medium">Settings</a>.
            </p>
          </div>
        )}

        <form action={confirmAction} className="space-y-3">
          <input type="hidden" name="bookingId" value={booking.id} />
          <Field>
            <Label htmlFor={`meetLink-${booking.id}`}>Google Meet link</Label>
            <Input
              id={`meetLink-${booking.id}`}
              type="url"
              name="meetingLink"
              defaultValue={teacherDefaultMeetLink ?? ""}
              placeholder="https://meet.google.com/…"
              required
            />
          </Field>
          {confirmState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{confirmState.error}</p>
          )}
          <SubmitButton label="Confirm booking" pendingLabel="Confirming…" />
        </form>
      </div>

      {/* Decline form */}
      <div className="rounded-[10px] border border-academy-line bg-white p-4 space-y-3">
        <p className="text-[12px] font-semibold text-academy-navy uppercase tracking-wide">Decline request</p>
        <form action={declineAction} className="space-y-3">
          <input type="hidden" name="bookingId" value={booking.id} />
          {declineState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{declineState.error}</p>
          )}
          <SubmitButton label="Decline" pendingLabel="Declining…" variant="outline" />
        </form>
      </div>
    </Card>
  );
}

// ---- Confirmed (upcoming) booking card ------------------------------

function ConfirmedCard({
  booking,
}: {
  booking: BookingWithRelations;
}) {
  const [updateLinkState, updateLinkAction] = useActionState(updateBookingMeetLink, {});
  const [markCompleteState, markCompleteAction] = useActionState(markComplete, {});
  const [cancelState, cancelAction] = useActionState(cancelBookingAsTeacher, {});

  const studentName = booking.student?.profiles.full_name ?? "Student";
  const startDate = new Date(booking.start_time);
  const endDate = new Date(booking.end_time);
  const isPast = startDate < new Date();

  return (
    <Card padding="compact" elevation="soft" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{studentName}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {startDate.toLocaleDateString("en-CH", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            {" · "}
            {startDate.toLocaleTimeString("en-CH", { hour: "2-digit", minute: "2-digit" })}
            {" – "}
            {endDate.toLocaleTimeString("en-CH", { hour: "2-digit", minute: "2-digit" })}
          </p>
          {booking.topic_note && (
            <p className="mt-1 text-[12px] text-academy-slate">
              <span className="font-medium">Topic:</span> {booking.topic_note}
            </p>
          )}
          <p className="mt-0.5 text-[12px] text-academy-slate">
            Credits: {booking.credits_reserved}
          </p>
        </div>
        <Badge variant="verified">Confirmed</Badge>
      </div>

      {/* Meet Link Status */}
      {booking.meeting_link !== null ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[color:var(--academy-success)]" />
            <Badge variant="verified">Meet Link Added</Badge>
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
          {/* Update link form */}
          <form action={updateLinkAction} className="flex items-end gap-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <div className="flex-1">
              <Input
                type="url"
                name="meetingLink"
                defaultValue={booking.meeting_link}
                placeholder="https://meet.google.com/…"
                required
              />
            </div>
            <SubmitButton label="Update" pendingLabel="Saving…" variant="secondary" />
          </form>
          {updateLinkState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{updateLinkState.error}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[color:var(--academy-warning)]" />
            <Badge variant="warning">Meet Link Missing</Badge>
          </div>
          <form action={updateLinkAction} className="flex items-end gap-2">
            <input type="hidden" name="bookingId" value={booking.id} />
            <div className="flex-1">
              <Input
                type="url"
                name="meetingLink"
                placeholder="https://meet.google.com/…"
                required
              />
            </div>
            <SubmitButton label="Add link" pendingLabel="Saving…" variant="primary" />
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
        Download .ics
      </a>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isPast && (
          <form action={markCompleteAction}>
            <input type="hidden" name="bookingId" value={booking.id} />
            {markCompleteState.error && (
              <p className="text-[12px] text-[color:var(--academy-danger)]">{markCompleteState.error}</p>
            )}
            <SubmitButton label="Mark complete" pendingLabel="Saving…" variant="primary" />
          </form>
        )}
        <form action={cancelAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          {cancelState.error && (
            <p className="text-[12px] text-[color:var(--academy-danger)]">{cancelState.error}</p>
          )}
          <SubmitButton label="Cancel session" pendingLabel="Cancelling…" variant="ghost" />
        </form>
      </div>
    </Card>
  );
}

// ---- Completed booking card -----------------------------------------

function CompletedCard({ booking }: { booking: BookingWithRelations }) {
  const studentName = booking.student?.profiles.full_name ?? "Student";
  const startDate = new Date(booking.start_time);

  return (
    <Card padding="compact" tone="muted" className="space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{studentName}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {startDate.toLocaleDateString("en-CH", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            Earned: {booking.credits_reserved} credit{booking.credits_reserved !== 1 ? "s" : ""}
          </p>
        </div>
        <Badge variant="verified">Completed</Badge>
      </div>
    </Card>
  );
}

// ---- Cancelled booking card -----------------------------------------

function CancelledCard({ booking }: { booking: BookingWithRelations }) {
  const studentName = booking.student?.profiles.full_name ?? "Student";
  const startDate = new Date(booking.start_time);

  return (
    <Card padding="compact" tone="muted" className="space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{studentName}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">
            {startDate.toLocaleDateString("en-CH", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <Badge variant="muted">Cancelled</Badge>
      </div>
    </Card>
  );
}

// ---- Public export --------------------------------------------------

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
  // cancelled
  return <CancelledCard booking={booking} />;
}
