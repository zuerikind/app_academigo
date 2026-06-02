"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestBooking } from "@/lib/actions/bookings";
import { useI18n } from "@/components/i18n/locale-provider";
import { translateSubjectName } from "@/lib/i18n/subjects";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface BookingRequestFormProps {
  teacherId: string;
  selectedSlotStart: string;
  selectedSlotEnd: string;
  teacherName: string;
  subjects: Subject[];
}

function formatSlotDisplay(isoStart: string, isoEnd: string, locale: string): string {
  try {
    const dateLocale = locale === "de" ? "de-CH" : "en-CH";
    const start = new Date(isoStart);
    const end = new Date(isoEnd);
    const dateStr = start.toLocaleDateString(dateLocale, {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      timeZone: "Europe/Zurich",
    });
    const startTime = start.toLocaleTimeString(dateLocale, {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich",
    });
    const endTime = end.toLocaleTimeString(dateLocale, {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich",
    });
    return `${dateStr} · ${startTime}–${endTime}`;
  } catch {
    return `${isoStart} – ${isoEnd}`;
  }
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-[color:var(--brand)] px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function BookingRequestForm({
  teacherId,
  selectedSlotStart,
  selectedSlotEnd,
  teacherName,
  subjects,
}: BookingRequestFormProps) {
  const { dict, locale } = useI18n();
  const tb = dict.bookings;
  const [state, action] = useActionState(requestBooking, {});

  if (state.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-[13.5px] text-green-800">
        <p className="font-semibold">{tb.requestedTitle}</p>
        <p className="mt-1">
          {tb.requestedDesc.replace("{teacherName}", teacherName)}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="rounded-md border border-academy-line bg-academy-mist px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-academy-slate-muted">
          {tb.selectedSlot}
        </p>
        <p className="mt-0.5 text-[13.5px] font-medium text-academy-navy">
          {formatSlotDisplay(selectedSlotStart, selectedSlotEnd, locale)}
        </p>
        <p className="mt-0.5 text-[12px] text-academy-slate-muted">
          {tb.withTeacher.replace("{name}", teacherName)}
        </p>
      </div>

      <input type="hidden" name="teacherId" value={teacherId} />
      <input type="hidden" name="startTime" value={selectedSlotStart} />
      <input type="hidden" name="endTime" value={selectedSlotEnd} />

      {subjects.length > 0 && (
        <div>
          <p className="mb-2 text-[13px] font-medium text-academy-navy">
            {tb.subjectLabel}{" "}
            <span className="font-normal text-academy-slate-muted">{tb.subjectOptional}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <label
                key={subject.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-academy-line bg-white px-3 py-1.5 text-[13px] text-academy-navy transition-colors has-[:checked]:border-[color:var(--brand)]/60 has-[:checked]:bg-[color:var(--brand)]/8 has-[:checked]:text-[color:var(--brand-deep)]"
              >
                <input
                  type="checkbox"
                  name="subjectIds[]"
                  value={subject.id}
                  className="h-3.5 w-3.5 rounded accent-[color:var(--brand)]"
                />
                {translateSubjectName(dict, subject.slug, subject.name)}
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="topicNote"
          className="mb-1.5 block text-[13px] font-medium text-academy-navy"
        >
          {tb.topicLabel}{" "}
          <span className="font-normal text-academy-slate-muted">{tb.topicOptional}</span>
        </label>
        <textarea
          id="topicNote"
          name="topicNote"
          rows={3}
          placeholder={tb.topicPlaceholder}
          className="w-full rounded-lg border border-academy-line bg-white px-3 py-2 text-[13.5px] text-academy-navy placeholder:text-academy-slate-muted focus:border-[color:var(--brand)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton label={tb.requestBooking} pendingLabel={tb.requesting} />
    </form>
  );
}
