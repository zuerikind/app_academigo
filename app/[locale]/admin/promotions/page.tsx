import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminPromotions } from "@/lib/queries/admin";
import { PromotionRow } from "./_promotion-row";

type Props = { params: Promise<{ locale: string }> };

type PromotionRequestNormalized = {
  id: string;
  requested_level: "academigo_teacher" | "verified";
  status: "pending" | "approved" | "rejected";
  note: string | null;
  created_at: string;
  teachers: {
    id: string;
    teacher_level: "junior" | "academigo_teacher" | "verified";
    profiles: { full_name: string | null; email: string | null } | null;
  } | null;
};

export default async function AdminPromotionsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.promotions;

  const promotions = await getAdminPromotions();

  const labels = {
    review: t.review,
    approve: t.approve,
    reject: t.reject,
    notePlaceholder: t.notePlaceholder,
  };

  // Normalize Supabase join types: teachers and profiles come back as arrays
  // in the inferred type but are actually objects for single FK joins.
  const normalized: PromotionRequestNormalized[] = promotions.map((p) => {
    const teacherRaw = p.teachers;
    const teacher = Array.isArray(teacherRaw) ? teacherRaw[0] : teacherRaw;
    if (!teacher) {
      return {
        id: p.id,
        requested_level: p.requested_level as PromotionRequestNormalized["requested_level"],
        status: p.status as PromotionRequestNormalized["status"],
        note: p.note ?? null,
        created_at: p.created_at,
        teachers: null,
      };
    }
    const profileRaw = teacher.profiles;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    return {
      id: p.id,
      requested_level: p.requested_level as PromotionRequestNormalized["requested_level"],
      status: p.status as PromotionRequestNormalized["status"],
      note: p.note ?? null,
      created_at: p.created_at,
      teachers: {
        id: teacher.id,
        teacher_level: teacher.teacher_level as "junior" | "academigo_teacher" | "verified",
        profiles: profile
          ? { full_name: profile.full_name, email: profile.email }
          : null,
      },
    };
  });

  if (normalized.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.title} />
        <EmptyState icon="award" title={t.empty} description="" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} />
      <div className="overflow-hidden rounded-[14px] border border-academy-line bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-academy-line bg-academy-mist">
            <tr>
              {[
                t.colTeacher,
                t.colCurrentLevel,
                t.colRequestedLevel,
                t.colDate,
                t.colStatus,
                t.colActions,
              ].map((header) => (
                <th
                  key={header}
                  className="px-5 py-3 text-left text-[12px] font-medium uppercase tracking-wide text-academy-slate"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-academy-line">
            {normalized.map((request) => (
              <PromotionRow key={request.id} request={request} labels={labels} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
