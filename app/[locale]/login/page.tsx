import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-form";
import { signIn } from "@/lib/actions/auth";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizedPath } from "@/lib/i18n/path";
import { noIndexMetadata } from "@/lib/seo/metadata";

export const metadata = noIndexMetadata;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const dict = getDictionary(raw);
  const { redirect } = await searchParams;
  const t = dict.auth;

  return (
    <AuthShell
      locale={locale}
      dict={dict}
      title={t.welcomeBack}
      description={t.signInSubtitle}
      switchHref={localizedPath(locale, "/signup")}
      switchPrompt={t.noAccount}
      switchCta={dict.common.signUp}
      asideEyebrow={dict.home.portal.authAside.eyebrow}
      asideTitle={dict.home.portal.authAside.title}
      asideBody={dict.home.portal.authAside.body}
    >
      <LoginForm action={signIn} redirect={redirect} />
    </AuthShell>
  );
}
