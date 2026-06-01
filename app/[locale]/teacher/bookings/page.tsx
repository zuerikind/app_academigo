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
    .select("id, default_meet_link")
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

  const defaultMeetLink: string | null = (teacher as { id: string; default_meet_link: string | null }).default_meet_link;

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
        <section className="space-y-4">
          <h2 className="text-[15px] font-semibold text-academy-navy">Requests</h2>
          {pendingBookings.length === 0 ? (
            <EmptyState
              icon="book"
              title="No pending requests"
              description="New booking requests from students will appear here."
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
          <h2 className="text-[15px] font-semibold text-academy-navy">Upcoming</h2>
          {upcomingBookings.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No upcoming sessions"
              description="Confirmed upcoming sessions will appear here."
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
          <h2 className="text-[15px] font-semibold text-academy-navy">Past Sessions</h2>
          {pastSessions.length === 0 ? (
            <EmptyState
              icon="checkCircle"
              title="No past sessions"
              description="Completed and cancelled sessions will appear here."
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
