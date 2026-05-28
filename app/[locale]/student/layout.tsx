import { requireRoleFromParams } from "@/lib/auth/session";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRoleFromParams("student", locale);
  return children;
}
