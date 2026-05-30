import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminStudents } from "@/lib/queries/admin";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminStudentsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.students;

  const students = await getAdminStudents();

  type StudentRow = (typeof students)[number];
  type CreditsRecord = { total_credits: number; used_credits: number; reserved_credits: number };

  const columns = [
    {
      key: "name",
      header: t.colName,
      render: (row: StudentRow) => {
        const p = row.profiles as { full_name: string | null; email: string | null }[] | null;
        return p?.[0]?.full_name ?? "—";
      },
    },
    {
      key: "email",
      header: t.colEmail,
      render: (row: StudentRow) => {
        const p = row.profiles as { full_name: string | null; email: string | null }[] | null;
        return p?.[0]?.email ?? "—";
      },
    },
    {
      key: "credits",
      header: t.colCredits,
      render: (row: StudentRow) => {
        const credits = row.student_credits;
        if (!credits) return "—";
        const sc: CreditsRecord | null = Array.isArray(credits)
          ? (credits[0] as CreditsRecord | undefined) ?? null
          : (credits as CreditsRecord);
        if (!sc) return "—";
        const available = sc.total_credits - sc.used_credits - sc.reserved_credits;
        return `${available} / ${sc.total_credits}`;
      },
    },
    {
      key: "joined",
      header: t.colJoined,
      render: (row: StudentRow) =>
        new Date(row.created_at).toLocaleDateString("de-CH"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} />
      <Table
        columns={columns}
        rows={students}
        emptyState={
          <EmptyState icon="users" title={t.empty} description="" />
        }
      />
    </div>
  );
}
