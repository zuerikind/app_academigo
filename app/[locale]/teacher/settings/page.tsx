import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getTeacherNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = { params: Promise<{ locale: string }> };

export default async function TeacherSettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const ts = dict.student.settings;
  const t = dict.teacher.settings;
  const profile = await requireRoleFromParams("teacher", raw);

  const rows = [
    { label: ts.name, value: profile.full_name ?? "—" },
    { label: ts.email, value: profile.email ?? "—" },
  ];

  return (
    <DashboardLayout
      navItems={getTeacherNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.teacher.settings}
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="max-w-xl overflow-hidden rounded-lg border border-academy-line bg-white">
        <dl>
          {rows.map((row, idx) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_2fr] items-baseline gap-6 px-5 py-4"
              style={{
                borderTop: idx === 0 ? "none" : "1px solid var(--academy-line)",
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
    </DashboardLayout>
  );
}
