import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AddAvailabilityRangeForm, AddBlockerForm } from "@/components/teacher/availability-form";
import { getTeacherNav } from "@/config/navigation";
import {
  setAvailabilityRange,
  removeAvailabilityRange,
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

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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

  // Plain (1-arg) wrappers for form action attribute (no useActionState needed for remove)
  const removeRangeAction = async (formData: FormData) => {
    "use server";
    await removeAvailabilityRange({}, formData);
  };

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
        {/* Add availability range */}
        <section className="rounded-lg border border-academy-line bg-white p-6">
          <h2 className="mb-1 text-[15px] font-semibold text-academy-navy">
            Add availability
          </h2>
          <p className="mb-5 text-[13px] text-academy-slate">
            Set weekly recurring time windows when you are available to teach.
            Lessons are 50 minutes. Students can book slots at 15-minute
            increments within your ranges.
          </p>
          <AddAvailabilityRangeForm action={setAvailabilityRange} />
        </section>

        {/* Current availability */}
        <section className="rounded-lg border border-academy-line bg-white p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-academy-navy">
            Current availability
          </h2>
          {ranges.length === 0 ? (
            <p className="text-[13px] text-academy-slate">
              No availability set yet. Add a range above to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {ranges.map((range) => (
                <li
                  key={range.id}
                  className="flex items-center justify-between rounded-md border border-academy-line px-4 py-2.5"
                >
                  <span className="text-[13.5px] text-academy-navy">
                    <span className="font-medium">
                      {DAY_LABELS[range.day_of_week]}
                    </span>
                    <span className="mx-2 text-academy-slate">·</span>
                    {range.start_time} – {range.end_time}
                  </span>
                  <form action={removeRangeAction}>
                    <input type="hidden" name="rangeId" value={range.id} />
                    <button
                      type="submit"
                      className="text-[12.5px] text-[color:var(--academy-danger)] hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Blocked dates */}
        <section className="rounded-lg border border-academy-line bg-white p-6">
          <h2 className="mb-1 text-[15px] font-semibold text-academy-navy">
            Blocked dates
          </h2>
          <p className="mb-5 text-[13px] text-academy-slate">
            Block specific dates when you are unavailable, even if they fall
            within a weekly range.
          </p>
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
                        all day
                      </span>
                    )}
                  </span>
                  <form action={removeBlockerAction}>
                    <input type="hidden" name="blockerId" value={b.id} />
                    <button
                      type="submit"
                      className="text-[12.5px] text-[color:var(--academy-danger)] hover:underline"
                    >
                      Remove
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
