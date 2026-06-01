"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import type { TeacherActionState } from "@/lib/actions/teacher";

export function TeacherSettingsForm({
  action,
  currentName,
  currentEmail,
  currentPayoutName,
  currentPayoutIban,
  currentPayoutStreet,
  currentPayoutZip,
  currentPayoutCity,
  currentPayoutTwint,
  currentDefaultMeetLink,
}: {
  action: (prev: TeacherActionState, formData: FormData) => Promise<TeacherActionState>;
  currentName: string | null;
  currentEmail: string | null;
  currentPayoutName: string;
  currentPayoutIban: string;
  currentPayoutStreet: string;
  currentPayoutZip: string;
  currentPayoutCity: string;
  currentPayoutTwint: string;
  currentDefaultMeetLink?: string;
}) {
  const { dict } = useI18n();
  const t = dict.teacher.settings;

  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}

      <Field>
        <Label htmlFor="fullName">{t.name}</Label>
        <Input id="fullName" name="fullName" required defaultValue={currentName ?? ""} />
      </Field>

      <Field>
        <Label htmlFor="email">{t.email}</Label>
        <Input id="email" name="email" type="email" disabled value={currentEmail ?? ""} className="opacity-50" />
      </Field>

      <Field>
        <Label htmlFor="defaultMeetLink" hint="Optional">Default Google Meet Link</Label>
        <Input
          id="defaultMeetLink"
          name="defaultMeetLink"
          type="url"
          placeholder="https://meet.google.com/xxx-xxxx-xxx"
          defaultValue={currentDefaultMeetLink ?? ""}
        />
        <p className="mt-1 text-[12px] text-academy-slate">
          Auto-filled on booking confirmations. You can change it per booking.
        </p>
      </Field>

      <div className="border-t border-academy-line pt-5">
        <p className="mb-1 text-[13.5px] font-medium text-academy-navy">{t.payoutTitle}</p>
        <p className="mb-4 text-[12.5px] text-academy-slate">{t.payoutOptionalNote}</p>
        <div className="space-y-4">
          <Field>
            <Label htmlFor="payoutName" hint="Optional">{t.payoutName}</Label>
            <Input id="payoutName" name="payoutName" defaultValue={currentPayoutName} />
          </Field>

          <Field>
            <Label htmlFor="payoutIban" hint="Optional">{t.payoutIban}</Label>
            <Input
              id="payoutIban"
              name="payoutIban"
              placeholder={t.payoutIbanPlaceholder}
              defaultValue={currentPayoutIban}
              className="font-mono"
            />
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field>
                <Label htmlFor="payoutStreet" hint="Optional">{t.payoutStreet}</Label>
                <Input id="payoutStreet" name="payoutStreet" placeholder={t.payoutStreetPlaceholder} defaultValue={currentPayoutStreet} />
              </Field>
            </div>
            <Field>
              <Label htmlFor="payoutZip" hint="Optional">{t.payoutZip}</Label>
              <Input id="payoutZip" name="payoutZip" placeholder={t.payoutZipPlaceholder} defaultValue={currentPayoutZip} />
            </Field>
          </div>

          <Field>
            <Label htmlFor="payoutCity" hint="Optional">{t.payoutCity}</Label>
            <Input id="payoutCity" name="payoutCity" placeholder={t.payoutCityPlaceholder} defaultValue={currentPayoutCity} />
          </Field>

          <Field>
            <Label htmlFor="payoutTwint" hint="Optional">{t.payoutTwint}</Label>
            <Input id="payoutTwint" name="payoutTwint" type="tel" placeholder={t.payoutTwintPlaceholder} defaultValue={currentPayoutTwint} />
          </Field>
        </div>
      </div>

      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? t.saving : state.success ? t.saved : t.save}
      </Button>
    </form>
  );
}
