import { notFound } from "next/navigation";
import { TeacherSettingsForm } from "@/components/teacher/settings-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getTeacherNav } from "@/config/navigation";
import { updateTeacherSettings } from "@/lib/actions/teacher";
import { requireRoleFromParams, getTeacherRecord } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { parsePayoutInfo } from "@/lib/payout-info";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherSettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.settings;
  const profile = await requireRoleFromParams("teacher", raw);
  const teacher = await getTeacherRecord(profile.id);
  const payout = parsePayoutInfo(teacher?.payout_info_placeholder);

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.settings}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="max-w-xl rounded-lg border border-academy-line bg-white p-6">
        <TeacherSettingsForm
          action={updateTeacherSettings}
          currentName={profile.full_name}
          currentEmail={profile.email}
          currentPayoutName={payout.payoutName}
          currentPayoutIban={payout.payoutIban}
          currentPayoutStreet={payout.payoutStreet}
          currentPayoutZip={payout.payoutZip}
          currentPayoutCity={payout.payoutCity}
          currentPayoutTwint={payout.payoutTwint}
          currentDefaultMeetLink={teacher?.default_meet_link ?? ""}
        />
      </div>
    </DashboardLayout>
  );
}
