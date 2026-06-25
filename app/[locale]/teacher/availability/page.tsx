import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddBlockerForm } from "@/components/teacher/availability-form";
import { WeeklyScheduleEditor } from "@/components/teacher/weekly-schedule-editor";
import { getTeacherNav } from "@/config/navigation";
import {
  setAvailabilityBlocker,
  removeAvailabilityBlocker,
} from "@/lib/actions/availability";
import {
  getTeacherAvailabilityRanges,
  getTeacherAvailabilityBlockers,
} from "@/lib/queries/availability";
import { requireRoleFromParams, getTeacherRecord } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherAvailabilityPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.availability;

  const profile = await requireRoleFromParams("teacher", raw);
  const teacher = await getTeacherRecord(profile.id);

  if (!teacher) notFound();

  const [ranges, blockers] = await Promise.all([
    getTeacherAvailabilityRanges(teacher.id),
    getTeacherAvailabilityBlockers(teacher.id),
  ]);

  const removeBlockerAction = async (formData: FormData) => {
    "use server";
    await removeAvailabilityBlocker({}, formData);
  };

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.availability}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="max-w-2xl space-y-8">
        {/* Weekly schedule editor */}
        <section className="rounded-lg border border-academy-line bg-white p-6">
          <h2 className="mb-1 text-[15px] font-semibold text-academy-navy">
            {t.currentTitle}
          </h2>
          <p className="mb-6 text-[13px] text-academy-slate">{t.addDesc}</p>
          <WeeklyScheduleEditor initialRanges={ranges} />
        </section>

        {/* Blocked dates */}
        <section className="rounded-lg border border-academy-line bg-white p-6">
          <h2 className="mb-1 text-[15px] font-semibold text-academy-navy">
            {t.blockedTitle}
          </h2>
          <p className="mb-5 text-[13px] text-academy-slate">{t.blockedDesc}</p>
          <AddBlockerForm action={setAvailabilityBlocker} />
          {blockers.length > 0 && (
            <ul className="mt-4 space-y-2">
              {blockers.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-md border border-academy-line px-4 py-2.5"
                >
                  <span className="text-[13.5px] text-academy-navy">
                    <span className="font-medium">{b.blocked_date}</span>
                    {b.start_time && b.end_time && (
                      <>
                        <span className="mx-2 text-academy-slate">·</span>
                        {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                      </>
                    )}
                    {!b.start_time && (
                      <span className="ml-2 text-[12px] text-academy-slate">
                        {t.allDay}
                      </span>
                    )}
                  </span>
                  <form action={removeBlockerAction}>
                    <input type="hidden" name="blockerId" value={b.id} />
                    <button
                      type="submit"
                      className="text-[12.5px] text-[color:var(--academy-danger)] hover:underline"
                    >
                      {t.remove}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
