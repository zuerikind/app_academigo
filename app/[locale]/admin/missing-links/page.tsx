import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table } from "@/components/ui/table";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getMissingMeetLinks } from "@/lib/queries/admin";

type Props = { params: Promise<{ locale: string }> };

export default async function AdminMissingLinksPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.missingLinks;

  const bookings = await getMissingMeetLinks();

  type BookingRow = (typeof bookings)[number] & { id: string };

  const rows = bookings.map((b) => {
    const teacher = b.teachers as unknown as
      | { id: string; profiles: { full_name: string | null } | null }
      | null;
    const student = b.students as unknown as
      | { profiles: { full_name: string | null } | null }
      | null;
    const teacherName = teacher?.profiles?.full_name ?? "—";
    const studentName = student?.profiles?.full_name ?? "—";
    const hoursUntil = Math.round(
      (new Date(b.start_time).getTime() - Date.now()) / 3_600_000,
    );
    return {
      id: b.id,
      dateTime: new Date(b.start_time).toLocaleDateString("de-CH", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      teacher: teacherName,
      student: studentName,
      hoursUntil: `${hoursUntil}h`,
    };
  });

  type Row = (typeof rows)[number];

  const columns = [
    {
      key: "dateTime",
      header: t.colDate,
      render: (row: Row) => row.dateTime,
    },
    {
      key: "teacher",
      header: t.colTeacher,
      render: (row: Row) => row.teacher,
    },
    {
      key: "student",
      header: t.colStudent,
      render: (row: Row) => row.student,
    },
    {
      key: "hoursUntil",
      header: "Time Until",
      render: (row: Row) => row.hoursUntil,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} description={t.subtitle} />
      <Table
        columns={columns}
        rows={rows}
        emptyState={
          <EmptyState
            icon="alertTriangle"
            title={t.noMissingLinks}
            description=""
          />
        }
      />
    </div>
  );
}
