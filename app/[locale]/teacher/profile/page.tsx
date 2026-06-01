import { notFound } from "next/navigation";
import { TeacherProfileEditForm } from "@/components/teacher/profile-edit-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getTeacherNav } from "@/config/navigation";
import { updateTeacherProfile } from "@/lib/actions/teacher";
import { requireRoleFromParams, getTeacherRecord } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getSubjects } from "@/lib/queries/subjects";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherProfilePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.profile;
  const tc = dict.common;
  const profile = await requireRoleFromParams("teacher", raw);
  const [teacher, subjects] = await Promise.all([
    getTeacherRecord(profile.id),
    getSubjects(),
  ]);

  if (!teacher) {
    return (
      <DashboardLayout
        navItems={getTeacherNav(dict, raw)}
        locale={raw}
        dict={dict}
        eyebrow={dict.nav.teacher.profile}
        title={t.title}
        subtitle={t.subtitle}
      >
        <EmptyState icon="user" title={t.title} description={t.completeOnboarding} />
      </DashboardLayout>
    );
  }

  const supabase = await createClient();
  const { data: teacherSubjects } = await supabase
    .from("teacher_subjects")
    .select("subject_id")
    .eq("teacher_id", teacher.id);
  const currentSubjectIds = (teacherSubjects ?? []).map((r) => r.subject_id);

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.profile}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="max-w-3xl space-y-8">
        <div className="rounded-lg border border-academy-line bg-white p-6">
          <div className="flex flex-wrap items-center gap-2">
            {teacher.is_approved ? (
              <Badge variant="verified">{tc.approved}</Badge>
            ) : (
              <Badge variant="warning">{tc.pending}</Badge>
            )}
            {teacher.is_verified && <Badge variant="verified">{tc.verified}</Badge>}
          </div>
          <h2 className="mt-4 font-display text-[20px] font-semibold tracking-tight text-academy-navy">
            {profile.full_name}
          </h2>
        </div>

        <div className="rounded-lg border border-academy-line bg-white p-6">
          <TeacherProfileEditForm
            action={updateTeacherProfile}
            teacher={teacher}
            subjects={subjects}
            currentSubjectIds={currentSubjectIds}
            avatarUrl={profile.avatar_url ?? null}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
