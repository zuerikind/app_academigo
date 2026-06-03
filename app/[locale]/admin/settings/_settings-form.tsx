"use client";

import { useActionState } from "react";
import { saveSettings } from "@/lib/actions/admin";
import type { AdminActionState } from "@/lib/actions/admin";
import type { Dictionary } from "@/messages/types";

type T = Dictionary["admin"]["settings"];

export function SettingsForm({
  currentSettings,
  t,
}: {
  currentSettings: Record<string, string>;
  t: T;
}) {
  const [state, action, isPending] = useActionState<AdminActionState, FormData>(
    saveSettings,
    {},
  );

  return (
    <form action={action} className="space-y-8">
      <Section title={t.tierSection}>
        <Field name="tier_junior_rate_chf" label={t.juniorRate} defaultValue={currentSettings.tier_junior_rate_chf ?? "30"} />
        <Field name="tier_mid_rate_chf" label={t.midRate} defaultValue={currentSettings.tier_mid_rate_chf ?? "45"} />
        <Field name="tier_top_rate_chf" label={t.topRate} defaultValue={currentSettings.tier_top_rate_chf ?? "60"} />
      </Section>

      <Section title={t.promotionSection}>
        <Field name="tier_junior_sessions_to_promote" label={t.juniorSessionsRequired} defaultValue={currentSettings.tier_junior_sessions_to_promote ?? "15"} />
        <Field name="tier_junior_rating_to_promote" label={t.juniorRatingRequired} defaultValue={currentSettings.tier_junior_rating_to_promote ?? "4.0"} step="0.1" />
        <Field name="tier_mid_sessions_to_promote" label={t.midSessionsRequired} defaultValue={currentSettings.tier_mid_sessions_to_promote ?? "30"} />
        <Field name="tier_mid_rating_to_promote" label={t.midRatingRequired} defaultValue={currentSettings.tier_mid_rating_to_promote ?? "4.5"} step="0.1" />
      </Section>

      {state.error && (
        <p className="text-[13px] text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="text-[13px] font-medium text-green-700">{t.saved}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center rounded-lg bg-[color:var(--brand)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? t.saving : t.save}
      </button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-academy-slate">{title}</h2>
      <div className="rounded-lg border border-academy-line bg-white p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  name, label, defaultValue, step,
}: {
  name: string; label: string; defaultValue: string; step?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <label htmlFor={name} className="w-64 text-[13.5px] font-medium text-academy-navy">{label}</label>
      <input
        id={name} name={name} type="number" step={step ?? "1"} min="0"
        defaultValue={defaultValue}
        className="w-28 rounded-md border border-academy-line px-3 py-1.5 text-[13px] text-academy-navy focus:border-[color:var(--brand)]/60 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
      />
    </div>
  );
}
