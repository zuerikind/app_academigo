import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { TeacherBookingCard } from "@/components/teacher/booking-card";
import { getTeacherNav } from "@/config/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { requireRoleFromParams } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getTeacherBookings } from "@/lib/queries/bookings";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherBookingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const profile = await requireRoleFromParams("teacher", raw);
  const dict = getDictionary(raw);
  const t = dict.teacher.bookings;

  const supabase = await createClient();
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, teacher_private ( default_meet_link )")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!teacher) notFound();

  const allBookings = await getTeacherBookings(teacher.id);

  const pendingBookings = allBookings.filter((b) => b.status === "pending");
  const upcomingBookings = allBookings.filter(
    (b) => b.status === "confirmed" && new Date(b.start_time) >= new Date(),
  );
  const pastSessions = allBookings.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "cancelled" ||
      (b.status === "confirmed" && new Date(b.start_time) < new Date()),
  );

  const teacherPriv = (teacher as any).teacher_private;
  const defaultMeetLink: string | null =
    (Array.isArray(teacherPriv) ? teacherPriv[0] : teacherPriv)?.default_meet_link ?? null;

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.bookings}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="space-y-10">
        {/* Requests (pending) */}
        <section id="requests" className="space-y-4">
          <h2 className="text-[15px] font-semibold text-academy-navy">{t.requests}</h2>
          {pendingBookings.length === 0 ? (
            <EmptyState
              icon="book"
              title={t.pendingEmptyTitle}
              description={t.pendingEmptyDesc}
            />
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <TeacherBookingCard
                  key={booking.id}
                  booking={booking}
                  teacherDefaultMeetLink={defaultMeetLink}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming (confirmed, future) */}
        <section className="space-y-4">
          <h2 className="text-[15px] font-semibold text-academy-navy">{t.upcoming}</h2>
          {upcomingBookings.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={t.upcomingEmptyTitle}
              description={t.upcomingEmptyDesc}
            />
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <TeacherBookingCard
                  key={booking.id}
                  booking={booking}
                  teacherDefaultMeetLink={defaultMeetLink}
                />
              ))}
            </div>
          )}
        </section>

        {/* Past sessions (completed + cancelled) */}
        <section className="space-y-4">
          <h2 className="text-[15px] font-semibold text-academy-navy">{t.pastSessions}</h2>
          {pastSessions.length === 0 ? (
            <EmptyState
              icon="checkCircle"
              title={t.pastEmptyTitle}
              description={t.pastEmptyDesc}
            />
          ) : (
            <div className="space-y-3">
              {pastSessions.map((booking) => (
                <TeacherBookingCard
                  key={booking.id}
                  booking={booking}
                  teacherDefaultMeetLink={defaultMeetLink}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
