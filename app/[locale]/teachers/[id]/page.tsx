import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Monitor } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { formatMessage } from "@/lib/i18n/format";
import { localizedPath } from "@/lib/i18n/path";
import { translateSubjectName } from "@/lib/i18n/subjects";
import { getTeacherProfileDetail } from "@/lib/queries/teachers";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { personJsonLd, breadcrumbListJsonLd } from "@/lib/seo/schemas";
import { absoluteUrl } from "@/lib/seo/site-url";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const dict = getDictionary(raw);
  const teacher = await getTeacherProfileDetail(id);
  if (!teacher) return { title: dict.nav.teachers };

  const subjectLabels = teacher.subjects
    .map((s) => translateSubjectName(dict, s.slug, s.name))
    .join(", ");

  const subjectsPart = subjectLabels
    ? formatMessage(dict.seo.teacherProfile.subjectsSuffix, {
        subjects: subjectLabels,
      })
    : "";

  const title = formatMessage(dict.seo.teacherProfile.title, {
    name: teacher.fullName,
  });
  const description = formatMessage(dict.seo.teacherProfile.description, {
    name: teacher.fullName,
    subjects: subjectsPart,
  });

  return buildPageMetadata({
    locale: raw,
    path: `/teachers/${id}`,
    title,
    description,
    ogImage: teacher.avatarUrl,
  });
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

  const subjectLabels = teacher.subjects.map((s) =>
    translateSubjectName(dict, s.slug, s.name),
  );
  const profileUrl = absoluteUrl(localizedPath(raw, `/teachers/${id}`));
  const metaDescription =
    teacher.bio?.slice(0, 160) ??
    formatMessage(dict.seo.teacherProfile.description, {
      name: teacher.fullName,
      subjects: subjectLabels.length
        ? formatMessage(dict.seo.teacherProfile.subjectsSuffix, {
            subjects: subjectLabels.join(", "),
          })
        : "",
    });

  return (
    <PublicLayout locale={raw}>
      <JsonLd
        data={personJsonLd({
          name: teacher.fullName,
          url: profileUrl,
          description: metaDescription,
          image: teacher.avatarUrl,
          subjects: subjectLabels,
        })}
      />
      <JsonLd data={breadcrumbListJsonLd([
        { name: raw === "de" ? "Startseite" : "Home", url: absoluteUrl(localizedPath(raw, "/")) },
        { name: raw === "de" ? "Lehrpersonen" : "Teachers", url: absoluteUrl(localizedPath(raw, "/teachers")) },
        { name: teacher.fullName, url: profileUrl },
      ])} />
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
