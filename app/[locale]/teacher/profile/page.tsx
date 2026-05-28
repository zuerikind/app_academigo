import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getTeacherNav } from "@/config/navigation";
import { requireRoleFromParams, getTeacherRecord } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { translateSubjectName } from "@/lib/i18n/subjects";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherProfilePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.profile;
  const tc = dict.common;
  const profile = await requireRoleFromParams("teacher", raw);
  const teacher = await getTeacherRecord(profile.id);
  const supabase = await createClient();

  let subjectNames: string[] = [];
  if (teacher) {
    const { data } = await supabase
      .from("teacher_subjects")
      .select("subjects(name, slug)")
      .eq("teacher_id", teacher.id);
    type Row = { subjects: { name: string; slug: string } | null };
    subjectNames =
      (data as Row[] | null)
        ?.map((r) =>
          r.subjects
            ? translateSubjectName(dict, r.subjects.slug, r.subjects.name)
            : null,
        )
        .filter((n): n is string => !!n) ?? [];
  }

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
        <EmptyState
          icon="user"
          title={t.title}
          description={t.completeOnboarding}
        />
      </DashboardLayout>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: t.subjects, value: subjectNames.join(", ") || "—" },
    {
      label: dict.teacherProfile.education,
      value: teacher.education ?? "—",
    },
    {
      label: dict.teacherProfile.experience,
      value: teacher.experience ?? "—",
    },
    {
      label: dict.teacherProfile.teachingStyle,
      value: teacher.teaching_style ?? "—",
    },
    {
      label: dict.teacher.onboarding.languages,
      value: teacher.languages?.join(", ") || "—",
    },
    {
      label: t.modality,
      value:
        [
          teacher.offers_online && tc.online,
          teacher.offers_in_person && tc.inPerson,
        ]
          .filter(Boolean)
          .join(", ") || "—",
    },
  ];

  if (teacher.location) {
    rows.push({
      label: dict.teacher.onboarding.location,
      value: teacher.location,
    });
  }

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
            {teacher.is_verified && (
              <Badge variant="verified">{tc.verified}</Badge>
            )}
          </div>
          <h2 className="mt-4 font-display text-[20px] font-semibold tracking-tight text-academy-navy">
            {profile.full_name}
          </h2>
          {teacher.bio && (
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-academy-slate">
              {teacher.bio}
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-academy-line bg-white">
          <dl>
            {rows.map((row, idx) => (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_2fr] items-baseline gap-6 px-5 py-4"
                style={{
                  borderTop:
                    idx === 0 ? "none" : "1px solid var(--academy-line)",
                }}
              >
                <dt className="text-[12.5px] uppercase tracking-wide text-academy-slate-muted">
                  {row.label}
                </dt>
                <dd className="text-[14px] font-medium text-academy-navy">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </DashboardLayout>
  );
}
