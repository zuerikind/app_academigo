"use client";

import { useState, useActionState } from "react";
import Image from "next/image";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { translateSubjectName } from "@/lib/i18n/subjects";
import { FIXED_LANGUAGES } from "@/lib/constants/teacher";
import type { TeacherActionState } from "@/lib/actions/teacher";
import type { Subject, Teacher } from "@/lib/types/index";

export function TeacherProfileEditForm({
  action,
  teacher,
  subjects,
  currentSubjectIds,
  avatarUrl,
}: {
  action: (prev: TeacherActionState, formData: FormData) => Promise<TeacherActionState>;
  teacher: Teacher;
  subjects: Subject[];
  currentSubjectIds: string[];
  avatarUrl: string | null;
}) {
  const { locale, dict } = useI18n();
  const tp = dict.teacher.profile;
  const to = dict.teacher.onboarding;
  const tpr = dict.teacherProfile;
  const tc = dict.common;

  const [state, formAction, pending] = useActionState(action, {});
  const [showOtherLang, setShowOtherLang] = useState(false);
  const [offersInPerson, setOffersInPerson] = useState(teacher.offers_in_person);

  const currentLangs = teacher.languages ?? [];
  const fixedLangsSet = new Set<string>(FIXED_LANGUAGES);
  const currentOtherLangs = currentLangs.filter((l) => !fixedLangsSet.has(l));

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}

      {/* Profile picture */}
      <Field>
        <Label htmlFor="avatar" hint="Optional">{to.profilePicture}</Label>
        {avatarUrl && (
          <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-lg border border-academy-line bg-academy-mist">
            <Image src={avatarUrl} alt="Current profile picture" fill className="object-cover" />
          </div>
        )}
        <Input
          id="avatar"
          name="avatar"
          type="file"
          accept="image/*"
          className="file:mr-3 file:rounded file:border-0 file:bg-academy-mist file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-academy-navy"
        />
      </Field>

      {/* Bio */}
      <Field>
        <Label htmlFor="bio">{tpr.about}</Label>
        <Textarea id="bio" name="bio" rows={4} required minLength={20} defaultValue={teacher.bio ?? ""} />
      </Field>

      {/* Subjects */}
      <Field>
        <Label>{tp.subjects}</Label>
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
                defaultChecked={currentSubjectIds.includes(s.id)}
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
          <Label htmlFor="education">{tpr.education}</Label>
          <Input id="education" name="education" required defaultValue={teacher.education ?? ""} />
        </Field>
        <Field>
          <Label htmlFor="experience">{tpr.experience}</Label>
          <select
            id="experience"
            name="experience"
            required
            defaultValue={teacher.experience ?? ""}
            className="h-10 w-full rounded-lg border border-academy-line bg-white px-3 text-[13.5px] text-academy-navy focus:outline-none focus:ring-2 focus:ring-academy-sky"
          >
            <option value="" disabled>{locale === "de" ? "Bitte wählen…" : "Select…"}</option>
            <option value={to.experienceOptions.less1}>{to.experienceOptions.less1}</option>
            <option value={to.experienceOptions.one2}>{to.experienceOptions.one2}</option>
            <option value={to.experienceOptions.three5}>{to.experienceOptions.three5}</option>
            <option value={to.experienceOptions.six10}>{to.experienceOptions.six10}</option>
            <option value={to.experienceOptions.ten_plus}>{to.experienceOptions.ten_plus}</option>
          </select>
        </Field>
      </div>

      {/* Teaching style */}
      <Field>
        <Label htmlFor="teachingStyle">{tpr.teachingStyle}</Label>
        <Textarea id="teachingStyle" name="teachingStyle" rows={3} required defaultValue={teacher.teaching_style ?? ""} />
      </Field>

      {/* Languages */}
      <Field>
        <Label>{to.languages}</Label>
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
                defaultChecked={currentLangs.includes(lang)}
                className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
              />
              <span>{lang}</span>
            </label>
          ))}
          <label className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30">
            <input
              type="checkbox"
              checked={showOtherLang || currentOtherLangs.length > 0}
              onChange={(e) => setShowOtherLang(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
            />
            <span>{locale === "de" ? "Andere" : "Other"}</span>
          </label>
        </div>
        {(showOtherLang || currentOtherLangs.length > 0) && (
          <Input
            name="languageOther"
            defaultValue={currentOtherLangs.join(", ")}
            placeholder={to.languageOtherPlaceholder}
            className="mt-2"
          />
        )}
      </Field>

      {/* Format */}
      <Field>
        <Label>{tp.modality}</Label>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30">
            <input
              type="checkbox"
              name="offersOnline"
              defaultChecked={teacher.offers_online}
              className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
            />
            {tc.online}
          </label>
          <label className="flex items-center gap-2.5 rounded-md border border-academy-line bg-white px-3 py-2 text-[13px] transition-colors hover:border-academy-navy/30">
            <input
              type="checkbox"
              name="offersInPerson"
              defaultChecked={teacher.offers_in_person}
              onChange={(e) => setOffersInPerson(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-academy-line accent-academy-navy"
            />
            {tc.inPerson}
          </label>
        </div>
      </Field>

      {/* Location (only when in-person is checked) */}
      {offersInPerson && (
        <Field>
          <Label htmlFor="location" hint="Optional">{to.location}</Label>
          <Input id="location" name="location" defaultValue={teacher.location ?? ""} placeholder={to.locationPlaceholder} />
        </Field>
      )}

      <div className="pt-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? tp.saving : state.success ? tp.saved : tp.save}
        </Button>
      </div>
    </form>
  );
}
