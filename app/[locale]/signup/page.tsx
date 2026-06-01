import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/auth-form";
import { signUp } from "@/lib/actions/auth";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string }>;
};

export default async function SignUpPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(raw);
  const { role } = await searchParams;
  const defaultRole = role === "teacher" ? "teacher" : "student";
  const t = dict.auth;

  return (
    <AuthShell
      locale={locale}
      dict={dict}
      title={t.createAccount}
      description={t.signUpSubtitle}
      switchHref={localizedPath(locale, "/login")}
      switchPrompt={t.hasAccount}
      switchCta={t.signIn}
      asideEyebrow={dict.home.portal.authAside.eyebrow}
      asideTitle={dict.home.portal.authAside.title}
      asideBody={dict.home.portal.authAside.body}
    >
      <SignUpForm action={signUp} defaultRole={defaultRole} />
    </AuthShell>
  );
}
