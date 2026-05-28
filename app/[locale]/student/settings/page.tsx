import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getStudentNav } from "@/config/navigation";
import { requireRoleFromParams } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type Props = { params: Promise<{ locale: string }> };

export default async function StudentSettingsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const dict = getDictionary(raw);
  const t = dict.student.settings;
  const profile = await requireRoleFromParams("student", raw);

  const rows = [
    { label: t.name, value: profile.full_name ?? "—" },
    { label: t.email, value: profile.email ?? "—" },
    { label: t.role, value: profile.role },
  ];

  return (
    <DashboardLayout
      navItems={getStudentNav(dict, raw)}
      locale={raw}
      dict={dict}
      eyebrow={dict.nav.student.settings}
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
              <dd className="text-[14px] font-medium capitalize text-academy-navy">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </DashboardLayout>
  );
}
