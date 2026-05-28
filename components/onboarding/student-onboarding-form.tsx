"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/input";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { OnboardingState } from "@/lib/actions/onboarding";
import type { Subject } from "@/lib/types";

export function StudentOnboardingForm({
  action,
  subjects,
  defaultName,
}: {
  action: (prev: OnboardingState, formData: FormData) => Promise<OnboardingState>;
  subjects: Subject[];
  defaultName?: string | null;
}) {
  const { locale, dict } = useI18n();
  const t = dict.student.onboarding;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="schoolLevel">{t.schoolLevel}</Label>
          <Select id="schoolLevel" name="schoolLevel" required defaultValue="">
            <option value="" disabled>
              {t.selectLevel}
            </option>
            {t.schoolLevels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>

        <Field>
          <Label htmlFor="preferredSubjectId">{t.subjectNeeded}</Label>
          <Select
            id="preferredSubjectId"
            name="preferredSubjectId"
            required
            defaultValue=""
          >
            <option value="" disabled>
              {t.selectSubject}
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {translateSubjectName(dict, s.slug, s.name)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field>
        <Label htmlFor="learningGoal">{t.learningGoal}</Label>
        <Input
          id="learningGoal"
          name="learningGoal"
          placeholder={t.learningGoalPlaceholder}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="preferredLanguage">{t.preferredLanguage}</Label>
          <Input
            id="preferredLanguage"
            name="preferredLanguage"
            placeholder={t.languagePlaceholder}
            required
          />
        </Field>

        <Field>
          <Label htmlFor="preferredModality">{t.modality}</Label>
          <Select
            id="preferredModality"
            name="preferredModality"
            required
            defaultValue=""
          >
            <option value="" disabled>
              {t.selectModality}
            </option>
            <option value="online">{t.modalityOnline}</option>
            <option value="in_person">{t.modalityInPerson}</option>
            <option value="both">{t.modalityBoth}</option>
          </Select>
        </Field>
      </div>

      <Field>
        <Label htmlFor="notes" hint="Optional">
          {t.difficulties}
        </Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder={t.difficultiesPlaceholder}
        />
      </Field>

      <div className="pt-2">
        <Button type="submit" variant="primary" fullWidth disabled={pending}>
          {pending ? t.saving : t.submit}
        </Button>
      </div>
    </form>
  );
}
