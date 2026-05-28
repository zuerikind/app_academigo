import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Monitor } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStudentNav } from "@/config/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { translateSubjectName } from "@/lib/i18n/subjects";
import { getTeacherProfileDetail } from "@/lib/queries/teachers";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function StudentTeacherProfilePage({ params }: Props) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacherProfile;
  const tc = dict.common;
  const teacher = await getTeacherProfileDetail(id);
  if (!teacher) notFound();

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.findTeachers}
      title={teacher.fullName}
      subtitle={dict.student.teachers.subtitle}
    >
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-academy-line bg-academy-mist">
              {teacher.avatarUrl ? (
                <Image
                  src={teacher.avatarUrl}
                  alt={teacher.fullName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-lg font-semibold text-academy-navy">
                  {teacher.fullName[0]}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-[22px] font-semibold tracking-tight text-academy-navy">
                  {teacher.fullName}
                </h2>
                {teacher.isVerified && (
                  <Badge variant="verified">{tc.verified}</Badge>
                )}
              </div>
              <p className="mt-1 text-[13px] text-academy-slate-muted">
                {tc.placeholderRating}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {teacher.subjects.map((s) => (
                  <Badge key={s.id} variant="outline">
                    {translateSubjectName(dict, s.slug, s.name)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {teacher.bio && (
            <div>
              <p className="text-meta">{t.about}</p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-academy-slate">
                {teacher.bio}
              </p>
            </div>
          )}

          <div className="grid gap-8 sm:grid-cols-2">
            {teacher.education && (
              <Detail label={t.qualifications} value={teacher.education} />
            )}
            {teacher.teachingStyle && (
              <Detail label={t.teachingStyle} value={teacher.teachingStyle} />
            )}
            {teacher.experience && (
              <Detail label={t.experience} value={teacher.experience} />
            )}
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-lg border border-academy-line bg-white">
            <div className="border-b border-academy-line px-5 py-4">
              <p className="text-meta">{t.bookLesson}</p>
            </div>
            <div className="px-5 py-5">
              <p className="text-[13.5px] leading-relaxed text-academy-slate">
                {t.bookHint}
              </p>
              <ul className="mt-5 space-y-2.5 text-[13px] text-academy-navy">
                {teacher.offersOnline && (
                  <li className="flex items-center gap-2.5">
                    <Monitor className="h-4 w-4 text-academy-gold-deep" strokeWidth={1.6} />
                    {tc.online}
                  </li>
                )}
                {teacher.offersInPerson && (
                  <li className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-academy-gold-deep" strokeWidth={1.6} />
                    {tc.inPerson}
                  </li>
                )}
              </ul>
              <p className="mt-5 rounded-md border border-dashed border-academy-line bg-academy-mist px-3 py-2.5 text-[12px] leading-relaxed text-academy-slate">
                {t.slotsComing}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  href={localizedPath(raw, "/student/packages")}
                  variant="primary"
                  fullWidth
                >
                  {t.getCredits}
                </Button>
                <Button
                  href={localizedPath(raw, "/pricing")}
                  variant="secondary"
                  fullWidth
                >
                  {t.viewPackages}
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-meta">{label}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-academy-slate">{value}</p>
    </div>
  );
}
