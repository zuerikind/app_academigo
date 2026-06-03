import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { approveTeacher, setTeacherActive } from "@/lib/actions/admin";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminTeacherDetail } from "@/lib/queries/admin";
import { localizedPath } from "@/lib/i18n/path";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function AdminTeacherDetailPage({ params }: Props) {
  const { locale: raw, id } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.teachers;
  const td = t.detail;
  const tc = dict.common;

  const teacher = await getAdminTeacherDetail(id);
  if (!teacher) notFound();

  const profile = teacher.profiles as unknown as {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;

  const subjects = (
    teacher.teacher_subjects as unknown as { subjects: { id: string; name: string; slug: string } | null }[]
  )
    .map((ts) => ts.subjects)
    .filter(Boolean) as { id: string; name: string; slug: string }[];

  const approveAction = async (formData: FormData) => {
    "use server";
    await approveTeacher({}, formData);
  };

  const setActiveAction = async (formData: FormData) => {
    "use server";
    await setTeacherActive({}, formData);
  };

  const initials = (profile?.full_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={localizedPath(raw, "/admin/teachers")}
        className="inline-flex items-center gap-1.5 text-[13px] text-academy-slate hover:text-academy-navy"
      >
        <span>←</span>
        <span>{td.back}</span>
      </Link>

      {/* Header card */}
      <div className="rounded-lg border border-academy-line bg-white p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-academy-line bg-academy-mist">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.full_name ?? ""} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xl font-semibold text-academy-navy">
                {initials}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {teacher.is_approved ? (
                <Badge variant="verified">{t.statusApproved}</Badge>
              ) : (
                <Badge variant="warning">{t.statusPending}</Badge>
              )}
              {teacher.is_active ? (
                <Badge variant="verified">{t.statusActive}</Badge>
              ) : (
                <Badge variant="warning">{t.statusInactive}</Badge>
              )}
              {teacher.is_verified && <Badge variant="verified">{tc.verified}</Badge>}
              <Badge variant="muted">{teacher.teacher_level}</Badge>
            </div>
            <h1 className="mt-2 font-display text-[22px] font-semibold tracking-tight text-academy-navy">
              {profile?.full_name ?? td.notProvided}
            </h1>
            <p className="mt-0.5 text-[13.5px] text-academy-slate">{profile?.email ?? td.notProvided}</p>
            <p className="mt-1 text-[12.5px] text-academy-slate">
              {td.joined}: {new Date(teacher.created_at).toLocaleDateString("de-CH")}
            </p>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-5">
          <Section label={td.bio}>
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-academy-navy">
              {teacher.bio ?? td.notProvided}
            </p>
          </Section>

          <Section label={td.teachingStyle}>
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-academy-navy">
              {teacher.teaching_style ?? td.notProvided}
            </p>
          </Section>

          <Section label={td.payoutInfo}>
            <p className="whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-academy-navy">
              {teacher.payout_info_placeholder ?? (
                <span className="text-academy-slate">{td.noPayoutInfo}</span>
              )}
            </p>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Section label={td.subjects}>
            {subjects.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => (
                  <Badge key={s.id} variant="muted">{s.name}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-academy-slate">{td.notProvided}</p>
            )}
          </Section>

          <Section label={td.languages}>
            {(teacher.languages as string[] | null)?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {(teacher.languages as string[]).map((l) => (
                  <Badge key={l} variant="muted">{l}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-academy-slate">{td.notProvided}</p>
            )}
          </Section>

          <Section label={td.education}>
            <p className="text-[13.5px] text-academy-navy">{teacher.education ?? td.notProvided}</p>
          </Section>

          <Section label={td.experience}>
            <p className="text-[13.5px] text-academy-navy">{teacher.experience ?? td.notProvided}</p>
          </Section>

          <Section label={td.format}>
            <div className="flex flex-wrap gap-1.5">
              {teacher.offers_online && <Badge variant="muted">{td.online}</Badge>}
              {teacher.offers_in_person && <Badge variant="muted">{td.inPerson}</Badge>}
            </div>
            {teacher.offers_in_person && teacher.location && (
              <p className="mt-1.5 text-[13px] text-academy-slate">
                {td.location}: {teacher.location}
              </p>
            )}
          </Section>
        </div>
      </div>

      {/* Admin actions */}
      <div className="space-y-4">
        {!teacher.is_approved ? (
          <div className="rounded-lg border border-academy-line bg-white p-6">
            <form action={approveAction}>
              <input type="hidden" name="teacherId" value={teacher.id} />
              <Button type="submit" variant="primary">
                {td.approveAction}
              </Button>
            </form>
          </div>
        ) : (
          <p className="text-[13px] text-academy-slate">{td.alreadyApproved}</p>
        )}

        <div className="rounded-lg border border-academy-line bg-white p-6">
          <p className="mb-4 text-[13px] text-academy-slate">
            {teacher.is_active ? td.teacherActive : td.teacherInactive}
          </p>
          <form action={setActiveAction}>
            <input type="hidden" name="teacherId" value={teacher.id} />
            <input type="hidden" name="isActive" value={teacher.is_active ? "false" : "true"} />
            <Button type="submit" variant={teacher.is_active ? "secondary" : "primary"}>
              {teacher.is_active ? td.deactivateAction : td.activateAction}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-academy-line bg-white p-5">
      <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-academy-slate">{label}</p>
      {children}
    </div>
  );
}
