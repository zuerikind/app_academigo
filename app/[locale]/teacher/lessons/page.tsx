import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getTeacherNav } from "@/config/navigation";
import { requireRoleFromParams, getTeacherRecord } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  getTeacherActiveStudents,
  getTeacherSchedules,
  getTeacherUpcomingLessons,
  getRescheduleRequests,
} from "@/lib/queries/lessons";
import { updateScheduleStatus } from "@/lib/actions/schedules";
import { completeLesson } from "@/lib/actions/lessons";
import { approveReschedule, rejectReschedule } from "@/lib/actions/reschedule";

// ponytail: wrap two-arg action state signatures for plain <form action>
async function doUpdateScheduleStatus(formData: FormData) {
  "use server";
  await updateScheduleStatus({}, formData);
}
async function doCompleteLesson(formData: FormData) {
  "use server";
  await completeLesson({}, formData);
}
async function doApproveReschedule(formData: FormData) {
  "use server";
  await approveReschedule({}, formData);
}
async function doRejectReschedule(formData: FormData) {
  "use server";
  await rejectReschedule({}, formData);
}

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherLessonsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const tl = dict.lessons;
  const dateLocale = raw === "de" ? "de-CH" : "en-CH";

  const profile = await requireRoleFromParams("teacher", raw);
  const teacher = await getTeacherRecord(profile.id);
  if (!teacher) notFound();

  const [activeStudents, schedules, upcomingLessons, rescheduleRequests] = await Promise.all([
    getTeacherActiveStudents(teacher.id),
    getTeacherSchedules(teacher.id),
    getTeacherUpcomingLessons(teacher.id),
    getRescheduleRequests(teacher.id),
  ]);

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });
  }

  const statusBadge: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-gray-100 text-gray-600",
    pending: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    reschedule_requested: "bg-orange-100 text-orange-800",
    completed: "bg-gray-100 text-gray-600",
  };

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.lessons}
      title={tl.teacherTitle}
    >
      <div className="space-y-8">
        {/* Section 1 — Active Students */}
        <section>
          <h2 className="mb-4 text-subheading text-academy-navy">{tl.activeStudents}</h2>
          {activeStudents.length === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white px-6 py-9">
              <p className="text-[14px] text-academy-slate">{tl.noActiveStudents}</p>
            </div>
          ) : (
            <div className="rounded-[14px] border border-academy-line bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-academy-mist">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-academy-navy">{dict.admin.students.colName}</th>
                    <th className="px-5 py-3 text-right font-medium text-academy-navy">{tl.creditBalance}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-academy-line">
                  {activeStudents.map((s) => (
                    <tr key={s.studentId}>
                      <td className="px-5 py-3 text-academy-navy">{s.studentName}</td>
                      <td className="px-5 py-3 text-right text-academy-slate">{s.availableCredits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 2 — Recurring Schedules */}
        <section>
          <h2 className="mb-4 text-subheading text-academy-navy">{tl.recurringSchedules}</h2>
          {schedules.length === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white px-6 py-9">
              <p className="text-[14px] text-academy-slate">{tl.noSchedules}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.id} className="rounded-[14px] border border-academy-line bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-academy-navy">
                        {tl.weekdays[s.weekday]} · {s.start_time}–{s.end_time}
                      </p>
                      {s.studentName && (
                        <p className="text-[13px] text-academy-slate-muted">{s.studentName}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${statusBadge[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {s.status === "active"
                        ? dict.schedules.activeStatus
                        : s.status === "paused"
                        ? dict.schedules.pausedStatus
                        : dict.schedules.cancelledStatus}
                    </span>
                  </div>
                  {s.status !== "cancelled" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.status === "active" && (
                        <form action={doUpdateScheduleStatus}>
                          <input type="hidden" name="scheduleId" value={s.id} />
                          <input type="hidden" name="status" value="paused" />
                          <button
                            type="submit"
                            className="rounded-lg border border-academy-line bg-white px-3 py-1.5 text-sm font-medium text-academy-slate hover:bg-academy-mist transition-colors"
                          >
                            {tl.pauseSchedule}
                          </button>
                        </form>
                      )}
                      {s.status === "paused" && (
                        <form action={doUpdateScheduleStatus}>
                          <input type="hidden" name="scheduleId" value={s.id} />
                          <input type="hidden" name="status" value="active" />
                          <button
                            type="submit"
                            className="rounded-lg border border-academy-line bg-white px-3 py-1.5 text-sm font-medium text-academy-slate hover:bg-academy-mist transition-colors"
                          >
                            {tl.resumeSchedule}
                          </button>
                        </form>
                      )}
                      <form action={doUpdateScheduleStatus}>
                        <input type="hidden" name="scheduleId" value={s.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                        >
                          {tl.cancelSchedule}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3 — Upcoming Lessons */}
        <section>
          <h2 className="mb-4 text-subheading text-academy-navy">{tl.upcomingLessons}</h2>
          {upcomingLessons.length === 0 ? (
            <div className="rounded-[14px] border border-academy-line bg-white px-6 py-9">
              <p className="text-[14px] text-academy-slate">{tl.noUpcomingLessons}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingLessons.map((l) => (
                <div key={l.id} className="rounded-[14px] border border-academy-line bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-academy-navy">{formatTime(l.start_time)}</p>
                      {l.other_party_name && (
                        <p className="text-[13px] text-academy-slate-muted">{l.other_party_name}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${statusBadge[l.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {l.status === "reschedule_requested" ? dict.reschedule.pendingBadge : l.status}
                    </span>
                  </div>
                  {l.status === "confirmed" && (
                    <div className="mt-3">
                      <form action={doCompleteLesson}>
                        <input type="hidden" name="lessonId" value={l.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-academy-line bg-white px-3 py-1.5 text-sm font-medium text-academy-slate hover:bg-academy-mist transition-colors"
                        >
                          {tl.markComplete}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 4 — Reschedule Requests */}
        {rescheduleRequests.length > 0 && (
          <section>
            <h2 className="mb-4 text-subheading text-academy-navy">{tl.rescheduleRequests}</h2>
            <div className="space-y-3">
              {rescheduleRequests.map((l) => (
                <div key={l.id} className="rounded-[14px] border border-orange-100 bg-orange-50 p-5">
                  <div className="mb-3">
                    {l.other_party_name && (
                      <p className="font-medium text-academy-navy">{l.other_party_name}</p>
                    )}
                    <p className="text-[13px] text-academy-slate-muted">
                      {dict.bookings.statusConfirmed}: {formatTime(l.start_time)}
                    </p>
                    {l.reschedule_proposed_start && (
                      <p className="text-[13px] text-academy-slate-muted">
                        {tl.proposedTime}: {formatTime(l.reschedule_proposed_start)}
                        {l.reschedule_proposed_end ? ` – ${formatTime(l.reschedule_proposed_end)}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={doApproveReschedule}>
                      <input type="hidden" name="lessonId" value={l.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-academy-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-academy-navy/90 transition-colors"
                      >
                        {tl.approveReschedule}
                      </button>
                    </form>
                    <form action={doRejectReschedule}>
                      <input type="hidden" name="lessonId" value={l.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-academy-line bg-white px-3 py-1.5 text-sm font-medium text-academy-slate hover:bg-academy-mist transition-colors"
                      >
                        {tl.rejectReschedule}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
