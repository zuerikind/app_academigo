import { notFound } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { StudentOnboardingForm } from "@/components/onboarding/student-onboarding-form";
import { completeStudentOnboarding } from "@/lib/actions/onboarding";
import { getProfile } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getSubjects } from "@/lib/queries/subjects";

type Props = { params: Promise<{ locale: string }> };

export default async function StudentOnboardingPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(raw);
  const t = dict.student.onboarding;
  const profile = await getProfile();
  const subjects = await getSubjects();

  return (
    <OnboardingShell
      locale={locale}
      dict={dict}
      eyebrow={dict.auth.student}
      title={t.title}
      description={t.subtitle}
    >
      <StudentOnboardingForm
        action={completeStudentOnboarding}
        subjects={subjects}
        defaultName={profile?.full_name}
      />
    </OnboardingShell>
  );
}
