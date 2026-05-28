"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { OnboardingState } from "@/lib/actions/onboarding";
import type { Subject } from "@/lib/types";

export function TeacherOnboardingForm({
  action,
  subjects,
  defaultName,
}: {
  action: (prev: OnboardingState, formData: FormData) => Promise<OnboardingState>;
  subjects: Subject[];
  defaultName?: string | null;
}) {
  const { locale, dict } = useI18n();
  const t = dict.teacher.onboarding;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-6"
    >
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}

      <Field>
        <Label htmlFor="fullName">{dict.auth.fullName}</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultName ?? ""}
          required
        />
      </Field>

      <Field>
        <Label htmlFor="avatar" hint="Optional">
          {t.profilePicture}
        </Label>
        <Input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/*"
          className="file:mr-3 file:rounded file:border-0 file:bg-academy-mist file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-academy-navy"
        />
      </Field>

      <Field>
        <Label>{t.subjectsTeach}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {subjects.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30"
            >
              <input
                type="checkbox"
                name="subjectIds"
                value={s.id}
                className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
              />
              <span>{translateSubjectName(dict, s.slug, s.name)}</span>
            </label>
          ))}
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="education">{dict.teacherProfile.education}</Label>
          <Input id="education" name="education" required />
        </Field>

        <Field>
          <Label htmlFor="experience">{dict.teacherProfile.experience}</Label>
          <Input id="experience" name="experience" required />
        </Field>
      </div>

      <Field>
        <Label htmlFor="bio">{dict.teacherProfile.about}</Label>
        <Textarea id="bio" name="bio" rows={4} required minLength={20} />
      </Field>

      <Field>
        <Label htmlFor="teachingStyle">{dict.teacherProfile.teachingStyle}</Label>
        <Textarea id="teachingStyle" name="teachingStyle" rows={3} required />
      </Field>

      <Field>
        <Label htmlFor="languages">{t.languages}</Label>
        <Input
          id="languages"
          name="languages"
          placeholder={t.languagesPlaceholder}
          required
        />
      </Field>

      <Field>
        <Label>{dict.teacher.profile.modality}</Label>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30">
            <input
              type="checkbox"
              name="offersOnline"
              defaultChecked
              className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
            />
            {t.offersOnline}
          </label>
          <label className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30">
            <input
              type="checkbox"
              name="offersInPerson"
              className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
            />
            {t.offersInPerson}
          </label>
        </div>
      </Field>

      <Field>
        <Label htmlFor="location" hint="Optional">
          {t.location}
        </Label>
        <Input
          id="location"
          name="location"
          placeholder={t.locationPlaceholder}
        />
      </Field>

      <Field>
        <Label htmlFor="payoutInfo">{t.payoutPlaceholder}</Label>
        <Input id="payoutInfo" name="payoutInfo" placeholder={t.payoutHint} />
      </Field>

      <div className="pt-2">
        <Button type="submit" variant="primary" fullWidth disabled={pending}>
          {pending ? t.submitting : t.submit}
        </Button>
      </div>
    </form>
  );
}
