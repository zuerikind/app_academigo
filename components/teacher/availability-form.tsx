"use client";

import { useActionState } from "react";
import { Field, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import type { AvailabilityActionState } from "@/lib/actions/availability";

// Display order: Monday first (1..6, then 0 = Sunday)
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0];

export function AddAvailabilityRangeForm({
  action,
}: {
  action: (prev: AvailabilityActionState, formData: FormData) => Promise<AvailabilityActionState>;
}) {
  const { dict } = useI18n();
  const t = dict.teacher.availability;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="dayOfWeek">{t.formDay}</Label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            required
            className="h-10 w-full rounded-lg border border-academy-line bg-white px-3 text-[13.5px] text-academy-navy focus:outline-none focus:ring-2 focus:ring-academy-sky"
          >
            {ORDERED_DAYS.map((d) => (
              <option key={d} value={d}>
                {t.dayLabels[d]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <Label htmlFor="startTime">{t.formFrom}</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </Field>
        <Field>
          <Label htmlFor="endTime">{t.formTo}</Label>
          <Input id="endTime" name="endTime" type="time" required />
        </Field>
      </div>
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? t.formAdding : t.formAddRange}
      </Button>
    </form>
  );
}

export function AddBlockerForm({
  action,
}: {
  action: (prev: AvailabilityActionState, formData: FormData) => Promise<AvailabilityActionState>;
}) {
  const { dict } = useI18n();
  const t = dict.teacher.availability;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <Label htmlFor="blockerDate">{t.formDate}</Label>
          <Input id="blockerDate" name="date" type="date" required />
        </Field>
        <Field>
          <Label htmlFor="blockerStartTime">
            {t.formFrom}{" "}
            <span className="font-normal text-academy-slate">{t.formOptional}</span>
          </Label>
          <Input id="blockerStartTime" name="startTime" type="time" />
        </Field>
        <Field>
          <Label htmlFor="blockerEndTime">
            {t.formTo}{" "}
            <span className="font-normal text-academy-slate">{t.formOptional}</span>
          </Label>
          <Input id="blockerEndTime" name="endTime" type="time" />
        </Field>
      </div>
      <p className="text-[12px] text-academy-slate">{t.formLeaveBlank}</p>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? t.formBlocking : t.formBlock}
      </Button>
    </form>
  );
}
