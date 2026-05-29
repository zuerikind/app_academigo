import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { requestPasswordReset } from "@/lib/actions/auth";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ForgotPasswordPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(raw);
  const t = dict.auth.forgotPassword;

  return (
    <AuthShell
      locale={locale}
      dict={dict}
      title={t.title}
      description={t.subtitle}
      switchHref={localizedPath(locale, "/login")}
      switchPrompt=""
      switchCta={t.backToLogin}
      asideEyebrow={dict.home.approach.eyebrow}
      asideTitle={dict.home.approach.title}
      asideBody={dict.home.approach.body}
    >
      <ForgotPasswordForm action={requestPasswordReset} />
    </AuthShell>
  );
}
