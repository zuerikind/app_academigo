import { notFound } from "next/navigation";
import { TeacherSettingsForm } from "@/components/teacher/settings-form";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getTeacherNav } from "@/config/navigation";
import { updateTeacherSettings } from "@/lib/actions/teacher";
import { requireRoleFromParams, getTeacherRecord } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = { params: Promise<{ locale: string }> };

function parsePayoutInfo(info: string | null) {
  if (!info) return { payoutName: "", payoutIban: "", payoutStreet: "", payoutZip: "", payoutCity: "", payoutTwint: "" };
  let payoutName = "", payoutIban = "", payoutStreet = "", payoutZip = "", payoutCity = "", payoutTwint = "";
  for (const line of info.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (line.startsWith("Name: ")) payoutName = line.slice(6);
    else if (line.startsWith("IBAN: ")) payoutIban = line.slice(6);
    else if (line.startsWith("Twint: ")) payoutTwint = line.slice(7);
    else {
      const commaIdx = line.lastIndexOf(", ");
      if (commaIdx !== -1) {
        payoutStreet = line.slice(0, commaIdx);
        const zipCity = line.slice(commaIdx + 2);
        const spaceIdx = zipCity.indexOf(" ");
        payoutZip = spaceIdx !== -1 ? zipCity.slice(0, spaceIdx) : zipCity;
        payoutCity = spaceIdx !== -1 ? zipCity.slice(spaceIdx + 1) : "";
      } else {
        payoutStreet = line;
      }
    }
  }
  return { payoutName, payoutIban, payoutStreet, payoutZip, payoutCity, payoutTwint };
}

export default async function TeacherSettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.teacher.settings;
  const profile = await requireRoleFromParams("teacher", raw);
  const teacher = await getTeacherRecord(profile.id);
  const payout = parsePayoutInfo(teacher?.payout_info_placeholder ?? null);

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
