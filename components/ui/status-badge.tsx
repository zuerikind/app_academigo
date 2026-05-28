"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types/database";

const statusVariants: Record<
  BookingStatus,
  "default" | "verified" | "muted" | "warning" | "accent" | "brand"
> = {
  pending: "warning",
  confirmed: "verified",
  rejected: "muted",
  cancelled: "muted",
  completed: "brand",
};

export function StatusBadge({ status }: { status: BookingStatus | string }) {
  const { dict } = useI18n();
  const key = status as BookingStatus;
  const label = dict.status[key as keyof typeof dict.status] ?? status;
  const variant = statusVariants[key as BookingStatus] ?? "muted";

  return (
    <Badge variant={variant} size="sm">
      {label}
    </Badge>
  );
}
