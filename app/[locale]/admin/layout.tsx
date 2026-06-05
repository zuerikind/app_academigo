import { requireRoleFromParams } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { isLocale } from "@/lib/i18n/config";
import { getAdminNav } from "@/config/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { noIndexMetadata } from "@/lib/seo/metadata";

export const metadata = noIndexMetadata;

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRoleFromParams("admin", locale);

  const safeLocale = isLocale(locale) ? locale : "de";
  const dict = getDictionary(safeLocale);
  const navItems = getAdminNav(dict, safeLocale);

  return (
    <DashboardLayout
      navItems={navItems}
      locale={safeLocale}
      dict={dict}
      title={dict.admin.dashboard.title}
      subtitle={dict.admin.dashboard.subtitle}
    >
      {children}
    </DashboardLayout>
  );
}
