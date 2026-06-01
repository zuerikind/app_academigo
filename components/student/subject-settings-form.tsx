"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { StudentSettingsState } from "@/lib/actions/student";
import type { Subject } from "@/lib/types/index";

export function SubjectSettingsForm({
  action,
  subjects,
  currentSubjectId,
}: {
  action: (prev: StudentSettingsState, formData: FormData) => Promise<StudentSettingsState>;
  subjects: Subject[];
  currentSubjectId: string | null;
}) {
  const { dict } = useI18n();
  const t = dict.student.settings;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction}>
      <div className="grid grid-cols-[1fr_2fr] items-center gap-6 border-t border-academy-line px-5 py-4">
        <label
          htmlFor="preferredSubjectId"
          className="text-[12.5px] uppercase tracking-wide text-academy-slate-muted"
        >
          {t.preferredSubject}
        </label>
        <div className="flex items-center gap-3">
          <select
            id="preferredSubjectId"
            name="preferredSubjectId"
            defaultValue={currentSubjectId ?? ""}
            className="h-9 flex-1 rounded-lg border border-academy-line bg-white px-3 text-[13.5px] text-academy-navy focus:outline-none focus:ring-2 focus:ring-academy-sky"
          >
            <option value="">{t.noSubject}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {translateSubjectName(dict, s.slug, s.name)}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? t.saving : state.success ? t.saved : t.save}
          </Button>
        </div>
      </div>
    </form>
  );
}
