"use client";

import { useActionState } from "react";
import { Field, Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AvailabilityActionState } from "@/lib/actions/availability";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Display order: Monday first (1..6, then 0 = Sunday)
const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0];

export function AddAvailabilityRangeForm({
  action,
}: {
  action: (prev: AvailabilityActionState, formData: FormData) => Promise<AvailabilityActionState>;
}) {
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
          <Label htmlFor="dayOfWeek">Day</Label>
          <select
            id="dayOfWeek"
            name="dayOfWeek"
            required
            className="h-10 w-full rounded-lg border border-academy-line bg-white px-3 text-[13.5px] text-academy-navy focus:outline-none focus:ring-2 focus:ring-academy-sky"
          >
            {ORDERED_DAYS.map((d) => (
              <option key={d} value={d}>
                {DAY_LABELS[d]}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <Label htmlFor="startTime">From</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </Field>
        <Field>
          <Label htmlFor="endTime">To</Label>
          <Input id="endTime" name="endTime" type="time" required />
        </Field>
      </div>
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? "Adding…" : "Add range"}
      </Button>
    </form>
  );
}

export function AddBlockerForm({
  action,
}: {
  action: (prev: AvailabilityActionState, formData: FormData) => Promise<AvailabilityActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex items-end gap-3">
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}
      <Field className="flex-1">
        <Label htmlFor="blockerDate">Date to block</Label>
        <Input id="blockerDate" name="date" type="date" required />
      </Field>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Blocking…" : "Block date"}
      </Button>
    </form>
  );
}
