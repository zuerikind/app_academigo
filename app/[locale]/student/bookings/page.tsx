import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { StudentBookingCard } from "@/components/student/student-booking-card";
import { getStudentNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getStudentBookings } from "@/lib/queries/bookings";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

type Props = { params: Promise<{ locale: string }> };

export default async function StudentBookingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const profile = await requireRoleFromParams("student", raw);
  const dict = getDictionary(raw);
  const t = dict.student.bookings;

  const supabase = await createClient();

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  // Fetch all bookings (empty array if student record not found)
  const bookings = student?.id ? await getStudentBookings(student.id) : [];

  // Fetch credit balance
  let credits = 0;
  try {
    const { data } = await supabase.rpc("student_available_credits");
    if (typeof data === "number") credits = data;
  } catch {
    // Non-fatal: display 0 if RPC fails
  }

  const now = new Date();

  // Upcoming: pending or confirmed with start_time in the future
  const upcoming = bookings
    .filter(
      (b) =>
        (b.status === "pending" || b.status === "confirmed") &&
        new Date(b.start_time) > now,
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  // Past: completed or cancelled, OR confirmed/pending but start_time in the past
  const past = bookings
    .filter(
      (b) =>
        b.status === "completed" ||
        b.status === "cancelled" ||
        ((b.status === "pending" || b.status === "confirmed") &&
          new Date(b.start_time) <= now),
    )
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.bookings}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="space-y-8">
        {/* Credit balance */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={dict.student.dashboard.availableCredits}
            value={`${credits} credits`}
            icon="coins"
            tone="brand"
            hint={t.creditsHint}
          />
        </div>

        {/* Upcoming bookings */}
        <section>
          <h2 className="mb-4 font-display text-[16px] font-semibold tracking-tight text-academy-navy">
            {t.upcoming}
          </h2>
          {upcoming.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={t.emptyTitle}
              description={t.emptyDesc}
              hint={t.emptyHint}
              actionLabel={t.findTeachers}
              actionHref={localizedPath(raw, "/student/teachers")}
            />
          ) : (
            <div className="space-y-3">
              {upcoming.map((booking) => (
                <StudentBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </section>

        {/* Past sessions */}
        {past.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-[16px] font-semibold tracking-tight text-academy-navy">
              {t.pastSessions}
            </h2>
            <div className="space-y-3">
              {past.map((booking) => (
                <StudentBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        )}

        {/* Credit history — completed sessions only */}
        {(() => {
          const completed = bookings.filter((b) => b.status === "completed");
          const dateFmt = raw === "de" ? "de-CH" : "en-CH";
          return (
            <section>
              <h2 className="mb-4 font-display text-[16px] font-semibold tracking-tight text-academy-navy">
                {t.creditHistory}
              </h2>
              {completed.length === 0 ? (
                <p className="text-[13px] text-academy-slate-muted">{t.creditHistoryEmpty}</p>
              ) : (
                <div className="rounded-2xl border border-academy-line bg-white divide-y divide-academy-line/60">
                  {completed.map((b) => {
                    const start = new Date(b.start_time);
                    const dateStr = start.toLocaleDateString(dateFmt, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
                    const timeStr = start.toLocaleTimeString(dateFmt, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
                    const teacher = b.teacher?.profiles?.full_name ?? "Teacher";
                    return (
                      <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-academy-navy truncate">{teacher}</p>
                          <p className="text-[11px] text-academy-slate-muted">{dateStr} · {timeStr}</p>
                        </div>
                        <span className="shrink-0 text-[13px] font-semibold text-red-600 text-numeric">
                          {t.creditDeducted.replace("{n}", String(b.credits_reserved))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}
