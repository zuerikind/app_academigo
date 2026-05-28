"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Monitor } from "lucide-react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { translateSubjectName } from "@/lib/i18n/subjects";
import type { TeacherListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TeacherCard({
  teacher,
  profileHref,
  className,
}: {
  teacher: TeacherListItem;
  profileHref: string;
  className?: string;
}) {
  const { dict } = useI18n();
  const t = dict.common;

  const initials = teacher.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={profileHref}
      className={cn(
        "group relative flex h-full flex-col rounded-[14px] border border-academy-line bg-white p-5",
        "transition-[border-color,box-shadow,transform] duration-200",
        "hover:border-[color:var(--brand)]/30 hover:shadow-card",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] border border-academy-line bg-[color:var(--brand-tint)]">
          {teacher.avatarUrl ? (
            <Image
              src={teacher.avatarUrl}
              alt={teacher.fullName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-[13px] font-semibold text-[color:var(--brand-deep)]">
              {initials}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-[15px] font-semibold tracking-[-0.018em] text-academy-navy">
              {teacher.fullName}
            </h3>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-academy-slate-muted transition-colors group-hover:text-[color:var(--brand-deep)]"
              strokeWidth={1.6}
            />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {teacher.isVerified && (
              <Badge variant="verified" size="sm">
                {t.verified}
              </Badge>
            )}
            <span className="text-[11px] text-academy-slate-muted">
              {t.placeholderRating}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {teacher.subjects.slice(0, 4).map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center rounded-[6px] border border-academy-line bg-white px-1.5 py-0.5 text-[11px] font-medium text-academy-slate"
          >
            {translateSubjectName(dict, s.slug, s.name)}
          </span>
        ))}
      </div>

      {teacher.bio && (
        <p className="mt-4 line-clamp-2 text-[13.5px] leading-relaxed text-academy-slate">
          {teacher.bio}
        </p>
      )}

      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-academy-line pt-4 text-[12px] text-academy-slate">
          {teacher.offersOnline && (
            <span className="inline-flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5" strokeWidth={1.6} /> {t.online}
            </span>
          )}
          {teacher.offersInPerson && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.6} /> {t.inPerson}
            </span>
          )}
          <span className="ml-auto font-medium text-[color:var(--brand-deep)]">
            {t.viewProfile}
          </span>
        </div>
      </div>
    </Link>
  );
}
