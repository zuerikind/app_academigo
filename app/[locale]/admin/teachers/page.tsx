import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { approveTeacher, setTeacherActive } from "@/lib/actions/admin";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminTeachers } from "@/lib/queries/admin";
import { localizedPath } from "@/lib/i18n/path";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminTeachersPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.teachers;

  const teachers = await getAdminTeachers();

  const columns = [
    {
      key: "name",
      header: t.colName,
      render: (row: (typeof teachers)[number]) => {
        const p = row.profiles as unknown as { full_name: string | null; email: string | null } | null;
        return (
          <Link
            href={localizedPath(raw, `/admin/teachers/${row.id}`)}
            className="font-medium text-academy-navy hover:underline"
          >
            {p?.full_name ?? "—"}
          </Link>
        );
      },
    },
    {
      key: "email",
      header: t.colEmail,
      render: (row: (typeof teachers)[number]) => {
        const p = row.profiles as unknown as { full_name: string | null; email: string | null } | null;
        return p?.email ?? "—";
      },
    },
    {
      key: "level",
      header: t.colLevel,
      render: (row: (typeof teachers)[number]) => (
        <Badge variant="muted">{row.teacher_level}</Badge>
      ),
    },
    {
      key: "status",
      header: t.colStatus,
      render: (row: (typeof teachers)[number]) => (
        <div className="flex flex-wrap gap-1.5">
          {row.is_approved ? (
            <Badge variant="verified">{t.statusApproved}</Badge>
          ) : (
            <Badge variant="warning">{t.statusPending}</Badge>
          )}
          {row.is_active ? (
            <Badge variant="muted">{t.statusActive}</Badge>
          ) : (
            <Badge variant="warning">{t.statusInactive}</Badge>
          )}
        </div>
      ),
    },
    {
      key: "joined",
      header: t.colJoined,
      render: (row: (typeof teachers)[number]) =>
        new Date(row.created_at).toLocaleDateString("de-CH"),
    },
    {
      key: "actions",
      header: t.colActions,
      render: (row: (typeof teachers)[number]) => {
        const approveFormAction = async (formData: FormData) => {
          "use server";
          await approveTeacher({}, formData);
        };
        const setActiveFormAction = async (formData: FormData) => {
          "use server";
          await setTeacherActive({}, formData);
        };

        return (
          <div className="flex flex-wrap gap-2">
            {!row.is_approved && (
              <form action={approveFormAction}>
                <input type="hidden" name="teacherId" value={row.id} />
                <Button type="submit" variant="secondary" size="sm">
                  {t.approve}
                </Button>
              </form>
            )}
            <form action={setActiveFormAction}>
              <input type="hidden" name="teacherId" value={row.id} />
              <input type="hidden" name="isActive" value={row.is_active ? "false" : "true"} />
              <Button type="submit" variant="secondary" size="sm">
                {row.is_active ? t.deactivate : t.activate}
              </Button>
            </form>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} />
      <Table
        columns={columns}
        rows={teachers}
        emptyState={
          <EmptyState icon="users" title={t.empty} description="" />
        }
      />
    </div>
  );
}
