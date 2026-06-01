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
            label="Available Credits"
            value={`${credits} credits`}
            icon="coins"
            tone="brand"
            hint="Each session costs 1 credit"
          />
        </div>

        {/* Upcoming bookings */}
        <section>
          <h2 className="mb-4 font-display text-[16px] font-semibold tracking-tight text-academy-navy">
            Upcoming
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
              Past Sessions
            </h2>
            <div className="space-y-3">
              {past.map((booking) => (
                <StudentBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
