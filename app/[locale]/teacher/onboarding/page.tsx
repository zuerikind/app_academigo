import { notFound } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { TeacherOnboardingForm } from "@/components/onboarding/teacher-onboarding-form";
import { completeTeacherOnboarding } from "@/lib/actions/onboarding";
import { getProfile } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getActiveSubjects } from "@/lib/queries/subjects";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherOnboardingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(raw);
  const t = dict.teacher.onboarding;
  const profile = await getProfile();
  const subjects = await getActiveSubjects();

  return (
    <OnboardingShell
      locale={locale}
      dict={dict}
      eyebrow={dict.auth.teacher}
      title={t.title}
      description={t.subtitle}
    >
      <TeacherOnboardingForm
        action={completeTeacherOnboarding}
        subjects={subjects}
        defaultName={profile?.full_name}
      />
    </OnboardingShell>
  );
}
