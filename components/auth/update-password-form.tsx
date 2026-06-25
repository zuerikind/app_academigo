"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type { AuthState } from "@/lib/actions/auth";

export function UpdatePasswordForm({
  action,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const { locale, dict } = useI18n();
  const t = dict.auth.updatePassword;
  const ta = dict.auth;
  const [state, formAction, pending] = useActionState(action, {});
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [mismatch, setMismatch] = useState(false);

  return (
    <form
      action={formAction}
      className="space-y-5"
      onSubmit={(e) => {
        if (pw !== cpw) {
          e.preventDefault();
          setMismatch(true);
        } else {
          setMismatch(false);
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      {state.error && (
        <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
          {state.error}
        </p>
      )}
      <Field>
        <Label htmlFor="password">{t.passwordLabel}</Label>
        <PasswordInput
          id="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={pw}
          onChange={(e) => { setPw(e.target.value); setMismatch(false); }}
        />
      </Field>
      <Field>
        <Label htmlFor="confirmPassword">{ta.confirmPassword}</Label>
        <PasswordInput
          id="confirmPassword"
          required
          minLength={8}
          autoComplete="new-password"
          value={cpw}
          onChange={(e) => { setCpw(e.target.value); setMismatch(false); }}
        />
        {mismatch && <p className="mt-1.5 text-[12px] text-[color:var(--academy-danger)]">{ta.passwordMismatch}</p>}
      </Field>
      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
