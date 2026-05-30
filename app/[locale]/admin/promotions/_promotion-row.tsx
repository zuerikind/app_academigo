"use client";

import { useState, useActionState } from "react";
import { approvePromotion, rejectPromotion } from "@/lib/actions/admin";
import type { AdminActionState } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PromotionRequest = {
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

type Labels = {
  review: string;
  approve: string;
  reject: string;
  notePlaceholder: string;
};

export function PromotionRow({
  request,
  labels,
}: {
  request: PromotionRequest;
  labels: Labels;
}) {
  const [expanded, setExpanded] = useState(false);
  const [approveState, approveAction] = useActionState<AdminActionState, FormData>(
    approvePromotion,
    {},
  );
  const [rejectState, rejectAction] = useActionState<AdminActionState, FormData>(
    rejectPromotion,
    {},
  );

  const isPending = request.status === "pending";

  return (
    <>
      <tr className="transition-colors hover:bg-academy-mist/40">
        <td className="px-5 py-3.5 text-[13.5px] text-academy-navy">
          {request.teachers?.profiles?.full_name ?? "—"}
        </td>
        <td className="px-5 py-3.5 text-[13.5px] text-academy-navy">
          <Badge variant="muted">{request.teachers?.teacher_level ?? "—"}</Badge>
        </td>
        <td className="px-5 py-3.5 text-[13.5px] text-academy-navy">
          <Badge variant="muted">{request.requested_level}</Badge>
        </td>
        <td className="px-5 py-3.5 text-[13.5px] text-academy-navy">
          {new Date(request.created_at).toLocaleDateString("de-CH")}
        </td>
        <td className="px-5 py-3.5 text-[13.5px] text-academy-navy">
          <Badge
            variant={
              request.status === "approved"
                ? "verified"
                : request.status === "rejected"
                  ? "muted"
                  : "warning"
            }
          >
            {request.status}
          </Badge>
        </td>
        <td className="px-5 py-3.5">
          {isPending && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {labels.review}
            </Button>
          )}
        </td>
      </tr>
      {expanded && isPending && (
        <tr>
          <td
            colSpan={6}
            className="border-t border-academy-line bg-academy-mist/60 px-5 py-4"
          >
            <div className="flex flex-col gap-3">
              {approveState.error && (
                <p className="text-sm text-red-600">{approveState.error}</p>
              )}
              {rejectState.error && (
                <p className="text-sm text-red-600">{rejectState.error}</p>
              )}
              <form action={approveAction} className="flex items-start gap-3">
                <input type="hidden" name="requestId" value={request.id} />
                <textarea
                  name="note"
                  placeholder={labels.notePlaceholder}
                  rows={2}
                  className="flex-1 rounded-lg border border-academy-line bg-white px-3 py-2 text-sm text-academy-navy placeholder:text-academy-slate focus:outline-none focus:ring-2 focus:ring-academy-sky"
                />
                <Button type="submit" variant="primary" size="sm">
                  {labels.approve}
                </Button>
              </form>
              <form action={rejectAction} className="flex items-start gap-3">
                <input type="hidden" name="requestId" value={request.id} />
                <textarea
                  name="note"
                  placeholder={labels.notePlaceholder}
                  rows={2}
                  className="flex-1 rounded-lg border border-academy-line bg-white px-3 py-2 text-sm text-academy-navy placeholder:text-academy-slate focus:outline-none focus:ring-2 focus:ring-academy-sky"
                />
                <Button type="submit" variant="secondary" size="sm">
                  {labels.reject}
                </Button>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
