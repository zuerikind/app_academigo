import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Monitor } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { translateSubjectName } from "@/lib/i18n/subjects";
import { getTeacherProfileDetail } from "@/lib/queries/teachers";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const teacher = await getTeacherProfileDetail(id);
  return { title: teacher?.fullName ?? "Teacher" };
}

export default async function PublicTeacherProfilePage({ params }: Props) {
  const { id, locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacherProfile;
  const tc = dict.common;
  const teacher = await getTeacherProfileDetail(id);
  if (!teacher) notFound();

  const initials = teacher.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <PublicLayout locale={raw}>
      <Section pad="tight" width="wide" className="pt-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-7">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-academy-line bg-academy-mist">
                {teacher.avatarUrl ? (
                  <Image
                    src={teacher.avatarUrl}
                    alt={teacher.fullName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-xl font-semibold text-academy-navy">
                    {initials}
                  </div>
                )}
              </div>
              <div>
                <p className="text-meta">{dict.nav.teachers}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-[28px] font-semibold tracking-tight text-academy-navy sm:text-[32px]">
                    {teacher.fullName}
                  </h1>
                  {teacher.isVerified && (
                    <Badge variant="verified">{tc.verified}</Badge>
                  )}
                </div>
                <p className="mt-2 text-[13px] text-academy-slate-muted">
                  {tc.placeholderRating}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {teacher.subjects.map((s) => (
                    <Badge key={s.id} variant="outline">
                      {translateSubjectName(dict, s.slug, s.name)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {teacher.bio && (
              <div className="mt-12">
                <p className="text-meta">{t.about}</p>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-academy-slate">
                  {teacher.bio}
                </p>
              </div>
            )}

            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {teacher.education && (
                <InfoBlock label={t.education} value={teacher.education} />
              )}
              {teacher.teachingStyle && (
                <InfoBlock label={t.teachingStyle} value={teacher.teachingStyle} />
              )}
              {teacher.experience && (
                <InfoBlock label={t.experience} value={teacher.experience} />
              )}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 rounded-lg border border-academy-line bg-white">
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
                      {teacher.location && ` · ${teacher.location}`}
                    </li>
                  )}
                </ul>
                <div className="mt-6 flex flex-col gap-2">
                  <Button
                    href={localizedPath(raw, "/signup?role=student")}
                    variant="primary"
                    fullWidth
                  >
                    {t.signUpToBook}
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
      </Section>
    </PublicLayout>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-meta">{label}</p>
      <p className="mt-2 text-[14px] leading-relaxed text-academy-slate">{value}</p>
    </div>
  );
}
