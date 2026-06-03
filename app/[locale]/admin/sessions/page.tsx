import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getAdminSessions } from "@/lib/queries/admin";

type Props = { params: Promise<{ locale: string }> };

const RATING_DISPLAY: Record<string, { emoji: string; label: string }> = {
  excellent:   { emoji: "🌟", label: "Excellent" },
  good:        { emoji: "👍", label: "Good" },
  challenging: { emoji: "😕", label: "Challenging" },
  no_show:     { emoji: "❌", label: "No-show" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[13px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? "text-yellow-500" : "text-academy-slate-muted"}>
          ★
        </span>
      ))}
      <span className="ml-1 text-[12px] text-academy-slate">{rating}/5</span>
    </span>
  );
}

export default async function AdminSessionsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();

  const dict = getDictionary(raw);
  const t = dict.admin.sessions;
  const dateLocale = raw === "de" ? "de-CH" : "en-CH";

  const sessions = await getAdminSessions();

  if (sessions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t.title} description={t.subtitle} />
        <EmptyState icon="star" title={t.empty} description="" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t.title} description={t.subtitle} />

      <div className="space-y-4">
        {sessions.map((session) => {
          const student = session.students as unknown as
            | { profiles: { full_name: string | null } | null }
            | null;
          const teacher = session.teachers as unknown as
            | { profiles: { full_name: string | null } | null }
            | null;
          const reviewsRaw = session.reviews as unknown as
            | { rating: number; comment: string | null }[]
            | { rating: number; comment: string | null }
            | null;
          const review = Array.isArray(reviewsRaw)
            ? reviewsRaw[0] ?? null
            : reviewsRaw ?? null;

          const studentName = student?.profiles?.full_name ?? "—";
          const teacherName = teacher?.profiles?.full_name ?? "—";

          const dateLabel = new Date(session.start_time).toLocaleDateString(
            dateLocale,
            { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
          );
          const startTime = new Date(session.start_time).toLocaleTimeString(
            dateLocale,
            { hour: "2-digit", minute: "2-digit", timeZone: "UTC" },
          );
          const endTime = new Date(session.end_time).toLocaleTimeString(
            dateLocale,
            { hour: "2-digit", minute: "2-digit", timeZone: "UTC" },
          );

          const ratingDisplay = session.session_rating
            ? RATING_DISPLAY[session.session_rating]
            : null;

          return (
            <div
              key={session.id}
              className="rounded-[14px] border border-academy-line bg-white p-5 shadow-sm"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-academy-navy">
                    {dateLabel} · {startTime}–{endTime}
                  </p>
                  <p className="mt-0.5 text-[12px] text-academy-slate">
                    {studentName}
                    <span className="mx-1.5 text-academy-slate-muted">→</span>
                    {teacherName}
                  </p>
                </div>
                {ratingDisplay ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-academy-line bg-academy-mist px-3 py-1 text-[12px] font-medium text-academy-navy">
                    <span>{ratingDisplay.emoji}</span>
                    <span>{ratingDisplay.label}</span>
                  </span>
                ) : (
                  <span className="text-[12px] text-academy-slate-muted">{t.noRating}</span>
                )}
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-academy-line" />

              {/* Two-column: teacher notes + student review */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-academy-slate">
                    {t.colTeacherNotes}
                  </p>
                  {session.teacher_private_notes ? (
                    <p className="text-[13px] leading-relaxed text-academy-navy">
                      {session.teacher_private_notes}
                    </p>
                  ) : (
                    <p className="text-[12px] text-academy-slate-muted">{t.noNotes}</p>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-academy-slate">
                    {t.colStudentReview}
                  </p>
                  {review ? (
                    <div className="space-y-1">
                      <Stars rating={review.rating} />
                      {review.comment && (
                        <p className="text-[13px] leading-relaxed text-academy-navy">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[12px] text-academy-slate-muted">{t.noReview}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
