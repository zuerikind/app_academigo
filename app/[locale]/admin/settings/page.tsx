import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getPlatformSettings } from "@/lib/queries/admin";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm } from "./_settings-form";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminSettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.settings;
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} description={t.subtitle} />
      <SettingsForm currentSettings={settings} t={t} />
    </div>
  );
}
