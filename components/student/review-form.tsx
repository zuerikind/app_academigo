"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Star } from "lucide-react";
import { submitReview, type ReviewActionState } from "@/lib/actions/reviews";

interface ReviewFormProps {
  bookingId: string;
  hasReview: boolean;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[color:var(--brand-deep)] px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Submitting…" : label}
    </button>
  );
}

export function ReviewForm({ bookingId, hasReview }: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  const [state, action] = useActionState(submitReview, {} as ReviewActionState);

  if (hasReview || state.success) {
    return (
      <p className="text-sm text-academy-slate-muted">
        Review submitted. Thank you!
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded-[10px] border border-academy-line bg-white px-4 text-sm font-medium text-academy-navy transition-colors hover:border-[color:var(--brand)]/40 hover:bg-academy-mist"
      >
        Leave a review
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      <div
        role="group"
        aria-label="Rating"
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
            className={
              n <= rating ? "text-yellow-500" : "text-academy-slate-muted"
            }
          >
            <Star
              size={20}
              fill={n <= rating ? "currentColor" : "none"}
              strokeWidth={1.6}
            />
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        placeholder="Optional comment…"
        rows={3}
        className="w-full rounded-[10px] border border-academy-line bg-white px-3 py-2 text-sm text-academy-navy placeholder:text-academy-slate-muted focus:border-[color:var(--brand)]/60 focus:outline-none"
      />
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton label="Submit review" />
    </form>
  );
}
