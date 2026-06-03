"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { useState } from "react";
import { submitReview, type ReviewActionState } from "@/lib/actions/reviews";
import { useI18n } from "@/components/i18n/locale-provider";

interface ReviewFormProps {
  bookingId: string;
  hasReview: boolean;
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[color:var(--brand-deep)] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function ReviewForm({ bookingId, hasReview }: ReviewFormProps) {
  const { dict } = useI18n();
  const tr = dict.reviews;
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [state, action] = useActionState(submitReview, {} as ReviewActionState);

  if (hasReview || state.success) {
    return (
      <p className="text-sm text-academy-slate-muted">{tr.reviewSubmitted}</p>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      <div role="group" aria-label="Rating" className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
            className={(hovered || rating) >= n ? "text-yellow-500" : "text-academy-slate-muted"}
          >
            <Star size={22} fill={(hovered || rating) >= n ? "currentColor" : "none"} strokeWidth={1.6} />
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        placeholder={tr.commentPlaceholder}
        rows={3}
        className="w-full rounded-[10px] border border-academy-line bg-white px-3 py-2 text-sm text-academy-navy placeholder:text-academy-slate-muted focus:border-[color:var(--brand)]/60 focus:outline-none"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton label={tr.submitReview} pendingLabel={tr.submitting} />
    </form>
  );
}
