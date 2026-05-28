"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/input";
import type { AuthState } from "@/lib/actions/auth";

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-[color:var(--academy-danger)]/25 bg-[color:var(--academy-danger-soft)] px-3.5 py-2.5 text-[13px] text-[color:var(--academy-danger)]">
      {children}
    </p>
  );
}

export function LoginForm({
  action,
  redirect,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  redirect?: string;
}) {
  const { locale, dict } = useI18n();
  const t = dict.auth;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      {redirect && <input type="hidden" name="redirect" value={redirect} />}
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
      <Field>
        <Label htmlFor="email">{t.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </Field>
      <Field>
        <Label htmlFor="password">{t.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>
      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? t.signingIn : t.signIn}
      </Button>
    </form>
  );
}

export function SignUpForm({
  action,
  defaultRole = "student",
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  defaultRole?: "student" | "teacher";
}) {
  const { locale, dict } = useI18n();
  const t = dict.auth;
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
      <Field>
        <Label htmlFor="role">{t.iAmA}</Label>
        <Select id="role" name="role" defaultValue={defaultRole}>
          <option value="student">{t.student}</option>
          <option value="teacher">{t.teacher}</option>
        </Select>
      </Field>
      <Field>
        <Label htmlFor="fullName">{t.fullName}</Label>
        <Input id="fullName" name="fullName" required />
      </Field>
      <Field>
        <Label htmlFor="email">{t.email}</Label>
        <Input id="email" name="email" type="email" required />
      </Field>
      <Field>
        <Label htmlFor="password">{t.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
        />
      </Field>
      <Button type="submit" variant="primary" fullWidth disabled={pending}>
        {pending ? t.creatingAccount : t.createAccount}
      </Button>
    </form>
  );
}
