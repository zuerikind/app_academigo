import Link from "next/link";
import { Star } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";

export function TeacherQuickStatsBar({
  completedLessons,
  averageRating,
  reviewCount,
  completedLabel,
  ratingLabel,
  noRatingYet,
  reviewsCountLabel,
  bookingsHref,
  reviewsHref,
}: {
  completedLessons: number;
  averageRating: number;
  reviewCount: number;
  completedLabel: string;
  ratingLabel: string;
  noRatingYet: string;
  reviewsCountLabel: string;
  bookingsHref: string;
  reviewsHref: string;
}) {
  return (
    <div className="mb-6 flex overflow-hidden rounded-[14px] border border-academy-line bg-white">
      <Link
        href={bookingsHref}
        className="group flex flex-1 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-academy-mist/50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--academy-success-soft)] transition-transform group-hover:scale-105">
          <AppIcon
            name="checkCircle"
            className="h-4 w-4 text-[color:var(--academy-success)]"
            strokeWidth={1.8}
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-academy-slate-muted">
            {completedLabel}
          </p>
          <p className="mt-0.5 font-display text-[22px] font-semibold leading-none tracking-tight text-academy-navy text-numeric">
            {completedLessons}
          </p>
        </div>
      </Link>

      <div className="w-px self-stretch bg-academy-line" aria-hidden />

      <Link
        href={reviewsHref}
        className="group flex flex-1 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-academy-mist/50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-tint)] transition-transform group-hover:scale-105">
          <Star
            className="h-4 w-4 text-[color:var(--brand-deep)]"
            strokeWidth={1.8}
            fill={reviewCount > 0 ? "currentColor" : "none"}
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-academy-slate-muted">
            {ratingLabel}
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="font-display text-[22px] font-semibold leading-none tracking-tight text-academy-navy text-numeric">
              {reviewCount > 0 ? `${averageRating} ★` : noRatingYet}
            </p>
            {reviewCount > 0 && (
              <span className="text-[12px] font-medium text-[color:var(--brand-deep)] group-hover:underline">
                {reviewsCountLabel} →
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
