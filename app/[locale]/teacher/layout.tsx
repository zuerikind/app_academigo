import { requireRoleFromParams } from "@/lib/auth/session";

export default async function TeacherLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireRoleFromParams("teacher", locale);
  return children;
}
