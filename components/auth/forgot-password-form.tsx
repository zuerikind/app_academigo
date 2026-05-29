"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { localizedPath } from "@/lib/i18n/path";
import type { AuthState } from "@/lib/actions/auth";

// Track whether the form has been submitted at least once by comparing
// state reference vs the initial object. We check for a submitted flag via
// a hidden input instead — simpler: we check if state !== initial placeholder.
// Strategy: initial state = { error: undefined, _submitted: false }
// After submit, state = {} (success) or { error: string } (validation error)
// We detect success as: submitted=true and no error.

const INITIAL_STATE: AuthState & { _submitted?: boolean } = {};

export function ForgotPasswordForm({
  action,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const { locale, dict } = useI18n();
  const t = dict.auth.forgotPassword;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  // Success: state is {} (no error key at all) and the action has been called
  // We detect this by checking if state has no error AND is not the initial ref
  const isSuccess = state !== INITIAL_STATE && !state.error;

  if (isSuccess) {
    return (
      <div className="space-y-5 text-center">
        <div className="space-y-2">
          <p className="font-semibold text-[color:var(--academy-navy)]">
            {t.successTitle}
          </p>
          <p className="text-sm text-[color:var(--academy-slate)]">
            {t.successMessage}
          </p>
        </div>
        <Link
          href={localizedPath(locale, "/login")}
          className="inline-block text-sm text-[color:var(--brand-deep)] hover:underline"
        >
          {t.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}
      <Field>
        <Label htmlFor="email">{dict.auth.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </Field>
      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? t.submitting : t.submit}
      </Button>
      <div className="text-center">
        <Link
          href={localizedPath(locale, "/login")}
          className="text-sm text-[color:var(--brand-deep)] hover:underline"
        >
          {t.backToLogin}
        </Link>
      </div>
    </form>
  );
}
