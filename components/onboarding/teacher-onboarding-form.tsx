"use client";

import { useState, useActionState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { OnboardingState } from "@/lib/actions/onboarding";
import type { Subject } from "@/lib/types";

const FIXED_LANGUAGES = ["German", "English", "French", "Italian", "Spanish"] as const;

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
  const [showOtherLang, setShowOtherLang] = useState(false);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}

      {/* Full name */}
      <Field>
        <Label htmlFor="fullName">{dict.auth.fullName}</Label>
        <Input id="fullName" name="fullName" defaultValue={defaultName ?? ""} required />
      </Field>

      {/* Profile picture */}
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

      {/* Subjects */}
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

      {/* Education + Experience */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="education">{dict.teacherProfile.education}</Label>
          <Input
            id="education"
            name="education"
            placeholder={locale === "de" ? "z.B. Matura, Bachelor ETH Zürich" : "e.g. Matura, Bachelor ETH Zurich"}
            required
          />
          <p className="mt-1 text-[12px] text-academy-slate">
            {locale === "de"
              ? "Höchster Abschluss, z.B. Matura, Bachelor, Master, PhD"
              : "Highest degree, e.g. Matura, Bachelor, Master, PhD"}
          </p>
        </Field>

        <Field>
          <Label htmlFor="experience">{dict.teacherProfile.experience}</Label>
          <select
            id="experience"
            name="experience"
            required
            className="h-10 w-full rounded-lg border border-academy-line bg-white px-3 text-[13.5px] text-academy-navy focus:outline-none focus:ring-2 focus:ring-academy-sky"
          >
            <option value="">
              {locale === "de" ? "Bitte wählen…" : "Select…"}
            </option>
            <option value={t.experienceOptions.less1}>{t.experienceOptions.less1}</option>
            <option value={t.experienceOptions.one2}>{t.experienceOptions.one2}</option>
            <option value={t.experienceOptions.three5}>{t.experienceOptions.three5}</option>
            <option value={t.experienceOptions.six10}>{t.experienceOptions.six10}</option>
            <option value={t.experienceOptions.ten_plus}>{t.experienceOptions.ten_plus}</option>
          </select>
        </Field>
      </div>

      {/* About / Bio */}
      <Field>
        <Label htmlFor="bio">{dict.teacherProfile.about}</Label>
        <Textarea
          id="bio"
          name="bio"
          rows={4}
          required
          minLength={20}
          placeholder={
            locale === "de"
              ? "Erzähle den Lernenden, wer du bist und warum du unterrichtest.\n\nBeispiel: «Ich bin Mathematikstudent im 4. Semester an der ETH Zürich. Ich unterrichte seit 3 Jahren Gymnasiasten und helfe ihnen, Mathe nicht nur zu verstehen, sondern zu mögen.»"
              : "Tell students who you are and why you teach.\n\nExample: «I'm a 4th-year mathematics student at ETH Zurich. I've been tutoring high school students for 3 years and love helping them not just understand maths, but enjoy it.»"
          }
        />
      </Field>

      {/* Teaching style */}
      <Field>
        <Label htmlFor="teachingStyle">{dict.teacherProfile.teachingStyle}</Label>
        <Textarea
          id="teachingStyle"
          name="teachingStyle"
          rows={3}
          required
          placeholder={
            locale === "de"
              ? "Beschreibe, wie du unterrichtest.\n\nBeispiel: «Ich beginne jede Stunde mit einer kurzen Wiederholung, erkläre neue Konzepte mit Alltagsbeispielen und übe mit massgeschneiderten Aufgaben — immer auf das Tempo des Lernenden abgestimmt.»"
              : "Describe how you teach.\n\nExample: «I start each lesson with a quick recap, explain new concepts using real-life examples, and practise with tailored exercises — always adapting to the student's pace.»"
          }
        />
      </Field>

      {/* Languages */}
      <Field>
        <Label>{t.languages}</Label>
        <div className="flex flex-wrap gap-2">
          {FIXED_LANGUAGES.map((lang) => (
            <label
              key={lang}
              className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30"
            >
              <input
                type="checkbox"
                name="languageChecked"
                value={lang}
                className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
              />
              <span>{lang}</span>
            </label>
          ))}
          <label className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30">
            <input
              type="checkbox"
              checked={showOtherLang}
              onChange={(e) => setShowOtherLang(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
            />
            <span>{locale === "de" ? "Andere" : "Other"}</span>
          </label>
        </div>
        {showOtherLang && (
          <Input
            name="languageOther"
            placeholder={t.languageOtherPlaceholder}
            className="mt-2"
          />
        )}
      </Field>

      {/* Format */}
      <Field>
        <Label>{dict.teacher.profile.modality}</Label>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30">
            <input
              type="checkbox"
              name="offersOnline"
              value="on"
              defaultChecked
              className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
            />
            {t.offersOnline}
          </label>
          <label className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30">
            <input
              type="checkbox"
              name="offersInPerson"
              value="on"
              className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
            />
            {t.offersInPerson}
          </label>
        </div>
      </Field>

      {/* Location */}
      <Field>
        <Label htmlFor="location" hint="Optional">
          {t.location}
        </Label>
        <Input id="location" name="location" placeholder={t.locationPlaceholder} />
      </Field>

      {/* Google Meet Link */}
      <Field>
        <Label htmlFor="defaultMeetLink" hint="Optional">
          Google Meet Link
        </Label>
        <Input
          id="defaultMeetLink"
          name="defaultMeetLink"
          type="url"
          placeholder="https://meet.google.com/xxx-xxxx-xxx"
        />
        <p className="mt-1 text-[12px] text-academy-slate">
          {locale === "de"
            ? "Du kannst diesen Link auch später in deinen Einstellungen hinzufügen."
            : "You can add this later from your settings."}
        </p>
      </Field>

      {/* Payout information */}
      <div className="rounded-xl border border-academy-line bg-academy-mist/40 p-4 space-y-4">
        <div>
          <p className="text-[13px] font-medium text-academy-navy">{t.payoutTitle}</p>
          <p className="mt-0.5 text-[12px] text-academy-slate">{t.payoutOptionalNote}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <Field>
            <Label htmlFor="payoutName" hint="Optional">{t.payoutName}</Label>
            <Input id="payoutName" name="payoutName" />
          </Field>
          <Field>
            <Label htmlFor="payoutIban" hint="Optional">{t.payoutIban}</Label>
            <Input id="payoutIban" name="payoutIban" placeholder={t.payoutIbanPlaceholder} />
          </Field>
        </div>
        <Field>
          <Label htmlFor="payoutStreet" hint="Optional">{t.payoutStreet}</Label>
          <Input id="payoutStreet" name="payoutStreet" placeholder={t.payoutStreetPlaceholder} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <Label htmlFor="payoutZip" hint="Optional">{t.payoutZip}</Label>
            <Input id="payoutZip" name="payoutZip" placeholder={t.payoutZipPlaceholder} />
          </Field>
          <Field className="sm:col-span-2">
            <Label htmlFor="payoutCity" hint="Optional">{t.payoutCity}</Label>
            <Input id="payoutCity" name="payoutCity" placeholder={t.payoutCityPlaceholder} />
          </Field>
        </div>
        <Field>
          <Label htmlFor="payoutTwint" hint="Optional">{t.payoutTwint}</Label>
          <Input id="payoutTwint" name="payoutTwint" placeholder={t.payoutTwintPlaceholder} />
        </Field>
      </div>

      <div className="pt-2">
        <Button type="submit" variant="primary" fullWidth disabled={pending}>
          {pending ? t.submitting : t.submit}
        </Button>
      </div>
    </form>
  );
}
